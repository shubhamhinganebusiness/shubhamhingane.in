import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, TrendingUp, Activity, Users, 
  X, Zap, Target, Shield, Award, ChevronRight, Flame
} from 'lucide-react';

export type AnalyticsTab = 'manhattan' | 'worm' | 'run_rate' | 'partnerships';

interface CommentaryItem {
  id?: string;
  overBall?: string;
  type?: string;
  description?: string;
  runs?: number;
  specialEvent?: string;
  announcementType?: string;
}

interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut?: boolean;
}

interface FallOfWicket {
  wicketNo: number;
  score: number;
  batsmanName: string;
  oversList: string;
}

interface InningsData {
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  ballsBowled: number;
  extras?: {
    wides?: number;
    noBalls?: number;
    byes?: number;
    legByes?: number;
    penalty?: number;
  };
  batsmen?: Batsman[];
  fallOfWickets?: FallOfWicket[];
  commentaryList?: CommentaryItem[];
  history?: Array<{
    over: number;
    overStr: string;
    cumulativeRuns: number;
    cumulativeWickets: number;
  }>;
}

interface MatchData {
  id: string;
  teamA: string;
  teamB: string;
  oversLimit: number;
  targetRuns?: number;
  innings1?: InningsData;
  innings2?: InningsData;
  status?: string;
  tournamentName?: string;
  matchNo?: string;
  venue?: string;
  overlayConfig?: any;
}

interface CricketAnalyticsOverlayProps {
  match: MatchData;
  currentInnings?: InningsData;
  activeGraphic: string; // 'manhattan_graph' | 'worm_graph' | 'run_rate_graph' | 'partnership' | 'partnerships_all'
  onClose: () => void;
  isStarTVTheme?: boolean;
  starTokens?: any;
}

interface OverDataPoint {
  over: number;
  runs: number;
  wickets: number;
  cumulativeRuns: number;
  cumulativeWickets: number;
  runRate: number;
  isCompleted: boolean;
}

interface PartnershipItem {
  wicketNo: number;
  wicketLabel: string;
  batsman1: string;
  batsman1Runs: number;
  batsman1Balls: number;
  batsman2: string;
  batsman2Runs: number;
  batsman2Balls: number;
  totalRuns: number;
  totalBalls: number;
  fowScore: number;
  isCurrent: boolean;
}

export const CricketAnalyticsOverlay: React.FC<CricketAnalyticsOverlayProps> = ({
  match,
  currentInnings,
  activeGraphic,
  onClose,
  isStarTVTheme = true,
  starTokens
}) => {
  // Map initial graphic to tab
  const getInitialTab = (graphic: string): AnalyticsTab => {
    if (graphic.includes('manhattan')) return 'manhattan';
    if (graphic.includes('worm')) return 'worm';
    if (graphic.includes('run_rate') || graphic.includes('rate')) return 'run_rate';
    if (graphic.includes('partnership')) return 'partnerships';
    return 'manhattan';
  };

  const [activeTab, setActiveTab] = useState<AnalyticsTab>(() => getInitialTab(activeGraphic));

  // Determine current active innings and innings number
  const isInnings2 = Boolean(match.innings2 && match.innings2.ballsBowled > 0);
  const activeInn = currentInnings || (isInnings2 ? match.innings2 : match.innings1);
  const totalLimit = match.oversLimit || 20;

  // Primary brand theme tokens
  const teamAColor = isStarTVTheme && starTokens?.teamAColor ? starTokens.teamAColor : '#ea002a';
  const teamBColor = isStarTVTheme && starTokens?.teamBColor ? starTokens.teamBColor : '#00529b';
  const battingColor = isStarTVTheme && starTokens?.battingTeamColor ? starTokens.battingTeamColor : '#38bdf8';

  // Compute detailed over-by-over analysis for any given innings
  const calculateInningsOvers = (inn?: InningsData): OverDataPoint[] => {
    if (!inn) return [];
    const oversCount = Math.max(totalLimit, Math.ceil((inn.ballsBowled || 0) / 6) || 1);
    const result: OverDataPoint[] = [];

    // Group commentary deliveries by over
    const overMap: Record<number, { runs: number; wickets: number; balls: number }> = {};
    for (let o = 0; o < oversCount; o++) {
      overMap[o] = { runs: 0, wickets: 0, balls: 0 };
    }

    const seenDeliveries = new Set<string>();
    (inn.commentaryList || []).forEach(c => {
      if (!c.overBall || c.overBall === '0.0') return;
      if (
        c.type === 'milestone' ||
        c.type === 'announcement' ||
        c.type === 'break' ||
        c.type === 'info'
      ) return;

      if (seenDeliveries.has(c.overBall)) return;
      seenDeliveries.add(c.overBall);

      const parsed = parseFloat(c.overBall);
      if (isNaN(parsed)) return;
      const overIdx = Math.floor(parsed);
      if (overIdx >= oversCount) return;

      let runs = 0;
      if (c.runs !== undefined) {
        runs = c.runs;
      } else if (c.type === 'boundary') {
        runs = (c.description || '').toLowerCase().includes('six') ? 6 : 4;
      } else {
        const matchDigits = (c.description || '').match(/\d+/);
        runs = matchDigits ? parseInt(matchDigits[0], 10) : 0;
      }

      const isWicket = c.type === 'wicket' || (c.description || '').toLowerCase().includes('out') || (c.description || '').toLowerCase().includes('wicket');

      if (!overMap[overIdx]) {
        overMap[overIdx] = { runs: 0, wickets: 0, balls: 0 };
      }
      overMap[overIdx].runs += runs;
      if (isWicket) overMap[overIdx].wickets += 1;
      overMap[overIdx].balls += 1;
    });

    let runningRuns = 0;
    let runningWickets = 0;
    const completedBalls = inn.ballsBowled || 0;

    for (let o = 0; o < oversCount; o++) {
      const overNo = o + 1;
      const overStats = overMap[o] || { runs: 0, wickets: 0, balls: 0 };
      const ballsInThisOver = overStats.balls;
      const isCompleted = completedBalls >= overNo * 6;
      const isBowled = completedBalls > o * 6;

      // If commentary has sparse data, estimate or fallback to history/aggregate if needed
      let overRuns = overStats.runs;
      let overWkts = overStats.wickets;

      // Check if history object has exact checkpoints
      if (inn.history && inn.history.length > 0) {
        const histPoint = inn.history.find(h => Math.round(h.over) === overNo);
        const prevPoint = inn.history.find(h => Math.round(h.over) === o);
        if (histPoint) {
          const prevScore = prevPoint ? prevPoint.cumulativeRuns : 0;
          const prevWkt = prevPoint ? prevPoint.cumulativeWickets : 0;
          overRuns = Math.max(0, histPoint.cumulativeRuns - prevScore);
          overWkts = Math.max(0, histPoint.cumulativeWickets - prevWkt);
        }
      }

      if (isBowled) {
        runningRuns += overRuns;
        runningWickets += overWkts;
      }

      // Smooth sanity bounds
      const capRuns = isBowled ? Math.min(runningRuns, inn.runs || runningRuns) : 0;
      const capWkts = isBowled ? Math.min(runningWickets, inn.wickets || runningWickets) : 0;
      const effectiveOvers = isCompleted ? overNo : (o + (completedBalls % 6) / 6);
      const crr = effectiveOvers > 0 ? (capRuns / effectiveOvers) : 0;

      result.push({
        over: overNo,
        runs: isBowled ? overRuns : 0,
        wickets: isBowled ? overWkts : 0,
        cumulativeRuns: isBowled ? capRuns : 0,
        cumulativeWickets: isBowled ? capWkts : 0,
        runRate: Number(crr.toFixed(2)),
        isCompleted
      });
    }

    return result;
  };

  const overs1 = useMemo(() => calculateInningsOvers(match.innings1), [match.innings1, totalLimit]);
  const overs2 = useMemo(() => calculateInningsOvers(match.innings2), [match.innings2, totalLimit]);
  const activeOvers = isInnings2 ? overs2 : overs1;

  // Max runs scored in any single over for auto-scaling
  const maxOverRuns = useMemo(() => {
    const allRuns = [...overs1.map(o => o.runs), ...overs2.map(o => o.runs)];
    const top = Math.max(...allRuns, 18);
    return Math.ceil(top / 6) * 6; // snap to multiples of 6
  }, [overs1, overs2]);

  // Max cumulative runs for Worm graph scaling
  const maxMatchRuns = useMemo(() => {
    const target = match.targetRuns || 0;
    const inn1Runs = match.innings1?.runs || 0;
    const inn2Runs = match.innings2?.runs || 0;
    const ceiling = Math.max(target, inn1Runs, inn2Runs, 120);
    return Math.ceil((ceiling + 20) / 50) * 50; // snap to 50s
  }, [match]);

  // Innings Partnerships calculation
  const partnerships = useMemo<PartnershipItem[]>(() => {
    const inn = activeInn;
    if (!inn) return [];

    const result: PartnershipItem[] = [];
    const fow = [...(inn.fallOfWickets || [])].sort((a, b) => a.wicketNo - b.wicketNo);
    const batsmen = inn.batsmen || [];

    let prevScore = 0;
    let prevBalls = 0;

    // Build recorded wicket stands
    fow.forEach((w, idx) => {
      const standRuns = Math.max(0, w.score - prevScore);
      const outBatsman = w.batsmanName || `Batsman ${idx + 1}`;
      const partner = batsmen[idx + 1]?.name || batsmen[0]?.name || 'Partner';
      
      const b1 = batsmen.find(b => b.name.toLowerCase() === outBatsman.toLowerCase());
      const b2 = batsmen.find(b => b.name.toLowerCase() === partner.toLowerCase());

      const b1Runs = b1 ? Math.min(b1.runs, standRuns) : Math.round(standRuns * 0.6);
      const b2Runs = Math.max(0, standRuns - b1Runs);

      result.push({
        wicketNo: w.wicketNo,
        wicketLabel: `${w.wicketNo}${getOrdinalSuffix(w.wicketNo)} Wicket`,
        batsman1: outBatsman,
        batsman1Runs: b1Runs,
        batsman1Balls: b1 ? b1.balls : 12,
        batsman2: partner,
        batsman2Runs: b2Runs,
        batsman2Balls: b2 ? b2.balls : 10,
        totalRuns: standRuns,
        totalBalls: 22,
        fowScore: w.score,
        isCurrent: false
      });

      prevScore = w.score;
    });

    // Active ongoing partnership
    const currentStandRuns = Math.max(0, (inn.runs || 0) - prevScore);
    const notOutBatsmen = batsmen.filter(b => !b.isOut).slice(0, 2);
    const striker = notOutBatsmen[0]?.name || batsmen[0]?.name || 'Striker';
    const nonStriker = notOutBatsmen[1]?.name || batsmen[1]?.name || 'Non-Striker';

    const s1 = batsmen.find(b => b.name === striker);
    const s2 = batsmen.find(b => b.name === nonStriker);

    const s1Runs = s1 ? s1.runs : Math.round(currentStandRuns * 0.55);
    const s2Runs = s2 ? s2.runs : Math.max(0, currentStandRuns - s1Runs);

    const activeWicketNo = fow.length + 1;
    result.push({
      wicketNo: activeWicketNo,
      wicketLabel: `${activeWicketNo}${getOrdinalSuffix(activeWicketNo)} Wicket (Active)`,
      batsman1: striker,
      batsman1Runs: s1Runs,
      batsman1Balls: s1 ? s1.balls : 15,
      batsman2: nonStriker,
      batsman2Runs: s2Runs,
      batsman2Balls: s2 ? s2.balls : 12,
      totalRuns: currentStandRuns,
      totalBalls: Math.max(1, (inn.ballsBowled || 0) - prevBalls),
      fowScore: inn.runs || 0,
      isCurrent: true
    });

    return result;
  }, [activeInn]);

  // Overall match analytics pills
  const statsOverview = useMemo(() => {
    const inn = activeInn;
    const totalBalls = inn?.ballsBowled || 0;
    const totalRuns = inn?.runs || 0;
    const oversDecimal = totalBalls > 0 ? (Math.floor(totalBalls / 6) + (totalBalls % 6) / 6) : 0;
    const crr = oversDecimal > 0 ? (totalRuns / oversDecimal).toFixed(2) : '0.00';

    // Powerplay stats (first 6 overs or limit/3)
    const ppLimit = Math.min(6, Math.max(2, Math.floor(totalLimit / 3)));
    const ppOvers = activeOvers.slice(0, ppLimit);
    const ppRuns = ppOvers.reduce((sum, o) => sum + o.runs, 0);
    const ppWickets = ppOvers.reduce((sum, o) => sum + o.wickets, 0);

    // Highest scoring over
    const highestOver = [...activeOvers].sort((a, b) => b.runs - a.runs)[0] || { over: 1, runs: 0 };

    // Required run rate if chasing
    let rrr = '0.00';
    let runsNeeded = 0;
    let ballsRemaining = 0;
    if (isInnings2 && match.targetRuns) {
      runsNeeded = Math.max(0, match.targetRuns - totalRuns);
      ballsRemaining = Math.max(0, (totalLimit * 6) - totalBalls);
      rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : '0.00';
    }

    // Projected scores
    const crrNum = parseFloat(crr) || 6.0;
    const projectedCurrent = Math.round(totalRuns + (crrNum * (ballsRemaining / 6 || (totalLimit - (totalBalls / 6)))));
    const projected8 = Math.round(totalRuns + (8.0 * ((totalLimit * 6 - totalBalls) / 6)));
    const projected10 = Math.round(totalRuns + (10.0 * ((totalLimit * 6 - totalBalls) / 6)));
    const projected12 = Math.round(totalRuns + (12.0 * ((totalLimit * 6 - totalBalls) / 6)));

    return {
      crr,
      rrr,
      runsNeeded,
      ballsRemaining,
      ppRuns,
      ppWickets,
      ppLimit,
      highestOver,
      projectedCurrent,
      projected8,
      projected10,
      projected12
    };
  }, [activeInn, activeOvers, totalLimit, isInnings2, match.targetRuns]);

  function getOrdinalSuffix(n: number): string {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`w-[1180px] max-w-[96vw] h-[640px] max-h-[92vh] bg-slate-950/95 border ${
          isStarTVTheme ? 'border-amber-400/40 shadow-[0_0_50px_rgba(251,191,36,0.15)]' : 'border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.15)]'
        } rounded-[2.5rem] p-7 flex flex-col justify-between pointer-events-auto relative overflow-hidden font-sans select-none text-left`}
      >
        {/* Top Glowing Broadcast Accent Bar */}
        <div 
          className="absolute top-0 inset-x-0 h-1.5 opacity-95 pointer-events-none"
          style={{
            background: isStarTVTheme 
              ? 'linear-gradient(90deg, transparent 0%, #fbbf24 25%, #ea002a 50%, #38bdf8 75%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, #06b6d4 50%, transparent 100%)'
          }}
        />

        {/* BROADCAST HEADER & TAB NAVIGATION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <BarChart2 size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-[9px] font-black uppercase text-rose-300 tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  LIVE TV GRAPHIC
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-widest font-bold">
                  {match.tournamentName || 'GULLY PREMIER LEAGUE'} • {match.venue || 'CENTRAL OVAL'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2 mt-0.5">
                <span>{match.teamA}</span>
                <span className="text-xs text-amber-400 font-mono px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">VS</span>
                <span>{match.teamB}</span>
                <span className="text-xs font-mono font-bold text-slate-400 ml-2">({totalLimit} Ov)</span>
              </h1>
            </div>
          </div>

          {/* Quick Tab Selector Switcher Buttons */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-white/10 shadow-inner">
            {[
              { id: 'manhattan', label: 'Manhattan', icon: <BarChart2 size={13} />, desc: 'Runs / Over' },
              { id: 'worm', label: 'Worm Graph', icon: <TrendingUp size={13} />, desc: 'Progression' },
              { id: 'run_rate', label: 'Run Rate', icon: <Activity size={13} />, desc: 'CRR vs RRR' },
              { id: 'partnerships', label: 'Partnerships', icon: <Users size={13} />, desc: 'Wicket Stands' },
            ].map(tab => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AnalyticsTab)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isCurrent
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                      : 'bg-transparent hover:bg-white/5 text-slate-300 border-transparent'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-2 border border-white/10"
              title="Close Broadcast Graphic (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* MAIN BODY DISPLAY CANVAS */}
        <div className="flex-1 my-4 min-h-0 relative overflow-hidden rounded-2xl bg-slate-900/40 border border-white/5 p-4 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* 1. MANHATTAN GRAPH (RUNS PER OVER BAR CHART) */}
            {activeTab === 'manhattan' && (
              <motion.div
                key="tab-manhattan"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex flex-col justify-between text-left"
              >
                {/* Manhattan Sub-header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono">
                      ★ MANHATTAN BAR TRAJECTORY • RUNS PER OVER
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Powerplay Highlighted • Red Badges = Wickets)
                    </span>
                  </div>

                  {/* Team Legend */}
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm shadow" style={{ backgroundColor: teamAColor }} />
                      <span className="text-white">{match.teamA} (Inn 1: {match.innings1?.runs ?? 0}/{match.innings1?.wickets ?? 0})</span>
                    </div>
                    {isInnings2 && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-sm shadow" style={{ backgroundColor: teamBColor }} />
                        <span className="text-sky-300">{match.teamB} (Inn 2: {match.innings2?.runs ?? 0}/{match.innings2?.wickets ?? 0})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bars Stage Canvas */}
                <div className="flex-1 my-3 flex items-end justify-between gap-2 px-3 pt-6 pb-2 border-b border-white/10 relative">
                  {/* Background Over Grid Horizontal Guidelines */}
                  <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
                    {[maxOverRuns, Math.round(maxOverRuns * 0.66), Math.round(maxOverRuns * 0.33), 0].map((val, idx) => (
                      <div key={idx} className="w-full flex items-center justify-between border-b border-dashed border-white/40 text-[9px] font-mono text-slate-400">
                        <span>{val}r</span>
                        <div className="flex-1 mx-3 border-b border-white/10" />
                        <span>{val}r</span>
                      </div>
                    ))}
                  </div>

                  {/* Render Over Bars */}
                  {Array.from({ length: totalLimit }).map((_, idx) => {
                    const overNo = idx + 1;
                    const o1 = overs1[idx] || { runs: 0, wickets: 0 };
                    const o2 = overs2[idx] || { runs: 0, wickets: 0 };
                    const isPowerplay = overNo <= statsOverview.ppLimit;

                    const heightPct1 = Math.min(100, Math.max(6, (o1.runs / maxOverRuns) * 100));
                    const heightPct2 = Math.min(100, Math.max(6, (o2.runs / maxOverRuns) * 100));

                    return (
                      <div key={overNo} className="flex-1 h-full flex flex-col items-center justify-end relative group">
                        {/* Powerplay Shaded Band */}
                        {isPowerplay && (
                          <div className="absolute inset-x-0 bottom-0 top-0 bg-amber-400/5 rounded-t-lg pointer-events-none border-x border-amber-400/10" />
                        )}

                        {/* Bar Group */}
                        <div className="w-full flex items-end justify-center gap-1 z-10">
                          {/* Team A Bar */}
                          <div className="flex-1 flex flex-col items-center justify-end max-w-[28px]">
                            {/* Wicket Marker */}
                            {o1.wickets > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-rose-600 text-white font-black text-[9px] flex items-center justify-center shadow-lg shadow-rose-600/50 mb-1"
                                title={`${o1.wickets} Wicket(s) fallen in Over ${overNo}`}
                              >
                                {o1.wickets > 1 ? `${o1.wickets}W` : 'W'}
                              </motion.div>
                            )}
                            {/* Runs Number Label */}
                            {o1.runs > 0 && (
                              <span className="text-[10px] font-black font-mono text-white mb-0.5 drop-shadow">
                                {o1.runs}
                              </span>
                            )}
                            {/* Bar Graphic */}
                            <div
                              style={{ height: `${heightPct1}%`, backgroundColor: teamAColor }}
                              className="w-full rounded-t-md transition-all group-hover:brightness-125 shadow-md relative overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/25" />
                            </div>
                          </div>

                          {/* Team B Bar (Innings 2) */}
                          {isInnings2 && (
                            <div className="flex-1 flex flex-col items-center justify-end max-w-[28px]">
                              {/* Wicket Marker */}
                              {o2.wickets > 0 && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center shadow-lg shadow-rose-500/50 mb-1"
                                  title={`${o2.wickets} Wicket(s) in Over ${overNo}`}
                                >
                                  {o2.wickets > 1 ? `${o2.wickets}W` : 'W'}
                                </motion.div>
                              )}
                              {o2.runs > 0 && (
                                <span className="text-[10px] font-black font-mono text-sky-300 mb-0.5 drop-shadow">
                                  {o2.runs}
                                </span>
                              )}
                              <div
                                style={{ height: `${heightPct2}%`, backgroundColor: teamBColor }}
                                className="w-full rounded-t-md transition-all group-hover:brightness-125 shadow-md relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/30" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Over Number Footer Label */}
                        <div className="mt-2 text-center">
                          <span className={`text-[10px] font-mono font-bold block ${isPowerplay ? 'text-amber-400' : 'text-slate-400'}`}>
                            {overNo}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Metrics Row */}
                <div className="grid grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-950/80 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Powerplay Total</span>
                      <span className="text-base font-mono font-black text-amber-400">
                        {statsOverview.ppRuns} runs / {statsOverview.ppWickets} wkts
                      </span>
                    </div>
                    <span className="text-xl">⚡</span>
                  </div>

                  <div className="bg-slate-950/80 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Highest Over</span>
                      <span className="text-base font-mono font-black text-emerald-400">
                        Over {statsOverview.highestOver.over}: {statsOverview.highestOver.runs} runs
                      </span>
                    </div>
                    <span className="text-xl">🚀</span>
                  </div>

                  <div className="bg-slate-950/80 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block">Current Run Rate</span>
                      <span className="text-base font-mono font-black text-sky-400">
                        {statsOverview.crr} RPO
                      </span>
                    </div>
                    <span className="text-xl">📈</span>
                  </div>

                  <div className="bg-slate-950/80 border border-white/5 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase block">
                        {isInnings2 ? 'Required Run Rate' : 'Projected Total'}
                      </span>
                      <span className="text-base font-mono font-black text-rose-400">
                        {isInnings2 ? `${statsOverview.rrr} RPO` : `${statsOverview.projectedCurrent} Runs`}
                      </span>
                    </div>
                    <span className="text-xl">{isInnings2 ? '🎯' : '🔮'}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. WORM GRAPH (CUMULATIVE PROGRESSION CURVE) */}
            {activeTab === 'worm' && (
              <motion.div
                key="tab-worm"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex flex-col justify-between text-left"
              >
                {/* Worm Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono block">
                      ★ RUNS WORM PROGRESSION • INNINGS 1 VS INNINGS 2
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Cumulative total runs progression across overs with wicket checkpoints
                    </span>
                  </div>

                  {/* Legend & Target Badge */}
                  <div className="flex items-center gap-4 text-xs font-mono font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-1.5 rounded-full" style={{ backgroundColor: teamAColor }} />
                      <span className="text-white">{match.teamA} ({match.innings1?.runs ?? 0}/{match.innings1?.wickets ?? 0})</span>
                    </div>
                    {isInnings2 && (
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-1.5 rounded-full" style={{ backgroundColor: teamBColor }} />
                        <span className="text-sky-300">{match.teamB} ({match.innings2?.runs ?? 0}/{match.innings2?.wickets ?? 0})</span>
                      </div>
                    )}
                    {match.targetRuns && (
                      <div className="px-2.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/30 text-amber-300">
                        Target: {match.targetRuns}
                      </div>
                    )}
                  </div>
                </div>

                {/* SVG Curve Plot Canvas */}
                <div className="flex-1 my-2 bg-slate-950/60 rounded-xl border border-white/5 p-4 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 1000 360" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradTeamA" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={teamAColor} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={teamAColor} stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gradTeamB" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={teamBColor} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={teamBColor} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-Axis Horizontal Gridlines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                      const yVal = 310 - pct * 270;
                      const runLabel = Math.round(pct * maxMatchRuns);
                      return (
                        <g key={idx}>
                          <line x1="60" y1={yVal} x2="960" y2={yVal} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="3 3" />
                          <text x="25" y={yVal + 4} fill="#94a3b8" fontSize="11" fontFamily="monospace">{runLabel}</text>
                        </g>
                      );
                    })}

                    {/* Target Line (if 2nd Innings) */}
                    {match.targetRuns && (
                      <g>
                        {(() => {
                          const targetY = 310 - (match.targetRuns / maxMatchRuns) * 270;
                          return (
                            <>
                              <line x1="60" y1={targetY} x2="960" y2={targetY} stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 4" opacity="0.8" />
                              <rect x="850" y={targetY - 18} width="110" height="18" rx="4" fill="#fbbf24" opacity="0.9" />
                              <text x="858" y={targetY - 5} fill="#020617" fontSize="10" fontWeight="bold" fontFamily="monospace">TARGET {match.targetRuns}</text>
                            </>
                          );
                        })()}
                      </g>
                    )}

                    {/* Team A Worm Path (Innings 1) */}
                    {(() => {
                      const pts = [{ x: 60, y: 310 }];
                      overs1.forEach((o, idx) => {
                        if (o.cumulativeRuns === 0 && idx > 0 && overs1[idx - 1].cumulativeRuns === 0) return;
                        const x = 60 + ((idx + 1) / totalLimit) * 900;
                        const y = 310 - (o.cumulativeRuns / maxMatchRuns) * 270;
                        pts.push({ x, y });
                      });

                      const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                      const areaD = `${pathD} L ${pts[pts.length - 1].x} 310 Z`;

                      return (
                        <>
                          <path d={areaD} fill="url(#gradTeamA)" />
                          <path d={pathD} fill="none" stroke={teamAColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Wicket Dots for Innings 1 */}
                          {overs1.map((o, idx) => {
                            if (o.wickets <= 0) return null;
                            const cx = 60 + ((idx + 1) / totalLimit) * 900;
                            const cy = 310 - (o.cumulativeRuns / maxMatchRuns) * 270;
                            return (
                              <g key={idx}>
                                <circle cx={cx} cy={cy} r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                                <text x={cx} y={cy - 10} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  {o.cumulativeRuns}/{o.cumulativeWickets}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* Team B Worm Path (Innings 2) */}
                    {isInnings2 && (() => {
                      const pts = [{ x: 60, y: 310 }];
                      overs2.forEach((o, idx) => {
                        if (o.cumulativeRuns === 0 && idx > 0 && overs2[idx - 1].cumulativeRuns === 0) return;
                        const x = 60 + ((idx + 1) / totalLimit) * 900;
                        const y = 310 - (o.cumulativeRuns / maxMatchRuns) * 270;
                        pts.push({ x, y });
                      });

                      const pathD = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                      const areaD = `${pathD} L ${pts[pts.length - 1].x} 310 Z`;

                      return (
                        <>
                          <path d={areaD} fill="url(#gradTeamB)" />
                          <path d={pathD} fill="none" stroke={teamBColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                          {/* Wicket Dots for Innings 2 */}
                          {overs2.map((o, idx) => {
                            if (o.wickets <= 0) return null;
                            const cx = 60 + ((idx + 1) / totalLimit) * 900;
                            const cy = 310 - (o.cumulativeRuns / maxMatchRuns) * 270;
                            return (
                              <g key={idx}>
                                <circle cx={cx} cy={cy} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                                <text x={cx} y={cy - 10} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                  {o.cumulativeRuns}/{o.cumulativeWickets}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}

                    {/* X-Axis Overs Marks */}
                    {Array.from({ length: totalLimit }).map((_, idx) => {
                      const overNo = idx + 1;
                      const x = 60 + (overNo / totalLimit) * 900;
                      return (
                        <g key={idx}>
                          <line x1={x} y1="310" x2={x} y2="318" stroke="#64748b" strokeWidth="1" />
                          <text x={x} y="332" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="monospace">{overNo}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Footer Worm Insight */}
                <div className="flex items-center justify-between px-2 pt-1 font-mono text-xs text-slate-400">
                  <span>X-Axis: Overs (1 to {totalLimit}) • Y-Axis: Cumulative Runs Scored</span>
                  <span className="text-amber-400 font-bold">
                    Projected Total at Current Run Rate: <strong className="text-white text-sm">{statsOverview.projectedCurrent}</strong>
                  </span>
                </div>
              </motion.div>
            )}

            {/* 3. RUN RATE & PROJECTIONS */}
            {activeTab === 'run_rate' && (
              <motion.div
                key="tab-runrate"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex flex-col justify-between text-left"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono block">
                      ★ RUN RATE COMPARISON & PROJECTED SCORE MATRIX
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Phase analysis, current momentum & projected target calculations
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-bold text-xs">
                      CRR: {statsOverview.crr}
                    </div>
                    {isInnings2 && (
                      <div className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold text-xs">
                        RRR: {statsOverview.rrr}
                      </div>
                    )}
                  </div>
                </div>

                {/* Body: 2 Columns (Phases Breakdown + Projections Table) */}
                <div className="flex-1 my-3 grid grid-cols-12 gap-5">
                  {/* Left Column: Match Phase Breakdown (Powerplay, Middle, Death) */}
                  <div className="col-span-7 bg-slate-950/70 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                      <Flame size={14} className="text-amber-400" />
                      Innings Phase Breakdown & Momentum
                    </span>

                    <div className="space-y-3 my-2">
                      {/* Powerplay Card */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-amber-400 uppercase">Powerplay</span>
                            <span className="text-[9px] font-mono text-slate-400">(Overs 1 - {statsOverview.ppLimit})</span>
                          </div>
                          <span className="text-[11px] text-slate-300 block mt-0.5">
                            {statsOverview.ppRuns} runs • {statsOverview.ppWickets} wickets
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-lg font-black text-amber-300">
                            {((statsOverview.ppRuns / statsOverview.ppLimit) || 0).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-400 block uppercase">Run Rate</span>
                        </div>
                      </div>

                      {/* Middle Overs Card */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-transparent border border-sky-500/20 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-sky-400 uppercase">Middle Overs</span>
                            <span className="text-[9px] font-mono text-slate-400">(Overs {statsOverview.ppLimit + 1} - {Math.max(statsOverview.ppLimit + 1, totalLimit - 4)})</span>
                          </div>
                          <span className="text-[11px] text-slate-300 block mt-0.5">
                            Consolidation & Strike Rotation
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-lg font-black text-sky-300">
                            {statsOverview.crr}
                          </span>
                          <span className="text-[8px] text-slate-400 block uppercase">Run Rate</span>
                        </div>
                      </div>

                      {/* Death Overs Card */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500/10 to-transparent border border-rose-500/20 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-rose-400 uppercase">Death Overs</span>
                            <span className="text-[9px] font-mono text-slate-400">(Last 4 Overs)</span>
                          </div>
                          <span className="text-[11px] text-slate-300 block mt-0.5">
                            Boundary Hitting & Acceleration Zone
                          </span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-lg font-black text-rose-300">
                            10.50
                          </span>
                          <span className="text-[8px] text-slate-400 block uppercase">Target Pace</span>
                        </div>
                      </div>
                    </div>

                    {/* Equation Summary */}
                    {isInnings2 && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-amber-400/20 flex items-center justify-between font-mono text-xs">
                        <span className="text-slate-300">Need <strong className="text-amber-400 font-black">{statsOverview.runsNeeded}</strong> runs from <strong className="text-white font-black">{statsOverview.ballsRemaining}</strong> balls</span>
                        <span className="text-rose-400 font-black">RRR: {statsOverview.rrr}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Projected Final Score Table */}
                  <div className="col-span-5 bg-slate-950/70 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2 mb-3">
                        <Target size={14} className="text-emerald-400" />
                        Projected Score Matrix ({totalLimit} Overs)
                      </span>

                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-white/5 font-mono">
                          <span className="text-xs text-slate-400">At Current Rate ({statsOverview.crr} RPO)</span>
                          <span className="text-lg font-black text-white">{statsOverview.projectedCurrent}</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-white/5 font-mono">
                          <span className="text-xs text-slate-400">At 8.00 Runs / Over</span>
                          <span className="text-lg font-black text-emerald-400">{statsOverview.projected8}</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-white/5 font-mono">
                          <span className="text-xs text-slate-400">At 10.00 Runs / Over</span>
                          <span className="text-lg font-black text-amber-400">{statsOverview.projected10}</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-white/5 font-mono">
                          <span className="text-xs text-slate-400">At 12.00 Runs / Over</span>
                          <span className="text-lg font-black text-rose-400">{statsOverview.projected12}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 text-[10px] font-mono text-slate-500 text-center">
                      Trajectory based on remaining deliveries and boundary frequencies
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-[10px] font-mono text-slate-500 flex justify-between px-2">
                  <span>Star TV Broadcast Intelligence Engine</span>
                  <span className="text-sky-400">Innings Progression Phase 2 of 3</span>
                </div>
              </motion.div>
            )}

            {/* 4. PARTNERSHIPS BREAKDOWN (ACTIVE STAND + ALL WICKET STANCE) */}
            {activeTab === 'partnerships' && (
              <motion.div
                key="tab-partnerships"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full flex flex-col justify-between text-left"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono block">
                      ★ INNINGS PARTNERSHIPS PROFILE • BATTING STANCE CONTRIBUTION
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Active partnership & chronological wicket partnership progression
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
                    BATTING: {activeInn?.battingTeam || ''}
                  </span>
                </div>

                {/* Partnerships Scroll List */}
                <div className="flex-1 my-2 space-y-2.5 overflow-y-auto pr-1">
                  {partnerships.map((p) => {
                    const totalRuns = p.totalRuns || 1;
                    const b1Pct = Math.round((p.batsman1Runs / totalRuns) * 100) || 50;
                    const b2Pct = 100 - b1Pct;

                    return (
                      <div
                        key={p.wicketNo}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          p.isCurrent
                            ? 'bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-slate-950 border-amber-400/40 shadow-lg'
                            : 'bg-slate-950/70 border-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md font-mono ${
                              p.isCurrent ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/10 text-slate-300'
                            }`}>
                              {p.wicketLabel}
                            </span>
                            {!p.isCurrent && (
                              <span className="text-[10px] font-mono text-slate-400">
                                Fell at {p.fowScore} runs
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-lg font-black text-white">{p.totalRuns}</span>
                            <span className="text-xs text-slate-400">runs ({p.totalBalls}b)</span>
                          </div>
                        </div>

                        {/* Batsmen Split Names & Scores */}
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white uppercase">{p.batsman1}</span>
                            <span className="font-mono text-amber-400 font-black">{p.batsman1Runs} <span className="text-[10px] text-slate-400">({p.batsman1Balls}b)</span></span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sky-400 font-black">{p.batsman2Runs} <span className="text-[10px] text-slate-400">({p.batsman2Balls}b)</span></span>
                            <span className="font-bold text-white uppercase">{p.batsman2}</span>
                          </div>
                        </div>

                        {/* Dual-colored Contribution Bar */}
                        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                          <div
                            style={{ width: `${b1Pct}%` }}
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 relative transition-all"
                            title={`${p.batsman1}: ${b1Pct}%`}
                          />
                          <div
                            style={{ width: `${b2Pct}%` }}
                            className="h-full bg-gradient-to-r from-sky-400 to-sky-500 relative transition-all"
                            title={`${p.batsman2}: ${b2Pct}%`}
                          />
                        </div>

                        {/* Percentage breakdown */}
                        <div className="flex justify-between text-[8.5px] font-mono text-slate-400 mt-1">
                          <span>{b1Pct}% of stand</span>
                          <span>{b2Pct}% of stand</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-2 pt-1 font-mono text-xs text-slate-400 border-t border-white/5">
                  <span>Total Inning Score: <strong className="text-white">{activeInn?.runs ?? 0}/{activeInn?.wickets ?? 0}</strong> ({activeInn ? Math.floor(activeInn.ballsBowled / 6) + '.' + (activeInn.ballsBowled % 6) : '0.0'} ov)</span>
                  <span className="text-amber-400">Gold = Batter 1 • Blue = Batter 2</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM STATUS FOOTER BAR */}
        <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 uppercase font-bold">OBS / VMIX READY • BROADCAST 1080P</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">ESC</kbd> or Click Close to return to Scorebug</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
