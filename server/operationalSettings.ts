import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';
import type express from 'express';
import { z } from 'zod';
import { requireAdmin } from './auth';
import { controlAudit, controlDb } from './controlStore';
import { bookingTransaction } from './database';

const endpoint = z.union([z.literal(''), z.url().max(500).refine(value => { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash; }, 'نشانی سرویس باید HTTPS و بدون اطلاعات ورود باشد.')]);
export const SETTINGS_SCHEMAS = {
  general: z.object({ siteName:z.string().trim().min(2).max(80), homeTitle:z.string().trim().max(160), homeDescription:z.string().trim().max(320) }).strict(),
  booking: z.object({ holdMinutes:z.number().int().min(1).max(30) }).strict(),
  payment: z.object({ mode:z.enum(['disabled','sandbox','http']), baseUrl:endpoint, token:z.string().max(2000).optional(), clearToken:z.boolean().optional() }).strict(),
  sms: z.object({ enabled:z.boolean(), baseUrl:endpoint, token:z.string().max(2000).optional(), clearToken:z.boolean().optional() }).strict(),
};
export type SettingsSection = keyof typeof SETTINGS_SCHEMAS;
type Values = Record<string, any>;
type Snapshot = Partial<Record<SettingsSection, Values>>;
const context = new AsyncLocalStorage<Snapshot>();
function defaults(section:SettingsSection):Values {
  if(section==='general')return {siteName:'فرندلی کمپ',homeTitle:'',homeDescription:''};
  if(section==='booking')return {holdMinutes:Math.min(30,Math.max(1,(Number(process.env.BOOKING_HOLD_SECONDS)||900)/60))};
  if(section==='payment')return {mode:process.env.BOOKING_PAYMENT_MODE||(process.env.NODE_ENV==='production'?'disabled':'sandbox'),baseUrl:process.env.PAYMENT_HTTP_URL||'',token:process.env.PAYMENT_API_TOKEN||''};
  return {enabled:!!(process.env.SMS_HTTP_URL&&process.env.SMS_API_TOKEN),baseUrl:process.env.SMS_HTTP_URL||'',token:process.env.SMS_API_TOKEN||''};
}
function key(){const secret=process.env.SETTINGS_ENCRYPTION_KEY||process.env.SESSION_SECRET;if(process.env.NODE_ENV==='production'&&(!secret||secret.length<32))throw Error('Settings encryption key is unavailable');return crypto.createHash('sha256').update(secret||'friendly-settings-development-only').digest();}
function encrypt(token:string){if(!token)return '';const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);return [iv.toString('base64'),Buffer.concat([cipher.update(token,'utf8'),cipher.final()]).toString('base64'),cipher.getAuthTag().toString('base64')].join('.');}
function decrypt(token:string){if(!token)return '';const [iv,body,tag]=token.split('.');const cipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64'));cipher.setAuthTag(Buffer.from(tag,'base64'));return Buffer.concat([cipher.update(Buffer.from(body,'base64')),cipher.final()]).toString('utf8');}
async function stored(section:SettingsSection){return (await controlDb()).prepare("SELECT payload,revision,updated_at FROM control_records WHERE resource='settings' AND id=?").get(section);}
function decode(section:SettingsSection,row:any){if(!row)return defaults(section);const values=JSON.parse(String(row.payload));if('encryptedToken'in values){values.token=decrypt(values.encryptedToken);delete values.encryptedToken;}return values;}
export function runtimeSetting(section:SettingsSection){return context.getStore()?.[section]||defaults(section);}
export function reservationHoldSeconds(){const configured=context.getStore()?.booking;return configured?Number(configured.holdMinutes)*60:Math.min(1800,Math.max(1,Number(process.env.BOOKING_HOLD_SECONDS)||900));}
export async function withOperationalSettings<T>(work:()=>T|Promise<T>){
  const rows=await(await controlDb()).prepare("SELECT id,payload FROM control_records WHERE resource='settings'").all();const snapshot:Snapshot={};for(const row of rows)if(Object.hasOwn(SETTINGS_SCHEMAS,row.id))snapshot[row.id as SettingsSection]=decode(row.id as SettingsSection,row);return await context.run(snapshot,work);
}
export async function settingsContext(_req:express.Request,_res:express.Response,next:express.NextFunction){
  try{await withOperationalSettings(next);}catch(error){next(error);}
}
export async function publicSiteSettings(){const values=decode('general',await stored('general'));return {siteName:String(values.siteName),homeTitle:String(values.homeTitle),homeDescription:String(values.homeDescription)};}
const safe=(values:Values)=>{const {token,...rest}=values;return {...rest,...(token!==undefined?{hasToken:!!token}:{})};};
export function registerSettingsRoutes(app:express.Express){
  const run=(handler:(req:express.Request,res:express.Response)=>Promise<unknown>)=>async(req:express.Request,res:express.Response,next:express.NextFunction)=>{res.setHeader('Cache-Control','no-store');try{await handler(req,res);}catch(error){if(error instanceof z.ZodError)res.status(400).json({message:error.issues.map(i=>i.message).join('؛ ')});else if(error instanceof Error&&'status'in error)res.status(Number(error.status)).json({message:error.message});else next(error);}};
  const sectionOf=(raw:string)=>{if(!Object.hasOwn(SETTINGS_SCHEMAS,raw))throw Object.assign(Error('بخش تنظیمات پیدا نشد.'),{status:404});return raw as SettingsSection;};
  app.get('/api/manage/settings/:section',requireAdmin,run(async(req,res)=>{const section=sectionOf(req.params.section),row=await stored(section);res.json({section,values:safe(decode(section,row)),revision:row?.revision||null,updatedAt:row?.updated_at||null});}));
  app.put('/api/manage/settings/:section',requireAdmin,run(async(req,res)=>{
    const section=sectionOf(req.params.section),input=z.object({values:z.record(z.string(),z.unknown()),expectedRevision:z.string().nullable()}).strict().parse(req.body);
    const parsed=SETTINGS_SCHEMAS[section].parse(input.values) as Values;
    const result=await bookingTransaction(async()=>{
      const row=await stored(section);if((row?.revision||null)!==input.expectedRevision)throw Object.assign(Error('تنظیمات توسط همکار دیگری تغییر کرده است؛ ابتدا نسخه جدید را دریافت کنید.'),{status:409});
      const before=decode(section,row),values={...parsed};
      if(section==='payment'||section==='sms'){
        const token=values.clearToken?'':values.token||before.token||'';delete values.clearToken;
        if((section==='payment'&&values.mode==='http'||section==='sms'&&values.enabled)&&(!values.baseUrl||!token))throw Object.assign(Error('برای فعال‌سازی سرویس، نشانی و کلید دسترسی را تکمیل کنید.'),{status:400});
        values.token=token;
        // Pending external transactions must continue using the same provider.
        if(section==='payment'&&JSON.stringify(values)!==JSON.stringify(before)){
          const pending=await(await controlDb()).prepare("SELECT COUNT(*) AS n FROM reservations WHERE state IN ('pending','paid','refund_pending','review') AND json_extract(payload,'$.mode')='http'").get();
          if(Number(pending?.n))throw Object.assign(Error('درگاه این رزروها باید برای پرداخت یا استرداد در دسترس بماند؛ پیش از تعویض، رزروهای قطعی و فرآیندهای باز درگاه فعلی را تعیین تکلیف کنید.'),{status:409});
        }
      }
      const revision=crypto.randomUUID(),updatedAt=new Date().toISOString(),persisted={...values};
      if('token'in persisted){persisted.encryptedToken=encrypt(persisted.token);delete persisted.token;}
      await(await controlDb()).prepare("INSERT INTO control_records(resource,id,payload,revision,updated_at) VALUES('settings',?,?,?,?) ON CONFLICT(resource,id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at").run(section,JSON.stringify(persisted),revision,updatedAt);
      await controlAudit(req.user!.email,'settings',section,'settings.update',safe(before),safe(values));
      return {values:safe(values),revision,updatedAt};
    });res.json(result);
  }));
}
