export type StaffRole = 'admin' | 'editor' | 'support' | 'reservations';
export type AccountRole = 'user' | StaffRole;
export const ROLE_LABELS: Record<AccountRole, string> = { user: 'کاربر', admin: 'مدیر', editor: 'نویسنده', support: 'پشتیبان', reservations: 'مسئول رزرو' };
export const CONTROL_RESOURCES = ['tours','destinations','authors','leaders','articles','comments','coupons','licenses','contact','social','homeText','policies'] as const;
export type ControlResource = typeof CONTROL_RESOURCES[number];
export type ControlRecord = Record<string, any> & { id: string; revision: string; updatedAt: string };
export const RESOURCE_LABELS: Record<ControlResource, string> = { tours:'تور و خدمات سفر', destinations:'مقصدها و آب‌وهوا', authors:'نویسندگان', leaders:'لیدرها و مدارک', articles:'مقالات', comments:'نظرات و تأیید انتشار', coupons:'کدهای تخفیف', licenses:'مجوزها', contact:'اطلاعات تماس', social:'شبکه‌های اجتماعی', homeText:'متن صفحه اصلی',policies:'شرایط فروش و صفحات حقوقی' };
export const ROLE_PERMISSIONS: Record<AccountRole, readonly string[]> = {
  user: [],
  admin: ['*'],
  editor: ['destinations','authors','leaders','articles','homeText'],
  support: ['comments','messages','newsletter'],
  reservations: ['tours','reservations','coupons'],
};
export function canManage(role: AccountRole, permission: string) { return ROLE_PERMISSIONS[role]?.some(value => value === '*' || value === permission) ?? false; }
export interface PublicSiteContent { destinations: any[]; articles: any[]; text: Record<string,string>; contact: Record<string,string>; social: any[]; licenses: any[]; policies?:any[]; leaders?:import('./discovery').LeaderProfile[] }
