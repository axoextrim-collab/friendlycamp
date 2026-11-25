import test from 'node:test';
import assert from 'node:assert/strict';
import { bookingApi } from '../src/api/booking';
import { bookingAccessSchema } from '../server/bookingSchemas';
test('receipt, cancellation and payment start send only private access fields after a gateway return', async context => {
  const bodies: unknown[] = [];
  context.mock.method(globalThis, 'fetch', async (_url: unknown, options: RequestInit) => { bodies.push(JSON.parse(String(options.body))); return new Response(JSON.stringify({ booking: {}, paymentId: 'fixture', paymentUrl: '/booking/test-payment' })); });
  const gatewayReturn = { reference: 'FCB-0123456789ABCDEF', token: 'x'.repeat(43), paymentId: 'extra-field-from-return' };
  await bookingApi.track(gatewayReturn); await bookingApi.cancel(gatewayReturn); await bookingApi.startPayment(gatewayReturn);
  for (const body of bodies) { assert.equal(bookingAccessSchema.safeParse(body).success, true); assert.deepEqual(Object.keys(body as object).sort(), ['reference', 'token']); }
});

test('invalid catalog responses become recoverable errors instead of empty lists or broken filter views', async context => {
  context.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ tours: null, capabilities: { paymentMode: 'sandbox' } })));
  await assert.rejects(bookingApi.catalog(), /معتبر نیست/);
});
