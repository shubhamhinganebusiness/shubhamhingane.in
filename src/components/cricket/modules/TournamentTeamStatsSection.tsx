import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Trophy, Flame, Zap, Award, Search, Download, Target,
  ArrowUpDown, Filter, BarChart3, TrendingUp, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';

export interface TeamTournamentStats {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  winPercentage: number;
  highestTotal: {
    runs: number;
    wickets: number;
    overs: number;
    opponent: string;
    result: string;
  };
  lowestDefended: {
    runs: number;
    wickets: number;
    opponent: string;
    opponentRuns: number;
  } | null;
  highestChase: {
    runs: number;
    wickets: number;
    overs: number;
    target: number;
    opponent: string;
  } | null;
  totalRunsScored: number;
  totalOversBatted: number;
  battingRunRate: number;
  totalRunsConceded: number;
  totalOversBowled: number;
  bowlingEconomy: number;
  totalSixes: number;
  totalFours: number;
  totalWicketsTaken: number;
  biggestWinRuns: {
    margin: number;
    opponent: string;
    score: string;
  } | null;
  biggestWinWickets: {
    margin: number;
    opponent: string;
    score: string;
  } | null;
  powerplayAverage: number;
  deathOversRunRate: number;
}

export type TeamMetricKey = 
  | 'highest_total'
  | 'lowest_defended'
  | 'highest_chase'
  | 'run_rate'
  | 'most_sixes'
  | 'most_fours'
  | 'bowling_economy'
  | 'wickets_taken'
  | 'win_percentage'
  | 'biggest_win_runs';

interface TeamMetricMeta {
  key: TeamMetricKey;
  label: string;
  icon: string;
  description: string;
  badge: string;
}

const METRICS: TeamMetricMeta[] = [
  { key: 'highest_total', label: 'Highest Team Total', icon: '🔥', description: 'Peak innings scores recorded by squads in the tournament', badge: 'Record Scores' },
  { key: 'lowest_defended', label: 'Lowest Defended Total', icon: '🛡️', description: 'Lowest targets successfully guarded by bowling attacks', badge: 'Bowling Grits' },
  { key: 'highest_chase', label: 'Highest Successful Chase', icon: '🎯', description: 'Biggest targets chased down in the 2nd innings', badge: 'Chase Masters' },
  { key: 'run_rate', label: 'Best Team Run Rate', icon: '⚡', description: 'Tournament overall scoring rate per over', badge: 'Fast Scorers' },
  { key: 'most_sixes', label: 'Most Sixes by Squad', icon: '🚀', description: 'Total maximums dispatched into the stands', badge: 'Maximums' },
  { key: 'most_fours', label: 'Most Fours by Squad', icon: '🏏', description: 'Total boundary ropes found across matches', badge: 'Boundaries' },
  { key: 'bowling_economy', label: 'Best Bowling Economy', icon: '🔒', description: 'Tighest bowling units conceding fewest runs per over', badge: 'Miserly' },
  { key: 'wickets_taken', label: 'Most Wickets Taken', icon: '⚾', description: 'Total opposition dismissals claimed by squad attack', badge: 'Wicket Machines' },
  { key: 'win_percentage', label: 'Highest Win Ratio', icon: '🏆', description: 'Dominant match winning percentage across matches', badge: 'Win Rate' },
  { key: 'biggest_win_runs', label: 'Biggest Win Margin (Runs)', icon: '👑', description: 'Largest blowout victory margins by runs', badge: 'Blowout Win' }
];

interface TournamentTeamStatsSectionProps {
  stats: TeamTournamentStats[];
  tournamentName?: string;
  onSelectTeam?: (teamName: string) => void;
}

export const TournamentTeamStatsSection: React.FC<TournamentTeamStatsSectionProps> = ({
  stats,
  tournamentName = 'Tournament',
  onSelectTeam
}) => {
  const [selectedMetric, setSelectedMetric] = useState<TeamMetricKey>('highest_total');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [compactMetricView, setCompactMetricView] = useState(false);

  // Filtered & sorted list
  const filteredAndSortedList = useMemo(() => {
    let list = [...stats];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.teamName.toLowerCase().includes(q));
    }

    switch (selectedMetric) {
      case 'highest_total':
        list.sort((a, b) => b.highestTotal.runs - a.highestTotal.runs);
        break;
      case 'lowest_defended':
        list = list.filter(t => t.lowestDefended !== null);
        // Lower is better for lowest defended total
        list.sort((a, b) => (a.lowestDefended?.runs || 999) - (b.lowestDefended?.runs || 999));
        break;
      case 'highest_chase':
        list = list.filter(t => t.highestChase !== null);
        list.sort((a, b) => (b.highestChase?.target || 0) - (a.highestChase?.target || 0));
        break;
      case 'run_rate':
        list.sort((a, b) => b.battingRunRate - a.battingRunRate);
        break;
      case 'most_sixes':
        list.sort((a, b) => b.totalSixes - a.totalSixes);
        break;
      case 'most_fours':
        list.sort((a, b) => b.totalFours - a.totalFours);
        break;
      case 'bowling_economy':
        // Lower is better for bowling economy
        list.sort((a, b) => a.bowlingEconomy - b.bowlingEconomy);
        break;
      case 'wickets_taken':
        list.sort((a, b) => b.totalWicketsTaken - a.totalWicketsTaken);
        break;
      case 'win_percentage':
        list.sort((a, b) => b.winPercentage - a.winPercentage || b.matchesWon - a.matchesWon);
        break;
      case 'biggest_win_runs':
        list = list.filter(t => t.biggestWinRuns !== null);
        list.sort((a, b) => (b.biggestWinRuns?.margin || 0) - (a.biggestWinRuns?.margin || 0));
        break;
      default:
        list.sort((a, b) => b.highestTotal.runs - a.highestTotal.runs);
    }

    if (sortOrder === 'asc' && selectedMetric !== 'lowest_defended' && selectedMetric !== 'bowling_economy') {
      list.reverse();
    } else if (sortOrder === 'desc' && (selectedMetric === 'lowest_defended' || selectedMetric === 'bowling_economy')) {
      // For naturally asc metrics, reverse if user wants descending
      // Keep naturally sorted order
    }

    return list;
  }, [stats, searchQuery, selectedMetric, sortOrder]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return filteredAndSortedList.slice(0, 3);
  }, [filteredAndSortedList]);

  // Format value for active metric
  const formatMetricValue = (t: TeamTournamentStats) => {
    switch (selectedMetric) {
      case 'highest_total':
        return `${t.highestTotal.runs}/${t.highestTotal.wickets} (${t.highestTotal.overs} ov)`;
      case 'lowest_defended':
        return t.lowestDefended 
          ? `${t.lowestDefended.runs}/${t.lowestDefended.wickets} (vs ${t.lowestDefended.opponent})` 
          : 'N/A';
      case 'highest_chase':
        return t.highestChase 
          ? `${t.highestChase.runs}/${t.highestChase.wickets} in ${t.highestChase.overs} ov (Target: ${t.highestChase.target})` 
          : 'N/A';
      case 'run_rate':
        return `${t.battingRunRate} RPO`;
      case 'most_sixes':
        return `${t.totalSixes} Sixes`;
      case 'most_fours':
        return `${t.totalFours} Fours`;
      case 'bowling_economy':
        return `${t.bowlingEconomy} Econ`;
      case 'wickets_taken':
        return `${t.totalWicketsTaken} Wkts`;
      case 'win_percentage':
        return `${t.winPercentage}% (${t.matchesWon}W / ${t.matchesLost}L)`;
      case 'biggest_win_runs':
        return t.biggestWinRuns ? `+${t.biggestWinRuns.margin} Runs` : 'N/A';
      default:
        return `${t.highestTotal.runs}`;
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredAndSortedList.length === 0) return;
    const headers = [
      'Rank', 'Squad', 'Matches Played', 'Won', 'Lost', 'Win %',
      'Highest Total', 'Highest Total Opponent', 'Lowest Defended',
      'Highest Chase', 'Batting Run Rate', 'Bowling Economy',
      'Total Sixes', 'Total Fours', 'Total Wickets Taken'
    ];
    const rows = filteredAndSortedList.map((t, idx) => [
      idx + 1,
      `"${t.teamName}"`,
      t.matchesPlayed,
      t.matchesWon,
      t.matchesLost,
      `${t.winPercentage}%`,
      `"${t.highestTotal.runs}/${t.highestTotal.wickets}"`,
      `"${t.highestTotal.opponent}"`,
      t.lowestDefended ? `"${t.lowestDefended.runs} vs ${t.lowestDefended.opponent}"` : 'N/A',
      t.highestChase ? `"${t.highestChase.runs} vs ${t.highestChase.opponent}"` : 'N/A',
      t.battingRunRate,
      t.bowlingEconomy,
      t.totalSixes,
      t.totalFours,
      t.totalWicketsTaken
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tournamentName.replace(/\s+/g, '_')}_Team_Stats_${selectedMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                🛡️ CricHeroes Team Performance Analytics
              </span>
              <span className="px-3 py-1 bg-emerald-400/30 text-emerald-100 rounded-full text-[10px] font-extrabold uppercase">
                {stats.length} Registered Squads
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight flex items-center gap-2">
              Tournament Team Statistics & Records
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium mt-1 max-w-xl">
              Deep squad insights across {tournamentName}: record team totals, lowest defended defense feats, successful run chases, boundaries, and bowling economy.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setCompactMetricView(!compactMetricView)}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm border border-white/20"
            >
              <BarChart3 size={14} />
              {compactMetricView ? 'Expand Metrics' : 'Compact Grid'}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* METRIC SELECTION BENTO CARDS */}
      {!compactMetricView ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {METRICS.map(m => {
            const isSelected = selectedMetric === m.key;
            // Leader preview value
            let preview = '';
            if (m.key === 'highest_total' && stats.length > 0) {
              const top = [...stats].sort((a,b) => b.highestTotal.runs - a.highestTotal.runs)[0];
              preview = top ? `${top.highestTotal.runs}/${top.highestTotal.wickets}` : '-';
            } else if (m.key === 'lowest_defended' && stats.length > 0) {
              const eligible = stats.filter(t => t.lowestDefended !== null);
              const top = eligible.sort((a,b) => (a.lowestDefended?.runs || 999) - (b.lowestDefended?.runs || 999))[0];
              preview = top?.lowestDefended ? `${top.lowestDefended.runs} defended` : 'N/A';
            } else if (m.key === 'highest_chase' && stats.length > 0) {
              const eligible = stats.filter(t => t.highestChase !== null);
              const top = eligible.sort((a,b) => (b.highestChase?.target || 0) - (a.highestChase?.target || 0))[0];
              preview = top?.highestChase ? `${top.highestChase.target} chased` : 'N/A';
            } else if (m.key === 'run_rate' && stats.length > 0) {
              const top = [...stats].sort((a,b) => b.battingRunRate - a.battingRunRate)[0];
              preview = top ? `${top.battingRunRate} RPO` : '-';
            } else if (m.key === 'most_sixes' && stats.length > 0) {
              const top = [...stats].sort((a,b) => b.totalSixes - a.totalSixes)[0];
              preview = top ? `${top.totalSixes} 6s` : '-';
            } else if (m.key === 'most_fours' && stats.length > 0) {
              const top = [...stats].sort((a,b) => b.totalFours - a.totalFours)[0];
              preview = top ? `${top.totalFours} 4s` : '-';
            } else if (m.key === 'bowling_economy' && stats.length > 0) {
              const top = [...stats].sort((a,b) => a.bowlingEconomy - b.bowlingEconomy)[0];
              preview = top ? `${top.bowlingEconomy} Econ` : '-';
            } else if (m.key === 'wickets_taken' && stats.length > 0) {
              const top = [...stats].sort((a,b) => b.totalWicketsTaken - a.totalWicketsTaken)[0];
              preview = top ? `${top.totalWicketsTaken} wkts` : '-';
            } else if (m.key === 'win_percentage' && stats.length > 0) {
              const top = [...stats].sort((a,b) => b.winPercentage - a.winPercentage)[0];
              preview = top ? `${top.winPercentage}% Win` : '-';
            } else if (m.key === 'biggest_win_runs' && stats.length > 0) {
              const eligible = stats.filter(t => t.biggestWinRuns !== null);
              const top = eligible.sort((a,b) => (b.biggestWinRuns?.margin || 0) - (a.biggestWinRuns?.margin || 0))[0];
              preview = top?.biggestWinRuns ? `+${top.biggestWinRuns.margin} Runs` : 'N/A';
            }

            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-600/20 ring-2 ring-emerald-400/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 text-slate-800 dark:text-slate-100 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xl">{m.icon}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {m.badge}
                  </span>
                </div>
                <div>
                  <h4 className={`text-xs font-black tracking-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {m.label}
                  </h4>
                  <p className={`text-[10px] font-extrabold mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {preview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {METRICS.map(m => {
            const isSelected = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TOP 3 PODIUM FOR SELECTED METRIC */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {topThree.map((t, idx) => {
            const isFirst = idx === 0;
            const rankBadge = isFirst ? '🥇 Gold' : idx === 1 ? '🥈 Silver' : '🥉 Bronze';
            const medalColor = isFirst 
              ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent' 
              : idx === 1 
              ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/40' 
              : 'border-orange-300 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20';

            return (
              <div
                key={t.teamId}
                className={`p-4 rounded-3xl border ${medalColor} relative overflow-hidden space-y-3 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {rankBadge}
                  </span>
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Win: {t.winPercentage}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-lg">
                    {t.teamName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      {t.teamName}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-semibold">
                      {t.matchesWon} Wins • {t.matchesLost} Losses ({t.matchesPlayed} Matches)
                    </p>
                  </div>
                </div>

                {/* Primary Metric Showcase */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800 space-y-1">
                  <div className="text-[10px] font-black uppercase text-slate-400">
                    {METRICS.find(m => m.key === selectedMetric)?.label}
                  </div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {formatMetricValue(t)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/50 dark:border-slate-800/60 text-[10px] font-bold">
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">Run Rate</span>
                    <span className="text-slate-800 dark:text-slate-200">{t.battingRunRate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">Economy</span>
                    <span className="text-slate-800 dark:text-slate-200">{t.bowlingEconomy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[9px]">6s / 4s</span>
                    <span className="text-slate-800 dark:text-slate-200">{t.totalSixes} / {t.totalFours}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEARCH AND FILTER TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search squad name..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown size={13} />
              {sortOrder === 'desc' ? 'High to Low' : 'Low to High'}
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE TEAM STATS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 text-center w-12">Rank</th>
                <th className="py-3 px-3">Squad</th>
                <th className="py-3 px-3 text-center">P / W / L</th>
                <th className="py-3 px-3 text-center">Win %</th>
                <th className="py-3 px-3 text-center">Highest Total</th>
                <th className="py-3 px-3 text-center">Lowest Defended</th>
                <th className="py-3 px-3 text-center">Run Rate</th>
                <th className="py-3 px-3 text-center">Economy</th>
                <th className="py-3 px-3 text-center">6s / 4s</th>
                <th className="py-3 px-3 text-center">Wickets Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {filteredAndSortedList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No team records found matching your query.
                  </td>
                </tr>
              ) : (
                filteredAndSortedList.map((t, idx) => {
                  return (
                    <tr
                      key={t.teamId}
                      className="hover:bg-emerald-500/5 transition-colors group"
                    >
                      <td className="py-3.5 px-3 text-center font-black text-slate-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                            {t.teamName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 dark:text-white text-xs">
                              {t.teamName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              PP Avg: {t.powerplayAverage} • Death RR: {t.deathOversRunRate}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        {t.matchesPlayed} / <span className="text-emerald-600 dark:text-emerald-400">{t.matchesWon}</span> / <span className="text-rose-500">{t.matchesLost}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-xs text-slate-900 dark:text-white">
                        {t.winPercentage}%
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {t.highestTotal.runs}/{t.highestTotal.wickets}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          vs {t.highestTotal.opponent}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">
                        {t.lowestDefended ? (
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{t.lowestDefended.runs}</span>
                            <span className="text-[9px] text-slate-400 block">vs {t.lowestDefended.opponent}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400">
                        {t.battingRunRate}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-teal-600 dark:text-teal-400">
                        {t.bowlingEconomy}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        <span className="text-amber-600 dark:text-amber-400 font-extrabold">{t.totalSixes}</span> / {t.totalFours}
                      </td>
                      <td className="py-3.5 px-3 text-center font-black text-slate-900 dark:text-white">
                        {t.totalWicketsTaken}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
