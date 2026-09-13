import React from 'react';
import { Headphones, ShoppingBag, Layers, Sparkles } from 'lucide-react';

interface FloatingActionsProps {
  onOpenSupport: () => void;
  onOpenCart: () => void;
  onOpenCompare?: () => void;
  onOpenPersonalizer?: () => void;
  cartCount: number;
  compareCount?: number;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  onOpenSupport,
  onOpenCart,
  onOpenCompare,
  onOpenPersonalizer,
  cartCount,
  compareCount = 0
}) => {
  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-3">
      
      {/* AI Personalizer Button */}
      {onOpenPersonalizer && (
        <button
          onClick={onOpenPersonalizer}
          className="relative group w-13 h-13 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-2xl flex items-center justify-center transition duration-300 hover:scale-110 cursor-pointer border-2 border-white"
          aria-label="برنامه‌ریز سفر با هوش مصنوعی"
        >
          <Sparkles size={22} className="text-amber-300" />
          <span className="absolute left-full ml-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
            برنامه‌ریز هوشمند سفر رویایی 🪄
          </span>
        </button>
      )}

      {/* Compare Tours Button */}
      {onOpenCompare && (
        <button
          onClick={onOpenCompare}
          className="relative group w-13 h-13 rounded-full bg-slate-800 hover:bg-slate-700 text-white shadow-2xl flex items-center justify-center transition duration-300 hover:scale-110 cursor-pointer border-2 border-white"
          aria-label="مقایسه تورها"
        >
          <Layers size={22} className="text-[#84cc16]" />
          {compareCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#84cc16] text-[#064e3b] text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
              {compareCount}
            </span>
          )}
          <span className="absolute left-full ml-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
            مقایسه تخصصی تورها ({compareCount})
          </span>
        </button>
      )}

      {/* Shopping Cart Button */}
      <button
        onClick={onOpenCart}
        className="relative group w-13 h-13 rounded-full bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] shadow-2xl flex items-center justify-center transition duration-300 hover:scale-110 cursor-pointer border-2 border-white"
        aria-label="سبد تورهای رزرو شده"
        id="floating-cart-btn"
      >
        <ShoppingBag size={22} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
            {cartCount}
          </span>
        )}
        <span className="absolute left-full ml-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
          سبد رزرو تور ({cartCount})
        </span>
      </button>

      {/* Support Headset Button matching bottom-left cyan/green icon in screenshot */}
      <button
        onClick={onOpenSupport}
        className="relative group w-13 h-13 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-2xl flex items-center justify-center transition duration-300 hover:scale-110 cursor-pointer border-2 border-white"
        aria-label="پشتیبانی آنلاین"
        id="floating-support-btn"
      >
        <Headphones size={22} />
        <span className="absolute left-full ml-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg">
          پشتیبانی ۲۴ ساعته (۰۹۲۱۵۰۱۴۴۷۴)
        </span>
      </button>

    </div>
  );
};
