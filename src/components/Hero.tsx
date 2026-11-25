import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, MapPin } from 'lucide-react';
import { useDesignSettings } from '../hooks/useDesignSettings';

interface HeroProps {
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
}

const HERO_SLIDES = [
  {
    id: 'masal',
    title: 'ماسال؛ یک نفس زندگی',
    subtitle: 'میان سبزی ییلاق‌ها و آرامش کوه‌های گیلان، ایران را دوباره کشف کن.',
    image: '/images/iran/masal.webp',
    alt: 'چشم‌انداز سرسبز ییلاقات ماسال در استان گیلان، ایران',
    location: 'ماسال، گیلان',
    accent: '#e3ffc5',
    position: 'center 48%',
    photographer: 'Rasool abbasi17',
    source: 'https://commons.wikimedia.org/wiki/File:طبیعت_زیبای_ییلاقات_ماسال.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    id: 'hormuz',
    title: 'هرمز؛ جزیره‌ای از رنگ',
    subtitle: 'آبی خلیج فارس و خاک‌های رنگارنگ؛ سفری به تماشایی‌ترین قاب‌های جنوب.',
    image: '/images/iran/hormuz.webp',
    alt: 'کوه‌ها و تپه‌های رنگی جزیره هرمز در خلیج فارس، ایران',
    location: 'جزیرهٔ هرمز، هرمزگان',
    accent: '#ffe3b4',
    position: 'center 52%',
    photographer: 'Emad Nemati',
    source: 'https://commons.wikimedia.org/wiki/File:Color_mountains_in_Hormuz_island.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
  {
    id: 'badab-surt',
    title: 'باداب سورت؛ نقشِ آب و نور',
    subtitle: 'چشمه‌های پلکانی و رنگ‌های گرم زمین؛ گوشه‌ای متفاوت از طبیعت مازندران.',
    image: '/images/iran/badab-surt.webp',
    alt: 'چشمه‌های پلکانی و تراس‌های رنگی باداب سورت در مازندران، ایران',
    location: 'باداب سورت، مازندران',
    accent: '#fff0b7',
    position: 'center 58%',
    photographer: 'ninara',
    source: 'https://commons.wikimedia.org/wiki/File:Badab-e_Surt.jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
  {
    id: 'shiraz',
    title: 'شیراز؛ مهمانیِ نور و رنگ',
    subtitle: 'از شیشه‌های رنگی نصیرالملک تا زیبایی معماری ایرانی؛ هر گوشه، یک تماشا.',
    image: '/images/iran/shiraz.webp',
    alt: 'تابش نور از شیشه‌های رنگی مسجد نصیرالملک در شیراز، ایران',
    location: 'نصیرالملک، شیراز',
    accent: '#ffe0ef',
    position: 'center 55%',
    photographer: 'Ayyoubsabawiki',
    source: 'https://commons.wikimedia.org/wiki/File:Nasir-al_molk_-1.jpg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  },
];

export const Hero: React.FC<HeroProps> = ({ onNavigateSection }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)').matches);
  const [isPaused, setIsPaused] = useState(false);
  const [visited,setVisited]=useState<number[]>([0]);
  useEffect(()=>{setVisited(previous=>previous.includes(currentSlide)?previous:[...previous,currentSlide]);},[currentSlide]);
  const designSettings = useDesignSettings();
  const heroSettings = designSettings?.channels.hero;
  const activeSlide = HERO_SLIDES[currentSlide];

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 767px)');
    const update = (event: MediaQueryListEvent) => setReduceMotion(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduceMotion || isPaused || heroSettings?.enabled === false || designSettings?.slider.autoplay === false) return;
    const timer = window.setInterval(() => {
      setCurrentSlide(previous => (previous + 1) % HERO_SLIDES.length);
    }, heroSettings?.interval || designSettings?.slider.interval || 6000);
    return () => window.clearInterval(timer);
  }, [reduceMotion, isPaused, heroSettings?.enabled, heroSettings?.interval, designSettings?.slider.autoplay, designSettings?.slider.interval]);

  return (
    <section
      id="hero"
      className="iran-hero relative w-full h-screen min-h-[600px] overflow-hidden"
      aria-label={siteText("مقاصد گردشگری ایران")}
      aria-roledescription="اسلایدر"
      style={{ '--hero-accent': activeSlide.accent } as React.CSSProperties}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false); }}
    >
      <div className="absolute inset-0">
        {HERO_SLIDES.map((slide, index) => (visited.includes(index)||index===currentSlide) && (
          <div key={slide.id} className={`iran-hero-slide absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={index !== currentSlide}>
            <img src={slide.image} alt={siteText(slide.alt)} loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" data-motion="off" className="w-full h-full object-cover" style={{ objectPosition: slide.position }} />
          </div>
        ))}
        <div className="iran-hero-shade absolute inset-0 pointer-events-none" />

        <div className="iran-hero-caption absolute bottom-28 md:bottom-32 inset-x-0 z-20 px-14 md:px-20 text-center pointer-events-none" aria-live={isPaused ? 'polite' : 'off'} aria-atomic="true">
          <p className="iran-hero-location"><MapPin size={16} strokeWidth={1.6} aria-hidden="true" /><ManagedText value={activeSlide.location}/></p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-relaxed"><ManagedText value={activeSlide.title}/></h1>
          <p className="mt-3 text-sm md:text-base text-white/95 max-w-2xl mx-auto hidden sm:block"><ManagedText value={activeSlide.subtitle}/></p>
        </div>

        <button type="button" onClick={() => setCurrentSlide(previous => (previous - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)} className="iran-hero-arrow absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20" aria-label={siteText("اسلاید قبلی")}><ChevronRight size={24} /></button>
        <button type="button" onClick={() => setCurrentSlide(previous => (previous + 1) % HERO_SLIDES.length)} className="iran-hero-arrow absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20" aria-label={siteText("اسلاید بعدی")}><ChevronLeft size={24} /></button>

        <div className="absolute bottom-20 md:bottom-24 inset-x-0 z-20 flex items-center justify-center gap-1">
          {HERO_SLIDES.map((slide, index) => (
            <button type="button" key={slide.id} onClick={() => setCurrentSlide(index)} className="iran-hero-pagination" aria-label={siteText(`نمایش ${slide.location}`)} aria-current={index === currentSlide ? 'true' : undefined}><span className={index === currentSlide ? 'is-active' : ''} /></button>
          ))}
        </div>

        <button type="button" onClick={() => onNavigateSection('destinations')} className="absolute bottom-5 right-1/2 translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white hover:text-[var(--hero-accent)] transition cursor-pointer" aria-label={siteText("کاوش مقاصد")}><span className="text-sm font-medium"><ManagedText value={"کاوش مقاصد"}/></span><ChevronDown size={20} /></button>

        <details className="iran-hero-credit">
          <summary><ManagedText value={"اعتبار عکس"}/></summary>
          <div><p><ManagedText value={"عکاس: "}/><bdi><ManagedText value={activeSlide.photographer}/></bdi></p><ManagedAnchor href={activeSlide.source} target="_blank" rel="noreferrer"><ManagedText value={"منبع عکس"}/></ManagedAnchor><span> · </span><ManagedAnchor href={activeSlide.licenseUrl} target="_blank" rel="noreferrer"><bdi><ManagedText value={activeSlide.license}/></bdi></ManagedAnchor><p><ManagedText value={"نسخهٔ بهینه‌شده برای وب؛ برش متناسب با نمایشگر."}/></p></div>
        </details>
      </div>
    </section>
  );
};
