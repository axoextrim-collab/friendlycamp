import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React from 'react';
import { ShieldCheck, Compass, Headphones, Award, CheckCircle2 } from 'lucide-react';

interface ExperienceSectionProps {
  onOpenContact: () => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ onOpenContact }) => {
  return (
    <section id="experience" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Travel image */}
        <div className="lg:col-span-5 relative flex justify-center">
          
          {/* Main Rounded Frame */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] rounded-xl overflow-hidden shadow-2xl border-4 border-white">
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=800"
              alt={siteText("کوه‌نورد در طبیعت")}
              className="w-full h-full object-cover"
            />
            {/* Plane trail overlay design */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
          </div>

          {/* Section label */}
          <div className="absolute -top-4 -right-4 sm:-right-6 bg-white rounded-xl p-4 shadow-xl border border-slate-100 flex items-center gap-3 animate-float">
            <div className="w-14 h-14 rounded-lg bg-[#f59e0b] text-slate-950 flex items-center justify-center font-black text-xl shadow-lg">
              <Compass size={28} />
            </div>
            <div className="flex flex-col text-right">
              <span className="font-extrabold text-[#14382c] text-base"><ManagedText value={"فرندلی کمپ"}/></span>
              <span className="text-xs text-slate-500 font-medium"><ManagedText value={"طبیعت‌گردی و کمپینگ"}/></span>
            </div>
          </div>

          {/* Hot air balloon background decoration */}
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-amber-100/60 rounded-full blur-xl -z-10" />
        </div>

        {/* Left Column (RTL): Text Content & Features */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-right">
          
          {/* Section Heading */}
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-[#14382c] text-xs font-extrabold mb-3"><ManagedText value={"چرا باشگاه طبیعت‌گردی فرندلی کمپ؟"}/></span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14382c] leading-tight mb-4"><ManagedText value={"تجربه‌ای رفاقت‌آمیز در دل "}/><span className="text-[#f59e0b]"><ManagedText value={"طبیعت بکر"}/></span>
            </h2>
            <p className="text-slate-600 text-base leading-relaxed font-medium"><ManagedText value={"در فرندلی کمپ می‌توانی مقصدها و برنامه‌های طبیعت‌گردی را بشناسی، تجهیزات را بررسی کنی و برای جزئیات سفر گروهی هماهنگ شوی. پیش از انتخاب برنامه، سطح دشواری مسیر، خدمات، وسایل موردنیاز و شرایط شرکت در همان سفر را بررسی کن."}/></p>
          </div>

          {/* Features Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
            
            {/* Feature 1 */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-slate-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <Compass size={24} />
              </div>
              <div>
                <h4 className="font-bold text-[#003843] text-base mb-1"><ManagedText value={"شناخت برنامهٔ سفر"}/></h4>
                <p className="text-xs text-slate-500 leading-normal"><ManagedText value={"مسیر، مدت، خدمات و نیازهای هر برنامه را پیش از تصمیم‌گیری بخوان."}/></p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-slate-100 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="font-bold text-[#003843] text-base mb-1"><ManagedText value={"ماموریت و چشم انداز"}/></h4>
                <p className="text-xs text-slate-500 leading-normal"><ManagedText value={"هدف این است که مردم را از طریق سفر به تجربیات مثبت متصل کرده و جهان را متفاوت ببینند."}/></p>
              </div>
            </div>

          </div>



        </div>

      </div>
    </section>
  );
};
