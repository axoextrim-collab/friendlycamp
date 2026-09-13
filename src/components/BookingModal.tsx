import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Users,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  MapPin,
  Tent,
  Utensils,
  Bus,
  Camera,
  Tag,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Phone,
  User,
  HeartPulse,
  Award,
  UserPlus,
  Trash2,
  Users2,
  Clock,
  Compass,
  BadgeCheck,
  Check,
  Flame,
  Info,
  ChevronLeft,
  HelpCircle,
  FileText,
  Lock,
  Shield,
  MessageCircle,
  Share2,
  Smartphone,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Tour } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  tour: Tour | null;
  onClose: () => void;
  onConfirmBooking: (tour: Tour, date: string, guests: number) => void;
  onShowEmailTicket?: (tour: Tour, date: string, guests: number, fullName: string) => void;
}

interface Companion {
  id: number;
  fullName: string;
  nationalCode: string;
  phone?: string;
}

// Sample group departure dates with capacity and seasonal badges
const DEPARTURE_DATES = [
  { id: 'd1', date: '۱۴۰۵/۰۶/۱۵', dayName: 'چهارشنبه', label: 'تعطیلات آخر تابستان - کمپینگ زیر ستاره‌ها', status: '۵ ظرفیت باقی‌مانده', isPopular: true, discountPercent: 5 },
  { id: 'd2', date: '۱۴۰۵/۰۶/۲۲', dayName: 'پنج‌شنبه', label: 'آخر هفته پاییزی - شب‌نشینی دور آتش', status: '۸ ظرفیت باقی‌مانده', isPopular: false, discountPercent: 0 },
  { id: 'd3', date: '۱۴۰۵/۰۶/۲۹', label: 'تور ویژه عکاسی نجومی و هلی‌شات', status: '۱۲ ظرفیت باقی‌مانده', isPopular: true, discountPercent: 0, dayName: 'چهارشنبه' },
  { id: 'd4', date: '۱۴۰۵/۰۷/۰۶', dayName: 'پنج‌شنبه', label: 'کمپینگ طلایی مهرماه - طبیعت پاییزی', status: 'ظرفیت باز', isPopular: false, discountPercent: 0 },
];

// Pickup Stations with detailed descriptions
const PICKUP_STATIONS = [
  { id: 'st1', title: 'تهران - میدان آزادی', subtitle: 'ضلع غربی، ورودی ترمینال غرب', time: 'ساعت ۰۴:۳۰ صبح', icon: Bus },
  { id: 'st2', title: 'کرج - پل فردیس', subtitle: 'جنب ترمینال شهید کلانتری', time: 'ساعت ۰۵:۱۵ صبح', icon: Bus },
  { id: 'st3', title: 'قزوین - میدان مینا', subtitle: 'میدان اصلی ورودی شهر', time: 'ساعت ۰۶:۳۰ صبح', icon: Bus },
  { id: 'st4', title: 'حضور مستقیم در محل کمپ', subtitle: 'ورود با خودروی شخصی (آفرود/سواری)', time: 'ساعت ۰۹:۰۰ صبح', icon: MapPin },
];

// Camping Tent & Accommodation Options
const TENT_OPTIONS = [
  {
    id: 't1',
    title: 'چادر ۲پوش ۲ نفره اختصاصی فرندلی',
    desc: 'ضدآب، آستر حرارتی دوبل - مناسب زوجین و همنوردان',
    badge: 'استاندارد رایگان',
    price: 0
  },
  {
    id: 't2',
    title: 'چادر ۴ نفره گروهی بزرگ و ارتفاع‌دار',
    desc: 'فضای باز، هواکش توری دوجداره - مناسب خانواده و گروه‌ها',
    badge: 'گروهی رایگان',
    price: 0
  },
  {
    id: 't3',
    title: 'سرویس VIP گلمپینگ (Glamping)',
    desc: 'چادر برپا شده + تشک بادی دوطبقه + بالشت و زیرانداز حرارتی',
    badge: 'ویژه و لوکس',
    price: 350000
  },
];

// Addon Gear & Extras
const ADDON_SERVICES = [
  {
    id: 'add_sleeping_bag',
    title: 'اجاره کیسه‌خواب حرفه‌ای منفی ۱۰ درجه',
    desc: 'برند Ferrino/Deuter با آستر ضدعفونی‌شده و پر ارگانیک',
    price: 250000,
    icon: Tent,
    tag: 'تجهیزات کمپینگ'
  },
  {
    id: 'add_tent_glamping',
    title: 'اجاره چادر ۲پوش دوبل ضدآب گلمپینگ ۲ نفره',
    desc: 'چادر ارتفاع بلند ضدباران به همراه زیرانداز نانو و هدلامپ',
    price: 350000,
    icon: Tent,
    tag: 'تجهیزات کمپینگ'
  },
  {
    id: 'add_camping_chairs',
    title: 'اجاره ست ۲ عددی صندلی تاشو + میز آلومینیومی',
    desc: 'صندلی‌های راحتی تاشو پایه قوی به همراه میز چای کمپینگ',
    price: 180000,
    icon: Tent,
    tag: 'تجهیزات کمپینگ'
  },
  {
    id: 'add_camping_mat',
    title: 'اجاره زیرانداز آکاردئونی عایق رطوبت و سرما',
    desc: 'زیرانداز ضخیم فوم آکاردئونی مخصوص کف چادر',
    price: 80000,
    icon: Tent,
    tag: 'تجهیزات کمپینگ'
  },
  {
    id: 'add_meals',
    title: 'پکیج کامل ۳ وعده غذای گرم ارگانیک',
    desc: 'صبحانه محلی، ناهار جوجه‌کباب هیزمی، شام آش داغ آتیشی',
    price: 480000,
    icon: Utensils,
    tag: 'پذیرایی'
  },
  {
    id: 'add_vip_bus',
    title: 'ترانسفر اتوبوس ۲۵ صندلی VIP تخت‌شو',
    desc: 'سیستم صوتی، مانیتور شخصی، اینترنت Wi-Fi و پذیرایی طول راه',
    price: 650000,
    icon: Bus,
    tag: 'ترانسفر VIP'
  },
  {
    id: 'add_photo',
    title: 'پکیج عکاسی پرتره و تصویربرداری هلی‌شات',
    desc: 'تحویل ۵ فایل ادیت‌شده کیفیت 4K در طبیعت به همراه مستند سفر',
    price: 380000,
    icon: Camera,
    tag: 'یادگاری'
  }
];

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  tour,
  onClose,
  onConfirmBooking,
  onShowEmailTicket
}) => {
  // Step state (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form selections
  const [selectedDate, setSelectedDate] = useState<string>(DEPARTURE_DATES[0].date);
  const [pickupStation, setPickupStation] = useState<string>(PICKUP_STATIONS[0].id);
  const [tentOption, setTentOption] = useState<string>(TENT_OPTIONS[0].id);
  const [guests, setGuests] = useState<number>(2);

  // Primary passenger details (Leader)
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [nationalCode, setNationalCode] = useState<string>('');
  const [emergencyPhone, setEmergencyPhone] = useState<string>('');
  const [fitnessLevel, setFitnessLevel] = useState<string>('normal');
  const [specialNotes, setSpecialNotes] = useState<string>('');

  // Additional Companions List (for guests > 1)
  const [companions, setCompanions] = useState<Companion[]>([
    { id: 2, fullName: '', nationalCode: '', phone: '' }
  ]);

  // Selected Add-ons
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['add_meals']);

  // Coupon
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string>('');
  const [couponSuccess, setCouponSuccess] = useState<string>('');

  // Submission & Payment Gateway state
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'reserved' | 'card'>('online');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Payment Gateway Simulation State
  const [isGatewayActive, setIsGatewayActive] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>('۶۰۳۷ - ۹۹۷۵ - ۸۳۹۲ - ۱۰۴۹');
  const [cvv2, setCvv2] = useState<string>('۴۸۲');
  const [expMonth, setExpMonth] = useState<string>('۰۸');
  const [expYear, setExpYear] = useState<string>('۰۷');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  if (!isOpen || !tour) return null;

  // Sync companions when guest count changes via counter
  const handleGuestCountChange = (newCount: number) => {
    const count = Math.max(1, Math.min(15, newCount));
    setGuests(count);

    setCompanions((prev) => {
      const targetLength = count - 1;
      if (prev.length < targetLength) {
        const added: Companion[] = [];
        for (let i = prev.length + 1; i <= targetLength; i++) {
          added.push({ id: i + 1, fullName: '', nationalCode: '', phone: '' });
        }
        return [...prev, ...added];
      } else {
        return prev.slice(0, targetLength);
      }
    });
  };

  const handleAddCompanion = () => {
    if (guests >= 15) return;
    const newGuestCount = guests + 1;
    setGuests(newGuestCount);
    setCompanions((prev) => [
      ...prev,
      { id: newGuestCount, fullName: '', nationalCode: '', phone: '' }
    ]);
  };

  const handleRemoveCompanion = (index: number) => {
    if (guests <= 1) return;
    setGuests((prev) => prev - 1);
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompanionChange = (index: number, field: keyof Companion, value: string) => {
    setCompanions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Extract base numerical price from string e.g. "۴,۲۰۰,۰۰۰ تومان" -> 4200000
  const parsePrice = (priceStr: string): number => {
    const englishDigits = priceStr
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[^0-9]/g, '');
    const val = parseInt(englishDigits, 10);
    return isNaN(val) ? 3800000 : val;
  };

  const baseUnitPrice = parsePrice(tour.price);

  // Group discount (10% off for 4 or more guests)
  const groupDiscountPercent = guests >= 4 ? 10 : 0;

  // Calculate pricing breakdown
  const baseTotal = baseUnitPrice * guests;
  const groupDiscountAmount = Math.round((baseTotal * groupDiscountPercent) / 100);

  const tentExtra = (TENT_OPTIONS.find((t) => t.id === tentOption)?.price || 0) * guests;

  const addonsTotal = selectedAddons.reduce((sum, addId) => {
    const item = ADDON_SERVICES.find((a) => a.id === addId);
    return sum + (item ? item.price * guests : 0);
  }, 0);

  // Online booking auto 5% discount
  const onlineDiscount = Math.round(baseTotal * 0.05);

  const grandTotal = Math.max(
    0,
    baseTotal + tentExtra + addonsTotal - onlineDiscount - groupDiscountAmount - appliedDiscount
  );

  // Format currency in Persian digits
  const formatToman = (num: number): string => {
    return num.toLocaleString('fa-IR') + ' تومان';
  };

  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter((id) => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    const clean = couponCode.trim().toUpperCase();
    if (clean === 'FRIENDLY' || clean === 'CAMP' || clean === 'SUMMER' || clean === 'NATURE') {
      const discountVal = 250000 * guests;
      setAppliedDiscount(discountVal);
      setCouponSuccess(`کد تخفیف ویژه با موفقیت اعمال شد! (${formatToman(discountVal)} کسر گردید)`);
    } else if (clean === '') {
      setCouponError('لطفاً کد تخفیف را وارد کنید');
    } else {
      setCouponError('کد تخفیف وارد شده معتبر نیست (کد پیشنهادی: FRIENDLY)');
    }
  };

  const handleNextStep = () => {
    if (currentStep === 2) {
      if (!fullName.trim() || !phone.trim() || !nationalCode.trim()) {
        alert('لطفاً نام، شماره همراه و کد ملی سرپرست گروه را جهت صدور بیمه‌نامه وارد کنید.');
        return;
      }
      for (let i = 0; i < companions.length; i++) {
        const comp = companions[i];
        if (comp.fullName.trim() && !comp.nationalCode.trim()) {
          alert(`لطفاً کد ملی همراه شماره ${i + 2} (${comp.fullName}) را جهت صدور بیمه‌نامه حوادث وارد کنید.`);
          return;
        }
      }
    }
    setCurrentStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'online') {
      setIsGatewayActive(true);
      setPaymentSuccess(false);
      setIsProcessingPayment(false);
    } else {
      setSubmitted(true);
      setTimeout(() => {
        onConfirmBooking(tour, selectedDate, guests);
        setSubmitted(false);
        setCurrentStep(1);
        onClose();
      }, 2000);
    }
  };

  const handleRequestOtp = () => {
    setOtpSent(true);
    setOtpOtpCode('۷۸۴۹۲۰');
  };

  const setOtpOtpCode = (val: string) => {
    setOtpCode(val);
  };

  const handleProcessGatewayPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      onConfirmBooking(tour, selectedDate, guests);
    }, 1500);
  };

  // Filter filled companion names for summary
  const filledCompanions = companions.filter((c) => c.fullName.trim() !== '');
  const selectedStationObj = PICKUP_STATIONS.find((s) => s.id === pickupStation);
  const selectedTentObj = TENT_OPTIONS.find((t) => t.id === tentOption);

  if (isGatewayActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
        <div className="relative w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl border border-slate-300 text-right overflow-hidden my-auto flex flex-col">
          
          {/* Shaparak Header */}
          <div className="bg-[#1e2b37] text-white p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-950 text-sm">
                SH
              </div>
              <div>
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <span>درگاه پرداخت اینترنتی شبکه شتاب (شاپرک)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    اتصال امن SSL
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">پرداخت‌یار رسمی: به پرداخت ملت / پرداخت الکترونیک سامان</p>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="text-[10px] text-slate-400 block">زمان باقی‌مانده:</span>
              <span className="text-amber-400 font-extrabold text-sm flex items-center gap-1">
                <Clock size={13} />
                ۰۹:۵۴
              </span>
            </div>
          </div>

          {!paymentSuccess ? (
            <div className="p-6 space-y-5">
              {/* Order Info Strip */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-medium">
                <div>
                  <span className="text-slate-400 block text-[11px]">پذیرنده:</span>
                  <span className="font-bold text-slate-800">سامانه تورهای فرندلی کمپ (Friendly Camp)</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block text-[11px]">مبلغ کل:</span>
                  <span className="font-black text-[#004e5a] text-base font-mono">{formatToman(grandTotal)}</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 text-xs font-medium bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                
                {/* Card Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>شماره ۱۶ رقمی کارت بانکی:</span>
                    <span className="text-[10px] text-emerald-700 font-bold">✓ کارت‌های شتاب پشتیبانی می‌شود</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-left font-mono font-bold text-slate-900 tracking-wider text-sm focus:outline-none focus:border-[#004e5a]"
                      placeholder="XXXX - XXXX - XXXX - XXXX"
                    />
                    <div className="absolute left-3 top-2.5 text-[10px] bg-sky-100 text-sky-900 font-extrabold px-2 py-0.5 rounded-md">
                      بانک ملی ایران
                    </div>
                  </div>
                </div>

                {/* CVV2 & Expiry */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">کد شناسایی دوم (CVV2):</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cvv2}
                      onChange={(e) => setCvv2(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-center font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-[#004e5a]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">تاریخ انقضاء (ماه / سال):</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={2}
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        placeholder="ماه"
                        className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl py-2 text-center font-mono font-bold text-xs"
                      />
                      <input
                        type="text"
                        maxLength={2}
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        placeholder="سال"
                        className="w-1/2 bg-slate-50 border border-slate-300 rounded-xl py-2 text-center font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* OTP Request */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز پویا (SMS Password):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="کد ۶ رقمی پیامک‌شده"
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-center text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black px-3 py-2 rounded-xl text-xs transition cursor-pointer shrink-0"
                    >
                      {otpSent ? 'ارسال مجدد کد' : 'درخواست رمز پویا'}
                    </button>
                  </div>

                  {otpSent && (
                    <div className="mt-2 bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Smartphone size={14} className="text-emerald-600" />
                        <span>پیامک سیستم بانک: کد پویای شما ۷۸۴۹۲۰ است.</span>
                      </span>
                      <span className="text-emerald-700 font-mono text-[10px]">خودکار درج شد ✓</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGatewayActive(false)}
                  className="px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  انصراف و بازگشت
                </button>

                <button
                  type="button"
                  onClick={handleProcessGatewayPayment}
                  disabled={isProcessingPayment}
                  className="flex-1 bg-[#004e5a] hover:bg-[#003843] text-white font-black text-xs py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>در حال استعلام از شبکه شتاب...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="text-[#84cc16]" />
                      <span>پرداخت و صدور قطعی بلیط</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            /* Successful Payment Receipt Screen */
            <div className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={40} />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">پرداخت با موفقیت انجام شد!</h3>
                <p className="text-xs text-slate-500 font-medium mt-1">تراکنش شما توسط شبکه شاپرک و بانک عامل تایید گردید.</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs space-y-2 text-right">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">شماره ارجاع شاپرک:</span>
                  <span className="font-mono font-bold text-slate-900">۷۸۴۹۲۰۱۸۳</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">کد رهگیری تور:</span>
                  <span className="font-mono font-bold text-[#004e5a]">FC-849201</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400">نام سرپرست:</span>
                  <span className="font-bold text-slate-800">{fullName || 'سامان ملک‌زاده'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">مبلغ نهایی واریزی:</span>
                  <span className="font-mono font-black text-emerald-700">{formatToman(grandTotal)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsGatewayActive(false);
                    onClose();
                    if (onShowEmailTicket) {
                      onShowEmailTicket(tour, selectedDate, guests, fullName);
                    }
                  }}
                  className="flex-1 bg-[#004e5a] hover:bg-[#003843] text-white font-black text-xs py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FileText size={16} className="text-[#84cc16]" />
                  <span>مشاهده ایمیل تاییدیه و دانلود بلیط</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsGatewayActive(false);
                    onClose();
                  }}
                  className="px-5 py-3.5 rounded-2xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  بازگشت به سایت
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="رزرو تور" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 text-right overflow-hidden my-auto max-h-[95vh] flex flex-col">
        
        {/* Top Visual Banner Header */}
        <div className="relative bg-[#14382c] text-white p-5 sm:p-6 shrink-0 overflow-hidden">
          {/* Subtle Background Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#14382c] via-[#1c4c3d] to-[#14382c] opacity-90" />
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer z-20 border border-white/10 shadow-md"
            aria-label="بستن"
          >
            <X size={18} />
          </button>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="bg-[#d97706] text-white text-[10px] font-black px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles size={12} />
                  <span>سامانه هوشمند رزرو آنلاین فرندلی کمپ</span>
                </span>
                <span className="bg-emerald-800/80 text-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  تضمین قیمت + بیمه کامل حوادث
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1.5 leading-tight">
                {tour.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-emerald-200/90 font-medium flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock size={13} className="text-amber-400" />
                  <span>مدت برنامه: {tour.duration}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Compass size={13} className="text-amber-400" />
                  <span>منطقه: {tour.country}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award size={13} className="text-amber-400" />
                  <span>درجه سختی: ۳ از ۵</span>
                </span>
              </div>
            </div>

            {/* Price Preview Pill in Header */}
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-left shrink-0 min-w-[180px]">
              <span className="text-[10px] text-emerald-200 block text-right font-medium">مبلغ پایه هر نفر:</span>
              <span className="text-lg font-black text-amber-300 font-mono block text-right">
                {tour.price}
              </span>
            </div>
          </div>

          {/* Stepper Wizard Indicator */}
          {!submitted && (
            <div className="relative z-10 mt-5 pt-4 border-t border-white/15">
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { step: 1, label: '۱. تاریخ و ایستگاه', sub: 'زمان و اسکان' },
                  { step: 2, label: '۲. مشخصات مسافران', sub: 'ثبت بیمه انفرادی' },
                  { step: 3, label: '۳. تجهیزات و خدمات', sub: 'کیسه‌خواب و غذا' },
                  { step: 4, label: '۴. پیش‌فاکتور و پرداخت', sub: 'تثبیت نهایی' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => {
                      if (s.step < currentStep) setCurrentStep(s.step);
                    }}
                    disabled={s.step > currentStep}
                    className={`py-2 px-2 rounded-2xl text-[10px] sm:text-xs font-black transition flex flex-col items-center justify-center gap-0.5 border ${
                      currentStep === s.step
                        ? 'bg-[#d97706] text-white border-amber-300 shadow-lg scale-[1.02]'
                        : currentStep > s.step
                        ? 'bg-emerald-800/80 text-emerald-100 border-emerald-600/50 cursor-pointer hover:bg-emerald-700'
                        : 'bg-white/5 text-white/40 border-white/5 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {currentStep > s.step && <CheckCircle size={13} className="text-amber-300 shrink-0" />}
                      <span className="truncate">{s.label}</span>
                    </div>
                    <span className="text-[9px] font-normal opacity-80 hidden sm:inline">{s.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body - Split Layout for Desktop */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-800 bg-[#fcfbfa]">
          
          {submitted ? (
            /* Confirmation Success Screen */
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-5 max-w-xl mx-auto">
              <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center animate-bounce shadow-xl border-2 border-emerald-400">
                <CheckCircle size={56} />
              </div>

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#14382c] mb-1">
                  رزرو گروهی شما با موفقیت ثبت شد!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">
                  بلیط الکترونیکی و فرم بیمه‌نامه حوادث با موفقیت صادر گردید.
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-md w-full text-xs text-slate-800 font-medium space-y-2.5 text-right">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">سرپرست گروه:</span>
                  <span className="font-extrabold text-[#14382c]">{fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">تعداد مسافران:</span>
                  <span className="font-extrabold">{guests} نفر</span>
                </div>
                {filledCompanions.length > 0 && (
                  <div className="border-b border-slate-100 pb-2">
                    <span className="block text-slate-500 mb-1">همراهان ثبت‌شده:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {filledCompanions.map((c, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-200 text-[11px] font-bold">
                          {c.fullName || `همراه ${i + 1}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">مبدأ و ایستگاه حرکت:</span>
                  <span className="font-bold">{selectedStationObj?.title}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">تاریخ حرکت:</span>
                  <span className="font-extrabold text-[#14382c]">{selectedDate}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">مبلغ نهایی فاکتور:</span>
                  <span className="font-black text-[#d97706] text-sm font-mono">{formatToman(grandTotal)}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                پیامک حاوی لینک جزئیات سفر و شماره تلفن لیدر سرپرست به شماره <strong>{phone}</strong> ارسال شد. سرپرست برنامه جهت هماهنگی وسایل شخص ۴۸ ساعت قبل از حرکت با شما تماس می‌گیرد.
              </p>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-200 shadow-sm">
                <ShieldCheck size={18} className="text-[#14382c]" />
                <span>کد رهگیری صادرشده: FC-{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>

              {/* Instant WhatsApp Support Share Button */}
              <a
                href={`https://wa.me/989123456789?text=${encodeURIComponent(
                  `سلام پشتیبانی فرندلی کمپ! 👋\nمشخصات رزرو بلیت تور من به شرح زیر است:\n\n📌 نام تور: ${tour.title}\n👤 سرپرست رزرو: ${fullName}\n📞 شماره تماس: ${phone}\n👥 تعداد مسافران: ${guests} نفر\n📅 تاریخ حرکت: ${selectedDate}\n📍 ایستگاه سوار شدن: ${selectedStationObj?.title || 'ایستگاه اصلی'}\n💰 مبلغ فاکتور: ${formatToman(grandTotal)}\n\nلطفاً بلیت الکترونیکی و فرم بیمه را تایید نمایید.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-xs sm:text-sm py-3.5 px-5 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform active:scale-95"
              >
                <MessageCircle size={20} />
                <span>ارسال مستقیم مشخصات بلیت به پشتیبانی واتس‌اپ</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Main Steps Form Area (Left/Top on mobile, Right on Desktop RTL) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* STEP 1: DATE, GUESTS, STATIONS & ACCOMMODATION */}
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    {/* Departure Dates Selector */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-1.5 text-sm font-black text-[#14382c]">
                          <Calendar size={18} className="text-[#d97706]" />
                          <span>انتخاب تاریخ حرکت و گروه کمپینگ:</span>
                        </label>
                        <span className="text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          حرکت‌های قطعی
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {DEPARTURE_DATES.map((dep) => (
                          <div
                            key={dep.id}
                            onClick={() => setSelectedDate(dep.date)}
                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                              selectedDate === dep.date
                                ? 'bg-white border-[#14382c] shadow-lg ring-2 ring-[#14382c]/20'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {dep.isPopular && (
                              <span className="absolute top-0 left-0 bg-[#d97706] text-white text-[9px] font-black px-2.5 py-0.5 rounded-br-xl">
                                پرتقاضا
                              </span>
                            )}

                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-base font-black text-[#14382c] font-mono">
                                {dep.date} ({dep.dayName})
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 font-bold mb-3 leading-snug">
                              {dep.label}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                {dep.status}
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedDate === dep.date ? 'border-[#14382c] bg-[#14382c]' : 'border-slate-300'
                              }`}>
                                {selectedDate === dep.date && <Check size={12} className="text-white" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Number of Guests Counter */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#14382c] mb-1">
                          <Users size={18} className="text-[#d97706]" />
                          <span>تعداد کل مسافران این سفارش:</span>
                        </label>
                        <p className="text-[11px] text-slate-500 font-medium">
                          برای ثبت چند نفر همزمان، تعداد را افزایش دهید (برای ۴ نفر به بالا ۱۰٪ تخفیف گروهی محاسبه می‌شود).
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-300 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleGuestCountChange(guests - 1)}
                          className="w-10 h-10 rounded-xl bg-white hover:bg-slate-200 text-slate-900 font-black text-xl flex items-center justify-center transition cursor-pointer shadow-sm border border-slate-200"
                        >
                          -
                        </button>
                        <span className="w-16 text-center text-lg font-black text-[#14382c]">
                          {guests} نفر
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGuestCountChange(guests + 1)}
                          className="w-10 h-10 rounded-xl bg-[#14382c] hover:bg-[#0e2a21] text-white font-black text-xl flex items-center justify-center transition cursor-pointer shadow-md"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Pickup Station Selection */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#14382c] mb-3">
                        <MapPin size={18} className="text-[#d97706]" />
                        <span>انتخاب مبدأ سوار شدن و ایستگاه حرکت:</span>
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PICKUP_STATIONS.map((st) => {
                          const IconComp = st.icon;
                          const isSelected = pickupStation === st.id;
                          return (
                            <div
                              key={st.id}
                              onClick={() => setPickupStation(st.id)}
                              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-50/80 border-[#d97706] text-amber-950 shadow-md'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-[#d97706] text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <IconComp size={18} />
                                </div>
                                <div className="flex flex-col text-xs">
                                  <span className="font-extrabold text-[#14382c]">{st.title}</span>
                                  <span className="text-[10px] text-slate-500 font-medium">{st.subtitle}</span>
                                  <span className="text-[10px] text-[#d97706] font-bold mt-0.5">{st.time}</span>
                                </div>
                              </div>

                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#d97706] bg-[#d97706]' : 'border-slate-300'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Camping Tent & Accommodation Options */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-[#14382c] mb-3">
                        <Tent size={18} className="text-[#d97706]" />
                        <span>انتخاب نوع چادر و محل اسکان در کمپ:</span>
                      </label>

                      <div className="space-y-2.5">
                        {TENT_OPTIONS.map((tent) => {
                          const isSelected = tentOption === tent.id;
                          return (
                            <div
                              key={tent.id}
                              onClick={() => setTentOption(tent.id)}
                              className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between text-xs ${
                                isSelected
                                  ? 'bg-emerald-50 border-[#14382c] font-bold shadow-sm'
                                  : 'bg-white border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-[#14382c] text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  <Tent size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#14382c]">{tent.title}</span>
                                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                      {tent.badge}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-medium block mt-0.5">{tent.desc}</span>
                                </div>
                              </div>

                              <span className="font-black text-[#d97706] shrink-0 font-mono text-xs">
                                {tent.price === 0 ? 'رایگان (روی تور)' : `+${formatToman(tent.price * guests)}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 2: MULTI-PASSENGER & INSURANCE DETAILS */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-950 font-medium shadow-sm">
                      <ShieldCheck size={22} className="text-[#d97706] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-extrabold block text-sm mb-0.5 text-[#14382c]">ثبت‌نام همزمان چند مسافر برای صدور بیمه حوادث:</span>
                        <span>
                          کد ملی و نام تمام همراهان جهت صدور بیمه‌نامه انفرادی حوادث و اخذ مجوزهای تردد گروهی الزامی است.
                        </span>
                      </div>
                    </div>

                    {/* Section 1: Leader Details */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-xs sm:text-sm font-black text-[#14382c] flex items-center gap-2">
                          <User size={18} className="text-[#d97706]" />
                          <span>مسافر شماره ۱ (سرپرست و تحویل‌گیرنده اصلی):</span>
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                          طرف قرارداد
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>
                            نام و نام خانوادگی سرپرست:
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="مثلاً: سامان ملک‌زاده"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14382c] font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>
                            شماره همراه (واتس‌اپ و اطلاع‌رسانی):
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14382c] font-mono text-left"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                            <span className="text-red-500 mr-1">*</span>
                            کد ملی سرپرست (صدور بیمه):
                          </label>
                          <input
                            type="text"
                            required
                            value={nationalCode}
                            onChange={(e) => setNationalCode(e.target.value)}
                            placeholder="۰۰۱۲۳۴۵۶۷۸"
                            maxLength={10}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14382c] font-mono text-center tracking-widest"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                            شماره تماس اضطراری یکی از بستگان:
                          </label>
                          <input
                            type="tel"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-[#14382c] font-mono text-left"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Companions List (Multi-person registration) */}
                    {companions.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-black text-[#14382c] flex items-center gap-2">
                            <Users2 size={20} className="text-[#d97706]" />
                            <span>مشخصات همراهان ({companions.length} نفر):</span>
                          </span>

                          <button
                            type="button"
                            onClick={handleAddCompanion}
                            className="bg-emerald-100 hover:bg-emerald-200 text-[#14382c] font-extrabold text-xs px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <UserPlus size={14} />
                            <span>افزودن همراه جدید</span>
                          </button>
                        </div>

                        {companions.map((companion, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group"
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-black text-[#14382c]">
                                مسافر شماره {idx + 2} (همراه)
                              </span>

                              <button
                                type="button"
                                onClick={() => handleRemoveCompanion(idx)}
                                className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition p-1 cursor-pointer"
                                title="حذف این همراه"
                              >
                                <Trash2 size={14} />
                                <span>حذف</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  نام و نام خانوادگی همراه:
                                </label>
                                <input
                                  type="text"
                                  value={companion.fullName}
                                  onChange={(e) => handleCompanionChange(idx, 'fullName', e.target.value)}
                                  placeholder={`نام همراه ${idx + 1}`}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#14382c]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  کد ملی (بیمه حوادث):
                                </label>
                                <input
                                  type="text"
                                  value={companion.nationalCode}
                                  onChange={(e) => handleCompanionChange(idx, 'nationalCode', e.target.value)}
                                  placeholder="کد ملی ۱۰ رقمی"
                                  maxLength={10}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#14382c] font-mono text-center tracking-wider"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  شماره همراه (اختیاری):
                                </label>
                                <input
                                  type="tel"
                                  value={companion.phone}
                                  onChange={(e) => handleCompanionChange(idx, 'phone', e.target.value)}
                                  placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-[#14382c] font-mono text-left"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={handleAddCompanion}
                          className="w-full border-2 border-dashed border-emerald-300 hover:border-[#14382c] bg-emerald-50/50 hover:bg-emerald-50 text-[#14382c] font-black text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <UserPlus size={16} className="text-[#d97706]" />
                          <span>افزودن یک مسافر دیگر به سفارش (مجموع: {guests} نفر)</span>
                        </button>
                      </div>
                    )}

                    {/* Fitness level & Special Notes */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-black text-[#14382c] mb-2">
                          <HeartPulse size={16} className="text-[#d97706]" />
                          <span>سطح آمادگی جسمانی گروه:</span>
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'normal', label: 'عمومی و سبک' },
                            { id: 'medium', label: 'آمادگی متوسط' },
                            { id: 'pro', label: 'حرفه‌ای و کوهنورد' },
                          ].map((lvl) => (
                            <button
                              key={lvl.id}
                              type="button"
                              onClick={() => setFitnessLevel(lvl.id)}
                              className={`p-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer text-center ${
                                fitnessLevel === lvl.id
                                  ? 'bg-[#14382c] text-white border-[#14382c] shadow'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                          ملاحظات خاص، رژیم غذایی (گیاهخواری) یا حساسیت‌های دارویی اعضای گروه:
                        </label>
                        <textarea
                          rows={2}
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder="اگر در گروه مسافر گیاهخوار یا نیازمند مراقبت دارویی وجود دارد ذکر فرمایید..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs outline-none focus:border-[#14382c] font-medium"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 3: EQUIPMENT RENTAL & EXTRA SERVICES */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs sm:text-sm font-black text-[#14382c] flex items-center gap-2">
                        <Tent size={18} className="text-[#d97706]" />
                        <span>تجهیزات و خدمات افزوده برای کل گروه ({guests} نفر):</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        انتخاب اختیاری
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {ADDON_SERVICES.map((addon) => {
                        const isSelected = selectedAddons.includes(addon.id);
                        const IconComp = addon.icon;
                        return (
                          <div
                            key={addon.id}
                            onClick={() => toggleAddon(addon.id)}
                            className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-white border-[#14382c] shadow-md ring-2 ring-[#14382c]/10'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#14382c] text-white shadow-sm' : 'bg-slate-100 text-slate-600'
                              }`}>
                                <IconComp size={22} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs sm:text-sm font-black text-[#14382c]">{addon.title}</h4>
                                  <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                                    {addon.tag}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5">{addon.desc}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs sm:text-sm font-black text-[#d97706] font-mono">
                                +{formatToman(addon.price * guests)}
                              </span>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                                isSelected ? 'border-[#14382c] bg-[#14382c] text-white' : 'border-slate-300'
                              }`}>
                                {isSelected && <Check size={14} />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2.5">
                      <Award size={20} className="text-[#14382c] shrink-0" />
                      <span>تضمین بهداشت: تمام کیسه‌خواب‌ها و وسایل کمپینگ قبل از تحویل شستشو و ضدعفونی می‌گردند.</span>
                    </div>
                  </div>
                )}

                {/* STEP 4: PAYMENT METHOD & COUPONS */}
                {currentStep === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    
                    {/* Coupon Code Section */}
                    <form onSubmit={handleApplyCoupon} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="block text-xs font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Tag size={16} className="text-[#d97706]" />
                        <span>کد تخفیف اختصاصی داری؟</span>
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="کد تخفیف (مثلاً FRIENDLY)"
                          className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase outline-none focus:border-[#14382c]"
                        />
                        <button
                          type="submit"
                          className="bg-[#14382c] hover:bg-[#0e2a21] text-white font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shrink-0 shadow-sm"
                        >
                          اعمال کد
                        </button>
                      </div>

                      {couponError && <p className="text-[11px] text-red-600 font-bold mt-1.5">{couponError}</p>}
                      {couponSuccess && <p className="text-[11px] text-emerald-700 font-bold mt-1.5">{couponSuccess}</p>}
                    </form>

                    {/* Registered Passengers List Summary Pill */}
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-bold space-y-1.5">
                      <div className="flex justify-between items-center text-[#14382c]">
                        <span>اسامی مسافران ثبت‌شده ({guests} نفر):</span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full font-black">
                          بیمه آماده صدور
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="bg-white px-3 py-1 rounded-lg border border-emerald-300 font-black text-[11px] text-[#14382c]">
                          ۱. {fullName || 'سرپرست اصلی'}
                        </span>
                        {filledCompanions.map((comp, idx) => (
                          <span key={idx} className="bg-white px-3 py-1 rounded-lg border border-emerald-300 text-[11px]">
                            {idx + 2}. {comp.fullName}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method Options */}
                    <div>
                      <label className="block text-xs font-black text-[#14382c] mb-2.5">
                        روش پرداخت و تثبیت نهایی صندلی:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div
                          onClick={() => setPaymentMethod('online')}
                          className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                            paymentMethod === 'online'
                              ? 'bg-emerald-50 border-[#14382c] shadow-md'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <CreditCard size={24} className={paymentMethod === 'online' ? 'text-[#14382c]' : 'text-slate-400'} />
                          <div>
                            <span className="text-xs font-black text-[#14382c] block">پرداخت آنلاین (درگاه شتاب)</span>
                            <span className="text-[10px] text-slate-500 font-medium">صدور آنی بلیط + ۵٪ تخفیف انلاین</span>
                          </div>
                        </div>

                        <div
                          onClick={() => setPaymentMethod('reserved')}
                          className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3.5 ${
                            paymentMethod === 'reserved'
                              ? 'bg-amber-50 border-[#d97706] shadow-md'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Phone size={24} className={paymentMethod === 'reserved' ? 'text-[#d97706]' : 'text-slate-400'} />
                          <div>
                            <span className="text-xs font-black text-amber-950 block">رزرو موقت ۲۴ ساعته</span>
                            <span className="text-[10px] text-slate-500 font-medium">تماس لیدر جهت مشاوره پیش از واریز</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>

              {/* Sidebar Summary & Live Receipt Card (Desktop Right 4 Columns) */}
              <div className="lg:col-span-4 bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-4 border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#14382c] rounded-full blur-2xl pointer-events-none opacity-50" />

                <div className="relative z-10">
                  <h4 className="text-sm font-black text-amber-400 border-b border-slate-800 pb-2.5 flex items-center justify-between">
                    <span>پیش‌فاکتور شفاف سفارش</span>
                    <span className="text-xs bg-slate-800 text-slate-300 font-normal px-2.5 py-0.5 rounded-full">
                      {guests} نفر
                    </span>
                  </h4>

                  <div className="space-y-2.5 text-xs pt-3 font-medium text-slate-300">
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">تاریخ حرکت:</span>
                      <span className="text-white font-mono font-bold">{selectedDate}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">ایستگاه سوار شدن:</span>
                      <span className="text-white font-extrabold truncate max-w-[140px]">{selectedStationObj?.title}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800 pb-2.5">
                      <span className="text-slate-400">پایه تور ({guests} نفر):</span>
                      <span className="text-white font-mono">{formatToman(baseTotal)}</span>
                    </div>

                    {tentExtra > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>ارتقاء اسکان (VIP):</span>
                        <span className="font-mono">+{formatToman(tentExtra)}</span>
                      </div>
                    )}

                    {addonsTotal > 0 && (
                      <div className="flex justify-between text-slate-300">
                        <span>خدمات و تجهیزات:</span>
                        <span className="font-mono">+{formatToman(addonsTotal)}</span>
                      </div>
                    )}

                    {groupDiscountAmount > 0 && (
                      <div className="flex justify-between text-amber-400 font-bold">
                        <span>تخفیف گروهی ({groupDiscountPercent}٪):</span>
                        <span className="font-mono">-{formatToman(groupDiscountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>تخفیف ثبت آنلاین (۵٪):</span>
                      <span className="font-mono">-{formatToman(onlineDiscount)}</span>
                    </div>

                    {appliedDiscount > 0 && (
                      <div className="flex justify-between text-amber-400 font-bold">
                        <span>تخفیف کوپن ویژه:</span>
                        <span className="font-mono">-{formatToman(appliedDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                      <span>بیمه حوادث + لیدر کارت‌دار:</span>
                      <span className="text-emerald-400 font-bold">رایگان (هدیه)</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-col gap-1">
                      <span className="text-slate-400 text-[11px]">مبلغ نهایی قابل پرداخت:</span>
                      <span className="text-amber-400 text-xl font-black font-mono text-left block">
                        {formatToman(grandTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <ShieldCheck size={14} />
                      <span>تضمین بازگشت ۱۰۰٪ وجه تا ۷۲ ساعت قبل حرکت</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BadgeCheck size={14} className="text-amber-400" />
                      <span>دارای نماد اعتماد و مجوز رسمی میراث فرهنگی</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Fixed Action Bar */}
        {!submitted && (
          <div className="bg-white border-t border-slate-200 p-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-lg">
            {/* Price Preview */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 font-bold block">مبلغ قابل پرداخت ({guests} نفر):</span>
              <span className="text-base sm:text-xl font-black text-[#14382c] font-mono">
                {formatToman(grandTotal)}
              </span>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-black transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowRight size={14} />
                  <span>مرحله قبل</span>
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-3 rounded-xl bg-[#14382c] hover:bg-[#0e2a21] text-white text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <span>مرحله بعد</span>
                  <ArrowLeft size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  className="px-6 py-3 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs sm:text-sm font-black shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={18} />
                  <span>{paymentMethod === 'online' ? 'تایید و پرداخت آنلاین' : 'ثبت رزرو موقت'}</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
