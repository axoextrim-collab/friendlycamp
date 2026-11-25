import type { BookingTour, PublicDeparture } from '../types/booking';
import type { Tour } from '../types';
export interface AdvancedTourFilters {dateFrom?:string;dateTo?:string;minBudget?:number|null;maxBudget?:number|null;difficulty?:string;destination?:string;}
export function validDay(value:string){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value;}
export function tehranDay(value:string){const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value));const part=(name:string)=>parts.find(item=>item.type===name)?.value;return `${part('year')}-${part('month')}-${part('day')}`;}
export function matchingDepartures(tour:Tour,filters:AdvancedTourFilters={},now=Date.now()):PublicDeparture[]{
 if(filters.dateFrom&&!validDay(filters.dateFrom)||filters.dateTo&&!validDay(filters.dateTo)||filters.dateFrom&&filters.dateTo&&filters.dateFrom>filters.dateTo)return [];
 if(filters.minBudget!=null&&(!Number.isFinite(filters.minBudget)||filters.minBudget<0)||filters.maxBudget!=null&&(!Number.isFinite(filters.maxBudget)||filters.maxBudget<0)||filters.minBudget!=null&&filters.maxBudget!=null&&filters.minBudget>filters.maxBudget)return [];
 return ((tour as Partial<BookingTour>).departures||[]).filter(item=>item.active&&Date.parse(item.startsAt)>now&&item.remaining>0&&(!filters.dateFrom||tehranDay(item.startsAt)>=filters.dateFrom)&&(!filters.dateTo||tehranDay(item.startsAt)<=filters.dateTo)&&(filters.minBudget==null||item.price>=filters.minBudget)&&(filters.maxBudget==null||item.price<=filters.maxBudget));
}
export function comparisonIds(value:unknown):string[]{if(!Array.isArray(value))return [];return [...new Set(value.filter((item):item is string=>typeof item==='string'&&/^[\w-]{1,100}$/.test(item)))].slice(0,3);}
export function budgetValue(value:string):number|null{const normalized=value.replace(/[۰-۹٠-٩]/g,d=>String(d.charCodeAt(0)-(d>='۰'?1776:1632))).replace(/[,٬\s]/g,'');if(!normalized)return null;return /^\d{1,13}$/.test(normalized)&&Number(normalized)<=1e12?Number(normalized):NaN;}
