import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import { Check } from 'lucide-react';
import { FilterResults, FilterSummary } from './FilterFeedback';
import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, LayoutList, MapPin, Mountain, Phone, Tent, Users, X } from 'lucide-react';
import type { Tour } from '../types';
import { CALENDAR_CATEGORIES, buildCalendarData, type CalendarEvent } from '../data/liveCalendar';
import { useTourCatalog } from '../hooks/useTourCatalog';
import { getPersianMonth, persianNumber, WEEKDAYS } from '../utils/persianCalendar';
import './travel-calendar.css';

interface TravelCalendarSectionProps { onSelectTour: (tour: Tour,departureId?:string) => void }

export const TravelCalendarSection: React.FC<TravelCalendarSectionProps> = ({ onSelectTour }) => {
  const { tours, loading, error, refresh } = useTourCatalog();
  const { CALENDAR_EVENTS, CALENDAR_MONTHS, CALENDAR_TOUR_PHOTOS } = buildCalendarData(tours);
  const [monthIndex, setMonthIndex] = useState(0);
  useEffect(() => setMonthIndex(index => Math.min(index, CALENDAR_MONTHS.length - 1)), [CALENDAR_MONTHS.length]);
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const month = CALENDAR_MONTHS[Math.min(monthIndex, CALENDAR_MONTHS.length - 1)];
  const dates = getPersianMonth(month.year, month.number);
  const allMonthEvents = CALENDAR_EVENTS.filter(event => event.month === month.number && event.year === month.year);
  const events = allMonthEvents.filter(event => category === 'all' || event.category === category);
  const selected = events.find(event => event.id === selectedId) || events[0] || null;
  const offset = (dates[0].getUTCDay() + 1) % 7;
  const cellCount = Math.ceil((offset + dates.length) / 7) * 7;
  const monthLabel = `${month.name} ${persianNumber(month.year)}`;
  const selectedDate = selected ? dates[selected.day - 1] : null;
  const selectedPhoto = selected ? CALENDAR_TOUR_PHOTOS[selected.tour.id] : null;
  const dateLabel = (event: CalendarEvent) => `${WEEKDAYS[(dates[event.day - 1].getUTCDay() + 1) % 7]} ${persianNumber(event.day)} ${month.name}`;
  const changeMonth = (index: number) => { setMonthIndex(index); setSelectedId(null); };
  const chooseEvent = (event: CalendarEvent) => setSelectedId(event.id);

  return <section id="calendar" className="travel-calendar" aria-labelledby="travel-calendar-title" dir="rtl">
    <div className="tc-inner">
      <header className="tc-heading">
        <div><p className="tc-eyebrow"><span /><ManagedText value={"تقویم سفرهای فرندلی کمپ"}/></p><h2 id="travel-calendar-title"><ManagedText value={"وقتِ یک "}/><span><ManagedText value={"سفر تازه."}/></span></h2><p className="tc-intro"><ManagedText value={"حرکت تورها و برنامه‌های کمپینگ؛ روزت را انتخاب کن، باقی‌اش با ما."}/></p></div>
        <div className="tc-heading-note"><Tent size={29} strokeWidth={1.25} /><span><ManagedText value={"از یک تاریخ شروع می‌شود."}/><br /><strong><ManagedText value={"به یک خاطره می‌رسد."}/></strong></span></div>
      </header>

      <div className="tc-shell">
        <div className="tc-topbar">
          <div className="tc-month-tabs" role="group" aria-label={siteText("انتخاب ماه سفر")}>{CALENDAR_MONTHS.map((item, index) => <button type="button" key={`${item.year}-${item.number}`} aria-pressed={monthIndex === index} onClick={() => changeMonth(index)}><span><ManagedText value={item.name}/></span><small><ManagedText value={persianNumber(item.year)}/></small></button>)}</div>
          <div className="tc-view-switch" role="group" aria-label={siteText("نحوه نمایش برنامه‌ها")}><button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}><CalendarDays size={17} /><ManagedText value={"تقویم"}/></button><button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><LayoutList size={17} /><ManagedText value={"فهرست سفرها"}/></button></div>
        </div>

        <div className="tc-filterbar"><div className="tc-filters" role="group" aria-label={siteText("نوع سفر")}>{CALENDAR_CATEGORIES.map(item => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setSelectedId(null); }}>{category === item.id && <Check size={15}/>} <ManagedText value={item.label}/></button>)}</div><span className="tc-result-count" role="status"><ManagedText value={loading ? 'در حال دریافت…' : error ? 'دریافت انجام نشد' : persianNumber(events.length) + ' برنامه در ' + month.name}/></span></div>

        <FilterSummary labels={[...(category === 'all' ? [] : [CALENDAR_CATEGORIES.find(item => item.id === category)!.label]), ...(monthIndex ? [monthLabel] : [])]} onReset={() => { setCategory('all'); changeMonth(0); }} onRefresh={() => void refresh()} loading={loading}/>
        <FilterResults loading={loading} error={error} count={events.length} filtered={category !== 'all' || monthIndex !== 0} onReset={() => { setCategory('all'); changeMonth(0); }} onRetry={() => void refresh()} emptyTitle={allMonthEvents.length ? 'سفری با این فیلتر پیدا نشد.' : 'نوبت حرکتی برای این ماه ثبت نشده است.'} emptyText="ماه یا نوع سفر دیگری را انتخاب کن؛ نوبت‌های منتشرشده همین‌جا نمایش داده می‌شوند.">
        <div className="tc-workspace">
          <div className="tc-schedule">
            <div className="tc-month-heading"><div><span className="tc-small-label"><ManagedText value={month.season}/><ManagedText value={" · تقویم خورشیدی"}/></span><h3><ManagedText value={monthLabel}/></h3></div><div className="tc-month-navigation"><button type="button" aria-label={siteText("ماه قبل")} disabled={monthIndex === 0} onClick={() => changeMonth(monthIndex - 1)}><ChevronRight size={19} /></button><button type="button" aria-label={siteText("ماه بعد")} disabled={monthIndex === CALENDAR_MONTHS.length - 1} onClick={() => changeMonth(monthIndex + 1)}><ChevronLeft size={19} /></button></div></div>

            {view === 'calendar' ? <div className="tc-month-grid" aria-label={siteText(`تقویم ${monthLabel}`)}>
              <div className="tc-weekdays" aria-hidden="true">{WEEKDAYS.map((day, index) => <span key={day} className={index === 6 ? 'is-friday' : ''}><span className="tc-weekday-long"><ManagedText value={day}/></span><abbr className="tc-weekday-short" title={siteText(day)}><ManagedText value={['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'][index]}/></abbr></span>)}</div>
              <div className="tc-days">{Array.from({ length: cellCount }, (_, index) => {
                const day = index - offset + 1;
                if (day < 1 || day > dates.length) return <div className="tc-day is-outside" key={`empty-${index}`} aria-hidden="true" />;
                const departures = events.filter(event => event.day === day);
                const isSelected = departures.some(event => event.id === selected?.id);
                return <div key={day} className={`tc-day${index % 7 === 6 ? ' is-friday' : ''}${departures.length ? ' has-departure' : ''}${isSelected ? ' is-selected' : ''}`}>
                  <span className="tc-day-number"><ManagedText value={persianNumber(day)}/></span>
                  {departures.map(event => <button type="button" key={event.id} className="tc-day-event" aria-controls="tc-selected-trip" aria-pressed={event.id === selected?.id} aria-label={siteText(`${dateLabel(event)}، ${event.tour.title}، ${persianNumber(event.capacityLeft)} نفر ظرفیت`)} onClick={() => chooseEvent(event)}><span><ManagedText value={event.shortTitle}/></span><small><ManagedText value={persianNumber(event.capacityLeft)}/><ManagedText value={" جای خالی"}/></small><span className="tc-event-dot" aria-hidden="true" /></button>)}
                </div>;
              })}</div>
              <div className="tc-calendar-key"><span><i /><ManagedText value={"روز حرکت سفر"}/></span><span><i /><ManagedText value={"سفر انتخاب‌شده"}/></span><p><ManagedText value={"روزهای مشخص‌شده را انتخاب کن."}/></p></div>
            </div> : <div className="tc-event-list" aria-label={siteText(`برنامه‌های ${monthLabel}`)}>
              {events.map(event => <button type="button" key={event.id} className={`tc-list-event${event.id === selected?.id ? ' is-selected' : ''}`} aria-pressed={event.id === selected?.id} onClick={() => chooseEvent(event)}><span className="tc-list-date"><strong><ManagedText value={persianNumber(event.day)}/></strong><small><ManagedText value={month.name}/></small></span><span className="tc-list-info"><strong><ManagedText value={event.tour.title}/></strong><span><ManagedText value={dateLabel(event)}/> · <ManagedText value={event.tour.duration}/></span></span><span className={`tc-list-capacity${event.capacityLeft <= 4 ? ' is-limited' : ''}`}><ManagedText value={persianNumber(event.capacityLeft)}/><ManagedText value={" جای خالی"}/></span></button>)}
            </div>}

            {events.length === 0 && <div className="tc-no-events" role="status"><CalendarDays size={25} strokeWidth={1.3} /><div><strong><ManagedText value={allMonthEvents.length ? 'سفری با این فیلتر نداریم.' : 'هنوز سفری برای این ماه ثبت نشده.'}/></strong><p><ManagedText value={allMonthEvents.length ? 'نوع سفر را تغییر بده تا برنامه‌های این ماه را ببینی.' : 'برای اطلاع از برنامه‌های جدید با ما در تماس باش.'}/></p></div>{category !== 'all' && <button type="button" onClick={() => setCategory('all')}><X size={15} /><ManagedText value={"حذف فیلتر"}/></button>}</div>}
          </div>

          <aside id="tc-selected-trip" className="tc-trip-panel" aria-label={siteText("جزئیات سفر انتخاب‌شده")}>
            {selected ? <article className="tc-trip-card" key={selected.id}>
              <div className="tc-trip-photo"><img decoding="async" src={selectedPhoto.src} alt={siteText(selected.tour.title)} data-motion="off" loading="lazy" /><span className="tc-trip-type"><Mountain size={14} /><ManagedText value={CALENDAR_CATEGORIES.find(item => item.id === selected.category)?.label}/></span><div className="tc-photo-date"><strong><ManagedText value={persianNumber(selected.day)}/></strong><span><ManagedText value={month.name}/><small><ManagedText value={selectedDate && WEEKDAYS[(selectedDate.getUTCDay() + 1) % 7]}/></small></span></div><details className="tc-image-credit"><summary><ManagedText value={"عکس"}/></summary><div><ManagedAnchor href={selectedPhoto.source} target="_blank" rel="noreferrer"><ManagedText value={"منبع تصویر"}/></ManagedAnchor>{selectedPhoto.credit && <><bdi><ManagedText value={selectedPhoto.credit.author}/></bdi><ManagedAnchor href={selectedPhoto.credit.licenseUrl} target="_blank" rel="noreferrer"><bdi><ManagedText value={selectedPhoto.credit.license}/></bdi></ManagedAnchor></>}</div></details></div>
              <div className="tc-trip-body"><p className="tc-selected-label"><ManagedText value={"انتخاب تو برای سفر"}/></p><h3 aria-live="polite" aria-atomic="true"><ManagedText value={selected.tour.title}/></h3><p className="tc-trip-location"><MapPin size={15} strokeWidth={1.6} /><ManagedText value={selected.tour.location}/></p>
                <div className="tc-trip-facts"><div><Clock3 size={17} strokeWidth={1.5} /><span><ManagedText value={"مدت سفر"}/><strong><ManagedText value={selected.tour.duration}/></strong></span></div><div><CalendarDays size={17} strokeWidth={1.5} /><span><ManagedText value={"زمان حرکت"}/><strong><ManagedText value={selected.departure}/></strong></span></div></div>
                <div className={`tc-capacity${selected.capacityLeft <= 4 ? ' is-limited' : ''}`}><div><span><Users size={15} /><ManagedText value={"ظرفیت باقی‌مانده"}/></span><strong><ManagedText value={persianNumber(selected.capacityLeft)}/> <small><ManagedText value={"از "}/><ManagedText value={persianNumber(selected.totalCapacity)}/><ManagedText value={" نفر"}/></small></strong></div><div className="tc-capacity-track" role="meter" aria-label={siteText("ظرفیت باقی‌مانده سفر")} aria-valuemin={0} aria-valuemax={selected.totalCapacity} aria-valuenow={selected.capacityLeft}><span style={{ width: `${selected.capacityLeft / selected.totalCapacity * 100}%` }} /></div></div>
                <div className="tc-trip-booking"><div><span><ManagedText value={"هزینه برای هر نفر"}/></span><strong><ManagedText value={selected.tour.price}/></strong></div><button type="button" onClick={() => onSelectTour(selected.tour,selected.id)}><ManagedText value={"جزئیات و رزرو تور"}/></button></div>
              </div>
            </article> : <div className="tc-trip-empty"><Tent size={54} strokeWidth={.8} /><h3><ManagedText value={"سفر بعدی، در راه است."}/></h3><p><ManagedText value={"یک ماه یا نوع سفر دیگر را انتخاب کن؛ شاید ماجراجویی تو همان‌جا منتظر باشد."}/></p><button type="button" onClick={() => { setCategory('all'); changeMonth(0); }}><ManagedText value={"دیدن برنامه‌های ثبت‌شده"}/></button></div>}
          </aside>
        </div>

        </FilterResults>
        <footer className="tc-footer"><p><ManagedText value={"تاریخ، قیمت و ظرفیت از نوبت‌های حرکت داشبورد دریافت می‌شوند."}/></p><ManagedAnchor href="tel:09215014474"><Phone size={15} strokeWidth={1.5} /><span><ManagedText value={"مشاوره سفر"}/></span><bdi><ManagedText value={"۰۹۲۱ ۵۰۱ ۴۴۷۴"}/></bdi></ManagedAnchor></footer>
      </div>
      <p className="tc-endnote"><ManagedText value={"کمی فاصله از روزمرگی. کمی نزدیک‌تر به طبیعت."}/></p>
    </div>
  </section>;
};
