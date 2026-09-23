import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, 
  Info, TrendingUp, ShieldAlert, Award, ArrowUpRight, Flame, BarChart3,
  Calculator, Swords, GitCompare, Share2, Copy, Check, Sparkles, Filter,
  ArrowRight, ShieldCheck, XCircle, AlertCircle
} from 'lucide-react';
import { 
  calculateTournamentStandings, 
  buildHeadToHeadMatrix,
  getHeadToHeadAdvantage,
  StandingsTeamStats, 
  DEFAULT_POINTS_RULES, 
  formatDecimalToOversDisplay,
  TieBreakerRule,
  HeadToHeadSummary
} from './modules/TournamentPointsCalculator';
import { TournamentPlayoffScenarioModal } from './TournamentPlayoffScenarioModal';

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
      date?: string;
    }[];
  };
  qualifyingThreshold?: number; // e.g., top 4 teams qualify
  onSelectTeam?: (teamId: string) => void;
  onOpenScorecard?: (match: any) => void;
}

export const TournamentHierarchyPointsTable: React.FC<TournamentHierarchyPointsTableProps> = ({
  tournament,
  qualifyingThreshold = 4,
  onSelectTeam,
  onOpenScorecard
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showPlayoffsModal, setShowPlayoffsModal] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Cricbuzz / CricHeroes View Controls
  const [viewMode, setViewMode] = useState<'table' | 'h2h_matrix' | 'tiebreaker_lab'>('table');
  const [tieBreakerRule, setTieBreakerRule] = useState<TieBreakerRule>('icc_standard');
  const [copiedShare, setCopiedShare] = useState(false);

  // Comparison Lab Selection
  const [compareTeamAId, setCompareTeamAId] = useState<string>('');
  const [compareTeamBId, setCompareTeamBId] = useState<string>('');

  // Cross-component and cross-tab real-time sync listener
  React.useEffect(() => {
    const handleUpdate = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('gully_tournaments_updated', handleUpdate);
    window.addEventListener('cricket_matches_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('gully_tournaments_updated', handleUpdate);
      window.removeEventListener('cricket_matches_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Pick up the latest state of the tournament directly from localStorage if updated
  const currentTournament = useMemo(() => {
    if (typeof window !== 'undefined' && tournament?.id) {
      try {
        const saved = localStorage.getItem('gully_tournaments_v1');
        if (saved) {
          const list = JSON.parse(saved);
          if (Array.isArray(list)) {
            const found = list.find((t: any) => t.id === tournament.id);
            if (found) return found;
          }
        }
      } catch (_) {}
    }
    return tournament;
  }, [tournament, refreshKey]);

  const defaultOvers = currentTournament.customOvers || (currentTournament.format === 'T20' ? 20 : currentTournament.format === 'ODI' ? 50 : 10);
  const tourPointsConfig = (currentTournament as any).pointsConfig;

  // Compute standings with selected tiebreaker rules
  const standings: StandingsTeamStats[] = useMemo(() => {
    return calculateTournamentStandings(
      currentTournament.teams || [],
      (currentTournament.matches || []).map(m => ({
        ...m,
        oversA: m.oversA || defaultOvers,
        oversB: m.oversB || defaultOvers,
        winner: (m as any).winner,
        winReason: m.winReason,
        stage: m.stage,
        date: m.date,
      })),
      {
        standardOversQuota: defaultOvers,
        qualifyingSpots: qualifyingThreshold,
        pointsForWin: tourPointsConfig?.winPoints ?? 2,
        pointsForTie: tourPointsConfig?.tiePoints ?? 1,
        pointsForNoResult: tourPointsConfig?.tiePoints ?? 1,
        pointsForLoss: tourPointsConfig?.lossPoints ?? 0,
        tieBreakerRule: tieBreakerRule,
      }
    );
  }, [currentTournament, defaultOvers, qualifyingThreshold, tourPointsConfig, tieBreakerRule]);

  // Head-to-Head Cross Matrix
  const h2hMatrix = useMemo(() => {
    return buildHeadToHeadMatrix(
      currentTournament.teams || [],
      (currentTournament.matches || []).map(m => ({
        ...m,
        oversA: m.oversA || defaultOvers,
        oversB: m.oversB || defaultOvers,
        winner: (m as any).winner,
        winReason: m.winReason,
        stage: m.stage,
        date: m.date,
      }))
    );
  }, [currentTournament, defaultOvers]);

  // Set default comparison teams once standings load
  React.useEffect(() => {
    if (standings.length >= 2) {
      if (!compareTeamAId) setCompareTeamAId(standings[0]?.id || '');
      if (!compareTeamBId) setCompareTeamBId(standings[1]?.id || '');
    }
  }, [standings]);

  const filteredStandings = standings.filter(s => 
    s.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
    (s.shortName && s.shortName.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  const selectedTeamStats = standings.find(s => s.id === selectedTeamId);

  // Filter completed matches for selected team to show head-to-head or form
  const selectedTeamMatches = selectedTeamStats 
    ? (currentTournament.matches || []).filter(m => 
        (m.status === 'completed' || !!m.winnerId || !!(m as any).winner) && 
        (m.teamAId === selectedTeamStats.id || 
         m.teamBId === selectedTeamStats.id ||
         m.teamAName?.toLowerCase().trim() === selectedTeamStats.name.toLowerCase().trim() ||
         m.teamBName?.toLowerCase().trim() === selectedTeamStats.name.toLowerCase().trim())
      )
    : [];

  // Share formatted WhatsApp standings
  const handleShareWhatsApp = () => {
    let msg = `🏆 *${currentTournament.name} — OFFICIAL POINTS TABLE*\n`;
    msg += `📊 Format: ${currentTournament.format} (${defaultOvers} Ov) | Top ${qualifyingThreshold} advance\n`;
    msg += `⚖️ Tiebreaker: ${tieBreakerRule === 'icc_standard' ? 'ICC Standard (Points > Wins > NRR)' : 'Head-to-Head First'}\n\n`;

    standings.forEach((team, idx) => {
      const pos = idx + 1;
      const statusIcon = team.qualificationStatus === 'top2_secured' ? '👑' 
        : team.qualificationStatus === 'qualified' ? '✅' 
        : team.qualificationStatus === 'eliminated' ? '❌' 
        : '⏳';
      const nrrStr = team.NRR > 0 ? `+${team.NRR.toFixed(3)}` : team.NRR.toFixed(3);
      msg += `${pos}. ${statusIcon} *${team.name}*\n`;
      msg += `   Pts: *${team.points}* | P:${team.played} W:${team.won} L:${team.lost} | NRR: ${nrrStr}\n`;
      if (team.streak && team.streak.length > 0) {
        msg += `   Recent: ${team.streak.slice(-5).join(' ')}\n`;
      }
    });

    msg += `\n⚡ Powered by Gully Score`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }

    const shareUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(shareUrl, '_blank');
  };

  // Compare 2 teams in the Tiebreaker Lab
  const teamACompare = standings.find(s => s.id === compareTeamAId);
  const teamBCompare = standings.find(s => s.id === compareTeamBId);
  const compareH2H = teamACompare && teamBCompare ? h2hMatrix[teamACompare.id]?.[teamBCompare.id] : null;
  const compareH2HAdv = teamACompare && teamBCompare ? getHeadToHeadAdvantage(teamACompare.id, teamBCompare.id, h2hMatrix) : null;

  return (
    <div className="space-y-5 text-slate-800 dark:text-slate-100" id="tournament-points-table-module">
      {/* Top Banner / Tournament Stage Hierarchy Header */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-500/10 via-sky-500/5 to-slate-900/10 border border-slate-200/80 dark:border-slate-800/60 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm text-left">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} /> Dynamic Standings
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {currentTournament.format} • {defaultOvers} Ov Quota • Top {qualifyingThreshold} Advance
            </span>
          </div>
          <h3 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy size={20} className="text-amber-500 shrink-0" />
            <span>{currentTournament.name} Standings & Tiebreakers</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Automated ICC NRR calculation, mathematical qualification statuses (Q/E/Top 2), and Cricbuzz-grade Head-to-Head tiebreakers.
          </p>
        </div>

        {/* Action Controls & Views */}
        <div className="flex items-center gap-2 shrink-0 select-none flex-wrap w-full md:w-auto justify-start md:justify-end">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Share Points Table to WhatsApp"
          >
            {copiedShare ? <Check size={13} className="text-white" /> : <Share2 size={13} />}
            <span>{copiedShare ? 'Copied!' : 'Share WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPlayoffsModal(true)}
            className="px-3 py-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 text-xs font-bold rounded-xl border border-sky-500/30 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
            title="Cricbuzz Path to Playoffs & NRR Simulator"
          >
            <Calculator size={13} className="text-sky-500" />
            <span>Path to Playoffs</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFormulaModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border-none cursor-pointer transition-colors flex items-center gap-1.5"
            title="View ICC Net Run Rate Formula and Tie-breaker rules"
          >
            <Info size={13} className="text-indigo-500" />
            <span>NRR Rules</span>
          </button>
        </div>
      </div>

      {/* View Switcher Bar (Points Table vs Head-to-Head Matrix vs Tiebreaker Lab) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100/80 dark:bg-slate-900/90 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-none cursor-pointer ${
              viewMode === 'table'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <Trophy size={13} />
            <span>Points Table</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('h2h_matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-none cursor-pointer ${
              viewMode === 'h2h_matrix'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <Swords size={13} />
            <span>H2H Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('tiebreaker_lab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border-none cursor-pointer ${
              viewMode === 'tiebreaker_lab'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <GitCompare size={13} />
            <span>Tiebreaker Lab</span>
          </button>
        </div>

        {/* Tiebreaker Rules Configuration Switcher */}
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 hidden md:inline">
            Tiebreaker Hierarchy:
          </span>
          <select
            value={tieBreakerRule}
            onChange={(e) => setTieBreakerRule(e.target.value as TieBreakerRule)}
            className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white font-bold cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="icc_standard">ICC Standard (Points ➔ Wins ➔ NRR ➔ H2H)</option>
            <option value="head_to_head_first">CricHeroes Style (Points ➔ H2H ➔ Wins ➔ NRR)</option>
          </select>
        </div>
      </div>

      {/* ===================== VIEW 1: MASTER POINTS TABLE ===================== */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 rounded-[2rem] p-4 sm:p-6 shadow-xl relative overflow-hidden text-left">
          {/* Search bar & Legend */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {standings.length > 5 && (
                <input
                  type="text"
                  placeholder="Filter squad name..."
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  className="text-xs px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500 w-44 text-slate-800 dark:text-white"
                />
              )}
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                {filteredStandings.length} Teams Competing
              </span>
            </div>

            {/* Quick Qualification Legend */}
            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Q = Qualified
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> TOP 2 = Qualifier 1
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> E = Eliminated
              </span>
            </div>
          </div>

          {filteredStandings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Trophy className="mx-auto text-slate-300 dark:text-slate-700" size={36} />
              <p className="text-xs font-bold uppercase tracking-wider">No Teams Found</p>
              <p className="text-2xs text-slate-400">Add registered squads in the tournament tab to view live standings.</p>
            </div>
          ) : (
            <div className="overflow-x-auto select-text -mx-2 sm:mx-0">
              <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10.5px]">
                    <th className="py-3.5 px-3 text-center w-12">Pos</th>
                    <th className="py-3.5 px-4">Squad / Franchise</th>
                    <th className="py-3.5 px-2 text-center w-11">P</th>
                    <th className="py-3.5 px-2 text-center w-11 text-emerald-500">W</th>
                    <th className="py-3.5 px-2 text-center w-11 text-rose-500">L</th>
                    <th className="py-3.5 px-2 text-center w-10">T</th>
                    <th className="py-3.5 px-2 text-center w-10">NR</th>
                    <th className="py-3.5 px-3 text-center w-28">Net Run Rate</th>
                    <th className="py-3.5 px-3 text-center w-20">For (R/Ov)</th>
                    <th className="py-3.5 px-3 text-center w-20">Against (R/Ov)</th>
                    <th className="py-3.5 px-3 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-t-xl font-black w-14">Pts</th>
                    <th className="py-3.5 px-2.5 text-center w-24">Form</th>
                    <th className="py-3.5 px-2 text-center w-16">Status</th>
                  </tr>
                </thead>
                <AnimatePresence mode="popLayout">
                  <tbody>
                    {filteredStandings.map((team, idx) => {
                      const isQualifyingSpot = idx < qualifyingThreshold;
                      const isSelected = selectedTeamId === team.id;
                      const qBadge = team.qualificationBadge;

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
                              idx === 0 ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/40 shadow-xs' :
                              idx === 1 ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300' :
                              idx === 2 ? 'bg-amber-700/15 text-amber-700 dark:text-amber-500' :
                              isQualifyingSpot ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black' :
                              'text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>

                          {/* Squad Name & Tiebreak note */}
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
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-800 dark:text-white tracking-normal text-xs sm:text-[13px]">
                                    {team.name}
                                  </span>
                                  {team.tiebreakReason && (
                                    <span 
                                      className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold"
                                      title={team.tiebreakReason}
                                    >
                                      ⚡ {team.tiebreakReason.split(' ')[0]}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-slate-400 tracking-normal font-semibold">
                                  {team.captain && <span>C: {team.captain}</span>}
                                  {team.qualificationMath?.summary && (
                                    <span className="text-slate-400 font-medium">
                                      • {team.qualificationMath.summary}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Played */}
                          <td className="py-3.5 px-2 text-center font-mono font-bold text-slate-500">{team.played}</td>
                          
                          {/* Wins */}
                          <td className="py-3.5 px-2 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{team.won}</td>
                          
                          {/* Losses */}
                          <td className="py-3.5 px-2 text-center font-mono font-bold text-rose-500">{team.lost}</td>
                          
                          {/* Tied */}
                          <td className="py-3.5 px-2 text-center font-mono text-slate-400">{team.tied}</td>
                          
                          {/* No Result */}
                          <td className="py-3.5 px-2 text-center font-mono text-slate-400">{team.noResult || '-'}</td>

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
                          <td className="py-3.5 px-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {(!team.formGuide || team.formGuide.length === 0) ? (
                                <span className="text-[9px] text-slate-400 font-mono">-</span>
                              ) : (
                                team.formGuide.map((res, rIdx) => {
                                  const historyItem = team.matchHistory && team.matchHistory[rIdx];
                                  const matchObj = historyItem ? tournament.matches?.find(m => m.id === historyItem.matchId) : null;
                                  const tooltip = historyItem 
                                    ? `${res === 'W' ? 'Won vs' : res === 'L' ? 'Lost to' : res === 'T' ? 'Tied with' : 'No result vs'} ${historyItem.opponentName} (${historyItem.scoreSummary})${historyItem.margin ? ` • ${historyItem.margin}` : ''}`
                                    : `Match: ${res === 'W' ? 'Win' : res === 'L' ? 'Loss' : res === 'T' ? 'Tie' : 'No Result'}`;

                                  return (
                                    <button
                                      key={rIdx}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (matchObj && onOpenScorecard) {
                                          onOpenScorecard(matchObj);
                                        }
                                      }}
                                      className={`w-4 h-4 rounded-full text-[8.5px] font-black flex items-center justify-center text-white transition-transform hover:scale-125 border-none ${
                                        matchObj && onOpenScorecard ? 'cursor-pointer hover:ring-2 hover:ring-white/70 shadow-xs' : 'cursor-default'
                                      } ${
                                        res === 'W' ? 'bg-emerald-500 hover:bg-emerald-400' :
                                        res === 'L' ? 'bg-rose-500 hover:bg-rose-400' :
                                        res === 'T' ? 'bg-amber-500 hover:bg-amber-400' :
                                        'bg-slate-400'
                                      }`}
                                      title={tooltip}
                                    >
                                      {res}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </td>

                          {/* Dynamic Qualification Status Badge */}
                          <td className="py-3.5 px-2 text-center">
                            {qBadge && (
                              <span 
                                className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${qBadge.color}`}
                                title={qBadge.description}
                              >
                                {qBadge.code}
                              </span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>
          )}

          {/* Qualification Line Legend & Tiebreaker Note */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500" />
                <span>Positions 1 to {qualifyingThreshold}: Qualify for Playoffs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400/30 border border-amber-400" />
                <span>Positions 1 & 2: Qualify for Qualifier 1 (Double Chance)</span>
              </div>
            </div>
            <p className="text-2xs font-mono text-slate-400">
              Active Rule: {tieBreakerRule === 'icc_standard' ? 'ICC Standard (Points > Wins > NRR > H2H)' : 'Grassroots (Points > H2H > Wins > NRR)'}
            </p>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: HEAD-TO-HEAD MATRIX (CRICBUZZ / CRICHEROES) ===================== */}
      {viewMode === 'h2h_matrix' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 rounded-[2rem] p-4 sm:p-6 shadow-xl relative overflow-hidden text-left space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <Swords size={16} className="text-indigo-500" />
                <span>Head-to-Head Cross-Table Matrix</span>
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Results of each team (row) against every opponent (column). Shows wins, scores, and margins.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
              {standings.length} Teams Registered
            </span>
          </div>

          <div className="overflow-x-auto select-text -mx-2 sm:mx-0">
            <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-2.5 px-3 bg-slate-50 dark:bg-slate-950 font-black">Team</th>
                  {standings.map(t => (
                    <th key={t.id} className="py-2.5 px-2 text-center w-28 bg-slate-50 dark:bg-slate-950 truncate" title={t.name}>
                      <span className="block truncate">{t.shortName || t.name.slice(0, 4)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {standings.map(teamRow => (
                  <tr key={teamRow.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                    {/* Row header: Team Name */}
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-950/50">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-500 text-[9px] font-black flex items-center justify-center shrink-0">
                          {teamRow.shortName?.[0] || teamRow.name[0]}
                        </span>
                        <span className="truncate max-w-[120px]">{teamRow.name}</span>
                      </div>
                    </td>

                    {/* Column cells: Result against teamCol */}
                    {standings.map(teamCol => {
                      if (teamRow.id === teamCol.id) {
                        return (
                          <td key={teamCol.id} className="py-2.5 px-2 text-center bg-slate-100 dark:bg-slate-950/80 text-slate-300 dark:text-slate-700 font-mono select-none">
                            —
                          </td>
                        );
                      }

                      const h2hData: HeadToHeadSummary | undefined = h2hMatrix[teamRow.id]?.[teamCol.id];

                      if (!h2hData || h2hData.played === 0) {
                        return (
                          <td key={teamCol.id} className="py-2.5 px-2 text-center text-[10px] text-slate-400 font-mono">
                            <span className="text-[9px] text-slate-300 dark:text-slate-600">Upcoming</span>
                          </td>
                        );
                      }

                      // Team Row results vs Team Col
                      const winsRow = h2hData.winsA;
                      const winsCol = h2hData.winsB;
                      const lastMatch = h2hData.matches[h2hData.matches.length - 1];

                      return (
                        <td 
                          key={teamCol.id} 
                          className="py-2.5 px-2 text-center cursor-pointer hover:bg-indigo-500/10 transition-colors"
                          onClick={() => {
                            if (lastMatch && onOpenScorecard) {
                              const mObj = tournament.matches.find(m => m.id === lastMatch.matchId);
                              if (mObj) onOpenScorecard(mObj);
                            }
                          }}
                          title={`Click to open scorecard (${lastMatch?.scoreA || ''} vs ${lastMatch?.scoreB || ''})`}
                        >
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded font-mono ${
                              winsRow > winsCol 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                                : winsRow < winsCol 
                                  ? 'bg-rose-500/15 text-rose-500' 
                                  : 'bg-amber-500/15 text-amber-500'
                            }`}>
                              {winsRow} - {winsCol}
                            </span>
                            {lastMatch?.scoreA && (
                              <span className="text-[8.5px] font-mono text-slate-400 truncate max-w-[80px]">
                                {lastMatch.scoreA.split('/')[0]}-{lastMatch.scoreB.split('/')[0]}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== VIEW 3: TIEBREAKER LABORATORY ===================== */}
      {viewMode === 'tiebreaker_lab' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/60 rounded-[2rem] p-4 sm:p-6 shadow-xl relative overflow-hidden text-left space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <GitCompare size={16} className="text-amber-500" />
                <span>Head-to-Head & Tiebreaker Laboratory</span>
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                Directly compare any two teams to see who holds the advantage across all 5 official tiebreaker criteria.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
              Interactive Inspector
            </span>
          </div>

          {/* Team Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Squad A</label>
              <select
                value={compareTeamAId}
                onChange={e => setCompareTeamAId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {standings.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Pts: {t.points}, NRR: {t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase">Squad B</label>
              <select
                value={compareTeamBId}
                onChange={e => setCompareTeamBId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {standings.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Pts: {t.points}, NRR: {t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Side-by-side comparison cards */}
          {teamACompare && teamBCompare && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Team A Card */}
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white font-black flex items-center justify-center text-sm shadow-sm">
                      {teamACompare.shortName?.[0] || teamACompare.name[0]}
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-900 dark:text-white">{teamACompare.name}</h5>
                      <span className="text-[10px] text-slate-400 font-bold">Rank #{standings.findIndex(s => s.id === teamACompare.id) + 1}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Points</span>
                      <span className="text-sm font-black text-emerald-500 font-mono">{teamACompare.points}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Wins</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{teamACompare.won}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">NRR</span>
                      <span className="text-sm font-black text-sky-500 font-mono">{teamACompare.NRR > 0 ? `+${teamACompare.NRR.toFixed(3)}` : teamACompare.NRR.toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                {/* Team B Card */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                      {teamBCompare.shortName?.[0] || teamBCompare.name[0]}
                    </div>
                    <div>
                      <h5 className="font-black text-sm text-slate-900 dark:text-white">{teamBCompare.name}</h5>
                      <span className="text-[10px] text-slate-400 font-bold">Rank #{standings.findIndex(s => s.id === teamBCompare.id) + 1}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Points</span>
                      <span className="text-sm font-black text-emerald-500 font-mono">{teamBCompare.points}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">Wins</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white font-mono">{teamBCompare.won}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 block uppercase font-bold">NRR</span>
                      <span className="text-sm font-black text-sky-500 font-mono">{teamBCompare.NRR > 0 ? `+${teamBCompare.NRR.toFixed(3)}` : teamBCompare.NRR.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5-Step Tiebreaker Evaluation Table */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Tiebreaker Evaluation Checklist
                </span>

                <div className="space-y-2 text-xs">
                  {/* Metric 1: Points */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center">1</span>
                      <span className="font-bold">Total Points</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span>{teamACompare.points} vs {teamBCompare.points}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        teamACompare.points > teamBCompare.points ? 'bg-emerald-500/20 text-emerald-500' :
                        teamACompare.points < teamBCompare.points ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {teamACompare.points > teamBCompare.points ? `${teamACompare.shortName} Ahead` :
                         teamACompare.points < teamBCompare.points ? `${teamBCompare.shortName} Ahead` : 'TIED'}
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Head-to-Head */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center">2</span>
                      <span className="font-bold">Head-to-Head Record</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span>{compareH2H ? `${compareH2H.winsA} - ${compareH2H.winsB}` : '0 - 0'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        compareH2HAdv?.advantage === 'A' ? 'bg-emerald-500/20 text-emerald-500' :
                        compareH2HAdv?.advantage === 'B' ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {compareH2HAdv?.advantage === 'A' ? `${teamACompare.shortName} Won H2H` :
                         compareH2HAdv?.advantage === 'B' ? `${teamBCompare.shortName} Won H2H` : 'LEVEL / NONE'}
                      </span>
                    </div>
                  </div>

                  {/* Metric 3: Total Wins */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center">3</span>
                      <span className="font-bold">Total Wins</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span>{teamACompare.won} vs {teamBCompare.won}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        teamACompare.won > teamBCompare.won ? 'bg-emerald-500/20 text-emerald-500' :
                        teamACompare.won < teamBCompare.won ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {teamACompare.won > teamBCompare.won ? `${teamACompare.shortName} Ahead` :
                         teamACompare.won < teamBCompare.won ? `${teamBCompare.shortName} Ahead` : 'TIED'}
                      </span>
                    </div>
                  </div>

                  {/* Metric 4: Net Run Rate */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center">4</span>
                      <span className="font-bold">Net Run Rate (NRR)</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span>{teamACompare.NRR.toFixed(3)} vs {teamBCompare.NRR.toFixed(3)}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        teamACompare.NRR > teamBCompare.NRR ? 'bg-emerald-500/20 text-emerald-500' :
                        teamACompare.NRR < teamBCompare.NRR ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {teamACompare.NRR > teamBCompare.NRR ? `${teamACompare.shortName} Ahead (+${(teamACompare.NRR - teamBCompare.NRR).toFixed(3)})` :
                         teamACompare.NRR < teamBCompare.NRR ? `${teamBCompare.shortName} Ahead (+${(teamBCompare.NRR - teamACompare.NRR).toFixed(3)})` : 'TIED'}
                      </span>
                    </div>
                  </div>

                  {/* Metric 5: Total Runs Scored */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black flex items-center justify-center">5</span>
                      <span className="font-bold">Gross Runs Scored</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span>{teamACompare.runsScored} vs {teamBCompare.runsScored}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        teamACompare.runsScored > teamBCompare.runsScored ? 'bg-emerald-500/20 text-emerald-500' :
                        teamACompare.runsScored < teamBCompare.runsScored ? 'bg-rose-500/20 text-rose-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {teamACompare.runsScored > teamBCompare.runsScored ? `${teamACompare.shortName} Ahead` :
                         teamACompare.runsScored < teamBCompare.runsScored ? `${teamBCompare.shortName} Ahead` : 'TIED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== EXPANDED TEAM DEEP DIVE DETAILS DRAWER ===================== */}
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
                  {selectedTeamStats.name} — Standings & NRR Breakdown
                </h4>
                <p className="text-2xs text-slate-400 font-semibold">
                  Captain: {selectedTeamStats.captain || 'Unassigned'} • Status: <span className="text-emerald-500 font-bold uppercase">{selectedTeamStats.qualificationStatus}</span>
                  {selectedTeamStats.qualificationMath?.summary && (
                    <span className="text-slate-400 ml-2">({selectedTeamStats.qualificationMath.summary})</span>
                  )}
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
            <span className="text-emerald-400 font-bold uppercase text-[9px] block tracking-wider">Exact ICC NRR Formula Breakdown:</span>
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
                    <div 
                      key={m.id} 
                      onClick={() => onOpenScorecard && onOpenScorecard(m)}
                      className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-indigo-400 transition-colors"
                      title="Click to view scorecard"
                    >
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
                    Official Points Table & Tiebreaker Rules
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
                    3. Tie-Breaker Hierarchy Options
                  </h5>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-[11px]">
                    <p className="font-bold text-slate-800 dark:text-white">Option A: ICC / Cricbuzz Standard</p>
                    <p className="text-slate-500 dark:text-slate-400">1. Total Points ➔ 2. Total Wins ➔ 3. Net Run Rate (NRR) ➔ 4. Head-to-Head ➔ 5. Higher Gross Runs Scored</p>
                    <p className="font-bold text-slate-800 dark:text-white pt-1">Option B: CricHeroes / Grassroots Standard</p>
                    <p className="text-slate-500 dark:text-slate-400">1. Total Points ➔ 2. Head-to-Head Result ➔ 3. Total Wins ➔ 4. Net Run Rate (NRR)</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-white uppercase text-[11px] mb-1">
                    4. Mathematical Qualification Statuses
                  </h5>
                  <p>
                    <strong>Q (Qualified):</strong> Team mathematically cannot be passed by enough lower teams.<br />
                    <strong>TOP 2 (Qualifier 1):</strong> Team mathematically locked into top 2 seeds for double knockout chance.<br />
                    <strong>E (Eliminated):</strong> Maximum possible points cannot reach the cutoff spot threshold.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFormulaModal(false)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl border-none cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Path to Playoffs Scenario Modal */}
      <TournamentPlayoffScenarioModal
        isOpen={showPlayoffsModal}
        onClose={() => setShowPlayoffsModal(false)}
        tournament={tournament}
        qualifyingSpots={qualifyingThreshold}
      />
    </div>
  );
};
