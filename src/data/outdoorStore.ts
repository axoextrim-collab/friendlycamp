export type OutdoorCategory = 'shelter' | 'packs' | 'kitchen' | 'lighting';
export interface OutdoorProduct {
  id: string;
  category: OutdoorCategory;
  brand: string;
  name: string;
  model: string;
  reference: string;
  image: string;
  badge: string;
  summary: string;
  description: string;
  specs: { label: string; value: string }[];
  selectionNote: string;
  source: string;
}

export const OUTDOOR_CATEGORIES = [
  { id: 'all', label: 'همه تجهیزات' },
  { id: 'shelter', label: 'چادر و اقامت' },
  { id: 'packs', label: 'کوله‌پشتی' },
  { id: 'kitchen', label: 'آشپزی کمپ' },
  { id: 'lighting', label: 'نور و روشنایی' },
] as const;

// Product identity, images and specifications checked against the linked manufacturer pages.
// These showcase records do not assert local stock, price or dealership status.
export const OUTDOOR_PRODUCTS: OutdoorProduct[] = [
  {
    id: 'quechua-mh100-2p', category: 'shelter', brand: 'QUECHUA', name: 'چادر کمپ دو نفره', model: 'MH100 · 2P', reference: '8513471',
    image: '/images/store/tent.webp', badge: 'اقامت دو نفره', summary: 'سازهٔ گنبدی و مستقل برای کمپ در هوای ملایم.',
    description: 'چادر دو نفرهٔ MH100 با سازهٔ گنبدی مستقل و تیرک‌های فایبرگلاس. پوش دوم و تهویهٔ عقب، بخشی از طراحی این مدل برای کمپینگ در هوای ملایم هستند.',
    specs: [{ label: 'ظرفیت', value: '۲ نفر' }, { label: 'وزن', value: '۲٫۶ کیلوگرم' }, { label: 'فضای خواب', value: '۲۱۰ × ۱۳۰ سانتی‌متر' }, { label: 'ارتفاع داخلی', value: '۱۰۷ سانتی‌متر' }, { label: 'تیرک', value: 'فایبرگلاس' }, { label: 'فصل استفاده', value: 'دو فصل · هوای ملایم' }],
    selectionNote: 'برای انتخاب، عرض زیرانداز و ابعاد فضای خواب را کنار ظرفیت اسمی بررسی کن.',
    source: 'https://www.decathlon.co.uk/p/camping-tent-mh100-2-person/303295/c251c98c74m8513471',
  },
  {
    id: 'simond-mt100-50l', category: 'packs', brand: 'SIMOND', name: 'کوله‌پشتی ترکینگ', model: 'MT100 EASYFIT · 50L', reference: '8559690',
    image: '/images/store/backpack.webp', badge: 'حجم ۵۰ لیتر', summary: 'تنظیم پشت EASYFIT، دسترسی پایین و کاور باران.',
    description: 'کولهٔ ۵۰ لیتری MT100 EASYFIT با سیستم تنظیم ارتفاع پشت، دسترسی به بخش پایین کوله و کاور باران. این مدل سیستم حمل مخصوص آقایان دارد.',
    specs: [{ label: 'حجم', value: '۵۰ لیتر' }, { label: 'وزن', value: '۱٫۶ کیلوگرم' }, { label: 'ابعاد', value: '۵۸ × ۲۶ × ۲۶ سانتی‌متر' }, { label: 'سیستم تنظیم', value: 'EASYFIT' }, { label: 'جیب‌ها', value: '۵ جیب' }, { label: 'کاور باران', value: 'همراه محصول' }],
    selectionNote: 'تناسب سیستم حمل با طول پشت و اندازهٔ تنه، به‌اندازهٔ حجم کوله اهمیت دارد.',
    source: 'https://www.decathlon.co.uk/p/men-s-50l-trekking-backpack-mt100-easyfit/309807/c71c382m8559690',
  },
  {
    id: 'quechua-mh100-cookset', category: 'kitchen', brand: 'QUECHUA', name: 'ست آشپزی دو نفره', model: 'MH100 · 1.6L', reference: '8492725',
    image: '/images/store/cookset.webp', badge: 'آشپزخانهٔ جمع‌وجور', summary: 'قابلمهٔ استیل با دستهٔ تاشو و ظروف دو نفره.',
    description: 'ست پخت‌وپز دو نفرهٔ MH100 با قابلمهٔ استیل ضدزنگ و ظرفیت ۱٫۶ لیتر. دستهٔ تاشو برای بسته نگه داشتن مجموعه در زمان حمل طراحی شده و بشقاب و قاشق‌وچنگال همراه آن است.',
    specs: [{ label: 'ظرفیت قابلمه', value: '۱٫۶ لیتر' }, { label: 'تعداد نفرات', value: '۲ نفر' }, { label: 'جنس قابلمه', value: 'استیل ضدزنگ' }, { label: 'دسته', value: 'تاشو' }, { label: 'ظروف همراه', value: 'بشقاب و قاشق‌وچنگال' }],
    selectionNote: 'ست ظروف را جدا از اجاق بررسی کن؛ برای پخت‌وپز، نوع اجاق و سوخت موردنیازت را هم مشخص کن.',
    source: 'https://www.decathlon.com/products/camping-cook-set-stainless-2-person-mh100',
  },
  {
    id: 'petzl-tikka-350', category: 'lighting', brand: 'PETZL', name: 'چراغ پیشانی تیکا', model: 'TIKKA · 350 lm', reference: 'E061AB01',
    image: '/images/store/headlamp.webp', badge: 'نور سفید و قرمز', summary: 'پرتوی عریض با سه سطح نور سفید و حالت قرمز.',
    description: 'چراغ پیشانی TIKKA با نور سفید تا ۳۵۰ لومن، نور قرمز و وزن ۹۴ گرم. با سه باتری AAA کار می‌کند و باتری شارژی CORE نیز به‌صورت جداگانه با آن سازگار است.',
    specs: [{ label: 'شدت نور', value: '۳۵۰ لومن' }, { label: 'وزن', value: '۹۴ گرم' }, { label: 'مقاومت در برابر آب', value: 'IPX4' }, { label: 'منبع تغذیه', value: '۳ باتری AAA' }, { label: 'نوع پرتو', value: 'عریض' }, { label: 'نور قرمز', value: 'دارد' }],
    selectionNote: 'زمان کارکرد با سطح نور تغییر می‌کند؛ عدد حداکثر لومن را همراه جدول عملکرد سازنده بررسی کن.',
    source: 'https://www.petzl.com/us/en/sport/products/hiking-camping-headlamps/tikka/E061AB00_SPO_a2rTx00000003IrIAI.html',
  },
];

export const OUTDOOR_SELECTION_GUIDE = [
  { category: 'shelter', title: 'برای شب‌مانی', text: 'ظرفیت، فضای خواب و شرایط فصل را کنار هم ببین.' },
  { category: 'packs', title: 'برای پیمایش', text: 'تناسب سیستم حمل و حجم وسایل را بررسی کن.' },
  { category: 'kitchen', title: 'برای آشپزی', text: 'تعداد نفرات، حجم ظروف و نوع اجاق را مشخص کن.' },
  { category: 'lighting', title: 'برای روشنایی', text: 'نوع پرتو، وزن و زمان کارکرد را مقایسه کن.' },
] as const;
