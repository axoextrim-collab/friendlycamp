import { boundedFetch } from './request';
import type { CartItem, PublicShopOrder, ShopCustomer, ShopInventoryInput, ShopOrder, ShopOrderStatus, ShopProduct, ShopQuote, ShopReceipt } from '../types/shop';

export class ShopApiError extends Error {
  constructor(message: string, public status: number, public code: string, public quote?: ShopQuote) { super(message); }
}
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await boundedFetch(url, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } }); }
  catch (error) { if (options.signal?.aborted) throw error; throw new ShopApiError('ارتباط برقرار نشد. اطلاعاتت حفظ شده؛ دوباره تلاش کن.', 0, 'NETWORK_ERROR'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ShopApiError(data?.message || (response.status === 429 ? 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کن.' : response.status === 401 || response.status === 403 ? 'برای این بخش با حساب مدیر وارد شو.' : response.status === 400 ? 'اطلاعات فرم کامل و معتبر نیست. فیلدها را بررسی کن.' : 'درخواست انجام نشد. دوباره تلاش کن.'), response.status, data?.error || 'REQUEST_FAILED', data?.quote);
  if (!data) throw new ShopApiError('پاسخ فروشگاه دریافت نشد. صفحه را دوباره بارگذاری کن.', 502, 'INVALID_RESPONSE');
  return data;
}
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
export const shopApi = {
  catalog: (signal?: AbortSignal) => request<{ products: ShopProduct[] }>('/api/shop/catalog', { signal }),
  quote: (items: CartItem[], signal?: AbortSignal) => request<{ quote: ShopQuote }>('/api/shop/quote', { ...post({ items }), signal }),
  order: (input: { items: CartItem[]; customer: ShopCustomer; consent: true; quoteRevision: string; requestKey: string }) => request<ShopReceipt>('/api/shop/orders', post(input)),
  track: (reference: string, trackingToken: string) => request<{ order: PublicShopOrder }>('/api/shop/orders/track', post({ reference, trackingToken })),
  cancel: (reference: string, trackingToken: string) => request<{ order: PublicShopOrder }>('/api/shop/orders/cancel', post({ reference, trackingToken })),
  inventory: () => request<{ products: Array<Record<string, unknown> & { id: string }> }>('/api/admin/shop/inventory'),
  saveInventory: (input: ShopInventoryInput) => request<{ product: Record<string, unknown> }>('/api/admin/shop/inventory', { method: 'PUT', body: JSON.stringify(input) }),
  orders: () => request<{ orders: ShopOrder[] }>('/api/admin/shop/orders'),
  updateOrder: (reference: string, input: { status: ShopOrderStatus; note: string; trackingNumber: string }) => request<{ order: ShopOrder }>(`/api/admin/shop/orders/${encodeURIComponent(reference)}`, { method: 'PATCH', body: JSON.stringify(input) }),
};
