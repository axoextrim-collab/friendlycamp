import {asyncMap} from './asyncCollections';

import crypto from 'node:crypto';
import { z } from 'zod';
import type express from 'express';
import rateLimit from 'express-rate-limit';
import { normalizePhone } from '../src/utils/authForm';
import { controlAudit, controlDb } from './controlStore';
import { bookingTransaction } from './database';
import { requirePermission, requireUser } from './auth';
const note = z.string().trim().min(3).max(5000);
const createSchema = z.object({ fullName: z.string().trim().min(3).max(100), phone: z.string().transform(normalizePhone).pipe(z.string().regex(/^09\d{9}$/)), email: z.union([z.literal(''), z.email()]), kind: z.enum(['complaint', 'booking', 'refund', 'general', 'privacy']), subject: z.string().trim().min(3).max(180), body: note, bookingReference: z.string().max(100), consent: z.literal(true), requestKey: z.uuid() }).strict();
const accessSchema = z.object({ reference: z.string().regex(/^FCS-[A-F0-9]{16}$/), token: z.string().min(40).max(100) }).strict();
let initialized: Awaited<ReturnType<typeof controlDb>> | undefined;
async function db() {
    const database = await controlDb();
    if (database !== initialized) {
        await database.exec(`CREATE TABLE IF NOT EXISTS support_cases(reference TEXT PRIMARY KEY,request_key TEXT UNIQUE NOT NULL,request_hash TEXT NOT NULL,owner_id TEXT,status TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS support_messages(id TEXT PRIMARY KEY,reference TEXT NOT NULL REFERENCES support_cases(reference),request_key TEXT UNIQUE NOT NULL,sender TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS support_owner ON support_cases(owner_id);`);
        initialized = database;
    }
    return database;
}
function fail(status: number, message: string): never { throw Object.assign(new Error(message), { status }); }
function token(row: any) {
    const secret = process.env.SESSION_SECRET;
    if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32))
        return fail(503, 'تنظیمات امنیت پیگیری کامل نیست.');
    return crypto.createHmac('sha256', secret || 'friendly-support-development-secret').update(`${row.reference}:${row.request_key}`).digest('base64url');
}
async function privateCase(input: z.infer<typeof accessSchema>) {
    const row = await (await db()).prepare('SELECT * FROM support_cases WHERE reference=?').get(input.reference);
    if (!row)
        return fail(404, 'پرونده با این مشخصات پیدا نشد.');
    const a = Buffer.from(token(row)), b = Buffer.from(input.token);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
        return fail(404, 'پرونده با این مشخصات پیدا نشد.');
    return row;
}
async function view(row: any, staff = false) { const data = JSON.parse(row.payload); return { reference: row.reference, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at, subject: data.subject, kind: data.kind, bookingReference: data.bookingReference, fullName: data.fullName, ...(staff ? { phone: data.phone, email: data.email } : {}), messages: await (await db()).prepare('SELECT id,sender,body,created_at AS createdAt FROM support_messages WHERE reference=? ORDER BY created_at,rowid').all(row.reference) }; }
export function registerSupportRoutes(app: express.Express) {
    const limit = rateLimit({ windowMs: 15 * 60000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
    const run = (handler: (req: express.Request, res: express.Response) => unknown) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.set('Cache-Control', 'no-store');
        try {
            await handler(req, res);
        }
        catch (error) {
            if (error instanceof Error && 'status' in error)
                res.status(Number(error.status)).json({ message: error.message });
            else
                next(error);
        }
    };
    app.post('/api/support/cases', limit, run(async (req, res) => {
        const input = createSchema.parse(req.body);
        await db();
        const result = await bookingTransaction(async () => {
            const hash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
            const old = await (await db()).prepare('SELECT * FROM support_cases WHERE request_key=?').get(input.requestKey);
            if (old) {
                if (old.request_hash !== hash || String(old.owner_id || '') !== String(req.user?.id || ''))
                    return fail(409, 'این درخواست قبلاً با مشخصات دیگری ثبت شده است.');
                return old;
            }
            const reference = `FCS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
            const at = new Date().toISOString();
            const { requestKey, body, ...data } = input;
            const row = { reference, request_key: requestKey, owner_id: req.user?.id || null };
            token(row);
            await (await db()).prepare('INSERT INTO support_cases VALUES(?,?,?,?,?,?,?,?)').run(reference, requestKey, hash, row.owner_id, 'open', JSON.stringify({ ...data, consentAt: at }), at, at);
            await (await db()).prepare('INSERT INTO support_messages VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(), reference, requestKey, 'customer', body, at);
            await controlAudit(req.user?.email || 'public-support', 'support', reference, 'case.create');
            return (await (await db()).prepare('SELECT * FROM support_cases WHERE reference=?').get(reference))!;
        });
        res.status(201).json({ case: await view(result), token: token(result) });
    }));
    app.post('/api/support/track', limit, run(async (req, res) => res.json({ case: await view(await privateCase(accessSchema.parse(req.body))) })));
    app.post('/api/support/reply', limit, run(async (req, res) => {
        const input = accessSchema.extend({ body: note, requestKey: z.uuid() }).strict().parse(req.body);
        const row = await privateCase({ reference: input.reference, token: input.token });
        await bookingTransaction(async () => {
            const old = await (await db()).prepare('SELECT reference,body FROM support_messages WHERE request_key=?').get(input.requestKey);
            if (old) {
                if (old.reference !== row.reference || old.body !== input.body)
                    return fail(409, 'درخواست پاسخ تکراری متفاوت است.');
                return;
            }
            const at = new Date().toISOString();
            await (await db()).prepare('INSERT INTO support_messages VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(), row.reference, input.requestKey, 'customer', input.body, at);
            await (await db()).prepare("UPDATE support_cases SET status='open',updated_at=? WHERE reference=?").run(at, row.reference);
            await controlAudit('case-holder', 'support', String(row.reference), 'customer.reply');
        });
        res.json({ case: await view(await (await db()).prepare('SELECT * FROM support_cases WHERE reference=?').get(row.reference)) });
    }));
    app.get('/api/account/support', requireUser, run(async (req, res) => res.json({ cases: await asyncMap((await (await db()).prepare('SELECT * FROM support_cases WHERE owner_id=? ORDER BY created_at DESC LIMIT 100').all(req.user!.id)), async (row) => ({ case: await view(row), token: token(row) })) })));
    app.get('/api/manage/support', requirePermission('messages'), run(async (_req, res) => res.json({ records: await asyncMap((await (await db()).prepare('SELECT * FROM support_cases ORDER BY updated_at DESC LIMIT 200').all()), async (row) => await view(row, true)) })));
    app.post('/api/manage/support/:reference', requirePermission('messages'), run(async (req, res) => {
        const input = z.object({ body: z.string().trim().max(5000), status: z.enum(['open', 'waiting', 'replied', 'closed']), requestKey: z.uuid() }).strict().parse(req.body);
        const row = await (await db()).prepare('SELECT * FROM support_cases WHERE reference=?').get(req.params.reference);
        if (!row)
            return fail(404, 'پرونده پیدا نشد.');
        await bookingTransaction(async () => {
            const previous = await (await db()).prepare('SELECT reference,body FROM support_messages WHERE request_key=?').get(input.requestKey);
            if (previous) {
                if (previous.reference !== row.reference || previous.body !== input.body)
                    return fail(409, 'پاسخ تکراری متفاوت است.');
                return;
            }
            const at = new Date().toISOString();
            if (input.body)
                await (await db()).prepare('INSERT INTO support_messages VALUES(?,?,?,?,?,?)').run(crypto.randomUUID(), row.reference, input.requestKey, 'staff', input.body, at);
            await (await db()).prepare('UPDATE support_cases SET status=?,updated_at=? WHERE reference=?').run(input.status, at, row.reference);
            await controlAudit(req.user!.email, 'support', String(row.reference), 'staff.reply', { status: row.status }, { status: input.status, body: input.body });
        });
        res.json({ case: await view(await (await db()).prepare('SELECT * FROM support_cases WHERE reference=?').get(row.reference), true) });
    }));
}
