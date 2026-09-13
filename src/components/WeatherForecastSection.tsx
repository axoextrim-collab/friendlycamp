import React, { useState } from 'react';
import { WEATHER_DATA, WeatherInfo } from '../data/extendedData';
import { Sun, CloudSun, CloudRain, Wind, Thermometer, Droplets, ShieldAlert, Sparkles, MapPin, Compass } from 'lucide-react';

export const WeatherForecastSection: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('tour-1');

  const locationsList = [
    { id: 'tour-1', label: 'جزیره بالی (اندونزی)' },
    { id: 'tour-2', label: 'توکیو سیتی (ژاپن)' },
    { id: 'tour-3', label: 'کوهستان آلپ (سوئیس)' },
    { id: 'vietnam', label: 'خلیج هالونگ (ویتنام)' }
  ];

  const currentWeather: WeatherInfo = WEATHER_DATA[selectedLocation] || WEATHER_DATA['tour-1'];

  const getWeatherIcon = (iconName: string, className = "w-8 h-8") => {
    switch (iconName) {
      case 'Sun':
        return <Sun className={`${className} text-amber-400 fill-amber-400/20`} />;
      case 'CloudSun':
        return <CloudSun className={`${className} text-amber-300`} />;
      case 'CloudRain':
        return <CloudRain className={`${className} text-cyan-400`} />;
      case 'Wind':
        return <Wind className={`${className} text-teal-300`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  return (
    <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-[#044e42] text-white rounded-xl p-6 md:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        
        {/* Decorative Background Effects */}
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-[#f59e0b]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/15">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold mb-2 border border-[#f59e0b]/30">
              <Thermometer size={14} />
              <span>پیش‌بینی و وضعیت آب‌وهوای مقصدها</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              هواشناسی سفر: <span className="text-[#f59e0b]">آب‌وهوای لایو مقاصد کمپینگ</span>
            </h3>
          </div>

          {/* Location Picker Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-white/10 p-1.5 rounded-lg border border-white/10">
            {locationsList.map((loc) => {
              const isActive = loc.id === selectedLocation;
              return (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#84cc16] text-[#064e3b] shadow-lg scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <MapPin size={13} />
                  <span>{loc.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Weather Card Display */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Current Weather Highlights (col-span-7) */}
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-white/15 flex flex-col gap-6 shadow-xl">
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-300 font-extrabold uppercase tracking-wider block">
                  {currentWeather.country}
                </span>
                <h4 className="text-3xl font-black text-white">{currentWeather.locationName}</h4>
                <span className="text-xs text-emerald-100/80 font-medium mt-1 block">
                  وضعیت فعلی: {currentWeather.condition}
                </span>
              </div>

              {/* Huge Icon + Temp */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-inner">
                  {getWeatherIcon(currentWeather.iconName, "w-10 h-10")}
                </div>
                <div className="text-right">
                  <span className="text-4xl sm:text-5xl font-black text-[#a3e635] dir-ltr inline-block font-mono">
                    {currentWeather.temp}°C
                  </span>
                  <span className="text-[11px] text-white/70 block">احساس واقعی: {currentWeather.feelsLike}°C</span>
                </div>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10 text-center">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <Droplets size={18} className="text-cyan-300 mx-auto mb-1" />
                <span className="text-[10px] text-white/70 block">رطوبت هوا</span>
                <span className="text-sm font-black text-white dir-ltr inline-block font-mono">{currentWeather.humidity}%</span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <Wind size={18} className="text-teal-300 mx-auto mb-1" />
                <span className="text-[10px] text-white/70 block">سرعت باد</span>
                <span className="text-sm font-black text-white dir-ltr inline-block font-mono">{currentWeather.windSpeed} km/h</span>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <Sun size={18} className="text-amber-400 mx-auto mb-1" />
                <span className="text-[10px] text-white/70 block">شاخص UV</span>
                <span className="text-sm font-black text-amber-300 dir-ltr inline-block font-mono">{currentWeather.uvIndex} / 10</span>
              </div>
            </div>

            {/* Travel Tip */}
            <div className="bg-[#84cc16]/20 border border-[#84cc16]/30 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-100 font-bold">
              <Sparkles size={20} className="text-[#a3e635] shrink-0" />
              <span>پیشنهاد سفر فرندلی کمپ: {currentWeather.tip}</span>
            </div>

          </div>

          {/* 3-Day Forecast Cards (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h5 className="font-extrabold text-sm text-amber-300 mb-1 flex items-center gap-2">
              <Compass size={16} />
              <span>پیش‌بینی ۳ روز آینده این مقصد:</span>
            </h5>

            {currentWeather.forecast.map((f, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    {getWeatherIcon(f.iconName, "w-6 h-6")}
                  </div>
                  <div>
                    <h6 className="font-bold text-white text-xs">{f.day}</h6>
                    <span className="text-[11px] text-emerald-100/70 font-medium">{f.condition}</span>
                  </div>
                </div>

                <span className="text-base font-black text-[#a3e635] font-mono dir-ltr">
                  {f.temp}°C
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
