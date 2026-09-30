import React, { useState, useMemo } from 'react';
import { Crown, Sparkles, Trophy, Flame, ShieldCheck, Info, ChevronDown, ChevronUp, Award, Zap } from 'lucide-react';

export interface MvpPlayerEntry {
  name: string;
  team: string;
  isOnCrease: boolean;
  isCurrentBowler: boolean;
  // Batting stats
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  strikeRate: number;
  // Bowling stats
  ballsBowled: number;
  oversStr: string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  // Fielding stats
  catches: number;
  runOuts: number;
  stumpings: number;
  // Impact points breakdown
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
  totalPoints: number;
  primaryRole: 'All-Rounder' | 'Batting Star' | 'Strike Bowler' | 'Fielding Ace';
}

function formatOversFromBalls(balls: number): string {
  const b = Math.max(0, Math.floor(Number(balls) || 0));
  return `${Math.floor(b / 6)}.${b % 6}`;
}

/**
 * Computes CricHeroes-style Live Match MVP & Player Impact Points across both innings
 */
export function calculateMatchMvpLeaderboard(match: any): MvpPlayerEntry[] {
  if (!match) return [];

  const playerMap = new Map<string, {
    name: string;
    team: string;
    isOnCrease: boolean;
    isCurrentBowler: boolean;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    batted: boolean;
    isOut: boolean;
    ballsBowled: number;
    maidens: number;
    runsConceded: number;
    wickets: number;
    catches: number;
    runOuts: number;
    stumpings: number;
  }>();

  const normalizeKey = (rawName?: string) => (rawName || '').trim().toLowerCase();

  const getOrInit = (rawName: string, defaultTeam: string) => {
    const cleanName = (rawName || '').trim();
    const key = normalizeKey(cleanName);
    if (!playerMap.has(key)) {
      playerMap.set(key, {
        name: cleanName,
        team: defaultTeam,
        isOnCrease: false,
        isCurrentBowler: false,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        batted: false,
        isOut: false,
        ballsBowled: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        catches: 0,
        runOuts: 0,
        stumpings: 0
      });
    }
    const existing = playerMap.get(key)!;
    if (!existing.team && defaultTeam) {
      existing.team = defaultTeam;
    }
    return existing;
  };

  const processInnings = (inn: any, isCurrentActiveInnings: boolean) => {
    if (!inn) return;
    const batTeam = inn.battingTeam || match.teamA || 'Team A';
    const bowlTeam = inn.bowlingTeam || (batTeam === match.teamA ? match.teamB : match.teamA) || 'Team B';

    const batsmen = Array.isArray(inn.batsmen) ? inn.batsmen : [];
    batsmen.forEach((b: any, idx: number) => {
      if (!b || !b.name) return;
      const hasParticipated =
        (Number(b.runs) || 0) > 0 ||
        (Number(b.balls) || 0) > 0 ||
        Boolean(b.isOut) ||
        (isCurrentActiveInnings && (idx === inn.strikerIndex || idx === inn.nonStrikerIndex));
      if (!hasParticipated) return;

      const entry = getOrInit(b.name, batTeam);
      entry.team = batTeam;
      entry.batted = true;
      entry.runs += Number(b.runs) || 0;
      entry.balls += Number(b.balls) || 0;
      entry.fours += Number(b.fours) || 0;
      entry.sixes += Number(b.sixes) || 0;
      if (b.isOut) entry.isOut = true;
      if (
        isCurrentActiveInnings &&
        match.status !== 'completed' &&
        !b.isOut &&
        (idx === inn.strikerIndex || idx === inn.nonStrikerIndex)
      ) {
        entry.isOnCrease = true;
      }

      // Extract fielding credits from dismissal string (`howOut`)
      const howOutStr = String(b.howOut || '').trim();
      if (howOutStr && b.isOut) {
        // Caught & Bowled: c & b Bowler
        const cAndB = howOutStr.match(/^c\s*&\s*b\s+(.+)$/i);
        if (cAndB && cAndB[1]) {
          const fEntry = getOrInit(cAndB[1].trim(), bowlTeam);
          fEntry.catches += 1;
        } else {
          // Standard catch: c Fielder b Bowler
          const catchMatch = howOutStr.match(/^c\s+(.+?)\s+b\s+/i);
          if (catchMatch && catchMatch[1] && !/sub\b/i.test(catchMatch[1])) {
            const fEntry = getOrInit(catchMatch[1].trim(), bowlTeam);
            fEntry.catches += 1;
          }
        }

        // Stumping: st Keeper b Bowler
        const stMatch = howOutStr.match(/^st\s+(.+?)\s+b\s+/i);
        if (stMatch && stMatch[1]) {
          const kEntry = getOrInit(stMatch[1].trim(), bowlTeam);
          kEntry.stumpings += 1;
        }

        // Run out: run out (Fielder)
        const roMatch = howOutStr.match(/run\s*out\s*\(([^)]+)\)/i);
        if (roMatch && roMatch[1]) {
          const fName = roMatch[1].split('/')[0].trim();
          if (fName) {
            const rEntry = getOrInit(fName, bowlTeam);
            rEntry.runOuts += 1;
          }
        }
      }
    });

    // Also scan commentaryList for explicit fielder catch mentions if not in howOut
    const commList = Array.isArray(inn.commentaryList) ? inn.commentaryList : [];
    for (const c of commList) {
      const desc = String(c?.description || '');
      const catchByMatch = desc.match(/Catch taken cleanly by\s+([^)]+)\)/i);
      if (catchByMatch && catchByMatch[1]) {
        const fName = catchByMatch[1].trim();
        const fKey = normalizeKey(fName);
        const existing = playerMap.get(fKey);
        if (!existing || existing.catches === 0) {
          const fEntry = getOrInit(fName, bowlTeam);
          fEntry.catches = Math.max(1, fEntry.catches);
        }
      }
    }

    const bowlers = Array.isArray(inn.bowlers) ? inn.bowlers : [];
    bowlers.forEach((bw: any, idx: number) => {
      if (!bw || !bw.name) return;
      const bBalls = Number(bw.ballsBowled) || 0;
      const bWkts = Number(bw.wickets) || 0;
      const bRuns = Number(bw.runsConceded) || 0;
      if (bBalls === 0 && bWkts === 0 && bRuns === 0) return;

      const entry = getOrInit(bw.name, bowlTeam);
      if (!entry.batted) entry.team = bowlTeam;
      entry.ballsBowled += bBalls;
      entry.maidens += Number(bw.maidens) || 0;
      entry.runsConceded += bRuns;
      entry.wickets += bWkts;
      if (isCurrentActiveInnings && match.status !== 'completed' && idx === inn.currentBowlerIndex) {
        entry.isCurrentBowler = true;
      }
    });
  };

  const activeInnNum = match.currentInningsNum || 1;
  processInnings(match.innings1, activeInnNum === 1);
  processInnings(match.innings2, activeInnNum === 2);

  const results: MvpPlayerEntry[] = [];

  for (const p of playerMap.values()) {
    const sr = p.balls > 0 ? (p.runs / p.balls) * 100 : 0;
    const oversFloat = p.ballsBowled > 0 ? p.ballsBowled / 6 : 0;
    const econ = oversFloat > 0 ? p.runsConceded / oversFloat : 0;

    // 1. Batting Impact Points (CricHeroes-inspired transparent formula)
    let batPts = 0;
    if (p.runs > 0 || p.balls > 0) {
      batPts += p.runs * 1.0; // 1 pt per run
      batPts += p.fours * 1.0; // +1 bonus per 4
      batPts += p.sixes * 2.0; // +2 bonus per 6

      // Milestone bonus
      if (p.runs >= 100) batPts += 25;
      else if (p.runs >= 50) batPts += 15;
      else if (p.runs >= 30) batPts += 8;
      else if (p.runs >= 20) batPts += 4;

      // Strike rate bonus (if faced >= 6 balls or scored >= 12 runs)
      if (p.balls >= 6 || p.runs >= 12) {
        if (sr >= 220) batPts += 10;
        else if (sr >= 175) batPts += 7;
        else if (sr >= 140) batPts += 4;
        else if (sr >= 115) batPts += 2;
        else if (sr < 75 && p.balls >= 8 && p.fours === 0 && p.sixes === 0) {
          batPts = Math.max(0, batPts - 2);
        }
      }

      // Unbeaten bonus when scoring 15+
      if (!p.isOut && p.runs >= 15) {
        batPts += 3;
      }
    }

    // 2. Bowling Impact Points
    let bowlPts = 0;
    if (p.ballsBowled > 0 || p.wickets > 0) {
      bowlPts += p.wickets * 20.0; // 20 pts per wicket
      bowlPts += p.maidens * 12.0; // 12 pts per maiden

      // Multi-wicket haul bonus
      if (p.wickets >= 5) bowlPts += 30;
      else if (p.wickets >= 3) bowlPts += 16;
      else if (p.wickets === 2) bowlPts += 8;

      // Economy rate bonus (min 6 legal balls)
      if (p.ballsBowled >= 6) {
        if (econ <= 4.5) bowlPts += 12;
        else if (econ <= 6.5) bowlPts += 8;
        else if (econ <= 8.0) bowlPts += 4;
        else if (econ > 12.5 && p.wickets === 0) {
          bowlPts = Math.max(0, bowlPts - 3);
        }
      }
    }

    // 3. Fielding Impact Points
    const fieldPts = p.catches * 10.0 + p.runOuts * 12.0 + p.stumpings * 12.0;

    const totalPts = Number((batPts + bowlPts + fieldPts).toFixed(1));
    if (totalPts <= 0 && p.balls === 0 && p.ballsBowled === 0) continue;

    let primaryRole: MvpPlayerEntry['primaryRole'] = 'Batting Star';
    if (batPts >= 12 && bowlPts >= 15) {
      primaryRole = 'All-Rounder';
    } else if (bowlPts > batPts && bowlPts >= fieldPts) {
      primaryRole = 'Strike Bowler';
    } else if (fieldPts > batPts && fieldPts > bowlPts) {
      primaryRole = 'Fielding Ace';
    }

    results.push({
      name: p.name,
      team: p.team,
      isOnCrease: p.isOnCrease,
      isCurrentBowler: p.isCurrentBowler,
      runs: p.runs,
      balls: p.balls,
      fours: p.fours,
      sixes: p.sixes,
      isOut: p.isOut,
      strikeRate: Number(sr.toFixed(1)),
      ballsBowled: p.ballsBowled,
      oversStr: formatOversFromBalls(p.ballsBowled),
      maidens: p.maidens,
      runsConceded: p.runsConceded,
      wickets: p.wickets,
      economy: Number(econ.toFixed(2)),
      catches: p.catches,
      runOuts: p.runOuts,
      stumpings: p.stumpings,
      battingPoints: Number(batPts.toFixed(1)),
      bowlingPoints: Number(bowlPts.toFixed(1)),
      fieldingPoints: Number(fieldPts.toFixed(1)),
      totalPoints: totalPts,
      primaryRole
    });
  }

  return results.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.runs !== a.runs) return b.runs - a.runs;
    return b.wickets - a.wickets;
  });
}

export const MatchMvpLeaderboardCard: React.FC<{
  match: any;
  compact?: boolean;
}> = ({ match, compact = false }) => {
  const [teamFilter, setTeamFilter] = useState<'all' | 'teamA' | 'teamB'>('all');
  const [showAllPlayers, setShowAllPlayers] = useState(false);
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  const allRankings = useMemo(() => calculateMatchMvpLeaderboard(match), [match]);

  const filteredRankings = useMemo(() => {
    if (teamFilter === 'teamA') {
      return allRankings.filter(p => p.team === match?.teamA);
    }
    if (teamFilter === 'teamB') {
      return allRankings.filter(p => p.team === match?.teamB);
    }
    return allRankings;
  }, [allRankings, teamFilter, match?.teamA, match?.teamB]);

  if (!match || allRankings.length === 0) {
    return null;
  }

  const leader = filteredRankings[0] || allRankings[0];
  const maxPoints = Math.max(1, leader?.totalPoints || 1);
  const visibleLimit = showAllPlayers ? filteredRankings.length : compact ? 5 : 6;
  const displayedContenders = filteredRankings.slice(1, visibleLimit);

  const getInitials = (name: string) => {
    const parts = (name || 'P').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0] || 'P').slice(0, 2).toUpperCase();
  };

  const getRoleBadgeStyle = (role: MvpPlayerEntry['primaryRole']) => {
    switch (role) {
      case 'All-Rounder':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30';
      case 'Strike Bowler':
        return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30';
      case 'Fielding Ace':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.25rem] p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              {match.status === 'completed' ? 'FINAL MATCH MVP STANDINGS' : 'LIVE MATCH MVP • PLAYER IMPACT'}
            </span>
            <button
              type="button"
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="text-[9px] font-bold text-slate-400 hover:text-emerald-500 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
            >
              <Info className="w-3 h-3" />
              {showFormulaInfo ? 'Hide Formula' : 'How MVP Points Work'}
            </button>
          </div>
          <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <span>⭐ Most Valuable Player (MVP) Tracker</span>
          </h4>
        </div>

        {/* Team Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTeamFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-none cursor-pointer transition-all ${
              teamFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            All ({allRankings.length})
          </button>
          <button
            type="button"
            onClick={() => setTeamFilter('teamA')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-none cursor-pointer transition-all truncate max-w-[110px] ${
              teamFilter === 'teamA'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {match.teamA}
          </button>
          <button
            type="button"
            onClick={() => setTeamFilter('teamB')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-none cursor-pointer transition-all truncate max-w-[110px] ${
              teamFilter === 'teamB'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            {match.teamB}
          </button>
        </div>
      </div>

      {/* Expandable Transparent Scoring Formula Info Drawer */}
      {showFormulaInfo && (
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 text-[10px] space-y-2 animate-fade-in">
          <div className="font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center justify-between">
            <span>📊 Live Player Impact Point System</span>
            <span className="text-emerald-500 font-mono">Real-Time Ball-by-Ball</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <strong className="text-emerald-600 dark:text-emerald-400 block mb-0.5">🏏 Batting Impact</strong>
              1 pt/run • +1 per 4 • +2 per 6 • Strike Rate bonus (+2 to +10) • 30/50/100 milestone bonuses (+8/+15/+25).
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <strong className="text-cyan-600 dark:text-cyan-400 block mb-0.5">🎯 Bowling Impact</strong>
              20 pts/wicket • +12 per Maiden • 2W/3W/5W haul bonuses (+8/+16/+30) • Economy bonus (+4 to +12).
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <strong className="text-amber-600 dark:text-amber-400 block mb-0.5">🧤 Fielding Impact</strong>
              +10 pts per Catch • +12 pts per Run Out • +12 pts per Stumping.
            </div>
          </div>
        </div>
      )}

      {/* #1 MVP Leader Spotlight Hero Card */}
      {leader && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-500/40 p-4 sm:p-5 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar Initials + #1 Crown */}
              <div className="relative shrink-0">
                <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-base sm:text-lg shadow-lg">
                  {getInitials(leader.name)}
                </div>
                <span className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[8.5px] uppercase tracking-wider shadow-xs flex items-center gap-0.5">
                  👑 #1
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h5 className="font-black text-base sm:text-lg text-white truncate">
                    {leader.name}
                  </h5>
                  <span className="text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 text-amber-300 border border-amber-400/30">
                    {leader.team}
                  </span>
                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(leader.primaryRole)}`}>
                    {leader.primaryRole}
                  </span>
                  {leader.isOnCrease && (
                    <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 animate-pulse">
                      🏏 Batting Now
                    </span>
                  )}
                  {leader.isCurrentBowler && (
                    <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 animate-pulse">
                      🎯 Bowling Now
                    </span>
                  )}
                </div>

                {/* Performance Summary Pills */}
                <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-200">
                  {(leader.runs > 0 || leader.balls > 0) && (
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                      🏏 {leader.runs}{!leader.isOut ? '*' : ''} ({leader.balls}b • {leader.fours}x4, {leader.sixes}x6 • SR {leader.strikeRate})
                    </span>
                  )}
                  {(leader.ballsBowled > 0 || leader.wickets > 0) && (
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold">
                      🎯 {leader.wickets}/{leader.runsConceded} ({leader.oversStr} ov • Econ {leader.economy})
                    </span>
                  )}
                  {(leader.catches > 0 || leader.runOuts > 0 || leader.stumpings > 0) && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                      🧤 {leader.catches > 0 ? `${leader.catches} Ct ` : ''}
                      {leader.runOuts > 0 ? `${leader.runOuts} RO ` : ''}
                      {leader.stumpings > 0 ? `${leader.stumpings} St` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total MVP Points Box */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-slate-950/80 px-3.5 py-2.5 rounded-2xl border border-amber-500/30 shrink-0">
              <span className="text-[8px] font-black uppercase tracking-widest text-amber-400">
                MVP IMPACT SCORE
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono font-black text-2xl sm:text-3xl text-amber-400">
                  {leader.totalPoints}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase">PTS</span>
              </div>
              <div className="flex items-center gap-2 text-[8.5px] font-mono text-slate-300 mt-0.5">
                <span className="text-emerald-400">Bat: {leader.battingPoints}</span>
                <span>•</span>
                <span className="text-cyan-400">Bowl: {leader.bowlingPoints}</span>
                {leader.fieldingPoints > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-300">Fld: {leader.fieldingPoints}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 3-Pillar Proportional Impact Bar */}
          <div className="mt-3.5 pt-2.5 border-t border-white/10 space-y-1">
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
              {leader.battingPoints > 0 && (
                <div
                  style={{ width: `${(leader.battingPoints / maxPoints) * 100}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Batting: ${leader.battingPoints} pts`}
                />
              )}
              {leader.bowlingPoints > 0 && (
                <div
                  style={{ width: `${(leader.bowlingPoints / maxPoints) * 100}%` }}
                  className="bg-cyan-400 h-full transition-all duration-500"
                  title={`Bowling: ${leader.bowlingPoints} pts`}
                />
              )}
              {leader.fieldingPoints > 0 && (
                <div
                  style={{ width: `${(leader.fieldingPoints / maxPoints) * 100}%` }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title={`Fielding: ${leader.fieldingPoints} pts`}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ranked Contenders List (#2 onwards) */}
      {displayedContenders.length > 0 && (
        <div className="space-y-2">
          {displayedContenders.map((player, idx) => {
            const rank = idx + 2;
            const barWidthPct = Math.min(100, Math.max(8, Math.round((player.totalPoints / maxPoints) * 100)));

            return (
              <div
                key={`${player.team}-${player.name}-${rank}`}
                className="p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200/70 dark:border-slate-800/90 hover:border-amber-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                        rank === 2
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                          : rank === 3
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      #{rank}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {player.name}
                        </span>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {player.team}
                        </span>
                        <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(player.primaryRole)}`}>
                          {player.primaryRole}
                        </span>
                        {player.isOnCrease && (
                          <span className="text-[7px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                            Batting*
                          </span>
                        )}
                      </div>

                      {/* Mini Stat Line */}
                      <div className="flex items-center gap-2 flex-wrap text-[9.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {(player.runs > 0 || player.balls > 0) && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            🏏 {player.runs}{!player.isOut ? '*' : ''}({player.balls}b)
                          </span>
                        )}
                        {(player.ballsBowled > 0 || player.wickets > 0) && (
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                            🎯 {player.wickets}/{player.runsConceded} ({player.oversStr})
                          </span>
                        )}
                        {(player.catches > 0 || player.runOuts > 0 || player.stumpings > 0) && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            🧤 {player.catches > 0 ? `${player.catches}Ct ` : ''}
                            {player.runOuts > 0 ? `${player.runOuts}RO ` : ''}
                            {player.stumpings > 0 ? `${player.stumpings}St` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side Points & Breakdown */}
                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-sm sm:text-base text-slate-900 dark:text-white">
                      {player.totalPoints} <span className="text-[8.5px] text-amber-500 font-bold">PTS</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[8px] font-mono text-slate-400">
                      {player.battingPoints > 0 && <span>Bat:{player.battingPoints}</span>}
                      {player.bowlingPoints > 0 && <span>Bwl:{player.bowlingPoints}</span>}
                      {player.fieldingPoints > 0 && <span>Fld:{player.fieldingPoints}</span>}
                    </div>
                  </div>
                </div>

                {/* Relative Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${barWidthPct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 transition-all duration-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show All / Collapse Toggle Button */}
      {filteredRankings.length > (compact ? 5 : 6) && (
        <button
          type="button"
          onClick={() => setShowAllPlayers(!showAllPlayers)}
          className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-950 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          {showAllPlayers ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show Top {compact ? 5 : 6} MVP Contenders
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> View Full Match MVP Table ({filteredRankings.length} Players)
            </>
          )}
        </button>
      )}
    </div>
  );
};
