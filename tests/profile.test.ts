import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { once } from 'node:events';
import { profileChecklist, profileCompletion, profileDate, validateMediaFile, walletCsv } from '../src/utils/profileForm';
import { createDefaultProfile } from '../server/profile';

test('profile completion reflects useful optional fields without treating defaults as completed tasks', () => {
  const profile = createDefaultProfile('test');
  assert.equal(profileCompletion(profile), 0);
  profile.city = 'شیراز'; profile.birthDate = '1995-01-10'; profile.emergencyContact = '09121234567';
  assert.equal(profileCompletion(profile), 50);
  profile.interests = ['کمپینگ']; profile.professional.equipmentNotes = 'چادر و کیسه‌خواب';
  assert.equal(profileCompletion(profile), 100);
  assert.ok(profileChecklist(profile).every(item => item.done));
  assert.equal(profileDate(''), 'ثبت نشده');
  assert.equal(profileDate('not-a-date'), 'ثبت نشده');
});

test('media constraints reject empty, oversized and unsupported files before uploading', () => {
  assert.equal(validateMediaFile({ type: 'image/webp', size: 1024 }), null);
  assert.equal(validateMediaFile({ type: 'audio/mpeg', size: 12 * 1024 * 1024 }), null);
  assert.ok(validateMediaFile({ type: 'image/webp', size: 0 }));
  assert.ok(validateMediaFile({ type: 'image/webp', size: 12 * 1024 * 1024 + 1 }));
  assert.ok(validateMediaFile({ type: 'image/svg+xml', size: 1024 }));
});

test('wallet exports preserve data and neutralize spreadsheet formulas in user-controlled descriptions', () => {
  const profile = createDefaultProfile('test');
  profile.wallet.transactions.push({ id: 't', reference: 'FC-1', title: '=HYPERLINK("unsafe")', date: '2026-11-24', type: 'credit', amount: 10000, status: 'موفق', category: 'شارژ' });
  const csv = walletCsv(profile.wallet.transactions);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=HYPERLINK(""unsafe"")"'));
  assert.ok(csv.includes('"10000"'));
});

test('profile HTTP routes persist real changes, verify passwords and protect financial records in an isolated workspace', { timeout: 120000 }, async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'friendly-profile-test-'));
  const portServer = createServer(); portServer.listen(0, '127.0.0.1'); await once(portServer, 'listening');
  const address = portServer.address(); assert.ok(address && typeof address !== 'string');
  const port = address.port; await new Promise<void>(resolve => portServer.close(() => resolve()));
  const projectRoot = process.cwd();
  const child = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), path.join(projectRoot, 'server.ts')], {
    cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(port), NODE_ENV: 'production', SESSION_SECRET: 'profile-integration-test-secret-with-32-plus-characters', ADMIN_BOOTSTRAP_EMAIL: '', ADMIN_BOOTSTRAP_PASSWORD: '' },
  });
  let output = ''; child.stdout.on('data', value => { output += String(value); }); child.stderr.on('data', value => { output += String(value); });
  const base = `http://127.0.0.1:${port}`; let cookie = '';
  const request = async (url: string, method = 'GET', body?: unknown) => {
    const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const session = response.headers.get('set-cookie'); if (session) cookie = session.split(';')[0];
    return { status: response.status, data: response.status === 204 ? null : await response.json() };
  };
  try {
    let ready = false;
    for (let index = 0; index < 200; index++) {
      if (child.exitCode !== null) throw new Error('Isolated profile server exited during startup');
      try { if ((await fetch(base + '/api/auth/me')).status === 401) { ready = true; break; } } catch { /* Wait for the isolated server. */ }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    assert.ok(ready, 'Isolated profile server must be ready before issuing test requests');
    assert.equal((await request('/api/profile')).status, 401);
    const registered = await request('/api/auth/register', 'POST', { fullName: 'همسفر آزمایشی', email: 'profile@example.com', phone: '09121234567', password: 'OriginalPass123', agreeTerms: true });
    assert.equal(registered.status, 201);
    const initial = await request('/api/profile'); assert.equal(initial.status, 200);
    let profile = initial.data.profile;
    const changed = await request('/api/profile', 'PUT', { ...profile, userId: 'injected-user', city: 'شیراز', wallet: { ...profile.wallet, balance: 9000000 }, club: { ...profile.club, points: 9999 } });
    assert.equal(changed.status, 200); profile = changed.data.profile;
    assert.equal(profile.userId, registered.data.user.id); assert.equal(profile.wallet.balance, 0); assert.equal(profile.club.points, 0);
    assert.equal((await request('/api/profile')).data.profile.city, 'شیراز');
    const account = { fullName: 'همسفر تازه', phone: '09121234568', email: 'new@example.com', currentPassword: 'wrong' };
    assert.equal((await request('/api/profile/account', 'PATCH', account)).status, 400);
    const updated = await request('/api/profile/account', 'PATCH', { ...account, currentPassword: 'OriginalPass123' });
    assert.equal(updated.status, 200); assert.equal(updated.data.user.fullName, 'همسفر تازه'); assert.equal(updated.data.user.role, 'user');
    assert.equal((await request('/api/profile/password', 'POST', { currentPassword: 'wrong', newPassword: 'UpdatedPass123' })).status, 400);
    assert.equal((await request('/api/profile/password', 'POST', { currentPassword: 'OriginalPass123', newPassword: 'UpdatedPass123' })).status, 204);
    assert.equal((await request('/api/auth/login', 'POST', { identifier: account.email, password: 'OriginalPass123' })).status, 401);
    assert.equal((await request('/api/auth/login', 'POST', { identifier: account.email, password: 'UpdatedPass123' })).status, 200);
    assert.equal((await request('/api/profile/wallet/operation', 'POST', { action: 'topup', amount: 10000, sourceLabel: 'test' })).status, 503);
    assert.equal((await request('/api/profile')).data.profile.wallet.balance, 0);
    const story = { id: 'story-1', title: 'سفر آزمایشی', destination: 'شیراز', date: '2026-11-20', body: 'روایت'.repeat(2000), createdAt: new Date().toISOString() };
    const journal = await request('/api/profile', 'PUT', { ...profile, stories: [story, { ...story, id: 'story-2' }] });
    assert.equal(journal.status, 200); profile = journal.data.profile; assert.equal(profile.stories.length, 2);
    const body = new FormData(); body.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'profile-test.png');
    const upload = await fetch(base + '/api/profile/upload', { method: 'POST', headers: { Cookie: cookie }, body }); assert.equal(upload.status, 201);
    const media = await upload.json(); assert.ok(/^\/uploads\/.+\.png$/.test(media.url));
    assert.equal((await fetch(base + media.url)).status, 200);
    const attached = await request('/api/profile', 'PUT', { ...profile, stories: [{ ...profile.stories[0], title: 'عنوان ویرایش‌شده' }], media: [{ id: 'photo-1', kind: 'photo', title: 'عکس آزمایشی', url: media.url, mimeType: media.mimeType, createdAt: new Date().toISOString() }] });
    assert.equal(attached.status, 200); assert.equal(attached.data.profile.media.length, 1); assert.equal(attached.data.profile.stories.length, 1);
    const removed = await request('/api/profile', 'PUT', { ...attached.data.profile, stories: [], media: [] });
    assert.equal(removed.status, 200); assert.equal((await request('/api/profile')).data.profile.stories.length, 0);
    assert.equal((await request('/api/profile')).data.profile.media.length, 0);
  } finally {
    child.kill(); if (child.exitCode === null) await once(child, 'exit');
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(tmpdir())); assert.ok(path.basename(directory).startsWith('friendly-profile-test-'));
    await rm(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
