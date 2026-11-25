import { ManagedText, ManagedAnchor, siteText } from './cms/PublicContent';
import { usePublicContent, PublicContentStatus } from './cms/PublicContent';
import { PendingScreen } from './components/PendingScreen';
import { MobileHomeSection } from './components/MobileHomeSection';
import {accountDestination,hasManagementAccess,signInDestination} from './routing/accountDestination';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PopularDestinations } from './components/PopularDestinations';
import { ExperienceSection } from './components/ExperienceSection';
import { ServicesSection } from './components/ServicesSection';
import { RecommendedTours } from './components/RecommendedTours';
import { TravelCalendarSection } from './components/TravelCalendarSection';
import { BookingSteps } from './components/BookingSteps';
import { WhyChooseUs } from './components/WhyChooseUs';
import { Footer } from './components/Footer';
import { FloatingActions } from './components/FloatingActions';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { ContactSection } from './components/ContactSection';

import { useMotionImages } from './hooks/useMotionImages';
import { useApplyDesignSettings } from './hooks/useDesignSettings';
import { authApi, type AuthUser } from './api/auth';
import { SiteSearch } from './components/SiteSearch';
import { TourCartDrawer } from './components/TourCartDrawer';
import { addTourToCart, sanitizeTourCart, tourCartInquiry, TOUR_CART_KEY, type TourCartItem } from './utils/tourCart';
import { navigateTo, useSiteLocation } from './routing/navigation';
import { destinationPath, legacyRouteRedirect, resolveRoute, sectionPath, tourPath } from './routing/routes';
import { applyPageMetadata, routeMetadata } from './routing/metadata';
const SitePages=lazy(()=>import('./components/pages/SitePages').then(module=>({default:module.SitePages})));

const AuthModal = lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(module => ({ default: module.UserProfileModal })));
const ShopPage = lazy(() => import('./components/ShopPagePro').then(module => ({ default: module.ShopPage })));
const AdminApp = lazy(() => import('./admin/ManagementConsole'));

import { Destination, Tour } from './types';
import { useTourCatalog } from './hooks/useTourCatalog';
import { BookingScreens } from './components/booking/BookingScreens';

export default function App() {
  useSiteLocation();
  const isAdminApp = resolveRoute(window.location.pathname).kind === 'admin' || window.location.hostname.toLowerCase().startsWith('admin.');
  useEffect(()=>{if(isAdminApp)applyPageMetadata(routeMetadata(resolveRoute('/admin')));},[isAdminApp]);
  if (isAdminApp) return <Suspense fallback={<PendingScreen />}><AdminApp/></Suspense>;
  return <SiteApp/>;
}

function SiteApp() {
  const publicContent = usePublicContent();
  const location = useSiteLocation();
  const route = resolveRoute(location.pathname);
  const authRoute = route.kind === 'login' || route.kind === 'register';
  const { tours, loading: toursLoading, error: toursError } = useTourCatalog();
  useEffect(() => {
    const redirect = legacyRouteRedirect(location.pathname, location.search);
    if (redirect) { navigateTo(redirect + location.hash, { replace: true }); return; }
    if (!['shop', 'product', 'checkout', 'shop-manage'].includes(route.kind)) {const meta=routeMetadata(route,undefined,tours);if(route.kind==='home'&&publicContent.siteSettings){meta.title=publicContent.siteSettings.homeTitle||meta.title;meta.description=publicContent.siteSettings.homeDescription||meta.description;}applyPageMetadata(meta);}
  }, [location.pathname, location.search, tours, publicContent]);
  useEffect(() => { if (location.hash) requestAnimationFrame(() => { try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView(); } catch { /* Ignore malformed fragments. */ } }); }, [location.pathname, location.hash]);
  useMotionImages();
  useApplyDesignSettings(location.pathname);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading,setAuthLoading]=useState(true);
  useEffect(() => {let active=true;authApi.me().then(({user})=>{if(active)setCurrentUser(user);}).catch(()=>{if(active)setCurrentUser(null);}).finally(()=>{if(active)setAuthLoading(false);});return()=>{active=false;};}, []);
  // Language State ('fa' | 'en')
  const lang='fa' as const;

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStorageError, setCartStorageError] = useState(false);
  const [cartItems, setCartItems] = useState<TourCartItem[]>(() => { try { return sanitizeTourCart(JSON.parse(localStorage.getItem(TOUR_CART_KEY) || '[]')); } catch { return []; } });
  useEffect(() => { if (!toursLoading && !toursError) setCartItems(items => sanitizeTourCart(items, tours)); }, [tours, toursLoading, toursError]);
  const profilePageOpen = route.kind === 'account';
  useEffect(()=>{if(profilePageOpen&&currentUser&&hasManagementAccess(currentUser.role))navigateTo(accountDestination(currentUser.role),{replace:true});},[profilePageOpen,currentUser]);
  const shopPageOpen = ['shop', 'product', 'checkout', 'shop-manage'].includes(route.kind);
  useEffect(() => { try { localStorage.setItem(TOUR_CART_KEY, JSON.stringify(cartItems)); setCartStorageError(false); } catch { setCartStorageError(true); } }, [cartItems]);
  useEffect(() => { setSearchModalOpen(false); setCartOpen(false); }, [location.pathname]);
  const hasOpenOverlay = authRoute || searchModalOpen || cartOpen;
  useEffect(() => {
    if (!hasOpenOverlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [hasOpenOverlay]);
  const openSearch = (query = '') => { setSearchQuery(query); setSearchModalOpen(true); };

  const openProfilePage = useCallback(() => {
    navigateTo(accountDestination(currentUser?.role));
  }, [currentUser?.role]);

  const closeProfilePage = useCallback(() => {
    navigateTo('/');
  }, []);

  const requireProfileAuth = useCallback(() => {
    navigateTo('/login?returnTo=%2Faccount', { replace: true });
  }, []);

  const toggleLanguage = () => {
    // English remains unavailable until the complete Persian content is approved.
  };

  const handleNavigateSection = (sectionId: string) => {
    navigateTo(sectionPath(sectionId));
  };

  const handleSelectDestination = (destination: Destination) => {
    setSearchModalOpen(false); navigateTo(destinationPath(destination.id));
  };

  const handleSelectTour = (tour: Tour,departureId?:string) => {
    setSearchModalOpen(false); navigateTo(tourPath(tour.id)+(departureId?'?'+new URLSearchParams({departureId}):''));
  };

  const handleAddTourToCart = (tour: Tour) => { setCartItems(items => addTourToCart(items, tour.id)); setCartOpen(true); };
  const handleCartCheckout = () => { setCartOpen(false); if (cartItems.length === 1) { navigateTo(`/tours/${encodeURIComponent(cartItems[0].tourId)}/book?guests=${cartItems[0].guests}`); return; } const inquiry = tourCartInquiry(cartItems.map(item => ({ ...item, date: tours.find(tour => tour.id === item.tourId)?.departures.find(d => Date.parse(d.startsAt) > Date.now())?.startsAt.slice(0,10) || '' })), tours); navigateTo('/contact?' + new URLSearchParams(inquiry)); };

  if (!publicContent.ready && !publicContent.error && ['article','destination','blog'].includes(route.kind)) return <PendingScreen/>;

  if (['tour-booking','booking-return','booking-receipt','booking-test'].includes(route.kind)) return <BookingScreens route={route} />;

  if (profilePageOpen) {
    if(authLoading||currentUser&&hasManagementAccess(currentUser.role))return <PendingScreen/>;
    return (
      <Suspense fallback={<PendingScreen />}>
        <UserProfileModal
          isOpen
          onClose={closeProfilePage}
          onRequireAuth={requireProfileAuth}
          onUserChanged={setCurrentUser}
          onLogout={() => { setCurrentUser(null); closeProfilePage(); }}
        />
      </Suspense>
    );
  }

  if (shopPageOpen) {
    return <Suspense fallback={<PendingScreen />}><ShopPage onBack={()=>navigateTo('/')} onSupport={()=>navigateTo('/contact')}/></Suspense>;
  }

  return (
    <div
      dir={lang === 'fa' ? 'rtl' : 'ltr'}
      className={`${route.kind === 'home' ? 'nature-app fc-home' : 'page-app'} min-h-screen bg-[#edf3ee] text-[#14241f] font-['Vazirmatn'] selection:bg-[#b7ef45] selection:text-[#092f28] flex flex-col relative`}
    >
      <PublicContentStatus />
      {/* Animated Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {route.kind === 'home' ? <>
        {/* Full-screen Hero with transparent header overlay */}
        <div className="relative">
          <Header
            overlay
            onOpenCart={() => setCartOpen(true)} cartCount={cartItems.length}
            onOpenSearch={() => openSearch()}
            onOpenContact={() => navigateTo('/contact')}
            onNavigateSection={handleNavigateSection}
            lang={lang}
            onToggleLang={toggleLanguage}
            onOpenAuth={(tab) => {
              navigateTo(tab === 'register' ? '/register' : '/login');
            }}
            currentUserName={currentUser?.fullName}
            currentUserRole={currentUser?.role}
            onOpenProfile={openProfilePage}
          />

          <Hero
            onOpenContact={() => navigateTo('/contact')}
            onNavigateSection={handleNavigateSection}
          />
        </div>

        {/* 2. Popular Destinations Section (مقصد محبوب) */}
        <PopularDestinations
          onSelectDestination={handleSelectDestination}
        />


        {/* Interactive Travel & Tour Schedule Calendar (تقویم سفری - رنگ روشن نود) */}
        <TravelCalendarSection
          onSelectTour={handleSelectTour}
        />

        {/* 3. About / Experience Section */}
        <MobileHomeSection sectionId="experience" title={siteText("درباره فرندلی کمپ")} description="معرفی باشگاه و شیوهٔ انتخاب برنامهٔ سفر."><ExperienceSection
          onOpenContact={() => navigateTo('/contact')}
        /></MobileHomeSection>

        {/* 5. Services Section */}
        <MobileHomeSection sectionId="services" title={siteText("خدمات سفر")} description="تجهیزات، همراهی گروه، پذیرایی و رفت‌وآمد؛ متناسب با هر برنامه."><ServicesSection
          onOpenContact={() => navigateTo('/contact')}
        /></MobileHomeSection>



        {/* Recommended for You Section */}
        <MobileHomeSection sectionId="recommended-tours" title={siteText("پیشنهاد متناسب با سفر تو")} description="علاقه‌ها، زمان و بودجه‌ات را انتخاب کن تا برنامه‌های همخوان را ببینی."><RecommendedTours
          onSelectTour={handleSelectTour}
        /></MobileHomeSection>


        {/* 11. Booking Steps */}
        <MobileHomeSection sectionId="travel-roadmap" title={siteText("مراحل انتخاب و رزرو")} description="مسیر انتخاب برنامه، تکمیل مشخصات و بررسی رزرو."><BookingSteps
          onOpenBooking={() => navigateTo('/tours')}
        /></MobileHomeSection>

        {/* 12. Why Choose Us Section */}
        <MobileHomeSection sectionId="why-choose-us" title={siteText("هماهنگی پیش از سفر")} description="راه‌های ارتباط و مواردی که پیش از انتخاب برنامه بررسی می‌کنی."><WhyChooseUs
          onOpenContact={() => navigateTo('/contact')}
          onNavigateSection={handleNavigateSection}
        /></MobileHomeSection>


        <MobileHomeSection sectionId="contact" title={siteText("ارتباط با فرندلی کمپ")} description="برای هماهنگی سفر و پیگیری درخواست، راه‌های تماس را ببین."><ContactSection onOpenContact={() => navigateTo('/contact')} /></MobileHomeSection>
        </> : <>
          <Header onOpenCart={() => setCartOpen(true)} cartCount={cartItems.length} onOpenSearch={() => openSearch()} onOpenContact={() => navigateTo('/contact')} onNavigateSection={handleNavigateSection} lang={lang} onToggleLang={toggleLanguage} onOpenAuth={tab => navigateTo(tab === 'register' ? '/register' : '/login')} currentUserName={currentUser?.fullName} onOpenProfile={openProfilePage} />
          {authRoute ? <div className="sp-main"><div className="sp-page-heading"><span className="sp-eyebrow"><ManagedText value={"حساب همسفر"}/></span><h1><ManagedText value={route.kind === 'register' ? 'به جمع همسفرها بپیوند.' : 'به فرندلی کمپ خوش آمدی.'}/></h1><p><ManagedText value={"ورود و مدیریت اطلاعات سفر، در حساب شخصی تو."}/></p></div></div> : <Suspense fallback={<PendingScreen/>}><SitePages route={route} onAddTourToCart={handleAddTourToCart} /></Suspense>}
        </>}
      </main>

      {/* Footer */}
      <Footer
        onNavigateSection={handleNavigateSection}
        onOpenContact={() => navigateTo('/contact')}
      />

      {/* Floating Action Buttons */}
      {!authRoute && route.kind!=='support' && <FloatingActions
        onOpenSupport={() => navigateTo('/support')}
        onOpenCart={() => setCartOpen(true)}
        cartCount={cartItems.length}
      />}

      {/* Core tools are eager and independent of optional lazy overlays. */}
      <SiteSearch isOpen={searchModalOpen} initialQuery={searchQuery} onClose={() => setSearchModalOpen(false)} />
      <TourCartDrawer isOpen={cartOpen} items={cartItems} storageError={cartStorageError} onClose={() => setCartOpen(false)} onUpdate={(id, changes) => setCartItems(items => sanitizeTourCart(items.map(item => item.tourId === id ? { ...item, ...changes } : item), tours))} onRemove={id => setCartItems(items => items.filter(item => item.tourId !== id))} onCheckout={handleCartCheckout} />
      {authRoute && <Suspense fallback={<PendingScreen />}><AuthModal key={route.kind} isOpen initialTab={route.kind as 'login' | 'register'} onClose={() => navigateTo('/')} onLoginSuccess={user => { setCurrentUser(user);setAuthLoading(false);navigateTo(signInDestination(user.role,new URLSearchParams(location.search).get('returnTo'),window.location.origin),{replace:true}); }} /></Suspense>}


    </div>
  );
}
