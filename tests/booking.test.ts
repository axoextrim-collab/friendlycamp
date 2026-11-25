import { seedTestAdmin } from './fixtures/seedAdmin';
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { validNationalCode } from '../src/utils/bookingForm';
import { verifyExternalPayment } from '../server/bookingProviders';

function nationalCode(index: number) { const base = String(123456700 + index); const sum = base.split('').reduce((sum, digit, i) => sum + Number(digit) * (10 - i), 0) % 11; return base + (sum < 2 ? sum : 11 - sum); }
test('national codes validate their checksum, Persian digits and reject repeated or malformed values', () => { assert.ok(validNationalCode(nationalCode(1))); assert.ok(validNationalCode(nationalCode(1).replace(/\d/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]))); assert.equal(validNationalCode('1111111111'), false); assert.equal(validNationalCode('123'), false); });
test('generic payment verification rejects amount mismatches instead of trusting provider status', async context => { const previousUrl = process.env.PAYMENT_HTTP_URL; const previousToken = process.env.PAYMENT_API_TOKEN; process.env.PAYMENT_HTTP_URL = 'https://provider.example.test'; process.env.PAYMENT_API_TOKEN = 'fixture-only'; let body: any; context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => { body = JSON.parse(String(options.body)); return new Response(JSON.stringify({ status: 'paid', amount: 1, currency: 'IRR', transactionId: 'test-provider' })); }); try { await assert.rejects(verifyExternalPayment('authority', 'payment-id', 100000), /مطابقت/); assert.equal(body.amount, 1000000); assert.equal(body.currency, 'IRR'); assert.equal(body.idempotencyKey, 'payment-id'); } finally { if (previousUrl === undefined) delete process.env.PAYMENT_HTTP_URL; else process.env.PAYMENT_HTTP_URL = previousUrl; if (previousToken === undefined) delete process.env.PAYMENT_API_TOKEN; else process.env.PAYMENT_API_TOKEN = previousToken; } });
test('booking lifecycle is atomic across workers: pricing, passengers, gateway return, receipt, failure, expiry, cancellation and refunds', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'friendly-booking-test-')); await seedTestAdmin(directory); const project = process.cwd(); const children: ReturnType<typeof spawn>[] = [];
  async function server(mode = 'sandbox') { const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const address = probe.address(); assert.ok(address && typeof address !== 'string'); const port = address.port; await new Promise<void>(resolve => probe.close(() => resolve()));
    const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(project, 'server.ts')], { cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), NODE_ENV: 'production', BOOKING_PAYMENT_MODE: mode, SESSION_SECRET: 'isolated-booking-test-secret-of-sufficient-length', ADMIN_BOOTSTRAP_EMAIL: 'admin@booking.test', ADMIN_BOOTSTRAP_PASSWORD: 'BookingAdminPass1234', ADMIN_BOOTSTRAP_PHONE: '09120000000', ADMIN_BOOTSTRAP_NAME: 'مدیر آزمایشی', SMS_HTTP_URL: '', SMS_API_TOKEN: '' } }); children.push(child); child.stdout!.resume(); child.stderr!.resume(); const base = `http://127.0.0.1:${port}`;
    let ready = false; for (let i = 0; i < 200; i++) { if (child.exitCode !== null) throw new Error('Isolated booking server exited'); try { if ((await fetch(base + '/api/health')).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 100)); } assert.ok(ready);
    let cookie = ''; const request = async (url: string, body?: unknown, admin = false) => { const response = await fetch(base + url, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(admin ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); if (url === '/api/auth/login') cookie = response.headers.get('set-cookie')!.split(';')[0]; return { status: response.status, data: await response.json() }; };
    return { base, child, request };
  }
  try {
    const a = await server(); const login = { identifier: 'admin@booking.test', password: 'BookingAdminPass1234' }; assert.equal((await a.request('/api/auth/login', login)).status, 200);
    const tour = (await a.request('/api/admin/dashboard', undefined, true)).data.resources.tours.find((tour: any) => tour.status === 'published');
    const config = { tourId: tour.id, startsAt: new Date(Date.now() + 10 * 86400000).toISOString(), capacity: 3, externalSold: 0, price: 1_000_000, active: true, origins: [{ id: 'tehran', title: 'تهران', price: 100000 }], tents: [{ id: 'tent2', title: 'چادر دو نفره', price: 200000, capacity: 2 }], extras: [{ id: 'bag', title: 'کیسه خواب', price: 50000, maxQuantity: 3 }], groupDiscount: { minimum: 2, percent: 10 }, cancellation: { enabled: true, cutoffHours: 24, feePercent: 10 } };
    assert.equal((await a.request('/api/admin/booking/departures', config)).status, 401);
    let saved = (await a.request('/api/admin/booking/departures', config, true)).data.departure; assert.ok(saved.id);
    const b = await server();
    const selection = (guests = 2) => ({ departureId: saved.id, guests, originId: 'tehran', tentId: 'tent2', extras: [{ id: 'bag', quantity: 2 }] });
    const getQuote = async (guests = 2) => (await a.request('/api/bookings/quote', selection(guests))).data.quote;
    const quote = await getQuote(); assert.equal(quote.base, 2000000); assert.equal(quote.discount, 200000); assert.equal(quote.tentUnits, 1); assert.equal(quote.origin, 200000); assert.equal(quote.extras, 100000); assert.equal(quote.total, 2300000);
    const input = async (guests = 2) => ({ selection: selection(guests), quoteRevision: (await getQuote(guests)).revision, passengers: Array.from({ length: guests }, (_, index) => ({ fullName: 'مسافر آزمایشی ' + index, nationalCode: nationalCode(index) })), contact: { fullName: 'مسئول رزرو آزمایشی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: '' }, consent: true, requestKey: crypto.randomUUID() });
    const initial = await input(); assert.equal((await a.request('/api/bookings/reservations', { ...initial, total: 1 })).status, 400); assert.equal((await a.request('/api/bookings/reservations', { ...initial, passengers: initial.passengers.slice(0, 1) })).status, 400);
    saved = (await a.request('/api/admin/booking/departures', { ...saved, price: 1200000, remaining: undefined }, true)).data.departure; assert.ok(saved.revision);
    assert.equal((await a.request('/api/bookings/reservations', initial)).status, 409);
    saved = (await a.request('/api/admin/booking/departures', { ...saved, price: 1000000, remaining: undefined }, true)).data.departure;
    const request = await input(); const held = await a.request('/api/bookings/reservations', request); assert.equal(held.status, 201); const access = { reference: held.data.booking.reference, token: held.data.token };
    assert.equal((await b.request('/api/bookings/reservations', request)).data.booking.reference, access.reference);
    assert.equal((await a.request('/api/bookings/reservations', { ...request, contact: { ...request.contact, fullName: 'نام متفاوت' } })).status, 409);
    assert.equal((await a.request('/api/bookings/track', { ...access, token: 'x'.repeat(43) })).status, 404);
    const started = await a.request('/api/bookings/payment/start', access); assert.equal(started.status, 200); const payment = { ...access, paymentId: started.data.paymentId };
    assert.equal((await b.request('/api/bookings/payment/start', access)).data.paymentId, payment.paymentId);
    const paid = await a.request('/api/bookings/sandbox/complete', { ...payment, result: 'paid' }); assert.equal(paid.status, 200);
    assert.equal((await fetch(a.base + `/api/bookings/payment-return/${payment.paymentId}?state=wrong`, { redirect: 'manual' })).status, 403);
    const returned = await fetch(a.base + paid.data.callbackUrl, { redirect: 'manual' }); assert.equal(returned.status, 303); const returnedAccess = Object.fromEntries(new URLSearchParams(new URL(returned.headers.get('location')!, a.base).hash.slice(1))); assert.equal(returnedAccess.reference, access.reference);
    const callbacks = await Promise.all([a.request('/api/bookings/payment/verify', payment), b.request('/api/bookings/payment/verify', payment)]); assert.ok(callbacks.some(result => result.data.booking.state === 'paid'));
    const receipt = (await a.request('/api/bookings/track', access)).data.booking; assert.equal(receipt.state, 'paid'); assert.ok(receipt.receiptId); assert.ok(receipt.transactionId.startsWith('TEST-')); assert.equal(receipt.smsStatus, 'sandbox_skipped'); assert.ok(receipt.passengers.every((item: any) => !('nationalCode' in item)));
    const one = await input(1); const other = await input(1); const race = await Promise.all([a.request('/api/bookings/reservations', one), b.request('/api/bookings/reservations', other)]); assert.deepEqual(race.map(result => result.status).sort(), [201, 409]); const winner = race.find(result => result.status === 201)!;
    assert.equal((await a.request('/api/admin/booking/departures', { ...saved, capacity: 2, remaining: undefined }, true)).status, 409);
    assert.equal((await a.request('/api/bookings/cancel', { reference: winner.data.booking.reference, token: winner.data.token })).data.booking.state, 'cancelled');
    const refunded = await a.request('/api/bookings/cancel', access); assert.equal(refunded.data.booking.state, 'refunded'); assert.equal(refunded.data.booking.refundAmount, 2070000); assert.equal(refunded.data.booking.cancellationFee, 230000);
    assert.equal((await b.request('/api/bookings/cancel', access)).data.booking.refundAmount, 2070000); assert.equal((await a.request('/api/bookings/payment/verify', payment)).data.booking.state, 'refunded');
    const failedHold = await a.request('/api/bookings/reservations', await input(1)); const failedAccess = { reference: failedHold.data.booking.reference, token: failedHold.data.token }; const failedPay = (await a.request('/api/bookings/payment/start', failedAccess)).data;
    await a.request('/api/bookings/sandbox/complete', { ...failedAccess, paymentId: failedPay.paymentId, result: 'failed' }); const failed = await a.request('/api/bookings/payment/verify', { ...failedAccess, paymentId: failedPay.paymentId }); assert.equal(failed.data.booking.state, 'failed'); assert.equal(failed.data.booking.receiptId, null);
    const lateHold = await a.request('/api/bookings/reservations', await input(3)); const lateAccess = { reference: lateHold.data.booking.reference, token: lateHold.data.token }; const latePay = (await a.request('/api/bookings/payment/start', lateAccess)).data;
    const sql = new DatabaseSync(path.join(directory, 'data', 'bookings.sqlite')); sql.prepare('UPDATE reservations SET expires_at=? WHERE reference=?').run(Date.now() - 1, lateAccess.reference); sql.close();
    const replacement = await a.request('/api/bookings/reservations', await input(3)); assert.equal(replacement.status, 201);
    await a.request('/api/bookings/sandbox/complete', { ...lateAccess, paymentId: latePay.paymentId, result: 'paid' }); const lateResult = await a.request('/api/bookings/payment/verify', { ...lateAccess, paymentId: latePay.paymentId }); assert.equal(lateResult.data.booking.state, 'refunded'); assert.equal(lateResult.data.booking.receiptId, null);
    const availability = (await a.request('/api/tours')).data.tours.find((item: any) => item.id === tour.id).departures[0]; assert.equal(availability.remaining, 0);
    for (const cancellation of [{ enabled: true, cutoffHours: 24, feePercent: 10 }, { enabled: false, cutoffHours: 0, feePercent: 0 }]) {
      const policyDeparture = (await a.request('/api/admin/booking/departures', { ...config, capacity: 1, startsAt: new Date(Date.now() + 3600000).toISOString(), cancellation }, true)).data.departure;
      const policySelection = { ...selection(1), departureId: policyDeparture.id }; const policyQuote = (await a.request('/api/bookings/quote', policySelection)).data.quote;
      const policyHold = await a.request('/api/bookings/reservations', { ...await input(1), selection: policySelection, quoteRevision: policyQuote.revision }); assert.equal(policyHold.status, 201);
      const policyAccess = { reference: policyHold.data.booking.reference, token: policyHold.data.token }; const policyPayment = (await a.request('/api/bookings/payment/start', policyAccess)).data;
      await a.request('/api/bookings/sandbox/complete', { ...policyAccess, paymentId: policyPayment.paymentId, result: 'paid' }); assert.equal((await a.request('/api/bookings/payment/verify', { ...policyAccess, paymentId: policyPayment.paymentId })).data.booking.state, 'paid');
      assert.equal((await a.request('/api/bookings/cancel', policyAccess)).status, 409); assert.equal((await a.request('/api/bookings/track', policyAccess)).data.booking.state, 'paid');
    }
    const disabled = await server('disabled'); assert.equal((await disabled.request('/api/bookings/reservations', await input(1))).status, 503); assert.equal((await disabled.request('/api/bookings/sandbox/session', payment)).status, 403);
    const audit = new DatabaseSync(path.join(directory, 'data', 'bookings.sqlite')); assert.equal(audit.prepare("SELECT COUNT(*) AS n FROM booking_audit WHERE action='payment.verified' AND reference=?").get(access.reference)?.n, 1); assert.equal(audit.prepare('SELECT COUNT(*) AS n FROM sms_jobs WHERE reference=?').get(access.reference)?.n, 1); audit.close();
  } finally { for (const child of children) { child.kill(); if (child.exitCode === null) await once(child, 'exit'); } await rm(directory, { recursive: true, force: true }); }
});
