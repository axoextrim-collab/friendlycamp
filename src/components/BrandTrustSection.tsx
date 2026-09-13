import React from 'react';
import { BRAND_PARTNERS } from '../data/mockData';
import { Shield, Globe, Award, Sparkles } from 'lucide-react';

export const BrandTrustSection: React.FC = () => {
  return (
    <section className="py-8 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-100 relative overflow-hidden">
        
        {/* Ticket edge pattern decoration */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Brand Partner Logos Grid */}
          <div className="flex-1 w-full overflow-x-auto py-2 scrollbar-none">
            <div className="flex items-center justify-around gap-8 min-w-[500px]">
              {BRAND_PARTNERS.map((brand, idx) => (
                <div key={idx} className="flex flex-col items-center group cursor-pointer">
                  <span className="font-serif font-black text-xl md:text-2xl text-slate-400 group-hover:text-[#004e5a] transition tracking-wider">
                    {brand.name}
                  </span>
                  <span className="text-[10px] tracking-widest text-slate-400 font-sans font-bold group-hover:text-amber-500">
                    {brand.subtitle}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Header Text (+1K) */}
          <div className="flex items-center gap-3 bg-[#f0fdf4] px-6 py-4 rounded-2xl border border-emerald-200 shrink-0 text-right">
            <div className="w-12 h-12 rounded-xl bg-[#84cc16] text-[#064e3b] font-black text-xl flex items-center justify-center shadow-md">
              ۱K+
            </div>
            <div>
              <h3 className="font-black text-[#003843] text-lg">
                برندها به ما <span className="text-amber-500">اعتماد کنید</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">همکاری با معتبرترین آژانس‌های دنیا</p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
