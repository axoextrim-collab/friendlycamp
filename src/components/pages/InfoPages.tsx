import { PolicyPage } from './PolicyPages';
import { usePublicContent } from '../../cms/PublicContent';
import { boundedFetch } from '../../api/request';
import React, { useRef, useState } from 'react';
import { ArrowLeft, Check, Compass, Headphones, Leaf, LoaderCircle, Phone, UsersRound } from 'lucide-react';
import { POPULAR_DESTINATIONS } from '../../data/mockData';
import { normalizePhone } from '../../utils/authForm';
import { SiteLink } from '../../routing/navigation';
import { PageHeading } from './PageUI';
import { useTourCatalog } from '../../hooks/useTourCatalog';

export function AboutPage() {
  return <><PageHeading eyebrow="درباره فرندلی کمپ" title="کنار هم، نزدیک‌تر به طبیعت." description="فرندلی کمپ برای تجربه سفرهایی شکل گرفته که انتخاب آگاهانه، همراهی گروه و احترام به مقصد در آن‌ها اهمیت دارد." /><div className="sp-about-hero"><img loading="lazy" decoding="async" src="/images/services/guides.webp" alt="همراهی گروه در طبیعت" data-motion="off" /><div><span className="sp-eyebrow">FRIENDLY CAMP</span><h2>سفر، بیشتر از رسیدن است.</h2><p>از شناخت مقصد و انتخاب برنامه تا آماده کردن وسایل و همراهی با همسفرها، بخش مهمی از سفر پیش از حرکت آغاز می‌شود. اینجا تلاش می‌کنیم اطلاعات برنامه و تجهیزات را روشن‌تر در اختیار تو بگذاریم.</p><p>می‌توانی مقصدها را بشناسی، معرفی برنامه‌ها را بخوانی، تجهیزات را مقایسه کنی و برای جزئیات اجرایی با پشتیبانی هماهنگ شوی.</p><SiteLink href="/tours" className="sp-button sp-primary">برنامه‌های سفر را ببین<ArrowLeft size={15} /></SiteLink></div></div><div className="sp-values">{[{ icon: Compass, title: 'انتخاب آگاهانه', text: 'بررسی مسیر، مدت و خدمات برنامه پیش از تصمیم‌گیری.' }, { icon: UsersRound, title: 'همراهی و هماهنگی', text: 'گفت‌وگوی روشن درباره انتظارات، وسایل و جزئیات سفر گروهی.' }, { icon: Leaf, title: 'احترام به مقصد', text: 'توجه به محیط، جامعه محلی و مسئولیت ما در هر سفر.' }].map(({ icon: Icon, title, text }) => <section key={title}><Icon size={28} strokeWidth={1.2} /><h2>{title}</h2><p>{text}</p></section>)}</div><div className="sp-bottom-callout"><div><h2>از کجا شروع کنیم؟</h2><p>اگر هنوز برنامه مشخصی نداری، مقصدها و راهنماها را ببین یا برای هماهنگی با ما در تماس باش.</p></div><SiteLink href="/contact" className="sp-button">تماس با فرندلی کمپ<ArrowLeft size={15} /></SiteLink></div></>;
}

export function TermsPage() { return <PolicyPage kind="terms"/>; }

export function ContactPage() {
  const {contact}=usePublicContent();
  const { tours } = useTourCatalog();
  const params = new URLSearchParams(window.location.search); const tour = tours.find(item => item.id === params.get('tour')); const destination = POPULAR_DESTINATIONS.find(item => item.id === params.get('destination'));
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', subject: tour ? `هماهنگی سفر: ${tour.title}` : destination ? `هماهنگی مقصد: ${destination.title}` : (params.get('subject') || '').slice(0, 180), message: (params.get('message') || '').slice(0, 3000), consent: false });
  const [pending, setPending] = useState(false); const [error, setError] = useState(''); const [reference, setReference] = useState(''); const lock = useRef(false);
  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) => { setForm(current => ({ ...current, [key]: value })); setError(''); };
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return;
    const phone = normalizePhone(form.phone);
    if (!/^09\d{9}$/.test(phone)) { setError('شماره همراه معتبر ایران وارد کن.'); return; }
    lock.current = true; setPending(true); setError('');
    try {
      const response = await boundedFetch('/api/contact/requests', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, phone, fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), subject: form.subject.trim(), message: form.message.trim() }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.reference) throw new Error(data?.message || (response.status === 429 ? 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره تلاش کن.' : 'ثبت درخواست انجام نشد. اطلاعات را بررسی و دوباره تلاش کن.'));
      setReference(data.reference);
    } catch (failure) { setError(failure instanceof TypeError ? 'ارتباط با سرور قطع شد. متن پیام حفظ شده؛ دوباره تلاش کن.' : failure instanceof Error ? failure.message : 'ثبت درخواست انجام نشد.'); }
    finally { lock.current = false; setPending(false); }
  }
  return <><PageHeading eyebrow="تماس با ما" title="برای قدم بعدی، با هم حرف بزنیم." description="سؤال درباره برنامه سفر، انتخاب تجهیزات یا پیگیری درخواستت را با فرندلی کمپ در میان بگذار." /><div className="sp-contact-layout"><aside className="sp-contact-card"><span><Headphones size={33} strokeWidth={1.2} /></span><h2>هماهنگی، از یک گفت‌وگو شروع می‌شود.</h2><p>برای بررسی جزئیات سفر و تجهیزات یا پیگیری درخواست ثبت‌شده تماس بگیر. اگر شماره درخواست داری، آن را هنگام تماس اعلام کن.</p><a href={`tel:${contact.phone}`}><Phone size={20} /><bdi>{contact.phone}</bdi></a>{contact.email&&<a href={`mailto:${contact.email}`}><bdi>{contact.email}</bdi></a>}{contact.address&&<p>نشانی دفتر: {contact.address}</p>}{contact.hours&&<p>زمان پاسخ‌گویی: {contact.hours}</p>}<div><SiteLink href="/support">ثبت شکایت و پیگیری پرونده</SiteLink><SiteLink href="/tours">برنامه‌های سفر<ArrowLeft size={13} /></SiteLink><SiteLink href="/shop">فروشگاه تجهیزات<ArrowLeft size={13} /></SiteLink><SiteLink href="/terms">شرایط ثبت درخواست<ArrowLeft size={13} /></SiteLink></div></aside><div className="sp-contact-form">{reference ? <div className="sp-contact-success" role="status"><Check size={35} /><h2>درخواستت ثبت شد.</h2><p>این شماره را برای پیگیری نگه دار. ثبت درخواست، به معنی رزرو یا تأیید برنامه نیست.</p><code dir="ltr">{reference}</code><button type="button" className="sp-button" onClick={() => { setReference(''); setForm(current => ({ ...current, message: '', consent: false })); }}>نوشتن درخواست تازه</button></div> : <form onSubmit={submit}><h2>ثبت درخواست</h2><p>پیام در سامانه مدیریت فرندلی کمپ ثبت می‌شود؛ رمز عبور یا اطلاعات کارت بانکی را در آن ننویس.</p><fieldset disabled={pending}><div className="sp-form-grid"><label><span>نام و نام خانوادگی</span><input name="name" autoComplete="name" required minLength={3} maxLength={100} value={form.fullName} onChange={event => set('fullName', event.target.value)} /></label><label><span>شماره همراه</span><input type="tel" name="tel" autoComplete="tel" dir="ltr" required maxLength={25} value={form.phone} onChange={event => set('phone', event.target.value)} /></label><label><span>ایمیل (اختیاری)</span><input type="email" name="email" autoComplete="email" dir="ltr" maxLength={254} value={form.email} onChange={event => set('email', event.target.value)} /></label><label><span>موضوع درخواست</span><input required minLength={3} maxLength={180} value={form.subject} onChange={event => set('subject', event.target.value)} /></label><label className="sp-field-wide"><span>متن پیام</span><textarea required minLength={10} maxLength={3000} rows={7} value={form.message} onChange={event => set('message', event.target.value)} /></label></div><label className="sp-consent"><input type="checkbox" required checked={form.consent} onChange={event => set('consent', event.target.checked)} /><span>با ثبت اطلاعات این فرم برای بررسی درخواست و تماس جهت پاسخ‌گویی موافقم.</span></label></fieldset>{error && <p className="sp-form-error" role="alert">{error}</p>}<button type="submit" className="sp-button sp-primary" disabled={pending}>{pending ? <LoaderCircle size={16} className="sp-spin" /> : <ArrowLeft size={16} />}{pending ? 'در حال ثبت درخواست…' : 'ثبت درخواست در سامانه'}</button></form>}</div></div></>;
}
