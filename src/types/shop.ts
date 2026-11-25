export type ShopCategory = 'shelter' | 'sleep' | 'packs' | 'kitchen' | 'lighting' | 'trail';
export interface ShopProduct {
  id: string; inventoryId?: string; sku: string; name: string; brand: string; model: string; category: ShopCategory;
  image: string; description: string; summary: string; specs: Array<{ label: string; value: string }>;
  guide: string; source: string; weightGrams: number | null; activity: 'camping' | 'trekking' | 'both';
  price: number | null; stock: number | null; warranty?: string; salesEnabled?: boolean;
}
export type CartItem = { productId: string; quantity: number };
export interface QuoteLine { productId: string; inventoryId?: string; sku: string; name: string; image: string; quantity: number; unitPrice: number | null; lineTotal: number | null }
export interface ShopQuote { lines: QuoteLine[]; pricedSubtotal: number; unpricedCount: number; shipping: null; revision: string; currency: 'تومان' }
export interface ShopCustomer { fullName: string; phone: string; email: string; province: string; city: string; address: string; postalCode: string; notes: string }
export type ShopOrderStatus = 'awaiting_confirmation' | 'confirmed' | 'preparing' | 'dispatched' | 'completed' | 'cancelled';
export interface ShopOrder {
  id: string; reference: string; requestKey: string; requestHash: string; userId?: string;
  status: ShopOrderStatus; paymentStatus: 'unpaid'; customer: ShopCustomer; quote: ShopQuote; stockAllocated: boolean;
  createdAt: string; updatedAt: string; trackingNumber: string;
  history: Array<{ status: ShopOrderStatus; date: string; note: string }>;
}
export type PublicShopOrder = Omit<ShopOrder, 'id' | 'requestKey' | 'requestHash' | 'userId' | 'customer' | 'stockAllocated'> & { customer: { fullName: string; phoneMasked: string; city: string } };
export interface ShopReceipt { order: PublicShopOrder; trackingToken: string }
export interface ShopInventoryInput { id?: string; sku: string; title: string; category: ShopCategory; brand: string; model: string; price: number | null; stock: number | null; status: 'active' | 'inactive'; image: string; description: string; warranty: string; salesEnabled: boolean }
export const SHOP_CATEGORY_LABELS: Record<ShopCategory, string> = { shelter: 'چادر و سرپناه', sleep: 'کیسه‌خواب و زیرانداز', packs: 'کوله و حمل', kitchen: 'آشپزی و نوشیدنی', lighting: 'نور و انرژی', trail: 'پیمایش و مسیر' };
export const SHOP_ORDER_LABELS: Record<ShopOrderStatus, string> = { awaiting_confirmation: 'در انتظار بررسی فروشگاه', confirmed: 'تأیید و تخصیص موجودی', preparing: 'در حال آماده‌سازی', dispatched: 'تحویل به ارسال', completed: 'تکمیل‌شده', cancelled: 'لغوشده' };
