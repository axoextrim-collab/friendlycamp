import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTICLES } from './fixtures/articles';
import { POPULAR_DESTINATIONS } from '../src/data/mockData';
import { POPULAR_TOURS } from './fixtures/tours';
import { searchSite, type SearchFilters } from '../src/utils/siteSearch';
import { addTourToCart, sanitizeTourCart, tourCartEstimate, tourCartInquiry } from '../src/utils/tourCart';

const defaults = (): SearchFilters => ({ query: '', scope: 'all', maxPrice: null, duration: 'all' });
const search = (changes: Partial<SearchFilters> = {}) => searchSite(POPULAR_TOURS, POPULAR_DESTINATIONS, ARTICLES, { ...defaults(), ...changes });
test('header search starts with the complete catalog without silently imposing a price limit', () => {
  const result = search();
  assert.equal(result.tours.length, POPULAR_TOURS.length);
  assert.equal(result.destinations.length, 15);
  assert.equal(result.articles.length, ARTICLES.length);
  assert.ok(result.tours.some(tour => tour.country !== 'ایران'));
});
test('search normalizes Persian and Arabic spellings and combines words across destination fields', () => {
  assert.ok(search({ query: '  كوير   مرنجاب  ' }).destinations.some(item => item.id === 'maranjab'));
  assert.ok(search({ query: 'كردستان اورامانات' }).destinations.some(item => item.id === 'uraman'));
  const impossible = search({ query: 'این عبارت نتیجه‌ای ندارد xyz' });
  assert.equal(impossible.tours.length + impossible.destinations.length + impossible.articles.length, 0);
  const articles = search({ scope: 'articles', query: 'چک لیست' });
  assert.equal(articles.tours.length, 0); assert.equal(articles.destinations.length, 0); assert.ok(articles.articles.some(item => item.id === 'b-1'));
});
test('tour duration uses days rather than nights and respects the selected budget', () => {
  assert.equal(search({ scope: 'tours', duration: 'short' }).tours.length, 0);
  assert.deepEqual(search({ scope: 'tours', duration: 'medium', maxPrice: 5_000_000 }).tours.map(tour => tour.id), ['tour-1']);
  assert.equal(search({ scope: 'tours', duration: 'long' }).tours.length, 4);
  const unknown = { ...POPULAR_TOURS[0], id: 'unknown', price: 'استعلام', duration: 'نامشخص' };
  assert.equal(searchSite([unknown], [], [], { ...defaults(), maxPrice: 10_000_000 }).tours.length, 0);
  assert.equal(searchSite([unknown], [], [], { ...defaults(), duration: 'short' }).tours.length, 0);
});
test('restored tour carts reject malformed entries, removed tours, duplicates and invalid dates', () => {
  assert.deepEqual(sanitizeTourCart({ wrong: true }, POPULAR_TOURS), []);
  const items = sanitizeTourCart([null, { tourId: 'missing', guests: 1 }, { tourId: 'tour-1', guests: -1 }, { tourId: 'tour-1', guests: 2, date: '2027-02-30' }, { tourId: 'tour-1', guests: 5 }, { tourId: 'tour-2', guests: 99, date: '2027-03-20' }, { tourId: 'tour-3', guests: 1.5 }], POPULAR_TOURS);
  assert.deepEqual(items, [{ tourId: 'tour-1', guests: 2, date: '' }, { tourId: 'tour-2', guests: 20, date: '2027-03-20' }]);
  assert.deepEqual(sanitizeTourCart(JSON.parse(JSON.stringify(items)), POPULAR_TOURS), items);
});
test('adding a tour twice keeps edited guest counts and dates instead of duplicating it', () => {
  const items = [{ tourId: 'tour-1', guests: 3, date: '2027-03-20' }];
  assert.deepEqual(addTourToCart(items, 'tour-1'), items);
  assert.deepEqual(addTourToCart(items, 'tour-2')[1], { tourId: 'tour-2', guests: 1, date: '' });
});
test('cart estimates multiply guests and preserve unknown prices as inquiries', () => {
  const items = [{ tourId: 'tour-1', guests: 3, date: '' }, { tourId: 'tour-2', guests: 2, date: '' }];
  const tours = [{ ...POPULAR_TOURS[0], price: '۱٬۲۰۰٬۰۰۰ تومان' }, { ...POPULAR_TOURS[1], price: 'استعلام' }];
  assert.deepEqual(tourCartEstimate(items, tours), { amount: 3_600_000, unpriced: 1 });
});
test('cart inquiry carries the real selections to the contact form without claiming a reservation', () => {
  const result = tourCartInquiry([{ tourId: 'tour-1', guests: 3, date: '2027-03-20' }, { tourId: 'tour-2', guests: 1, date: '' }], POPULAR_TOURS);
  assert.ok(result.message.includes(POPULAR_TOURS[0].title)); assert.ok(result.message.includes(POPULAR_TOURS[1].title));
  assert.ok(result.message.includes('۳ نفر')); assert.ok(result.message.includes('نیازمند هماهنگی'));
  const params = new URLSearchParams(result); assert.equal(params.get('message'), result.message); assert.ok(result.message.length < 3000); assert.ok(result.subject.length < 180);
  assert.ok(!/پرداخت موفق|بیمه صادر|بلیط|رزرو قطعی/.test(result.message));
});
