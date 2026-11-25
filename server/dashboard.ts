import type express from 'express';
import { adminAccountDirectory, requireAdmin } from './auth';
import { bookingDb, databaseBackend } from './database';
import { controlDb, controlRecords, managedTours } from './controlStore';
import { readAdminDatabase } from './adminStore';
import { adminDepartures } from './bookingCatalog';
import { saleReadiness } from './travelReadiness';
import { bookingCapabilities } from './bookingProviders';
import { newsletterSnapshot } from './newsletter';
import { storageBackend, storageReady } from './supabaseStorage';
import type { AdminAttention, DashboardSummary, FinanceEntry, FinanceTotals } from '../src/types/adminDashboard';
import { BOOKING_STATE_LABELS } from '../src/types/booking';

export const tehranDay = (at: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
export function reportStart(days: number, now = Date.now()) { return Date.parse(tehranDay(now) + 'T00:00:00+03:30') - (days - 1) * 86400000; }
export function financeEntry(row: Record<string, any>): FinanceEntry {
  const payload = JSON.parse(String(row.payload)), quote = payload.quote;
  const verified = payload.mode === 'http' && row.payment_mode === 'http' && !!row.transaction_id && row.payment_state === 'verified' && ['paid','refund_pending','refunded'].includes(row.state);
  const amount = Math.max(0, Number(quote.total) || 0), refund = Math.max(0, Number(row.refund_amount) || 0);
  return { reference: String(row.reference), customer: String(payload.contact?.fullName || 'نام ثبت نشده'), title: String(quote.title || ''), state: row.state, mode: payload.mode,
    total: amount, refund, received: verified ? amount : 0, returned: verified && row.state === 'refunded' ? refund : 0, pendingRefund: verified && row.state === 'refund_pending' ? refund : 0,
    createdAt: Number(row.created_at), paidAt: verified && row.payment_at ? Number(row.payment_at) : null, refundedAt: verified && row.state === 'refunded' && row.refund_at ? Number(row.refund_at) : null,
    receipt: row.receipt_id || null, transaction: row.transaction_id || null };
}
export function financeTotals(entries: FinanceEntry[], start: number, end = Date.now()): FinanceTotals {
  const inside = (at: number|null) => at !== null && at >= start && at <= end;
  const received = entries.reduce((n,e) => n + (inside(e.paidAt) ? e.received : 0),0);
  const returned = entries.reduce((n,e) => n + (inside(e.refundedAt) ? e.returned : 0),0);
  return { received, returned, net: received-returned, pendingRefund: entries.reduce((n,e)=>n+e.pendingRefund,0), sandbox: entries.filter(e=>e.mode==='sandbox' && inside(e.createdAt)).length };
}
export function csv(rows: unknown[][]) { return '\uFEFF' + rows.map(row=>row.map(value=>{const raw=String(value??'');return '"'+(/^[\s]*[=+\-@]/.test(raw)?"'"+raw:raw).replace(/"/g,'""')+'"';}).join(',')).join('\r\n'); }
async function ledgerRows() {
  await controlDb();
  return await bookingDb().prepare(`SELECT r.reference,r.owner_id,r.state,r.payload,r.created_at,r.receipt_id,r.transaction_id,r.refund_amount,p.mode AS payment_mode,p.state AS payment_state,p.updated_at AS payment_at,f.updated_at AS refund_at FROM reservations r LEFT JOIN payments p ON p.reference=r.reference LEFT JOIN refund_jobs f ON f.reference=r.reference ORDER BY r.created_at DESC`).all();
}
function daysFrom(req: express.Request) { const n=Number(req.query.days??30);if(![7,30,90].includes(n))throw Object.assign(new Error('بازه گزارش معتبر نیست.'),{status:400});return n; }
function queryFrom(req: express.Request) { return typeof req.query.q==='string' ? req.query.q.trim().slice(0,120).toLocaleLowerCase('fa') : ''; }
function pageFrom(req: express.Request) { const page=Number(req.query.page??1);if(!Number.isInteger(page)||page<1||page>100000)throw Object.assign(new Error('شماره صفحه معتبر نیست.'),{status:400});return page; }
const normalize = (value: unknown) => String(value??'').toLocaleLowerCase('fa').replace(/ي/g,'ی').replace(/ك/g,'ک');
const matches = (query: string, ...values: unknown[]) => normalize(values.join(' ')).includes(normalize(query));

export async function dashboardSummary(days: number, now=Date.now()): Promise<DashboardSummary> {
  const start=reportStart(days,now);
  const database=await readAdminDatabase(), accounts=await adminAccountDirectory(), tours=await managedTours(), departures=await adminDepartures();
  const rows=await ledgerRows(), entries=rows.map(financeEntry), within=entries.filter(e=>e.createdAt>=start&&e.createdAt<=now);
  const comments=await controlRecords('comments'), newsletter=await newsletterSnapshot();
  // Support tables are created lazily by the support module in SQLite.
  const supportTable=databaseBackend()==='postgres' || await bookingDb().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='support_cases'").get();
  const cases=supportTable ? Number((await bookingDb().prepare("SELECT COUNT(*) AS n FROM support_cases WHERE status!='closed'").get())?.n||0) : 0;
  const future=departures.filter(d=>d.active&&Date.parse(d.startsAt)>now&&!['cancelled','completed'].includes(d.movementStatus)).sort((a,b)=>a.startsAt.localeCompare(b.startsAt));
  const upcoming:DashboardSummary['upcoming']=[];
  for(const d of future.slice(0,6)){const readiness=await saleReadiness(d);upcoming.push({id:d.id,tourId:d.tourId,title:String(tours.find(t=>t.id===d.tourId)?.title||'تور ثبت‌شده'),startsAt:d.startsAt,remaining:d.remaining,capacity:d.capacity,price:d.price,ready:readiness.ready,missing:readiness.missing,movementStatus:d.movementStatus||'scheduled'});}
  const orders=database.shopOrders||[], pendingOrders=orders.filter(o=>o.status==='awaiting_confirmation').length;
  const lowStock=database.products.filter(p=>p.status==='active'&&p.salesEnabled===true&&typeof p.stock==='number'&&p.stock<=3).length;
  const pendingComments=comments.filter(c=>c.status==='pending').length, messages=database.tickets.filter(t=>t.status!=='closed').length;
  const attention:AdminAttention[]=[
    {id:'refunds',title:'پیگیری استرداد و پرداخت',description:'رزروهای نیازمند بررسی مالی',count:entries.filter(e=>['refund_pending','review'].includes(e.state)).length,target:'reservations',tone:'warning'},
    {id:'orders',title:'سفارش‌های منتظر بررسی',description:'درخواست سفارش فروشگاه؛ هنوز پرداخت نشده',count:pendingOrders,target:'store',tone:'warning'},
    {id:'support',title:'پرونده‌های باز پشتیبانی',description:'رسیدگی به درخواست و شکایت',count:cases,target:'support',tone:'neutral'},
    {id:'messages',title:'پیام‌ها و مشاوره‌های باز',description:'پاسخ‌گویی و تعیین مسئول پیگیری',count:messages,target:'messages',tone:'neutral'},
    {id:'comments',title:'نظرات در انتظار تأیید',description:'بررسی رضایت انتشار و محتوای نظر',count:pendingComments,target:'comments',tone:'neutral'},
    {id:'stock',title:'موجودی کم فروشگاه',description:'محصول فعال با حداکثر سه عدد موجودی',count:lowStock,target:'store',tone:'warning'},
    {id:'readiness',title:'تکمیل مدارک حرکت‌های نزدیک',description:'کنترل شرایط فروش شش حرکت پیش رو',count:upcoming.filter(d=>!d.ready).length,target:'reservations',tone:'warning'},
  ];
  const daily=Array.from({length:days},(_,i)=>({date:tehranDay(start+i*86400000),bookings:0,received:0,returned:0}));
  const byDay=new Map(daily.map(d=>[d.date,d]));
  for(const e of entries){if(e.createdAt>=start&&e.createdAt<=now){const d=byDay.get(tehranDay(e.createdAt));if(d)d.bookings++;}if(e.paidAt&&e.paidAt<=now){const d=byDay.get(tehranDay(e.paidAt));if(d)d.received+=e.received;}if(e.refundedAt&&e.refundedAt<=now){const d=byDay.get(tehranDay(e.refundedAt));if(d)d.returned+=e.returned;}}
  const activity=(await (await controlDb()).prepare('SELECT id,at,actor,action,resource,record_id FROM control_audit ORDER BY id DESC LIMIT 8').all()).map(r=>({id:String(r.id),at:String(r.at),actor:String(r.actor),action:String(r.action),resource:String(r.resource),recordId:String(r.record_id)}));
  return {capturedAt:new Date(now).toISOString(),days,finance:financeTotals(entries,start,now),counts:{bookings:within.length,paid:within.filter(e=>e.mode==='http'&&e.received>0).length,sandbox:within.filter(e=>e.mode==='sandbox').length,customers:accounts.filter(a=>a.role==='user'&&Date.parse(a.createdAt)>=start).length,members:accounts.filter(a=>a.role==='user').length,staff:accounts.filter(a=>a.role!=='user').length,orders:orders.filter(o=>Date.parse(o.createdAt)>=start).length,newsletter:newsletter.active,tours:tours.length,publishedTours:tours.filter(t=>t.status==='published'||t.publishedVersion).length,products:database.products.length,seats:future.reduce((n,d)=>n+d.remaining,0),capacity:future.reduce((n,d)=>n+d.capacity,0),upcoming:future.length},daily,states:Object.keys(BOOKING_STATE_LABELS).map(state=>({state:state as FinanceEntry['state'],count:within.filter(e=>e.state===state).length})),upcoming,attention,recent:entries.slice(0,6),activity,capabilities:bookingCapabilities()};
}
export function registerDashboardRoutes(app:express.Express){
  const run=(handler:(req:express.Request,res:express.Response)=>Promise<unknown>)=>async(req:express.Request,res:express.Response,next:express.NextFunction)=>{res.setHeader('Cache-Control','no-store');try{await handler(req,res);}catch(error){if(error instanceof Error&&'status'in error)res.status(Number(error.status)).json({message:error.message});else next(error);}};
  app.get('/api/manage/dashboard',requireAdmin,run(async(req,res)=>res.json(await dashboardSummary(daysFrom(req)))));
  app.get('/api/manage/customers',requireAdmin,run(async(req,res)=>{
    const accounts=await adminAccountDirectory(), rows=await ledgerRows(), orders=(await readAdminDatabase()).shopOrders||[], q=queryFrom(req), role=String(req.query.role||'all'), page=pageFrom(req);
    if(!['all','user','admin','editor','support','reservations'].includes(role))return res.status(400).json({message:'نقش معتبر نیست.'});
    const counts=new Map<string,number>(),orderCounts=new Map<string,number>();for(const r of rows)if(r.owner_id)counts.set(String(r.owner_id),(counts.get(String(r.owner_id))||0)+1);for(const o of orders)if(o.userId)orderCounts.set(o.userId,(orderCounts.get(o.userId)||0)+1);
    const filtered=accounts.filter(a=>(role==='all'||a.role===role)&&matches(q,a.fullName,a.phone,a.email)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).map(a=>({...a,bookings:counts.get(a.id)||0,orders:orderCounts.get(a.id)||0}));
    res.json({records:filtered.slice((page-1)*20,page*20),total:filtered.length,page,pageSize:20,counts:{all:accounts.length,members:accounts.filter(a=>a.role==='user').length,staff:accounts.filter(a=>a.role!=='user').length}});
  }));
  app.get('/api/manage/finance',requireAdmin,run(async(req,res)=>{
    const days=daysFrom(req),start=reportStart(days),q=queryFrom(req),mode=String(req.query.mode||'all'),state=String(req.query.state||'all'),page=pageFrom(req),end=Date.now();
    if(!['all','http','sandbox'].includes(mode)||state!=='all'&&!Object.hasOwn(BOOKING_STATE_LABELS,state))return res.status(400).json({message:'فیلتر مالی معتبر نیست.'});
    const all=(await ledgerRows()).map(financeEntry),within=(at:number|null)=>at!==null&&at>=start&&at<=end;
    const filtered=all.filter(e=>(mode==='all'||e.mode===mode)&&(state==='all'||e.state===state)&&matches(q,e.reference,e.customer,e.title,e.receipt,e.transaction)&&(within(e.createdAt)||within(e.paidAt)||within(e.refundedAt)||['refund_pending','review'].includes(e.state)));
    if(req.query.format==='csv'){res.type('text/csv; charset=utf-8').attachment('friendlycamp-finance.csv').send(csv([['شناسه رزرو','مسافر','تور','نوع پرداخت','وضعیت','مبلغ رزرو (تومان)','دریافتی تأییدشده','استرداد انجام‌شده','زمان ایجاد'],...filtered.map(e=>[e.reference,e.customer,e.title,e.mode==='sandbox'?'آزمایشی':'درگاه',BOOKING_STATE_LABELS[e.state],e.total,e.received,e.returned,new Date(e.createdAt).toISOString()])]));return;}
    res.json({records:filtered.slice((page-1)*20,page*20),total:filtered.length,page,pageSize:20,totals:financeTotals(all,start,end),capturedAt:new Date(end).toISOString()});
  }));
  app.get('/api/manage/search',requireAdmin,run(async(req,res)=>{
    const q=queryFrom(req);if(q.length<2)return res.json({results:[]});
    const database=await readAdminDatabase(),tours=await managedTours(),articles=await controlRecords('articles'),users=await adminAccountDirectory(),entries=(await ledgerRows()).map(financeEntry);
    const groups=[tours.filter(t=>matches(q,t.title,t.code)).slice(0,5).map(t=>({id:t.id,label:t.title,detail:t.code||'تور',kind:'تور',target:'tours?edit='+encodeURIComponent(t.id)})),database.products.filter(p=>matches(q,p.title,p.sku)).slice(0,4).map(p=>({id:p.id,label:p.title,detail:p.sku||'محصول',kind:'فروشگاه',target:'store'})),articles.filter(a=>matches(q,a.title,a.slug)).slice(0,4).map(a=>({id:a.id,label:a.title,detail:a.slug||'مقاله',kind:'مقاله',target:'articles?edit='+encodeURIComponent(a.id)})),users.filter(u=>matches(q,u.fullName,u.phone,u.email)).slice(0,4).map(u=>({id:u.id,label:u.fullName,detail:u.email,kind:'کاربر',target:'customers?q='+encodeURIComponent(u.email)})),entries.filter(e=>matches(q,e.reference,e.customer,e.title)).slice(0,4).map(e=>({id:e.reference,label:e.customer,detail:e.reference,kind:'رزرو',target:'finance?q='+encodeURIComponent(e.reference)}))];
    res.json({results:groups.flat().slice(0,18)});
  }));
  app.get('/api/manage/system',requireAdmin,run(async(_req,res)=>{
    await bookingDb().prepare('SELECT 1 AS ok').get();let files=true;try{await storageReady();}catch{files=false;}
    res.json({checkedAt:new Date().toISOString(),database:databaseBackend(),databaseReady:true,storage:storageBackend(),storageReady:files,capabilities:bookingCapabilities(),production:process.env.NODE_ENV==='production'});
  }));
}
