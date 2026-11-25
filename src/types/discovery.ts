export interface LeaderCredential {title:string;issuer:string;number:string;source:string;validUntil:string;noExpiry:boolean;}
export interface LeaderProfile {id:string;name:string;bio:string;qualifications:string;image:string;languages:string[];credentials:LeaderCredential[];updatedAt:string;}
export interface RoutePoint {lat:number;lng:number;elevation?:number;}
export interface RouteAssessment {from:number;to:number;level:'low'|'caution'|'restricted';note:string;source:string;}
export interface TourRoute {points:RoutePoint[];sourceLabel:string;sourceUrl:string;assessedBy:string;method:string;assessedAt:string;validUntil:string;assessments:RouteAssessment[];}
export const ROUTE_LEVELS={unknown:'ارزیابی ثبت‌نشده یا منقضی',low:'ریسک کمتر طبق ارزیابی ثبت‌شده',caution:'نیازمند احتیاط و آمادگی بیشتر',restricted:'محدودیت جدی طبق ارزیابی ثبت‌شده'};
export interface CapacityWatch {departureId:string;tourId:string;title:string;startsAt:string;threshold:number;remaining:number;enabled:boolean;}
export interface CapacityAlert {id:string;departureId:string;tourId:string;title:string;startsAt:string;before:number;remaining:number;createdAt:string;read:boolean;}
