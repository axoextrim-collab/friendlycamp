import React from 'react';
import { BLOG_POSTS } from '../data/mockData';
import { BlogPost } from '../types';
import { Calendar, User, ArrowLeft, BookOpen } from 'lucide-react';

interface BlogSectionProps {
  onSelectPost: (post: BlogPost) => void;
}

export const BlogSection: React.FC<BlogSectionProps> = ({ onSelectPost }) => {
  const featuredPost = BLOG_POSTS[0];
  const regularPosts = BLOG_POSTS.slice(1);

  return (
    <section id="blog" className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div className="text-center md:text-right max-w-2xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-[#044e42] text-xs font-bold mb-3">
            وبلاگ و مجله طبیعت‌گردی فرندلی کمپ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#044e42] leading-tight mb-3">
            آخرین <span className="text-[#f59e0b]">مطالب و راهنماهای کمپینگ</span>
          </h2>
          <p className="text-slate-600 text-sm md:text-base font-medium">
            مجموعه راهنماهای کاربردی تجهیزات کمپ، تکنیک‌های زنده ماندن در طبیعت و گزارش برنامه‌های فرندلی کمپ:
          </p>
        </div>

        <button
          onClick={() => onSelectPost(featuredPost)}
          className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black px-6 py-3 rounded-full shadow-md hover:scale-105 transition text-sm flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>مقالات بیشتر را ببینید</span>
          <ArrowLeft size={16} />
        </button>
      </div>

      {/* Main Grid: Featured Post + Side Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Featured Main Post (col-span-5) */}
        <div
          onClick={() => onSelectPost(featuredPost)}
          className="lg:col-span-5 group relative h-[450px] lg:h-auto rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition duration-300 border border-slate-100 bg-white cursor-pointer flex flex-col justify-end p-8"
        >
          <img
            src={featuredPost.image}
            alt={featuredPost.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Date Badge */}
          <div className="absolute top-6 right-6 bg-[#044e42] text-[#f59e0b] font-black px-4 py-2 rounded-lg shadow-lg border border-white/20 text-center flex flex-col items-center">
            <span className="text-xs">{featuredPost.date}</span>
          </div>

          <div className="relative z-10 text-white flex flex-col gap-2">
            <span className="bg-amber-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full w-fit">
              {featuredPost.category}
            </span>

            <h3 className="text-2xl font-black group-hover:text-[#a3e635] transition leading-snug">
              {featuredPost.title}
            </h3>

            <p className="text-xs text-slate-200 line-clamp-2 font-medium">
              {featuredPost.summary}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-white/20 text-xs text-white/80">
              <User size={14} className="text-amber-400" />
              <span>نویسنده: {featuredPost.author}</span>
            </div>
          </div>
        </div>

        {/* Regular Posts Grid (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-4 justify-between">
          {regularPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="group bg-white rounded-xl p-4 md:p-5 shadow-md hover:shadow-xl transition duration-300 border border-slate-100 flex flex-col sm:flex-row items-center gap-5 cursor-pointer"
            >
              {/* Image */}
              <div className="relative w-full sm:w-36 h-32 rounded-lg overflow-hidden shrink-0">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                />
                <span className="absolute bottom-2 right-2 bg-black/60 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                  {post.date}
                </span>
              </div>

              {/* Text Info */}
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-amber-600 font-extrabold text-xs">
                    {post.category}
                  </span>
                </div>

                <h4 className="font-extrabold text-[#003843] text-base group-hover:text-[#047857] transition leading-snug mb-3">
                  {post.title}
                </h4>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  {post.authorImage && (
                    <img
                      src={post.authorImage}
                      alt={post.author}
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  )}
                  <span>نویسنده: {post.author}</span>
                </div>
              </div>

              <div className="shrink-0 w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#004e5a] group-hover:text-white transition flex items-center justify-center text-slate-400">
                <ArrowLeft size={18} />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
