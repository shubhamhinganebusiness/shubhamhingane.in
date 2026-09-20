import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  X, Sparkles, Maximize2, Minimize2, 
  Flame, Target, ChevronRight, Shield, Zap
} from 'lucide-react';
import { MatchState, Innings, Bowler } from './CricketFullScreenTransitions';
import { getStarTVThemeTokens, isStarTVThemeActive } from './StarTVThemeTokens';

interface BowlingSummaryOverlayProps {
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

export const BowlingSummaryOverlay: React.FC<BowlingSummaryOverlayProps> = ({
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

  // Notice: Bowling team is the OPPOSITE of the batting team!
  const battingTeam = inn?.battingTeam || (selectedInningsNum === 1 ? match.teamA : match.teamB);
  const bowlingTeam = inn?.bowlingTeam || (selectedInningsNum === 1 ? match.teamB : match.teamA);
  const bowlingLogo = bowlingTeam === match.teamA ? match.teamALogo : match.teamBLogo;

  const runs = inn?.runs ?? 0;
  const wickets = inn?.wickets ?? 0;
  const ballsBowled = inn?.ballsBowled ?? 0;
  const oversStr = formatOvers(ballsBowled);
  const crr = ballsBowled > 0 ? ((runs / ballsBowled) * 6).toFixed(2) : '0.00';

  const bowlers: Bowler[] = inn?.bowlers || [];
  const extras = inn?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
  const bowlerExtras = (extras.wides || 0) + (extras.noBalls || 0);

  // Sort bowlers to find the best bowler (most wickets, then lowest runs conceded)
  const bestBowler = useMemo(() => {
    if (!bowlers.length) return null;
    return [...bowlers].sort((a, b) => {
      if ((b.wickets || 0) !== (a.wickets || 0)) {
        return (b.wickets || 0) - (a.wickets || 0);
      }
      return (a.runsConceded || 0) - (b.runsConceded || 0);
    })[0];
  }, [bowlers]);

  // Total maidens & dots estimate
  const totalMaidens = useMemo(() => bowlers.reduce((acc, b) => acc + (b.maidens || 0), 0), [bowlers]);

  // ==========================================
  // 1. MINI BOWLING SUMMARY (Broadcast Lower-Third Card)
  // ==========================================
  if (currentVariant === 'mini') {
    const topBowlers = bowlers.length > 0 ? bowlers.slice(0, 4) : [];

    return (
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-20 right-6 z-[999] pointer-events-auto select-none"
        style={{ width: '560px', maxWidth: 'calc(100vw - 32px)' }}
        id="bowling-summary-mini-card"
      >
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-[0_15px_45px_rgba(0,0,0,0.85)] text-white">
          {/* Top Decorative Star TV Metallic Header Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-500" />

          {/* Mini Header */}
          <div className="px-4 py-2.5 bg-slate-950/90 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center font-black text-xs text-slate-950 shadow-md shrink-0">
                🎯
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                    {match.tournamentName || 'STAR SPORTS HD'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[8px] font-black uppercase tracking-wider">
                    BOWLING SUMMARY
                  </span>
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white truncate">
                  {bowlingTeam}
                </h3>
              </div>
            </div>

            {/* Total Wickets Capsule & Controls */}
            <div className="flex items-center gap-2">
              <div className="text-right font-mono pr-1">
                <div className="text-base font-black text-cyan-400 leading-none">
                  {wickets} Wkts
                </div>
                <div className="text-[9px] text-slate-400">
                  {oversStr} ov • Econ {crr}
                </div>
              </div>

              {/* Expand to Full Screen Button */}
              <button
                onClick={() => handleToggle('fullscreen')}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                title="Expand to Full Screen Bowling Summary"
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
            {topBowlers.length === 0 ? (
              <div className="text-center py-4 text-slate-400 font-mono text-xs">
                Innings has not started or no bowling data recorded yet.
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 text-[8.5px] font-black uppercase text-slate-400 font-mono px-2 py-0.5 border-b border-white/5">
                  <div className="col-span-5">BOWLER</div>
                  <div className="col-span-2 text-right">O - M</div>
                  <div className="col-span-2 text-right">RUNS</div>
                  <div className="col-span-1 text-right text-cyan-400 font-black">W</div>
                  <div className="col-span-2 text-right">ECON</div>
                </div>

                {topBowlers.map((b, idx) => {
                  const overs = formatOvers(b.ballsBowled);
                  const econ = b.ballsBowled > 0 ? ((b.runsConceded / b.ballsBowled) * 6).toFixed(2) : '0.00';
                  const isCurrent = b.isCurrent || idx === (inn?.currentBowlerIndex ?? -1);

                  return (
                    <div
                      key={b.name + idx}
                      className={`grid grid-cols-12 items-center px-2 py-1.5 rounded-lg transition-colors font-mono ${
                        isCurrent ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5'
                      }`}
                    >
                      <div className="col-span-5 flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="text-[10px] shrink-0">
                          {isCurrent ? '⚡' : '🎯'}
                        </span>
                        <div className="min-w-0">
                          <span className={`font-black truncate block ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {b.name} {isCurrent && <span className="text-cyan-400 font-bold">*</span>}
                          </span>
                          {b.wickets >= 3 && (
                            <span className="text-[7.5px] text-amber-400 font-sans block">
                              🔥 Star Spell
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 text-right text-[10px] text-slate-300">
                        {overs}-{b.maidens}
                      </div>

                      <div className="col-span-2 text-right text-[10px] text-slate-300">
                        {b.runsConceded}
                      </div>

                      <div className="col-span-1 text-right text-xs font-black text-cyan-400">
                        {b.wickets}
                      </div>

                      <div className="col-span-2 text-right text-[10px] font-bold text-slate-300">
                        {econ}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Mini Footer Strip */}
            <div className="pt-2 mt-1 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-slate-400 px-1">
              <div>
                Extras: <span className="text-white font-bold">{bowlerExtras}</span> (wd {extras.wides}, nb {extras.noBalls})
              </div>
              <div className="flex items-center gap-3">
                {bestBowler && (
                  <span>
                    Best: <strong className="text-cyan-300">{bestBowler.name.split(' ')[0]} ({bestBowler.wickets}/{bestBowler.runsConceded})</strong>
                  </span>
                )}
                <button
                  onClick={() => handleToggle('fullscreen')}
                  className="text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer flex items-center gap-0.5"
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
  // 2. FULL SCREEN BOWLING SUMMARY VIEW
  // ==========================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute inset-0 z-[999] bg-gradient-to-br from-slate-950 via-[#031016] to-slate-950 flex flex-col justify-between p-6 lg:p-8 select-none text-white overflow-hidden"
      id="bowling-summary-fullscreen-overlay"
    >
      {/* Background Decorative Broadcast Stadium Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/20 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-teal-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.06),transparent_70%)]" />
      </div>

      {/* TOP BROADCAST HEADER & CONTROLS */}
      <div className="relative z-10 flex flex-wrap justify-between items-center border-b border-white/10 pb-4 gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-600 to-slate-900 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.35)] border border-cyan-400/50">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono flex items-center gap-1">
                <Sparkles size={11} />
                {match.tournamentName || 'STAR SPORTS HD BROADCAST'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[9px] font-black uppercase tracking-wider">
                BOWLING SUMMARY
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white mt-0.5">
              {bowlingTeam} • BOWLING SPELL BREAKDOWN
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
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              1st Inn ({match.innings1?.bowlingTeam || match.teamB})
            </button>
            <button
              onClick={() => setSelectedInningsNum(2)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedInningsNum === 2
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              2nd Inn ({match.innings2?.bowlingTeam || match.teamA})
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

      {/* HERO BOWLING METRIC BAR */}
      <div className="relative z-10 my-3 p-4 lg:p-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-slate-950 border border-cyan-500/30 flex flex-wrap justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-4 text-left min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-500/40 overflow-hidden flex items-center justify-center font-black text-2xl text-cyan-400 shadow-md shrink-0">
            {bowlingLogo ? (
              <img src={bowlingLogo} alt={bowlingTeam} className="w-full h-full object-cover" />
            ) : (
              <span>{bowlingTeam.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
                {bowlingTeam}
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider font-mono">
                BOWLING ATTACK
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400 block mt-0.5">
              Bowling against {battingTeam} • {match.oversLimit} Overs Format • {match.venue || 'International Ground'}
            </span>
          </div>
        </div>

        {/* Big Numbers Group */}
        <div className="flex items-center gap-6 lg:gap-10 font-mono text-right">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-sans">
              WICKETS TAKEN
            </span>
            <div className="text-3xl lg:text-4xl font-black text-cyan-400 tracking-tight leading-none mt-0.5">
              {wickets} <span className="text-slate-400 text-lg">/ {runs} R</span>
            </div>
            <span className="text-xs text-slate-400">
              in {oversStr} overs
            </span>
          </div>

          <div className="hidden sm:block border-l border-white/10 pl-6">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-sans">
              ECONOMY RATE
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">
              {crr}
            </div>
            <span className="text-[10px] text-slate-400">
              Runs Per Over
            </span>
          </div>

          {bestBowler && (
            <div className="border-l border-white/10 pl-6">
              <span className="text-[10px] uppercase tracking-widest text-cyan-400 block font-sans font-bold flex items-center justify-end gap-1">
                <Flame size={11} /> TOP BOWLER
              </span>
              <div className="text-xl lg:text-2xl font-black text-white mt-0.5">
                {bestBowler.wickets}/{bestBowler.runsConceded}
              </div>
              <span className="text-[10px] text-slate-300 block truncate max-w-[140px]">
                {bestBowler.name} ({formatOvers(bestBowler.ballsBowled)} ov)
              </span>
            </div>
          )}

          <div className="hidden md:block border-l border-white/10 pl-6">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 block font-sans">
              BOWLING EXTRAS
            </span>
            <div className="text-2xl font-black text-slate-200 mt-0.5">
              {bowlerExtras}
            </div>
            <span className="text-[9px] text-slate-400 block">
              wides: {extras.wides} • no-balls: {extras.noBalls}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN BOWLING CARD TABLE */}
      <div className="relative z-10 flex-1 overflow-y-auto pr-1 my-1">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-slate-950/90 py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-white/10 font-mono">
            <div className="col-span-4 sm:col-span-4">BOWLER</div>
            <div className="col-span-1 sm:col-span-1 text-right">OVERS</div>
            <div className="col-span-1 sm:col-span-1 text-right">MDN</div>
            <div className="col-span-2 sm:col-span-2 text-right">RUNS</div>
            <div className="col-span-2 sm:col-span-2 text-right text-cyan-400 font-black">WICKETS</div>
            <div className="col-span-2 sm:col-span-2 text-right">ECONOMY</div>
          </div>

          {/* Table Rows */}
          {bowlers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-mono">
              No bowlers recorded for this innings yet.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {bowlers.map((b, index) => {
                const overs = formatOvers(b.ballsBowled);
                const econ = b.ballsBowled > 0 ? ((b.runsConceded / b.ballsBowled) * 6).toFixed(2) : '0.00';
                const econNum = parseFloat(econ);
                const isCurrent = b.isCurrent || index === (inn?.currentBowlerIndex ?? -1);
                const isTop = bestBowler && bestBowler.name === b.name && bestBowler.wickets > 0;
                const photo = match.playerPhotos?.[b.name.toLowerCase().trim()];

                return (
                  <div
                    key={b.name + index}
                    className={`grid grid-cols-12 items-center py-2.5 px-4 text-xs font-mono transition-colors ${
                      isCurrent ? 'bg-cyan-500/[0.08] hover:bg-cyan-500/[0.12]' : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Bowler Name & Status */}
                    <div className="col-span-4 sm:col-span-4 flex items-center gap-3 min-w-0 pr-2">
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
                          <span className={`font-black text-sm tracking-tight truncate ${isCurrent ? 'text-cyan-300' : 'text-slate-200'}`}>
                            {b.name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/30 text-cyan-300 font-black text-[9px] border border-cyan-400/40">
                              ⚡ BOWLING NOW
                            </span>
                          )}
                          {isTop && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black text-[9px] flex items-center gap-0.5 border border-amber-500/40">
                              <Flame size={10} /> BEST SPELL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5 font-sans">
                          Spell: {overs} overs • {b.maidens} maiden{b.maidens === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    {/* Overs */}
                    <div className="col-span-1 sm:col-span-1 text-right text-slate-200 font-bold">
                      {overs}
                    </div>

                    {/* Maidens */}
                    <div className="col-span-1 sm:col-span-1 text-right text-slate-300">
                      {b.maidens}
                    </div>

                    {/* Runs */}
                    <div className="col-span-2 sm:col-span-2 text-right font-semibold text-slate-200">
                      {b.runsConceded}
                    </div>

                    {/* Wickets */}
                    <div className="col-span-2 sm:col-span-2 text-right">
                      <span className="text-base lg:text-lg font-black text-cyan-400">
                        {b.wickets}
                      </span>
                    </div>

                    {/* Economy */}
                    <div className="col-span-2 sm:col-span-2 text-right">
                      <span className={`font-bold ${
                        econNum <= 6.0 ? 'text-emerald-400 font-black' :
                        econNum <= 8.5 ? 'text-sky-300' : 'text-rose-400'
                      }`}>
                        {econ}
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
        {/* Maidens & Control Card */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              🎯
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">
                MAIDENS BOWLED
              </span>
              <span className="text-sm font-black text-white">
                {totalMaidens} Maiden Over{totalMaidens === 1 ? '' : 's'}
              </span>
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div>Attack Size: <strong className="text-white">{bowlers.length} Bowlers</strong></div>
            <div>Balls: <strong className="text-cyan-300">{ballsBowled}</strong></div>
          </div>
        </div>

        {/* Best Figures Card */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 min-w-0 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-cyan-400 block font-sans font-bold">
              STAR BOWLER OF INNINGS
            </span>
            <div className="text-sm font-black text-white truncate mt-0.5">
              {bestBowler ? bestBowler.name : 'No bowler yet'}
            </div>
          </div>
          {bestBowler && (
            <div className="text-right font-mono">
              <div className="text-sm font-black text-cyan-400">
                {bestBowler.wickets} for {bestBowler.runsConceded}
              </div>
              <div className="text-[9px] text-slate-400">
                {formatOvers(bestBowler.ballsBowled)} ov
              </div>
            </div>
          )}
        </div>

        {/* Extras & Penalty Card */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/10 min-w-0 flex items-center justify-between">
          <div>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-sans">
              EXTRAS CONCEDED
            </span>
            <div className="text-sm font-black text-slate-200 mt-0.5">
              {bowlerExtras} extras
            </div>
          </div>
          <div className="text-right text-[10px] text-slate-400">
            <div>Wides: <strong className="text-white">{extras.wides}</strong></div>
            <div>No Balls: <strong className="text-white">{extras.noBalls}</strong></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
