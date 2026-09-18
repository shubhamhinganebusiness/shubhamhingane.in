import React from 'react';
import { Layers, DollarSign, Calendar, Sparkles } from 'lucide-react';

export interface ScopeSelection {
  projectType: string;
  budgetRange: string;
  timeline: string;
}

interface ContactScopeSelectorProps {
  selection: ScopeSelection;
  onChange: (updated: ScopeSelection) => void;
}

export const ContactScopeSelector: React.FC<ContactScopeSelectorProps> = ({
  selection,
  onChange,
}) => {
  const projectTypes = [
    'Full-Stack Web App',
    'Mobile App (Android/iOS)',
    'News Media Agency Portal',
    'AI & Automation Engine',
    'Technical Architecture Consulting',
    'Other / Custom Project'
  ];

  const budgetRanges = [
    '< ₹50,000 (Starter)',
    '₹50,000 - ₹1,50,000',
    '₹1,50,000 - ₹3,50,000',
    '₹3,50,000+ (Enterprise)',
    'Hourly / Retainer'
  ];

  const timelines = [
    '< 2 Weeks (Express)',
    '1 Month',
    '2 - 3 Months',
    'Flexible / Ongoing'
  ];

  return (
    <div className="space-y-5 p-5 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800">
      {/* Project Type */}
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2.5">
          <Layers size={14} className="text-primary" />
          <span>1. Project Category / Scope</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {projectTypes.map((type) => {
            const isSelected = selection.projectType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onChange({ ...selection, projectType: type })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700 hover:border-primary/50'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2.5">
          <DollarSign size={14} className="text-emerald-500" />
          <span>2. Estimated Budget Range</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {budgetRanges.map((range) => {
            const isSelected = selection.budgetRange === range;
            return (
              <button
                key={range}
                type="button"
                onClick={() => onChange({ ...selection, budgetRange: range })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700 hover:border-emerald-500/50'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expected Timeline */}
      <div>
        <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2.5">
          <Calendar size={14} className="text-blue-500" />
          <span>3. Desired Delivery Timeline</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {timelines.map((timeline) => {
            const isSelected = selection.timeline === timeline;
            return (
              <button
                key={timeline}
                type="button"
                onClick={() => onChange({ ...selection, timeline })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700 hover:border-blue-500/50'
                }`}
              >
                {timeline}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
