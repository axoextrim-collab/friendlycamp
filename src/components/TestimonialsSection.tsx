import React, { useState, useEffect } from 'react';
import { Star, Quote, ChevronRight, ChevronLeft, ThumbsUp, CheckCircle, MessageSquarePlus, X, Send, Sparkles } from 'lucide-react';
import {useDesignSettings} from '../hooks/useDesignSettings';

export interface Testimonial {
  id: string;
  nameFa: string;
  nameEn: string;
  roleFa: string;
  roleEn: string;
  tourNameFa: string;
  tourNameEn: string;
  avatar: string;
  rating: number;
  dateFa: string;
  dateEn: string;
  commentFa: string;
  commentEn: string;
  verified: boolean;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: 't-1',
    nameFa: 'امیرحسین رضایی',
    nameEn: 'Amirhossein Rezaei',
    roleFa: 'طبیعت‌گرد و عکاس',
    roleEn: 'Nature Explorer & Photographer',
    tourNameFa: 'تور کمپینگ شبانه و پیمایش جنگل‌های شمال',
    tourNameEn: 'North Forest Night Camping & Trek',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    dateFa: 'اردیبهشت ۱۴۰۳',
    dateEn: 'May 2024',
    commentFa: 'تجربه سفر با فرندلی کمپ بی‌نظیر بود! برنامه‌ریزی سرپرست در کمپینگ شبانه و ایجاد فضای صمیمی دور آتش فوق‌العاده عالی بود. تجهیزات بسیار تمیز و باکیفیت بودند.',
    commentEn: 'Camping with Friendly Camp was unmatched! The leader’s campfire setup and warm atmosphere made it unforgettable. Equipment was top quality.',
    verified: true
  },
  {
    id: 't-2',
    nameFa: 'دکتر مریم کاظمی',
    nameEn: 'Dr. Maryam Kazemi',
    roleFa: 'استاد دانشگاه',
    roleEn: 'University Professor',
    tourNameFa: 'تور کویرنوردی و رصد ستارگان فرندلی کمپ',
    tourNameEn: 'Desert Stargazing Friendly Camp Tour',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    dateFa: 'فروردین ۱۴۰۳',
    dateEn: 'April 2024',
    commentFa: 'تماشای آسمان شب کویر همراه با راهنمایی‌های دقیق سرپرست فرندلی کمپ تبدیل به یکی از زیباترین خاطرات من شد. امنیت و نظم عالی بود.',
    commentEn: 'Stargazing in the desert guided by Friendly Camp leaders was one of my best travel memories. Great safety and organization.',
    verified: true
  },
  {
    id: 't-3',
    nameFa: 'مهندس کامران عباسی',
    nameEn: 'Kamran Abbasi',
    roleFa: 'کوهنورد و طبیعت‌گرد',
    roleEn: 'Hiker & Mountaineer',
    tourNameFa: 'پیمایش ارتفاعات و کمپ کوهستانی',
    tourNameEn: 'Highland Trek & Mountain Camp',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    dateFa: 'خرداد ۱۴۰۳',
    dateEn: 'June 2024',
    commentFa: 'سطح عالی خدمات، صمیمیت تیم فرندلی کمپ و احساس امنیت بالای سرپرستان باعث شد در طول پیمایش همه دغدغه‌ها را فراموش کنیم.',
    commentEn: 'Top-notch organization, friendly vibe, and experienced leaders at Friendly Camp made the entire trek completely stress-free.',
    verified: true
  },
  {
    id: 't-4',
    nameFa: 'سارا و علی حسینی',
    nameEn: 'Sara & Ali Hosseini',
    roleFa: 'زوج همنورد',
    roleEn: 'Campers Pair',
    tourNameFa: 'تور ۳ روزه دریاچه و کمپینگ جنگلی',
    tourNameEn: '3-Day Lake & Forest Camping',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    rating: 5,
    dateFa: 'تیر ۱۴۰۳',
    dateEn: 'July 2024',
    commentFa: 'تیم فرندلی کمپ مثل یک خانواده واقعی کنار همه مسافران بود. غذاهای کمپ بسیار خوشمزه و پذیرایی حرفه‌ای بود.',
    commentEn: 'The Friendly Camp crew treated everyone like real family. Delicious camp meals and super professional guides.',
    verified: true
  }
];

interface TestimonialsSectionProps {
  lang?: 'fa' | 'en';
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ lang = 'fa' }) => {
  const designSettings=useDesignSettings();
  const testimonialSettings=designSettings?.channels.testimonials;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isFa = lang === 'fa';
  const total = TESTIMONIALS_DATA.length;

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  // Auto rotate testimonials every 6s
  useEffect(() => {
    if(testimonialSettings?.enabled===false||designSettings?.slider.autoplay===false)return;
    const timer = setInterval(() => {
      nextTestimonial();
    }, testimonialSettings?.interval||6000);
    return () => clearInterval(timer);
  }, [testimonialSettings?.enabled,testimonialSettings?.interval,designSettings?.slider.autoplay]);

  const currentItem = TESTIMONIALS_DATA[currentIndex];

  return (
    <section id="testimonials" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-[#044e42] text-white rounded-xl p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        
        {/* Glowing aura */}
        <div className="absolute top-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-[#f59e0b]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-white/10">
          <div className="text-center md:text-right">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold mb-2 border border-[#f59e0b]/30">
              <Sparkles size={14} />
              <span>{isFa ? 'نظرات و تجربیات واقعی همنوردان' : 'Real Customer Testimonials'}</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              {isFa ? (
                <>روایت همنوردان از <span className="text-[#f59e0b]">تجربه کمپینگ</span> با فرندلی کمپ</>
              ) : (
                <>Campers' Stories with <span className="text-[#f59e0b]">Friendly Camp</span></>
              )}
            </h2>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-extrabold px-5 py-2.5 rounded-lg text-xs sm:text-sm transition flex items-center gap-2 shadow-lg cursor-pointer shrink-0"
          >
            <MessageSquarePlus size={18} />
            <span>{isFa ? 'ثبت تجربه و نظر شما' : 'Submit Your Review'}</span>
          </button>
        </div>

        {/* Main Testimonial Card Display */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Active Review Box (col-span-8) */}
          <div className="lg:col-span-8 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl border border-white/15 relative flex flex-col justify-between min-h-[300px]">
            
            <Quote size={48} className="absolute top-6 left-6 text-white/10 pointer-events-none" />

            <div>
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(currentItem.rating)].map((_, i) => (
                  <Star key={i} size={18} className="text-[#f59e0b] fill-[#f59e0b]" />
                ))}
                <span className="text-xs text-amber-300 font-bold mr-2">
                  {currentItem.rating}.0 / 5.0
                </span>
              </div>

              {/* Quote Text */}
              <p className="text-base sm:text-lg font-bold text-white leading-relaxed mb-6 italic">
                "{isFa ? currentItem.commentFa : currentItem.commentEn}"
              </p>
            </div>

            {/* Author Footer info */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              
              <div className="flex items-center gap-3">
                <img
                  src={currentItem.avatar}
                  alt={currentItem.nameFa}
                  className="w-14 h-14 rounded-lg object-cover border-2 border-[#f59e0b]"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-white text-base">
                      {isFa ? currentItem.nameFa : currentItem.nameEn}
                    </h4>
                    {currentItem.verified && (
                      <span className="bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle size={10} />
                        <span>{isFa ? 'مسافر تایید شده' : 'Verified'}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-emerald-100/70 font-medium block">
                    {isFa ? currentItem.roleFa : currentItem.roleEn} • {isFa ? currentItem.tourNameFa : currentItem.tourNameEn}
                  </span>
                </div>
              </div>

              <span className="text-xs text-amber-300/80 font-mono font-bold bg-white/5 px-3 py-1 rounded-lg">
                {isFa ? currentItem.dateFa : currentItem.dateEn}
              </span>

            </div>

          </div>

          {/* Navigation Controls & Avatar Thumbnails (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-6">
            
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <span className="text-xs text-slate-300 font-extrabold block mb-3">
                {isFa ? 'سایر مسافران این تور:' : 'Other Happy Travelers:'}
              </span>

              <div className="flex flex-col gap-3">
                {TESTIMONIALS_DATA.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-2.5 rounded-lg transition flex items-center gap-3 text-right cursor-pointer border ${
                      idx === currentIndex
                        ? 'bg-[#f59e0b] text-slate-950 border-white shadow-lg'
                        : 'bg-white/5 text-white/80 hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <img
                      src={item.avatar}
                      alt={item.nameFa}
                      className="w-9 h-9 rounded-lg object-cover shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-xs font-black block truncate">
                        {isFa ? item.nameFa : item.nameEn}
                      </span>
                      <span className={`text-[10px] block truncate ${idx === currentIndex ? 'text-slate-950' : 'text-slate-300'}`}>
                        {isFa ? item.tourNameFa : item.tourNameEn}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Prev/Next Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={prevTestimonial}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronRight size={18} />
                <span>{isFa ? 'قبلی' : 'Previous'}</span>
              </button>

              <span className="text-xs font-mono text-amber-300 font-extrabold px-3 py-1 bg-white/5 rounded-xl">
                {currentIndex + 1} / {total}
              </span>

              <button
                onClick={nextTestimonial}
                className="flex-1 bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] py-3 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{isFa ? 'بعدی' : 'Next'}</span>
                <ChevronLeft size={18} />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Review Submission Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-right text-slate-800">
            
            <button
              onClick={() => {
                setModalOpen(false);
                setSubmitted(false);
              }}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-xl font-black text-[#003843]">
                  {isFa ? 'نظر شما با موفقیت ثبت شد!' : 'Review Submitted Successfully!'}
                </h3>
                <p className="text-xs text-slate-600 max-w-xs font-medium">
                  {isFa
                    ? 'با تشکر از اشتراک‌گذاری تجربیات سفرتان. نظر شما پس از بررسی توسط تیم فرندلی کمپ منتشر خواهد شد.'
                    : 'Thank you for sharing your travel experience with us.'}
                </p>
                <button
                  onClick={() => {
                    setModalOpen(false);
                    setSubmitted(false);
                  }}
                  className="mt-2 bg-[#004e5a] text-white px-6 py-2.5 rounded-xl font-bold text-xs"
                >
                  {isFa ? 'متوجه شدم' : 'Got it'}
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/20 text-[#064e3b] flex items-center justify-center font-bold">
                    ★
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#003843]">
                      {isFa ? 'ثبت تجربه سفر با فرندلی کمپ' : 'Share Your Travel Experience'}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      {isFa ? 'ارزیابی کیفیت خدمات، تورلیدر و هتل‌ها' : 'Rate service quality and accommodation'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثلا: علی رضایی' : 'e.g. Ali Rezaei'}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004e5a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isFa ? 'تور یا مقصد تجربه شده' : 'Tour / Destination Experienced'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isFa ? 'مثلا: تور استوایی بالی' : 'e.g. Bali Tour'}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004e5a]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isFa ? 'امتیاز شما به سفر (از ۵ ستاره)' : 'Rating (out of 5)'}
                  </label>
                  <select className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004e5a]">
                    <option value="5">★★★★★ ۵ ستاره - فوق‌العاده</option>
                    <option value="4">★★★★☆ ۴ ستاره - بسیار خوب</option>
                    <option value="3">★★★☆☆ ۳ ستاره - متوسط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isFa ? 'متن تجربه و دیدگاه شما' : 'Your Review Comment'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={isFa ? 'درباره کیفیت تور، غذا و لیدر بنویسید...' : 'Write about tour quality, food, etc...'}
                    className="w-full bg-slate-50 text-slate-900 text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#004e5a]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-black py-3 rounded-2xl shadow transition text-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Send size={16} />
                  <span>{isFa ? 'ارسال نهایی نظر' : 'Submit Review'}</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </section>
  );
};
