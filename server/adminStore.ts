import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export type AdminResource = 'tours'|'bookings'|'products'|'customers'|'content'|'tickets';
export type AdminRecord = Record<string, unknown> & { id: string; updatedAt: string };
export type AdminSettings = {
  typography: { headingFont:string; bodyFont:string; baseSize:number; headingWeight:number; bodyWeight:number; lineHeight:number; letterSpacing:number };
  image: { width:number; height:number; quality:number; format:string; fit:string; focalPoint:string; brightness:number; contrast:number; saturation:number; overlay:number; borderRadius:number };
  slider: { autoplay:boolean; interval:number; transition:string; transitionDuration:number; pauseOnHover:boolean; showArrows:boolean; showDots:boolean; kenBurns:boolean; reducedMotionFallback:boolean };
  channels: Record<string,{ enabled:boolean; title:string; width:number; height:number; interval:number; transition:string; overlay:number; focalPoint:string }>;
};
type AdminDatabase = Record<AdminResource, AdminRecord[]> & { audit: AdminRecord[]; settings: AdminSettings };

const FILE = path.join(process.cwd(), 'data', 'admin.json');
const now = () => new Date().toISOString();
const item = (data: Record<string, unknown>): AdminRecord => ({ id: crypto.randomUUID(), updatedAt: now(), ...data });

function seed(): AdminDatabase {
  return {
    tours: [
      item({ code:'FC-GL-210', title:'کمپ جنگل‌های هیرکانی', destination:'ماسال، گیلان', status:'published', price:4850000, capacity:24, sold:19, leader:'آرمان توکلی', departure:'۱۴۰۵/۰۶/۲۰' }),
      item({ code:'FC-DT-118', title:'شب‌های کویر لوت', destination:'شهداد، کرمان', status:'published', price:3900000, capacity:18, sold:14, leader:'سارا نیک‌پی', departure:'۱۴۰۵/۰۷/۰۵' }),
      item({ code:'FC-MT-092', title:'صعود سبلان و دریاچه', destination:'اردبیل', status:'draft', price:5700000, capacity:15, sold:0, leader:'میلاد رستگار', departure:'۱۴۰۵/۰۷/۱۸' })
    ],
    bookings: [
      item({ reference:'FCB-84219', customer:'نیلوفر احمدی', tour:'کمپ جنگل‌های هیرکانی', guests:2, amount:9700000, status:'paid', payment:'verified', createdAt:now() }),
      item({ reference:'FCB-84220', customer:'ماهان کریمی', tour:'شب‌های کویر لوت', guests:3, amount:11115000, status:'pending', payment:'pending', createdAt:now() }),
      item({ reference:'FCB-84221', customer:'رها نادری', tour:'کمپ جنگل‌های هیرکانی', guests:1, amount:4850000, status:'cancelled', payment:'refunded', createdAt:now() })
    ],
    products: [
      item({ sku:'FC-TENT-04', title:'چادر چهار فصل هاسکی', category:'کمپ و اقامت', price:14800000, stock:4, reorderPoint:6, status:'active' }),
      item({ sku:'FC-BAG-38', title:'کوله ترکینگ ۳۸ لیتری', category:'کوله و حمل', price:6750000, stock:17, reorderPoint:5, status:'active' }),
      item({ sku:'FC-LAMP-12', title:'چراغ کمپ خورشیدی', category:'نور و انرژی', price:1850000, stock:2, reorderPoint:8, status:'active' })
    ],
    customers: [
      item({ name:'نیلوفر احمدی', phone:'09121234567', segment:'VIP', stage:'completed', trips:7, spend:42800000, points:3860, status:'active' }),
      item({ name:'ماهان کریمی', phone:'09129876543', segment:'Explorer', stage:'deposit', trips:2, spend:12600000, points:940, status:'active' }),
      item({ name:'رها نادری', phone:'09123334455', segment:'New', stage:'contacted', trips:0, spend:0, points:120, status:'active' })
    ],
    content: [
      item({ slot:'hero-01', title:'جنگل‌های بارانی و مه‌آلود', type:'hero', status:'published', schedule:'اکنون', author:'تیم محتوا' }),
      item({ slot:'shop-02', title:'کمپ حرفه‌ای، سبک سفر کن', type:'shop-slide', status:'published', schedule:'اکنون', author:'تیم فروش' }),
      item({ slot:'blog-04', title:'راهنمای کمپ بدون اثر', type:'blog', status:'review', schedule:'۱۴۰۵/۰۶/۲۲', author:'سارا یوسفی' })
    ],
    tickets: [
      item({ reference:'SUP-1028', subject:'تغییر تاریخ حرکت', customer:'ماهان کریمی', priority:'high', status:'open', owner:'پشتیبانی رزرو', sla:'۴۵ دقیقه' }),
      item({ reference:'SUP-1029', subject:'راهنمای انتخاب چادر', customer:'آرزو امیدی', priority:'normal', status:'pending', owner:'فروشگاه', sla:'۲ ساعت' })
    ],
    audit: [],
    settings: defaultSettings()
  };
}

function defaultSettings():AdminSettings{return {typography:{headingFont:'Vazirmatn',bodyFont:'Vazirmatn',baseSize:16,headingWeight:900,bodyWeight:400,lineHeight:1.8,letterSpacing:0},image:{width:1920,height:1080,quality:86,format:'webp',fit:'cover',focalPoint:'center',brightness:100,contrast:105,saturation:92,overlay:32,borderRadius:0},slider:{autoplay:true,interval:5000,transition:'fade',transitionDuration:900,pauseOnHover:true,showArrows:true,showDots:true,kenBurns:true,reducedMotionFallback:true},channels:{hero:{enabled:true,title:'اسلایدر اصلی صفحه',width:1920,height:1080,interval:5000,transition:'fade',overlay:35,focalPoint:'center'},shop:{enabled:true,title:'بنرهای فروشگاه',width:1920,height:760,interval:6500,transition:'slide',overlay:24,focalPoint:'center'},destinations:{enabled:true,title:'مقاصد منتخب',width:1200,height:900,interval:5000,transition:'slide',overlay:15,focalPoint:'center'},tours:{enabled:true,title:'تورهای پیشنهادی',width:1200,height:900,interval:5000,transition:'slide',overlay:18,focalPoint:'center'},testimonials:{enabled:true,title:'روایت و رضایت مسافران',width:900,height:900,interval:7000,transition:'fade',overlay:10,focalPoint:'center'}}}};

async function read(): Promise<AdminDatabase> {
  try { const data=JSON.parse(await fs.readFile(FILE, 'utf8')) as AdminDatabase; return {...data,settings:{...defaultSettings(),...(data.settings||{}),typography:{...defaultSettings().typography,...data.settings?.typography},image:{...defaultSettings().image,...data.settings?.image},slider:{...defaultSettings().slider,...data.settings?.slider},channels:{...defaultSettings().channels,...data.settings?.channels}}}; }
  catch (error: any) { if (error?.code === 'ENOENT') { const data=seed(); await write(data); return data; } throw error; }
}
async function write(data: AdminDatabase) {
  await fs.mkdir(path.dirname(FILE), { recursive:true });
  const temporary=`${FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(data,null,2), { encoding:'utf8', mode:0o600 });
  await fs.rename(temporary, FILE);
}

export async function adminSnapshot() {
  const data=await read();
  const paid=data.bookings.filter(v=>v.status==='paid');
  const revenue=paid.reduce((sum,v)=>sum+Number(v.amount||0),0);
  const seats=data.tours.reduce((sum,v)=>sum+Number(v.capacity||0),0);
  const sold=data.tours.reduce((sum,v)=>sum+Number(v.sold||0),0);
  return { generatedAt:now(), metrics:{ revenue, bookings:data.bookings.length, paidBookings:paid.length, occupancy:seats?Math.round(sold/seats*100):0, customers:data.customers.length, lowStock:data.products.filter(v=>Number(v.stock)<=Number(v.reorderPoint)).length, openTickets:data.tickets.filter(v=>v.status!=='closed').length, publishedTours:data.tours.filter(v=>v.status==='published').length }, resources:{ tours:data.tours, bookings:data.bookings, products:data.products, customers:data.customers, content:data.content, tickets:data.tickets }, settings:data.settings, audit:data.audit.slice(0,30) };
}

export async function updateAdminSettings(payload:Partial<AdminSettings>,actor:string){const data=await read();data.settings={...data.settings,...payload,typography:{...data.settings.typography,...payload.typography},image:{...data.settings.image,...payload.image},slider:{...data.settings.slider,...payload.slider},channels:{...data.settings.channels,...payload.channels}};data.audit.unshift(item({action:'settings.update',resource:'site-design',recordId:'global',actor,changes:Object.keys(payload)}));await write(data);return data.settings}
export async function publicDesignSettings(){return (await read()).settings}

export async function createAdminRecord(resource:AdminResource, payload:Record<string,unknown>, actor:string) {
  const data=await read(); const record=item(payload); data[resource].unshift(record);
  data.audit.unshift(item({ action:'create', resource, recordId:record.id, actor })); await write(data); return record;
}
export async function updateAdminRecord(resource:AdminResource, id:string, payload:Record<string,unknown>, actor:string) {
  const data=await read(); const index=data[resource].findIndex(v=>v.id===id); if(index<0) return null;
  const current=data[resource][index]; const record={...current,...payload,id,updatedAt:now()}; data[resource][index]=record;
  data.audit.unshift(item({ action:'update', resource, recordId:id, actor, changes:Object.keys(payload) })); await write(data); return record;
}
