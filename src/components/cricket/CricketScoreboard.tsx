import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, RotateCcw, AlertCircle, ShoppingBag, Plus, Sparkles, BookOpen, Clock, 
  ArrowRight, Users, Play, Undo, Calendar, Trash2, ArrowLeftRight, Check,
  ChevronRight, Smile, Settings, Volume2, VolumeX, Edit, ChevronDown, ChevronUp, Sun, Moon, Info, HelpCircle,
  Share2, FileDown, PlusCircle, BarChart3, Radio, Flame, ShieldAlert, Award, Zap, Lock, UserPlus,
  Eye, EyeOff, Search, Save, Download, X, CloudRain, Link2
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LogIn as LoginIcon, ShieldCheck as ShieldIcon } from 'lucide-react';

// Firestore and Realtime Database imports
import { 
  db, 
  handleFirestoreError, 
  OperationType, 
  isFirestoreQuotaExhausted, 
  isQuotaError, 
  recordFirestoreQuotaExhaustion,
  safeSetDoc,
  safeUpdateDoc,
  safeDeleteDoc,
  syncScoreToRealtimeDB,
  subscribeToRealtimeDBMatch
} from '../../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, collection, deleteDoc, updateDoc } from 'firebase/firestore';

// Recharts imports
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell } from 'recharts';

// jsPDF and Autotable imports
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConfettiCanvas } from './ConfettiCanvas';
import { CricketTournamentTab } from './CricketTournamentTab';
import { DLSCalculatorModal } from './DLSCalculatorModal';
import { SpinCoinModal, SpinCoinResult } from './SpinCoinModal';
import { 
  deleteLocalMatch, 
  isMatchDeleted, 
  markMatchDeleted,
  unmarkMatchDeleted, 
  saveMatchToRegistry, 
  setActiveMatch, 
  getLocalMatchById,
  pruneDeletedMatchesFromStorage,
  sanitizeForFirestore
} from './cricketStorage';

// Types & Interfaces
export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outMode?: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW' | 'Retired Hurt';
  dismissedBy?: string;
  fielderName?: string;
}

export interface Bowler {
  name: string;
  ballsBowled: number; // to calculate overs easily
  maidens: number;
  runsConceded: number;
  wickets: number;
  isCurrent: boolean;
  consecutiveWickets?: number;
}

interface BallProgress {
  over: number;      // e.g. 1.2 -> over float
  overStr: string;   // e.g. "1.2"
  cumulativeRuns: number;
  cumulativeWickets: number;
}

interface CricketTeam {
  id: string;
  name: string;
  players: string[];
  createdAt: string;
}

export interface Innings {
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
  }[];
  history?: BallProgress[];
}

interface OverlayConfig {
  template: 'broadcast-pro' | 'neon-sport' | 'clean-white' | 'ipl-style' | 'score-bug-1900-200' | 'slanted-pro-design';
  showStatsPanel: boolean;
  showTicker: boolean;
  tickerMessage: string;
  forceInningsLayout?: 1 | 2;
  manualWicketTrigger: boolean;
  manualOutsDisplay: 'none' | 'corner' | 'fullscreen';
  manualFreeHitTrigger: boolean;
  teamAColor: string;
  teamBColor: string;
  showScoreBug?: boolean;
  customBanner?: 'none' | 'four' | 'six' | 'fifty' | 'hundred' | 'drinks' | 'rain' | 'free_hit' | 'out';
  customBannerText?: string;
  manualAlertTrigger?: {
    type: 'six' | 'four' | 'wicket';
    timestamp: number;
  };
  activeGraphic?: string;
  lowerThirdMode?: 'intro' | 'equation' | 'umpires';
  selectedUmpireSignal?: 'out' | 'noball' | 'freehit' | 'deadball' | 'wide';
  customMilestone?: { name: string; type: 'fifty' | 'hundred' | '5wkt'; value: number } | null;
  boundaryBlast?: boolean;
  customOverlayImg?: string;
  customOverlayX?: number;
  customOverlayY?: number;
  customOverlayScale?: number;
  customOverlayOpacity?: number;
  customOverlayEnabled?: boolean;
  customOverlayAsBackground?: boolean;
}

export interface MatchState {
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
  winner?: string;
  winReason?: string;
  date: string;
  targetRuns?: number; // target score to win for innings 2 (Runs score by innings 1 + 1)
  freeHitNext: boolean;
  lastBallResult?: string;
  updatedAt?: number;
  version?: number;
  overlayConfig?: OverlayConfig;
  teamALogo?: string;
  teamBLogo?: string;
  playerPhotos?: Record<string, string>;
  tournamentId?: string | null;
  tournamentMatchId?: string | null;
  createdBy?: string;
  tournamentName?: string;
  seriesName?: string;
  groundName?: string;
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

const generateNarrativeSummary = (m: MatchState): string => {
  if (!m) return "No match data available.";
  let lines: string[] = [];
  
  lines.push(`🏏 MATCH REPORT: ${m.teamA.toUpperCase()} VS ${m.teamB.toUpperCase()}`);
  lines.push(`📅 Date: ${m.date || new Date().toISOString().split('T')[0]}`);
  lines.push(`🏆 Result: ${m.winner === 'Tie' ? 'MATCH TIED!' : `${m.winner} won the match.`}`);
  if (m.winReason) lines.push(`ℹ️ Match Details: ${m.winReason}`);
  lines.push('');

  // Innings 1 Summary
  if (m.innings1) {
    const inn = m.innings1;
    lines.push(`👉 1ST INNINGS: ${inn.battingTeam.toUpperCase()}`);
    lines.push(`Score: ${inn.runs}/${inn.wickets} in ${((inn.ballsBowled || 0) / 6).toFixed(1)} overs`);
    
    const boundaries = (inn.commentaryList || []).filter(c => c.type === 'boundary');
    const wickets = (inn.commentaryList || []).filter(c => c.type === 'wicket');
    
    if (boundaries.length > 0 || wickets.length > 0) {
      lines.push(`🎯 Key Incidents:`);
      const sortedMoments = [...(inn.commentaryList || [])]
        .filter(c => c.type === 'boundary' || c.type === 'wicket')
        .sort((a, b) => {
          const aBalls = parseFloat(a.overBall);
          const bBalls = parseFloat(b.overBall);
          return aBalls - bBalls;
        });

      if (sortedMoments.length === 0) {
        lines.push(`  • Steady progress throughout the innings.`);
      } else {
        sortedMoments.forEach(mom => {
          const emoji = mom.type === 'boundary' ? '🔥' : '🔴';
          lines.push(`  • [Ov ${mom.overBall}] ${emoji} ${mom.description}`);
        });
      }
    } else {
      lines.push(`  • Steady progress with no wickets recorded.`);
    }
    lines.push('');
  }

  // Innings 2 Summary
  if (m.innings2 && m.innings2.ballsBowled > 0) {
    const inn = m.innings2;
    lines.push(`👉 2ND INNINGS: ${inn.battingTeam.toUpperCase()}`);
    lines.push(`Score: ${inn.runs}/${inn.wickets} in ${((inn.ballsBowled || 0) / 6).toFixed(1)} overs`);
    lines.push(`Target Needed: ${m.targetRuns || (m.innings1 ? m.innings1.runs + 1 : 0)} runs`);
    
    const boundaries = (inn.commentaryList || []).filter(c => c.type === 'boundary');
    const wickets = (inn.commentaryList || []).filter(c => c.type === 'wicket');
    
    if (boundaries.length > 0 || wickets.length > 0) {
      lines.push(`🎯 Key Incidents:`);
      const sortedMoments = [...(inn.commentaryList || [])]
        .filter(c => c.type === 'boundary' || c.type === 'wicket')
        .sort((a, b) => {
          const aBalls = parseFloat(a.overBall);
          const bBalls = parseFloat(b.overBall);
          return aBalls - bBalls;
        });

      if (sortedMoments.length === 0) {
        lines.push(`  • Run chase under progress.`);
      } else {
        sortedMoments.forEach(mom => {
          const emoji = mom.type === 'boundary' ? '🔥' : '🔴';
          lines.push(`  • [Ov ${mom.overBall}] ${emoji} ${mom.description}`);
        });
      }
    } else {
      lines.push(`  • Quiet chase with no wickets taken.`);
    }
    lines.push('');
  }

  lines.push(`Briefing automatically parsed. Developed by GullyScore Panel. 🎉`);
  return lines.join('\n');
};

const computePotmName = (matchState: MatchState) => {
  if (!matchState?.innings1 && !matchState?.innings2) return "";
  const statsMap: { [key: string]: { name: string; runs: number; wickets: number } } = {};
  const processInnings = (inn: typeof matchState.innings1) => {
    if (!inn) return;
    (inn.batsmen || []).forEach(b => {
      if (!b.name) return;
      const key = b.name.trim().toLowerCase();
      if (!statsMap[key]) statsMap[key] = { name: b.name.trim(), runs: 0, wickets: 0 };
      statsMap[key].runs += b.runs || 0;
    });
    (inn.bowlers || []).forEach(bw => {
      if (!bw.name) return;
      const key = bw.name.trim().toLowerCase();
      if (!statsMap[key]) statsMap[key] = { name: bw.name.trim(), runs: 0, wickets: 0 };
      statsMap[key].wickets += bw.wickets || 0;
    });
  };
  processInnings(matchState.innings1);
  processInnings(matchState.innings2);
  let bestName = "";
  let maxPoints = -1;
  for (const k in statsMap) {
    const p = statsMap[k];
    const pts = p.runs + (p.wickets * 25);
    if (pts > maxPoints) {
      maxPoints = pts;
      bestName = p.name;
    }
  }
  return bestName;
};

const computeLeaguePointsTableInternal = (teams: any[], matches: any[], defaultOvers: number) => {
  const table: Record<string, any> = {};
  
  (teams || []).forEach(t => {
    table[t.id] = {
      id: t.id,
      name: t.name,
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

  (matches || []).forEach(m => {
    if (m.status !== 'completed' || m.stage !== 'League') return;
    
    const tA = table[m.teamAId];
    const tB = table[m.teamBId];

    if (!tA || !tB) return;

    tA.played += 1;
    tB.played += 1;

    const runsA = parseInt(m.scoreA.split('/')[0]) || 0;
    const runsB = parseInt(m.scoreB.split('/')[0]) || 0;
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

const syncLiveScoreToTournament = async (tournamentId: string, matchId: string, matchState: MatchState) => {
  try {
    const tournamentDocRef = doc(db, 'cricket_tournaments', tournamentId);
    const docSnap = await getDoc(tournamentDocRef);
    if (docSnap.exists()) {
      const tournament = docSnap.data();
      const isCompleted = matchState.status === 'completed';
      const winnerTeam = matchState.winner || null;

      const updatedMatches = (tournament.matches || []).map((m: any) => {
        if (m.id === matchId) {
          const currentInnings = matchState.currentInningsNum === 1 ? matchState.innings1 : (matchState.innings2 || matchState.innings1);
          let score = "0/0";
          let overs = "0";
          let runs = 0;
          let wickets = 0;
          let ballCount = 0;
          if (currentInnings) {
            runs = currentInnings.runs;
            wickets = currentInnings.wickets;
            ballCount = currentInnings.ballsBowled;
            score = `${runs}/${wickets}`;
            const ov = Math.floor(ballCount / 6);
            const rem = ballCount % 6;
            overs = `${ov}.${rem}`;
          }
          
          let scoreA = m.scoreA || "0/0";
          let scoreB = m.scoreB || "0/0";
          let oversA = m.oversA || "0";
          let oversB = m.oversB || "0";
          
          if (currentInnings) {
            if (currentInnings.battingTeam.toLowerCase().trim() === m.teamAName.toLowerCase().trim()) {
              scoreA = score;
              oversA = overs;
            } else {
              scoreB = score;
              oversB = overs;
            }
          }

          if (matchState.innings1) {
            const isTeamA = matchState.innings1.battingTeam.toLowerCase().trim() === m.teamAName.toLowerCase().trim();
            const scoreVal = `${matchState.innings1.runs}/${matchState.innings1.wickets}`;
            const balls1 = matchState.innings1.ballsBowled;
            const oversVal = `${Math.floor(balls1 / 6)}.${balls1 % 6}`;
            if (isTeamA) {
              scoreA = scoreVal;
              oversA = oversVal;
            } else {
              scoreB = scoreVal;
              oversB = oversVal;
            }
          }
          if (matchState.innings2) {
            const isTeamA = matchState.innings2.battingTeam.toLowerCase().trim() === m.teamAName.toLowerCase().trim();
            const scoreVal = `${matchState.innings2.runs}/${matchState.innings2.wickets}`;
            const balls2 = matchState.innings2.ballsBowled;
            const oversVal = `${Math.floor(balls2 / 6)}.${balls2 % 6}`;
            if (isTeamA) {
              scoreA = scoreVal;
              oversA = oversVal;
            } else {
              scoreB = scoreVal;
              oversB = oversVal;
            }
          }

          let winnerId = null;
          if (winnerTeam) {
            if (winnerTeam.toLowerCase().trim() === m.teamAName.toLowerCase().trim()) {
              winnerId = m.teamAId;
            } else if (winnerTeam.toLowerCase().trim() === m.teamBName.toLowerCase().trim()) {
              winnerId = m.teamBId;
            }
          }

          return {
            ...m,
            status: isCompleted ? 'completed' : 'live',
            scoreA,
            scoreB,
            oversA,
            oversB,
            winnerId,
            winner: winnerTeam,
            winReason: matchState.winReason || (isCompleted ? "Match Completed" : ""),
            manOfTheMatch: isCompleted ? (computePotmName(matchState) || m.manOfTheMatch || "") : (m.manOfTheMatch || "")
          };
        }
        return m;
      });

      // Automatically advance knockout brackets or trigger league completions if this match is completed
      let nextMatches = [...updatedMatches];
      let tournamentCompleted = false;
      let mainWinner: string | null = null;

      const completedMatchInTour = nextMatches.find(m => m.id === matchId);

      if (completedMatchInTour && completedMatchInTour.status === 'completed') {
        if (tournament.type === 'knockout') {
          const sfMatches = nextMatches.filter(m => m.stage === 'Semi-Final');
          const qfMatches = nextMatches.filter(m => m.stage === 'Quarter-Final');
          const finalMatch = nextMatches.find(m => m.stage === 'Final');

          // Promotion logic from QFs to SFs
          if (completedMatchInTour.stage === 'Quarter-Final') {
            const qfWinners = qfMatches.map(m => ({
              completed: m.status === 'completed',
              id: m.winnerId,
              name: tournament.teams.find((t: any) => t.id === m.winnerId)?.name || m.winner || "Winner TBD"
            }));

            // SF 1 is Winner of QF1 & QF2
            if (sfMatches[0]) {
              if (qfMatches[0]?.status === 'completed') {
                sfMatches[0].teamAId = qfMatches[0].winnerId || "";
                sfMatches[0].teamAName = qfWinners[0].name;
              }
              if (qfMatches[1]?.status === 'completed') {
                sfMatches[0].teamBId = qfMatches[1].winnerId || "";
                sfMatches[0].teamBName = qfWinners[1].name;
              }
            }
            // SF 2 is Winner of QF3 & QF4
            if (sfMatches[1]) {
              if (qfMatches[2]?.status === 'completed') {
                sfMatches[1].teamAId = qfMatches[2].winnerId || "";
                sfMatches[1].teamAName = qfWinners[2].name;
              }
              if (qfMatches[3]?.status === 'completed') {
                sfMatches[1].teamBId = qfMatches[3].winnerId || "";
                sfMatches[1].teamBName = qfWinners[3].name;
              }
            }
          }

          // Promotion logic from SFs to Finals
          if (completedMatchInTour.stage === 'Semi-Final') {
            if (finalMatch) {
              const sf1 = sfMatches[0];
              const sf2 = sfMatches[1];

              if (sf1 && sf1.status === 'completed') {
                finalMatch.teamAId = sf1.winnerId || "";
                finalMatch.teamAName = tournament.teams.find((t: any) => t.id === sf1.winnerId)?.name || sf1.winner || "SF1 Winner";
              }
              if (sf2 && sf2.status === 'completed') {
                finalMatch.teamBId = sf2.winnerId || "";
                finalMatch.teamBName = tournament.teams.find((t: any) => t.id === sf2.winnerId)?.name || sf2.winner || "SF2 Winner";
              }
            }
          }

          // Apply promo changes back to nextMatches
          nextMatches = nextMatches.map(m => {
            const foundSf = sfMatches.find(sf => sf.id === m.id);
            if (foundSf) {
              return {
                ...m,
                teamAId: foundSf.teamAId,
                teamAName: foundSf.teamAName,
                teamBId: foundSf.teamBId,
                teamBName: foundSf.teamBName
              };
            }
            if (finalMatch && m.id === finalMatch.id) {
              return {
                ...m,
                teamAId: finalMatch.teamAId,
                teamAName: finalMatch.teamAName,
                teamBId: finalMatch.teamBId,
                teamBName: finalMatch.teamBName
              };
            }
            return m;
          });
        }

        if (tournament.type === 'knockout') {
          const finalM = nextMatches.find(m => m.stage === 'Final');
          if (finalM && finalM.status === 'completed') {
            tournamentCompleted = true;
            mainWinner = tournament.teams.find((t: any) => t.id === finalM.winnerId)?.name || finalM.winner || 'Unknown Champion';
          }
        } else {
          // For league, if all matches are completed, set completed
          const allDone = nextMatches.every(m => m.status === 'completed');
          if (allDone && nextMatches.length > 0) {
            tournamentCompleted = true;
            const defaultOvers = tournament.customOvers || (tournament.format === 'T20' ? 20 : (tournament.format === 'ODI' ? 50 : 10));
            const table = computeLeaguePointsTableInternal(tournament.teams, nextMatches, defaultOvers);
            if (table[0]) {
              mainWinner = table[0].name;
            }
          }
        }
      }

      if (!isFirestoreQuotaExhausted()) {
        await safeUpdateDoc(tournamentDocRef, {
          matches: nextMatches,
          status: tournamentCompleted ? 'completed' : tournament.status,
          winnerTeamName: tournamentCompleted ? mainWinner : tournament.winnerTeamName
        });
      }
    }
  } catch (err) {
    if (isQuotaError(err)) {
      recordFirestoreQuotaExhaustion(60);
    } else {
      console.error('Error syncing live score to tournament:', err);
    }
  }
};

// Helper to generate unauthenticated public overlay URLs (replaces pre-production ais-dev- subdomain with ais-pre- for OBS Studio)
const getPublicOverlayUrl = (matchId: string, preview = false) => {
  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  return `${origin}${window.location.pathname}#/live/cricket-overlay?matchId=${matchId}${preview ? '&preview=true' : ''}`;
};

export const CricketScoreboard: React.FC = () => {
  const { isScoreManager, logout, user } = useAuth();

  // Theme Toggle: Simple dark/light theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cricket_theme');
      return saved === 'dark';
    } catch (e) {
      console.warn('Blocked reading cricket_theme from localStorage:', e);
      return false;
    }
  });

  // Section Navigation: Quick Scorer vs Tournament Suite
  const [activeSection, setActiveSection] = useState<'scorer' | 'tournaments'>('scorer');
  
  // Ref to hold a callback trigger for tournament matches
  const tournamentCallbackRef = useRef<((result: any) => void) | null>(null);

  // Load completed matches history from State (synced dynamically with Firestore)
  const [matchHistory, setMatchHistory] = useState<MatchState[]>([]);

  // Routing and Spectator mode query configuration
  const [searchParams, setSearchParams] = useSearchParams();
  const matchIdParam = searchParams.get('matchId');
  const isSpectator = searchParams.get('spectator') === 'true' || !isScoreManager;

  // Team Management state vectors
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [savedTeams, setSavedTeams] = useState<CricketTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamPlayersText, setNewTeamPlayersText] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [localAutosavedMatch, setLocalAutosavedMatch] = useState<MatchState | null>(null);
  
  // States and refs for debounced autosave / persistence
  const [saveStatus, setSaveStatusState] = useState<'saved' | 'saving' | 'error' | null>(null);
  const saveStatusRef = useRef<'saved' | 'saving' | 'error' | null>(null);
  const setSaveStatus = (status: 'saved' | 'saving' | 'error' | null) => {
    saveStatusRef.current = status;
    setSaveStatusState(status);
  };
  const savingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestStateToSaveRef = useRef<MatchState | null>(null);
  
  // Selected team roster lists used to populate players
  const [selectedTeamARoster, setSelectedTeamARoster] = useState<string[]>([]);
  const [selectedTeamBRoster, setSelectedTeamBRoster] = useState<string[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([]);

  // Compute player matches played and averages from completed match history database
  const playerStatsMap = useMemo(() => {
    const stats: Record<string, { matches: number; totalRuns: number; avg: number }> = {};
    for (const past of matchHistory) {
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
  }, [matchHistory]);

  const topBatsmenChartData = useMemo(() => {
    const list = Object.entries(playerStatsMap as Record<string, { matches: number; totalRuns: number; avg: number }>).map(([name, scoreObj]) => ({
      name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      runs: scoreObj.totalRuns,
      matches: scoreObj.matches,
      avg: scoreObj.avg
    }));
    return list.sort((a, b) => b.runs - a.runs).slice(0, 5);
  }, [playerStatsMap]);

  // Sidebar / Accordion Toggle for past matches
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Player of the Match modal & settings state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [lastMatchStatus, setLastMatchStatus] = useState<string>('setup');

  // Innings break timer states
  const [inningsBreakTimeLeft, setInningsBreakTimeLeft] = useState<number>(300); // 5 min
  const [isInningsBreakTimerRunning, setIsInningsBreakTimerRunning] = useState<boolean>(true);

  // Audio specific toggles
  const [soundWicketEnabled, setSoundWicketEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gully_score_sound_wicket');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [soundBoundaryEnabled, setSoundBoundaryEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gully_score_sound_boundary');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [soundClickEnabled, setSoundClickEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gully_score_sound_click');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });
  const [showAudioSettingsDropdown, setShowAudioSettingsDropdown] = useState<boolean>(false);

  // Completed restorable matches filters
  const [restorableSearchQuery, setRestorableSearchQuery] = useState('');
  const [restorableStartDate, setRestorableStartDate] = useState('');
  const [restorableEndDate, setRestorableEndDate] = useState('');

  // Past Matches states
  interface PastMatchItem {
    id: string;
    title: string;
    date: string;
    isHidden: boolean;
  }
  const [pastMatches, setPastMatches] = useState<PastMatchItem[]>([]);
  const [showHiddenPast, setShowHiddenPast] = useState(false);
  const [pastSearchQuery, setPastSearchQuery] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'custom' | 'restorable' | 'drafts' | 'live' | 'stats'>('custom');
  const [expandedKeyMomentsId, setExpandedKeyMomentsId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<MatchState[]>([]);
  const [activeLiveMatches, setActiveLiveMatches] = useState<MatchState[]>([]);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [livePreviewTab, setLivePreviewTab] = useState<'spectator' | 'overlay'>('spectator');
  const [showBroadcastCenter, setShowBroadcastCenter] = useState(false);

  // Inline confirmation states to replace window.confirm inside sandboxed iframe
  const [activeLiveMatchDeleteConfirmId, setActiveLiveMatchDeleteConfirmId] = useState<string | null>(null);
  const [draftMatchDeleteConfirmId, setDraftMatchDeleteConfirmId] = useState<string | null>(null);
  const [completedRecordDeleteConfirmId, setCompletedRecordDeleteConfirmId] = useState<string | null>(null);
  const [resetMatchConfirm, setResetMatchConfirm] = useState(false);
  const [declareInningsConfirm, setDeclareInningsConfirm] = useState(false);
  const [discardSavedSessionConfirm, setDiscardSavedSessionConfirm] = useState(false);
  const [teamDeleteConfirmId, setTeamDeleteConfirmId] = useState<string | null>(null);

  // Commentary editing inline states
  const [editingCommentaryIndex, setEditingCommentaryIndex] = useState<number | null>(null);
  const [editingCommentaryText, setEditingCommentaryText] = useState('');

  // Modal / Input states
  const [showAddPastModal, setShowAddPastModal] = useState(false);
  const [showEditPastModal, setShowEditPastModal] = useState(false);
  const [editingPastId, setEditingPastId] = useState<string | null>(null);
  const [pastTitleInput, setPastTitleInput] = useState('');
  const [pastDateInput, setPastDateInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load Past Matches from localStorage with seed data
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cricket_custom_past_matches');
      if (saved) {
        setPastMatches(JSON.parse(saved));
      } else {
        const initial: PastMatchItem[] = [
          { id: 'custom-1', title: 'Adelaide Strikers vs Sydney Sixers', date: '2026-05-12', isHidden: false },
          { id: 'custom-2', title: 'Melbourne Stars vs Brisbane Heat', date: '2026-05-08', isHidden: false },
          { id: 'custom-3', title: 'Hobart Hurricanes vs Perth Scorchers', date: '2026-05-01', isHidden: true }
        ];
        setPastMatches(initial);
        localStorage.setItem('cricket_custom_past_matches', JSON.stringify(initial));
      }
    } catch (e) {
      console.error('Error loading custom past matches:', e);
    }
  }, []);

  const saveCustomPastMatches = (list: PastMatchItem[]) => {
    setPastMatches(list);
    localStorage.setItem('cricket_custom_past_matches', JSON.stringify(list));
  };

  const handleAddCustomMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastTitleInput.trim() || !pastDateInput) {
      showNotification('Please provide both match title and date.', 'alert');
      return;
    }
    const newItem: PastMatchItem = {
      id: 'custom-' + Date.now(),
      title: pastTitleInput.trim(),
      date: pastDateInput,
      isHidden: false
    };
    const updated = [...pastMatches, newItem];
    saveCustomPastMatches(updated);
    setPastTitleInput('');
    setPastDateInput('');
    setShowAddPastModal(false);
    showNotification(`Match: "${newItem.title}" added successfully!`, 'success');
  };

  const handleSaveEditCustomMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPastId) return;
    if (!pastTitleInput.trim() || !pastDateInput) {
      showNotification('Please provide both match title and date.', 'alert');
      return;
    }
    const updated = pastMatches.map(m => 
      m.id === editingPastId ? { ...m, title: pastTitleInput.trim(), date: pastDateInput } : m
    );
    saveCustomPastMatches(updated);
    setEditingPastId(null);
    setPastTitleInput('');
    setPastDateInput('');
    setShowEditPastModal(false);
    showNotification('Match details updated successfully!', 'success');
  };

  const handleStartEditPastMatch = (past: PastMatchItem) => {
    setEditingPastId(past.id);
    setPastTitleInput(past.title);
    setPastDateInput(past.date);
    setShowEditPastModal(true);
  };

  const handleToggleHideCustomMatch = (id: string) => {
    const updated = pastMatches.map(m => 
      m.id === id ? { ...m, isHidden: !m.isHidden } : m
    );
    saveCustomPastMatches(updated);
    const target = updated.find(m => m.id === id);
    if (target) {
      showNotification(`Match is now ${target.isHidden ? 'Hidden' : 'Visible'}`, 'success');
    }
  };

  const handleDeleteCustomMatch = (id: string) => {
    deleteLocalMatch(id);
    const updated = pastMatches.filter(m => m.id !== id);
    saveCustomPastMatches(updated);
    setDeleteConfirmId(null);
    showNotification('Past match deleted permanently.', 'success');
  };

  // Active Match Setup Inputs
  const [teamA, setTeamA] = useState('Super Kings');
  const [teamALogoUrl, setTeamALogoUrl] = useState('');
  const [teamB, setTeamB] = useState('Mumbai Challengers');
  const [teamBLogoUrl, setTeamBLogoUrl] = useState('');
  const [oversLimit, setOversLimit] = useState(5);
  const [tossWinner, setTossWinner] = useState('Team A');
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [seriesName, setSeriesName] = useState('Bilateral Series');
  const [groundName, setGroundName] = useState('Gully Ground');
  const [tournamentName, setTournamentName] = useState('Bilateral Cup');

  // GullyScore: Cricket Digital Toss Simulator Integration State
  const [connectedTossInfo, setConnectedTossInfo] = useState<{
    tossWinner: string;
    tossChoice: 'bat' | 'bowl';
    teamA: string;
    teamB: string;
    overs?: number;
    venue?: string;
  } | null>(null);

  const [latestStoredToss, setLatestStoredToss] = useState<{
    teamA: string;
    teamB: string;
    teamACaptain?: string;
    teamBCaptain?: string;
    overs?: number;
    venue?: string;
    tossWinner: string;
    tossChoice: 'bat' | 'bowl';
    coinResult?: string;
    timestamp?: string;
    id?: string;
  } | null>(null);

  // Read latest stored digital toss on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gully_last_toss_data');
      if (saved) {
        setLatestStoredToss(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // Unified Match State
  const [match, setMatch] = useState<MatchState>({
    id: '',
    teamA: '',
    teamB: '',
    oversLimit: 5,
    tossWinner: '',
    tossChoice: 'bat',
    currentInningsNum: 1,
    innings1: null,
    innings2: null,
    status: 'setup',
    date: '',
    freeHitNext: false,
    teamALogo: '',
    teamBLogo: '',
    playerPhotos: {}
  });

  // Memoized top statistics calculations
  const topBatsmanOfTheMatch = useMemo(() => {
    let topBat: { name: string; runs: number; balls: number } | null = null;
    const checkInnings = (inn: MatchState['innings1']) => {
      if (!inn || !inn.batsmen) return;
      inn.batsmen.forEach(b => {
        if (!topBat || b.runs > topBat.runs) {
          topBat = { name: b.name, runs: b.runs, balls: b.balls };
        }
      });
    };
    checkInnings(match.innings1);
    checkInnings(match.innings2);
    return topBat;
  }, [match.innings1, match.innings2]);

  const mostEconomicalBowlerOfTheMatch = useMemo(() => {
    let bestBowl: { name: string; econ: number; wickets: number; runs: number; balls: number } | null = null;
    const checkInnings = (inn: MatchState['innings1']) => {
      if (!inn || !inn.bowlers) return;
      inn.bowlers.forEach(b => {
        const totalBalls = b.ballsBowled;
        if (totalBalls >= 6) { // Minimum 1 over bowled
          const oversNum = totalBalls / 6;
          const econ = b.runsConceded / oversNum;
          if (!bestBowl || econ < bestBowl.econ) {
            bestBowl = { name: b.name, econ: parseFloat(econ.toFixed(2)), wickets: b.wickets, runs: b.runsConceded, balls: totalBalls };
          }
        }
      });
    };
    checkInnings(match.innings1);
    checkInnings(match.innings2);
    return bestBowl;
  }, [match.innings1, match.innings2]);

  // Undo State Stack
  const [undoStack, setUndoStack] = useState<string[]>([]);

  // Innings locking, mobile responsive tabs, and scorecard switches
  const [isInningsLocked, setIsInningsLocked] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'scorer' | 'stats' | 'feed'>('scorer');
  const [activeScorecardTab, setActiveScorecardTab] = useState<'bat' | 'bowl'>('bat');

  // Simple commentary dialog text
  const [commentaryInput, setCommentaryInput] = useState('');

  // Editing names indicators
  const [editStrikerIndex, setEditStrikerIndex] = useState<number | null>(null);
  const [editNonStrikerIndex, setEditNonStrikerIndex] = useState<number | null>(null);
  const [editBowlerIndex, setEditBowlerIndex] = useState<number | null>(null);

  // Error/Success state feedback
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'alert' | 'info' } | null>(null);

  // Modal Wicket properties
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW'>('Bowled');
  const [outBatsmanWho, setOutBatsmanWho] = useState<'striker' | 'non-striker'>('striker');
  const [newBatsmanName, setNewBatsmanName] = useState('');
  const [wicketHowOutDetails, setWicketHowOutDetails] = useState('Bowled');
  const [wicketBowlerName, setWicketBowlerName] = useState('');
  const [wicketFielderName, setWicketFielderName] = useState('');
  const [wicketAdditionalDetails, setWicketAdditionalDetails] = useState('');
  const [wicketValidationErr, setWicketValidationErr] = useState('');

  // Extra Runs modal states
  const [showExtraRunsModal, setShowExtraRunsModal] = useState(false);
  const [extraRunsBallType, setExtraRunsBallType] = useState<'wide' | 'noball' | null>(null);
  const [bowlerSelectedForOver, setBowlerSelectedForOver] = useState<number>(-1);

  // Audio simulation trigger
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('gully_score_sound');
      return saved !== null ? saved === 'true' : true;
    } catch (e) {
      return true;
    }
  });

  // AI Commentary configuration states
  const [aiCommentaryEnabled, setAiCommentaryEnabled] = useState(true);
  const [isAiCommentaryLoading, setIsAiCommentaryLoading] = useState(false);

  // Overlay graphics control panel states
  const [activeControlTab, setActiveControlTab] = useState<'alerts' | 'graphics' | 'sequencer' | 'templates' | 'media'>('alerts');
  const [lowerThirdMode, setLowerThirdMode] = useState<'intro' | 'equation' | 'umpires'>('intro');
  const [selectedUmpireSignal, setSelectedUmpireSignal] = useState<'out' | 'noball' | 'freehit' | 'deadball' | 'wide'>('out');
  const [customMilestone, setCustomMilestone] = useState<{ name: string; type: 'fifty' | 'hundred' | '5wkt'; value: number } | null>(null);

  // Sequencer & Broadcast states
  const [graphicsQueue, setGraphicsQueue] = useState<string[]>(['score_bug', 'batsman_stats', 'partnership']);
  const [sequenceDuration, setSequenceDuration] = useState<number>(5);
  const [isSequencePlaying, setIsSequencePlaying] = useState<boolean>(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(-1);
  const [streamKey, setStreamKey] = useState<string>(() => {
    try {
      return localStorage.getItem('cricket_stream_key') || 'live_cr_obs_9fb54495';
    } catch (e) {
      return 'live_cr_obs_9fb54495';
    }
  });
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastStartTime, setBroadcastStartTime] = useState<number | null>(null);
  const [lastOverlayPing, setLastOverlayPing] = useState<number>(Date.now());
  const [streamStats, setStreamStats] = useState({ bandwidth: 4420, packetsLost: 0, fps: 60 });
  const [broadcastTimeStr, setBroadcastTimeStr] = useState<string>('00:00:00');
  const graphicDismissTimerRef = useRef<any>(null);

  // State for active full-screen custom graphics overlay animation
  const [activeAnimation, setActiveAnimation] = useState<'six' | 'four' | 'wicket' | null>(null);

  // Global keyboard listeners for "6", "4", "W" or "w" keys
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const scoringDisabled = isInningsLocked || match.status === 'completed';
      if (scoringDisabled) return;

      const target = e.target as HTMLElement;
      if (
        target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.getAttribute('contenteditable') === 'true'
        )
      ) {
        return;
      }

      if (e.key === '6') {
        e.preventDefault();
        setActiveAnimation('six');
        handleScoreEvent({ type: 'runs', val: 6 });
      } else if (e.key === '4') {
        e.preventDefault();
        setActiveAnimation('four');
        handleScoreEvent({ type: 'runs', val: 4 });
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setActiveAnimation('wicket');
        // Trigger Wicket selection modal just like clicking dismissal button
        setOutBatsmanWho('striker');
        const curInnings = match.currentInningsNum === 1 ? match.innings1 : match.innings2;
        if (curInnings) {
          const activeBowlerName = curInnings.bowlers[curInnings.currentBowlerIndex]?.name || '';
          setWicketBowlerName(activeBowlerName);
          setWicketHowOutDetails('Bowled');
          setWicketType('Bowled');
          setWicketFielderName('');
          setWicketAdditionalDetails('');
          setNewBatsmanName('');
          setWicketValidationErr('');
        }
        setShowWicketModal(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isInningsLocked, match]);

  // Quick Wicket Replay summary buffering state
  const [pendingWicketReplay, setPendingWicketReplay] = useState<{
    batsmanName: string;
    bowlerName: string;
    wicketType: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW';
    howOutDetails: string;
    incomingBatsmanName: string;
    who: 'striker' | 'non-striker';
    fielderName?: string;
  } | null>(null);

  const [fallOfWicketModal, setFallOfWicketModal] = useState<{
    batsmanName: string;
    bowlerName: string;
    wicketType: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW';
    howOutDetails: string;
    incomingBatsmanName: string;
    who: 'striker' | 'non-striker';
    fielderName?: string;
  } | null>(null);

  // Edit Live Match properties
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [showDlsCalculator, setShowDlsCalculator] = useState(false);
  const [showSpinCoinModal, setShowSpinCoinModal] = useState(false);
  const [editModalTeamA, setEditModalTeamA] = useState('');
  const [editModalTeamB, setEditModalTeamB] = useState('');
  const [editModalOversLimit, setEditModalOversLimit] = useState(5);
  const [editModalRuns, setEditModalRuns] = useState(0);
  const [editModalWickets, setEditModalWickets] = useState(0);
  const [editModalBallsBowled, setEditModalBallsBowled] = useState(0);

  const handleApplyDlsTarget = (revisedTarget: number, revisedOvers: number) => {
    setMatch(prev => {
      const updated = {
        ...prev,
        oversLimit: revisedOvers,
        targetToWin: revisedTarget,
      };
      
      const inn = updated.innings2 || updated.innings1;
      if (inn) {
        inn.commentaryList = [
          {
            id: `comm-dls-${Date.now()}`,
            overBall: formatOvers(inn.ballsBowled),
            description: `🌧️ DLS METHOD APPLIED: Target revised to ${revisedTarget} runs in ${revisedOvers} overs due to weather interruption.`,
            type: 'milestone'
          },
          ...(inn.commentaryList || [])
        ];
      }
      
      syncMatch(updated);
      showNotification(`Applied DLS Revised Target of ${revisedTarget} runs within ${revisedOvers} overs!`, 'success');
      return updated;
    });
  };

  const handleSaveEditedMatch = () => {
    if (!editModalTeamA.trim() || !editModalTeamB.trim()) {
      showNotification('Team names cannot be empty.', 'alert');
      return;
    }
    const oldTeamA = match.teamA;
    const oldTeamB = match.teamB;
    const newTeamA = editModalTeamA.trim();
    const newTeamB = editModalTeamB.trim();
    const newOversLimit = Number(editModalOversLimit);

    let updatedTossWinner = match.tossWinner;
    if (match.tossWinner === oldTeamA) {
      updatedTossWinner = newTeamA;
    } else if (match.tossWinner === oldTeamB) {
      updatedTossWinner = newTeamB;
    }

    let updatedWinner = match.winner;
    if (match.winner === oldTeamA) {
      updatedWinner = newTeamA;
    } else if (match.winner === oldTeamB) {
      updatedWinner = newTeamB;
    }

    let updated = { 
      ...match,
      teamA: newTeamA,
      teamB: newTeamB,
      oversLimit: newOversLimit,
      tossWinner: updatedTossWinner,
      winner: updatedWinner
    };

    if (updated.innings1) {
      if (updated.innings1.battingTeam === oldTeamA) {
        updated.innings1.battingTeam = newTeamA;
      } else if (updated.innings1.battingTeam === oldTeamB) {
        updated.innings1.battingTeam = newTeamB;
      }
      if (updated.innings1.bowlingTeam === oldTeamA) {
        updated.innings1.bowlingTeam = newTeamA;
      } else if (updated.innings1.bowlingTeam === oldTeamB) {
        updated.innings1.bowlingTeam = newTeamB;
      }
    }

    if (updated.innings2) {
      if (updated.innings2.battingTeam === oldTeamA) {
        updated.innings2.battingTeam = newTeamA;
      } else if (updated.innings2.battingTeam === oldTeamB) {
        updated.innings2.battingTeam = newTeamB;
      }
      if (updated.innings2.bowlingTeam === oldTeamA) {
        updated.innings2.bowlingTeam = newTeamA;
      } else if (updated.innings2.bowlingTeam === oldTeamB) {
        updated.innings2.bowlingTeam = newTeamB;
      }
    }

    // Apply direct score, wicket, and delivery count overrides
    if (updated.currentInningsNum === 1 && updated.innings1) {
      updated.innings1.runs = Number(editModalRuns);
      updated.innings1.wickets = Number(editModalWickets);
      updated.innings1.ballsBowled = Number(editModalBallsBowled);
    } else if (updated.currentInningsNum === 2 && updated.innings2) {
      updated.innings2.runs = Number(editModalRuns);
      updated.innings2.wickets = Number(editModalWickets);
      updated.innings2.ballsBowled = Number(editModalBallsBowled);
    }

    // Keep parent configuration values in sync as well
    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setOversLimit(newOversLimit);

    syncMatch(updated);
    setShowEditMatchModal(false);
    showNotification('Match details successfully updated!', 'success');
  };

  // Sync isInningsLocked when current innings changes
  useEffect(() => {
    setIsInningsLocked(false);
  }, [match.currentInningsNum]);

  // Sync completed match congrats modal
  useEffect(() => {
    if (match.status === 'completed' && lastMatchStatus !== 'completed') {
      setShowCompletionModal(true);
    }
    setLastMatchStatus(match.status);
  }, [match.status, lastMatchStatus]);

  // Persist fine-grained audio options
  useEffect(() => {
    try {
      localStorage.setItem('gully_score_sound_wicket', String(soundWicketEnabled));
    } catch (e) {
      console.warn('Failed to update gully_score_sound_wicket:', e);
    }
  }, [soundWicketEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('gully_score_sound_boundary', String(soundBoundaryEnabled));
    } catch (e) {
      console.warn('Failed to update gully_score_sound_boundary:', e);
    }
  }, [soundBoundaryEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('gully_score_sound_click', String(soundClickEnabled));
    } catch (e) {
      console.warn('Failed to update gully_score_sound_click:', e);
    }
  }, [soundClickEnabled]);

  // Innings break timer countdown
  useEffect(() => {
    let intervalId: any = null;
    if (isInningsBreakTimerRunning && match.status === 'live' && match.currentInningsNum === 2 && match.innings2 && match.innings2.ballsBowled === 0) {
      intervalId = setInterval(() => {
        setInningsBreakTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            setIsInningsBreakTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isInningsBreakTimerRunning, match.status, match.currentInningsNum, match.innings2?.ballsBowled]);

  // Reset timer on Innings 2 start
  useEffect(() => {
    if (match.currentInningsNum === 2 && match.innings2 && match.innings2.ballsBowled === 0) {
      setInningsBreakTimeLeft(300); // Reset to 5 minutes
      setIsInningsBreakTimerRunning(true);
    }
  }, [match.currentInningsNum]);

  // Automatic retry of offline changes when connection is restored
  useEffect(() => {
    const retryOfflineSaves = async () => {
      if (isFirestoreQuotaExhausted()) {
        console.log('[Offline Retry] Cloud write quota currently reached. Local scores are preserved safely.');
        setSaveStatus('saved');
        return;
      }

      let pending = null;
      try {
        pending = localStorage.getItem('cricket_matches_offline_pending');
      } catch (e) {
        console.warn('Blocked reading pending offline saves:', e);
      }
      if (pending) {
        try {
          const toSave = JSON.parse(pending) as MatchState;
          if (toSave && toSave.id) {
            if (isMatchDeleted(toSave.id) || toSave.status === 'deleted' || (toSave as any).isDeleted) {
              try {
                localStorage.removeItem('cricket_matches_offline_pending');
              } catch (e) {}
              return;
            }
            console.log('[Offline Retry] Restoring and uploading offline data to Firestore...');
            setSaveStatus('saving');
            await safeSetDoc(doc(db, 'cricket_matches', toSave.id), sanitizeForFirestore(toSave));
            setSaveStatus('saved');
            try {
              localStorage.removeItem('cricket_matches_offline_pending');
            } catch (e) {}
            showNotification('Offline score updates successfully synchronized to the server!', 'success');
          }
        } catch (err) {
          if (isQuotaError(err)) {
            recordFirestoreQuotaExhaustion(60);
            console.warn('[Offline Retry] Daily cloud write quota reached. Local match scores are preserved safely.');
            setSaveStatus('saved');
            try {
              localStorage.removeItem('cricket_matches_offline_pending');
            } catch (e) {}
          } else {
            console.error('[Offline Retry] Failed to sync offline data:', err);
            setSaveStatus('error');
          }
        }
      }
    };

    window.addEventListener('online', retryOfflineSaves);
    
    // Also run immediately on mount in case we are already online
    if (navigator.onLine) {
      retryOfflineSaves();
    }

    return () => {
      window.removeEventListener('online', retryOfflineSaves);
    };
  }, []);

  const queueDebouncedSave = (updatedState: MatchState, immediate: boolean = false) => {
    latestStateToSaveRef.current = updatedState;
    setSaveStatus('saving');

    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
    }

    const executeSave = async () => {
      const stateToSave = latestStateToSaveRef.current;
      if (!stateToSave || !stateToSave.id || isMatchDeleted(stateToSave.id) || stateToSave.status === 'deleted' || (stateToSave as any).isDeleted) {
        setSaveStatus(null);
        return;
      }

      // When daily cloud write quota is exhausted, seamlessly preserve locally
      if (isFirestoreQuotaExhausted()) {
        setSaveStatus('saved');
        try {
          localStorage.setItem('cricket_active_match', JSON.stringify(stateToSave));
          localStorage.removeItem('cricket_matches_offline_pending');
        } catch (e) {}
        return;
      }

      try {
        const matchDocRef = doc(db, 'cricket_matches', stateToSave.id);

        // Sanitize object to eliminate any undefined values before Firestore persistence
        const sanitized = sanitizeForFirestore(stateToSave);
        await safeSetDoc(matchDocRef, sanitized);

        // Push real-time updates to Firebase Realtime Database for cross-device synchronization
        syncScoreToRealtimeDB(stateToSave.id, sanitized).catch((err) => {
          console.warn('[RTDB Dual-Sync Note]:', err);
        });

        setSaveStatus('saved');
        try {
          localStorage.removeItem('cricket_matches_offline_pending');
        } catch (e) {}

        // Keep tournament scores synchronized in real-time
        if (stateToSave.tournamentId && stateToSave.tournamentMatchId) {
          await syncLiveScoreToTournament(stateToSave.tournamentId, stateToSave.tournamentMatchId, stateToSave);
        }
      } catch (err) {
        if (isQuotaError(err)) {
          recordFirestoreQuotaExhaustion(2);
          console.warn('[Autosave] Daily cloud write quota reached. Local autosave active.');
          setSaveStatus('saved');
          try {
            localStorage.setItem('cricket_active_match', JSON.stringify(stateToSave));
            localStorage.removeItem('cricket_matches_offline_pending');
          } catch (e) {}
        } else {
          console.error('[Autosave] Failed to write to server:', err);
          // Fallback to localStorage and recover saveStatus
          try {
            localStorage.setItem('cricket_matches_offline_pending', JSON.stringify(stateToSave));
            localStorage.setItem('cricket_active_match', JSON.stringify(stateToSave));
          } catch (e) {}
          setSaveStatus('saved');
        }
      }
    };

    if (immediate) {
      executeSave();
    } else {
      savingTimeoutRef.current = setTimeout(executeSave, 150);
    }
  };

  // Immediate manual retry/sync function
  const retrySaveNow = async () => {
    const stateToSave = latestStateToSaveRef.current || match;
    if (!stateToSave || !stateToSave.id) {
      setSaveStatus(null);
      return;
    }
    setSaveStatus('saving');
    try {
      const matchDocRef = doc(db, 'cricket_matches', stateToSave.id);
      await safeSetDoc(matchDocRef, sanitizeForFirestore(stateToSave));
      setSaveStatus('saved');
      try {
        localStorage.removeItem('cricket_matches_offline_pending');
      } catch (e) {}
      if (stateToSave.tournamentId && stateToSave.tournamentMatchId) {
        await syncLiveScoreToTournament(stateToSave.tournamentId, stateToSave.tournamentMatchId, stateToSave);
      }
    } catch (err) {
      console.error('[Autosave] Retry failed:', err);
      setSaveStatus('saved');
    }
  };

  // Synchronize both local React state and Firestore database
  const syncMatch = (nextState: MatchState | ((prev: MatchState) => MatchState), immediate: boolean = true) => {
    setMatch((prev) => {
      const current = typeof nextState === 'function' ? nextState(prev) : nextState;
      const updated: MatchState = {
        ...current,
        version: (current.version || 0) + 1,
        updatedAt: Date.now()
      };

      if (updated.id && !isSpectator) {
        // Instant synchronous backup to localStorage & local registry for instant persistence
        try {
          localStorage.setItem('cricket_active_match', JSON.stringify(updated));
          // Import/use saveMatchToRegistry to ensure local registry & live query stay immediately up to date
          const raw = localStorage.getItem('cricket_matches_local_registry');
          const currentList = raw ? JSON.parse(raw) : [];
          if (Array.isArray(currentList)) {
            const idx = currentList.findIndex((m: any) => m && m.id === updated.id);
            if (idx >= 0) {
              currentList[idx] = updated;
            } else {
              currentList.unshift(updated);
            }
            localStorage.setItem('cricket_matches_local_registry', JSON.stringify(currentList.slice(0, 50)));
          }
        } catch (e) {
          console.warn('Writing local match cache failed:', e);
        }

        // Broadcast to same-origin windows/tabs/frames immediately
        try {
          window.dispatchEvent(
            new CustomEvent('cricket_match_updated', {
              detail: { match: updated, eventType: 'update', timestamp: Date.now() }
            })
          );
        } catch (_) {}

        // Persist the updated match scores directly to Firestore so all connected devices update in real-time
        queueDebouncedSave(updated, immediate);
      }
      return updated;
    });
  };

  // Load autosaved active match state from LocalStorage on mount
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem('cricket_active_match');
    } catch (e) {
      console.warn('Blocked reading cricket_active_match from localStorage:', e);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MatchState;
        if (parsed && parsed.status === 'live' && parsed.id && !isMatchDeleted(parsed.id)) {
          setLocalAutosavedMatch(parsed);
        } else if (parsed && parsed.id && isMatchDeleted(parsed.id)) {
          try {
            localStorage.removeItem('cricket_active_match');
          } catch (e) {}
        }
      } catch (err) {
        console.error('Failed to load active match from LocalStorage:', err);
      }
    }
  }, []);

  // Debounced localStorage autosave mechanism: persists match state every 3 balls to prevent data loss on refresh
  useEffect(() => {
    if (!match || match.status !== 'live' || isSpectator) return;
    const currentInnings = (match.currentInningsNum === 1) ? match.innings1 : match.innings2;
    if (!currentInnings) return;

    const ballsBowled = currentInnings.ballsBowled;
    if (ballsBowled > 0 && ballsBowled % 3 === 0) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('cricket_active_match', JSON.stringify(match));
          console.log(`[Autosave] Saved match state to localStorage at ${ballsBowled} balls.`);
        } catch (e) {
          console.error('[Autosave] Error saving match to localStorage:', e);
        }
      }, 300); // 300ms debounce
      return () => clearTimeout(timeoutId);
    }
  }, [match, isSpectator]);

  // Real-time broadcast channel & postMessage transmitter to iframe
  useEffect(() => {
    if (!match) return;
    
    // BroadcastChannel sync
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cricket_match_sync');
      channel.postMessage({ type: 'MATCH_UPDATE', match });
    } catch (_) {}

    // PostMessage fallback to all embedded preview iframes
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'MATCH_UPDATE', match }, '*');
        }
      });
    } catch (_) {}

    return () => {
      if (channel) {
        try {
          channel.close();
        } catch (_) {}
      }
    };
  }, [match]);

  // Heartbeat ping receiver from iframe to display live status & reply with current state
  useEffect(() => {
    const handlePingMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OVERLAY_PING') {
        setLastOverlayPing(Date.now());
        if (match) {
          try {
            if (event.source) {
              event.source.postMessage({ type: 'MATCH_UPDATE', match }, { targetOrigin: '*' });
            }
          } catch (_) {}
        }
      }
    };
    window.addEventListener('message', handlePingMessage);
    return () => window.removeEventListener('message', handlePingMessage);
  }, [match]);

  // Automated sequence queue player
  useEffect(() => {
    if (!isSequencePlaying || currentQueueIndex < 0 || currentQueueIndex >= graphicsQueue.length) {
      if (isSequencePlaying) {
        setIsSequencePlaying(false);
        setCurrentQueueIndex(-1);
        // Clear back to none on complete
        if (match && match.overlayConfig) {
          // Use callback update to get freshest state
          syncMatch((prev) => ({
            ...prev,
            overlayConfig: {
              ...(prev.overlayConfig || {}),
              activeGraphic: 'none'
            } as any
          }));
        }
        showNotification('Graphics sequence finished successfully.', 'success');
      }
      return;
    }

    const currentGraphicId = graphicsQueue[currentQueueIndex];
    if (match && match.overlayConfig) {
      if (currentGraphicId === 'score_bug') {
        syncMatch((prev) => ({
          ...prev,
          overlayConfig: {
            ...(prev.overlayConfig || {}),
            showScoreBug: true,
            activeGraphic: 'none'
          } as any
        }));
      } else {
        syncMatch((prev) => ({
          ...prev,
          overlayConfig: {
            ...(prev.overlayConfig || {}),
            showScoreBug: currentGraphicId === 'lower_third' ? (prev.overlayConfig?.showScoreBug !== false) : true,
            activeGraphic: currentGraphicId
          } as any
        }));
      }
    }

    const stepTimer = setTimeout(() => {
      setCurrentQueueIndex((prev) => prev + 1);
    }, sequenceDuration * 1000);

    return () => clearTimeout(stepTimer);
  }, [isSequencePlaying, currentQueueIndex, graphicsQueue, sequenceDuration]);

  // Broadcasting simulated statistics effect
  useEffect(() => {
    if (!isBroadcasting) {
      setBroadcastTimeStr('00:00:00');
      return;
    }
    const interval = setInterval(() => {
      setStreamStats({
        bandwidth: Math.floor(4300 + Math.random() * 300),
        packetsLost: Math.random() < 0.05 ? Math.floor(Math.random() * 3) : 0,
        fps: Math.random() < 0.02 ? 59 : 60
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isBroadcasting]);

  // Broadcasting duration ticker effect
  useEffect(() => {
    if (!isBroadcasting || !broadcastStartTime) {
      setBroadcastTimeStr('00:00:00');
      return;
    }
    const timer = setInterval(() => {
      const diffSecs = Math.floor((Date.now() - broadcastStartTime) / 1000);
      const hrs = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
      const mins = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
      const secs = (diffSecs % 60).toString().padStart(2, '0');
      setBroadcastTimeStr(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isBroadcasting, broadcastStartTime]);

  // Keep bowlerSelectedForOver in sync with ballsBowled
  useEffect(() => {
    const currentInnings = match.currentInningsNum === 1 ? match.innings1 : match.innings2;
    if (currentInnings) {
      const currentOverIdx = Math.floor(currentInnings.ballsBowled / 6);
      if (currentInnings.ballsBowled % 6 !== 0) {
        setBowlerSelectedForOver(currentOverIdx);
      }
    }
  }, [match?.innings1?.ballsBowled, match?.innings2?.ballsBowled, match?.currentInningsNum]);

  // Sync saved teams from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_teams'), (snap) => {
      const teams: CricketTeam[] = [];
      snap.forEach((docSnap) => {
        teams.push(docSnap.data() as CricketTeam);
      });
      setSavedTeams(teams);
    }, (error) => {
      console.warn("Failed to subscribe to cricket_teams:", error);
      try {
        handleFirestoreError(error, OperationType.GET, 'cricket_teams');
      } catch (e) {
        // Fallback gracefully to prevent unhandled asynchronous crash
      }
    });
    return () => unsub();
  }, []);

  // Sync complete matches list (history) from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_matches'), (snap) => {
      const historyList: MatchState[] = [];
      const draftList: MatchState[] = [];
      const liveList: MatchState[] = [];
      const remoteIds = new Set<string>();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const m = { ...data, id: data.id || docSnap.id } as MatchState;
        
        // Permanently filter out matches that were deleted
        if (isMatchDeleted(m.id) || (m as any).isDeleted === true || m.status === 'deleted') {
          markMatchDeleted(m.id);
          return;
        }

        remoteIds.add(m.id);

        if (m.status === 'completed') {
          historyList.push(m);
        } else if (m.status === 'draft') {
          draftList.push(m);
        } else if (m.status === 'live') {
          liveList.push(m);
        }
      });

      // Prune any deleted matches from local storage on this management device
      pruneDeletedMatchesFromStorage(remoteIds);

      // If the match currently loaded in the scoreboard was not found in remoteIds
      if (matchIdParam && !remoteIds.has(matchIdParam)) {
        if (isMatchDeleted(matchIdParam)) {
          setMatch({
            id: '',
            teamA: '',
            teamB: '',
            oversLimit: 5,
            tossWinner: '',
            tossChoice: 'bat',
            currentInningsNum: 1,
            innings1: null,
            innings2: null,
            status: 'setup',
            date: '',
            freeHitNext: false
          });
          setSearchParams({});
        } else {
          const localMatch = latestStateToSaveRef.current || getLocalMatchById(matchIdParam);
          const isFresh = localMatch && (Date.now() - (localMatch.updatedAt || 0) < 10000);
          if (localMatch && !isSpectator && isFresh) {
            setMatch((prev) => (prev.id === matchIdParam ? prev : localMatch));
          } else {
            deleteLocalMatch(matchIdParam);
            setMatch({
              id: '',
              teamA: '',
              teamB: '',
              oversLimit: 5,
              tossWinner: '',
              tossChoice: 'bat',
              currentInningsNum: 1,
              innings1: null,
              innings2: null,
              status: 'setup',
              date: '',
              freeHitNext: false
            });
            setSearchParams({});
          }
        }
      }

      // Merge any local drafts from local registry
      try {
        const rawLocal = localStorage.getItem('cricket_matches_local_registry');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            parsed.forEach((lm: any) => {
              if (lm && lm.status === 'draft' && !isMatchDeleted(lm.id)) {
                if (!draftList.some(d => d.id === lm.id)) {
                  draftList.push(lm);
                }
              }
            });
          }
        }
      } catch (_) {}

      // Sort matches by latest updatedAt / date descending
      const getMatchTime = (m: MatchState) => m.updatedAt || (m.date ? new Date(m.date).getTime() : 0) || 0;
      historyList.sort((a, b) => getMatchTime(b) - getMatchTime(a));
      draftList.sort((a, b) => getMatchTime(b) - getMatchTime(a));
      liveList.sort((a, b) => getMatchTime(b) - getMatchTime(a));
      setMatchHistory(historyList);
      setSavedDrafts(draftList);
      setActiveLiveMatches(liveList);
    }, (error) => {
      console.warn("Failed to subscribe to cricket_matches:", error);
      try {
        handleFirestoreError(error, OperationType.GET, 'cricket_matches');
      } catch (e) {
        // Fallback gracefully to prevent unhandled asynchronous crash
      }
    });

    const handleMatchDeletedEvent = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        setActiveLiveMatches(prev => prev.filter(m => m.id !== id));
        setMatchHistory(prev => prev.filter(m => m.id !== id));
        setSavedDrafts(prev => prev.filter(m => m.id !== id));
        if (matchIdParam === id || latestStateToSaveRef.current?.id === id) {
          latestStateToSaveRef.current = null;
          setMatch({
            id: '',
            teamA: '',
            teamB: '',
            oversLimit: 5,
            tossWinner: '',
            tossChoice: 'bat',
            currentInningsNum: 1,
            innings1: null,
            innings2: null,
            status: 'setup',
            date: '',
            freeHitNext: false
          });
          setSearchParams({});
        }
      }
    };
    window.addEventListener('cricket_match_deleted', handleMatchDeletedEvent);

    return () => {
      unsub();
      window.removeEventListener('cricket_match_deleted', handleMatchDeletedEvent);
    };
  }, [user, matchIdParam]);

  // Sync approved players list from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_players'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const p = docSnap.data();
        if (p.approvalStatus === 'approved' || p.isVerified) {
          list.push({ ...p, id: docSnap.id || p.id });
        }
      });
      setApprovedPlayers(list);
    }, (error) => {
      console.warn("Failed to subscribe to approved players in scoreboard:", error);
    });
    return () => unsub();
  }, []);

  // Real-time listener for current active match across all connected devices
  useEffect(() => {
    const activeMatchId = matchIdParam || (match && match.id && match.status === 'live' ? match.id : '');

    if (!activeMatchId) {
      // If no active match ID and we are not currently playing a live match, reset to setup
      setMatch((prev) => {
        if (prev && prev.id && prev.status === 'live' && prev.id === latestStateToSaveRef.current?.id) {
          return prev;
        }
        return {
          id: '',
          teamA: '',
          teamB: '',
          oversLimit: 5,
          tossWinner: '',
          tossChoice: 'bat',
          currentInningsNum: 1,
          innings1: null,
          innings2: null,
          status: 'setup',
          date: '',
          freeHitNext: false
        };
      });
      return;
    }

    const unsub = onSnapshot(doc(db, 'cricket_matches', activeMatchId), (docSnap) => {
      if (isMatchDeleted(activeMatchId)) {
        setMatch({
          id: '',
          teamA: '',
          teamB: '',
          oversLimit: 5,
          tossWinner: '',
          tossChoice: 'bat',
          currentInningsNum: 1,
          innings1: null,
          innings2: null,
          status: 'setup',
          date: '',
          freeHitNext: false
        });
        if (searchParams.get('matchId') === activeMatchId) {
          setSearchParams({});
        }
        return;
      }
      if (docSnap.exists()) {
        const data = docSnap.data() as MatchState;
        const remoteMatch: MatchState = { ...data, id: data.id || docSnap.id };
        if (remoteMatch.status === 'deleted' || (remoteMatch as any).isDeleted) {
          markMatchDeleted(activeMatchId);
          deleteLocalMatch(activeMatchId);
          setMatch({
            id: '',
            teamA: '',
            teamB: '',
            oversLimit: 5,
            tossWinner: '',
            tossChoice: 'bat',
            currentInningsNum: 1,
            innings1: null,
            innings2: null,
            status: 'setup',
            date: '',
            freeHitNext: false
          });
          if (searchParams.get('matchId') === activeMatchId) {
            setSearchParams({});
          }
          return;
        }
        
        // Conflict-resolution and automatic real-time broadcast to all connected devices
        setMatch((prevLocal) => {
          if (prevLocal && prevLocal.id === remoteMatch.id) {
            const localVersion = prevLocal.version || 0;
            const remoteVersion = remoteMatch.version || 0;
            const localTime = prevLocal.updatedAt || 0;
            const remoteTime = remoteMatch.updatedAt || 0;

            // If remote is newer in version or timestamp, accept it immediately
            if (remoteVersion > localVersion || (remoteVersion === localVersion && remoteTime > localTime)) {
              return remoteMatch;
            }
            // If spectator, always reflect the remote authority
            if (isSpectator) {
              return remoteMatch;
            }
            // If currently debouncing or saving and local version is newer, retain local state until write completes
            if (saveStatusRef.current === 'saving' && localVersion > remoteVersion) {
              return prevLocal;
            }
          }
          return remoteMatch;
        });
      } else {
        // Document does not exist in Firestore snapshot, match was deleted
        markMatchDeleted(activeMatchId);
        deleteLocalMatch(activeMatchId);
        setMatch({
          id: '',
          teamA: '',
          teamB: '',
          oversLimit: 5,
          tossWinner: '',
          tossChoice: 'bat',
          currentInningsNum: 1,
          innings1: null,
          innings2: null,
          status: 'setup',
          date: '',
          freeHitNext: false
        });
        if (searchParams.get('matchId') === activeMatchId) {
          setSearchParams({});
        }
      }
    }, (error) => {
      console.warn("Failed to subscribe to current match docs:", error);
      const localMatch = getLocalMatchById(activeMatchId);
      if (localMatch && !isMatchDeleted(localMatch.id) && !(localMatch as any).isDeleted && localMatch.status !== 'deleted') {
        setMatch(localMatch);
      }
    });

    // Also subscribe to Firebase Realtime Database for zero-latency multi-device streaming
    const unsubRtdb = subscribeToRealtimeDBMatch(activeMatchId, (remoteMatch: any) => {
      if (!remoteMatch || isMatchDeleted(activeMatchId)) return;
      setMatch((prevLocal) => {
        if (prevLocal && prevLocal.id === remoteMatch.id) {
          const localVersion = prevLocal.version || 0;
          const remoteVersion = remoteMatch.version || 0;
          const localTime = prevLocal.updatedAt || 0;
          const remoteTime = remoteMatch.updatedAt || 0;
          if (remoteVersion > localVersion || (remoteVersion === localVersion && remoteTime > localTime) || isSpectator) {
            return remoteMatch;
          }
          if (saveStatusRef.current === 'saving' && localVersion > remoteVersion) {
            return prevLocal;
          }
        }
        return remoteMatch;
      });
    });

    return () => {
      unsub();
      unsubRtdb();
    };
  }, [matchIdParam, match.id, isSpectator]);

  // Apply visual theme class to root
  useEffect(() => {
    localStorage.setItem('cricket_theme', darkMode ? 'dark' : 'light');
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist soundEnabled toggle state
  useEffect(() => {
    localStorage.setItem('gully_score_sound', String(soundEnabled));
  }, [soundEnabled]);

  const showNotification = (msg: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setFeedback({ message: msg, type });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  // GullyScore Digital Toss Simulator: Auto-fill setup or Auto-launch live match
  const [tossSyncProcessed, setTossSyncProcessed] = useState(false);

  useEffect(() => {
    if (matchIdParam || tossSyncProcessed) return;

    const paramTeamA = searchParams.get('teamA');
    const paramTeamB = searchParams.get('teamB');
    const paramOvers = searchParams.get('overs');
    const paramTossWinner = searchParams.get('tossWinner');
    const paramTossChoice = searchParams.get('tossChoice') as 'bat' | 'bowl' | null;
    const paramGround = searchParams.get('ground') || searchParams.get('venue');
    const autoStartParam = searchParams.get('autoStart') === 'true';

    if (paramTeamA && paramTeamB) {
      setTeamA(paramTeamA);
      setTeamB(paramTeamB);
      if (paramOvers) setOversLimit(Number(paramOvers));
      if (paramGround) setGroundName(paramGround);

      const winningTeamName = paramTossWinner || paramTeamA;
      setTossWinner(winningTeamName === paramTeamB ? 'Team B' : 'Team A');
      if (paramTossChoice === 'bat' || paramTossChoice === 'bowl') {
        setTossChoice(paramTossChoice);
      }

      setConnectedTossInfo({
        tossWinner: winningTeamName,
        tossChoice: paramTossChoice || 'bat',
        teamA: paramTeamA,
        teamB: paramTeamB,
        overs: paramOvers ? Number(paramOvers) : undefined,
        venue: paramGround || undefined
      });

      setTossSyncProcessed(true);

      if (autoStartParam) {
        const coinTossWinTeam = winningTeamName;
        const coinTossLoseTeam = winningTeamName === paramTeamA ? paramTeamB : paramTeamA;
        const choice = paramTossChoice || 'bat';
        const batFirstTeam = choice === 'bat' ? coinTossWinTeam : coinTossLoseTeam;
        const bowlFirstTeam = choice === 'bat' ? coinTossLoseTeam : coinTossWinTeam;
        const ovLimit = Number(paramOvers) || 5;
        const venueName = paramGround || 'Gully Ground';

        const initialInnings: Innings = {
          battingTeam: batFirstTeam,
          bowlingTeam: bowlFirstTeam,
          runs: 0,
          wickets: 0,
          ballsBowled: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
          batsmen: [
            { name: 'Batter 1 State', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
            { name: 'Batter 2 State', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
          ],
          bowlers: [
            { name: 'Bowler 1 State', ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, isCurrent: true }
          ],
          strikerIndex: 0,
          nonStrikerIndex: 1,
          currentBowlerIndex: 0,
          fallOfWickets: [],
          commentaryList: [
            {
              id: `c-${Date.now()}`,
              overBall: '0.0',
              description: `Match Launched via GullyScore Digital Toss Simulator! ${coinTossWinTeam} won the toss and elected to ${choice} first at ${venueName}.`,
              type: 'normal'
            }
          ],
          history: [
            { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
          ]
        };

        const newMatch: MatchState = {
          id: `match-${Date.now()}`,
          teamA: paramTeamA,
          teamB: paramTeamB,
          oversLimit: ovLimit,
          tossWinner: coinTossWinTeam,
          tossChoice: choice,
          currentInningsNum: 1,
          innings1: initialInnings,
          innings2: null,
          status: 'live',
          date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          freeHitNext: false,
          teamALogo: '',
          teamBLogo: '',
          playerPhotos: {},
          tournamentId: null,
          tournamentMatchId: null,
          tournamentName: 'Gully Match',
          seriesName: 'Bilateral Series',
          groundName: venueName,
          createdBy: user?.email || user?.uid || 'anonymous',
          updatedAt: Date.now(),
          version: 1
        };

        setUndoStack([]);
        unmarkMatchDeleted(newMatch.id);
        saveMatchToRegistry(newMatch);
        setActiveMatch(newMatch);
        latestStateToSaveRef.current = newMatch;
        setMatch(newMatch);
        setSearchParams({ matchId: newMatch.id });
        try {
          localStorage.setItem('cricket_active_match', JSON.stringify(newMatch));
        } catch (e) {}

        if (isFirestoreQuotaExhausted()) {
          showNotification(`Match Launched via Digital Toss: ${batFirstTeam} is batting first! (Local Mode)`, 'success');
          playSoundEffect('four');
        } else {
          safeSetDoc(doc(db, 'cricket_matches', newMatch.id), sanitizeForFirestore(newMatch)).then(() => {
            showNotification(`Match Launched via Digital Toss: ${batFirstTeam} is batting first!`, 'success');
            playSoundEffect('four');
          }).catch(err => {
            if (isQuotaError(err)) {
              recordFirestoreQuotaExhaustion(60);
              showNotification(`Match Launched via Digital Toss: ${batFirstTeam} is batting first! (Local Mode)`, 'success');
              playSoundEffect('four');
            } else {
              console.warn('Could not save to remote Firestore, saved locally:', err);
              showNotification(`Match Launched: ${batFirstTeam} is batting first! (Local Mode)`, 'success');
              playSoundEffect('four');
            }
          });
        }
      } else {
        showNotification(`Digital Toss synchronized: ${winningTeamName} won toss & elected to ${paramTossChoice || 'bat'}!`, 'success');
      }
    }
  }, [matchIdParam, tossSyncProcessed, searchParams, user]);

  const handleApplyStoredToss = (stored: NonNullable<typeof latestStoredToss>) => {
    if (!stored) return;
    setTeamA(stored.teamA);
    setTeamB(stored.teamB);
    if (stored.overs) setOversLimit(stored.overs);
    if (stored.venue) setGroundName(stored.venue);
    setTossWinner(stored.tossWinner === stored.teamB ? 'Team B' : 'Team A');
    setTossChoice(stored.tossChoice || 'bat');
    setConnectedTossInfo({
      tossWinner: stored.tossWinner,
      tossChoice: stored.tossChoice || 'bat',
      teamA: stored.teamA,
      teamB: stored.teamB,
      overs: stored.overs,
      venue: stored.venue
    });
    showNotification(`Imported Digital Toss: ${stored.tossWinner} won toss & elected to ${stored.tossChoice}!`, 'success');
    playSoundEffect('dot');
  };

  // Apply Spin Coin interactive toss result directly to match setup
  const handleApplySpinCoinToss = (result: SpinCoinResult) => {
    setTossWinner(result.winner);
    setTossChoice(result.choice);
    const tossData = {
      teamA: teamA.trim() || 'Team A',
      teamB: teamB.trim() || 'Team B',
      overs: oversLimit,
      venue: groundName,
      tossWinner: result.winnerName,
      tossChoice: result.choice,
      coinResult: result.coinSide.toUpperCase(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: `toss-${Date.now()}`
    };
    try {
      localStorage.setItem('gully_last_toss_data', JSON.stringify(tossData));
    } catch (e) {}
    setLatestStoredToss(tossData);
    setConnectedTossInfo({
      tossWinner: result.winnerName,
      tossChoice: result.choice,
      teamA: teamA.trim() || 'Team A',
      teamB: teamB.trim() || 'Team B',
      overs: oversLimit,
      venue: groundName
    });
    setShowSpinCoinModal(false);
    showNotification(`🪙 Toss decided: ${result.winnerName} won toss (${result.coinSide.toUpperCase()}) & elected to ${result.choice === 'bat' ? 'Bat First 🏏' : 'Bowl First 🥎'}!`, 'success');
    playSoundEffect('dot');
  };

  // Play match audio feedback
  const playSoundEffect = (action: string) => {
    if (!soundEnabled) return;
    if (action === 'four' || action === 'six') {
      if (!soundBoundaryEnabled) return;
    } else if (action === 'wicket') {
      if (!soundWicketEnabled) return;
    } else if (action === 'click' || action === 'dot') {
      if (!soundClickEnabled) return;
    }

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (action === 'four' || action === 'six') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else if (action === 'wicket') {
        osc.frequency.setValueAtTime(250, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } else if (action === 'click' || action === 'dot') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Helper formats balls to overs
  const formatOvers = (balls: number): string => {
    const overs = Math.floor(balls / 6);
    const remBalls = balls % 6;
    return `${overs}.${remBalls}`;
  };

  // Helper calculates run rate
  const calculateRunRate = (runs: number, balls: number): string => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
  };

  // State push for Deep Undo Stack (limited to precisely last 5 states)
  const pushStateToUndoStack = (currentState: MatchState) => {
    setUndoStack(prev => {
      const nextStack = [...prev, JSON.stringify(currentState)];
      if (nextStack.length > 5) {
        return nextStack.slice(nextStack.length - 5);
      }
      return nextStack;
    });
  };

  // Start a fresh Match
  const handleStartMatch = () => {
    if (!teamA.trim() || !teamB.trim()) {
      showNotification('Please fill in both Team names!', 'alert');
      return;
    }
    const coinTossWinTeam = tossWinner === 'Team A' ? teamA : teamB;
    const coinTossLoseTeam = tossWinner === 'Team A' ? teamB : teamA;

    // Determine who bats first
    let batFirstTeam = '';
    let bowlFirstTeam = '';

    if (tossChoice === 'bat') {
      batFirstTeam = coinTossWinTeam;
      bowlFirstTeam = coinTossLoseTeam;
    } else {
      batFirstTeam = coinTossLoseTeam;
      bowlFirstTeam = coinTossWinTeam;
    }

    // Load custom team rosters if they exist
    const batRoster = batFirstTeam === teamA ? selectedTeamARoster : selectedTeamBRoster;
    const bowlRoster = bowlFirstTeam === teamA ? selectedTeamARoster : selectedTeamBRoster;

    const batsman1Name = (batRoster && batRoster.length > 0) ? batRoster[0] : 'Batter 1 State';
    const batsman2Name = (batRoster && batRoster.length > 1) ? batRoster[1] : 'Batter 2 State';
    const bowler1Name = (bowlRoster && bowlRoster.length > 0) ? bowlRoster[0] : 'Bowler 1 State';

    // Initialize first innings
    const initialInnings: Innings = {
      battingTeam: batFirstTeam,
      bowlingTeam: bowlFirstTeam,
      runs: 0,
      wickets: 0,
      ballsBowled: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      batsmen: [
        { name: batsman1Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
        { name: batsman2Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
      ],
      bowlers: [
        { name: bowler1Name, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, isCurrent: true }
      ],
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
      fallOfWickets: [],
      commentaryList: [
        { id: `c-${Date.now()}`, overBall: '0.0', description: `Match Started! ${batFirstTeam} won the toss and elected to ${tossChoice} first.`, type: 'normal' }
      ],
      history: [
        { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
      ]
    };

    const newMatch: MatchState = {
      id: `match-${Date.now()}`,
      teamA,
      teamB,
      oversLimit: Number(oversLimit),
      tossWinner: coinTossWinTeam,
      tossChoice,
      currentInningsNum: 1,
      innings1: initialInnings,
      innings2: null,
      status: 'live',
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      freeHitNext: false,
      teamALogo: teamALogoUrl || null,
      teamBLogo: teamBLogoUrl || null,
      playerPhotos: {},
      tournamentId: match?.tournamentId || null,
      tournamentMatchId: match?.tournamentMatchId || null,
      tournamentName: tournamentName || null,
      seriesName: seriesName || 'Bilateral Series',
      groundName: groundName || 'Gully Ground',
      createdBy: user?.email || user?.uid || 'anonymous',
      updatedAt: Date.now(),
      version: 1
    };

    setUndoStack([]);
    
    // Unmark any tombstone and persist locally first so state is never lost
    unmarkMatchDeleted(newMatch.id);
    saveMatchToRegistry(newMatch);
    setActiveMatch(newMatch);
    latestStateToSaveRef.current = newMatch;
    setMatch(newMatch);
    try {
      localStorage.setItem('cricket_active_match', JSON.stringify(newMatch));
    } catch (e) {}

    // Set parameters and trigger Firestore write with safe fallback
    setSearchParams({ matchId: newMatch.id });
    if (isFirestoreQuotaExhausted()) {
      setSaveStatus('saved');
      showNotification(`Match Started: ${batFirstTeam} is batting first! (Local Mode)`, 'success');
      playSoundEffect('four');
    } else {
      setSaveStatus('saving');
      safeSetDoc(doc(db, 'cricket_matches', newMatch.id), sanitizeForFirestore(newMatch)).then(() => {
        setSaveStatus('saved');
        showNotification(`Match Started: ${batFirstTeam} is batting first!`, 'success');
        playSoundEffect('four');
      }).catch(err => {
        setSaveStatus('saved');
        if (isQuotaError(err)) {
          recordFirestoreQuotaExhaustion(2);
          showNotification(`Match Started: ${batFirstTeam} is batting first!`, 'success');
          playSoundEffect('four');
        } else {
          console.warn('Could not write to remote Firestore, running with local persistence:', err);
          showNotification(`Match Started: ${batFirstTeam} is batting first!`, 'success');
          playSoundEffect('four');
        }
      });
    }
  };

  const currentInnings = match.currentInningsNum === 1 ? match.innings1 : match.innings2;

  const [wicketTriggerAlert, setWicketTriggerAlert] = useState<boolean>(false);

  useEffect(() => {
    if (currentInnings && currentInnings.wickets > 0) {
      setWicketTriggerAlert(true);
      const timer = setTimeout(() => {
        setWicketTriggerAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentInnings?.wickets]);

  const isOverCompletedNeedsBowler = useMemo(() => {
    if (!currentInnings || match.status !== 'live') return false;
    const { ballsBowled } = currentInnings;
    if (ballsBowled === 0 || ballsBowled % 6 !== 0) return false;
    if (ballsBowled >= match.oversLimit * 6) return false;
    return bowlerSelectedForOver !== Math.floor(ballsBowled / 6);
  }, [currentInnings?.ballsBowled, bowlerSelectedForOver, match.status, match.oversLimit]);

  const handleSelectNewBowlerForOver = (bowlerIndex: number) => {
    handleChangeActiveBowler(bowlerIndex);
    setBowlerSelectedForOver(Math.floor((currentInnings?.ballsBowled || 0) / 6));
    playSoundEffect('dot');
  };

  const handleAddNewBowlerAndProgress = (name: string) => {
    if (!name.trim()) return;
    handleAddNewBowler(name.trim());
    setBowlerSelectedForOver(Math.floor((currentInnings?.ballsBowled || 0) / 6));
    playSoundEffect('dot');
  };

  // Manual Adjustments Handlers
  const handleUpdateBatsmanName = (index: number, name: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedBatsmen = currentInnings.batsmen.map((b, idx) => {
      if (idx === index) return { ...b, name: name.trim() || `Batsman ${index + 1}` };
      return b;
    });

    const updatedInnings = { ...currentInnings, batsmen: updatedBatsmen };
    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    setEditStrikerIndex(null);
    setEditNonStrikerIndex(null);
    showNotification('Batsman name updated.', 'success');
  };

  const handleUpdateBowlerName = (index: number, name: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedBowlers = currentInnings.bowlers.map((b, idx) => {
      if (idx === index) return { ...b, name: name.trim() || `Bowler ${index + 1}` };
      return b;
    });

    const updatedInnings = { ...currentInnings, bowlers: updatedBowlers };
    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    setEditBowlerIndex(null);
    showNotification('Bowler name updated.', 'success');
  };

  const handleAddNewBowler = (name: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedBowlers = [...currentInnings.bowlers.map(b => ({ ...b, isCurrent: false })), {
      name: name.trim() || `Bowler ${currentInnings.bowlers.length + 1}`,
      ballsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      isCurrent: true
    }];

    const updatedInnings = {
      ...currentInnings,
      bowlers: updatedBowlers,
      currentBowlerIndex: updatedBowlers.length - 1
    };

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    showNotification(`New bowler ${name} is now bowling!`, 'success');
  };

  const handlePublishNewsBulletin = (newsText: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);

    const inn = { ...currentInnings };
    inn.commentaryList = [
      {
        id: `c-news-${Date.now()}`,
        overBall: formatOvers(inn.ballsBowled),
        description: `📢 [NEWS BULLETIN] ${newsText}`,
        type: 'milestone'
      },
      ...inn.commentaryList
    ];

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? inn : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? inn : prev.innings2
    }));

    showNotification('Real-time news bulletin published successfully!', 'success');
  };

  const handleAddNewBatsman = (name: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedBatsmen = [...currentInnings.batsmen, {
      name: name.trim() || `Batsman ${currentInnings.batsmen.length + 1}`,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false
    }];

    const updatedInnings = {
      ...currentInnings,
      batsmen: updatedBatsmen
    };

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    showNotification(`Added new batsman ${name} to roster!`, 'success');
  };

  const generateAICommentary = async (
    matchState: MatchState,
    eventInfo: { type: string; val?: number; extraType?: string },
    batsmanName: string,
    bowlerName: string,
    baseDesc: string,
    inningsNum: number
  ) => {
    try {
      setIsAiCommentaryLoading(true);
      const activeInnings = inningsNum === 1 ? matchState.innings1 : matchState.innings2;
      const res = await fetch('/api/cricket/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchState: activeInnings,
          event: eventInfo,
          batsman: { name: batsmanName },
          bowler: { name: bowlerName },
          originalDescription: baseDesc
        })
      });
      const data = await res.json();
      if (data && data.text) {
        syncMatch(prev => {
          const targetInnings = inningsNum === 1 ? prev.innings1 : prev.innings2;
          if (!targetInnings) return prev;
          
          const updatedCommList = [...targetInnings.commentaryList];
          if (updatedCommList.length > 0) {
            updatedCommList[0] = {
              ...updatedCommList[0],
              description: data.text
            };
          }
          const updatedInnings = {
            ...targetInnings,
            commentaryList: updatedCommList
          };
          
          const nextMatch = {
            ...prev,
            innings1: inningsNum === 1 ? updatedInnings : prev.innings1,
            innings2: inningsNum === 2 ? updatedInnings : prev.innings2
          };

          return nextMatch;
        });
      }
    } catch (err) {
      console.error('Failed to generate AI commentary:', err);
    } finally {
      setIsAiCommentaryLoading(false);
    }
  };

  const handleChangeActiveBowler = (index: number) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedBowlers = currentInnings.bowlers.map((b, idx) => ({
      ...b,
      isCurrent: idx === index
    }));

    const updatedInnings = {
      ...currentInnings,
      bowlers: updatedBowlers,
      currentBowlerIndex: index
    };

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    showNotification(`Bowler changed to ${currentInnings.bowlers[index].name}.`, 'info');
  };

  const handleSwapStrikers = () => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedInnings = {
      ...currentInnings,
      strikerIndex: currentInnings.nonStrikerIndex,
      nonStrikerIndex: currentInnings.strikerIndex
    };
    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    showNotification('Batting crease positions swapped.', 'info');
    playSoundEffect('click');
  };

  const handleAddPenaltyRuns = (runsToAdd: number) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const updatedInnings = {
      ...currentInnings,
      runs: currentInnings.runs + runsToAdd,
      extras: {
        ...currentInnings.extras,
        penalty: currentInnings.extras.penalty + runsToAdd
      },
      commentaryList: [
        {
          id: `c-${Date.now()}`,
          overBall: formatOvers(currentInnings.ballsBowled),
          description: `Scoreboard override: Penalty of ${runsToAdd} runs awarded to ${currentInnings.battingTeam}.`,
          type: 'extra'
        },
        ...currentInnings.commentaryList
      ]
    };

    syncMatch(prev => {
      const updatedMatch = {
        ...prev,
        innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
        innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
      };
      
      // Auto re-evaluate match condition
      return checkMatchEndCondition(updatedMatch);
    });
    showNotification(`Added ${runsToAdd} penalty runs.`, 'success');
  };

  // Main Score scoring dispatcher
  const handleScoreEvent = (event: {
    type: 'dot' | 'runs' | 'wide' | 'noball' | 'wicket' | 'bye' | 'legbye';
    val?: number;
    extraType?: 'wide' | 'noball' | 'bye' | 'legbye';
  }) => {
    if (!currentInnings || match.status === 'completed') return;
    playSoundEffect('click');
    pushStateToUndoStack(match);

    let nextMatchState = { ...match };
    // Clone active elements
    const inn = { ...currentInnings };
    const batsmen = [...inn.batsmen];
    const bowlers = [...inn.bowlers];
    let isFreeHitActive = nextMatchState.freeHitNext;
    let setNextFreeHit = false;

    // Cache original striker/non-striker indices before tracking rotation swaps
    const originalStrikerIndex = inn.strikerIndex;
    const originalNonStrikerIndex = inn.nonStrikerIndex;

    const striker = { ...batsmen[originalStrikerIndex] };
    const nonStriker = { ...batsmen[originalNonStrikerIndex] };
    const bowler = { ...bowlers[inn.currentBowlerIndex] };

    let ballRuns = 0;
    let isWide = false;
    let isNoBall = false;
    let isCalculatedOverBall = false;
    let outcomeDescription = '';
    let eventType: 'normal' | 'boundary' | 'wicket' | 'extra' | 'milestone' = 'normal';

    const getSlickDescription = (type: string, val: number, str: string, bwl: string) => {
      const gullyStreets = [
        "near the cycle shop", "past the corner trash can", "under the mango tree", 
        "hitting the compound wall", "right off the dusty gravel", "on the narrow road pavement",
        "near the parked auto rickshaw", "over the drainage line", "toward the neighborhood temple gate",
        "near the electric pole", "close to the milk booth", "by the balcony standers"
      ];
      const reactions = [
        "The local boys chant and celebrate!", "What a cracker of an effort!", "Spectators cheering from balconies!",
        "Dogs barking in excitement!", "Fielder scampers back with dusty knees!", "The non-striker screams in approval!",
        "Absolute entertainment for the street crowd!", "Superb street athleticism on display."
      ];
      const deliveryAdjectives = [
        "seaming", "speedy", "loopy", "vicious", "skidding", "deceptive", "perfectly-pitched", "bumpy", "unpredictable"
      ];
      const streetSounds = [
        "Honk hooonk!", "Whistle whistles!", "Clap clap clap!", "Oohs and aahs from the neighbors!",
        "Shouts of 'Bhaag bhaag!'", "Cheers echo through the alley!", "Loud whistling from the high-rise windows!"
      ];

      const rdStreet = gullyStreets[Math.floor(Math.random() * gullyStreets.length)];
      const rdReact = reactions[Math.floor(Math.random() * reactions.length)];
      const rdAdj = deliveryAdjectives[Math.floor(Math.random() * deliveryAdjectives.length)];
      const rdSound = streetSounds[Math.floor(Math.random() * streetSounds.length)];

      if (type === 'dot') {
        const dots = [
          `${bwl} fires a ${rdAdj} delivery, and ${str} defends it resolutely ${rdStreet}. No run. (${rdSound})`,
          `High-class bowling by ${bwl}! ${str} gets beaten on the off-stump. (${rdReact})`,
          `No room given by ${bwl}. ${str} pats it with flat-bat back to the bowler. (${rdSound})`,
          `A lovely tight line ${rdStreet} from ${bwl}. ${str} leaves it safely.`,
          `${str} attempts a big swing but gets only air against ${bwl}'s clever spin! (${rdReact})`,
          `Excellent defense from ${str} against a ${rdAdj} ball from ${bwl}. Close keeping!`
        ];
        return dots[Math.floor(Math.random() * dots.length)];
      }

      if (type === 'runs') {
        if (val === 1) {
          const ones = [
            `${str} works the ${rdAdj} ball from ${bwl} ${rdStreet} for a single. (${rdSound})`,
            `Quick single taken as ${str} tucks it into the cover gap. Beautiful running! (${rdReact})`,
            `${str} guides this one down to third-man area. Soft hands, comfortable run.`,
            `Excellent rotation! ${str} taps a tight ball and runs immediately. (${rdSound})`,
            `A gentle tap from ${str} towards mid-off, easy single. ${rdReact}`
          ];
          return ones[Math.floor(Math.random() * ones.length)];
        }
        if (val === 2) {
          const twos = [
            `Shot! ${str} drives deep ${rdStreet}, pushing hard with great hustle to complete two! (${rdSound})`,
            `${str} flicks ${bwl} through mid-wicket. Splendid speed gets them a couple. (${rdReact})`,
            `Two runs taken! ${str} plays with soft hands into vacant deep space.`,
            `${bwl}'s delivery is cut past point. Fielder chases hard, ${str} safely back for two!`,
            `Excellent placement by ${str}! Swept away towards deep leg-side, double completed.`
          ];
          return twos[Math.floor(Math.random() * twos.length)];
        }
        if (val === 3) {
          const threes = [
            `Phenomenal running! ${str} punches it through the off-side gap and scampers for three. (${rdReact})`,
            `Slick placement as ${str} sweeps ${bwl} fine. They push hard and complete three runs! (${rdSound})`,
            `${str} launches this into the empty corner of the street. Terrific endurance to get three!`,
            `A misfield gives ${str} and partner enough confidence to sprint back for a hard-earned three.`
          ];
          return threes[Math.floor(Math.random() * threes.length)];
        }
        if (val === 4) {
          const fours = [
            `BOOM! ${str} lashes a gorgeous drive ${rdStreet} for FOUR runs! Magnificent! 🔥 (${rdSound})`,
            `CRACKING FOUR! ${str} pulls ${bwl} over mid-wicket, bouncing over the boundary lines! (${rdReact})`,
            `Splendid timing from ${str}! Elegant lofted cover drive over the circle. Boundary!`,
            `Pure street class! ${str} cuts past point with supreme precision. Four runs!`,
            `${str} uses the pace of ${bwl}'s delivery and guides it down past keeper for a boundary!`
          ];
          return fours[Math.floor(Math.random() * fours.length)];
        }
        if (val === 6) {
          const sixes = [
            `MONSTROUS HIT! ${str} sends the ball high, high, and over the building rooftop! SIX runs! 🚀 (${rdSound})`,
            `OUT OF THE ALLEY! ${str} plays a staggering helicopter shot off ${bwl} for an iconic SIX! (${rdReact})`,
            `A majestic maximum! ${str} dancing down the crease and lofting it over long-on! SIX!`,
            `Colossal strike! ${str} swings clean, sending this straight into orbit! Massive SIX!`,
            `Absolute power! ${str} slaps a ${rdAdj} ball from ${bwl} over deep mid-wicket for six!`
          ];
          return sixes[Math.floor(Math.random() * sixes.length)];
        }
      }

      const randomSuffixes = [
        "leaving fielders scratching their heads.", "with stellar confidence.",
        "as the local crowd goes into overdrive!", "under intense pressure."
      ];
      const rdSfx = randomSuffixes[Math.floor(Math.random() * randomSuffixes.length)];
      return `${val} run${val > 1 ? 's' : ''} scored with high elegance by ${str} off ${bwl}'s bowling, ${rdSfx}`;
    };

    if (event.type === 'runs' && event.val !== undefined) {
      ballRuns = event.val;
      striker.runs += ballRuns;
      striker.balls += 1;
      if (ballRuns === 4) {
        striker.fours += 1;
        eventType = 'boundary';
        outcomeDescription = getSlickDescription('runs', 4, striker.name, bowler.name);
        playSoundEffect('four');
        
        // Auto-trigger animated fullscreen boundary blast overlay
        nextMatchState.overlayConfig = {
          ...(nextMatchState.overlayConfig || {}),
          manualAlertTrigger: {
            type: 'four',
            timestamp: Date.now()
          },
          customBanner: 'four',
          customBannerText: '4 Runs! Classy Placement.'
        };
      } else if (ballRuns === 6) {
        striker.sixes += 1;
        eventType = 'boundary';
        outcomeDescription = getSlickDescription('runs', 6, striker.name, bowler.name);
        playSoundEffect('six');
        
        // Auto-trigger animated fullscreen boundary blast overlay
        nextMatchState.overlayConfig = {
          ...(nextMatchState.overlayConfig || {}),
          manualAlertTrigger: {
            type: 'six',
            timestamp: Date.now()
          },
          customBanner: 'six',
          customBannerText: '6 Runs! Out of the park.'
        };
      } else {
        outcomeDescription = getSlickDescription('runs', ballRuns, striker.name, bowler.name);
      }

      inn.runs += ballRuns;
      inn.ballsBowled += 1;
      bowler.ballsBowled += 1;
      bowler.runsConceded += ballRuns;
      isCalculatedOverBall = true;

      // Swap batsman if odd number of runs scored
      if (ballRuns % 2 !== 0) {
        const temp = inn.strikerIndex;
        inn.strikerIndex = inn.nonStrikerIndex;
        inn.nonStrikerIndex = temp;
      }
    } 
    else if (event.type === 'dot') {
      striker.balls += 1;
      inn.ballsBowled += 1;
      bowler.ballsBowled += 1;
      isCalculatedOverBall = true;
      outcomeDescription = getSlickDescription('dot', 0, striker.name, bowler.name);
    } 
    else if (event.type === 'wide') {
      isWide = true;
      const extraRuns = event.val || 0;
      const totalWideRuns = 1 + extraRuns;
      inn.runs += totalWideRuns;
      inn.extras.wides += 1; // Exactly 1 run added to extras (wide)
      striker.runs += extraRuns; // Extra runs completed go to batsman's individual score
      bowler.runsConceded += totalWideRuns;
      outcomeDescription = `Wide delivery called! ${extraRuns > 0 ? `Plus ${extraRuns} run${extraRuns > 1 ? 's' : ''} completed by batsman.` : ''} Total +${totalWideRuns} runs.`;
      eventType = 'extra';

      if (extraRuns % 2 !== 0) {
        const temp = inn.strikerIndex;
        inn.strikerIndex = inn.nonStrikerIndex;
        inn.nonStrikerIndex = temp;
      }
    } 
    else if (event.type === 'noball') {
      isNoBall = true;
      const batRuns = event.val || 0;
      const totalRunsFromBall = 1 + batRuns;

      inn.runs += totalRunsFromBall;
      inn.extras.noBalls += 1; // Exactly 1 run added to extras (no ball)
      striker.runs += batRuns; // Runs completed/hit go to batsman's score

      if (batRuns === 4) {
        striker.fours += 1;
        
        // Auto-trigger animated fullscreen boundary blast overlay
        nextMatchState.overlayConfig = {
          ...(nextMatchState.overlayConfig || {}),
          manualAlertTrigger: {
            type: 'four',
            timestamp: Date.now()
          },
          customBanner: 'four',
          customBannerText: '4 Runs! Classy Placement.'
        };
      } else if (batRuns === 6) {
        striker.sixes += 1;
        
        // Auto-trigger animated fullscreen boundary blast overlay
        nextMatchState.overlayConfig = {
          ...(nextMatchState.overlayConfig || {}),
          manualAlertTrigger: {
            type: 'six',
            timestamp: Date.now()
          },
          customBanner: 'six',
          customBannerText: '6 Runs! Out of the park.'
        };
      }

      striker.balls += 1; // Batsman faces a ball
      bowler.runsConceded += totalRunsFromBall;
      outcomeDescription = `No-Ball called! ${batRuns > 0 ? `${batRuns} runs scored to batsman ${striker.name}.` : ''} Free hit awarded!`;
      eventType = 'extra';
      setNextFreeHit = true;

      if (batRuns % 2 !== 0) {
        const temp = inn.strikerIndex;
        inn.strikerIndex = inn.nonStrikerIndex;
        inn.nonStrikerIndex = temp;
      }
    }
    else if (event.type === 'bye' && event.val !== undefined) {
      const byeRuns = event.val;
      inn.runs += byeRuns;
      inn.extras.byes += byeRuns;
      striker.balls += 1;
      inn.ballsBowled += 1;
      bowler.ballsBowled += 1;
      isCalculatedOverBall = true;
      outcomeDescription = `${byeRuns} Bye run${byeRuns > 1 ? 's' : ''} taken. (Delivery counts as legal over ball)`;
      eventType = 'extra';

      if (byeRuns % 2 !== 0) {
        const temp = inn.strikerIndex;
        inn.strikerIndex = inn.nonStrikerIndex;
        inn.nonStrikerIndex = temp;
      }
    }
    else if (event.type === 'legbye' && event.val !== undefined) {
      const lbRuns = event.val;
      inn.runs += lbRuns;
      inn.extras.legByes += lbRuns;
      striker.balls += 1;
      inn.ballsBowled += 1;
      bowler.ballsBowled += 1;
      isCalculatedOverBall = true;
      outcomeDescription = `${lbRuns} Leg-Bye run${lbRuns > 1 ? 's' : ''} taken off pads. (Delivery counts as legal over ball)`;
      eventType = 'extra';

      if (lbRuns % 2 !== 0) {
        const temp = inn.strikerIndex;
        inn.strikerIndex = inn.nonStrikerIndex;
        inn.nonStrikerIndex = temp;
      }
    }

    // Over completion logic (6 legal balls completes an Over)
    if (isCalculatedOverBall && inn.ballsBowled > 0 && inn.ballsBowled % 6 === 0) {
      // Rotate strikers at the end of the over
      const temp = inn.strikerIndex;
      inn.strikerIndex = inn.nonStrikerIndex;
      inn.nonStrikerIndex = temp;

      outcomeDescription += ` (End of Over ${Math.floor(inn.ballsBowled / 6)})`;
    }

    // Commit changes back to correct original indices
    bowler.consecutiveWickets = 0;
    batsmen[originalStrikerIndex] = striker;
    batsmen[originalNonStrikerIndex] = nonStriker;
    bowlers[inn.currentBowlerIndex] = bowler;

    // Evaluate individual batsman milestone triggers (50s, 100s)
    const originalStrikerRuns = currentInnings.batsmen[originalStrikerIndex]?.runs || 0;
    const finalStrikerRuns = striker.runs;
    if (originalStrikerRuns < 50 && finalStrikerRuns >= 50) {
      showNotification(`🎉 FIFTY! ${striker.name} has scored a magnificent Half-Century (50+ runs)!`, 'success');
      // Set overlay blast
      nextMatchState.overlayConfig = {
        ...(nextMatchState.overlayConfig || {}),
        manualAlertTrigger: {
          type: 'fifty',
          timestamp: Date.now()
        },
        customBanner: 'fifty',
        customBannerText: `🎉 50 FOR ${striker.name.toUpperCase()}! A magnificent half-century!`
      };
    } else if (originalStrikerRuns < 100 && finalStrikerRuns >= 100) {
      showNotification(`🎉 HUNDRED! ${striker.name} has scored a legendary Century (100+ runs)!`, 'success');
      // Set overlay blast
      nextMatchState.overlayConfig = {
        ...(nextMatchState.overlayConfig || {}),
        manualAlertTrigger: {
          type: 'hundred',
          timestamp: Date.now()
        },
        customBanner: 'hundred',
        customBannerText: `🎉 100 FOR ${striker.name.toUpperCase()}! A legendary century!`
      };
    }

    inn.batsmen = batsmen;
    inn.bowlers = bowlers;

    // Set last ball result string helper
    let ballLabel = '';
    if (event.type === 'dot') ballLabel = '0';
    else if (event.type === 'runs') ballLabel = String(event.val);
    else if (event.type === 'wide') ballLabel = event.val ? `${event.val}Wd` : 'Wd';
    else if (event.type === 'noball') ballLabel = event.val ? `${event.val}Nb` : 'Nb';
    else if (event.type === 'bye') ballLabel = 'By';
    else if (event.type === 'legbye') ballLabel = 'Lb';

    inn.commentaryList = [
      {
        id: `c-${Date.now()}`,
        overBall: formatOvers(inn.ballsBowled),
        description: `${bowler.name} to ${striker.name}: ${outcomeDescription}`,
        type: eventType
      },
      ...inn.commentaryList
    ];

    nextMatchState.freeHitNext = setNextFreeHit;
    nextMatchState.lastBallResult = ballLabel;

    // Track ball-by-ball score history for the Recharts graph
    if (!inn.history) {
      inn.history = [
        { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
      ];
    }
    inn.history.push({
      over: inn.ballsBowled / 6,
      overStr: formatOvers(inn.ballsBowled),
      cumulativeRuns: inn.runs,
      cumulativeWickets: inn.wickets
    });

    if (match.currentInningsNum === 1) {
      nextMatchState.innings1 = inn;
    } else {
      nextMatchState.innings2 = inn;
    }

    // Check if max overs finished or check win condition
    nextMatchState = checkMatchEndCondition(nextMatchState);
    syncMatch(nextMatchState);

    // Trigger Server-side AI Commentary in the background if enabled
    if (aiCommentaryEnabled && !isSpectator) {
      const baseDesc = `${bowler.name} to ${striker.name}: ${outcomeDescription}`;
      generateAICommentary(
        nextMatchState,
        { type: event.type, val: event.val, extraType: event.extraType },
        striker.name,
        bowler.name,
        baseDesc,
        match.currentInningsNum
      );
    }
  };

  // Advanced Wicket Handler Modal Actions
  const handleWicketScore = () => {
    if (!currentInnings) return;

    // Validate that if LBW or Caught are selected, Additional Notes is mandatory
    if ((wicketType === 'LBW' || wicketType === 'Caught') && !wicketAdditionalDetails.trim()) {
      setWicketValidationErr(`Additional Notes are mandatory when '${wicketType}' is selected.`);
      showNotification(`Additional Notes are required for '${wicketType}' dismissal.`, 'alert');
      return;
    }
    setWicketValidationErr('');

    const batsmen = currentInnings.batsmen;
    const bowler = currentInnings.bowlers[currentInnings.currentBowlerIndex];

    const currentStriker = batsmen[currentInnings.strikerIndex];
    const currentNonStriker = batsmen[currentInnings.nonStrikerIndex];

    const dismissedBatter = outBatsmanWho === 'striker' ? currentStriker : currentNonStriker;

    // Check if free hit protects the batsman
    if (match.freeHitNext && wicketType !== 'Run Out') {
      showNotification(`Free Hit protects ${dismissedBatter.name} from being out (${wicketType})! No wicket recorded.`, 'info');
      setShowWicketModal(false);
      return;
    }

    const baseHowOut = wicketHowOutDetails.trim() || wicketType;
    const detailedHowOut = baseHowOut + (wicketAdditionalDetails.trim() ? ` (${wicketAdditionalDetails.trim()})` : '');
    const detailedBowler = wicketBowlerName.trim() || bowler.name;
    const finalBatsmanName = newBatsmanName.trim() || `Batsman ${batsmen.length + 1}`;

    setShowWicketModal(false);
    playSoundEffect('click');

    // Buffer the event details to display the Quick Wicket Replay card first
    setPendingWicketReplay({
      batsmanName: dismissedBatter.name,
      bowlerName: detailedBowler,
      wicketType: wicketType,
      howOutDetails: detailedHowOut,
      incomingBatsmanName: finalBatsmanName,
      who: outBatsmanWho,
      fielderName: (wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') ? wicketFielderName.trim() : undefined
    });
  };

  const commitWicketScore = (replay: {
    batsmanName: string;
    bowlerName: string;
    wicketType: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW';
    howOutDetails: string;
    incomingBatsmanName: string;
    who: 'striker' | 'non-striker';
    fielderName?: string;
  } | null) => {
    if (!replay || !currentInnings) return;
    playSoundEffect('wicket');
    pushStateToUndoStack(match);

    let nextMatchState = { ...match };
    const inn = { ...currentInnings };
    const batsmen = [...inn.batsmen];
    const bowlers = [...inn.bowlers];

    const currentStriker = { ...batsmen[inn.strikerIndex] };
    const currentNonStriker = { ...batsmen[inn.nonStrikerIndex] };
    const bowler = { ...bowlers[inn.currentBowlerIndex] };

    const dismissedBatter = replay.who === 'striker' ? currentStriker : currentNonStriker;

    const detailedHowOut = replay.howOutDetails;
    const detailedBowler = replay.bowlerName;

    dismissedBatter.isOut = true;
    dismissedBatter.outMode = detailedHowOut;
    dismissedBatter.dismissedBy = detailedBowler;
    if (replay.fielderName) {
      dismissedBatter.fielderName = replay.fielderName;
    }

    // Increment over details
    inn.wickets += 1;
    inn.ballsBowled += 1;
    bowler.ballsBowled += 1;

    // Wicket credit logic & Hat-trick tracking:
    if (replay.wicketType !== 'Run Out') {
      let activeBowler;
      if (detailedBowler.toLowerCase() === bowler.name.toLowerCase()) {
        bowler.wickets += 1;
        activeBowler = bowler;
      } else {
        const creditedBowlerIndex = bowlers.findIndex(b => b.name.toLowerCase() === detailedBowler.toLowerCase());
        if (creditedBowlerIndex !== -1) {
          bowlers[creditedBowlerIndex].wickets += 1;
          activeBowler = bowlers[creditedBowlerIndex];
        } else {
          const freshBowler = {
            name: detailedBowler,
            ballsBowled: 0,
            runsConceded: 0,
            maidens: 0,
            wickets: 1,
            isCurrent: false,
            consecutiveWickets: 0
          };
          bowlers.push(freshBowler);
          activeBowler = freshBowler;
        }
      }

      // Track bowler hat-trick milestone!
      if (activeBowler) {
        activeBowler.consecutiveWickets = (activeBowler.consecutiveWickets || 0) + 1;
        if (activeBowler.consecutiveWickets === 3) {
          showNotification(`🔥 HAT-TRICK! ${activeBowler.name} got 3 wickets in consecutive deliveries!`, 'success');
          // Add landmark commentary block
          inn.commentaryList.unshift({
            id: `comm-hat-trick-${Date.now()}`,
            overBall: formatOvers(inn.ballsBowled),
            description: `🔥 HAT-TRICK! A magnificent feat by ${activeBowler.name}! Three wickets in three consecutive deliveries has sent the crowd into absolute ecstasy!`,
            type: 'milestone'
          });
          // Update overlay banner blast
          nextMatchState.overlayConfig = {
            ...(nextMatchState.overlayConfig || {}),
            manualAlertTrigger: {
              type: '5wkt',
              timestamp: Date.now()
            },
            customBanner: 'drinks',
            customBannerText: `🔥 HAT-TRICK FOR ${activeBowler.name.toUpperCase()}! 3 wickets in a row!`
          };
        }
      }
    }

    // Add Fall of wicket
    inn.fallOfWickets.push({
      wicketNo: inn.wickets,
      score: inn.runs,
      batsmanName: dismissedBatter.name,
      oversList: formatOvers(inn.ballsBowled)
    });

    const finalBatsmanName = replay.incomingBatsmanName.trim() || `Batsman ${batsmen.length + 1}`;
    batsmen.push({
      name: finalBatsmanName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false
    });

    const newBatsmanIndex = batsmen.length - 1;

    if (replay.who === 'striker') {
      batsmen[inn.strikerIndex] = dismissedBatter;
      inn.strikerIndex = newBatsmanIndex;
    } else {
      batsmen[inn.nonStrikerIndex] = dismissedBatter;
      inn.nonStrikerIndex = newBatsmanIndex;
    }

    let overCompletionSuffix = '';
    if (inn.ballsBowled % 6 === 0) {
      const temp = inn.strikerIndex;
      inn.strikerIndex = inn.nonStrikerIndex;
      inn.nonStrikerIndex = temp;
      overCompletionSuffix = ` (End of Over ${Math.floor(inn.ballsBowled / 6)})`;
    }

    inn.batsmen = batsmen;
    bowlers[inn.currentBowlerIndex] = bowler;
    inn.bowlers = bowlers;

    const gullyWktReactions = [
      "The fielding side goes absolutely ecstatic!", "Spectacular fielding brings the breakthrough!",
      "Crowd is dead silent as the premium batsman walks back.", "Middle stump is flying!",
      "An absolute peach of a delivery!", "Street party erupted!", "What a sensational catch near the boundary line!"
    ];
    const rdWktReact = gullyWktReactions[Math.floor(Math.random() * gullyWktReactions.length)];
    const commentaryDescription = `OUT! ${dismissedBatter.name} has to walk back. Dismissal style: ${detailedHowOut} (Bowler: ${detailedBowler}). ${rdWktReact}${overCompletionSuffix}`;

    inn.commentaryList = [
      {
        id: `c-${Date.now()}`,
        overBall: formatOvers(inn.ballsBowled),
        description: commentaryDescription,
        type: 'wicket'
      },
      ...inn.commentaryList
    ];

    nextMatchState.freeHitNext = false;
    nextMatchState.lastBallResult = 'W';

    // Auto-trigger animated fullscreen wicket blast overlay
    nextMatchState.overlayConfig = {
      ...(nextMatchState.overlayConfig || {}),
      manualAlertTrigger: {
        type: 'wicket',
        timestamp: Date.now()
      },
      customBanner: 'out',
      customBannerText: 'Wicket Dismissal'
    };

    if (!inn.history) {
      inn.history = [
        { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
      ];
    }
    inn.history.push({
      over: inn.ballsBowled / 6,
      overStr: formatOvers(inn.ballsBowled),
      cumulativeRuns: inn.runs,
      cumulativeWickets: inn.wickets
    });

    if (match.currentInningsNum === 1) {
      nextMatchState.innings1 = inn;
    } else {
      nextMatchState.innings2 = inn;
    }

    nextMatchState = checkMatchEndCondition(nextMatchState);
    syncMatch(nextMatchState);

    // AI Commentary trigger in background if enabled
    if (aiCommentaryEnabled && !isSpectator) {
      generateAICommentary(
        nextMatchState,
        { type: 'wicket' },
        dismissedBatter.name,
        detailedBowler,
        commentaryDescription,
        match.currentInningsNum
      );
    }

    setPendingWicketReplay(null);
    setNewBatsmanName('');
    showNotification(`${dismissedBatter.name} dismissed via ${detailedHowOut}. Scoreboard updated!`, 'alert');
  };

  // Evaluates Match Statuses & switches innings automatically
  const checkMatchEndCondition = (state: MatchState): MatchState => {
    let modifiedState = { ...state };
    
    if (modifiedState.currentInningsNum === 1) {
      const inn1 = modifiedState.innings1;
      if (!inn1) return modifiedState;

      // Innings 1 ends when max overs are bowled or all batsmen out (10 wickets)
      const maxBalls = modifiedState.oversLimit * 6;
      if (inn1.ballsBowled >= maxBalls || inn1.wickets >= 10) {
        // Automatic complete Innings 1, set target
        const targetRunsValue = inn1.runs + 1;
        modifiedState.targetRuns = targetRunsValue;
        modifiedState.innings1 = inn1;
        
        showNotification(`Innings 1 Completed! ${inn1.battingTeam} scored ${inn1.runs}/${inn1.wickets}. Target for ${inn1.bowlingTeam}: ${targetRunsValue} runs.`, 'success');
        
        // Load custom team rosters if they exist
        const chasedBatRoster = inn1.bowlingTeam === modifiedState.teamA ? selectedTeamARoster : selectedTeamBRoster;
        const chasedBowlRoster = inn1.battingTeam === modifiedState.teamA ? selectedTeamARoster : selectedTeamBRoster;

        const chBatsman1Name = (chasedBatRoster && chasedBatRoster.length > 0) ? chasedBatRoster[0] : 'Chasing Batter 1';
        const chBatsman2Name = (chasedBatRoster && chasedBatRoster.length > 1) ? chasedBatRoster[1] : 'Chasing Batter 2';
        const chBowler1Name = (chasedBowlRoster && chasedBowlRoster.length > 0) ? chasedBowlRoster[0] : 'Defender Bowler 1';

        // Trigger immediate set-up for Innings 2 automatically!
        const initialInnings2: Innings = {
          battingTeam: inn1.bowlingTeam,
          bowlingTeam: inn1.battingTeam,
          runs: 0,
          wickets: 0,
          ballsBowled: 0,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
          batsmen: [
            { name: chBatsman1Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
            { name: chBatsman2Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
          ],
          bowlers: [
            { name: chBowler1Name, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, isCurrent: true }
          ],
          strikerIndex: 0,
          nonStrikerIndex: 1,
          currentBowlerIndex: 0,
          fallOfWickets: [],
          commentaryList: [
            { id: `c-${Date.now()}`, overBall: '0.0', description: `Innings 2 Started! ${inn1.bowlingTeam} needs ${targetRunsValue} runs in ${modifiedState.oversLimit} overs to win. Run Rate Required: ${((targetRunsValue / maxBalls) * 6).toFixed(2)} RPO.`, type: 'normal' }
          ],
          history: [
            { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
          ]
        };

        modifiedState.innings2 = initialInnings2;
        modifiedState.currentInningsNum = 2;
        modifiedState.freeHitNext = false;
      }
    } else {
      // Innings 2 (Chase) is active
      const inn1 = modifiedState.innings1;
      const inn2 = modifiedState.innings2;
      const target = modifiedState.targetRuns;

      if (!inn1 || !inn2 || !target) return modifiedState;

      const maxBalls = modifiedState.oversLimit * 6;

      // Scenarios for chase completion
      const chaseSuccessful = inn2.runs >= target;
      const batInningsEnded = inn2.ballsBowled >= maxBalls || inn2.wickets >= 10;

      if (chaseSuccessful) {
        modifiedState.status = 'completed';
        modifiedState.winner = inn2.battingTeam;
        const wicketsMargin = 10 - inn2.wickets;
        modifiedState.winReason = `won by ${wicketsMargin} wicket${wicketsMargin > 1 ? 's' : ''}`;
        
        // Push to local match history
        saveMatchToHistory(modifiedState);
      } else if (batInningsEnded && inn2.runs < target - 1) {
        modifiedState.status = 'completed';
        modifiedState.winner = inn2.bowlingTeam;
        const runsMargin = target - 1 - inn2.runs;
        modifiedState.winReason = `won by ${runsMargin} run${runsMargin > 1 ? 's' : ''}`;
        
        saveMatchToHistory(modifiedState);
      } else if (batInningsEnded && inn2.runs === target - 1) {
        modifiedState.status = 'completed';
        modifiedState.winner = 'Tie';
        modifiedState.winReason = 'The match ended in a thrilling Tie!';
        
        saveMatchToHistory(modifiedState);
      }
    }

    return modifiedState;
  };

  // Explicitly End / Declare Innings manually
  const handleDeclareInnings = () => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);

    let nextMatchState = { ...match };

    if (nextMatchState.currentInningsNum === 1) {
      const inn1 = nextMatchState.innings1;
      if (!inn1) return;
      const targetRunsValue = inn1.runs + 1;
      nextMatchState.targetRuns = targetRunsValue;
      
      showNotification(`Innings 1 declared by Captain! Target set: ${targetRunsValue} runs.`, 'success');

      // Load custom team rosters if they exist
      const chasedBatRoster = inn1.bowlingTeam === nextMatchState.teamA ? selectedTeamARoster : selectedTeamBRoster;
      const chasedBowlRoster = inn1.battingTeam === nextMatchState.teamA ? selectedTeamARoster : selectedTeamBRoster;

      const chBatsman1Name = (chasedBatRoster && chasedBatRoster.length > 0) ? chasedBatRoster[0] : 'Chasing Batter 1';
      const chBatsman2Name = (chasedBatRoster && chasedBatRoster.length > 1) ? chasedBatRoster[1] : 'Chasing Batter 2';
      const chBowler1Name = (chasedBowlRoster && chasedBowlRoster.length > 0) ? chasedBowlRoster[0] : 'Defender Bowler 1';

      const initialInnings2: Innings = {
        battingTeam: inn1.bowlingTeam,
        bowlingTeam: inn1.battingTeam,
        runs: 0,
        wickets: 0,
        ballsBowled: 0,
        extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
        batsmen: [
          { name: chBatsman1Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
          { name: chBatsman2Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
        ],
        bowlers: [
          { name: chBowler1Name, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, isCurrent: true }
        ],
        strikerIndex: 0,
        nonStrikerIndex: 1,
        currentBowlerIndex: 0,
        fallOfWickets: [],
        commentaryList: [
          { id: `c-${Date.now()}`, overBall: '0.0', description: `Innings declared. ${inn1.bowlingTeam} needs ${targetRunsValue} runs to win.`, type: 'normal' }
        ],
        history: [
          { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
        ]
      };

      nextMatchState.innings2 = initialInnings2;
      nextMatchState.currentInningsNum = 2;
      nextMatchState.freeHitNext = false;
      syncMatch(nextMatchState);
    } else {
      // Declare Innings 2 (lose match as forfeit or tie depending on score)
      const inn2 = nextMatchState.innings2;
      const target = nextMatchState.targetRuns;
      if (!inn2 || !target) return;

      nextMatchState.status = 'completed';
      if (inn2.runs > target - 1) {
        nextMatchState.winner = inn2.battingTeam;
        nextMatchState.winReason = 'won in declared innings!';
      } else {
        nextMatchState.winner = inn2.bowlingTeam;
        nextMatchState.winReason = `won by declaration forfeit (Margin: ${target - 1 - inn2.runs} runs)`;
      }
      saveMatchToHistory(nextMatchState);
    }
  };

  // Saves completed match state into history
  const saveMatchToHistory = (completedMatch: MatchState) => {
    syncMatch(completedMatch);
    showNotification('Match concluded and saved to History records.', 'success');

    if (tournamentCallbackRef.current && completedMatch.status === 'completed') {
      const runsA = completedMatch.innings1?.runs || 0;
      const wicketsA = completedMatch.innings1?.wickets || 0;
      const runsB = completedMatch.innings2?.runs || 0;
      const wicketsB = completedMatch.innings2?.wickets || 0;
      const winner = completedMatch.winner || "Tie";
      const winReason = completedMatch.winReason || "Tie Match";

      tournamentCallbackRef.current({
        runsA,
        wicketsA,
        runsB,
        wicketsB,
        winner,
        winReason
      });
      tournamentCallbackRef.current = null;
    }
  };

  // Undo Last Scoring Input Action
  const handleUndoAction = () => {
    if (undoStack.length === 0) {
      showNotification('Nothing to undo!', 'alert');
      return;
    }
    const previousStateString = undoStack[undoStack.length - 1];
    try {
      const parsed = JSON.parse(previousStateString);
      syncMatch(parsed);
      setUndoStack(prev => prev.slice(0, prev.length - 1));
      showNotification('Last delivery scoring undone successfully.', 'info');
      playSoundEffect('click');
    } catch (e) {
      console.log('Undo failure', e);
    }
  };

  // Reset scoring & restart setup
  const handleResetMatch = async (forceConfirmed: any = false) => {
    // If the match is completed, reset UI gracefully without deleting doc or prompt
    if (match.status === 'completed') {
      await performResetMatch(true);
      return;
    }
    if (forceConfirmed === true) {
      await performResetMatch(false);
      return;
    }
    setResetMatchConfirm(true);
  };

  const performResetMatch = async (skipDelete = false) => {
    const oldId = match.id;
    if (oldId) {
      deleteLocalMatch(oldId);
      if (!isSpectator && !skipDelete && match.status !== 'completed') {
        try {
          await safeDeleteDoc(doc(db, 'cricket_matches', oldId));
        } catch (e) {
          console.warn('Error deleting discarded match from DB:', e);
        }
      }
    }
    if (latestStateToSaveRef.current?.id === oldId) {
      latestStateToSaveRef.current = null;
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = null;
    }
    syncMatch({
      id: '',
      teamA: '',
      teamB: '',
      oversLimit: 5,
      tossWinner: '',
      tossChoice: 'bat',
      currentInningsNum: 1,
      innings1: null,
      innings2: null,
      status: 'setup',
      date: '',
      freeHitNext: false
    });
    setUndoStack([]);
    setIsInningsLocked(false);
    setActiveMobileTab('scorer');
    setSearchParams({});
    try {
      localStorage.removeItem('cricket_active_match');
    } catch (e) {
      console.warn('Blocked removing cricket_active_match from localStorage:', e);
    }
    setTeamA('');
    setTeamB('');
    setOversLimit(5);
    setTossWinner('Team A');
    setTossChoice('bat');
    showNotification('Scoreboard and match setup reset.', 'info');
  };

  // Clear Completed Matches Logs from Firestore
  const handleClearHistory = async () => {
    showNotification('Clearing history logs...', 'info');
    try {
      for (const past of matchHistory) {
        if (past.id) {
          deleteLocalMatch(past.id);
          try {
            await safeDeleteDoc(doc(db, 'cricket_matches', past.id));
          } catch (e) {}
        }
      }
      setMatchHistory([]);
      showNotification('History logs cleared permanently.', 'info');
    } catch (err) {
      console.error('Error clearing matches history:', err);
      showNotification('Failed to clear logs.', 'alert');
    }
  };

  // Delete single completed match log from database
  const handleDeleteLiveCompletedMatch = async (id: string) => {
    if (!id) return;
    setMatchHistory(prev => prev.filter(m => m.id !== id));
    deleteLocalMatch(id);
    if (match.id === id) {
      setMatch({
        id: '',
        teamA: '',
        teamB: '',
        oversLimit: 5,
        tossWinner: '',
        tossChoice: 'bat',
        currentInningsNum: 1,
        innings1: null,
        innings2: null,
        status: 'setup',
        date: '',
        freeHitNext: false
      });
      if (searchParams.get('matchId') === id) {
        setSearchParams({});
      }
    }
    if (localAutosavedMatch?.id === id) {
      setLocalAutosavedMatch(null);
    }
    if (latestStateToSaveRef.current?.id === id) {
      latestStateToSaveRef.current = null;
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = null;
    }
    try {
      await safeDeleteDoc(doc(db, 'cricket_matches', id));
      showNotification('Match log permanently deleted.', 'success');
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
      }
      showNotification('Match log permanently deleted.', 'success');
    }
  };

  // Delete live match from database
  const handleDeleteLiveMatch = async (id: string) => {
    if (!id) return;
    // 1. Remove from all local React lists
    setActiveLiveMatches(prev => prev.filter(m => m.id !== id));
    setMatchHistory(prev => prev.filter(m => m.id !== id));
    setSavedDrafts(prev => prev.filter(m => m.id !== id));

    // 2. Permanently tombstone and remove from all localStorage / offline stores
    deleteLocalMatch(id);

    // 3. Clear pending autosaves & timers so debounced save doesn't resurrect it
    if (latestStateToSaveRef.current?.id === id) {
      latestStateToSaveRef.current = null;
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = null;
    }

    // 4. If this match is currently loaded on the scoreboard, reset UI to setup
    if (match.id === id) {
      setMatch({
        id: '',
        teamA: '',
        teamB: '',
        oversLimit: 5,
        tossWinner: '',
        tossChoice: 'bat',
        currentInningsNum: 1,
        innings1: null,
        innings2: null,
        status: 'setup',
        date: '',
        freeHitNext: false
      });
      if (searchParams.get('matchId') === id) {
        setSearchParams({});
      }
    }

    // 5. Clear autosaved preview banner if it refers to this match
    if (localAutosavedMatch?.id === id) {
      setLocalAutosavedMatch(null);
    }

    // 6. Delete from remote Firestore cleanly without conflicting pre-mutation
    try {
      await safeDeleteDoc(doc(db, 'cricket_matches', id));
      showNotification('Active live match permanently deleted.', 'success');
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
      }
      showNotification('Active live match permanently deleted.', 'success');
    }
  };

  // Delete draft match log from database
  const handleDeleteDraft = async (id: string) => {
    if (!id) return;
    setSavedDrafts(prev => prev.filter(m => m.id !== id));
    deleteLocalMatch(id);
    if (match.id === id) {
      setMatch({
        id: '',
        teamA: '',
        teamB: '',
        oversLimit: 5,
        tossWinner: '',
        tossChoice: 'bat',
        currentInningsNum: 1,
        innings1: null,
        innings2: null,
        status: 'setup',
        date: '',
        freeHitNext: false
      });
      if (searchParams.get('matchId') === id) {
        setSearchParams({});
      }
    }
    if (localAutosavedMatch?.id === id) {
      setLocalAutosavedMatch(null);
    }
    if (latestStateToSaveRef.current?.id === id) {
      latestStateToSaveRef.current = null;
    }
    if (savingTimeoutRef.current) {
      clearTimeout(savingTimeoutRef.current);
      savingTimeoutRef.current = null;
    }
    try {
      await safeDeleteDoc(doc(db, 'cricket_matches', id));
      showNotification('Draft match permanently deleted.', 'success');
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
      }
      showNotification('Draft match permanently deleted.', 'success');
    }
  };

  const handleToggleHideLiveMatch = async (id: string, currentHiddenStatus: boolean) => {
    if (isFirestoreQuotaExhausted()) {
      showNotification(`Match is now ${!currentHiddenStatus ? 'hidden' : 'visible'} (local).`, 'success');
      return;
    }
    try {
      const matchDocRef = doc(db, 'cricket_matches', id);
      await safeSetDoc(matchDocRef, { isHidden: !currentHiddenStatus }, { merge: true });
      showNotification(`Match is now ${!currentHiddenStatus ? 'hidden' : 'visible'} to spectators.`, 'success');
    } catch (e) {
      if (isQuotaError(e)) {
        recordFirestoreQuotaExhaustion(60);
        showNotification(`Match is now ${!currentHiddenStatus ? 'hidden' : 'visible'} (local).`, 'success');
      } else {
        console.error('Failed to toggle hide live match:', e);
        showNotification('Failed to toggle visibility.', 'alert');
      }
    }
  };

  const handleToggleBlockLiveMatch = async (id: string, currentBlockedStatus: boolean) => {
    if (isFirestoreQuotaExhausted()) {
      showNotification(`Match is now ${!currentBlockedStatus ? 'blocked' : 'unblocked'} (local).`, 'success');
      return;
    }
    try {
      const matchDocRef = doc(db, 'cricket_matches', id);
      await safeSetDoc(matchDocRef, { isBlocked: !currentBlockedStatus }, { merge: true });
      showNotification(`Match is now ${!currentBlockedStatus ? 'blocked' : 'unblocked'}.`, 'success');
    } catch (e) {
      if (isQuotaError(e)) {
        recordFirestoreQuotaExhaustion(60);
        showNotification(`Match is now ${!currentBlockedStatus ? 'blocked' : 'unblocked'} (local).`, 'success');
      } else {
        console.error('Failed to toggle block live match:', e);
        showNotification('Failed to toggle match restrictions.', 'alert');
      }
    }
  };

  // Load Past Match Detail summary
  const handleLoadPastMatch = (pastMatch: MatchState) => {
    setMatch(pastMatch);
    if (pastMatch.id) {
      setSearchParams({ matchId: pastMatch.id });
    }
    setShowHistory(false);
    showNotification(`Loaded Match Summary from ${pastMatch.date}.`, 'success');
  };

  // Resume Draft Match helper
  const handleLoadDraftMatch = (m: MatchState) => {
    const resumedMatch: MatchState = {
      ...m,
      status: 'live',
      updatedAt: Date.now()
    };
    unmarkMatchDeleted(m.id);
    saveMatchToRegistry(resumedMatch);
    setActiveMatch(resumedMatch);
    latestStateToSaveRef.current = resumedMatch;
    setMatch(resumedMatch);
    if (m.id) {
      setSearchParams({ matchId: m.id });
    }
    syncMatch(resumedMatch);
    setShowHistory(false);
    showNotification(`Resumed Match Draft: ${m.teamA} vs ${m.teamB}!`, 'success');
  };

  // Save current setup configuration as draft
  const handleSaveDraftFromSetup = async () => {
    if (!teamA.trim() || !teamB.trim()) {
      showNotification('Please enter both Team names to save as draft.', 'alert');
      return;
    }

    const coinTossWinTeam = tossWinner === 'Team A' ? teamA.trim() : teamB.trim();
    const coinTossLoseTeam = tossWinner === 'Team A' ? teamB.trim() : teamA.trim();
    const batFirstTeam = tossChoice === 'bat' ? coinTossWinTeam : coinTossLoseTeam;
    const bowlFirstTeam = tossChoice === 'bat' ? coinTossLoseTeam : coinTossWinTeam;

    const batRoster = batFirstTeam === teamA ? selectedTeamARoster : selectedTeamBRoster;
    const bowlRoster = bowlFirstTeam === teamA ? selectedTeamARoster : selectedTeamBRoster;
    const batsman1Name = (batRoster && batRoster.length > 0) ? batRoster[0] : 'Batter 1';
    const batsman2Name = (batRoster && batRoster.length > 1) ? batRoster[1] : 'Batter 2';
    const bowler1Name = (bowlRoster && bowlRoster.length > 0) ? bowlRoster[0] : 'Bowler 1';

    const draftInnings: Innings = {
      battingTeam: batFirstTeam,
      bowlingTeam: bowlFirstTeam,
      runs: 0,
      wickets: 0,
      ballsBowled: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      batsmen: [
        { name: batsman1Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
        { name: batsman2Name, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
      ],
      bowlers: [
        { name: bowler1Name, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, isCurrent: true }
      ],
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
      fallOfWickets: [],
      commentaryList: [
        { id: `c-${Date.now()}`, overBall: '0.0', description: `Draft Match Created: ${teamA.trim()} vs ${teamB.trim()}`, type: 'normal' }
      ],
      history: [
        { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
      ]
    };

    const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const draftMatch: MatchState = {
      id: draftId,
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      oversLimit: Number(oversLimit) || 5,
      tossWinner: coinTossWinTeam,
      tossChoice,
      currentInningsNum: 1,
      innings1: draftInnings,
      innings2: null,
      status: 'draft',
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      freeHitNext: false,
      teamALogo: teamALogoUrl || null,
      teamBLogo: teamBLogoUrl || null,
      playerPhotos: {},
      tournamentId: match?.tournamentId || null,
      tournamentMatchId: match?.tournamentMatchId || null,
      tournamentName: tournamentName || null,
      seriesName: seriesName || 'Bilateral Series',
      groundName: groundName || 'Gully Ground',
      createdBy: user?.email || user?.uid || 'anonymous',
      updatedAt: Date.now(),
      version: 1
    };

    unmarkMatchDeleted(draftId);
    saveMatchToRegistry(draftMatch);
    setSavedDrafts(prev => [draftMatch, ...prev.filter(d => d.id !== draftId)]);

    showNotification(`Match setup successfully saved as draft: ${draftMatch.teamA} vs ${draftMatch.teamB}!`, 'success');
    setShowHistory(true);
    setActiveHistoryTab('drafts');

    if (!isFirestoreQuotaExhausted()) {
      try {
        await safeSetDoc(doc(db, 'cricket_matches', draftId), sanitizeForFirestore(draftMatch));
      } catch (err) {
        console.warn('Draft saved locally, failed to sync to cloud:', err);
      }
    }
  };

  // Custom User Commentary input
  const handleAddCustomCommentary = () => {
    if (!currentInnings || !commentaryInput.trim()) return;
    pushStateToUndoStack(match);
    const updatedInnings = {
      ...currentInnings,
      commentaryList: [
        {
          id: `comment-${Date.now()}`,
          overBall: formatOvers(currentInnings.ballsBowled),
          description: `🏏 [Commentary Note]: ${commentaryInput}`,
          type: 'milestone' as const
        },
        ...currentInnings.commentaryList
      ]
    };

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));

    setCommentaryInput('');
    showNotification('Commentary added.', 'success');
  };

  // Compute Outstanding performers of match
  const matchPerformanceHighlights = useMemo(() => {
    if (!match || (!match.innings1 && !match.innings2)) return null;
    
    let bestBatter = { name: 'N/A', runs: 0, balls: 0 };
    let bestBowler = { name: 'N/A', wickets: 0, runs: 0 };

    const processInningsPerformers = (inn: Innings | null) => {
      if (!inn) return;
      inn.batsmen.forEach(b => {
        if (b.runs > bestBatter.runs) {
          bestBatter = { name: b.name, runs: b.runs, balls: b.balls };
        }
      });
      inn.bowlers.forEach(bw => {
        if (bw.wickets > bestBowler.wickets || (bw.wickets === bestBowler.wickets && bw.runsConceded < bestBowler.runs)) {
          bestBowler = { name: bw.name, wickets: bw.wickets, runs: bw.runsConceded };
        }
      });
    };

    processInningsPerformers(match.innings1);
    processInningsPerformers(match.innings2);

    return { bestBatter, bestBowler };
  }, [match]);

  // Compute Player of the Match
  const playerOfTheMatch = useMemo(() => {
    if (!match || (!match.innings1 && !match.innings2)) return null;

    const statsMap: { [key: string]: { name: string; runs: number; balls: number; wickets: number; runsConceded: number; fours: number; sixes: number; maidens: number; ballsBowled: number } } = {};

    const getOrCreatePlayer = (name: string) => {
      const key = name.trim().toLowerCase();
      if (!statsMap[key]) {
        statsMap[key] = { name: name.trim(), runs: 0, balls: 0, wickets: 0, runsConceded: 0, fours: 0, sixes: 0, maidens: 0, ballsBowled: 0 };
      }
      return statsMap[key];
    };

    const processInnings = (inn: Innings | null) => {
      if (!inn) return;
      inn.batsmen.forEach(b => {
        if (!b.name) return;
        const p = getOrCreatePlayer(b.name);
        p.runs += b.runs;
        p.balls += b.balls;
        p.fours += (b.fours || 0);
        p.sixes += (b.sixes || 0);
      });
      inn.bowlers.forEach(bw => {
        if (!bw.name) return;
        const p = getOrCreatePlayer(bw.name);
        p.wickets += bw.wickets;
        p.runsConceded += bw.runsConceded;
        p.maidens += (bw.maidens || 0);
        p.ballsBowled += (bw.ballsBowled || 0);
      });
    };

    processInnings(match.innings1);
    processInnings(match.innings2);

    let bestPlayer = null;
    let maxPoints = -1;

    for (const key in statsMap) {
      const p = statsMap[key];
      // Formula: runs + wickets * 25
      const points = p.runs + (p.wickets * 25);

      if (points > maxPoints) {
        maxPoints = points;
        bestPlayer = p;
      } else if (points === maxPoints && points > 0) {
        // Tie breakers: wickets first, then lower runsConceded, then higher runs
        if (bestPlayer && p.wickets > bestPlayer.wickets) {
          bestPlayer = p;
        } else if (bestPlayer && p.wickets === bestPlayer.wickets && p.runsConceded < bestPlayer.runsConceded) {
          bestPlayer = p;
        } else if (bestPlayer && p.wickets === bestPlayer.wickets && p.runsConceded === bestPlayer.runsConceded && p.runs > bestPlayer.runs) {
          bestPlayer = p;
        }
      }
    }

    if (bestPlayer && (bestPlayer.runs > 0 || bestPlayer.wickets > 0)) {
      return {
        ...bestPlayer,
        points: Math.round(maxPoints)
      };
    }
    return null;
  }, [match]);

  const filteredMatchHistory = useMemo(() => {
    return matchHistory.filter((past) => {
      // Date range filtering
      if (restorableStartDate) {
        if (past.date < restorableStartDate) return false;
      }
      if (restorableEndDate) {
        if (past.date > restorableEndDate) return false;
      }
      
      // Search matching team names, winner, or date
      if (restorableSearchQuery.trim()) {
        const query = restorableSearchQuery.toLowerCase().trim();
        const matchesTeamA = past.teamA?.toLowerCase().includes(query);
        const matchesTeamB = past.teamB?.toLowerCase().includes(query);
        const matchesWinner = past.winner?.toLowerCase().includes(query);
        const matchesWinReason = past.winReason?.toLowerCase().includes(query);
        const matchesDate = past.date?.toLowerCase().includes(query);
        return matchesTeamA || matchesTeamB || matchesWinner || matchesWinReason || matchesDate;
      }
      
      return true;
    });
  }, [matchHistory, restorableSearchQuery, restorableStartDate, restorableEndDate]);

  // Team presets managers
  const handleSaveTeam = async () => {
    if (!newTeamName.trim() || !newTeamPlayersText.trim()) {
      showNotification('Please enter a team name and player list!', 'alert');
      return;
    }
    const playersList = newTeamPlayersText
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (playersList.length < 2) {
      showNotification('At least 2 players are required to pre-save a roster!', 'alert');
      return;
    }

    const teamId = editingTeamId || `team-${Date.now()}`;
    const newTeam: CricketTeam = {
      id: teamId,
      name: newTeamName.trim(),
      players: playersList,
      createdAt: new Date().toISOString()
    };

    if (isFirestoreQuotaExhausted()) {
      setSavedTeams(prev => {
        const next = [...prev.filter(t => t.id !== teamId), newTeam];
        try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
        return next;
      });
      showNotification(`Team "${newTeam.name}" saved locally!`, 'success');
      setNewTeamName('');
      setNewTeamPlayersText('');
      setEditingTeamId(null);
      return;
    }

    try {
      await safeSetDoc(doc(db, 'cricket_teams', teamId), newTeam);
      showNotification(`Team "${newTeam.name}" ${editingTeamId ? 'updated' : 'saved'} successfully!`, 'success');
      setNewTeamName('');
      setNewTeamPlayersText('');
      setEditingTeamId(null);
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
        setSavedTeams(prev => {
          const next = [...prev.filter(t => t.id !== teamId), newTeam];
          try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
          return next;
        });
        showNotification(`Team "${newTeam.name}" saved locally!`, 'success');
        setNewTeamName('');
        setNewTeamPlayersText('');
        setEditingTeamId(null);
      } else {
        handleFirestoreError(err, OperationType.WRITE, `cricket_teams/${teamId}`);
      }
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    setSavedTeams(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
      return next;
    });

    if (isFirestoreQuotaExhausted()) {
      showNotification(`Deleted team "${name}".`, 'info');
      return;
    }

    try {
      await safeDeleteDoc(doc(db, 'cricket_teams', id));
      showNotification(`Deleted team "${name}".`, 'info');
    } catch (err) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(60);
        showNotification(`Deleted team "${name}".`, 'info');
      } else {
        handleFirestoreError(err, OperationType.WRITE, `cricket_teams/${id}`);
      }
    }
  };

  const handleExportMatchPDF = () => {
    if (!match || !match.innings1) {
      showNotification('No match data to export!', 'alert');
      return;
    }

    try {
      showNotification('Generating PDF Match Report...', 'info');
      const doc = new jsPDF();
      
      // Set PDF properties to make it read-only and secured
      doc.setProperties({
        title: "Official Secure Match Ledger",
        subject: "Read-Only Scorecard Summary Records",
        author: "shubhamhingane.in",
        creator: "Developed By shubhamhingane.in +91-7719959593",
        keywords: "read-only, secured, cricket ledger"
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

      const processInningsForPotm = (inn: typeof match.innings1) => {
        if (!inn) return;
        inn.batsmen.forEach(b => {
          if (!b.name) return;
          const p = getOrCreatePlayer(b.name);
          p.runs += b.runs;
          p.balls += b.balls;
          p.fours += b.fours;
          p.sixes += b.sixes;
        });
        inn.bowlers.forEach(bw => {
          if (!bw.name) return;
          const p = getOrCreatePlayer(bw.name);
          p.wickets += bw.wickets;
          p.runsConceded += bw.runsConceded;
        });
      };

      processInningsForPotm(match.innings1);
      processInningsForPotm(match.innings2);

      let potmPlayer = 'N/A';
      let potmDetails = '';
      if (playerOfTheMatch) {
        potmPlayer = playerOfTheMatch.name;
        const p = statsMap[playerOfTheMatch.name.trim().toLowerCase()];
        if (p) {
          potmDetails = `${p.runs} runs (${p.fours || 0}x4, ${p.sixes || 0}x6) | ${p.wickets} wickets conceded ${p.runsConceded} runs`;
        } else {
          potmDetails = `${playerOfTheMatch.runs} runs (${playerOfTheMatch.fours || 0}x4, ${playerOfTheMatch.sixes || 0}x6) | ${playerOfTheMatch.wickets} wickets conceded ${playerOfTheMatch.runsConceded} runs`;
        }
      } else {
        let maxPoints = -1;
        for (const key in statsMap) {
          const p = statsMap[key];
          const points = p.runs + (p.wickets * 25);
          if (points > maxPoints && points > 0) {
            maxPoints = points;
            potmPlayer = p.name;
            potmDetails = `${p.runs} runs (${p.fours}x4, ${p.sixes}x6) | ${p.wickets} wickets conceded ${p.runsConceded} runs`;
          }
        }
      }

      // Find top scorers
      let topBatterName = 'N/A';
      let topBatterRuns = 0;
      let topBowlerName = 'N/A';
      let topBowlerWickets = 0;
      let topBowlerRuns = 999;
      
      const findHighlights = (inn: typeof match.innings1) => {
        if (!inn) return;
        inn.batsmen.forEach(b => {
          if (b.runs > topBatterRuns) {
            topBatterRuns = b.runs;
            topBatterName = b.name;
          }
        });
        inn.bowlers.forEach(bw => {
          if (bw.wickets > topBowlerWickets) {
            topBowlerWickets = bw.wickets;
            topBowlerName = bw.name;
            topBowlerRuns = bw.runsConceded;
          } else if (bw.wickets === topBowlerWickets && bw.runsConceded < topBowlerRuns) {
            topBowlerName = bw.name;
            topBowlerRuns = bw.runsConceded;
          }
        });
      };
      findHighlights(match.innings1);
      findHighlights(match.innings2);

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
      doc.text(`Match Date: ${match.date || 'N/A'}`, 14, 33);
      
      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 37, 196, 37);
      
      // Match Header Summary
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${match.teamA} vs ${match.teamB}`, 14, 45);
      
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Overs Limit: ${match.oversLimit || 'N/A'} Overs`, 14, 51);
      doc.text(`Toss Winner: ${match.tossWinner} (elected to ${match.tossChoice} first)`, 14, 56);
      
      if (match.status === 'completed') {
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(190, 110, 11);
        doc.text(`Result: ${match.winner === 'Tie' ? 'Match Tie!' : `${match.winner} ${match.winReason}`}`, 14, 63);
      } else {
        doc.setTextColor(70);
        doc.text(`Status: Match Currently Live`, 14, 63);
      }
      
      // Match Outstanding Highlights Panel Card
      doc.setFillColor(245, 247, 250);
      doc.rect(14, 68, 182, 24, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129); // Emerald color
      doc.text('★ Developed By Shubham Hingane +91-7719959593', 18, 74);
      
      doc.setTextColor(40);
      doc.setFontSize(8.5);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Player of the Match: ${potmPlayer !== 'N/A' ? `${potmPlayer} (${potmDetails})` : 'TBD (requires runs/wickets)'}`, 18, 80);
      
      const batterText = topBatterName !== 'N/A' ? `${topBatterName} (${topBatterRuns} runs)` : 'None yet';
      const bowlerText = topBowlerName !== 'N/A' ? `${topBowlerName} (${topBowlerWickets} wkts / ${topBowlerRuns} runs)` : 'None yet';
      doc.text(`Best Innings Batting: ${batterText}   |   Best Bowling Figures: ${bowlerText}`, 18, 86);

      // Innings 1 Card
      doc.setTextColor(30);
      doc.setFontSize(13);
      doc.setFont('Helvetica', 'bold');
      doc.text(`1st Innings: ${match.innings1.battingTeam} Scorecard`, 14, 102);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Total Score: ${match.innings1.runs}/${match.innings1.wickets} in ${formatOvers(match.innings1.ballsBowled)} overs`, 14, 107);
      
      // Innings 1 Batting table
      const inn1BatRows = match.innings1.batsmen.map(b => [
        b.name,
        b.isOut ? (b.outMode ? `Out (${b.outMode}${b.dismissedBy ? ` - bowling: ${b.dismissedBy}` : ''})` : 'Out') : 'not out',
        b.runs.toString(),
        b.balls.toString(),
        b.fours.toString(),
        b.sixes.toString(),
        b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'
      ]);
      
      autoTable(doc, {
        startY: 111,
        head: [['Batsman', 'Dismissal Status', 'Runs', 'Balls', '4s', '6s', 'S/R']],
        body: inn1BatRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 8.5 }
      });
      
      let lastY1 = (doc as any).lastAutoTable.finalY;
      
      // Extras break-out line
      const ext1 = match.innings1.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
      const extTotal1 = ext1.wides + ext1.noBalls + ext1.byes + ext1.legByes + (ext1.penalty || 0);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(60);
      doc.text(`Extras: ${extTotal1} (wides: ${ext1.wides}, no-balls: ${ext1.noBalls}, byes: ${ext1.byes}, legbyes: ${ext1.legByes}, penalty: ${ext1.penalty || 0})`, 14, lastY1 + 6);
      
      // Fall of Wickets line
      const fowItems1 = match.innings1.fallOfWickets && match.innings1.fallOfWickets.length > 0
        ? match.innings1.fallOfWickets.map(fw => `Wkt ${fw.wicketNo}: ${fw.score} (${fw.batsmanName}, Ov ${fw.oversList})`).join(' | ')
        : 'No wickets fell';
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Fall of Wickets: ${fowItems1}`, 14, lastY1 + 11);
      
      let bowlStartY1 = lastY1 + 16;
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30);
      doc.text(`${match.innings1.battingTeam} Bowlers Performance`, 14, bowlStartY1);
      
      const inn1BowlRows = match.innings1.bowlers.map(bw => [
        bw.name,
        formatOvers(bw.ballsBowled),
        bw.maidens.toString(),
        bw.runsConceded.toString(),
        bw.wickets.toString(),
        bw.ballsBowled > 0 ? ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2) : '0.00'
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
      if (match.innings2) {
        if (nextY > 200) {
          doc.addPage();
          nextY = 20;
        }
        
        doc.setFontSize(13);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(`2nd Innings: ${match.innings2.battingTeam} Scorecard`, 14, nextY);
        
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Total Score: ${match.innings2.runs}/${match.innings2.wickets} in ${formatOvers(match.innings2.ballsBowled)} overs`, 14, nextY + 6);
        
        // Innings 2 Batting table
        const inn2BatRows = match.innings2.batsmen.map(b => [
          b.name,
          b.isOut ? (b.outMode ? `Out (${b.outMode}${b.dismissedBy ? ` - bowling: ${b.dismissedBy}` : ''})` : 'Out') : 'not out',
          b.runs.toString(),
          b.balls.toString(),
          b.fours.toString(),
          b.sixes.toString(),
          b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'
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
        
        // Extras break-out line Innings 2
        const ext2 = match.innings2.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
        const extTotal2 = ext2.wides + ext2.noBalls + ext2.byes + ext2.legByes + (ext2.penalty || 0);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(60);
        doc.text(`Extras: ${extTotal2} (wides: ${ext2.wides}, no-balls: ${ext2.noBalls}, byes: ${ext2.byes}, legbyes: ${ext2.legByes}, penalty: ${ext2.penalty || 0})`, 14, lastY2 + 6);
        
        // Fall of Wickets line Innings 2
        const fowItems2 = match.innings2.fallOfWickets && match.innings2.fallOfWickets.length > 0
          ? match.innings2.fallOfWickets.map(fw => `Wkt ${fw.wicketNo}: ${fw.score} (${fw.batsmanName}, Ov ${fw.oversList})`).join(' | ')
          : 'No wickets fell';
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Fall of Wickets: ${fowItems2}`, 14, lastY2 + 11);
        
        let bowlStartY2 = lastY2 + 16;
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30);
        doc.text(`${match.innings2.battingTeam} Bowlers Performance`, 14, bowlStartY2);
        
        const inn2BowlRows = match.innings2.bowlers.map(bw => [
          bw.name,
          formatOvers(bw.ballsBowled),
          bw.maidens.toString(),
          bw.runsConceded.toString(),
          bw.wickets.toString(),
          bw.ballsBowled > 0 ? ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2) : '0.00'
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
      doc.text('Key Commentary & Delivery Logs', 14, nextY);
      
      // Collect commentary lines
      const logsCombined: string[][] = [];
      const appendCommentary = (inn: typeof match.innings1) => {
        if (!inn) return;
        inn.commentaryList.slice().reverse().forEach(comm => {
          let badgeType = "Ball";
          if (comm.type === 'wicket') badgeType = "WICKET 🔴";
          else if (comm.type === 'boundary') {
            const isSix = comm.description.toLowerCase().includes('six') || comm.description.toLowerCase().includes('6 runs');
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
      
      appendCommentary(match.innings1);
      if (match.innings2) {
        appendCommentary(match.innings2);
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
      
      doc.save(`gully_scorepad_match_${match.id || Date.now()}.pdf`);
      showNotification('PDF Match Report exported successfully!', 'success');
    } catch (err) {
      console.error('PDF export crashed:', err);
      showNotification('Failed to compile PDF sheet. Check parameters.', 'alert');
    }
  };

  // early return for live cricket scoreboard scoring pad (100vh viewport constraint)
  const isScoringDisabled = isInningsLocked || match.status === 'completed';

  if (match.status === 'live' && currentInnings && !isSpectator) {
    const last5Commentaries = currentInnings.commentaryList 
      ? [...currentInnings.commentaryList].reverse().slice(0, 5) 
      : [];

    return (
      <div className="h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden flex flex-col font-sans select-none relative dark">
        {/* TOP COMPACT NAV (Height: 3rem / 48px) */}
        <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-2 sm:px-4 shrink-0 shadow-lg select-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-black tracking-widest text-white uppercase shrink-0">
              GULLY<span className="text-amber-400 italic">SCORE</span>
            </span>
            
            {saveStatus && (
              <button
                type="button"
                onClick={() => {
                  if (saveStatus === 'error') {
                    retrySaveNow();
                  }
                }}
                className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md flex items-center gap-1 ml-1 sm:ml-2 border border-slate-800 transition-all duration-300 ${
                  saveStatus === 'saving' 
                    ? 'bg-amber-500/10 text-amber-400' 
                    : saveStatus === 'saved'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-rose-500/10 text-rose-400 cursor-pointer hover:bg-rose-500/20'
                }`}
                title={saveStatus === 'error' ? 'Sync error - Click to retry saving to cloud' : saveStatus === 'saved' ? 'Real-time score synced to cloud' : 'Saving score to cloud...'}
              >
                <span className={`w-1 h-1 rounded-full ${
                  saveStatus === 'saving' 
                    ? 'bg-amber-400 animate-pulse' 
                    : saveStatus === 'saved'
                    ? 'bg-emerald-400'
                    : 'bg-rose-400 animate-bounce'
                }`} />
                <span>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Cloud Synced' : 'Retry Sync ⚠️'}
                </span>
              </button>
            )}

          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 font-sans overflow-x-auto max-w-[calc(100vw-100px)] sm:max-w-none pr-1">
            {match.id && (
              <button
                onClick={() => setShowLivePreview(prev => !prev)}
                className={`h-8 sm:h-9 px-1.5 sm:px-3 border-none rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                  showLivePreview 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-500/15' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                id="toggle-live-preview-pane"
                title="Toggle Live Spectator Preview Panel right here"
              >
                {showLivePreview ? <Eye className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> : <Eye className="w-3.5 h-3.5" />}
                <span>Live View {showLivePreview ? '◀' : '📊'}</span>
              </button>
            )}

            {match.id && match.status !== 'setup' && (
              <>
                <button
                  onClick={handleExportMatchPDF}
                  className="h-8 sm:h-9 px-1.5 sm:px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 border-none rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-0.5 transition-all text-white shrink-0"
                  title="Export PDF Report"
                >
                  <FileDown size={12} />
                  <span className="hidden md:inline">PDF</span>
                </button>

                <button
                  onClick={() => setSoundEnabled(prev => !prev)}
                  className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-200 border-none rounded-lg sm:rounded-xl cursor-pointer transition-all shrink-0"
                  title={soundEnabled ? "Mute Audio" : "Unmute Audio"}
                >
                  {soundEnabled ? <Volume2 size={13} className="text-emerald-450" /> : <VolumeX size={13} className="text-rose-450" />}
                </button>

            <button
              onClick={handleUndoAction}
              disabled={undoStack.length === 0}
              className={`h-8 sm:h-9 px-1.5 sm:px-3 border-none rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0 ${
                undoStack.length === 0 
                  ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed' 
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
              }`}
              title="Undo last action (limited to last 5)"
            >
              <Undo size={12} />
              <span className="hidden xs:inline">Undo </span><span>({undoStack.length})</span>
            </button>

            {declareInningsConfirm ? (
              <div className="flex items-center gap-1 shrink-0 bg-slate-950 p-1 border border-amber-500/30 rounded-lg">
                <span className="text-[8px] font-black text-amber-500 uppercase px-1">Lock Innings?</span>
                <button
                  onClick={() => {
                    handleDeclareInnings();
                    setIsInningsLocked(true);
                    setDeclareInningsConfirm(false);
                  }}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-extrabold text-[8px] uppercase cursor-pointer border-none"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setDeclareInningsConfirm(false)}
                  className="px-1.5 py-1 bg-slate-800 text-slate-350 rounded font-extrabold text-[8px] uppercase cursor-pointer border-none"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeclareInningsConfirm(true)}
                className="h-8 sm:h-9 px-1.5 sm:px-3 bg-emerald-600 hover:bg-emerald-500 text-white border-none rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0"
                title="End Innings"
              >
                <Lock size={11} />
                <span className="hidden sm:inline">End Innings</span>
                <span className="inline sm:hidden">End</span>
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8 sm:h-9 sm:w-9 bg-slate-800 text-slate-300 rounded-lg sm:rounded-xl flex items-center justify-center border-none cursor-pointer hover:bg-slate-700 shrink-0"
              title="Toggle sound"
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>

            <button
              onClick={async () => {
                const draftMatch: MatchState = {
                  ...match,
                  status: 'draft',
                  version: (match.version || 0) + 1,
                  updatedAt: Date.now()
                };
                showNotification('Saving match as draft...', 'info');

                // Cancel any pending debounced auto-saves of active match
                if (savingTimeoutRef.current) {
                  clearTimeout(savingTimeoutRef.current);
                  savingTimeoutRef.current = null;
                }
                latestStateToSaveRef.current = null;

                // Save to local registry and state immediately
                unmarkMatchDeleted(draftMatch.id);
                saveMatchToRegistry(draftMatch);
                setSavedDrafts(prev => [draftMatch, ...prev.filter(d => d.id !== draftMatch.id)]);

                try {
                  localStorage.removeItem('cricket_active_match');
                } catch (e) {}

                // Reset match state back to setup mode
                setMatch({
                  id: '',
                  teamA: '',
                  teamB: '',
                  oversLimit: 5,
                  tossWinner: '',
                  tossChoice: 'bat',
                  currentInningsNum: 1,
                  innings1: null,
                  innings2: null,
                  status: 'setup',
                  date: '',
                  freeHitNext: false
                });
                setSearchParams({});
                setActiveHistoryTab('drafts');
                setShowHistory(true);

                // Persist sanitized draft to Firestore
                if (draftMatch.id && !isFirestoreQuotaExhausted()) {
                  try {
                    await safeSetDoc(doc(db, 'cricket_matches', draftMatch.id), sanitizeForFirestore(draftMatch));
                    showNotification(`Match saved as draft: ${draftMatch.teamA} vs ${draftMatch.teamB}!`, 'success');
                  } catch (e) {
                    if (isQuotaError(e)) {
                      recordFirestoreQuotaExhaustion(60);
                    }
                    console.warn('Draft saved locally, Firestore sync error:', e);
                    showNotification(`Match saved as draft locally: ${draftMatch.teamA} vs ${draftMatch.teamB}!`, 'success');
                  }
                } else {
                  showNotification(`Match saved as draft locally: ${draftMatch.teamA} vs ${draftMatch.teamB}!`, 'success');
                }
              }}
              className="h-8 sm:h-9 px-1.5 sm:px-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold border-none rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0"
              title="Save Match as Draft & Exit"
            >
              <Save size={12} />
              <span className="hidden sm:inline">Save Draft</span>
            </button>

            {!isSpectator && (
              <>
                <button
                  onClick={() => {
                    setEditModalTeamA(match.teamA);
                    setEditModalTeamB(match.teamB);
                    setEditModalOversLimit(match.oversLimit);
                    if (currentInnings) {
                      setEditModalRuns(currentInnings.runs);
                      setEditModalWickets(currentInnings.wickets);
                      setEditModalBallsBowled(currentInnings.ballsBowled);
                    } else {
                      setEditModalRuns(0);
                      setEditModalWickets(0);
                      setEditModalBallsBowled(0);
                    }
                    setShowEditMatchModal(true);
                  }}
                  className="h-8 sm:h-9 px-1.5 sm:px-3 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white font-extrabold border border-indigo-550/30 rounded-lg sm:rounded-xl text-[10px] uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0"
                  title="Edit Match Details (Team Names, Overs limit)"
                >
                  <Edit size={12} />
                  <span className="hidden sm:inline">Edit Setup</span>
                </button>

                <button
                  onClick={() => setShowDlsCalculator(true)}
                  className="h-8 sm:h-9 px-1.5 sm:px-3 bg-teal-600/20 hover:bg-teal-650 text-teal-400 hover:text-white border border-teal-550/20 rounded-lg sm:rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0"
                  title="Rain Target DLS Calculator Tool"
                >
                  <CloudRain size={12} className="animate-pulse" />
                  <span>DLS Tool</span>
                </button>

                <button
                  onClick={handleResetMatch}
                  className="h-8 sm:h-9 px-1.5 sm:px-2.5 bg-rose-600/20 hover:bg-rose-650 text-rose-400 hover:text-white rounded-lg sm:rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center gap-1 shrink-0"
                  title="Discard & Reset Match"
                >
                  <Trash2 size={12} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </>
            )}
              </>
            )}
          </div>
        </header>

        {/* VIEW DIVIDER CONTAINER wrapper for live preview split-pane layout */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-row relative">

          {/* MAIN PANEL CONTENT GRID (calc(100vh - 3rem - mobileTabsHeight)) */}
          {false ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-5xl mx-auto select-text font-sans pb-10" id="match-summary-tab-panel">
              {/* Header result banner */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-2 shadow-lg">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#fbbf24] block">
                  ★ Match Summary Console ★
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-none" id="summary-headline">
                  {match.winner === 'Tie' ? 'MATCH TIED' : match.winner ? `${match.winner} WON` : 'MATCH IN PROGRESS'}
                </h1>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                  {match.winner ? match.winReason || 'Winner by dynamic calculations' : `${match.teamA} vs ${match.teamB} is currently live`}
                </p>
              </div>

              {/* Innings summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Innings 1 box */}
                {match.innings1 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Innings 1</span>
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-500 rounded text-[9px] font-mono tracking-wide">
                        {match.innings1.battingTeam === match.teamA ? 'TEAM A' : 'TEAM B'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-sans">
                      <h3 className="text-lg font-black text-white uppercase truncate max-w-[200px]">{match.innings1.battingTeam}</h3>
                      <div className="text-right font-mono">
                        <strong className="text-xl font-black text-emerald-400">{match.innings1.runs}/{match.innings1.wickets}</strong>
                        <span className="text-xs text-slate-500 block">({formatOvers(match.innings1.ballsBowled || 0)} Overs)</span>
                      </div>
                    </div>
                    {/* Performance metrics inside Innings 1 */}
                    {match.innings1.batsmen && match.innings1.batsmen.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-850 pt-3">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Innings Top Batsman:</span>
                        {(() => {
                          const inn1BestBat = [...match.innings1.batsmen].sort((a, b) => b.runs - a.runs)[0];
                          return inn1BestBat && inn1BestBat.runs > 0 ? (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300">{inn1BestBat.name}</span>
                              <span className="font-mono text-slate-400 font-bold">{inn1BestBat.runs} runs ({inn1BestBat.balls}b)</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">No runs scored yet</span>
                          );
                        })()}
                      </div>
                    )}
                    {match.innings1.bowlers && match.innings1.bowlers.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-850 pt-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Innings Best Bowler:</span>
                        {(() => {
                          const inn1BestBowl = [...match.innings1.bowlers].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0];
                          return inn1BestBowl && (inn1BestBowl.wickets > 0 || inn1BestBowl.runsConceded > 0) ? (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300">{inn1BestBowl.name}</span>
                              <span className="font-mono text-slate-400 font-bold">
                                {inn1BestBowl.wickets}-{inn1BestBowl.runsConceded} ({formatOvers(inn1BestBowl.ballsBowled)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">No wickets taken yet</span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-3xl p-6 text-center text-xs text-slate-500 italic flex items-center justify-center">
                    Innings 1 has not commenced.
                  </div>
                )}

                {/* Innings 2 box */}
                {match.innings2 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Innings 2</span>
                      <span className="px-2 py-0.5 bg-slate-950 text-slate-500 rounded text-[9px] font-mono tracking-wide">
                        {match.innings2.battingTeam === match.teamA ? 'TEAM A' : 'TEAM B'}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between font-sans">
                      <h3 className="text-lg font-black text-white uppercase truncate max-w-[200px]">{match.innings2.battingTeam}</h3>
                      <div className="text-right font-mono">
                        <strong className="text-xl font-black text-emerald-400">{match.innings2.runs}/{match.innings2.wickets}</strong>
                        <span className="text-xs text-slate-500 block">({formatOvers(match.innings2.ballsBowled || 0)} Overs)</span>
                      </div>
                    </div>
                    {/* Performance metrics inside Innings 2 */}
                    {match.innings2.batsmen && match.innings2.batsmen.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-850 pt-3">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Innings Top Batsman:</span>
                        {(() => {
                          const inn2BestBat = [...match.innings2.batsmen].sort((a, b) => b.runs - a.runs)[0];
                          return inn2BestBat && inn2BestBat.runs > 0 ? (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300">{inn2BestBat.name}</span>
                              <span className="font-mono text-slate-400 font-bold">{inn2BestBat.runs} runs ({inn2BestBat.balls}b)</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">No runs scored yet</span>
                          );
                        })()}
                      </div>
                    )}
                    {match.innings2.bowlers && match.innings2.bowlers.length > 0 && (
                      <div className="space-y-1.5 border-t border-slate-850 pt-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">Innings Best Bowler:</span>
                        {(() => {
                          const inn2BestBowl = [...match.innings2.bowlers].sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0];
                          return inn2BestBowl && (inn2BestBowl.wickets > 0 || inn2BestBowl.runsConceded > 0) ? (
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-300">{inn2BestBowl.name}</span>
                              <span className="font-mono text-slate-400 font-bold">
                                {inn2BestBowl.wickets}-{inn2BestBowl.runsConceded} ({formatOvers(inn2BestBowl.ballsBowled)})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600 italic">No wickets yet</span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900/30 border border-slate-850 border-dashed rounded-3xl p-6 text-center text-xs text-slate-500 italic flex items-center justify-center">
                    Second innings has not commenced.
                  </div>
                )}
              </div>

              {/* Top performers dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Top Batsman Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block border-b border-slate-800 pb-2">🥇 Match Top Scorer</span>
                  {topBatsmanOfTheMatch ? (
                    <div className="pt-1.5 space-y-3">
                      <div>
                        <strong className="text-sm font-extrabold text-white block">{topBatsmanOfTheMatch.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Top Batsman</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-850 text-center">
                        <div>
                          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">Runs</span>
                          <strong className="text-base font-mono text-emerald-400 mt-0.5 block">{topBatsmanOfTheMatch.runs}</strong>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">Balls</span>
                          <strong className="text-base font-mono text-slate-300 mt-0.5 block">{topBatsmanOfTheMatch.balls}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No runs recorded.</p>
                  )}
                </div>

                {/* 2. Top Bowler Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#22d3ee] block border-b border-slate-800 pb-2">🍒 Match Best Economy</span>
                  {mostEconomicalBowlerOfTheMatch ? (
                    <div className="pt-1.5 space-y-3">
                      <div>
                        <strong className="text-sm font-extrabold text-white block">{mostEconomicalBowlerOfTheMatch.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider font-bold">Most Economical Spell</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-850 text-center">
                        <div>
                          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">Econ R.</span>
                          <strong className="text-base font-mono text-cyan-455 text-cyan-400 mt-0.5 block">{mostEconomicalBowlerOfTheMatch.econ}</strong>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">Wickets</span>
                          <strong className="text-base font-mono text-slate-300 mt-0.5 block">{mostEconomicalBowlerOfTheMatch.wickets}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-3 text-center">No bowler completed 1 over.</p>
                  )}
                </div>

                {/* 3. Player Of the Match Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-md relative overflow-hidden">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#fbbf24] block border-b border-slate-800 pb-2">🌟 Player of the Match</span>
                  {playerOfTheMatch ? (
                    <div className="pt-1.5 space-y-3">
                      <div>
                        <strong className="text-sm font-extrabold text-[#fbbf24] block truncate">{playerOfTheMatch.name}</strong>
                        <span className="text-[10px] text-slate-555 text-slate-500 font-mono uppercase tracking-wider">MVP Performer</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-850 flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-mono">Runs: <strong className="text-white">{playerOfTheMatch.runs}</strong></span>
                        <span className="text-slate-400 font-mono">Wkts: <strong className="text-[#fbbf24]">{playerOfTheMatch.wickets}</strong></span>
                        <span className="text-slate-400 font-mono">Points: <strong className="text-emerald-400">{playerOfTheMatch.points}</strong></span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic py-3 text-center">MVP candidates pending actions.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden min-h-0 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2">
          
          {/* COLUMN 1: Score overview, Last 5 action logs, Live Commentary Stream */}
          <div className={`flex flex-col gap-2 min-h-0 overflow-hidden ${
            activeMobileTab === 'feed' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-3`}>
            {/* Scorebox card */}
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl shrink-0 space-y-2 shadow-md">
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded text-[8px] font-black uppercase tracking-widest">
                  Innings {match.currentInningsNum} Active
                </span>
                {match.targetRuns && (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                    Target: {match.targetRuns}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-[10px] text-slate-450 font-black uppercase tracking-widest truncate">
                  {currentInnings.battingTeam} is Batting
                </h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black font-mono leading-none text-white flex items-center">
                    <motion.span
                      key={`runs-sidebar-${currentInnings.runs}`}
                      initial={{ scale: 0.7, opacity: 0.5 }}
                      animate={{ scale: [1.3, 1], opacity: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15 }}
                      className="inline-block"
                    >
                      {currentInnings.runs}
                    </motion.span>
                    <span className="mx-1.5">-</span>
                    <motion.span
                      key={`wickets-sidebar-${currentInnings.wickets}`}
                      initial={{ scale: 0.7, opacity: 0.5 }}
                      animate={{ scale: [1.3, 1], opacity: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 15 }}
                      className="inline-block text-rose-500"
                    >
                      {currentInnings.wickets}
                    </motion.span>
                  </span>
                  <span className="text-xs text-slate-400 font-bold font-mono">
                    ({formatOvers(currentInnings.ballsBowled)} ov)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-1.5 text-center">
                <div>
                  <span className="text-[7px] uppercase font-bold text-slate-500 block">CRR</span>
                  <span className="font-mono text-xs font-black text-amber-300 block">
                    <motion.span
                      key={`crr-sidebar-${calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}`}
                      initial={{ scale: 0.7 }}
                      animate={{ scale: [1.2, 1] }}
                      transition={{ duration: 0.2 }}
                      className="inline-block"
                    >
                      {calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}
                    </motion.span>
                  </span>
                </div>
                {match.currentInningsNum === 2 && match.targetRuns && (
                  <div>
                    <span className="text-[7px] uppercase font-bold text-slate-500 block">RRR</span>
                    <span className="font-mono text-xs font-black text-amber-300 block">
                      <motion.span
                        key={`rrr-sidebar-${(() => {
                          const ballsLeft = (match.oversLimit * 6) - currentInnings.ballsBowled;
                          const runsToGet = match.targetRuns - currentInnings.runs;
                          if (ballsLeft <= 0) return '0.00';
                          return ((runsToGet / Math.max(1, ballsLeft)) * 6).toFixed(2);
                        })()}`}
                        initial={{ scale: 0.7 }}
                        animate={{ scale: [1.2, 1] }}
                        transition={{ duration: 0.2 }}
                        className="inline-block"
                      >
                        {(() => {
                          const ballsLeft = (match.oversLimit * 6) - currentInnings.ballsBowled;
                          const runsToGet = match.targetRuns - currentInnings.runs;
                          if (ballsLeft <= 0) return '0.00';
                          return ((runsToGet / Math.max(1, ballsLeft)) * 6).toFixed(2);
                        })()}
                      </motion.span>
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[7px] uppercase font-bold text-slate-500 block">Balls Max</span>
                  <span className="font-mono text-xs font-black text-slate-300">
                    {match.oversLimit * 6}
                  </span>
                </div>
              </div>

              {match.currentInningsNum === 2 && match.targetRuns && (
                <div className="bg-amber-500/5 border border-amber-500/10 p-2 rounded-xl text-center text-[10px] font-bold text-amber-300">
                  {match.targetRuns - currentInnings.runs > 0 ? (
                    <span>Need <strong className="font-black text-xs">{match.targetRuns - currentInnings.runs}</strong> runs to win off <strong className="font-black text-xs">{(match.oversLimit * 6) - currentInnings.ballsBowled}</strong> deliveries</span>
                  ) : (
                    <span className="text-emerald-400 font-black uppercase tracking-wide animate-pulse">Target Achieved!</span>
                  )}
                </div>
              )}
            </div>

            {/* Integrated Live Broadcast Overlay Graphics Control Panel */}
            <div className="flex-1 p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-lg">
              {(() => {
                const AVAILABLE_QUEUE_GRAPHICS = [
                  { id: 'score_bug', label: 'Main Scoreboard' },
                  { id: 'batsman_stats', label: 'Batsman Stats' },
                  { id: 'bowler_stats', label: 'Bowler Stats' },
                  { id: 'partnership', label: 'Partnership Card' },
                  { id: 'worm_graph', label: 'Runs Worm' },
                  { id: 'match_summary', label: 'Match Summary' },
                  { id: 'team_comparison', label: 'Team Comparison' },
                  { id: 'lower_third', label: 'Lower Third Bar' },
                ];

                const activeOverlayConfig = match.overlayConfig || {
                  template: 'broadcast-pro',
                  showStatsPanel: true,
                  showTicker: true,
                  tickerMessage: 'LIVE BROADCAST PRESENTATION',
                  forceInningsLayout: 0,
                  manualWicketTrigger: false,
                  manualOutsDisplay: 'none',
                  manualFreeHitTrigger: false,
                  teamAColor: '#ea002a',
                  teamBColor: '#00529b',
                  showScoreBug: true,
                  customBanner: 'none',
                  customBannerText: '',
                  activeGraphic: 'none',
                  lowerThirdMode: 'intro',
                  selectedUmpireSignal: 'out',
                  customMilestone: null
                };

                const currentActiveGraphic = activeOverlayConfig.activeGraphic || 'none';

                const updateOverlayProp = (updates: Partial<typeof activeOverlayConfig>) => {
                  const updated = { ...activeOverlayConfig, ...updates };
                  syncMatch({ ...match, overlayConfig: updated });

                  // Handle auto-close for Wicket and Milestone alerts after 5 seconds to keep broadcast clean
                  if (updates.activeGraphic === 'wicket_alert_temp' || updates.activeGraphic === 'milestone_alert_temp') {
                    if (graphicDismissTimerRef.current) {
                      clearTimeout(graphicDismissTimerRef.current);
                    }
                    graphicDismissTimerRef.current = setTimeout(() => {
                      setMatch((latestMatch) => {
                        if (
                          latestMatch.overlayConfig?.activeGraphic === 'wicket_alert_temp' ||
                          latestMatch.overlayConfig?.activeGraphic === 'milestone_alert_temp'
                        ) {
                          const noneConfig = { ...latestMatch.overlayConfig, activeGraphic: 'none' };
                          const nextMatch = { ...latestMatch, overlayConfig: noneConfig };
                          setTimeout(() => queueDebouncedSave(nextMatch), 0);
                          return nextMatch;
                        }
                        return latestMatch;
                      });
                      showNotification('Broadcast alert overlay auto-closed after 5 seconds.', 'info');
                    }, 5000);
                  }
                };

                const triggerManualAlert = (type: 'six' | 'four' | 'wicket') => {
                  updateOverlayProp({
                    manualAlertTrigger: {
                      type,
                      timestamp: Date.now()
                    }
                  });
                  showNotification(`Broadcast Alert: ${type.toUpperCase()} animated visual triggered!`, 'success');
                };

                return (
                  <>
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-800/60 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                        </span>
                        <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest leading-none">TV Graphics Cockpit</span>
                      </div>
                      
                      {/* Live Sync Status Indicator */}
                      {Date.now() - lastOverlayPing < 4500 ? (
                        <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono text-[7px] font-black uppercase tracking-wider animate-pulse leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span>📡 Sync Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono text-[7px] font-black uppercase tracking-wider leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span>📡 Sync Offline</span>
                        </div>
                      )}
                    </div>

                    {/* Controller Mode Tabs */}
                    <div className="grid grid-cols-5 gap-1 mb-2 bg-slate-950 p-1 rounded-xl shrink-0">
                      {[
                        { id: 'alerts', label: '🚀 Alerts' },
                        { id: 'graphics', label: '📊 Display' },
                        { id: 'sequencer', label: '🔁 Queue' },
                        { id: 'templates', label: '🎨 Theme' },
                        { id: 'media', label: '🖼️ Media' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveControlTab(tab.id as any)}
                          className={`py-1 text-[8px] font-black uppercase tracking-wider rounded-lg border-none cursor-pointer transition-all ${
                            activeControlTab === tab.id
                              ? 'bg-rose-500/15 text-rose-400 font-extrabold'
                              : 'text-slate-500 bg-transparent hover:text-slate-350'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Quick Screen Clean All overlays button */}
                    <div className="mb-2 shrink-0">
                      <button
                        onClick={() => {
                          updateOverlayProp({
                            activeGraphic: 'none',
                            customBanner: 'none',
                            customBannerText: '',
                            customMilestone: null
                          });
                          showNotification('Cleared all live graphic overlays from broadcast feed.', 'info');
                        }}
                        className="w-full py-1 bg-rose-600/10 hover:bg-rose-600/20 active:scale-[0.98] transition-all border border-rose-500/20 hover:border-rose-500/30 rounded-lg text-rose-400 font-black text-[8px] uppercase tracking-widest cursor-pointer flex items-center justify-center gap-1"
                      >
                        🧹 Clear All Graphics
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar text-left text-xs">
                      {/* --- ALERTS TAB --- */}
                      {activeControlTab === 'alerts' && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[7.5px] font-black text-rose-405 uppercase tracking-widest block mb-1">Instant Fullscreen Blast Overlays</span>
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                onClick={() => triggerManualAlert('four')}
                                className="py-2 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-550/20 hover:border-sky-500/30 text-sky-400 text-[8px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                              >
                                <span className="text-xs">🏏</span>
                                <span>Four</span>
                              </button>
                              <button
                                onClick={() => triggerManualAlert('six')}
                                className="py-2 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-550/20 hover:border-amber-500/30 text-amber-400 text-[8px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                              >
                                <span className="text-xs">🔥</span>
                                <span>Six</span>
                              </button>
                              <button
                                onClick={() => triggerManualAlert('wicket')}
                                className="py-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-550/20 hover:border-rose-500/30 text-rose-400 text-[8px] font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                              >
                                <span className="text-xs">❌</span>
                                <span>Wicket</span>
                              </button>
                            </div>
                          </div>

                          {/* Manual Transient Overlay Animations */}
                          <div className="border border-white/5 bg-slate-950/40 p-2 rounded-2xl space-y-1.5">
                            <span className="text-[7.5px] font-black text-rose-400 uppercase tracking-widest block">Manual Transient Animations</span>
                            <div className="grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'wicket_alert_temp' ? 'none' : 'wicket_alert_temp' })}
                                className={`py-1.5 rounded-xl border text-[8px] font-black uppercase cursor-pointer transition-all truncate flex flex-col items-center justify-center gap-0.5 ${
                                  currentActiveGraphic === 'wicket_alert_temp'
                                    ? 'bg-red-500/20 border-red-500/40 text-red-00'
                                    : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-white/5'
                                }`}
                              >
                                <span className="text-[9px]">🏏</span>
                                <span>Wicket Pop</span>
                              </button>
                              <button
                                onClick={() => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'milestone_alert_temp' ? 'none' : 'milestone_alert_temp' })}
                                className={`py-1.5 rounded-xl border text-[8px] font-black uppercase cursor-pointer transition-all truncate flex flex-col items-center justify-center gap-0.5 ${
                                  currentActiveGraphic === 'milestone_alert_temp'
                                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 font-bold'
                                    : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-white/5'
                                }`}
                              >
                                <span className="text-[9px]">🏆</span>
                                <span>Milestone</span>
                              </button>
                              <button
                                onClick={() => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'wagon_wheel' ? 'none' : 'wagon_wheel' })}
                                className={`py-1.5 rounded-xl border text-[8px] font-black uppercase cursor-pointer transition-all truncate flex flex-col items-center justify-center gap-0.5 ${
                                  currentActiveGraphic === 'wagon_wheel'
                                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold'
                                    : 'bg-slate-950 border-white/5 text-slate-400 hover:bg-white/5'
                                }`}
                              >
                                <span className="text-[9px]">🎡</span>
                                <span>Wagon Wheel</span>
                              </button>
                            </div>

                            {/* Milestone Quick Config options */}
                            {currentActiveGraphic === 'milestone_alert_temp' && (
                              <div className="bg-slate-950 border border-white/5 rounded-xl p-2 space-y-2 text-center mt-1.5">
                                <span className="text-[7px] font-bold text-slate-400 uppercase font-mono block text-left">Quick Configure Selector:</span>
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => updateOverlayProp({ customMilestone: { name: currentInnings.batsmen[currentInnings.strikerIndex]?.name || 'Batter', type: 'fifty', value: 50 } })}
                                    className={`py-1 px-2.5 rounded bg-white/5 font-mono text-[7px] uppercase cursor-pointer transition-all border ${
                                      activeOverlayConfig.customMilestone?.type === 'fifty' ? 'text-amber-500 border-amber-500/30 font-bold' : 'text-slate-400 border-transparent'
                                    }`}
                                  >
                                    50 runs
                                  </button>
                                  <button
                                    onClick={() => updateOverlayProp({ customMilestone: { name: currentInnings.batsmen[currentInnings.strikerIndex]?.name || 'Batter', type: 'hundred', value: 100 } })}
                                    className={`py-1 px-2.5 rounded bg-white/5 font-mono text-[7px] uppercase cursor-pointer transition-all border ${
                                      activeOverlayConfig.customMilestone?.type === 'hundred' ? 'text-amber-500 border-amber-505 font-bold' : 'text-slate-400 border-transparent'
                                    }`}
                                  >
                                    100 runs
                                  </button>
                                  <button
                                    onClick={() => updateOverlayProp({ customMilestone: { name: currentInnings.bowlers[currentInnings.bowlerIndex]?.name || 'Bowler', type: '5wkt', value: 5 } })}
                                    className={`py-1 px-2.5 rounded bg-white/5 font-mono text-[7px] uppercase cursor-pointer transition-all border ${
                                      activeOverlayConfig.customMilestone?.type === '5wkt' ? 'text-amber-500 border-amber-505 font-bold' : 'text-slate-400 border-transparent'
                                    }`}
                                  >
                                    5 Wkts
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-[7.5px] font-black text-slate-405 uppercase tracking-widest block mb-1">Corner Banner Projections</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { id: 'fifty', label: '⭐ 50 runs' },
                                { id: 'hundred', label: '👑 100 runs' },
                                { id: 'drinks', label: '🥤 DRINKS' },
                                { id: 'rain', label: '🌧️ RAIN DELAY' },
                                { id: 'free_hit', label: '⚡ Free Hit' },
                                { id: 'out', label: '🚨 OUT banner' }
                              ].map(btn => {
                                const isBannerActive = activeOverlayConfig.customBanner === btn.id;
                                return (
                                  <button
                                    key={btn.id}
                                    onClick={() => {
                                      const nextBanner = isBannerActive ? 'none' : btn.id;
                                      updateOverlayProp({
                                        customBanner: nextBanner as any,
                                        customBannerText: nextBanner === 'none' ? '' : activeOverlayConfig.customBannerText || ''
                                      });
                                    }}
                                    className={`py-1.5 rounded-xl border text-[8px] font-black uppercase cursor-pointer transition-all truncate ${
                                      isBannerActive
                                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-455 animate-pulse font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                                        : 'bg-slate-950 border-white/5 text-slate-450 hover:bg-white/5'
                                    }`}
                                  >
                                    {btn.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <span className="text-[7.5px] font-black text-slate-405 uppercase tracking-widest block mb-1">Banner custom subtitle text</span>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={activeOverlayConfig.customBannerText || ''}
                                onChange={(e) => updateOverlayProp({ customBannerText: e.target.value })}
                                className="flex-1 min-w-0 bg-slate-950 text-slate-300 rounded-xl text-[9px] px-2 py-1.5 border border-white/5 hover:border-white/10 outline-none uppercase font-mono"
                                placeholder="E.g., SPECTACULAR SHOT!"
                              />
                              {activeOverlayConfig.customBanner !== 'none' && (
                                <button
                                  onClick={() => updateOverlayProp({ customBanner: 'none', customBannerText: '' })}
                                  className="px-2.5 bg-rose-600 hover:bg-rose-500 text-slate-950 rounded-xl font-black text-[9px] uppercase border-none cursor-pointer transition-all"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- GRAPHICS DISPLAY TAB --- */}
                      {activeControlTab === 'graphics' && (
                        <div className="space-y-2.5">
                          {/* Beautiful Custom Toggle Switches for the 8 defined overlay types */}
                          <div className="space-y-1.5 bg-slate-950/20 p-2.5 border border-white/5 rounded-2xl">
                            <span className="text-[7.5px] font-black text-rose-450 uppercase tracking-widest block mb-1.5">Live Displays Toggle Room</span>
                            
                            <div className="space-y-1.5">
                              {[
                                {
                                  id: 'score_bug',
                                  label: 'Main Scoreboard',
                                  desc: 'Live score bug overlay in corner',
                                  isActive: activeOverlayConfig.showScoreBug !== false,
                                  onToggle: () => updateOverlayProp({ showScoreBug: activeOverlayConfig.showScoreBug === false })
                                },
                                {
                                  id: 'batsman_stats',
                                  label: 'Batsman Stats',
                                  desc: 'Current strikers scores/match data',
                                  isActive: currentActiveGraphic === 'batsman_stats',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'batsman_stats' ? 'none' : 'batsman_stats' })
                                },
                                {
                                  id: 'bowler_stats',
                                  label: 'Bowler Stats',
                                  desc: 'Bowlers stats record table card',
                                  isActive: currentActiveGraphic === 'bowler_stats',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'bowler_stats' ? 'none' : 'bowler_stats' })
                                },
                                {
                                  id: 'partnership',
                                  label: 'Partnership Card',
                                  desc: 'Batsmen runs stand contribution breakdown',
                                  isActive: currentActiveGraphic === 'partnership',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'partnership' ? 'none' : 'partnership' })
                                },
                                {
                                  id: 'worm_graph',
                                  label: 'Runs Worm Graph',
                                  desc: 'Overs runs cumulative comparison graph',
                                  isActive: currentActiveGraphic === 'worm_graph',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'worm_graph' ? 'none' : 'worm_graph' })
                                },
                                {
                                  id: 'match_summary',
                                  label: 'Match Summary',
                                  desc: 'Innings scores details splitting sheet',
                                  isActive: currentActiveGraphic === 'match_summary',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'match_summary' ? 'none' : 'match_summary' })
                                },
                                {
                                  id: 'team_comparison',
                                  label: 'Team Comparison',
                                  desc: 'Roster lineups head-to-head ratios',
                                  isActive: currentActiveGraphic === 'team_comparison',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'team_comparison' ? 'none' : 'team_comparison' })
                                },
                                {
                                  id: 'lower_third',
                                  label: 'Lower Third Bar',
                                  desc: 'Elegant ticker statistics bar at bottom',
                                  isActive: currentActiveGraphic === 'lower_third',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'lower_third' ? 'none' : 'lower_third' })
                                }
                              ].map(item => (
                                <div key={item.id} className="flex items-center justify-between p-1.5 bg-slate-950/80 border border-white/5 hover:border-white/10 rounded-xl transition-all">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative flex shrink-0">
                                      <span className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></span>
                                    </div>
                                    <div className="text-left min-w-0">
                                      <span className="text-[8px] font-black uppercase tracking-wider text-slate-200 block truncate leading-none">{item.label}</span>
                                      <span className="text-[6px] text-slate-555 block font-mono truncate leading-normal">{item.desc}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[6px] font-black uppercase tracking-widest px-1 py-0.5 rounded leading-none ${item.isActive ? 'bg-emerald-500/10 text-emerald-450' : 'bg-slate-900 text-slate-500'}`}>
                                      {item.isActive ? 'ON AIR' : 'OFF'}
                                    </span>
                                    {/* Styled Switch Button */}
                                    <button
                                      onClick={() => {
                                        item.onToggle();
                                        showNotification(`Toggled broadcast: ${item.label}`, 'info');
                                      }}
                                      className={`w-7 h-4 rounded-full p-0.5 transition-all relative border-none cursor-pointer outline-none flex items-center ${
                                        item.isActive ? 'bg-rose-500' : 'bg-slate-800'
                                      }`}
                                    >
                                      <div
                                        className={`w-3 h-3 bg-white rounded-full transition-all absolute top-0.5 ${
                                          item.isActive ? 'left-[13px]' : 'left-0.5'
                                        }`}
                                      />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {currentActiveGraphic === 'lower_third' && (
                            <div className="border border-white/5 bg-slate-950/40 p-2 rounded-xl space-y-1.5 font-sans mt-2">
                              <span className="text-[7.5px] font-black text-rose-450 uppercase tracking-widest block text-left">Configure Lower Third Bar:</span>
                              <div className="grid grid-cols-3 gap-1">
                                {[
                                  { id: 'intro', label: 'Intro' },
                                  { id: 'equation', label: 'Equation' },
                                  { id: 'umpires', label: 'Umpire Call' }
                                ].map(mode => (
                                  <button
                                    key={mode.id}
                                    onClick={() => updateOverlayProp({ lowerThirdMode: mode.id as any })}
                                    className={`py-1 text-[7px] font-black uppercase tracking-wider rounded border-none cursor-pointer transition-all ${
                                      (activeOverlayConfig.lowerThirdMode || 'intro') === mode.id
                                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                                        : 'bg-slate-900 text-slate-500 hover:text-slate-350'
                                    }`}
                                  >
                                    {mode.label}
                                  </button>
                                ))}
                              </div>

                              {(activeOverlayConfig.lowerThirdMode || 'intro') === 'umpires' && (
                                <div className="flex flex-wrap gap-1 justify-center pt-1 border-t border-white/5">
                                  {['out', 'noball', 'freehit', 'deadball', 'wide'].map((sig) => (
                                    <button
                                      key={sig}
                                      onClick={() => updateOverlayProp({ selectedUmpireSignal: sig as any })}
                                      className={`py-0.5 px-1.5 rounded text-[6.5px] uppercase font-black cursor-pointer transition-all border ${
                                        (activeOverlayConfig.selectedUmpireSignal || 'out') === sig
                                          ? 'bg-rose-550/20 text-rose-400 border-rose-500/20 font-bold'
                                          : 'bg-slate-900 text-slate-500 border-transparent'
                                      }`}
                                    >
                                      {sig}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- SEQUENCER TAB --- */}
                      {activeControlTab === 'sequencer' && (
                        <div className="space-y-3.5 text-left">
                          {/* Streaming Connection Section */}
                          <div className="border border-white/5 bg-slate-950/40 p-2.5 rounded-2xl space-y-2">
                            <span className="text-[7.5px] font-black text-rose-450 uppercase tracking-widest block">📡 Live Streaming Server</span>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="text-[7px] font-bold text-slate-500 uppercase font-mono block mb-1">RTMP Stream Key / Destination Token</label>
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    value={streamKey}
                                    onChange={(e) => {
                                      setStreamKey(e.target.value);
                                      localStorage.setItem('cricket_stream_key', e.target.value);
                                    }}
                                    disabled={isBroadcasting}
                                    placeholder="Enter RTMP Stream Key..."
                                    className="flex-1 bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white font-mono text-[8px] focus:outline-none focus:border-rose-500/50"
                                  />
                                  <button
                                    onClick={() => {
                                      const key = 'live_cr_obs_' + Math.random().toString(36).substring(2, 10);
                                      setStreamKey(key);
                                      localStorage.setItem('cricket_stream_key', key);
                                      showNotification('Generated new secure Stream Key.', 'info');
                                    }}
                                    disabled={isBroadcasting}
                                    className="px-2 py-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 hover:text-white rounded text-[8px] font-mono cursor-pointer transition-all animate-none"
                                  >
                                    Gen
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                                <div className="min-w-0">
                                  <span className="text-[8px] font-black uppercase text-slate-300 block font-sans">Simulate Broadcast</span>
                                  <span className="text-[6px] font-mono text-slate-550 block">Proxy OBS / vMix virtual RTMP feed</span>
                                </div>

                                <button
                                  onClick={() => {
                                    if (isBroadcasting) {
                                      setIsBroadcasting(false);
                                      setBroadcastStartTime(null);
                                      showNotification('Simulated broadcast stream stopped.', 'info');
                                    } else {
                                      if (!streamKey.trim()) {
                                        showNotification('Please enter a valid Stream Key first!', 'alert');
                                        return;
                                      }
                                      setIsBroadcasting(true);
                                      setBroadcastStartTime(Date.now());
                                      showNotification('Simulating RTMP handshake & secure key validation...', 'success');
                                      setTimeout(() => {
                                        showNotification('Connected! Live stream broadcasting successfully.', 'success');
                                      }, 1500);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl border border-solid font-black text-[8px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                                    isBroadcasting
                                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-450 animate-pulse'
                                      : 'bg-slate-950 border-white/5 text-slate-350 hover:bg-white/5'
                                  }`}
                                >
                                  {isBroadcasting ? (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block animate-ping"></span>
                                      <span>🔴 Stop Stream</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span>
                                      <span>⚡ Go Live</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Broadcasting Connection Stats HUD */}
                              {isBroadcasting && (
                                <div className="bg-slate-950 shadow-inner rounded-xl p-2 border border-rose-500/10 font-mono space-y-1 mt-1 text-[7px]" id="obs-stats-panel">
                                  <div className="flex justify-between text-slate-550 border-b border-white/5 pb-1">
                                    <span>STREAM STATUS:</span>
                                    <span className="text-emerald-450 font-black animate-pulse">● RTMP ACTIVE</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-slate-400">
                                    <div>Time Elapsed: <strong className="text-white font-black">{broadcastTimeStr}</strong></div>
                                    <div>Bandwidth: <strong className="text-white font-black">{streamStats.bandwidth} Kbps</strong></div>
                                    <div>FPS Rate: <strong className="text-white font-black">{streamStats.fps} fps</strong></div>
                                    <div>Packet Loss: <strong className={streamStats.packetsLost > 0 ? 'text-rose-400 font-black animate-pulse' : 'text-emerald-400 font-mono font-bold'}>{streamStats.packetsLost}%</strong></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sequence Loop Controller */}
                          <div className="border border-white/5 bg-slate-950/40 p-2.5 rounded-2xl space-y-2">
                            <span className="text-[7.5px] font-black text-rose-455 uppercase tracking-widest block font-sans">🔁 Auto Sequence Controller</span>
                            
                            <div className="space-y-2">
                              {/* Duration selector */}
                              <div className="flex justify-between items-center bg-slate-950/60 p-1.5 border border-white/5 rounded-xl">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-350 block font-sans">Slide Duration</span>
                                  <span className="text-[6px] text-slate-500 font-mono">Visible time per active graphic</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setSequenceDuration(prev => Math.max(3, prev - 1))}
                                    disabled={isSequencePlaying}
                                    className="w-5 h-5 bg-slate-900 border border-slate-850 hover:bg-slate-800 disabled:opacity-30 rounded text-[9px] font-black cursor-pointer text-slate-300 flex items-center justify-center border-none"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-[9px] font-black text-white w-7 text-center">{sequenceDuration}s</span>
                                  <button
                                    onClick={() => setSequenceDuration(prev => Math.min(30, prev + 1))}
                                    disabled={isSequencePlaying}
                                    className="w-5 h-5 bg-slate-900 border border-slate-850 hover:bg-slate-800 disabled:opacity-30 rounded text-[9px] font-black cursor-pointer text-slate-300 flex items-center justify-center border-none"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Play Control Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (isSequencePlaying) {
                                      setIsSequencePlaying(false);
                                      setCurrentQueueIndex(-1);
                                      updateOverlayProp({ activeGraphic: 'none' });
                                      showNotification('Sequence playback stopped.', 'info');
                                    } else {
                                      if (graphicsQueue.length === 0) {
                                        showNotification('Cannot play: The sequence queue is empty!', 'alert');
                                        return;
                                      }
                                      setIsSequencePlaying(true);
                                      setCurrentQueueIndex(0);
                                      showNotification('Sequence play looping initialized.', 'success');
                                    }
                                  }}
                                  className={`flex-1 py-1.5 rounded-xl border border-solid font-black text-[8px] uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-1 ${
                                    isSequencePlaying
                                      ? 'bg-amber-600/20 border-amber-500/40 text-amber-400 font-bold'
                                      : 'bg-emerald-600/10 hover:bg-emerald-600/20 active:scale-95 border-emerald-500/25 hover:border-emerald-500/40 text-emerald-400'
                                  }`}
                                >
                                  {isSequencePlaying ? '⏹ STOP SEQUENCE' : '▶ START SEQUENCE'}
                                </button>

                                <button
                                  onClick={() => {
                                    setGraphicsQueue([]);
                                    if (isSequencePlaying) {
                                      setIsSequencePlaying(false);
                                      setCurrentQueueIndex(-1);
                                      updateOverlayProp({ activeGraphic: 'none' });
                                    }
                                    showNotification('Cleared seq queue.', 'info');
                                  }}
                                  className="py-1.5 px-3 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/30 rounded-xl text-rose-450 font-black text-[8px] uppercase tracking-widest cursor-pointer transition-all border-none"
                                >
                                  Reset
                                </button>
                              </div>

                              {/* Sequence Queue list container */}
                              <div className="space-y-1 bg-slate-950/80 border border-[#ffffff0c] rounded-xl p-2 max-h-[160px] overflow-y-auto" id="graphics-sequence-queue">
                                <span className="text-[7px] font-bold text-slate-500 uppercase font-mono block border-b border-white/5 pb-1 mb-1.5">Ordered Sequence Loop ({graphicsQueue.length} items):</span>
                                
                                {graphicsQueue.length === 0 ? (
                                  <div className="text-center py-3 text-[7.5px] italic text-slate-550 font-mono">
                                    No graphic slides in queue. Click options below to add.
                                  </div>
                                ) : (
                                  graphicsQueue.map((item, idx) => {
                                    const isCurrentOnAir = isSequencePlaying && currentQueueIndex === idx;
                                    const graphicMeta = AVAILABLE_QUEUE_GRAPHICS.find(g => g.id === item) || { id: item, label: item.toUpperCase() };
                                    return (
                                      <div key={idx} className={`flex items-center justify-between p-1 rounded-lg border text-[8px] transition-all ${
                                        isCurrentOnAir 
                                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-black scale-[1.02]' 
                                          : 'bg-slate-950 border-[#ffffff08] text-slate-350'
                                      }`}>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-white/10 flex items-center justify-center font-mono font-black text-[7px] text-slate-400">
                                            {idx + 1}
                                          </span>
                                          {isCurrentOnAir && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>}
                                          <span className="truncate uppercase font-black tracking-wide leading-none">{graphicMeta.label}</span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {isCurrentOnAir && (
                                            <span className="px-1 bg-rose-500/20 text-rose-400 font-mono text-[6.5px] rounded border border-rose-500/10 mr-1 animate-pulse leading-none py-0.5 animate-none">
                                              ON AIR
                                            </span>
                                          )}
                                          
                                          {/* Move Up */}
                                          <button
                                            onClick={() => {
                                              if (idx === 0) return;
                                              const nextQueue = [...graphicsQueue];
                                              const temp = nextQueue[idx];
                                              nextQueue[idx] = nextQueue[idx - 1];
                                              nextQueue[idx - 1] = temp;
                                              setGraphicsQueue(nextQueue);
                                            }}
                                            disabled={idx === 0 || isSequencePlaying}
                                            className="w-4 h-4 bg-slate-900 border border-slate-800 disabled:opacity-20 rounded text-[7px] cursor-pointer hover:bg-slate-800 text-slate-300 flex items-center justify-center leading-none border-none"
                                            title="Move Up"
                                          >
                                            ▲
                                          </button>

                                          {/* Move Down */}
                                          <button
                                            onClick={() => {
                                              if (idx === graphicsQueue.length - 1) return;
                                              const nextQueue = [...graphicsQueue];
                                              const temp = nextQueue[idx];
                                              nextQueue[idx] = nextQueue[idx + 1];
                                              nextQueue[idx + 1] = temp;
                                              setGraphicsQueue(nextQueue);
                                            }}
                                            disabled={idx === graphicsQueue.length - 1 || isSequencePlaying}
                                            className="w-4 h-4 bg-slate-900 border border-slate-800 disabled:opacity-20 rounded text-[7px] cursor-pointer hover:bg-slate-800 text-slate-300 flex items-center justify-center leading-none border-none"
                                            title="Move Down"
                                          >
                                            ▼
                                          </button>

                                          {/* Remove */}
                                          <button
                                            onClick={() => {
                                              const nextQueue = graphicsQueue.filter((_, i) => i !== idx);
                                              setGraphicsQueue(nextQueue);
                                              if (isSequencePlaying) {
                                                if (idx === currentQueueIndex) {
                                                  setCurrentQueueIndex(idx);
                                                } else if (idx < currentQueueIndex) {
                                                  setCurrentQueueIndex(prev => prev - 1);
                                                }
                                              }
                                              showNotification(`Removed slide from sequence queue.`, 'info');
                                            }}
                                            disabled={isSequencePlaying}
                                            className="w-4 h-4 bg-slate-900 border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10 disabled:opacity-20 rounded text-[7.5px] cursor-pointer text-slate-450 flex items-center justify-center leading-none border-none"
                                            title="Delete"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Available Slides Picker to Add to Queue */}
                              <div className="bg-slate-950/60 p-2 border border-white/5 rounded-xl space-y-1.5" id="sequence-add-options">
                                <span className="text-[7px] font-bold text-slate-500 uppercase font-mono block">Add Graphic Slides to Queue:</span>
                                
                                <div className="grid grid-cols-2 gap-1 mb-1">
                                  {AVAILABLE_QUEUE_GRAPHICS.map(item => (
                                    <button
                                      key={item.id}
                                      onClick={() => {
                                        setGraphicsQueue(prev => [...prev, item.id]);
                                        showNotification(`Added ${item.label} to sequence queue.`, 'success');
                                      }}
                                      disabled={isSequencePlaying}
                                      className="py-1 px-1.5 bg-slate-900/45 hover:bg-slate-900 border border-white/5 disabled:opacity-30 rounded-lg text-[7.5px] font-black uppercase text-slate-300 cursor-pointer text-left transition-all hover:text-white flex items-center justify-between"
                                    >
                                      <span>➕ {item.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- THEME TAB --- */}
                      {activeControlTab === 'templates' && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pick Active Theme Template</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { id: 'broadcast-pro', label: '📺 Broadcast Pro' },
                                { id: 'neon-sport', label: '⚡ Neon Sport' },
                                { id: 'clean-white', label: '🥚 Clean Minimal' },
                                { id: 'ipl-style', label: '🏏 IPL Style' },
                                { id: 'score-bug-1900-200', label: '🎮 Vintage Retro' },
                                { id: 'slanted-pro-design', label: '🖼️ Slanted Pro Design' }
                              ].map(t => {
                                const isThemeActive = activeOverlayConfig.template === t.id;
                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => updateOverlayProp({ template: t.id as any })}
                                    className={`py-1 text-[8px] font-extrabold text-left px-2 rounded-lg border cursor-pointer transition-all truncate ${
                                      isThemeActive
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-extrabold'
                                        : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-400'
                                    }`}
                                  >
                                    {t.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Team Colors custom picker right on board! */}
                          <div>
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Accents</span>
                            <div className="grid grid-cols-2 gap-1.5 text-[7px] uppercase font-bold text-slate-500 font-sans">
                              <div>
                                <span className="block mb-0.5 truncate">{match.teamA} Color</span>
                                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-white/5 rounded-lg">
                                  <input
                                    type="color"
                                    value={activeOverlayConfig.teamAColor || '#ea002a'}
                                    onChange={(e) => updateOverlayProp({ teamAColor: e.target.value })}
                                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent shrink-0"
                                  />
                                  <span className="text-[7px] font-mono text-slate-400 font-bold">
                                    {(activeOverlayConfig.teamAColor || '#ea002a').substring(0, 7)}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span className="block mb-0.5 truncate">{match.teamB} Color</span>
                                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-white/5 rounded-lg">
                                  <input
                                    type="color"
                                    value={activeOverlayConfig.teamBColor || '#00529b'}
                                    onChange={(e) => updateOverlayProp({ teamBColor: e.target.value })}
                                    className="w-4 h-4 rounded cursor-pointer border-none bg-transparent shrink-0"
                                  />
                                  <span className="text-[7px] font-mono text-slate-400 font-semibold">
                                    {(activeOverlayConfig.teamBColor || '#00529b').substring(0, 7)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Overlay Ticker News Text</span>
                            <input
                              type="text"
                              value={activeOverlayConfig.tickerMessage || ''}
                              onChange={(e) => updateOverlayProp({ tickerMessage: e.target.value })}
                              className="w-full bg-slate-950 text-slate-350 rounded-lg text-[9px] px-2 py-1.5 border border-white/5 hover:border-white/10 outline-none uppercase font-mono"
                              placeholder="E.g., RAIN DELAYED GAME NOW PROGRESSED."
                            />
                          </div>
                        </div>
                      )}

                      {/* --- MEDIA TAB --- */}
                      {activeControlTab === 'media' && (
                        <div className="space-y-3 font-sans pb-4">
                          {/* Section: Upload Team Logos */}
                          <div className="p-3 bg-slate-950/45 border border-white/5 rounded-xl space-y-3">
                            <span className="text-[7.5px] font-black text-rose-400 uppercase tracking-widest block border-b border-white/5 pb-1">Team Logo Branding</span>
                            
                            <div className="space-y-3">
                              {/* Team A Logo */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 block uppercase leading-none">{match.teamA || 'Team A'} Logo</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {match.teamALogo ? (
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                                      <img src={match.teamALogo} alt="Team A Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                      <button 
                                        onClick={() => setMatch(prev => ({ ...prev, teamALogo: '' }))}
                                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black uppercase transition-all duration-150 cursor-pointer border-none"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-dashed border-white/10 flex items-center justify-center shrink-0 text-slate-600 text-xs">
                                      None
                                    </div>
                                  )}
                                  <div className="relative overflow-hidden flex-1">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      id="team-a-logo-picker"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            if (typeof reader.result === 'string') {
                                              setMatch(prev => ({ ...prev, teamALogo: reader.result as string }));
                                              showNotification(`Saved ${match.teamA} logo branding!`, 'success');
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <label htmlFor="team-a-logo-picker" className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-300 font-extrabold text-[8px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                                      Upload Logo
                                    </label>
                                  </div>
                                </div>
                              </div>

                              {/* Team B Logo */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 block uppercase leading-none">{match.teamB || 'Team B'} Logo</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {match.teamBLogo ? (
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                                      <img src={match.teamBLogo} alt="Team B Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                      <button 
                                        onClick={() => setMatch(prev => ({ ...prev, teamBLogo: '' }))}
                                        className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black uppercase transition-all duration-150 cursor-pointer border-none"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 border border-dashed border-white/10 flex items-center justify-center shrink-0 text-slate-600 text-xs">
                                      None
                                    </div>
                                  )}
                                  <div className="relative overflow-hidden flex-1">
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      id="team-b-logo-picker"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            if (typeof reader.result === 'string') {
                                              setMatch(prev => ({ ...prev, teamBLogo: reader.result as string }));
                                              showNotification(`Saved ${match.teamB} logo branding!`, 'success');
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    />
                                    <label htmlFor="team-b-logo-picker" className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-white/5 text-slate-300 font-extrabold text-[8px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 cursor-pointer">
                                      Upload Logo
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section: Player Photo Uploader */}
                          <div className="p-3 bg-slate-950/45 border border-white/5 rounded-xl space-y-2">
                            <span className="text-[7.5px] font-black text-rose-400 uppercase tracking-widest block border-b border-white/5 pb-1">Team Members Profile Photos</span>
                            
                            {(() => {
                              // Get unique names of players currently in this match
                              const matchPlayersSet = new Set<string>();
                              
                              if (match.innings1) {
                                (match.innings1.batsmen || []).forEach(b => { if (b.name) matchPlayersSet.add(b.name); });
                                (match.innings1.bowlers || []).forEach(b => { if (b.name) matchPlayersSet.add(b.name); });
                              }
                              if (match.innings2) {
                                (match.innings2.batsmen || []).forEach(b => { if (b.name) matchPlayersSet.add(b.name); });
                                (match.innings2.bowlers || []).forEach(b => { if (b.name) matchPlayersSet.add(b.name); });
                              }
                              
                              // Also include quick selection rosters for Team A and B
                              selectedTeamARoster.forEach(name => { if (name) matchPlayersSet.add(name); });
                              selectedTeamBRoster.forEach(name => { if (name) matchPlayersSet.add(name); });

                              const playerNamesList = Array.from(matchPlayersSet).filter(Boolean);

                              if (playerNamesList.length === 0) {
                                return (
                                  <div className="text-center py-4 bg-slate-900/10 text-slate-500 font-mono text-[8px] uppercase">
                                    No players rostered in game setup.
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                  {playerNamesList.map((playerName) => {
                                    const lookupKey = playerName.toLowerCase().trim();
                                    const photoBase64 = match.playerPhotos?.[lookupKey];
                                    
                                    // Detect which team the player belongs to (heuristic or search)
                                    const isTeamA = selectedTeamARoster.some(n => n.toLowerCase().trim() === lookupKey) || 
                                                    (match.innings1?.battingTeam === match.teamA && match.innings1?.batsmen.some(b => b.name.toLowerCase().trim() === lookupKey)) ||
                                                    (match.innings1?.bowlingTeam === match.teamA && match.innings1?.bowlers.some(b => b.name.toLowerCase().trim() === lookupKey)) ||
                                                    (match.innings2?.battingTeam === match.teamA && match.innings2?.batsmen.some(b => b.name.toLowerCase().trim() === lookupKey)) ||
                                                    (match.innings2?.bowlingTeam === match.teamA && match.innings2?.bowlers.some(b => b.name.toLowerCase().trim() === lookupKey));

                                    return (
                                      <div key={playerName} className="flex items-center justify-between p-1.5 bg-slate-900/30 rounded-lg border border-white/[0.01]">
                                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                                          {photoBase64 ? (
                                            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-800 border border-white/10 shrink-0">
                                              <img src={photoBase64} alt={playerName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            </div>
                                          ) : (
                                            <div className="w-7 h-7 rounded-full bg-slate-950 border border-dashed border-white/10 shrink-0 flex items-center justify-center text-[9px] text-slate-600 font-black">
                                              👤
                                            </div>
                                          )}
                                          <div className="text-left overflow-hidden">
                                            <span className="text-[8px] font-black text-white block truncate leading-tight uppercase">{playerName}</span>
                                            <span className={`text-[6px] font-black uppercase tracking-wider block leading-none mt-0.5 ${isTeamA ? 'text-rose-450' : 'text-blue-400'}`}>
                                              {isTeamA ? match.teamA : match.teamB}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex gap-1 shrink-0">
                                          <div className="relative overflow-hidden">
                                            <input 
                                              type="file" 
                                              accept="image/*" 
                                              id={`photo-picker-${lookupKey}`}
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const reader = new FileReader();
                                                  reader.onloadend = () => {
                                                    if (typeof reader.result === 'string') {
                                                      setMatch(prev => {
                                                        const currentPhotos = prev.playerPhotos || {};
                                                        return {
                                                          ...prev,
                                                          playerPhotos: {
                                                            ...currentPhotos,
                                                            [lookupKey]: reader.result as string
                                                          }
                                                        };
                                                      });
                                                      showNotification(`Saved photo for ${playerName}`, 'success');
                                                    }
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                            <label htmlFor={`photo-picker-${lookupKey}`} className="px-1.5 py-0.5 bg-slate-900 border border-white/5 hover:bg-slate-800 text-slate-300 font-extrabold text-[7px] uppercase tracking-wider rounded cursor-pointer leading-loose">
                                              Upload
                                            </label>
                                          </div>

                                          {photoBase64 && (
                                            <button
                                              onClick={() => {
                                                setMatch(prev => {
                                                  const currentPhotos = { ...(prev.playerPhotos || {}) };
                                                  delete currentPhotos[lookupKey];
                                                  return {
                                                    ...prev,
                                                    playerPhotos: currentPhotos
                                                  };
                                                });
                                                showNotification(`Deleted photo for ${playerName}`, 'info');
                                              }}
                                              className="px-1 py-0.5 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-500/10 text-rose-405 font-black text-[7px] uppercase tracking-wider rounded cursor-pointer leading-loose border-none"
                                            >
                                              Del
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* COLUMN 2: Crease Batsmen, Bowlers and Tactile Scoring Panels */}
          <div className={`flex flex-col gap-2 min-h-0 overflow-hidden ${
            activeMobileTab === 'scorer' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-5`}>
            
            {/* Direct crease details card */}
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl shrink-0 space-y-2 shadow-md">
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block leading-none font-sans">ACTIVE CREASE MATCHUP</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Striker batsman card */}
                {(() => {
                  const st = currentInnings.batsmen[currentInnings.strikerIndex];
                  if (!st) return <div className="text-center py-2 bg-slate-955 rounded-lg text-xs leading-none">Batsman not set</div>;
                  return (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 relative flex flex-col justify-between">
                      <span className="absolute top-1 right-1 text-[7px] text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded font-black uppercase tracking-widest leading-none">
                        Striker ★
                      </span>
                      
                      {editStrikerIndex === null ? (
                        <div className="flex gap-2 items-center mr-8">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-950 shrink-0 border border-white/5 flex items-center justify-center">
                            {match?.playerPhotos?.[st.name.toLowerCase().trim()] ? (
                              <img src={match.playerPhotos[st.name.toLowerCase().trim()]} alt={st.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[10px]">👤</span>
                            )}
                          </div>
                          <div className="truncate min-w-0 flex-1 text-left">
                            <h5 className="font-extrabold text-xs text-white flex items-center gap-1 truncate leading-none">
                              {st.name}
                              {!isSpectator && (
                                <button onClick={() => setEditStrikerIndex(currentInnings.strikerIndex)} className="text-slate-550 hover:text-emerald-400 p-0 bg-transparent border-none cursor-pointer">
                                  <Edit size={9} />
                                </button>
                              )}
                            </h5>
                            <p className="text-[7.5px] font-bold text-slate-455 mt-1 uppercase font-mono">
                              SR: {st.balls === 0 ? '0.0' : ((st.runs / st.balls) * 100).toFixed(0)} %
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            defaultValue={st.name}
                            id="cockpit-st-input"
                            className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-bold outline-none flex-1 w-20 leading-none"
                          />
                          <button
                            onClick={() => {
                              const val = (document.getElementById('cockpit-st-input') as HTMLInputElement)?.value;
                              handleUpdateBatsmanName(currentInnings.strikerIndex, val);
                              setEditStrikerIndex(null);
                            }}
                            className="bg-emerald-505 text-white rounded px-1.5 py-0.5 border-none cursor-pointer text-[9px] font-extrabold uppercase leading-none"
                          >
                            Save
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-slate-800/60">
                        <span className="text-[8.5px] font-mono text-slate-500">{st.fours}x4 / {st.sixes}x6</span>
                        <div className="text-right">
                          <strong className="text-sm font-black text-emerald-400 font-mono leading-none">{st.runs}</strong>
                          <span className="text-slate-450 text-[9px] ml-0.5 font-mono">({st.balls}b)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Non striker batsman card */}
                {(() => {
                  const nst = currentInnings.batsmen[currentInnings.nonStrikerIndex];
                  if (!nst) return <div className="text-center py-2 bg-slate-955 rounded-lg text-xs leading-none">Batsman not set</div>;
                  return (
                    <div className="bg-slate-955 border border-slate-850 rounded-xl p-2 relative flex flex-col justify-between">
                      <span className="absolute top-1 right-1 text-[7px] text-slate-400 bg-white/5 px-1 py-0.2 rounded font-black uppercase tracking-widest leading-none">
                        Non-Striker
                      </span>
                      
                      {editNonStrikerIndex === null ? (
                        <div className="flex gap-2 items-center mr-8">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-950 shrink-0 border border-white/5 flex items-center justify-center">
                            {match?.playerPhotos?.[nst.name.toLowerCase().trim()] ? (
                              <img src={match.playerPhotos[nst.name.toLowerCase().trim()]} alt={nst.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[10px]">👤</span>
                            )}
                          </div>
                          <div className="truncate min-w-0 flex-1 text-left">
                            <h5 className="font-extrabold text-xs text-slate-300 flex items-center gap-1 truncate leading-none">
                              {nst.name}
                              {!isSpectator && (
                                <button onClick={() => setEditNonStrikerIndex(currentInnings.nonStrikerIndex)} className="text-slate-550 hover:text-emerald-400 p-0 bg-transparent border-none cursor-pointer">
                                  <Edit size={9} />
                                </button>
                              )}
                            </h5>
                            <p className="text-[7.5px] font-bold text-slate-455 mt-1 uppercase font-mono">
                              SR: {nst.balls === 0 ? '0.0' : ((nst.runs / nst.balls) * 100).toFixed(0)} %
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            defaultValue={nst.name}
                            id="cockpit-nst-input"
                            className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-bold outline-none flex-1 w-20 leading-none"
                          />
                          <button
                            onClick={() => {
                              const val = (document.getElementById('cockpit-nst-input') as HTMLInputElement)?.value;
                              handleUpdateBatsmanName(currentInnings.nonStrikerIndex, val);
                              setEditNonStrikerIndex(null);
                            }}
                            className="bg-emerald-555 text-white rounded px-1.5 py-0.5 border-none cursor-pointer text-[9px] font-extrabold uppercase leading-none"
                          >
                            Save
                          </button>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline mt-1.5 pt-1.5 border-t border-slate-800/60">
                        <span className="text-[8.5px] font-mono text-slate-505">{nst.fours}x4 / {nst.sixes}x6</span>
                        <div className="text-right">
                          <strong className="text-sm font-black text-slate-205 font-mono leading-none">{nst.runs}</strong>
                          <span className="text-slate-450 text-[9px] ml-0.5 font-mono">({nst.balls}b)</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Swap Ends - Touch target > 44px */}
              <button
                type="button"
                onClick={handleSwapStrikers}
                className="w-full h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-100 border-none rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 active:scale-95 transition-all cursor-pointer select-none"
              >
                <ArrowLeftRight size={13} className="text-amber-400 mr-1" />
                SWAP STRIKE / ROTATE BATTERS
              </button>

              {/* Bowler Details card */}
              {(() => {
                const bw = currentInnings.bowlers[currentInnings.currentBowlerIndex];
                if (!bw) return <div className="text-center py-2 bg-slate-955 rounded-lg text-xs leading-none">Bowler not assigned</div>;
                return (
                  <div className="bg-slate-950 p-2 border border-slate-850 rounded-xl flex justify-between items-center gap-2">
                    <div className="truncate flex-1">
                      <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-1">CURRENT ACTIVE BOWLER</span>
                      {editBowlerIndex === null ? (
                        <strong className="text-xs font-black text-amber-300 flex items-center gap-1 truncate">
                          {bw.name}
                          {!isSpectator && (
                            <button onClick={() => setEditBowlerIndex(currentInnings.currentBowlerIndex)} className="text-slate-550 hover:text-emerald-400 p-0 bg-transparent border-none cursor-pointer">
                              <Edit size={9} />
                            </button>
                          )}
                        </strong>
                      ) : (
                        <div className="flex gap-1 items-center">
                          <input
                            type="text"
                            defaultValue={bw.name}
                            id="cockpit-bw-input"
                            className="bg-slate-900 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white font-bold outline-none flex-1 w-20 leading-none"
                          />
                          <button
                            onClick={() => {
                              const val = (document.getElementById('cockpit-bw-input') as HTMLInputElement)?.value;
                              handleUpdateBowlerName(currentInnings.currentBowlerIndex, val);
                              setEditBowlerIndex(null);
                            }}
                            className="bg-emerald-500 text-white rounded px-1.5 py-0.5 border-none cursor-pointer text-[9px] font-extrabold uppercase leading-none"
                          >
                            Save
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-2 items-center mt-1 font-mono text-[9px] text-slate-400">
                        <span>Ovs: <strong className="text-white">{formatOvers(bw.ballsBowled)}</strong></span>
                        <span>Runs: <strong className="text-white">{bw.runsConceded}</strong></span>
                        <span>Econ: <strong className="text-white">{bw.ballsBowled === 0 ? '0.0' : ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block leading-none mb-0.5">WKTS</span>
                      <strong className="text-xl font-black text-rose-500 font-mono leading-none">{bw.wickets}</strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* BALL SCORING PAD - Tactile buttons of 100% compliant dimensions >= 44x44px */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between relative overflow-hidden min-h-0 shadow-lg select-none">
              
              {/* Overlay padlock cover */}
              {isScoringDisabled && (
                <div className="absolute inset-0 bg-slate-950/85 z-40 flex flex-col items-center justify-center p-4 text-center animate-fadeIn select-none">
                  <div className="bg-slate-900 border border-amber-500/20 p-4 rounded-xl max-w-xs space-y-2 shadow-xl">
                    <div className="w-9 h-9 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto">
                      <Lock size={18} />
                    </div>
                    <h5 className="font-black uppercase tracking-wider text-amber-500 text-xs">Scoring Panel is Locked</h5>
                    <p className="text-[9.5px] text-slate-400 leading-relaxed font-bold">
                      All run-scoring inputs are currently locked since this innings has concluded or declared.
                    </p>
                    <button
                      onClick={() => setIsInningsLocked(false)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[8.5px] font-black tracking-widest uppercase cursor-pointer border-none"
                    >
                      Override Lock Check
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay Select New Bowler cover */}
              {!isScoringDisabled && isOverCompletedNeedsBowler && (
                <div className="absolute inset-0 bg-slate-950/95 z-45 flex flex-col items-center justify-center p-4 text-center animate-fadeIn select-none overflow-y-auto">
                  <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl w-full max-w-sm space-y-3 shadow-xl">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h5 className="font-black uppercase tracking-wider text-emerald-400 text-xs">Select New Bowler</h5>
                      <p className="text-[10px] text-slate-400 leading-normal font-bold mt-1">
                        Over {Math.floor((currentInnings?.ballsBowled || 0) / 6)} has finished. Select a bowler for Over {Math.floor((currentInnings?.ballsBowled || 0) / 6) + 1} to continue scoring.
                      </p>
                    </div>

                    {/* Bowler select picker dropdown */}
                    <div className="space-y-2 text-left">
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider">Choose Existing Bowler</label>
                      <select 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 0) {
                            handleSelectNewBowlerForOver(val);
                          }
                        }}
                        defaultValue=""
                        className="w-full bg-slate-955 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white font-bold tracking-tight outline-none"
                      >
                        <option value="" disabled>-- Select Bowler --</option>
                        {currentInnings?.bowlers.map((b, idx) => {
                          const isPrevBowler = idx === currentInnings.currentBowlerIndex;
                          return (
                            <option key={idx} value={idx} disabled={isPrevBowler}>
                              {b.name} {isPrevBowler ? '(consecutive over limit)' : `(${formatOvers(b.ballsBowled)} ov)`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Quick select buttons */}
                    <div className="space-y-1.5 text-left">
                      <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Quick selector</span>
                      <div className="flex flex-wrap gap-1 leading-none">
                        {currentInnings?.bowlers.map((b, idx) => {
                          const isPrevBowler = idx === currentInnings.currentBowlerIndex;
                          if (isPrevBowler) return null;
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectNewBowlerForOver(idx)}
                              className="px-2 py-1.5 bg-slate-800 hover:bg-emerald-555 text-slate-200 rounded text-[9px] font-extrabold uppercase cursor-pointer border-none transition-all"
                            >
                              {b.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-800"></div>
                      <span className="flex-shrink mx-2 text-[8px] text-slate-500 uppercase tracking-widest font-black">or introduce</span>
                      <div className="flex-grow border-t border-slate-800"></div>
                    </div>

                    {/* Fast add custom new Bowler inline */}
                    <div className="flex gap-1 text-left">
                      <input
                        type="text"
                        placeholder="New Bowler..."
                        id="overlay-new-bowler-input"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white font-bold outline-none flex-1 leading-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.currentTarget as HTMLInputElement).value;
                            if (val.trim()) {
                              handleAddNewBowlerAndProgress(val.trim());
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('overlay-new-bowler-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleAddNewBowlerAndProgress(input.value.trim());
                            input.value = '';
                          }
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 rounded-lg px-2.5 text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all leading-none flex items-center"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 flex-1 flex flex-col justify-between">
                
                {/* RUN CHOOTER CHANNELS (0,1,2,3,4,6) - minimum target 44px satisfied with h-12 */}
                <div className="space-y-1">
                  <span className="text-[7.5px] font-black text-amber-405 uppercase tracking-widest block mb-0.5 leading-none font-sans">BALL OUTCOME RUN CHANNELS (TAP MARKS LOGS)</span>
                  <div className="grid grid-cols-6 gap-1">
                    {[0, 1, 2, 3, 4, 6].map((rCount) => {
                      let buttonStyle = 'bg-slate-800 text-white hover:bg-slate-750 active:scale-95';
                      if (rCount === 4) buttonStyle = 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 font-black';
                      if (rCount === 6) buttonStyle = 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 font-black';
                      if (rCount === 0) buttonStyle = 'bg-slate-850 text-slate-500 hover:bg-slate-800';

                      return (
                        <button
                          key={rCount}
                          id={rCount === 6 ? 'btn-six' : rCount === 4 ? 'btn-four' : undefined}
                          disabled={isScoringDisabled}
                          onClick={() => {
                            if (rCount === 6) {
                              setActiveAnimation('six');
                              handleScoreEvent({ type: 'runs', val: 6 });
                            } else if (rCount === 4) {
                              setActiveAnimation('four');
                              handleScoreEvent({ type: 'runs', val: 4 });
                            } else if (rCount === 0) {
                              handleScoreEvent({ type: 'dot' });
                            } else {
                              handleScoreEvent({ type: 'runs', val: rCount });
                            }
                          }}
                          className={`h-12 w-full flex flex-col items-center justify-center rounded-xl font-mono transition-transform border-none font-black text-sm cursor-pointer ${buttonStyle}`}
                        >
                          <span className="leading-none text-base">{rCount}</span>
                          <span className="text-[7px] font-sans font-black uppercase opacity-60 mt-0.5">
                            {rCount === 4 ? 'FOUR' : rCount === 6 ? 'SIX' : rCount === 0 ? 'DOT' : 'RUN'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* EXTRAS CHOOSE: Wide and No Ball - h-11 provides 44px compliant touch area */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => {
                      setExtraRunsBallType('wide');
                      setShowExtraRunsModal(true);
                    }}
                    className="h-11 flex flex-col items-center justify-center bg-purple-950 border border-purple-800/45 hover:bg-purple-900 rounded-xl font-black cursor-pointer text-white transition-all active:scale-95 text-xs"
                  >
                    <span className="leading-none font-extrabold">+1 WIDE (WD)</span>
                    <span className="text-[7px] text-purple-400 font-semibold mt-0.5">Bowler re-delivers ball</span>
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => {
                      setExtraRunsBallType('noball');
                      setShowExtraRunsModal(true);
                    }}
                    className="h-11 flex flex-col items-center justify-center bg-amber-955 border border-amber-800/45 hover:bg-amber-900 rounded-xl font-black cursor-pointer text-white transition-all active:scale-95 text-xs"
                  >
                    <span className="leading-none font-extrabold">+1 NO BALL (NB)</span>
                    <span className="text-[7px] text-amber-400 font-semibold mt-0.5">Triggers next as FREE HIT</span>
                  </button>
                </div>

                {/* BYES AND LEGBYES - h-9 combined with text block provides ample compliant touch target area */}
                <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block leading-none">EXTRAS BYES & LEGBYES (TEAM ADDS RUNS, BYPASSES BATSMAN STATS)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[7px] font-black text-purple-400 uppercase block mb-0.5">BYE RUNS</span>
                      <div className="flex gap-1 justify-between">
                        {[1, 2, 4].map((r) => (
                          <button
                            key={r}
                            disabled={isScoringDisabled}
                            onClick={() => handleScoreEvent({ type: 'bye', val: r })}
                            className="flex-1 h-9 bg-purple-900/10 hover:bg-purple-900/30 text-purple-305 border border-purple-850 text-[9.5px] font-black uppercase rounded-lg cursor-pointer"
                          >
                            +{r}B
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[7px] font-black text-indigo-400 uppercase block mb-0.5">LEG-BYE RUNS</span>
                      <div className="flex gap-1 justify-between">
                        {[1, 2, 4].map((r) => (
                          <button
                            key={r}
                            disabled={isScoringDisabled}
                            onClick={() => handleScoreEvent({ type: 'legbye', val: r })}
                            className="flex-1 h-9 bg-indigo-900/10 hover:bg-indigo-900/30 text-indigo-305 border border-indigo-850 text-[9.5px] font-black uppercase rounded-lg cursor-pointer"
                          >
                            +{r}L
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RED TACTILE BUTTON: Dismissal wicket tracker (target 48px height) */}
                <div className="pt-0.5">
                  <button
                    disabled={isScoringDisabled}
                    id="btn-wicket"
                    onClick={() => {
                      setActiveAnimation('wicket');
                      setOutBatsmanWho('striker');
                      if (currentInnings) {
                        const activeBowlerName = currentInnings.bowlers[currentInnings.currentBowlerIndex]?.name || '';
                        setWicketBowlerName(activeBowlerName);
                        setWicketHowOutDetails('Bowled');
                        setWicketType('Bowled');
                        setWicketFielderName('');
                        setWicketAdditionalDetails('');
                        setNewBatsmanName('');
                        setWicketValidationErr('');
                      }
                      setShowWicketModal(true);
                    }}
                    className="h-12 w-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 rounded-xl font-black text-xs uppercase uppercase tracking-wider text-white gap-2 transition-all cursor-pointer border-none animate-pulse active:scale-95"
                  >
                    <AlertCircle size={14} />
                    🔴 DISMISS / WICKET (OUT RECONCILER)
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* COLUMN 3: Batting/Bowling Scores scorecard registries & Quick additions */}
          <div className={`flex flex-col gap-2 min-h-0 overflow-hidden ${
            activeMobileTab === 'stats' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-4`}>
            
            {/* Tabbed Scorecard box */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col min-h-0 overflow-hidden shadow-lg font-sans">
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-850">
                <div className="flex bg-slate-950 p-0.5 rounded-lg">
                  <button
                    onClick={() => setActiveScorecardTab('bat')}
                    className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                      activeScorecardTab === 'bat' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                    }`}
                  >
                    Batting Card
                  </button>
                  <button
                    onClick={() => setActiveScorecardTab('bowl')}
                    className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                      activeScorecardTab === 'bowl' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                    }`}
                  >
                    Bowling Card
                  </button>
                </div>
                <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">{activeScorecardTab === 'bat' ? 'BATSMAN REGISTRY' : 'BOWLER FIGURES'}</span>
              </div>

              {/* Scrollable grid container inside 100vh bounds */}
              <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 text-xs">
                {activeScorecardTab === 'bat' ? (
                  <table className="w-full text-left text-slate-400 font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[8px] font-black uppercase tracking-widest text-slate-500 text-center">
                        <td className="py-1 text-left">Batsman</td>
                        <td className="py-1">Runs</td>
                        <td className="py-1">Balls</td>
                        <td className="py-1">SR</td>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInnings.batsmen.map((b, idx) => {
                        const isStriker = idx === currentInnings.strikerIndex;
                        const isNonStriker = idx === currentInnings.nonStrikerIndex;
                        return (
                          <tr 
                            key={idx} 
                            className={`border-b border-slate-850 text-center ${
                              isStriker ? 'text-emerald-450 bg-emerald-500/5' : isNonStriker ? 'text-slate-205 font-medium' : 'text-slate-400 opacity-60'
                            }`}
                          >
                            <td className="py-2 text-left font-semibold truncate max-w-[90px]">
                              {b.name} {isStriker ? '★' : ''}
                              <p className="text-[7px] text-slate-500 truncate lowercase italic mt-0.5 leading-none">{b.howOut || 'yet bounds'}</p>
                            </td>
                            <td className="py-2 font-mono font-black text-white">{b.runs}</td>
                            <td className="py-2 font-mono">{b.balls}</td>
                            <td className="py-2 font-mono text-[8.5px]">
                              {b.balls === 0 ? '-' : ((b.runs / b.balls) * 100).toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-900/50 text-[10px] text-slate-300 font-bold border-t border-slate-800 text-center">
                        <td className="py-2 text-left font-black tracking-wide uppercase px-1">Extras</td>
                        <td colSpan={3} className="py-2 text-right pr-2 text-slate-400 font-mono">
                          Total Ext: <strong className="text-amber-400">{currentInnings.extras.wides + currentInnings.extras.noBalls + currentInnings.extras.byes + currentInnings.extras.legByes}</strong> (Wd {currentInnings.extras.wides}, Nb {currentInnings.extras.noBalls}, B {currentInnings.extras.byes}, Lb {currentInnings.extras.legByes})
                        </td>
                      </tr>
                      {currentInnings.extras.penalty > 0 && (
                        <tr className="bg-slate-900/50 text-[10px] text-slate-350 border-t border-slate-900/50 text-center">
                          <td className="py-1 text-left font-bold uppercase px-1">Penalties</td>
                          <td colSpan={3} className="py-1 text-right pr-2 text-rose-400 font-mono">
                            +{currentInnings.extras.penalty} Penalty Runs
                          </td>
                        </tr>
                      )}
                      <tr className="bg-slate-900/80 text-[11px] text-emerald-400 font-extrabold border-t border-slate-800 text-center">
                        <td className="py-2 text-left px-1 uppercase tracking-wider font-extrabold text-emerald-400">GRAND TOTAL</td>
                        <td colSpan={3} className="py-2 text-right pr-2 font-mono text-xs text-white">
                          <span className="text-white font-black text-[13px]">{currentInnings.runs}</span>/{currentInnings.wickets} in {formatOvers(currentInnings.ballsBowled)} Overs
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <table className="w-full text-left text-slate-400 font-sans">
                    <thead>
                      <tr className="border-b border-slate-850 text-[8px] font-black uppercase tracking-widest text-slate-500 text-center">
                        <td className="py-1 text-left">Bowler</td>
                        <td className="py-1">Overs</td>
                        <td className="py-1">Runs</td>
                        <td className="py-1">Wkts</td>
                      </tr>
                    </thead>
                    <tbody>
                      {currentInnings.bowlers.map((bw, idx) => {
                        const isCurrent = idx === currentInnings.currentBowlerIndex;
                        return (
                          <tr 
                            key={idx} 
                            className={`border-b border-slate-850 text-center ${
                              isCurrent ? 'bg-amber-500/5 text-amber-300 font-bold' : 'text-slate-400'
                            }`}
                          >
                            <td className="py-2 text-left font-semibold truncate max-w-[90px] flex items-center">
                              {bw.name} {isCurrent ? '★' : ''}
                              {!isSpectator && !isCurrent && (
                                <button
                                  onClick={() => handleChangeActiveBowler(idx)}
                                  className="ml-1.5 px-1 py-0.5 bg-slate-800 text-[8px] hover:text-white rounded border-none cursor-pointer leading-none uppercase font-black"
                                >
                                  spell
                                </button>
                              )}
                            </td>
                            <td className="py-2 font-mono">{formatOvers(bw.ballsBowled)}</td>
                            <td className="py-2 font-mono text-white">{bw.runsConceded}</td>
                            <td className="py-2 font-mono font-black text-rose-500">{bw.wickets}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Quick adds card */}
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl shrink-0 space-y-1.5 shadow-md">
              <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block leading-none font-sans">QUICK ROSTER ADDITIONS</span>
              
              <div className="grid grid-cols-2 gap-1.5">
                {/* Inline add batsman */}
                <div className="flex bg-slate-950 p-1 rounded-xl items-center">
                  <input
                    type="text"
                    id="cockpit-add-st-input"
                    placeholder="New batter..."
                    className="bg-transparent border-none text-[10px] font-bold text-slate-200 outline-none w-full px-1.5 leading-none"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('cockpit-add-st-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleAddNewBatsman(input.value.trim());
                        input.value = '';
                      } else {
                        showNotification('Name cannot be empty', 'alert');
                      }
                    }}
                    className="h-7 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] rounded-lg border-none cursor-pointer uppercase flex items-center shrink-0"
                  >
                    Add
                  </button>
                </div>

                {/* Inline add bowler */}
                <div className="flex bg-slate-950 p-1 rounded-xl items-center">
                  <input
                    type="text"
                    id="cockpit-add-bw-input"
                    placeholder="New bowler..."
                    className="bg-transparent border-none text-[10px] font-bold text-slate-200 outline-none w-full px-1.5 leading-none"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('cockpit-add-bw-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleAddNewBowler(input.value.trim());
                        input.value = '';
                      } else {
                        showNotification('Name cannot be empty', 'alert');
                      }
                    }}
                    className="h-7 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] rounded-lg border-none cursor-pointer uppercase flex items-center shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Publish News bulletin inline */}
              <div className="flex bg-slate-955 p-1 rounded-xl items-center">
                <input
                  type="text"
                  id="cockpit-add-bulletin-input"
                  placeholder="Publish custom commentary note..."
                  className="bg-transparent border-none text-[10px] font-black text-slate-205 outline-none w-full px-1.5 leading-none"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('cockpit-add-bulletin-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handlePublishNewsBulletin(input.value.trim());
                      input.value = '';
                    } else {
                      showNotification('Note cannot be empty', 'alert');
                    }
                  }}
                  className="h-7 px-3 bg-amber-500 hover:bg-amber-450 text-slate-950 font-black text-[9px] rounded-lg border-none cursor-pointer uppercase flex items-center shrink-0 font-extrabold"
                >
                  Publish NOTE
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {showLivePreview && (
          <div className="w-full lg:w-[420px] h-full border-l border-slate-800 bg-slate-900 flex flex-col shrink-0 relative transition-all duration-300 shadow-2xl z-50 shrink-0" id="live-spectator-sidebar-pane">
            <div className="h-11 bg-slate-950 border-b border-slate-850 flex items-center justify-between px-2 shrink-0 gap-1 overflow-x-auto">
              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 shrink-0 scale-95 origin-left">
                <button
                  onClick={() => setLivePreviewTab('spectator')}
                  className={`px-2 py-1 rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer border-none transition-all ${
                    livePreviewTab === 'spectator'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 bg-transparent'
                  }`}
                >
                  Spectator Board
                </button>
                <button
                  onClick={() => setLivePreviewTab('overlay')}
                  className={`px-2 py-1 rounded text-[8.5px] font-black uppercase tracking-wider cursor-pointer border-none transition-all ${
                    livePreviewTab === 'overlay'
                      ? 'bg-rose-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 bg-transparent'
                  }`}
                >
                  TV Overlay
                </button>
              </div>

              <div className="flex items-center gap-1 shrink-0 font-mono">
                <a
                  href={
                    livePreviewTab === 'overlay'
                      ? `${window.location.origin}${window.location.pathname}#/live/cricket-overlay?matchId=${match.id}`
                      : `${window.location.origin}${window.location.pathname}#/live/cricket-details?matchId=${match.id}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-450 font-bold hover:text-emerald-350 rounded text-[9px] uppercase tracking-wider border-none cursor-pointer flex items-center gap-1 no-underline transition-all"
                  title="Open live view in a new tab"
                >
                  New Tab ↗
                </a>
                <button
                  onClick={() => setShowLivePreview(false)}
                  className="px-2 py-1 bg-slate-800/60 hover:bg-slate-750 text-slate-400 hover:text-white rounded text-[9px] cursor-pointer border border-slate-850/80 transition-all text-center"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-0 overflow-hidden relative">
              {livePreviewTab === 'overlay' && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-0">
                  <div className="text-center mt-32 leading-none">
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-700 uppercase block">TV Graphics Active</span>
                    <span className="text-[8px] font-bold text-slate-800 uppercase mt-1 block">Transparent OBS overlay layer simulated</span>
                  </div>
                </div>
              )}
              <iframe
                src={
                  livePreviewTab === 'overlay'
                    ? `${window.location.origin}${window.location.pathname}#/live/cricket-overlay?matchId=${match.id}&preview=true`
                    : `${window.location.origin}${window.location.pathname}#/live/cricket-details?matchId=${match.id}&preview=true`
                }
                title="Live Scoreboard Preview Screen"
                className="w-full h-full border-none rounded-none relative z-10"
                style={
                  livePreviewTab === 'overlay'
                    ? { backgroundColor: '#020617' }
                    : undefined
                }
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </div>
        )}

        </div> {/* Closes VIEW DIVIDER CONTAINER wrapper */}

        {/* PINNED MOBILE NAVIGATION TABS (height: 2.75rem / 44px) - completely compliant with viewport and touch bounds */}
        <div className="flex lg:hidden bg-slate-900 border-t border-slate-800 shrink-0 h-11 items-center justify-between px-1 select-none z-50">
          <button
            onClick={() => setActiveMobileTab('scorer')}
            className={`flex-1 py-1.5 mx-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-none cursor-pointer transition-all ${
              activeMobileTab === 'scorer'
                ? 'bg-emerald-500/10 text-emerald-450'
                : 'text-slate-500 bg-transparent'
            }`}
          >
            🎯 Scorer (Play)
          </button>
          
          <button
            onClick={() => setActiveMobileTab('stats')}
            className={`flex-1 py-1.5 mx-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-none cursor-pointer transition-all ${
              activeMobileTab === 'stats'
                ? 'bg-emerald-500/10 text-emerald-450'
                : 'text-slate-500 bg-transparent'
            }`}
          >
            📋 Stats Card
          </button>

          <button
            onClick={() => setActiveMobileTab('feed')}
            className={`flex-1 py-1.5 mx-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-none cursor-pointer transition-all ${
              activeMobileTab === 'feed'
                ? 'bg-rose-500/10 text-rose-400'
                : 'text-slate-500 bg-transparent'
            }`}
          >
            📺 TV Graphics
          </button>

        </div>

        {/* MODAL OVERLAYS & VERIFICATIONS */}
        {/* Verification / Wicket Replay card overlay */}
        {pendingWicketReplay && (
          <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-center justify-center p-4 select-none">
            <div className="bg-slate-900 border-2 border-rose-500 rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl relative animate-scaleIn text-white">
              <div className="text-center">
                <span className="px-2.5 py-0.5 bg-rose-500/15 text-rose-450 rounded-full font-black text-[8px] uppercase tracking-widest block w-fit mx-auto animate-pulse">
                  WICKET DISMISSAL FOR RECONCILIATION
                </span>
                <h4 className="text-base font-black uppercase mt-1.5 text-rose-500">Is this Out holding?</h4>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/5 text-[10.5px] font-bold leading-relaxed space-y-1 font-mono">
                <p><span className="text-slate-450">Batsman:</span> <strong className="text-rose-400">{pendingWicketReplay.batsmanName}</strong></p>
                <p><span className="text-slate-450">Dismissal:</span> <span className="text-amber-305 text-amber-300">{pendingWicketReplay.howOutDetails}</span></p>
                <p><span className="text-slate-455 text-slate-450">Bowler:</span> <span className="text-white">{pendingWicketReplay.bowlerName}</span></p>
                <p><span className="text-slate-455 text-slate-450">New Batter:</span> <span className="text-emerald-400">{pendingWicketReplay.incomingBatsmanName || `Incoming Batter`}</span></p>
              </div>
              <div className="flex gap-2 pt-1 font-sans">
                <button
                  type="button"
                  onClick={() => setPendingWicketReplay(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                >
                  Cancel / Correct
                </button>
                <button
                  type="button"
                  onClick={() => {
                    commitWicketScore(pendingWicketReplay);
                    setFallOfWicketModal(pendingWicketReplay);
                    setPendingWicketReplay(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white border-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer font-black"
                >
                  Confirm Out 🔴
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fall of Wicket Modal Card */}
        {fallOfWicketModal && (
          <div className="fixed inset-0 bg-slate-950/90 z-[250] flex items-center justify-center p-4 select-none">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500 rounded-[2.5rem] p-6 max-w-md w-full space-y-6 shadow-2xl relative animate-scaleIn text-white text-center">
              <div>
                <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full font-black text-[9px] uppercase tracking-[0.2em] block w-fit mx-auto animate-pulse mb-3">
                  FALL OF WICKET 🏏
                </span>
                <h4 className="text-2xl font-black uppercase text-white tracking-tight">OUT! Dismissal Confirmed</h4>
                <p className="text-xs text-slate-400 mt-1 font-medium">Recorded successfully in the scoreboard database</p>
              </div>

              <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 text-left space-y-3 font-sans">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Batsman Out</span>
                  <strong className="text-sm text-rose-400 font-extrabold">{fallOfWicketModal.batsmanName}</strong>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">How Out</span>
                  <span className="text-xs text-amber-400 font-bold">{fallOfWicketModal.wicketType} ({fallOfWicketModal.howOutDetails})</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-xs text-slate-400 font-medium">Bowler</span>
                  <span className="text-xs text-white font-semibold">{fallOfWicketModal.bowlerName}</span>
                </div>
                {fallOfWicketModal.incomingBatsmanName && (
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-400 font-medium">Incoming Batsman</span>
                    <strong className="text-sm text-emerald-400 font-extrabold">{fallOfWicketModal.incomingBatsmanName}</strong>
                  </div>
                )}
              </div>

              <div className="font-sans">
                <button
                  type="button"
                  onClick={() => setFallOfWicketModal(null)}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all border-none shadow-md shadow-emerald-950/40 text-white"
                >
                  Continue Scoring & Return
                </button>
              </div>
            </div>
          </div>
        )}

        {/* The original wicket selection modal if needed */}
        <AnimatePresence>
          {showWicketModal && (
            <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowWicketModal(false)}
                className="absolute inset-0 bg-slate-950"
              />
              <motion.div
                id="wicket-dismissal-modal"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-3xl border border-slate-800 max-w-sm w-full p-5 shadow-2xl relative z-20 text-white space-y-3 font-sans"
              >
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-450 rounded-full font-black text-[8px] uppercase tracking-widest">
                    Match Event Trigger - Dismissal
                  </span>
                  <h3 className="text-base font-black uppercase tracking-tight text-white mt-1">
                    Dismissal Analysis Board
                  </h3>
                </div>

                <div className="space-y-3 text-[10.5px] font-bold font-sans">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 leading-none font-sans">Which Batsman got out?</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setOutBatsmanWho('striker')}
                        className={`py-2 rounded-lg text-[9.5px] font-black uppercase tracking-widest cursor-pointer border-none transition-all ${
                          outBatsmanWho === 'striker' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 font-bold'
                        }`}
                      >
                        Striker ({currentInnings.batsmen[currentInnings.strikerIndex]?.name || 'N/A'})
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutBatsmanWho('non-striker')}
                        className={`py-2 rounded-lg text-[9.5px] font-black uppercase tracking-widest cursor-pointer border-none transition-all ${
                          outBatsmanWho === 'non-striker' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400 font-bold'
                        }`}
                      >
                        Non-Striker ({currentInnings.batsmen[currentInnings.nonStrikerIndex]?.name || 'N/A'})
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 leading-none">Dismissal Type</span>
                    <div className="grid grid-cols-5 gap-1">
                      {(['Bowled', 'Caught', 'Run Out', 'Stumped', 'LBW'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setWicketType(mode);
                            setWicketHowOutDetails(mode);
                          }}
                          className={`py-1.5 rounded text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                            wicketType === mode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mb-1 leading-none">Details</label>
                    <input
                      type="text"
                      value={wicketHowOutDetails}
                      onChange={(e) => setWicketHowOutDetails(e.target.value)}
                      placeholder="Caught at deep cover"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold outline-none text-white focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mb-1 leading-none font-sans">Additional Notes</label>
                    <input
                      type="text"
                      value={wicketAdditionalDetails}
                      onChange={(e) => {
                        setWicketAdditionalDetails(e.target.value);
                        if (e.target.value.trim() && wicketValidationErr) {
                          setWicketValidationErr('');
                        }
                      }}
                      placeholder="e.g. LBW on middle stump"
                      className="additional-notes w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold outline-none text-white focus:border-rose-500"
                    />
                    {wicketValidationErr && (
                      <p className="text-[9px] text-rose-500 font-extrabold mt-1 uppercase tracking-wide">
                        {wicketValidationErr}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mb-1 leading-none">Bowler Name</label>
                    <input
                      type="text"
                      value={wicketBowlerName}
                      onChange={(e) => setWicketBowlerName(e.target.value)}
                      className="w-full bg-slate-955 border border-slate-800 rounded-lg p-2 text-xs font-bold outline-none text-white focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-450 uppercase tracking-widest block mb-1 leading-none">Incoming Cricketer Name</label>
                    <input
                      type="text"
                      value={newBatsmanName}
                      onChange={(e) => setNewBatsmanName(e.target.value)}
                      placeholder={`Default: Batsman ${currentInnings.batsmen.length + 1}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-bold outline-none text-white"
                    />
                    {(() => {
                      if (!currentInnings) return null;
                      const teamRoster = currentInnings.battingTeam === match.teamA ? selectedTeamARoster : selectedTeamBRoster;
                      if (!teamRoster || teamRoster.length === 0) return null;

                      const alreadyBatted = currentInnings.batsmen.map(b => b.name.toLowerCase());
                      const remaining = teamRoster.filter(player => !alreadyBatted.includes(player.toLowerCase()));

                      if (remaining.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                          <span className="text-[8px] text-slate-500 font-extrabold uppercase py-0.5 select-none font-sans">Squad Roster:</span>
                          {remaining.slice(0, 8).map((player, idx) => {
                            const stats = playerStatsMap[player.toLowerCase().trim()];
                            const matchesPlayed = stats ? stats.matches : 0;
                            const avgScore = stats && stats.matches > 0 ? stats.avg : 0;
                            return (
                              <button
                                key={`${player}-${idx}`}
                                type="button"
                                onClick={() => setNewBatsmanName(player)}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-300 rounded text-[7.5px] uppercase font-black tracking-wider border-none cursor-pointer transition-all active:scale-95"
                                title={`${player} - Matches Played: ${matchesPlayed}, Average Score: ${matchesPlayed > 0 ? avgScore : 'N/A'}`}
                              >
                                + {player} ({matchesPlayed}m, Avg {matchesPlayed > 0 ? avgScore : '--'})
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={() => setShowWicketModal(false)}
                      className="flex-1 py-2 bg-slate-800 text-slate-400 rounded-lg text-xs uppercase tracking-widest border-none cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWicketScore}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black uppercase tracking-widest cursor-pointer border-none"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExtraRunsModal && currentInnings && extraRunsBallType && (
            <div className="fixed inset-0 z-[180] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExtraRunsModal(false)}
                className="absolute inset-0 bg-slate-950"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-900 rounded-3xl border border-slate-800 max-w-sm w-full p-5 shadow-2xl relative z-20 text-white space-y-3 font-sans"
              >
                <div className="text-center">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-305 rounded-full font-black text-[8px] uppercase tracking-widest">
                    Match Event Trigger - {extraRunsBallType === 'wide' ? 'Wide' : 'No Ball'}
                  </span>
                  <h3 className="text-base font-black uppercase tracking-tight text-white mt-1">
                    Runs Off {extraRunsBallType === 'wide' ? 'Wide' : 'No Ball'}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5 leading-tight font-bold">
                    Select additional runs completed by batsmen off this ball.
                  </p>
                </div>

                <div className="space-y-3 font-bold text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        handleScoreEvent({ type: extraRunsBallType, val: 0 });
                        setShowExtraRunsModal(false);
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                    >
                      <span>0 Additional Runs</span>
                      <span className="text-[7.5px] font-medium opacity-50 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd Total' : '1 Nb Total'})</span>
                    </button>

                    <button
                      onClick={() => {
                        handleScoreEvent({ type: extraRunsBallType, val: 1 });
                        setShowExtraRunsModal(false);
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                    >
                      <span>1 Additional Run</span>
                      <span className="text-[7.5px] font-medium opacity-50 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 1 Runs to Bat' : '1 Nb + 1 Runs to Bat'})</span>
                    </button>

                    <button
                      onClick={() => {
                        handleScoreEvent({ type: extraRunsBallType, val: 2 });
                        setShowExtraRunsModal(false);
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                    >
                      <span>2 Additional Runs</span>
                      <span className="text-[7.5px] font-medium opacity-50 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 2 Runs to Bat' : '1 Nb + 2 Runs to Bat'})</span>
                    </button>

                    <button
                      onClick={() => {
                        handleScoreEvent({ type: extraRunsBallType, val: 3 });
                        setShowExtraRunsModal(false);
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                    >
                      <span>3 Additional Runs</span>
                      <span className="text-[7.5px] font-medium opacity-50 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 3 Runs to Bat' : '1 Nb + 3 Runs to Bat'})</span>
                    </button>

                    <button
                      onClick={() => {
                        handleScoreEvent({ type: extraRunsBallType, val: 4 });
                        setShowExtraRunsModal(false);
                      }}
                      className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center col-span-2"
                    >
                      <span>4 Runs (Boundary)</span>
                      <span className="text-[7.5px] font-medium opacity-50 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 4 Runs to Bat' : '1 Nb + 4 Runs to Bat'})</span>
                    </button>

                    {extraRunsBallType === 'noball' && (
                      <button
                        onClick={() => {
                          handleScoreEvent({ type: 'noball', val: 6 });
                          setShowExtraRunsModal(false);
                        }}
                        className="py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-205 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center col-span-2"
                      >
                        <span>6 Runs (Maximum!)</span>
                        <span className="text-[7.5px] font-medium opacity-50 mt-0.5">(1 Nb + 6 Runs to Bat)</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExtraRunsModal(false)}
                    className="w-full mt-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer border-none transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Reset Confirmation Overlay */}
        {resetMatchConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fade-in text-slate-900 dark:text-slate-100">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-1">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Discard Active Match?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Are you sure you want to discard this live recording? This active match will be permanently deleted from database. This action is irreversible.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setResetMatchConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setResetMatchConfirm(false);
                    performResetMatch();
                  }}
                  className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
                >
                  Discard Match
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Match Setup Modal */}
        <AnimatePresence>
          {showEditMatchModal && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowEditMatchModal(false)}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 50 }}
                className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/50 rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative z-10 text-white overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-teal-500" />
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Edit size={16} className="text-indigo-400" />
                    Modify Live Match Setup
                  </h3>
                  <button
                    onClick={() => setShowEditMatchModal(false)}
                    className="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 font-sans text-left">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block mb-1.5 label-required">Team A Name</label>
                    <input
                      type="text"
                      value={editModalTeamA}
                      onChange={(e) => setEditModalTeamA(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-white focus:border-indigo-500"
                      placeholder="Team A"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block mb-1.5 label-required">Team B Name</label>
                    <input
                      type="text"
                      value={editModalTeamB}
                      onChange={(e) => setEditModalTeamB(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-white focus:border-indigo-500"
                      placeholder="Team B"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block mb-1.5 label-required">Overs Limit</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={editModalOversLimit}
                      onChange={(e) => setEditModalOversLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                    />
                  </div>

                  {currentInnings && (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block mb-1.5">Current Runs</label>
                        <input
                          type="number"
                          min="0"
                          value={editModalRuns}
                          onChange={(e) => setEditModalRuns(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block mb-1.5">Wickets</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={editModalWickets}
                          onChange={(e) => setEditModalWickets(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block mb-1.5">Balls Bowled</label>
                        <input
                          type="number"
                          min="0"
                          value={editModalBallsBowled}
                          onChange={(e) => setEditModalBallsBowled(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 font-sans">
                    <button
                      onClick={() => setShowEditMatchModal(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold uppercase tracking-wider text-[10px] rounded-xl transition-all cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEditedMatch}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-90 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl transition-all cursor-pointer border-none shadow-md"
                    >
                      Save Changes ⚡
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


      </div>
    );
  }

  const filteredPastMatches = pastMatches.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(pastSearchQuery.toLowerCase());
    if (showHiddenPast) {
      return matchesSearch;
    } else {
      return matchesSearch && !m.isHidden;
    }
  });

  if (activeSection === 'tournaments') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
        <header className="bg-emerald-700 dark:bg-emerald-950 text-white shadow-md border-b border-emerald-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 rounded-xl shadow-inner">
                <Trophy className="text-amber-300 animate-pulse" size={24} />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                  GULLY<span className="text-amber-300 italic">SCORE</span>
                </h1>
                <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest hidden sm:block">Local Cricket Match Scoreboard Suite</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-all cursor-pointer border-none"
                title="Toggle theme mode"
              >
                {darkMode ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} />}
              </button>

              <Link
                to="/live/cricket-toss"
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-all no-underline"
                title="GullyScore: Cricket Digital Toss Simulator"
              >
                <span>🪙 Digital Toss</span>
              </Link>

              {isScoreManager ? (
                <button
                  onClick={async () => {
                    try {
                      await logout();
                      window.location.href = '/';
                    } catch (err) {
                      console.error('Logout error:', err);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  title="Sign out of scorekeeper session"
                >
                  <ShieldIcon size={14} className="text-amber-300" />
                  <span>Logout Scorer</span>
                </button>
              ) : (
                <Link
                  to="/cricket-login"
                  className="px-3 py-1.5 bg-amber-550 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-amber-500/10 transition-all no-underline decoration-transparent"
                  title="Authenticate as Scorekeeper"
                >
                  <LoginIcon size={14} />
                  <span>Scorer Login</span>
                </Link>
              )}

              <Link
                to="/projects"
                className="p-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl uppercase tracking-widest transition-all hidden sm:flex items-center gap-1.5 no-underline decoration-transparent"
              >
                <ArrowRight size={14} /> Back
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Section Switcher Tabs */}
          <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 mb-8 pb-1 font-sans">
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setActiveSection('scorer');
                  playSoundEffect('click');
                }}
                className={`pb-3 px-6 font-black uppercase text-xs sm:text-sm tracking-wider relative transition-all border-none bg-transparent cursor-pointer ${
                  activeSection === 'scorer'
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} /> Quick Scorer
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveSection('tournaments');
                  playSoundEffect('click');
                }}
                className={`pb-3 px-6 font-black uppercase text-xs sm:text-sm tracking-wider relative transition-all border-none bg-transparent cursor-pointer ${
                  activeSection === 'tournaments'
                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-amber-500 animate-bounce" /> Tournaments
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full" />
              </button>
            </div>
          </div>

          <CricketTournamentTab 
            onStartLiveScore={(tA, tB, overs, customRules, tournamentId, matchId, onSave) => {
              setTeamA(tA);
              setTeamB(tB);
              setOversLimit(overs);
              setMatch({
                id: `live_${Date.now()}`,
                teamA: tA,
                teamB: tB,
                oversLimit: overs,
                tossWinner: tA,
                tossChoice: 'bat',
                currentInningsNum: 1,
                innings1: null,
                innings2: null,
                status: 'setup',
                date: new Date().toISOString().split('T')[0],
                freeHitNext: false,
                teamALogo: '',
                teamBLogo: '',
                playerPhotos: {},
                tournamentId: tournamentId,
                tournamentMatchId: matchId,
                createdBy: user?.email || user?.uid || 'anonymous'
              });
              tournamentCallbackRef.current = onSave;
              setActiveSection('scorer');
              showNotification(`Configured tournament live match: ${tA} vs ${tB}! Configure Toss to start!`, 'success');
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200 font-sans">
      {/* Reset Confirmation Overlay */}
      {resetMatchConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-1">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Discard Active Match?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Are you sure you want to discard this live recording? This active match will be permanently deleted from database. This action is irreversible.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setResetMatchConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setResetMatchConfirm(false);
                  performResetMatch();
                }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Discard Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-emerald-700 dark:bg-emerald-900 text-white shadow-md border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-inner">
              <Trophy className="text-amber-300 animate-pulse" size={24} />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2">
                GULLY<span className="text-amber-300 italic">SCORE</span>
              </h1>
              <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest hidden sm:block">Local Cricket Match Scoreboard Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {match.id && (
              <button
                onClick={() => {
                  const link = getPublicOverlayUrl(match.id);
                  copyToClipboard(link).then(() => {
                    showNotification('OBS URL Copied! Paste as standard transparent 1920x1080 Browser Source.', 'success');
                  });
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-450 hover:to-pink-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer border-none text-white shadow-md shadow-rose-950/20 active:scale-95"
                title="Instant OBS Copy Link"
              >
                <Link2 size={13} className="text-white" />
                <span>Instant OBS Copy Link</span>
              </button>
            )}

            {match.innings1 && (
              <button
                onClick={handleExportMatchPDF}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none text-white shadow-sm"
              >
                <FileDown size={13} />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}

            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none text-white shadow-sm"
            >
              <Clock size={13} />
              {showHistory ? 'Close Logs' : 'Past Matches'}
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-all cursor-pointer border-none text-white ${soundEnabled ? 'bg-emerald-600' : 'bg-emerald-800/40 opacity-60'}`}
              title={soundEnabled ? "Mute audio" : "Enable sound"}
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} className="text-amber-200" />}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition-all cursor-pointer border-none"
              title="Toggle theme mode"
            >
              {darkMode ? <Sun size={18} className="text-amber-300" /> : <Moon size={18} />}
            </button>

            {isScoreManager ? (
              <button
                onClick={async () => {
                  try {
                    await logout();
                    window.location.href = '/';
                  } catch (err) {
                    console.error('Logout error:', err);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                title="Sign out of scorekeeper session"
              >
                <ShieldIcon size={14} className="text-amber-300" />
                <span>Logout Scorer</span>
              </button>
            ) : (
              <Link
                to="/cricket-login"
                className="px-3 py-1.5 bg-amber-550 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg hover:shadow-amber-500/10 transition-all no-underline decoration-transparent"
                title="Authenticate as Scorekeeper"
              >
                <LoginIcon size={14} />
                <span>Scorer Login</span>
              </Link>
            )}

            <Link
              to="/projects"
              className="p-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl uppercase tracking-widest transition-all hidden sm:flex items-center gap-1.5 no-underline decoration-transparent"
            >
              <ArrowRight size={14} /> Back
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Section Switcher Tabs */}
        <div className="flex justify-center border-b border-slate-200 dark:border-slate-800 mb-8 pb-1 font-sans">
          <div className="flex gap-4 font-sans">
            <button
              onClick={() => {
                setActiveSection('scorer');
                playSoundEffect('click');
              }}
              className={`pb-3 px-6 font-black uppercase text-xs sm:text-sm tracking-wider relative transition-all border-none bg-transparent cursor-pointer ${
                activeSection === 'scorer'
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold pb-3'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={16} /> Quick Scorer
              </div>
              {activeSection === 'scorer' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full font-sans" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveSection('tournaments');
                playSoundEffect('click');
              }}
              className={`pb-3 px-6 font-black uppercase text-xs sm:text-sm tracking-wider relative transition-all border-none bg-transparent cursor-pointer ${
                activeSection === 'tournaments'
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold pb-3'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Tournaments
              </div>
              {activeSection === 'tournaments' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 rounded-full font-sans" />
              )}
            </button>
          </div>
        </div>
        
        {/* Dynamic User Notification Feed */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${
                feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 
                feedback.type === 'alert' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 
                'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
              }`}
            >
              <AlertCircle size={16} />
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Accordion for Completed past matches history */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 mb-8 shadow-xl overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                    <HistoryIcon className="text-amber-500" />
                    PAST MATCHES SECTION ({pastMatches.length} Registered)
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Manage, search, and customize past match databases locally</p>
                </div>

                {/* Main Action Bar for adding new custom past match & toggling hidden */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setPastTitleInput('');
                      setPastDateInput(new Date().toISOString().split('T')[0]);
                      setShowAddPastModal(true);
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all cursor-pointer border-none flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={13} />
                    Add New Match
                  </button>

                  <button
                    onClick={() => setShowHiddenPast(!showHiddenPast)}
                    className={`px-4 py-2 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                      showHiddenPast 
                        ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-705'
                    }`}
                  >
                    {showHiddenPast ? <Eye size={13} /> : <EyeOff size={13} />}
                    {showHiddenPast ? 'Hide Hidden Group' : 'Show Hidden Matches'}
                  </button>

                  {activeHistoryTab === 'restorable' && matchHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="px-4 py-2 hover:bg-rose-100 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all cursor-pointer border-none"
                    >
                      Reset Journal
                    </button>
                  )}
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl mb-6 w-fit border border-slate-200/40 dark:border-slate-800 shadow-inner">
                <button
                  onClick={() => setActiveHistoryTab('custom')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none ${
                    activeHistoryTab === 'custom'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Past Matches Registry
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('live')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none ${
                    activeHistoryTab === 'live'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Active Live Matches ({activeLiveMatches.length})
                </button>
                <button
                  onClick={() => setActiveHistoryTab('restorable')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none ${
                    activeHistoryTab === 'restorable'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Live Completed Logs ({matchHistory.length})
                </button>
                <button
                  onClick={() => setActiveHistoryTab('drafts')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none ${
                    activeHistoryTab === 'drafts'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Saved Drafts ({savedDrafts.length})
                </button>
                <button
                  onClick={() => setActiveHistoryTab('stats')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border-none ${
                    activeHistoryTab === 'stats'
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  Leaderboard & Stats 📊
                </button>
              </div>

              {/* SEARCH & FILTERS PANEL (Only on Custom Registry) */}
              {activeHistoryTab === 'custom' && (
                <div className="mb-6 relative max-w-md">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={pastSearchQuery}
                    onChange={(e) => setPastSearchQuery(e.target.value)}
                    placeholder="Search past matches by title..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all shadow-sm"
                  />
                  {pastSearchQuery && (
                    <button
                      onClick={() => setPastSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {/* TAB 1: CUSTOM PAST MATCHES REGISTRY */}
              {activeHistoryTab === 'custom' && (
                <div>
                  {filteredPastMatches.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-850">
                      <BookOpen className="mx-auto text-slate-300 dark:text-slate-750 mb-3" size={36} />
                      <p className="text-xs uppercase font-extrabold tracking-widest text-slate-450 dark:text-slate-500">
                        {pastSearchQuery ? 'No matching past matches found' : 'No past matches in this directory'}
                      </p>
                      {!pastSearchQuery && (
                        <button
                          onClick={() => {
                            setPastTitleInput('');
                            setPastDateInput(new Date().toISOString().split('T')[0]);
                            setShowAddPastModal(true);
                          }}
                          className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-xl border-none cursor-pointer"
                        >
                          Register First Match
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPastMatches.map((past) => (
                        <div 
                          key={past.id}
                          className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                            past.isHidden 
                              ? 'bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-250 dark:border-slate-800/60 opacity-60' 
                              : 'bg-white dark:bg-slate-850/50 border-slate-150 dark:border-slate-805 hover:border-emerald-500/30 shadow-sm'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${
                                past.isHidden
                                  ? 'bg-amber-100 text-amber-750 dark:bg-amber-500/10 dark:text-amber-400'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {past.isHidden ? 'Hidden' : 'Visible'}
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-mono font-bold">
                                <Calendar size={11} />
                                <span>{past.date}</span>
                              </div>
                            </div>

                            <h4 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 line-clamp-2 min-h-10">
                              {past.title}
                            </h4>
                          </div>

                          {/* Controls Footer */}
                          <div className="flex justify-between items-center mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/45 gap-2">
                            <div className="flex items-center gap-1.5">
                              {/* Edit option */}
                              <button
                                onClick={() => handleStartEditPastMatch(past)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer border-none"
                                title="Edit Match Description"
                              >
                                <Edit size={12} />
                              </button>

                              {/* Hide / Unhide option */}
                              <button
                                onClick={() => handleToggleHideCustomMatch(past.id)}
                                className={`p-2 rounded-lg transition-colors cursor-pointer border-none ${
                                  past.isHidden 
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-600 dark:bg-amber-500/15 dark:hover:bg-amber-500/25' 
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                                title={past.isHidden ? 'Unhide Match' : 'Hide Match'}
                              >
                                {past.isHidden ? <Eye size={12} /> : <EyeOff size={12} />}
                              </button>
                            </div>

                            {/* Delete Confirmation workflow in-UI */}
                            <div>
                              {deleteConfirmId === past.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDeleteCustomMatch(past.id)}
                                    className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-[8px] uppercase tracking-wider cursor-pointer border-none shadow-sm transition-colors"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1.5 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 text-slate-550 dark:hover:bg-slate-750 dark:text-slate-400 rounded-lg font-bold text-[8px] uppercase tracking-wider cursor-pointer border-none transition-colors"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(past.id)}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg font-bold text-[9px] uppercase tracking-wider cursor-pointer border-none transition-all"
                                  title="Permanently Delete Match"
                                >
                                  <Trash2 size={11} className="inline mr-1" />
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LIVE RESTORABLE MATCH LOGS */}
              {activeHistoryTab === 'restorable' && (
                <div className="space-y-6">
                  {/* Search and Date Range Filters Panel */}
                  <div className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row flex-wrap items-end gap-4 shadow-inner">
                    <div className="flex-1 min-w-[200px] space-y-1 w-full">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block">
                        Search Matches
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-450">
                          <Search size={13} />
                        </span>
                        <input
                          type="text"
                          value={restorableSearchQuery}
                          onChange={(e) => setRestorableSearchQuery(e.target.value)}
                          placeholder="Search teams, winners..."
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div className="w-full sm:w-auto space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={restorableStartDate}
                        onChange={(e) => setRestorableStartDate(e.target.value)}
                        className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                      />
                    </div>

                    <div className="w-full sm:w-auto space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={restorableEndDate}
                        onChange={(e) => setRestorableEndDate(e.target.value)}
                        className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-850 dark:text-slate-200 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                      />
                    </div>

                    {(restorableSearchQuery || restorableStartDate || restorableEndDate) && (
                      <button
                        onClick={() => {
                          setRestorableSearchQuery('');
                          setRestorableStartDate('');
                          setRestorableEndDate('');
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-300 rounded-xl font-bold uppercase text-[9px] tracking-widest cursor-pointer border-none transition-all w-full sm:w-auto align-middle"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Empty state handlers */}
                  {matchHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <BookOpen className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-xs uppercase font-extrabold tracking-widest text-[#a1a1aa] dark:text-slate-500">
                        No past live matches recorded yet
                      </p>
                    </div>
                  ) : filteredMatchHistory.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-850">
                      <Search className="mx-auto text-slate-350 dark:text-slate-700 mb-3" size={32} />
                      <p className="text-xs uppercase font-extrabold tracking-widest text-slate-450 dark:text-slate-500">
                        No matches found matching filter criteria
                      </p>
                      <button
                        onClick={() => {
                          setRestorableSearchQuery('');
                          setRestorableStartDate('');
                          setRestorableEndDate('');
                        }}
                        className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-xl border-none cursor-pointer"
                      >
                        Reset Filter Options
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredMatchHistory.map((past) => (
                        <div 
                          key={past.id}
                          className="bg-slate-50 dark:bg-slate-850/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md">
                                {past.oversLimit} Overs
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-400">{past.date}</span>
                            </div>

                            <div className="space-y-1.5 my-3 text-sm font-bold">
                              <div className="flex justify-between">
                                <span className="text-slate-705 dark:text-slate-300">{past.teamA}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                  {past.innings1 ? `${past.innings1.runs}/${past.innings1.wickets}` : '0/0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-705 dark:text-slate-300">{past.teamB}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                  {past.innings2 ? `${past.innings2.runs}/${past.innings2.wickets}` : '0/0'}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/45 dark:border-slate-850/30 mt-3">
                              <p className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                                <Trophy size={14} />
                                {past.winner === 'Tie' ? 'Tie Match!' : `${past.winner} ${past.winReason}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/40 w-full">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLoadPastMatch(past)}
                                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none"
                              >
                                Restore on Scoreboard
                              </button>
                              <button
                                onClick={() => setExpandedKeyMomentsId(expandedKeyMomentsId === past.id ? null : past.id)}
                                className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center gap-1 shrink-0 ${
                                  expandedKeyMomentsId === past.id
                                    ? 'bg-amber-500 text-slate-950 font-black shadow-inner shadow-black/10'
                                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}
                                title="View Match Narrative & Key Moments"
                              >
                                <BookOpen size={13} />
                                <span>{expandedKeyMomentsId === past.id ? 'Close' : 'Summary'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(past, null, 2));
                                  const downloadAnchor = document.createElement('a');
                                  downloadAnchor.setAttribute("href", dataStr);
                                  const titleSlug = `${past.teamA || 'TeamA'}_vs_${past.teamB || 'TeamB'}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                  downloadAnchor.setAttribute("download", `match_history_audit_${titleSlug}_${past.id || Date.now()}.json`);
                                  document.body.appendChild(downloadAnchor);
                                  downloadAnchor.click();
                                  downloadAnchor.remove();
                                }}
                                className="px-3.5 py-2 bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center shadow-inner"
                                title="Download Full JSON Snapshot for Data Auditing"
                                id={`btn-download-json-${past.id}`}
                              >
                                <Download size={13} />
                              </button>
                              {completedRecordDeleteConfirmId === past.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      handleDeleteLiveCompletedMatch(past.id);
                                      setCompletedRecordDeleteConfirmId(null);
                                    }}
                                    className="px-2.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-sm transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setCompletedRecordDeleteConfirmId(null)}
                                    className="px-1.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 font-extrabold text-[8px] uppercase tracking-wider rounded-xl cursor-pointer border-none transition-all"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setCompletedRecordDeleteConfirmId(past.id)}
                                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center shadow-inner"
                                  id={`btn-delete-completed-${past.id}`}
                                  title="Delete Record Permanently"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                const link = getPublicOverlayUrl(past.id);
                                copyToClipboard(link).then(() => {
                                  showNotification('OBS URL Copied! Paste as standard transparent 1920x1080 Browser Source.', 'success');
                                });
                              }}
                              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-450 border border-rose-500/15 hover:border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                              title="Copy OBS Studio transparent overlay URL"
                            >
                              <Share2 size={11} className="text-rose-500" />
                              <span>🔗 Instant OBS Copy Link</span>
                            </button>
                          </div>

                          {expandedKeyMomentsId === past.id && (
                            <div className="mt-4 p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-2 text-left">
                              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-1.5">
                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">
                                  📝 Key Moments Narrative
                                </span>
                                <button
                                  onClick={() => {
                                    copyToClipboard(generateNarrativeSummary(past));
                                    setCopiedId(past.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="text-[9px] font-black uppercase tracking-widest text-[#fbbf24] hover:underline bg-transparent border-none cursor-pointer"
                                >
                                  {copiedId === past.id ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto pr-1 select-text scrollbar-thin scrollbar-thumb-slate-300">
                                {generateNarrativeSummary(past)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 1.5: ACTIVE LIVE MATCHES */}
              {activeHistoryTab === 'live' && (
                <div>
                  {activeLiveMatches.length === 0 ? (
                    <div className="text-center py-10">
                      <Radio className="mx-auto text-emerald-500 mb-3 animate-pulse" size={32} />
                      <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400">No active live matches running in scoreboard</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeLiveMatches.map((past) => (
                        <div 
                          key={past.id}
                          className="bg-slate-50 dark:bg-slate-850/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-805 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                Live • {past.oversLimit} Overs
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-400">{past.date}</span>
                            </div>

                            <div className="space-y-1.5 my-3 text-sm font-bold">
                              <div className="flex justify-between">
                                <span className="text-slate-700 dark:text-slate-300">{past.teamA}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                  {past.innings1 ? `${past.innings1.runs}/${past.innings1.wickets}` : '0/0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-700 dark:text-slate-300">{past.teamB}</span>
                                <span className="font-mono text-cyan-600 dark:text-cyan-400 font-black">
                                  {past.innings2 ? `${past.innings2.runs}/${past.innings2.wickets}` : 'Not started'}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/45 dark:border-slate-850/30 mt-3 flex justify-between items-center">
                              <p className="text-[10px] font-black uppercase text-slate-450">
                                Current Innings: Innings {past.currentInningsNum}
                              </p>
                              {past.score?.ballsBowled !== undefined && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  ({Math.floor(past.score.ballsBowled / 6)}.{past.score.ballsBowled % 6} Overs)
                                </span>
                              )}
                            </div>

                            {/* Moderation Badges */}
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {past.isHidden && (
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                                  Hidden from spectators
                                </span>
                              )}
                              {past.isBlocked && (
                                <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded">
                                  Blocked/Restricted
                                </span>
                              )}
                            </div>

                            {/* Moderation Controls: Hide, Unhide, Block, Unblock */}
                            <div className="flex items-center justify-between gap-1 mt-3 pt-3 border-t border-dashed border-slate-200/45 dark:border-slate-800/40">
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Mod Desk:</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleToggleHideLiveMatch(past.id, !!past.isHidden)}
                                  className={`px-2 py-1 border-none rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all ${
                                    past.isHidden 
                                      ? 'bg-amber-500 text-slate-950 font-black' 
                                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400'
                                  }`}
                                  title={past.isHidden ? 'Unhide Match (Make visible to Spectators)' : 'Hide Match (Hide from Spectator lists)'}
                                >
                                  {past.isHidden ? <Eye size={9} /> : <EyeOff size={9} />}
                                  <span>{past.isHidden ? 'Unhide' : 'Hide'}</span>
                                </button>

                                <button
                                  onClick={() => handleToggleBlockLiveMatch(past.id, !!past.isBlocked)}
                                  className={`px-2 py-1 border-none rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all ${
                                    past.isBlocked 
                                      ? 'bg-rose-500 text-white font-black' 
                                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 text-slate-600 dark:text-slate-400'
                                  }`}
                                  title={past.isBlocked ? 'Unlock/Unblock Match' : 'Block Match (Restrict Access entirely)'}
                                >
                                  <Lock size={9} />
                                  <span>{past.isBlocked ? 'Blocked' : 'Block'}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800/40 w-full">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleLoadDraftMatch(past)}
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center gap-1.5"
                              >
                                <Play size={10} />
                                Open Live Panel
                              </button>
                              <a
                                href={`${window.location.origin}${window.location.pathname}#/live/cricket-details?matchId=${past.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-slate-700 dark:text-slate-200 border-none rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all shrink-0 no-underline justify-center whitespace-nowrap"
                                title="View live spectator view in a new tab"
                              >
                                <Eye size={12} />
                                <span>View</span>
                              </a>
                              {activeLiveMatchDeleteConfirmId === past.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => {
                                      handleDeleteLiveMatch(past.id);
                                      setActiveLiveMatchDeleteConfirmId(null);
                                    }}
                                    className="px-2.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-sm transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={() => setActiveLiveMatchDeleteConfirmId(null)}
                                    className="px-1.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 font-extrabold text-[8px] uppercase tracking-wider rounded-xl cursor-pointer border-none transition-all"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setActiveLiveMatchDeleteConfirmId(past.id)}
                                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center shadow-inner"
                                  title="Delete Live Match"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                const link = getPublicOverlayUrl(past.id);
                                copyToClipboard(link).then(() => {
                                  showNotification('OBS URL Copied! Paste as standard transparent 1920x1080 Browser Source.', 'success');
                                });
                              }}
                              className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/15 hover:border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
                              title="Copy OBS Studio transparent overlay URL"
                            >
                              <Share2 size={11} className="text-rose-500" />
                              <span>🔗 Instant OBS Copy Link</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SAVED DRAFTS MATCH LOGS */}
              {activeHistoryTab === 'drafts' && (
                <div>
                  {savedDrafts.length === 0 ? (
                    <div className="text-center py-10">
                      <BookOpen className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-xs uppercase font-extrabold tracking-widest text-slate-400">No manual saved drafts available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {savedDrafts.map((past) => (
                        <div 
                          key={past.id}
                          className="bg-slate-50 dark:bg-slate-850/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-805 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-[9px] font-black uppercase px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-md">
                                Draft • {past.oversLimit} Overs
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-400">{past.date}</span>
                            </div>

                            <div className="space-y-1.5 my-3 text-sm font-bold">
                              <div className="flex justify-between">
                                <span className="text-slate-700 dark:text-slate-300">{past.teamA}</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400">
                                  {past.innings1 ? `${past.innings1.runs}/${past.innings1.wickets}` : '0/0'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-700 dark:text-slate-300">{past.teamB}</span>
                                <span className="font-mono text-amber-600 dark:text-amber-400">
                                  {past.innings2 ? `${past.innings2.runs}/${past.innings2.wickets}` : '0/0'}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/45 dark:border-slate-850/30 mt-3">
                              <p className="text-[10px] font-black uppercase text-slate-450">
                                Current Innings: Innings {past.currentInningsNum}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4 pt-2">
                            <button
                              onClick={() => handleLoadDraftMatch(past)}
                              className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none"
                            >
                              Resume Match Draft 🏏
                            </button>
                            {draftMatchDeleteConfirmId === past.id ? (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    handleDeleteDraft(past.id);
                                    setDraftMatchDeleteConfirmId(null);
                                  }}
                                  className="px-2.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black text-[8px] uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-sm transition-all"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDraftMatchDeleteConfirmId(null)}
                                  className="px-1.5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-350 font-extrabold text-[8px] uppercase tracking-wider rounded-xl cursor-pointer border-none transition-all"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDraftMatchDeleteConfirmId(past.id)}
                                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer border-none flex items-center justify-center shadow-inner"
                                title="Delete Draft Permanently"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: LEADERBOARD & STATS (RECHARTS BAR CHART) */}
              {activeHistoryTab === 'stats' && (
                <div className="space-y-6 animate-none">
                  <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-inner">
                    <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Award className="text-amber-500" size={17} />
                      Top 5 Batsmen — Total Runs Leaderboard
                    </h4>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mb-6">
                      Aggregated batting performance across all completed live matches
                    </p>

                    {topBatsmenChartData.length === 0 ? (
                      <div className="text-center py-10">
                        <BarChart3 className="mx-auto text-slate-300 dark:text-slate-700 mb-3" size={32} />
                        <p className="text-xs uppercase font-extrabold tracking-widest text-[#a1a1aa] dark:text-slate-500">
                          Not enough completed matches in logs to display chart statistics
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                            <span className="text-slate-400 dark:text-slate-500 text-[8px] uppercase tracking-widest block font-black leading-none mb-1">
                              All-Time Top Scorer
                            </span>
                            <div>
                              <strong className="text-sm text-slate-800 dark:text-white font-extrabold block truncate leading-tight">
                                {topBatsmenChartData[0]?.name}
                              </strong>
                              <span className="text-[10px] text-emerald-500 font-mono font-black">
                                {topBatsmenChartData[0]?.runs} total runs ({topBatsmenChartData[0]?.matches} matches)
                              </span>
                            </div>
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                            <span className="text-slate-400 dark:text-slate-500 text-[8px] uppercase tracking-widest block font-black leading-none mb-1">
                              Best Active Average
                            </span>
                            {(() => {
                              const bestAvg = [...topBatsmenChartData].sort((a,b) => b.avg - a.avg)[0];
                              return (
                                <div>
                                  <strong className="text-sm text-slate-800 dark:text-white font-extrabold block truncate leading-tight">
                                    {bestAvg?.name}
                                  </strong>
                                  <span className="text-[10.5px] text-cyan-500 font-mono font-black">
                                    {bestAvg?.avg} Runs/Match average
                                  </span>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                            <span className="text-slate-400 dark:text-slate-500 text-[8px] uppercase tracking-widest block font-black leading-none mb-1">
                              Matches Included
                            </span>
                            <div>
                              <strong className="text-lg text-slate-850 dark:text-white font-black leading-none block">
                                {matchHistory.length}
                              </strong>
                              <span className="text-[8.5px] text-slate-400 uppercase font-black tracking-widest leading-none mt-1 block">
                                Recorded Matches
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recharts Bar Chart Container */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/65 p-4 rounded-3xl shadow-sm">
                          <div className="h-72 w-full font-mono text-[9.5px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={topBatsmenChartData}
                                margin={{ top: 20, right: 20, left: -20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} className="dark:stroke-slate-800" />
                                <XAxis 
                                  dataKey="name" 
                                  stroke="#94a3b8" 
                                  tickLine={false} 
                                  axisLine={false}
                                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} 
                                />
                                <YAxis 
                                  stroke="#94a3b8" 
                                  tickLine={false} 
                                  axisLine={false}
                                  tick={{ fill: '#64748b', fontSize: 9 }}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-lg text-[10px] text-slate-200">
                                          <p className="font-extrabold text-white text-[11px] mb-1">{data.name}</p>
                                          <p className="text-emerald-400 font-bold">Total Runs: <span className="font-black font-mono">{data.runs}</span></p>
                                          <p className="text-slate-400 font-bold">Matches: <span className="font-black font-mono">{data.matches}</span></p>
                                          <p className="text-cyan-400 font-bold">Average: <span className="font-black font-mono">{data.avg}</span></p>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="runs" radius={[8, 8, 0, 0]}>
                                  {topBatsmenChartData.map((entry, index) => {
                                    const colors = ['#34d399', '#10b981', '#059669', '#047857', '#065f46'];
                                    return (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={colors[index % colors.length]} 
                                      />
                                    );
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Complete Standings Listing */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/60 rounded-3xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 font-black text-[8.5px] uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-800">
                                <th className="p-3">Rank</th>
                                <th className="p-3">Player Name</th>
                                <th className="p-3 text-center">Matches</th>
                                <th className="p-3 text-center">Total Runs</th>
                                <th className="p-3 text-center">Average</th>
                              </tr>
                            </thead>
                            <tbody>
                              {topBatsmenChartData.map((player, idx) => (
                                <tr key={player.name} className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 font-medium font-sans">
                                  <td className="p-3 font-mono font-bold text-center w-12">
                                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-[10px] font-black ${
                                      idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                      idx === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-750 dark:text-slate-300' :
                                      'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                  </td>
                                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                                    {player.name}
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-500">
                                    {player.matches}
                                  </td>
                                  <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                                    {player.runs}
                                  </td>
                                  <td className="p-3 text-center font-mono text-cyan-600 dark:text-cyan-400">
                                    {player.avg}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add/Edit Modal overlays */}
              <AnimatePresence>
                {(showAddPastModal || showEditPastModal) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-950 dark:text-white"
                    >
                      <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="text-amber-500" size={16} />
                        {showAddPastModal ? 'Add New Past Match' : 'Edit Past Match'}
                      </h4>

                      <form onSubmit={showAddPastModal ? handleAddCustomMatch : handleSaveEditCustomMatch} className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Match Title</label>
                          <input
                            type="text"
                            value={pastTitleInput}
                            onChange={(e) => setPastTitleInput(e.target.value)}
                            placeholder="e.g. Mumbai Indians vs Chennai Super Kings"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-emerald-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Date of Match</label>
                          <input
                            type="date"
                            value={pastDateInput}
                            onChange={(e) => setPastDateInput(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-emerald-500"
                            required
                          />
                        </div>

                        <div className="flex gap-2 pt-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddPastModal(false);
                              setShowEditPastModal(false);
                              setEditingPastId(null);
                              setPastTitleInput('');
                              setPastDateInput('');
                            }}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer border-none transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer border-none flex items-center gap-1.5 shadow-md transition-all"
                          >
                            <Check size={14} />
                            {showAddPastModal ? 'Add Match' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>


        {/* ==================== 1. MATCH SETUP SCREEN ==================== */}
        {match.status === 'setup' && (
          <>
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
            
            {/* Autosaved match resume card info block */}
            {localAutosavedMatch && (
              <div className="mb-6 p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-505/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-inner">
                <div className="flex gap-3">
                  <div className="mt-0.5 p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                    <Radio className="animate-pulse" size={16} />
                  </div>
                  <div>
                    <h4 className="font-extrabold uppercase text-amber-750 dark:text-amber-400 text-sm">Ongoing Game In Progress!</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-0.5 animate-pulse">
                      Found auto-saved active match: <span className="font-extrabold text-slate-800 dark:text-white">{localAutosavedMatch.teamA} vs {localAutosavedMatch.teamB}</span> ({localAutosavedMatch.date}).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setMatch(localAutosavedMatch);
                      setSearchParams({ matchId: localAutosavedMatch.id });
                      setLocalAutosavedMatch(null);
                      showNotification('Resumed previous live match successfully!', 'success');
                    }}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 border-none rounded-xl font-black uppercase text-[10px] tracking-wider cursor-pointer transition-all shadow-sm"
                  >
                    Resume Match
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to discard the auto-saved session?')) {
                        try {
                          localStorage.removeItem('cricket_active_match');
                        } catch (e) {}
                        setLocalAutosavedMatch(null);
                        showNotification('Auto-saved match session discarded.', 'info');
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 border-none rounded-xl font-black uppercase text-[10px] tracking-wider cursor-pointer transition-all"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            {/* Live Cloud Match Banner (Detected across different devices/laptops) */}
            {!localAutosavedMatch && activeLiveMatches.length > 0 && (
              <div className="mb-6 p-5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-md">
                <div className="flex gap-3">
                  <div className="mt-0.5 p-2 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 h-9 w-9 flex items-center justify-center">
                    <Radio className="animate-pulse" size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px] uppercase tracking-wider animate-pulse">LIVE IN CLOUD</span>
                      <h4 className="font-extrabold uppercase text-emerald-700 dark:text-emerald-400 text-sm">
                        Live Match Synchronized via Firebase!
                      </h4>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold leading-normal mt-1">
                      Ongoing: <span className="font-black text-slate-900 dark:text-white">{activeLiveMatches[0].teamA} vs {activeLiveMatches[0].teamB}</span>
                      {' '}&bull; {activeLiveMatches[0].oversLimit} Overs &bull; Real-time listeners active across devices.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMatch(activeLiveMatches[0]);
                      setSearchParams({ matchId: activeLiveMatches[0].id });
                      showNotification('Connected to live cloud match!', 'success');
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl font-black uppercase text-[10px] tracking-wider cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Play size={12} fill="currentColor" /> Resume Live Match
                  </button>
                  <Link
                    to={`/live/cricket-details?matchId=${activeLiveMatches[0].id}`}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-none rounded-xl font-black uppercase text-[10px] tracking-wider transition-all no-underline text-center"
                  >
                    Spectator Mode
                  </Link>
                </div>
              </div>
            )}

            {/* Direct Scoreboard Switch Banner */}
            <div className="mb-8 p-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 rounded-3xl border border-indigo-500/10 shadow-md">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-extrabold uppercase tracking-widest mb-2">
                    <Sparkles size={11} className="text-amber-400" /> Isolated Environment
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">
                    Need an isolated score management system?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Operate tournaments or street matches on a specialized local scorekeeper dashboard with zero overlay options.
                  </p>
                </div>
                <Link
                  to="/live/local-cricket-dashboard"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer shadow-lg hover:shadow-indigo-500/20 transition-all text-center no-underline border-none shrink-0"
                >
                  Local Scoring Dashboard
                </Link>
              </div>
            </div>

            <div className="text-center mb-8">
              <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-[10px] uppercase tracking-widest">
                New Match Configuration
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-3">
                Setup Live Scorecard
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Provide Local match coordinates to initialize</p>
            </div>

            <div className="space-y-6">
              {/* Presets and Team Management Section */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Users size={14} />
                    Saved Team Rosters Presets
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(true)}
                    className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 cursor-pointer border-none"
                  >
                    <PlusCircle size={12} />
                    Manage Rosters
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Load Team A Preset</label>
                    <select
                      onChange={(e) => {
                        const sel = savedTeams.find(t => t.id === e.target.value);
                        if (sel) {
                          setTeamA(sel.name);
                          setSelectedTeamARoster(sel.players);
                          showNotification(`Loaded ${sel.name} roster (${sel.players.length} players) for Team A!`, 'success');
                        } else {
                          setSelectedTeamARoster([]);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- No preset (Manual) --</option>
                      {savedTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.players.length} players)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Load Team B Preset</label>
                    <select
                      onChange={(e) => {
                        const sel = savedTeams.find(t => t.id === e.target.value);
                        if (sel) {
                          setTeamB(sel.name);
                          setSelectedTeamBRoster(sel.players);
                          showNotification(`Loaded ${sel.name} roster (${sel.players.length} players) for Team B!`, 'success');
                        } else {
                          setSelectedTeamBRoster([]);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- No preset (Manual) --</option>
                      {savedTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.players.length} players)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Match Roster Builder and Approved Players Quick Panel */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                        Match Roster Builder (Active Squads)
                      </h4>
                      <p className="text-[8px] text-slate-400 font-medium">Add/remove players to customize match selection rosters.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Team A Customizer */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase block mb-1.5">{teamA || 'Team A'} Squad ({selectedTeamARoster.length})</span>
                        {selectedTeamARoster.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-1 leading-normal">No players loaded. Quick-add custom names or select from the approved picker below.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                            {selectedTeamARoster.map((player, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-105 dark:border-slate-800 shadow-sm">
                                {player}
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedTeamARoster(prev => prev.filter((_, i) => i !== idx))} 
                                  className="text-slate-400 hover:text-rose-500 bg-transparent border-none font-sans font-bold cursor-pointer text-[10px] ml-1 p-0 flex items-center justify-center"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-850/65 flex gap-1">
                        <input
                          type="text"
                          placeholder="Force custom player name..."
                          id="team-a-direct-add-input"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-2xs font-extrabold outline-none flex-1 text-slate-800 dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                if (!selectedTeamARoster.includes(val)) {
                                  setSelectedTeamARoster(prev => [...prev, val]);
                                }
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('team-a-direct-add-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const val = input.value.trim();
                              if (!selectedTeamARoster.includes(val)) {
                                setSelectedTeamARoster(prev => [...prev, val]);
                              }
                              input.value = '';
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg px-2.5 text-[9px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center mr-0"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Team B Customizer */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-3 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase block mb-1.5">{teamB || 'Team B'} Squad ({selectedTeamBRoster.length})</span>
                        {selectedTeamBRoster.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-1 leading-normal">No players loaded. Quick-add custom names or select from the approved picker below.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                            {selectedTeamBRoster.map((player, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 text-slate-755 dark:text-slate-300 rounded-lg text-[10px] font-bold border border-slate-105 dark:border-slate-800 shadow-sm">
                                {player}
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedTeamBRoster(prev => prev.filter((_, i) => i !== idx))} 
                                  className="text-slate-400 hover:text-rose-500 bg-transparent border-none font-sans font-bold cursor-pointer text-[10px] ml-1 p-0 flex items-center justify-center"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-850/65 flex gap-1">
                        <input
                          type="text"
                          placeholder="Force custom player name..."
                          id="team-b-direct-add-input"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-lg px-2 py-1 text-2xs font-extrabold outline-none flex-1 text-slate-800 dark:text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                if (!selectedTeamBRoster.includes(val)) {
                                  setSelectedTeamBRoster(prev => [...prev, val]);
                                }
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('team-b-direct-add-input') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const val = input.value.trim();
                              if (!selectedTeamBRoster.includes(val)) {
                                setSelectedTeamBRoster(prev => [...prev, val]);
                              }
                              input.value = '';
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-lg px-2.5 text-[9px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center mr-0"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Approved Players Selection Panel */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-center pb-1.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-500 flex items-center gap-1 select-none">
                        <Award size={13} />
                        Approved Roster Quick-Assign Picker ({approvedPlayers.length})
                      </span>
                      <span className="text-[8px] text-slate-450 italic">Click directly to allocate to matching side</span>
                    </div>

                    {approvedPlayers.length === 0 ? (
                      <div className="text-center py-4 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">No Approved Cricketers Available</p>
                        <p className="text-[9px] text-slate-450 leading-normal font-sans">Approve submitted profiles in the Super Admin dashboard first to load them dynamically.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                        {approvedPlayers.map((p) => {
                          const name = p.fullName;
                          const role = p.role;
                          const inA = selectedTeamARoster.includes(name);
                          const inB = selectedTeamBRoster.includes(name);
                          return (
                            <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 hover:border-emerald-500/20 transition-all text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center text-[10px] overflow-hidden shrink-0 shadow-inner">
                                  {p.photo ? (
                                    <img src={p.photo} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span className="font-extrabold">{name[0]}</span>
                                  )}
                                </div>
                                <div className="leading-tight">
                                  <strong className="font-black text-slate-800 dark:text-slate-100 block">{name}</strong>
                                  <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-450 leading-none">{role}</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (inA) {
                                      setSelectedTeamARoster(prev => prev.filter(x => x !== name));
                                    } else {
                                      if (inB) setSelectedTeamBRoster(prev => prev.filter(x => x !== name));
                                      setSelectedTeamARoster(prev => [...prev, name]);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase border-none cursor-pointer transition-all ${
                                    inA 
                                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' 
                                      : 'bg-white hover:bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 hover:text-emerald-500 border border-slate-150 dark:border-slate-700'
                                  }`}
                                >
                                  {inA ? 'A ✓' : '+ A'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (inB) {
                                      setSelectedTeamBRoster(prev => prev.filter(x => x !== name));
                                    } else {
                                      if (inA) setSelectedTeamARoster(prev => prev.filter(x => x !== name));
                                      setSelectedTeamBRoster(prev => [...prev, name]);
                                    }
                                  }}
                                  className={`px-2 py-1 rounded text-[9px] font-black uppercase border-none cursor-pointer transition-all ${
                                    inB 
                                      ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-slate-950 font-black shadow-sm' 
                                      : 'bg-white hover:bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 hover:text-emerald-500 border border-slate-150 dark:border-slate-700'
                                  }`}
                                >
                                  {inB ? 'B ✓' : '+ B'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Teams input names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Team A Name (Batting/Bowling)</label>
                  <input
                    type="text"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    placeholder="E.g. Super Kings"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none hover:border-emerald-500/30 transition-all text-slate-800 dark:text-white"
                  />

                  {/* Team A Upload option */}
                  <div className="mt-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    {teamALogoUrl ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-slate-250 dark:border-slate-800 shrink-0 flex items-center justify-center">
                        <img src={teamALogoUrl} alt="Team A Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setTeamALogoUrl('')}
                          className="absolute inset-0 bg-black/75 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase transition-all duration-150 cursor-pointer border-none"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-400 text-lg">
                        🛡️
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Team A Logo Emblem</span>
                      <div className="relative overflow-hidden inline-block">
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="setup-team-a-logo"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setTeamALogoUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <label htmlFor="setup-team-a-logo" className="px-3 py-1.5 bg-slate-205 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 font-extrabold text-[9px] uppercase tracking-wider rounded-lg cursor-pointer">
                          Choose Logo File
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Team B Name</label>
                  <input
                    type="text"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    placeholder="E.g. Mumbai Challengers"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none hover:border-emerald-500/30 transition-all text-slate-800 dark:text-white"
                  />

                  {/* Team B Upload option */}
                  <div className="mt-3 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    {teamBLogoUrl ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-slate-250 dark:border-slate-800 shrink-0 flex items-center justify-center">
                        <img src={teamBLogoUrl} alt="Team B Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setTeamBLogoUrl('')}
                          className="absolute inset-0 bg-black/75 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase transition-all duration-150 cursor-pointer border-none"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 text-slate-400 text-lg">
                        🛡️
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Team B Logo Emblem</span>
                      <div className="relative overflow-hidden inline-block">
                        <input 
                          type="file" 
                          accept="image/*" 
                          id="setup-team-b-logo"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setTeamBLogoUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <label htmlFor="setup-team-b-logo" className="px-3 py-1.5 bg-slate-205 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-705 dark:text-slate-300 font-extrabold text-[9px] uppercase tracking-wider rounded-lg cursor-pointer">
                          Choose Logo File
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Match Overs Count</label>
                  <select
                    value={oversLimit}
                    onChange={(e) => setOversLimit(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none hover:border-emerald-500/30 transition-all text-slate-800 dark:text-white"
                  >
                    {[1, 2, 5, 8, 10, 12, 15, 20, 50].map((ov) => (
                      <option key={ov} value={ov}>{ov} Overs</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Toss Winner Preference</label>
                    <button
                      type="button"
                      onClick={() => setShowSpinCoinModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer border-none"
                      title="Spin Coin for Toss"
                    >
                      <span>🪙 Spin Coin</span>
                    </button>
                  </div>
                  <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-250 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setTossWinner('Team A')}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                        tossWinner === 'Team A' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-400 dark:text-slate-500 bg-transparent'
                      }`}
                    >
                      {teamA ? teamA.substring(0, 15) : 'Team A'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTossWinner('Team B')}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                        tossWinner === 'Team B' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-400 dark:text-slate-500 bg-transparent'
                      }`}
                    >
                      {teamB ? teamB.substring(0, 15) : 'Team B'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Toss Choice Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Electing Option Winner</label>
                  {connectedTossInfo && (
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                      Decided by Toss: {connectedTossInfo.tossWinner}
                    </span>
                  )}
                </div>
                <div className="flex bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-250 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setTossChoice('bat')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                      tossChoice === 'bat' 
                        ? 'bg-amber-500 text-white shadow-sm animate-pulse' 
                        : 'text-slate-400 dark:text-slate-500 bg-transparent'
                    }`}
                  >
                    🏏 Eelected to Bat First
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossChoice('bowl')}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                      tossChoice === 'bowl' 
                        ? 'bg-amber-500 text-white shadow-sm animate-pulse' 
                        : 'text-slate-400 dark:text-slate-500 bg-transparent'
                    }`}
                  >
                    🥎 Elected to Bowl First
                  </button>
                </div>
              </div>

              {/* GullyScore: Cricket Digital Toss Simulator Integration Widget */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/15 border border-amber-500/30 space-y-3 shadow-inner">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                          GullyScore Digital Toss Simulator
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[9px] font-black uppercase tracking-wider">
                          Integrated
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        Perform an official digital coin toss with audio effects, MCC Law 13 rules, and captain decision logic.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSpinCoinModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none"
                    >
                      <span>🪙 Spin Coin Now</span>
                    </button>
                    <Link
                      to={`/live/cricket-toss?teamA=${encodeURIComponent(teamA || 'Team A')}&teamB=${encodeURIComponent(teamB || 'Team B')}&overs=${oversLimit}&ground=${encodeURIComponent(groundName)}&fromScoreboard=true`}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all no-underline"
                    >
                      <span>Full Toss Page</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                {/* Active Connected Toss or Local Storage Toss preview */}
                {connectedTossInfo ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🏆</span>
                      <div>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                          Toss Synchronized: <span className="underline">{connectedTossInfo.tossWinner}</span> won toss
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 ml-1.5 font-bold">
                          & elected to {connectedTossInfo.tossChoice === 'bat' ? 'Bat First 🏏' : 'Bowl First 🥎'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] uppercase">
                      Synced ✓
                    </span>
                  </div>
                ) : latestStoredToss ? (
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">
                        Recent Digital Toss Found ({latestStoredToss.timestamp || 'Today'})
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-extrabold text-slate-800 dark:text-white">
                          {latestStoredToss.teamA} vs {latestStoredToss.teamB}:
                        </span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {latestStoredToss.tossWinner} won ({latestStoredToss.coinResult || 'Coin'}) • Chose {latestStoredToss.tossChoice?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApplyStoredToss(latestStoredToss)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-sm transition-all shrink-0"
                    >
                      Import This Toss Result ✓
                    </button>
                  </div>
                ) : null}
              </div>

              {/* Match Details Extra Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Tournament Name (Optional)</label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="E.g. Bilateral Cup"
                    className="w-full bg-slate-50/80 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none hover:border-emerald-500/30 transition-all text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Series Name</label>
                  <input
                    type="text"
                    value={seriesName}
                    onChange={(e) => setSeriesName(e.target.value)}
                    placeholder="E.g. Bilateral Series"
                    className="w-full bg-slate-50/80 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none hover:border-emerald-500/30 transition-all text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Ground / Venue Name</label>
                  <input
                    type="text"
                    value={groundName}
                    onChange={(e) => setGroundName(e.target.value)}
                    placeholder="E.g. Gully Ground"
                    className="w-full bg-slate-50/80 dark:bg-slate-950/85 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none hover:border-emerald-500/30 transition-all text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleStartMatch}
                  id="btn-start-gully-match"
                  className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-wider text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <Play size={16} />
                  Start Gully Match
                </button>
                <button
                  onClick={handleSaveDraftFromSetup}
                  id="btn-save-draft-setup"
                  className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-wider text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 border-none cursor-pointer"
                  title="Save current setup as draft to resume anytime"
                >
                  <Save size={16} />
                  Save as Draft
                </button>
              </div>
            </div>
          </div>

          {/* OBS Studio Stream Integration Widget */}
          <div className="max-w-2xl mx-auto mt-8 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl text-slate-800 dark:text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -z-10" />
            
            <div className="flex items-center gap-3.5 mb-5 text-left">
              <div className="p-3 bg-rose-505/10 text-rose-500 border border-rose-500/15 rounded-2xl">
                <Radio className="animate-pulse" size={20} />
              </div>
              <div className="text-left">
                <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono text-[9px] font-extrabold uppercase tracking-widest rounded-full">OBS Integration Hub</span>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white mt-1">
                  OBS Studio Television Overlay Setup
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left">
              Turn your live cricket streaming broadcasts into professional television channels. This platform generates standard, hardware-accelerated <strong>1920x1080 transparent overlays</strong> that you can easily overlay inside your OBS Studio scenes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-150 dark:border-slate-850/50">
                <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider font-bold">How to configure in OBS</span>
                <ol className="list-decimal list-inside text-2xs text-slate-550 dark:text-slate-450 mt-1.5 space-y-1 font-semibold leading-relaxed">
                  <li>Start or resume any live cricket match above.</li>
                  <li>Click <span className="text-rose-500 dark:text-rose-400 font-bold">🔗 Instant OBS Copy Link</span> to grab your custom link.</li>
                  <li>In OBS Studio, add a new <span className="text-emerald-400 font-bold">Browser Source</span> to your scene.</li>
                  <li>Paste the copied URL and configure dimensions to: <span className="font-mono text-slate-800 dark:text-white">Width: 1920, Height: 1080</span>.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-150 dark:border-slate-850/50 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider font-bold">Overlay Specifications</span>
                  <ul className="text-2xs text-slate-550 dark:text-slate-450 mt-1.5 space-y-1.5 font-semibold">
                    <li className="flex justify-between"><span>Design Style:</span> <span className="text-slate-700 dark:text-slate-300">Slanted Pro Design</span></li>
                    <li className="flex justify-between"><span>Render Width:</span> <span className="text-slate-700 dark:text-slate-300 font-mono">1900px centered</span></li>
                    <li className="flex justify-between"><span>Base Resolution:</span> <span className="text-slate-700 dark:text-slate-300 font-mono">1920 x 1080 (HD)</span></li>
                    <li className="flex justify-between"><span>Background:</span> <span className="text-emerald-600 dark:text-emerald-400">Transparent (Chroma-Free)</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>)}


        {/* ==================== 2. MAIN MATCH SCOREBOARD ==================== */}
        {match.status !== 'setup' && currentInnings && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* INNINGS HEADER OR CONCLUDED BANNER */}
            <div className={`rounded-3xl p-6 shadow-md border ${
              match.status === 'completed'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600'
                : 'bg-emerald-800 dark:bg-emerald-950 text-white border-emerald-900'
            }`}>
              {match.status === 'completed' ? (
                <div className="text-center space-y-3">
                  <div className="inline-block p-3 bg-white/20 rounded-full">
                    <Trophy className="text-yellow-200 animate-bounce" size={32} />
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-widest text-white">
                    {match.winner === 'Tie' ? 'MATCH TIE!' : `${match.winner} VICTORIOUS`}
                  </h2>
                  <p className="text-sm font-bold uppercase tracking-widest bg-black/10 inline-block px-6 py-2 rounded-full">
                    {match.winReason}
                  </p>
                  
                  {playerOfTheMatch && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="max-w-md mx-auto bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-650 p-4.5 rounded-2xl border-2 border-yellow-300 mt-6 shadow-lg text-center text-white"
                    >
                      <span className="text-[10px] uppercase font-black tracking-widest text-yellow-250 block mb-1">
                        🌟 Player of the Match 🌟
                      </span>
                      <strong className="text-lg font-black block tracking-tight">
                        {playerOfTheMatch.name}
                      </strong>
                      <p className="font-mono text-xs mt-1 font-extrabold text-amber-100">
                        {playerOfTheMatch.runs > 0 && `${playerOfTheMatch.runs} Runs `}
                        {playerOfTheMatch.runs > 0 && playerOfTheMatch.wickets > 0 && `• `}
                        {playerOfTheMatch.wickets > 0 && `${playerOfTheMatch.wickets} Wkts (${playerOfTheMatch.runsConceded} Runs)`}
                      </p>
                      <p className="text-[8.5px] tracking-widest text-yellow-200 font-extrabold uppercase mt-1 bg-black/20 inline-block px-3 py-1 rounded-full border border-yellow-300/20">
                        Rating Points: {playerOfTheMatch.points} pts
                      </p>
                    </motion.div>
                  )}

                  {matchPerformanceHighlights && (
                    <div className="max-w-md mx-auto grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20 text-xs text-white/90">
                      <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                        <span className="text-[9px] uppercase tracking-widest text-yellow-300 block mb-1 font-black">Top Scorer</span>
                        <strong className="text-sm">{matchPerformanceHighlights.bestBatter.name}</strong>
                        <p className="font-mono text-[10px] mt-0.5">{matchPerformanceHighlights.bestBatter.runs} Runs ({matchPerformanceHighlights.bestBatter.balls} Balls)</p>
                      </div>
                      <div className="bg-white/10 p-3 rounded-xl border border-white/15">
                        <span className="text-[9px] uppercase tracking-widest text-yellow-300 block mb-1 font-black">Most Wickets</span>
                        <strong className="text-sm">{matchPerformanceHighlights.bestBowler.name}</strong>
                        <p className="font-mono text-[10px] mt-0.5">{matchPerformanceHighlights.bestBowler.wickets} Wkts (conceded {matchPerformanceHighlights.bestBowler.runs} runs)</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4 justify-center">
                    <button
                      onClick={handleResetMatch}
                      className="px-6 py-2.5 bg-white hover:bg-slate-100 text-emerald-800 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer border-none shadow-sm"
                    >
                      New Match Setup
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md animate-pulse">
                        Innings {match.currentInningsNum} Active
                      </span>
                      {match.targetRuns && (
                        <span className="px-3 py-1 bg-black/20 text-amber-200 text-[9px] font-black uppercase tracking-wider rounded-md">
                          Target: {match.targetRuns} Runs
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-2 leading-none">
                      {currentInnings.battingTeam} is Batting
                    </h2>
                    <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-1">
                      Defending Bowling side: <strong className="text-white bg-emerald-900 px-2 py-0.5 rounded-md font-extrabold">{currentInnings.bowlingTeam}</strong>
                    </p>
                  </div>

                  {/* CRR & RRR statistics bar */}
                  <div className="flex items-center gap-6 text-sm bg-black/20 p-4 rounded-2xl border border-emerald-700/30">
                    <div className="text-center">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200 block mb-0.5">Current Run Rate</span>
                      <strong className="font-mono text-base text-yellow-300 block">
                        <motion.span
                          key={`crr-cockpit-${calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}`}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: [1.2, 1] }}
                          transition={{ duration: 0.2 }}
                          className="inline-block"
                        >
                          {calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}
                        </motion.span>
                      </strong>
                    </div>

                    {match.currentInningsNum === 2 && match.targetRuns && (
                      <div className="text-center border-l border-white/10 pl-6">
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200 block mb-0.5">Required Run Rate</span>
                        <strong className="font-mono text-base text-yellow-300 block">
                          <motion.span
                            key={`rrr-cockpit-${(() => {
                              const ballsLeft = (match.oversLimit * 6) - currentInnings.ballsBowled;
                              const runsToGet = match.targetRuns - currentInnings.runs;
                              if (ballsLeft <= 0) return '∞';
                              return ((runsToGet / ballsLeft) * 6).toFixed(2);
                            })()}`}
                            initial={{ scale: 0.7 }}
                            animate={{ scale: [1.2, 1] }}
                            transition={{ duration: 0.2 }}
                            className="inline-block"
                          >
                            {(() => {
                              const ballsLeft = (match.oversLimit * 6) - currentInnings.ballsBowled;
                              const runsToGet = match.targetRuns - currentInnings.runs;
                              if (ballsLeft <= 0) return '∞';
                              return ((runsToGet / ballsLeft) * 6).toFixed(2);
                            })()}
                          </motion.span>
                        </strong>
                      </div>
                    )}

                    <div className="text-center border-l border-white/10 pl-6">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200 block mb-0.5">Overs Limit</span>
                      <strong className="font-mono text-base text-white">
                        {match.oversLimit} Overs
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ==================== UNIFIED MATCH COCKPIT FRAME ==================== */}
            <div className="bg-slate-900 border-2 border-slate-950 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-2xl relative overflow-hidden text-white space-y-6">
              
              {/* INNINGS BREAK CONTROLS & VISUAL COUNTDOWN TIMER */}
              {match.status === 'live' && match.currentInningsNum === 2 && match.innings2 && match.innings2.ballsBowled === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 rounded-3xl border-2 border-amber-500/40 shadow-lg text-white space-y-4"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        {/* Circular pulsing animation */}
                        <span className="absolute inline-flex h-12 w-12 rounded-full bg-amber-500/20 animate-ping" />
                        <div className="relative p-2.5 bg-amber-500 text-slate-950 rounded-2xl">
                          <Trophy className="animate-pulse" size={20} />
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-black tracking-widest text-[#fbbf24] px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/25">
                          Innings Break Session
                        </span>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white mt-1">
                          Prepare for the Chase!
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                          Target: <strong className="text-white">{match.targetRuns} runs</strong> in {match.oversLimit} overs (Req: {((match.targetRuns / (match.oversLimit * 6)) * 6).toFixed(2)} RPO)
                        </p>
                      </div>
                    </div>

                    {/* Timer interface */}
                    <div className="flex items-center gap-4 bg-slate-900/60 px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
                      <div className="text-right">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Time Remaining</span>
                        <strong className="font-mono text-2xl text-yellow-300 block tracking-wider leading-none">
                          {Math.floor(inningsBreakTimeLeft / 60).toString().padStart(2, '0')}:{(inningsBreakTimeLeft % 60).toString().padStart(2, '0')}
                        </strong>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                        <button
                          onClick={() => setIsInningsBreakTimerRunning(!isInningsBreakTimerRunning)}
                          className={`p-2 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center ${
                            isInningsBreakTimerRunning 
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' 
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 animate-bounce'
                          }`}
                          title={isInningsBreakTimerRunning ? "Pause Timer" : "Start Timer"}
                        >
                          {isInningsBreakTimerRunning ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          )}
                        </button>

                        <button
                          onClick={() => setInningsBreakTimeLeft(prev => prev + 120)}
                          className="px-2.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-mono text-xs font-bold transition-all border-none cursor-pointer"
                          title="Add 2 minutes"
                        >
                          +2m
                        </button>

                        <button
                          onClick={() => {
                            setInningsBreakTimeLeft(300);
                            setIsInningsBreakTimerRunning(false);
                          }}
                          className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-405 hover:text-white rounded-xl transition-all border-none cursor-pointer flex items-center justify-center"
                          title="Reset Timer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Line Bar */}
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 h-full"
                      style={{ width: `${Math.min(100, (inningsBreakTimeLeft / 300) * 100)}%` }}
                      layout
                    />
                  </div>
                </motion.div>
              )}

              {/* Cockpit Header with Innings Active badge & operational tools */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="px-3.5 py-1 bg-emerald-500 text-slate-950 rounded-full font-black text-[9px] uppercase tracking-widest animate-pulse flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                    Innings {match.currentInningsNum} Active
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                    Live Scorer Cockpit
                  </span>
                </div>

                {!isSpectator && match.status === 'live' && (
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {/* Togglable AI Commentary Mode */}
                    <button
                      onClick={() => {
                        setAiCommentaryEnabled(prev => !prev);
                        showNotification(`AI Commentary Mode ${!aiCommentaryEnabled ? 'Enabled' : 'Disabled'}`, 'info');
                      }}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        aiCommentaryEnabled 
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-850 hover:bg-slate-800 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Sparkles size={11} className={aiCommentaryEnabled ? "text-emerald-400 animate-bounce" : "text-slate-400"} />
                      AI Commentary: {aiCommentaryEnabled ? 'ON' : 'OFF'}
                    </button>

                    <button 
                      onClick={handleUndoAction}
                      disabled={undoStack.length === 0}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-45 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none flex items-center gap-1.5 shadow-sm active:scale-95 text-slate-300"
                    >
                      <Undo size={11} />
                      Undo ({undoStack.length})
                    </button>

                    <button
                      onClick={() => {
                        setEditModalTeamA(match.teamA);
                        setEditModalTeamB(match.teamB);
                        setEditModalOversLimit(match.oversLimit);
                        if (currentInnings) {
                          setEditModalRuns(currentInnings.runs);
                          setEditModalWickets(currentInnings.wickets);
                          setEditModalBallsBowled(currentInnings.ballsBowled);
                        } else {
                          setEditModalRuns(0);
                          setEditModalWickets(0);
                          setEditModalBallsBowled(0);
                        }
                        setShowEditMatchModal(true);
                      }}
                      className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Settings size={10} />
                      Edit Match
                    </button>

                    <button
                      onClick={() => setShowBroadcastCenter(prev => !prev)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border flex items-center gap-1.5 shadow-sm active:scale-95 ${
                        showBroadcastCenter 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.35)] animate-pulse' 
                          : 'bg-slate-850 hover:bg-slate-850 hover:text-white text-slate-400 border-slate-800'
                      }`}
                    >
                      <Radio size={11} className={showBroadcastCenter ? "text-rose-400 animate-pulse" : "text-slate-400"} />
                      📺 Broadcast Overlay Setup
                    </button>

                    <button
                      onClick={() => {
                        const link = getPublicOverlayUrl(match.id);
                        copyToClipboard(link).then(() => {
                          showNotification('OBS URL Copied! Paste as standard transparent 1920x1080 Browser Source.', 'success');
                        });
                      }}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Copy standard transparent 1080p overlay link for OBS Studio"
                    >
                      <Link2 size={12} className="text-rose-400" />
                      <span>Instant OBS Copy Link</span>
                    </button>

                    <button
                      onClick={() => {
                        const spectatorUrl = `${window.location.origin}${window.location.pathname}#/live/cricket-details?matchId=${match.id}`;
                        copyToClipboard(spectatorUrl).then(() => {
                          showNotification('Live Spectator Link Copied! Open on any other laptop or phone to watch real-time score updates.', 'success');
                        });
                      }}
                      className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                      title="Share live scoreboard spectator link across devices"
                    >
                      <Share2 size={12} className="text-emerald-400" />
                      <span>Share Live Score Link</span>
                    </button>

                    {declareInningsConfirm ? (
                      <div className="flex items-center gap-1.5 px-1.5 py-1.5 bg-slate-950/80 border border-amber-500/20 rounded-xl">
                        <span className="text-[8px] font-black text-amber-500 uppercase">Lock?</span>
                        <button
                          onClick={() => {
                            handleDeclareInnings();
                            setIsInningsLocked(true);
                            setDeclareInningsConfirm(false);
                          }}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded font-black text-[8px] uppercase cursor-pointer border-none"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeclareInningsConfirm(false)}
                          className="px-1.5 py-1 bg-slate-800 text-slate-350 rounded font-black text-[8px] uppercase cursor-pointer border-none"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeclareInningsConfirm(true)}
                        className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        End Innings
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* COLLAPSIBLE TV GRAPHICS BROADCAST SETUP CENTER */}
              <AnimatePresence>
                {showBroadcastCenter && (() => {
                  const activeOverlayConfig = match.overlayConfig || {
                    template: 'broadcast-pro',
                    showStatsPanel: true,
                    showTicker: true,
                    tickerMessage: 'LIVE BROADCAST PRESENTATION',
                    manualWicketTrigger: false,
                    manualOutsDisplay: 'none',
                    manualFreeHitTrigger: false,
                    teamAColor: '#ea002a',
                    teamBColor: '#00529b',
                    showScoreBug: true,
                    customBanner: 'none',
                    customBannerText: '',
                    boundaryBlast: false
                  };

                  const lastDelivery = currentInnings?.commentaryList?.[0];
                  const lastDeliveryFourCount = (lastDelivery?.type === 'boundary' && (lastDelivery.description?.toLowerCase().includes('four') || lastDelivery.description?.toLowerCase().includes('4 runs'))) ? 1 : 0;
                  const lastDeliverySixCount = (lastDelivery?.type === 'boundary' && (lastDelivery.description?.toLowerCase().includes('six') || lastDelivery.description?.toLowerCase().includes('6 runs'))) ? 1 : 0;

                  return (
                    <motion.div
                      id="print-section"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      className={`overflow-hidden bg-slate-950/25 p-5 md:p-6 rounded-[2rem] border transition-all duration-300 space-y-5 relative ${
                        wicketTriggerAlert 
                          ? 'border-[rgba(239,68,68,1)] shadow-[0_0_70px_rgba(239,68,68,0.75)] animate-pulse' 
                          : activeOverlayConfig.boundaryBlast 
                            ? 'boundary-blast-effect border-transparent shadow-[0_0_55px_rgba(251,191,36,0.5)]' 
                            : 'border-white/5 shadow-none'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-white/5">
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Radio className="text-rose-500 animate-pulse" size={16} />
                            TV SCORE BUG BRODCAST & OVERLAYS CONTROL DESK
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-relaxed">
                            Synchronize graphics in real-time with OBS Studio, Streamlabs, or vMix. Output includes animations, layouts, and boundary highlights.
                          </p>
                          
                          {/* Live boundary counter badges inside header */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">
                              Last Delivery Boundaries:
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                              lastDeliveryFourCount > 0 
                                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-bounce font-extrabold' 
                                : 'bg-slate-900 border border-white/5 text-slate-500'
                            }`}>
                              4s: {lastDeliveryFourCount}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                              lastDeliverySixCount > 0 
                                ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-bounce font-extrabold' 
                                : 'bg-slate-900 border border-white/5 text-slate-500'
                            }`}>
                              6s: {lastDeliverySixCount}
                            </span>
                          </div>
                        </div>

                      {/* COPY OBS BROWSER SOURCE LINK */}
                      <div className="flex gap-2 w-full lg:w-auto">
                        <button
                          onClick={() => {
                            const link = getPublicOverlayUrl(match.id);
                            copyToClipboard(link).then(() => {
                              showNotification('OBS URL Copied! Paste as transparent 1920x1080 Browser Source.', 'success');
                            });
                          }}
                          className="flex-1 lg:flex-none px-4 py-3 bg-rose-600 hover:bg-rose-500 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-rose-600/10 flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <Check size={14} className="text-slate-950" />
                          Copy OBS overlay URL
                        </button>
                        <a
                          href={getPublicOverlayUrl(match.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} />
                          Preview Overlay
                        </a>
                      </div>
                    </div>

                    {(() => {
                      const activeOverlayConfig = match.overlayConfig || {
                        template: 'broadcast-pro',
                        showStatsPanel: true,
                        showTicker: true,
                        tickerMessage: 'LIVE BROADCAST PRESENTATION',
                        manualWicketTrigger: false,
                        manualOutsDisplay: 'none',
                        manualFreeHitTrigger: false,
                        teamAColor: '#ea002a',
                        teamBColor: '#00529b',
                        showScoreBug: true,
                        customBanner: 'none',
                        customBannerText: ''
                      };

                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                          {/* SUB CELL 1: SELECT DISPLAY TEMPLATES */}
                          <div className="space-y-2.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">1. Style Template Selection</span>
                             <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'broadcast-pro', label: 'Broadcast Pro', desc: 'ESPN Gradient Theme' },
                                { id: 'neon-sport', label: 'Neon Cyber', desc: 'Sleek Emerald Edge' },
                                { id: 'clean-white', label: 'Clean White', desc: 'Minimal Light Card' },
                                { id: 'ipl-style', label: 'Vibrant IPL', desc: 'Purple Gradient Bold' },
                                { id: 'score-bug-1900-200', label: 'Score Bug (1900x200)', desc: 'Giant Centered Bug' },
                                { id: 'slanted-pro-design', label: 'Slanted Live Ribbon', desc: 'Dynamic Lower Third design' }
                              ].map(t => {
                                const isActive = activeOverlayConfig.template === t.id;

                                return (
                                  <button
                                    key={t.id}
                                    onClick={() => {
                                      const updated = { ...activeOverlayConfig, template: t.id as any };
                                      syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                    }}
                                    className={`p-2.5 text-left rounded-xl transition-all border outline-none cursor-pointer flex flex-col justify-between h-[68px] ${
                                      isActive 
                                        ? 'bg-slate-900 border-white/20 shadow-lg text-white font-black' 
                                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:bg-slate-900/50'
                                    }`}
                                  >
                                    <span className="text-[10px] uppercase tracking-tight block">{t.label}</span>
                                    <span className="text-[8px] opacity-45 truncate block mt-0.5">{t.desc}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* SUB CELL 2: DISPLAY SEGMENT TOGGLES */}
                          <div className="space-y-3.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">2. Display Elements Settings</span>
                            
                            <div className="space-y-1.5 text-xs uppercase font-black">
                              {[
                                { key: 'showScoreBug', label: 'TV Score Bug Graphic' },
                                { key: 'showStatsPanel', label: 'Match Stats Summary strip' },
                                { key: 'showTicker', label: 'Scrolling News Ticker' },
                                { key: 'boundaryBlast', label: '⚡ Boundary, six & wicket Blast' }
                              ].map(opt => {
                                const isChecked = opt.key === 'boundaryBlast'
                                  ? !!activeOverlayConfig.boundaryBlast
                                  : (activeOverlayConfig as any)[opt.key] !== false;

                                const isBlast = opt.key === 'boundaryBlast';

                                return (
                                  <label 
                                    key={opt.key} 
                                    className={`flex items-center gap-2.5 p-2 hover:bg-slate-900 rounded-xl cursor-pointer select-none text-[10px] border transition-all ${
                                      isBlast 
                                        ? (isChecked 
                                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-extrabold shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse'
                                            : 'bg-slate-950/45 border-amber-500/10 text-slate-400 hover:text-amber-300'
                                          )
                                        : 'bg-slate-950/45 border-white/5 text-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const updated: any = { ...activeOverlayConfig, [opt.key]: e.target.checked };
                                        if (isBlast && e.target.checked) {
                                          // Auto-trigger a 2-second alert animation to show off the blast effect immediately!
                                          updated.manualAlertTrigger = {
                                            type: 'six',
                                            timestamp: Date.now()
                                          };
                                        }
                                        syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                      }}
                                      className={`rounded cursor-pointer w-3.5 h-3.5 ${isBlast ? 'accent-amber-500' : 'accent-rose-500'}`}
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {/* TICKER TEXT INPUT */}
                            <div className="space-y-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Scrolling message contents</span>
                              <input
                                type="text"
                                value={activeOverlayConfig.tickerMessage || 'LIVE BROADCAST PRESENTATION'}
                                onChange={(e) => {
                                  const updated = { ...activeOverlayConfig, tickerMessage: e.target.value };
                                  syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                }}
                                className="w-full bg-slate-950 text-white rounded-xl text-[10px] px-3 py-2 border border-white/5 hover:border-white/10 focus:outline-none focus:border-rose-500/40 uppercase font-mono"
                                placeholder="Enter scrolling custom text..."
                              />
                              
                              {/* TICKER QUICK PRESETS */}
                              <div className="pt-1.5 space-y-1">
                                <span className="text-[7.5px] font-bold text-slate-500 uppercase block">Ticker Message Presets</span>
                                <div className="flex flex-wrap gap-1">
                                  {[
                                    { label: 'Drinks Break', msg: '🥤 DRINKS INTERVAL IN PROGRESS • RESUMING SHORTLY • STREAM POWERED BY GRAPHICS ENGINE' },
                                    { label: 'Rain Delay', msg: '🌧️ PLAY DELAYED DUE TO RAIN • COVERS ARE ON • STAY TUNED FOR LIVE UPDATES' },
                                    { label: 'Innings Intermission', msg: '🎬 INNINGS BREAK • COMFORTABLE RUN-CHASE INBOUND • LIVE SPORT ACTION' },
                                    { label: 'Stream Starting', msg: '⚡ STREAM STARTING SOON • TEAMS PREPARING CONTROLS • ENJOY BEST MATCH COVERAGE' }
                                  ].map((p, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        const updated = { ...activeOverlayConfig, tickerMessage: p.msg };
                                        syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        showNotification(`Ticker updated to: ${p.label}`, 'success');
                                      }}
                                      className="px-1.5 py-1 bg-slate-900 border border-white/5 hover:border-white/10 hover:text-white rounded text-[7px] font-bold text-slate-400 cursor-pointer"
                                    >
                                      {p.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SUB CELL 3: BROADCAST SPECIAL TRIGGERS */}
                          <div className="space-y-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">3. Incident Special triggers overrides</span>
                            
                            <div className="space-y-2">
                              {/* Force Innings layout overrides */}
                              <div>
                                <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Layout mode override</span>
                                <div className="flex gap-1.5 text-[9px] font-bold">
                                  {[
                                    { id: 0, label: 'Auto' },
                                    { id: 1, label: '1st Inn' },
                                    { id: 2, label: '2nd Inn' }
                                  ].map(f => {
                                    const isActive = (activeOverlayConfig.forceInningsLayout === f.id) || (f.id === 0 && !activeOverlayConfig.forceInningsLayout);

                                    return (
                                      <button
                                        key={f.id}
                                        onClick={() => {
                                          const updated = { ...activeOverlayConfig, forceInningsLayout: f.id as any };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className={`flex-1 px-1.5 py-1.5 rounded-lg border text-center font-bold cursor-pointer ${
                                          isActive 
                                            ? 'bg-slate-900 border-white/10 text-rose-400' 
                                            : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-300'
                                        }`}
                                      >
                                        {f.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Free hit & Wickets Fall toggling */}
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { key: 'manualWicketTrigger', label: 'Wicket fall alert' },
                                  { key: 'manualFreeHitTrigger', label: 'Pulse Free Hit badge' }
                                ].map(trigger => {
                                  const isActive = !!(activeOverlayConfig as any)[trigger.key];

                                  return (
                                    <button
                                      key={trigger.key}
                                      onClick={() => {
                                        const updated = { ...activeOverlayConfig, [trigger.key]: !isActive };
                                        syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                      }}
                                      className={`p-2 rounded-xl text-[8.5px] font-black uppercase text-center border cursor-pointer outline-none ${
                                        isActive 
                                          ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse' 
                                          : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-400'
                                      }`}
                                    >
                                      {trigger.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Live Animated Overlay Triggers */}
                              <div className="pt-2.5 border-t border-white/5 space-y-2">
                                <span className="text-[8px] font-black tracking-wider text-slate-450 uppercase block">Live Alert Animations</span>
                                <div className="flex flex-col gap-1.5">
                                  {[
                                    { id: 'six', label: 'Show SIX', style: 'border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.15)]' },
                                    { id: 'four', label: 'Show FOUR', style: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]' },
                                    { id: 'wicket', label: 'Show WICKET', style: 'border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.15)]' }
                                  ].map(alertType => (
                                    <button
                                      key={alertType.id}
                                      onClick={() => {
                                        const updated = {
                                          ...activeOverlayConfig,
                                          manualAlertTrigger: {
                                            type: alertType.id as 'six' | 'four' | 'wicket',
                                            timestamp: Date.now()
                                          }
                                        };
                                        syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                      }}
                                      className={`w-full py-1.5 px-3 rounded-lg border text-[9px] font-black uppercase text-center cursor-pointer transition-all ${alertType.style}`}
                                    >
                                      {alertType.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SUB CELL 4: TEAM CUSTOM ACCENT COLORS & OUTS WINDOW */}
                          <div className="space-y-2.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">4. Stadium customizations & out displays</span>
                            
                            {/* OUTS Manual Displays layout selector */}
                            <div>
                              <span className="text-[8px] font-bold text-slate-500 uppercase block mb-1">Batsman OUT popups</span>
                              <div className="flex gap-1 text-[8.5px] font-black">
                                {[
                                  { id: 'none', label: 'Off' },
                                  { id: 'corner', label: 'Corner' },
                                  { id: 'fullscreen', label: 'Fullscr.' }
                                ].map(o => {
                                  const isActive = (activeOverlayConfig.manualOutsDisplay === o.id) || (o.id === 'none' && !activeOverlayConfig.manualOutsDisplay);

                                  return (
                                    <button
                                      key={o.id}
                                      onClick={() => {
                                        const updated = { ...activeOverlayConfig, manualOutsDisplay: o.id as any };
                                        syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                      }}
                                      className={`flex-1 px-1 py-1.5 rounded-lg border text-center cursor-pointer ${
                                        isActive 
                                          ? 'bg-slate-900 border-white/10 text-emerald-400' 
                                          : 'bg-slate-950/40 border-white/5 text-slate-500'
                                      }`}
                                    >
                                      {o.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Team Accent Color Hex picks */}
                            <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-400 uppercase">
                              <div>
                                <span className="block mb-1 truncate">{match.teamA} color</span>
                                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-white/5 rounded-xl">
                                  <input
                                    type="color"
                                    value={activeOverlayConfig.teamAColor || '#ea002a'}
                                    onChange={(e) => {
                                      const updated = { ...activeOverlayConfig, teamAColor: e.target.value };
                                      syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                    }}
                                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent shrink-0"
                                  />
                                  <span className="text-[8px] font-mono font-bold text-slate-300">
                                    {(activeOverlayConfig.teamAColor || '#ea002a').substring(0, 7)}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span className="block mb-1 truncate">{match.teamB} color</span>
                                <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-white/5 rounded-xl">
                                  <input
                                    type="color"
                                    value={activeOverlayConfig.teamBColor || '#00529b'}
                                    onChange={(e) => {
                                      const updated = { ...activeOverlayConfig, teamBColor: e.target.value };
                                      syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                    }}
                                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent shrink-0"
                                  />
                                  <span className="text-[8px] font-mono font-bold text-slate-300">
                                    {(activeOverlayConfig.teamBColor || '#00529b').substring(0, 7)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* SUB CELL 5: REAL-TIME GRAPHICS SWITCHBOARD */}
                          <div className="space-y-3 lg:col-span-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">5. Instant Overlay Trigger Switchboard</span>
                            
                            <div className="space-y-2">
                              <span className="text-[7.5px] font-bold text-slate-500 uppercase block leading-none">Instant Graphic Overlays</span>
                              <div className="grid grid-cols-2 gap-1.5">
                                {[
                                  { id: 'four', label: '🏏 FOUR runs', color: 'hover:bg-sky-500/10 hover:text-sky-400 border-sky-500/20' },
                                  { id: 'six', label: '🔥 SIX runs', color: 'hover:bg-amber-500/10 hover:text-amber-400 border-amber-500/20' },
                                  { id: 'out', label: '❌ WICKET', color: 'hover:bg-red-500/10 hover:text-red-400 border-red-500/20' },
                                  { id: 'free_hit', label: '⚡ Free Hit', color: 'hover:bg-purple-500/10 hover:text-purple-450 border-purple-500/20' },
                                  { id: 'fifty', label: '⭐ 50 Alert', color: 'hover:bg-teal-500/10 hover:text-teal-400 border-teal-500/20' },
                                  { id: 'hundred', label: '👑 100 Alert', color: 'hover:bg-emerald-500/10 hover:text-emerald-400 border-emerald-500/20' },
                                  { id: 'drinks', label: '🥤 DRINKS', color: 'hover:bg-indigo-500/10 hover:text-indigo-400 border-indigo-500/20' },
                                  { id: 'rain', label: '🌧️ RAIN DELAY', color: 'hover:bg-zinc-500/20 hover:text-zinc-405 border-zinc-500/20' }
                                ].map(btn => {
                                  const isCurrentActive = activeOverlayConfig.customBanner === btn.id;

                                  return (
                                    <button
                                      key={btn.id}
                                      onClick={() => {
                                        const nextValue = isCurrentActive ? 'none' : btn.id;
                                        const updated: any = { 
                                          ...activeOverlayConfig, 
                                          customBanner: nextValue as any,
                                          customBannerText: nextValue === 'none' ? '' : activeOverlayConfig.customBannerText || ''
                                        };

                                        // Auto-trigger animated fullscreen broadcast overlay for Six, Four, or Out (Wicket)
                                        if (nextValue === 'six' || nextValue === 'four' || nextValue === 'out') {
                                          updated.manualAlertTrigger = {
                                            type: nextValue === 'out' ? 'wicket' : nextValue,
                                            timestamp: Date.now()
                                          };
                                        }

                                        syncMatch(prev => ({ ...prev, overlayConfig: updated }));

                                        // Auto clear for transient banners after 4.5 seconds (except rain and drinks)
                                        if (nextValue !== 'none' && nextValue !== 'rain' && nextValue !== 'drinks') {
                                          setTimeout(() => {
                                            syncMatch(prev => {
                                              const latest = prev.overlayConfig || activeOverlayConfig;
                                              if (latest.customBanner === nextValue) {
                                                return {
                                                  ...prev,
                                                  overlayConfig: {
                                                    ...latest,
                                                    customBanner: 'none',
                                                    customBannerText: ''
                                                  }
                                                };
                                              }
                                              return prev;
                                            });
                                          }, 4500);
                                        }
                                        showNotification(`${btn.label} triggered on broadcast overlay.`, 'success');
                                      }}
                                      className={`p-1.5 rounded-xl text-[8px] font-black uppercase text-center border cursor-pointer transition-all outline-none ${
                                        isCurrentActive
                                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-450 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse font-bold'
                                          : `bg-slate-950/40 border-white/5 text-slate-450 ${btn.color}`
                                      }`}
                                    >
                                      {btn.label}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Quick Message Subtitle Info */}
                              <div className="pt-1">
                                <span className="text-[7.5px] font-bold text-slate-500 uppercase block mb-1">Banner custom subtitle text</span>
                                <input
                                  type="text"
                                  value={activeOverlayConfig.customBannerText || ''}
                                  onChange={(e) => {
                                    const updated = { ...activeOverlayConfig, customBannerText: e.target.value };
                                    syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                  }}
                                  className="w-full bg-slate-950 text-slate-300 rounded-lg text-[9px] px-2 py-1.5 border border-white/5 hover:border-white/10 focus:outline-none focus:border-rose-500/40 uppercase font-mono"
                                  placeholder="E.g., STUPENDOUS DRIVE!"
                                />
                              </div>

                              {/* Clear Banner Button */}
                              {activeOverlayConfig.customBanner !== 'none' && (
                                <button
                                  onClick={() => {
                                    const updated = { ...activeOverlayConfig, customBanner: 'none' as any, customBannerText: '' };
                                    syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                  }}
                                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-[8.5px] uppercase tracking-wider rounded-xl cursor-pointer border-none transition-all shadow-md shadow-rose-600/15"
                                >
                                  ✕ CLEAR ACTIVE BANNER
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* CUSTOM SCOREBOARD IMAGE OVERLAY DESIGN PANEL */}
                        <div className="pt-6 border-t border-white/5 space-y-4 font-sans text-left">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div>
                              <h5 className="text-[11px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
                                🖼️ Custom Scoreboard Image Design Overlay
                              </h5>
                              <p className="text-[9px] text-slate-400 font-bold">
                                Have your own proprietary graphics design or offline mockup image? Toggle it as an active broadcast graphic or backdrop guide.
                              </p>
                            </div>
                            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 hover:border-rose-500/20 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={!!activeOverlayConfig.customOverlayEnabled}
                                onChange={(e) => {
                                  const updated = { ...activeOverlayConfig, customOverlayEnabled: e.target.checked };
                                  syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                }}
                                className="accent-rose-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Enable Image Overlay</span>
                            </label>
                          </div>

                          {!!activeOverlayConfig.customOverlayEnabled && (
                            <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl grid grid-cols-1 lg:grid-cols-12 gap-6">
                              {/* Source image URL */}
                              <div className="lg:col-span-5 space-y-3">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Image URL Source / Backdrop mockup</span>
                                  <input 
                                    type="text"
                                    value={activeOverlayConfig.customOverlayImg || ''}
                                    onChange={(e) => {
                                      const updated = { ...activeOverlayConfig, customOverlayImg: e.target.value };
                                      syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                    }}
                                    className="w-full bg-slate-950 text-white rounded-xl text-[10px] px-3 py-2 border border-white/10 hover:border-white/20 focus:border-rose-500/40 outline-none"
                                    placeholder="Paste PNG/SVG scoreboard image URL..."
                                  />
                                </div>
                                
                                <div>
                                  <span className="text-[8.5px] font-black uppercase text-slate-500 block mb-1">Demo Template Designs</span>
                                  <div className="flex flex-col gap-1.5">
                                    {[
                                      { name: '📺 Classic TV Bar', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&h=80&q=80' },
                                      { name: '🔥 Cyber Neon Bug', url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=250&h=100&q=80' },
                                      { name: '💎 Minimal Glass Plate', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=450&h=90&q=80' }
                                    ].map((preset, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          const updated = {
                                            ...activeOverlayConfig,
                                            customOverlayImg: preset.url,
                                            customOverlayEnabled: true,
                                            customOverlayScale: 1.0,
                                            customOverlayOpacity: 0.95
                                          };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-full p-2 bg-slate-950 hover:bg-slate-900 border border-white/5 hover:border-white/15 rounded-xl text-[9px] font-medium text-slate-300 flex justify-between items-center transition-all cursor-pointer"
                                      >
                                        <span>{preset.name}</span>
                                        <span className="text-[7px] text-slate-500 truncate max-w-[120px]">{preset.url}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Geometry offsets */}
                              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-400 uppercase">
                                {/* X & Y offset sliders */}
                                <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-white/5">
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[8.5px] font-black text-slate-400">Horizontal Position (X)</span>
                                      <span className="text-[9px] font-mono font-black text-rose-450">
                                        {activeOverlayConfig.customOverlayX !== undefined ? activeOverlayConfig.customOverlayX : 50}px
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        onClick={() => {
                                          const currentX = activeOverlayConfig.customOverlayX !== undefined ? activeOverlayConfig.customOverlayX : 50;
                                          const updated = { ...activeOverlayConfig, customOverlayX: Math.max(0, currentX - 10) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >-</button>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="1920"
                                        step="5"
                                        value={activeOverlayConfig.customOverlayX !== undefined ? activeOverlayConfig.customOverlayX : 50}
                                        onChange={(e) => {
                                          const updated = { ...activeOverlayConfig, customOverlayX: parseInt(e.target.value) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="flex-1 accent-rose-500 h-1 cursor-pointer"
                                      />
                                      <button 
                                        onClick={() => {
                                          const currentX = activeOverlayConfig.customOverlayX !== undefined ? activeOverlayConfig.customOverlayX : 50;
                                          const updated = { ...activeOverlayConfig, customOverlayX: Math.min(1920, currentX + 10) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >+</button>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[8.5px] font-black text-slate-400">Vertical Position (Y)</span>
                                      <span className="text-[9px] font-mono font-black text-rose-450">
                                        {activeOverlayConfig.customOverlayY !== undefined ? activeOverlayConfig.customOverlayY : 800}px
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        onClick={() => {
                                          const currentY = activeOverlayConfig.customOverlayY !== undefined ? activeOverlayConfig.customOverlayY : 800;
                                          const updated = { ...activeOverlayConfig, customOverlayY: Math.max(0, currentY - 10) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >-</button>
                                      <input 
                                        type="range"
                                        min="0"
                                        max="1080"
                                        step="5"
                                        value={activeOverlayConfig.customOverlayY !== undefined ? activeOverlayConfig.customOverlayY : 800}
                                        onChange={(e) => {
                                          const updated = { ...activeOverlayConfig, customOverlayY: parseInt(e.target.value) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="flex-1 accent-rose-500 h-1 cursor-pointer"
                                      />
                                      <button 
                                        onClick={() => {
                                          const currentY = activeOverlayConfig.customOverlayY !== undefined ? activeOverlayConfig.customOverlayY : 800;
                                          const updated = { ...activeOverlayConfig, customOverlayY: Math.min(1080, currentY + 10) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >+</button>
                                    </div>
                                  </div>
                                </div>

                                {/* Scale, Opacity sliders */}
                                <div className="space-y-3 bg-slate-950 p-3 rounded-xl border border-white/5">
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[8.5px] font-black text-slate-400">Scale Factor</span>
                                      <span className="text-[9px] font-mono font-black text-rose-450">
                                        {(activeOverlayConfig.customOverlayScale !== undefined ? activeOverlayConfig.customOverlayScale : 1.0).toFixed(2)}x
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        onClick={() => {
                                          const currentScale = activeOverlayConfig.customOverlayScale !== undefined ? activeOverlayConfig.customOverlayScale : 1.0;
                                          const updated = { ...activeOverlayConfig, customOverlayScale: Math.max(0.1, Number((currentScale - 0.05).toFixed(2))) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >-</button>
                                      <input 
                                        type="range"
                                        min="0.1"
                                        max="3"
                                        step="0.05"
                                        value={activeOverlayConfig.customOverlayScale !== undefined ? activeOverlayConfig.customOverlayScale : 1.0}
                                        onChange={(e) => {
                                          const updated = { ...activeOverlayConfig, customOverlayScale: parseFloat(e.target.value) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="flex-1 accent-rose-500 h-1 cursor-pointer"
                                      />
                                      <button 
                                        onClick={() => {
                                          const currentScale = activeOverlayConfig.customOverlayScale !== undefined ? activeOverlayConfig.customOverlayScale : 1.0;
                                          const updated = { ...activeOverlayConfig, customOverlayScale: Math.min(3, Number((currentScale + 0.05).toFixed(2))) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >+</button>
                                    </div>
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-[8.5px] font-black text-slate-400">Opacity transparency</span>
                                      <span className="text-[9px] font-mono font-black text-rose-450">
                                        {Math.round((activeOverlayConfig.customOverlayOpacity !== undefined ? activeOverlayConfig.customOverlayOpacity : 1.0) * 100)}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <button 
                                        onClick={() => {
                                          const currentOpacity = activeOverlayConfig.customOverlayOpacity !== undefined ? activeOverlayConfig.customOverlayOpacity : 1.0;
                                          const updated = { ...activeOverlayConfig, customOverlayOpacity: Math.max(0.1, Number((currentOpacity - 0.05).toFixed(2))) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >-</button>
                                      <input 
                                        type="range"
                                        min="0.1"
                                        max="1"
                                        step="0.05"
                                        value={activeOverlayConfig.customOverlayOpacity !== undefined ? activeOverlayConfig.customOverlayOpacity : 1.0}
                                        onChange={(e) => {
                                          const updated = { ...activeOverlayConfig, customOverlayOpacity: parseFloat(e.target.value) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="flex-1 accent-rose-500 h-1 cursor-pointer"
                                      />
                                      <button 
                                        onClick={() => {
                                          const currentOpacity = activeOverlayConfig.customOverlayOpacity !== undefined ? activeOverlayConfig.customOverlayOpacity : 1.0;
                                          const updated = { ...activeOverlayConfig, customOverlayOpacity: Math.min(1, Number((currentOpacity + 0.05).toFixed(2))) };
                                          syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                        }}
                                        className="w-6 h-6 rounded bg-slate-900 border border-white/5 flex items-center justify-center text-[10px] hover:bg-slate-800 text-white cursor-pointer"
                                      >+</button>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom overlay Layer Mode option */}
                                <div className="sm:col-span-2">
                                  <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Overlay Layer Stack Level</span>
                                  <div className="flex gap-2 text-[9px] font-black">
                                    {[
                                      { id: false, label: 'Render on top of all visual graphics (As active graphic Overlay)', desc: 'Image floats over the live score-bug' },
                                      { id: true, label: 'Render behind scoreboard layers (As reference alignment Backdrop)', desc: 'Image acts as trace backdrop behind the score-bug' }
                                    ].map(layer => {
                                      const isSelect = !!activeOverlayConfig.customOverlayAsBackground === layer.id;
                                      return (
                                        <button
                                          key={layer.id ? 'bg' : 'fg'}
                                          onClick={() => {
                                            const updated = { ...activeOverlayConfig, customOverlayAsBackground: layer.id };
                                            syncMatch(prev => ({ ...prev, overlayConfig: updated }));
                                          }}
                                          className={`flex-1 p-2 rounded-xl border text-center cursor-pointer flex flex-col justify-between items-center transition-all ${
                                            isSelect 
                                              ? 'bg-slate-900 border-white/10 text-rose-450 font-extrabold shadow-md' 
                                              : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-400'
                                          }`}
                                        >
                                          <span className="block uppercase text-[8px] tracking-tight">{layer.label}</span>
                                          <span className="block text-[7px] opacity-45 font-medium mt-0.5">{layer.desc}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                    })()}

                    {/* Integrated 16:9 Live Broadcast Overlay System integrated preview */}
                    <div className="pt-4 border-t border-white/5 space-y-3 font-sans">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-450 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                          </span>
                          <h5 className="text-xs uppercase font-black tracking-wider text-rose-450 flex items-center gap-1.5">
                            Real-Time TV Graphics System Preview
                          </h5>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 uppercase font-mono tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                          16:9 Transparent Overlay Emulator
                        </span>
                      </div>
                      <div className={`aspect-video w-full max-w-4xl mx-auto rounded-3xl bg-[#030712] overflow-hidden relative shadow-inner transition-all duration-500 border-4 ${
                        wicketTriggerAlert 
                          ? 'border-[rgba(239,68,68,1)] shadow-[0_0_60px_rgba(239,68,68,0.7)]' 
                          : activeOverlayConfig.boundaryBlast 
                            ? 'boundary-blast-effect border-transparent shadow-[0_0_50px_rgba(244,63,94,0.15)]' 
                            : 'border-white/10 shadow-[0_0_50px_rgba(244,63,94,0.15)]'
                      }`}>
                        <div className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.08]" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1540747737956-378724044453?auto=format&fit=crop&w=1200&q=80")' }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center justify-center pointer-events-none opacity-40">
                          <span className="text-slate-600 font-mono text-[10px] tracking-widest font-black uppercase font-mono">Live Video Source Playback Simulator</span>
                        </div>
                        <iframe
                          src={`${window.location.origin}${window.location.pathname}#/live/cricket-overlay?matchId=${match.id}&preview=true`}
                          title="Real-time Broadcast Overlay Live Feed"
                          className="absolute inset-0 w-full h-full border-none pointer-events-none select-none z-10"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      </div>
                    </div>
                  </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* Central Multi-column Grid in One Frame */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* COLUMN 1: LIVE SCOREBOARD STATS PANEL (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-1">SCOREBOARD</span>
                      <h3 className="text-xl font-black uppercase tracking-widest text-white">{currentInnings.battingTeam}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Defending: {currentInnings.bowlingTeam}</p>
                    </div>

                    {/* Big score text block */}
                    <motion.div 
                      key={`pulse-${currentInnings.runs}-${currentInnings.wickets}`}
                      className="flex items-baseline gap-3 pt-2 px-3.5 py-1.5 rounded-2xl border border-transparent cricket-scoreboard-container relative overflow-hidden"
                      animate={{
                        backgroundColor: ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 0.12)", "rgba(16, 185, 129, 0)"],
                        borderColor: ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 0.5)", "rgba(16, 185, 129, 0)"]
                      }}
                      transition={{ duration: 0.65, ease: "easeInOut" }}
                    >
                      <div className="text-6xl font-black text-white font-mono tracking-tighter leading-none flex items-center">
                        <motion.span
                          key={`runs-cockpit-${currentInnings.runs}`}
                          initial={{ scale: 0.75, opacity: 0.5, y: -6 }}
                          animate={{ scale: [1.3, 1], opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 450, damping: 10 }}
                          className="inline-block"
                        >
                          {currentInnings.runs}
                        </motion.span>
                        <span className="mx-1 text-slate-500/80 font-normal select-none">-</span>
                        <motion.span
                          key={`wickets-cockpit-${currentInnings.wickets}`}
                          initial={{ scale: 0.75, opacity: 0.5, y: 6 }}
                          animate={{ scale: [1.35, 1], opacity: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 8 }}
                          className="inline-block text-rose-500"
                        >
                          {currentInnings.wickets}
                        </motion.span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black font-mono text-emerald-400">
                          {formatOvers(currentInnings.ballsBowled)} overs
                        </span>
                        <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest mt-0.5">
                          Innings Progress
                        </span>
                      </div>
                    </motion.div>

                    {/* Meta match info */}
                    {match.currentInningsNum === 2 && match.targetRuns && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl space-y-1">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                          Target: {match.targetRuns} Runs
                        </p>
                        <p className="text-[9px] font-bold text-slate-350 uppercase">
                          Needs {Math.max(0, match.targetRuns - currentInnings.runs)} runs off {(match.oversLimit * 6) - currentInnings.ballsBowled} balls remaining
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Over, Target & Last result card indicators */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    {/* Last Ball & Free Hit */}
                    <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Last Ball:</span>
                        <span className={`px-2.5 py-0.5 bg-slate-950 font-mono font-black text-xs rounded border border-white/10 ${
                          match.lastBallResult === 'W' ? 'text-rose-500 border-rose-500/20' :
                          ['4', '6'].includes(match.lastBallResult || '') ? 'text-amber-400 border-amber-500/20 animate-pulse' : 'text-emerald-400'
                        }`}>
                          {match.lastBallResult || '-'}
                        </span>
                      </div>

                      {match.freeHitNext && (
                        <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[8px] font-black uppercase tracking-widest rounded animate-pulse shadow">
                          FREE HIT
                        </span>
                      )}
                    </div>

                    {/* CRR Indicator */}
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                      <span>CRR: <strong className="text-yellow-400 font-mono">{calculateRunRate(currentInnings.runs, currentInnings.ballsBowled)}</strong></span>
                      {match.currentInningsNum === 2 && match.targetRuns && (
                        <span>RRR: <strong className="text-yellow-400 font-mono">
                          {(() => {
                            const ballsLeft = (match.oversLimit * 6) - currentInnings.ballsBowled;
                            const runsToGet = match.targetRuns - currentInnings.runs;
                            if (ballsLeft <= 0) return '∞';
                            return ((runsToGet / ballsLeft) * 6).toFixed(2);
                          })()}
                        </strong></span>
                      )}
                    </div>

                    {/* AI Commentary real-time log badge stream */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1.5 relative overflow-hidden min-h-[50px] max-h-[85px]">
                      <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                        <Radio size={10} className="animate-pulse" /> Live Feed Broadcast
                      </span>
                      {isAiCommentaryLoading ? (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="inline-block w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          AI Scorer is crafting commentary...
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300 italic truncate font-bold leading-relaxed scroll-smooth">
                          {currentInnings.commentaryList[0]?.description || "Scorer cockpit fully calibrated. Ready for next ball delivery."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: ACTIVE CREASE DUO & BOWLER PANEL (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3 pb-1 border-b border-white/5">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Crease batsmen Duo</span>
                      <button 
                        onClick={handleSwapStrikers}
                        disabled={isSpectator}
                        title="Manual end change"
                        className="p-1 px-2.5 bg-slate-800 disabled:opacity-40 border-none rounded text-[8px] font-black text-slate-300 hover:text-emerald-400 uppercase tracking-widest cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                      >
                        <ArrowLeftRight size={10} /> Swap ends
                      </button>
                    </div>

                    {/* Crease batsmen profiles */}
                    <div className="space-y-3">
                      
                      {/* Striker Bat Card */}
                      {(() => {
                        const st = currentInnings.batsmen[currentInnings.strikerIndex];
                        if (!st) return null;
                        return (
                          <div className="bg-emerald-500/5 border-2 border-emerald-500/25 rounded-xl p-3 relative">
                            <span className="absolute top-1.5 right-2 text-[8px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                              Striker 
                            </span>
                            
                            {editStrikerIndex === null ? (
                              <div className="flex justify-between items-center">
                                <div className="truncate mr-10">
                                  <h5 className="font-extrabold text-sm text-white flex items-center gap-1.5 truncate">
                                    {st.name}
                                    {!isSpectator && (
                                      <button onClick={() => setEditStrikerIndex(currentInnings.strikerIndex)} className="text-slate-500 hover:text-emerald-400 p-0 bg-transparent border-none cursor-pointer">
                                        <Edit size={10} />
                                      </button>
                                    )}
                                  </h5>
                                  <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase font-mono">
                                    SR: {st.balls === 0 ? '0.0' : ((st.runs / st.balls) * 100).toFixed(0)} %
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-black font-mono text-white">
                                    {st.runs}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-400 ml-1">
                                    ({st.balls}b)
                                  </span>
                                  <p className="text-[7.5px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                                    {st.fours}x4s • {st.sixes}x6s
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  defaultValue={st.name}
                                  id="striker-name-input"
                                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white font-bold outline-none flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const val = (document.getElementById('striker-name-input') as HTMLInputElement)?.value;
                                    handleUpdateBatsmanName(currentInnings.strikerIndex, val);
                                  }}
                                  className="bg-emerald-500 text-white rounded px-2 py-1 border-none cursor-pointer text-xs font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Non Striker Bat Card */}
                      {(() => {
                        const nst = currentInnings.batsmen[currentInnings.nonStrikerIndex];
                        if (!nst) return null;
                        return (
                          <div className="bg-slate-900/40 border border-white/5 rounded-xl p-3">
                            {editNonStrikerIndex === null ? (
                              <div className="flex justify-between items-center">
                                <div className="truncate mr-10">
                                  <h5 className="font-extrabold text-sm text-slate-300 flex items-center gap-1.5 truncate">
                                    {nst.name}
                                    {!isSpectator && (
                                      <button onClick={() => setEditNonStrikerIndex(currentInnings.nonStrikerIndex)} className="text-slate-500 hover:text-emerald-400 p-0 bg-transparent border-none cursor-pointer">
                                        <Edit size={10} />
                                      </button>
                                    )}
                                  </h5>
                                  <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase font-mono">
                                    SR: {nst.balls === 0 ? '0.0' : ((nst.runs / nst.balls) * 100).toFixed(0)} %
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black font-mono text-slate-300">
                                    {nst.runs}
                                  </span>
                                  <span className="text-xs font-mono font-bold text-slate-505 ml-1">
                                    ({nst.balls}b)
                                  </span>
                                  <p className="text-[7.5px] text-slate-450 mt-0.5 font-bold uppercase tracking-wider">
                                    {nst.fours}x4s • {nst.sixes}x6s
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  defaultValue={nst.name}
                                  id="nonstriker-name-input"
                                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white font-bold outline-none flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const val = (document.getElementById('nonstriker-name-input') as HTMLInputElement)?.value;
                                    handleUpdateBatsmanName(currentInnings.nonStrikerIndex, val);
                                  }}
                                  className="bg-emerald-500 text-white rounded px-2 py-1 border-none cursor-pointer text-xs font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Active bowler card */}
                  {(() => {
                    const bw = currentInnings.bowlers[currentInnings.currentBowlerIndex];
                    if (!bw) return null;
                    return (
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block leading-none font-bold">CURRENT BOWLER</span>
                        <div className="bg-slate-900 p-3 rounded-xl border border-white/5 relative">
                          
                          {editBowlerIndex === null ? (
                            <div className="w-full flex justify-between items-center">
                              <div>
                                <strong className="text-sm font-extrabold text-white flex items-center gap-1.5 truncate">
                                  {bw.name}
                                  {!isSpectator && (
                                    <button onClick={() => setEditBowlerIndex(currentInnings.currentBowlerIndex)} className="text-slate-505 hover:text-emerald-400 p-0 bg-transparent border-none cursor-pointer">
                                      <Edit size={10} />
                                    </button>
                                  )}
                                </strong>
                                <p className="text-[8px] text-slate-405 mt-0.5 uppercase font-bold tracking-wider font-mono">
                                  economy: {bw.ballsBowled === 0 ? '0.00' : ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2)} RPO
                                </p>
                              </div>
                              <div className="text-right font-mono">
                                <div className="text-sm font-black text-white leading-none">
                                  <span className="text-emerald-405 font-extrabold">{bw.wickets} wkt</span>
                                  <span className="text-slate-500 font-bold mx-1">/</span>
                                  <span>{bw.runsConceded} runs</span>
                                </div>
                                <p className="text-[8px] text-slate-405 uppercase font-black tracking-widest mt-1">
                                  ({formatOvers(bw.ballsBowled)} overs)
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <input
                                  type="text"
                                  defaultValue={bw.name}
                                  id="bowler-name-input"
                                  className="bg-slate-900 border border-white/10 rounded px-2.5 py-1 text-xs text-white font-bold outline-none flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const val = (document.getElementById('bowler-name-input') as HTMLInputElement)?.value;
                                    handleUpdateBowlerName(currentInnings.currentBowlerIndex, val);
                                  }}
                                  className="bg-emerald-500 text-white rounded px-2 py-1 border-none cursor-pointer text-xs font-bold"
                                >
                                  Save
                                </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* COLUMN 3: SCORING CONTROL PANEL OR SPECTATOR WATCH (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-4">
                  {isSpectator ? (
                    <div className="h-full flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                          <Radio size={12} className="animate-ping" /> Connection Active
                        </span>
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight font-sans">Live Spectator Room</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans font-medium">
                          This screen auto-updates in real time as the primary match scorer notes ball-by-ball actions. Enjoy the play-by-play live feed!
                        </p>
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/15 rounded-xl text-center space-y-1">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block font-sans font-bold">Active Target Defended</span>
                        <strong className="text-lg text-white font-mono uppercase tracking-tight">
                          {match.winner ? "Match Concluded" : "In Progress"}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isOverCompletedNeedsBowler ? (
                        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl space-y-3 shadow-xl animate-fadeIn">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                              <h5 className="font-sans font-black text-emerald-400 text-[10px] uppercase tracking-widest leading-none">Over Complete</h5>
                              <strong className="text-sm font-sans font-extrabold text-white mt-block">Select New Bowler</strong>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                            The previous over finished. Choose a different bowler to begin Over {Math.floor((currentInnings?.ballsBowled || 0) / 6) + 1}.
                          </p>

                          {/* Bowler select dropdown */}
                          <div className="space-y-1 text-left">
                            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider font-sans">Choose from Existing</label>
                            <select 
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                if (val >= 0) {
                                  handleSelectNewBowlerForOver(val);
                                }
                              }}
                              defaultValue=""
                              className="w-full bg-slate-950 border border-white/10 rounded-lg py-2 px-3 text-xs text-white font-bold outline-none"
                            >
                              <option value="" disabled>-- Select Bowler --</option>
                              {currentInnings?.bowlers.map((b, idx) => {
                                const isPrevBowler = idx === currentInnings.currentBowlerIndex;
                                return (
                                  <option key={idx} value={idx} disabled={isPrevBowler}>
                                    {b.name} {isPrevBowler ? '(consecutive over limit)' : `(${formatOvers(b.ballsBowled)} ov)`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>

                          {/* Quick selection buttons squad */}
                          <div className="space-y-1 text-left">
                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Quick select</span>
                            <div className="flex flex-wrap gap-1 leading-none">
                              {currentInnings?.bowlers.map((b, idx) => {
                                const isPrevBowler = idx === currentInnings.currentBowlerIndex;
                                if (isPrevBowler) return null;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleSelectNewBowlerForOver(idx)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-emerald-555 text-slate-200 rounded text-[9px] font-extrabold uppercase cursor-pointer border-none transition-all"
                                  >
                                    {b.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-800"></div>
                            <span className="flex-shrink mx-2 text-[8px] text-slate-505 uppercase tracking-widest font-black">or introduce</span>
                            <div className="flex-grow border-t border-slate-800"></div>
                          </div>

                          {/* Add bowler block */}
                          <div className="flex gap-1.5 text-left">
                            <input
                              type="text"
                              placeholder="New Bowler..."
                              id="column3-new-bowler-input"
                              className="bg-slate-950 border border-white/5 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none flex-1 leading-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = (e.currentTarget as HTMLInputElement).value;
                                  if (val.trim()) {
                                    handleAddNewBowlerAndProgress(val.trim());
                                    e.currentTarget.value = '';
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById('column3-new-bowler-input') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  handleAddNewBowlerAndProgress(input.value.trim());
                                  input.value = '';
                                }
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 rounded-lg px-3 text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all leading-none flex items-center"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Control buttons block */}
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 leading-none font-bold">TAP BALL RUNS</span>
                            <div className="grid grid-cols-6 gap-1.5 font-black">
                              {[0, 1, 2, 3, 4, 6].map((runs) => (
                                <button
                                  key={runs}
                                  onClick={() => {
                                    if (runs === 6) setActiveAnimation('six');
                                    else if (runs === 4) setActiveAnimation('four');

                                    if (runs === 0) handleScoreEvent({ type: 'dot' });
                                    else handleScoreEvent({ type: 'runs', val: runs });
                                  }}
                                  className={`py-3 text-sm font-black rounded-xl transition-all cursor-pointer border-none transform active:scale-95 shadow ${
                                    runs === 4 ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black animate-pulse' :
                                    runs === 6 ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black' :
                                    'bg-slate-800 hover:bg-slate-700 text-white hover:text-emerald-400'
                                  }`}
                                >
                                  {runs === 0 ? 'DOT' : runs}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Extras quick selections (W, NB, Byes, LegByes) */}
                      <div className="grid grid-cols-2 gap-2 font-bold">
                        <button
                          onClick={() => handleScoreEvent({ type: 'wide', val: 0 })}
                          className="py-2 bg-slate-800 hover:bg-slate-750 text-white hover:text-emerald-400 text-[10px] font-extrabold rounded-xl uppercase transition-all cursor-pointer border-none flex justify-between px-3 items-center"
                        >
                          <span>Wide only</span>
                          <span className="text-emerald-400">+1</span>
                        </button>

                        <button
                          onClick={() => handleScoreEvent({ type: 'noball', val: 0 })}
                          className="py-2 bg-slate-800 hover:bg-slate-750 text-white hover:text-emerald-400 text-[10px] font-extrabold rounded-xl uppercase transition-all cursor-pointer border-none flex justify-between px-3 items-center"
                        >
                          <span>No ball</span>
                          <span className="text-amber-400">+1</span>
                        </button>
                      </div>

                      {/* Byes / Leg-byes quick controls */}
                      <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-white/5 p-2 rounded-xl font-bold">
                        <div>
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Byes</span>
                          <div className="flex gap-1 animate-none">
                            {[1, 2, 4].map(r => (
                              <button
                                key={r}
                                onClick={() => handleScoreEvent({ type: 'bye', val: r })}
                                className="flex-1 py-1 bg-slate-800 hover:bg-slate-705 text-white text-[9px] font-extrabold border-none rounded cursor-pointer"
                              >
                                B{r}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Leg-byes</span>
                          <div className="flex gap-1 animate-none">
                            {[1, 2, 4].map(r => (
                              <button
                                key={r}
                                onClick={() => handleScoreEvent({ type: 'legbye', val: r })}
                                className="flex-1 py-1 bg-slate-800 hover:bg-slate-705 text-white text-[9px] font-extrabold border-none rounded cursor-pointer"
                              >
                                L{r}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* OUT / Wicket Button trigger */}
                      <button
                        onClick={() => {
                          setActiveAnimation('wicket');
                          setOutBatsmanWho('striker');
                          if (currentInnings) {
                            const activeBowlerName = currentInnings.bowlers[currentInnings.currentBowlerIndex]?.name || '';
                            setWicketBowlerName(activeBowlerName);
                            setWicketHowOutDetails('Bowled');
                            setWicketType('Bowled');
                            setWicketFielderName('');
                            setWicketAdditionalDetails('');
                            setNewBatsmanName('');
                            setWicketValidationErr('');
                          }
                          setShowWicketModal(true);
                        }}
                        className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer border-none transition-transform hover:scale-[1.01] active:scale-95 shadow-md flex items-center justify-center gap-1"
                      >
                        🔴 Dismiss batsman (wicket)
                      </button>

                      {/* ADD PLAYER CREATION QUICK ROSTER OPERATIONS */}
                      <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-2.5 font-bold">
                        <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block leading-none font-sans">Scorer Quick Roster Tool</span>
                        
                        {/* Dynamic Batsman Roster Adder */}
                        <div className="flex gap-1.5 font-bold">
                          <input
                            type="text"
                            placeholder="Add new batsman to team..."
                            id="cockpit-new-batsman-input"
                            className="bg-slate-950 border border-white/5 rounded-lg px-2 text-[10px] text-white font-bold outline-none flex-1 min-w-0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                if (input.value.trim()) {
                                  handleAddNewBatsman(input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('cockpit-new-batsman-input') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                handleAddNewBatsman(input.value.trim());
                                input.value = '';
                              } else {
                                showNotification('Batsman name cannot be empty!', 'alert');
                              }
                            }}
                            className="bg-slate-800 hover:bg-emerald-600 text-white hover:text-slate-950 border-none rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            + Bat
                          </button>
                        </div>

                        {/* Dynamic Bowler Roster Adder */}
                        <div className="flex gap-1.5 font-bold">
                          <input
                            type="text"
                            placeholder="Add bowler & start spell..."
                            id="cockpit-new-bowler-input"
                            className="bg-slate-955 border border-white/5 rounded-lg px-2 text-[10px] text-white font-bold outline-none flex-1 min-w-0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                if (input.value.trim()) {
                                  handleAddNewBowler(input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('cockpit-new-bowler-input') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                handleAddNewBowler(input.value.trim());
                                input.value = '';
                              } else {
                                showNotification('Bowler name cannot be empty!', 'alert');
                              }
                            }}
                            className="bg-slate-800 hover:bg-emerald-600 text-white hover:text-slate-950 border-none rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            + Bowl
                          </button>
                        </div>

                        {/* Dynamic News Bulletin Adder */}
                        <div className="flex gap-1.5 font-bold pt-1.5 border-t border-white/5">
                          <input
                            type="text"
                            placeholder="Publish breaking news bulletin..."
                            id="cockpit-new-news-input"
                            className="bg-slate-950 border border-white/5 rounded-lg px-2 text-[10px] text-white font-bold outline-none flex-1 min-w-0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const input = e.currentTarget;
                                if (input.value.trim()) {
                                  handlePublishNewsBulletin(input.value.trim());
                                  input.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById('cockpit-new-news-input') as HTMLInputElement;
                              if (input && input.value.trim()) {
                                handlePublishNewsBulletin(input.value.trim());
                                input.value = '';
                              } else {
                                showNotification('News bulletin text cannot be empty!', 'alert');
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 border-none rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                          >
                            + News
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ==================== 4. STATISTICS ROSTERS BATTING & BOWLING ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Batting Detailed register */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-md">
                <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-50 dark:border-slate-800">
                  <h3 className="text-[11px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={16} className="text-emerald-500" />
                    Batting Scorecard ({currentInnings.battingTeam})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-850/60 pb-3 text-slate-400 font-extrabold uppercase tracking-widest text-[8px]">
                        <th className="py-3">Batsman</th>
                        <th className="py-3 text-center font-mono">Runs</th>
                        <th className="py-3 text-center font-mono">Balls</th>
                        <th className="py-3 text-center font-mono">4s</th>
                        <th className="py-3 text-center font-mono">6s</th>
                        <th className="py-3 text-right font-mono">Strike Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                      {currentInnings.batsmen.map((b, idx) => (
                        <tr 
                          key={idx}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 ${
                            idx === currentInnings.strikerIndex ? 'text-emerald-600 dark:text-emerald-400' :
                            idx === currentInnings.nonStrikerIndex ? 'text-slate-800 dark:text-slate-200' : ''
                          }`}
                        >
                          <td className="py-3.5 pr-4">
                            <span className="flex items-center gap-1.5 font-extrabold">
                              {b.name}
                              {idx === currentInnings.strikerIndex && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />}
                              {match.status === 'completed' && playerOfTheMatch && playerOfTheMatch.name.toLowerCase() === b.name.toLowerCase() && (
                                <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded ml-2 flex items-center gap-0.5 animate-pulse">
                                  🌟 POTM
                                </span>
                              )}
                              {b.isOut && (
                                <span className="text-[8px] font-black uppercase text-rose-500 italic bg-rose-500/10 px-2 py-0.5 rounded ml-2">
                                  Out ({b.outMode})
                                </span>
                              )}
                            </span>
                            {b.dismissedBy && (
                              <p className="text-[8px] text-slate-400 mt-1 uppercase font-semibold">
                                dismiss by {b.dismissedBy}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 text-center font-mono font-black">{b.runs}</td>
                          <td className="py-3.5 text-center font-mono text-slate-400">{b.balls}</td>
                          <td className="py-3.5 text-center font-mono text-slate-400">{b.fours}</td>
                          <td className="py-3.5 text-center font-mono text-slate-400">{b.sixes}</td>
                          <td className="py-3.5 text-right font-mono text-slate-400">
                            {b.balls === 0 ? '0.00' : ((b.runs / b.balls) * 100).toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      <tr className="bg-slate-50/40 dark:bg-slate-800/10 text-xs font-black">
                        <td className="py-3 px-2">Total Extras</td>
                        <td colSpan={5} className="py-3 text-right pr-2 text-slate-550 font-mono text-[11px] dark:text-slate-400">
                          Total Ext: <strong className="text-amber-500">{currentInnings.extras.wides + currentInnings.extras.noBalls + currentInnings.extras.byes + currentInnings.extras.legByes}</strong> (Wd {currentInnings.extras.wides}, Nb {currentInnings.extras.noBalls}, B {currentInnings.extras.byes}, Lb {currentInnings.extras.legByes})
                        </td>
                      </tr>
                      {currentInnings.extras.penalty > 0 && (
                        <tr className="bg-slate-50/40 dark:bg-slate-800/10 text-xs font-black">
                          <td className="py-2 px-2">Penalty Runs</td>
                          <td colSpan={5} className="py-2 text-right pr-2 text-rose-500 font-mono text-[11px]">
                            +{currentInnings.extras.penalty} Runs
                          </td>
                        </tr>
                      )}
                      <tr className="bg-emerald-50/30 dark:bg-emerald-950/20 text-[13px] font-extrabold border-t-2 border-emerald-500 text-emerald-600 dark:text-emerald-400">
                        <td className="py-3 px-2 font-black tracking-wide uppercase">GRAND TOTAL</td>
                        <td colSpan={5} className="py-3 text-right pr-2 font-mono tracking-tight font-black">
                          <span className="text-[17px] font-black">{currentInnings.runs}</span>/{currentInnings.wickets} in {formatOvers(currentInnings.ballsBowled)} Overs
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>


              {/* Bowling roster register + choice selectors */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-50 dark:border-slate-800">
                    <h3 className="text-[11px] font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={16} className="text-emerald-500" />
                      Bowlers Scorecard ({currentInnings.bowlingTeam})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850/60 pb-3 text-slate-400 font-extrabold uppercase tracking-widest text-[8px]">
                          <th className="py-3">Bowler</th>
                          <th className="py-3 text-center font-mono">Overs</th>
                          <th className="py-3 text-center font-mono">Runs Conceded</th>
                          <th className="py-3 text-center font-mono">Wickets</th>
                          <th className="py-3 text-right font-mono">Econ Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold text-slate-750">
                        {currentInnings.bowlers.map((bw, idx) => (
                          <tr 
                            key={idx}
                            className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/10 ${
                              idx === currentInnings.currentBowlerIndex ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/[0.02]' : ''
                            }`}
                          >
                            <td className="py-3.5 pr-4">
                              <span className="flex items-center gap-1.5 font-extrabold">
                                {bw.name}
                                {match.status === 'completed' && playerOfTheMatch && playerOfTheMatch.name.toLowerCase() === bw.name.toLowerCase() && (
                                  <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded ml-2 flex items-center gap-0.5 animate-pulse">
                                    🌟 POTM
                                  </span>
                                )}
                                {idx === currentInnings.currentBowlerIndex && (
                                  <span className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-200/50 dark:bg-emerald-500/10 px-2 py-0.5 rounded">
                                    Bowling
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-3.5 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                              {formatOvers(bw.ballsBowled)}
                            </td>
                            <td className="py-3.5 text-center font-mono font-bold text-slate-650 dark:text-slate-300">
                              {bw.runsConceded}
                            </td>
                            <td className="py-3.5 text-center font-mono font-black text-rose-500">
                              {bw.wickets}
                            </td>
                            <td className="py-3.5 text-right font-mono text-slate-400">
                              {bw.ballsBowled === 0 ? '0.00' : ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bowler creation / Selection panel */}
                {match.status === 'live' && (
                  <div className="pt-4 border-t border-slate-105 dark:border-slate-800 mt-4 space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">CHANGE ACTIVE / INTRODUCE BOWLER</span>
                    
                    <div className="flex flex-wrap gap-2">
                      {currentInnings.bowlers.map((bw, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleChangeActiveBowler(idx)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                            idx === currentInnings.currentBowlerIndex 
                              ? 'bg-emerald-500 text-slate-950' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-650 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          Spell: {bw.name}
                        </button>
                      ))}
                    </div>

                    {/* Fast add custom new Bowler inline */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="New Bowler name..."
                        id="new-bowler-inline-input"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-205 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white font-bold outline-none flex-1"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('new-bowler-inline-input') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            handleAddNewBowler(input.value.trim());
                            input.value = '';
                          } else {
                            showNotification('Bowler name cannot be empty!', 'alert');
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white border-none rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer"
                      >
                        Add Bowler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>


            {/* ==================== 5. FALL OF WICKETS PROFILE ==================== */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-md">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-105 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Fall Of Wickets Profile
                </h4>
                <button 
                  onClick={handleResetMatch}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-105 text-rose-550 border-none rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all"
                >
                  Discard & Exit Scoreboard
                </button>
              </div>

              {currentInnings.fallOfWickets.length === 0 ? (
                <p className="text-center py-8 text-xs font-black uppercase tracking-widest text-slate-400">
                  No wickets fallen yet
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentInnings.fallOfWickets.map((fw, idx) => (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl space-y-1 text-xs font-bold border border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-rose-500 font-extrabold font-mono text-[10px]">Wkt # {fw.wicketNo}</span>
                      <p className="text-slate-800 dark:text-slate-200 text-sm font-black truncate">{fw.batsmanName}</p>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        at {fw.score} runs • {fw.oversList} ov
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* ==================== 5.5. MODAL DIALOG: ADDITIONAL RUNS FOR EXTRA BALLS ==================== */}
      <AnimatePresence>
        {showExtraRunsModal && currentInnings && extraRunsBallType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowExtraRunsModal(false)}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Content Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 max-w-sm w-full p-6 shadow-2xl relative z-20 overflow-hidden"
            >
              <div className="text-center mb-4">
                <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full font-black text-[9px] uppercase tracking-widest">
                  Match Event Trigger - {extraRunsBallType === 'wide' ? 'Wide' : 'No Ball'}
                </span>
                <h3 className="text-base font-black uppercase tracking-tight text-slate-800 dark:text-white mt-1.5">
                  Runs Off {extraRunsBallType === 'wide' ? 'Wide' : 'No Ball'}
                </h3>
                <p className="text-[10px] text-slate-450 mt-1 dark:text-slate-400">
                  Select extra runs <strong>run by the batsmen</strong> on this delivery.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      handleScoreEvent({ type: extraRunsBallType, val: 0 });
                      setShowExtraRunsModal(false);
                    }}
                    className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                  >
                    <span>0 Additional Runs</span>
                    <span className="text-[8px] font-medium opacity-60 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd Total' : '1 Nb Total'})</span>
                  </button>

                  <button
                    onClick={() => {
                      handleScoreEvent({ type: extraRunsBallType, val: 1 });
                      setShowExtraRunsModal(false);
                    }}
                    className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                  >
                    <span>1 Additional Run</span>
                    <span className="text-[8px] font-medium opacity-60 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 1 Run to Bat' : '1 Nb + 1 Run to Bat'})</span>
                  </button>

                  <button
                    onClick={() => {
                      handleScoreEvent({ type: extraRunsBallType, val: 2 });
                      setShowExtraRunsModal(false);
                    }}
                    className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                  >
                    <span>2 Additional Runs</span>
                    <span className="text-[8px] font-medium opacity-60 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 2 Runs to Bat' : '1 Nb + 2 Runs to Bat'})</span>
                  </button>

                  <button
                    onClick={() => {
                      handleScoreEvent({ type: extraRunsBallType, val: 3 });
                      setShowExtraRunsModal(false);
                    }}
                    className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center"
                  >
                    <span>3 Additional Runs</span>
                    <span className="text-[8px] font-medium opacity-60 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 3 Runs to Bat' : '1 Nb + 3 Runs to Bat'})</span>
                  </button>

                  <button
                    onClick={() => {
                      handleScoreEvent({ type: extraRunsBallType, val: 4 });
                      setShowExtraRunsModal(false);
                    }}
                    className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center col-span-2"
                  >
                    <span>4 Runs (Boundary)</span>
                    <span className="text-[8px] font-medium opacity-60 mt-0.5">({extraRunsBallType === 'wide' ? '1 Wd + 4 Runs to Bat' : '1 Nb + 4 Runs to Bat'})</span>
                  </button>
                  
                  {extraRunsBallType === 'noball' && (
                    <button
                      onClick={() => {
                        handleScoreEvent({ type: 'noball', val: 6 });
                        setShowExtraRunsModal(false);
                      }}
                      className="py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex flex-col items-center justify-center col-span-2"
                    >
                      <span>6 Runs (Maximum!)</span>
                      <span className="text-[8px] font-medium opacity-60 mt-0.5">(1 Nb + 6 Runs to Bat)</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowExtraRunsModal(false)}
                  className="w-full mt-2 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== 6. MODAL DIALOG: DISMISS WICKET DETAILS ==================== */}
      <AnimatePresence>
        {showWicketModal && currentInnings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWicketModal(false)}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Content box */}
            <motion.div
              id="wicket-dismissal-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 max-w-md w-full p-8 shadow-2xl relative z-20 overflow-hidden"
            >
              <div className="text-center mb-6">
                <span className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-full font-black text-[9px] uppercase tracking-widest">
                  Match Event Trigger - Out
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-2">
                  Dismissal Analysis Board
                </h3>
              </div>

              <div className="space-y-5">
                
                {/* Out batsman selector (striker vs non-striker) */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2 leading-none">Which Batsman got out?</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOutBatsmanWho('striker')}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border-none transition-all ${
                        outBatsmanWho === 'striker'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-650 dark:bg-slate-850 dark:text-slate-350 font-bold'
                      }`}
                    >
                      Striker ({currentInnings.batsmen[currentInnings.strikerIndex]?.name || 'N/A'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOutBatsmanWho('non-striker')}
                      className={`py-3.5 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border-none transition-all ${
                        outBatsmanWho === 'non-striker'
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-650 dark:bg-slate-850 dark:text-slate-350 font-bold'
                      }`}
                    >
                      Non-Striker ({currentInnings.batsmen[currentInnings.nonStrikerIndex]?.name || 'N/A'})
                    </button>
                  </div>
                </div>

                {/* Dismissal Category Choose list */}
                <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 leading-none">Dismissal Type</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Bowled', 'Caught', 'Run Out', 'Stumped', 'LBW'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setWicketType(mode);
                          setWicketHowOutDetails(mode);
                        }}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                          wicketType === mode
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Details Input */}
                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2 leading-none">How out (Custom Dismissal Details)</label>
                  <input
                    type="text"
                    value={wicketHowOutDetails}
                    onChange={(e) => setWicketHowOutDetails(e.target.value)}
                    placeholder="E.g. Caught at Deep Cover / Bowled / LBW"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
                  />
                </div>

                {/* Additional Details Input */}
                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2 leading-none">Additional Notes</label>
                  <input
                    type="text"
                    value={wicketAdditionalDetails}
                    onChange={(e) => {
                      setWicketAdditionalDetails(e.target.value);
                      if (e.target.value.trim() && wicketValidationErr) {
                        setWicketValidationErr('');
                      }
                    }}
                    placeholder="E.g. LBW on middle stump"
                    className="additional-notes w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
                  />
                  {wicketValidationErr && (
                    <p className="text-[10px] text-rose-500 font-extrabold mt-1.5 uppercase tracking-wide">
                      {wicketValidationErr}
                    </p>
                  )}
                </div>

                {/* Custom Bowler Input */}
                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2 leading-none">Bowler Name</label>
                  <input
                    type="text"
                    value={wicketBowlerName}
                    onChange={(e) => setWicketBowlerName(e.target.value)}
                    placeholder="Enter bowler name for wicket credit"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl p-3.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
                  />
                  {currentInnings && currentInnings.bowlers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase py-1 select-none">Quick Select:</span>
                      {currentInnings.bowlers.map((bw, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setWicketBowlerName(bw.name)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-650 dark:text-slate-300 hover:text-emerald-500 rounded-md text-[9px] uppercase font-black tracking-widest border-none cursor-pointer transition-all active:scale-95"
                        >
                          {bw.name} {idx === currentInnings.currentBowlerIndex ? '★' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fielding Record Fielder Input Selector */}
                {(wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') && (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-2xl space-y-2">
                    <label className="text-[9.5px] font-black text-slate-450 uppercase tracking-widest block leading-none">Fielder Name (Catches, Runouts, Stumpings)</label>
                    <input
                      type="text"
                      value={wicketFielderName}
                      onChange={(e) => setWicketFielderName(e.target.value)}
                      placeholder="Enter fielder's name (highly recommended)"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-slate-800 dark:text-white"
                    />
                    {(() => {
                      if (!currentInnings) return null;
                      const bowlingTeam = currentInnings.battingTeam === match.teamA ? match.teamB : match.teamA;
                      const bowlingRoster = bowlingTeam === match.teamA ? selectedTeamARoster : selectedTeamBRoster;
                      if (!bowlingRoster || bowlingRoster.length === 0) return null;
                      return (
                        <div className="flex flex-wrap gap-1 mt-1 items-center">
                          <span className="text-[8px] text-slate-400 font-extrabold uppercase py-1 select-none font-sans">Squad Fielding:</span>
                          {bowlingRoster.slice(0, 11).map((player, idx) => (
                            <button
                              key={`fielder-${player}-${idx}`}
                              type="button"
                              onClick={() => setWicketFielderName(player)}
                              className="px-2 py-0.5 bg-slate-200 hover:bg-emerald-500/15 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 rounded text-[8px] uppercase font-black tracking-widest border-none cursor-pointer transition-all"
                            >
                              {player}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Input Name field for incoming Batsman */}
                <div>
                  <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2 leading-none">Incoming Cricketer Name</label>
                  <input
                    type="text"
                    value={newBatsmanName}
                    onChange={(e) => setNewBatsmanName(e.target.value)}
                    placeholder={`Default: Batsman ${currentInnings.batsmen.length + 1}`}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-800 rounded-xl p-3.5 text-xs font-bold outline-none text-slate-800 dark:text-white"
                  />
                  {(() => {
                    if (!currentInnings) return null;
                    const teamRoster = currentInnings.battingTeam === match.teamA ? selectedTeamARoster : selectedTeamBRoster;
                    if (!teamRoster || teamRoster.length === 0) return null;

                    const alreadyBatted = currentInnings.batsmen.map(b => b.name.toLowerCase());
                    const remaining = teamRoster.filter(player => !alreadyBatted.includes(player.toLowerCase()));

                    if (remaining.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                        <span className="text-[9px] text-slate-400 font-extrabold uppercase py-1 select-none font-sans">Squad Roster:</span>
                        {remaining.slice(0, 8).map((player, idx) => {
                          const stats = playerStatsMap[player.toLowerCase().trim()];
                          const matchesPlayed = stats ? stats.matches : 0;
                          const avgScore = stats && stats.matches > 0 ? stats.avg : 0;
                          return (
                            <button
                              key={`${player}-${idx}`}
                              type="button"
                              onClick={() => setNewBatsmanName(player)}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/15 text-slate-650 dark:text-slate-300 hover:text-emerald-500 rounded-md text-[9px] uppercase font-black tracking-widest border-none cursor-pointer transition-all active:scale-95"
                              title={`${player} - Matches Played: ${matchesPlayed}, Average Score: ${matchesPlayed > 0 ? avgScore : 'N/A'}`}
                            >
                              + {player} ({matchesPlayed}m, Avg {matchesPlayed > 0 ? avgScore : '--'})
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    onClick={() => setShowWicketModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-450 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWicketScore}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer border-none shadow-md"
                  >
                    Confirm Out
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* ==================== 7. MODAL DIALOG: TEAM MANAGEMENT ==================== */}
        {showTeamModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamModal(false)}
              className="absolute inset-0 bg-slate-950"
            />

            {/* Content Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-150 dark:border-slate-800 max-w-lg w-full p-8 shadow-2xl relative z-20 max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center mb-6">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-605 rounded-full font-black text-[9px] uppercase tracking-widest">
                  Preset Configuration Board
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-2">
                  Team Management
                </h3>
              </div>

              <div className="space-y-6">
                {/* Save Team Form */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {editingTeamId ? 'Edit Preset Roster' : 'Add New Preset'}
                    </h4>
                    {editingTeamId && (
                      <button
                        onClick={() => {
                          setEditingTeamId(null);
                          setNewTeamName('');
                          setNewTeamPlayersText('');
                        }}
                        className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-600 bg-transparent border-none cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Team Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Gully Gladiators"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Players (One per line)</label>
                    <textarea
                      placeholder="Virat&#10;Sachin&#10;Dhoni&#10;Boomrah"
                      value={newTeamPlayersText}
                      onChange={(e) => setNewTeamPlayersText(e.target.value)}
                      rows={4}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none font-mono"
                    />
                  </div>

                  {/* Approved players quick insert list for scoreboard presets */}
                  {approvedPlayers.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Approved Players Quick Picker</span>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 py-1">
                        {approvedPlayers.map(p => {
                          const currentNames = newTeamPlayersText.split('\n').map(x => x.trim().toLowerCase());
                          const isSelected = currentNames.includes(p.fullName.trim().toLowerCase());
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                const trimName = p.fullName.trim();
                                if (isSelected) {
                                  // Remove player
                                  const lines = newTeamPlayersText.split('\n').filter(x => x.trim().toLowerCase() !== trimName.toLowerCase());
                                  setNewTeamPlayersText(lines.join('\n'));
                                } else {
                                  // Add player
                                  const list = newTeamPlayersText.split('\n').map(x => x.trim()).filter(x => x.length > 0);
                                  list.push(trimName);
                                  setNewTeamPlayersText(list.join('\n'));
                                }
                              }}
                              className={`px-2 py-1 text-[8px] font-extrabold uppercase rounded-lg border-none cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-emerald-500 text-white shadow-sm' 
                                  : 'bg-white hover:bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-350 hover:text-emerald-500 border border-slate-150 dark:border-slate-700'
                              }`}
                            >
                              {isSelected ? `✓ ${p.fullName}` : `+ ${p.fullName}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSaveTeam}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer transition-all"
                  >
                    {editingTeamId ? 'Update Preset' : 'Save Team Preset'}
                  </button>
                </div>

                {/* List of Saved Teams */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-705 dark:text-slate-300">Preserved Presets ({savedTeams.length})</h4>
                  {savedTeams.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">No pre-saved team presets yet. Build one above!</p>
                  ) : (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {savedTeams.map((t) => (
                        <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-105 dark:border-slate-800 flex justify-between items-center text-xs">
                          <div className="flex-1 mr-4 overflow-hidden">
                            <strong className="font-extrabold text-slate-850 dark:text-white block truncate">{t.name}</strong>
                            <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold truncate mt-0.5">
                              {t.players.join(', ')}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setEditingTeamId(t.id);
                                setNewTeamName(t.name);
                                setNewTeamPlayersText(t.players.join('\n'));
                              }}
                              className="px-2.5 py-1 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border-none rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                            >
                              Edit
                            </button>
                            {teamDeleteConfirmId === t.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    handleDeleteTeam(t.id, t.name);
                                    setTeamDeleteConfirmId(null);
                                  }}
                                  className="px-2.5 py-1 text-white bg-rose-500 hover:bg-rose-600 border-none rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setTeamDeleteConfirmId(null)}
                                  className="px-2 py-1 text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setTeamDeleteConfirmId(t.id)}
                                className="px-2.5 py-1 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border-none rounded-md text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer border-none"
                  >
                    Close presets panel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfettiCanvas active={match.status === 'completed'} />

      {/* FOOTER BAR: Share Live, Export PDF, Past Matches, Volume Icon, Theme toggle */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-12 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div>
            <p className="uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500">
              GullyScore Scoreboard • Live Cricket Suite
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {match.innings1 && (
              <button
                onClick={handleExportMatchPDF}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
              >
                <FileDown size={11} />
                Export PDF
              </button>
            )}

            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm"
            >
              <Clock size={11} />
              {showHistory ? 'Close Logs' : 'Past Matches'}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setSoundEnabled(prev => !prev);
                  if (soundEnabled) {
                    setShowAudioSettingsDropdown(false);
                  }
                }}
                className={`p-2 rounded-lg transition-all cursor-pointer border-none text-white ${soundEnabled ? 'bg-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-505 opacity-60'}`}
                title="Mute/Unmute audio"
              >
                {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioSettingsDropdown(!showAudioSettingsDropdown);
                }}
                className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-slate-900 dark:bg-slate-950 text-white border border-white/20 flex items-center justify-center text-[8.5px] cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-md font-sans"
                title="Customize specific sound toggles"
              >
                ⚙️
              </button>

              {showAudioSettingsDropdown && (
                <div className="absolute bottom-11 right-0 w-56 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xl z-[220] text-xs text-slate-805 dark:text-slate-200 space-y-2.5 font-bold font-sans">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="font-extrabold uppercase text-[9px] tracking-widest text-[#10b981]">
                      Audio Settings
                    </span>
                    <button 
                      onClick={() => setShowAudioSettingsDropdown(false)}
                      className="text-slate-405 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-[10px] bg-transparent border-none"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer py-0.5">
                      <span>Mute Master Speaker</span>
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-200 dark:border-slate-800 text-emerald-650 cursor-pointer h-3.5 w-3.5 focus:ring-0"
                        checked={!soundEnabled}
                        onChange={(e) => setSoundEnabled(!e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer py-0.5 opacity-90 disabled:opacity-45">
                      <span className={!soundEnabled ? "opacity-50" : ""}>Wicket Clappers</span>
                      <input 
                        type="checkbox" 
                        disabled={!soundEnabled}
                        className="rounded border-slate-200 dark:border-slate-800 text-emerald-650 cursor-pointer h-3.5 w-3.5 focus:ring-0 disabled:opacity-50"
                        checked={soundWicketEnabled}
                        onChange={(e) => setSoundWicketEnabled(e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer py-0.5 opacity-90">
                      <span className={!soundEnabled ? "opacity-50" : ""}>Boundary Cheers</span>
                      <input 
                        type="checkbox" 
                        disabled={!soundEnabled}
                        className="rounded border-slate-200 dark:border-slate-800 text-emerald-650 cursor-pointer h-3.5 w-3.5 focus:ring-0 disabled:opacity-50"
                        checked={soundBoundaryEnabled}
                        onChange={(e) => setSoundBoundaryEnabled(e.target.checked)}
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer py-0.5 opacity-90">
                      <span className={!soundEnabled ? "opacity-50" : ""}>UI click notes</span>
                      <input 
                        type="checkbox" 
                        disabled={!soundEnabled}
                        className="rounded border-slate-200 dark:border-slate-800 text-emerald-650 cursor-pointer h-3.5 w-3.5 focus:ring-0 disabled:opacity-50"
                        checked={soundClickEnabled}
                        onChange={(e) => setSoundClickEnabled(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer border-none"
              title="Toggle theme mode"
            >
              {darkMode ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </footer>

      {/* ==================== CONGRATULATORY MATCH COMPLETION & POTM MODAL ==================== */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompletionModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            {/* Content Container */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 50 }}
              className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-amber-500 rounded-[2rem] sm:rounded-[2.5rem] max-w-lg w-full p-5 sm:p-8 shadow-2xl relative z-10 text-white overflow-y-auto max-h-[90vh] scrollbar-thin scrollbar-thumb-slate-800 text-center"
            >
              {/* Close button icon bar */}
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 sm:p-2.5 rounded-full transition-all cursor-pointer z-50 border border-white/5"
                title="Close"
              >
                <X size={16} />
              </button>

              {/* Confetti Accent Decoration */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              <div className="relative pt-4 space-y-5 sm:space-y-6">
                <div className="inline-block p-4.5 bg-amber-500/10 rounded-full border border-amber-500/30 animate-pulse">
                  <Trophy className="text-yellow-400" size={44} />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#fbbf24]">
                    🎉 Match Concluded! 🎉
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-none">
                    {match.winner === 'Tie' ? 'MATCH TIE!' : `${match.winner} VICTORIOUS`}
                  </h2>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                    {match.winReason}
                  </p>
                </div>

                {/* Match Summary Stats Dashboard section */}
                <div className="bg-slate-900/90 border border-[#fbbf24]/20 rounded-3xl p-5 text-left space-y-3 shadow-inner">
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 block border-b border-slate-800 pb-1.5">📊 Match Summary Highlights</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <span className="text-slate-400 text-[8px] uppercase tracking-widest block font-bold mb-1">Win Margin</span>
                      <strong className="text-sm text-yellow-450 font-black tracking-tight leading-normal">
                        {match.winner === 'Tie' ? 'None (Tie)' : match.winReason || 'N/A'}
                      </strong>
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <span className="text-slate-400 text-[8px] uppercase tracking-widest block font-bold mb-1">Top Batsman</span>
                      {topBatsmanOfTheMatch ? (
                        <div>
                          <strong className="text-xs text-emerald-400 font-extrabold block truncate">{topBatsmanOfTheMatch.name}</strong>
                          <span className="text-[10px] text-slate-450 font-mono font-black">{topBatsmanOfTheMatch.runs} runs <span className="text-[8px] font-normal text-slate-500 font-sans">({topBatsmanOfTheMatch.balls}b)</span></span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">N/A</span>
                      )}
                    </div>
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <span className="text-slate-400 text-[8px] uppercase tracking-widest block font-bold mb-1">Best Economy</span>
                      {mostEconomicalBowlerOfTheMatch ? (
                        <div>
                          <strong className="text-xs text-cyan-400 font-extrabold block truncate">{mostEconomicalBowlerOfTheMatch.name}</strong>
                          <span className="text-[10px] text-slate-450 font-mono font-black">{mostEconomicalBowlerOfTheMatch.econ} econ <span className="text-[8px] font-normal text-slate-500 font-sans">({mostEconomicalBowlerOfTheMatch.wickets}w)</span></span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {playerOfTheMatch && (
                  <div className="bg-gradient-to-b from-slate-850 to-slate-900/40 p-6 rounded-3xl border border-white/5 space-y-4 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1 bg-amber-500 text-slate-950 font-mono text-[8px] font-black uppercase tracking-widest rounded-bl-xl shadow-md">
                      M.V.P
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9.5px] uppercase font-bold tracking-widest text-amber-250 block">
                        🌟 Player of the Match 🌟
                      </span>
                      <strong className="text-xl sm:text-2xl font-black text-white tracking-tight block">
                        {playerOfTheMatch.name}
                      </strong>
                    </div>

                    {/* Stats Highlights */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold">
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                        <span className="text-slate-400 text-[9px] uppercase tracking-widest block mb-1">Batting</span>
                        <strong className="text-base text-white font-mono block">
                          {playerOfTheMatch.runs} <span className="text-xs text-slate-400 font-normal font-sans">runs</span>
                        </strong>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                          {playerOfTheMatch.balls} balls ({playerOfTheMatch.fours}x4, {playerOfTheMatch.sixes}x6)
                        </span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                        <span className="text-slate-400 text-[9px] uppercase tracking-widest block mb-1">Bowling</span>
                        <strong className="text-base text-amber-305 font-mono block">
                          {playerOfTheMatch.wickets} <span className="text-xs text-slate-400 font-normal font-sans">wkts</span>
                        </strong>
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                          {playerOfTheMatch.runsConceded} runs ({playerOfTheMatch.maidens} maidens)
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="inline-block px-4 py-1.5 bg-amber-500/20 text-[#fbbf24] hover:bg-amber-500/25 transition-all text-[9.5px] font-black uppercase tracking-widest rounded-full border border-amber-500/30">
                        Rating Points: {playerOfTheMatch.points} pts
                      </div>
                    </div>
                  </div>
                )}

                {/* Automatically Generated Key Moments & Narrative Summary */}
                <div className="bg-slate-900 border border-[#fbbf24]/20 rounded-3xl p-5 text-left space-y-3.5 shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#fbbf24] block flex items-center gap-1.5">
                      <Sparkles size={13} className="text-[#fbbf24] animate-pulse" />
                      📝 Auto Match Narrative & Key Incidents
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(generateNarrativeSummary(match));
                        setSummaryCopied(true);
                        setTimeout(() => setSummaryCopied(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-[#fbbf24]/10 hover:bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/25 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{summaryCopied ? 'Copied!' : 'Copy Summary'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed font-mono space-y-2 whitespace-pre-line max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 select-text">
                    {generateNarrativeSummary(match)}
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowCompletionModal(false);
                        handleResetMatch();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black uppercase tracking-wider text-[11px] rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer border-none font-sans"
                    >
                      Start New Match
                    </button>
                    <button
                      onClick={() => setShowCompletionModal(false)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-black uppercase tracking-wider text-[11px] rounded-2xl transition-all cursor-pointer border-none shadow-sm active:scale-95 font-sans"
                    >
                      Stay on Scoreboard
                    </button>
                  </div>
                  <button
                    onClick={handleExportMatchPDF}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-[11px] rounded-2xl transition-all cursor-pointer border-none shadow-md active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                  >
                    <FileDown size={14} className="text-emerald-200" /> Export Match Report PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditMatchModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditMatchModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 50 }}
              className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-700/50 rounded-[2rem] max-w-md w-full p-6 shadow-2xl relative z-10 text-white overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-teal-500" />
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Edit size={16} className="text-indigo-400" />
                  Modify Live Match Setup
                </h3>
                <button
                  onClick={() => setShowEditMatchModal(false)}
                  className="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 font-sans">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 label-required">Team A Name</label>
                  <input
                    type="text"
                    value={editModalTeamA}
                    onChange={(e) => setEditModalTeamA(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-white focus:border-indigo-500"
                    placeholder="Team A"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 label-required">Team B Name</label>
                  <input
                    type="text"
                    value={editModalTeamB}
                    onChange={(e) => setEditModalTeamB(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold outline-none text-white focus:border-indigo-500"
                    placeholder="Team B"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5 label-required">Overs Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editModalOversLimit}
                    onChange={(e) => setEditModalOversLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                  />
                </div>

                {currentInnings && (
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Current Runs</label>
                      <input
                        type="number"
                        min="0"
                        value={editModalRuns}
                        onChange={(e) => setEditModalRuns(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Wickets</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={editModalWickets}
                        onChange={(e) => setEditModalWickets(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Balls Bowled</label>
                      <input
                        type="number"
                        min="0"
                        value={editModalBallsBowled}
                        onChange={(e) => setEditModalBallsBowled(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono font-bold outline-none text-white focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 font-sans">
                  <button
                    onClick={() => setShowEditMatchModal(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-extrabold uppercase tracking-wider text-[10px] rounded-xl transition-all cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditedMatch}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-90 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl transition-all cursor-pointer border-none shadow-md"
                  >
                    Save Changes ⚡
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DLSCalculatorModal
        isOpen={showDlsCalculator}
        onClose={() => setShowDlsCalculator(false)}
        firstInningsRuns={match.innings1 ? match.innings1.runs : (currentInnings ? currentInnings.runs : 100)}
        firstInningsOvers={match.oversLimit}
        onApplyRevisedTarget={handleApplyDlsTarget}
        matchState={match}
      />

      <SpinCoinModal
        isOpen={showSpinCoinModal}
        onClose={() => setShowSpinCoinModal(false)}
        teamA={teamA || 'Team A'}
        teamB={teamB || 'Team B'}
        onApplyToss={handleApplySpinCoinToss}
        soundEnabled={soundEnabled}
      />
    </div>
  );
};

// Simple Fallback Icon wrapper
const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="18" height="18" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);
