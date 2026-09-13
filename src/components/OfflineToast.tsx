import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, MapPin, Compass, ShieldCheck, X, Download } from 'lucide-react';

export const OfflineToast: React.FC = () => {
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showDemoToggle, setShowDemoToggle] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline || isDismissed) {
    return (
      <div className="fixed top-20 left-4 z-40">
        <button
          onClick={() => {
            setIsOffline(true);
            setIsDismissed(false);
          }}
          className="bg-slate-900/90 hover:bg-[#002f38] text-slate-300 hover:text-[#84cc16] px-3 py-1.5 rounded-full text-[11px] font-bold border border-slate-700/80 shadow-lg flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
          title="تست حالت آفلاین شبکه‌های طبیعت‌گردی"
        >
          <WifiOff size={13} />
          <span>تست حالت آفلاین (Offline Mode)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-4 right-4 sm:right-auto sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#002f38]/95 backdrop-blur-md text-white p-4 rounded-2xl border-2 border-[#84cc16] shadow-2xl space-y-2.5">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse">
              <WifiOff size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xs text-white">حالت آفلاین فعال شد (Offline Mode)</span>
                <span className="bg-[#84cc16] text-[#064e3b] text-[9px] font-mono font-black px-2 py-0.5 rounded-full">
                  آماده طبیعت
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-0.5 leading-relaxed font-medium">
                ارتباط اینترنت قطعی دارد. اطلاعات برنامه سفر، شماره‌های اضطراری و نقشه آفلاین کمپینگ شما ذخیره شده و کاملا در دسترس است.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick offline actions */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
          <span className="text-[#84cc16] flex items-center gap-1">
            <ShieldCheck size={14} />
            <span>۲ نقشه آفلاین آماده استفاده</span>
          </span>

          <button
            onClick={() => {
              alert('نقشه توپوگرافی و فایل مسیریابی GPX با موفقیت بارگیری شد.');
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-xl flex items-center gap-1 transition cursor-pointer"
          >
            <Download size={13} />
            <span>مشاهده نقشه ذخیره شده</span>
          </button>
        </div>

      </div>
    </div>
  );
};
