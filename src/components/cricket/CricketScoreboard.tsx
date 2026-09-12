import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, RotateCcw, AlertCircle, ShoppingBag, Plus, Sparkles, BookOpen, Clock, 
  ArrowRight, Users, Play, Undo, Calendar, Trash2, ArrowLeftRight, Check,
  ChevronRight, Smile, Settings, Volume2, VolumeX, Edit, Edit3, ChevronDown, ChevronUp, Sun, Moon, Info, HelpCircle,
  Share2, FileDown, PlusCircle, BarChart3, Radio, Flame, ShieldAlert, Award, Zap, Lock, UserPlus,
  Eye, EyeOff, Search, Save, Download, X, CloudRain, Link2, Copy, ExternalLink, Send, Smartphone, Shield, Tv,
  Camera, Image as ImageIcon
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
  safeDeleteDoc,
  syncScoreToRealtimeDB,
  subscribeToRealtimeDBMatch,
  subscribeToCricketMatchesCollection,
  subscribeToCricketMatchDoc
} from '../../lib/firebase';
import { doc, setDoc, getDoc, onSnapshot, collection, deleteDoc } from 'firebase/firestore';

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
  sanitizeForFirestore,
  compressImageFile,
  isDemoOrAIMatch,
  purgeCachedAIMatches
} from './cricketStorage';
import {
  CommentaryLanguage,
  useCommentaryLanguage,
  getCommentaryText,
  createMultilingualCommentary,
  generateLocalizedCricketCommentary,
  CommentaryLanguageSelector,
  getMatchContextualTone,
  createBatsmanAnnouncement,
  createBowlerAnnouncement,
  createOverFinishedAndBowlerChangeAnnouncement,
  createInningsSummaryCommentary,
  createRunChaseEquationCommentary,
  createMatchWinningCommentary,
  getOrdinalWordEn,
  getOrdinalWordHi,
  getOrdinalWordMr,
  interceptSpecialEvent,
  ContextualToneShifterBadge,
  MatchContextualTone,
  ContextualToneInfo
} from './modules/commentaryLanguage';
import { WinProbabilityCard } from './modules/WinProbabilityCard';
import { calculateWinProbabilityDetails } from './modules/winProbabilityEngine';

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
  logo?: string;
  captainName?: string;
  captainPhone?: string;
  status?: 'pending_squad' | 'squad_submitted' | 'ready';
  squadDetails?: Array<{
    id: string;
    name: string;
    role?: string;
    isCaptain?: boolean;
    isViceCaptain?: boolean;
    isWicketkeeper?: boolean;
    jerseyNumber?: string;
    mobileNumber?: string;
    photo?: string;
  }>;
  updatedAt?: number;
  managerId?: string;
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
    translations?: {
      en?: string;
      hi?: string;
      mr?: string;
    };
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
  isSuperOver?: boolean;
  superOverNumber?: number;
  superOverWicketLimit?: number;
  tieResolution?: 'declared_tie' | 'super_over';
  mainMatchState?: {
    innings1: Innings;
    innings2: Innings;
    oversLimit: number;
    targetRuns?: number;
    status: 'completed';
    winner: string;
    winReason: string;
  };
  superOversHistory?: {
    superOverNumber: number;
    innings1: Innings;
    innings2: Innings | null;
    targetRuns?: number;
    winner?: string;
    winReason?: string;
  }[];
  updatedAt?: number;
  version?: number;
  overlayConfig?: OverlayConfig;
  teamALogo?: string;
  teamBLogo?: string;
  matchBannerUrl?: string;
  teamASquad?: (string | { name: string; isCaptain?: boolean; isWicketKeeper?: boolean; role?: string; photo?: string })[];
  teamBSquad?: (string | { name: string; isCaptain?: boolean; isWicketKeeper?: boolean; role?: string; photo?: string })[];
  teamACaptain?: string;
  teamBCaptain?: string;
  teamAWicketKeeper?: string;
  teamBWicketKeeper?: string;
  playerPhotos?: Record<string, string>;
  tournamentId?: string | null;
  tournamentMatchId?: string | null;
  createdBy?: string;
  managerId?: string;
  managerName?: string;
  streamKey?: string;
  tournamentName?: string;
  seriesName?: string;
  groundName?: string;
  isHidden?: boolean;
  isBlocked?: boolean;
  isSynthetic?: boolean;
  isAiMatch?: boolean;
  isDemo?: boolean;
  isBot?: boolean;
  playerOfTheMatch?: {
    name: string;
    runs: number;
    balls: number;
    wickets: number;
    runsConceded: number;
    points: number;
  };
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
        await safeSetDoc(tournamentDocRef, {
          matches: nextMatches,
          status: tournamentCompleted ? 'completed' : tournament.status,
          winnerTeamName: tournamentCompleted ? mainWinner : tournament.winnerTeamName
        }, { merge: true });
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
  return `${origin}/#/live/cricket-overlay?matchId=${encodeURIComponent(matchId)}${preview ? '&preview=true' : ''}`;
};

// Helper to generate a single, permanent OBS overlay link per score manager that NEVER changes between matches
const getPermanentOverlayUrl = (managerId: string, streamKey?: string, preview = false) => {
  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  const keyParam = streamKey ? `&streamKey=${encodeURIComponent(streamKey)}` : '';
  return `${origin}/#/live/cricket-overlay?managerId=${encodeURIComponent(managerId)}${keyParam}${preview ? '&preview=true' : ''}`;
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
  const isSpectator = searchParams.get('spectator') === 'true';

  // Multi-Scorekeeper Isolation: resolve individual score manager identity
  const currentManagerId = useMemo(() => {
    try {
      const vu = localStorage.getItem('erp_virtual_user');
      if (vu) {
        const parsed = JSON.parse(vu);
        return parsed.managerId || parsed.username || parsed.email?.split('@')[0] || user?.uid || 'official_scorer';
      }
    } catch (e) {
      console.warn('Error reading managerId from erp_virtual_user:', e);
    }
    return user?.uid || 'official_scorer';
  }, [user]);

  const currentManagerName = useMemo(() => {
    try {
      const vu = localStorage.getItem('erp_virtual_user');
      if (vu) {
        const parsed = JSON.parse(vu);
        return parsed.displayName || parsed.name || parsed.username || user?.displayName || currentManagerId || 'Official Scorer';
      }
    } catch {}
    return user?.displayName || currentManagerId || 'Official Scorer';
  }, [currentManagerId, user]);

  // Check if a match belongs to the official score manager and is not an unrequested AI bot / synthetic match
  const isMatchOwnedByCurrentManager = (m: MatchState | any): boolean => {
    if (!m || !m.id) return false;
    // Strictly filter out any AI bot, synthetic, exhibition, demo, or deleted match
    if (isDemoOrAIMatch(m) || isMatchDeleted(m.id) || (m as any).isDeleted === true || m.status === 'deleted') {
      return false;
    }
    // Reject matches created by bot / ai / system
    const createdBy = String(m.createdBy || '').toLowerCase();
    if (createdBy.includes('bot') || createdBy.includes('ai') || createdBy.includes('system') || createdBy.includes('simulator')) {
      return false;
    }
    // If signed in as official scorekeeper / manager, verify ownership
    if (isScoreManager) {
      if (m.managerId && currentManagerId && m.managerId !== currentManagerId) {
        return false;
      }
      if (m.createdBy && currentManagerId && m.createdBy !== currentManagerId && m.createdBy !== user?.uid && m.createdBy !== user?.email) {
        return false;
      }
    }
    return true;
  };

  // Team Management state vectors
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamModalTab, setTeamModalTab] = useState<'presets' | 'invite_captain' | 'direct_add'>('presets');
  const [savedTeams, setSavedTeams] = useState<CricketTeam[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCaptainName, setNewTeamCaptainName] = useState('');
  const [newTeamPlayersText, setNewTeamPlayersText] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  
  // Captain squad invite link state
  const [captainInviteTeamName, setCaptainInviteTeamName] = useState('');
  const [captainInviteCaptainName, setCaptainInviteCaptainName] = useState('');
  const [captainInvitePhone, setCaptainInvitePhone] = useState('');
  const [generatedCaptainLink, setGeneratedCaptainLink] = useState<string | null>(null);
  const [copiedCaptainLink, setCopiedCaptainLink] = useState(false);

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
  const [showObsModal, setShowObsModal] = useState(false);
  const [obsModalTab, setObsModalTab] = useState<'permanent' | 'single' | 'guide'>('permanent');

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

  // Load Past Matches from localStorage without seed data, purging any legacy bot/demo entries
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cricket_custom_past_matches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter(
            (m: any) => !isDemoOrAIMatch(m) && !String(m?.id || '').startsWith('custom-')
          );
          setPastMatches(sanitized);
          localStorage.setItem('cricket_custom_past_matches', JSON.stringify(sanitized));
        } else {
          setPastMatches([]);
          localStorage.setItem('cricket_custom_past_matches', JSON.stringify([]));
        }
      } else {
        setPastMatches([]);
        localStorage.setItem('cricket_custom_past_matches', JSON.stringify([]));
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
  const [matchBannerUrl, setMatchBannerUrl] = useState('');
  const [editModalMatchBannerUrl, setEditModalMatchBannerUrl] = useState('');
  const [oversLimit, setOversLimit] = useState(5);
  const [tossWinner, setTossWinner] = useState('Team A');
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [seriesName, setSeriesName] = useState('Bilateral Series');
  const [groundName, setGroundName] = useState('Gully Ground');
  const [tournamentName, setTournamentName] = useState('Bilateral Cup');
  const [setupOpeningBatsman1, setSetupOpeningBatsman1] = useState('');
  const [setupOpeningBatsman2, setSetupOpeningBatsman2] = useState('');
  const [setupOpeningBowler, setSetupOpeningBowler] = useState('');

  // Process and scale match banner compactly
  const processMatchBannerFile = (file: File, callback: (result: string) => void) => {
    compressImageFile(file, 800, 450, 0.72).then((compressed) => {
      if (compressed) {
        callback(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string' && event.target.result.length < 60000) {
            callback(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

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
  const [activeScorecardTab, setActiveScorecardTab] = useState<'bat' | 'bowl' | 'fow' | 'comm'>('bat');

  // Tie Resolution & Super Over State
  const [showTieResolutionModal, setShowTieResolutionModal] = useState<boolean>(false);
  const [superOverBatFirstOverride, setSuperOverBatFirstOverride] = useState<string>('');
  const [viewScorecardMode, setViewScorecardMode] = useState<'superOver' | 'main'>('superOver');

  useEffect(() => {
    if (match.winner === 'Tie' && match.tieResolution !== 'declared_tie') {
      setShowTieResolutionModal(true);
    }
  }, [match.winner, match.tieResolution]);

  // Manual Fall of Wickets entry/adjustment modal state
  const [showManualFoWModal, setShowManualFoWModal] = useState(false);
  const [manualFoWData, setManualFoWData] = useState<{
    wicketNo: number;
    score: number;
    batsmanName: string;
    oversList: string;
    editIndex?: number;
  }>({
    wicketNo: 1,
    score: 0,
    batsmanName: '',
    oversList: '0.1'
  });

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
  const [wicketType, setWicketType] = useState<'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW' | 'Retired Hurt'>('Bowled');
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
  const [userCommentaryLang, setUserCommentaryLang] = useCommentaryLanguage('en');

  // Copy Overlay Link state
  const [copiedOverlayLink, setCopiedOverlayLink] = useState(false);
  const [copiedPermanentOverlayLink, setCopiedPermanentOverlayLink] = useState(false);
  const [isActivatingLiveMatch, setIsActivatingLiveMatch] = useState(false);

  // Bulk Player adding states for setup roster builder
  const [showBulkAddTeamA, setShowBulkAddTeamA] = useState(false);
  const [bulkAddTeamAText, setBulkAddTeamAText] = useState('');
  const [showBulkAddTeamB, setShowBulkAddTeamB] = useState(false);
  const [bulkAddTeamBText, setBulkAddTeamBText] = useState('');

  // Overlay graphics control panel states
  const [activeControlTab, setActiveControlTab] = useState<'alerts' | 'graphics' | 'templates' | 'media'>('alerts');
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
    wicketType: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW' | 'Retired Hurt';
    howOutDetails: string;
    incomingBatsmanName: string;
    who: 'striker' | 'non-striker';
    fielderName?: string;
  } | null>(null);

  const [fallOfWicketModal, setFallOfWicketModal] = useState<{
    batsmanName: string;
    bowlerName: string;
    wicketType: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW' | 'Retired Hurt';
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
    if (editModalMatchBannerUrl !== undefined) {
      updated.matchBannerUrl = editModalMatchBannerUrl;
      setMatchBannerUrl(editModalMatchBannerUrl);
    }

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
          saveMatchToRegistry(updated);
          setActiveMatch(updated);
        } catch (e) {
          console.warn('Writing local match cache failed:', e);
        }

        // Instant Realtime DB broadcast across all visitor devices
        syncScoreToRealtimeDB(updated.id, sanitizeForFirestore(updated)).catch(() => {});

        // Persist the updated match scores directly to Firestore so all connected devices update in real-time
        queueDebouncedSave(updated, immediate);
      }
      return updated;
    });
  };

  // Load autosaved active match state from LocalStorage on mount
  useEffect(() => {
    // Proactively purge any cached AI bot matches, demo matches, or synthetic entries from local storage
    try {
      purgeCachedAIMatches();
    } catch (_) {}

    let saved = null;
    try {
      saved = localStorage.getItem('cricket_active_match');
    } catch (e) {
      console.warn('Blocked reading cricket_active_match from localStorage:', e);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as MatchState;
        if (parsed && (isDemoOrAIMatch(parsed) || isMatchDeleted(parsed.id) || !isMatchOwnedByCurrentManager(parsed))) {
          // If match belongs to a different scorekeeper or is an AI bot match, purge from active state
          localStorage.removeItem('cricket_active_match');
          setLocalAutosavedMatch(null);
        } else if (parsed && parsed.status === 'live' && parsed.id && isMatchOwnedByCurrentManager(parsed)) {
          setLocalAutosavedMatch(parsed);
        } else {
          setLocalAutosavedMatch(null);
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
      console.warn("Realtime subscription notice for cricket_teams:", error?.message || error);
    });
    return () => unsub();
  }, []);

  // Sync complete matches list (history) from Firestore
  useEffect(() => {
    const unsub = subscribeToCricketMatchesCollection((snap) => {
      const historyList: MatchState[] = [];
      const draftList: MatchState[] = [];
      const liveList: MatchState[] = [];
      const remoteIds = new Set<string>();

      snap.forEach((docSnap: any) => {
        const data = docSnap.data();
        const m = { ...data, id: data.id || docSnap.id } as MatchState;
        
        // Permanently filter out matches that were deleted or are AI bot / demo matches
        if (isMatchDeleted(m.id) || (m as any).isDeleted === true || m.status === 'deleted' || isDemoOrAIMatch(m)) {
          markMatchDeleted(m.id);
          return;
        }

        remoteIds.add(m.id);

        // Dashboard Isolation: If signed in as score manager, only populate matches belonging to this scorekeeper
        if (isScoreManager && !isMatchOwnedByCurrentManager(m)) {
          return;
        }

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
              if (lm && lm.status === 'draft' && !isMatchDeleted(lm.id) && !isDemoOrAIMatch(lm)) {
                if (isScoreManager && !isMatchOwnedByCurrentManager(lm)) {
                  return;
                }
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

      const cleanHistory = historyList.filter(m => !isMatchDeleted(m.id) && !isDemoOrAIMatch(m) && isMatchOwnedByCurrentManager(m));
      const cleanDrafts = draftList.filter(m => !isMatchDeleted(m.id) && !isDemoOrAIMatch(m) && isMatchOwnedByCurrentManager(m));
      const cleanLive = liveList.filter(m => !isMatchDeleted(m.id) && !isDemoOrAIMatch(m) && isMatchOwnedByCurrentManager(m));

      setMatchHistory(cleanHistory);
      setSavedDrafts(cleanDrafts);
      setActiveLiveMatches(cleanLive);
    }, (error) => {
      console.warn("Realtime subscription notice for cricket_matches:", error?.message || error);
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

    const unsub = subscribeToCricketMatchDoc(activeMatchId, (docSnap) => {
      if (!docSnap || !docSnap.exists || !docSnap.exists()) return;
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
              description: `Batter 1 State and Batter 2 State new batsman are come on crease and Bowler 1 State will bowl the first over. (${coinTossWinTeam} won toss & elected to ${choice} first)`,
              type: 'milestone'
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
          createdBy: currentManagerId || user?.email || user?.uid || 'anonymous',
          managerId: currentManagerId || undefined,
          managerName: currentManagerName || undefined,
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

    const batsman1Name = setupOpeningBatsman1.trim() || ((batRoster && batRoster.length > 0) ? batRoster[0] : 'Batter 1 State');
    const batsman2Name = setupOpeningBatsman2.trim() || ((batRoster && batRoster.length > 1) ? batRoster[1] : 'Batter 2 State');
    const bowler1Name = setupOpeningBowler.trim() || ((bowlRoster && bowlRoster.length > 0) ? bowlRoster[0] : 'Bowler 1 State');

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
        { id: `c-${Date.now()}`, overBall: '0.0', description: `${batsman1Name} and ${batsman2Name} new batsman are come on crease and ${bowler1Name} will bowl the first over.`, type: 'milestone' }
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
      teamALogo: teamALogoUrl || match?.teamALogo || null,
      teamBLogo: teamBLogoUrl || match?.teamBLogo || null,
      matchBannerUrl: matchBannerUrl || match?.matchBannerUrl || undefined,
      teamASquad: selectedTeamARoster,
      teamBSquad: selectedTeamBRoster,
      playerPhotos: match?.playerPhotos || {},
      tournamentId: match?.tournamentId || null,
      tournamentMatchId: match?.tournamentMatchId || null,
      tournamentName: tournamentName || null,
      seriesName: seriesName || 'Bilateral Series',
      groundName: groundName || 'Gully Ground',
      createdBy: currentManagerId || user?.email || user?.uid || 'anonymous',
      managerId: currentManagerId || undefined,
      managerName: currentManagerName || undefined,
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

    // Synchronize active match pointer for permanent OBS link
    if (currentManagerId) {
      const managerDocRef = doc(db, 'score_managers', currentManagerId);
      safeSetDoc(managerDocRef, {
        managerId: currentManagerId,
        managerName: currentManagerName,
        streamKey: streamKey,
        activeMatchId: newMatch.id,
        status: 'live',
        activeMatchSummary: {
          id: newMatch.id,
          teamA: newMatch.teamA,
          teamB: newMatch.teamB,
          oversLimit: newMatch.oversLimit
        },
        updatedAt: Date.now()
      }, { merge: true }).catch(() => {});

      if (streamKey) {
        safeSetDoc(doc(db, 'score_managers', streamKey), {
          managerId: currentManagerId,
          streamKey: streamKey,
          activeMatchId: newMatch.id,
          status: 'live',
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }

      fetch('/api/cricket/set-active-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: currentManagerId,
          matchId: newMatch.id,
          streamKey: streamKey,
          matchData: sanitizeForFirestore(newMatch)
        })
      }).catch(() => {});
    }

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
    const oldBatsman = currentInnings.batsmen[index];
    const oldName = oldBatsman?.name;
    const trimmedName = name.trim() || `Batsman ${index + 1}`;

    const updatedBatsmen = currentInnings.batsmen.map((b, idx) => {
      if (idx === index) return { ...b, name: trimmedName };
      return b;
    });

    const isStriker = index === currentInnings.strikerIndex;
    const isNonStriker = index === currentInnings.nonStrikerIndex;
    const isCrease = isStriker || isNonStriker;

    // Update Fall of Wickets entries if old name was logged
    const updatedFoW = (currentInnings.fallOfWickets || []).map(fw => {
      if (oldName && fw.batsmanName && fw.batsmanName.toLowerCase().trim() === oldName.toLowerCase().trim()) {
        return { ...fw, batsmanName: trimmedName };
      }
      return fw;
    });

    // Update old commentary entries mentioning previous name so scorecard commentary stays accurate
    const updatedOldCommentary = (currentInnings.commentaryList || []).map(comm => {
      if (!oldName || oldName === trimmedName) return comm;
      let newDesc = comm.description;
      if (newDesc && newDesc.includes(oldName)) {
        newDesc = newDesc.replaceAll(oldName, trimmedName);
      }
      let newTranslations = comm.translations ? { ...comm.translations } : undefined;
      if (newTranslations) {
        if (newTranslations.en && newTranslations.en.includes(oldName)) {
          newTranslations.en = newTranslations.en.replaceAll(oldName, trimmedName);
        }
        if (newTranslations.hi && newTranslations.hi.includes(oldName)) {
          newTranslations.hi = newTranslations.hi.replaceAll(oldName, trimmedName);
        }
        if (newTranslations.mr && newTranslations.mr.includes(oldName)) {
          newTranslations.mr = newTranslations.mr.replaceAll(oldName, trimmedName);
        }
      }
      return {
        ...comm,
        description: newDesc,
        translations: newTranslations
      };
    });

    const commDesc = `${trimmedName} new batsman come on crease.`;
    const commEntry = {
      id: `comm-bat-upd-${Date.now()}`,
      overBall: formatOvers(currentInnings.ballsBowled),
      description: commDesc,
      type: 'normal' as const,
      translations: {
        en: commDesc,
        hi: `${trimmedName} नए बल्लेबाज क्रीज पर आए हैं.`,
        mr: `${trimmedName} नवीन फलंदाज क्रीजवर आले आहेत.`
      }
    };

    const updatedInnings = { 
      ...currentInnings, 
      batsmen: updatedBatsmen,
      fallOfWickets: updatedFoW,
      commentaryList: isCrease ? [commEntry, ...updatedOldCommentary] : updatedOldCommentary
    };

    const nextMatchState: MatchState = {
      ...match,
      version: (match.version || 0) + 1,
      updatedAt: Date.now(),
      innings1: match.currentInningsNum === 1 ? updatedInnings : match.innings1,
      innings2: match.currentInningsNum === 2 ? updatedInnings : match.innings2
    };

    syncMatch(nextMatchState, true);
    saveMatchToRegistry(nextMatchState);
    setActiveMatch(nextMatchState);

    // Trigger AI Commentary for the updated batsman so commentary stays alive
    if (aiCommentaryEnabled && !isSpectator) {
      const activeBowler = currentInnings.bowlers[currentInnings.currentBowlerIndex]?.name || 'Bowler';
      const otherBatsmanName = currentInnings.batsmen[isStriker ? currentInnings.nonStrikerIndex : currentInnings.strikerIndex]?.name || '';
      generateAICommentary(
        nextMatchState,
        { type: 'batsman_update' },
        trimmedName,
        activeBowler,
        commDesc,
        match.currentInningsNum,
        {
          nonStrikerName: otherBatsmanName,
          isNewBatsmanOnCrease: true,
          newBatsmanName: trimmedName
        },
        isCrease ? commEntry.id : undefined
      );
    }

    setEditStrikerIndex(null);
    setEditNonStrikerIndex(null);
    showNotification(`${trimmedName} updated on crease.`, 'success');
  };

  const handleUpdateBowlerName = (index: number, name: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const trimmedBowlerName = name.trim() || `Bowler ${index + 1}`;
    const updatedBowlers = currentInnings.bowlers.map((b, idx) => {
      if (idx === index) return { ...b, name: trimmedBowlerName };
      return b;
    });

    const isCurrent = index === currentInnings.currentBowlerIndex;
    const bowlerDesc = currentInnings.ballsBowled === 0
      ? `${trimmedBowlerName} will bowl the first over.`
      : `${trimmedBowlerName} will bowl the over.`;

    const commEntry = {
      id: `comm-bowl-upd-${Date.now()}`,
      overBall: formatOvers(currentInnings.ballsBowled),
      description: `${bowlerDesc}`,
      type: 'normal' as const
    };

    const updatedInnings = { 
      ...currentInnings, 
      bowlers: updatedBowlers,
      commentaryList: isCurrent ? [commEntry, ...(currentInnings.commentaryList || [])] : (currentInnings.commentaryList || [])
    };
    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    setEditBowlerIndex(null);
    showNotification(`${trimmedBowlerName} bowler updated.`, 'success');
  };

  const handleAddNewBowler = (name: string) => {
    if (!currentInnings) return;
    pushStateToUndoStack(match);
    const existingBowlers = currentInnings.bowlers || [];
    const trimmedBowlerName = name.trim() || `Bowler ${existingBowlers.length + 1}`;
    const updatedBowlers = [...existingBowlers.map(b => ({ ...b, isCurrent: false })), {
      name: trimmedBowlerName,
      ballsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      isCurrent: true
    }];

    const facingBatter = currentInnings.batsmen?.[currentInnings.strikerIndex];
    const commEntry = createBowlerAnnouncement(
      trimmedBowlerName,
      formatOvers(currentInnings.ballsBowled),
      {
        isNewOver: currentInnings.ballsBowled === 0 || currentInnings.ballsBowled % 6 === 0,
        facingBatsmanName: facingBatter?.name
      }
    );

    const updatedInnings = {
      ...currentInnings,
      bowlers: updatedBowlers,
      currentBowlerIndex: updatedBowlers.length - 1,
      commentaryList: [commEntry, ...(currentInnings.commentaryList || [])]
    };

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    showNotification(`New bowler ${trimmedBowlerName} is now bowling!`, 'success');
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
      ...(inn.commentaryList || [])
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
    const existingBatsmen = currentInnings.batsmen || [];
    const trimmedBatsmanName = name.trim() || `Batsman ${existingBatsmen.length + 1}`;
    const updatedBatsmen = [...existingBatsmen, {
      name: trimmedBatsmanName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false
    }];

    const partnerBatter = currentInnings.batsmen?.[currentInnings.nonStrikerIndex];
    const commEntry = createBatsmanAnnouncement(
      trimmedBatsmanName,
      formatOvers(currentInnings.ballsBowled),
      {
        partnerName: partnerBatter?.name
      }
    );

    const updatedInnings = {
      ...currentInnings,
      batsmen: updatedBatsmen,
      commentaryList: [commEntry, ...(currentInnings.commentaryList || [])]
    };

    syncMatch(prev => ({
      ...prev,
      innings1: prev.currentInningsNum === 1 ? updatedInnings : prev.innings1,
      innings2: prev.currentInningsNum === 2 ? updatedInnings : prev.innings2
    }));
    showNotification(`Added new batsman ${trimmedBatsmanName} to roster!`, 'success');
  };

  const generateAICommentary = async (
    matchState: MatchState,
    eventInfo: { type: string; val?: number; extraType?: string },
    batsmanName: string,
    bowlerName: string,
    baseDesc: string,
    inningsNum: number,
    additionalContext?: {
      nonStrikerName?: string;
      isBowlerChanged?: boolean;
      isNewBatsmanOnCrease?: boolean;
      newBatsmanName?: string;
      isOverStart?: boolean;
      isCrucialTime?: boolean;
      specialTrigger?: {
        type: 'wicket' | 'fifty' | 'hundred' | 'hat_trick' | 'retire_hurt';
        batterName?: string;
        batterRuns?: number;
        batterBalls?: number;
        bowlerName?: string;
        howOut?: string;
      };
    },
    targetCommentaryId?: string
  ) => {
    try {
      setIsAiCommentaryLoading(true);
      const activeInnings = inningsNum === 1 ? matchState.innings1 : matchState.innings2;
      const toneInfo = getMatchContextualTone(matchState, activeInnings);

      let winProbData: any = undefined;
      try {
        const metrics = calculateWinProbabilityDetails(matchState);
        if (metrics) {
          winProbData = {
            teamA: metrics.teamAName,
            teamB: metrics.teamBName,
            probA: metrics.probA,
            probB: metrics.probB,
            favoredTeam: metrics.favoredTeamName,
            favoredProbability: metrics.favoredProbability,
            battingTeam: metrics.battingTeamName,
            battingProb: metrics.battingTeamProb,
            bowlingTeam: metrics.bowlingTeamName,
            bowlingProb: metrics.bowlingTeamProb,
            equationText: metrics.equationText
          };
        }
      } catch (err) {
        console.warn('Could not calculate win probability for AI commentary:', err);
      }

      const res = await fetch('/api/cricket/commentary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchState: activeInnings,
          event: eventInfo,
          batsman: { name: batsmanName },
          striker: { name: batsmanName },
          nonStriker: { name: additionalContext?.nonStrikerName || '' },
          bowler: { name: bowlerName },
          originalDescription: baseDesc,
          isBowlerChanged: additionalContext?.isBowlerChanged || false,
          isNewBatsmanOnCrease: additionalContext?.isNewBatsmanOnCrease || false,
          newBatsmanName: additionalContext?.newBatsmanName || '',
          isOverStart: additionalContext?.isOverStart || false,
          isCrucialTime: additionalContext?.isCrucialTime,
          language: userCommentaryLang,
          contextualTone: toneInfo.tone,
          specialTrigger: additionalContext?.specialTrigger,
          winProbability: additionalContext?.isCrucialTime ? winProbData : undefined
        })
      });
      const data = await res.json();
      if (data && (data.text || data.translations)) {
        syncMatch(prev => {
          const targetInnings = inningsNum === 1 ? prev.innings1 : prev.innings2;
          if (!targetInnings) return prev;
          
          const updatedCommList = [...targetInnings.commentaryList];
          if (updatedCommList.length > 0) {
            const translations = data.translations || {
              en: data.text,
              hi: data.translations?.hi,
              mr: data.translations?.mr
            };
            const targetIdx = targetCommentaryId
              ? updatedCommList.findIndex(c => c.id === targetCommentaryId)
              : 0;
            const validIdx = targetIdx !== -1 ? targetIdx : 0;
            updatedCommList[validIdx] = {
              ...updatedCommList[validIdx],
              description: data.text || updatedCommList[validIdx].description,
              translations: translations
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

    const newActiveBowler = currentInnings.bowlers[index];
    const newBowlerName = newActiveBowler?.name || 'Bowler';
    const strikerBatter = currentInnings.batsmen?.[currentInnings.strikerIndex];
    const nonStrikerBatter = currentInnings.batsmen?.[currentInnings.nonStrikerIndex];
    const overStr = formatOvers(currentInnings.ballsBowled);
    const isOverBoundary = currentInnings.ballsBowled > 0 && currentInnings.ballsBowled % 6 === 0;
    let commEntry: any;

    if (isOverBoundary) {
      const completedOverNo = Math.floor(currentInnings.ballsBowled / 6);
      commEntry = createOverFinishedAndBowlerChangeAnnouncement(
        completedOverNo,
        newBowlerName,
        overStr
      );
    } else {
      commEntry = createBowlerAnnouncement(
        newBowlerName,
        overStr,
        {
          isNewOver: currentInnings.ballsBowled === 0,
          facingBatsmanName: strikerBatter?.name
        }
      );
    }
    const bowlingChangeDesc = commEntry.description;

    let updatedCommList = [...(currentInnings.commentaryList || [])];
    if (isOverBoundary && updatedCommList.length > 0 && updatedCommList[0].id?.startsWith('comm-over-finish-')) {
      updatedCommList[0] = commEntry;
    } else {
      updatedCommList = [commEntry, ...updatedCommList];
    }

    const updatedInnings = {
      ...currentInnings,
      bowlers: updatedBowlers,
      currentBowlerIndex: index,
      commentaryList: updatedCommList
    };

    const nextMatchState = {
      ...match,
      innings1: match.currentInningsNum === 1 ? updatedInnings : match.innings1,
      innings2: match.currentInningsNum === 2 ? updatedInnings : match.innings2
    };

    syncMatch(nextMatchState);
    showNotification(`Bowler changed to ${newBowlerName}.`, 'info');

    if (aiCommentaryEnabled && !isSpectator) {
      generateAICommentary(
        nextMatchState,
        { type: 'bowler_change' },
        strikerBatter?.name || 'Batsman',
        newBowlerName,
        bowlingChangeDesc,
        match.currentInningsNum,
        {
          nonStrikerName: nonStrikerBatter?.name,
          isBowlerChanged: true
        },
        commEntry.id
      );
    }
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
      outcomeDescription = batRuns > 0 
        ? `No-Ball called! Plus ${batRuns} run${batRuns > 1 ? 's' : ''} scored off the bat to batsman ${striker.name} (Total ${totalRunsFromBall} runs). Free hit awarded!`
        : `No-Ball called! 1 extra run conceded. Free hit awarded!`;
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
    let milestoneSpecial: any = null;

    if (originalStrikerRuns < 50 && finalStrikerRuns >= 50) {
      milestoneSpecial = interceptSpecialEvent('fifty', formatOvers(inn.ballsBowled), {
        batterName: striker.name,
        batterRuns: striker.runs,
        batterBalls: striker.balls,
        batterFours: striker.fours,
        batterSixes: striker.sixes,
        strikeRate: striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0'
      });
      showNotification(milestoneSpecial.notification, 'success');
      // Set overlay blast
      nextMatchState.overlayConfig = {
        ...(nextMatchState.overlayConfig || {}),
        manualAlertTrigger: {
          type: 'fifty',
          timestamp: Date.now()
        },
        customBanner: 'fifty',
        customBannerText: milestoneSpecial.bannerTitle
      };
    } else if (originalStrikerRuns < 100 && finalStrikerRuns >= 100) {
      milestoneSpecial = interceptSpecialEvent('hundred', formatOvers(inn.ballsBowled), {
        batterName: striker.name,
        batterRuns: striker.runs,
        batterBalls: striker.balls,
        batterFours: striker.fours,
        batterSixes: striker.sixes,
        strikeRate: striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0'
      });
      showNotification(milestoneSpecial.notification, 'success');
      // Set overlay blast
      nextMatchState.overlayConfig = {
        ...(nextMatchState.overlayConfig || {}),
        manualAlertTrigger: {
          type: 'hundred',
          timestamp: Date.now()
        },
        customBanner: 'hundred',
        customBannerText: milestoneSpecial.bannerTitle
      };
    }

    inn.batsmen = batsmen;
    inn.bowlers = bowlers;

    // Set last ball result string helper
    let ballLabel = '';
    if (event.type === 'dot') ballLabel = '0';
    else if (event.type === 'runs') ballLabel = String(event.val);
    else if (event.type === 'wide') ballLabel = (event.val && event.val > 0) ? `WD+${event.val}` : 'WD';
    else if (event.type === 'noball') ballLabel = (event.val && event.val > 0) ? `NB+${event.val}` : 'NB';
    else if (event.type === 'bye') ballLabel = event.val ? `${event.val}B` : 'B';
    else if (event.type === 'legbye') ballLabel = event.val ? `${event.val}LB` : 'LB';

    const ballDesc = `${bowler.name} to ${striker.name}: ${outcomeDescription}`;
    const localizedEventCat: 'dot' | 'runs' | 'boundary' | 'wicket' | 'extra' = 
      eventType === 'boundary' ? 'boundary' : 
      eventType === 'extra' ? 'extra' : 
      (event.type === 'dot' ? 'dot' : 'runs');

    const runsOffBatFromDelivery = (event.type === 'noball' || event.type === 'wide') ? (event.val || 0) : ballRuns;
    const effectiveExtraType = event.type === 'noball' ? 'noball' : (event.type === 'wide' ? 'wide' : event.extraType);

    let deliveryWinProb: any = undefined;
    try {
      const metrics = calculateWinProbabilityDetails(nextMatchState);
      if (metrics) {
        deliveryWinProb = {
          teamA: metrics.teamAName,
          teamB: metrics.teamBName,
          probA: metrics.probA,
          probB: metrics.probB,
          favoredTeam: metrics.favoredTeamName,
          favoredProbability: metrics.favoredProbability
        };
      }
    } catch (err) {
      // non-fatal
    }

    // Requirement 4: Win probability shown only at crucial times, not on every ball
    const isCrucialMoment = Boolean(
      (eventType === 'boundary' && runsOffBatFromDelivery === 6) ||
      milestoneSpecial ||
      (isCalculatedOverBall && inn.ballsBowled > 0 && inn.ballsBowled % 6 === 0) ||
      nextMatchState.isSuperOver ||
      (nextMatchState.currentInningsNum === 2 && nextMatchState.targetRuns && (
        (nextMatchState.oversLimit * 6 - inn.ballsBowled <= 18) ||
        (nextMatchState.targetRuns - inn.runs <= 25)
      ))
    );

    const generatedHi = generateLocalizedCricketCommentary(
      localizedEventCat,
      runsOffBatFromDelivery,
      striker.name,
      bowler.name,
      'hi',
      { extraType: effectiveExtraType, runsOffBat: runsOffBatFromDelivery, winProbability: deliveryWinProb, isCrucialTime: isCrucialMoment }
    );
    const generatedMr = generateLocalizedCricketCommentary(
      localizedEventCat,
      runsOffBatFromDelivery,
      striker.name,
      bowler.name,
      'mr',
      { extraType: effectiveExtraType, runsOffBat: runsOffBatFromDelivery, winProbability: deliveryWinProb, isCrucialTime: isCrucialMoment }
    );

    let localizedEnWithProb = ballDesc;
    if (isCrucialMoment && deliveryWinProb && deliveryWinProb.teamA && deliveryWinProb.teamB) {
      const pA = Math.round(deliveryWinProb.probA ?? 50);
      const pB = Math.round(deliveryWinProb.probB ?? 50);
      localizedEnWithProb += ` [AI Win Probability: ${deliveryWinProb.teamA} ${pA}% | ${deliveryWinProb.teamB} ${pB}%]`;
    }

    const ballCommEntry = {
      id: `c-${Date.now()}`,
      overBall: formatOvers(inn.ballsBowled),
      description: localizedEnWithProb,
      type: eventType,
      isNoBall: event.type === 'noball',
      runsOffBat: runsOffBatFromDelivery,
      ballScore: ballLabel,
      translations: {
        en: localizedEnWithProb,
        hi: generatedHi,
        mr: generatedMr
      }
    };

    inn.commentaryList = [
      ...(milestoneSpecial ? [milestoneSpecial.commentary] : []),
      ballCommEntry,
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

    // Requirement 5: Over finished and bowling change commentary
    if (
      isCalculatedOverBall &&
      inn.ballsBowled > 0 &&
      inn.ballsBowled % 6 === 0 &&
      nextMatchState.status !== 'completed' &&
      nextMatchState.currentInningsNum === (match.currentInningsNum || 1)
    ) {
      const completedOverNo = Math.floor(inn.ballsBowled / 6);
      let nextBowlerCandidate = '';
      if (inn.bowlers.length > 1) {
        const nextBwIdx = (inn.currentBowlerIndex + 1) % inn.bowlers.length;
        nextBowlerCandidate = inn.bowlers[nextBwIdx]?.name || '';
      }
      if (!nextBowlerCandidate) {
        const bowlSquad = (inn.bowlingTeam === nextMatchState.teamA ? selectedTeamARoster : selectedTeamBRoster) || [];
        if (bowlSquad.length > 1) {
          nextBowlerCandidate = bowlSquad[1];
        } else {
          nextBowlerCandidate = `Bowler ${inn.bowlers.length + 1}`;
        }
      }
      const overFinishComm = createOverFinishedAndBowlerChangeAnnouncement(
        completedOverNo,
        nextBowlerCandidate,
        formatOvers(inn.ballsBowled)
      );
      const activeInningsKey = nextMatchState.currentInningsNum === 1 ? 'innings1' : 'innings2';
      if (nextMatchState[activeInningsKey]) {
        nextMatchState[activeInningsKey] = {
          ...nextMatchState[activeInningsKey]!,
          commentaryList: [overFinishComm, ...(nextMatchState[activeInningsKey]!.commentaryList || [])]
        };
      }
    }

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
        match.currentInningsNum,
        {
          nonStrikerName: nonStriker?.name,
          isBowlerChanged: false,
          isNewBatsmanOnCrease: false,
          isOverStart: (inn.ballsBowled % 6 === 1),
          isCrucialTime: isCrucialMoment,
          specialTrigger: milestoneSpecial ? {
            type: milestoneSpecial.commentary.specialEvent,
            batterName: striker.name,
            batterRuns: striker.runs,
            batterBalls: striker.balls
          } : undefined
        },
        ballCommEntry.id
      );
    }
  };

  // Helper to cleanly open wicket modal with current crease context
  const openWicketModal = (who: 'striker' | 'non-striker' = 'striker') => {
    setActiveAnimation('wicket');
    setOutBatsmanWho(who);
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
  };

  // Helper to cleanly open retire hurt dismissal
  const openRetireHurtModal = (who: 'striker' | 'non-striker' = 'striker') => {
    setActiveAnimation('wicket');
    setOutBatsmanWho(who);
    if (currentInnings) {
      const activeBowlerName = currentInnings.bowlers[currentInnings.currentBowlerIndex]?.name || '';
      setWicketBowlerName(activeBowlerName);
      setWicketHowOutDetails('Retired Hurt');
      setWicketType('Retired Hurt');
      setWicketFielderName('');
      setWicketAdditionalDetails('Retired Hurt (Injured)');
      setNewBatsmanName('');
      setWicketValidationErr('');
    }
    setShowWicketModal(true);
  };

  // Manual Fall of Wickets entry or adjustment
  const handleSaveManualFoW = () => {
    if (!currentInnings) return;
    if (!manualFoWData.batsmanName.trim()) {
      showNotification('Dismissed batsman name is required', 'alert');
      return;
    }
    const currentFoW = [...(currentInnings.fallOfWickets || [])];
    const newEntry = {
      wicketNo: manualFoWData.wicketNo,
      score: Number(manualFoWData.score) || 0,
      batsmanName: manualFoWData.batsmanName.trim(),
      oversList: manualFoWData.oversList.trim() || formatOvers(currentInnings.ballsBowled)
    };

    if (manualFoWData.editIndex !== undefined && manualFoWData.editIndex >= 0 && manualFoWData.editIndex < currentFoW.length) {
      currentFoW[manualFoWData.editIndex] = newEntry;
    } else {
      currentFoW.push(newEntry);
    }
    currentFoW.sort((a, b) => a.wicketNo - b.wicketNo);

    syncMatch(prev => {
      const innKey = prev.currentInningsNum === 1 ? 'innings1' : 'innings2';
      const inn = prev[innKey];
      if (!inn) return prev;
      return {
        ...prev,
        [innKey]: {
          ...inn,
          fallOfWickets: currentFoW
        }
      };
    });

    showNotification(`Fall of Wicket #${newEntry.wicketNo} saved successfully!`, 'success');
    setShowManualFoWModal(false);
  };

  const handleDeleteFoW = (idx: number) => {
    if (!currentInnings) return;
    const currentFoW = [...(currentInnings.fallOfWickets || [])];
    currentFoW.splice(idx, 1);
    syncMatch(prev => {
      const innKey = prev.currentInningsNum === 1 ? 'innings1' : 'innings2';
      const inn = prev[innKey];
      if (!inn) return prev;
      return {
        ...prev,
        [innKey]: {
          ...inn,
          fallOfWickets: currentFoW
        }
      };
    });
    showNotification('Fall of Wicket entry removed.', 'info');
  };

  // Advanced Wicket Handler Modal Actions
  const handleWicketScore = () => {
    if (!currentInnings) return;
    setWicketValidationErr('');

    const batsmen = currentInnings.batsmen || [];
    const bowler = currentInnings.bowlers?.[currentInnings.currentBowlerIndex] || currentInnings.bowlers?.[0] || {
      name: 'Bowler',
      ballsBowled: 0,
      runsConceded: 0,
      maidens: 0,
      wickets: 0,
      isCurrent: true
    };

    const currentStriker = batsmen[currentInnings.strikerIndex] || {
      name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false
    };
    const currentNonStriker = batsmen[currentInnings.nonStrikerIndex] || {
      name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false
    };

    const dismissedBatter = outBatsmanWho === 'striker' ? currentStriker : currentNonStriker;

    // Check if free hit protects the batsman
    if (match.freeHitNext && wicketType !== 'Run Out' && wicketType !== 'Retired Hurt') {
      showNotification(`Free Hit protects ${dismissedBatter.name} from being out (${wicketType})! No wicket recorded.`, 'info');
      setShowWicketModal(false);
      return;
    }

    const detailedBowler = wicketBowlerName.trim() || bowler.name || 'Bowler';
    let baseHowOut = wicketHowOutDetails.trim() || wicketType;
    if (wicketType === 'Caught') {
      const catcher = wicketFielderName.trim();
      if (catcher) {
        baseHowOut = catcher.toLowerCase() === detailedBowler.toLowerCase() ? `c & b ${detailedBowler}` : `c ${catcher} b ${detailedBowler}`;
      } else {
        baseHowOut = `c & b ${detailedBowler}`;
      }
    } else if (wicketType === 'Retired Hurt') {
      baseHowOut = 'Retired Hurt';
    }

    const detailedHowOut = baseHowOut + (wicketAdditionalDetails.trim() ? ` (${wicketAdditionalDetails.trim()})` : '');
    const finalBatsmanName = newBatsmanName.trim() || `Batsman ${batsmen.length + 1}`;

    setShowWicketModal(false);
    playSoundEffect('click');

    const replayData = {
      batsmanName: dismissedBatter.name,
      bowlerName: detailedBowler,
      wicketType: wicketType,
      howOutDetails: detailedHowOut,
      incomingBatsmanName: finalBatsmanName,
      who: outBatsmanWho,
      fielderName: (wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') ? wicketFielderName.trim() : undefined
    };

    // Directly commit the wicket to ensure it takes immediately in both standard and cockpit views
    commitWicketScore(replayData);
    setFallOfWicketModal(replayData);
    setPendingWicketReplay(null);
  };

  const commitWicketScore = (replay: {
    batsmanName: string;
    bowlerName: string;
    wicketType: 'Bowled' | 'Caught' | 'Run Out' | 'Stumped' | 'LBW' | 'Retired Hurt';
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
    const batsmen = [...(inn.batsmen || [])];
    const bowlers = [...(inn.bowlers || [])];

    const currentStriker = { ...(batsmen[inn.strikerIndex] || { name: 'Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }) };
    const currentNonStriker = { ...(batsmen[inn.nonStrikerIndex] || { name: 'Non-Striker', runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }) };
    const bowler = { ...(bowlers[inn.currentBowlerIndex] || bowlers[0] || { name: 'Bowler', ballsBowled: 0, runsConceded: 0, maidens: 0, wickets: 0, isCurrent: true }) };

    const dismissedBatter = replay.who === 'striker' ? currentStriker : currentNonStriker;

    const detailedHowOut = replay.howOutDetails;
    const detailedBowler = replay.bowlerName;
    const isRetiredHurt = replay.wicketType === 'Retired Hurt';

    dismissedBatter.isOut = true;
    dismissedBatter.outMode = isRetiredHurt ? 'Retired Hurt' : detailedHowOut;
    dismissedBatter.dismissedBy = isRetiredHurt ? 'Retired Hurt' : detailedBowler;
    if (replay.fielderName) {
      dismissedBatter.fielderName = replay.fielderName;
    }

    // Increment over details (Retire hurt does not count as a bowled ball or team wicket)
    if (!isRetiredHurt) {
      inn.wickets += 1;
      inn.ballsBowled += 1;
      bowler.ballsBowled += 1;
    }

    // Wicket credit logic & Hat-trick tracking:
    let hatTrickSpecial: any = null;
    if (replay.wicketType !== 'Run Out' && !isRetiredHurt) {
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
          hatTrickSpecial = interceptSpecialEvent('hat_trick', formatOvers(inn.ballsBowled), {
            bowlerName: activeBowler.name
          });
          showNotification(hatTrickSpecial.notification, 'success');
          // Update overlay banner blast
          nextMatchState.overlayConfig = {
            ...(nextMatchState.overlayConfig || {}),
            manualAlertTrigger: {
              type: '5wkt',
              timestamp: Date.now()
            },
            customBanner: 'drinks',
            customBannerText: hatTrickSpecial.bannerTitle
          };
        }
      }
    }

    // Add Fall of wicket safely (only for actual dismissals, not Retired Hurt)
    if (!isRetiredHurt) {
      inn.fallOfWickets = inn.fallOfWickets || [];
      inn.fallOfWickets.push({
        wicketNo: inn.wickets,
        score: inn.runs,
        batsmanName: dismissedBatter.name,
        oversList: formatOvers(inn.ballsBowled)
      });
    }

    const maxAllowedWickets = nextMatchState.isSuperOver ? (nextMatchState.superOverWicketLimit || 2) : 10;
    const isSuperOverInningsEnded = nextMatchState.isSuperOver && inn.wickets >= maxAllowedWickets;

    let finalBatsmanName = '';
    if (!isSuperOverInningsEnded) {
      finalBatsmanName = replay.incomingBatsmanName.trim() || `Batsman ${batsmen.length + 1}`;
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
    } else {
      if (replay.who === 'striker') {
        batsmen[inn.strikerIndex] = dismissedBatter;
      } else {
        batsmen[inn.nonStrikerIndex] = dismissedBatter;
      }
    }

    let overCompletionSuffix = '';
    if (!isRetiredHurt && inn.ballsBowled > 0 && inn.ballsBowled % 6 === 0) {
      const temp = inn.strikerIndex;
      inn.strikerIndex = inn.nonStrikerIndex;
      inn.nonStrikerIndex = temp;
      overCompletionSuffix = ` (End of Over ${Math.floor(inn.ballsBowled / 6)})`;
    }

    inn.batsmen = batsmen;
    if (bowlers[inn.currentBowlerIndex]) {
      bowlers[inn.currentBowlerIndex] = bowler;
    }
    inn.bowlers = bowlers;

    const dismissedSR = dismissedBatter.balls > 0 ? ((dismissedBatter.runs / dismissedBatter.balls) * 100).toFixed(1) : '0.0';

    // 1. Intercept special event breakdown for wicket dismissal or retired hurt
    const wicketSpecial = interceptSpecialEvent(
      isRetiredHurt ? 'retire_hurt' : 'wicket',
      formatOvers(inn.ballsBowled),
      {
        batterName: dismissedBatter.name,
        batterRuns: dismissedBatter.runs,
        batterBalls: dismissedBatter.balls,
        batterFours: dismissedBatter.fours,
        batterSixes: dismissedBatter.sixes,
        howOut: isRetiredHurt ? 'Retired Hurt' : detailedHowOut,
        bowlerName: detailedBowler,
        strikeRate: dismissedSR
      }
    );

    // 2. Automatically announce incoming new batsman in commentary box
    const remainingPartner = batsmen.find(b => !b.isOut && b.name.toLowerCase() !== finalBatsmanName.toLowerCase() && b.name.toLowerCase() !== dismissedBatter.name.toLowerCase());
    const incomingBatsmanAnnouncement = createBatsmanAnnouncement(
      finalBatsmanName,
      formatOvers(inn.ballsBowled),
      {
        partnerName: remainingPartner?.name,
        dismissedBatterName: dismissedBatter.name,
        isWicketFall: !isRetiredHurt,
        isRetiredHurt: isRetiredHurt
      }
    );

    const gullyWktReactions = [
      "The fielding side goes absolutely ecstatic!", "Spectacular fielding brings the breakthrough!",
      "Crowd is dead silent as the premium batsman walks back.", "Middle stump is flying!",
      "An absolute peach of a delivery!", "Street party erupted!", "What a sensational catch near the boundary line!"
    ];
    const rdWktReact = gullyWktReactions[Math.floor(Math.random() * gullyWktReactions.length)];
    const catchDetails = replay.wicketType === 'Caught' && replay.fielderName
      ? `c ${replay.fielderName} b ${detailedBowler} (Catch taken cleanly by ${replay.fielderName})`
      : `Dismissal style: ${detailedHowOut} (Bowler: ${detailedBowler})`;

    let deliveryWinProb: any = undefined;
    try {
      const metrics = calculateWinProbabilityDetails(nextMatchState);
      if (metrics) {
        deliveryWinProb = {
          teamA: metrics.teamAName,
          teamB: metrics.teamBName,
          probA: metrics.probA,
          probB: metrics.probB,
          favoredTeam: metrics.favoredTeamName,
          favoredProbability: metrics.favoredProbability
        };
      }
    } catch (e) {
      console.warn('Win prob calculation skipped in wicket:', e);
    }
    
    const commentaryDescription = isRetiredHurt
      ? `RETIRED HURT: ${dismissedBatter.name} has retired hurt (${dismissedBatter.runs} off ${dismissedBatter.balls}b). ${finalBatsmanName} takes the crease.`
      : `OUT! ${dismissedBatter.name} has to walk back (${dismissedBatter.runs} off ${dismissedBatter.balls}b). ${catchDetails}. After wicket fell, ${finalBatsmanName} new batsman come on crease. ${rdWktReact}${overCompletionSuffix}`;

    const wktHi = isRetiredHurt
      ? `रिटायर्ड हर्ट: ${dismissedBatter.name} चोटिल होकर मैदान से बाहर गए हैं (${dismissedBatter.runs} रन, ${dismissedBatter.balls} गेंद). ${finalBatsmanName} नए बल्लेबाज क्रीज पर आए हैं.`
      : generateLocalizedCricketCommentary('wicket', 0, dismissedBatter.name, detailedBowler, 'hi', { newBatsman: finalBatsmanName, winProbability: deliveryWinProb });

    const wktMr = isRetiredHurt
      ? `रिटायर्ड हर्ट: ${dismissedBatter.name} दुखापतीमुळे मैदानाबाहेर गेले आहेत (${dismissedBatter.runs} धावा, ${dismissedBatter.balls} चेंडू). ${finalBatsmanName} नवीन फलंदाज क्रीजवर आले आहेत.`
      : generateLocalizedCricketCommentary('wicket', 0, dismissedBatter.name, detailedBowler, 'mr', { newBatsman: finalBatsmanName, winProbability: deliveryWinProb });

    let localizedEnWithProb = commentaryDescription;
    if (!isRetiredHurt && deliveryWinProb && deliveryWinProb.teamA && deliveryWinProb.teamB) {
      const pA = Math.round(deliveryWinProb.probA ?? 50);
      const pB = Math.round(deliveryWinProb.probB ?? 50);
      localizedEnWithProb += ` [AI Win Probability: ${deliveryWinProb.teamA} ${pA}% | ${deliveryWinProb.teamB} ${pB}%]`;
    }

    const deliveryCommId = `c-${Date.now()}`;
    const normalWicketComm = {
      id: deliveryCommId,
      overBall: formatOvers(inn.ballsBowled),
      description: localizedEnWithProb,
      type: isRetiredHurt ? ('announcement' as const) : ('wicket' as const),
      specialEvent: isRetiredHurt ? ('retire_hurt' as const) : undefined,
      translations: {
        en: localizedEnWithProb,
        hi: `${wktHi}${overCompletionSuffix}`,
        mr: `${wktMr}${overCompletionSuffix}`
      }
    };

    // Exactly ONE delivery commentary item is added (no duplicate wicketSpecial.commentary)
    const newEntries = [
      incomingBatsmanAnnouncement,
      ...(hatTrickSpecial ? [hatTrickSpecial.commentary] : []),
      normalWicketComm
    ];

    inn.commentaryList = [
      ...newEntries,
      ...inn.commentaryList
    ];

    nextMatchState.freeHitNext = false;
    if (!isRetiredHurt) {
      nextMatchState.lastBallResult = 'W';
    }

    if (!isRetiredHurt) {
      // Auto-trigger animated fullscreen wicket blast overlay
      nextMatchState.overlayConfig = {
        ...(nextMatchState.overlayConfig || {}),
        manualAlertTrigger: {
          type: 'wicket',
          timestamp: Date.now()
        },
        customBanner: 'out',
        customBannerText: wicketSpecial.bannerTitle
      };
    } else {
      nextMatchState.overlayConfig = {
        ...(nextMatchState.overlayConfig || {}),
        customBanner: 'drinks',
        customBannerText: wicketSpecial.bannerTitle
      };
    }

    if (!isRetiredHurt) {
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
    }

    if (match.currentInningsNum === 1) {
      nextMatchState.innings1 = inn;
    } else {
      nextMatchState.innings2 = inn;
    }

    nextMatchState = checkMatchEndCondition(nextMatchState);

    // Requirement 5: Over finished and bowling change commentary after wicket delivery completing an over
    if (
      !isRetiredHurt &&
      inn.ballsBowled > 0 &&
      inn.ballsBowled % 6 === 0 &&
      nextMatchState.status !== 'completed' &&
      nextMatchState.currentInningsNum === (match.currentInningsNum || 1)
    ) {
      const completedOverNo = Math.floor(inn.ballsBowled / 6);
      let nextBowlerCandidate = '';
      if (inn.bowlers.length > 1) {
        const nextBwIdx = (inn.currentBowlerIndex + 1) % inn.bowlers.length;
        nextBowlerCandidate = inn.bowlers[nextBwIdx]?.name || '';
      }
      if (!nextBowlerCandidate) {
        const bowlSquad = (inn.bowlingTeam === nextMatchState.teamA ? selectedTeamARoster : selectedTeamBRoster) || [];
        if (bowlSquad.length > 1) {
          nextBowlerCandidate = bowlSquad[1];
        } else {
          nextBowlerCandidate = `Bowler ${inn.bowlers.length + 1}`;
        }
      }
      const overFinishComm = createOverFinishedAndBowlerChangeAnnouncement(
        completedOverNo,
        nextBowlerCandidate,
        formatOvers(inn.ballsBowled)
      );
      const activeInningsKey = nextMatchState.currentInningsNum === 1 ? 'innings1' : 'innings2';
      if (nextMatchState[activeInningsKey]) {
        nextMatchState[activeInningsKey] = {
          ...nextMatchState[activeInningsKey]!,
          commentaryList: [overFinishComm, ...(nextMatchState[activeInningsKey]!.commentaryList || [])]
        };
      }
    }

    syncMatch(nextMatchState);

    // Auto-clear wicket banner in overlayConfig after 5 seconds so it doesn't stay permanently stuck
    setTimeout(() => {
      syncMatch(prev => {
        if (!prev) return prev;
        const latest = prev.overlayConfig;
        if (latest && (latest.customBanner === 'out' || latest.customBanner === 'drinks' || latest.manualAlertTrigger?.type === 'wicket')) {
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
    }, 5000);

    // AI Commentary trigger in background if enabled
    if (aiCommentaryEnabled && !isSpectator) {
      generateAICommentary(
        nextMatchState,
        { type: isRetiredHurt ? 'retire_hurt' : 'wicket' },
        finalBatsmanName,
        detailedBowler,
        commentaryDescription,
        match.currentInningsNum,
        {
          nonStrikerName: remainingPartner?.name,
          isNewBatsmanOnCrease: true,
          newBatsmanName: finalBatsmanName,
          specialTrigger: {
            type: isRetiredHurt ? 'retire_hurt' : 'wicket',
            batterName: dismissedBatter.name,
            batterRuns: dismissedBatter.runs,
            batterBalls: dismissedBatter.balls,
            bowlerName: detailedBowler,
            howOut: isRetiredHurt ? 'Retired Hurt' : detailedHowOut
          }
        },
        deliveryCommId
      );
    }

    setPendingWicketReplay(null);
    setNewBatsmanName('');
    showNotification(
      isRetiredHurt
        ? `🩹 ${dismissedBatter.name} retired hurt. Scoreboard updated!`
        : `🔴 ${dismissedBatter.name} dismissed via ${detailedHowOut}. Scoreboard updated!`,
      isRetiredHurt ? 'info' : 'alert'
    );
  };

  // Helper to compute Player of the Match from state
  const computeMatchPlayerOfTheMatch = (matchState: MatchState) => {
    if (!matchState || (!matchState.innings1 && !matchState.innings2)) return null;

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
      inn.batsmen?.forEach(b => {
        if (!b.name) return;
        const p = getOrCreatePlayer(b.name);
        p.runs += (b.runs || 0);
        p.balls += (b.balls || 0);
        p.fours += (b.fours || 0);
        p.sixes += (b.sixes || 0);
      });
      inn.bowlers?.forEach(bw => {
        if (!bw.name) return;
        const p = getOrCreatePlayer(bw.name);
        p.wickets += (bw.wickets || 0);
        p.runsConceded += (bw.runsConceded || 0);
        p.maidens += (bw.maidens || 0);
        p.ballsBowled += (bw.ballsBowled || 0);
      });
    };

    processInnings(matchState.innings1);
    processInnings(matchState.innings2);

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
  };

  // Evaluates Match Statuses & switches innings automatically
  const checkMatchEndCondition = (state: MatchState): MatchState => {
    let modifiedState = { ...state };
    
    if (modifiedState.currentInningsNum === 1) {
      const inn1 = modifiedState.innings1;
      if (!inn1) return modifiedState;

      // Innings 1 ends when max overs are bowled or all batsmen out (10 wickets, or 2 in Super Over)
      const maxBalls = modifiedState.oversLimit * 6;
      const maxWickets = modifiedState.isSuperOver ? (modifiedState.superOverWicketLimit || 2) : 10;
      if (inn1.ballsBowled >= maxBalls || inn1.wickets >= maxWickets) {
        // Automatic complete Innings 1, set target
        const targetRunsValue = inn1.runs + 1;
        modifiedState.targetRuns = targetRunsValue;
        
        // Requirement 6: after inning finish add inning summary in ai commentary
        const innSummaryComm = createInningsSummaryCommentary(inn1, modifiedState.oversLimit);
        // Requirement 7: after inning finish add inning run chase equation in ai commentary
        const chaseEquationComm = createRunChaseEquationCommentary(
          inn1.bowlingTeam,
          inn1.battingTeam,
          targetRunsValue,
          modifiedState.oversLimit
        );

        inn1.commentaryList = [
          chaseEquationComm,
          innSummaryComm,
          ...(inn1.commentaryList || [])
        ];
        modifiedState.innings1 = inn1;
        
        const innTitle = modifiedState.isSuperOver
          ? `⚡ Super Over ${modifiedState.superOverNumber || 1} Innings 1 Completed!`
          : `Innings 1 Completed!`;
        showNotification(`${innTitle} ${inn1.battingTeam} scored ${inn1.runs}/${inn1.wickets}. Target for ${inn1.bowlingTeam}: ${targetRunsValue} runs.`, 'success');
        
        // Load custom team rosters if they exist
        const chasedBatRoster = inn1.bowlingTeam === modifiedState.teamA ? selectedTeamARoster : selectedTeamBRoster;
        const chasedBowlRoster = inn1.battingTeam === modifiedState.teamA ? selectedTeamARoster : selectedTeamBRoster;

        const chBatsman1Name = (chasedBatRoster && chasedBatRoster.length > 0) ? chasedBatRoster[0] : `${inn1.bowlingTeam} Batter 1`;
        const chBatsman2Name = (chasedBatRoster && chasedBatRoster.length > 1) ? chasedBatRoster[1] : `${inn1.bowlingTeam} Batter 2`;
        const chBowler1Name = (chasedBowlRoster && chasedBowlRoster.length > 0) ? chasedBowlRoster[0] : `${inn1.battingTeam} Bowler 1`;

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
            { 
              id: `c-${Date.now()}`, 
              overBall: '0.0', 
              description: modifiedState.isSuperOver 
                ? `⚡ Super Over ${modifiedState.superOverNumber || 1} Chase! ${chBatsman1Name} & ${chBatsman2Name} open chase for ${inn1.bowlingTeam}. Target: ${targetRunsValue} runs in 6 balls.`
                : `Innings 2 Started! ${chBatsman1Name} and ${chBatsman2Name} new batsman are come on crease and ${chBowler1Name} will bowl the first over. Target: ${targetRunsValue} runs in ${modifiedState.oversLimit} overs.`, 
              type: 'milestone' 
            },
            chaseEquationComm,
            innSummaryComm
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
      const maxWickets = modifiedState.isSuperOver ? (modifiedState.superOverWicketLimit || 2) : 10;

      // Scenarios for chase completion
      const chaseSuccessful = inn2.runs >= target;
      const batInningsEnded = inn2.ballsBowled >= maxBalls || inn2.wickets >= maxWickets;

      let isMatchFinished = false;

      if (chaseSuccessful) {
        modifiedState.status = 'completed';
        modifiedState.winner = inn2.battingTeam;
        const wicketsMargin = maxWickets - inn2.wickets;
        modifiedState.winReason = modifiedState.isSuperOver
          ? `won in Super Over ${modifiedState.superOverNumber || 1} by ${wicketsMargin} wicket${wicketsMargin > 1 ? 's' : ''}`
          : `won by ${wicketsMargin} wicket${wicketsMargin > 1 ? 's' : ''}`;
        isMatchFinished = true;
      } else if (batInningsEnded && inn2.runs < target - 1) {
        modifiedState.status = 'completed';
        modifiedState.winner = inn2.bowlingTeam;
        const runsMargin = target - 1 - inn2.runs;
        modifiedState.winReason = modifiedState.isSuperOver
          ? `won in Super Over ${modifiedState.superOverNumber || 1} by ${runsMargin} run${runsMargin > 1 ? 's' : ''}`
          : `won by ${runsMargin} run${runsMargin > 1 ? 's' : ''}`;
        isMatchFinished = true;
      } else if (batInningsEnded && inn2.runs === target - 1) {
        modifiedState.status = 'completed';
        modifiedState.winner = 'Tie';
        modifiedState.winReason = modifiedState.isSuperOver 
          ? `Super Over ${modifiedState.superOverNumber || 1} ended in a thrilling Tie!`
          : 'The match ended in a thrilling Tie!';
        isMatchFinished = true;
      }

      if (isMatchFinished) {
        // Compute Player of the Match & store in match state
        const potm = computeMatchPlayerOfTheMatch(modifiedState);
        if (potm) {
          modifiedState.playerOfTheMatch = {
            name: potm.name,
            runs: potm.runs,
            balls: potm.balls,
            wickets: potm.wickets,
            runsConceded: potm.runsConceded,
            points: potm.points
          };
        }

        // Requirement 1: after match winning add match result in ai commentary and also add the player of the match name in the ai commentary.also add their match summary
        const matchWinComm = createMatchWinningCommentary(modifiedState, potm);
        inn2.commentaryList = [
          matchWinComm,
          ...(inn2.commentaryList || [])
        ];
        modifiedState.innings2 = inn2;

        saveMatchToHistory(modifiedState);
      }
    }

    return modifiedState;
  };

  // --- SUPER OVER & TIE RESOLUTION HANDLERS ---
  const handleStartSuperOver = (firstBattingTeamOverride?: string) => {
    pushStateToUndoStack(match);

    let nextMatchState: MatchState = { ...match };

    // If starting the 1st Super Over, archive regular match innings
    if (!nextMatchState.isSuperOver) {
      if (nextMatchState.innings1 && nextMatchState.innings2) {
        nextMatchState.mainMatchState = {
          innings1: JSON.parse(JSON.stringify(nextMatchState.innings1)),
          innings2: JSON.parse(JSON.stringify(nextMatchState.innings2)),
          oversLimit: nextMatchState.oversLimit,
          targetRuns: nextMatchState.targetRuns,
          status: 'completed',
          winner: 'Tie',
          winReason: nextMatchState.winReason || 'Match tied in regular overs'
        };
      }
    } else {
      // If continuing from a tied Super Over, archive previous super over
      const history = [...(nextMatchState.superOversHistory || [])];
      if (nextMatchState.innings1) {
        history.push({
          superOverNumber: nextMatchState.superOverNumber || 1,
          innings1: JSON.parse(JSON.stringify(nextMatchState.innings1)),
          innings2: nextMatchState.innings2 ? JSON.parse(JSON.stringify(nextMatchState.innings2)) : null,
          targetRuns: nextMatchState.targetRuns,
          winner: 'Tie',
          winReason: `Super Over ${nextMatchState.superOverNumber || 1} tied`
        });
      }
      nextMatchState.superOversHistory = history;
    }

    const nextSuperOverNumber = (nextMatchState.superOverNumber || 0) + 1;

    // Rule 3: Who Bats First: The team that batted second in the main match bats first in the Super Over.
    // For subsequent super overs: The team that batted second in previous super over bats first.
    let batFirstTeam = '';
    if (firstBattingTeamOverride) {
      batFirstTeam = firstBattingTeamOverride;
    } else if (!nextMatchState.isSuperOver) {
      // Team that batted second in main match
      const mainInn2Batting = nextMatchState.innings2?.battingTeam;
      batFirstTeam = mainInn2Batting || nextMatchState.teamB;
    } else {
      // Subsequent Super Over: team that batted second in previous super over bats first
      const prevInn2Batting = nextMatchState.innings2?.battingTeam;
      batFirstTeam = prevInn2Batting || (nextMatchState.innings1?.battingTeam === nextMatchState.teamA ? nextMatchState.teamB : nextMatchState.teamA);
    }

    const bowlFirstTeam = (batFirstTeam === nextMatchState.teamA) ? nextMatchState.teamB : nextMatchState.teamA;

    // Rosters
    const batRoster = batFirstTeam === nextMatchState.teamA ? selectedTeamARoster : selectedTeamBRoster;
    const bowlRoster = bowlFirstTeam === nextMatchState.teamA ? selectedTeamARoster : selectedTeamBRoster;

    const b1 = (batRoster && batRoster[0]) || `${batFirstTeam} Batter 1`;
    const b2 = (batRoster && batRoster[1]) || `${batFirstTeam} Batter 2`;
    const bw = (bowlRoster && bowlRoster[0]) || `${bowlFirstTeam} Bowler 1`;

    const initialSuperOverInn1: Innings = {
      battingTeam: batFirstTeam,
      bowlingTeam: bowlFirstTeam,
      runs: 0,
      wickets: 0,
      ballsBowled: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
      batsmen: [
        { name: b1, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
        { name: b2, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
      ],
      bowlers: [
        { name: bw, ballsBowled: 0, maidens: 0, runsConceded: 0, wickets: 0, isCurrent: true }
      ],
      strikerIndex: 0,
      nonStrikerIndex: 1,
      currentBowlerIndex: 0,
      fallOfWickets: [],
      commentaryList: [
        {
          id: `so-${Date.now()}`,
          overBall: '0.0',
          description: `⚡ SUPER OVER ${nextSuperOverNumber} INITIATED! ${batFirstTeam} bats first against ${bowlFirstTeam}. Rules: 1 Over (6 legal deliveries), 2 Wickets Limit.`,
          type: 'milestone'
        }
      ],
      history: [
        { over: 0, overStr: '0.0', cumulativeRuns: 0, cumulativeWickets: 0 }
      ]
    };

    nextMatchState.isSuperOver = true;
    nextMatchState.superOverNumber = nextSuperOverNumber;
    nextMatchState.superOverWicketLimit = 2; // Rule 2: 2 wickets limit
    nextMatchState.oversLimit = 1; // Rule 1: 1 over per side (6 legal deliveries)
    nextMatchState.currentInningsNum = 1;
    nextMatchState.innings1 = initialSuperOverInn1;
    nextMatchState.innings2 = null;
    nextMatchState.targetRuns = undefined;
    nextMatchState.status = 'live';
    nextMatchState.winner = undefined;
    nextMatchState.winReason = undefined;
    nextMatchState.tieResolution = 'super_over';
    nextMatchState.freeHitNext = false;
    nextMatchState.lastBallResult = undefined;

    syncMatch(nextMatchState);
    setShowTieResolutionModal(false);
    showNotification(`⚡ Super Over ${nextSuperOverNumber} Started! ${batFirstTeam} batting first.`, 'success');
  };

  const handleDeclareOfficialTie = () => {
    pushStateToUndoStack(match);
    const nextMatchState: MatchState = {
      ...match,
      status: 'completed',
      winner: 'Tie',
      winReason: match.isSuperOver 
        ? `Official Tie declared after Super Over ${match.superOverNumber || 1} tied.`
        : 'Official Tie declared by Match Referee.',
      tieResolution: 'declared_tie'
    };
    syncMatch(nextMatchState);
    saveMatchToHistory(nextMatchState);
    setShowTieResolutionModal(false);
    showNotification('Official Tie declared and recorded in records.', 'alert');
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

      const innSummaryComm = createInningsSummaryCommentary(inn1, nextMatchState.oversLimit);
      const chaseEquationComm = createRunChaseEquationCommentary(
        inn1.bowlingTeam,
        inn1.battingTeam,
        targetRunsValue,
        nextMatchState.oversLimit
      );

      inn1.commentaryList = [
        chaseEquationComm,
        innSummaryComm,
        ...(inn1.commentaryList || [])
      ];
      nextMatchState.innings1 = inn1;

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
          { id: `c-${Date.now()}`, overBall: '0.0', description: `Innings declared. ${chBatsman1Name} and ${chBatsman2Name} new batsman are come on crease and ${chBowler1Name} will bowl the first over. Target: ${targetRunsValue} runs.`, type: 'milestone' },
          chaseEquationComm,
          innSummaryComm
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
        nextMatchState.winReason = nextMatchState.isSuperOver 
          ? `won in Super Over ${nextMatchState.superOverNumber || 1}!` 
          : 'won in declared innings!';
      } else if (inn2.runs === target - 1) {
        nextMatchState.winner = 'Tie';
        nextMatchState.winReason = nextMatchState.isSuperOver 
          ? `Super Over ${nextMatchState.superOverNumber || 1} ended in a thrilling Tie!` 
          : 'Match ended in a thrilling Tie!';
      } else {
        nextMatchState.winner = inn2.bowlingTeam;
        nextMatchState.winReason = nextMatchState.isSuperOver 
          ? `won in Super Over ${nextMatchState.superOverNumber || 1}!` 
          : `won by declaration forfeit (Margin: ${target - 1 - inn2.runs} runs)`;
      }

      const potm = computeMatchPlayerOfTheMatch(nextMatchState);
      if (potm) {
        nextMatchState.playerOfTheMatch = {
          name: potm.name,
          runs: potm.runs,
          balls: potm.balls,
          wickets: potm.wickets,
          runsConceded: potm.runsConceded,
          points: potm.points
        };
      }
      const matchWinComm = createMatchWinningCommentary(nextMatchState, potm);
      inn2.commentaryList = [matchWinComm, ...(inn2.commentaryList || [])];
      nextMatchState.innings2 = inn2;

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

  // Active Match Routing System: Set a specific match as the ONE ACTIVE LIVE MATCH for this manager
  const handleSetActiveLiveMatch = async (targetMatch: MatchState) => {
    try {
      const matchIdToActivate = targetMatch.id;
      if (!matchIdToActivate) return;
      setIsActivatingLiveMatch(true);

      // 1. Prepare updated target match state
      const updatedMatch: MatchState = {
        ...targetMatch,
        status: 'live',
        managerId: currentManagerId,
        streamKey: streamKey,
        updatedAt: Date.now()
      };

      // 2. Update local React state, registry, and active match cache
      unmarkMatchDeleted(matchIdToActivate);
      saveMatchToRegistry(updatedMatch);
      setActiveMatch(updatedMatch);
      latestStateToSaveRef.current = updatedMatch;
      setMatch(updatedMatch);
      setSearchParams({ matchId: matchIdToActivate });

      // 3. Mark old live matches in local state as completed (only 1 match active per user)
      setActiveLiveMatches(prev => {
        const others = prev.filter(m => m.id !== matchIdToActivate).map(m => ({
          ...m,
          status: 'completed' as const,
          updatedAt: Date.now()
        }));
        return [updatedMatch, ...others];
      });

      // 4. Update Firestore directly
      if (!isFirestoreQuotaExhausted()) {
        try {
          // A) Save target match as 'live'
          await safeSetDoc(doc(db, 'cricket_matches', matchIdToActivate), sanitizeForFirestore(updatedMatch));

          // B) Update manager active pointer document in score_managers
          const managerDocRef = doc(db, 'score_managers', currentManagerId);
          await safeSetDoc(managerDocRef, {
            managerId: currentManagerId,
            managerName: currentManagerName,
            streamKey: streamKey,
            activeMatchId: matchIdToActivate,
            status: 'live',
            activeMatchSummary: {
              id: matchIdToActivate,
              teamA: updatedMatch.teamA,
              teamB: updatedMatch.teamB,
              oversLimit: updatedMatch.oversLimit
            },
            updatedAt: Date.now()
          }, { merge: true });

          // C) If there is also a streamKey, write pointer under streamKey as well
          if (streamKey) {
            safeSetDoc(doc(db, 'score_managers', streamKey), {
              managerId: currentManagerId,
              streamKey: streamKey,
              activeMatchId: matchIdToActivate,
              status: 'live',
              updatedAt: Date.now()
            }, { merge: true }).catch(() => {});
          }

          // D) Retire any existing matches in Firestore for this manager that were 'live'
          if (activeLiveMatches && activeLiveMatches.length > 0) {
            for (const oldM of activeLiveMatches) {
              if (oldM.id !== matchIdToActivate && oldM.status === 'live') {
                safeSetDoc(doc(db, 'cricket_matches', oldM.id), {
                  status: 'completed',
                  updatedAt: Date.now()
                }, { merge: true }).catch(() => {});
              }
            }
          }
        } catch (fErr) {
          console.warn('[Active Match] Firestore direct write error:', fErr);
        }
      }

      // 5. Call backend reconciliation endpoint /api/cricket/set-active-match
      try {
        fetch('/api/cricket/set-active-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            managerId: currentManagerId,
            matchId: matchIdToActivate,
            streamKey: streamKey,
            matchData: updatedMatch ? sanitizeForFirestore(updatedMatch) : undefined
          })
        }).catch(() => {});
      } catch (_) {}

      showNotification(`🔴 Match "${updatedMatch.teamA} vs ${updatedMatch.teamB}" is now LIVE on your permanent OBS overlay!`, 'success');
    } catch (err: any) {
      console.error('Failed to set active live match:', err);
      showNotification('Error activating live match: ' + (err.message || 'Unknown error'), 'alert');
    } finally {
      setIsActivatingLiveMatch(false);
    }
  };

  // Complete a match and put permanent overlay on standby
  const handleSetMatchCompleted = async (matchIdToComplete: string) => {
    try {
      // 1. Update in local React state
      setMatch(prev => {
        if (prev.id === matchIdToComplete) {
          const completed: MatchState = {
            ...prev,
            status: 'completed',
            updatedAt: Date.now()
          };
          saveMatchToRegistry(completed);
          saveMatchToHistory(completed);
          return completed;
        }
        return prev;
      });

      // 2. Remove from activeLiveMatches list
      setActiveLiveMatches(prev => prev.filter(m => m.id !== matchIdToComplete));

      // 3. Update Firestore
      if (!isFirestoreQuotaExhausted()) {
        safeSetDoc(doc(db, 'cricket_matches', matchIdToComplete), {
          status: 'completed',
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});

        const managerDocRef = doc(db, 'score_managers', currentManagerId);
        safeSetDoc(managerDocRef, {
          activeMatchId: null,
          status: 'completed',
          updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
      }

      // 4. Call server endpoint
      try {
        fetch('/api/cricket/complete-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            managerId: currentManagerId,
            matchId: matchIdToComplete
          })
        }).catch(() => {});
      } catch (_) {}

      showNotification('Match marked as COMPLETED. Permanent OBS overlay is now on standby mode.', 'info');
    } catch (err: any) {
      console.error('Failed to mark match completed:', err);
    }
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
        { id: `c-${Date.now()}`, overBall: '0.0', description: `Draft Match Created: ${teamA.trim()} vs ${teamB.trim()}`, type: 'milestone' }
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
      teamALogo: teamALogoUrl || match?.teamALogo || null,
      teamBLogo: teamBLogoUrl || match?.teamBLogo || null,
      matchBannerUrl: matchBannerUrl || match?.matchBannerUrl || undefined,
      teamASquad: selectedTeamARoster,
      teamBSquad: selectedTeamBRoster,
      playerPhotos: match?.playerPhotos || {},
      tournamentId: match?.tournamentId || null,
      tournamentMatchId: match?.tournamentMatchId || null,
      tournamentName: tournamentName || null,
      seriesName: seriesName || 'Bilateral Series',
      groundName: groundName || 'Gully Ground',
      createdBy: currentManagerId || user?.email || user?.uid || 'anonymous',
      managerId: currentManagerId || undefined,
      managerName: currentManagerName || undefined,
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
      captainName: newTeamCaptainName.trim(),
      players: playersList,
      status: 'ready',
      createdAt: new Date().toISOString(),
      updatedAt: Date.now()
    };

    if (isFirestoreQuotaExhausted()) {
      setSavedTeams(prev => {
        const next = [...prev.filter(t => t.id !== teamId), newTeam];
        try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
        return next;
      });
      showNotification(`Team "${newTeam.name}" saved locally!`, 'success');
      setNewTeamName('');
      setNewTeamCaptainName('');
      setNewTeamPlayersText('');
      setEditingTeamId(null);
      return;
    }

    try {
      await safeSetDoc(doc(db, 'cricket_teams', teamId), newTeam);
      showNotification(`Team "${newTeam.name}" ${editingTeamId ? 'updated' : 'saved'} successfully!`, 'success');
      setNewTeamName('');
      setNewTeamCaptainName('');
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
        setNewTeamCaptainName('');
        setNewTeamPlayersText('');
        setEditingTeamId(null);
      } else {
        handleFirestoreError(err, OperationType.WRITE, `cricket_teams/${teamId}`);
      }
    }
  };

  // Generate a shareable link for captain to submit 15-player squad
  const handleGenerateCaptainInvite = async () => {
    if (!captainInviteTeamName.trim()) {
      showNotification('Please enter a Team Name to generate a Captain Squad link!', 'alert');
      return;
    }
    const teamId = `team-${Date.now()}`;
    const newTeam: CricketTeam = {
      id: teamId,
      name: captainInviteTeamName.trim(),
      captainName: captainInviteCaptainName.trim(),
      captainPhone: captainInvitePhone.trim(),
      players: [],
      status: 'pending_squad',
      createdAt: new Date().toISOString(),
      updatedAt: Date.now()
    };

    try {
      if (!isFirestoreQuotaExhausted()) {
        await safeSetDoc(doc(db, 'cricket_teams', teamId), newTeam);
      }
      setSavedTeams(prev => [newTeam, ...prev.filter(t => t.id !== teamId)]);
    } catch (e) {
      console.warn('Saved captain team locally:', e);
      setSavedTeams(prev => [newTeam, ...prev.filter(t => t.id !== teamId)]);
    }

    const link = `${window.location.origin}${window.location.pathname}#/cricket-captain-squad/${teamId}`;
    setGeneratedCaptainLink(link);
    showNotification(`Captain link created for "${newTeam.name}"! Share via WhatsApp or Copy.`, 'success');
  };

  const getCaptainSquadLink = (tId: string) => {
    return `${window.location.origin}${window.location.pathname}#/cricket-captain-squad/${tId}`;
  };

  const handleShareCaptainWhatsApp = (t: CricketTeam) => {
    const link = getCaptainSquadLink(t.id);
    const text = encodeURIComponent(
      `🏏 *Gully Score Live Match Squad Invitation*\n` +
      `Team: *${t.name}*\n` +
      `Hey Captain! Please submit your 15-player match squad here so we can load your team onto the live scoreboard in 1-click:\n\n` +
      `${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // One-click load a team's roster into Team A or Team B
  const handleOneClickLoadTeam = (team: CricketTeam, target: 'A' | 'B') => {
    if (target === 'A') {
      setTeamA(team.name);
      if (team.logo) {
        setTeamALogoUrl(team.logo);
        setMatch(prev => ({ ...prev, teamALogo: team.logo }));
      }
      if (team.players && team.players.length > 0) {
        setSelectedTeamARoster(team.players);
      }
      showNotification(`⚡ Loaded "${team.name}" (${team.players?.length || 0} players) for Team A!`, 'success');
    } else {
      setTeamB(team.name);
      if (team.logo) {
        setTeamBLogoUrl(team.logo);
        setMatch(prev => ({ ...prev, teamBLogo: team.logo }));
      }
      if (team.players && team.players.length > 0) {
        setSelectedTeamBRoster(team.players);
      }
      showNotification(`⚡ Loaded "${team.name}" (${team.players?.length || 0} players) for Team B!`, 'success');
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

  // Render Tie Resolution Modal (Option A: Super Over, Option B: Official Tie)
  const renderTieResolutionModal = () => {
    if (!showTieResolutionModal) return null;

    const inn1 = match.mainMatchState?.innings1 || match.innings1;
    const inn2 = match.mainMatchState?.innings2 || match.innings2;

    // Rule 3: The team that batted second in the main match bats first in the Super Over
    const teamBattedSecondInMain = match.mainMatchState?.innings2?.battingTeam || match.innings2?.battingTeam || match.teamB;
    const otherTeamInMain = teamBattedSecondInMain === match.teamA ? match.teamB : match.teamA;

    // For subsequent Super Overs: the team that chased in the previous Super Over bats first
    const defaultBatFirstTeam = match.isSuperOver
      ? (match.innings2?.battingTeam || otherTeamInMain)
      : teamBattedSecondInMain;

    const batFirstTeam = superOverBatFirstOverride || defaultBatFirstTeam;
    const nextSuperOverNum = (match.superOverNumber || 0) + 1;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl text-white relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Glowing background accents */}
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={() => setShowTieResolutionModal(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-none cursor-pointer transition-colors z-10"
            title="Close modal (Options remain accessible via header banner)"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest">
              <span className="animate-ping inline-block w-2 h-2 rounded-full bg-amber-400"></span>
              {match.isSuperOver ? `⚡ Super Over ${match.superOverNumber || 1} Tied` : '🏆 Match Ended in a Tie'}
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              {match.isSuperOver ? `Super Over ${match.superOverNumber || 1} Tied!` : 'Scores Are Level! Match Tied!'}
            </h2>

            {inn1 && inn2 && (
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs font-mono font-bold text-slate-300">
                <span>{inn1.battingTeam}: <strong className="text-amber-400">{inn1.runs}/{inn1.wickets}</strong></span>
                <span className="text-slate-600">vs</span>
                <span>{inn2.battingTeam}: <strong className="text-emerald-400">{inn2.runs}/{inn2.wickets}</strong></span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-lg mx-auto">
              {match.isSuperOver
                ? "Subsequent Super Overs are played consecutively until a definitive winner is found under ICC Men's T20 World Cup regulations."
                : "Scores are level! Please select the official match resolution to proceed:"}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* OPTION A: SUPER OVER */}
            <div className="bg-gradient-to-b from-amber-500/15 via-slate-850 to-slate-900 border-2 border-amber-500/60 hover:border-amber-400 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl relative transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-md">
                    Option A • Decisive
                  </span>
                  <span className="text-amber-400 font-black text-xs">⚡ Eliminator</span>
                </div>

                <div>
                  <h3 className="text-lg font-black uppercase text-amber-300 flex items-center gap-2">
                    <span>⚡</span> {match.isSuperOver ? `Play Super Over ${nextSuperOverNum}` : 'Super Over Option'}
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    A decisive 1-over eliminator played under official ICC T20 World Cup Super Over rules.
                  </p>
                </div>

                {/* 4 Official Rules */}
                <div className="p-3 bg-slate-950/70 border border-amber-500/25 rounded-xl space-y-2 text-[10.5px]">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">1.</span>
                    <span className="text-slate-200">
                      <strong>One Over Per Side:</strong> Each team faces exactly <strong>6 legal deliveries</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">2.</span>
                    <span className="text-slate-200">
                      <strong>Wicket Limit:</strong> Each team can only lose <strong>2 wickets</strong>. Innings ends immediately upon 2nd wicket.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">3.</span>
                    <span className="text-slate-200">
                      <strong>Who Bats First:</strong> The team that batted second in {match.isSuperOver ? 'previous Super Over' : 'main match'} (<strong className="text-amber-300">{batFirstTeam}</strong>) bats first.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0">4.</span>
                    <span className="text-slate-200">
                      <strong>Tied Super Over?</strong> Subsequent Super Overs are played consecutively until a definitive winner is found (boundary countback scrapped).
                    </span>
                  </div>
                </div>

                {/* Batting order confirmation */}
                <div className="flex items-center justify-between p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Batting First:</span>
                    <span className="font-extrabold text-amber-300">{batFirstTeam}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const switched = batFirstTeam === match.teamA ? match.teamB : match.teamA;
                      setSuperOverBatFirstOverride(switched);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer border border-slate-700 transition-colors"
                  >
                    ⇄ Switch Order
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartSuperOver(batFirstTeam)}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>{match.isSuperOver ? `Start Super Over ${nextSuperOverNum}` : 'Start Super Over (Option A)'}</span>
              </button>
            </div>

            {/* OPTION B: DECLARED TIE */}
            <div className="bg-gradient-to-b from-slate-800/40 via-slate-850 to-slate-900 border-2 border-slate-700/60 hover:border-slate-600 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl relative transition-all">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 font-black text-[9px] uppercase tracking-widest rounded-md">
                    Option B • Equal Split
                  </span>
                  <span className="text-slate-400 font-black text-xs">🤝 Shared Points</span>
                </div>

                <div>
                  <h3 className="text-lg font-black uppercase text-slate-200 flex items-center gap-2">
                    <span>🤝</span> Declare Official Tie
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Conclude the match immediately as an official Tie without playing a Super Over.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-[10.5px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Result officially registered as a <strong>Tie</strong>.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Points split equally between both teams.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Individual batting and bowling scorecards preserved.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Match moves to completed past records.</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDeclareOfficialTie}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🤝</span>
                <span>Declare Official Tie (Option B)</span>
              </button>
            </div>

          </div>

          {/* Footer note */}
          <div className="mt-4 text-center text-[10px] text-slate-400">
            <span>ICC Men's T20 Playing Conditions • Boundary countback rule scrapped</span>
          </div>
        </motion.div>
      </div>
    );
  };

  // early return for live cricket scoreboard scoring pad (100vh viewport constraint)
  const isScoringDisabled = isInningsLocked || match.status === 'completed';

  if ((match.status === 'live' || (match.status === 'completed' && match.winner === 'Tie' && match.tieResolution !== 'declared_tie')) && currentInnings && !isSpectator) {
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
            {/* Scorer Identity Badge */}
            {isScoreManager && currentManagerId && (
              <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-800/90 border border-emerald-500/30 rounded-lg text-[9px] font-bold text-emerald-400 shrink-0">
                <ShieldIcon size={10} className="text-amber-300" />
                <span className="text-slate-400">Scorer:</span>
                <span className="font-mono text-emerald-300">@{currentManagerId}</span>
              </div>
            )}

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
                    setEditModalMatchBannerUrl(match.matchBannerUrl || '');
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

        {/* Persistent Tie Resolution Alert Banner in Cockpit */}
        {match.winner === 'Tie' && match.tieResolution !== 'declared_tie' && (
          <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 px-3 py-2 flex items-center justify-between gap-2 shadow-lg shrink-0 select-none z-20 border-b border-amber-400">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg animate-bounce shrink-0">⚡</span>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider block leading-tight text-slate-950 truncate">
                  {match.isSuperOver ? `Super Over ${match.superOverNumber || 1} Ended in a Tie!` : 'Scores Are Level! Match Ended in a Tie!'}
                </span>
                <span className="text-[10px] font-bold text-slate-900 block leading-tight">
                  Choose resolution: Play Super Over {match.isSuperOver ? (match.superOverNumber || 1) + 1 : ''} (Option A) or Declare Official Tie (Option B)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowTieResolutionModal(true)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-[10px] uppercase tracking-wider rounded-xl shadow cursor-pointer border border-amber-400 transition-all"
              >
                ⚡ {match.isSuperOver ? `Super Over ${(match.superOverNumber || 1) + 1}` : 'Super Over (Opt A)'}
              </button>
              <button
                type="button"
                onClick={handleDeclareOfficialTie}
                className="px-3 py-1.5 bg-white/40 hover:bg-white/60 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer border border-black/20 transition-all"
              >
                🤝 Declare Tie (Opt B)
              </button>
            </div>
          </div>
        )}

        {/* Super Over Active Status Bar in Cockpit */}
        {match.isSuperOver && (
          <div className="bg-slate-900 border-b border-amber-500/40 px-3 py-1.5 flex items-center justify-between text-[10px] text-amber-300 font-bold shrink-0 shadow-inner">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[8.5px] uppercase tracking-widest rounded-md shadow-xs animate-pulse">
                ⚡ SUPER OVER {match.superOverNumber || 1}
              </span>
              <span className="text-slate-300 font-extrabold uppercase tracking-wide">
                Innings {match.currentInningsNum} of 2
              </span>
              {match.targetRuns && (
                <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-black text-[9px] rounded-md">
                  Target: {match.targetRuns} runs
                </span>
              )}
            </div>
            <div className="font-mono text-slate-300 flex items-center gap-3 text-[10px]">
              <span>Balls: <strong className="text-white">{currentInnings.ballsBowled}/6</strong></span>
              <span className="h-3 w-px bg-slate-700" />
              <span>Wickets: <strong className="text-amber-400">{currentInnings.wickets}/2 Max</strong></span>
            </div>
          </div>
        )}

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
            <div className="flex-1 overflow-y-auto lg:overflow-hidden min-h-0 p-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2 custom-scrollbar">
          
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
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center text-[10px] font-bold text-amber-300 space-y-1">
                  <div className="text-[7.5px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1">
                    ⚡ Run Chase Equation
                  </div>
                  {match.targetRuns - currentInnings.runs > 0 ? (
                    <div>Need <strong className="font-black text-xs text-white font-mono">{match.targetRuns - currentInnings.runs}</strong> runs to win off <strong className="font-black text-xs text-white font-mono">{Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)}</strong> balls</div>
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
                  { id: 'batsman_bowler_brush', label: 'Batter & Bowler Pro' },
                  { id: 'player_profile_card', label: 'Player Profile Pro' },
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
                    <div className="grid grid-cols-4 gap-1 mb-2 bg-slate-950 p-1 rounded-xl shrink-0">
                      {[
                        { id: 'alerts', label: '🚀 Alerts' },
                        { id: 'graphics', label: '📊 Display' },
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
                                  id: 'batsman_bowler_brush',
                                  label: 'Batter & Bowler Pro (Image 1)',
                                  desc: 'Slanted stats, paint brush splatter, team crest & bowler banner',
                                  isActive: ['batsman_bowler_brush', 'batsman_bowler_broadcast', 'brush_batsman_bowler', 'image_batsman_bowler', 'batsman_bowler_pro'].includes(currentActiveGraphic),
                                  onToggle: () => updateOverlayProp({ activeGraphic: ['batsman_bowler_brush', 'batsman_bowler_broadcast', 'brush_batsman_bowler', 'image_batsman_bowler', 'batsman_bowler_pro'].includes(currentActiveGraphic) ? 'none' : 'batsman_bowler_brush' })
                                },
                                {
                                  id: 'player_profile_card',
                                  label: 'Player Profile Pro (Image 2)',
                                  desc: 'Virat Kohli style star profile with giant typography & icon stats',
                                  isActive: ['player_profile_card', 'player_profile_pro', 'player_profile_kohli', 'virat_profile', 'player_profile'].includes(currentActiveGraphic),
                                  onToggle: () => updateOverlayProp({ activeGraphic: ['player_profile_card', 'player_profile_pro', 'player_profile_kohli', 'virat_profile', 'player_profile'].includes(currentActiveGraphic) ? 'none' : 'player_profile_card' })
                                },
                                {
                                  id: 'individual_stats',
                                  label: 'Individual Batting & Bowling Stats',
                                  desc: 'Live dynamic batting & bowling statistics alongside main scoreboard with timer auto-close',
                                  isActive: ['individual_stats', 'player_stats', 'individual_batting_bowling'].includes(currentActiveGraphic),
                                  onToggle: () => updateOverlayProp({ activeGraphic: ['individual_stats', 'player_stats', 'individual_batting_bowling'].includes(currentActiveGraphic) ? 'none' : 'individual_stats' })
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

                          {/* Pre-Match & Toss Cards (The Build-Up) Room */}
                          <div className="space-y-1.5 bg-gradient-to-br from-blue-950/20 via-slate-950/40 to-slate-950/20 p-2.5 border border-sky-500/20 rounded-2xl">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest block">
                                Pre-Match & Toss Cards (The Build-Up)
                              </span>
                              <span className="text-[6.5px] font-mono text-sky-300/60 uppercase">
                                Broadcast Preshow
                              </span>
                            </div>
                            
                            <div className="space-y-1.5">
                              {[
                                {
                                  id: 'prematch_matchup',
                                  label: 'The Matchup Card',
                                  desc: 'Split full-screen or large lower-third: team logos, tournament branding & match details',
                                  icon: '⚔️',
                                  isActive: currentActiveGraphic === 'prematch_matchup',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'prematch_matchup' ? 'none' : 'prematch_matchup' })
                                },
                                {
                                  id: 'toss_result',
                                  label: 'Toss Result Card',
                                  desc: 'Official toss winner & election: e.g. MUMBAI WON THE TOSS & ELECTED TO BAT FIRST',
                                  icon: '🪙',
                                  isActive: currentActiveGraphic === 'toss_result',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'toss_result' ? 'none' : 'toss_result' })
                                },
                                {
                                  id: 'pitch_weather_report',
                                  label: 'Pitch & Weather Report',
                                  desc: 'Pitch conditions (Dry, Grass cover, Cracks) and overhead weather/temperature conditions',
                                  icon: '🌤️',
                                  isActive: currentActiveGraphic === 'pitch_weather_report',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'pitch_weather_report' ? 'none' : 'pitch_weather_report' })
                                }
                              ].map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-slate-950/80 border border-sky-500/10 hover:border-sky-500/30 rounded-xl transition-all">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-xs shrink-0">
                                      {item.icon}
                                    </div>
                                    <div className="text-left min-w-0">
                                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-100 block truncate leading-none">{item.label}</span>
                                      <span className="text-[6.5px] text-slate-400 block font-mono truncate leading-normal">{item.desc}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded leading-none ${item.isActive ? 'bg-sky-500 text-slate-950 font-black animate-pulse' : 'bg-slate-900 text-slate-500'}`}>
                                      {item.isActive ? 'ON AIR' : 'STANDBY'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        item.onToggle();
                                        showNotification(`Pre-match broadcast: ${item.label}`, 'info');
                                      }}
                                      className={`w-7 h-4 rounded-full p-0.5 transition-all relative border-none cursor-pointer outline-none flex items-center ${
                                        item.isActive ? 'bg-sky-500' : 'bg-slate-800'
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

                          {/* Full-Screen Overlays (Match Transitions) Room */}
                          <div className="space-y-1.5 bg-gradient-to-br from-amber-950/20 via-slate-950/40 to-slate-950/20 p-2.5 border border-amber-500/20 rounded-2xl">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block">
                                Full-Screen Overlays (Match Transitions)
                              </span>
                              <span className="text-[6.5px] font-mono text-amber-300/60 uppercase">
                                Broadcast TV Breaks
                              </span>
                            </div>
                            
                            <div className="space-y-1.5">
                              {[
                                {
                                  id: 'team_lineups',
                                  label: 'Both Squads / Playing XI (Gold TV Overlay)',
                                  desc: "Both teams' playing 11, team logos, VS emblem & tournament banner in 3D Gold TV overlay",
                                  icon: '👥',
                                  isActive: currentActiveGraphic === 'team_lineups' || currentActiveGraphic === 'both_squads',
                                  onToggle: () => updateOverlayProp({ activeGraphic: (currentActiveGraphic === 'team_lineups' || currentActiveGraphic === 'both_squads') ? 'none' : 'team_lineups' })
                                },
                                {
                                  id: 'innings_scorecard',
                                  label: 'Innings Scorecard',
                                  desc: 'Detailed breakdown: all batsmen, dismissals, scores, extras & bowling',
                                  icon: '📋',
                                  isActive: currentActiveGraphic === 'innings_scorecard',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'innings_scorecard' ? 'none' : 'innings_scorecard' })
                                },
                                {
                                  id: 'match_presentation',
                                  label: 'Match Presentation / Results',
                                  desc: 'Final summary: winner, margin of victory & Player of the Match card',
                                  icon: '🏆',
                                  isActive: currentActiveGraphic === 'match_presentation',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'match_presentation' ? 'none' : 'match_presentation' })
                                },
                                {
                                  id: 'tournament_standings',
                                  label: 'Tournament Standings / Points Table',
                                  desc: 'Full-screen table: group rankings, points, matches played & Net Run Rate',
                                  icon: '📊',
                                  isActive: currentActiveGraphic === 'tournament_standings',
                                  onToggle: () => updateOverlayProp({ activeGraphic: currentActiveGraphic === 'tournament_standings' ? 'none' : 'tournament_standings' })
                                }
                              ].map(item => (
                                <div key={item.id} className="flex items-center justify-between p-2 bg-slate-950/80 border border-amber-500/10 hover:border-amber-500/30 rounded-xl transition-all">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs shrink-0">
                                      {item.icon}
                                    </div>
                                    <div className="text-left min-w-0">
                                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-100 block truncate leading-none">{item.label}</span>
                                      <span className="text-[6.5px] text-slate-400 block font-mono truncate leading-normal">{item.desc}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded leading-none ${item.isActive ? 'bg-amber-500 text-slate-950 font-black animate-pulse' : 'bg-slate-900 text-slate-500'}`}>
                                      {item.isActive ? 'ON AIR' : 'STANDBY'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        item.onToggle();
                                        showNotification(`Broadcast transition: ${item.label}`, 'info');
                                      }}
                                      className={`w-7 h-4 rounded-full p-0.5 transition-all relative border-none cursor-pointer outline-none flex items-center ${
                                        item.isActive ? 'bg-amber-500' : 'bg-slate-800'
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

                      {/* --- THEME TAB --- */}
                      {activeControlTab === 'templates' && (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pick Active Theme Template</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { id: 'slanted-pro-design', label: '🖼️ Slanted Pro Design' },
                                { id: 'score-bug-1900-200', label: '🎮 Vintage Retro (1900x200)' }
                              ].map(t => {
                                const isThemeActive = activeOverlayConfig.template === t.id || (t.id === 'slanted-pro-design' && !['slanted-pro-design', 'score-bug-1900-200'].includes(activeOverlayConfig.template));
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
                        </div>
                      )}

                      {/* --- MEDIA TAB --- */}
                      {activeControlTab === 'media' && (
                        <div className="space-y-3 font-sans pb-4">
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
                                          compressImageFile(file, 256, 256, 0.75).then((compressed) => {
                                            if (compressed) {
                                              setMatch(prev => ({ ...prev, teamALogo: compressed }));
                                              showNotification(`Saved ${match.teamA} logo branding!`, 'success');
                                            }
                                          });
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
                                          compressImageFile(file, 256, 256, 0.75).then((compressed) => {
                                            if (compressed) {
                                              setMatch(prev => ({ ...prev, teamBLogo: compressed }));
                                              showNotification(`Saved ${match.teamB} logo branding!`, 'success');
                                            }
                                          });
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
                                                  compressImageFile(file, 180, 180, 0.72).then((compressed) => {
                                                    if (compressed) {
                                                      setMatch(prev => {
                                                        const currentPhotos = prev.playerPhotos || {};
                                                        return {
                                                          ...prev,
                                                          playerPhotos: {
                                                            ...currentPhotos,
                                                            [lookupKey]: compressed
                                                          }
                                                        };
                                                      });
                                                      showNotification(`Saved photo for ${playerName}`, 'success');
                                                    }
                                                  });
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
          <div className={`flex flex-col gap-2 min-h-0 overflow-y-auto lg:overflow-visible custom-scrollbar ${
            activeMobileTab === 'scorer' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-5 pb-3`}>
            
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

                      <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-800/60 gap-1.5">
                        <span className="text-[8.5px] font-mono text-slate-500">{st.fours}x4 / {st.sixes}x6</span>
                        <div className="flex items-center gap-1.5">
                          <div className="text-right">
                            <strong className="text-sm font-black text-emerald-400 font-mono leading-none">{st.runs}</strong>
                            <span className="text-slate-450 text-[9px] ml-0.5 font-mono">({st.balls}b)</span>
                          </div>
                          {!isSpectator && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isScoringDisabled}
                                onClick={() => openRetireHurtModal('striker')}
                                className="px-1.5 py-1 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-black text-[7.5px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                title="Retire Hurt (Injury)"
                              >
                                🩹 RETD
                              </button>
                              <button
                                type="button"
                                disabled={isScoringDisabled}
                                id="btn-striker-out-quick"
                                onClick={() => openWicketModal('striker')}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-[8px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                title="Dismiss Striker (Wicket / Out)"
                              >
                                🔴 OUT
                              </button>
                            </div>
                          )}
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

                      <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-800/60 gap-1.5">
                        <span className="text-[8.5px] font-mono text-slate-505">{nst.fours}x4 / {nst.sixes}x6</span>
                        <div className="flex items-center gap-1.5">
                          <div className="text-right">
                            <strong className="text-sm font-black text-slate-205 font-mono leading-none">{nst.runs}</strong>
                            <span className="text-slate-450 text-[9px] ml-0.5 font-mono">({nst.balls}b)</span>
                          </div>
                          {!isSpectator && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isScoringDisabled}
                                onClick={() => openRetireHurtModal('non-striker')}
                                className="px-1.5 py-1 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-black text-[7.5px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                title="Retire Hurt (Injury)"
                              >
                                🩹 RETD
                              </button>
                              <button
                                type="button"
                                disabled={isScoringDisabled}
                                id="btn-nonstriker-out-quick"
                                onClick={() => openWicketModal('non-striker')}
                                className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-black text-[8px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                title="Dismiss Non-Striker (Run Out / Mankad)"
                              >
                                🔴 OUT
                              </button>
                            </div>
                          )}
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
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between relative overflow-visible min-h-0 shadow-lg select-none">
              
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

                {/* EXTRAS CHOOSE: Wide, No Ball & Quick Wicket - h-11 provides 44px compliant touch area */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => {
                      setExtraRunsBallType('wide');
                      setShowExtraRunsModal(true);
                    }}
                    className="h-11 flex flex-col items-center justify-center bg-purple-950 border border-purple-800/45 hover:bg-purple-900 rounded-xl font-black cursor-pointer text-white transition-all active:scale-95 text-xs"
                  >
                    <span className="leading-none font-extrabold">+1 WIDE</span>
                    <span className="text-[6.5px] text-purple-400 font-semibold mt-0.5 truncate max-w-full px-0.5">Re-bowls</span>
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    onClick={() => {
                      setExtraRunsBallType('noball');
                      setShowExtraRunsModal(true);
                    }}
                    className="h-11 flex flex-col items-center justify-center bg-amber-955 border border-amber-800/45 hover:bg-amber-900 rounded-xl font-black cursor-pointer text-white transition-all active:scale-95 text-xs"
                  >
                    <span className="leading-none font-extrabold">+1 NO BALL</span>
                    <span className="text-[6.5px] text-amber-400 font-semibold mt-0.5 truncate max-w-full px-0.5">Free hit</span>
                  </button>
                  <button
                    disabled={isScoringDisabled}
                    id="btn-quick-wicket"
                    onClick={() => openWicketModal('striker')}
                    className="h-11 flex flex-col items-center justify-center bg-rose-600 hover:bg-rose-500 border border-rose-400/50 rounded-xl font-black cursor-pointer text-white transition-all active:scale-95 text-xs shadow"
                  >
                    <span className="leading-none font-extrabold flex items-center gap-1">
                      <AlertCircle size={11} /> 🔴 WICKET
                    </span>
                    <span className="text-[6.5px] text-rose-100 font-semibold mt-0.5">Dismiss Out</span>
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
                    onClick={() => openWicketModal('striker')}
                    className="h-12 w-full flex items-center justify-center bg-rose-600 hover:bg-rose-500 rounded-xl font-black text-xs uppercase uppercase tracking-wider text-white gap-2 transition-all cursor-pointer border-none animate-pulse active:scale-95 shadow-lg"
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
                <div className="flex bg-slate-950 p-0.5 rounded-lg flex-wrap gap-0.5">
                  <button
                    onClick={() => setActiveScorecardTab('bat')}
                    className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                      activeScorecardTab === 'bat' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                    }`}
                  >
                    Batting
                  </button>
                  <button
                    onClick={() => setActiveScorecardTab('bowl')}
                    className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                      activeScorecardTab === 'bowl' ? 'bg-emerald-600 text-white font-black' : 'text-slate-400 bg-transparent'
                    }`}
                  >
                    Bowling
                  </button>
                  <button
                    onClick={() => setActiveScorecardTab('fow')}
                    className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                      activeScorecardTab === 'fow' ? 'bg-rose-600 text-white font-black' : 'text-slate-400 bg-transparent'
                    }`}
                  >
                    FoW {currentInnings.fallOfWickets?.length > 0 ? `(${currentInnings.fallOfWickets.length})` : ''}
                  </button>
                  <button
                    onClick={() => setActiveScorecardTab('comm')}
                    className={`px-3 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                      activeScorecardTab === 'comm' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 bg-transparent'
                    }`}
                  >
                    Commentary ({currentInnings.commentaryList?.length || 0})
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8.5px] font-black text-slate-500 uppercase tracking-widest">
                    {activeScorecardTab === 'bat' ? 'BATSMAN REGISTRY' : activeScorecardTab === 'bowl' ? 'BOWLER FIGURES' : activeScorecardTab === 'comm' ? 'AI COMMENTARY' : 'FALL OF WICKETS'}
                  </span>
                  {(activeScorecardTab === 'fow' || activeScorecardTab === 'bat') && (
                    <button
                      onClick={() => openWicketModal('striker')}
                      disabled={isScoringDisabled}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider border-none cursor-pointer transition-all flex items-center gap-1 shadow active:scale-95"
                    >
                      <PlusCircle size={10} />
                      Add Wicket
                    </button>
                  )}
                </div>
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
                            <td className="py-2 text-left font-semibold truncate max-w-[120px]">
                              <div className="flex items-center gap-1.5 justify-between pr-1">
                                <span className="truncate">{b.name} {isStriker ? '★' : ''}</span>
                                {!isSpectator && !b.isOut && (isStriker || isNonStriker) && (
                                  <button
                                    type="button"
                                    onClick={() => openWicketModal(isStriker ? 'striker' : 'non-striker')}
                                    className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[7.5px] font-black uppercase rounded border-none cursor-pointer transition-all shrink-0 active:scale-95"
                                    title={`Dismiss ${b.name} (Wicket)`}
                                  >
                                    Out
                                  </button>
                                )}
                              </div>
                              <p className="text-[7px] text-slate-500 truncate lowercase italic mt-0.5 leading-none">{b.howOut || 'not out'}</p>
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
                ) : activeScorecardTab === 'bowl' ? (
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
                ) : (
                  /* Fall of Wickets Card View */
                  <div className="space-y-2 font-sans">
                    <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800">
                      <span className="text-[9px] font-black uppercase text-slate-400">Chronological Dismissals</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const nextWktNo = (currentInnings.fallOfWickets?.length || 0) + 1;
                            setManualFoWData({
                              wicketNo: nextWktNo,
                              score: currentInnings.runs,
                              batsmanName: currentInnings.batsmen[currentInnings.strikerIndex]?.name || '',
                              oversList: formatOvers(currentInnings.ballsBowled)
                            });
                            setShowManualFoWModal(true);
                          }}
                          className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[8px] font-bold uppercase cursor-pointer border-none"
                        >
                          Manual +
                        </button>
                        <button
                          type="button"
                          onClick={() => openWicketModal('striker')}
                          disabled={isScoringDisabled}
                          className="px-2.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center gap-1 shadow"
                        >
                          <PlusCircle size={10} />
                          + Add Wicket
                        </button>
                      </div>
                    </div>

                    {(!currentInnings.fallOfWickets || currentInnings.fallOfWickets.length === 0) ? (
                      <div className="py-6 text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          No wickets fallen yet in this innings
                        </p>
                        <button
                          type="button"
                          onClick={() => openWicketModal('striker')}
                          disabled={isScoringDisabled}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer border-none shadow transition-all inline-flex items-center gap-1"
                        >
                          <PlusCircle size={11} /> Record First Wicket
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {currentInnings.fallOfWickets.map((fw, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-md font-mono font-black text-[9px]">
                                Wkt {fw.wicketNo}
                              </span>
                              <div>
                                <p className="font-bold text-white text-[11px] leading-tight">{fw.batsmanName}</p>
                                <p className="text-[9px] font-mono text-slate-400">
                                  at <strong className="text-amber-300">{fw.score}</strong> runs • Over {fw.oversList}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setManualFoWData({
                                    wicketNo: fw.wicketNo,
                                    score: fw.score,
                                    batsmanName: fw.batsmanName,
                                    oversList: fw.oversList,
                                    editIndex: idx
                                  });
                                  setShowManualFoWModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-white bg-slate-900 rounded border-none cursor-pointer"
                                title="Edit Fall of Wicket Entry"
                              >
                                <Edit size={11} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFoW(idx)}
                                className="p-1 text-rose-400 hover:text-rose-300 bg-slate-900 rounded border-none cursor-pointer"
                                title="Remove Entry"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => openWicketModal('striker')}
                          disabled={isScoringDisabled}
                          className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-dashed border-rose-500/40 rounded-xl text-rose-400 hover:text-rose-300 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <PlusCircle size={12} />
                          + Add Wicket Dismissal
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Commentary feed with user selected language */}
                {activeScorecardTab === 'comm' && (
                  <div className="flex-1 flex flex-col min-h-0 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black uppercase text-slate-400">Language:</span>
                        {(['mr', 'hi', 'en'] as const).map(l => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setUserCommentaryLang(l)}
                            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-all border-none cursor-pointer ${
                              userCommentaryLang === l
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white bg-slate-950'
                            }`}
                          >
                            {l === 'mr' ? '🚩 मराठी' : l === 'hi' ? '🇮🇳 हिंदी' : '🌐 English'}
                          </button>
                        ))}
                      </div>
                      <span className="text-[8px] font-mono text-slate-400">
                        {currentInnings.commentaryList?.length || 0} entries
                      </span>
                    </div>

                    {/* Contextual Tone Shifter Banner */}
                    {(() => {
                      const matchTone = getMatchContextualTone(match, currentInnings);
                      return <ContextualToneShifterBadge toneInfo={matchTone} language={userCommentaryLang} />;
                    })()}

                    {/* Predictive Win Probability Commentary inside AI Commentary */}
                    <WinProbabilityCard
                      match={match}
                      userLanguage={userCommentaryLang}
                      className="border-slate-800 bg-slate-900/90 text-slate-100 my-1"
                    />

                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin max-h-[300px]">
                      {(!currentInnings.commentaryList || currentInnings.commentaryList.length === 0) ? (
                        <p className="text-center text-xs text-slate-500 py-8 italic">No commentary yet for this innings.</p>
                      ) : (
                        currentInnings.commentaryList.map((comm) => {
                          const isWkt = comm.type === 'wicket';
                          const isBnd = comm.type === 'boundary';
                          const isExt = comm.type === 'extra';
                          const isMilestone = comm.type === 'milestone' || !!comm.specialEvent;
                          const isAnnouncement = !!comm.announcementType;
                          const displayText = getCommentaryText(comm, userCommentaryLang);

                          return (
                            <div
                              key={comm.id}
                              className={`p-2 rounded-xl text-[10.5px] border transition-all ${
                                comm.specialEvent === 'hundred' ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-amber-500/5' :
                                comm.specialEvent === 'fifty' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-emerald-500/5' :
                                comm.specialEvent === 'hat_trick' ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 shadow-rose-500/5' :
                                isAnnouncement ? 'bg-sky-500/10 border-sky-500/30 text-sky-200' :
                                isWkt ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                                isBnd ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                                isExt ? 'bg-sky-500/10 border-sky-500/20 text-sky-300' :
                                isMilestone ? 'bg-purple-500/10 border-purple-500/30 text-purple-200' :
                                'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1 gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[8.5px] font-bold text-slate-400">
                                    Over {comm.overBall}
                                  </span>
                                  {comm.specialEvent && (
                                    <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                                      comm.specialEvent === 'hundred' ? 'bg-amber-400 text-black' :
                                      comm.specialEvent === 'fifty' ? 'bg-emerald-400 text-black' :
                                      comm.specialEvent === 'hat_trick' ? 'bg-rose-500 text-white animate-pulse' :
                                      'bg-rose-400 text-black'
                                    }`}>
                                      {comm.specialEvent === 'hundred' ? '👑 CENTURY' :
                                       comm.specialEvent === 'fifty' ? '🌟 HALF-CENTURY' :
                                       comm.specialEvent === 'hat_trick' ? '🔥 HAT-TRICK' :
                                       '⚡ WICKET'}
                                    </span>
                                  )}
                                  {comm.announcementType && (
                                    <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-sky-500/30 text-sky-300 border border-sky-500/40">
                                      {comm.announcementType === 'new_batsman' ? '🏏 NEW BATSMAN' : '🎯 NEW BOWLER'}
                                    </span>
                                  )}
                                </div>
                                {comm.type && comm.type !== 'normal' && !comm.specialEvent && !comm.announcementType && (
                                  <span className="text-[7.5px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-white/10">
                                    {comm.type}
                                  </span>
                                )}
                              </div>
                              <p className="leading-snug font-sans">{displayText}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
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

              <div className="font-sans flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setFallOfWicketModal(null);
                    setTimeout(() => {
                      openWicketModal('striker');
                    }, 50);
                  }}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all border-none shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <AlertCircle size={14} />
                  + Add Next Wicket
                </button>
                <button
                  type="button"
                  onClick={() => setFallOfWicketModal(null)}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all border-none shadow-md shadow-emerald-950/40 active:scale-95"
                >
                  Continue Scoring
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Fall of Wickets entry & adjustment modal */}
        {showManualFoWModal && currentInnings && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-950/80 select-none">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-500" />
                    {manualFoWData.editIndex !== undefined ? 'Edit Fall of Wicket' : 'Add Fall of Wicket Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Reconcile wicket sequence, score & over details</p>
                </div>
                <button
                  onClick={() => setShowManualFoWModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Wicket #</label>
                    <input
                      type="number"
                      min={1}
                      max={11}
                      value={manualFoWData.wicketNo}
                      onChange={(e) => setManualFoWData({ ...manualFoWData, wicketNo: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Score at Dismissal</label>
                    <input
                      type="number"
                      min={0}
                      value={manualFoWData.score}
                      onChange={(e) => setManualFoWData({ ...manualFoWData, score: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Dismissed Batsman Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Batsman name"
                    value={manualFoWData.batsmanName}
                    onChange={(e) => setManualFoWData({ ...manualFoWData, batsmanName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Over Bowled (e.g. 4.2)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4.2"
                    value={manualFoWData.oversList}
                    onChange={(e) => setManualFoWData({ ...manualFoWData, oversList: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setShowManualFoWModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualFoW}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase border-none cursor-pointer shadow-lg shadow-rose-900/30"
                >
                  Save Wicket Entry
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
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
                      {(['Bowled', 'Caught', 'Run Out', 'Stumped', 'LBW', 'Retired Hurt'] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setWicketType(mode);
                            if (mode === 'Caught') {
                              const bName = wicketBowlerName.trim() || (currentInnings?.bowlers?.[currentInnings.currentBowlerIndex]?.name || 'Bowler');
                              const cName = wicketFielderName.trim();
                              setWicketHowOutDetails(cName ? (cName.toLowerCase() === bName.toLowerCase() ? `c & b ${bName}` : `c ${cName} b ${bName}`) : `Caught`);
                            } else if (mode === 'Retired Hurt') {
                              setWicketHowOutDetails('Retired Hurt');
                              setWicketAdditionalDetails('Retired Hurt (Injured)');
                            } else {
                              setWicketHowOutDetails(mode);
                            }
                          }}
                          className={`py-1.5 rounded text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                            wicketType === mode ? (mode === 'Retired Hurt' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white') : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {mode === 'Retired Hurt' ? '🩹 Retired' : mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Who took the catch / Fielder selector */}
                  {(wicketType === 'Caught' || wicketType === 'Run Out' || wicketType === 'Stumped') && (
                    <div className="p-3 bg-slate-950/90 border border-emerald-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[8px] font-black text-emerald-400 uppercase tracking-widest block leading-none">
                          {wicketType === 'Caught' ? 'Who took the catch? (Catcher Name)' : 'Fielder Name (Run Out / Stumping)'}
                        </label>
                        {wicketType === 'Caught' && (
                          <button
                            type="button"
                            onClick={() => {
                              const bName = wicketBowlerName.trim() || (currentInnings?.bowlers?.[currentInnings.currentBowlerIndex]?.name || 'Bowler');
                              setWicketFielderName(bName);
                              setWicketHowOutDetails(`c & b ${bName}`);
                            }}
                            className="text-[8px] font-black uppercase text-amber-400 hover:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded cursor-pointer transition-all"
                          >
                            🎯 Caught & Bowled (c & b)
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={wicketFielderName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWicketFielderName(val);
                          if (wicketType === 'Caught') {
                            const bName = wicketBowlerName.trim() || (currentInnings?.bowlers?.[currentInnings.currentBowlerIndex]?.name || 'Bowler');
                            if (val.trim()) {
                              setWicketHowOutDetails(val.trim().toLowerCase() === bName.toLowerCase() ? `c & b ${bName}` : `c ${val.trim()} b ${bName}`);
                            } else {
                              setWicketHowOutDetails('Caught');
                            }
                          }
                        }}
                        placeholder={wicketType === 'Caught' ? "Player name who took the catch" : "Fielder or keeper name"}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold outline-none text-white focus:border-emerald-500 placeholder:text-slate-500"
                      />
                      {(() => {
                        if (!currentInnings) return null;
                        const bowlingTeam = currentInnings.battingTeam === match.teamA ? match.teamB : match.teamA;
                        const bowlingRoster = bowlingTeam === match.teamA ? selectedTeamARoster : selectedTeamBRoster;
                        if (!bowlingRoster || bowlingRoster.length === 0) return null;
                        return (
                          <div className="flex flex-wrap gap-1 mt-1 items-center">
                            <span className="text-[7.5px] text-slate-400 font-extrabold uppercase py-0.5 select-none font-sans">Quick Select Fielder:</span>
                            {bowlingRoster.slice(0, 11).map((player, idx) => (
                              <button
                                key={`dismissal-fielder-chip-${player}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setWicketFielderName(player);
                                  if (wicketType === 'Caught') {
                                    const bName = wicketBowlerName.trim() || (currentInnings?.bowlers?.[currentInnings.currentBowlerIndex]?.name || 'Bowler');
                                    setWicketHowOutDetails(player.toLowerCase() === bName.toLowerCase() ? `c & b ${bName}` : `c ${player} b ${bName}`);
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-[8px] uppercase font-black tracking-widest border transition-all cursor-pointer ${
                                  wicketFielderName.toLowerCase() === player.toLowerCase()
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                                    : 'bg-slate-800 hover:bg-emerald-500/20 text-slate-300 border-slate-700'
                                }`}
                              >
                                {player}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

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
                      placeholder={`Default: Batsman ${(currentInnings?.batsmen?.length || 0) + 1}`}
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

                  {/* Match Banner Option (1280x720) */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#a1a1aa] block">
                        Match Banner (1280 × 720 HD)
                      </label>
                      <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        16:9 Spectator Banner
                      </span>
                    </div>

                    {editModalMatchBannerUrl ? (
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md group">
                        <img 
                          src={editModalMatchBannerUrl} 
                          alt="Match Banner" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditModalMatchBannerUrl('')}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-md"
                          >
                            Remove Banner
                          </button>
                        </div>
                        <span className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-mono text-emerald-400">
                          1280 × 720 Active
                        </span>
                      </div>
                    ) : (
                      <div className="aspect-[16/9] w-full rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center p-3 text-center">
                        <span className="text-xl mb-1">🖼️</span>
                        <span className="text-[10px] font-bold text-slate-400">No match banner set</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Upload a 1280x720 banner for spectator screen</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="relative overflow-hidden inline-block flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            id="edit-modal-banner-file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                processMatchBannerFile(file, (dataUrl) => {
                                  setEditModalMatchBannerUrl(dataUrl);
                                });
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <label 
                            htmlFor="edit-modal-banner-file"
                            className="w-full block py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 text-center font-bold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer border border-slate-700/60 transition-colors"
                          >
                            📁 Upload Banner (1280×720)
                          </label>
                        </div>
                        {editModalMatchBannerUrl && (
                          <button
                            type="button"
                            onClick={() => setEditModalMatchBannerUrl('')}
                            className="px-2.5 py-2 bg-slate-850 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-xl text-[10px] font-bold border border-slate-800 cursor-pointer"
                            title="Clear Banner"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder="Or paste banner image URL (https://...)"
                        value={editModalMatchBannerUrl}
                        onChange={(e) => setEditModalMatchBannerUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-medium text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

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

        {/* Tie Resolution Modal (Option A: Super Over, Option B: Official Tie) */}
        {renderTieResolutionModal()}

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


            {match.innings1 && (
              <button
                onClick={handleExportMatchPDF}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none text-white shadow-sm"
              >
                <FileDown size={13} />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}

            {match.status !== 'setup' && (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none text-white shadow-sm"
              >
                <Clock size={13} />
                {showHistory ? 'Close Logs' : 'Past Matches'}
              </button>
            )}

            {/* Small Permanent OBS Overlay Link Icon near Past Matches - Always Available on all screens including Setup */}
            <button
              type="button"
              onClick={() => {
                const overlayUrl = getPermanentOverlayUrl(currentManagerId, streamKey);
                copyToClipboard(overlayUrl).then(() => {
                  setCopiedOverlayLink(true);
                  setTimeout(() => setCopiedOverlayLink(false), 2500);
                  showNotification('Overlay link copied!', 'success');
                });
              }}
              className={`p-2 rounded-xl transition-all cursor-pointer border-none text-white relative shadow-sm flex items-center justify-center ${
                copiedOverlayLink 
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md' 
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              title={copiedOverlayLink ? "Copied overlay link!" : "Copy overlay link"}
              id="btn-top-bar-obs-link-icon"
              aria-label="Copy overlay link"
            >
              {copiedOverlayLink ? (
                <Check size={18} className="text-slate-950 font-bold" />
              ) : (
                <div className="relative flex items-center justify-center">
                  <Link2 size={18} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-pulse ring-1 ring-emerald-900" />
                </div>
              )}
            </button>

            {match.status !== 'setup' && (
              <>
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
              </>
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
              id="section-past-matches-registry"
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Score Manager Live Matches ({activeLiveMatches.length})
                    </span>
                    <button
                      onClick={() => {
                        purgeCachedAIMatches();
                        setActiveLiveMatches(prev => prev.filter(m => isMatchOwnedByCurrentManager(m)));
                        showNotification('Purged bot and cached live matches from storage', 'info');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-none"
                      title="Clear cached or unowned matches from local storage"
                    >
                      <RotateCcw size={12} />
                      <span>Purge Bot / Cached Matches</span>
                    </button>
                  </div>
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
                            {/* ACTIVE MATCH ROUTING CONTROLS */}
                            <div className="flex items-center justify-between gap-2 p-2 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-white/5">
                              {match.id === past.id && match.status === 'live' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                  <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-wider">
                                    Live on Permanent OBS
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  OBS: {past.status === 'live' ? 'Live' : 'Standby'}
                                </span>
                              )}

                              <div className="flex items-center gap-1">
                                {match.id === past.id && match.status === 'live' ? (
                                  <button
                                    onClick={() => handleSetMatchCompleted(past.id)}
                                    className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer transition-all"
                                    title="Mark match completed (Permanent OBS enters standby)"
                                  >
                                    Set Completed
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSetActiveLiveMatch(past)}
                                    className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                                    title="Switch permanent OBS overlay to stream this match"
                                  >
                                    <Radio size={9} className="text-emerald-400 animate-pulse" />
                                    <span>Stream on OBS</span>
                                  </button>
                                )}
                              </div>
                            </div>

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
              <div className="bg-slate-50 dark:bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
                  <div>
                    <h3 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Users size={15} />
                      Local Cricket Teams & 1-Click Setup
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Send a link to team captains to submit their 15-player squad, or add teams directly for instant 1-click live scoreboard setup.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTeamModalTab('invite_captain');
                        setShowTeamModal(true);
                      }}
                      className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm hover:scale-105 active:scale-95"
                    >
                      <Smartphone size={12} />
                      📲 Send Captain Link
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeamId(null);
                        setNewTeamName('');
                        setNewTeamCaptainName('');
                        setNewTeamPlayersText('');
                        setTeamModalTab('direct_add');
                        setShowTeamModal(true);
                      }}
                      className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer border-none shadow-sm hover:scale-105 active:scale-95"
                    >
                      <PlusCircle size={12} />
                      + Add Team Directly
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeamModalTab('presets');
                        setShowTeamModal(true);
                      }}
                      className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer border-none"
                    >
                      <Users size={12} />
                      Manage All ({savedTeams.length})
                    </button>
                  </div>
                </div>

                {/* 1-Click Quick Setup Roster Cards */}
                {savedTeams.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" />
                      ⚡ 1-Click Match Setup: Click to load squad into Team A or Team B
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {savedTeams.map(t => {
                        const isCaptainPending = t.status === 'pending_squad' && (!t.players || t.players.length === 0);
                        return (
                          <div 
                            key={t.id} 
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              {t.logo && (
                                <img src={t.logo} alt={t.name} className="w-8 h-8 rounded-xl object-contain bg-slate-100 dark:bg-slate-800 p-0.5 shrink-0 border border-slate-200 dark:border-slate-700" />
                              )}
                              <div className="min-w-0 flex-1">
                                <strong className="text-xs font-black text-slate-850 dark:text-white truncate block">
                                  {t.name}
                                </strong>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {t.captainName && (
                                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                      C: {t.captainName}
                                    </span>
                                  )}
                                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                    isCaptainPending
                                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                      : t.players?.length >= 11
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                  }`}>
                                    {isCaptainPending ? '⏳ Waiting Captain' : `${t.players?.length || 0} Players ✓`}
                                  </span>
                                </div>
                              </div>
                              {isCaptainPending && (
                                <button
                                  type="button"
                                  onClick={() => handleShareCaptainWhatsApp(t)}
                                  className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border-none cursor-pointer flex items-center gap-1 shrink-0"
                                  title="Share link with Captain on WhatsApp"
                                >
                                  📲 Invite
                                </button>
                              )}
                            </div>

                            {/* 1-Click Load Buttons */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleOneClickLoadTeam(t, 'A')}
                                className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-[9.5px] font-black uppercase tracking-wider border border-emerald-500/20 cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                              >
                                <Zap size={11} className="text-emerald-500" />
                                ⚡ Team A
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOneClickLoadTeam(t, 'B')}
                                className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-[9.5px] font-black uppercase tracking-wider border border-indigo-500/20 cursor-pointer flex items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                              >
                                <Zap size={11} className="text-indigo-500" />
                                ⚡ Team B
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Dropdowns for quick selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Load Team A Preset</label>
                    <select
                      onChange={(e) => {
                        const sel = savedTeams.find(t => t.id === e.target.value);
                        if (sel) {
                          setTeamA(sel.name);
                          setSelectedTeamARoster(sel.players || []);
                          showNotification(`Loaded ${sel.name} roster (${sel.players?.length || 0} players) for Team A!`, 'success');
                        } else {
                          setSelectedTeamARoster([]);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- No preset (Manual Entry) --</option>
                      {savedTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.players?.length || 0} players)</option>
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
                          setSelectedTeamBRoster(sel.players || []);
                          showNotification(`Loaded ${sel.name} roster (${sel.players?.length || 0} players) for Team B!`, 'success');
                        } else {
                          setSelectedTeamBRoster([]);
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">-- No preset (Manual Entry) --</option>
                      {savedTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.players?.length || 0} players)</option>
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                              {teamA || 'Team A'} Squad
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              selectedTeamARoster.length >= 11
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : selectedTeamARoster.length > 0
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {selectedTeamARoster.length >= 11 ? 'Playing XI Ready ✓' : `${selectedTeamARoster.length} / 11 Players`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowBulkAddTeamA(prev => !prev)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border-none cursor-pointer transition-colors"
                              title="Bulk paste player names separated by comma or new lines"
                            >
                              {showBulkAddTeamA ? 'Close' : '📋 Bulk Paste'}
                            </button>
                            {selectedTeamARoster.length === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeamARoster([
                                    'Rohit', 'Shubman', 'Virat', 'Shreyas', 'KL Rahul',
                                    'Hardik', 'Jadeja', 'Axar', 'Kuldeep', 'Bumrah', 'Siraj'
                                  ]);
                                  showNotification(`Auto-filled 11 players for ${teamA || 'Team A'}!`, 'success');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 cursor-pointer transition-colors"
                                title="Quick populate standard 11 players"
                              >
                                ⚡ Auto 11
                              </button>
                            )}
                            {selectedTeamARoster.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Clear all ${selectedTeamARoster.length} players from ${teamA || 'Team A'}?`)) {
                                    setSelectedTeamARoster([]);
                                  }
                                }}
                                className="px-1.5 py-1 text-slate-400 hover:text-rose-500 bg-transparent border-none cursor-pointer text-[9px] font-bold"
                                title="Clear squad list"
                              >
                                ✕ Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bulk Paste Box for Team A */}
                        {showBulkAddTeamA && (
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2 mb-2 animate-fadeIn">
                            <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                              Paste players from WhatsApp / Notes (comma or newline separated):
                            </span>
                            <textarea
                              value={bulkAddTeamAText}
                              onChange={(e) => setBulkAddTeamAText(e.target.value)}
                              placeholder="e.g. Rohit Sharma, Shubman Gill, Virat Kohli, KL Rahul, Hardik Pandya..."
                              rows={3}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const names = bulkAddTeamAText
                                    .split(/[\n,\t]+/)
                                    .map(s => s.trim())
                                    .filter(Boolean);
                                  if (names.length > 0) {
                                    const merged = Array.from(new Set([...selectedTeamARoster, ...names]));
                                    setSelectedTeamARoster(merged);
                                    setBulkAddTeamAText('');
                                    setShowBulkAddTeamA(false);
                                    showNotification(`Added ${merged.length - selectedTeamARoster.length} new player(s) to ${teamA || 'Team A'}!`, 'success');
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border-none cursor-pointer"
                              >
                                Add All Players
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedTeamARoster.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-2 leading-normal">
                            No players added yet. Type player name below, use 📋 Bulk Paste, or click ⚡ Auto 11.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 py-1">
                            {selectedTeamARoster.map((player, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-slate-50 dark:bg-slate-950 text-slate-750 dark:text-slate-200 rounded-lg text-[10px] font-extrabold border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all"
                              >
                                <span className="text-[8px] text-emerald-500 font-mono font-bold">#{idx + 1}</span>
                                {player}
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedTeamARoster(prev => prev.filter((_, i) => i !== idx))} 
                                  className="text-slate-400 hover:text-rose-500 bg-transparent border-none font-sans font-bold cursor-pointer text-[10px] ml-0.5 p-0 flex items-center justify-center hover:scale-125 transition-transform"
                                  title={`Remove ${player}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Single Player Direct Input for Team A */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Type player name & press Enter..."
                          id="team-a-direct-add-input"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none flex-1 text-slate-800 dark:text-white focus:ring-1 focus:ring-emerald-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                if (!selectedTeamARoster.includes(val)) {
                                  setSelectedTeamARoster(prev => [...prev, val]);
                                  showNotification(`Added ${val} to ${teamA || 'Team A'}!`, 'info');
                                } else {
                                  showNotification(`${val} is already in the squad!`, 'alert');
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
                                showNotification(`Added ${val} to ${teamA || 'Team A'}!`, 'info');
                              } else {
                                showNotification(`${val} is already in the squad!`, 'alert');
                              }
                              input.value = '';
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl px-3.5 text-[10px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center transition-all shadow-sm shrink-0"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Team B Customizer */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col justify-between shadow-sm space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                              {teamB || 'Team B'} Squad
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              selectedTeamBRoster.length >= 11
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : selectedTeamBRoster.length > 0
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                              {selectedTeamBRoster.length >= 11 ? 'Playing XI Ready ✓' : `${selectedTeamBRoster.length} / 11 Players`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setShowBulkAddTeamB(prev => !prev)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border-none cursor-pointer transition-colors"
                              title="Bulk paste player names separated by comma or new lines"
                            >
                              {showBulkAddTeamB ? 'Close' : '📋 Bulk Paste'}
                            </button>
                            {selectedTeamBRoster.length === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeamBRoster([
                                    'David Warner', 'Travis Head', 'Steve Smith', 'Mitchell Marsh', 'Glenn Maxwell',
                                    'Marcus Stoinis', 'Josh Inglis', 'Pat Cummins', 'Mitchell Starc', 'Adam Zampa', 'Josh Hazlewood'
                                  ]);
                                  showNotification(`Auto-filled 11 players for ${teamB || 'Team B'}!`, 'success');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20 cursor-pointer transition-colors"
                                title="Quick populate standard 11 players"
                              >
                                ⚡ Auto 11
                              </button>
                            )}
                            {selectedTeamBRoster.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Clear all ${selectedTeamBRoster.length} players from ${teamB || 'Team B'}?`)) {
                                    setSelectedTeamBRoster([]);
                                  }
                                }}
                                className="px-1.5 py-1 text-slate-400 hover:text-rose-500 bg-transparent border-none cursor-pointer text-[9px] font-bold"
                                title="Clear squad list"
                              >
                                ✕ Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Bulk Paste Box for Team B */}
                        {showBulkAddTeamB && (
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2 mb-2 animate-fadeIn">
                            <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                              Paste players from WhatsApp / Notes (comma or newline separated):
                            </span>
                            <textarea
                              value={bulkAddTeamBText}
                              onChange={(e) => setBulkAddTeamBText(e.target.value)}
                              placeholder="e.g. Warner, Head, Smith, Marsh, Maxwell, Cummins, Starc..."
                              rows={3}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const names = bulkAddTeamBText
                                    .split(/[\n,\t]+/)
                                    .map(s => s.trim())
                                    .filter(Boolean);
                                  if (names.length > 0) {
                                    const merged = Array.from(new Set([...selectedTeamBRoster, ...names]));
                                    setSelectedTeamBRoster(merged);
                                    setBulkAddTeamBText('');
                                    setShowBulkAddTeamB(false);
                                    showNotification(`Added ${merged.length - selectedTeamBRoster.length} new player(s) to ${teamB || 'Team B'}!`, 'success');
                                  }
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border-none cursor-pointer"
                              >
                                Add All Players
                              </button>
                            </div>
                          </div>
                        )}

                        {selectedTeamBRoster.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic py-2 leading-normal">
                            No players added yet. Type player name below, use 📋 Bulk Paste, or click ⚡ Auto 11.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1 py-1">
                            {selectedTeamBRoster.map((player, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 bg-slate-50 dark:bg-slate-950 text-slate-755 dark:text-slate-200 rounded-lg text-[10px] font-extrabold border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/30 transition-all"
                              >
                                <span className="text-[8px] text-emerald-500 font-mono font-bold">#{idx + 1}</span>
                                {player}
                                <button 
                                  type="button" 
                                  onClick={() => setSelectedTeamBRoster(prev => prev.filter((_, i) => i !== idx))} 
                                  className="text-slate-400 hover:text-rose-500 bg-transparent border-none font-sans font-bold cursor-pointer text-[10px] ml-0.5 p-0 flex items-center justify-center hover:scale-125 transition-transform"
                                  title={`Remove ${player}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Single Player Direct Input for Team B */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Type player name & press Enter..."
                          id="team-b-direct-add-input"
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold outline-none flex-1 text-slate-800 dark:text-white focus:ring-1 focus:ring-emerald-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                if (!selectedTeamBRoster.includes(val)) {
                                  setSelectedTeamBRoster(prev => [...prev, val]);
                                  showNotification(`Added ${val} to ${teamB || 'Team B'}!`, 'info');
                                } else {
                                  showNotification(`${val} is already in the squad!`, 'alert');
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
                                showNotification(`Added ${val} to ${teamB || 'Team B'}!`, 'info');
                              } else {
                                showNotification(`${val} is already in the squad!`, 'alert');
                              }
                              input.value = '';
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl px-3.5 text-[10px] font-black uppercase tracking-wider cursor-pointer border-none flex items-center justify-center transition-all shadow-sm shrink-0"
                        >
                          + Add
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
                              compressImageFile(file, 256, 256, 0.75).then((compressed) => {
                                if (compressed) {
                                  setTeamALogoUrl(compressed);
                                }
                              });
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
                              compressImageFile(file, 256, 256, 0.75).then((compressed) => {
                                if (compressed) {
                                  setTeamBLogoUrl(compressed);
                                }
                              });
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
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

              {/* Match Banner Option (1280 x 720 Widescreen) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🖼️</span>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                        Match Banner (1280 × 720 HD)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[8.5px] font-black uppercase tracking-wider">
                        16:9 Widescreen
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      This banner will be displayed in the spectator full details page and in the match card in the homepage spectator section.
                    </p>
                  </div>

                  {matchBannerUrl && (
                    <button
                      type="button"
                      onClick={() => setMatchBannerUrl('')}
                      className="self-start sm:self-auto px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={11} /> Clear Banner
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Left: Banner controls and uploaders */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="relative overflow-hidden inline-block flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          id="setup-match-banner-file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processMatchBannerFile(file, (dataUrl) => {
                                setMatchBannerUrl(dataUrl);
                                showNotification('Match banner (1280x720) loaded successfully!', 'success');
                              });
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <label
                          htmlFor="setup-match-banner-file"
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-center font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          <Camera size={14} />
                          Upload Banner (1280 × 720)
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                        Or Paste Banner Image URL
                      </label>
                      <input
                        type="url"
                        value={matchBannerUrl}
                        onChange={(e) => setMatchBannerUrl(e.target.value)}
                        placeholder="https://example.com/banner-1280x720.jpg"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>

                    {/* Quick Preset Stadium Banners */}
                    <div>
                      <span className="text-[8.5px] font-mono uppercase text-slate-400 font-bold block mb-1.5">
                        Quick Preset Banners (1280 × 720 HD):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMatchBannerUrl('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1280&h=720&q=80')}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-700 dark:text-slate-300 text-[9px] font-bold border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
                        >
                          🏟️ Stadium Floodlights
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchBannerUrl('https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?auto=format&fit=crop&w=1280&h=720&q=80')}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-700 dark:text-slate-300 text-[9px] font-bold border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
                        >
                          🏏 Green Pitch Derby
                        </button>
                        <button
                          type="button"
                          onClick={() => setMatchBannerUrl('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1280&h=720&q=80')}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-700 dark:text-slate-300 text-[9px] font-bold border border-slate-300 dark:border-slate-700 cursor-pointer transition-colors"
                        >
                          🏆 Final Championship
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: 16:9 Aspect Ratio Live Preview */}
                  <div>
                    {matchBannerUrl ? (
                      <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-500/40 shadow-lg relative group">
                        <img
                          src={matchBannerUrl}
                          alt="Match Banner Preview"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[8.5px] font-black uppercase tracking-wider">
                          1280 × 720 HD Ready
                        </div>
                        <div className="absolute bottom-2 left-3 right-3 text-white">
                          <span className="text-[9px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">
                            Match Banner Preview
                          </span>
                          <span className="text-xs font-black text-white block truncate">
                            {teamA || 'Team A'} vs {teamB || 'Team B'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-[16/9] w-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-2xl mb-1 opacity-60">🖼️</span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          1280 × 720 Banner Preview
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                          Upload an image or pick a preset to preview the 16:9 spectator banner.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Opening Batsmen & Opening Bowler Selection */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider block">
                    Opening Players (Crease & First Over)
                  </span>
                  <span className="text-[8.5px] text-slate-400 italic">Quick-tap or type custom name</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Opening Batsman 1 (Striker)</label>
                    <input
                      type="text"
                      value={setupOpeningBatsman1}
                      onChange={(e) => setSetupOpeningBatsman1(e.target.value)}
                      placeholder="e.g. Rohit"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-white"
                    />
                    {/* Quick selection chips from batting squad */}
                    {(tossChoice === 'bat' ? selectedTeamARoster : selectedTeamBRoster).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                        {(tossChoice === 'bat' ? selectedTeamARoster : selectedTeamBRoster).slice(0, 6).map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSetupOpeningBatsman1(p)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border-none cursor-pointer transition-colors ${
                              setupOpeningBatsman1 === p ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Opening Batsman 2 (Non-Striker)</label>
                    <input
                      type="text"
                      value={setupOpeningBatsman2}
                      onChange={(e) => setSetupOpeningBatsman2(e.target.value)}
                      placeholder="e.g. Shubman"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-white"
                    />
                    {/* Quick selection chips from batting squad */}
                    {(tossChoice === 'bat' ? selectedTeamARoster : selectedTeamBRoster).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                        {(tossChoice === 'bat' ? selectedTeamARoster : selectedTeamBRoster).slice(0, 6).map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSetupOpeningBatsman2(p)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border-none cursor-pointer transition-colors ${
                              setupOpeningBatsman2 === p ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-400 block mb-1">Opening Bowler (First Over)</label>
                    <input
                      type="text"
                      value={setupOpeningBowler}
                      onChange={(e) => setSetupOpeningBowler(e.target.value)}
                      placeholder="e.g. Starc"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none text-slate-800 dark:text-white"
                    />
                    {/* Quick selection chips from bowling squad */}
                    {(tossChoice === 'bat' ? selectedTeamBRoster : selectedTeamARoster).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5 max-h-16 overflow-y-auto">
                        {(tossChoice === 'bat' ? selectedTeamBRoster : selectedTeamARoster).slice(0, 6).map((p, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSetupOpeningBowler(p)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border-none cursor-pointer transition-colors ${
                              setupOpeningBowler === p ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  When the match starts, commentary will announce these opening batsmen and bowler automatically.
                </p>
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

              {/* Bottom Quick Controls: Past Matches, Audio Button, Toggle Theme Mode, Core Login */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  {/* Left: Past Matches Button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      id="btn-setup-past-matches"
                      onClick={() => {
                        setShowHistory(prev => !prev);
                        if (!showHistory) {
                          setTimeout(() => {
                            const historyEl = document.getElementById('section-past-matches-registry');
                            if (historyEl) {
                              historyEl.scrollIntoView({ behavior: 'smooth' });
                            } else {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }, 100);
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border shadow-sm ${
                        showHistory
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                      title="View Past Matches and saved logs"
                    >
                      <Clock size={15} className={showHistory ? 'text-slate-950' : 'text-amber-500'} />
                      <span>{showHistory ? 'Close Past Matches' : `Past Matches (${pastMatches.length})`}</span>
                    </button>
                  </div>

                  {/* Right: Audio button, Toggle Theme Mode, Core Login button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Audio Button */}
                    <div className="relative">
                      <button
                        type="button"
                        id="btn-setup-audio-toggle"
                        onClick={() => {
                          setSoundEnabled(prev => !prev);
                          if (soundEnabled) {
                            setShowAudioSettingsDropdown(false);
                          }
                        }}
                        className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border shadow-sm ${
                          soundEnabled
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                        title={soundEnabled ? "Audio On (Click to Mute)" : "Audio Muted (Click to Enable)"}
                      >
                        {soundEnabled ? (
                          <Volume2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <VolumeX size={16} className="text-rose-500" />
                        )}
                        <span>{soundEnabled ? 'Audio On' : 'Audio Muted'}</span>
                      </button>
                    </div>

                    {/* Toggle Theme Mode Button */}
                    <button
                      type="button"
                      id="btn-setup-theme-toggle"
                      onClick={() => setDarkMode(prev => !prev)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
                      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                      {darkMode ? (
                        <>
                          <Sun size={16} className="text-amber-400" />
                          <span>Light</span>
                        </>
                      ) : (
                        <>
                          <Moon size={16} className="text-indigo-500" />
                          <span>Dark</span>
                        </>
                      )}
                    </button>

                    {/* Core Login Button */}
                    {isScoreManager ? (
                      <button
                        type="button"
                        id="btn-setup-core-logout"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to log out from Core Scorer mode?')) {
                            try {
                              await logout();
                              showNotification('Logged out from Core Scorer session.', 'info');
                            } catch (err) {
                              console.error('Logout error:', err);
                            }
                          }
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md border border-emerald-500"
                        title="Core Scorer authenticated - Click to log out"
                      >
                        <ShieldIcon size={15} className="text-amber-300" />
                        <span>Core: Logged In</span>
                      </button>
                    ) : (
                      <Link
                        to="/cricket-login"
                        id="btn-setup-core-login"
                        className="px-4 py-2.5 rounded-xl bg-amber-550 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-amber-500/20 no-underline decoration-transparent"
                        title="Authenticate with Core Scorer credentials"
                      >
                        <LoginIcon size={15} />
                        <span>Core Login</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>)}


        {/* ==================== 2. MAIN MATCH SCOREBOARD ==================== */}
        {match.status !== 'setup' && currentInnings && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* INNINGS HEADER OR CONCLUDED BANNER */}
            <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md border ${
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
                    {match.winner === 'Tie' ? 'MATCH TIED!' : `${match.winner} VICTORIOUS`}
                  </h2>
                  <p className="text-sm font-bold uppercase tracking-widest bg-black/10 inline-block px-6 py-2 rounded-full">
                    {match.winReason}
                  </p>

                  {/* Tie Resolution Options in Standard View Header */}
                  {match.winner === 'Tie' && match.tieResolution !== 'declared_tie' && (
                    <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setShowTieResolutionModal(true)}
                        className="px-6 py-3 bg-slate-950 hover:bg-black text-amber-300 border-2 border-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all transform hover:scale-105 cursor-pointer flex items-center gap-2"
                      >
                        <Zap size={16} className="text-amber-400 animate-pulse" />
                        <span>{match.isSuperOver ? `Play Super Over ${(match.superOverNumber || 1) + 1} ⚡` : 'Play Super Over (Option A)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeclareOfficialTie}
                        className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white border border-white/40 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                      >
                        <span>🤝</span>
                        <span>Declare Official Tie (Option B)</span>
                      </button>
                    </div>
                  )}
                  
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
                    <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/20 text-xs text-white/90">
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {match.isSuperOver ? (
                        <>
                          <span className="px-2.5 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[9px] font-black uppercase tracking-wider rounded-md shadow-sm animate-pulse">
                            ⚡ SUPER OVER {match.superOverNumber || 1} • Innings {match.currentInningsNum}/2
                          </span>
                          <span className="px-2.5 py-1 bg-black/30 text-amber-300 text-[9px] font-black uppercase tracking-wider rounded-md border border-amber-500/30">
                            1 Over (6 Balls) • Max 2 Wickets
                          </span>
                        </>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md animate-pulse">
                          Innings {match.currentInningsNum} Active
                        </span>
                      )}
                      {match.targetRuns && (
                        <span className="px-2.5 py-1 bg-black/20 text-amber-200 text-[9px] font-black uppercase tracking-wider rounded-md">
                          Target: {match.targetRuns} Runs
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight text-white mt-2 leading-tight">
                      {currentInnings.battingTeam} is Batting
                    </h2>
                    <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mt-1.5 flex flex-wrap items-center gap-1">
                      Defending Bowling side: <strong className="text-white bg-emerald-900 px-2 py-0.5 rounded-md font-extrabold">{currentInnings.bowlingTeam}</strong>
                    </p>

                    {/* Run Chase Equation */}
                    {match.currentInningsNum === 2 && match.targetRuns && (
                      <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 bg-black/30 border border-amber-400/30 rounded-xl text-xs font-bold text-amber-200 shadow-sm backdrop-blur-xs">
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center gap-1">
                          ⚡ Run Chase Equation
                        </span>
                        {match.targetRuns - currentInnings.runs > 0 ? (
                          <span className="font-mono text-white text-xs sm:text-sm">
                            Need <strong className="text-yellow-300 font-black text-sm sm:text-base font-mono">{match.targetRuns - currentInnings.runs}</strong> runs to win off <strong className="text-yellow-300 font-black text-sm sm:text-base font-mono">{Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)}</strong> balls
                            {(() => {
                              const ballsLeft = Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled);
                              const runsToGet = match.targetRuns - currentInnings.runs;
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

                  {/* CRR & RRR statistics bar */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-around sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm bg-black/20 p-3 sm:p-4 rounded-2xl border border-emerald-700/30">
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
                      <div className="text-center sm:border-l border-white/10 sm:pl-6">
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

                    <div className="text-center sm:border-l border-white/10 sm:pl-6">
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
            <div className="bg-slate-900 border-2 border-slate-950 dark:border-slate-800 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] p-3.5 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden text-white space-y-4 sm:space-y-6">
              
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

                    {/* Commentary Language Selector: Marathi, Hindi, English */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-sm">
                      <span className="text-[8.5px] font-black uppercase text-slate-400 px-1.5 flex items-center gap-1">
                        <span>🌐</span> Lang:
                      </span>
                      {[
                        { id: 'mr', label: '🚩 मराठी', name: 'Marathi' },
                        { id: 'hi', label: '🇮🇳 हिंदी', name: 'Hindi' },
                        { id: 'en', label: '🌐 English', name: 'English' }
                      ].map(l => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setUserCommentaryLang(l.id as any);
                            showNotification(`AI Commentary language: ${l.name}`, 'info');
                          }}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                            userCommentaryLang === l.id
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white bg-transparent'
                          }`}
                          title={`Switch to ${l.name} commentary`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>

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
                        setEditModalMatchBannerUrl(match.matchBannerUrl || '');
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
                        const overlayUrl = getPublicOverlayUrl(match.id);
                        copyToClipboard(overlayUrl).then(() => {
                          setCopiedOverlayLink(true);
                          setTimeout(() => setCopiedOverlayLink(false), 2500);
                          showNotification('Overlay link copied!', 'success');
                        });
                      }}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                      title={copiedOverlayLink ? "Copied overlay link!" : "Copy overlay link"}
                      aria-label="Copy overlay link"
                      id="btn-copy-obs-overlay-management"
                    >
                      {copiedOverlayLink ? <Check size={12} className="text-emerald-400" /> : <Link2 size={12} />}
                      <span>{copiedOverlayLink ? 'Copied' : 'Copy Overlay'}</span>
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

                      {/* PERMANENT OBS STUDIO OVERLAY LINK & ACTIVE MATCH ROUTING */}
                      <div className="flex flex-col gap-3 w-full lg:w-auto">
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Main Permanent OBS Link Copy Button */}
                          <button
                            onClick={() => {
                              const link = getPermanentOverlayUrl(currentManagerId, streamKey);
                              copyToClipboard(link).then(() => {
                                setCopiedPermanentOverlayLink(true);
                                setTimeout(() => setCopiedPermanentOverlayLink(false), 2500);
                                showNotification('🔥 Permanent OBS Link Copied! Add once to OBS (1920x1080); it stays active forever across all matches!', 'success');
                              });
                            }}
                            className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer border-none"
                            title="Copy your permanent OBS Browser Source link. You never have to change OBS again between matches!"
                            id="btn-copy-permanent-obs-overlay"
                          >
                            {copiedPermanentOverlayLink ? <Check size={16} className="text-slate-950" /> : <Radio size={16} className="text-slate-950 animate-pulse" />}
                            <span>{copiedPermanentOverlayLink ? 'Permanent OBS Link Copied!' : 'Copy Permanent OBS Link (Single Link)'}</span>
                          </button>

                          {/* Preview Permanent Overlay in New Tab */}
                          <a
                            href={getPermanentOverlayUrl(currentManagerId, streamKey, true)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-1.5 no-underline"
                            title="Open permanent overlay in a new browser tab"
                          >
                            <Eye size={14} />
                            <span>Preview</span>
                          </a>

                          {/* Toggle Current Match as LIVE / COMPLETED on Permanent OBS Overlay */}
                          {match.id && (
                            match.status === 'live' ? (
                              <button
                                onClick={() => handleSetMatchCompleted(match.id)}
                                className="px-3.5 py-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                                title="End match and set to Completed (Permanent overlay enters standby mode)"
                              >
                                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
                                <span>End Match / Set Completed</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetActiveLiveMatch(match)}
                                disabled={isActivatingLiveMatch}
                                className="px-3.5 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                title="Set this match as LIVE on your permanent OBS overlay"
                              >
                                <Play size={12} className="text-emerald-400 fill-emerald-400" />
                                <span>{isActivatingLiveMatch ? 'Activating...' : '🔴 Broadcast as LIVE Match'}</span>
                              </button>
                            )
                          )}
                        </div>

                        {/* Informational routing status pill */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap bg-slate-950/60 border border-white/5 px-3 py-1.5 rounded-lg">
                          <span className="font-bold text-slate-300">OBS Stream Status:</span>
                          {match.status === 'live' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-extrabold uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              Match is LIVE on OBS ({match.teamA} vs {match.teamB})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold uppercase">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 inline-block" />
                              Standby (No match currently live)
                            </span>
                          )}
                          <span className="text-slate-600">|</span>
                          <span className="font-mono text-slate-400">Manager: @{currentManagerId}</span>
                          <span className="text-slate-600">|</span>
                          <button
                            onClick={() => {
                              const link = getPublicOverlayUrl(match.id);
                              copyToClipboard(link).then(() => {
                                showNotification('Match-specific OBS link copied.', 'success');
                              });
                            }}
                            className="text-[9px] text-slate-400 hover:text-white underline cursor-pointer bg-transparent border-none p-0"
                            title="Copy legacy match-specific URL"
                          >
                            Copy match-specific URL
                          </button>
                        </div>
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                
                {/* COLUMN 1: LIVE SCOREBOARD STATS PANEL (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4 sm:space-y-5 flex flex-col justify-between">
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block mb-1">SCOREBOARD</span>
                      <h3 className="text-xl font-black uppercase tracking-widest text-white">{currentInnings.battingTeam}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Defending: {currentInnings.bowlingTeam}</p>
                    </div>

                    {/* Big score text block */}
                    <motion.div 
                      key={`pulse-${currentInnings.runs}-${currentInnings.wickets}`}
                      className="flex items-baseline gap-2 sm:gap-3 pt-2 px-2.5 sm:px-3.5 py-1.5 rounded-2xl border border-transparent cricket-scoreboard-container relative overflow-hidden"
                      animate={{
                        backgroundColor: ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 0.12)", "rgba(16, 185, 129, 0)"],
                        borderColor: ["rgba(16, 185, 129, 0)", "rgba(16, 185, 129, 0.5)", "rgba(16, 185, 129, 0)"]
                      }}
                      transition={{ duration: 0.65, ease: "easeInOut" }}
                    >
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-mono tracking-tighter leading-none flex items-center">
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
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
                          {formatOvers(currentInnings.ballsBowled)} overs
                        </span>
                        <span className="text-[8px] uppercase font-black text-slate-500 tracking-widest mt-0.5">
                          Innings Progress
                        </span>
                      </div>
                    </motion.div>

                    {/* Run Chase Equation */}
                    {match.currentInningsNum === 2 && match.targetRuns && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-1.5 font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            ⚡ Run Chase Equation
                          </span>
                          <span className="text-[9px] font-black font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                            Target: {match.targetRuns} Runs
                          </span>
                        </div>
                        <p className="text-xs font-bold text-amber-200 leading-snug">
                          {match.targetRuns - currentInnings.runs > 0 ? (
                            <span>Need <strong className="text-white font-mono font-black text-sm">{match.targetRuns - currentInnings.runs}</strong> runs to win off <strong className="text-white font-mono font-black text-sm">{Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)}</strong> balls remaining</span>
                          ) : (
                            <span className="text-emerald-400 font-black uppercase tracking-wider animate-pulse">🎉 Target Achieved!</span>
                          )}
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
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-1.5 relative overflow-hidden min-h-[50px]">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <Radio size={10} className="animate-pulse" /> Live Feed
                          </span>
                          {(() => {
                            const matchTone = getMatchContextualTone(match, currentInnings);
                            return <ContextualToneShifterBadge toneInfo={matchTone} language={userCommentaryLang} compact={true} />;
                          })()}
                        </div>
                        <div className="flex items-center gap-1">
                          {(['mr', 'hi', 'en'] as const).map(l => (
                            <button
                              key={l}
                              type="button"
                              onClick={() => setUserCommentaryLang(l)}
                              className={`px-1.5 py-0.2 rounded text-[7.5px] font-black uppercase transition-all border-none cursor-pointer ${
                                userCommentaryLang === l
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-400 hover:text-slate-200 bg-transparent'
                              }`}
                            >
                              {l === 'mr' ? 'मराठी' : l === 'hi' ? 'हिंदी' : 'EN'}
                            </button>
                          ))}
                        </div>
                      </div>
                      {isAiCommentaryLoading ? (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span className="inline-block w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          AI Scorer is crafting commentary...
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300 italic truncate font-bold leading-relaxed scroll-smooth">
                          {currentInnings.commentaryList[0] 
                            ? getCommentaryText(currentInnings.commentaryList[0], userCommentaryLang)
                            : "Scorer cockpit fully calibrated. Ready for next ball delivery."}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: ACTIVE CREASE DUO & BOWLER PANEL (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4 flex flex-col justify-between">
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
                                <div className="truncate mr-2 sm:mr-8 flex-1 min-w-0">
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
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base font-black font-mono text-white">
                                      {st.runs}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-slate-400">
                                      ({st.balls}b)
                                    </span>
                                    {!isSpectator && (
                                      <div className="flex items-center gap-1 shrink-0 ml-1">
                                        <button
                                          type="button"
                                          disabled={isScoringDisabled}
                                          onClick={() => openRetireHurtModal('striker')}
                                          className="px-1.5 py-1 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-black text-[8px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                          title="Retire Hurt (Injury)"
                                        >
                                          🩹 RETD
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isScoringDisabled}
                                          onClick={() => openWicketModal('striker')}
                                          className="px-2 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                          title="Dismiss Striker (Wicket / Out)"
                                        >
                                          🔴 OUT
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">
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
                                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white font-bold outline-none flex-1 min-w-0"
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
                                <div className="truncate mr-2 sm:mr-8 flex-1 min-w-0">
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
                                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black font-mono text-slate-300">
                                      {nst.runs}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-slate-505">
                                      ({nst.balls}b)
                                    </span>
                                    {!isSpectator && (
                                      <div className="flex items-center gap-1 shrink-0 ml-1">
                                        <button
                                          type="button"
                                          disabled={isScoringDisabled}
                                          onClick={() => openRetireHurtModal('non-striker')}
                                          className="px-1.5 py-1 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-black text-[8px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                          title="Retire Hurt (Injury)"
                                        >
                                          🩹 RETD
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isScoringDisabled}
                                          onClick={() => openWicketModal('non-striker')}
                                          className="px-2 py-1 bg-rose-600/90 hover:bg-rose-500 active:scale-95 text-white font-black text-[8.5px] uppercase tracking-wider rounded-lg border-none cursor-pointer flex items-center gap-0.5 shadow transition-all shrink-0"
                                          title="Dismiss Non-Striker (Run Out)"
                                        >
                                          🔴 OUT
                                        </button>
                                      </div>
                                    )}
                                  </div>
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
                                  className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white font-bold outline-none flex-1 min-w-0"
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
                <div className="lg:col-span-4 bg-slate-950/40 p-4 sm:p-6 rounded-2xl border border-white/5 space-y-4">
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

                      {/* Extras quick selections (W, NB, Wicket) */}
                      <div className="grid grid-cols-3 gap-1.5 font-bold">
                        <button
                          onClick={() => handleScoreEvent({ type: 'wide', val: 0 })}
                          className="py-2 bg-slate-800 hover:bg-slate-750 text-white hover:text-emerald-400 text-[10px] font-extrabold rounded-xl uppercase transition-all cursor-pointer border-none flex justify-between px-2 items-center"
                        >
                          <span>Wide</span>
                          <span className="text-emerald-400">+1</span>
                        </button>

                        <button
                          onClick={() => handleScoreEvent({ type: 'noball', val: 0 })}
                          className="py-2 bg-slate-800 hover:bg-slate-750 text-white hover:text-emerald-400 text-[10px] font-extrabold rounded-xl uppercase transition-all cursor-pointer border-none flex justify-between px-2 items-center"
                        >
                          <span>No ball</span>
                          <span className="text-amber-400">+1</span>
                        </button>

                        <button
                          onClick={() => openWicketModal('striker')}
                          className="py-2 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-xl uppercase transition-all cursor-pointer border-none flex justify-center items-center gap-1 shadow"
                        >
                          🔴 <span>Wicket</span>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              
              {/* Batting Detailed register */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-md">
                <div className="flex justify-between items-center mb-4 sm:mb-6 pb-2 border-b border-slate-50 dark:border-slate-800">
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
                                  Out ({b.fielderName ? `c ${b.fielderName} b ${b.dismissedBy || 'bowler'}` : b.outMode})
                                </span>
                              )}
                            </span>
                            {b.dismissedBy && (
                              <p className="text-[8px] text-slate-400 mt-1 uppercase font-semibold">
                                {b.fielderName ? `c ${b.fielderName} • b ${b.dismissedBy}` : `dismiss by ${b.dismissedBy}`}
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
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 sm:mb-6 pb-2 border-b border-slate-50 dark:border-slate-800">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-500" />
                    Fall Of Wickets Profile {currentInnings.fallOfWickets?.length > 0 ? `(${currentInnings.fallOfWickets.length} Fallen)` : ''}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Chronological wicket tracker & dismissal sequence</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button 
                    onClick={() => openWicketModal('striker')}
                    disabled={isScoringDisabled}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white border-none rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <PlusCircle size={13} />
                    + Add Wicket Dismissal
                  </button>
                  <button
                    onClick={() => {
                      const nextWktNo = (currentInnings.fallOfWickets?.length || 0) + 1;
                      setManualFoWData({
                        wicketNo: nextWktNo,
                        score: currentInnings.runs,
                        batsmanName: currentInnings.batsmen[currentInnings.strikerIndex]?.name || '',
                        oversList: formatOvers(currentInnings.ballsBowled)
                      });
                      setShowManualFoWModal(true);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-none rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    Manual FoW
                  </button>
                  <button 
                    onClick={handleResetMatch}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-550 dark:text-rose-400 border-none rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all"
                  >
                    Discard & Exit
                  </button>
                </div>
              </div>

              {(!currentInnings.fallOfWickets || currentInnings.fallOfWickets.length === 0) ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    No wickets fallen yet in this innings
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => openWicketModal('striker')}
                      disabled={isScoringDisabled}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-md transition-all inline-flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <PlusCircle size={14} /> Record First Wicket
                    </button>
                    <button
                      onClick={() => {
                        setManualFoWData({
                          wicketNo: 1,
                          score: currentInnings.runs,
                          batsmanName: currentInnings.batsmen[currentInnings.strikerIndex]?.name || '',
                          oversList: formatOvers(currentInnings.ballsBowled)
                        });
                        setShowManualFoWModal(true);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-1.5"
                    >
                      <PlusCircle size={14} /> Manual FoW Entry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(currentInnings.fallOfWickets || []).map((fw, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl space-y-1.5 text-xs font-bold border border-slate-100 dark:border-slate-800 relative group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-rose-500 font-extrabold font-mono text-[10px]">Wkt # {fw.wicketNo}</span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setManualFoWData({
                                wicketNo: fw.wicketNo,
                                score: fw.score,
                                batsmanName: fw.batsmanName,
                                oversList: fw.oversList,
                                editIndex: idx
                              });
                              setShowManualFoWModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-white bg-slate-200 dark:bg-slate-800 rounded border-none cursor-pointer"
                            title="Edit entry"
                          >
                            <Edit size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFoW(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-slate-200 dark:bg-slate-800 rounded border-none cursor-pointer"
                            title="Delete entry"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-sm font-black truncate">{fw.batsmanName}</p>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        at <strong className="text-amber-500 dark:text-amber-400">{fw.score}</strong> runs • {fw.oversList} ov
                      </span>
                    </div>
                  ))}

                  {/* Add Wicket action card directly in the grid */}
                  <button
                    onClick={() => openWicketModal('striker')}
                    disabled={isScoringDisabled}
                    className="p-3.5 bg-rose-500/10 hover:bg-rose-500/20 border border-dashed border-rose-500/40 rounded-xl flex flex-col items-center justify-center gap-1.5 text-rose-600 dark:text-rose-400 cursor-pointer transition-all group active:scale-95 disabled:opacity-50 min-h-[85px]"
                  >
                    <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-wider">+ Add Wicket</span>
                  </button>
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
                    {(['Bowled', 'Caught', 'Run Out', 'Stumped', 'LBW', 'Retired Hurt'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setWicketType(mode);
                          if (mode === 'Retired Hurt') {
                            setWicketHowOutDetails('Retired Hurt');
                            setWicketAdditionalDetails('Retired Hurt (Injured)');
                          } else {
                            setWicketHowOutDetails(mode);
                          }
                        }}
                        className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none ${
                          wicketType === mode
                            ? (mode === 'Retired Hurt' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white')
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-850 dark:text-slate-400'
                        }`}
                      >
                        {mode === 'Retired Hurt' ? '🩹 Retired' : mode}
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
                  {currentInnings && currentInnings.bowlers && currentInnings.bowlers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase py-1 select-none">Quick Select:</span>
                      {(currentInnings.bowlers || []).map((bw, idx) => (
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
                    placeholder={`Default: Batsman ${(currentInnings?.batsmen?.length || 0) + 1}`}
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

              <div className="font-sans flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setFallOfWicketModal(null);
                    setTimeout(() => {
                      openWicketModal('striker');
                    }, 50);
                  }}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all border-none shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <AlertCircle size={14} />
                  + Add Next Wicket
                </button>
                <button
                  type="button"
                  onClick={() => setFallOfWicketModal(null)}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl cursor-pointer transition-all border-none shadow-md shadow-emerald-950/40 active:scale-95"
                >
                  Continue Scoring
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Fall of Wickets entry & adjustment modal */}
        {showManualFoWModal && currentInnings && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-slate-950/80 select-none">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-white">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
                    <AlertCircle size={16} className="text-rose-500" />
                    {manualFoWData.editIndex !== undefined ? 'Edit Fall of Wicket' : 'Add Fall of Wicket Entry'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Reconcile wicket sequence, score & over details</p>
                </div>
                <button
                  onClick={() => setShowManualFoWModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Wicket #</label>
                    <input
                      type="number"
                      min={1}
                      max={11}
                      value={manualFoWData.wicketNo}
                      onChange={(e) => setManualFoWData({ ...manualFoWData, wicketNo: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Score at Dismissal</label>
                    <input
                      type="number"
                      min={0}
                      value={manualFoWData.score}
                      onChange={(e) => setManualFoWData({ ...manualFoWData, score: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Dismissed Batsman Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Batsman name"
                    value={manualFoWData.batsmanName}
                    onChange={(e) => setManualFoWData({ ...manualFoWData, batsmanName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Over Bowled (e.g. 4.2)</label>
                  <input
                    type="text"
                    placeholder="e.g. 4.2"
                    value={manualFoWData.oversList}
                    onChange={(e) => setManualFoWData({ ...manualFoWData, oversList: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 font-sans">
                <button
                  type="button"
                  onClick={() => setShowManualFoWModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold uppercase border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualFoW}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase border-none cursor-pointer shadow-lg shadow-rose-900/30"
                >
                  Save Wicket Entry
                </button>
              </div>
            </div>
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
              <div className="text-center mb-5">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full font-black text-[9px] uppercase tracking-widest">
                  Match Teams & Squad Management
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white mt-2">
                  Local Cricket Team Suite
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Send captain squad links, manually enter teams, or load squads into live scoreboard in 1-click.
                </p>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mt-4 gap-1">
                  <button
                    type="button"
                    onClick={() => setTeamModalTab('presets')}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                      teamModalTab === 'presets'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
                    }`}
                  >
                    <Users size={12} />
                    Saved Teams ({savedTeams.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeamModalTab('invite_captain')}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                      teamModalTab === 'invite_captain'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
                    }`}
                  >
                    <Smartphone size={12} />
                    📲 Captain Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamId(null);
                      setNewTeamName('');
                      setNewTeamCaptainName('');
                      setNewTeamPlayersText('');
                      setTeamModalTab('direct_add');
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                      teamModalTab === 'direct_add'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent'
                    }`}
                  >
                    <PlusCircle size={12} />
                    ➕ Direct Add
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {/* TAB 1: SAVED TEAMS & 1-CLICK ACTIONS */}
                {teamModalTab === 'presets' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Shield size={13} className="text-emerald-500" />
                        Available Match Teams ({savedTeams.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeamId(null);
                          setNewTeamName('');
                          setNewTeamCaptainName('');
                          setNewTeamPlayersText('');
                          setTeamModalTab('direct_add');
                        }}
                        className="text-[9.5px] font-black uppercase text-emerald-600 hover:underline bg-transparent border-none cursor-pointer"
                      >
                        + Add Another
                      </button>
                    </div>

                    {savedTeams.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 space-y-3">
                        <Users size={32} className="mx-auto text-slate-400" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No teams added yet!</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          You can send a link to team captains so they enter their 15-player squad, or manually add a team right away.
                        </p>
                        <div className="flex justify-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setTeamModalTab('invite_captain')}
                            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none cursor-pointer"
                          >
                            📲 Send Captain Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeamModalTab('direct_add')}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none cursor-pointer"
                          >
                            ➕ Add Team Direct
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {savedTeams.map((t) => {
                          const isCaptainPending = t.status === 'pending_squad' && (!t.players || t.players.length === 0);
                          return (
                            <div key={t.id} className="p-3.5 bg-slate-50 dark:bg-slate-850/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 hover:border-emerald-500/30 transition-all">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {t.logo && (
                                      <img src={t.logo} alt={t.name} className="w-6 h-6 rounded-lg object-contain bg-white dark:bg-slate-800 p-0.5 shrink-0 border border-slate-200 dark:border-slate-700" />
                                    )}
                                    <strong className="font-black text-slate-850 dark:text-white block text-sm truncate">
                                      {t.name}
                                    </strong>
                                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                      isCaptainPending
                                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                        : (t.players?.length >= 11)
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                      {isCaptainPending ? '⏳ Awaiting Captain' : `${t.players?.length || 0} Players`}
                                    </span>
                                  </div>
                                  {t.captainName && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                                      Captain: <span className="text-slate-700 dark:text-slate-200">{t.captainName}</span>
                                    </p>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                    {t.players && t.players.length > 0 ? t.players.join(', ') : 'No squad members submitted yet'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTeamId(t.id);
                                      setNewTeamName(t.name);
                                      setNewTeamCaptainName(t.captainName || '');
                                      setNewTeamPlayersText(t.players ? t.players.join('\n') : '');
                                      setTeamModalTab('direct_add');
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg border-none cursor-pointer transition-colors"
                                    title="Edit team"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  {teamDeleteConfirmId === t.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleDeleteTeam(t.id, t.name);
                                          setTeamDeleteConfirmId(null);
                                        }}
                                        className="px-2 py-1 text-white bg-rose-500 rounded text-[9px] font-black uppercase border-none cursor-pointer"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setTeamDeleteConfirmId(null)}
                                        className="px-1.5 py-1 text-slate-400 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-black uppercase border-none cursor-pointer"
                                      >
                                        No
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setTeamDeleteConfirmId(t.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg border-none cursor-pointer transition-colors"
                                      title="Delete team"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons Row */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-150 dark:border-slate-800">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOneClickLoadTeam(t, 'A');
                                      setShowTeamModal(false);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border-none cursor-pointer flex items-center gap-1 transition-transform active:scale-95 shadow-sm"
                                  >
                                    <Zap size={10} />
                                    1-Click Team A
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleOneClickLoadTeam(t, 'B');
                                      setShowTeamModal(false);
                                    }}
                                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider border-none cursor-pointer flex items-center gap-1 transition-transform active:scale-95 shadow-sm"
                                  >
                                    <Zap size={10} />
                                    1-Click Team B
                                  </button>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleShareCaptainWhatsApp(t)}
                                    className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30 cursor-pointer flex items-center gap-1"
                                    title="Send link to Captain on WhatsApp"
                                  >
                                    📲 WhatsApp
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const link = getCaptainSquadLink(t.id);
                                      navigator.clipboard.writeText(link);
                                      showNotification('Captain squad submission link copied!', 'success');
                                    }}
                                    className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider border-none cursor-pointer flex items-center gap-1"
                                    title="Copy Captain link"
                                  >
                                    <Copy size={10} />
                                    Copy Link
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: SEND CAPTAIN SQUAD LINK */}
                {teamModalTab === 'invite_captain' && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <Smartphone size={14} />
                        Send 15-Player Squad Submission Link to Captain
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Enter the team name and send the generated link to the team captain via WhatsApp or SMS. The captain can easily input all 15 players (with roles like C, VC, WK) on their phone. Once submitted, you can load the squad into your live scoreboard in <strong>just one click</strong>!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                          Team Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Royal Challengers Bangalore"
                          value={captainInviteTeamName}
                          onChange={(e) => setCaptainInviteTeamName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Captain Name (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Virat Kohli"
                            value={captainInviteCaptainName}
                            onChange={(e) => setCaptainInviteCaptainName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Captain WhatsApp / Phone (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. 9876543210"
                            value={captainInvitePhone}
                            onChange={(e) => setCaptainInvitePhone(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateCaptainInvite}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer transition-all shadow-md hover:shadow-indigo-500/20 flex items-center justify-center gap-1.5"
                      >
                        <Zap size={13} />
                        Generate Captain Squad Link
                      </button>

                      {/* Generated Link Display Box */}
                      {generatedCaptainLink && (
                        <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800/80 space-y-2.5 animate-fadeIn">
                          <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                            ✓ Captain Squad Link Ready to Share
                          </span>
                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                            <span className="truncate flex-1">{generatedCaptainLink}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedCaptainLink);
                                setCopiedCaptainLink(true);
                                setTimeout(() => setCopiedCaptainLink(false), 2500);
                                showNotification('Captain link copied to clipboard!', 'success');
                              }}
                              className="py-2 px-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[9.5px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                            >
                              {copiedCaptainLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copiedCaptainLink ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const msg = encodeURIComponent(
                                  `🏏 *Gully Score Live Match Squad Invitation*\n` +
                                  `Team: *${captainInviteTeamName.trim()}*\n` +
                                  `Hey Captain! Please submit your 15-player squad using this link so we can load your team onto the live scoreboard in 1-click:\n\n` +
                                  `${generatedCaptainLink}`
                                );
                                window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
                              }}
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                              📲 WhatsApp Captain
                            </button>
                          </div>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={() => setTeamModalTab('presets')}
                              className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline bg-transparent border-none cursor-pointer"
                            >
                              View all teams in Saved Teams tab →
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: DIRECT ADD TEAM & PLAYERS (MANUAL ENTRY) */}
                {teamModalTab === 'direct_add' && (
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {editingTeamId ? 'Edit Team Preset' : 'Directly Add Team & Squad'}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Score managers can manually enter the team and all players here.
                        </p>
                      </div>
                      {editingTeamId && (
                        <button
                          onClick={() => {
                            setEditingTeamId(null);
                            setNewTeamName('');
                            setNewTeamCaptainName('');
                            setNewTeamPlayersText('');
                          }}
                          className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-600 bg-transparent border-none cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                          Team Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="E.g. Gully Gladiators"
                          value={newTeamName}
                          onChange={(e) => setNewTeamName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Captain Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="E.g. Rohit Sharma"
                          value={newTeamCaptainName}
                          onChange={(e) => setNewTeamCaptainName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">
                          Players (Up to 15, one per line)
                        </label>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const sample15 = [
                                'Rohit Sharma (C)', 'Shubman Gill', 'Virat Kohli', 'Shreyas Iyer', 'KL Rahul (WK)',
                                'Hardik Pandya (VC)', 'Ravindra Jadeja', 'Axar Patel', 'Kuldeep Yadav', 'Jasprit Bumrah',
                                'Mohammed Siraj', 'Mohammed Shami', 'Suryakumar Yadav', 'Ishan Kishan', 'Prasidh Krishna'
                              ];
                              setNewTeamPlayersText(sample15.join('\n'));
                              if (!newTeamName) setNewTeamName('India XI');
                              if (!newTeamCaptainName) setNewTeamCaptainName('Rohit Sharma');
                              showNotification('Loaded 15 sample players!', 'info');
                            }}
                            className="text-[8.5px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border-none cursor-pointer hover:bg-emerald-500/20"
                          >
                            ⚡ Sample 15 Squad
                          </button>
                        </div>
                      </div>
                      <textarea
                        placeholder="Player 1&#10;Player 2&#10;Player 3&#10;...up to 15 players"
                        value={newTeamPlayersText}
                        onChange={(e) => setNewTeamPlayersText(e.target.value)}
                        rows={5}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none font-mono"
                      />
                    </div>

                    {/* Approved players quick insert list */}
                    {approvedPlayers.length > 0 && (
                      <div className="space-y-1.5 text-left">
                        <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                          Approved Players Quick Picker ({approvedPlayers.length})
                        </span>
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
                                    const lines = newTeamPlayersText.split('\n').filter(x => x.trim().toLowerCase() !== trimName.toLowerCase());
                                    setNewTeamPlayersText(lines.join('\n'));
                                  } else {
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
                      type="button"
                      onClick={handleSaveTeam}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer transition-all shadow-sm"
                    >
                      {editingTeamId ? 'Update Team Preset' : 'Save Team Preset'}
                    </button>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTeamModal(false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer border-none"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* ==================== 8. MODAL DIALOG: PERMANENT OBS OVERLAY HUB ==================== */}
        {showObsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowObsModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden z-10 my-6 text-white"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950/80 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                    <Tv size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono text-[9px] font-black uppercase tracking-wider border border-rose-500/40">
                        1920×1080 FULL HD
                      </span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">
                        @{currentManagerId}
                      </span>
                    </div>
                    <h3 className="text-base font-black uppercase tracking-tight text-white mt-0.5">
                      OBS Studio Overlay Desk
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border-none"
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-white/10 bg-slate-950/60 p-1.5 gap-1 text-[11px] font-black uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setObsModalTab('permanent')}
                  className={`flex-1 py-2 rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    obsModalTab === 'permanent'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radio size={13} className={obsModalTab === 'permanent' ? 'animate-pulse' : ''} />
                  <span>Permanent OBS Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setObsModalTab('single')}
                  className={`flex-1 py-2 rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    obsModalTab === 'single'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Link2 size={13} />
                  <span>Match-Specific Link</span>
                </button>

                <button
                  type="button"
                  onClick={() => setObsModalTab('guide')}
                  className={`flex-1 py-2 rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    obsModalTab === 'guide'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen size={13} />
                  <span>Setup Guide</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {obsModalTab === 'permanent' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3">
                      <Sparkles size={18} className="text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <strong className="text-emerald-300 font-extrabold uppercase tracking-wider block mb-0.5">
                          Recommended: Single Link for All Matches
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          Add this browser source link to OBS Studio once. Whether you are scoring match 1 or match 50, you never need to update OBS settings again! All score bugs, player banners, and boundary animations update live.
                        </p>
                      </div>
                    </div>

                    {/* Broadcast Status Pill */}
                    <div className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          match.status === 'live' || activeLiveMatches.length > 0 ? 'bg-rose-400 animate-ping' : 'bg-amber-400'
                        }`} />
                        <span className="text-xs font-bold text-slate-200">
                          {match.status === 'live'
                            ? `Active Match: ${match.teamA} vs ${match.teamB}`
                            : activeLiveMatches.length > 0
                            ? `Active Stream: ${activeLiveMatches[0].teamA} vs ${activeLiveMatches[0].teamB}`
                            : 'Broadcast Standby (Ready for Next Match)'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        1920×1080 @ 60 FPS
                      </span>
                    </div>

                    {/* The Permanent URL Box */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Permanent OBS Browser Source URL
                      </label>
                      <div className="p-3 bg-black/60 border border-emerald-500/30 rounded-2xl font-mono text-xs text-emerald-300 select-all break-all shadow-inner">
                        {getPermanentOverlayUrl(currentManagerId, streamKey)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const permUrl = getPermanentOverlayUrl(currentManagerId, streamKey);
                          copyToClipboard(permUrl).then(() => {
                            setCopiedPermanentOverlayLink(true);
                            setTimeout(() => setCopiedPermanentOverlayLink(false), 2500);
                            showNotification('🔥 Permanent OBS Link Copied! Add once to OBS (1920x1080 transparent).', 'success');
                          });
                        }}
                        className="py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                        id="btn-copy-perm-obs-modal"
                      >
                        {copiedPermanentOverlayLink ? <Check size={16} className="text-slate-950" /> : <Copy size={16} className="text-slate-950" />}
                        <span>{copiedPermanentOverlayLink ? 'Copied Permanent Link!' : 'Copy Permanent OBS Link'}</span>
                      </button>

                      <a
                        href={getPermanentOverlayUrl(currentManagerId, streamKey, true)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border border-white/10 transition-all flex items-center justify-center gap-2 no-underline text-center"
                      >
                        <ExternalLink size={15} />
                        <span>Preview Overlay (New Tab)</span>
                      </a>
                    </div>

                    {/* Stream Key / Identity settings */}
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Settings size={12} className="text-emerald-400" />
                          Scorer Broadcast Identity
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newKey = prompt('Enter a custom Stream Key (or leave empty to clear):', streamKey);
                            if (newKey !== null) {
                              setStreamKey(newKey.trim());
                              showNotification(newKey.trim() ? `Stream key set to: ${newKey.trim()}` : 'Stream key cleared', 'info');
                            }
                          }}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider bg-transparent border-none cursor-pointer"
                        >
                          Change Stream Key
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[9px] text-slate-400 uppercase block font-sans">Manager ID</span>
                          <span className="text-emerald-300 font-bold truncate block">@{currentManagerId}</span>
                        </div>
                        <div className="p-2.5 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[9px] text-slate-400 uppercase block font-sans">Stream Key</span>
                          <span className="text-amber-300 font-bold truncate block">{streamKey || 'None (Default)'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {obsModalTab === 'single' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/25 rounded-2xl flex items-start gap-3">
                      <Info size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <strong className="text-indigo-300 font-extrabold uppercase tracking-wider block mb-0.5">
                          Match-Specific Link
                        </strong>
                        <p className="text-slate-300 leading-relaxed">
                          This URL is bound specifically to match ID <code className="text-emerald-300">{match.id || 'N/A'}</code>. Use this if you only want to stream this single fixture.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                        Match-Specific OBS URL
                      </label>
                      <div className="p-3 bg-black/60 border border-indigo-500/30 rounded-2xl font-mono text-xs text-indigo-300 select-all break-all shadow-inner">
                        {getPublicOverlayUrl(match.id || 'current')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const singleUrl = getPublicOverlayUrl(match.id || 'current');
                          copyToClipboard(singleUrl).then(() => {
                            showNotification('Match-specific OBS Link Copied (1920x1080 transparent)', 'success');
                          });
                        }}
                        className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Copy size={16} />
                        <span>Copy Match-Specific Link</span>
                      </button>

                      <a
                        href={getPublicOverlayUrl(match.id || 'current', true)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border border-white/10 transition-all flex items-center justify-center gap-2 no-underline text-center"
                      >
                        <ExternalLink size={15} />
                        <span>Preview in New Tab</span>
                      </a>
                    </div>
                  </div>
                )}

                {obsModalTab === 'guide' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <BookOpen size={14} />
                      How to setup in OBS Studio (3 Simple Steps)
                    </h4>

                    <div className="space-y-2.5">
                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                          1
                        </div>
                        <div>
                          <strong className="text-xs font-extrabold text-white block">Add Browser Source</strong>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Open <strong className="text-white">OBS Studio</strong>. In the <strong>Sources</strong> dock at the bottom, click the <strong>+</strong> icon and choose <strong>Browser</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                          2
                        </div>
                        <div>
                          <strong className="text-xs font-extrabold text-white block">Configure 1920 × 1080 Canvas</strong>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Set Width to <strong className="text-white font-mono">1920</strong> and Height to <strong className="text-white font-mono">1080</strong>. Check <strong>"Shutdown source when not visible"</strong> for smooth performance.
                          </p>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/10 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                          3
                        </div>
                        <div>
                          <strong className="text-xs font-extrabold text-white block">Paste the Permanent OBS Link & Done!</strong>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Paste the Permanent OBS Link into the <strong>URL</strong> field and click <strong>OK</strong>. The scoreboard bug will render crisply with transparency over your live camera or screen capture!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Transparent background enabled by default
                </span>
                <button
                  type="button"
                  onClick={() => setShowObsModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none"
                >
                  Close Desk
                </button>
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

            {/* Small Permanent OBS Overlay Link Icon near Past Matches (Footer) */}
            <button
              type="button"
              onClick={() => {
                const overlayUrl = getPermanentOverlayUrl(currentManagerId, streamKey);
                copyToClipboard(overlayUrl).then(() => {
                  setCopiedOverlayLink(true);
                  setTimeout(() => setCopiedOverlayLink(false), 2500);
                  showNotification('Overlay link copied!', 'success');
                });
              }}
              className={`p-2 rounded-lg transition-all cursor-pointer border-none text-white shadow-sm flex items-center justify-center ${
                copiedOverlayLink ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              title={copiedOverlayLink ? "Copied overlay link!" : "Copy overlay link"}
              id="btn-footer-obs-link-icon"
              aria-label="Copy overlay link"
            >
              {copiedOverlayLink ? <Check size={14} className="text-slate-950 font-bold" /> : <Link2 size={14} />}
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

      {/* Tie Resolution Modal (Option A: Super Over, Option B: Official Tie) */}
      {renderTieResolutionModal()}
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
