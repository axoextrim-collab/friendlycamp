import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { newsletterSubscriptionSchema } from '../server/newsletter';
import { NEWSLETTER_CONSENT_VERSION } from '../src/types/newsletter';
import { subscribeNewsletter } from '../src/api/newsletter';

const input = (email = 'camper@example.test') => ({ email, consent: true, consentVersion: NEWSLETTER_CONSENT_VERSION });
test('newsletter requires a valid email, current consent and an explicit acceptance', () => {
  assert.equal(newsletterSubscriptionSchema.parse(input('  Camper@Example.TEST ')).email, 'camper@example.test');
  for (const payload of [input('invalid'), { ...input(), consent: false }, { email: 'camper@example.test' }, { ...input(), consentVersion: 'old' }, { ...input(), status: 'subscribed' }, input('x'.repeat(255) + '@example.test')]) assert.equal(newsletterSubscriptionSchema.safeParse(payload).success, false);
});
async function isolatedServer(run: (context: { directory: string; base: string }) => Promise<void>) {
  const directory = await mkdtemp(path.join(tmpdir(), 'friendly-newsletter-test-')); const project = process.cwd();
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const address = probe.address(); assert.ok(address && typeof address !== 'string'); const port = address.port; await new Promise<void>(resolve => probe.close(() => resolve()));
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(project, 'server.ts')], { cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), NODE_ENV: 'production', SESSION_SECRET: 'isolated-newsletter-test-secret-of-sufficient-length', ADMIN_BOOTSTRAP_EMAIL: 'admin@newsletter.test', ADMIN_BOOTSTRAP_PASSWORD: 'NewsletterAdminPass1234', ADMIN_BOOTSTRAP_PHONE: '09120000000', ADMIN_BOOTSTRAP_NAME: 'مدیر آزمایشی خبرنامه' } });
  child.stdout.resume(); child.stderr.resume(); const base = `http://127.0.0.1:${port}`;
  try { let ready = false; for (let attempt = 0; attempt < 200; attempt++) { if (child.exitCode !== null) throw new Error('Isolated newsletter server stopped before readiness'); try { if ((await fetch(base + '/api/health')).status === 200) { ready = true; break; } } catch { /* Wait for startup. */ } await new Promise(resolve => setTimeout(resolve, 100)); } assert.ok(ready); await run({ directory, base }); }
  finally { child.kill(); if (child.exitCode === null) await once(child, 'exit'); await rm(directory, { recursive: true, force: true }); }
}
test('newsletter HTTP registration persists consent, deduplicates concurrent retries and protects subscriber management', { timeout: 120000 }, async () => isolatedServer(async ({ directory, base }) => {
  const post = (payload: unknown) => fetch(base + '/api/newsletter/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const file = path.join(directory, 'data', 'newsletter.json');
  for (const payload of [input('invalid'), { ...input(), consent: false }, { ...input(), consentVersion: 'old' }, { ...input(), status: 'subscribed' }]) assert.equal((await post(payload)).status, 400);
  await assert.rejects(readFile(file, 'utf8'), { code: 'ENOENT' });
  assert.equal((await fetch(base + '/api/newsletter/subscriptions?email=ignored@example.test')).status, 405);
  const created = await post(input(' Camper@Example.TEST ')); assert.equal(created.status, 201); assert.equal(created.headers.get('cache-control'), 'no-store'); const result = await created.json(); assert.equal(result.status, 'subscribed'); assert.ok(result.message); assert.equal('email' in result, false);
  const original = await readFile(file, 'utf8'); const saved = JSON.parse(original).subscribers[0]; assert.equal(saved.email, 'camper@example.test'); assert.equal(saved.consent.version, NEWSLETTER_CONSENT_VERSION); assert.equal(saved.consent.source, 'footer-newsletter'); assert.ok(saved.consent.acceptedAt);
  for (const privateUrl of ['/data/newsletter.json', '/%64ata/newsletter.json', '/DATA/newsletter.json', '/@fs/' + file.replace(/\\/g, '/')]) { const blocked = await fetch(base + privateUrl); assert.equal(blocked.status, 404); assert.ok(!(await blocked.text()).includes(saved.email)); }
  const retries = await Promise.all([post(input('CAMPER@example.test')), post(input('camper@example.test ')), post(input())]);
  for (const response of retries) { assert.equal(response.status, 200); assert.equal((await response.json()).status, 'already_subscribed'); }
  assert.equal(await readFile(file, 'utf8'), original);
  for (const endpoint of ['/api/admin/newsletter/subscribers', '/api/admin/newsletter/export.csv']) assert.equal((await fetch(base + endpoint)).status, 401);
  assert.equal((await fetch(base + `/api/admin/newsletter/subscribers/${saved.id}/unsubscribe`, { method: 'POST' })).status, 401);
  const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: 'admin@newsletter.test', password: 'NewsletterAdminPass1234' }) }); assert.equal(login.status, 200); const cookie = login.headers.get('set-cookie')!.split(';')[0];
  const admin = (endpoint: string, method = 'GET') => fetch(base + endpoint, { method, headers: { Cookie: cookie } });
  const snapshot = await (await admin('/api/admin/newsletter/subscribers')).json(); assert.equal(snapshot.total, 1); assert.equal(snapshot.active, 1); assert.equal(snapshot.subscribers[0].email, saved.email);
  assert.equal((await admin(`/api/admin/newsletter/subscribers/${saved.id}/unsubscribe`, 'POST')).status, 200);
  assert.equal((await admin(`/api/admin/newsletter/subscribers/${saved.id}/unsubscribe`, 'POST')).status, 200);
  const inactiveCsv = await (await admin('/api/admin/newsletter/export.csv')).text(); assert.ok(!inactiveCsv.includes(saved.email));
  assert.equal((await post(input())).status, 201); const reactivated = JSON.parse(await readFile(file, 'utf8')).subscribers; assert.equal(reactivated.length, 1); assert.equal(reactivated[0].id, saved.id); assert.equal(reactivated[0].createdAt, saved.createdAt); assert.equal(reactivated[0].status, 'subscribed');
  assert.equal((await post(input('+camper@example.test'))).status, 201);
  const exported = await admin('/api/admin/newsletter/export.csv'); assert.equal(exported.status, 200); assert.ok(exported.headers.get('content-type')?.includes('text/csv')); assert.ok(exported.headers.get('content-disposition')?.includes('attachment')); assert.equal(exported.headers.get('cache-control'), 'no-store'); const csv = await exported.text(); assert.ok(csv.includes('camper@example.test')); assert.ok(csv.includes('"\'+camper@example.test"'));
  const limited = await post(input('limited@example.test')); assert.equal(limited.status, 429); assert.ok((await limited.json()).message);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).subscribers.length, 2);
}));
test('newsletter storage failures never report success or overwrite damaged data, and the queue recovers', { timeout: 120000 }, async () => isolatedServer(async ({ directory, base }) => {
  const file = path.join(directory, 'data', 'newsletter.json'); await writeFile(file, '{broken');
  const post = () => fetch(base + '/api/newsletter/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input()) });
  const failed = await post(); assert.equal(failed.status, 500); assert.equal((await failed.json()).error, 'INTERNAL_ERROR'); assert.equal(await readFile(file, 'utf8'), '{broken');
  await writeFile(file, JSON.stringify({ version: 1, subscribers: [] })); assert.equal((await post()).status, 201); assert.equal(JSON.parse(await readFile(file, 'utf8')).subscribers.length, 1);
}));
test('newsletter client sends JSON by POST and only accepts real server success responses', async context => {
  let submitted: RequestInit | undefined;
  const mocked = context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => { submitted = options; return new Response(JSON.stringify({ status: 'subscribed', message: 'ثبت واقعی' }), { status: 201 }); });
  const controller = new AbortController(); const signal = controller.signal;
  assert.equal((await subscribeNewsletter('camper@example.test', true, signal)).message, 'ثبت واقعی'); assert.equal(submitted?.method, 'POST'); assert.equal(submitted?.signal?.aborted, false); assert.deepEqual(JSON.parse(submitted?.body as string), input());
  controller.abort(); assert.equal(submitted?.signal?.aborted, true, 'the request deadline must preserve caller cancellation');
  mocked.mock.mockImplementation(async () => new Response(JSON.stringify({ message: 'خطای واقعی سرور' }), { status: 503 })); await assert.rejects(subscribeNewsletter('camper@example.test', true, signal), /خطای واقعی سرور/);
  mocked.mock.mockImplementation(async () => new Response('{}', { status: 200 })); await assert.rejects(subscribeNewsletter('camper@example.test', true, signal), /پاسخ معتبر/);
});
