import { ManagedText, ManagedAnchor, siteText } from '../cms/PublicContent';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Menu, X, ShoppingBag, User, LayoutDashboard } from 'lucide-react';
import type {AccountRole} from '../types/control';
import {accountDestination,hasManagementAccess} from '../routing/accountDestination';
import { FriendlyCampLogo } from './FriendlyCampLogo';
import { SiteLink, useSiteLocation } from '../routing/navigation';
import { sectionPath } from '../routing/routes';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
  lang?: 'fa' | 'en';
  onToggleLang?: () => void;
  onOpenAuth?: (initialTab?: 'login' | 'register') => void;
  onOpenProfile?: () => void;
  currentUserName?: string;
  currentUserRole?: AccountRole;
  overlay?: boolean;
  onOpenCart?: () => void;
  cartCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenContact,
  onNavigateSection,
  lang = 'fa',
  onToggleLang,
  onOpenAuth,
  onOpenProfile,
  currentUserName,
  currentUserRole,
  overlay = false,
  onOpenCart,
  cartCount = 0
}) => {
  const [pagesDropdownOpen, setPagesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const outside = (event: PointerEvent) => { if (!headerRef.current?.contains(event.target as Node)) setMobileMenuOpen(false); };
    const leave = (event: FocusEvent) => { if (!headerRef.current?.contains(event.target as Node)) setMobileMenuOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMobileMenuOpen(false); menuButtonRef.current?.focus(); } };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const resize = () => { if (desktop.matches) setMobileMenuOpen(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    document.addEventListener('focusin', leave);
    headerRef.current?.querySelector<HTMLElement>('#mobile-site-navigation a')?.focus({ preventScroll: true });
    desktop.addEventListener('change', resize);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); document.removeEventListener('focusin', leave); desktop.removeEventListener('change', resize); };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!overlay) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [overlay]);

  const isFa = lang === 'fa';
  const location = useSiteLocation();

  const navItems = [
    { label: isFa ? 'خانه' : 'Home', id: 'hero' },
    { label: isFa ? 'تقویم سفری' : 'Calendar', id: 'calendar' },
    { label: isFa ? 'تورها' : 'Tours', id: 'recommended-tours' },
    { label: isFa ? 'فروشگاه' : 'Shop', id: 'shop' },
    { label: isFa ? 'مقاصد' : 'Destinations', id: 'destinations' },
    { label: isFa ? 'درباره ما' : 'About', id: 'experience' },
    { label: isFa ? 'بلاگ' : 'Blog', id: 'blog' },
    { label: isFa ? 'تماس با ما' : 'Contact', id: 'contact' }
  ];

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    setPagesDropdownOpen(false);
  };

  const headerShellClass = overlay
    ? isScrolled
      ? 'bg-[#14382c]/95 backdrop-blur-md shadow-xl border-white/10'
      : 'bg-black/20 backdrop-blur-sm border-white/10'
    : 'bg-[#14382c]/95 backdrop-blur-md shadow-xl border-white/10';

  const headerPositionClass = overlay ? 'fixed top-0 inset-x-0 z-50' : 'sticky top-0 z-50';

  return (
    <header ref={headerRef} className={`fc-site-header ${headerPositionClass} px-3 md:px-8 pt-2 pb-1 transition-all duration-300`}>
      <div className={`fc-header-shell max-w-7xl mx-auto ${headerShellClass} rounded-xl px-4 md:px-8 py-3 border flex items-center justify-between text-white relative transition-all duration-300`}>
        
        {/* Left Side (RTL): Hamburger, Search and authentication */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button type="button"
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-full hover:bg-white/10 transition text-white lg:hidden"
            aria-label={siteText(mobileMenuOpen ? 'بستن منوی اصلی' : 'باز کردن منوی اصلی')}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-site-navigation"
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <button type="button"
            onClick={onOpenSearch}
            className="p-2.5 rounded-full hover:bg-white/10 transition text-white/90 hover:text-white"
            title={siteText(isFa ? 'جستجو' : 'Search')}
            aria-label={siteText(isFa ? 'جست‌وجوی سایت' : 'Search site')}
            id="header-search-btn"
          >
            <Search size={20} />
          </button>

          {/* Login / Register Button */}
          {currentUserName && onOpenProfile ? (
            <SiteLink href={accountDestination(currentUserRole)} className="flex items-center gap-2 bg-lime-300 text-emerald-950 px-4 py-2 rounded-full text-xs font-black shadow-lg hover:bg-lime-200 transition" id="header-profile-btn" aria-label={hasManagementAccess(currentUserRole)?'باز کردن پنل مدیریت':siteText("باز کردن پروفایل همسفر")}>
              {hasManagementAccess(currentUserRole)?<LayoutDashboard size={20}/>:<User size={20}/>}<span className="max-w-28 truncate hidden sm:inline">{hasManagementAccess(currentUserRole)?'پنل مدیریت':<><ManagedText value={"پروفایل "}/><ManagedText value={currentUserName.split(' ')[0]}/></>}</span>
            </SiteLink>
          ) : onOpenAuth && (
            <SiteLink href="/login"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer border border-white/20 shadow-sm hover:scale-105"
              title={siteText(isFa ? 'ورود و ثبت‌نام همنوردان' : 'Login / Register')}
              id="header-auth-btn"
            >
              <User size={18} className="text-[#84cc16] hidden sm:block" />
              <span className="sm:hidden"><ManagedText value={isFa ? 'ورود' : 'Login'}/></span><span className="hidden sm:inline"><ManagedText value={isFa ? 'ورود | ثبت‌نام' : 'Login'}/></span>
            </SiteLink>
          )}

        </div>

        {/* Desktop Menu Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-white/90">
          {navItems.map((item) => (
            <SiteLink href={sectionPath(item.id)} aria-current={(location.pathname === sectionPath(item.id) || (sectionPath(item.id) !== '/' && location.pathname.startsWith(sectionPath(item.id) + '/'))) ? 'page' : undefined}
              key={item.label}
              onClick={() => handleNavClick(item.id)}
              className="header-menu-link cursor-pointer py-2"
            >
              <ManagedText value={item.label}/>
            </SiteLink>
          ))}
        </nav>

        {/* Right Side (RTL): Brand Logo */}
        <SiteLink href="/" aria-label={siteText("صفحه اصلی فرندلی کمپ")} onClick={() => handleNavClick('hero')} className="fc-header-brand cursor-pointer">
          <FriendlyCampLogo size="md" variant="light" />
        </SiteLink>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && <nav id="mobile-site-navigation" className="fc-mobile-nav lg:hidden" aria-label={siteText(isFa ? 'منوی اصلی موبایل' : 'Mobile navigation')}>
        <div className="fc-mobile-nav-heading"><strong><ManagedText value={isFa ? 'مسیرت را انتخاب کن' : 'Explore Friendly Camp'}/></strong><button type="button" aria-label={siteText("بستن منوی اصلی")} onClick={() => { setMobileMenuOpen(false); menuButtonRef.current?.focus(); }}><X size={22}/></button></div>
        <div className="fc-mobile-nav-grid">{navItems.map(item => <SiteLink key={item.id} href={sectionPath(item.id)} aria-current={location.pathname === sectionPath(item.id) ? 'page' : undefined} onClick={() => handleNavClick(item.id)}><ManagedText value={item.label}/></SiteLink>)}</div>
        <div className="fc-mobile-nav-tools">{onOpenCart && <button type="button" onClick={() => { menuButtonRef.current?.focus({ preventScroll: true }); setMobileMenuOpen(false); onOpenCart(); }}><ShoppingBag size={18}/><ManagedText value={"سبد رزرو"}/><ManagedText value={cartCount ? ` (${cartCount.toLocaleString('fa-IR')})` : ''}/></button>}<SiteLink href="/booking/receipt" onClick={() => setMobileMenuOpen(false)}><ManagedText value={"پیگیری رزرو"}/></SiteLink></div>
      </nav>}

    </header>
  );
};
