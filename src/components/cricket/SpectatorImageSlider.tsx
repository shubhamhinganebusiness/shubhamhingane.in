import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Download, ExternalLink, 
  Sparkles, Radio, Play, Pause, Image as ImageIcon 
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export interface SliderSlide {
  id: string;
  imageUrl: string;
  title?: string;
  isMatchBanner?: boolean;
  order?: number;
  isActive?: boolean;
}

interface SpectatorImageSliderProps {
  matchBannerUrl?: string | null;
  teamA?: string;
  teamB?: string;
  matchStatus?: 'live' | 'completed' | 'scheduled' | string;
  onDownloadBanner?: (url: string, teamA?: string, teamB?: string) => void;
  downloadingBanner?: boolean;
  className?: string;
}

export const SpectatorImageSlider: React.FC<SpectatorImageSliderProps> = ({
  matchBannerUrl,
  teamA = 'Team A',
  teamB = 'Team B',
  matchStatus,
  onDownloadBanner,
  downloadingBanner = false,
  className = ''
}) => {
  const [adminSlides, setAdminSlides] = useState<SliderSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = next, -1 = prev
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch real-time active slider images managed by portfolio super admin
  useEffect(() => {
    try {
      const q = query(collection(db, 'spectator_slider_images'), orderBy('order', 'asc'));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items: SliderSlide[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Only include active images
            if (data.isActive !== false && data.imageUrl) {
              items.push({
                id: doc.id,
                imageUrl: data.imageUrl,
                title: data.title || '',
                isMatchBanner: false,
                order: typeof data.order === 'number' ? data.order : 100,
                isActive: true
              });
            }
          });
          setAdminSlides(items);
        },
        (error) => {
          console.warn('Could not load spectator_slider_images:', error);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Error setting up spectator_slider_images listener:', err);
    }
  }, []);

  // 2. Merge: Match Banner is AUTOMATICALLY included whenever available
  const allSlides: SliderSlide[] = [];

  if (matchBannerUrl && matchBannerUrl.trim()) {
    allSlides.push({
      id: 'auto-match-banner',
      imageUrl: matchBannerUrl,
      title: `${teamA} vs ${teamB}`,
      isMatchBanner: true,
      order: -1
    });
  }

  // Append super admin configured slider images
  allSlides.push(...adminSlides);

  // If index is out of bounds after slide changes, adjust
  useEffect(() => {
    if (allSlides.length > 0 && currentIndex >= allSlides.length) {
      setCurrentIndex(0);
    }
  }, [allSlides.length, currentIndex]);

  // 3. Auto-play slider interval (every 5 seconds)
  const nextSlide = useCallback(() => {
    if (allSlides.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % allSlides.length);
  }, [allSlides.length]);

  const prevSlide = useCallback(() => {
    if (allSlides.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + allSlides.length) % allSlides.length);
  }, [allSlides.length]);

  useEffect(() => {
    if (isPaused || allSlides.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, allSlides.length, nextSlide]);

  // If no slides at all (no match banner and no admin images), render nothing
  if (allSlides.length === 0) {
    return null;
  }

  const currentSlide = allSlides[currentIndex] || allSlides[0];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }
    })
  };

  return (
    <div
      id="spectator-image-slider-container"
      className={`w-full rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center select-none group mb-6 transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Strict 16:9 Aspect Ratio Container */}
      <div className="w-full relative aspect-[16/9] max-h-[580px] overflow-hidden flex items-center justify-center">
        {/* Ambient Blurred Dynamic Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 w-full h-full bg-cover bg-center blur-2xl opacity-40 scale-110 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url(${currentSlide.imageUrl})` }}
        />

        {/* Foreground Animated Slide */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentSlide.id || currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full h-full flex items-center justify-center p-1 sm:p-2.5 z-10"
          >
            {/* The Image itself with uncropped 16:9 containment */}
            <img
              src={currentSlide.imageUrl}
              alt={currentSlide.title || 'Spectator Slide'}
              className="w-full h-full object-contain rounded-xl sm:rounded-2xl transition-transform duration-300"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        {/* Top Badges & Actions Overlay */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          {/* Left badges: Aspect ratio, slide index & banner indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono font-black text-amber-300 border border-white/10 uppercase tracking-widest shadow-md">
              16:9 HD
            </span>

            {currentSlide.isMatchBanner ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md backdrop-blur-md">
                🏏 Match Banner (Auto)
              </span>
            ) : (
              currentSlide.title && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/80 text-white text-[9px] font-bold uppercase tracking-wider hidden sm:inline-flex shadow-md backdrop-blur-md">
                  Official Sponsor / Event
                </span>
              )
            )}

            {allSlides.length > 1 && (
              <span className="px-2.5 py-1 rounded-full bg-black/70 text-slate-200 text-[9px] font-mono font-bold tracking-wider backdrop-blur-md border border-white/10">
                {currentIndex + 1} / {allSlides.length}
              </span>
            )}
          </div>

          {/* Right badges: Live indicator & download button */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {currentSlide.isMatchBanner && matchStatus === 'live' && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                LIVE
              </span>
            )}

            {currentSlide.isMatchBanner && onDownloadBanner && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadBanner(currentSlide.imageUrl, teamA, teamB);
                }}
                id="btn-download-slider-banner"
                className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white font-bold text-[10px] tracking-wider uppercase border border-white/25 hover:border-amber-400/80 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md active:scale-95"
                title="Download full match banner image"
              >
                {downloadingBanner ? (
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download size={12} className="text-amber-300" />
                )}
                <span>{downloadingBanner ? 'Saving...' : 'Download Banner'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Slide Info Overlay (if slide has title) */}
        {currentSlide.title && (
          <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent pt-10 pb-4 px-4 sm:px-6">
            <div className="max-w-xl">
              <h4 className="text-white text-sm sm:text-base font-black tracking-tight drop-shadow-md">
                {currentSlide.title}
              </h4>
            </div>
          </div>
        )}

        {/* Navigation Arrows (visible if more than 1 slide) */}
        {allSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous slide"
              id="btn-slider-prev"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-90 cursor-pointer shadow-xl"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next slide"
              id="btn-slider-next"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/20 transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-90 cursor-pointer shadow-xl"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Bottom Pagination Dots */}
        {allSlides.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 z-30 flex items-center justify-center gap-1.5 pointer-events-auto">
            {allSlides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id || idx}
                  type="button"
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1);
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 border-none cursor-pointer ${
                    isActive
                      ? 'w-6 bg-amber-400 shadow-md shadow-amber-400/50'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
