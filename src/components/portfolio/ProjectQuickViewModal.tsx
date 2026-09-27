import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ArrowRight, ArrowUpRight, Copy, Check, 
  ExternalLink, Layers, Cpu, ShieldCheck, Terminal, Sparkles
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
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleCopyDemoCreds = () => {
    navigator.clipboard.writeText('admin@demo.com / demo1234');
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
        {/* Backdrop Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window / Mobile Bottom Sheet Container */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full sm:max-w-2xl lg:max-w-3xl bg-surface dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-t-[1.75rem] sm:rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] sm:max-h-[88vh] flex flex-col"
        >
          {/* Mobile Drag Indicator Bar */}
          <div className="sm:hidden w-full pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>

          {/* Top Hero Visual */}
          <div className="relative h-44 sm:h-56 shrink-0 overflow-hidden bg-zinc-950">
            <ProjectCardImage 
              project={project} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

            {/* Micro Badge Overlays */}
            <div className="absolute top-3.5 left-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono tracking-wider font-semibold text-white/90 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                {project.badge || project.category || 'Production'}
              </span>
              {project.isPaidSystem && (
                <span className="text-[11px] font-mono tracking-wider font-semibold text-emerald-300 bg-emerald-950/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-emerald-500/30">
                  Full SaaS
                </span>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="absolute bottom-3 left-4 right-14 sm:left-6 sm:right-6">
              <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 mb-1">
                {project.category?.toUpperCase() || 'SYSTEM ARCHITECTURE'}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-1">
                {project.title}
              </h3>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
            {/* Overview / Problem Solved */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Terminal size={14} className="text-primary" />
                <span>Architecture & Overview</span>
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                {project.longDesc || project.desc}
              </p>
            </div>

            {/* Key Engineering Metrics */}
            {project.stats && Object.keys(project.stats).length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Key Metrics & Capabilities
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.entries(project.stats).map(([k, val]: [string, any]) => (
                    <div 
                      key={k} 
                      className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/70 dark:border-zinc-700/60"
                    >
                      <span className="block text-[10px] font-mono uppercase text-gray-500 dark:text-gray-400">
                        {k}
                      </span>
                      <span className="text-sm font-bold text-main-text font-mono tabular-nums">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrated Technologies */}
            {project.techStack && project.techStack.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                  <Cpu size={14} className="text-primary" />
                  <span>Tech Stack</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech: string, i: number) => (
                    <span 
                      key={i}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-zinc-700/80"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Demo Credentials Box */}
            {project.isPaidSystem && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Interactive Demo Sandbox Available
                  </span>
                  <span className="text-[11px] text-amber-700/90 dark:text-amber-300/80 font-mono">
                    Login: admin@demo.com &bull; Pass: demo1234
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyDemoCreds}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
                >
                  {copiedCreds ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedCreds ? 'Copied to Clipboard' : 'Copy Credentials'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Sticky Modal Action Footer */}
          <div className="p-3.5 sm:p-4 border-t border-gray-200/80 dark:border-zinc-800 bg-surface dark:bg-zinc-900 shrink-0 flex items-center justify-between gap-2.5">
            <Link
              to={`/project/${project.id}`}
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-gray-200 hover:border-primary text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer justify-center"
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
                  className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2 bg-primary text-white hover:brightness-105 active:scale-[0.98] rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Launch Live System</span>
                  <ArrowUpRight size={15} />
                </a>
              ) : (
                <Link
                  to={project.demoUrl}
                  onClick={onClose}
                  className="min-h-[44px] flex-1 sm:flex-initial px-5 py-2 bg-primary text-white hover:brightness-105 active:scale-[0.98] rounded-xl text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Launch Live System</span>
                  <ArrowUpRight size={15} />
                </Link>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
