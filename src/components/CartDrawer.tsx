import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Trash2,
  Calendar,
  ArrowLeft,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Bus,
  Check,
  Phone,
  Sparkles
} from 'lucide-react';
import { Tour } from '../types';

export interface BookedTourItem {
  id?: string;
  tour: Tour;
  date: string;
  guests: number;
  status?: 'pending' | 'confirmed' | 'ready' | 'cancelled';
  bookingRef?: string;
  leaderPhone?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: BookedTourItem[];
  onClose: () => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  onViewEmailTicket?: (item: BookedTourItem) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cartItems,
  onClose,
  onRemoveItem,
  onCheckout,
  onViewEmailTicket
}) => {
  // Active Tab: 'cart' | 'status'
  const [activeTab, setActiveTab] = useState<'cart' | 'status'>('status');

  if (!isOpen) return null;

  // Status mapping
  const getStatusBadge = (status: string = 'confirmed') => {
    switch (status) {
      case 'confirmed':
      case 'ready':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
            <CheckCircle size={12} className="text-emerald-600" />
            <span>تایید نهایی و بیمه صادر شد</span>
          </span>
        );
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
            <Clock size={12} className="text-amber-600" />
            <span>در انتظار استعلام صندلی</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-rose-300">
            <X size={12} className="text-rose-600" />
            <span>لغو شده</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="سبد رزرو" className="fixed inset-0 z-50 flex justify-start bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between p-5 text-right animate-in slide-in-from-right duration-300 border-l border-slate-200">
        
        {/* Header & Tabs */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag size={22} className="text-[#004e5a]" />
              <div>
                <h3 className="font-black text-lg text-[#003843]">پنل پیگیری و رزروهای شما</h3>
                <p className="text-[10px] text-slate-500 font-medium">مشاهده وضعیت، بلیط و فاکتورها</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mt-4">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'status'
                  ? 'bg-[#004e5a] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              <span>وضعیت رزروها ({cartItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cart')}
              className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'cart'
                  ? 'bg-[#004e5a] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag size={14} />
              <span>سبد تورهای آماده</span>
            </button>
          </div>

          {/* Tab 1: Booking status with stepper */}
          {activeTab === 'status' && (
            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-3">
                  <Calendar size={48} className="text-slate-200" />
                  <span>هیچ سابقه رزروی ثبت نشده است.</span>
                </div>
              ) : (
                cartItems.map((item, idx) => {
                  const status = item.status || 'confirmed';
                  const ref = item.bookingRef || `FC-${849201 + idx * 13}`;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50 rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3 relative overflow-hidden"
                    >
                      {/* Top Tour Info */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 items-center">
                          <img
                            src={item.tour.image}
                            alt={item.tour.title}
                            className="w-14 h-14 rounded-2xl object-cover shrink-0 shadow-sm"
                          />
                          <div>
                            <h4 className="font-black text-xs text-[#003843] line-clamp-1">{item.tour.title}</h4>
                            <span className="text-[11px] text-slate-500 font-medium block">
                              تاریخ: {item.date} • {item.guests} مسافر
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              کد رهگیری: {ref}
                            </span>
                          </div>
                        </div>

                        {getStatusBadge(status)}
                      </div>

                      {/* Visual Progress Stepper (4 Steps) */}
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-extrabold text-slate-500 block mb-2">
                          روند آماده‌سازی و صدور مجوزهای سفر:
                        </span>

                        <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-black">
                          {/* Step 1 */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                              ✓
                            </div>
                            <span className="text-emerald-800">ثبت رزرو</span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-sm">
                              ✓
                            </div>
                            <span className="text-emerald-800">بیمه حوادث</span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm animate-pulse">
                              ۳
                            </div>
                            <span className="text-amber-900">تخصیص اتوبوس</span>
                          </div>

                          {/* Step 4 */}
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px]">
                              ۴
                            </div>
                            <span className="text-slate-400">حرکت به کمپ</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        {onViewEmailTicket && (
                          <button
                            onClick={() => onViewEmailTicket(item)}
                            className="flex-1 bg-[#004e5a] hover:bg-[#003843] text-white text-[11px] font-black py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText size={14} className="text-[#84cc16]" />
                            <span>مشاهده ایمیل تایید و بلیط</span>
                          </button>
                        )}

                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="px-3 py-2 text-rose-600 hover:bg-rose-100 text-[11px] font-bold rounded-xl transition cursor-pointer"
                          title="لغو رزرو"
                        >
                          لغو
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Standard Cart List */}
          {activeTab === 'cart' && (
            <div className="py-4 space-y-3 max-h-[65vh] overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-3">
                  <ShoppingBag size={48} className="text-slate-200" />
                  <span>سبد خرید فعلی شما خالی است.</span>
                </div>
              ) : (
                cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <img
                      src={item.tour.image}
                      alt={item.tour.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 text-right">
                      <h4 className="font-bold text-xs text-slate-800">{item.tour.title}</h4>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        تاریخ: {item.date} • {item.guests} نفر
                      </span>
                      <span className="text-xs font-black text-[#004e5a] mt-1 block font-mono">
                        {item.tour.price}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveItem(idx)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {cartItems.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={onCheckout}
              className="w-full bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-black py-3.5 rounded-2xl shadow-lg transition text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              <span>پرداخت نهایی سبد و دانلود فوری بلیط‌ها</span>
              <ArrowLeft size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
