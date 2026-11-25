import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from 'lucide-react';
import { subscribeNewsletter } from '../api/newsletter';
import { NEWSLETTER_CONSENT_VERSION } from '../types/newsletter';
import './newsletter.css';

export function NewsletterForm() {
  const id = useId(); const [email, setEmail] = useState(''); const [consent, setConsent] = useState(false); const [pending, setPending] = useState(false); const [success, setSuccess] = useState('');
  const [error, setError] = useState<{ field: 'email' | 'consent' | 'submit'; message: string } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null); const consentRef = useRef<HTMLInputElement>(null); const requestRef = useRef<AbortController | null>(null); const busy = useRef(false);
  useEffect(() => () => { const request = requestRef.current; requestRef.current = null; request?.abort(); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy.current) return;
    const normalized = email.trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || emailRef.current?.validity.typeMismatch) { setError({ field: 'email', message: 'یک نشانی ایمیل معتبر وارد کن.' }); emailRef.current?.focus(); return; }
    if (!consent) { setError({ field: 'consent', message: 'برای عضویت، رضایت حریم خصوصی لازم است.' }); consentRef.current?.focus(); return; }
    busy.current = true; setPending(true); setError(null);
    const controller = new AbortController(); requestRef.current = controller; const timeout = window.setTimeout(() => controller.abort(), 12000);
    try { const result = await subscribeNewsletter(normalized, consent, controller.signal); if (!controller.signal.aborted) setSuccess(result.message); }
    catch (failure) { if (requestRef.current === controller) setError({ field: 'submit', message: controller.signal.aborted ? 'پاسخ سرور دریافت نشد. ایمیل حفظ شده؛ دوباره تلاش کن.' : failure instanceof TypeError ? 'ارتباط با سرور برقرار نشد. ایمیل حفظ شده؛ دوباره تلاش کن.' : failure instanceof Error ? failure.message : 'ثبت عضویت انجام نشد. دوباره تلاش کن.' }); }
    finally { window.clearTimeout(timeout); busy.current = false; if (requestRef.current === controller) { requestRef.current = null; setPending(false); } }
  }
  return <section id="newsletter" className="fc-newsletter" aria-labelledby={`${id}-heading`}><div className="fc-newsletter-intro"><span><Mail size={19} strokeWidth={1.4} /><ManagedText value={"همراه سفرهای بعدی"}/></span><h3 id={`${id}-heading`}><ManagedText value={"خبرنامهٔ "}/><em><ManagedText value={"فرندلی کمپ"}/></em></h3><p><ManagedText value={"برای عضویت در فهرست خبرها و برنامه‌های سفر، ایمیلت را ثبت کن."}/></p></div>{success ? <div className="fc-newsletter-success"><div role="status" aria-live="polite"><CheckCircle2 size={24} /><p><ManagedText value={success}/></p></div><button type="button" onClick={() => { setSuccess(''); setEmail(''); setConsent(false); setError(null); }}><ManagedText value={"ثبت ایمیل دیگری"}/><ArrowLeft size={14} /></button></div> : <form method="post" action="/api/newsletter/subscriptions" onSubmit={submit} noValidate aria-busy={pending}><fieldset disabled={pending}><label className="fc-newsletter-label" htmlFor={`${id}-email`}><ManagedText value={"نشانی ایمیل"}/></label><div className="fc-newsletter-input-row"><input id={`${id}-email`} ref={emailRef} type="email" name="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} dir="ltr" value={email} placeholder={siteText("you@example.com")} aria-invalid={error?.field === 'email' || undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => { setEmail(event.target.value); setError(null); }} /><button type="submit" disabled={pending}>{pending ? <LoaderCircle size={16} className="fc-newsletter-spin" /> : <ArrowLeft size={16} />}<ManagedText value={pending ? 'در حال ثبت…' : 'عضویت در خبرنامه'}/></button></div><input type="hidden" name="consentVersion" value={NEWSLETTER_CONSENT_VERSION} /><label className="fc-newsletter-consent"><input ref={consentRef} type="checkbox" name="consent" required checked={consent} aria-invalid={error?.field === 'consent' || undefined} aria-describedby={error ? `${id}-error` : undefined} onChange={event => { setConsent(event.target.checked); setError(null); }} /><span><ManagedText value={"با ذخیرهٔ ایمیلم برای عضویت در فهرست خبرنامه و اطلاع‌رسانی برنامه‌های فرندلی کمپ موافقم. "}/><ManagedAnchor href="/privacy" target="_blank" rel="noopener noreferrer"><ManagedText value={"حریم خصوصی خبرنامه"}/></ManagedAnchor></span></label></fieldset>{error && <p id={`${id}-error`} className="fc-newsletter-error" role="alert"><ManagedText value={error.message}/></p>}</form>}</section>;
}
