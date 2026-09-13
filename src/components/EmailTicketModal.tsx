import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  Mail,
  CheckCircle,
  Calendar,
  MapPin,
  Clock,
  User,
  Users,
  ShieldCheck,
  Compass,
  Phone,
  QrCode,
  FileText,
  Sparkles,
  Tent,
  AlertCircle,
  CloudSun,
  Wind,
  Droplets,
  Radio,
  HeartPulse,
  Check,
  Zap,
  Mountain,
  Sun,
  Thermometer,
  ShieldAlert,
  HelpCircle,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  ListChecks
} from 'lucide-react';
import { Tour } from '../types';
import { SosEmergencyModal } from './SosEmergencyModal';

type TourPresetCategory = 'mountaineering' | 'desert' | 'beach' | 'forest';

interface GearPresetItem {
  id: string;
  name: string;
}

const GEAR_PRESETS: { [key in TourPresetCategory]: { label: string; icon: string; items: GearPresetItem[] } } = {
  mountaineering: {
    label: 'کوهنوردی و صعود مرتفع',
    icon: '🏔️',
    items: [
      { id: 'm-1', name: 'کفش ترکینگ یا کوه‌پیمایی ساق‌دار' },
      { id: 'm-2', name: 'کاپشن پر سنگین و گورتکس تنفس‌پذیر' },
      { id: 'm-3', name: 'باتوم ترکینگ آنتی‌شوک (یک جفت)' },
      { id: 'm-4', name: 'کیسه‌خواب با دمای راحت منفی ۵ درجه' },
      { id: 'm-5', name: 'چادر ۲ دوپوش مقاوم در برابر باد' },
      { id: 'm-6', name: 'هدلامپ (چراغ پیشانی) با باتری یدک' },
      { id: 'm-7', name: 'دستکش پنج‌انگشتی ضدآب و کلاه طوفان' },
      { id: 'm-8', name: 'عینک کوهنوردی UV400 کات ۳ یا ۴' },
      { id: 'm-9', name: 'گت کوهنوردی و جوراب پر یا پشمی' },
      { id: 'm-10', name: 'کیف کمک‌های اولیه و داروهای ارتفاع' }
    ]
  },
  desert: {
    label: 'کویر و رمل‌نوردی',
    icon: '🏜️',
    items: [
      { id: 'd-1', name: 'اسکارف/دستمال سر کویر و عینک طوفان شن' },
      { id: 'd-2', name: 'قمقمه یا کیسه آب (حداقل ۳ لیتر)' },
      { id: 'd-3', name: 'گت کویر کوتاه (جلوگیری از ورود شن به کفش)' },
      { id: 'd-4', name: 'کرم ضدآفتاب SPF50+ و لوسیون سوختگی' },
      { id: 'd-5', name: 'کلاه لبه‌دار پهن و لباس آستین‌بلند نخی' },
      { id: 'd-6', name: 'چراغ‌قوه کمپینگ و نور قرمز رصد ستارگان' },
      { id: 'd-7', name: 'پاوربانک فست‌شارژ ۲۰,۰۰۰ میلی‌آمپر' },
      { id: 'd-8', name: 'کیسه‌خواب سبک و پتوی نجات' }
    ]
  },
  beach: {
    label: 'کمپینگ ساحلی و دریایی',
    icon: '🏖️',
    items: [
      { id: 'b-1', name: 'چادر کمپینگ دارای پشه‌بند و تهویه سقف' },
      { id: 'b-2', name: 'صندل آب‌نوردی و کفش ساحلی' },
      { id: 'b-3', name: 'زیرانداز آلومینیومی و ضدآب رطوبت ساحل' },
      { id: 'b-4', name: 'مایو شنا و حوله سریع‌خشک‌شونده (میکروفایبر)' },
      { id: 'b-5', name: 'اسپری دفع‌کننده حشرات و پشه ساحل' },
      { id: 'b-6', name: 'یخدان/کیف خنک‌کننده سفری و یخ خشک' },
      { id: 'b-7', name: 'عینک آفتابی پلاریزه و کلاه آفتابگیر' },
      { id: 'b-8', name: 'کیف ضدآب (Dry Bag) برای موبایل و مدارک' }
    ]
  },
  forest: {
    label: 'جنگل‌نوردی و هیرکانی',
    icon: '🌲',
    items: [
      { id: 'f-1', name: 'پانچو بارانی کوهنوردی کامل یا کاپشن ضدآب' },
      { id: 'f-2', name: 'کاور ضدآب کوله‌پشتی (Rain Cover)' },
      { id: 'f-3', name: 'صندل یا کفش ویژه عبور از رودخانه' },
      { id: 'f-4', name: 'جوراب اضافه (حداقل ۳ جفت نخی و پشمی)' },
      { id: 'f-5', name: 'چراغ پیشانی ضدآب IPX6' },
      { id: 'f-6', name: 'جوراب/اسپری ضد زالو و حشرات جنگلی' },
      { id: 'f-7', name: 'کیسه ز زباله زیپ‌کیپ و کیسه انفرادی پاکسازی' },
      { id: 'f-8', name: 'طناب انفرادی ۶ متری و کارابین ساده' }
    ]
  }
};

interface EmailTicketModalProps {
  isOpen: boolean;
  tour: Tour | null;
  date?: string;
  guests?: number;
  fullName?: string;
  phone?: string;
  nationalCode?: string;
  bookingRef?: string;
  onClose: () => void;
}

export const EmailTicketModal: React.FC<EmailTicketModalProps> = ({
  isOpen,
  tour,
  date = '۱۴۰۵/۰۶/۲۰',
  guests = 2,
  fullName = 'سامان ملک‌زاده',
  phone = '۰۹۱۲۳۴۵۶۷۸۹',
  nationalCode = '۰۰۱۲۳۴۵۶۷۸',
  bookingRef = 'FC-849201',
  onClose
}) => {
  // Modal View Mode: 'ticket' | 'expedition_pdf'
  const [viewMode, setViewMode] = useState<'ticket' | 'expedition_pdf'>('expedition_pdf');

  // SOS Emergency Modal State
  const [isSosOpen, setIsSosOpen] = useState(false);

  // Auto-detect initial gear preset category based on tour properties
  const detectInitialCategory = (): TourPresetCategory => {
    if (!tour) return 'mountaineering';
    const text = (tour.title + ' ' + tour.location + ' ' + (tour.category || '')).toLowerCase();
    if (text.includes('کویر') || text.includes('بیابان') || text.includes('کاراکال') || text.includes('ریگ')) return 'desert';
    if (text.includes('ساحل') || text.includes('دریای') || text.includes('جزیره') || text.includes('هرمز') || text.includes('قشم')) return 'beach';
    if (text.includes('جنگل') || text.includes('الیمستان') || text.includes('هیرکانی') || text.includes('راش')) return 'forest';
    return 'mountaineering';
  };

  const [activeCategory, setActiveCategory] = useState<TourPresetCategory>(detectInitialCategory());
  
  // Custom user-added items
  const [customItems, setCustomItems] = useState<GearPresetItem[]>([]);
  const [newGearInput, setNewGearInput] = useState('');

  // Interactive Packing List Checkboxes State
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    'm-1': true,
    'm-2': true,
    'm-3': true,
    'm-6': true,
    'd-1': true,
    'd-2': true,
    'b-1': true,
    'f-1': true
  });

  if (!isOpen || !tour) return null;

  const togglePackingItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCustomGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearInput.trim()) return;
    const newItem: GearPresetItem = {
      id: `custom-${Date.now()}`,
      name: newGearInput.trim()
    };
    setCustomItems(prev => [...prev, newItem]);
    setCheckedItems(prev => ({ ...prev, [newItem.id]: true }));
    setNewGearInput('');
  };

  const handleRemoveCustomGear = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="بلیت سفر" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl bg-slate-100 rounded-3xl shadow-2xl border border-slate-300 text-right overflow-hidden my-auto max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white">
        
        {/* Top App Bar - Hidden during print */}
        <div className="bg-slate-900 text-slate-200 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
              <Mail size={14} className="text-emerald-400" />
              <span>سامانه صدور بلیت الکترونیکی و دفترچه آفلاین سفر (Friendly Camp)</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick-Access SOS Emergency Button */}
            <button
              onClick={() => setIsSosOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md border border-rose-400/40 animate-pulse"
              title="دسترسی سریع به شماره‌های اضطراری و مختصات GPS"
            >
              <AlertCircle size={15} className="text-yellow-300" />
              <span>SOS اضطراری</span>
            </button>

            {/* View Mode Switcher */}
            <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
              <button
                onClick={() => setViewMode('ticket')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  viewMode === 'ticket' ? 'bg-[#84cc16] text-[#064e3b]' : 'text-slate-300 hover:text-white'
                }`}
              >
                بلیت رسمی
              </button>
              <button
                onClick={() => setViewMode('expedition_pdf')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'expedition_pdf' ? 'bg-[#84cc16] text-[#064e3b]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>دفترچه آفلاین (PDF)</span>
              </button>
            </div>

            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">دانلود / چاپ نسخه PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-slate-300 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Email Header Info - Hidden in Print */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 text-xs text-slate-600 space-y-1 shrink-0 print:hidden">
          <div className="flex justify-between items-center">
            <span><strong>فرستنده:</strong> سامانه فرندلی کمپ &lt;expeditions@friendlycamp.ir&gt;</span>
            <span className="text-slate-400 font-mono">تاییدیه قطعی صادر شد</span>
          </div>
          <div><strong>گیرنده:</strong> {fullName} &lt;{phone}&gt;</div>
        </div>

        {/* Modal Scrollable Content Container */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-50 space-y-6 print:p-0 print:bg-white print:overflow-visible">
          
          {/* ================= VIEW 1: EXPEDITION OFFLINE ITINERARY PDF ================= */}
          {viewMode === 'expedition_pdf' && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-300 shadow-md p-6 sm:p-8 space-y-6 print:border-2 print:border-slate-800 print:shadow-none print:rounded-2xl">
              
              {/* Document Header Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#003843] pb-5 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#004e5a] text-white font-black text-2xl flex items-center justify-center shadow-lg print:border print:border-slate-800">
                    FC
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-[#003843]">دفترچه راهنمای آفلاین و برنامه سفر</h1>
                    <p className="text-xs text-slate-600 font-bold">Friendly Camp Expedition & Survival Guide</p>
                  </div>
                </div>

                <div className="text-left font-mono bg-slate-100 p-3 rounded-2xl border border-slate-300 shrink-0 text-xs">
                  <span className="text-[10px] text-slate-500 block">کد پیگیری سفر:</span>
                  <span className="text-base font-black text-[#004e5a]">{bookingRef}</span>
                </div>
              </div>

              {/* Offline Warning Banner */}
              <div className="bg-amber-50 border border-amber-300 text-amber-950 p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs print:bg-slate-100 print:border-slate-400">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-700 shrink-0" />
                  <div>
                    <span className="font-black block">نسخه بهینه‌شده برای استفاده آفلاین در مناطق فاقد آنتن‌دهی:</span>
                    <span className="text-[11px] text-amber-900 font-medium">این فایل شامل تمام جدول زمانی، شماره‌های اضطراری، پیش‌بینی هوا و چک‌لیست ضروری است.</span>
                  </div>
                </div>

                <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 font-mono">
                  Offline Ready ✓
                </span>
              </div>

              {/* Tour Main Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block">عنوان تور:</span>
                  <span className="font-black text-[#003843]">{tour.title}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">تاریخ حرکت:</span>
                  <span className="font-mono font-bold text-slate-800">{date}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">سرپرست و لیدر:</span>
                  <span className="font-bold text-emerald-800">سامان ملک‌زاده</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">مختصات کمپ (GPS):</span>
                  <span className="font-mono text-[10px] font-bold text-slate-900">35.9812° N, 52.1104° E</span>
                </div>
              </div>

              {/* 1. Full Day-by-Day Itinerary */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-[#003843] flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Calendar size={18} className="text-[#84cc16]" />
                  <span>۱. برنامه زمان‌بندی دقیق و گام‌به‌گام روزهای سفر</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#004e5a] text-white font-black text-[10px] px-2.5 py-0.5 rounded-md">
                        روز اول - حرکت و کمپینگ
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">ساعت ۰۴:۳۰ صبح</span>
                    </div>
                    <span className="font-bold text-slate-900 block pt-1">حرکت از تهران (میدان ونک) ← استقرار در بیس‌کمپ</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      حرکت با اتوبوس VIP ← صرف صبحانه در مسیر ← پیمایش سبک ۲ ساعته تا محل کمپ ← برپایی چادرها ← کارگاه آموزش بقا در طبیعت ← شب‌نشینی دور هیزم و رصد ستارگان.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#004e5a] text-white font-black text-[10px] px-2.5 py-0.5 rounded-md">
                        روز دوم - پیمایش اصلی و بازگشت
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">ساعت ۰۶:۰۰ صبح</span>
                    </div>
                    <span className="font-bold text-slate-900 block pt-1">پیمایش خط‌الرأس و آبشار ← جمع‌آوری کمپ</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      بیداری و صرف صبحانه ارگانیک کمپ ← پیمایش تا آبشار اصلی ← عکاسی گروهی ← ناهار گرم ← پاکسازی محوطه کمپ ← حرکت به سمت تهران (وصول حدود ساعت ۲۱:۰۰).
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. 3-Day Mountain Weather Forecast */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-[#003843] flex items-center gap-2 border-b border-slate-200 pb-2">
                  <CloudSun size={18} className="text-sky-600" />
                  <span>۲. پیش‌بینی هواشناسی تخصصی منطقه کمپ (ارتفاع ۲,۴۰۰ متر)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
                    <div className="flex items-center justify-between text-sky-900">
                      <span className="font-bold">روز اول (حرکت):</span>
                      <Sun size={18} className="text-amber-500" />
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-base font-black text-slate-900 font-mono">۲۲° / ۸°</span>
                      <span className="text-[10px] text-slate-500">آفتابی و صاف</span>
                    </div>
                    <div className="text-[10px] text-slate-600 space-y-0.5 font-medium border-t border-sky-200 pt-1">
                      <div>باد: ۱۲ km/h (آرام)</div>
                      <div>بارش: ۰٪</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-900">
                      <span className="font-bold">شب کمپینگ:</span>
                      <Wind size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-base font-black text-slate-900 font-mono">۴° سانتی‌گراد</span>
                      <span className="text-[10px] text-slate-500">سرد همراه باد</span>
                    </div>
                    <div className="text-[10px] text-slate-600 space-y-0.5 font-medium border-t border-slate-200 pt-1">
                      <div>باد: ۲۵ km/h</div>
                      <div>نیاز به کیسه‌خواب مناسب</div>
                    </div>
                  </div>

                  <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 space-y-1">
                    <div className="flex items-center justify-between text-sky-900">
                      <span className="font-bold">روز دوم (بازگشت):</span>
                      <CloudSun size={18} className="text-sky-600" />
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-base font-black text-slate-900 font-mono">۱۹° / ۶°</span>
                      <span className="text-[10px] text-slate-500">نیمه ابری</span>
                    </div>
                    <div className="text-[10px] text-slate-600 space-y-0.5 font-medium border-t border-sky-200 pt-1">
                      <div>احتمال بارش عصرگاه: ۱۰٪</div>
                      <div>کاور باران کوله توصیه می‌شود</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Interactive Dynamic & Printable Packing Checklist */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-2">
                  <h3 className="text-sm font-black text-[#003843] flex items-center gap-2">
                    <Tent size={18} className="text-amber-600" />
                    <span>۳. چک‌لیست هوشمند و پویا تجهیـزات، پوشاک و لوازم ضروری سفر</span>
                  </h3>
                  
                  {/* Category Indicator Badge */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 font-medium">پیش‌فرض تور:</span>
                    <span className="bg-[#004e5a] text-white font-black text-[10px] px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <span>{GEAR_PRESETS[activeCategory].icon}</span>
                      <span>{GEAR_PRESETS[activeCategory].label}</span>
                    </span>
                  </div>
                </div>

                {/* Category Preset Selector Tabs (Print Hidden) */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto text-xs font-bold print:hidden">
                  {(Object.keys(GEAR_PRESETS) as TourPresetCategory[]).map(catKey => {
                    const preset = GEAR_PRESETS[catKey];
                    const isActive = activeCategory === catKey;
                    return (
                      <button
                        key={catKey}
                        onClick={() => setActiveCategory(catKey)}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-[#004e5a] text-white font-black shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress Bar & Readiness Counter */}
                {(() => {
                  const currentPresetItems = GEAR_PRESETS[activeCategory].items;
                  const allVisibleItems = [...currentPresetItems, ...customItems];
                  const checkedCount = allVisibleItems.filter(item => checkedItems[item.id]).length;
                  const progressPct = allVisibleItems.length > 0 ? Math.round((checkedCount / allVisibleItems.length) * 100) : 0;

                  return (
                    <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                        <span className="flex items-center gap-1.5">
                          <ListChecks size={16} className="text-emerald-700" />
                          <span>وضعیت آماده‌سازی لوازم سفر:</span>
                        </span>
                        <span className="font-mono text-emerald-800">
                          {checkedCount} از {allVisibleItems.length} آیتم آماده است ({progressPct}٪)
                        </span>
                      </div>

                      {/* Progress Bar Container */}
                      <div className="w-full bg-emerald-200/60 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Equipment Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                  {/* Category Preset Items */}
                  {GEAR_PRESETS[activeCategory].items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => togglePackingItem(item.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                        checkedItems[item.id]
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {checkedItems[item.id] ? (
                          <CheckSquare size={16} className="text-emerald-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-400 shrink-0" />
                        )}
                        <span>{item.name}</span>
                      </span>
                      {checkedItems[item.id] && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono shrink-0">
                          آماده ✓
                        </span>
                      )}
                    </div>
                  ))}

                  {/* User Custom Items */}
                  {customItems.map(item => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition select-none ${
                        checkedItems[item.id]
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        onClick={() => togglePackingItem(item.id)}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        {checkedItems[item.id] ? (
                          <CheckSquare size={16} className="text-amber-600 shrink-0" />
                        ) : (
                          <Square size={16} className="text-slate-400 shrink-0" />
                        )}
                        <span>{item.name}</span>
                        <span className="bg-amber-200/80 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                          شخصی
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveCustomGear(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition print:hidden"
                        title="حذف این آیتم"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Item Form (Print Hidden) */}
                <form
                  onSubmit={handleAddCustomGear}
                  className="flex items-center gap-2 pt-1 print:hidden"
                >
                  <input
                    type="text"
                    value={newGearInput}
                    onChange={(e) => setNewGearInput(e.target.value)}
                    placeholder="+ افزودن آیتم یا وسیله شخصی جدید به چک‌لیست..."
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004e5a]"
                  />
                  <button
                    type="submit"
                    className="bg-[#004e5a] hover:bg-[#003843] text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus size={15} />
                    <span>افزودن</span>
                  </button>
                </form>
              </div>

              {/* 4. Emergency Contacts & Off-grid Protocols */}
              <div className="bg-[#002f38] text-white p-5 rounded-2xl space-y-3 print:bg-slate-900 print:text-white">
                <h4 className="font-black text-xs text-amber-300 flex items-center justify-between border-b border-white/15 pb-2">
                  <span className="flex items-center gap-2">
                    <Radio size={16} />
                    <span>۴. پروتکل ارتباطات اضطراری و امداد کوهستان (Emergency Contacts)</span>
                  </span>
                  <span className="text-[10px] text-emerald-300 font-mono">24/7 Active</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium">
                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] text-amber-200 block">امداد کوهستان کشوری:</span>
                    <span className="text-sm font-black font-mono text-white">۱۴۱۲</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] text-amber-200 block">امداد و نجات هلال احمر:</span>
                    <span className="text-sm font-black font-mono text-white">۱۱۲</span>
                  </div>

                  <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] text-amber-200 block">فرکانس بیسیم لیدرهای کمپ:</span>
                    <span className="text-xs font-mono font-bold text-amber-300">433.500 MHz (CH-5)</span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  توصیه ایمنی سرپرست: در صورت جدا ماندن از گروه، در محل امن پناه بگیرید، از تحرک بی‌مورد پرهیز کرده و با شماره‌های فوق یا سوت اضطراری (۳ سوت کوتاه) موقعیت خود را اعلام فرمایید.
                </p>
              </div>

            </div>
          )}

          {/* ================= VIEW 2: STANDARD E-TICKET ================= */}
          {viewMode === 'ticket' && (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#004e5a] text-white font-black text-xl flex items-center justify-center">
                    FC
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-[#003843]">فرندلی کمپ • Friendly Camp</h1>
                    <p className="text-xs text-slate-500 font-medium">بلیط رسمی رزرو تور کمپینگ و کوهپیمایی</p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-900 font-bold px-3 py-1 rounded-full text-xs">
                  ✓ بیمه صادر شد
                </span>
              </div>

              {/* Voucher Graphic Card */}
              <div className="bg-gradient-to-br from-[#003843] to-[#004e5a] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-white/15 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2.5 py-0.5 rounded-full mb-1 inline-block">
                      بلیط رسمی الکترونیکی
                    </span>
                    <h3 className="text-xl font-black text-white">{tour.title}</h3>
                    <p className="text-xs text-emerald-200 font-medium mt-0.5">{tour.location}</p>
                  </div>

                  <div className="text-left font-mono">
                    <span className="text-[10px] text-slate-300 block">کد پیگیری:</span>
                    <span className="text-base font-black text-amber-300">{bookingRef}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-300 block">تاریخ:</span>
                    <span className="font-bold text-white">{date}</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-300 block">تعداد:</span>
                    <span className="font-bold text-white">{guests} نفر</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-300 block">سرپرست:</span>
                    <span className="font-bold text-amber-300">سامان ملک‌زاده</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-300 block">مدت:</span>
                    <span className="font-bold text-white">{tour.duration}</span>
                  </div>
                </div>

                <div className="bg-white text-slate-900 p-4 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <QrCode size={36} className="text-[#004e5a]" />
                    <div className="text-xs">
                      <span className="font-black block">کد QR تردد فرندلی کمپ</span>
                      <span className="text-[10px] text-slate-500">جهت اسکن توسط سرپرست اتوبوس</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    تایید شده
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* Action Buttons Container - Hidden in Print */}
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
            <button
              onClick={() => setIsSosOpen(true)}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer border border-rose-400/30"
            >
              <AlertCircle size={16} className="text-yellow-300" />
              <span>تماس و اعلام SOS اضطراری</span>
            </button>

            <button
              onClick={handlePrintPDF}
              className="bg-[#004e5a] hover:bg-[#003843] text-white font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Printer size={16} />
              <span>دانلود PDF / چاپ دفترچه آفلاین</span>
            </button>

            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-200 text-slate-800 font-bold text-xs px-6 py-3 rounded-2xl border border-slate-300 transition cursor-pointer"
            >
              بستن پیش‌نمایش
            </button>
          </div>

        </div>

      </div>

      {/* SOS Emergency Modal Overlay */}
      <SosEmergencyModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        tourName={tour.title}
        locationName={tour.location}
        coordinates="35.9812° N, 52.1104° E"
        leaderName="سامان ملک‌زاده"
        leaderPhone="۰۹۱۲۳۴۵۶۷۸۹"
      />
    </div>
  );
};
