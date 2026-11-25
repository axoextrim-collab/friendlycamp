import React, { useEffect, useRef, useState } from 'react';
import { SiteLink } from '../../routing/navigation';
import { productPath } from '../../routing/routes';
import { ArrowLeft, Backpack, BedDouble, Check, CookingPot, Heart, Lamp, Minus, Plus, Scale, Tent, TreePine, X } from 'lucide-react';
import { SHOP_CATEGORY_LABELS, type ShopCategory, type ShopProduct } from '../../types/shop';

export const CATEGORY_ICONS: Record<ShopCategory, React.ElementType> = { shelter: Tent, sleep: BedDouble, packs: Backpack, kitchen: CookingPot, lighting: Lamp, trail: TreePine };
export const money = (value: number) => value.toLocaleString('fa-IR');

export function ShopDialog({ title, children, onClose, kind = 'modal', busy = false }: { title: string; children: React.ReactNode; onClose: () => void; kind?: 'modal' | 'drawer'; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = React.useId();
  useEffect(() => { const element = ref.current; const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; element?.showModal(); document.body.style.overflow = 'hidden'; return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus({ preventScroll: true }); }; }, []);
  return <dialog ref={ref} className={`fs-dialog fs-${kind}`} dir="rtl" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (event.target === event.currentTarget && !busy) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}><div className="fs-dialog-heading"><h2 id={titleId}>{title}</h2><button className="fs-icon-button" type="button" disabled={busy} onClick={onClose} aria-label={`بستن ${title}`} autoFocus><X size={20} /></button></div>{children}</dialog>;
}

export function ProductImage({ product, className = '' }: { product: ShopProduct; className?: string }) {
  const [failed, setFailed] = useState(false); const Icon = CATEGORY_ICONS[product.category];
  useEffect(() => setFailed(false), [product.image]);
  return <div className={`fs-product-image ${className}`}>{product.image && !failed ? <img decoding="async" src={product.image} alt={`${product.name} ${product.model}`} loading="lazy" data-motion="off" onError={() => setFailed(true)} /> : <div className="fs-image-placeholder"><Icon size={72} strokeWidth={.9} aria-hidden="true" /><span>تصویر این مدل هنوز ثبت نشده</span></div>}</div>;
}

export function ProductPrice({ product }: { product: Pick<ShopProduct, 'stock' | 'price'> }) {
  return <div className="fs-price">{product.stock === 0 ? <strong className="fs-price-muted">ناموجود</strong> : product.price === null ? <strong className="fs-price-inquiry">استعلام قیمت</strong> : <><strong>{money(product.price)}</strong><small>تومان</small></>}</div>;
}

export function Quantity({ value, onChange, max = 9, label, disabled = false }: { value: number; onChange: (value: number) => void; max?: number; label: string; disabled?: boolean }) {
  return <div className="fs-quantity" role="group" aria-label={`تعداد ${label}`}><button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label={`افزایش تعداد ${label}`}><Plus size={15} /></button><output aria-live="polite">{value.toLocaleString('fa-IR')}</output><button type="button" disabled={disabled || value <= 0} onClick={() => onChange(value - 1)} aria-label={`کاهش تعداد ${label}`}><Minus size={15} /></button></div>;
}

export function ProductCard({ product, quantity, favorite, compared, onOpen, onQuantity, onFavorite, onCompare }: { key?: React.Key; product: ShopProduct; quantity: number; favorite: boolean; compared: boolean; onOpen: () => void; onQuantity: (quantity: number) => void; onFavorite: () => void; onCompare: () => void }) {
  const stockLabel = product.stock === 0 ? 'ناموجود' : product.stock === null ? 'موجودی با استعلام' : 'موجودی ثبت‌شده';
  return <article className="fs-product-card"><div className="fs-product-visual"><SiteLink className="fs-product-photo-button" href={productPath(product.id)} aria-label={`مشاهده ${product.name}`}><ProductImage product={product} /></SiteLink><button className={`fs-heart ${favorite ? 'is-active' : ''}`} type="button" onClick={onFavorite} aria-label={`${favorite ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها: ${product.name}`} aria-pressed={favorite}><Heart size={18} strokeWidth={1.4} /></button><span className={`fs-stock-badge ${product.stock !== null && product.stock > 0 ? 'is-stocked' : ''}`}>{stockLabel}</span></div><div className="fs-product-info"><div className="fs-product-brand"><bdi>{product.brand || 'FRIENDLY SELECTION'}</bdi><button type="button" onClick={onCompare} aria-label={`مقایسه ${product.name}`} aria-pressed={compared} className={compared ? 'is-active' : ''}><Scale size={15} /></button></div><SiteLink className="fs-product-title" href={productPath(product.id)}><h3>{product.name}</h3></SiteLink><p className="fs-product-model"><bdi>{product.model || product.sku}</bdi></p><p className="fs-product-summary">{product.summary}</p><div className="fs-card-footer"><ProductPrice product={product} />{quantity > 0 ? <Quantity value={quantity} onChange={onQuantity} max={Math.min(9, product.stock ?? 9)} label={product.name} /> : <button className="fs-add-button" type="button" disabled={product.stock === 0} onClick={() => onQuantity(1)} aria-label={`افزودن ${product.name} به سبد`}><Plus size={18} /></button>}</div></div></article>;
}

export function EmptyShop({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="fs-empty"><TreePine size={42} strokeWidth={1.1} /><h1 className="fs-empty-heading">{title}</h1><p>{text}</p>{action}</div>;
}

export function StoreBenefits() {
  return <div className="fs-benefits"><div><Scale size={20} strokeWidth={1.4} /><span><strong>انتخاب با مشخصات روشن</strong><small>مقایسه مدل و کاربرد پیش از سفارش</small></span></div><div><Check size={20} strokeWidth={1.4} /><span><strong>بررسی قیمت و موجودی</strong><small>کنترل دوباره سبد در زمان ثبت</small></span></div><div><Backpack size={20} strokeWidth={1.4} /><span><strong>همراه در انتخاب تجهیزات</strong><small>هماهنگی با پشتیبانی فرندلی کمپ</small></span></div></div>;
}
