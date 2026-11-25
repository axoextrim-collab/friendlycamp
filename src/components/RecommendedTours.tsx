import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import { FilterResults, FilterSummary } from './FilterFeedback';
import React, { useEffect, useRef, useState } from 'react';
import { Binoculars, Check, ChevronDown, Clock3, Compass, Info, MapPin, Mountain, RotateCcw, SlidersHorizontal, Sparkles, Tent, TreePine, Waves, type LucideIcon } from 'lucide-react';
import type { Tour } from '../types';
import { useTourCatalog } from '../hooks/useTourCatalog';
import { RECOMMENDATION_PHOTOS } from '../data/recommendationPhotos';
import { initialRecommendationPreferences, recommendTours, TRAVEL_INTERESTS, type RecommendationPreferences, type RecommendationSort, type TourRecommendation, type TravelInterest } from '../utils/tourRecommendations';
import './recommendations.css';

const INTEREST_ICONS: Record<TravelInterest, LucideIcon> = { forest: TreePine, mountain: Mountain, water: Waves, wildlife: Binoculars, camping: Tent };

function RecommendationCard({ match, personalized, onSelectTour }: { key?: React.Key; match: TourRecommendation; personalized: boolean; onSelectTour: (tour: Tour) => void }) {
  const photo = RECOMMENDATION_PHOTOS[match.tour.id];
  return <article className="rt-tour-card">
    <div className="rt-tour-photo"><img src={photo?.image || match.tour.image} alt={siteText(photo?.alt || match.tour.title)} data-motion="off" loading="lazy" decoding="async" /><span className="rt-country"><ManagedText value={match.tour.country}/></span></div>
    <div className="rt-tour-body">
      <p className="rt-match-label"><span className="rt-match-symbol"><Check size={13} strokeWidth={1.7} /></span><ManagedText value={match.matchedInterests.length ? `${match.matchedInterests.length.toLocaleString('fa-IR')} علاقهٔ مشترک` : personalized ? 'همخوان با شرایط انتخابی' : 'از فهرست سفرها'}/></p>
      <h3><ManagedText value={match.tour.title}/></h3><p className="rt-tour-location"><MapPin size={14} strokeWidth={1.5} /><ManagedText value={match.tour.location}/></p>
      <div className="rt-tour-meta"><span><Clock3 size={15} strokeWidth={1.5} /><ManagedText value={match.tour.duration}/></span><span><ManagedText value={match.tour.country === 'ایران' ? 'سفر داخلی' : 'سفر خارجی'}/></span></div>
      <details className="rt-reasons"><summary><Info size={15} strokeWidth={1.5} /><ManagedText value={"چرا این سفر؟"}/><ChevronDown size={14} /></summary>{match.reasons.length ? <ul>{match.reasons.map(reason => <li key={reason}><Check size={13} /><ManagedText value={reason}/></li>)}</ul> : <p><ManagedText value={"برای شروع، چند برنامه از فهرست سفرها را می‌بینی. با انتخاب علاقه‌ها و شرایطت، این پیشنهادها تغییر می‌کنند."}/></p>}</details>
      <div className="rt-tour-booking"><div><span><ManagedText value={"هزینهٔ درج‌شده برای هر نفر"}/></span><strong><ManagedText value={match.tour.price}/></strong></div><button type="button" onClick={() => onSelectTour(match.tour)} aria-label={siteText(`جزئیات و رزرو ${match.tour.title}`)}><ManagedText value={"جزئیات و رزرو"}/></button></div>
    </div>
  </article>;
}

interface RecommendedToursProps { onSelectTour: (tour: Tour) => void; userPreferences?: string[] }

export const RecommendedTours: React.FC<RecommendedToursProps> = ({ onSelectTour, userPreferences }) => {
  const { tours, loading, error, refresh } = useTourCatalog();
  const [preferences, setPreferences] = useState(() => initialRecommendationPreferences(userPreferences));
  const [sort, setSort] = useState<RecommendationSort>('match');
  const [showAll, setShowAll] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { resultsRef.current?.scrollTo({ left: 0, behavior: 'instant' }); }, [preferences, sort, showAll]);
  const matches = recommendTours(tours, preferences, sort);
  const visible = showAll ? matches : matches.slice(0, 3);
  const personalized = preferences.interests.length > 0 || preferences.region !== 'all' || preferences.maxDays !== null || preferences.maxBudget !== null;
  const update = (patch: Partial<RecommendationPreferences>) => { setPreferences(previous => ({ ...previous, ...patch })); setShowAll(false); };
  const labels = [...preferences.interests.map(id => TRAVEL_INTERESTS.find(item => item.id === id)!.label), ...(preferences.region === 'all' ? [] : [preferences.region === 'domestic' ? 'داخل ایران' : 'خارج از ایران']), ...(preferences.maxDays === null ? [] : ['تا ' + preferences.maxDays.toLocaleString('fa-IR') + ' روز']), ...(preferences.maxBudget === null ? [] : ['بودجه تا ' + preferences.maxBudget.toLocaleString('fa-IR') + ' تومان']), ...(sort === 'match' ? [] : [sort === 'price' ? 'هزینه کمتر' : 'سفر کوتاه‌تر'])];
  const reset = () => { setPreferences(initialRecommendationPreferences()); setSort('match'); setShowAll(false); };
  const relaxations = [
    { label: 'حذف سقف بودجه', active: preferences.maxBudget !== null, patch: { maxBudget: null } },
    { label: 'مدت سفر آزاد', active: preferences.maxDays !== null, patch: { maxDays: null } },
    { label: 'همهٔ مقصدها', active: preferences.region !== 'all', patch: { region: 'all' as const } },
    { label: 'همهٔ علاقه‌ها', active: preferences.interests.length > 0, patch: { interests: [] } },
  ].filter(option => option.active && recommendTours(tours, { ...preferences, ...option.patch }).length > 0);

  return <section id="recommended-tours" className="trip-recommendations" aria-labelledby="trip-recommendations-title" dir="rtl">
    <div className="rt-inner">
      <header className="rt-heading"><div><p className="rt-eyebrow"><Compass size={17} strokeWidth={1.4} /><ManagedText value={"سیستم پیشنهاد هوشمند فرندلی کمپ"}/></p><h2 id="trip-recommendations-title"><ManagedText value={"ماجراجویی بعدی، "}/><span><ManagedText value={"به سلیقهٔ تو."}/></span></h2><p className="rt-intro"><ManagedText value={"حال‌وهوای سفرت را انتخاب کن؛ پیشنهادهای نزدیک‌تر به تو همین‌جا پیدا می‌شوند."}/></p></div><details className="rt-method"><summary><Info size={16} /><ManagedText value={"پیشنهادها چطور انتخاب می‌شوند؟"}/></summary><div><strong><ManagedText value={"انتخاب‌های تو، دلیل پیشنهادهاست."}/></strong><p><ManagedText value={"علاقه‌ها ترتیب پیشنهادها را مشخص می‌کنند. مدت سفر، بودجه و محدودهٔ مقصد، شرط نمایش هر سفر هستند."}/></p><p><ManagedText value={"دلیل انتخاب هر برنامه را در «چرا این سفر؟» می‌بینی. پیشنهادها از فهرست فعلی تورها انتخاب می‌شوند."}/></p></div></details></header>

      <div className="rt-preferences" aria-label={siteText("انتخاب شرایط سفر")}>
        <fieldset className="rt-interest-field"><legend><Sparkles size={17} strokeWidth={1.4} /><ManagedText value={"سفر برای تو چه حال‌وهوایی دارد؟"}/><span><ManagedText value={"می‌توانی چند علاقه را انتخاب کنی."}/></span></legend><div className="rt-interest-options">{TRAVEL_INTERESTS.map(interest => { const Icon = INTEREST_ICONS[interest.id]; const selected = preferences.interests.includes(interest.id); return <button key={interest.id} type="button" aria-pressed={selected} onClick={() => update({ interests: selected ? preferences.interests.filter(value => value !== interest.id) : [...preferences.interests, interest.id] })}><Icon size={22} strokeWidth={1.3} /><span><ManagedText value={interest.label}/></span><span className="rt-interest-check" aria-hidden="true">{selected && <Check size={12} strokeWidth={2} />}</span></button>; })}</div></fieldset>
        <div className="rt-constraints"><label htmlFor="rt-region"><ManagedText value={"محدودهٔ سفر"}/><select id="rt-region" data-active={preferences.region !== 'all'} value={preferences.region} onChange={event => update({ region: event.target.value as RecommendationPreferences['region'] })}><option value="all">{siteText("داخلی و خارجی")}</option><option value="domestic">{siteText("فقط داخل ایران")}</option><option value="international">{siteText("فقط خارج از ایران")}</option></select></label><label htmlFor="rt-days"><ManagedText value={"چقدر زمان داری؟"}/><select id="rt-days" data-active={preferences.maxDays !== null} value={preferences.maxDays ?? ''} onChange={event => update({ maxDays: event.target.value ? Number(event.target.value) : null })}><option value="">{siteText("مدت سفر آزاد")}</option><option value="3">{siteText("تا ۳ روز")}</option><option value="5">{siteText("تا ۵ روز")}</option><option value="7">{siteText("تا ۷ روز")}</option></select></label><label htmlFor="rt-budget"><ManagedText value={"سقف بودجه برای هر نفر"}/><select id="rt-budget" data-active={preferences.maxBudget !== null} value={preferences.maxBudget ?? ''} onChange={event => update({ maxBudget: event.target.value ? Number(event.target.value) : null })}><option value="">{siteText("بدون سقف مشخص")}</option><option value="10000000">{siteText("تا ۱۰ میلیون تومان")}</option><option value="25000000">{siteText("تا ۲۵ میلیون تومان")}</option><option value="35000000">{siteText("تا ۳۵ میلیون تومان")}</option></select></label><div className="rt-preference-actions"><button type="button" className="rt-reset" onClick={reset} disabled={!personalized && sort === 'match'}><RotateCcw size={15} strokeWidth={1.5} /><ManagedText value={"پاک‌کردن انتخاب‌ها"}/></button>{!loading && !error && <ManagedAnchor className="rt-mobile-results-link" href="#rt-results-summary"><ManagedText value={"دیدن "}/><ManagedText value={matches.length.toLocaleString('fa-IR')}/><ManagedText value={" نتیجه"}/></ManagedAnchor>}</div></div>
      </div>

      <FilterSummary labels={labels} onReset={reset} onRefresh={() => void refresh()} loading={loading}/>
      <div id="rt-results-summary" tabIndex={-1} className="rt-results-heading"><div><span className="rt-results-icon"><SlidersHorizontal size={19} strokeWidth={1.4} /></span><div><h3><ManagedText value={personalized ? 'پیشنهادهای هماهنگ با انتخاب تو' : 'برای شروع، این سفرها را ببین'}/></h3><p role="status" aria-live="polite"><ManagedText value={loading ? 'در حال دریافت برنامه‌ها…' : error ? 'دریافت برنامه‌ها انجام نشد.' : personalized ? `${matches.length.toLocaleString('fa-IR')} سفر همخوان از ${tours.length.toLocaleString('fa-IR')} برنامهٔ فهرست` : 'با تغییر انتخاب‌ها، پیشنهادها به‌روز می‌شوند.'}/></p></div></div><label className="rt-sort" htmlFor="rt-sort"><ManagedText value={"مرتب‌سازی"}/><select id="rt-sort" data-active={sort !== 'match'} value={sort} onChange={event => setSort(event.target.value as RecommendationSort)}><option value="match">{siteText("بیشترین همخوانی")}</option><option value="price">{siteText("هزینهٔ کمتر")}</option><option value="duration">{siteText("سفر کوتاه‌تر")}</option></select></label></div>

      <FilterResults loading={loading} error={error} count={matches.length} filtered={labels.length > 0} onRetry={() => void refresh()} onReset={reset} emptyTitle={personalized ? 'سفری با این انتخاب‌ها پیدا نشد.' : 'هنوز برنامه‌ای برای پیشنهاد منتشر نشده است.'} emptyActions={relaxations.map(option => <button type="button" key={option.label} onClick={() => update(option.patch)}><ManagedText value={option.label}/></button>)}>
      {matches.length ? <><p className="rt-mobile-hint"><ManagedText value={visible.length > 1 ? 'برای دیدن پیشنهادهای بعدی، ورق بزن.' : ''}/></p><div id="rt-results" ref={resultsRef} className={`rt-results${visible.length === 1 ? ' has-one' : visible.length === 2 ? ' has-two' : ''}`}>{visible.map(match => <RecommendationCard key={match.tour.id} match={match} personalized={personalized} onSelectTour={onSelectTour} />)}</div>{matches.length > 3 && <div className="rt-show-all"><button type="button" onClick={() => setShowAll(value => !value)} aria-expanded={showAll} aria-controls="rt-results"><ManagedText value={showAll ? 'نمایش سه پیشنهاد اول' : `دیدن هر ${matches.length.toLocaleString('fa-IR')} پیشنهاد`}/></button></div>}</> : null}

      </FilterResults>
      <footer className="rt-footer"><p><ManagedText value={"انتخاب‌ها فقط برای پیشنهادهای همین بخش استفاده می‌شوند."}/></p><p><ManagedText value={"نتیجه‌ها از فهرست برنامه‌های منتشرشده دریافت می‌شوند؛ شرایط نوبت انتخابی را پیش از رزرو بررسی کن."}/></p></footer>
    </div>
  </section>;
};
