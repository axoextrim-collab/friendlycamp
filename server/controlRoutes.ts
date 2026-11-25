import {asyncFilter} from './asyncCollections';

import type express from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { createUser, listAccountUsers, requireAdmin, requirePermission, requireUser } from './auth';
import { registerSchema } from './schemas';
import { CONTROL_RESOURCES, ROLE_PERMISSIONS, canManage, type ControlResource } from '../src/types/control';
import { assignedRole, assignStaffRole, controlAudit, controlDb, controlRecords, managedTours, publishedTours, publishedContent, saveControlRecord } from './controlStore';
import { commentSubmission, controlSchemas, recordEnvelope } from './controlSchemas';
import { readAdminDatabase, updateAdminRecord } from './adminStore';
import { bookingDb } from './database';
const fail = (status: number, message: string): never => { throw Object.assign(new Error(message), { status }); };
export function registerControlRoutes(app: express.Express) {
    const run = (handler: (req: express.Request, res: express.Response) => unknown) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.setHeader('Cache-Control', 'no-store');
        try {
            await handler(req, res);
        }
        catch (error) {
            if (error instanceof Error && error.message === 'ACCOUNT_EXISTS')
                res.status(409).json({ error: 'ACCOUNT_EXISTS', message: 'حساب با این ایمیل یا شماره همراه وجود دارد.' });
            else if (error instanceof Error && 'status' in error)
                res.status(Number(error.status)).json({ error: 'CONTROL_ERROR', message: error.message });
            else
                next(error);
        }
    };
    app.get('/api/site/content', run(async (_req, res) => res.json(await publishedContent())));
    app.get('/api/manage/session', requireUser, run((req, res) => {
        if (!ROLE_PERMISSIONS[req.user!.role]?.length)
            return fail(403, 'حساب شما دسترسی مدیریت ندارد.');
        res.json({ user: req.user, permissions: ROLE_PERMISSIONS[req.user!.role] });
    }));
    app.get('/api/manage/records/:resource', requireUser, run(async (req, res) => {
        const resource = resourceName(req.params.resource);
        if (!canManage(req.user!.role, resource) && !(resource === 'leaders' && req.user!.role === 'reservations'))
            return fail(403, 'دسترسی به این بخش مجاز نیست.');
        res.json({ records: resource === 'tours' ? await managedTours() : await controlRecords(resource) });
    }));
    const save = (creating: boolean) => run(async (req, res) => {
        const resource = resourceName(req.params.resource);
        const user = req.user!;
        if (!canManage(user.role, resource))
            return fail(403, 'اجازه تغییر این بخش را ندارید.');
        const envelope = recordEnvelope.parse(req.body);
        const parsed = controlSchemas[resource].parse(envelope.values) as Record<string, any>;
        const all = resource === 'tours' ? await managedTours() : await controlRecords(resource);
        const id = creating ? crypto.randomUUID() : req.params.id;
        const old = all.find(item => item.id === id);
        if (!creating && !old)
            return fail(404, 'رکورد پیدا نشد.');
        if (creating && ['homeText', 'comments', 'contact', 'policies'].includes(resource))
            return fail(400, 'این بخش رکورد تازه را از فرم عمومی دریافت می‌کند.');
        if (user.role === 'editor' && ['published', 'archived'].includes(parsed.status))
            return fail(403, 'انتشار و برداشتن محتوای منتشرشده با مدیر است.');
        if (resource === 'tours' && parsed.travel?.leaderId && !(await controlRecords('leaders')).some(item => item.id === parsed.travel.leaderId))
            return fail(400, 'لیدر انتخاب‌شده پیدا نشد.');
        if (resource === 'articles' && !(await controlRecords('authors')).some(author => author.id === parsed.authorId && author.status === 'active'))
            return fail(400, 'یک نویسنده فعال انتخاب کن.');
        const values = { ...old, ...parsed };
        delete values.revision;
        delete values.updatedAt;
        if (resource === 'comments') {
            if (parsed.status === 'published' && !old?.consent)
                return fail(400, 'رضایت انتشار این نظر ثبت نشده است.');
            values.moderatedBy = user.id;
            values.moderatedAt = new Date().toISOString();
        }
        if (resource === 'homeText' && user.role === 'editor')
            values.status = 'review';
        const record = await saveControlRecord(resource, id, values, envelope.expectedRevision, user.email, all);
        res.status(creating ? 201 : 200).json({ record });
    });
    app.post('/api/manage/records/:resource', requireUser, save(true));
    app.patch('/api/manage/records/:resource/:id', requireUser, save(false));
    app.delete('/api/manage/records/:resource/:id', requireAdmin, run(async (req, res) => {
        const resource = resourceName(req.params.resource);
        if (['contact', 'homeText', 'policies'].includes(resource))
            return fail(400, 'برای این بخش، محتوا را ویرایش کن.');
        const { expectedRevision } = z.object({ expectedRevision: z.string() }).strict().parse(req.body);
        const records = resource === 'tours' ? await managedTours() : await controlRecords(resource);
        if (!records.some(item => item.id === req.params.id))
            return fail(404, 'رکورد پیدا نشد.');
        await saveControlRecord(resource, req.params.id, {}, expectedRevision, req.user!.email, records, true);
        res.status(204).end();
    }));
    app.get('/api/manage/messages', requirePermission('messages'), run(async (_req, res) => res.json({ records: (await readAdminDatabase()).tickets })));
    app.patch('/api/manage/messages/:id', requirePermission('messages'), run(async (req, res) => {
        const input = z.object({ status: z.enum(['open', 'pending', 'closed']), owner: z.string().max(100), responseNote: z.string().max(4000) }).strict().parse(req.body);
        const before = (await readAdminDatabase()).tickets.find(item => item.id === req.params.id);
        if (!before)
            return fail(404, 'درخواست پیدا نشد.');
        const record = await updateAdminRecord('tickets', req.params.id, input, req.user!.email);
        await controlAudit(req.user!.email, 'messages', req.params.id, 'update', before, record);
        res.json({ record });
    }));
    app.get('/api/manage/staff', requireAdmin, run(async (_req, res) => res.json({ users: await listAccountUsers() })));
    app.post('/api/manage/staff', requireAdmin, run(async (req, res) => {
        const input = registerSchema.extend({ role: z.enum(['admin', 'editor', 'support', 'reservations']) }).strict().parse(req.body);
        const user = await createUser(input);
        await assignStaffRole(user.id, input.role, req.user!.email, 'user', async () => {
            if ((await assignedRole(req.user!.id) || req.user!.role) !== 'admin')
                return fail(403, 'دسترسی مدیریتی شما تغییر کرده است.');
        });
        res.status(201).json({ user: { ...user, role: input.role } });
    }));
    app.patch('/api/manage/staff/:id', requireAdmin, run(async (req, res) => {
        const { role } = z.object({ role: z.enum(['user', 'admin', 'editor', 'support', 'reservations']) }).strict().parse(req.body);
        const users = await listAccountUsers();
        const user = users.find(item => item.id === req.params.id);
        if (!user)
            return fail(404, 'حساب پیدا نشد.');
        if (req.user!.id === user.id && role !== 'admin')
            return fail(409, 'نقش حساب مدیریتی خودت را تغییر نده.');
        if (user.role === 'admin' && role !== 'admin' && users.filter(item => item.role === 'admin').length <= 1)
            return fail(409, 'حداقل یک مدیر باید باقی بماند.');
        await assignStaffRole(user.id, role, req.user!.email, user.role, async () => {
            const actorRole = await assignedRole(req.user!.id) || req.user!.role;
            if (actorRole !== 'admin')
                return fail(403, 'دسترسی مدیریتی شما تغییر کرده است.');
            const currentRole = await assignedRole(user.id) || user.role;
            const admins = (await asyncFilter(users, async (item) => (await assignedRole(item.id) || item.role) === 'admin')).length;
            if (currentRole === 'admin' && role !== 'admin' && admins <= 1)
                return fail(409, 'حداقل یک مدیر باید باقی بماند.');
        });
        res.json({ user: { ...user, role } });
    }));
    app.get('/api/manage/audit', requireAdmin, run(async (_req, res) => { const control = (await (await controlDb()).prepare('SELECT * FROM control_audit ORDER BY id DESC LIMIT 300').all()).map(item => ({ ...item, before: item.before_value ? JSON.parse(String(item.before_value)) : null, after: item.after_value ? JSON.parse(String(item.after_value)) : null })); const booking = (await bookingDb().prepare('SELECT * FROM booking_audit ORDER BY id DESC LIMIT 200').all()).map(item => ({ ...item, at: new Date(Number(item.at)).toISOString(), resource: 'reservations', record_id: item.reference })); const previous = (await readAdminDatabase()).audit.slice(0, 200).map(item => ({ ...item, at: item.updatedAt, record_id: item.recordId })); res.json({ records: [...control, ...booking, ...previous].sort((a: any, b: any) => String(b.at).localeCompare(String(a.at))).slice(0, 400) }); }));
    app.get('/api/comments', run(async (req, res) => { const type = z.enum(['tour', 'article']).parse(req.query.type); const id = z.string().min(1).max(100).parse(req.query.id); const records = (await controlRecords('comments')).filter(item => item.targetType === type && item.targetId === id && item.status === 'published' && item.consent).map(item => ({ id: item.id, authorName: item.authorName, body: item.body, createdAt: item.createdAt })); res.json({ records }); }));
    app.post('/api/comments', requireUser, run(async (req, res) => {
        const input = commentSubmission.parse(req.body);
        const exists = input.targetType === 'tour' ? (await publishedTours()).some(tour => tour.id === input.targetId) : (await publishedContent()).articles.some(article => article.id === input.targetId);
        if (!exists)
            return fail(404, 'محتوا برای ثبت نظر در دسترس نیست.');
        const count = await (await controlDb()).prepare("SELECT count(*) AS n FROM control_records WHERE resource='comments' AND json_extract(payload,'$.authorId')=? AND updated_at>?").get(req.user!.id, new Date(Date.now() - 3600000).toISOString());
        if (Number(count?.n) >= 5)
            return fail(429, 'حداکثر پنج نظر در ساعت ثبت کن.');
        const record = await saveControlRecord('comments', crypto.randomUUID(), { ...input, status: 'pending', moderationNote: '', authorId: req.user!.id, authorName: req.user!.fullName, createdAt: new Date().toISOString() }, null, req.user!.email);
        res.status(201).json({ id: record.id, message: 'نظر برای بررسی پشتیبانی ثبت شد؛ پس از تأیید منتشر می‌شود.' });
    }));
}
function resourceName(value: string): ControlResource {
    if (!(CONTROL_RESOURCES as readonly string[]).includes(value))
        return fail(404, 'بخش مدیریت پیدا نشد.');
    return value as ControlResource;
}
