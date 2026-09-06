import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Folder, Plus, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../components/LanguageContext';
import { translations } from '../translations';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProjectCardImage } from '../components/ProjectCardImage';

const Projects: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { items: dbProjects, loading } = useCMSCollection('projects');
  const { settings } = useSiteSettings();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const defaultProjects = t.portfolio.projects;
  const projects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  // Add metadata/flags to specific projects if they exist in the list
  const allProjects = projects.map((project: any) => {
    if (project.id === 'dairy-management') {
      return { 
        ...project, 
        isPaidSystem: true,
        loginUrl: '/dairy-login',
        demoUrl: '/live/dairy-demo'
      };
    }
    if (project.id === 'agriculture-billing') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/agro-login',
        demoUrl: '/agro-demo'
      };
    }
    if (project.id === 'mess-management') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/mess-login',
        demoUrl: '/mess-demo'
      };
    }
    if (project.id === 'school-erp') {
      return {
        ...project,
        isPaidSystem: true,
        loginUrl: '/live/school-erp',
        demoUrl: '/live/school-erp'
      };
    }
    if (project.id === 'photography-portfolio') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/photography-portfolio'
      };
    }
    if (project.id === 'election-command-center') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/election-command-center'
      };
    }
    if (project.id === 'ganpati-mandal') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/ganpati-mandal'
      };
    }
    if (project.id === 'cricket-toss') {
      return {
        ...project,
        isPaidSystem: false,
        demoUrl: '/live/cricket-toss'
      };
    }
    return project;
  });

  const filteredProjects = allProjects.filter((project: any) => {
    const matchesFilter = filter === 'all' || project.category === filter;
    
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.desc.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-main-bg">
      <Navbar />
      <div className="container mx-auto px-6 py-32">
        <div className="mb-12">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm hover:gap-3 transition-all mb-8"
          >
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl md:text-7xl font-black text-main-text mb-4 tracking-tighter"
              >
                PRO<span className="text-primary italic">JECTS</span>
              </motion.h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
                A complete collection of my digital creations, from web applications to enterprise systems.
              </p>
            </div>
            
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-gray-100 dark:border-gray-800 rounded-2xl px-12 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 whitespace-nowrap" size={18} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-12">
          {Object.entries(t.portfolio.filters).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                filter === key 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'bg-surface text-gray-500 border border-gray-100 dark:border-gray-800 hover:border-primary/30'
              }`}
            >
              {label as string}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project: any) => (
                <motion.div
                  layout
                  key={project.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group bg-surface rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 dark:border-gray-800"
                >
                  <div className="relative h-64 overflow-hidden">
                    <ProjectCardImage 
                      project={project} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                      <Link 
                        to={`/project/${project.id}`}
                        className="p-3 bg-white rounded-full text-primary hover:bg-primary hover:text-white transition-all transform hover:rotate-12"
                      >
                        <Plus size={20} />
                      </Link>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Folder size={14} className="text-primary" />
                      <span className="text-xs font-mono text-primary uppercase tracking-wider">
                        {project.category}
                      </span>
                    </div>
                    <Link to={`/project/${project.id}`} className="block">
                      <h3 className="text-xl font-bold text-main-text mb-2 group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                      {project.desc}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Link 
                        to={`/project/${project.id}`}
                        className="inline-flex items-center gap-2 text-primary text-sm font-bold uppercase tracking-widest hover:gap-3 transition-all"
                      >
                        Case Study
                        <Plus size={16} />
                      </Link>
                      {project.demoUrl && (
                        <a 
                          href={project.demoUrl.startsWith('http') ? project.demoUrl : `/portfolio#${project.id}`}
                          target={project.demoUrl.startsWith('http') ? "_blank" : undefined}
                          rel={project.demoUrl.startsWith('http') ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-2 text-gray-900 text-sm font-bold uppercase tracking-widest hover:text-primary transition-all dark:text-white"
                        >
                          Live Demo
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-24 bg-surface rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
            <Folder className="mx-auto mb-6 text-gray-300" size={64} />
            <h3 className="text-2xl font-bold text-main-text mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Projects;
