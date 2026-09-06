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
  ChevronRight, 
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { MatchState } from './CricketScoreboard';
import { getActiveMatch, getLocalMatches, isMatchDeleted, markMatchDeleted, pruneDeletedMatchesFromStorage } from './cricketStorage';
import { db, rtdb } from '../../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ref as rtdbRef, onValue as rtdbOnValue } from 'firebase/database';

export const HeroCricketLiveScore: React.FC = () => {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [matchIndex, setMatchIndex] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Synchronize live matches from LocalStorage, Firestore, and Realtime Database
  useEffect(() => {
    // 1. Initial local match check
    const loadInitialLocal = () => {
      try {
        const activeLocal = getActiveMatch();
        const registry = getLocalMatches();
        const activeList: MatchState[] = [];

        if (activeLocal && activeLocal.status === 'live' && !isMatchDeleted(activeLocal.id)) {
          activeList.push(activeLocal);
        }

        registry.forEach(m => {
          if (m.status === 'live' && !isMatchDeleted(m.id) && !activeList.some(a => a.id === m.id)) {
            activeList.push(m);
          }
        });

        if (activeList.length > 0) {
          setLiveMatches(activeList);
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
        const remoteIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MatchState;
          const m = { ...data, id: data.id || docSnap.id };

          if (m.status === 'deleted' || (m as any).isDeleted === true || isMatchDeleted(m.id)) {
            markMatchDeleted(m.id);
            return;
          }

          if (m.status === 'live' && !(m as any).isHidden && !(m as any).isBlocked) {
            active.push(m);
          }
          remoteIds.add(m.id);
        });

        pruneDeletedMatchesFromStorage(remoteIds);
        active.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        if (active.length > 0) {
          setLiveMatches(active);
          setLastUpdated(Date.now());
        } else {
          // Fallback to local active match if Firestore returned empty but local has live
          const local = getActiveMatch();
          if (local && local.status === 'live' && !isMatchDeleted(local.id)) {
            setLiveMatches([local]);
          } else {
            setLiveMatches([]);
          }
        }
      }, (err) => {
        console.warn('[HeroCricketLiveScore] Firestore snapshot error:', err);
      });
    } catch (e) {
      console.warn('[HeroCricketLiveScore] Firestore init error:', e);
    }

    // 3. Realtime Database Listener for dual-sync WebSocket updates
    let unsubRtdb: (() => void) | null = null;
    try {
      if (rtdb) {
        const matchesRef = rtdbRef(rtdb, 'cricket_matches');
        unsubRtdb = rtdbOnValue(matchesRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const rtdbActive: MatchState[] = [];
            Object.keys(data).forEach(key => {
              const m = data[key] as MatchState;
              if (m && m.status === 'live' && !isMatchDeleted(m.id || key)) {
                rtdbActive.push({ ...m, id: m.id || key });
              }
            });
            if (rtdbActive.length > 0) {
              rtdbActive.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
              setLiveMatches(prev => {
                // Merge with priority on highest updatedAt
                const map = new Map<string, MatchState>();
                [...rtdbActive, ...prev].forEach(item => {
                  const existing = map.get(item.id);
                  if (!existing || (item.updatedAt || 0) >= (existing.updatedAt || 0)) {
                    map.set(item.id, item);
                  }
                });
                return Array.from(map.values()).filter(m => m.status === 'live');
              });
              setLastUpdated(Date.now());
            }
          }
        });
      }
    } catch (e) {
      console.warn('[HeroCricketLiveScore] RTDB sync listener:', e);
    }

    // 4. In-window CustomEvent & Storage listener
    const handleUpdate = (e: any) => {
      const match = e?.detail?.match as MatchState;
      if (match && match.status === 'live' && !isMatchDeleted(match.id)) {
        setLiveMatches(prev => {
          const filtered = prev.filter(m => m.id !== match.id);
          return [match, ...filtered];
        });
        setLastUpdated(Date.now());
      } else if (match && (match.status === 'completed' || match.status === 'deleted')) {
        setLiveMatches(prev => prev.filter(m => m.id !== match.id));
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

  // If a live match is running, display the rich live scoreboard card in the Hero section
  if (activeMatch && matchDetails) {
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
      currentBowler,
      recentBalls
    } = matchDetails;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full max-w-xl mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 text-white border border-emerald-500/40 shadow-xl shadow-emerald-950/20 backdrop-blur-md"
      >
        {/* Glow ambient pulse behind card */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Card Header: Product branding + Live Indicator */}
        <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/25 flex items-center gap-1">
              <Radio size={10} className="animate-pulse" />
              LIVE MATCH
            </span>
            <span className="text-xs font-bold text-gray-300 hidden sm:inline truncate max-w-[210px]">
              GullyScore: Local Cricket Scoreboard
            </span>
          </div>

          <div className="flex items-center gap-2">
            {liveMatches.length > 1 && (
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Match {matchIndex + 1} of {liveMatches.length}
              </span>
            )}
            <button
              onClick={() => navigate(`/live/cricket-details?matchId=${activeMatch.id}`)}
              className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer group"
              title="Open Live Match Center"
            >
              <span>Watch Full</span>
              <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Core Live Score Content */}
        <div className="p-4 space-y-3.5">
          {/* Teams and Big Score Display */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {isSecondInnings ? '2nd Innings' : '1st Innings'}
                </span>
                {activeMatch.tournamentName && (
                  <span className="text-[10px] font-bold text-amber-400/90 truncate flex items-center gap-1">
                    <Trophy size={10} />
                    {activeMatch.tournamentName}
                  </span>
                )}
              </div>

              {/* Batting Team vs Bowling Team */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black text-white truncate">
                    {battingTeam}
                  </span>
                  <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Batting
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400 truncate">
                  vs {bowlingTeam}
                </span>
              </div>
            </div>

            {/* Score Digits */}
            <div className="text-right shrink-0 flex flex-col items-end">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono">
                  {runs}/{wickets}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                <span>{oversStr} / {maxOvers} Ov</span>
                <span className="text-gray-500">•</span>
                <span className="text-amber-400">CRR {crr}</span>
              </div>
            </div>
          </div>

          {/* Chase Equation or Target Banner if 2nd Innings */}
          {isSecondInnings && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex flex-wrap items-center justify-between gap-1 shadow-inner">
              <span>Target: {target}</span>
              <span>
                {runsNeeded <= 0 ? (
                  <span className="text-emerald-400 font-extrabold">🏆 Target Reached!</span>
                ) : (
                  <>Need <strong className="text-white">{runsNeeded}</strong> runs from <strong className="text-white">{ballsRemaining}</strong> balls</>
                )}
              </span>
              {rrr && runsNeeded > 0 && (
                <span className="text-amber-200/90 text-[11px]">RRR: {rrr}</span>
              )}
            </div>
          )}

          {/* Active Batsmen and Bowler Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
            {/* Striker Batsman */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-emerald-400 text-sm">🏏</span>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {striker?.name || 'Batsman'}*
                  </span>
                  <span className="text-[10px] text-gray-400">On Strike</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {striker?.runs ?? 0} <span className="text-[10px] text-gray-400 font-normal">({striker?.balls ?? 0}b)</span>
              </span>
            </div>

            {/* Current Bowler */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-blue-400 text-sm">🎯</span>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {currentBowler?.name || 'Bowler'}
                  </span>
                  <span className="text-[10px] text-gray-400">Current Over</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {currentBowler?.wickets ?? 0}/{currentBowler?.runsConceded ?? 0}
                <span className="text-[10px] text-gray-400 font-normal ml-1">
                  ({currentBowler?.overs ?? '0.0'})
                </span>
              </span>
            </div>
          </div>

          {/* Recent Deliveries Strip */}
          {recentBalls.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-1">
                Recent:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {recentBalls.map((ball, i) => {
                  const isW = ball === 'W';
                  const isFour = ball === '4';
                  const isSix = ball === '6';
                  return (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black font-mono shadow-sm transition-transform ${
                        isW 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : isSix 
                          ? 'bg-purple-600 text-white' 
                          : isFour 
                          ? 'bg-blue-500 text-white' 
                          : ball === '0' || ball === '•'
                          ? 'bg-zinc-800 text-gray-400'
                          : 'bg-emerald-600/80 text-white'
                      }`}
                    >
                      {ball}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => navigate(`/live/cricket-details?matchId=${activeMatch.id}`)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>Watch Live Scorecard</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => navigate('/live/cricket-scoreboard')}
              className="py-2.5 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
              title="Open GullyScore Full Scoring Suite"
            >
              <span>Scoreboard</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // If NO match is live right now:
  // Provide a sleek, compact trigger badge in Hero section so visitors know GullyScore is ready and can launch it
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mb-6 p-3 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800/80 backdrop-blur-sm shadow-sm flex items-center justify-between gap-3 group hover:border-emerald-500/40 transition-all select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shrink-0">
          <Flame size={16} className="group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
              GullyScore: Local Cricket Match Scoreboard
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Live Ready
            </span>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            Live scores appear automatically here when match starts
          </span>
        </div>
      </div>

      <button
        onClick={() => navigate('/live/cricket-scoreboard')}
        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] tracking-wide shrink-0 flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
        title="Open GullyScore Cricket Match Scoreboard"
      >
        <span>Open Suite</span>
        <ChevronRight size={12} />
      </button>
    </motion.div>
  );
};
