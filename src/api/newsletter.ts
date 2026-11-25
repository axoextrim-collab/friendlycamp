import { boundedFetch } from './request';
import { NEWSLETTER_CONSENT_VERSION, type NewsletterStatus } from '../types/newsletter';

export async function subscribeNewsletter(email: string, consent: boolean, signal: AbortSignal): Promise<{ status: NewsletterStatus; message: string }> {
  const response = await boundedFetch('/api/newsletter/subscriptions', { method: 'POST', credentials: 'same-origin', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, consent, consentVersion: NEWSLETTER_CONSENT_VERSION }) });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || (response.status === 429 ? 'تعداد تلاش‌ها زیاد است؛ کمی بعد دوباره تلاش کن.' : 'ثبت عضویت انجام نشد. کمی بعد دوباره تلاش کن.'));
  if (!['subscribed', 'already_subscribed'].includes(result?.status) || typeof result.message !== 'string' || !result.message) throw new Error('پاسخ معتبر از سرور دریافت نشد. دوباره تلاش کن.');
  return { status: result.status, message: result.message };
}
