import { boundedFetch } from './request';
import type { AuthUser } from './auth';

export type TravelProfile = {
  userId: string; bio: string; birthDate: string; city: string; emergencyContact: string; interests: string[]; travelStyle: string; experienceLevel: string; dietaryNotes: string;
  wallet: { balance: number; lockedBalance: number; currency: 'تومان'; transactions: WalletTransaction[]; paymentMethods: Array<{ id: string; label: string; masked: string; type: 'card' | 'iban'; isDefault: boolean }> };
  club: { points: number; tier: 'برنزی' | 'نقره‌ای' | 'طلایی'; cards: Array<{ id: string; title: string; value: string; status: 'فعال' | 'استفاده‌شده' }> };
  stories: Array<{ id: string; title: string; destination: string; date: string; body: string; coverUrl?: string; createdAt: string }>;
  media: Array<{ id: string; kind: 'photo' | 'podcast'; title: string; url: string; mimeType: string; createdAt: string }>;
  privacy: { profileVisible: boolean; showTrips: boolean; allowCompanionRequests: boolean }; updatedAt: string;
  professional: { occupation: string; languages: string[]; fitnessLevel: string; insuranceProvider: string; insuranceExpiry: string; passportReady: boolean; equipmentNotes: string };
  settings: { appearance: { theme: 'system' | 'light' | 'dark'; fontScale: 'normal' | 'large'; reducedMotion: boolean; highContrast: boolean }; notifications: { email: boolean; sms: boolean; push: boolean; booking: boolean; priceAlerts: boolean; club: boolean; community: boolean }; preferences: { language: 'fa' | 'en'; calendar: 'jalali' | 'gregorian'; currency: 'IRR'; autoPlayMedia: boolean }; security: { loginAlerts: boolean; twoFactorRequested: boolean; hideSensitiveAmounts: boolean } };
};
export type WalletTransaction = { id: string; title: string; amount: number; date: string; type: 'credit' | 'debit'; status: 'موفق' | 'در انتظار' | 'ناموفق'; category: 'شارژ' | 'رزرو' | 'بازگشت وجه' | 'برداشت' | 'پاداش'; reference: string };

export class ProfileApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await boundedFetch(url, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options?.headers } }); }
  catch (error) { if (options?.signal?.aborted) throw error; throw new Error('ارتباط با سرور برقرار نشد. اطلاعاتت حفظ شده؛ دوباره تلاش کن.'); }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ProfileApiError(data?.message || (response.status === 401 ? 'برای مشاهده پروفایل ابتدا وارد شوید.' : response.status === 429 ? 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کن.' : response.status === 400 ? 'اطلاعات فرم معتبر نیست. فیلدها را بررسی کن.' : 'ذخیره اطلاعات انجام نشد.'), response.status);
  return data as T;
}

export const profileApi = {
  get: (signal?: AbortSignal) => jsonRequest<{ profile: TravelProfile; user: AuthUser }>('/api/profile', { signal }),
  save: (profile: TravelProfile) => jsonRequest<{ profile: TravelProfile }>('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  account: (input: { fullName: string; phone: string; email: string; nationalCode?: string; currentPassword: string }) => jsonRequest<{ user: AuthUser }>('/api/profile/account', { method: 'PATCH', body: JSON.stringify(input) }),
  password: (input: { currentPassword: string; newPassword: string }) => jsonRequest<null>('/api/profile/password', { method: 'POST', body: JSON.stringify(input) }),
  walletOperation: (input: { action: 'topup' | 'withdraw'; amount: number; sourceLabel: string }) => jsonRequest<{ wallet: TravelProfile['wallet']; transaction: WalletTransaction }>('/api/profile/wallet/operation', { method: 'POST', body: JSON.stringify(input) }),
  upload: async (file: File) => {
    const body = new FormData(); body.append('file', file);
    let response: Response;
    try { response = await boundedFetch('/api/profile/upload', { method: 'POST', credentials: 'same-origin', body }); }
    catch { throw new Error('ارتباط هنگام بارگذاری قطع شد. فایل انتخابی حفظ شده؛ دوباره تلاش کن.'); }
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ProfileApiError(data?.message || 'بارگذاری فایل ناموفق بود.', response.status);
    return data as { url: string; mimeType: string; size: number };
  }
};
