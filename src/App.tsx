/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PopularDestinations } from './components/PopularDestinations';
import { ExperienceSection } from './components/ExperienceSection';
import { BrandTrustSection } from './components/BrandTrustSection';
import { ServicesSection } from './components/ServicesSection';
import { DestinationTags } from './components/DestinationTags';
import { RecommendedTours } from './components/RecommendedTours';
import { PopularTours } from './components/PopularTours';
import { TravelCalendarSection } from './components/TravelCalendarSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { BookingSteps } from './components/BookingSteps';
import { WhyChooseUs } from './components/WhyChooseUs';
import { BlogSection } from './components/BlogSection';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CommunityMoments } from './components/CommunityMoments';
import { ShopSection } from './components/ShopSection';
import { ContactSection } from './components/ContactSection';

import { useMotionImages } from './hooks/useMotionImages';
import { useApplyDesignSettings } from './hooks/useDesignSettings';
import { authApi, type AuthUser } from './api/auth';

const VideoModal = lazy(() => import('./components/VideoModal').then(module => ({ default: module.VideoModal })));
const SearchModal = lazy(() => import('./components/SearchModal').then(module => ({ default: module.SearchModal })));
const BookingModal = lazy(() => import('./components/BookingModal').then(module => ({ default: module.BookingModal })));
const ContactModal = lazy(() => import('./components/ContactModal').then(module => ({ default: module.ContactModal })));
const CartDrawer = lazy(() => import('./components/CartDrawer').then(module => ({ default: module.CartDrawer })));
const EmailTicketModal = lazy(() => import('./components/EmailTicketModal').then(module => ({ default: module.EmailTicketModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const CompareDrawer = lazy(() => import('./components/CompareDrawer').then(module => ({ default: module.CompareDrawer })));
const AiTripPersonalizerModal = lazy(() => import('./components/AiTripPersonalizerModal').then(module => ({ default: module.AiTripPersonalizerModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(module => ({ default: module.UserProfileModal })));
const ShopPage = lazy(() => import('./components/ShopPagePro').then(module => ({ default: module.ShopPage })));
const AdminApp = lazy(() => import('./admin/AdminConsole'));

import { Destination, Tour, BlogPost } from './types';
import { POPULAR_TOURS } from './data/mockData';

export default function App() {
  const isAdminApp = window.location.pathname === '/admin' || window.location.hostname.toLowerCase().startsWith('admin.');
  if (isAdminApp) return <Suspense fallback={<div dir="rtl" className="grid min-h-screen place-items-center bg-[#062b27] text-sm font-bold text-white">در حال بارگذاری مرکز مدیریت…</div>}><AdminApp/></Suspense>;
  return <SiteApp/>;
}

function SiteApp() {
  useMotionImages();
  useApplyDesignSettings();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  useEffect(() => { authApi.me().then(({ user }) => setCurrentUser(user)).catch(() => setCurrentUser(null)); }, []);
  // Language State ('fa' | 'en')
  const [lang, setLang] = useState<'fa' | 'en'>('fa');

  // Weather theme state
  const [weatherTheme, setWeatherTheme] = useState<string>('rainy');

  // Modal & Drawer states
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');
  const [compareDrawerOpen, setCompareDrawerOpen] = useState(false);
  const [personalizerModalOpen, setPersonalizerModalOpen] = useState(false);
  const [profilePageOpen, setProfilePageOpen] = useState(() => window.location.pathname === '/profile');
  const [shopPageOpen, setShopPageOpen] = useState(() => window.location.pathname === '/shop');

  // Compare tours state (2-3 tours)
  const [selectedCompareTours, setSelectedCompareTours] = useState<Tour[]>([
    POPULAR_TOURS[0],
    POPULAR_TOURS[1]
  ]);

  // Email ticket modal state
  const [emailTicketModalOpen, setEmailTicketModalOpen] = useState(false);
  const [activeTicketData, setActiveTicketData] = useState<{
    tour: Tour | null;
    date: string;
    guests: number;
    fullName: string;
  }>({
    tour: POPULAR_TOURS[0],
    date: '۱۴۰۵/۰۶/۲۰',
    guests: 2,
    fullName: 'سامان ملک‌زاده'
  });

  // Selected items for booking
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const hasOpenOverlay = videoModalOpen || searchModalOpen || contactModalOpen || cartOpen || authModalOpen || compareDrawerOpen || personalizerModalOpen || emailTicketModalOpen || bookingModalOpen;

  useEffect(() => {
    if (!hasOpenOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeTopOverlay = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (bookingModalOpen) setBookingModalOpen(false);
      else if (emailTicketModalOpen) setEmailTicketModalOpen(false);
      else if (personalizerModalOpen) setPersonalizerModalOpen(false);
      else if (compareDrawerOpen) setCompareDrawerOpen(false);
      else if (cartOpen) setCartOpen(false);
      else if (authModalOpen) setAuthModalOpen(false);
      else if (searchModalOpen) setSearchModalOpen(false);
      else if (videoModalOpen) setVideoModalOpen(false);
      else if (contactModalOpen) setContactModalOpen(false);
    };
    document.addEventListener('keydown', closeTopOverlay);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeTopOverlay); };
  }, [hasOpenOverlay, bookingModalOpen, emailTicketModalOpen, personalizerModalOpen, compareDrawerOpen, cartOpen, authModalOpen, searchModalOpen, videoModalOpen, contactModalOpen]);

  const openProfilePage = useCallback(() => {
    if (window.location.pathname !== '/profile') {
      window.history.pushState({ page: 'profile' }, '', '/profile');
    }
    setProfilePageOpen(true);
    window.scrollTo({ top: 0 });
  }, []);

  const closeProfilePage = useCallback(() => {
    if (window.location.pathname !== '/') {
      window.history.replaceState({ page: 'home' }, '', '/');
    }
    setProfilePageOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  const requireProfileAuth = useCallback(() => {
    window.history.replaceState({ page: 'home' }, '', '/');
    setProfilePageOpen(false);
    setAuthInitialTab('login');
    setAuthModalOpen(true);
  }, []);

  useEffect(() => {
    const syncPageFromUrl = () => { setProfilePageOpen(window.location.pathname === '/profile'); setShopPageOpen(window.location.pathname === '/shop'); };
    window.addEventListener('popstate', syncPageFromUrl);
    return () => window.removeEventListener('popstate', syncPageFromUrl);
  }, []);

  // Cart booked tours list
  const [cartItems, setCartItems] = useState<{ tour: Tour; date: string; guests: number }[]>([
    { tour: POPULAR_TOURS[0], date: '۱۴۰۵/۰۶/۲۰', guests: 2 }
  ]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'fa' ? 'en' : 'fa'));
  };

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === 'shop') {
      if (window.location.pathname !== '/shop') window.history.pushState({ page: 'shop' }, '', '/shop');
      setShopPageOpen(true); window.scrollTo({ top: 0 }); return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectDestination = (destination: Destination) => {
    const matchingTour = POPULAR_TOURS.find((t) => t.country === destination.country) || POPULAR_TOURS[0];
    setSelectedTour(matchingTour);
    setBookingModalOpen(true);
  };

  const handleSelectTour = (tour: Tour) => {
    setSelectedTour(tour);
    setBookingModalOpen(true);
  };

  const handleAddCompareTour = (tour: Tour) => {
    if (selectedCompareTours.length >= 3) return;
    if (!selectedCompareTours.some(t => t.id === tour.id)) {
      setSelectedCompareTours(prev => [...prev, tour]);
    }
  };

  const handleRemoveCompareTour = (tourId: string) => {
    setSelectedCompareTours(prev => prev.filter(t => t.id !== tourId));
  };

  const handleConfirmBooking = (tour: Tour, date: string, guests: number) => {
    setCartItems((prev) => [...prev, { tour, date, guests }]);
    setCartOpen(true);
  };

  const handleShowEmailTicket = (tour: Tour, date: string, guests: number, fullName: string) => {
    setActiveTicketData({ tour, date, guests, fullName: fullName || 'سامان ملک‌زاده' });
    setEmailTicketModalOpen(true);
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    setCartOpen(false);
    setContactModalOpen(true);
  };

  if (profilePageOpen) {
    return (
      <Suspense fallback={<div role="status" dir="rtl" className="grid min-h-screen place-items-center bg-[#061417] font-['Vazirmatn'] text-sm font-bold text-white">در حال بارگذاری پروفایل…</div>}>
        <UserProfileModal
          isOpen
          onClose={closeProfilePage}
          onRequireAuth={requireProfileAuth}
        />
      </Suspense>
    );
  }

  if (shopPageOpen) {
    return <Suspense fallback={<div dir="rtl" className="grid min-h-screen place-items-center bg-[#061417] text-sm font-bold text-white">در حال آماده‌سازی فروشگاه…</div>}><ShopPage onBack={()=>{window.history.replaceState({page:'home'},'', '/');setShopPageOpen(false);window.scrollTo({top:0})}} onSupport={()=>setContactModalOpen(true)}/><ContactModal isOpen={contactModalOpen} onClose={()=>setContactModalOpen(false)}/></Suspense>;
  }

  return (
    <div
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      className="nature-app min-h-screen bg-[#edf3ee] text-[#14241f] font-['Vazirmatn'] selection:bg-[#b7ef45] selection:text-[#092f28] flex flex-col relative"
    >
      {/* Animated Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Main Content Sections */}
      <main className="flex-1">

        {/* Full-screen Hero with transparent header overlay */}
        <div className="relative">
          <Header
            overlay
            onOpenSearch={() => setSearchModalOpen(true)}
            onOpenContact={() => setContactModalOpen(true)}
            onNavigateSection={handleNavigateSection}
            lang={lang}
            onToggleLang={toggleLanguage}
            onOpenAuth={(tab) => {
              setAuthInitialTab(tab || 'login');
              setAuthModalOpen(true);
            }}
            currentUserName={currentUser?.fullName}
            onOpenProfile={openProfilePage}
          />

          <Hero
            onOpenVideo={() => setVideoModalOpen(true)}
            onOpenContact={() => setContactModalOpen(true)}
            onNavigateSection={handleNavigateSection}
            weatherTheme={weatherTheme}
            onWeatherChange={setWeatherTheme}
          />
        </div>

        {/* 2. Popular Destinations Section (مقصد محبوب) */}
        <PopularDestinations
          onSelectDestination={handleSelectDestination}
        />

        {/* Community Moments (عکس‌های واقعی زنده همنوردان در کمپ) */}
        <CommunityMoments />

        {/* Interactive Travel & Tour Schedule Calendar (تقویم سفری - رنگ روشن نود) */}
        <TravelCalendarSection
          onSelectTour={handleSelectTour}
        />

        {/* 3. About / Experience Section */}
        <ExperienceSection
          onOpenContact={() => setContactModalOpen(true)}
        />

        {/* 4. Brand Trust Banner */}
        <BrandTrustSection />

        {/* 5. Services Section */}
        <ServicesSection
          onOpenContact={() => setContactModalOpen(true)}
        />

        <ShopSection onOpenContact={() => setContactModalOpen(true)} />

        {/* 7. Quick Destination Search Tags */}
        <DestinationTags
          onSelectTag={(tagName) => {
            setSearchModalOpen(true);
          }}
        />

        {/* Recommended for You Section */}
        <RecommendedTours
          onSelectTour={handleSelectTour}
        />

        {/* 8. Popular Tours Section */}
        <PopularTours
          onSelectTour={handleSelectTour}
        />

        {/* 9. Customer Testimonials Section */}
        <TestimonialsSection lang={lang} />

        {/* 11. Booking Steps */}
        <BookingSteps
          onOpenBooking={() => {
            setSelectedTour(POPULAR_TOURS[0]);
            setBookingModalOpen(true);
          }}
        />

        {/* 12. Why Choose Us Section */}
        <WhyChooseUs
          onOpenContact={() => setContactModalOpen(true)}
          onNavigateSection={handleNavigateSection}
        />

        {/* 13. Latest Blog / News Section */}
        <BlogSection
          onSelectPost={() => setContactModalOpen(true)}
        />

        <ContactSection onOpenContact={() => setContactModalOpen(true)} />

      </main>

      {/* Footer */}
      <Footer
        onNavigateSection={handleNavigateSection}
        onOpenContact={() => setContactModalOpen(true)}
      />

      {/* Floating Action Buttons */}
      <FloatingActions
        onOpenSupport={() => setContactModalOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenCompare={() => setCompareDrawerOpen(true)}
        onOpenPersonalizer={() => setPersonalizerModalOpen(true)}
        cartCount={cartItems.length}
        compareCount={selectedCompareTours.length}
      />

      {/* Modals & Drawers */}
      <Suspense fallback={<div role="status" aria-live="polite" className="fixed inset-x-0 bottom-4 z-[100] mx-auto w-fit rounded-full bg-slate-900 px-5 py-2 text-sm text-white shadow-xl">در حال بارگذاری…</div>}>
      <VideoModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTour={handleSelectTour}
      />

      <BookingModal
        isOpen={bookingModalOpen}
        tour={selectedTour}
        onClose={() => setBookingModalOpen(false)}
        onConfirmBooking={handleConfirmBooking}
        onShowEmailTicket={handleShowEmailTicket}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      <CartDrawer
        isOpen={cartOpen}
        cartItems={cartItems}
        onClose={() => setCartOpen(false)}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleCheckout}
        onViewEmailTicket={(item) => {
          handleShowEmailTicket(item.tour, item.date, item.guests, 'سامان ملک‌زاده');
        }}
      />

      <EmailTicketModal
        isOpen={emailTicketModalOpen}
        tour={activeTicketData.tour}
        date={activeTicketData.date}
        guests={activeTicketData.guests}
        fullName={activeTicketData.fullName}
        onClose={() => setEmailTicketModalOpen(false)}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authInitialTab}
        onLoginSuccess={() => {
          setAuthModalOpen(false);
          authApi.me().then(({ user }) => { setCurrentUser(user); openProfilePage(); }).catch(() => undefined);
        }}
      />

      <CompareDrawer
        isOpen={compareDrawerOpen}
        onClose={() => setCompareDrawerOpen(false)}
        selectedTours={selectedCompareTours}
        allTours={POPULAR_TOURS}
        onRemoveTour={handleRemoveCompareTour}
        onAddTour={handleAddCompareTour}
        onSelectBooking={handleSelectTour}
      />

      <AiTripPersonalizerModal
        isOpen={personalizerModalOpen}
        onClose={() => setPersonalizerModalOpen(false)}
        allTours={POPULAR_TOURS}
        onSelectBooking={handleSelectTour}
      />
      </Suspense>

    </div>
  );
}
