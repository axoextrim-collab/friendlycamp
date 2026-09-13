import React from 'react';
import { Play, Award, Tent, Users, Compass } from 'lucide-react';

interface VideoCTAProps {
  onOpenVideo: () => void;
}

export const VideoCTA: React.FC<VideoCTAProps> = ({ onOpenVideo }) => {
  return (
    <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="relative rounded-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between min-h-[460px]">
        
        {/* Background Image: Deep Rainforest Jungle */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1511497584788-876761c119ef?auto=format&fit=crop&q=80&w=1600"
            alt="ماجراجویی کمپینگ در جنگل بارانی"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#022821]/95 via-[#03362e]/60 to-black/30" />
        </div>

        {/* Center Banner Content */}
        <div className="relative z-10 p-8 md:p-16 text-center my-auto flex flex-col items-center">
          <span className="text-xs md:text-sm font-black text-[#f59e0b] tracking-wider mb-2 bg-black/40 px-4 py-1 rounded-full border border-[#f59e0b]/30">
            باشگاه کمپینگ فرندلی کمپ
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-lg leading-tight mb-8">
            بگو <span className="text-[#f59e0b] underline decoration-[#044e42] underline-offset-8">بله!</span> به کمپینگ در جنگل‌های بارانی
          </h2>

          {/* Central Play Button */}
          <button
            onClick={onOpenVideo}
            className="group relative w-20 h-20 md:w-24 md:h-24 rounded-lg bg-white/25 backdrop-blur-md border-2 border-white text-white flex items-center justify-center shadow-2xl hover:scale-110 transition duration-300 cursor-pointer"
            aria-label="مشاهده ویدیو مستند ۴K جنگل‌های بارانی"
            id="video-cta-play-btn"
          >
            <div className="absolute inset-0 rounded-lg bg-[#f59e0b]/40 animate-ping" />
            <Play size={36} className="fill-white text-white ml-1 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Bottom Stats Overlay Bar */}
        <div className="relative z-10 bg-[#044e42]/95 backdrop-blur-md border-t border-white/10 p-6 md:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center text-white">
            
            {/* Stat 1 */}
            <div className="flex flex-col items-center justify-center p-3 border-l last:border-l-0 border-white/10">
              <span className="text-3xl md:text-4xl font-black text-[#f59e0b] mb-1">
                +۷ سال
              </span>
              <span className="text-xs md:text-sm font-semibold text-emerald-100/90 flex items-center gap-1">
                <Award size={16} className="text-[#f59e0b]" />
                <span>سابقه اجرای تور</span>
              </span>
            </div>

            {/* Stat 2 */}
            <div className="flex flex-col items-center justify-center p-3 border-l last:border-l-0 border-white/10">
              <span className="text-3xl md:text-4xl font-black text-[#f59e0b] mb-1">
                +۱۲۰
              </span>
              <span className="text-xs md:text-sm font-semibold text-emerald-100/90 flex items-center gap-1">
                <Compass size={16} className="text-[#f59e0b]" />
                <span>برنامه کمپینگ موفق</span>
              </span>
            </div>

            {/* Stat 3 */}
            <div className="flex flex-col items-center justify-center p-3 border-l last:border-l-0 border-white/10">
              <span className="text-3xl md:text-4xl font-black text-[#f59e0b] mb-1">
                +۴,۲۰۰
              </span>
              <span className="text-xs md:text-sm font-semibold text-emerald-100/90 flex items-center gap-1">
                <Users size={16} className="text-[#f59e0b]" />
                <span>همنورد راضی</span>
              </span>
            </div>

            {/* Stat 4 */}
            <div className="flex flex-col items-center justify-center p-3">
              <span className="text-3xl md:text-4xl font-black text-[#f59e0b] mb-1">
                ۱۰۰٪
              </span>
              <span className="text-xs md:text-sm font-semibold text-emerald-100/90 flex items-center gap-1">
                <Tent size={16} className="text-[#f59e0b]" />
                <span>تجهیزات استاندارد</span>
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

