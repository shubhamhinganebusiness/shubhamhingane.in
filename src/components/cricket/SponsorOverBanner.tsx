import React, { useState, useEffect } from 'react';
import { Sparkles, Phone, ExternalLink } from 'lucide-react';
import { LocalCricketSponsor, getLocalSponsors, subscribeToSponsors } from '../../utils/cricketSponsorsStorage';

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
    // Initial local load
    const loadFromLocal = () => {
      const list = getLocalSponsors().filter(
        (s) => s.isActive && (s.displayOnOverBreakdown || s.category === 'all')
      );
      setSponsors(list);
    };
    loadFromLocal();

    // Listen to in-tab custom events
    const handleUpdate = (e?: Event) => {
      const detailSponsors = (e as CustomEvent)?.detail?.sponsors;
      if (Array.isArray(detailSponsors)) {
        const filtered = detailSponsors.filter(
          (s: LocalCricketSponsor) => s.isActive && (s.displayOnOverBreakdown || s.category === 'all')
        );
        setSponsors(filtered);
      } else {
        loadFromLocal();
      }
    };

    // Cross-tab storage listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gullyscore_local_sponsors_registry') {
        loadFromLocal();
      }
    };

    window.addEventListener('cricket_sponsors_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    // Cross-device Firestore real-time listener
    const unsub = subscribeToSponsors((all) => {
      const filtered = all.filter(
        (s) => s.isActive && (s.displayOnOverBreakdown || s.category === 'all')
      );
      setSponsors(filtered);
    });

    return () => {
      window.removeEventListener('cricket_sponsors_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
      unsub();
    };
  }, []);

  if (sponsors.length === 0) return null;

  // Pick sponsor deterministically based on over number or cycle
  const sponsorIndex = overNumber !== undefined ? (overNumber % sponsors.length) : 0;
  const sponsor = sponsors[sponsorIndex] || sponsors[0];

  if (!sponsor) return null;

  const displayImage = sponsor.bannerUrl || sponsor.logoUrl;

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

  if (variant === 'expanded' && sponsor.bannerUrl) {
    return (
      <div className={`rounded-2xl overflow-hidden border border-amber-300/60 dark:border-amber-700/40 relative group ${className}`}>
        <img
          src={sponsor.bannerUrl}
          alt={sponsor.name}
          className="w-full h-28 sm:h-36 object-cover"
          onError={(e) => {
            (e.target as any).src = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-3.5 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={sponsor.logoUrl}
                alt={sponsor.name}
                className="w-8 h-8 rounded-lg object-cover border border-white/20 shrink-0"
                onError={(e) => {
                  (e.target as any).src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80';
                }}
              />
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
                  {overNumber !== undefined ? `Over ${overNumber} Powered by` : 'Official Partner'}:
                </span>
                <h5 className="font-black text-sm text-white truncate drop-shadow-sm">
                  {sponsor.name}
                </h5>
                {sponsor.tagline && (
                  <p className="text-[10.5px] text-white/90 truncate font-medium">
                    {sponsor.tagline}
                  </p>
                )}
              </div>
            </div>

            {sponsor.phone && (
              <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-black/40 backdrop-blur-xs text-amber-300 border border-amber-400/30 shrink-0">
                {sponsor.phone}
              </span>
            )}
          </div>
        </div>
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
