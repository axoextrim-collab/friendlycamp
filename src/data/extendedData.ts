export interface WeatherInfo {
  locationId: string;
  locationName: string;
  country: string;
  temp: number; // Celsius
  condition: string;
  iconName: 'Sun' | 'CloudSun' | 'CloudRain' | 'Wind' | 'Snowflake';
  feelsLike: number;
  humidity: number; // percentage
  windSpeed: number; // km/h
  uvIndex: number;
  tip: string;
  forecast: {
    day: string;
    temp: number;
    condition: string;
    iconName: 'Sun' | 'CloudSun' | 'CloudRain' | 'Wind' | 'Snowflake';
  }[];
}

export interface MapPOI {
  id: string;
  title: string;
  category: string;
  x: number; // percentage on map overlay 0-100
  y: number; // percentage on map overlay 0-100
  description: string;
  image: string;
  timeEst?: string;
}

export interface TourMapData {
  tourId: string;
  tourTitle: string;
  regionName: string;
  bgType: 'island' | 'coastal' | 'mountain';
  pois: MapPOI[];
}

export const WEATHER_DATA: Record<string, WeatherInfo> = {
  'tour-1': {
    locationId: 'tour-1',
    locationName: 'بالی',
    country: 'اندونزی',
    temp: 29,
    condition: 'آفتابی و استوایی',
    iconName: 'Sun',
    feelsLike: 32,
    humidity: 76,
    windSpeed: 12,
    uvIndex: 9,
    tip: 'عالی برای تورهای ساحلی و شنا! کرم ضدآفتاب و عینک آفتابی فراموش نشود.',
    forecast: [
      { day: 'فردا', temp: 30, condition: 'آفتابی', iconName: 'Sun' },
      { day: 'پس‌فردا', temp: 28, condition: 'باران ملایم استوایی', iconName: 'CloudRain' },
      { day: '۳ روز بعد', temp: 29, condition: 'نیمه ابری', iconName: 'CloudSun' }
    ]
  },
  'tour-2': {
    locationId: 'tour-2',
    locationName: 'توکیو',
    country: 'ژاپن',
    temp: 22,
    condition: 'مطبوع و دلپذیر',
    iconName: 'CloudSun',
    feelsLike: 23,
    humidity: 58,
    windSpeed: 16,
    uvIndex: 5,
    tip: 'هوای ایده‌آل برای پیاده‌روی شهری و عکاسی از شکوفه‌های گیلاس و مناظر کوه فوجی.',
    forecast: [
      { day: 'فردا', temp: 23, condition: 'آفتابی روشن', iconName: 'Sun' },
      { day: 'پس‌فردا', temp: 21, condition: 'نسیم خنک', iconName: 'Wind' },
      { day: '۳ روز بعد', temp: 22, condition: 'نیمه ابری', iconName: 'CloudSun' }
    ]
  },
  'tour-3': {
    locationId: 'tour-3',
    locationName: 'آلپ',
    country: 'سوئیس',
    temp: 16,
    condition: 'هوای تازه کوهستانی',
    iconName: 'Wind',
    feelsLike: 15,
    humidity: 45,
    windSpeed: 10,
    uvIndex: 6,
    tip: 'کاپشن سبک و کفش مخصوص کوه‌نوردی همراه داشته باشید.',
    forecast: [
      { day: 'فردا', temp: 17, condition: 'آفتابی خنک', iconName: 'Sun' },
      { day: 'پس‌فردا', temp: 14, condition: 'بارش باران در ارتفاعات', iconName: 'CloudRain' },
      { day: '۳ روز بعد', temp: 15, condition: 'صاف و آفتابی', iconName: 'Sun' }
    ]
  },
  'vietnam': {
    locationId: 'vietnam',
    locationName: 'هانوی و هالونگ بئی',
    country: 'ویتنام',
    temp: 28,
    condition: 'گرمای استوایی همراه با نسیم دریا',
    iconName: 'Sun',
    feelsLike: 31,
    humidity: 82,
    windSpeed: 14,
    uvIndex: 8,
    tip: 'فوق‌العاده برای قایق‌رانی در خلیج هالونگ و گشت و گذار در جنگل‌های بکر.',
    forecast: [
      { day: 'فردا', temp: 29, condition: 'آفتابی', iconName: 'Sun' },
      { day: 'پس‌فردا', temp: 28, condition: 'نیمه ابری', iconName: 'CloudSun' },
      { day: '۳ روز بعد', temp: 30, condition: 'آفتابی با رطوبت', iconName: 'Sun' }
    ]
  }
};

export const TOUR_MAPS_DATA: Record<string, TourMapData> = {
  'tour-1': {
    tourId: 'tour-1',
    tourTitle: 'تور طبیعتی و ساحلی جزیره بالی',
    regionName: 'جزیره بالی، اندونزی',
    bgType: 'island',
    pois: [
      {
        id: 'p-1',
        title: 'معبد اولوواتو (Uluwatu)',
        category: 'میراث فرهنگی و صخره ساحلی',
        x: 22,
        y: 75,
        description: 'معبد باستانی مشرف به اقیانوس هند با چشم‌انداز غروب طلایی و اجرای رقص سنتی کچاک.',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400',
        timeEst: 'ایستگاه اول - روز اول'
      },
      {
        id: 'p-2',
        title: 'جنگل مقدس میمون‌ها (Ubud)',
        category: 'طبیعت‌گردی و حیات وحش',
        x: 48,
        y: 50,
        description: 'جنگل سرسبز استوایی با درختان کهنسال، مجسمه‌های تاریخی و صدها میمون بازیگوش بومی.',
        image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=400',
        timeEst: 'ایستگاه دوم - روز دوم'
      },
      {
        id: 'p-3',
        title: 'شالیزارهای پلکانی تگالالانگ',
        category: 'جاذبه طبیعی پدیده‌ای',
        x: 62,
        y: 32,
        description: 'منظره فوق‌العاده شالیزارهای مطبق در میان کوهستان با امکان تاب‌سواری استوایی.',
        image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=400',
        timeEst: 'ایستگاه سوم - روز دوم'
      },
      {
        id: 'p-4',
        title: 'آبشار چندطبقه سکومپول',
        category: 'ماجراجویی در طبیعت',
        x: 80,
        y: 20,
        description: 'زیباترین و بلندترین مجموعه آبشارهای خروشان بالی در دل جنگل‌های استوایی.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400',
        timeEst: 'ایستگاه چهارم - روز سوم'
      }
    ]
  },
  'tour-2': {
    tourId: 'tour-2',
    tourTitle: 'تور مدرن و سنتی توکیو سیتی',
    regionName: 'منطقه توکیو و کوه فوجی، ژاپن',
    bgType: 'coastal',
    pois: [
      {
        id: 'p-21',
        title: 'برج توکیو (Tokyo Tower)',
        category: 'نماد معماری و عرشه دیدبانی',
        x: 28,
        y: 68,
        description: 'دیدگاه ۳۶۰ درجه از کلان‌شهر توکیو و شب‌های پرنور با چراغ‌های نئونی.',
        image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=400',
        timeEst: 'روز اول - عصر'
      },
      {
        id: 'p-22',
        title: 'معبد تاریخی سنسوجی (Asakusa)',
        category: 'معماری کهن ژاپنی',
        x: 62,
        y: 35,
        description: 'قدیمی‌ترین معبد توکیو با دروازه فانوس قرمز بزرگ و بازارچه‌های سنتی خرید سوغات.',
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=400',
        timeEst: 'روز دوم - صبح'
      },
      {
        id: 'p-23',
        title: 'کوه فوجی و دریاچه کاواگوچیکو',
        category: 'طبیعت کوهستانی شاهکار',
        x: 18,
        y: 32,
        description: 'نمای افسانه‌ای قله برفی فوجی انعکاس یافته روی آب‌های آرام دریاچه کاواگوچیکو.',
        image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400',
        timeEst: 'روز سوم - صبح تا غروب'
      }
    ]
  },
  'tour-3': {
    tourId: 'tour-3',
    tourTitle: 'تور قطار پانورامیک و قله‌های سوئیس',
    regionName: 'رشته کوه‌های آلپ، سوئیس',
    bgType: 'mountain',
    pois: [
      {
        id: 'p-31',
        title: 'شهر و دریاچه لوسرن (Lucerne)',
        category: 'شهر ساحلی با پل چوبی تاریخی',
        x: 32,
        y: 42,
        description: 'پیاده‌روی روی پل چوبی کپلوبروكه و قایق‌سواری روی دریاچه زلال آلپ.',
        image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80&w=400',
        timeEst: 'روز اول'
      },
      {
        id: 'p-32',
        title: 'ایستگاه قطار یونگفراویوخ (Jungfraujoch)',
        category: 'بام اروپا - ارتفاع ۳۴۵۴ متر',
        x: 58,
        y: 65,
        description: 'سفر با قطار برقی کوهستانی به بالاترین ایستگاه راه‌آهن اروپا و کاخ یخی.',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=400',
        timeEst: 'روز دوم'
      },
      {
        id: 'p-33',
        title: 'دهکده سرسبز گریندلوالد',
        category: 'کمپ و پیاده‌روی کوهستانی',
        x: 75,
        y: 48,
        description: 'دهکده رویایی خُرد در دامنه دیواره صخره‌ای ایگر با کلبه‌های چوبی سوئیسی.',
        image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=400',
        timeEst: 'روز سوم'
      }
    ]
  }
};
