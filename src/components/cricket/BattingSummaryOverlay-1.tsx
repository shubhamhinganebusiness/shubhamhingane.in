import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Trophy, Sparkles, Maximize2, Minimize2, 
  Flame, Award, BarChart2, Zap, Shield, Target,
  Users, ChevronRight, CheckCircle2
} from 'lucide-react';
import { MatchState, Innings, Batsman } from './CricketFullScreenTransitions';
import { StarTVColors, getStarTVThemeTokens, isStarTVThemeActive } from './StarTVThemeTokens';

interface BattingSummaryOverlayProps {
  match: MatchState;
  variant?: 'fullscreen' | 'mini';
  initialInnings?: 1 | 2;
  onClose?: () => void;
  onToggleVariant?: (variant: 'fullscreen' | 'mini') => void;
  isAlert?: boolean;
}

// Format ball count into standard cricket overs (e.g. 19 balls -> "3.1")
function formatOvers(balls: number = 0): string {
  const overs = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${overs}.${rem}`;
}

export const BattingSummaryOverlay: React.FC<BattingSummaryOverlayProps> = ({
  match,
  variant = 'fullscreen',
  initialInnings,
  onClose,
  onToggleVariant,
  isAlert = false
}) => {
  const [currentVariant, setCurrentVariant] = useState<'fullscreen' | 'mini'>(variant);
  const isStarTV = isStarTVThemeActive(match.overlayConfig);
  const starTokens = getStarTVThemeTokens(match.overlayConfig);

  // Allow switching between Innings 1 and Innings 2 in fullscreen view
  const defaultInningsNum = initialInnings || match.currentInningsNum || (match.innings2 ? 2 : 1);
  const [selectedInningsNum, setSelectedInningsNum] = useState<1 | 2>(defaultInningsNum);

  const handleToggle = (next: 'fullscreen' | 'mini') => {
    setCurrentVariant(next);
    if (onToggleVariant) {
      onToggleVariant(next);
    }
  };

  // Safe innings resolution with array support fallback
  const inn: Innings | null = useMemo(() => {
    if (selectedInningsNum === 1) {
      return match.innings1 || (Array.isArray((match as any).innings) ? (match as any).innings[0] : null);
    }
    return match.innings2 || (Array.isArray((match as any).innings) ? (match as any).innings[1] : null);
  }, [match, selectedInningsNum]);

  const battingTeam = inn?.battingTeam || (selectedInningsNum === 1 ? match.teamA : match.teamB);
  const bowlingTeam = inn?.bowlingTeam || (selectedInningsNum === 1 ? match.teamB : match.teamA);
  const teamLogo = battingTeam === match.teamA ? match.teamALogo : match.teamBLogo;

  const runs = inn?.runs ?? 0;
  const wickets = inn?.wickets ?? 0;
  const ballsBowled = inn?.ballsBowled ?? 0;
  const oversStr = formatOvers(ballsBowled);
  const crr = ballsBowled > 0 ? ((runs / ballsBowled) * 6).toFixed(2) : '0.00';

  const extras = inn?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
  const totalExtras = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0) + (extras.penalty || 0);

  const batsmen: Batsman[] = inn?.batsmen || [];
  const fallOfWickets = inn?.fallOfWickets || [];

  // Identify top scorer
  const topScorer = useMemo(() => {
    if (!batsmen.length) return null;
    return [...batsmen].sort((a, b) => (b.runs || 0) - (a.runs || 0))[0];
  }, [batsmen]);

  // Total boundary metrics
  const totalFours = useMemo(() => batsmen.reduce((acc, b) => acc + (b.fours || 0), 0), [batsmen]);
  const totalSixes = useMemo(() => batsmen.reduce((acc, b) => acc + (b.sixes || 0), 0), [batsmen]);
  const boundaryRuns = (totalFours * 4) + (totalSixes * 6);
  const boundaryPercentage = runs > 0 ? Math.round((boundaryRuns / runs) * 100) : 0;

  // Unplayed squad / yet to bat
  const yetToBat = useMemo(() => {
    const playedNames = new Set(batsmen.map(b => b.name.toLowerCase().trim()));
    const squad = battingTeam === match.teamA ? (match.teamASquad || []) : (match.teamBSquad || []);
    return squad.filter(p => !playedNames.has(p.toLowerCase().trim()));
  }, [batsmen, battingTeam, match.teamA, match.teamASquad, match.teamBSquad]);

  // Target info for 2nd innings
  const targetRuns = match.targetRuns || (match.innings1 ? match.innings1.runs + 1 : undefined);
  const targetRequired = selectedInningsNum === 2 && targetRuns !== undefined ? targetRuns - runs : undefined;
  const ballsRemaining = selectedInningsNum === 2 ? Math.max(0, (match.oversLimit * 6) - ballsBowled) : undefined;
  const rrr = ballsRemaining && ballsRemaining > 0 && targetRequired && targetRequired > 0 
    ? ((targetRequired / ballsRemaining) * 6).toFixed(2) 
    : undefined;

  // ==========================================
  // 1. MINI SUMMARY VIEW (Broadcast Lower-Third Card)
  // ==========================================
  if (currentVariant === 'mini') {
    const topBatsmen = batsmen.length > 0 ? batsmen.slice(0, 4) : [];

    return (
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-20 left-6 z-[999] pointer-events-auto select-none"
        style={{ width: '560px', maxWidth: 'calc(100vw - 32px)' }}
        id="batting-summary-mini-card"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-white">
          {/* Top Decorative Star TV Metallic Header Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-sky-400 to-amber-500" />

          {/* Mini Header */}
          <div className="px-4 py-2.5 bg-slate-950/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-xs text-slate-950 shadow-md shrink-0">
                🏏
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 font-mono">
                    {match.tournamentName || 'STAR SPORTS HD'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[8px] font-black uppercase tracking-wider">
                    BATTING SUMMARY
                  </span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white truncate">
                  {battingTeam}
                </h3>
              </div>
            </div>

            {/* Total Score Capsule & Controls */}
            <div className="flex items-center gap-2">
              <div className="text-right font-mono pr-1">
                <div className="text-base font-black text-amber-400 leading-none">
                  {runs}/{wickets}
                </div>
                <div className="text-[9px] text-slate-400">
                  {oversStr} ov • CRR {crr}
                </div>
              </div>

              {/* Expand to Full Screen Button */}
              <button
                onClick={() => handleToggle('fullscreen')}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Expand to Full Screen Batting Summary"
              >
                <Maximize2 size={13} />
              </button>

              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600/80 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Dismiss Summary"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Mini Table Body */}
          <div className="p-3 space-y-1 text-[11px]">
            {topBatsmen.length === 0 ? (
              <div className="text-center py-4 text-slate-400 font-mono text-xs">
                Innings has not started or no batting data recorded yet.
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 text-[8.5px] font-black uppercase text-slate-400 font-mono px-2 py-0.5 border-b border-white/5">
                  <div className="col-span-6">BATSMAN</div>
                  <div className="col-span-2 text-right font-black text-amber-400">R (B)</div>
                  <div className="col-span-2 text-right">4s / 6s</div>
                  <div className="col-span-2 text-right">SR</div>
                </div>

                {topBatsmen.map((b, idx) => {
                  const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                  const isStriker = idx === (inn?.strikerIndex ?? -1);
                  const isNotOut = !b.isOut;

                  return (
                    <div
                      key={b.name + idx}
                      className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-lg transition-colors font-mono ${
                        isNotOut ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5'
                      }`}
                    >
                      <div className="col-span-6 flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="text-[10px] shrink-0">
                          {isNotOut ? '⚡' : '🏏'}
                        </span>
                        <div className="min-w-0">
                          <span className={`font-black truncate block ${isNotOut ? 'text-white' : 'text-slate-300'}`}>
                            {b.name} {isNotOut && <span className="text-amber-400">*</span>}
                          </span>
                          <span className="text-[7.5px] text-slate-400 block truncate font-sans">
                            {isNotOut ? 'not out' : (b.outMode || 'b Bowler')}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 text-right font-black text-white text-xs">
                        <span className="text-amber-400">{b.runs}</span>
                        <span className="text-slate-400 text-[10px] font-normal"> ({b.balls})</span>
                      </div>

                      <div className="col-span-2 text-right text-[10px] text-slate-300">
                        {b.fours}/{b.sixes}
                      </div>

                      <div className="col-span-2 text-right text-[10px] font-bold text-sky-400">
                        {sr}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mini Footer Strip */}
            <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
              <div>
                Extras: <span className="text-white font-bold">{totalExtras}</span> (w {extras.wides}, nb {extras.noBalls})
              </div>
              <div className="flex items-center gap-3">
                <span>Boundaries: <strong className="text-amber-400">{totalFours * 4 + totalSixes * 6}</strong> ({totalFours}×4, {totalSixes}×6)</span>
                <button
                  onClick={() => handleToggle('fullscreen')}
                  className="text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Full Card</span>
                  <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ==========================================
  // 2. FULL SCREEN BATTING SUMMARY VIEW
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute inset-0 z-[999] bg-gradient-to-br from-slate-950 via-[#030914] to-slate-950 flex flex-col justify-between p-6 lg:p-8 select-none text-white overflow-hidden"
      id="batting-summary-fullscreen-overlay"
    >
      {/* Background Decorative Broadcast Stadium Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(14,165,233,0.06),transparent_70%)]" />
      </div>

      {/* TOP BROADCAST HEADER & CONTROLS */}
      <div className="relative z-10 flex flex-wrap justify-between items-center border-b border-white/10 pb-4 gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.35)] border border-amber-400/50">
            <span className="text-2xl">🏏</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1">
                <Sparkles size={11} />
                {match.tournamentName || 'STAR SPORTS HD BROADCAST'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                BATTING SUMMARY
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white mt-0.5">
              {battingTeam} • INNINGS BREAKDOWN
            </h1>
          </div>
        </div>

        {/* Right side controls: Innings 1 / Innings 2 Pills, Mini Toggle, Close */}
        <div className="flex items-center gap-3">
          {/* Innings Selector Pills */}
          <div className="flex p-1 rounded-2xl bg-slate-900/90 border border-white/10 shadow-inner">
            <button
              onClick={() => setSelectedInningsNum(1)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedInningsNum === 1
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              1st Inn ({match.innings1?.battingTeam || match.teamA})
            </button>
            <button
              onClick={() => setSelectedInningsNum(2)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedInningsNum === 2
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              2nd Inn ({match.innings2?.battingTeam || match.teamB})
            </button>
          </div>

          {/* Switch to Mini View Button */}
          <button
            onClick={() => handleToggle('mini')}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
            title="Switch to Mini Summary Card (Non-intrusive)"
          >
            <Minimize2 size={14} />
            <span className="hidden sm:inline">Mini Summary</span>
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 border border-white/15 text-slate-300 hover:text-white transition cursor-pointer"
              title="Close Summary"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* HERO SCORE METRIC BAR */}
      <div className="relative z-10 my-3 p-4 lg:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950 border border-amber-500/30 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4 text-left min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-amber-500/40 overflow-hidden flex items-center justify-center font-black text-2xl text-amber-400 shadow-md shrink-0">
            {teamLogo ? (
              <img src={teamLogo} alt={battingTeam} className="w-full h-full object-cover" />
            ) : (
              <span>{battingTeam.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
                {battingTeam}
              </h2>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider font-mono">
                {selectedInningsNum === 1 ? '1ST INNINGS' : '2ND INNINGS'}
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 block mt-0.5">
              vs {bowlingTeam} • {match.oversLimit} Overs Match • {match.venue || 'International Ground'}
            </span>
          </div>
        </div>

        {/* Big Numbers Group */}
        <div className="flex items-center gap-6 lg:gap-10 font-mono text-right">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-sans">
              TOTAL SCORE
            </span>
            <div className="text-3xl lg:text-4xl font-black text-amber-400 tracking-tight leading-none mt-0.5">
              {runs}<span className="text-white">/{wickets}</span>
            </div>
            <span className="text-xs text-slate-400">
              ({oversStr} / {match.oversLimit} ov)
            </span>
          </div>

          <div className="hidden sm:block border-l border-white/10 pl-6">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-sans">
              RUN RATE
            </span>
            <div className="text-2xl font-black text-sky-400 mt-0.5">
              {crr}
            </div>
            <span className="text-[10px] text-slate-400">
              Current CRR
            </span>
          </div>

          {selectedInningsNum === 2 && targetRuns !== undefined && (
            <div className="border-l border-white/10 pl-6">
              <span className="text-[10px] uppercase tracking-widest text-amber-400 block font-sans font-bold">
                {targetRequired && targetRequired <= 0 ? 'TARGET ACHIEVED' : 'TARGET NEEDED'}
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-0.5">
                {targetRequired && targetRequired <= 0 ? 'WON' : `${targetRequired} runs`}
              </div>
              <span className="text-[10px] text-slate-400">
                {rrr ? `RRR: ${rrr} RPO` : `Target: ${targetRuns}`}
              </span>
            </div>
          )}

          <div className="hidden md:block border-l border-white/10 pl-6">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-sans">
              EXTRAS
            </span>
            <div className="text-2xl font-black text-slate-200 mt-0.5">
              {totalExtras}
            </div>
            <span className="text-[9px] text-slate-400 block">
              w:{extras.wides} nb:{extras.noBalls} b:{extras.byes} lb:{extras.legByes}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN BATTING CARD TABLE */}
      <div className="relative z-10 flex-1 overflow-y-auto pr-1 my-1">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-950/90 py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10 font-mono">
            <div className="col-span-5 sm:col-span-5">BATSMAN & DISMISSAL</div>
            <div className="col-span-2 sm:col-span-2 text-right text-amber-400 font-black">RUNS</div>
            <div className="col-span-1 sm:col-span-1 text-right">BALLS</div>
            <div className="col-span-1 sm:col-span-1 text-right">4s</div>
            <div className="col-span-1 sm:col-span-1 text-right">6s</div>
            <div className="col-span-2 sm:col-span-2 text-right">S / RATE</div>
          </div>

          {/* Table Rows */}
          {batsmen.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono">
              No batsmen recorded for this innings yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {batsmen.map((b, index) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                const srNum = parseFloat(sr);
                const isNotOut = !b.isOut;
                const isTopScorer = topScorer && topScorer.name === b.name && topScorer.runs > 0;
                const photo = match.playerPhotos?.[b.name.toLowerCase().trim()];

                return (
                  <div
                    key={b.name + index}
                    className={`grid grid-cols-12 items-center py-2.5 px-4 text-xs font-mono transition-colors ${
                      isNotOut ? 'bg-amber-500/[0.07] hover:bg-amber-500/[0.12]' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Batsman Name & Dismissal */}
                    <div className="col-span-5 sm:col-span-5 flex items-center gap-3 min-w-0 pr-2">
                      {/* Avatar / Photo */}
                      <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/15 overflow-hidden flex items-center justify-center font-bold text-slate-300 shrink-0 text-xs shadow">
                        {photo ? (
                          <img src={photo} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{b.name.charAt(0)}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-sm tracking-tight truncate ${isNotOut ? 'text-white' : 'text-slate-200'}`}>
                            {b.name}
                          </span>
                          {isNotOut && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-black text-[9px] border border-amber-400/40">
                              * NOT OUT
                            </span>
                          )}
                          {isTopScorer && (
                            <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-black text-[9px] flex items-center gap-0.5 border border-orange-500/40">
                              <Flame size={10} /> TOP SCORER
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
                          {isNotOut ? (
                            <span className="text-emerald-400 font-semibold">batting</span>
                          ) : (
                            <span>{b.outMode || 'b Bowler'}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Runs */}
                    <div className="col-span-2 sm:col-span-2 text-right">
                      <span className="text-base lg:text-lg font-black text-amber-400">
                        {b.runs}
                      </span>
                    </div>

                    {/* Balls */}
                    <div className="col-span-1 sm:col-span-1 text-right text-slate-300 font-semibold">
                      {b.balls}
                    </div>

                    {/* 4s */}
                    <div className="col-span-1 sm:col-span-1 text-right text-slate-300">
                      {b.fours}
                    </div>

                    {/* 6s */}
                    <div className="col-span-1 sm:col-span-1 text-right text-amber-300 font-bold">
                      {b.sixes}
                    </div>

                    {/* Strike Rate */}
                    <div className="col-span-2 sm:col-span-2 text-right">
                      <span className={`font-bold ${
                        srNum >= 200 ? 'text-purple-400 font-black' :
                        srNum >= 150 ? 'text-emerald-400 font-black' :
                        srNum >= 100 ? 'text-sky-400' : 'text-slate-400'
                      }`}>
                        {sr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER METRICS & DETAILS */}
      <div className="relative z-10 pt-3 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
        {/* Boundary Breakdown Card */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">
                BOUNDARY RUNS
              </span>
              <span className="text-sm font-black text-white">
                {boundaryRuns} runs ({boundaryPercentage}%)
              </span>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div>4s: <strong className="text-white">{totalFours}</strong> ({totalFours * 4})</div>
            <div>6s: <strong className="text-amber-400">{totalSixes}</strong> ({totalSixes * 6})</div>
          </div>
        </div>

        {/* Fall of Wickets Timeline */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">
            FALL OF WICKETS
          </span>
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-[10px] whitespace-nowrap scrollbar-none">
            {fallOfWickets.length === 0 ? (
              <span className="text-slate-500">No wickets fallen yet</span>
            ) : (
              fallOfWickets.map((fow, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                  <strong className="text-amber-400">{fow.wicketNo}-{fow.score}</strong> ({fow.batsmanName?.split(' ')[0]}, {fow.oversList} ov)
                </span>
              ))
            )}
          </div>
        </div>

        {/* Yet to Bat Squad List */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 min-w-0">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">
            YET TO BAT ({yetToBat.length})
          </span>
          <div className="text-[10px] text-slate-300 truncate mt-1">
            {yetToBat.length > 0 ? yetToBat.join(', ') : 'All batsmen have batted'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
