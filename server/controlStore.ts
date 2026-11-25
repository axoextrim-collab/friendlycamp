import { dataFile } from './runtimePaths';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { bookingDb, bookingTransaction } from './database';
import { readAdminDatabase } from './adminStore';
import { POPULAR_DESTINATIONS } from '../src/data/mockData';
import { HOME_COPY } from '../src/data/homeCopy';
import { ARTICLES } from '../src/data/articles';
import { POLICY_DEFAULTS } from '../src/data/policies';
import type { ControlRecord, ControlResource, AccountRole, PublicSiteContent } from '../src/types/control';
// Snapshot the existing destination descriptions before public hydration changes the shared arrays.
const destinationDefaults = structuredClone(POPULAR_DESTINATIONS);
let initialized: ReturnType<typeof bookingDb> | undefined;
export async function controlDb() {
    const db = bookingDb();
    if (initialized === db)
        return db;
    await db.exec(`CREATE TABLE IF NOT EXISTS control_records(resource TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,revision TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(resource,id));
    CREATE TABLE IF NOT EXISTS staff_roles(user_id TEXT PRIMARY KEY,role TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS control_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor TEXT NOT NULL,resource TEXT NOT NULL,record_id TEXT NOT NULL,action TEXT NOT NULL,before_value TEXT,after_value TEXT);`);
    initialized = db;
    return db;
}
export async function assignedRole(userId: string): Promise<AccountRole | undefined> {
    if (process.env.DATABASE_BACKEND !== 'postgres' && !process.env.DATABASE_URL && !fs.existsSync(dataFile('bookings.sqlite')))
        return undefined;
    return (await (await controlDb()).prepare('SELECT role FROM staff_roles WHERE user_id=?').get(userId))?.role as AccountRole | undefined;
}
export async function controlAudit(actor: string, resource: string, id: string, action: string, before?: unknown, after?: unknown) {
    await (await controlDb()).prepare('INSERT INTO control_audit(at,actor,resource,record_id,action,before_value,after_value) VALUES(?,?,?,?,?,?,?)').run(new Date().toISOString(), actor, resource, id, action, before === undefined ? null : JSON.stringify(before), after === undefined ? null : JSON.stringify(after));
}
function defaults(resource: ControlResource, tours: Record<string, unknown>[] = []): Record<string, any>[] {
    if (resource === 'tours')
        return tours;
    if (resource === 'destinations')
        return destinationDefaults.map(item => ({ ...item, status: 'published', weatherEnabled: false }));
    if (resource === 'homeText')
        return HOME_COPY.map(item => ({ ...item, value: item.source }));
    if (resource === 'policies')
        return POLICY_DEFAULTS;
    if (resource === 'contact')
        return [{ id: 'main', title: 'راه‌های ارتباط با فرندلی کمپ', phone: '09215014474', email: '', address: '', hours: '' }];
    return [];
}
export async function controlRecords(resource: ControlResource, tours: Record<string, unknown>[] = []): Promise<ControlRecord[]> {
    const records = new Map(defaults(resource, tours).map(item => [String(item.id), { ...item, revision: 'base', updatedAt: String(item.updatedAt || '') } as ControlRecord]));
    for (const row of await (await controlDb()).prepare('SELECT * FROM control_records WHERE resource=?').all(resource)) {
        const data = JSON.parse(String(row.payload));
        records.set(String(row.id), { ...data, id: String(row.id), revision: String(row.revision), updatedAt: String(row.updated_at) });
    }
    return [...records.values()].filter(item => !item.deleted);
}
export async function managedTours() { return await controlRecords('tours', (await readAdminDatabase()).tours); }
export async function saveControlRecord(resource: ControlResource, id: string, values: Record<string, unknown>, expectedRevision: string | null, actor: string, fallback: ControlRecord[] = [], deleting = false) {
    await controlDb();
    return await bookingTransaction(async () => {
        const old = (await controlRecords(resource, resource === 'tours' ? fallback : [])).find(item => item.id === id);
        const tombstone = await (await controlDb()).prepare('SELECT revision FROM control_records WHERE resource=? AND id=?').get(resource, id);
        if ((old?.revision || (tombstone ? String(tombstone.revision) : null)) !== expectedRevision)
            throw Object.assign(new Error('این رکورد تغییر کرده است؛ فهرست را تازه کن و دوباره ویرایش کن.'), { status: 409 });
        const unique = resource === 'articles' ? 'slug' : resource === 'coupons' ? 'code' : resource === 'tours' ? 'code' : resource === 'policies' ? 'kind' : undefined;
        if (unique && (await controlRecords(resource, resource === 'tours' ? fallback : [])).some(item => item.id !== id && item[unique] === values[unique]))
            throw Object.assign(new Error('این شناسه قبلاً ثبت شده است.'), { status: 409 });
        const clean = { ...values };
        delete clean.publishedVersion;
        const publicationResources = ['articles', 'destinations', 'tours', 'licenses', 'homeText', 'policies', 'leaders'];
        const prior = old?.publishedVersion || (old?.status === 'published' || resource === 'homeText' && !old?.status ? old : undefined);
        const revision = crypto.randomUUID(), updatedAt = new Date().toISOString();
        const publishedVersion = publicationResources.includes(resource) ? values.status === 'published' ? { ...clean, id, revision, updatedAt } : values.status === 'archived' ? undefined : prior : undefined;
        const record = { ...clean, ...(publishedVersion ? { publishedVersion } : {}), id, revision, updatedAt, ...(deleting ? { deleted: true } : {}) };
        await (await controlDb()).prepare('INSERT INTO control_records(resource,id,payload,revision,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(resource,id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at').run(resource, id, JSON.stringify(record), record.revision, record.updatedAt);
        await controlAudit(actor, resource, id, deleting ? 'delete' : old ? 'update' : 'create', old, record);
        return record;
    });
}
export async function publishedRecords(resource: ControlResource, fallback: Record<string, unknown>[] = []) {
    return (await controlRecords(resource, fallback)).flatMap(item => item.status === 'published' || resource === 'homeText' && !item.status ? [item] : item.publishedVersion ? [{ ...item.publishedVersion, id: item.id } as ControlRecord] : []);
}
export async function publishedTours() { return await publishedRecords('tours', (await readAdminDatabase()).tours); }
export async function assignStaffRole(userId: string, role: AccountRole, actor: string, before: AccountRole, guard?: () => void) { await controlDb(); return await bookingTransaction(async () => { await guard?.(); const current = await assignedRole(userId) || before; await (await controlDb()).prepare('INSERT INTO staff_roles(user_id,role) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role').run(userId, role); await controlAudit(actor, 'staff', userId, 'role.change', { role: current }, { role }); }); }
import { LEADERS } from '../src/data/leaders';
export async function publishedContent(): Promise<PublicSiteContent> {
    const authors = await controlRecords('authors');
    const articles = (await publishedRecords('articles')).filter(item => Date.parse(item.publishedAt) <= Date.now()).flatMap(item => { const author = authors.find(author => author.id === item.authorId && author.status === 'active'); return author ? [{ ...item, author: author.name, sections: item.sections.map((part: any, index: number) => ({ id: `part-${index + 1}`, title: part.title, paragraphs: part.body.split(/\n\s*\n/).filter(Boolean) })) }] : []; });
    const destinations = (await publishedRecords('destinations')).map(item => { const valid = item.weatherEnabled && Date.parse(item.observedAt) <= Date.now() && Date.parse(item.expiresAt) > Date.now(); const { weatherSource, temperature, condition, observedAt, expiresAt, ...rest } = item; return { ...rest, weather: valid ? { source: weatherSource, temperature, condition, observedAt, expiresAt } : null }; });
    const text = Object.fromEntries((await publishedRecords('homeText')).map(item => [item.source, item.value]));
    const contact: Record<string, any> = (await controlRecords('contact'))[0] || {};
    const social = (await controlRecords('social')).filter(item => item.enabled);
    const licenses = (await publishedRecords('licenses')).filter(item => !item.expiresAt || Date.parse(item.expiresAt) > Date.now());
    // Both the browser and page metadata use these same published catalog entries.
    POPULAR_DESTINATIONS.splice(0, POPULAR_DESTINATIONS.length, ...destinations as any[]);
    ARTICLES.splice(0, ARTICLES.length, ...articles as any[]);
    const policies = (await publishedRecords('policies')).filter(item => item.effectiveAt && Date.parse(item.effectiveAt) <= Date.now());
    const leaders = (await publishedRecords('leaders')).map(item => ({ id: item.id, name: item.name, bio: item.bio, qualifications: item.qualifications, image: item.image, languages: item.languages, credentials: item.credentials, updatedAt: item.updatedAt }));
    LEADERS.splice(0, LEADERS.length, ...leaders);
    return { destinations, articles, text, leaders, contact: { phone: contact.phone || '', email: contact.email || '', address: contact.address || '', hours: contact.hours || '' }, social, licenses, policies };
}
