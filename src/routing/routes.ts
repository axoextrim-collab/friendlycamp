export type PageKind = 'home' | 'leaders' | 'leader' | 'favorites' | 'tour-compare' | 'tours' | 'tour' | 'calendar' | 'destinations' | 'destination' | 'blog' | 'article' | 'about' | 'terms' | 'privacy' | 'cancellation' | 'insurance' | 'legal' | 'faq' | 'support' | 'contact' | 'services' | 'account' | 'login' | 'register' | 'shop' | 'product' | 'checkout' | 'shop-manage' | 'admin' | 'tour-booking' | 'booking-return' | 'booking-receipt' | 'booking-test' | 'not-found';
export interface SiteRoute { kind: PageKind; path: string; id?: string }
const staticPages: Record<string, PageKind> = { '/': 'home', '/leaders':'leaders', '/favorites':'favorites', '/tours/compare':'tour-compare', '/tours': 'tours', '/calendar': 'calendar', '/destinations': 'destinations', '/blog': 'blog', '/about': 'about', '/terms': 'terms', '/privacy':'privacy','/cancellation':'cancellation','/insurance':'insurance','/legal':'legal','/faq':'faq','/support':'support', '/contact': 'contact', '/services': 'services', '/account': 'account', '/login': 'login', '/register': 'register', '/shop': 'shop', '/shop/checkout': 'checkout', '/shop/manage': 'shop-manage', '/admin': 'admin', '/booking/return':'booking-return', '/booking/receipt':'booking-receipt', '/booking/test-payment':'booking-test' };
export function resolveRoute(pathname: string): SiteRoute {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (Object.hasOwn(staticPages, path)) return { kind: staticPages[path], path };
  const dynamic: Array<[RegExp, PageKind]> = [[/^\/leaders\/([^/]+)$/, 'leader'], [/^\/tours\/([^/]+)\/book$/, 'tour-booking'], [/^\/tours\/([^/]+)$/, 'tour'], [/^\/blog\/([^/]+)$/, 'article'], [/^\/destinations\/([^/]+)$/, 'destination'], [/^\/shop\/products\/([^/]+)$/, 'product']];
  for (const [pattern, kind] of dynamic) { const match = path.match(pattern); if (match) { try { const id = decodeURIComponent(match[1]); if (!id || id.includes('/') || id.length > 200) break; return { kind, path, id }; } catch { break; } } }
  return { kind: 'not-found', path };
}
export const tourPath = (id: string) => `/tours/${encodeURIComponent(id)}`;
export const articlePath = (slug: string) => `/blog/${encodeURIComponent(slug)}`;
export const destinationPath = (id: string) => `/destinations/${encodeURIComponent(id)}`;
export const productPath = (id: string) => `/shop/products/${encodeURIComponent(id)}`;
export const SECTION_PATHS: Record<string, string> = { hero: '/', calendar: '/calendar', 'recommended-tours': '/tours', tours: '/tours', shop: '/shop', destinations: '/destinations', experience: '/about', about: '/about', blog: '/blog', contact: '/contact', terms: '/terms', services: '/services', 'why-choose-us': '/about', profile: '/account' };
export const sectionPath = (id: string) => SECTION_PATHS[id] || `/#${encodeURIComponent(id)}`;
export function legacyRouteRedirect(pathname: string, search = ''): string | null {
  if (pathname === '/profile' || pathname === '/profile/') return '/account' + search;
  if (pathname === '/articles') return '/blog' + search;
  if (pathname === '/shop') {
    const params = new URLSearchParams(search); const product = params.get('product'); const view = params.get('view');
    if (product) { params.delete('product'); params.delete('view'); return productPath(product) + (params.size ? `?${params}` : ''); }
    if (view === 'checkout' || view === 'manage') { params.delete('view'); return `/shop/${view}` + (params.size ? `?${params}` : ''); }
  }
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.replace(/\/+$/, '') + search;
  return null;
}
