import { seedTestAdmin } from './fixtures/seedAdmin';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import crypto from 'node:crypto';
import { buildShopCatalog, publicShopCatalog, filterShopProducts, sanitizeCart, type ShopFilters } from '../src/utils/shopLogic';

const defaults = (): ShopFilters => ({ query: '', category: 'all', brands: [], availability: 'all', maxPrice: null, maxWeight: null, activity: 'all', favoritesOnly: false, favorites: [], sort: 'featured' });
test('catalog merges exact manufacturer SKUs with inventory and never invents missing prices or product images', () => {
  const products = buildShopCatalog([{ id: 'a', sku: '8513471', title: 'چادر فروشگاه', category: 'shelter', price: '1,250,000', stock: '2', status: 'active' }, { id: 'b', sku: 'CUSTOM-1', title: 'کالای سفارشی', category: 'نور و انرژی', price: '', stock: 0, status: 'active', image: 'javascript:alert(1)' }]);
  const tent = products.find(product => product.sku === '8513471')!;
  assert.equal(tent.price, 1250000); assert.equal(tent.stock, 2); assert.equal(tent.id, 'model-8513471'); assert.equal(tent.inventoryId, 'a');
  assert.ok(tent.image.endsWith('/tent.webp'));
  const custom = products.find(product => product.sku === 'CUSTOM-1')!;
  assert.equal(custom.image, ''); assert.equal(custom.price, null); assert.equal(custom.stock, 0);
  assert.equal(buildShopCatalog([{ id: 'a', sku: '8513471', status: 'inactive' }]).some(product => product.sku === '8513471'), false);
});
test('filters enforce price, weight, availability and Persian search without treating unknown values as zero', () => {
  const products = buildShopCatalog([{ id: 'a', sku: '8513471', title: 'چادر سفر', category: 'shelter', price: 100, stock: 2, status: 'active' }]);
  assert.equal(filterShopProducts(products, { ...defaults(), maxPrice: 100 }).length, 1);
  assert.equal(filterShopProducts(products, { ...defaults(), maxPrice: 99 }).length, 0);
  assert.ok(filterShopProducts(products, { ...defaults(), maxWeight: 500 }).every(product => product.weightGrams !== null && product.weightGrams <= 500));
  assert.equal(filterShopProducts(products, { ...defaults(), availability: 'in_stock' }).length, 1);
  assert.ok(filterShopProducts(products, { ...defaults(), query: 'كوله' }).some(product => product.category === 'packs'));
  assert.equal(filterShopProducts(products, { ...defaults(), sort: 'price_desc' })[0].price, 100);
  assert.equal(filterShopProducts(products, { ...defaults(), favoritesOnly: true, favorites: ['model-8513471'] }).length, 1);
});
test('restored carts reject malformed data and clamp quantities without reviving unrelated old models', () => {
  assert.deepEqual(sanitizeCart({ wrong: 1 }), []);
  assert.deepEqual(sanitizeCart([{ productId: 'a', quantity: 8 }, { productId: 'a', quantity: 4 }, { productId: 'b', quantity: -1 }, { productId: 'c', quantity: NaN }, null]), [{ productId: 'a', quantity: 9 }]);
});

test('shop HTTP workflow validates prices, saves idempotent orders, protects tracking and allocates stock atomically', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'friendly-shop-test-')); await seedTestAdmin(directory);
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const address = probe.address(); assert.ok(address && typeof address !== 'string');
  const port = address.port; await new Promise<void>(resolve => probe.close(() => resolve()));
  const project = process.cwd();
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(project, 'server.ts')], { cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), NODE_ENV: 'production', SESSION_SECRET: 'isolated-shop-integration-secret-of-sufficient-length', ADMIN_BOOTSTRAP_EMAIL: 'admin@shop.example', ADMIN_BOOTSTRAP_PASSWORD: 'StoreAdminPass1234', ADMIN_BOOTSTRAP_NAME: 'مدیر آزمایشی', ADMIN_BOOTSTRAP_PHONE: '09120000000' } });
  child.stdout.resume(); child.stderr.resume();
  const base = `http://127.0.0.1:${port}`; let adminCookie = '';
  const request = async (url: string, method = 'GET', body?: unknown, admin = false) => {
    const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(admin && adminCookie ? { Cookie: adminCookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    if (url === '/api/auth/login') adminCookie = response.headers.get('set-cookie')?.split(';')[0] || '';
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  };
  try {
    let ready = false;
    for (let attempt = 0; attempt < 200; attempt++) { if (child.exitCode !== null) throw new Error('Isolated shop server stopped before readiness'); try { if ((await fetch(base + '/api/auth/me')).status === 401) { ready = true; break; } } catch { /* Wait for startup. */ } await new Promise(resolve => setTimeout(resolve, 200)); }
    assert.ok(ready);
    const catalog = await request('/api/shop/catalog'); assert.equal(catalog.status, 200); assert.equal(catalog.data.products.length, 1);
    const stocked = catalog.data.products.find((product: any) => product.inventoryId && product.stock === 4);
    const reference = buildShopCatalog([]).find(product => product.sku === 'E061AB01')!;
    assert.equal((await request('/api/shop/quote', 'POST', { items: [{ productId: reference.id, quantity: 1 }] })).status, 409);
    const items = [{ productId: stocked.id, quantity: 1 }];
    const quoteResponse = await request('/api/shop/quote', 'POST', { items }); assert.equal(quoteResponse.status, 200);
    const quote = quoteResponse.data.quote; assert.equal(quote.pricedSubtotal, stocked.price); assert.equal(quote.unpricedCount, 0);
    assert.equal((await request('/api/shop/quote', 'POST', { items: [{ productId: stocked.id, quantity: 5 }] })).status, 409);
    assert.equal((await request('/api/shop/quote', 'POST', { items: [{ productId: stocked.id, quantity: 0 }] })).status, 400);
    assert.equal((await request('/api/shop/quote', 'POST', { items: [items[0], items[0]] })).status, 400);
    const customer = { fullName: 'خریدار آزمایشی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: '', province: 'فارس', city: 'شیراز', address: 'نشانی آزمایشی، خیابان نمونه، پلاک ۱۰', postalCode: '۷۱۸۵۷۱۲۳۴۵', notes: '' };
    const input = { items, customer, consent: true, quoteRevision: quote.revision, requestKey: crypto.randomUUID() };
    assert.equal((await request('/api/shop/orders', 'POST', { ...input, total: 1, status: 'paid' })).status, 400);
    const first = await request('/api/shop/orders', 'POST', input); assert.equal(first.status, 201); assert.equal(first.data.order.paymentStatus, 'unpaid');
    const replay = await request('/api/shop/orders', 'POST', input); assert.equal(replay.data.order.reference, first.data.order.reference); assert.equal(replay.data.trackingToken, first.data.trackingToken);
    assert.equal((await request('/api/shop/orders', 'POST', { ...input, customer: { ...customer, city: 'تهران' } })).status, 409);
    const tracking = { reference: first.data.order.reference, trackingToken: first.data.trackingToken };
    assert.equal((await request('/api/shop/orders/track', 'POST', { ...tracking, trackingToken: 'x'.repeat(43) })).status, 404);
    const tracked = await request('/api/shop/orders/track', 'POST', tracking); assert.equal(tracked.status, 200); assert.equal('address' in tracked.data.order.customer, false); assert.equal('requestKey' in tracked.data.order, false);
    assert.equal((await request('/api/admin/shop/orders')).status, 401);
    assert.equal((await request('/api/auth/login', 'POST', { identifier: 'admin@shop.example', password: 'StoreAdminPass1234' })).status, 200);
    const editStatus = (reference: string, status: string, trackingNumber = '') => request(`/api/admin/shop/orders/${reference}`, 'PATCH', { status, note: 'بررسی آزمایشی', trackingNumber }, true);
    assert.equal((await request('/api/shop/catalog')).data.products.find((product: any) => product.id === stocked.id).stock, 4);
    assert.equal((await request('/api/admin/shop/inventory', 'PUT', { id: stocked.inventoryId, sku: stocked.sku, title: stocked.name, category: stocked.category, brand: stocked.brand, model: stocked.model, price: stocked.price + 1000, stock: 4, status: 'active', image: stocked.image, description: stocked.description, warranty: stocked.warranty, salesEnabled: true }, true)).status, 200);
    const changed = await request('/api/shop/orders', 'POST', { ...input, requestKey: crypto.randomUUID() }); assert.equal(changed.status, 409); assert.equal(changed.data.error, 'CART_CHANGED');
    const confirmed = await editStatus(tracking.reference, 'confirmed'); assert.equal(confirmed.status, 200); assert.equal(confirmed.data.order.stockAllocated, true);
    let stock = (await request('/api/shop/catalog')).data.products; assert.equal(stock.find((product: any) => product.id === stocked.id).stock, 3);
    assert.equal((await request('/api/shop/orders/cancel', 'POST', tracking)).status, 200);
    assert.equal((await request('/api/shop/orders/cancel', 'POST', tracking)).status, 200);
    stock = (await request('/api/shop/catalog')).data.products; assert.equal(stock.find((product: any) => product.id === stocked.id).stock, 4);
    assert.equal((await editStatus(tracking.reference, 'confirmed')).status, 409);
    // Two simultaneous confirmations must not consume the last unit twice.
    const small = await request('/api/admin/shop/inventory', 'PUT', { sku: 'TEST-LAST-UNIT', title: 'کالای آخرین موجودی', category: 'trail', brand: '', model: '', price: 10000, stock: 1, status: 'active', image: '/images/store/tent.webp', description: '', warranty: 'شرایط آزمایشی', salesEnabled: true }, true); assert.equal(small.status, 200);
    const last = (await request('/api/shop/catalog')).data.products.find((product: any) => product.sku === 'TEST-LAST-UNIT');
    const lastItems = [{ productId: last.id, quantity: 1 }]; const lastQuote = (await request('/api/shop/quote', 'POST', { items: lastItems })).data.quote;
    const pending = await Promise.all([1, 2].map(() => request('/api/shop/orders', 'POST', { ...input, items: lastItems, quoteRevision: lastQuote.revision, requestKey: crypto.randomUUID() })));
    const outcomes = await Promise.all(pending.map(result => editStatus(result.data.order.reference, 'confirmed')));
    assert.deepEqual(outcomes.map(result => result.status).sort(), [200, 409]);
    const accepted = outcomes.find(result => result.status === 200)!.data.order;
    assert.equal((await editStatus(accepted.reference, 'preparing')).status, 200);
    assert.equal((await editStatus(accepted.reference, 'dispatched')).status, 400);
    assert.equal((await editStatus(accepted.reference, 'dispatched', 'TEST-SHIP-123')).status, 200);
    const acceptedInput = pending.find(result => result.data.order.reference === accepted.reference)!.data;
    assert.equal((await request('/api/shop/orders/cancel', 'POST', { reference: accepted.reference, trackingToken: acceptedInput.trackingToken })).status, 409);
    assert.equal((await editStatus(accepted.reference, 'completed', 'TEST-SHIP-123')).status, 200);
    assert.equal((await editStatus(accepted.reference, 'confirmed')).status, 409);
    const stored = JSON.parse(await readFile(path.join(directory, 'data', 'admin.json'), 'utf8'));
    assert.equal(stored.shopOrders.length, 3); assert.ok(stored.shopOrders.every((order: any) => order.paymentStatus === 'unpaid'));
    assert.equal(stored.products.find((product: any) => product.sku === 'TEST-LAST-UNIT').stock, 0);
    assert.equal(stored.shopOrders[0].customer.phone, '09121234567');
  } finally {
    child.kill(); if (child.exitCode === null) await once(child, 'exit');
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('friendly-shop-test-'));
    await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
