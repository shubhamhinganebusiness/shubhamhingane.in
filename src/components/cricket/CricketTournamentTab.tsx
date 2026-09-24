import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Plus, Calendar, MapPin, Users, Edit, Trash2, Bot, HelpCircle, 
  Sparkles, Check, CheckCircle2, Play, ChevronRight, BarChart3, AlertCircle, Share2, Award, RefreshCw, Download, ArrowLeftRight,
  Zap, Image as ImageIcon, Crown, Flame, ShieldCheck, DollarSign, QrCode, Filter, FileText, X, Upload
} from 'lucide-react';

const GULLY_RULES_PRESETS = [
  'Box Cricket (8 Overs, max 2 ov/bowler)',
  'Underarm bowling only',
  'Direct hit to wall boundary (4/6)',
  'Direct hit to roof/net is OUT',
  '1-Tip 1-Hand catch is OUT',
  'Overthrow runs disallowed',
  'Last man batting allowed',
  'No LBW dismissal',
  'Free Hit on No-Ball'
];
import { db, isFirestoreQuotaExhausted, isQuotaError, recordFirestoreQuotaExhaustion } from '../../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../AuthContext';
import { TournamentVenueScheduler, TeamWithRoster } from './TournamentVenueScheduler';
import { TournamentStatsAndLeaderboards } from './TournamentStatsAndLeaderboards';
import { PointsTableModule } from './PointsTableModule';
import { LiveStandingsSummaryWidget } from './LiveStandingsSummaryWidget';
import { TournamentHierarchyPointsTable } from './TournamentHierarchyPointsTable';
import { calculateTournamentStandings, convertOversToDecimal } from './modules/TournamentPointsCalculator';
import { LocalTeamsAndOneClickSetupModal, PRESET_LOCAL_CRICKET_TEAMS } from './LocalTeamsAndOneClickSetupModal';
import { PrizeManagementModal } from './PrizeManagementModal';
import { MatchBannerModal } from './MatchBannerModal';
import { TournamentAwardsPresentationCard } from './TournamentAwardsPresentationCard';
import { TournamentDreamTeamModal } from './TournamentDreamTeamModal';
import { TournamentPublicShareModal } from './TournamentPublicShareModal';
import { TournamentMatchScorecardModal } from './TournamentMatchScorecardModal';
import { TournamentRecentResultsCarousel } from './TournamentRecentResultsCarousel';
import { TournamentPrize, getTournamentPrizesByTournamentId, saveTournamentPrizesForTournament, getValidActivePrizes } from '../../utils/cricketPrizeStorage';
import { MatchAwardsCertificateModal, MatchCertificateData, AwardType } from './MatchAwardsCertificateModal';
import { normalizeImageUrl, isGoogleDriveUrl, handleSmartImageError } from './imageUrlHelper';
import { isTournamentDeleted, deleteLocalTournament, syncDeletedTournamentsFromServer } from './cricketStorage';

interface TournamentTeam {
  id: string;
  name: string;
  captain: string;
  players: string[];
  logo?: string;
  playerPhotos?: Record<string, string>;
}

interface TournamentMatch {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  date: string;
  time: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed';
  scoreA: string; // e.g. "120/4"
  scoreB: string; // e.g. "110/8"
  oversA: string; // e.g. "10"
  oversB: string; // e.g. "10"
  winnerId: string | null;
  winReason: string;
  manOfTheMatch: string;
  stage: string;
  pitchType?: string;
  umpire1?: string;
  umpire2?: string;
  scorer?: string;
  matchBannerUrl?: string;
}

export interface TournamentLiveScoreConfig {
  teamA: string;
  teamB: string;
  overs: number;
  customRules?: string;
  tournamentId: string;
  matchId: string;
  tournamentName: string;
  tournamentLogo?: string;
  groundName: string;
  venue: string;
  seriesName?: string;
  umpire1Name?: string;
  umpire1Photo?: string;
  umpire2Name?: string;
  umpire2Photo?: string;
  scoreboardManagerName?: string;
  scoreboardManagerPhoto?: string;
  commentatorName?: string;
  commentatorPhoto?: string;
  youtubeChannelLogo?: string;
  youtubeChannelName?: string;
  teamALogo?: string;
  teamBLogo?: string;
  teamASquad?: string[];
  teamBSquad?: string[];
  playerPhotos?: Record<string, string>;
  matchBannerUrl?: string;
  prizes?: TournamentPrize[];
  onSave: (result: { runsA: number; wicketsA: number; runsB: number; wicketsB: number; winner: string; winReason: string }) => void;
}

interface Tournament {
  id: string;
  name: string;
  teamCount: number;
  format: 'T20' | 'ODI' | 'Test' | 'Box Cricket' | 'Custom';
  customOvers?: number;
  logo?: string;
  customRules?: string;
  type: 'league' | 'knockout' | 'group-stage' | 'double-elimination';
  startDate: string;
  status: 'setup' | 'active' | 'completed';
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  winnerTeamName: string | null;
  createdBy?: string;
  groundName?: string;
  venue?: string;
  umpire1Name?: string;
  umpire1Photo?: string;
  umpire2Name?: string;
  umpire2Photo?: string;
  scoreboardManagerName?: string;
  scoreboardManagerPhoto?: string;
  commentatorName?: string;
  commentatorPhoto?: string;
  youtubeChannelLogo?: string;
  youtubeChannelName?: string;
  prizes?: TournamentPrize[];
  pointsConfig?: {
    winPoints: number;
    tiePoints: number;
    lossPoints: number;
    qualificationSpots?: number;
    enableNRR?: boolean;
  };
}

export const CricketTournamentTab: React.FC<{
  onStartLiveScore?: (
    teamAOrConfig: string | TournamentLiveScoreConfig,
    teamB?: string,
    overs?: number,
    customRules?: string | undefined,
    tournamentId?: string,
    matchId?: string,
    onSave?: (result: { runsA: number; wicketsA: number; runsB: number; wicketsB: number; winner: string; winReason: string }) => void
  ) => void;
}> = ({ onStartLiveScore }) => {
  const { user } = useAuth();
  
  // Custom non-blocking interactive confirmation dialog state per environment-safe guidelines
  const [tournamentToDeleteState, setTournamentToDeleteState] = useState<{ id: string; name: string } | null>(null);

  // Core tournament state list
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    try {
      const saved = localStorage.getItem('gully_tournaments_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => t && t.id && !isTournamentDeleted(t.id));
        }
      }
      return [];
    } catch (e) {
      console.warn('LocalStorage gully_tournaments_v1 read blocked:', e);
      return [];
    }
  });

  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(() => {
    try {
      const activeId = localStorage.getItem('gully_active_tournament_id');
      if (activeId && isTournamentDeleted(activeId)) {
        localStorage.removeItem('gully_active_tournament_id');
        return null;
      }
      return activeId;
    } catch (e) {
      console.warn('LocalStorage gully_active_tournament_id read blocked:', e);
      return null;
    }
  });

  // UI state variables
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourName, setNewTourName] = useState('');
  const [newTourTeamCount, setNewTourTeamCount] = useState<number>(4);
  const [newTourFormat, setNewTourFormat] = useState<'T20' | 'ODI' | 'Test' | 'Box Cricket' | 'Custom'>('T20');
  const [newTourCustomOvers, setNewTourCustomOvers] = useState<number>(10);
  const [newTourCustomRules, setNewTourCustomRules] = useState(''); // Custom rules field
  const [tournamentLogoStr, setTournamentLogoStr] = useState<string>('');
  const [newTourType, setNewTourType] = useState<'league' | 'knockout' | 'group-stage' | 'double-elimination'>('league');
  const [newTourDate, setNewTourDate] = useState(new Date().toISOString().split('T')[0]);

  // Ground Venue, Match Officials & Broadcast Crew for new tournament
  const [newTourGroundVenue, setNewTourGroundVenue] = useState('Shivaji Maharaj Ground (Turf)');
  const [newTourUmpire1Name, setNewTourUmpire1Name] = useState('Umesh Shastri');
  const [newTourUmpire1Photo, setNewTourUmpire1Photo] = useState('');
  const [newTourUmpire2Name, setNewTourUmpire2Name] = useState('Nitin Gadkari');
  const [newTourUmpire2Photo, setNewTourUmpire2Photo] = useState('');
  const [newTourScoreboardManagerName, setNewTourScoreboardManagerName] = useState('Ravi Shastri Jnr');
  const [newTourScoreboardManagerPhoto, setNewTourScoreboardManagerPhoto] = useState('');
  const [newTourCommentatorName, setNewTourCommentatorName] = useState('Harsha Bhogle (Live)');
  const [newTourCommentatorPhoto, setNewTourCommentatorPhoto] = useState('');
  const [newTourYoutubeChannelName, setNewTourYoutubeChannelName] = useState(() => {
    try { return localStorage.getItem('cricket_youtube_channel_name') || ''; } catch (_) { return ''; }
  });
  const [newTourYoutubeChannelLogo, setNewTourYoutubeChannelLogo] = useState(() => {
    try { return localStorage.getItem('cricket_youtube_channel_logo') || ''; } catch (_) { return ''; }
  });

  // Current active tournament details tab
  const [tourTab, setTourTab] = useState<'teams' | 'matches' | 'standings' | 'venue-scheduler' | 'stats-leaderboards' | 'ai-insights' | 'prize-money'>('teams');
  
  // Standings view subtab (Live championship standings vs Brackets vs Sandbox/Simulator)
  const [standingsTabMode, setStandingsTabMode] = useState<'live' | 'brackets' | 'sandbox'>('live');
  const [h2hTeam1Id, setH2hTeam1Id] = useState<string>('');
  const [h2hTeam2Id, setH2hTeam2Id] = useState<string>('');

  // CricHeroes & Cricbuzz Competitive Features (Dream Team XI & Public Share Hub)
  const [showDreamTeamModal, setShowDreamTeamModal] = useState(false);
  const [showPublicShareModal, setShowPublicShareModal] = useState(false);

  // Past Results, Team Filter & Match Scorecard Modal
  const [matchStatusFilter, setMatchStatusFilter] = useState<'all' | 'completed' | 'live' | 'scheduled'>('all');
  const [matchTeamFilter, setMatchTeamFilter] = useState<string>('all');
  const [selectedScorecardMatch, setSelectedScorecardMatch] = useState<TournamentMatch | null>(null);
  const [showScorecardModal, setShowScorecardModal] = useState<boolean>(false);

  // Match Award Certificates Modal (Winning Team, Participant Team, Player of Match, Best Batsman, Best Bowler)
  const [showMatchAwardCertModal, setShowMatchAwardCertModal] = useState<boolean>(false);
  const [matchAwardCertData, setMatchAwardCertData] = useState<MatchCertificateData | null>(null);
  const [initialMatchAwardType, setInitialMatchAwardType] = useState<AwardType>('potm');

  const handleOpenMatchAwardCertificates = (m: TournamentMatch, defaultAward: AwardType = 'potm') => {
    if (!activeTournament) return;
    const teamAObj = activeTournament.teams.find(t => t.id === m.teamAId || t.name === m.teamAName);
    const teamBObj = activeTournament.teams.find(t => t.id === m.teamBId || t.name === m.teamBName);

    const winner = m.winnerId === m.teamAId 
      ? m.teamAName 
      : (m.winnerId === m.teamBId 
          ? m.teamBName 
          : (m.winReason?.includes(m.teamAName) 
              ? m.teamAName 
              : (m.winReason?.includes(m.teamBName) ? m.teamBName : (m.teamAName || 'Winner'))));

    const runnerUp = winner === m.teamAName ? m.teamBName : m.teamAName;

    // Squad players for squad batch certification (winning team squad + participant squad)
    const squadPlayersA = (teamAObj?.players || []).map(p => ({
      name: p,
      team: m.teamAName,
      role: 'Player',
      isWinner: winner === m.teamAName
    }));
    const squadPlayersB = (teamBObj?.players || []).map(p => ({
      name: p,
      team: m.teamBName,
      role: 'Player',
      isWinner: winner === m.teamBName
    }));

    const potmName = (m.manOfTheMatch && m.manOfTheMatch.trim() && m.manOfTheMatch !== 'N/A') 
      ? m.manOfTheMatch.trim() 
      : (winner ? `${winner} Star Player` : 'Star Player');

    const stageStr = String(m.stage || (m as any).round || '').trim();
    const isSemiOrQuarter = stageStr.toLowerCase().includes('semi') || stageStr.toLowerCase().includes('quarter') || stageStr.toLowerCase().includes('eliminat') || stageStr.toLowerCase().includes('qualifier') || stageStr.toLowerCase().includes('playoff');
    const isFinal = !isSemiOrQuarter && (stageStr.toLowerCase() === 'final' || stageStr.toLowerCase() === 'grand final' || stageStr.toLowerCase().endsWith(' final'));

    const certData: MatchCertificateData = {
      matchId: m.id,
      tournamentName: activeTournament.name || 'Gully Premier League 2026',
      matchDate: m.date || new Date().toISOString().split('T')[0],
      venue: m.venue || (activeTournament as any).venue || 'Tournament Arena',
      teamA: m.teamAName,
      teamB: m.teamBName,
      winner: winner,
      winReason: m.winReason || (winner ? `${winner} won the match` : 'Match Completed'),
      matchStage: stageStr || undefined,
      isFinalMatch: isFinal,
      playerOfTheMatch: {
        name: potmName,
        runs: 0,
        wickets: 0,
        points: 50
      },
      bestBatsman: {
        name: potmName,
        runs: 0,
        wickets: 0,
        points: 40
      },
      bestBowler: {
        name: `${winner} Star Bowler`,
        runs: 0,
        wickets: 0,
        points: 40
      },
      squadPlayers: [...squadPlayersA, ...squadPlayersB]
    };

    setMatchAwardCertData(certData);
    setInitialMatchAwardType(defaultAward);
    setShowMatchAwardCertModal(true);
  };

  // Sync approved players list in real-time
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([]);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_players'), (snap) => {
      const list: any[] = [];
      snap.forEach((docSnap) => {
        const p = docSnap.data();
        if (p.approvalStatus === 'approved' || p.isVerified) {
          list.push({ ...p, id: docSnap.id });
        }
      });
      setApprovedPlayers(list);
    }, (error) => {
      console.warn("Failed to subscribe to approved players in tournament:", error);
    });
    return () => unsub();
  }, []);

  // Listen for Captain 15-player squad submission deep links in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'submit_squad' || params.get('squad_submit')) {
        const targetTourId = params.get('tour_id');
        if (targetTourId) {
          setActiveTournamentId(targetTourId);
        }
        setLocalTeamsModalInitialTab('submit-squad');
        setShowLocalTeamsModal(true);
      }
    }
  }, []);

  // Team editor state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [teamFormName, setTeamFormName] = useState('');

  // Local Cricket Teams & 1-Click Setup states
  const [showLocalTeamsModal, setShowLocalTeamsModal] = useState(false);
  const [localTeamsModalInitialTab, setLocalTeamsModalInitialTab] = useState<'local-teams' | 'send-link' | 'submit-squad' | 'live-setup'>('local-teams');
  const [createTourAutoLocalTeams, setCreateTourAutoLocalTeams] = useState(false);
  const [teamFormCaptain, setTeamFormCaptain] = useState('');
  const [teamFormPlayersText, setTeamFormPlayersText] = useState('');
  const [teamFormLogo, setTeamFormLogo] = useState<string>('');
  const [teamFormPlayerPhotos, setTeamFormPlayerPhotos] = useState<Record<string, string>>({});

  // Edit tournament states
  const [showEditTourModal, setShowEditTourModal] = useState(false);
  const [editTourName, setEditTourName] = useState('');
  const [editTourFormat, setEditTourFormat] = useState<'T20' | 'ODI' | 'Test' | 'Box Cricket' | 'Custom'>('T20');
  const [editTourCustomOvers, setEditTourCustomOvers] = useState<number>(10);
  const [editTourCustomRules, setEditTourCustomRules] = useState(''); // Edit custom rules
  const [editTourTeamCount, setEditTourTeamCount] = useState<number>(4);
  const [editTourType, setEditTourType] = useState<'league' | 'knockout' | 'group-stage' | 'double-elimination'>('league');
  const [editTourDate, setEditTourDate] = useState('');
  const [editTourLogo, setEditTourLogo] = useState<string>('');
  const [editTourGroundVenue, setEditTourGroundVenue] = useState('Shivaji Maharaj Ground (Turf)');
  const [editTourUmpire1Name, setEditTourUmpire1Name] = useState('Umesh Shastri');
  const [editTourUmpire1Photo, setEditTourUmpire1Photo] = useState('');
  const [editTourUmpire2Name, setEditTourUmpire2Name] = useState('Nitin Gadkari');
  const [editTourUmpire2Photo, setEditTourUmpire2Photo] = useState('');
  const [editTourScoreboardManagerName, setEditTourScoreboardManagerName] = useState('Ravi Shastri Jnr');
  const [editTourScoreboardManagerPhoto, setEditTourScoreboardManagerPhoto] = useState('');
  const [editTourCommentatorName, setEditTourCommentatorName] = useState('Harsha Bhogle (Live)');
  const [editTourCommentatorPhoto, setEditTourCommentatorPhoto] = useState('');
  const [editTourYoutubeChannelName, setEditTourYoutubeChannelName] = useState('');
  const [editTourYoutubeChannelLogo, setEditTourYoutubeChannelLogo] = useState('');

  // Tournament Prize Money Manager modal
  const [showTourPrizeModal, setShowTourPrizeModal] = useState<boolean>(false);

  // Match Banner Modal state
  const [selectedMatchForBanner, setSelectedMatchForBanner] = useState<TournamentMatch | null>(null);

  // Tournament Points Table configuration states for Create Modal
  const [newTourWinPoints, setNewTourWinPoints] = useState<number>(2);
  const [newTourTiePoints, setNewTourTiePoints] = useState<number>(1);
  const [newTourLossPoints, setNewTourLossPoints] = useState<number>(0);
  const [newTourQualSpots, setNewTourQualSpots] = useState<number>(4);

  // Tournament Points Table configuration states for Edit Modal
  const [editTourWinPoints, setEditTourWinPoints] = useState<number>(2);
  const [editTourTiePoints, setEditTourTiePoints] = useState<number>(1);
  const [editTourLossPoints, setEditTourLossPoints] = useState<number>(0);
  const [editTourQualSpots, setEditTourQualSpots] = useState<number>(4);

  // Manual Match Scheduling Modal
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showResetScheduleModal, setShowResetScheduleModal] = useState(false); // Reset schedule modal state
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null); // Custom confirmation state for team deletion
  const [manualMatchTeamMode, setManualMatchTeamMode] = useState<'existing' | 'custom'>('existing');
  const [manualMatchTeamAId, setManualMatchTeamAId] = useState('');
  const [manualMatchTeamBId, setManualMatchTeamBId] = useState('');
  const [manualCustomTeamAName, setManualCustomTeamAName] = useState('');
  const [manualCustomTeamBName, setManualCustomTeamBName] = useState('');
  const [manualMatchError, setManualMatchError] = useState<string | null>(null);
  const [manualMatchDate, setManualMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualMatchTime, setManualMatchTime] = useState('10:00 AM');
  const [manualMatchVenue, setManualMatchVenue] = useState('Shivaji Maharaj Ground (Turf)');
  const [manualMatchStage, setManualMatchStage] = useState('League');
  const [manualMatchBannerUrl, setManualMatchBannerUrl] = useState('');

  // Match result updater modal
  const [updatingMatch, setUpdatingMatch] = useState<TournamentMatch | null>(null);
  const [matchScoreA, setMatchScoreA] = useState('');
  const [matchScoreB, setMatchScoreB] = useState('');
  const [matchOversA, setMatchOversA] = useState('10');
  const [matchOversB, setMatchOversB] = useState('10');
  const [matchWinnerId, setMatchWinnerId] = useState<string>('');
  const [matchWinReason, setMatchWinReason] = useState('');
  const [matchMoM, setMatchMoM] = useState('');

  // Individual match schedule editor
  const [editingScheduleMatch, setEditingScheduleMatch] = useState<TournamentMatch | null>(null);
  const [schedDate, setSchedDate] = useState('');
  const [schedTime, setSchedTime] = useState('');
  const [schedVenue, setSchedVenue] = useState('');
  const [schedBannerUrl, setSchedBannerUrl] = useState('');

  // AI Insights states
  const [aiMatchSelection, setAiMatchSelection] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPredictionContent, setAiPredictionContent] = useState<string>('');
  const [aiFantasyContent, setAiFantasyContent] = useState<string>('');
  const [aiNotification, setAiNotification] = useState<string | null>(null);

  // Quick Match Editor and Download PDF States
  const [quickEditMatch, setQuickEditMatch] = useState<TournamentMatch | null>(null);
  const [quickEditDate, setQuickEditDate] = useState('');
  const [quickEditTime, setQuickEditTime] = useState('');
  const [quickEditVenue, setQuickEditVenue] = useState('');
  const [quickEditStatus, setQuickEditStatus] = useState<'scheduled' | 'live' | 'completed'>('scheduled');
  const [quickEditBannerUrl, setQuickEditBannerUrl] = useState('');

  // Load and sync tournaments with Firestore in a loop-proof way
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_tournaments'), (snap) => {
      const dbList: Tournament[] = [];
      snap.forEach((docSnap) => {
        const tid = docSnap.id;
        const data = docSnap.data() as Tournament;
        if (!isTournamentDeleted(tid) && !isTournamentDeleted(data?.id)) {
          dbList.push({ ...data, id: tid });
        }
      });

      setTournaments((prev) => {
        // Read local tournaments as well so no locally completed match is missed
        let localList: Tournament[] = [];
        try {
          const raw = localStorage.getItem('gully_tournaments_v1');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              localList = parsed.filter((t: any) => t && t.id && !isTournamentDeleted(t.id));
            }
          }
        } catch (_) {}

        // Filter dbList based on creator/tenant
        let filteredMerged = [...dbList];
        if (user && user.email) {
          const isAdmin = user.email.toLowerCase() === 'shubhamhingane7719@gmail.com' || user.email.toLowerCase().includes('admin');
          if (!isAdmin) {
            filteredMerged = dbList.filter(t => !t.createdBy || t.createdBy === user.email || t.createdBy === user.uid);
          }
        }

        // Merge dbList with any tournaments in our local state (including newly created ones)
        prev.forEach((localT) => {
          if (!isTournamentDeleted(localT.id) && !filteredMerged.some(m => m.id === localT.id)) {
            filteredMerged.push(localT);
          }
        });
        localList.forEach((localT) => {
          if (!isTournamentDeleted(localT.id) && !filteredMerged.some(m => m.id === localT.id)) {
            filteredMerged.push(localT);
          }
        });

        // CRITICAL FIX: Merge individual matches and teams so that locally scheduled matches, newly added teams, completed status, winner, winReason, and scores from local are NEVER erased by older remote data
        const mergedTournaments = filteredMerged.map((newT) => {
          const localT = prev.find(p => p.id === newT.id) || localList.find(l => l.id === newT.id);
          if (!localT) return newT;

          // Merge teams: Keep all teams from newT, plus any teams added locally not yet in newT
          const newTTeamIds = new Set((newT.teams || []).map(t => t.id));
          const localOnlyTeams = (localT.teams || []).filter(ot => ot && !newTTeamIds.has(ot.id));
          const mergedTeams = [...(newT.teams || []), ...localOnlyTeams];

          // Merge matches: Keep all matches from newT, plus any matches scheduled locally not yet in newT
          const newTMatchIds = new Set((newT.matches || []).map(m => m.id));
          const localOnlyMatches = (localT.matches || []).filter(om => om && !newTMatchIds.has(om.id));

          const mergedMatches = (newT.matches || []).map((nm) => {
            const om = (localT.matches || []).find(m => m.id === nm.id);
            if (!om) return nm;

            const omCompleted = om.status === 'completed' || !!om.winner || (!!om.scoreA && om.scoreA !== '0/0');
            const nmCompleted = nm.status === 'completed' || !!nm.winner || (!!nm.scoreA && nm.scoreA !== '0/0');

            if (omCompleted && !nmCompleted) {
              return { ...nm, ...om };
            }
            return {
              ...nm,
              date: om.date || nm.date,
              time: om.time || nm.time,
              venue: om.venue || nm.venue,
              scoreA: nm.scoreA || om.scoreA,
              scoreB: nm.scoreB || om.scoreB,
              oversA: nm.oversA || om.oversA,
              oversB: nm.oversB || om.oversB,
              winner: nm.winner || om.winner,
              winnerId: nm.winnerId || om.winnerId,
              winReason: nm.winReason || om.winReason,
              manOfTheMatch: nm.manOfTheMatch || om.manOfTheMatch,
              status: (nm.status === 'completed' || om.status === 'completed') ? 'completed' : (om.status === 'live' ? 'live' : nm.status),
              matchBannerUrl: om.matchBannerUrl || nm.matchBannerUrl
            };
          });

          return {
            ...newT,
            teams: mergedTeams,
            matches: [...mergedMatches, ...localOnlyMatches],
            status: (newT.status === 'completed' || localT.status === 'completed') ? 'completed' : newT.status,
            winnerTeamName: newT.winnerTeamName || localT.winnerTeamName,
            updatedAt: Math.max(newT.updatedAt || 0, localT.updatedAt || 0)
          };
        });

        return mergedTournaments.filter(t => t && t.id && !isTournamentDeleted(t.id));
      });
    }, (error) => {
      console.warn("Failed to subscribe to tournaments in firestore:", error);
    });
    return () => unsub();
  }, []);

  // Listen for local and external tournament updates in real time
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('gully_tournaments_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setTournaments(parsed.filter((t: any) => t && t.id && !isTournamentDeleted(t.id)));
          }
        }
      } catch (e) {
        console.warn('Failed reading gully_tournaments_v1 on update event:', e);
      }
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

  // Persistence side-effect - saves locally AND archives directly in Firestore
  useEffect(() => {
    const validTournaments = tournaments.filter(t => t && t.id && !isTournamentDeleted(t.id));
    try {
      localStorage.setItem('gully_tournaments_v1', JSON.stringify(validTournaments));
    } catch (e) {
      console.warn('LocalStorage gully_tournaments_v1 write blocked:', e);
    }
    if (isFirestoreQuotaExhausted()) return;
    validTournaments.forEach((t) => {
      setDoc(doc(db, 'cricket_tournaments', t.id), t).catch((err) => {
        if (isQuotaError(err)) {
          recordFirestoreQuotaExhaustion(60);
          console.warn("Firestore quota limit reached. Tournaments safely kept in local storage.");
        } else {
          console.warn("Failed to backup tournament to Firestore:", err);
        }
      });
    });
  }, [tournaments]);

  useEffect(() => {
    try {
      if (activeTournamentId) {
        localStorage.setItem('gully_active_tournament_id', activeTournamentId);
      } else {
        localStorage.removeItem('gully_active_tournament_id');
      }
    } catch (e) {
      console.warn('LocalStorage active tournament id update/removal blocked:', e);
    }
  }, [activeTournamentId]);

  // Global ESC key listener to safely dismiss open dialogs across all devices
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCreateModal) setShowCreateModal(false);
        if (showEditTourModal) setShowEditTourModal(false);
        if (showAddTeamModal) setShowAddTeamModal(false);
        if (showCreateMatchModal) setShowCreateMatchModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, showEditTourModal, showAddTeamModal, showCreateMatchModal]);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  // Auto-sync activeTournamentId with available tournaments
  useEffect(() => {
    if (tournaments.length > 0) {
      if (!activeTournamentId || !tournaments.some(t => t.id === activeTournamentId)) {
        setActiveTournamentId(tournaments[0].id);
      }
    }
  }, [tournaments, activeTournamentId]);

  // Notification notification system
  const triggerNotification = (msg: string) => {
    setAiNotification(msg);
    setTimeout(() => setAiNotification(null), 3000);
  };

  // Automated 1-Click Live Scoring Configuration Trigger
  const handleTriggerLiveScore = (m: TournamentMatch) => {
    if (!activeTournament || !activeTournamentId) return;

    // 1. Resolve Tournament Name & Logo
    const tourName = activeTournament.name?.trim() || 'Gully Premier Championship';
    let tourLogo = normalizeImageUrl(activeTournament.logo || '');
    if (!tourLogo) {
      try {
        tourLogo = normalizeImageUrl(localStorage.getItem('cricket_tournament_logo') || '');
      } catch (_) {}
    }

    // 2. Resolve Ground / Venue
    let groundVenue = m.venue;
    if (!groundVenue || groundVenue === 'Local gully stadium' || groundVenue === 'Grand Arena' || groundVenue === 'Pitch 1 Ground' || groundVenue === 'Gully Pitch A') {
      groundVenue = activeTournament.groundName || activeTournament.venue || '';
    }
    if (!groundVenue) {
      try {
        const savedGrounds = localStorage.getItem(`gully_grounds_${activeTournament.id}`);
        if (savedGrounds) {
          const parsed = JSON.parse(savedGrounds);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
            groundVenue = parsed[0].name;
          }
        }
      } catch (_) {}
    }
    if (!groundVenue) {
      groundVenue = 'Shivaji Maharaj Ground (Turf)';
    }

    // 3. Resolve Match Officials & Broadcast Crew
    let u1Name = m.umpire1 || activeTournament.umpire1Name || '';
    let u1Photo = normalizeImageUrl(activeTournament.umpire1Photo || '');
    let u2Name = m.umpire2 || activeTournament.umpire2Name || '';
    let u2Photo = normalizeImageUrl(activeTournament.umpire2Photo || '');
    let scName = m.scorer || activeTournament.scoreboardManagerName || '';
    let scPhoto = normalizeImageUrl(activeTournament.scoreboardManagerPhoto || '');
    let commName = activeTournament.commentatorName || '';
    let commPhoto = normalizeImageUrl(activeTournament.commentatorPhoto || '');
    let ytLogo = normalizeImageUrl(activeTournament.youtubeChannelLogo || '');
    let ytName = activeTournament.youtubeChannelName || '';

    // Check saved officials in localStorage if tournament fields aren't populated
    if (!u1Name || !u2Name || !scName) {
      try {
        const savedOff = localStorage.getItem(`gully_officials_${activeTournament.id}`);
        if (savedOff) {
          const parsedOff = JSON.parse(savedOff);
          if (Array.isArray(parsedOff)) {
            const onField = parsedOff.find((o: any) => o.role === 'On-Field Umpire');
            const leg = parsedOff.find((o: any) => o.role === 'Leg Umpire');
            const scorer = parsedOff.find((o: any) => o.role === 'Official Scorer');
            if (!u1Name && onField) u1Name = onField.name;
            if (!u2Name && leg) u2Name = leg.name;
            if (!scName && scorer) scName = scorer.name;
          }
        }
      } catch (_) {}
    }

    if (!u1Name) u1Name = 'Umesh Shastri';
    if (!u2Name) u2Name = 'Nitin Gadkari';
    if (!scName) scName = 'Ravi Shastri Jnr';
    if (!commName) commName = 'Harsha Bhogle (Live)';

    if (!ytLogo) {
      try {
        ytLogo = normalizeImageUrl(localStorage.getItem('cricket_youtube_channel_logo') || '');
      } catch (_) {}
    }
    if (!ytName) {
      try {
        ytName = localStorage.getItem('cricket_youtube_channel_name') || '';
      } catch (_) {}
    }

    // 4. Resolve Teams, Logos & Squads
    const teamAObj = activeTournament.teams?.find(t => t.id === m.teamAId || t.name === m.teamAName);
    const teamBObj = activeTournament.teams?.find(t => t.id === m.teamBId || t.name === m.teamBName);

    const teamALogo = normalizeImageUrl(teamAObj?.logo || '');
    const teamBLogo = normalizeImageUrl(teamBObj?.logo || '');
    const teamASquad = (teamAObj?.players || []).map(p => typeof p === 'string' ? p : p.name);
    const teamBSquad = (teamBObj?.players || []).map(p => typeof p === 'string' ? p : p.name);
    const mergedPlayerPhotos = { ...(teamAObj?.playerPhotos || {}), ...(teamBObj?.playerPhotos || {}) };

    const overs = activeTournament.customOvers || (activeTournament.format === 'T20' ? 20 : activeTournament.format === 'Box Cricket' ? 8 : 10);

    // 5. Resolve Tournament Prizes & Match Banner
    const tourPrizes = (activeTournament.prizes && activeTournament.prizes.length > 0)
      ? activeTournament.prizes
      : getTournamentPrizesByTournamentId(activeTournamentId);

    const matchBanner = normalizeImageUrl(m.matchBannerUrl || '');

    // Set match status to 'live' in the tournament registry so UI reflects live scoring
    setTournaments(prev => {
      const next = prev.map(t => {
        if (t.id !== activeTournamentId) return t;
        return {
          ...t,
          status: 'active' as const,
          matches: t.matches.map(item => item.id === m.id ? { ...item, status: 'live' as const } : item)
        };
      });
      try {
        localStorage.setItem('gully_tournaments_v1', JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    const config: TournamentLiveScoreConfig = {
      teamA: m.teamAName || 'Team A',
      teamB: m.teamBName || 'Team B',
      overs,
      customRules: activeTournament.customRules,
      tournamentId: activeTournamentId,
      matchId: m.id,
      tournamentName: tourName,
      tournamentLogo: tourLogo,
      groundName: groundVenue,
      venue: groundVenue,
      seriesName: tourName,
      umpire1Name: u1Name,
      umpire1Photo: u1Photo,
      umpire2Name: u2Name,
      umpire2Photo: u2Photo,
      scoreboardManagerName: scName,
      scoreboardManagerPhoto: scPhoto,
      commentatorName: commName,
      commentatorPhoto: commPhoto,
      youtubeChannelLogo: ytLogo,
      youtubeChannelName: ytName,
      teamALogo,
      teamBLogo,
      teamASquad,
      teamBSquad,
      playerPhotos: mergedPlayerPhotos,
      matchBannerUrl: matchBanner,
      prizes: tourPrizes,
      onSave: (res) => {
        let updatedList: Tournament[] = [];
        setTournaments((prev) => {
          let listToUse = Array.isArray(prev) && prev.length > 0 ? prev : [];
          if (listToUse.length === 0 && typeof window !== 'undefined') {
            try {
              const saved = localStorage.getItem('gully_tournaments_v1');
              if (saved) listToUse = JSON.parse(saved);
            } catch (_) {}
          }

          const targetTourId = activeTournamentId || (activeTournament && activeTournament.id);
          const nextTournaments = listToUse.map(t => {
            if (t.id !== targetTourId) return t;
            const nextMatches = t.matches.map(matchObj => {
              if (matchObj.id !== m.id) return matchObj;
              const winTeam = res.winner || (res.winnerId === m.teamAId ? m.teamAName : (res.winnerId === m.teamBId ? m.teamBName : ''));
              return {
                ...matchObj,
                scoreA: `${res.runsA}/${res.wicketsA}`,
                scoreB: `${res.runsB}/${res.wicketsB}`,
                oversA: String(overs),
                oversB: String(overs),
                winnerId: res.winner === m.teamAName ? m.teamAId : (res.winner === m.teamBName ? m.teamBId : (res.winnerId || null)),
                winner: winTeam,
                winReason: res.winReason || (winTeam ? `${winTeam} won the match` : "Match Completed"),
                manOfTheMatch: res.manOfTheMatch || "Live Match Performer",
                status: 'completed' as const,
                updatedAt: Date.now()
              };
            });

            // Check if tournament completed
            let tournamentCompleted = false;
            let mainWinner: string | null = t.winnerTeamName;
            const finalM = nextMatches.find(matchItem => 
              matchItem.stage?.toLowerCase()?.includes('final')
            );

            if (finalM && finalM.status === 'completed') {
              tournamentCompleted = true;
              mainWinner = res.winner || t.teams.find(tm => tm.id === finalM.winnerId)?.name || finalM.teamAName;
            } else if (nextMatches.length > 0 && nextMatches.every(matchItem => matchItem.status === 'completed')) {
              tournamentCompleted = true;
              const table = computePointsTable(t.teams, nextMatches);
              if (table[0]) mainWinner = table[0].name;
            }

            if (tournamentCompleted) {
              triggerNotification(`🏆 Tournament Final Match Completed! ${mainWinner} are Champions! Best Batsman, Best Bowler & Man of the Series awards have been calculated!`);
            }

            return {
              ...t,
              matches: nextMatches,
              status: tournamentCompleted ? 'completed' : t.status,
              winnerTeamName: tournamentCompleted ? mainWinner : t.winnerTeamName,
              updatedAt: Date.now()
            };
          });

          updatedList = nextTournaments;

          try {
            localStorage.setItem('gully_tournaments_v1', JSON.stringify(nextTournaments));
            window.dispatchEvent(new CustomEvent('gully_tournaments_updated', { detail: { tournamentId: targetTourId, matchId: m.id } }));
            window.dispatchEvent(new CustomEvent('cricket_matches_updated'));
            window.dispatchEvent(new Event('storage'));
          } catch (_) {}

          return nextTournaments;
        });

        if (updatedList.length > 0) {
          const targetTour = updatedList.find(t => t.id === (activeTournamentId || (activeTournament && activeTournament.id)));
          if (targetTour && !isFirestoreQuotaExhausted()) {
            setDoc(doc(db, 'cricket_tournaments', targetTour.id), targetTour, { merge: true }).catch(() => {});
          }
        }

        triggerNotification("Match result synchronized from live score!");
      }
    };

    if (onStartLiveScore) {
      onStartLiveScore(config);
    } else {
      // Direct scoreboard setup fallback
      const activeMatchObj = {
        id: `live_${m.id || Date.now()}`,
        teamA: m.teamAName || 'Team A',
        teamB: m.teamBName || 'Team B',
        oversLimit: overs,
        tossWinner: m.teamAName || 'Team A',
        tossChoice: 'bat',
        currentInningsNum: 1,
        innings1: null,
        innings2: null,
        status: 'setup',
        date: m.date || new Date().toISOString().split('T')[0],
        freeHitNext: false,
        teamALogo,
        teamBLogo,
        matchBannerUrl: matchBanner || undefined,
        teamASquad,
        teamBSquad,
        playerPhotos: mergedPlayerPhotos,
        tournamentId: activeTournamentId,
        tournamentMatchId: m.id,
        tournamentName: tourName,
        tournamentLogo: tourLogo || undefined,
        groundName: groundVenue,
        seriesName: tourName,
        umpire1Name: u1Name,
        umpire1Photo: u1Photo,
        umpire2Name: u2Name,
        umpire2Photo: u2Photo,
        scoreboardManagerName: scName,
        scoreboardManagerPhoto: scPhoto,
        commentatorName: commName,
        commentatorPhoto: commPhoto,
        youtubeChannelLogo: ytLogo,
        youtubeChannelName: ytName
      };
      try {
        localStorage.setItem('cricket_active_match', JSON.stringify(activeMatchObj));
        window.dispatchEvent(new CustomEvent('cricket_matches_updated'));
      } catch (_) {}
      triggerNotification(`Starting live score for ${m.teamAName} vs ${m.teamBName}...`);
    }
  };

  const handleImageUpload = (file: File, callback: (base64Str: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max_size = 800; // Optimize dimension for quick loading and safety

          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            callback(dataUrl);
          } else {
            callback(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const currentYear = new Date().getFullYear();
 
  // Create new tournament initialization
  const handleCreateTournament = () => {
    if (!newTourName.trim()) {
      alert("Please provide a name for the tournament.");
      return;
    }
 
    let initialTeams: TournamentTeam[] = [];
    if (createTourAutoLocalTeams) {
      initialTeams = PRESET_LOCAL_CRICKET_TEAMS.slice(0, Number(newTourTeamCount)).map((lt, idx) => ({
        id: `team_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name: lt.name,
        captain: lt.captain,
        players: [...lt.players],
        logo: lt.logo
      }));
    }

    const groundVenue = newTourGroundVenue.trim() || 'Shivaji Maharaj Ground (Turf)';
    const u1 = newTourUmpire1Name.trim() || 'Umesh Shastri';
    const u2 = newTourUmpire2Name.trim() || 'Nitin Gadkari';
    const sc = newTourScoreboardManagerName.trim() || 'Ravi Shastri Jnr';
    const comm = newTourCommentatorName.trim() || 'Harsha Bhogle (Live)';

    if (tournamentLogoStr) {
      try { localStorage.setItem('cricket_tournament_logo', tournamentLogoStr); } catch (_) {}
    }
    if (newTourYoutubeChannelName) {
      try { localStorage.setItem('cricket_youtube_channel_name', newTourYoutubeChannelName); } catch (_) {}
    }
    if (newTourYoutubeChannelLogo) {
      try { localStorage.setItem('cricket_youtube_channel_logo', newTourYoutubeChannelLogo); } catch (_) {}
    }

    const newTour: Tournament = {
      id: `tour_${Date.now()}`,
      name: newTourName,
      teamCount: Number(newTourTeamCount),
      format: newTourFormat,
      customOvers: newTourFormat === 'Custom' ? Number(newTourCustomOvers) : undefined,
      logo: tournamentLogoStr || undefined,
      customRules: newTourCustomRules.trim() || undefined,
      type: newTourType,
      startDate: newTourDate,
      status: 'setup',
      teams: initialTeams,
      matches: [],
      winnerTeamName: null,
      createdBy: user?.email || user?.uid || 'anonymous',
      groundName: groundVenue,
      venue: groundVenue,
      umpire1Name: u1,
      umpire1Photo: newTourUmpire1Photo,
      umpire2Name: u2,
      umpire2Photo: newTourUmpire2Photo,
      scoreboardManagerName: sc,
      scoreboardManagerPhoto: newTourScoreboardManagerPhoto,
      commentatorName: comm,
      commentatorPhoto: newTourCommentatorPhoto,
      youtubeChannelName: newTourYoutubeChannelName.trim(),
      youtubeChannelLogo: newTourYoutubeChannelLogo,
      pointsConfig: {
        winPoints: Number(newTourWinPoints) || 2,
        tiePoints: Number(newTourTiePoints) || 1,
        lossPoints: Number(newTourLossPoints) || 0,
        qualificationSpots: Number(newTourQualSpots) || 4,
        enableNRR: true
      },
      prizes: getTournamentPrizesByTournamentId()
    };
 
    const updated = [...tournaments, newTour];
    setTournaments(updated);
    setActiveTournamentId(newTour.id);
    setShowCreateModal(false);
    setTourTab('teams');
 
    // Reset fields
    setNewTourName('');
    setTournamentLogoStr('');
    setNewTourCustomRules('');
    setCreateTourAutoLocalTeams(false);
    triggerNotification(
      initialTeams.length > 0 
        ? `Created tournament "${newTour.name}" with ${initialTeams.length} local cricket teams & 15-player squads!` 
        : `Created tournament "${newTour.name}"!`
    );
  };

  const deleteTournament = (id: string, name: string) => {
    // Initiate non-blocking environment-compliant custom dialog trigger
    setTournamentToDeleteState({ id, name });
  };

  const confirmDeleteTournament = (id: string, name: string) => {
    // 1. Permanently mark deleted in tombstone, purge from localStorage, and notify server & client listeners
    deleteLocalTournament(id);

    // 2. Immediately update state
    setTournaments(prev => prev.filter(t => t.id !== id));
    if (activeTournamentId === id) {
      setActiveTournamentId(null);
      localStorage.removeItem('gully_active_tournament_id');
    }

    // 3. Delete from Firestore permanently
    deleteDoc(doc(db, 'cricket_tournaments', id)).catch((err) => {
      console.warn("Error deleting tournament from Firestore:", err);
    });

    setTournamentToDeleteState(null);
    triggerNotification(`Deleted "${name}" permanently.`);
  };

  // Quick Match Edit Actions
  const handleOpenQuickEdit = (m: TournamentMatch) => {
    setQuickEditMatch(m);
    setQuickEditDate(m.date);
    setQuickEditTime(m.time);
    setQuickEditVenue(m.venue);
    setQuickEditStatus(m.status as any || 'scheduled');
    setQuickEditBannerUrl(m.matchBannerUrl || '');
  };

  const saveQuickEditMatchUpdate = () => {
    if (!activeTournamentId || !quickEditMatch) return;

    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return {
        ...t,
        matches: t.matches.map(m => 
          m.id === quickEditMatch.id 
            ? { ...m, date: quickEditDate, time: quickEditTime, venue: quickEditVenue, status: quickEditStatus, matchBannerUrl: quickEditBannerUrl || undefined }
            : m
        )
      };
    }));

    setQuickEditMatch(null);
    triggerNotification("Match details updated successfully! Banner configured for match setup.");
  };

  // Generate a gorgeous PDF scorecard using jsPDF and autoTable
  const generateMatchReportPDF = (m: TournamentMatch) => {
    try {
      triggerNotification("Generating PDF Match Report...");
      const doc = new jsPDF();

      // Page Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Emerald Green
      doc.text('GULLY TOURNAMENT SCORECARD', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
      if (activeTournament) {
        doc.text(`Tournament: ${activeTournament.name} (${activeTournament.format})`, 14, 30);
      }

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 34, 196, 34);

      // Match Title
      doc.setFontSize(16);
      doc.setTextColor(30);
      doc.setFont('Helvetica', 'bold');
      doc.text(`${m.teamAName} vs ${m.teamBName}`, 14, 43);

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Stage: ${m.stage}`, 14, 49);
      doc.text(`Scheduled: ${m.date} at ${m.time}`, 14, 54);
      doc.text(`Venue Ground: ${m.venue}`, 14, 59);

      // Result Section
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Match Result: ${m.winReason || 'Completed'}`, 14, 67);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(80);
      doc.text(`Player of the Match: ${m.manOfTheMatch || 'N/A'}`, 14, 73);

      // Custom Rules display on the PDF if present! (Requirement 1)
      let tableStartY = 85;
      if (activeTournament && activeTournament.customRules) {
        doc.setFillColor(245, 247, 250);
        // Let's draw a nice box for tournament rules
        const rulesLines = doc.splitTextToSize(`Tournament Custom Rules:\n${activeTournament.customRules}`, 180);
        const boxHeight = (rulesLines.length * 5) + 6;
        doc.rect(14, 78, 182, boxHeight, 'F');
        
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(120);
        doc.text(rulesLines, 18, 82);
        tableStartY = 78 + boxHeight + 10;
      }

      // Structure comparing overall performances using autoTable
      const tableRows = [
        [m.teamAName, m.scoreA || 'N/A', `${m.oversA || 'N/A'} ov`, m.winnerId === m.teamAId ? 'Winner 👑' : 'Runner-up'],
        [m.teamBName, m.scoreB || 'N/A', `${m.oversB || 'N/A'} ov`, m.winnerId === m.teamBId ? 'Winner 👑' : 'Runner-up']
      ];

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30);
      doc.text('Squad Match Summaries', 14, tableStartY - 2);

      autoTable(doc, {
        startY: tableStartY,
        head: [['Team / Franchise Name', 'Score/Wickets', 'Overs Allocated', 'Match standing']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 9.5 }
      });

      // Saving
      doc.save(`gully_scorecard_${m.teamAName}_vs_${m.teamBName}_${m.id}.pdf`);
      triggerNotification("Report PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF scorecard.");
    }
  };

  // Add or Edit Team
  const handleSaveTeam = () => {
    if (!activeTournamentId || !activeTournament) return;
    if (!teamFormName.trim()) {
      alert("Team Name is required");
      return;
    }

    const playerList = teamFormPlayersText
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const updatedTournaments = tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;

      let nextTeams = [...t.teams];
      if (editTeamId) {
        // Edit existing team
        nextTeams = nextTeams.map(tm => 
          tm.id === editTeamId 
            ? { ...tm, name: teamFormName.trim(), captain: teamFormCaptain.trim(), players: playerList, logo: teamFormLogo, playerPhotos: teamFormPlayerPhotos }
            : tm
        );
      } else {
        // Add new team
        if ((t.teams?.length || 0) >= t.teamCount) {
          alert(`This tournament configuration only allows up to ${t.teamCount} teams. Update tournament settings or create a new one.`);
          return t;
        }

        const newTeam: TournamentTeam = {
          id: `team_${Date.now()}`,
          name: teamFormName.trim(),
          captain: teamFormCaptain.trim(),
          players: playerList.length > 0 ? playerList : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
          logo: teamFormLogo,
          playerPhotos: teamFormPlayerPhotos
        };
        nextTeams.push(newTeam);
      }

      return {
        ...t,
        teams: nextTeams
      };
    });

    setTournaments(updatedTournaments);
    setShowAddTeamModal(false);
    setEditTeamId(null);
    setTeamFormName('');
    setTeamFormCaptain('');
    setTeamFormPlayersText('');
    setTeamFormLogo('');
    setTeamFormPlayerPhotos({});
    triggerNotification("Team details saved!");
  };

  const deleteTeam = (teamId: string, teamName: string) => {
    if (!activeTournamentId) return;
    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      const remainingTeams = t.teams.filter(tm => tm.id !== teamId);
      const remainingMatches = t.matches.filter(m => m.teamAId !== teamId && m.teamBId !== teamId);
      return {
        ...t,
        teams: remainingTeams,
        matches: remainingMatches,
        status: remainingTeams.length === 0 ? 'setup' : t.status
      };
    }));
    triggerNotification(`Removed ${teamName}`);
    setTeamToDelete(null);
  };

  // Auto-generate Schedule
  const generateSchedule = () => {
    if (!activeTournamentId || !activeTournament) return;
    const teams = activeTournament.teams;

    if (teams.length < 2) {
      alert("Add at least 2 teams to generate fixtures!");
      return;
    }

    const defaultTourVenue = activeTournament.groundName || activeTournament.venue || "Shivaji Maharaj Ground (Turf)";
    const u1 = activeTournament.umpire1Name || "Umesh Shastri";
    const u2 = activeTournament.umpire2Name || "Nitin Gadkari";
    const sc = activeTournament.scoreboardManagerName || "Ravi Shastri Jnr";

    if (activeTournament.type === 'league') {
      // Round Robin match schedule algorithm
      const matches: TournamentMatch[] = [];
      const len = teams.length;
      
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          matches.push({
            id: `match_${Date.now()}_${i}_${j}`,
            teamAId: teams[i].id,
            teamBId: teams[j].id,
            teamAName: teams[i].name,
            teamBName: teams[j].name,
            date: activeTournament.startDate,
            time: "10:00 AM",
            venue: defaultTourVenue,
            status: 'scheduled',
            scoreA: "",
            scoreB: "",
            oversA: "",
            oversB: "",
            winnerId: null,
            winReason: "",
            manOfTheMatch: "",
            stage: 'League',
            umpire1: u1,
            umpire2: u2,
            scorer: sc
          });
        }
      }

      const updatedTournaments = tournaments.map(t => {
        if (t.id !== activeTournamentId) return t;
        return {
          ...t,
          matches,
          status: 'active' as const
        };
      });
      setTournaments(updatedTournaments);
      try {
        localStorage.setItem('gully_tournaments_v1', JSON.stringify(updatedTournaments));
        const activeT = updatedTournaments.find(t => t.id === activeTournamentId);
        if (activeT && !isFirestoreQuotaExhausted()) {
          setDoc(doc(db, 'cricket_tournaments', activeTournamentId), activeT, { merge: true }).catch(() => {});
        }
      } catch (_) {}

      triggerNotification(`Round-robin schedule created! (${matches.length} matches) — Tap 'Start Scoring' on any match to launch scoreboard`);
      setTourTab('matches');
    } else {
      // Knockout bracket setup (Quarter/Semi/Final based on team count)
      const matches: TournamentMatch[] = [];
      const len = teams.length;

      // Shuffle teams randomly
      const shuffled = [...teams].sort(() => Math.random() - 0.5);

      if (len <= 4) {
        // Semi-Finals directly
        matches.push({
          id: `match_sf1_${Date.now()}`,
          teamAId: shuffled[0]?.id || "",
          teamBId: shuffled[1]?.id || "",
          teamAName: shuffled[0]?.name || "Qualifier A",
          teamBName: shuffled[1]?.name || "Qualifier B",
          date: activeTournament.startDate,
          time: "09:00 AM",
          venue: defaultTourVenue,
          status: shuffled[0] && shuffled[1] ? 'scheduled' : 'scheduled',
          scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "",
          stage: 'Semi-Final',
          umpire1: u1,
          umpire2: u2,
          scorer: sc
        });

        matches.push({
          id: `match_sf2_${Date.now()}`,
          teamAId: shuffled[2]?.id || "",
          teamBId: shuffled[3]?.id || "BYE",
          teamAName: shuffled[2]?.name || "Qualifier C",
          teamBName: shuffled[3]?.name || "BYE (Auto Proceed)",
          date: activeTournament.startDate,
          time: "02:00 PM",
          venue: defaultTourVenue,
          status: shuffled[2] && shuffled[3] ? 'scheduled' : 'completed',
          scoreA: shuffled[2] ? "Auto" : "", 
          scoreB: "", 
          oversA: "", 
          oversB: "", 
          winnerId: shuffled[2] ? shuffled[2].id : null, 
          winReason: shuffled[2] ? "BYE - Automatic Walkover" : "", 
          manOfTheMatch: "",
          stage: 'Semi-Final',
          umpire1: u1,
          umpire2: u2,
          scorer: sc
        });

        // Add Final empty shell
        matches.push({
          id: `match_f_${Date.now()}`,
          teamAId: "",
          teamBId: "",
          teamAName: "Winner of SF 1",
          teamBName: "Winner of SF 2",
          date: activeTournament.startDate,
          time: "04:30 PM",
          venue: defaultTourVenue,
          status: 'scheduled',
          scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "",
          stage: 'Final',
          umpire1: u1,
          umpire2: u2,
          scorer: sc
        });

      } else {
        // Quarter Finals (up to 8 teams supported)
        const qCount = Math.min(len, 8);
        for (let i = 0; i < qCount; i += 2) {
          const tA = shuffled[i];
          const tB = shuffled[i + 1];
          matches.push({
            id: `match_qf_${i}_${Date.now()}`,
            teamAId: tA?.id || "",
            teamBId: tB?.id || "BYE",
            teamAName: tA?.name || "Qualifier TBD",
            teamBName: tB?.name || "BYE",
            date: activeTournament.startDate,
            time: `0${9 + (i/2)*2}:00 AM`,
            venue: defaultTourVenue,
            status: tA && tB ? 'scheduled' : 'completed',
            scoreA: tA ? "Auto" : "", scoreB: "", oversA: "", oversB: "", 
            winnerId: tA ? tA.id : null, winReason: tA ? "Advancement via Bye" : "", manOfTheMatch: "",
            stage: 'Quarter-Final',
            umpire1: u1,
            umpire2: u2,
            scorer: sc
          });
        }

        // SF shells
        matches.push({ id: `match_sf1_${Date.now()}`, teamAId: "", teamBId: "", teamAName: "Winner of QF 1", teamBName: "Winner of QF 2", date: activeTournament.startDate, time: "11:00 AM", venue: defaultTourVenue, status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "", stage: 'Semi-Final', umpire1: u1, umpire2: u2, scorer: sc });
        matches.push({ id: `match_sf2_${Date.now()}`, teamAId: "", teamBId: "", teamAName: "Winner of QF 3", teamBName: "Winner of QF 4", date: activeTournament.startDate, time: "02:00 PM", venue: defaultTourVenue, status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "", stage: 'Semi-Final', umpire1: u1, umpire2: u2, scorer: sc });
        
        // Final shell
        matches.push({ id: `match_f_${Date.now()}`, teamAId: "", teamBId: "", teamAName: "Winner of SF 1", teamBName: "Winner of SF 2", date: activeTournament.startDate, time: "04:00 PM", venue: defaultTourVenue, status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "", stage: 'Final', umpire1: u1, umpire2: u2, scorer: sc });
      }

      const updatedTournaments = tournaments.map(t => {
        if (t.id !== activeTournamentId) return t;
        return {
          ...t,
          matches,
          status: 'active' as const
        };
      });
      setTournaments(updatedTournaments);
      try {
        localStorage.setItem('gully_tournaments_v1', JSON.stringify(updatedTournaments));
        const activeT = updatedTournaments.find(t => t.id === activeTournamentId);
        if (activeT && !isFirestoreQuotaExhausted()) {
          setDoc(doc(db, 'cricket_tournaments', activeTournamentId), activeT, { merge: true }).catch(() => {});
        }
      } catch (_) {}

      triggerNotification(`Knockout bracket constructed! (${matches.length} fixtures) — Tap 'Start Scoring' on any fixture to begin`);
      setTourTab('matches');
    }
  };

  const generateFixtures = generateSchedule;

  // Launch schedule editing modal
  const startEditSchedule = (m: TournamentMatch) => {
    setEditingScheduleMatch(m);
    setSchedDate(m.date);
    setSchedTime(m.time);
    setSchedVenue(m.venue);
    setSchedBannerUrl(m.matchBannerUrl || '');
  };

  const saveScheduleUpdate = () => {
    if (!activeTournamentId || !editingScheduleMatch) return;

    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return {
        ...t,
        matches: t.matches.map(m => 
          m.id === editingScheduleMatch.id 
            ? { ...m, date: schedDate, time: schedTime, venue: schedVenue, matchBannerUrl: schedBannerUrl || undefined }
            : m
        )
      };
    }));

    setEditingScheduleMatch(null);
    triggerNotification("Match schedule & banner updated!");
  };

  const openManualMatchModal = () => {
    setManualMatchError(null);
    const currentTour = activeTournament || tournaments.find(t => t.id === activeTournamentId) || (tournaments.length > 0 ? tournaments[0] : null);
    if (currentTour && currentTour.id !== activeTournamentId) {
      setActiveTournamentId(currentTour.id);
    }

    const rawTeams = currentTour?.teams || [];
    const validTeams: TournamentTeam[] = (Array.isArray(rawTeams) ? rawTeams : [])
      .filter(Boolean)
      .map((t: any, idx: number) => {
        if (typeof t === 'string') {
          return {
            id: `team_${idx}_${String(t).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: String(t).trim() || `Team ${idx + 1}`,
            captain: `${String(t).trim() || `Team ${idx + 1}`} Captain`,
            players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11']
          };
        }
        const name = String(t?.name || t?.teamName || t?.title || `Team ${idx + 1}`).trim();
        const id = t?.id ? String(t.id) : `team_${idx}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        return {
          id,
          name,
          captain: t?.captain || `${name} Captain`,
          players: Array.isArray(t?.players) && t.players.length > 0 ? t.players : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
          logo: t?.logo,
          playerPhotos: t?.playerPhotos
        };
      });

    if (validTeams.length >= 2) {
      setManualMatchTeamMode('existing');
      setManualMatchTeamAId(validTeams[0].id);
      setManualMatchTeamBId(validTeams[1].id);
      setManualCustomTeamAName(validTeams[0].name || 'Team 1');
      setManualCustomTeamBName(validTeams[1].name || 'Team 2');
    } else if (validTeams.length === 1) {
      setManualMatchTeamMode('custom');
      setManualMatchTeamAId(validTeams[0].id);
      setManualCustomTeamAName(validTeams[0].name || 'Team 1');
      setManualMatchTeamBId('');
      setManualCustomTeamBName('Opponent XI');
    } else {
      setManualMatchTeamMode('custom');
      setManualMatchTeamAId('');
      setManualMatchTeamBId('');
      setManualCustomTeamAName('Shivaji Warriors');
      setManualCustomTeamBName('Maratha Challengers');
    }
    setManualMatchDate(new Date().toISOString().split('T')[0]);
    setManualMatchTime('10:00 AM');
    setManualMatchVenue(currentTour?.groundName || currentTour?.venue || 'Shivaji Maharaj Ground (Turf)');
    setManualMatchStage('League');
    setManualMatchBannerUrl('');
    setShowCreateMatchModal(true);
  };

  const handleCreateManualMatch = () => {
    const currentTour = activeTournament || tournaments.find(t => t.id === activeTournamentId) || (tournaments.length > 0 ? tournaments[0] : null);
    const tourId = activeTournamentId || currentTour?.id;
    if (!tourId || !currentTour) {
      setManualMatchError("No tournament selected. Please select or create a tournament first.");
      return;
    }
    setManualMatchError(null);

    let finalTeamAId = manualMatchTeamAId;
    let finalTeamBId = manualMatchTeamBId;
    let teamAName = '';
    let teamBName = '';

    const rawTeams = currentTour.teams || [];
    const existingTeams: TournamentTeam[] = (Array.isArray(rawTeams) ? rawTeams : [])
      .filter(Boolean)
      .map((t: any, idx: number) => {
        if (typeof t === 'string') {
          return {
            id: `team_${idx}_${String(t).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: String(t).trim() || `Team ${idx + 1}`,
            captain: `${String(t).trim() || `Team ${idx + 1}`} Captain`,
            players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11']
          };
        }
        const name = String(t?.name || t?.teamName || `Team ${idx + 1}`).trim();
        const id = t?.id ? String(t.id) : `team_${idx}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        return {
          id,
          name,
          captain: t?.captain || `${name} Captain`,
          players: Array.isArray(t?.players) && t.players.length > 0 ? t.players : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
          logo: t?.logo,
          playerPhotos: t?.playerPhotos
        };
      });

    const newTeamsToAdd: TournamentTeam[] = [];

    if (manualMatchTeamMode === 'custom' || !finalTeamAId || !finalTeamBId || existingTeams.length < 2) {
      const nameA = (manualCustomTeamAName || '').trim() || 'Team A';
      const nameB = (manualCustomTeamBName || '').trim() || 'Team B';

      if (nameA.toLowerCase() === nameB.toLowerCase()) {
        setManualMatchError("A team cannot play against itself. Please specify two different team names.");
        return;
      }

      // Check if Team A exists in roster or create new team
      let matchedA = existingTeams.find(t => t && (t.id === finalTeamAId || (t.name && t.name.toLowerCase() === nameA.toLowerCase())));
      if (!matchedA) {
        matchedA = {
          id: `team_${Date.now()}_a_${Math.random().toString(36).substring(2, 6)}`,
          name: nameA,
          captain: `${nameA} Captain`,
          players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
          city: (currentTour as any).city || 'Local'
        };
        newTeamsToAdd.push(matchedA);
      }
      finalTeamAId = matchedA.id;
      teamAName = matchedA.name;

      // Check if Team B exists in roster or create new team
      let matchedB = existingTeams.find(t => t && (t.id === finalTeamBId || (t.name && t.name.toLowerCase() === nameB.toLowerCase())));
      if (!matchedB) {
        matchedB = {
          id: `team_${Date.now()}_b_${Math.random().toString(36).substring(2, 6)}`,
          name: nameB,
          captain: `${nameB} Captain`,
          players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
          city: (currentTour as any).city || 'Local'
        };
        newTeamsToAdd.push(matchedB);
      }
      finalTeamBId = matchedB.id;
      teamBName = matchedB.name;
    } else {
      if (finalTeamAId === finalTeamBId) {
        setManualMatchError("A team cannot play against itself! Please select two different teams.");
        return;
      }
      teamAName = existingTeams.find(t => t && t.id === finalTeamAId)?.name || 'Team A';
      teamBName = existingTeams.find(t => t && t.id === finalTeamBId)?.name || 'Team B';
    }

    const u1 = currentTour.umpire1Name || "Umesh Shastri";
    const u2 = currentTour.umpire2Name || "Nitin Gadkari";
    const sc = currentTour.scoreboardManagerName || "Ravi Shastri Jnr";

    const newMatch: TournamentMatch = {
      id: `match_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teamAId: finalTeamAId,
      teamBId: finalTeamBId,
      teamAName,
      teamBName,
      date: manualMatchDate || new Date().toISOString().split('T')[0],
      time: manualMatchTime || '10:00 AM',
      venue: manualMatchVenue || currentTour.groundName || currentTour.venue || "Shivaji Maharaj Ground (Turf)",
      status: 'scheduled',
      scoreA: '',
      scoreB: '',
      oversA: '',
      oversB: '',
      winnerId: null,
      winReason: '',
      manOfTheMatch: '',
      stage: manualMatchStage || 'League',
      umpire1: u1,
      umpire2: u2,
      scorer: sc,
      matchBannerUrl: manualMatchBannerUrl || ''
    };

    const updatedTeams = [...existingTeams, ...newTeamsToAdd];
    const updatedMatches = [...(currentTour.matches || []), newMatch];

    const updatedTournament: Tournament = {
      ...currentTour,
      teams: updatedTeams,
      status: currentTour.status === 'setup' ? 'active' : currentTour.status,
      matches: updatedMatches,
      updatedAt: Date.now()
    };

    const nextTournaments = tournaments.map(t => t.id === tourId ? updatedTournament : t);
    setTournaments(nextTournaments);

    try {
      localStorage.setItem('gully_tournaments_v1', JSON.stringify(nextTournaments));
      setDoc(doc(db, 'cricket_tournaments', tourId), updatedTournament).catch(err => {
        console.warn("Failed to backup tournament to Firestore:", err);
      });
      window.dispatchEvent(new Event('gully_tournaments_updated'));
    } catch (e) {
      console.warn("Save match error:", e);
    }

    setShowCreateMatchModal(false);
    setManualMatchBannerUrl('');
    setManualMatchError(null);
    triggerNotification(`Match scheduled: ${teamAName} vs ${teamBName}!${manualMatchBannerUrl ? ' Match banner automatically attached.' : ''}`);
  };

  const handleEditTournament = () => {
    if (!activeTournamentId) return;
    if (!editTourName.trim()) {
      alert("Championship name is required");
      return;
    }

    const ground = editTourGroundVenue.trim() || 'Shivaji Maharaj Ground (Turf)';
    const u1 = editTourUmpire1Name.trim() || 'Umesh Shastri';
    const u2 = editTourUmpire2Name.trim() || 'Nitin Gadkari';
    const sc = editTourScoreboardManagerName.trim() || 'Ravi Shastri Jnr';
    const comm = editTourCommentatorName.trim() || 'Harsha Bhogle (Live)';

    if (editTourLogo) {
      try { localStorage.setItem('cricket_tournament_logo', editTourLogo); } catch (_) {}
    }
    if (editTourYoutubeChannelName) {
      try { localStorage.setItem('cricket_youtube_channel_name', editTourYoutubeChannelName); } catch (_) {}
    }
    if (editTourYoutubeChannelLogo) {
      try { localStorage.setItem('cricket_youtube_channel_logo', editTourYoutubeChannelLogo); } catch (_) {}
    }

    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return {
        ...t,
        name: editTourName.trim(),
        format: editTourFormat,
        customOvers: editTourFormat === 'Custom' ? Number(editTourCustomOvers) : undefined,
        customRules: editTourCustomRules.trim() || undefined,
        teamCount: Number(editTourTeamCount),
        type: editTourType,
        startDate: editTourDate,
        logo: editTourLogo,
        groundName: ground,
        venue: ground,
        umpire1Name: u1,
        umpire1Photo: editTourUmpire1Photo,
        umpire2Name: u2,
        umpire2Photo: editTourUmpire2Photo,
        scoreboardManagerName: sc,
        scoreboardManagerPhoto: editTourScoreboardManagerPhoto,
        commentatorName: comm,
        commentatorPhoto: editTourCommentatorPhoto,
        youtubeChannelName: editTourYoutubeChannelName.trim(),
        youtubeChannelLogo: editTourYoutubeChannelLogo,
        pointsConfig: {
          winPoints: Number(editTourWinPoints) || 2,
          tiePoints: Number(editTourTiePoints) || 1,
          lossPoints: Number(editTourLossPoints) || 0,
          qualificationSpots: Number(editTourQualSpots) || 4,
          enableNRR: true
        }
      };
    }));

    setShowEditTourModal(false);
    triggerNotification("Championship settings updated!");
  };

  // Open Score Result Modal
  const openResultField = (m: TournamentMatch) => {
    setUpdatingMatch(m);
    setMatchScoreA(m.scoreA || '0/0');
    setMatchScoreB(m.scoreB || '0/0');
    setMatchOversA(m.oversA || '10');
    setMatchOversB(m.oversB || '10');
    setMatchWinnerId(m.winnerId || m.teamAId);
    setMatchWinReason(m.winReason || 'Won by wickets');
    setMatchMoM(m.manOfTheMatch || '');
  };

  // Process score updates and handle bracket promotions
  const handleUpdateResults = () => {
    if (!activeTournamentId || !updatingMatch || !activeTournament) return;

    const winnerRef = activeTournament.teams.find(tm => tm.id === matchWinnerId);
    const winnerName = winnerRef ? winnerRef.name : 'Unknown';

    const winnerTeamName = activeTournament.teams.find(t => t.id === matchWinnerId)?.name || 
      (matchWinnerId === updatingMatch.teamAId ? updatingMatch.teamAName : (matchWinnerId === updatingMatch.teamBId ? updatingMatch.teamBName : (matchWinnerId === 'tie' ? 'Tie' : '')));

    const nextMatches = activeTournament.matches.map(m => {
      if (m.id !== updatingMatch.id) return m;
      return {
        ...m,
        scoreA: matchScoreA,
        scoreB: matchScoreB,
        oversA: matchOversA,
        oversB: matchOversB,
        winnerId: matchWinnerId,
        winner: winnerTeamName,
        winReason: matchWinReason || (winnerTeamName ? `${winnerTeamName} won the match` : 'Match Completed'),
        manOfTheMatch: matchMoM,
        status: 'completed' as const,
        updatedAt: Date.now()
      };
    });

    // Automatically advance knockout brackets if applicable
    if (activeTournament.type === 'knockout') {
      const sfMatches = nextMatches.filter(m => m.stage === 'Semi-Final');
      const qfMatches = nextMatches.filter(m => m.stage === 'Quarter-Final');
      const finalMatch = nextMatches.find(m => m.stage === 'Final');

      // Promotion logic from QFs to SFs
      if (updatingMatch.stage === 'Quarter-Final') {
        const qfWinners = qfMatches.map(m => ({
          completed: m.status === 'completed',
          id: m.winnerId,
          name: activeTournament.teams.find(t => t.id === m.winnerId)?.name || "Winner TBD"
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
      if (updatingMatch.stage === 'Semi-Final') {
        if (finalMatch) {
          const sf1 = sfMatches[0];
          const sf2 = sfMatches[1];

          if (sf1 && sf1.status === 'completed') {
            finalMatch.teamAId = sf1.winnerId || "";
            finalMatch.teamAName = activeTournament.teams.find(t => t.id === sf1.winnerId)?.name || "SF1 Winner";
          }
          if (sf2 && sf2.status === 'completed') {
            finalMatch.teamBId = sf2.winnerId || "";
            finalMatch.teamBName = activeTournament.teams.find(t => t.id === sf2.winnerId)?.name || "SF2 Winner";
          }
        }
      }

      // Apply changes back to checklist
      nextMatches.forEach(m => {
        const found = sfMatches.find(sf => sf.id === m.id);
        if (found) {
          m.teamAId = found.teamAId;
          m.teamAName = found.teamAName;
          m.teamBId = found.teamBId;
          m.teamBName = found.teamBName;
        }
        if (finalMatch && m.id === finalMatch.id) {
          m.teamAId = finalMatch.teamAId;
          m.teamAName = finalMatch.teamAName;
          m.teamBId = finalMatch.teamBId;
          m.teamBName = finalMatch.teamBName;
        }
      });
    }

    // Determine if whole tournament is complete
    let tournamentCompleted = false;
    let mainWinner: string | null = null;
    
    const finalM = nextMatches.find(m => 
      m.stage?.toLowerCase()?.includes('final')
    );
    if (finalM && finalM.status === 'completed') {
      tournamentCompleted = true;
      mainWinner = activeTournament.teams.find(t => t.id === finalM.winnerId)?.name || finalM.teamAName;
    } else {
      // For league or round robin, if all matches are completed, set completed
      const allDone = nextMatches.every(m => m.status === 'completed');
      if (allDone && nextMatches.length > 0) {
        tournamentCompleted = true;
        // Winner is the top points table crew! We will compute and set it
        const table = computePointsTable(activeTournament.teams, nextMatches);
        if (table[0]) {
          mainWinner = table[0].name;
        }
      }
    }

    if (tournamentCompleted) {
      triggerNotification(`🏆 Tournament Final Match Completed! ${mainWinner} are Champions! Best Batsman, Best Bowler & Man of the Series awards automatically calculated!`);
    }

    // Prepare the updated tournament data
    const updatedTournamentData = {
      ...activeTournament,
      matches: nextMatches,
      status: tournamentCompleted ? 'completed' : activeTournament.status,
      winnerTeamName: tournamentCompleted ? mainWinner : activeTournament.winnerTeamName
    };

    // Update local state first for immediate UI responsiveness
    const nextTournaments = tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return updatedTournamentData;
    });
    setTournaments(nextTournaments);

    try {
      localStorage.setItem('gully_tournaments_v1', JSON.stringify(nextTournaments));
      window.dispatchEvent(new CustomEvent('gully_tournaments_updated', { detail: { tournamentId: activeTournamentId, matchId: updatingMatch.id } }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn("Error saving gully_tournaments_v1:", e);
    }

    // Save directly to Firestore for global real-time synchronization if quota available
    if (!isFirestoreQuotaExhausted()) {
      setDoc(doc(db, 'cricket_tournaments', activeTournamentId), updatedTournamentData)
        .then(() => {
          console.log("Tournament results successfully synchronized to Firestore.");
        })
        .catch((err) => {
          if (isQuotaError(err)) {
            recordFirestoreQuotaExhaustion(60);
          } else {
            console.error("Failed to backup tournament manually to Firestore:", err);
          }
        });
    }

    setUpdatingMatch(null);
    triggerNotification(`Scores updated. match result registered successfully!`);
  };

  // Helper calculation to compute Points Table using standard ICC Engine
  const computePointsTable = (teams: TournamentTeam[], matches: TournamentMatch[]) => {
    const defaultOvers = activeTournament ? (activeTournament.customOvers || (activeTournament.format === 'T20' ? 20 : (activeTournament.format === 'ODI' ? 50 : 10))) : 10;
    const winPts = activeTournament?.pointsConfig?.winPoints ?? 2;
    const tiePts = activeTournament?.pointsConfig?.tiePoints ?? 1;
    const lossPts = activeTournament?.pointsConfig?.lossPoints ?? 0;
    const qualSpots = activeTournament?.pointsConfig?.qualificationSpots ?? 4;
    
    const calculated = calculateTournamentStandings(
      teams,
      matches.map(m => ({
        id: m.id,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        teamAName: m.teamAName,
        teamBName: m.teamBName,
        status: m.status,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        oversA: m.oversA || defaultOvers,
        oversB: m.oversB || defaultOvers,
        winnerId: m.winnerId,
        winner: (m as any).winner,
        winReason: m.winReason,
        stage: m.stage
      })),
      {
        standardOversQuota: defaultOvers,
        pointsForWin: winPts,
        pointsForTie: tiePts,
        pointsForNoResult: tiePts,
        pointsForLoss: lossPts,
        qualifyingSpots: qualSpots
      }
    );

    return calculated.map(c => ({
      id: c.id,
      name: c.name,
      captain: c.captain || '',
      played: c.played,
      won: c.won,
      lost: c.lost,
      tied: c.tied,
      points: c.points,
      runsScored: c.runsScored,
      runsConceded: c.runsConceded,
      oversFaced: c.oversFacedDecimal,
      oversBowled: c.oversBowledDecimal,
      NRR: c.NRR,
      qualificationStatus: c.qualificationStatus
    }));
  };

  // Fetch AI Predictions and Dream11 Suggestions
  const fetchAIPrediction = async (m: TournamentMatch) => {
    if (!activeTournament) return;
    setAiMatchSelection(m.id);
    setAiLoading(true);
    setAiPredictionContent('');
    setAiFantasyContent('');

    const tA = activeTournament.teams.find(t => t.id === m.teamAId);
    const tB = activeTournament.teams.find(t => t.id === m.teamBId);

    if (!tA || !tB) {
      triggerNotification("Cannot query AI: invalid matchup.");
      setAiLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/cricket/prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: {
            format: activeTournament.format,
            date: m.date,
            time: m.time,
            venue: m.venue
          },
          teamA: {
            name: tA.name,
            captain: tA.captain,
            players: tA.players
          },
          teamB: {
            name: tB.name,
            captain: tB.captain,
            players: tB.players
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setAiPredictionContent(data.prediction);
      setAiFantasyContent(data.dream11Picks);
    } catch (err) {
      console.error(err);
      setAiPredictionContent("⚠️ Could not reach Gemini server. Try again, or ensure settings are resolved.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-800 dark:text-slate-100">
      
      {/* Mini notification banner */}
      <AnimatePresence>
        {aiNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-[999] px-6 py-3.5 bg-emerald-600 text-white rounded-2xl shadow-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-emerald-500"
          >
            <Sparkles size={16} className="text-amber-200 animate-pulse" />
            {aiNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel with Tournament Listing dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
        <div className="space-y-2">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full font-mono text-[10px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1">
            <Trophy size={12} /> Gully Tournament Hub
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Championship Scheduler & Standings
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Draft multi-team schedules, tabulate league points, view brackets, and unlock Gemini predictive insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase shrink-0">Select:</span>
            <select
              value={activeTournamentId || ''}
              onChange={(e) => {
                setActiveTournamentId(e.target.value || null);
                setTourTab('teams');
              }}
              className="px-5 py-3 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase text-slate-700 dark:text-slate-200 tracking-wider shadow-inner outline-none min-w-[200px]"
            >
              <option value="">-- No Active Tournament --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.format})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="h-12 px-5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer shadow-md flex items-center gap-2 transition-all"
          >
            <Plus size={16} /> Tournament
          </button>

          <button
            onClick={() => {
              if (activeTournament) {
                setLocalTeamsModalInitialTab('local-teams');
                setShowLocalTeamsModal(true);
              } else {
                setNewTourName("Gully Cricket Championship");
                setNewTourTeamCount(6);
                setCreateTourAutoLocalTeams(true);
                setShowCreateModal(true);
              }
            }}
            className="h-12 px-4.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-none rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-98"
            title="Local Cricket Teams & 1-Click Setup: Send link to captains or add teams directly"
          >
            <Zap size={16} className="fill-white" />
            <span className="hidden sm:inline">Local Teams & 1-Click Setup</span>
            <span className="sm:hidden">1-Click Setup</span>
          </button>
        </div>
      </div>

      {/* NO TOURNAMENT SELECTED WARNING */}
      {!activeTournamentId && (
        <div className="max-w-xl mx-auto text-center py-16 space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Trophy size={36} className="text-amber-500 animate-bounce" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
            Create or Choose a Tournament
          </h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            Get started by initializing your custom local Gully Cricket tournament. Fill in team specs, generate schedules, and track scoreboards easily.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setNewTourName("Gully Premier League");
                setNewTourTeamCount(4);
                setNewTourType('league');
                setShowCreateModal(true);
              }}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white border-none rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer shadow-md"
            >
              Launch Quick 4-Team League
            </button>

            <button
              onClick={() => {
                setNewTourName("Local Cricket Championship");
                setNewTourTeamCount(6);
                setNewTourType('league');
                setCreateTourAutoLocalTeams(true);
                setShowCreateModal(true);
              }}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-none rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-2"
            >
              <Zap size={16} className="fill-white" /> 1-Click Setup with Local Teams
            </button>
          </div>

          {/* Past Tournaments quick launcher registry */}
          {tournaments.length > 0 && (
            <div className="pt-8 border-t border-slate-100 dark:border-slate-900/60 w-full max-w-xs mx-auto">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-4">Saved Championships</span>
              <div className="space-y-2">
                {tournaments.map(t => (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-900 transition-all text-left"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs uppercase tracking-tight text-slate-700 dark:text-slate-200">{t.name}</h4>
                      <p className="text-[9px] text-slate-400 uppercase font-bold mt-1 inline-flex gap-2">
                        <span>{t.format}</span>
                        <span>•</span>
                        <span>{t.type}</span>
                        <span>•</span>
                        <span>{t.teams?.length || 0} teams</span>
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setActiveTournamentId(t.id);
                          setTourTab('teams');
                        }}
                        className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 hover:bg-emerald-100 rounded-lg border-none cursor-pointer"
                        title="Load tournament"
                      >
                        <ChevronRight size={13} />
                      </button>
                      <button
                        onClick={() => deleteTournament(t.id, t.name)}
                        className="p-1.5 hover:bg-rose-100 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg border-none cursor-pointer"
                        title="Delete tournament"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOURNAMENT INTERACTIVE VIEW */}
      {activeTournamentId && activeTournament && (
        <div className="space-y-8 animate-fade-in text-left">
          
          {/* Tournament Overview Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-[2.5rem] p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            {/* Background glowing sphere decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left z-10 w-full md:w-auto">
              {/* Tournament Logo Upload Box */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 bg-slate-800/80 border border-slate-705 rounded-3xl flex items-center justify-center overflow-hidden shadow-inner relative">
                  {activeTournament.logo ? (
                    <img 
                      src={activeTournament.logo} 
                      alt="Tournament Logo" 
                      className="w-full h-full object-cover animate-fade-in"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Trophy className="text-amber-500 font-extrabold animate-pulse" size={32} />
                  )}
                  {/* Floating upload hover label */}
                  <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-[9px] font-black uppercase text-white p-1 text-center">
                    <span>Upload Logo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, (base64) => {
                            setTournaments(tournaments.map(t => {
                              if (t.id !== activeTournament.id) return t;
                              return { ...t, logo: base64 };
                            }));
                            triggerNotification("Tournament logo updated!");
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white leading-tight m-0">
                    {activeTournament.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-widest ${
                    activeTournament.status === 'completed'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {activeTournament.status}
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 flex flex-wrap justify-center md:justify-start gap-x-2 gap-y-1">
                  <span>Format: <strong className="text-slate-200">{activeTournament.format === 'Custom' && activeTournament.customOvers ? `${activeTournament.customOvers} Overs` : activeTournament.format}</strong></span>
                  <span>•</span>
                  <span>Type: <strong className="text-slate-200 font-black">{activeTournament.type}</strong></span>
                  <span>•</span>
                  <span>Teams Count Limit: <strong className="text-emerald-400 font-black">{activeTournament.teams?.length || 0}/{activeTournament.teamCount} registered</strong></span>
                </p>
                
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Commenced on {activeTournament.startDate}
                </p>

                {/* Ground Venue, Match Officials & Broadcast Info Badges */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-300">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <MapPin size={11} className="text-emerald-400" />
                    <span>Venue:</span>
                    <strong className="text-emerald-400 font-extrabold">{activeTournament.groundName || activeTournament.venue || 'Shivaji Maharaj Ground (Turf)'}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <span>⚖️ Umpires:</span>
                    <strong className="text-slate-100">{activeTournament.umpire1Name || 'Umesh Shastri'} & {activeTournament.umpire2Name || 'Nitin Gadkari'}</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <span>📊 Scorer:</span>
                    <strong className="text-slate-100">{activeTournament.scoreboardManagerName || 'Ravi Shastri Jnr'}</strong>
                  </span>
                  {(activeTournament.commentatorName || activeTournament.youtubeChannelName) && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/60 text-slate-200 flex items-center gap-1.5 shadow-sm">
                      <span>🎙️ Crew:</span>
                      <strong className="text-amber-400">{activeTournament.commentatorName || 'Live Commentator'}</strong>
                      {activeTournament.youtubeChannelName && <span className="text-rose-400">• 📺 {activeTournament.youtubeChannelName}</span>}
                    </span>
                  )}
                </div>

                {activeTournament.customRules && (
                  <div className="mt-2.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl max-w-lg text-[9px] uppercase tracking-wide font-bold text-indigo-300 flex items-start gap-1.5 animate-fade-in z-10 relative">
                    <span className="font-extrabold text-indigo-400 shrink-0">📜 Tour Rules:</span>
                    <span className="text-slate-305 normal-case tracking-normal font-semibold leading-relaxed text-left select-text">{activeTournament.customRules}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel: Prize Money, Edit & Delete Tournament */}
            <div className="flex flex-wrap gap-2 z-10 shrink-0">
              <button
                onClick={() => {
                  setTourTab('prize-money');
                  setShowTourPrizeModal(true);
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-500/30 text-amber-300 border border-amber-500/40 rounded-2xl font-black text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
                title="Tournament Prize Money Manager: all prizes automatically configure in scoreboard when match is live"
              >
                <Trophy size={13} className="text-amber-400" />
                <span>Prize Money Manager</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[8px] font-black uppercase tracking-wider border border-emerald-500/30">
                  ⚡ Auto-Scoreboard
                </span>
                {(activeTournament.prizes && getValidActivePrizes(activeTournament.prizes).length > 0) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>

              <button
                onClick={() => {
                  setEditTourName(activeTournament.name);
                  setEditTourFormat(activeTournament.format);
                  setEditTourCustomOvers(activeTournament.customOvers || 10);
                  setEditTourCustomRules(activeTournament.customRules || '');
                  setEditTourTeamCount(activeTournament.teamCount);
                  setEditTourType(activeTournament.type);
                  setEditTourDate(activeTournament.startDate);
                  setEditTourLogo(activeTournament.logo || '');
                  setEditTourGroundVenue(activeTournament.groundName || activeTournament.venue || 'Shivaji Maharaj Ground (Turf)');
                  setEditTourUmpire1Name(activeTournament.umpire1Name || 'Umesh Shastri');
                  setEditTourUmpire1Photo(activeTournament.umpire1Photo || '');
                  setEditTourUmpire2Name(activeTournament.umpire2Name || 'Nitin Gadkari');
                  setEditTourUmpire2Photo(activeTournament.umpire2Photo || '');
                  setEditTourScoreboardManagerName(activeTournament.scoreboardManagerName || 'Ravi Shastri Jnr');
                  setEditTourScoreboardManagerPhoto(activeTournament.scoreboardManagerPhoto || '');
                  setEditTourCommentatorName(activeTournament.commentatorName || 'Harsha Bhogle (Live)');
                  setEditTourCommentatorPhoto(activeTournament.commentatorPhoto || '');
                  setEditTourYoutubeChannelName(activeTournament.youtubeChannelName || '');
                  setEditTourYoutubeChannelLogo(activeTournament.youtubeChannelLogo || '');
                  setEditTourWinPoints(activeTournament.pointsConfig?.winPoints ?? 2);
                  setEditTourTiePoints(activeTournament.pointsConfig?.tiePoints ?? 1);
                  setEditTourLossPoints(activeTournament.pointsConfig?.lossPoints ?? 0);
                  setEditTourQualSpots(activeTournament.pointsConfig?.qualificationSpots ?? 4);
                  setShowEditTourModal(true);
                }}
                className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
              >
                <Edit size={12} /> Edit settings
              </button>

              <button
                onClick={() => setShowPublicShareModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-2xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 border-none"
                title="CricHeroes Public Spectator Hub & Ground Printable QR Poster"
              >
                <QrCode size={12} /> Share & QR Poster
              </button>

              <button
                onClick={() => setShowDreamTeamModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-2xl cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 border-none"
                title="CricHeroes Tournament Best XI / Official Dream Team Lineup"
              >
                <Crown size={12} /> Dream XI (Best 11)
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse ml-0.5" />
              </button>
              
              <button
                onClick={() => deleteTournament(activeTournament.id, activeTournament.name)}
                className="px-4.5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-350 border border-rose-900/30 rounded-2xl font-black text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
          
          {/* Winner celebration card */}
          {activeTournament.status === 'completed' && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 rounded-[2.5rem] shadow-xl text-center relative overflow-hidden"
            >
              {/* Confetti element decorations */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-amber-200 to-amber-900" />
              <div className="relative space-y-4">
                <div className="w-20 h-20 bg-white/20 border border-white/30 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <Trophy size={42} className="text-yellow-100" />
                </div>
                <h3 className="text-3xl font-black uppercase tracking-tight text-slate-950 leading-none">
                  TOURNAMENT WRAPPED!
                </h3>
                <p className="text-xs font-mono font-extrabold uppercase tracking-widest text-[#5d4000] max-w-md mx-auto">
                  CHAMPIONS OF THE {activeTournament.name}
                </p>
                
                {/* Winner Name Box */}
                <span className="block text-4xl sm:text-5xl font-black tracking-tight text-white uppercase drop-shadow">
                  👑 {activeTournament.winnerTeamName || "No Winner Set"} 👑
                </span>

                <p className="text-[11px] font-bold text-[#5e4200] max-w-sm mx-auto">
                  Congratulations to the entire team and management for demonstrating pristine performance of gully cricket engineering!
                </p>

                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm("Restart this tournament reset?")) {
                        setTournaments(tournaments.map(t => {
                          if (t.id !== activeTournamentId) return t;
                          return {
                            ...t,
                            status: 'active',
                            winnerTeamName: null,
                            matches: t.matches.map(m => ({
                              ...m,
                              status: 'scheduled',
                              scoreA: "", scoreB: "", winnerId: null, winReason: "", manOfTheMatch: ""
                            }))
                          };
                        }));
                        triggerNotification("Tournament schedule was reset!");
                      }
                    }}
                    className="px-5 py-2 w-fit bg-slate-950 hover:bg-slate-900 text-white border-none rounded-xl font-black uppercase text-[10px] tracking-wider cursor-pointer"
                  >
                    Reset Tournament & Replay Matches
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Requirement 2: Tournament Best Batsman, Best Bowler, Man of the Series automatically show after tournament final match complete */}
          {(activeTournament.status === 'completed' || activeTournament.winnerTeamName || (activeTournament.matches.some(m => m.stage?.toLowerCase()?.includes('final') && m.status === 'completed')) || (activeTournament.matches.length > 0 && activeTournament.matches.every(m => m.status === 'completed'))) && (
            <TournamentAwardsPresentationCard
              tournamentName={activeTournament.name}
              winnerTeamName={activeTournament.winnerTeamName}
              matches={activeTournament.matches}
              teams={activeTournament.teams}
              prizes={activeTournament.prizes || getTournamentPrizesByTournamentId(activeTournament.id)}
              onTriggerPresentationBoard={() => {
                window.dispatchEvent(
                  new CustomEvent('cricket_trigger_presentation_board', {
                    detail: { tournamentId: activeTournament.id }
                  })
                );
                triggerNotification('🏆 Grand Prize Presentation Board triggered on broadcast!');
              }}
              onUpdateAwardWinner={(category, pName, tName) => {
                triggerNotification(`Award for ${category.replace(/_/g, ' ').toUpperCase()} updated to ${pName} (${tName})`);
              }}
            />
          )}

          {/* Tab Navigation links for current tournament */}
          <div className="bg-slate-100/90 dark:bg-slate-950/60 p-1.5 rounded-2xl flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth border border-slate-200/40 dark:border-slate-800/20">
            <button
              onClick={() => setTourTab('teams')}
              className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                tourTab === 'teams' 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 font-black' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
              }`}
            >
              <Users size={13} />
              <span>Teams ({activeTournament.teams?.length || 0}/{activeTournament.teamCount})</span>
            </button>

            <button
              onClick={() => setTourTab('matches')}
              className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                tourTab === 'matches' 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 font-black' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
              }`}
            >
              <Calendar size={13} />
              <span>Fixtures ({activeTournament.matches?.length || 0})</span>
            </button>

            {activeTournament.type === 'league' && (
              <button
                onClick={() => setTourTab('standings')}
                className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                  tourTab === 'standings' 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 font-black' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Trophy size={13} className="text-amber-500" />
                <span>Points Table</span>
              </button>
            )}

            {activeTournament.type === 'knockout' && (
              <button
                onClick={() => setTourTab('standings')}
                className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                  tourTab === 'standings' 
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 font-black' 
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
                }`}
              >
                <Trophy size={13} className="text-amber-500" />
                <span>Brackets</span>
              </button>
            )}

            <button
              onClick={() => setTourTab('venue-scheduler')}
              className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                tourTab === 'venue-scheduler' 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 font-black' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
              }`}
            >
              <MapPin size={13} />
              <span>Venues & Setup</span>
            </button>

            <button
              onClick={() => setTourTab('stats-leaderboards')}
              className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                tourTab === 'stats-leaderboards' 
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/15 font-black' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
              }`}
            >
              <BarChart3 size={13} />
              <span>Leaderboards</span>
            </button>

            <button
              onClick={() => setTourTab('ai-insights')}
              className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                tourTab === 'ai-insights' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15 font-black' 
                  : 'text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 bg-transparent hover:bg-indigo-50/50 dark:hover:bg-indigo-950/15'
              }`}
            >
              <Bot size={13} className="animate-pulse" />
              <span>AI Predictor</span>
            </button>

            <button
              onClick={() => setTourTab('prize-money')}
              className={`py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 ${
                tourTab === 'prize-money' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 font-black' 
                  : 'text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
              }`}
              title="Tournament Prize Money Manager: automatically configures in live scoreboard"
            >
              <Trophy size={13} className={tourTab === 'prize-money' ? 'text-slate-950' : 'text-amber-400'} />
              <span>Prize Money Manager</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>

            <button
              onClick={() => setShowDreamTeamModal(true)}
              className="py-2 px-3.5 sm:py-2.5 sm:px-5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 sm:gap-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
              title="CricHeroes Tournament Dream XI / Best 11 Lineup"
            >
              <Crown size={13} className="text-amber-400" />
              <span>Dream XI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            </button>
          </div>

          {/* TEAMS SUBTAB */}
          {tourTab === 'teams' && (
            <div className="space-y-6 team-management-panel">

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Registered Squads</h3>
                  <p className="text-2xs text-slate-400 font-bold uppercase mt-1">Manage players, captain assignments, and team rosters.</p>
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setLocalTeamsModalInitialTab('local-teams');
                      setShowLocalTeamsModal(true);
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl border-none font-black uppercase text-[10px] tracking-widest cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-98"
                    title="Send link to captains or add local teams directly for 1-click live scoreboard setup"
                  >
                    <Zap size={14} className="fill-white" />
                    <span>Local Teams & 1-Click Setup</span>
                  </button>

                  {activeTournament.status === 'setup' && (!activeTournament.teams || activeTournament.teams.length === 0) && (
                    <button
                      onClick={() => {
                        const demoTeams: TournamentTeam[] = [
                          {
                            id: `team_d1_${Date.now()}`,
                            name: "Gully Gladiators",
                            captain: "Rohit Sharma",
                            logo: "https://api.dicebear.com/7.x/initials/svg?seed=GG",
                            players: ["Rohit Sharma", "Virat Kohli", "KL Rahul", "Shreyas Iyer", "Hardik Pandya", "Rishabh Pant", "Ravindra Jadeja", "Jasprit Bumrah", "Mohammed Shami", "Yuzvendra Chahal", "Arshdeep Singh"]
                          },
                          {
                            id: `team_d2_${Date.now()}`,
                            name: "Street Strikers",
                            captain: "MS Dhoni",
                            logo: "https://api.dicebear.com/7.x/initials/svg?seed=SS",
                            players: ["MS Dhoni", "Suresh Raina", "Ambati Rayudu", "Dwayne Bravo", "Ruturaj Gaikwad", "Deepak Chahar", "Shardul Thakur", "Robin Uthappa", "Faf du Plessis", "Moeen Ali", "Shivam Dube"]
                          },
                          {
                            id: `team_d3_${Date.now()}`,
                            name: "Backyard Blasters",
                            captain: "Shubman Gill",
                            logo: "https://api.dicebear.com/7.x/initials/svg?seed=BB",
                            players: ["Hardik Pandya", "Shubman Gill", "Rashid Khan", "David Miller", "Rahul Tewatia", "Wriddhiman Saha", "Sai Sudharsan", "Vijay Shankar", "Mohit Sharma", "Noor Ahmad", "Umesh Yadav"]
                          },
                          {
                            id: `team_d4_${Date.now()}`,
                            name: "Highway Hurricanes",
                            captain: "Sanju Samson",
                            logo: "https://api.dicebear.com/7.x/initials/svg?seed=HH",
                            players: ["Sanju Samson", "Yashasvi Jaiswal", "Jos Buttler", "Shimron Hetmyer", "Riyan Parag", "Dhruv Jurel", "Ravichandran Ashwin", "Trent Boult", "Sandeep Sharma", "Avesh Khan", "Navdeep Saini"]
                          },
                          {
                            id: `team_d5_${Date.now()}`,
                            name: "Parkside Panthers",
                            captain: "Rishabh Pant",
                            logo: "https://api.dicebear.com/7.x/initials/svg?seed=PP",
                            players: ["Rishabh Pant", "David Warner", "Prithvi Shaw", "Mitchell Marsh", "Tristan Stubbs", "Axar Patel", "Kuldeep Yadav", "Anrich Nortje", "Khaleel Ahmed", "Mukesh Kumar", "Ishant Sharma"]
                          },
                          {
                            id: `team_d6_${Date.now()}`,
                            name: "Bypass Bowlers",
                            captain: "Shreyas Iyer",
                            logo: "https://api.dicebear.com/7.x/initials/svg?seed=BO",
                            players: ["Shreyas Iyer", "Sunil Narine", "Phil Salt", "Venkatesh Iyer", "Rinku Singh", "Andre Russell", "Ramandeep Singh", "Mitchell Starc", "Harshit Rana", "Varun Chakaravarthy", "Vaibhav Arora"]
                          }
                        ];
                        setTournaments(tournaments.map(t => {
                          if (t.id !== activeTournamentId) return t;
                          return {
                            ...t,
                            teams: demoTeams,
                            teamCount: 6
                          };
                        }));
                        triggerNotification("Successfully loaded 6 premium Demo Teams with rosters!");
                      }}
                      className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/35 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800/40 font-bold uppercase text-[10px] tracking-widest cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles size={14} className="animate-bounce" /> Load 6 Demo Teams
                    </button>
                  )}

                  {(activeTournament.teams?.length || 0) < activeTournament.teamCount && (
                    <button
                      onClick={() => {
                        setEditTeamId(null);
                        setTeamFormName('');
                        setTeamFormCaptain('');
                        setTeamFormPlayersText('');
                        setShowAddTeamModal(true);
                      }}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-bold uppercase text-[10px] tracking-widest cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} /> Add Squad
                    </button>
                  )}

                  {(activeTournament.teams?.length || 0) >= 2 && activeTournament.status === 'setup' && (
                    <button
                      onClick={generateSchedule}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl border-none font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Trophy size={14} /> Auto-Generate Schedule
                    </button>
                  )}
                </div>
              </div>

              {(!activeTournament.teams || activeTournament.teams.length === 0) ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                    <Zap size={32} className="fill-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white">Local Cricket Teams & 1-Click Setup</h4>
                    <p className="text-xs font-medium text-slate-400 max-w-md mx-auto mt-1">
                      Send a link to team captains to submit their 15-player squad, or add teams directly for instant 1-click live scoreboard setup.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={() => {
                        setLocalTeamsModalInitialTab('local-teams');
                        setShowLocalTeamsModal(true);
                      }}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/20 flex items-center gap-2"
                    >
                      <Users size={14} /> Browse Local Cricket Teams
                    </button>

                    <button
                      onClick={() => {
                        setLocalTeamsModalInitialTab('send-link');
                        setShowLocalTeamsModal(true);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-md shadow-indigo-600/20 flex items-center gap-2"
                    >
                      <Share2 size={14} /> Send Link to Captains
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeTournament.teams || []).map(team => (
                    <div 
                      key={team.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl rounded-[2rem] p-6 text-left flex flex-col justify-between hover:border-emerald-500/30 transition-all"
                    >
                      <div>
                        {/* Squad card banner */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                              {team.logo ? (
                                <img src={team.logo} alt={team.name} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                              ) : (
                                <Users size={16} className="text-emerald-500" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-extrabold uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 block w-fit">
                                Captain: {team.captain || "not set"}
                              </span>
                              <h4 className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight block m-0">
                                {team.name}
                              </h4>
                            </div>
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditTeamId(team.id);
                                setTeamFormName(team.name);
                                setTeamFormCaptain(team.captain);
                                setTeamFormPlayersText(team.players.join(', '));
                                setTeamFormLogo(team.logo || '');
                                setTeamFormPlayerPhotos(team.playerPhotos || {});
                                setShowAddTeamModal(true);
                              }}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg border-none cursor-pointer"
                              title="Edit team"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                setLocalTeamsModalInitialTab('send-link');
                                setShowLocalTeamsModal(true);
                              }}
                              className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-500 rounded-lg border-none cursor-pointer"
                              title="Send 15-player squad submission link to captain"
                            >
                              <Share2 size={13} />
                            </button>
                            <button
                              onClick={() => setTeamToDelete({ id: team.id, name: team.name })}
                              className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg border-none cursor-pointer"
                              title="Delete team"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Players scrollable row list */}
                        <div className="mt-4 border-t border-slate-50 dark:border-slate-800/60 pt-4">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-2">Roster Crew ({team.players.length})</span>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                            {team.players.map((p, idx) => {
                              const photo = team.playerPhotos?.[p] || '';
                              return (
                                <span 
                                  key={`tour-roster-${team.id || team.name}-${idx}-${p}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-350 rounded-lg text-[10px] font-bold border border-slate-100 dark:border-slate-800"
                                >
                                  {photo && (
                                    <img src={photo} alt={p} className="w-3.5 h-3.5 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                                  )}
                                  <span>{p}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULE & MATCHES SUBTAB */}
          {tourTab === 'matches' && (
            <div className="space-y-6">
              {/* Quick Live Standings Summary Header for League Tournaments */}
              {activeTournament.type === 'league' && (activeTournament.matches?.some(m => m.status === 'completed')) && (
                <LiveStandingsSummaryWidget
                  standings={computePointsTable(activeTournament.teams, activeTournament.matches)}
                  tournamentName={activeTournament.name}
                  isLeague={true}
                />
              )}

              {/* RECENT MATCH RESULTS CAROUSEL (CricHeroes & Cricbuzz style) */}
              {activeTournament.matches?.some(m => m.status === 'completed') && (
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800">
                  <TournamentRecentResultsCarousel
                    matches={activeTournament.matches || []}
                    teams={activeTournament.teams || []}
                    onOpenScorecard={(m) => {
                      setSelectedScorecardMatch(m as any);
                      setShowScorecardModal(true);
                    }}
                    onOpenAwardsCertificates={(m) => {
                      handleOpenMatchAwardCertificates(m as any);
                    }}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Tournament Fixtures</h3>
                  <p className="text-2xs text-slate-400 font-bold uppercase mt-1">Schedule date/venues, track live progress, and update winner match cards.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(activeTournament?.teams?.length || 0) >= 2 && (
                    <button
                      onClick={generateSchedule}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-500 rounded-xl border border-indigo-500/20 font-black uppercase text-[10px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                      title="Regenerate automatic round-robin or knockout match bracket"
                    >
                      <RefreshCw size={12} /> Auto-Generate Fixtures
                    </button>
                  )}

                  <button
                    onClick={openManualMatchModal}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 font-black uppercase text-[10px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus size={12} /> Schedule Manually
                  </button>

                  {(activeTournament?.matches?.length || 0) > 0 && (
                    <button
                      onClick={() => setShowResetScheduleModal(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 font-black uppercase text-[10px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Trash2 size={12} /> Reset Schedule
                    </button>
                  )}
                </div>
              </div>

              {(!activeTournament?.matches || activeTournament.matches.length === 0) ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-4">
                  <Calendar size={36} className="mx-auto text-emerald-500/60" />
                  <div>
                    <p className="text-sm font-black uppercase text-slate-800 dark:text-white">No matches configured yet</p>
                    <p className="text-xs font-medium text-slate-400 max-w-md mx-auto mt-1">
                      Schedule your first match manually, or generate round-robin/knockout fixture pairings with a single tap.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={openManualMatchModal}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                    >
                      <Plus size={14} /> Schedule Manually
                    </button>
                    {(activeTournament?.teams?.length || 0) >= 2 && (
                      <button
                        onClick={generateSchedule}
                        className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold uppercase text-xs cursor-pointer flex items-center gap-1.5 transition-all shadow-md shadow-indigo-500/20"
                      >
                        <RefreshCw size={14} /> Auto-Generate Fixtures
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* QUICK FILTER BAR (Past Results, Live Now, Upcoming & Filter by Team) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                    {/* Status Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      <button
                        onClick={() => setMatchStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                          matchStatusFilter === 'all'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        All ({activeTournament?.matches?.length || 0})
                      </button>

                      <button
                        onClick={() => setMatchStatusFilter('completed')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          matchStatusFilter === 'completed'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <span>Past Results ✅</span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full ${matchStatusFilter === 'completed' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'}`}>
                          {activeTournament.matches?.filter(m => m.status === 'completed').length || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => setMatchStatusFilter('live')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          matchStatusFilter === 'live'
                            ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 border-rose-500/20 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                      >
                        <span>Live Now 🔥</span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full ${matchStatusFilter === 'live' ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'}`}>
                          {activeTournament.matches?.filter(m => m.status === 'live').length || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => setMatchStatusFilter('scheduled')}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          matchStatusFilter === 'scheduled'
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                        }`}
                      >
                        <span>Upcoming 📅</span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.2 rounded-full ${matchStatusFilter === 'scheduled' ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'}`}>
                          {activeTournament.matches?.filter(m => m.status === 'scheduled').length || 0}
                        </span>
                      </button>
                    </div>

                    {/* Filter by Team Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase">
                        <Filter size={12} className="text-emerald-500" />
                        <span>Team:</span>
                      </div>
                      <select
                        value={matchTeamFilter}
                        onChange={(e) => setMatchTeamFilter(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-all max-w-[180px] truncate"
                      >
                        <option value="all">All Teams</option>
                        {(activeTournament.teams || []).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const filteredMatches = (activeTournament.matches || []).filter(m => {
                      const matchesStatus = 
                        matchStatusFilter === 'all' ? true :
                        matchStatusFilter === 'completed' ? m.status === 'completed' :
                        matchStatusFilter === 'live' ? m.status === 'live' :
                        m.status === 'scheduled';

                      const matchesTeam = 
                        matchTeamFilter === 'all' ? true :
                        (m.teamAId === matchTeamFilter || m.teamBId === matchTeamFilter || m.teamAName === matchTeamFilter || m.teamBName === matchTeamFilter);

                      return matchesStatus && matchesTeam;
                    });

                    if (filteredMatches.length === 0) {
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400 space-y-2">
                          <p className="text-xs font-bold uppercase">No matches found for current filter.</p>
                          <button
                            onClick={() => {
                              setMatchStatusFilter('all');
                              setMatchTeamFilter('all');
                            }}
                            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-[10px] font-bold uppercase cursor-pointer border-none transition-all"
                          >
                            Reset Filters
                          </button>
                        </div>
                      );
                    }

                    return filteredMatches.map(m => {
                    const isCompleted = m.status === 'completed' || !!m.winner || (!!m.winReason && m.winReason !== 'Scheduled' && m.winReason !== 'Match Scheduled');
                    const isLive = !isCompleted && m.status === 'live';
                    const isUpcoming = !isCompleted && !isLive;

                    const matchResultText = m.winReason || (m.winner ? `${m.winner} won the match` : (m.winnerId === m.teamAId ? `${m.teamAName} won` : (m.winnerId === m.teamBId ? `${m.teamBName} won` : 'Match Completed')));

                    const teamAObj = activeTournament.teams.find(t => t.id === m.teamAId || t.name === m.teamAName);
                    const teamBObj = activeTournament.teams.find(t => t.id === m.teamBId || t.name === m.teamBName);
                    const teamALogo = teamAObj?.logo;
                    const teamBLogo = teamBObj?.logo;

                    return (
                      <div 
                        key={m.id}
                        className={`bg-white dark:bg-slate-900 border rounded-[2rem] p-5 shadow-sm transition-all md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-300 dark:hover:border-emerald-900 ${
                          isLive ? 'border-amber-400 dark:border-amber-500/40 bg-amber-500/5' : (isCompleted ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-slate-100 dark:border-slate-800')
                        }`}
                      >
                        {/* Match basic scheduling info */}
                        <div className="space-y-2 text-left flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {m.stage}
                            </span>
                            
                            {isLive && (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-500 text-white animate-pulse">
                                LIVE NOW
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono">
                                Completed ✅
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-bold uppercase inline-flex items-center gap-1">
                              <Calendar size={11} /> {m.date} | {m.time}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase inline-flex items-center gap-1">
                              <MapPin size={11} /> {m.venue}
                            </span>
                            {m.matchBannerUrl && (
                              <span className="text-[10px] text-indigo-500 font-extrabold uppercase inline-flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                <ImageIcon size={10} /> Banner Ready
                              </span>
                            )}
                          </div>

                          {/* Matchup core rendering with Team Logos */}
                          <div className="flex items-center gap-6 py-1.5 md:py-0 flex-wrap">
                            {/* Team A Badge & Title */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {teamALogo ? (
                                  <img src={teamALogo} alt={m.teamAName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="font-extrabold text-xs text-indigo-500 dark:text-indigo-400 uppercase select-none">{m.teamAName[0] || 'A'}</span>
                                )}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-sm md:text-base font-black uppercase text-slate-800 dark:text-white">
                                  {m.teamAName} 
                                </span>
                                {(isCompleted || isLive) && (
                                  <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-300">
                                    {m.scoreA || 'DNB'} {m.oversA ? `(${m.oversA} ov)` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <span className="text-xs font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest font-mono shrink-0">VS</span>

                            {/* Team B Badge & Title */}
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {teamBLogo ? (
                                  <img src={teamBLogo} alt={m.teamBName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="font-extrabold text-xs text-indigo-500 dark:text-indigo-400 uppercase select-none">{m.teamBName[0] || 'B'}</span>
                                )}
                              </div>
                              <div className="flex flex-col text-left">
                                <span className="text-sm md:text-base font-black uppercase text-slate-800 dark:text-white">
                                  {m.teamBName}
                                </span>
                                {(isCompleted || isLive) && (
                                  <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-300">
                                    {m.scoreB || 'DNB'} {m.oversB ? `(${m.oversB} ov)` : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Winner display message banner */}
                          {isCompleted && (
                            <div className="w-full mt-2.5 p-3 px-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 text-xs font-black uppercase text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                              <div className="flex items-center gap-2">
                                <Award size={16} className="text-amber-500 shrink-0" />
                                <span className="font-black tracking-wide">
                                  🎉 {matchResultText}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {m.manOfTheMatch && (
                                  <span className="text-[10px] font-extrabold text-amber-500 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/25 flex items-center gap-1">
                                    ⭐ MoM: {m.manOfTheMatch}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenMatchAwardCertificates(m)}
                                  className="text-[9.5px] font-black uppercase text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-amber-500/30 hover:bg-amber-50 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Download Match Award Certificates (Winning Team, Participant Team, MoM, Best Batsman, Best Bowler)"
                                >
                                  <Award size={11} className="text-amber-500" />
                                  <span>Download Certificates</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Controls & Banner Preview */}
                        <div className="flex items-center gap-3 flex-wrap shrink-0">
                          {/* MATCH BANNER THUMBNAIL (if set) */}
                          {m.matchBannerUrl && (
                            <div 
                              onClick={() => setSelectedMatchForBanner(m)}
                              className="relative group cursor-pointer overflow-hidden rounded-xl border border-indigo-500/30 w-24 h-14 shrink-0 shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all"
                              title="Click to view or edit match banner"
                            >
                              <img
                                src={normalizeImageUrl(m.matchBannerUrl)}
                                alt="Match Banner"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                referrerPolicy="no-referrer"
                                onError={(e) => handleSmartImageError(e, m.matchBannerUrl)}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-black uppercase text-white transition-opacity gap-1">
                                <ImageIcon size={10} /> Edit
                              </div>
                            </div>
                          )}

                          {/* PRIMARY ACTION: START SCORING / RESUME SCORING */}
                          {!isCompleted && (
                            <button
                              onClick={() => handleTriggerLiveScore(m)}
                              className={`px-4 py-2.5 rounded-xl border-none font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                                isLive
                                  ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-500/30 ring-2 ring-rose-400/40 animate-pulse'
                                  : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/30'
                              }`}
                              title={isLive ? "Resume scoring this active match in live scoreboard" : "Launch Live Scoreboard with automated tournament metadata, venue, officials & crew"}
                            >
                              {isLive ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                  <Play size={13} className="fill-white" />
                                  <span>Resume Scoring</span>
                                </>
                              ) : (
                                <>
                                  <Play size={13} className="fill-white" />
                                  <span>Start Scoring</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* MATCH BANNER BUTTON (Requirement: Option to add match banner in tournament fixture) */}
                          <button
                            onClick={() => setSelectedMatchForBanner(m)}
                            className={`px-3 py-2 rounded-xl border font-black text-[9px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-xs ${
                              m.matchBannerUrl
                                ? 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                : 'bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80'
                            }`}
                            title="Add or edit custom match banner (automatically configured in match setup & live scoreboard)"
                          >
                            <ImageIcon size={11} className={m.matchBannerUrl ? 'text-indigo-500' : 'text-indigo-500'} />
                            <span>{m.matchBannerUrl ? 'Banner Set ✓' : '+ Add Banner'}</span>
                          </button>

                          {/* QUICK EDIT MATCH BUTTON */}
                          <button
                            onClick={() => handleOpenQuickEdit(m)}
                            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-xl font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                            title="Quick Edit Match details (Time, Venue, Status)"
                          >
                            <Edit size={11} /> Edit Match
                          </button>

                          <button
                            onClick={() => startEditSchedule(m)}
                            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all"
                            title="Edit match schedule"
                          >
                            Schedule
                          </button>

                          {isCompleted && (
                            <button
                              onClick={() => handleTriggerLiveScore(m)}
                              className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                              title="Re-open match in live scoreboard"
                            >
                              <Play size={10} /> Re-Score
                            </button>
                          )}

                          {isCompleted && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedScorecardMatch(m);
                                  setShowScorecardModal(true);
                                }}
                                className="px-3.5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl font-black text-[9px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                                title="View CricHeroes & Cricbuzz interactive match scorecard"
                              >
                                <FileText size={11} /> Scorecard
                              </button>
                              <button
                                onClick={() => generateMatchReportPDF(m)}
                                className="px-3.5 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                                title="Download structured PDF Scorecard"
                              >
                                <Download size={11} /> PDF Report
                              </button>
                              <button
                                onClick={() => handleOpenMatchAwardCertificates(m)}
                                className="px-3.5 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl font-black text-[9px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                                title="Download match award certificates: Winning team certificate, participant certificate, Player of the Match, Best Batsman, Best Bowler"
                              >
                                <Award size={12} className="text-amber-500" />
                                <span>Award Certificates</span>
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => openResultField(m)}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-black uppercase text-[9px] tracking-wider cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            Update scorecard
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              )}
            </div>
          )}

          {/* POINTS TABLE SUBTAB (LEAGUE STYLE) */}
          {tourTab === 'standings' && (
            <div className="space-y-6">
              {/* Auto-Configured Points Table Banner (Requirement 5) */}
              <div className="p-3 px-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                    📊
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-indigo-900 dark:text-indigo-200 tracking-wider block">
                      Auto-Configured Tournament Point Table
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">
                      Win: {activeTournament.pointsConfig?.winPoints ?? 2} pts • Tie/NR: {activeTournament.pointsConfig?.tiePoints ?? 1} pts • Loss: {activeTournament.pointsConfig?.lossPoints ?? 0} pts • Top {activeTournament.pointsConfig?.qualificationSpots ?? 4} Advance • NRR Calculation Active
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditTourWinPoints(activeTournament.pointsConfig?.winPoints ?? 2);
                    setEditTourTiePoints(activeTournament.pointsConfig?.tiePoints ?? 1);
                    setEditTourLossPoints(activeTournament.pointsConfig?.lossPoints ?? 0);
                    setEditTourQualSpots(activeTournament.pointsConfig?.qualificationSpots ?? 4);
                    setShowEditTourModal(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-sm"
                >
                  Adjust Points Rules
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/15">
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">
                    {standingsTabMode === 'sandbox' 
                      ? 'Interactive Points Table Sandbox' 
                      : standingsTabMode === 'brackets' 
                        ? 'Knockout Stage Brackets' 
                        : 'Championship Points Table'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase mt-1">
                    {standingsTabMode === 'sandbox'
                      ? 'Simulate fixtures & play with preloaded stats on the fly.'
                      : standingsTabMode === 'brackets' 
                        ? 'Interactive visual flow chart of advancing qualified squads.' 
                        : 'Auto-computed team points, net run rate (NRR) and qualification statuses.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Standings Segment Controller Toggle */}
                  <div className="bg-slate-200/60 dark:bg-slate-900 p-1.5 rounded-xl flex gap-1 border border-slate-300/30 dark:border-slate-800/20">
                    <button
                      type="button"
                      onClick={() => setStandingsTabMode('live')}
                      className={`py-1.5 px-3 font-extrabold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer border-none transition-all flex items-center gap-1.5 ${
                        standingsTabMode === 'live'
                          ? 'bg-emerald-500 text-white shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-850/40'
                      }`}
                    >
                      <Trophy size={11} className={standingsTabMode === 'live' ? '' : 'text-amber-500'} />
                      <span>Points Table</span>
                    </button>

                    {activeTournament.type === 'knockout' && (
                      <button
                        type="button"
                        onClick={() => setStandingsTabMode('brackets')}
                        className={`py-1.5 px-3 font-extrabold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer border-none transition-all flex items-center gap-1.5 ${
                          standingsTabMode === 'brackets'
                            ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-850/40'
                        }`}
                      >
                        <span>⚔️ Brackets</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setStandingsTabMode('sandbox')}
                      className={`py-1.5 px-3 font-extrabold uppercase text-[10px] tracking-wider rounded-lg cursor-pointer border-none transition-all flex items-center gap-1.5 ${
                        standingsTabMode === 'sandbox'
                          ? 'bg-indigo-600 text-white shadow-sm font-black'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-850/40'
                      }`}
                    >
                      <RefreshCw size={11} className={standingsTabMode === 'sandbox' ? 'animate-spin' : ''} />
                      <span>Sandbox Simulator</span>
                    </button>
                  </div>

                  {standingsTabMode === 'live' && (
                    <button
                      onClick={() => {
                        const standings = computePointsTable(activeTournament.teams, activeTournament.matches);
                        // Generate CSV content
                        const headers = ["Rank", "Squad Name", "Captain", "Played", "Won", "Lost", "Tied", "Points", "Net Runrate"];
                        const rows = standings.map((row, idx) => [
                          idx + 1,
                          `"${row.name.replace(/"/g, '""')}"`,
                          `"${(row.captain || '').replace(/"/g, '""')}"`,
                          row.played,
                          row.won,
                          row.lost,
                          row.tied,
                          row.points,
                          row.NRR
                        ]);
                        
                        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", `${activeTournament.name.replace(/\s+/g, '_')}_standings.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        triggerNotification("Standings CSV exported successfully!");
                      }}
                      className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-black uppercase text-2xs cursor-pointer flex items-center gap-1.5 transition-all shadow-md self-stretch sm:self-auto justify-center"
                    >
                      <Download size={12} /> CSV
                    </button>
                  )}
                </div>
              </div>

              {standingsTabMode === 'sandbox' ? (
                <PointsTableModule />
              ) : standingsTabMode === 'brackets' ? (
                /* KNOCKOUT BRACKET RENDER */
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-10 shadow-xl overflow-x-auto">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 min-w-[750px] py-6 relative">
                    
                    {/* Semi Finals Round Column */}
                    <div className="flex flex-col gap-10 w-64">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 block text-center">Semi-Finals</span>
                      {activeTournament.matches.filter(m => m.stage === 'Semi-Final').map((sf, idx) => {
                        const sfAObj = activeTournament.teams.find(t => t.id === sf.teamAId || t.name === sf.teamAName);
                        const sfBObj = activeTournament.teams.find(t => t.id === sf.teamBId || t.name === sf.teamBName);
                        const sfALogo = sfAObj?.logo;
                        const sfBLogo = sfBObj?.logo;

                        return (
                          <div 
                            key={sf.id}
                            className={`p-4 border rounded-2xl relative shadow-sm ${
                              sf.status === 'completed' ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-slate-150 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-black flex items-center gap-1.5 ${sf.winnerId === sf.teamAId ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                  <span className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                    {sfALogo ? (
                                      <img src={sfALogo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="font-extrabold text-[8px] text-indigo-500 dark:text-indigo-400 uppercase select-none">{(sf.teamAName || 'T')[0]}</span>
                                    )}
                                  </span>
                                  <span>{sf.teamAName || "SF TBD"}</span>
                                </span>
                                {sf.scoreA && <span className="font-mono text-[10px] font-bold text-slate-400">{sf.scoreA}</span>}
                              </div>
                              <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-800" />
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-black flex items-center gap-1.5 ${sf.winnerId === sf.teamBId ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-300'}`}>
                                  <span className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                    {sfBLogo ? (
                                      <img src={sfBLogo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="font-extrabold text-[8px] text-indigo-500 dark:text-indigo-400 uppercase select-none">{(sf.teamBName || 'T')[0]}</span>
                                    )}
                                  </span>
                                  <span>{sf.teamBName || "SF TBD"}</span>
                                </span>
                                {sf.scoreB && <span className="font-mono text-[10px] font-bold text-slate-400">{sf.scoreB}</span>}
                              </div>
                            </div>
                            
                            {/* Connector line indicators */}
                            <div className="absolute top-1/2 -right-10 md:-right-20 w-10 md:w-20 h-[2px] bg-slate-200 dark:bg-slate-800 pointer-events-none hidden md:block" />
                          </div>
                        );
                      })}
                    </div>

                    {/* Finals Round Column */}
                    <div className="w-64 space-y-4 shrink-0 z-10">
                      <span className="text-[10px] text-slate-405 font-extrabold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2 block text-center">Grand Final</span>
                      {(() => {
                        const final = activeTournament.matches.find(m => m.stage === 'Final');
                        if (!final) return null;
                        return (
                          <div className="p-6 border border-amber-400/50 dark:border-amber-500/40 bg-amber-500/[0.04] rounded-3xl relative shadow-lg text-center space-y-4">
                            <Trophy className="text-amber-500 mx-auto" size={32} />
                            
                            <div className="space-y-2 text-xs">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-black text-slate-800 dark:text-white">{final.teamAName}</span>
                                {final.scoreA && <span className="text-[10px] font-mono text-slate-400 font-bold">{final.scoreA}</span>}
                              </div>
                              <span className="text-[10px] uppercase font-bold text-rose-500 py-1 inline-block">VS</span>
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-black text-slate-800 dark:text-white">{final.teamBName}</span>
                                {final.scoreB && <span className="text-[10px] font-mono text-slate-400 font-bold">{final.scoreB}</span>}
                              </div>
                            </div>

                            {final.status === 'completed' && final.winReason && (
                              <div className="pt-2">
                                <span className="block text-[10px] font-black uppercase text-amber-600 bg-amber-500/10 py-1.5 px-3 rounded-xl">
                                  👑 {final.winReason || 'Champ Selected'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              ) : (
                <TournamentHierarchyPointsTable
                  tournament={activeTournament}
                  qualifyingThreshold={activeTournament.pointsConfig?.qualificationSpots ?? 4}
                  onOpenScorecard={(m) => {
                    setSelectedScorecardMatch(m as any);
                    setShowScorecardModal(true);
                  }}
                />
              )}
            </div>
          )}

          {/* AI MATCH PREDICTOR SUBTAB */}
          {tourTab === 'ai-insights' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Bot className="text-indigo-500" /> Gemini Analytics Engine
                </h3>
                <p className="text-2xs text-slate-400 font-bold uppercase mt-1">Select any matching fixture to forecast outcomes & generate Dream11 fantasy teams.</p>
              </div>

              {(!activeTournament.matches || activeTournament.matches.length === 0) ? (
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                  Configure and generate fixtures first to enable analytics.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  
                  {/* Match Match Selection pane */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Choose Upcoming Matchup</span>
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                      {(activeTournament.matches || []).map(m => (
                        <div 
                          key={m.id}
                          onClick={() => {
                            if (!aiLoading) fetchAIPrediction(m);
                          }}
                          className={`p-4 border rounded-2xl cursor-pointer hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all text-left flex flex-col justify-between ${
                            aiMatchSelection === m.id ? 'border-indigo-500 bg-indigo-500/5 shadow-md' : 'border-slate-100 dark:border-slate-805 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] font-black uppercase">{m.stage}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">{m.date} | {m.time}</span>
                          </div>
                          
                          <div className="text-xs font-black uppercase text-slate-700 dark:text-slate-250 flex items-center gap-2">
                            <span>{m.teamAName}</span>
                            <span className="text-[10px] text-rose-500 font-bold font-mono">VS</span>
                            <span>{m.teamBName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prediction Outcomes pane */}
                  <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl space-y-6 flex flex-col justify-between min-h-[420px]">
                    
                    {aiLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
                        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Consulting Gemini Cricket Analyst...</p>
                      </div>
                    ) : aiPredictionContent ? (
                      <div className="space-y-6 flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                        
                        {/* Winner Predictive text */}
                        <div className="space-y-3 pb-6">
                          <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-1">
                            <Award className="text-amber-500 animate-pulse" size={15} /> Match Prediction Target
                          </h4>
                          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap">
                            {aiPredictionContent}
                          </div>
                        </div>

                        {/* Dream11 Recommendations text */}
                        <div className="space-y-3 pt-6">
                          <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Sparkles className="text-indigo-400" size={14} /> Dream11 Tactical Picks
                          </h4>
                          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                            {aiFantasyContent}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 text-slate-400 py-16">
                        <Bot size={42} className="text-indigo-400/50 animate-bounce" />
                        <div>
                          <p className="text-xs font-bold uppercase">Ready to predict</p>
                          <p className="text-2xs font-bold text-slate-400 mt-1 max-w-xs mx-auto">Select any match from the left margin list to let the AI forecast winner outcomes and build optimal fantasy teams.</p>
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide border-t border-slate-100 dark:border-slate-800/60 pt-4 flex items-center gap-1 mb-1 justify-center">
                      <Sparkles size={12} className="text-amber-400" /> powered by gemini-3.5-flash
                    </div>

                  </div>

                </div>
              )}

              {/* Mutual Head-to-Head records Comparison Widget */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="p-2 sm:p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                    <ArrowLeftRight size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black uppercase text-slate-850 dark:text-white leading-none">Mutual Head-to-head records</h3>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mt-1 tracking-wider">Compare mutual fixture history and average stats between tournament franchises</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">First Team (A)</label>
                    <select
                      value={h2hTeam1Id}
                      onChange={(e) => setH2hTeam1Id(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">-- Choose Team A --</option>
                      {activeTournament.teams.map(t => (
                        <option key={`h2h-t1-${t.id}`} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Second Team (B)</label>
                    <select
                      value={h2hTeam2Id}
                      onChange={(e) => setH2hTeam2Id(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
                    >
                      <option value="">-- Choose Team B --</option>
                      {activeTournament.teams.map(t => (
                        <option key={`h2h-t2-${t.id}`} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  if (!h2hTeam1Id || !h2hTeam2Id) {
                    return (
                      <div className="py-8 text-center text-slate-400 text-xs font-extrabold uppercase bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-100 dark:border-slate-800">
                        Select two franchise squads to compare head-to-head stats
                      </div>
                    );
                  }
                  if (h2hTeam1Id === h2hTeam2Id) {
                    return (
                      <div className="py-8 text-center text-rose-500 text-xs font-extrabold uppercase bg-rose-50 dark:bg-rose-950/15 rounded-2xl border border-dashed border-rose-100 dark:border-rose-900/30">
                        Select distinct teams for a valid comparison.
                      </div>
                    );
                  }

                  const team1 = activeTournament.teams.find(t => t.id === h2hTeam1Id);
                  const team2 = activeTournament.teams.find(t => t.id === h2hTeam2Id);
                  if (!team1 || !team2) return null;

                  // Filter completed mutual matches
                  const h2hMatches = activeTournament.matches.filter(m => 
                    m.status === 'completed' && (
                      (m.teamAId === h2hTeam1Id && m.teamBId === h2hTeam2Id) ||
                      (m.teamAId === h2hTeam2Id && m.teamBId === h2hTeam1Id)
                    )
                  );

                  let team1Wins = 0;
                  let team2Wins = 0;
                  let tiesCount = 0;
                  let team1TotalRuns = 0;
                  let team2TotalRuns = 0;
                  let team1Played = 0;
                  let team2Played = 0;

                  h2hMatches.forEach(m => {
                    if (m.winnerId === h2hTeam1Id) team1Wins++;
                    else if (m.winnerId === h2hTeam2Id) team2Wins++;
                    else tiesCount++;

                    const scoreAParts = m.scoreA ? m.scoreA.split('/') : ['0'];
                    const scoreBParts = m.scoreB ? m.scoreB.split('/') : ['0'];
                    const runsA = parseInt(scoreAParts[0]) || 0;
                    const runsB = parseInt(scoreBParts[0]) || 0;

                    if (m.teamAId === h2hTeam1Id) {
                      team1TotalRuns += runsA;
                      team2TotalRuns += runsB;
                      team1Played++;
                      team2Played++;
                    } else {
                      team1TotalRuns += runsB;
                      team2TotalRuns += runsA;
                      team1Played++;
                      team2Played++;
                    }
                  });

                  const totalPlayed = h2hMatches.length;
                  const team1AvgScore = team1Played > 0 ? (team1TotalRuns / team1Played).toFixed(1) : '0.0';
                  const team2AvgScore = team2Played > 0 ? (team2TotalRuns / team2Played).toFixed(1) : '0.0';

                  return (
                    <div className="space-y-4">
                      {/* Metric Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-850">
                          <span className="text-[8px] font-black text-slate-400 block uppercase">MATCHES PLAYED</span>
                          <strong className="text-2xl font-black text-slate-800 dark:text-white mt-1 block">{totalPlayed}</strong>
                        </div>
                        <div className="bg-indigo-50/40 dark:bg-indigo-950/10 p-4 rounded-2xl text-center border border-indigo-100/45 dark:border-indigo-950/30">
                          <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 block uppercase">{team1.name} WINS</span>
                          <strong className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{team1Wins}</strong>
                        </div>
                        <div className="bg-purple-50/40 dark:bg-purple-950/10 p-4 rounded-2xl text-center border border-purple-100/45 dark:border-purple-950/30">
                          <span className="text-[8px] font-black text-purple-500 dark:text-purple-400 block uppercase">{team2.name} WINS</span>
                          <strong className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">{team2Wins}</strong>
                        </div>
                        <div className="bg-rose-50/40 dark:bg-rose-950/10 p-4 rounded-2xl text-center border border-rose-100/45 dark:border-rose-950/30">
                          <span className="text-[8px] font-black text-rose-500 dark:text-rose-400 block uppercase">TIES / NR</span>
                          <strong className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">{tiesCount}</strong>
                        </div>
                      </div>

                      {/* Score comparison metrics slider */}
                      <div className="p-5 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-4 font-sans">
                        <span className="text-[8.5px] font-black tracking-widest text-emerald-400 block uppercase leading-none">AVERAGE SCORE COMPARATIVE RATIOS</span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-indigo-400">{team1.name} Avg Innings Score</span>
                              <span>{team1AvgScore} runs</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(10, (parseFloat(team1AvgScore) / 220) * 100))}%` }} 
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-purple-400">{team2.name} Avg Innings Score</span>
                              <span>{team2AvgScore} runs</span>
                            </div>
                            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, Math.max(10, (parseFloat(team2AvgScore) / 220) * 100))}%` }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mutual Fixtures history list log */}
                      {h2hMatches.length > 0 ? (
                        <div className="space-y-2 pt-2">
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block leading-none font-sans">Mutual Fixtures Head-to-Head History</span>
                          <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {h2hMatches.map((m, idx) => (
                              <div key={`h2h-match-${m.id || idx}`} className="p-3 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-900/60 rounded-xl border border-slate-150 dark:border-slate-850 flex items-center justify-between text-[11px] font-bold">
                                <div>
                                  <span className="text-slate-400 font-extrabold">{m.stage || 'League Stage'} • {m.date}</span>
                                  <p className="text-slate-800 dark:text-slate-205 font-black mt-1 uppercase">
                                    {m.teamAName} <span className="text-indigo-500">{m.scoreA || '0/0'}</span> vs {m.teamBName} <span className="text-purple-550 dark:text-purple-400">{m.scoreB || '0/0'}</span>
                                  </p>
                                </div>
                                <span className="text-[9px] py-1 px-2.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-extrabold rounded-lg">
                                  {m.winReason || 'Completed Match'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/45 border rounded-2xl text-center text-slate-400 text-[10.5px] font-semibold font-sans">
                          No completed matches have been recorded between <strong className="text-slate-650 dark:text-slate-200">{team1.name}</strong> and <strong className="text-slate-650 dark:text-slate-200">{team2.name}</strong> yet in this tournament.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {tourTab === 'venue-scheduler' && (
            <div className="space-y-6">
              <TournamentVenueScheduler
                tournamentId={activeTournament.id}
                format={activeTournament.format}
                roundsType={activeTournament.type}
                matches={activeTournament.matches}
                teams={activeTournament.teams.map(t => ({
                  id: t.id,
                  name: t.name,
                  captain: t.captain,
                  contactEmail: `${t.name.toLowerCase().replace(/\s+/g, '')}@gully.com`,
                  regStatus: 'Approved' as const,
                  regFeePaid: true,
                  seed: 1,
                  players: (t.players || []).map(pName => {
                    const idx = Math.abs(pName.charCodeAt(0)) % 4;
                    const role = idx === 0 ? 'Batsman' : idx === 1 ? 'Bowler' : idx === 2 ? 'All-Rounder' : 'Wicket-Keeper';
                    return {
                      name: pName,
                      age: 20 + (idx % 12),
                      role,
                      battingStyle: idx < 2 ? 'Right Hand' : 'Left Hand',
                      bowlingStyle: idx === 1 ? 'Right-Arm Fast' : idx === 2 ? 'Right-Arm Spin' : 'None',
                      regFeePaid: true,
                      regFeeAmount: 50
                    };
                  })
                }))}
                onUpdateTeams={(nextRosterTeams) => {
                  const updatedTournaments = tournaments.map(t => {
                    if (t.id !== activeTournamentId) return t;
                    const survivingTeamIds = nextRosterTeams.map(rt => rt.id);
                    const filteredMatches = t.matches.filter(m => survivingTeamIds.includes(m.teamAId) && survivingTeamIds.includes(m.teamBId));
                    return {
                      ...t,
                      teams: nextRosterTeams.map(rt => {
                        const orig = t.teams.find(ot => ot.id === rt.id);
                        return {
                          id: rt.id,
                          name: rt.name,
                          captain: rt.captain,
                          logo: orig?.logo || '',
                          playerPhotos: orig?.playerPhotos || {},
                          players: rt.players.map(p => typeof p === 'string' ? p : p.name)
                        };
                      }),
                      matches: filteredMatches,
                      status: survivingTeamIds.length === 0 ? 'setup' : t.status
                    };
                  });
                  setTournaments(updatedTournaments);
                  triggerNotification("Teams and squad rosters synchronized!");
                }}
                onUpdateSchedule={(nextMatches) => {
                  const updatedTournaments = tournaments.map(t => {
                    if (t.id !== activeTournamentId) return t;
                    return {
                      ...t,
                      status: nextMatches.length === 0 ? 'setup' : 'active',
                      matches: nextMatches
                    };
                  });
                  setTournaments(updatedTournaments);
                  triggerNotification(nextMatches.length === 0 ? "Fixtures schedule reset completely!" : "Fixtures updated and smart-scheduled!");
                }}
              />

              {/* Requirement 3: Auto-Configured Tournament Points Table in Tournament Setup */}
              <div className="mt-8 space-y-4 pt-6 border-t border-slate-200/60 dark:border-slate-800/40 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-mono text-[9px] font-black uppercase border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 size={11} /> Auto-Configured Standings
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Setup Integration</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
                      <Trophy className="text-amber-500" size={18} />
                      Tournament Points Table (Auto-Configuring)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Points Table calculates automatically as fixtures are created and results are entered.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTourTab('standings')}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-md"
                    >
                      Open Full Standings View →
                    </button>
                  </div>
                </div>

                <TournamentHierarchyPointsTable
                  tournament={activeTournament}
                  qualifyingThreshold={activeTournament.pointsConfig?.qualificationSpots ?? 4}
                />
              </div>
            </div>
          )}

          {tourTab === 'stats-leaderboards' && (
            <TournamentStatsAndLeaderboards
              tournamentId={activeTournament.id}
              tournamentName={activeTournament.name}
              teams={activeTournament.teams.map(t => ({
                id: t.id,
                name: t.name,
                captain: t.captain,
                contactEmail: `${t.name.toLowerCase().replace(/\s+/g, '')}@gully.com`,
                regStatus: 'Approved',
                regFeePaid: true,
                seed: 1,
                players: (t.players || []).map(pName => {
                  const idx = Math.abs(pName.charCodeAt(0)) % 4;
                  const role = idx === 0 ? 'Batsman' : idx === 1 ? 'Bowler' : idx === 2 ? 'All-Rounder' : 'Wicket-Keeper';
                  return {
                    name: pName,
                    age: 20 + (idx % 12),
                    role: role as any,
                    battingStyle: idx < 2 ? 'Right Hand' as any : 'Left Hand' as any,
                    bowlingStyle: idx === 1 ? 'Right-Arm Fast' as any : idx === 2 ? 'Right-Arm Spin' as any : 'None' as any,
                    regFeePaid: true,
                    regFeeAmount: 50
                  };
                })
              }))}
              matches={activeTournament.matches}
              onGoToFixtures={() => setTourTab('matches')}
              onStartScoringMatch={(m) => handleTriggerLiveScore(m)}
            />
          )}

          {/* TOURNAMENT PRIZE MONEY MANAGER TAB (Requirement 1 & Auto-Sync) */}
          {tourTab === 'prize-money' && (() => {
            const currentTourPrizes = activeTournament.prizes || getTournamentPrizesByTournamentId(activeTournament.id);
            const activePrizes = getValidActivePrizes(currentTourPrizes);
            const totalPrizePool = activePrizes.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            const currencySymbol = activePrizes[0]?.currencySymbol || '₹';

            return (
              <div className="space-y-6 animate-fade-in" id="tournament-prize-money-manager">
                {/* Header Feature Showcase Banner */}
                <div className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/40 border border-amber-500/30 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                  
                  <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-full text-2xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy size={12} className="text-amber-400" />
                          Tournament Prize Money Manager
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-full text-2xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                          Auto-Configures in Live Scoreboard
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                        {activeTournament.name} Prize Pool & Awards
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Prizes and sponsor honors configured here are automatically synchronized with the live match scoreboard whenever any match from this tournament is scored. <strong className="text-amber-300">No need to re-add prize data for each individual match!</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
                          <span className="text-3xs uppercase font-mono tracking-wider text-slate-400 block">Total Prize Purse</span>
                          <span className="text-xl font-black text-amber-400 font-mono">
                            {currencySymbol}{totalPrizePool.toLocaleString()}
                          </span>
                        </div>
                        <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
                          <span className="text-3xs uppercase font-mono tracking-wider text-slate-400 block">Configured Awards</span>
                          <span className="text-xl font-black text-emerald-400 font-mono">
                            {activePrizes.length} Categories
                          </span>
                        </div>
                        <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl">
                          <span className="text-3xs uppercase font-mono tracking-wider text-slate-400 block">Tournament Matches</span>
                          <span className="text-xl font-black text-cyan-400 font-mono">
                            {activeTournament.matches?.length || 0} Fixtures Covered
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                      <button
                        onClick={() => setShowTourPrizeModal(true)}
                        className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 border-none"
                      >
                        <Edit size={16} />
                        <span>Edit Prize Money & Sponsors</span>
                      </button>

                      <button
                        onClick={() => {
                          const prizesToSync = activeTournament.prizes || getTournamentPrizesByTournamentId(activeTournament.id);
                          saveTournamentPrizesForTournament(activeTournament.id, prizesToSync);
                          // Also store globally for active match if needed
                          try {
                            const activeMatchStr = localStorage.getItem('cricket_active_match');
                            if (activeMatchStr) {
                              const activeMatch = JSON.parse(activeMatchStr);
                              if (!activeMatch.tournamentId || activeMatch.tournamentId === activeTournament.id) {
                                activeMatch.tournamentPrizes = prizesToSync;
                                activeMatch.tournamentId = activeTournament.id;
                                activeMatch.tournamentName = activeTournament.name;
                                localStorage.setItem('cricket_active_match', JSON.stringify(activeMatch));
                              }
                            }
                          } catch (_) {}
                          triggerNotification(`⚡ Tournament prize data synced! When tournament matches are live, the scoreboard will automatically display these prizes.`);
                        }}
                        className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        <RefreshCw size={14} className="text-emerald-400" />
                        <span>Sync Scoreboard Cache Now</span>
                      </button>

                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent('cricket_trigger_presentation_board', {
                              detail: { tournamentId: activeTournament.id }
                            })
                          );
                          triggerNotification('🏆 Grand Prize Presentation Board triggered on live broadcast!');
                        }}
                        className="px-5 py-3 bg-slate-900/90 hover:bg-slate-800/90 text-amber-300 border border-amber-500/30 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 transition-all"
                      >
                        <Trophy size={14} className="text-amber-400" />
                        <span>Broadcast Ceremony Card</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto-Configuration Feature Explanation Alert */}
                <div className="p-4.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3 text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                      Automatic Scoreboard Configuration Enabled
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                      When you click <strong>"Go Live & Score"</strong> on any match in the Fixtures tab, all {activePrizes.length} configured prize tiers, sponsor names, company designations, and cash amounts are automatically applied to the active match broadcast graphics, sponsor crawling bugs, and post-match ceremony cards without requiring manual setup.
                    </p>
                  </div>
                </div>

                {/* Prize Cards Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Crown size={16} className="text-amber-500" />
                      Configured Tournament Awards ({activePrizes.length})
                    </h3>
                    <button
                      onClick={() => setShowTourPrizeModal(true)}
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                    >
                      <Plus size={14} /> Add or Modify Awards
                    </button>
                  </div>

                  {activePrizes.length === 0 ? (
                    <div className="p-12 text-center bg-slate-100 dark:bg-slate-900/60 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                      <Trophy size={40} className="text-slate-400 mx-auto opacity-40" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase">
                        No Prize Money Configured Yet
                      </p>
                      <p className="text-2xs text-slate-400 max-w-sm mx-auto">
                        Add Champions, Runner-Up, Man of the Series, and Best Bowler prize money so it automatically shows in live scoreboards.
                      </p>
                      <button
                        onClick={() => setShowTourPrizeModal(true)}
                        className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none"
                      >
                        Set Up Tournament Prizes
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {activePrizes.map((prize, idx) => {
                        const isTop = ['first_prize', 'champion'].includes(prize.id);
                        const isRunner = ['second_prize', 'runner_up'].includes(prize.id);
                        
                        return (
                          <div 
                            key={prize.id || idx}
                            className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                              isTop 
                                ? 'bg-gradient-to-b from-amber-500/15 to-yellow-500/5 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                                : isRunner
                                ? 'bg-gradient-to-b from-slate-500/15 to-slate-600/5 border-slate-400/40'
                                : 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-3xs font-mono font-black uppercase tracking-wider ${
                                  isTop ? 'bg-amber-500 text-slate-950' : isRunner ? 'bg-slate-300 text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}>
                                  {prize.trophyType ? `${prize.trophyType.toUpperCase()} TROPHY` : 'AWARD'}
                                </span>
                                {prize.sponsorPhoto && (
                                  <img 
                                    src={prize.sponsorPhoto} 
                                    alt={prize.sponsorName || 'Sponsor'} 
                                    className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
                                  />
                                )}
                              </div>

                              <div>
                                <h4 className="font-black text-base uppercase text-slate-900 dark:text-white tracking-tight leading-tight">
                                  {prize.title}
                                </h4>
                                {prize.subtitle && (
                                  <p className="text-2xs text-slate-500 dark:text-slate-400 uppercase font-mono mt-0.5">
                                    {prize.subtitle}
                                  </p>
                                )}
                              </div>

                              <div className="py-2">
                                <span className="text-2xs uppercase tracking-wider font-mono text-slate-400 block">Prize Amount</span>
                                <span className={`text-2xl font-black font-mono tracking-tight ${
                                  isTop ? 'text-amber-500 dark:text-amber-400' : isRunner ? 'text-slate-700 dark:text-slate-300' : 'text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {prize.currencySymbol || '₹'}{(Number(prize.amount) || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-2xs">
                              <div>
                                <span className="text-3xs uppercase font-mono text-slate-400 block">Sponsor / Courtesy</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                  {prize.sponsorName || 'Tournament Committee'}
                                </span>
                              </div>
                              <button
                                onClick={() => setShowTourPrizeModal(true)}
                                className="text-amber-500 hover:text-amber-400 p-1.5 hover:bg-amber-500/10 rounded-lg cursor-pointer border-none transition-colors"
                                title="Edit this award"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* TOURNAMENT DELETE CONFIRMATION REAL MODAL */}
      {tournamentToDeleteState && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[220] flex items-center justify-center p-4" id="delete-tournament-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Delete Tournament?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to permanently delete <strong className="text-rose-500 font-extrabold uppercase">{tournamentToDeleteState.name}</strong>? All matches, teams, and data for this tournament will be deleted forever. This action is irreversible.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTournamentToDeleteState(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeleteTournament(tournamentToDeleteState.id, tournamentToDeleteState.name)}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl border-none cursor-pointer animate-pulse"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW TOURNAMENT MODAL */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl md:max-w-2xl lg:max-w-3xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                  <Trophy size={18} className="sm:size-5" />
                </div>
                <div className="min-w-0 text-left">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    Create Gully Tournament
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    Setup rules, match format, officials, ground & points system
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none shrink-0"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar text-left">
              {/* Basic Championship Details */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Championship Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Gully Premier League (GPL 2026)"
                    value={newTourName}
                    onChange={(e) => setNewTourName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Format</label>
                    <select
                      value={newTourFormat}
                      onChange={(e) => setNewTourFormat(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="T20">T20 (20 ov)</option>
                      <option value="ODI">ODI (10 ov demo)</option>
                      <option value="Test">Test (5 ov match)</option>
                      <option value="Box Cricket">Box Cricket (8 ov)</option>
                      <option value="Custom">Custom Overs Match</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team Count Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newTourTeamCount}
                      onChange={(e) => setNewTourTeamCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                      placeholder="e.g. 8"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newTourDate}
                      onChange={(e) => setNewTourDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {newTourFormat === 'Custom' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-fade-in text-left">
                    <label className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-widest block mb-1">
                      No. of Match Overs (Custom Overs per Inning)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newTourCustomOvers}
                      onChange={(e) => setNewTourCustomOvers(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-amber-500"
                      placeholder="Enter custom overs count (e.g. 6, 12, 15)"
                    />
                  </div>
                )}

                {/* Tournament Shield / Logo Upload */}
                <div className="pt-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">
                    Tournament Shield / Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {tournamentLogoStr ? (
                        <img src={tournamentLogoStr} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Trophy className="text-slate-300 dark:text-slate-600" size={20} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-black uppercase text-[10px] cursor-pointer inline-flex items-center gap-1.5 transition">
                        <ImageIcon size={13} />
                        Browse Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (base64Str) => {
                                setTournamentLogoStr(base64Str);
                              });
                            }
                          }}
                        />
                      </label>
                      {tournamentLogoStr && (
                        <button
                          type="button"
                          onClick={() => setTournamentLogoStr('')}
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 font-bold text-[10px] uppercase cursor-pointer transition inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Type / Structure */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">
                  Tournament Structure
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'league', title: 'League', sub: 'Round Robin' },
                    { id: 'knockout', title: 'Knockout', sub: 'Bracket' },
                    { id: 'group-stage', title: 'Groups', sub: '+ Playoffs' },
                    { id: 'double-elimination', title: 'Double Elim', sub: 'Upper/Lower' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setNewTourType(st.id as any)}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-0.5 ${
                        newTourType === st.id
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <span className="font-black text-xs uppercase tracking-wide leading-tight">{st.title}</span>
                      <span className={`text-[9px] font-semibold ${newTourType === st.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {st.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Rules & Quick Chips */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                    Special Ground & Box Cricket Rules
                  </label>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    Tap chips to add
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {GULLY_RULES_PRESETS.map((preset) => {
                    const isSelected = newTourCustomRules.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setNewTourCustomRules((prev) => {
                            if (!prev.trim()) return preset;
                            if (prev.includes(preset)) {
                              return prev
                                .split('\n')
                                .filter(line => !line.includes(preset))
                                .join('\n')
                                .trim();
                            }
                            return `${prev}\n• ${preset}`.trim();
                          });
                        }}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition border ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{preset}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  placeholder="e.g. Underarm bowling only, direct wall hit is boundary, one-tip one-hand catch out..."
                  rows={2}
                  value={newTourCustomRules}
                  onChange={(e) => setNewTourCustomRules(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none placeholder-slate-400"
                />
              </div>

              {/* Ground Venue, Officials & Live Broadcast Crew */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold text-xs">🏟️</span>
                  <div>
                    <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 block tracking-wider">
                      Ground Venue, Officials & Broadcast Crew
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      Auto-configured for every match — no need to re-enter manually!
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ground / Turf Venue Name</label>
                  <input
                    type="text"
                    value={newTourGroundVenue}
                    onChange={(e) => setNewTourGroundVenue(e.target.value)}
                    placeholder="e.g. Shivaji Maharaj Ground (Turf)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">On-Field Umpire 1</label>
                    <input
                      type="text"
                      value={newTourUmpire1Name}
                      onChange={(e) => setNewTourUmpire1Name(e.target.value)}
                      placeholder="e.g. Umesh Shastri"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Leg Umpire 2</label>
                    <input
                      type="text"
                      value={newTourUmpire2Name}
                      onChange={(e) => setNewTourUmpire2Name(e.target.value)}
                      placeholder="e.g. Nitin Gadkari"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Official Scorer</label>
                    <input
                      type="text"
                      value={newTourScoreboardManagerName}
                      onChange={(e) => setNewTourScoreboardManagerName(e.target.value)}
                      placeholder="e.g. Ravi Shastri Jnr"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Live Commentator</label>
                    <input
                      type="text"
                      value={newTourCommentatorName}
                      onChange={(e) => setNewTourCommentatorName(e.target.value)}
                      placeholder="e.g. Harsha Bhogle (Live)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Live YouTube Channel Name</label>
                    <input
                      type="text"
                      value={newTourYoutubeChannelName}
                      onChange={(e) => setNewTourYoutubeChannelName(e.target.value)}
                      placeholder="e.g. Pune Cricket Live"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Channel Logo / Stream Badge</label>
                    <input
                      type="text"
                      value={newTourYoutubeChannelLogo}
                      onChange={(e) => setNewTourYoutubeChannelLogo(e.target.value)}
                      placeholder="https://... logo URL"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Local Cricket Teams & 1-Click Setup option */}
              <div 
                className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent rounded-2xl border border-emerald-500/25 space-y-2 cursor-pointer transition hover:border-emerald-500/40"
                onClick={() => setCreateTourAutoLocalTeams(!createTourAutoLocalTeams)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
                      <Zap size={14} className="fill-white" />
                    </span>
                    <div>
                      <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">
                        Local Cricket Teams & 1-Click Setup
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight block">
                        Pre-populate with local clubs (15-player squads) & instant live scoring
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={createTourAutoLocalTeams}
                    onChange={(e) => setCreateTourAutoLocalTeams(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {createTourAutoLocalTeams && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold m-0 pl-1 border-t border-emerald-500/15 pt-1.5">
                    ✓ Will auto-load {newTourTeamCount} verified local cricket teams (11 Playing XI + 4 Bench) with captain squad submission links ready to share!
                  </p>
                )}
              </div>

              {/* Tournament Points Table Auto-Configuration */}
              <div className="p-3.5 sm:p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 font-extrabold text-xs">📊</span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-900 dark:text-indigo-200 block tracking-wider">
                      Tournament Point Table Configuration
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      Auto-computes standings, Net Run Rate (NRR) and qualification after every match!
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Win Pts</label>
                    <input
                      type="number"
                      min="0"
                      value={newTourWinPoints}
                      onChange={(e) => setNewTourWinPoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Tie/NR Pts</label>
                    <input
                      type="number"
                      min="0"
                      value={newTourTiePoints}
                      onChange={(e) => setNewTourTiePoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Loss Pts</label>
                    <input
                      type="number"
                      min="0"
                      value={newTourLossPoints}
                      onChange={(e) => setNewTourLossPoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Qualify Spots</label>
                    <input
                      type="number"
                      min="1"
                      value={newTourQualSpots}
                      onChange={(e) => setNewTourQualSpots(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase">
                  {newTourFormat} {newTourFormat === 'Custom' ? `(${newTourCustomOvers} Ov)` : ''}
                </span>
                <span>•</span>
                <span>{newTourTeamCount} Teams</span>
                <span>•</span>
                <span className="capitalize">{newTourType.replace('-', ' ')}</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTournament}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
                >
                  <Sparkles size={14} />
                  <span>Create Tournament</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SQUAD TEAM MODAL */}
      {showAddTeamModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddTeamModal(false);
              setEditTeamId(null);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate m-0">
                {editTeamId ? 'Edit Gully Squad' : 'Add Gully Squad'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddTeamModal(false);
                  setEditTeamId(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar text-left">

            {/* Quick 1-Click Setup banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 flex items-center justify-between gap-2 text-left">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-emerald-500 fill-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">
                    Local Cricket Teams & 1-Click Setup
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium">
                    Send link to captain or pick 15-player squad
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddTeamModal(false);
                  setLocalTeamsModalInitialTab('local-teams');
                  setShowLocalTeamsModal(true);
                }}
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase border-none cursor-pointer shadow-sm shrink-0"
              >
                Open 1-Click Hub
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Squad Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pune Panthers"
                  value={teamFormName}
                  onChange={(e) => setTeamFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Squad Captain Name</label>
                <input
                  type="text"
                  value={teamFormCaptain}
                  onChange={(e) => setTeamFormCaptain(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              {/* Squad Badge/Logo Upload */}
              <div className="space-y-1 text-left">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Squad Badge/Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                    {teamFormLogo ? (
                      <img src={teamFormLogo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users className="text-slate-350" size={18} />
                    )}
                  </div>
                  <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 font-black uppercase text-[9px] cursor-pointer">
                    Browse Badge
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, (base64) => {
                            setTeamFormLogo(base64);
                          });
                        }
                      }}
                    />
                  </label>
                  {teamFormLogo && (
                    <button
                      type="button"
                      onClick={() => setTeamFormLogo('')}
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded border-none bg-transparent cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Roster Players (comma separated)</label>
                <textarea
                  value={teamFormPlayersText}
                  onChange={(e) => setTeamFormPlayersText(e.target.value)}
                  placeholder="Rahul Sharma, Shubham H, Amit P, Vikram K, Sachin T"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none resize-none"
                />
                <span className="text-[8px] text-slate-400 block">Specify names separated by commas.</span>
              </div>

              {/* Approved players quick insert list for tournament */}
              {approvedPlayers.length > 0 && (
                <div className="space-y-1.5 text-left">
                  <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">Approved Players Directory Quick Picker</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 py-1 bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-850">
                    {approvedPlayers.map(p => {
                      const currentNames = teamFormPlayersText.split(',').map(x => x.trim().toLowerCase());
                      const isSelected = currentNames.includes(p.fullName.trim().toLowerCase());
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const trimName = p.fullName.trim();
                            if (isSelected) {
                              const remaining = teamFormPlayersText.split(',').map(x => x.trim()).filter(x => x.toLowerCase() !== trimName.toLowerCase());
                              setTeamFormPlayersText(remaining.join(', '));
                              // Also remove photo if exists
                              if (teamFormPlayerPhotos[trimName]) {
                                const nextPhotos = { ...teamFormPlayerPhotos };
                                delete nextPhotos[trimName];
                                setTeamFormPlayerPhotos(nextPhotos);
                              }
                            } else {
                              const nextList = teamFormPlayersText.split(',').map(x => x.trim()).filter(x => x.length > 0);
                              nextList.push(trimName);
                              setTeamFormPlayersText(nextList.join(', '));
                              // If player has photo, automatically assign it!
                              if (p.photo) {
                                setTeamFormPlayerPhotos(prev => ({
                                  ...prev,
                                  [trimName]: p.photo
                                }));
                              }
                            }
                          }}
                          className={`px-2 py-1 text-[8px] font-extrabold uppercase rounded-lg border-none cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-emerald-500 text-white' 
                              : 'bg-white hover:bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-400 hover:text-emerald-500 border border-slate-150 dark:border-slate-700/60'
                          }`}
                        >
                          {isSelected ? `✓ ${p.fullName}` : `+ ${p.fullName}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual Player Photos */}
              {teamFormPlayersText.trim() && (
                <div className="space-y-2 mt-3 block pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Upload Squad Member Photos</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                    {teamFormPlayersText.split(',').map(p => p.trim()).filter(p => p.length > 0).map((pName, idx) => {
                      const photo = teamFormPlayerPhotos[pName] || '';
                      return (
                        <div key={`squad-member-photo-${idx}-${pName}`} className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden flex items-center justify-center shrink-0">
                            {photo ? (
                              <img src={photo} alt={pName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[8px] font-black uppercase text-slate-500">{pName[0]}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[8px] font-bold block truncate text-slate-700 dark:text-slate-300">{pName}</span>
                            <label className="text-[8px] text-emerald-500 hover:underline cursor-pointer font-black uppercase block">
                              Photo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleImageUpload(file, (base64) => {
                                      setTeamFormPlayerPhotos(prev => ({
                                        ...prev,
                                        [pName]: base64
                                      }));
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                          {photo && (
                            <button
                              type="button"
                              onClick={() => {
                                setTeamFormPlayerPhotos(prev => {
                                  const next = { ...prev };
                                  delete next[pName];
                                  return next;
                                });
                              }}
                              className="text-rose-500 hover:text-rose-600 p-0.5 border-none bg-transparent cursor-pointer text-[10px]"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            </div>

            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 z-20 shrink-0">
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setEditTeamId(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/20 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MATCH SCORECARD MODAL */}
      {updatingMatch && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setUpdatingMatch(null);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate m-0">
                Update Result Scorecard
              </h3>
              <button
                type="button"
                onClick={() => setUpdatingMatch(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none shrink-0"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar text-left">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-black uppercase text-center">
                {updatingMatch.teamAName} VS {updatingMatch.teamBName}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">{updatingMatch.teamAName} Score</label>
                  <input
                    type="text"
                    value={matchScoreA}
                    onChange={(e) => setMatchScoreA(e.target.value)}
                    placeholder="e.g. 120/4"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">{updatingMatch.teamAName} Overs</label>
                  <input
                    type="text"
                    value={matchOversA}
                    onChange={(e) => setMatchOversA(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">{updatingMatch.teamBName} Score</label>
                  <input
                    type="text"
                    value={matchScoreB}
                    onChange={(e) => setMatchScoreB(e.target.value)}
                    placeholder="e.g. 110/8"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">{updatingMatch.teamBName} Overs</label>
                  <input
                    type="text"
                    value={matchOversB}
                    onChange={(e) => setMatchOversB(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              </div>

              <div className="w-full h-[1px] bg-slate-100 dark:bg-slate-820" />

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Declared Winner</label>
                <select
                  value={matchWinnerId}
                  onChange={(e) => setMatchWinnerId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase outline-none"
                >
                  <option value="">-- Set Match Winner --</option>
                  <option value={updatingMatch.teamAId}>{updatingMatch.teamAName}</option>
                  <option value={updatingMatch.teamBId}>{updatingMatch.teamBName}</option>
                  <option value="Tie">Tied Match / No winner</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Margin / Win Details</label>
                <input
                  type="text"
                  value={matchWinReason}
                  onChange={(e) => setMatchWinReason(e.target.value)}
                  placeholder="e.g. Won by 10 runs"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Man of the Match</label>
                <input
                  type="text"
                  value={matchMoM}
                  onChange={(e) => setMatchMoM(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  placeholder="Rahul Sharma"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 z-20 shrink-0">
              <button
                onClick={() => setUpdatingMatch(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateResults}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/20 transition"
              >
                Confirm Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE SETTINGS MODAL */}
      {editingScheduleMatch && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingScheduleMatch(null);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate m-0">Alter Match Schedule</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const m = editingScheduleMatch;
                    setEditingScheduleMatch(null);
                    setSelectedMatchForBanner(m);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                  title="Open visual Banner Studio"
                >
                  <ImageIcon size={12} /> Studio
                </button>
                <button
                  type="button"
                  onClick={() => setEditingScheduleMatch(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar text-left">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Date</label>
                <input
                  type="date"
                  value={schedDate}
                  onChange={(e) => setSchedDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Time</label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM"
                  value={schedTime}
                  onChange={(e) => setSchedTime(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Venue ground</label>
                <input
                  type="text"
                  value={schedVenue}
                  onChange={(e) => setSchedVenue(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              {/* Match Banner Field */}
              <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon size={11} className="text-indigo-500" />
                    <span>Match Broadcast Banner (16:9 HD)</span>
                  </label>
                  {schedBannerUrl && (
                    <button
                      type="button"
                      onClick={() => setSchedBannerUrl('')}
                      className="text-[9px] text-rose-500 font-black uppercase hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {schedBannerUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-indigo-500/30">
                    <img
                      src={normalizeImageUrl(schedBannerUrl)}
                      alt="Banner Preview"
                      className="w-full h-24 object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleSmartImageError(e, schedBannerUrl)}
                    />
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white px-2 py-0.5 rounded text-[8px] font-bold">
                      Configured in Setup
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={schedBannerUrl}
                        placeholder="Paste image or Google Drive link..."
                        onChange={(e) => setSchedBannerUrl(normalizeImageUrl(e.target.value))}
                        onPaste={(e) => {
                          const text = e.clipboardData.getData('text');
                          if (text) {
                            e.preventDefault();
                            setSchedBannerUrl(normalizeImageUrl(text.trim()));
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                      />
                      <label className="px-3 py-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1">
                        <Upload size={12} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) setSchedBannerUrl(evt.target.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
                {schedBannerUrl && isGoogleDriveUrl(schedBannerUrl) && (
                  <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                    <Check size={11} /> Google Drive link stream active
                  </p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 z-20 shrink-0">
              <button
                onClick={() => setEditingScheduleMatch(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
              >
                Cancel
              </button>
              <button
                onClick={saveScheduleUpdate}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/20 transition"
              >
                Update Fixture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MATCH EDITOR MODAL */}
      {quickEditMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Quick Edit Match</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{quickEditMatch.teamAName} vs {quickEditMatch.teamBName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const m = quickEditMatch;
                  setQuickEditMatch(null);
                  setSelectedMatchForBanner(m);
                }}
                className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                title="Open visual Match Banner Studio"
              >
                <ImageIcon size={12} /> Studio
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Date</label>
                  <input
                    type="date"
                    value={quickEditDate}
                    onChange={(e) => setQuickEditDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Time</label>
                  <input
                    type="text"
                    value={quickEditTime}
                    placeholder="e.g. 10:00 AM"
                    onChange={(e) => setQuickEditTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Ground / Venue</label>
                <input
                  type="text"
                  value={quickEditVenue}
                  placeholder="Venue pitch"
                  onChange={(e) => setQuickEditVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Status</label>
                <select
                  value={quickEditStatus}
                  onChange={(e) => setQuickEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Match Banner Field */}
              <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1.5">
                    <ImageIcon size={11} className="text-indigo-500" />
                    <span>Match Banner (Configured in Setup)</span>
                  </label>
                  {quickEditBannerUrl && (
                    <button
                      type="button"
                      onClick={() => setQuickEditBannerUrl('')}
                      className="text-[9px] text-rose-500 font-black uppercase hover:underline cursor-pointer border-none bg-transparent"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {quickEditBannerUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-indigo-500/30">
                    <img
                      src={normalizeImageUrl(quickEditBannerUrl)}
                      alt="Banner Preview"
                      className="w-full h-24 object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleSmartImageError(e, quickEditBannerUrl)}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={quickEditBannerUrl}
                      placeholder="Paste image or Google Drive link..."
                      onChange={(e) => setQuickEditBannerUrl(normalizeImageUrl(e.target.value))}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData('text');
                        if (text) {
                          e.preventDefault();
                          setQuickEditBannerUrl(normalizeImageUrl(text.trim()));
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                    <label className="px-3 py-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1">
                      <Upload size={12} />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) setQuickEditBannerUrl(evt.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
                {quickEditBannerUrl && isGoogleDriveUrl(quickEditBannerUrl) && (
                  <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
                    <Check size={11} /> Google Drive link stream active
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setQuickEditMatch(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuickEditMatchUpdate}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Save Changes
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const mToScore = {
                    ...quickEditMatch,
                    date: quickEditDate,
                    time: quickEditTime,
                    venue: quickEditVenue,
                    status: quickEditStatus,
                    matchBannerUrl: quickEditBannerUrl
                  };
                  saveQuickEditMatchUpdate();
                  handleTriggerLiveScore(mToScore);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
              >
                <Play size={13} className="fill-white" />
                <span>Save & Start Scoring Match</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MATCH SCHEDULING MODAL */}
      {showCreateMatchModal && (() => {
        const modalTournament = activeTournament || tournaments.find(t => t.id === activeTournamentId) || tournaments[0] || null;
        const modalTeams: TournamentTeam[] = ((modalTournament?.teams || []) as any[])
          .filter(Boolean)
          .map((t: any, idx: number) => {
            if (typeof t === 'string') {
              return {
                id: `team_${idx}_${String(t).toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: String(t).trim() || `Team ${idx + 1}`,
                captain: `${String(t).trim() || `Team ${idx + 1}`} Captain`,
                players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11']
              };
            }
            const name = String(t?.name || t?.teamName || t?.title || `Team ${idx + 1}`).trim();
            const id = t?.id ? String(t.id) : `team_${idx}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            return {
              id,
              name,
              captain: t?.captain || `${name} Captain`,
              players: Array.isArray(t?.players) && t.players.length > 0 ? t.players : ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5', 'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10', 'Player 11'],
              logo: t?.logo,
              playerPhotos: t?.playerPhotos
            };
          });

        return (
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCreateMatchModal(false);
            }}
          >
            <div 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fade-in text-left animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate m-0">
                  Manual Match Scheduler
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateMatchModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar">
                {manualMatchError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0 text-rose-500" />
                    <span>{manualMatchError}</span>
                  </div>
                )}

                {/* Fewer than 2 teams banner */}
                {modalTeams.length < 2 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <Sparkles size={15} className="shrink-0 text-amber-500" />
                      <span>Quick-Start: Roster has {modalTeams.length} teams</span>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      You can type two custom team names below (they'll be auto-saved to your roster), or instantly populate 2 local gully squads with 1-click:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const currentT = modalTournament;
                        if (!currentT) return;
                        const t1Name = PRESET_LOCAL_CRICKET_TEAMS[0]?.name || 'Shivaji Warriors';
                        const t2Name = PRESET_LOCAL_CRICKET_TEAMS[1]?.name || 'Maratha Challengers';
                        const team1: TournamentTeam = {
                          id: `team_${Date.now()}_1`,
                          name: t1Name,
                          captain: PRESET_LOCAL_CRICKET_TEAMS[0]?.captain || 'Rohit',
                          players: PRESET_LOCAL_CRICKET_TEAMS[0]?.players || ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11'],
                          city: (currentT as any)?.city || 'Local'
                        };
                        const team2: TournamentTeam = {
                          id: `team_${Date.now()}_2`,
                          name: t2Name,
                          captain: PRESET_LOCAL_CRICKET_TEAMS[1]?.captain || 'Virat',
                          players: PRESET_LOCAL_CRICKET_TEAMS[1]?.players || ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11'],
                          city: (currentT as any)?.city || 'Local'
                        };
                        const updatedTeams = [...(currentT.teams || []), team1, team2];
                        const updatedTournament = { ...currentT, teams: updatedTeams };
                        const targetId = currentT.id || activeTournamentId;
                        const nextTournaments = tournaments.map(t => t.id === targetId ? updatedTournament : t);
                        setTournaments(nextTournaments);
                        try {
                          localStorage.setItem('gully_tournaments_v1', JSON.stringify(nextTournaments));
                          if (targetId) {
                            setDoc(doc(db, 'cricket_tournaments', targetId), updatedTournament).catch(console.warn);
                          }
                        } catch (_) {}
                        setManualMatchTeamAId(team1.id);
                        setManualMatchTeamBId(team2.id);
                        setManualCustomTeamAName(team1.name);
                        setManualCustomTeamBName(team2.name);
                        setManualMatchTeamMode('existing');
                        setManualMatchError(null);
                        triggerNotification('2 Local Gully Teams added to tournament!');
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-wider cursor-pointer border-none flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Sparkles size={12} />
                      <span>⚡ Add 2 Preset Teams to Roster</span>
                    </button>
                  </div>
                )}

                {/* Opponent Selection Mode Toggle */}
                {modalTeams.length >= 2 && (
                  <div className="flex items-center justify-between pb-0.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Match Opponents</span>
                    <button
                      type="button"
                      onClick={() => {
                        setManualMatchError(null);
                        setManualMatchTeamMode(prev => prev === 'existing' ? 'custom' : 'existing');
                      }}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      {manualMatchTeamMode === 'existing' ? '+ Enter Custom Team Names' : '← Choose from Registered Roster'}
                    </button>
                  </div>
                )}

                {/* TEAM SELECTION INPUTS */}
                {manualMatchTeamMode === 'existing' && modalTeams.length >= 2 ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team A</label>
                      <select
                        value={manualMatchTeamAId || modalTeams[0]?.id || ''}
                        onChange={(e) => {
                          setManualMatchTeamAId(e.target.value);
                          setManualMatchError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {modalTeams.map((t, idx) => (
                          <option key={t.id || `team_a_${idx}`} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team B</label>
                      <select
                        value={manualMatchTeamBId || modalTeams[1]?.id || modalTeams[0]?.id || ''}
                        onChange={(e) => {
                          setManualMatchTeamBId(e.target.value);
                          setManualMatchError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {modalTeams.map((t, idx) => (
                          <option key={t.id || `team_b_${idx}`} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team A Name</label>
                      <input
                        type="text"
                        value={manualCustomTeamAName || ''}
                        placeholder="e.g. Shivaji Warriors"
                        onChange={(e) => {
                          setManualCustomTeamAName(e.target.value);
                          setManualMatchError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team B Name</label>
                      <input
                        type="text"
                        value={manualCustomTeamBName || ''}
                        placeholder="e.g. Maratha Challengers"
                        onChange={(e) => {
                          setManualCustomTeamBName(e.target.value);
                          setManualMatchError(null);
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Stage/Tag</label>
                  <select
                    value={manualMatchStage}
                    onChange={(e) => setManualMatchStage(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  >
                    <option value="League">League Stage Match</option>
                    <option value="Quarter-Final">Quarter-Final</option>
                    <option value="Semi-Final">Semi-Final</option>
                    <option value="Final">Grand Final</option>
                    <option value="Friendly">Friendly Match</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={manualMatchDate}
                      onChange={(e) => setManualMatchDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Scheduled Time</label>
                    <input
                      type="text"
                      value={manualMatchTime}
                      placeholder="e.g. 10:00 AM"
                      onChange={(e) => setManualMatchTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Venue Pitch / Ground Location</label>
                  <input
                    type="text"
                    value={manualMatchVenue}
                    placeholder="e.g. Shivaji Maharaj Turf, Sector 5"
                    onChange={(e) => setManualMatchVenue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>

                {/* Match Banner Field for Manual Scheduler */}
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-indigo-700 dark:text-indigo-300 font-black uppercase tracking-widest flex items-center gap-1.5">
                      <ImageIcon size={11} className="text-indigo-500" />
                      <span>Match Banner (Auto-Configures in Setup)</span>
                    </label>
                    {manualMatchBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setManualMatchBannerUrl('')}
                        className="text-[9px] text-rose-500 font-black uppercase hover:underline cursor-pointer border-none bg-transparent"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {manualMatchBannerUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-indigo-500/30">
                      <img
                        src={normalizeImageUrl(manualMatchBannerUrl)}
                        alt="Banner Preview"
                        className="w-full h-24 object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => handleSmartImageError(e, manualMatchBannerUrl)}
                      />
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white px-2 py-0.5 rounded text-[8px] font-bold">
                        Attached ✓
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={manualMatchBannerUrl}
                          placeholder="Paste image or Google Drive link..."
                          onChange={(e) => setManualMatchBannerUrl(normalizeImageUrl(e.target.value))}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData('text');
                            if (text) {
                              e.preventDefault();
                              setManualMatchBannerUrl(normalizeImageUrl(text.trim()));
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                        />
                        <label className="px-3 py-2 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1">
                          <Upload size={12} />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  if (evt.target?.result) setManualMatchBannerUrl(evt.target.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex gap-1.5 flex-wrap items-center pt-0.5">
                        <span className="text-[9px] font-bold text-slate-400">Presets:</span>
                        <button
                          type="button"
                          onClick={() => setManualMatchBannerUrl('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1280&q=80')}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition"
                        >
                          Stadium
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualMatchBannerUrl('https://images.unsplash.com/photo-1531415074868-036b1c5f53ec?w=1280&q=80')}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition"
                        >
                          Turf
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualMatchBannerUrl('https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=1280&q=80')}
                          className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 transition"
                        >
                          Arena
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex gap-2 z-20 shrink-0">
                <button
                  onClick={() => setShowCreateMatchModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateManualMatch}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/20 transition"
                >
                  Schedule Match
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* EDIT TOURNAMENT MODAL */}
      {showEditTourModal && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditTourModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl md:max-w-2xl lg:max-w-3xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto text-left animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
                  <Edit size={18} className="sm:size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    Edit Tournament Settings
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    Update championship rules, format, venue officials & points
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTourModal(false)}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer border-none shrink-0"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar text-left">
              {/* Basic Championship Details */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Championship Name *</label>
                  <input
                    type="text"
                    value={editTourName}
                    onChange={(e) => setEditTourName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Format</label>
                    <select
                      value={editTourFormat}
                      onChange={(e) => setEditTourFormat(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="T20">T20 (20 ov)</option>
                      <option value="ODI">ODI (10 ov demo)</option>
                      <option value="Test">Test (5 ov match)</option>
                      <option value="Box Cricket">Box Cricket (8 ov)</option>
                      <option value="Custom">Custom Overs Match</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team Count Limit</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editTourTeamCount}
                      onChange={(e) => setEditTourTeamCount(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Commencement Date</label>
                    <input
                      type="date"
                      value={editTourDate}
                      onChange={(e) => setEditTourDate(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {editTourFormat === 'Custom' && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl animate-fade-in text-left">
                    <label className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-widest block mb-1">
                      No. of Match Overs (Custom Overs per Inning)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editTourCustomOvers}
                      onChange={(e) => setEditTourCustomOvers(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Tournament Shield / Logo Upload */}
                <div className="pt-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">
                    Update Shield / Logo
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {editTourLogo ? (
                        <img src={editTourLogo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Trophy className="text-slate-300 dark:text-slate-600" size={20} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 font-black uppercase text-[10px] cursor-pointer inline-flex items-center gap-1.5 transition">
                        <ImageIcon size={13} />
                        Browse Logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(file, (base64Str) => {
                                setEditTourLogo(base64Str);
                              });
                            }
                          }}
                        />
                      </label>
                      {editTourLogo && (
                        <button
                          type="button"
                          onClick={() => setEditTourLogo('')}
                          className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 font-bold text-[10px] uppercase cursor-pointer transition inline-flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Type / Structure */}
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1.5">
                  Tournament Structure
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'league', title: 'League', sub: 'Round Robin' },
                    { id: 'knockout', title: 'Knockout', sub: 'Bracket' },
                    { id: 'group-stage', title: 'Groups', sub: '+ Playoffs' },
                    { id: 'double-elimination', title: 'Double Elim', sub: 'Upper/Lower' }
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setEditTourType(st.id as any)}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-0.5 ${
                        editTourType === st.id
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                          : 'bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                      }`}
                    >
                      <span className="font-black text-xs uppercase tracking-wide leading-tight">{st.title}</span>
                      <span className={`text-[9px] font-semibold ${editTourType === st.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {st.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Rules & Quick Chips */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                    Special Ground & Box Cricket Rules
                  </label>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    Tap chips to add
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {GULLY_RULES_PRESETS.map((preset) => {
                    const isSelected = editTourCustomRules.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setEditTourCustomRules((prev) => {
                            if (!prev.trim()) return preset;
                            if (prev.includes(preset)) {
                              return prev
                                .split('\n')
                                .filter(line => !line.includes(preset))
                                .join('\n')
                                .trim();
                            }
                            return `${prev}\n• ${preset}`.trim();
                          });
                        }}
                        className={`px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition border ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{preset}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  placeholder="e.g. Underarm bowling only, direct wall hit is boundary, one-tip one-hand catch out..."
                  rows={2}
                  value={editTourCustomRules}
                  onChange={(e) => setEditTourCustomRules(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none placeholder-slate-400"
                />
              </div>

              {/* Ground Venue, Officials & Broadcast Crew */}
              <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 font-extrabold text-xs">🏟️</span>
                  <div>
                    <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 block tracking-wider">
                      Ground Venue, Officials & Broadcast Crew
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      Auto-configured for every match — no need to re-enter manually!
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Ground / Turf Venue Name</label>
                  <input
                    type="text"
                    value={editTourGroundVenue}
                    onChange={(e) => setEditTourGroundVenue(e.target.value)}
                    placeholder="e.g. Shivaji Maharaj Ground (Turf)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">On-Field Umpire 1</label>
                    <input
                      type="text"
                      value={editTourUmpire1Name}
                      onChange={(e) => setEditTourUmpire1Name(e.target.value)}
                      placeholder="e.g. Umesh Shastri"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Leg Umpire 2</label>
                    <input
                      type="text"
                      value={editTourUmpire2Name}
                      onChange={(e) => setEditTourUmpire2Name(e.target.value)}
                      placeholder="e.g. Nitin Gadkari"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Official Scorer</label>
                    <input
                      type="text"
                      value={editTourScoreboardManagerName}
                      onChange={(e) => setEditTourScoreboardManagerName(e.target.value)}
                      placeholder="e.g. Ravi Shastri Jnr"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Live Commentator</label>
                    <input
                      type="text"
                      value={editTourCommentatorName}
                      onChange={(e) => setEditTourCommentatorName(e.target.value)}
                      placeholder="e.g. Harsha Bhogle (Live)"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Live YouTube Channel Name</label>
                    <input
                      type="text"
                      value={editTourYoutubeChannelName}
                      onChange={(e) => setEditTourYoutubeChannelName(e.target.value)}
                      placeholder="e.g. Pune Cricket Live"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Channel Logo / Stream Badge</label>
                    <input
                      type="text"
                      value={editTourYoutubeChannelLogo}
                      onChange={(e) => setEditTourYoutubeChannelLogo(e.target.value)}
                      placeholder="https://... logo URL"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tournament Points Table Configuration */}
              <div className="p-3.5 sm:p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500 font-extrabold text-xs">📊</span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-900 dark:text-indigo-200 block tracking-wider">
                      Tournament Point Table Configuration
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      Standings, Net Run Rate (NRR) and qualification configure automatically!
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Win Pts</label>
                    <input
                      type="number"
                      min="0"
                      value={editTourWinPoints}
                      onChange={(e) => setNewTourWinPoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Tie/NR Pts</label>
                    <input
                      type="number"
                      min="0"
                      value={editTourTiePoints}
                      onChange={(e) => setEditTourTiePoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Loss Pts</label>
                    <input
                      type="number"
                      min="0"
                      value={editTourLossPoints}
                      onChange={(e) => setEditTourLossPoints(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Qualify Spots</label>
                    <input
                      type="number"
                      min="1"
                      value={editTourQualSpots}
                      onChange={(e) => setEditTourQualSpots(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs text-center outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-20 shrink-0">
              <div className="hidden sm:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase">
                  {editTourFormat} {editTourFormat === 'Custom' ? `(${editTourCustomOvers} Ov)` : ''}
                </span>
                <span>•</span>
                <span>{editTourTeamCount} Teams</span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowEditTourModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditTournament}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
                >
                  <Check size={14} />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET SCHEDULE CONFIRMATION MODAL */}
      {showResetScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500 shrink-0" /> Confirm Schedule Reset
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed md:leading-normal">
              Are you sure? This will delete all current schedule entries and restore default empty slots.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                id="cancel-reset-btn"
                onClick={() => setShowResetScheduleModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                id="confirm-reset-btn"
                onClick={() => {
                  setTournaments(tournaments.map(t => {
                    if (t.id !== activeTournamentId) return t;
                    return {
                      ...t,
                      status: 'setup',
                      matches: [],
                      winnerTeamName: null
                    };
                  }));
                  setShowResetScheduleModal(false);
                  triggerNotification("Schedule has been reset.");
                }}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-650 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md transition-all"
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM TEAM REMOVAL MODAL */}
      {teamToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-500 shrink-0" /> Delete Team Squad
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-350 leading-relaxed md:leading-normal">
              Are you sure? This will delete the squad <strong className="text-slate-900 dark:text-white">"{teamToDelete.name}"</strong> from the tournament list, clear its local registrations, and remove any matches scheduled with them.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                id="cancel-delete-team-btn"
                onClick={() => setTeamToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-team-btn"
                onClick={() => deleteTeam(teamToDelete.id, teamToDelete.name)}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-650 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none shadow-md transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCAL CRICKET TEAMS & 1-CLICK SETUP MODAL */}
      {showLocalTeamsModal && activeTournament && (
        <LocalTeamsAndOneClickSetupModal
          isOpen={showLocalTeamsModal}
          onClose={() => setShowLocalTeamsModal(false)}
          tournament={activeTournament}
          initialTab={localTeamsModalInitialTab}
          onAddTeam={(newTeam) => {
            setTournaments(tournaments.map(t => {
              if (t.id !== activeTournament.id) return t;
              return {
                ...t,
                teams: [...(t.teams || []), newTeam]
              };
            }));
          }}
          onAddMultipleTeams={(newTeams) => {
            setTournaments(tournaments.map(t => {
              if (t.id !== activeTournament.id) return t;
              return {
                ...t,
                teams: [...(t.teams || []), ...newTeams]
              };
            }));
          }}
          onStartLiveScore={onStartLiveScore}
          triggerNotification={triggerNotification}
        />
      )}

      {/* TOURNAMENT PRIZE MONEY & SPONSORS MANAGER MODAL (Requirement 1 & 2) */}
      {showTourPrizeModal && activeTournament && (
        <PrizeManagementModal
          isOpen={showTourPrizeModal}
          onClose={() => setShowTourPrizeModal(false)}
          tournamentId={activeTournament.id}
          tournamentName={activeTournament.name}
          initialPrizes={activeTournament.prizes || getTournamentPrizesByTournamentId(activeTournament.id)}
          onSave={(updatedPrizes) => {
            saveTournamentPrizesForTournament(activeTournament.id, updatedPrizes);
            setTournaments(tournaments.map(t => {
              if (t.id !== activeTournamentId) return t;
              return {
                ...t,
                prizes: updatedPrizes
              };
            }));
            triggerNotification(`🏆 Tournament prize money & sponsors updated! All live matches and PDF scorecards will automatically reflect this data.`);
          }}
        />
      )}

      {/* MATCH BANNER MODAL (Requirement 3) */}
      {selectedMatchForBanner && activeTournament && (
        <MatchBannerModal
          isOpen={!!selectedMatchForBanner}
          onClose={() => setSelectedMatchForBanner(null)}
          match={{
            id: selectedMatchForBanner.id,
            teamAName: selectedMatchForBanner.teamAName,
            teamBName: selectedMatchForBanner.teamBName,
            date: selectedMatchForBanner.date,
            time: selectedMatchForBanner.time,
            venue: selectedMatchForBanner.venue,
            stage: selectedMatchForBanner.stage,
            bannerUrl: selectedMatchForBanner.matchBannerUrl
          }}
          onSaveBanner={(bannerUrl) => {
            setTournaments(tournaments.map(t => {
              if (t.id !== activeTournamentId) return t;
              return {
                ...t,
                matches: t.matches.map(m => {
                  if (m.id !== selectedMatchForBanner.id) return m;
                  return {
                    ...m,
                    matchBannerUrl: bannerUrl
                  };
                })
              };
            }));
            setSelectedMatchForBanner(null);
            triggerNotification(`Match banner attached! It will automatically configure in match setup and live scoreboard.`);
          }}
        />
      )}

      {/* CRICHEROES TOURNAMENT DREAM XI MODAL */}
      {showDreamTeamModal && activeTournament && (
        <TournamentDreamTeamModal
          isOpen={showDreamTeamModal}
          onClose={() => setShowDreamTeamModal(false)}
          tournament={activeTournament}
        />
      )}

      {/* CRICHEROES PUBLIC SPECTATOR SHARE & GROUND QR POSTER MODAL */}
      {showPublicShareModal && activeTournament && (
        <TournamentPublicShareModal
          isOpen={showPublicShareModal}
          onClose={() => setShowPublicShareModal(false)}
          tournament={activeTournament}
        />
      )}

      {/* CRICHEROES / CRICBUZZ INTERACTIVE MATCH SCORECARD MODAL */}
      {showScorecardModal && selectedScorecardMatch && activeTournament && (
        <TournamentMatchScorecardModal
          isOpen={showScorecardModal}
          onClose={() => {
            setShowScorecardModal(false);
            setSelectedScorecardMatch(null);
          }}
          match={selectedScorecardMatch}
          tournament={{
            name: activeTournament.name,
            format: activeTournament.format,
            customOvers: activeTournament.customOvers,
            teams: activeTournament.teams
          }}
        />
      )}

      {/* MATCH AWARDS & TEAM CERTIFICATES MODAL */}
      {showMatchAwardCertModal && matchAwardCertData && (
        <MatchAwardsCertificateModal
          isOpen={showMatchAwardCertModal}
          onClose={() => {
            setShowMatchAwardCertModal(false);
            setMatchAwardCertData(null);
          }}
          data={matchAwardCertData}
          initialAward={initialMatchAwardType}
        />
      )}

    </div>
  );
};
