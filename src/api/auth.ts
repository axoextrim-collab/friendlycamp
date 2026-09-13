export type AuthUser = { id: string; fullName: string; phone: string; email: string; nationalCode?: string; role: 'user' | 'admin' };

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'درخواست با خطا مواجه شد. دوباره تلاش کنید.');
  return data as T;
}

export const authApi = {
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  login: (input: { identifier: string; password: string; remember: boolean }) => request<{ user: AuthUser }>('/api/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: { fullName: string; phone: string; email: string; nationalCode?: string; password: string; agreeTerms: true }) => request<{ user: AuthUser }>('/api/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  logout: () => request<null>('/api/auth/logout', { method: 'POST' }),
  requestOtp: (identifier: string) => request<never>('/api/auth/otp/request', { method: 'POST', body: JSON.stringify({ identifier }) })
};
