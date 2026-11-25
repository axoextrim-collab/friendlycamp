import { BookOpenText, Compass, LayoutDashboard, Settings2, UserRound, WalletCards } from 'lucide-react';

export const PROFILE_NAVIGATION = [
  { id: 'home', label: 'خانه همسفر', icon: LayoutDashboard, items: [
    { id: 'overview', label: 'نمای کلی', description: 'خلاصه‌ای از حساب و همراهی تو با فرندلی کمپ.' },
    { id: 'checklist', label: 'چک‌لیست آمادگی', description: 'اطلاعاتی که پیش از سفر بهتر است کامل کنی.' },
  ] },
  { id: 'account', label: 'حساب کاربری', icon: UserRound, items: [
    { id: 'identity', label: 'اطلاعات حساب', description: 'نام، راه‌های ارتباطی و اطلاعات ورود به حساب.' },
    { id: 'contact', label: 'مشخصات فردی و تماس', description: 'کمی درباره خودت و راه تماس در شرایط اضطراری.' },
    { id: 'security', label: 'رمز عبور و امنیت', description: 'رمز تازه‌ای برای ورود به حسابت انتخاب کن.' },
  ] },
  { id:'bookings',label:'رزرو و پشتیبانی',icon:Compass,items:[{id:'favoriteTours',label:'تورهای ذخیره‌شده',description:'علاقه‌مندی‌های واقعی ذخیره‌شده در حساب.'},{id:'capacityAlerts',label:'اعلان ظرفیت',description:'رویدادهای کاهش ظرفیت نوبت‌های تحت پیگیری.'},{id:'bookings',label:'رزروهای من',description:'وضعیت رزروهای متصل به حساب و پیگیری پرداخت.'},{id:'invoices',label:'رسید و صورت‌حساب',description:'رسیدهای صادرشده و جزئیات مبلغ رزرو.'},{id:'support',label:'شکایت و پشتیبانی',description:'پرونده‌های ثبت‌شده هنگام ورود به این حساب.'}]},
  { id: 'travel', label: 'پروفایل سفر', icon: Compass, items: [
    { id: 'interests', label: 'سبک و علاقه‌مندی‌ها', description: 'سفر را آن‌طور که دوست داری به ما معرفی کن.' },
    { id: 'equipment', label: 'آمادگی و تجهیزات', description: 'تجربه، توان پیمایش و وسایلی که همراه داری.' },
    { id: 'health', label: 'سلامت و بیمه', description: 'اطلاعات موردنیاز برای هماهنگی بهتر سفر.' },
  ] },
  { id: 'membership', label: 'کیف پول و عضویت', icon: WalletCards, items: [
    { id: 'wallet', label: 'کیف پول و گردش حساب', description: 'موجودی و ریز سوابق مالی ثبت‌شده در حساب.' },
    { id: 'club', label: 'عضویت و کارت‌ها', description: 'وضعیت عضویت، امتیازها و کارت‌های باشگاه.' },
  ] },
  { id: 'journal', label: 'سفرنامه و رسانه', icon: BookOpenText, items: [
    { id: 'stories', label: 'سفرنامه‌های من', description: 'روایت‌هایی که در فضای شخصی خودت ذخیره کرده‌ای.' },
    { id: 'write', label: 'نوشتن سفرنامه', description: 'از مسیر، مقصد و لحظه‌های سفرت بنویس.' },
    { id: 'media', label: 'عکس و پادکست', description: 'فایل‌های سفر را بارگذاری و در حساب نگهداری کن.' },
  ] },
  { id: 'settings', label: 'تنظیمات', icon: Settings2, items: [
    { id: 'privacy', label: 'حریم خصوصی', description: 'ترجیحات نمایش اطلاعات و ارتباط با همسفرها.' },
    { id: 'appearance', label: 'نمایش و دسترس‌پذیری', description: 'رنگ، اندازه نوشته و حرکت‌ها را متناسب با خودت تنظیم کن.' },
    { id: 'notifications', label: 'ترجیحات ارتباطی', description: 'کانال‌ها و موضوع‌های مورد علاقه برای دریافت خبر.' },
  ] },
] as const;

export type ProfilePage = typeof PROFILE_NAVIGATION[number]['items'][number]['id'];
export const PROFILE_PAGES = PROFILE_NAVIGATION.flatMap(group => [...group.items]);
export const profilePageFromHash = (hash: string): ProfilePage => PROFILE_PAGES.find(item => item.id === hash.replace(/^#/, ''))?.id || 'overview';
