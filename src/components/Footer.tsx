import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, Instagram, Linkedin, Facebook, Twitter, Heart } from 'lucide-react';
import { FriendlyCampLogo } from './FriendlyCampLogo';

interface FooterProps {
  onNavigateSection: (sectionId: string) => void;
  onOpenContact: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateSection,
  onOpenContact
}) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0b1e17] text-white pt-16 pb-8 border-t border-white/10 mt-12 relative overflow-hidden">
      
      {/* Top Newsletter Strip */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="bg-[#14382c] rounded-xl p-8 md:p-10 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-right">
            <h3 className="text-2xl font-black text-white mb-2">
              عضویت در خبرنامه <span className="text-[#f59e0b]">باشگاه فرندلی کمپ</span>
            </h3>
            <p className="text-xs text-emerald-100/80 font-medium">
              از برنامه‌های تور کمپینگ، صعودهای گروهی و تخفیف‌های ویژه فرندلی کمپ زودتر از همه باخبر شوید.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto items-center gap-2">
            {subscribed ? (
              <div className="bg-[#f59e0b] text-slate-950 font-black px-6 py-3 rounded-full text-sm">
                ✓ با تشکر! ایمیل شما با موفقیت ثبت شد.
              </div>
            ) : (
              <div className="flex w-full sm:w-96 bg-white rounded-full p-1.5 shadow-inner">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="آدرس ایمیل خود را وارد کنید..."
                  className="flex-1 px-4 py-2 text-slate-800 text-sm outline-none font-medium placeholder:text-slate-400"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#14382c] hover:bg-[#f59e0b] text-white hover:text-slate-950 font-black px-5 py-2.5 rounded-full transition flex items-center gap-2 text-sm cursor-pointer"
                >
                  <span>عضویت</span>
                  <Send size={14} />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10 text-right">
        
        {/* Col 1: Brand Info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <FriendlyCampLogo size="lg" variant="light" />

          <p className="text-xs text-emerald-100/70 leading-relaxed font-medium">
            باشگاه طبیعت‌گردی فرندلی کمپ (Friendly Camp) از سال ۲۰۱۸ (۱۳۹۷) فعالیت حرفه‌ای خود را در زمینه برگزاری تورهای طبیعت‌گردی، کمپینگ در دل طبیعت، تورهای کویر و کوهنوردی با کادری مجرب و تجهیزات استاندارد آغاز نموده است.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-3 pt-2">
            <a href="#instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#f59e0b] hover:text-slate-950 flex items-center justify-center transition" title="اینستاگرام فرندلی کمپ">
              <Instagram size={18} />
            </a>
            <a href="#linkedin" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#f59e0b] hover:text-slate-950 flex items-center justify-center transition" title="لینکدین">
              <Linkedin size={18} />
            </a>
            <a href="#facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#f59e0b] hover:text-slate-950 flex items-center justify-center transition" title="فیسبوک">
              <Facebook size={18} />
            </a>
            <a href="#twitter" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#f59e0b] hover:text-slate-950 flex items-center justify-center transition" title="توییتر">
              <Twitter size={18} />
            </a>
          </div>
        </div>

        {/* Col 2: Quick Links */}
        <div>
          <h4 className="font-extrabold text-[#f59e0b] text-base mb-4">دسترسی سریع</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-emerald-100/80 font-medium">
            <li>
              <button onClick={() => onNavigateSection('hero')} className="hover:text-[#f59e0b] transition">
                صفحه اصلی
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateSection('experience')} className="hover:text-[#f59e0b] transition">
                درباره فرندلی کمپ
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateSection('services')} className="hover:text-[#f59e0b] transition">
                تجهیزات و خدمات کمپ
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateSection('destinations')} className="hover:text-[#f59e0b] transition">
                مقاصد محبوب طبیعت‌گردی
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateSection('tours')} className="hover:text-[#f59e0b] transition">
                برنامه تورهای فعال
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Services */}
        <div>
          <h4 className="font-extrabold text-[#f59e0b] text-base mb-4">خدمات اعضا</h4>
          <ul className="flex flex-col gap-2.5 text-xs text-emerald-100/80 font-medium">
            <li>
              <button onClick={() => onNavigateSection('why-choose-us')} className="hover:text-[#f59e0b] transition">
                پشتیبانی و مشاوره رایگان
              </button>
            </li>
            <li>
              <button onClick={onOpenContact} className="hover:text-[#f59e0b] transition">
                اجاره تجهیزات کمپینگ
              </button>
            </li>
            <li>
              <button onClick={() => onNavigateSection('blog')} className="hover:text-[#f59e0b] transition">
                مجله آموزش کمپینگ
              </button>
            </li>
            <li>
              <button onClick={onOpenContact} className="hover:text-[#f59e0b] transition">
                قوانین و مقررات تورها
              </button>
            </li>
            <li>
              <button onClick={onOpenContact} className="hover:text-[#f59e0b] transition">
                تماس با لیدرهای تور
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact Info */}
        <div>
          <h4 className="font-extrabold text-[#f59e0b] text-base mb-4">ارتباط با فرندلی کمپ</h4>
          <ul className="flex flex-col gap-3 text-xs text-emerald-100/80 font-medium">
            <li className="flex items-center gap-2">
              <Phone size={16} className="text-[#f59e0b] shrink-0" />
              <a href="tel:09215014474" className="hover:text-[#f59e0b] dir-ltr font-mono font-bold">
                ۰۹۲۱۵۰۱۴۴۷۴
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} className="text-[#f59e0b] shrink-0" />
              <span>info@friendlycamp.com</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={16} className="text-[#f59e0b] shrink-0 mt-0.5" />
              <span>ایران، تهران، خیابان شریعتی، دفتر مرکزی باشگاه فرندلی کمپ</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-100/60 font-medium gap-4">
        <p>© ۱۴۰۵ تمامی حقوق این وب‌سایت متعلق به باشگاه طبیعت‌گردی فرندلی کمپ (Friendly Camp 2018) است.</p>
        <div className="flex items-center gap-1">
          <span>طراحی شده با</span>
          <Heart size={14} className="text-red-500 fill-red-500" />
          <span>برای همنوردان فرندلی کمپ</span>
        </div>
      </div>

    </footer>
  );
};

