import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Plus, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Layers, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { translations } from '../translations';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';
import { useAuth } from './AuthContext';
import { ProjectCardImage } from './ProjectCardImage';

export const Portfolio: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [filter, setFilter] = useState('all');
  const { items: dbProjects } = useCMSCollection('projects');
  const { settings } = useSiteSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isScoreManager } = useAuth();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(1);

  const title = settings?.headings?.portfolio?.title || t?.portfolio?.title || 'My Amazing Projects';
  const subtitle = settings?.headings?.portfolio?.subtitle || t?.portfolio?.subtitle || 'Featured Software Engineering Showcase';

  const defaultProjects = t?.portfolio?.projects || [];
  const projects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  // Add rich metadata/flags to projects
  const allProjects = projects.map((project: any) => {
    if (project.id === 'dairy-management') {
      return { 
        ...project, 
        isPaidSystem: true,
        loginUrl: '/dairy-login',
        demoUrl: '/live/dairy-demo',
        techStack: ['React', 'Firebase', 'Tailwind'],
        stats: { users: '500+ Farmers', rating: '4.9/5' },
        badge: 'Enterprise SaaS'
      };
    }
    if (project.id === 'agriculture-billing') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/agro-login',
        demoUrl: '/agro-demo',
        techStack: ['TypeScript', 'Firestore', 'QR Scanner'],
        stats: { transactions: '1k+ Invoices', compliance: 'GST 100%' },
        badge: 'Retail POS'
      };
    }
    if (project.id === 'mess-management') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/mess-login',
        demoUrl: '/mess-demo',
        techStack: ['React', 'Firebase', 'Multi-tenant', 'QR Check-in'],
        stats: { capacity: 'Multi-Tenant', speed: 'Instant' },
        badge: 'FoodTech ERP'
      };
    }
    if (project.id === 'medical-prescription') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/med-login',
        demoUrl: '/med-login',
        techStack: ['React', 'Node.js', 'Firebase', 'Canvas Rx'],
        stats: { prescriptions: '2k+ Digital', uptime: '99.9%' },
        badge: 'HealthTech'
      };
    }
    if (project.id === 'furniture-management') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/furniture-login',
        demoUrl: '/furniture-login',
        techStack: ['React', 'Firebase', 'Gemini AI', 'Audit'],
        stats: { modules: '12 Integrated', ai: 'Smart Restock' },
        badge: 'Inventory AI'
      };
    }
    if (project.id === 'school-erp') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/live/school-erp',
        demoUrl: '/live/school-erp',
        techStack: ['React 18', 'Tailwind', 'Canvas Print', 'Watermarks'],
        stats: { modules: '6 Modules', print: '1-Click PDF' },
        badge: 'EduTech ERP'
      };
    }
    if (project.id === 'cricket-scoreboard') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/cricket-login',
        demoUrl: isScoreManager ? '/live/cricket-scoreboard' : '/cricket-login',
        techStack: ['React', 'Firebase RTDB', 'OBS Overlay', 'Web Audio'],
        stats: { liveStream: 'OBS Ready', latency: '<100ms' },
        badge: 'Sports Broadcast'
      };
    }
    if (project.id === 'cricket-auction') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/cricket-login',
        demoUrl: '/live/cricket-auction',
        techStack: ['React 18', 'Web Audio API', 'Timer Engine', 'Auction Ledger'],
        stats: { franchises: '8 Teams', liveTimer: 'Radial Pulse' },
        badge: 'Live Bidding'
      };
    }
    if (project.id === 'video-streamer-recorder') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/video-streamer-recorder',
        techStack: ['WebRTC API', 'MediaRecorder', 'HTML5 Canvas', 'IndexedDB'],
        stats: { latency: '<200ms', feed: 'Hardware Accel' },
        badge: 'WebRTC Studio'
      };
    }
    if (project.id === 'id-card-generator') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/id-card-generator',
        techStack: ['HTML5 Canvas API', 'jsPDF', 'PapaParse CSV', 'React 18'],
        stats: { capacity: '500+ Bulk', DPI: '300 Print HQ' },
        badge: 'Vector Graphics'
      };
    }
    if (project.id === 'photography-portfolio') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/photography-portfolio',
        techStack: ['React', 'Motion', 'Tailwind', 'Editorial Lux'],
        stats: { design: 'Editorial', speed: 'Fluid 60fps' },
        badge: 'Luxury Brand'
      };
    }
    if (project.id === 'ganpati-mandal') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/ganpati-mandal',
        techStack: ['React', 'Digital Pavati', 'WhatsApp API', 'Ledger ERP'],
        stats: { pavatis: '100% Digital', export: 'PDF & WhatsApp' },
        badge: 'Community ERP'
      };
    }
    if (project.id === 'cricket-toss') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/cricket-toss',
        techStack: ['React 18', '3D CSS Physics', 'Web Audio API', 'Match Arbiter'],
        stats: { simulation: '3D Fair Toss', audio: 'Web Audio FX' },
        badge: 'Physics Engine'
      };
    }
    if (project.id === 'election-command-center') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/election-command-center',
        techStack: ['React', 'ECI Analytics', 'Booth Mapping', 'Cadre ERP'],
        stats: { booths: '250+ Tracked', command: 'Live HUD' },
        badge: 'GovTech'
      };
    }
    return {
      ...project,
      techStack: project.techStack || ['React', 'TypeScript'],
      stats: project.stats || { rating: '4.9/5', status: 'Live' },
      badge: project.category === 'app' ? 'Mobile/App' : 'Web Application'
    };
  });

  const filteredProjects = allProjects.filter((project: any) => {
    if (filter === 'all') return true;
    return project.category === filter;
  });

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScroll - 10);

      const estimatedCardWidth = clientWidth > 768 ? 480 : 320;
      const index = Math.min(
        filteredProjects.length,
        Math.max(1, Math.round(scrollLeft / estimatedCardWidth) + 1)
      );
      setCurrentIndex(index);
    } else {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setCurrentIndex(1);
    }
  }, [filteredProjects.length]);

  useEffect(() => {
    handleScroll();
  }, [filteredProjects, handleScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const cardWidth = clientWidth > 768 ? 480 : clientWidth * 0.85;
      const scrollTo = direction === 'left' ? scrollLeft - cardWidth : scrollLeft + cardWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Keyboard arrow navigation when hovering over the section
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      scroll('left');
    } else if (e.key === 'ArrowRight') {
      scroll('right');
    }
  };

  // Reset scroll position on category filter change
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Defensive check for translation data
  if (!t || !t.portfolio) {
    return <div className="py-20 text-center">Translation data missing for portfolio.</div>;
  }

  return (
    <section 
      id="portfolio" 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="min-h-screen lg:h-screen lg:max-h-screen flex flex-col justify-between py-4 sm:py-6 lg:py-7 bg-main-bg relative overflow-hidden transition-colors select-none focus:outline-none"
    >
      {/* Subtle Ambient Background Lighting */}
      <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* TOP HEADER & CONTROLS */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3 sm:mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider">
                <Sparkles size={11} className="animate-pulse" />
                <span>{subtitle}</span>
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-main-text tracking-tight">
              {title}
            </h2>
          </div>

          {/* Quick Counter & Nav Buttons for Desktop Header */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-gray-200/70 dark:border-zinc-800 text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
              <span className="text-primary">{String(currentIndex).padStart(2, '0')}</span>
              <span className="text-gray-400">/</span>
              <span>{String(filteredProjects.length).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous Projects"
                className={`p-2 rounded-xl border transition-all ${
                  canScrollLeft
                    ? 'bg-surface text-main-text border-gray-200 dark:border-zinc-800 hover:border-primary hover:text-primary active:scale-95 shadow-sm'
                    : 'bg-surface/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-zinc-900 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Next Projects"
                className={`p-2 rounded-xl border transition-all ${
                  canScrollRight
                    ? 'bg-surface text-main-text border-gray-200 dark:border-zinc-800 hover:border-primary hover:text-primary active:scale-95 shadow-sm'
                    : 'bg-surface/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-zinc-900 cursor-not-allowed opacity-50'
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {Object.entries(t.portfolio.filters || { all: 'All', web: 'Web', app: 'App', design: 'Design', ai: 'AI' }).map(([key, label]) => {
            const count = allProjects.filter((p: any) => key === 'all' || p.category === key).length;
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleFilterChange(key)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]' 
                    : 'bg-surface text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200/60 dark:border-zinc-800'
                }`}
              >
                <span>{label as string}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MIDDLE: 100VH HORIZONTALLY SCROLLABLE SHOWCASE */}
      <div className="flex-1 min-h-0 flex items-center w-full my-auto py-2 sm:py-3 relative group/slider">
        {/* Floating Side Arrow Controls (Desktop) */}
        <div className="absolute left-2 sm:left-4 z-20 hidden md:block pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll Left"
            className={`p-3 rounded-2xl bg-surface/90 backdrop-blur-md shadow-xl border border-gray-200 dark:border-zinc-800 text-main-text hover:text-primary hover:border-primary pointer-events-auto transition-all transform active:scale-95 ${
              !canScrollLeft ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div className="absolute right-2 sm:right-4 z-20 hidden md:block pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll Right"
            className={`p-3 rounded-2xl bg-surface/90 backdrop-blur-md shadow-xl border border-gray-200 dark:border-zinc-800 text-main-text hover:text-primary hover:border-primary pointer-events-auto transition-all transform active:scale-95 ${
              !canScrollRight ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Carousel Container */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex items-center gap-5 sm:gap-6 lg:gap-7 overflow-x-auto custom-scrollbar snap-x snap-mandatory scroll-smooth px-4 sm:px-6 lg:px-12 py-2 w-full no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredProjects.map((project: any, idx: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.05, 0.3), duration: 0.3 }}
              className="group/card flex-shrink-0 w-[290px] sm:w-[380px] md:w-[440px] lg:w-[460px] xl:w-[480px] h-[380px] sm:h-[410px] lg:h-[430px] bg-surface rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-gray-200/80 dark:border-zinc-800 snap-center relative flex flex-col justify-between"
            >
              {/* TOP: VISUAL HERO / IMAGE */}
              <div className="relative h-40 sm:h-44 lg:h-48 shrink-0 overflow-hidden bg-gray-100 dark:bg-zinc-800">
                <ProjectCardImage 
                  project={project} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badges on Visual Header */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {project.badge || project.category}
                  </span>

                  {project.isPaidSystem && (
                    <span className="px-2.5 py-1 bg-primary/90 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-md">
                      SaaS Suite
                    </span>
                  )}
                </div>

                {/* Title Overlay on Image Bottom for Optical Continuity */}
                <div className="absolute bottom-3 left-4 right-4 z-10">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight line-clamp-1 drop-shadow-md group-hover/card:text-amber-200 transition-colors">
                    {project.title}
                  </h3>
                </div>

                {/* Interactive Inspect Hover Action */}
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                  <Link 
                    to={`/project/${project.id}`}
                    aria-label={`View ${project.title} Details`}
                    className="p-3.5 bg-white text-primary rounded-2xl shadow-xl hover:scale-110 transition-transform flex items-center gap-2 font-bold text-xs uppercase tracking-wider"
                  >
                    <Plus size={18} />
                    <span>Explore Project</span>
                  </Link>
                </div>
              </div>

              {/* BOTTOM: CARD CONTENT & ACTIONS */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-h-0 bg-surface">
                {/* Description */}
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-[13px] leading-relaxed line-clamp-2 mb-3">
                    {project.desc}
                  </p>

                  {/* Tech Stack Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {project.techStack?.slice(0, 4).map((tech: string) => (
                      <span 
                        key={tech} 
                        className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800/90 rounded-md text-[10px] font-semibold text-gray-600 dark:text-gray-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metrics and Action Links */}
                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
                  {/* Key Stats Highlights */}
                  <div className="flex items-center gap-4">
                    {Object.entries(project.stats || {}).slice(0, 2).map(([key, val]: [string, any]) => (
                      <div key={key}>
                        <p className="text-[9px] font-black uppercase tracking-wider text-primary/70">{key}</p>
                        <p className="text-xs sm:text-sm font-bold text-main-text leading-tight">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {project.demoUrl && (
                      project.demoUrl.startsWith('http') ? (
                        <a
                          href={project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-primary text-white hover:brightness-110 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5"
                        >
                          <span>Live</span>
                          <ArrowUpRight size={13} />
                        </a>
                      ) : (
                        <Link
                          to={project.demoUrl}
                          className="px-3 py-1.5 bg-primary text-white hover:brightness-110 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5"
                        >
                          <span>Live</span>
                          <ArrowUpRight size={13} />
                        </Link>
                      )
                    )}

                    <Link
                      to={`/project/${project.id}`}
                      className="px-2.5 py-1.5 text-main-text hover:text-primary rounded-xl text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-1"
                      title="View Details"
                    >
                      <span>Details</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* End spacing for comfortable scrolling */}
          <div className="shrink-0 w-2 sm:w-6 h-1" />
        </div>

        {/* Empty state if filter has 0 results */}
        {filteredProjects.length === 0 && (
          <div className="w-full text-center py-12">
            <p className="text-gray-500 text-sm">No projects found in this category.</p>
          </div>
        )}
      </div>

      {/* BOTTOM FOOTER: PROGRESS TRACK & VIEW ALL BUTTON */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200/60 dark:border-zinc-800">
          {/* Progress Bar and Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-28 sm:w-44 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(12, scrollProgress)}%` }}
              />
            </div>
            <span className="hidden sm:inline text-[11px] font-mono text-gray-400">
              {Math.round(scrollProgress)}% explored
            </span>
          </div>

          {/* View All Projects Button */}
          <Link 
            to="/projects"
            className="inline-flex items-center gap-2 px-5 py-2 sm:py-2.5 bg-surface hover:bg-gray-100 dark:hover:bg-zinc-800 text-main-text border border-gray-200 dark:border-zinc-700 hover:border-primary rounded-xl font-bold uppercase tracking-wider text-xs shadow-xs hover:shadow-md transition-all group"
          >
            <span>View All Projects</span>
            <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Hint */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-gray-400 font-mono">
            <span>Use ← → keys or swipe</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
