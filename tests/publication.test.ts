import test from 'node:test';
import assert from 'node:assert/strict';
import { isLegacySampleRecord } from '../server/legacySampleRecords';
import { publicShopCatalog } from '../src/utils/shopLogic';

test('retired seed detection excludes only exact legacy samples and preserves edited and real records', () => {
  const seed = { id: 'any-id', updatedAt: 'any-time', code: 'FC-GL-210', title: 'کمپ جنگل‌های هیرکانی', destination: 'ماسال، گیلان', status: 'published', price: 4850000, capacity: 24, sold: 19, leader: 'آرمان توکلی', departure: '۱۴۰۵/۰۶/۲۰' };
  assert.equal(isLegacySampleRecord(seed), true);
  assert.equal(isLegacySampleRecord({ ...seed, updatedAt: 'later' }), true);
  assert.equal(isLegacySampleRecord({ ...seed, price: 5000000 }), false);
  assert.equal(isLegacySampleRecord({ ...seed, departures: [] }), false);
  assert.equal(isLegacySampleRecord({ id: 'actual-tour', title: 'برنامه ثبت‌شده مدیر' }), false);
});

test('public products require inventory, positive stock, price, image, warranty and explicit order activation', () => {
  const record = { id: 'real-inventory', sku: 'CUSTOM-READY', title: 'تجهیزات ثبت‌شده', status: 'active', price: 2000000, stock: 3, image: '/images/store/tent.webp', warranty: 'شرایط ثبت‌شده فروشنده', salesEnabled: true };
  assert.deepEqual(publicShopCatalog([]), []);
  assert.equal(publicShopCatalog([record]).length, 1);
  for (const change of [{ price: null }, { price: 0 }, { stock: null }, { stock: 0 }, { stock: -1 }, { image: '' }, { image: 'javascript:alert(1)' }, { warranty: '' }, { warranty: ' ' }, { salesEnabled: false }, { salesEnabled: undefined }, { status: 'inactive' }]) assert.equal(publicShopCatalog([{ ...record, ...change }]).length, 0, JSON.stringify(change));
  assert.equal(publicShopCatalog([{ ...record, sku: '8513471', image: '' }]).length, 1, 'a matched manufacturer image may be used for an actual stocked model');
});

