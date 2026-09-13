import React, { useState } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Copy,
  Check,
  ShieldAlert,
  Radio,
  X,
  Share2,
  ExternalLink,
  MessageSquare,
  Compass,
  HeartPulse,
  Navigation
} from 'lucide-react';

interface SosEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourName?: string;
  locationName?: string;
  coordinates?: string;
  leaderName?: string;
  leaderPhone?: string;
}

export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  isOpen,
  onClose,
  tourName = 'تور کمپینگ کویر کاراکال و رمل‌نوردی',
  locationName = 'یزد، کویر کاراکال، کمپ اصلی فرندلی کمپ',
  coordinates = '31.8974° N, 54.3568° E',
  leaderName = 'استاد امین محمودی',
  leaderPhone = '۰۹۱۲۳۴۵۶۷۸۹'
}) => {
  const [copied, setCopied] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  if (!isOpen) return null;

  const emergencyContacts = [
    {
      title: 'پشتیبانی و لیدر اختصاصی تور (Friendly Camp)',
      number: leaderPhone,
      sub: `لیدر مسئول: ${leaderName}`,
      icon: '⛺',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'امداد و نجات هلال احمر (سراسر کشور)',
      number: '۱۱۲',
      sub: 'پاسخگویی ۲۴ ساعته آفلاین و بدون سیم‌کارت',
      icon: '🚨',
      color: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      title: 'ستاد امداد کوهستان و کویر',
      number: '۱۴۱۲',
      sub: 'تیم تخصصی جستجو و نجات هیئت کوهنوردی',
      icon: '🏔️',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      title: 'اورژانس پزشکی کشور',
      number: '۱۱۵',
      sub: 'فوریت‌های پزشکی و آمبولانس',
      icon: '🚑',
      color: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    },
    {
      title: 'مرکز فرماندهی ۲۴/۷ فرندلی کمپ',
      number: '۰۲۱-۹۱۰۰۸۸۸۸',
      sub: 'پشتیبانی ستادی و ردیابی ماهواره‌ای تیم',
      icon: '📞',
      color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
  ];

  const handleCopyCoordinates = () => {
    const textToCopy = `[SOS - موقعیت اضطراری فرندلی کمپ]\nتور: ${tourName}\nموقعیت: ${locationName}\nمختصات GPS: ${coordinates}\nلیدر: ${leaderName} (${leaderPhone})`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendSosSms = () => {
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-rose-600/80 rounded-3xl shadow-2xl text-right text-slate-100 overflow-hidden my-auto">
        
        {/* Animated Emergency Top Ribbon */}
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-black/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
                  SOS EMERGENCY
                </span>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded font-mono">
                  GPS Active
                </span>
              </div>
              <h3 className="text-lg font-black mt-0.5">پروتکل فوری اعلام وضعیت اضطراری و امداد</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Active GPS Coordinates Box */}
          <div className="bg-rose-950/40 border border-rose-500/40 p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-rose-400 animate-spin-slow" />
                <div>
                  <span className="text-[11px] text-rose-300 font-bold block">موقعیت مکانی و مختصات فعلی کمپ/تور:</span>
                  <span className="text-sm font-black text-white">{tourName}</span>
                </div>
              </div>

              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full font-mono self-start sm:self-auto">
                بروزرسانی لایو
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">منطقه جغرافیایی:</span>
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <MapPin size={13} className="text-rose-400 shrink-0" />
                  <span>{locationName}</span>
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block mb-1">مختصات دقیق (GPS):</span>
                <span className="text-sm font-black text-amber-300">{coordinates}</span>
              </div>
            </div>

            {/* Quick Actions for Location */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleCopyCoordinates}
                className="flex-1 min-w-[160px] bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                <span>{copied ? 'مختصات کپی شد!' : 'کپی متن و مختصات اضطراری'}</span>
              </button>

              <button
                onClick={handleSendSosSms}
                className="flex-1 min-w-[160px] bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Share2 size={16} />
                <span>اشتراک‌گذاری خودکار SMS SOS</span>
              </button>
            </div>

            {smsSent && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <Check size={16} className="text-emerald-400 shrink-0" />
                <span>پیامک حاوی موقعیت GPS و هشدار SOS آماده ارسال به لیدر و شماره‌های اضطراری شد.</span>
              </div>
            )}
          </div>

          {/* Pre-saved Emergency Contact Numbers List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-300 flex items-center gap-2">
              <Radio size={16} className="text-rose-400" />
              <span>شماره‌های امدادی و پشتیبانی پیش‌فرض جهت تماس سریع:</span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{contact.icon}</span>
                    <div>
                      <h5 className="text-xs font-black text-slate-100">{contact.title}</h5>
                      <p className="text-[11px] text-slate-400">{contact.sub}</p>
                    </div>
                  </div>

                  <a
                    href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
                    className={`px-3.5 py-2 rounded-xl border font-mono font-black text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 ${contact.color}`}
                  >
                    <Phone size={14} />
                    <span className="dir-ltr">{contact.number}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Survival Guidance */}
          <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-2xl text-xs text-slate-300 space-y-2">
            <h5 className="font-bold text-amber-300 flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>دستورالعمل‌های حیاتی پناهگیری و بقا در صورت قطعی ارتباط:</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300 leading-relaxed font-medium">
              <li>از محل مشخص‌شده کمپ جدا نشوید؛ در صورت گم شدن، در نقطه مرتفع ماندگار شوید.</li>
              <li>از سوپاپ سوت اضطراری کوله پشتی خود (۳ سوت متوالی با فواصل ۱۰ ثانیه) استفاده کنید.</li>
              <li>در شب با نور مستقیم چراغ پیشانی یا فلش گوشی به صورت کُد SOS (۳ کوتاه، ۳ بلند، ۳ کوتاه) علامت دهید.</li>
              <li>فرکانس بیسیم UHF لیدرهای فرندلی کمپ: <strong className="text-amber-300 font-mono">433.500 MHz (کانال ۵)</strong></li>
            </ul>
          </div>

        </div>

        {/* Footer Close Button */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2 rounded-xl transition cursor-pointer"
          >
            بستن پنجره اضطراری
          </button>
        </div>

      </div>
    </div>
  );
};
