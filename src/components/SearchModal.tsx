import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  MapPin,
  Calendar,
  Compass,
  ArrowLeft,
  SlidersHorizontal,
  DollarSign,
  Clock,
  Award,
  Tent,
  Mountain,
  Sparkles,
  RotateCcw,
  Check,
  Flame,
  Camera,
  Layers
} from 'lucide-react';
import { POPULAR_DESTINATIONS, POPULAR_TOURS } from '../data/mockData';
import { Tour, Destination } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTour: (tour: Tour) => void;
}

type DifficultyLevel = 'all' | 'easy' | 'moderate' | 'hard';
type DurationFilter = 'all' | 'short' | 'medium' | 'long'; // 1-2, 3-4, 5+

const ACTIVITY_TYPES = [
  { id: 'camping', label: 'کمپینگ و شب‌مانی', icon: Tent },
  { id: 'trekking', label: 'پیمایش و ترکینگ', icon: Mountain },
  { id: 'photography', label: 'عکاسی و رصد نجومی', icon: Camera },
  { id: 'river', label: 'آب‌نوردی و دره‌نوردی', icon: Flame },
  { id: 'glamping', label: 'گلمپینگ و لوکس', icon: Sparkles },
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTour
}) => {
  const [query, setQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Advanced Filter States
  const [maxPrice, setMaxPrice] = useState<number>(8000000);
  const [selectedDuration, setSelectedDuration] = useState<DurationFilter>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('all');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  if (!isOpen) return null;

  // Toggle activity checkbox
  const toggleActivity = (actId: string) => {
    setSelectedActivities(prev =>
      prev.includes(actId) ? prev.filter(a => a !== actId) : [...prev, actId]
    );
  };

  // Helper to parse price string like "۲,۸۵۰,۰۰۰ تومان" to number
  const parsePriceNumber = (priceStr: string): number => {
    const englishDigits = priceStr
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[^0-9]/g, '');
    return parseInt(englishDigits, 10) || 0;
  };

  // Helper to parse duration days
  const parseDurationDays = (durationStr: string): number => {
    if (durationStr.includes('۱') || durationStr.includes('2.5') || durationStr.includes('۲')) return 2;
    if (durationStr.includes('۳') || durationStr.includes('۴')) return 4;
    return 5;
  };

  // Filtered tours calculation
  const filteredTours = POPULAR_TOURS.filter((tour) => {
    // Text search
    const matchesQuery =
      !query ||
      tour.title.includes(query) ||
      tour.location.includes(query) ||
      tour.country.includes(query);

    if (!matchesQuery) return false;

    // Price Filter
    const tourPriceNum = parsePriceNumber(tour.price);
    if (tourPriceNum > maxPrice) return false;

    // Duration Filter
    const days = parseDurationDays(tour.duration);
    if (selectedDuration === 'short' && days > 2) return false;
    if (selectedDuration === 'medium' && (days < 3 || days > 4)) return false;
    if (selectedDuration === 'long' && days < 5) return false;

    // Difficulty Filter
    if (selectedDifficulty === 'easy' && tour.rating < 4.5) return false;
    if (selectedDifficulty === 'hard' && tour.rating >= 4.9) return false;

    // Activity Filter
    if (selectedActivities.length > 0) {
      const tourText = (tour.title + ' ' + (tour.highlights || []).join(' ')).toLowerCase();
      const matchesActivity = selectedActivities.some((act) => {
        if (act === 'camping') return tourText.includes('کمپ') || tourText.includes('چادر');
        if (act === 'trekking') return tourText.includes('پیمایش') || tourText.includes('صعود') || tourText.includes('ترکینگ');
        if (act === 'photography') return tourText.includes('عکاسی') || tourText.includes('نجوم') || tourText.includes('رصد');
        if (act === 'river') return tourText.includes('آب') || tourText.includes('رودخانه') || tourText.includes('شنا');
        if (act === 'glamping') return tourText.includes('VIP') || tourText.includes('لوکس') || tourText.includes('گلمپینگ');
        return true;
      });
      if (!matchesActivity) return false;
    }

    return true;
  });

  const filteredDestinations = POPULAR_DESTINATIONS.filter(
    (d) => d.title.includes(query) || d.country.includes(query)
  );

  const activeFilterCount =
    (maxPrice < 8000000 ? 1 : 0) +
    (selectedDuration !== 'all' ? 1 : 0) +
    (selectedDifficulty !== 'all' ? 1 : 0) +
    selectedActivities.length;

  const handleResetFilters = () => {
    setMaxPrice(8000000);
    setSelectedDuration('all');
    setSelectedDifficulty('all');
    setSelectedActivities([]);
    setQuery('');
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="جستجوی تور و مقصد" className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-3 sm:px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 text-right my-auto max-h-[90vh] flex flex-col">
        
        {/* Header Search Input Bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#004e5a] text-white flex items-center justify-center shrink-0 shadow-md">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام تور، مقصد یا فعالیت (مثلاً: کویر کاراکال، دماوند، کمپینگ)..."
            className="flex-1 text-slate-800 font-bold outline-none text-sm sm:text-base placeholder:text-slate-400"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeFilterCount > 0
                ? 'bg-[#004e5a] text-white border-[#004e5a] shadow'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">فیلترهای پیشرفته</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#84cc16] text-[#064e3b] text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl hover:bg-slate-100 text-slate-500 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {isFilterOpen && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-3 space-y-4 text-xs shrink-0 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-black text-[#003843] flex items-center gap-1.5">
                <SlidersHorizontal size={15} className="text-[#84cc16]" />
                <span>فیلترهای اختصاصی جستجوی تور</span>
              </span>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 text-[11px] transition cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>پاکسازی فیلترها</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* 1. Price Range Filter */}
              <div>
                <div className="flex justify-between items-center mb-1.5 font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <DollarSign size={14} className="text-emerald-600" />
                    <span>حداکثر قیمت هر نفر:</span>
                  </span>
                  <span className="text-[#004e5a] font-black font-mono">
                    {maxPrice.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={8000000}
                  step={500000}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-[#004e5a] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold mt-1">
                  <span>۱ م</span>
                  <span>۴.۵ م</span>
                  <span>۸ م تومان</span>
                </div>
              </div>

              {/* 2. Duration (Days) Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Clock size={14} className="text-amber-600" />
                  <span>مدت زمان تور (روز):</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'short', label: '۱ تا ۲ روز' },
                    { id: 'medium', label: '۳ تا ۴ روز' },
                    { id: 'long', label: '+۵ روز' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setSelectedDuration(dur.id as DurationFilter)}
                      className={`py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                        selectedDuration === dur.id
                          ? 'bg-[#004e5a] text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Difficulty Level Filter */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Award size={14} className="text-purple-600" />
                  <span>درجه سختی برنامه:</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'all', label: 'همه' },
                    { id: 'easy', label: 'ساده' },
                    { id: 'moderate', label: 'متوسط' },
                    { id: 'hard', label: 'سنگین' },
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff.id as DifficultyLevel)}
                      className={`py-1.5 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                        selectedDifficulty === diff.id
                          ? 'bg-[#004e5a] text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* 4. Specific Activity Types Filter Chips */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Layers size={14} className="text-emerald-600" />
                <span>نوع فعالیت و سبک برنامه:</span>
              </label>

              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_TYPES.map((act) => {
                  const isSelected = selectedActivities.includes(act.id);
                  const IconComp = act.icon;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => toggleActivity(act.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer text-[11px] border ${
                        isSelected
                          ? 'bg-[#84cc16] text-[#064e3b] border-[#84cc16] font-black shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <IconComp size={13} />
                      <span>{act.label}</span>
                      {isSelected && <Check size={12} />}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* Search Results Scroll Container */}
        <div className="max-h-[50vh] overflow-y-auto py-4 flex flex-col gap-6 flex-1">
          
          {/* Tours Results */}
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <h4 className="font-black text-[#003843] text-sm flex items-center gap-2">
                <Compass size={16} className="text-amber-500" />
                <span>نتایج تورها ({filteredTours.length})</span>
              </h4>

              {filteredTours.length === 0 && (
                <span className="text-xs text-red-600 font-bold">هیچ توری با این فیلترها پیدا نشد!</span>
              )}
            </div>

            {filteredTours.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {filteredTours.map((tour) => (
                  <div
                    key={tour.id}
                    onClick={() => {
                      onSelectTour(tour);
                      onClose();
                    }}
                    className="p-3.5 rounded-2xl hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 transition flex items-center justify-between cursor-pointer group shadow-sm bg-white"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={tour.image}
                        alt={tour.title}
                        className="w-14 h-14 rounded-2xl object-cover shadow"
                      />
                      <div>
                        <h5 className="font-black text-slate-900 text-sm group-hover:text-[#004e5a] transition">
                          {tour.title}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-0.5">
                          <span>{tour.duration}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-black font-mono">{tour.price}</span>
                          <span>•</span>
                          <span className="text-amber-600 font-mono">⭐ {tour.rating}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl hidden sm:inline">
                        مشاهده و رزرو
                      </span>
                      <ArrowLeft size={16} className="text-emerald-600 group-hover:-translate-x-1 transition" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <Compass size={32} className="mx-auto text-slate-400" />
                <p className="text-xs text-slate-600 font-bold">
                  هیچ توری متناسب با فیلتر قیمت ({maxPrice.toLocaleString('fa-IR')} تومان) یا مدت زمان انتخابی یافت نشد.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="bg-[#004e5a] hover:bg-[#003843] text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  حذف فیلترها و نمایش همه تورها
                </button>
              </div>
            )}
          </div>

          {/* Destinations Results */}
          {filteredDestinations.length > 0 && (
            <div>
              <h4 className="font-black text-[#003843] text-sm mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                <MapPin size={16} className="text-amber-500" />
                <span>مقاصد محبوب مرتبط ({filteredDestinations.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredDestinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center gap-3 cursor-pointer hover:bg-amber-100 transition shadow-sm"
                  >
                    <img
                      src={dest.image}
                      alt={dest.title}
                      className="w-12 h-12 rounded-xl object-cover shadow-sm"
                    />
                    <div>
                      <h5 className="font-black text-slate-900 text-xs">{dest.title}</h5>
                      <span className="text-[11px] text-amber-900 font-bold block">{dest.country}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
