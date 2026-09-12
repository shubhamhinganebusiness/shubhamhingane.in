import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Flame, 
  Trophy, 
  Database, 
  Activity, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { MatchState } from './CricketScoreboard';
import { getActiveMatch, getLocalMatches, isMatchDeleted } from './cricketStorage';

interface MiniLiveScoreNotificationWidgetProps {
  currentMatchId?: string;
  onSelectMatch?: (matchId: string) => void;
}

export const MiniLiveScoreNotificationWidget: React.FC<MiniLiveScoreNotificationWidgetProps> = ({
  currentMatchId,
  onSelectMatch
}) => {
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [selectedLiveIndex, setSelectedLiveIndex] = useState<number>(0);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [latestNotification, setLatestNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'wicket' | 'four' | 'six' | 'fifty' | 'info'>('info');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isDbOnline, setIsDbOnline] = useState<boolean>(true);

  // Track previous match score to trigger real-time event notifications
  const prevScoreRef = useRef<{ [matchId: string]: { runs: number; wickets: number; balls: number } }>({});

  // Real-time listener to active database for live matches
  useEffect(() => {
    // 1. Check local storage first
    const syncFromLocal = () => {
      try {
        const localActive = getActiveMatch();
        const registry = getLocalMatches();
        const foundLive: MatchState[] = [];

        if (localActive && localActive.status === 'live' && !isMatchDeleted(localActive.id)) {
          foundLive.push(localActive);
        }
        registry.forEach(m => {
          if (m.status === 'live' && !isMatchDeleted(m.id) && !foundLive.some(x => x.id === m.id)) {
            foundLive.push(m);
          }
        });

        if (foundLive.length > 0) {
          setLiveMatches(prev => {
            const map = new Map<string, MatchState>();
            prev.forEach(p => map.set(p.id, p));
            foundLive.forEach(f => map.set(f.id, f));
            return Array.from(map.values());
          });
        }
      } catch (e) {
        console.warn('Local live match sync error:', e);
      }
    };

    syncFromLocal();

    // 2. Real-time spectator read pipeline (< 1.5 KB summary docs)
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(collection(db, 'cricket_live_summaries'), (snapshot) => {
        setIsDbOnline(true);
        setLastSyncTime(new Date());

        const activeList: MatchState[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data && data.status === 'live' && !isMatchDeleted(data.matchId || docSnap.id) && !(data as any).isDeleted) {
            const runs = data.currentScore?.runs ?? 0;
            const wickets = data.currentScore?.wickets ?? 0;
            const balls = data.currentScore?.ballsBowled ?? 0;
            const matchId = data.matchId || docSnap.id;

            const match: MatchState = {
              id: matchId,
              status: 'live',
              teamA: data.teamA,
              teamB: data.teamB,
              oversLimit: data.oversLimit || 5,
              currentInningsNum: data.currentInningsNum || 1,
              targetRuns: data.currentScore?.targetRuns,
              innings1: {
                runs: data.currentInningsNum === 1 ? runs : 0,
                wickets: data.currentInningsNum === 1 ? wickets : 0,
                ballsBowled: data.currentInningsNum === 1 ? balls : 0,
                recentBalls: data.recentBallsMini || [],
                battingTeam: data.teamA
              },
              innings2: data.currentInningsNum === 2 ? {
                runs: runs,
                wickets: wickets,
                ballsBowled: balls,
                recentBalls: data.recentBallsMini || [],
                battingTeam: data.teamB
              } : undefined,
              updatedAt: data.updatedAt || Date.now()
            } as any;

            activeList.push(match);

            // Check for real-time score milestones to notify
            const prev = prevScoreRef.current[matchId];
            if (prev) {
              if (wickets > prev.wickets) {
                setLatestNotification(`💥 WICKET! ${data.teamA} lost a wicket (${runs}/${wickets})`);
                setNotificationType('wicket');
              } else if (runs - prev.runs === 6) {
                setLatestNotification(`🔥 MAXIMUM 6! Huge hit by ${data.teamA} (${runs}/${wickets})`);
                setNotificationType('six');
              } else if (runs - prev.runs === 4) {
                setLatestNotification(`⚡ BOUNDARY 4! Beautiful shot (${runs}/${wickets})`);
                setNotificationType('four');
              }
            }
            prevScoreRef.current[matchId] = { runs, wickets, balls };
          }
        });

        if (activeList.length > 0) {
          setLiveMatches(activeList);
        }
      }, (error) => {
        console.warn('Firestore live summary widget note:', error);
        setIsDbOnline(false);
      });
    } catch (err) {
      console.warn('MiniLiveScoreNotificationWidget setup error:', err);
      setIsDbOnline(false);
    }

    // Storage event for cross-tab sync
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'cricket_active_match' || e.key === 'cricket_matches_local_registry') {
        syncFromLocal();
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (unsubFirestore) unsubFirestore();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Auto-dismiss notification toast after 4.5 seconds
  useEffect(() => {
    if (!latestNotification) return;
    const timer = setTimeout(() => {
      setLatestNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [latestNotification]);

  // Selected live match object
  const activeLiveMatch = useMemo(() => {
    if (liveMatches.length === 0) return null;
    return liveMatches[selectedLiveIndex % liveMatches.length] || liveMatches[0];
  }, [liveMatches, selectedLiveIndex]);

  // Derived calculations for active live match
  const matchMetrics = useMemo(() => {
    if (!activeLiveMatch) return null;
    const inn = activeLiveMatch.currentInningsNum === 2 ? activeLiveMatch.innings2 : activeLiveMatch.innings1;
    const battingTeam = inn?.battingTeam || activeLiveMatch.teamA;
    const bowlingTeam = inn?.bowlingTeam || activeLiveMatch.teamB;
    const runs = inn?.runs ?? 0;
    const wickets = inn?.wickets ?? 0;
    const balls = inn?.ballsBowled ?? 0;
    const completedOvers = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    const oversStr = `${completedOvers}.${ballsInOver}`;
    const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';
    const isSecondInnings = activeLiveMatch.currentInningsNum === 2;
    const target = isSecondInnings ? (activeLiveMatch.innings1?.runs ?? 0) + 1 : 0;
    const runsNeeded = target - runs;
    const totalBalls = (activeLiveMatch.oversLimit || 5) * 6;
    const ballsRemaining = Math.max(0, totalBalls - balls);

    const striker = inn?.batsmen && inn.strikerIndex !== undefined && inn.strikerIndex >= 0 
      ? inn.batsmen[inn.strikerIndex] 
      : null;

    const bowler = inn?.bowlers && inn.currentBowlerIndex !== undefined && inn.currentBowlerIndex >= 0 
      ? inn.bowlers[inn.currentBowlerIndex] 
      : null;

    return {
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      oversStr,
      crr,
      isSecondInnings,
      target,
      runsNeeded,
      ballsRemaining,
      striker,
      bowler
    };
  }, [activeLiveMatch]);

  if (liveMatches.length === 0 || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full select-none print:hidden pointer-events-auto">
      {/* Live Event Toast Banner */}
      <AnimatePresence>
        {latestNotification && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`mb-2 p-3 rounded-2xl shadow-xl backdrop-blur-md border text-xs font-black flex items-center justify-between gap-2.5 ${
              notificationType === 'wicket'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : notificationType === 'six'
                ? 'bg-purple-950/90 text-purple-200 border-purple-500/50'
                : notificationType === 'four'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="truncate">{latestNotification}</span>
            </div>
            <button
              onClick={() => setLatestNotification(null)}
              className="text-white/60 hover:text-white p-1 rounded-full border-none bg-transparent cursor-pointer"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mini Scoreboard Widget */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="overflow-hidden rounded-2xl bg-slate-950/95 text-white border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl ring-1 ring-white/10"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-b border-emerald-500/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1 truncate">
              <Radio size={11} className="text-rose-500 animate-pulse" />
              Live Scoreboard
            </span>
            {liveMatches.length > 1 && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-mono">
                {selectedLiveIndex + 1}/{liveMatches.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {/* Database Sync Indicator */}
            <div 
              className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-emerald-400 font-mono"
              title={`Database synced in real-time at ${lastSyncTime.toLocaleTimeString()}`}
            >
              <Database size={9} className={isDbOnline ? 'text-emerald-400 animate-pulse' : 'text-amber-400'} />
              <span className="hidden sm:inline">Active DB</span>
            </div>

            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              title={isMinimized ? "Expand Mini Scoreboard" : "Minimize Mini Scoreboard"}
            >
              {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors border-none bg-transparent cursor-pointer"
              title="Close notification widget"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Card Body (Collapsible) */}
        {!isMinimized && matchMetrics && activeLiveMatch && (
          <div className="p-3.5 space-y-2.5">
            {/* Teams & Score Strip */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate">
                    {matchMetrics.battingTeam}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                    BAT
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  vs {matchMetrics.bowlingTeam}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-lg font-black font-mono text-emerald-400 tracking-tight">
                  {matchMetrics.runs}/{matchMetrics.wickets}
                </div>
                <div className="text-[10px] text-slate-400 font-mono font-semibold">
                  Overs: <span className="text-white font-bold">{matchMetrics.oversStr}</span>
                  <span className="mx-1 text-slate-600">•</span>
                  CRR: <span className="text-white font-bold">{matchMetrics.crr}</span>
                </div>
              </div>
            </div>

            {/* Target Status Bar (if 2nd innings) */}
            {matchMetrics.isSecondInnings && (
              <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300 flex items-center justify-between">
                <span>Target: {matchMetrics.target}</span>
                <span>
                  {matchMetrics.runsNeeded > 0
                    ? `Need ${matchMetrics.runsNeeded} off ${matchMetrics.ballsRemaining}b`
                    : 'Target Achieved!'}
                </span>
              </div>
            )}

            {/* Striker & Bowler Snapshot */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 text-[10px]">
              <div className="flex items-center gap-1.5 truncate text-slate-300">
                <span className="text-emerald-400">🏏</span>
                <span className="truncate font-semibold">
                  {matchMetrics.striker ? `${matchMetrics.striker.name} (${matchMetrics.striker.runs})` : 'Striker: Live'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-1.5 truncate text-slate-300">
                <span className="text-amber-400">🎯</span>
                <span className="truncate font-semibold text-right">
                  {matchMetrics.bowler ? `${matchMetrics.bowler.name} (${matchMetrics.bowler.wickets}/${matchMetrics.bowler.runsConceded})` : 'Bowler: Active'}
                </span>
              </div>
            </div>

            {/* Multiple Match Switcher & Action Footer */}
            <div className="flex items-center justify-between pt-1 gap-2 border-t border-white/5">
              {liveMatches.length > 1 ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedLiveIndex(prev => (prev > 0 ? prev - 1 : liveMatches.length - 1))}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold text-slate-300 border-none cursor-pointer"
                  >
                    ◀ Prev
                  </button>
                  <button
                    onClick={() => setSelectedLiveIndex(prev => (prev + 1) % liveMatches.length)}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[9px] font-bold text-slate-300 border-none cursor-pointer"
                  >
                    Next ▶
                  </button>
                </div>
              ) : (
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Activity size={10} className="text-emerald-400 animate-pulse" />
                  Real-Time Engine
                </div>
              )}

              {onSelectMatch && activeLiveMatch.id !== currentMatchId && (
                <button
                  onClick={() => onSelectMatch(activeLiveMatch.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all border-none cursor-pointer"
                >
                  <span>Score This</span>
                  <ExternalLink size={10} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Minimized Single-Line Summary */}
        {isMinimized && matchMetrics && (
          <div 
            onClick={() => setIsMinimized(false)}
            className="px-3.5 py-2 flex items-center justify-between text-xs cursor-pointer hover:bg-white/5 transition-colors"
          >
            <span className="font-bold text-slate-300 truncate text-[11px]">
              {matchMetrics.battingTeam}: <strong className="text-emerald-400 font-mono">{matchMetrics.runs}/{matchMetrics.wickets}</strong> ({matchMetrics.oversStr} ov)
            </span>
            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider ml-2">
              Tap to Expand
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
