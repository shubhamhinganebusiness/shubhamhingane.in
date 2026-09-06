import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Plus, Edit, Trash2, HelpCircle, 
  RefreshCw, Check, Info, Flame, Save, X, Play,
  TrendingUp, Compass, PlusCircle, Sparkles, AlertCircle
} from 'lucide-react';

// Team Interface for Points Table Sandbox
export interface PointsTableTeam {
  id: string;
  name: string;
  shortName: string;
  logoColor: string; // Tailwind gradient/color class (e.g., 'from-blue-600 to-indigo-600')
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  runsScored: number;
  oversFaced: number;  // Represented in standard XX.Y cricket format (e.g. 138.2 means 138 overs & 2 balls)
  runsConceded: number;
  oversBowled: number; // Represented in standard XX.Y cricket format
  points: number;
  NRR: number;
}

// Simulated Match Log Interface 
export interface SimulatedMatch {
  id: string;
  teamAName: string;
  teamBName: string;
  scoreA: string; // e.g., "184/5"
  scoreB: string; // e.g., "185/3"
  oversA: number; // e.g. 20.0
  oversB: number; // e.g. 19.2
  resultText: string;
}

// Preset IPL-style teams with realistic stat spreads
const PRESET_TEAMS: PointsTableTeam[] = [
  {
    id: 'pt-mi',
    name: 'Mumbai Indians',
    shortName: 'MI',
    logoColor: 'from-blue-500 to-indigo-700',
    played: 7,
    won: 5,
    lost: 2,
    tied: 0,
    noResult: 0,
    runsScored: 1240,
    oversFaced: 138.2, // 138 overs and 2 balls = 830 balls = 138.333 overs
    runsConceded: 1150,
    oversBowled: 140.0, // 140 overs = 840 balls = 140.0 overs
    points: 10,
    NRR: 0.749, // Calculated as (1240 / 138.333) - (1150 / 140.0) = 8.964 - 8.214 = +0.750
  },
  {
    id: 'pt-csk',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    logoColor: 'from-yellow-400 to-amber-500',
    played: 7,
    won: 4,
    lost: 2,
    tied: 0,
    noResult: 1,
    runsScored: 1195,
    oversFaced: 120.0, // 120.0 overs faced
    runsConceded: 1120,
    oversBowled: 119.4, // 119 overs and 4 balls = 718 balls = 119.667 overs
    points: 9,
    NRR: 0.599, // (1195/120) - (1120/119.667) = 9.958 - 9.359 = +0.599
  },
  {
    id: 'pt-rcb',
    name: 'Royal Challengers Bengaluru',
    shortName: 'RCB',
    logoColor: 'from-red-600 to-rose-850',
    played: 7,
    won: 3,
    lost: 3,
    tied: 1,
    noResult: 0,
    runsScored: 1210,
    oversFaced: 137.4, // 137 overs and 4 balls = 826 balls = 137.667 overs
    runsConceded: 1180,
    oversBowled: 136.1, // 136 overs and 1 ball = 817 balls = 136.167 overs
    points: 7,
    NRR: 0.123, // (1210/137.667) - (1180/136.167) = 8.789 - 8.666 = +0.123
  },
  {
    id: 'pt-kkr',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    logoColor: 'from-purple-600 to-fuchsia-900',
    played: 7,
    won: 3,
    lost: 4,
    tied: 0,
    noResult: 0,
    runsScored: 1180,
    oversFaced: 140.0,
    runsConceded: 1195,
    oversBowled: 138.2, // 138.333 overs
    points: 6,
    NRR: -0.210, // (1180/140.0) - (1195/138.333) = 8.428 - 8.638 = -0.210
  },
  {
    id: 'pt-dc',
    name: 'Delhi Capitals',
    shortName: 'DC',
    logoColor: 'from-sky-500 to-blue-600',
    played: 7,
    won: 2,
    lost: 4,
    tied: 0,
    noResult: 1,
    runsScored: 1085,
    oversFaced: 118.5, // 118 overs and 5 balls = 713 balls = 118.833 overs
    runsConceded: 1160,
    oversBowled: 120.0,
    points: 5,
    NRR: -0.536, // (1085/118.833) - (1160/120.0) = 9.130 - 9.667 = -0.537
  },
  {
    id: 'pt-gt',
    name: 'Gujarat Titans',
    shortName: 'GT',
    logoColor: 'from-slate-705 to-slate-900',
    played: 7,
    won: 1,
    lost: 6,
    tied: 0,
    noResult: 0,
    runsScored: 1020,
    oversFaced: 140.0,
    runsConceded: 1220,
    oversBowled: 135.5, // 135.833 overs
    points: 2,
    NRR: -1.696, // (1020/140.0) - (1220/135.833) = 7.286 - 8.982 = -1.696
  }
];

export const PointsTableModule: React.FC = () => {
  // Main states
  const [teams, setTeams] = useState<PointsTableTeam[]>(() => {
    const saved = localStorage.getItem('cricket_sandbox_points_table');
    return saved ? JSON.parse(saved) : PRESET_TEAMS;
  });

  const [matches, setMatches] = useState<SimulatedMatch[]>(() => {
    const saved = localStorage.getItem('cricket_sandbox_matches');
    return saved ? JSON.parse(saved) : [];
  });

  // UI management states
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<PointsTableTeam | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Match Simulation Setup State
  const [matchTeamAId, setMatchTeamAId] = useState('');
  const [matchTeamBId, setMatchTeamBId] = useState('');
  
  const [scoreARuns, setScoreARuns] = useState('160');
  const [scoreAWickets, setScoreAWickets] = useState('4');
  const [scoreAOvers, setScoreAOvers] = useState('20.0');

  const [scoreBRuns, setScoreBRuns] = useState('155');
  const [scoreBWickets, setScoreBWickets] = useState('7');
  const [scoreBOvers, setScoreBOvers] = useState('20.0');

  const [matchModifier, setMatchModifier] = useState<'normal' | 'tie' | 'nr'>('normal');

  // Custom Add Team State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamShort, setNewTeamShort] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('from-indigo-500 to-purple-600');

  // Trigger brief alert notification
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Persist storage whenever collections change
  useEffect(() => {
    localStorage.setItem('cricket_sandbox_points_table', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('cricket_sandbox_matches', JSON.stringify(matches));
  }, [matches]);

  // HELPER RULES FOR CRICKET FRACTIONAL OVERS
  // Converts over representation (e.g., 18.2) to mathematically accurate decimals (e.g., 18.333)
  const calculateOversDecimal = (oversRepresentation: number): number => {
    const completedOvers = Math.floor(oversRepresentation);
    const subBalls = Math.round((oversRepresentation - completedOvers) * 10);
    const normalizedBalls = Math.min(Math.max(subBalls, 0), 5); // Must be 0 to 5 balls
    return completedOvers + (normalizedBalls / 6);
  };

  // Updates NRR and Points for a team based on raw metrics
  const recalculateIndividualStats = (team: PointsTableTeam): PointsTableTeam => {
    // Points calculation: Win = 2, Tie/NR = 1, Loss = 0
    const calculatedPoints = (team.won * 2) + ((team.tied + team.noResult) * 1);
    
    // NRR calculation: (runsScored / oversFaced) - (runsConceded / oversBowled)
    const oversFacedDecimal = calculateOversDecimal(team.oversFaced);
    const oversBowledDecimal = calculateOversDecimal(team.oversBowled);

    const runRateScored = oversFacedDecimal > 0 ? (team.runsScored / oversFacedDecimal) : 0;
    const runRateConceded = oversBowledDecimal > 0 ? (team.runsConceded / oversBowledDecimal) : 0;
    const calculatedNRR = Number((runRateScored - runRateConceded).toFixed(3));

    return {
      ...team,
      points: calculatedPoints,
      NRR: calculatedNRR
    };
  };

  // Global recalculate & sort runner
  const updateAndSortTeams = (updatedList: PointsTableTeam[]) => {
    const listWithRecalculations = updatedList.map(t => recalculateIndividualStats(t));
    
    // IPL Standard Sorting Rules:
    // 1. Points (Pts) descending
    // 2. Won matches (W) descending
    // 3. Net Run Rate (NRR) descending
    // 4. Team Name alphabetically
    const sorted = [...listWithRecalculations].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      if (b.NRR !== a.NRR) return b.NRR - a.NRR;
      return a.name.localeCompare(b.name);
    });

    setTeams(sorted);
  };

  // Preset Restorer
  const restorePresets = () => {
    if (window.confirm('This will overwrite current edits and load 6 premium T20 teams with live realistic stats. Proceed?')) {
      setTeams(PRESET_TEAMS);
      setMatches([]);
      triggerNotification('Sample tournament preset data loaded successfully!');
    }
  };

  const wipeAllData = () => {
    if (window.confirm('Wipe all teams and entries to start a completely fresh league?')) {
      setTeams([]);
      setMatches([]);
      triggerNotification('All data wiped. Create your first custom squad below!');
    }
  };

  // Add Custom Team Action
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !newTeamShort.trim()) {
      alert('Please fill out all name elements.');
      return;
    }

    const collision = teams.some(t => t.name.toLowerCase() === newTeamName.trim().toLowerCase() || t.shortName.toLowerCase() === newTeamShort.trim().toLowerCase());
    if (collision) {
      alert('A team with this Name or Short abbreviation already exists.');
      return;
    }

    const brandNew: PointsTableTeam = {
      id: `pt-custom-${Date.now()}`,
      name: newTeamName.trim(),
      shortName: newTeamShort.trim().toUpperCase(),
      logoColor: newTeamColor,
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
      NRR: 0.000
    };

    updateAndSortTeams([...teams, brandNew]);
    setNewTeamName('');
    setNewTeamShort('');
    setShowAddTeamModal(false);
    triggerNotification(`Squad "${brandNew.name}" added structure successfully!`);
  };

  // Raw Stat Editing Actions
  const handleSaveRawStats = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    // Direct sanity check
    const totalCalcPlayed = editingTeam.won + editingTeam.lost + editingTeam.tied + editingTeam.noResult;
    if (totalCalcPlayed !== editingTeam.played) {
      if (!window.confirm(`Warning: Calculated match count (${totalCalcPlayed}) doesn't equal Matches Played (${editingTeam.played}). Save anyway?`)) {
        return;
      }
    }

    // Overs validation: sub-decimal cannot exceed .5
    const getBalls = (overs: number) => Math.round((overs - Math.floor(overs)) * 10);
    if (getBalls(editingTeam.oversFaced) > 5 || getBalls(editingTeam.oversBowled) > 5) {
      alert('Error: Cricket overs notation must have balls count between 0 and 5! (e.g., 19.5 or 20.0, never 19.6 or 19.8)');
      return;
    }

    const updated = teams.map(t => t.id === editingTeam.id ? editingTeam : t);
    updateAndSortTeams(updated);
    setEditingTeam(null);
    triggerNotification(`Manual adjustments for ${editingTeam.name} committed successfully!`);
  };

  // Delete squad safely
  const handleDeleteTeam = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to completely remove "${name}" from this points table?`)) {
      const filtered = teams.filter(t => t.id !== id);
      updateAndSortTeams(filtered);
      triggerNotification(`Removed ${name} from tournament scoreboard.`);
    }
  };

  // Simulate an individualized game & back-calculate both standings automatically!
  const handleRegisterSimulatedMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchTeamAId || !matchTeamBId) {
      alert('Select two different teams to proceed.');
      return;
    }
    if (matchTeamAId === matchTeamBId) {
      alert('A team cannot play a match against itself!');
      return;
    }

    const runsA = parseInt(scoreARuns) || 0;
    const runsB = parseInt(scoreBRuns) || 0;
    const ovA = parseFloat(scoreAOvers) || 20.0;
    const ovB = parseFloat(scoreBOvers) || 20.0;

    // Check overs balls integrity
    const getBalls = (overs: number) => Math.round((overs - Math.floor(overs)) * 10);
    if (getBalls(ovA) > 5 || getBalls(ovB) > 5) {
      alert('In overs input, the fractional ball count cannot exceed .5 (e.g. 19.5 is standard, use 20.0 for 20 overs).');
      return;
    }

    const teamA = teams.find(t => t.id === matchTeamAId);
    const teamB = teams.find(t => t.id === matchTeamBId);

    if (!teamA || !teamB) return;

    // Setup updated objects
    let updatedA = { ...teamA };
    let updatedB = { ...teamB };

    updatedA.played += 1;
    updatedB.played += 1;

    // Increments Runs and Overs
    updatedA.runsScored += runsA;
    updatedA.runsConceded += runsB;
    updatedB.runsScored += runsB;
    updatedB.runsConceded += runsA;

    // To add fractional overs correctly, we convert to balls, sum them up, and convert back!
    const addOvers = (existingOvers: number, addedOvers: number): number => {
      const getBallsCount = (ov: number) => {
        const full = Math.floor(ov);
        const fraction = Math.round((ov - full) * 10);
        return (full * 6) + Math.min(fraction, 5);
      };
      const totalBalls = getBallsCount(existingOvers) + getBallsCount(addedOvers);
      const outputOvers = Math.floor(totalBalls / 6);
      const remainingBalls = totalBalls % 6;
      return Number(`${outputOvers}.${remainingBalls}`);
    };

    updatedA.oversFaced = addOvers(teamA.oversFaced, ovA);
    updatedA.oversBowled = addOvers(teamA.oversBowled, ovB);

    updatedB.oversFaced = addOvers(teamB.oversFaced, ovB);
    updatedB.oversBowled = addOvers(teamB.oversBowled, ovA);

    let resultMsg = '';
    if (matchModifier === 'tie') {
      updatedA.tied += 1;
      updatedB.tied += 1;
      resultMsg = `Match Tied between ${teamA.name} and ${teamB.name}!`;
    } else if (matchModifier === 'nr') {
      updatedA.noResult += 1;
      updatedB.noResult += 1;
      resultMsg = `Match abandoned - No Result between ${teamA.name} and ${teamB.name}`;
    } else {
      // Normal Win/Loss based on runs scored
      if (runsA > runsB) {
        updatedA.won += 1;
        updatedB.lost += 1;
        resultMsg = `${teamA.name} won by ${runsA - runsB} runs!`;
      } else if (runsB > runsA) {
        updatedB.won += 1;
        updatedA.lost += 1;
        resultMsg = `${teamB.name} won by ${runsB - runsA} runs or wickets equivalent.`;
      } else {
        // Equal runs but designated as normal outcome defaults to a Tie
        updatedA.tied += 1;
        updatedB.tied += 1;
        resultMsg = `Scores level! Match ended in a thrilling Tie.`;
      }
    }

    // Add match to log
    const matchLog: SimulatedMatch = {
      id: `match-${Date.now()}`,
      teamAName: teamA.name,
      teamBName: teamB.name,
      scoreA: `${runsA}/${scoreAWickets} (${ovA} ov)`,
      scoreB: `${runsB}/${scoreBWickets} (${ovB} ov)`,
      oversA: ovA,
      oversB: ovB,
      resultText: resultMsg
    };

    setMatches([matchLog, ...matches]);

    // Push calculation & recalculate sorting
    const modifiedTeams = teams.map(t => {
      if (t.id === matchTeamAId) return updatedA;
      if (t.id === matchTeamBId) return updatedB;
      return t;
    });

    updateAndSortTeams(modifiedTeams);

    // Reset simulator inputs briefly
    setMatchTeamAId('');
    setMatchTeamBId('');
    setMatchModifier('normal');
    triggerNotification(`Simulated match recorded: ${resultMsg}`);
  };

  // Run a quick randomized tournament match between random teams to show real-time transitions!
  const runRandomSimulation = () => {
    if (teams.length < 2) {
      alert('You need at least 2 teams created to simulate a match.');
      return;
    }

    // Select two random indices
    let idxA = Math.floor(Math.random() * teams.length);
    let idxB = Math.floor(Math.random() * teams.length);
    while (idxA === idxB) {
      idxB = Math.floor(Math.random() * teams.length);
    }

    const teamA = teams[idxA];
    const teamB = teams[idxB];

    // Generate random scores
    const overs = 20;
    // Weighted randomized runs
    const runsA = Math.floor(Math.random() * 80) + 120; // 120 to 200 runs
    const runsB = Math.floor(Math.random() * 85) + 115; // 115 to 200 runs
    const wicketsA = Math.floor(Math.random() * 8) + 2; 
    const wicketsB = Math.floor(Math.random() * 8) + 2; 

    // Generate accurate overs faced. Overs can end early if wickets = 10 (all out)
    const oversAVal = wicketsA === 10 ? Number((Math.floor(Math.random() * 5) + 14).toFixed(0)) + (Math.floor(Math.random() * 6) / 10) : 20.0;
    const oversBVal = wicketsB === 10 ? Number((Math.floor(Math.random() * 5) + 14).toFixed(0)) + (Math.floor(Math.random() * 6) / 10) : 20.0;

    // Simulate!
    let updatedA = { ...teamA };
    let updatedB = { ...teamB };

    updatedA.played += 1;
    updatedB.played += 1;

    updatedA.runsScored += runsA;
    updatedA.runsConceded += runsB;
    updatedB.runsScored += runsB;
    updatedB.runsConceded += runsA;

    const addOvers = (existingOvers: number, addedOvers: number): number => {
      const getBallsCount = (ov: number) => {
        const full = Math.floor(ov);
        const fraction = Math.round((ov - full) * 10);
        return (full * 6) + Math.min(fraction, 5);
      };
      const totalBalls = getBallsCount(existingOvers) + getBallsCount(addedOvers);
      const outputOvers = Math.floor(totalBalls / 6);
      const remainingBalls = totalBalls % 6;
      return Number(`${outputOvers}.${remainingBalls}`);
    };

    updatedA.oversFaced = addOvers(teamA.oversFaced, oversAVal);
    updatedA.oversBowled = addOvers(teamA.oversBowled, oversBVal);

    updatedB.oversFaced = addOvers(teamB.oversFaced, oversBVal);
    updatedB.oversBowled = addOvers(teamB.oversBowled, oversAVal);

    let outcome = '';
    // Decide winner
    if (runsA > runsB) {
      updatedA.won += 1;
      updatedB.lost += 1;
      outcome = `${teamA.name} beat ${teamB.name} by ${runsA - runsB} runs!`;
    } else if (runsB > runsA) {
      updatedB.won += 1;
      updatedA.lost += 1;
      outcome = `${teamB.name} chased down ${teamA.name} with ${10 - wicketsB} wickets remaining!`;
    } else {
      updatedA.tied += 1;
      updatedB.tied += 1;
      outcome = `Thrilling Tie! Standard points shared between ${teamA.name} and ${teamB.name}.`;
    }

    const matchLog: SimulatedMatch = {
      id: `match-${Date.now()}`,
      teamAName: teamA.name,
      teamBName: teamB.name,
      scoreA: `${runsA}/${wicketsA} (${oversAVal} ov)`,
      scoreB: `${runsB}/${wicketsB} (${oversBVal} ov)`,
      oversA: oversAVal,
      oversB: oversBVal,
      resultText: outcome
    };

    setMatches([matchLog, ...matches]);

    const modifiedList = teams.map(t => {
      if (t.id === teamA.id) return updatedA;
      if (t.id === teamB.id) return updatedB;
      return t;
    });

    updateAndSortTeams(modifiedList);
    triggerNotification(`⚡ Quick Sim Complete: ${teamA.shortName} vs ${teamB.shortName}! ${teamA.shortName} scored ${runsA}, ${teamB.shortName} scored ${runsB}.`);
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      
      {/* Top Banner Alert / Rule Summary */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-transparent border border-slate-205/60 dark:border-slate-800/20 rounded-[1.5rem] sm:rounded-[2rem] p-4.5 sm:p-6 shadow-sm flex flex-col md:flex-row gap-5 items-start justify-between">
        <div className="space-y-1.5 max-w-2xl text-left">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
              Sandbox Live Table
            </span>
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> Fully Custom calculations
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Cricket Points Table & Simulation Module
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Record manual match scores, simulate random fixtures, or directly tweak statistics. Points recalculate automatically (Won = 2, Tie/NR = 1). Net Run Rate (NRR) is compiled strictly according to Standard ICC Cricket equations:
            <span className="block mt-1.5 font-mono text-[10px] sm:text-[11px] bg-slate-100 dark:bg-slate-950 p-2 rounded-lg text-indigo-600 dark:text-indigo-400 font-extrabold select-all">
              NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 md:pt-0 shrink-0 select-none">
          <button
            onClick={restorePresets}
            type="button"
            className="px-3.5 py-2 hover:scale-[1.02] active:scale-[0.98] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all border-none flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RefreshCw size={11} />
            Reset Pre-loads
          </button>
          <button
            onClick={wipeAllData}
            type="button"
            className="px-3.5 py-2 hover:scale-[1.02] active:scale-[0.98] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-450 rounded-xl font-black uppercase text-[10px] tracking-wider transition-all border border-rose-505/10 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Trash2 size={11} />
            Wipe Scoreboard
          </button>
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
              <p className="text-2xs uppercase text-emerald-400 font-black tracking-widest">Real-time Recalculation</p>
              <p className="text-[11px] leading-relaxed text-slate-200 font-semibold">{notification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THREE COLUMN GRID - Table List + Match Recorder + Sim controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
        
        {/* LEFT COLUMN: THE MASTER POINTS TABLE (Cols 8/12 on large screen) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Trophy size={14} className="text-yellow-500" /> Standings Leaderboard ({teams.length} Squads)
            </h3>
            <button
              onClick={() => setShowAddTeamModal(true)}
              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 outline-none text-white border-none rounded-xl font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-md inline-flex items-center gap-1 transition-all"
            >
              <Plus size={12} /> Add Team
            </button>
          </div>

          {/* Table Container Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-4.5 sm:p-6 shadow-xl relative overflow-hidden">
            {teams.length === 0 ? (
              <div className="py-14 text-center space-y-4 select-none">
                <div className="inline-block p-4 bg-slate-50 dark:bg-slate-950 rounded-full text-slate-400 border border-slate-200/40 dark:border-slate-805/30">
                  <Compass size={32} className="animate-spin duration-1000" />
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-800 dark:text-white text-xs uppercase tracking-wider">Empty Scoreboard</p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium max-w-sm mx-auto">No teams are loaded into your sandbox. Click "Reset Pre-loads" above or construct custom teams manually!</p>
                </div>
              </div>
            ) : (
              /* RESPONSIVE FLUID SCROLLER AND LAYOUT */
              <div className="overflow-x-auto -mx-1.5 sm:mx-0 select-text">
                <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10.5px]">
                      <th className="py-3 px-2 text-center w-12">Pos</th>
                      <th className="py-3 px-3">Squad / Franchise</th>
                      <th className="py-3 px-2 text-center w-12">M</th>
                      <th className="py-3 px-2 text-center w-12 text-emerald-500">W</th>
                      <th className="py-3 px-2 text-center w-12 text-rose-500">L</th>
                      <th className="py-3 px-2 text-center w-11">T</th>
                      <th className="py-3 px-2 text-center w-11">NR</th>
                      <th className="py-3 px-3 text-center w-24">Net Runrate</th>
                      <th className="py-3 px-2.5 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-t-xl font-black w-14">Pts</th>
                      <th className="py-3 px-3 text-center w-16">Ac.</th>
                    </tr>
                  </thead>
                  
                  <AnimatePresence mode="popLayout">
                    <tbody>
                      {teams.map((t, idx) => {
                        return (
                          <motion.tr
                            layout
                            key={t.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                            className={`border-b border-slate-50/60 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-colors group ${
                              idx < 4 ? 'bg-indigo-500/[0.01]' : ''
                            }`}
                          >
                            {/* Position */}
                            <td className="py-3.5 px-2 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black ${
                                idx === 0 ? 'bg-yellow-450/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
                                idx === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300' :
                                idx === 2 ? 'bg-amber-600/10 text-amber-700 dark:text-amber-500' :
                                idx < 4 ? 'bg-indigo-500/10 text-indigo-500' :
                                'text-slate-400'
                              }`}>
                                {idx + 1}
                              </span>
                            </td>

                            {/* Squad Info */}
                            <td className="py-3.5 px-3">
                              <div className="flex items-center gap-2.5">
                                {/* Logo color ring badge */}
                                <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 bg-gradient-to-br ${t.logoColor} border border-white/20 shadow-md`} />
                                <div className="flex flex-col">
                                  <span className="font-extrabold text-slate-800 dark:text-white tracking-normal text-[11px] sm:text-[12.5px] truncate max-w-[140px] sm:max-w-none">
                                    {t.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400 tracking-normal font-semibold">
                                    Code: <strong className="font-bold text-slate-500 dark:text-slate-400">{t.shortName}</strong>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Played */}
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-500">{t.played}</td>
                            
                            {/* Win */}
                            <td className="py-3.5 px-2 text-center font-mono font-extrabold text-emerald-600 dark:text-emerald-450">{t.won}</td>
                            
                            {/* Loss */}
                            <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{t.lost}</td>
                            
                            {/* Tied */}
                            <td className="py-3.5 px-2 text-center font-mono text-slate-400">{t.tied}</td>
                            
                            {/* No Result */}
                            <td className="py-3.5 px-2 text-center font-text text-slate-400">{t.noResult ? t.noResult : '-'}</td>

                            {/* Net Run Rate Breakdown */}
                            <td className="py-3.5 px-3 text-center relative cursor-help group-nrr">
                              <span className={`inline-block px-1.5 py-0.5 rounded-md font-mono font-black text-[11px] border ${
                                t.NRR > 0 
                                  ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10' 
                                  : t.NRR < 0 
                                    ? 'bg-rose-500/5 text-rose-500 border-rose-500/10'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200'
                              }`}>
                                {t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)}
                              </span>

                              {/* Live Calculation Tooltip popup */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 hidden hover-nrr-tooltip ml-[-20px] bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 shadow-2xl w-56 text-left z-50 normal-case select-none">
                                <p className="font-extrabold text-[9px] tracking-wider text-emerald-400 mb-1.5 uppercase">Exact NRR Formula</p>
                                <div className="text-[9.5px] font-mono text-slate-300 space-y-1.5">
                                  <div className="space-y-0.5 pb-1 border-b border-white/5">
                                    <p className="text-slate-450 flex justify-between font-sans"><span>Runs Scored:</span> <span className="text-white font-mono font-bold">{t.runsScored}</span></p>
                                    <p className="text-slate-450 flex justify-between font-sans"><span>Overs Faced:</span> <span className="text-white font-mono font-bold">{t.oversFaced} ov</span></p>
                                    <p className="text-slate-500 flex justify-between tracking-normal font-sans pl-2">
                                      <span>Rate Scored:</span>
                                      <span className="text-slate-300 font-bold">{calculateOversDecimal(t.oversFaced) > 0 ? (t.runsScored / calculateOversDecimal(t.oversFaced)).toFixed(3) : '0.000'}</span>
                                    </p>
                                  </div>

                                  <div className="space-y-0.5 pt-0.5 pb-1.5 border-b border-white/5">
                                    <p className="text-slate-450 flex justify-between font-sans"><span>Runs Conceded:</span> <span className="text-white font-mono font-bold">{t.runsConceded}</span></p>
                                    <p className="text-slate-450 flex justify-between font-sans"><span>Overs Bowled:</span> <span className="text-white font-mono font-bold">{t.oversBowled} ov</span></p>
                                    <p className="text-slate-500 flex justify-between tracking-normal font-sans pl-2">
                                      <span>Rate Conceded:</span>
                                      <span className="text-slate-300 font-bold">{calculateOversDecimal(t.oversBowled) > 0 ? (t.runsConceded / calculateOversDecimal(t.oversBowled)).toFixed(3) : '0.000'}</span>
                                    </p>
                                  </div>

                                  <p className="flex justify-between font-sans font-black text-[10px] pt-1 text-emerald-400">
                                    <span>NRR:</span>
                                    <span>{t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Points */}
                            <td className="py-3.5 px-2.5 text-center bg-emerald-500/[0.025] font-black text-emerald-500 text-sm">{t.points}</td>

                            {/* Actions Column */}
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setEditingTeam({ ...t })}
                                  className="p-1.5 text-slate-500 hover:text-indigo-550 dark:text-slate-400 dark:hover:text-indigo-400 bg-transparent border-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Edit Raw Stats"
                                >
                                  <Edit size={11} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeam(t.id, t.name)}
                                  className="p-1.5 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-450 bg-transparent border-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Delete Team"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
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

        {/* RIGHT COLUMN: ACTION PANELS (Simulate, Quick Log etc.) - Cols 4/12 */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SIMULATOR ENVELOPE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Play size={13} className="text-emerald-500" /> Match Simulator
              </h4>
              <button
                onClick={runRandomSimulation}
                type="button"
                className="py-1 px-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-750 text-white border-none rounded-xl font-black uppercase text-[10px] tracking-wide cursor-pointer shadow-sm transition-all animate-pulse"
              >
                ⚡ Quick Sim Game
              </button>
            </div>

            {teams.length < 2 ? (
              <p className="text-[11px] text-slate-400 italic text-center py-4">Create 2+ franchises to activate manual simulation panels.</p>
            ) : (
              <form onSubmit={handleRegisterSimulatedMatch} className="space-y-4">
                
                {/* SELECT TEAMS */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Team A</label>
                    <select
                      value={matchTeamAId}
                      onChange={(e) => setMatchTeamAId(e.target.value)}
                      required
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    >
                      <option value="">-- Choose --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id} disabled={t.id === matchTeamBId}>{t.name} ({t.shortName})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400">Team B</label>
                    <select
                      value={matchTeamBId}
                      onChange={(e) => setMatchTeamBId(e.target.value)}
                      required
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    >
                      <option value="">-- Choose --</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id} disabled={t.id === matchTeamAId}>{t.name} ({t.shortName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* MODIFIER */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Match Modifier</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-805">
                    {(['normal', 'tie', 'nr'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setMatchModifier(mode)}
                        className={`py-1.5 rounded-lg text-[9px] font-black uppercase border-none cursor-pointer transition-all ${
                          matchModifier === mode 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'bg-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                      >
                        {mode === 'normal' ? 'Normal' : mode === 'tie' ? 'Tie game' : 'No result'}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {matchModifier === 'normal' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3.5 pt-2 border-t border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                      {/* TEAM A METRICS */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                          <span>{teams.find(t => t.id === matchTeamAId)?.shortName || 'Team A'} Inputs</span>
                          <span className="text-[9px] text-indigo-500 font-bold">Runs/Wickets/Overs</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="number"
                            placeholder="Runs"
                            value={scoreARuns}
                            onChange={e => setScoreARuns(e.target.value)}
                            className="p-2 text-center text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          />
                          <input 
                            type="number"
                            placeholder="Wkts"
                            value={scoreAWickets}
                            onChange={e => setScoreAWickets(e.target.value)}
                            max="10"
                            className="p-2 text-center text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          />
                          <input 
                            type="number"
                            step="0.1"
                            placeholder="Overs"
                            value={scoreAOvers}
                            onChange={e => setScoreAOvers(e.target.value)}
                            className="p-2 text-center text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* TEAM B METRICS */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase text-slate-400 flex justify-between">
                          <span>{teams.find(t => t.id === matchTeamBId)?.shortName || 'Team B'} Inputs</span>
                          <span className="text-[9px] text-indigo-500 font-bold">Runs/Wickets/Overs</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <input 
                            type="number"
                            placeholder="Runs"
                            value={scoreBRuns}
                            onChange={e => setScoreBRuns(e.target.value)}
                            className="p-2 text-center text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          />
                          <input 
                            type="number"
                            placeholder="Wkts"
                            value={scoreBWickets}
                            max="10"
                            onChange={e => setScoreBWickets(e.target.value)}
                            className="p-2 text-center text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          />
                          <input 
                            type="number"
                            step="0.1"
                            placeholder="Overs"
                            value={scoreBOvers}
                            onChange={e => setScoreBOvers(e.target.value)}
                            className="p-2 text-center text-xs font-bold font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 outline-none text-white border-none rounded-xl font-black uppercase text-2xs tracking-wider cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check size={13} /> Record Match Result
                </button>
              </form>
            )}
          </div>

          {/* SIMULATED RESULTS LOG */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">
                Recent Matches ({matches.length})
              </h4>
              {matches.length > 0 && (
                <button
                  onClick={() => setMatches([])}
                  className="text-[9px] border-none font-bold text-rose-500 bg-transparent hover:underline cursor-pointer"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {matches.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic text-center py-6 select-none">No matches logged during this session.</p>
            ) : (
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto no-scrollbar scroll-smooth pr-1 select-text">
                {matches.map(m => (
                  <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-805 rounded-xl space-y-1 text-2xs font-semibold relative overflow-hidden">
                    <div className="absolute top-0 inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-700" />
                    
                    <div className="flex justify-between items-center pl-1 font-bold text-slate-805 dark:text-slate-200">
                      <span>{m.teamAName}</span>
                      <span className="font-mono text-slate-400">{m.scoreA}</span>
                    </div>

                    <div className="flex justify-between items-center pl-1 font-bold text-slate-805 dark:text-slate-200">
                      <span>{m.teamBName}</span>
                      <span className="font-mono text-slate-400">{m.scoreB}</span>
                    </div>

                    <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 pl-1">
                      <Flame size={10} className="text-amber-500" /> {m.resultText}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD CUSTOM TEAM */}
      <AnimatePresence>
        {showAddTeamModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[550] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 max-w-sm w-full shadow-2xl space-y-5 text-left text-slate-800 dark:text-slate-100 relative"
            >
              <button
                type="button"
                onClick={() => setShowAddTeamModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-all border-none cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="space-y-1">
                <h4 className="text-md font-black uppercase text-indigo-500 flex items-center gap-1.5">
                  <PlusCircle size={18} /> Add Custom Franchise
                </h4>
                <p className="text-2xs text-slate-400">Initialize a custom franchise for simulated tournament play.</p>
              </div>

              <form onSubmit={handleAddTeam} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-450">Team Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Punjab Kings"
                    value={newTeamName}
                    onChange={e => setNewTeamName(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-455">Short Abbreviation</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. RPK"
                    value={newTeamShort}
                    onChange={e => setNewTeamShort(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-455">Franchise Color Theme</label>
                  <select
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                  >
                    <option value="from-blue-600 to-indigo-700">Royal Ocean Indigo (MI)</option>
                    <option value="from-yellow-400 to-amber-500">Flashing Golden Amber (CSK)</option>
                    <option value="from-red-600 to-rose-800">Crimson Fire Red (RCB)</option>
                    <option value="from-purple-600 to-fuchsia-900">Vibrant Lotus Fuchsia (KKR)</option>
                    <option value="from-sky-500 to-blue-600">Azure Sky Blue (DC)</option>
                    <option value="from-emerald-500 to-teal-700">Striking Emerald Jade (GT)</option>
                    <option value="from-orange-500 to-rose-600">Sunriser Volcanic Orange</option>
                    <option value="from-teal-600 to-emerald-800">Deep Tropical Teal</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 outline-none text-white border-none rounded-xl font-black uppercase text-2xs tracking-wider cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <Check size={13} /> Add Squad
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: MANUAL STAT ADJUSTMENTS / EDITOR */}
      <AnimatePresence>
        {editingTeam && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[550] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 text-left text-slate-800 dark:text-slate-100 relative max-h-[90vh] overflow-y-auto scrollbar-none"
            >
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full transition-all border-none cursor-pointer"
              >
                <X size={14} />
              </button>

              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase text-indigo-500 flex items-center gap-1.5">
                  <Edit size={16} /> Edit Squad Profile
                </h4>
                <p className="text-[11px] text-slate-450">Tweak raw metrics directly. NRR and points will adapt automatically on save.</p>
              </div>

              <form onSubmit={handleSaveRawStats} className="space-y-3.5 text-slate-700 dark:text-slate-300">
                
                {/* Static Name Display */}
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400">Squad Name</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white">{editingTeam.name} ({editingTeam.shortName})</p>
                </div>

                {/* Grid 1: Played, Won, Lost */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Played (M)</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.played}
                      onChange={e => setEditingTeam({ ...editingTeam, played: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-emerald-500">Won (W)</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.won}
                      onChange={e => setEditingTeam({ ...editingTeam, won: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-rose-500">Lost (L)</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.lost}
                      onChange={e => setEditingTeam({ ...editingTeam, lost: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Grid 2: Tied, No Result */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Tied (T)</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.tied}
                      onChange={e => setEditingTeam({ ...editingTeam, tied: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">No Result (NR)</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.noResult}
                      onChange={e => setEditingTeam({ ...editingTeam, noResult: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Grid 3: Run Rate Scored Elements */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-150 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Runs Scored</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.runsScored}
                      onChange={e => setEditingTeam({ ...editingTeam, runsScored: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-405">Overs Faced (XX.Y)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editingTeam.oversFaced}
                      onChange={e => setEditingTeam({ ...editingTeam, oversFaced: parseFloat(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Grid 4: Run Rate Conceded Elements */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400">Runs Conceded</label>
                    <input
                      type="number"
                      required
                      value={editingTeam.runsConceded}
                      onChange={e => setEditingTeam({ ...editingTeam, runsConceded: parseInt(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-405">Overs Bowled (XX.Y)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={editingTeam.oversBowled}
                      onChange={e => setEditingTeam({ ...editingTeam, oversBowled: parseFloat(e.target.value) || 0 })}
                      className="w-full text-center text-xs font-bold p-2 rounded-xl border border-slate-202 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-805 leading-relaxed font-medium">
                  <p className="flex items-center gap-1.5"><Info size={11} className="text-indigo-500 uppercase select-none shrink-0" /> Notice:</p>
                  Overs faced/bowled must utilize exact legal overs format. For example, 19.3 represents 19 overs and 3 deliveries. Decimal portion cannot exceed .5.
                </div>

                <div className="flex gap-2.5 pt-1.5 select-none">
                  <button
                    type="button"
                    onClick={() => setEditingTeam(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 hover:scale-[1.02] active:scale-[0.98] text-slate-700 dark:text-slate-300 border-none rounded-xl font-black uppercase text-[10px] tracking-wide cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] text-white border-none rounded-xl font-black uppercase text-[10px] tracking-wide cursor-pointer transition-all shadow-md flex items-center justify-center gap-1"
                  >
                    <Save size={12} /> Save Edits
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
