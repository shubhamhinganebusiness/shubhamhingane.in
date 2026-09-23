import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Download, 
  Send, 
  Eye, 
  EyeOff,
  Sparkles, 
  Megaphone,
  Image as ImageIcon,
  Ban,
  Unlock,
  Trash2,
  AlertCircle,
  Award
} from 'lucide-react';
import { MatchState, Innings } from './CricketScoreboard';
import { isMatchDeleted } from './cricketStorage';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { DEFAULT_PRESET_SPONSORS } from '../../utils/cricketSponsorsStorage';

interface CompletedRecordsSliderProps {
  matches: MatchState[];
  onSelectMatch: (matchId: string) => void;
  onExportPDF?: (match: MatchState) => void;
  onDownloadAward?: (match: MatchState, award?: 'potm' | 'best_batter' | 'best_bowler') => void;
  isScoreManager?: boolean;
  homepageMode?: boolean;
}

export interface SponsorAdSlide {
  id: string;
  imageUrl: string;
  title?: string;
  order?: number;
  isActive?: boolean;
  linkUrl?: string;
  link?: string;
}

const DEFAULT_STADIUM_IMAGES = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1624526261102-98fdc0c0749e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&q=80&w=800'
];

// Helper to compute Player of the Match if not explicitly provided
const getMatchPotm = (mItem: any) => {
  if (!mItem) return null;
  if (mItem.playerOfTheMatch && mItem.playerOfTheMatch.name) {
    return mItem.playerOfTheMatch;
  }
  if (mItem.manOfTheMatch && typeof mItem.manOfTheMatch === 'string' && mItem.manOfTheMatch.trim() && mItem.manOfTheMatch !== 'N/A') {
    return { name: mItem.manOfTheMatch.trim(), runs: 0, balls: 0, wickets: 0, runsConceded: 0, points: 50 };
  }
  const statsMap: { [key: string]: { name: string; runs: number; balls: number; wickets: number; runsConceded: number } } = {};
  const getOrCreatePlayer = (name: string) => {
    const key = name.trim().toLowerCase();
    if (!statsMap[key]) {
      statsMap[key] = { name: name.trim(), runs: 0, balls: 0, wickets: 0, runsConceded: 0 };
    }
    return statsMap[key];
  };
  const processInnings = (inn: Innings | null) => {
    if (!inn) return;
    (inn.batsmen || []).forEach(b => {
      if (!b.name) return;
      const p = getOrCreatePlayer(b.name);
      p.runs += b.runs;
      p.balls += b.balls;
    });
    (inn.bowlers || []).forEach(bw => {
      if (!bw.name) return;
      const p = getOrCreatePlayer(bw.name);
      p.wickets += bw.wickets;
      p.runsConceded += bw.runsConceded;
    });
  };
  if (mItem.mainMatchState) {
    processInnings(mItem.mainMatchState.innings1);
    processInnings(mItem.mainMatchState.innings2);
  }
  processInnings(mItem.innings1);
  processInnings(mItem.innings2);

  let bestPlayer = null;
  let maxPoints = -1;
  for (const key in statsMap) {
    const p = statsMap[key];
    const points = p.runs + (p.wickets * 25);
    if (points > maxPoints) {
      maxPoints = points;
      bestPlayer = p;
    } else if (points === maxPoints && points > 0) {
      if (bestPlayer && p.wickets > bestPlayer.wickets) {
        bestPlayer = p;
      } else if (bestPlayer && p.wickets === bestPlayer.wickets && p.runsConceded < bestPlayer.runsConceded) {
        bestPlayer = p;
      }
    }
  }
  if (bestPlayer && (bestPlayer.runs > 0 || bestPlayer.wickets > 0)) {
    return {
      ...bestPlayer,
      points: maxPoints
    };
  }
  return null;
};

// =========================================================================
// MINI BANNER & SPONSOR ADVERT SLIDER FOR EACH COMPLETED MATCH CARD
// Displays the official match banner and seamlessly rotates through
// super admin added advertisement banners from spectator_slider_images.
// =========================================================================
export interface CardBannerSlide {
  id: string;
  imageUrl: string;
  title: string;
  isMatchBanner: boolean;
  tag: string;
}

export const MatchCardBannerSlider: React.FC<{
  match: MatchState;
  fallbackImg: string;
  adminAds: SponsorAdSlide[];
  onSelectMatch: (matchId: string) => void;
  onShareWhatsApp: (match: MatchState, e: React.MouseEvent) => void;
}> = ({ match: m, fallbackImg, adminAds, onSelectMatch, onShareWhatsApp }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  const hasCustomBanner = Boolean(m.matchBannerUrl && m.matchBannerUrl.trim());
  const officialBannerImg = hasCustomBanner ? m.matchBannerUrl! : fallbackImg;

  // Build the list of slides for this card:
  // Slide 1: The official match banner
  // Slides 2+: Super admin added advertisement banners from spectator_slider_images
  const slides: CardBannerSlide[] = [
    {
      id: `match-banner-${m.id}`,
      imageUrl: officialBannerImg,
      title: `${m.teamA} vs ${m.teamB}`,
      isMatchBanner: true,
      tag: hasCustomBanner ? 'Match Banner' : 'Match Stadium'
    }
  ];

  // Append super admin advertisement banners
  if (adminAds && adminAds.length > 0) {
    adminAds.forEach((ad, idx) => {
      slides.push({
        id: ad.id || `ad-${idx}`,
        imageUrl: ad.imageUrl,
        title: ad.title || 'Official Sponsor',
        isMatchBanner: false,
        tag: 'Sponsor Ad'
      });
    });
  } else {
    // If no super admin banners are uploaded yet, use authentic preset tournament sponsor banners
    DEFAULT_PRESET_SPONSORS.filter(s => s.bannerUrl && s.isActive).slice(0, 2).forEach((s) => {
      slides.push({
        id: `preset-${s.id}`,
        imageUrl: s.bannerUrl!,
        title: s.name,
        isMatchBanner: false,
        tag: 'Sponsor Ad'
      });
    });
  }

  // Auto-play slider interval (every 4.5 seconds per slide)
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
  const currentDisplayImg = hasError ? fallbackImg : currentSlide.imageUrl;

  return (
    <div 
      className="rounded-xl overflow-hidden aspect-[16/9] w-full bg-slate-950 border border-slate-800 shadow-md relative group/banner select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Blurred dynamic background glow so edges never look empty */}
      <img 
        src={currentDisplayImg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-105 pointer-events-none transition-all duration-700"
      />
      
      {/* Foreground Banner: object-contain ensures 100% of the match banner and sponsor advertisement is completely visible without cropping */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 w-full h-full flex items-center justify-center"
        >
          <img 
            src={currentDisplayImg}
            alt={currentSlide.title}
            onError={() => setImgErrorMap(prev => ({ ...prev, [currentSlide.id]: true }))}
            className="w-full h-full object-contain transition-transform duration-500"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtle Gradient Overlays */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 pointer-events-none" />

      {/* Top Banner & Sponsor Category Badge */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 flex-wrap">
          {currentSlide.isMatchBanner ? (
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur-md text-[8px] font-mono font-black text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <ImageIcon size={9} className="text-emerald-400" />
              {currentSlide.tag}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-amber-950/85 backdrop-blur-md text-[8px] font-mono font-black text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
              <Megaphone size={9} className="text-amber-400" />
              {currentSlide.tag}
            </span>
          )}

          {/* Ad / Sponsor Title Pill */}
          {!currentSlide.isMatchBanner && currentSlide.title && (
            <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md text-[8px] font-bold text-slate-200 border border-white/10 uppercase tracking-wider truncate max-w-[120px] shadow-sm hidden sm:inline-block">
              {currentSlide.title}
            </span>
          )}
        </div>

        {/* Slide Counter (e.g., 1/3) */}
        {slides.length > 1 && (
          <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[8px] font-mono font-bold text-slate-300 border border-white/15 tracking-wider shadow-sm">
            {currentIndex + 1} / {slides.length}
          </span>
        )}
      </div>

      {/* Navigation Arrows for Banner & Ads Slider */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous banner slide"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-25 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity border border-white/20 cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronLeft size={14} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next banner slide"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-25 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity border border-white/20 cursor-pointer shadow-lg active:scale-95"
          >
            <ChevronRight size={14} />
          </button>
        </>
      )}

      {/* Bottom Slider Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-1.5 inset-x-0 z-20 flex items-center justify-center gap-1 pointer-events-auto">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 border-none cursor-pointer p-0 ${
                idx === currentIndex
                  ? slide.isMatchBanner
                    ? 'w-4 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80'
                    : 'w-4 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/80'
                  : 'w-1.5 h-1.5 rounded-full bg-white/40 hover:bg-white/70'
              }`}
              title={slide.title}
            />
          ))}
        </div>
      )}

      {/* Hover Action Overlay over the Banner (Scorecard & Share) */}
      <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-[2px] opacity-0 group-hover/banner:opacity-100 transition-all duration-300 flex items-center justify-center gap-2.5">
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectMatch(m.id);
          }}
          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all transform hover:scale-105 shadow-xl cursor-pointer border-none flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
          title="View Full Detailed Scorecard"
        >
          <Eye size={14} />
          <span>Scorecard</span>
        </button>

        <button 
          type="button"
          onClick={(e) => onShareWhatsApp(m, e)}
          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-xl transition-all transform hover:scale-105 shadow-xl cursor-pointer flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
          title="Share Result on WhatsApp"
        >
          <Send size={13} />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

// Sub-component for individual completed match card in the slider
// Styled similarly to the active/live match card for visual consistency across Spectator & Tournament arenas
export const CompletedMatchCard: React.FC<{
  match: MatchState;
  index: number;
  adminAds: SponsorAdSlide[];
  onSelectMatch: (matchId: string) => void;
  onExportPDF?: (match: MatchState) => void;
  onDownloadAward?: (match: MatchState, award?: 'potm' | 'best_batter' | 'best_bowler') => void;
  onShareWhatsApp: (match: MatchState, e: React.MouseEvent) => void;
  isAdmin?: boolean;
  onToggleHide?: (matchId: string, currentHidden: boolean) => void;
  onToggleBlock?: (matchId: string, currentBlocked: boolean) => void;
  onDeleteMatch?: (matchId: string) => void;
  layoutMode?: 'slider' | 'grid';
}> = ({ 
  match: m, 
  index, 
  adminAds, 
  onSelectMatch, 
  onExportPDF, 
  onDownloadAward,
  onShareWhatsApp,
  isAdmin = false,
  onToggleHide,
  onToggleBlock,
  onDeleteMatch,
  layoutMode = 'slider'
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);
  const inn1 = m.mainMatchState?.innings1 || m.innings1;
  const inn2 = m.mainMatchState?.innings2 || m.innings2;

  // Resolve Team A and Team B scores
  const isTeamABatted1 = Boolean(inn1?.battingTeam && inn1.battingTeam.toLowerCase().trim() === (m.teamA || '').toLowerCase().trim());
  const isTeamABatted2 = Boolean(inn2?.battingTeam && inn2.battingTeam.toLowerCase().trim() === (m.teamA || '').toLowerCase().trim());

  let teamAScoreStr = '';
  let teamAOversStr = '';
  if (isTeamABatted1 && inn1) {
    teamAScoreStr = `${inn1.runs}/${inn1.wickets}`;
    teamAOversStr = `${Math.floor((inn1.ballsBowled || 0) / 6)}.${(inn1.ballsBowled || 0) % 6}`;
  } else if (isTeamABatted2 && inn2) {
    teamAScoreStr = `${inn2.runs}/${inn2.wickets}`;
    teamAOversStr = `${Math.floor((inn2.ballsBowled || 0) / 6)}.${(inn2.ballsBowled || 0) % 6}`;
  } else if (m.scoreA) {
    teamAScoreStr = m.scoreA;
    teamAOversStr = m.oversA || '';
  } else if (inn1) {
    teamAScoreStr = `${inn1.runs}/${inn1.wickets}`;
    teamAOversStr = `${Math.floor((inn1.ballsBowled || 0) / 6)}.${(inn1.ballsBowled || 0) % 6}`;
  }

  const isTeamBBatted1 = Boolean(inn1?.battingTeam && inn1.battingTeam.toLowerCase().trim() === (m.teamB || '').toLowerCase().trim());
  const isTeamBBatted2 = Boolean(inn2?.battingTeam && inn2.battingTeam.toLowerCase().trim() === (m.teamB || '').toLowerCase().trim());

  let teamBScoreStr = '';
  let teamBOversStr = '';
  if (isTeamBBatted1 && inn1) {
    teamBScoreStr = `${inn1.runs}/${inn1.wickets}`;
    teamBOversStr = `${Math.floor((inn1.ballsBowled || 0) / 6)}.${(inn1.ballsBowled || 0) % 6}`;
  } else if (isTeamBBatted2 && inn2) {
    teamBScoreStr = `${inn2.runs}/${inn2.wickets}`;
    teamBOversStr = `${Math.floor((inn2.ballsBowled || 0) / 6)}.${(inn2.ballsBowled || 0) % 6}`;
  } else if (m.scoreB) {
    teamBScoreStr = m.scoreB;
    teamBOversStr = m.oversB || '';
  } else if (inn2) {
    teamBScoreStr = `${inn2.runs}/${inn2.wickets}`;
    teamBOversStr = `${Math.floor((inn2.ballsBowled || 0) / 6)}.${(inn2.ballsBowled || 0) % 6}`;
  }

  const isTie = m.winner === 'Tie' || m.winReason?.toLowerCase().includes('tie') || m.isSuperOver || (m.superOverNumber && m.superOverNumber > 0);
  const isTeamAWinner = !isTie && m.winner && (
    m.winner.toLowerCase().trim() === (m.teamA || '').toLowerCase().trim() ||
    (inn1 && isTeamABatted1 && m.winner.toLowerCase().trim() === (inn1.battingTeam || '').toLowerCase().trim()) ||
    (inn2 && isTeamABatted2 && m.winner.toLowerCase().trim() === (inn2.battingTeam || '').toLowerCase().trim())
  );
  const isTeamBWinner = !isTie && m.winner && (
    m.winner.toLowerCase().trim() === (m.teamB || '').toLowerCase().trim() ||
    (inn1 && isTeamBBatted1 && m.winner.toLowerCase().trim() === (inn1.battingTeam || '').toLowerCase().trim()) ||
    (inn2 && isTeamBBatted2 && m.winner.toLowerCase().trim() === (inn2.battingTeam || '').toLowerCase().trim())
  );

  const winnerText = isTie ? 'Match Tied!' : `${m.winner || 'Winner'} ${m.winReason || 'Won the Match'}`;

  // Top match performers
  const potm = getMatchPotm(m);

  let bestBatter: { name: string; runs: number; balls: number; team: string } | null = null;
  const checkBatter = (b: any, tName: string) => {
    if (!b || !b.name) return;
    if (!bestBatter || (b.runs ?? 0) > bestBatter.runs) {
      bestBatter = { name: b.name, runs: b.runs ?? 0, balls: b.balls ?? 0, team: tName };
    }
  };
  inn1?.batsmen?.forEach(b => checkBatter(b, inn1?.battingTeam || m.teamA));
  inn2?.batsmen?.forEach(b => checkBatter(b, inn2?.battingTeam || m.teamB));

  let bestBowler: { name: string; wickets: number; runsConceded: number; oversStr: string; team: string } | null = null;
  const checkBowler = (bw: any, tName: string) => {
    if (!bw || !bw.name) return;
    const ov = `${Math.floor((bw.ballsBowled || 0) / 6)}.${(bw.ballsBowled || 0) % 6}`;
    if (!bestBowler || (bw.wickets ?? 0) > bestBowler.wickets || ((bw.wickets ?? 0) === bestBowler.wickets && (bw.runsConceded ?? 999) < bestBowler.runsConceded)) {
      if ((bw.wickets ?? 0) > 0 || (bw.ballsBowled ?? 0) > 0) {
        bestBowler = { name: bw.name, wickets: bw.wickets ?? 0, runsConceded: bw.runsConceded ?? 0, oversStr: ov, team: tName };
      }
    }
  };
  inn1?.bowlers?.forEach(bw => checkBowler(bw, inn1?.bowlingTeam || m.teamB));
  inn2?.bowlers?.forEach(bw => checkBowler(bw, inn2?.bowlingTeam || m.teamA));

  // Calculated Match Stats
  const team1Runs = inn1?.runs ?? 0;
  const team2Runs = inn2?.runs ?? 0;
  const team1Balls = inn1?.ballsBowled ?? 0;
  const team2Balls = inn2?.ballsBowled ?? 0;
  const totalMatchRuns = team1Runs + team2Runs;
  const totalMatchBalls = team1Balls + team2Balls;
  const overallRunRate = totalMatchBalls > 0 ? ((totalMatchRuns / totalMatchBalls) * 6).toFixed(2) : '0.00';

  const fallbackImg = DEFAULT_STADIUM_IMAGES[index % DEFAULT_STADIUM_IMAGES.length];

  const widthClasses = layoutMode === 'grid' 
    ? 'w-full' 
    : 'snap-start shrink-0 w-[calc(100vw-4.5rem)] max-w-[340px] sm:w-[370px] md:w-[390px]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.05, 0.25), type: "spring", stiffness: 120 }}
      onClick={() => onSelectMatch(m.id)}
      style={{ touchAction: 'pan-x pan-y' }}
      className={`group/card ${widthClasses} bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-emerald-500/35 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.55),0_0_20px_rgba(16,185,129,0.12)] hover:translate-y-[-3px] transition-all duration-300 cursor-pointer relative overflow-hidden text-white flex flex-col justify-between touch-auto select-none`}
    >
      {/* Interactive Background Glow Accent (identical to active match card) */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-amber-500/5 rounded-full blur-[50px] pointer-events-none transition-colors duration-300" />

      {/* Top Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header section with tournament name & concluded/tied badge */}
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block truncate max-w-[130px] sm:max-w-[200px]" title={m.tournamentName ? `🏆 ${m.tournamentName} • ${m.date || 'Concluded'}` : (m.date || 'Concluded')}>
            {m.tournamentName ? `🏆 ${m.tournamentName}` : (m.date || 'Concluded')}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`flex items-center gap-1.5 font-mono text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isTie 
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' 
                : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
            }`}>
              <Trophy size={9} className="text-amber-400" />
              {isTie ? 'TIED' : 'CONCLUDED'}
            </div>
            {isAdmin && (m.isHidden || (m as any).hideResultCard) && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[7.5px] font-black uppercase">
                Hidden
              </span>
            )}
            {isAdmin && m.isBlocked && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white border border-rose-500 text-[7.5px] font-black uppercase">
                Blocked
              </span>
            )}
          </div>
        </div>

        {/* Interactive Match Banner & Super Admin Sponsor Advertisements Slider */}
        <div className="mb-3.5">
          <MatchCardBannerSlider
            match={m}
            fallbackImg={fallbackImg}
            adminAds={adminAds}
            onSelectMatch={onSelectMatch}
            onShareWhatsApp={onShareWhatsApp}
          />
        </div>

        {/* Team Battle Scoreboard Grid (Identical to Active Match Card) */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-3.5 sm:mb-4 mt-1">
          {/* Team A Details */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs border border-indigo-400/20 shadow-md shadow-indigo-500/10 shrink-0 ${
              isTeamAWinner ? 'ring-2 ring-emerald-400/80 shadow-emerald-500/20' : ''
            }`}>
              {(m.teamA || 'Team A').toUpperCase().substring(0, 2)}
            </div>
            <div className="min-w-0 leading-tight text-left">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white block truncate">{m.teamA || 'Team A'}</span>
              <span className="text-[10px] sm:text-[11px] font-mono font-black text-amber-400 block truncate" title={teamAScoreStr ? `${m.teamA}: ${teamAScoreStr}` : "Yet to bat"}>
                {teamAScoreStr ? `${teamAScoreStr} ${teamAOversStr ? `(${teamAOversStr} ov)` : ''}` : 'Yet to Bat'}
              </span>
              <span className={`text-[7.5px] sm:text-[8px] font-mono font-extrabold uppercase block mt-0.5 ${
                isTeamAWinner ? 'text-emerald-400 font-black' : 'text-slate-500'
              }`}>
                {isTeamAWinner ? '🏆 WINNER' : isTie ? 'Tied' : 'Team A'}
              </span>
            </div>
          </div>

          {/* Versus Badge */}
          <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase text-slate-400 border border-slate-850 bg-slate-950 px-1.5 sm:px-2 py-0.5 rounded-lg shrink-0">VS</span>

          {/* Team B Details */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 justify-end text-right">
            <div className="min-w-0 leading-tight text-right">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white block truncate">{m.teamB || 'Team B'}</span>
              <span className="text-[10px] sm:text-[11px] font-mono font-black text-amber-400 block truncate justify-end" title={teamBScoreStr ? `${m.teamB}: ${teamBScoreStr}` : "Yet to bat"}>
                {teamBScoreStr ? `${teamBScoreStr} ${teamBOversStr ? `(${teamBOversStr} ov)` : ''}` : 'Yet to Bat'}
              </span>
              <span className={`text-[7.5px] sm:text-[8px] font-mono font-extrabold uppercase block mt-0.5 ${
                isTeamBWinner ? 'text-emerald-400 font-black' : 'text-slate-550'
              }`}>
                {isTeamBWinner ? '🏆 WINNER' : isTie ? 'Tied' : 'Team B'}
              </span>
            </div>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs border border-amber-400/20 shadow-md shadow-amber-500/10 shrink-0 ${
              isTeamBWinner ? 'ring-2 ring-emerald-400/80 shadow-emerald-500/20' : ''
            }`}>
              {(m.teamB || 'Team B').toUpperCase().substring(0, 2)}
            </div>
          </div>
        </div>

        {/* Match Metadata & Venue Panel (Identical layout to Active Match Card) */}
        <div className="mb-3 sm:mb-3.5 grid grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] p-2.5 sm:p-3 rounded-xl sm:rounded-[1.25rem] bg-slate-950/60 border border-white/5 text-left leading-tight text-slate-400 font-sans">
          <div className="col-span-2 border-b border-white/[0.04] pb-1.5 mb-0.5 text-slate-300 flex items-center justify-between gap-1.5">
            <span className="text-[9px] sm:text-[10px] truncate" title={m.tossWinner ? `Toss: ${m.tossWinner} won & opted to ${m.tossChoice === 'bat' ? 'bat' : 'bowl'}` : 'Official match recorded'}>
              🪙 <strong>Toss:</strong> {m.tossWinner ? `${m.tossWinner} won & ${m.tossChoice === 'bat' ? 'bat' : 'bowl'}` : 'Concluded fixture'}
            </span>
          </div>
          <div className="truncate">
            🏆 <strong>Tour:</strong> {m.tournamentName || 'Friendly Cup'}
          </div>
          <div className="truncate">
            🏏 <strong>Limit:</strong> {m.oversLimit || 10} Overs
          </div>
          <div className="col-span-2 truncate">
            📍 <strong>Ground:</strong> {m.groundName || m.venue || m.ground || 'Gully Ground'}
          </div>
        </div>

        {/* Completed Match Outcome & Performer Highlights Panel */}
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-950/80 rounded-xl sm:rounded-2xl border border-white/5 space-y-2 sm:space-y-2.5 font-sans relative mb-3 sm:mb-4">
          {/* Victory equation banner */}
          <div className="flex items-center justify-between gap-1.5 border-b border-white/[0.04] pb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Trophy size={12} className="text-amber-400 shrink-0" />
              <span className="text-xs font-black text-emerald-400 tracking-tight truncate" title={winnerText}>
                {winnerText}
              </span>
            </div>
            {totalMatchRuns > 0 && (
              <span className="text-[9px] font-mono text-slate-400 shrink-0 whitespace-nowrap">
                {totalMatchRuns} runs ({overallRunRate} rpo)
              </span>
            )}
          </div>

          {/* Top Batsman & Bowler Pair (Styled like Active Match's Striker / Bowler row) */}
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Top Batter</span>
              {bestBatter ? (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-xs font-black text-white truncate max-w-[65px] min-[360px]:max-w-[85px] sm:max-w-[100px]" title={bestBatter.name}>{bestBatter.name}</span>
                  <span className="text-[11px] font-mono font-black text-emerald-400 ml-auto whitespace-nowrap shrink-0">
                    {bestBatter.runs}<span className="text-[9px] text-slate-400 font-normal">({bestBatter.balls})</span>
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-bold">-</span>
              )}
            </div>

            <div className="border-l border-white/[0.04] pl-2">
              <span className="text-[7.5px] sm:text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Top Bowler</span>
              {bestBowler ? (
                <div className="flex items-center gap-1 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300 truncate max-w-[65px] min-[360px]:max-w-[85px] sm:max-w-[100px]" title={bestBowler.name}>{bestBowler.name}</span>
                  <span className="text-[11px] font-mono font-black text-amber-400 ml-auto whitespace-nowrap shrink-0">
                    {bestBowler.wickets}/{bestBowler.runsConceded}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-bold">-</span>
              )}
            </div>
          </div>

          {/* Player of the Match Pill (if available) */}
          {potm?.name && (
            <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between text-[8.5px] font-mono">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Award size={10} className="text-amber-400" />
                POTM:
              </span>
              <span className="text-amber-300 font-black truncate max-w-[170px]" title={potm.name}>
                {potm.name} {potm.runs ? `(${potm.runs}r)` : ''} {potm.wickets ? `(${potm.wickets}w)` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action of Card with arrow sliding effect (Identical to Active Match Card) */}
      <div className="pt-3 sm:pt-4 mt-1 border-t border-white/[0.04] flex justify-between items-center text-[10px] font-semibold text-emerald-400 group-hover:text-emerald-350 transition-colors bg-transparent">
        <span className="flex items-center gap-1 font-black uppercase tracking-wider text-[8.5px] sm:text-[9px]">
          Scorecard Details <ArrowRight size={10} className="group-hover:translate-x-1.5 transition-transform duration-300" />
        </span>

        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <button
            type="button"
            onClick={(e) => onShareWhatsApp(m, e)}
            className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
            title="Share match result on WhatsApp"
          >
            <Send size={9} />
            <span className="hidden min-[380px]:inline">Share</span>
          </button>

          {onExportPDF && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExportPDF(m);
              }}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none shadow-[0_2px_4px_rgba(16,185,129,0.2)]"
              title="Download Scoreboard PDF"
            >
              <Download size={9} />
              <span>Scoreboard</span>
            </button>
          )}

          {onDownloadAward && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadAward(m, 'potm');
              }}
              className="px-2 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/30 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              title="Download Match Awards"
            >
              <Award size={9} />
              <span className="hidden min-[380px]:inline">Awards</span>
            </button>
          )}

          {/* Admin Management Controls */}
          {isAdmin && (
            <div className="flex items-center gap-1">
              {onToggleHide && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleHide(m.id, !!(m.isHidden || (m as any).hideResultCard));
                  }}
                  className={`p-1 rounded text-[8px] border cursor-pointer ${
                    m.isHidden || (m as any).hideResultCard
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                  title={m.isHidden || (m as any).hideResultCard ? "Unhide match" : "Hide match"}
                >
                  {m.isHidden || (m as any).hideResultCard ? <EyeOff size={10} /> : <Eye size={10} />}
                </button>
              )}

              {onToggleBlock && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBlock(m.id, !!m.isBlocked);
                  }}
                  className={`p-1 rounded text-[8px] border cursor-pointer ${
                    m.isBlocked
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                  title={m.isBlocked ? "Unblock match" : "Block match"}
                >
                  {m.isBlocked ? <Unlock size={10} /> : <Ban size={10} />}
                </button>
              )}

              {onDeleteMatch && (
                deleteConfirm ? (
                  <div className="flex items-center gap-0.5 bg-rose-950 border border-rose-600 rounded p-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMatch(m.id);
                        setDeleteConfirm(false);
                      }}
                      className="px-1 py-0.5 bg-rose-600 text-white text-[7px] font-black rounded border-none cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(false);
                      }}
                      className="px-1 py-0.5 bg-slate-800 text-slate-300 text-[7px] rounded border-none cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(true);
                    }}
                    className="p-1 rounded text-[8px] bg-rose-500/15 text-rose-400 border border-rose-500/30 cursor-pointer hover:bg-rose-600 hover:text-white"
                    title="Delete match"
                  >
                    <Trash2 size={10} />
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const CompletedRecordsSlider: React.FC<CompletedRecordsSliderProps> = ({
  matches,
  onSelectMatch,
  onExportPDF,
  onDownloadAward,
  isScoreManager = false,
  homepageMode = false
}) => {
  const validMatches = (matches || []).filter(
    m => m && m.id && !isMatchDeleted(m.id) && !(m as any).isDeleted && m.status !== 'deleted'
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  // Real-time listener for super admin added advertisement banners from spectator_slider_images
  const [adminAds, setAdminAds] = useState<SponsorAdSlide[]>([]);

  useEffect(() => {
    try {
      const q = query(collection(db, 'spectator_slider_images'), orderBy('order', 'asc'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items: SponsorAdSlide[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.isActive !== false && data.imageUrl) {
              items.push({
                id: docSnap.id,
                imageUrl: data.imageUrl,
                title: data.title || '',
                order: typeof data.order === 'number' ? data.order : 100,
                isActive: true
              });
            }
          });
          setAdminAds(items);
        },
        (error) => {
          console.warn('CompletedRecordsSlider: could not load spectator_slider_images:', error);
        }
      );
      return () => unsub();
    } catch (err) {
      console.warn('CompletedRecordsSlider: listener setup error:', err);
    }
  }, []);

  // Smooth scroll handler for carousel navigation
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollStep = clientWidth > 640 ? 380 : 320;
      const scrollTo = direction === 'left' ? scrollLeft - scrollStep : scrollLeft + scrollStep;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Scroll to a specific card index
  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardElements = container.children;
      if (cardElements[index]) {
        (cardElements[index] as HTMLElement).scrollIntoView({ 
          behavior: 'smooth', 
          inline: 'center', 
          block: 'nearest' 
        });
      }
      setActiveIndex(index);
    }
  };

  // Track active scroll card index on scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const cardElements = Array.from(scrollRef.current.children) as HTMLElement[];
      if (cardElements.length <= 1) return;

      const containerCenter = scrollLeft + clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      cardElements.forEach((child, i) => {
        if (i >= validMatches.length) return; // skip trailing spacer
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(containerCenter - childCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      setActiveIndex(closestIdx);
    }
  };

  // Auto-slide effect when there is more than 1 completed record
  useEffect(() => {
    if (!isAutoPlay || isHovered || validMatches.length <= 1) return;

    const timer = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 40) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, validMatches.length]);

  const handleShareWhatsApp = (m: MatchState, e: React.MouseEvent) => {
    e.stopPropagation();
    const winnerText = m.winner === 'Tie' ? 'Match Tied!' : `${m.winner} ${m.winReason || 'Won the Match'}`;
    const t1Overs = m.innings1 ? `${Math.floor(m.innings1.ballsBowled / 6)}.${m.innings1.ballsBowled % 6}` : '0.0';
    const t2Overs = m.innings2 ? `${Math.floor(m.innings2.ballsBowled / 6)}.${m.innings2.ballsBowled % 6}` : '0.0';
    const team1Score = m.innings1 ? `${m.innings1.battingTeam || m.teamA}: ${m.innings1.runs}/${m.innings1.wickets} (${t1Overs} ov)` : '';
    const team2Score = m.innings2 ? `${m.innings2.battingTeam || m.teamB}: ${m.innings2.runs}/${m.innings2.wickets} (${t2Overs} ov)` : '';
    const origin = window.location.origin.includes('ais-dev-') ? window.location.origin.replace('ais-dev-', 'ais-pre-') : window.location.origin;
    const matchUrl = `${origin}/?matchId=${m.id}&spectator=true`;
    const shareText = `🏏 *CRICKET MATCH RESULT* 🏆\n*${m.teamA} vs ${m.teamB}*\n\n🔥 *Result:* ${winnerText}\n📊 ${team1Score}\n📊 ${team2Score}\n\n👉 *View Full Match Scorecard & Highlights:*\n${matchUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (validMatches.length === 0) {
    return null;
  }

  return (
    <div 
      className="w-full relative group/slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Header Controls Bar for the Slider */}
      {validMatches.length > 1 && (
        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <Trophy size={11} className="text-amber-400" />
              {validMatches.length} Concluded Matches
            </span>
            {adminAds.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 rounded-full text-[8.5px] font-mono font-bold uppercase tracking-wider border border-amber-500/30 hidden sm:inline-flex items-center gap-1">
                <Sparkles size={9} className="text-amber-400" />
                {adminAds.length} Sponsor Ads Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View All Matches Page Link */}
            <a
              href="#/completed-matches"
              className="px-2.5 py-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-400/40 flex items-center gap-1 shadow-sm no-underline transition-all"
              title="View all completed match records on dedicated page"
            >
              <span>View All Matches</span>
              <ArrowRight size={10} />
            </a>

            {/* Auto-Slide Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(prev => !prev)}
              className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                isAutoPlay 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-emerald-500/30'
              }`}
              title={isAutoPlay ? 'Auto-slide is active (pauses on hover)' : 'Auto-slide is paused'}
            >
              {isAutoPlay ? <Play size={9} className="text-emerald-400 fill-emerald-400" /> : <Pause size={9} />}
              <span>{isAutoPlay ? 'Auto-Slide' : 'Paused'}</span>
            </button>

            {/* Quick Prev / Next Navigator Counter */}
            <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-800 shadow-sm text-slate-300">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="text-slate-400 hover:text-emerald-400 text-[10px] px-1 border-none bg-transparent cursor-pointer font-black"
                aria-label="Previous match"
              >
                ◀
              </button>
              <span className="text-[9px] font-mono font-bold text-emerald-400 px-1">
                {activeIndex + 1}/{validMatches.length}
              </span>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="text-slate-400 hover:text-emerald-400 text-[10px] px-1 border-none bg-transparent cursor-pointer font-black"
                aria-label="Next match"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Side Navigation Chevron Buttons */}
      {validMatches.length > 1 && (
        <>
          <div className="absolute -left-2 sm:-left-5 md:-left-7 top-[48%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hidden sm:block pointer-events-auto">
            <button 
              type="button"
              onClick={() => scroll('left')}
              className="p-3 sm:p-3.5 bg-slate-900/95 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-all transform hover:scale-110 border border-slate-700/80 active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute -right-2 sm:-right-5 md:-right-7 top-[48%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hidden sm:block pointer-events-auto">
            <button 
              type="button"
              onClick={() => scroll('right')}
              className="p-3 sm:p-3.5 bg-slate-900/95 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-all transform hover:scale-110 border border-slate-700/80 active:scale-95 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {/* Enhanced Card Scrolling Slider Track with optimal touch support and snap points */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3.5 sm:gap-6 overflow-x-auto pb-3 sm:pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none touch-auto p-1 sm:p-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
      >
        {validMatches.map((match, idx) => (
          <CompletedMatchCard
            key={match.id}
            match={match}
            index={idx}
            adminAds={adminAds}
            onSelectMatch={onSelectMatch}
            onExportPDF={onExportPDF}
            onDownloadAward={onDownloadAward}
            onShareWhatsApp={handleShareWhatsApp}
            isAdmin={isScoreManager}
          />
        ))}

        {/* Final Spacer for scroll padding */}
        <div className="flex-shrink-0 w-2 md:w-6 h-1" />
      </div>

      {/* Mobile Swipe & Quick Switch Helper (identical to active match slider) */}
      {validMatches.length > 1 && (
        <div className="flex sm:hidden items-center justify-between pt-1 px-1 text-[10px] font-bold text-slate-400">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="flex items-center gap-1 text-emerald-400 font-black uppercase text-[9px] bg-slate-900/60 border border-white/10 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95"
          >
            <ChevronLeft size={12} /> Prev Result
          </button>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
            Swipe to explore ({validMatches.length})
          </span>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="flex items-center gap-1 text-emerald-400 font-black uppercase text-[9px] bg-slate-900/60 border border-white/10 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95"
          >
            Next Result <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Result Slider Pagination Dots & Direct Selector */}
      {validMatches.length > 1 && (
        <div className="flex items-center justify-between px-2 pt-1.5">
          <div className="text-[10px] font-mono font-bold text-slate-400">
            <span>Match </span>
            <span className="text-emerald-400 font-black">{activeIndex + 1}</span>
            <span> of </span>
            <span>{validMatches.length}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-800 shadow-sm backdrop-blur-sm">
            {validMatches.map((match, idx) => (
              <button
                key={match.id}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`transition-all duration-300 border-none cursor-pointer p-0 ${
                  idx === activeIndex
                    ? 'w-5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60'
                    : 'w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Result ${idx + 1}: ${match.teamA} vs ${match.teamB}`}
              />
            ))}
          </div>

          <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
            {validMatches[activeIndex] ? `ID: ${validMatches[activeIndex].id.substring(0, 8)}` : ''}
          </div>
        </div>
      )}
    </div>
  );
};
