import React, { useState, useEffect } from 'react';
import { Sparkles, Phone, ExternalLink } from 'lucide-react';
import { LocalCricketSponsor, getLocalSponsors } from '../../utils/cricketSponsorsStorage';

interface SponsorOverBannerProps {
  overNumber?: number;
  className?: string;
  variant?: 'compact' | 'expanded' | 'ticker';
  onManageClick?: () => void;
}

export const SponsorOverBanner: React.FC<SponsorOverBannerProps> = ({
  overNumber,
  className = '',
  variant = 'compact',
  onManageClick,
}) => {
  const [sponsors, setSponsors] = useState<LocalCricketSponsor[]>([]);

  useEffect(() => {
    const list = getLocalSponsors().filter(
      (s) => s.isActive && (s.displayOnOverBreakdown || s.category === 'all')
    );
    setSponsors(list);

    const handleUpdate = () => {
      const updated = getLocalSponsors().filter(
        (s) => s.isActive && (s.displayOnOverBreakdown || s.category === 'all')
      );
      setSponsors(updated);
    };

    window.addEventListener('cricket_sponsors_updated', handleUpdate);
    return () => window.removeEventListener('cricket_sponsors_updated', handleUpdate);
  }, []);

  if (sponsors.length === 0) return null;

  // Pick sponsor deterministically based on over number or cycle
  const sponsorIndex = overNumber !== undefined ? (overNumber % sponsors.length) : 0;
  const sponsor = sponsors[sponsorIndex] || sponsors[0];

  if (!sponsor) return null;

  if (variant === 'ticker') {
    return (
      <div className={`p-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between gap-2 select-none ${className}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white font-black text-[9px] uppercase tracking-wider shrink-0">
            Sponsor
          </span>
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="w-5 h-5 rounded-md object-cover shrink-0"
            onError={(e) => {
              (e.target as any).src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80';
            }}
          />
          <span className="font-extrabold text-slate-800 dark:text-white truncate">
            {sponsor.name}
          </span>
          {sponsor.tagline && (
            <span className="text-slate-500 dark:text-slate-400 hidden sm:inline truncate text-[11px]">
              • {sponsor.tagline}
            </span>
          )}
        </div>

        {sponsor.phone && (
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0 font-mono">
            {sponsor.phone}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-300/60 dark:border-amber-700/40 text-left relative overflow-hidden select-none ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={sponsor.logoUrl}
            alt={sponsor.name}
            className="w-10 h-10 rounded-xl object-cover border border-amber-200 dark:border-amber-800 shadow-sm shrink-0"
            onError={(e) => {
              (e.target as any).src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80';
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {overNumber !== undefined ? `Over ${overNumber} Powered by` : 'Official Tournament Sponsor'}:
              </span>
              <h5 className="font-black text-xs text-slate-900 dark:text-white truncate">
                {sponsor.name}
              </h5>
              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300">
                {sponsor.sponsorTier}
              </span>
            </div>

            {sponsor.tagline && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
                {sponsor.tagline}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {sponsor.phone && (
            <div className="text-right hidden sm:block">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Contact</span>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{sponsor.phone}</span>
            </div>
          )}
          {onManageClick && (
            <button
              type="button"
              onClick={onManageClick}
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold underline cursor-pointer"
            >
              Manage
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
