import {asyncMap} from './asyncCollections';

import { resolvedTravel } from './leaderCatalog';
import { bookingCapabilities } from './bookingProviders';
import { requireSaleReady, travelSnapshot, saleReadiness } from './travelReadiness';
import crypto from 'node:crypto';
import type { BookingQuote, BookingSelection, BookingTour, DepartureConfig, PublicDeparture } from '../src/types/booking';
import { readAdminDatabase } from './adminStore';
import { allocatedSeats, bookingAudit, bookingDb, bookingTransaction, expireBookingHolds } from './database';
import { departureSchema } from './bookingSchemas';
import { BookingError } from './bookingProviders';
import { managedTours, publishedTours, controlRecords, controlAudit } from './controlStore';
export const digest = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export async function departureConfig(id: string): Promise<DepartureConfig> {
    const row = await bookingDb().prepare('SELECT config FROM departures WHERE id=?').get(id);
    if (!row)
        throw new BookingError('DEPARTURE_NOT_FOUND', 'نوبت حرکت پیدا نشد.', 404);
    return JSON.parse(String(row.config));
}
export async function publicDeparture(config: DepartureConfig): Promise<PublicDeparture> { return { ...config, remaining: Math.max(0, config.capacity - config.externalSold - await allocatedSeats(config.id)) }; }
export async function saveDeparture(input: unknown, actor: string) {
    const parsed = departureSchema.parse(input);
    const tour = (await managedTours()).find(tour => tour.id === parsed.tourId);
    if (!tour)
        throw new BookingError('TOUR_NOT_FOUND', 'تور داشبورد پیدا نشد.', 404);
    if (parsed.active && ['cancelled', 'completed'].includes(parsed.movementStatus || ''))
        throw new BookingError('MOVEMENT_CLOSED', 'فروش حرکت لغوشده یا پایان‌یافته نمی‌تواند فعال باشد.', 400);
    if (parsed.active && Date.parse(parsed.startsAt) <= Date.now())
        throw new BookingError('DEPARTURE_IN_PAST', 'زمان حرکت فعال باید در آینده باشد.', 400);
    return await bookingTransaction(async () => {
        await expireBookingHolds();
        const id = parsed.id || crypto.randomUUID();
        const existing = await bookingDb().prepare('SELECT config FROM departures WHERE id=?').get(id);
        if (existing) {
            const old = JSON.parse(String(existing.config)) as DepartureConfig;
            if (parsed.revision !== old.revision)
                throw new BookingError('CONFIG_CHANGED', 'نوبت حرکت تغییر کرده؛ تازه‌سازی کن.', 409);
            if (old.tourId !== parsed.tourId)
                throw new BookingError('TOUR_CHANGED', 'تور نوبت حرکت قابل تغییر نیست.', 409);
        }
        if (parsed.capacity - parsed.externalSold < await allocatedSeats(id))
            throw new BookingError('CAPACITY_ALLOCATED', 'ظرفیت کمتر از صندلی‌های رزروشده است.', 409);
        const config: DepartureConfig = { ...parsed, id, revision: crypto.randomUUID() };
        await bookingDb().prepare('INSERT INTO departures(id,tour_id,config) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET config=excluded.config').run(id, parsed.tourId, JSON.stringify(config));
        await bookingAudit('departure.save', id, actor);
        await controlAudit(actor, 'departures', id, 'save', existing ? JSON.parse(String(existing.config)) : undefined, config);
        return await publicDeparture(config);
    });
}
export async function adminDepartures(): Promise<PublicDeparture[]> { await expireBookingHolds(); return await asyncMap((await bookingDb().prepare('SELECT config FROM departures').all()), async (row) => await publicDeparture(JSON.parse(String(row.config)))); }
export async function bookingTours(): Promise<BookingTour[]> {
    await expireBookingHolds();
    const tours = await publishedTours();
    const configs = (await bookingDb().prepare('SELECT config FROM departures').all()).map(row => JSON.parse(String(row.config)) as DepartureConfig);
    return await asyncMap(tours, async (tour) => {
        const departures = (await asyncMap(configs.filter(config => config.tourId === tour.id && config.active), async (config) => ({ ...await publicDeparture(config), onlineBookable: bookingCapabilities().paymentMode === 'http' && (await saleReadiness(config)).ready }))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
        const upcoming = departures.filter(item => Date.parse(item.startsAt) > Date.now());
        const price = upcoming.length ? Math.min(...upcoming.map(item => item.price)) : Number(tour.price) || 0;
        const image = String(tour.heroImage || tour.image || '');
        return { id: tour.id, title: String(tour.title || ''), country: String(tour.country || 'ایران'), location: String(tour.destination || ''), image: /^(\/images\/|\/uploads\/|https:\/\/images\.unsplash\.com\/)/.test(image) ? image : '/images/moments/camp.webp', duration: Number(tour.durationDays) ? `${Number(tour.durationDays).toLocaleString('fa-IR')} روز` : 'مدت ثبت نشده', price: price ? `${price.toLocaleString('fa-IR')} تومان` : 'قیمت ثبت نشده', rating: 0, reviewsCount: 0, highlights: typeof tour.included === 'string' ? tour.included.split(/[،,]/).filter(Boolean) : [], description: String(tour.summary || ''), category: String(tour.category || ''), travel: await resolvedTravel(tour), routeAvailable: Array.isArray(tour.route?.points) && tour.route.points.length >= 2, leaderName: String((await resolvedTravel(tour)).leaderName || (!tour.travel?.leaderId ? tour.leader : '') || ''), excluded: String(tour.excluded || ''), gallery: Array.isArray(tour.gallery) ? tour.gallery : [], itinerary: Array.isArray(tour.itinerary) ? tour.itinerary.map((day: any, index) => ({ day: index + 1, title: String(day.title || ''), description: String(day.description || '') })) : [], capacity: upcoming.reduce((sum, item) => sum + item.remaining, 0), departures };
    });
}
export async function quoteBooking(selection: BookingSelection): Promise<BookingQuote> {
    const tour = (await bookingTours()).find(tour => tour.departures.some(departure => departure.id === selection.departureId));
    if (!tour)
        throw new BookingError('TOUR_UNAVAILABLE', 'این نوبت برای فروش منتشر نشده است.', 409);
    return await calculateBookingQuote(selection, tour.title);
}
export async function calculateBookingQuote(selection: BookingSelection, title: string): Promise<BookingQuote> {
    const config = await departureConfig(selection.departureId);
    const remaining = (await publicDeparture(config)).remaining;
    if (!config.active || Date.parse(config.startsAt) <= Date.now())
        throw new BookingError('DEPARTURE_CLOSED', 'زمان فروش این نوبت پایان یافته است.', 409);
    await requireSaleReady(config);
    const travel = await travelSnapshot(config);
    const origin = config.origins.find(item => item.id === selection.originId);
    const tent = config.tents.find(item => item.id === selection.tentId);
    if (!origin || !tent)
        throw new BookingError('OPTION_UNAVAILABLE', 'مبدأ یا چادر انتخاب‌شده معتبر نیست.', 409);
    let extras = 0;
    for (const item of selection.extras) {
        const extra = config.extras.find(extra => extra.id === item.id);
        if (!extra || item.quantity > extra.maxQuantity)
            throw new BookingError('EXTRA_UNAVAILABLE', 'خدمت جانبی یا تعداد آن معتبر نیست.', 409);
        extras += extra.price * item.quantity;
    }
    const base = config.price * selection.guests;
    const discountPercent = selection.guests >= config.groupDiscount.minimum ? config.groupDiscount.percent : 0;
    const discount = Math.floor(base * discountPercent / 100);
    const tentUnits = Math.ceil(selection.guests / tent.capacity);
    const originTotal = origin.price * selection.guests;
    const tentTotal = tent.price * tentUnits;
    const code = selection.couponCode?.trim().toUpperCase();
    let coupon: BookingQuote['coupon'];
    let couponRevision: string | undefined;
    if (code) {
        const offer = (await controlRecords('coupons')).find(item => item.code === code && item.enabled);
        if (!offer || Date.parse(offer.validFrom) > Date.now() || Date.parse(offer.validUntil) <= Date.now() || base < offer.minAmount || offer.tourIds.length && !offer.tourIds.includes(config.tourId))
            throw new BookingError('INVALID_COUPON', 'کد تخفیف برای مبلغ، تور یا زمان انتخاب‌شده معتبر نیست.', 400);
        const uses = await bookingDb().prepare("SELECT count(*) AS n FROM reservations WHERE json_extract(payload,'$.quote.coupon.id')=? AND (state IN ('paid','refund_pending','refunded','review') OR (state='pending' AND allocated=1 AND expires_at>?))").get(offer.id, Date.now());
        if (Number(uses?.n) >= offer.maxUses)
            throw new BookingError('COUPON_EXHAUSTED', 'ظرفیت استفاده از کد تخفیف تکمیل شده است.', 409);
        coupon = { id: offer.id, code, discount: Math.min(base - discount, offer.kind === 'percent' ? Math.floor((base - discount) * offer.value / 100) : offer.value) };
        couponRevision = offer.revision;
    }
    return { revision: digest({ revision: config.revision, selection, ...(travel ? { travel } : {}), ...(couponRevision ? { couponRevision } : {}) }), selection, title, tourId: config.tourId, startsAt: config.startsAt, remaining, base, discount, discountPercent, origin: originTotal, originDetails: { title: origin.title, meetingPoint: origin.meetingPoint, departureTime: origin.departureTime }, tent: tentTotal, tentUnits, extras, total: base - discount - (coupon?.discount || 0) + originTotal + tentTotal + extras, ...(coupon ? { coupon } : {}), cancellation: config.cancellation, currency: 'تومان', ...(travel ? { travel } : {}) };
}
