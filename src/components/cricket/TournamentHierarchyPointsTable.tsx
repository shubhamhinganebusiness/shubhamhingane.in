import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, 
  Info, TrendingUp, ShieldAlert, Award, ArrowUpRight, Flame, BarChart3
} from 'lucide-react';
import { 
  calculateTournamentStandings, 
  StandingsTeamStats, 
  DEFAULT_POINTS_RULES, 
  formatDecimalToOversDisplay 
} from './modules/TournamentPointsCalculator';

interface TournamentHierarchyPointsTableProps {
  tournament: {
    id: string;
    name: string;
    format: string;
    customOvers?: number;
    type: 'league' | 'knockout' | 'group-stage' | 'double-elimination';
    teams: { id: string; name: string; captain?: string; logo?: string; shortName?: string }[];
    matches: {
      id: string;
      teamAId: string;
      teamBId: string;
      teamAName: string;
      teamBName: string;
      status: 'scheduled' | 'live' | 'completed';
      scoreA: string;
      scoreB: string;
      oversA: string | number;
      oversB: string | number;
      winnerId: string | null;
      winReason?: string;
      stage?: string;
    }[];
  };
  qualifyingThreshold?: number; // e.g., top 4 teams qualify
  onSelectTeam?: (teamId: string) => void;
}

export const TournamentHierarchyPointsTable: React.FC<TournamentHierarchyPointsTableProps> = ({
  tournament,
  qualifyingThreshold = 4,
  onSelectTeam
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const defaultOvers = tournament.customOvers || (tournament.format === 'T20' ? 20 : tournament.format === 'ODI' ? 50 : 10);

  const standings: StandingsTeamStats[] = calculateTournamentStandings(
    tournament.teams || [],
    (tournament.matches || []).map(m => ({
      ...m,
      oversA: m.oversA || defaultOvers,
      oversB: m.oversB || defaultOvers
    })),
    {
      standardOversQuota: defaultOvers,
      qualifyingSpots: qualifyingThreshold
    }
  );

  const filteredStandings = standings.filter(s => 
    s.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    (s.shortName && s.shortName.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const selectedTeamStats = standings.find(s => s.id === selectedTeamId);

  // Filter completed matches for selected team to show head-to-head or form
  const selectedTeamMatches = selectedTeamStats 
    ? (tournament.matches || []).filter(m => 
        m.status === 'completed' && 
        (m.teamAId === selectedTeamStats.id || m.teamBId === selectedTeamStats.id)
      )
    : [];

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100" id="tournament-points-table-module">
      {/* Top Banner / Tournament Stage Hierarchy Header */}
      <div className="p-4.5 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-transparent border border-slate-200/60 dark:border-slate-800/40 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
              ICC Standard NRR
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {tournament.format} • {defaultOvers} Overs Quota
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy size={18} className="text-amber-500 shrink-0" />
            <span>{tournament.name} Standings & Qualification Hierarchy</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Top {qualifyingThreshold} teams advance to the Knockout Playoffs. Net Run Rate dynamically computed based on ICC Rule 16.10.2.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <button
            type="button"
            onClick={() => setShowFormulaModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border-none cursor-pointer transition-colors flex items-center gap-1.5"
            title="View ICC Net Run Rate Formula and Tie-breaker rules"
          >
            <Info size={14} className="text-indigo-500" />
            <span>NRR Rule Explainer</span>
          </button>
        </div>
      </div>

      {/* Main Standings Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/40 rounded-[2rem] p-4 sm:p-6 shadow-xl relative overflow-hidden text-left">
        {/* Search filter bar if many teams */}
        {standings.length > 6 && (
          <div className="mb-4 flex items-center justify-between">
            <input
              type="text"
              placeholder="Search squad..."
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              className="text-xs px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 w-48 text-slate-800 dark:text-white"
            />
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              {filteredStandings.length} Teams
            </span>
          </div>
        )}

        {filteredStandings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Trophy className="mx-auto text-slate-300 dark:text-slate-700" size={36} />
            <p className="text-xs font-bold uppercase tracking-wider">No Teams in Standings</p>
            <p className="text-2xs text-slate-400">Add teams and schedule league fixtures to view automatic points.</p>
          </div>
        ) : (
          <div className="overflow-x-auto select-text">
            <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10.5px]">
                  <th className="py-3.5 px-3 text-center w-12">Pos</th>
                  <th className="py-3.5 px-4">Squad / Franchise</th>
                  <th className="py-3.5 px-2.5 text-center w-12">P</th>
                  <th className="py-3.5 px-2.5 text-center w-12 text-emerald-500">W</th>
                  <th className="py-3.5 px-2.5 text-center w-12 text-rose-500">L</th>
                  <th className="py-3.5 px-2.5 text-center w-11">T</th>
                  <th className="py-3.5 px-2.5 text-center w-11">NR</th>
                  <th className="py-3.5 px-3 text-center w-28">Net Run Rate</th>
                  <th className="py-3.5 px-3 text-center w-20">For (R/Ov)</th>
                  <th className="py-3.5 px-3 text-center w-20">Against (R/Ov)</th>
                  <th className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-t-xl font-black w-14">Pts</th>
                  <th className="py-3.5 px-3 text-center w-24">Form</th>
                </tr>
              </thead>
              <AnimatePresence mode="popLayout">
                <tbody>
                  {filteredStandings.map((team, idx) => {
                    const isQualifyingSpot = idx < qualifyingThreshold;
                    const isSelected = selectedTeamId === team.id;

                    return (
                      <motion.tr
                        layout
                        key={team.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        onClick={() => {
                          setSelectedTeamId(isSelected ? null : team.id);
                          if (onSelectTeam) onSelectTeam(team.id);
                        }}
                        className={`border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-950/70 transition-colors cursor-pointer group ${
                          isQualifyingSpot ? 'bg-emerald-500/[0.02]' : ''
                        } ${isSelected ? 'bg-indigo-500/10 dark:bg-indigo-500/15' : ''}`}
                      >
                        {/* Position / Rank */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10.5px] font-black ${
                            idx === 0 ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40' :
                            idx === 1 ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' :
                            idx === 2 ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500' :
                            isQualifyingSpot ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black' :
                            'text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        {/* Squad Name & Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            {team.logo ? (
                              <img 
                                src={team.logo} 
                                alt="" 
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0" 
                                referrerPolicy="no-referrer" 
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {team.shortName?.[0] || team.name[0]}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-800 dark:text-white tracking-normal text-xs sm:text-[13px]">
                                  {team.name}
                                </span>
                                {isQualifyingSpot && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="In Playoff Qualification Spot" />
                                )}
                              </div>
                              {team.captain && (
                                <span className="text-[9px] text-slate-400 tracking-normal font-semibold">
                                  C: {team.captain}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Played */}
                        <td className="py-3.5 px-2.5 text-center font-mono font-bold text-slate-500">{team.played}</td>
                        
                        {/* Wins */}
                        <td className="py-3.5 px-2.5 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{team.won}</td>
                        
                        {/* Losses */}
                        <td className="py-3.5 px-2.5 text-center font-mono font-bold text-rose-500">{team.lost}</td>
                        
                        {/* Tied */}
                        <td className="py-3.5 px-2.5 text-center font-mono text-slate-400">{team.tied}</td>
                        
                        {/* No Result */}
                        <td className="py-3.5 px-2.5 text-center font-mono text-slate-400">{team.noResult || '-'}</td>

                        {/* Net Run Rate */}
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-mono font-black text-[11px] border ${
                            team.NRR > 0 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                              : team.NRR < 0 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {team.NRR > 0 ? `+${team.NRR.toFixed(3)}` : team.NRR.toFixed(3)}
                          </span>
                        </td>

                        {/* For Run Rate & Breakdown */}
                        <td className="py-3.5 px-3 text-center font-mono text-[10px] text-slate-500">
                          <span className="block font-bold text-slate-700 dark:text-slate-300">{team.runsScored} / {team.oversFacedDisplay}</span>
                          <span className="text-[8.5px] text-slate-400 font-sans">({team.forRunRate.toFixed(3)})</span>
                        </td>

                        {/* Against Run Rate & Breakdown */}
                        <td className="py-3.5 px-3 text-center font-mono text-[10px] text-slate-500">
                          <span className="block font-bold text-slate-700 dark:text-slate-300">{team.runsConceded} / {team.oversBowledDisplay}</span>
                          <span className="text-[8.5px] text-slate-400 font-sans">({team.againstRunRate.toFixed(3)})</span>
                        </td>

                        {/* Points */}
                        <td className="py-3.5 px-3 text-center bg-emerald-500/[0.04] font-black text-emerald-500 text-sm">
                          {team.points}
                        </td>

                        {/* Form Guide (Recent 5 Matches) */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {(!team.formGuide || team.formGuide.length === 0) ? (
                              <span className="text-[9px] text-slate-400 font-mono">-</span>
                            ) : (
                              team.formGuide.map((res, rIdx) => (
                                <span
                                  key={rIdx}
                                  className={`w-4 h-4 rounded-full text-[8.5px] font-black flex items-center justify-center text-white ${
                                    res === 'W' ? 'bg-emerald-500' :
                                    res === 'L' ? 'bg-rose-500' :
                                    res === 'T' ? 'bg-amber-500' :
                                    'bg-slate-400'
                                  }`}
                                  title={`Match: ${res === 'W' ? 'Win' : res === 'L' ? 'Loss' : res === 'T' ? 'Tie' : 'No Result'}`}
                                >
                                  {res}
                                </span>
                              ))
                            )}
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

        {/* Qualification Line Legend */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500" />
              <span>Positions 1 to {qualifyingThreshold}: Qualifies for Knockout Stage</span>
            </div>
          </div>
          <p className="text-2xs font-mono text-slate-400">Win: 2 pts • Tie/NR: 1 pt • Loss: 0 pts</p>
        </div>
      </div>

      {/* Expanded Team Deep Dive Details Drawer / Box */}
      {selectedTeamStats && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950 border border-indigo-500/20 rounded-3xl space-y-4 text-left relative"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-md">
                {selectedTeamStats.shortName || selectedTeamStats.name[0]}
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                  {selectedTeamStats.name} — Detailed Hierarchy Breakdown
                </h4>
                <p className="text-2xs text-slate-400 font-semibold">
                  Captain: {selectedTeamStats.captain || 'Unassigned'} • Status: <span className="text-emerald-500 font-bold uppercase">{selectedTeamStats.qualificationStatus}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedTeamId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-lg border-none cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Runs Scored</span>
              <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{selectedTeamStats.runsScored}</span>
              <span className="text-2xs text-slate-400 block mt-0.5">Across {selectedTeamStats.oversFacedDisplay}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Runs Conceded</span>
              <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{selectedTeamStats.runsConceded}</span>
              <span className="text-2xs text-slate-400 block mt-0.5">Across {selectedTeamStats.oversBowledDisplay}</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Run Rate For</span>
              <span className="text-sm font-black text-emerald-500 font-mono">+{selectedTeamStats.forRunRate.toFixed(3)}</span>
              <span className="text-2xs text-slate-400 block mt-0.5">Runs per Over</span>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Run Rate Against</span>
              <span className="text-sm font-black text-rose-500 font-mono">-{selectedTeamStats.againstRunRate.toFixed(3)}</span>
              <span className="text-2xs text-slate-400 block mt-0.5">Runs Conceded / Over</span>
            </div>
          </div>

          {/* Math calculation display */}
          <div className="p-3.5 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-1">
            <span className="text-emerald-400 font-bold uppercase text-[9px] block tracking-wider">Exact NRR Calculation:</span>
            <p>
              NRR = ({selectedTeamStats.runsScored} / {selectedTeamStats.oversFacedDecimal.toFixed(3)}) - ({selectedTeamStats.runsConceded} / {selectedTeamStats.oversBowledDecimal.toFixed(3)})
            </p>
            <p className="text-slate-400">
              = {selectedTeamStats.forRunRate.toFixed(3)} - {selectedTeamStats.againstRunRate.toFixed(3)} = <span className="text-emerald-400 font-bold">{selectedTeamStats.NRR > 0 ? `+${selectedTeamStats.NRR.toFixed(3)}` : selectedTeamStats.NRR.toFixed(3)}</span>
            </p>
          </div>

          {/* Recent matches logs for this team */}
          {selectedTeamMatches.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-2xs font-extrabold text-slate-400 uppercase tracking-wider">Completed Matches ({selectedTeamMatches.length})</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedTeamMatches.map(m => {
                  const won = m.winnerId === selectedTeamStats.id;
                  const opponentName = m.teamAId === selectedTeamStats.id ? m.teamBName : m.teamAName;
                  const myScore = m.teamAId === selectedTeamStats.id ? m.scoreA : m.scoreB;
                  const oppScore = m.teamAId === selectedTeamStats.id ? m.scoreB : m.scoreA;

                  return (
                    <div key={m.id} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black text-white ${won ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            {won ? 'WON' : 'LOST'}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-white">vs {opponentName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{myScore || '-'} vs {oppScore || '-'}</span>
                      </div>
                      {m.winReason && (
                        <span className="text-[9.5px] text-slate-400 max-w-[140px] text-right truncate font-medium">
                          {m.winReason}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ICC NRR Rule & Tie-Breaker Explainer Modal */}
      <AnimatePresence>
        {showFormulaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-left space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Info className="text-indigo-500" size={18} />
                  <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                    ICC Official Standings & NRR Rules
                  </h4>
                </div>
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg border-none cursor-pointer bg-slate-100 dark:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-white uppercase text-[11px] mb-1">
                    1. Points System
                  </h5>
                  <p>Each victory yields <strong>2 Points</strong>. A Tie or Abandoned/No-Result match splits points at <strong>1 Point each</strong>. Losses yield <strong>0 Points</strong>.</p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-white uppercase text-[11px] mb-1">
                    2. Net Run Rate (ICC Rule 16.10.2)
                  </h5>
                  <p className="mb-1.5">
                    Net Run Rate is calculated across all completed matches in the stage:
                  </p>
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-950 font-mono text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-[11px]">
                    NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    *<strong>Crucial Rule</strong>: If a team is bowled out (all 10 wickets lost) before completing their allotted overs, their run rate is computed against their <em>full allotted quota</em> of overs (e.g. 20 overs in T20).
                  </p>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-white uppercase text-[11px] mb-1">
                    3. Tournament Hierarchy & Tie-Breakers
                  </h5>
                  <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400">
                    <li><strong>Points:</strong> Squad with the highest total points ranks higher.</li>
                    <li><strong>Wins:</strong> If points are tied, squad with more outright wins ranks higher.</li>
                    <li><strong>Net Run Rate:</strong> If wins are also tied, squad with the higher NRR ranks higher.</li>
                    <li><strong>Head-to-Head:</strong> Direct result between the two tied teams.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl border-none cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
