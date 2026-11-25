import {FavoriteTours} from './pages/FavoriteTours';
import {accountDestination,hasManagementAccess} from '../routing/accountDestination';
import {navigateTo} from '../routing/navigation';
import {CapacityAlertsPanel} from './CapacityAlerts';
import './pages/tour-discovery.css';
import { AccountBookings, AccountSupport } from './profile/AccountBookings';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpLeft, Check, ChevronDown, ChevronLeft, Headphones, LoaderCircle, LogOut, Menu, RotateCcw, Save, X } from 'lucide-react';
import { authApi, type AuthUser } from '../api/auth';
import { ProfileApiError, profileApi, type TravelProfile } from '../api/profile';
import { PROFILE_NAVIGATION, PROFILE_PAGES, profilePageFromHash, type ProfilePage } from '../data/profileNavigation';
import { profileCompletion, profileDate } from '../utils/profileForm';
import { normalizePhone } from '../utils/authForm';
import { FriendlyCampLogo } from './FriendlyCampLogo';
import { AccountForm, PasswordForm, ProfileEditor, type AccountDraft } from './profile/ProfileForms';
import { ClubPanel, ProfileOverview, WalletPanel } from './profile/ProfileOverview';
import { emptyStory, MediaPanel, StoriesPanel, StoryForm, type Story, type StoryDraft } from './profile/ProfileJournal';
import { ConfirmDialog } from './profile/ProfileUI';
import './profile/profile.css';

interface Props { isOpen: boolean; onClose: () => void; onRequireAuth: () => void; onUserChanged?: (user: AuthUser) => void; onLogout?: () => void }
type Notice = { kind: 'success' | 'error'; text: string };
const accountFromUser = (user: AuthUser): AccountDraft => ({ fullName: user.fullName, phone: user.phone, email: user.email, nationalCode: user.nationalCode || '' });

export function UserProfileModal({ isOpen, onClose, onRequireAuth, onUserChanged, onLogout }: Props) {
  const [page, setPage] = useState<ProfilePage>(() => profilePageFromHash(window.location.hash));
  const [profile, setProfile] = useState<TravelProfile | null>(null);
  const [saved, setSaved] = useState<TravelProfile | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [account, setAccount] = useState<AccountDraft>({ fullName: '', phone: '', email: '', nationalCode: '' });
  const [story, setStory] = useState<StoryDraft>(emptyStory);
  const [mediaDirty, setMediaDirty] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(() => [PROFILE_NAVIGATION.find(group => group.items.some(item => item.id === page))?.id || 'home']);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; text: string; action: string; perform: () => void | Promise<void> } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false); const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController(); setLoading(true); setNotice(null);
    profileApi.get(controller.signal).then(data => {
      if (controller.signal.aborted) return;
      if(hasManagementAccess(data.user.role)){navigateTo(accountDestination(data.user.role),{replace:true});return;}
      setProfile(data.profile); setSaved(data.profile); setUser(data.user); setAccount(accountFromUser(data.user));
    }).catch(error => {
      if (controller.signal.aborted) return;
      if (error instanceof ProfileApiError && error.status === 401) onRequireAuth();
      else setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'بارگذاری حساب انجام نشد.' });
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [isOpen, onRequireAuth, reload]);

  const profileDirty = !!profile && !!saved && JSON.stringify(profile) !== JSON.stringify(saved);
  const accountDirty = !!user && JSON.stringify(account) !== JSON.stringify(accountFromUser(user));
  const originalStory = saved?.stories.find(item => item.id === story.id);
  const storyDirty = story.id
    ? !originalStory || ['title', 'destination', 'date', 'body'].some(key => story[key as keyof StoryDraft] !== originalStory[key as keyof Story])
    : Boolean(story.title || story.body || story.destination || story.date);
  const hasDraft = profileDirty || accountDirty || storyDirty || mediaDirty;

  useEffect(() => {
    if (!hasDraft) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [hasDraft]);

  useEffect(() => { if (!loading) headingRef.current?.focus({ preventScroll: true }); }, [page, loading]);
  useEffect(() => {
    if (notice?.kind !== 'error') return;
    const element = noticeRef.current; const rect = element?.getBoundingClientRect();
    if (rect && (rect.top < 20 || rect.bottom > window.innerHeight)) element?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [notice]);

  const navigate = useCallback((next: ProfilePage) => {
    if (busyRef.current) return;
    setPage(next); setNotice(null); setMobileOpen(false);
    const group = PROFILE_NAVIGATION.find(group => group.items.some(item => item.id === next));
    if (group) setOpenGroups(current => current.includes(group.id) ? current : [...current, group.id]);
    window.history.replaceState({ page: 'profile' }, '', `/account#${next}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    const sync = () => navigate(profilePageFromHash(window.location.hash));
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [navigate]);

  async function execute(name: string, job: () => Promise<void>, message?: string) {
    if (busyRef.current) return false;
    busyRef.current = true; setBusy(name); setNotice(null);
    try { await job(); if (mountedRef.current && message) setNotice({ kind: 'success', text: message }); return true; }
    catch (error) {
      if (mountedRef.current) {
        if (error instanceof ProfileApiError && error.status === 401) onRequireAuth();
        else setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'درخواست انجام نشد. دوباره تلاش کن.' });
      }
      return false;
    } finally { busyRef.current = false; if (mountedRef.current) setBusy(''); }
  }

  async function writeProfile(next: TravelProfile, keys?: Array<keyof TravelProfile>) {
    const payload = keys && saved ? { ...saved, ...Object.fromEntries(keys.map(key => [key, next[key]])) } : next;
    const { profile: result } = await profileApi.save(payload as TravelProfile);
    if (!mountedRef.current) return;
    setSaved(result);
    setProfile(current => keys && current ? { ...current, ...Object.fromEntries(keys.map(key => [key, result[key]])), wallet: result.wallet, club: result.club, updatedAt: result.updatedAt } : result);
    if (!keys || keys.includes('settings')) {
      try { localStorage.setItem('fc-motion-enabled', String(result.settings.preferences.autoPlayMedia)); } catch { /* The server save remains successful when browser storage is unavailable. */ }
    }
  }

  async function saveProfile() {
    if (!profile) return false;
    const emergencyContact = normalizePhone(profile.emergencyContact);
    if (emergencyContact && !/^\+?\d{7,15}$/.test(emergencyContact)) { setNotice({ kind: 'error', text: 'شماره تماس اضطراری باید ۷ تا ۱۵ رقم معتبر باشد.' }); return false; }
    if (profile.professional.languages.some(value => value.trim().length > 40)) { setNotice({ kind: 'error', text: 'نام هر زبان باید حداکثر ۴۰ نویسه باشد.' }); return false; }
    const next = { ...profile, emergencyContact, professional: { ...profile.professional, languages: profile.professional.languages.map(value => value.trim()).filter(Boolean) } };
    return execute('save', () => writeProfile(next), 'تغییرات پروفایل در حساب ذخیره شد.');
  }

  function requestExit(logout = false) {
    const perform = async () => {
      if (logout) await execute('logout', async () => { await authApi.logout(); (onLogout || onRequireAuth)(); });
      else onClose();
      if (mountedRef.current) setConfirm(null);
    };
    if (hasDraft || logout) setConfirm({ title: logout ? 'خروج از حساب کاربری؟' : 'بازگشت به سایت؟', text: hasDraft ? 'تغییرات ذخیره‌نشده با خروج از پنل از دست می‌روند. برای نگهداری آن‌ها، ابتدا به فرم برگرد و ذخیره کن.' : 'برای ورود دوباره به پنل، باید وارد حسابت شوی.', action: logout ? 'خروج از حساب' : 'خروج بدون ذخیره', perform });
    else void perform();
  }

  async function saveStory() {
    if (!profile || story.title.trim().length < 2 || story.body.trim().length < 10) { setNotice({ kind: 'error', text: 'عنوان حداقل ۲ و متن سفرنامه حداقل ۱۰ نویسه باشد.' }); return; }
    if (!story.id && profile.stories.length >= 100) { setNotice({ kind: 'error', text: 'حداکثر ۱۰۰ سفرنامه در حساب قابل نگهداری است.' }); return; }
    const previous = profile.stories.find(item => item.id === story.id);
    const record: Story = { ...story, title: story.title.trim(), destination: story.destination.trim(), body: story.body.trim(), id: previous?.id || crypto.randomUUID(), createdAt: previous?.createdAt || new Date().toISOString() };
    const next = { ...profile, stories: previous ? profile.stories.map(item => item.id === previous.id ? record : item) : [record, ...profile.stories] };
    if (await execute('story', () => writeProfile(next, ['stories']))) { setStory(emptyStory()); navigate('stories'); setNotice({ kind: 'success', text: 'سفرنامه در حساب ذخیره شد.' }); }
  }

  function startNewStory() {
    const start = () => { setStory(emptyStory()); setConfirm(null); navigate('write'); };
    if (storyDirty) setConfirm({ title: 'شروع یک سفرنامه تازه؟', text: 'پیش‌نویس فعلی پاک می‌شود. برای نگهداری آن، به فرم نوشتن برگرد و ابتدا ذخیره کن.', action: 'شروع تازه', perform: start });
    else start();
  }

  const active = PROFILE_PAGES.find(item => item.id === page)!;
  const activeGroup = PROFILE_NAVIGATION.find(group => group.items.some(item => item.id === page))!;
  const sidebarProps = { page, user, profile, openGroups, busy: !!busy, navigate, onToggle: (id: string) => setOpenGroups(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]), onExit: () => { setMobileOpen(false); requestExit(true); } };
  if (!isOpen) return null;

  return <div className={`fp-app ${profile?.settings.appearance.fontScale === 'large' ? 'fp-large' : ''} ${profile?.settings.appearance.reducedMotion ? 'fp-reduced-motion' : ''} ${profile?.settings.appearance.highContrast ? 'fp-high-contrast' : ''}`} data-theme={profile?.settings.appearance.theme || 'light'} dir="rtl">
    <aside className="fp-sidebar"><ProfileSidebar {...sidebarProps} prefix="desktop" /></aside>
    <div className="fp-workspace"><header className="fp-topbar"><div><button type="button" className="fp-icon-button fp-menu-toggle" aria-label="باز کردن منوی پروفایل" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="fp-topbar-breadcrumb">پنل همسفر<ChevronLeft size={13} /><b>{activeGroup.label}</b></span></div><div><a className="fp-topbar-support" href="tel:09215014474"><Headphones size={17} /><span>پشتیبانی</span></a><span className="fp-topbar-divider" /><button className="fp-home-link" type="button" disabled={!!busy} onClick={() => requestExit()}>بازگشت به سایت<ArrowUpLeft size={16} /></button></div></header>
      <main className="fp-main"><div className="fp-page-heading"><div><span className="fp-eyebrow">{activeGroup.label}</span><h1 ref={headingRef} tabIndex={-1}>{active.label}</h1><p>{active.description}</p></div>{user && <div className="fp-user-summary"><span className="fp-avatar">{user.fullName.trim().slice(0, 1)}</span><div><strong>{user.fullName}</strong><span>حساب کاربری فرندلی کمپ</span></div></div>}</div>
        {notice && <div ref={noticeRef} className={`fp-notice ${notice.kind === 'error' ? 'is-error' : ''}`} role={notice.kind === 'error' ? 'alert' : 'status'}><span>{notice.kind === 'success' && <Check size={18} />}{notice.text}</span><button className="fp-icon-button" type="button" aria-label="بستن پیام" onClick={() => setNotice(null)}><X size={16} /></button></div>}
        {loading ? <div className="fp-loading" role="status"><LoaderCircle size={30} className="fp-spin" /><h2>در حال دریافت اطلاعات حساب…</h2></div> : !profile || !user ? <div className="fp-loading"><h2>اطلاعات حساب دریافت نشد.</h2><button type="button" className="fp-button" onClick={() => setReload(value => value + 1)}><RotateCcw size={16} />تلاش دوباره</button></div> : <>
          {profileDirty && <div className="fp-draft-banner"><span><i />تغییرات پروفایل هنوز ذخیره نشده‌اند.</span><div><button type="button" disabled={!!busy} onClick={() => void saveProfile()}><Save size={14} />ذخیره همه تغییرات</button><button type="button" disabled={!!busy} onClick={() => setConfirm({ title: 'بازگردانی تغییرات پروفایل؟', text: 'فرم‌های پروفایل به آخرین نسخه ذخیره‌شده برمی‌گردند. اطلاعات حساب و پیش‌نویس سفرنامه تغییر نمی‌کنند.', action: 'بازگردانی', perform: () => { setProfile(saved); setConfirm(null); } })}><RotateCcw size={14} />بازگردانی</button></div></div>}
          {(page === 'overview' || page === 'checklist') && <ProfileOverview profile={profile} user={user} navigate={navigate} checklistOnly={page === 'checklist'} />}
          {page === 'identity' && <AccountForm draft={account} onChange={setAccount} busy={!!busy} onSave={input => execute('account', async () => { const result = await profileApi.account(input); setUser(result.user); setAccount(accountFromUser(result.user)); onUserChanged?.(result.user); }, 'اطلاعات حساب با موفقیت به‌روز شد.')} />}
          {page === 'security' && <PasswordForm busy={!!busy} onSave={input => execute('password', async () => { await profileApi.password(input); }, 'رمز عبور تغییر کرد. در ورود بعدی از رمز جدید استفاده کن.')} />}
          <ProfileEditor page={page} profile={profile} onChange={setProfile} onSave={saveProfile} busy={!!busy} />
          {(page==='bookings'||page==='invoices')&&<AccountBookings invoicesOnly={page==='invoices'}/>}
          {page==='support'&&<AccountSupport/>}{page==='favoriteTours'&&<FavoriteTours embedded/>}{page==='capacityAlerts'&&<CapacityAlertsPanel/>}
          {page === 'wallet' && <WalletPanel profile={profile} />}
          {page === 'club' && <ClubPanel profile={profile} user={user} />}
          {page === 'stories' && <StoriesPanel profile={profile} onEdit={record => { setStory({ id: record.id, title: record.title, destination: record.destination, date: record.date, body: record.body }); navigate('write'); }} onNew={startNewStory} onDelete={record => setConfirm({ title: 'حذف سفرنامه؟', text: `«${record.title}» از حساب حذف می‌شود. این کار قابل بازگشت نیست.`, action: 'حذف سفرنامه', perform: async () => { if (await execute('delete', () => writeProfile({ ...profile, stories: profile.stories.filter(item => item.id !== record.id) }, ['stories']), 'سفرنامه از حساب حذف شد.')) { if (story.id === record.id) setStory(emptyStory()); setConfirm(null); } } })} />}
          {page === 'write' && <StoryForm draft={story} onChange={setStory} onSave={saveStory} busy={!!busy} onList={() => navigate('stories')} />}
          <div hidden={page !== 'media'}><MediaPanel profile={profile} busy={!!busy} onDraftChange={setMediaDirty} reportError={text => setNotice({ kind: 'error', text })} onSave={(_, upload) => execute('upload', async () => { if (profile.media.length >= 200) throw new Error('حداکثر ۲۰۰ فایل در حساب قابل نگهداری است.'); const record = await upload(); await writeProfile({ ...profile, media: [record, ...profile.media] }, ['media']); }, 'فایل بارگذاری شد و در حساب ذخیره شد.')} onDelete={record => setConfirm({ title: 'حذف از فهرست حساب؟', text: `«${record.title}» از فهرست رسانه‌های حساب حذف می‌شود. این عملیات، نشانی فایل بارگذاری‌شده را از سرور حذف نمی‌کند.`, action: 'حذف از فهرست', perform: async () => { if (await execute('delete', () => writeProfile({ ...profile, media: profile.media.filter(item => item.id !== record.id) }, ['media']), 'رسانه از فهرست حساب حذف شد.')) setConfirm(null); } })} /></div>
          <footer className="fp-content-footer"><span>FRIENDLY CAMP · فضای شخصی همسفر</span><span>آخرین ذخیره: {profileDate(saved?.updatedAt || '', profile.settings.preferences.calendar)}</span></footer>
        </>}
      </main>
    </div>
    {mobileOpen && <ProfileDrawer onClose={() => setMobileOpen(false)}><ProfileSidebar {...sidebarProps} prefix="mobile" /></ProfileDrawer>}
    {confirm && <ConfirmDialog title={confirm.title} text={confirm.text} action={confirm.action} busy={!!busy} onConfirm={() => { void confirm.perform(); }} onClose={() => setConfirm(null)} />}
  </div>;
}

interface SidebarProps {
  prefix: string; page: ProfilePage; user: AuthUser | null; profile: TravelProfile | null; openGroups: string[]; busy: boolean;
  navigate: (page: ProfilePage) => void; onToggle: (id: string) => void; onExit: () => void;
}
function ProfileSidebar({ prefix, page, user, profile, openGroups, busy, navigate, onToggle, onExit }: SidebarProps) {
  return <div className="fp-sidebar-inner"><div className="fp-brand"><FriendlyCampLogo size="md" /><span>پنل شخصی همسفر</span></div><div className="fp-sidebar-member"><div><span className="fp-sidebar-avatar">{user?.fullName.trim().slice(0, 1) || 'ف'}</span><div><strong>{user?.fullName || 'حساب کاربری'}</strong><small>{profile ? 'حساب همسفر' : 'فرندلی کمپ'}</small></div></div><div className="fp-sidebar-progress"><span>اطلاعات سفر</span><b>{profile ? profileCompletion(profile).toLocaleString('fa-IR') : '۰'}٪</b></div><div className="fp-sidebar-progress-track"><i style={{ width: `${profile ? profileCompletion(profile) : 0}%` }} /></div></div><nav aria-label="منوی اصلی پروفایل" className="fp-nav">{PROFILE_NAVIGATION.map(group => <div key={group.id} className={`fp-nav-group ${group.items.some(item => item.id === page) ? 'has-current' : ''}`}><button type="button" className="fp-nav-group-button" disabled={busy} onClick={() => onToggle(group.id)} aria-expanded={openGroups.includes(group.id)} aria-controls={`${prefix}-${group.id}-items`}><group.icon size={18} strokeWidth={1.5} /><span>{group.label}</span><ChevronDown size={14} /></button><div id={`${prefix}-${group.id}-items`} className="fp-subnav" hidden={!openGroups.includes(group.id)}>{group.items.map(item => <button aria-label={item.label} type="button" key={item.id} aria-current={page === item.id ? 'page' : undefined} disabled={busy} onClick={() => navigate(item.id)}>{item.label}<ChevronLeft size={12} /></button>)}</div></div>)}</nav><div className="fp-sidebar-bottom"><a href="tel:09215014474"><Headphones size={17} /><span>پشتیبانی فرندلی کمپ</span><ArrowUpLeft size={14} /></a><button type="button" disabled={busy} onClick={onExit}><LogOut size={17} /><span>خروج از حساب</span></button></div></div>;
}

function ProfileDrawer({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = ref.current; const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; element?.showModal(); document.body.style.overflow = 'hidden'; return () => { element?.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); }; }, []);
  return <dialog ref={ref} className="fp-drawer" dir="rtl" aria-label="منوی پروفایل" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) onClose(); } }}><button className="fp-drawer-close" type="button" aria-label="بستن منوی پروفایل" onClick={onClose}><X size={20} /></button>{children}</dialog>;
}
