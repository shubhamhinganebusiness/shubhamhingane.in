import React from 'react';
import { Quote, Star, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings, useCMSCollection } from '../hooks/useCMS';

export const Testimonial = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const { items: dbTestimonials, loading } = useCMSCollection('testimonials');

  const title = settings?.headings?.testimonial?.title || t.testimonial.title;
  const subtitle = settings?.headings?.testimonial?.subtitle || t.testimonial.subtitle;

  const displayTestimonials = dbTestimonials.length > 0 ? dbTestimonials : t.testimonial.list;

  return (
    <section id="testimonial" className="py-24 bg-main-bg border-t border-gray-100 dark:border-gray-800 flex flex-col items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] rounded-full mb-4"
          >
            {subtitle}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold text-main-text tracking-tight"
          >
            {title}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-4">
          {!loading && displayTestimonials.map((item: any, idx: number) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gradient-to-br from-white via-rose-50/30 to-pink-50/20 dark:from-[#1b1c26] dark:via-[#161720] dark:to-[#111218] rounded-[32px] p-8 shadow-xl shadow-primary/5 hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 border border-primary/20 dark:border-primary/25 hover:border-primary/50 group flex flex-col h-full relative overflow-hidden"
            >
              {/* Subtle top accent highlight */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              <div className="relative mb-8 flex-grow">
                <Quote size={44} className="text-primary/15 absolute -top-5 -left-3" />
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed relative z-10 italic font-medium">
                  "{item.quote}"
                </p>
              </div>

              <div className="pt-8 border-t border-primary/10 dark:border-zinc-800/80 mt-auto">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 shrink-0">
                    <img
                      src={item.image || `https://picsum.photos/seed/testimonial-${idx}/100/100`}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-500 ring-2 ring-primary/20"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
                      <Sparkles size={12} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-main-text leading-none mb-1">{item.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">{item.role}</p>
                    <p className="text-[10px] text-primary font-black mt-1 uppercase tracking-widest">{item.company}</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest pt-4 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  <span>{item.project || 'Project Collaboration'}</span>
                  <div className="flex items-center gap-1 text-primary">
                    <span className="text-[10px]">{item.date || 'Recent'}</span>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Simple Sparkles component for the button icon
const Sparkles = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);
