import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Award, Zap, Flame, Shield, Trophy, Target, 
  TrendingUp, Share2, Sparkles, Check, Star, Activity, Crown
} from 'lucide-react';

export interface PlayerCareerStats {
  name: string;
  team?: string;
  role?: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  battingStyle?: string;
  bowlingStyle?: string;
  matches: number;
  innings: number;
  runs: number;
  highestScore: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  notOuts: number;
  ducks: number;
  goldenDucks: number;
  // Bowling
  oversBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  bestBowling: string;
  dotBallsBowled: number;
  deathOversBowled?: number;
  deathRunsConceded?: number;
  deathWickets?: number;
  // Fielding
  catches: number;
  stumpings: number;
  runOuts: number;
}

export interface GullyBadge {
  id: string;
  title: string;
  icon: string;
  color: string;
  badgeLevel: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
  description: string;
  criteria: string;
  unlocked: boolean;
}

export interface CareerPlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerCareerStats | null;
}

export const CareerPlayerCardModal: React.FC<CareerPlayerCardModalProps> = ({
  isOpen,
  onClose,
  player,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'batting' | 'bowling' | 'fielding'>('badges');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !player) return null;

  // Derived Batting Stats
  const dismissals = Math.max(1, player.innings - player.notOuts);
  const battingAverage = player.innings > 0 ? (player.runs / dismissals).toFixed(1) : '0.0';
  const strikeRate = player.ballsFaced > 0 ? ((player.runs / player.ballsFaced) * 100).toFixed(1) : '0.0';
  const boundaryRuns = player.fours * 4 + player.sixes * 6;
  const boundaryPercentage = player.runs > 0 ? ((boundaryRuns / player.runs) * 100).toFixed(1) : '0.0';
  const dotBallPercentageFaced = player.ballsFaced > 0 
    ? Math.max(0, Math.min(100, 100 - (player.runs / player.ballsFaced) * 65)).toFixed(1)
    : '0.0';

  // Derived Bowling Stats
  const totalBallsBowled = Math.round(player.oversBowled * 6);
  const bowlingEconomy = player.oversBowled > 0 ? (player.runsConceded / player.oversBowled).toFixed(2) : '0.00';
  const bowlingAverage = player.wickets > 0 ? (player.runsConceded / player.wickets).toFixed(1) : '-';
  const bowlingStrikeRate = player.wickets > 0 ? (totalBallsBowled / player.wickets).toFixed(1) : '-';
  const bowlingDotPercentage = totalBallsBowled > 0 ? ((player.dotBallsBowled / totalBallsBowled) * 100).toFixed(1) : '0.0';

  // Death overs economy
  const deathEconomy = (player.deathOversBowled && player.deathOversBowled > 0 && player.deathRunsConceded !== undefined)
    ? (player.deathRunsConceded / player.deathOversBowled).toFixed(2)
    : bowlingEconomy;

  // Gully Rating Points calculation
  const battingPoints = player.runs * 1 + player.fours * 1.5 + player.sixes * 3 + player.fifties * 30 + player.hundreds * 75;
  const bowlingPoints = player.wickets * 25 + player.maidens * 15 + player.dotBallsBowled * 1.2;
  const fieldingPoints = player.catches * 10 + player.stumpings * 15 + player.runOuts * 15;
  const gullyRatingPoints = Math.round(battingPoints + bowlingPoints + fieldingPoints);

  // Gully Ranking Tier
  let rankingTier = {
    title: 'Bronze Rising Talent',
    tier: 'Bronze',
    color: 'from-amber-700 to-amber-900 text-amber-100 border-amber-600',
    icon: '🥉',
    stars: 1,
  };
  if (gullyRatingPoints >= 1000) {
    rankingTier = {
      title: 'Diamond Gully Legend',
      tier: 'Diamond',
      color: 'from-cyan-500 via-blue-600 to-indigo-800 text-white border-cyan-400',
      icon: '💎',
      stars: 5,
    };
  } else if (gullyRatingPoints >= 650) {
    rankingTier = {
      title: 'Platinum Street Star',
      tier: 'Platinum',
      color: 'from-purple-500 via-indigo-600 to-blue-700 text-white border-purple-400',
      icon: '👑',
      stars: 4,
    };
  } else if (gullyRatingPoints >= 400) {
    rankingTier = {
      title: 'Gold Local Champion',
      tier: 'Gold',
      color: 'from-amber-400 via-yellow-500 to-amber-600 text-slate-900 border-amber-300',
      icon: '🥇',
      stars: 3,
    };
  } else if (gullyRatingPoints >= 200) {
    rankingTier = {
      title: 'Silver Match Winner',
      tier: 'Silver',
      color: 'from-slate-300 via-slate-400 to-slate-500 text-slate-900 border-slate-300',
      icon: '🥈',
      stars: 2,
    };
  }

  // Gully Badges Evaluation
  const badges: GullyBadge[] = [
    {
      id: 'six_machine',
      title: 'Six Machine',
      icon: '🚀',
      color: 'from-amber-500 to-orange-600',
      badgeLevel: player.sixes >= 15 ? 'Diamond' : player.sixes >= 8 ? 'Gold' : player.sixes >= 4 ? 'Silver' : 'Bronze',
      description: 'Clears the boundary ropes on demand. Fearless power hitter.',
      criteria: 'Hit 4+ sixes in gully matches',
      unlocked: player.sixes >= 4 || Number(boundaryPercentage) >= 45,
    },
    {
      id: 'death_specialist',
      title: 'Death-Over Specialist',
      icon: '🎯',
      color: 'from-rose-600 to-red-700',
      badgeLevel: Number(deathEconomy) < 6.5 ? 'Diamond' : 'Gold',
      description: 'Nails yorkers and changes of pace in the final pressure overs.',
      criteria: 'Overs bowled with economy < 8.0 in crunch overs',
      unlocked: player.oversBowled >= 2 && Number(bowlingEconomy) <= 8.5,
    },
    {
      id: 'clutch_finisher',
      title: 'Clutch Finisher',
      icon: '⚡',
      color: 'from-emerald-500 to-teal-600',
      badgeLevel: Number(strikeRate) >= 160 ? 'Diamond' : 'Gold',
      description: 'Maintains elite strike rate when chasing down targets.',
      criteria: 'Strike rate above 140 with boundary mastery',
      unlocked: Number(strikeRate) >= 135 && player.runs >= 20,
    },
    {
      id: 'golden_duck',
      title: 'Street Grit / Duck Survivor',
      icon: '🦆',
      color: 'from-yellow-400 to-amber-500',
      badgeLevel: player.goldenDucks > 0 ? 'Gold' : 'Bronze',
      description: 'Took a golden duck on the chin and bounced right back to fight.',
      criteria: 'Survived first-ball dismissal and returned stronger',
      unlocked: player.goldenDucks > 0 || player.ducks > 0,
    },
    {
      id: 'dot_master',
      title: 'Dot Ball Master',
      icon: '🛡️',
      color: 'from-indigo-600 to-blue-700',
      badgeLevel: Number(bowlingDotPercentage) >= 50 ? 'Diamond' : 'Gold',
      description: 'Chokes run scoring with precision line, length, and dot pressure.',
      criteria: 'Dot ball percentage above 40%',
      unlocked: Number(bowlingDotPercentage) >= 40 && player.oversBowled >= 2,
    },
    {
      id: 'wall_of_gully',
      title: 'Wall of Gully',
      icon: '🧱',
      color: 'from-slate-700 to-slate-900',
      badgeLevel: Number(battingAverage) >= 35 ? 'Diamond' : 'Silver',
      description: 'Gives away nothing cheaply. Solid technique and anchor innings.',
      criteria: 'Batting average above 25.0',
      unlocked: Number(battingAverage) >= 25 && player.innings >= 2,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const handleShareCard = () => {
    const text = `🏏 GullyScore Player Card: ${player.name} (${rankingTier.title})\n⭐ Gully Rating: ${gullyRatingPoints} pts | 🎖️ Badges: ${unlockedCount}/${badges.length}\n📊 Batting: ${player.runs} runs (Avg: ${battingAverage}, SR: ${strikeRate})\n🎯 Bowling: ${player.wickets} wkts (Econ: ${bowlingEconomy}, Best: ${player.bestBowling})\nCheck out live local cricket on GullyScore!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden text-left my-auto"
        >
          {/* Top Hero Banner */}
          <div className={`p-6 bg-gradient-to-r ${rankingTier.color} text-white relative overflow-hidden`}>
            {/* Background patterns */}
            <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
              <Trophy size={160} />
            </div>

            {/* Header row */}
            <div className="flex justify-between items-start relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-sm border border-white/20 text-xs font-black uppercase tracking-wider">
                <span>{rankingTier.icon}</span>
                <span>{rankingTier.title}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareCard}
                  className="p-2 rounded-full bg-black/25 hover:bg-black/40 text-white transition-colors cursor-pointer"
                  title="Share Player Card"
                >
                  {copied ? <Check size={16} className="text-emerald-300" /> : <Share2 size={16} />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/25 hover:bg-black/40 text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Player Info Main */}
            <div className="mt-4 flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
                {player.name.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate drop-shadow-sm">
                  {player.name}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-white/80 font-medium">
                  {player.team && <span className="font-bold">{player.team}</span>}
                  <span>•</span>
                  <span>{player.role || 'All-Rounder'}</span>
                  <span>•</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full font-mono font-bold text-[10px]">
                    {player.matches} Matches
                  </span>
                </div>
              </div>
            </div>

            {/* Micro Rating Ticker */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center bg-black/20 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-white/70 uppercase font-bold block">Gully Score</span>
                <span className="text-base sm:text-lg font-black tracking-wide">{gullyRatingPoints}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 uppercase font-bold block">Batting Avg</span>
                <span className="text-base sm:text-lg font-black">{battingAverage}</span>
              </div>
              <div>
                <span className="text-[10px] text-white/70 uppercase font-bold block">Bowling Econ</span>
                <span className="text-base sm:text-lg font-black">{bowlingEconomy}</span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-5 pt-3 border-b border-slate-100 dark:border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'badges'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🎖️ Gully Badges ({unlockedCount}/{badges.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batting')}
              className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'batting'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🏏 Batting Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bowling')}
              className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'bowling'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              ⚾ Bowling Stats
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fielding')}
              className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'fielding'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              🧤 Fielding
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 max-h-[50vh] overflow-y-auto space-y-4">
            {/* BADGES TAB */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Unlocked Achievements
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    {unlockedCount} of {badges.length} Unlocked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        badge.unlocked
                          ? 'bg-gradient-to-br from-slate-50 to-white dark:from-slate-850 dark:to-slate-900 border-slate-200 dark:border-slate-700 shadow-sm'
                          : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner ${
                          badge.unlocked ? 'bg-amber-500/10' : 'bg-slate-200 dark:bg-slate-800 grayscale'
                        }`}>
                          {badge.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white">
                              {badge.title}
                            </h4>
                            {badge.unlocked && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {badge.badgeLevel}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {badge.description}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 font-mono">
                            Target: {badge.criteria}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BATTING TAB */}
            {activeTab === 'batting' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Runs</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{player.runs}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Batting Avg</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{battingAverage}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Strike Rate</span>
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400">{strikeRate}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">High Score</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{player.highestScore}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Boundary %</span>
                    <span className="text-sm font-black text-orange-600 dark:text-orange-400">{boundaryPercentage}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Fours & Sixes</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">
                      {player.fours} <span className="text-slate-400 text-xs">4s</span> / {player.sixes} <span className="text-amber-500 text-xs">6s</span>
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">50s / 100s</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{player.fifties} / {player.hundreds}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Balls Faced</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{player.ballsFaced}</span>
                  </div>
                </div>
              </div>
            )}

            {/* BOWLING TAB */}
            {activeTab === 'bowling' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Wickets</span>
                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">{player.wickets}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Economy</span>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{bowlingEconomy}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Overs</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{player.oversBowled}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Bowling</span>
                    <span className="text-lg font-black text-purple-600 dark:text-purple-400">{player.bestBowling || '-'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dot Ball %</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{bowlingDotPercentage}%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Runs Conceded</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{player.runsConceded}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Maidens</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">{player.maidens}</span>
                  </div>
                </div>
              </div>
            )}

            {/* FIELDING TAB */}
            {activeTab === 'fielding' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Catches</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{player.catches}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Stumpings</span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{player.stumpings}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Run Outs</span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400">{player.runOuts}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400">
              GullyScore Verified Career Card
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-opacity hover:opacity-90 cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
