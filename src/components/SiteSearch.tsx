import React, { useMemo, useState } from 'react';
import { ArrowLeft, BookOpenText, Compass, MapPin, RotateCcw, Search } from 'lucide-react';
import { POPULAR_DESTINATIONS } from '../data/mockData';
import { ARTICLES } from '../data/articles';
import { RECOMMENDATION_PHOTOS } from '../data/recommendationPhotos';
import { SiteLink } from '../routing/navigation';
import { articlePath, destinationPath, tourPath } from '../routing/routes';
import { searchSite, type SearchFilters, type SearchScope } from '../utils/siteSearch';
import { SiteDialog } from './SiteDialog';
import { useTourCatalog } from '../hooks/useTourCatalog';
import { FilterResults } from './FilterFeedback';

export function SiteSearch({ isOpen, onClose, initialQuery = '' }: { isOpen: boolean; onClose: () => void; initialQuery?: string }) { return isOpen ? <SearchDialog key={initialQuery} onClose={onClose} initialQuery={initialQuery} /> : null; }
function SearchDialog({ onClose, initialQuery }: { key?: React.Key; onClose: () => void; initialQuery: string }) {
  const { tours, loading, error, refresh } = useTourCatalog();
  const [filters, setFilters] = useState<SearchFilters>({ query: initialQuery, scope: 'all', maxPrice: null, duration: 'all' });
  const result = useMemo(() => searchSite(tours, POPULAR_DESTINATIONS, ARTICLES, filters), [filters, tours]);
  const total = result.tours.length + result.destinations.length + result.articles.length;
  const needsTours = filters.scope === 'all' || filters.scope === 'tours';
  const waitingForTours = needsTours && (loading || Boolean(error));
  const reset = () => setFilters({ query: '', scope: 'all', maxPrice: null, duration: 'all' });
  const closeLink = (event: React.MouseEvent) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) onClose(); };
  return <SiteDialog title="جست‌وجو در فرندلی کمپ" description="تور، مقصد یا راهنمای سفر را پیدا کن." onClose={onClose}>
    <div className="fc-search-controls"><label className="fc-search-input"><Search size={19} /><input type="search" aria-label="عبارت جست‌وجو" placeholder="نام مقصد، تور یا موضوع مقاله…" value={filters.query} onChange={event => setFilters(current => ({ ...current, query: event.target.value }))} autoFocus data-dialog-autofocus /></label><div className="fc-search-scopes" role="group" aria-label="نوع نتیجه">{([['all', 'همه'], ['tours', 'تورها'], ['destinations', 'مقصدها'], ['articles', 'مقاله‌ها']] as Array<[SearchScope, string]>).map(([scope, label]) => <button type="button" key={scope} aria-pressed={filters.scope === scope} onClick={() => setFilters(current => ({ ...current, scope }))}>{label}</button>)}</div>{(filters.scope === 'all' || filters.scope === 'tours') && <details className="fc-search-filters"><summary>فیلتر تورها{filters.duration !== 'all' || filters.maxPrice !== null ? ' · فعال' : ''}</summary><div><label>مدت سفر<select aria-label="مدت سفر در جست‌وجو" value={filters.duration} onChange={event => setFilters(current => ({ ...current, duration: event.target.value as SearchFilters['duration'] }))}><option value="all">همه مدت‌ها</option><option value="short">۱ تا ۲ روز</option><option value="medium">۳ تا ۴ روز</option><option value="long">۵ روز و بیشتر</option></select></label><label>سقف هزینه معرفی هر نفر<select aria-label="سقف هزینه تور" value={filters.maxPrice ?? ''} onChange={event => setFilters(current => ({ ...current, maxPrice: event.target.value ? Number(event.target.value) : null }))}><option value="">بدون محدودیت</option><option value="5000000">۵ میلیون تومان</option><option value="10000000">۱۰ میلیون تومان</option><option value="25000000">۲۵ میلیون تومان</option><option value="50000000">۵۰ میلیون تومان</option></select></label></div></details>}</div>
    <div className="fc-search-summary"><span role="status" aria-live="polite">{filters.scope === 'tours' && waitingForTours ? (loading ? 'در حال دریافت تورها…' : 'دریافت تورها انجام نشد') : total.toLocaleString('fa-IR') + ' نتیجه'}</span><button type="button" onClick={reset}><RotateCcw size={13} />پاک کردن جست‌وجو و فیلترها</button></div>
    <div className="fc-tool-content fc-search-results" aria-busy={needsTours && loading}>{waitingForTours && <FilterResults loading={loading} error={error} count={result.tours.length} onRetry={() => void refresh()}/>} {!total && !waitingForTours && <div className="fc-tool-empty"><Search size={34} /><h3>نتیجه‌ای پیدا نشد.</h3><p>املای عبارت یا فیلترها را تغییر بده.</p><button type="button" className="fc-tool-button" onClick={reset}>نمایش همه نتیجه‌ها<ArrowLeft size={15} /></button></div>}
      {!!result.tours.length && !waitingForTours && <section><h3><Compass size={16} />تور و برنامه سفر<span>{result.tours.length.toLocaleString('fa-IR')}</span></h3>{result.tours.map(tour => <SiteLink key={tour.id} href={tourPath(tour.id)} onClick={closeLink} className="fc-search-result"><img decoding="async" src={RECOMMENDATION_PHOTOS[tour.id]?.image || tour.image} alt="" loading="lazy" data-motion="off" /><div><strong>{tour.title}</strong><p>{tour.duration} · {tour.price}</p></div><ArrowLeft size={16} /></SiteLink>)}</section>}
      {!!result.destinations.length && <section><h3><MapPin size={16} />مقصدهای ایران<span>{result.destinations.length.toLocaleString('fa-IR')}</span></h3>{result.destinations.map(destination => <SiteLink key={destination.id} href={destinationPath(destination.id)} onClick={closeLink} className="fc-search-result"><img decoding="async" src={destination.image} alt="" loading="lazy" data-motion="off" /><div><strong>{destination.title}</strong><p>{destination.city} · {destination.province}</p></div><ArrowLeft size={16} /></SiteLink>)}</section>}
      {!!result.articles.length && <section><h3><BookOpenText size={16} />مقاله و راهنمای سفر<span>{result.articles.length.toLocaleString('fa-IR')}</span></h3>{result.articles.map(article => <SiteLink key={article.slug} href={articlePath(article.slug)} onClick={closeLink} className="fc-search-result"><img decoding="async" src={article.image} alt="" loading="lazy" data-motion="off" /><div><strong>{article.title}</strong><p>{article.category}</p></div><ArrowLeft size={16} /></SiteLink>)}</section>}
    </div>
  </SiteDialog>;
}
