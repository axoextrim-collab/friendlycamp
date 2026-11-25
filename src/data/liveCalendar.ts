import { calendarCategory } from '../utils/travelFilters';
import type { BookingTour } from '../types/booking';
import type { Tour } from '../types';
export interface CalendarEvent { id: string; day: number; month: number; year: number; tour: Tour; shortTitle: string; departure: string; capacityLeft: number; totalCapacity: number; category: string }
export const CALENDAR_CATEGORIES = [{ id: 'all', label: 'همه سفرها' }, { id: 'rainforest', label: 'جنگل‌نوردی' }, { id: 'trekking', label: 'کوهستان' }, { id: 'weekend', label: 'آخر هفته' }, { id: 'family', label: 'خانوادگی' }, { id: 'vip', label: 'سفر ویژه' }];
export function buildCalendarData(tours: BookingTour[]) {
  const parts = (date: Date) => { const values = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date); const get = (key: string) => Number(values.find(item => item.type === key)?.value); return { year: get('year'), month: get('month'), day: get('day') }; };
  const events: CalendarEvent[] = tours.flatMap(tour => tour.departures.filter(departure => departure.active && Date.parse(departure.startsAt) > Date.now()).map(departure => { const date = new Date(departure.startsAt); return { id: departure.id, ...parts(date), tour: { ...tour, price: `${departure.price.toLocaleString('fa-IR')} تومان` }, shortTitle: tour.title, departure: date.toLocaleTimeString('fa-IR', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit' }), capacityLeft: departure.remaining, totalCapacity: departure.capacity, category: calendarCategory(tour) }; }));
  const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const months = [...new Map((events.length ? events : [parts(new Date())]).map(item => [`${item.year}-${item.month}`, { number: item.month, year: item.year, name: monthNames[item.month - 1], season: ['بهار', 'تابستان', 'پاییز', 'زمستان'][Math.floor((item.month - 1) / 3)] }])).values()].sort((a, b) => a.year - b.year || a.number - b.number);
  return { CALENDAR_EVENTS: events, CALENDAR_MONTHS: months, CALENDAR_TOUR_PHOTOS: Object.fromEntries(tours.map(tour => [tour.id, { src: tour.image, source: tour.image, credit: undefined as { author: string; licenseUrl: string; license: string } | undefined }])) };
}
