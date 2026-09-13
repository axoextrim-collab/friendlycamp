import React, { useState } from 'react';
import { POPULAR_TOURS } from '../data/mockData';
import { Tour } from '../types';
import { InteractiveTourMap } from './InteractiveTourMap';
import { Calendar, MapPin, Star, Clock, CheckCircle, ArrowLeft, Map, Grid, ThumbsUp, MessageSquare, Flame, Sparkles, Compass, Users, ShieldCheck, X } from 'lucide-react';

interface PopularToursProps {
  onSelectTour: (tour: Tour) => void;
}

export const PopularTours: React.FC<PopularToursProps> = ({ onSelectTour }) => {
  const [activeView, setActiveView] = useState<'grid' | 'map'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTourForMap, setSelectedTourForMap] = useState<string>('tour-1');
  const [reviewModalTour, setReviewModalTour] = useState<Tour | null>(null);

  // Helper to render 5-star icons based on rating number
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star key={i} size={15} className="text-amber-400 fill-amber-400" />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative inline-block">
            <Star size={15} className="text-slate-300 fill-slate-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star size={15} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} size={15} className="text-slate-200 fill-slate-200" />
        );
      }
    }
    return stars;
  };

  const getSatisfactionLabel = (rating: number) => {
    if (rating >= 4.9) return 'فوق‌العاده (۹۹٪ رضایت)';
    if (rating >= 4.7) return 'عالی (۹۵٪ رضایت)';
    return 'بسیار خوب (۹۰٪ رضایت)';
  };

  return (
    <section id="tours" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="text-center md:text-right">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14382c] leading-tight mb-2">
            محبوب‌ترین <span className="text-[#d97706]">تورها و کمپینگ‌ها</span>
          </h2>
          <p className="text-slate-600 text-sm md:text-base font-medium">
            برنامه‌های حرفه‌ای طبیعت‌گردی با تجهیزات کامل، لیدرهای کارت‌دار و تضمین کیفیت
          </p>
        </div>
      </div>

      {/* Filter Category Bar */}
      {activeView === 'grid' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8">
          {[
            { id: 'all', label: 'همه تورها' },
            { id: 'rainforest', label: 'جنگل بارانی و کمپینگ' },
            { id: 'waterfall', label: 'پیمایش آبشار و رودخانه' },
            { id: 'alpine', label: 'کوهستان و صخره‌نوردی' },
            { id: 'safari', label: 'سافاری حیات وحش' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#14382c] text-white border-[#14382c] shadow-md'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* View Content based on activeView */}
      {activeView === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {POPULAR_TOURS.map((tour, idx) => (
            <div
              key={tour.id}
              onClick={() => onSelectTour(tour)}
              className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200/80 flex flex-col justify-between cursor-pointer relative hover:-translate-y-1"
            >
              {/* Top Image Container */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                {/* Duration Badge */}
                <div className="absolute top-4 right-4 bg-[#14382c]/90 backdrop-blur-md text-white px-3.5 py-1 rounded-full text-xs font-extrabold shadow-md flex items-center gap-1.5 border border-emerald-400/30">
                  <Clock size={14} className="text-[#f59e0b]" />
                  <span>{tour.duration}</span>
                </div>

                {/* Difficulty & Map Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTourForMap(tour.id);
                    setActiveView('map');
                  }}
                  className="absolute top-4 left-4 bg-white/95 hover:bg-[#d97706] hover:text-white text-[#14382c] px-3 py-1 rounded-full text-[11px] font-black shadow-md flex items-center gap-1 transition"
                  title="مشاهده نقشه ایستگاه‌ها"
                >
                  <Map size={12} />
                  <span>نقشه راه</span>
                </button>

                {/* Location Title */}
                <div className="absolute bottom-4 right-4 text-white flex items-center gap-1.5">
                  <MapPin size={18} className="text-[#f59e0b]" />
                  <h3 className="text-xl font-extrabold text-white drop-shadow-md">
                    {tour.title}
                  </h3>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-6 flex flex-col gap-4">
                
                {/* Rating & Reviews */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setReviewModalTour(tour);
                  }}
                  className="bg-amber-50 hover:bg-amber-100/80 p-3 rounded-2xl border border-amber-200/70 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      {renderStars(tour.rating)}
                      <span className="text-xs font-black text-amber-950 font-mono mr-1">
                        {tour.rating}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-900 font-extrabold mt-0.5">
                      {getSatisfactionLabel(tour.rating)}
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-bold text-[#14382c] flex items-center gap-1">
                      <MessageSquare size={13} />
                      <span>{tour.reviewsCount} نظر</span>
                    </span>
                    <span className="text-[9px] text-slate-500 block font-medium">مشاهده نظرات</span>
                  </div>
                </div>

                {/* Highlights List */}
                <div className="flex flex-col gap-2">
                  {tour.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                {/* Price & Guarantee */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">قیمت پایه هر نفر:</span>
                    <span className="text-lg font-black text-[#14382c]">{tour.price}</span>
                  </div>

                  <div className="flex items-center gap-1 text-emerald-800 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck size={14} />
                    <span>تجهیزات کامل</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTour(tour);
                  }}
                  className="w-full bg-[#14382c] hover:bg-[#d97706] text-white font-black py-3 rounded-2xl transition duration-200 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer mt-1"
                >
                  <span>رزرو آنلاین این تور</span>
                  <ArrowLeft size={16} />
                </button>

              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Interactive Map Section */
        <InteractiveTourMap
          selectedTourId={selectedTourForMap}
          onSelectTour={onSelectTour}
        />
      )}

      {/* Reviews Summary Modal */}
      {reviewModalTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-right">
            
            <button
              onClick={() => setReviewModalTour(null)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl">
                ★
              </div>
              <div>
                <h4 className="font-black text-[#14382c] text-lg">نظرات و امتیازبندی ۵ ستاره</h4>
                <span className="text-xs text-slate-500 font-medium">{reviewModalTour.title}</span>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-4 text-center">
              <span className="text-4xl font-black text-amber-900 font-mono block mb-1">
                {reviewModalTour.rating} / ۵.۰
              </span>
              <div className="flex items-center justify-center gap-1 mb-1">
                {renderStars(reviewModalTour.rating)}
              </div>
              <span className="text-xs font-bold text-amber-800">
                بر اساس {reviewModalTour.reviewsCount} ارزیابی ثبت شده مسافران فرندلی کمپ
              </span>
            </div>

            {/* Sample User Reviews List */}
            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">امیرحسین رضایی</span>
                  <span className="text-amber-500 font-bold">★★★★★ ۵/۵</span>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  تجهیزات چادر و کیسه‌خواب آلمانی فوق‌العاده باکیفیت بودند. لیدرها بسیار با اخلاق و مسلط بودند.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">مریم کاظمی</span>
                  <span className="text-amber-500 font-bold">★★★★★ ۵/۵</span>
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  غذاهای داغ داغ در کمپ و پذیرایی صبحانه عالی بود. حتماً در تورهای بعدی شرکت می‌کنم.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                const tourToBook = reviewModalTour;
                setReviewModalTour(null);
                onSelectTour(tourToBook);
              }}
              className="w-full bg-[#14382c] hover:bg-[#0e2a21] text-white font-black py-3 rounded-2xl shadow transition text-sm cursor-pointer"
            >
              رزرو این تور شگفت‌انگیز
            </button>

          </div>
        </div>
      )}

    </section>
  );
};
