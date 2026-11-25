import test from 'node:test';
import assert from 'node:assert/strict';
import { POPULAR_TOURS } from './fixtures/tours';
import { calendarCategory, filterTourCatalog } from '../src/utils/travelFilters';

test('tour filters combine normalized words, region and known duration without counting unknown days as a short trip', () => {
  const tours = [{ ...POPULAR_TOURS[0], id: 'short', title: 'کمپ جنگل', location: 'گیلان', country: 'ایران', duration: '۲ روز و ۱ شب' }, { ...POPULAR_TOURS[0], id: 'unknown', title: 'کمپ جنگل', location: 'گیلان', country: 'ایران', duration: 'مدت ثبت نشده' }, { ...POPULAR_TOURS[0], id: 'long', title: 'کمپ جنگل', location: 'گیلان', country: 'ایران', duration: '۵ روز' }, { ...POPULAR_TOURS[0], id: 'abroad', title: 'کمپ جنگل', location: 'ترکیه', country: 'ترکیه', duration: '۲ روز' }];
  assert.deepEqual(filterTourCatalog(tours, { query: '  گيلان  كمپ ', region: 'iran', days: 'short' }).map(tour => tour.id), ['short']);
  assert.deepEqual(filterTourCatalog(tours, { query: '', region: 'abroad', days: 'short' }).map(tour => tour.id), ['abroad']);
  assert.deepEqual(filterTourCatalog(tours, { query: '', region: 'iran', days: 'long' }).map(tour => tour.id), ['long']);
});

test('clearing tour filters restores the full input while incompatible filters return no cards', () => {
  assert.equal(filterTourCatalog(POPULAR_TOURS, { query: 'ناممکن xyz', region: 'iran', days: 'long' }).length, 0);
  assert.deepEqual(filterTourCatalog(POPULAR_TOURS, { query: '', region: 'all', days: 'all' }), POPULAR_TOURS);
});

test('calendar categories honor the dashboard category before inferring the title', () => {
  const tour = { ...POPULAR_TOURS[0], title: 'کمپ جنگل' };
  assert.equal(calendarCategory({ ...tour, category: 'خانوادگی' }), 'family');
  assert.equal(calendarCategory({ ...tour, category: 'VIP' }), 'vip');
  assert.equal(calendarCategory({ ...tour, category: 'trekking' }), 'trekking');
  assert.equal(calendarCategory({ ...tour, category: '' }), 'rainforest');
});

