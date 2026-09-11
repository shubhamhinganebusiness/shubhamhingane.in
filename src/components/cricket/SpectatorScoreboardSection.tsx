import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Clock, Activity, Users, Radio, ArrowRight, Share2, Download, FileText,
  ChevronLeft, ChevronRight, Calendar, BarChart3, HelpCircle, AlertCircle, Copy, Search,
  Flame, ShieldAlert, Award, Zap, Info, Sparkles, Lock, Eye, Bot, Play, Send, Volume2,
  RefreshCw, ChevronDown, ChevronUp, X, ExternalLink
} from 'lucide-react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';

// jsPDF imports
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Firestore & Realtime Database imports
import { 
  db, 
  handleFirestoreError, 
  OperationType, 
  subscribeToRealtimeDBMatch,
  subscribeToRealtimeDBMatchesList,
  subscribeToRealtimeDBCompletedMatch 
} from '../../lib/firebase';
import { doc, onSnapshot, collection } from 'firebase/firestore';

// Local storage & real-time sync across scoreboard components
import { 
  getLocalMatches, 
  getActiveMatch, 
  subscribeToMatchSync, 
  getLocalMatchById, 
  isMatchDeleted, 
  markMatchDeleted, 
  unmarkMatchDeleted, 
  deleteLocalMatch, 
  pruneDeletedMatchesFromStorage,
  getAnyActiveOrRecentMatch,
  getOrCreateDefaultMatch,
  isDemoOrAIMatch
} from './cricketStorage';

// Recharts imports
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import { PlayerRegistrationForm } from './PlayerRegistrationForm';
import { LiveStandingsSummaryWidget } from './LiveStandingsSummaryWidget';
import { ConfettiCelebration } from './ConfettiCelebration';
import { useSiteSettings } from '../../hooks/useCMS';
import {
  CommentaryLanguage,
  useCommentaryLanguage,
  getCommentaryText,
  CommentaryLanguageSelector
} from './modules/commentaryLanguage';
import { WinProbabilityCard } from './modules/WinProbabilityCard';

// Struct definitions matching those in CricketScoreboard.tsx
interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outMode?: string;
  dismissedBy?: string;
  fielderName?: string;
}

interface Bowler {
  name: string;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  isCurrent: boolean;
  consecutiveWickets?: number;
}

interface BallProgress {
  over: number;
  overStr: string;
  cumulativeRuns: number;
  cumulativeWickets: number;
}

interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  ballsBowled: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  batsmen: Batsman[];
  bowlers: Bowler[];
  strikerIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
  fallOfWickets: {
    wicketNo: number;
    score: number;
    batsmanName: string;
    oversList: string;
  }[];
  commentaryList: {
    id: string;
    overBall: string;
    description: string;
    type: 'normal' | 'boundary' | 'wicket' | 'extra' | 'milestone';
    soundWave?: boolean;
    translations?: {
      en?: string;
      hi?: string;
      mr?: string;
    };
  }[];
  history?: BallProgress[];
}

interface MatchState {
  id: string;
  teamA: string;
  teamB: string;
  oversLimit: number;
  tossWinner: string;
  tossChoice: 'bat' | 'bowl';
  currentInningsNum: 1 | 2;
  innings1: Innings | null;
  innings2: Innings | null;
  status: 'setup' | 'live' | 'completed' | 'draft' | 'deleted';
  isDeleted?: boolean;
  date: string;
  freeHitNext: boolean;
  winner?: string;
  winReason?: string;
  targetRuns?: number;
  lastBallResult?: string;
  isSuperOver?: boolean;
  superOverNumber?: number;
  superOverWicketLimit?: number;
  tieResolution?: 'declared_tie' | 'super_over';
  mainMatchState?: any;
  superOversHistory?: any[];
  updatedAt?: number;
  tournamentId?: string | null;
  tournamentMatchId?: string | null;
  tournamentName?: string | null;
  teamAId?: string | null;
  teamBId?: string | null;
  teamALogo?: string | null;
  teamBLogo?: string | null;
  matchBannerUrl?: string | null;
  seriesName?: string | null;
  groundName?: string | null;
  venue?: string | null;
  isHidden?: boolean;
  isBlocked?: boolean;
}

const copyToClipboard = (text: string): Promise<void> => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve();
  } catch (err) {
    document.body.removeChild(textArea);
    return Promise.reject(err);
  }
};

const getPitchCoords = (id: string, overBall: string, desc: string, type: string) => {
  const lower = (desc || '').toLowerCase();
  let x = 50; // middle
  let y = 60; // good length
  let lengthType: 'Short' | 'Short of Length' | 'Good Length' | 'Full' | 'Yorker' | 'Wide' = 'Good Length';
  let color = 'bg-emerald-500 shadow-emerald-500/50 text-white font-semibold';

  // Deterministic offset based on ID character codes
  let charSum = 0;
  for (let i = 0; i < id.length; i++) charSum += id.charCodeAt(i);
  const randX = (charSum % 15) - 7.5; // -7.5 to +7.5% offset
  const randY = (charSum % 9) - 4.5;   // -4.5 to +4.5% offset

  // Parse Y (Length)
  if (lower.includes('yorker') || lower.includes('full toss') || lower.includes('york') || lower.includes('full-toss')) {
    y = 19 + Math.abs(charSum % 4); // very close to batting crease (15%)
    lengthType = 'Yorker';
    color = 'bg-amber-500 text-slate-950 font-black';
  } else if (lower.includes('full') || lower.includes('half volley') || lower.includes('drive') || lower.includes('driven')) {
    y = 30 + Math.abs(charSum % 6);
    lengthType = 'Full';
    color = 'bg-sky-500 text-white font-extrabold';
  } else if (lower.includes('short') || lower.includes('pull') || lower.includes('hook') || lower.includes('bouncer') || lower.includes('bounced')) {
    if (lower.includes('bouncer')) {
      y = 78 + Math.abs(charSum % 6);
      lengthType = 'Short';
      color = 'bg-rose-500 text-white font-extrabold';
    } else {
      y = 60 + Math.abs(charSum % 8);
      lengthType = 'Short of Length';
      color = 'bg-indigo-500 text-white font-extrabold';
    }
  } else {
    // Default: Good length
    y = 44 + Math.abs(charSum % 8);
    lengthType = 'Good Length';
    color = 'bg-emerald-500 text-white font-extrabold';
  }

  // Parse X (Line)
  if (lower.includes('wide')) {
    const isOff = (charSum % 2 === 0);
    x = isOff ? 22 : 78;
    lengthType = 'Wide';
    color = 'bg-slate-400 text-slate-950 font-extrabold';
  } else if (lower.includes('outside off') || lower.includes('off stump') || lower.includes('off side') || lower.includes('fourth stump')) {
    x = 32 + Math.abs(charSum % 8);
  } else if (lower.includes('down leg') || lower.includes('leg stump') || lower.includes('leg side')) {
    x = 68 - Math.abs(charSum % 8);
  } else {
    // middle
    x = 50 + (charSum % 11) - 5;
  }

  return { x, y, lengthType, color };
};

const calculateWinProbability = (
  runs: number,
  wickets: number,
  ballNumber: number,
  totalOvers: number,
  isSecondInnings: boolean,
  target?: number
) => {
  const totalBalls = totalOvers * 6;
  if (!isSecondInnings) {
    if (ballNumber === 0) return { probA: 50, probB: 50 };
    
    const crr = (runs / ballNumber) * 6;
    const ballsRemaining = totalBalls - ballNumber;
    
    // Projected score based on current trend and wickets left
    const projectedRuns = runs + Math.max(0, (ballsRemaining / 6) * (crr * (1 - wickets / 10) + 3.0));
    const averageParScore = 7.5 * totalOvers;
    
    const scoreDiff = projectedRuns - averageParScore;
    let probA = 50 + (scoreDiff / (averageParScore || 100)) * 100;
    
    // Penalize heavily for excessive wickets lost early
    const wicketOverage = wickets - (ballNumber / totalBalls) * 8;
    if (wicketOverage > 0) {
      probA -= wicketOverage * 4;
    }
    
    probA = Math.min(95, Math.max(5, Math.round(probA)));
    return { probA, probB: 100 - probA };
  } else {
    if (!target) return { probA: 50, probB: 50 };
    if (runs >= target) return { probA: 0, probB: 100 };
    if (wickets >= 10 || ballNumber >= totalBalls) {
       return { probA: 100, probB: 0 };
    }
    
    const ballsRemaining = totalBalls - ballNumber;
    const runsRequired = target - runs;
    
    const rrr = (runsRequired / ballsRemaining) * 6;
    const crr = ballNumber > 0 ? (runs / ballNumber) * 6 : 6.5;
    
    // Calculate winning odds for chasing team B
    let baseOffset = 50 - (rrr - crr) * 12 - wickets * 7;
    
    // Scale probability smoothly
    let probB = Math.min(96, Math.max(4, Math.round(baseOffset)));
    return { probA: 100 - probB, probB };
  }
};

const getTeamColor = (name: string) => {
  const gradients = [
    'from-blue-600 to-indigo-650',
    'from-yellow-500 to-amber-600',
    'from-red-650 to-rose-700',
    'from-purple-650 to-fuchsia-800',
    'from-emerald-500 to-teal-700',
    'from-sky-500 to-blue-600',
    'from-slate-700 to-slate-900',
    'from-orange-500 to-red-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % gradients.length;
  return gradients[idx];
};

const computePointsTable = (teams: any[], matches: any[]) => {
  const table: Record<string, { id: string, name: string, captain: string, played: number, won: number, lost: number, tied: number, points: number, runsScored: number, runsConceded: number, oversFaced: number, oversBowled: number, NRR: number }> = {};
  
  (teams || []).forEach(t => {
    table[t.id] = {
      id: t.id,
      name: t.name,
      captain: t.captain || 'None',
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      points: 0,
      runsScored: 0,
      runsConceded: 0,
      oversFaced: 0,
      oversBowled: 0,
      NRR: 0,
    };
  });

  const convertOversToDecimal = (oversStr: string): number => {
    if (!oversStr) return 0;
    const parts = oversStr.toString().split('.');
    if (parts.length === 2) {
      const overs = parseInt(parts[0]) || 0;
      const balls = parseInt(parts[1]) || 0;
      return overs + (balls / 6);
    }
    return parseFloat(oversStr) || 0;
  };

  const defaultOvers = 10;

  (matches || []).forEach(m => {
    if (m.status !== 'completed' || m.stage !== 'League') return;
    
    const tA = table[m.teamAId];
    const tB = table[m.teamBId];

    if (!tA || !tB) return;

    tA.played += 1;
    tB.played += 1;

    const runsA = parseInt((m.scoreA || "").split('/')[0]) || 0;
    const runsB = parseInt((m.scoreB || "").split('/')[0]) || 0;
    
    const oversA_dec = convertOversToDecimal(m.oversA) || defaultOvers;
    const oversB_dec = convertOversToDecimal(m.oversB) || defaultOvers;

    tA.runsScored += runsA;
    tA.runsConceded += runsB;
    tA.oversFaced += oversA_dec;
    tA.oversBowled += oversB_dec;

    tB.runsScored += runsB;
    tB.runsConceded += runsA;
    tB.oversFaced += oversB_dec;
    tB.oversBowled += oversA_dec;

    if (m.winnerId === m.teamAId) {
      tA.won += 1;
      tA.points += 2;
      tB.lost += 1;
    } else if (m.winnerId === m.teamBId) {
      tB.won += 1;
      tB.points += 2;
      tA.lost += 1;
    } else {
      tA.tied += 1;
      tB.tied += 1;
      tA.points += 1;
      tB.points += 1;
    }
  });

  return Object.values(table).map(t => {
    const scoredAvg = t.oversFaced > 0 ? (t.runsScored / t.oversFaced) : 0;
    const concededAvg = t.oversBowled > 0 ? (t.runsConceded / t.oversBowled) : 0;
    t.NRR = Number((scoredAvg - concededAvg).toFixed(3));
    return t;
  }).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    return b.NRR - a.NRR;
  });
};

/**
 * Global Site-Wide Banner displayed across pages whenever a live cricket match flag is active in Firestore
 */
export const LiveMatchGlobalBanner = () => {
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on dedicated cricket arena / scoring pages to prevent clutter
  const isDedicatedCricketScreen = useMemo(() => {
    const p = location.pathname;
    return (
      p.startsWith('/live/cricket-details') ||
      p.startsWith('/live/cricket-scoreboard') ||
      p.startsWith('/live/cricket-overlay') ||
      p.startsWith('/live/cricket-toss')
    );
  }, [location.pathname]);

  // Real-time listener for any match flagged as 'live' in Firestore
  useEffect(() => {
    // Initial local cache population
    try {
      const local = getLocalMatches().filter(m => m.status === 'live' && !isMatchDeleted(m.id) && !m.isHidden && !m.isBlocked && !(m as any).isDeleted);
      if (local.length > 0) {
        setLiveMatches(local);
      }
    } catch (_) {}

    const unsub = onSnapshot(collection(db, 'cricket_matches'), (snapshot) => {
      const active: MatchState[] = [];
      const remoteIds = new Set<string>();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MatchState;
        const m = { ...data, id: data.id || docSnap.id };
        if (m.status === 'deleted' || (m as any).isDeleted === true || isMatchDeleted(m.id)) {
          markMatchDeleted(m.id);
          return;
        }
        if (m.status === 'live' && !m.isHidden && !m.isBlocked) {
          active.push(m);
        }
        remoteIds.add(m.id);
      });
      pruneDeletedMatchesFromStorage(remoteIds);
      // Sort most recently updated first
      active.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setLiveMatches(active);
    }, (err) => {
      console.warn('[LiveMatchGlobalBanner] Snapshot error:', err);
    });

    const handleDeletedEvent = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        setLiveMatches(prev => prev.filter(m => m.id !== id));
      }
    };
    window.addEventListener('cricket_match_deleted', handleDeletedEvent);

    return () => {
      unsub();
      window.removeEventListener('cricket_match_deleted', handleDeletedEvent);
    };
  }, []);

  if (isDedicatedCricketScreen || isDismissed || liveMatches.length === 0) {
    return null;
  }

  const activeMatch = liveMatches[currentIndex] || liveMatches[0];
  if (!activeMatch) return null;

  const innings = activeMatch.currentInningsNum === 1 ? activeMatch.innings1 : activeMatch.innings2;
  const battingTeam = innings?.battingTeam || activeMatch.teamA;
  const bowlingTeam = innings?.bowlingTeam || activeMatch.teamB;
  const runs = innings?.runs ?? 0;
  const wickets = innings?.wickets ?? 0;
  const balls = innings?.ballsBowled ?? 0;
  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const maxOvers = activeMatch.oversLimit || 5;
  const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

  const isSecondInnings = activeMatch.currentInningsNum === 2;
  const target = isSecondInnings ? (activeMatch.innings1?.runs ?? 0) + 1 : 0;
  const runsNeeded = target - runs;
  const totalBalls = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalBalls - balls);
  const rrr = isSecondInnings && ballsRemaining > 0 ? ((Math.max(0, runsNeeded) / ballsRemaining) * 6).toFixed(2) : null;

  const striker = innings?.batsmen && innings.strikerIndex !== undefined ? innings.batsmen[innings.strikerIndex] : null;
  const nonStriker = innings?.batsmen && innings.nonStrikerIndex !== undefined ? innings.batsmen[innings.nonStrikerIndex] : null;
  const currentBowler = innings?.bowlers && innings.currentBowlerIndex !== undefined ? innings.bowlers[innings.currentBowlerIndex] : null;
  const recentBalls = (balls > 0 && innings?.recentBalls && Array.isArray(innings.recentBalls)) ? innings.recentBalls.slice(-6) : [];

  return (
    <div id="live-match-global-banner" className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-emerald-500/30 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Live indicator and Match Info */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {activeMatch.isSuperOver ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              ⚡ SUPER OVER {activeMatch.superOverNumber || 1}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black text-[10px] tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              LIVE MATCH
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-100">
              <span className="text-white">{activeMatch.teamA}</span>
              <span className="text-slate-400 text-[11px]">vs</span>
              <span className="text-white">{activeMatch.teamB}</span>
            </div>
            {activeMatch.tournamentName && (
              <span className="text-[10px] font-semibold text-amber-400/90 truncate max-w-[160px] sm:max-w-[240px]">
                🏆 {activeMatch.tournamentName}
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Score, Overs, and Equations */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-2 shadow-inner">
            <span>{battingTeam}:</span>
            <span className="text-white text-sm sm:text-base font-black tracking-tight">{runs}/{wickets}</span>
            <span className="text-emerald-400 text-[11px] font-medium">({oversStr}/{maxOvers} ov)</span>
            <span className="hidden sm:inline text-slate-400 text-[10px] pl-1.5 border-l border-emerald-500/30">CRR {crr}</span>
          </div>

          {/* Equation if chase */}
          {isSecondInnings && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
              <span>Target {target}</span>
              <span className="text-slate-300">•</span>
              <span>Need {runsNeeded} from {ballsRemaining}b</span>
              {rrr && <span className="text-amber-200">({rrr} rpo)</span>}
            </div>
          )}

          {/* Striker & Bowler summary */}
          <div className="hidden lg:flex items-center gap-3 text-slate-300 text-[11px]">
            {striker && (
              <span className="flex items-center gap-1">
                🏏 <strong className="text-white font-semibold">{striker.name}</strong> {striker.runs}*({striker.balls})
              </span>
            )}
            {currentBowler && (
              <span className="flex items-center gap-1">
                🥎 <strong className="text-white font-semibold">{currentBowler.name}</strong> {currentBowler.wickets}/{currentBowler.runsConceded}
              </span>
            )}
          </div>

          {/* Recent balls pill */}
          {recentBalls.length > 0 && (
            <div className="hidden xl:flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium mr-1">Over:</span>
              {recentBalls.map((b: any, idx: number) => {
                const isW = typeof b === 'string' ? b.includes('W') : b?.isWicket;
                const isSix = b === '6' || b?.runs === 6;
                const isFour = b === '4' || b?.runs === 4;
                return (
                  <span
                    key={idx}
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${
                      isW
                        ? 'bg-rose-600 text-white'
                        : isSix
                        ? 'bg-purple-600 text-white'
                        : isFour
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {typeof b === 'string' ? b : (b.text || b.runs || 0)}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Actions (Drawer toggle, Switcher, Full Arena, Dismiss) */}
        <div className="flex items-center gap-2 shrink-0">
          {liveMatches.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : liveMatches.length - 1))}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Previous Live Match"
              >
                ◀
              </button>
              <span className="px-1 font-bold text-amber-300">
                {currentIndex + 1}/{liveMatches.length}
              </span>
              <button
                onClick={() => setCurrentIndex((prev) => (prev < liveMatches.length - 1 ? prev + 1 : 0))}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Next Live Match"
              >
                ▶
              </button>
            </div>
          )}

          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Scorecard {showDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => navigate(`/live/cricket-details?matchId=${activeMatch.id}`)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all hover:scale-105"
          >
            Spectator Arena <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Hide live banner for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Quick Scorecard Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-800 bg-slate-900/95 px-4 sm:px-8 py-4 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-200">
              {/* Batsmen summary */}
              <div>
                <div className="flex items-center justify-between font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                  <span>Batting ({battingTeam})</span>
                  <span className="text-[10px] text-slate-400">R (B) • 4s / 6s • SR</span>
                </div>
                <div className="space-y-1.5">
                  {striker && (
                    <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                      <span className="font-bold text-white flex items-center gap-1">
                        🏏 {striker.name} <span className="text-emerald-400 text-[10px] font-black">*</span>
                      </span>
                      <span className="font-mono">
                        <strong className="text-white">{striker.runs}</strong> ({striker.balls}) • {striker.fours}/{striker.sixes} •{' '}
                        {striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  )}
                  {nonStriker && (
                    <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/60">
                      <span className="text-slate-200">{nonStriker.name}</span>
                      <span className="font-mono text-slate-300">
                        <strong className="text-white">{nonStriker.runs}</strong> ({nonStriker.balls}) • {nonStriker.fours}/{nonStriker.sixes} •{' '}
                        {nonStriker.balls > 0 ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) : '0.0'}
                      </span>
                    </div>
                  )}
                  {!striker && !nonStriker && (
                    <p className="text-slate-400 italic">No batsmen currently on crease.</p>
                  )}
                </div>
              </div>

              {/* Bowler summary and Match Status */}
              <div>
                <div className="flex items-center justify-between font-bold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                  <span>Bowling ({bowlingTeam})</span>
                  <span className="text-[10px] text-slate-400">O - M - R - W • ECON</span>
                </div>
                {currentBowler ? (
                  <div className="flex items-center justify-between p-1.5 rounded bg-slate-800/60">
                    <span className="font-bold text-white flex items-center gap-1">
                      🥎 {currentBowler.name}
                    </span>
                    <span className="font-mono text-slate-200">
                      {Math.floor(currentBowler.ballsBowled / 6)}.{currentBowler.ballsBowled % 6} - {currentBowler.maidens || 0} -{' '}
                      {currentBowler.runsConceded} - <strong className="text-rose-400">{currentBowler.wickets}</strong> •{' '}
                      {currentBowler.ballsBowled > 0 ? ((currentBowler.runsConceded / currentBowler.ballsBowled) * 6).toFixed(2) : '0.00'}
                    </span>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No active bowler assigned.</p>
                )}

                <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">
                    Venue: <strong className="text-slate-200">{activeMatch.groundName || 'Standard Pitch'}</strong>
                  </span>
                  <Link
                    to={`/live/cricket-details?matchId=${activeMatch.id}`}
                    className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 text-xs"
                  >
                    Open Live Match Center ↗
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SpectatorScoreboardSection = ({ 
  homepageMode = false,
  bannerMode = false
}: { 
  homepageMode?: boolean;
  bannerMode?: boolean;
}) => {
  if (bannerMode) {
    return <LiveMatchGlobalBanner />;
  }
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings: cmsSettings, loading: cmsSettingsLoading } = useSiteSettings();
  const navigate = useNavigate();

  const getMatchIdFromHashOrSearch = () => {
    // 1. Try standard searchParams
    const fromSearch = searchParams.get('matchId');
    if (fromSearch) return fromSearch;

    // 2. Try parsing from window.location.hash
    const hashPart = window.location.hash || '';
    const qIndex = hashPart.indexOf('?');
    if (qIndex !== -1) {
      const queryStr = hashPart.substring(qIndex + 1);
      const urlParams = new URLSearchParams(queryStr);
      const matchId = urlParams.get('matchId');
      if (matchId) return matchId;
    }

    // 3. Try parsing from window.location.search
    const searchPart = window.location.search;
    if (searchPart) {
      const urlParams = new URLSearchParams(searchPart);
      const matchId = urlParams.get('matchId');
      if (matchId) return matchId;
    }

    // 4. If not homepageMode, check session storage or active local match
    if (!homepageMode && typeof window !== 'undefined') {
      try {
        const lastSessionId = sessionStorage.getItem('last_selected_match_id');
        if (lastSessionId && !isMatchDeleted(lastSessionId)) return lastSessionId;
        const activeLocal = getActiveMatch();
        if (activeLocal && activeLocal.id && !isMatchDeleted(activeLocal.id)) return activeLocal.id;
      } catch (_) {}
    }

    return '';
  };

  const matchIdParam = homepageMode ? '' : (getMatchIdFromHashOrSearch() || '');
  
  const [allMatches, setAllMatches] = useState<MatchState[]>(() => {
    try {
      return getLocalMatches();
    } catch (_) {
      return [];
    }
  });
  const [hasInitialMatchesLoaded, setHasInitialMatchesLoaded] = useState(false);
  const [localSelectedMatchId, setLocalSelectedMatchId] = useState<string>(() => {
    if (homepageMode) return '';
    const resolvedId = getMatchIdFromHashOrSearch();
    if (resolvedId) return resolvedId;
    const active = getActiveMatch();
    if (active && !isMatchDeleted(active.id) && !isDemoOrAIMatch(active)) return active.id;
    const all = getLocalMatches();
    if (all.length > 0) return all[0].id;
    const anyMatch = getAnyActiveOrRecentMatch();
    return anyMatch ? anyMatch.id : '';
  });
  const [selectedMatch, setSelectedMatch] = useState<MatchState | null>(() => {
    if (homepageMode) return null;
    const resolvedId = getMatchIdFromHashOrSearch();
    if (resolvedId) {
      const found = getLocalMatchById(resolvedId);
      if (found && !isMatchDeleted(found.id) && found.status !== 'deleted' && !(found as any).isDeleted && !isDemoOrAIMatch(found)) {
        return found;
      }
    }
    const active = getActiveMatch();
    if (active && !isMatchDeleted(active.id) && active.status !== 'deleted' && !(active as any).isDeleted && !isDemoOrAIMatch(active)) {
      return active;
    }
    const all = getLocalMatches();
    if (all.length > 0) {
      const firstValid = all.find(m => !isMatchDeleted(m.id) && m.status !== 'deleted' && !isDemoOrAIMatch(m));
      if (firstValid) return firstValid;
    }
    return getAnyActiveOrRecentMatch();
  });
  const [showMatchSelectionHub, setShowMatchSelectionHub] = useState(false);
  const [dismissedAutoSelect, setDismissedAutoSelect] = useState(false);
  const [typedMatchId, setTypedMatchId] = useState('');
  const [activeTab, setActiveTab] = useState<'arena' | 'scorecard' | 'overs' | 'highlights' | 'standing' | 'media'>('arena');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [copiedOBSNotification, setCopiedOBSNotification] = useState(false);
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');
  const [chartMetric, setChartMetric] = useState<'runs' | 'runrate' | 'winprob'>('runs');
  const [commentaryFilter, setCommentaryFilter] = useState<'all' | 'boundary' | 'wicket' | 'extra'>('all');
  const [commentarySearch, setCommentarySearch] = useState('');
  const [spectatorCommentaryLang, setSpectatorCommentaryLang] = useCommentaryLanguage('en');
  const [selectedScorecardInnings, setSelectedScorecardInnings] = useState<1 | 2>(1);
  const [historyResultFilter, setHistoryResultFilter] = useState<'all' | 'wins' | 'ties'>('all');
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [prevPredA, setPrevPredA] = useState<number | null>(null);
  const [showPlayerRegistration, setShowPlayerRegistration] = useState(false);

  // States for live connections and auto-refresh indicators
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'reconnecting'>('online');

  // Premium Analytics Spectator Hub custom states
  const [premiumSimRuns, setPremiumSimRuns] = useState<number>(12);
  const [premiumSimWickets, setPremiumSimWickets] = useState<number>(1);
  const [premiumFantasySystem, setPremiumFantasySystem] = useState<'standard' | 't25_blitz' | 'super_league'>('standard');
  const [premiumStrategy, setPremiumStrategy] = useState<'slugger' | 'spin_choke' | 'death_yorker'>('slugger');

  // AI Commentary Booth states
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsResponse, setInsightsResponse] = useState<string>('');
  const [insightsPrompt, setInsightsPrompt] = useState<string>('');
  const [isPodcastLoading, setIsPodcastLoading] = useState(false);
  const [podcastScript, setPodcastScript] = useState<string>('');
  const [podcastAudioBase64, setPodcastAudioBase64] = useState<string>('');
  const [insightsError, setInsightsError] = useState<string>( '');

  // Subtab navigation inside spectator screen
  const [spectatorSearchTab, setSpectatorSearchTab] = useState<'fixtures' | 'tournaments'>('fixtures');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<any | null>(null);

  const sliderRef = React.useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const firstChild = sliderRef.current.querySelector('.snap-start') as HTMLElement | null;
      const cardWidth = firstChild ? (firstChild.offsetWidth + 16) : 320;
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleAskAnalyst = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insightsPrompt.trim() || !selectedMatch) return;
    try {
      setIsInsightsLoading(true);
      setInsightsError('');
      setInsightsResponse('');
      const res = await fetch('/api/cricket/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: selectedMatch,
          question: insightsPrompt
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setInsightsResponse(data.text);
      } else {
        setInsightsError(data.error || 'The Analyst Desk encountered a slip. Try again!');
      }
    } catch (err: any) {
      console.error(err);
      setInsightsError('Network connection to the AI Analysis suite was interrupted.');
    } finally {
      setIsInsightsLoading(false);
    }
  };

  const handleGeneratePodcastSummary = async () => {
    if (!selectedMatch) return;
    try {
      setIsPodcastLoading(true);
      setInsightsError('');
      setPodcastScript('');
      setPodcastAudioBase64('');
      const res = await fetch('/api/cricket/podcast-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match: selectedMatch })
      });
      const data = await res.json();
      if (res.ok && data.script) {
        setPodcastScript(data.script);
        if (data.audio) {
          setPodcastAudioBase64(`data:audio/wav;base64,${data.audio}`);
        }
        showToast('🎙️ AI sports podcast briefing compiled!');
      } else {
        setInsightsError(data.error || 'Failed to construct the audio broadcast feed.');
      }
    } catch (err) {
      console.error(err);
      setInsightsError('Unable to synthesize match briefing at this time.');
    } finally {
      setIsPodcastLoading(false);
    }
  };

  // Format balls into over representation (e.g. 8 -> 1.2)
  const formatOvers = (balls: any) => {
    const b = Number(balls) || 0;
    const overs = Math.floor(b / 6);
    const rem = b % 6;
    return `${overs}.${rem}`;
  };

  // Calculate Run Rate (or Econ)
  const calculateRunRate = (runs: any, balls: any) => {
    const r = Number(runs) || 0;
    const b = Number(balls) || 0;
    if (b === 0) return '0.00';
    return ((r / b) * 6).toFixed(2);
  };

  // Helper to determine if a ball belongs to a given over index (0-based)
  const isBallInOver = (overBallStr: string, targetOverNo: number) => {
    if (!overBallStr || typeof overBallStr !== 'string') return false;
    if (overBallStr === '0.0') return false;
    const parts = overBallStr.split('.');
    if (parts.length !== 2) return false;
    const overPart = parseInt(parts[0], 10);
    const ballPart = parseInt(parts[1], 10);
    if (isNaN(overPart) || isNaN(ballPart)) return false;
    if (overPart === 0 && ballPart === 0) return false;
    const overIndex = ballPart === 0 ? overPart - 1 : overPart;
    return overIndex === targetOverNo;
  };

  // Dynamic pill formatting loader for recent balls
  const getPillData = (comm: any) => {
    if (!comm) return { label: '', color: 'hidden' };
    
    // Explicitly reject non-delivery commentary
    if (
      comm.overBall === '0.0' || 
      comm.type === 'milestone' || 
      comm.type === 'announcement' ||
      comm.type === 'break' ||
      comm.type === 'info' ||
      comm.specialEvent === 'retire_hurt' ||
      comm.announcementType === 'new_batsman' ||
      comm.announcementType === 'new_bowler'
    ) {
      return { label: '', color: 'hidden' };
    }

    const desc = (comm.description || '').toLowerCase();
    if (
      desc.includes('started') || 
      desc.includes('created') || 
      desc.includes('toss') || 
      desc.includes('declared') || 
      desc.includes('bulletin') || 
      desc.includes('match launched') ||
      desc.includes('draft match') ||
      desc.includes('retired hurt') ||
      desc.includes('new batsman on crease') ||
      desc.includes('bowler into the attack')
    ) {
      return { label: '', color: 'hidden' };
    }

    if (comm.type === 'wicket' || desc.includes('wicket') || desc.includes('out!')) {
      return { label: 'W', color: 'bg-rose-600 text-white border-rose-600 font-extrabold shadow-inner' };
    }

    // Check for No Ball (including taken runs)
    const isNoBallDelivery = comm.isNoBall || (comm.type === 'extra' && (desc.includes('no ball') || desc.includes('no-ball') || (desc.includes('no') && desc.includes('ball')) || desc.includes('nb'))) || (comm.ballScore && /nb/i.test(comm.ballScore));
    if (isNoBallDelivery) {
      let batRuns = comm.runsOffBat !== undefined ? Number(comm.runsOffBat) : 0;
      if (!batRuns && comm.ballScore) {
        const m = comm.ballScore.match(/(\d+)/);
        if (m) batRuns = parseInt(m[1], 10);
      }
      if (!batRuns) {
        const m = desc.match(/(?:plus|\+)\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*runs?\s*(?:scored|to\s*batsman|taken)/i) || desc.match(/(\d+)\s*(?:runs?|धावा|रन)/i);
        if (m) batRuns = parseInt(m[1], 10);
      }
      if (batRuns > 0) {
        const isSix = batRuns >= 6;
        const isFour = batRuns >= 4 && batRuns < 6;
        const color = isSix 
          ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-slate-950 border-amber-400 font-black shadow shadow-pink-500/50 animate-pulse'
          : isFour
          ? 'bg-gradient-to-r from-pink-500 to-emerald-500 text-white border-emerald-400 font-black shadow-sm'
          : 'bg-pink-600 text-white border-pink-400 dark:bg-pink-700 font-extrabold shadow-sm';
        return { label: `NB+${batRuns}`, color };
      }
      return { label: 'NB', color: 'bg-pink-100 text-pink-850 border-pink-205 dark:bg-pink-950/40 dark:text-pink-300 font-bold' };
    }

    // Check for Wide (including extra runs taken)
    const isWideDelivery = (comm.type === 'extra' && desc.includes('wide')) || (comm.ballScore && /wd/i.test(comm.ballScore));
    if (isWideDelivery) {
      let extraRuns = comm.runsOffBat !== undefined ? Number(comm.runsOffBat) : 0;
      if (!extraRuns && comm.ballScore) {
        const m = comm.ballScore.match(/(\d+)/);
        if (m) extraRuns = parseInt(m[1], 10);
      }
      if (!extraRuns) {
        const m = desc.match(/(?:plus|\+)\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*extra\s*runs?/i);
        if (m) extraRuns = parseInt(m[1], 10);
      }
      if (extraRuns > 0) {
        return { label: `WD+${extraRuns}`, color: 'bg-blue-600 text-white border-blue-400 dark:bg-blue-700 font-black shadow-sm' };
      }
      return { label: 'WD', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-bold' };
    }

    if (comm.type === 'boundary') {
      const isSix = desc.includes('six') || desc.includes('6 runs') || desc.includes(' 6 ') || desc.includes('maximum');
      return isSix 
        ? { label: '6', color: 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow shadow-amber-500/50' } 
        : { label: '4', color: 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm' };
    }
    if (comm.type === 'extra') {
      if (desc.includes('leg bye')) return { label: 'LB', color: 'bg-sky-100 text-sky-850 border-sky-205 dark:bg-sky-950/40 dark:text-sky-300 font-semibold' };
      if (desc.includes('bye')) return { label: 'B', color: 'bg-sky-100 text-sky-850 border-sky-105 dark:bg-sky-950/40 dark:text-sky-300 font-semibold' };
      return { label: 'Ex', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-450' };
    }
    // Default runs parsing
    if (desc.includes('1 run') || desc.includes('single') || desc.includes('1 runs')) return { label: '1', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350 font-bold' };
    if (desc.includes('2 runs') || desc.includes('two runs') || desc.includes('two')) return { label: '2', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold' };
    if (desc.includes('3 runs') || desc.includes('three runs') || desc.includes('three')) return { label: '3', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 font-bold' };
    if (desc.includes('4 runs') || desc.includes('four')) return { label: '4', color: 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm' };
    if (desc.includes('6 runs') || desc.includes('six')) return { label: '6', color: 'bg-amber-500 text-slate-950 border-amber-500 font-black shadow shadow-amber-500/50' };
    if (desc.includes('dot ball') || desc.includes('no run') || desc.includes('0 run') || comm.type === 'dot') return { label: '0', color: 'bg-slate-50 text-slate-400 dark:bg-slate-900/60 dark:text-slate-600' };
    
    // Explicit runs match only - NEVER blindly match arbitrary digits in announcement text!
    const numMatch = desc.match(/(\d+)\s*(?:runs?)/);
    if (numMatch) return { label: numMatch[1], color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold' };
    
    return { label: '•', color: 'bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-705' };
  };

  // Synchronize browser connection state
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch all matches list from Firestore & local storage for live selector
  useEffect(() => {
    // Initial load from local storage
    const initialLocal = getLocalMatches().filter(m => !isMatchDeleted(m.id) && !isDemoOrAIMatch(m));
    if (initialLocal.length > 0) {
      setAllMatches(initialLocal);
    }

    setConnectionStatus('reconnecting');
    const unsub = onSnapshot(collection(db, 'cricket_matches'), (snap) => {
      setConnectionStatus('online');
      setLastRefreshed(new Date());
      const remoteMatches: MatchState[] = [];
      const remoteIds = new Set<string>();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const m = { ...data, id: data.id || docSnap.id } as MatchState;
        if (!m || !m.id) return;

        // Permanently filter out matches that have been explicitly deleted
        if ((m as any).isDeleted === true || m.status === 'deleted') {
          markMatchDeleted(m.id);
          return;
        }

        if (isDemoOrAIMatch(m)) {
          return;
        }

        unmarkMatchDeleted(m.id);
        remoteMatches.push(m);
        remoteIds.add(m.id);
      });

      // Prune any deleted matches from local storage on this spectator device
      pruneDeletedMatchesFromStorage(remoteIds);

      // Merge with any active or local matches stored in localStorage
      const localMatches = getLocalMatches().filter(lm => lm.status !== 'deleted' && !(lm as any).isDeleted && !isDemoOrAIMatch(lm));
      const activeLocal = getActiveMatch();
      if (activeLocal && activeLocal.status !== 'deleted' && !(activeLocal as any).isDeleted && !isDemoOrAIMatch(activeLocal) && !localMatches.some(l => l.id === activeLocal.id)) {
        localMatches.push(activeLocal);
      }

      const matchMap = new Map<string, MatchState>();
      remoteMatches.forEach(rm => matchMap.set(rm.id, rm));
      localMatches.forEach(lm => {
        if (!matchMap.has(lm.id)) {
          matchMap.set(lm.id, lm);
        }
      });

      const combined = Array.from(matchMap.values());

      // Sort matches: live matches first, ordered by latest update / date
      combined.sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        const timeA = a.updatedAt || (a.date ? new Date(a.date).getTime() : 0) || 0;
        const timeB = b.updatedAt || (b.date ? new Date(b.date).getTime() : 0) || 0;
        if (isNaN(timeA) || isNaN(timeB)) return 0;
        return timeB - timeA;
      });

      setAllMatches(combined);
      setHasInitialMatchesLoaded(true);
    }, (error) => {
      console.warn('Warning fetching cricket_matches collection:', error);
      setConnectionStatus('offline');
      // Offline fallback only when completely offline
      const fallback = getLocalMatches().filter(m => !isMatchDeleted(m.id) && !(m as any).isDeleted && m.status !== 'deleted' && !isDemoOrAIMatch(m));
      setAllMatches(fallback);
      setHasInitialMatchesLoaded(true);
    });

    // Cross-device Firebase Realtime Database live sync for instant status updates on other laptops
    const unsubRtdbList = subscribeToRealtimeDBMatchesList((rtdbMatches: any[]) => {
      if (!Array.isArray(rtdbMatches) || rtdbMatches.length === 0) return;
      setAllMatches(prev => {
        const map = new Map<string, MatchState>();
        prev.forEach(p => {
          if (!isMatchDeleted(p.id) && p.status !== 'deleted' && !(p as any).isDeleted && !isDemoOrAIMatch(p)) {
            map.set(p.id, p);
          }
        });
        rtdbMatches.forEach(rm => {
          if (rm && rm.id && !isMatchDeleted(rm.id) && rm.status !== 'deleted' && !(rm as any).isDeleted && !isDemoOrAIMatch(rm)) {
            const existing = map.get(rm.id);
            if (!existing || (rm.updatedAt || 0) >= (existing.updatedAt || 0) || rm.status === 'completed') {
              map.set(rm.id, { ...(existing || {}), ...rm });
            }
          }
        });
        const combined = Array.from(map.values());
        combined.sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          const timeA = a.updatedAt || (a.date ? new Date(a.date).getTime() : 0) || 0;
          const timeB = b.updatedAt || (b.date ? new Date(b.date).getTime() : 0) || 0;
          return timeB - timeA;
        });
        return combined;
      });
    });

    // Realtime Database completed match listener for instant match result propagation across devices
    const unsubCompleted = subscribeToRealtimeDBCompletedMatch((completedMatch: any) => {
      if (completedMatch && completedMatch.id && !isDemoOrAIMatch(completedMatch)) {
        setAllMatches(prev => {
          const idx = prev.findIndex(m => m.id === completedMatch.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...completedMatch, status: 'completed' };
            return copy;
          }
          return [completedMatch, ...prev];
        });
        setSelectedMatch(current => {
          if (current && current.id === completedMatch.id) {
            return { ...current, ...completedMatch, status: 'completed' };
          }
          return current;
        });
      }
    });

    // Subscribe to cross-tab / cross-component match sync
    const unsubSync = subscribeToMatchSync(() => {
      const active = getLocalMatches().filter(m => !isMatchDeleted(m.id) && m.status !== 'deleted' && !(m as any).isDeleted && !isDemoOrAIMatch(m));
      if (active.length > 0) {
        setAllMatches(prev => {
          const map = new Map<string, MatchState>();
          prev.forEach(p => { if (!isMatchDeleted(p.id) && p.status !== 'deleted' && !(p as any).isDeleted && !isDemoOrAIMatch(p)) map.set(p.id, p); });
          active.forEach(a => { if (map.has(a.id) && !isMatchDeleted(a.id) && a.status !== 'deleted' && !(a as any).isDeleted && !isDemoOrAIMatch(a)) map.set(a.id, { ...map.get(a.id)!, ...a }); });
          return Array.from(map.values());
        });
      }
      setSelectedMatch(current => (current && (isMatchDeleted(current.id) || current.status === 'deleted' || (current as any).isDeleted || isDemoOrAIMatch(current)) ? null : current));
    });

    const handleMatchDeleted = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        setAllMatches(prev => prev.filter(m => m.id !== id));
        setSelectedMatch(current => (current && current.id === id ? null : current));
      }
    };
    window.addEventListener('cricket_match_deleted', handleMatchDeleted);

    return () => {
      unsub();
      unsubRtdbList();
      unsubCompleted();
      unsubSync();
      window.removeEventListener('cricket_match_deleted', handleMatchDeleted);
    };
  }, []);

  // Smooth scroll to spectator hub if navigated with #spectator-hub hash
  useEffect(() => {
    if (window.location.hash === '#spectator-hub' || window.location.hash.includes('spectator')) {
      const timer = setTimeout(() => {
        const el = document.getElementById('spectator-hub');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [homepageMode]);

  // Listen to cricket tournaments in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_tournaments'), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({ ...data, id: data.id || doc.id });
      });
      setTournaments(list);
    }, (err) => {
      console.warn("Warning subscribing to cricket_tournaments:", err);
    });
    return () => unsub();
  }, []);

  // Auto-select the first live match if none selected
  // Disposed to show only Live Matches cards by default on page load/refresh, requiring a click to view full scorecard.

  // Keep tournaments in ref for instant enrichment without triggering subscription re-runs
  const tournamentsRef = useRef<any[]>([]);
  useEffect(() => {
    tournamentsRef.current = tournaments || [];
  }, [tournaments]);

  // Listen in real-time to the currently selected Match ID document
  useEffect(() => {
    const targetMatchId = homepageMode ? localSelectedMatchId : (matchIdParam || localSelectedMatchId);

    if (!targetMatchId) {
      if (!homepageMode) {
        const fallbackActive = getActiveMatch() || (liveMatches && liveMatches.length > 0 ? liveMatches[0] : null) || (allMatches && allMatches.length > 0 ? allMatches[0] : null) || getAnyActiveOrRecentMatch();
        if (fallbackActive && !isMatchDeleted(fallbackActive.id) && fallbackActive.status !== 'deleted' && !(fallbackActive as any).isDeleted) {
          unmarkMatchDeleted(fallbackActive.id);
          setSelectedMatch(fallbackActive);
          setLocalSelectedMatchId(fallbackActive.id);
          return;
        }
      }
      setSelectedMatch(null);
      return;
    }

    unmarkMatchDeleted(targetMatchId);

    // Immediately check local storage or existing matches for instant responsiveness
    const initialMatch = getLocalMatchById(targetMatchId) || (allMatches || []).find(m => m.id === targetMatchId) || getActiveMatch() || (!homepageMode ? getAnyActiveOrRecentMatch() : null);
    if (initialMatch && !isMatchDeleted(initialMatch.id) && initialMatch.status !== 'deleted' && !(initialMatch as any).isDeleted) {
      setSelectedMatch(initialMatch);
    }

    setConnectionStatus('reconnecting');
    const unsub = onSnapshot(doc(db, 'cricket_matches', targetMatchId), (docSnap) => {
      setConnectionStatus('online');
      setLastRefreshed(new Date());
      if (docSnap.exists()) {
        const data = docSnap.data();
        const m = { ...data, id: data.id || docSnap.id } as MatchState;
        if ((m as any).isDeleted === true || m.status === 'deleted') {
          markMatchDeleted(m.id);
          setSelectedMatch(null);
          return;
        }
        unmarkMatchDeleted(m.id);
        // Enrich with tournament Graphics and Logos
        if (m.tournamentId) {
          const tList = (tournamentsRef.current && tournamentsRef.current.length > 0) ? tournamentsRef.current : (tournaments || []);
          const t = tList.find((x: any) => x.id === m.tournamentId);
          if (t) {
            m.tournamentName = t.name;
            const tAObj = t.teams?.find((st: any) => st.id === m.teamAId || st.name === m.teamA);
            const tBObj = t.teams?.find((st: any) => st.id === m.teamBId || st.name === m.teamB);
            if (tAObj?.logo) m.teamALogo = tAObj.logo;
            if (tBObj?.logo) m.teamBLogo = tBObj.logo;
          }
        }
        setSelectedMatch(m);
      } else {
        // Document does not exist in Firestore snapshot (e.g. offline match or local storage match).
        // Check local storage or existing matches before clearing - DO NOT call markMatchDeleted!
        const fallback = getLocalMatchById(targetMatchId) || allMatches.find(m => m.id === targetMatchId) || getActiveMatch() || (!homepageMode ? getAnyActiveOrRecentMatch() : null);
        if (fallback && !isMatchDeleted(fallback.id) && fallback.status !== 'deleted' && !(fallback as any).isDeleted) {
          unmarkMatchDeleted(fallback.id);
          setSelectedMatch(fallback);
        }
      }
    }, (error) => {
      console.warn('Error subscribing to target match:', error);
      const localFallback = getLocalMatchById(targetMatchId) || allMatches.find(m => m.id === targetMatchId) || getActiveMatch() || (!homepageMode ? getAnyActiveOrRecentMatch() : null);
      if (localFallback && !isMatchDeleted(localFallback.id) && !(localFallback as any).isDeleted && localFallback.status !== 'deleted') {
        unmarkMatchDeleted(localFallback.id);
        setSelectedMatch(localFallback);
      }
    });

    // Also subscribe to Firebase Realtime Database for zero-latency instant updates across all visitor devices
    const unsubRtdb = subscribeToRealtimeDBMatch(targetMatchId, (remoteMatch: any) => {
      if (!remoteMatch || isMatchDeleted(targetMatchId) || (remoteMatch as any).isDeleted || remoteMatch.status === 'deleted') {
        return;
      }
      setSelectedMatch(prev => {
        if (!prev || (remoteMatch.updatedAt || 0) >= (prev.updatedAt || 0) || (remoteMatch.version || 0) >= (prev.version || 0)) {
          return remoteMatch;
        }
        return prev;
      });
      setLastRefreshed(new Date());
    });

    // Also sync with local storage updates in real-time
    const unsubSync = subscribeToMatchSync(() => {
      if (isMatchDeleted(targetMatchId)) {
        setSelectedMatch(null);
        return;
      }
      const updatedLocal = getLocalMatchById(targetMatchId);
      if (updatedLocal && !isMatchDeleted(updatedLocal.id) && updatedLocal.status !== 'deleted' && !(updatedLocal as any).isDeleted) {
        setSelectedMatch(prev => {
          if (!prev || (updatedLocal.updatedAt || 0) >= (prev.updatedAt || 0)) {
            return updatedLocal;
          }
          return prev;
        });
      }
    });

    return () => {
      unsub();
      unsubRtdb();
      unsubSync();
    };
  }, [matchIdParam, homepageMode, localSelectedMatchId]);

  useEffect(() => {
    const currentId = homepageMode ? '' : (getMatchIdFromHashOrSearch() || '');
    if (currentId && currentId !== localSelectedMatchId) {
      setLocalSelectedMatchId(currentId);
    }
  }, [homepageMode, searchParams]);

  const liveMatches = useMemo(() => {
    // 1. Gather all genuine live matches created by score manager from allMatches
    const list = allMatches.filter(m => {
      if (!m || m.status !== 'live' || m.isHidden || m.isBlocked || isMatchDeleted(m.id) || (m as any).isDeleted === true || m.status === 'deleted' || isDemoOrAIMatch(m)) return false;
      return true;
    });

    // Only if completely offline and list is empty, fallback to active local match
    if (list.length === 0 && connectionStatus === 'offline') {
      const activeLocal = getActiveMatch();
      if (activeLocal && activeLocal.status === 'live' && !isMatchDeleted(activeLocal.id) && !(activeLocal as any).isDeleted && !isDemoOrAIMatch(activeLocal)) {
        list.push(activeLocal);
      }
    }

    const enrichedList = list.map(m => {
      const enriched = { ...m };
      if (enriched.tournamentId) {
        const t = tournaments?.find(x => x.id === enriched.tournamentId);
        if (t) {
          enriched.tournamentName = t.name;
          const tAObj = t.teams?.find((st: any) => st.id === enriched.teamAId || st.name === enriched.teamA);
          const tBObj = t.teams?.find((st: any) => st.id === enriched.teamBId || st.name === enriched.teamB);
          if (tAObj?.logo) enriched.teamALogo = tAObj.logo;
          if (tBObj?.logo) enriched.teamBLogo = tBObj.logo;
        }
      }
      return enriched;
    });

    return enrichedList;
  }, [allMatches, tournaments, connectionStatus]);

  // Auto-select latest live match on dedicated live spectator page and homepage if no specific match
  useEffect(() => {
    const currentParam = searchParams.get('matchId') || getMatchIdFromHashOrSearch();

    if (currentParam) {
      if (!localSelectedMatchId || localSelectedMatchId !== currentParam) {
        setLocalSelectedMatchId(currentParam);
      }
      return;
    }

    if (liveMatches.length > 0) {
      if (homepageMode) {
        if (!localSelectedMatchId || !liveMatches.some(m => m.id === localSelectedMatchId)) {
          setLocalSelectedMatchId(liveMatches[0].id);
        }
      } else {
        // If there is no param in URL, auto-select first live match
        const firstLive = liveMatches[0];
        if (firstLive && firstLive.id) {
          unmarkMatchDeleted(firstLive.id);
          setLocalSelectedMatchId(firstLive.id);
          setSelectedMatch(firstLive);
          setSearchParams({ matchId: firstLive.id }, { replace: true });
        }
      }
    } else {
      if (homepageMode) {
        if (localSelectedMatchId && !allMatches.some(m => m.id === localSelectedMatchId)) {
          setLocalSelectedMatchId('');
          setSelectedMatch(null);
        }
      } else if (allMatches.length > 0 && !localSelectedMatchId) {
        // Auto-select most recent match if none selected
        const mostRecent = allMatches[0];
        if (mostRecent && mostRecent.id) {
          unmarkMatchDeleted(mostRecent.id);
          setLocalSelectedMatchId(mostRecent.id);
          setSelectedMatch(mostRecent);
          setSearchParams({ matchId: mostRecent.id }, { replace: true });
        }
      } else if (!localSelectedMatchId) {
        const activeLocal = getActiveMatch();
        if (activeLocal && activeLocal.id && activeLocal.status !== 'deleted') {
          unmarkMatchDeleted(activeLocal.id);
          setLocalSelectedMatchId(activeLocal.id);
          setSelectedMatch(activeLocal);
          if (!homepageMode) {
            setSearchParams({ matchId: activeLocal.id }, { replace: true });
          }
        }
      }
    }
  }, [homepageMode, searchParams, allMatches, liveMatches, setSearchParams, localSelectedMatchId]);

  const upcomingMatches = useMemo(() => {
    return allMatches.filter(m => {
      if (!m || m.status !== 'setup' || m.isHidden || m.isBlocked) return false;
      // "and Spectator Scoreboard section show the upcoming matches if scoreboard manager updated the match."
      // scoreboard manager updated the match means m.updatedAt has been set and exists.
      return !!m.updatedAt;
    });
  }, [allMatches]);

  const completedMatches = useMemo(() => allMatches.filter(m => m && m.status === 'completed' && !m.isHidden && !m.isBlocked), [allMatches]);

  const filteredCompletedMatches = useMemo(() => {
    const query = completedSearchQuery.trim().toLowerCase();
    let matches = completedMatches;
    
    if (query) {
      matches = matches.filter(m => 
        m && (
          (m.teamA || '').toLowerCase().includes(query) || 
          (m.teamB || '').toLowerCase().includes(query)
        )
      );
    }
    
    if (historyResultFilter === 'wins') {
      matches = matches.filter(m => m && m.winner !== 'Tie');
    } else if (historyResultFilter === 'ties') {
      matches = matches.filter(m => m && m.winner === 'Tie');
    }
    
    return matches;
  }, [completedMatches, completedSearchQuery, historyResultFilter]);

  // Compute player matches played and averages from completed match history database
  const playerStatsMap = useMemo(() => {
    const stats: Record<string, { matches: number; totalRuns: number; avg: number }> = {};
    for (const past of allMatches) {
      if (!past || past.status !== 'completed') continue;
      const allBatters = [
        ...(past.innings1?.batsmen || []),
        ...(past.innings2?.runs ? (past.innings2.batsmen || []) : [])
      ];
      for (const b of allBatters) {
        if (!b.name) continue;
        const key = b.name.toLowerCase().trim();
        if (!stats[key]) {
          stats[key] = { matches: 0, totalRuns: 0, avg: 0 };
        }
        stats[key].matches += 1;
        stats[key].totalRuns += b.runs;
      }
    }
    // Compute averages
    for (const key of Object.keys(stats)) {
      stats[key].avg = stats[key].matches > 0 ? Number((stats[key].totalRuns / stats[key].matches).toFixed(1)) : 0;
    }
    return stats;
  }, [allMatches]);

  const currentInnings = useMemo(() => {
    if (!selectedMatch) return null;
    return selectedMatch.currentInningsNum === 1 ? selectedMatch.innings1 : (selectedMatch.innings2 || selectedMatch.innings1);
  }, [selectedMatch]);

  const activeSpotlight = useMemo(() => {
    if (!currentInnings) return null;
    const striker = currentInnings.batsmen?.[currentInnings.strikerIndex];
    const nonStriker = currentInnings.batsmen?.[currentInnings.nonStrikerIndex];
    const bowler = currentInnings.bowlers?.[currentInnings.currentBowlerIndex] || currentInnings.bowlers?.find(b => b.isCurrent);

    const hasBowled = Boolean(currentInnings.ballsBowled && currentInnings.ballsBowled > 0);
    const currentOverNo = hasBowled ? Math.floor((currentInnings.ballsBowled - 1) / 6) : 0;
    const currentOverBalls = hasBowled
      ? (() => {
          const raw = (currentInnings.commentaryList || [])
            .filter((c: any) => {
              if (!c || !c.overBall || c.overBall === '0.0') return false;
              if (
                c.type === 'milestone' || 
                c.type === 'announcement' || 
                c.type === 'break' || 
                c.type === 'info' || 
                c.specialEvent === 'retire_hurt' ||
                c.announcementType === 'new_batsman' ||
                c.announcementType === 'new_bowler'
              ) return false;
              const desc = (c.description || '').toLowerCase();
              if (
                desc.includes('started') || 
                desc.includes('created') || 
                desc.includes('toss') || 
                desc.includes('declared') || 
                desc.includes('bulletin') || 
                desc.includes('match launched') ||
                desc.includes('draft match') ||
                desc.includes('retired hurt') ||
                desc.includes('new batsman on crease') ||
                desc.includes('bowler into the attack')
              ) return false;
              return isBallInOver(c.overBall, currentOverNo);
            });

          // Deduplicate so only one entry per overBall delivery is kept (prevents WWW duplicate pills)
          const deduped: any[] = [];
          const seenIds = new Set<string>();
          const seenWickets = new Set<string>();
          for (const b of raw) {
            if (b.id && seenIds.has(b.id)) continue;
            if (b.id) seenIds.add(b.id);
            if (b.type === 'wicket') {
              if (seenWickets.has(b.overBall)) continue;
              seenWickets.add(b.overBall);
            }
            deduped.push(b);
          }
          return deduped.slice(0, 12).reverse();
        })()
      : [];

    return { striker, nonStriker, bowler, currentOverNo, currentOverBalls };
  }, [currentInnings]);

  const { striker, nonStriker, bowler, currentOverBalls } = activeSpotlight || {};

  useEffect(() => {
    if (!selectedMatch) return;
    const inn = selectedMatch.currentInningsNum === 1 ? selectedMatch.innings1 : selectedMatch.innings2;
    if (!inn || inn.runs === 0) return;

    // Dynamic win probability calculation
    let predA = 50;
    const totalBalls = selectedMatch.oversLimit * 6;
    if (selectedMatch.currentInningsNum === 1) {
      predA = Math.min(85, Math.max(15, 50 + Math.round((inn.runs / totalBalls) * 15)));
    } else if (selectedMatch.targetRuns) {
      const ballsLeft = totalBalls - inn.ballsBowled;
      const runsRequired = selectedMatch.targetRuns - inn.runs;
      const rrr = ballsLeft > 0 ? (runsRequired / ballsLeft) * 6 : 10;
      predA = Math.min(95, Math.max(5, 100 - Math.round(rrr * 8)));
    }

    if (prevPredA !== null) {
      const diff = Math.abs(predA - prevPredA);
      if (diff >= 20) {
        showToast(`⚡ Win Probability Swing! Probability swung by ${diff}%! Outstanding match turnabout!`);
      }
    }
    setPrevPredA(predA);
  }, [
    selectedMatch?.innings1?.runs,
    selectedMatch?.innings1?.wickets,
    selectedMatch?.innings1?.ballsBowled,
    selectedMatch?.innings2?.runs,
    selectedMatch?.innings2?.wickets,
    selectedMatch?.innings2?.ballsBowled,
    selectedMatch?.currentInningsNum
  ]);

  const activeBowlerData = useMemo(() => {
    if (!currentInnings) return null;
    const bw = currentInnings.bowlers?.[currentInnings.currentBowlerIndex];
    if (!bw) return null;
    const econ = calculateRunRate(bw.runsConceded, bw.ballsBowled);
    const dotsCount = (currentInnings.commentaryList || []).filter(c => {
      const d = (c.description || '').toLowerCase();
      return d.includes('no run') || d.includes('dot ball') || d.includes('0 run');
    }).length;
    const dotsPercentage = bw.ballsBowled > 0 ? ((dotsCount / bw.ballsBowled) * 100).toFixed(0) : '0';
    return { bw, econ, dotsCount, dotsPercentage };
  }, [currentInnings]);

  // Compute Outstanding performers of match (highest score, highest wickets)
  const matchPerformanceHighlights = useMemo(() => {
    if (!selectedMatch || (!selectedMatch.innings1 && !selectedMatch.innings2)) return null;
    
    let bestBatter = { name: 'N/A', runs: 0, balls: 0 };
    let bestBowler = { name: 'N/A', wickets: 0, runs: 0 };

    const processInningsPerformers = (inn: Innings | null) => {
      if (!inn) return;
      (inn.batsmen || []).forEach(b => {
        if (b.runs > bestBatter.runs) {
          bestBatter = { name: b.name, runs: b.runs, balls: b.balls };
        }
      });
      (inn.bowlers || []).forEach(bw => {
        if (bw.wickets > bestBowler.wickets || (bw.wickets === bestBowler.wickets && bw.runsConceded < bestBowler.runs)) {
          bestBowler = { name: bw.name, wickets: bw.wickets, runs: bw.runsConceded };
        }
      });
    };

    processInningsPerformers(selectedMatch.innings1);
    processInningsPerformers(selectedMatch.innings2);

    return { bestBatter, bestBowler };
  }, [selectedMatch]);

  // Helper to compute Player / Man of the Match for any match item
  const getMatchPotm = (mItem: any) => {
    if (!mItem) return null;
    if (mItem.playerOfTheMatch && mItem.playerOfTheMatch.name) {
      return mItem.playerOfTheMatch;
    }
    const statsMap: { [key: string]: { name: string; runs: number; balls: number; wickets: number; runsConceded: number } } = {};
    const getOrCreatePlayer = (name: string) => {
      const key = name.trim().toLowerCase();
      if (!statsMap[key]) {
        statsMap[key] = { name: name.trim(), runs: 0, balls: 0, wickets: 0, runsConceded: 0 };
      }
      return statsMap[key];
    };
    const processInnings = (inn: Innings | null) => {
      if (!inn) return;
      (inn.batsmen || []).forEach(b => {
        if (!b.name) return;
        const p = getOrCreatePlayer(b.name);
        p.runs += b.runs;
        p.balls += b.balls;
      });
      (inn.bowlers || []).forEach(bw => {
        if (!bw.name) return;
        const p = getOrCreatePlayer(bw.name);
        p.wickets += bw.wickets;
        p.runsConceded += bw.runsConceded;
      });
    };
    if (mItem.mainMatchState) {
      processInnings(mItem.mainMatchState.innings1);
      processInnings(mItem.mainMatchState.innings2);
    }
    processInnings(mItem.innings1);
    processInnings(mItem.innings2);

    let bestPlayer = null;
    let maxPoints = -1;
    for (const key in statsMap) {
      const p = statsMap[key];
      const points = p.runs + (p.wickets * 25);
      if (points > maxPoints) {
        maxPoints = points;
        bestPlayer = p;
      } else if (points === maxPoints && points > 0) {
        if (bestPlayer && p.wickets > bestPlayer.wickets) {
          bestPlayer = p;
        } else if (bestPlayer && p.wickets === bestPlayer.wickets && p.runsConceded < bestPlayer.runsConceded) {
          bestPlayer = p;
        }
      }
    }
    if (bestPlayer && (bestPlayer.runs > 0 || bestPlayer.wickets > 0)) {
      return {
        ...bestPlayer,
        points: maxPoints
      };
    }
    return null;
  };

  // Compute Player of the Match rating points (Runs + Wickets * 25)
  const playerOfTheMatch = useMemo(() => getMatchPotm(selectedMatch), [selectedMatch]);

  const selectMatch = (id: string) => {
    if (!id) {
      // Clear selected match and redirect to the home page Spectator Scoreboard section
      setSelectedMatch(null);
      setLocalSelectedMatchId(null);
      setDismissedAutoSelect(true);
      setShowMatchSelectionHub(true);
      navigate('/#spectator-hub');
      setTimeout(() => {
        const el = document.getElementById('spectator-hub');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
      return;
    }

    if (homepageMode) {
      unmarkMatchDeleted(id);
      navigate(`/live/cricket-details?matchId=${encodeURIComponent(id)}`);
      return;
    }

    unmarkMatchDeleted(id);
    setShowMatchSelectionHub(false);
    setLocalSelectedMatchId(id);
    const immediate = allMatches.find(m => m.id === id) || getLocalMatchById(id) || getAnyActiveOrRecentMatch();
    if (immediate) {
      setSelectedMatch(immediate);
    }
    const updated = new URLSearchParams(searchParams);
    updated.set('matchId', id);
    setSearchParams(updated);
  };

  const handleCopyLink = () => {
    if (!selectedMatch) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?matchId=${selectedMatch.id}&spectator=true`;
    copyToClipboard(shareUrl)
      .then(() => {
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      })
      .catch((err) => {
        console.error("Clipboard copy failed", err);
      });
  };

  const handleCopyOBSLink = () => {
    if (!selectedMatch) return;
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    const overlayUrl = `${origin}${window.location.pathname}#/live/cricket-overlay?matchId=${selectedMatch.id}`;
    copyToClipboard(overlayUrl)
      .then(() => {
        setCopiedOBSNotification(true);
        setTimeout(() => setCopiedOBSNotification(false), 2000);
        showToast('🔗 OBS Overlay Link Copied! Paste as standard transparent 1920x1080 Browser Source.');
      })
      .catch((err) => {
        console.error("Clipboard copy failed", err);
      });
  };

  const [downloadingBanner, setDownloadingBanner] = useState(false);

  const handleDownloadBanner = async (bannerUrl: string, teamA?: string, teamB?: string) => {
    if (!bannerUrl) {
      showToast('No match banner available to download.');
      return;
    }
    try {
      setDownloadingBanner(true);
      showToast('Downloading match banner...');
      const cleanA = (teamA || 'TeamA').replace(/[^a-zA-Z0-9]/g, '_');
      const cleanB = (teamB || 'TeamB').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${cleanA}_vs_${cleanB}_Match_Banner.png`;

      // 1. Data URL (Base64) direct download
      if (bannerUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = bannerUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Banner downloaded successfully!');
        setDownloadingBanner(false);
        return;
      }

      // 2. Fetch as blob to force browser download
      try {
        const res = await fetch(bannerUrl, { mode: 'cors' });
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
          showToast('Banner downloaded successfully!');
          setDownloadingBanner(false);
          return;
        }
      } catch (fetchErr) {
        // Fallback below
      }

      // 3. Fallback anchor tag download
      const link = document.createElement('a');
      link.href = bannerUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Banner download initiated!');
    } catch (err) {
      console.warn('Banner download error:', err);
      window.open(bannerUrl, '_blank');
      showToast('Opened banner in new tab.');
    } finally {
      setTimeout(() => setDownloadingBanner(false), 1200);
    }
  };

  const handleExportMatchPDF = (matchParam?: any) => {
    // Safely distinguish between a MatchState object and a React click event
    const isSyntheticEvent = matchParam && (matchParam.nativeEvent || matchParam.target || matchParam.preventDefault || (!matchParam.teamA && !matchParam.innings1));
    const rawTarget = isSyntheticEvent ? null : matchParam;
    const resolvedMatch = rawTarget || (selectedMatch?.innings1 ? selectedMatch : (allMatches.find(m => m.id === localSelectedMatchId) || selectedMatch));
    if (!resolvedMatch || !resolvedMatch.innings1) {
      showToast('No match data to export!');
      return;
    }

    generateLedgerPDF(resolvedMatch);
  };

  const generateLedgerPDF = (selectedMatch: any) => {
    try {
      showToast('Generating Scoreboard PDF...');
      const doc = new jsPDF();
      
      // Set PDF properties to make it read-only and secured
      doc.setProperties({
        title: "Official Secure Match Scoreboard",
        subject: "Read-Only Scorecard Summary Records",
        author: "shubhamhingane.in",
        creator: "Developed By shubhamhingane.in +91-7719959593",
        keywords: "read-only, secured, cricket scoreboard"
      });
      
      // Compute Player of the Match and dynamic metrics
      const statsMap: { [key: string]: { name: string; runs: number; balls: number; wickets: number; runsConceded: number; sixes: number; fours: number } } = {};
      const getOrCreatePlayer = (name: string) => {
        const key = name.trim().toLowerCase();
        if (!statsMap[key]) {
          statsMap[key] = { name: name.trim(), runs: 0, balls: 0, wickets: 0, runsConceded: 0, sixes: 0, fours: 0 };
        }
        return statsMap[key];
      };

      const processInningsForPotm = (inn: any) => {
        if (!inn) return;
        (inn.batsmen || []).forEach((b: any) => {
          if (!b || !b.name) return;
          const p = getOrCreatePlayer(b.name);
          p.runs += b.runs || 0;
          p.balls += b.balls || 0;
          p.fours += b.fours || 0;
          p.sixes += b.sixes || 0;
        });
        (inn.bowlers || []).forEach((bw: any) => {
          if (!bw || !bw.name) return;
          const p = getOrCreatePlayer(bw.name);
          p.wickets += bw.wickets || 0;
          p.runsConceded += bw.runsConceded || 0;
        });
      };

      processInningsForPotm(selectedMatch.innings1);
      processInningsForPotm(selectedMatch.innings2);

      let potmPlayer = 'N/A';
      let potmDetails = '';
      if (playerOfTheMatch) {
        potmPlayer = playerOfTheMatch.name;
        // Lookup in local stats map to fetch rich metrics like sixes/fours
        const p = statsMap[playerOfTheMatch.name.trim().toLowerCase()];
        if (p) {
          potmDetails = `${p.runs} runs (${p.fours || 0}x4, ${p.sixes || 0}x6) | ${p.wickets} wickets conceding ${p.runsConceded} runs`;
        } else {
          potmDetails = `${playerOfTheMatch.runs} runs | ${playerOfTheMatch.wickets} wickets conceding ${playerOfTheMatch.runsConceded} runs`;
        }
      } else {
        let bestPlayerLocal = null;
        let maxPoints = -1;

        for (const key in statsMap) {
          const p = statsMap[key];
          const points = p.runs + (p.wickets * 25);
          if (points > maxPoints && points > 0) {
            maxPoints = points;
            bestPlayerLocal = p;
          } else if (points === maxPoints && points > 0) {
            if (bestPlayerLocal && p.wickets > (bestPlayerLocal.wickets || 0)) {
              bestPlayerLocal = p;
            } else if (bestPlayerLocal && p.wickets === (bestPlayerLocal.wickets || 0) && p.runsConceded < (bestPlayerLocal.runsConceded || 999)) {
              bestPlayerLocal = p;
            }
          }
        }
        if (bestPlayerLocal) {
          potmPlayer = bestPlayerLocal.name;
          potmDetails = `${bestPlayerLocal.runs} runs (${bestPlayerLocal.fours || 0}x4, ${bestPlayerLocal.sixes || 0}x6) | ${bestPlayerLocal.wickets} wickets conceding ${bestPlayerLocal.runsConceded || 0} runs`;
        }
      }

      // Find top scorers
      let topBatterName = 'N/A';
      let topBatterRuns = 0;
      let topBowlerName = 'N/A';
      let topBowlerWickets = 0;
      let topBowlerRuns = 999;
      
      const findHighlights = (inn: any) => {
        if (!inn) return;
        (inn.batsmen || []).forEach((b: any) => {
          if (!b || !b.name) return;
          if ((b.runs || 0) > topBatterRuns) {
            topBatterRuns = b.runs;
            topBatterName = b.name;
          }
        });
        (inn.bowlers || []).forEach((bw: any) => {
          if (!bw || !bw.name) return;
          if ((bw.wickets || 0) > topBowlerWickets) {
            topBowlerWickets = bw.wickets;
            topBowlerName = bw.name;
            topBowlerRuns = bw.runsConceded || 0;
          } else if ((bw.wickets || 0) === topBowlerWickets && (bw.runsConceded || 0) < topBowlerRuns) {
            topBowlerName = bw.name;
            topBowlerRuns = bw.runsConceded || 0;
          }
        });
      };
      findHighlights(selectedMatch.innings1);
      findHighlights(selectedMatch.innings2);

      // Page header - CUSTOM DESIGNED footprint
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(79, 70, 229); // Royal Indigo Accent
      doc.text('Street Sports Scoreboard', 14, 18);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(100);
      doc.text('Developed By Shubham Hingane +91-7719959593', 14, 23);
      
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()} (READ-ONLY SECURED DOCUMENT)`, 14, 28);
      doc.text(`Match Date: ${selectedMatch.date || 'N/A'}`, 14, 33);
      doc.text(`Match Status: ${selectedMatch.status === 'live' ? 'LIVE IN PROGRESS' : 'COMPLETED'}`, 14, 38);
      
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 41, 196, 41);
      
      // Match Header Summary
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${selectedMatch.teamA} vs ${selectedMatch.teamB}`, 14, 49);
      
      doc.setFontSize(10.5);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Overs Limit: ${selectedMatch.oversLimit || 'N/A'} Overs`, 14, 55);
      doc.text(`Toss Winner: ${selectedMatch.tossWinner} (elected to ${selectedMatch.tossChoice === 'bat' ? 'bat' : 'bowl'} first)`, 14, 60);
      
      if (selectedMatch.status === 'completed') {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(190, 110, 11);
        doc.text(`Result: ${selectedMatch.winner === 'Tie' ? 'Match Tie!' : `${selectedMatch.winner} ${selectedMatch.winReason || 'wins'}`}`, 14, 66);
      } else {
        doc.setTextColor(70);
        doc.text(`Status: Match Currently Live`, 14, 66);
      }
      
      // Match Outstanding Highlights Panel Card
      doc.setFillColor(245, 247, 250);
      doc.rect(14, 71, 182, 24, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129); // Emerald color
      doc.text('★ Developed By Shubham Hingane +91-7719959593', 18, 77);
      
      doc.setTextColor(40);
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Player of the Match: ${potmPlayer !== 'N/A' ? `${potmPlayer} (${potmDetails})` : 'TBD (requires runs/wickets)'}`, 18, 83);
      
      const batterText = topBatterName !== 'N/A' ? `${topBatterName} (${topBatterRuns} runs)` : 'None yet';
      const bowlerText = topBowlerName !== 'N/A' ? `${topBowlerName} (${topBowlerWickets} wkts / ${topBowlerRuns} runs)` : 'None yet';
      doc.text(`Best Innings Batting: ${batterText}   |   Best Bowling Figures: ${bowlerText}`, 18, 89);

      // Innings 1 Card
      doc.setTextColor(30);
      doc.setFontSize(13);
      doc.setFont('Helvetica', 'bold');
      doc.text(`1st Innings: ${selectedMatch.innings1.battingTeam} Scorecard`, 14, 105);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Score: ${selectedMatch.innings1.runs}/${selectedMatch.innings1.wickets} in ${formatOvers(selectedMatch.innings1.ballsBowled)} overs`, 14, 110);
      
      // Innings 1 Batting table
      const inn1BatRows = (selectedMatch.innings1.batsmen || []).map((b: any) => [
        b.name,
        b.isOut ? (b.outMode ? `Out (${b.outMode}${b.dismissedBy ? ` - bowling: ${b.dismissedBy}` : ''})` : 'Out') : 'not out',
        (b.runs || 0).toString(),
        (b.balls || 0).toString(),
        (b.fours || 0).toString(),
        (b.sixes || 0).toString(),
        b.balls > 0 ? (((b.runs || 0) / b.balls) * 100).toFixed(1) : '0.0'
      ]);
      
      autoTable(doc, {
        startY: 114,
        head: [['Batsman', 'Dismissal Status', 'Runs', 'Balls', '4s', '6s', 'S/R']],
        body: inn1BatRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8.5 }
      });
      
      let lastY1 = (doc as any).lastAutoTable.finalY;
      
      // Extras break-out line
      const ext1 = selectedMatch.innings1.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
      const extTotal1 = (ext1.wides || 0) + (ext1.noBalls || 0) + (ext1.byes || 0) + (ext1.legByes || 0) + (ext1.penalty || 0);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(60);
      doc.text(`Extras: ${extTotal1} (wides: ${ext1.wides || 0}, no-balls: ${ext1.noBalls || 0}, byes: ${ext1.byes || 0}, legbyes: ${ext1.legByes || 0}, penalty: ${ext1.penalty || 0})`, 14, lastY1 + 6);
      
      // Fall of Wickets line
      const fowItems1 = selectedMatch.innings1.fallOfWickets && selectedMatch.innings1.fallOfWickets.length > 0
        ? selectedMatch.innings1.fallOfWickets.map((fw: any) => `Wkt ${fw.wicketNo}: ${fw.score} (${fw.batsmanName}, Ov ${fw.oversList})`).join(' | ')
        : 'No wickets fell';
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Fall of Wickets: ${fowItems1}`, 14, lastY1 + 11);
      
      let bowlStartY1 = lastY1 + 16;
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30);
      doc.text(`${selectedMatch.innings1.battingTeam} Bowlers Performance`, 14, bowlStartY1);
      
      const inn1BowlRows = (selectedMatch.innings1.bowlers || []).map((bw: any) => [
        bw.name,
        formatOvers(bw.ballsBowled || 0),
        (bw.maidens || 0).toString(),
        (bw.runsConceded || 0).toString(),
        (bw.wickets || 0).toString(),
        bw.ballsBowled > 0 ? (((bw.runsConceded || 0) / bw.ballsBowled) * 6).toFixed(2) : '0.00'
      ]);
      
      autoTable(doc, {
        startY: bowlStartY1 + 4,
        head: [['Bowler', 'Overs', 'Maidens', 'Runs Conceded', 'Wickets', 'Economy']],
        body: inn1BowlRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8.5 }
      });
      
      let nextY = (doc as any).lastAutoTable.finalY + 15;
      
      // Check if we need a new page for Innings 2 Scorecard
      if (selectedMatch.innings2) {
        if (nextY > 200) {
          doc.addPage();
          nextY = 20;
        }
        
        doc.setFontSize(13);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(`2nd Innings: ${selectedMatch.innings2.battingTeam} Scorecard`, 14, nextY);
        
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Total Score: ${selectedMatch.innings2.runs}/${selectedMatch.innings2.wickets} in ${formatOvers(selectedMatch.innings2.ballsBowled)} overs`, 14, nextY + 6);
        
        const inn2BatRows = (selectedMatch.innings2.batsmen || []).map((b: any) => [
          b.name,
          b.isOut ? (b.outMode ? `Out (${b.outMode}${b.dismissedBy ? ` - bowling: ${b.dismissedBy}` : ''})` : 'Out') : 'not out',
          (b.runs || 0).toString(),
          (b.balls || 0).toString(),
          (b.fours || 0).toString(),
          (b.sixes || 0).toString(),
          b.balls > 0 ? (((b.runs || 0) / b.balls) * 100).toFixed(1) : '0.0'
        ]);
        
        autoTable(doc, {
          startY: nextY + 11,
          head: [['Batsman', 'Dismissal Status', 'Runs', 'Balls', '4s', '6s', 'S/R']],
          body: inn2BatRows,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          styles: { fontSize: 8.5 }
        });
        
        let lastY2 = (doc as any).lastAutoTable.finalY;
        
        const ext2 = selectedMatch.innings2.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
        const extTotal2 = (ext2.wides || 0) + (ext2.noBalls || 0) + (ext2.byes || 0) + (ext2.legByes || 0) + (ext2.penalty || 0);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(60);
        doc.text(`Extras: ${extTotal2} (wides: ${ext2.wides || 0}, no-balls: ${ext2.noBalls || 0}, byes: ${ext2.byes || 0}, legbyes: ${ext2.legByes || 0}, penalty: ${ext2.penalty || 0})`, 14, lastY2 + 6);
        
        const fowItems2 = selectedMatch.innings2.fallOfWickets && selectedMatch.innings2.fallOfWickets.length > 0
          ? selectedMatch.innings2.fallOfWickets.map((fw: any) => `Wkt ${fw.wicketNo}: ${fw.score} (${fw.batsmanName}, Ov ${fw.oversList})`).join(' | ')
          : 'No wickets fell';
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Fall of Wickets: ${fowItems2}`, 14, lastY2 + 11);
        
        let bowlStartY2 = lastY2 + 16;
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(`${selectedMatch.innings2.battingTeam} Bowlers Performance`, 14, bowlStartY2);
        
        const inn2BowlRows = (selectedMatch.innings2.bowlers || []).map((bw: any) => [
          bw.name,
          formatOvers(bw.ballsBowled || 0),
          (bw.maidens || 0).toString(),
          (bw.runsConceded || 0).toString(),
          (bw.wickets || 0).toString(),
          bw.ballsBowled > 0 ? (((bw.runsConceded || 0) / bw.ballsBowled) * 6).toFixed(2) : '0.00'
        ]);
        
        autoTable(doc, {
          startY: bowlStartY2 + 4,
          head: [['Bowler', 'Overs', 'Maidens', 'Runs Conceded', 'Wickets', 'Economy']],
          body: inn2BowlRows,
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42] },
          styles: { fontSize: 8.5 }
        });
        
        nextY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Add Commentary Log Section
      if (nextY > 200) {
        doc.addPage();
        nextY = 20;
      }
      
      doc.setFontSize(13);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30);
      doc.text('Key Commentary & Delivery Logs', 14, nextY);
      
      const logsCombined: string[][] = [];
      const appendCommentary = (inn: any) => {
        if (!inn) return;
        (inn.commentaryList || []).slice().reverse().forEach((comm: any) => {
          let badgeType = "Ball";
          if (comm.type === 'wicket') badgeType = "WICKET 🔴";
          else if (comm.type === 'boundary') {
            const d = (comm.description || '').toLowerCase();
            const isSix = d.includes('six') || d.includes('6 runs');
            badgeType = isSix ? "SIXER 🚀" : "FOUR 🏏";
          } else if (comm.type === 'milestone') badgeType = "MILESTONE 🎉";
          else if (comm.type === 'extra') badgeType = "EXTRA ⚡";

          logsCombined.push([
            inn.battingTeam,
            `Over ${comm.overBall}`,
            badgeType,
            comm.description
          ]);
        });
      };
      
      appendCommentary(selectedMatch.innings1);
      if (selectedMatch.innings2) {
        appendCommentary(selectedMatch.innings2);
      }
      
      if (logsCombined.length === 0) {
        logsCombined.push(['-', '-', '-', 'No deliveries bowled or logged yet.']);
      }
      
      autoTable(doc, {
        startY: nextY + 4,
        head: [['Innings / Batting Team', 'Delivery Info', 'Category', 'Over Summary Log / Incident Notes']],
        body: logsCombined,
        theme: 'striped',
        headStyles: { fillColor: [190, 110, 11] },
        styles: { fontSize: 8 }
      });
      
      // Apply Watermark & Developed By footprint on every page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Watermarks removed per client request
        
        // Footnote branding
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(140, 140, 140);
        doc.text('Developed By Shubham Hingane +91-7719959593', 14, 287);
        doc.text(`Page ${i} of ${pageCount} | SECURED READ-ONLY PDF DOCUMENT`, 122, 287);
      }
      
      doc.save(`gully_scoreboard_${selectedMatch.id || Date.now()}.pdf`);
      showToast('Scoreboard PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export crashed:', err);
      showToast('Failed to compile PDF sheet. Check parameters.');
    }
  };

  if (selectedMatch && selectedMatch.isBlocked) {
    return (
      <section id="spectator-hub" className="min-h-screen py-24 bg-slate-50 dark:bg-slate-950 border-t border-b border-slate-100 dark:border-slate-900 flex items-center justify-center transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full flex justify-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-10 rounded-[2rem] text-center max-w-sm w-full shadow-2xl space-y-5 animate-fade-in text-slate-850 dark:text-slate-100">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock size={30} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-905 dark:text-white">Match Restricted</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              The match organizer has restricted public access to this live stream scoreboard.
            </p>
            <div className="pt-2">
              <button
                onClick={() => selectMatch('')}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs uppercase tracking-widest rounded-xl cursor-pointer border-none transition-all flex items-center justify-center gap-2"
              >
                <span>Return to Lobby</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (homepageMode) {
    const isExplicitlyDisabled = cmsSettings && cmsSettings.visibility && cmsSettings.visibility.spectatorArena === false;
    const hasAnyMatches = liveMatches.length > 0 || completedMatches.length > 0 || upcomingMatches.length > 0;
    // If a live match is currently playing, always make it visible to all visitors
    if (liveMatches.length === 0 && (isExplicitlyDisabled || !hasAnyMatches)) {
      return null;
    }
  }

  return (
    <section id="spectator-hub" className="min-h-screen py-24 bg-slate-50 dark:bg-slate-950 border-t border-b border-slate-100 dark:border-slate-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
          <div>
            <span className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-3 block flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              Live Spectator Arena
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Spectator <span className="text-emerald-500 font-heading italic">Scoreboard</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-xl leading-relaxed">
              Developed By shubhamhingane.in +91-7719959593
            </p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowPlayerRegistration(true)}
              className="px-4 py-3.5 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-md"
            >
              🏆 Player Registration
            </button>
            {selectedMatch && (
              <button
                onClick={() => selectMatch('')}
                className="px-4 py-3.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none"
              >
                ← Change Match
              </button>
            )}
            {selectedMatch && homepageMode && (
              <button
                onClick={() => navigate(`/live/cricket-details?matchId=${selectedMatch.id}`)}
                className="px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-md shadow-emerald-600/10"
              >
                📺 Full Spectator Mode
              </button>
            )}
          </div>
        </div>

        {/* ===================== MATCH SELECTION SCREEN (NO MATCH ID IN URL) ===================== */}
        {(!selectedMatch || homepageMode || showMatchSelectionHub) ? (
          <div className="space-y-12">
            {!homepageMode && selectedMatch && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-emerald-200">
                    Active Scoreboard: <strong className="text-emerald-600 dark:text-emerald-400">{selectedMatch.teamA} vs {selectedMatch.teamB}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMatchSelectionHub(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm shrink-0"
                >
                  Return to Scoreboard →
                </button>
              </div>
            )}

            {/* Landing Hub Sub-navigation Tabs */}
            <div className="flex border border-slate-200/50 dark:border-slate-800 p-1 mb-6 gap-2 w-full max-w-sm bg-slate-100 dark:bg-slate-905 rounded-[1.3rem] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setSpectatorSearchTab('fixtures');
                  setSelectedTournament(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-widest border-none cursor-pointer font-black transition-all flex items-center justify-center gap-2 ${
                  spectatorSearchTab === 'fixtures'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md font-extrabold scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                🏏 Quick Fixtures
              </button>
              <button
                type="button"
                onClick={() => setSpectatorSearchTab('tournaments')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-widest border-none cursor-pointer font-black transition-all flex items-center justify-center gap-2 ${
                  spectatorSearchTab === 'tournaments'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md font-extrabold scale-[1.02]'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-transparent'
                }`}
              >
                🏆 Tournaments Tab
              </button>
            </div>

            {spectatorSearchTab === 'fixtures' ? (
              <>
                {/* Live Active Matches Slider (Full-width) */}
                {(liveMatches.length > 0 || !homepageMode) && (
                  <div className="space-y-4 sm:space-y-5 bg-gradient-to-tr from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/65 dark:border-slate-800/80 p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                        </span>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Live Active Matches ({liveMatches.length})
                        </h3>
                      </div>

                      {/* Slider control arrows if more than 1 live match */}
                      {liveMatches.length > 1 && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button 
                            onClick={() => scrollSlider('left')}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                            title="Scroll Left"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button 
                            onClick={() => scrollSlider('right')}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer"
                            title="Scroll Right"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    {liveMatches.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center text-slate-400 dark:text-slate-500 font-medium max-w-lg mx-auto shadow-sm">
                        <Radio size={32} className="mx-auto mb-3 opacity-40 text-rose-500 animate-pulse" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No matches active at the moment</p>
                        <p className="text-xs text-slate-455 leading-relaxed">There are no cricket matches currently recording live scores right now.</p>
                      </div>
                    ) : (
                      <>
                        <div 
                          ref={sliderRef}
                          className="flex gap-3.5 sm:gap-6 overflow-x-auto pb-3 sm:pb-4 pt-1 snap-x snap-mandatory scroll-smooth scrollbar-none touch-pan-x"
                          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                        >
                          {liveMatches.map((m) => {
                            const currentInnings = m.currentInningsNum === 1 ? m.innings1 : (m.innings2 || m.innings1);

                            const isTeamABatting1 = m.innings1 && m.innings1.battingTeam && m.innings1.battingTeam.toLowerCase().trim() === (m.teamA || '').toLowerCase().trim();
                            const isTeamABatting2 = m.innings2 && m.innings2.battingTeam && m.innings2.battingTeam.toLowerCase().trim() === (m.teamA || '').toLowerCase().trim();

                            let teamAScoreStr = '';
                            let teamAOversStr = '';

                            if (isTeamABatting1 && m.innings1) {
                              teamAScoreStr = `${m.innings1.runs}/${m.innings1.wickets}`;
                              teamAOversStr = `${formatOvers(m.innings1.ballsBowled)}`;
                            } else if (isTeamABatting2 && m.innings2) {
                              teamAScoreStr = `${m.innings2.runs}/${m.innings2.wickets}`;
                              teamAOversStr = `${formatOvers(m.innings2.ballsBowled)}`;
                            } else if (m.scoreA) {
                              teamAScoreStr = m.scoreA;
                              teamAOversStr = m.oversA || '';
                            }

                            const isTeamBBatting1 = m.innings1 && m.innings1.battingTeam && m.innings1.battingTeam.toLowerCase().trim() === (m.teamB || '').toLowerCase().trim();
                            const isTeamBBatting2 = m.innings2 && m.innings2.battingTeam && m.innings2.battingTeam.toLowerCase().trim() === (m.teamB || '').toLowerCase().trim();

                            let teamBScoreStr = '';
                            let teamBOversStr = '';

                            if (isTeamBBatting1 && m.innings1) {
                              teamBScoreStr = `${m.innings1.runs}/${m.innings1.wickets}`;
                              teamBOversStr = `${formatOvers(m.innings1.ballsBowled)}`;
                            } else if (isTeamBBatting2 && m.innings2) {
                              teamBScoreStr = `${m.innings2.runs}/${m.innings2.wickets}`;
                              teamBOversStr = `${formatOvers(m.innings2.ballsBowled)}`;
                            } else if (m.scoreB) {
                              teamBScoreStr = m.scoreB;
                              teamBOversStr = m.oversB || '';
                            }
                            
                            // Extract active players dynamically for high-fidelity live feel!
                            let activeStrikerName = '';
                            let activeBowlerName = '';
                            if (currentInnings) {
                              const activeBatsman = currentInnings.batsmen?.find((b, idx) => idx === currentInnings.strikerIndex);
                              if (activeBatsman) {
                                activeStrikerName = `${activeBatsman.name} (${activeBatsman.runs}* off ${activeBatsman.balls})`;
                              } else {
                                const aliveBatsmen = currentInnings.batsmen?.filter(b => !b.isOut) || [];
                                if (aliveBatsmen.length > 0) {
                                  activeStrikerName = `${aliveBatsmen[0].name} (${aliveBatsmen[0].runs}*)`;
                                }
                              }

                              const activeBowler = currentInnings.bowlers?.find((bw, idx) => idx === currentInnings.currentBowlerIndex) || currentInnings.bowlers?.find(bw => bw.isCurrent);
                              if (activeBowler) {
                                activeBowlerName = `${activeBowler.name} (${activeBowler.wickets}-${activeBowler.runsConceded})`;
                              } else if (currentInnings.bowlers && currentInnings.bowlers.length > 0) {
                                const lastBowler = currentInnings.bowlers[currentInnings.bowlers.length - 1];
                                activeBowlerName = `${lastBowler.name} (${lastBowler.wickets}-${lastBowler.runsConceded})`;
                              }
                            }

                            return (
                              <div 
                                key={m.id}
                                onClick={() => selectMatch(m.id)}
                                className="snap-start shrink-0 w-[calc(100vw-4.5rem)] max-w-[340px] sm:w-[370px] md:w-[390px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-emerald-500/35 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.55),0_0_20px_rgba(16,185,129,0.12)] hover:translate-y-[-3px] transition-all duration-300 cursor-pointer relative overflow-hidden text-white flex flex-col justify-between group"
                              >
                                {/* Interactive Background Glow Accent */}
                                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-300" />
                                <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-500/5 rounded-full blur-[50px] pointer-events-none transition-colors duration-300" />

                                {/* Top Accent bar */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                                <div>
                                  {/* Header section with pulsating radar */}
                                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block truncate max-w-[130px] sm:max-w-[200px]" title={m.tournamentName ? `${m.tournamentName} • ${m.date || 'Today'}` : (m.date || 'Today')}>
                                      {m.tournamentName ? `🏆 ${m.tournamentName}` : (m.date || 'Today')}
                                    </span>
                                    <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      <span className="relative flex h-1.5 w-1.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                      </span>
                                      LIVE
                                    </div>
                                  </div>

                                  {/* Match Banner (1280x720 16:9 ratio) */}
                                  {m.matchBannerUrl && (
                                    <div className="mb-3.5 rounded-xl sm:rounded-2xl overflow-hidden aspect-[16/9] w-full bg-slate-950 border border-slate-800 shadow-md relative group/banner">
                                      <img 
                                        src={m.matchBannerUrl} 
                                        alt={`${m.teamA} vs ${m.teamB} Banner`} 
                                        className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-500" 
                                        referrerPolicy="no-referrer" 
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                                      <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[8px] font-mono font-bold text-amber-300 border border-white/10 uppercase tracking-widest">
                                        1280 × 720
                                      </span>
                                    </div>
                                  )}

                                  {/* Team Battle Scoreboard Grid */}
                                  <div className="flex items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5 mt-1">
                                    {/* Team A Details */}
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
                                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs border border-indigo-400/20 shadow-md shadow-indigo-500/10 shrink-0">
                                        {(m.teamA || 'Team A').toUpperCase().substring(0, 2)}
                                      </div>
                                      <div className="min-w-0 leading-tight text-left">
                                        <span className="text-xs sm:text-sm font-black tracking-tight text-white block truncate">{m.teamA || 'Team A'}</span>
                                        <span className="text-[10px] sm:text-[11px] font-mono font-black text-amber-400 block truncate" title={teamAScoreStr ? `${m.teamA}: ${teamAScoreStr}` : "Yet to bat"}>
                                          {teamAScoreStr ? `${teamAScoreStr} ${teamAOversStr ? `(${teamAOversStr} ov)` : ''}` : 'Yet to Bat'}
                                        </span>
                                        <span className="text-[7.5px] sm:text-[8px] font-mono text-slate-500 font-extrabold uppercase block mt-0.5">Team A</span>
                                      </div>
                                    </div>

                                    {/* Versus Badge */}
                                    <span className="text-[8px] sm:text-[9px] font-mono font-black uppercase text-slate-400 border border-slate-850 bg-slate-950 px-1.5 sm:px-2 py-0.5 rounded-lg shrink-0">VS</span>

                                    {/* Team B Details */}
                                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 justify-end text-right">
                                      <div className="min-w-0 leading-tight text-right">
                                        <span className="text-xs sm:text-sm font-black tracking-tight text-white block truncate">{m.teamB || 'Team B'}</span>
                                        <span className="text-[10px] sm:text-[11px] font-mono font-black text-amber-400 block truncate justify-end" title={teamBScoreStr ? `${m.teamB}: ${teamBScoreStr}` : "Yet to bat"}>
                                          {teamBScoreStr ? `${teamBScoreStr} ${teamBOversStr ? `(${teamBOversStr} ov)` : ''}` : 'Yet to Bat'}
                                        </span>
                                        <span className="text-[7.5px] sm:text-[8px] font-mono text-slate-550 font-extrabold uppercase block mt-0.5">Team B</span>
                                      </div>
                                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs border border-amber-400/20 shadow-md shadow-amber-500/10 shrink-0">
                                        {(m.teamB || 'Team B').toUpperCase().substring(0, 2)}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Live Match Metadata Panel */}
                                  <div className="mb-3 sm:mb-4 grid grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] p-2.5 sm:p-3 rounded-xl sm:rounded-[1.25rem] bg-slate-950/60 border border-white/5 text-left leading-tight text-slate-400 font-sans">
                                    <div className="col-span-2 border-b border-white/[0.04] pb-1.5 mb-0.5 text-slate-300 flex items-center justify-between gap-1.5">
                                      <span className="text-[9px] sm:text-[10px] truncate" title={m.tossWinner ? `Toss: ${m.tossWinner} won & opted to ${m.tossChoice === 'bat' ? 'bat' : 'bowl'}` : 'Toss: Not tossed yet'}>
                                        🪙 <strong>Toss:</strong> {m.tossWinner ? `${m.tossWinner} won & ${m.tossChoice === 'bat' ? 'bat' : 'bowl'}` : 'Not tossed yet'}
                                      </span>
                                    </div>
                                    <div className="truncate">
                                      🏆 <strong>Tour:</strong> {m.tournamentName || 'Friendly Cup'}
                                    </div>
                                    <div className="truncate">
                                      🏏 <strong>Series:</strong> {m.seriesName || 'Bilateral Series'}
                                    </div>
                                    <div className="col-span-2 truncate">
                                      📍 <strong>Ground:</strong> {m.groundName || m.venue || m.ground || 'Gully Ground'}
                                    </div>
                                  </div>

                                  {/* Innings Active score panel */}
                                  {currentInnings && (
                                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-950/80 rounded-xl sm:rounded-2xl border border-white/5 space-y-2 sm:space-y-2.5 font-sans relative">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[8px] uppercase tracking-widest text-emerald-400 font-extrabold flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                          {m.currentInningsNum === 1 ? '1st Innings' : '2nd Innings'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-extrabold font-mono uppercase">
                                          {m.oversLimit} Overs limit
                                        </span>
                                      </div>

                                      <div className="flex justify-between items-center">
                                        <div className="leading-tight">
                                          <span className="text-xs font-bold text-slate-300 truncate tracking-wide inline-block max-w-[110px] sm:max-w-[130px]">{currentInnings.battingTeam}</span>
                                          <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Batting Now</span>
                                        </div>
                                        <div className="text-right leading-none">
                                          <span className="text-lg sm:text-xl font-mono font-black text-emerald-400">
                                            {currentInnings.runs}/{currentInnings.wickets}
                                          </span>
                                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium block mt-1 font-mono">
                                            {formatOvers(currentInnings.ballsBowled)} ovs
                                          </span>
                                        </div>
                                      </div>

                                      {/* Run Chase Equation in Match List Card */}
                                      {m.currentInningsNum === 2 && m.targetRuns && (
                                        <div className="mt-1.5 px-2.5 py-1 bg-black/40 border border-amber-400/30 rounded-lg text-[10px] font-bold text-amber-200 flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[7.5px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                            ⚡ Chase
                                          </span>
                                          {m.targetRuns - currentInnings.runs > 0 ? (
                                            <span className="font-mono text-white text-[10px]">
                                              Need <strong className="text-yellow-300 font-black">{m.targetRuns - currentInnings.runs}</strong> runs off <strong className="text-yellow-300 font-black">{Math.max(0, (m.oversLimit * 6) - currentInnings.ballsBowled)}</strong> balls
                                              {(() => {
                                                const bl = Math.max(0, (m.oversLimit * 6) - currentInnings.ballsBowled);
                                                const rg = m.targetRuns - currentInnings.runs;
                                                return bl > 0 ? ` (RRR: ${((rg / bl) * 6).toFixed(1)})` : '';
                                              })()}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-400 font-black uppercase text-[10px]">
                                              🎉 Target Achieved!
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Progress bar of overs & CRR indicator */}
                                      <div className="space-y-1 pt-1 border-t border-white/[0.04]">
                                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                                          <span>Overs Progress</span>
                                          <span>{calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)} CRR</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex border border-white/5">
                                          <div 
                                            className="bg-emerald-500 h-full transition-all duration-300" 
                                            style={{ width: `${Math.min(100, (((currentInnings.ballsBowled || 0) / ((m.oversLimit || 1) * 6)) * 100)) || 0}%` }} 
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Ongoing Striker / Bowler mini scoreboard row */}
                                  {(() => {
                                    if (!currentInnings) return null;
                                    const striker = currentInnings.batsmen?.[currentInnings.strikerIndex];
                                    const nonStriker = currentInnings.batsmen?.[currentInnings.nonStrikerIndex];
                                    const bowler = currentInnings.bowlers?.[currentInnings.currentBowlerIndex] || currentInnings.bowlers?.find(b => b.isCurrent);

                                    const hasBowled = Boolean(currentInnings.ballsBowled && currentInnings.ballsBowled > 0);
                                    const currentOverNo = hasBowled ? Math.floor((currentInnings.ballsBowled - 1) / 6) : 0;
                                    const currentOverBalls = hasBowled
                                      ? (() => {
                                          const raw = (currentInnings.commentaryList || [])
                                            .filter(c => {
                                              if (!c || !c.overBall || c.overBall === '0.0') return false;
                                              if (
                                                c.type === 'milestone' || 
                                                c.type === 'announcement' || 
                                                c.type === 'break' || 
                                                c.type === 'info' || 
                                                c.specialEvent === 'retire_hurt' ||
                                                c.announcementType === 'new_batsman' ||
                                                c.announcementType === 'new_bowler'
                                              ) return false;
                                              const desc = (c.description || '').toLowerCase();
                                              if (
                                                desc.includes('started') || 
                                                desc.includes('created') || 
                                                desc.includes('toss') || 
                                                desc.includes('declared') || 
                                                desc.includes('bulletin') || 
                                                desc.includes('match launched') ||
                                                desc.includes('draft match') ||
                                                desc.includes('retired hurt') ||
                                                desc.includes('new batsman on crease') ||
                                                desc.includes('bowler into the attack')
                                              ) return false;
                                              return isBallInOver(c.overBall, currentOverNo);
                                            });

                                          // Deduplicate so only one entry per overBall delivery is kept (prevents WWW duplicate pills)
                                          const deduped: any[] = [];
                                          const seenIds = new Set<string>();
                                          const seenWickets = new Set<string>();
                                          for (const b of raw) {
                                            if (b.id && seenIds.has(b.id)) continue;
                                            if (b.id) seenIds.add(b.id);
                                            if (b.type === 'wicket') {
                                              if (seenWickets.has(b.overBall)) continue;
                                              seenWickets.add(b.overBall);
                                            }
                                            deduped.push(b);
                                          }
                                          return deduped.slice(0, 12).reverse();
                                        })()
                                      : [];

                                    return (
                                      <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 bg-slate-950/90 rounded-xl sm:rounded-[1.5rem] border border-white/5 space-y-2.5 sm:space-y-3 font-sans">
                                        {/* Batsmen Pair section */}
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3 border-b border-white/[0.04] pb-2 sm:pb-2.5">
                                          <div>
                                            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Striker</span>
                                            {striker ? (
                                              <div className="flex items-center gap-1 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                                <span className="text-xs font-black text-white truncate max-w-[65px] min-[360px]:max-w-[85px] sm:max-w-[110px]" title={striker.name}>{striker.name}</span>
                                                <span className="text-xs font-mono font-black text-emerald-400 ml-auto whitespace-nowrap shrink-0">
                                                  {striker.runs}<span className="text-[10px] text-slate-400 font-normal">({striker.balls})</span>
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-slate-500 font-bold">-</span>
                                            )}
                                          </div>
                                          <div className="border-l border-white/[0.04] pl-2 sm:pl-3">
                                            <span className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block mb-0.5">Non-Striker</span>
                                            {nonStriker ? (
                                              <div className="flex items-center gap-1 min-w-0">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 shrink-0" />
                                                <span className="text-xs font-bold text-slate-350 truncate max-w-[65px] min-[360px]:max-w-[85px] sm:max-w-[110px]" title={nonStriker.name}>{nonStriker.name}</span>
                                                <span className="text-xs font-mono font-black text-white ml-auto whitespace-nowrap shrink-0 font-bold">
                                                  {nonStriker.runs}<span className="text-[10px] text-slate-455 font-normal">({nonStriker.balls})</span>
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-slate-500 font-bold">-</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Bowler & current over stats section */}
                                        <div className="flex flex-col gap-2 pt-0.5">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[9px] tracking-tighter uppercase shrink-0">
                                                BW
                                              </div>
                                              {bowler ? (
                                                <span className="text-xs font-black text-white truncate max-w-[80px] min-[360px]:max-w-[105px] sm:max-w-[140px]" title={bowler.name}>{bowler.name}</span>
                                              ) : (
                                                <span className="text-xs text-slate-500">-</span>
                                              )}
                                            </div>
                                            {bowler && (
                                              <span className="text-[10px] font-mono font-extrabold text-slate-400 shrink-0">
                                                {bowler.wickets}-{bowler.runsConceded} <span className="text-slate-550 text-[9px]">({calculateRunRate(bowler.runsConceded, bowler.ballsBowled)})</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Over stats ball by ball */}
                                        {currentOverBalls.length > 0 ? (
                                          <div className="flex items-center justify-between gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-white/[0.03]">
                                            <span className="text-[7.5px] text-slate-500 font-black uppercase tracking-wider shrink-0 font-mono">This Over:</span>
                                            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                                              {currentOverBalls.map((b, bIdx) => {
                                                const pill = getPillData(b);
                                                if (!pill.label || pill.color === 'hidden') return null;
                                                return (
                                                  <div 
                                                    key={b.id || bIdx}
                                                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[7.5px] font-mono font-black uppercase border shrink-0 select-none ${pill.color}`}
                                                    title={`${b.overBall}: ${b.description}`}
                                                  >
                                                    {pill.label}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="bg-slate-900/40 py-1 px-2 rounded-xl border border-white/[0.02] text-center text-[8px] font-mono text-slate-650 uppercase tracking-widest">
                                            Waiting for first ball delivery...
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Innings 2 Win / Target Equation */}
                                  {m.innings1 && m.currentInningsNum === 2 && (
                                    <div className="flex flex-col gap-1.25 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mt-3 font-sans">
                                      <div className="flex items-center justify-between text-[8px] font-black text-amber-400 uppercase tracking-wider leading-none">
                                        <span>Target Chase</span>
                                        <span className="font-mono text-white text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded font-black">{m.targetRuns} Runs</span>
                                      </div>
                                      <div className="text-[10px] font-semibold text-slate-300 leading-normal">
                                        Need <strong className="text-emerald-400 font-mono font-black">{(m.targetRuns || 0) - (m.innings2?.runs || 0)}</strong> runs off <strong className="text-emerald-400 font-mono font-black">{Math.max(0, (m.oversLimit * 6) - (m.innings2?.ballsBowled || 0))}</strong> balls.
                                      </div>
                                      <div className="text-[8px] font-mono text-slate-400 font-bold border-t border-white/[0.04] pt-1 mt-0.5 flex justify-between">
                                        <span>Required rate:</span>
                                        <strong className="text-amber-400">
                                          {((((m.targetRuns || 0) - (m.innings2?.runs || 0)) / Math.max(1, (m.oversLimit * 6) - (m.innings2?.ballsBowled || 0))) * 6).toFixed(2)} RRR
                                        </strong>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Footer Action of Card with arrow sliding effect */}
                                <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/[0.04] flex justify-between items-center text-[10px] font-semibold text-emerald-400 group-hover:text-emerald-350 transition-colors bg-transparent">
                                  <span className="flex items-center gap-1 font-black uppercase tracking-wider text-[8.5px] sm:text-[9px]">
                                    Spectate Live Arena <ArrowRight size={10} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                                  </span>
                                  
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportMatchPDF(m);
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none shadow-[0_2px_4px_rgba(16,185,129,0.2)]"
                                      title="Download Scoreboard PDF"
                                    >
                                      <Download size={9} />
                                      <span>Scoreboard</span>
                                    </button>
                                    
                                    {m.lastBallResult ? (
                                      <div className="flex items-center gap-1 font-mono">
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-black border ${
                                          m.lastBallResult === 'W' 
                                            ? 'bg-rose-500 border-rose-455 text-white shadow-sm shadow-rose-500/20' 
                                            : m.lastBallResult === '6' 
                                            ? 'bg-amber-505 border-amber-455 text-slate-950 font-black shadow-sm shadow-amber-500/20' 
                                            : m.lastBallResult === '4' 
                                            ? 'bg-emerald-505 border-emerald-455 text-white font-black shadow-sm shadow-emerald-500/20' 
                                            : 'bg-slate-800 border-slate-700 text-slate-300'
                                        }`}>
                                          {m.lastBallResult}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="font-mono text-[8px] text-slate-500 font-bold">ID: {m.id.substring(0, 6)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Mobile Swipe & Quick Switch Helper */}
                        {liveMatches.length > 1 && (
                          <div className="flex sm:hidden items-center justify-between pt-1 px-1 text-[10px] font-bold text-slate-400">
                            <button
                              type="button"
                              onClick={() => scrollSlider('left')}
                              className="flex items-center gap-1 text-emerald-400 font-black uppercase text-[9px] bg-slate-900/60 border border-white/10 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95"
                            >
                              <ChevronLeft size={12} /> Prev Match
                            </button>
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                              Swipe to explore ({liveMatches.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => scrollSlider('right')}
                              className="flex items-center gap-1 text-emerald-400 font-black uppercase text-[9px] bg-slate-900/60 border border-white/10 px-2.5 py-1.5 rounded-lg cursor-pointer active:scale-95"
                            >
                              Next Match <ChevronRight size={12} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Upcoming Matches Section */}
                {upcomingMatches.length > 0 && (
                  <div className="space-y-5 bg-gradient-to-tr from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-900/10 border border-slate-200/65 dark:border-slate-800/80 p-6 md:p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="text-blue-500" size={16} />
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Upcoming Matches ({upcomingMatches.length})
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {upcomingMatches.map((m) => (
                        <div 
                          key={m.id}
                          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden text-slate-850 dark:text-slate-100 flex flex-col justify-between hover:scale-[1.01] transition-all"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block truncate max-w-[150px]" title={m.tournamentName || m.date || 'Upcoming'}>
                              {m.tournamentName ? `🏆 ${m.tournamentName}` : (m.date || 'Upcoming')}
                            </span>
                            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <Clock size={10} />
                              UPCOMING
                            </span>
                          </div>

                          {m.matchBannerUrl && (
                            <div className="mb-3 rounded-xl overflow-hidden aspect-[16/9] w-full bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                              <img 
                                src={m.matchBannerUrl} 
                                alt={`${m.teamA} vs ${m.teamB} Banner`} 
                                className="w-full h-full object-cover" 
                                referrerPolicy="no-referrer" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                              <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/60 text-[8px] font-mono font-bold text-amber-300">
                                1280 × 720
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs shrink-0">
                                {(m.teamA || 'Team A').toUpperCase().substring(0, 2)}
                              </div>
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate block">{m.teamA}</span>
                            </div>
                            
                            <span className="text-[8px] font-mono font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded mr-1">VS</span>

                            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate block">{m.teamB}</span>
                              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                                {(m.teamB || 'Team B').toUpperCase().substring(0, 2)}
                              </div>
                            </div>
                          </div>

                          {/* Match Details info */}
                          <div className="text-[10px] space-y-1 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-left leading-tight text-slate-500 dark:text-slate-400">
                            {m.groundName || m.venue || m.ground ? (
                              <div>📍 <strong>Venue:</strong> {m.groundName || m.venue || m.ground}</div>
                            ) : null}
                            <div>📅 <strong>Date:</strong> {m.date || 'To be announced'}</div>
                            <div>🎯 <strong>Overs limit:</strong> {m.oversLimit || 10} overs</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed history matches */}
            <div className="space-y-4 pt-4 mt-8 border-t border-slate-200 dark:border-slate-800/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Trophy size={14} className="text-amber-500 animate-bounce" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Completed Records ({completedMatches.length})</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Results Filter Buttons */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-805 text-[9px] font-black uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setHistoryResultFilter('all')}
                      className={`px-2.5 py-1 rounded transition-all border-none cursor-pointer text-[8.5px] font-bold ${
                        historyResultFilter === 'all' ? 'bg-amber-600 text-white font-extrabold' : 'text-slate-400 bg-transparent hover:text-slate-200'
                      }`}
                    >
                      All Results
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryResultFilter('wins')}
                      className={`px-2.5 py-1 rounded transition-all border-none cursor-pointer text-[8.5px] font-bold ${
                        historyResultFilter === 'wins' ? 'bg-amber-600 text-white font-extrabold' : 'text-slate-400 bg-transparent hover:text-slate-200'
                      }`}
                    >
                      Wins
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryResultFilter('ties')}
                      className={`px-2.5 py-1 rounded transition-all border-none cursor-pointer text-[8.5px] font-bold ${
                        historyResultFilter === 'ties' ? 'bg-amber-600 text-white font-extrabold' : 'text-slate-400 bg-transparent hover:text-slate-200'
                      }`}
                    >
                      Ties
                    </button>
                  </div>

                  {completedMatches.length > 0 && (
                    <div className="relative w-full sm:w-56">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        <Search size={13} />
                      </span>
                      <input 
                        type="text"
                        value={completedSearchQuery}
                        onChange={(e) => setCompletedSearchQuery(e.target.value)}
                        placeholder="Search team name..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {completedMatches.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-400 dark:text-slate-600 font-medium w-full">
                  No completed matches recorded in the database history yet.
                </div>
              ) : filteredCompletedMatches.length === 0 ? (
                <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold leading-relaxed w-full">
                  No matching completed matches found for the given filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 w-full">
                  {filteredCompletedMatches.slice(0, 5).map((m) => (
                    <div 
                      key={m.id}
                      onClick={() => selectMatch(m.id)}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:scale-[1.01] transition-transform cursor-pointer relative overflow-hidden group text-slate-850 dark:text-slate-100"
                    >
                      <div className="absolute top-0 right-0 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest rounded-bl-xl flex items-center gap-1">
                        <Trophy size={8} />
                        RESULT
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                        {m.date || 'Past Match'}
                      </span>

                      {m.matchBannerUrl && (
                        <div className="mb-3.5 rounded-2xl overflow-hidden w-full bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md relative group/banner flex items-center justify-center min-h-[160px] sm:min-h-[200px]">
                          {/* Ambient backdrop glow so banner is fully visible without empty black voids */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-105 pointer-events-none"
                            style={{ backgroundImage: `url(${m.matchBannerUrl})` }}
                          />
                          {/* Uncropped, 100% visible match banner */}
                          <img 
                            src={m.matchBannerUrl} 
                            alt={`${m.teamA} vs ${m.teamB} Banner`} 
                            className="relative z-10 w-full h-auto max-h-[360px] object-contain rounded-xl transition-transform duration-300 group-hover/banner:scale-[1.01]" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" />
                          <span className="absolute bottom-2 left-2.5 z-20 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[8.5px] font-mono font-bold text-amber-300 border border-white/10 shadow-xs">
                            Match Banner (16:9)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-lg font-black tracking-tight mb-2 group-hover:text-amber-500 transition-colors">
                        <span>{m.teamA}</span>
                        <span className="text-slate-455 dark:text-slate-650 text-xs font-normal">vs</span>
                        <span>{m.teamB}</span>
                      </div>

                      {/* Main Match Scores breakdown if available */}
                      {((m.innings1 && m.innings1.runs !== undefined) || (m.mainMatchState && m.mainMatchState.innings1)) && (
                        <div className="flex flex-wrap items-center gap-2 mb-2.5 text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                          {(() => {
                            const inn1 = m.mainMatchState?.innings1 || m.innings1;
                            const inn2 = m.mainMatchState?.innings2 || m.innings2;
                            return (
                              <>
                                {inn1 && inn1.battingTeam && (
                                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    {inn1.battingTeam}: <strong className="text-slate-900 dark:text-white">{inn1.runs}/{inn1.wickets}</strong> ({Math.floor((inn1.ballsBowled || 0) / 6)}.{(inn1.ballsBowled || 0) % 6} ov)
                                  </span>
                                )}
                                {inn2 && inn2.battingTeam && (
                                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    {inn2.battingTeam}: <strong className="text-slate-900 dark:text-white">{inn2.runs}/{inn2.wickets}</strong> ({Math.floor((inn2.ballsBowled || 0) / 6)}.{(inn2.ballsBowled || 0) % 6} ov)
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Match Result & Tie / Super Over breakdown */}
                      {(() => {
                        const isTie = m.winner === 'Tie' || m.winReason?.toLowerCase().includes('tie') || m.isSuperOver || m.mainMatchState || (m.superOverNumber && m.superOverNumber > 0);
                        const isSuperOver = m.isSuperOver || m.mainMatchState || (m.superOverNumber && m.superOverNumber > 0) || m.winReason?.toLowerCase().includes('super over');

                        if (isTie) {
                          return (
                            <div className="mb-3 space-y-1.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                                <span>🤝 MATCH TIED!</span>
                                <span className="font-normal font-sans text-slate-500 dark:text-slate-400">
                                  (Scores Level{m.mainMatchState?.innings1 ? `: ${m.mainMatchState.innings1.runs} vs ${m.mainMatchState.innings2?.runs || m.mainMatchState.innings1.runs}` : ''})
                                </span>
                              </div>

                              {isSuperOver && (
                                <div className="p-2.5 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-transparent border border-amber-500/30 rounded-xl text-[10px] font-black text-amber-700 dark:text-amber-300 flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-[9px] uppercase tracking-wider flex items-center gap-1">
                                    <Zap size={10} className="fill-slate-950" /> Super Over Result
                                  </span>
                                  <span>
                                    {m.winner === 'Tie'
                                      ? 'Super Over also Ended in a Tie!'
                                      : `🏆 ${m.winner} won in Super Over!`}
                                  </span>
                                  {m.winReason && (
                                    <span className="text-slate-500 dark:text-slate-400 font-sans font-medium">
                                      ({m.winReason})
                                    </span>
                                  )}
                                  {m.mainMatchState && m.innings1 && m.innings2 && (
                                    <span className="font-mono text-[9px] text-slate-600 dark:text-slate-300 block w-full">
                                      SO Scores: {m.innings1.battingTeam} {m.innings1.runs}/{m.innings1.wickets} vs {m.innings2.battingTeam} {m.innings2.runs}/{m.innings2.wickets}
                                    </span>
                                  )}
                                </div>
                              )}

                              {!isSuperOver && m.winReason && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium font-sans">
                                  Resolution: {m.winReason}
                                </p>
                              )}
                            </div>
                          );
                        }

                        return (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black mb-3">
                            🏆 {`${m.winner} Match Winner`}
                            {m.winReason && <span className="text-slate-450 font-medium font-sans ml-1">({m.winReason})</span>}
                          </p>
                        );
                      })()}

                      {/* Man of the Match (Player of the Match) on the card */}
                      {(() => {
                        const potm = getMatchPotm(m);
                        if (!potm) return null;
                        return (
                          <div className="mb-3 px-3 py-2 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                                <Award size={14} className="text-slate-950 stroke-[2.5]" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[8.5px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block leading-tight">
                                  Man of the Match (POTM)
                                </span>
                                <strong className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block leading-tight">
                                  {potm.name}
                                </strong>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-mono font-black text-amber-600 dark:text-amber-400 block">
                                {potm.runs > 0 ? `${potm.runs} Runs` : ''}
                                {potm.runs > 0 && potm.wickets > 0 ? ' • ' : ''}
                                {potm.wickets > 0 ? `${potm.wickets} Wkts` : ''}
                              </span>
                              {potm.points && (
                                <span className="text-[8.5px] font-mono font-bold text-slate-400 dark:text-slate-500 block">
                                  {potm.points} Rating pts
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="pt-3 border-t border-slate-50 dark:border-slate-850 text-[10px] font-bold text-slate-400 flex justify-between items-center">
                        <span className="group-hover:text-amber-600 transition-colors">See Detailed scorecard & Commentary →</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportMatchPDF(m);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[8px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none shadow-sm"
                            title="Download Scoreboard PDF"
                          >
                            <Download size={9} />
                            <span>Download Scoreboard</span>
                          </button>
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-650">ID: {m.id.substring(0,8)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredCompletedMatches.length > 5 && (
                    <p className="text-center text-[10px] font-bold text-slate-400">
                      And {filteredCompletedMatches.length - 5} other past matches found in list.
                    </p>
                  )}
                </div>
              )}
            </div>
            </>
            ) : (
              /* ===================== TOURNAMENTS ARENA TAB VIEW ===================== */
              <div className="space-y-8 animate-fade-in">
                {!selectedTournament ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <Trophy size={20} className="text-amber-500 animate-bounce" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-350">Active Tournaments ({tournaments.length})</h3>
                    </div>

                    {tournaments.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 dark:text-slate-500 font-medium max-w-lg mx-auto shadow-sm">
                        <Trophy size={32} className="mx-auto mb-3 opacity-40 text-amber-500 animate-pulse" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No tournaments available at the moment</p>
                        <p className="text-xs text-slate-450 leading-relaxed">Stay tuned! Official cricket tournaments will appear here once they are started or scheduled by organizers.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTournament(t)}
                            className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 hover:border-amber-500/35 rounded-[2rem] p-6 shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.55),0_0_20px_rgba(245,158,11,0.12)] hover:translate-y-[-3px] transition-all duration-300 cursor-pointer relative overflow-hidden text-white group"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex justify-between items-start gap-2 mb-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {t.format} • {t.type}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                                t.status === 'completed'
                                  ? 'bg-emerald-555/10 text-emerald-400 border border-emerald-505/20'
                                  : 'bg-rose-500/10 text-rose-450 border border-rose-500/20 animate-pulse'
                              }`}>
                                {t.status === 'completed' ? 'Completed' : 'Active ⚡'}
                              </span>
                            </div>

                            <h4 className="text-lg font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">{t.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Start Date: {t.startDate}</p>

                            <div className="mt-6 pt-4 border-t border-slate-805 flex items-center justify-between text-xs font-semibold text-slate-305">
                              <span className="flex items-center gap-1 font-bold text-[10px] uppercase text-slate-400"><Users size={12} className="text-slate-550" /> {t.teams?.length || 0} Squads</span>
                              <span className="flex items-center gap-1 font-bold text-[10px] uppercase text-slate-400"><Activity size={12} className="text-slate-550" /> {t.matches?.length || 0} Fixtures</span>
                            </div>
                            
                            <div className="mt-4 text-[9px] font-bold text-amber-500 uppercase tracking-wider text-right flex items-center justify-end gap-1">
                              View Standings & Fixtures <ArrowRight size={10} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ===================== TOURNAMENT DETAILS INTERACTIVE VIEW ===================== */
                  <div className="space-y-8">
                    {/* Back header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-800 pb-4">
                      <button
                        onClick={() => setSelectedTournament(null)}
                        className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm active:scale-95"
                      >
                        ← Back to Tournaments
                      </button>
                      <div className="text-right">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{selectedTournament.name}</h3>
                        <span className="inline-block mt-1 text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 px-2.5 rounded-full border border-emerald-500/10 uppercase tracking-widest font-black font-sans shrink-0">
                          {selectedTournament.format} • {selectedTournament.type} Stage
                        </span>
                      </div>
                    </div>

                    {/* Standings/Leaderboard summary widget (Imported Style!) */}
                    <LiveStandingsSummaryWidget
                      standings={computePointsTable(selectedTournament.teams || [], selectedTournament.matches || []).sort((a,b) => b.points !== a.points ? b.points - a.points : b.NRR - a.NRR)}
                      tournamentName={selectedTournament.name}
                      isLeague={selectedTournament.type === 'league'}
                    />

                    {/* Fixtures schedule with live score tracking */}
                    <div className="space-y-4 pt-6">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-500 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Tournament Match Registry ({selectedTournament.matches?.length || 0})</h4>
                      </div>

                      {(!selectedTournament.matches || selectedTournament.matches.length === 0) ? (
                        <p className="text-xs text-slate-450 font-bold uppercase">No matches have been scheduled for this tournament yet.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {(selectedTournament.matches || []).map((m: any) => {
                            const isScheduled = m.status === 'scheduled';
                            const isLive = m.status === 'live';
                            const isCompleted = m.status === 'completed';

                            // Find team logos from selectedTournament object
                            const teamAObj = selectedTournament.teams?.find((t: any) => t.id === m.teamAId || t.name === m.teamAName);
                            const teamBObj = selectedTournament.teams?.find((t: any) => t.id === m.teamBId || t.name === m.teamBName);
                            const tALogo = teamAObj?.logo;
                            const tBLogo = teamBObj?.logo;

                            // Real-time score look-up inside active scoreboard matches
                            const activeLiveScoreMatch = isLive 
                              ? allMatches.find(am => am.status === 'live' && am.tournamentId === selectedTournament.id && am.tournamentMatchId === m.id)
                              : null;

                            return (
                              <div
                                key={m.id}
                                className={`bg-white dark:bg-slate-900 border rounded-[2rem] p-5 shadow-sm transition-all flex flex-col justify-between gap-4 hover:border-emerald-300 dark:hover:border-emerald-900 ${
                                  isLive ? 'border-amber-400 dark:border-amber-500/40 bg-amber-555/5 ring-1 ring-amber-400/20' : 'border-slate-100 dark:border-slate-800'
                                }`}
                              >
                                <div>
                                  {/* Battle Header */}
                                  <div className="flex justify-between items-center mb-3">
                                    <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      {m.stage || 'League'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      {isLive && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-500 text-white uppercase animate-pulse flex items-center gap-1 font-mono">
                                          <Radio size={9} className="animate-spin" /> LIVE
                                        </span>
                                      )}
                                      {isCompleted && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-500 uppercase border border-emerald-500/20">
                                          COMPLETED ✅
                                        </span>
                                      )}
                                      {isScheduled && (
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-105 dark:bg-slate-800 text-slate-500 uppercase">
                                          SCHEDULED
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-4 pt-1 mb-2">
                                    {/* Team A Lineup Row */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                          {tALogo ? (
                                            <img src={tALogo} alt={m.teamAName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase select-none">{m.teamAName[0] || 'A'}</span>
                                          )}
                                        </div>
                                        <span className="text-xs font-black uppercase text-slate-800 dark:text-white truncate">{m.teamAName}</span>
                                      </div>
                                      {isCompleted && (
                                        <span className="font-mono text-[11px] font-black text-slate-600 dark:text-slate-350">{m.scoreA || 'DNB'} ({m.oversA || '0'} ov)</span>
                                      )}
                                      {isLive && (
                                        <span className="font-mono text-[11px] font-black text-amber-500 animate-pulse">
                                          {activeLiveScoreMatch && activeLiveScoreMatch.innings1
                                            ? (activeLiveScoreMatch.currentInningsNum === 1 || !activeLiveScoreMatch.innings2
                                              ? `${activeLiveScoreMatch.innings1.runs}/${activeLiveScoreMatch.innings1.wickets} (${Math.floor(activeLiveScoreMatch.innings1.ballsBowled / 6)}.${activeLiveScoreMatch.innings1.ballsBowled % 6} ov)`
                                              : `${activeLiveScoreMatch.innings1.runs}/${activeLiveScoreMatch.innings1.wickets} (10 ov)`)
                                            : (m.scoreA || '0/0')
                                          }
                                        </span>
                                      )}
                                    </div>

                                    {/* Team B Lineup Row */}
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                          {tBLogo ? (
                                            <img src={tBLogo} alt={m.teamBName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                          ) : (
                                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase select-none">{m.teamBName[0] || 'B'}</span>
                                          )}
                                        </div>
                                        <span className="text-xs font-black uppercase text-slate-850 dark:text-white truncate">{m.teamBName}</span>
                                      </div>
                                      {isCompleted && (
                                        <span className="font-mono text-[11px] font-black text-slate-600 dark:text-slate-350">{m.scoreB || 'DNB'} ({m.oversB || '0'} ov)</span>
                                      )}
                                      {isLive && (
                                        <span className="font-mono text-[11px] font-black text-amber-500 animate-pulse">
                                          {activeLiveScoreMatch && activeLiveScoreMatch.innings2
                                            ? `${activeLiveScoreMatch.innings2.runs}/${activeLiveScoreMatch.innings2.wickets} (${Math.floor(activeLiveScoreMatch.innings2.ballsBowled / 6)}.${activeLiveScoreMatch.innings2.ballsBowled % 6} ov)`
                                            : (m.scoreB || 'yet to bat')
                                          }
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span>🗓️ {m.date || 'TBD'} | {m.time || 'TBD'}</span>
                                    <span>📍 {m.venue ? (m.venue.length > 15 ? `${m.venue.substring(0, 15)}...` : m.venue) : 'Ground'}</span>
                                  </div>

                                  {isCompleted && m.winReason && (
                                    <div className="mt-3 p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/10 text-[9px] font-black text-emerald-600 dark:text-emerald-400 text-center uppercase tracking-wider">
                                      🎉 {m.winReason}
                                    </div>
                                  )}
                                </div>

                                {/* Active scoring linkages actions */}
                                {isLive && activeLiveScoreMatch && (
                                  <button
                                    onClick={() => selectMatch(activeLiveScoreMatch.id)}
                                    className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl border-none font-black text-[10px] uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 animate-pulse"
                                  >
                                    <Radio size={12} className="animate-spin" /> Watch Live Scorecard
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ===================== ACTIVE SCOREBOARD DETAILED SPECTATOR CARD ===================== */
          <div className="space-y-8 animate-fade-in">
            
            {/* Back Button & Navigation Action */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectMatch('')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 text-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border-none shadow-sm active:scale-95 hover:scale-[1.02]"
                >
                  ← Change Match (Home Scoreboard)
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 text-slate-600 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm active:scale-95"
                >
                  🏠 Home
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const refreshed = getLocalMatchById(selectedMatch.id) || getActiveMatch() || getAnyActiveOrRecentMatch();
                    if (refreshed) setSelectedMatch(refreshed);
                    setLastRefreshed(new Date());
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[11px] font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
                  title="Reload match state"
                >
                  <RefreshCw size={13} />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Prominent Match Result Banner for Completed Matches */}
            {selectedMatch.status === 'completed' && (
              <>
                <ConfettiCelebration />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 text-white p-6 rounded-3xl shadow-md border border-amber-400/20 flex flex-col md:flex-row items-center justify-between gap-4"
                >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Trophy size={24} className="animate-bounce" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-100 block">
                      {(selectedMatch.winner === 'Tie' || selectedMatch.isSuperOver || selectedMatch.mainMatchState || (selectedMatch.superOverNumber && selectedMatch.superOverNumber > 0)) ? 'Match Tied • Official Result' : 'Match Completed • Official Result'}
                    </span>
                    <h4 className="text-xl font-black tracking-tight mt-0.5">
                      {(selectedMatch.winner === 'Tie' || selectedMatch.isSuperOver || selectedMatch.mainMatchState || (selectedMatch.superOverNumber && selectedMatch.superOverNumber > 0))
                        ? 'Scores Level — Match Ended in a Tie!' 
                        : `${selectedMatch.winner} ${selectedMatch.winReason || 'wins the match'}`}
                    </h4>
                    {(selectedMatch.isSuperOver || selectedMatch.mainMatchState || (selectedMatch.superOverNumber && selectedMatch.superOverNumber > 0) || selectedMatch.winReason?.toLowerCase().includes('super over')) && (
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-amber-300/40 text-xs font-black text-amber-200 shadow-sm">
                        <Zap size={13} className="text-amber-400 fill-amber-400 animate-pulse" />
                        <span>
                          Super Over Result: {selectedMatch.winner === 'Tie'
                            ? 'Super Over also Ended in a Tie!'
                            : `${selectedMatch.winner} won in Super Over! (${selectedMatch.winReason || 'Super Over Victory'})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {playerOfTheMatch && (
                  <div className="bg-white/10 px-5 py-2.5 rounded-2xl border border-white/10 text-center md:text-right">
                    <span className="text-[8px] uppercase tracking-widest font-black text-amber-100 block">⭐ Man of the Match (POTM)</span>
                    <p className="text-sm font-black tracking-tight">{playerOfTheMatch.name}</p>
                    <p className="text-[9px] font-mono text-amber-100 font-bold mt-0.5">
                      {playerOfTheMatch.runs > 0 ? `${playerOfTheMatch.runs} Runs` : ''} 
                      {playerOfTheMatch.runs > 0 && playerOfTheMatch.wickets > 0 ? ' • ' : ''}
                      {playerOfTheMatch.wickets > 0 ? `${playerOfTheMatch.wickets} Wkts` : ''}
                    </p>
                  </div>
                )}
              </motion.div>
              </>
            )}

            {/* Match Banner in Spectator Full Details Page - Fully Visible (No Cutting) with Download Option */}
            {selectedMatch.matchBannerUrl && (
              <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden relative shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col items-center justify-center group mb-6">
                {/* Ambient Blurred Backdrop - smooth full bleed without cropping foreground content */}
                <img
                  src={selectedMatch.matchBannerUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-35 scale-110 pointer-events-none select-none"
                />

                {/* Fully visible, uncropped Match Banner graphic */}
                <div className="relative z-10 w-full flex items-center justify-center p-1 sm:p-2">
                  <img
                    src={selectedMatch.matchBannerUrl}
                    alt={`${selectedMatch.teamA} vs ${selectedMatch.teamB} Match Banner`}
                    className="w-full h-auto max-h-[580px] object-contain rounded-xl sm:rounded-2xl block mx-auto transition-transform duration-300 shadow-md"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Top Overlay Badges and Small Download Button */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[9px] font-mono font-black text-amber-300 border border-white/10 uppercase tracking-widest hidden sm:inline-flex shadow-sm">
                    1280 × 720 HD
                  </span>
                  {selectedMatch.status === 'live' && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      LIVE
                    </span>
                  )}
                  {/* Small Download Button for viewers */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadBanner(selectedMatch.matchBannerUrl!, selectedMatch.teamA, selectedMatch.teamB);
                    }}
                    id="btn-download-spectator-banner"
                    className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white font-bold text-[10px] tracking-wider uppercase border border-white/25 hover:border-amber-400/80 shadow-lg flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md active:scale-95"
                    title="Download full match banner image"
                  >
                    {downloadingBanner ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download size={12} className="text-amber-300" />
                    )}
                    <span>{downloadingBanner ? 'Saving...' : 'Download Banner'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Top Match Bar Header */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap pb-1">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                    selectedMatch.status === 'live' ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {selectedMatch.status === 'live' ? '● LIVE RECORDINGS' : '🏆 COMPLETED'}
                  </span>
                  <span className="text-slate-405 dark:text-slate-500 font-mono text-[10px] font-bold">Match ID: {selectedMatch.id}</span>
                  
                  <span className="text-slate-200 dark:text-slate-800 text-[10px] select-none">|</span>
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                    connectionStatus === 'online'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-505/10'
                      : connectionStatus === 'reconnecting'
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-505/10 animate-pulse'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-450 border-rose-505/10'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${
                      connectionStatus === 'online' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'reconnecting' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                    }`} />
                    <span>{connectionStatus === 'online' ? 'Streaming' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px] font-bold">
                    Sync: {lastRefreshed.toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white truncate">
                  {selectedMatch.teamA} vs {selectedMatch.teamB}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Overs Limit: {selectedMatch.oversLimit} Overs • Toss: {selectedMatch.tossWinner} ({selectedMatch.tossChoice === 'bat' ? 'Batted' : 'Fielded' } first)
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap w-full md:w-auto">
                <button
                  onClick={() => {
                    setLastRefreshed(new Date());
                    const localMatch = getLocalMatchById(selectedMatch.id);
                    if (localMatch) {
                      setSelectedMatch(localMatch);
                    }
                  }}
                  className="px-3 py-2 sm:px-3 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm min-h-[38px]"
                  title="Force refresh score"
                >
                  <RefreshCw size={13} />
                  <span className="truncate">Refresh</span>
                </button>
                {selectedMatch.matchBannerUrl && (
                  <button
                    type="button"
                    onClick={() => handleDownloadBanner(selectedMatch.matchBannerUrl!, selectedMatch.teamA, selectedMatch.teamB)}
                    id="btn-download-banner-action-bar"
                    className="flex-1 sm:flex-initial px-3 py-2 sm:px-3.5 sm:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm min-h-[38px]"
                    title="Download full match banner image"
                  >
                    <Download size={13} className="text-amber-500" />
                    <span className="truncate">Download Banner</span>
                  </button>
                )}
                <button
                  onClick={() => handleExportMatchPDF(selectedMatch)}
                  className="flex-1 sm:flex-initial px-3 py-2 sm:px-3.5 sm:py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm min-h-[38px]"
                  title="Download Scoreboard PDF"
                >
                  <Download size={13} />
                  <span className="truncate">Download Scoreboard</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial px-3 py-2 sm:px-3.5 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm min-h-[38px]"
                >
                  <Share2 size={13} />
                  <span className="truncate">{copiedNotification ? 'Copied!' : 'Share Link'}</span>
                </button>
              </div>
            </div>

            {/* Core Big Scoreboard Card */}
            {currentInnings && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                  {/* Score Section */}
                  <motion.div 
                    key={`spectator-score-card-${currentInnings.runs}-${currentInnings.wickets}-${currentInnings.ballsBowled}`}
                    initial={{ opacity: 0, y: 15, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="lg:col-span-2 bg-slate-900 border border-slate-950 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] p-4 min-[400px]:p-6 md:p-8 text-white flex flex-col justify-between shadow-lg relative overflow-hidden min-h-[22rem] pb-6"
                  >
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500" />
                    
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Current Batting Team</span>
                        <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 truncate">
                          {currentInnings.battingTeam} <span className="text-xs text-slate-400 normal-case font-medium">Innings {selectedMatch.currentInningsNum}</span>
                        </h4>

                        {/* Run Chase Equation - Identical to scoreboard management page innings card */}
                        {selectedMatch.currentInningsNum === 2 && selectedMatch.targetRuns && (
                          <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 bg-black/40 border border-amber-400/40 rounded-xl text-xs font-bold text-amber-200 shadow-sm backdrop-blur-xs">
                            <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                              ⚡ Run Chase Equation
                            </span>
                            {selectedMatch.targetRuns - currentInnings.runs > 0 ? (
                              <span className="font-mono text-white text-xs sm:text-sm">
                                Need <strong className="text-yellow-300 font-black text-sm sm:text-base font-mono">{selectedMatch.targetRuns - currentInnings.runs}</strong> runs to win off <strong className="text-yellow-300 font-black text-sm sm:text-base font-mono">{Math.max(0, (selectedMatch.oversLimit * 6) - currentInnings.ballsBowled)}</strong> balls
                                {(() => {
                                  const ballsLeft = Math.max(0, (selectedMatch.oversLimit * 6) - currentInnings.ballsBowled);
                                  const runsToGet = selectedMatch.targetRuns - currentInnings.runs;
                                  if (ballsLeft <= 0) return ' (Req: ∞)';
                                  return ` (RRR: ${((runsToGet / ballsLeft) * 6).toFixed(2)})`;
                                })()}
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-black uppercase tracking-wider animate-pulse">
                                🎉 Target Achieved!
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedMatch.lastBallResult && (
                        <div className="bg-white/10 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/10 text-center shrink-0">
                          <span className="text-[8px] uppercase font-black tracking-widest text-slate-400 block mb-0.5">Last Delivery</span>
                          <strong className="text-sm font-mono text-emerald-400">{selectedMatch.lastBallResult}</strong>
                        </div>
                      )}
                    </div>

                    {/* Big figures */}
                    <div className="my-4 sm:my-5 flex flex-wrap items-baseline gap-3 min-[400px]:gap-4 md:gap-6">
                      <motion.span 
                        key={`spectator-runs-wickets-${currentInnings.runs}-${currentInnings.wickets}`}
                        initial={{ scale: 0.9, opacity: 0.6 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 450, damping: 14 }}
                        className="text-5xl min-[380px]:text-6xl sm:text-7xl md:text-8xl font-black text-white font-mono tracking-tighter leading-none inline-block origin-left break-all"
                      >
                        {currentInnings.runs}-{currentInnings.wickets}
                      </motion.span>
                      <div className="flex flex-col">
                        <span className="text-base sm:text-xl md:text-2xl font-black font-mono text-emerald-400">
                          {formatOvers(currentInnings.ballsBowled)} overs
                        </span>
                        <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 mt-0.5 sm:mt-1">
                          Overs Bowled
                        </span>
                      </div>
                    </div>

                    {/* On-Crease Active Matchup Panel */}
                    <div className="my-4 sm:my-5 p-3.5 sm:p-5 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3.5 sm:space-y-4 font-sans backdrop-blur-sm">
                      {/* Batsmen Pair */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2.5 border-b border-white/[0.04]">
                        {/* Striker */}
                        <div className="bg-emerald-500/10 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            {striker ? (
                              <span className="text-xs font-black text-white truncate" title={striker.name}>
                                {striker.name}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500">No striker</span>
                            )}
                          </div>
                          {striker && (
                            <span className="text-xs font-mono font-black text-emerald-400 shrink-0">
                              {striker.runs}<span className="text-[10px] text-slate-400 font-normal">({striker.balls}b)</span>
                            </span>
                          )}
                        </div>

                        {/* Non-Striker */}
                        <div className="bg-white/5 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-white/[0.08] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                            {nonStriker ? (
                              <span className="text-xs font-bold text-slate-300 truncate" title={nonStriker.name}>
                                {nonStriker.name}
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-500">No non-striker</span>
                            )}
                          </div>
                          {nonStriker && (
                            <span className="text-xs font-mono font-black text-slate-300 shrink-0 font-bold">
                              {nonStriker.runs}<span className="text-[10px] text-slate-455 font-normal">({nonStriker.balls}b)</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bowler Details and This Over Balls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        {/* Current Bowler */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-6.5 h-6.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-400 flex items-center justify-center font-extrabold text-[10px] shrink-0">
                            BW
                          </div>
                          <div className="min-w-0 leading-tight">
                            {bowler ? (
                              <>
                                <span className="text-xs font-black text-white truncate block" title={bowler.name}>
                                  {bowler.name}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tight mt-0.5 block">
                                  {bowler.wickets}-{bowler.runsConceded} ({formatOvers(bowler.ballsBowled)} overs)
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-500 font-medium font-bold">No active bowler</span>
                            )}
                          </div>
                        </div>

                        {/* This Over detailed list */}
                        <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-2 rounded-xl border border-white/[0.04] max-w-full overflow-hidden shrink-0">
                          <span className="text-[8.5px] text-emerald-400 font-black uppercase tracking-widest shrink-0 font-mono">This Over:</span>
                          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                            {currentOverBalls && currentOverBalls.length > 0 ? (
                              currentOverBalls.map((b: any, bIdx: number) => {
                                const pill = getPillData(b);
                                if (!pill.label || pill.color === 'hidden') return null;
                                return (
                                  <div 
                                    key={b.id || bIdx}
                                    className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-mono font-black uppercase border shrink-0 select-none ${pill.color}`}
                                    title={`${b.overBall}: ${b.description}`}
                                  >
                                    {pill.label}
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest font-mono">0 deliveries</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Stats Panel */}
                    {(() => {
                      // Partnership
                      const lastFow = currentInnings.fallOfWickets && currentInnings.fallOfWickets.length > 0 
                        ? currentInnings.fallOfWickets[currentInnings.fallOfWickets.length - 1].score 
                        : 0;
                      const partnershipRuns = Math.max(0, currentInnings.runs - lastFow);
                      const b1Balls = striker ? striker.balls || 0 : 0;
                      const b2Balls = nonStriker ? nonStriker.balls || 0 : 0;
                      const partnershipBalls = b1Balls + b2Balls;

                      // Last Wkt
                      const lastWktObj = currentInnings.fallOfWickets && currentInnings.fallOfWickets.length > 0
                        ? currentInnings.fallOfWickets[currentInnings.fallOfWickets.length - 1]
                        : null;

                      // Last 2 overs (12 legal deliveries)
                      const history = currentInnings.history || [];
                      const currentBalls = currentInnings.ballsBowled;
                      const targetBalls = Math.max(0, currentBalls - 12);
                      let historicalState = history[0];
                      for (let i = history.length - 1; i >= 0; i--) {
                        const ballsAtPoint = Math.round(history[i].over * 6);
                        if (ballsAtPoint <= targetBalls) {
                          historicalState = history[i];
                          break;
                        }
                      }
                      const lastTwoOversRuns = Math.max(0, currentInnings.runs - (historicalState?.cumulativeRuns || 0));
                      const lastTwoOversWkts = Math.max(0, currentInnings.wickets - (historicalState?.cumulativeWickets || 0));

                      const tossInfo = selectedMatch.tossWinner 
                        ? `${selectedMatch.tossWinner} won & opted to ${selectedMatch.tossChoice === 'bat' ? 'bat' : 'bowl'}`
                        : 'No toss details';

                      return (
                        <div className="my-5 p-4 bg-slate-950/40 border border-white/[0.03] rounded-2xl space-y-3 font-sans">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">📊 KEY INNINGS STATS</span>
                          <div className="grid grid-cols-2 gap-3 text-xs leading-none">
                            <div className="p-3 bg-slate-900 rounded-xl border border-white/[0.02]">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">1. Active Partnership</span>
                              <strong className="text-[13px] font-mono font-black text-amber-400">{partnershipRuns}</strong>
                              <span className="text-[10px] text-slate-400 ml-1">runs ({partnershipBalls} b)</span>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-xl border border-white/[0.02] truncate">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">2. Last Wicket</span>
                              {lastWktObj ? (
                                <div className="truncate" title={`${lastWktObj.batsmanName} dismissed at ${lastWktObj.score}/${lastWktObj.wicketNo}`}>
                                  <strong className="text-[11px] font-bold text-white block truncate">{lastWktObj.batsmanName}</strong>
                                  <span className="text-[10px] font-mono text-rose-400">{lastWktObj.score}/{lastWktObj.wicketNo} ({lastWktObj.oversList} ov)</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 font-mono">None fallen yet</span>
                              )}
                            </div>
                            <div className="p-3 bg-slate-900 rounded-xl border border-white/[0.02]">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">3. Last 2 Overs</span>
                              <strong className="text-[13px] font-mono font-black text-emerald-400">{lastTwoOversRuns}</strong>
                              <span className="text-[10px] text-slate-400 ml-1">r, </span>
                              <strong className="text-[13px] font-mono font-black text-rose-400">{lastTwoOversWkts}</strong>
                              <span className="text-[10px] text-slate-400 ml-1">w</span>
                            </div>
                            <div className="p-3 bg-slate-900 rounded-xl border border-white/[0.02] truncate">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">4. Toss Decision</span>
                              <span className="text-[10px] font-bold text-indigo-400 truncate block" title={tossInfo}>{tossInfo}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Run Rates Footer summary */}
                    <div className="flex justify-between items-center border-t border-slate-800/80 pt-4 text-xs font-bold text-slate-350">
                      <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Run Rate (CRR)</span>
                        <strong className="font-mono text-sm text-emerald-300">{calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}</strong>
                      </div>

                      {selectedMatch.currentInningsNum === 1 && (
                        <div className="border-l border-slate-800 pl-6 text-right animate-pulse">
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-0.5">Projected Score</span>
                          <strong className="font-mono text-amber-400 text-sm">
                            {currentInnings.ballsBowled > 0 
                              ? Math.round((currentInnings.runs / (currentInnings.ballsBowled / 6)) * selectedMatch.oversLimit) 
                              : '--'}{' '}
                            runs
                          </strong>
                        </div>
                      )}

                      {selectedMatch.currentInningsNum === 2 && selectedMatch.targetRuns && (
                        <>
                          <div className="border-l border-slate-800 pl-4 text-center">
                            <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">Req. Run Rate (RRR)</span>
                            <strong className="font-mono text-amber-300 text-sm">
                              {(() => {
                                const runsNeeded = Math.max(0, (selectedMatch.targetRuns || 0) - currentInnings.runs);
                                const ballsRemaining = Math.max(0, (selectedMatch.oversLimit * 6) - currentInnings.ballsBowled);
                                return ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : (runsNeeded > 0 ? '∞' : '0.00');
                              })()}
                            </strong>
                          </div>
                          <div className="border-l border-slate-800 pl-4 text-right">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Target score</span>
                            <strong className="font-mono text-yellow-300 text-base">{selectedMatch.targetRuns} runs</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                        {/* Live Ball-by-Ball Commentary Feed (Prominent placement!) */}
                <motion.div 
                  key={`spectator-comm-card-${currentInnings.runs}-${currentInnings.wickets}-${currentInnings.ballsBowled}`}
                  initial={{ opacity: 0, y: 15, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-md flex flex-col justify-between"
                >
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800/80 mb-4 gap-2 flex-wrap">
                      <div>
                        <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest block mb-0.5 animate-pulse">🔴 Live Commentary</span>
                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100 font-sans">Ball-by-Ball Feed</h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Compact language switcher for user */}
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                          {(['mr', 'hi', 'en'] as const).map(langId => (
                            <button
                              key={langId}
                              type="button"
                              onClick={() => setSpectatorCommentaryLang(langId)}
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-all border-none cursor-pointer ${
                                spectatorCommentaryLang === langId
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
                              }`}
                              title={langId === 'mr' ? 'मराठी कॉमेंट्री' : langId === 'hi' ? 'हिंदी कमेंट्री' : 'English Commentary'}
                            >
                              {langId === 'mr' ? '🚩 मराठी' : langId === 'hi' ? '🇮🇳 हिंदी' : '🌐 EN'}
                            </button>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 px-2.5 py-0.5 rounded border border-slate-200/50 hidden sm:inline-block">REAL-TIME</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 max-h-[17.5rem] overflow-y-auto pr-1 scrollbar-thin flex-1">
                      {(() => {
                        const commentary = currentInnings.commentaryList || [];
                        if (commentary.length === 0) {
                          return (
                            <p className="text-center text-xs text-slate-400 py-10 italic">Waiting for the match to record ball commentary...</p>
                          );
                        }
                        return commentary.slice(0, 15).map((comm) => {
                          const isWkt = comm.type === 'wicket';
                          const isBnd = comm.type === 'boundary';
                          const isExt = comm.type === 'extra';
                          const isMls = comm.type === 'milestone';
                          const displayText = getCommentaryText(comm, spectatorCommentaryLang);

                          return (
                            <div 
                              key={comm.id}
                              className={`p-2.5 rounded-xl text-[11px] border transition-all duration-150 ${
                                isWkt ? 'bg-rose-500/10 border-rose-500/15 text-rose-600 dark:text-rose-400' :
                                isBnd ? 'bg-amber-500/10 border-amber-500/15 text-amber-600 dark:text-amber-400 font-bold' :
                                isMls ? 'bg-purple-500/10 border-purple-500/15 text-purple-600 dark:text-purple-400' :
                                isExt ? 'bg-sky-550 bg-sky-500/10 border-sky-400/15 text-sky-600 dark:text-sky-450' :
                                'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-650 dark:text-slate-350'
                              }`}
                            >
                              <div className="flex justify-between items-baseline mb-0.5 font-bold">
                                <span className="font-mono text-[9px] text-slate-500">Delivery {comm.overBall}</span>
                                {comm.type !== 'normal' && (
                                  <span className="text-[7.5px] uppercase tracking-widest px-1 py-0.5 rounded bg-black/5 dark:bg-white/5 font-black">
                                    {comm.type === 'boundary' 
                                      ? (((comm.description || '').toLowerCase().includes('six') || (comm.description || '').toLowerCase().includes('6 runs') || (comm.description || '').toLowerCase().includes(' 6 ')) ? '🚀 SIX' : '⚡ FOUR')
                                      : comm.type}
                                  </span>
                                )}
                              </div>
                              <p className="leading-relaxed font-semibold">{displayText}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[10px] font-black text-slate-450 dark:text-slate-640 uppercase tracking-widest">
                    <span>Read-Only Viewer Feed</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </motion.div>
              </div>
            </>
            )}

                     {/* Selector Nav Tabs for Details Card */}
              <div id="details-nav-tabs" className="space-y-6">
                
                {/* Visual tabs selectors */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-900 rounded-2xl w-full overflow-x-auto scrollbar-none md:flex-wrap">
                  {[
                    { id: 'arena', label: '🏟️ Live Arena' },
                    { id: 'scorecard', label: '📊 Full Scorecard' },
                    { id: 'overs', label: '⚾ Overs Analysis' },
                    { id: 'highlights', label: '✨ Highlights & Comm' },
                    { id: 'standing', label: '🏆 Squads & Standings' },
                    { id: 'media', label: '📺 News & Media' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`shrink-0 md:flex-1 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-none cursor-pointer ${
                        activeTab === tab.id 
                          ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-white shadow-sm font-extrabold' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ===================== TAB 1: LIVE ARENA ===================== */}
                {activeTab === 'arena' && (
                  <div className="space-y-6">

                    {/* Active On-Crease Batsmen details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Crease Batsmen Spotlight */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50 dark:border-slate-800">
                          <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                            <Flame size={14} className="animate-pulse" /> Active Batsmen on Crease
                          </h4>
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                            LIVE ATTACK
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          {[currentInnings.strikerIndex, currentInnings.nonStrikerIndex].map((idx, index) => {
                            const bat = currentInnings.batsmen[idx];
                            if (!bat) return (
                              <div key={index} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                                Batsman position {index === 0 ? "Striker" : "Non-Striker"} not set
                              </div>
                            );
                            const isStriker = index === 0;
                            const sr = bat.balls > 0 ? ((bat.runs / bat.balls) * 100).toFixed(1) : '0.0';
                            
                            return (
                              <div 
                                key={bat.name}
                                className={`p-4 rounded-2xl flex justify-between items-center transition-all ${
                                  isStriker 
                                    ? 'bg-gradient-to-r from-emerald-500/10 to-transparent dark:from-emerald-500/15 border border-emerald-500/20 shadow-sm' 
                                    : 'bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800'
                                }`}
                              >
                                <div>
                                  <span className="flex items-center gap-2 font-black text-sm text-slate-850 dark:text-white">
                                    {bat.name}
                                    {isStriker && (
                                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[8px] tracking-widest font-black uppercase anime-pulse">
                                        STRIKER
                                      </span>
                                    )}
                                  </span>
                                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-405 dark:text-slate-400 font-medium">
                                    <span>Fours: <strong className="text-slate-700 dark:text-slate-200">{bat.fours}</strong></span>
                                    <span>Sixes: <strong className="text-slate-700 dark:text-slate-200">{bat.sixes}</strong></span>
                                    <span>SR: <strong className="text-slate-700 dark:text-slate-200">{sr}</strong></span>
                                  </div>
                                </div>
                                <div className="text-right font-mono">
                                  <div className="text-2xl font-black text-slate-850 dark:text-white leading-none">
                                    {bat.runs}
                                    <span className="text-xs text-slate-400 ml-1 font-normal">({bat.balls}b)</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 block mt-1 uppercase">Boundaries: {(bat.fours * 4) + (bat.sixes * 6)} Runs</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bowler match up detailed feed */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50 dark:border-slate-800">
                          <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-widest flex items-center gap-1.5">
                            <Activity size={14} className="text-emerald-500 animate-spin-slow" /> Active Bowling Attack
                          </h4>
                          <span className="text-[9px] font-mono text-slate-450 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                            SPELL OVERVIEW
                          </span>
                        </div>

                        {!activeBowlerData ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">
                            No defensive bowler under active assignment.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850/80 flex justify-between items-center">
                              <div>
                                <strong className="text-base text-slate-800 dark:text-white block">
                                  {activeBowlerData.bw.name}
                                </strong>
                                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mt-1 block">
                                  Current Bowler
                                </span>
                              </div>
                              <div className="text-right font-mono">
                                <div className="text-xl font-black text-rose-500">
                                  {activeBowlerData.bw.wickets} Wkts
                                  <span className="text-xs text-slate-400 ml-1.5 font-bold">({activeBowlerData.bw.runsConceded} Runs)</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">
                                  Overs: {formatOvers(activeBowlerData.bw.ballsBowled)} • Econ: {activeBowlerData.econ}
                                </span>
                              </div>
                            </div>

                            {/* Secondary Bowling Details */}
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-wide">
                              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span className="block text-slate-400 text-[8px] mb-0.5">Maidens</span>
                                <span className="text-slate-800 dark:text-slate-200 font-mono text-sm font-extrabold">{activeBowlerData.bw.maidens || 0}</span>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span className="block text-slate-400 text-[8px] mb-0.5">Est. Dot Balls</span>
                                <span className="text-slate-800 dark:text-slate-200 font-mono text-sm font-extrabold">{activeBowlerData.dotsCount}</span>
                              </div>
                              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span className="block text-slate-400 text-[8px] mb-0.5">Dots Ratio</span>
                                <span className="text-emerald-500 dark:text-emerald-400 font-mono text-sm font-black">{activeBowlerData.dotsPercentage}%</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Partnership, Run Index & Equations Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Live Partnership Card */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-3">Live Active Partnership</span>
                          {(() => {
                            const fows = currentInnings.fallOfWickets || [];
                            const lastFow = fows.length > 0 
                              ? fows[fows.length - 1].score 
                              : 0;
                            const runs = Math.max(0, currentInnings.runs - lastFow);
                            
                            const b1Balls = currentInnings.batsmen?.[currentInnings.strikerIndex]?.balls || 0;
                            const b2Balls = currentInnings.batsmen?.[currentInnings.nonStrikerIndex]?.balls || 0;
                            const balls = b1Balls + b2Balls;
                            const rate = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';
                            
                            return (
                              <div className="space-y-3">
                                <div className="flex items-baseline gap-1 font-mono">
                                  <span className="text-3xl font-black text-slate-800 dark:text-white">{runs}</span>
                                  <span className="text-xs text-slate-400">runs</span>
                                  <span className="text-lg font-bold text-slate-450 dark:text-slate-500 ml-1">off {balls} balls</span>
                                </div>
                                <p className="text-[10px] text-slate-505 dark:text-slate-400 font-bold leading-normal">
                                  Standard Partnership Run-Rate stands at <span className="text-emerald-500">{rate} runs/over</span>, stabilizing the middle batting order.
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 text-[9px] font-black text-emerald-500 tracking-wide uppercase mt-4">
                          Current Wicket Stand: #{(currentInnings.fallOfWickets?.length || 0) + 1}
                        </div>
                      </div>

                      {/* Run Index Performance */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-3">Innings Run Index</span>
                          {(() => {
                            // Compute boundary percentage of total runs
                            let boundaryRuns = 0;
                            currentInnings.batsmen.forEach(b => {
                              boundaryRuns += (b.fours * 4) + (b.sixes * 6);
                            });
                            const boundaryRatio = currentInnings.runs > 0 
                              ? Math.min(100, Math.round((boundaryRuns / currentInnings.runs) * 100)) 
                              : 0;
                            const strikeRateAvg = currentInnings.ballsBowled > 0 
                              ? ((currentInnings.runs / currentInnings.ballsBowled) * 100).toFixed(0) 
                              : '0';

                            return (
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                    <span>Boundary Percentage runs</span>
                                    <span>{boundaryRatio}%</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${boundaryRatio}%` }} />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                                    <span>Aggregated Strike Index</span>
                                    <span>{strikeRateAvg} SR</span>
                                  </div>
                                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden">
                                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, parseInt(strikeRateAvg) / 2)}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 text-[9px] font-semibold text-slate-405 dark:text-slate-500 tracking-wider font-mono">
                          Aggregates boundary totals & rotation ratings
                        </div>
                      </div>

                      {/* Chase target match deliveries math countdown */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-3">Target Match Deliveries</span>
                          {selectedMatch.currentInningsNum === 2 && selectedMatch.targetRuns ? (
                            (() => {
                              const totalChaseBalls = selectedMatch.oversLimit * 6;
                              const ballsRemaining = Math.max(0, totalChaseBalls - currentInnings.ballsBowled);
                              const runsRequired = Math.max(0, selectedMatch.targetRuns - currentInnings.runs);
                              const rrr = ballsRemaining > 0 ? ((runsRequired / ballsRemaining) * 6).toFixed(2) : '0.00';
                              const rawProgress = totalChaseBalls > 0 ? ((totalChaseBalls - ballsRemaining) / totalChaseBalls) * 100 : 0;

                              return (
                                <div className="space-y-3.5">
                                  <div className="flex justify-between items-baseline font-mono">
                                    <div className="text-slate-800 dark:text-white">
                                      <span className="text-3xl font-black">{runsRequired}</span> runs need
                                    </div>
                                    <div className="text-slate-450 text-xs">
                                      off <span className="text-amber-500 text-base font-black">{ballsRemaining}</span> balls left
                                    </div>
                                  </div>

                                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden shadow-inner">
                                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all" style={{ width: `${rawProgress}%` }} />
                                  </div>

                                  <div className="flex justify-between text-[10px] font-black text-rose-500 uppercase tracking-widest pt-1.5">
                                    <span>Req Run Rate (RRR)</span>
                                    <span>{rrr} R/ov</span>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="space-y-2 text-slate-605">
                              <span className="text-sm font-black text-slate-800 dark:text-white block">Establishing 1st Innings Target</span>
                              <p className="text-[10px] font-bold text-slate-400 leading-normal">
                                {currentInnings.battingTeam} is currently setting up the match target benchmark. {selectedMatch.oversLimit * 6} legal deliveries stand in target phase.
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 text-[9px] font-black text-amber-500 tracking-wider uppercase mt-4">
                          Chase Equation Tracker
                        </div>
                      </div>

                    </div>

                    {/* Match Equation Status widget (Repositioned here!) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-50 dark:border-slate-800/80 mb-4">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block mb-0.5 animate-pulse">📊 Equation Status</span>
                          <h4 className="text-base font-black text-slate-800 dark:text-slate-100">Match Equation Status</h4>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 px-2.5 py-0.5 rounded border border-slate-200/50">CALCULATED</span>
                      </div>

                      {selectedMatch.status === 'completed' ? (
                        <div className="space-y-4">
                          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                            <Trophy className="text-amber-500 mx-auto animate-bounce mb-2" size={28} />
                            <h5 className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">Match Concluded</h5>
                            <p className="text-xs font-bold mt-1 text-slate-700 dark:text-slate-300">
                              {selectedMatch.winner === 'Tie' ? 'Match Tied!' : `${selectedMatch.winner} ${selectedMatch.winReason}`}
                            </p>
                          </div>

                          {playerOfTheMatch && (
                            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-4 text-center text-white border-0 shadow">
                              <span className="text-[8px] uppercase tracking-widest font-black text-amber-100 block mb-1">⭐ MVP PLAYER OF MATCH ⭐</span>
                              <strong className="text-base font-black tracking-tight">{playerOfTheMatch.name}</strong>
                              <p className="text-[10px] font-mono mt-0.5 text-amber-100 font-bold">
                                {playerOfTheMatch.runs > 0 && `${playerOfTheMatch.runs} Runs `}
                                {playerOfTheMatch.runs > 0 && playerOfTheMatch.wickets > 0 && '• '}
                                {playerOfTheMatch.wickets > 0 && `${playerOfTheMatch.wickets} Wickets (${playerOfTheMatch.runsConceded} Runs)`}
                              </p>
                            </div>
                          )}

                          <button
                            onClick={() => handleExportMatchPDF(selectedMatch)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[11px] rounded-2xl transition-all cursor-pointer border-none shadow-md active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                          >
                            <Download size={14} className="text-emerald-200" /> Export Match Report PDF
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedMatch.currentInningsNum === 1 ? (
                            <div className="bg-emerald-500/10 dark:bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10">
                              <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1">Defense Target Setup</span>
                              <p className="text-xs text-slate-655 dark:text-slate-350 font-bold leading-relaxed">
                                {currentInnings.battingTeam} sets the target. Overs boundary limit stands at <span className="text-emerald-500 font-mono font-black">{selectedMatch.oversLimit}</span>.
                              </p>
                            </div>
                          ) : selectedMatch.targetRuns ? (
                            <div className="bg-amber-500/10 dark:bg-amber-500/5 rounded-2xl p-4 border border-amber-500/10">
                              <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block mb-1">The Run Chase Equation</span>
                              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-250 animate-pulse">
                                {currentInnings.battingTeam} needs <span className="text-amber-500 font-mono text-base">{Math.max(0, selectedMatch.targetRuns - currentInnings.runs)}</span> runs 
                                from <span className="text-emerald-500 font-mono text-base">{(selectedMatch.oversLimit * 6) - currentInnings.ballsBowled}</span> deliveries.
                              </p>
                              
                              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-400 uppercase">Required Run Rate (RRR):</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                                  {(() => {
                                    const ballsLeft = (selectedMatch.oversLimit * 6) - currentInnings.ballsBowled;
                                    const runsToGet = selectedMatch.targetRuns - currentInnings.runs;
                                    if (ballsLeft <= 0) return '∞';
                                    return ((runsToGet / ballsLeft) * 6).toFixed(2);
                                  })()}
                                </span>
                              </div>
                            </div>
                          ) : null}

                          <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl text-[10px] font-bold text-slate-400 space-y-2">
                            <div className="flex justify-between">
                              <span>Innings 1 Bowled:</span>
                              <span className="font-mono text-slate-650 dark:text-slate-200">
                                {selectedMatch.innings1 ? `${selectedMatch.innings1.runs}/${selectedMatch.innings1.wickets} in ${formatOvers(selectedMatch.innings1.ballsBowled)} ov` : 'N/A'}
                              </span>
                            </div>
                            {selectedMatch.innings2 && (
                              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800/80">
                                <span>Innings 2 Bowled:</span>
                                <span className="font-mono text-slate-650 dark:text-slate-200">
                                  {selectedMatch.innings2.runs}/{selectedMatch.innings2.wickets} in {formatOvers(selectedMatch.innings2.ballsBowled)} ov
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Live Key Highlights container */}
                          {matchPerformanceHighlights && (
                            <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl space-y-2 text-xs font-bold animate-pulse">
                              <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest block flex items-center gap-1.5 mb-1">
                                <Sparkles size={11} className="text-emerald-500 animate-pulse" /> Match Live Highlights
                              </span>
                              <div className="flex justify-between items-center text-slate-600 dark:text-slate-350">
                                <span className="font-medium">Top Batsman:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                  {matchPerformanceHighlights.bestBatter.runs > 0 
                                    ? `${matchPerformanceHighlights.bestBatter.name} (${matchPerformanceHighlights.bestBatter.runs} off ${matchPerformanceHighlights.bestBatter.balls}b)` 
                                    : 'N/A'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-slate-600 dark:text-slate-350 pt-1 border-t border-slate-100 dark:border-slate-850/80">
                                <span className="font-medium">Top Bowler:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                  {matchPerformanceHighlights.bestBowler.wickets > 0 || matchPerformanceHighlights.bestBowler.runs > 0
                                    ? `${matchPerformanceHighlights.bestBowler.name} (${matchPerformanceHighlights.bestBowler.wickets} Wkts / ${matchPerformanceHighlights.bestBowler.runs} Runs)` 
                                    : 'N/A'
                                  }
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* ===================== TAB 2: FULL SCORECARD ===================== */}
                {activeTab === 'scorecard' && (
                  <div className="space-y-6">
                    {/* Innings Toggle Buttons */}
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl w-full sm:w-max border border-slate-205/65 dark:border-slate-850">
                      <button
                        onClick={() => setSelectedScorecardInnings(1)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                          selectedScorecardInnings === 1 
                            ? 'bg-white dark:bg-slate-850 text-slate-850 dark:text-white shadow-sm' 
                            : 'text-slate-400 font-bold bg-transparent hover:text-slate-600'
                        }`}
                      >
                        1st Innings - {selectedMatch.innings1?.battingTeam || 'Team 1'}
                      </button>
                      {selectedMatch.innings2 && (
                        <button
                          onClick={() => setSelectedScorecardInnings(2)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                            selectedScorecardInnings === 2 
                              ? 'bg-white dark:bg-slate-850 text-slate-850 dark:text-white shadow-sm' 
                              : 'text-slate-400 font-bold bg-transparent hover:text-slate-600'
                          }`}
                        >
                          2nd Innings - {selectedMatch.innings2.battingTeam}
                        </button>
                      )}
                    </div>

                    {((selectedScorecardInnings === 1 ? selectedMatch.innings1 : selectedMatch.innings2)) ? (
                      (() => {
                        const inn = selectedScorecardInnings === 1 ? selectedMatch.innings1! : selectedMatch.innings2!;
                        return (
                          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm space-y-8">
                            <div>
                              <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block mb-1">Detailed Innings Records</span>
                              <h4 className="text-xl font-black text-slate-850 dark:text-white">
                                {inn.battingTeam} Batting Scorecard
                              </h4>
                              <p className="text-[10px] text-slate-450 uppercase tracking-widest font-mono mt-0.5">
                                Total runs scored: {inn.runs}/{inn.wickets} in {formatOvers(inn.ballsBowled)} Overs bowled
                              </p>
                            </div>

                            {/* Batting score summary table */}
                            <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                              <table className="w-full text-left text-xs text-slate-650 dark:text-slate-305 font-medium min-w-[600px]">
                                <thead className="bg-slate-50 dark:bg-slate-950 font-sans">
                                  <tr className="text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-4">Batsman / Player</th>
                                    <th className="p-4">Status / Dismissal Mode</th>
                                    <th className="p-4 text-center">Runs</th>
                                    <th className="p-4 text-center">Balls</th>
                                    <th className="p-4 text-center">4s</th>
                                    <th className="p-4 text-center">6s</th>
                                    <th className="p-4 text-center">Strike Rate (SR)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                  {(inn.batsmen || []).map((b, idx) => {
                                    const batSR = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                                    return (
                                      <tr key={`${b.name}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                        <td className="p-4 font-black text-slate-850 dark:text-white flex items-center gap-1.5">
                                          {b.name}
                                          {!b.isOut && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" title="At Crease" />}
                                        </td>
                                        <td className="p-4 text-slate-400 font-sans">
                                          {b.isOut ? (
                                            <span className="text-rose-500 font-semibold bg-rose-500/5 px-2 py-0.5 rounded text-[10px]">
                                              Out ({b.outMode}{b.dismissedBy ? ` - ${b.dismissedBy}` : ''})
                                            </span>
                                          ) : (
                                            <span className="text-emerald-500 font-bold bg-emerald-500/5 px-2 py-0.5 rounded text-[10px]">
                                              Not Out (Active)
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-4 text-center font-mono font-black text-slate-850 dark:text-white text-sm">{b.runs}</td>
                                        <td className="p-4 text-center font-mono text-slate-500">{b.balls}</td>
                                        <td className="p-4 text-center font-mono text-slate-500">{b.fours}</td>
                                        <td className="p-4 text-center font-mono text-slate-500">{b.sixes}</td>
                                        <td className="p-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{batSR}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="border-t border-slate-150 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                                  {/* Extras row */}
                                  <tr className="bg-slate-50/40 dark:bg-slate-950/20 text-xs font-bold leading-none">
                                    <td className="p-4 font-black text-slate-500 uppercase tracking-wider">Total Extras</td>
                                    <td colSpan={6} className="p-4 text-right pr-4 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                                      Total Ext: <strong className="text-amber-500">{(inn.extras?.wides || 0) + (inn.extras?.noBalls || 0) + (inn.extras?.byes || 0) + (inn.extras?.legByes || 0)}</strong> (Wd {inn.extras?.wides || 0}, Nb {inn.extras?.noBalls || 0}, B {inn.extras?.byes || 0}, Lb {inn.extras?.legByes || 0})
                                    </td>
                                  </tr>
                                  {/* Penalties row */}
                                  {inn.extras?.penalty > 0 && (
                                    <tr className="bg-slate-50/40 dark:bg-slate-950/20 text-xs font-bold leading-none">
                                      <td className="p-4 font-black text-slate-500 uppercase tracking-wider">Penalty Runs</td>
                                      <td colSpan={6} className="p-4 text-right pr-4 text-rose-500 font-mono text-[10px]">
                                        +{inn.extras?.penalty || 0} Runs
                                      </td>
                                    </tr>
                                  )}
                                  {/* Grand Total row */}
                                  <tr className="bg-emerald-50/20 dark:bg-emerald-950/20 border-t border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-extrabold text-[12px] leading-none">
                                    <td className="p-4 font-black tracking-wide uppercase">GRAND TOTAL</td>
                                    <td colSpan={6} className="p-4 text-right pr-4 font-mono tracking-tight font-black text-sm">
                                      <span className="text-slate-850 dark:text-white text-base font-black font-sans">{inn.runs}</span>/{inn.wickets} in {formatOvers(inn.ballsBowled)} Overs
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Innings Bowling Analysis */}
                            <div>
                              <h4 className="text-sm font-black text-slate-850 dark:text-white mb-3">
                                {inn.bowlingTeam} Bowling Spell Card
                              </h4>
                              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-left text-xs text-slate-650 dark:text-slate-305 font-medium min-w-[600px]">
                                  <thead className="bg-slate-50 dark:bg-slate-950 font-sans">
                                    <tr className="text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                      <th className="p-4">Bowling Member</th>
                                      <th className="p-4 text-center">Overs</th>
                                      <th className="p-4 text-center">Maidens</th>
                                      <th className="p-4 text-center">Runs Conceded</th>
                                      <th className="p-4 text-center">Wickets</th>
                                      <th className="p-4 text-center">Economy Rate (Econ)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                    {(inn.bowlers || []).map((bw, idx) => {
                                      const econRate = calculateRunRate(bw.runsConceded, bw.ballsBowled);
                                      return (
                                        <tr key={`${bw.name}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                                          <td className="p-4 font-black text-slate-850 dark:text-white">{bw.name}</td>
                                          <td className="p-4 text-center font-mono text-slate-500">{formatOvers(bw.ballsBowled)}</td>
                                          <td className="p-4 text-center font-mono text-slate-500">{bw.maidens}</td>
                                          <td className="p-4 text-center font-mono text-slate-500 text-sm">{bw.runsConceded}</td>
                                          <td className="p-4 text-center font-mono font-black text-rose-500 text-sm">{bw.wickets}</td>
                                          <td className="p-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{econRate}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Extra Breakdown Row */}
                            {(() => {
                              const ext = inn.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
                              const extTotal = (ext.wides || 0) + (ext.noBalls || 0) + (ext.byes || 0) + (ext.legByes || 0) + (ext.penalty || 0);
                              return (
                                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Info className="text-sky-500" size={14} />
                                    <span className="font-extrabold text-slate-850 dark:text-white">Extras Breakdown:</span>
                                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-black px-2.5 py-0.5 rounded text-[10px] font-mono">
                                      Total {extTotal}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono font-bold text-[10px] text-slate-500">
                                    <span>Wides (Wd): {ext.wides || 0}</span>
                                    <span>No-balls (Nb): {ext.noBalls || 0}</span>
                                    <span>Byes (By): {ext.byes || 0}</span>
                                    <span>Leg-byes (Lb): {ext.legByes || 0}</span>
                                    {(ext.penalty || 0) > 0 && <span className="text-amber-500 font-extrabold animate-pulse">Penalty: {ext.penalty || 0}</span>}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Fall of Wickets Timeline Sequential view */}
                            <div>
                              <div className="flex items-center gap-1.5 mb-3">
                                <Activity className="text-rose-500" size={14} />
                                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                                  Fall of Wickets sequence timeline
                                </span>
                              </div>
                              {(!inn.fallOfWickets || inn.fallOfWickets.length === 0) ? (
                                <p className="text-xs text-slate-400 dark:text-slate-605 italic">No wickets have fallen in this innings yet.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {(inn.fallOfWickets || []).map((fw) => (
                                    <div 
                                      key={fw.wicketNo}
                                      className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl text-[11px] font-bold text-slate-705 dark:text-slate-350 shadow-sm flex flex-col justify-between"
                                    >
                                      <div>
                                        <span className="text-rose-500 font-extrabold font-mono text-[9px] block uppercase tracking-wider mb-0.5">Wicket #{fw.wicketNo}</span>
                                        <strong className="text-slate-905 dark:text-white text-sm">{fw.score} Runs</strong>
                                      </div>
                                      <p className="text-[10px] text-slate-450 font-medium mt-1">
                                        {fw.batsmanName} dismissed at ({fw.oversList} overs)
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Interactive Pitch Map Section */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff014f] animate-ping shrink-0" />
                                <div>
                                  <h5 className="text-sm font-black text-[#ff014f] dark:text-rose-450 uppercase tracking-wide flex items-center gap-1.5">
                                    🏏 Interactive Pitch map
                                  </h5>
                                  <p className="text-[10px] text-slate-400 font-medium font-sans">Visual trajectory plotting of the last 6 legal deliveries on the pitch surface</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* The Pitch Diagram Container */}
                                <div className="md:col-span-1 flex justify-center">
                                  <div className="w-[180px] h-[360px] bg-[#dfcca7] dark:bg-[#cdaf82] border-2 border-[#bfa47d] relative rounded-lg shadow-lg flex flex-col items-center">
                                    {/* Grass outline around pitch */}
                                    <div className="absolute inset-0 border border-white/25 pointer-events-none" />
                                    
                                    {/* Lines */}
                                    {/* Bowling Crease (Bottom, 90%) */}
                                    <div className="absolute w-full h-[1.5px] bg-white/80 top-[90%]" />
                                    {/* Batting Crease (Popping Crease, Top, 15%) */}
                                    <div className="absolute w-full h-[1.5px] bg-white/80 top-[15%]" />
                                    
                                    {/* Wickets/Stumps */}
                                    {/* Batting Stumps */}
                                    <div className="absolute top-[13.5%] left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-[10px] pointer-events-none">
                                      <div className="w-[1.5px] h-[8px] bg-[#1a1a1a]" />
                                      <div className="w-[1.5px] h-[8px] bg-[#1a1a1a]" />
                                      <div className="w-[1.5px] h-[8px] bg-[#1a1a1a]" />
                                    </div>
                                    {/* Bowling Stumps */}
                                    <div className="absolute top-[90.5%] left-1/2 -translate-x-1/2 flex items-start gap-[3px] h-[10px] pointer-events-none">
                                      <div className="w-[1.5px] h-[8px] bg-[#1a1a1a]" />
                                      <div className="w-[1.5px] h-[8px] bg-[#1a1a1a]" />
                                      <div className="w-[1.5px] h-[8px] bg-[#1a1a1a]" />
                                    </div>

                                    {/* Outer wide lines (X boundaries) */}
                                    <div className="absolute left-[15%] top-[15%] bottom-[10%] w-[1px] bg-white/30 border-dashed" />
                                    <div className="absolute right-[15%] top-[15%] bottom-[10%] w-[1px] bg-white/30 border-dashed" />

                                    {/* Pitch length division banners */}
                                    <div className="absolute top-[18%] left-0 right-0 text-center text-[7px] text-white/35 font-bold pointer-events-none select-none uppercase tracking-widest font-mono">YORKER ZONE</div>
                                    <div className="absolute top-[32%] left-0 right-0 text-center text-[7px] text-white/35 font-bold pointer-events-none select-none uppercase tracking-widest font-mono">FULL LENGTH</div>
                                    <div className="absolute top-[48%] left-0 right-0 text-center text-[7px] text-white/35 font-bold pointer-events-none select-none uppercase tracking-widest font-mono">GOOD LENGTH</div>
                                    <div className="absolute top-[64%] left-0 right-0 text-center text-[7px] text-white/35 font-bold pointer-events-none select-none uppercase tracking-widest font-mono">SHORT OF LENGTH</div>
                                    <div className="absolute top-[78%] left-0 right-0 text-center text-[7px] text-white/35 font-bold pointer-events-none select-none uppercase tracking-widest font-mono">BOUNCER / SHORT</div>

                                    {/* Plots of last 6 deliveries */}
                                    {(() => {
                                      const ballDeliveries = (inn.commentaryList || [])
                                        .filter((c: any) => c.overBall && /^\d+\.\d+$/.test(c.overBall))
                                        .slice(0, 6)
                                        .reverse();

                                      return ballDeliveries.map((b, idx) => {
                                        const coords = getPitchCoords(b.id, b.overBall, b.description, b.type);
                                        const pill = getPillData(b);
                                        return (
                                          <motion.div
                                            key={b.id || idx}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', delay: idx * 0.08 }}
                                            className={`absolute w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black -translate-x-1/2 -translate-y-1/2 shadow-md cursor-help border border-white/50 ${coords.color}`}
                                            style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                                            title={`Delivery ${b.overBall}: ${b.description}`}
                                          >
                                            {pill.label}
                                          </motion.div>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>

                                {/* Pitch Map Legend & Ball-by-ball specs */}
                                <div className="md:col-span-2 space-y-4">
                                  {/* Legend Grid */}
                                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                                    <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">Zone Length Legend</h6>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-amber-500 border border-white/10 shrink-0" />
                                        <span className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">Yorker / Full Toss</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-sky-500 border border-white/10 shrink-0" />
                                        <span className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">Full Length</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/10 shrink-0" />
                                        <span className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">Good Length</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-indigo-500 border border-white/10 shrink-0" />
                                        <span className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">Short of Length</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-rose-500 border border-white/10 shrink-0" />
                                        <span className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">Short Ball / Bouncer</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-slate-400 border border-white/10 shrink-0" />
                                        <span className="text-[10.5px] font-bold text-slate-650 dark:text-slate-350">Wide Delivery</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* List of last 6 deliveries */}
                                  <div className="space-y-2">
                                    <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Historical Plot Specs (Last 6 Deliveries)</h6>
                                    {(() => {
                                      const ballDeliveries = (inn.commentaryList || [])
                                        .filter((c: any) => c.overBall && /^\d+\.\d+$/.test(c.overBall))
                                        .slice(0, 6);

                                      if (ballDeliveries.length === 0) {
                                        return <p className="text-xs text-slate-450 italic mr-1">Waiting for ball deliveries to construct visual path...</p>;
                                      }

                                      return (
                                        <div className="space-y-1.5 max-h-[175px] overflow-y-auto scrollbar-thin">
                                          {ballDeliveries.map((b, idx) => {
                                            const coords = getPitchCoords(b.id, b.overBall, b.description, b.type);
                                            const pill = getPillData(b);
                                            return (
                                              <div 
                                                key={b.id || idx}
                                                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl gap-3 transition-all hover:bg-slate-100 dark:hover:bg-slate-900 animate-fade-in"
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black uppercase border shrink-0 ${pill.color}`}>
                                                    {pill.label}
                                                  </span>
                                                  <div className="leading-tight truncate">
                                                    <span className="text-xs font-black text-slate-800 dark:text-white block">
                                                      Over {b.overBall} • <span className="text-slate-400 font-bold uppercase tracking-wide text-[8px]">{coords.lengthType}</span>
                                                    </span>
                                                    <p className="text-[10px] text-slate-500 font-medium truncate" title={b.description}>{b.description}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-850 rounded-3xl text-slate-400">
                        Innings data pending or not started yet.
                      </div>
                    )}
                  </div>
                )}

                {/* ===================== TAB 3: OVERS ANALYSIS ===================== */}
                {activeTab === 'overs' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Overs summary list - parsing commentary */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-800 mb-6">
                        <div>
                          <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block mb-0.5">Over-by-Over log statistics</span>
                          <h4 className="text-base font-black text-slate-850 dark:text-white">Overs Progression Details</h4>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">Total {formatOvers(currentInnings.ballsBowled)} overs</span>
                      </div>

                      {(() => {
                        // Calculate over by over summaries
                        const oversMap: { [key: number]: { overIndex: number; runs: number; wickets: number; extras: number; ballPills: any[]; bowlerName: string } } = {};
                        
                        // We slice.reverse to process chronological order if needed, but since we are mapping, direct analysis is fine
                        currentInnings.commentaryList.forEach((comm) => {
                          const parts = comm.overBall.split('.');
                          if (parts.length < 2) return;
                          const ovNum = parseInt(parts[0]);
                          if (isNaN(ovNum)) return;
                          
                          if (!oversMap[ovNum]) {
                            oversMap[ovNum] = { overIndex: ovNum, runs: 0, wickets: 0, extras: 0, ballPills: [], bowlerName: '' };
                          }
                          
                          let runs = 0;
                          const desc = (comm.description || '').toLowerCase();
                          if (desc.includes('six') || desc.includes('6 runs') || desc.includes(' 6 ')) runs = 6;
                          else if (desc.includes('four') || desc.includes('4 runs') || desc.includes(' 4 ')) runs = 4;
                          else if (desc.includes('3 runs') || desc.includes('three')) runs = 3;
                          else if (desc.includes('2 runs') || desc.includes('two')) runs = 2;
                          else if (desc.includes('1 run') || desc.includes('single')) runs = 1;
                          
                          oversMap[ovNum].runs += runs;
                          if (comm.type === 'wicket') oversMap[ovNum].wickets += 1;
                          if (comm.type === 'extra') {
                            oversMap[ovNum].extras += 1;
                            // Adding extra run inside over calculation if applicable
                            if (desc.includes('wide') || desc.includes('no ball')) {
                              oversMap[ovNum].runs += 1;
                            }
                          }
                          
                          // Bowler extraction from description "BowlerName to BatsmanName..."
                          if (!oversMap[ovNum].bowlerName) {
                            const toIdx = desc.indexOf(' to ');
                            if (toIdx > 0) {
                              oversMap[ovNum].bowlerName = comm.description.substring(0, toIdx).trim();
                            }
                          }
                          
                          oversMap[ovNum].ballPills.push(comm);
                        });

                        const finalOversList = Object.values(oversMap).sort((a, b) => b.overIndex - a.overIndex);

                        if (finalOversList.length === 0) {
                          return (
                            <p className="text-center text-xs text-slate-400 italic py-8">No completed overs logged yet in current innings.</p>
                          );
                        }

                        return (
                          <div className="space-y-4 max-h-[24rem] overflow-y-auto pr-1 scrollbar-thin">
                            {finalOversList.map((ov) => (
                              <div 
                                key={ov.overIndex} 
                                className="p-4 bg-slate-50 dark:bg-slate-950/65 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-slate-800 dark:text-emerald-400 font-mono text-xs font-black flex items-center justify-center shrink-0">
                                      {ov.overIndex + 1}
                                    </span>
                                    <div>
                                      <strong className="text-slate-850 dark:text-slate-100 text-sm">Over {ov.overIndex + 1} Summary</strong>
                                      {ov.bowlerName && <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bowled by {ov.bowlerName}</span>}
                                    </div>
                                  </div>
                                </div>

                                {/* Balls indicators */}
                                <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                                  {ov.ballPills.slice().reverse().map((b) => {
                                    const pill = getPillData(b);
                                    return (
                                      <span 
                                        key={b.id} 
                                        className={`w-6 h-6 rounded-full border border-transparent flex items-center justify-center text-[10px] select-none shrink-0 ${pill.color}`}
                                        title={b.description}
                                      >
                                        {pill.label}
                                      </span>
                                    );
                                  })}
                                </div>

                                <div className="text-right font-mono text-xs font-bold">
                                  <span className="text-slate-850 dark:text-slate-200 block">
                                    Runs: <strong className="text-sm font-black text-emerald-500">{ov.runs}</strong>
                                  </span>
                                  <span className="text-[10px] text-rose-500 font-extrabold uppercase">
                                    Wickets: {ov.wickets} • Extras: {ov.extras}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Progress graphs display worm */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-50 dark:border-slate-800">
                        <div>
                          <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block mb-1">Match charts and metrics</span>
                          <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                            <BarChart3 className="text-emerald-500" size={16} />
                            {chartMetric === 'runrate' ? 'Run-Rate Progression Graph' : chartMetric === 'winprob' ? 'Win Probability Analysis Trajectory' : 'Progress Worm Graph (Innings 1 vs Innings 2)'}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                          <div className="flex bg-slate-150 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-205 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => setChartMetric('runs')}
                              className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                                chartMetric === 'runs' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                              }`}
                            >
                              Cumulative Runs
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartMetric('runrate')}
                              className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                                chartMetric === 'runrate' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                              }`}
                            >
                              Run-Rate
                            </button>
                            <button
                              type="button"
                              onClick={() => setChartMetric('winprob')}
                              className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                                chartMetric === 'winprob' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                              }`}
                            >
                              Win Probability
                            </button>
                          </div>
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                              {selectedMatch.innings1?.battingTeam || 'Innings 1'}
                            </span>
                            {selectedMatch.innings2 && (
                              <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                                {selectedMatch.innings2.battingTeam}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="h-64 sm:h-80 w-full font-mono text-[10px] text-slate-455">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={(() => {
                              const map1 = selectedMatch.innings1?.history || [];
                              const map2 = selectedMatch.innings2?.history || [];
                              const maxOvers = selectedMatch.oversLimit;
                              const plotData = [];
                              const totalBalls = maxOvers * 6;
                              
                              if (chartMetric === 'runrate') {
                                for (let i = 1; i <= totalBalls; i++) {
                                  const pt1 = map1.filter(p => Math.round(p.over * 6) <= i).pop();
                                  const pt2 = map2.filter(p => Math.round(p.over * 6) <= i).pop();
                                  
                                  if (pt1 || pt2) {
                                    const item: any = {
                                      overNum: Math.floor(i / 6) + (i % 6) / 10,
                                      overNumLabel: `${Math.floor(i / 6)}.${i % 6}`
                                    };
                                    
                                    if (pt1 && pt1.over > 0) {
                                      item[selectedMatch.innings1?.battingTeam || 'Innings 1'] = parseFloat(((pt1.cumulativeRuns * 6) / Math.round(pt1.over * 6)).toFixed(2));
                                    }
                                    
                                    if (pt2 && pt2.over > 0) {
                                      item[selectedMatch.innings2?.battingTeam || 'Innings 2'] = parseFloat(((pt2.cumulativeRuns * 6) / Math.round(pt2.over * 6)).toFixed(2));
                                    }
                                    
                                    if (item[selectedMatch.innings1?.battingTeam || 'Innings 1'] !== undefined || 
                                        item[selectedMatch.innings2?.battingTeam || 'Innings 2'] !== undefined) {
                                      plotData.push(item);
                                    }
                                  }
                                }
                              } else if (chartMetric === 'winprob') {
                                for (let i = 0; i <= totalBalls; i++) {
                                  const pt1 = map1.filter(p => Math.round(p.over * 6) <= i).pop();
                                  const pt2 = map2.filter(p => Math.round(p.over * 6) <= i).pop();
                                  
                                  const hasPt1 = !!pt1;
                                  const hasPt2 = !!pt2;
                                  
                                  if (hasPt1 || hasPt2 || i === 0) {
                                    const item: any = {
                                      overNum: Math.floor(i / 6) + (i % 6) / 10,
                                      overNumLabel: `${Math.floor(i / 6)}.${i % 6}`
                                    };
                                    
                                    let probA = 50;
                                    let probB = 50;
                                    
                                    if (i > 0) {
                                      if (hasPt2) {
                                        const res = calculateWinProbability(
                                          pt2.cumulativeRuns,
                                          pt2.cumulativeWickets,
                                          Math.round(pt2.over * 6),
                                          maxOvers,
                                          true,
                                          selectedMatch.targetRuns || (selectedMatch.innings1?.runs + 1)
                                        );
                                        probA = res.probA;
                                        probB = res.probB;
                                      } else if (hasPt1) {
                                        const res = calculateWinProbability(
                                          pt1.cumulativeRuns,
                                          pt1.cumulativeWickets,
                                          Math.round(pt1.over * 6),
                                          maxOvers,
                                          false
                                        );
                                        probA = res.probA;
                                        probB = res.probB;
                                      }
                                    }
                                    
                                    item[selectedMatch.innings1?.battingTeam || 'Innings 1'] = probA;
                                    if (selectedMatch.innings2) {
                                      item[selectedMatch.innings2?.battingTeam || 'Innings 2'] = probB;
                                    }
                                    
                                    plotData.push(item);
                                  }
                                }
                              } else {
                                for (let i = 0; i <= totalBalls; i++) {
                                  const pt1 = map1.filter(p => Math.round(p.over * 6) <= i).pop();
                                  const pt2 = map2.filter(p => Math.round(p.over * 6) <= i).pop();
                                  
                                  if (pt1 || pt2 || i === 0) {
                                    const item: any = {
                                      overNum: Math.floor(i / 6) + (i % 6) / 10,
                                      overNumLabel: (Math.floor(i / 6) + '.' + (i % 6))
                                    };
                                    
                                    if (pt1) {
                                      item[selectedMatch.innings1?.battingTeam || 'Innings 1'] = pt1.cumulativeRuns;
                                    } else if (i === 0) {
                                      item[selectedMatch.innings1?.battingTeam || 'Innings 1'] = 0;
                                    }
                                    
                                    if (pt2) {
                                      item[selectedMatch.innings2?.battingTeam || 'Innings 2'] = pt2.cumulativeRuns;
                                    } else if (i === 0 && selectedMatch.innings2) {
                                      item[selectedMatch.innings2?.battingTeam || 'Innings 2'] = 0;
                                    }
                                    
                                    plotData.push(item);
                                  }
                                }
                              }
                              return plotData;
                            })()}
                            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800/40" />
                            <XAxis 
                              dataKey="overNum" 
                              tickLine={false}
                              tick={{ fill: 'currentColor' }}
                              tickFormatter={(v) => `${v.toFixed(1)} ov`}
                            />
                            <YAxis 
                              tickLine={false}
                              tick={{ fill: 'currentColor' }}
                              domain={chartMetric === 'winprob' ? [0, 100] : ['auto', 'auto']}
                              tickFormatter={(v) => chartMetric === 'winprob' ? `${v}%` : v}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '16px', color: 'white', fontWeight: 'bold' }}
                              labelFormatter={(v) => `Over: ${parseFloat(v as string).toFixed(1)}`}
                              formatter={(value) => chartMetric === 'winprob' ? [`${value}% Win Prob`, 'Team'] : [value, '']}
                            />
                            <Line 
                              type="monotone" 
                              dataKey={selectedMatch.innings1?.battingTeam || 'Innings 1'} 
                              stroke="#10b981" 
                              strokeWidth={3} 
                              dot={{ r: 2 }}
                            />
                            {selectedMatch.innings2 && (
                              <Line 
                                type="monotone" 
                                dataKey={selectedMatch.innings2?.battingTeam || 'Innings 2'} 
                                stroke="#f59e0b" 
                                strokeWidth={3} 
                                dot={{ r: 2 }}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                )}

                {/* ===================== TAB 4: HIGHLIGHTS & COMMENTARY ===================== */}
                {activeTab === 'highlights' && (
                  <div className="space-y-6">
                    
                    {/* Key Performers Spotlight and General Highlights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Top Match Highlights indicators */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="pb-3 border-b border-slate-50 dark:border-slate-800 mb-4 flex items-center justify-between">
                          <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-widest flex items-center gap-2">
                            <Sparkles size={14} className="animate-pulse" /> Key Innings Milestones
                          </h4>
                          <span className="text-[9px] font-mono text-slate-400">TRACKER</span>
                        </div>

                        {(() => {
                          // Compute boundaries totals
                          let fours = 0;
                          let sixes = 0;
                          currentInnings.batsmen.forEach(b => {
                            fours += b.fours;
                            sixes += b.sixes;
                          });

                          return (
                            <div className="space-y-3.5 text-xs text-slate-650 dark:text-slate-350 font-medium">
                              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span>Total Fours (4s) hit:</span>
                                <span className="font-mono font-black text-emerald-500 text-sm bg-white dark:bg-slate-900 px-3 py-1 rounded border border-slate-100 dark:border-slate-800">{fours}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span>Total Sixes (6s) hit:</span>
                                <span className="font-mono font-black text-amber-500 text-sm bg-white dark:bg-slate-900 px-3 py-1 rounded border border-slate-100 dark:border-slate-800">{sixes}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
                                <span>Established Run-rate Index:</span>
                                <span className="font-mono font-black text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-900 px-3 py-1 rounded border border-slate-100 dark:border-slate-800">
                                  {calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* MVP Profile Spotlights */}
                      {matchPerformanceHighlights && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                          <div className="pb-3 border-b border-slate-50 dark:border-slate-800 mb-4 flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase text-slate-450 dark:text-slate-500 tracking-widest flex items-center gap-1.5">
                              <Award size={14} className="text-amber-500 animate-bounce" /> Match Key Performers
                            </h4>
                            <span className="text-[9px] font-mono text-slate-450">LIVE PERFORMERS</span>
                          </div>

                          <div className="space-y-3.5 text-xs font-bold leading-normal">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-350">
                              <span className="font-medium flex items-center gap-1">🏏 Top Batsman:</span>
                              <span className="font-mono text-slate-850 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-850">
                                {matchPerformanceHighlights.bestBatter.runs > 0 
                                  ? `${matchPerformanceHighlights.bestBatter.name} (${matchPerformanceHighlights.bestBatter.runs} Runs / ${matchPerformanceHighlights.bestBatter.balls} Balls)` 
                                  : 'Data Pending'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-350 pt-2 border-t border-slate-100 dark:border-slate-850/80">
                              <span className="font-medium flex items-center gap-1">⚡ Top Bowler:</span>
                              <span className="font-mono text-slate-850 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-850">
                                {matchPerformanceHighlights.bestBowler.wickets > 0 || matchPerformanceHighlights.bestBowler.runs > 0
                                  ? `${matchPerformanceHighlights.bestBowler.name} (${matchPerformanceHighlights.bestBowler.wickets} Wkts / ${matchPerformanceHighlights.bestBowler.runs} Runs)` 
                                  : 'Data Pending'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Predictive Win Probability Commentary inside AI Commentary */}
                    <WinProbabilityCard
                      match={selectedMatch}
                      userLanguage={spectatorCommentaryLang}
                    />

                    {/*🎙️ AI Commentary Booth & CricBrain Analyst Desk */}
                    <div className="bg-gradient-to-br from-emerald-650 to-emerald-800 dark:from-slate-900 dark:to-emerald-950/40 text-white rounded-[2.5rem] p-6 lg:p-8 shadow-xl space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-emerald-500/10 text-emerald-350 flex items-center justify-center shadow-inner">
                            <Bot size={24} className="text-white animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-emerald-200 tracking-wider">PREMIUM COGNITIVE MODULE</span>
                            <h4 className="text-lg font-black tracking-tight text-white font-sans flex items-center gap-2">
                              CricBrain AI Commentary Suite
                            </h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded bg-black/20 text-[9px] font-mono tracking-widest text-emerald-250 font-black flex items-center gap-1.5 border border-white/5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE CONNECT
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Column 1: AI Audio Briefing Generator */}
                        <div className="bg-white/5 dark:bg-black/20 border border-white/5 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-emerald-300 tracking-widest flex items-center gap-1">
                              <Volume2 size={12} /> DYNAMIC VOICE BROADCAST
                            </span>
                            <h5 className="text-sm font-black text-white">Live AI Radio Broadcast</h5>
                            <p className="text-xs text-emerald-100/80 font-medium leading-relaxed">
                              Listen to a live synthesized match brief podcast summing up key momentum, toss results, run rates, and tactical projections. Crafted in real-time by Zephyr Voice.
                            </p>
                          </div>

                          <div className="space-y-4 pt-2">
                            <button
                              onClick={handleGeneratePodcastSummary}
                              disabled={isPodcastLoading}
                              className="w-full h-11 bg-white hover:bg-emerald-100 active:bg-emerald-200 disabled:bg-white/20 text-emerald-900 disabled:text-white/40 font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer border-none shadow-md"
                            >
                              {isPodcastLoading ? (
                                <>
                                  <span className="w-4 h-4 border-2 border-emerald-900 border-t-transparent rounded-full animate-spin" />
                                  Synthesizing Audio...
                                </>
                              ) : (
                                <>
                                  <Play size={14} fill="currentColor" />
                                  Generate Voice Podcast Briefing
                                </>
                              )}
                            </button>

                            {podcastScript && (
                              <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 space-y-2 text-xs">
                                <p className="italic text-emerald-100/95 font-semibold text-[11px] leading-relaxed">
                                  "{podcastScript}"
                                </p>
                                {podcastAudioBase64 && (
                                  <div className="pt-2">
                                    <audio 
                                      src={podcastAudioBase64} 
                                      controls 
                                      className="un-revert-style w-full accent-emerald-500 h-8 rounded-lg outline-none bg-black/30 text-white"
                                      autoPlay
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Analyst Desk Q&A */}
                        <div className="bg-white/5 dark:bg-black/20 border border-white/5 rounded-3xl p-5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase text-emerald-300 tracking-widest flex items-center gap-1">
                              <HelpCircle size={12} /> CRICBRAIN ANALYST BENCH
                            </span>
                            <h5 className="text-sm font-black text-white">Ask the Match Analyst Coach</h5>
                            <p className="text-xs text-emerald-100/80 font-medium leading-relaxed">
                              Inquire about match trends, win percentage metrics, weak bowling areas, star players on form, or upcoming run chase strategies.
                            </p>
                          </div>

                          <div className="space-y-3 pt-2">
                            <form onSubmit={handleAskAnalyst} className="relative">
                              <input
                                type="text"
                                value={insightsPrompt}
                                onChange={(e) => setInsightsPrompt(e.target.value)}
                                placeholder="e.g. Which team has the upper hand now and why?"
                                className="w-full bg-black/20 text-white placeholder-emerald-100/50 border border-white/10 rounded-xl pl-4 pr-12 py-2.5 text-xs font-semibold outline-none transition-all focus:border-white/30 text-slate-100"
                              />
                              <button
                                type="submit"
                                disabled={isInsightsLoading || !insightsPrompt.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white text-emerald-950 flex items-center justify-center cursor-pointer disabled:bg-white/20 disabled:text-white/40 border-none hover:bg-emerald-105 active:scale-95 transition-all"
                              >
                                {isInsightsLoading ? (
                                  <span className="w-3.5 h-3.5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send size={15} />
                                )}
                              </button>
                            </form>

                            {insightsResponse && (
                              <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 text-[11px] max-h-48 overflow-y-auto space-y-2 leading-relaxed font-semibold">
                                {insightsResponse.split('\n\n').map((para, pIdx) => (
                                  <p key={pIdx} className="text-emerald-50">
                                    {para.split('\n').map((line, lIdx) => {
                                      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                                        return (
                                          <span key={lIdx} className="block pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-350">
                                            {line.replace(/^[-*]\s*/, '')}
                                          </span>
                                        );
                                      }
                                      return line;
                                    })}
                                  </p>
                                ))}
                              </div>
                            )}

                            {insightsError && (
                              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-350 text-[10px] font-black uppercase tracking-wider text-center">
                                {insightsError}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Log commentary feed with filters and text search */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-0.5">Real-time ticker updates</span>
                          <h4 className="text-base font-black text-slate-855 dark:text-slate-100">Live Commentary Logs</h4>
                        </div>

                        {/* Text search within commentary logs */}
                        <div className="relative w-full md:w-64">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                            <Search size={13} />
                          </span>
                          <input 
                            type="text"
                            value={commentarySearch}
                            onChange={(e) => setCommentarySearch(e.target.value)}
                            placeholder="Search keywords (e.g. catch, wicket, 6)..."
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-100 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Filter tabs and Language selector */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl w-full sm:w-max border border-slate-200/50 dark:border-slate-850">
                          {[
                            { id: 'all', label: 'All Balls' },
                            { id: 'boundary', label: '🏏 Boundaries Only' },
                            { id: 'wicket', label: '🟥 Wickets Only' },
                            { id: 'extra', label: '🟦 Extras Only' }
                          ].map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => setCommentaryFilter(btn.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                                commentaryFilter === btn.id 
                                  ? 'bg-white dark:bg-slate-850 text-emerald-600 dark:text-white shadow-sm' 
                                  : 'text-slate-450 dark:text-slate-400 bg-transparent hover:text-slate-700'
                              }`}
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>

                        {/* User Language Option: Marathi, Hindi, English */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850">
                          <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 px-1.5">
                            Language:
                          </span>
                          {[
                            { id: 'mr', label: '🚩 मराठी', name: 'Marathi' },
                            { id: 'hi', label: '🇮🇳 हिंदी', name: 'Hindi' },
                            { id: 'en', label: '🌐 English', name: 'English' }
                          ].map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => setSpectatorCommentaryLang(l.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                                spectatorCommentaryLang === l.id
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'text-slate-500 dark:text-slate-400 bg-transparent hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Feeds stream logs */}
                      <div className="max-h-96 overflow-y-auto space-y-3 pr-2 font-mono scrollbar-thin">
                        {(() => {
                          const baseList = currentInnings.commentaryList || [];
                          let list = [...baseList];
                          
                          if (commentaryFilter === 'boundary') {
                            list = list.filter(c => c.type === 'boundary');
                          } else if (commentaryFilter === 'wicket') {
                            list = list.filter(c => c.type === 'wicket');
                          } else if (commentaryFilter === 'extra') {
                            list = list.filter(c => c.type === 'extra');
                          }

                          if (commentarySearch.trim()) {
                            const query = commentarySearch.toLowerCase().trim();
                            list = list.filter(c => {
                              const localizedText = getCommentaryText(c, spectatorCommentaryLang).toLowerCase();
                              const origText = (c.description || '').toLowerCase();
                              return localizedText.includes(query) || origText.includes(query) || c.overBall.includes(query);
                            });
                          }

                          if (list.length === 0) {
                            return (
                              <p className="text-center text-xs text-slate-400 py-10 italic">No matches for current commentary criteria filter.</p>
                            );
                          }

                          return list.map((comm) => {
                            const isWkt = comm.type === 'wicket';
                            const isBnd = comm.type === 'boundary';
                            const isExt = comm.type === 'extra';
                            const isMls = comm.type === 'milestone';
                            const displayText = getCommentaryText(comm, spectatorCommentaryLang);

                            return (
                              <div 
                                key={comm.id}
                                className={`p-4 rounded-2xl text-xs border transition-all hover:scale-[1.005] duration-150 ${
                                  isWkt ? 'bg-rose-500/10 border-rose-500/15 text-rose-600 dark:text-rose-400' :
                                  isBnd ? 'bg-amber-500/10 border-amber-500/15 text-amber-600 dark:text-amber-400 font-bold' :
                                  isMls ? 'bg-purple-500/10 border-purple-500/15 text-purple-600 dark:text-purple-400' :
                                  isExt ? 'bg-sky-500/10 border-sky-400/15 text-sky-600 dark:text-sky-450' :
                                  'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-extrabold text-[9.5px] uppercase tracking-wider bg-slate-200/50 dark:bg-slate-850 px-2 py-0.5 rounded text-slate-650 dark:text-slate-300">
                                    Delivery {comm.overBall}
                                  </span>
                                  
                                  <div className="flex gap-1.5 text-[8.5px] font-black uppercase tracking-widest">
                                    {isWkt && <span className="bg-rose-500 text-white px-2 py-0.5 rounded shadow-sm">🔴 WICKET OUT</span>}
                                    {isBnd && (
                                      <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow-sm">
                                        {((comm.description || '').toLowerCase().includes('six') || (comm.description || '').toLowerCase().includes('6 runs') || (comm.description || '').toLowerCase().includes(' 6 ')) 
                                          ? '🚀 SIXER' 
                                          : '⚡ FOUR'}
                                      </span>
                                    )}
                                    {isExt && <span className="bg-blue-500 text-white px-2 py-0.5 rounded shadow-sm">🔵 EXTRA COST</span>}
                                    {isMls && <span className="bg-purple-500 text-white px-2 py-0.5 rounded shadow-sm">⭐ MILESTONE</span>}
                                  </div>
                                </div>
                                <p className="text-xs tracking-wide leading-relaxed font-sans">{displayText}</p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                  </div>
                )}

                {/* ===================== TAB 5: SQUADS XI & LEAGUE STANDINGSPoints Table ===================== */}
                {activeTab === 'standing' && (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Squad XI Section - Auto rosters completion */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {[selectedMatch.teamA, selectedMatch.teamB].map((teamName, teamIdx) => {
                        // Extract registered players matching team name
                        const inn = selectedMatch.innings1?.battingTeam === teamName ? selectedMatch.innings1 : 
                                    (selectedMatch.innings2?.battingTeam === teamName ? selectedMatch.innings2 : null);
                        const bowlInn = selectedMatch.innings1?.bowlingTeam === teamName ? selectedMatch.innings1 : 
                                        (selectedMatch.innings2?.bowlingTeam === teamName ? selectedMatch.innings2 : null);

                        const listBatNames = inn ? (inn.batsmen || []).map(b => b.name) : [];
                        const listBowlNames = bowlInn ? (bowlInn.bowlers || []).map(b => b.name) : [];
                        
                        // Merge lists
                        const uniquePlayerNames = Array.from(new Set([...listBatNames, ...listBowlNames])).filter(Boolean);
                        
                        // Generate mock extra names to form Squad XI
                        const regionNames = ["A. Shinde", "S. Pawar", "R. Gaikwad", "G. Kulkarni", "P. Jagtap", "M. Deshmukh", "V. Joshi", "S. Jamkhedkar", "K. Bhosale", "D. More", "B. Shelar"];
                        const squadList = [...uniquePlayerNames];
                        let nameIdx = 0;
                        while (squadList.length < 11 && nameIdx < regionNames.length) {
                          const name = regionNames[nameIdx];
                          if (!squadList.includes(name)) {
                            squadList.push(name);
                          }
                          nameIdx++;
                        }

                        return (
                          <div key={teamName} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                            <div className="pb-3 border-b border-slate-50 dark:border-slate-800 mb-4 flex justify-between items-center">
                              <div>
                                <span className="text-[9px] font-black uppercase text-emerald-505 tracking-wider block mb-0.5 text-emerald-600 dark:text-emerald-400">Team Squad XI</span>
                                <h4 className="text-sm font-black text-slate-850 dark:text-white">{teamName}</h4>
                              </div>
                              <span className="text-[9px] font-mono text-slate-450 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-800">
                                SQUAD XI ROSTER
                              </span>
                            </div>

                            <div className="space-y-2 max-h-[22rem] overflow-y-auto pr-1 scrollbar-thin">
                              {squadList.map((player, idx) => {
                                // Determine matching live status inside active innings
                                let liveStatus = '⏳ Yet To Bat';
                                let bgClass = 'bg-slate-50 dark:bg-slate-950 text-slate-500';
                                
                                const batEntry = inn?.batsmen.find(b => b.name === player);
                                const bowlEntry = bowlInn?.bowlers.find(bw => bw.name === player);

                                if (batEntry) {
                                  if (!batEntry.isOut) {
                                    // check if crease active striker or nonstriker
                                    const isCrease = inn?.batsmen[inn.strikerIndex]?.name === player || inn?.batsmen[inn.nonStrikerIndex]?.name === player;
                                    if (isCrease) {
                                      liveStatus = '🏏 Active Batting';
                                      bgClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold';
                                    } else {
                                      liveStatus = 'not out';
                                    }
                                  } else {
                                    liveStatus = '❌ Out / Dismissed';
                                    bgClass = 'bg-rose-500/5 text-rose-500';
                                  }
                                } else if (bowlEntry) {
                                  liveStatus = '⚡ Active Spell Bowler';
                                  bgClass = 'bg-amber-500/5 text-amber-600 font-extrabold';
                                }

                                const stats = playerStatsMap[player.toLowerCase().trim()];
                                const matchesPlayed = stats ? stats.matches : 0;
                                const avgScore = stats && stats.matches > 0 ? stats.avg : 0;

                                return (
                                  <div 
                                    key={`${player}-${idx}`}
                                    className={`p-3 rounded-2xl text-xs flex justify-between items-center ${bgClass} border border-transparent hover:scale-[1.005] transition-transform`}
                                    title={`${player} - Matches Played: ${matchesPlayed}, Average Score: ${matchesPlayed > 0 ? avgScore : 'N/A'}`}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                                        <strong className="text-slate-805 dark:text-slate-100">{player}</strong>
                                      </div>
                                      {/* Matches Played and Average Score indicators */}
                                      <div className="text-[9px] font-black text-slate-450 dark:text-slate-500 mt-0.5 ml-5 font-mono flex items-center gap-1.5 leading-none select-none">
                                        <span>Matches Played: <strong className="text-slate-700 dark:text-slate-300 font-black">{matchesPlayed}</strong></span>
                                        <span className="text-slate-300 dark:text-slate-700 text-[6px]">•</span>
                                        <span>Avg score: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{matchesPlayed > 0 ? avgScore : '--'}</strong></span>
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider">{liveStatus}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Standing points table */}
                    {selectedMatch.tournamentId ? (() => {
                      const activeTournamentOfMatch = tournaments.find(t => t.id === selectedMatch.tournamentId);
                      const realTournamentStandings = activeTournamentOfMatch 
                        ? computePointsTable(activeTournamentOfMatch.teams || [], activeTournamentOfMatch.matches || []).sort((a,b) => b.points !== a.points ? b.points - a.points : b.NRR - a.NRR)
                        : [];

                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2.5rem] shadow-sm">
                          <div className="pb-3 border-b border-slate-50 dark:border-slate-800 mb-4 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block mb-0.5">
                                {activeTournamentOfMatch?.name || 'Tournament'} Club Standings
                              </span>
                              <h4 className="text-base font-black text-slate-855 dark:text-white">
                                {activeTournamentOfMatch?.name || 'Tournament'} Points Table
                              </h4>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">LIVE standings</span>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                            <table className="w-full text-left text-xs font-medium text-slate-655 dark:text-slate-300 min-w-[500px]">
                              <thead className="bg-slate-50 dark:bg-slate-950">
                                <tr className="text-[9px] uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  <th className="p-4">Rank position</th>
                                  <th className="p-4">Cricket team name</th>
                                  <th className="p-4 text-center">Played (P)</th>
                                  <th className="p-4 text-center">Won (W)</th>
                                  <th className="p-4 text-center">Lost (L)</th>
                                  <th className="p-4 text-center">Tied (T)</th>
                                  <th className="p-4 text-center">Net Run Rate (NRR)</th>
                                  <th className="p-4 text-center">Points (PTS)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                {realTournamentStandings.length > 0 ? (
                                  realTournamentStandings.map((row: any, idx: number) => (
                                    <tr 
                                      key={row.id || row.name} 
                                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-950/20 ${
                                        row.name === selectedMatch.teamA || row.name === selectedMatch.teamB ? 'bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' : ''
                                      }`}
                                    >
                                      <td className="p-4 font-mono font-black">{idx + 1}</td>
                                      <td className="p-4 font-black text-slate-855 dark:text-white flex items-center gap-1.5">
                                        {row.name}
                                        {(row.name === selectedMatch.teamA || row.name === selectedMatch.teamB) && (
                                          <span className="text-[8px] bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">In Play</span>
                                        )}
                                      </td>
                                      <td className="p-4 text-center font-mono">{row.played}</td>
                                      <td className="p-4 text-center font-mono text-emerald-505 font-bold">{row.won}</td>
                                      <td className="p-4 text-center font-mono text-rose-500">{row.lost}</td>
                                      <td className="p-4 text-center font-mono text-amber-500">{row.tied}</td>
                                      <td className="p-4 text-center font-mono font-bold">{row.NRR ? (row.NRR > 0 ? `+${row.NRR.toFixed(3)}` : row.NRR.toFixed(3)) : '0.000'}</td>
                                      <td className="p-4 text-center font-mono font-black text-slate-855 dark:text-slate-100 text-sm">{row.points}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={8} className="p-4 text-center text-slate-505 dark:text-slate-400 font-bold uppercase italic font-mono text-[9px] tracking-wider py-8">
                                      Calculating Standings... No match records registered yet.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 p-6 rounded-3xl text-center shadow-inner">
                        <span className="text-2xl block mb-2">🏆</span>
                        <p className="text-[10px] text-slate-505 dark:text-slate-400 font-bold uppercase tracking-widest leading-normal">
                          This is a custom single match.
                        </p>
                        <p className="text-[9px] text-slate-400 leading-normal mt-1">
                          No league standing or points table calculation is generated for non-tournament games.
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {/* ===================== TAB 6: CRICKET NEWS & VIDEOS DESK ===================== */}
                {activeTab === 'media' && (
                  <div className="space-y-6 animate-fade-in">

                    {/* Action Match Highlights Simulated Videos Deck */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="pb-2 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-300">Live Match Videos Desk</h4>
                          <span className="text-[9px] font-mono text-slate-400">CLIPS FEED</span>
                        </div>

                        <div className="space-y-4.5">
                          {[
                            { title: "Spectacular 6! Over boundary cleared with power play style", duration: "1:24 min", event: "Batting Range Highlights" },
                            { title: "Clean Bowled Yorker! Middle stump flying in speed spell", duration: "0:45 min", event: "Spell Highlights" },
                            { title: `${selectedMatch.teamA} dressing room pre-match planning thoughts`, duration: "4:15 min", event: "Interview" },
                            { title: "Strategic boundary index and field setup commentary analysis", duration: "2:50 min", event: "Strategic Highlights" }
                          ].map((vid, vidIdx) => (
                            <div 
                              key={vidIdx}
                              className="group p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/5 transition-all flex items-center gap-3.5 cursor-pointer border border-transparent hover:border-emerald-500/10"
                            >
                              <div className="w-16 h-12 rounded-xl bg-slate-900 dark:bg-slate-850 shrink-0 flex items-center justify-center relative overflow-hidden text-emerald-400 border border-white/5 shadow">
                                <span className="text-xs">▶</span>
                                <span className="absolute bottom-1 right-1 bg-black/75 px-1 py-0.2 rounded text-[7px] font-mono text-white font-semibold">{vid.duration}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 block mb-0.5">{vid.event}</span>
                                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-500 transition-colors">{vid.title}</h5>
                                <p className="text-[9px] text-slate-400 mt-0.5 font-sans">Simulated on-field stream footage reel</p>
                                {vidIdx === 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showToast("📥 HD Highlight Reels compiling... Your package download has initiated successfully!");
                                    }}
                                    className="mt-2.5 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black rounded-lg text-[9px] uppercase tracking-widest cursor-pointer border-none transition-transform hover:scale-[1.03] flex items-center gap-1.5 shadow"
                                    type="button"
                                  >
                                    <span>Download Match Highlight Reels</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cricket News desk bulletins */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="pb-2 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-305">Cricket News desk bulletins</h4>
                          <span className="text-[9px] font-mono text-slate-405">COMMUNICATIONS</span>
                        </div>

                        <div className="space-y-4">
                          {[
                            { title: "Live Stadium Weather Desk: Clear skies, moderate wind flow favoring seamers", time: "10 mins ago" },
                            { title: "Pitch Analysis from Curators: Slightly damp ground, spins might dominate over subsequent overs", time: "40 mins ago" },
                            { title: "Match Tactics Report: Teams opting for shorter run focus on boundary margins", time: "1 hour ago" },
                            { title: "Key Fitness news: Match selectors confirm squad components complete fit", time: "2 hours ago" }
                          ].map((news, newsIdx) => (
                            <div key={newsIdx} className="p-3 bg-slate-50/50 dark:bg-slate-950/40 rounded-xl space-y-1 border border-slate-100 dark:border-slate-850">
                              <div className="flex justify-between text-[8px] font-bold text-slate-400">
                                <span className="uppercase tracking-widest text-emerald-500">NEWS FEED BULLETIN</span>
                                <span className="font-mono">{news.time}</span>
                              </div>
                              <strong className="text-xs font-black text-slate-800 dark:text-slate-200 block">{news.title}</strong>
                            </div>
                          ))}
                        </div>

                      </div>

                    </div>

                  </div>
                )}

            </div>
          </div>
        )}

        {/* Floating Toast Alert Notification */}
        <AnimatePresence>
          {toastNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-[120] bg-slate-900 border border-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm flex items-center gap-3"
            >
              <Sparkles className="text-emerald-400 shrink-0" size={18} />
              <p className="text-xs font-black tracking-tight leading-relaxed">{toastNotification}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Player Registration Form Modal */}
        <AnimatePresence>
          {showPlayerRegistration && (
            <PlayerRegistrationForm onClose={() => setShowPlayerRegistration(false)} />
          )}
        </AnimatePresence>

      </div>
    </section>
  );
};
