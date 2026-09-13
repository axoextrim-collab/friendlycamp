import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Compass,
  MapPin,
  Eye,
  RotateCcw,
  Sun,
  Moon,
  CloudSun,
  Tent,
  Flame,
  Camera,
  Layers,
  Crosshair,
  Info,
  Maximize2,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Tour } from '../types';

interface ArViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour | null;
}

interface PoiMarker {
  id: string;
  title: string;
  category: 'camp' | 'waterfall' | 'viewpoint' | 'signal' | 'fire';
  x: number; // percentage
  y: number; // percentage
  altitude: string;
  description: string;
}

const TOUR_POIS: Record<string, PoiMarker[]> = {
  default: [
    {
      id: 'p1',
      title: 'محل اصلی کمپ اختصاصی فرندلی',
      category: 'camp',
      x: 48,
      y: 52,
      altitude: '۱,۸۲۰ متر',
      description: 'منطقه هموار و سرسبز با برپایی چادرهای دوجداره کله‌گاوی و سایبان مرکزی'
    },
    {
      id: 'p2',
      title: 'حوضچه آبشار پنهان',
      category: 'waterfall',
      x: 22,
      y: 65,
      altitude: '۱,۷۴۰ متر',
      description: 'آب زلال کوهستانی مناسب عکاسی و شنای تابستانی سبک'
    },
    {
      id: 'p3',
      title: 'نقطه رصد غروب و طلوع ابرها',
      category: 'viewpoint',
      x: 75,
      y: 32,
      altitude: '۱,۹۸۰ متر',
      description: 'پدیده‌ی اقیانوس ابرها و دید ۳۶۰ درجه به دامنه‌های اسالم و تالش'
    },
    {
      id: 'p4',
      title: 'جایگاه شب‌نشینی دور آتش',
      category: 'fire',
      x: 55,
      y: 62,
      altitude: '۱,۸۲۵ متر',
      description: 'برپایی هیزم، چای زغالی و سیب‌زمینی آتشی در امنیت کامل'
    },
    {
      id: 'p5',
      title: 'آخرین نقطه آنتن‌دهی همراه اول',
      category: 'signal',
      x: 88,
      y: 20,
      altitude: '۲,۰۵۰ متر',
      description: 'امکان تماس اضطراری و ارسال آخرین پیام به خانواده'
    }
  ]
};

export const ArViewModal: React.FC<ArViewModalProps> = ({ isOpen, onClose, tour }) => {
  const [rotationX, setRotationX] = useState<number>(10);
  const [rotationY, setRotationY] = useState<number>(-5);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('sunset');
  const [selectedPoi, setSelectedPoi] = useState<PoiMarker | null>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const currentTourName = tour?.title || 'طبیعت بکر فرندلی کمپ';
  const tourImage = tour?.image || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1600';
  const pois = TOUR_POIS.default;

  // Handle Interactive Drag / Mouse Move 3D perspective effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const rotY = (x / (rect.width / 2)) * 18; // -18 to +18 deg
    const rotX = -(y / (rect.height / 2)) * 14; // -14 to +14 deg

    setRotationY(rotY);
    setRotationX(rotX);
  };

  const handleResetPerspective = () => {
    setRotationX(5);
    setRotationY(0);
    setZoomLevel(1);
  };

  // Atmosphere filter classes
  const getFilterStyle = () => {
    if (timeOfDay === 'sunset') return 'sepia-[0.35] contrast-110 brightness-95 saturate-125 hue-rotate-[-10deg]';
    if (timeOfDay === 'night') return 'brightness-60 contrast-125 hue-rotate-[180deg] invert-[0.15]';
    return 'brightness-105 contrast-105 saturate-110';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in">
      
      {/* Modal Container */}
      <div className="bg-slate-900 text-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden relative">
        
        {/* Top AR View Header */}
        <div className="p-4 bg-[#002f38] border-b border-[#004e5a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#84cc16] text-[#064e3b] font-black flex items-center justify-center shadow-lg">
              <Eye size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">نمایه واقعیت افزوده ۳D (AR View Simulator)</h2>
                <span className="bg-emerald-500/20 text-[#84cc16] border border-[#84cc16]/40 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={11} /> 3D Perspective
                </span>
              </div>
              <p className="text-xs text-emerald-200">
                پیش‌نمایش زنده ۳D مقصد «{currentTourName}» با علامت‌گذاری نقاط مهم کمپ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetPerspective}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="بازنشانی زاویه ۳D"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">بازنشانی دید</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* AR Controls Bar */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
          
          {/* Time of Day Simulation Toggles */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold text-[11px]">اتمسفر زمانی:</span>
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setTimeOfDay('day')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  timeOfDay === 'day' ? 'bg-[#84cc16] text-[#064e3b]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Sun size={13} />
                <span>روز آفتابی</span>
              </button>
              <button
                onClick={() => setTimeOfDay('sunset')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  timeOfDay === 'sunset' ? 'bg-[#84cc16] text-[#064e3b]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <CloudSun size={13} />
                <span>غروب طلایی</span>
              </button>
              <button
                onClick={() => setTimeOfDay('night')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  timeOfDay === 'night' ? 'bg-[#84cc16] text-[#064e3b]' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Moon size={13} />
                <span>شب ستاره‌باران</span>
              </button>
            </div>
          </div>

          {/* Camera Grid & AR Overlay Toggles */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
                showGrid
                  ? 'bg-emerald-950/80 border-[#84cc16] text-[#84cc16]'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Crosshair size={14} />
              <span>شبکه AR و قطب‌نما</span>
            </button>

            {/* Zoom slider */}
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
              <span className="text-slate-400 text-[10px] font-mono">زوم:</span>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-20 accent-[#84cc16] cursor-pointer"
              />
              <span className="text-[#84cc16] font-mono font-bold text-[10px]">{Math.round(zoomLevel * 100)}%</span>
            </div>
          </div>

        </div>

        {/* Main AR Stage Canvas Area */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          className="flex-1 relative overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing select-none min-h-[380px] sm:min-h-[460px] flex items-center justify-center p-4"
          style={{ perspective: '1100px' }}
        >
          {/* Camera Viewfinder Overlay (HUD) */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6">
              
              {/* Top HUD Telemetry */}
              <div className="flex items-center justify-between font-mono text-[11px] text-[#84cc16] font-bold bg-slate-950/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="animate-spin text-amber-400" />
                  <span>324° NW • شمال غربی</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>ارتفاع: ۱,۸۲۰ متر</span>
                  <span>شیب: ۱۲٪</span>
                  <span>دما: ۱۶°C</span>
                </div>
              </div>

              {/* Center Target Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 border-2 border-dashed border-[#84cc16]/40 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-2 h-2 bg-[#84cc16] rounded-full" />
                </div>
              </div>

              {/* Bottom HUD Legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <span>ماوس را روی تصویر حرکت دهید تا دید ۳D تغیر کند.</span>
                <span className="text-[#84cc16] font-bold">فرندلی کمپ AR Live Engine</span>
              </div>
            </div>
          )}

          {/* 3D Transform Wrapper Container */}
          <div
            className="relative w-full h-full max-w-4xl max-h-[420px] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 transition-transform duration-150 ease-out"
            style={{
              transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${zoomLevel})`,
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Background Image with Atmosphere Filter */}
            <img
              src={tourImage}
              alt={currentTourName}
              className={`w-full h-full object-cover transition duration-700 ${getFilterStyle()}`}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30" />

            {/* POI Markers Overlay */}
            {pois.map((poi) => {
              const isSelected = selectedPoi?.id === poi.id;
              return (
                <div
                  key={poi.id}
                  onClick={() => setSelectedPoi(poi)}
                  style={{ top: `${poi.y}%`, left: `${poi.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-pointer group"
                >
                  {/* Pulse Ring */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-8 h-8 rounded-full bg-[#84cc16]/40 animate-ping" />
                    <button
                      className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-2xl transition duration-300 ${
                        isSelected
                          ? 'bg-[#84cc16] text-[#064e3b] border-white scale-125'
                          : 'bg-slate-950/90 text-[#84cc16] border-[#84cc16] hover:scale-110'
                      }`}
                    >
                      {poi.category === 'camp' && <Tent size={16} />}
                      {poi.category === 'fire' && <Flame size={16} />}
                      {poi.category === 'waterfall' && <Sparkles size={16} />}
                      {poi.category === 'viewpoint' && <Eye size={16} />}
                      {poi.category === 'signal' && <MapPin size={16} />}
                    </button>
                  </div>

                  {/* POI Label Badge */}
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-xl border border-white/20 whitespace-nowrap shadow-xl pointer-events-none group-hover:scale-105 transition">
                    <span className="text-[#84cc16] block">{poi.title}</span>
                    <span className="text-[9px] text-slate-400 font-mono block">{poi.altitude}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected POI Details Popup Drawer */}
          {selectedPoi && (
            <div className="absolute bottom-4 right-4 left-4 sm:right-auto sm:max-w-md z-40 bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-[#84cc16] shadow-2xl space-y-2 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-[#84cc16]">
                  <CheckCircle2 size={16} />
                  <h4 className="font-black text-xs text-white">{selectedPoi.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedPoi(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {selectedPoi.description}
              </p>

              <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-emerald-400">
                <span>موقعیت ارتفاعی: {selectedPoi.altitude}</span>
                <span className="bg-[#004e5a] text-white px-2 py-0.5 rounded-full font-sans font-bold">
                  تاییدشده لیدر
                </span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
