import React, { useState } from 'react';
import { TOUR_MAPS_DATA, MapPOI } from '../data/extendedData';
import { POPULAR_TOURS } from '../data/mockData';
import { Tour } from '../types';
import { MapPin, Navigation, Compass, Layers, Info, Check, Clock, Sparkles } from 'lucide-react';

interface InteractiveTourMapProps {
  selectedTourId?: string;
  onSelectTour?: (tour: Tour) => void;
}

export const InteractiveTourMap: React.FC<InteractiveTourMapProps> = ({
  selectedTourId = 'tour-1',
  onSelectTour
}) => {
  const [activeTourId, setActiveTourId] = useState<string>(selectedTourId);
  const [activePoi, setActivePoi] = useState<MapPOI | null>(null);

  const currentMap = TOUR_MAPS_DATA[activeTourId] || TOUR_MAPS_DATA['tour-1'];
  const currentTourObj = POPULAR_TOURS.find((t) => t.id === activeTourId) || POPULAR_TOURS[0];

  const handleTourTabChange = (tourId: string) => {
    setActiveTourId(tourId);
    setActivePoi(null);
  };

  // Generate SVG path points between POIs
  const pathD = currentMap.pois.reduce((acc, poi, idx) => {
    if (idx === 0) return `M ${poi.x} ${poi.y}`;
    // curved bezier control line
    const prevPoi = currentMap.pois[idx - 1];
    const cx = (prevPoi.x + poi.x) / 2 + (idx % 2 === 0 ? 8 : -8);
    const cy = (prevPoi.y + poi.y) / 2 + (idx % 2 === 0 ? -10 : 10);
    return `${acc} Q ${cx} ${cy} ${poi.x} ${poi.y}`;
  }, '');

  return (
    <div className="bg-slate-900 rounded-xl p-6 md:p-8 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
      
      {/* Decorative Gradient Background Glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#14382c]/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Tabs */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#f59e0b] mb-1">
            <Compass size={16} className="animate-spin-slow" />
            <span>نقشه تعاملی نقاط دیدنی و مسیر تور</span>
          </div>
          <h3 className="text-2xl font-black text-white">
            نقشه مسیر ایستگاه‌های {currentMap.tourTitle}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            روی نشانگرهای روی نقشه کلیک کنید تا جاذبه‌ها و ایستگاه‌های گردشگری این تور را مشاهده کنید.
          </p>
        </div>

        {/* Tour Selection Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          {POPULAR_TOURS.map((tour) => {
            const isActive = tour.id === activeTourId;
            return (
              <button
                key={tour.id}
                onClick={() => handleTourTabChange(tour.id)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#84cc16] text-[#064e3b] shadow-lg scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <MapPin size={14} />
                <span>{tour.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Interactive Map Stage + POI Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative z-10">
        
        {/* SVG Interactive Map Container (col-span-7) */}
        <div className="lg:col-span-7 relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 min-h-[380px] sm:min-h-[440px] flex items-center justify-center shadow-inner group">
          
          {/* Map Region Canvas Styling */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#a3e635_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* SVG Vector Path Map */}
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full text-[#84cc16] pointer-events-none"
            preserveAspectRatio="none"
          >
            {/* Route Line Trail */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(132, 204, 22, 0.4)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              className="animate-pulse"
            />
            <path
              d={pathD}
              fill="none"
              stroke="#a3e635"
              strokeWidth="0.8"
            />
          </svg>

          {/* Interactive POI Pin Markers */}
          {currentMap.pois.map((poi, index) => {
            const isSelected = activePoi?.id === poi.id;
            return (
              <div
                key={poi.id}
                style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group/pin"
                onClick={() => setActivePoi(poi)}
              >
                {/* Pulsing Aura Effect */}
                <div
                  className={`absolute inset-0 rounded-full animate-ping ${
                    isSelected ? 'bg-amber-400 opacity-75' : 'bg-[#84cc16] opacity-40'
                  }`}
                  style={{ animationDuration: '2s' }}
                />

                {/* Marker Button */}
                <button
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs shadow-2xl border-2 transition-transform duration-300 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-white scale-125 ring-4 ring-amber-400/30'
                      : 'bg-[#004e5a] text-[#a3e635] border-[#84cc16] hover:scale-115 hover:bg-[#84cc16] hover:text-[#064e3b]'
                  }`}
                  title={poi.title}
                >
                  <span>{index + 1}</span>
                </button>

                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900/95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition pointer-events-none shadow-xl z-30">
                  {poi.title}
                </div>
              </div>
            );
          })}

          {/* Map Compass Badge */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Navigation size={14} className="text-[#a3e635] rotate-45" />
            <span>راهنمای مسیریابی تور</span>
          </div>

          {/* Region Label */}
          <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-slate-800 text-xs font-black text-[#a3e635] flex items-center gap-2">
            <Layers size={14} />
            <span>منطقه: {currentMap.regionName}</span>
          </div>

        </div>

        {/* POI Info Details Panel (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/70 p-6 rounded-3xl border border-slate-800">
          {activePoi ? (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              
              <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-800">
                <img
                  src={activePoi.image}
                  alt={activePoi.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full shadow">
                  {activePoi.category}
                </span>
                <span className="absolute bottom-3 right-3 text-xs font-bold text-slate-200 flex items-center gap-1">
                  <Clock size={13} className="text-[#a3e635]" />
                  <span>{activePoi.timeEst}</span>
                </span>
              </div>

              <div>
                <h4 className="text-xl font-black text-white mb-2">{activePoi.title}</h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {activePoi.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">موقعیت روی نقشه: مشخص شده</span>
                <button
                  onClick={() => {
                    if (onSelectTour) onSelectTour(currentTourObj);
                  }}
                  className="bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-extrabold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>رزرو این تور</span>
                  <Sparkles size={14} />
                </button>
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-[#a3e635] flex items-center justify-center shadow-lg">
                <MapPin size={32} className="animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">یک ایستگاه را انتخاب کنید</h4>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
                  روی شماره‌های ۱، ۲، ۳... روی نقشه کلیک کنید تا تصویر و جزئیات برنامه‌ریزی هر ایستگاه تور را مشاهده کنید.
                </p>
              </div>
              
              {/* List of stops for quick click */}
              <div className="w-full flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-bold text-amber-400 text-right">فهرست سریع جاذبه‌های تور:</span>
                {currentMap.pois.map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePoi(p)}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-[#004e5a] text-right text-xs font-bold text-slate-200 hover:text-white transition border border-slate-800 flex items-center justify-between cursor-pointer"
                  >
                    <span>{idx + 1}. {p.title}</span>
                    <Info size={14} className="text-[#a3e635]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
