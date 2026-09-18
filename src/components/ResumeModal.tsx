import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Download, FileText, CheckCircle2, Briefcase, GraduationCap, 
  Award, Sparkles, ExternalLink, Mail, Phone, MapPin, Printer
} from 'lucide-react';
import { useSiteSettings } from '../hooks/useCMS';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useSiteSettings();
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handlePrintOrDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 300);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl w-full max-w-3xl overflow-hidden card-shadow my-8 relative flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-main-text">
                  Shubham Hingane — Curriculum Vitae
                </h3>
                <span className="text-xs font-bold text-gray-400">
                  Full-Stack Systems Architect &amp; Software Engineer
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintOrDownload}
                disabled={downloading}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-primary/20 hover:brightness-110 cursor-pointer transition-all"
              >
                <Download size={14} />
                <span>{downloading ? 'Preparing...' : 'Print / Save PDF'}</span>
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-red-500 hover:text-white transition-all text-gray-400 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Resume Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-main-text">
            
            {/* Header / Bio */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div>
                <h2 className="text-2xl font-black text-main-text tracking-tight">SHUBHAM HINGANE</h2>
                <p className="text-primary font-bold text-sm">Senior Full-Stack &amp; Enterprise Systems Engineer</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md">
                  Pune, Maharashtra, India • +91 77199 59593 • shubhamhingane7719@gmail.com
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Open for Q2/Q3 Contracts
                </span>
                <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  Remote Worldwide
                </span>
              </div>
            </div>

            {/* Core Competencies */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Award size={14} className="text-primary" />
                <span>Core Competencies &amp; Technologies</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  'React 18 / TypeScript', 'Node.js / Express', 'Cloud Architecture & GCP',
                  'Firebase Firestore & Realtime DB', 'PostgreSQL / Cloud SQL', 'REST & GraphQL APIs',
                  'Tailwind CSS & Responsive UI', 'Multi-Tenant SaaS Systems', 'News & Media CMS'
                ].map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Key Architectural Solutions */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Briefcase size={14} className="text-primary" />
                <span>Featured Systems &amp; Productions</span>
              </h4>
              
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-150 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-main-text text-sm">Jamkhed Times News &amp; Media Agency Portal</h5>
                      <span className="text-[11px] text-primary font-bold">Production Media Engine</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">Live Production</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    Designed high-throughput regional news publishing architecture with live ticker streaming, advertisement booking workflows, and editor management.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-150 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-main-text text-sm">Ganpati Mandal Digital Pavati ERP &amp; Donation Desk</h5>
                      <span className="text-[11px] text-primary font-bold">Cloud Financial Ledger</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">Deployed</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    Built multi-tenant festival ERP handling real-time WhatsApp digital receipts, volunteer access control, and audited donation books.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-150 dark:border-zinc-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-main-text text-sm">Dairy &amp; Agro Supply Chain Enterprise Suite</h5>
                      <span className="text-[11px] text-primary font-bold">Multi-Tenant ERP</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">Production</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    End-to-end milk collection, fat calculation, farmer ledger billing, and inventory tracking for commercial processing units.
                  </p>
                </div>
              </div>
            </div>

            {/* Education & Credentials */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-primary" />
                <span>Education &amp; Background</span>
              </h4>
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-150 dark:border-zinc-800">
                <h5 className="font-bold text-main-text text-sm">Bachelor in Computer Applications / Computer Science</h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Savitribai Phule Pune University (SPPU), Maharashtra</p>
                <p className="text-xs text-gray-400 mt-1">Specialization in Distributed Web Architecture, Database Systems &amp; Software Design</p>
              </div>
            </div>

          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>Verified Portfolio Credential Profile</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <a
                href="mailto:shubhamhingane7719@gmail.com?subject=Job / Contract Inquiry for Shubham Hingane"
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-main-text hover:border-primary/50 text-center"
              >
                Direct Inquiry
              </a>
              <button
                type="button"
                onClick={handlePrintOrDownload}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:brightness-110 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print or PDF</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
