import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Zap, Award, TrendingUp, Clock, Sparkles, 
  Search, Download, Filter, Crown, Medal, ArrowUpRight, Check,
  AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { PlayerCareerStats } from '../CareerPlayerCardModal';

export type BattingMetricKey = 
  | 'most_runs'
  | 'best_average'
  | 'best_strike_rate'
  | 'best_inning_sr'
  | 'most_ducks'
  | 'most_sixes'
  | 'most_fours'
  | 'sixes_in_inning'
  | 'fours_in_inning'
  | 'most_boundary_runs'
  | 'most_thirties'
  | 'most_fifties'
  | 'longest_innings'
  | 'fastest_thirty'
  | 'fastest_fifty';

export interface EnhancedBattingStats {
  playerName: string;
  teamName: string;
  innings: number;
  notOuts: number;
  runs: number;
  balls: number;
  highestScore: number;
  highestScoreNotOut?: boolean;
  strikeRate: number;
  average: number;
  fours: number;
  sixes: number;
  boundaryRuns: number;
  boundaryPercentage: number;
  ducks: number;
  thirties: number;
  fifties: number;
  hundreds: number;
  bestInningStrikeRate: number;
  bestInningSRDetails: string; // e.g. "36* (12 balls)"
  sixesInInning: number;
  sixesInInningDetails: string; // e.g. "6 sixes vs Warriors"
  foursInInning: number;
  foursInInningDetails: string; // e.g. "8 fours vs Lions"
  longestInningBalls: number;
  longestInningDetails: string; // e.g. "56 balls (74 runs)"
  fastestThirtyBalls: number | null;
  fastestThirtyDetails: string; // e.g. "32 in 11 balls"
  fastestFiftyBalls: number | null;
  fastestFiftyDetails: string; // e.g. "54 in 18 balls"
  // For career card modal
  rawPlayerStats?: any;
}

export interface BattingMetricConfig {
  key: BattingMetricKey;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  iconName: string;
  color: string;
  getValue: (p: EnhancedBattingStats) => number;
  formatValue: (p: EnhancedBattingStats) => string;
  subValueFormat: (p: EnhancedBattingStats) => string;
  ascending?: boolean; // For fastest 30/50, lower balls is better
}

export const BATTING_METRIC_CONFIGS: BattingMetricConfig[] = [
  {
    key: 'most_runs',
    label: 'Tournament Most Runs (Orange Cap)',
    shortLabel: 'Most Runs',
    badge: '👑 Orange Cap',
    description: 'Total tournament aggregate runs across all matches',
    iconName: 'Crown',
    color: 'from-amber-500 to-orange-500 text-amber-500',
    getValue: (p) => p.runs,
    formatValue: (p) => `${p.runs} Runs`,
    subValueFormat: (p) => `${p.innings} inn • Avg ${p.average} • SR ${p.strikeRate}`
  },
  {
    key: 'best_average',
    label: 'Best Batting Average',
    shortLabel: 'Best Average',
    badge: '📈 Consistency',
    description: 'Runs scored per dismissal (Minimum 2 innings)',
    iconName: 'TrendingUp',
    color: 'from-emerald-500 to-teal-500 text-emerald-500',
    getValue: (p) => (p.innings >= 1 ? p.average : 0),
    formatValue: (p) => `${p.average}`,
    subValueFormat: (p) => `${p.runs} runs in ${p.innings} inn (${p.notOuts} NO)`
  },
  {
    key: 'best_strike_rate',
    label: 'Best Tournament Strike Rate',
    shortLabel: 'Best Strike Rate',
    badge: '⚡ Strike Velocity',
    description: 'Runs per 100 balls across the tournament (Min 20 balls faced)',
    iconName: 'Zap',
    color: 'from-indigo-500 to-purple-500 text-indigo-500',
    getValue: (p) => (p.balls >= 15 ? p.strikeRate : 0),
    formatValue: (p) => `${p.strikeRate}`,
    subValueFormat: (p) => `${p.runs} runs off ${p.balls} balls`
  },
  {
    key: 'best_inning_sr',
    label: 'Highest Inning Strike Rate',
    shortLabel: 'Inning Strike Rate',
    badge: '💥 Explosive Innings',
    description: 'Highest strike rate recorded in a single match innings (Min 10 balls)',
    iconName: 'Flame',
    color: 'from-rose-500 to-amber-500 text-rose-500',
    getValue: (p) => p.bestInningStrikeRate,
    formatValue: (p) => `${p.bestInningStrikeRate} SR`,
    subValueFormat: (p) => p.bestInningSRDetails
  },
  {
    key: 'most_sixes',
    label: 'Most Tournament Sixes',
    shortLabel: 'Most Sixes',
    badge: '🚀 Maximums King',
    description: 'Total sixes cleared over the boundary rope',
    iconName: 'Sparkles',
    color: 'from-purple-500 to-pink-500 text-purple-500',
    getValue: (p) => p.sixes,
    formatValue: (p) => `${p.sixes} Sixes`,
    subValueFormat: (p) => `${p.sixes * 6} runs from sixes (${p.runs} tot)`
  },
  {
    key: 'most_fours',
    label: 'Most Tournament Fours',
    shortLabel: 'Most Fours',
    badge: '🎯 Boundary Master',
    description: 'Total four boundaries scored across the tournament',
    iconName: 'Award',
    color: 'from-blue-500 to-cyan-500 text-blue-500',
    getValue: (p) => p.fours,
    formatValue: (p) => `${p.fours} Fours`,
    subValueFormat: (p) => `${p.fours * 4} runs from fours`
  },
  {
    key: 'sixes_in_inning',
    label: 'Most Sixes in an Innings',
    shortLabel: 'Sixes in Innings',
    badge: '💣 Single-Match High',
    description: 'Most sixes hit in an individual tournament innings',
    iconName: 'Flame',
    color: 'from-red-500 to-orange-500 text-red-500',
    getValue: (p) => p.sixesInInning,
    formatValue: (p) => `${p.sixesInInning} Sixes`,
    subValueFormat: (p) => p.sixesInInningDetails
  },
  {
    key: 'fours_in_inning',
    label: 'Most Fours in an Innings',
    shortLabel: 'Fours in Innings',
    badge: '🔥 Rapid Boundaries',
    description: 'Most fours hit in an individual tournament match',
    iconName: 'Zap',
    color: 'from-amber-500 to-yellow-500 text-amber-500',
    getValue: (p) => p.foursInInning,
    formatValue: (p) => `${p.foursInInning} Fours`,
    subValueFormat: (p) => p.foursInInningDetails
  },
  {
    key: 'most_boundary_runs',
    label: 'Most Boundary Runs',
    shortLabel: 'Boundary Runs',
    badge: '🏏 Boundaries Share',
    description: 'Total runs generated solely through 4s and 6s',
    iconName: 'Trophy',
    color: 'from-emerald-500 to-cyan-500 text-emerald-500',
    getValue: (p) => p.boundaryRuns,
    formatValue: (p) => `${p.boundaryRuns} Runs`,
    subValueFormat: (p) => `${p.boundaryPercentage}% of total (${p.fours}×4, ${p.sixes}×6)`
  },
  {
    key: 'most_thirties',
    label: 'Most 30+ Runs Innings',
    shortLabel: 'Most 30 Runs',
    badge: '🌟 Top Contributors',
    description: 'Number of individual innings reaching 30 runs or more',
    iconName: 'Award',
    color: 'from-sky-500 to-indigo-500 text-sky-500',
    getValue: (p) => p.thirties,
    formatValue: (p) => `${p.thirties} Times`,
    subValueFormat: (p) => `In ${p.innings} innings batted`
  },
  {
    key: 'most_fifties',
    label: 'Most 50+ Runs Innings',
    shortLabel: 'Most 50 Runs',
    badge: '🏆 Half-Centuries',
    description: 'Number of half-centuries (50-99 runs) registered',
    iconName: 'Medal',
    color: 'from-amber-600 to-yellow-500 text-amber-600',
    getValue: (p) => p.fifties,
    formatValue: (p) => `${p.fifties} Fifties`,
    subValueFormat: (p) => `HS: ${p.highestScore}${p.highestScoreNotOut ? '*' : ''}`
  },
  {
    key: 'longest_innings',
    label: 'Longest Innings (Balls Faced)',
    shortLabel: 'Longest Innings',
    badge: '⏱️ Marathon Knock',
    description: 'Most balls faced by a batter in a single innings',
    iconName: 'Clock',
    color: 'from-slate-600 to-slate-800 text-slate-600 dark:text-slate-300',
    getValue: (p) => p.longestInningBalls,
    formatValue: (p) => `${p.longestInningBalls} Balls`,
    subValueFormat: (p) => p.longestInningDetails
  },
  {
    key: 'fastest_thirty',
    label: 'Fastest 30 Runs',
    shortLabel: 'Fastest 30',
    badge: '⚡ Blitzkrieg 30',
    description: 'Fewest balls faced to reach 30 runs in an innings',
    iconName: 'Zap',
    color: 'from-teal-500 to-emerald-600 text-teal-500',
    ascending: true,
    getValue: (p) => (p.fastestThirtyBalls !== null ? p.fastestThirtyBalls : 999),
    formatValue: (p) => (p.fastestThirtyBalls !== null ? `${p.fastestThirtyBalls} Balls` : 'N/A'),
    subValueFormat: (p) => p.fastestThirtyDetails
  },
  {
    key: 'fastest_fifty',
    label: 'Fastest 50 Runs',
    shortLabel: 'Fastest 50',
    badge: '🚀 Rapid Fifty',
    description: 'Fewest balls taken to score 50 runs in an innings',
    iconName: 'Crown',
    color: 'from-orange-500 to-red-600 text-orange-500',
    ascending: true,
    getValue: (p) => (p.fastestFiftyBalls !== null ? p.fastestFiftyBalls : 999),
    formatValue: (p) => (p.fastestFiftyBalls !== null ? `${p.fastestFiftyBalls} Balls` : 'N/A'),
    subValueFormat: (p) => p.fastestFiftyDetails
  },
  {
    key: 'most_ducks',
    label: 'Most Ducks (0 Runs)',
    shortLabel: 'Most Ducks',
    badge: '🦆 Ducks Wall',
    description: 'Number of times dismissed for zero runs in the tournament',
    iconName: 'AlertCircle',
    color: 'from-slate-500 to-rose-600 text-rose-500',
    getValue: (p) => p.ducks,
    formatValue: (p) => `${p.ducks} Ducks`,
    subValueFormat: (p) => `From ${p.innings} tournament innings`
  }
];

interface TournamentBattingStatsSectionProps {
  stats: EnhancedBattingStats[];
  onOpenPlayerCard?: (player: any) => void;
  tournamentName?: string;
}

export const TournamentBattingStatsSection: React.FC<TournamentBattingStatsSectionProps> = ({
  stats,
  onOpenPlayerCard,
  tournamentName = 'Championship'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<BattingMetricKey>('most_runs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [showAllBento, setShowAllBento] = useState<boolean>(true);

  // Teams list for filter
  const teamsList = useMemo(() => {
    const set = new Set<string>();
    stats.forEach(s => {
      if (s.teamName) set.add(s.teamName);
    });
    return Array.from(set).sort();
  }, [stats]);

  const activeConfig = useMemo(() => {
    return BATTING_METRIC_CONFIGS.find(c => c.key === selectedMetric) || BATTING_METRIC_CONFIGS[0];
  }, [selectedMetric]);

  // Ranked players for current metric
  const rankedPlayers = useMemo(() => {
    let filtered = [...stats];

    if (selectedTeamFilter !== 'all') {
      filtered = filtered.filter(p => p.teamName === selectedTeamFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.playerName.toLowerCase().includes(q) || 
        p.teamName.toLowerCase().includes(q)
      );
    }

    if (activeConfig.ascending) {
      // For lowest balls (fastest 30/50), exclude 999 / null
      filtered.sort((a, b) => {
        const valA = activeConfig.getValue(a);
        const valB = activeConfig.getValue(b);
        return valA - valB;
      });
      // Filter out invalid items if any
      filtered = filtered.filter(p => activeConfig.getValue(p) < 990);
    } else {
      filtered.sort((a, b) => {
        const valA = activeConfig.getValue(a);
        const valB = activeConfig.getValue(b);
        return valB - valA;
      });
    }

    return filtered;
  }, [stats, activeConfig, selectedTeamFilter, searchQuery]);

  // Top 3 Podium
  const topThree = rankedPlayers.slice(0, 3);

  // Export CSV of Current Batting Leaderboard
  const handleExportCSV = () => {
    const headers = ["Rank", "Player", "Squad", activeConfig.label, "Innings", "Runs", "Balls", "High Score", "Strike Rate", "Average", "4s", "6s", "Boundary %", "Details"];
    const rows = rankedPlayers.map((p, idx) => [
      idx + 1,
      `"${p.playerName.replace(/"/g, '""')}"`,
      `"${p.teamName.replace(/"/g, '""')}"`,
      `"${activeConfig.formatValue(p)}"`,
      p.innings,
      p.runs,
      p.balls,
      `${p.highestScore}${p.highestScoreNotOut ? '*' : ''}`,
      p.strikeRate,
      p.average,
      p.fours,
      p.sixes,
      `${p.boundaryPercentage}%`,
      `"${activeConfig.subValueFormat(p).replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${tournamentName.replace(/\s+/g, '_')}_${activeConfig.key}_stats.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER WITH BENTO TOGGLE & EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              🏏 CricHeroes & Cricbuzz Tournament Analytics
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-1">
            Tournament Batting Statistics
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Explore 15 in-depth batting metrics including Orange Cap, strike rates, milestone speed, and boundary dominance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAllBento(!showAllBento)}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>{showAllBento ? 'Hide Snapshot Grid' : 'Show Snapshot Grid'}</span>
            {showAllBento ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* QUICK BENTO SNAPSHOT GRID (15 Top Records at a Glance) */}
      <AnimatePresence>
        {showAllBento && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {BATTING_METRIC_CONFIGS.map(config => {
                // Find top player for this config
                const sorted = [...stats].sort((a, b) => {
                  const valA = config.getValue(a);
                  const valB = config.getValue(b);
                  return config.ascending ? valA - valB : valB - valA;
                });
                const leader = config.ascending ? sorted.find(p => config.getValue(p) < 990) : sorted[0];
                const isSelected = selectedMetric === config.key;

                return (
                  <div
                    key={config.key}
                    onClick={() => setSelectedMetric(config.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 dark:bg-amber-500/15'
                        : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
                          {config.badge}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-white block group-hover:text-amber-500 transition-colors truncate">
                        {config.shortLabel}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {leader ? (
                        <>
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-sm font-black text-amber-600 dark:text-amber-400 truncate">
                              {config.formatValue(leader)}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate block mt-0.5">
                            {leader.playerName}
                          </span>
                          <span className="text-[8.5px] text-slate-400 font-medium truncate block">
                            {leader.teamName}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] text-slate-400">No records</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRIC SELECTION PILLS (15 Filter Tabs) */}
      <div className="bg-slate-100/80 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {BATTING_METRIC_CONFIGS.map(config => {
            const isSelected = selectedMetric === config.key;
            return (
              <button
                key={config.key}
                type="button"
                onClick={() => setSelectedMetric(config.key)}
                className={`py-2 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider whitespace-nowrap border cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{config.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE METRIC PODIUM (Top 3 Batters Highlight) */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((player, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;

            const badgeBg = isFirst 
              ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-amber-500/20' 
              : isSecond 
                ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-slate-500/20' 
                : 'bg-gradient-to-br from-amber-700 to-yellow-800 text-white shadow-amber-800/20';

            const cardBorder = isFirst
              ? 'border-amber-400 dark:border-amber-500/60 bg-amber-50/20 dark:bg-amber-950/10'
              : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900';

            return (
              <div
                key={`${player.playerName}-${idx}`}
                onClick={() => onOpenPlayerCard && onOpenPlayerCard(player.rawPlayerStats || player)}
                className={`p-5 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] cursor-pointer relative overflow-hidden group ${cardBorder}`}
              >
                {/* Rank Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shadow-sm ${badgeBg}`}>
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {isFirst ? '🥇 Tournament Leader' : isSecond ? '🥈 Second Place' : '🥉 Third Place'}
                    </span>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>

                {/* Player Profile & Team */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg border border-amber-500/30 shrink-0">
                    {player.playerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-base text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors truncate">
                      {player.playerName}
                    </h4>
                    <p className="text-xs text-slate-400 font-semibold truncate">{player.teamName}</p>
                  </div>
                </div>

                {/* Primary Metric Score Highlight */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    {activeConfig.shortLabel}
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                    {activeConfig.formatValue(player)}
                  </span>
                </div>

                {/* Sub-value detail */}
                <div className="mt-1 text-[10.5px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Details:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {activeConfig.subValueFormat(player)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search batsman or squad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-amber-500 transition-all"
          />
        </div>

        {/* Team Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
            <Filter size={11} className="text-amber-500" />
            <span>Team:</span>
          </div>
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-2 outline-none cursor-pointer hover:border-slate-300 transition-all max-w-[180px] truncate"
          >
            <option value="all">All Squads ({stats.length})</option>
            {teamsList.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DETAILED RANKINGS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm sm:text-base font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
              <Trophy size={16} className="text-amber-500" />
              <span>{activeConfig.label} Leaderboard</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              {activeConfig.description}
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase text-slate-400">
            Showing {rankedPlayers.length} batsmen
          </span>
        </div>

        {rankedPlayers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-xs font-bold uppercase">No batsmen found matching filter criteria.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTeamFilter('all');
              }}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold uppercase cursor-pointer border-none transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[750px] font-semibold">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-black tracking-wider bg-slate-50/50 dark:bg-slate-950/50">
                  <th className="py-3 px-3 text-center w-12">Rank</th>
                  <th className="py-3 px-3">Batsman / Squad</th>
                  <th className="py-3 px-3 text-center bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    {activeConfig.shortLabel}
                  </th>
                  <th className="py-3 px-3 text-center">Innings</th>
                  <th className="py-3 px-3 text-center">Runs</th>
                  <th className="py-3 px-3 text-center">Balls</th>
                  <th className="py-3 px-3 text-center">HS</th>
                  <th className="py-3 px-3 text-center">SR</th>
                  <th className="py-3 px-3 text-center">Avg</th>
                  <th className="py-3 px-3 text-center">4s / 6s</th>
                  <th className="py-3 px-3 text-center">Boundary %</th>
                  <th className="py-3 px-3 text-center">30s / 50s</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {rankedPlayers.map((player, idx) => {
                  const isTopOne = idx === 0;
                  return (
                    <tr
                      key={`${player.teamName}-${player.playerName}-${idx}`}
                      onClick={() => onOpenPlayerCard && onOpenPlayerCard(player.rawPlayerStats || player)}
                      className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-amber-50/30 dark:hover:bg-amber-950/15 cursor-pointer transition-colors group"
                      title="Click to view full player profile & career card"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3 text-center">
                        {isTopOne ? (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center mx-auto shadow-xs">
                            1
                          </span>
                        ) : idx < 3 ? (
                          <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] flex items-center justify-center mx-auto">
                            {idx + 1}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">{idx + 1}</span>
                        )}
                      </td>

                      {/* Batsman & Squad */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 dark:text-white group-hover:text-amber-500 transition-colors">
                            {player.playerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {player.teamName}
                          </span>
                        </div>
                      </td>

                      {/* Primary Highlighted Metric */}
                      <td className="py-3.5 px-3 text-center bg-amber-500/5 dark:bg-amber-500/10 font-black text-amber-600 dark:text-amber-400 text-sm">
                        {activeConfig.formatValue(player)}
                      </td>

                      {/* Innings */}
                      <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">
                        {player.innings}
                      </td>

                      {/* Runs */}
                      <td className="py-3.5 px-3 text-center font-extrabold text-slate-800 dark:text-slate-100">
                        {player.runs}
                      </td>

                      {/* Balls */}
                      <td className="py-3.5 px-3 text-center text-slate-400">
                        {player.balls}
                      </td>

                      {/* HS */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                        {player.highestScore}{player.highestScoreNotOut ? '*' : ''}
                      </td>

                      {/* SR */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {player.strikeRate}
                      </td>

                      {/* Avg */}
                      <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300">
                        {player.average}
                      </td>

                      {/* 4s / 6s */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{player.fours}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{player.sixes}</span>
                      </td>

                      {/* Boundary % */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        {player.boundaryPercentage}%
                      </td>

                      {/* 30s / 50s */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500">
                        <span>{player.thirties}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{player.fifties}</span>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-3 text-right text-[10.5px] text-slate-400 font-medium">
                        {activeConfig.subValueFormat(player)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
