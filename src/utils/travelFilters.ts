import type { Tour } from '../types';
import { normalizeSearch } from './siteSearch';
import { tourDurationInDays } from './tourRecommendations';
import { matchingDepartures, type AdvancedTourFilters } from './tourDiscovery';

export function filterTourCatalog(tours: Tour[], filters: { query: string; region: string; days: string } & AdvancedTourFilters) {
  const words = normalizeSearch(filters.query).split(/\s+/).filter(Boolean);
  return tours.filter(tour => {
    const text = normalizeSearch(`${tour.title} ${tour.location} ${tour.country}`);
    const days = tourDurationInDays(tour.duration);
    const advanced=!!(filters.dateFrom||filters.dateTo||filters.minBudget!=null||filters.maxBudget!=null);
    return words.every(word => text.includes(word)) && (!filters.destination||filters.destination==='all'||normalizeSearch(tour.location)===normalizeSearch(filters.destination))&&(!filters.difficulty||filters.difficulty==='all'||tour.travel?.difficulty===filters.difficulty)&&(!advanced||matchingDepartures(tour,filters).length>0)&&(filters.region === 'all' || (filters.region === 'iran' ? tour.country === 'ایران' : tour.country !== 'ایران')) && (filters.days === 'all' || (days !== null && (filters.days === 'short' ? days <= 3 : days > 3)));
  });
}


export function calendarCategory(tour: Tour & { category?: string }) {
  const category = normalizeSearch(tour.category || '');
  const known = ['rainforest', 'trekking', 'weekend', 'family', 'vip'];
  if (known.includes(category)) return category;
  const classify = (text: string) => /خانواد/.test(text) ? 'family' : /ویژه|vip/.test(text) ? 'vip' : /جنگل|ییلاق/.test(text) ? 'rainforest' : /کوه|صعود/.test(text) ? 'trekking' : /آخر هفته|آخرهفته/.test(text) ? 'weekend' : undefined;
  return classify(category) || classify(normalizeSearch(tour.title)) || 'weekend';
}
