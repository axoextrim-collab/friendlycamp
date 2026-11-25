import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React from 'react';
import { BOOKING_STEPS } from '../data/mockData';
import { MapPin, CreditCard, Luggage, Sparkles, ArrowLeft } from 'lucide-react';

interface BookingStepsProps {
  onOpenBooking: () => void;
}

export const BookingSteps: React.FC<BookingStepsProps> = ({ onOpenBooking }) => {
  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'MapPin':
        return <MapPin size={24} className="text-amber-500" />;
      case 'CreditCard':
        return <CreditCard size={24} className="text-amber-500" />;
      case 'Luggage':
        return <Luggage size={24} className="text-amber-500" />;
      default:
        return <Sparkles size={24} className="text-amber-500" />;
    }
  };

  return (
    <section id="travel-roadmap" tabIndex={-1} aria-label={siteText("نقشه راه سفر و ثبت درخواست")} className="scroll-mt-28 py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Traveler Photo & graphics (RTL Left side) */}
        <div className="lg:col-span-5 relative flex justify-center">
          <div className="relative w-full max-w-md h-[450px] rounded-xl overflow-hidden shadow-2xl border-4 border-white">
            <img loading="lazy" decoding="async"
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"
              alt={siteText("همنورد فرندلی کمپ")}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14382c]/70 via-transparent to-transparent" />

            {/* Featured offer badge card */}
            <div className="absolute bottom-6 inset-x-6 bg-white/90 backdrop-blur-md p-4 rounded-lg shadow-xl border border-slate-100 text-right">
              <span className="text-xs font-extrabold text-[#f59e0b] block mb-1"><ManagedText value={"پیشنهاد ویژه فرندلی کمپ"}/></span>
              <h4 className="font-bold text-[#14382c] text-sm mb-2"><ManagedText value={"برنامه مناسب خودت را انتخاب کن"}/></h4>
              <button type="button"
                onClick={onOpenBooking}
                className="bg-[#14382c] hover:bg-[#f59e0b] text-white hover:text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition w-full cursor-pointer flex items-center justify-center gap-1"
              >
                <span><ManagedText value={"مشاهده برنامه‌های سفر"}/></span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Steps Content (RTL Right side) */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-right">
          
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#14382c] leading-tight mb-2"><ManagedText value={"۳ گام ساده برای "}/><span className="text-[#f59e0b]"><ManagedText value={"رزرو تور کمپینگ"}/></span>
            </h2>
          </div>

          {/* Steps List */}
          <div className="flex flex-col gap-4 my-2">
            {BOOKING_STEPS.map((step) => (
              <div
                key={step.number}
                className="bg-white rounded-3xl p-5 shadow-md border border-slate-100 flex items-center gap-5 hover:shadow-xl transition duration-300"
              >
                {/* Step Number badge */}
                <div className="w-12 h-12 rounded-2xl bg-[#14382c] text-amber-300 font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                  <ManagedText value={step.number}/>
                </div>

                {/* Step Details */}
                <div className="flex-1">
                  <h3 className="font-extrabold text-lg text-[#14382c] mb-1">
                    <ManagedText value={step.title}/>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    <ManagedText value={step.description}/>
                  </p>
                </div>

                {/* Step Icon */}
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200">
                  <ManagedText value={getStepIcon(step.iconName)}/>
                </div>
              </div>
            ))}
          </div>



        </div>

      </div>
    </section>
  );
};
