import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, FileText, Globe, Rocket, ArrowRight, ShieldCheck, X, Send, CheckCircle2, ChevronRight, Zap, Users, Layout as LayoutIcon } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';

export const NewsLaunchpad: React.FC = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const icons = [FileText, Globe, ShieldCheck, Rocket];
  const newsT = (t as any).newsLaunchpad;

  if (!newsT) return null;

  const title = settings?.headings?.newsLaunchpad?.title || newsT.title;
  const subtitle = settings?.headings?.newsLaunchpad?.subtitle || newsT.subtitle;

  const steps = [
    { title: "Consultation", icon: Users, desc: "Expert guidance for your niche" },
    { title: "Digital Setup", icon: LayoutIcon, desc: "Portal & app development" },
    { title: "Licensing", icon: ShieldCheck, desc: "Legal & RNI registration help" },
    { title: "Monetization", icon: Zap, desc: "Ad network & revenue setup" }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsModalOpen(false);
      }, 3000);
    }, 1500);
  };

  return (
    <section id="news-launchpad" className="py-24 bg-white dark:bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Rocket size={14} className="animate-bounce" />
            Launch Program 2024
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed"
          >
            {newsT.desc}
          </motion.p>
        </div>

        <div className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            <div className="hidden md:block absolute top-[40px] left-8 right-8 h-[2px] bg-gradient-to-r from-primary/50 via-primary to-primary/50 -z-0 opacity-20" />
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="relative z-10 text-center flex flex-col items-center group"
              >
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl flex items-center justify-center text-primary mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-white group-hover:shadow-primary/20">
                  <step.icon size={32} />
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center border-4 border-white dark:border-[#050505]">
                    {idx + 1}
                  </div>
                </div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{step.title}</h4>
                <p className="text-gray-500 dark:text-gray-400 text-sm px-4">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {newsT.features.map((feature: any, idx: number) => {
            const Icon = icons[idx];
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 relative z-10">
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary transition-colors relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed relative z-10">
                  {feature.desc}
                </p>
                <div className="mt-6 flex items-center text-primary text-xs font-bold tracking-widest gap-2 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  LEARN MORE <ArrowRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-24 relative p-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-[3rem]"
        >
          <div className="bg-gray-50 dark:bg-gray-900/50 backdrop-blur-md rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-bold text-primary">Launched 50+ Media Houses</span>
              </div>
              <h4 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                From Scratch to <span className="text-primary italic">Success.</span>
              </h4>
              <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl">
                We handle the technology, legal, and operational complexities so you can focus on reporting.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 shrink-0 w-full md:w-auto">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-12 py-6 bg-primary text-white rounded-2xl font-bold text-xl shadow-2xl shadow-primary/30 hover:brightness-110 transition-all flex items-center justify-center gap-4 group cursor-pointer"
              >
                {newsT.cta}
                <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-xs text-gray-400 font-medium">Free Discovery Session included</p>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
              >
                <X size={24} className="text-gray-500" />
              </button>

              <div className="p-10 md:p-14">
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Application Sent!</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Our launch team will reach out within 24 hours.</p>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-4xl font-black text-gray-900 dark:text-white mb-3">Launch Application</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">Start your media entrepreneurship journey today.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">FULL NAME</label>
                          <input 
                            required
                            type="text" 
                            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">WHATSAPP NUMBER</label>
                          <input 
                            required
                            type="tel" 
                            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            placeholder="+91"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">PROPOSED AGENCY NAME</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          placeholder="Your Visionary Name"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">PREFERRED LANGUAGE / REGION</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-6 py-5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          placeholder="English, Marathi, etc."
                        />
                      </div>
                      <button 
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full py-6 bg-primary text-white rounded-2xl font-bold text-xl shadow-xl shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-wait mt-6 cursor-pointer"
                      >
                        {isSubmitting ? 'SECURELY SENDING...' : 'INITIATE LAUNCH'}
                        {!isSubmitting && <Send size={20} />}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

