import { Destination, Tour, Service, BlogPost, BookingStep, StatItem } from '../types';

export const POPULAR_DESTINATIONS: Destination[] = [
  {
    id: '1',
    title: 'برج ساعت سن مالو',
    country: 'فرانسه',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    toursCount: 14,
    price: '۱۲,۵۰۰,۰۰۰ تومان',
    rating: 4.9
  },
  {
    id: '2',
    title: 'قلعه ماتسوموتو',
    country: 'ژاپن',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800',
    toursCount: 22,
    price: '۱۸,۰۰۰,۰۰۰ تومان',
    rating: 4.8
  },
  {
    id: '3',
    title: 'کلیسای جامع گوتیک',
    country: 'ایتالیا',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=800',
    toursCount: 18,
    price: '۱۵,۲۰۰,۰۰۰ تومان',
    rating: 4.9
  },
  {
    id: '4',
    title: 'دره و جنگل‌های سرسبز ویتنام',
    country: 'ویتنام',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=800',
    toursCount: 29,
    price: '۹,۸۰۰,۰۰۰ تومان',
    rating: 5.0
  },
  {
    id: '5',
    title: 'جزایر گرمسیری بالی',
    country: 'اندونزی',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    toursCount: 35,
    price: '۱۴,۰۰۰,۰۰۰ تومان',
    rating: 4.9
  }
];

export const POPULAR_TOURS: Tour[] = [
  {
    id: 'tour-1',
    title: 'کمپینگ جنگل‌های بارانی گیلان و اسالم',
    location: 'جنگل‌های اسالم و تالش، ایران',
    country: 'ایران',
    image: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?auto=format&fit=crop&q=80&w=800',
    duration: '۳ روز و ۲ شب',
    price: '۴,۸۰۰,۰۰۰ تومان',
    rating: 4.9,
    reviewsCount: 184,
    highlights: ['پیاده‌روی در دالان‌های مه آلود', 'چادرزنی در کمپ اختصاصی ضدآب', 'شب‌نشینی و آتش‌بازی شبانه'],
    featured: true
  },
  {
    id: 'tour-2',
    title: 'پیمایش آبشارهای استوایی بالی',
    location: 'جنگل‌های استوایی بالی، اندونزی',
    country: 'اندونزی',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=800',
    duration: '۷ روز و ۶ شب',
    price: '۲۴,۵۰۰,۰۰۰ تومان',
    rating: 4.9,
    reviewsCount: 124,
    highlights: ['آبشارگردی در دل جنگل بارانی', 'قایق‌رانی در رودخانه خروشان', 'اقامت در اکولاج‌های جنگلی'],
    featured: true
  },
  {
    id: 'tour-3',
    title: 'کمپینگ و کوهنوردی آلپ سوئیس',
    location: 'آلپ، سوئیس',
    country: 'سوئیس',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80&w=800',
    duration: '۸ روز و ۷ شب',
    price: '۳۸,۹۰۰,۰۰۰ تومان',
    rating: 5.0,
    reviewsCount: 210,
    highlights: ['قطار پانورامیک آلپ', 'کمپینگ پیشرفته کوهستانی', 'پیمایش مسیرهای بکر صخره‌ای'],
    featured: true
  },
  {
    id: 'tour-4',
    title: 'سافاری و کمپینگ حیات وحش کنیا',
    location: 'پارک ملی ماسایی مارا، کنیا',
    country: 'کنیا',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800',
    duration: '۶ روز و ۵ شب',
    price: '۳۲,۰۰۰,۰۰۰ تومان',
    rating: 4.8,
    reviewsCount: 95,
    highlights: ['عکاسی از حیات وحش استوایی', 'شب‌مانی در کمپر لوکس', 'تورهای سافاری طلوع خورشید'],
    featured: true
  },
  {
    id: 'tour-5',
    title: 'جنگل‌نوردی و دریاچه ماری ژاپن',
    location: 'ناکانو، ژاپن',
    country: 'ژاپن',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    duration: '۵ روز و ۴ شب',
    price: '۲۹,۵۰۰,۰۰۰ تومان',
    rating: 4.9,
    reviewsCount: 112,
    highlights: ['کمپینگ در دریاچه کاواگوچیکو', 'چشمه‌های آبگرم طبیعی', 'پیمایش جنگل‌های کهنسال بامبو'],
    featured: true
  }
];

export const SERVICES: Service[] = [
  {
    id: 's-1',
    title: 'راهنمای حرفه‌ای',
    description: 'در طول تعطیلات، راهنماهای حرفه‌ای ما شما را راهنمایی خواهند کرد.',
    icon: 'Compass',
    colorClass: 'bg-emerald-500',
    badgeColor: 'border-b-4 border-emerald-500'
  },
  {
    id: 's-2',
    title: 'رزرو آسان',
    description: 'فرآیند سریع و آنلاین جهت رزرو تورها و هتل‌های مورد علاقه شما.',
    icon: 'CalendarCheck',
    colorClass: 'bg-amber-500',
    badgeColor: 'border-b-4 border-amber-500'
  },
  {
    id: 's-3',
    title: 'سفر انحصاری',
    description: 'ما به هر کیفیتی در خدماتی که به شما ارائه می‌دهیم توجه می‌کنیم.',
    icon: 'Crown',
    colorClass: 'bg-blue-500',
    badgeColor: 'border-b-4 border-blue-500'
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
    title: 'پرداخت را انجام دهید',
    description: 'ما به هر کیفیتی در خدماتی که به شما ارائه می‌دهیم توجه می‌کنیم',
    iconName: 'CreditCard'
  },
  {
    number: '۰۳',
    title: 'آماده برای سفر',
    description: 'مدارک و وسایل خود را جمع‌آوری کرده و آماده تجربه ماجراجویی شوید',
    iconName: 'Luggage'
  }
];

export const HERO_STATS: StatItem[] = [
  { value: '2018', label: 'تاسیس فرندلی کمپ', icon: 'Award' },
  { value: '+۸۵۰', label: 'اجرای تور کمپینگ', icon: 'PlaneTakeoff' },
  { value: '+۵۰۰۰', label: 'همنورد همراه', icon: 'Users' },
  { value: '100%', label: 'رضایت مسافران', icon: 'Trophy' }
];

export const BRAND_PARTNERS = [
  { name: 'ADVENTURE', subtitle: 'TRAVEL CO' },
  { name: 'travelWORLD', subtitle: 'EXPLORE MORE' },
  { name: 'TRAVELLING', subtitle: 'THE WORLD' },
  { name: 'Roadtrip', subtitle: 'ADVENTURE TRAVEL' },
  { name: 'BUSINESS', subtitle: 'TRAVEL GROUP' }
];

export const DESTINATION_TAGS = [
  { name: 'تایلند', tours: '۴۵۰ تور' },
  { name: 'پاریس', tours: '۳۵۰ تور' },
  { name: 'لندن', tours: '۳۵۰ تور' },
  { name: 'فرانسه', tours: '۱۲۵۰ تور' },
  { name: 'دبی', tours: '۱۳۵۰ تور' },
  { name: 'بانکوک', tours: '۱۷۵۰ تور' }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'b-main',
    title: 'راهنمای جامع طبیعت‌گردی و کمپینگ در جنگل‌های بکر',
    author: 'سامان ملک',
    date: '۰۸ ژوئن',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
    category: 'طبیعت‌گردی',
    summary: 'شاید برای یک وبلاگ مسافرتی، سایت حیات وحش یا پروژه توسعه وب، در اینجا چند نمونه الگو وجود دارد که می‌توانید برای شبیه‌سازی به‌روزرسانی‌های خبری استفاده کنید.',
    isFeatured: true
  },
  {
    id: 'b-1',
    title: 'منابع برای اولین سفر شما به تعطیلات خارج از کشور',
    author: 'آیدان باتلر',
    authorImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    date: '۱۲ ژوئن',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=400',
    category: 'پول وارد'
  },
  {
    id: 'b-2',
    title: 'راهنمای گام به گام برای برنامه‌ریزی تعطیلات ایده‌آل شما',
    author: 'پاول وارد',
    authorImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    date: '۱۵ ژوئن',
    image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&q=80&w=400',
    category: 'راهنمای سفر'
  },
  {
    id: 'b-3',
    title: 'چگونه با بومیان یک سرزمین غریب آشنا شویم',
    author: 'ریکاردو بل',
    authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    date: '۲۶ ژوئن',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&q=80&w=400',
    category: 'فرهنگ سفر'
  }
];
