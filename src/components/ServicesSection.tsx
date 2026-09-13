import React from 'react';
import { Tent, ShieldCheck, Utensils, Truck, Compass, Flame, ArrowLeft, Sparkles, CheckCircle2, PhoneCall } from 'lucide-react';

interface ServicesSectionProps {
  onOpenContact: () => void;
}

const SPECIALIZED_SERVICES = [
  {
    id: 's1',
    title: 'تجهیزات هیدرواستاتیک و ضدآب',
    desc: 'تامین چادارهای ۲پوش آلمانی ضدباران، کیسه‌خواب‌های ۵- درجه، زیراندازهای آکاردئونی ضخیم و هدلامپ‌های پرنور صنعتی برای تمام شرکت‌کنندگان.',
    icon: Tent,
    badge: 'تجهیزات ۱۰۰٪ ضدآب',
    highlightColor: 'from-amber-500 to-amber-600'
  },
  {
    id: 's2',
    title: 'لیدرهای بین‌المللی و امدادگر',
    desc: 'همراهی لیدرهای کارت‌دار وزارت میراث فرهنگی، مربیان رسمی کوهنوردی و کمک‌پرستاران مجهز به جعبه کمک‌های اولیه و دستگاه شوک اولترا.',
    icon: ShieldCheck,
    badge: 'امنیت و ایمنی تضمینی',
    highlightColor: 'from-emerald-600 to-teal-700'
  },
  {
    id: 's3',
    title: 'آشپزی تخصصی و باربیکیو جنگلی',
    desc: 'سرو سه وعده غذای داغ، کباب‌های تازه در کمپ، صبحانه کامل محلی، چای ذغالی و قهوه اسپرسو در تمام طول پیمایش.',
    icon: Utensils,
    badge: 'پذیرایی داغ ۵ ستاره',
    highlightColor: 'from-amber-600 to-[#d97706]'
  },
  {
    id: 's4',
    title: 'پشتیبانی ترابری و ترنسفر ۲ دیفرانسیل',
    desc: 'حمل کامل کوله‌ها و چادرها با پاترول و نیسان‌های ۴x۴ تا محل کمپ، تا مسافران بدون بار سنگین از پیاده‌روی لذت ببرند.',
    icon: Truck,
    badge: 'حمل بار سبک و راحت',
    highlightColor: 'from-teal-600 to-emerald-800'
  },
  {
    id: 's5',
    title: 'مسیریابی جی‌پي‌اس و بیس‌کمپ ایمن',
    desc: 'برپایی بیس‌کمپ‌های اختصاصی فرندلی کمپ در نقاط غیرعمومی با پرژکتورهای خورشیدی، سرویس بهداشتی صحرایی و چادر خلوت.',
    icon: Compass,
    badge: 'کمپ اختصاصی و امن',
    highlightColor: 'from-[#14382c] to-emerald-900'
  },
  {
    id: 's6',
    title: 'شب‌نشینی، موسیقی و آتش‌بازی',
    desc: 'دورهمی‌های شبانه دور کنده‌های بزرگ آتش، بازی‌های گروهی، استماع آوای طبیعت و عکاسی حرفه‌ای از ستارگان شب.',
    icon: Flame,
    badge: 'شب‌های خاطره‌انگیز',
    highlightColor: 'from-amber-500 to-orange-600'
  }
];

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenContact }) => {
  return (
    <section id="services" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-[#14382c] text-white rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl relative overflow-hidden border border-emerald-400/20">
        
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 text-[#f59e0b] text-xs font-bold mb-3 border border-amber-500/30">
            <Sparkles size={16} />
            <span>خدمات تخصصی باشگاه فرندلی کمپ</span>
          </span>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            خدمات فوق‌حرفه‌ای <span className="text-[#f59e0b]">کمپینگ و جنگل‌نوردی</span>
          </h2>
          
          <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed font-medium">
            ما در فرندلی کمپ تمامی ملزومات کمپینگ صفر تا صد را آماده کرده‌ایم تا بدون دغدغه تجهیزات و امنیت، فقط از جادوی طبیعت لذت ببرید.
          </p>
        </div>

        {/* 6 Specialized Services Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {SPECIALIZED_SERVICES.map((srv) => {
            const IconComp = srv.icon;
            return (
              <div
                key={srv.id}
                className="bg-slate-950/70 hover:bg-slate-950 rounded-2xl p-6 border border-white/10 hover:border-[#f59e0b]/60 transition-all duration-300 shadow-xl flex flex-col justify-between group hover:-translate-y-1.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${srv.highlightColor} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition duration-300`}>
                      <IconComp size={28} />
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-3 group-hover:text-[#f59e0b] transition">
                    {srv.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mb-6">
                    {srv.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 pt-4 border-t border-white/10">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>تضمین کیفیت فرندلی کمپ</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Contact Callout */}
        <div className="relative z-10 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/80 p-6 sm:p-8 rounded-2xl border border-white/15 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-right">
            <div className="w-12 h-12 rounded-xl bg-[#f59e0b] text-slate-950 flex items-center justify-center shrink-0 font-black shadow-lg">
              <PhoneCall size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-white">نیاز به تجهیزات سفارشی یا تور اختصاصی دارید؟</h4>
              <p className="text-xs text-slate-300 font-medium mt-0.5">کارشناسان ما آماده پاسخگویی و مشاوره رایگان تجهیزات کمپینگ هستند.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={onOpenContact}
              className="w-full md:w-auto bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>مشاوره و رزرو تور</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
