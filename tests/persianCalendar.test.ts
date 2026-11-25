import test from 'node:test';
import assert from 'node:assert/strict';
import { getPersianMonth } from '../src/utils/persianCalendar';

test('Persian months align to the actual weekday and have their correct lengths', () => {
  const summer = getPersianMonth(1405, 6);
  assert.equal(summer.length, 31);
  assert.equal(summer[0].toISOString().slice(0, 10), '2026-08-23');
  assert.equal((summer[0].getUTCDay() + 1) % 7, 1);
  assert.equal(getPersianMonth(1405, 7).length, 30);
  assert.equal(getPersianMonth(1405, 8).length, 30);
  assert.equal(getPersianMonth(1405, 9).length, 30);
});

test('Persian leap years and year boundaries do not add or lose calendar days', () => {
  assert.equal(getPersianMonth(1403, 12).length, 30);
  assert.equal(getPersianMonth(1404, 12).length, 29);
  const dates = getPersianMonth(1405, 12);
  const next = getPersianMonth(1406, 1);
  assert.equal(next[0].getTime() - dates.at(-1)!.getTime(), 86400000);
  assert.throws(() => getPersianMonth(1405, 13), RangeError);
});
