import React, { useState } from 'react';
import { X, Sparkles, Sliders, Upload, UserPlus, FileBox } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WizardIntroProps {
  onClose: () => void;
}

export const WizardIntro: React.FC<WizardIntroProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Craft and Brand',
      icon: Sliders,
      color: 'bg-blue-500',
      description: 'Choose from different prebuilt layout templates: Modern, Classic, Minimal, or Corporate. Configure custom background colors and grid guidelines overlay.'
    },
    {
      title: 'Upload Official Credentials',
      icon: Upload,
      color: 'bg-emerald-500',
      description: "Drop in your school Logo, administrative signatory's Signature, and Holder photographs with dynamic file loader features."
    },
    {
      title: 'Holders & Bulk Uploads',
      icon: UserPlus,
      color: 'bg-purple-500',
      description: 'Fill details manually in design tab, or click the "Bulk Generation" tab to map CSV / Excel spreadsheet columns instantly into multiple card variables!'
    },
    {
      title: 'Pristine Vector Exports',
      icon: FileBox,
      color: 'bg-amber-500',
      description: 'Download layouts as ultra-crisp 300 DPI high-res PNGs, single print-ready PDFs, or export bulk sheets as fully folded dual-sided multi-page A4 PDF documents.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-999 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full transition-all cursor-pointer"
        >
          <X size={15} />
        </button>

        {/* Content Section */}
        <div className="p-8 md:p-10 space-y-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl animate-bounce">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase text-slate-900 dark:text-white tracking-widest">
                ZenID Studio Guide
              </h1>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-0.5">
                Make professional ID cards in 4 steps
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;

              return (
                <div
                  key={step.title}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex flex-col md:flex-row items-center md:items-start gap-4 p-4 rounded-3xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-50/80 dark:bg-slate-800/40 border-blue-500/30 shadow-sm'
                      : 'border-transparent hover:bg-slate-50/40 dark:hover:bg-slate-800/10'
                  }`}
                >
                  <div className={`p-2.5 text-white rounded-xl ${step.color} shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 flex items-center justify-center md:justify-start gap-2">
                      {idx + 1}. {step.title}
                      {isActive && (
                        <span className="text-[9px] bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-350 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                          Selected
                        </span>
                      )}
                    </h3>
                    <p className={`text-[11px] leading-relaxed ${isActive ? 'text-slate-650 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex gap-1.5 justify-center">
              {steps.map((_, dotIdx) => (
                <span
                  key={dotIdx}
                  onClick={() => setCurrentStep(dotIdx)}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                    dotIdx === currentStep ? 'bg-blue-600 w-5' : 'bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md transition-all transform active:scale-95 cursor-pointer"
            >
              Start Generating
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
