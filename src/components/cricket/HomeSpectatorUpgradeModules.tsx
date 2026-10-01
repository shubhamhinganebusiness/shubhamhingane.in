import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Trophy,
  Flame,
  Crown,
  Sparkles,
  Calendar,
  Clock,
  Radio,
  Award,
  FileText,
  Download,
  Share2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  CheckCircle2,
  BarChart3,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculateMatchMvpLeaderboard, MvpPlayerEntry } from './MatchMvpLeaderboardCard';
import { calculateWinProbabilityDetails } from './modules/winProbabilityEngine';
import { getCommentaryText, CommentaryLanguage } from './modules/commentaryLanguage';

export type HomeMatchStatusFilter = 'all' | 'live' | 'upcoming' | 'completed';

export type SpectatorTargetTab =
  | 'arena'
  | 'scorecard'
  | 'overs'
  | 'highlights'
  | 'points-table'
  | 'standing'
  | 'sponsors-prizes';

/**
 * Helper to check if a match matches the search query and tournament filter
 */
export function filterMatchByQueryAndTournament(
  match: any,
  searchQuery: string,
  tournamentFilter: string
): boolean {
  if (!match) return false;

  // Tournament filter check
  if (tournamentFilter && tournamentFilter !== 'all') {
    const tName = (match.tournamentName || '').trim().toLowerCase();
    const tId = String(match.tournamentId || '').trim().toLowerCase();
    const filterNorm = tournamentFilter.trim().toLowerCase();
    if (tName !== filterNorm && tId !== filterNorm) {
      return false;
    }
  }

  // Search query check
  const q = (searchQuery || '').trim().toLowerCase();
  if (!q) return true;

  const teamA = (match.teamA || '').toLowerCase();
  const teamB = (match.teamB || '').toLowerCase();
  const tourName = (match.tournamentName || '').toLowerCase();
  const venue = (match.groundName || match.venue || match.ground || '').toLowerCase();
  const dateStr = (match.date || '').toLowerCase();
  const winnerStr = (match.winner || '').toLowerCase();
  const momStr = (match.manOfTheMatch || '').toLowerCase();

  if (
    teamA.includes(q) ||
    teamB.includes(q) ||
    tourName.includes(q) ||
    venue.includes(q) ||
    dateStr.includes(q) ||
    winnerStr.includes(q) ||
    momStr.includes(q)
  ) {
    return true;
  }

  // Also search inside player names across both innings and squads
  const checkInningsPlayers = (inn: any) => {
    if (!inn) return false;
    const bats = Array.isArray(inn.batsmen) ? inn.batsmen : [];
    const bowls = Array.isArray(inn.bowlers) ? inn.bowlers : [];
    return (
      bats.some((b: any) => (b?.name || '').toLowerCase().includes(q)) ||
      bowls.some((bw: any) => (bw?.name || '').toLowerCase().includes(q))
    );
  };

  if (checkInningsPlayers(match.innings1) || checkInningsPlayers(match.innings2)) {
    return true;
  }

  const squadA = Array.isArray(match.teamASquad) ? match.teamASquad : [];
  const squadB = Array.isArray(match.teamBSquad) ? match.teamBSquad : [];
  if (
    squadA.some((p: any) => String(typeof p === 'string' ? p : p?.name || '').toLowerCase().includes(q)) ||
    squadB.some((p: any) => String(typeof p === 'string' ? p : p?.name || '').toLowerCase().includes(q))
  ) {
    return true;
  }

  return false;
}

/**
 * 1. SMART MATCH FILTER BAR & INSTANT TEAM/TOURNAMENT SEARCH (Cricbuzz Style)
 */
export const SmartMatchFilterBar: React.FC<{
  statusFilter: HomeMatchStatusFilter;
  onStatusFilterChange: (status: HomeMatchStatusFilter) => void;
  tournamentFilter: string;
  onTournamentFilterChange: (tournament: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  liveCount: number;
  upcomingCount: number;
  completedCount: number;
  availableTournaments: string[];
  onResetFilters: () => void;
}> = ({
  statusFilter,
  onStatusFilterChange,
  tournamentFilter,
  onTournamentFilterChange,
  searchQuery,
  onSearchQueryChange,
  liveCount,
  upcomingCount,
  completedCount,
  availableTournaments,
  onResetFilters
}) => {
  const totalCount = liveCount + upcomingCount + completedCount;
  const hasActiveFilter = statusFilter !== 'all' || tournamentFilter !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            type="button"
            onClick={() => onStatusFilterChange('all')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
              statusFilter === 'all'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/70 dark:border-slate-700/70 hover:bg-slate-200/70 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Matches</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/15 dark:bg-black/30 font-mono text-[9px] tabular-nums">
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('live')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
              statusFilter === 'live'
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
            <span>Live</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/15 font-mono text-[9px] tabular-nums">
              {liveCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('upcoming')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
              statusFilter === 'upcoming'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
            }`}
          >
            <Calendar size={12} />
            <span>Upcoming</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/15 font-mono text-[9px] tabular-nums">
              {upcomingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange('completed')}
            className={`px-3 sm:px-3.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
              statusFilter === 'completed'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm shadow-amber-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <Trophy size={12} />
            <span>Recent Results</span>
            <span className="px-1.5 py-0.5 rounded-md bg-black/15 font-mono text-[9px] tabular-nums">
              {completedCount}
            </span>
          </button>
        </div>

        {/* Instant Search Input */}
        <div className="relative flex-1 max-w-md w-full">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search team, player, tournament, or venue..."
            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer border-none"
              title="Clear search"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Tournament Chips Row (if any tournaments exist) */}
      {(availableTournaments.length > 0 || hasActiveFilter) && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 shrink-0 mr-1">
              <Filter size={10} className="text-emerald-500" />
              Series:
            </span>
            <button
              type="button"
              onClick={() => onTournamentFilterChange('all')}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shrink-0 transition-all cursor-pointer border ${
                tournamentFilter === 'all'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Series
            </button>
            {availableTournaments.map((tName) => {
              const isSelected = tournamentFilter.toLowerCase() === tName.toLowerCase();
              return (
                <button
                  key={tName}
                  type="button"
                  onClick={() => onTournamentFilterChange(isSelected ? 'all' : tName)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider shrink-0 transition-all cursor-pointer border flex items-center gap-1 max-w-[180px] truncate ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title={tName}
                >
                  <Trophy size={9} className="text-amber-500 shrink-0" />
                  <span className="truncate">{tName}</span>
                </button>
              );
            })}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider shrink-0 cursor-pointer transition-all"
            >
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 2. LIVE MATCH CARD BROADCAST ENHANCEMENTS (Win Probability + MVP Impact + Latest Ball Commentary + Quick Tabs)
 */
export const LiveMatchCardBroadcastIntel: React.FC<{
  match: any;
  language?: CommentaryLanguage;
  onSelectMatchTab: (matchId: string, tab: SpectatorTargetTab) => void;
  onExportPDF: (match: any) => void;
}> = ({ match, language = 'en', onSelectMatchTab, onExportPDF }) => {
  // Compute Live Win Probability
  const winProb = useMemo(() => {
    try {
      return calculateWinProbabilityDetails(match);
    } catch {
      return null;
    }
  }, [
    match?.id,
    match?.currentInningsNum,
    match?.targetRuns,
    match?.innings1?.runs,
    match?.innings1?.wickets,
    match?.innings1?.ballsBowled,
    match?.innings2?.runs,
    match?.innings2?.wickets,
    match?.innings2?.ballsBowled
  ]);

  // Compute current #1 Match MVP player
  const topMvp = useMemo<MvpPlayerEntry | null>(() => {
    try {
      const list = calculateMatchMvpLeaderboard(match);
      return list.length > 0 ? list[0] : null;
    } catch {
      return null;
    }
  }, [
    match?.id,
    match?.innings1?.runs,
    match?.innings1?.wickets,
    match?.innings1?.ballsBowled,
    match?.innings2?.runs,
    match?.innings2?.wickets,
    match?.innings2?.ballsBowled
  ]);

  // Extract recent delivery commentary lines for scrollable feed
  const recentCommentaries = useMemo(() => {
    const currentInnings =
      match?.currentInningsNum === 2 && match?.innings2 ? match.innings2 : match?.innings1;
    const commList = Array.isArray(currentInnings?.commentaryList)
      ? currentInnings.commentaryList
      : [];
    return commList
      .filter(
        (c: any) =>
          c &&
          c.overBall &&
          c.overBall !== '0.0' &&
          c.type !== 'announcement' &&
          (c.description || c.translations)
      )
      .map((c: any, idx: number) => {
        const text = getCommentaryText(c, language) || c.description || '';
        const cleaned = text.replace(/\s+/g, ' ').trim();
        return {
          id: c.id || `${c.overBall}-${idx}`,
          overBall: c.overBall,
          type: c.type,
          runs: c.runs ?? c.runsOffBat,
          ballScore: c.ballScore,
          text: cleaned
        };
      });
  }, [match?.currentInningsNum, match?.innings1?.commentaryList, match?.innings2?.commentaryList, language]);

  const probA = winProb?.probA ?? 50;
  const probB = winProb?.probB ?? 50;

  return (
    <div className="mt-3 space-y-2.5">
      {/* Live Win Probability Bar + Current Match MVP Chip */}
      <div className="p-2.5 rounded-xl bg-slate-950/90 border border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between gap-2 text-[9px] font-mono font-black uppercase">
          <span className="text-indigo-400 truncate max-w-[110px]">
            {match.teamA || 'Team A'} {probA}%
          </span>
          <span className="text-[8px] text-slate-500 tracking-widest flex items-center gap-1 shrink-0">
            <Sparkles size={9} className="text-amber-400" /> Win Prob
          </span>
          <span className="text-amber-400 truncate max-w-[110px] text-right">
            {probB}% {match.teamB || 'Team B'}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden flex border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${Math.max(8, Math.min(92, probA))}%` }}
          />
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${Math.max(8, Math.min(92, probB))}%` }}
          />
        </div>

        {/* Live MVP Impact Leader Row */}
        {topMvp && topMvp.totalPoints > 0 && (
          <div className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between gap-2 text-[9.5px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-[8px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Crown size={9} className="text-amber-400" /> MVP
              </span>
              <span className="font-black text-white truncate">{topMvp.name}</span>
              <span className="text-[8px] text-slate-400 font-bold truncate">({topMvp.team})</span>
            </div>
            <span className="font-mono font-black text-amber-400 text-[9.5px] shrink-0 tabular-nums">
              +{topMvp.totalPoints.toFixed(1)} pts
            </span>
          </div>
        )}
      </div>

      {/* Scrollable Past & Latest Ball Commentary Feed */}
      {recentCommentaries.length > 0 && (
        <div
          className="p-2.5 rounded-xl bg-slate-900/80 border border-white/[0.06] space-y-1.5 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-[8px] font-mono font-black uppercase tracking-wider text-slate-400 pb-1 border-b border-white/[0.05]">
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ball-by-Ball Commentary ({recentCommentaries.length})
            </span>
            {recentCommentaries.length > 1 && (
              <span className="text-slate-500">Scroll ↕</span>
            )}
          </div>
          <div className="max-h-28 overflow-y-auto custom-scrollbar scrollbar-thin space-y-1.5 pr-1">
            {recentCommentaries.map((item, idx) => (
              <div
                key={item.id}
                className={`p-1.5 rounded-lg flex items-start gap-2 ${
                  idx === 0
                    ? 'bg-slate-950/90 border border-emerald-500/25'
                    : 'bg-slate-950/40 border border-white/[0.03]'
                }`}
              >
                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase shrink-0 mt-0.5 ${
                    item.type === 'wicket' || item.ballScore === 'W'
                      ? 'bg-rose-500 text-white'
                      : item.runs === 6 || item.ballScore === '6'
                      ? 'bg-amber-400 text-slate-950'
                      : item.runs === 4 || item.ballScore === '4'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.overBall}
                </span>
                <p className="text-[10px] text-slate-300 font-medium leading-snug">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact Quick-Jump Broadcast Tabs */}
      <div
        className="pt-2.5 border-t border-white/[0.06] grid grid-cols-4 gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onSelectMatchTab(match.id, 'arena')}
          className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-black text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
          title="Open Live Arena"
        >
          <Radio size={9} className="text-rose-400 animate-pulse" />
          <span>Live</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMatchTab(match.id, 'scorecard')}
          className="py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-200 font-black text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
          title="Open Full Scorecard"
        >
          <FileText size={9} className="text-amber-400" />
          <span>Scorecard</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMatchTab(match.id, 'highlights')}
          className="py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-slate-200 font-black text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
          title="Open Key Moments & Highlights"
        >
          <Zap size={9} className="text-amber-400" />
          <span>Highlights</span>
        </button>

        <button
          type="button"
          onClick={() => onExportPDF(match)}
          className="py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-white/10 text-emerald-400 font-black text-[8.5px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
          title="Download Scoreboard PDF"
        >
          <Download size={9} />
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
};

/**
 * 3. COLLAPSIBLE TOP PERFORMERS STRIP (Orange Cap, Purple Cap & MVP Impact Leaderboard)
 */
interface AggregatedPlayerStat {
  key: string;
  name: string;
  team: string;
  matchesPlayed: number;
  // Batting
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highestScore: number;
  strikeRate: number;
  // Bowling
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  economy: number;
  bestWickets: number;
  bestRuns: number;
  // MVP Impact
  battingPoints: number;
  bowlingPoints: number;
  fieldingPoints: number;
  totalMvpPoints: number;
  latestMatchId: string;
  latestTournamentName?: string;
}

export const TopPerformersLeaderStrip: React.FC<{
  matches: any[];
  tournamentFilter?: string;
  onSelectMatch: (matchId: string, tab?: SpectatorTargetTab) => void;
}> = ({ matches, tournamentFilter = 'all', onSelectMatch }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeCapTab, setActiveCapTab] = useState<'orange' | 'purple' | 'mvp'>('orange');
  const scrollRef = useRef<HTMLDivElement>(null);

  const aggregatedStats = useMemo(() => {
    const map = new Map<string, AggregatedPlayerStat>();

    const relevantMatches = (matches || []).filter((m) => {
      if (!m || (m.status !== 'live' && m.status !== 'completed')) return false;
      if (tournamentFilter && tournamentFilter !== 'all') {
        const tName = (m.tournamentName || '').trim().toLowerCase();
        const tId = String(m.tournamentId || '').trim().toLowerCase();
        const fNorm = tournamentFilter.trim().toLowerCase();
        if (tName !== fNorm && tId !== fNorm) return false;
      }
      return true;
    });

    for (const m of relevantMatches) {
      const mvpEntries = calculateMatchMvpLeaderboard(m);
      const seenInMatch = new Set<string>();

      for (const entry of mvpEntries) {
        const normKey = (entry.name || '').trim().toLowerCase();
        if (!normKey) continue;

        if (!map.has(normKey)) {
          map.set(normKey, {
            key: normKey,
            name: entry.name.trim(),
            team: entry.team || m.teamA || 'Team',
            matchesPlayed: 0,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            highestScore: 0,
            strikeRate: 0,
            wickets: 0,
            ballsBowled: 0,
            runsConceded: 0,
            economy: 0,
            bestWickets: 0,
            bestRuns: 999,
            battingPoints: 0,
            bowlingPoints: 0,
            fieldingPoints: 0,
            totalMvpPoints: 0,
            latestMatchId: m.id,
            latestTournamentName: m.tournamentName
          });
        }

        const agg = map.get(normKey)!;
        if (!seenInMatch.has(normKey)) {
          agg.matchesPlayed += 1;
          seenInMatch.add(normKey);
        }
        if (entry.team) agg.team = entry.team;
        if (m.id) agg.latestMatchId = m.id;
        if (m.tournamentName) agg.latestTournamentName = m.tournamentName;

        agg.runs += entry.runs;
        agg.balls += entry.balls;
        agg.fours += entry.fours;
        agg.sixes += entry.sixes;
        if (entry.runs > agg.highestScore) {
          agg.highestScore = entry.runs;
        }

        agg.wickets += entry.wickets;
        agg.ballsBowled += entry.ballsBowled;
        agg.runsConceded += entry.runsConceded;
        if (
          entry.ballsBowled > 0 &&
          (entry.wickets > agg.bestWickets ||
            (entry.wickets === agg.bestWickets && entry.runsConceded < agg.bestRuns))
        ) {
          agg.bestWickets = entry.wickets;
          agg.bestRuns = entry.runsConceded;
        }

        agg.battingPoints += entry.battingPoints;
        agg.bowlingPoints += entry.bowlingPoints;
        agg.fieldingPoints += entry.fieldingPoints;
        agg.totalMvpPoints += entry.totalPoints;
      }
    }

    const allPlayers = Array.from(map.values()).map((p) => ({
      ...p,
      strikeRate: p.balls > 0 ? Number(((p.runs / p.balls) * 100).toFixed(1)) : 0,
      economy: p.ballsBowled > 0 ? Number(((p.runsConceded / p.ballsBowled) * 6).toFixed(2)) : 0,
      battingPoints: Number(p.battingPoints.toFixed(1)),
      bowlingPoints: Number(p.bowlingPoints.toFixed(1)),
      fieldingPoints: Number(p.fieldingPoints.toFixed(1)),
      totalMvpPoints: Number(p.totalMvpPoints.toFixed(1))
    }));

    const orangeCap = [...allPlayers]
      .filter((p) => p.runs > 0)
      .sort((a, b) => (b.runs !== a.runs ? b.runs - a.runs : b.strikeRate - a.strikeRate))
      .slice(0, 10);

    const purpleCap = [...allPlayers]
      .filter((p) => p.wickets > 0 || p.ballsBowled >= 6)
      .sort((a, b) =>
        b.wickets !== a.wickets
          ? b.wickets - a.wickets
          : a.economy !== b.economy
          ? a.economy - b.economy
          : a.runsConceded - b.runsConceded
      )
      .slice(0, 10);

    const mvpCap = [...allPlayers]
      .filter((p) => p.totalMvpPoints > 0)
      .sort((a, b) => b.totalMvpPoints - a.totalMvpPoints)
      .slice(0, 10);

    return { orangeCap, purpleCap, mvpCap };
  }, [matches, tournamentFilter]);

  const topOrange = aggregatedStats.orangeCap[0] || null;
  const topPurple = aggregatedStats.purpleCap[0] || null;
  const topMvp = aggregatedStats.mvpCap[0] || null;

  if (!topOrange && !topPurple && !topMvp) {
    return null;
  }

  const activeList =
    activeCapTab === 'orange'
      ? aggregatedStats.orangeCap
      : activeCapTab === 'purple'
      ? aggregatedStats.purpleCap
      : aggregatedStats.mvpCap;

  const scrollStrip = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -280 : 280,
      behavior: 'smooth'
    });
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-lg text-white overflow-hidden relative">
      {/* Decorative subtle glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row with Summary Pills & Collapsible Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Crown size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                CricHeroes Style Star Tracker
              </span>
              {tournamentFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[8px] font-black uppercase">
                  {tournamentFilter}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-black tracking-tight text-white">
              Top Performers • Orange Cap, Purple Cap & MVP
            </h3>
          </div>
        </div>

        {/* Quick Leader Summary Chips + Collapse Button */}
        <div className="flex flex-wrap items-center gap-2">
          {topOrange && (
            <button
              type="button"
              onClick={() => {
                setActiveCapTab('orange');
                setIsExpanded(true);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                activeCapTab === 'orange' && isExpanded
                  ? 'bg-orange-500/25 border-orange-400 text-orange-200 shadow-sm'
                  : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-orange-500/40'
              }`}
            >
              <span className="text-xs">🧡</span>
              <span className="font-black text-white truncate max-w-[95px]">{topOrange.name}</span>
              <span className="font-mono font-black text-orange-400 tabular-nums">{topOrange.runs}r</span>
            </button>
          )}

          {topPurple && (
            <button
              type="button"
              onClick={() => {
                setActiveCapTab('purple');
                setIsExpanded(true);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                activeCapTab === 'purple' && isExpanded
                  ? 'bg-purple-500/25 border-purple-400 text-purple-200 shadow-sm'
                  : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-purple-500/40'
              }`}
            >
              <span className="text-xs">💜</span>
              <span className="font-black text-white truncate max-w-[95px]">{topPurple.name}</span>
              <span className="font-mono font-black text-purple-400 tabular-nums">{topPurple.wickets}w</span>
            </button>
          )}

          {topMvp && (
            <button
              type="button"
              onClick={() => {
                setActiveCapTab('mvp');
                setIsExpanded(true);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
                activeCapTab === 'mvp' && isExpanded
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                  : 'bg-slate-900/90 border-white/10 text-slate-300 hover:border-amber-500/40'
              }`}
            >
              <span className="text-xs">👑</span>
              <span className="font-black text-white truncate max-w-[95px]">{topMvp.name}</span>
              <span className="font-mono font-black text-amber-400 tabular-nums">
                {topMvp.totalMvpPoints}pts
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-[10px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1 cursor-pointer transition-all ml-auto md:ml-0"
          >
            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded Horizontal Leaderboard Cards */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3.5 relative z-10">
          {/* Category Switcher + Scroll Arrows */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveCapTab('orange')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                  activeCapTab === 'orange'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>🧡 Orange Cap (Runs)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCapTab('purple')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                  activeCapTab === 'purple'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>💜 Purple Cap (Wickets)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCapTab('mvp')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                  activeCapTab === 'mvp'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-sm'
                    : 'bg-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>👑 MVP Impact</span>
              </button>
            </div>

            {activeList.length > 2 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollStrip('left')}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-slate-200 cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollStrip('right')}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 border border-white/10 flex items-center justify-center text-slate-200 cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Horizontal Player Cards */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 pt-0.5 snap-x snap-mandatory scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {activeList.map((player, idx) => {
              const isFirst = idx === 0;
              const accentClass =
                activeCapTab === 'orange'
                  ? isFirst
                    ? 'border-orange-500/50 bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-950'
                    : 'border-white/10 bg-slate-900/90 hover:border-orange-500/30'
                  : activeCapTab === 'purple'
                  ? isFirst
                    ? 'border-purple-500/50 bg-gradient-to-br from-purple-500/15 via-slate-900 to-slate-950'
                    : 'border-white/10 bg-slate-900/90 hover:border-purple-500/30'
                  : isFirst
                  ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950'
                  : 'border-white/10 bg-slate-900/90 hover:border-amber-500/30';

              return (
                <div
                  key={player.key}
                  onClick={() => player.latestMatchId && onSelectMatch(player.latestMatchId, 'scorecard')}
                  className={`snap-start shrink-0 w-[235px] sm:w-[255px] rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${accentClass}`}
                  title="Click to open player's latest match scorecard"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg font-mono font-black text-[10px] flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-400 border border-white/10'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-white truncate" title={player.name}>
                          {player.name}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase truncate">
                          {player.team} • {player.matchesPlayed} {player.matchesPlayed === 1 ? 'Match' : 'Matches'}
                        </p>
                      </div>
                    </div>

                    {/* Primary Cap Stat */}
                    <div className="text-right shrink-0">
                      {activeCapTab === 'orange' && (
                        <>
                          <span className="text-base font-mono font-black text-orange-400 tabular-nums block leading-none">
                            {player.runs}
                          </span>
                          <span className="text-[8px] font-mono uppercase text-slate-400 font-bold">
                            Runs
                          </span>
                        </>
                      )}
                      {activeCapTab === 'purple' && (
                        <>
                          <span className="text-base font-mono font-black text-purple-400 tabular-nums block leading-none">
                            {player.wickets}
                          </span>
                          <span className="text-[8px] font-mono uppercase text-slate-400 font-bold">
                            Wkts
                          </span>
                        </>
                      )}
                      {activeCapTab === 'mvp' && (
                        <>
                          <span className="text-base font-mono font-black text-amber-400 tabular-nums block leading-none">
                            +{player.totalMvpPoints}
                          </span>
                          <span className="text-[8px] font-mono uppercase text-slate-400 font-bold">
                            MVP Pts
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sub-metrics Footer */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-slate-300">
                    {activeCapTab === 'orange' && (
                      <>
                        <span>SR: <strong className="text-white">{player.strikeRate}</strong></span>
                        <span>HS: <strong className="text-amber-300">{player.highestScore}</strong></span>
                        <span>4s/6s: <strong className="text-emerald-400">{player.fours}/{player.sixes}</strong></span>
                      </>
                    )}
                    {activeCapTab === 'purple' && (
                      <>
                        <span>Econ: <strong className="text-white">{player.economy}</strong></span>
                        <span>
                          Best:{' '}
                          <strong className="text-purple-300">
                            {player.bestRuns < 999 ? `${player.bestWickets}/${player.bestRuns}` : '-'}
                          </strong>
                        </span>
                        <span>
                          Ov:{' '}
                          <strong className="text-emerald-400">
                            {Math.floor(player.ballsBowled / 6)}.{player.ballsBowled % 6}
                          </strong>
                        </span>
                      </>
                    )}
                    {activeCapTab === 'mvp' && (
                      <>
                        <span>Bat: <strong className="text-emerald-400">+{player.battingPoints}</strong></span>
                        <span>Bowl: <strong className="text-purple-300">+{player.bowlingPoints}</strong></span>
                        <span>Field: <strong className="text-amber-300">+{player.fieldingPoints}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 4. INTERACTIVE UPCOMING MATCH CARD WITH COUNTDOWN & 1-TAP PRE-MATCH FAN POLL
 */
function getUpcomingScheduleBadge(dateStr?: string, timeStr?: string): { label: string; isUrgent: boolean } {
  if (!dateStr) return { label: 'Scheduled Fixture', isUrgent: false };
  const clean = dateStr.trim();
  const lower = clean.toLowerCase();
  if (lower === 'today') {
    return { label: timeStr ? `⚡ Today • ${timeStr}` : '⚡ Today', isUrgent: true };
  }
  if (lower === 'tomorrow') {
    return { label: timeStr ? `📅 Tomorrow • ${timeStr}` : '📅 Tomorrow', isUrgent: false };
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
    const diffDays = Math.round((targetStart - todayStart) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { label: timeStr ? `⚡ Today • ${timeStr}` : '⚡ Starting Today', isUrgent: true };
    if (diffDays === 1) return { label: timeStr ? `📅 Tomorrow • ${timeStr}` : '📅 Tomorrow', isUrgent: false };
    if (diffDays > 1 && diffDays <= 14) return { label: `⏳ In ${diffDays} Days`, isUrgent: false };
  }

  return { label: timeStr ? `${clean} • ${timeStr}` : clean, isUrgent: false };
}

export const UpcomingMatchInteractiveCard: React.FC<{
  match: any;
  onSelectMatch: (matchId: string) => void;
}> = ({ match, onSelectMatch }) => {
  const matchId = String(match?.id || 'upcoming_match');
  const teamA = match?.teamA || 'Team A';
  const teamB = match?.teamB || 'Team B';

  // Deterministic baseline votes for pre-match crowd meter
  const baseline = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < matchId.length; i++) {
      hash = (hash * 31 + matchId.charCodeAt(i)) % 1000;
    }
    const a = 12 + (hash % 18);
    const b = 11 + ((hash >> 2) % 18);
    return { a, b };
  }, [matchId]);

  const [remoteVotes, setRemoteVotes] = useState<{ teamAVotes?: number; teamBVotes?: number }>({});
  const [userVote, setUserVote] = useState<'teamA' | 'teamB' | null>(() => {
    try {
      const saved = localStorage.getItem(`gully_fan_poll_win_${matchId}`);
      return saved === 'teamA' || saved === 'teamB' ? saved : null;
    } catch {
      return null;
    }
  });
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!match?.id || !db) return;
    const pollRef = doc(db, 'cricket_matches', String(match.id), 'fan_polls', 'live_poll');
    const unsub = onSnapshot(
      pollRef,
      (snap) => {
        if (snap.exists()) {
          setRemoteVotes(snap.data() as any);
        }
      },
      () => {}
    );
    return () => unsub();
  }, [match?.id]);

  const handleVote = async (choice: 'teamA' | 'teamB', e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === choice) return;
    const prevVote = userVote;
    setUserVote(choice);
    try {
      localStorage.setItem(`gully_fan_poll_win_${matchId}`, choice);
    } catch {}

    if (!match?.id || !db) return;
    const pollRef = doc(db, 'cricket_matches', String(match.id), 'fan_polls', 'live_poll');
    const fieldMap = { teamA: 'teamAVotes', teamB: 'teamBVotes' } as const;
    try {
      const updates: Record<string, any> = {
        [fieldMap[choice]]: increment(1),
        updatedAt: Date.now()
      };
      if (prevVote && prevVote !== choice) {
        updates[fieldMap[prevVote]] = increment(-1);
      }
      await updateDoc(pollRef, updates);
    } catch {
      try {
        await setDoc(
          pollRef,
          {
            teamAVotes: choice === 'teamA' ? 1 : 0,
            teamBVotes: choice === 'teamB' ? 1 : 0,
            tieVotes: 0,
            updatedAt: Date.now()
          },
          { merge: true }
        );
      } catch {}
    }
  };

  const totalA =
    baseline.a +
    (Number(remoteVotes.teamAVotes) || 0) +
    (userVote === 'teamA' && !remoteVotes.teamAVotes ? 1 : 0);
  const totalB =
    baseline.b +
    (Number(remoteVotes.teamBVotes) || 0) +
    (userVote === 'teamB' && !remoteVotes.teamBVotes ? 1 : 0);
  const totalVotes = Math.max(1, totalA + totalB);
  const pctA = Math.round((totalA / totalVotes) * 100);
  const pctB = 100 - pctA;

  const scheduleBadge = getUpcomingScheduleBadge(match?.date, match?.time);

  const handleShareFixture = (e: React.MouseEvent) => {
    e.stopPropagation();
    const venueText = match.groundName || match.venue || match.ground || 'Official Ground';
    const text = `🏏 *UPCOMING CRICKET MATCH*\n⚡ *${teamA} vs ${teamB}*\n${
      match.tournamentName ? `🏆 ${match.tournamentName}\n` : ''
    }📅 ${match.date || 'Upcoming'} • 📍 ${venueText}\n🎯 ${match.oversLimit || 10} Overs\n\nVote in the live fan poll & follow ball-by-ball: ${
      window.location.origin
    }/live/cricket-details?matchId=${encodeURIComponent(matchId)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      });
    }
  };

  return (
    <div
      onClick={() => onSelectMatch(matchId)}
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-4 group relative overflow-hidden"
    >
      <div>
        {/* Header with Tournament & Countdown Badge */}
        <div className="flex justify-between items-center gap-2 mb-3">
          <span
            className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block truncate max-w-[160px]"
            title={match.tournamentName || match.date || 'Upcoming'}
          >
            {match.tournamentName ? `🏆 ${match.tournamentName}` : '🏏 Official Fixture'}
          </span>
          <span
            className={`font-mono text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0 border ${
              scheduleBadge.isUrgent
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300 animate-pulse'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400'
            }`}
          >
            <Clock size={10} />
            {scheduleBadge.label}
          </span>
        </div>

        {/* Optional 16:9 Match Banner */}
        {match.matchBannerUrl && (
          <div className="mb-3.5 rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <img
              src={match.matchBannerUrl}
              alt={`${teamA} vs ${teamB} Banner`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        )}

        {/* Team A vs Team B Row */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              {teamA.toUpperCase().substring(0, 2)}
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                {teamA}
              </span>
              <span className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 font-bold">
                {pctA}% Fan Pick
              </span>
            </div>
          </div>

          <span className="text-[9px] font-mono font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800 shrink-0">
            VS
          </span>

          <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                {teamB}
              </span>
              <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                {pctB}% Fan Pick
              </span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              {teamB.toUpperCase().substring(0, 2)}
            </div>
          </div>
        </div>

        {/* Venue & Format Strip */}
        <div className="text-[10px] flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 mb-3">
          <span className="truncate max-w-[170px]">
            📍 <strong>{match.groundName || match.venue || match.ground || 'Ground TBD'}</strong>
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            🎯 {match.oversLimit || 10} Overs
          </span>
        </div>

        {/* Interactive 1-Tap Pre-Match "Who Will Win?" Fan Poll */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border border-slate-200/70 dark:border-slate-800 space-y-2"
        >
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
            <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Users size={11} className="text-emerald-500" /> Who Will Win?
            </span>
            <span className="font-mono text-slate-400 tabular-nums">{totalVotes} Votes</span>
          </div>

          {/* Vote Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={(e) => handleVote('teamA', e)}
              className={`py-1.5 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-between gap-1 cursor-pointer transition-all border ${
                userVote === 'teamA'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50'
              }`}
            >
              <span className="truncate">{teamA}</span>
              <span className="font-mono text-[9px] shrink-0">{pctA}%</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleVote('teamB', e)}
              className={`py-1.5 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-between gap-1 cursor-pointer transition-all border ${
                userVote === 'teamB'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
              }`}
            >
              <span className="truncate">{teamB}</span>
              <span className="font-mono text-[9px] shrink-0">{pctB}%</span>
            </button>
          </div>

          {/* Dual Crowd Meter Bar */}
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${pctA}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${pctB}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2"
      >
        <button
          type="button"
          onClick={handleShareFixture}
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border-none transition-all"
        >
          {copiedShare ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Share2 size={11} />}
          <span>{copiedShare ? 'Copied Info!' : 'Share Fixture'}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectMatch(matchId)}
          className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer bg-transparent border-none group-hover:translate-x-0.5 transition-transform"
        >
          <span>Pre-Match Hub</span>
          <ArrowRight size={11} />
        </button>
      </div>
    </div>
  );
};

/**
 * 5. RECENT RESULTS CAROUSEL WITH POTM & 1-TAP CERTIFICATE / SCORECARD ACCESS
 */
function formatOversCompact(balls?: number): string {
  const b = Math.max(0, Math.floor(Number(balls) || 0));
  return `${Math.floor(b / 6)}.${b % 6}`;
}

export const RecentResultsCarouselSection: React.FC<{
  completedMatches: any[];
  onSelectMatch: (matchId: string, tab?: SpectatorTargetTab, options?: { openCertificate?: boolean }) => void;
  onExportPDF: (match: any) => void;
}> = ({ completedMatches, onSelectMatch, onExportPDF }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  if (!completedMatches || completedMatches.length === 0) {
    return null;
  }

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({
      left: dir === 'left' ? -340 : 340,
      behavior: 'smooth'
    });
  };

  const recentSlice = completedMatches.slice(0, 12);

  return (
    <div className="space-y-4 sm:space-y-5 bg-gradient-to-tr from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/65 dark:border-slate-800/80 p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="text-amber-500" size={18} />
          <div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Recent Match Results & Accolades ({completedMatches.length})
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Full scorecards, Player of the Match impact & downloadable official certificates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {recentSlice.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollCarousel('left')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel('right')}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          <Link
            to="/completed-matches"
            id="btn-spectator-view-all-completed-matches"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm hover:shadow-emerald-500/25 transition-all cursor-pointer no-underline"
          >
            <span>All Archives ({completedMatches.length})</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Horizontal Swipeable Completed Match Cards */}
      <div
        ref={sliderRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recentSlice.map((m, idx) => {
          const teamA = m.teamA || 'Team A';
          const teamB = m.teamB || 'Team B';

          const isTeamABatting1 =
            m.innings1?.battingTeam &&
            m.innings1.battingTeam.toLowerCase().trim() === teamA.toLowerCase().trim();
          const isTeamABatting2 =
            m.innings2?.battingTeam &&
            m.innings2.battingTeam.toLowerCase().trim() === teamA.toLowerCase().trim();

          let scoreA = m.scoreA || '0/0';
          let oversA = m.oversA || '';
          if (isTeamABatting1 && m.innings1) {
            scoreA = `${m.innings1.runs}/${m.innings1.wickets}`;
            oversA = formatOversCompact(m.innings1.ballsBowled);
          } else if (isTeamABatting2 && m.innings2) {
            scoreA = `${m.innings2.runs}/${m.innings2.wickets}`;
            oversA = formatOversCompact(m.innings2.ballsBowled);
          }

          const isTeamBBatting1 =
            m.innings1?.battingTeam &&
            m.innings1.battingTeam.toLowerCase().trim() === teamB.toLowerCase().trim();
          const isTeamBBatting2 =
            m.innings2?.battingTeam &&
            m.innings2.battingTeam.toLowerCase().trim() === teamB.toLowerCase().trim();

          let scoreB = m.scoreB || '0/0';
          let oversB = m.oversB || '';
          if (isTeamBBatting1 && m.innings1) {
            scoreB = `${m.innings1.runs}/${m.innings1.wickets}`;
            oversB = formatOversCompact(m.innings1.ballsBowled);
          } else if (isTeamBBatting2 && m.innings2) {
            scoreB = `${m.innings2.runs}/${m.innings2.wickets}`;
            oversB = formatOversCompact(m.innings2.ballsBowled);
          }

          const winnerNorm = (m.winner || '').trim().toLowerCase();
          const isTeamAWinner = winnerNorm && winnerNorm === teamA.trim().toLowerCase();
          const isTeamBWinner = winnerNorm && winnerNorm === teamB.trim().toLowerCase();

          // Resolve POTM from match or MVP leaderboard
          const mvpLeader = calculateMatchMvpLeaderboard(m)[0] || null;
          const potmName = m.manOfTheMatch || mvpLeader?.name || '';
          const potmSummary = mvpLeader
            ? [
                mvpLeader.runs > 0 ? `${mvpLeader.runs}(${mvpLeader.balls})` : '',
                mvpLeader.wickets > 0 ? `${mvpLeader.wickets}/${mvpLeader.runsConceded}` : ''
              ]
                .filter(Boolean)
                .join(' & ')
            : '';

          const resultHeadline =
            m.winner === 'Tie'
              ? 'Match Ended in a Tie'
              : m.winner && m.winReason
              ? `${m.winner} ${m.winReason}`
              : m.winReason || (m.winner ? `${m.winner} won the match` : 'Match Completed');

          return (
            <div
              key={`${m.id || 'comp'}-${idx}`}
              onClick={() => onSelectMatch(m.id, 'scorecard')}
              className="snap-start shrink-0 w-[calc(100vw-4.5rem)] max-w-[330px] sm:w-[345px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-3.5 group"
            >
              <div className="space-y-3">
                {/* Top Meta Row */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[9.5px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate max-w-[180px]"
                    title={m.tournamentName || m.date || 'Completed'}
                  >
                    {m.tournamentName ? `🏆 ${m.tournamentName}` : m.date || 'Official Result'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[8.5px] font-mono font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                    COMPLETED ✅
                  </span>
                </div>

                {/* Teams Score Comparison Rows */}
                <div className="space-y-2 pt-0.5">
                  <div
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                      isTeamAWinner
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                        {teamA.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="text-xs font-black truncate">{teamA}</span>
                      {isTeamAWinner && <Trophy size={11} className="text-amber-500 shrink-0" />}
                    </div>
                    <span className="font-mono text-xs font-black tabular-nums shrink-0">
                      {scoreA}{' '}
                      {oversA && (
                        <span className="text-[9.5px] font-normal text-slate-400">({oversA})</span>
                      )}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                      isTeamBWinner
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-950/70 border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                        {teamB.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="text-xs font-black truncate">{teamB}</span>
                      {isTeamBWinner && <Trophy size={11} className="text-amber-500 shrink-0" />}
                    </div>
                    <span className="font-mono text-xs font-black tabular-nums shrink-0">
                      {scoreB}{' '}
                      {oversB && (
                        <span className="text-[9.5px] font-normal text-slate-400">({oversB})</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Result Margin Banner */}
                <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5">
                  <Trophy size={12} className="text-amber-500 shrink-0" />
                  <span className="truncate">{resultHeadline}</span>
                </div>

                {/* POTM Spotlight Strip */}
                {potmName && (
                  <div className="px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-black text-[8px] uppercase shrink-0">
                        ⭐ POTM
                      </span>
                      <span className="font-black text-slate-800 dark:text-white truncate">
                        {potmName}
                      </span>
                    </div>
                    {potmSummary && (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[9.5px] shrink-0 tabular-nums">
                        {potmSummary}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick-Jump Footer Buttons */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => onSelectMatch(m.id, 'scorecard')}
                  className="py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <FileText size={10} />
                  <span>Scorecard</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectMatch(m.id, 'scorecard', { openCertificate: true })}
                  className="py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                  title="Download Match Award Certificates"
                >
                  <Award size={10} />
                  <span>Certificates</span>
                </button>

                <button
                  type="button"
                  onClick={() => onExportPDF(m)}
                  className="py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                  title="Download Match Scoreboard PDF"
                >
                  <Download size={10} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
