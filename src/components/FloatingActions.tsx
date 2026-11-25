import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React from 'react';
import { Headphones, ShoppingBag } from 'lucide-react';

interface FloatingActionsProps {
  onOpenSupport: () => void;
  onOpenCart: () => void;
  cartCount: number;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  onOpenSupport,
  onOpenCart,
  cartCount,
}) => {
  return (
    <div className="fc-floating-actions fixed bottom-6 left-6 z-40 flex flex-col gap-3">
      
      {/* Shopping Cart Button */}
      <button type="button"
        onClick={onOpenCart}
        className="relative group w-13 h-13 rounded-full bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] shadow-2xl flex items-center justify-center transition duration-300 hover:scale-110 cursor-pointer border-2 border-white"
        aria-label={siteText(`سبد رزرو تور، ${cartCount.toLocaleString('fa-IR')} برنامه`)}
        id="floating-cart-btn"
      >
        <ShoppingBag size={22} />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md">
            <ManagedText value={cartCount}/>
          </span>
        )}
        <span className="absolute left-full ml-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg"><ManagedText value={"سبد رزرو تور ("}/><ManagedText value={cartCount}/>)
        </span>
      </button>

      {/* Support Headset Button matching bottom-left cyan/green icon in screenshot */}
      <button type="button"
        onClick={onOpenSupport}
        className="relative group w-13 h-13 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white shadow-2xl flex items-center justify-center transition duration-300 hover:scale-110 cursor-pointer border-2 border-white"
        aria-label={siteText("تماس با پشتیبانی")}
        id="floating-support-btn"
      >
        <Headphones size={22} />
        <span className="absolute left-full ml-3 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none shadow-lg"><ManagedText value={"تماس با پشتیبانی (۰۹۲۱۵۰۱۴۴۷۴)"}/></span>
      </button>

    </div>
  );
};
