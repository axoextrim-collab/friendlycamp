import { POLICY_KEYS, POLICY_TITLES } from '../types/travel';
import { PublishedFooterDetails } from '../cms/PublicContent';
import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React from 'react';
import { Phone, Mail, MapPin, Compass, Heart } from 'lucide-react';
import { FriendlyCampLogo } from './FriendlyCampLogo';
import { SiteLink } from '../routing/navigation';
import { sectionPath } from '../routing/routes';
import { NewsletterForm } from './NewsletterForm';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  onOpenContact
}) => {
  return (
    <footer className="bg-[#0b1e17] text-white pt-16 pb-8 border-t border-white/10 mt-12 relative overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12"><NewsletterForm /></div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10 text-right">
        
        {/* Col 1: Brand Info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <FriendlyCampLogo size="lg" variant="light" />

          <p className="text-xs text-emerald-100/70 leading-relaxed font-medium"><ManagedText value={"فرندلی کمپ؛ معرفی مقصدها و برنامه‌های طبیعت‌گردی، راهنمای انتخاب تجهیزات و هماهنگی سفرهای گروهی. خدمات، وسایل موردنیاز و شرایط هر برنامه را در جزئیات همان سفر بررسی کن."}/></p>

          <div className="flex flex-wrap items-center gap-3 pt-2"><SiteLink href="/#travel-roadmap" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-emerald-100 transition hover:bg-white/10"><Compass size={16} /><ManagedText value={"نقشه راه سفر"}/></SiteLink><SiteLink href="/contact" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs text-emerald-100 transition hover:bg-white/10"><Phone size={16} /><ManagedText value={"تماس با فرندلی کمپ"}/></SiteLink></div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="font-extrabold text-[#f59e0b] text-base mb-4"><ManagedText value={"دسترسی سریع"}/></h4>
          <ul className="flex flex-col gap-2.5 text-xs text-emerald-100/80 font-medium">
            <li><SiteLink href="/tours" className="hover:text-[#f59e0b] transition"><ManagedText value={"فهرست تورها"}/></SiteLink></li>
            <li><SiteLink href="/shop" className="hover:text-[#f59e0b] transition"><ManagedText value={"فروشگاه تجهیزات"}/></SiteLink></li>
            <li><SiteLink href="/account" className="hover:text-[#f59e0b] transition"><ManagedText value={"حساب کاربری"}/></SiteLink></li>
            <li>
              <SiteLink href={sectionPath('hero')} className="hover:text-[#f59e0b] transition"><ManagedText value={"صفحه اصلی"}/></SiteLink>
            </li>
            <li>
              <SiteLink href={sectionPath('experience')} className="hover:text-[#f59e0b] transition"><ManagedText value={"درباره فرندلی کمپ"}/></SiteLink>
            </li>
            <li>
              <SiteLink href={sectionPath('services')} className="hover:text-[#f59e0b] transition"><ManagedText value={"تجهیزات و خدمات کمپ"}/></SiteLink>
            </li>
            <li>
              <SiteLink href={sectionPath('destinations')} className="hover:text-[#f59e0b] transition"><ManagedText value={"مقاصد محبوب طبیعت‌گردی"}/></SiteLink>
            </li>
            <li>
              <SiteLink href={sectionPath('calendar')} className="hover:text-[#f59e0b] transition"><ManagedText value={"برنامه تورهای فعال"}/></SiteLink>
            </li>
          </ul>
        </div>

        {/* Col 3: Services */}
        <div>
          <h4 className="font-extrabold text-[#f59e0b] text-base mb-4"><ManagedText value={"خدمات اعضا"}/></h4>
          <ul className="flex flex-col gap-2.5 text-xs text-emerald-100/80 font-medium">
            <li>
              <SiteLink href={sectionPath('why-choose-us')} className="hover:text-[#f59e0b] transition"><ManagedText value={"پشتیبانی و هماهنگی سفر"}/></SiteLink>
            </li>
            <li>
              <SiteLink href="/contact" className="hover:text-[#f59e0b] transition"><ManagedText value={"اجاره تجهیزات کمپینگ"}/></SiteLink>
            </li>
            <li>
              <SiteLink href={sectionPath('blog')} className="hover:text-[#f59e0b] transition"><ManagedText value={"مجله آموزش کمپینگ"}/></SiteLink>
            </li>
            <li>
              <SiteLink href="/terms" className="hover:text-[#f59e0b] transition"><ManagedText value={"قوانین و مقررات تورها"}/></SiteLink>
            </li>
            <li>
              <SiteLink href="/leaders" className="hover:text-[#f59e0b] transition"><ManagedText value={"پروفایل و مدارک لیدرها"}/></SiteLink>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact Info */}
        <div>
          <h4 className="font-extrabold text-[#f59e0b] text-base mb-4"><ManagedText value={"ارتباط با فرندلی کمپ"}/></h4>
          <ul className="flex flex-col gap-3 text-xs text-emerald-100/80 font-medium">
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-[#f59e0b] shrink-0" />
              <ManagedAnchor href="tel:09215014474" className="hover:text-[#f59e0b] dir-ltr font-mono font-bold"><ManagedText value={"۰۹۲۱۵۰۱۴۴۷۴"}/></ManagedAnchor>
            </li>

          </ul>
<nav aria-label="شرایط و اطلاعات سفر" className="mt-5 grid grid-cols-2 gap-2 text-sm">{POLICY_KEYS.map(key=><SiteLink key={key} className="inline-flex min-h-11 items-center" href={`/${key}`}>{POLICY_TITLES[key]}</SiteLink>)}</nav>
          <PublishedFooterDetails/>
          <SiteLink href="/admin" className="mt-5 inline-flex min-h-11 items-center text-sm underline">ورود همکاران</SiteLink>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/60 font-medium gap-4">
        <p><ManagedText value={"© ۱۴۰۵ تمامی حقوق این وب‌سایت متعلق به باشگاه طبیعت‌گردی فرندلی کمپ (Friendly Camp) است."}/></p>
        <div className="flex items-center gap-1">
          <span><ManagedText value={"طراحی شده با"}/></span>
          <Heart size={14} className="text-red-500 fill-red-500" />
          <span><ManagedText value={"برای همنوردان فرندلی کمپ"}/></span>
        </div>
      </div>

    </footer>
  );
};

