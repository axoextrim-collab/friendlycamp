import React, { useState } from 'react';
import { POPULAR_DESTINATIONS } from '../data/mockData';
import { Destination } from '../types';
import { ChevronRight, ChevronLeft, MapPin, Compass, ArrowUpLeft, Palette, Eye, Sparkles, Sun } from 'lucide-react';

interface PopularDestinationsProps {
  onSelectDestination: (destination: Destination) => void;
}

type FilterMode = 'natural' | 'sepia' | 'grayscale' | 'warm';

export const PopularDestinations: React.FC<PopularDestinationsProps> = ({
  onSelectDestination
}) => {
  const [startIndex, setStartIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<FilterMode>('natural');

  const visibleCount = 4;
  const total = POPULAR_DESTINATIONS.length;

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 1) % total);
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev - 1 + total) % total);
  };

  // Reorder items according to startIndex for smooth circular sliding
  const displayedDestinations = [
    ...POPULAR_DESTINATIONS.slice(startIndex),
    ...POPULAR_DESTINATIONS.slice(0, startIndex)
  ].slice(0, visibleCount);

  // CSS Filter styles
  const getFilterStyle = (): React.CSSProperties => {
    switch (activeFilter) {
      case 'sepia':
        return { filter: 'sepia(0.8) contrast(1.1) saturate(1.2)' };
      case 'grayscale':
        return { filter: 'grayscale(1) contrast(1.15) brightness(0.95)' };
      case 'warm':
        return { filter: 'hue-rotate(-20deg) saturate(1.4) contrast(1.05)' };
      case 'natural':
      default:
        return { filter: 'none' };
    }
  };

  const filterButtons: { id: FilterMode; label: string; icon: React.ReactNode }[] = [
    { id: 'natural', label: 'طبیعی (Natural)', icon: <Eye size={14} /> },
    { id: 'sepia', label: 'سپیا (Sepia)', icon: <Palette size={14} /> },
    { id: 'grayscale', label: 'سیاه و سفید (B&W)', icon: <Sparkles size={14} /> },
    { id: 'warm', label: 'غروب طلایی (Warm)', icon: <Sun size={14} /> }
  ];

  return (
    <section id="destinations" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
        <div className="text-center md:text-right">
          <h2 className="text-3xl md:text-5xl font-black text-[#14382c] mb-3">
            مقصد <span className="text-amber-500">محبوب</span>
          </h2>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl font-medium">
            مقاصدی که ارزش گشت و گذار دارند! در اینجا چند مکان محبوب را معرفی می‌کنیم
          </p>
        </div>

        {/* Slider Navigation Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={prevSlide}
            className="w-12 h-12 rounded-full border-2 border-[#14382c] text-[#14382c] hover:bg-[#14382c] hover:text-white transition flex items-center justify-center cursor-pointer shadow-sm"
            aria-label="قبلی"
            id="destinations-prev-btn"
          >
            <ChevronRight size={22} />
          </button>
          <button
            onClick={nextSlide}
            className="w-12 h-12 rounded-full bg-[#14382c] text-white hover:bg-[#f59e0b] hover:text-slate-950 transition flex items-center justify-center cursor-pointer shadow-md"
            aria-label="بعدی"
            id="destinations-next-btn"
          >
            <ChevronLeft size={22} />
          </button>
        </div>
      </div>



      {/* Destinations Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayedDestinations.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectDestination(item)}
            className="group relative h-[380px] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-slate-100 bg-white flex flex-col justify-end"
          >
            {/* Card Background Image with CSS Filter Toggle applied */}
            <img
              src={item.image}
              alt={item.title}
              style={getFilterStyle()}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

            {/* Country & Weather Badge */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#004e5a] shadow-md flex items-center gap-1">
                <MapPin size={13} className="text-amber-500" />
                <span>{item.country}</span>
              </div>
              <div className="bg-slate-950/80 backdrop-blur-md text-[#84cc16] px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shadow-md border border-white/10">
                🌧️ ۱۸°C
              </div>
            </div>

            {/* Rating badge */}
            <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-md text-slate-950 px-2.5 py-1 rounded-full text-[11px] font-black shadow-md">
              ★ {item.rating || 4.9}
            </div>

            {/* Card Bottom Content */}
            <div className="relative z-10 p-6 text-white flex flex-col gap-2">
              <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                <Compass size={14} />
                <span>{item.toursCount} تور فعال</span>
              </span>

              <h3 className="text-xl font-bold group-hover:text-[#a3e635] transition duration-200">
                {item.title}
              </h3>

              <div className="flex items-center justify-between pt-2 border-t border-white/20 mt-1">
                <span className="text-xs text-white/80 font-medium">از {item.price}</span>
                <span className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-[#84cc16] group-hover:text-[#064e3b] transition flex items-center justify-center text-white">
                  <ArrowUpLeft size={16} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
