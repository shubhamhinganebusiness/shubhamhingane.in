import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Rocket, ShieldCheck, Newspaper, Globe, ArrowRight, 
  ChevronRight, CheckCircle2, Tv, Sparkles, Zap, Award, 
  Layers, Users, BarChart3, MessageCircle
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';
import { NewsTierPackages, NewsPackageTier } from './news/NewsTierPackages';
import { NewsComplianceRoadmap } from './news/NewsComplianceRoadmap';
import { NewsLaunchModal } from './news/NewsLaunchModal';

export const NewsLaunchpad: React.FC = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<NewsPackageTier | null>(null);

  const newsT = (t as any).newsLaunchpad;
  if (!newsT) return null;

  const title = settings?.headings?.newsLaunchpad?.title || newsT.title;
  const subtitle = settings?.headings?.newsLaunchpad?.subtitle || newsT.subtitle;

  const handleOpenLaunchWithTier = (tier: NewsPackageTier) => {
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  const handleOpenGeneralLaunch = () => {
    setSelectedTier(null);
    setIsModalOpen(true);
  };

  const proofMetrics = [
    { value: '50+', label: 'Portals & Apps Launched', sub: 'Regional Media Houses' },
    { value: '10M+', label: 'Monthly Readers Served', sub: 'Sub-Second CDN Delivery' },
    { value: '100%', label: 'Google News Approval', sub: 'Verified Structured Schema' },
    { value: '4-Stage', label: 'RNI Legal Guidance', sub: 'PRGI & Press Compliance' }
  ];

  return (
    <section id="news-launchpad" className="py-20 md:py-28 bg-white dark:bg-[#060608] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-blue-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20 md:space-y-24">
        
        {/* SECTION 1: HEADER & HIGH-IMPACT PROOF METRICS */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-sm"
            >
              <Rocket size={14} className="animate-bounce" />
              <span>{subtitle}</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-tight"
            >
              {title}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base md:text-lg leading-relaxed mt-4"
            >
              {newsT.desc}
            </motion.p>
          </div>

          {/* Proof Metric Counters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 sm:p-6 rounded-3xl bg-gray-50 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800 shadow-md"
          >
            {proofMetrics.map((stat, idx) => (
              <div key={idx} className="p-3 text-center sm:text-left">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary tracking-tight block mb-0.5">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-black text-gray-800 dark:text-gray-200 block">
                  {stat.label}
                </span>
                <span className="text-[11px] text-gray-400 font-medium block mt-0.5">
                  {stat.sub}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* SECTION 2: INTERACTIVE TIER PACKAGES (Hyperlocal, Regional, Enterprise) */}
        <div>
          <NewsTierPackages onSelectTier={handleOpenLaunchWithTier} />
        </div>

        {/* SECTION 3: 4-STEP RNI & TECH COMPLIANCE ROADMAP */}
        <div>
          <NewsComplianceRoadmap />
        </div>

        {/* SECTION 5: CALL TO ACTION BANNER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative p-[1.5px] bg-gradient-to-r from-primary/30 via-primary to-blue-500/40 rounded-[2.5rem] shadow-2xl"
        >
          <div className="bg-surface dark:bg-zinc-950 rounded-[2.5rem] p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-primary uppercase tracking-widest">
                  Direct Founder Consultation Available
                </span>
              </div>
              <h4 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                Turn Your News Agency Vision into <span className="text-primary italic">Reality.</span>
              </h4>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl">
                Skip trial-and-error. We provide turnkey portal architecture, verified RNI legal filing, and fast AdSense monetization.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleOpenGeneralLaunch}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-wider shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Schedule Launch Discovery</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Enhanced Launch Application Modal with WhatsApp Handoff */}
      <NewsLaunchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTier={selectedTier}
      />
    </section>
  );
};

export default NewsLaunchpad;
