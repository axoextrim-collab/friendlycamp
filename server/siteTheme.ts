import type express from 'express';
import crypto from 'node:crypto';
import {z} from 'zod';
import {requireAdmin} from './auth';
import {controlAudit,controlDb} from './controlStore';
import {bookingTransaction} from './database';
import {DEFAULT_SITE_THEME,THEME_COLOR_KEYS,type SiteTheme,type ThemeRecord} from '../src/types/siteTheme';
import {normalizeSiteTheme,themeContrastIssues} from '../src/utils/siteTheme';
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/,'رنگ باید کد شش‌رقمی HEX باشد.').transform(value=>value.toUpperCase());
const colors=z.object(Object.fromEntries(THEME_COLOR_KEYS.map(key=>[key,hex])) as Record<typeof THEME_COLOR_KEYS[number],typeof hex>).strict();
export const siteThemeSchema=z.object({mode:z.enum(['light','dark','system']),palette:z.string().regex(/^[a-z-]{1,40}$/),light:colors,dark:colors}).strict().superRefine((theme,ctx)=>{for(const issue of themeContrastIssues(theme as SiteTheme))ctx.addIssue({code:'custom',path:[issue.mode,issue.key],message:`خوانایی ${issue.key==='text'?'متن اصلی':'توضیحات'} در تم ${issue.mode==='light'?'روشن':'تیره'} کافی نیست؛ رنگ متن یا زمینه را تغییر دهید.`});});
export async function siteThemeRecord():Promise<ThemeRecord>{const row=await(await controlDb()).prepare("SELECT payload,revision,updated_at FROM control_records WHERE resource='settings' AND id='site-theme'").get();return {theme:normalizeSiteTheme(row?JSON.parse(String(row.payload)):DEFAULT_SITE_THEME),revision:row?String(row.revision):null,updatedAt:row?String(row.updated_at):null};}
export function registerSiteThemeRoutes(app:express.Express){
 app.get('/api/manage/site-theme',requireAdmin,async(_req,res,next)=>{try{res.set('Cache-Control','no-store').json(await siteThemeRecord());}catch(error){next(error);}});
 app.put('/api/manage/site-theme',requireAdmin,async(req,res,next)=>{try{res.set('Cache-Control','no-store');const input=z.object({theme:siteThemeSchema,expectedRevision:z.string().nullable()}).strict().parse(req.body);const record=await bookingTransaction(async()=>{const previous=await siteThemeRecord();if(previous.revision!==input.expectedRevision)throw Object.assign(Error('تم سایت توسط همکار دیگری تغییر کرده است؛ نسخه جدید را دریافت کنید.'),{status:409});const theme=input.theme as SiteTheme,revision=crypto.randomUUID(),updatedAt=new Date().toISOString();await(await controlDb()).prepare("INSERT INTO control_records(resource,id,payload,revision,updated_at) VALUES('settings','site-theme',?,?,?) ON CONFLICT(resource,id) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at").run(JSON.stringify(theme),revision,updatedAt);await controlAudit(req.user!.email,'settings','site-theme','theme.publish',previous.theme,theme);return {theme,revision,updatedAt};});res.json(record);}catch(error){if(error instanceof z.ZodError)res.status(400).json({message:error.issues.map(i=>i.message).join('؛ ')});else if(error instanceof Error&&'status'in error)res.status(Number(error.status)).json({message:error.message});else next(error);}});
}
