import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Folder, Plus, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { translations } from '../translations';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';
import { useAuth } from './AuthContext';
import { ProjectCardImage } from './ProjectCardImage';

const Portfolio: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [filter, setFilter] = useState('all');
  const { items: dbProjects } = useCMSCollection('projects');
  const { settings } = useSiteSettings();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isScoreManager } = useAuth();

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const title = settings?.headings?.portfolio?.title || t.portfolio.title;
  const subtitle = settings?.headings?.portfolio?.subtitle || t.portfolio.subtitle;

  // Defensive check for translation data
  if (!t || !t.portfolio || !t.portfolio.projects) {
    return <div className="py-20 text-center">Translation data missing for portfolio.</div>;
  }

  const defaultProjects = t.portfolio.projects;
  const projects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  // Add metadata/flags to specific projects if they exist in the list
  const allProjects = projects.map((project: any) => {
    if (project.id === 'dairy-management') {
      return { 
        ...project, 
        isPaidSystem: true,
        loginUrl: '/dairy-login',
        demoUrl: '/live/dairy-demo',
        techStack: ['React', 'Firebase', 'Tailwind'],
        stats: { users: '500+', impact: 'High' }
      };
    }
    if (project.id === 'agriculture-billing') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/agro-login',
        demoUrl: '/agro-demo',
        techStack: ['TypeScript', 'Firestore', 'React'],
        stats: { transactions: '1k+', region: 'Rural' }
      };
    }
    if (project.id === 'medical-prescription') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/med-login',
        demoUrl: '/med-login',
        techStack: ['React', 'Node.js', 'Firebase'],
        stats: { prescriptions: '2k+', uptime: '99.9%' }
      };
    }
    if (project.id === 'furniture-management') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/furniture-login',
        demoUrl: '/furniture-login',
        techStack: ['React', 'Firebase', 'Gemini AI'],
        stats: { modules: '12', ai: 'Smart' }
      };
    }
    if (project.id === 'school-erp') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/live/school-erp',
        demoUrl: '/live/school-erp',
        techStack: ['React 18', 'Tailwind', 'Motion', 'Watermarks'],
        stats: { modules: '6 Modules', print: '1-Click' }
      };
    }
    if (project.id === 'cricket-scoreboard') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/cricket-login',
        demoUrl: isScoreManager ? '/live/cricket-scoreboard' : '/cricket-login',
        techStack: ['React', 'Firebase', 'OBS Overlay', 'Sound FX'],
        stats: { status: isScoreManager ? 'Authorized' : 'Read-Only' }
      };
    }
    if (project.id === 'video-streamer-recorder') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/video-streamer-recorder',
        techStack: ['WebRTC API', 'MediaRecorder', 'HTML5 Canvas', 'IndexedDB'],
        stats: { latency: '<200ms', feed: 'Loopback' }
      };
    }
    if (project.id === 'id-card-generator') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/id-card-generator',
        techStack: ['HTML5 Canvas API', 'jsPDF', 'PapaParse CSV', 'React 18'],
        stats: { capacity: '500+ Bulk', DPI: '300 Print' }
      };
    }
    if (project.id === 'photography-portfolio') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/photography-portfolio',
        techStack: ['React', 'Framer Motion', 'Tailwind', 'Fluid layouts'],
        stats: { design: 'Premium', speed: 'Fast' }
      };
    }
    if (project.id === 'ganpati-mandal') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/ganpati-mandal',
        techStack: ['React', 'Digital Pavati', 'WhatsApp API', 'Ledger ERP', 'Multi-Lang'],
        stats: { pavatis: '100% Digital', export: 'PDF & WhatsApp' }
      };
    }
    if (project.id === 'cricket-toss') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/cricket-toss',
        techStack: ['React 18', '3D CSS Physics', 'Web Audio API', 'Match Arbiter'],
        stats: { simulation: '3D Fair Toss', audio: 'Web Audio FX' }
      };
    }
    return {
      ...project,
      techStack: project.techStack || ['Web', 'Mobile'],
      stats: project.stats || { rating: '4.9/5' }
    };
  });

  const filteredProjects = allProjects.filter((project: any) => {
    if (filter === 'all') return true;
    
    return project.category === filter;
  });

  return (
    <section id="portfolio" className="py-12 md:py-16 bg-main-bg overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-primary font-mono text-sm tracking-widest uppercase mb-3 block"
          >
            {subtitle}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-main-text mb-4 tracking-tighter"
          >
            {title}
          </motion.h2>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {Object.entries(t.portfolio.filters).map(([key, label]) => {
            const count = allProjects.filter((p: any) => key === 'all' || p.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 flex items-center gap-2 ${
                  filter === key 
                    ? 'bg-primary text-white shadow-xl shadow-primary/40 -translate-y-0.5' 
                    : 'bg-surface text-gray-500 dark:text-gray-400 hover:text-primary shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-800'
                }`}
              >
                {label as string}
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Enhanced Card Scrolling Slider */}
        <div className="relative group/slider pb-12">
          {/* Navigation Buttons - Hidden on Mobile */}
          <div className="absolute -left-4 md:-left-12 top-[40%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-500 hidden md:block">
            <button 
              onClick={() => scroll('left')}
              className="p-6 bg-white dark:bg-gray-800 rounded-full shadow-[10px_10px_20px_rgba(0,0,0,0.1)] text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 border border-gray-100 dark:border-gray-700 active:scale-95"
            >
              <ChevronLeft size={32} />
            </button>
          </div>
          <div className="absolute -right-4 md:-right-12 top-[40%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-500 hidden md:block">
            <button 
              onClick={() => scroll('right')}
              className="p-6 bg-white dark:bg-gray-800 rounded-full shadow-[10px_10px_20px_rgba(0,0,0,0.1)] text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 border border-gray-100 dark:border-gray-700 active:scale-95"
            >
              <ChevronRight size={32} />
            </button>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-8 md:gap-12 custom-scrollbar snap-x snap-mandatory scroll-smooth p-6 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredProjects.map((project: any, idx: number) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                className="group/card flex-shrink-0 w-[300px] md:w-[550px] bg-surface rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-800 snap-center relative"
              >
                {/* Visual Section */}
                <div className="relative h-56 md:h-72 overflow-hidden">
                  <ProjectCardImage 
                    project={project} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110"
                  />
                  
                  {/* Floating Tech Badges */}
                  <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
                    <span className="px-3 py-1 bg-primary/95 backdrop-blur-sm rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-lg">
                      {project.category}
                    </span>
                    {project.isPaidSystem && (
                      <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-[9px] font-black text-primary uppercase tracking-[0.2em] shadow-lg">
                        SaaS
                      </span>
                    )}
                  </div>

                  {/* Icon Overlay */}
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-all duration-500 flex items-center justify-center gap-6 z-20">
                    <Link 
                      to={`/project/${project.id}`}
                      className="p-5 bg-white rounded-[1.5rem] text-primary hover:bg-primary hover:text-white transition-all transform hover:rotate-12 shadow-2xl scale-75 group-hover/card:scale-100"
                    >
                      <Plus size={28} />
                    </Link>
                  </div>
                </div>

                {/* Info Section */}
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-main-text mb-2 tracking-tighter group-hover/card:text-primary transition-colors leading-[1.1]">
                        {project.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 max-w-[90%]">
                        {project.desc}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {project.techStack?.slice(0, 4).map((tech: string) => (
                      <span key={tech} className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-500">
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Actions & Metrics */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800/50">
                    <div className="flex gap-6">
                      {Object.entries(project.stats || {}).slice(0, 2).map(([key, value]: [string, any]) => (
                        <div key={key}>
                          <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-0.5">{key}</p>
                          <p className="text-base font-black text-main-text tracking-tight">{value}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {project.demoUrl && (
                        project.demoUrl.startsWith('http') ? (
                          <a 
                            href={project.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                          >
                            <ExternalLink size={12} />
                            Live
                          </a>
                        ) : (
                          <Link 
                            to={project.demoUrl}
                            className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2"
                          >
                            <ExternalLink size={12} />
                            Live
                          </Link>
                        )
                      )}
                      <Link 
                        to={`/project/${project.id}`}
                        className="inline-flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:gap-3 transition-all"
                      >
                        Details
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Final Spacer for scroll padding */}
            <div className="flex-shrink-0 w-1 md:w-12 h-1" />
          </div>
        </div>

        {/* View All Projects Button */}
        <div className="mt-8 text-center">
          <Link 
            to="/projects"
            className="inline-flex items-center gap-4 px-12 py-5 bg-white dark:bg-gray-900 text-main-text border-2 border-primary/20 hover:border-primary rounded-2xl font-bold uppercase tracking-[0.2em] text-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group"
          >
            View All Projects
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No projects found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolio;

