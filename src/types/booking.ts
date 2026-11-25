import type { Tour } from '../types';
export interface BookingOption { id: string; title: string; price: number; meetingPoint?: string; departureTime?: string }
export interface DepartureConfig {
  id: string; tourId: string; startsAt: string; capacity: number; externalSold: number; price: number; active: boolean; movementStatus?: 'scheduled'|'confirmed'|'cancelled'|'completed';
  returnAt?:string;returnPoint?:string;cancellationDetails?:string;
  origins: BookingOption[]; tents: Array<BookingOption & { capacity: number }>; extras: Array<BookingOption & { maxQuantity: number }>;
  groupDiscount: { minimum: number; percent: number }; cancellation: { enabled: boolean; cutoffHours: number; feePercent: number }; revision: string;
}
export interface PublicDeparture extends DepartureConfig { remaining: number; onlineBookable?:boolean }
export interface BookingTour extends Tour { departures: PublicDeparture[] }
export interface BookingSelection { departureId: string; guests: number; originId: string; tentId: string; extras: Array<{ id: string; quantity: number }>; couponCode?: string }
export interface Passenger { fullName: string; nationalCode: string;birthDate?:string }
export interface BookingContact { fullName: string; phone: string; email: string }
export interface BookingQuote { revision: string; selection: BookingSelection; tourId: string; title: string; startsAt: string; remaining: number; base: number; discount: number; discountPercent: number; origin: number; originDetails?: {title:string;meetingPoint?:string;departureTime?:string}; tent: number; tentUnits: number; extras: number; total: number; coupon?: {id:string;code:string;discount:number}; cancellation: DepartureConfig['cancellation']; currency: 'تومان';travel?:import('./travel').TravelSnapshot }
export type BookingState = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refund_pending' | 'refunded' | 'review';
export interface BookingReceipt { customerName?:string; reference: string; state: BookingState; mode: 'sandbox' | 'http'; quote: BookingQuote; expiresAt: number; receiptId: string | null; transactionId: string | null; refundAmount: number; cancellationFee: number; smsStatus: string; passengers: Array<{ fullName: string; nationalCodeMasked: string }>; contactPhoneMasked: string; createdAt: number; cancellationPreview: { allowed: boolean; fee: number; refund: number } }
export interface BookingAccess { reference: string; token: string }
export interface BookingCapabilities { paymentMode: 'sandbox' | 'http' | 'disabled'; smsConfigured: boolean }
export const BOOKING_STATE_LABELS: Record<BookingState, string> = { pending: 'در انتظار پرداخت', paid: 'رزرو تأییدشده', failed: 'پرداخت ناموفق', expired: 'مهلت رزرو پایان یافته', cancelled: 'لغوشده', refund_pending: 'در انتظار استرداد', refunded: 'لغو و استرداد ثبت شد', review: 'نیازمند بررسی پرداخت' };
