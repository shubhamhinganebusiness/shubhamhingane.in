import React from 'react';
import { ShieldCheck, Lock, DollarSign, Code2 } from 'lucide-react';

export const ContactTrustBadges: React.FC = () => {
  const assurances = [
    {
      icon: Lock,
      title: '100% NDA Protected',
      desc: 'Mutual NDA signed prior to discussing proprietary architecture or ideas.'
    },
    {
      icon: Code2,
      title: 'Full IP & Code Ownership',
      desc: 'You own 100% of all repositories, production builds, and design assets.'
    },
    {
      icon: DollarSign,
      title: 'Milestone-Based Billing',
      desc: 'Deliverable-anchored payments with zero surprise charges or vendor lock-in.'
    },
    {
      icon: ShieldCheck,
      title: 'Direct Engineer Access',
      desc: 'No junior middlemen—work directly with Senior Engineer Shubham.'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-gray-200/80 dark:border-zinc-800">
      {assurances.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-3.5 rounded-2xl bg-surface/50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/80"
          >
            <div className="flex items-center gap-2 mb-1 text-primary">
              <Icon size={16} />
              <h5 className="text-xs font-bold text-main-text">{item.title}</h5>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
              {item.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};
