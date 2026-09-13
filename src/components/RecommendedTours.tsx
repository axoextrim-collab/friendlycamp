import React, { useState } from 'react';
import { Sparkles, Star, Calendar, ArrowLeft, Heart, Compass, ShieldCheck, Flame, Filter } from 'lucide-react';
import { Tour } from '../types';
import { POPULAR_TOURS } from '../data/mockData';

interface RecommendedToursProps {
  onSelectTour: (tour: Tour) => void;
  userPreferences?: string[];
}

export const RecommendedTours: React.FC<RecommendedToursProps> = ({
  onSelectTour,
  userPreferences = []
}) => {
  // Category preferences for quick filtering algorithm
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Categories list
  const categories = [
    { id: 'all', name: 'همه پیشنهادات هوشمند', icon: Sparkles },
    { id: 'desert', name: 'کویر و رمل‌نوردی', tag: 'کویر' },
    { id: 'jungle', name: 'جنگل و هیرکانی', tag: 'گیلان' },
    { id: 'sea', name: 'ساحل و جنوب', tag: 'جنوب' },
    { id: 'camping', name: 'کمپینگ و شب‌مانی', tag: 'کمپ' },
  ];

  // Simple Priority Score Algorithm
  const scoredTours = POPULAR_TOURS.map((tour) => {
    let score = 85; // Base match score
    let matchReason = 'محبوب‌ترین تور فصل';

    // Boost score based on user view / preference match
    if (tour.title.includes('کویر') || tour.location.includes('یزد')) {
      if (selectedCategory === 'desert' || userPreferences.includes('desert')) {
        score += 13;
        matchReason = 'تطابق ۱۰۰٪ با علاقه شما به کویرنوردی';
      }
    } else if (tour.title.includes('جنگل') || tour.country.includes('گیلان') || tour.country.includes('مازندران')) {
      if (selectedCategory === 'jungle' || userPreferences.includes('jungle')) {
        score += 12;
        matchReason = 'پیشنهاد ویژه بر اساس علاقه به طبیعت سرسبز';
      }
    } else if (tour.highlights.some(h => h.includes('کمپ') || h.includes('چادر'))) {
      if (selectedCategory === 'camping') {
        score += 10;
        matchReason = 'پیشنهاد بر اساس رزروهای قبلی تورهای کمپینگ';
      }
    }

    if (tour.rating >= 4.9) {
      score += 3;
    }

    const matchPercent = Math.min(99, score);

    return {
      ...tour,
      matchPercent,
      matchReason
    };
  }).sort((a, b) => b.matchPercent - a.matchPercent);

  // Filtered list
  const displayTours = scoredTours.filter((tour) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'desert') return tour.title.includes('کویر') || tour.location.includes('یزد');
    if (selectedCategory === 'jungle') return tour.title.includes('جنگل') || tour.country.includes('گیلان') || tour.country.includes('مازندران');
    if (selectedCategory === 'sea') return tour.title.includes('دریا') || tour.title.includes('ساحل') || tour.country.includes('جنوب');
    if (selectedCategory === 'camping') return tour.highlights.some(h => h.includes('کمپ') || h.includes('چادر'));
    return true;
  }).slice(0, 3);

  return (
    <section className="py-12 bg-gradient-to-b from-[#e1f3f3] via-[#ebf7f7] to-[#ebf7f7] relative overflow-hidden" id="recommended-tours">
      
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#84cc16]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#004e5a]/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#004e5a]/10 text-[#004e5a] px-3.5 py-1 rounded-full text-xs font-black mb-2 border border-[#004e5a]/20">
              <Sparkles size={14} className="text-[#84cc16] animate-pulse" />
              <span>سیستم پیشنهاد هوشمند فرندلی کمپ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#003843] tracking-tight">
              پیشنهادهای اختصاصی برای شما
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              بر اساس الگوریتم اولویت‌بندی مقصدهای قبلی، علایق انتخابی و بازخورد مسافران مشابه
            </p>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-[#004e5a] text-white border-[#004e5a] shadow-md'
                    : 'bg-white/80 text-slate-700 border-slate-200 hover:bg-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayTours.map((tour) => (
            <div
              key={tour.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col group relative"
            >
              {/* Image & Match Badge */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Match Score Badge */}
                <div className="absolute top-3 right-3 bg-[#064e3b]/95 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-full border border-emerald-400/40 shadow-md flex items-center gap-1">
                  <Flame size={13} className="text-[#84cc16] fill-[#84cc16]" />
                  <span>{tour.matchPercent}٪ تطابق با علایق شما</span>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-extrabold px-2.5 py-1 rounded-xl shadow">
                  {tour.duration}
                </div>

                {/* Rating Badge */}
                <div className="absolute bottom-3 left-3 bg-amber-400 text-amber-950 text-[11px] font-black px-2 py-1 rounded-xl flex items-center gap-1 shadow">
                  <Star size={12} className="fill-amber-950" />
                  <span>{tour.rating}</span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between text-right">
                <div>
                  {/* Match Reason Banner */}
                  <div className="bg-emerald-50 text-emerald-900 text-[11px] font-bold px-3 py-1 rounded-xl mb-2.5 border border-emerald-200/80 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[#004e5a] shrink-0" />
                    <span className="truncate">{tour.matchReason}</span>
                  </div>

                  <h3 className="text-base font-black text-[#003843] mb-1.5 line-clamp-1 group-hover:text-[#004e5a] transition">
                    {tour.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1">
                    <Compass size={14} className="text-[#84cc16]" />
                    <span>موقعیت: {tour.location} - {tour.country}</span>
                  </p>

                  {/* Tour Highlights Pills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {tour.highlights.slice(0, 3).map((h, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">پایه قیمت هر نفر:</span>
                    <span className="text-sm font-black text-[#004e5a] font-mono">{tour.price}</span>
                  </div>

                  <button
                    onClick={() => onSelectTour(tour)}
                    className="bg-[#004e5a] hover:bg-[#003843] text-white font-black text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer group-hover:bg-[#84cc16] group-hover:text-[#064e3b]"
                  >
                    <span>رزرو سریع تور</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
