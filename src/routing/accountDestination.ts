import {ROLE_PERMISSIONS,type AccountRole} from '../types/control';
import {resolveRoute} from './routes';

const managementHomes:Partial<Record<AccountRole,string>>={
  admin:'/admin#overview/summary',
  editor:'/admin#articles/list',
  support:'/admin#support/open',
  reservations:'/admin#reservations/departures',
};
export function hasManagementAccess(role?:AccountRole|null){return !!role&&!!ROLE_PERMISSIONS[role]?.length;}
export function accountDestination(role?:AccountRole|null){return role&&hasManagementAccess(role)?managementHomes[role]||'/admin':'/account';}

// A return link preserves an intentional booking/checkout flow, but an account
// link always opens the dashboard belonging to the authenticated server role.
export function signInDestination(role:AccountRole,returnTo:string|null,origin:string){
  const fallback=accountDestination(role);
  if(!returnTo)return fallback;
  try{
    const url=new URL(returnTo,origin);
    if(url.origin!==new URL(origin).origin||!['http:','https:'].includes(url.protocol))return fallback;
    const pathname=url.pathname.replace(/\/+$/,'')||'/';
    if(['/account','/profile'].includes(pathname))return hasManagementAccess(role)?fallback:'/account'+url.search+url.hash;
    const route=resolveRoute(pathname);
    if(['login','register','not-found'].includes(route.kind))return fallback;
    if((route.kind==='admin'||route.kind==='shop-manage')&&!hasManagementAccess(role))return fallback;
    return url.pathname+url.search+url.hash;
  }catch{return fallback;}
}
