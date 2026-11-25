import { seedTestAdmin } from './fixtures/seedAdmin';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { resolveRoute, legacyRouteRedirect, productPath } from '../src/routing/routes';
import { routeMetadata, publicRoutePaths } from '../src/routing/metadata';
import { ARTICLES } from '../src/data/articles';
import { POPULAR_TOURS } from './fixtures/tours';
import { metadataForPath, pageRedirect, renderPageHtml, sitemapXml } from '../server/pages';
import { buildShopCatalog } from '../src/utils/shopLogic';

test('independent routes distinguish pages, decode identifiers and reject malformed paths', () => {
  for (const [pathname, kind] of Object.entries({ '/': 'home', '/tours': 'tours', '/calendar': 'calendar', '/shop': 'shop', '/blog': 'blog', '/about': 'about', '/terms': 'terms', '/contact': 'contact', '/account': 'account', '/shop/checkout': 'checkout', '/shop/manage': 'shop-manage' })) assert.equal(resolveRoute(pathname).kind, kind);
  assert.deepEqual(resolveRoute('/tours/tour-1'), { kind: 'tour', path: '/tours/tour-1', id: 'tour-1' });
  assert.equal(resolveRoute('/shop/products/model-8513471').id, 'model-8513471');
  for (const path of ['/tours/one/extra', '/tours/a%2Fb', '/blog/%XY', '/unknown', '/shop/products/']) assert.equal(resolveRoute(path).kind, 'not-found');
});

test('old account and shop addresses redirect without losing relevant query parameters', () => {
  assert.equal(legacyRouteRedirect('/profile', '?tab=overview'), '/account?tab=overview');
  assert.equal(legacyRouteRedirect('/shop', '?product=model-8513471&view=manage&utm_source=test'), '/shop/products/model-8513471?utm_source=test');
  assert.equal(legacyRouteRedirect('/shop', '?view=checkout'), '/shop/checkout');
  assert.equal(legacyRouteRedirect('/shop', '?view=manage'), '/shop/manage');
  assert.equal(pageRedirect('/blog/b-main', ''), null);
  assert.equal(pageRedirect('/tours/', '?q=camp'), '/tours?q=camp');
  assert.equal(pageRedirect('/shop', '?category=shelter'), null);
});

test('all public entries have unique share metadata, invalid identifiers are noindex and private pages stay out of sitemap', () => {
  const products = buildShopCatalog([]);
  for (const path of publicRoutePaths()) assert.equal(metadataForPath(path, products).notFound, false, path);
  for (const tour of POPULAR_TOURS) assert.ok(routeMetadata(resolveRoute(`/tours/${tour.id}`), undefined, POPULAR_TOURS).title.includes(tour.title));
  for (const article of ARTICLES) assert.equal(routeMetadata(resolveRoute(`/blog/${article.slug}`)).type, 'article');
  assert.equal(metadataForPath('/shop/products/missing', products).notFound, true);
  assert.equal(metadataForPath('/tours/missing', products).noIndex, true);
  const sitemap = sitemapXml(products, 'https://friendlycamp.example');
  assert.ok(!sitemap.includes('/blog/forest-camping-guide')); assert.equal(ARTICLES.length, 0); assert.equal(metadataForPath('/blog/forest-camping-guide', products).notFound, true);
  assert.ok(sitemap.includes(productPath(products[0].id)));
  assert.ok(!/\/account|\/login|\/admin|\/shop\/checkout|\/shop\/manage/.test(sitemap));
  const html = renderPageHtml('<head><title>old</title><meta name="description" content="old"><meta property="og:title" content="old"><link rel="canonical" href="old"></head><body></body>', { ...metadataForPath('/about', products), title: 'A < B "test"', description: '<script>alert(1)</script>' }, 'https://friendlycamp.example');
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.ok(html.includes('A &lt; B &quot;test&quot;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('href="https://friendlycamp.example/about"'));
});

test('HTTP deep links have page metadata, real status codes and contact requests persist only after validation', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'friendly-pages-test-')); await seedTestAdmin(directory);
  const project = process.cwd();
  await mkdir(path.join(directory, 'dist'));
  await writeFile(path.join(directory, 'dist', 'index.html'), await readFile(path.join(project, 'index.html'), 'utf8'));
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening'); const address = probe.address(); assert.ok(address && typeof address !== 'string');
  const port = address.port; await new Promise<void>(resolve => probe.close(() => resolve()));
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(project, 'server.ts')], { cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: String(port), NODE_ENV: 'production', PUBLIC_SITE_URL: 'https://friendlycamp.example', SESSION_SECRET: 'isolated-page-routing-secret-sufficient-length', ADMIN_BOOTSTRAP_EMAIL: '', ADMIN_BOOTSTRAP_PASSWORD: '' } });
  child.stdout.resume(); child.stderr.resume();
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 200; attempt++) { if (child.exitCode !== null) throw new Error('Isolated pages server stopped before readiness'); try { if ((await fetch(base + '/api/auth/me')).status === 401) { ready = true; break; } } catch { /* Wait for startup. */ } await new Promise(resolve => setTimeout(resolve, 200)); }
    assert.ok(ready);
    const products = (await (await fetch(base + '/api/shop/catalog')).json()).products;
    const publicTours = (await (await fetch(base + '/api/tours')).json()).tours; const tourDetail = `/tours/${publicTours[0].id}`;
    for (const path of ['/', '/tours', tourDetail, '/calendar', '/destinations', '/destinations/uraman', '/blog', '/about', '/terms', '/contact', '/account', '/login', '/register', '/shop', productPath(products[0].id), '/shop/checkout', '/shop/manage']) {
      const response = await fetch(base + path); assert.equal(response.status, 200, path);
      const html = await response.text(); const meta = metadataForPath(path, products, publicTours);
      assert.ok(html.includes(meta.title), path); assert.ok(html.includes(`href="https://friendlycamp.example${meta.path}"`), path);
      assert.equal((html.match(/<title>/g) || []).length, 1, path);
      assert.ok(html.includes('property="og:url"'), path);
    }
    for (const path of ['/blog/forest-camping-guide', '/blog/b-main', '/shop/products/model-E061AB01', '/missing', '/tours/missing', '/blog/missing', '/shop/products/missing', '/destinations/missing']) { const response = await fetch(base + path); assert.equal(response.status, 404, path); assert.ok((await response.text()).includes('noindex,nofollow')); }
    for (const [path, location] of [['/profile', '/account'], ['/shop?product=model-8513471', '/shop/products/model-8513471'], ['/shop?view=manage', '/shop/manage'], ['/tours/', '/tours']]) { const response = await fetch(base + path, { redirect: 'manual' }); assert.equal(response.status, 308); assert.equal(response.headers.get('location'), location); }
    assert.equal((await fetch(base + tourDetail, { method: 'HEAD' })).status, 200);
    assert.equal((await fetch(base + '/api/unknown')).status, 404);
    const removedAi = await fetch(base + '/api/gemini/generate-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contentType: 'personalizer', tourName: 'گیلان' }) });
    assert.equal(removedAi.status, 404);
    assert.equal((await fetch(base + '/missing.webp')).status, 404);
    assert.equal((await fetch(base + '/server.cjs')).status, 404);
    const sitemap = await (await fetch(base + '/sitemap.xml')).text(); assert.ok(sitemap.includes('https://friendlycamp.example' + tourDetail)); assert.ok(sitemap.includes('/shop/products/'));
    assert.ok((await (await fetch(base + '/robots.txt')).text()).includes('Disallow: /account'));
    const post = (body: unknown) => fetch(base + '/api/contact/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const input = { fullName: 'کاربر آزمایشی', phone: '۰۹۱۲۱۲۳۴۵۶۷', email: '', subject: 'بررسی برنامه سفر', message: 'متن آزمایشی برای بررسی ثبت درخواست در محیط جداگانه.', consent: true };
    assert.equal((await post({ ...input, consent: false })).status, 400);
    assert.equal((await post({ ...input, phone: '123' })).status, 400);
    assert.equal((await post({ ...input, status: 'closed' })).status, 400);
    const result = await post(input); assert.equal(result.status, 201); const data = await result.json(); assert.match(data.reference, /^FC-[A-F0-9]{12}$/); assert.deepEqual(Object.keys(data), ['reference']);
    const database = JSON.parse(await readFile(path.join(directory, 'data', 'admin.json'), 'utf8'));
    const saved = database.tickets.find((ticket: any) => ticket.reference === data.reference); assert.ok(saved); assert.equal(saved.phone, '09121234567'); assert.equal(saved.message, input.message); assert.equal(saved.status, 'open');
    assert.equal(database.tickets.filter((ticket: any) => ticket.channel === 'website').length, 1);
  } finally { child.kill(); if (child.exitCode === null) await once(child, 'exit'); await rm(directory, { recursive: true, force: true }); }
});
