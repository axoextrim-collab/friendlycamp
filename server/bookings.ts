import {asyncMap} from './asyncCollections';

import crypto from 'node:crypto';
import type { z } from 'zod';
import type { BookingAccess, BookingQuote, BookingReceipt, BookingState } from '../src/types/booking';
import { bookingAudit, bookingDb, bookingTransaction, expireBookingHolds } from './database';
import { calculateBookingQuote, digest, quoteBooking } from './bookingCatalog';
import { BookingError, bookingCapabilities, requestExternalPayment, requestExternalRefund, sendBookingSms, verifyExternalPayment } from './bookingProviders';
import type { reservationSchema } from './bookingSchemas';
type Row = {
    owner_id: string | null;
    reference: string;
    request_key: string;
    request_hash: string;
    departure_id: string;
    seats: number;
    state: BookingState;
    allocated: number;
    expires_at: number;
    created_at: number;
    payload: string;
    receipt_id: string | null;
    transaction_id: string | null;
    refund_amount: number;
    cancellation_fee: number;
};
type Payload = {
    quote: BookingQuote;
    passengers: Array<{
        fullName: string;
        nationalCode: string;
    }>;
    contact: {
        fullName: string;
        phone: string;
        email: string;
    };
    mode: 'sandbox' | 'http';
    consentAt: string;
};
type PaymentRow = {
    id: string;
    reference: string;
    mode: 'sandbox' | 'http';
    state: string;
    authority: string;
    start_url: string;
    result: string;
    updated_at: number;
};
function signature(value: string) {
    const secret = process.env.SESSION_SECRET;
    if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32))
        throw new BookingError('BOOKING_NOT_CONFIGURED', 'تنظیمات امنیت رزرو کامل نیست.', 503);
    return crypto.createHmac('sha256', secret || 'local-booking-sandbox-secret').update(value).digest('base64url');
}
const tokenFor = (row: Row) => signature(`${row.reference}:${row.request_key}`);
function equal(a: string, b: string) { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); }
async function rowFor(reference: string): Promise<Row> {
    const row = await bookingDb().prepare('SELECT * FROM reservations WHERE reference=?').get(reference) as unknown as Row;
    if (!row)
        throw new BookingError('BOOKING_NOT_FOUND', 'رزرو با این شماره و کد خصوصی پیدا نشد.', 404);
    return row;
}
async function access(input: BookingAccess) {
    const row = await rowFor(input.reference);
    if (!equal(tokenFor(row), input.token))
        throw new BookingError('BOOKING_NOT_FOUND', 'رزرو با این شماره و کد خصوصی پیدا نشد.', 404);
    return row;
}
async function receipt(row: Row): Promise<BookingReceipt> { const payload = JSON.parse(row.payload) as Payload; return { customerName: payload.contact.fullName, reference: row.reference, state: row.state, mode: payload.mode, quote: payload.quote, expiresAt: row.expires_at, receiptId: row.receipt_id, transactionId: row.transaction_id, refundAmount: row.refund_amount, cancellationFee: row.cancellation_fee, smsStatus: String((await bookingDb().prepare('SELECT state FROM sms_jobs WHERE reference=?').get(row.reference))?.state || 'not_requested'), passengers: payload.passengers.map(passenger => ({ fullName: passenger.fullName, nationalCodeMasked: '******' + passenger.nationalCode.slice(-4) })), contactPhoneMasked: payload.contact.phone.slice(0, 4) + '•••' + payload.contact.phone.slice(-4), createdAt: row.created_at, cancellationPreview: { allowed: row.state === 'pending' || (row.state === 'paid' && payload.quote.cancellation.enabled && Date.now() < Date.parse(payload.quote.startsAt) - payload.quote.cancellation.cutoffHours * 3600000), fee: row.state === 'paid' ? Math.floor(payload.quote.total * payload.quote.cancellation.feePercent / 100) : 0, refund: row.state === 'paid' ? payload.quote.total - Math.floor(payload.quote.total * payload.quote.cancellation.feePercent / 100) : 0 } }; }
export async function trackBooking(input: BookingAccess) { await expireBookingHolds(); return await receipt(await access(input)); }
export async function accountBookings(userId: string) { await expireBookingHolds(); return await asyncMap((await bookingDb().prepare('SELECT * FROM reservations WHERE owner_id=? ORDER BY created_at DESC LIMIT 100').all(userId)), async (value) => { const row = value as unknown as Row; return { booking: await receipt(row), access: { reference: row.reference, token: tokenFor(row) } }; }); }
export async function claimBooking(input: BookingAccess, userId: string) {
    const row = await access(input);
    return await bookingTransaction(async () => {
        const current = await rowFor(row.reference);
        if (current.owner_id && current.owner_id !== userId)
            throw new BookingError('BOOKING_NOT_FOUND', 'رزرو برای این حساب در دسترس نیست.', 404);
        await bookingDb().prepare('UPDATE reservations SET owner_id=? WHERE reference=?').run(userId, current.reference);
        await bookingAudit('reservation.claim', current.reference, userId);
        return await receipt(await rowFor(current.reference));
    });
}
export async function createReservation(input: z.infer<typeof reservationSchema>, userId?: string) {
    const known = await bookingDb().prepare('SELECT * FROM reservations WHERE request_key=?').get(input.requestKey) as unknown as Row | undefined;
    const hash = digest(input);
    if (known && String(known.owner_id || '') !== String(userId || ''))
        throw new BookingError('BOOKING_NOT_FOUND', 'رزرو پیدا نشد.', 404);
    if (known) {
        if (known.request_hash !== hash)
            throw new BookingError('IDEMPOTENCY_CONFLICT', 'این درخواست قبلاً با اطلاعات دیگری ثبت شده است.', 409);
        return { booking: await trackBooking({ reference: known.reference, token: tokenFor(known) }), token: tokenFor(known) };
    }
    const mode = bookingCapabilities().paymentMode;
    if (mode === 'disabled')
        throw new BookingError('PAYMENT_NOT_CONFIGURED', 'پرداخت هنوز فعال نیست؛ برای هماهنگی با پشتیبانی تماس بگیر.', 503);
    const preview = await quoteBooking(input.selection);
    if (preview.travel && (preview.travel.minAge !== null || preview.travel.maxAge !== null)) {
        for (const passenger of input.passengers) {
            if (!passenger.birthDate)
                throw new BookingError('BIRTH_DATE_REQUIRED', 'تاریخ تولد مسافران برای بررسی شرایط سنی این سفر لازم است.', 400);
            const birth = new Date(passenger.birthDate);
            const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tehran', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(preview.startsAt));
            const day = (key: string) => Number(parts.find(item => item.type === key)?.value);
            let age = day('year') - birth.getUTCFullYear();
            if (day('month') < birth.getUTCMonth() + 1 || day('month') === birth.getUTCMonth() + 1 && day('day') < birth.getUTCDate())
                age--;
            if (preview.travel.minAge !== null && age < preview.travel.minAge || preview.travel.maxAge !== null && age > preview.travel.maxAge)
                throw new BookingError('AGE_NOT_ELIGIBLE', 'سن یکی از مسافران خارج از محدوده ثبت‌شده این سفر است.', 400);
        }
    }
    return await bookingTransaction(async () => {
        await expireBookingHolds();
        const replay = await bookingDb().prepare('SELECT * FROM reservations WHERE request_key=?').get(input.requestKey) as unknown as Row | undefined;
        if (replay) {
            if (String(replay.owner_id || '') !== String(userId || ''))
                throw new BookingError('BOOKING_NOT_FOUND', 'رزرو پیدا نشد.', 404);
            if (replay.request_hash !== hash)
                throw new BookingError('IDEMPOTENCY_CONFLICT', 'درخواست تکراری متفاوت است.', 409);
            return { booking: await receipt(replay), token: tokenFor(replay) };
        }
        const quote = await calculateBookingQuote(input.selection, preview.title);
        if (quote.revision !== input.quoteRevision)
            throw new BookingError('QUOTE_CHANGED', 'قیمت یا شرایط حرکت تغییر کرده؛ پیش‌فاکتور را تازه کن.', 409);
        if (quote.remaining < input.selection.guests)
            throw new BookingError('CAPACITY_EXCEEDED', 'ظرفیت کافی برای این تعداد مسافر باقی نمانده است.', 409);
        const now = Date.now();
        const reference = `FCB-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
        const ttl = Math.min(1800, Math.max(1, Number(process.env.BOOKING_HOLD_SECONDS) || 900));
        const payload: Payload = { quote, passengers: input.passengers.map(passenger => ({ fullName: passenger.fullName, nationalCode: passenger.nationalCode! })), contact: { fullName: input.contact.fullName, phone: input.contact.phone!, email: input.contact.email! }, mode, consentAt: new Date(now).toISOString() };
        await bookingDb().prepare("INSERT INTO reservations(reference,request_key,request_hash,departure_id,seats,state,allocated,expires_at,created_at,payload,owner_id) VALUES(?,?,?,?,?,'pending',1,?,?,?,?)").run(reference, input.requestKey, hash, input.selection.departureId, input.selection.guests, now + ttl * 1000, now, JSON.stringify(payload), userId || null);
        await bookingAudit('reservation.hold', reference, 'customer');
        const row = await rowFor(reference);
        return { booking: await receipt(row), token: tokenFor(row) };
    });
}
async function paymentFor(id: string, reference: string): Promise<PaymentRow> {
    const payment = await bookingDb().prepare('SELECT * FROM payments WHERE id=? AND reference=?').get(id, reference) as unknown as PaymentRow;
    if (!payment)
        throw new BookingError('PAYMENT_NOT_FOUND', 'درخواست پرداخت پیدا نشد.', 404);
    return payment;
}
function callbackPath(paymentId: string) { return `/api/bookings/payment-return/${paymentId}?state=${signature('return:' + paymentId)}`; }
export async function startBookingPayment(input: BookingAccess, origin: string) {
    const row = await access(input);
    await expireBookingHolds();
    if ((await rowFor(row.reference)).state !== 'pending')
        throw new BookingError('BOOKING_NOT_PAYABLE', 'این رزرو قابل پرداخت نیست؛ وضعیت را پیگیری کن.', 409);
    const payload = JSON.parse(row.payload) as Payload;
    if (bookingCapabilities().paymentMode !== payload.mode)
        throw new BookingError('PAYMENT_MODE_CHANGED', 'تنظیمات پرداخت تغییر کرده؛ رزرو تازه لازم است.', 409);
    const payment = await bookingTransaction(async () => {
        const existing = await bookingDb().prepare('SELECT * FROM payments WHERE reference=?').get(row.reference) as unknown as PaymentRow | undefined;
        if (existing?.start_url)
            return existing;
        if (existing?.state === 'creating' && Date.now() - existing.updated_at < 30000)
            throw new BookingError('PAYMENT_STARTING', 'درخواست درگاه در حال ایجاد است؛ کمی بعد پیگیری کن.', 409);
        const id = existing?.id || crypto.randomUUID();
        await bookingDb().prepare("INSERT INTO payments(id,reference,mode,state,updated_at) VALUES(?,?,?,'creating',?) ON CONFLICT(reference) DO UPDATE SET state='creating',updated_at=excluded.updated_at").run(id, row.reference, payload.mode, Date.now());
        return await paymentFor(id, row.reference);
    });
    if (payment.start_url)
        return { paymentId: payment.id, paymentUrl: payment.start_url };
    try {
        const created = payload.mode === 'sandbox' ? { authority: 'sandbox:' + payment.id, paymentUrl: '/booking/test-payment#' + new URLSearchParams({ ...input, paymentId: payment.id }) } : await requestExternalPayment({ reference: row.reference, paymentId: payment.id, amount: payload.quote.total, callbackUrl: new URL(callbackPath(payment.id), origin).href });
        await bookingDb().prepare("UPDATE payments SET state='created',authority=?,start_url=?,updated_at=? WHERE id=?").run(created.authority, created.paymentUrl, Date.now(), payment.id);
        return { paymentId: payment.id, paymentUrl: created.paymentUrl };
    }
    catch (error) {
        await bookingDb().prepare("UPDATE payments SET state='start_failed',updated_at=? WHERE id=?").run(Date.now(), payment.id);
        throw error;
    }
}
export async function bookingPaymentReturn(id: string, state: string) {
    if (!equal(signature('return:' + id), state))
        throw new BookingError('INVALID_PAYMENT_RETURN', 'بازگشت پرداخت معتبر نیست.', 403);
    const payment = await bookingDb().prepare('SELECT * FROM payments WHERE id=?').get(id) as unknown as PaymentRow;
    if (!payment)
        throw new BookingError('PAYMENT_NOT_FOUND', 'پرداخت پیدا نشد.', 404);
    const row = await rowFor(payment.reference);
    return '/booking/return#' + new URLSearchParams({ reference: row.reference, token: tokenFor(row), paymentId: id });
}
export async function sandboxPayment(input: BookingAccess & {
    paymentId: string;
    result?: 'paid' | 'failed' | 'cancelled';
}) {
    const row = await access(input);
    const payment = await paymentFor(input.paymentId, row.reference);
    if (payment.mode !== 'sandbox' || bookingCapabilities().paymentMode !== 'sandbox')
        throw new BookingError('SANDBOX_DISABLED', 'پرداخت داخلی آزمایشی فعال نیست.', 403);
    if (input.result)
        await bookingTransaction(async () => {
            const current = await paymentFor(payment.id, row.reference);
            if (!current.result && current.state === 'created')
                await bookingDb().prepare('UPDATE payments SET result=?,updated_at=? WHERE id=?').run(input.result!, Date.now(), payment.id);
        });
    return { booking: await receipt(await rowFor(row.reference)), paymentId: payment.id, callbackUrl: callbackPath(payment.id) };
}
export async function verifyBookingPayment(input: BookingAccess & {
    paymentId: string;
}) {
    const row = await access(input);
    const payload = JSON.parse(row.payload) as Payload;
    const payment = await paymentFor(input.paymentId, row.reference);
    const claimed = await bookingTransaction(async () => {
        const current = await rowFor(row.reference);
        const p = await paymentFor(payment.id, row.reference);
        if (['paid', 'refunded', 'refund_pending'].includes(current.state) || p.state === 'verified' || p.state === 'failed')
            return false;
        if (p.state === 'verifying' && Date.now() - p.updated_at < 30000)
            return false;
        if (!p.authority)
            throw new BookingError('PAYMENT_NOT_STARTED', 'درخواست درگاه ایجاد نشده است.', 409);
        await bookingDb().prepare("UPDATE payments SET state='verifying',updated_at=? WHERE id=?").run(Date.now(), payment.id);
        return true;
    });
    if (!claimed)
        return { booking: await receipt(await rowFor(row.reference)), processing: (await paymentFor(payment.id, row.reference)).state === 'verifying' };
    try {
        const result = payment.mode === 'sandbox' ? { status: payment.result === 'paid' ? 'paid' : payment.result ? 'failed' : 'pending', transactionId: 'TEST-' + payment.id } : await verifyExternalPayment(payment.authority, payment.id, payload.quote.total);
        if (result.status === 'pending') {
            await bookingDb().prepare("UPDATE payments SET state='created',updated_at=? WHERE id=?").run(Date.now(), payment.id);
            return { booking: await receipt(await rowFor(row.reference)), processing: true };
        }
        await bookingTransaction(async () => {
            await expireBookingHolds();
            const current = await rowFor(row.reference);
            if (result.status === 'failed') {
                await bookingDb().prepare("UPDATE payments SET state='failed',updated_at=? WHERE id=?").run(Date.now(), payment.id);
                if (current.state !== 'paid')
                    await bookingDb().prepare("UPDATE reservations SET state='failed',allocated=0 WHERE reference=?").run(row.reference);
                await bookingAudit('payment.failed', row.reference, payment.mode);
                return;
            }
            const eligible = current.state === 'pending' && current.allocated === 1 && current.expires_at > Date.now();
            await bookingDb().prepare("UPDATE payments SET state='verified',updated_at=? WHERE id=?").run(Date.now(), payment.id);
            if (eligible) {
                await bookingDb().prepare("UPDATE reservations SET state='paid',receipt_id=?,transaction_id=? WHERE reference=?").run('FC-R-' + crypto.randomBytes(8).toString('hex').toUpperCase(), result.transactionId!, row.reference);
                await bookingDb().prepare("INSERT OR IGNORE INTO sms_jobs(reference,state,updated_at) VALUES(?,?,?)").run(row.reference, payment.mode === 'sandbox' ? 'sandbox_skipped' : bookingCapabilities().smsConfigured ? 'pending' : 'not_configured', Date.now());
                await bookingAudit('payment.verified', row.reference, payment.mode);
            }
            else {
                await bookingDb().prepare("UPDATE reservations SET state='refund_pending',allocated=0,transaction_id=?,refund_amount=? WHERE reference=?").run(result.transactionId!, payload.quote.total, row.reference);
                await bookingAudit('payment.late_refund', row.reference, payment.mode);
            }
        });
        if ((await rowFor(row.reference)).state === 'refund_pending')
            await finishBookingRefund(row.reference);
        await deliverBookingSms(row.reference);
        return { booking: await receipt(await rowFor(row.reference)), processing: false };
    }
    catch (error) {
        await bookingDb().prepare("UPDATE payments SET state=?,updated_at=? WHERE id=? AND state='verifying'").run(error instanceof BookingError && error.code === 'PAYMENT_MISMATCH' ? 'review' : 'created', Date.now(), payment.id);
        if (error instanceof BookingError && error.code === 'PAYMENT_MISMATCH')
            await bookingDb().prepare("UPDATE reservations SET state='review',allocated=0 WHERE reference=?").run(row.reference);
        throw error;
    }
}
export async function finishBookingRefund(reference: string) {
    const claimed = await bookingTransaction(async () => {
        const row = await rowFor(reference);
        if (row.state !== 'refund_pending')
            return false;
        const job = await bookingDb().prepare('SELECT * FROM refund_jobs WHERE reference=?').get(reference);
        if (job?.state === 'sending' && Date.now() - Number(job.updated_at) < 30000)
            return false;
        await bookingDb().prepare("INSERT INTO refund_jobs(reference,state,updated_at) VALUES(?,'sending',?) ON CONFLICT(reference) DO UPDATE SET state='sending',updated_at=excluded.updated_at").run(reference, Date.now());
        return true;
    });
    if (!claimed)
        return await receipt(await rowFor(reference));
    const row = await rowFor(reference);
    const payload = JSON.parse(row.payload) as Payload;
    try {
        const result = payload.mode === 'sandbox' || row.refund_amount === 0 ? { status: 'refunded' } : await requestExternalRefund(reference, row.transaction_id!, row.refund_amount);
        await bookingTransaction(async () => {
            await bookingDb().prepare('UPDATE refund_jobs SET state=?,updated_at=? WHERE reference=?').run(result.status, Date.now(), reference);
            if (result.status === 'refunded' && (await rowFor(reference)).state === 'refund_pending') {
                await bookingDb().prepare("UPDATE reservations SET state='refunded',allocated=0 WHERE reference=?").run(reference);
                await bookingAudit('refund.completed', reference, payload.mode);
            }
        });
        return await receipt(await rowFor(reference));
    }
    catch (error) {
        await bookingDb().prepare("UPDATE refund_jobs SET state='failed',updated_at=? WHERE reference=?").run(Date.now(), reference);
        throw error;
    }
}
export async function cancelBooking(input: BookingAccess) {
    await access(input);
    await bookingTransaction(async () => {
        await expireBookingHolds();
        const row = await rowFor(input.reference);
        if (['cancelled', 'refunded', 'refund_pending', 'failed', 'expired'].includes(row.state))
            return;
        if (await bookingDb().prepare("SELECT id FROM payments WHERE reference=? AND state='verifying'").get(row.reference))
            throw new BookingError('PAYMENT_VERIFYING', 'ابتدا بررسی پرداخت را کامل کن.', 409);
        if (row.state === 'pending') {
            await bookingDb().prepare("UPDATE reservations SET state='cancelled',allocated=0 WHERE reference=?").run(row.reference);
            await bookingAudit('reservation.cancelled', row.reference, 'customer');
            return;
        }
        if (row.state !== 'paid')
            throw new BookingError('BOOKING_REVIEW', 'وضعیت رزرو نیازمند بررسی پشتیبانی است.', 409);
        const payload = JSON.parse(row.payload) as Payload;
        const policy = payload.quote.cancellation;
        if (!policy.enabled || Date.now() >= Date.parse(payload.quote.startsAt) - policy.cutoffHours * 3600000)
            throw new BookingError('CANCELLATION_CLOSED', 'لغو آنلاین طبق شرایط این نوبت ممکن نیست؛ با پشتیبانی تماس بگیر.', 409);
        const fee = Math.floor(payload.quote.total * policy.feePercent / 100);
        await bookingDb().prepare("UPDATE reservations SET state='refund_pending',allocated=0,refund_amount=?,cancellation_fee=? WHERE reference=?").run(payload.quote.total - fee, fee, row.reference);
        await bookingAudit('refund.requested', row.reference, 'customer');
    });
    return (await rowFor(input.reference)).state === 'refund_pending' ? await finishBookingRefund(input.reference) : await receipt(await rowFor(input.reference));
}
export async function deliverBookingSms(reference: string) {
    if (!bookingCapabilities().smsConfigured)
        return;
    const row = await rowFor(reference);
    const payload = JSON.parse(row.payload) as Payload;
    if (payload.mode !== 'http' || row.state !== 'paid')
        return;
    const claimed = await bookingTransaction(async () => {
        const job = await bookingDb().prepare('SELECT * FROM sms_jobs WHERE reference=?').get(reference);
        if (!job || job.state === 'sent' || (job.state === 'sending' && Date.now() - Number(job.updated_at) < 30000))
            return false;
        await bookingDb().prepare("UPDATE sms_jobs SET state='sending',attempts=attempts+1,updated_at=? WHERE reference=?").run(Date.now(), reference);
        return true;
    });
    if (!claimed)
        return;
    try {
        const result = await sendBookingSms(reference, payload.contact.phone, `رزرو ${payload.quote.title} تأیید شد. شماره: ${reference}، رسید: ${row.receipt_id}، مبلغ: ${payload.quote.total.toLocaleString('fa-IR')} تومان.`);
        await bookingDb().prepare("UPDATE sms_jobs SET state='sent',message_id=?,updated_at=? WHERE reference=?").run(result.messageId, Date.now(), reference);
    }
    catch {
        await bookingDb().prepare("UPDATE sms_jobs SET state='failed',updated_at=? WHERE reference=?").run(Date.now(), reference);
    }
}
export async function retryBookingJobs() {
    if (!bookingCapabilities().smsConfigured)
        return;
    for (const job of await bookingDb().prepare("SELECT j.reference FROM sms_jobs j JOIN reservations r ON r.reference=j.reference WHERE j.state IN ('pending','failed','not_configured','sending') AND r.state='paid' AND j.attempts<5 LIMIT 10").all())
        await deliverBookingSms(String(job.reference));
}
export async function adminBookings() { await expireBookingHolds(); return await asyncMap((await bookingDb().prepare('SELECT * FROM reservations ORDER BY created_at DESC LIMIT 100').all()), async (row) => await receipt(row as unknown as Row)); }
