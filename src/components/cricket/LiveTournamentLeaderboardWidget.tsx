import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Flame, Zap, Award, Crown, TrendingUp, 
  Shield, User, ArrowUpRight, Search, Sparkles
} from 'lucide-react';
import type { MatchState } from './CricketScoreboard';

export interface LeaderboardPlayerStat {
  name: string;
  team: string;
  runs: number;
  balls: number;
  innings: number;
  highestScore: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  average: number;
  // Bowling
  overs: number;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  economy: number;
  dotBalls: number;
  dotPercentage: number;
  bestBowling: string;
}

interface LiveTournamentLeaderboardWidgetProps {
  currentMatch?: MatchState | null;
  pastMatches?: MatchState[];
  tournamentName?: string;
  onSelectPlayer?: (playerStat: LeaderboardPlayerStat) => void;
  className?: string;
}

export const LiveTournamentLeaderboardWidget: React.FC<LiveTournamentLeaderboardWidgetProps> = ({
  currentMatch,
  pastMatches = [],
  tournamentName,
  onSelectPlayer,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'orange' | 'purple' | 'sixes' | 'economy'>('orange');
  const [searchTerm, setSearchTerm] = useState('');

  // Consolidate player statistics from current active match + tournament matches
  const statsList: LeaderboardPlayerStat[] = useMemo(() => {
    const playerMap = new Map<string, LeaderboardPlayerStat>();

    const getOrCreate = (name: string, team: string): LeaderboardPlayerStat => {
      const key = name.trim().toLowerCase();
      if (!playerMap.has(key)) {
        playerMap.set(key, {
          name: name.trim(),
          team: team || 'Local Squad',
          runs: 0,
          balls: 0,
          innings: 0,
          highestScore: 0,
          fours: 0,
          sixes: 0,
          strikeRate: 0,
          average: 0,
          overs: 0,
          ballsBowled: 0,
          runsConceded: 0,
          wickets: 0,
          economy: 0,
          dotBalls: 0,
          dotPercentage: 0,
          bestBowling: '0/0',
        });
      }
      return playerMap.get(key)!;
    };

    const processMatch = (m: MatchState | null | undefined) => {
      if (!m) return;
      const inningsList = [m.innings1, m.innings2].filter(Boolean);

      inningsList.forEach((inn) => {
        if (!inn) return;

        // Batsmen
        (inn.batsmen || []).forEach((b) => {
          if (!b || !b.name) return;
          const stat = getOrCreate(b.name, inn.battingTeam);
          stat.runs += b.runs || 0;
          stat.balls += b.balls || 0;
          stat.fours += b.fours || 0;
          stat.sixes += b.sixes || 0;
          if ((b.runs || 0) > stat.highestScore) {
            stat.highestScore = b.runs || 0;
          }
          if ((b.balls || 0) > 0 || (b.runs || 0) > 0) {
            stat.innings += 1;
          }
        });

        // Bowlers
        (inn.bowlers || []).forEach((bw) => {
          if (!bw || !bw.name) return;
          const stat = getOrCreate(bw.name, inn.bowlingTeam);
          const balls = bw.ballsBowled || 0;
          stat.ballsBowled += balls;
          stat.runsConceded += bw.runsConceded || 0;
          stat.wickets += bw.wickets || 0;
          // Approximate dot balls
          const approxDots = Math.floor(balls * 0.45);
          stat.dotBalls += approxDots;

          const currentBestWkts = parseInt(stat.bestBowling.split('/')[0], 10) || 0;
          const currentBestRuns = parseInt(stat.bestBowling.split('/')[1], 10) || 999;
          if (bw.wickets > currentBestWkts || (bw.wickets === currentBestWkts && bw.runsConceded < currentBestRuns)) {
            stat.bestBowling = `${bw.wickets}/${bw.runsConceded}`;
          }
        });
      });
    };

    // Process all tournament matches
    pastMatches.forEach(processMatch);

    // Process current live match for ball-by-ball updates!
    if (currentMatch) {
      processMatch(currentMatch);
    }

    // Compute derived rates
    const list = Array.from(playerMap.values());
    list.forEach((p) => {
      p.overs = Number((p.ballsBowled / 6).toFixed(1));
      p.strikeRate = p.balls > 0 ? Number(((p.runs / p.balls) * 100).toFixed(1)) : 0;
      p.average = p.innings > 0 ? Number((p.runs / p.innings).toFixed(1)) : p.runs;
      p.economy = p.overs > 0 ? Number((p.runsConceded / p.overs).toFixed(2)) : 0;
      p.dotPercentage = p.ballsBowled > 0 ? Number(((p.dotBalls / p.ballsBowled) * 100).toFixed(1)) : 0;
    });

    return list;
  }, [currentMatch, pastMatches]);

  // Sorted Leaderboard Views
  const sortedOrangeCap = useMemo(() => {
    return [...statsList].sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate);
  }, [statsList]);

  const sortedPurpleCap = useMemo(() => {
    return [...statsList].sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);
  }, [statsList]);

  const sortedSixes = useMemo(() => {
    return [...statsList].sort((a, b) => b.sixes - a.sixes || b.strikeRate - a.strikeRate);
  }, [statsList]);

  const sortedEconomy = useMemo(() => {
    return [...statsList]
      .filter((p) => p.overs >= 1)
      .sort((a, b) => a.economy - b.economy || b.wickets - a.wickets);
  }, [statsList]);

  const currentLeader = activeTab === 'orange'
    ? sortedOrangeCap[0]
    : activeTab === 'purple'
    ? sortedPurpleCap[0]
    : activeTab === 'sixes'
    ? sortedSixes[0]
    : sortedEconomy[0];

  const currentDisplayList = (
    activeTab === 'orange'
      ? sortedOrangeCap
      : activeTab === 'purple'
      ? sortedPurpleCap
      : activeTab === 'sixes'
      ? sortedSixes
      : sortedEconomy
  ).filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.team.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden text-left ${className}`}>
      {/* Top Cap Spotlight Header */}
      <div className={`p-5 text-white relative overflow-hidden transition-all ${
        activeTab === 'orange'
          ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600'
          : activeTab === 'purple'
          ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-fuchsia-700'
          : activeTab === 'sixes'
          ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600'
          : 'bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {activeTab === 'orange' ? '🟠' : activeTab === 'purple' ? '🟣' : activeTab === 'sixes' ? '🚀' : '🎯'}
              </span>
              <h3 className="font-black text-base uppercase tracking-wider">
                {activeTab === 'orange'
                  ? 'Orange Cap (Top Run Scorer)'
                  : activeTab === 'purple'
                  ? 'Purple Cap (Top Wicket Taker)'
                  : activeTab === 'sixes'
                  ? 'Maximum Sixes Leaderboard'
                  : 'Best Bowling Economy'}
              </h3>
            </div>
            <p className="text-[11px] text-white/80 font-medium mt-0.5">
              Live tournament standings updating ball-by-ball • {tournamentName || currentMatch?.tournamentName || 'Gully Premier League'}
            </p>
          </div>

          {currentLeader && (
            <div 
              onClick={() => onSelectPlayer && onSelectPlayer(currentLeader)}
              className="px-3.5 py-1.5 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/20 flex items-center gap-2.5 cursor-pointer hover:bg-black/40 transition-colors"
              title="Click to view Career Player Card"
            >
              <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs">
                👑
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-white/70 block">Cap Holder</span>
                <span className="text-xs font-black truncate max-w-[120px] block">{currentLeader.name}</span>
              </div>
              <div className="pl-1 border-l border-white/20 font-black text-sm">
                {activeTab === 'orange'
                  ? `${currentLeader.runs} R`
                  : activeTab === 'purple'
                  ? `${currentLeader.wickets} W`
                  : activeTab === 'sixes'
                  ? `${currentLeader.sixes} 6s`
                  : `${currentLeader.economy} Econ`}
              </div>
            </div>
          )}
        </div>

        {/* Tab switcher buttons */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('orange')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === 'orange'
                ? 'bg-white text-orange-700 shadow-md font-extrabold'
                : 'bg-black/20 text-white/90 hover:bg-black/30'
            }`}
          >
            🟠 Orange Cap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('purple')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === 'purple'
                ? 'bg-white text-purple-800 shadow-md font-extrabold'
                : 'bg-black/20 text-white/90 hover:bg-black/30'
            }`}
          >
            🟣 Purple Cap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sixes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === 'sixes'
                ? 'bg-white text-pink-700 shadow-md font-extrabold'
                : 'bg-black/20 text-white/90 hover:bg-black/30'
            }`}
          >
            🚀 Most Sixes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('economy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              activeTab === 'economy'
                ? 'bg-white text-emerald-800 shadow-md font-extrabold'
                : 'bg-black/20 text-white/90 hover:bg-black/30'
            }`}
          >
            🎯 Best Economy
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search player or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-slate-100"
          />
        </div>
        <span className="text-[11px] text-slate-400 font-bold">
          Click any player to view Gully Badges
        </span>
      </div>

      {/* Table listing */}
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              <th className="py-2.5 px-4 text-center w-12">#</th>
              <th className="py-2.5 px-4">Player</th>
              {activeTab === 'orange' ? (
                <>
                  <th className="py-2.5 px-3 text-center">Inns</th>
                  <th className="py-2.5 px-3 text-center text-orange-600 dark:text-orange-400">Runs</th>
                  <th className="py-2.5 px-3 text-center">Balls</th>
                  <th className="py-2.5 px-3 text-center">SR</th>
                  <th className="py-2.5 px-3 text-center">4s / 6s</th>
                  <th className="py-2.5 px-3 text-center">HS</th>
                </>
              ) : activeTab === 'purple' ? (
                <>
                  <th className="py-2.5 px-3 text-center">Overs</th>
                  <th className="py-2.5 px-3 text-center text-purple-600 dark:text-purple-400">Wkts</th>
                  <th className="py-2.5 px-3 text-center">Runs</th>
                  <th className="py-2.5 px-3 text-center">Econ</th>
                  <th className="py-2.5 px-3 text-center">Best</th>
                  <th className="py-2.5 px-3 text-center">Dot %</th>
                </>
              ) : activeTab === 'sixes' ? (
                <>
                  <th className="py-2.5 px-3 text-center text-rose-600 dark:text-rose-400 font-black">Sixes</th>
                  <th className="py-2.5 px-3 text-center">Fours</th>
                  <th className="py-2.5 px-3 text-center">Runs</th>
                  <th className="py-2.5 px-3 text-center">SR</th>
                </>
              ) : (
                <>
                  <th className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-black">Econ</th>
                  <th className="py-2.5 px-3 text-center">Overs</th>
                  <th className="py-2.5 px-3 text-center">Runs Cons</th>
                  <th className="py-2.5 px-3 text-center">Wkts</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {currentDisplayList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No players found matching your search.
                </td>
              </tr>
            ) : (
              currentDisplayList.map((player, idx) => {
                const isFirst = idx === 0;
                return (
                  <tr
                    key={player.name}
                    onClick={() => onSelectPlayer && onSelectPlayer(player)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-bold">
                      {isFirst ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">{idx + 1}</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block">
                            {player.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{player.team}</span>
                        </div>
                        {isFirst && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            Leader
                          </span>
                        )}
                      </div>
                    </td>

                    {activeTab === 'orange' ? (
                      <>
                        <td className="py-3 px-3 text-center text-slate-500">{player.innings}</td>
                        <td className="py-3 px-3 text-center font-black text-sm text-orange-600 dark:text-orange-400">
                          {player.runs}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{player.balls}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {player.strikeRate}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {player.fours} / <span className="text-amber-600 font-bold">{player.sixes}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {player.highestScore}
                        </td>
                      </>
                    ) : activeTab === 'purple' ? (
                      <>
                        <td className="py-3 px-3 text-center text-slate-500">{player.overs}</td>
                        <td className="py-3 px-3 text-center font-black text-sm text-purple-600 dark:text-purple-400">
                          {player.wickets}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{player.runsConceded}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {player.economy}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {player.bestBowling}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{player.dotPercentage}%</td>
                      </>
                    ) : activeTab === 'sixes' ? (
                      <>
                        <td className="py-3 px-3 text-center font-black text-sm text-rose-600 dark:text-rose-400">
                          {player.sixes}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{player.fours}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {player.runs}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{player.strikeRate}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-3 text-center font-black text-sm text-emerald-600 dark:text-emerald-400">
                          {player.economy}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-500">{player.overs}</td>
                        <td className="py-3 px-3 text-center text-slate-500">{player.runsConceded}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {player.wickets}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
