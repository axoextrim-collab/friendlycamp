import { Destination, BookingStep } from '../types';
import { DESTINATION_IMAGE_CREDITS } from './destinationImageCredits';

export const POPULAR_DESTINATIONS: Destination[] = [
  {
    id: 'masal',
    title: 'ییلاقات ماسال',
    country: 'ایران', province: 'گیلان', city: 'ماسال', category: 'forest', categoryLabel: 'جنگل و ییلاق',
    image: '/images/iran/masal.webp', imagePosition: 'center 55%',
    description: 'کلبه‌های رنگی، تپه‌های سبز و ابرهایی که آرام از میان کوه‌های تالش می‌گذرند.',
    highlights: ['چشم‌انداز کوه‌های تالش', 'ییلاق‌های سرسبز', 'کلبه‌ها و زندگی روستایی'],
    imageCredit: { author: 'Rasool abbasi17', source: 'https://commons.wikimedia.org/wiki/File:طبیعت_زیبای_ییلاقات_ماسال.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }
  },
  {
    id: 'hormuz',
    title: 'جزیرهٔ رنگی هرمز',
    country: 'ایران', province: 'هرمزگان', city: 'هرمز', category: 'coast', categoryLabel: 'دریا و جزیره',
    image: '/images/iran/hormuz.webp', imagePosition: 'center 55%',
    description: 'تلاقی خاک‌های سرخ و طلایی با آبی خلیج فارس؛ جزیره‌ای برای تماشای رنگ‌های زمین.',
    highlights: ['کوه‌ها و خاک‌های رنگی', 'ساحل خلیج فارس', 'چشم‌اندازهای زمین‌شناسی'],
    imageCredit: { author: 'Emad Nemati', source: 'https://commons.wikimedia.org/wiki/File:Color_mountains_in_Hormuz_island.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }
  },
  {
    id: 'shahdad',
    title: 'کلوت‌های شهداد',
    country: 'ایران', province: 'کرمان', city: 'شهداد', category: 'desert', categoryLabel: 'کویر و سکوت',
    image: '/images/iran/shahdad.webp', imagePosition: 'center 55%',
    description: 'سازه‌های شگفت‌انگیز باد و خاک در حاشیهٔ لوت؛ منظره‌ای از جنس سکوت و نور.',
    highlights: ['کلوت‌ها و سازه‌های فرسایشی', 'چشم‌انداز دشت لوت', 'رنگ‌های گرم کویر'],
    imageCredit: DESTINATION_IMAGE_CREDITS.shahdad
  },
  {
    id: 'margoon',
    title: 'آبشار مارگون',
    country: 'ایران', province: 'فارس', city: 'سپیدان', category: 'water', categoryLabel: 'آبشار و چشمه',
    image: '/images/iran/margoon.webp', imagePosition: 'center 45%',
    description: 'رشته‌های آب بر دیوارهٔ کوه، صدای جاری طبیعت و سبزی دامنه‌های سپیدان.',
    highlights: ['دیواره‌های پوشیده از آب', 'طبیعت کوهستانی سپیدان', 'رودخانهٔ پایین آبشار'],
    imageCredit: DESTINATION_IMAGE_CREDITS.margoon
  },
  {
    id: 'badab-surt',
    title: 'چشمه‌های باداب سورت',
    country: 'ایران', province: 'مازندران', city: 'ساری', category: 'water', categoryLabel: 'آبشار و چشمه',
    image: '/images/iran/badab-surt.webp', imagePosition: 'center 58%',
    description: 'پله‌های طبیعی به رنگ نارنجی و طلایی؛ نقشی که آب در دل کوهستان ساخته است.',
    highlights: ['تراس‌های پلکانی طبیعی', 'رنگ‌های معدنی زمین', 'چشم‌انداز کوهستان مازندران'],
    imageCredit: { author: 'ninara', source: 'https://commons.wikimedia.org/wiki/File:Badab-e_Surt.jpg', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' }
  },
  {
    id: 'qeshm',
    title: 'درهٔ ستارگان قشم',
    country: 'ایران', province: 'هرمزگان', city: 'قشم', category: 'coast', categoryLabel: 'دریا و جزیره',
    image: '/images/iran/qeshm.webp', imagePosition: 'center 55%',
    description: 'دالان‌ها و ستون‌های سنگی با شکل‌هایی خیال‌انگیز، در دل جزیرهٔ قشم.',
    highlights: ['ستون‌ها و دالان‌های فرسایشی', 'بافت‌های تماشایی سنگ', 'طبیعت جزیرهٔ قشم'],
    imageCredit: { author: 'ninara', source: 'https://commons.wikimedia.org/wiki/File:Stars_Valley.jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' }
  },
  {
    id: 'filband', title: 'ییلاق فیلبند',
    country: 'ایران', province: 'مازندران', city: 'بابل', category: 'forest', categoryLabel: 'جنگل و ییلاق',
    image: '/images/iran/filband.webp', imagePosition: 'center 55%',
    description: 'روستایی در ارتفاعات مازندران، با دامنه‌های سبز و چشم‌اندازی رو به ابرها.',
    highlights: ['چشم‌انداز ییلاقی مازندران', 'خانه‌های روستایی', 'مه و ابر در دامنه‌ها'],
    imageCredit: DESTINATION_IMAGE_CREDITS.filband
  },
  {
    id: 'subatan', title: 'ییلاق سوباتان',
    country: 'ایران', province: 'گیلان', city: 'تالش', category: 'forest', categoryLabel: 'جنگل و ییلاق',
    image: '/images/iran/subatan.webp', imagePosition: 'center 55%',
    description: 'دشت‌های باز، خانه‌های چوبی و تپه‌های سبز در ارتفاعات تالش؛ یک قاب آرام از گیلان.',
    highlights: ['مرتع‌های سرسبز تالش', 'کلبه‌های ییلاقی', 'دشت‌ها و دامنه‌های باز'],
    imageCredit: DESTINATION_IMAGE_CREDITS.subatan
  },
  {
    id: 'abr', title: 'جنگل ابر شاهرود',
    country: 'ایران', province: 'سمنان', city: 'شاهرود', category: 'forest', categoryLabel: 'جنگل و ییلاق',
    image: '/images/iran/abr.webp', imagePosition: 'center 50%',
    description: 'جایی که مه از میان درختان می‌گذرد و لایه‌های سبز جنگل در افق محو می‌شوند.',
    highlights: ['چشم‌انداز جنگلی شاهرود', 'مه میان درختان', 'دامنه‌های پوشیده از جنگل'],
    imageCredit: DESTINATION_IMAGE_CREDITS.abr
  },
  {
    id: 'neor', title: 'دریاچهٔ نئور',
    country: 'ایران', province: 'اردبیل', city: 'اردبیل', category: 'water', categoryLabel: 'دریاچه و چشمه',
    image: '/images/iran/neor.webp', imagePosition: 'center 55%',
    description: 'پهنهٔ آرام آب در میان ارتفاعات و مرغزارها؛ منظره‌ای باز از آسمان و کوهستان.',
    highlights: ['دریاچهٔ کوهستانی', 'مرغزارهای پیرامون', 'چشم‌انداز ارتفاعات اردبیل'],
    imageCredit: DESTINATION_IMAGE_CREDITS.neor
  },
  {
    id: 'uraman', title: 'اورامانات',
    country: 'ایران', province: 'کردستان', city: 'سروآباد', category: 'mountain', categoryLabel: 'کوهستان و روستا',
    image: '/images/iran/uraman.webp', imagePosition: 'center 55%',
    description: 'خانه‌های پلکانی بر دامنهٔ کوه؛ پیوند معماری، فرهنگ و طبیعت در قلب زاگرس.',
    highlights: ['معماری پلکانی روستاها', 'چشم‌انداز کوه‌های زاگرس', 'فرهنگ و زندگی محلی'],
    imageCredit: DESTINATION_IMAGE_CREDITS.uraman
  },
  {
    id: 'bisheh', title: 'آبشار بیشه',
    country: 'ایران', province: 'لرستان', city: 'خرم‌آباد', category: 'water', categoryLabel: 'آبشار و چشمه',
    image: '/images/iran/bisheh.webp', imagePosition: 'center 45%',
    description: 'آبشاری در دل زاگرس، میان صخره‌ها و درختان؛ تماشای طبیعت از نزدیک.',
    highlights: ['آبشار و صخره‌های پیرامون', 'طبیعت زاگرس', 'سبزی دامنه‌های لرستان'],
    imageCredit: DESTINATION_IMAGE_CREDITS.bisheh
  },
  {
    id: 'chabahar', title: 'کوه‌های مریخی چابهار',
    country: 'ایران', province: 'سیستان و بلوچستان', city: 'چابهار', category: 'mountain', categoryLabel: 'کوهستان و زمین‌شناسی',
    image: '/images/iran/chabahar.webp', imagePosition: 'center 55%',
    description: 'کوه‌های مینیاتوری با شیارهای ظریف و شکل‌هایی فرازمینی در جنوب‌شرق ایران.',
    highlights: ['سازه‌های مینیاتوری زمین', 'شیارها و لایه‌های کوه', 'مناظر متفاوت بلوچستان'],
    imageCredit: DESTINATION_IMAGE_CREDITS.chabahar
  },
  {
    id: 'maranjab', title: 'کویر مرنجاب',
    country: 'ایران', province: 'اصفهان', city: 'آران و بیدگل', category: 'desert', categoryLabel: 'کویر و سکوت',
    image: '/images/iran/maranjab.webp', imagePosition: 'center 55%',
    description: 'رمل‌های نرم و خط‌های روان شن؛ چشم‌اندازی مینیمال در نزدیکی آران و بیدگل.',
    highlights: ['تپه‌های شنی', 'بافت‌ها و موج‌های شن', 'چشم‌انداز باز کویری'],
    imageCredit: DESTINATION_IMAGE_CREDITS.maranjab
  },
  {
    id: 'darak', title: 'ساحل درک',
    country: 'ایران', province: 'سیستان و بلوچستان', city: 'زرآباد', category: 'coast', categoryLabel: 'دریا و ساحل',
    image: '/images/iran/darak.webp', imagePosition: 'center 55%',
    description: 'آنجا که شن‌های طلایی به دریای عمان می‌رسند؛ تلاقی دو دنیای متفاوت در یک قاب.',
    highlights: ['هم‌نشینی کویر و دریا', 'ساحل دریای عمان', 'تپه‌های شنی کنار آب'],
    imageCredit: DESTINATION_IMAGE_CREDITS.darak
  }
];





export const BOOKING_STEPS: BookingStep[] = [
  {
    number: '۰۱',
    title: 'مقصد را انتخاب کنید',
    description: 'ابتدا مقصد مورد نظر خود را انتخاب کنید و ادامه مطلب را بخوانید',
    iconName: 'MapPin'
  },
  {
    number: '۰۲',
    title: 'انتخاب‌ها را در سبد کامل کنید',
    description: 'تعداد نفرات و تاریخ پیشنهادی را برای برنامه‌های انتخابی مشخص کنید',
    iconName: 'CreditCard'
  },
  {
    number: '۰۳',
    title: 'درخواست هماهنگی را ارسال کنید',
    description: 'اطلاعات تماس را وارد کنید تا تاریخ، ظرفیت و شرایط نهایی برنامه بررسی شود',
    iconName: 'Luggage'
  }
];

