import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Leaf, Trees, Waves, Mountain, Droplets, Compass, Pause, Play } from 'lucide-react';
import { POPULAR_DESTINATIONS } from '../data/mockData';
import type { Destination } from '../types';
import { useDestinationCarousel } from '../hooks/useDestinationCarousel';
import './destinations.css';

interface PopularDestinationsProps {
  onSelectDestination: (destination: Destination) => void;
}

const FILTERS = [
  { id: 'all', label: 'همه مقصدها', icon: Compass },
  { id: 'forest', label: 'جنگل و ییلاق', icon: Trees },
  { id: 'coast', label: 'دریا و جزیره', icon: Waves },
  { id: 'desert', label: 'کویر', icon: Mountain },
  { id: 'water', label: 'آبشار و دریاچه', icon: Droplets },
  { id: 'mountain', label: 'کوهستان و روستا', icon: Mountain },
] as const;

export const PopularDestinations: React.FC<PopularDestinationsProps> = ({ onSelectDestination }) => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const [showAll, setShowAll] = useState(false);
  const destinations = POPULAR_DESTINATIONS.filter(item => filter === 'all' || item.category === filter);
  const carousel = useDestinationCarousel(destinations.length, showAll, filter);
  const renderContent = (item: Destination) => <>
    <div className="iran-destination-image"><img src={item.image} alt={siteText(item.title)} width="640" height="800" loading="lazy" decoding="async" draggable={false} data-motion="off" style={{ objectPosition: item.imagePosition }} /></div>
    <span className="iran-destination-city"><MapPin size={14} aria-hidden="true" /><ManagedText value={item.city || item.province}/></span>
    <div className="iran-destination-copy"><h3><ManagedText value={item.title}/></h3></div>
  </>;

  return (
    <section id="destinations" className="iran-destinations" aria-labelledby="destinations-heading">
      <div className="iran-destinations-heading">
        <div><p className="iran-destinations-eyebrow"><ManagedText value={"ایران، از نزدیک"}/></p><h2 id="destinations-heading"><ManagedText value={"مقصد "}/><span><ManagedText value={"محبوب"}/></span></h2><p className="iran-destinations-intro"><ManagedText value={"از سبزی ییلاق تا آبی دریا؛ گوشه‌های بکر ایران را کشف کن."}/></p></div>
        <div className="iran-destinations-navigation"><span><ManagedText value={destinations.length.toLocaleString('fa-IR')}/><ManagedText value={" مقصد برای کشف"}/></span><div>
          <button type="button" id="destinations-prev-btn" onClick={() => carousel.scroll('previous')} disabled={showAll || !carousel.looping} aria-label={siteText("مقصدهای قبلی")} aria-controls="iran-destinations-track"><ChevronRight size={20} /></button>
          <button type="button" onClick={carousel.togglePaused} disabled={showAll || !carousel.looping || carousel.reducedMotion} aria-label={siteText(carousel.paused ? 'پخش خودکار مقصدها' : 'توقف حرکت خودکار مقصدها')} aria-pressed={carousel.paused} aria-controls="iran-destinations-track">{carousel.paused ? <Play size={17} /> : <Pause size={17} />}</button>
          <button type="button" id="destinations-next-btn" onClick={() => carousel.scroll('next')} disabled={showAll || !carousel.looping} aria-label={siteText("مقصدهای بعدی")} aria-controls="iran-destinations-track"><ChevronLeft size={20} /></button>
        </div></div>
      </div>

      <div className="iran-destinations-filters" role="group" aria-label={siteText("نوع طبیعت مقصد")}>
        {FILTERS.map(({ id, label, icon: Icon }) => <button type="button" key={id} onClick={() => { setFilter(id); setShowAll(false); }} aria-pressed={filter === id}><Icon size={17} strokeWidth={1.6} aria-hidden="true" /><ManagedText value={label}/></button>)}
      </div>
      <span role="status" className="sr-only"><ManagedText value={destinations.length.toLocaleString('fa-IR')}/><ManagedText value={" مقصد در این دسته"}/></span>

      <div id="iran-destinations-track" className={`iran-destinations-track${showAll ? ' is-expanded' : ''}${carousel.looping && !showAll ? ' is-looping' : ''}${carousel.dragging ? ' is-dragging' : ''}`} ref={carousel.track} {...carousel.trackProps} dir="rtl" aria-label={siteText("مقصدهای گردشگری ایران")}>
        {destinations.map(item => <article key={item.id} className="iran-destination-card" data-destination-id={item.id}>
          <button type="button" className="iran-destination-open" onClick={() => onSelectDestination(item)} aria-label={siteText(`کشف ${item.title}`)}><ManagedText value={renderContent(item)}/></button>
        </article>)}
        {carousel.looping && !showAll && destinations.map(item => <article key={`copy-${item.id}`} className="iran-destination-card" data-destination-copy={item.id} aria-hidden="true" onClick={() => onSelectDestination(item)}><div className="iran-destination-open"><ManagedText value={renderContent(item)}/></div></article>)}
      </div>

      {destinations.length > 4 && <div className="iran-destinations-expand"><button type="button" onClick={() => setShowAll(value => !value)} aria-expanded={showAll} aria-controls="iran-destinations-track"><ManagedText value={showAll ? 'نمایش به صورت اسلایدر' : `دیدن همهٔ ${destinations.length.toLocaleString('fa-IR')} مقصد`}/></button></div>}

      <div className="iran-destinations-footnote"><p><Leaf size={16} strokeWidth={1.5} aria-hidden="true" /><ManagedText value={"مهمان طبیعتیم؛ زیبایی‌اش را برای بعدی‌ها نگه داریم."}/></p>
        <details className="iran-destinations-credits"><summary><ManagedText value={"اعتبار تصاویر"}/></summary><div>{POPULAR_DESTINATIONS.map(item => item.imageCredit && <p key={item.id}><span><ManagedText value={item.title}/> · <bdi><ManagedText value={item.imageCredit.author}/></bdi></span><ManagedAnchor href={item.imageCredit.source} target="_blank" rel="noreferrer"><ManagedText value={"منبع"}/></ManagedAnchor><ManagedAnchor href={item.imageCredit.licenseUrl} target="_blank" rel="noreferrer"><bdi><ManagedText value={item.imageCredit.license}/></bdi></ManagedAnchor></p>)}<small><ManagedText value={"تصاویر برای وب بهینه شده‌اند و متناسب با کارت برش می‌خورند."}/></small></div></details>
      </div>
    </section>
  );
};
