import { z } from 'zod';
import type { BookingCapabilities } from '../src/types/booking';
import { runtimeSetting } from './operationalSettings';
export class BookingError extends Error {
    constructor(public code: string, message: string, public status = 400) { super(message); }
}
export function bookingCapabilities(): BookingCapabilities {
    const payment=runtimeSetting('payment'),sms=runtimeSetting('sms'),requested=payment.mode;
    return { paymentMode: requested === 'sandbox' ? 'sandbox' : requested === 'http' && payment.baseUrl && payment.token ? 'http' : 'disabled', smsConfigured: !!(sms.enabled && sms.baseUrl && sms.token) };
}
async function providerRequest(kind: 'PAYMENT' | 'SMS', endpoint: string, body: unknown) {
    const config=runtimeSetting(kind==='PAYMENT'?'payment':'sms');
    const root = config.baseUrl;
    const token = config.token;
    if (!root || !token)
        throw new BookingError('PROVIDER_NOT_CONFIGURED', 'سرویس هنوز پیکربندی نشده است.', 503);
    const url = new URL(root.replace(/\/$/, '') + endpoint);
    if (url.protocol !== 'https:')
        throw new BookingError('INVALID_PROVIDER_URL', 'نشانی سرویس باید HTTPS باشد.', 503);
    try {
        const response = await fetch(url, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
        if (!response.ok)
            throw new Error('PROVIDER_ERROR');
        return await response.json();
    }
    catch {
        throw new BookingError('PROVIDER_UNAVAILABLE', 'پاسخ معتبر از سرویس دریافت نشد؛ وضعیت قطعی نشده است. دوباره پیگیری کن.', 503);
    }
}
export async function requestExternalPayment(input: {
    reference: string;
    paymentId: string;
    amount: number;
    callbackUrl: string;
}) {
    const result = z.object({ authority: z.string().min(1).max(200), paymentUrl: z.string().url() }).parse(await providerRequest('PAYMENT', '/payments/create', { ...input, amount: input.amount * 10, currency: 'IRR', idempotencyKey: input.paymentId }));
    if (new URL(result.paymentUrl).protocol !== 'https:')
        throw new BookingError('INVALID_PAYMENT_URL', 'نشانی درگاه معتبر نیست.', 503);
    return result;
}
export async function verifyExternalPayment(authority: string, paymentId: string, amount: number) {
    const result = z.object({ status: z.enum(['paid', 'failed', 'pending']), transactionId: z.string().max(200).optional(), amount: z.number().int(), currency: z.literal('IRR') }).parse(await providerRequest('PAYMENT', '/payments/verify', { authority, amount: amount * 10, currency: 'IRR', idempotencyKey: paymentId }));
    if (result.status === 'paid' && (result.amount !== amount * 10 || !result.transactionId))
        throw new BookingError('PAYMENT_MISMATCH', 'مبلغ یا شناسه تأیید پرداخت مطابقت ندارد؛ نیازمند بررسی است.', 409);
    return result;
}
export async function requestExternalRefund(reference: string, transactionId: string, amount: number) {
    const result = z.object({ status: z.enum(['refunded', 'pending']), amount: z.number().int(), currency: z.literal('IRR') }).parse(await providerRequest('PAYMENT', '/payments/refund', { transactionId, amount: amount * 10, currency: 'IRR', idempotencyKey: `refund:${reference}` }));
    if (result.amount !== amount * 10)
        throw new BookingError('REFUND_MISMATCH', 'مبلغ استرداد تأیید نشد.', 409);
    return result;
}
export async function sendBookingSms(reference: string, phone: string, text: string) { return z.object({ status: z.literal('sent'), messageId: z.string().min(1).max(200) }).parse(await providerRequest('SMS', '/messages/send', { phone, text, idempotencyKey: `booking:${reference}` })); }
