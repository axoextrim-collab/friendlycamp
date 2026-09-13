import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, MapPin, Users, Clock, Flame, ShieldCheck, Sparkles, Filter, CheckCircle2, AlertCircle, ArrowLeft, Tent } from 'lucide-react';
import { Tour } from '../types';
import { POPULAR_TOURS } from '../data/mockData';

interface TravelCalendarSectionProps {
  onSelectTour: (tour: Tour) => void;
}

interface CalendarEvent {
  id: string;
  day: number; // Jalali day of month 1..31
  monthName: string;
  year: number;
  tour: Tour;
  departureTime: string;
  capacityLeft: number;
  totalCapacity: number;
  status: 'available' | 'filling' | 'full';
  category: 'rainforest' | 'trekking' | 'weekend' | 'family' | 'vip';
  categoryLabel: string;
}

const MONTHS_LIST = [
  { id: '06', name: 'شهریور ۱۴۰۵', season: 'تابستان • فصل طراوت جنگل‌های بارانی و رودخانه‌نوردی' },
  { id: '07', name: 'مهر ۱۴۰۵', season: 'پاییز • طلایی‌ترین فصل کمپینگ در فرورفتگی‌های هیرکانی' },
  { id: '08', name: 'آبان ۱۴۰۵', season: 'پاییز • جنگل‌نوردی مه آلود و شب‌مانی دور آتش' },
  { id: '09', name: 'آذر ۱۴۰۵', season: 'پاییز و زمستان • کمپینگ استوایی و کویرهای ماسه‌ای' },
];

const CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-1',
    day: 5,
    monthName: 'شهریور ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[0],
    departureTime: 'پنج‌شنبه ۵ شهریور - حرکت ۰۵:۰۰ صبح',
    capacityLeft: 3,
    totalCapacity: 15,
    status: 'filling',
    category: 'rainforest',
    categoryLabel: 'کمپینگ جنگل بارانی'
  },
  {
    id: 'evt-2',
    day: 12,
    monthName: 'شهریور ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[1],
    departureTime: 'پنج‌شنبه ۱۲ شهریور - پرواز بین‌المللی',
    capacityLeft: 6,
    totalCapacity: 12,
    status: 'available',
    category: 'vip',
    categoryLabel: 'تور ویژه استوایی'
  },
  {
    id: 'evt-3',
    day: 19,
    monthName: 'شهریور ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[2],
    departureTime: 'پنج‌شنبه ۱۹ شهریور - حرکت ۰۶:۰۰ صبح',
    capacityLeft: 2,
    totalCapacity: 15,
    status: 'filling',
    category: 'trekking',
    categoryLabel: 'پیمایش کوهستان'
  },
  {
    id: 'evt-4',
    day: 26,
    monthName: 'شهریور ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[3],
    departureTime: 'پنج‌شنبه ۲۶ شهریور - حرکت ۰۴:۳۰ صبح',
    capacityLeft: 8,
    totalCapacity: 20,
    status: 'available',
    category: 'family',
    categoryLabel: 'تور خانوادگی'
  },
  {
    id: 'evt-5',
    day: 3,
    monthName: 'مهر ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[0],
    departureTime: 'پنج‌شنبه ۳ مهر - حرکت ۰۵:۰۰ صبح',
    capacityLeft: 5,
    totalCapacity: 15,
    status: 'available',
    category: 'rainforest',
    categoryLabel: 'پاییز جنگل بارانی'
  },
  {
    id: 'evt-6',
    day: 10,
    monthName: 'مهر ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[4],
    departureTime: 'پنج‌شنبه ۱۰ مهر - پرواز گروهی',
    capacityLeft: 4,
    totalCapacity: 10,
    status: 'filling',
    category: 'weekend',
    categoryLabel: 'تور آخر هفته'
  },
  {
    id: 'evt-7',
    day: 17,
    monthName: 'مهر ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[1],
    departureTime: 'پنج‌شنبه ۱۷ مهر - پرواز بین‌المللی',
    capacityLeft: 7,
    totalCapacity: 12,
    status: 'available',
    category: 'vip',
    categoryLabel: 'تور استوایی'
  },
  {
    id: 'evt-8',
    day: 24,
    monthName: 'مهر ۱۴۰۵',
    year: 1405,
    tour: POPULAR_TOURS[2],
    departureTime: 'پنج‌شنبه ۲۴ مهر - حرکت ۰۵:۳۰ صبح',
    capacityLeft: 1,
    totalCapacity: 15,
    status: 'filling',
    category: 'rainforest',
    categoryLabel: 'کمپینگ پاییزی'
  }
];

export const TravelCalendarSection: React.FC<TravelCalendarSectionProps> = ({ onSelectTour }) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentMonth = MONTHS_LIST[selectedMonthIndex];

  // Filter events for selected month and category
  const monthEvents = CALENDAR_EVENTS.filter((evt) => {
    const matchesMonth = evt.monthName === currentMonth.name;
    const matchesCategory = selectedCategory === 'all' || evt.category === selectedCategory;
    return matchesMonth && matchesCategory;
  });

  const nextMonth = () => {
    setSelectedMonthIndex((prev) => (prev + 1) % MONTHS_LIST.length);
  };

  const prevMonth = () => {
    setSelectedMonthIndex((prev) => (prev - 1 + MONTHS_LIST.length) % MONTHS_LIST.length);
  };

  const DAYS_OF_WEEK = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <section id="calendar" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Light Nude Warm Palette Card Container */}
      <div className="bg-[#faf7f2] text-slate-900 rounded-2xl p-6 sm:p-10 shadow-xl border border-[#e8e0d1] relative overflow-hidden">
        
        {/* Subtle Nude Decorative Background Accents */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#f2e6d5]/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#e6d9c5]/50 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-[#e3d8c5]">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f2e6d5] text-[#b45309] text-xs font-bold mb-3 border border-[#e6d5be]">
              <CalendarIcon size={15} />
              <span>تقویم زمان‌بندی سفری • فرندلی کمپ</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#26201b] leading-tight">
              تقویم سفری: <span className="text-[#14382c]">حرکت تورها و برنامه‌های کمپینگ</span>
            </h2>
            <p className="text-slate-600 text-sm font-medium mt-1">
              زمان‌بندی دقیق حرکت گروه‌ها، ظرفیت باقی‌مانده و امکان رزرو مستقیم
            </p>
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center gap-2 bg-[#efe8db] p-1.5 rounded-xl border border-[#e2d6c2] shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#14382c] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              نمای تقویم (ماهانه)
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#14382c] text-white shadow-md'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              نمای لیستی (تایم‌لاین)
            </button>
          </div>
        </div>

        {/* Month Selector Bar */}
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 bg-[#f3ece0] p-4 rounded-xl border border-[#e3d7c4]">
          
          {/* Month Navigator */}
          <div className="flex items-center justify-between lg:justify-start gap-4">
            <button
              onClick={prevMonth}
              className="w-10 h-10 rounded-lg bg-white/80 hover:bg-[#14382c] hover:text-white text-slate-800 transition flex items-center justify-center cursor-pointer border border-[#ded2be] shadow-sm"
              aria-label="ماه قبل"
            >
              <ChevronRight size={20} />
            </button>

            <div className="text-center">
              <span className="text-[11px] text-slate-600 block">{currentMonth.season}</span>
            </div>

            <button
              onClick={nextMonth}
              className="w-10 h-10 rounded-lg bg-white/80 hover:bg-[#14382c] hover:text-white text-slate-800 transition flex items-center justify-center cursor-pointer border border-[#ded2be] shadow-sm"
              aria-label="ماه بعد"
            >
              <ChevronLeft size={20} />
            </button>
          </div>

        </div>

        {/* View Mode 1: Calendar Grid View */}
        {viewMode === 'grid' && (
          <div className="relative z-10">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-black text-[#14382c] bg-[#eae2d3] p-2.5 rounded-xl border border-[#ded2be]">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={d} className={i >= 5 ? 'text-[#d97706]' : ''}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {daysArray.map((dayNum) => {
                const dayEvent = monthEvents.find((e) => e.day === dayNum);
                const isWeekend = dayNum % 7 === 5 || dayNum % 7 === 6;

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                      dayEvent
                        ? 'bg-white border-[#14382c] shadow-md ring-2 ring-[#14382c]/20 hover:scale-[1.02]'
                        : isWeekend
                        ? 'bg-[#f4ebd8]/70 border-[#e3d7c3]'
                        : 'bg-white/60 border-[#e8decb]'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex justify-between items-center">
                      <span className={`text-xs sm:text-sm font-black ${dayEvent ? 'text-[#14382c]' : isWeekend ? 'text-[#b45309]' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      {dayEvent && (
                        <span className="text-[10px] bg-[#d97706] text-white font-bold px-1.5 py-0.5 rounded shadow-sm">
                          حرکت
                        </span>
                      )}
                    </div>

                    {/* Event Card Inside Day Cell */}
                    {dayEvent && dayEvent.tour ? (
                      <div
                        onClick={() => onSelectTour(dayEvent.tour)}
                        className="mt-1 bg-[#f4ece1] hover:bg-[#14382c] hover:text-white p-2 rounded-lg text-right cursor-pointer border border-[#e0d3bf] transition group"
                      >
                        <span className="text-[10px] sm:text-xs font-black text-slate-900 block truncate group-hover:text-amber-300">
                          {dayEvent.tour.title}
                        </span>
                        <div className="flex items-center justify-between text-[9px] text-slate-600 group-hover:text-emerald-100 mt-1">
                          <span className="truncate">{dayEvent.tour.duration}</span>
                          <span className="text-[#b45309] group-hover:text-amber-300 font-bold">{dayEvent.capacityLeft} نفر ظرفیت</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[9px] text-slate-400 hidden sm:block">برنامه عادی</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2: Detailed List View */}
        {viewMode === 'list' && (
          <div className="relative z-10 space-y-4">
            {monthEvents.length === 0 ? (
              <div className="text-center py-12 bg-white/80 rounded-xl border border-[#e3d7c4]">
                <AlertCircle size={36} className="text-[#d97706] mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">هیچ برنامه‌ای برای این فیلتر در {currentMonth.name} یافت نشد.</p>
                <p className="text-xs text-slate-500 mt-1">لطفا ماه دیگری را انتخاب کنید یا فیلتر را تغییر دهید.</p>
              </div>
            ) : (
              monthEvents.map((evt) => {
                if (!evt.tour) return null;
                return (
                  <div
                    key={evt.id}
                    className="bg-white rounded-xl p-4 sm:p-6 border border-[#e3d7c4] shadow-md hover:shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition hover:border-[#14382c]"
                  >
                    {/* Tour Image & Date */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-[#e0d3bf]">
                        <img src={evt.tour.image} alt={evt.tour.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 bg-[#14382c] text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                          {evt.day} {currentMonth.name.split(' ')[0]}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-[#f2e6d5] text-[#b45309] border border-[#e6d5be]">
                            {evt.categoryLabel}
                          </span>
                          <span className="text-xs text-[#14382c] font-bold">
                            {evt.tour.duration}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2">{evt.tour.title}</h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin size={14} className="text-[#d97706]" />
                            <span>{evt.tour.location}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} className="text-[#d97706]" />
                            <span>{evt.departureTime}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Booking Button */}
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#eee5d8]">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 mb-0.5">قیمت تور:</div>
                        <div className="text-xl font-black text-[#14382c]">
                          {evt.tour.price}
                        </div>
                        <div className="text-[11px] text-[#b45309] font-bold flex items-center gap-1 mt-1">
                          <Users size={12} />
                          <span>ظرفیت باقی‌مانده: {evt.capacityLeft} از {evt.totalCapacity} نفر</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectTour(evt.tour)}
                        className="bg-[#14382c] hover:bg-[#0e2a21] text-white font-black px-5 py-3 rounded-lg text-xs sm:text-sm shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
                      >
                        <span>ثبت‌نام و رزرو</span>
                        <ArrowLeft size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Season Footer Banner */}
        <div className="relative z-10 mt-8 p-4 rounded-xl bg-[#f2e8da] border border-[#e0d3be] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#14382c] shrink-0" />
            <span>
              <strong>تضمین استانداردهای کمپینگ:</strong> چادرهای ۲پوش ضدآب، کیسه‌خواب آلمانی، لیدرهای بین‌المللی کارت‌دار و بیمه کامل حادثه گروهی.
            </span>
          </div>

          <a
            href="tel:09215014474"
            className="bg-[#d97706] hover:bg-[#b45309] text-white font-black px-4 py-2 rounded-lg shrink-0 text-xs transition shadow-sm"
          >
            استعلام ظرفیت: ۰۹۲۱۵۰۱۴۴۷۴
          </a>
        </div>

      </div>
    </section>
  );
};
