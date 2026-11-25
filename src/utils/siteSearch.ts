import type { Destination, Tour } from '../types';
import type { Article } from '../data/articles';
import { tourDurationInDays, tourPriceInTomans } from './tourRecommendations';

export type SearchScope = 'all' | 'tours' | 'destinations' | 'articles';
export interface SearchFilters { query: string; scope: SearchScope; maxPrice: number | null; duration: 'all' | 'short' | 'medium' | 'long' }
export function normalizeSearch(value: string) { return value.normalize('NFKC').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[\u200c\u200d]/g, ' ').toLowerCase().trim(); }
export function searchSite(tours: Tour[], destinations: Destination[], articles: Article[], filters: SearchFilters) {
  const words = normalizeSearch(filters.query).split(/\s+/).filter(Boolean);
  const matches = (values: Array<string | undefined>) => { const text = normalizeSearch(values.filter(Boolean).join(' ')); return words.every(word => text.includes(word)); };
  return {
    tours: filters.scope === 'all' || filters.scope === 'tours' ? tours.filter(tour => {
      if (!matches([tour.title, tour.location, tour.country, ...tour.highlights])) return false;
      const price = tourPriceInTomans(tour.price); const days = tourDurationInDays(tour.duration);
      if (filters.maxPrice !== null && (price === null || price > filters.maxPrice)) return false;
      if (filters.duration !== 'all' && days === null) return false;
      return filters.duration === 'all' || (filters.duration === 'short' ? days! <= 2 : filters.duration === 'medium' ? days! >= 3 && days! <= 4 : days! >= 5);
    }) : [],
    destinations: filters.scope === 'all' || filters.scope === 'destinations' ? destinations.filter(destination => matches([destination.title, destination.country, destination.city, destination.province, destination.categoryLabel, destination.description])) : [],
    articles: filters.scope === 'all' || filters.scope === 'articles' ? articles.filter(article => matches([article.title, article.category, article.summary])) : [],
  };
}
