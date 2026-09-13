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

async function jsonRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || (response.status === 401 ? 'برای مشاهده پروفایل ابتدا وارد شوید.' : 'ذخیره اطلاعات انجام نشد.'));
  return data as T;
}

export const profileApi = {
  get: () => jsonRequest<{ profile: TravelProfile; user: AuthUser }>('/api/profile'),
  save: (profile: TravelProfile) => jsonRequest<{ profile: TravelProfile }>('/api/profile', { method: 'PUT', body: JSON.stringify(profile) }),
  walletOperation: (input: { action: 'topup' | 'withdraw'; amount: number; sourceLabel: string }) => jsonRequest<{ wallet: TravelProfile['wallet']; transaction: WalletTransaction }>('/api/profile/wallet/operation', { method: 'POST', body: JSON.stringify(input) }),
  upload: async (file: File) => {
    const body = new FormData(); body.append('file', file);
    const response = await fetch('/api/profile/upload', { method: 'POST', credentials: 'same-origin', body });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'بارگذاری فایل ناموفق بود.');
    return data as { url: string; mimeType: string; size: number };
  }
};
