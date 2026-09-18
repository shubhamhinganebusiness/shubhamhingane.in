import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, CheckCircle2, BookOpen, Clock, 
  Sparkles, Layers, Cpu, Award, ArrowRight, Printer, Share2
} from 'lucide-react';

interface CourseSyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  course: {
    id: string;
    title: string;
    duration?: string;
    price?: string;
    desc?: string;
    curriculum?: string[];
    capstone?: string;
    techStack?: string[];
    highlights?: string[];
  } | null;
}

export const CourseSyllabusModal: React.FC<CourseSyllabusModalProps> = ({
  isOpen,
  onClose,
  onEnroll,
  course
}) => {
  if (!isOpen || !course) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.1 }}
          className="relative w-full max-w-3xl bg-surface dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 z-10 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="mb-6 pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <BookOpen size={13} />
              <span>Full Curriculum Syllabus</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-main-text tracking-tight">
              {course.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {course.desc}
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60 mb-6">
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-gray-400">Duration</span>
              <span className="text-sm font-black text-main-text">{course.duration || 'Flexible'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-gray-400">Tuition Fee</span>
              <span className="text-sm font-black text-primary">{course.price || 'Free Orientation'}</span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-gray-400">Format</span>
              <span className="text-sm font-black text-main-text">Live + 1-on-1 Mentoring</span>
            </div>
            <div>
              <span className="block text-[10px] font-extrabold uppercase text-gray-400">Certificate</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">ISO Industry Verified</span>
            </div>
          </div>

          {/* Weekly Modules Breakdown */}
          <div className="mb-6">
            <h4 className="text-sm font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
              <Layers size={16} className="text-primary" />
              <span>Structured Weekly Modules</span>
            </h4>
            <div className="space-y-3">
              {(course.curriculum || [
                'Module 1: Architecture, Core Fundamentals & Environment Setup',
                'Module 2: Real-time Cloud Synchronization & State Management',
                'Module 3: Database Security, Permissions & Granular Access Control',
                'Module 4: Enterprise Billing, Automated PDF Generation & Hardware Integration',
                'Module 5: Capstone Deployment, Lighthouse 100/100 Tuning & Career Portfolio Launch'
              ]).map((mod, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-surface border border-gray-100 dark:border-zinc-800 flex items-start gap-3 hover:border-primary/40 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-main-text block">{mod}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Includes assignments, code review pull requests, and live Q&A.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capstone Project Showcase */}
          {course.capstone && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-primary/5 via-indigo-500/5 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary mb-1">
                <Sparkles size={14} />
                <span>Signature Capstone Project</span>
              </div>
              <h5 className="text-base font-black text-main-text">{course.capstone}</h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                You will author and deploy this production system to your personal live URL to display on your resume and GitHub.
              </p>
            </div>
          )}

          {/* Tech Stack Learned */}
          {course.techStack && course.techStack.length > 0 && (
            <div className="mb-8">
              <span className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                Technologies & Tools Mastered
              </span>
              <div className="flex flex-wrap gap-2">
                {course.techStack.map((tech, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 rounded-xl text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-700"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Printer size={15} />
              <span>Print / Save as PDF</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onEnroll();
                }}
                className="px-6 py-3 rounded-2xl bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Enroll in This Cohort</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
