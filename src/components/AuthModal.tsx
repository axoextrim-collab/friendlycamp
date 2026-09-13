import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Smartphone,
  KeyRound,
  AlertCircle,
  Gift,
  RefreshCw,
  Check,
  UserPlus,
  LogIn,
  Fingerprint,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Compass,
  Award,
  Users,
  CheckSquare,
  Shield,
  CreditCard,
  MapPin,
  FileText
} from 'lucide-react';
import { authApi } from '../api/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: {
    fullName: string;
    phone: string;
    email: string;
    nationalCode?: string;
  }) => void;
  initialTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'login'
}) => {
  // Mode: 'login' | 'register' | 'forgot_password'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>(initialTab);

  // Login Method: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');

  // Steps for OTP verification
  const [otpStep, setOtpStep] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Form States - Login
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Form States - Register
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regNationalCode, setRegNationalCode] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regPromoCode, setRegPromoCode] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Form States - Forgot Password
  const [forgotIdentifier, setForgotIdentifier] = useState<string>('');
  const [forgotSent, setForgotSent] = useState<boolean>(false);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!isOpen) return null;

  // Password Strength Calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'رمز عبور را وارد کنید', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) || /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'ضعیف - نیازمند کاراکتر بیشتر', color: 'bg-rose-500' };
      case 2:
        return { score: 50, label: 'متوسط - حروف و اعداد اضافه کنید', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'قوی - رمز عبور مطمئن', color: 'bg-emerald-500' };
      case 4:
        return { score: 100, label: 'عالی و رمزنگاری‌شده', color: 'bg-[#84cc16]' };
      default:
        return { score: 10, label: 'خیلی ضعیف', color: 'bg-rose-600' };
    }
  };

  const passStrength = getPasswordStrength(regPassword);

  // Start OTP Timer
  const startOtpTimer = () => {
    setTimerSeconds(60);
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier) {
      setErrorMessage('لطفاً شماره همراه یا ایمیل خود را وارد نمایید.');
      return;
    }

    if (loginMethod === 'password' && !loginPassword) {
      setErrorMessage('لطفاً رمز عبور خود را وارد کنید.');
      return;
    }

    if (loginMethod === 'otp' && !otpStep) {
      setIsLoading(true);
      try { await authApi.requestOtp(loginIdentifier); setOtpStep(true); startOtpTimer(); }
      catch (error) { setErrorMessage(error instanceof Error ? error.message : 'سرویس پیامک در دسترس نیست.'); }
      finally { setIsLoading(false); }
      return;
    }

    // Submit Final Login
    setIsLoading(true);
    try { const { user } = await authApi.login({ identifier: loginIdentifier, password: loginPassword, remember: rememberMe }); setSuccessMessage('ورود با موفقیت انجام شد.'); onLoginSuccess(user); onClose(); }
    catch (error) { setErrorMessage(`${error instanceof Error ? error.message : 'ورود ناموفق بود.'} اگر هنوز حساب ندارید، از تب «ثبت‌نام» حساب جدید بسازید.`); }
    finally { setIsLoading(false); }
  };

  // Handle Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regFullName.trim()) {
      setErrorMessage('لطفاً نام و نام خانوادگی خود را کامل وارد کنید.');
      return;
    }

    if (!regPhone || (!regPhone.startsWith('09') && !regPhone.startsWith('۰۹')) || regPhone.length < 11) {
      setErrorMessage('شماره همراه وارد شده معتبر نیست. (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)');
      return;
    }

    if (regNationalCode && regNationalCode.length !== 10) {
      setErrorMessage('کد ملی جهت صدور بیمه‌نامه باید دقیقاً ۱۰ رقم باشد.');
      return;
    }

    if (regPassword.length < 10) {
      setErrorMessage('رمز عبور باید حداقل ۱۰ کاراکتر و شامل حرف و عدد باشد.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('تکرار رمز عبور با رمز اصلی مطابقت ندارد.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('لطفاً شرایط و قوانین استفاده از خدمات فرندلی کمپ را تایید کنید.');
      return;
    }

    setIsLoading(true);
    try { const { user } = await authApi.register({ fullName: regFullName, phone: regPhone, email: regEmail, nationalCode: regNationalCode || undefined, password: regPassword, agreeTerms: true }); setSuccessMessage('حساب شما با موفقیت ساخته شد.'); onLoginSuccess(user); onClose(); }
    catch (error) { setErrorMessage(error instanceof Error ? error.message : 'ثبت‌نام ناموفق بود.'); }
    finally { setIsLoading(false); }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier) {
      setErrorMessage('لطفاً شماره همراه یا ایمیل خود را جهت بازیابی وارد نمایید.');
      return;
    }

    setIsLoading(true);
    authApi.requestOtp(forgotIdentifier).catch(error => setErrorMessage(error instanceof Error ? error.message : 'سرویس بازیابی در دسترس نیست.')).finally(() => setIsLoading(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title" className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 text-right overflow-hidden my-auto grid grid-cols-1 md:grid-cols-12">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-20 p-2 rounded-2xl bg-white/80 hover:bg-white text-slate-700 shadow-md transition cursor-pointer"
          title="بستن"
          aria-label="بستن پنجره ورود"
        >
          <X size={20} />
        </button>

        {/* LEFT COLUMN: HERO BRANDING & TRUST PANEL (Hidden on mobile) */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-[#002f38] via-[#003843] to-[#004e5a] text-white p-7 flex-col justify-between relative overflow-hidden">
          {/* Background Ambient Glow & Mountain Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#84cc16]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo & Badges */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#84cc16] text-[#064e3b] font-black text-xl flex items-center justify-center shadow-lg border-2 border-white/20 shrink-0">
                FC
              </div>
              <div>
                <h3 className="text-lg font-black text-white">فرندلی کمپ</h3>
                <span className="text-xs text-amber-300 font-bold block">پلتفرم جامع گردشگری و تورهای کمپینگ</span>
              </div>
            </div>

            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-2.5 backdrop-blur-sm">
              <span className="text-[11px] text-amber-300 font-black block flex items-center gap-1">
                <Sparkles size={14} className="fill-amber-300 text-amber-300" />
                <span>مزایای عضویت در باشگاه همنوردان:</span>
              </span>
              <ul className="text-xs text-slate-200 space-y-2 font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#84cc16] shrink-0" />
                  <span>پروفایل تخصصی همسفر و مدیریت علایق سفر</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#84cc16] shrink-0" />
                  <span>آرشیو امن عکس‌ها، سفرنامه‌ها و پادکست سفر</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#84cc16] shrink-0" />
                  <span>کیف پول سفر و کارت‌های باشگاه مشتریان</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-[#84cc16] shrink-0" />
                  <span>تنظیمات حریم خصوصی و درخواست همسفری</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom: Trust & Security Seals */}
          <div className="relative z-10 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1 font-mono font-bold text-amber-300">
              <ShieldCheck size={16} />
              <span>SSL 256-Bit</span>
            </span>
            <span className="flex items-center gap-1 font-bold">
              <Award size={15} className="text-[#84cc16]" />
              <span>دارای نماد رسمی اعتماد</span>
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE AUTH FORM */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          
          <div>
            {/* Form Header Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-[#004e5a] text-white flex items-center justify-center font-black text-base shadow md:hidden">
                  FC
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#003843]">
                    {mode === 'login' && 'ورود تخصصی به حساب کاربری'}
                    {mode === 'register' && 'ثبت‌نام همنورد جدید'}
                    {mode === 'forgot_password' && 'بازیابی رمز عبور'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {mode === 'login' && 'وارد حساب کاربری خود شوید تا بلیت‌ها و کیف پول را مدیریت کنید.'}
                    {mode === 'register' && 'با ثبت اطلاعات، پروفایل حرفه‌ای همسفر خود را رایگان ایجاد کنید.'}
                    {mode === 'forgot_password' && 'شماره همراه خود را جهت دریافت کد بازیابی وارد کنید.'}
                  </p>
                </div>
              </div>

              {/* Toggle Login/Register buttons */}
              {mode !== 'forgot_password' && (
                <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      setMode('login');
                      setOtpStep(false);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      mode === 'login' ? 'bg-[#004e5a] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ورود
                  </button>

                  <button
                    onClick={() => {
                      setMode('register');
                      setOtpStep(false);
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      mode === 'register' ? 'bg-[#004e5a] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ثبت‌نام
                  </button>
                </div>
              )}
            </div>

            {/* Alert Messages */}
            {errorMessage && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
                <ShieldAlert size={18} className="shrink-0 text-rose-600" />
                <span className="font-bold">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                <span className="font-bold">{successMessage}</span>
              </div>
            )}

            {/* ================= MODE 1: LOGIN ================= */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-medium">
                
                {/* Method selector tab */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-slate-700 font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('password');
                      setOtpStep(false);
                    }}
                    className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      loginMethod === 'password' ? 'bg-white text-[#003843] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Lock size={14} />
                    <span>ورود با رمز عبور</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('otp')}
                    className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      loginMethod === 'otp' ? 'bg-white text-[#003843] shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone size={14} />
                    <span>ورود با کد پیامکی (OTP)</span>
                  </button>
                </div>

                {!otpStep ? (
                  <>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">شماره همراه یا پست الکترونیکی:</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="مثلاً: ۰۹۱۲۳۴۵۶۷۸۹ یا info@friendlycamp.ir"
                          value={loginIdentifier}
                          onChange={(e) => setLoginIdentifier(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-10 pl-4 py-3 text-slate-900 font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                        />
                        <User size={18} className="absolute right-3.5 top-3.5 text-slate-400" />
                      </div>
                    </div>

                    {loginMethod === 'password' && (
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-slate-700 font-bold">رمز عبور:</label>
                          <button
                            type="button"
                            onClick={() => setMode('forgot_password')}
                            className="text-[#004e5a] hover:underline font-bold text-[11px]"
                          >
                            رمز عبور را فراموش کرده‌اید؟
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-10 pl-10 py-3 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                          />
                          <Lock size={18} className="absolute right-3.5 top-3.5 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600 font-bold">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded text-[#004e5a] focus:ring-[#004e5a]"
                        />
                        <span>مرا به خاطر بسپار</span>
                      </label>

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>اتصال ایمن SSL</span>
                      </span>
                    </div>
                  </>
                ) : (
                  /* OTP Entry */
                  <div className="space-y-4 py-2 animate-in fade-in">
                    <div className="text-center space-y-1">
                      <span className="text-slate-700 font-bold block">کد تایید پیامک‌شده را وارد کنید:</span>
                      <p className="text-xs text-slate-400 font-mono">ارسال‌شده به {loginIdentifier}</p>
                    </div>

                    <div className="flex justify-center gap-2" dir="ltr">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={otpCode[idx] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newCode = [...otpCode];
                            newCode[idx] = val;
                            setOtpCode(newCode);
                            if (val && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-xl font-mono font-black bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-[#004e5a] focus:bg-white text-slate-900 focus:outline-none transition"
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-2">
                      <button
                        type="button"
                        disabled={isTimerRunning}
                        onClick={startOtpTimer}
                        className={`text-[#004e5a] hover:underline ${isTimerRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        ارسال مجدد کد تایید
                      </button>

                      <span className="font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ⏱ {timerSeconds} ثانیه
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#004e5a] hover:bg-[#003843] text-white font-black py-3.5 rounded-2xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin text-[#84cc16]" />
                      <span>در حال اعتبارسنجی...</span>
                    </>
                  ) : (
                    <>
                      <span>{otpStep ? 'تایید و ورود به سیستم' : loginMethod === 'otp' ? 'دریافت کد پیامکی' : 'ورود به حساب کاربری'}</span>
                      <ArrowRight size={18} className="rotate-180" />
                    </>
                  )}
                </button>

              </form>
            )}

            {/* ================= MODE 2: REGISTER ================= */}
            {mode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs font-medium">
                
                {/* Promo Gift Banner */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2.5 text-emerald-900">
                  <Gift size={22} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black block text-xs">ساخت رایگان پروفایل حرفه‌ای همسفر</span>
                    <span className="text-[10px] text-emerald-700 font-medium">پس از ثبت‌نام، اطلاعات سفر و رسانه‌های خود را مدیریت کنید.</span>
                  </div>
                </div>

                {!otpStep ? (
                  <>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">نام و نام خانوادگی (طابق کارت ملی):</label>
                      <input
                        type="text"
                        required
                        placeholder="مثلاً: سامان ملک‌زاده"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">شماره همراه اصلی:</label>
                        <input
                          type="text"
                          required
                          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">کد ملی (جهت صدور بیمه):</label>
                        <input
                          type="text"
                          maxLength={10}
                          placeholder="۰۰۱۲۳۴۵۶۷۸"
                          value={regNationalCode}
                          onChange={(e) => setRegNationalCode(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">پست الکترونیکی (اختیاری):</label>
                      <input
                        type="email"
                        placeholder="example@gmail.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 font-medium focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">تعیین رمز عبور:</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="حداقل ۶ کاراکتر"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-2xl pr-3.5 pl-9 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">تکرار رمز عبور:</label>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="تکرار همان رمز"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    {/* Password Strength Indicator Bar */}
                    {regPassword && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>سنجش امنیت رمز عبور:</span>
                          <span>{passStrength.label}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${passStrength.color}`}
                            style={{ width: `${passStrength.score}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">کد معرف یا تخفیف (اختیاری):</label>
                      <input
                        type="text"
                        placeholder="مثلاً: FRIENDLY2026"
                        value={regPromoCode}
                        onChange={(e) => setRegPromoCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2.5 text-slate-900 font-mono font-bold uppercase"
                      />
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms-check"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-[#004e5a] focus:ring-[#004e5a] cursor-pointer"
                      />
                      <label htmlFor="terms-check" className="text-slate-600 text-[11px] leading-relaxed cursor-pointer font-medium">
                        <span>کلیه </span>
                        <a href="#terms" onClick={(e) => e.preventDefault()} className="text-[#004e5a] font-black underline">
                          شرایط استفاده از خدمات و قوانین بیمه حوادث
                        </a>
                        <span> فرندلی کمپ را مطالعه نموده و می‌پذیرم.</span>
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 py-3 animate-in fade-in">
                    <div className="text-center space-y-1">
                      <span className="text-slate-700 font-bold block">کد پیامک‌شده به شماره همراه را بنویسید:</span>
                      <p className="text-xs text-slate-400 font-mono">ارسال‌شده به {regPhone}</p>
                    </div>

                    <div className="flex justify-center gap-2" dir="ltr">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={otpCode[idx] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newCode = [...otpCode];
                            newCode[idx] = val;
                            setOtpCode(newCode);
                            if (val && e.target.nextElementSibling) {
                              (e.target.nextElementSibling as HTMLInputElement).focus();
                            }
                          }}
                          className="w-12 h-12 text-center text-xl font-mono font-black bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-[#004e5a] focus:bg-white text-slate-900 focus:outline-none transition"
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-2">
                      <button
                        type="button"
                        disabled={isTimerRunning}
                        onClick={startOtpTimer}
                        className={`text-[#004e5a] hover:underline ${isTimerRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        ارسال مجدد کد
                      </button>
                      <span className="font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        ⏱ {timerSeconds} ثانیه
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-black py-3.5 rounded-2xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2 text-sm mt-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>در حال ثبت اطلاعات...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>ایجاد حساب امن</span>
                    </>
                  )}
                </button>

              </form>
            )}

            {/* ================= MODE 3: FORGOT PASSWORD ================= */}
            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs font-medium">
                {!forgotSent ? (
                  <>
                    <p className="text-slate-600 text-xs leading-relaxed font-medium">
                      شماره همراه یا پست الکترونیکی خود را وارد نمایید. لینک و کد موقت بازنشانی رمز عبور فوراً برای شما ارسال می‌گردد.
                    </p>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">شماره همراه یا ایمیل:</label>
                      <input
                        type="text"
                        required
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹ یا info@friendlycamp.ir"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-3 text-slate-900 font-bold focus:outline-none focus:border-[#004e5a] focus:bg-white transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#004e5a] hover:bg-[#003843] text-white font-black py-3.5 rounded-2xl transition cursor-pointer shadow-lg flex items-center justify-center gap-2 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin text-[#84cc16]" />
                          <span>در حال ارسال...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={18} />
                          <span>ارسال کد بازیابی رمز عبور</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 text-center py-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
                      ✓
                    </div>
                    <h4 className="font-black text-sm text-slate-900">کد پیامک بازیابی ارسال گردید</h4>
                    <p className="text-slate-600 text-xs font-medium">
                      کد تایید موقت بازیابی به {forgotIdentifier} پیامک شد. پس از ورود می‌توانید رمز جدید را ثبت فرمایید.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setForgotSent(false);
                      }}
                      className="mt-2 bg-[#004e5a] text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer shadow"
                    >
                      ورود به حساب
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full text-center text-[#004e5a] font-bold text-xs hover:underline block pt-2"
                >
                  بازگشت به فرم ورود
                </button>
              </form>
            )}

          </div>

          {/* Footer Footer Info */}
          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium flex items-center justify-between">
            <span>باشگاه همنوردان فرندلی کمپ © ۱۴۰۵</span>
            <span className="flex items-center gap-1 font-mono text-slate-500">
              <Shield size={12} className="text-emerald-600" />
              <span>پشتیبانی ۲۴ ساعته</span>
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
