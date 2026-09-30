import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { calculateWinProbabilityDetails } from './modules/winProbabilityEngine';
import { Users, Sparkles, CheckCircle2, Flame, TrendingUp, Vote } from 'lucide-react';

interface PollCounts {
  teamAVotes: number;
  teamBVotes: number;
  tieVotes: number;
  microOpt1: number;
  microOpt2: number;
  microOpt3: number;
  updatedAt?: number;
}

/**
 * Deterministic baseline crowd votes seeded from match ID + live score so a match
 * always has an engaging initial crowd pulse before and alongside live spectator votes.
 */
function getSeededBaselineVotes(match: any, aiProbA: number): PollCounts {
  const idStr = String(match?.id || match?.teamA || 'match');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) % 1000;
  }
  const baseTotal = 24 + (hash % 42);
  const ratioA = Math.min(0.88, Math.max(0.12, aiProbA / 100));
  const teamAVotes = Math.max(3, Math.round(baseTotal * ratioA));
  const teamBVotes = Math.max(3, baseTotal - teamAVotes);
  const tieVotes = Math.max(1, hash % 4);

  return {
    teamAVotes,
    teamBVotes,
    tieVotes,
    microOpt1: 6 + (hash % 9),
    microOpt2: 9 + ((hash >> 2) % 12),
    microOpt3: 11 + ((hash >> 3) % 15)
  };
}

export const SpectatorFanPollCard: React.FC<{
  match: any;
}> = ({ match }) => {
  const matchId = match?.id || 'default_match';
  const teamA = match?.teamA || 'Team A';
  const teamB = match?.teamB || 'Team B';

  // Calculate live AI Win Probability to compare against Crowd Poll
  const aiWinMetrics = useMemo(() => {
    try {
      return calculateWinProbabilityDetails(match);
    } catch {
      return null;
    }
  }, [
    match?.id,
    match?.status,
    match?.currentInningsNum,
    match?.targetRuns,
    match?.innings1?.runs,
    match?.innings1?.wickets,
    match?.innings1?.ballsBowled,
    match?.innings2?.runs,
    match?.innings2?.wickets,
    match?.innings2?.ballsBowled
  ]);

  const aiProbA = aiWinMetrics?.probA ?? 50;
  const aiProbB = aiWinMetrics?.probB ?? 50;

  const baseline = useMemo(
    () => getSeededBaselineVotes(match, aiProbA),
    [matchId, aiProbA]
  );

  const [remoteCounts, setRemoteCounts] = useState<Partial<PollCounts>>({});
  const [userVote, setUserVote] = useState<'teamA' | 'teamB' | 'tie' | null>(() => {
    try {
      return (localStorage.getItem(`gully_fan_poll_win_${matchId}`) as any) || null;
    } catch {
      return null;
    }
  });
  const [userMicroVote, setUserMicroVote] = useState<'opt1' | 'opt2' | 'opt3' | null>(() => {
    try {
      return (localStorage.getItem(`gully_fan_poll_micro_${matchId}`) as any) || null;
    } catch {
      return null;
    }
  });
  const [activePollTab, setActivePollTab] = useState<'winner' | 'prop'>('winner');
  const [justVotedPulse, setJustVotedPulse] = useState(false);

  // Subscribe to real-time Firestore fan poll document under /cricket_matches/{matchId}/fan_polls/live_poll
  useEffect(() => {
    if (!match?.id || !db) return;
    const pollRef = doc(db, 'cricket_matches', String(match.id), 'fan_polls', 'live_poll');
    const unsub = onSnapshot(
      pollRef,
      snap => {
        if (snap.exists()) {
          setRemoteCounts(snap.data() as Partial<PollCounts>);
        } else {
          setRemoteCounts({});
        }
      },
      () => {
        // Ignore permission/offline errors and rely on local state
      }
    );
    return () => unsub();
  }, [match?.id]);

  // Sync local storage when switching matches
  useEffect(() => {
    try {
      setUserVote((localStorage.getItem(`gully_fan_poll_win_${matchId}`) as any) || null);
      setUserMicroVote((localStorage.getItem(`gully_fan_poll_micro_${matchId}`) as any) || null);
    } catch {
      // ignore
    }
  }, [matchId]);

  const effectiveCounts = useMemo(() => {
    const a = baseline.teamAVotes + (Number(remoteCounts.teamAVotes) || 0) + (userVote === 'teamA' && !remoteCounts.teamAVotes ? 1 : 0);
    const b = baseline.teamBVotes + (Number(remoteCounts.teamBVotes) || 0) + (userVote === 'teamB' && !remoteCounts.teamBVotes ? 1 : 0);
    const t = baseline.tieVotes + (Number(remoteCounts.tieVotes) || 0) + (userVote === 'tie' && !remoteCounts.tieVotes ? 1 : 0);

    const m1 = baseline.microOpt1 + (Number(remoteCounts.microOpt1) || 0) + (userMicroVote === 'opt1' && !remoteCounts.microOpt1 ? 1 : 0);
    const m2 = baseline.microOpt2 + (Number(remoteCounts.microOpt2) || 0) + (userMicroVote === 'opt2' && !remoteCounts.microOpt2 ? 1 : 0);
    const m3 = baseline.microOpt3 + (Number(remoteCounts.microOpt3) || 0) + (userMicroVote === 'opt3' && !remoteCounts.microOpt3 ? 1 : 0);

    return {
      teamAVotes: Math.max(1, a),
      teamBVotes: Math.max(1, b),
      tieVotes: Math.max(0, t),
      microOpt1: Math.max(1, m1),
      microOpt2: Math.max(1, m2),
      microOpt3: Math.max(1, m3)
    };
  }, [baseline, remoteCounts, userVote, userMicroVote]);

  const totalWinVotes = effectiveCounts.teamAVotes + effectiveCounts.teamBVotes + effectiveCounts.tieVotes;
  const pctA = totalWinVotes > 0 ? Math.round((effectiveCounts.teamAVotes / totalWinVotes) * 100) : 50;
  const pctTie = totalWinVotes > 0 ? Math.round((effectiveCounts.tieVotes / totalWinVotes) * 100) : 0;
  const pctB = Math.max(0, 100 - pctA - pctTie);

  const totalMicroVotes = effectiveCounts.microOpt1 + effectiveCounts.microOpt2 + effectiveCounts.microOpt3;
  const microPct1 = totalMicroVotes > 0 ? Math.round((effectiveCounts.microOpt1 / totalMicroVotes) * 100) : 33;
  const microPct2 = totalMicroVotes > 0 ? Math.round((effectiveCounts.microOpt2 / totalMicroVotes) * 100) : 33;
  const microPct3 = Math.max(0, 100 - microPct1 - microPct2);

  const handleCastWinVote = async (choice: 'teamA' | 'teamB' | 'tie') => {
    if (userVote === choice) return;
    const prevChoice = userVote;
    setUserVote(choice);
    setJustVotedPulse(true);
    setTimeout(() => setJustVotedPulse(false), 1200);

    try {
      localStorage.setItem(`gully_fan_poll_win_${matchId}`, choice);
    } catch {
      // ignore
    }

    // Optimistic local state update
    setRemoteCounts(prev => {
      const next = { ...prev };
      const incField = choice === 'teamA' ? 'teamAVotes' : choice === 'teamB' ? 'teamBVotes' : 'tieVotes';
      next[incField] = (Number(next[incField]) || 0) + 1;
      if (prevChoice) {
        const decField = prevChoice === 'teamA' ? 'teamAVotes' : prevChoice === 'teamB' ? 'teamBVotes' : 'tieVotes';
        next[decField] = Math.max(0, (Number(next[decField]) || 1) - 1);
      }
      return next;
    });

    if (match?.id && db) {
      try {
        const pollRef = doc(db, 'cricket_matches', String(match.id), 'fan_polls', 'live_poll');
        const fieldToIncrement = choice === 'teamA' ? 'teamAVotes' : choice === 'teamB' ? 'teamBVotes' : 'tieVotes';
        const updates: Record<string, any> = {
          [fieldToIncrement]: increment(1),
          updatedAt: Date.now()
        };
        if (prevChoice) {
          const fieldToDecrement = prevChoice === 'teamA' ? 'teamAVotes' : prevChoice === 'teamB' ? 'teamBVotes' : 'tieVotes';
          updates[fieldToDecrement] = increment(-1);
        }
        await setDoc(pollRef, updates, { merge: true });
      } catch {
        // non-fatal
      }
    }
  };

  const handleCastMicroVote = async (choice: 'opt1' | 'opt2' | 'opt3') => {
    if (userMicroVote === choice) return;
    const prevChoice = userMicroVote;
    setUserMicroVote(choice);
    setJustVotedPulse(true);
    setTimeout(() => setJustVotedPulse(false), 1200);

    try {
      localStorage.setItem(`gully_fan_poll_micro_${matchId}`, choice);
    } catch {
      // ignore
    }

    setRemoteCounts(prev => {
      const next = { ...prev };
      const incField = choice === 'opt1' ? 'microOpt1' : choice === 'opt2' ? 'microOpt2' : 'microOpt3';
      next[incField] = (Number(next[incField]) || 0) + 1;
      if (prevChoice) {
        const decField = prevChoice === 'opt1' ? 'microOpt1' : prevChoice === 'opt2' ? 'microOpt2' : 'microOpt3';
        next[decField] = Math.max(0, (Number(next[decField]) || 1) - 1);
      }
      return next;
    });

    if (match?.id && db) {
      try {
        const pollRef = doc(db, 'cricket_matches', String(match.id), 'fan_polls', 'live_poll');
        const fieldToIncrement = choice === 'opt1' ? 'microOpt1' : choice === 'opt2' ? 'microOpt2' : 'microOpt3';
        const updates: Record<string, any> = {
          [fieldToIncrement]: increment(1),
          updatedAt: Date.now()
        };
        if (prevChoice) {
          const fieldToDecrement = prevChoice === 'opt1' ? 'microOpt1' : prevChoice === 'opt2' ? 'microOpt2' : 'microOpt3';
          updates[fieldToDecrement] = increment(-1);
        }
        await setDoc(pollRef, updates, { merge: true });
      } catch {
        // non-fatal
      }
    }
  };

  // Context-aware 2nd Poll ("Crease / Innings Prediction")
  const activeInnings = match?.currentInningsNum === 2 ? match?.innings2 : match?.innings1;
  const activeStriker = activeInnings?.batsmen?.[activeInnings?.strikerIndex ?? 0] || activeInnings?.batsmen?.[0];
  const strikerName = activeStriker?.name || 'the Striker';
  const strikerRuns = Number(activeStriker?.runs) || 0;

  const microPollConfig = useMemo(() => {
    if (match?.status === 'completed') {
      return {
        question: '🏆 How would you rate this match thriller?',
        opt1Label: '🔥 Instant Classic',
        opt2Label: '⚡ Clinical Dominance',
        opt3Label: '🎯 Tactical Battle'
      };
    }
    if (strikerRuns >= 35) {
      return {
        question: `🏏 Will ${strikerName} (${strikerRuns}*) reach a 50+ milestone this innings?`,
        opt1Label: `🚀 Yes, 50+ in style!`,
        opt2Label: `⚡ Stops in the 40s`,
        opt3Label: `🎯 Bowler strikes soon`
      };
    }
    return {
      question: `⚡ What happens in the next 2 overs for ${activeInnings?.battingTeam || teamA}?`,
      opt1Label: '🚀 20+ Runs Carnage',
      opt2Label: '⚖️ 10–19 Balanced Runs',
      opt3Label: '🔴 Wicket Falls!'
    };
  }, [match?.status, strikerName, strikerRuns, activeInnings?.battingTeam, teamA]);

  // Crowd vs AI comparison insight
  const crowdFavTeam = pctA >= pctB ? teamA : teamB;
  const crowdFavPct = pctA >= pctB ? pctA : pctB;
  const aiFavTeam = aiProbA >= aiProbB ? teamA : teamB;
  const aiFavPct = Math.round(aiProbA >= aiProbB ? aiProbA : aiProbB);
  const deltaDiff = Math.abs(pctA - Math.round(aiProbA));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.25rem] p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
              <Vote className="w-3 h-3 text-rose-500" />
              INTERACTIVE FAN POLL • CROWD PULSE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-500" />
              {activePollTab === 'winner' ? totalWinVotes : totalMicroVotes} Fans Voted
            </span>
          </div>
          <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight mt-1">
            🗳️ {activePollTab === 'winner' ? 'Who Will Win This Match?' : microPollConfig.question}
          </h4>
        </div>

        {/* Poll Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActivePollTab('winner')}
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border-none cursor-pointer transition-all ${
              activePollTab === 'winner'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            🏆 Who Will Win?
          </button>
          <button
            type="button"
            onClick={() => setActivePollTab('prop')}
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border-none cursor-pointer transition-all ${
              activePollTab === 'prop'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            ⚡ Live Prediction
          </button>
        </div>
      </div>

      {activePollTab === 'winner' ? (
        <div className="space-y-4">
          {/* 1-Click Fan Vote Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Team A Vote Button */}
            <button
              type="button"
              onClick={() => handleCastWinVote('teamA')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                userVote === 'teamA'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-md scale-[1.01]'
                  : 'bg-slate-50 dark:bg-slate-950/90 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {userVote === 'teamA' ? '✅ YOUR PICK' : 'TAP TO VOTE'}
                  </span>
                </div>
                <div className="font-black text-sm sm:text-base truncate mt-0.5">{teamA}</div>
                <span className="text-[9.5px] font-mono text-slate-400">{effectiveCounts.teamAVotes} votes</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-xl sm:text-2xl text-emerald-500">{pctA}%</span>
              </div>
            </button>

            {/* Tie / Thriller Vote Button */}
            <button
              type="button"
              onClick={() => handleCastWinVote('tie')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                userVote === 'tie'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-md scale-[1.01]'
                  : 'bg-slate-50 dark:bg-slate-950/90 border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    {userVote === 'tie' ? '✅ YOUR PICK' : 'SUPER OVER / TIE'}
                  </span>
                </div>
                <div className="font-black text-sm sm:text-base truncate mt-0.5">🤝 Tie / Super Over</div>
                <span className="text-[9.5px] font-mono text-slate-400">{effectiveCounts.tieVotes} votes</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-xl sm:text-2xl text-amber-500">{pctTie}%</span>
              </div>
            </button>

            {/* Team B Vote Button */}
            <button
              type="button"
              onClick={() => handleCastWinVote('teamB')}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                userVote === 'teamB'
                  ? 'bg-indigo-500/15 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-md scale-[1.01]'
                  : 'bg-slate-50 dark:bg-slate-950/90 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {userVote === 'teamB' ? '✅ YOUR PICK' : 'TAP TO VOTE'}
                  </span>
                </div>
                <div className="font-black text-sm sm:text-base truncate mt-0.5">{teamB}</div>
                <span className="text-[9.5px] font-mono text-slate-400">{effectiveCounts.teamBVotes} votes</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono font-black text-xl sm:text-2xl text-indigo-500">{pctB}%</span>
              </div>
            </button>
          </div>

          {/* Stacked Comparison Bars: Crowd Meter vs AI Win Probability */}
          <div className="p-3.5 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-3">
            {/* Bar 1: Fan Crowd Meter */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider">
                <span className="text-emerald-400">
                  👥 Crowd: {teamA} ({pctA}%)
                </span>
                <span className="text-amber-300 text-[8.5px]">
                  {justVotedPulse ? '🎉 Vote Recorded Live!' : '🗳️ Fan Crowd Meter'}
                </span>
                <span className="text-indigo-400">
                  {teamB} ({pctB}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  style={{ width: `${pctA}%` }}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                />
                {pctTie > 0 && (
                  <div
                    style={{ width: `${pctTie}%` }}
                    className="bg-amber-400 h-full transition-all duration-500"
                  />
                )}
                <div
                  style={{ width: `${pctB}%` }}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Bar 2: AI Win Probability Model */}
            <div className="space-y-1 pt-1 border-t border-white/10">
              <div className="flex items-center justify-between text-[9.5px] font-black uppercase tracking-wider">
                <span className="text-emerald-300/90">
                  🤖 AI Model: {teamA} ({Math.round(aiProbA)}%)
                </span>
                <span className="text-sky-400 text-[8.5px]">⚡ Live AI Win Probability</span>
                <span className="text-indigo-300/90">
                  {teamB} ({Math.round(aiProbB)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex opacity-90">
                <div
                  style={{ width: `${Math.round(aiProbA)}%` }}
                  className="bg-emerald-500/75 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${Math.round(aiProbB)}%` }}
                  className="bg-indigo-500/75 h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Crowd vs AI Verdict Strip */}
            <div className="pt-1 flex items-center justify-between gap-2 flex-wrap text-[9.5px] text-slate-300 font-medium">
              <span>
                {crowdFavTeam === aiFavTeam ? (
                  <>
                    🤝 <strong className="text-white">Consensus Pick:</strong> Both the Fan Crowd ({crowdFavPct}%) and AI Model ({aiFavPct}%) back{' '}
                    <strong className="text-amber-400">{crowdFavTeam}</strong>!
                  </>
                ) : (
                  <>
                    🔥 <strong className="text-amber-400">Crowd Upset Alert:</strong> Fans back{' '}
                    <strong className="text-white">{crowdFavTeam} ({crowdFavPct}%)</strong> while the AI Model favors{' '}
                    <strong className="text-sky-300">{aiFavTeam} ({aiFavPct}%)</strong>!
                  </>
                )}
              </span>
              {deltaDiff >= 8 && (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold text-[8.5px]">
                  ±{deltaDiff}% Crowd vs AI Delta
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Live Over / Crease Prop Prediction Poll */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'opt1' as const, label: microPollConfig.opt1Label, pct: microPct1, votes: effectiveCounts.microOpt1, color: 'emerald' },
              { id: 'opt2' as const, label: microPollConfig.opt2Label, pct: microPct2, votes: effectiveCounts.microOpt2, color: 'amber' },
              { id: 'opt3' as const, label: microPollConfig.opt3Label, pct: microPct3, votes: effectiveCounts.microOpt3, color: 'rose' }
            ].map(item => {
              const isSelected = userMicroVote === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCastMicroVote(item.id)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-500/15 border-indigo-500 text-slate-900 dark:text-white shadow-md'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs sm:text-sm">{item.label}</span>
                    <span className="font-mono font-black text-base sm:text-lg text-indigo-500">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${item.pct}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-amber-500 transition-all duration-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                    <span>{item.votes} fan votes</span>
                    {isSelected && <span className="text-emerald-500 font-black uppercase">✅ Voted</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
