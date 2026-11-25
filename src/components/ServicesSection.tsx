import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React, { useEffect, useRef, useState } from 'react';
import { Tent, ShieldCheck, Utensils, Truck, Compass, MoonStar, Check, Phone, MessageCircle, Leaf, type LucideIcon } from 'lucide-react';
import { SPECIALIZED_SERVICES, type SpecializedServiceId } from '../data/specializedServices';
import { DESTINATION_IMAGE_CREDITS } from '../data/destinationImageCredits';
import './services.css';

interface ServicesSectionProps { onOpenContact: () => void }

const SERVICE_ICONS: Record<SpecializedServiceId, LucideIcon> = {
  equipment: Tent, guides: ShieldCheck, cooking: Utensils, transport: Truck, route: Compass, experience: MoonStar,
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenContact }) => {
  const [selectedId, setSelectedId] = useState<SpecializedServiceId>('equipment');
  const [compact, setCompact] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = SPECIALIZED_SERVICES.find(service => service.id === selectedId)!;
  const ActiveIcon = SERVICE_ICONS[active.id];

  useEffect(() => {
    const query = window.matchMedia('(max-width: 1050px)');
    const update = () => setCompact(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const navigateTabs = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = SPECIALIZED_SERVICES.length - 1;
    else if (event.key === (compact ? 'ArrowLeft' : 'ArrowDown')) next = (index + 1) % SPECIALIZED_SERVICES.length;
    else if (event.key === (compact ? 'ArrowRight' : 'ArrowUp')) next = (index - 1 + SPECIALIZED_SERVICES.length) % SPECIALIZED_SERVICES.length;
    else return;
    event.preventDefault();
    setSelectedId(SPECIALIZED_SERVICES[next].id);
    tabRefs.current[next]?.focus({ preventScroll: true });
    tabRefs.current[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  };

  return <section id="services" className="club-services" aria-labelledby="club-services-title" dir="rtl">
    <div className="cs-inner">
      <header className="cs-heading">
        <div><p className="cs-eyebrow"><ManagedText value={"خدمات تخصصی باشگاه فرندلی کمپ"}/></p><h2 id="club-services-title"><ManagedText value={"تو غرقِ سفر شو."}/><br /><span><ManagedText value={"جزئیات، با ما."}/></span></h2></div>
        <p className="cs-intro"><ManagedText value={"از آماده‌سازی تجهیزات تا آخرین شب کمپ؛"}/><br className="cs-desktop-break" /><ManagedText value={" خدماتی که تجربهٔ سفر را کنار هم می‌سازند."}/></p>
      </header>

      <div className="cs-board">
        <div className="cs-selector">
          <p className="cs-selector-label"><span><ManagedText value={"همراه تو، در هر بخش سفر"}/></span><span className="cs-mobile-hint"><ManagedText value={"۶ خدمت · ورق بزن"}/></span></p>
          <div className="cs-tabs" role="tablist" aria-label={siteText("خدمات تخصصی سفر")} aria-orientation={compact ? 'horizontal' : 'vertical'}>
            {SPECIALIZED_SERVICES.map((service, index) => {
              const Icon = SERVICE_ICONS[service.id];
              const isActive = service.id === selectedId;
              return <button type="button" key={service.id} ref={element => { tabRefs.current[index] = element; }} id={`cs-tab-${service.id}`} className="cs-tab" role="tab" aria-selected={isActive} aria-controls="cs-service-panel" tabIndex={isActive ? 0 : -1} onClick={() => setSelectedId(service.id)} onKeyDown={event => navigateTabs(event, index)}>
                <span className="cs-tab-icon"><Icon size={23} strokeWidth={1.35} /></span><span className="cs-tab-copy"><strong><ManagedText value={service.label}/></strong><small><ManagedText value={service.summary}/></small></span><span className="cs-tab-indicator" aria-hidden="true"><span /></span>
              </button>;
            })}
          </div>
          <p className="cs-selector-footnote"><Leaf size={15} strokeWidth={1.5} /><ManagedText value={"مهمان طبیعتیم؛ با احترام سفر می‌کنیم."}/></p>
        </div>

        <div id="cs-service-panel" className="cs-panel" role="tabpanel" aria-labelledby={`cs-tab-${active.id}`} tabIndex={0}>
          <div className="cs-service-copy" key={`copy-${active.id}`}>
            <p className="cs-service-tag"><ActiveIcon size={17} strokeWidth={1.5} /><ManagedText value={active.tag}/></p>
            <h3><ManagedText value={active.title}/></h3><p className="cs-description"><ManagedText value={active.description}/></p>
            <ul className="cs-service-details">{active.details.map(detail => <li key={detail.title}><Check size={16} strokeWidth={1.8} /><div><strong><ManagedText value={detail.title}/></strong><p><ManagedText value={detail.text}/></p></div></li>)}</ul>
            <p className="cs-service-note"><ManagedText value={active.note}/></p>
          </div>
          <figure className={`cs-service-visual cs-visual-${active.id}`} key={`image-${active.id}`}>
            <img src={active.image} alt={siteText(active.imageAlt)} style={{ objectPosition: active.imagePosition }} data-motion="off" loading="lazy" decoding="async" />
            <figcaption><span className="cs-photo-caption"><ManagedText value={"برای تجربهٔ بهترِ طبیعت."}/></span><details className="cs-photo-credit"><summary><ManagedText value={"اعتبار عکس"}/></summary><div><span><ManagedText value={"تصویر منتخب برای معرفی خدمت"}/></span><ManagedAnchor href={active.id === 'route' ? DESTINATION_IMAGE_CREDITS.filband.source : active.source} target="_blank" rel="noreferrer"><ManagedText value={"منبع تصویر"}/></ManagedAnchor>{active.id === 'route' && <><bdi><ManagedText value={DESTINATION_IMAGE_CREDITS.filband.author}/></bdi><ManagedAnchor href={DESTINATION_IMAGE_CREDITS.filband.licenseUrl} target="_blank" rel="noreferrer"><bdi><ManagedText value={DESTINATION_IMAGE_CREDITS.filband.license}/></bdi></ManagedAnchor></>}</div></details></figcaption>
          </figure>
        </div>
      </div>

      <footer className="cs-contact-strip"><div><span className="cs-contact-icon"><MessageCircle size={24} strokeWidth={1.25} /></span><div><h3><ManagedText value={"سفرت را متناسب با گروهت بچین."}/></h3><p><ManagedText value={"برای انتخاب خدمات و هماهنگی برنامهٔ اختصاصی، با ما گفت‌وگو کن."}/></p></div></div><div className="cs-contact-actions"><ManagedAnchor href="tel:09215014474" aria-label={siteText("تماس با فرندلی کمپ، ۰۹۲۱۵۰۱۴۴۷۴")}><Phone size={16} strokeWidth={1.5} /><bdi><ManagedText value={"۰۹۲۱ ۵۰۱ ۴۴۷۴"}/></bdi></ManagedAnchor><button type="button" onClick={onOpenContact}><ManagedText value={"گفت‌وگو با مشاور"}/></button></div></footer>
    </div>
  </section>;
};
