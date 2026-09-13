import React, { useState, useEffect } from 'react';
import { Search, Menu, X, ChevronDown, PhoneCall, Sparkles, Languages, User } from 'lucide-react';
import { FriendlyCampLogo } from './FriendlyCampLogo';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenContact: () => void;
  onNavigateSection: (sectionId: string) => void;
  lang?: 'fa' | 'en';
  onToggleLang?: () => void;
  onOpenAuth?: (initialTab?: 'login' | 'register') => void;
  onOpenProfile?: () => void;
  currentUserName?: string;
  overlay?: boolean;
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
  overlay = false
}) => {
  const [pagesDropdownOpen, setPagesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [overlay]);

  const isFa = lang === 'fa';

  const navItems = [
    { label: isFa ? 'خانه' : 'Home', id: 'hero' },
    { label: isFa ? 'تقویم سفری' : 'Calendar', id: 'calendar' },
    { label: isFa ? 'تورها' : 'Tours', id: 'tours' },
    { label: isFa ? 'فروشگاه' : 'Shop', id: 'shop' },
    { label: isFa ? 'مقاصد' : 'Destinations', id: 'destinations' },
    { label: isFa ? 'درباره ما' : 'About', id: 'experience' },
    { label: isFa ? 'بلاگ' : 'Blog', id: 'blog' },
    { label: isFa ? 'تماس با ما' : 'Contact', id: 'contact' }
  ];

  const handleNavClick = (id: string) => {
    onNavigateSection(id);
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
    <header className={`${headerPositionClass} px-3 md:px-8 pt-2 pb-1 transition-all duration-300`}>
      <div className={`max-w-7xl mx-auto ${headerShellClass} rounded-xl px-4 md:px-8 py-3 border flex items-center justify-between text-white relative transition-all duration-300`}>
        
        {/* Left Side (RTL): Hamburger, Search and authentication */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-full hover:bg-white/10 transition text-white lg:hidden"
            aria-label="منو"
            id="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-full hover:bg-white/10 transition text-white/90 hover:text-white"
            title={isFa ? 'جستجو' : 'Search'}
            id="header-search-btn"
          >
            <Search size={20} />
          </button>

          {/* Login / Register Button */}
          {currentUserName && onOpenProfile ? (
            <button onClick={onOpenProfile} className="flex items-center gap-2 bg-lime-300 text-emerald-950 px-4 py-2 rounded-full text-xs font-black shadow-lg hover:bg-lime-200 transition" id="header-profile-btn" aria-label="باز کردن پروفایل همسفر">
              <User size={16}/><span className="max-w-28 truncate">پروفایل {currentUserName.split(' ')[0]}</span>
            </button>
          ) : onOpenAuth && (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer border border-white/20 shadow-sm hover:scale-105"
              title={isFa ? 'ورود و ثبت‌نام همنوردان' : 'Login / Register'}
              id="header-auth-btn"
            >
              <User size={15} className="text-[#84cc16]" />
              <span>{isFa ? 'ورود | ثبت‌نام' : 'Login'}</span>
            </button>
          )}

        </div>

        {/* Desktop Menu Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-white/90">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item.id)}
              className="hover:text-[#f59e0b] transition cursor-pointer py-2"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Side (RTL): Brand Logo */}
        <div onClick={() => handleNavClick('hero')} className="cursor-pointer">
          <FriendlyCampLogo size="md" variant="light" />
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-3 top-20 bg-[#14382c] text-white rounded-xl p-6 shadow-2xl border border-white/10 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
            <FriendlyCampLogo size="sm" variant="light" />
            <button onClick={() => setMobileMenuOpen(false)} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col gap-3 font-medium">
            {navItems.map((item) => (
              <div key={item.label} className="border-b border-white/5 pb-2">
                <button
                  onClick={() => handleNavClick(item.id)}
                  className="w-full text-right py-1.5 text-white/90 hover:text-[#f59e0b] transition text-base font-semibold cursor-pointer"
                >
                  {item.label}
                </button>
              </div>
            ))}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="mt-4 w-full bg-[#f59e0b] text-slate-950 font-black py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <PhoneCall size={18} />
              <span>تماس با فرندلی کمپ</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
