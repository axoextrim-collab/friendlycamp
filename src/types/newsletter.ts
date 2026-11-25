export const NEWSLETTER_CONSENT_VERSION = '2026-11-24';
export type NewsletterStatus = 'subscribed' | 'already_subscribed';
export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  createdAt: string;
  updatedAt: string;
  consent: { version: string; acceptedAt: string; source: 'footer-newsletter' };
}
export interface NewsletterSnapshot { subscribers: NewsletterSubscriber[]; total: number; active: number; limit: number }
