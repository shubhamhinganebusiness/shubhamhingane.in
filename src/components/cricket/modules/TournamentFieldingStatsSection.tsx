import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Award, Zap, Target, Trophy, TrendingUp, Sparkles, 
  Search, Download, Filter, Crown, Medal, ArrowUpRight, Flame,
  AlertCircle, ChevronDown, ChevronUp, UserCheck, Crosshair,
  Hand, Eye
} from 'lucide-react';

export type FieldingMetricKey = 
  | 'most_dismissals'
  | 'most_catches'
  | 'most_inning_catches'
  | 'most_run_outs'
  | 'most_inning_run_outs'
  | 'most_stumpings'
  | 'best_dismissal_ratio'
  | 'most_direct_hits'
  | 'wk_dismissals'
  | 'outfield_catches'
  | 'most_inning_dismissals'
  | 'fielding_mvp_score';

export interface EnhancedFieldingStats {
  playerName: string;
  teamName: string;
  matches: number;
  totalDismissals: number;
  catches: number;
  mostInningCatches: number;
  mostInningCatchesDetails: string; // e.g. "3 catches vs Warriors"
  runOuts: number;
  mostInningRunOuts: number;
  mostInningRunOutsDetails: string; // e.g. "2 run-outs vs Titans"
  stumpings: number;
  directHits: number;
  wkDismissals: number;
  outfieldCatches: number;
  dismissalsPerMatch: number;
  mostInningDismissals: number;
  mostInningDismissalsDetails: string; // e.g. "4 dismissals (3 ct, 1 ro)"
  fieldingMvpScore: number;
  isWicketKeeper: boolean;
  rawPlayerStats?: any;
}

export interface FieldingMetricConfig {
  key: FieldingMetricKey;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  iconName: string;
  color: string;
  getValue: (p: EnhancedFieldingStats) => number;
  formatValue: (p: EnhancedFieldingStats) => string;
  subValueFormat: (p: EnhancedFieldingStats) => string;
  ascending?: boolean;
}

export const FIELDING_METRIC_CONFIGS: FieldingMetricConfig[] = [
  {
    key: 'most_dismissals',
    label: 'Most Total Dismissals (Golden Glove)',
    shortLabel: 'Total Dismissals',
    badge: '🧤 Golden Glove',
    description: 'Combined total of catches, stumpings, and run-outs executed',
    iconName: 'Shield',
    color: 'from-emerald-600 to-teal-600 text-emerald-500',
    getValue: (p) => p.totalDismissals,
    formatValue: (p) => `${p.totalDismissals} Dismissals`,
    subValueFormat: (p) => `${p.catches} ct • ${p.stumpings} st • ${p.runOuts} ro`
  },
  {
    key: 'most_catches',
    label: 'Most Tournament Catches',
    shortLabel: 'Most Catches',
    badge: '🦅 Safe Hands',
    description: 'Total legal aerial dismissals taken across the tournament',
    iconName: 'Hand',
    color: 'from-blue-600 to-indigo-600 text-blue-500',
    getValue: (p) => p.catches,
    formatValue: (p) => `${p.catches} Catches`,
    subValueFormat: (p) => `In ${p.matches} matches played (Max: ${p.mostInningCatches}/inn)`
  },
  {
    key: 'most_inning_catches',
    label: 'Most Catches in an Inning',
    shortLabel: 'Inning Catches',
    badge: '⚡ Magnet Hands',
    description: 'Highest number of catches held in a single match innings',
    iconName: 'Zap',
    color: 'from-amber-600 to-yellow-500 text-amber-500',
    getValue: (p) => p.mostInningCatches,
    formatValue: (p) => `${p.mostInningCatches} Catches`,
    subValueFormat: (p) => p.mostInningCatchesDetails
  },
  {
    key: 'most_run_outs',
    label: 'Most Run-Outs Executed',
    shortLabel: 'Most Run-Outs',
    badge: '🎯 Laser Arm',
    description: 'Total run-out dismissals (direct hits & relay throws)',
    iconName: 'Target',
    color: 'from-rose-600 to-red-600 text-rose-500',
    getValue: (p) => p.runOuts,
    formatValue: (p) => `${p.runOuts} Run-Outs`,
    subValueFormat: (p) => `${p.directHits} direct-hit bullseyes`
  },
  {
    key: 'most_inning_run_outs',
    label: 'Most Run-Outs in an Inning',
    shortLabel: 'Inning Run-Outs',
    badge: '🔥 Sniper Reflex',
    description: 'Most run-out dismissals initiated in a single match innings',
    iconName: 'Crosshair',
    color: 'from-orange-600 to-amber-600 text-orange-500',
    getValue: (p) => p.mostInningRunOuts,
    formatValue: (p) => `${p.mostInningRunOuts} Run-Outs`,
    subValueFormat: (p) => p.mostInningRunOutsDetails
  },
  {
    key: 'most_stumpings',
    label: 'Most Wicketkeeper Stumpings',
    shortLabel: 'Most Stumpings',
    badge: '⚡ Flash Stumps',
    description: 'Bails dislodged by wicketkeepers before batter regains crease',
    iconName: 'Sparkles',
    color: 'from-purple-600 to-indigo-600 text-purple-500',
    getValue: (p) => p.stumpings,
    formatValue: (p) => `${p.stumpings} Stumpings`,
    subValueFormat: (p) => `${p.wkDismissals} total keeper dismissals`
  },
  {
    key: 'best_dismissal_ratio',
    label: 'Best Dismissal Ratio (Per Match)',
    shortLabel: 'Dismissal Ratio',
    badge: '📈 Impact Fielder',
    description: 'Average dismissals contributed per match played (Min 2 matches)',
    iconName: 'TrendingUp',
    color: 'from-teal-600 to-emerald-600 text-teal-500',
    getValue: (p) => (p.matches >= 2 ? p.dismissalsPerMatch : 0),
    formatValue: (p) => `${p.dismissalsPerMatch} / match`,
    subValueFormat: (p) => `${p.totalDismissals} dismissals in ${p.matches} matches`
  },
  {
    key: 'most_direct_hits',
    label: 'Most Direct Hit Run-Outs',
    shortLabel: 'Direct Hits',
    badge: '🏹 Bullseye',
    description: 'Unassisted direct stumps strikes resulting in a wicket',
    iconName: 'Crosshair',
    color: 'from-red-600 to-rose-600 text-red-500',
    getValue: (p) => p.directHits,
    formatValue: (p) => `${p.directHits} Direct Hits`,
    subValueFormat: (p) => `From ${p.runOuts} total run-out involvements`
  },
  {
    key: 'wk_dismissals',
    label: 'Most Wicketkeeper Dismissals',
    shortLabel: 'Keeper Dismissals',
    badge: '🧤 Behind the Stumps',
    description: 'Combined catches taken behind the wickets plus stumpings',
    iconName: 'Medal',
    color: 'from-violet-600 to-purple-600 text-violet-500',
    getValue: (p) => p.wkDismissals,
    formatValue: (p) => `${p.wkDismissals} Dismissals`,
    subValueFormat: (p) => `${p.catches - p.outfieldCatches} keeper catches • ${p.stumpings} stumpings`
  },
  {
    key: 'outfield_catches',
    label: 'Most Outfield Catches',
    shortLabel: 'Outfield Catches',
    badge: '🪂 Boundary Patrol',
    description: 'Catches taken by fielders in the inner ring and boundary rope',
    iconName: 'Eye',
    color: 'from-cyan-600 to-blue-600 text-cyan-500',
    getValue: (p) => p.outfieldCatches,
    formatValue: (p) => `${p.outfieldCatches} Catches`,
    subValueFormat: (p) => `In ${p.matches} tournament matches`
  },
  {
    key: 'most_inning_dismissals',
    label: 'Most Dismissals in an Inning',
    shortLabel: 'Inning Dismissals',
    badge: '🏆 Golden Match',
    description: 'Peak all-round fielding contributions in a single match innings',
    iconName: 'Trophy',
    color: 'from-amber-500 to-yellow-600 text-amber-500',
    getValue: (p) => p.mostInningDismissals,
    formatValue: (p) => `${p.mostInningDismissals} Dismissals`,
    subValueFormat: (p) => p.mostInningDismissalsDetails
  },
  {
    key: 'fielding_mvp_score',
    label: 'Fielding MVP Impact Score',
    shortLabel: 'Fielding MVP',
    badge: '⭐ Elite Fielder',
    description: 'Weighted rating (Catches: 10pts, Stumpings: 12pts, Direct Hits: 15pts)',
    iconName: 'Crown',
    color: 'from-amber-600 to-orange-600 text-amber-500',
    getValue: (p) => p.fieldingMvpScore,
    formatValue: (p) => `${p.fieldingMvpScore} Pts`,
    subValueFormat: (p) => `${p.totalDismissals} total dismissals registered`
  }
];

interface TournamentFieldingStatsSectionProps {
  stats: EnhancedFieldingStats[];
  onOpenPlayerCard?: (player: any) => void;
  tournamentName?: string;
}

export const TournamentFieldingStatsSection: React.FC<TournamentFieldingStatsSectionProps> = ({
  stats,
  onOpenPlayerCard,
  tournamentName = 'Tournament'
}) => {
  const [activeMetric, setActiveMetric] = useState<FieldingMetricKey>('most_dismissals');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'keepers' | 'fielders'>('all');
  const [viewMode, setViewMode] = useState<'bento' | 'compact'>('bento');

  // Extract unique teams
  const teamList = useMemo(() => {
    const set = new Set<string>();
    stats.forEach(s => {
      if (s.teamName) set.add(s.teamName);
    });
    return Array.from(set).sort();
  }, [stats]);

  const activeConfig = useMemo(() => {
    return FIELDING_METRIC_CONFIGS.find(c => c.key === activeMetric) || FIELDING_METRIC_CONFIGS[0];
  }, [activeMetric]);

  // Filter and sort fielders
  const filteredAndSortedStats = useMemo(() => {
    let result = [...stats];

    // Filter by team
    if (selectedTeam !== 'all') {
      result = result.filter(p => p.teamName === selectedTeam);
    }

    // Filter by role
    if (roleFilter === 'keepers') {
      result = result.filter(p => p.isWicketKeeper || p.stumpings > 0);
    } else if (roleFilter === 'fielders') {
      result = result.filter(p => !p.isWicketKeeper && p.stumpings === 0);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.playerName.toLowerCase().includes(q) || 
        p.teamName.toLowerCase().includes(q)
      );
    }

    // Sort according to metric
    result.sort((a, b) => {
      const valA = activeConfig.getValue(a);
      const valB = activeConfig.getValue(b);
      return valB - valA;
    });

    return result;
  }, [stats, selectedTeam, roleFilter, searchQuery, activeConfig]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return filteredAndSortedStats.slice(0, 3);
  }, [filteredAndSortedStats]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedStats.length === 0) return;
    const headers = [
      'Rank', 'Player Name', 'Team', 'Matches', 'Total Dismissals', 
      'Catches', 'Inning Catches (Max)', 'Run-Outs', 'Inning Run-Outs (Max)', 
      'Stumpings', 'Direct Hits', 'Dismissals/Match', 'Active Metric', 'Active Metric Value'
    ];
    
    const rows = filteredAndSortedStats.map((p, idx) => [
      idx + 1,
      `"${p.playerName}"`,
      `"${p.teamName}"`,
      p.matches,
      p.totalDismissals,
      p.catches,
      p.mostInningCatches,
      p.runOuts,
      p.mostInningRunOuts,
      p.stumpings,
      p.directHits,
      p.dismissalsPerMatch,
      `"${activeConfig.label}"`,
      `"${activeConfig.formatValue(p)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tournamentName.replace(/\s+/g, '_')}_Fielding_Stats_${activeMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render icons dynamically
  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Shield': return <Shield className={className} />;
      case 'Hand': return <Hand className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Crosshair': return <Crosshair className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'Medal': return <Medal className={className} />;
      case 'Eye': return <Eye className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Crown': return <Crown className={className} />;
      default: return <Award className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2.5rem] p-6 lg:p-8 space-y-6 transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Shield size={14} className="text-emerald-500" />
                CricHeroes Standard Fielding Analytics
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stats.length} Active Fielders
              </span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              🧤 Fielding Leaderboards & Dismissals
            </h3>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
              Defensive fielding mastery: Golden Glove leaders, direct-hit run-outs, single-match catches, wicketkeeper stumpings, and fielding MVP ratings.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
              title="Download Fielding Leaderboard CSV"
            >
              <Download size={15} />
              Export CSV
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'bento' ? 'compact' : 'bento')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-all border border-emerald-200/50 dark:border-emerald-800/40"
            >
              {viewMode === 'bento' ? 'Collapse Bento' : 'Expand 12 Metrics'}
            </button>
          </div>
        </div>

        {/* 12-METRIC BENTO GRID SELECTOR */}
        <AnimatePresence>
          {viewMode === 'bento' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Select from 12 CricHeroes Fielding Metrics</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">
                  Current: {activeConfig.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {FIELDING_METRIC_CONFIGS.map((cfg) => {
                  const isSelected = activeMetric === cfg.key;
                  // Compute leader for this metric
                  const leader = [...stats].sort((a, b) => {
                    const vA = cfg.getValue(a);
                    const vB = cfg.getValue(b);
                    return cfg.ascending ? vA - vB : vB - vA;
                  })[0];

                  return (
                    <button
                      key={cfg.key}
                      onClick={() => setActiveMetric(cfg.key)}
                      className={`relative text-left p-3.5 rounded-2xl border transition-all text-xs flex flex-col justify-between group overflow-hidden ${
                        isSelected 
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-500/60 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20' 
                          : 'bg-slate-50/80 hover:bg-slate-100/90 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                          isSelected 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {cfg.shortLabel}
                        </span>
                        <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'}`}>
                          {renderIcon(cfg.iconName, 'w-3.5 h-3.5')}
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-[13px] font-black text-slate-900 dark:text-white truncate">
                          {leader ? cfg.formatValue(leader) : '-'}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                          {leader ? leader.playerName : 'No records'}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMPACT CHIPS CAROUSEL (When Bento is collapsed) */}
        {viewMode === 'compact' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FIELDING_METRIC_CONFIGS.map((cfg) => {
              const isSelected = activeMetric === cfg.key;
              return (
                <button
                  key={cfg.key}
                  onClick={() => setActiveMetric(cfg.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap tracking-wider transition-all flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]' 
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {renderIcon(cfg.iconName, 'w-3 h-3')}
                  {cfg.shortLabel}
                </button>
              );
            })}
          </div>
        )}

        {/* ACTIVE METRIC BANNER & DESCRIPTION */}
        <div className="bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 rounded-2xl p-4 border border-emerald-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              {renderIcon(activeConfig.iconName, 'w-6 h-6')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {activeConfig.badge}
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  {activeConfig.label}
                </h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {activeConfig.description}
              </p>
            </div>
          </div>

          {/* Quick Role Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-stretch md:self-auto justify-center">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Fielders
            </button>
            <button
              onClick={() => setRoleFilter('keepers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === 'keepers' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Wicketkeepers
            </button>
            <button
              onClick={() => setRoleFilter('fielders')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                roleFilter === 'fielders' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Outfielders
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM DISPLAY */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* SILVER - 2nd PLACE */}
          {topThree[1] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => onOpenPlayerCard && onOpenPlayerCard(topThree[1].rawPlayerStats || topThree[1])}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className="flex justify-between items-start">
                <span className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-sm flex items-center justify-center border border-slate-300 dark:border-slate-700">
                  2
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  Silver Medal
                </span>
              </div>

              <div className="my-4 text-center space-y-1">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-lg border-2 border-slate-300 dark:border-slate-700 group-hover:scale-105 transition-transform">
                  {topThree[1].playerName.charAt(0)}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {topThree[1].playerName}
                </h4>
                <p className="text-xs font-bold text-slate-400">
                  {topThree[1].teamName}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                <div className="text-xl font-black text-slate-800 dark:text-slate-100">
                  {activeConfig.formatValue(topThree[1])}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                  {activeConfig.subValueFormat(topThree[1])}
                </div>
              </div>
            </motion.div>
          )}

          {/* GOLD - 1st PLACE */}
          {topThree[0] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => onOpenPlayerCard && onOpenPlayerCard(topThree[0].rawPlayerStats || topThree[0])}
              className="bg-gradient-to-b from-emerald-500/10 via-white to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/50 rounded-[2.2rem] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-emerald-500 transition-all group md:-translate-y-2 ring-4 ring-emerald-500/10"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                <Crown size={12} className="text-amber-300" />
                Tournament Leader
              </div>

              <div className="flex justify-between items-start">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                  1
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-900/40 px-2.5 py-0.5 rounded-lg border border-emerald-200/50">
                  {activeConfig.badge}
                </span>
              </div>

              <div className="my-4 text-center space-y-1">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                    {topThree[0].playerName.charAt(0)}
                  </div>
                  <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-md">
                    <Crown size={12} />
                  </div>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {topThree[0].playerName}
                </h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {topThree[0].teamName}
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3.5 text-center border border-emerald-100 dark:border-emerald-900/50">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                  {activeConfig.formatValue(topThree[0])}
                </div>
                <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400 font-semibold truncate mt-0.5">
                  {activeConfig.subValueFormat(topThree[0])}
                </div>
              </div>
            </motion.div>
          )}

          {/* BRONZE - 3rd PLACE */}
          {topThree[2] && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => onOpenPlayerCard && onOpenPlayerCard(topThree[2].rawPlayerStats || topThree[2])}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-5 shadow-lg relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className="flex justify-between items-start">
                <span className="w-8 h-8 rounded-xl bg-amber-700/20 text-amber-800 dark:text-amber-400 font-black text-sm flex items-center justify-center border border-amber-700/30">
                  3
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                  Bronze Medal
                </span>
              </div>

              <div className="my-4 text-center space-y-1">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-700 dark:text-slate-200 text-lg border-2 border-slate-300 dark:border-slate-700 group-hover:scale-105 transition-transform">
                  {topThree[2].playerName.charAt(0)}
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {topThree[2].playerName}
                </h4>
                <p className="text-xs font-bold text-slate-400">
                  {topThree[2].teamName}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-800">
                <div className="text-xl font-black text-slate-800 dark:text-slate-100">
                  {activeConfig.formatValue(topThree[2])}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                  {activeConfig.subValueFormat(topThree[2])}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2.5rem] p-6 lg:p-8 space-y-5">
        {/* FILTERS & SEARCH ROW */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fielder or team..."
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">All Squads ({stats.length})</option>
                {teamList.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedStats.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="mx-auto text-slate-400" size={28} />
            <p className="text-sm font-bold">No fielders found matching this criteria.</p>
            <p className="text-xs">Try resetting your search query or squad filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px] uppercase font-extrabold tracking-wide">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-black">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Player / Squad</th>
                  <th className="py-3 px-3 text-center bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-t-xl">
                    {activeConfig.shortLabel}
                  </th>
                  <th className="py-3 px-3 text-center">Matches</th>
                  <th className="py-3 px-3 text-center">Total Dismissals</th>
                  <th className="py-3 px-3 text-center">Catches</th>
                  <th className="py-3 px-3 text-center">Inning Catches</th>
                  <th className="py-3 px-3 text-center">Run-Outs</th>
                  <th className="py-3 px-3 text-center">Inning Run-Outs</th>
                  <th className="py-3 px-3 text-center">Stumpings</th>
                  <th className="py-3 px-3 text-center">Direct Hits</th>
                  <th className="py-3 px-3 text-center">Ratio</th>
                  <th className="py-3 px-3 text-right">Match Performance</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStats.map((player, idx) => {
                  return (
                    <tr
                      key={`${player.teamName}-${player.playerName}-${idx}`}
                      onClick={() => onOpenPlayerCard && onOpenPlayerCard(player.rawPlayerStats || player)}
                      className={`border-b border-slate-50 dark:border-slate-800/80 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors group ${
                        idx === 0 ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                      }`}
                      title="Click to view Career Card & Match Logs"
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-3 text-center">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-black text-xs">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-300 font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">{idx + 1}</span>
                        )}
                      </td>

                      {/* Player & Squad */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col justify-center">
                          <span className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                            {player.playerName}
                            {player.isWicketKeeper && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-1.5 py-0.2 rounded font-black">
                                WK
                              </span>
                            )}
                            {idx === 0 && <Crown size={12} className="text-amber-500 shrink-0" />}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-bold">
                            {player.teamName}
                          </span>
                        </div>
                      </td>

                      {/* Active Highlight Metric */}
                      <td className="py-3.5 px-3 text-center bg-emerald-500/5 dark:bg-emerald-500/10 font-black text-emerald-700 dark:text-emerald-300 text-sm">
                        {activeConfig.formatValue(player)}
                      </td>

                      {/* Matches */}
                      <td className="py-3.5 px-3 text-center text-slate-500 font-bold">
                        {player.matches}
                      </td>

                      {/* Total Dismissals */}
                      <td className="py-3.5 px-3 text-center font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {player.totalDismissals}
                      </td>

                      {/* Catches */}
                      <td className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-200 font-bold">
                        {player.catches}
                      </td>

                      {/* Inning Catches (Max) */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        {player.mostInningCatches}
                      </td>

                      {/* Run-Outs */}
                      <td className="py-3.5 px-3 text-center text-rose-600 dark:text-rose-400 font-bold">
                        {player.runOuts}
                      </td>

                      {/* Inning Run-Outs (Max) */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-orange-600 dark:text-orange-400">
                        {player.mostInningRunOuts}
                      </td>

                      {/* Stumpings */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {player.stumpings}
                      </td>

                      {/* Direct Hits */}
                      <td className="py-3.5 px-3 text-center font-mono text-teal-600 dark:text-teal-400 font-bold">
                        {player.directHits}
                      </td>

                      {/* Ratio */}
                      <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                        {player.dismissalsPerMatch}
                      </td>

                      {/* Match Highlight Details */}
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
