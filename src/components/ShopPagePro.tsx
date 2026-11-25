import {accountDestination,hasManagementAccess} from '../routing/accountDestination';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpLeft, Check, ClipboardList, Headphones, Heart, LoaderCircle, PackageSearch, Scale, Search, ShoppingBag, SlidersHorizontal, UserRound, X } from 'lucide-react';
import { authApi, type AuthUser } from '../api/auth';
import { ShopApiError, shopApi } from '../api/shop';
import { useDesignSettings } from '../hooks/useDesignSettings';
import { SHOP_CATEGORY_LABELS, type CartItem, type ShopCustomer, type ShopProduct, type ShopQuote, type ShopReceipt } from '../types/shop';
import { filterShopProducts, sanitizeCart, SHOP_CART_KEY, SHOP_FAVORITES_KEY, SHOP_RECEIPTS_KEY, type ShopFilters } from '../utils/shopLogic';
import { FriendlyCampLogo } from './FriendlyCampLogo';
import { StoreCatalog, StoreCategories, StoreFilters, StoreHero } from './shop/StoreCatalog';
import { StoreProduct } from './shop/StoreProduct';
import { emptyShopCustomer, OrderReceipt, StoreCheckout } from './shop/StoreCheckout';
import { CartDialog, CompareDialog, TrackingDialog, type SavedReceipt } from './shop/StoreOverlays';
import { EmptyShop, ShopDialog } from './shop/ShopUI';
import { StoreManagement } from './shop/StoreManagement';
import './shop/shop.css';
import { navigateTo } from '../routing/navigation';
import { productPath, resolveRoute } from '../routing/routes';
import { applyPageMetadata, routeMetadata } from '../routing/metadata';

type View = 'catalog' | 'product' | 'checkout' | 'receipt' | 'manage';
type Overlay = 'cart' | 'filters' | 'compare' | 'tracking' | 'guide' | null;
const readJson = (key: string): unknown => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const readFavorites = () => { const value = readJson(SHOP_FAVORITES_KEY); return Array.isArray(value) ? value.filter(item => typeof item === 'string').slice(0, 200) as string[] : []; };
const readReceipts = () => { const value = readJson(SHOP_RECEIPTS_KEY); return Array.isArray(value) ? value.filter(item => item && typeof item.reference === 'string' && typeof item.trackingToken === 'string').slice(0, 5) as SavedReceipt[] : []; };
const defaultFilters = (): ShopFilters => ({ query: '', category: 'all', brands: [], availability: 'all', maxPrice: null, activity: 'all', maxWeight: null, favoritesOnly: false, favorites: [], sort: 'featured' });
function routeFromUrl(): { view: View; productId: string } { const route = resolveRoute(window.location.pathname); return { view: route.kind === 'product' ? 'product' : route.kind === 'checkout' ? 'checkout' : route.kind === 'shop-manage' ? 'manage' : 'catalog', productId: route.id || '' }; }

export function ShopPage({ onBack, onSupport }: { onBack: () => void; onSupport: () => void }) {
  const initialRoute = useRef(routeFromUrl());
  const [view, setView] = useState<View>(initialRoute.current.view); const [productId, setProductId] = useState(initialRoute.current.productId);
  const [overlay, setOverlay] = useState<Overlay>(null); const [products, setProducts] = useState<ShopProduct[]>([]); const [loading, setLoading] = useState(true); const [catalogError, setCatalogError] = useState('');
  const [filters, setFilters] = useState<ShopFilters>(() => { const value = defaultFilters(); const category = new URLSearchParams(location.search).get('category'); if (category && category in SHOP_CATEGORY_LABELS) value.category = category; return value; });
  const [gridView, setGridView] = useState<'grid' | 'list'>('grid'); const [favorites, setFavorites] = useState<string[]>(readFavorites); const [compared, setCompared] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => sanitizeCart(readJson(SHOP_CART_KEY))); const [quote, setQuote] = useState<ShopQuote | null>(null); const [quoteLoading, setQuoteLoading] = useState(false); const [quoteError, setQuoteError] = useState('');
  const [refresh, setRefresh] = useState(0); const [quoteRefresh, setQuoteRefresh] = useState(0); const [notice, setNotice] = useState('');
  const [customer, setCustomer] = useState<ShopCustomer>(emptyShopCustomer); const [orderPending, setOrderPending] = useState(false); const [orderError, setOrderError] = useState('');
  const [receipt, setReceipt] = useState<ShopReceipt | null>(null); const [savedReceipts, setSavedReceipts] = useState<SavedReceipt[]>(readReceipts); const [user, setUser] = useState<AuthUser | null>(null);
  const orderLock = useRef(false); const requestRef = useRef<{ fingerprint: string; key: string } | null>(null); const headingRef = useRef<HTMLDivElement>(null);
  const designSettings = useDesignSettings();

  useEffect(() => { let active = true; authApi.me().then(result => { if (active) { setUser(result.user); setCustomer(current => ({ ...current, fullName: current.fullName || result.user.fullName, phone: current.phone || result.user.phone, email: current.email || result.user.email })); } }).catch(() => undefined); return () => { active = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController(); setCatalogError(''); if (!products.length) setLoading(true);
    shopApi.catalog(controller.signal).then(result => { if (!controller.signal.aborted) { if (!Array.isArray(result.products)) throw new Error('کاتالوگ معتبر دریافت نشد.'); setProducts(result.products); } }).catch(error => { if (!controller.signal.aborted) setCatalogError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    if (loading || catalogError) return;
    const next = cart.flatMap(item => { const product = products.find(product => product.id === item.productId); if (!product || product.stock === 0) return []; return [{ ...item, quantity: Math.min(item.quantity, product.stock ?? 9, 9) }]; });
    if (JSON.stringify(next) !== JSON.stringify(cart)) { setCart(next); setNotice('تغییر موجودی بررسی شد و سبد به‌روز شد. اقلام و تعدادها را بازبینی کن.'); }
  }, [products, loading, catalogError]);
  useEffect(() => { try { localStorage.setItem(SHOP_CART_KEY, JSON.stringify(cart)); } catch { setNotice('ذخیره سبد در مرورگر ممکن نشد؛ سبد تا زمانی که این صفحه باز است حفظ می‌شود.'); } }, [cart]);
  useEffect(() => { try { localStorage.setItem(SHOP_FAVORITES_KEY, JSON.stringify(favorites)); } catch { setNotice('ذخیره علاقه‌مندی‌ها در این مرورگر ممکن نیست.'); } }, [favorites]);
  useEffect(() => {
    if (!cart.length || loading || catalogError) { setQuote(null); setQuoteLoading(false); setQuoteError(''); return; }
    const controller = new AbortController(); setQuoteLoading(true); setQuoteError('');
    const timer = setTimeout(() => { shopApi.quote(cart, controller.signal).then(result => { if (!controller.signal.aborted) setQuote(result.quote); }).catch(error => { if (!controller.signal.aborted) { setQuote(null); setQuoteError(error.message); } }).finally(() => { if (!controller.signal.aborted) setQuoteLoading(false); }); }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [cart, loading, products, catalogError, quoteRefresh]);
  useEffect(() => { const sync = () => { const next = routeFromUrl(); setView(next.view); setProductId(next.productId); setOverlay(null); }; window.addEventListener('popstate', sync); window.addEventListener('fc-location-change', sync); return () => { window.removeEventListener('popstate', sync); window.removeEventListener('fc-location-change', sync); }; }, []);
  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [view, productId]);

  const go = useCallback((next: View, id = '') => {
    if (orderLock.current) return;
    setView(next); setProductId(id); setOverlay(null); setOrderError('');
    navigateTo(next === 'product' ? productPath(id) : next === 'checkout' || next === 'manage' ? `/shop/${next}` : '/shop');
  }, []);
  const catalogAnchor = () => requestAnimationFrame(() => document.getElementById('fs-catalog')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }));
  const chooseCategory = (category: string) => { if (view !== 'catalog') go('catalog'); setFilters(current => ({ ...current, category, favoritesOnly: false })); catalogAnchor(); };
  const changeFilters = (next: ShopFilters) => { setFilters(next); };
  const resetFilters = () => setFilters(defaultFilters());
  const cartMap = useMemo(() => Object.fromEntries(cart.map(item => [item.productId, item.quantity])), [cart]);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const appliedFilters = useMemo(() => ({ ...filters, favorites }), [filters, favorites]);
  const filtered = useMemo(() => filterShopProducts(products, appliedFilters), [products, appliedFilters]);
  const selected = products.find(product => product.id === productId);
  useEffect(() => { if (!loading && !catalogError) applyPageMetadata(routeMetadata(resolveRoute(window.location.pathname), products)); }, [view, productId, products, loading, catalogError]);
  useEffect(() => {
    if (!orderPending) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [orderPending]);
  function quantity(id: string, value: number) {
    const product = products.find(item => item.id === id); if (!product) return;
    if (value > 0 && !cartMap[id] && cart.length >= 30) { setNotice('حداکثر ۳۰ مدل را در یک سبد انتخاب کن. برای سفارش بیشتر با پشتیبانی هماهنگ کن.'); return; }
    const next = Math.max(0, Math.min(9, product.stock ?? 9, Math.trunc(value)));
    setCart(current => next ? current.some(item => item.productId === id) ? current.map(item => item.productId === id ? { ...item, quantity: next } : item) : [...current, { productId: id, quantity: next }] : current.filter(item => item.productId !== id));
    setOrderError(''); if (next > 0) setNotice(`سبد به‌روز شد: ${product.name}`);
  }
  function favorite(id: string) { setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  function compare(id: string) { setCompared(current => { if (current.includes(id)) return current.filter(item => item !== id); if (current.length >= 3) { setNotice('برای مقایسه، حداکثر سه مدل انتخاب کن.'); return current; } return [...current, id]; }); }
  async function placeOrder(value: ShopCustomer) {
    if (orderLock.current || !quote || quoteLoading || quoteError) return;
    const input = { items: cart, customer: value, consent: true as const, quoteRevision: quote.revision };
    const fingerprint = JSON.stringify(input);
    if (requestRef.current?.fingerprint !== fingerprint) requestRef.current = { fingerprint, key: crypto.randomUUID() };
    orderLock.current = true; setOrderPending(true); setOrderError('');
    try {
      const result = await shopApi.order({ ...input, requestKey: requestRef.current!.key });
      setReceipt(result); setCart([]); setQuote(null); setCustomer(emptyShopCustomer());
      const nextReceipts = [{ reference: result.order.reference, trackingToken: result.trackingToken }, ...savedReceipts.filter(item => item.reference !== result.order.reference)].slice(0, 5);
      setSavedReceipts(nextReceipts); try { localStorage.setItem(SHOP_RECEIPTS_KEY, JSON.stringify(nextReceipts)); } catch { setNotice('کدهای پیگیری را کپی کن؛ ذخیره خودکار در مرورگر ممکن نشد.'); }
      setView('receipt'); setOverlay(null); window.scrollTo({ top: 0, behavior: 'instant' });
      window.history.replaceState({ page: 'shop' }, '', '/shop');
    } catch (error) { if (error instanceof ShopApiError && error.quote) setQuote(error.quote); setOrderError(error instanceof Error ? error.message : 'سفارش ثبت نشد. دوباره تلاش کن.'); }
    finally { orderLock.current = false; setOrderPending(false); }
  }
  const trackInitial = receipt ? { reference: receipt.order.reference, trackingToken: receipt.trackingToken } : undefined;
  return <div className="fs-app" dir="rtl"><div className="fs-announcement"><span>تجهیزات متناسب با مسیر؛ انتخاب با مشخصات روشن.</span><a href="tel:09215014474">مشاوره پیش از سفارش<ArrowUpLeft size={12} /></a></div><header className="fs-header"><div className="fs-header-main"><button type="button" className="fs-icon-button fs-header-back" onClick={onBack} aria-label="بازگشت به سایت فرندلی کمپ"><ArrowRight size={20} /></button><button className="fs-brand" type="button" onClick={() => go('catalog')} aria-label="صفحه اصلی فروشگاه"><span><FriendlyCampLogo showText={false} size="sm" /></span><span><strong>FRIENDLY <em>OUTDOOR</em></strong><small>فروشگاه تجهیزات طبیعت‌گردی</small></span></button><form className="fs-header-search" role="search" onSubmit={event => { event.preventDefault(); if (view !== 'catalog') go('catalog'); catalogAnchor(); }}><Search size={18} /><input type="search" aria-label="جستجو در تجهیزات" placeholder="نام محصول، برند یا کد مدل…" value={filters.query} onChange={event => setFilters(current => ({ ...current, query: event.target.value }))} /><button type="submit" aria-label="نمایش نتیجه جستجو"><ArrowLeft size={17} /></button></form><div className="fs-header-actions"><a href={user?accountDestination(user.role):'/login'} className="fs-header-account" aria-label={user&&hasManagementAccess(user.role)?'پنل مدیریت':user?'حساب کاربری':'ورود به حساب'}><UserRound size={20} /></a><button type="button" onClick={() => { go('catalog'); setFilters({ ...defaultFilters(), favoritesOnly: true }); catalogAnchor(); }} aria-label="علاقه‌مندی‌های من"><Heart size={20} /><span>{favorites.length > 0 ? favorites.length.toLocaleString('fa-IR') : ''}</span></button><button type="button" className="fs-header-cart" onClick={() => setOverlay('cart')} aria-label={`سبد خرید، ${count.toLocaleString('fa-IR')} کالا`}><ShoppingBag size={21} /><b>{count.toLocaleString('fa-IR')}</b></button></div></div><nav className={products.length ? "fs-header-nav" : "fs-header-nav is-empty"} aria-label="منوی فروشگاه"><div><button type="button" onClick={() => chooseCategory('all')}>همه تجهیزات</button>{products.length > 0 && Object.entries(SHOP_CATEGORY_LABELS).map(([value, label]) => <button type="button" key={value} onClick={() => chooseCategory(value)}>{label}</button>)}</div><button type="button" className="fs-track-menu" onClick={() => setOverlay('tracking')}><PackageSearch size={15} />پیگیری سفارش</button></nav></header>
    <main className="fs-main" ref={headingRef} tabIndex={-1}>{notice && <div className="fs-notice" role="status"><span><Check size={16} />{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="بستن پیام"><X size={15} /></button></div>}{loading ? <div className="fs-loading" role="status"><LoaderCircle className="fs-spin" size={29} /><h1>در حال آماده‌سازی کاتالوگ…</h1></div> : catalogError ? <EmptyShop title="کاتالوگ دریافت نشد" text={catalogError} action={<button className="fs-button fs-button-primary" type="button" onClick={() => setRefresh(value => value + 1)}>دوباره تلاش کن</button>} /> : view === 'catalog' ? !products.length ? <EmptyShop title="فعلاً کالایی برای سفارش منتشر نشده است" text="پس از تأمین موجودی و تکمیل شرایط فروش، کالاها در این بخش قرار می‌گیرند. پیگیری سفارش‌های قبلی از منوی فروشگاه در دسترس است." action={<a className="fs-button" href="/contact">تماس با فروشگاه</a>} /> : <>{designSettings?.channels.shop?.enabled !== false && <StoreHero onCategory={chooseCategory} onCatalog={catalogAnchor} />}<StoreCategories category={filters.category} onChange={chooseCategory} /><StoreCatalog products={products} filtered={filtered} filters={appliedFilters} onFilters={changeFilters} reset={resetFilters} cart={cartMap} onQuantity={quantity} onOpen={id => go('product', id)} onFavorite={favorite} onCompare={compare} compared={compared} onOpenCompare={() => setOverlay('compare')} onMobileFilters={() => setOverlay('filters')} view={gridView} onView={setGridView} /><section className="fs-expert-banner"><div><span className="fs-eyebrow">از مسیر شروع کن، به تجهیزات برس.</span><h2>برای برنامه‌ات چه چیزهایی لازم داری؟</h2><p>فصل، مدت سفر و شیوه حمل را مشخص کن؛ سپس مدل‌ها را کنار هم ببین.</p></div><button type="button" className="fs-button" onClick={() => setOverlay('guide')}>راهنمای انتخاب تجهیزات<ArrowLeft size={16} /></button></section></> : view === 'product' ? selected ? <StoreProduct product={selected} products={products} quantity={cartMap[selected.id] || 0} favorite={favorites.includes(selected.id)} compared={compared.includes(selected.id)} cart={cartMap} favorites={favorites} compareIds={compared} onBack={() => go('catalog')} onOpen={id => go('product', id)} onQuantity={quantity} onFavorite={favorite} onCompare={compare} onCart={() => setOverlay('cart')} /> : <EmptyShop title="این کالا در کاتالوگ فعال نیست" text="ممکن است موجودی یا وضعیت انتشار آن تغییر کرده باشد." action={<button type="button" className="fs-button" onClick={() => go('catalog')}>بازگشت به کاتالوگ</button>} /> : view === 'checkout' ? cart.length ? <StoreCheckout customer={customer} onCustomer={setCustomer} quote={quote} quoteLoading={quoteLoading} quoteError={quoteError} pending={orderPending} error={orderError} onRefresh={() => setQuoteRefresh(value => value + 1)} onSubmit={placeOrder} onBack={() => { go('catalog'); setOverlay('cart'); }} /> : <EmptyShop title="سبد برای ثبت سفارش خالی است" text="ابتدا تجهیزات موردنیازت را انتخاب کن." action={<button className="fs-button" type="button" onClick={() => go('catalog')}>مشاهده تجهیزات</button>} /> : view === 'receipt' && receipt ? <OrderReceipt receipt={receipt} onTrack={() => setOverlay('tracking')} onShop={() => go('catalog')} /> : view === 'manage' ? <StoreManagement catalog={products} onCatalogChanged={() => setRefresh(value => value + 1)} /> : null}</main>
    <footer className="fs-footer"><div><span className="fs-footer-brand">FRIENDLY OUTDOOR</span><p>تجهیزات برای لحظه‌هایی که بیرون از شهر می‌گذرانیم.</p><a href="tel:09215014474"><Headphones size={17} /><bdi>۰۹۲۱ ۵۰۱ ۴۴۷۴</bdi></a></div><div><h2>همراه انتخاب تو</h2><button type="button" onClick={() => setOverlay('guide')}>راهنمای انتخاب تجهیزات</button><button type="button" onClick={() => setOverlay('tracking')}>پیگیری و بررسی سفارش</button><button type="button" onClick={onSupport}>ارتباط با فرندلی کمپ</button></div><div><h2>درباره سفارش</h2><p>قیمت نهایی، روش ارسال و شرایط تحویل پیش از پرداخت هماهنگ می‌شود. پرداخت بانکی آنلاین در این نسخه فعال نیست.</p>{user?.role === 'admin' && <button type="button" className="fs-admin-entry" onClick={() => go('manage')}><ClipboardList size={15} />مدیریت کالا و سفارش‌ها</button>}</div><div className="fs-footer-bottom"><span>FRIENDLY CAMP · انتخاب برای بیرون</span><button type="button" onClick={onBack}>بازگشت به سایت<ArrowUpLeft size={13} /></button></div></footer>
    {compared.length > 0 && !overlay && <div className="fs-compare-bar"><Scale size={18} /><span>{compared.length.toLocaleString('fa-IR')} مدل برای مقایسه</span><button type="button" onClick={() => setOverlay('compare')}>مقایسه کن<ArrowLeft size={14} /></button><button type="button" aria-label="پاک کردن فهرست مقایسه" onClick={() => setCompared([])}><X size={16} /></button></div>}
    {overlay === 'cart' && <CartDialog products={products} cart={cartMap} quote={quote} quoteLoading={quoteLoading} error={quoteError} onQuantity={quantity} onClose={() => setOverlay(null)} onCheckout={() => go('checkout')} onRefresh={() => setQuoteRefresh(value => value + 1)} />}
    {overlay === 'filters' && <ShopDialog title="فیلتر تجهیزات" kind="drawer" onClose={() => setOverlay(null)}><StoreFilters filters={appliedFilters} onChange={changeFilters} products={products} onReset={resetFilters} /><div className="fs-filter-apply"><button type="button" className="fs-button fs-button-primary" onClick={() => setOverlay(null)}>نمایش {filtered.length.toLocaleString('fa-IR')} کالا<ArrowLeft size={15} /></button></div></ShopDialog>}
    {overlay === 'compare' && <CompareDialog products={products.filter(product => compared.includes(product.id))} onClose={() => setOverlay(null)} onRemove={compare} onOpen={id => go('product', id)} />}
    {overlay === 'tracking' && <TrackingDialog initial={trackInitial} saved={savedReceipts} onClose={() => setOverlay(null)} onChanged={() => setRefresh(value => value + 1)} />}
    {overlay === 'guide' && <ShopDialog title="از برنامه سفر تا انتخاب تجهیزات" onClose={() => setOverlay(null)}><div className="fs-buying-guide">{[{ category: 'shelter', title: 'شب‌مانی در طبیعت', text: 'تعداد نفرات، ابعاد فضای خواب و شرایط فصل را کنار هم بررسی کن. ظرفیت اسمی چادر، جای بار و وسایل را مشخص نمی‌کند.' }, { category: 'sleep', title: 'یک سیستم خواب هماهنگ', text: 'دمای آسایش کیسه‌خواب و مشخصات عایق زیرانداز را برای مقصدت بررسی کن؛ این دو را به‌عنوان یک مجموعه انتخاب کن.' }, { category: 'packs', title: 'پیمایش و حمل وسایل', text: 'حجم وسایل، وزن تجهیزات و تناسب کوله با طول پشت و اندازه تنه، در انتخاب مهم‌اند.' }, { category: 'lighting', title: 'نور و استفاده روزمره', text: 'نوع پرتو، وزن و منبع تغذیه را مقایسه کن. بیشترین شدت نور، به معنی زمان کارکرد بیشتر نیست.' }].map(item => <div key={item.category}><span>{item.title}</span><p>{item.text}</p><button type="button" onClick={() => { setOverlay(null); chooseCategory(item.category); }}>دیدن تجهیزات این دسته<ArrowLeft size={14} /></button></div>)}</div></ShopDialog>}
  </div>;
}
