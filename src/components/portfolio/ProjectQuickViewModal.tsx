import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ExternalLink, ArrowRight, ShieldCheck, CheckCircle2, 
  Layers, Cpu, Sparkles, Key, Lock, ArrowUpRight, Copy, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProjectCardImage } from '../ProjectCardImage';

interface ProjectQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
}

export const ProjectQuickViewModal: React.FC<ProjectQuickViewModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const [copiedCreds, setCopiedCreds] = React.useState(false);

  if (!isOpen || !project) return null;

  const handleCopyDemoCreds = () => {
    navigator.clipboard.writeText('admin@demo.com / demo1234');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.45, bounce: 0.1 }}
          className="relative w-full max-w-3xl bg-surface dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          {/* Top Visual Hero Banner */}
          <div className="relative h-56 sm:h-64 shrink-0 overflow-hidden bg-gray-900">
            <ProjectCardImage 
              project={project} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-black/40 to-transparent" />

            {/* Badges on hero */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-black text-white uppercase tracking-wider border border-white/15 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {project.badge || project.category || 'Production App'}
              </span>

              {project.isPaidSystem && (
                <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                  Enterprise SaaS
                </span>
              )}
            </div>

            {/* Title on Hero Bottom */}
            <div className="absolute bottom-4 left-6 right-6">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {project.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 line-clamp-1 mt-1 font-medium">
                {project.subtitle || project.desc}
              </p>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            {/* Project Overview */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <span>Architecture & Overview</span>
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {project.longDesc || project.desc}
              </p>
            </div>

            {/* Key Metrics Grid */}
            {project.stats && Object.keys(project.stats).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60">
                {Object.entries(project.stats).map(([k, val]: [string, any]) => (
                  <div key={k}>
                    <span className="block text-[10px] font-black uppercase text-gray-400">{k}</span>
                    <span className="text-sm font-black text-main-text">{val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tech Stack Chips */}
            {project.techStack && project.techStack.length > 0 && (
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-2">
                  <Cpu size={14} className="text-primary" />
                  <span>Integrated Technologies</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech: string, i: number) => (
                    <span 
                      key={i}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Live Demo Credentials Strip (for SaaS platforms) */}
            {project.isPaidSystem && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Key size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 block">
                      Sandbox / Demo Credentials Available
                    </span>
                    <span className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      Use demo credentials to preview owner dashboard and analytics.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyDemoCreds}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  {copiedCreds ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedCreds ? 'Copied' : 'Copy Test Login'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Modal Action Footer */}
          <div className="p-5 md:p-6 border-t border-gray-100 dark:border-zinc-800 bg-surface flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2.5">
              <Link
                to={`/project/${project.id}`}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:border-primary font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5"
              >
                <span>Full Case Study</span>
                <ArrowRight size={14} />
              </Link>

              {project.demoUrl && (
                project.demoUrl.startsWith('http') ? (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 bg-primary text-white hover:brightness-110 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Launch Live Application</span>
                    <ArrowUpRight size={15} />
                  </a>
                ) : (
                  <Link
                    to={project.demoUrl}
                    onClick={onClose}
                    className="px-6 py-2.5 bg-primary text-white hover:brightness-110 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <span>Launch Live Application</span>
                    <ArrowUpRight size={15} />
                  </Link>
                )
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
