import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  Gift, 
  Award,
  Star
} from 'lucide-react';
import { 
  TournamentPrize, 
  getTournamentPrizes, 
  subscribeToTournamentPrizes, 
  getValidActivePrizes,
  SAMPLE_DEMO_PRIZES
} from '../../utils/cricketPrizeStorage';
import { BroadcastLayout } from './CricketOverlay';

export interface ContinuousPrizeMoneyBannerProps {
  matchId?: string;
  prizes?: TournamentPrize[];
  layout?: BroadcastLayout;
  position?: 'top-full' | 'bottom-full' | string;
  className?: string;
  onOpenManageModal?: () => void;
}

export const ContinuousPrizeMoneyBanner: React.FC<ContinuousPrizeMoneyBannerProps> = ({
  matchId,
  prizes: propPrizes,
  layout = 'slanted-pro-design',
  position = 'bottom-full',
  className = '',
  onOpenManageModal,
}) => {
  const [internalPrizes, setInternalPrizes] = useState<TournamentPrize[]>(() => {
    if (propPrizes && propPrizes.length > 0) return propPrizes;
    return getTournamentPrizes(matchId);
  });
  const [activePrizeIndex, setActivePrizeIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Detect preview mode (e.g. #/live/cricket-overlay?preview=true or in scoreboard preview iframe)
  const isPreview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    return url.includes('preview=true') || url.includes('mode=preview') || Boolean((window as any).__cricket_preview_mode);
  }, []);

  // Sync prop changes and subscribe to real-time events / BroadcastChannel / Firestore
  useEffect(() => {
    if (propPrizes && propPrizes.length > 0) {
      setInternalPrizes(propPrizes);
    } else {
      setInternalPrizes(getTournamentPrizes(matchId));
    }

    // Always keep real-time subscription active across tabs and iframes
    const unsub = subscribeToTournamentPrizes((updated) => {
      setInternalPrizes(updated);
    }, matchId);

    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    if (propPrizes && propPrizes.length > 0) {
      setInternalPrizes(propPrizes);
    }
  }, [propPrizes]);

  // Determine active prizes:
  // 1. Check valid prizes from props
  // 2. Check valid prizes from internal/storage/firestore
  // 3. In preview mode, fallback to demo prizes so the user can verify the strip above scorebug
  // 4. In live broadcast, if score manager has not added details, it will NOT show
  const activePrizes = useMemo(() => {
    if (propPrizes && propPrizes.length > 0) {
      const validProp = getValidActivePrizes(propPrizes);
      if (validProp.length > 0) return validProp;
    }
    if (internalPrizes && internalPrizes.length > 0) {
      const validInternal = getValidActivePrizes(internalPrizes);
      if (validInternal.length > 0) return validInternal;
    }
    const directStored = getTournamentPrizes(matchId);
    const validDirect = getValidActivePrizes(directStored);
    if (validDirect.length > 0) return validDirect;

    // In preview mode: show demo prizes so score manager can always see the strip in the preview page
    if (isPreview) {
      return SAMPLE_DEMO_PRIZES;
    }

    // Live mode with no details entered: will not show
    return [];
  }, [propPrizes, internalPrizes, matchId, isPreview]);

  const hasCustomPrizes = useMemo(() => {
    return (
      (propPrizes && getValidActivePrizes(propPrizes).length > 0) ||
      (internalPrizes && getValidActivePrizes(internalPrizes).length > 0) ||
      getValidActivePrizes(getTournamentPrizes(matchId)).length > 0
    );
  }, [propPrizes, internalPrizes, matchId]);

  // Continuous auto-rotation every 4.5 seconds
  useEffect(() => {
    if (isPaused || activePrizes.length <= 1) return;
    const interval = setInterval(() => {
      setActivePrizeIndex((prev) => (prev + 1) % activePrizes.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, activePrizes.length]);

  // If score manager has not added details, render NOTHING
  if (activePrizes.length === 0) {
    return null;
  }

  const safeIndex = activePrizeIndex % activePrizes.length;
  const currentPrize = activePrizes[safeIndex] || activePrizes[0];

  // Dynamic positioning cleanly ABOVE the scorebug based on active layout and bug position
  const isTop = position === 'top-full';
  let positionClasses = '';

  if (isTop) {
    if (layout === 'star-tv-broadcast') {
      positionClasses = 'top-[96px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'slanted-pro-design') {
      positionClasses = 'top-[168px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'ribbon-full' || layout === 'single-line') {
      positionClasses = 'top-[122px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'score-bug-1900-200') {
      positionClasses = 'top-[170px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'minimal-pill') {
      positionClasses = 'top-[108px] left-1/2 -translate-x-1/2 w-[980px] max-w-[95%]';
    } else {
      positionClasses = 'top-[120px] left-1/2 -translate-x-1/2 w-[1200px] max-w-[95%]';
    }
  } else {
    // Scorebug is at the bottom of the screen: position sits cleanly ABOVE it with generous clearance
    if (layout === 'star-tv-broadcast') {
      positionClasses = 'bottom-[88px] sm:bottom-[96px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'slanted-pro-design') {
      positionClasses = 'bottom-[168px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'ribbon-full' || layout === 'single-line') {
      positionClasses = 'bottom-[122px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'score-bug-1900-200') {
      positionClasses = 'bottom-[170px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'minimal-pill') {
      positionClasses = 'bottom-[108px] left-1/2 -translate-x-1/2 w-[980px] max-w-[95%]';
    } else if (layout === 'docked-corner') {
      positionClasses = 'bottom-[356px] left-16 w-[520px] max-w-[90%]';
    } else if (layout === 'mobile-vertical') {
      positionClasses = 'bottom-[380px] left-6 w-[420px] max-w-[90%]';
    } else {
      positionClasses = 'bottom-[122px] left-1/2 -translate-x-1/2 w-[1200px] max-w-[96%]';
    }
  }

  const getAwardIcon = (category: string) => {
    switch (category) {
      case 'best_batsman':
        return <Award size={13} className="text-amber-400" />;
      case 'best_bowler':
        return <Medal size={13} className="text-amber-400" />;
      case 'man_of_series':
        return <Crown size={13} className="text-yellow-400 animate-pulse" />;
      case 'fourth_prize':
        return <Trophy size={13} className="text-amber-300" />;
      default:
        return <Sparkles size={13} className="text-yellow-400" />;
    }
  };

  return (
    <div
      id="continuous-above-scorebug-prize-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`absolute ${positionClasses} z-50 select-none font-sans transition-all duration-300 pointer-events-auto ${className}`}
    >
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 border-t-2 border-b border-amber-400/80 py-1.5 px-3 sm:px-6 shadow-2xl backdrop-blur-2xl rounded-xl flex items-center justify-between gap-2.5">
        {/* Ambient Golden Glow Accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-yellow-400/10 to-amber-500/15 pointer-events-none" />

        {/* 1. LEFT: Award Category Live Badge */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border border-amber-400/50 text-amber-300 shadow-sm">
            {getAwardIcon(currentPrize.category)}
            <span className="text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider">
              {currentPrize.title || 'TOURNAMENT AWARD'}
            </span>
          </div>

          {isPreview && !hasCustomPrizes && (
            <span className="hidden sm:inline-block text-[8px] font-mono font-black uppercase tracking-widest text-amber-300/80 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
              PREVIEW
            </span>
          )}
        </div>

        {/* 2. CENTER: Sponsor Person Photo, Name, and Designation */}
        <div className="flex-1 mx-2 overflow-hidden flex items-center justify-center text-center z-10 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPrize.id}-${safeIndex}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap max-w-full"
            >
              {/* Sponsor Photo Frame */}
              {currentPrize.personPhoto ? (
                <img
                  src={currentPrize.personPhoto}
                  alt={currentPrize.personName || 'Sponsor'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-amber-400 shadow-md shrink-0 ring-1 ring-amber-300/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/25 border-2 border-amber-400/60 text-amber-300 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  <Trophy size={14} className="text-amber-300" />
                </div>
              )}

              {/* Sponsor Details Text */}
              <div className="text-left flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight min-w-0">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0">
                  {currentPrize.tagline || 'PRIZE GIVEN BY'}:
                </span>
                <div className="flex items-center gap-1.5 truncate">
                  <strong className="text-xs sm:text-sm font-black uppercase tracking-wide text-white drop-shadow-sm truncate">
                    {currentPrize.personName || 'Tournament Patron'}
                  </strong>
                  {currentPrize.personDesignation && (
                    <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-amber-300/90 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30 truncate">
                      {currentPrize.personDesignation}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. RIGHT: Cash Amount Badge & Carousel Navigation */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {/* Glowing Cash Pill */}
          <div className="px-2.5 sm:px-3.5 py-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 text-slate-950 font-black rounded-lg sm:rounded-xl text-[11px] sm:text-xs tracking-tight shadow-md flex items-center gap-1">
            <span className="font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-900/80">CASH:</span>
            <span className="font-mono font-black text-xs sm:text-sm">
              {currentPrize.currency || '₹'} {currentPrize.amount || '0'}
            </span>
          </div>

          {/* Quick Pagination Controls if > 1 Prize */}
          {activePrizes.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActivePrizeIndex((prev) => (prev - 1 + activePrizes.length) % activePrizes.length)}
                className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer border-none"
                title="Previous Award"
              >
                <ChevronLeft size={12} />
              </button>
              <div className="hidden md:flex items-center gap-1">
                {activePrizes.map((p, i) => (
                  <button
                    key={p.id || i}
                    type="button"
                    onClick={() => setActivePrizeIndex(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer border-none ${
                      safeIndex === i ? 'bg-amber-400 w-3.5' : 'bg-white/25 hover:bg-white/40 w-1.5'
                    }`}
                    title={p.title}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActivePrizeIndex((prev) => (prev + 1) % activePrizes.length)}
                className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer border-none"
                title="Next Award"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
