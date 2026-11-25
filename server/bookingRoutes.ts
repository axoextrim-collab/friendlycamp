import {asyncMap} from './asyncCollections';
import { withOperationalSettings } from './operationalSettings';

import { saleReadiness } from './travelReadiness';
import type express from 'express';
import rateLimit from 'express-rate-limit';
import { requirePermission, requireUser } from './auth';
import { managedTours, controlAudit } from './controlStore';
import { adminDepartures, bookingTours, quoteBooking, saveDeparture } from './bookingCatalog';
import { adminBookings, bookingPaymentReturn, cancelBooking, createReservation, deliverBookingSms, finishBookingRefund, retryBookingJobs, sandboxPayment, startBookingPayment, trackBooking, verifyBookingPayment } from './bookings';
import { bookingAccessSchema, paymentAccessSchema, reservationSchema, sandboxResultSchema, selectionSchema } from './bookingSchemas';
import { bookingCapabilities } from './bookingProviders';
import { readAdminDatabase } from './adminStore';
import { accountBookings, claimBooking } from './bookings';
export function registerBookingRoutes(app: express.Express, origin: string) {
    const limiter = rateLimit({ windowMs: 15 * 60000, limit: 60, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'TOO_MANY_REQUESTS', message: 'تعداد درخواست‌ها زیاد است؛ کمی بعد پیگیری کن.' } });
    app.use(['/api/tours', '/api/bookings', '/api/admin/booking', '/api/account/bookings'], (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
    const run = (handler: (req: express.Request, res: express.Response) => unknown) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            await handler(req, res);
        }
        catch (error) {
            next(error);
        }
    };
    app.get('/api/tours', run(async (_req, res) => res.json({ tours: await bookingTours(), capabilities: bookingCapabilities() })));
    app.get('/api/account/bookings', requireUser, run(async (req, res) => res.set('Cache-Control', 'no-store').json({ records: await accountBookings(req.user!.id) })));
    app.post('/api/account/bookings/claim', requireUser, run(async (req, res) => res.json({ booking: await claimBooking(bookingAccessSchema.parse(req.body), req.user!.id) })));
    app.post('/api/bookings/quote', run(async (req, res) => res.json({ quote: await quoteBooking(selectionSchema.parse(req.body)) })));
    app.post('/api/bookings/reservations', limiter, run(async (req, res) => {
        if (bookingCapabilities().paymentMode === 'http' && !req.user)
            return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'برای ثبت رزرو واقعی وارد حساب شو.' });
        return res.status(201).json(await createReservation(reservationSchema.parse(req.body), req.user?.id));
    }));
    app.post('/api/bookings/track', run(async (req, res) => res.json({ booking: await trackBooking(bookingAccessSchema.parse(req.body)) })));
    app.post('/api/bookings/payment/start', limiter, run(async (req, res) => res.json(await startBookingPayment(bookingAccessSchema.parse(req.body), origin))));
    app.post('/api/bookings/payment/verify', limiter, run(async (req, res) => { const result = await verifyBookingPayment(paymentAccessSchema.parse(req.body)); return res.status(result.processing ? 202 : 200).json(result); }));
    app.get('/api/bookings/payment-return/:id', run(async (req, res) => res.redirect(303, await bookingPaymentReturn(req.params.id, String(req.query.state || '')))));
    app.post('/api/bookings/sandbox/session', run(async (req, res) => res.json(await sandboxPayment(paymentAccessSchema.parse(req.body)))));
    app.post('/api/bookings/sandbox/complete', limiter, run(async (req, res) => res.json(await sandboxPayment(sandboxResultSchema.parse(req.body)))));
    app.post('/api/bookings/cancel', limiter, run(async (req, res) => res.json({ booking: await cancelBooking(bookingAccessSchema.parse(req.body)) })));
    app.get('/api/admin/booking/state', requirePermission('reservations'), run(async (_req, res) => res.json({ departures: await adminDepartures(), readiness: await asyncMap((await adminDepartures()), async (departure) => ({ departureId: departure.id, ...await saleReadiness(departure) })), bookings: await adminBookings(), capabilities: bookingCapabilities(), tours: (await managedTours()).map(tour => ({ id: tour.id, title: tour.title, price: tour.price, capacity: tour.capacity, status: tour.status })) })));
    app.post('/api/admin/booking/departures', requirePermission('reservations'), run(async (req, res) => res.status(201).json({ departure: await saveDeparture(req.body, req.user!.email) })));
    app.post('/api/admin/booking/reservations/:reference/retry-refund', requirePermission('reservations'), run(async (req, res) => res.json({ booking: await finishBookingRefund(req.params.reference) })));
    app.post('/api/admin/booking/reservations/:reference/retry-sms', requirePermission('reservations'), run(async (req, res) => { await deliverBookingSms(req.params.reference); return res.json({ capabilities: bookingCapabilities() }); }));
    const timer = setInterval(() => { withOperationalSettings(()=>retryBookingJobs()).catch(() => undefined); }, 30000);
    timer.unref();
}
