import { boundedFetch } from './request';
export type AuthUser = { id: string; fullName: string; phone: string; email: string; nationalCode?: string; role: import('../types/control').AccountRole };

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await boundedFetch(url, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.');
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.status === 429) throw new Error('تعداد تلاش‌ها زیاد شده است. لطفاً کمی بعد دوباره تلاش کن.');
  if (!response.ok) throw new Error(data?.message || (response.status === 400 ? 'اطلاعات واردشده معتبر نیست. فیلدها را بررسی کن.' : 'درخواست با خطا مواجه شد. دوباره تلاش کن.'));
  return data as T;
}

export const authApi = {
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  login: (input: { identifier: string; password: string; remember: boolean }, signal?: AbortSignal) => request<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input), signal }),
  register: (input: { fullName: string; phone: string; email: string; nationalCode?: string; password: string; agreeTerms: true }, signal?: AbortSignal) => request<{ user: AuthUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input), signal }),
  logout: () => request<null>('/api/auth/logout', { method: 'POST' }),
  requestOtp: (identifier: string) => request<never>('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ identifier }) })
};
