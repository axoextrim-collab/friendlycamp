import crypto from 'node:crypto';
import { mutateAdminDatabase, readAdminDatabase, type AdminDatabase, type AdminRecord } from './adminStore';
import { publicShopCatalog } from '../src/utils/shopLogic';
import type { CartItem, PublicShopOrder, ShopCustomer, ShopInventoryInput, ShopOrder, ShopOrderStatus, ShopQuote, ShopReceipt } from '../src/types/shop';
export class ShopError extends Error {
    constructor(public code: string, message: string, public status = 400, public quote?: ShopQuote) { super(message); }
}
const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
function trackingToken(order: ShopOrder) {
    const secret = process.env.SESSION_SECRET;
    if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32))
        throw new ShopError('STORE_NOT_CONFIGURED', 'پیکربندی ثبت سفارش کامل نیست. با پشتیبانی تماس بگیر.', 503);
    return crypto.createHmac('sha256', secret || 'friendly-development-order-tracking-only').update(`${order.id}:${order.requestKey}`).digest('base64url');
}
function publicOrder(order: ShopOrder): PublicShopOrder {
    return { reference: order.reference, status: order.status, paymentStatus: order.paymentStatus, quote: order.quote, createdAt: order.createdAt, updatedAt: order.updatedAt,
        trackingNumber: order.trackingNumber, history: order.history,
        customer: { fullName: order.customer.fullName, city: order.customer.city, phoneMasked: `${order.customer.phone.slice(0, 4)}•••${order.customer.phone.slice(-4)}` } };
}
const receipt = (order: ShopOrder): ShopReceipt => ({ order: publicOrder(order), trackingToken: trackingToken(order) });
function findTrackedOrder(data: AdminDatabase, reference: string, token: string) {
    const order = data.shopOrders?.find(item => item.reference === reference);
    if (!order)
        throw new ShopError('ORDER_NOT_FOUND', 'سفارش با این شماره و کد خصوصی پیدا نشد.', 404);
    const expected = Buffer.from(trackingToken(order));
    const candidate = Buffer.from(token);
    if (candidate.length !== expected.length || !crypto.timingSafeEqual(candidate, expected))
        throw new ShopError('ORDER_NOT_FOUND', 'سفارش با این شماره و کد خصوصی پیدا نشد.', 404);
    return order;
}
export async function shopCatalog() { return publicShopCatalog((await readAdminDatabase()).products); }
export function quoteFromInventory(items: CartItem[], products: AdminRecord[]): ShopQuote {
    const catalog = publicShopCatalog(products);
    const used = new Set<string>();
    const lines = items.map(item => {
        if (used.has(item.productId))
            throw new ShopError('DUPLICATE_ITEM', 'هر کالا را یک بار در سبد وارد کن و تعداد آن را تغییر بده.');
        used.add(item.productId);
        const product = catalog.find(product => product.id === item.productId);
        if (!product)
            throw new ShopError('PRODUCT_UNAVAILABLE', 'یکی از کالاها دیگر در کاتالوگ فعال نیست. سبد را بازبینی کن.', 409);
        if (product.stock !== null && item.quantity > product.stock)
            throw new ShopError('INSUFFICIENT_STOCK', `موجودی «${product.name}» برای تعداد انتخابی کافی نیست.`, 409);
        return { productId: product.id, inventoryId: product.inventoryId, sku: product.sku, name: product.name, image: product.image, quantity: item.quantity, unitPrice: product.price, lineTotal: product.price === null ? null : product.price * item.quantity };
    });
    const stockVersion = items.map(item => [item.productId, catalog.find(product => product.id === item.productId)?.stock]);
    return { lines, pricedSubtotal: lines.reduce((sum, line) => sum + (line.lineTotal || 0), 0), unpricedCount: lines.filter(line => line.unitPrice === null).length,
        shipping: null, currency: 'تومان', revision: hash(JSON.stringify({ lines, stockVersion })) };
}
export async function shopQuote(items: CartItem[]) { return quoteFromInventory(items, (await readAdminDatabase()).products); }
export async function createShopOrder(input: {
    items: CartItem[];
    customer: ShopCustomer;
    consent: true;
    quoteRevision: string;
    requestKey: string;
}, userId?: string) {
    return await mutateAdminDatabase(data => {
        const requestHash = hash(JSON.stringify(input));
        const previous = data.shopOrders?.find(order => order.requestKey === input.requestKey);
        if (previous) {
            if (previous.requestHash !== requestHash)
                throw new ShopError('REQUEST_CHANGED', 'اطلاعات این درخواست تغییر کرده است. سفارش را دوباره بررسی کن.', 409);
            return receipt(previous);
        }
        const quote = quoteFromInventory(input.items, data.products);
        if (quote.revision !== input.quoteRevision)
            throw new ShopError('CART_CHANGED', 'قیمت یا موجودی سبد تغییر کرده است. جمع تازه را بررسی و دوباره تأیید کن.', 409, quote);
        const order: ShopOrder = {
            id: crypto.randomUUID(), reference: `FC-S-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
            requestKey: input.requestKey, requestHash, userId, customer: input.customer, quote, status: 'awaiting_confirmation', paymentStatus: 'unpaid', stockAllocated: false,
            createdAt: now(), updatedAt: now(), trackingNumber: '', history: [{ status: 'awaiting_confirmation', date: now(), note: 'درخواست سفارش دریافت شد؛ در انتظار بررسی قیمت، موجودی و ارسال.' }],
        };
        const result = receipt(order); // Validate tracking configuration before committing the order.
        data.shopOrders ||= [];
        data.shopOrders.unshift(order);
        data.audit.unshift({ id: crypto.randomUUID(), updatedAt: now(), action: 'shop.order.create', resource: 'shop-orders', recordId: order.reference, actor: userId || 'guest' });
        return result;
    });
}
export async function trackShopOrder(reference: string, token: string) { return publicOrder(findTrackedOrder(await readAdminDatabase(), reference, token)); }
export async function cancelShopOrder(reference: string, token: string) {
    return await mutateAdminDatabase(data => {
        const order = findTrackedOrder(data, reference, token);
        if (order.status === 'cancelled')
            return publicOrder(order);
        if (!['awaiting_confirmation', 'confirmed'].includes(order.status))
            throw new ShopError('CANNOT_CANCEL', 'این سفارش وارد مرحله اجرا شده است. برای بررسی لغو با پشتیبانی هماهنگ کن.', 409);
        releaseStock(data, order);
        order.status = 'cancelled';
        order.updatedAt = now();
        order.history.push({ status: 'cancelled', date: now(), note: 'درخواست سفارش توسط مشتری لغو شد.' });
        data.audit.unshift({ id: crypto.randomUUID(), updatedAt: now(), action: 'shop.order.cancel', resource: 'shop-orders', recordId: order.reference, actor: 'customer' });
        return publicOrder(order);
    });
}
function releaseStock(data: AdminDatabase, order: ShopOrder) {
    if (!order.stockAllocated)
        return;
    for (const line of order.quote.lines) {
        const product = data.products.find(item => item.id === line.inventoryId);
        if (product) {
            product.stock = Number(product.stock || 0) + line.quantity;
            product.updatedAt = now();
        }
    }
    order.stockAllocated = false;
}
export async function adminShopOrders() { return (await readAdminDatabase()).shopOrders || []; }
export async function updateShopOrder(reference: string, input: {
    status: ShopOrderStatus;
    note: string;
    trackingNumber: string;
}, actor: string) {
    return await mutateAdminDatabase(data => {
        const order = data.shopOrders?.find(item => item.reference === reference);
        if (!order)
            throw new ShopError('ORDER_NOT_FOUND', 'سفارش پیدا نشد.', 404);
        const transitions: Record<ShopOrderStatus, ShopOrderStatus[]> = { awaiting_confirmation: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['dispatched', 'cancelled'], dispatched: ['completed'], completed: [], cancelled: [] };
        if (input.status !== order.status && !transitions[order.status].includes(input.status))
            throw new ShopError('INVALID_TRANSITION', 'این تغییر وضعیت برای سفارش مجاز نیست.', 409);
        if (input.status === 'confirmed' && !order.stockAllocated) {
            const quote = quoteFromInventory(order.quote.lines.map(line => ({ productId: line.productId, quantity: line.quantity })), data.products);
            if (quote.lines.some(line => line.unitPrice === null || !line.inventoryId))
                throw new ShopError('PRICING_REQUIRED', 'ابتدا قیمت و موجودی تمام کدهای کالا را در مدیریت محصولات ثبت کن.', 409);
            for (const line of quote.lines) {
                const product = data.products.find(item => item.id === line.inventoryId)!;
                if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < line.quantity)
                    throw new ShopError('INSUFFICIENT_STOCK', 'موجودی کافی برای تخصیص سفارش وجود ندارد.', 409);
                product.stock = Number(product.stock) - line.quantity;
                product.updatedAt = now();
            }
            order.quote = quote;
            order.stockAllocated = true;
        }
        if (input.status === 'cancelled')
            releaseStock(data, order);
        if (input.status === 'dispatched' && !input.trackingNumber)
            throw new ShopError('TRACKING_REQUIRED', 'کد یا مشخصات پیگیری ارسال را وارد کن.');
        order.status = input.status;
        order.updatedAt = now();
        order.trackingNumber = input.trackingNumber;
        order.history.push({ status: input.status, date: now(), note: input.note || 'وضعیت سفارش توسط فروشگاه به‌روز شد.' });
        data.audit.unshift({ id: crypto.randomUUID(), updatedAt: now(), action: 'shop.order.update', resource: 'shop-orders', recordId: order.reference, actor });
        return order;
    });
}
export async function adminShopInventory() { return (await readAdminDatabase()).products; }
export async function saveShopInventory(input: ShopInventoryInput, actor: string) {
    return await mutateAdminDatabase(data => {
        if (data.products.some(item => String(item.sku).trim() === input.sku && item.id !== input.id))
            throw new ShopError('SKU_EXISTS', 'این کد کالا قبلاً ثبت شده است.', 409);
        const current = input.id ? data.products.find(item => item.id === input.id) : undefined;
        if (input.id && !current)
            throw new ShopError('PRODUCT_NOT_FOUND', 'کالای انبار پیدا نشد.', 404);
        const record: AdminRecord = { ...current, ...input, id: current?.id || crypto.randomUUID(), updatedAt: now(), reorderPoint: current?.reorderPoint || 0 };
        if (current)
            data.products[data.products.findIndex(item => item.id === current.id)] = record;
        else
            data.products.unshift(record);
        data.audit.unshift({ id: crypto.randomUUID(), updatedAt: now(), action: 'shop.inventory.save', resource: 'products', recordId: record.id, actor, before: current, after: record });
        return record;
    });
}
