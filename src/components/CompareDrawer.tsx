import React from 'react';
import {
  X,
  Check,
  Minus,
  Sparkles,
  Ticket,
  Clock,
  MapPin,
  Flame,
  Shield,
  Layers,
  Star,
  Users,
  Compass,
  Plus
} from 'lucide-react';
import { Tour } from '../types';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTours: Tour[];
  allTours: Tour[];
  onRemoveTour: (tourId: string) => void;
  onAddTour: (tour: Tour) => void;
  onSelectBooking: (tour: Tour) => void;
}

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  isOpen,
  onClose,
  selectedTours,
  allTours,
  onRemoveTour,
  onAddTour,
  onSelectBooking
}) => {
  if (!isOpen) return null;

  // Available tours to add
  const availableToAdd = allTours.filter(
    t => !selectedTours.some(st => st.id === t.id)
  );

  return (
    <div role="dialog" aria-modal="true" aria-label="مقایسه تورها" className="fixed inset-0 z-50 flex justify-start bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container (RTL: Slide in from right/left) */}
      <div className="relative w-full max-w-5xl bg-slate-900 text-white h-full shadow-2xl flex flex-col border-l border-slate-800 z-10 overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-[#002f38] border-b border-[#004e5a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#84cc16] text-[#064e3b] font-black flex items-center justify-center">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">مقایسه تخصصی تورهای کمپینگ</h2>
              <p className="text-xs text-emerald-200">
                مقایسه جزییات، تجهیزات، وعده‌های غذایی و درجه سختی انتخاب بهینه ({selectedTours.length} از ۳ تور)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {selectedTours.length === 0 ? (
            <div className="text-center py-16 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Compass size={32} />
              </div>
              <h3 className="text-lg font-black text-white">هیچ توری برای مقایسه انتخاب نشده است!</h3>
              <p className="text-xs text-slate-400 font-medium">
                حداقل ۲ تور را از لیست پایین انتخاب کنید تا ویژگی‌ها، تجهیزات همراه و هزینه‌های آن‌ها را کنار هم مقایسه کنید.
              </p>

              <div className="pt-4 space-y-2">
                <span className="text-xs text-[#84cc16] font-bold block">انتخاب تورها جهت افزودن:</span>
                <div className="grid grid-cols-1 gap-2">
                  {allTours.slice(0, 3).map(tour => (
                    <button
                      key={tour.id}
                      onClick={() => onAddTour(tour)}
                      className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 text-right flex items-center justify-between transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src={tour.image} alt={tour.title} className="w-10 h-10 rounded-xl object-cover" />
                        <div>
                          <span className="font-bold text-xs text-white block">{tour.title}</span>
                          <span className="text-[10px] text-[#84cc16] font-mono">{tour.price}</span>
                        </div>
                      </div>
                      <Plus size={18} className="text-[#84cc16]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Add More Tour Selector Bar */}
              {selectedTours.length < 3 && availableToAdd.length > 0 && (
                <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Plus size={16} className="text-[#84cc16]" />
                    <span>افزودن تور جدید برای مقایسه (تا ۳ تور همزمان):</span>
                  </span>

                  <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                    {availableToAdd.map(tour => (
                      <button
                        key={tour.id}
                        onClick={() => onAddTour(tour)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-[#004e5a] text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer"
                      >
                        <span>+ {tour.title.slice(0, 20)}...</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              <div className="overflow-x-auto border border-slate-800 rounded-3xl bg-slate-950/60 shadow-xl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90">
                      <th className="p-4 w-40 font-black text-slate-400">ویژگی‌ها</th>
                      {selectedTours.map(tour => (
                        <th key={tour.id} className="p-4 min-w-[220px] max-w-[280px] align-top">
                          <div className="space-y-2 relative">
                            <button
                              onClick={() => onRemoveTour(tour.id)}
                              className="absolute top-0 left-0 p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded-full transition cursor-pointer"
                              title="حذف از مقایسه"
                            >
                              <X size={14} />
                            </button>

                            <img
                              src={tour.image}
                              alt={tour.title}
                              className="w-full h-28 rounded-2xl object-cover border border-slate-700"
                            />
                            
                            <h4 className="font-black text-sm text-white leading-snug">{tour.title}</h4>
                            <span className="text-[10px] text-slate-400 font-mono block">{tour.location}</span>

                            <button
                              onClick={() => {
                                onClose();
                                onSelectBooking(tour);
                              }}
                              className="w-full mt-2 bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-black py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 shadow"
                            >
                              <Ticket size={14} />
                              <span>رزرو آنی این تور</span>
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    
                    {/* Row 1: Price & Duration */}
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-400 bg-slate-900/30">قیمت و مدت زمان</td>
                      {selectedTours.map(t => (
                        <td key={t.id} className="p-4">
                          <span className="font-mono font-black text-sm text-[#84cc16] block">{t.price}</span>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{t.duration}</span>
                        </td>
                      ))}
                    </tr>

                    {/* Row 2: Rating */}
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-400 bg-slate-900/30">امتیاز همنوردان</td>
                      {selectedTours.map(t => (
                        <td key={t.id} className="p-4">
                          <div className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                            <Star size={14} className="fill-amber-400" />
                            <span>{t.rating}</span>
                            <span className="text-slate-500 text-[10px]">({t.reviewsCount} دیدگاه)</span>
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Row 3: Included Gear */}
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-400 bg-slate-900/30">تجهیزات همراه کمپ</td>
                      {selectedTours.map(t => (
                        <td key={t.id} className="p-4 space-y-1">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check size={14} /> چادر ضدآب ۲ پوسته
                          </span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check size={14} /> کیسه خواب + زیرانداز
                          </span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check size={14} /> هدلامپ و سیستم روشنایی
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Row 4: Meal Service */}
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-400 bg-slate-900/30">وعده‌های غذایی</td>
                      {selectedTours.map(t => (
                        <td key={t.id} className="p-4 space-y-1">
                          <span className="text-slate-200 block">• ۲ وعده صبحانه سلف سرویس</span>
                          <span className="text-slate-200 block">• ۱ وعده ناهار گرم محلی</span>
                          <span className="text-[#84cc16] font-bold block">• پذیرایی چای زغالی و آتش</span>
                        </td>
                      ))}
                    </tr>

                    {/* Row 5: Transport */}
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-400 bg-slate-900/30">ترانسفر و وسایل نقلیه</td>
                      {selectedTours.map(t => (
                        <td key={t.id} className="p-4">
                          <span className="bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-slate-700">
                            اتوبوس VIP ۲۵ صندلی + نیسان محلی
                          </span>
                        </td>
                      ))}
                    </tr>

                    {/* Row 6: Highlights */}
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-slate-400 bg-slate-900/30">برجستگی‌های سفر</td>
                      {selectedTours.map(t => (
                        <td key={t.id} className="p-4">
                          <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-300">
                            {t.highlights.map((h, idx) => (
                              <li key={idx}>{h}</li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
