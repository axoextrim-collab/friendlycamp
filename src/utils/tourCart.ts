import type { Tour } from '../types';
import { tourPriceInTomans } from './tourRecommendations';

export const TOUR_CART_KEY = 'fc-tour-cart-v1';
export interface TourCartItem { tourId: string; guests: number; date: string }
export function sanitizeTourCart(value: unknown, tours?: Tour[]): TourCartItem[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.tourId !== 'string' || ids.has(item.tourId) || (tours && !tours.some(tour => tour.id === item.tourId))) return [];
    if (!Number.isSafeInteger(item.guests) || item.guests < 1) return [];
    ids.add(item.tourId);
    const date = typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && !Number.isNaN(Date.parse(item.date)) && new Date(item.date).toISOString().slice(0, 10) === item.date ? item.date : '';
    return [{ tourId: item.tourId, guests: Math.min(20, item.guests), date }];
  });
}
export function addTourToCart(items: TourCartItem[], tourId: string): TourCartItem[] { return items.some(item => item.tourId === tourId) ? items : [...items, { tourId, guests: 1, date: '' }]; }
export function tourCartEstimate(items: TourCartItem[], tours: Tour[]) {
  return items.reduce((total, item) => { const tour = tours.find(tour => tour.id === item.tourId); const price = tour ? tourPriceInTomans(tour.price) : null; return { amount: total.amount + (price ?? 0) * item.guests, unpriced: total.unpriced + (price === null ? 1 : 0) }; }, { amount: 0, unpriced: 0 });
}
export function tourCartInquiry(items: TourCartItem[], tours: Tour[]) {
  const lines = items.flatMap(item => { const tour = tours.find(tour => tour.id === item.tourId); return tour ? [`${tour.title}\nتعداد: ${item.guests.toLocaleString('fa-IR')} نفر\nتاریخ پیشنهادی: ${item.date ? new Date(`${item.date}T12:00:00Z`).toLocaleDateString('fa-IR', { timeZone: 'Asia/Tehran' }) : 'نیازمند هماهنگی'}`] : []; });
  return { subject: 'درخواست هماهنگی برنامه‌های انتخاب‌شده', message: `سلام، برای بررسی تاریخ، ظرفیت و هزینه نهایی این برنامه‌ها درخواست هماهنگی دارم:\n\n${lines.join('\n\n')}` };
}
