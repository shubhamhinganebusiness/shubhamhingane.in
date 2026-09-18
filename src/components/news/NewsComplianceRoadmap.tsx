import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCheck2, ShieldCheck, Globe, DollarSign, ArrowRight, 
  CheckCircle2, Sparkles, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

interface StepDetail {
  step: number;
  title: string;
  subtitle: string;
  duration: string;
  icon: any;
  checklist: string[];
  documentsRequired: string[];
  proTip: string;
}

export const NewsComplianceRoadmap: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps: StepDetail[] = [
    {
      step: 1,
      title: 'Title Verification & Trademark Check',
      subtitle: 'Official name reservation on RNI (Press Registrar General of India) portal',
      duration: '3 - 5 Days',
      icon: FileCheck2,
      checklist: [
        '5 Distinct proposed newspaper / digital titles check',
        'District Magistrate (DM / Police Commissioner) forwarding letter',
        'Online PRGI (Press Sewa Portal) e-filing & title allocation',
        'Prefix/Suffix uniqueness verification according to Press Act'
      ],
      documentsRequired: ['Aadhar & PAN Card', 'Affidavit of Ownership', 'Registered Office Address Proof'],
      proTip: 'Avoid using words like "Police", "Crime", "Government", or "National" without statutory clearance.'
    },
    {
      step: 2,
      title: 'High-Performance Portal & CDN Cloud Deployment',
      subtitle: 'Google News approved architecture with sub-second AMP & PWA delivery',
      duration: '5 - 7 Days',
      icon: Globe,
      checklist: [
        'Google News Publisher Center verification & RSS News Sitemap',
        'Full Unicode regional Marathi / Hindi editorial keyboard support',
        'Instant WhatsApp & Telegram Channel webhook broadcasting',
        'Automatic reporter watermark branding on image uploads'
      ],
      documentsRequired: ['Domain DNS Access', 'Editorial Policy & Privacy Pages', 'Chief Editor Bio & Contact Info'],
      proTip: 'Google News prefers dedicated author byline bios and structured news article schema (JSON-LD).'
    },
    {
      step: 3,
      title: 'Press Pass & Reporter Governance Engine',
      subtitle: 'Standard operating procedure for bureau correspondents and field reporters',
      duration: '2 - 3 Days',
      icon: ShieldCheck,
      checklist: [
        'Automated QR-Verified Press Reporter ID Card system',
        'Appointment letters & District Bureau authorisation agreements',
        'Strict Code of Ethics guidelines conforming to PCI (Press Council of India)',
        'Police verification guidance for accredited crime & court correspondents'
      ],
      documentsRequired: ['Reporter Photographs & ID Proofs', 'Letter of Authorization Template'],
      proTip: 'A digital QR code on reporter cards linking to a live verification page establishes instant authenticity with officials.'
    },
    {
      step: 4,
      title: 'Monetization & Ad Network Approvals',
      subtitle: 'Maximizing revenue via Google AdSense, direct local sponsors, and PR feeds',
      duration: '7 - 10 Days',
      icon: DollarSign,
      checklist: [
        'Google AdSense approval audit & compliant ad-density layout',
        'Self-serve local business banner advertising booking system',
        'Direct sponsored articles / political press release rate-card setup',
        'YouTube Channel Partner Program (YPP) optimization & live monetization'
      ],
      documentsRequired: ['Active Bank Account & GSTIN (Optional)', 'PAN Details for AdSense Tax Compliance'],
      proTip: 'Local coaching classes, real estate developers, and local businesses pay 3x to 5x more than programmatic AdSense.'
    }
  ];

  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 inline-flex items-center gap-1.5 mb-2">
          <ShieldCheck size={12} className="text-primary" />
          End-to-End Execution Blueprint
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          The 4-Step Legal & Tech Roadmap
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          From title verification to Google News indexation and monthly recurring ad revenue.
        </p>
      </div>

      {/* Step Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {steps.map((s) => {
          const isActive = activeStep === s.step;
          const Icon = s.icon;

          return (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]'
                  : 'bg-surface dark:bg-zinc-900 border-gray-200/80 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500'
                }`}>
                  Phase 0{s.step}
                </span>
                <Icon size={18} className={isActive ? 'text-white' : 'text-primary'} />
              </div>
              <div>
                <h5 className="font-bold text-xs sm:text-sm line-clamp-1 leading-snug">
                  {s.title}
                </h5>
                <span className={`text-[10px] block mt-1 ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                  {s.duration}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Step Detail Card */}
      {steps.map((s) => {
        if (s.step !== activeStep) return null;
        const Icon = s.icon;

        return (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl bg-surface dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-xl"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                  0{s.step}
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {s.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {s.subtitle}
                  </p>
                </div>
              </div>

              <div className="shrink-0 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 self-start md:self-auto">
                <CheckCircle2 size={14} />
                <span>Estimated Turnaround: {s.duration}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              {/* Deliverable Checklist */}
              <div>
                <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-primary" />
                  Key Execution Milestones
                </h5>
                <ul className="space-y-2.5">
                  {s.checklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Documents & Pro Tips */}
              <div className="space-y-6">
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                    Documents We Prepare / Assist With
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {s.documentsRequired.map((doc, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs font-semibold border border-gray-200/60 dark:border-zinc-700"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase block mb-0.5">
                      Expert Advice
                    </span>
                    <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                      {s.proTip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
