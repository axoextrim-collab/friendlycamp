export interface Destination {
  id: string;
  title: string;
  country: string;
  image: string;
  toursCount: number;
  description?: string;
  price?: string;
  rating?: number;
}

export interface TourItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Tour {
  id: string;
  title: string;
  location: string;
  country: string;
  image: string;
  duration: string;
  price: string;
  rating: number;
  reviewsCount: number;
  highlights: string[];
  featured?: boolean;
  destination?: string;
  nextDate?: string;
  capacity?: number;
  bookedCount?: number;
  services?: string[];
  category?: string;
  description?: string;
  originalPrice?: string;
  groupSize?: string;
  flag?: string;
  badge?: string;
  features?: string[];
  itinerary?: TourItineraryDay[];
  difficultyLevel?: number; // 1 to 5
  vipPrice?: string;
  leaderName?: string;
  medicAssigned?: boolean;
  status?: 'active' | 'draft' | 'completed' | 'cancelled';
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  colorClass: string;
  badgeColor: string;
}

export interface BlogPost {
  id: string;
  title: string;
  author: string;
  authorImage?: string;
  date: string;
  image: string;
  category: string;
  summary?: string;
  isFeatured?: boolean;
}

export interface BookingStep {
  number: string;
  title: string;
  description: string;
  iconName: string;
}

export interface StatItem {
  value: string;
  label: string;
  icon: string;
}

// Loyalty Club Interfaces
export interface LoyaltyTierInfo {
  tierName: 'برنزی' | 'نقره‌ای' | 'طلایی' | 'الماس';
  minPoints: number;
  cashbackPct: number;
  perks: string[];
  badgeColor: string;
}

export interface RewardVoucher {
  id: string;
  title: string;
  pointsCost: number;
  code: string;
  discountValue: string;
  description: string;
  expiry: string;
  isRedeemed?: boolean;
}

// Wallet & Financial Center Interfaces
export interface WalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number; // positive for income/deposit/refund, negative for spending/withdrawal
  type: 'deposit' | 'booking' | 'refund' | 'cashback' | 'withdrawal' | 'gear_rent';
  status: 'success' | 'pending' | 'rejected';
  refCode: string;
  gatewayOrBank: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  sheba: string;
  accountHolder: string;
  bankName: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

// Store & Product Management Interfaces
export interface CampingProduct {
  id: string;
  title: string;
  category: 'چادر و سرپناه' | 'کیسه خواب و تشک' | 'کوله‌پشتی' | 'پخت و پز' | 'روشنایی' | 'ناوبری و ایمنی' | 'پوشاک کمپینگ';
  image: string;
  salePrice?: number; // in Tomans
  rentPricePerDay?: number; // in Tomans
  totalStock: number;
  rentedCount: number;
  condition: 'عالی' | 'در حد نو' | 'سرویس‌شده';
  isForSale: boolean;
  isForRent: boolean;
  rating: number;
  description: string;
  specs: string[];
}

// B2B Corporate VIP & CIP Services Interfaces
export interface CorporateVIPRequest {
  id: string;
  companyName: string;
  economicCode?: string;
  contactPerson: string;
  phone: string;
  email: string;
  passengerCount: number;
  targetDestination: string;
  preferredDate: string;
  budgetRange: string;
  selectedServices: {
    cipAirport: boolean;
    vipBusCharter: boolean;
    teamBuildingWorkshop: boolean;
    executiveGlamping: boolean;
    privateChef: boolean;
    dedicatedMedic: boolean;
    officialInvoice: boolean;
  };
  notes: string;
  status: 'pending_review' | 'proposal_sent' | 'contract_signed' | 'executed' | 'cancelled';
  totalQuote?: string;
  createdAt: string;
}

// CRM System Interfaces
export type CRMStage = 'lead' | 'contacted' | 'deposit' | 'insured' | 'departed' | 'completed';

export interface CRMCustomer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationalId: string;
  passportNumber?: string;
  city: string;
  bloodType: string;
  emergencyContact: { name: string; phone: string; relation: string };
  medicalNotes: string;
  loyaltyTier: 'برنزی' | 'نقره‌ای' | 'طلایی' | 'الماس';
  lifetimeSpend: number;
  toursCount: number;
  stage: CRMStage;
  interestedTour?: string;
  assignedAgent: string;
  tags: string[];
  notesHistory: { date: string; author: string; text: string }[];
  lastActivity: string;
}

export interface SMSCampaign {
  id: string;
  title: string;
  targetGroup: string;
  recipientCount: number;
  message: string;
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft';
}

