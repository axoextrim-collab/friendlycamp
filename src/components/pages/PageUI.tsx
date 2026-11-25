import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, Copy, Share2 } from 'lucide-react';
import { SiteLink } from '../../routing/navigation';

export function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: React.ReactNode }) {
  return <div className="sp-page-heading"><nav aria-label="مسیر صفحه"><SiteLink href="/">خانه</SiteLink><ChevronLeft size={12} /><span>{eyebrow}</span></nav><span className="sp-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p>{children}</div>;
}
export function SharePage({ title }: { title: string }) {
  const [status, setStatus] = useState('');
  async function share() { try { if (navigator.share) { await navigator.share({ title, url: window.location.href }); setStatus(''); } else { await navigator.clipboard.writeText(window.location.href); setStatus('لینک این صفحه کپی شد.'); } } catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; setStatus('می‌توانی نشانی این صفحه را از نوار مرورگر کپی کنی.'); } }
  return <div className="sp-share"><button type="button" onClick={() => void share()}><Share2 size={15} />اشتراک‌گذاری این صفحه</button>{status && <span role="status">{status}</span>}</div>;
}
export function NotFoundPage() { return <div className="sp-not-found"><span>۴۰۴</span><h1>این مسیر به صفحه‌ای نرسید.</h1><p>نشانی را بررسی کن یا از یکی از بخش‌های سایت ادامه بده.</p><div><SiteLink className="sp-button sp-primary" href="/">صفحه اصلی<ArrowLeft size={15} /></SiteLink><SiteLink className="sp-button" href="/tours">فهرست سفرها</SiteLink><SiteLink className="sp-button" href="/blog">مجله سفر</SiteLink></div></div>; }
