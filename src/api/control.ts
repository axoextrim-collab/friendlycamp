import { boundedFetch } from './request';
import type { AuthUser } from './auth';
import type { ControlRecord, ControlResource } from '../types/control';
export class ControlApiError extends Error {constructor(message:string,public status:number){super(message);}}
export async function controlRequest<T=any>(url:string,options:RequestInit={}):Promise<T>{let response:Response;try{response=await boundedFetch(url,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers}});}catch{throw new ControlApiError('ارتباط با سرور برقرار نشد؛ اطلاعات فرم حفظ شده است. دوباره تلاش کن.',0);}if(response.status===204)return undefined as T;const data=await response.json().catch(()=>null);if(!data)throw new ControlApiError('پاسخ معتبر دریافت نشد؛ دوباره تلاش کن.',response.status);if(!response.ok)throw new ControlApiError(data.message||data.issues?.map((item:any)=>`${item.path}: ${item.message}`).join('، ')||(response.status===403?'این نقش به این بخش دسترسی ندارد.':'درخواست انجام نشد؛ دوباره تلاش کن.'),response.status);return data;}
export const controlApi={
 session:()=>controlRequest<{user:AuthUser;permissions:string[]}>('/api/manage/session'),
 records:(resource:ControlResource)=>controlRequest<{records:ControlRecord[]}>(`/api/manage/records/${resource}`),
 save:(resource:ControlResource,values:Record<string,unknown>,record?:ControlRecord)=>controlRequest<{record:ControlRecord}>(`/api/manage/records/${resource}${record?'/'+encodeURIComponent(record.id):''}`,{method:record?'PATCH':'POST',body:JSON.stringify({values,expectedRevision:record?.revision||null})}),
 remove:(resource:ControlResource,record:ControlRecord)=>controlRequest(`/api/manage/records/${resource}/${encodeURIComponent(record.id)}`,{method:'DELETE',body:JSON.stringify({expectedRevision:record.revision})}),
};
