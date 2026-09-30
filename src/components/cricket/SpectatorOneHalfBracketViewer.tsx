import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Users,
  Radio,
  Crown,
  Medal,
  Zap,
  Eye,
  X,
  Shield
} from 'lucide-react';
import { doc } from 'firebase/firestore';
import {
  db,
  safeOnSnapshot,
  subscribeToRealtimeDBOneHalfTournament
} from '../../lib/firebase';
import {
  ACTIVE_CLOUD_TOUR_ID,
  OneHalfTournamentState,
  OneHalfMatch,
  OneHalfTeam,
  createInitialOneHalfTournament
} from './OneHalfTournamentSuite';
import { getStatusBadgeConfig } from './OneHalfTimeSlotManager';
import { TournamentMatchScorecardModal } from './TournamentMatchScorecardModal';
import { isTournamentDeleted, isOneHalfTournamentDeleted } from './cricketStorage';

const STORAGE_KEY = 'cricket_one_half_tournament_32';

interface SpectatorOneHalfBracketViewerProps {
  allMatches?: any[];
  onSelectLiveMatch?: (matchId: string) => void;
  defaultDay?: 1 | 2 | 3 | 4 | 5;
  compact?: boolean;
}

export const SpectatorOneHalfBracketViewer: React.FC<SpectatorOneHalfBracketViewerProps> = ({
  allMatches = [],
  onSelectLiveMatch,
  defaultDay = 1,
  compact = false
}) => {
  const [activeDay, setActiveDay] = useState<1 | 2 | 3 | 4 | 5>(defaultDay);
  const [selectedScorecardMatch, setSelectedScorecardMatch] = useState<OneHalfMatch | null>(null);
  const [selectedSquadModalMatch, setSelectedSquadModalMatch] = useState<OneHalfMatch | null>(null);

  const [tournament, setTournament] = useState<OneHalfTournamentState>(() => {
    try {
      if (!isOneHalfTournamentDeleted()) {
        const raw =
          localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem('one_half_tournament_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0 && !isTournamentDeleted(parsed.id)) {
            return parsed;
          }
        }
      }
    } catch (_) {}
    return createInitialOneHalfTournament();
  });

  // Real-time synchronization with LocalStorage, Firestore, and Firebase Realtime DB (Read-Only)
  useEffect(() => {
    const loadFromLocal = () => {
      try {
        if (isOneHalfTournamentDeleted()) return;
        const raw =
          localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem('one_half_tournament_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.matches) && parsed.matches.length > 0 && !isTournamentDeleted(parsed.id)) {
            setTournament((prev) => {
              if ((parsed.updatedAt || 0) >= (prev.updatedAt || 0)) {
                return parsed;
              }
              return prev;
            });
          }
        }
      } catch (_) {}
    };

    loadFromLocal();

    const unsubRtdb = subscribeToRealtimeDBOneHalfTournament(ACTIVE_CLOUD_TOUR_ID, (remoteData) => {
      if (
        remoteData &&
        !remoteData.isDeleted &&
        Array.isArray(remoteData.matches) &&
        remoteData.matches.length > 0 &&
        !isTournamentDeleted(remoteData.id) &&
        !isOneHalfTournamentDeleted()
      ) {
        setTournament((prev) => {
          const remoteTime = remoteData.updatedAt || 0;
          const localTime = prev.updatedAt || 0;
          if (remoteTime >= localTime) {
            return remoteData as OneHalfTournamentState;
          }
          return prev;
        });
      }
    });

    const unsubFirestore = safeOnSnapshot(
      doc(db, 'cricket_tournaments', ACTIVE_CLOUD_TOUR_ID),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          if (
            data &&
            !data.isDeleted &&
            Array.isArray(data.matches) &&
            data.matches.length > 0 &&
            !isTournamentDeleted(data.id) &&
            !isOneHalfTournamentDeleted()
          ) {
            setTournament((prev) => {
              const remoteTime = data.updatedAt || 0;
              const localTime = prev.updatedAt || 0;
              if (remoteTime >= localTime) {
                return data as OneHalfTournamentState;
              }
              return prev;
            });
          }
        }
      },
      () => {}
    );

    const handleLocalUpdate = () => loadFromLocal();
    window.addEventListener('one_half_tournament_updated', handleLocalUpdate);
    window.addEventListener('gully_tournaments_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);

    return () => {
      try {
        unsubRtdb();
      } catch (_) {}
      try {
        unsubFirestore();
      } catch (_) {}
      window.removeEventListener('one_half_tournament_updated', handleLocalUpdate);
      window.removeEventListener('gully_tournaments_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
    };
  }, []);

  // Enrich tournament matches with live ball-by-ball scores from active scoreboard matches
  const enrichedMatches = useMemo(() => {
    return (tournament.matches || []).map((m) => {
      const liveMatch = allMatches.find(
        (am) =>
          (am.tournamentMatchId && am.tournamentMatchId === m.id) ||
          am.id === m.id ||
          am.id === `tour_${tournament.id}_${m.id}` ||
          (am.status === 'live' &&
            am.teamA?.toLowerCase().trim() === m.teamA?.toLowerCase().trim() &&
            am.teamB?.toLowerCase().trim() === m.teamB?.toLowerCase().trim())
      );

      if (!liveMatch) return m;

      let liveScoreA = m.scoreA;
      let liveOversA = m.oversA;
      let liveScoreB = m.scoreB;
      let liveOversB = m.oversB;

      const formatOvers = (balls: number = 0) => `${Math.floor(balls / 6)}.${balls % 6}`;

      if (liveMatch.innings1) {
        const bat1 = (liveMatch.innings1.battingTeam || '').toLowerCase().trim();
        if (bat1 === (m.teamA || '').toLowerCase().trim()) {
          liveScoreA = `${liveMatch.innings1.runs}/${liveMatch.innings1.wickets}`;
          liveOversA = formatOvers(liveMatch.innings1.ballsBowled);
        } else if (bat1 === (m.teamB || '').toLowerCase().trim()) {
          liveScoreB = `${liveMatch.innings1.runs}/${liveMatch.innings1.wickets}`;
          liveOversB = formatOvers(liveMatch.innings1.ballsBowled);
        }
      }

      if (liveMatch.innings2) {
        const bat2 = (liveMatch.innings2.battingTeam || '').toLowerCase().trim();
        if (bat2 === (m.teamA || '').toLowerCase().trim()) {
          liveScoreA = `${liveMatch.innings2.runs}/${liveMatch.innings2.wickets}`;
          liveOversA = formatOvers(liveMatch.innings2.ballsBowled);
        } else if (bat2 === (m.teamB || '').toLowerCase().trim()) {
          liveScoreB = `${liveMatch.innings2.runs}/${liveMatch.innings2.wickets}`;
          liveOversB = formatOvers(liveMatch.innings2.ballsBowled);
        }
      }

      return {
        ...m,
        status: liveMatch.status === 'live' ? 'live' : (m.status === 'completed' || liveMatch.status === 'completed' ? 'completed' : m.status),
        scoreA: liveScoreA || m.scoreA,
        oversA: liveOversA || m.oversA,
        scoreB: liveScoreB || m.scoreB,
        oversB: liveOversB || m.oversB,
        winner: m.winner || liveMatch.winner,
        winReason: m.winReason || liveMatch.winReason,
        manOfTheMatch: m.manOfTheMatch || liveMatch.manOfTheMatch,
        _linkedScoreboardMatchId: liveMatch.id
      } as OneHalfMatch & { _linkedScoreboardMatchId?: string };
    });
  }, [tournament.matches, tournament.id, allMatches]);

  const dayMatches = useMemo(
    () => enrichedMatches.filter((m) => m.day === activeDay),
    [enrichedMatches, activeDay]
  );

  const group1Qual = enrichedMatches.find((m) => m.id === 'day_1_final')?.winner || 'Pending Group 1';
  const group2Qual = enrichedMatches.find((m) => m.id === 'day_2_final')?.winner || 'Pending Group 2';
  const group3Qual = enrichedMatches.find((m) => m.id === 'day_3_final')?.winner || 'Pending Group 3';
  const group4Qual = enrichedMatches.find((m) => m.id === 'day_4_final')?.winner || 'Pending Group 4';

  const grandFinalMatch = enrichedMatches.find((m) => m.id === 'day_5_grand_final');
  const thirdFourthMatch = enrichedMatches.find((m) => m.id === 'day_5_third_fourth');

  const champion = grandFinalMatch?.winner || null;
  const runnerUp =
    grandFinalMatch?.winner
      ? grandFinalMatch.winner === grandFinalMatch.teamA
        ? grandFinalMatch.teamB
        : grandFinalMatch.teamA
      : null;
  const thirdPlace = thirdFourthMatch?.winner || null;
  const fourthPlace =
    thirdFourthMatch?.winner
      ? thirdFourthMatch.winner === thirdFourthMatch.teamA
        ? thirdFourthMatch.teamB
        : thirdFourthMatch.teamA
      : null;

  const handleOpenMatchView = (match: OneHalfMatch & { _linkedScoreboardMatchId?: string }) => {
    if (match._linkedScoreboardMatchId && onSelectLiveMatch) {
      onSelectLiveMatch(match._linkedScoreboardMatchId);
      return;
    }
    const foundInAll = allMatches.find(
      (am) =>
        (am.tournamentMatchId && am.tournamentMatchId === match.id) ||
        am.id === match.id ||
        am.id === `tour_${tournament.id}_${match.id}`
    );
    if (foundInAll && onSelectLiveMatch) {
      onSelectLiveMatch(foundInAll.id);
      return;
    }
    setSelectedScorecardMatch(match);
  };

  return (
    <div className="space-y-6">
      {/* Top Tournament Identity & Group Selector Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <Eye size={11} />
                Read-Only Spectator View • Live Sync
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                <Trophy size={11} />
                {tournament.overs} Overs • {tournament.ballType}
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              {tournament.name || 'One-Half 32-Team Knockout Championship'}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin size={12} className="text-emerald-400 shrink-0" />
              <span>{tournament.groundName || 'Main Championship Turf Arena'}</span>
            </p>
          </div>

          {/* Day / Group Tabs (Defaults to Day 1: Group 1 Knockout Bracket) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            {([1, 2, 3, 4, 5] as const).map((dayNum) => {
              const isSelected = activeDay === dayNum;
              const hasLiveInDay = enrichedMatches.some((m) => m.day === dayNum && m.status === 'live');
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setActiveDay(dayNum)}
                  className={`px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                    isSelected
                      ? dayNum === 5
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                        : 'bg-emerald-600 text-white shadow-md'
                      : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {hasLiveInDay && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  )}
                  <span>{dayNum === 5 ? '🏆 Day 5 Finals' : `Group ${dayNum} (Day ${dayNum})`}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Days 1 to 4: Group Knockout Bracket (8 Teams) */}
      {activeDay >= 1 && activeDay <= 4 ? (
        <div className="space-y-6">
          {/* Day Group Header Banner (Read-Only) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Calendar size={13} /> Day {activeDay} Group Knockout Schedule
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                Group {activeDay} Knockout Bracket (8 Teams)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4 Round 1 Matches ➔ 2 Group Semis ➔ 1 Group Final. The winner becomes the{' '}
                <strong>Day {activeDay} Qualifier</strong> for Day 5 Semis!
              </p>
            </div>

            {/* Qualifier Status Badge (Read-Only - No Admin Select Teams Button) */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="p-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-lg">
                  🏆
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                    Day {activeDay} Final Qualifier:
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                    {enrichedMatches.find((m) => m.id === `day_${activeDay}_final`)?.winner ||
                      'Pending Group Final...'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Knockout Bracket Visual Grid (3 Columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step 1: Round 1 (Pre-Quarters - 4 Matches) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-black">
                    1
                  </span>
                  Round 1 (Pre-Quarters)
                </span>
                <span className="text-[10px] font-mono text-slate-400 font-bold">4 Matches</span>
              </div>

              {dayMatches
                .filter((m) => m.round === 'round1')
                .map((match) => (
                  <SpectatorBracketMatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    onOpenScorecard={() => handleOpenMatchView(match)}
                    onOpenSquads={() => setSelectedSquadModalMatch(match)}
                  />
                ))}
            </div>

            {/* Step 2: Round 2 (Group Semi-Finals - 2 Matches) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-[10px] font-black">
                    2
                  </span>
                  Group Semi-Finals
                </span>
                <span className="text-[10px] font-mono text-indigo-400 font-bold">2 Matches</span>
              </div>

              {dayMatches
                .filter((m) => m.round === 'round2')
                .map((match) => (
                  <SpectatorBracketMatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    onOpenScorecard={() => handleOpenMatchView(match)}
                    onOpenSquads={() => setSelectedSquadModalMatch(match)}
                  />
                ))}
            </div>

            {/* Step 3: Round 3 (Group Final / Qualifier - 1 Match) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-black">
                    3
                  </span>
                  Group Final (Day {activeDay} Qualifier)
                </span>
                <span className="text-[10px] font-mono text-amber-500 font-bold">1 Winner Qualifies</span>
              </div>

              {dayMatches
                .filter((m) => m.round === 'group_final')
                .map((match) => (
                  <SpectatorBracketMatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    highlightFinal
                    onOpenScorecard={() => handleOpenMatchView(match)}
                    onOpenSquads={() => setSelectedSquadModalMatch(match)}
                  />
                ))}

              {/* Qualified Team Banner */}
              {enrichedMatches.find((m) => m.id === `day_${activeDay}_final`)?.winner && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/15 border border-emerald-500/40 text-center space-y-1.5">
                  <span className="text-2xl">🎉</span>
                  <strong className="text-sm font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                    {enrichedMatches.find((m) => m.id === `day_${activeDay}_final`)?.winner}
                  </strong>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Qualified for <strong>Day 5 Semi-Finals</strong> on Finals Day!
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveDay(5)}
                    className="mt-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer transition"
                  >
                    View Day 5 Finals Bracket ➔
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Group 8 Teams Roster Pill Strip (Read-Only) */}
          {!compact && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Users size={13} className="text-emerald-500" />
                  Group {activeDay} Competing Teams (8 Squads)
                </span>
                <span className="text-[9px] font-mono text-slate-400">Click any match to inspect squads</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {tournament.teams
                  .filter((t) => t.group === activeDay)
                  .map((team) => (
                    <div
                      key={team.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 block truncate">
                          {team.name}
                        </span>
                        {team.captain && (
                          <span className="text-[9px] text-slate-400 block truncate">
                            C: {team.captain}
                          </span>
                        )}
                      </div>
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                        {team.squad?.length || 15}P
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Day 5: Grand Finale Bracket (Read-Only) */
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 shadow-xl text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                  <Crown size={13} className="text-amber-400" />
                  GRAND FINALE • DAY 5
                </span>
                <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                  Semi-Finals, 3rd/4th Playoff & Grand Final
                </h2>
                <p className="text-xs text-slate-300 max-w-xl mt-1">
                  The 4 group qualifiers battle for all 4 tournament prizes. Semi-Final winners play the Grand Final for 1st & 2nd Prize, while losing semi-finalists play for 3rd & 4th Prize!
                </p>
              </div>

              {champion && (
                <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    🏆 TOURNAMENT CHAMPION
                  </span>
                  <strong className="text-sm sm:text-base font-black text-white">{champion}</strong>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Day 1 Qualifier (Group 1)
                </span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">
                  {group1Qual}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Day 2 Qualifier (Group 2)
                </span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">
                  {group2Qual}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Day 3 Qualifier (Group 3)
                </span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">
                  {group3Qual}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Day 4 Qualifier (Group 4)
                </span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">
                  {group4Qual}
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Zap size={14} />
                  Semi-Final Matches (Day 5)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Winners advance to Grand Final</span>
              </div>

              {dayMatches
                .filter((m) => m.round === 'semi_final')
                .map((match) => (
                  <SpectatorBracketMatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    onOpenScorecard={() => handleOpenMatchView(match)}
                    onOpenSquads={() => setSelectedSquadModalMatch(match)}
                  />
                ))}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    GRAND FINAL (1st & 2nd Prize)
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Champion decider</span>
                </div>

                {dayMatches
                  .filter((m) => m.round === 'grand_final')
                  .map((match) => (
                    <SpectatorBracketMatchCard
                      key={match.id}
                      match={match}
                      tournament={tournament}
                      highlightFinal
                      onOpenScorecard={() => handleOpenMatchView(match)}
                      onOpenSquads={() => setSelectedSquadModalMatch(match)}
                    />
                  ))}
              </div>

              <div className="space-y-2 pt-2">
                <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Medal size={14} className="text-rose-500" />
                    3rd & 4th Place Playoff
                  </span>
                  <span className="text-[10px] font-bold text-rose-500 uppercase">3rd & 4th Prizes</span>
                </div>

                {dayMatches
                  .filter((m) => m.round === 'third_fourth')
                  .map((match) => (
                    <SpectatorBracketMatchCard
                      key={match.id}
                      match={match}
                      tournament={tournament}
                      onOpenScorecard={() => handleOpenMatchView(match)}
                      onOpenSquads={() => setSelectedSquadModalMatch(match)}
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Prize Podium (Read-Only) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Trophy size={16} /> Official Tournament Prize Podium
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-400/40 text-center space-y-1">
                <span className="text-2xl">🥇</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                  1st Prize (Champion)
                </span>
                <strong className="text-sm font-black text-white block truncate">
                  {champion || 'Waiting Grand Final'}
                </strong>
                <span className="text-xs font-bold text-amber-400 block">{tournament.prize1st}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-400/40 text-center space-y-1">
                <span className="text-2xl">🥈</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">
                  2nd Prize (Runner-Up)
                </span>
                <strong className="text-sm font-black text-white block truncate">
                  {runnerUp || 'Waiting Grand Final'}
                </strong>
                <span className="text-xs font-bold text-slate-300 block">{tournament.prize2nd}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-700/20 to-amber-800/10 border border-amber-600/40 text-center space-y-1">
                <span className="text-2xl">🥉</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                  3rd Prize Winner
                </span>
                <strong className="text-sm font-black text-white block truncate">
                  {thirdPlace || 'Waiting 3rd/4th Match'}
                </strong>
                <span className="text-xs font-bold text-amber-400 block">{tournament.prize3rd}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-700/20 to-orange-800/10 border border-orange-500/40 text-center space-y-1">
                <span className="text-2xl">🏅</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300 block">
                  4th Prize (Runner)
                </span>
                <strong className="text-sm font-black text-white block truncate">
                  {fourthPlace || 'Waiting 3rd/4th Match'}
                </strong>
                <span className="text-xs font-bold text-orange-300 block">{tournament.prize4th}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Read-Only Full Scorecard Modal */}
      {selectedScorecardMatch && (
        <TournamentMatchScorecardModal
          isOpen={!!selectedScorecardMatch}
          onClose={() => setSelectedScorecardMatch(null)}
          match={selectedScorecardMatch}
          tournament={tournament}
          onLaunchLiveScorer={undefined}
        />
      )}

      {/* Read-Only Match Squads Viewer Modal */}
      {selectedSquadModalMatch && (
        <div
          className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedSquadModalMatch(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                  Official Registered Squads (Read-Only)
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {selectedSquadModalMatch.teamA} vs {selectedSquadModalMatch.teamB}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSquadModalMatch(null)}
                className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[selectedSquadModalMatch.teamA, selectedSquadModalMatch.teamB].map((teamName) => {
                const teamObj: OneHalfTeam | undefined = tournament.teams.find(
                  (t) => t.name.toLowerCase().trim() === teamName.toLowerCase().trim()
                );
                const squad = teamObj?.squad || [];

                return (
                  <div
                    key={teamName}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="text-xs font-black uppercase text-amber-400">{teamName}</h4>
                        {teamObj?.captain && (
                          <span className="text-[10px] text-slate-400 block">
                            Captain: {teamObj.captain}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {squad.length} Players
                      </span>
                    </div>

                    {squad.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        Team yet to be determined from preceding knockout round.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {squad.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/80"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[10px] font-mono text-slate-500 w-4">
                                {idx + 1}.
                              </span>
                              <span className="font-bold text-slate-200 truncate">{p.name}</span>
                              {p.isCaptain && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[8px] font-black uppercase">
                                  C
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">
                              {p.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SpectatorBracketMatchCardProps {
  match: OneHalfMatch & { _linkedScoreboardMatchId?: string };
  tournament: OneHalfTournamentState;
  highlightFinal?: boolean;
  onOpenScorecard: () => void;
  onOpenSquads: () => void;
}

const SpectatorBracketMatchCard: React.FC<SpectatorBracketMatchCardProps> = ({
  match,
  highlightFinal,
  onOpenScorecard,
  onOpenSquads
}) => {
  const isCompleted = match.status === 'completed' || !!match.winner;
  const isLive = match.status === 'live';
  const isWinnerA = match.winner && match.winner === match.teamA;
  const isWinnerB = match.winner && match.winner === match.teamB;
  const badge = getStatusBadgeConfig(match.status, match.delayMins);

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all ${
        isLive
          ? 'bg-gradient-to-br from-rose-500/10 via-slate-900 to-slate-950 border-rose-500/50 ring-1 ring-rose-500/30 shadow-lg'
          : highlightFinal
          ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-rose-950/20 border-amber-500/40 shadow-md'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
      }`}
    >
      {/* Top Match Header */}
      <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800/80">
        <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 truncate">
          M{match.matchNumber} • {match.label.split(' - ')[1] || match.label}
        </span>
        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md ${badge.bg}`}>
          {badge.label}
        </span>
      </div>

      {/* Time & Reporting Call Strip */}
      <div className="pt-2 pb-1 flex items-center justify-between text-[10px] font-mono">
        <span className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
          <Clock size={11} className="text-amber-500 shrink-0" />
          <span>{match.time || '08:30 AM'}</span>
        </span>
        <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
          <AlertTriangle size={10} className="shrink-0" />
          <span>Report: {match.reportingTime || '30m prior'}</span>
        </span>
      </div>

      {match.pitchVenue && (
        <div className="pb-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 truncate">
          <MapPin size={9} className="shrink-0" />
          <span className="truncate">{match.pitchVenue}</span>
        </div>
      )}

      {/* Teams Display (Read-Only) */}
      <div className="py-2 space-y-1.5">
        {/* Team A */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl transition ${
            isWinnerA
              ? 'bg-emerald-500/15 border border-emerald-500/30'
              : isCompleted && !isWinnerA
              ? 'opacity-60 bg-slate-50 dark:bg-slate-950'
              : 'bg-slate-50 dark:bg-slate-950'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {isWinnerA ? (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500 shrink-0">
                A
              </span>
            )}
            <span
              className={`text-xs font-black truncate ${
                isWinnerA
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {match.teamA}
            </span>
          </div>
          {match.scoreA && (
            <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-200 shrink-0">
              {match.scoreA}
              {match.oversA ? <span className="text-[9px] text-slate-400 ml-1">({match.oversA})</span> : ''}
            </span>
          )}
        </div>

        {/* Team B */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl transition ${
            isWinnerB
              ? 'bg-emerald-500/15 border border-emerald-500/30'
              : isCompleted && !isWinnerB
              ? 'opacity-60 bg-slate-50 dark:bg-slate-950'
              : 'bg-slate-50 dark:bg-slate-950'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {isWinnerB ? (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500 shrink-0">
                B
              </span>
            )}
            <span
              className={`text-xs font-black truncate ${
                isWinnerB
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {match.teamB}
            </span>
          </div>
          {match.scoreB && (
            <span className="text-xs font-mono font-black text-slate-700 dark:text-slate-200 shrink-0">
              {match.scoreB}
              {match.oversB ? <span className="text-[9px] text-slate-400 ml-1">({match.oversB})</span> : ''}
            </span>
          )}
        </div>
      </div>

      {/* Winner & Man of the Match Announcement if finished */}
      {isCompleted && match.winner && (
        <div className="pb-1.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center justify-between gap-1">
          <span className="flex items-center gap-1 truncate">
            <Trophy size={11} className="text-amber-500 shrink-0" />
            <span className="truncate">Winner: {match.winner}</span>
          </span>
          {match.manOfTheMatch && (
            <span className="text-[9px] text-amber-500 font-bold truncate">★ {match.manOfTheMatch}</span>
          )}
        </div>
      )}

      {/* Spectator Read-Only Action Bar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenScorecard}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer border-none ${
            isLive
              ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-sm'
              : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {isLive ? <Radio size={11} /> : <FileText size={11} />}
          <span>{isLive ? 'Watch Live Score' : 'View Scorecard'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSquads}
          className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border-none transition"
          title="View Team Squads (Read-Only)"
        >
          <Users size={11} className="text-emerald-500" />
          <span>Squads</span>
        </button>
      </div>
    </div>
  );
};
