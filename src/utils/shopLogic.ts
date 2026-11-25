import { REFERENCE_GEAR } from '../data/shopCatalog';
import { SHOP_CATEGORY_LABELS, type CartItem, type ShopCategory, type ShopProduct } from '../types/shop';

export const SHOP_CART_KEY = 'fc-outdoor-cart-v1';
export const SHOP_FAVORITES_KEY = 'fc-outdoor-favorites-v1';
export const SHOP_RECEIPTS_KEY = 'fc-outdoor-receipts-v1';
export const normalizeShopText = (value: string) => value.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/\u200c/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

function integer(value: unknown, minimum: number): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/[,٬\s]/g, '').replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - 1776)));
  return Number.isSafeInteger(parsed) && parsed >= minimum && parsed <= 1e12 ? parsed : null;
}
export function localProductImage(value: unknown): string { return typeof value === 'string' && /^\/(?:images|uploads)\/[A-Za-z0-9_./-]+$/.test(value) && !value.includes('..') ? value : ''; }
export function productCategory(value: unknown): ShopCategory {
  if (typeof value === 'string' && Object.hasOwn(SHOP_CATEGORY_LABELS, value)) return value as ShopCategory;
  const text = String(value || '');
  return /خواب|زیرانداز/.test(text) ? 'sleep' : /کوله|حمل/.test(text) ? 'packs' : /آشپزی|ظروف|نوشیدنی/.test(text) ? 'kitchen' : /نور|انرژی|چراغ/.test(text) ? 'lighting' : /چادر|اقامت|کمپ/.test(text) ? 'shelter' : 'trail';
}
export function buildShopCatalog(records: Array<Record<string, unknown>>): ShopProduct[] {
  const referenceBySku = new Map(REFERENCE_GEAR.map(product => [product.sku, product]));
  const matches = new Map<string, Record<string, unknown>>();
  const standalone: ShopProduct[] = [];
  for (const record of records) {
    const sku = String(record.sku || '').trim();
    if (!sku || !record.id) continue;
    if (referenceBySku.has(sku)) { if (!matches.has(sku)) matches.set(sku, record); continue; }
    if (record.status !== 'active') continue;
    standalone.push(fromInventory(record));
  }
  const reference = REFERENCE_GEAR.flatMap(product => {
    const record = matches.get(product.sku);
    if (!record) return [{ ...product }];
    if (record.status !== 'active') return [];
    return [{ ...product, ...fromInventory(record, product), id: product.id }];
  });
  return [...reference, ...standalone];
}
function fromInventory(record: Record<string, unknown>, base?: ShopProduct): ShopProduct {
  const text = (key: string, fallback = '') => typeof record[key] === 'string' && (record[key] as string).trim() ? (record[key] as string).trim().slice(0, 2000) : fallback;
  return {
    id: base?.id || `inventory-${record.id}`, inventoryId: String(record.id), sku: String(record.sku).trim(), name: text('title', base?.name || 'تجهیزات طبیعت‌گردی'),
    brand: text('brand', base?.brand || ''), model: text('model', base?.model || ''), category: productCategory(record.category || base?.category),
    image: localProductImage(record.image) || base?.image || '', description: text('description', base?.description || 'این کالا در موجودی فروشگاه ثبت شده است. برای مشخصات مدل، اقلام بسته‌بندی و جزئیات انتخاب با پشتیبانی هماهنگ کن.'),
    summary: text('summary', base?.summary || 'از موجودی ثبت‌شده فروشگاه فرندلی کمپ'),
    specs: base?.specs || [{ label: 'کد کالا', value: String(record.sku) }, { label: 'دسته', value: SHOP_CATEGORY_LABELS[productCategory(record.category)] }],
    guide: base?.guide || 'پیش از نهایی شدن سفارش، نام مدل، اندازه و اقلام همراه را با فروشنده بررسی کن.', source: base?.source || '',
    weightGrams: base?.weightGrams || null, activity: base?.activity || 'both', price: integer(record.price, 1), stock: integer(record.stock, 0),
    warranty: text('warranty'), salesEnabled: record.salesEnabled === true,
  };
}
export function isOrderableProduct(product: ShopProduct): boolean {
  return !!product.inventoryId && product.salesEnabled === true && product.price !== null && product.price > 0 && product.stock !== null && product.stock > 0 && !!product.image && !!product.warranty?.trim();
}
export function publicShopCatalog(records: Array<Record<string, unknown>>): ShopProduct[] {
  return buildShopCatalog(records).filter(isOrderableProduct);
}
export function sanitizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const result = new Map<string, number>();
  for (const item of value.slice(0, 30)) if (item && typeof item.productId === 'string' && Number.isInteger(item.quantity) && item.quantity > 0) result.set(item.productId.slice(0, 120), Math.min(9, (result.get(item.productId) || 0) + item.quantity));
  return [...result].map(([productId, quantity]) => ({ productId, quantity }));
}
export interface ShopFilters { query: string; category: string; brands: string[]; availability: string; maxPrice: number | null; activity: string; maxWeight: number | null; favoritesOnly: boolean; favorites: string[]; sort: string }
export function filterShopProducts(products: ShopProduct[], filters: ShopFilters) {
  const query = normalizeShopText(filters.query);
  return products.filter(product => (!query || normalizeShopText(`${product.name} ${product.brand} ${product.model} ${product.sku}`).includes(query)) &&
    (filters.category === 'all' || product.category === filters.category) && (!filters.brands.length || filters.brands.includes(product.brand || 'بدون برند ثبت‌شده')) &&
    (filters.availability !== 'in_stock' || (product.stock !== null && product.stock > 0)) && (filters.availability !== 'inquiry' || product.stock === null || product.price === null) &&
    (filters.maxPrice === null || (product.price !== null && product.price <= filters.maxPrice)) &&
    (filters.activity === 'all' || product.activity === 'both' || product.activity === filters.activity) &&
    (filters.maxWeight === null || (product.weightGrams !== null && product.weightGrams <= filters.maxWeight)) &&
    (!filters.favoritesOnly || filters.favorites.includes(product.id))).sort((a, b) => {
      if (filters.sort === 'price_asc' || filters.sort === 'price_desc') { if (a.price === null) return b.price === null ? 0 : 1; if (b.price === null) return -1; return filters.sort === 'price_asc' ? a.price - b.price : b.price - a.price; }
      if (filters.sort === 'weight') return (a.weightGrams ?? Infinity) - (b.weightGrams ?? Infinity);
      return 0;
    });
}
