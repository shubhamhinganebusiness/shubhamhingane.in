import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Shield, Zap, Target, Award, TrendingUp, Clock, Sparkles, 
  Search, Download, Filter, Crown, Medal, ArrowUpRight, Flame,
  AlertCircle, ChevronDown, ChevronUp, CircleDot, Activity, UserCheck
} from 'lucide-react';

export type BowlingMetricKey = 
  | 'most_wickets'
  | 'best_bowling_figures'
  | 'best_economy'
  | 'best_inning_economy'
  | 'most_maidens'
  | 'most_three_wicket_hauls'
  | 'most_inning_dot_balls'
  | 'tournament_dot_balls'
  | 'best_bowling_average'
  | 'best_bowling_strike_rate'
  | 'highest_dot_percentage'
  | 'most_four_plus_hauls'
  | 'most_overs_bowled'
  | 'best_death_economy'
  | 'maidens_in_inning';

export interface EnhancedBowlingStats {
  playerName: string;
  teamName: string;
  overs: number;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  bowlingAverage: number;
  bowlingStrikeRate: number;
  bestBowling: string; // e.g. "4/14"
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  bestBowlingDetails: string; // e.g. "4/14 in 3.2 ov vs Lions"
  bestInningEconomy: number;
  bestInningEconomyDetails: string; // e.g. "2.25 RPO (1/9 in 4.0 ov)"
  threeWicketHauls: number;
  fourWicketHauls: number;
  fiveWicketHauls: number;
  mostInningDotBalls: number;
  mostInningDotBallsDetails: string; // e.g. "17 dots in 4.0 ov"
  totalDotBalls: number;
  dotPercentage: number;
  deathOversBowled: number;
  deathRunsConceded: number;
  deathEconomy: number;
  maidensInInning: number;
  maidensInInningDetails: string;
  rawPlayerStats?: any;
}

export interface BowlingMetricConfig {
  key: BowlingMetricKey;
  label: string;
  shortLabel: string;
  badge: string;
  description: string;
  iconName: string;
  color: string;
  getValue: (p: EnhancedBowlingStats) => number;
  formatValue: (p: EnhancedBowlingStats) => string;
  subValueFormat: (p: EnhancedBowlingStats) => string;
  ascending?: boolean; // When lower number is better (e.g. economy, average, strike rate)
  secondarySort?: (a: EnhancedBowlingStats, b: EnhancedBowlingStats) => number;
}

export const BOWLING_METRIC_CONFIGS: BowlingMetricConfig[] = [
  {
    key: 'most_wickets',
    label: 'Tournament Most Wickets (Purple Cap)',
    shortLabel: 'Most Wickets',
    badge: '👑 Purple Cap',
    description: 'Total tournament dismissals credited to the bowler',
    iconName: 'Crown',
    color: 'from-purple-600 to-indigo-600 text-purple-500',
    getValue: (p) => p.wickets,
    formatValue: (p) => `${p.wickets} Wkts`,
    subValueFormat: (p) => `${p.overs} ov • Econ ${p.economy} • BBI ${p.bestBowling}`
  },
  {
    key: 'best_bowling_figures',
    label: 'Best Bowling Figures in an Inning (BBI)',
    shortLabel: 'Best Bowling Figures',
    badge: '🎯 Master Spell',
    description: 'Highest single-match bowling figures ranked by wickets taken then fewest runs conceded',
    iconName: 'Target',
    color: 'from-pink-600 to-rose-600 text-pink-500',
    // Score value prioritizing wickets (1000 * wkts) - runsConceded
    getValue: (p) => (p.bestBowlingWickets * 1000) - p.bestBowlingRuns,
    formatValue: (p) => p.bestBowling,
    subValueFormat: (p) => p.bestBowlingDetails || `${p.bestBowlingWickets} wkts for ${p.bestBowlingRuns} runs`,
    secondarySort: (a, b) => {
      if (b.bestBowlingWickets !== a.bestBowlingWickets) {
        return b.bestBowlingWickets - a.bestBowlingWickets;
      }
      return a.bestBowlingRuns - b.bestBowlingRuns;
    }
  },
  {
    key: 'best_economy',
    label: 'Best Tournament Economy Rate',
    shortLabel: 'Best Economy',
    badge: '🛡️ Miserly Bowler',
    description: 'Fewest runs conceded per over bowled across tournament (Min 2 overs)',
    iconName: 'Shield',
    color: 'from-emerald-600 to-teal-600 text-emerald-500',
    ascending: true,
    getValue: (p) => (p.overs >= 2 ? p.economy : 999),
    formatValue: (p) => (p.overs >= 2 ? `${p.economy} RPO` : 'N/A'),
    subValueFormat: (p) => `${p.runsConceded} runs in ${p.overs} ov (${p.wickets} wkts)`
  },
  {
    key: 'best_inning_economy',
    label: 'Best Inning Economy Rate',
    shortLabel: 'Inning Economy',
    badge: '💎 Jewel Spell',
    description: 'Lowest economy rate recorded in a single match innings spell (Min 2 overs)',
    iconName: 'Sparkles',
    color: 'from-cyan-600 to-blue-600 text-cyan-500',
    ascending: true,
    getValue: (p) => (p.bestInningEconomy > 0 ? p.bestInningEconomy : 999),
    formatValue: (p) => (p.bestInningEconomy > 0 && p.bestInningEconomy < 99 ? `${p.bestInningEconomy} RPO` : 'N/A'),
    subValueFormat: (p) => p.bestInningEconomyDetails
  },
  {
    key: 'most_maidens',
    label: 'Most Maiden Overs Bowled',
    shortLabel: 'Most Maidens',
    badge: '🧱 Brick Wall',
    description: 'Total overs bowled with zero runs conceded from bat or extras',
    iconName: 'Medal',
    color: 'from-amber-600 to-yellow-500 text-amber-500',
    getValue: (p) => p.maidens,
    formatValue: (p) => `${p.maidens} Maidens`,
    subValueFormat: (p) => `Across ${p.overs} overs bowled (${p.totalDotBalls} dots)`
  },
  {
    key: 'most_three_wicket_hauls',
    label: 'Most 3-Wicket Hauls (3w+)',
    shortLabel: '3-Wicket Hauls',
    badge: '⚡ Strike Assassin',
    description: 'Matches where the bowler registered 3 or more wickets in a single spell',
    iconName: 'Zap',
    color: 'from-violet-600 to-purple-600 text-violet-500',
    getValue: (p) => p.threeWicketHauls,
    formatValue: (p) => `${p.threeWicketHauls} Times`,
    subValueFormat: (p) => `Total ${p.wickets} wkts taken in tournament`
  },
  {
    key: 'most_inning_dot_balls',
    label: 'Most Inning Dot Balls',
    shortLabel: 'Inning Dot Balls',
    badge: '🎯 Pressure Cooker',
    description: 'Highest count of dot balls delivered in an individual match spell',
    iconName: 'CircleDot',
    color: 'from-orange-600 to-red-600 text-orange-500',
    getValue: (p) => p.mostInningDotBalls,
    formatValue: (p) => `${p.mostInningDotBalls} Dots`,
    subValueFormat: (p) => p.mostInningDotBallsDetails
  },
  {
    key: 'tournament_dot_balls',
    label: 'Tournament Most Dot Balls',
    shortLabel: 'Tournament Dots',
    badge: '🛑 Dot Titan',
    description: 'Total legal deliveries yielding zero runs across the entire tournament',
    iconName: 'CircleDot',
    color: 'from-rose-600 to-pink-600 text-rose-500',
    getValue: (p) => p.totalDotBalls,
    formatValue: (p) => `${p.totalDotBalls} Dots`,
    subValueFormat: (p) => `${p.dotPercentage}% of ${p.ballsBowled} total balls bowled`
  },
  {
    key: 'best_bowling_average',
    label: 'Best Bowling Average',
    shortLabel: 'Best Average',
    badge: '📉 Precision Avg',
    description: 'Fewest runs conceded per wicket taken (Min 2 wickets)',
    iconName: 'TrendingUp',
    color: 'from-teal-600 to-emerald-600 text-teal-500',
    ascending: true,
    getValue: (p) => (p.wickets >= 2 ? p.bowlingAverage : 999),
    formatValue: (p) => (p.wickets >= 2 ? `${p.bowlingAverage}` : 'N/A'),
    subValueFormat: (p) => `${p.runsConceded} runs conceded for ${p.wickets} wkts`
  },
  {
    key: 'best_bowling_strike_rate',
    label: 'Best Bowling Strike Rate',
    shortLabel: 'Best Strike Rate',
    badge: '⚡ Strike Velocity',
    description: 'Balls bowled per wicket taken (Min 2 wickets taken)',
    iconName: 'Activity',
    color: 'from-indigo-600 to-blue-600 text-indigo-500',
    ascending: true,
    getValue: (p) => (p.wickets >= 2 ? p.bowlingStrikeRate : 999),
    formatValue: (p) => (p.wickets >= 2 ? `${p.bowlingStrikeRate} balls/wkt` : 'N/A'),
    subValueFormat: (p) => `${p.ballsBowled} balls bowled for ${p.wickets} wickets`
  },
  {
    key: 'highest_dot_percentage',
    label: 'Highest Dot Ball Percentage',
    shortLabel: 'Dot Ball %',
    badge: '🔒 Dot Mastery',
    description: 'Highest percentage of deliveries that resulted in dot balls',
    iconName: 'Shield',
    color: 'from-sky-600 to-cyan-600 text-sky-500',
    getValue: (p) => (p.overs >= 2 ? p.dotPercentage : 0),
    formatValue: (p) => `${p.dotPercentage}%`,
    subValueFormat: (p) => `${p.totalDotBalls} dots from ${p.ballsBowled} deliveries`
  },
  {
    key: 'most_four_plus_hauls',
    label: 'Most 4+ Wicket Hauls (Fifers & 4-fers)',
    shortLabel: '4w/5w Hauls',
    badge: '🏆 Spell Breaker',
    description: 'Spectacular multi-wicket demolitions of 4 or 5 wickets in an innings',
    iconName: 'Trophy',
    color: 'from-fuchsia-600 to-pink-600 text-fuchsia-500',
    getValue: (p) => p.fourWicketHauls + (p.fiveWicketHauls * 2),
    formatValue: (p) => `${p.fourWicketHauls + p.fiveWicketHauls} Hauls`,
    subValueFormat: (p) => `${p.fourWicketHauls} 4-fers • ${p.fiveWicketHauls} Fifers`
  },
  {
    key: 'most_overs_bowled',
    label: 'Most Overs Bowled (Workhorse)',
    shortLabel: 'Most Overs',
    badge: '⏱️ Workhorse',
    description: 'Bowlers trusted with the highest workload in the tournament',
    iconName: 'Clock',
    color: 'from-slate-600 to-zinc-700 text-slate-500',
    getValue: (p) => p.overs,
    formatValue: (p) => `${p.overs} Overs`,
    subValueFormat: (p) => `${p.ballsBowled} balls • ${p.runsConceded} runs conceded`
  },
  {
    key: 'best_death_economy',
    label: 'Best Death Overs Economy',
    shortLabel: 'Death Economy',
    badge: '🧊 Ice in Veins',
    description: 'Lowest economy rate during high-pressure final overs (Overs 16-20)',
    iconName: 'Flame',
    color: 'from-amber-600 to-rose-600 text-amber-500',
    ascending: true,
    getValue: (p) => (p.deathOversBowled >= 1 ? p.deathEconomy : 999),
    formatValue: (p) => (p.deathOversBowled >= 1 ? `${p.deathEconomy} RPO` : 'N/A'),
    subValueFormat: (p) => `${p.deathRunsConceded} runs in ${p.deathOversBowled} death overs`
  },
  {
    key: 'maidens_in_inning',
    label: 'Most Maidens in an Inning',
    shortLabel: 'Inning Maidens',
    badge: '🚫 Double Lockdown',
    description: 'Most maiden overs delivered by a bowler in a single match innings',
    iconName: 'Award',
    color: 'from-emerald-700 to-teal-700 text-emerald-600',
    getValue: (p) => p.maidensInInning,
    formatValue: (p) => `${p.maidensInInning} Maidens`,
    subValueFormat: (p) => p.maidensInInningDetails || `${p.maidensInInning} maidens in match`
  }
];

interface TournamentBowlingStatsSectionProps {
  stats: EnhancedBowlingStats[];
  onOpenPlayerCard?: (player: any) => void;
  tournamentName?: string;
}

export const TournamentBowlingStatsSection: React.FC<TournamentBowlingStatsSectionProps> = ({
  stats,
  onOpenPlayerCard,
  tournamentName = 'Tournament'
}) => {
  const [activeMetric, setActiveMetric] = useState<BowlingMetricKey>('most_wickets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'bento' | 'compact'>('bento');
  const [minOversFilter, setMinOversFilter] = useState<boolean>(true);

  // Extract unique teams
  const teamList = useMemo(() => {
    const set = new Set<string>();
    stats.forEach(s => {
      if (s.teamName) set.add(s.teamName);
    });
    return Array.from(set).sort();
  }, [stats]);

  const activeConfig = useMemo(() => {
    return BOWLING_METRIC_CONFIGS.find(c => c.key === activeMetric) || BOWLING_METRIC_CONFIGS[0];
  }, [activeMetric]);

  // Filter and sort players for current metric
  const filteredAndSortedStats = useMemo(() => {
    let result = [...stats];

    // Filter by team
    if (selectedTeam !== 'all') {
      result = result.filter(p => p.teamName === selectedTeam);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.playerName.toLowerCase().includes(q) || 
        p.teamName.toLowerCase().includes(q)
      );
    }

    // Min overs threshold for rate-based metrics if enabled
    if (minOversFilter && (activeMetric === 'best_economy' || activeMetric === 'best_bowling_average' || activeMetric === 'best_bowling_strike_rate')) {
      result = result.filter(p => p.overs >= 2);
    }

    // Sort according to metric config
    result.sort((a, b) => {
      if (activeConfig.secondarySort) {
        return activeConfig.secondarySort(a, b);
      }
      const valA = activeConfig.getValue(a);
      const valB = activeConfig.getValue(b);

      if (activeConfig.ascending) {
        return valA - valB;
      }
      return valB - valA;
    });

    return result;
  }, [stats, selectedTeam, searchQuery, minOversFilter, activeMetric, activeConfig]);

  // Top 3 Podium
  const topThree = useMemo(() => {
    return filteredAndSortedStats.slice(0, 3);
  }, [filteredAndSortedStats]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedStats.length === 0) return;
    const headers = [
      'Rank', 'Player Name', 'Team', 'Overs', 'Maidens', 'Runs Conceded', 
      'Wickets', 'Economy', 'Average', 'Strike Rate', 'Best Bowling', 
      'Dot Balls', 'Dot %', '3w Hauls', 'Active Metric', 'Active Metric Value'
    ];
    
    const rows = filteredAndSortedStats.map((p, idx) => [
      idx + 1,
      `"${p.playerName}"`,
      `"${p.teamName}"`,
      p.overs,
      p.maidens,
      p.runsConceded,
      p.wickets,
      p.economy,
      p.bowlingAverage,
      p.bowlingStrikeRate,
      `"${p.bestBowling}"`,
      p.totalDotBalls,
      `${p.dotPercentage}%`,
      p.threeWicketHauls,
      `"${activeConfig.label}"`,
      `"${activeConfig.formatValue(p)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${tournamentName.replace(/\s+/g, '_')}_Bowling_Stats_${activeMetric}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render icons dynamically
  const renderIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Crown': return <Crown className={className} />;
      case 'Target': return <Target className={className} />;
      case 'Shield': return <Shield className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Medal': return <Medal className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'CircleDot': return <CircleDot className={className} />;
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'Activity': return <Activity className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Award': return <Award className={className} />;
      default: return <Trophy className={className} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2.5rem] p-6 lg:p-8 space-y-6 transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Medal size={14} className="text-purple-500" />
                CricHeroes Standard Bowling Analytics
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stats.length} Active Bowlers
              </span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              ⚾ Bowling Leaderboards & Spells
            </h3>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
              Official tournament bowling metrics including Purple Cap leaders, maiden overs, 3-wicket hauls, single-match economy records, and tournament dot balls.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm active:scale-95"
              title="Download Leaderboard CSV"
            >
              <Download size={15} />
              Export CSV
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'bento' ? 'compact' : 'bento')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 transition-all border border-purple-200/50 dark:border-purple-800/40"
            >
              {viewMode === 'bento' ? 'Collapse Bento' : 'Expand 15 Metrics'}
            </button>
          </div>
        </div>

        {/* 15-METRIC BENTO GRID SELECTOR */}
        <AnimatePresence>
          {viewMode === 'bento' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Select from 15 CricHeroes Bowling Metrics</span>
                <span className="text-[11px] text-purple-600 dark:text-purple-400 font-black">
                  Current: {activeConfig.label}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {BOWLING_METRIC_CONFIGS.map((cfg) => {
                  const isSelected = activeMetric === cfg.key;
                  // Compute leader for this metric
                  const leader = [...stats].sort((a, b) => {
                    if (cfg.secondarySort) return cfg.secondarySort(a, b);
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
                          ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-500/60 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/20' 
                          : 'bg-slate-50/80 hover:bg-slate-100/90 dark:bg-slate-800/50 dark:hover:bg-slate-800 border-slate-200/60 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 w-full mb-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${
                          isSelected 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {cfg.shortLabel}
                        </span>
                        <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-purple-500 text-white' : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400'}`}>
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
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
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
            {BOWLING_METRIC_CONFIGS.map((cfg) => {
              const isSelected = activeMetric === cfg.key;
              return (
                <button
                  key={cfg.key}
                  onClick={() => setActiveMetric(cfg.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase whitespace-nowrap tracking-wider transition-all flex items-center gap-1.5 ${
                    isSelected 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/25 scale-[1.02]' 
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
        <div className="bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-transparent dark:from-purple-950/40 dark:via-indigo-950/20 rounded-2xl p-4 border border-purple-500/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              {renderIcon(activeConfig.iconName, 'w-6 h-6')}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
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

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {(activeMetric === 'best_economy' || activeMetric === 'best_bowling_average' || activeMetric === 'best_bowling_strike_rate') && (
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={minOversFilter}
                  onChange={(e) => setMinOversFilter(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                />
                Min 2 Overs Bowled
              </label>
            )}
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
                <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
              className="bg-gradient-to-b from-purple-500/10 via-white to-white dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 border-2 border-purple-500/50 rounded-[2.2rem] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer hover:border-purple-500 transition-all group md:-translate-y-2 ring-4 ring-purple-500/10"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                <Crown size={12} className="text-amber-300" />
                Tournament Leader
              </div>

              <div className="flex justify-between items-start">
                <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                  1
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100/60 dark:bg-purple-900/40 px-2.5 py-0.5 rounded-lg border border-purple-200/50">
                  {activeConfig.badge}
                </span>
              </div>

              <div className="my-4 text-center space-y-1">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
                    {topThree[0].playerName.charAt(0)}
                  </div>
                  <div className="absolute -top-2 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full shadow-md">
                    <Crown size={12} />
                  </div>
                </div>
                <h4 className="font-black text-slate-900 dark:text-white text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {topThree[0].playerName}
                </h4>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {topThree[0].teamName}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl p-3.5 text-center border border-purple-100 dark:border-purple-900/50">
                <div className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  {activeConfig.formatValue(topThree[0])}
                </div>
                <div className="text-[11px] text-purple-600/80 dark:text-purple-400 font-semibold truncate mt-0.5">
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
                <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
              placeholder="Search bowler or team..."
              className="w-full pl-9 pr-4 py-2.5 text-xs font-semibold rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
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
            <p className="text-sm font-bold">No bowlers found matching this criteria.</p>
            <p className="text-xs">Try resetting your search query or team filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[720px] uppercase font-extrabold tracking-wide">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-black">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Player / Squad</th>
                  <th className="py-3 px-3 text-center bg-purple-500/5 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-t-xl">
                    {activeConfig.shortLabel}
                  </th>
                  <th className="py-3 px-3 text-center">Overs</th>
                  <th className="py-3 px-3 text-center">Maidens</th>
                  <th className="py-3 px-3 text-center">Runs</th>
                  <th className="py-3 px-3 text-center">Wickets</th>
                  <th className="py-3 px-3 text-center">Economy</th>
                  <th className="py-3 px-3 text-center">Average</th>
                  <th className="py-3 px-3 text-center">Strike Rate</th>
                  <th className="py-3 px-3 text-center">BBI</th>
                  <th className="py-3 px-3 text-center">Dots (%)</th>
                  <th className="py-3 px-3 text-center">3w+</th>
                  <th className="py-3 px-3 text-right">Spell Highlight</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStats.map((player, idx) => {
                  const isTop3 = idx < 3;
                  return (
                    <tr
                      key={`${player.teamName}-${player.playerName}-${idx}`}
                      onClick={() => onOpenPlayerCard && onOpenPlayerCard(player.rawPlayerStats || player)}
                      className={`border-b border-slate-50 dark:border-slate-800/80 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 cursor-pointer transition-colors group ${
                        idx === 0 ? 'bg-purple-50/20 dark:bg-purple-950/10' : ''
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
                          <span className="font-black text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                            {player.playerName}
                            {idx === 0 && <Crown size={12} className="text-amber-500 shrink-0" />}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-bold">
                            {player.teamName}
                          </span>
                        </div>
                      </td>

                      {/* Active Highlight Metric */}
                      <td className="py-3.5 px-3 text-center bg-purple-500/5 dark:bg-purple-500/10 font-black text-purple-700 dark:text-purple-300 text-sm">
                        {activeConfig.formatValue(player)}
                      </td>

                      {/* Overs */}
                      <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">
                        {player.overs}
                      </td>

                      {/* Maidens */}
                      <td className="py-3.5 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {player.maidens}
                      </td>

                      {/* Runs Conceded */}
                      <td className="py-3.5 px-3 text-center font-extrabold text-slate-700 dark:text-slate-300">
                        {player.runsConceded}
                      </td>

                      {/* Wickets */}
                      <td className="py-3.5 px-3 text-center font-black text-purple-600 dark:text-purple-400 text-sm">
                        {player.wickets}
                      </td>

                      {/* Economy */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {player.economy}
                      </td>

                      {/* Average */}
                      <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300">
                        {player.bowlingAverage}
                      </td>

                      {/* Strike Rate */}
                      <td className="py-3.5 px-3 text-center font-mono text-indigo-600 dark:text-indigo-400">
                        {player.bowlingStrikeRate}
                      </td>

                      {/* BBI */}
                      <td className="py-3.5 px-3 text-center font-mono font-black text-pink-600 dark:text-pink-400">
                        {player.bestBowling}
                      </td>

                      {/* Dots (%) */}
                      <td className="py-3.5 px-3 text-center font-mono text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{player.totalDotBalls}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                        <span className="text-teal-600 dark:text-teal-400 font-bold">{player.dotPercentage}%</span>
                      </td>

                      {/* 3w+ Hauls */}
                      <td className="py-3.5 px-3 text-center font-mono text-violet-600 dark:text-violet-400 font-bold">
                        {player.threeWicketHauls}
                      </td>

                      {/* Spell Highlight Details */}
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
