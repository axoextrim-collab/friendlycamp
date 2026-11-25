import { absoluteStructuredData, safeJsonLd } from '../src/routing/structuredData';
import { routeMetadata, publicRoutePaths, type PageMetadata } from '../src/routing/metadata';
import { legacyRouteRedirect, productPath, resolveRoute } from '../src/routing/routes';
import { getArticle } from '../src/data/articles';
import type { Tour } from '../src/types';
import type { ShopProduct } from '../src/types/shop';
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));
export function pageRedirect(pathname: string, search: string): string | null {
    if (pathname === '/index.html')
        return '/' + search;
    const legacy = legacyRouteRedirect(pathname, search);
    if (legacy)
        return legacy;
    const route = resolveRoute(pathname);
    if (route.kind === 'article') {
        const article = getArticle(route.id || '');
        if (article && route.id !== article.slug)
            return `/blog/${article.slug}${search}`;
    }
    return null;
}
export function renderPageHtml(template: string, meta: PageMetadata, origin: string): string {
    const clean = template.replace(/<title>[\s\S]*?<\/title>/gi, '').replace(/<meta\s+[^>]*(?:name=["'](?:description|robots)["']|property=["']og:(?:title|description|type|url|image)["'])[^>]*>/gi, '').replace(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi, '');
    const tags = [
        ...(meta.structuredData ? [`<script type="application/ld+json" data-site-schema="true">${safeJsonLd(absoluteStructuredData(meta.structuredData, origin))}</script>`] : []),
        `<title>${escapeHtml(meta.title)}</title>`,
        `<meta name="description" content="${escapeHtml(meta.description)}" />`,
        `<meta name="robots" content="${meta.noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}" />`,
        `<link rel="canonical" href="${escapeHtml(new URL(meta.path, origin).href)}" />`,
        ...Object.entries({ 'og:title': meta.title, 'og:description': meta.description, 'og:type': meta.type, 'og:url': new URL(meta.path, origin).href, 'og:image': new URL(meta.image, origin).href }).map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}" />`),
    ];
    return clean.replace('</head>', `${tags.join('\n    ')}\n  </head>`);
}
export function sitemapXml(products: ShopProduct[], origin: string, tours: Tour[] = []) {
    const paths = [...publicRoutePaths(tours), ...products.map(product => productPath(product.id))];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>${escapeHtml(new URL(path, origin).href)}</loc></url>`).join('')}</urlset>`;
}
export function metadataForPath(path: string, products: ShopProduct[], tours: Tour[] = []) { return routeMetadata(resolveRoute(path), products, tours); }
