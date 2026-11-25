import type { BookingAccess, BookingCapabilities, BookingContact, BookingQuote, BookingReceipt, BookingSelection, BookingTour, Passenger } from '../types/booking';
export class BookingApiError extends Error { constructor(message: string, public code: string, public status: number) { super(message); } }
async function request<T>(url: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json().catch(() => null); if (!response.ok) throw new BookingApiError(data?.message || data?.issues?.[0]?.message || 'درخواست انجام نشد. دوباره تلاش کن.', data?.error || 'REQUEST_FAILED', response.status); if (!data) throw new Error('پاسخ سرور معتبر نیست.'); return data;
}
export const bookingApi = {
  catalog: async (signal?: AbortSignal) => {
    const result = await request<{ tours: BookingTour[]; capabilities: BookingCapabilities }>('/api/tours', undefined, signal);
    if (!Array.isArray(result.tours) || !result.capabilities || !['disabled', 'sandbox', 'http'].includes(result.capabilities.paymentMode) || result.tours.some(tour => !tour || !['id', 'title', 'country', 'location', 'image', 'duration', 'price'].every(field => typeof (tour as unknown as Record<string, unknown>)[field] === 'string') || !Array.isArray(tour.departures) || !Array.isArray(tour.highlights))) throw new Error('اطلاعات دریافت‌شده برای فهرست سفرها معتبر نیست. دوباره تلاش کن.');
    return result;
  },
  quote: (selection: BookingSelection, signal?: AbortSignal) => request<{ quote: BookingQuote }>('/api/bookings/quote', selection, signal),
  reserve: (input: { selection: BookingSelection; quoteRevision: string; passengers: Passenger[]; contact: BookingContact; consent: true; requestKey: string }) => request<{ booking: BookingReceipt; token: string }>('/api/bookings/reservations', input),
  startPayment: (access: BookingAccess) => request<{ paymentId: string; paymentUrl: string }>('/api/bookings/payment/start', { reference: access.reference, token: access.token }),
  verify: (access: BookingAccess & { paymentId: string }, signal?: AbortSignal) => request<{ booking: BookingReceipt; processing: boolean }>('/api/bookings/payment/verify', access, signal),
  track: (access: BookingAccess, signal?: AbortSignal) => request<{ booking: BookingReceipt }>('/api/bookings/track', { reference: access.reference, token: access.token }, signal),
  cancel: (access: BookingAccess) => request<{ booking: BookingReceipt }>('/api/bookings/cancel', { reference: access.reference, token: access.token }),
  sandbox: (access: BookingAccess & { paymentId: string; result?: 'paid' | 'failed' | 'cancelled' }) => request<{ booking: BookingReceipt; callbackUrl: string }>(access.result ? '/api/bookings/sandbox/complete' : '/api/bookings/sandbox/session', access),
};
