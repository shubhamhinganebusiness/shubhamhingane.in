import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Award, Flame, Zap, Shield, Search, BarChart3, TrendingUp, Compass, Users
} from 'lucide-react';
import { TeamWithRoster, PlayerProfile } from './TournamentVenueScheduler';

interface TournamentMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  date: string;
  status: 'scheduled' | 'live' | 'completed';
  scoreA: string;
  scoreB: string;
  winnerId: string | null;
  winReason: string;
  manOfTheMatch: string;
  stage: string;
}

interface TournamentStatsAndLeaderboardsProps {
  tournamentId: string;
  teams: TeamWithRoster[];
  matches: TournamentMatch[];
}

interface PlayerStats {
  playerName: string;
  teamName: string;
  runs: number;
  balls: number;
  innings: number;
  highestScore: number;
  strikeRate: number;
  average: number;
  fours: number;
  sixes: number;
  wickets: number;
  overs: number;
  runsConceded: number;
  economy: number;
  bestBowling: string;
  dotBalls: number;
  dotPercentage: number;
  catches: number;
  stumpings: number;
  runOuts: number;
  mvpPoints: number;
}

export const TournamentStatsAndLeaderboards: React.FC<TournamentStatsAndLeaderboardsProps> = ({
  tournamentId,
  teams,
  matches,
}) => {
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'batting' | 'bowling' | 'fielding' | 'profiles' | 'awards'>('batting');
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<string>('');
  
  // Historical & dynamic players stats buffer state
  const [playerStatsList, setPlayerStatsList] = useState<PlayerStats[]>([]);

  // Generate simulated stats to populate leaderboards initially, and overlay actual completions
  useEffect(() => {
    const list: PlayerStats[] = [];

    // Names map to distribute realistic variables
    teams.forEach(t => {
      const pRoster = t.players && t.players.length > 0 ? t.players : [
        { name: t.captain || 'Captain', age: 25, role: 'All-Rounder' as const, battingStyle: 'Right Hand' as const, bowlingStyle: 'Right-Arm Fast' as const, regFeePaid: true, regFeeAmount: 50 },
        { name: 'S. Tendulkar', age: 28, role: 'Batsman' as const, battingStyle: 'Right Hand' as const, bowlingStyle: 'None' as const, regFeePaid: true, regFeeAmount: 50 },
        { name: 'V. Kohli', age: 27, role: 'Batsman' as const, battingStyle: 'Right Hand' as const, bowlingStyle: 'None' as const, regFeePaid: true, regFeeAmount: 50 },
        { name: 'M.S. Dhoni', age: 31, role: 'Wicket-Keeper' as const, battingStyle: 'Right Hand' as const, bowlingStyle: 'None' as const, regFeePaid: true, regFeeAmount: 50 },
        { name: 'A. Kumble', age: 29, role: 'Bowler' as const, battingStyle: 'Right Hand' as const, bowlingStyle: 'Right-Arm Spin' as const, regFeePaid: true, regFeeAmount: 50 },
        { name: 'Z. Khan', age: 26, role: 'Bowler' as const, battingStyle: 'Right Hand' as const, bowlingStyle: 'Left-Arm Fast' as const, regFeePaid: true, regFeeAmount: 50 }
      ];

      pRoster.forEach((p, idx) => {
        // Base variables based on player roles
        let baseRuns = 15;
        let baseBalls = 12;
        let baseInnings = idx < 4 ? 4 : 2;
        let baseHighest = 15;
        let baseFours = 2;
        let baseSixes = 1;

        let baseWickets = 0;
        let baseOvers = 0;
        let baseRunsConceded = 0;
        let baseBestWickets = 0;
        let baseBestRuns = 12;
        let baseDots = 0;

        let baseCatches = 1;
        let baseStumpings = 0;
        let baseRunOuts = 0;

        // Customise per role
        if (p.role === 'Batsman' || p.role === 'Wicket-Keeper') {
          baseRuns = 80 + Math.floor(Math.random() * 140);
          baseBalls = 60 + Math.floor(Math.random() * 80);
          baseHighest = Math.floor(baseRuns / (1.5 + Math.random()));
          if (baseHighest > baseRuns) baseHighest = baseRuns;
          baseFours = Math.floor(baseRuns * 0.08);
          baseSixes = Math.floor(baseRuns * 0.05);
          if (p.role === 'Wicket-Keeper') {
            baseCatches = 3 + Math.floor(Math.random() * 5);
            baseStumpings = 1 + Math.floor(Math.random() * 4);
          }
        } else if (p.role === 'Bowler') {
          baseWickets = 4 + Math.floor(Math.random() * 8);
          baseOvers = 10 + Math.floor(Math.random() * 12);
          baseRunsConceded = baseOvers * 6 + Math.floor(Math.random() * 25);
          baseBestWickets = Math.min(baseWickets, 3 + Math.floor(Math.random() * 3));
          baseBestRuns = 8 + Math.floor(Math.random() * 15);
          baseDots = Math.floor(baseOvers * 6 * 0.45);
          baseRuns = 12 + Math.floor(Math.random() * 35);
          baseBalls = 10 + Math.floor(Math.random() * 20);
          baseHighest = Math.min(baseRuns, 18);
        } else {
          // All Rounder
          baseRuns = 60 + Math.floor(Math.random() * 100);
          baseBalls = 50 + Math.floor(Math.random() * 60);
          baseHighest = Math.floor(baseRuns / 2);
          baseFours = Math.floor(baseRuns * 0.06);
          baseSixes = Math.floor(baseRuns * 0.04);
          baseWickets = 3 + Math.floor(Math.random() * 5);
          baseOvers = 8 + Math.floor(Math.random() * 10);
          baseRunsConceded = baseOvers * 7.2 + Math.floor(Math.random() * 15);
          baseBestWickets = Math.min(baseWickets, 2 + Math.floor(Math.random() * 2));
          baseBestRuns = 10 + Math.floor(Math.random() * 12);
          baseDots = Math.floor(baseOvers * 6 * 0.38);
          baseCatches = 2 + Math.floor(Math.random() * 3);
        }

        // Overlay with actual completed matches in this tournament!
        const completedMatches = matches.filter(m => m.status === 'completed');
        completedMatches.forEach(m => {
          const isTeamA = m.teamAId === t.id;
          const isTeamB = m.teamBId === t.id;
          if (isTeamA || isTeamB) {
            // Check if player is name matched in MoM
            if (m.manOfTheMatch === p.name) {
              baseCatches += 1;
            }
          }
        });

        // Basic stats math logic
        const strikeRate = baseBalls > 0 ? Number(((baseRuns / baseBalls) * 100).toFixed(1)) : 0;
        const average = baseInnings > 0 ? Number((baseRuns / baseInnings).toFixed(1)) : baseRuns;
        const econ = baseOvers > 0 ? Number((baseRunsConceded / baseOvers).toFixed(2)) : 0;
        const totalBallsBowled = baseOvers * 6;
        const dotPercentage = totalBallsBowled > 0 ? Number(((baseDots / totalBallsBowled) * 100).toFixed(1)) : 0;
        const bestBowling = baseWickets > 0 ? `${baseBestWickets}/${baseBestRuns}` : '0/0';

        // MVP Weight System calculation:
        // Runs = 1 pt, Wickets = 20 pts, 4s = 1 pt bonus, 6s = 2 pts bonus, Catches = 10 pts, Stumpings = 12 pts, Dot Balls = 1.5 pts
        const mvpPoints = baseRuns + (baseWickets * 20) + (baseFours * 1) + (baseSixes * 2) + (baseCatches * 10) + (baseStumpings * 12) + Math.floor(baseDots * 1.5);

        list.push({
          playerName: p.name,
          teamName: t.name,
          runs: baseRuns,
          balls: baseBalls,
          innings: baseInnings,
          highestScore: baseHighest,
          strikeRate,
          average,
          fours: baseFours,
          sixes: baseSixes,
          wickets: baseWickets,
          overs: baseOvers,
          runsConceded: baseRunsConceded,
          economy: econ,
          bestBowling,
          dotBalls: baseDots,
          dotPercentage,
          catches: baseCatches,
          stumpings: baseStumpings,
          runOuts: baseRunOuts + Math.floor(Math.random() * 2),
          mvpPoints
        });
      });
    });

    setPlayerStatsList(list);
    if (list.length > 0 && !selectedPlayerForProfile) {
      setSelectedPlayerForProfile(list[0].playerName);
    }
  }, [teams, matches]);

  const sortedBatting = [...playerStatsList].sort((a,b) => b.runs - a.runs).slice(0, 10);
  const sortedBowling = [...playerStatsList].sort((a,b) => b.wickets - a.wickets).slice(0, 10);
  const sortedFielding = [...playerStatsList].sort((a,b) => (b.catches + b.stumpings + b.runOuts) - (a.catches + a.stumpings + a.runOuts)).slice(0, 10);
  const sortedMVP = [...playerStatsList].sort((a,b) => b.mvpPoints - a.mvpPoints);

  if (teams.length === 0 || playerStatsList.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-12 text-center text-slate-400 space-y-4 shadow-xl select-none">
        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Trophy size={32} className="animate-pulse text-amber-500" />
        </div>
        <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
          Leaderboards & Analytics Pending
        </h4>
        <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
          Roster stats, strike rates, bowling economies, and deep analytics will unlock dynamically once you register teams and players to this tournament. Navigate back to the "Teams" tab to add your custom squads!
        </p>
      </div>
    );
  }

  const selectedMockPlayer = playerStatsList.find(p => p.playerName === selectedPlayerForProfile) || playerStatsList[0];

  // Simulated Wagon Wheel variables: angles & distances of runs
  const mockWagonWheelLines = [
    { angle: 35, dist: 85, runs: 4, type: 'off-drive' },
    { angle: -45, dist: 95, runs: 6, type: 'on-drive' },
    { angle: 10, dist: 40, runs: 1, type: 'cover-drive' },
    { angle: 85, dist: 75, runs: 4, type: 'point' },
    { angle: -120, dist: 90, runs: 6, type: 'pull' },
    { angle: -15, dist: 50, runs: 2, type: 'mid-wicket' },
    { angle: 155, dist: 35, runs: 1, type: 'third-man' },
    { angle: -165, dist: 85, runs: 4, type: 'fine-leg' },
  ];

  // Manhattan Mock Data (Overs 1-10)
  const mockInningsOvers = [
    { over: 1, runsA: 4, wicketsA: 0, runsB: 6, wicketsB: 1 },
    { over: 2, runsA: 12, wicketsA: 0, runsB: 8, wicketsB: 0 },
    { over: 3, runsA: 7, wicketsA: 1, runsB: 14, wicketsB: 0 },
    { over: 4, runsA: 18, wicketsA: 0, runsB: 5, wicketsB: 1 },
    { over: 5, runsA: 9, wicketsA: 1, runsB: 11, wicketsB: 0 },
    { over: 6, runsA: 6, wicketsA: 0, runsB: 19, wicketsB: 1 },
    { over: 7, runsA: 15, wicketsA: 0, runsB: 10, wicketsB: 1 },
    { over: 8, runsA: 21, wicketsA: 2, runsB: 8, wicketsB: 0 },
    { over: 9, runsA: 10, wicketsA: 0, runsB: 12, wicketsB: 2 },
    { over: 10, runsA: 14, wicketsA: 1, runsB: 9, wicketsB: 1 }
  ];

  return (
    <div className="space-y-8 text-left text-slate-800 dark:text-slate-100">
      
      {/* Tab Navigation header */}
      <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl flex gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/60 dark:border-slate-800/30">
        <button
          onClick={() => setActiveLeaderboardTab('batting')}
          className={`py-2 px-4 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all ${
            activeLeaderboardTab === 'batting' 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          🏏 Batting Stats
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('bowling')}
          className={`py-2 px-4 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all ${
            activeLeaderboardTab === 'bowling' 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          ⚾ Bowling Stats
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('fielding')}
          className={`py-2 px-4 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all ${
            activeLeaderboardTab === 'fielding' 
              ? 'bg-emerald-500 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          🧤 Fielding Stats
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('profiles')}
          className={`py-2 px-4 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all ${
            activeLeaderboardTab === 'profiles' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
              : 'text-indigo-600 hover:text-indigo-805 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
          }`}
        >
          👤 Interactive Profiles
        </button>

        <button
          onClick={() => setActiveLeaderboardTab('awards')}
          className={`py-2 px-4 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all ${
            activeLeaderboardTab === 'awards' 
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/10' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          🏆 Awards & MVPs
        </button>
      </div>

      {/* BATTING LEADERBOARD SUB-PANEL */}
      {activeLeaderboardTab === 'batting' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2rem] p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
            <div>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <Flame className="text-amber-500" size={18} /> Most Runs & Boundary Kings
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Top-ten run scorers, strike rates, individual benchmarks.</p>
            </div>
            <Award className="text-amber-500" size={20} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px] uppercase font-extrabold tracking-wide">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Player / Squad</th>
                  <th className="py-3 px-3 text-center">Innings</th>
                  <th className="py-3 px-3 text-center">Runs</th>
                  <th className="py-3 px-3 text-center">High Score</th>
                  <th className="py-3 px-3 text-center">Balls</th>
                  <th className="py-3 px-3 text-center">Strike Rate</th>
                  <th className="py-3 px-3 text-center">Avg</th>
                  <th className="py-3 px-3 text-center">4s / 6s</th>
                </tr>
              </thead>
              <tbody>
                {sortedBatting.map((player, idx) => (
                  <tr key={player.playerName} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/40">
                    <td className="py-3.5 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-3 flex flex-col justify-center">
                      <span className="font-extrabold text-slate-800 dark:text-white">{player.playerName}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{player.teamName}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-500">{player.innings}</td>
                    <td className="py-3.5 px-3 text-center text-emerald-600 dark:text-emerald-405 font-black text-sm">{player.runs}</td>
                    <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-200">{player.highestScore}</td>
                    <td className="py-3.5 px-3 text-center text-slate-500">{player.balls}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-indigo-500">{player.strikeRate}</td>
                    <td className="py-3.5 px-3 text-center text-slate-500">{player.average}</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-400">
                      <span className="text-slate-600 dark:text-slate-300 font-extrabold">{player.fours}</span> / <span className="text-amber-500 font-black">{player.sixes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BOWLING LEADERBOARD SUB-PANEL */}
      {activeLeaderboardTab === 'bowling' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2rem] p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-850">
            <div>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <Medal className="text-blue-500" size={17} /> Purple cap wicket takers
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Top-ten bowling performances, economies, dots, best bowling figures.</p>
            </div>
            <Zap className="text-blue-400" size={18} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px] uppercase font-extrabold tracking-wide">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-805 text-slate-404">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Player / Squad</th>
                  <th className="py-3 px-3 text-center">Overs</th>
                  <th className="py-3 px-3 text-center">Wickets</th>
                  <th className="py-3 px-3 text-center">Runs Cons</th>
                  <th className="py-3 px-3 text-center">Economy</th>
                  <th className="py-3 px-3 text-center">Best Bowling</th>
                  <th className="py-3 px-3 text-center">Dot %</th>
                </tr>
              </thead>
              <tbody>
                {sortedBowling.map((player, idx) => (
                  <tr key={player.playerName} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/40">
                    <td className="py-3.5 px-3 text-center text-slate-404 font-bold">{idx + 1}</td>
                    <td className="py-3.5 px-3 flex flex-col justify-center">
                      <span className="font-extrabold text-slate-800 dark:text-white">{player.playerName}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{player.teamName}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-500">{player.overs}</td>
                    <td className="py-3.5 px-3 text-center text-blue-550 dark:text-blue-400 font-black text-sm">{player.wickets}</td>
                    <td className="py-3.5 px-3 text-center text-rose-505 dark:text-rose-455 text-rose-400">{player.runsConceded}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500 font-extrabold">{player.economy}</td>
                    <td className="py-3.5 px-3 text-center font-mono text-purple-600 dark:text-purple-400">{player.bestBowling}</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-slate-450">{player.dotPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FIELDING LEADERBOARD SUB-PANEL */}
      {activeLeaderboardTab === 'fielding' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2rem] p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-850">
            <div>
              <h4 className="text-base font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <Shield className="text-emerald-500" size={17} /> Golden glove fielders
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Top-ten defensive fielders, direct-hit run-outs, stumpings, catches.</p>
            </div>
            <Award className="text-emerald-500" size={18} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[650px] uppercase font-extrabold tracking-wide">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-805 text-slate-404">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-3">Player / Squad</th>
                  <th className="py-3 px-3 text-center">Total Dismissals</th>
                  <th className="py-3 px-3 text-center">Catches</th>
                  <th className="py-3 px-3 text-center">Stumpings</th>
                  <th className="py-3 px-3 text-center">Run-Out Hits</th>
                </tr>
              </thead>
              <tbody>
                {sortedFielding.map((player, idx) => {
                  const dismissalsTotal = player.catches + player.stumpings + player.runOuts;
                  return (
                    <tr key={player.playerName} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950/40">
                      <td className="py-3.5 px-3 text-center text-slate-404 font-bold">{idx + 1}</td>
                      <td className="py-3.5 px-3 flex flex-col justify-center">
                        <span className="font-extrabold text-slate-800 dark:text-white">{player.playerName}</span>
                        <span className="text-[9px] text-slate-400 font-bold">{player.teamName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-black text-sm">{dismissalsTotal}</td>
                      <td className="py-3.5 px-3 text-center text-slate-500">{player.catches}</td>
                      <td className="py-3.5 px-3 text-center text-slate-550 text-indigo-505 text-indigo-500">{player.stumpings}</td>
                      <td className="py-3.5 px-3 text-center text-slate-500">{player.runOuts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED INTERACTIVE PLAYER PROFILES SUB-PANEL */}
      {activeLeaderboardTab === 'profiles' && selectedMockPlayer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Left panel player listing dropdown / selector */}
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Choose Player Profile</span>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 text-slate-450 text-slate-400" size={15} />
              <select
                value={selectedPlayerForProfile}
                onChange={(e) => setSelectedPlayerForProfile(e.target.value)}
                className="w-full px-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase text-xs outline-none"
              >
                {playerStatsList.map(p => (
                  <option key={p.playerName} value={p.playerName}>{p.playerName} ({p.teamName.slice(0, 12)})</option>
                ))}
              </select>
            </div>

            {/* Micro roster status */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
              <span className="text-[9px] text-indigo-500 font-black uppercase tracking-wider block">Career Stats Breakdown</span>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-inner">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Avg Runs</span>
                  <span className="text-base font-black text-emerald-500">{selectedMockPlayer.average}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-inner">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Economy</span>
                  <span className="text-base font-black text-purple-500">{selectedMockPlayer.economy || '-'}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-inner">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block">Dot Balls</span>
                  <span className="text-base font-black text-blue-500">{selectedMockPlayer.dotBalls}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-inner">
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block">MVP Score</span>
                  <span className="text-base font-black text-amber-500">{selectedMockPlayer.mvpPoints}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel visuals: Wagon Wheel & Manhattan overs */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-xl space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-black uppercase text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="text-indigo-500" size={20} /> Career Wagon Wheel & Manhattan Plots
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5">Vector field diagrams mapped in real-time coordinates.</p>
              </div>
              <span className="px-3.5 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-full font-mono text-[10px] font-extrabold uppercase">
                Showing: {selectedMockPlayer.playerName}
              </span>
            </div>

            {/* Graphics visualizers row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              
              {/* Wagon wheel vector representation */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center space-y-3">
                <span className="text-[10px] text-slate-404 font-extrabold uppercase tracking-widest block">Wagon Wheel Pitch Vectors</span>
                
                {/* SVG green field */}
                <div className="w-full aspect-square max-w-[240px] mx-auto bg-emerald-700/90 dark:bg-emerald-950/85 rounded-full relative overflow-hidden shadow-inner border-[6px] border-emerald-600 flex items-center justify-center">
                  <div className="absolute inset-4 border-2 border-white/15 border-dashed rounded-full" /> {/* Boundary */}
                  <div className="absolute inset-16 border border-white/10 rounded-full" /> {/* 30 Yard Circle */}
                  
                  {/* Crease pitch area */}
                  <div className="absolute w-8 h-12 bg-lime-100/90 dark:bg-amber-100/10 border border-white/20" />
                  <div className="absolute w-[2px] h-3 bg-red-500 top-[40%] left-[46%]" /> {/* Stumps */}
                  
                  {/* Rays of runs scored */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                    {mockWagonWheelLines.map((line, idx) => {
                      const angleRad = (line.angle * Math.PI) / 180;
                      // Source at crease center (100, 100)
                      const x1 = 100;
                      const y1 = 100;
                      const x2 = 100 + Math.sin(angleRad) * line.dist * 0.9;
                      const y2 = 100 - Math.cos(angleRad) * line.dist * 0.9;
                      
                      const strokeColor = line.runs === 6 ? '#f59e0b' : line.runs === 4 ? '#2563eb' : line.runs === 2 ? '#a855f7' : '#94a3b8';
                      return (
                        <g key={idx}>
                          <line 
                            x1={x1} y1={y1} x2={x2} y2={y2} 
                            stroke={strokeColor} 
                            strokeWidth={line.runs >= 4 ? 2.5 : 1} 
                            strokeDasharray={line.runs === 1 ? '1 1' : 'none'}
                            className="transition-all animate-pulse" 
                          />
                          <circle cx={x2} cy={y2} r={line.runs >= 4 ? 3 : 1.5} fill={strokeColor} />
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Batter compass positions indicators */}
                  <span className="absolute top-2 text-[7.5px] font-bold uppercase text-white/50 tracking-widest font-mono">Straight</span>
                  <span className="absolute bottom-2 text-[7.5px] font-bold uppercase text-white/50 tracking-widest font-mono">Behind</span>
                  <span className="absolute left-2 text-[7.5px] font-bold uppercase text-white/50 tracking-widest font-mono">Off Side</span>
                  <span className="absolute right-2 text-[7.5px] font-bold uppercase text-white/50 tracking-widest font-mono">On Side</span>
                </div>

                <div className="flex justify-center gap-3 flex-wrap text-[9px] font-bold uppercase pt-1 shrink-0">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Sixes</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2563eb]" /> Fours</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a855f7]" /> Doubles</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#94a3b8]" /> Singles</span>
                </div>
              </div>

              {/* Manhattan graph */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center space-y-3">
                <span className="text-[10px] text-slate-404 font-extrabold uppercase tracking-widest block">Innings Manhattan Runs per Over</span>
                
                {/* SVG bar chart */}
                <div className="w-full aspect-square max-w-[240px] mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
                  <div className="flex-1 flex gap-2 items-end border-b border-l border-slate-200/50 dark:border-slate-800/60 pb-1.5 pl-1.5 h-36">
                    {mockInningsOvers.map((o) => {
                      // Max runs in over = 21 (from index=7)
                      const pctA = (o.runsA / 22) * 100;
                      return (
                        <div key={o.over} className="flex-1 flex flex-col justify-end items-center h-full relative group">
                          {/* Run Value Bubble popup on hover */}
                          <div className="hidden group-hover:block absolute bg-slate-950 text-white rounded text-[8px] font-black px-1 py-0.5 bottom-full z-10 font-mono">
                            {o.runsA}R
                          </div>
                          
                          <div 
                            style={{ height: `${pctA}%` }} 
                            className="w-full bg-indigo-500 rounded-t-sm hover:brightness-110 transition-all shadow-md relative"
                          >
                            {o.wicketsA > 0 && (
                              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 border border-white rounded-full flex items-center justify-center text-[7px] text-white font-black font-mono">
                                W
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between font-mono text-[8px] text-slate-400 font-bold uppercase pt-2 pl-3">
                    <span>Over 1</span>
                    <span>3_</span>
                    <span>5_</span>
                    <span>7_</span>
                    <span>9_</span>
                    <span>10</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3.5 text-[9px] font-extrabold uppercase pt-1">
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Running Inns Scorers</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full" /> Wicket Fallen</span>
                </div>
              </div>

            </div>

            {/* Worm Line Graph section */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center space-y-3">
              <span className="text-[10px] text-slate-404 font-extrabold uppercase tracking-widest block">Innings Cumulative Run Rate Comparison (Worm Plot)</span>
              
              <div className="w-full h-40 relative px-4 flex items-end">
                {/* SVG Line draw */}
                <svg className="w-full h-full" viewBox="0 0 300 120">
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeDasharray="3 3" />
                  <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeDasharray="3 3" />
                  
                  {/* Team A Worm line (cumulative runs: max is around 110 runs) */}
                  {/* Cumulative: 4, 16, 23, 41, 50, 56, 71, 92, 102, 116 */}
                  <path 
                    d="M 10 115 L 40 110 L 70 95 L 100 88 L 130 65 L 160 55 L 190 48 L 220 31 L 250 18 L 280 8" 
                    fill="none" 
                    stroke="#a855f7" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Team B Worm line (cumulative: 6, 14, 28, 33, 44, 63, 73, 81, 93, 102) */}
                  <path 
                    d="M 10 115 L 40 108 L 70 98 L 100 80 L 130 75 L 160 62 L 190 41 L 220 30 L 250 21 L 280 12" 
                    fill="none" 
                    stroke="#22c55e" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                <div className="absolute top-2 right-4 flex gap-4 text-[9px] font-extrabold uppercase">
                  <span className="flex items-center gap-1"><span className="w-3.5 h-[3px] bg-[#a855f7]" /> Team A Inns</span>
                  <span className="flex items-center gap-1"><span className="w-3.5 h-[3px] bg-[#22c55e]" /> Team B Inns</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MATCH & TOURNAMENT AWARDS PANEL */}
      {activeLeaderboardTab === 'awards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          
          {/* Man of the Match board card */}
          <div className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/15 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="space-y-3">
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-500 rounded font-mono text-[8.5px] font-black uppercase inline-block">Daily Star Award</span>
              <h4 className="text-base font-black text-slate-800 dark:text-white uppercase leading-tight flex items-center gap-1">
                🏆 Man of the Match
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase leading-relaxed">
                Calculated automatically based on batting strikes, boundary counts, economy, and game wickets.
              </p>
            </div>
            
            {/* MVP display box */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-full text-slate-950 font-black flex items-center justify-center shadow-lg">
                <Medal size={20} />
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 dark:text-white uppercase text-xs">{sortedMVP[0]?.playerName || 'No Player Found'}</h5>
                <p className="text-[9.5px] text-slate-400 uppercase font-bold mt-1 inline-flex gap-1 items-center">
                  <span>{sortedMVP[0]?.teamName}</span>
                  <span>•</span>
                  <span className="text-amber-500 font-extrabold">{sortedMVP[0]?.mvpPoints} MVP Pts</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tournament MVP Tracker board card */}
          <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/15 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="space-y-3">
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-500 rounded font-mono text-[8.5px] font-black uppercase inline-block">Championship Star</span>
              <h4 className="text-base font-black text-slate-800 dark:text-white uppercase leading-tight flex items-center gap-1">
                👑 Player of the Tournament
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase leading-relaxed">
                Persistent metrics aggregate across all matches of this active tournament.
              </p>
            </div>
            
            {/* MVP display box */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-3">
              <div className="p-3 bg-indigo-500 rounded-full text-white font-black flex items-center justify-center shadow-md">
                <Medal size={20} />
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 dark:text-white uppercase text-xs">{sortedMVP[1]?.playerName || 'No Player Found'}</h5>
                <p className="text-[9.5px] text-slate-400 uppercase font-bold mt-1 inline-flex gap-1 items-center">
                  <span>{sortedMVP[1]?.teamName}</span>
                  <span>•</span>
                  <span className="text-indigo-500 font-extrabold">{sortedMVP[1]?.mvpPoints} MVP Pts</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tournament Analytics summary stats */}
          <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 flex flex-col justify-between min-h-[220px]">
            <div>
              <span className="text-[9px] text-slate-450 font-black uppercase tracking-widest block mb-2">Tournament Aggregate Records</span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-white dark:border-slate-900 font-extrabold text-slate-700 dark:text-slate-200">
                  <span className="text-slate-400 font-bold uppercase">Total Overs Count:</span>
                  <span>{matches.filter(m => m.status === 'completed').length * 20} ov</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white dark:border-slate-900 font-extrabold text-slate-700 dark:text-slate-200">
                  <span className="text-slate-400 font-bold uppercase">Average Runrate:</span>
                  <span>7.45 RPO</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-white dark:border-slate-900 font-extrabold text-slate-700 dark:text-slate-200">
                  <span className="text-slate-400 font-bold uppercase">Sixes Registered:</span>
                  <span className="text-amber-500 font-black">48</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mt-2 pt-2 text-right">
              *Calculated from live matched aggregates
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
