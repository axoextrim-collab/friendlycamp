export type RegistrationFields = { fullName: string; phone: string; email: string; password: string; confirmPassword: string; agreeTerms: boolean };
export type AuthFieldErrors = Partial<Record<keyof RegistrationFields | 'identifier', string>>;

const latinDigits = (value: string) => value.replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) - (digit >= '۰' ? 1776 : 1632)));

export function normalizePhone(value: string): string {
  const phone = latinDigits(value).trim().replace(/[\s()\-]/g, '');
  return phone.replace(/^(?:\+98|0098|98)(?=9\d{9}$)/, '0');
}

export function normalizeIdentifier(value: string): string {
  const identifier = value.trim();
  return identifier.includes('@') ? identifier.toLowerCase() : normalizePhone(identifier);
}

export function passwordRequirements(password: string) {
  return [
    { label: '۱۰ تا ۱۲۸ نویسه', met: password.length >= 10 && password.length <= 128 },
    { label: 'حداقل یک حرف انگلیسی', met: /[A-Za-z]/.test(password) },
    { label: 'حداقل یک عدد انگلیسی', met: /\d/.test(password) },
  ];
}

export function validateIdentity(fields: Pick<RegistrationFields, 'fullName' | 'phone' | 'email'>): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (fields.fullName.trim().length < 3 || fields.fullName.trim().length > 100) errors.fullName = 'نام و نام خانوادگی را بین ۳ تا ۱۰۰ نویسه وارد کن.';
  if (!/^09\d{9}$/.test(normalizePhone(fields.phone))) errors.phone = 'شماره همراه معتبر وارد کن؛ مانند ۰۹۱۲۱۲۳۴۵۶۷.';
  if (fields.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) errors.email = 'نشانی ایمیل را کامل وارد کن؛ مانند name@example.com.';
  return errors;
}

export function validatePassword(fields: Pick<RegistrationFields, 'password' | 'confirmPassword' | 'agreeTerms'>): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  if (passwordRequirements(fields.password).some(rule => !rule.met)) errors.password = 'رمز باید ۱۰ تا ۱۲۸ نویسه و شامل حرف و عدد انگلیسی باشد.';
  if (!fields.confirmPassword || fields.password !== fields.confirmPassword) errors.confirmPassword = 'تکرار رمز با رمز انتخابی یکسان نیست.';
  if (!fields.agreeTerms) errors.agreeTerms = 'برای ساخت حساب، موافقتت را مشخص کن.';
  return errors;
}
