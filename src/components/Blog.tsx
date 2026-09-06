import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowUpRight } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { useLanguage } from './LanguageContext';
import { useSiteSettings, useCMSCollection } from '../hooks/useCMS';

export const Blog = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const { items: dynamicPosts, loading: blogsLoading } = useCMSCollection('blogs');
  const navigate = useNavigate();

  const title = settings?.headings?.blog?.title || t.blog.title;
  const subtitle = settings?.headings?.blog?.subtitle || t.blog.subtitle;

  // Only show posts from database if they exist, otherwise show nothing or a specific "Coming Soon" if restricted
  const displayPosts = dynamicPosts;

  // Auto-open blog post if blog_id exists in URL query string (deep links)
  useEffect(() => {
    if (!blogsLoading && displayPosts.length > 0) {
      // Check query parameters
      const params = new URLSearchParams(window.location.search);
      const qBlogId = params.get('blog_id');

      // Also support hash URL parameters (e.g., #/?blog_id=...)
      const hashParts = window.location.hash.split('?');
      const hashQuery = hashParts[1] || '';
      const hParams = new URLSearchParams(hashQuery);
      const hBlogId = hParams.get('blog_id');

      const targetId = qBlogId || hBlogId;
      if (targetId) {
        const found = displayPosts.find(p => p.id === targetId);
        if (found) {
          navigate(`/blog/${targetId}`, { replace: true });
        }
      }
    }
  }, [blogsLoading, displayPosts, navigate]);

  if (displayPosts.length === 0 && !blogsLoading) {
    return null; // Don't show the section if no posts are made by admin
  }

  return (
    <section id="blog" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-gray-300 dark:border-gray-800">
      <div className="text-center mb-16">
        <span className="uppercase tracking-[2px] text-primary font-bold block mb-4 italic">{subtitle}</span>
        <h2 className="text-4xl md:text-6xl font-extrabold mb-12 text-main-text">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {!blogsLoading && displayPosts.map((blog: any, idx: number) => (
          <div 
            key={blog.id || idx} 
            onClick={() => navigate(`/blog/${blog.id}`)}
            className="cursor-pointer group h-full"
          >
            <TiltCard className="!p-6 h-full flex flex-col justify-between">
              <article className="flex flex-col h-full justify-between">
                <div>
                  <div className="rounded-xl overflow-hidden mb-8 aspect-video">
                     <img 
                       src={blog.image || `https://picsum.photos/seed/blog${idx}/600/400`} 
                       alt={`Cover image for blog post: ${blog.title}`} 
                       loading="lazy"
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                       referrerPolicy="no-referrer"
                     />
                  </div>
                  <div className="flex justify-between items-center mb-4 text-xs font-bold uppercase tracking-widest">
                     <span className="text-primary group-hover:text-white/80">{blog.category}</span>
                     <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400 group-hover:text-white/60">
                       <Clock size={14} aria-hidden="true" /> {(() => {
                         const text = blog.desc || '';
                         const words = text.trim() ? text.trim().split(/\s+/).length : 0;
                         const minutes = Math.max(1, Math.ceil(words / 200));
                         return `${minutes} min read`;
                       })()}
                     </span>
                  </div>
                  <div className="group/title flex items-start justify-between gap-4">
                    <h3 className="text-xl font-bold text-main-text group-hover:text-white transition-colors leading-relaxed">
                       {blog.title}
                    </h3>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/40">
                  <span className="text-xs font-black uppercase text-primary tracking-widest group-hover:text-white transition-colors">
                    Read Article & Share
                  </span>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </div>
                </div>
              </article>
            </TiltCard>
          </div>
        ))}
        {blogsLoading && <div className="col-span-full text-center py-20 text-gray-400 font-bold">Loading Posts...</div>}
      </div>
    </section>
  );
};
