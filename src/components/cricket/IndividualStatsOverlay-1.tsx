import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Flame, Zap, Shield, Trophy, Activity, 
  Target, BarChart2, Clock, Pause, Play, Eye, Sparkles
} from 'lucide-react';
import { isStarTVThemeActive, getStarTVThemeTokens } from './StarTVThemeTokens';

interface IndividualStatsOverlayProps {
  match?: any;
  currentInnings?: any;
  battingStats?: {
    striker: { name: string; runs: number; balls: number; fours: number; sixes: number; sr: string };
    nonStriker?: { name: string; runs: number; balls: number; fours: number; sixes: number; sr: string };
  };
  bowlingStats?: {
    name: string;
    overs?: string;
    balls: number;
    maidens: number;
    runs: number;
    wickets: number;
    econ: string;
    dotBallPct?: string;
  };
  activeTeamColor?: string;
  activeConfig?: any;
  onClose: () => void;
  positionMode?: 'alongside' | 'stacked' | 'right';
  isStarTVTheme?: boolean;
  battingTeamColor?: string;
  bowlingTeamColor?: string;
  containerPositionClass?: string;
}

const DEFAULT_BATTER_PHOTO = 'https://images.unsplash.com/photo-1531415080290-bc9854593f6f?q=80&w=1200&auto=format&fit=crop';
const DEFAULT_BOWLER_PHOTO = 'https://images.unsplash.com/photo-1540747737956-37872de719e0?q=80&w=1200&auto=format&fit=crop';

export const IndividualStatsOverlay: React.FC<IndividualStatsOverlayProps> = ({
  match,
  currentInnings,
  battingStats,
  bowlingStats,
  activeTeamColor = '#0143a3',
  activeConfig,
  onClose,
  isStarTVTheme,
  battingTeamColor,
  bowlingTeamColor,
  containerPositionClass
}) => {
  // Tab selector: 'both' | 'batting' | 'bowling'
  const [tabMode, setTabMode] = useState<'both' | 'batting' | 'bowling'>('both');
  
  // Timer auto-dismiss feature (8 seconds default with pause option)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(8);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  const isStarTV = useMemo(() => {
    if (isStarTVTheme !== undefined) return isStarTVTheme;
    return isStarTVThemeActive(activeConfig);
  }, [isStarTVTheme, activeConfig]);

  const starTokens = useMemo(() => {
    return getStarTVThemeTokens(match, currentInnings, activeConfig);
  }, [match, currentInnings, activeConfig]);

  const effectiveBattingColor = battingTeamColor || starTokens.battingTeamColor;
  const effectiveBowlingColor = bowlingTeamColor || starTokens.bowlingTeamColor;

  useEffect(() => {
    if (isTimerPaused) return;

    if (secondsRemaining <= 0) {
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isTimerPaused, onClose]);

  // Striker & non-striker computed details
  const striker = useMemo(() => {
    if (battingStats?.striker) return battingStats.striker;
    return {
      name: currentInnings?.batsmen?.[currentInnings?.strikerIndex]?.name || 'Striker Batter',
      runs: 45,
      balls: 28,
      fours: 5,
      sixes: 2,
      sr: '160.7'
    };
  }, [battingStats, currentInnings]);

  const nonStriker = useMemo(() => {
    if (battingStats?.nonStriker) return battingStats.nonStriker;
    const nonIdx = currentInnings?.nonStrikerIndex;
    if (nonIdx !== undefined && currentInnings?.batsmen?.[nonIdx]) {
      const b = currentInnings.batsmen[nonIdx];
      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
      return {
        name: b.name,
        runs: b.runs,
        balls: b.balls,
        fours: b.fours,
        sixes: b.sixes,
        sr
      };
    }
    return null;
  }, [battingStats, currentInnings]);

  // Bowler computed details
  const bowler = useMemo(() => {
    if (bowlingStats) return bowlingStats;
    const currentBowlerObj = currentInnings?.bowlers?.find((b: any) => b.isCurrent) || currentInnings?.bowlers?.[0];
    if (currentBowlerObj) {
      const overs = `${Math.floor(currentBowlerObj.ballsBowled / 6)}.${currentBowlerObj.ballsBowled % 6}`;
      const econ = currentBowlerObj.ballsBowled > 0 ? ((currentBowlerObj.runsConceded / currentBowlerObj.ballsBowled) * 6).toFixed(2) : '0.00';
      return {
        name: currentBowlerObj.name,
        overs,
        balls: currentBowlerObj.ballsBowled,
        maidens: currentBowlerObj.maidens,
        runs: currentBowlerObj.runsConceded,
        wickets: currentBowlerObj.wickets,
        econ,
        dotBallPct: '48.5'
      };
    }
    return {
      name: 'Star Bowler',
      overs: '3.2',
      balls: 20,
      maidens: 0,
      runs: 22,
      wickets: 2,
      econ: '6.60',
      dotBallPct: '50.0'
    };
  }, [bowlingStats, currentInnings]);

  // Batting Boundary percentage
  const boundaryRuns = (striker.fours * 4) + (striker.sixes * 6);
  const boundaryPct = striker.runs > 0 ? Math.round((boundaryRuns / striker.runs) * 100) : 0;

  // Bowler Economy status badge
  const econValue = parseFloat(bowler.econ || '7.0');
  const econTheme = econValue < 6.5 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                   econValue < 8.5 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                   'text-rose-400 bg-rose-500/10 border-rose-500/20';

  // Dynamic center-screen positioning stacked cleanly above (or below) the scorebug:
  // Horizontally centered (left-1/2 -translate-x-1/2) with proper clearance so it NEVER hides or overlaps the main scorebug
  const effectiveContainerPositionClass = useMemo(() => {
    if (containerPositionClass) return containerPositionClass;
    const isTop = activeConfig?.bugPosition === 'top-full';
    if (isTop) {
      return 'top-[104px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    const showScoreBug = activeConfig?.showScoreBug !== false;
    if (!showScoreBug) {
      return 'bottom-8 left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    const template = activeConfig?.layout || activeConfig?.template || 'star-tv-broadcast';
    if (template === 'ribbon-full' || template === 'single-line') {
      return 'bottom-[120px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    if (template === 'minimal-pill') {
      return 'bottom-[108px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    if (template === 'slanted-pro-design') {
      return 'bottom-[168px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    if (template === 'docked-corner') {
      return 'bottom-[356px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    if (template === 'score-bug-1900-200') {
      return 'bottom-[230px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }
    // Star TV broadcast and standard bottom bar
    return 'bottom-[100px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
  }, [containerPositionClass, activeConfig?.bugPosition, activeConfig?.showScoreBug, activeConfig?.layout, activeConfig?.template]);

  return (
    <div 
      className={`absolute ${effectiveContainerPositionClass} z-50 pointer-events-auto select-none font-sans`}
      id="individual-stats-overlay-module"
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        className="w-full bg-slate-950/95 border border-white/20 rounded-[2rem] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-xl relative overflow-hidden"
        style={{ borderTop: isStarTV ? `3px solid ${effectiveBattingColor}` : `4px solid ${activeTeamColor}` }}
      >
        {/* Top Glint Bar matching Star TV elevated center shield */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />

        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-b from-sky-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* Top Broadcast Bar: Header, Tabs, Timer & Close */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isStarTV 
                ? 'bg-sky-500/20 border-sky-400/30 text-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}>
              {isStarTV ? <Sparkles size={16} className="text-amber-400" /> : <BarChart2 size={16} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 ${
                  isStarTV ? 'text-sky-300' : 'text-amber-400'
                }`}>
                  {isStarTV && <span className="text-amber-400">⭐</span>}
                  {isStarTV ? 'STAR TV PRO BROADCAST • PLAYER DYNAMICS' : 'PLAYER MATCH DYNAMICS'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono font-black uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
                  LIVE
                </span>
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                {isStarTV ? 'Official Batting & Bowling Analysis' : 'Individual Batting & Bowling Stats'}
              </h3>
            </div>
          </div>

          {/* Quick Mode Switcher & Timer Controls */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-0.5 flex text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setTabMode('both')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  tabMode === 'both' 
                    ? isStarTV ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-amber-400 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Split Both
              </button>
              <button
                type="button"
                onClick={() => setTabMode('batting')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  tabMode === 'batting' 
                    ? isStarTV ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-amber-400 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Batting
              </button>
              <button
                type="button"
                onClick={() => setTabMode('bowling')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  tabMode === 'bowling' 
                    ? isStarTV ? 'bg-sky-400 text-slate-950 font-black shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-sky-400 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bowling
              </button>
            </div>

            {/* Timer countdown pill & Pause Button */}
            <button
              type="button"
              onClick={() => setIsTimerPaused(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 hover:border-white/20 text-[10px] font-mono text-slate-300 transition-all cursor-pointer"
              title={isTimerPaused ? "Timer Paused - Click to resume auto-dismiss" : "Click to pin overlay and pause auto-dismiss"}
            >
              <Clock size={12} className={isTimerPaused ? "text-slate-500" : "text-amber-400 animate-spin"} />
              <span>{isTimerPaused ? 'Pinned' : `${secondsRemaining}s`}</span>
              {isTimerPaused ? <Play size={10} className="text-emerald-400" /> : <Pause size={10} className="text-amber-400" />}
            </button>

            {/* Explicit Manual Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-rose-500/40 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close Individual Stats Overlay"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Section: Dynamic Batting and Bowling Panels */}
        <div className={`grid gap-4 ${tabMode === 'both' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* =========================================================================
              1. INDIVIDUAL BATTING STATS PANEL
              ========================================================================= */}
          {(tabMode === 'both' || tabMode === 'batting') && (
            <div className={`rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all ${
              isStarTV 
                ? 'bg-slate-900/95 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                : 'bg-slate-900/90 border border-amber-500/20'
            }`}>
              {/* Star TV Slanted Team Brand Block Header */}
              {isStarTV && (
                <div 
                  className="px-3.5 py-1 mb-3 text-white font-black text-xs uppercase flex items-center justify-between rounded-lg relative overflow-hidden shadow-sm"
                  style={{ 
                    backgroundColor: effectiveBattingColor,
                    clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0% 100%)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/25 pointer-events-none" />
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]" />
                    <span className="font-black tracking-wider drop-shadow truncate max-w-[200px]">
                      {currentInnings?.battingTeam || match?.teamA || 'BATTING TEAM'}
                    </span>
                  </div>
                  <span className="text-[8.5px] font-mono font-bold tracking-widest text-white/90 mr-4 relative z-10">
                    STRIKER METRICS
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Batter Photo */}
                  <div className={`w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative shadow-md ${
                    isStarTV ? 'border border-amber-400/40' : 'border border-amber-400/30'
                  }`}>
                    <img 
                      src={match?.playerPhotos?.[striker.name.toLowerCase().trim()] || DEFAULT_BATTER_PHOTO}
                      alt={striker.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_BATTER_PHOTO;
                      }}
                    />
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950 shadow-sm" title="On Strike" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-widest block flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ON STRIKE BATTER
                    </span>
                    <h4 className="text-base font-black text-white uppercase truncate">
                      {striker.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentInnings?.battingTeam || 'Batting Unit'}
                    </span>
                  </div>
                </div>

                {/* Runs & Balls Big Stat */}
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-white flex items-baseline justify-end gap-1">
                    <span className={isStarTV ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' : 'text-amber-400'}>
                      {striker.runs}
                    </span>
                    <span className="text-xs font-normal text-slate-400 font-sans">({striker.balls}b)</span>
                  </div>
                  <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                    isStarTV 
                      ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30 inline-block' 
                      : 'text-emerald-400'
                  }`}>
                    SR: {striker.sr}%
                  </span>
                </div>
              </div>

              {/* Batting Metric Tiles */}
              <div className="grid grid-cols-4 gap-2 text-center font-mono mt-2">
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-sky-400/20 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className={`text-base font-black ${isStarTV ? 'text-sky-300' : 'text-white'}`}>{striker.fours}</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">4s ({striker.fours * 4}r)</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-amber-400/30 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-amber-300">{striker.sixes}</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">6s ({striker.sixes * 6}r)</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-white/10 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-sky-300">{boundaryPct}%</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">Bdry Runs</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-white/10 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-emerald-400">
                    {Math.max(0, striker.balls - (striker.fours + striker.sixes))}
                  </span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">Running</span>
                </div>
              </div>

              {/* Non-Striker Mini Row */}
              {nonStriker && (
                <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      isStarTV ? 'bg-white/10 text-slate-200 border border-white/10 font-bold' : 'bg-slate-800 text-slate-300'
                    }`}>
                      Non-Striker
                    </span>
                    <span className="font-bold text-slate-200 uppercase truncate max-w-[120px]">
                      {nonStriker.name}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300">
                    <strong className="text-white font-mono">{nonStriker.runs}</strong> ({nonStriker.balls}b) • <span className={isStarTV ? 'text-amber-400/90 font-bold' : 'text-slate-400'}>SR {nonStriker.sr}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              2. INDIVIDUAL BOWLING STATS PANEL
              ========================================================================= */}
          {(tabMode === 'both' || tabMode === 'bowling') && (
            <div className={`rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-all ${
              isStarTV 
                ? 'bg-slate-900/95 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                : 'bg-slate-900/90 border border-sky-500/20'
            }`}>
              {/* Star TV Slanted Team Brand Block Header */}
              {isStarTV && (
                <div 
                  className="px-3.5 py-1 mb-3 text-white font-black text-xs uppercase flex items-center justify-between rounded-lg relative overflow-hidden shadow-sm text-right"
                  style={{ 
                    backgroundColor: effectiveBowlingColor,
                    clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0% 100%)'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/25 pointer-events-none" />
                  <span className="text-[8.5px] font-mono font-bold tracking-widest text-white/90 ml-4 relative z-10">
                    ATTACK BOWLER
                  </span>
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="font-black tracking-wider drop-shadow truncate max-w-[200px]">
                      {currentInnings?.bowlingTeam || match?.teamB || 'BOWLING TEAM'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {/* Bowler Photo */}
                  <div className={`w-12 h-12 rounded-xl overflow-hidden bg-slate-950 shrink-0 relative shadow-md ${
                    isStarTV ? 'border border-sky-400/40' : 'border border-sky-400/30'
                  }`}>
                    <img 
                      src={match?.playerPhotos?.[bowler.name.toLowerCase().trim()] || DEFAULT_BOWLER_PHOTO}
                      alt={bowler.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_BOWLER_PHOTO;
                      }}
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-sky-600 text-[7px] text-white text-center font-bold font-mono">
                      BOWL
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className={`text-[9px] font-mono font-black uppercase tracking-widest block ${
                      isStarTV ? 'text-sky-300' : 'text-sky-400'
                    }`}>
                      ACTIVE BOWLER SPELL
                    </span>
                    <h4 className="text-base font-black text-white uppercase truncate">
                      {bowler.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {currentInnings?.bowlingTeam || 'Bowling Unit'}
                    </span>
                  </div>
                </div>

                {/* Wickets & Overs Big Stat */}
                <div className="text-right">
                  <div className="text-2xl font-black font-mono text-white flex items-baseline justify-end gap-1">
                    <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                      {bowler.wickets}
                    </span>
                    <span className="text-xs font-normal text-slate-400 font-sans">wkts</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-white text-lg">{bowler.runs}r</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300">
                    {bowler.overs || `${Math.floor(bowler.balls / 6)}.${bowler.balls % 6}`} overs
                  </span>
                </div>
              </div>

              {/* Bowling Metric Tiles */}
              <div className="grid grid-cols-4 gap-2 text-center font-mono mt-2">
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-white/10 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-white">{bowler.maidens}</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">Maidens</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-white/10 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-rose-400">{bowler.runs}</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">Conceded</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-sky-400/20 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-sky-300">{bowler.econ}</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">Econ</span>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isStarTV 
                    ? 'bg-slate-950/80 border-emerald-500/20 shadow-sm' 
                    : 'bg-white/5 border-white/5'
                }`}>
                  <span className="text-base font-black text-emerald-400">{bowler.dotBallPct || '45'}%</span>
                  <span className="text-[8px] text-slate-400 block uppercase mt-0.5">Dot Ball %</span>
                </div>
              </div>

              {/* Economy rating badge footer */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                  <Activity size={12} className={isStarTV ? 'text-sky-300' : 'text-sky-400'} />
                  <span>Spell Impact:</span>
                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase ${
                    isStarTV && econValue < 7.0 
                      ? 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30' 
                      : econTheme
                  }`}>
                    {econValue < 7.0 ? 'Elite Economy' : econValue < 9.0 ? 'Balanced' : 'High Run Rate'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {bowler.balls} Legal Balls Bowled
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Auto-dismiss Animated Progress Bar */}
        {!isTimerPaused && (
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 8, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-amber-500 via-sky-400 to-rose-500"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};
