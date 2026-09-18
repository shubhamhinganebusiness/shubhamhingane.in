import React from 'react';
import { 
  Trophy, ShieldCheck, Zap, Globe, Cpu, 
  Sparkles, CheckCircle2, Server, Star, Layers
} from 'lucide-react';

interface MarqueeItem {
  id: string;
  icon: any;
  label: string;
  metric: string;
  accent: string;
}

export const HeroTrustMarquee: React.FC = () => {
  const marqueeItems: MarqueeItem[] = [
    {
      id: 'm1',
      icon: Trophy,
      label: 'GullyScore Spectator Reads',
      metric: '100,000+ Served',
      accent: 'text-amber-500'
    },
    {
      id: 'm2',
      icon: ShieldCheck,
      label: 'Production Systems Deployed',
      metric: '50+ Apps Live',
      accent: 'text-emerald-500'
    },
    {
      id: 'm3',
      icon: Server,
      label: 'Cloud Run & Edge Uptime',
      metric: '99.9% Guaranteed',
      accent: 'text-sky-500'
    },
    {
      id: 'm4',
      icon: Zap,
      label: 'Edge Cache Response Time',
      metric: '< 150ms Latency',
      accent: 'text-purple-500'
    },
    {
      id: 'm5',
      icon: Layers,
      label: 'Offline Engine Architecture',
      metric: 'Zero Data Loss',
      accent: 'text-teal-500'
    },
    {
      id: 'm6',
      icon: Globe,
      label: 'Regional Impact in Maharashtra',
      metric: '12+ Districts Digitized',
      accent: 'text-indigo-500'
    },
    {
      id: 'm7',
      icon: Cpu,
      label: 'Core Technology Stack',
      metric: 'React 19 • TypeScript • Firebase',
      accent: 'text-rose-500'
    }
  ];

  // Double the list for seamless continuous infinite scroll
  const fullList = [...marqueeItems, ...marqueeItems];

  return (
    <div className="w-full mt-6 pt-4 pb-2 border-t border-gray-200/50 dark:border-zinc-800/80 overflow-hidden relative group select-none">
      {/* Left and Right fade gradients for seamless look */}
      <div className="absolute left-0 inset-y-0 w-12 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-12 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee hover:[animation-play-state:paused] gap-4 sm:gap-6">
        {fullList.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={`${item.id}-${index}`}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-50/80 dark:bg-zinc-900/80 border border-slate-200/70 dark:border-zinc-800/80 backdrop-blur-xs text-xs shadow-xs"
            >
              <div className={`p-1 rounded-full bg-slate-200/60 dark:bg-zinc-800 ${item.accent}`}>
                <Icon size={13} />
              </div>
              <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-[11px] whitespace-nowrap">
                {item.metric}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium whitespace-nowrap hidden sm:inline">
                • {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
