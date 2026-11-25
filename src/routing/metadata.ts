import {LEADERS} from '../data/leaders';
import {routeStructuredData,absoluteStructuredData,safeJsonLd} from './structuredData';
import { POPULAR_DESTINATIONS } from '../data/mockData';
import { ARTICLES, getArticle } from '../data/articles';
import { RECOMMENDATION_PHOTOS } from '../data/recommendationPhotos';
import type { Tour } from '../types';
import type { ShopProduct } from '../types/shop';
import { articlePath, destinationPath, productPath, tourPath, type SiteRoute } from './routes';

export interface PageMetadata { structuredData?:Record<string,unknown>; title: string; description: string; path: string; image: string; type: 'website' | 'article'; noIndex: boolean; notFound: boolean }
const pages: Partial<Record<SiteRoute['kind'], [string, string]>> = {
  'booking-return': ['بررسی بازگشت از پرداخت', 'بررسی امن نتیجه پرداخت رزرو سفر.'],
  'booking-receipt': ['رسید و پیگیری رزرو', 'پیگیری خصوصی وضعیت رزرو، پرداخت و لغو سفر.'],
  'booking-test': ['پرداخت آزمایشی داخلی', 'محیط آزمایشی رزرو؛ بدون دریافت وجه واقعی.'],
  leaders:['لیدرها و مدارک مرتبط','پروفایل و مدارک قابل استعلام لیدرهای معرفی‌شده.'],leader:['پروفایل لیدر','سوابق و مدارک منتشرشده لیدر.'],favorites:['تورهای موردعلاقه','برنامه‌های سفر ذخیره‌شده در حساب یا مرورگر.'],'tour-compare':['مقایسه تورها','مقایسه شرایط واقعی حداکثر سه تور و نوبت حرکت آن‌ها.'],
  home: ['فرندلی کمپ | طبیعت‌گردی و کمپینگ', 'مقصدها، برنامه‌های سفر، راهنماهای کمپینگ و تجهیزات طبیعت‌گردی فرندلی کمپ.'],
  tours: ['فهرست تورها و برنامه‌های سفر', 'برنامه‌های معرفی‌شده طبیعت‌گردی و کمپینگ را بر اساس مقصد و مدت سفر بررسی کن.'],
  calendar: ['تقویم سفر و حرکت برنامه‌ها', 'تقویم برنامه‌های معرفی‌شده را ببین و برای بررسی جزئیات وارد صفحه هر سفر شو.'],
  destinations: ['مقصدهای طبیعت‌گردی ایران', 'آشنایی با مقصدهای جنگلی، کوهستانی، کویری و ساحلی ایران.'],
  blog: ['مجله و راهنماهای سفر', 'راهنماهای برنامه‌ریزی سفر، انتخاب تجهیزات و همراهی مسئولانه با طبیعت.'],
  about: ['درباره فرندلی کمپ', 'با رویکرد فرندلی کمپ در طبیعت‌گردی، همراهی گروهی و انتخاب تجهیزات آشنا شو.'],
  terms: ['راهنمای شرایط استفاده و ثبت درخواست', 'اطلاعات تأیید برنامه‌ها، سفارش تجهیزات و نگهداری اطلاعات حساب در فرندلی کمپ.'],
  privacy:['سیاست حفظ حریم خصوصی','نحوه نگهداری و استفاده از اطلاعات حساب، رزرو و درخواست‌ها.'],
  cancellation:['لغو و استرداد رزرو سفر','بررسی شرایط لغو هر نوبت و پیگیری وضعیت استرداد.'],
  insurance:['اطلاعات بیمه سفر','مشخصات بیمه ثبت‌شده هر برنامه، محدوده و اعتبار پوشش.'],
  legal:['مجوزها و اطلاعات حقوقی برگزارکننده','مشخصات منتشرشده برگزارکننده و راه استعلام مدارک.'],
  faq:['پرسش‌های متداول سفر و رزرو','پاسخ پرسش‌های رزرو، پیگیری و شرایط برنامه‌ها.'],
  support:['ثبت شکایت و پشتیبانی','ثبت و پیگیری خصوصی پرونده و پاسخ پشتیبانی.'],
  contact: ['تماس با فرندلی کمپ', 'برای هماهنگی سفر، تجهیزات و پیگیری درخواست‌ها با فرندلی کمپ در تماس باش.'],
  services: ['خدمات تخصصی فرندلی کمپ', 'خدمات هماهنگی سفر، تجهیزات، اقامت و همراهی در برنامه‌های طبیعت‌گردی.'],
  account: ['حساب کاربری همسفر', 'مدیریت اطلاعات حساب، پروفایل سفر، سفرنامه‌ها و تنظیمات شخصی.'],
  login: ['ورود به حساب کاربری', 'ورود به حساب فرندلی کمپ با شماره همراه یا ایمیل.'],
  register: ['ساخت حساب کاربری', 'ایجاد حساب فرندلی کمپ و تکمیل اطلاعات همسفر.'],
  shop: ['فروشگاه تخصصی تجهیزات طبیعت‌گردی', 'بررسی و مقایسه تجهیزات کمپینگ، مشاهده موجودی ثبت‌شده و ثبت درخواست سفارش.'],
  product: ['مشخصات تجهیزات طبیعت‌گردی', 'مشخصات مدل، قیمت و وضعیت موجودی تجهیزات فرندلی کمپ را بررسی کن.'],
  checkout: ['ثبت درخواست سفارش تجهیزات', 'بازبینی سبد و ثبت اطلاعات تحویل سفارش.'],
  'shop-manage': ['مدیریت فروشگاه', 'مدیریت موجودی کالا و وضعیت سفارش‌های تجهیزات.'],
  admin: ['مدیریت فرندلی کمپ', 'ورود به مرکز مدیریت فرندلی کمپ.'],
};
export function routeMetadata(route: SiteRoute, products?: ShopProduct[], tours: Tour[] = []): PageMetadata {
  const heading = pages[route.kind] || pages.home!;
  const meta: PageMetadata = { title: `${heading[0]}${route.kind === 'home' ? '' : ' | فرندلی کمپ'}`, description: heading[1], path: route.kind === 'account' ? '/account' : route.path, image: '/images/moments/camp.webp', type: 'website', noIndex: ['favorites','tour-compare','account', 'login', 'register', 'checkout', 'shop-manage', 'admin', 'tour-booking', 'booking-return', 'booking-receipt', 'booking-test'].includes(route.kind), notFound: route.kind === 'not-found' };
  if ((route.kind === 'tour' || route.kind === 'tour-booking')) { const tour = tours.find(item => item.id === route.id); if (!tour) meta.notFound = true; else { meta.title = `${tour.title} | فرندلی کمپ`; meta.description = `${tour.location} · ${tour.duration}. معرفی برنامه، ویژگی‌های سفر و اطلاعات موردنیاز پیش از هماهنگی.`; meta.image = RECOMMENDATION_PHOTOS[tour.id]?.image || tour.image; meta.path = tourPath(tour.id); } }
  if (route.kind === 'article') { const article = getArticle(route.id || ''); if (!article) meta.notFound = true; else { meta.title = `${article.title} | مجله فرندلی کمپ`; meta.description = article.summary; meta.image = article.image; meta.type = 'article'; meta.path = articlePath(article.slug); } }
  if (route.kind === 'destination') { const destination = POPULAR_DESTINATIONS.find(item => item.id === route.id); if (!destination) meta.notFound = true; else { meta.title = `${destination.title} | مقصدهای فرندلی کمپ`; meta.description = destination.description || `${destination.title} در ${destination.province || 'ایران'}؛ آشنایی با مقصد و بررسی برنامه‌های مرتبط.`; meta.image = destination.image; meta.path = destinationPath(destination.id); } }
  if (route.kind === 'product' && products) { const product = products.find(item => item.id === route.id); if (!product) meta.notFound = true; else { meta.title = `${product.name} | فروشگاه فرندلی کمپ`; meta.description = product.summary; meta.image = product.image || meta.image; meta.path = productPath(product.id); } }
  if(route.kind==='leader'){const leader=LEADERS.find(item=>item.id===route.id);if(!leader)meta.notFound=true;else{meta.title=leader.name+' | لیدر فرندلی کمپ';meta.description=leader.qualifications;if(leader.image)meta.image=leader.image;}}
  if (meta.notFound) { meta.title = 'صفحه پیدا نشد | فرندلی کمپ'; meta.description = 'این نشانی در فرندلی کمپ پیدا نشد. از فهرست برنامه‌ها، مقصدها یا مقالات ادامه بده.'; meta.noIndex = true; }
  if(!meta.notFound&&!meta.noIndex)meta.structuredData=routeStructuredData(route,products,tours);
  return meta;
}
export const publicRoutePaths = (tours: Tour[] = []) => ['/', '/leaders', ...LEADERS.map(item=>`/leaders/${item.id}`), '/tours', '/calendar', '/destinations', '/blog', '/about', '/services', '/terms', '/privacy', '/cancellation', '/insurance', '/legal', '/faq', '/support', '/contact', '/shop', ...tours.map(tour => tourPath(tour.id)), ...POPULAR_DESTINATIONS.map(destination => destinationPath(destination.id)), ...ARTICLES.map(article => articlePath(article.slug))];

export function applyPageMetadata(meta: PageMetadata, base = window.location.origin) {
  document.title = meta.title;
  document.querySelectorAll('script[data-site-schema]').forEach(item=>item.remove());
  if(meta.structuredData){const script=document.createElement('script');script.type='application/ld+json';script.dataset.siteSchema='true';script.textContent=safeJsonLd(absoluteStructuredData(meta.structuredData,base));document.head.appendChild(script);}
  const set = (selector: string, content: string, attribute: 'name' | 'property', key: string) => { let element = document.head.querySelector<HTMLMetaElement>(selector); if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element); } element.content = content; };
  set('meta[name="description"]', meta.description, 'name', 'description');
  set('meta[name="robots"]', meta.noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large', 'name', 'robots');
  for (const [key, value] of Object.entries({ 'og:title': meta.title, 'og:description': meta.description, 'og:type': meta.type, 'og:url': new URL(meta.path, base).href, 'og:image': new URL(meta.image, base).href })) set(`meta[property="${key}"]`, value, 'property', key);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]'); if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); } canonical.href = new URL(meta.path, base).href;
}
