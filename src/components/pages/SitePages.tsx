import {LeaderPages} from './LeaderPages';
import {FavoriteTours} from './FavoriteTours';
import {TourComparePage} from './TourComparePage';
import './tour-discovery.css';
import { PolicyPage } from './PolicyPages';
import type { Tour } from '../../types';
import React from 'react';
import { POPULAR_DESTINATIONS } from '../../data/mockData';
import { getArticle } from '../../data/articles';
import { SiteLink } from '../../routing/navigation';
import { tourPath, type SiteRoute } from '../../routing/routes';
import { TravelCalendarSection } from '../TravelCalendarSection';
import { ServicesSection } from '../ServicesSection';
import { ArticlesPage, ArticleDetailPage } from './ArticlePages';
import { AboutPage, ContactPage, TermsPage } from './InfoPages';
import { DestinationDetailPage, DestinationsPage } from './DestinationPages';
import { TourDetailPage, ToursPage } from './TourPages';
import { NotFoundPage, PageHeading } from './PageUI';
import { navigateTo } from '../../routing/navigation';
import './pages.css';
import { useTourCatalog } from '../../hooks/useTourCatalog';

export function SitePages({ route, onAddTourToCart }: { route: SiteRoute; onAddTourToCart: (tour: Tour) => void }) {
  const { tours, loading, error, refresh } = useTourCatalog();
  let content: React.ReactNode;
  if (route.kind === 'tours') content = <ToursPage />;
  else if (route.kind === 'tour') { const tour = tours.find(item => item.id === route.id); content = loading ? <p role="status">در حال دریافت برنامه…</p> : error ? <p role="alert">{error}<button type="button" onClick={() => void refresh()}>تلاش دوباره</button></p> : tour ? <TourDetailPage tour={tour} onAddToCart={() => onAddTourToCart(tour)} /> : <NotFoundPage />; }
  else if (route.kind==='leaders'||route.kind==='leader') content=<LeaderPages id={route.id}/>;
  else if (route.kind==='favorites') content=<FavoriteTours/>;
  else if (route.kind==='tour-compare') content=<TourComparePage/>;
  else if (route.kind === 'blog') content = <ArticlesPage />;
  else if (route.kind === 'article') { const article = getArticle(route.id || ''); content = article ? <ArticleDetailPage article={article} /> : <NotFoundPage />; }
  else if (route.kind === 'destinations') content = <DestinationsPage />;
  else if (route.kind === 'destination') { const destination = POPULAR_DESTINATIONS.find(item => item.id === route.id); content = destination ? <DestinationDetailPage destination={destination} /> : <NotFoundPage />; }
  else if (route.kind === 'about') content = <AboutPage />;
  else if (['terms','privacy','cancellation','insurance','legal','faq','support'].includes(route.kind)) content = <PolicyPage kind={route.kind as any}/>;
  else if (route.kind === 'contact') content = <ContactPage key={route.path + window.location.search} />;
  else if (route.kind === 'calendar') content = <><PageHeading eyebrow="تقویم سفر" title="برنامه‌ها، روی تقویم." description="نوبت‌های معرفی‌شده را مرور کن و برای آشنایی بیشتر، وارد صفحه هر برنامه شو." /><TravelCalendarSection onSelectTour={(tour,departureId) => navigateTo(tourPath(tour.id)+(departureId?'?'+new URLSearchParams({departureId}):''))} /></>;
  else if (route.kind === 'services') content = <><PageHeading eyebrow="خدمات باشگاه" title="برای بخش‌های مختلف یک سفر." description="تجهیزات، هماهنگی مسیر و همراهی گروه؛ جزئیات خدمات هر برنامه جداگانه هماهنگ می‌شود." /><ServicesSection onOpenContact={() => navigateTo('/contact')} /></>;
  else content = <NotFoundPage />;
  return <div className="sp-main" key={route.kind + ':' + (route.id || '')}>{content}</div>;
}
