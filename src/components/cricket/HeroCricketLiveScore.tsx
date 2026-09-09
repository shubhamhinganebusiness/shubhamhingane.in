import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  Trophy, 
  ArrowRight, 
  Flame, 
  Eye, 
  Play, 
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import { MatchState } from './CricketScoreboard';
import { 
  getActiveMatch, 
  getLocalMatches, 
  isMatchDeleted, 
  markMatchDeleted, 
  unmarkMatchDeleted, 
  pruneDeletedMatchesFromStorage,
  saveMatchToRegistry,
  getAnyActiveOrRecentMatch,
  isDemoOrAIMatch
} from './cricketStorage';
import { db, rtdb } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ref as rtdbRef, onValue as rtdbOnValue } from 'firebase/database';
import { useAuth } from '../AuthContext';

export const HeroCricketLiveScore: React.FC = () => {
  const navigate = useNavigate();
  const { isScoreManager } = useAuth();
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [recentCompletedMatches, setRecentCompletedMatches] = useState<MatchState[]>([]);
  const [matchIndex, setMatchIndex] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Safely open detailed scoreboard directly in the Homepage Spectator Scoreboard Section
  const handleOpenDetailScoreboard = (matchId?: string) => {
    let targetMatch = (matchId ? (liveMatches.find(m => m.id === matchId) || recentCompletedMatches.find(m => m.id === matchId)) : null) 
      || activeMatch 
      || (liveMatches.length > 0 ? liveMatches[0] : null) 
      || (recentCompletedMatches.length > 0 ? recentCompletedMatches[0] : null)
      || getActiveMatch();

    if (!targetMatch) {
      targetMatch = getAnyActiveOrRecentMatch();
    }

    const targetId = matchId || targetMatch?.id || '';

    if (targetMatch && targetMatch.id) {
      unmarkMatchDeleted(targetMatch.id);
      saveMatchToRegistry(targetMatch);
      try {
        localStorage.setItem('cricket_active_match', JSON.stringify(targetMatch));
        sessionStorage.setItem('last_selected_match_id', targetMatch.id);
      } catch (_) {}
    }

    if (targetId) {
      unmarkMatchDeleted(targetId);
      // Notify SpectatorScoreboardSection on the homepage to select this match
      window.dispatchEvent(new CustomEvent('cricket_select_match', { detail: { matchId: targetId } }));
    }

    // Smooth scroll down to the homepage spectator-hub section
    const spectatorEl = document.getElementById('spectator-hub');
    if (spectatorEl) {
      spectatorEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback if not on homepage
      navigate(`/#spectator-hub`);
      setTimeout(() => {
        const el = document.getElementById('spectator-hub');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  // Synchronize live and completed matches from LocalStorage, Firestore, and Realtime Database
  useEffect(() => {
    // 1. Initial local match check
    const loadInitialLocal = () => {
      try {
        const activeLocal = getActiveMatch();
        const registry = getLocalMatches();
        const activeList: MatchState[] = [];
        const completedList: MatchState[] = [];

        if (activeLocal && !isMatchDeleted(activeLocal.id) && !isDemoOrAIMatch(activeLocal)) {
          unmarkMatchDeleted(activeLocal.id);
          if (activeLocal.status === 'live') {
            activeList.push(activeLocal);
          } else if (activeLocal.status === 'completed') {
            completedList.push(activeLocal);
          }
        }

        registry.forEach(m => {
          if (!isMatchDeleted(m.id) && !isDemoOrAIMatch(m)) {
            unmarkMatchDeleted(m.id);
            if (m.status === 'live' && !activeList.some(a => a.id === m.id)) {
              activeList.push(m);
            } else if (m.status === 'completed' && !completedList.some(c => c.id === m.id)) {
              completedList.push(m);
            }
          }
        });

        if (activeList.length > 0) {
          setLiveMatches(activeList);
        }
        if (completedList.length > 0) {
          completedList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setRecentCompletedMatches(completedList);
        }
      } catch (err) {
        console.warn('[HeroCricketLiveScore] Local check error:', err);
      }
    };

    loadInitialLocal();

    // 2. Real-time Firestore Listener
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(collection(db, 'cricket_matches'), (snapshot) => {
        const active: MatchState[] = [];
        const completed: MatchState[] = [];
        const remoteIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MatchState;
          const m = { ...data, id: data.id || docSnap.id };

          if (m.status === 'deleted' || (m as any).isDeleted === true) {
            markMatchDeleted(m.id);
            return;
          }

          if (isDemoOrAIMatch(m)) {
            return;
          }

          unmarkMatchDeleted(m.id);

          if (m.status === 'live' && !(m as any).isHidden && !(m as any).isBlocked) {
            active.push(m);
          } else if (m.status === 'completed' && !(m as any).isHidden && !(m as any).isBlocked) {
            completed.push(m);
          }
          remoteIds.add(m.id);
        });

        pruneDeletedMatchesFromStorage(remoteIds);

        // Include any active local matches that might be in progress locally
        const activeLocal = getActiveMatch();
        const registry = getLocalMatches();
        const localLive: MatchState[] = [];
        const localCompleted: MatchState[] = [];

        if (activeLocal && !(activeLocal as any).isDeleted && !isDemoOrAIMatch(activeLocal)) {
          if (activeLocal.status === 'live') localLive.push(activeLocal);
          else if (activeLocal.status === 'completed') localCompleted.push(activeLocal);
        }
        registry.forEach(lm => {
          if (!(lm as any).isDeleted && !isDemoOrAIMatch(lm)) {
            if (lm.status === 'live' && !localLive.some(a => a.id === lm.id)) {
              localLive.push(lm);
            } else if (lm.status === 'completed' && !localCompleted.some(c => c.id === lm.id)) {
              localCompleted.push(lm);
            }
          }
        });

        const combinedLiveMap = new Map<string, MatchState>();
        active.forEach(m => combinedLiveMap.set(m.id, m));
        localLive.forEach(lm => {
          if (!combinedLiveMap.has(lm.id)) {
            combinedLiveMap.set(lm.id, lm);
          }
        });

        const combinedCompletedMap = new Map<string, MatchState>();
        completed.forEach(m => combinedCompletedMap.set(m.id, m));
        localCompleted.forEach(cm => {
          if (!combinedCompletedMap.has(cm.id)) {
            combinedCompletedMap.set(cm.id, cm);
          }
        });

        const combinedLive = Array.from(combinedLiveMap.values());
        combinedLive.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const combinedCompleted = Array.from(combinedCompletedMap.values());
        combinedCompleted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        setLiveMatches(combinedLive);
        setRecentCompletedMatches(combinedCompleted);
        setLastUpdated(Date.now());
      }, (err) => {
        console.warn('[HeroCricketLiveScore] Firestore stream:', err);
      });
    } catch (e) {
      console.warn('[HeroCricketLiveScore] Firestore setup:', e);
    }

    // 3. Real-time Database (RTDB) listener for active & completed updates
    let unsubRtdb: (() => void) | null = null;
    let unsubCompletedRtdb: (() => void) | null = null;
    try {
      const activeMatchRef = rtdbRef(rtdb, 'cricket_active_match');
      unsubRtdb = rtdbOnValue(activeMatchRef, (snapshot) => {
        const val = snapshot.val();
        if (val && !isMatchDeleted(val.id) && !isDemoOrAIMatch(val)) {
          if (val.status === 'live') {
            setLiveMatches(prev => {
              const exists = prev.some(m => m.id === val.id);
              if (exists) {
                return prev.map(m => m.id === val.id ? { ...m, ...val } : m);
              }
              return [val, ...prev];
            });
          } else if (val.status === 'completed') {
            setLiveMatches(prev => prev.filter(m => m.id !== val.id));
            setRecentCompletedMatches(prev => {
              const exists = prev.some(m => m.id === val.id);
              if (exists) {
                return prev.map(m => m.id === val.id ? { ...m, ...val } : m);
              }
              return [val, ...prev];
            });
          }
          setLastUpdated(Date.now());
        }
      }, (error) => {
        console.warn('[HeroCricketLiveScore] RTDB sync warning:', error);
      });

      const completedMatchRef = rtdbRef(rtdb, 'cricket_last_completed_match');
      unsubCompletedRtdb = rtdbOnValue(completedMatchRef, (snapshot) => {
        const val = snapshot.val();
        if (val && !isMatchDeleted(val.id) && !isDemoOrAIMatch(val)) {
          const matchObj = val.match || val;
          if (isDemoOrAIMatch(matchObj)) return;
          setRecentCompletedMatches(prev => {
            const exists = prev.some(m => m.id === matchObj.id);
            if (exists) {
              return prev.map(m => m.id === matchObj.id ? { ...m, ...matchObj } : m);
            }
            return [matchObj, ...prev];
          });
          setLiveMatches(prev => prev.filter(m => m.id !== matchObj.id));
          setLastUpdated(Date.now());
        }
      });
    } catch (e) {
      console.warn('[HeroCricketLiveScore] RTDB sync listener:', e);
    }

    // 4. In-window CustomEvent & Storage listener
    const handleUpdate = (e: any) => {
      const match = e?.detail?.match as MatchState;
      if (match && !isMatchDeleted(match.id) && !isDemoOrAIMatch(match)) {
        if (match.status === 'live') {
          setLiveMatches(prev => {
            const filtered = prev.filter(m => m.id !== match.id);
            return [match, ...filtered];
          });
        } else if (match.status === 'completed') {
          setLiveMatches(prev => prev.filter(m => m.id !== match.id));
          setRecentCompletedMatches(prev => {
            const filtered = prev.filter(m => m.id !== match.id);
            return [match, ...filtered];
          });
        }
        setLastUpdated(Date.now());
      } else if (match && (match.status === 'deleted' || (match as any).isDeleted)) {
        setLiveMatches(prev => prev.filter(m => m.id !== match.id));
        setRecentCompletedMatches(prev => prev.filter(m => m.id !== match.id));
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cricket_active_match' || e.key === 'cricket_matches_local_registry') {
        loadInitialLocal();
      }
    };

    window.addEventListener('cricket_match_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      if (unsubFirestore) unsubFirestore();
      if (unsubRtdb) unsubRtdb();
      if (unsubCompletedRtdb) unsubCompletedRtdb();
      window.removeEventListener('cricket_match_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const activeMatch = useMemo(() => {
    if (liveMatches.length === 0) return null;
    return liveMatches[matchIndex % liveMatches.length] || liveMatches[0];
  }, [liveMatches, matchIndex]);

  // Derived scoring calculations
  const matchDetails = useMemo(() => {
    if (!activeMatch) return null;

    const innings = activeMatch.currentInningsNum === 1 ? activeMatch.innings1 : activeMatch.innings2;
    const battingTeam = innings?.battingTeam || activeMatch.teamA;
    const bowlingTeam = innings?.bowlingTeam || activeMatch.teamB;
    const runs = innings?.runs ?? 0;
    const wickets = innings?.wickets ?? 0;
    const balls = innings?.ballsBowled ?? 0;
    const completedOvers = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    const oversStr = `${completedOvers}.${ballsInOver}`;
    const maxOvers = activeMatch.oversLimit || 5;
    const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

    const isSecondInnings = activeMatch.currentInningsNum === 2;
    const target = isSecondInnings ? (activeMatch.innings1?.runs ?? 0) + 1 : 0;
    const runsNeeded = target - runs;
    const totalBalls = maxOvers * 6;
    const ballsRemaining = Math.max(0, totalBalls - balls);
    const rrr = isSecondInnings && ballsRemaining > 0 ? ((Math.max(0, runsNeeded) / ballsRemaining) * 6).toFixed(2) : null;

    // Striker Batsman
    const striker = innings?.batsmen && innings.strikerIndex !== undefined && innings.strikerIndex >= 0 
      ? innings.batsmen[innings.strikerIndex] 
      : null;

    // Non-Striker Batsman
    const nonStriker = innings?.batsmen && innings.nonStrikerIndex !== undefined && innings.nonStrikerIndex >= 0 
      ? innings.batsmen[innings.nonStrikerIndex] 
      : null;

    // Current Bowler
    const currentBowler = innings?.bowlers && innings.currentBowlerIndex !== undefined && innings.currentBowlerIndex >= 0 
      ? innings.bowlers[innings.currentBowlerIndex] 
      : null;

    // Recent deliveries in current over
    let recentBalls: string[] = [];
    if (balls > 0) {
      if ((innings as any)?.recentBalls && Array.isArray((innings as any).recentBalls)) {
        recentBalls = (innings as any).recentBalls.slice(-6).map((b: any) => {
          if (typeof b === 'string') return b;
          if (b?.isWicket) return 'W';
          if (b?.runs !== undefined) return `${b.runs}`;
          return '•';
        });
      } else if (innings?.history && Array.isArray(innings.history)) {
        recentBalls = innings.history.slice(-6).map(h => {
          if (h.isWicket) return 'W';
          if (h.isExtra) return h.extraType ? h.extraType.charAt(0).toUpperCase() : 'Ex';
          return `${h.runsScored}`;
        });
      }
    }

    return {
      innings,
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      balls,
      oversStr,
      maxOvers,
      crr,
      isSecondInnings,
      target,
      runsNeeded,
      ballsRemaining,
      rrr,
      striker,
      nonStriker,
      currentBowler,
      recentBalls
    };
  }, [activeMatch]);

  // If a match is LIVE, render the ultra-modern, attractive broadcast scoreboard card
  if (activeMatch && activeMatch.status === 'live' && matchDetails) {
    const {
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      oversStr,
      maxOvers,
      crr,
      isSecondInnings,
      target,
      runsNeeded,
      ballsRemaining,
      rrr,
      striker,
      nonStriker,
      currentBowler
    } = matchDetails;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full max-w-xl mb-6 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-white border border-emerald-500/40 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl ring-1 ring-white/10 select-none group"
      >
        {/* Stadium ambient light beam */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Card Header: Live Pulse & Stadium Tag */}
        <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <Radio size={11} className="animate-pulse text-emerald-400" />
              LIVE MATCH
            </span>
          </div>

          <div className="flex items-center gap-2">
            {liveMatches.length > 1 && (
              <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setMatchIndex(prev => (prev > 0 ? prev - 1 : liveMatches.length - 1))}
                  className="text-slate-400 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                  aria-label="Previous live match"
                >
                  ◀
                </button>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {matchIndex + 1}/{liveMatches.length}
                </span>
                <button
                  type="button"
                  onClick={() => setMatchIndex(prev => (prev + 1) % liveMatches.length)}
                  className="text-slate-400 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                  aria-label="Next live match"
                >
                  ▶
                </button>
              </div>
            )}

            {/* ONLY authenticated scoreboard manager can access manager console */}
            {isScoreManager && (
              <button
                type="button"
                onClick={() => navigate('/live/cricket-scoreboard')}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Scorekeeper Management Console (Score Managers Only)"
              >
                <Shield size={11} className="text-emerald-400" />
                <span>Scorer Hub</span>
              </button>
            )}
          </div>
        </div>

        {/* Card Body: Live Teams & High-Impact Score */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Team Crests & Names */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[0.85rem] flex items-center justify-center font-black text-white text-base">
                    {battingTeam.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-950">
                  🏏
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                    {battingTeam}
                  </span>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Batting
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400 truncate">
                  vs <strong className="text-slate-300 font-bold">{bowlingTeam}</strong>
                </span>
              </div>
            </div>

            {/* Score Digits Display */}
            <div className="text-right shrink-0 flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                  {runs}/{wickets}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 mt-0.5 font-mono">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{oversStr}/{maxOvers} Ov</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300">CRR {crr}</span>
              </div>
            </div>
          </div>

          {/* Chase Equation / Target Bar (if 2nd innings) */}
          {isSecondInnings && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex flex-wrap items-center justify-between gap-1 shadow-inner">
              <span>Target: <strong className="text-white">{target}</strong></span>
              <span>
                {runsNeeded <= 0 ? (
                  <span className="text-emerald-400 font-black">🏆 Target Achieved!</span>
                ) : (
                  <>Need <strong className="text-white">{runsNeeded}</strong> runs in <strong className="text-white">{ballsRemaining}</strong> balls</>
                )}
              </span>
              {rrr && runsNeeded > 0 && (
                <span className="text-amber-200/90 font-mono text-[11px]">RRR: {rrr}</span>
              )}
            </div>
          )}

          {/* Active Batsmen (Striker & Non-Striker) Spotlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
            {/* Striker */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-emerald-500/30">
              <div className="flex items-center gap-2 truncate">
                <span className="text-emerald-400 text-sm">🏏</span>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {striker?.name || 'Active Batsman'}*
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Striker</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {striker?.runs ?? 0} <span className="text-[10px] text-slate-400 font-normal">({striker?.balls ?? 0}b)</span>
              </span>
            </div>

            {/* Non-Striker */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 text-sm">🏏</span>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {nonStriker?.name || 'Non-Striker'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Non-Striker</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {nonStriker?.runs ?? 0} <span className="text-[10px] text-slate-400 font-normal">({nonStriker?.balls ?? 0}b)</span>
              </span>
            </div>
          </div>

          {/* Bowler Details */}
          {currentBowler && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-teal-400 text-sm">🎯</span>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {currentBowler?.name || 'Active Bowler'}
                  </span>
                  <span className="text-[10px] text-teal-300/90 bg-teal-500/15 border border-teal-500/20 px-1.5 py-0.5 rounded">Current Bowler</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {currentBowler?.wickets ?? 0}/{currentBowler?.runsConceded ?? 0}
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({currentBowler?.overs ?? '0.0'} ov)
                </span>
              </span>
            </div>
          )}

          {/* Modern Action Button: Direct to Homepage Spectator Scoreboard Section */}
          <div className="pt-2">
            <button
              id="hero-view-detail-scoreboard-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailScoreboard(activeMatch?.id);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-none"
              title="View full detailed scorecard in the Spectator Scoreboard Section"
            >
              <span>View Detail Scoreboard</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // If NO match is currently live:
  // Directly show the match score card only if match is live; do not show any notification or placeholder card.
  return null;
};

