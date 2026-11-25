import type {SiteTheme} from '../types/siteTheme';
import { boundedFetch } from '../api/request';
import type { NewsletterSnapshot } from '../types/newsletter';
import type { BookingCapabilities, BookingReceipt, DepartureConfig, PublicDeparture } from '../types/booking';
export interface BookingAdminState { readiness?:Array<{departureId:string;ready:boolean;missing:string[]}>;departures: PublicDeparture[]; bookings: BookingReceipt[]; capabilities: BookingCapabilities; tours: Array<{ id: string; title: string; price: number; capacity: number; status: string }> }
export type ResourceKey='tours'|'bookings'|'products'|'customers'|'content'|'tickets';
export type AdminRecord={id:string;updatedAt:string;[key:string]:unknown};
export type DesignSettings={appearance?:SiteTheme;typography:{headingFont:string;bodyFont:string;baseSize:number;headingWeight:number;bodyWeight:number;lineHeight:number;letterSpacing:number};image:{width:number;height:number;quality:number;format:string;fit:string;focalPoint:string;brightness:number;contrast:number;saturation:number;overlay:number;borderRadius:number};slider:{autoplay:boolean;interval:number;transition:string;transitionDuration:number;pauseOnHover:boolean;showArrows:boolean;showDots:boolean;kenBurns:boolean;reducedMotionFallback:boolean};channels:Record<string,{enabled:boolean;title:string;width:number;height:number;interval:number;transition:string;overlay:number;focalPoint:string}>};
export type Snapshot={generatedAt:string;metrics:{revenue:number;bookings:number;paidBookings:number;occupancy:number;customers:number;lowStock:number;openTickets:number;publishedTours:number};resources:Record<ResourceKey,AdminRecord[]>;settings:DesignSettings;audit:AdminRecord[]};
const base=(((import.meta as ImportMeta & {env?:Record<string,string>}).env?.VITE_ADMIN_API_URL)||'').replace(/\/$/,'');
async function request<T>(path:string,options:RequestInit={}){const response=await boundedFetch(`${base}${path}`,{...options,credentials:'include',headers:{'Content-Type':'application/json',...options.headers}});if(!response.ok){const body=await response.json().catch(()=>({}));throw new Error(body.message||body.error||`HTTP_${response.status}`)}return response.status===204?undefined as T:response.json() as Promise<T>}
export const adminApi={
 bookingState:()=>request<BookingAdminState>('/api/admin/booking/state',{cache:'no-store'}),
 saveDeparture:(input:Omit<DepartureConfig,'id'|'revision'>&{id?:string;revision?:string})=>request<{departure:PublicDeparture}>('/api/admin/booking/departures',{method:'POST',body:JSON.stringify(input)}),
 retryBookingRefund:(reference:string)=>request(`/api/admin/booking/reservations/${encodeURIComponent(reference)}/retry-refund`,{method:'POST'}),
 retryBookingSms:(reference:string)=>request(`/api/admin/booking/reservations/${encodeURIComponent(reference)}/retry-sms`,{method:'POST'}),
 newsletter:()=>request<NewsletterSnapshot>('/api/admin/newsletter/subscribers',{cache:'no-store'}),
 unsubscribeNewsletter:(id:string)=>request<{id:string;status:'unsubscribed'}>(`/api/admin/newsletter/subscribers/${encodeURIComponent(id)}/unsubscribe`,{method:'POST'}),
 newsletterExportUrl:`${base}/api/admin/newsletter/export.csv`,
 me:()=>request<{user:{fullName:string;email:string;role:string}}>('/api/auth/me'),
 login:(identifier:string,password:string)=>request<{user:{fullName:string;email:string;role:string}}>('/api/auth/login',{method:'POST',body:JSON.stringify({identifier,password,remember:true})}),
 logout:()=>request<void>('/api/auth/logout',{method:'POST'}),
 snapshot:()=>request<Snapshot>('/api/admin/dashboard'),
 settings:(payload:Partial<DesignSettings>)=>request<{settings:DesignSettings}>('/api/admin/settings',{method:'PATCH',body:JSON.stringify(payload)}),
 create:(resource:ResourceKey,payload:Record<string,unknown>)=>request(`/api/admin/${resource}`,{method:'POST',body:JSON.stringify(payload)}),
 update:(resource:ResourceKey,id:string,payload:Record<string,unknown>)=>request(`/api/admin/${resource}/${id}`,{method:'PATCH',body:JSON.stringify(payload)})
};
