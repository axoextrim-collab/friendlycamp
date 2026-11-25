import type { Tour } from '../types';

export const TRAVEL_INTERESTS = [
  { id: 'forest', label: 'جنگل‌گردی' },
  { id: 'mountain', label: 'کوهستان' },
  { id: 'water', label: 'آبشار و دریاچه' },
  { id: 'wildlife', label: 'حیات وحش' },
  { id: 'camping', label: 'کمپ و شب‌مانی' },
] as const;
export type TravelInterest = (typeof TRAVEL_INTERESTS)[number]['id'];
export interface RecommendationPreferences {
  interests: TravelInterest[];
  region: 'all' | 'domestic' | 'international';
  maxDays: number | null;
  maxBudget: number | null;
}
export type RecommendationSort = 'match' | 'price' | 'duration';
export interface TourRecommendation {
  tour: Tour;
  matchedInterests: TravelInterest[];
  days: number | null;
  price: number | null;
  reasons: string[];
}

export function initialRecommendationPreferences(values: string[] = []): RecommendationPreferences {
  const aliases: Record<string, TravelInterest> = { jungle: 'forest', forest: 'forest', mountain: 'mountain', water: 'water', wildlife: 'wildlife', camping: 'camping' };
  return { interests: [...new Set(values.filter(value => Object.hasOwn(aliases, value)).map(value => aliases[value]))], region: 'all', maxDays: null, maxBudget: null };
}

function latinDigits(value: string): string {
  return value.replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit))).replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/٫/g, '.');
}

export function tourPriceInTomans(value: string): number | null {
  if (value.trim() === 'رایگان') return 0;
  if (/(?:ریال|دلار|یورو|پوند|[$€£¥]|USD|EUR|GBP|JPY)/i.test(value)) return null;
  const normalized = latinDigits(value).replace(/[,٬]/g, '');
  const numbers = normalized.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 1) return null;
  const multiplier = normalized.includes('میلیون') ? 1_000_000 : normalized.includes('هزار') ? 1000 : 1;
  const price = Number(numbers[0]) * multiplier;
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function tourDurationInDays(value: string): number | null {
  const days = Number(latinDigits(value).match(/(\d+)\s*روز/)?.[1]);
  return Number.isFinite(days) && days > 0 ? days : null;
}

export function tourInterests(tour: Tour): TravelInterest[] {
  const text = [tour.title, tour.location, ...tour.highlights].join(' ').replace(/\u200c/g, ' ');
  const patterns: Record<TravelInterest, RegExp> = {
    forest: /جنگل|هیرکانی|ییلاق/,
    mountain: /کوه|ارتفاع|صخره/,
    water: /آبشار|دریاچه|رودخانه/,
    wildlife: /حیات\s*وحش|سافاری/,
    camping: /کمپ|چادر|شب[‌\s-]*مانی/,
  };
  return TRAVEL_INTERESTS.filter(interest => patterns[interest.id].test(text)).map(interest => interest.id);
}

/** Interests rank eligible trips; region, duration and budget are never silently relaxed. */
export function recommendTours(tours: Tour[], preferences: RecommendationPreferences, sort: RecommendationSort = 'match'): TourRecommendation[] {
  const interests = [...new Set(preferences.interests)];
  const matches = tours.map((tour, index) => {
    const availableInterests = tourInterests(tour);
    const matchedInterests = interests.filter(interest => availableInterests.includes(interest));
    const days = tourDurationInDays(tour.duration);
    const price = tourPriceInTomans(tour.price);
    const country = tour.country.trim();
    const matchesRegion = preferences.region === 'all' || (country !== '' && (preferences.region === 'domestic' ? country === 'ایران' : country !== 'ایران'));
    const eligible = (!interests.length || matchedInterests.length > 0)
      && matchesRegion
      && (preferences.maxDays === null || (days !== null && days <= preferences.maxDays))
      && (preferences.maxBudget === null || (price !== null && price <= preferences.maxBudget));
    const reasons = matchedInterests.map(interest => `هم‌راستا با علاقهٔ تو به ${TRAVEL_INTERESTS.find(item => item.id === interest)!.label}`);
    if (preferences.maxDays !== null && days !== null) reasons.push(`مدت سفر ${days.toLocaleString('fa-IR')} روز، در بازهٔ زمانی انتخابی تو`);
    if (preferences.maxBudget !== null && price !== null) reasons.push('هزینهٔ درج‌شده در سقف بودجهٔ انتخابی توست');
    if (preferences.region !== 'all' && matchesRegion) reasons.push(preferences.region === 'domestic' ? 'مقصد داخل ایران است' : 'مقصد خارج از ایران است');
    return { tour, matchedInterests, days, price, reasons, index, eligible };
  }).filter(match => match.eligible);
  matches.sort((a, b) => {
    const difference = sort === 'price' ? (a.price ?? Infinity) - (b.price ?? Infinity)
      : sort === 'duration' ? (a.days ?? Infinity) - (b.days ?? Infinity)
      : b.matchedInterests.length - a.matchedInterests.length;
    return difference || a.index - b.index;
  });
  return matches.map(({ index, eligible, ...match }) => match);
}
