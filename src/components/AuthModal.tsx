import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Eye, EyeOff, Headphones, LoaderCircle, LockKeyhole, Mail, Phone, TentTree, UserRound, X } from 'lucide-react';
import { authApi, type AuthUser } from '../api/auth';
import { normalizeIdentifier, normalizePhone, passwordRequirements, validateIdentity, validatePassword, type AuthFieldErrors, type RegistrationFields } from '../utils/authForm';
import { FriendlyCampLogo } from './FriendlyCampLogo';
import './auth.css';
import { restoreDialogFocus } from '../utils/dialogFocus';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  initialTab?: 'login' | 'register';
}

// Mount a fresh form on each opening. Credentials never persist after the dialog closes.
export function AuthModal({ isOpen, initialTab = 'login', ...props }: AuthModalProps) {
  return isOpen ? <AuthDialog initialTab={initialTab} {...props} /> : null;
}

function AuthDialog({ initialTab, onClose, onLoginSuccess }: Omit<AuthModalProps, 'isOpen'>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const submittingRef = useRef(false);
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>(initialTab || 'login');
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [form, setForm] = useState<RegistrationFields>({ fullName: '', phone: '', email: '', password: '', confirmPassword: '', agreeTerms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [pending, setPending] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    const element = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement : document.getElementById('header-auth-btn');
    element?.showModal();
    return () => { requestRef.current?.abort(); element?.close(); restoreDialogFocus(previousFocus, '#header-auth-btn'); };
  }, []);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    dialogRef.current?.scrollTo({ top: 0 });
  }, [mode, step]);

  function switchMode(next: typeof mode) {
    if (submittingRef.current) return;
    setMode(next); setErrors({}); setServerError(''); setShowPassword(false); setShowConfirm(false); setCapsLock(false);
    setLoginPassword(''); setForm(current => ({ ...current, password: '', confirmPassword: '', agreeTerms: false }));
    setStep(1);
  }

  function clearError(field: keyof AuthFieldErrors) {
    setErrors(current => ({ ...current, [field]: undefined })); setServerError('');
  }

  function update<K extends keyof RegistrationFields>(field: K, value: RegistrationFields[K]) {
    setForm(current => ({ ...current, [field]: value })); clearError(field);
  }

  function reportErrors(next: AuthFieldErrors) {
    setErrors(next);
    if (!Object.keys(next).length) return false;
    requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    return true;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setServerError('');
    if (mode === 'register') {
      const identityErrors = validateIdentity(form);
      if (Object.keys(identityErrors).length) { setStep(1); reportErrors(identityErrors); return; }
      if (step === 1) { setErrors({}); setStep(2); return; }
      if (reportErrors(validatePassword(form))) return;
    } else {
      const next: AuthFieldErrors = {};
      const normalized = normalizeIdentifier(identifier);
      if (!normalized || (!/^09\d{9}$/.test(normalized) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))) next.identifier = 'شماره همراه یا ایمیل حساب را کامل وارد کن.';
      if (!loginPassword) next.password = 'رمز عبور حسابت را وارد کن.';
      if (reportErrors(next)) return;
    }
    submittingRef.current = true; setPending(true);
    const controller = new AbortController(); requestRef.current = controller;
    try {
      const { user } = mode === 'register'
        ? await authApi.register({ fullName: form.fullName.trim(), phone: normalizePhone(form.phone), email: form.email.trim().toLowerCase(), password: form.password, agreeTerms: true }, controller.signal)
        : await authApi.login({ identifier: normalizeIdentifier(identifier), password: loginPassword, remember }, controller.signal);
      if (!controller.signal.aborted) onLoginSuccess(user);
    } catch (error) {
      if (!controller.signal.aborted) setServerError(error instanceof Error ? error.message : 'ارتباط برقرار نشد. دوباره تلاش کن.');
    } finally {
      if (!controller.signal.aborted) { submittingRef.current = false; setPending(false); }
    }
  }

  const fieldProps = (field: keyof AuthFieldErrors) => ({ 'aria-invalid': errors[field] ? true as const : undefined, 'aria-describedby': errors[field] ? `fc-auth-${field}-error` : undefined });
  const fieldError = (field: keyof AuthFieldErrors) => errors[field] ? <p id={`fc-auth-${field}-error`} className="fc-auth-field-error">{errors[field]}</p> : null;
  const passwordKeys = (event: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState('CapsLock'));

  return <dialog ref={dialogRef} className="fc-auth-dialog" dir="rtl" aria-labelledby="fc-auth-title" aria-describedby="fc-auth-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation(); }}
    onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); } }}>
    <div className="fc-auth-layout">
      <div className="fc-auth-main">
        <div className="fc-auth-top"><span><TentTree size={19} strokeWidth={1.5} />باشگاه فرندلی کمپ</span><button className="fc-auth-close" type="button" onClick={onClose} aria-label="بستن فرم ورود و ثبت‌نام"><X size={21} /></button></div>
        {mode !== 'recovery' && <nav className="fc-auth-switch" aria-label="انتخاب ورود یا ثبت‌نام">
          <button type="button" aria-pressed={mode === 'login'} disabled={pending} onClick={() => switchMode('login')}>ورود به حساب</button>
          <button type="button" aria-pressed={mode === 'register'} disabled={pending} onClick={() => switchMode('register')}>ساخت حساب</button>
        </nav>}
        <div className="fc-auth-intro">
          <p className="fc-auth-eyebrow">{mode === 'login' ? 'خوش برگشتی، همسفر' : mode === 'register' ? 'شروع یک همراهی تازه' : 'کمک برای ورود به حساب'}</p>
          <h2 id="fc-auth-title" ref={headingRef} tabIndex={-1}>{mode === 'login' ? 'سفر بعدی از اینجا شروع می‌شه.' : mode === 'register' ? step === 1 ? 'با هم، راهی طبیعت بشیم.' : 'یک رمز برای حساب خودت.' : 'رمزت را فراموش کردی؟'}</h2>
          <p id="fc-auth-description">{mode === 'login' ? 'با شماره همراه یا ایمیلی که ثبت کردی، وارد شو.' : mode === 'register' ? step === 1 ? 'اطلاعاتت را وارد کن؛ در قدم بعد رمزت را انتخاب می‌کنی.' : 'رمزت را انتخاب کن تا ساخت حسابت کامل شود.' : 'برای پیدا کردن راه دسترسی به حسابت، با پشتیبانی در تماس باش.'}</p>
        </div>
        {mode === 'recovery' ? <div className="fc-auth-recovery">
          <div className="fc-auth-help-icon"><Headphones size={28} strokeWidth={1.4} /></div>
          <h3>همراهت هستیم.</h3>
          <p>بازیابی خودکار رمز در حال حاضر فعال نیست. هنگام تماس، شماره همراه یا ایمیل حسابت را اعلام کن تا وضعیت دسترسی بررسی شود.</p>
          <a className="fc-auth-submit" href="tel:09215014474"><Phone size={18} /><span>تماس با پشتیبانی</span><b dir="ltr">۰۹۲۱ ۵۰۱ ۴۴۷۴</b></a>
          <p className="fc-auth-help-note">رمز عبورت را در اختیار دیگران قرار نده.</p>
          <button className="fc-auth-back" type="button" onClick={() => switchMode('login')}><ArrowRight size={16} />بازگشت به ورود</button>
        </div> : <>
          {mode === 'register' && <ol className="fc-auth-steps" aria-label="مراحل ساخت حساب">
            <li className={step === 1 ? 'is-current' : 'is-done'} aria-current={step === 1 ? 'step' : undefined}><span>{step === 2 ? <Check size={13} /> : '۱'}</span>{step === 2 ? <button type="button" disabled={pending} onClick={() => { setStep(1); setErrors({}); setServerError(''); }}>اطلاعات فردی</button> : 'اطلاعات فردی'}</li>
            <li className={step === 2 ? 'is-current' : ''} aria-current={step === 2 ? 'step' : undefined}><span>۲</span>رمز حساب</li>
          </ol>}
          <form className="fc-auth-form" onSubmit={submit} noValidate aria-busy={pending}>
            <fieldset disabled={pending}>
              {mode === 'login' ? <>
                <div className="fc-auth-field"><label htmlFor="fc-auth-identifier">شماره همراه یا ایمیل</label><div className="fc-auth-input"><UserRound size={18} /><input id="fc-auth-identifier" name="username" autoComplete="username" type="text" dir="ltr" value={identifier} maxLength={254} onChange={event => { setIdentifier(event.target.value); clearError('identifier'); }} placeholder="09xxxxxxxxx / name@example.com" required {...fieldProps('identifier')} /></div>{fieldError('identifier')}</div>
                <div className="fc-auth-field"><label htmlFor="fc-auth-login-password">رمز عبور</label><div className="fc-auth-input"><LockKeyhole size={18} /><input id="fc-auth-login-password" name="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} dir="ltr" value={loginPassword} maxLength={128} onChange={event => { setLoginPassword(event.target.value); clearError('password'); }} onKeyDown={passwordKeys} onKeyUp={passwordKeys} onBlur={() => setCapsLock(false)} placeholder="رمز عبور حسابت" required {...fieldProps('password')} /><button type="button" aria-label={showPassword ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور'} aria-pressed={showPassword} aria-controls="fc-auth-login-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{fieldError('password')}</div>
                <div className="fc-auth-options"><label className="fc-auth-check"><input type="checkbox" name="remember" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>مرا به خاطر بسپار</span></label><button type="button" className="fc-auth-text-button" onClick={() => switchMode('recovery')}>رمزت را فراموش کردی؟</button></div>
              </> : step === 1 ? <>
                <div className="fc-auth-field"><label htmlFor="fc-auth-fullName">نام و نام خانوادگی</label><div className="fc-auth-input"><UserRound size={18} /><input id="fc-auth-fullName" name="name" autoComplete="name" value={form.fullName} maxLength={100} onChange={event => update('fullName', event.target.value)} placeholder="نام کامل خودت" required {...fieldProps('fullName')} /></div>{fieldError('fullName')}</div>
                <div className="fc-auth-field"><label htmlFor="fc-auth-phone">شماره همراه</label><div className="fc-auth-input"><Phone size={18} /><input id="fc-auth-phone" name="tel" autoComplete="tel" type="tel" dir="ltr" inputMode="tel" value={form.phone} maxLength={25} onChange={event => update('phone', event.target.value)} placeholder="09xxxxxxxxx" required {...fieldProps('phone')} /></div>{fieldError('phone')}</div>
                <div className="fc-auth-field"><label htmlFor="fc-auth-email">ایمیل</label><div className="fc-auth-input"><Mail size={18} /><input id="fc-auth-email" name="email" autoComplete="email" type="email" dir="ltr" inputMode="email" autoCapitalize="none" spellCheck={false} value={form.email} maxLength={254} onChange={event => update('email', event.target.value)} placeholder="name@example.com" required {...fieldProps('email')} /></div>{fieldError('email')}</div>
              </> : <>
                <div className="fc-auth-field"><label htmlFor="fc-auth-password">رمز عبور جدید</label><div className="fc-auth-input"><LockKeyhole size={18} /><input id="fc-auth-password" name="new-password" autoComplete="new-password" type={showPassword ? 'text' : 'password'} dir="ltr" value={form.password} maxLength={128} onChange={event => update('password', event.target.value)} onKeyDown={passwordKeys} onKeyUp={passwordKeys} onBlur={() => setCapsLock(false)} required {...fieldProps('password')} aria-describedby={['fc-auth-password-rules', errors.password && 'fc-auth-password-error'].filter(Boolean).join(' ')} /><button type="button" aria-label={showPassword ? 'پنهان کردن رمز جدید' : 'نمایش رمز جدید'} aria-pressed={showPassword} aria-controls="fc-auth-password" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{fieldError('password')}
                  <ul id="fc-auth-password-rules" className="fc-auth-rules" aria-label="الزامات رمز عبور">{passwordRequirements(form.password).map(rule => <li key={rule.label} className={rule.met ? 'is-met' : ''}><Check size={12} aria-hidden="true" /><span className="sr-only">{rule.met ? 'رعایت شده: ' : 'لازم است: '}</span>{rule.label}</li>)}</ul>
                </div>
                <div className="fc-auth-field"><label htmlFor="fc-auth-confirmPassword">تکرار رمز عبور</label><div className="fc-auth-input"><LockKeyhole size={18} /><input id="fc-auth-confirmPassword" name="confirm-password" autoComplete="new-password" type={showConfirm ? 'text' : 'password'} dir="ltr" value={form.confirmPassword} maxLength={128} onChange={event => update('confirmPassword', event.target.value)} required {...fieldProps('confirmPassword')} /><button type="button" aria-label={showConfirm ? 'پنهان کردن تکرار رمز' : 'نمایش تکرار رمز'} aria-pressed={showConfirm} aria-controls="fc-auth-confirmPassword" onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{fieldError('confirmPassword')}</div>
                <div className="fc-auth-consent"><label className="fc-auth-check"><input type="checkbox" checked={form.agreeTerms} onChange={event => update('agreeTerms', event.target.checked)} required {...fieldProps('agreeTerms')} /><span>با ساخت حساب و ذخیره اطلاعات واردشده برای مدیریت آن موافقم.</span></label>{fieldError('agreeTerms')}<details><summary>درباره اطلاعات حساب</summary><p>نام، شماره همراه و ایمیل برای ایجاد حساب کاربری ثبت می‌شوند. شرایط رزرو و شرکت در سفر، در فرایند رزرو هر برنامه جداگانه بررسی می‌شود.</p></details></div>
              </>}
            </fieldset>
            {capsLock && <p className="fc-auth-caps" role="status">کلید Caps Lock روشن است.</p>}
            {serverError && <div className="fc-auth-server-error" role="alert"><p>{serverError}</p></div>}
            <div className="fc-auth-actions">{mode === 'register' && step === 2 && <button type="button" className="fc-auth-previous" disabled={pending} onClick={() => { setStep(1); setErrors({}); setServerError(''); }} aria-label="بازگشت به اطلاعات فردی"><ArrowRight size={18} /></button>}<button className="fc-auth-submit" type="submit" disabled={pending}>{pending ? <><LoaderCircle size={19} className="fc-auth-spinner" />{mode === 'login' ? 'در حال ورود…' : 'در حال ساخت حساب…'}</> : <><span>{mode === 'login' ? 'ورود به حساب' : step === 1 ? 'ادامه و انتخاب رمز' : 'ساخت حساب و ورود'}</span><ArrowLeft size={18} /></>}</button></div>
          </form>
          <p className="fc-auth-bottom">{mode === 'login' ? 'هنوز همسفر ما نشدی؟' : 'از قبل حساب داری؟'}<button type="button" disabled={pending} onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'ساخت حساب جدید' : 'وارد حسابت شو'}<ChevronLeft size={14} /></button></p>
        </>}
        <div className="fc-auth-footer"><span>FRIENDLY CAMP</span><a href="tel:09215014474"><Headphones size={14} />پشتیبانی</a></div>
      </div>
      <aside className="fc-auth-visual" aria-label="همراه با فرندلی کمپ">
        <img loading="lazy" decoding="async" src="/images/moments/camp.webp" alt="چادری رو به طبیعت سرسبز جنگل" />
        <div className="fc-auth-visual-top"><FriendlyCampLogo size="md" /><span>بیرون، زندگی جریان دارد.</span></div>
        <div className="fc-auth-visual-copy"><span className="fc-auth-visual-tag"><i />برای لحظه‌های بیرون از شهر</span><p>کمی دورتر،<br />کمی <em>نزدیک‌تر.</em></p><span className="fc-auth-visual-caption">دور از روزمرگی، نزدیک به طبیعت<br />و آدم‌هایی که هم‌مسیر تو هستند.</span><div className="fc-auth-visual-line" /><span className="fc-auth-visual-signature">همراهی از اینجا شروع می‌شود.</span></div>
      </aside>
    </div>
  </dialog>;
}
