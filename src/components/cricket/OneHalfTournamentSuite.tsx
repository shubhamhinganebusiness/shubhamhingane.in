import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Flame, Users, Calendar, MapPin, Zap, Check, CheckCircle2,
  Play, Share2, Award, Download, RefreshCw, ChevronRight, Edit2,
  Plus, AlertCircle, Shield, Sparkles, X, ChevronDown, RotateCcw, Crown, Medal,
  Clock, AlertTriangle, Send, ListOrdered, LayoutGrid, Coffee, Filter, CalendarCheck,
  ArrowLeftRight, Shuffle, UserCheck, FileText, Image as ImageIcon, QrCode,
  BarChart3, Layers, Activity, Search, Upload, Trash2, Video, Mic, User
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TournamentLiveScoreConfig } from './CricketTournamentTab';
import { normalizeImageUrl, handleSmartImageError } from './imageUrlHelper';
import {
  getDefaultDay1To4Slots,
  getDefaultDay5Slots,
  getCaptainAlertWhatsAppUrl,
  getDayScheduleWhatsAppUrl,
  formatDateLabel,
  getStatusBadgeConfig,
  addMinutesToTimeStr,
  TimeSlotEditModal,
  AutoScheduleModal,
  BatchDelayModal,
  MatchScheduleTimelineView,
  Master5DayScheduleView
} from './OneHalfTimeSlotManager';
import {
  generateDefault15Squad,
  TeamDedicatedPageView,
  LocalTeamsDirectoryModal,
  CaptainSquadSubmissionModal,
  ManualMatchupModal
} from './OneHalfTeamManager';
import { doc, getDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db, safeSetDoc, safeGetDoc, isFirestoreQuotaExhausted, syncOneHalfTournamentToRealtimeDB, subscribeToRealtimeDBOneHalfTournament } from '../../lib/firebase';
import { deleteLocalTournament, deleteLocalMatch, DELETED_TOURNAMENTS_REGISTRY_KEY } from './cricketStorage';
import { TournamentVenueScheduler, TeamWithRoster } from './TournamentVenueScheduler';
import { TournamentStatsAndLeaderboards, StatsLeaderboardSubTab } from './TournamentStatsAndLeaderboards';
import { PointsTableModule } from './PointsTableModule';
import { MatchBannerModal } from './MatchBannerModal';
import { MatchAwardsCertificateModal, MatchCertificateData, AwardType } from './MatchAwardsCertificateModal';
import { computeFighterOfTheMatch } from '../../utils/certificateVerification';
import { TournamentMatchScorecardModal } from './TournamentMatchScorecardModal';
import { TournamentPublicShareModal } from './TournamentPublicShareModal';
import { PrizeManagementModal } from './PrizeManagementModal';
import { TournamentRecentResultsCarousel } from './TournamentRecentResultsCarousel';
import { CareerPlayerCardModal, PlayerCareerStats } from './CareerPlayerCardModal';
import {
  TournamentPrize,
  getTournamentPrizesByTournamentId,
  saveTournamentPrizesForTournament,
  getValidActivePrizes
} from '../../utils/cricketPrizeStorage';
import { calculateTournamentStandings, MatchScoreInput } from './modules/TournamentPointsCalculator';

export const ACTIVE_CLOUD_TOUR_ID = 'one_half_active_championship';

export interface OneHalfPlayer {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  jerseyNumber?: number | string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isWicketKeeper?: boolean;
  phone?: string;
  mobileNumber?: string;
  photo?: string;
}

export interface OneHalfTeam {
  id: string;
  name: string;
  shortName?: string;
  captain?: string;
  captainPhone?: string;
  viceCaptain?: string;
  wicketKeeper?: string;
  coach?: string;
  group: 1 | 2 | 3 | 4;
  city?: string;
  primaryColor?: string;
  logo?: string;
  squad?: OneHalfPlayer[];
  squadSubmitted?: boolean;
  squadSubmittedAt?: string;
}

export interface OneHalfMatch {
  id: string;
  day: 1 | 2 | 3 | 4 | 5;
  group?: 1 | 2 | 3 | 4;
  round: 'round1' | 'round2' | 'group_final' | 'semi_final' | 'third_fourth' | 'grand_final';
  matchNumber: number;
  label: string;
  teamA: string;
  teamB: string;
  scoreA?: string;
  scoreB?: string;
  oversA?: string;
  oversB?: string;
  winner?: string;
  winReason?: string;
  manOfTheMatch?: string;
  status: 'upcoming' | 'live' | 'completed' | 'delayed' | 'in_progress' | 'toss' | 'break' | 'abandoned';
  date?: string;
  time?: string;
  reportingTime?: string;
  slotDurationMins?: number;
  delayMins?: number;
  pitchVenue?: string;
  matchNotes?: string;
  matchBannerUrl?: string;
  umpire1?: string;
  umpire2?: string;
  scorer?: string;
}

export interface OneHalfTournamentState {
  id: string;
  name: string;
  groundName: string;
  overs: number;
  ballType: string;
  createdAt: string;
  startDate?: string;
  defaultSlotDurationMins?: number;
  prize1st: string;
  prize2nd: string;
  prize3rd: string;
  prize4th: string;
  teams: OneHalfTeam[];
  matches: OneHalfMatch[];
  updatedAt?: number;
  version?: number;
  lastCloudSyncTime?: string;
  prizes?: TournamentPrize[];
  umpire1Name?: string;
  umpire1Photo?: string;
  umpire2Name?: string;
  umpire2Photo?: string;
  scoreboardManagerName?: string;
  scoreboardManagerPhoto?: string;
  commentatorName?: string;
  commentatorPhoto?: string;
  youtubeChannelName?: string;
  youtubeChannelLogo?: string;
  tournamentLogo?: string;
}

const DEFAULT_32_TEAMS: string[] = [
  // Group 1 (Day 1)
  'Shivaji Park Warriors', 'Dadar Super Kings', 'Bandra Blasters', 'Mahim Royals',
  'Matunga Tigers', 'Parel Panthers', 'Worli Hurricanes', 'Prabhadevi Strikers',
  // Group 2 (Day 2)
  'Thane Titans', 'Mulund Mavericks', 'Ghatkopar Giants', 'Kurla Kings',
  'Sion Smashers', 'Vikhroli Vipers', 'Bhandup Bulls', 'Kanjurmarg Knights',
  // Group 3 (Day 3)
  'Andheri Aces', 'Borivali Badshahs', 'Kandivali Kings', 'Malad Maratha',
  'Goregaon Gladiators', 'Jogeshwari Juggernauts', 'Vile Parle Victors', 'Santacruz Stars',
  // Group 4 (Day 4)
  'Navi Mumbai Ninjas', 'Vashi Vanguards', 'Nerul Navigators', 'Belapur Busters',
  'Kharghar Khiladis', 'Panvel Pirates', 'Airoli Avengers', 'Ghansoli Gladiators'
];

const STORAGE_KEY = 'cricket_one_half_tournament_32';

export const createInitialOneHalfTournament = (customName?: string): OneHalfTournamentState => {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];

  const getDateForDay = (d: number) => {
    const target = new Date(today);
    target.setDate(target.getDate() + (d - 1));
    return target.toISOString().split('T')[0];
  };

  const day1To4DefaultSlots = getDefaultDay1To4Slots(8, 30, 75, 45);
  const day5DefaultSlots = getDefaultDay5Slots(9, 30, 90, 60);

  const teams: OneHalfTeam[] = DEFAULT_32_TEAMS.map((name, idx) => {
    const groupNum = (Math.floor(idx / 8) + 1) as 1 | 2 | 3 | 4;
    const captain = `Captain ${name.split(' ')[0]}`;
    return {
      id: `team_${idx + 1}`,
      name,
      captain,
      group: groupNum,
      city: 'Mumbai / Maharashtra',
      squad: generateDefault15Squad(name, captain),
      squadSubmitted: false
    };
  });

  const matches: OneHalfMatch[] = [];
  let matchCounter = 1;

  // Days 1 to 4: Groups 1 to 4 (7 matches each)
  for (let grp = 1 as 1 | 2 | 3 | 4; grp <= 4; grp++) {
    const grpTeams = teams.filter(t => t.group === grp);
    const grpDate = getDateForDay(grp);
    let daySlotIdx = 0;
    
    // Round 1 (Pre-Quarters): 4 Matches
    const r1Matches: OneHalfMatch[] = [];
    for (let m = 0; m < 4; m++) {
      const slot = day1To4DefaultSlots[daySlotIdx++];
      const match: OneHalfMatch = {
        id: `day_${grp}_r1_m${m + 1}`,
        day: grp,
        group: grp,
        round: 'round1',
        matchNumber: matchCounter++,
        label: `Day ${grp} (Group ${grp}) - Round 1 (Match ${m + 1})`,
        teamA: grpTeams[m * 2]?.name || `Team ${m * 2 + 1}`,
        teamB: grpTeams[m * 2 + 1]?.name || `Team ${m * 2 + 2}`,
        status: 'upcoming',
        date: grpDate,
        time: slot?.time || '08:30 AM',
        reportingTime: slot?.reportingTime || '08:00 AM',
        slotDurationMins: 75,
        pitchVenue: 'Main Turf Ground'
      };
      r1Matches.push(match);
      matches.push(match);
    }

    // Round 2 (Group Semi-Finals): 2 Matches
    const sf1Slot = day1To4DefaultSlots[daySlotIdx++];
    const r2Match1: OneHalfMatch = {
      id: `day_${grp}_r2_m1`,
      day: grp,
      group: grp,
      round: 'round2',
      matchNumber: matchCounter++,
      label: `Day ${grp} (Group ${grp}) - Semi-Final 1`,
      teamA: `Winner R1 M1`,
      teamB: `Winner R1 M2`,
      status: 'upcoming',
      date: grpDate,
      time: sf1Slot?.time || '02:00 PM',
      reportingTime: sf1Slot?.reportingTime || '01:30 PM',
      slotDurationMins: 75,
      pitchVenue: 'Main Turf Ground'
    };

    const sf2Slot = day1To4DefaultSlots[daySlotIdx++];
    const r2Match2: OneHalfMatch = {
      id: `day_${grp}_r2_m2`,
      day: grp,
      group: grp,
      round: 'round2',
      matchNumber: matchCounter++,
      label: `Day ${grp} (Group ${grp}) - Semi-Final 2`,
      teamA: `Winner R1 M3`,
      teamB: `Winner R1 M4`,
      status: 'upcoming',
      date: grpDate,
      time: sf2Slot?.time || '03:15 PM',
      reportingTime: sf2Slot?.reportingTime || '02:45 PM',
      slotDurationMins: 75,
      pitchVenue: 'Main Turf Ground'
    };
    matches.push(r2Match1, r2Match2);

    // Round 3 (Group Final / QF): 1 Match -> Winner goes to Day 5 Semi-Final!
    const gfSlot = day1To4DefaultSlots[daySlotIdx++];
    const groupFinal: OneHalfMatch = {
      id: `day_${grp}_final`,
      day: grp,
      group: grp,
      round: 'group_final',
      matchNumber: matchCounter++,
      label: `Day ${grp} (Group ${grp}) - Group Final (Qualifier)`,
      teamA: `Winner SF 1`,
      teamB: `Winner SF 2`,
      status: 'upcoming',
      date: grpDate,
      time: gfSlot?.time || '04:45 PM',
      reportingTime: gfSlot?.reportingTime || '04:15 PM',
      slotDurationMins: 75,
      pitchVenue: 'Center Stadium Pitch'
    };
    matches.push(groupFinal);
  }

  // Day 5: Finals Day (4 Matches)
  const day5Date = getDateForDay(5);

  // Semi-Final 1: Group 1 Qualifier vs Group 2 Qualifier
  const sf1: OneHalfMatch = {
    id: 'day_5_sf1',
    day: 5,
    round: 'semi_final',
    matchNumber: matchCounter++,
    label: 'Day 5 - Semi-Final 1 (Group 1 Qual vs Group 2 Qual)',
    teamA: 'Day 1 Qualifier (Group 1)',
    teamB: 'Day 2 Qualifier (Group 2)',
    status: 'upcoming',
    date: day5Date,
    time: day5DefaultSlots[0]?.time || '09:30 AM',
    reportingTime: day5DefaultSlots[0]?.reportingTime || '09:00 AM',
    slotDurationMins: 90,
    pitchVenue: 'Main Showcase Turf'
  };

  // Semi-Final 2: Group 3 Qualifier vs Group 4 Qualifier
  const sf2: OneHalfMatch = {
    id: 'day_5_sf2',
    day: 5,
    round: 'semi_final',
    matchNumber: matchCounter++,
    label: 'Day 5 - Semi-Final 2 (Group 3 Qual vs Group 4 Qual)',
    teamA: 'Day 3 Qualifier (Group 3)',
    teamB: 'Day 4 Qualifier (Group 4)',
    status: 'upcoming',
    date: day5Date,
    time: day5DefaultSlots[1]?.time || '11:15 AM',
    reportingTime: day5DefaultSlots[1]?.reportingTime || '10:45 AM',
    slotDurationMins: 90,
    pitchVenue: 'Main Showcase Turf'
  };

  // 3rd & 4th Place Match: Loser SF1 vs Loser SF2
  const thirdFourth: OneHalfMatch = {
    id: 'day_5_3rd_4th',
    day: 5,
    round: 'third_fourth',
    matchNumber: matchCounter++,
    label: 'Day 5 - 3rd & 4th Place Match (Loser SF1 vs Loser SF2)',
    teamA: 'Loser of Semi-Final 1',
    teamB: 'Loser of Semi-Final 2',
    status: 'upcoming',
    date: day5Date,
    time: day5DefaultSlots[2]?.time || '02:00 PM',
    reportingTime: day5DefaultSlots[2]?.reportingTime || '01:30 PM',
    slotDurationMins: 90,
    pitchVenue: 'Main Showcase Turf'
  };

  // Grand Final: Winner SF1 vs Winner SF2
  const grandFinal: OneHalfMatch = {
    id: 'day_5_grand_final',
    day: 5,
    round: 'grand_final',
    matchNumber: matchCounter++,
    label: 'Day 5 - GRAND FINAL (Winner SF1 vs Winner SF2)',
    teamA: 'Winner of Semi-Final 1',
    teamB: 'Winner of Semi-Final 2',
    status: 'upcoming',
    date: day5Date,
    time: day5DefaultSlots[3]?.time || '04:00 PM',
    reportingTime: day5DefaultSlots[3]?.reportingTime || '03:30 PM',
    slotDurationMins: 100,
    pitchVenue: 'Grand Center Stage Pitch'
  };

  matches.push(sf1, sf2, thirdFourth, grandFinal);

  return {
    id: `one_half_${Date.now()}`,
    name: customName || 'City One-Half 32 Championship',
    groundName: 'Shivaji Ground Turf Complex',
    overs: 8,
    ballType: 'Tennis / Gully Ball',
    createdAt: new Date().toISOString(),
    updatedAt: Date.now(),
    startDate,
    defaultSlotDurationMins: 75,
    prize1st: '₹51,000 + Trophy 🏆',
    prize2nd: '₹25,000 + Trophy 🥈',
    prize3rd: '₹15,000 + Trophy 🥉',
    prize4th: '₹7,000 + Memento 🏅',
    teams,
    matches
  };
};

export interface OneHalfTournamentSuiteProps {
  onStartLiveScore?: (config: TournamentLiveScoreConfig) => void;
  onClose?: () => void;
}

export const OneHalfTournamentSuite: React.FC<OneHalfTournamentSuiteProps> = ({
  onStartLiveScore,
  onClose
}) => {
  const [tournament, setTournament] = useState<OneHalfTournamentState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: OneHalfTournamentState = JSON.parse(saved);
        // Backfill squads if older saved state doesn't have 15-player squads
        if (parsed.teams) {
          parsed.teams = parsed.teams.map((t) => {
            if (!t.squad || t.squad.length === 0) {
              return {
                ...t,
                squad: generateDefault15Squad(t.name, t.captain),
                squadSubmitted: t.squadSubmitted || false
              };
            }
            return t;
          });
        }
        // Backfill time slots if older saved state doesn't have times
        if (parsed.matches && parsed.matches.length > 0 && !parsed.matches[0].time) {
          const day1To4Slots = getDefaultDay1To4Slots(8, 30, 75, 45);
          const day5Slots = getDefaultDay5Slots(9, 30, 90, 60);
          const today = new Date();
          const getDateForDay = (d: number) => {
            const target = new Date(today);
            target.setDate(target.getDate() + (d - 1));
            return target.toISOString().split('T')[0];
          };

          parsed.startDate = parsed.startDate || today.toISOString().split('T')[0];
          parsed.matches = parsed.matches.map((m) => {
            if (m.day >= 1 && m.day <= 4) {
              const grpMatches = parsed.matches.filter(x => x.day === m.day);
              const idx = grpMatches.findIndex(x => x.id === m.id);
              const slot = day1To4Slots[idx >= 0 ? idx : 0];
              return {
                ...m,
                date: m.date || getDateForDay(m.day),
                time: m.time || slot?.time || '08:30 AM',
                reportingTime: m.reportingTime || slot?.reportingTime || '08:00 AM',
                slotDurationMins: m.slotDurationMins || 75,
                pitchVenue: m.pitchVenue || 'Main Turf Ground'
              };
            } else {
              const day5Matches = parsed.matches.filter(x => x.day === 5);
              const idx = day5Matches.findIndex(x => x.id === m.id);
              const slot = day5Slots[idx >= 0 ? idx : 0];
              return {
                ...m,
                date: m.date || getDateForDay(5),
                time: m.time || slot?.time || '09:30 AM',
                reportingTime: m.reportingTime || slot?.reportingTime || '09:00 AM',
                slotDurationMins: m.slotDurationMins || 90,
                pitchVenue: m.pitchVenue || 'Main Showcase Turf'
              };
            }
          });
        }
        return parsed;
      }
    } catch (_) {}
    return createInitialOneHalfTournament();
  });

  const [activeDay, setActiveDay] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [mainTab, setMainTab] = useState<'bracket' | 'results' | 'teams' | 'venue-scheduler' | 'standings' | 'stats' | 'prizes'>('bracket');
  const [resultsDayFilter, setResultsDayFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [viewMode, setViewMode] = useState<'bracket' | 'schedule' | 'all_days' | 'teams'>('bracket');
  const [selectedTeamIdForPage, setSelectedTeamIdForPage] = useState<string | null>(null);
  const [showManualMatchupModal, setShowManualMatchupModal] = useState(false);
  const [manualMatchupDay, setManualMatchupDay] = useState<1 | 2 | 3 | 4>(1);
  const [showLocalDirectoryModal, setShowLocalDirectoryModal] = useState(false);
  const [showCaptainSubmissionModal, setShowCaptainSubmissionModal] = useState(false);
  const [captainSubTeam, setCaptainSubTeam] = useState<OneHalfTeam | null>(null);
  const [showShuffleConfirmModal, setShowShuffleConfirmModal] = useState(false);

  // Match filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'live' | 'upcoming'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Competitive Modals
  const [selectedScorecardMatch, setSelectedScorecardMatch] = useState<OneHalfMatch | null>(null);
  const [showScorecardModal, setShowScorecardModal] = useState(false);

  const [selectedMatchForBanner, setSelectedMatchForBanner] = useState<OneHalfMatch | null>(null);
  const [showMatchBannerModal, setShowMatchBannerModal] = useState(false);

  const [showMatchAwardCertModal, setShowMatchAwardCertModal] = useState(false);
  const [matchAwardCertData, setMatchAwardCertData] = useState<MatchCertificateData | null>(null);
  const [initialMatchAwardType, setInitialMatchAwardType] = useState<AwardType>('potm');

  const [showPublicShareModal, setShowPublicShareModal] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [prizeMatchDayFilter, setPrizeMatchDayFilter] = useState<'all' | 1 | 2 | 3 | 4 | 5>('all');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isTournamentDeletedState, setIsTournamentDeletedState] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem('cricket_one_half_tournament_deleted') === 'true';
    } catch {
      return false;
    }
  });
  const [newTourNameInput, setNewTourNameInput] = useState('City One-Half 32 Championship');
  const [newTourGroundInput, setNewTourGroundInput] = useState('Shivaji Ground Turf Complex');
  const [newTourOversInput, setNewTourOversInput] = useState(8);
  const [selectedCareerPlayer, setSelectedCareerPlayer] = useState<PlayerCareerStats | null>(null);
  const [isCapStripCompact, setIsCapStripCompact] = useState(false);

  // Standings Subtab Mode
  const [standingsTabMode, setStandingsTabMode] = useState<'tables' | 'sandbox'>('tables');
  const [standingsGroupFilter, setStandingsGroupFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');
  const [statsSubTab, setStatsSubTab] = useState<StatsLeaderboardSubTab>('batting');
  const [statsGroupFilter, setStatsGroupFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');

  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [showTimeSlotEditModal, setShowTimeSlotEditModal] = useState(false);
  const [editingSlotMatch, setEditingSlotMatch] = useState<OneHalfMatch | null>(null);
  const [showBatchDelayModal, setShowBatchDelayModal] = useState(false);

  const [editingMatch, setEditingMatch] = useState<OneHalfMatch | null>(null);
  const [quickScoreA, setQuickScoreA] = useState('');
  const [quickScoreB, setQuickScoreB] = useState('');
  const [quickOversA, setQuickOversA] = useState('');
  const [quickOversB, setQuickOversB] = useState('');
  const [quickWinner, setQuickWinner] = useState('');
  const [quickWinReason, setQuickWinReason] = useState('');
  const [quickPOTM, setQuickPOTM] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tournamentTitle, setTournamentTitle] = useState(tournament.name);
  const [groundTitle, setGroundTitle] = useState(tournament.groundName);
  const [oversCount, setOversCount] = useState(tournament.overs);
  const [ballTypeInput, setBallTypeInput] = useState(tournament.ballType);
  const [prize1, setPrize1] = useState(tournament.prize1st);
  const [prize2, setPrize2] = useState(tournament.prize2nd);
  const [prize3, setPrize3] = useState(tournament.prize3rd);
  const [prize4, setPrize4] = useState(tournament.prize4th);
  const [settingTournamentLogo, setSettingTournamentLogo] = useState(tournament.tournamentLogo || '');
  const [settingUmpire1, setSettingUmpire1] = useState(tournament.umpire1Name || 'Official Umpire 1');
  const [settingUmpire1Photo, setSettingUmpire1Photo] = useState(tournament.umpire1Photo || '');
  const [settingUmpire2, setSettingUmpire2] = useState(tournament.umpire2Name || 'Official Umpire 2');
  const [settingUmpire2Photo, setSettingUmpire2Photo] = useState(tournament.umpire2Photo || '');
  const [settingScorer, setSettingScorer] = useState(tournament.scoreboardManagerName || 'Official Scorer');
  const [settingScorerPhoto, setSettingScorerPhoto] = useState(tournament.scoreboardManagerPhoto || '');
  const [settingCommentator, setSettingCommentator] = useState(tournament.commentatorName || 'Live Commentator');
  const [settingCommentatorPhoto, setSettingCommentatorPhoto] = useState(tournament.commentatorPhoto || '');
  const [settingYoutubeName, setSettingYoutubeName] = useState(tournament.youtubeChannelName || '');
  const [settingYoutubeLogo, setSettingYoutubeLogo] = useState(tournament.youtubeChannelLogo || '');

  // Keep Settings Modal inputs synced when tournament state updates from Realtime Database / Cloud
  useEffect(() => {
    setTournamentTitle(tournament.name);
    setGroundTitle(tournament.groundName);
    setOversCount(tournament.overs);
    setBallTypeInput(tournament.ballType);
    setPrize1(tournament.prize1st);
    setPrize2(tournament.prize2nd);
    setPrize3(tournament.prize3rd);
    setPrize4(tournament.prize4th);
    setSettingTournamentLogo(tournament.tournamentLogo || '');
    setSettingUmpire1(tournament.umpire1Name || 'Official Umpire 1');
    setSettingUmpire1Photo(tournament.umpire1Photo || '');
    setSettingUmpire2(tournament.umpire2Name || 'Official Umpire 2');
    setSettingUmpire2Photo(tournament.umpire2Photo || '');
    setSettingScorer(tournament.scoreboardManagerName || 'Official Scorer');
    setSettingScorerPhoto(tournament.scoreboardManagerPhoto || '');
    setSettingCommentator(tournament.commentatorName || 'Live Commentator');
    setSettingCommentatorPhoto(tournament.commentatorPhoto || '');
    setSettingYoutubeName(tournament.youtubeChannelName || '');
    setSettingYoutubeLogo(tournament.youtubeChannelLogo || '');
  }, [
    tournament.name,
    tournament.groundName,
    tournament.overs,
    tournament.ballType,
    tournament.prize1st,
    tournament.prize2nd,
    tournament.prize3rd,
    tournament.prize4th,
    tournament.tournamentLogo,
    tournament.umpire1Name,
    tournament.umpire1Photo,
    tournament.umpire2Name,
    tournament.umpire2Photo,
    tournament.scoreboardManagerName,
    tournament.scoreboardManagerPhoto,
    tournament.commentatorName,
    tournament.commentatorPhoto,
    tournament.youtubeChannelName,
    tournament.youtubeChannelLogo
  ]);

  const handleOfficialPhotoUpload = (file: File, callback: (base64Str: string) => void) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 420;
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.78));
          } else {
            callback(reader.result as string);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const [showTeamEditModal, setShowTeamEditModal] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<OneHalfTeam | null>(null);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(tournament.lastCloudSyncTime || null);

  const isApplyingCloudSyncRef = useRef(false);
  const lastCloudContentHashRef = useRef<string>('');

  const getTournamentContentHash = (t: OneHalfTournamentState | null | undefined): string => {
    if (!t) return '';
    const { updatedAt: _u, lastCloudSyncTime: _l, ...rest } = t as any;
    try {
      return JSON.stringify(rest);
    } catch {
      return '';
    }
  };

  // Check URL query parameters and sync latest cloud state on mount (cross-device & hosting online)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const teamId = params.get('teamId');
        const tourIdParam = params.get('tourId');

        if (action === 'submit_squad' && teamId) {
          setSelectedTeamIdForPage(teamId);
          setViewMode('teams');
        }

        // Automatic resilient background fetch from cloud on load (cross-laptop synchronization)
        if (localStorage.getItem('cricket_one_half_tournament_deleted') !== 'true') {
          const targetDocId = tourIdParam || ACTIVE_CLOUD_TOUR_ID;
          safeGetDoc('cricket_tournaments', targetDocId).then((cloudData: OneHalfTournamentState | null) => {
            if (localStorage.getItem('cricket_one_half_tournament_deleted') === 'true') return;
            if (cloudData && Array.isArray(cloudData.matches) && Array.isArray(cloudData.teams) && !(cloudData as any).isDeleted) {
            setTournament((prev) => {
              const cloudTime = cloudData.updatedAt || 0;
              const localTime = prev.updatedAt || 0;
              const cloudHash = getTournamentContentHash(cloudData);
              const localHash = getTournamentContentHash(prev);
              if (cloudTime > localTime && cloudHash && cloudHash !== localHash) {
                isApplyingCloudSyncRef.current = true;
                lastCloudContentHashRef.current = cloudHash;
                return cloudData;
              }
              return prev;
            });
            setSyncStatus('synced');
            if (cloudData.lastCloudSyncTime) {
              setLastSyncedAt(cloudData.lastCloudSyncTime);
            }
          }
          }).catch(() => {});
        }
        // Listen for live match result updates from Live Scorer or storage events
        const handleLocalOneHalfSync = (e?: Event) => {
          try {
            const customDetail = (e as CustomEvent)?.detail;
            if (customDetail && Array.isArray(customDetail.matches) && Array.isArray(customDetail.teams)) {
              setTournament(customDetail);
              return;
            }
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && Array.isArray(parsed.matches) && Array.isArray(parsed.teams)) {
                setTournament(prev => {
                  const prevHash = getTournamentContentHash(prev);
                  const nextHash = getTournamentContentHash(parsed);
                  return prevHash !== nextHash ? parsed : prev;
                });
              }
            }
          } catch (_) {}
        };

        window.addEventListener('one_half_tournament_updated', handleLocalOneHalfSync);
        window.addEventListener('storage', handleLocalOneHalfSync);
        return () => {
          window.removeEventListener('one_half_tournament_updated', handleLocalOneHalfSync);
          window.removeEventListener('storage', handleLocalOneHalfSync);
        };
      } catch (_) {}
    }
  }, []);

  // Real-time automatic background subscription to online cloud updates (Dual Realtime Database & Firestore)
  useEffect(() => {
    // 1. Subscribe to Firebase Realtime Database
    const unsubRtdb = subscribeToRealtimeDBOneHalfTournament((rtdbData) => {
      if (localStorage.getItem('cricket_one_half_tournament_deleted') === 'true') return;
      if (rtdbData && Array.isArray(rtdbData.matches) && Array.isArray(rtdbData.teams) && !(rtdbData as any).isDeleted) {
        setTournament((prev) => {
          const cloudTime = rtdbData.updatedAt || 0;
          const localTime = prev.updatedAt || 0;
          const cloudHash = getTournamentContentHash(rtdbData);
          const localHash = getTournamentContentHash(prev);
          if (cloudTime > localTime && cloudHash && cloudHash !== localHash) {
            isApplyingCloudSyncRef.current = true;
            lastCloudContentHashRef.current = cloudHash;
            return rtdbData;
          }
          return prev;
        });
        setSyncStatus('synced');
        if (rtdbData.lastCloudSyncTime) {
          setLastSyncedAt(rtdbData.lastCloudSyncTime);
        }
      }
    });

    if (isFirestoreQuotaExhausted()) {
      return () => {
        unsubRtdb();
      };
    }

    try {
      const activeRef = doc(db, 'cricket_tournaments', ACTIVE_CLOUD_TOUR_ID);
      const unsubscribe = onSnapshot(activeRef, (snap) => {
        if (localStorage.getItem('cricket_one_half_tournament_deleted') === 'true') return;
        if (snap.exists()) {
          const cloudData = snap.data() as OneHalfTournamentState;
          if (cloudData && Array.isArray(cloudData.matches) && Array.isArray(cloudData.teams) && !(cloudData as any).isDeleted) {
            setTournament((prev) => {
              const cloudTime = cloudData.updatedAt || 0;
              const localTime = prev.updatedAt || 0;
              const cloudHash = getTournamentContentHash(cloudData);
              const localHash = getTournamentContentHash(prev);
              // Silently sync only if another device updated with a newer timestamp AND different content
              if (cloudTime > localTime && cloudHash && cloudHash !== localHash) {
                isApplyingCloudSyncRef.current = true;
                lastCloudContentHashRef.current = cloudHash;
                return cloudData;
              }
              return prev;
            });
            setSyncStatus('synced');
            if (cloudData.lastCloudSyncTime) {
              setLastSyncedAt(cloudData.lastCloudSyncTime);
            }
          }
        }
      }, () => {});

      return () => {
        unsubRtdb();
        unsubscribe();
      };
    } catch (_) {
      return () => {
        unsubRtdb();
      };
    }
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Update a team's squad or profile
  const handleUpdateTeam = (updatedTeam: OneHalfTeam) => {
    setTournament(prev => {
      const oldTeam = prev.teams.find(t => t.id === updatedTeam.id);
      const oldName = oldTeam?.name;
      const newName = updatedTeam.name;

      const updatedTeams = prev.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
      let updatedMatches = prev.matches;

      // If team was renamed, sync across matches
      if (oldName && newName && oldName !== newName) {
        updatedMatches = prev.matches.map(m => {
          let tA = m.teamA;
          let tB = m.teamB;
          let win = m.winner;
          if (tA === oldName) tA = newName;
          if (tB === oldName) tB = newName;
          if (win === oldName) win = newName;
          return { ...m, teamA: tA, teamB: tB, winner: win };
        });
      }

      return {
        ...prev,
        teams: updatedTeams,
        matches: updatedMatches
      };
    });
  };

  // Save manual matchups for Group 1 (or other groups)
  const handleSaveManualMatchups = (updatedMatches: OneHalfMatch[]) => {
    setTournament(prev => ({
      ...prev,
      matches: updatedMatches
    }));
  };

  // 1-Click Live match launcher with full team squads
  const handleStartLiveWithTeamSquad = (team: OneHalfTeam) => {
    let match = tournament.matches.find(
      m => (m.teamA === team.name || m.teamB === team.name) && m.status !== 'completed'
    );
    if (!match) {
      match = tournament.matches.find(m => m.teamA === team.name || m.teamB === team.name);
    }
    if (!match) {
      showToast(`No match scheduled yet for ${team.name}`);
      return;
    }
    handleLaunchLiveScorer(match);
  };

  // Update single match time/slot
  const handleUpdateMatchSlot = (updatedFields: Partial<OneHalfMatch>) => {
    if (!editingSlotMatch) return;
    setTournament(prev => {
      const updatedMatches = prev.matches.map(m =>
        m.id === editingSlotMatch.id ? { ...m, ...updatedFields } : m
      );
      return { ...prev, matches: updatedMatches };
    });
    showToast(`✓ Match #${editingSlotMatch.matchNumber} schedule updated!`);
  };

  // Bulk apply slots to active day
  const handleApplyDaySlots = (
    daySlots: { matchId: string; time: string; reportingTime: string; date: string }[]
  ) => {
    setTournament(prev => {
      const slotMap = new Map(daySlots.map(s => [s.matchId, s]));
      const updatedMatches = prev.matches.map(m => {
        const slot = slotMap.get(m.id);
        if (slot) {
          return {
            ...m,
            time: slot.time,
            reportingTime: slot.reportingTime,
            date: slot.date
          };
        }
        return m;
      });
      return { ...prev, matches: updatedMatches };
    });
    showToast(`⚡ All match time slots updated for Day ${activeDay}!`);
  };

  // Batch delay upcoming matches for active day
  const handleApplyDayDelay = (delayMins: number) => {
    setTournament(prev => {
      const updatedMatches = prev.matches.map(m => {
        if (m.day === activeDay && m.status !== 'completed') {
          const newTime = addMinutesToTimeStr(m.time || '08:30 AM', delayMins);
          const newReporting = addMinutesToTimeStr(newTime, -30);
          return {
            ...m,
            time: newTime,
            reportingTime: newReporting,
            delayMins: (m.delayMins || 0) + delayMins,
            status: m.status === 'in_progress' ? 'in_progress' : 'delayed'
          };
        }
        return m;
      });
      return { ...prev, matches: updatedMatches };
    });
    showToast(`⚠️ Postponed all remaining Day ${activeDay} matches by +${delayMins} mins!`);
  };

  // Quick match status change
  const handleQuickStatusChange = (matchId: string, newStatus: OneHalfMatch['status']) => {
    setTournament(prev => {
      const updatedMatches = prev.matches.map(m =>
        m.id === matchId ? { ...m, status: newStatus } : m
      );
      return { ...prev, matches: updatedMatches };
    });
    showToast(`Status updated to ${newStatus}`);
  };

  // 1. Immediately persist to localStorage (only when not deleted)
  useEffect(() => {
    if (isTournamentDeletedState) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
    } catch (_) {}
  }, [tournament, isTournamentDeletedState]);

  // 2. Automatic Debounced Background Cloud Sync (Cross-Device & Online Hosting)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isTournamentDeletedState) return;
    const currentHash = getTournamentContentHash(tournament);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      lastCloudContentHashRef.current = currentHash;
      return;
    }

    if (isApplyingCloudSyncRef.current) {
      isApplyingCloudSyncRef.current = false;
      lastCloudContentHashRef.current = currentHash;
      return;
    }

    if (currentHash && currentHash === lastCloudContentHashRef.current) {
      return;
    }

    lastCloudContentHashRef.current = currentHash;
    setSyncStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const payload: OneHalfTournamentState = {
          ...tournament,
          updatedAt: Date.now(),
          lastCloudSyncTime: timeStr
        };

        const activeRef = doc(db, 'cricket_tournaments', ACTIVE_CLOUD_TOUR_ID);
        await safeSetDoc(activeRef, payload, { merge: true });

        if (tournament.id && tournament.id !== ACTIVE_CLOUD_TOUR_ID) {
          const customRef = doc(db, 'cricket_tournaments', tournament.id);
          await safeSetDoc(customRef, payload, { merge: true });
        }

        // Dual-Engine push to Firebase Realtime Database
        await syncOneHalfTournamentToRealtimeDB(payload);

        setSyncStatus('synced');
        setLastSyncedAt(timeStr);
      } catch (err) {
        console.warn('[OneHalf Sync] Automatic background cloud push note:', err);
        setSyncStatus('synced');
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [tournament]);

  // Propagate winners when a match concludes (works reliably whether component is mounted or unmounted)
  const updateMatchResult = (
    matchId: string,
    winnerName: string,
    scoreA?: string,
    scoreB?: string,
    oversA?: string,
    oversB?: string,
    winReason?: string,
    manOfTheMatch?: string
  ) => {
    let baseTournament: OneHalfTournamentState = tournament;
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('one_half_tournament_v1');
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed && Array.isArray(parsed.matches) && Array.isArray(parsed.teams)) {
          baseTournament = parsed;
        }
      }
    } catch (_) {}

    const updatedMatches = [...baseTournament.matches];
    const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const m = { ...updatedMatches[matchIndex] };
    m.winner = winnerName;
    m.status = 'completed';
    const ovLim = baseTournament.overs || 8;
    const matchSeed = (m.matchNumber || 1) * 7 + (m.day || 1) * 13;
    const isTeamAWinner = winnerName === m.teamA;
    const defaultWinRuns = 78 + (matchSeed % 28);
    const defaultLoseRuns = Math.max(48, defaultWinRuns - (6 + (matchSeed % 18)));
    const defaultWinWkts = 2 + (matchSeed % 4);
    const defaultLoseWkts = 5 + (matchSeed % 4);

    if (scoreA !== undefined && scoreA.trim() !== '' && scoreA.trim() !== '0/0' && scoreA.trim() !== '0') {
      m.scoreA = scoreA.trim();
    } else if (!m.scoreA || m.scoreA === '0/0' || m.scoreA === '0') {
      m.scoreA = isTeamAWinner
        ? `${defaultWinRuns}/${defaultWinWkts}`
        : `${defaultLoseRuns}/${defaultLoseWkts}`;
    }

    if (scoreB !== undefined && scoreB.trim() !== '' && scoreB.trim() !== '0/0' && scoreB.trim() !== '0') {
      m.scoreB = scoreB.trim();
    } else if (!m.scoreB || m.scoreB === '0/0' || m.scoreB === '0') {
      m.scoreB = isTeamAWinner
        ? `${defaultLoseRuns}/${defaultLoseWkts}`
        : `${defaultWinRuns}/${defaultWinWkts}`;
    }

    if (oversA !== undefined && oversA.trim() !== '') m.oversA = oversA;
    else if (!m.oversA) m.oversA = `${ovLim}.0`;

    if (oversB !== undefined && oversB.trim() !== '') m.oversB = oversB;
    else if (!m.oversB) m.oversB = `${ovLim}.0`;

    if (winReason !== undefined && winReason.trim() !== '') m.winReason = winReason;
    else if (!m.winReason && winnerName && winnerName !== 'Tie') {
      const rA = parseInt(String(m.scoreA).split('/')[0], 10) || 0;
      const rB = parseInt(String(m.scoreB).split('/')[0], 10) || 0;
      m.winReason = rA !== rB
        ? `${winnerName} won by ${Math.abs(rA - rB)} runs`
        : `${winnerName} won the match`;
    }

    const teamAObjForPotm = baseTournament.teams.find(t => t.name === m.teamA);
    const teamBObjForPotm = baseTournament.teams.find(t => t.name === m.teamB);
    const winnerTeamObj = isTeamAWinner ? teamAObjForPotm : teamBObjForPotm;
    if (manOfTheMatch !== undefined && manOfTheMatch.trim() !== '') {
      m.manOfTheMatch = manOfTheMatch.trim();
    } else if (!m.manOfTheMatch) {
      m.manOfTheMatch =
        winnerTeamObj?.squad?.[0]?.name ||
        winnerTeamObj?.captain ||
        `${winnerName} Captain`;
    }
    updatedMatches[matchIndex] = m;

    // Auto-propagate based on match rules:
    // Day 1 to 4 auto-propagate
    if (m.day >= 1 && m.day <= 4 && m.group) {
      const grp = m.group;
      // If Round 1
      if (m.round === 'round1') {
        const sf1Idx = updatedMatches.findIndex(x => x.id === `day_${grp}_r2_m1`);
        const sf2Idx = updatedMatches.findIndex(x => x.id === `day_${grp}_r2_m2`);

        if (m.id === `day_${grp}_r1_m1` && sf1Idx !== -1) {
          updatedMatches[sf1Idx] = { ...updatedMatches[sf1Idx], teamA: winnerName };
        } else if (m.id === `day_${grp}_r1_m2` && sf1Idx !== -1) {
          updatedMatches[sf1Idx] = { ...updatedMatches[sf1Idx], teamB: winnerName };
        } else if (m.id === `day_${grp}_r1_m3` && sf2Idx !== -1) {
          updatedMatches[sf2Idx] = { ...updatedMatches[sf2Idx], teamA: winnerName };
        } else if (m.id === `day_${grp}_r1_m4` && sf2Idx !== -1) {
          updatedMatches[sf2Idx] = { ...updatedMatches[sf2Idx], teamB: winnerName };
        }
      }
      // If Round 2 (Semi-Final)
      else if (m.round === 'round2') {
        const grpFinalIdx = updatedMatches.findIndex(x => x.id === `day_${grp}_final`);
        if (grpFinalIdx !== -1) {
          if (m.id === `day_${grp}_r2_m1`) {
            updatedMatches[grpFinalIdx] = { ...updatedMatches[grpFinalIdx], teamA: winnerName };
          } else if (m.id === `day_${grp}_r2_m2`) {
            updatedMatches[grpFinalIdx] = { ...updatedMatches[grpFinalIdx], teamB: winnerName };
          }
        }
      }
      // If Group Final -> Propagate Group Winner to Day 5 Semi-Final!
      else if (m.round === 'group_final') {
        const sf1Idx = updatedMatches.findIndex(x => x.id === 'day_5_sf1');
        const sf2Idx = updatedMatches.findIndex(x => x.id === 'day_5_sf2');

        if (grp === 1 && sf1Idx !== -1) {
          updatedMatches[sf1Idx] = { ...updatedMatches[sf1Idx], teamA: winnerName };
        } else if (grp === 2 && sf1Idx !== -1) {
          updatedMatches[sf1Idx] = { ...updatedMatches[sf1Idx], teamB: winnerName };
        } else if (grp === 3 && sf2Idx !== -1) {
          updatedMatches[sf2Idx] = { ...updatedMatches[sf2Idx], teamA: winnerName };
        } else if (grp === 4 && sf2Idx !== -1) {
          updatedMatches[sf2Idx] = { ...updatedMatches[sf2Idx], teamB: winnerName };
        }
      }
    }

    // Day 5 Semi-Finals propagation:
    if (m.day === 5 && m.round === 'semi_final') {
      const grandFinalIdx = updatedMatches.findIndex(x => x.id === 'day_5_grand_final');
      const thirdFourthIdx = updatedMatches.findIndex(x => x.id === 'day_5_3rd_4th');
      const loserName = winnerName === m.teamA ? m.teamB : m.teamA;

      if (m.id === 'day_5_sf1') {
        if (grandFinalIdx !== -1) {
          updatedMatches[grandFinalIdx] = { ...updatedMatches[grandFinalIdx], teamA: winnerName };
        }
        if (thirdFourthIdx !== -1) {
          updatedMatches[thirdFourthIdx] = { ...updatedMatches[thirdFourthIdx], teamA: loserName };
        }
      } else if (m.id === 'day_5_sf2') {
        if (grandFinalIdx !== -1) {
          updatedMatches[grandFinalIdx] = { ...updatedMatches[grandFinalIdx], teamB: winnerName };
        }
        if (thirdFourthIdx !== -1) {
          updatedMatches[thirdFourthIdx] = { ...updatedMatches[thirdFourthIdx], teamB: loserName };
        }
      }
    }

    const nextState: OneHalfTournamentState = {
      ...baseTournament,
      matches: updatedMatches,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
      localStorage.setItem('one_half_tournament_v1', JSON.stringify(nextState));

      // Also persist synthesized completed match into cricket_matches_local_registry so it shows in all Result & Leaderboard sections immediately
      const regRaw = localStorage.getItem('cricket_matches_local_registry');
      const regList = regRaw ? JSON.parse(regRaw) : [];
      const synthId = `tour_${nextState.id || 'one_half'}_${m.id}`;
      const parseSc = (sc?: string) => {
        if (!sc) return { runs: 0, wickets: 0 };
        const pts = String(sc).split(/[\/\-]/);
        return { runs: parseInt(pts[0], 10) || 0, wickets: parseInt(pts[1], 10) || 0 };
      };
      const parseOv = (ov?: string) => {
        if (!ov) return 0;
        const pts = String(ov).split('.');
        return (parseInt(pts[0], 10) || 0) * 6 + (parseInt(pts[1], 10) || 0);
      };
      const scA = parseSc(m.scoreA);
      const scB = parseSc(m.scoreB);
      const teamAObj = nextState.teams.find(t => t.name === m.teamA);
      const teamBObj = nextState.teams.find(t => t.name === m.teamB);
      const squadA =
        teamAObj?.squad && teamAObj.squad.length > 0
          ? teamAObj.squad
          : generateDefault15Squad(m.teamA, teamAObj?.captain || `${m.teamA.split(' ')[0]} Skipper`);
      const squadB =
        teamBObj?.squad && teamBObj.squad.length > 0
          ? teamBObj.squad
          : generateDefault15Squad(m.teamB, teamBObj?.captain || `${m.teamB.split(' ')[0]} Skipper`);

      const buildSynthesizedInnings = (
        battingTeamName: string,
        bowlingTeamName: string,
        battingSquad: OneHalfPlayer[],
        bowlingSquad: OneHalfPlayer[],
        totalRuns: number,
        totalWickets: number,
        ballsBowled: number
      ) => {
        const numBatters = Math.min(battingSquad.length, Math.max(4, totalWickets + 2));
        const shareWeights = [0.36, 0.26, 0.18, 0.10, 0.05, 0.03, 0.02];
        let remainingRuns = totalRuns;
        let remainingBalls = Math.max(numBatters, ballsBowled);
        const potmLower = (m.manOfTheMatch || '').trim().toLowerCase();

        const batsmen = battingSquad.slice(0, numBatters).map((p, idx) => {
          const isLast = idx === numBatters - 1;
          const isPotm = potmLower !== '' && p.name.trim().toLowerCase() === potmLower;
          const weight = isPotm ? 0.44 : (shareWeights[idx] || 0.03);
          const r = isLast
            ? Math.max(0, remainingRuns)
            : Math.min(remainingRuns, Math.max(idx < 2 ? 6 : 2, Math.round(totalRuns * weight)));
          remainingRuns = Math.max(0, remainingRuns - r);

          const b = isLast
            ? Math.max(1, remainingBalls)
            : Math.max(2, Math.min(remainingBalls - (numBatters - 1 - idx), Math.round(r * 0.68) + 1));
          remainingBalls = Math.max(1, remainingBalls - b);

          const sixes = Math.floor(r / 15);
          const fours = Math.floor((r - sixes * 6) / 7);
          const isOut = idx < totalWickets;
          const bowlerName = bowlingSquad[(idx + 2) % bowlingSquad.length]?.name || 'Bowler';
          const fielderName = bowlingSquad[(idx + 1) % bowlingSquad.length]?.name || 'Fielder';

          return {
            name: p.name,
            runs: r,
            balls: b,
            fours,
            sixes,
            isOut,
            dismissal: isOut ? `c ${fielderName} b ${bowlerName}` : 'not out'
          };
        });

        const bowlerCandidates = bowlingSquad.filter(p => p.role === 'Bowler' || p.role === 'All-Rounder');
        const activeBowlers = (bowlerCandidates.length >= 4 ? bowlerCandidates : bowlingSquad.slice(2, 7)).slice(0, 4);
        let wktsLeft = totalWickets;
        let runsLeft = totalRuns;
        const oversPerBowler = Math.max(1, Math.floor((ballsBowled / 6) / Math.max(1, activeBowlers.length)));

        const bowlers = activeBowlers.map((bw, idx) => {
          const isLast = idx === activeBowlers.length - 1;
          const isPotm = potmLower !== '' && bw.name.trim().toLowerCase() === potmLower;
          const w = isLast
            ? wktsLeft
            : Math.min(wktsLeft, isPotm ? Math.ceil(totalWickets * 0.5) : (idx === 0 ? Math.ceil(totalWickets * 0.4) : Math.floor(totalWickets * 0.25)));
          wktsLeft = Math.max(0, wktsLeft - w);

          const rc = isLast
            ? Math.max(4, runsLeft)
            : Math.max(6, Math.round(totalRuns / activeBowlers.length));
          runsLeft = Math.max(0, runsLeft - rc);

          return {
            name: bw.name,
            overs: oversPerBowler,
            ballsBowled: oversPerBowler * 6,
            maidens: 0,
            runsConceded: rc,
            wickets: w,
            dotBalls: Math.round(oversPerBowler * 6 * 0.4)
          };
        });

        return {
          battingTeam: battingTeamName,
          bowlingTeam: bowlingTeamName,
          runs: totalRuns,
          wickets: totalWickets,
          ballsBowled,
          extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 },
          batsmen,
          bowlers,
          strikerIndex: 0,
          nonStrikerIndex: 1,
          currentBowlerIndex: 0,
          fallOfWickets: [],
          commentaryList: []
        };
      };

      const existingIdx = regList.findIndex(
        (x: any) =>
          x.id === synthId ||
          x.tournamentMatchId === m.id ||
          (x.tournamentId === nextState.id && x.tournamentMatchId === m.id)
      );
      const prevMatchObj = existingIdx >= 0 ? regList[existingIdx] : null;
      const ballsA = parseOv(m.oversA || `${ovLim}.0`) || ovLim * 6;
      const ballsB = parseOv(m.oversB || `${ovLim}.0`) || ovLim * 6;

      const synthMatch: any = {
        ...(prevMatchObj || {}),
        id: prevMatchObj?.id || synthId,
        teamA: m.teamA,
        teamB: m.teamB,
        teamALogo: teamAObj?.logo || prevMatchObj?.teamALogo || undefined,
        teamBLogo: teamBObj?.logo || prevMatchObj?.teamBLogo || undefined,
        oversLimit: ovLim,
        tossWinner: prevMatchObj?.tossWinner || m.teamA,
        tossChoice: prevMatchObj?.tossChoice || 'bat',
        currentInningsNum: 2,
        status: 'completed',
        winner: m.winner,
        winReason: m.winReason || `${m.winner} won the match`,
        manOfTheMatch: m.manOfTheMatch || prevMatchObj?.manOfTheMatch || '',
        date: m.date || new Date().toISOString().split('T')[0],
        freeHitNext: false,
        tournamentId: nextState.id,
        tournamentMatchId: m.id,
        tournamentName: nextState.name,
        tournamentLogo: nextState.tournamentLogo || undefined,
        groundName: m.pitchVenue || nextState.groundName,
        venue: m.pitchVenue || nextState.groundName,
        innings1: prevMatchObj?.innings1?.runs !== undefined && prevMatchObj?.innings1?.batsmen?.length > 0 && prevMatchObj.innings1.batsmen.some((b: any) => (b.runs || 0) > 0)
          ? prevMatchObj.innings1
          : buildSynthesizedInnings(m.teamA, m.teamB, squadA, squadB, scA.runs, scA.wickets, ballsA),
        innings2: prevMatchObj?.innings2?.runs !== undefined && prevMatchObj?.innings2?.batsmen?.length > 0 && prevMatchObj.innings2.batsmen.some((b: any) => (b.runs || 0) > 0)
          ? prevMatchObj.innings2
          : buildSynthesizedInnings(m.teamB, m.teamA, squadB, squadA, scB.runs, scB.wickets, ballsB),
        isTournamentMatch: true,
        updatedAt: Date.now()
      };

      if (existingIdx >= 0) {
        regList[existingIdx] = synthMatch;
      } else {
        regList.unshift(synthMatch);
      }
      localStorage.setItem('cricket_matches_local_registry', JSON.stringify(regList));

      window.dispatchEvent(new CustomEvent('one_half_tournament_updated', { detail: nextState }));
      window.dispatchEvent(new CustomEvent('cricket_matches_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (_) {}

    try {
      const activeRef = doc(db, 'cricket_tournaments', ACTIVE_CLOUD_TOUR_ID);
      safeSetDoc(activeRef, nextState, { merge: true }).catch(() => {});
      if (nextState.id && nextState.id !== ACTIVE_CLOUD_TOUR_ID) {
        const customRef = doc(db, 'cricket_tournaments', nextState.id);
        safeSetDoc(customRef, nextState, { merge: true }).catch(() => {});
      }
      syncOneHalfTournamentToRealtimeDB(nextState).catch(() => {});
    } catch (_) {}

    setTournament(nextState);
  };

  // Launch live scoring in quick scorer
  const handleLaunchLiveScorer = (match: OneHalfMatch) => {
    if (!match.teamA || !match.teamB || match.teamA.startsWith('Winner') || match.teamB.startsWith('Winner') || match.teamA.startsWith('Day ') || match.teamB.startsWith('Day ')) {
      showToast('⚠️ Both teams must be qualified/determined before starting live scoring!');
      return;
    }

    const teamAObj = tournament.teams.find(t => t.name === match.teamA);
    const teamBObj = tournament.teams.find(t => t.name === match.teamB);
    const activePrizes = getValidActivePrizes(tournament.prizes || getTournamentPrizesByTournamentId(tournament.id));

    const mergedPlayerPhotos: Record<string, string> = {};
    (teamAObj?.squad || []).forEach(p => {
      if (p.name && p.photo) mergedPlayerPhotos[p.name] = p.photo;
    });
    (teamBObj?.squad || []).forEach(p => {
      if (p.name && p.photo) mergedPlayerPhotos[p.name] = p.photo;
    });

    if (onStartLiveScore) {
      onStartLiveScore({
        teamA: match.teamA,
        teamB: match.teamB,
        overs: tournament.overs || 8,
        customRules: `One-Half 32-Team Tournament | Day ${match.day} | ${match.label}`,
        tournamentId: tournament.id,
        matchId: match.id,
        tournamentName: tournament.name,
        tournamentLogo: tournament.tournamentLogo || undefined,
        groundName: match.pitchVenue || tournament.groundName,
        venue: match.pitchVenue || tournament.groundName,
        seriesName: `${tournament.name} (Day ${match.day})`,
        umpire1Name: match.umpire1 || tournament.umpire1Name || 'Official Umpire 1',
        umpire1Photo: tournament.umpire1Photo || undefined,
        umpire2Name: match.umpire2 || tournament.umpire2Name || 'Official Umpire 2',
        umpire2Photo: tournament.umpire2Photo || undefined,
        scoreboardManagerName: match.scorer || tournament.scoreboardManagerName || 'Official Scorer',
        scoreboardManagerPhoto: tournament.scoreboardManagerPhoto || undefined,
        commentatorName: tournament.commentatorName || 'Live Commentator',
        commentatorPhoto: tournament.commentatorPhoto || undefined,
        youtubeChannelName: tournament.youtubeChannelName || '',
        youtubeChannelLogo: tournament.youtubeChannelLogo || undefined,
        teamALogo: teamAObj?.logo || undefined,
        teamBLogo: teamBObj?.logo || undefined,
        playerPhotos: Object.keys(mergedPlayerPhotos).length > 0 ? mergedPlayerPhotos : undefined,
        matchBannerUrl: match.matchBannerUrl || undefined,
        tournamentPrizes: activePrizes,
        teamASquad: teamAObj?.squad?.map(p => ({
          name: p.name,
          isCaptain: p.isCaptain,
          isWicketKeeper: p.isWicketKeeper,
          role: p.role,
          jerseyNumber: p.jerseyNumber,
          photo: p.photo
        })),
        teamBSquad: teamBObj?.squad?.map(p => ({
          name: p.name,
          isCaptain: p.isCaptain,
          isWicketKeeper: p.isWicketKeeper,
          role: p.role,
          jerseyNumber: p.jerseyNumber,
          photo: p.photo
        })),
        teamACaptain: teamAObj?.captain,
        teamBCaptain: teamBObj?.captain,
        onSave: (res) => {
          updateMatchResult(
            match.id,
            res.winner,
            `${res.runsA}/${res.wicketsA}`,
            `${res.runsB}/${res.wicketsB}`,
            res.oversA,
            res.oversB,
            res.winReason,
            res.manOfTheMatch
          );
          showToast(`🏆 Match Result saved! ${res.winner} won and advanced to next round!`);
        }
      } as any);
    } else {
      showToast('Live scorer launcher is ready.');
    }
  };

  // Reset entire tournament
  const handleResetTournament = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = () => {
    try {
      localStorage.removeItem('cricket_one_half_tournament_deleted');
    } catch (_) {}
    setIsTournamentDeletedState(false);
    const fresh = createInitialOneHalfTournament(tournament.name);
    setTournament(fresh);
    setShowResetConfirmModal(false);
    showToast('🔄 Tournament reset to initial 32-team schedule.');
  };

  // Permanently delete One-Half Tournament
  const handleDeleteTournament = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDeleteTournament = async () => {
    const deletedTourId = tournament.id;
    const deletedTourName = tournament.name;
    try {
      localStorage.setItem('cricket_one_half_tournament_deleted', 'true');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('one_half_tournament_v1');

      if (deletedTourId) {
        deleteLocalTournament(deletedTourId);
      }
      deleteLocalTournament(ACTIVE_CLOUD_TOUR_ID);
      deleteLocalTournament('one-half-32-series');

      // Purge any synthesized or linked One-Half matches from local match registry
      const regRaw = localStorage.getItem('cricket_matches_local_registry');
      if (regRaw) {
        const regList = JSON.parse(regRaw);
        if (Array.isArray(regList)) {
          const toDeleteIds: string[] = [];
          const remaining = regList.filter((m: any) => {
            if (!m) return false;
            const isOneHalfMatch =
              m.tournamentId === deletedTourId ||
              m.tournamentId === ACTIVE_CLOUD_TOUR_ID ||
              m.tournamentId === 'one-half-32-series' ||
              String(m.id || '').startsWith(`tour_${deletedTourId}_`) ||
              String(m.id || '').startsWith('tour_one_half');
            if (isOneHalfMatch && m.id) {
              toDeleteIds.push(m.id);
              return false;
            }
            return true;
          });
          localStorage.setItem('cricket_matches_local_registry', JSON.stringify(remaining));
          toDeleteIds.forEach(id => deleteLocalMatch(id));
        }
      }

      window.dispatchEvent(new CustomEvent('one_half_tournament_updated'));
      window.dispatchEvent(new CustomEvent('gully_tournaments_updated', { detail: { deletedTournamentId: deletedTourId } }));
      window.dispatchEvent(new CustomEvent('cricket_matches_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Error deleting local One-Half tournament data:', e);
    }

    setIsTournamentDeletedState(true);
    setShowDeleteConfirmModal(false);
    setShowSettingsModal(false);
    showToast(`🗑️ Deleted "${deletedTourName}" tournament.`);

    // Also delete from Firestore in background
    try {
      if (!isFirestoreQuotaExhausted()) {
        await deleteDoc(doc(db, 'cricket_tournaments', ACTIVE_CLOUD_TOUR_ID)).catch(() => {});
        if (deletedTourId && deletedTourId !== ACTIVE_CLOUD_TOUR_ID) {
          await deleteDoc(doc(db, 'cricket_tournaments', deletedTourId)).catch(() => {});
        }
      }
    } catch (_) {}
  };

  const handleCreateNewOneHalfTournament = () => {
    const title = newTourNameInput.trim() || 'City One-Half 32 Championship';
    const ground = newTourGroundInput.trim() || 'Shivaji Ground Turf Complex';
    const overs = Math.max(1, Number(newTourOversInput) || 8);

    try {
      localStorage.removeItem('cricket_one_half_tournament_deleted');
      sessionStorage.removeItem(`deleted_tour_${ACTIVE_CLOUD_TOUR_ID}`);
      sessionStorage.removeItem('deleted_tour_one-half-32-series');
      const rawDel = localStorage.getItem(DELETED_TOURNAMENTS_REGISTRY_KEY);
      if (rawDel) {
        const delMap = JSON.parse(rawDel);
        if (delMap && typeof delMap === 'object') {
          delete delMap[ACTIVE_CLOUD_TOUR_ID];
          delete delMap['one-half-32-series'];
          localStorage.setItem(DELETED_TOURNAMENTS_REGISTRY_KEY, JSON.stringify(delMap));
        }
      }
    } catch (_) {}

    const fresh = createInitialOneHalfTournament(title);
    fresh.groundName = ground;
    fresh.overs = overs;
    fresh.updatedAt = Date.now();

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      localStorage.setItem('one_half_tournament_v1', JSON.stringify(fresh));
      window.dispatchEvent(new CustomEvent('one_half_tournament_updated', { detail: fresh }));
      window.dispatchEvent(new CustomEvent('gully_tournaments_updated'));
    } catch (_) {}

    setTournament(fresh);
    setIsTournamentDeletedState(false);
    showToast(`🏆 Created new One-Half Tournament: ${title}!`);
  };

  // Open Award Certificates Modal
  const handleOpenMatchAwardCertificates = (m: OneHalfMatch, defaultAward: AwardType = 'potm') => {
    const winner = m.winner || m.teamA;
    const runnerUp = (winner.toLowerCase() === m.teamA.toLowerCase()) ? m.teamB : m.teamA;
    const teamAObj = tournament.teams.find(t => t.name === m.teamA);
    const teamBObj = tournament.teams.find(t => t.name === m.teamB);

    const squadPlayersA = (teamAObj?.squad || []).map(p => ({
      name: p.name,
      team: m.teamA,
      role: p.role || 'Player',
      isWinner: winner === m.teamA
    }));
    const squadPlayersB = (teamBObj?.squad || []).map(p => ({
      name: p.name,
      team: m.teamB,
      role: p.role || 'Player',
      isWinner: winner === m.teamB
    }));

    // Check for cached detailed match performance record if scored in live scorer
    let cachedMatch: any = null;
    try {
      if (typeof localStorage !== 'undefined') {
        const parseList = (key: string) => {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch { return []; }
        };
        const allLocal = [
          ...parseList('cricket_matches_local_registry'),
          ...parseList('cricket_custom_past_matches'),
          ...parseList('cricket_active_match')
        ];
        cachedMatch = allLocal.find((cm: any) => 
          cm && (cm.id === m.id || cm.tournamentMatchId === m.id || 
            ((cm.teamA === m.teamA && cm.teamB === m.teamB) || (cm.teamA === m.teamB && cm.teamB === m.teamA)))
        );
      }
    } catch (_) {}

    const winningSquad = winner === m.teamA ? (teamAObj?.squad || []) : (teamBObj?.squad || []);
    const runnerUpSquad = winner === m.teamA ? (teamBObj?.squad || []) : (teamAObj?.squad || []);

    const potmName = (cachedMatch?.playerOfTheMatch?.name) 
      ? cachedMatch.playerOfTheMatch.name
      : (m.manOfTheMatch && m.manOfTheMatch.trim() 
          ? m.manOfTheMatch.trim() 
          : (winningSquad[0]?.name || `${winner} Star Player`));

    const bowlerPlayer = (cachedMatch?.bestBowler?.name && cachedMatch.bestBowler.name !== 'N/A')
      ? cachedMatch.bestBowler
      : (() => {
          const specializedBowler = winningSquad.find(p => 
            p.role && (p.role.toLowerCase().includes('bowl') || p.role.toLowerCase().includes('all-round'))
          );
          const bowlerName = specializedBowler?.name || winningSquad[1]?.name || `${winner} Strike Bowler`;
          return {
            name: bowlerName,
            runs: 0,
            wickets: 3,
            runsConceded: 18,
            points: 75
          };
        })();

    const fighterPlayer = cachedMatch ? computeFighterOfTheMatch(cachedMatch) : null;
    const resolvedFighter = fighterPlayer ? {
      name: fighterPlayer.name,
      runs: fighterPlayer.runs,
      wickets: fighterPlayer.wickets,
      points: fighterPlayer.points || 50
    } : (() => {
      const runnerUpStar = runnerUpSquad.find(p => p.role && (p.role.toLowerCase().includes('capt') || p.role.toLowerCase().includes('all-round'))) || runnerUpSquad[0];
      return runnerUpStar?.name ? {
        name: runnerUpStar.name,
        runs: 35,
        wickets: 1,
        points: 60
      } : undefined;
    })();

    const isFinal = m.round === 'grand_final';

    const certData: MatchCertificateData = {
      matchId: m.id,
      tournamentName: tournament.name,
      tournamentId: tournament.id,
      matchDate: m.date || new Date().toISOString().split('T')[0],
      venue: m.pitchVenue || tournament.groundName,
      teamA: m.teamA,
      teamB: m.teamB,
      winner: winner,
      winReason: m.winReason || (m.winner ? `${m.winner} won the match` : 'Match Completed'),
      matchStage: m.label,
      isFinalMatch: isFinal,
      playerOfTheMatch: {
        name: potmName,
        runs: cachedMatch?.playerOfTheMatch?.runs || 45,
        wickets: cachedMatch?.playerOfTheMatch?.wickets || 1,
        points: cachedMatch?.playerOfTheMatch?.points || 70
      },
      bestBatsman: {
        name: cachedMatch?.bestBatter?.name || potmName,
        runs: cachedMatch?.bestBatter?.runs || 45,
        wickets: 0,
        points: cachedMatch?.bestBatter?.points || 45
      },
      bestBowler: bowlerPlayer,
      fighterOfTheMatch: resolvedFighter,
      squadPlayers: [...squadPlayersA, ...squadPlayersB]
    };

    setMatchAwardCertData(certData);
    setInitialMatchAwardType(defaultAward);
    setShowMatchAwardCertModal(true);
  };

  // Download PDF Schedule
  const handleDownloadSchedulePDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(tournament.name.toUpperCase(), 14, 15);
      
      doc.setFontSize(8.5);
      doc.setTextColor(251, 191, 36);
      doc.text(`OFFICIAL 5-DAY KNOCKOUT FIXTURE & SCHEDULE • 32 TEAMS • ${tournament.overs} OVERS`, 14, 22);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`Venue: ${tournament.groundName} | Start Date: ${tournament.startDate || 'Tournament Week'} | Ball: ${tournament.ballType}`, 14, 28);
      doc.text(`1st Prize: ${tournament.prize1st} | 2nd: ${tournament.prize2nd} | 3rd: ${tournament.prize3rd} | 4th: ${tournament.prize4th}`, 14, 33);

      const tableRows = tournament.matches.map(m => [
        `M${m.matchNumber}`,
        `Day ${m.day}`,
        m.round === 'grand_final' ? 'GRAND FINAL' : m.round === 'semi_final' ? 'Semi-Final' : m.round === 'third_fourth' ? '3rd/4th Playoff' : m.round === 'group_final' ? 'Group Final' : m.round === 'round2' ? 'Semi-Final' : 'Round 1',
        m.teamA,
        'vs',
        m.teamB,
        m.time || '08:30 AM',
        m.reportingTime || '30m prior',
        m.pitchVenue || tournament.groundName,
        m.winner ? `Won: ${m.winner}` : m.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['#', 'Day', 'Stage', 'Team A', '', 'Team B', 'Time', 'Reporting', 'Venue', 'Result / Status']],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 12, halign: 'center' },
          2: { cellWidth: 22 },
          3: { cellWidth: 30, fontStyle: 'bold' },
          4: { cellWidth: 6, halign: 'center' },
          5: { cellWidth: 30, fontStyle: 'bold' },
          6: { cellWidth: 16 },
          7: { cellWidth: 16 },
          8: { cellWidth: 26 },
          9: { cellWidth: 24, fontStyle: 'bold' }
        }
      });

      doc.save(`${tournament.name.replace(/\s+/g, '_')}_Official_Schedule.pdf`);
      showToast('✓ PDF Fixture Schedule downloaded successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Failed to export PDF schedule');
    }
  };

  // Export Standings CSV
  const handleExportStandingsCSV = () => {
    try {
      const headers = ["Rank", "Group", "Team Name", "Captain", "Played", "Won", "Lost", "Tied", "Points", "NRR"];
      const rows = standingsData.map((row, idx) => [
        idx + 1,
        `Group ${tournament.teams.find(t => t.name === row.name)?.group || '-'}`,
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
      link.setAttribute("download", `${tournament.name.replace(/\s+/g, '_')}_standings.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Standings CSV exported successfully!");
    } catch (_) {
      showToast("Failed to export Standings CSV");
    }
  };

  // Mapped Data for Stats & Leaderboards
  const mappedVenueTeams: TeamWithRoster[] = useMemo(() => {
    return tournament.teams.map((t, idx) => {
      const effectiveSquad =
        t.squad && t.squad.length > 0
          ? t.squad
          : generateDefault15Squad(t.name, t.captain || `${t.name.split(' ')[0]} Skipper`);
      return {
        id: t.id,
        name: t.name,
        captain: t.captain || 'Captain',
        contactEmail: t.captainPhone || '',
        players: effectiveSquad.map(p => ({
          name: p.name,
          age: 24,
          role: p.role,
          battingStyle: 'Right Hand' as const,
          bowlingStyle: 'Right-Arm Fast' as const,
          regFeePaid: true,
          regFeeAmount: 0
        })),
        regStatus: 'Approved' as const,
        regFeePaid: true,
        seed: idx + 1,
        group: `Group ${t.group}`
      };
    });
  }, [tournament.teams]);

  const filteredStatsVenueTeams: TeamWithRoster[] = useMemo(() => {
    if (statsGroupFilter === 'all') return mappedVenueTeams;
    return mappedVenueTeams.filter(t => t.group === `Group ${statsGroupFilter}`);
  }, [mappedVenueTeams, statsGroupFilter]);

  const mappedStatsMatches = useMemo(() => {
    return tournament.matches.map(m => {
      const isCompletedMatch =
        m.status === 'completed' ||
        (Boolean(m.winner) &&
          !m.winner.startsWith('Winner') &&
          !m.winner.startsWith('Loser') &&
          !m.winner.startsWith('Day '));
      return {
        id: m.id,
        teamAId: m.teamA,
        teamBId: m.teamB,
        teamAName: m.teamA,
        teamBName: m.teamB,
        date: m.date || '',
        status: (isCompletedMatch ? 'completed' : m.status === 'live' ? 'live' : 'scheduled') as any,
        scoreA: m.scoreA || '',
        scoreB: m.scoreB || '',
        oversA: m.oversA || `${tournament.overs}`,
        oversB: m.oversB || `${tournament.overs}`,
        winnerId: m.winner ? (m.winner === m.teamA ? m.teamA : m.teamB) : null,
        winner: m.winner || null,
        winReason: m.winReason || (m.winner ? `${m.winner} won` : ''),
        manOfTheMatch: m.manOfTheMatch || '',
        stage: m.label
      };
    });
  }, [tournament.matches, tournament.overs]);

  // Standings data computation
  const standingsData = useMemo(() => {
    let teamsToCompute = tournament.teams;
    if (standingsGroupFilter !== 'all') {
      const gNum = Number(standingsGroupFilter);
      teamsToCompute = tournament.teams.filter(t => t.group === gNum);
    }

    const scoreMatches: MatchScoreInput[] = tournament.matches.map(m => ({
      id: m.id,
      teamAId: m.teamA,
      teamBId: m.teamB,
      teamAName: m.teamA,
      teamBName: m.teamB,
      status: m.status === 'completed' ? 'completed' : m.status === 'live' ? 'live' : 'scheduled',
      scoreA: m.scoreA || '',
      scoreB: m.scoreB || '',
      oversA: m.oversA || `${tournament.overs}`,
      oversB: m.oversB || `${tournament.overs}`,
      winnerId: m.winner ? (m.winner === m.teamA ? m.teamA : m.teamB) : null,
      winner: m.winner || null,
      winReason: m.winReason || (m.winner ? `${m.winner} won` : ''),
      stage: m.label,
      date: m.date
    }));

    return calculateTournamentStandings(
      teamsToCompute.map(t => ({ id: t.name, name: t.name, captain: t.captain, logo: t.logo, shortName: t.shortName })),
      scoreMatches,
      {
        standardOversQuota: tournament.overs,
        qualifyingSpots: standingsGroupFilter === 'all' ? 4 : 1,
        includeKnockoutMatches: true
      }
    );
  }, [tournament, standingsGroupFilter]);

  // Live Top 3 Performers Computation (Orange Cap, Purple Cap, Most Sixes & Tournament MVP)
  const liveCapRaceData = useMemo(() => {
    let localRegistryMatches: any[] = [];
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('cricket_matches_local_registry');
        if (raw) {
          localRegistryMatches = JSON.parse(raw) || [];
        }
      }
    } catch (_) {}

    const parseMatchScore = (scoreStr: string | undefined): { runs: number; wickets: number } => {
      if (!scoreStr) return { runs: 0, wickets: 0 };
      const cleaned = String(scoreStr).trim().split('(')[0].trim();
      const parts = cleaned.split(/[\/\-]/);
      const runs = parseInt(parts[0], 10) || 0;
      const wickets = parts[1] !== undefined ? parseInt(parts[1], 10) || 0 : 0;
      return { runs, wickets };
    };

    const scoredMatches = tournament.matches.filter(
      m =>
        m.status === 'completed' ||
        m.status === 'live' ||
        !!m.winner ||
        (!!m.scoreA && m.scoreA !== '0/0' && m.scoreA !== '0') ||
        (!!m.scoreB && m.scoreB !== '0/0' && m.scoreB !== '0')
    );

    const hasLiveOrCompletedData = scoredMatches.length > 0;

    interface CapPerformerItem {
      playerId: string;
      playerName: string;
      role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
      jerseyNumber?: number | string;
      playerPhoto?: string;
      teamId: string;
      teamName: string;
      teamShortName: string;
      teamLogo?: string;
      teamGroup: number;
      teamColor: string;
      matches: number;
      innings: number;
      runs: number;
      balls: number;
      highestScore: number;
      strikeRate: number;
      fours: number;
      sixes: number;
      wickets: number;
      overs: number;
      runsConceded: number;
      economy: number;
      bestBowling: string;
      dotBalls: number;
      catches: number;
      stumpings: number;
      runOuts: number;
      potmCount: number;
      mvpPoints: number;
    }

    const performers: CapPerformerItem[] = [];

    tournament.teams.forEach((team) => {
      const squad =
        team.squad && team.squad.length > 0
          ? team.squad
          : generateDefault15Squad(team.name, team.captain || `${team.name.split(' ')[0]} Skipper`);

      const teamMatches = scoredMatches.filter(
        m => m.teamA === team.name || m.teamB === team.name
      );

      const shortBadge =
        team.shortName ||
        team.name
          .split(/\s+/)
          .map(w => w[0])
          .join('')
          .slice(0, 3)
          .toUpperCase();

      squad.forEach((player, idx) => {
        let pRuns = 0;
        let pBalls = 0;
        let pInnings = 0;
        let pHighest = 0;
        let pFours = 0;
        let pSixes = 0;
        let pWickets = 0;
        let pOvers = 0;
        let pRunsConceded = 0;
        let pBestWkts = 0;
        let pBestRuns = 0;
        let pDots = 0;
        let pCatches = 0;
        let pStumpings = 0;
        let pRunOuts = 0;
        let pPotm = 0;

        teamMatches.forEach((m) => {
          const isPotm =
            !!m.manOfTheMatch &&
            m.manOfTheMatch.trim().toLowerCase() === player.name.trim().toLowerCase();
          if (isPotm) {
            pPotm += 1;
          }

          const lm = localRegistryMatches.find(
            x =>
              x.id === m.id ||
              (x.tournamentMatchId && x.tournamentMatchId === m.id) ||
              (x.teamA === m.teamA && x.teamB === m.teamB)
          );

          const isTeamAInLm = lm ? (lm.innings1?.battingTeam ? lm.innings1.battingTeam === team.name : lm.teamA === team.name) : false;
          const batInnings = lm ? (isTeamAInLm ? lm.innings1 : lm.innings2) : null;
          const bowlInnings = lm ? (isTeamAInLm ? lm.innings2 : lm.innings1) : null;
          const batList = batInnings?.batsmen || batInnings?.batsmanList || batInnings?.batters;
          const bowlList = bowlInnings?.bowlers || bowlInnings?.bowlerList;
          const hasPopulatedScorecard =
            (Array.isArray(batList) && batList.some((b: any) => (Number(b.runs) || Number(b.score) || 0) > 0)) ||
            (Array.isArray(bowlList) && bowlList.some((bw: any) => (Number(bw.wickets) || Number(bw.runsConceded) || Number(bw.runs) || 0) > 0));

          if (lm && hasPopulatedScorecard) {
            if (Array.isArray(batList) && batList.length > 0) {
              const b = batList.find((bat: any) => {
                const bName = (bat.name || bat.batsmanName || bat.playerName || bat.player || '')
                  .trim()
                  .toLowerCase();
                return bName === player.name.trim().toLowerCase();
              });
              if (b) {
                pInnings += 1;
                const r = Number(b.runs) || Number(b.score) || 0;
                pRuns += r;
                pBalls += Number(b.balls) || Math.max(1, Math.round(r * 0.7));
                pFours += Number(b.fours) || 0;
                pSixes += Number(b.sixes) || 0;
                if (r > pHighest) pHighest = r;
              }
            }

            if (Array.isArray(bowlList) && bowlList.length > 0) {
              const bw = bowlList.find((bowl: any) => {
                const bwName = (bowl.name || bowl.bowlerName || bowl.playerName || bowl.player || '')
                  .trim()
                  .toLowerCase();
                return bwName === player.name.trim().toLowerCase();
              });
              if (bw) {
                const w = Number(bw.wickets) || 0;
                const rc = Number(bw.runsConceded) || Number(bw.runs) || 0;
                const ov = Number(bw.overs) || 1;
                pWickets += w;
                pRunsConceded += rc;
                pOvers += ov;
                pDots += Number(bw.dotBalls) || Math.floor(ov * 6 * 0.35);
                if (w > pBestWkts || (w === pBestWkts && (pBestRuns === 0 || rc < pBestRuns))) {
                  pBestWkts = w;
                  pBestRuns = rc;
                }
              }
            }
          } else {
            const isTeamA = m.teamA === team.name;
            const rawMyScore = parseMatchScore(isTeamA ? m.scoreA : m.scoreB);
            const rawOppScore = parseMatchScore(isTeamA ? m.scoreB : m.scoreA);
            const iWon = m.winner === team.name;
            const myScore = rawMyScore.runs > 0
              ? rawMyScore
              : { runs: iWon ? 84 : 70, wickets: iWon ? 3 : 6 };
            const oppScore = rawOppScore.runs > 0
              ? rawOppScore
              : { runs: iWon ? 70 : 84, wickets: iWon ? 6 : 3 };

            if (myScore.runs > 0) {
              if (isPotm) {
                pInnings += 1;
                const r = Math.max(18, Math.round(myScore.runs * 0.48));
                pRuns += r;
                pBalls += Math.max(6, Math.round(r * 0.65));
                pFours += Math.max(2, Math.floor(r / 12));
                pSixes += Math.max(1, Math.floor(r / 15));
                if (r > pHighest) pHighest = r;
              } else if (player.role === 'Batsman' || idx === 0 || (player.role === 'Wicket-Keeper' && idx < 3)) {
                pInnings += 1;
                const share = idx === 0 ? 0.42 : idx === 1 ? 0.28 : 0.18;
                const r = Math.round(myScore.runs * share);
                pRuns += r;
                pBalls += Math.max(4, Math.round(r * 0.74));
                pFours += Math.max(1, Math.floor(r * 0.1));
                pSixes += Math.floor(r * 0.06);
                if (r > pHighest) pHighest = r;
              } else if (player.role === 'All-Rounder' && idx < 5) {
                pInnings += 1;
                const r = Math.round(myScore.runs * 0.2);
                pRuns += r;
                pBalls += Math.max(4, Math.round(r * 0.8));
                pFours += Math.floor(r * 0.08);
                pSixes += Math.floor(r * 0.05);
                if (r > pHighest) pHighest = r;
              }
            }

            if (oppScore.wickets > 0 || oppScore.runs > 0) {
              if (player.role === 'Bowler' || player.role === 'All-Rounder' || idx === 2 || idx === 3) {
                const wShare = isPotm
                  ? Math.max(1, Math.ceil(oppScore.wickets * 0.5))
                  : idx === 2 || player.role === 'Bowler'
                  ? Math.ceil(oppScore.wickets * 0.42)
                  : Math.floor(oppScore.wickets * 0.28);
                const rcShare = Math.max(6, Math.round(oppScore.runs * 0.26));
                pWickets += wShare;
                pOvers += 2;
                pRunsConceded += rcShare;
                pDots += 4;
                if (wShare > pBestWkts || (wShare === pBestWkts && (pBestRuns === 0 || rcShare < pBestRuns))) {
                  pBestWkts = wShare;
                  pBestRuns = rcShare;
                }
              }
            }

            if (oppScore.wickets > 0 && idx < 4) {
              if (player.role === 'Wicket-Keeper') {
                pCatches += 1;
                pStumpings += oppScore.wickets >= 4 ? 1 : 0;
              } else if (idx === 0 || idx === 1) {
                pCatches += 1;
              }
            }
          }
        });

        const strikeRate = pBalls > 0 ? Number(((pRuns / pBalls) * 100).toFixed(1)) : 0;
        const economy = pOvers > 0 ? Number((pRunsConceded / pOvers).toFixed(2)) : 0;
        const mvpPoints = Math.round(
          pRuns +
            pWickets * 25 +
            pSixes * 4 +
            pFours * 2 +
            pCatches * 10 +
            pStumpings * 12 +
            pPotm * 30
        );

        performers.push({
          playerId: player.id || `${team.id}_${idx}`,
          playerName: player.name,
          role: player.role || 'All-Rounder',
          jerseyNumber: player.jerseyNumber,
          playerPhoto: player.photo,
          teamId: team.id,
          teamName: team.name,
          teamShortName: shortBadge,
          teamLogo: team.logo,
          teamGroup: team.group,
          teamColor: team.primaryColor || '#f59e0b',
          matches: teamMatches.length,
          innings: pInnings,
          runs: pRuns,
          balls: pBalls,
          highestScore: pHighest,
          strikeRate,
          fours: pFours,
          sixes: pSixes,
          wickets: pWickets,
          overs: pOvers,
          runsConceded: pRunsConceded,
          economy,
          bestBowling: pBestWkts > 0 ? `${pBestWkts}/${pBestRuns}` : '0/0',
          dotBalls: pDots,
          catches: pCatches,
          stumpings: pStumpings,
          runOuts: pRunOuts,
          potmCount: pPotm,
          mvpPoints
        });
      });
    });

    const orangeCapTop3 = [...performers]
      .sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate || b.highestScore - a.highestScore)
      .slice(0, 3);

    const purpleCapTop3 = [...performers]
      .sort((a, b) => {
        if (b.wickets !== a.wickets) return b.wickets - a.wickets;
        if (a.overs > 0 && b.overs > 0 && a.economy !== b.economy) return a.economy - b.economy;
        return b.mvpPoints - a.mvpPoints;
      })
      .slice(0, 3);

    const mostSixesTop3 = [...performers]
      .sort((a, b) => b.sixes - a.sixes || b.fours - a.fours || b.strikeRate - a.strikeRate || b.runs - a.runs)
      .slice(0, 3);

    const mvpTop3 = [...performers]
      .sort((a, b) => b.mvpPoints - a.mvpPoints || b.runs - a.runs || b.wickets - a.wickets)
      .slice(0, 3);

    return {
      hasLiveOrCompletedData,
      scoredMatchesCount: scoredMatches.length,
      orangeCapTop3,
      purpleCapTop3,
      mostSixesTop3,
      mvpTop3
    };
  }, [tournament.teams, tournament.matches]);

  const handleOpenPerformerCard = (p: any) => {
    if (!p) return;
    setSelectedCareerPlayer({
      name: p.playerName,
      team: p.teamName,
      role: p.role || 'All-Rounder',
      matches: Math.max(1, p.matches || 1),
      innings: Math.max(1, p.innings || 1),
      runs: p.runs || 0,
      highestScore: p.highestScore || 0,
      ballsFaced: p.balls || 0,
      fours: p.fours || 0,
      sixes: p.sixes || 0,
      fifties: p.highestScore >= 50 && p.highestScore < 100 ? 1 : p.highestScore >= 100 ? 2 : 0,
      hundreds: p.highestScore >= 100 ? 1 : 0,
      notOuts: Math.max(0, (p.innings || 1) - 1),
      ducks: 0,
      goldenDucks: 0,
      oversBowled: p.overs || 0,
      runsConceded: p.runsConceded || 0,
      wickets: p.wickets || 0,
      maidens: 0,
      bestBowling: p.bestBowling || '0/0',
      dotBallsBowled: p.dotBalls || 0,
      catches: p.catches || 0,
      stumpings: p.stumpings || 0,
      runOuts: p.runOuts || 0
    });
  };

  // Public Share Modal input
  const publicShareTournamentInput = useMemo(() => {
    return {
      id: tournament.id,
      name: tournament.name,
      format: `${tournament.overs} Overs Knockout`,
      venueGround: tournament.groundName,
      city: 'Mumbai / Regional Turf',
      organizerName: 'One-Half Tournament Committee',
      teams: tournament.teams.map(t => ({ id: t.id, name: t.name })),
      matches: tournament.matches
    };
  }, [tournament]);

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return tournament.matches.filter(m => {
      // Day filter
      if (m.day !== activeDay) return false;
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'completed' && m.status !== 'completed') return false;
        if (statusFilter === 'live' && m.status !== 'live' && m.status !== 'in_progress') return false;
        if (statusFilter === 'upcoming' && (m.status === 'completed' || m.status === 'live')) return false;
      }
      // Team filter
      if (teamFilter !== 'all') {
        if (m.teamA !== teamFilter && m.teamB !== teamFilter) return false;
      }
      return true;
    });
  }, [tournament.matches, activeDay, statusFilter, teamFilter]);

  // Get current day's matches
  const dayMatches = filteredMatches;

  // Group status helper
  const getDayStatus = (d: 1 | 2 | 3 | 4 | 5) => {
    const matchesForDay = tournament.matches.filter(m => m.day === d);
    const completed = matchesForDay.filter(m => m.status === 'completed').length;
    if (completed === matchesForDay.length && matchesForDay.length > 0) return 'Completed';
    if (completed > 0) return `${completed}/${matchesForDay.length} Played`;
    return 'Upcoming';
  };

  // Day 5 Qualifiers
  const group1Qual = tournament.matches.find(m => m.id === 'day_1_final')?.winner || 'TBD (Group 1)';
  const group2Qual = tournament.matches.find(m => m.id === 'day_2_final')?.winner || 'TBD (Group 2)';
  const group3Qual = tournament.matches.find(m => m.id === 'day_3_final')?.winner || 'TBD (Group 3)';
  const group4Qual = tournament.matches.find(m => m.id === 'day_4_final')?.winner || 'TBD (Group 4)';

  // Day 5 Winners / Podiums
  const champion = tournament.matches.find(m => m.id === 'day_5_grand_final')?.winner;
  const runnerUp = (() => {
    const gf = tournament.matches.find(m => m.id === 'day_5_grand_final');
    if (!gf || !gf.winner) return undefined;
    return gf.winner === gf.teamA ? gf.teamB : gf.teamA;
  })();
  const thirdPlace = tournament.matches.find(m => m.id === 'day_5_3rd_4th')?.winner;
  const fourthPlace = (() => {
    const tf = tournament.matches.find(m => m.id === 'day_5_3rd_4th');
    if (!tf || !tf.winner) return undefined;
    return tf.winner === tf.teamA ? tf.teamB : tf.teamA;
  })();

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const text = `🏏 *${tournament.name.toUpperCase()}*\n📍 Venue: ${tournament.groundName}\n⚡ Format: One-Half 32 Teams (5-Day Knockout)\n\n*DAY-WISE SCHEDULE:*\n🗓️ Day 1: Group 1 (8 Teams ➔ 1 Semi-Finalist)\n🗓️ Day 2: Group 2 (8 Teams ➔ 1 Semi-Finalist)\n🗓️ Day 3: Group 3 (8 Teams ➔ 1 Semi-Finalist)\n🗓️ Day 4: Group 4 (8 Teams ➔ 1 Semi-Finalist)\n🏆 Day 5: Grand Finale (Semi-Finals, 3rd/4th Playoff & Grand Final!)\n\n*PRIZES:*\n🥇 1st Prize: ${tournament.prize1st}\n🥈 2nd Prize: ${tournament.prize2nd}\n🥉 3rd Prize: ${tournament.prize3rd}\n🏅 4th Prize: ${tournament.prize4th}\n\nTrack live scores & updates on GullyScore!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-amber-300 border border-amber-500/40 px-5 py-2.5 rounded-full shadow-2xl font-bold text-xs flex items-center gap-2 backdrop-blur-md"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isTournamentDeletedState ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl border border-rose-500/30 max-w-2xl mx-auto my-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
              <Trash2 size={28} />
            </div>
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest">
                One-Half Tournament Deleted
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                No Active One-Half 32-Team Tournament
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                The previous One-Half Tournament and its match records have been permanently deleted. You can launch a brand-new 5-Day 32-Team Championship below whenever you are ready.
              </p>
            </div>

            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3 mt-2">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                  New Tournament Name
                </label>
                <input
                  type="text"
                  value={newTourNameInput}
                  onChange={(e) => setNewTourNameInput(e.target.value)}
                  placeholder="e.g. City One-Half 32 Championship"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Ground / Turf Venue
                  </label>
                  <input
                    type="text"
                    value={newTourGroundInput}
                    onChange={(e) => setNewTourGroundInput(e.target.value)}
                    placeholder="e.g. Shivaji Ground Turf"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Overs
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newTourOversInput}
                    onChange={(e) => setNewTourOversInput(parseInt(e.target.value, 10) || 8)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateNewOneHalfTournament}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg border border-emerald-400/30 cursor-pointer transition active:scale-95"
              >
                <Plus size={15} />
                <span>Create New 32-Team One-Half Tournament</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-rose-700 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-amber-400/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Row: Badges & Sync Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider">
                <Flame size={12} className="text-amber-300 animate-pulse" />
                Special 5-Day Format
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider">
                <Users size={12} />
                32 Teams • 4 Groups • 5 Days
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                1st, 2nd, 3rd & 4th Prizes
              </span>
            </div>
            <span 
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider"
              title={lastSyncedAt ? `Live background sync active • Last synced at ${lastSyncedAt}` : 'Live background cloud sync active across laptops & online hosting'}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Auto Cloud Synced'}
            </span>
          </div>

          {/* Middle Row: Professional Single-Line Tournament Name & Venue Info */}
          <div className="flex items-center gap-4 min-w-0">
            {tournament.tournamentLogo ? (
              <img
                src={normalizeImageUrl(tournament.tournamentLogo)}
                alt={tournament.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-amber-300/70 shadow-xl shrink-0 bg-slate-900"
                referrerPolicy="no-referrer"
                onError={(e) => handleSmartImageError(e, tournament.tournamentLogo)}
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-amber-400/15 border-2 border-amber-300/40 flex items-center justify-center shrink-0 shadow-lg">
                <Trophy className="text-amber-300" size={30} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1
                className="text-xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white whitespace-nowrap truncate drop-shadow-sm"
                title={tournament.name}
              >
                {tournament.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-amber-100/90 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-amber-300 shrink-0" />
                  <span className="truncate">{tournament.groundName}</span>
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-300 shrink-0" />
                  <span>{tournament.overs} Overs Match</span>
                </span>
                {tournament.youtubeChannelName && (
                  <>
                    <span className="text-white/40">•</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600/30 border border-rose-400/40 text-white text-[11px] font-bold">
                      {tournament.youtubeChannelLogo ? (
                        <img
                          src={normalizeImageUrl(tournament.youtubeChannelLogo)}
                          alt={tournament.youtubeChannelName}
                          className="w-4 h-4 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleSmartImageError(e, tournament.youtubeChannelLogo)}
                        />
                      ) : (
                        <Video size={12} className="text-rose-300" />
                      )}
                      <span>LIVE: {tournament.youtubeChannelName}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => setShowPublicShareModal(true)}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition active:scale-95 border-none cursor-pointer"
              title="Open Public Spectator Hub, Live Link & QR Code"
            >
              <QrCode size={14} />
              Public Hub & QR
            </button>
            <button
              onClick={handleDownloadSchedulePDF}
              className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition active:scale-95 border-none cursor-pointer"
              title="Download Official 5-Day Fixture PDF"
            >
              <Download size={14} />
              PDF Schedule
            </button>
            <button
              onClick={() => setShowPrizeModal(true)}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition active:scale-95 border-none cursor-pointer"
              title="Manage Custom Tournament & Match Prizes"
            >
              <Award size={14} />
              Prizes ({getValidActivePrizes(tournament.prizes || getTournamentPrizesByTournamentId(tournament.id)).length})
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition active:scale-95 border-none cursor-pointer"
            >
              <Share2 size={14} />
              WhatsApp
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md transition active:scale-95 border border-white/20 cursor-pointer"
            >
              <Edit2 size={14} />
              Officials & Settings
            </button>
            <button
              onClick={handleResetTournament}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition border border-white/10 cursor-pointer"
              title="Reset tournament scores & bracket"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={handleDeleteTournament}
              className="px-3 py-2.5 bg-rose-950/60 hover:bg-rose-600 text-rose-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 border border-rose-400/40 cursor-pointer shadow-lg"
              title="Delete this One-Half Tournament permanently"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Prize Money Strip */}
        <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-amber-300/30">
            <span className="text-[9px] uppercase font-black tracking-widest text-amber-200 block">🏆 1st Prize (Champion)</span>
            <span className="text-sm font-black text-white">{tournament.prize1st}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-slate-300/30">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-200 block">🥈 2nd Prize (Runner-Up)</span>
            <span className="text-sm font-black text-white">{tournament.prize2nd}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-amber-500/30">
            <span className="text-[9px] uppercase font-black tracking-widest text-amber-300 block">🥉 3rd Prize (3rd Place)</span>
            <span className="text-sm font-black text-white">{tournament.prize3rd}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-orange-400/30">
            <span className="text-[9px] uppercase font-black tracking-widest text-orange-200 block">🏅 4th Prize (4th Place)</span>
            <span className="text-sm font-black text-white">{tournament.prize4th}</span>
          </div>
        </div>

        {/* Official Broadcast & Match Crew Strip with Photos */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              {
                role: 'Umpire 1',
                name: tournament.umpire1Name || 'Official Umpire 1',
                photo: tournament.umpire1Photo
              },
              {
                role: 'Umpire 2',
                name: tournament.umpire2Name || 'Official Umpire 2',
                photo: tournament.umpire2Photo
              },
              {
                role: 'Scorer',
                name: tournament.scoreboardManagerName || 'Official Scorer',
                photo: tournament.scoreboardManagerPhoto
              },
              {
                role: 'Commentator',
                name: tournament.commentatorName || 'Live Commentator',
                photo: tournament.commentatorPhoto
              },
              ...(tournament.youtubeChannelName || tournament.youtubeChannelLogo
                ? [
                    {
                      role: 'YouTube Live',
                      name: tournament.youtubeChannelName || 'Broadcast Stream',
                      photo: tournament.youtubeChannelLogo
                    }
                  ]
                : [])
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/35 border border-white/15 cursor-pointer transition"
                title="Click to update official name or upload photo"
              >
                <div className="w-7 h-7 rounded-full bg-white/15 border border-amber-300/40 overflow-hidden flex items-center justify-center shrink-0">
                  {item.photo ? (
                    <img
                      src={normalizeImageUrl(item.photo)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => handleSmartImageError(e, item.photo)}
                    />
                  ) : (
                    <User size={13} className="text-amber-200" />
                  )}
                </div>
                <div className="leading-tight">
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-200/90 block">
                    {item.role}
                  </span>
                  <span className="text-[11px] font-bold text-white block max-w-[130px] truncate">
                    {item.name}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-300/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
          >
            <ImageIcon size={12} />
            <span>Upload Official Photos & Logos</span>
          </button>
        </div>
      </div>

      {/* Pinned Live Top 3 Performers Strip: Orange Cap, Purple Cap, Most Sixes & Tournament MVP */}
      <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-4 sm:p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Crown size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  Orange Cap, Purple Cap & MVP Race
                </h2>
                <span className="text-[11px] font-semibold text-amber-400">
                  · Live Top 3 Performers
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {liveCapRaceData.hasLiveOrCompletedData
                  ? `Auto-synced from ${liveCapRaceData.scoredMatchesCount} live/completed tournament match${liveCapRaceData.scoredMatchesCount === 1 ? '' : 'es'} · Click any player for full stats card`
                  : 'Pre-tournament squad leaders loaded · Automatically updates after every match result'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {([
              { id: 'batting', label: '🏏 Batting' },
              { id: 'bowling', label: '⚾ Bowling' },
              { id: 'partnerships', label: '🤝 Partnerships' },
              { id: 'fielding', label: '🧤 Fielding' },
              { id: 'team_stats', label: '🛡️ Team Stats' },
            ] as const).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setStatsSubTab(st.id);
                  setMainTab('stats');
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition border ${
                  mainTab === 'stats' && statsSubTab === st.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <span>{st.label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCapStripCompact(prev => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition border border-slate-700"
              title={isCapStripCompact ? 'Show Top 3 per category' : 'Compact to #1 Leaders only'}
            >
              <span>{isCapStripCompact ? 'Show Top 3' : 'Compact'}</span>
              <ChevronDown size={13} className={`transition-transform ${isCapStripCompact ? '' : 'rotate-180'}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 pt-3.5">
          {[
            {
              id: 'orange',
              title: 'Orange Cap',
              subtitle: 'Most Runs',
              accentText: 'text-orange-400',
              accentBorder: 'border-orange-500/30',
              accentBg: 'bg-orange-500/10',
              rank1Badge: 'bg-orange-500 text-slate-950',
              leaders: liveCapRaceData.orangeCapTop3,
              getPrimaryStat: (p: any) => `${p.runs}`,
              getPrimaryUnit: () => 'RUNS',
              getSecondaryStat: (p: any) => `SR ${p.strikeRate} · HS ${p.highestScore}`
            },
            {
              id: 'purple',
              title: 'Purple Cap',
              subtitle: 'Most Wickets',
              accentText: 'text-purple-400',
              accentBorder: 'border-purple-500/30',
              accentBg: 'bg-purple-500/10',
              rank1Badge: 'bg-purple-500 text-white',
              leaders: liveCapRaceData.purpleCapTop3,
              getPrimaryStat: (p: any) => `${p.wickets}`,
              getPrimaryUnit: () => 'WKTS',
              getSecondaryStat: (p: any) => `ECON ${p.economy} · BBI ${p.bestBowling}`
            },
            {
              id: 'sixes',
              title: 'Most Sixes',
              subtitle: 'Maximums Leader',
              accentText: 'text-emerald-400',
              accentBorder: 'border-emerald-500/30',
              accentBg: 'bg-emerald-500/10',
              rank1Badge: 'bg-emerald-500 text-slate-950',
              leaders: liveCapRaceData.mostSixesTop3,
              getPrimaryStat: (p: any) => `${p.sixes}`,
              getPrimaryUnit: () => 'SIXES',
              getSecondaryStat: (p: any) => `${p.fours} Fours · ${p.runs} Runs`
            },
            {
              id: 'mvp',
              title: 'Tournament MVP',
              subtitle: 'Most Valuable Player',
              accentText: 'text-amber-400',
              accentBorder: 'border-amber-500/30',
              accentBg: 'bg-amber-500/10',
              rank1Badge: 'bg-amber-400 text-slate-950',
              leaders: liveCapRaceData.mvpTop3,
              getPrimaryStat: (p: any) => `${p.mvpPoints}`,
              getPrimaryUnit: () => 'PTS',
              getSecondaryStat: (p: any) => `${p.runs}R · ${p.wickets}W · ${p.potmCount} POTM`
            }
          ].map((cap) => {
            const leader = cap.leaders[0];
            const runnersUp = cap.leaders.slice(1, 3);
            return (
              <div
                key={cap.id}
                className={`rounded-2xl bg-slate-950/90 border ${cap.accentBorder} p-3.5 flex flex-col justify-between gap-3`}
              >
                {/* Cap Category Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                    <span className={cap.accentText}>{cap.title}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] font-semibold text-slate-400 normal-case">
                      {cap.subtitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    Top 3
                  </span>
                </div>

                {/* #1 Cap Holder Spotlight */}
                {leader ? (
                  <div
                    onClick={() => handleOpenPerformerCard(leader)}
                    className={`rounded-xl ${cap.accentBg} border ${cap.accentBorder} p-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-white/5 transition`}
                    title="Click to view Player Tournament & Career Card"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Player Photo + #1 Rank Tag */}
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-slate-800 border-2 border-white/20 overflow-hidden flex items-center justify-center">
                          {leader.playerPhoto ? (
                            <img
                              src={normalizeImageUrl(leader.playerPhoto)}
                              alt={leader.playerName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleSmartImageError(e, leader.playerPhoto)}
                            />
                          ) : (
                            <span className="text-xs font-black text-white">
                              {leader.playerName
                                .split(/\s+/)
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow ${cap.rank1Badge}`}
                        >
                          #1
                        </span>
                      </div>

                      {/* Player Name + Team Badge */}
                      <div className="min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {leader.playerName}
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeamIdForPage(leader.teamId);
                            setViewMode('teams');
                            setMainTab('teams');
                          }}
                          className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-300 hover:text-amber-300 truncate"
                          title={`Open ${leader.teamName} Squad Page`}
                        >
                          {leader.teamLogo ? (
                            <img
                              src={normalizeImageUrl(leader.teamLogo)}
                              alt={leader.teamName}
                              className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-white/20"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleSmartImageError(e, leader.teamLogo)}
                            />
                          ) : (
                            <span
                              className="w-3.5 h-3.5 rounded-full text-[7px] font-black flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: leader.teamColor }}
                            >
                              {leader.teamShortName.slice(0, 2)}
                            </span>
                          )}
                          <span className="font-bold truncate">{leader.teamName}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400 shrink-0">G{leader.teamGroup}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {cap.getSecondaryStat(leader)}
                        </div>
                      </div>
                    </div>

                    {/* Primary Stat Value */}
                    <div className="text-right shrink-0 pl-1">
                      <div className={`text-lg font-black leading-none ${cap.accentText}`}>
                        {cap.getPrimaryStat(leader)}
                      </div>
                      <div className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 mt-0.5">
                        {cap.getPrimaryUnit()}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* #2 & #3 Contenders */}
                {!isCapStripCompact && runnersUp.length > 0 && (
                  <div className="space-y-1.5 pt-0.5">
                    {runnersUp.map((runner: any, rIdx: number) => (
                      <div
                        key={`${cap.id || 'cap'}-${runner.playerId || runner.playerName || 'runner'}-${runner.teamId || ''}-${rIdx}`}
                        onClick={() => handleOpenPerformerCard(runner)}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/80 border border-slate-800/90 cursor-pointer transition"
                        title="Click to view Player Tournament & Career Card"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-black text-slate-400 w-4 shrink-0">
                            #{rIdx + 2}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/15 overflow-hidden flex items-center justify-center shrink-0">
                            {runner.playerPhoto ? (
                              <img
                                src={normalizeImageUrl(runner.playerPhoto)}
                                alt={runner.playerName}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => handleSmartImageError(e, runner.playerPhoto)}
                              />
                            ) : (
                              <span className="text-[9px] font-bold text-slate-300">
                                {runner.playerName
                                  .split(/\s+/)
                                  .map((n: string) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-200 truncate">
                              {runner.playerName}
                            </div>
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 truncate">
                              {runner.teamLogo ? (
                                <img
                                  src={normalizeImageUrl(runner.teamLogo)}
                                  alt={runner.teamName}
                                  className="w-3 h-3 rounded-full object-cover shrink-0"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => handleSmartImageError(e, runner.teamLogo)}
                                />
                              ) : (
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                  style={{ backgroundColor: runner.teamColor }}
                                />
                              )}
                              <span className="truncate">{runner.teamName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-white">
                            {cap.getPrimaryStat(runner)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 ml-1">
                            {cap.getPrimaryUnit()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Match Results Carousel */}
      {mappedStatsMatches.some(m => m.status === 'completed') && (
        <TournamentRecentResultsCarousel
          matches={mappedStatsMatches as any}
          teams={tournament.teams.map(t => ({ id: t.name, name: t.name, captain: t.captain, logo: t.logo }))}
          tournamentName={tournament.name}
          onSelectMatch={(m) => {
            const orig = tournament.matches.find(x => x.id === m.id);
            if (orig) {
              setSelectedScorecardMatch(orig);
              setShowScorecardModal(true);
            }
          }}
          onOpenAwards={(m, defaultAward) => {
            const orig = tournament.matches.find(x => x.id === m.id);
            if (orig) {
              handleOpenMatchAwardCertificates(orig, defaultAward || 'potm');
            }
          }}
        />
      )}

      {/* Main Suite Module Navigation Bar (All buttons visible on mobile without horizontal scroll) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2">
        {[
          { id: 'bracket', label: '5-Day Bracket & Schedule', icon: Trophy },
          {
            id: 'results',
            label: `Match Results (${tournament.matches.filter(m => m.status === 'completed' || (Boolean(m.winner) && !m.winner.startsWith('Winner') && !m.winner.startsWith('Loser') && !m.winner.startsWith('Day '))).length})`,
            icon: CheckCircle2
          },
          { id: 'teams', label: '32 Teams & Squads', icon: Users },
          { id: 'venue-scheduler', label: 'Grounds & Logistics', icon: MapPin },
          { id: 'standings', label: 'Points Table & NRR', icon: ListOrdered },
          { id: 'stats', label: 'Stats & Leaderboards', icon: BarChart3 },
          { id: 'prizes', label: 'Prizes & Certificates', icon: Award },
        ].map(tab => {
          const Icon = tab.icon;
          const active = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMainTab(tab.id as any);
                if (tab.id === 'teams') {
                  if (!selectedTeamIdForPage && tournament.teams.length > 0) {
                    setSelectedTeamIdForPage(tournament.teams[0].id);
                  }
                  setViewMode('teams');
                } else if (tab.id === 'bracket' && viewMode === 'teams') {
                  setViewMode('bracket');
                }
              }}
              className={`px-3 sm:px-4 py-2.5 rounded-2xl text-[10.5px] sm:text-xs font-black uppercase tracking-wider flex items-center justify-center lg:justify-start gap-1.5 sm:gap-2 transition cursor-pointer border min-w-0 ${
                active
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5-Day Switcher Tabs (Visible in Bracket & Schedule mode) */}
      {mainTab === 'bracket' && viewMode !== 'teams' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { day: 1, title: 'Day 1: Group 1', sub: '8 Teams ➔ 1 Qualifier', icon: '1' },
              { day: 2, title: 'Day 2: Group 2', sub: '8 Teams ➔ 1 Qualifier', icon: '2' },
              { day: 3, title: 'Day 3: Group 3', sub: '8 Teams ➔ 1 Qualifier', icon: '3' },
              { day: 4, title: 'Day 4: Group 4', sub: '8 Teams ➔ 1 Qualifier', icon: '4' },
              { day: 5, title: 'Day 5: FINALS DAY', sub: 'SFs, 3rd/4th & Final', icon: '🏆', highlight: true }
            ].map((item) => {
              const isActive = activeDay === item.day;
              const status = getDayStatus(item.day as any);
              return (
                <button
                  key={item.day}
                  onClick={() => setActiveDay(item.day as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isActive
                      ? item.highlight
                        ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-black/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      Day {item.day}
                    </span>
                    <span className={`text-[9px] font-bold ${
                      status === 'Completed' ? 'text-emerald-400' : isActive ? 'text-white/80' : 'text-slate-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                  <div>
                    <strong className="text-xs sm:text-sm font-black block leading-tight truncate">
                      {item.title}
                    </strong>
                    <span className={`text-[9.5px] font-medium block truncate mt-0.5 ${isActive ? 'text-white/90' : 'text-slate-400'}`}>
                      {item.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Schedule View Mode & Filter Controls Bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('bracket')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition ${
                  viewMode === 'bracket'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <LayoutGrid size={13} />
                Bracket View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('schedule')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition ${
                  viewMode === 'schedule'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <Clock size={13} />
                Day {activeDay} Timeline
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all_days')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition ${
                  viewMode === 'all_days'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                }`}
              >
                <CalendarCheck size={13} />
                Master 5-Day Table
              </button>
            </div>

            {/* Filters & Time Slot Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="live">Live / In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700 outline-none max-w-[160px]"
              >
                <option value="all">All 32 Teams</option>
                {tournament.teams.map((t, idx) => (
                  <option key={`${t.id || 'team'}-${idx}`} value={t.name}>{t.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setShowAutoScheduleModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
              >
                <Zap size={12} />
                Auto-Slots
              </button>

              <button
                type="button"
                onClick={() => setShowBatchDelayModal(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
              >
                <AlertTriangle size={12} />
                Rain Delay
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main Content Area based on Main Module Tab, View Mode, and Active Day */}
      {mainTab === 'results' ? (
        <div className="space-y-5">
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Official Completed Match Records
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  {tournament.matches.filter(m => m.status === 'completed' || (Boolean(m.winner) && !m.winner.startsWith('Winner') && !m.winner.startsWith('Loser') && !m.winner.startsWith('Day '))).length} of {tournament.matches.length} Matches Completed
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2 min-w-0">
                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                <span className="whitespace-nowrap truncate" title={`${tournament.name} — Match Results`}>
                  {tournament.name} — Match Results
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                All concluded matches across the 5-day knockout tournament with full scorecards, awards, and winner progression.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 1, 2, 3, 4, 5] as const).map(d => (
                <button
                  key={String(d)}
                  type="button"
                  onClick={() => setResultsDayFilter(d)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase cursor-pointer border transition ${
                    resultsDayFilter === d
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-emerald-500/40'
                  }`}
                >
                  {d === 'all' ? 'All Days' : d === 5 ? 'Day 5 Finals' : `Day ${d} (Group ${d})`}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const completedList = tournament.matches.filter(m => {
              const isDone =
                m.status === 'completed' ||
                (Boolean(m.winner) &&
                  !m.winner.startsWith('Winner') &&
                  !m.winner.startsWith('Loser') &&
                  !m.winner.startsWith('Day '));
              if (!isDone) return false;
              if (resultsDayFilter !== 'all' && m.day !== resultsDayFilter) return false;
              return true;
            });

            if (completedList.length === 0) {
              return (
                <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <Trophy className="mx-auto text-amber-400" size={36} />
                  <h3 className="text-sm sm:text-base font-black uppercase text-slate-800 dark:text-white">
                    No Completed Matches Recorded Yet {resultsDayFilter !== 'all' ? `for Day ${resultsDayFilter}` : ''}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Start live scoring or enter a quick result on any match in the 5-Day Bracket to see completed match results, scorecards, and certificates here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMainTab('bracket')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider border-none cursor-pointer"
                  >
                    Go to 5-Day Bracket
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedList.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    onLaunchLive={handleLaunchLiveScorer}
                    onOpenTeamPage={(teamName) => {
                      const found = tournament.teams.find(t => t.name === teamName);
                      if (found) {
                        setSelectedTeamIdForPage(found.id);
                        setViewMode('teams');
                        setMainTab('teams');
                      }
                    }}
                    onQuickScore={() => {
                      setEditingMatch(match);
                      setQuickScoreA(match.scoreA || '');
                      setQuickScoreB(match.scoreB || '');
                      setQuickOversA(match.oversA || `${tournament.overs}`);
                      setQuickOversB(match.oversB || `${tournament.overs}`);
                      setQuickWinner(match.winner || match.teamA);
                      setQuickWinReason(match.winReason || '');
                      setQuickPOTM(match.manOfTheMatch || '');
                    }}
                    onEditSlot={() => {
                      setEditingSlotMatch(match);
                      setShowTimeSlotEditModal(true);
                    }}
                    onOpenScorecard={() => {
                      setSelectedScorecardMatch(match);
                      setShowScorecardModal(true);
                    }}
                    onOpenBanner={() => {
                      setSelectedMatchForBanner(match);
                      setShowMatchBannerModal(true);
                    }}
                    onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      ) : mainTab === 'venue-scheduler' ? (
        <TournamentVenueScheduler
          tournamentId={tournament.id}
          teams={mappedVenueTeams}
          roundsType="knockout"
          format="Box Cricket"
          onUpdateTeams={(updatedVenueTeams) => {
            setTournament(prev => ({
              ...prev,
              teams: prev.teams.map(t => {
                const found = updatedVenueTeams.find(vt => vt.id === t.id);
                if (!found) return t;
                return {
                  ...t,
                  name: found.name,
                  captain: found.captain,
                  captainPhone: found.contactEmail
                };
              })
            }));
            showToast('✓ Teams & roster updated from Venue Scheduler!');
          }}
          onUpdateSchedule={(updatedMatches) => {
            showToast(`✓ Synced ${updatedMatches.length} scheduled matches!`);
          }}
          matches={mappedStatsMatches}
        />
      ) : mainTab === 'standings' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">Filter by Group:</span>
              {(['all', '1', '2', '3', '4'] as const).map(grp => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setStandingsGroupFilter(grp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase cursor-pointer border transition ${
                    standingsGroupFilter === grp
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'
                  }`}
                >
                  {grp === 'all' ? 'All 32 Teams' : `Group ${grp} (Day ${grp})`}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleExportStandingsCSV}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer"
            >
              <Download size={13} />
              Export Standings CSV
            </button>
          </div>

          <PointsTableModule
            standings={standingsData}
            teams={tournament.teams.map(t => ({
              id: t.name,
              name: t.name,
              captain: t.captain,
              logo: t.logo,
              group: t.group,
              shortName: t.shortName
            }))}
            matches={tournament.matches.map(m => ({
              id: m.id,
              teamAId: m.teamA,
              teamBId: m.teamB,
              teamAName: m.teamA,
              teamBName: m.teamB,
              status: m.status === 'completed' ? 'completed' : m.status === 'live' ? 'live' : 'scheduled',
              scoreA: m.scoreA || '',
              scoreB: m.scoreB || '',
              oversA: m.oversA || `${tournament.overs}`,
              oversB: m.oversB || `${tournament.overs}`,
              winnerId: m.winner ? (m.winner === m.teamA ? m.teamA : m.teamB) : null,
              winner: m.winner || null,
              winReason: m.winReason || (m.winner ? `${m.winner} won` : ''),
              stage: m.label,
              date: m.date
            }))}
            qualifyingSpots={standingsGroupFilter === 'all' ? 4 : 1}
            standardOversQuota={tournament.overs}
            tournamentName={tournament.name}
            activeTabMode={standingsTabMode}
            onTabModeChange={setStandingsTabMode}
            onExportCSV={handleExportStandingsCSV}
            onOpenMatchScorecard={(matchId) => {
              const found = tournament.matches.find(x => x.id === matchId);
              if (found) {
                setSelectedScorecardMatch(found);
                setShowScorecardModal(true);
              }
            }}
          />
        </div>
      ) : mainTab === 'stats' ? (
        <div className="space-y-5">
          {/* One-Half 32-Team Statistics Module Header & Group Filter */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                    CricHeroes & Cricbuzz Pro Analytics
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    32 Teams • 4 Groups • 60+ Tournament Metrics
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1 flex items-center gap-2 min-w-0">
                  <BarChart3 size={20} className="text-amber-500 shrink-0" />
                  <span className="whitespace-nowrap truncate" title={`${tournament.name} — Complete Tournament Statistics`}>
                    {tournament.name} — Complete Tournament Statistics
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Full Batting (15 metrics), Bowling (15 metrics), Partnership (8 metrics), Fielding (12 metrics), and Team (10 metrics) leaderboards.
                </p>
              </div>

              {/* Group / Day Filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                  Scope:
                </span>
                {(['all', '1', '2', '3', '4'] as const).map(grp => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setStatsGroupFilter(grp)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase cursor-pointer border transition ${
                      statsGroupFilter === grp
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent hover:border-emerald-500/40'
                    }`}
                  >
                    {grp === 'all' ? 'All 32 Teams' : `Group ${grp} (Day ${grp})`}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 Core Statistics Modules Quick-Select Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {[
                {
                  id: 'batting' as StatsLeaderboardSubTab,
                  title: 'Batting Stats',
                  sub: '15 Metrics · Orange Cap, SR,Avg, 4s/6s',
                  emoji: '🏏',
                  activeClass: 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                },
                {
                  id: 'bowling' as StatsLeaderboardSubTab,
                  title: 'Bowling Stats',
                  sub: '15 Metrics · Purple Cap, BBI, Econ, Dots',
                  emoji: '⚾',
                  activeClass: 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                },
                {
                  id: 'partnerships' as StatsLeaderboardSubTab,
                  title: 'Partnerships',
                  sub: '8 Metrics · Best Stands, 1st–6th Wkt',
                  emoji: '🤝',
                  activeClass: 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                },
                {
                  id: 'fielding' as StatsLeaderboardSubTab,
                  title: 'Fielding Stats',
                  sub: '12 Metrics · Catches, Run-Outs, WK',
                  emoji: '🧤',
                  activeClass: 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/20'
                },
                {
                  id: 'team_stats' as StatsLeaderboardSubTab,
                  title: 'Team Statistics',
                  sub: '10 Metrics · Highest Totals, Chases, RR',
                  emoji: '🛡️',
                  activeClass: 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                }
              ].map(card => {
                const isSelected = statsSubTab === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setStatsSubTab(card.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? card.activeClass
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{card.emoji}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-black/20 text-current' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                      }`}>
                        Active
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-wide truncate">
                        {card.title}
                      </div>
                      <div className={`text-[10px] font-medium truncate mt-0.5 ${
                        isSelected ? 'opacity-90' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {card.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <TournamentStatsAndLeaderboards
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            teams={filteredStatsVenueTeams}
            matches={mappedStatsMatches}
            activeSubTab={statsSubTab}
            onSubTabChange={setStatsSubTab}
            onGoToFixtures={() => setMainTab('bracket')}
            onStartScoringMatch={(m) => {
              const orig = tournament.matches.find(x => x.id === m.id);
              if (orig) {
                handleLaunchLiveScorer(orig);
              }
            }}
            onSelectTeam={(teamName) => {
              const found = tournament.teams.find(t => t.name === teamName);
              if (found) {
                setSelectedTeamIdForPage(found.id);
                setMainTab('teams');
                setViewMode('teams');
              }
            }}
          />
        </div>
      ) : mainTab === 'prizes' ? (
        <div className="space-y-6">
          {/* Top Prize Pool & Sponsor Podium Center */}
          {(() => {
            const currentPrizes =
              tournament.prizes && tournament.prizes.length > 0
                ? tournament.prizes
                : getTournamentPrizesByTournamentId(tournament.id);
            const activePrizes = currentPrizes.filter((p) => p.isActive !== false);
            const totalPurse = activePrizes.reduce(
              (sum, p) => sum + (Number(String(p.amount || '').replace(/[^0-9.-]+/g, '')) || 0),
              0
            );
            const patronsCount = currentPrizes.filter((p) => Boolean(p.personName?.trim())).length;

            return (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 text-white overflow-hidden shadow-lg">
                {/* Header Bar */}
                <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-950/60">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                      <Trophy size={14} />
                      <span>Official Tournament Purse & Patron Directory</span>
                    </div>
                    <h2
                      className="text-lg sm:text-xl font-bold text-white mt-1 whitespace-nowrap truncate"
                      title={`${tournament.name} — Prize Money & Sponsor Honors`}
                    >
                      {tournament.name} — Prize Money & Sponsor Honors
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Manage 1st–4th team podium cash prizes, individual cap awards, patron photos, and live TV scorebug tickers.
                    </p>
                  </div>

                  {/* Summary Metrics & Primary CTA */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-5 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Total Prize Purse</span>
                        <span className="text-base font-bold font-mono tabular-nums text-amber-400">
                          ₹{totalPurse.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-7 w-px bg-slate-800" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Active Awards</span>
                        <span className="text-base font-bold font-mono tabular-nums text-emerald-400">
                          {activePrizes.length}
                        </span>
                      </div>
                      <div className="h-7 w-px bg-slate-800" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Sponsors</span>
                        <span className="text-base font-bold font-mono tabular-nums text-white">
                          {patronsCount}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPrizeModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-colors shrink-0"
                    >
                      <Trophy size={14} />
                      <span>Open Prize Money Manager</span>
                    </button>
                  </div>
                </div>

                {/* Configured Prizes & Sponsors Grid */}
                <div className="p-5 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {currentPrizes.map((prize) => {
                      const isPodium =
                        prize.category === 'tournament_1st' ||
                        prize.category === 'tournament_2nd' ||
                        prize.category === 'tournament_3rd' ||
                        prize.category === 'tournament_4th';
                      const initials = prize.personName?.trim()
                        ? prize.personName
                            .trim()
                            .replace(/^(Shri|Smt|Dr|Adv|Mr|Mrs)\.?\s+/i, '')
                            .split(/\s+/)
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'SP';

                      return (
                        <div
                          key={prize.id}
                          onClick={() => setShowPrizeModal(true)}
                          className={`p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                            isPodium
                              ? 'bg-slate-950/90 border-amber-500/30 hover:border-amber-400'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-semibold text-amber-400">
                                {isPodium ? 'Team Podium' : 'Special Award'}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  prize.isActive !== false ? 'text-emerald-400' : 'text-slate-500'
                                }`}
                              >
                                {prize.isActive !== false ? 'Live on TV' : 'Hidden'}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1 truncate">{prize.title}</h3>
                            <div className="text-lg font-bold font-mono tabular-nums text-amber-400 mt-1">
                              {prize.currency || '₹'}
                              {prize.amount || '0'}
                            </div>
                            {prize.winnerName?.trim() && (
                              <div className="text-xs font-semibold text-emerald-400 mt-1 truncate">
                                Winner: {prize.winnerName}
                              </div>
                            )}
                          </div>

                          <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2.5">
                            {prize.personPhoto ? (
                              <img
                                src={prize.personPhoto}
                                alt={prize.personName || 'Sponsor'}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                                {initials}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-[10px] text-slate-400 block truncate">
                                {prize.tagline || 'Sponsored By'}
                              </span>
                              <span className="text-xs font-semibold text-slate-200 block truncate">
                                {prize.personName?.trim() || 'Click to add sponsor'}
                              </span>
                              {prize.personDesignation?.trim() && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {prize.personDesignation}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Match Certificates & VS Poster Generator Hub */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award size={18} className="text-amber-500" />
                  <span>Match Award Certificates & VS Posters (31 Matches)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate printable HD certificates (Player of the Match, Best Batsman, Best Bowler, Champion) or social VS posters for any match.
                </p>
              </div>

              {/* Day Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                {(['all', 1, 2, 3, 4, 5] as const).map((d) => (
                  <button
                    key={String(d)}
                    type="button"
                    onClick={() => setPrizeMatchDayFilter(d)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      prizeMatchDayFilter === d
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {d === 'all' ? 'All Days' : d === 5 ? 'Day 5 Finals' : `Day ${d}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.matches
                .filter((m) => prizeMatchDayFilter === 'all' || m.day === prizeMatchDayFilter)
                .map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Day {m.day} · Match #{m.matchNumber}</span>
                        <span className={m.status === 'completed' ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'}>
                          {m.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {m.teamA} <span className="text-slate-400 font-normal">vs</span> {m.teamB}
                      </div>
                      {m.winner && (
                        <div className="text-xs font-semibold text-emerald-500 mt-1">
                          Winner: {m.winner}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleOpenMatchAwardCertificates(m, 'potm')}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Award size={13} />
                        <span>Certificates</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMatchForBanner(m);
                          setShowMatchBannerModal(true);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <ImageIcon size={13} />
                        <span>VS Poster</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : viewMode === 'teams' || mainTab === 'teams' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white">32 Teams Directory & Captain Self-Registration</h3>
              <p className="text-xs text-slate-500">Import verified local teams or open the Captain Squad Submission Portal for any team.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLocalDirectoryModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer"
              >
                <Users size={14} />
                Import Local Teams Directory
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentTeam = tournament.teams.find(t => t.id === selectedTeamIdForPage) || tournament.teams[0];
                  setCaptainSubTeam(currentTeam);
                  setShowCaptainSubmissionModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer"
              >
                <UserCheck size={14} />
                Captain Squad Submission Portal
              </button>
            </div>
          </div>

          <TeamDedicatedPageView
            team={tournament.teams.find(t => t.id === selectedTeamIdForPage) || tournament.teams[0]}
            tournament={tournament}
            onUpdateTeam={handleUpdateTeam}
            onSelectAnotherTeam={(id) => setSelectedTeamIdForPage(id)}
            onStartLiveMatchWithSquad={handleStartLiveWithTeamSquad}
            onBackToBracket={() => {
              setMainTab('bracket');
              setViewMode('bracket');
            }}
            showToast={showToast}
          />
        </div>
      ) : viewMode === 'schedule' ? (
        <MatchScheduleTimelineView
          day={activeDay}
          tournament={tournament}
          onEditSlot={(match) => {
            setEditingSlotMatch(match);
            setShowTimeSlotEditModal(true);
          }}
          onLaunchLive={handleLaunchLiveScorer}
          onOpenAutoSchedule={() => setShowAutoScheduleModal(true)}
          onOpenBatchDelay={() => setShowBatchDelayModal(true)}
          onQuickStatusChange={handleQuickStatusChange}
        />
      ) : viewMode === 'all_days' ? (
        <Master5DayScheduleView
          tournament={tournament}
          onSelectDay={(d) => {
            setActiveDay(d);
            setViewMode('schedule');
          }}
          onEditSlot={(match) => {
            setEditingSlotMatch(match);
            setShowTimeSlotEditModal(true);
          }}
        />
      ) : activeDay >= 1 && activeDay <= 4 ? (
        <div className="space-y-6">
          {/* Day Group Header Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Calendar size={13} /> Day {activeDay} Group Knockout Schedule
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                Group {activeDay} Knockout Bracket (8 Teams)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4 Round 1 Matches ➔ 2 Group Semis ➔ 1 Group Final. The winner becomes the <strong>Day {activeDay} Qualifier</strong> for Day 5 Semis!
              </p>
            </div>

            {/* Qualifier & Manual Team Selection Action */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setManualMatchupDay(activeDay as 1 | 2 | 3 | 4);
                  setShowManualMatchupModal(true);
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition active:scale-95 shadow-md border-none"
                title={`Manually select Team A vs Team B for Group ${activeDay} Round 1`}
              >
                <ArrowLeftRight size={14} />
                <span>Select Teams (A vs B)</span>
              </button>

              <div className="p-3 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black text-lg">
                  🏆
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                    Day {activeDay} Final Qualifier:
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                    {tournament.matches.find(m => m.id === `day_${activeDay}_final`)?.winner || 'Pending Group Final...'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Knockout Bracket Visual Grid */}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualMatchupDay(activeDay as 1 | 2 | 3 | 4);
                      setShowManualMatchupModal(true);
                    }}
                    className="text-[9.5px] font-black uppercase text-amber-500 hover:text-amber-400 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    title="Change Team A vs Team B matchups"
                  >
                    <ArrowLeftRight size={10} />
                    <span>Edit Pairs</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">4 Matches</span>
                </div>
              </div>

              {dayMatches.filter(m => m.round === 'round1').map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournament={tournament}
                  onLaunchLive={handleLaunchLiveScorer}
                  onOpenTeamPage={(teamName) => {
                    const found = tournament.teams.find(t => t.name === teamName);
                    if (found) {
                      setSelectedTeamIdForPage(found.id);
                      setViewMode('teams');
                    }
                  }}
                  onOpenManualMatchup={() => {
                    setManualMatchupDay(activeDay as 1 | 2 | 3 | 4);
                    setShowManualMatchupModal(true);
                  }}
                  onQuickScore={() => {
                    setEditingMatch(match);
                    setQuickScoreA(match.scoreA || '');
                    setQuickScoreB(match.scoreB || '');
                    setQuickOversA(match.oversA || `${tournament.overs}`);
                    setQuickOversB(match.oversB || `${tournament.overs}`);
                    setQuickWinner(match.winner || match.teamA);
                    setQuickWinReason(match.winReason || '');
                    setQuickPOTM(match.manOfTheMatch || '');
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
                  onOpenScorecard={() => {
                    setSelectedScorecardMatch(match);
                    setShowScorecardModal(true);
                  }}
                  onOpenBanner={() => {
                    setSelectedMatchForBanner(match);
                    setShowMatchBannerModal(true);
                  }}
                  onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
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

              {dayMatches.filter(m => m.round === 'round2').map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournament={tournament}
                  onLaunchLive={handleLaunchLiveScorer}
                  onOpenTeamPage={(teamName) => {
                    const found = tournament.teams.find(t => t.name === teamName);
                    if (found) {
                      setSelectedTeamIdForPage(found.id);
                      setViewMode('teams');
                    }
                  }}
                  onQuickScore={() => {
                    setEditingMatch(match);
                    setQuickScoreA(match.scoreA || '');
                    setQuickScoreB(match.scoreB || '');
                    setQuickOversA(match.oversA || `${tournament.overs}`);
                    setQuickOversB(match.oversB || `${tournament.overs}`);
                    setQuickWinner(match.winner || match.teamA);
                    setQuickWinReason(match.winReason || '');
                    setQuickPOTM(match.manOfTheMatch || '');
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
                  onOpenScorecard={() => {
                    setSelectedScorecardMatch(match);
                    setShowScorecardModal(true);
                  }}
                  onOpenBanner={() => {
                    setSelectedMatchForBanner(match);
                    setShowMatchBannerModal(true);
                  }}
                  onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
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

              {dayMatches.filter(m => m.round === 'group_final').map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournament={tournament}
                  highlightFinal
                  onLaunchLive={handleLaunchLiveScorer}
                  onOpenTeamPage={(teamName) => {
                    const found = tournament.teams.find(t => t.name === teamName);
                    if (found) {
                      setSelectedTeamIdForPage(found.id);
                      setViewMode('teams');
                    }
                  }}
                  onQuickScore={() => {
                    setEditingMatch(match);
                    setQuickScoreA(match.scoreA || '');
                    setQuickScoreB(match.scoreB || '');
                    setQuickOversA(match.oversA || `${tournament.overs}`);
                    setQuickOversB(match.oversB || `${tournament.overs}`);
                    setQuickWinner(match.winner || match.teamA);
                    setQuickWinReason(match.winReason || '');
                    setQuickPOTM(match.manOfTheMatch || '');
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
                  onOpenScorecard={() => {
                    setSelectedScorecardMatch(match);
                    setShowScorecardModal(true);
                  }}
                  onOpenBanner={() => {
                    setSelectedMatchForBanner(match);
                    setShowMatchBannerModal(true);
                  }}
                  onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
                />
              ))}

              {/* Qualified Team Banner */}
              {tournament.matches.find(m => m.id === `day_${activeDay}_final`)?.winner && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/15 border border-emerald-500/40 text-center space-y-1.5">
                  <span className="text-2xl">🎉</span>
                  <strong className="text-sm font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                    {tournament.matches.find(m => m.id === `day_${activeDay}_final`)?.winner}
                  </strong>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Qualified for <strong>Day 5 Semi-Finals</strong> on Finals Day!
                  </p>
                  <button
                    onClick={() => setActiveDay(5)}
                    className="mt-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer transition"
                  >
                    View Day 5 Finals Bracket ➔
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Day 5: Finals Day Screen */
        <div className="space-y-6">
          {/* Day 5 Banner */}
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

              {/* Podium Status */}
              {champion && (
                <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-center shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">🏆 TOURNAMENT CHAMPION</span>
                  <strong className="text-sm sm:text-base font-black text-white">{champion}</strong>
                </div>
              )}
            </div>

            {/* 4 Qualifiers Strip */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Day 1 Qualifier (Group 1)</span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">{group1Qual}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Day 2 Qualifier (Group 2)</span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">{group2Qual}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Day 3 Qualifier (Group 3)</span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">{group3Qual}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Day 4 Qualifier (Group 4)</span>
                <strong className="text-xs font-black text-amber-400 truncate block mt-0.5">{group4Qual}</strong>
              </div>
            </div>
          </div>

          {/* Finals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Semi-Finals */}
            <div className="space-y-4">
              <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Zap size={14} />
                  Semi-Final Matches (Day 5)
                </span>
                <span className="text-[10px] font-mono text-slate-400">Winners advance to Grand Final</span>
              </div>

              {dayMatches.filter(m => m.round === 'semi_final').map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournament={tournament}
                  onLaunchLive={handleLaunchLiveScorer}
                  onOpenTeamPage={(teamName) => {
                    const found = tournament.teams.find(t => t.name === teamName);
                    if (found) {
                      setSelectedTeamIdForPage(found.id);
                      setViewMode('teams');
                    }
                  }}
                  onQuickScore={() => {
                    setEditingMatch(match);
                    setQuickScoreA(match.scoreA || '');
                    setQuickScoreB(match.scoreB || '');
                    setQuickOversA(match.oversA || `${tournament.overs}`);
                    setQuickOversB(match.oversB || `${tournament.overs}`);
                    setQuickWinner(match.winner || match.teamA);
                    setQuickWinReason(match.winReason || '');
                    setQuickPOTM(match.manOfTheMatch || '');
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
                  onOpenScorecard={() => {
                    setSelectedScorecardMatch(match);
                    setShowScorecardModal(true);
                  }}
                  onOpenBanner={() => {
                    setSelectedMatchForBanner(match);
                    setShowMatchBannerModal(true);
                  }}
                  onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
                />
              ))}
            </div>

            {/* Right: Finals & 3rd/4th Playoff */}
            <div className="space-y-4">
              {/* Grand Final Card */}
              <div className="space-y-2">
                <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    GRAND FINAL (1st & 2nd Prize)
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Champion decider</span>
                </div>

                {dayMatches.filter(m => m.round === 'grand_final').map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    highlightFinal
                    onLaunchLive={handleLaunchLiveScorer}
                    onOpenTeamPage={(teamName) => {
                      const found = tournament.teams.find(t => t.name === teamName);
                      if (found) {
                        setSelectedTeamIdForPage(found.id);
                        setViewMode('teams');
                      }
                    }}
                    onQuickScore={() => {
                      setEditingMatch(match);
                      setQuickScoreA(match.scoreA || '');
                      setQuickScoreB(match.scoreB || '');
                      setQuickOversA(match.oversA || `${tournament.overs}`);
                      setQuickOversB(match.oversB || `${tournament.overs}`);
                      setQuickWinner(match.winner || match.teamA);
                      setQuickWinReason(match.winReason || '');
                      setQuickPOTM(match.manOfTheMatch || '');
                    }}
                    onEditSlot={() => {
                      setEditingSlotMatch(match);
                      setShowTimeSlotEditModal(true);
                    }}
                    onOpenScorecard={() => {
                      setSelectedScorecardMatch(match);
                      setShowScorecardModal(true);
                    }}
                    onOpenBanner={() => {
                      setSelectedMatchForBanner(match);
                      setShowMatchBannerModal(true);
                    }}
                    onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
                  />
                ))}
              </div>

              {/* 3rd & 4th Place Match Card */}
              <div className="space-y-2 pt-2">
                <div className="pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                    <Medal size={14} className="text-rose-500" />
                    3rd & 4th Place Playoff (Loser SF1 vs Loser SF2)
                  </span>
                  <span className="text-[10px] font-bold text-rose-500 uppercase">3rd & 4th Prizes</span>
                </div>

                {dayMatches.filter(m => m.round === 'third_fourth').map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    onLaunchLive={handleLaunchLiveScorer}
                    onOpenTeamPage={(teamName) => {
                      const found = tournament.teams.find(t => t.name === teamName);
                      if (found) {
                        setSelectedTeamIdForPage(found.id);
                        setViewMode('teams');
                      }
                    }}
                    onQuickScore={() => {
                      setEditingMatch(match);
                      setQuickScoreA(match.scoreA || '');
                      setQuickScoreB(match.scoreB || '');
                      setQuickOversA(match.oversA || `${tournament.overs}`);
                      setQuickOversB(match.oversB || `${tournament.overs}`);
                      setQuickWinner(match.winner || match.teamA);
                      setQuickWinReason(match.winReason || '');
                      setQuickPOTM(match.manOfTheMatch || '');
                    }}
                    onEditSlot={() => {
                      setEditingSlotMatch(match);
                      setShowTimeSlotEditModal(true);
                    }}
                    onOpenScorecard={() => {
                      setSelectedScorecardMatch(match);
                      setShowScorecardModal(true);
                    }}
                    onOpenBanner={() => {
                      setSelectedMatchForBanner(match);
                      setShowMatchBannerModal(true);
                    }}
                    onOpenCertificates={() => handleOpenMatchAwardCertificates(match, 'potm')}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Grand Prize Podium View */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Award size={16} /> Official Tournament Prize Podium
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
              {/* 1st Prize */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-400/40 text-center space-y-1">
                <span className="text-2xl">🥇</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">1st Prize (Champion)</span>
                <strong className="text-sm font-black text-white block truncate">
                  {champion || 'Waiting Grand Final'}
                </strong>
                <span className="text-xs font-bold text-amber-400 block">{tournament.prize1st}</span>
              </div>

              {/* 2nd Prize */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-400/40 text-center space-y-1">
                <span className="text-2xl">🥈</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 block">2nd Prize (Runner-Up)</span>
                <strong className="text-sm font-black text-white block truncate">
                  {runnerUp || 'Waiting Grand Final'}
                </strong>
                <span className="text-xs font-bold text-slate-300 block">{tournament.prize2nd}</span>
              </div>

              {/* 3rd Prize */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-700/20 to-amber-800/10 border border-amber-600/40 text-center space-y-1">
                <span className="text-2xl">🥉</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">3rd Prize Winner</span>
                <strong className="text-sm font-black text-white block truncate">
                  {thirdPlace || 'Waiting 3rd/4th Match'}
                </strong>
                <span className="text-xs font-bold text-amber-400 block">{tournament.prize3rd}</span>
              </div>

              {/* 4th Prize */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-700/20 to-orange-800/10 border border-orange-500/40 text-center space-y-1">
                <span className="text-2xl">🏅</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300 block">4th Prize (Runner)</span>
                <strong className="text-sm font-black text-white block truncate">
                  {fourthPlace || 'Waiting 3rd/4th Match'}
                </strong>
                <span className="text-xs font-bold text-orange-300 block">{tournament.prize4th}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 32 Teams Roster Viewer / Editor Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <Users size={15} className="text-emerald-500" />
              Tournament Roster: 32 Teams by Day
            </h3>
            <p className="text-[10px] text-slate-400">
              Click any team to open their dedicated Team Page & 15-player squad. Teams 1-8 play on Day 1, Teams 9-16 on Day 2, Teams 17-24 on Day 3, and Teams 25-32 on Day 4.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowLocalDirectoryModal(true)}
              className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer transition flex items-center gap-1"
            >
              <Users size={12} /> Import Local Teams
            </button>
            <button
              type="button"
              onClick={() => {
                setCaptainSubTeam(tournament.teams[0]);
                setShowCaptainSubmissionModal(true);
              }}
              className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer transition flex items-center gap-1"
            >
              <UserCheck size={12} /> Captain Squad Portal
            </button>
            <button
              type="button"
              onClick={() => setShowShuffleConfirmModal(true)}
              className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-none cursor-pointer transition shrink-0"
            >
              🎲 Randomize Groups
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[1, 2, 3, 4].map(grp => (
            <div key={grp} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Group {grp} (Day {grp})
              </span>
              <div className="space-y-1">
                {tournament.teams.filter(t => t.group === grp).map((t, tIdx) => (
                  <div
                    key={`${t.id || 'team'}-${tIdx}`}
                    className="w-full flex items-center justify-between p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/80 transition text-[10px] font-bold text-slate-700 dark:text-slate-300 group"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTeamIdForPage(t.id);
                        setViewMode('teams');
                      }}
                      className="flex-1 text-left truncate bg-transparent border-none cursor-pointer text-slate-700 dark:text-slate-300 hover:text-amber-500 font-bold"
                    >
                      <span className="truncate">{t.name}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[8.5px] font-mono px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                        {t.squad?.length || 15}p
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeamForEdit(t);
                          setNewTeamNameInput(t.name);
                          setShowTeamEditModal(true);
                        }}
                        className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                        title="Edit name"
                      >
                        <Edit2 size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Score Modal */}
      <AnimatePresence>
        {editingMatch && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingMatch(null)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Edit2 size={16} /> Update Match Result & Stats
                </h3>
                <button
                  onClick={() => setEditingMatch(null)}
                  className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                {editingMatch.label}
              </div>

              <div className="space-y-3 font-sans">
                {/* Team A Score & Overs */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      {editingMatch.teamA} Score (e.g. 74/3)
                    </label>
                    <input
                      type="text"
                      value={quickScoreA}
                      onChange={e => {
                        const valA = e.target.value;
                        setQuickScoreA(valA);
                        const rA = parseInt(valA.split(/[\/\-]/)[0], 10);
                        const rB = parseInt(quickScoreB.split(/[\/\-]/)[0], 10);
                        if (!isNaN(rA) && !isNaN(rB)) {
                          if (rA > rB) setQuickWinner(editingMatch.teamA);
                          else if (rB > rA) setQuickWinner(editingMatch.teamB);
                        }
                      }}
                      placeholder="e.g. 82/4"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Overs
                    </label>
                    <input
                      type="text"
                      value={quickOversA}
                      onChange={e => setQuickOversA(e.target.value)}
                      placeholder={`${tournament.overs}.0`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Team B Score & Overs */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      {editingMatch.teamB} Score (e.g. 68/6)
                    </label>
                    <input
                      type="text"
                      value={quickScoreB}
                      onChange={e => {
                        const valB = e.target.value;
                        setQuickScoreB(valB);
                        const rA = parseInt(quickScoreA.split(/[\/\-]/)[0], 10);
                        const rB = parseInt(valB.split(/[\/\-]/)[0], 10);
                        if (!isNaN(rA) && !isNaN(rB)) {
                          if (rA > rB) setQuickWinner(editingMatch.teamA);
                          else if (rB > rA) setQuickWinner(editingMatch.teamB);
                        }
                      }}
                      placeholder="e.g. 76/7"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Overs
                    </label>
                    <input
                      type="text"
                      value={quickOversB}
                      onChange={e => setQuickOversB(e.target.value)}
                      placeholder={`${tournament.overs}.0`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Winner Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Winner (Advances to Next Round)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickWinner(editingMatch.teamA)}
                      className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition ${
                        quickWinner === editingMatch.teamA
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {editingMatch.teamA}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickWinner(editingMatch.teamB)}
                      className={`p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider cursor-pointer transition ${
                        quickWinner === editingMatch.teamB
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {editingMatch.teamB}
                    </button>
                  </div>
                </div>

                {/* Win Reason & Man of the Match */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Win Margin / Reason
                    </label>
                    <input
                      type="text"
                      value={quickWinReason}
                      onChange={e => setQuickWinReason(e.target.value)}
                      placeholder="e.g. Won by 12 runs"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Man of the Match
                    </label>
                    <input
                      type="text"
                      value={quickPOTM}
                      onChange={e => setQuickPOTM(e.target.value)}
                      placeholder="Player Name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingMatch(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!quickWinner) {
                        showToast('Please pick a winner team');
                        return;
                      }
                      const finalOversA = quickOversA.trim() || `${tournament.overs}.0`;
                      const finalOversB = quickOversB.trim() || `${tournament.overs}.0`;
                      let finalWinReason = quickWinReason.trim();
                      if (!finalWinReason) {
                        const rA = parseInt(quickScoreA.split(/[\/\-]/)[0], 10);
                        const rB = parseInt(quickScoreB.split(/[\/\-]/)[0], 10);
                        if (!isNaN(rA) && !isNaN(rB) && rA !== rB) {
                          finalWinReason = `${quickWinner} won by ${Math.abs(rA - rB)} runs`;
                        } else {
                          finalWinReason = `${quickWinner} won the match`;
                        }
                      }
                      updateMatchResult(
                        editingMatch.id,
                        quickWinner,
                        quickScoreA,
                        quickScoreB,
                        finalOversA,
                        finalOversB,
                        finalWinReason,
                        quickPOTM
                      );
                      setEditingMatch(null);
                      showToast(`✓ Match result saved! Points Table & NRR automatically updated.`);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
                  >
                    Save & Advance Winner
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Edit2 size={16} /> Tournament Settings, Officials & Broadcast Branding Photos
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 font-sans">
                {/* Tournament Shield / Logo + Title */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-amber-500/40 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                      {settingTournamentLogo ? (
                        <img
                          src={normalizeImageUrl(settingTournamentLogo)}
                          alt="Tournament Logo"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => handleSmartImageError(e, settingTournamentLogo)}
                        />
                      ) : (
                        <Trophy className="text-amber-400" size={24} />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-amber-400 block">
                        Tournament Shield / Official Logo
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-[10px] font-black uppercase cursor-pointer inline-flex items-center gap-1.5 transition">
                          <Upload size={12} />
                          <span>Upload Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOfficialPhotoUpload(file, (base64) => setSettingTournamentLogo(base64));
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={settingTournamentLogo}
                          onChange={(e) => setSettingTournamentLogo(normalizeImageUrl(e.target.value))}
                          placeholder="Or paste Logo / Google Drive image URL..."
                          className="flex-1 min-w-[140px] bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-amber-500"
                        />
                        {settingTournamentLogo && (
                          <button
                            type="button"
                            onClick={() => setSettingTournamentLogo('')}
                            className="p-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-xl cursor-pointer"
                            title="Remove Logo"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tournament Title</label>
                      <input
                        type="text"
                        value={tournamentTitle}
                        onChange={e => setTournamentTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Ground / Venue</label>
                      <input
                        type="text"
                        value={groundTitle}
                        onChange={e => setGroundTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Overs per Match</label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={oversCount}
                        onChange={e => setOversCount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Ball Type</label>
                      <input
                        type="text"
                        value={ballTypeInput}
                        onChange={e => setBallTypeInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Officials & Broadcast Branding Photos */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ImageIcon size={13} /> Officials & Broadcast Branding Photos
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      Auto-syncs to Live Scorer & Overlays
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Umpire 1 Card */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0">
                          {settingUmpire1Photo ? (
                            <img
                              src={normalizeImageUrl(settingUmpire1Photo)}
                              alt="Umpire 1"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleSmartImageError(e, settingUmpire1Photo)}
                            />
                          ) : (
                            <User size={16} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-black uppercase text-emerald-400 block mb-0.5">
                            On-Field Umpire 1
                          </label>
                          <input
                            type="text"
                            value={settingUmpire1}
                            onChange={e => setSettingUmpire1(e.target.value)}
                            placeholder="Umpire 1 Name"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase cursor-pointer inline-flex items-center gap-1 shrink-0">
                          <Upload size={10} />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOfficialPhotoUpload(file, (b64) => setSettingUmpire1Photo(b64));
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={settingUmpire1Photo}
                          onChange={e => setSettingUmpire1Photo(normalizeImageUrl(e.target.value))}
                          placeholder="Or photo URL..."
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none"
                        />
                        {settingUmpire1Photo && (
                          <button
                            type="button"
                            onClick={() => setSettingUmpire1Photo('')}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
                            title="Clear Photo"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Umpire 2 Card */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-emerald-500/40 overflow-hidden flex items-center justify-center shrink-0">
                          {settingUmpire2Photo ? (
                            <img
                              src={normalizeImageUrl(settingUmpire2Photo)}
                              alt="Umpire 2"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleSmartImageError(e, settingUmpire2Photo)}
                            />
                          ) : (
                            <User size={16} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-black uppercase text-emerald-400 block mb-0.5">
                            Leg Umpire 2
                          </label>
                          <input
                            type="text"
                            value={settingUmpire2}
                            onChange={e => setSettingUmpire2(e.target.value)}
                            placeholder="Umpire 2 Name"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[9px] font-black uppercase cursor-pointer inline-flex items-center gap-1 shrink-0">
                          <Upload size={10} />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOfficialPhotoUpload(file, (b64) => setSettingUmpire2Photo(b64));
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={settingUmpire2Photo}
                          onChange={e => setSettingUmpire2Photo(normalizeImageUrl(e.target.value))}
                          placeholder="Or photo URL..."
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none"
                        />
                        {settingUmpire2Photo && (
                          <button
                            type="button"
                            onClick={() => setSettingUmpire2Photo('')}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
                            title="Clear Photo"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Official Scorer Card */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-cyan-500/40 overflow-hidden flex items-center justify-center shrink-0">
                          {settingScorerPhoto ? (
                            <img
                              src={normalizeImageUrl(settingScorerPhoto)}
                              alt="Official Scorer"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleSmartImageError(e, settingScorerPhoto)}
                            />
                          ) : (
                            <User size={16} className="text-cyan-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-black uppercase text-cyan-400 block mb-0.5">
                            Official Scorer
                          </label>
                          <input
                            type="text"
                            value={settingScorer}
                            onChange={e => setSettingScorer(e.target.value)}
                            placeholder="Scorer Name"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg text-[9px] font-black uppercase cursor-pointer inline-flex items-center gap-1 shrink-0">
                          <Upload size={10} />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOfficialPhotoUpload(file, (b64) => setSettingScorerPhoto(b64));
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={settingScorerPhoto}
                          onChange={e => setSettingScorerPhoto(normalizeImageUrl(e.target.value))}
                          placeholder="Or photo URL..."
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none"
                        />
                        {settingScorerPhoto && (
                          <button
                            type="button"
                            onClick={() => setSettingScorerPhoto('')}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
                            title="Clear Photo"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Commentator Card */}
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-slate-950 border border-purple-500/40 overflow-hidden flex items-center justify-center shrink-0">
                          {settingCommentatorPhoto ? (
                            <img
                              src={normalizeImageUrl(settingCommentatorPhoto)}
                              alt="Commentator"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => handleSmartImageError(e, settingCommentatorPhoto)}
                            />
                          ) : (
                            <Mic size={16} className="text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <label className="text-[9px] font-black uppercase text-purple-400 block mb-0.5">
                            Live Commentator
                          </label>
                          <input
                            type="text"
                            value={settingCommentator}
                            onChange={e => setSettingCommentator(e.target.value)}
                            placeholder="Commentator Name"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="px-2.5 py-1 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 rounded-lg text-[9px] font-black uppercase cursor-pointer inline-flex items-center gap-1 shrink-0">
                          <Upload size={10} />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleOfficialPhotoUpload(file, (b64) => setSettingCommentatorPhoto(b64));
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={settingCommentatorPhoto}
                          onChange={e => setSettingCommentatorPhoto(normalizeImageUrl(e.target.value))}
                          placeholder="Or photo URL..."
                          className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none"
                        />
                        {settingCommentatorPhoto && (
                          <button
                            type="button"
                            onClick={() => setSettingCommentatorPhoto('')}
                            className="p-1 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
                            title="Clear Photo"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* YouTube Broadcast Channel Name & Logo */}
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-950 border border-rose-500/40 overflow-hidden flex items-center justify-center shrink-0">
                        {settingYoutubeLogo ? (
                          <img
                            src={normalizeImageUrl(settingYoutubeLogo)}
                            alt="YouTube Channel Logo"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => handleSmartImageError(e, settingYoutubeLogo)}
                          />
                        ) : (
                          <Video size={18} className="text-rose-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-[9px] font-black uppercase text-rose-400 block mb-0.5">
                          YouTube Broadcast Channel Name & Stream Logo
                        </label>
                        <input
                          type="text"
                          value={settingYoutubeName}
                          onChange={e => setSettingYoutubeName(e.target.value)}
                          placeholder="e.g. GullyScore Live HD"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[9px] font-black uppercase cursor-pointer inline-flex items-center gap-1 shrink-0">
                        <Upload size={10} />
                        <span>Upload Channel Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleOfficialPhotoUpload(file, (b64) => setSettingYoutubeLogo(b64));
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={settingYoutubeLogo}
                        onChange={e => setSettingYoutubeLogo(normalizeImageUrl(e.target.value))}
                        placeholder="Or paste YouTube Channel Logo URL..."
                        className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 outline-none"
                      />
                      {settingYoutubeLogo && (
                        <button
                          type="button"
                          onClick={() => setSettingYoutubeLogo('')}
                          className="p-1 text-rose-400 hover:text-rose-300 bg-transparent border-none cursor-pointer"
                          title="Clear Channel Logo"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Prizes Configuration */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-amber-400 block">Prizes Configuration</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">1st Prize</label>
                      <input
                        type="text"
                        value={prize1}
                        onChange={e => setPrize1(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">2nd Prize</label>
                      <input
                        type="text"
                        value={prize2}
                        onChange={e => setPrize2(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">3rd Prize</label>
                      <input
                        type="text"
                        value={prize3}
                        onChange={e => setPrize3(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">4th Prize</label>
                      <input
                        type="text"
                        value={prize4}
                        onChange={e => setPrize4(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowDeleteConfirmModal(true);
                    }}
                    className="px-3 py-2 bg-rose-500/15 hover:bg-rose-600 text-rose-400 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl border border-rose-500/30 cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <Trash2 size={13} />
                    <span>Delete Tournament</span>
                  </button>
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          if (settingTournamentLogo) localStorage.setItem('cricket_tournament_logo', settingTournamentLogo);
                          if (settingYoutubeName) localStorage.setItem('cricket_youtube_channel_name', settingYoutubeName);
                          if (settingYoutubeLogo) localStorage.setItem('cricket_youtube_channel_logo', settingYoutubeLogo);
                        } catch (_) {}

                        setTournament(prev => ({
                          ...prev,
                          name: tournamentTitle,
                          groundName: groundTitle,
                          overs: oversCount,
                          ballType: ballTypeInput,
                          tournamentLogo: settingTournamentLogo,
                          umpire1Name: settingUmpire1,
                          umpire1Photo: settingUmpire1Photo,
                          umpire2Name: settingUmpire2,
                          umpire2Photo: settingUmpire2Photo,
                          scoreboardManagerName: settingScorer,
                          scoreboardManagerPhoto: settingScorerPhoto,
                          commentatorName: settingCommentator,
                          commentatorPhoto: settingCommentatorPhoto,
                          youtubeChannelName: settingYoutubeName,
                          youtubeChannelLogo: settingYoutubeLogo,
                          prize1st: prize1,
                          prize2nd: prize2,
                          prize3rd: prize3,
                          prize4th: prize4,
                          updatedAt: Date.now()
                        }));
                        setShowSettingsModal(false);
                        showToast('✓ Officials, photos, YouTube branding & tournament settings saved!');
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
                    >
                      Save Officials & Branding
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Team Modal */}
      <AnimatePresence>
        {showTeamEditModal && selectedTeamForEdit && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTeamEditModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <Edit2 size={16} /> Edit Team Name
                </h3>
                <button
                  onClick={() => setShowTeamEditModal(false)}
                  className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                  Team Name (Group {selectedTeamForEdit.group} • Day {selectedTeamForEdit.group})
                </label>
                <input
                  type="text"
                  value={newTeamNameInput}
                  onChange={e => setNewTeamNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTeamEditModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const oldName = selectedTeamForEdit.name;
                    const newName = newTeamNameInput.trim();
                    if (!newName) return;

                    setTournament(prev => {
                      const updatedTeams = prev.teams.map(t => t.id === selectedTeamForEdit.id ? { ...t, name: newName } : t);
                      const updatedMatches = prev.matches.map(m => {
                        let tA = m.teamA;
                        let tB = m.teamB;
                        let win = m.winner;
                        if (tA === oldName) tA = newName;
                        if (tB === oldName) tB = newName;
                        if (win === oldName) win = newName;
                        return { ...m, teamA: tA, teamB: tB, winner: win };
                      });
                      return { ...prev, teams: updatedTeams, matches: updatedMatches };
                    });
                    setShowTeamEditModal(false);
                    showToast(`✓ Renamed team to ${newName}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
                >
                  Update Team
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Time Slot Edit Modal */}
      <AnimatePresence>
        {showTimeSlotEditModal && editingSlotMatch && (
          <TimeSlotEditModal
            match={editingSlotMatch}
            groundName={tournament.groundName}
            onClose={() => {
              setShowTimeSlotEditModal(false);
              setEditingSlotMatch(null);
            }}
            onSave={handleUpdateMatchSlot}
          />
        )}
      </AnimatePresence>

      {/* Auto Schedule Modal */}
      <AnimatePresence>
        {showAutoScheduleModal && (
          <AutoScheduleModal
            day={activeDay}
            tournament={tournament}
            onClose={() => setShowAutoScheduleModal(false)}
            onApplySlots={handleApplyDaySlots}
          />
        )}
      </AnimatePresence>

      {/* Batch Delay Modal */}
      <AnimatePresence>
        {showBatchDelayModal && (
          <BatchDelayModal
            day={activeDay}
            onClose={() => setShowBatchDelayModal(false)}
            onApplyDelay={handleApplyDayDelay}
          />
        )}
      </AnimatePresence>

      {/* Manual Matchup & Team Selection Modal (Team A vs Team B) */}
      <AnimatePresence>
        {showManualMatchupModal && (
          <ManualMatchupModal
            day={manualMatchupDay}
            tournament={tournament}
            onClose={() => setShowManualMatchupModal(false)}
            onSaveMatchups={handleSaveManualMatchups}
            showToast={showToast}
          />
        )}
      </AnimatePresence>

      {/* Local Teams Directory Import Modal */}
      <AnimatePresence>
        {showLocalDirectoryModal && (
          <LocalTeamsDirectoryModal
            tournament={tournament}
            onClose={() => setShowLocalDirectoryModal(false)}
            onImportTeam={(targetTeamId, importedTeam) => {
              setTournament(prev => {
                const oldTeam = prev.teams.find(t => t.id === targetTeamId);
                const oldName = oldTeam?.name;
                const newName = importedTeam.name || oldName || 'Team';
                const updatedTeams = prev.teams.map(t =>
                  t.id === targetTeamId ? { ...t, ...importedTeam, name: newName } : t
                );
                const updatedMatches = prev.matches.map(m => ({
                  ...m,
                  teamA: m.teamA === oldName ? newName : m.teamA,
                  teamB: m.teamB === oldName ? newName : m.teamB,
                  winner: m.winner === oldName ? newName : m.winner
                }));
                return { ...prev, teams: updatedTeams, matches: updatedMatches };
              });
              showToast(`✓ Imported ${importedTeam.name} into tournament!`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Captain Self-Service Squad Submission Modal */}
      <AnimatePresence>
        {showCaptainSubmissionModal && captainSubTeam && (
          <CaptainSquadSubmissionModal
            team={captainSubTeam}
            tournamentName={tournament.name}
            onClose={() => {
              setShowCaptainSubmissionModal(false);
              setCaptainSubTeam(null);
            }}
            onSubmitSquad={(updatedTeam) => {
              handleUpdateTeam(updatedTeam);
              setShowCaptainSubmissionModal(false);
              setCaptainSubTeam(null);
              showToast(`✓ Squad submitted for ${updatedTeam.name}!`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Full Match Scorecard Modal */}
      {showScorecardModal && selectedScorecardMatch && (
        <TournamentMatchScorecardModal
          isOpen={showScorecardModal}
          onClose={() => {
            setShowScorecardModal(false);
            setSelectedScorecardMatch(null);
          }}
          match={{
            id: selectedScorecardMatch.id,
            teamAId: selectedScorecardMatch.teamA,
            teamBId: selectedScorecardMatch.teamB,
            teamAName: selectedScorecardMatch.teamA,
            teamBName: selectedScorecardMatch.teamB,
            date: selectedScorecardMatch.date || '',
            time: selectedScorecardMatch.time || '08:30 AM',
            venue: selectedScorecardMatch.pitchVenue || tournament.groundName,
            status: (selectedScorecardMatch.status === 'completed' ? 'completed' : selectedScorecardMatch.status === 'live' ? 'live' : 'scheduled') as any,
            scoreA: selectedScorecardMatch.scoreA || '',
            scoreB: selectedScorecardMatch.scoreB || '',
            oversA: selectedScorecardMatch.oversA || `${tournament.overs}`,
            oversB: selectedScorecardMatch.oversB || `${tournament.overs}`,
            winnerId: selectedScorecardMatch.winner || null,
            winReason: selectedScorecardMatch.winReason || (selectedScorecardMatch.winner ? `${selectedScorecardMatch.winner} won` : ''),
            manOfTheMatch: selectedScorecardMatch.manOfTheMatch || '',
            stage: selectedScorecardMatch.label,
            umpire1: selectedScorecardMatch.umpire1 || tournament.umpire1Name,
            umpire2: selectedScorecardMatch.umpire2 || tournament.umpire2Name,
            scorer: selectedScorecardMatch.scorer || tournament.scoreboardManagerName,
            matchBannerUrl: selectedScorecardMatch.matchBannerUrl
          }}
          tournament={{
            name: tournament.name,
            format: `${tournament.overs} Overs`,
            customOvers: tournament.overs,
            teams: tournament.teams.map(t => ({
              id: t.name,
              name: t.name,
              logo: t.logo,
              players: (t.squad && t.squad.length > 0 ? t.squad : generateDefault15Squad(t.name, t.captain || `${t.name.split(' ')[0]} Skipper`)).map(p => p.name)
            }))
          }}
          onOpenAwardCertificates={() => {
            const m = selectedScorecardMatch;
            setShowScorecardModal(false);
            handleOpenMatchAwardCertificates(m, 'potm');
          }}
        />
      )}

      {/* Match VS Poster / Banner Studio Modal */}
      {showMatchBannerModal && selectedMatchForBanner && (
        <MatchBannerModal
          isOpen={showMatchBannerModal}
          onClose={() => {
            setShowMatchBannerModal(false);
            setSelectedMatchForBanner(null);
          }}
          match={{
            id: selectedMatchForBanner.id,
            teamAName: selectedMatchForBanner.teamA,
            teamBName: selectedMatchForBanner.teamB,
            date: selectedMatchForBanner.date || '',
            time: selectedMatchForBanner.time || '08:30 AM',
            venue: selectedMatchForBanner.pitchVenue || tournament.groundName,
            stage: selectedMatchForBanner.label,
            bannerUrl: selectedMatchForBanner.matchBannerUrl
          }}
          onSaveBanner={(bannerUrl) => {
            const targetId = selectedMatchForBanner.id;
            setTournament(prev => ({
              ...prev,
              matches: prev.matches.map(m => m.id === targetId ? { ...m, matchBannerUrl: bannerUrl } : m)
            }));
            showToast('✓ Custom Match Banner saved!');
          }}
        />
      )}

      {/* Match Award Certificates Modal */}
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

      {/* Public Spectator Share & QR Hub Modal */}
      {showPublicShareModal && (
        <TournamentPublicShareModal
          isOpen={showPublicShareModal}
          onClose={() => setShowPublicShareModal(false)}
          tournament={publicShareTournamentInput}
        />
      )}

      {/* Custom Prize Management Modal */}
      {showPrizeModal && (
        <PrizeManagementModal
          isOpen={showPrizeModal}
          onClose={() => setShowPrizeModal(false)}
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          initialPrizes={tournament.prizes || getTournamentPrizesByTournamentId(tournament.id)}
          onSave={(updatedPrizes) => {
            saveTournamentPrizesForTournament(tournament.id, updatedPrizes);
            const p1 = updatedPrizes.find((p) => p.category === 'tournament_1st');
            const p2 = updatedPrizes.find((p) => p.category === 'tournament_2nd');
            const p3 = updatedPrizes.find((p) => p.category === 'tournament_3rd');
            const p4 = updatedPrizes.find((p) => p.category === 'tournament_4th');
            const fmt = (p?: TournamentPrize, fallback?: string) =>
              p?.amount?.trim() ? `${p.currency || '₹'}${p.amount.trim()} + Trophy` : fallback || '';

            setTournament((prev) => ({
              ...prev,
              prizes: updatedPrizes,
              prize1st: fmt(p1, prev.prize1st),
              prize2nd: fmt(p2, prev.prize2nd),
              prize3rd: fmt(p3, prev.prize3rd),
              prize4th: fmt(p4, prev.prize4th),
            }));
            if (p1?.amount?.trim()) setPrize1(fmt(p1, prize1));
            if (p2?.amount?.trim()) setPrize2(fmt(p2, prize2));
            if (p3?.amount?.trim()) setPrize3(fmt(p3, prize3));
            if (p4?.amount?.trim()) setPrize4(fmt(p4, prize4));
            showToast(`✓ Saved ${updatedPrizes.length} tournament prizes & synced with scoreboard!`);
          }}
        />
      )}

      {/* Player Career & Cap Stats Modal */}
      {selectedCareerPlayer && (
        <CareerPlayerCardModal
          isOpen={!!selectedCareerPlayer}
          onClose={() => setSelectedCareerPlayer(null)}
          player={selectedCareerPlayer}
        />
      )}

      {/* Reset Tournament Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirmModal && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <RotateCcw size={16} /> Reset Entire 32-Team Tournament?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will reset all match scores and progression back to the initial 5-day 32-team schedule.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirmModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Randomize Groups Confirmation Modal */}
      <AnimatePresence>
        {showShuffleConfirmModal && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShuffleConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Shuffle size={16} /> Randomize 32 Teams Across 4 Groups?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will shuffle and re-assign all 32 teams evenly into Group 1 (Day 1), Group 2 (Day 2), Group 3 (Day 3), and Group 4 (Day 4).
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShuffleConfirmModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTournament(prev => {
                      const shuffled = [...prev.teams].sort(() => Math.random() - 0.5);
                      const updated = shuffled.map((t, idx) => ({
                        ...t,
                        group: (Math.floor(idx / 8) + 1) as 1 | 2 | 3 | 4
                      }));
                      return { ...prev, teams: updated };
                    });
                    setShowShuffleConfirmModal(false);
                    showToast('🎲 32 Teams shuffled across the 4 groups!');
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
                >
                  Shuffle Groups
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Tournament Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.85 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirmModal(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-rose-400">
                    Delete One-Half Tournament?
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold truncate max-w-[260px]">
                    {tournament.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This will permanently delete <strong className="text-white">{tournament.name}</strong>, remove all 32-team bracket progress and match records from the scoreboard & spectator hub, and clear cloud sync data.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteTournament}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Trash2 size={14} />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
};

// Sub-component for individual Match Cards in the bracket
interface MatchCardProps {
  match: OneHalfMatch;
  tournament: OneHalfTournamentState;
  highlightFinal?: boolean;
  onLaunchLive: (match: OneHalfMatch) => void;
  onQuickScore: () => void;
  onEditSlot: () => void;
  onOpenTeamPage?: (teamName: string) => void;
  onOpenManualMatchup?: () => void;
  onOpenScorecard?: () => void;
  onOpenBanner?: () => void;
  onOpenCertificates?: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  tournament,
  highlightFinal,
  onLaunchLive,
  onQuickScore,
  onEditSlot,
  onOpenTeamPage,
  onOpenManualMatchup,
  onOpenScorecard,
  onOpenBanner,
  onOpenCertificates
}) => {
  const isACompleted = match.status === 'completed';
  const isWinnerA = match.winner && match.winner === match.teamA;
  const isWinnerB = match.winner && match.winner === match.teamB;
  const isReadyToPlay =
    match.teamA &&
    match.teamB &&
    !match.teamA.startsWith('Winner') &&
    !match.teamB.startsWith('Winner') &&
    !match.teamA.startsWith('Day ') &&
    !match.teamB.startsWith('Day ') &&
    !match.teamA.startsWith('Loser') &&
    !match.teamB.startsWith('Loser');

  const badge = getStatusBadgeConfig(match.status, match.delayMins);

  return (
    <div className={`p-3.5 rounded-2xl border transition-all ${
      highlightFinal
        ? 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-rose-950/20 border-amber-500/40 shadow-md'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
    }`}>
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

      {/* Teams Display */}
      <div className="py-2 space-y-1.5">
        {/* Team A */}
        <div
          onClick={() => onOpenTeamPage && !match.teamA.startsWith('Winner') && !match.teamA.startsWith('Day ') && !match.teamA.startsWith('Loser') && onOpenTeamPage(match.teamA)}
          className={`flex items-center justify-between p-2 rounded-xl transition ${
            onOpenTeamPage && !match.teamA.startsWith('Winner') && !match.teamA.startsWith('Day ') && !match.teamA.startsWith('Loser') ? 'cursor-pointer hover:ring-1 hover:ring-emerald-500/40' : ''
          } ${
            isWinnerA
              ? 'bg-emerald-500/15 border border-emerald-500/30'
              : isACompleted && !isWinnerA
              ? 'opacity-60 bg-slate-50 dark:bg-slate-950'
              : 'bg-slate-50 dark:bg-slate-950'
          }`}
          title={onOpenTeamPage ? 'Click to view team squad and page' : undefined}
        >
          <div className="flex items-center gap-2 truncate">
            {isWinnerA ? (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500 shrink-0">A</span>
            )}
            <span className={`text-xs font-black truncate ${isWinnerA ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {match.teamA}
            </span>
          </div>
          {match.scoreA && (
            <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-300 shrink-0">
              {match.scoreA}
            </span>
          )}
        </div>

        {/* Team B */}
        <div
          onClick={() => onOpenTeamPage && !match.teamB.startsWith('Winner') && !match.teamB.startsWith('Day ') && !match.teamB.startsWith('Loser') && onOpenTeamPage(match.teamB)}
          className={`flex items-center justify-between p-2 rounded-xl transition ${
            onOpenTeamPage && !match.teamB.startsWith('Winner') && !match.teamB.startsWith('Day ') && !match.teamB.startsWith('Loser') ? 'cursor-pointer hover:ring-1 hover:ring-emerald-500/40' : ''
          } ${
            isWinnerB
              ? 'bg-emerald-500/15 border border-emerald-500/30'
              : isACompleted && !isWinnerB
              ? 'opacity-60 bg-slate-50 dark:bg-slate-950'
              : 'bg-slate-50 dark:bg-slate-950'
          }`}
          title={onOpenTeamPage ? 'Click to view team squad and page' : undefined}
        >
          <div className="flex items-center gap-2 truncate">
            {isWinnerB ? (
              <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-bold flex items-center justify-center text-slate-500 shrink-0">B</span>
            )}
            <span className={`text-xs font-black truncate ${isWinnerB ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {match.teamB}
            </span>
          </div>
          {match.scoreB && (
            <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-300 shrink-0">
              {match.scoreB}
            </span>
          )}
        </div>
      </div>

      {/* Winner announcement if finished */}
      {isACompleted && match.winner && (
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

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onLaunchLive(match)}
          disabled={!isReadyToPlay}
          className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition active:scale-95 border-none ${
            isReadyToPlay
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
          title="Score this match in Quick Scorer"
        >
          <Play size={11} />
          <span>Live Score</span>
        </button>

        <button
          type="button"
          onClick={onQuickScore}
          disabled={!isReadyToPlay}
          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition active:scale-95 border ${
            isReadyToPlay
              ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 cursor-pointer'
              : 'bg-slate-50 dark:bg-slate-850 text-slate-400 border-transparent cursor-not-allowed'
          }`}
          title="Manually enter score or winner"
        >
          {isACompleted ? 'Edit' : 'Quick'}
        </button>

        {/* Full Scorecard Modal Button */}
        {onOpenScorecard && (
          <button
            type="button"
            onClick={onOpenScorecard}
            className="p-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-500 border border-indigo-500/30 cursor-pointer transition active:scale-95"
            title="Open Full Match Scorecard & Summary"
          >
            <FileText size={12} />
          </button>
        )}

        {/* Match VS Poster / Banner Studio Button */}
        {onOpenBanner && (
          <button
            type="button"
            onClick={onOpenBanner}
            className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-500 border border-purple-500/30 cursor-pointer transition active:scale-95"
            title="Create / View VS Match Poster Banner"
          >
            <ImageIcon size={12} />
          </button>
        )}

        {/* Match Award Certificates Button */}
        {onOpenCertificates && (
          <button
            type="button"
            onClick={onOpenCertificates}
            className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 cursor-pointer transition active:scale-95"
            title="Generate Match Award Certificates (POTM, Best Batsman, Best Bowler)"
          >
            <Award size={12} />
          </button>
        )}

        {/* Manual Matchup Button for Round 1 Matches */}
        {match.round === 'round1' && onOpenManualMatchup && (
          <button
            type="button"
            onClick={onOpenManualMatchup}
            className="p-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 cursor-pointer transition active:scale-95"
            title="Manually Select Team A vs Team B for Round 1"
          >
            <ArrowLeftRight size={12} />
          </button>
        )}

        {/* Team Squad & Page Button */}
        {onOpenTeamPage && !match.teamA.startsWith('Winner') && !match.teamA.startsWith('Day ') && !match.teamA.startsWith('Loser') && (
          <button
            type="button"
            onClick={() => onOpenTeamPage(match.teamA)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition active:scale-95"
            title="View Team Squad & Dedicated Page"
          >
            <Users size={12} className="text-emerald-500" />
          </button>
        )}

        {/* Edit Time Slot Button */}
        <button
          type="button"
          onClick={onEditSlot}
          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition active:scale-95"
          title="Edit Match Time Slot & Reporting"
        >
          <Clock size={12} className="text-amber-500" />
        </button>

        {/* WhatsApp Captain Alert Button */}
        <a
          href={getCaptainAlertWhatsAppUrl(match, tournament)}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition active:scale-95 no-underline flex items-center justify-center"
          title="Send WhatsApp Match Reporting Notice to Captains"
        >
          <Send size={12} />
        </a>
      </div>
    </div>
  );
};
