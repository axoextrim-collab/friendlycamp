import React, { useState } from 'react';
import { X, Volume2, Sparkles, MapPin, Play, Pause, Film, ExternalLink } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RAINFOREST_VIDEOS = [
  {
    id: 'video-1',
    title: 'مستند ۴K کمپینگ در جنگل‌های مه آلود و بارانی',
    subtitle: 'تصاویر خیره‌کننده از طبیعت، بارش باران و کمپینگ فرندلی کمپ',
    // High-quality reliable MP4 video stream
    url: 'https://assets.mixkit.co/videos/preview/mixkit-[#1230]-large.mp4',
    fallbackUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    poster: 'https://images.unsplash.com/photo-1511497584788-876761c119ef?auto=format&fit=crop&q=80&w=1200',
    duration: '۰۳:۴۵'
  },
  {
    id: 'video-2',
    title: 'رودخانه‌نوردی و آبشارهای خروشان جنگلی',
    subtitle: 'پیمایش مسیرهای بکر آبشاری همراه با لیدرهای مجرب',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200',
    duration: '۰۲:۳۰'
  },
  {
    id: 'video-3',
    title: 'شب‌مانی دور آتش و چادرزنی حرفه‌ای',
    subtitle: 'آموزش اصول برپایی کمپ ضدآب و شب‌نشینی همنوردان',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200',
    duration: '۰۴:۱۵'
  }
];

export const VideoModal: React.FC<VideoModalProps> = ({ isOpen, onClose }) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  if (!isOpen) return null;

  const currentVideo = RAINFOREST_VIDEOS[activeVideoIndex];

  return (
    <div role="dialog" aria-modal="true" aria-label="ویدیوهای سفر" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-950 text-white border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b] text-slate-950 flex items-center justify-center font-bold">
              <Film size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">{currentVideo.title}</h3>
              <p className="text-xs text-amber-300/80 hidden sm:block">{currentVideo.subtitle}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="بستن"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Player Frame with Native HTML5 Video & Controls */}
        <div className="relative bg-black aspect-video w-full overflow-hidden flex items-center justify-center group">
          <video
            key={currentVideo.id}
            src={currentVideo.url}
            poster={currentVideo.poster}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={(e) => {
              // Fallback URL if initial video fails
              const videoElement = e.currentTarget;
              if (currentVideo.fallbackUrl && videoElement.src !== currentVideo.fallbackUrl) {
                videoElement.src = currentVideo.fallbackUrl;
                videoElement.play().catch(() => {});
              }
            }}
          >
            مرورگر شما از پخش ویدیو پشتیبانی نمی‌کند.
          </video>
        </div>

        {/* Video Selector Tabs Below Video */}
        <div className="p-4 bg-slate-950 text-white border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Sparkles size={14} />
              <span>انتخاب کلیپ مستند طبیعت جنگل‌های بارانی:</span>
            </span>
            <span className="text-[11px] text-slate-400">کیفیت 4K Ultra HD • باشگاه فرندلی کمپ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {RAINFOREST_VIDEOS.map((vid, index) => {
              const isActive = index === activeVideoIndex;
              return (
                <button
                  key={vid.id}
                  onClick={() => setActiveVideoIndex(index)}
                  className={`p-2.5 rounded-lg border text-right transition flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? 'bg-[#044e42] border-[#f59e0b] text-white ring-1 ring-[#f59e0b]'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="relative w-14 h-10 rounded overflow-hidden shrink-0">
                    <img src={vid.poster} alt={vid.title} className="w-full h-full object-cover" />
                    {isActive && (
                      <div className="absolute inset-0 bg-[#f59e0b]/30 flex items-center justify-center">
                        <Play size={14} className="fill-slate-950 text-slate-950" />
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-bold block truncate">{vid.title}</span>
                    <span className="text-[10px] text-amber-300/80 block">{vid.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <a
            href="https://www.youtube.com/results?search_query=rainforest+camping+4k"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-amber-400 transition"
          >
            <span>تماشای ویدیوهای بیشتر در یوتیوب</span>
            <ExternalLink size={12} />
          </a>

          <button
            onClick={onClose}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold px-4 py-1.5 rounded-lg transition cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};

