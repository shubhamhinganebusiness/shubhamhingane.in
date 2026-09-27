import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowUpRight, ArrowRight, ChevronLeft, ChevronRight, 
  Search, SlidersHorizontal, LayoutGrid, Eye, X, 
  Terminal, ShieldCheck, Check, Layers, Cpu, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { translations } from '../translations';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';
import { useAuth } from './AuthContext';
import { ProjectCardImage } from './ProjectCardImage';
import { ProjectQuickViewModal } from './portfolio/ProjectQuickViewModal';

export const Portfolio: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'slider' | 'grid'>('slider');
  const [mobileLayout, setMobileLayout] = useState<'carousel' | 'feed'>('carousel');
  const [inspectProject, setInspectProject] = useState<any | null>(null);

  const { items: dbProjects } = useCMSCollection('projects');
  const { settings } = useSiteSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isScoreManager } = useAuth();

  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const title = settings?.headings?.portfolio?.title || t?.portfolio?.title || 'Production Software & Systems';
  const subtitle = settings?.headings?.portfolio?.subtitle || t?.portfolio?.subtitle || 'Selected Full-Stack Architectures & Deployed Applications';

  const defaultProjects = t?.portfolio?.projects || [];
  const projects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  // Add rich domain metadata & verified routes to projects
  const allProjects = useMemo(() => {
    return projects.map((project: any) => {
      if (project.id === 'dairy-management') {
        return { 
          ...project, 
          isPaidSystem: true,
          domainTag: 'FoodTech & ERP',
          loginUrl: '/dairy-login',
          demoUrl: '/live/dairy-demo',
          techStack: ['React 19', 'Firebase', 'Tailwind', 'Multi-tenant'],
          stats: { users: '500+ Farmers', rating: '4.9 / 5' },
          badge: 'Enterprise SaaS'
        };
      }
      if (project.id === 'agriculture-billing') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'Retail & FinTech',
          loginUrl: '/agro-login',
          demoUrl: '/agro-demo',
          techStack: ['TypeScript', 'Firestore', 'QR Scanner', 'Thermal Print'],
          stats: { volume: '1k+ Invoices', compliance: 'GST 100%' },
          badge: 'Retail POS'
        };
      }
      if (project.id === 'mess-management') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'Hospitality ERP',
          loginUrl: '/mess-login',
          demoUrl: '/mess-demo',
          techStack: ['React', 'Firebase', 'Multi-tenant', 'QR Check-in'],
          stats: { architecture: 'Multi-Tenant', speed: '< 80ms' },
          badge: 'SaaS Platform'
        };
      }
      if (project.id === 'medical-prescription') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'HealthTech & Rx',
          loginUrl: '/med-login',
          demoUrl: '/med-login',
          techStack: ['React', 'Node.js', 'Firebase', 'Canvas Rx'],
          stats: { documents: '2k+ Digital Rx', uptime: '99.9%' },
          badge: 'Health Platform'
        };
      }
      if (project.id === 'furniture-management') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'Inventory & ERP',
          loginUrl: '/furniture-login',
          demoUrl: '/furniture-login',
          techStack: ['React', 'Firebase', 'Gemini AI', 'Audit Logs'],
          stats: { inventory: '12 Modules', intelligence: 'Smart Restock' },
          badge: 'Inventory AI'
        };
      }
      if (project.id === 'school-erp') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'EduTech ERP',
          loginUrl: '/live/school-erp',
          demoUrl: '/live/school-erp',
          techStack: ['React 18', 'Canvas Print', 'Tailwind', 'Watermarks'],
          stats: { modules: '6 Portals', reports: '1-Click PDF' },
          badge: 'School Suite'
        };
      }
      if (project.id === 'cricket-scoreboard') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'Sports Broadcast',
          loginUrl: '/cricket-login',
          demoUrl: isScoreManager ? '/live/cricket-scoreboard' : '/cricket-login',
          techStack: ['React', 'Firebase RTDB', 'OBS Overlay', 'Web Audio'],
          stats: { latency: '< 100ms', output: 'OBS Overlay' },
          badge: 'Live Broadcast'
        };
      }
      if (project.id === 'cricket-auction') {
        return {
          ...project,
          isPaidSystem: true,
          domainTag: 'Live Auction Engine',
          loginUrl: '/cricket-login',
          demoUrl: '/live/cricket-auction',
          techStack: ['React 18', 'Web Audio API', 'Timer Engine', 'Ledger'],
          stats: { franchises: '8 Teams', visual: 'Radial Timer' },
          badge: 'Realtime Bidding'
        };
      }
      if (project.id === 'cricket-toss') {
        return {
          ...project,
          isPaidSystem: false,
          domainTag: 'Physics & Audio',
          demoUrl: '/live/cricket-toss',
          techStack: ['React 18', '3D CSS Physics', 'Web Audio API', 'Arbiter'],
          stats: { engine: '3D Physics', audio: 'Web Audio FX' },
          badge: 'Physics Engine'
        };
      }
      if (project.id === 'video-streamer-recorder') {
        return {
          ...project,
          isPaidSystem: false,
          domainTag: 'Media & WebRTC',
          demoUrl: '/live/video-streamer-recorder',
          techStack: ['WebRTC API', 'MediaRecorder', 'HTML5 Canvas', 'IndexedDB'],
          stats: { latency: '< 150ms', encoding: 'Hardware Accel' },
          badge: 'WebRTC Studio'
        };
      }
      if (project.id === 'id-card-generator') {
        return {
          ...project,
          isPaidSystem: false,
          domainTag: 'Graphics & Vector',
          demoUrl: '/live/id-card-generator',
          techStack: ['HTML5 Canvas', 'jsPDF', 'PapaParse CSV', 'React'],
          stats: { export: '500+ Batch CSV', output: '300 DPI Print' },
          badge: 'Design Suite'
        };
      }
      if (project.id === 'photography-portfolio') {
        return {
          ...project,
          isPaidSystem: false,
          domainTag: 'Editorial & Brand',
          demoUrl: '/live/photography-portfolio',
          techStack: ['React', 'Motion', 'Tailwind', 'Editorial Layout'],
          stats: { framerate: '60 FPS', type: 'Single Page App' },
          badge: 'Editorial SPA'
        };
      }
      if (project.id === 'ganpati-mandal') {
        return {
          ...project,
          isPaidSystem: false,
          domainTag: 'Civic & Community',
          demoUrl: '/live/ganpati-mandal',
          techStack: ['React', 'Digital Pavati', 'WhatsApp API', 'Ledger'],
          stats: { receipts: '100% Digital', sharing: 'Instant WhatsApp' },
          badge: 'Community ERP'
        };
      }
      if (project.id === 'election-command-center') {
        return {
          ...project,
          isPaidSystem: false,
          domainTag: 'GovTech & Analytics',
          demoUrl: '/live/election-command-center',
          techStack: ['React', 'ECI Analytics', 'Booth Mapping', 'Cadre ERP'],
          stats: { coverage: '250+ Booths', view: 'Tactical HUD' },
          badge: 'GovTech'
        };
      }
      return {
        ...project,
        domainTag: project.category === 'app' ? 'Mobile & Cloud' : 'Web Platform',
        techStack: project.techStack || ['React', 'TypeScript', 'Tailwind'],
        stats: project.stats || { status: 'Live Production', rating: '5.0' },
        badge: project.category === 'app' ? 'Cloud App' : 'Web Application'
      };
    });
  }, [projects, isScoreManager]);

  // High-level functional category filters
  const categoryFilters = [
    { key: 'all', label: 'All Systems' },
    { key: 'saas', label: 'Enterprise SaaS' },
    { key: 'sports', label: 'Sports & Broadcast' },
    { key: 'media', label: 'WebRTC & Creative' },
    { key: 'civic', label: 'GovTech & Community' }
  ];

  // Map each project to a functional category
  const getProjectCategory = (id: string, origCategory: string) => {
    if (['dairy-management', 'agriculture-billing', 'mess-management', 'medical-prescription', 'furniture-management', 'school-erp'].includes(id)) {
      return 'saas';
    }
    if (['cricket-scoreboard', 'cricket-auction', 'cricket-toss'].includes(id)) {
      return 'sports';
    }
    if (['video-streamer-recorder', 'id-card-generator', 'photography-portfolio'].includes(id)) {
      return 'media';
    }
    if (['ganpati-mandal', 'election-command-center'].includes(id)) {
      return 'civic';
    }
    return origCategory === 'app' ? 'saas' : 'media';
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project: any) => {
      const projCat = getProjectCategory(project.id, project.category);
      const matchesCategory = filter === 'all' || projCat === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        project.title.toLowerCase().includes(q) ||
        (project.desc && project.desc.toLowerCase().includes(q)) ||
        (project.domainTag && project.domainTag.toLowerCase().includes(q)) ||
        (project.techStack && project.techStack.some((t: string) => t.toLowerCase().includes(q)));
      return matchesCategory && matchesQuery;
    });
  }, [allProjects, filter, searchQuery]);

  // Handle scroll progress and active index
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
      setCanScrollLeft(scrollLeft > 15);
      setCanScrollRight(scrollLeft < maxScroll - 15);

      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 320;
      const index = Math.round(scrollLeft / (cardWidth + 20));
      setActiveIndex(Math.max(0, Math.min(filteredProjects.length - 1, index)));
    } else {
      setScrollProgress(100);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setActiveIndex(0);
    }
  }, [filteredProjects.length]);

  useEffect(() => {
    handleScroll();
  }, [filteredProjects, handleScroll]);

  // Scroll navigation helper
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const step = clientWidth > 768 ? clientWidth * 0.75 : clientWidth * 0.85;
      const scrollTo = direction === 'left' ? scrollLeft - step : scrollLeft + step;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (viewMode === 'slider') {
      if (e.key === 'ArrowLeft') scroll('left');
      if (e.key === 'ArrowRight') scroll('right');
    }
  };

  const handleFilterSelect = (key: string) => {
    setFilter(key);
    setActiveIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  // Fallback if translations fail
  if (!t || !t.portfolio) {
    return <div className="py-20 text-center text-sm text-gray-500">Portfolio data loading...</div>;
  }

  return (
    <section 
      id="portfolio" 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="py-12 sm:py-16 md:py-20 lg:py-24 bg-main-bg relative transition-colors focus:outline-none"
    >
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER: Editorial, Confident & Professional */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-primary mb-2">
              <span>Selected Works</span>
              <span aria-hidden="true" className="text-gray-400">&bull;</span>
              <span>13 Production Applications</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-main-text tracking-tight text-balance">
              {title}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              Every system is a fully architected, responsive, live application with real database integrations, role permissions, and interactive demos.
            </p>
          </div>

          {/* Desktop Search & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tech, platform..."
                className="w-full pl-8 pr-7 py-2 rounded-xl bg-surface border border-gray-200 dark:border-zinc-800 text-xs text-main-text placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-main-text p-1"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* View Switcher (Desktop) */}
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-surface border border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('slider')}
                title="Slider View"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'slider'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-main-text'
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Showcase</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-main-text'
                }`}
              >
                <LayoutGrid size={13} />
                <span>Grid</span>
              </button>
            </div>

            {/* Slider Navigation Arrows (Desktop) */}
            {viewMode === 'slider' && (
              <div className="hidden md:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  aria-label="Previous Project"
                  className={`min-h-[38px] min-w-[38px] rounded-xl border flex items-center justify-center transition-all ${
                    canScrollLeft
                      ? 'bg-surface text-main-text border-gray-200 dark:border-zinc-800 hover:border-primary hover:text-primary shadow-xs cursor-pointer'
                      : 'bg-surface/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-zinc-900 cursor-not-allowed opacity-40'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  aria-label="Next Project"
                  className={`min-h-[38px] min-w-[38px] rounded-xl border flex items-center justify-center transition-all ${
                    canScrollRight
                      ? 'bg-surface text-main-text border-gray-200 dark:border-zinc-800 hover:border-primary hover:text-primary shadow-xs cursor-pointer'
                      : 'bg-surface/50 text-gray-300 dark:text-gray-700 border-gray-100 dark:border-zinc-900 cursor-not-allowed opacity-40'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CATEGORY FILTER TABS: Sleek, Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-gray-200/70 dark:border-zinc-800">
          {/* Scrollable Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categoryFilters.map((cat) => {
              const count = cat.key === 'all' 
                ? allProjects.length 
                : allProjects.filter((p: any) => getProjectCategory(p.id, p.category) === cat.key).length;
              const isActive = filter === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleFilterSelect(cat.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface text-gray-600 dark:text-gray-400 hover:text-main-text hover:bg-gray-100 dark:hover:bg-zinc-800/80 border border-gray-200/80 dark:border-zinc-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile Switch: Carousel vs Feed */}
          <div className="flex sm:hidden items-center justify-between pt-1">
            <span className="text-xs text-gray-500 font-medium">
              Showing {filteredProjects.length} of {allProjects.length} systems
            </span>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-gray-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMobileLayout('carousel')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  mobileLayout === 'carousel' ? 'bg-primary text-white' : 'text-gray-500'
                }`}
              >
                Swipe
              </button>
              <button
                type="button"
                onClick={() => setMobileLayout('feed')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  mobileLayout === 'feed' ? 'bg-primary text-white' : 'text-gray-500'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* EMPTY STATE */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-16 px-4 bg-surface rounded-2xl border border-gray-200 dark:border-zinc-800">
            <p className="text-sm font-semibold text-main-text">No systems found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your category filter or search keywords.</p>
            <button
              onClick={() => { setFilter('all'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* VIEW MODE 1: SHOWCASE HORIZONTAL SLIDER (Desktop + Mobile Swipe) */}
        {viewMode === 'slider' && (
          <div className={`${mobileLayout === 'feed' ? 'hidden sm:block' : 'block'}`}>
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredProjects.map((project: any, idx: number) => (
                <div
                  key={project.id}
                  className="group flex-shrink-0 w-[84vw] max-w-[340px] sm:w-[360px] md:w-[400px] lg:w-[420px] bg-surface rounded-2xl border border-gray-200/90 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all duration-300 snap-center flex flex-col justify-between"
                >
                  {/* CARD TOP: Media Frame (16:10 aspect ratio) */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950 shrink-0 border-b border-gray-100 dark:border-zinc-800">
                    <ProjectCardImage 
                      project={project} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                    {/* Clean Corner Meta Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                      <span className="text-[11px] font-mono tracking-wider font-semibold text-white/95 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10">
                        {project.badge || 'Live Production'}
                      </span>
                      {project.isPaidSystem && (
                        <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-300 bg-emerald-950/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/30">
                          SaaS Suite
                        </span>
                      )}
                    </div>

                    {/* Quick Inspect Button on Image */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <button
                        type="button"
                        onClick={() => setInspectProject(project)}
                        className="px-2.5 py-1 rounded-lg bg-surface/90 hover:bg-surface text-main-text backdrop-blur-md text-[11px] font-semibold border border-gray-200 dark:border-zinc-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Architecture & Overview"
                      >
                        <Eye size={13} className="text-primary" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD BODY: Content, Meta & Tech Stack */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Domain Kicker */}
                      <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-primary mb-1.5">
                        <span>{project.domainTag || 'WEB APPLICATION'}</span>
                        <span aria-hidden="true" className="text-gray-400">&bull;</span>
                        <span className="text-gray-500 dark:text-gray-400 uppercase">2026 DEPLOYMENT</span>
                      </div>

                      {/* Project Title */}
                      <h3 className="text-lg sm:text-xl font-bold text-main-text tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {project.title}
                      </h3>

                      {/* Description */}
                      <p className="mt-2 text-xs sm:text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {project.desc}
                      </p>

                      {/* Tech Stack Chips */}
                      <div className="mt-3.5 flex flex-wrap gap-1.5">
                        {project.techStack?.slice(0, 4).map((tech: string) => (
                          <span 
                            key={tech}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-zinc-700/60"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* CARD FOOTER: Metrics & Primary Actions */}
                    <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                      {/* Metric highlights */}
                      <div className="hidden sm:flex items-center gap-3">
                        {Object.entries(project.stats || {}).slice(0, 1).map(([key, val]: [string, any]) => (
                          <div key={key}>
                            <span className="block text-[9px] font-mono uppercase text-gray-400">{key}</span>
                            <span className="text-xs font-bold text-main-text font-mono tabular-nums">{val}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Link
                          to={`/project/${project.id}`}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:border-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <span>Case Study</span>
                          <ArrowRight size={13} />
                        </Link>

                        {project.demoUrl && (
                          project.demoUrl.startsWith('http') ? (
                            <a
                              href={project.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[40px] px-4 py-1.5 rounded-xl bg-primary text-white hover:brightness-105 active:scale-95 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <span>Live App</span>
                              <ArrowUpRight size={13} />
                            </a>
                          ) : (
                            <Link
                              to={project.demoUrl}
                              className="min-h-[40px] px-4 py-1.5 rounded-xl bg-primary text-white hover:brightness-105 active:scale-95 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                            >
                              <span>Live App</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Carousel Pagination Dots */}
            <div className="sm:hidden flex items-center justify-center gap-1.5 mt-3">
              {filteredProjects.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (scrollRef.current) {
                      const card = scrollRef.current.children[idx] as HTMLElement;
                      if (card) {
                        scrollRef.current.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' });
                      }
                    }
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === activeIndex 
                      ? 'w-6 bg-primary' 
                      : 'w-1.5 bg-gray-300 dark:bg-zinc-700'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW MODE 2: RESPONSIVE GRID (Or Mobile Feed View) */}
        {(viewMode === 'grid' || (viewMode === 'slider' && mobileLayout === 'feed')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project: any) => (
              <div
                key={project.id}
                className="group bg-surface rounded-2xl border border-gray-200/90 dark:border-zinc-800 overflow-hidden shadow-xs hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Media frame */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950 shrink-0 border-b border-gray-100 dark:border-zinc-800">
                  <ProjectCardImage 
                    project={project} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                    <span className="text-[11px] font-mono tracking-wider font-semibold text-white/95 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/10">
                      {project.badge || 'Live Production'}
                    </span>
                    {project.isPaidSystem && (
                      <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-300 bg-emerald-950/70 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-500/30">
                        SaaS Suite
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={() => setInspectProject(project)}
                      className="px-2.5 py-1 rounded-lg bg-surface/90 hover:bg-surface text-main-text backdrop-blur-md text-[11px] font-semibold border border-gray-200 dark:border-zinc-700 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Architecture & Overview"
                    >
                      <Eye size={13} className="text-primary" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-primary mb-1.5">
                      <span>{project.domainTag || 'WEB APPLICATION'}</span>
                      <span aria-hidden="true" className="text-gray-400">&bull;</span>
                      <span className="text-gray-500 dark:text-gray-400 uppercase">2026 DEPLOYMENT</span>
                    </div>

                    <h3 className="text-lg font-bold text-main-text tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                      {project.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                      {project.desc}
                    </p>

                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {project.techStack?.slice(0, 4).map((tech: string) => (
                        <span 
                          key={tech}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-zinc-700/60"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                    <div className="hidden sm:flex items-center gap-3">
                      {Object.entries(project.stats || {}).slice(0, 1).map(([key, val]: [string, any]) => (
                        <div key={key}>
                          <span className="block text-[9px] font-mono uppercase text-gray-400">{key}</span>
                          <span className="text-xs font-bold text-main-text font-mono tabular-nums">{val}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Link
                        to={`/project/${project.id}`}
                        className="min-h-[40px] px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:border-primary text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <span>Case Study</span>
                        <ArrowRight size={13} />
                      </Link>

                      {project.demoUrl && (
                        project.demoUrl.startsWith('http') ? (
                          <a
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-primary text-white hover:brightness-105 active:scale-95 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>Live App</span>
                            <ArrowUpRight size={13} />
                          </a>
                        ) : (
                          <Link
                            to={project.demoUrl}
                            className="min-h-[40px] px-4 py-1.5 rounded-xl bg-primary text-white hover:brightness-105 active:scale-95 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all"
                          >
                            <span>Live App</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SECTION FOOTER: Clean Progress & View All Link */}
        <div className="mt-10 sm:mt-12 pt-6 border-t border-gray-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span>Production Architectures</span>
            <span aria-hidden="true">&bull;</span>
            <span>Real Multi-Tenant Backends</span>
            <span aria-hidden="true">&bull;</span>
            <span>Active Deployments</span>
          </div>

          <Link
            to="/projects"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface hover:bg-gray-100 dark:hover:bg-zinc-800 text-main-text border border-gray-200 dark:border-zinc-700 hover:border-primary text-xs font-bold tracking-wide transition-all shadow-xs group"
          >
            <span>Explore All Projects Archive</span>
            <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* QUICK VIEW MODAL / MOBILE BOTTOM SHEET */}
      <ProjectQuickViewModal
        isOpen={Boolean(inspectProject)}
        onClose={() => setInspectProject(null)}
        project={inspectProject}
      />
    </section>
  );
};

export default Portfolio;
