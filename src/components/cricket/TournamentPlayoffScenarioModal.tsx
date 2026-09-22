import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, TrendingUp, Calculator, ShieldCheck, ShieldAlert, 
  X, HelpCircle, CheckCircle2, Flame, ArrowRight, RefreshCw, Sparkles
} from 'lucide-react';
import { 
  calculateTournamentStandings, 
  StandingsTeamStats, 
  formatDecimalToOversDisplay 
} from './modules/TournamentPointsCalculator';

interface TournamentPlayoffScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    id: string;
    name: string;
    format: string;
    customOvers?: number;
    teams?: { id: string; name: string }[];
    matches?: any[];
  };
  qualifyingSpots?: number;
}

export const TournamentPlayoffScenarioModal: React.FC<TournamentPlayoffScenarioModalProps> = ({
  isOpen,
  onClose,
  tournament,
  qualifyingSpots = 4
}) => {
  const [simulatedMatchId, setSimulatedMatchId] = useState<string>('');
  const [simulatedWinner, setSimulatedWinner] = useState<'A' | 'B'>('A');
  const [simulatedMarginRuns, setSimulatedMarginRuns] = useState<number>(25);

  if (!isOpen) return null;

  const defaultOvers = tournament.customOvers || (tournament.format === 'T20' ? 20 : tournament.format === 'ODI' ? 50 : 10);
  const teams = tournament.teams || [];
  const matches = tournament.matches || [];

  // Actual base standings
  const actualStandings: StandingsTeamStats[] = calculateTournamentStandings(
    teams,
    matches,
    { standardOversQuota: defaultOvers, qualifyingSpots }
  );

  // Remaining scheduled matches
  const scheduledMatches = matches.filter(m => m.status === 'scheduled');

  // Compute playoff qualification math
  const maxPossiblePointsPerTeam = new Map<string, number>();
  const totalMatchesPerTeam = new Map<string, number>();

  teams.forEach(t => {
    const played = matches.filter(m => m.status === 'completed' && (m.teamAId === t.id || m.teamBId === t.id)).length;
    const remaining = matches.filter(m => m.status === 'scheduled' && (m.teamAId === t.id || m.teamBId === t.id)).length;
    const currPts = actualStandings.find(s => s.id === t.id)?.points || 0;
    maxPossiblePointsPerTeam.set(t.id, currPts + (remaining * 2));
    totalMatchesPerTeam.set(t.id, played + remaining);
  });

  // Determine current 4th placed team points
  const thresholdTeamPts = actualStandings[qualifyingSpots - 1]?.points || 0;
  const cutoff5thTeamPts = actualStandings[qualifyingSpots]?.points || 0;

  // Qualification status tagging
  const qualificationMap = new Map<string, { status: 'QUALIFIED' | 'IN_HUNT' | 'ELIMINATED'; note: string }>();

  actualStandings.forEach((team, idx) => {
    const maxPts = maxPossiblePointsPerTeam.get(team.id) || team.points;
    const remainingCount = matches.filter(m => m.status === 'scheduled' && (m.teamAId === team.id || m.teamBId === team.id)).length;

    if (remainingCount === 0) {
      if (idx < qualifyingSpots) {
        qualificationMap.set(team.id, { status: 'QUALIFIED', note: 'All league matches completed. Qualified for Playoffs!' });
      } else {
        qualificationMap.set(team.id, { status: 'ELIMINATED', note: 'All league matches completed. Out of playoff contention.' });
      }
    } else if (team.points > cutoff5thTeamPts + (scheduledMatches.length * 2)) {
      qualificationMap.set(team.id, { status: 'QUALIFIED', note: 'Mathematically guaranteed top spot.' });
    } else if (maxPts < thresholdTeamPts && idx >= qualifyingSpots) {
      qualificationMap.set(team.id, { status: 'ELIMINATED', note: `Maximum possible points (${maxPts}) cannot overtake top ${qualifyingSpots}.` });
    } else {
      qualificationMap.set(team.id, { 
        status: 'IN_HUNT', 
        note: `Needs ${Math.max(1, (thresholdTeamPts - team.points) + 1)} more win(s) and positive NRR to secure qualification.` 
      });
    }
  });

  // Simulated standings
  let simulatedStandings = actualStandings;
  if (simulatedMatchId) {
    const targetMatch = scheduledMatches.find(m => m.id === simulatedMatchId);
    if (targetMatch) {
      const simRunsA = simulatedWinner === 'A' ? 160 : 160 - simulatedMarginRuns;
      const simRunsB = simulatedWinner === 'B' ? 160 : 160 - simulatedMarginRuns;

      const modifiedMatches = matches.map(m => {
        if (m.id !== simulatedMatchId) return m;
        return {
          ...m,
          status: 'completed' as const,
          scoreA: `${simRunsA}/6`,
          scoreB: `${simRunsB}/8`,
          oversA: String(defaultOvers),
          oversB: String(defaultOvers),
          winnerId: simulatedWinner === 'A' ? m.teamAId : m.teamBId,
          winReason: simulatedWinner === 'A' 
            ? `${m.teamAName || m.teamA} won by ${simulatedMarginRuns} runs`
            : `${m.teamBName || m.teamB} won by ${simulatedMarginRuns} runs`
        };
      });

      simulatedStandings = calculateTournamentStandings(
        teams,
        modifiedMatches,
        { standardOversQuota: defaultOvers, qualifyingSpots }
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[215] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-sky-500/40 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  Cricbuzz Intelligence Engine
                </span>
                <span className="text-[10px] font-bold text-sky-200 uppercase">Path to Playoffs</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-tight">
                Playoff Qualification Scenarios & NRR Calculator
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-base border-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
          {/* SIMULATOR TOOLBAR */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles size={14} /> Interactive Fixture Simulator
              </span>
              {simulatedMatchId && (
                <button
                  onClick={() => setSimulatedMatchId('')}
                  className="text-[10px] text-slate-400 hover:text-white uppercase font-bold flex items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <RefreshCw size={11} /> Reset Simulation
                </button>
              )}
            </div>

            {scheduledMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Select Fixture</label>
                  <select
                    value={simulatedMatchId}
                    onChange={(e) => {
                      setSimulatedMatchId(e.target.value);
                      setSimulatedWinner('A');
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-medium"
                  >
                    <option value="">-- Choose Match to Simulate --</option>
                    {scheduledMatches.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.teamAName || m.teamA} vs {m.teamBName || m.teamB}
                      </option>
                    ))}
                  </select>
                </div>

                {simulatedMatchId && (
                  <>
                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Simulated Winner</label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-700">
                        <button
                          type="button"
                          onClick={() => setSimulatedWinner('A')}
                          className={`flex-1 py-2 text-[11px] font-bold border-none cursor-pointer ${
                            simulatedWinner === 'A' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          Team A Win
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimulatedWinner('B')}
                          className={`flex-1 py-2 text-[11px] font-bold border-none cursor-pointer ${
                            simulatedWinner === 'B' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-300'
                          }`}
                        >
                          Team B Win
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Win Margin (Runs)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={simulatedMarginRuns}
                        onChange={(e) => setSimulatedMarginRuns(parseInt(e.target.value, 10) || 10)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono font-bold"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                All tournament fixtures have concluded! Final rankings are locked.
              </p>
            )}
          </div>

          {/* PLAYOFF BRACKET QUALIFICATION TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <span>Qualification Matrix (Top {qualifyingSpots} Advance)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {simulatedMatchId ? 'Showing Simulated Projection' : 'Live Official Standing'}
              </span>
            </div>

            <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">Team</th>
                    <th className="py-2.5 px-3 text-center">P</th>
                    <th className="py-2.5 px-3 text-center">W</th>
                    <th className="py-2.5 px-3 text-center">PTS</th>
                    <th className="py-2.5 px-3 text-center">NRR</th>
                    <th className="py-2.5 px-4 text-center">Qualification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {simulatedStandings.map((team, idx) => {
                    const qual = qualificationMap.get(team.id) || { status: 'IN_HUNT', note: '' };
                    const isTop4 = idx < qualifyingSpots;

                    return (
                      <tr 
                        key={team.id}
                        className={`transition-colors ${
                          isTop4 
                            ? 'bg-emerald-950/20 hover:bg-emerald-950/30' 
                            : 'bg-slate-900 hover:bg-slate-850'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-black text-white">
                          <div className="flex items-center gap-2">
                            <span>{team.name}</span>
                            {isTop4 && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold border border-emerald-500/30">
                                PLAYOFF ZONE
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{team.matchesPlayed}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">{team.wins}</td>
                        <td className="py-3 px-3 text-center font-mono font-black text-white text-sm bg-slate-950/40">{team.points}</td>
                        <td className="py-3 px-3 text-center font-mono font-extrabold text-amber-400">
                          {team.netRunRate > 0 ? `+${team.netRunRate.toFixed(3)}` : team.netRunRate.toFixed(3)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {qual.status === 'QUALIFIED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/40">
                              <ShieldCheck size={12} /> QUALIFIED (Q)
                            </span>
                          ) : qual.status === 'ELIMINATED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[10px] font-black border border-rose-500/40">
                              <ShieldAlert size={12} /> ELIMINATED (E)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px] font-black border border-sky-500/40">
                              <TrendingUp size={12} /> IN THE HUNT
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETAILED EQUATIONS PER TEAM */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Cricbuzz Playoff Scenario Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actualStandings.map((team, idx) => {
                const qual = qualificationMap.get(team.id);
                return (
                  <div 
                    key={team.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-black">{team.name}</strong>
                      <span className="text-[10px] font-mono font-bold text-amber-400">
                        {team.points} Pts ({team.netRunRate > 0 ? `+${team.netRunRate.toFixed(2)}` : team.netRunRate.toFixed(2)})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {qual?.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Powered by Cricbuzz-Grade Net Run Rate & Playoff Equations
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase border-none cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
