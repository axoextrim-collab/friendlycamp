import type { AccountRole } from './control';
import type { BookingState, BookingCapabilities } from './booking';

export interface FinanceEntry {
  reference: string; customer: string; title: string; state: BookingState; mode: 'sandbox'|'http';
  total: number; refund: number; received: number; returned: number; pendingRefund: number;
  createdAt: number; paidAt: number|null; refundedAt: number|null; receipt: string|null; transaction: string|null;
}
export interface FinanceTotals { received: number; returned: number; pendingRefund: number; net: number; sandbox: number }
export interface AdminAttention { id: string; title: string; description: string; count: number; target: string; tone: 'warning'|'neutral' }
export interface DashboardSummary {
  capturedAt: string; days: number; finance: FinanceTotals;
  counts: { bookings: number; paid: number; sandbox: number; customers: number; members: number; staff: number; orders: number; newsletter: number; tours: number; publishedTours: number; products: number; seats: number; capacity: number; upcoming: number };
  daily: Array<{ date: string; bookings: number; received: number; returned: number }>;
  states: Array<{ state: BookingState; count: number }>;
  upcoming: Array<{ id: string; tourId: string; title: string; startsAt: string; remaining: number; capacity: number; price: number; ready: boolean; missing: string[]; movementStatus: string }>;
  attention: AdminAttention[]; recent: FinanceEntry[];
  activity: Array<{ id: string; at: string; actor: string; action: string; resource: string; recordId: string }>;
  capabilities: BookingCapabilities;
}
export interface AdminCustomer { id: string; fullName: string; phone: string; email: string; role: AccountRole; createdAt: string; bookings: number; orders: number }
export interface AdminSearchResult { id: string; label: string; detail: string; target: string; kind: string }
