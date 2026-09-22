import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Trophy, Flame, Zap, Award, Search, Download, Shield,
  ArrowUpDown, Filter, Sparkles, ChevronRight, User, Target, BarChart2
} from 'lucide-react';

export interface PartnershipRecord {
  id: string;
  batter1: string;
  batter1Runs: number;
  batter1Balls: number;
  batter2: string;
  batter2Runs: number;
  batter2Balls: number;
  runs: number;
  balls: number;
  wicket: number; // 1 = 1st Wicket (Opening), 2 = 2nd Wicket, etc.
  teamName: string;
  opponentName: string;
  fours: number;
  sixes: number;
  runRate: number;
  isNotOut: boolean;
  matchDate?: string;
  matchStage?: string;
  isWinningStand?: boolean;
}

export type PartnershipMetricKey = 
  | 'highest_runs'
  | 'fastest_rr'
  | 'century_stands'
  | 'fifty_stands'
  | 'wicket_records'
  | 'unbroken_stands'
  | 'boundary_blitz'
  | 'death_overs';

interface MetricMeta {
  key: PartnershipMetricKey;
  label: string;
  icon: string;
  description: string;
  badge: string;
}

const METRICS: MetricMeta[] = [
  { key: 'highest_runs', label: 'Highest Partnership', icon: '🏆', description: 'Highest run partnerships recorded in the tournament', badge: 'Record Stand' },
  { key: 'fastest_rr', label: 'Fastest Run Rate', icon: '⚡', description: 'Highest scoring rate partnerships (min. 25 runs)', badge: 'Explosive' },
  { key: 'century_stands', label: '100+ Century Stands', icon: '💯', description: 'Monumental 100+ run batting partnerships', badge: 'Elite' },
  { key: 'fifty_stands', label: '50+ Run Stands', icon: '🔥', description: 'Crucial half-century momentum-building partnerships', badge: 'Consistent' },
  { key: 'wicket_records', label: 'Wicket-by-Wicket Records', icon: '🎯', description: 'Record high stand for each wicket position (1st to 8th)', badge: 'Positional' },
  { key: 'unbroken_stands', label: 'Unbroken Not-Out Stands', icon: '🛡️', description: 'Finishers and chasing partnerships that remained unbeaten', badge: 'Unbeaten' },
  { key: 'boundary_blitz', label: 'Most Boundary Runs', icon: '💥', description: 'Most runs scored exclusively in 4s & 6s during stand', badge: 'Boundary Storm' },
  { key: 'death_overs', label: 'Late Overs Blitz', icon: '🚀', description: 'High-octane middle & lower order partnerships (Wickets 4+)', badge: 'Finishers' }
];

interface TournamentPartnershipStatsSectionProps {
  partnerships: PartnershipRecord[];
  onOpenPlayerCard?: (player: any) => void;
  tournamentName?: string;
}

export const TournamentPartnershipStatsSection: React.FC<TournamentPartnershipStatsSectionProps> = ({
  partnerships,
  onOpenPlayerCard,
  tournamentName = 'Tournament'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<PartnershipMetricKey>('highest_runs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedWicket, setSelectedWicket] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [compactMetricView, setCompactMetricView] = useState(false);

  // Teams list for filter
  const teams = useMemo(() => {
    const set = new Set<string>();
    partnerships.forEach(p => set.add(p.teamName));
    return Array.from(set).sort();
  }, [partnerships]);

  // Wicket label helper
  const getWicketLabel = (wicket: number) => {
    if (wicket === 1) return '1st Wkt (Opening)';
    if (wicket === 2) return '2nd Wkt';
    if (wicket === 3) return '3rd Wkt';
    return `${wicket}th Wkt`;
  };

  // Best stand per wicket (1st through 8th)
  const wicketRecords = useMemo(() => {
    const records: { [wkt: number]: PartnershipRecord } = {};
    partnerships.forEach(p => {
      if (!records[p.wicket] || p.runs > records[p.wicket].runs) {
        records[p.wicket] = p;
      }
    });
    return records;
  }, [partnerships]);

  // Sorted and filtered list
  const filteredAndSortedList = useMemo(() => {
    let list = [...partnerships];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.batter1.toLowerCase().includes(q) ||
        p.batter2.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        p.opponentName.toLowerCase().includes(q)
      );
    }

    // Team filter
    if (selectedTeam !== 'ALL') {
      list = list.filter(p => p.teamName === selectedTeam);
    }

    // Wicket filter
    if (selectedWicket !== 'ALL') {
      const wkt = parseInt(selectedWicket);
      list = list.filter(p => p.wicket === wkt);
    }

    // Category sorting / filtering
    switch (selectedMetric) {
      case 'highest_runs':
        list.sort((a, b) => b.runs - a.runs || b.runRate - a.runRate);
        break;
      case 'fastest_rr':
        list = list.filter(p => p.runs >= 25);
        list.sort((a, b) => b.runRate - a.runRate || b.runs - a.runs);
        break;
      case 'century_stands':
        list = list.filter(p => p.runs >= 100);
        list.sort((a, b) => b.runs - a.runs);
        break;
      case 'fifty_stands':
        list = list.filter(p => p.runs >= 50 && p.runs < 100);
        list.sort((a, b) => b.runs - a.runs);
        break;
      case 'wicket_records':
        // Filter to only the highest for each wicket
        const wktMap = new Map<number, PartnershipRecord>();
        list.forEach(p => {
          const current = wktMap.get(p.wicket);
          if (!current || p.runs > current.runs) {
            wktMap.set(p.wicket, p);
          }
        });
        list = Array.from(wktMap.values()).sort((a, b) => a.wicket - b.wicket);
        break;
      case 'unbroken_stands':
        list = list.filter(p => p.isNotOut);
        list.sort((a, b) => b.runs - a.runs);
        break;
      case 'boundary_blitz':
        list.sort((a, b) => {
          const boundaryRunsA = (a.fours * 4) + (a.sixes * 6);
          const boundaryRunsB = (b.fours * 4) + (b.sixes * 6);
          return boundaryRunsB - boundaryRunsA;
        });
        break;
      case 'death_overs':
        list = list.filter(p => p.wicket >= 4);
        list.sort((a, b) => b.runRate - a.runRate || b.runs - a.runs);
        break;
      default:
        list.sort((a, b) => b.runs - a.runs);
    }

    if (sortOrder === 'asc') {
      list.reverse();
    }

    return list;
  }, [partnerships, searchQuery, selectedTeam, selectedWicket, selectedMetric, sortOrder]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return filteredAndSortedList.slice(0, 3);
  }, [filteredAndSortedList]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedList.length === 0) return;
    const headers = [
      'Rank', 'Batter 1', 'Batter 1 Runs', 'Batter 1 Balls',
      'Batter 2', 'Batter 2 Runs', 'Batter 2 Balls',
      'Partnership Runs', 'Balls', 'Wicket', 'Team', 'Opponent',
      'Fours', 'Sixes', 'Run Rate', 'Unbroken'
    ];
    const rows = filteredAndSortedList.map((p, idx) => [
      idx + 1,
      `"${p.batter1}"`,
      p.batter1Runs,
      p.batter1Balls,
      `"${p.batter2}"`,
      p.batter2Runs,
      p.batter2Balls,
      p.runs,
      p.balls,
      p.wicket,
      `"${p.teamName}"`,
      `"${p.opponentName}"`,
      p.fours,
      p.sixes,
      p.runRate,
      p.isNotOut ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tournamentName.replace(/\s+/g, '_')}_Partnership_Stats_${selectedMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH TOURNAMENT BRANDING */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 dark:from-amber-900/80 dark:via-orange-950/80 dark:to-amber-950/80 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-sm">
                🤝 CricHeroes Partnership Analytics
              </span>
              <span className="px-3 py-1 bg-amber-400/30 text-amber-100 rounded-full text-[10px] font-extrabold uppercase">
                {partnerships.length} Recorded Stands
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight flex items-center gap-2">
              Tournament Partnership Leaderboards
            </h2>
            <p className="text-xs text-amber-100/90 font-medium mt-1 max-w-xl">
              Track highest batting stands, century partnerships, explosive death-overs scoring rates, and record stands for every wicket in {tournamentName}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setCompactMetricView(!compactMetricView)}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-sm border border-white/20"
            >
              <BarChart2 size={14} />
              {compactMetricView ? 'Expand Metrics' : 'Compact Grid'}
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-white text-orange-900 hover:bg-amber-50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* METRIC SELECTION BENTO CARDS */}
      {!compactMetricView ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {METRICS.map(m => {
            const isSelected = selectedMetric === m.key;
            // Preview value for this metric
            let preview = '';
            if (m.key === 'highest_runs' && partnerships.length > 0) {
              const top = [...partnerships].sort((a,b) => b.runs - a.runs)[0];
              preview = top ? `${top.runs} (${top.balls}b)` : '-';
            } else if (m.key === 'fastest_rr' && partnerships.length > 0) {
              const eligible = partnerships.filter(p => p.runs >= 25);
              const top = eligible.sort((a,b) => b.runRate - a.runRate)[0];
              preview = top ? `${top.runRate} RR` : '-';
            } else if (m.key === 'century_stands') {
              const count = partnerships.filter(p => p.runs >= 100).length;
              preview = `${count} Stands`;
            } else if (m.key === 'fifty_stands') {
              const count = partnerships.filter(p => p.runs >= 50 && p.runs < 100).length;
              preview = `${count} Stands`;
            } else if (m.key === 'wicket_records') {
              preview = '1st-8th Wkts';
            } else if (m.key === 'unbroken_stands') {
              const count = partnerships.filter(p => p.isNotOut).length;
              preview = `${count} Not Out`;
            } else if (m.key === 'boundary_blitz' && partnerships.length > 0) {
              const top = [...partnerships].sort((a,b) => ((b.fours * 4) + (b.sixes * 6)) - ((a.fours * 4) + (a.sixes * 6)))[0];
              preview = top ? `${(top.fours * 4) + (top.sixes * 6)} b-runs` : '-';
            } else if (m.key === 'death_overs') {
              preview = 'Wickets 4+';
            }

            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative overflow-hidden flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 text-slate-800 dark:text-slate-100 shadow-sm'
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
                  <p className={`text-[10px] font-extrabold mt-0.5 ${isSelected ? 'text-amber-100' : 'text-amber-600 dark:text-amber-400'}`}>
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
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
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

      {/* SPECIAL WICKET-BY-WICKET BEST STANDS BANNER (When wicket_records selected or as quick highlight) */}
      {selectedMetric === 'wicket_records' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-amber-500" />
                Tournament Record Partnership for Each Wicket
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">The highest batting partnerships recorded from opening stand to the tail</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(wkt => {
              const rec = wicketRecords[wkt];
              if (!rec) return null;
              return (
                <div key={wkt} className="p-3.5 bg-slate-50 dark:bg-slate-850/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {getWicketLabel(wkt)}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {rec.runs} runs <span className="text-[10px] text-slate-400 font-semibold">({rec.balls}b)</span>
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">
                    {rec.batter1} & {rec.batter2}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-200/50 dark:border-slate-800/60">
                    <span className="text-slate-400">{rec.teamName}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{rec.runRate} RR</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM FOR SELECTED METRIC */}
      {topThree.length > 0 && selectedMetric !== 'wicket_records' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {topThree.map((p, idx) => {
            const isFirst = idx === 0;
            const rankBadge = isFirst ? '🥇 Gold' : idx === 1 ? '🥈 Silver' : '🥉 Bronze';
            const medalColor = isFirst 
              ? 'border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent' 
              : idx === 1 
              ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-850/40' 
              : 'border-orange-300 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/20';

            return (
              <div
                key={p.id}
                className={`p-4 rounded-3xl border ${medalColor} relative overflow-hidden space-y-3 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {rankBadge}
                  </span>
                  <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {getWicketLabel(p.wicket)}
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                      {p.runs}
                    </span>
                    <span className="text-xs font-extrabold text-slate-400">
                      runs off {p.balls}b
                    </span>
                    {p.isNotOut && (
                      <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        *Not Out
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    Run Rate: {p.runRate} • {p.fours}×4s, {p.sixes}×6s
                  </p>
                </div>

                {/* Batters Split Card */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-2.5 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <button
                      onClick={() => onOpenPlayerCard && onOpenPlayerCard({ playerName: p.batter1, teamName: p.teamName })}
                      className="font-extrabold text-slate-800 dark:text-white hover:text-amber-500 text-left line-clamp-1 cursor-pointer transition-colors"
                    >
                      {p.batter1}
                    </button>
                    <span className="font-black text-slate-700 dark:text-slate-300 shrink-0">
                      {p.batter1Runs} <span className="text-[10px] text-slate-400 font-medium">({p.batter1Balls})</span>
                    </span>
                  </div>
                  {/* Contribution bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-amber-500 h-full" 
                      style={{ width: `${p.runs > 0 ? (p.batter1Runs / p.runs) * 100 : 50}%` }}
                    />
                    <div 
                      className="bg-orange-500 h-full" 
                      style={{ width: `${p.runs > 0 ? (p.batter2Runs / p.runs) * 100 : 50}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <button
                      onClick={() => onOpenPlayerCard && onOpenPlayerCard({ playerName: p.batter2, teamName: p.teamName })}
                      className="font-extrabold text-slate-800 dark:text-white hover:text-orange-500 text-left line-clamp-1 cursor-pointer transition-colors"
                    >
                      {p.batter2}
                    </button>
                    <span className="font-black text-slate-700 dark:text-slate-300 shrink-0">
                      {p.batter2Runs} <span className="text-[10px] text-slate-400 font-medium">({p.batter2Balls})</span>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-semibold flex justify-between items-center pt-1">
                  <span>{p.teamName}</span>
                  <span className="text-slate-400">vs {p.opponentName}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by batter name, team, or opponent..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Team Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <Filter size={13} className="text-slate-400" />
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Squads</option>
                {teams.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Wicket Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Wkt:</span>
              <select
                value={selectedWicket}
                onChange={(e) => setSelectedWicket(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="ALL">All Wickets</option>
                <option value="1">1st Wicket</option>
                <option value="2">2nd Wicket</option>
                <option value="3">3rd Wicket</option>
                <option value="4">4th Wicket</option>
                <option value="5">5th Wicket</option>
                <option value="6">6th Wicket</option>
                <option value="7">7th Wicket</option>
                <option value="8">8th+ Wicket</option>
              </select>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <ArrowUpDown size={13} />
              {sortOrder === 'desc' ? 'High to Low' : 'Low to High'}
            </button>
          </div>
        </div>

        {/* PARTNERSHIP LEADERBOARD TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3 text-center w-12">Rank</th>
                <th className="py-3 px-3">Batting Pair</th>
                <th className="py-3 px-3 text-center">Wicket</th>
                <th className="py-3 px-3 text-center">Stand Runs</th>
                <th className="py-3 px-3 text-center">Balls</th>
                <th className="py-3 px-3 text-center">Run Rate</th>
                <th className="py-3 px-3 text-center">4s / 6s</th>
                <th className="py-3 px-3 text-left">Squad & Match</th>
                <th className="py-3 px-3 text-right">Player Cards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {filteredAndSortedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No partnerships found matching the active criteria.
                  </td>
                </tr>
              ) : (
                filteredAndSortedList.map((p, idx) => {
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-amber-500/5 transition-colors group"
                    >
                      <td className="py-3 px-3 text-center font-black text-slate-400">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenPlayerCard && onOpenPlayerCard({ playerName: p.batter1, teamName: p.teamName })}
                              className="font-extrabold text-slate-900 dark:text-white hover:text-amber-500 transition-colors cursor-pointer text-xs"
                            >
                              {p.batter1}
                            </button>
                            <span className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                              {p.batter1Runs}* <span className="text-[9px] text-slate-400 font-semibold">({p.batter1Balls})</span>
                            </span>
                            <span className="text-slate-300 dark:text-slate-700 font-normal">&</span>
                            <button
                              onClick={() => onOpenPlayerCard && onOpenPlayerCard({ playerName: p.batter2, teamName: p.teamName })}
                              className="font-extrabold text-slate-900 dark:text-white hover:text-amber-500 transition-colors cursor-pointer text-xs"
                            >
                              {p.batter2}
                            </button>
                            <span className="text-[11px] font-black text-orange-600 dark:text-orange-400">
                              {p.batter2Runs} <span className="text-[9px] text-slate-400 font-semibold">({p.batter2Balls})</span>
                            </span>
                          </div>
                          {p.isNotOut && (
                            <span className="inline-block text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              Unbroken Stand
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {p.wicket}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-black text-sm text-slate-900 dark:text-white">
                        {p.runs}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500">
                        {p.balls}
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-amber-600 dark:text-amber-400">
                        {p.runRate}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">
                        {p.fours} / {p.sixes}
                      </td>
                      <td className="py-3 px-3 text-left">
                        <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                          {p.teamName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          vs {p.opponentName}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPlayerCard && onOpenPlayerCard({ playerName: p.batter1, teamName: p.teamName })}
                            title={`View ${p.batter1} Profile`}
                            className="p-1.5 bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-900/30 text-slate-600 dark:text-slate-300 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <User size={12} />
                          </button>
                          <button
                            onClick={() => onOpenPlayerCard && onOpenPlayerCard({ playerName: p.batter2, teamName: p.teamName })}
                            title={`View ${p.batter2} Profile`}
                            className="p-1.5 bg-slate-100 hover:bg-orange-100 dark:bg-slate-800 dark:hover:bg-orange-900/30 text-slate-600 dark:text-slate-300 hover:text-orange-600 rounded-lg transition-colors cursor-pointer"
                          >
                            <User size={12} />
                          </button>
                        </div>
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
