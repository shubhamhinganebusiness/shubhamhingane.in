import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Image as ImageIcon, Megaphone, 
  Sparkles, Radio, Trophy, ExternalLink 
} from 'lucide-react';
import { MatchState } from '../../types/cricket';
import { SponsorAdSlide } from './useSpectatorSliderImages';
import { CricketMatchBanner } from './CricketImageFallback';

export interface ActiveLiveBannerSlide {
  id: string;
  imageUrl: string;
  title: string;
  isMatchBanner: boolean;
  tag: string;
  folder?: string;
}

interface ActiveLiveMatchBannerSliderProps {
  match: MatchState;
  adminAds?: SponsorAdSlide[];
  mode?: 'hero' | 'card' | 'compact';
  onSelectMatch?: (matchId: string) => void;
  className?: string;
}

export const ActiveLiveMatchBannerSlider: React.FC<ActiveLiveMatchBannerSliderProps> = ({
  match: m,
  adminAds = [],
  mode = 'card',
  onSelectMatch,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const hasCustomMatchBanner = Boolean(m.matchBannerUrl && m.matchBannerUrl.trim());

  // Build composite slide deck: Match Banner + Super Admin Advertisement Images
  const slides = useMemo<ActiveLiveBannerSlide[]>(() => {
    const list: ActiveLiveBannerSlide[] = [];

    // 1. If match has an official banner, it takes pride of place as Slide 1
    if (hasCustomMatchBanner) {
      list.push({
        id: `match-banner-${m.id}`,
        imageUrl: m.matchBannerUrl!.trim(),
        title: `${m.teamA} vs ${m.teamB}`,
        isMatchBanner: true,
        tag: 'Match Banner'
      });
    }

    // 2. Append all Super Admin configured advertisement images
    if (adminAds && adminAds.length > 0) {
      adminAds.forEach((ad, idx) => {
        list.push({
          id: ad.id || `ad-${idx}`,
          imageUrl: ad.imageUrl,
          title: ad.title || 'Official Sponsor',
          isMatchBanner: false,
          tag: 'Sponsor Ad',
          folder: ad.folder
        });
      });
    }

    // 3. If neither match banner nor admin ads exist, fallback to authentic tournament banner
    if (list.length === 0) {
      list.push({
        id: `default-banner-${m.id}`,
        imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1280&auto=format&fit=crop&q=80',
        title: `${m.teamA} vs ${m.teamB}`,
        isMatchBanner: true,
        tag: 'Live Match'
      });
    }

    return list;
  }, [hasCustomMatchBanner, m.matchBannerUrl, m.id, m.teamA, m.teamB, adminAds]);

  // Ensure index stays in bounds if slides change dynamically
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-rotation every 4.5 seconds per slide
  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const currentSlide = slides[currentIndex] || slides[0];
  const hasError = imgErrorMap[currentSlide.id];
  const fallbackImg = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1280&auto=format&fit=crop&q=80';
  const displayImageUrl = hasError ? fallbackImg : currentSlide.imageUrl;

  const isHero = mode === 'hero';
  const isCompact = mode === 'compact';

  return (
    <div
      id={`active-live-match-slider-${m.id}`}
      className={`relative group/banner select-none overflow-hidden aspect-[16/9] w-full bg-slate-950 border border-slate-800 shadow-xl transition-all duration-300 ${
        isHero 
          ? 'rounded-2xl sm:rounded-3xl max-h-[460px]' 
          : isCompact 
          ? 'rounded-xl max-h-[220px]' 
          : 'rounded-xl sm:rounded-2xl'
      } ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. Dynamic Ambient Blurred Backdrop: Prevents black bars and ensures premium visual richness */}
      <img
        src={displayImageUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none transition-all duration-700"
      />

      {/* 2. Strict 16:9 Uncropped Visual Display: object-contain guarantees 100% visibility of match banners & sponsor logos */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentSlide.id || currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative z-10 w-full h-full flex items-center justify-center"
        >
          <img
            src={displayImageUrl}
            alt={currentSlide.title}
            onError={() => setImgErrorMap((prev) => ({ ...prev, [currentSlide.id]: true }))}
            className="w-full h-full object-contain transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </motion.div>
      </AnimatePresence>

      {/* 3. Subtle Vignette Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/40 pointer-events-none" />

      {/* 4. Top Badges Row: Live Tag, Match Banner / Sponsor Ad Identifier, & Slide Counter */}
      <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-3 sm:right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Live Indicator Badge */}
          <span className="px-2 py-0.5 rounded-full bg-rose-600/90 text-white font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </span>

          {/* Banner vs Sponsor Ad Badge */}
          {currentSlide.isMatchBanner ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/85 backdrop-blur-md text-[8px] sm:text-[8.5px] font-mono font-black text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <ImageIcon size={9} className="text-emerald-400" />
              {currentSlide.tag}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/90 backdrop-blur-md text-[8px] sm:text-[8.5px] font-mono font-black text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
              <Megaphone size={9} className="text-amber-400" />
              {currentSlide.tag}
            </span>
          )}

          {/* Ad / Sponsor Title Pill */}
          {!currentSlide.isMatchBanner && currentSlide.title && (
            <span className="px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-md text-[8px] sm:text-[8.5px] font-bold text-slate-200 border border-white/10 uppercase tracking-wider truncate max-w-[130px] sm:max-w-[200px] shadow-sm hidden xs:inline-block">
              {currentSlide.title}
            </span>
          )}
        </div>

        {/* Slide Counter (e.g., 1 / 4) */}
        {slides.length > 1 && (
          <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[8px] sm:text-[8.5px] font-mono font-bold text-slate-200 border border-white/15 tracking-wider shadow-sm">
            {currentIndex + 1} / {slides.length}
          </span>
        )}
      </div>

      {/* 5. Hero Mode Overlay Details (Tournament, Matchup, and CTA button) */}
      {isHero && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-12 pb-3.5 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pointer-events-none">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Trophy size={11} /> {m.tournamentName || 'Live Cricket Series'}
              </span>
              {m.groundName && (
                <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                  • 📍 {m.groundName}
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight drop-shadow-md">
              {m.teamA} vs {m.teamB}
            </h3>
          </div>

          {onSelectMatch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMatch(m.id);
              }}
              className="pointer-events-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-lg shadow-emerald-950/40 active:scale-95 shrink-0"
            >
              Watch Live Scorecard →
            </button>
          )}
        </div>
      )}

      {/* 6. Card Mode Bottom Aspect Badge */}
      {!isHero && (
        <div className="absolute bottom-1.5 left-2 z-20 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[7.5px] font-mono font-bold text-amber-300 border border-white/10 uppercase tracking-widest">
            {currentSlide.isMatchBanner ? '1280 × 720' : 'Sponsor HD'}
          </span>
        </div>
      )}

      {/* 7. Interactive Prev & Next Arrows (visible on hover or always on touch devices) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover/banner:opacity-100 transition-all border border-white/20 cursor-pointer shadow-lg active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-30 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover/banner:opacity-100 transition-all border border-white/20 cursor-pointer shadow-lg active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}

      {/* 8. Pagination Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-1.5 sm:bottom-2 inset-x-0 z-25 flex items-center justify-center gap-1.5 pointer-events-auto">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 border-none cursor-pointer ${
                  isActive
                    ? 'w-4 sm:w-5 bg-amber-400 shadow-md shadow-amber-400/50'
                    : 'w-1.5 bg-white/40 hover:bg-white/75'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
