import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  RefreshCw,
  Check,
  Sparkles,
  Flame,
  Info,
  Compass,
  Download,
  Search,
  FileText,
  Lock,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import {
  StandingsTeamStats,
  MatchScoreInput,
  calculateTournamentStandings,
} from './modules/TournamentPointsCalculator';

// ---------------------------------------------------------------------------
// TYPES & INTERFACES
// ---------------------------------------------------------------------------

export interface PointsTableTeam {
  id: string;
  name: string;
  shortName: string;
  logoColor: string;
  captain?: string;
  logo?: string;
  group?: number | string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  runsScored: number;
  oversFaced: number; // Cricket notation e.g., 19.4 (19 overs, 4 balls)
  runsConceded: number;
  oversBowled: number; // Cricket notation e.g., 20.0
  points: number;
  NRR: number;
}

export interface LoggedTournamentMatch {
  id: string;
  teamAName: string;
  teamBName: string;
  scoreA: string;
  scoreB: string;
  oversA: string | number;
  oversB: string | number;
  resultText: string;
  stage?: string;
  status?: 'scheduled' | 'live' | 'completed';
  isTournamentMatch?: boolean;
}

export interface PointsTableModuleProps {
  standings?: StandingsTeamStats[];
  teams?: {
    id: string;
    name: string;
    captain?: string;
    logo?: string;
    group?: number | string;
    shortName?: string;
  }[];
  matches?: MatchScoreInput[];
  qualifyingSpots?: number;
  standardOversQuota?: number;
  tournamentName?: string;
  activeTabMode?: 'standings' | 'h2h' | 'calculator' | 'scenarios';
  onTabModeChange?: (mode: 'standings' | 'h2h' | 'calculator' | 'scenarios') => void;
  onExportCSV?: () => void;
  onOpenMatchScorecard?: (matchId: string) => void;
}

const COLOR_PALETTE = [
  'from-blue-600 to-indigo-800',
  'from-yellow-400 to-amber-600',
  'from-red-600 to-rose-900',
  'from-purple-600 to-indigo-950',
  'from-sky-500 to-blue-700',
  'from-emerald-500 to-teal-800',
  'from-orange-500 to-rose-700',
  'from-teal-500 to-emerald-800',
  'from-pink-500 to-rose-700',
  'from-indigo-500 to-purple-800',
];

const DEFAULT_FALLBACK_TEAMS: PointsTableTeam[] = [
  {
    id: 'team-1',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logoColor: 'from-blue-600 to-indigo-800',
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    runsScored: 0,
    oversFaced: 0.0,
    runsConceded: 0,
    oversBowled: 0.0,
    points: 0,
    NRR: 0.0,
  },
  {
    id: 'team-2',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logoColor: 'from-yellow-400 to-amber-600',
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    noResult: 0,
    runsScored: 0,
    oversFaced: 0.0,
    runsConceded: 0,
    oversBowled: 0.0,
    points: 0,
    NRR: 0.0,
  },
];

// Helper: convert decimal overs (e.g. 19.6667) to cricket notation number (e.g. 19.4)
const decimalToCricketOversNumber = (decimalOvers: number): number => {
  if (!decimalOvers || isNaN(decimalOvers) || decimalOvers <= 0) return 0;
  const totalBalls = Math.round(decimalOvers * 6);
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return Number(`${overs}.${balls}`);
};

// Helper: generate short code from team name
const makeShortName = (name: string, fallbackIdx?: number): string => {
  const clean = (name || '').trim();
  if (!clean) return `T${fallbackIdx || 1}`;
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .map(w => w[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }
  return clean.slice(0, 3).toUpperCase();
};

export const PointsTableModule: React.FC<PointsTableModuleProps> = ({
  standings: propStandings,
  teams: propTeams,
  matches: propMatches,
  qualifyingSpots = 4,
  standardOversQuota = 8,
  tournamentName,
  onExportCSV,
  onOpenMatchScorecard,
}) => {
  const [storageRefreshTick, setStorageRefreshTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Listen to One-Half Tournament and global match result events for instant automatic updates
  useEffect(() => {
    const handleTournamentResultUpdate = () => {
      setStorageRefreshTick(prev => prev + 1);
    };

    window.addEventListener('one_half_tournament_updated', handleTournamentResultUpdate);
    window.addEventListener('gully_tournaments_updated', handleTournamentResultUpdate);
    window.addEventListener('cricket_matches_updated', handleTournamentResultUpdate);
    window.addEventListener('storage', handleTournamentResultUpdate);

    return () => {
      window.removeEventListener('one_half_tournament_updated', handleTournamentResultUpdate);
      window.removeEventListener('gully_tournaments_updated', handleTournamentResultUpdate);
      window.removeEventListener('cricket_matches_updated', handleTournamentResultUpdate);
      window.removeEventListener('storage', handleTournamentResultUpdate);
    };
  }, []);

  // Build authoritative PointsTableTeam list from tournament props or One-Half localStorage
  const computeAuthoritativeTeams = useCallback((): PointsTableTeam[] => {
    const teamMetaMap = new Map<
      string,
      {
        id: string;
        name: string;
        captain?: string;
        logo?: string;
        group?: number | string;
        shortName?: string;
      }
    >();

    if (propTeams && propTeams.length > 0) {
      propTeams.forEach(t => {
        teamMetaMap.set(t.id.toLowerCase().trim(), t);
        teamMetaMap.set(t.name.toLowerCase().trim(), t);
      });
    }

    // 1. If standings are passed directly from OneHalfTournamentSuite or CricketTournamentTab
    if (propStandings && propStandings.length > 0) {
      return propStandings.map((s, idx) => {
        const meta =
          teamMetaMap.get((s.id || '').toLowerCase().trim()) ||
          teamMetaMap.get((s.name || '').toLowerCase().trim());
        const short =
          s.shortName || meta?.shortName || makeShortName(s.name, idx + 1);
        return {
          id: s.id || s.name || `team-${idx + 1}`,
          name: s.name,
          shortName: short,
          logoColor: COLOR_PALETTE[idx % COLOR_PALETTE.length],
          captain: s.captain || meta?.captain,
          logo: s.logo || meta?.logo,
          group: meta?.group,
          played: s.played || 0,
          won: s.won || 0,
          lost: s.lost || 0,
          tied: s.tied || 0,
          noResult: s.noResult || 0,
          runsScored: s.runsScored || 0,
          oversFaced: decimalToCricketOversNumber(s.oversFacedDecimal),
          runsConceded: s.runsConceded || 0,
          oversBowled: decimalToCricketOversNumber(s.oversBowledDecimal),
          points: s.points || 0,
          NRR: Number((s.NRR || 0).toFixed(3)),
        };
      });
    }

    // 2. If teams are passed without precomputed standings
    if (propTeams && propTeams.length > 0) {
      return propTeams.map((t, idx) => ({
        id: t.id || t.name || `team-${idx + 1}`,
        name: t.name,
        shortName: t.shortName || makeShortName(t.name, idx + 1),
        logoColor: COLOR_PALETTE[idx % COLOR_PALETTE.length],
        captain: t.captain,
        logo: t.logo,
        group: t.group,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        points: 0,
        NRR: 0,
      }));
    }

    // 3. Fallback: Read One-Half 32-Team Tournament from localStorage if rendered standalone
    try {
      const saved = localStorage.getItem('one_half_tournament_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.teams) && parsed.teams.length > 0) {
          const oversQuota = parsed.overs || standardOversQuota || 8;
          const scoreMatches: MatchScoreInput[] = (parsed.matches || []).map((m: any) => ({
            id: m.id,
            teamAId: m.teamA,
            teamBId: m.teamB,
            teamAName: m.teamA,
            teamBName: m.teamB,
            status: m.status === 'completed' ? 'completed' : m.status === 'live' ? 'live' : 'scheduled',
            scoreA: m.scoreA || '',
            scoreB: m.scoreB || '',
            oversA: m.oversA || `${oversQuota}`,
            oversB: m.oversB || `${oversQuota}`,
            winnerId: m.winner ? (m.winner === m.teamA ? m.teamA : m.teamB) : null,
            winner: m.winner || null,
            winReason: m.winReason || (m.winner ? `${m.winner} won` : ''),
            stage: m.label,
            date: m.date,
          }));

          const computed = calculateTournamentStandings(
            parsed.teams.map((t: any) => ({
              id: t.name,
              name: t.name,
              captain: t.captain,
              logo: t.logo,
              shortName: t.shortName,
            })),
            scoreMatches,
            { standardOversQuota: oversQuota, qualifyingSpots: 4, includeKnockoutMatches: true }
          );
          const localMeta = new Map<string, any>();
          parsed.teams.forEach((t: any) => {
            localMeta.set(t.name.toLowerCase().trim(), t);
          });
          return computed.map((s, idx) => {
            const meta = localMeta.get(s.name.toLowerCase().trim());
            return {
              id: s.id || s.name,
              name: s.name,
              shortName: meta?.shortName || s.shortName || makeShortName(s.name, idx + 1),
              logoColor: COLOR_PALETTE[idx % COLOR_PALETTE.length],
              captain: s.captain || meta?.captain,
              logo: s.logo || meta?.logo,
              group: meta?.group,
              played: s.played || 0,
              won: s.won || 0,
              lost: s.lost || 0,
              tied: s.tied || 0,
              noResult: s.noResult || 0,
              runsScored: s.runsScored || 0,
              oversFaced: decimalToCricketOversNumber(s.oversFacedDecimal),
              runsConceded: s.runsConceded || 0,
              oversBowled: decimalToCricketOversNumber(s.oversBowledDecimal),
              points: s.points || 0,
              NRR: Number((s.NRR || 0).toFixed(3)),
            };
          });
        }
      }
    } catch (_) {}

    return DEFAULT_FALLBACK_TEAMS;
  }, [propStandings, propTeams, standardOversQuota, storageRefreshTick]);

  const teams = useMemo(() => computeAuthoritativeTeams(), [computeAuthoritativeTeams]);

  // Build completed matches list from tournament props or One-Half localStorage
  const completedMatchesLog = useMemo((): LoggedTournamentMatch[] => {
    let sourceMatches: MatchScoreInput[] = propMatches || [];
    if (sourceMatches.length === 0) {
      try {
        const saved = localStorage.getItem('one_half_tournament_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.matches)) {
            const oversQuota = parsed.overs || standardOversQuota || 8;
            sourceMatches = parsed.matches.map((m: any) => ({
              id: m.id,
              teamAId: m.teamA,
              teamBId: m.teamB,
              teamAName: m.teamA,
              teamBName: m.teamB,
              status: m.status === 'completed' ? 'completed' : m.status === 'live' ? 'live' : 'scheduled',
              scoreA: m.scoreA || '',
              scoreB: m.scoreB || '',
              oversA: m.oversA || `${oversQuota}`,
              oversB: m.oversB || `${oversQuota}`,
              winnerId: m.winner ? (m.winner === m.teamA ? m.teamA : m.teamB) : null,
              winner: m.winner || null,
              winReason: m.winReason || (m.winner ? `${m.winner} won` : ''),
              stage: m.label,
              date: m.date,
            }));
          }
        }
      } catch (_) {}
    }

    return sourceMatches
      .filter(m => m.status === 'completed' || Boolean(m.winner) || Boolean(m.winnerId))
      .map(m => ({
        id: m.id,
        teamAName: m.teamAName,
        teamBName: m.teamBName,
        scoreA: m.scoreA ? `${m.scoreA} (${m.oversA || standardOversQuota} ov)` : `0/0 (${standardOversQuota} ov)`,
        scoreB: m.scoreB ? `${m.scoreB} (${m.oversB || standardOversQuota} ov)` : `0/0 (${standardOversQuota} ov)`,
        oversA: m.oversA || standardOversQuota,
        oversB: m.oversB || standardOversQuota,
        resultText: m.winReason || (m.winner ? `${m.winner} won` : 'Match Completed'),
        stage: m.stage,
        status: 'completed',
        isTournamentMatch: true,
      }));
  }, [propMatches, standardOversQuota, storageRefreshTick]);

  // Build upcoming / live matches queue so users can see what matches will auto-update next
  const upcomingOrLiveMatches = useMemo((): LoggedTournamentMatch[] => {
    let sourceMatches: MatchScoreInput[] = propMatches || [];
    if (sourceMatches.length === 0) {
      try {
        const saved = localStorage.getItem('one_half_tournament_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.matches)) {
            const oversQuota = parsed.overs || standardOversQuota || 8;
            sourceMatches = parsed.matches.map((m: any) => ({
              id: m.id,
              teamAId: m.teamA,
              teamBId: m.teamB,
              teamAName: m.teamA,
              teamBName: m.teamB,
              status: m.status === 'completed' ? 'completed' : m.status === 'live' ? 'live' : 'scheduled',
              scoreA: m.scoreA || '',
              scoreB: m.scoreB || '',
              oversA: m.oversA || `${oversQuota}`,
              oversB: m.oversB || `${oversQuota}`,
              winnerId: m.winner ? (m.winner === m.teamA ? m.teamA : m.teamB) : null,
              winner: m.winner || null,
              winReason: m.winReason || '',
              stage: m.label,
              date: m.date,
            }));
          }
        }
      } catch (_) {}
    }

    return sourceMatches
      .filter(
        m =>
          m.status !== 'completed' &&
          !m.winner &&
          !m.winnerId &&
          m.teamAName &&
          m.teamBName &&
          !m.teamAName.startsWith('Winner') &&
          !m.teamBName.startsWith('Winner') &&
          !m.teamAName.startsWith('Day ') &&
          !m.teamBName.startsWith('Day ') &&
          !m.teamAName.startsWith('Loser') &&
          !m.teamBName.startsWith('Loser')
      )
      .slice(0, 6)
      .map(m => ({
        id: m.id,
        teamAName: m.teamAName,
        teamBName: m.teamBName,
        scoreA: m.scoreA || 'Yet to bat',
        scoreB: m.scoreB || 'Yet to bat',
        oversA: m.oversA || standardOversQuota,
        oversB: m.oversB || standardOversQuota,
        resultText: m.status === 'live' ? 'LIVE IN PROGRESS' : 'Scheduled Fixture',
        stage: m.stage,
        status: m.status,
        isTournamentMatch: true,
      }));
  }, [propMatches, standardOversQuota, storageRefreshTick]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // HELPER RULES FOR CRICKET FRACTIONAL OVERS
  const calculateOversDecimal = (oversRepresentation: number): number => {
    const completedOvers = Math.floor(oversRepresentation);
    const subBalls = Math.round((oversRepresentation - completedOvers) * 10);
    const normalizedBalls = Math.min(Math.max(subBalls, 0), 5);
    return completedOvers + normalizedBalls / 6;
  };

  // Refresh from authoritative match results
  const syncTournamentTeams = () => {
    setStorageRefreshTick(prev => prev + 1);
    triggerNotification(
      `Refreshed ${teams.length} teams & official stats from ${tournamentName || 'One-Half Tournament'} match results!`
    );
  };

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        (t.captain && t.captain.toLowerCase().includes(q)) ||
        (t.group && `group ${t.group}`.includes(q))
    );
  }, [teams, searchQuery]);

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Top Banner Alert / Rule Summary */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-transparent border border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between">
        <div className="space-y-1.5 max-w-2xl text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              {tournamentName ? 'Official Tournament Standings & NRR' : 'Live Standings & NRR Table'}
            </span>
            <span className="p-1 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <Lock size={10} /> Auto-Updated • Read-Only
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> {teams.length} Tournament Squads • {standardOversQuota} Overs Format
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {tournamentName ? `${tournamentName} — Points Table & NRR` : 'Cricket Points Table & Net Run Rate'}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Standings and Net Run Rate (NRR) are locked from manual editing and <strong>update automatically</strong> after every completed One-Half Tournament match result (Win = 2 pts, Tie/NR = 1 pt):
            <span className="block mt-1.5 font-mono text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-950 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-extrabold select-all">
              NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 md:pt-0 shrink-0 select-none">
          <button
            onClick={syncTournamentTeams}
            type="button"
            className="px-3.5 py-2 hover:scale-[1.02] active:scale-[0.98] bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw size={11} />
            Refresh Standings
          </button>
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              type="button"
              className="px-3.5 py-2 hover:scale-[1.02] active:scale-[0.98] bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-wider transition-all border-none flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download size={11} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Floating Mini Notification Action Prompt */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 right-6 z-[600] max-w-sm w-full bg-slate-950/95 border border-emerald-500/40 text-white rounded-2xl p-4 shadow-2xl backdrop-blur-md flex items-start gap-3 text-left"
          >
            <div className="p-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg shrink-0">
              <Check size={14} className="animate-pulse" />
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-2xs uppercase text-emerald-400 font-black tracking-widest">Standings & NRR Synced</p>
              <p className="text-[11px] leading-relaxed text-slate-200 font-semibold">{notification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TWO COLUMN GRID - Official Read-Only Table + Automatic Match Result Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        {/* LEFT COLUMN: THE MASTER POINTS TABLE (Cols 8/12 on large screen) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Trophy size={15} className="text-amber-500" />
              <span>{tournamentName || 'One-Half Tournament'} Standings ({filteredTeams.length} Teams)</span>
            </h3>

            <div className="flex items-center gap-2">
              {teams.length > 4 && (
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search team or group..."
                    className="pl-7 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-500 w-48"
                  />
                </div>
              )}
              <span
                className="py-1.5 px-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-black uppercase text-[10px] tracking-widest inline-flex items-center gap-1 select-none"
                title="Points Table cannot be manually edited. It updates automatically from completed match results."
              >
                <ShieldCheck size={12} className="text-emerald-500" /> Auto Match Sync
              </span>
            </div>
          </div>

          {/* Table Container Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-4 sm:p-6 shadow-xl relative overflow-hidden">
            {filteredTeams.length === 0 ? (
              <div className="py-14 text-center space-y-4 select-none">
                <div className="inline-block p-4 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-400 border border-slate-200/40 dark:border-slate-800">
                  <Compass size={32} />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">No Matching Teams</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium max-w-sm mx-auto">
                    Click "Refresh Standings" above to reload all tournament teams.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1.5 sm:mx-0 select-text">
                <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10.5px]">
                      <th className="py-3 px-2 text-center w-12">Pos</th>
                      <th className="py-3 px-3">Tournament Team</th>
                      <th className="py-3 px-2 text-center w-10">M</th>
                      <th className="py-3 px-2 text-center w-10 text-emerald-500">W</th>
                      <th className="py-3 px-2 text-center w-10 text-rose-500">L</th>
                      <th className="py-3 px-2 text-center w-10">T</th>
                      <th className="py-3 px-2 text-center w-20">For</th>
                      <th className="py-3 px-2 text-center w-20">Against</th>
                      <th className="py-3 px-3 text-center w-24">NRR</th>
                      <th className="py-3 px-2.5 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-t-xl font-black w-14">Pts</th>
                    </tr>
                  </thead>

                  <AnimatePresence mode="popLayout">
                    <tbody>
                      {filteredTeams.map((t, idx) => {
                        const isQualifying = idx < qualifyingSpots;
                        return (
                          <motion.tr
                            layout
                            key={t.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            className={`border-b border-slate-100/70 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-colors group ${
                              isQualifying ? 'bg-emerald-500/[0.02]' : ''
                            }`}
                          >
                            {/* Position */}
                            <td className="py-3.5 px-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black ${
                                    idx === 0
                                      ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                      : isQualifying
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                {isQualifying && (
                                  <span
                                    className="text-[8px] font-black px-1 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    title={`Top ${qualifyingSpots} Qualifier`}
                                  >
                                    Q
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Squad Info */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {t.logo ? (
                                  <img
                                    src={t.logo}
                                    alt={t.name}
                                    className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div
                                    className={`w-7 h-7 rounded-full shrink-0 bg-gradient-to-br ${t.logoColor} text-white flex items-center justify-center text-[9px] font-black border border-white/20 shadow-sm`}
                                  >
                                    {t.shortName.slice(0, 2)}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-slate-800 dark:text-white tracking-normal text-[11.5px] sm:text-[12.5px]">
                                      {t.name}
                                    </span>
                                    {t.group && (
                                      <span className="text-[8.5px] px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-black uppercase">
                                        {String(t.group).toLowerCase().startsWith('group') ? t.group : `Group ${t.group}`}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] text-slate-400 tracking-normal font-semibold">
                                    <span>Code: <strong className="text-slate-600 dark:text-slate-300">{t.shortName}</strong></span>
                                    {t.captain && (
                                      <span>• Capt: <strong className="text-slate-600 dark:text-slate-300">{t.captain}</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Played */}
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-500">{t.played}</td>

                            {/* Win */}
                            <td className="py-3.5 px-2 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{t.won}</td>

                            {/* Loss */}
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{t.lost}</td>

                            {/* Tied */}
                            <td className="py-3.5 px-2 text-center font-mono text-slate-400">{t.tied}</td>

                            {/* For Runs / Overs */}
                            <td className="py-3.5 px-2 text-center font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              {t.runsScored}/{t.oversFaced.toFixed(1)}
                            </td>

                            {/* Against Runs / Overs */}
                            <td className="py-3.5 px-2 text-center font-mono text-[10px] text-slate-500 dark:text-slate-400">
                              {t.runsConceded}/{t.oversBowled.toFixed(1)}
                            </td>

                            {/* Net Run Rate Breakdown */}
                            <td className="py-3.5 px-3 text-center relative cursor-help group-nrr">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-md font-mono font-black text-[11px] border ${
                                  t.NRR > 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : t.NRR < 0
                                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)}
                              </span>

                              {/* Live Calculation Tooltip popup */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 shadow-2xl w-56 text-left z-50 normal-case select-none pointer-events-none">
                                <p className="font-extrabold text-[9px] tracking-wider text-emerald-400 mb-1.5 uppercase">
                                  {t.name} NRR Formula
                                </p>
                                <div className="text-[9.5px] font-mono text-slate-300 space-y-1.5">
                                  <div className="space-y-0.5 pb-1 border-b border-white/10">
                                    <p className="flex justify-between font-sans">
                                      <span>Runs Scored:</span>
                                      <span className="text-white font-mono font-bold">{t.runsScored} ({t.oversFaced} ov)</span>
                                    </p>
                                    <p className="text-slate-400 flex justify-between font-sans">
                                      <span>Run Rate For:</span>
                                      <span className="text-emerald-300 font-bold">
                                        {calculateOversDecimal(t.oversFaced) > 0
                                          ? (t.runsScored / calculateOversDecimal(t.oversFaced)).toFixed(3)
                                          : '0.000'}
                                      </span>
                                    </p>
                                  </div>

                                  <div className="space-y-0.5 pt-0.5 pb-1.5 border-b border-white/10">
                                    <p className="flex justify-between font-sans">
                                      <span>Runs Conceded:</span>
                                      <span className="text-white font-mono font-bold">{t.runsConceded} ({t.oversBowled} ov)</span>
                                    </p>
                                    <p className="text-slate-400 flex justify-between font-sans">
                                      <span>Run Rate Against:</span>
                                      <span className="text-rose-300 font-bold">
                                        {calculateOversDecimal(t.oversBowled) > 0
                                          ? (t.runsConceded / calculateOversDecimal(t.oversBowled)).toFixed(3)
                                          : '0.000'}
                                      </span>
                                    </p>
                                  </div>

                                  <p className="flex justify-between font-sans font-black text-[10px] pt-1 text-emerald-400">
                                    <span>Net Run Rate:</span>
                                    <span>{t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Points */}
                            <td className="py-3.5 px-2.5 text-center bg-emerald-500/[0.03] font-black text-emerald-500 text-sm">
                              {t.points}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </AnimatePresence>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AUTOMATIC MATCH RESULTS & RULES PANEL (Cols 4/12) */}
        <div className="lg:col-span-4 space-y-6">
          {/* COMPLETED TOURNAMENT MATCHES LOG */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span>Completed Match Results ({completedMatchesLog.length})</span>
              </h4>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Auto-Applied
              </span>
            </div>

            {completedMatchesLog.length === 0 ? (
              <div className="text-center py-6 space-y-2 select-none">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  No completed matches recorded yet.
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  As soon as a match finishes in the <strong>5-Day Bracket</strong> or <strong>Live Scorer</strong>, its result will automatically update the Points Table & NRR here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 select-text">
                {completedMatchesLog.map(m => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-1.5 text-2xs font-semibold relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-600" />

                    {m.stage && (
                      <div className="flex items-center justify-between pl-1.5 text-[9px] text-slate-400 font-bold uppercase">
                        <span>{m.stage}</span>
                        {onOpenMatchScorecard && (
                          <button
                            type="button"
                            onClick={() => onOpenMatchScorecard(m.id)}
                            className="text-emerald-500 hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer font-black"
                          >
                            <FileText size={10} /> Scorecard
                          </button>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center pl-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span>{m.teamAName}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{m.scoreA}</span>
                    </div>

                    <div className="flex justify-between items-center pl-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <span>{m.teamBName}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">{m.scoreB}</span>
                    </div>

                    <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 pl-1.5">
                      <Flame size={10} className="text-amber-500 shrink-0" />
                      <span>{m.resultText}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* UPCOMING / LIVE FIXTURES QUEUE */}
          {upcomingOrLiveMatches.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-500" />
                  <span>Next Active Matches ({upcomingOrLiveMatches.length})</span>
                </h4>
                <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1">
                  <Clock size={10} /> Auto-Queue
                </span>
              </div>

              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                {upcomingOrLiveMatches.map(m => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800 space-y-1 text-[11px]"
                  >
                    <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
                      <span className="truncate">{m.stage || 'Tournament Match'}</span>
                      <span
                        className={
                          m.status === 'live'
                            ? 'text-rose-500 animate-pulse'
                            : 'text-indigo-500'
                        }
                      >
                        {m.status === 'live' ? '● LIVE' : 'UPCOMING'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-extrabold text-slate-800 dark:text-slate-200">
                      <span className="truncate">{m.teamAName}</span>
                      <span className="text-[9px] font-black text-slate-400 px-1.5">VS</span>
                      <span className="truncate text-right">{m.teamBName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OFFICIAL AUTO-CALCULATION RULES SUMMARY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-3">
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Info size={13} className="text-indigo-500" /> Automatic Points & NRR Rules
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400">+2 Pts</span>
                <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Match Win</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="block text-sm font-black text-amber-600 dark:text-amber-400">+1 Pt</span>
                <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Tie / NR</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="block text-sm font-black text-rose-500">0 Pts</span>
                <span className="text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">Match Loss</span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              • <strong>Non-Editable Official Table:</strong> Manual editing of points or NRR is disabled to ensure fair tournament integrity.<br />
              • <strong>All-Out Quota Rule:</strong> If a team is bowled out (10 wickets), the full {standardOversQuota}-over quota is counted against them for NRR calculation.<br />
              • <strong>Tie-Breaker Order:</strong> 1) Points ➔ 2) Wins ➔ 3) Net Run Rate (NRR) ➔ 4) Head-to-Head.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
