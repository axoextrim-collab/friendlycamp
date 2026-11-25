import test from 'node:test';
import assert from 'node:assert/strict';
import { POPULAR_TOURS } from './fixtures/tours';
import { initialRecommendationPreferences, recommendTours, tourDurationInDays, tourPriceInTomans } from '../src/utils/tourRecommendations';

test('recommendations enforce budget, region and duration together', () => {
  const matches = recommendTours(POPULAR_TOURS, { ...initialRecommendationPreferences(), region: 'domestic', maxDays: 3, maxBudget: 5_000_000 });
  assert.deepEqual(matches.map(match => match.tour.id), ['tour-1']);
  assert.equal(matches[0].price, 4_800_000);
  assert.equal(matches[0].days, 3);
});

test('selected interests rank multiple real matches without assuming booking history', () => {
  const matches = recommendTours(POPULAR_TOURS, { ...initialRecommendationPreferences(), interests: ['forest', 'water'] });
  assert.deepEqual(matches.map(match => match.tour.id), ['tour-2', 'tour-5', 'tour-1']);
  assert.deepEqual(matches[0].matchedInterests, ['forest', 'water']);
  assert.equal(matches[0].reasons.length, 2);
});

test('no result does not silently drop incompatible constraints', () => {
  const preferences = { ...initialRecommendationPreferences(), region: 'international' as const, maxBudget: 10_000_000 };
  assert.equal(recommendTours(POPULAR_TOURS, preferences).length, 0);
  assert.equal(preferences.maxBudget, 10_000_000);
  assert.equal(preferences.region, 'international');
});

test('missing prices and durations are excluded when those values are constrained', () => {
  const unknown = { ...POPULAR_TOURS[0], id: 'unknown', price: 'نیازمند استعلام', duration: 'طبق برنامه' };
  assert.equal(recommendTours([unknown], initialRecommendationPreferences()).length, 1);
  assert.equal(recommendTours([unknown], { ...initialRecommendationPreferences(), maxDays: 7 }).length, 0);
  assert.equal(recommendTours([unknown], { ...initialRecommendationPreferences(), maxBudget: 20_000_000 }).length, 0);
});

test('Persian and Arabic prices and durations are parsed without currency ambiguity', () => {
  assert.equal(tourPriceInTomans('۴٬۸۰۰٬۰۰۰ تومان'), 4_800_000);
  assert.equal(tourPriceInTomans('٢٤,٥٠٠,٠٠٠ تومان'), 24_500_000);
  assert.equal(tourPriceInTomans('۴٫۸ میلیون تومان'), 4_800_000);
  assert.equal(tourPriceInTomans('رایگان'), 0);
  assert.equal(tourPriceInTomans('۵۰۰۰۰ ریال'), null);
  assert.equal(tourPriceInTomans('$100'), null);
  assert.equal(tourPriceInTomans('۱۰۰ دلار'), null);
  assert.equal(tourPriceInTomans('۵ تا ۷ میلیون تومان'), null);
  assert.equal(tourDurationInDays('۳ روز و ۲ شب'), 3);
  assert.equal(tourDurationInDays('٧ روز'), 7);
  assert.equal(tourDurationInDays('طبق برنامه'), null);
});

test('sorting and legacy preferences remain deterministic and bounded', () => {
  assert.deepEqual(initialRecommendationPreferences(['jungle', 'forest', 'unknown', '__proto__']).interests, ['forest']);
  const preferences = initialRecommendationPreferences();
  assert.deepEqual(recommendTours(POPULAR_TOURS, preferences, 'duration').map(match => match.days), [3, 5, 6, 7, 8]);
  assert.deepEqual(recommendTours(POPULAR_TOURS, preferences, 'price').map(match => match.price), [4_800_000, 24_500_000, 29_500_000, 32_000_000, 38_900_000]);
});
