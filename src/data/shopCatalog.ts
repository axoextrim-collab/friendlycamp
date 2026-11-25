import { OUTDOOR_PRODUCTS } from './outdoorStore';
import type { ShopProduct } from '../types/shop';

// Reference models are not an assertion of local inventory or price.
// Linking a matching manufacturer SKU in inventory makes a reference model orderable at the configured price.
export const REFERENCE_GEAR: ShopProduct[] = [
  ...OUTDOOR_PRODUCTS.map(product => ({
    id: `model-${product.reference}`, sku: product.reference, name: product.name, brand: product.brand, model: product.model,
    category: product.category, image: product.image, summary: product.summary, description: product.description,
    specs: product.specs, guide: product.selectionNote, source: product.source,
    weightGrams: product.category === 'shelter' ? 2600 : product.category === 'packs' ? 1600 : product.category === 'lighting' ? 94 : null,
    activity: product.category === 'packs' || product.category === 'lighting' ? 'both' as const : 'camping' as const,
    price: null, stock: null,
  })),
  {
    id: 'model-9003378', sku: '9003378', name: 'کیسه‌خواب کمپینگ بیسیک', brand: 'QUECHUA', model: 'BASIC · 20°C', category: 'sleep',
    image: '/images/store/sleeping-bag.webp', summary: 'کیسه‌خواب مستطیلی برای شب‌مانی در هوای گرم.',
    description: 'مدل بیسیک با زیپ کامل، ابعاد ۱۹۰ × ۷۲ سانتی‌متر و کیسه حمل. دمای آسایش اعلام‌شده سازنده ۲۰ درجه است؛ این مدل برای کمپ سردسیر معرفی نشده است.',
    specs: [{ label: 'دمای آسایش', value: '۲۰ درجه سانتی‌گراد' }, { label: 'وزن', value: '۷۵۵ گرم' }, { label: 'ابعاد', value: '۱۹۰ × ۷۲ سانتی‌متر' }, { label: 'حجم بسته', value: '۹ لیتر' }, { label: 'شکل', value: 'مستطیلی' }],
    guide: 'دمای آسایش را با کمترین دمای شب مقصد مقایسه کن؛ به عدد دمای حد اکتفا نکن.',
    source: 'https://www.decathlon.co.uk/p/20degc-camping-sleeping-bag-basic/381859/c386c149c288m9003378', weightGrams: 755, activity: 'camping', price: null, stock: null,
  },
  {
    id: 'model-5591048', sku: '5591048', name: 'زیرانداز فومی ترکینگ', brand: 'QUECHUA', model: 'MT100 · 180 × 50', category: 'sleep',
    image: '/images/store/sleeping-mat.webp', summary: 'زیرانداز رولی سبک با سطح آلومینیومی.',
    description: 'زیرانداز یک‌نفره فومی MT100 با ابعاد ۱۸۰ × ۵۰ و ضخامت ۰٫۷ سانتی‌متر. وزن کم و ساختار رولی آن برای حمل ساده طراحی شده است.',
    specs: [{ label: 'وزن', value: '۲۱۰ گرم' }, { label: 'ابعاد', value: '۱۸۰ × ۵۰ سانتی‌متر' }, { label: 'ضخامت', value: '۰٫۷ سانتی‌متر' }, { label: 'حجم رول', value: '۶٫۶ لیتر' }],
    guide: 'ابعاد زیرانداز باید با فضای خواب و قد تو سازگار باشد. برای هوای سرد، مشخصات عایق و سیستم خواب را جداگانه بررسی کن.',
    source: 'https://www.decathlon.co.uk/p/one-person-trekking-foam-mattress-180-x-50cm-mt100/13259/c210m5591048', weightGrams: 210, activity: 'both', price: null, stock: null,
  },
  {
    id: 'model-8807204', sku: '8807204', name: 'باتوم تلسکوپی پیمایش', brand: 'FORCLAZ', model: 'MT100 · SINGLE', category: 'trail',
    image: '/images/store/trekking-pole.webp', summary: 'یک عدد باتوم آلومینیومی با تنظیم دکمه‌ای.',
    description: 'باتوم سه‌بخشی MT100 با قفل دکمه‌ای و طول قابل تنظیم ۱۰۵، ۱۱۰، ۱۱۵ و ۱۲۰ سانتی‌متر. واحد فروش این مدل یک عدد است، نه یک جفت.',
    specs: [{ label: 'واحد فروش', value: 'یک عدد' }, { label: 'وزن', value: '۲۰۰ گرم' }, { label: 'جنس', value: 'آلومینیوم 6061-T6' }, { label: 'طول جمع‌شده', value: '۵۵ سانتی‌متر' }, { label: 'قفل', value: 'دکمه‌ای' }],
    guide: 'اگر برای پیمایش به یک جفت نیاز داری، تعداد دو را انتخاب کن. پیش از حرکت، قفل هر بخش را بررسی کن.',
    source: 'https://www.decathlon.co.uk/p/1-affordable-hiking-pole-mt100-blue/122861/c443m8807204', weightGrams: 200, activity: 'trekking', price: null, stock: null,
  },
  {
    id: 'model-8852417', sku: '8852417', name: 'بطری آب استیل یک‌ونیم لیتری', brand: 'QUECHUA', model: 'SCREW TOP · 1.5L', category: 'kitchen',
    image: '/images/store/water-bottle.webp', summary: 'بطری استیل با در پیچی و دستگیره حمل؛ بدون عایق حرارتی.',
    description: 'بطری ۱٫۵ لیتری با بدنه استیل 18/8، دهانه باز و در پیچی. این مدل فلاسک عایق نیست و برای حفظ دمای نوشیدنی طراحی نشده است.',
    specs: [{ label: 'حجم', value: '۱٫۵ لیتر' }, { label: 'وزن', value: '۲۷۰ گرم' }, { label: 'ابعاد', value: 'قطر ۹ × ارتفاع ۲۸٫۵ سانتی‌متر' }, { label: 'جنس', value: 'استیل 18/8' }, { label: 'عایق حرارتی', value: 'ندارد' }],
    guide: 'برای نگهداری دمای نوشیدنی، بطری تک‌جداره را با فلاسک عایق اشتباه نگیر.',
    source: 'https://www.decathlon.co.uk/p/1-5-l-stainless-steel-75percent-recycled-water-bottle-with-a-screw-top-cap/351201/c151m8852417', weightGrams: 270, activity: 'both', price: null, stock: null,
  },
];
