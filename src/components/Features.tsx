import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code, Smartphone, Globe, Monitor, Video, Megaphone, 
  ArrowRight, ExternalLink, Calculator, Sparkles, CheckCircle2, 
  Clock, ShieldCheck, Layers, Cpu, Radio, Zap, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TiltCard } from './TiltCard';
import { useLanguage } from './LanguageContext';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';
import { ProjectCostEstimatorModal } from './hero/ProjectCostEstimatorModal';
import { BookDemoModal } from './common/BookDemoModal';

const iconMap: Record<string, any> = {
  Code, Smartphone, Globe, Monitor, Video, Megaphone, Radio, Cpu, Layers
};

type ServiceCategory = 'all' | 'saas' | 'mobile' | 'media';

interface ServiceEnrichment {
  category: 'saas' | 'mobile' | 'media';
  categoryLabel: string;
  badge?: string;
  turnaround: string;
  estimatorType: string;
  techStack: string[];
  deliverables: string[];
  liveDemo?: {
    label: string;
    route: string;
    isExternal?: boolean;
  };
}

const serviceEnrichments: Record<string, ServiceEnrichment> = {
  'software-development': {
    category: 'saas',
    categoryLabel: 'SaaS & Enterprise',
    badge: 'Most In-Demand',
    turnaround: '2 - 3 Weeks',
    estimatorType: 'custom_saas',
    techStack: ['React 19', 'Firebase Firestore', 'TypeScript', 'Node.js'],
    deliverables: [
      'Multi-tenant architecture & RBAC auth',
      'Real-time automated PDF & challan billing',
      'Offline-first sync & SQLite/PWA fallback'
    ],
    liveDemo: {
      label: 'Live Dairy & Agro ERP',
      route: '/live/dairy-management'
    }
  },
  'app-development': {
    category: 'mobile',
    categoryLabel: 'Mobile & Cloud',
    badge: 'Hardware & Barcode',
    turnaround: '1.5 - 2 Weeks',
    estimatorType: 'id_graphics',
    techStack: ['Android SDK', 'PWA / Capacitor', 'HTML5 Barcode', 'IndexedDB'],
    deliverables: [
      'Native camera QR & barcode scanner',
      'Instant 300 DPI batch card rendering',
      'Zero-latency edge local storage'
    ],
    liveDemo: {
      label: 'Try Instant ID Builder',
      route: '/live/instant-id-builder'
    }
  },
  'website-development': {
    category: 'saas',
    categoryLabel: 'SaaS & Web Apps',
    badge: 'High Performance',
    turnaround: '1 - 2 Weeks',
    estimatorType: 'portfolio_landing',
    techStack: ['Next.js / Vite', 'Tailwind CSS v4', 'Motion Animations', 'SEO JSON-LD'],
    deliverables: [
      '100/100 Lighthouse performance & SEO',
      'Responsive interactive micro-animations',
      'Headless CMS & live markdown publishing'
    ],
    liveDemo: {
      label: 'Live Ganpati Portal',
      route: '/live/ganpati-mandal'
    }
  },
  'media-broadcasting': {
    category: 'media',
    categoryLabel: 'Broadcast & Sports',
    badge: 'Real-Time WebRTC',
    turnaround: '1 - 2 Weeks',
    estimatorType: 'cricket_erp',
    techStack: ['WebRTC', 'OBS Studio / vMix', 'Canvas API', 'Firestore Real-time'],
    deliverables: [
      'Hardware-accelerated broadcast overlays',
      'Ball-by-ball spectator live stream sync',
      'Lower-thirds, player stats & ticker HUD'
    ],
    liveDemo: {
      label: 'Live Cricket Scoreboard',
      route: '/live/cricket-scoreboard'
    }
  },
  'video-editing': {
    category: 'media',
    categoryLabel: 'Creative & Video',
    turnaround: '3 - 7 Days',
    estimatorType: 'portfolio_landing',
    techStack: ['Web Audio API', 'MediaRecorder API', 'Premiere Pro', 'After Effects'],
    deliverables: [
      'High-bitrate studio video recording',
      'Cinematic color grading & audio synthesis',
      'Viral commercial & reel pacing'
    ],
    liveDemo: {
      label: 'Studio Video Recorder',
      route: '/live/video-streamer-recorder'
    }
  },
  'digital-marketing': {
    category: 'saas',
    categoryLabel: 'Growth & Analytics',
    turnaround: 'Ongoing / 1 Week',
    estimatorType: 'portfolio_landing',
    techStack: ['Schema.org SEO', 'OpenGraph Meta', 'Google Workspace', 'Funnel Analytics'],
    deliverables: [
      'First-page Google SEO & Local Pune ranking',
      'High-converting interactive CTA funnels',
      'Automated WhatsApp & Email notifications'
    ],
    liveDemo: {
      label: 'Workspace Hub',
      route: '/live/photography-portfolio'
    }
  }
};

export const Features = () => {
  const { t } = useLanguage();
  const { items: dbServices } = useCMSCollection('services');
  const { settings } = useSiteSettings();

  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('all');
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [selectedEstimatorType, setSelectedEstimatorType] = useState('custom_saas');

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedDemoService, setSelectedDemoService] = useState({ title: '', id: '' });

  const title = settings?.headings?.features?.title || t.features.title;
  const subtitle = settings?.headings?.features?.subtitle || t.features.subtitle;

  const defaultFeatures = [
    { id: 'software-development', title: t.features.cards.software.title, desc: t.features.cards.software.desc, iconName: 'Code' },
    { id: 'app-development', title: t.features.cards.app.title, desc: t.features.cards.app.desc, iconName: 'Smartphone' },
    { id: 'website-development', title: t.features.cards.web.title, desc: t.features.cards.web.desc, iconName: 'Globe' },
    { id: 'media-broadcasting', title: t.features.cards.media.title, desc: t.features.cards.media.desc, iconName: 'Monitor' },
    { id: 'video-editing', title: t.features.cards.video.title, desc: t.features.cards.video.desc, iconName: 'Video' },
    { id: 'digital-marketing', title: t.features.cards.marketing.title, desc: t.features.cards.marketing.desc, iconName: 'Megaphone' },
  ];

  const features = dbServices.length > 0 ? dbServices : defaultFeatures;

  // Filter based on active tab
  const filteredFeatures = useMemo(() => {
    if (activeCategory === 'all') return features;
    return features.filter(item => {
      const enrichment = serviceEnrichments[item.id];
      return enrichment?.category === activeCategory;
    });
  }, [features, activeCategory]);

  const handleOpenEstimator = (e: React.MouseEvent, serviceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const enrichment = serviceEnrichments[serviceId];
    setSelectedEstimatorType(enrichment?.estimatorType || 'custom_saas');
    setIsEstimatorOpen(true);
  };

  const handleOpenBookDemo = (e: React.MouseEvent, serviceTitle: string, serviceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDemoService({ title: serviceTitle, id: serviceId });
    setIsDemoModalOpen(true);
  };

  const categories = [
    { id: 'all', label: 'All Services', icon: Layers, count: features.length },
    { id: 'saas', label: 'SaaS & Full-Stack', icon: Cpu, count: features.filter(f => serviceEnrichments[f.id]?.category === 'saas').length },
    { id: 'mobile', label: 'Mobile & PWA', icon: Smartphone, count: features.filter(f => serviceEnrichments[f.id]?.category === 'mobile').length },
    { id: 'media', label: 'Broadcast & Media', icon: Radio, count: features.filter(f => serviceEnrichments[f.id]?.category === 'media').length },
  ];

  return (
    <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto relative">
      {/* Background Accent Gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest mb-3 shadow-xs">
            <Sparkles size={13} className="animate-pulse" />
            <span>{subtitle}</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-main-text tracking-tight">
            {title}
          </h2>
          <p className="mt-3 text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Production-grade engineering, bespoke web & mobile architectures, and high-converting software systems crafted for modern businesses.
          </p>
        </div>

        {/* Global Quick Estimator Trigger */}
        <button
          onClick={() => {
            setSelectedEstimatorType('custom_saas');
            setIsEstimatorOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-surface border-2 border-primary/30 hover:border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 card-shadow group self-start md:self-auto cursor-pointer shadow-sm hover:shadow-md"
        >
          <Calculator size={16} className="group-hover:rotate-12 transition-transform" />
          <span>Estimate Custom Project</span>
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface/80 dark:bg-zinc-900/80 border border-gray-200/70 dark:border-zinc-800/80 backdrop-blur-md mb-12 overflow-x-auto custom-scrollbar w-fit max-w-full">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as ServiceCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredFeatures.map((feature, idx) => {
            const Icon = iconMap[feature.iconName] || Globe;
            const enrichment = serviceEnrichments[feature.id] || {
              category: 'saas',
              categoryLabel: 'Custom Build',
              turnaround: '1 - 2 Weeks',
              estimatorType: 'custom_saas',
              techStack: ['React', 'TypeScript', 'Node.js', 'Tailwind'],
              deliverables: [
                'Full responsive interface & UX',
                'Modular clean TypeScript code',
                'Production deployment assistance'
              ]
            };
            const displayNumber = String(idx + 1).padStart(2, '0');

            return (
              <motion.div
                key={feature.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="h-full"
              >
                <TiltCard className="h-full !p-7 md:!p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl">
                  <article className="h-full flex flex-col items-start text-left w-full">
                    {/* Top Row: Icon + Number Badge + Optional Feature Tag */}
                    <div className="w-full flex items-center justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 dark:bg-primary/20 group-hover:bg-white/20 flex items-center justify-center text-primary group-hover:text-white transition-all duration-300 shadow-inner">
                        <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
                      </div>

                      <div className="flex items-center gap-2">
                        {enrichment.badge && (
                          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 group-hover:bg-white/20 group-hover:text-white transition-colors border border-emerald-500/25 group-hover:border-white/30">
                            {enrichment.badge}
                          </span>
                        )}
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800/90 text-gray-500 dark:text-gray-400 group-hover:bg-white/20 group-hover:text-white transition-colors border border-gray-200 dark:border-zinc-700/60 group-hover:border-white/30">
                          {displayNumber}
                        </span>
                      </div>
                    </div>

                    {/* Service Title & Turnaround Tag */}
                    <div className="mb-3 w-full">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-white/80 transition-colors mb-1.5">
                        <Clock size={12} />
                        <span>Turnaround: {enrichment.turnaround}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-main-text group-hover:text-white transition-all duration-300 tracking-tight leading-snug">
                        {feature.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 group-hover:text-white/90 text-sm mb-5 transition-all duration-300 leading-relaxed font-normal">
                      {feature.desc}
                    </p>

                    {/* Key Deliverables Checkmarks */}
                    <div className="w-full mb-5 space-y-1.5 pt-3 border-t border-gray-100 dark:border-zinc-800/80 group-hover:border-white/20 transition-colors">
                      <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 group-hover:text-white/70 mb-1">
                        Key Deliverables
                      </span>
                      {enrichment.deliverables.map((item, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300 group-hover:text-white/95 transition-colors">
                          <CheckCircle2 size={13} className="text-primary group-hover:text-white shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="w-full mb-6">
                      <div className="flex flex-wrap gap-1.5">
                        {enrichment.techStack.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-gray-300 group-hover:bg-white/20 group-hover:text-white transition-colors border border-gray-200/50 dark:border-zinc-700/50 group-hover:border-white/20"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="mt-auto w-full pt-4 border-t border-gray-100 dark:border-zinc-800/80 group-hover:border-white/20 flex flex-wrap items-center justify-between gap-2.5">
                      {/* Book a Demo Button (Available on all cards) */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenBookDemo(e, feature.title, feature.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white group-hover:bg-white group-hover:text-primary text-xs font-bold transition-all duration-300 hover:scale-105 shadow-sm shadow-primary/20 cursor-pointer"
                        title="Book a live 1-on-1 walkthrough"
                      >
                        <Calendar size={13} className="shrink-0" />
                        <span>Book a Demo</span>
                      </button>

                      {/* Right Action: Quick Inquire / Cost Estimator Trigger */}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={(e) => handleOpenEstimator(e, feature.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 group-hover:bg-white text-primary group-hover:text-primary text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
                          title="Calculate estimate for this service"
                        >
                          <Calculator size={13} />
                          <span>Estimate</span>
                        </button>

                        <Link
                          to={`/service/${feature.id}`}
                          className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-zinc-800 group-hover:bg-white group-hover:text-primary text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all duration-300 hover:scale-110"
                          title="Full Service Details"
                        >
                          <ArrowRight size={15} />
                        </Link>
                      </div>
                    </div>
                  </article>
                </TiltCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Process Trust Bar: 4-Step Agile Delivery */}
      <div className="mt-16 p-6 md:p-8 rounded-3xl bg-surface/90 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800/80 backdrop-blur-md card-shadow">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-main-text">Production Workflow & Guarantee</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Strict TypeScript adherence, audited Firebase rules, and guaranteed responsive layout on all devices.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-black">1</span>
              <span>Scope & Architecture</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-black">2</span>
              <span>Interactive Prototype</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center font-black">3</span>
              <span>Cloud & DB Sync</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] flex items-center justify-center font-black">4</span>
              <span>Deploy & Handoff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-wired Project Cost & Timeline Estimator Modal */}
      <ProjectCostEstimatorModal
        isOpen={isEstimatorOpen}
        onClose={() => setIsEstimatorOpen(false)}
        defaultCurrency="INR"
        initialProjectType={selectedEstimatorType}
      />

      {/* Book a Demo Modal */}
      <BookDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        serviceTitle={selectedDemoService.title}
        serviceId={selectedDemoService.id}
      />
    </section>
  );
};


