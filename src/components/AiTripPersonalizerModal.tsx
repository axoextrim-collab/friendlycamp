import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Calendar,
  Compass,
  CheckSquare,
  Copy,
  Check,
  Printer,
  Share2,
  DollarSign,
  Tent,
  TreePine,
  Sun,
  Flame,
  Bot,
  MapPin,
  Navigation,
  Layers,
  Info,
  Mountain,
  Award
} from 'lucide-react';
import { Tour } from '../types';

interface AiTripPersonalizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBooking?: (tour: Tour) => void;
  allTours: Tour[];
}

interface Waypoint {
  id: string;
  name: string;
  type: 'start' | 'camp' | 'scenic' | 'summit' | 'end';
  coord: string;
  elevation: string;
  description: string;
  icon: string;
  x: number; // percentage on map canvas
  y: number;
}

const SAMPLE_WAYPOINTS: Waypoint[] = [
  { id: 'w1', name: '۱. مبدأ حرکت (تهران - آزادی)', type: 'start', coord: '35.6997° N, 51.3380° E', elevation: '۱,۱۹۰ متر', description: 'حرکت با اتوبوس VIP و تحویل پک پذیرایی', icon: '🚌', x: 12, y: 75 },
  { id: 'w2', name: '۲. ایستگاه میان‌راهی رودبار', type: 'scenic', coord: '36.8115° N, 49.4211° E', elevation: '۲۵۰ متر', description: 'توقف صبحانه محلی، زیتون‌چینی و استراحت', icon: '🫒', x: 35, y: 55 },
  { id: 'w3', name: '۳. کمپ اصلی نئور و جنگل', type: 'camp', coord: '37.9812° N, 48.5501° E', elevation: '۲,۵۰۰ متر', description: 'برپایی چادرهای دوبل، آتش هیزمی و کارگاه نجوم', icon: '⛺', x: 62, y: 35 },
  { id: 'w4', name: '۴. قله و چشم‌انداز ییلاقی', type: 'summit', coord: '38.0120° N, 48.6102° E', elevation: '۲,۹۵۰ متر', description: 'پیمایش سبک ۲ ساعته، تماشای طلوع و اقیانوس ابر', icon: '🏔️', x: 85, y: 22 },
];

export const AiTripPersonalizerModal: React.FC<AiTripPersonalizerModalProps> = ({
  isOpen,
  onClose,
  onSelectBooking,
  allTours
}) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Interactive Route Map States
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint>(SAMPLE_WAYPOINTS[2]);
  const [mapStyle, setMapStyle] = useState<'topo' | 'satellite' | 'hybrid'>('topo');

  if (!isOpen) return null;

  const handleGenerate = async (textToUse?: string) => {
    const promptText = textToUse || userInput;
    if (!promptText.trim()) return;

    setIsLoading(true);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/gemini/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'personalizer',
          additionalPrompt: promptText,
          tourName: promptText.slice(0, 30)
        })
      });

      const data = await res.json();
      if (data && data.text) {
        setGeneratedResult(data.text);
      } else {
        setGeneratedResult('خطا در ارتباط با سرور هوش مصنوعی.');
      }
    } catch (err) {
      console.error('Personalizer error:', err);
      setGeneratedResult('خطایی رخ داد. لطفا مجددا تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presetChips = [
    '🌲 ۳ روز کمپینگ جنگل‌های شمال با چای زغالی و پیمایش سبک',
    '🏜️ سفر ۲ روزه به کویر یزد با رمل‌نوردی و رصد نجومی',
    '🏞️ پیمایش آبشار و خنکای کوهستان ویژه آخر هفته با دوستان',
    '👨‍👩‍👧 کمپینگ خانوادگی دنج همراه با کودکان و تجهیزات کامل'
  ];

  return (
    <div role="dialog" aria-modal="true" aria-label="برنامه‌ریز هوشمند سفر" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      
      {/* Modal Container */}
      <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#002f38] via-[#004e5a] to-[#002f38] border-b border-[#004e5a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#84cc16] text-[#064e3b] font-black flex items-center justify-center shadow-lg">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>برنامه‌ریز هوشمند سفر رویایی (AI Trip Personalizer)</span>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 px-2.5 py-0.5 rounded-full">
                  Gemini 3.6
                </span>
              </h2>
              <p className="text-xs text-emerald-200">
                سفر دلخواهت رو به زبان ساده توصیف کن، هوش مصنوعی نقشه تعاملی، مسیر سفارشی، زمان‌بندی و چک‌لیست رو می‌سازه!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          
          {/* Prompt Input Form */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              توصیف سفر رویایی شما (تعداد روز، نوع مقصد، همراهان، سلیقه و بودجه):
            </label>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="مثلا: می‌خوام با ۳ تا از دوستام آخر هفته بریم یه جای خنک با رودخونه و پیاده‌روی سبک، تجهیزات کمپ نداریم و می‌خوایم وعده‌های غذایی گرم با لیدر باشه..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#84cc16] transition"
              />

              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading || !userInput.trim()}
                className="absolute bottom-3 left-3 bg-[#84cc16] hover:bg-[#a3e635] disabled:opacity-50 text-[#064e3b] font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>در حال تحلیل هوش مصنوعی...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>تولید برنامه و نقشه سفر</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-bold block">پیشنهادهای آماده:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {presetChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUserInput(chip);
                      handleGenerate(chip);
                    }}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-[#004e5a] text-slate-200 hover:text-white rounded-xl text-[11px] font-bold shrink-0 transition cursor-pointer border border-slate-600"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Route Map Component */}
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-[#84cc16]" />
                <h3 className="font-black text-sm text-white">نقشه تعاملی مسیر و مقاصد پیشنهادی سفر (GPS Interactive Route)</h3>
              </div>

              {/* Map Layer Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                <button
                  onClick={() => setMapStyle('topo')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    mapStyle === 'topo' ? 'bg-[#84cc16] text-[#064e3b] font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  توپوگرافی
                </button>
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    mapStyle === 'satellite' ? 'bg-[#84cc16] text-[#064e3b] font-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ماهواره‌ای
                </button>
              </div>
            </div>

            {/* Canvas/SVG Vector Route Map Box */}
            <div className="relative w-full h-64 sm:h-80 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
              
              {/* Map Background Pattern Simulation */}
              <div
                className={`absolute inset-0 transition-opacity duration-500 opacity-30 ${
                  mapStyle === 'satellite'
                    ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-900'
                    : 'bg-[radial-gradient(#004e5a_1px,transparent_1px)] [background-size:24px_24px] bg-[#022c33]'
                }`}
              />

              {/* Animated Vector Route Line SVG */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#84cc16" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>

                {/* Background Shadow Polyline */}
                <path
                  d="M 12% 75% Q 25% 65%, 35% 55% T 62% 35% T 85% 22%"
                  fill="none"
                  stroke="#000000"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.5"
                />

                {/* Main Glowing Route Polyline */}
                <path
                  d="M 12% 75% Q 25% 65%, 35% 55% T 62% 35% T 85% 22%"
                  fill="none"
                  stroke="url(#routeGrad)"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  className="animate-pulse"
                />
              </svg>

              {/* Map Waypoint Pins */}
              {SAMPLE_WAYPOINTS.map((wp) => {
                const isSelected = selectedWaypoint.id === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => setSelectedWaypoint(wp)}
                    style={{ left: `${wp.x}%`, top: `${wp.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group/pin transition-all duration-300 cursor-pointer ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    {/* Ripple Halo */}
                    {isSelected && (
                      <div className="absolute inset-0 -m-3 rounded-full bg-[#84cc16]/40 animate-ping" />
                    )}

                    {/* Pin Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-2xl border flex items-center gap-1.5 shadow-xl text-[11px] font-black ${
                        isSelected
                          ? 'bg-[#84cc16] text-[#064e3b] border-white ring-2 ring-[#84cc16]/50'
                          : 'bg-slate-900/90 text-white border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-sm">{wp.icon}</span>
                      <span className="hidden sm:inline whitespace-nowrap">{wp.name}</span>
                    </div>
                  </button>
                );
              })}

              {/* Waypoint Active Details Overlay Card */}
              {selectedWaypoint && (
                <div className="absolute bottom-3 right-3 left-3 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#004e5a] text-[#84cc16] font-black text-xl flex items-center justify-center shrink-0 border border-[#003843]">
                      {selectedWaypoint.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-sm">{selectedWaypoint.name}</span>
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md">
                          ارتفاع: {selectedWaypoint.elevation}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] font-medium mt-0.5">
                        {selectedWaypoint.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 font-mono text-[10px] text-slate-400 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                    <MapPin size={12} className="text-[#84cc16]" />
                    <span>{selectedWaypoint.coord}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Interactive Elevation Profile Bar */}
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                <Mountain size={14} className="text-amber-400" />
                <span>پروفایل شیب و ارتفاع مسیر:</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">شروع: ۱,۱۹۰ م ← حداکثر: ۲,۹۵۰ م ← کمپ: ۲,۵۰۰ م</span>
            </div>
          </div>

          {/* Generated Result Output Box */}
          {generatedResult && (
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-[#84cc16]">
                  <Bot size={20} />
                  <h3 className="font-black text-sm text-white">برنامه سفر تولید شده توسط هوش مصنوعی</h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    <span>{copied ? 'کپی شد' : 'کپی متن'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer size={14} />
                    <span>چاپ / ذخیره PDF</span>
                  </button>
                </div>
              </div>

              {/* Render AI Result Markdown */}
              <div className="prose prose-invert prose-emerald text-xs leading-relaxed text-slate-200 whitespace-pre-line font-medium">
                {generatedResult}
              </div>

              {/* Quick Matching Tour Booking Banner */}
              <div className="p-4 bg-gradient-to-r from-[#003843] to-[#004e5a] rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <span className="text-[10px] bg-[#84cc16] text-[#064e3b] font-black px-2.5 py-0.5 rounded-full">
                    پیشنهاد منطبق فرندلی کمپ
                  </span>
                  <h4 className="font-black text-sm text-white mt-1">
                    «تور کمپینگ جنگل‌های اسالم و تالش (۳ روزه)»
                  </h4>
                  <p className="text-xs text-emerald-200 font-medium mt-0.5">
                    منطبق‌ترین تور با ترانسفر VIP، تجهیزات کامل چادر و وعده‌های محلی
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (onSelectBooking && allTours.length > 0) {
                      onSelectBooking(allTours[0]);
                    }
                  }}
                  className="bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-black text-xs px-5 py-3 rounded-xl transition cursor-pointer shrink-0 shadow-lg"
                >
                  رزرو آنی این تور
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
