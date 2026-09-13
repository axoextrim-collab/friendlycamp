import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sun, CloudRain, CloudFog, Moon, Snowflake, ChevronDown } from 'lucide-react';
import { useDesignSettings } from '../hooks/useDesignSettings';

interface HeroProps {
  onOpenVideo: () => void;
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
  weatherTheme?: string;
  onWeatherChange?: (theme: string) => void;
}

export type WeatherTheme = 'sunny' | 'rainy' | 'misty' | 'starry' | 'snowy';

const WEATHER_PRESETS: { id: WeatherTheme; name: string; temp: string; icon: React.ElementType; bgGradient: string; overlay: string }[] = [
  {
    id: 'rainy',
    name: 'بارانی و طراوت جنگل 🌧️',
    temp: '۱۶°C • نم‌نم باران',
    icon: CloudRain,
    bgGradient: 'from-[#0b1e17]/80 via-[#112e24]/60 to-[#0b1e17]/75',
    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/15 via-transparent to-black/50'
  },
  {
    id: 'sunny',
    name: 'آفتابی و معتدل ☀️',
    temp: '۲۴°C • آفتابی درخشان',
    icon: Sun,
    bgGradient: 'from-amber-950/70 via-emerald-950/45 to-slate-950/75',
    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/20 via-emerald-500/8 to-black/45'
  },
  {
    id: 'misty',
    name: 'مه‌آلود کوهستانی 🌫️',
    temp: '۱۴°C • مه غلیظ',
    icon: CloudFog,
    bgGradient: 'from-slate-900/75 via-teal-950/60 to-slate-950/80',
    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-200/15 via-[#004e5a]/20 to-slate-950/60'
  },
  {
    id: 'starry',
    name: 'شب کویری و ستاره‌باران 🌌',
    temp: '۱۸°C • صاف و پرستاره',
    icon: Moon,
    bgGradient: 'from-indigo-950/80 via-[#002f38]/70 to-slate-950/80',
    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/8 to-black/65'
  },
  {
    id: 'snowy',
    name: 'برفی و قله‌های یخچالی ❄️',
    temp: '-۲°C • برف سبک',
    icon: Snowflake,
    bgGradient: 'from-slate-900/80 via-sky-950/65 to-indigo-950/80',
    overlay: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/20 via-slate-800/15 to-slate-950/70'
  }
];

const HERO_SLIDES = [
  {
    id: 1,
    title: 'جنگل‌های بارانی و مه آلود',
    subtitle: 'تجربه رؤیایی کمپینگ در بکرترین تراکم‌های جنگلی شمال و استوایی',
    gif: '/brand-nature-hero-v2.webp',
    fallbackImage: '/brand-nature-hero-v2.webp',
    location: 'جنگل‌های بارانی و سرسبز • فرندلی کمپ',
    badge: 'اسلاید ۱: جنگل مه آلود'
  },
  {
    id: 2,
    title: 'آبشارهای خروشان در دل جنگل',
    subtitle: 'پیاده‌روی و شب‌مانی در کنار آبشارهای بکر و رودخانه‌های خروشان',
    gif: '/motion/sources/mountain.png',
    fallbackImage: '/motion/sources/mountain.png',
    location: 'مسیر آبشارهای بکر • فرندلی کمپ',
    badge: 'اسلاید ۲: آبشار و رودخانه'
  },
  {
    id: 3,
    title: 'کمپینگ شبانه در جنگل بارانی',
    subtitle: 'شب‌نشینی دور آتش، چادرزنی ایمن و استماع آوای طبیعت و باران',
    gif: '/motion/sources/desert.png',
    fallbackImage: '/motion/sources/desert.png',
    location: 'ایستگاه کمپینگ شبانه • فرندلی کمپ',
    badge: 'اسلاید ۳: کمپینگ شبانه'
  },
  {
    id: 4,
    title: 'قله‌های کوهستانی و طبیعت بکر',
    subtitle: 'لیدرهای مجرب، تجهیزات حرفه‌ای ضدآب و رعایت کامل اصول محیط‌زیستی',
    gif: '/motion/sources/gear.png',
    fallbackImage: '/motion/sources/gear.png',
    location: 'زیست‌بوم‌های ناشناخته • فرندلی کمپ',
    badge: 'اسلاید ۴: کوهستان و طبیعت'
  }
];

export const Hero: React.FC<HeroProps> = ({
  onNavigateSection,
  weatherTheme = 'rainy',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeWeather] = useState<WeatherTheme>((weatherTheme as WeatherTheme) || 'rainy');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [failedSlides, setFailedSlides] = useState<Set<number>>(new Set());
  const designSettings = useDesignSettings();
  const heroSettings = designSettings?.channels.hero;

  const currentPreset = WEATHER_PRESETS.find(p => p.id === activeWeather) || WEATHER_PRESETS[0];

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (heroSettings?.enabled === false || designSettings?.slider.autoplay === false) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, heroSettings?.interval || designSettings?.slider.interval || 4000);
    return () => clearInterval(timer);
  }, [heroSettings?.enabled, heroSettings?.interval, designSettings?.slider.autoplay, designSettings?.slider.interval]);

  useEffect(() => {
    if (reduceMotion) return;
    const nextIndex = (currentSlide + 1) % HERO_SLIDES.length;
    const img = new Image();
    img.src = HERO_SLIDES[nextIndex].gif;
  }, [currentSlide, reduceMotion]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const getSlideSrc = useCallback(
    (slide: (typeof HERO_SLIDES)[number], index: number) => {
      if (reduceMotion || failedSlides.has(index)) return slide.fallbackImage;
      return slide.gif;
    },
    [reduceMotion, failedSlides]
  );

  const handleImageError = (index: number) => {
    setFailedSlides((prev) => new Set(prev).add(index));
  };

  const activeSlideData = HERO_SLIDES[currentSlide];

  return (
    <section id="hero" className="relative w-full h-screen min-h-[600px] overflow-hidden">
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 z-0 bg-[#0b1e17] transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <img
              src={getSlideSrc(slide, index)}
              alt={slide.title}
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={() => handleImageError(index)}
              className="w-full h-full object-cover object-center"
            />
            <div className={`absolute inset-0 bg-gradient-to-t ${currentPreset.bgGradient} transition-all duration-700`} />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-slate-950/50" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60" />
          </div>
        ))}

        <div className={`absolute inset-0 pointer-events-none ${currentPreset.overlay} z-[1] transition-all duration-700`} />

        {/* Live Weather Widget Badge */}
        <div className="absolute top-24 md:top-28 left-4 md:left-8 z-20 bg-slate-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#84cc16] animate-pulse" />
          <span className="text-[#84cc16] font-mono">{currentPreset.temp}</span>
        </div>

        {/* Slide title overlay */}
        <div className="absolute bottom-28 md:bottom-32 inset-x-0 z-20 px-6 md:px-16 text-center pointer-events-none">
          <p className="text-[#f59e0b] text-xs md:text-sm font-black tracking-wider mb-2">{activeSlideData.badge}</p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg leading-tight">
            {activeSlideData.title}
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/80 max-w-2xl mx-auto hidden sm:block">
            {activeSlideData.subtitle}
          </p>
        </div>

        {/* Slide Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-lg bg-black/40 hover:bg-[#f59e0b] hover:text-slate-950 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-xl cursor-pointer"
          aria-label="اسلاید قبلی"
        >
          <ChevronRight size={24} />
        </button>

        <button
          onClick={nextSlide}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-lg bg-black/40 hover:bg-[#f59e0b] hover:text-slate-950 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-xl cursor-pointer"
          aria-label="اسلاید بعدی"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Pagination dots */}
        <div className="absolute bottom-20 md:bottom-24 inset-x-0 z-20 flex items-center justify-center gap-2">
          {HERO_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentSlide
                  ? 'w-8 bg-[#f59e0b]'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`رفتن به ${slide.badge}`}
            />
          ))}
        </div>

        {/* Scroll cue */}
        <button
          onClick={() => onNavigateSection('destinations')}
          className="absolute bottom-6 inset-x-0 z-20 flex flex-col items-center gap-1 text-white/70 hover:text-white transition cursor-pointer group"
          aria-label="اسکرول به پایین"
        >
          <span className="text-xs font-semibold tracking-wide">کاوش مقاصد</span>
          <ChevronDown size={22} className="animate-bounce group-hover:text-[#f59e0b]" />
        </button>
      </div>
    </section>
  );
};
