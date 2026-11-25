import { databaseBackend, readDocument, writeDocument, documentMutation } from './database';
import { dataFile } from './runtimePaths';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';
import { NEWSLETTER_CONSENT_VERSION, type NewsletterSubscriber } from '../src/types/newsletter';
export const newsletterSubscriptionSchema = z.object({
    email: z.string().trim().toLowerCase().max(254).email(),
    consent: z.literal(true),
    consentVersion: z.literal(NEWSLETTER_CONSENT_VERSION),
}).strict();
const file = dataFile('newsletter.json');
interface NewsletterDatabase {
    version: 1;
    subscribers: NewsletterSubscriber[];
}
let mutations: Promise<unknown> = Promise.resolve();
const storedSubscriber = z.object({ id: z.string().uuid(), email: z.string().email(), status: z.enum(['subscribed', 'unsubscribed']), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), consent: z.object({ version: z.string(), acceptedAt: z.string().datetime(), source: z.literal('footer-newsletter') }) });
async function read(): Promise<NewsletterDatabase> {
    try {
        return z.object({ version: z.literal(1), subscribers: z.array(storedSubscriber) }).parse((databaseBackend() === 'postgres' ? await readDocument('newsletter') || { version: 1, subscribers: [] } : JSON.parse(await fs.readFile(file, 'utf8'))));
    }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT')
            return { version: 1, subscribers: [] };
        throw new Error('NEWSLETTER_STORAGE_UNAVAILABLE');
    }
}
async function write(database: NewsletterDatabase) {
    if (databaseBackend() === 'postgres')
        return await writeDocument('newsletter', database);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.${crypto.randomUUID()}.tmp`;
    try {
        await fs.writeFile(temporary, JSON.stringify(database, null, 2), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
        await fs.rename(temporary, file);
    }
    finally {
        await fs.rm(temporary, { force: true }).catch(() => undefined);
    }
}
async function mutate<T>(operation: () => Promise<T>): Promise<Promise<T>> { const next = mutations.then(async () => await documentMutation(operation)); mutations = next.catch(() => undefined); return next; }
export async function subscribeToNewsletter(input: z.infer<typeof newsletterSubscriptionSchema>) {
    return await mutate(async () => {
        const database = await read();
        const existing = database.subscribers.find(subscriber => subscriber.email === input.email);
        if (existing?.status === 'subscribed')
            return { status: 'already_subscribed' as const };
        const now = new Date().toISOString();
        const consent: NewsletterSubscriber['consent'] = { version: NEWSLETTER_CONSENT_VERSION, acceptedAt: now, source: 'footer-newsletter' };
        if (existing) {
            existing.status = 'subscribed';
            existing.consent = consent;
            existing.updatedAt = now;
        }
        else
            database.subscribers.push({ id: crypto.randomUUID(), email: input.email, status: 'subscribed', createdAt: now, updatedAt: now, consent });
        await write(database);
        return { status: 'subscribed' as const };
    });
}
export async function newsletterSnapshot() { const { subscribers } = await read(); return { subscribers: subscribers.slice(-100).reverse(), total: subscribers.length, active: subscribers.filter(subscriber => subscriber.status === 'subscribed').length, limit: 100 }; }
export async function unsubscribeNewsletter(id: string) {
    return await mutate(async () => {
        const database = await read();
        const subscriber = database.subscribers.find(subscriber => subscriber.id === id);
        if (!subscriber)
            return null;
        if (subscriber.status !== 'unsubscribed') {
            subscriber.status = 'unsubscribed';
            subscriber.updatedAt = new Date().toISOString();
            await write(database);
        }
        return { id: subscriber.id, status: subscriber.status };
    });
}
export async function newsletterCsv() {
    const { subscribers } = await read();
    const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" + value : value).replace(/"/g, '""')}"`;
    return '\uFEFF' + [['email', 'joined_at', 'consent_at', 'consent_version'], ...subscribers.filter(subscriber => subscriber.status === 'subscribed').map(subscriber => [subscriber.email, subscriber.createdAt, subscriber.consent.acceptedAt, subscriber.consent.version])].map(row => row.map(cell).join(',')).join('\r\n');
}
