import { LayoutDashboard, Map, CalendarDays, Mountain, Compass, ShoppingBag, Wallet, Users, UserCog, Headphones, Mail, Send, FileText, PenLine, MessageSquare, SlidersHorizontal, ShieldCheck, Phone, Share2, Palette, Activity, History, Tag, ChartNoAxesCombined, Settings2 } from 'lucide-react';
import { RESOURCE_LABELS, canManage, type ControlResource, type AccountRole } from '../types/control';

export type AdminTab=ControlResource|'overview'|'reports'|'reservations'|'store'|'finance'|'customers'|'staff'|'support'|'messages'|'newsletter'|'design'|'system'|'audit'|'settings';
export const ADMIN_NAMES:Record<AdminTab,string>={...RESOURCE_LABELS,overview:'داشبورد',reports:'گزارش‌های مدیریتی',reservations:'حرکت‌ها و رزروها',store:'مدیریت فروشگاه',finance:'امور مالی',customers:'اعضای باشگاه',staff:'تیم و دسترسی‌ها',support:'مرکز پشتیبانی',messages:'پیام‌ها و مشاوره',newsletter:'خبرنامه',design:'ظاهر و تجربه سایت',system:'زیرساخت و سرویس‌ها',audit:'تاریخچه فعالیت‌ها',settings:'تنظیمات اصلی'};
export const ADMIN_ICONS={overview:LayoutDashboard,reports:ChartNoAxesCombined,tours:Mountain,reservations:CalendarDays,destinations:Map,leaders:Compass,coupons:Tag,store:ShoppingBag,finance:Wallet,customers:Users,staff:UserCog,support:Headphones,messages:Mail,newsletter:Send,articles:FileText,authors:PenLine,comments:MessageSquare,homeText:SlidersHorizontal,policies:FileText,licenses:ShieldCheck,contact:Phone,social:Share2,design:Palette,system:Activity,audit:History,settings:Settings2};
export const ADMIN_GROUPS:Array<{id:string;title:string;items:AdminTab[]}>= [
  {id:'workspace',title:'مرکز مدیریت',items:['overview','reports']},
  {id:'travel',title:'سفر و عملیات',items:['tours','reservations','destinations','leaders','coupons']},
  {id:'commerce',title:'فروشگاه و مالی',items:['store','finance']},
  {id:'community',title:'اعضا و ارتباطات',items:['customers','staff','support','messages','newsletter']},
  {id:'content',title:'محتوا و انتشار',items:['articles','authors','comments','homeText']},
  {id:'settings',title:'تنظیمات و نظارت',items:['settings','contact','social','design','policies','licenses','system','audit']},
];
export interface AdminPage {id:string;title:string;description:string;filter?:string}
const page=(id:string,title:string,description:string,filter?:string):AdminPage=>({id,title,description,filter});
const contentPages=(title:string)=>[page('list',`فهرست ${title}`,'جستجو، ویرایش و مدیریت موارد ثبت‌شده.'),page('new',`ایجاد ${title}`,'ثبت اطلاعات و تکمیل فرم اختصاصی.'),page('review','در انتظار انتشار','بررسی پیش‌نویس‌ها و درخواست انتشار.','review')];
export const ADMIN_PAGES:Record<AdminTab,AdminPage[]>={
 overview:[page('summary','نمای کلی مجموعه','خلاصه فعالیت، ظرفیت و اولویت‌های رسیدگی.'),page('tasks','میز کار و پیگیری‌ها','اقدام‌های باز و دسترسی به مسئول رسیدگی.')],
 reports:[page('activity','گزارش عملکرد','روند رزروها و وضعیت مجموعه.'),page('financial','گزارش جریان وجوه','دریافتی و استرداد واقعی در بازه انتخابی.')],
 tours:contentPages('تورها'),
 reservations:[page('departures','تقویم حرکت و ظرفیت','تاریخ، مبدأ، ظرفیت و قیمت هر حرکت.'),page('new','تعریف نوبت حرکت','ثبت فرم حرکت و شرایط رزرو آن.'),page('bookings','پرونده رزرو مسافران','بررسی وضعیت رزرو، پرداخت و پیامک.'),page('refunds','لغو و استرداد','رسیدگی به رزروهای در انتظار استرداد.')],
 destinations:[...contentPages('مقصدها'),page('weather','گزارش آب‌وهوا','ویرایش گزارش مستند در فرم هر مقصد.')],
 leaders:[...contentPages('لیدرها'),page('credentials','مدارک و صلاحیت‌ها','مشاهده و تکمیل مدارک در پرونده هر لیدر.')],
 coupons:[page('list','فهرست تخفیف‌ها','مدیریت اعتبار و محدودیت استفاده.'),page('new','تعریف کد تخفیف','ثبت مبلغ، بازه اعتبار و تورهای مجاز.')],
 store:[page('orders','سفارش‌های فروشگاه','بررسی گیرنده، اقلام و مراحل اجرای سفارش.'),page('products','کالاها و موجودی','مدیریت قیمت، موجودی و شرایط ضمانت.'),page('new','افزودن کالای جدید','ثبت مشخصات و تصویر کالا.'),page('low-stock','کنترل کمبود موجودی','کالاهای فعال با موجودی سه عدد یا کمتر.')],
 finance:[page('transactions','دفتر تراکنش‌ها','مشاهده مبالغ و رسیدهای واقعی.'),page('refunds','استردادهای باز','پیگیری پرونده‌های باز حتی خارج از بازه گزارش.','refund_pending'),page('export','خروجی و گزارش مالی','تنظیم بازه و دریافت فایل تراکنش‌ها.')],
 customers:[page('members','فهرست اعضای باشگاه','اطلاعات تماس و سوابق مرتبط با حساب.','user'),page('accounts','تمام حساب‌ها','فهرست حساب‌های اعضا و همکاران.','all')],
 staff:[page('members','اعضای تیم','مدیریت نقش و دسترسی همکاران.'),page('new','افزودن همکار','ساخت حساب همکار با نقش مشخص.'),page('permissions','ماتریس دسترسی‌ها','محدوده مجاز مدیر، نویسنده، پشتیبان و مسئول رزرو.')],
 support:[page('open','پرونده‌های باز','درخواست‌های جدید و پرونده‌های در حال رسیدگی.','open'),page('waiting','در انتظار پاسخ','پرونده‌هایی که منتظر اطلاعات بیشتر هستند.','waiting'),page('closed','بایگانی پرونده‌ها','پرونده‌های بسته‌شده پشتیبانی.','closed')],
 messages:[page('inbox','صندوق ورودی','پیام‌ها و درخواست‌های مشاوره.'),page('pending','در حال پیگیری','پیام‌های ارجاع‌شده و منتظر رسیدگی.','pending'),page('closed','پیام‌های بسته‌شده','سوابق رسیدگی و یادداشت‌های تیم.','closed')],
 newsletter:[page('subscribers','فهرست اعضا','وضعیت عضویت و رضایت ثبت‌شده.'),page('export','دریافت خروجی','خروجی اعضای فعال همراه با زمان رضایت.')],
 articles:contentPages('مقالات'),authors:[page('list','فهرست نویسندگان','حساب محتوایی نویسنده و معرفی او.'),page('new','افزودن نویسنده','فرم معرفی نویسنده مقاله.')],
 comments:[page('pending','در انتظار تأیید','بررسی متن و رضایت انتشار نظر.','pending'),page('published','نظرات منتشرشده','مشاهده و مدیریت نظرهای منتشرشده.','published'),page('rejected','نظرات ردشده','بازبینی نتیجه بررسی نظرها.','rejected')],
 homeText:[page('list','محتوای صفحه اصلی','ویرایش متن هر بخش صفحه و ثبت نسخه جدید.'),page('review','متن‌های در انتظار بررسی','بازبینی درخواست انتشار متن‌ها.','review')],
 settings:[page('general','اطلاعات سایت و سئو','نام مجموعه، عنوان و توضیحات صفحه اصلی.'),page('booking','تنظیمات رزرو','مدت نگهداری ظرفیت تا تکمیل پرداخت.'),page('payment','درگاه پرداخت','انتخاب حالت و تنظیم رابط سرویس پرداخت.'),page('sms','سرویس پیامک','پیکربندی رابط ارسال رسید پیامکی.'),page('security','امنیت حساب مدیر','تغییر رمز ورود حساب فعلی.')],
 contact:[page('edit','اطلاعات تماس و دفتر','شماره تماس، ایمیل، نشانی و ساعات پاسخ‌گویی.')],
 social:[page('list','حساب‌های اجتماعی','مدیریت نشانی‌های قابل انتشار.'),page('new','افزودن شبکه اجتماعی','ثبت نشانی کامل و وضعیت نمایش.')],
 design:[page('colors','پالت رنگ و تم سایت','انتخاب تم روشن و تیره، پالت آماده و رنگ‌های اختصاصی.'),page('typography','تایپوگرافی','فونت، اندازه و خوانایی متن‌ها.'),page('image','استاندارد تصاویر','ابعاد و نحوه نمایش تصاویر.'),page('slider','حرکت و اسلایدر','زمان‌بندی و کنترل حرکت اسلایدها.'),page('channels','تنظیمات هر اسلایدر','تنظیم مستقل بخش‌های مختلف سایت.')],
 policies:[page('list','تمام اسناد حقوقی','فهرست اسناد و وضعیت انتشار آن‌ها.'),page('terms','قوانین و مقررات','فرم ویرایش متن مصوب قوانین.'),page('privacy','حریم خصوصی','شرایط نگهداری و استفاده از اطلاعات کاربران.'),page('cancellation','لغو و استرداد','شرایط مصوب لغو و بازگشت وجه.'),page('insurance','بیمه سفر','اطلاعات و حدود پوشش بیمه.'),page('legal','اطلاعات حقوقی','نام حقوقی، شناسه فعالیت و مستندات.'),page('faq','پرسش‌های متداول','پاسخ‌های مصوب پرسش‌های عمومی.'),page('support','ثبت شکایت و پیگیری','روش ارتباط و رسیدگی به شکایت.')],
 licenses:[page('list','فهرست مجوزها','مدارک فعالیت و استعلام اعتبار.'),page('new','ثبت مجوز','اطلاعات مرجع، شماره و محدوده اعتبار.')],
 system:[page('status','سلامت سرویس‌ها','وضعیت پایگاه داده، فایل‌ها، پرداخت و پیامک.'),page('connections','راهنمای اتصال‌ها','وضعیت فعلی و مسیر تنظیم سرویس‌ها.')],
 audit:[page('all','تمام فعالیت‌ها','تاریخچه تغییرات تیم.'),page('content','تغییرات محتوا','رویدادهای ثبت و انتشار محتوا.'),page('staff','تغییر دسترسی‌ها','سوابق تغییر نقش همکاران.'),page('settings','تغییر تنظیمات','سوابق تنظیمات مجموعه و سرویس‌ها.'),page('reservations','عملیات رزرو','رویدادهای رزرو، پرداخت و استرداد.')],
};
export function adminPermitted(role:AccountRole,tab:AdminTab){return canManage(role,tab==='support'?'messages':tab);}
export function adminRoute(hash:string){
 const [path,intent='']=hash.replace(/^#\/?/,'').split('?'),[name,child]=path.split('/'),tab=Object.hasOwn(ADMIN_NAMES,name)?name as AdminTab:'overview',params=new URLSearchParams(intent);
 const requested=child||(params.has('new')?'new':params.has('edit')?'edit':ADMIN_PAGES[tab][0].id);
 const view=requested==='edit'||ADMIN_PAGES[tab].some(p=>p.id===requested)?requested:ADMIN_PAGES[tab][0].id;
 return {tab,view,intent};
}
export function adminNavigate(target:string){window.location.hash=target;}
