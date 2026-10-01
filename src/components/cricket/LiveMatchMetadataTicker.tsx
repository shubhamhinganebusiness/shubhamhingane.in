import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface MatchMetadataTickerProps {
  match: {
    id?: string;
    tossWinner?: string | null;
    tossChoice?: 'bat' | 'bowl' | string | null;
    tournamentId?: string | null;
    tournamentName?: string | null;
    seriesName?: string | null;
    groundName?: string | null;
    venue?: string | null;
    ground?: string | null;
    umpire1Name?: string | null;
    umpire2Name?: string | null;
    commentatorName?: string | null;
    scoreboardManagerName?: string | null;
    [key: string]: any;
  };
  className?: string;
  intervalMs?: number;
  variant?: 'card' | 'hero' | 'banner';
}

interface TickerSlide {
  id: string;
  category: string;
  icon: string;
  badgeClass: string;
  text: string;
  fullTitle?: string;
}

export const LiveMatchMetadataTicker: React.FC<MatchMetadataTickerProps> = ({
  match: m,
  className = '',
  intervalMs = 3400,
  variant = 'card'
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Intelligently resolve officials & venue from match with tournament/localStorage fallbacks
  const { u1, u2, comm, scorer, ground, series } = useMemo(() => {
    let resolvedU1 = m.umpire1Name?.trim() || '';
    let resolvedU2 = m.umpire2Name?.trim() || '';
    let resolvedComm = m.commentatorName?.trim() || '';
    let resolvedScorer = m.scoreboardManagerName?.trim() || '';
    let resolvedGround = m.groundName?.trim() || m.venue?.trim() || m.ground?.trim() || '';
    const resolvedSeries = m.seriesName?.trim() || m.tournamentName?.trim() || '';

    // If any official or ground is missing, look up active match / tournament storage cache
    if (typeof window !== 'undefined' && (!resolvedGround || (m.tournamentId && (!resolvedU1 || !resolvedU2 || !resolvedComm || !resolvedScorer)))) {
      try {
        if (!resolvedGround && m.id) {
          const rawActive = localStorage.getItem('cricket_active_match');
          if (rawActive) {
            const parsedAct = JSON.parse(rawActive);
            if (parsedAct && parsedAct.id === m.id) {
              resolvedGround = (parsedAct.groundName || parsedAct.venue || parsedAct.ground || '').trim();
            }
          }
        }
        if (!resolvedGround) {
          const savedLastGround = localStorage.getItem('gully_last_ground_name');
          if (savedLastGround && savedLastGround.trim()) {
            resolvedGround = savedLastGround.trim();
          }
        }

        if (m.tournamentId) {
          // 1. Check one-half tournament cache
          const rawOneHalf = localStorage.getItem('gully_one_half_tournament_v1');
          if (rawOneHalf) {
            const parsed = JSON.parse(rawOneHalf);
            if (parsed && (parsed.id === m.tournamentId || m.tournamentId.includes('one_half') || m.tournamentId.includes('one-half'))) {
              if (!resolvedU1 && parsed.umpire1Name) resolvedU1 = parsed.umpire1Name.trim();
              if (!resolvedU2 && parsed.umpire2Name) resolvedU2 = parsed.umpire2Name.trim();
              if (!resolvedComm && parsed.commentatorName) resolvedComm = parsed.commentatorName.trim();
              if (!resolvedScorer && parsed.scoreboardManagerName) resolvedScorer = parsed.scoreboardManagerName.trim();
              if (!resolvedGround && (parsed.groundName || parsed.venue)) resolvedGround = (parsed.groundName || parsed.venue).trim();
            }
          }

          // 2. Check general tournament registry
          const rawTours = localStorage.getItem('gully_tournaments_v1');
          if (rawTours) {
            const tours = JSON.parse(rawTours);
            if (Array.isArray(tours)) {
              const found = tours.find((t: any) => t.id === m.tournamentId);
              if (found) {
                if (!resolvedU1 && found.umpire1Name) resolvedU1 = found.umpire1Name.trim();
                if (!resolvedU2 && found.umpire2Name) resolvedU2 = found.umpire2Name.trim();
                if (!resolvedComm && found.commentatorName) resolvedComm = found.commentatorName.trim();
                if (!resolvedScorer && found.scoreboardManagerName) resolvedScorer = found.scoreboardManagerName.trim();
                if (!resolvedGround && (found.groundName || found.venue)) resolvedGround = (found.groundName || found.venue).trim();
              }
            }
          }

          // 3. Check saved officials array
          const rawOff = localStorage.getItem(`gully_officials_${m.tournamentId}`);
          if (rawOff) {
            const parsedOff = JSON.parse(rawOff);
            if (Array.isArray(parsedOff)) {
              const onField = parsedOff.find((o: any) => o.role === 'On-Field Umpire');
              const leg = parsedOff.find((o: any) => o.role === 'Leg Umpire');
              const sc = parsedOff.find((o: any) => o.role === 'Official Scorer');
              const cm = parsedOff.find((o: any) => o.role === 'Commentator' || o.role === 'Live Commentator');
              if (!resolvedU1 && onField?.name) resolvedU1 = onField.name.trim();
              if (!resolvedU2 && leg?.name) resolvedU2 = leg.name.trim();
              if (!resolvedScorer && sc?.name) resolvedScorer = sc.name.trim();
              if (!resolvedComm && cm?.name) resolvedComm = cm.name.trim();
            }
          }
        }
      } catch (_) {}
    }

    return {
      u1: resolvedU1,
      u2: resolvedU2,
      comm: resolvedComm,
      scorer: resolvedScorer,
      ground: resolvedGround,
      series: resolvedSeries
    };
  }, [
    m.id,
    m.umpire1Name,
    m.umpire2Name,
    m.commentatorName,
    m.scoreboardManagerName,
    m.groundName,
    m.venue,
    m.ground,
    m.seriesName,
    m.tournamentName,
    m.tournamentId
  ]);

  // Construct dynamic slides array based on user's required fields
  const slides = useMemo<TickerSlide[]>(() => {
    const list: TickerSlide[] = [];

    // 1. Toss Details
    const tossStr = m.tossWinner
      ? `${m.tossWinner} won toss & elected to ${m.tossChoice === 'bat' ? 'Bat first 🏏' : 'Bowl first 🥎'}`
      : 'Toss: Scheduled / Awaiting decision';

    list.push({
      id: 'toss',
      category: 'Toss',
      icon: '🪙',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      text: tossStr,
      fullTitle: `Toss Decision: ${tossStr}`
    });

    // 2. Series / Tournament Name
    const tournamentTitle = m.tournamentName?.trim();
    const seriesTitle = series || tournamentTitle || 'Gully Championship';
    const seriesDisplay = (tournamentTitle && m.seriesName && tournamentTitle !== m.seriesName)
      ? `${tournamentTitle} • ${m.seriesName}`
      : seriesTitle;

    list.push({
      id: 'series',
      category: 'Series',
      icon: '🏆',
      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      text: seriesDisplay,
      fullTitle: `Series & Tournament: ${seriesDisplay}`
    });

    // 3. Ground / Venue Details
    const groundDisplay = ground || 'Shivaji Maharaj Ground (Turf)';
    list.push({
      id: 'ground',
      category: 'Venue',
      icon: '📍',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      text: groundDisplay,
      fullTitle: `Playing Venue: ${groundDisplay}`
    });

    // 4. Both Umpires
    if (u1 && u2) {
      list.push({
        id: 'umpires',
        category: 'Umpires',
        icon: '⚖️',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        text: `${u1} (Main) & ${u2} (Leg)`,
        fullTitle: `Match Umpires: ${u1} & ${u2}`
      });
    } else if (u1 || u2) {
      list.push({
        id: 'umpires',
        category: 'Umpire',
        icon: '⚖️',
        badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        text: u1 || u2,
        fullTitle: `Match Umpire: ${u1 || u2}`
      });
    }

    // 5. Commentator Name
    if (comm) {
      list.push({
        id: 'commentator',
        category: 'Commentary',
        icon: '🎙️',
        badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        text: comm,
        fullTitle: `Live Commentator: ${comm}`
      });
    }

    // 6. Scoreboard Manager / Official Scorer
    if (scorer) {
      list.push({
        id: 'scorer',
        category: 'Scorer',
        icon: '📊',
        badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
        text: `${scorer} (Manager)`,
        fullTitle: `Official Scorer & Manager: ${scorer}`
      });
    }

    return list;
  }, [m.tossWinner, m.tossChoice, m.tournamentName, m.seriesName, series, ground, u1, u2, comm, scorer]);

  // Keep index within range
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  // Auto-slide ticker
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isPaused, slides.length, intervalMs]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div
      className={`relative select-none h-8 sm:h-8.5 rounded-xl sm:rounded-2xl bg-slate-950/75 backdrop-blur-md border border-white/[0.08] hover:border-emerald-500/35 px-2.5 flex items-center justify-between overflow-hidden shadow-inner group/ticker transition-all ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      title="Click arrows or hover to pause details"
    >
      {/* Category Pill Badge on Left */}
      <div className="shrink-0 flex items-center gap-1.5 z-10">
        <span
          className={`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[8.5px] font-mono font-black uppercase tracking-wider flex items-center gap-1 border shadow-xs transition-colors ${currentSlide.badgeClass}`}
        >
          <span className="text-[9px]">{currentSlide.icon}</span>
          <span className="leading-none">{currentSlide.category}</span>
        </span>
      </div>

      {/* Center Sliding Animated Text */}
      <div className="flex-1 min-w-0 mx-2 overflow-hidden relative h-full flex items-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id + currentIndex}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="text-[9.5px] sm:text-[10px] text-slate-200 font-semibold truncate leading-tight w-full block text-left"
            title={currentSlide.fullTitle || currentSlide.text}
          >
            {currentSlide.text}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Controls: Slide Counter & Manual Step Arrows */}
      <div className="shrink-0 flex items-center gap-1 z-10">
        {slides.length > 1 && (
          <span className="text-[7.5px] sm:text-[8px] font-mono text-slate-500 font-bold tracking-wider">
            {currentIndex + 1}/{slides.length}
          </span>
        )}

        {slides.length > 1 && (
          <div className="flex items-center gap-0.5 opacity-60 sm:opacity-0 sm:group-hover/ticker:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous match detail"
              className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border-none bg-transparent cursor-pointer transition-colors"
            >
              <ChevronLeft size={10} />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next match detail"
              className="w-4 h-4 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 border-none bg-transparent cursor-pointer transition-colors"
            >
              <ChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Subtle bottom progress bar indicator showing rotation time */}
      {!isPaused && slides.length > 1 && (
        <motion.div
          key={`bar-${currentIndex}`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: intervalMs / 1000, ease: 'linear' }}
          className="absolute bottom-0 left-0 h-[1.5px] bg-gradient-to-r from-emerald-500/60 to-amber-500/60 pointer-events-none"
        />
      )}
    </div>
  );
};
