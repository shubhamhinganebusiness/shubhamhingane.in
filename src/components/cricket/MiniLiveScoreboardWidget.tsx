import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MatchState } from './CricketScoreboard';
import { 
  Radio, 
  ChevronUp, 
  ChevronDown, 
  X, 
  ExternalLink, 
  Trophy, 
  Zap,
  Flame,
  Volume2,
  VolumeX
} from 'lucide-react';

interface MiniLiveScoreboardWidgetProps {
  currentActiveMatchId?: string;
  onSelectMatch?: (matchId: string) => void;
}

export const MiniLiveScoreboardWidget: React.FC<MiniLiveScoreboardWidgetProps> = ({
  currentActiveMatchId,
  onSelectMatch,
}) => {
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [liveEventBanner, setLiveEventBanner] = useState<{ text: string; type: 'boundary' | 'wicket' | 'six' | 'event' } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const prevScoreRef = useRef<{ runs: number; wickets: number; matchId: string } | null>(null);

  // Subscribe to real-time active database matches where status == 'live'
  useEffect(() => {
    try {
      const q = query(
        collection(db, 'cricket_matches'),
        where('status', '==', 'live')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const matches: MatchState[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && !(data as any).isDeleted && data.status === 'live') {
            matches.push({ ...data, id: data.id || docSnap.id } as MatchState);
          }
        });

        // Sort by most recently updated
        matches.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setLiveMatches(matches);

        // Check for real-time live events (boundaries, wickets)
        if (matches.length > 0) {
          const topMatch = matches[0];
          const currInnings = topMatch.currentInningsNum === 2 ? topMatch.innings2 : topMatch.innings1;
          const currRuns = currInnings?.runs ?? 0;
          const currWickets = currInnings?.wickets ?? 0;
          const lastBall = topMatch.lastBallResult || '';

          if (prevScoreRef.current && prevScoreRef.current.matchId === topMatch.id) {
            const prev = prevScoreRef.current;
            if (currWickets > prev.wickets) {
              triggerLiveAlert(`🔴 WICKET! ${currInnings?.battingTeam || topMatch.teamA || 'Batting team'} lost a wicket!`, 'wicket');
            } else if (currRuns - prev.runs === 6 || lastBall === '6') {
              triggerLiveAlert(`🚀 HUGE SIX! 6 Runs scored in ${topMatch.teamA} vs ${topMatch.teamB}!`, 'six');
            } else if (currRuns - prev.runs === 4 || lastBall === '4') {
              triggerLiveAlert(`⚡ FOUR! Magnificent boundary in ${topMatch.teamA} vs ${topMatch.teamB}!`, 'boundary');
            }
          }

          prevScoreRef.current = {
            runs: currRuns,
            wickets: currWickets,
            matchId: topMatch.id
          };
        }
      }, (error) => {
        console.warn('Real-time listener for mini scoreboard error:', error);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to attach real-time live match listener:', e);
    }
  }, []);

  const triggerLiveAlert = (text: string, type: 'boundary' | 'wicket' | 'six' | 'event') => {
    setLiveEventBanner({ text, type });
    // Reset dismissed state if a big event occurs so the user is informed
    setIsDismissed(false);

    // Audio cue if enabled
    if (soundEnabled && typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        if (type === 'wicket') {
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(220, audioCtx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'six' || type === 'boundary') {
          osc.frequency.setValueAtTime(587, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25);
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        }
      } catch (_) {}
    }

    setTimeout(() => {
      setLiveEventBanner(null);
    }, 4500);
  };

  if (liveMatches.length === 0 || isDismissed) {
    if (liveMatches.length > 0 && isDismissed) {
      // Provide a tiny un-dismiss pill
      return (
        <button
          id="mini-live-reopen-btn"
          onClick={() => setIsDismissed(false)}
          className="fixed bottom-4 right-4 z-40 px-3 py-1.5 rounded-full bg-slate-900/95 border border-emerald-500/40 text-emerald-400 text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-2xl backdrop-blur-md hover:scale-105 transition-all cursor-pointer"
          title="Show Live Match Scoreboard"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Match ({liveMatches.length})</span>
          <ChevronUp size={14} />
        </button>
      );
    }
    return null;
  }

  const safeIndex = Math.min(selectedMatchIndex, liveMatches.length - 1);
  const activeMatch = liveMatches[safeIndex] || liveMatches[0];
  const isCurrentlyBeingScored = currentActiveMatchId === activeMatch.id;

  const innings1 = activeMatch.innings1;
  const innings2 = activeMatch.innings2;
  const isSecondInnings = activeMatch.currentInningsNum === 2 && innings2;
  const currInnings = isSecondInnings ? innings2 : innings1;

  const battingTeam = isSecondInnings 
    ? (innings2?.battingTeam || activeMatch.teamB)
    : (innings1?.battingTeam || (activeMatch.tossChoice === 'bat' ? activeMatch.tossWinner : (activeMatch.tossWinner === activeMatch.teamA ? activeMatch.teamB : activeMatch.teamA)));
  
  const bowlingTeam = battingTeam === activeMatch.teamA ? activeMatch.teamB : activeMatch.teamA;

  const runs = currInnings?.runs ?? 0;
  const wickets = currInnings?.wickets ?? 0;
  const ballsBowled = currInnings?.ballsBowled ?? 0;
  const oversLimit = activeMatch.oversLimit || 5;
  const oversStr = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;

  // Current run rate
  const crr = ballsBowled > 0 ? ((runs / ballsBowled) * 6).toFixed(1) : '0.0';

  // Target context for 2nd innings
  const target = activeMatch.targetRuns || (innings1 ? (innings1.runs + 1) : 0);
  const runsNeeded = target > 0 ? Math.max(0, target - runs) : 0;
  const maxBalls = oversLimit * 6;
  const ballsRemaining = Math.max(0, maxBalls - ballsBowled);
  const rrr = (ballsRemaining > 0 && runsNeeded > 0) ? ((runsNeeded / ballsRemaining) * 6).toFixed(1) : null;

  // Recent balls
  const recentBalls = currInnings?.recentBalls?.slice(-6) || [];

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end max-w-sm w-full pointer-events-none">
      {/* Live Audio & Event Flash Notification */}
      <AnimatePresence>
        {liveEventBanner && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto mb-2.5 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-2xl border ${
              liveEventBanner.type === 'wicket'
                ? 'bg-rose-950/95 text-rose-300 border-rose-500/50 shadow-rose-950/50'
                : liveEventBanner.type === 'six'
                ? 'bg-purple-950/95 text-purple-200 border-purple-500/50 shadow-purple-950/50'
                : 'bg-emerald-950/95 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50'
            } backdrop-blur-xl`}
          >
            <Zap size={15} className="animate-bounce shrink-0" />
            <span className="truncate">{liveEventBanner.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mini Live Scoreboard Container */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="pointer-events-auto w-full rounded-2xl bg-slate-900/95 border border-emerald-500/30 text-white shadow-2xl shadow-emerald-950/30 backdrop-blur-xl overflow-hidden"
      >
        {/* Top Mini Header Bar */}
        <div className="px-3 py-2 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
              Live Database Match
            </span>
            {liveMatches.length > 1 && (
              <span className="text-[9px] font-mono font-bold text-slate-400">
                ({safeIndex + 1}/{liveMatches.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title={soundEnabled ? 'Mute Alerts' : 'Unmute Alerts'}
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>

            {/* Minimize / Expand Toggle */}
            <button
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {/* Dismiss Button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Collapsed Pill View */}
        {!isExpanded && (
          <div 
            onClick={() => setIsExpanded(true)}
            className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.02] transition-colors select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black text-white truncate">
                {battingTeam} vs {bowlingTeam}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono font-black text-emerald-400">
                {runs}/{wickets}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({oversStr} ov)
              </span>
            </div>
          </div>
        )}

        {/* Expanded Detailed Mini View */}
        {isExpanded && (
          <div className="p-3.5 space-y-2.5">
            {/* Teams & Current Score */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                    {isSecondInnings ? '2nd Inn' : '1st Inn'}
                  </span>
                  {activeMatch.tournamentName && (
                    <span className="text-[9px] font-bold text-amber-300 truncate flex items-center gap-0.5">
                      <Trophy size={9} />
                      {activeMatch.tournamentName}
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-white truncate">
                  {battingTeam}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  vs {bowlingTeam}
                </div>
              </div>

              {/* Large Score Numeral */}
              <div className="text-right shrink-0">
                <div className="text-2xl font-black font-mono tracking-tight text-emerald-400 leading-tight">
                  {runs}/{wickets}
                </div>
                <div className="text-[10px] font-bold text-slate-300 flex items-center justify-end gap-1">
                  <span className="font-mono">{oversStr}/{oversLimit} Ov</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300 font-mono">CRR {crr}</span>
                </div>
              </div>
            </div>

            {/* Target equation if chasing */}
            {isSecondInnings && (
              <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center justify-between">
                <span>Target: {target}</span>
                <span>
                  {runsNeeded <= 0 ? (
                    <span className="text-emerald-400 font-black">Target Reached!</span>
                  ) : (
                    <>Need <strong className="text-white">{runsNeeded}</strong> in <strong className="text-white">{ballsRemaining}b</strong></>
                  )}
                </span>
                {rrr && runsNeeded > 0 && (
                  <span className="font-mono text-[9px] opacity-80">RRR: {rrr}</span>
                )}
              </div>
            )}

            {/* Recent Balls Strip */}
            {recentBalls.length > 0 && (
              <div className="flex items-center gap-1 pt-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mr-0.5">
                  Over:
                </span>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {recentBalls.map((b, i) => (
                    <span
                      key={i}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black font-mono ${
                        b === 'W' 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : b === '6' 
                          ? 'bg-purple-600 text-white' 
                          : b === '4' 
                          ? 'bg-blue-500 text-white' 
                          : b === '0' || b === '•'
                          ? 'bg-slate-800 text-slate-400' 
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-Match Nav (if multiple live matches in DB) */}
            {liveMatches.length > 1 && (
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                <button
                  onClick={() => setSelectedMatchIndex(prev => (prev - 1 + liveMatches.length) % liveMatches.length)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ← Prev Match
                </button>
                <span className="font-mono text-slate-500">
                  {safeIndex + 1} of {liveMatches.length}
                </span>
                <button
                  onClick={() => setSelectedMatchIndex(prev => (prev + 1) % liveMatches.length)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  Next Match →
                </button>
              </div>
            )}

            {/* Quick Action Button */}
            <div className="pt-1">
              {isCurrentlyBeingScored ? (
                <div className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>Currently Scoring This Match</span>
                </div>
              ) : (
                <button
                  id="mini-live-switch-btn"
                  onClick={() => {
                    if (onSelectMatch) {
                      onSelectMatch(activeMatch.id);
                    } else {
                      window.location.href = `/live/cricket-details?matchId=${encodeURIComponent(activeMatch.id)}`;
                    }
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Open Live Match ({activeMatch.teamA.slice(0, 3)} vs {activeMatch.teamB.slice(0, 3)})</span>
                  <ExternalLink size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
