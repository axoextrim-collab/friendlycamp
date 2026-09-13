import React from 'react';
import { PhoneCall, CheckCircle2, Headphones, ShieldCheck, ArrowLeft } from 'lucide-react';

interface WhyChooseUsProps {
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const WhyChooseUs: React.FC<WhyChooseUsProps> = ({
  onOpenContact,
  onNavigateSection
}) => {
  const checkItems = [
    { title: 'جزئیات کامل', subtitle: 'شفافیت کامل در هزینه‌ها و برنامه‌ها' },
    { title: 'پس انداز بودجه', subtitle: 'بهترین نرخ تورهای طبیعت‌گردی' },
    { title: 'مشاوره رایگان', subtitle: 'پاسخگویی سریع توسط کارشناسان' },
    { title: 'تکمیل گواهینامه', subtitle: 'دارای مجوز رسمی سازمان گردشگری' }
  ];

  return (
    <section id="why-choose-us" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-[#044e42] text-white rounded-xl p-8 md:p-14 shadow-2xl relative overflow-hidden border border-white/10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          
          {/* Left Column (RTL Left): 24 Hours Service & Direct Phone */}
          <div className="lg:col-span-5 flex flex-col items-center text-center bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/15 shadow-xl">
            <div className="w-16 h-16 rounded-xl bg-[#f59e0b] text-slate-950 flex items-center justify-center font-black mb-4 shadow-lg animate-bounce">
              <Headphones size={32} />
            </div>

            <span className="text-xs font-black text-[#f59e0b] tracking-widest uppercase mb-1">
              FRIENDLY CAMP 24/7 SUPPORT
            </span>

            <h3 className="text-2xl font-black text-white mb-2">تماس با سرپرستان تور</h3>

            <a
              href="tel:09215014474"
              className="text-3xl sm:text-4xl font-black text-[#f59e0b] dir-ltr hover:scale-105 transition my-2 font-mono"
            >
              ۰۹۲۱۵۰۱۴۴۷۴
            </a>

            <p className="text-xs text-emerald-100/80 font-medium max-w-xs mt-2">
              تیم سرپرستی باشگاه فرندلی کمپ آماده پاسخگویی و مشاوره سفر شماست.
            </p>

            <button
              onClick={onOpenContact}
              className="mt-6 w-full bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black py-3 rounded-lg transition shadow-lg text-sm cursor-pointer"
            >
              ارسال پیام مستقیم
            </button>
          </div>

          {/* Right Column (RTL Right): Why Choose Us & Checklist */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-right">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30">
                مزایای باشگاه فرندلی کمپ
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                چرا فرندلی کمپ را <span className="text-[#f59e0b]">انتخاب کنید؟</span>
              </h2>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {checkItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f59e0b] text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 size={22} className="text-[#044e42]" />
                  </div>
                  <div className="text-right">
                    <h4 className="font-extrabold text-white text-base">{item.title}</h4>
                    <p className="text-xs text-emerald-100/70 font-medium">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Learn More Button */}
            <div className="pt-4">
              <button
                onClick={() => onNavigateSection('experience')}
                className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black px-8 py-3.5 rounded-full shadow-lg hover:scale-105 transition text-base flex items-center gap-2 cursor-pointer"
              >
                <span>بیشتر بدانید</span>
                <ArrowLeft size={18} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
