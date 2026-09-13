import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Camera,
  Sparkles,
  MapPin,
  CheckCircle2,
  X,
  Upload,
  Send,
  User,
  Tag,
  ThumbsUp,
  Clock,
  Tent,
  Flame,
  TreePine,
  Sun,
  Compass
} from 'lucide-react';

export interface MomentPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorBadge: string;
  tourName: string;
  location: string;
  image: string;
  caption: string;
  category: 'camp_night' | 'trekking' | 'desert' | 'food';
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
  comments: { author: string; text: string; time: string }[];
  isVerifiedTour: boolean;
}

const INITIAL_MOMENTS: MomentPost[] = [
  {
    id: 'm1',
    authorName: 'نیلوفر رضایی',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    authorBadge: 'عکاس طبیعت',
    tourName: 'تور کمپینگ جنگل‌های اسالم و تالش',
    location: 'ارتفاعات اسالم، گیلان',
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800',
    caption: 'طلوع بی‌نظیر ابرها در کمپ اختصاصی فرندلی کمپ! بوی هیزم و چای زغالی اول صبح واقعا روح آدم رو تازه می‌کنه ☕🌲 #فرندلی_کمپ #اسالم #طبیعتگردی',
    category: 'camp_night',
    timeAgo: '۱۲ دقیقه پیش',
    likes: 128,
    isLiked: false,
    comments: [
      { author: 'علیرضا', text: 'فوق‌العاده‌ست! چادرهای کله‌گاوی فرندلی کمپ واقعا ضدآب و گرم بودن.', time: '۵ دقیقه پیش' },
      { author: 'سارا م.', text: 'هفته دیگه ما هم همونجام 😍', time: '۲ دقیقه پیش' }
    ],
    isVerifiedTour: true
  },
  {
    id: 'm2',
    authorName: 'امیرحسین کاظمی',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    authorBadge: 'کمپر حرفه‌ای',
    tourName: 'تور کویر کاراکال و رمل‌نوردی',
    location: 'رمل‌های بافق، یزد',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800',
    caption: 'شب‌نشینی دور آتش زیر آسمان پر از ستاره کویر! عکاسی نجومی امشب با راهنمایی لیدر تور محشر شد 🌌✨',
    category: 'desert',
    timeAgo: '۴۵ دقیقه پیش',
    likes: 215,
    isLiked: true,
    comments: [
      { author: 'نرگس', text: 'آسمون کویر کاراکال واقعا جادوییه!', time: '۲۰ دقیقه پیش' }
    ],
    isVerifiedTour: true
  },
  {
    id: 'm3',
    authorName: 'زهرا شریفی',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    authorBadge: 'مسافر VIP',
    tourName: 'تور پیمایش آبشار و جنگل‌های سوادکوه',
    location: 'سوئسرا، سوادکوه',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800',
    caption: 'پذیرایی ناهار گرم محلی بعد از ۳ ساعت پیمایش جذاب تو دل جنگل‌های مه گرفته سوادکوه 🥘🔥 دست آشپز فرندلی کمپ درد نکنه!',
    category: 'food',
    timeAgo: '۲ ساعت پیش',
    likes: 94,
    isLiked: false,
    comments: [
      { author: 'مجید', text: 'اون جوجه آتشی دور کمپ حرف نداشت!', time: '۱ ساعت پیش' }
    ],
    isVerifiedTour: true
  },
  {
    id: 'm4',
    authorName: 'کیوان بهرامی',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    authorBadge: 'کوه‌نورد',
    tourName: 'کمپینگ و دریاچه نئور به سوباتان',
    location: 'ییلاق سوباتان، اردبیل',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800',
    caption: 'عبور از اقیانوس ابر سوباتان! حس پرواز روی ابرها رو فقط توی سفرهای فرندلی کمپ میشه تجربه کرد ☁️🏔️',
    category: 'trekking',
    timeAgo: '۴ ساعت پیش',
    likes: 310,
    isLiked: true,
    comments: [],
    isVerifiedTour: true
  }
];

export const CommunityMoments: React.FC = () => {
  const [moments, setMoments] = useState<MomentPost[]>(INITIAL_MOMENTS);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Submit Modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newPostForm, setNewPostForm] = useState({
    authorName: '',
    tourName: 'تور کمپینگ جنگل‌های اسالم و تالش',
    location: 'گیلان، ایران',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
    caption: '',
    category: 'camp_night' as const
  });

  const handleLike = (id: string) => {
    setMoments(prev =>
      prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            likes: item.isLiked ? item.likes - 1 : item.likes + 1,
            isLiked: !item.isLiked
          };
        }
        return item;
      })
    );
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    setMoments(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [
              ...p.comments,
              { author: 'شما (همنورد)', text: newCommentText.trim(), time: 'هم‌اکنون' }
            ]
          };
        }
        return p;
      })
    );
    setNewCommentText('');
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const created: MomentPost = {
      id: `m_${Date.now()}`,
      authorName: newPostForm.authorName || 'همنورد جدید',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      authorBadge: 'مسافر فعال',
      tourName: newPostForm.tourName,
      location: newPostForm.location,
      image: newPostForm.image || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&q=80&w=800',
      caption: newPostForm.caption || 'یک روز عالی همراه همنوردان فرندلی کمپ! #فرندلی_کمپ',
      category: newPostForm.category,
      timeAgo: 'هم‌اکنون',
      likes: 1,
      isLiked: true,
      comments: [],
      isVerifiedTour: true
    };

    setMoments([created, ...moments]);
    setIsSubmitModalOpen(false);
  };

  const filteredMoments = moments.filter(m => {
    if (selectedFilter === 'all') return true;
    return m.category === selectedFilter;
  });

  return (
    <section className="py-16 bg-[#002f38] text-white relative overflow-hidden">
      {/* Background Ambient Blur */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
        
        {/* Header Title Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 text-right">
            <div className="inline-flex items-center gap-2 bg-[#84cc16]/15 text-[#84cc16] px-3.5 py-1 rounded-full text-xs font-black border border-[#84cc16]/30">
              <Camera size={15} />
              <span>لحظه‌های واقعی همنوردان (Community Moments)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              عکس‌های زنده و واقعی از کمپ‌های جاری
            </h2>
            <p className="text-sm text-emerald-200/80 max-w-2xl font-medium">
              شواهد زنده از تجربه بی‌نظیر شب‌نشینی، چای زغالی، پیمایش ابرها و طلوع خورشید توسط همنوردان فرندلی کمپ.
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="bg-[#84cc16] hover:bg-[#a3e635] text-[#064e3b] font-black text-sm px-6 py-3.5 rounded-2xl transition shadow-xl hover:shadow-[#84cc16]/20 flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <Upload size={18} />
            <span>اشتراک‌گذاری عکس سفر من</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold">
          {[
            { id: 'all', label: 'همه لحظه‌ها', icon: Compass },
            { id: 'camp_night', label: 'شب‌های کمپ و چادر', icon: Tent },
            { id: 'trekking', label: 'پیمایش و طبیعت', icon: TreePine },
            { id: 'desert', label: 'کویر و آتشفشان', icon: Sun },
            { id: 'food', label: 'غذا و چای زغالی', icon: Flame }
          ].map(tab => {
            const IconComp = tab.icon;
            const active = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white text-[#003843] shadow-lg font-black'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                <IconComp size={15} className={active ? 'text-[#004e5a]' : 'text-slate-300'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMoments.map(post => (
            <div
              key={post.id}
              className="bg-white text-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 flex flex-col hover:-translate-y-1 transition duration-300 group"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-slate-900">{post.authorName}</span>
                      {post.isVerifiedTour && (
                        <CheckCircle2 size={13} className="text-emerald-600 fill-emerald-100" title="تور تایید شده" />
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {post.authorBadge}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock size={11} />
                  <span>{post.timeAgo}</span>
                </span>
              </div>

              {/* Photo Area */}
              <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                <img
                  src={post.image}
                  alt={post.tourName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                
                {/* Tour Overlay Badge */}
                <div className="absolute bottom-3 right-3 left-3 bg-slate-950/75 backdrop-blur-md text-white p-2.5 rounded-2xl text-[11px] font-bold border border-white/20 flex items-center justify-between gap-2">
                  <span className="truncate flex items-center gap-1">
                    <MapPin size={12} className="text-[#84cc16] shrink-0" />
                    <span>{post.tourName}</span>
                  </span>
                  <span className="text-[9px] bg-[#84cc16] text-[#064e3b] font-black px-2 py-0.5 rounded-full shrink-0">
                    فرندلی کمپ
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-3">
                  {post.caption}
                </p>

                {/* Engagement Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 font-mono font-black transition cursor-pointer ${
                        post.isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart size={18} className={post.isLiked ? 'fill-rose-600' : ''} />
                      <span>{post.likes}</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)
                      }
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-mono font-bold transition cursor-pointer"
                    >
                      <MessageCircle size={18} />
                      <span>{post.comments.length}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => alert(`لینک پست ${post.authorName} کپی شد!`)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    title="اشتراک‌گذاری"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                {/* Comments Section Drawer */}
                {activeCommentPostId === post.id && (
                  <div className="mt-2 pt-3 border-t border-slate-100 space-y-2 text-xs bg-slate-50 p-2.5 rounded-2xl animate-in fade-in">
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {post.comments.map((c, i) => (
                        <div key={i} className="bg-white p-2 rounded-xl text-[11px] border border-slate-100">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{c.author}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{c.time}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{c.text}</p>
                        </div>
                      ))}
                      {post.comments.length === 0 && (
                        <span className="text-[11px] text-slate-400 block text-center py-1">
                          اولین دیدگاه را شما بنویسید...
                        </span>
                      )}
                    </div>

                    <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="نظر شما درباره این لحظه..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-[#004e5a] text-white p-1.5 rounded-xl cursor-pointer hover:bg-[#003843] transition"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Submit Photo Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#003843]">
                <Camera size={20} className="text-[#84cc16]" />
                <h3 className="font-black text-base">اشتراک‌گذاری عکس سفر من</h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">نام و نام خانوادگی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سامان ملک‌زاده"
                  value={newPostForm.authorName}
                  onChange={(e) => setNewPostForm({ ...newPostForm, authorName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">نام تور:</label>
                  <input
                    type="text"
                    required
                    value={newPostForm.tourName}
                    onChange={(e) => setNewPostForm({ ...newPostForm, tourName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">دسته‌بندی:</label>
                  <select
                    value={newPostForm.category}
                    onChange={(e) =>
                      setNewPostForm({ ...newPostForm, category: e.target.value as any })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700"
                  >
                    <option value="camp_night">شب کمپ و آتش</option>
                    <option value="trekking">پیمایش جنگلی</option>
                    <option value="desert">کویر و آسمان</option>
                    <option value="food">غذای محلی</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">لینک تصویر عکس (URL):</label>
                <input
                  type="url"
                  value={newPostForm.image}
                  onChange={(e) => setNewPostForm({ ...newPostForm, image: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">کپشن و احساس شما از این لحظه:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="تجربه خودتان از این لحظه زیبا را بنویسید..."
                  value={newPostForm.caption}
                  onChange={(e) => setNewPostForm({ ...newPostForm, caption: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-[#004e5a] hover:bg-[#003843] text-white font-black px-5 py-2 rounded-xl cursor-pointer shadow"
                >
                  انتشار در انجمن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
