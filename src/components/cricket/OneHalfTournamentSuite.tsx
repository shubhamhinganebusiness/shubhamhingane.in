import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy, Flame, Users, Calendar, MapPin, Zap, Check, CheckCircle2,
  Play, Share2, Award, Download, RefreshCw, ChevronRight, Edit2,
  Plus, AlertCircle, Shield, Sparkles, X, ChevronDown, RotateCcw, Crown, Medal,
  Clock, AlertTriangle, Send, ListOrdered, LayoutGrid, Coffee, Filter, CalendarCheck,
  ArrowLeftRight, Shuffle, UserCheck, FileText
} from 'lucide-react';
import { TournamentLiveScoreConfig } from './CricketTournamentTab';
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
  status: 'upcoming' | 'live' | 'completed' | 'delayed' | 'in_progress' | 'toss' | 'break' | 'abandoned';
  date?: string;
  time?: string;
  reportingTime?: string;
  slotDurationMins?: number;
  delayMins?: number;
  pitchVenue?: string;
  matchNotes?: string;
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
  const [viewMode, setViewMode] = useState<'bracket' | 'schedule' | 'all_days' | 'teams'>('bracket');
  const [selectedTeamIdForPage, setSelectedTeamIdForPage] = useState<string | null>(null);
  const [showManualMatchupModal, setShowManualMatchupModal] = useState(false);
  const [manualMatchupDay, setManualMatchupDay] = useState<1 | 2 | 3 | 4>(1);

  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [showTimeSlotEditModal, setShowTimeSlotEditModal] = useState(false);
  const [editingSlotMatch, setEditingSlotMatch] = useState<OneHalfMatch | null>(null);
  const [showBatchDelayModal, setShowBatchDelayModal] = useState(false);

  const [editingMatch, setEditingMatch] = useState<OneHalfMatch | null>(null);
  const [quickScoreA, setQuickScoreA] = useState('');
  const [quickScoreB, setQuickScoreB] = useState('');
  const [quickWinner, setQuickWinner] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tournamentTitle, setTournamentTitle] = useState(tournament.name);
  const [groundTitle, setGroundTitle] = useState(tournament.groundName);
  const [oversCount, setOversCount] = useState(tournament.overs);
  const [prize1, setPrize1] = useState(tournament.prize1st);
  const [prize2, setPrize2] = useState(tournament.prize2nd);
  const [prize3, setPrize3] = useState(tournament.prize3rd);
  const [prize4, setPrize4] = useState(tournament.prize4th);
  const [showTeamEditModal, setShowTeamEditModal] = useState(false);
  const [selectedTeamForEdit, setSelectedTeamForEdit] = useState<OneHalfTeam | null>(null);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Check URL query parameters for direct captain squad submission links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const teamId = params.get('teamId');

        if (action === 'submit_squad' && teamId) {
          setSelectedTeamIdForPage(teamId);
          setViewMode('teams');
        }
      } catch (_) {}
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

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
    } catch (_) {}
  }, [tournament]);

  // Propagate winners when a match concludes
  const updateMatchResult = (matchId: string, winnerName: string, scoreA?: string, scoreB?: string) => {
    setTournament(prev => {
      const updatedMatches = [...prev.matches];
      const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
      if (matchIndex === -1) return prev;

      const m = { ...updatedMatches[matchIndex] };
      m.winner = winnerName;
      m.status = 'completed';
      if (scoreA !== undefined) m.scoreA = scoreA;
      if (scoreB !== undefined) m.scoreB = scoreB;
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

      return {
        ...prev,
        matches: updatedMatches
      };
    });
  };

  // Launch live scoring in quick scorer
  const handleLaunchLiveScorer = (match: OneHalfMatch) => {
    if (!match.teamA || !match.teamB || match.teamA.startsWith('Winner') || match.teamB.startsWith('Winner') || match.teamA.startsWith('Day ') || match.teamB.startsWith('Day ')) {
      showToast('⚠️ Both teams must be qualified/determined before starting live scoring!');
      return;
    }

    const teamAObj = tournament.teams.find(t => t.name === match.teamA);
    const teamBObj = tournament.teams.find(t => t.name === match.teamB);

    if (onStartLiveScore) {
      onStartLiveScore({
        teamA: match.teamA,
        teamB: match.teamB,
        overs: tournament.overs || 8,
        customRules: `One-Half 32-Team Tournament | Day ${match.day} | ${match.label}`,
        tournamentId: tournament.id,
        matchId: match.id,
        tournamentName: tournament.name,
        groundName: tournament.groundName,
        venue: tournament.groundName,
        seriesName: `${tournament.name} (Day ${match.day})`,
        teamASquad: teamAObj?.squad?.map(p => ({
          name: p.name,
          isCaptain: p.isCaptain,
          isWicketKeeper: p.isWicketKeeper,
          role: p.role,
          jerseyNumber: p.jerseyNumber
        })),
        teamBSquad: teamBObj?.squad?.map(p => ({
          name: p.name,
          isCaptain: p.isCaptain,
          isWicketKeeper: p.isWicketKeeper,
          role: p.role,
          jerseyNumber: p.jerseyNumber
        })),
        teamACaptain: teamAObj?.captain,
        teamBCaptain: teamBObj?.captain,
        onSave: (res) => {
          updateMatchResult(
            match.id,
            res.winner,
            `${res.runsA}/${res.wicketsA}`,
            `${res.runsB}/${res.wicketsB}`
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
    if (window.confirm('Are you sure you want to reset this 32-Team One-Half Tournament? All match results and brackets will be reset.')) {
      const fresh = createInitialOneHalfTournament(tournament.name);
      setTournament(fresh);
      showToast('🔄 Tournament reset to initial 32-team schedule.');
    }
  };

  // Get current day's matches
  const dayMatches = tournament.matches.filter(m => m.day === activeDay);

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

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-rose-700 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-amber-400/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
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

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Trophy className="text-amber-300 shrink-0" size={32} />
              {tournament.name}
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 font-medium max-w-2xl leading-relaxed">
              <strong>One-Half Tournament Rule:</strong> 32 teams divided into 4 groups (8 teams/day). Each day, 8 teams play knockout rounds until 1 team qualifies for Day 5 Semis. On Day 5, the 4 group qualifiers play Semi-Finals, 3rd/4th prize match, and Grand Final!
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold text-white/80 pt-1">
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-amber-300" />
                {tournament.groundName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Zap size={13} className="text-amber-300" />
                {tournament.overs} Overs Match
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg transition active:scale-95 border-none cursor-pointer"
            >
              <Share2 size={14} />
              Share WhatsApp
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 backdrop-blur-md transition active:scale-95 border border-white/20 cursor-pointer"
            >
              <Edit2 size={14} />
              Edit Details
            </button>
            <button
              onClick={handleResetTournament}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl transition border border-white/10 cursor-pointer"
              title="Reset tournament"
            >
              <RotateCcw size={16} />
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
      </div>

      {/* 5-Day Switcher Tabs */}
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

      {/* Main Content Area based on View Mode and Active Day */}
      {viewMode === 'teams' ? (
        <TeamDedicatedPageView
          team={tournament.teams.find(t => t.id === selectedTeamIdForPage) || tournament.teams[0]}
          tournament={tournament}
          onUpdateTeam={handleUpdateTeam}
          onSelectAnotherTeam={(id) => setSelectedTeamIdForPage(id)}
          onStartLiveMatchWithSquad={handleStartLiveWithTeamSquad}
          onBackToBracket={() => setViewMode('bracket')}
          showToast={showToast}
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
                    setQuickWinner(match.winner || match.teamA);
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
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
                    setQuickWinner(match.winner || match.teamA);
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
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
                    setQuickWinner(match.winner || match.teamA);
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
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
                    setQuickWinner(match.winner || match.teamA);
                  }}
                  onEditSlot={() => {
                    setEditingSlotMatch(match);
                    setShowTimeSlotEditModal(true);
                  }}
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
                      setQuickWinner(match.winner || match.teamA);
                    }}
                    onEditSlot={() => {
                      setEditingSlotMatch(match);
                      setShowTimeSlotEditModal(true);
                    }}
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
                      setQuickWinner(match.winner || match.teamA);
                    }}
                    onEditSlot={() => {
                      setEditingSlotMatch(match);
                      setShowTimeSlotEditModal(true);
                    }}
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
          <button
            onClick={() => {
              if (window.confirm('Shuffle and re-assign 32 teams into 4 groups?')) {
                setTournament(prev => {
                  const shuffled = [...prev.teams].sort(() => Math.random() - 0.5);
                  const updated = shuffled.map((t, idx) => ({
                    ...t,
                    group: (Math.floor(idx / 8) + 1) as 1 | 2 | 3 | 4
                  }));
                  return { ...prev, teams: updated };
                });
                showToast('🎲 32 Teams shuffled across the 4 groups!');
              }
            }}
            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-none cursor-pointer transition shrink-0"
          >
            🎲 Randomize Groups
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[1, 2, 3, 4].map(grp => (
            <div key={grp} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Group {grp} (Day {grp})
              </span>
              <div className="space-y-1">
                {tournament.teams.filter(t => t.group === grp).map(t => (
                  <div
                    key={t.id}
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
              className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Edit2 size={16} /> Update Match Result
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
                {/* Team A Score */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    {editingMatch.teamA} Score (e.g. 74/3)
                  </label>
                  <input
                    type="text"
                    value={quickScoreA}
                    onChange={e => setQuickScoreA(e.target.value)}
                    placeholder="e.g. 82/4"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Team B Score */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    {editingMatch.teamB} Score (e.g. 68/6)
                  </label>
                  <input
                    type="text"
                    value={quickScoreB}
                    onChange={e => setQuickScoreB(e.target.value)}
                    placeholder="e.g. 76/7"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
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
                      updateMatchResult(editingMatch.id, quickWinner, quickScoreA, quickScoreB);
                      setEditingMatch(null);
                      showToast(`✓ Result updated! ${quickWinner} advances.`);
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
              className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Edit2 size={16} /> Tournament Settings & Prizes
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 font-sans">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tournament Title</label>
                  <input
                    type="text"
                    value={tournamentTitle}
                    onChange={e => setTournamentTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Ground / Venue</label>
                  <input
                    type="text"
                    value={groundTitle}
                    onChange={e => setGroundTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Overs per Match</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={oversCount}
                    onChange={e => setOversCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-amber-400 block">Prizes Configuration</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">1st Prize</label>
                      <input
                        type="text"
                        value={prize1}
                        onChange={e => setPrize1(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">2nd Prize</label>
                      <input
                        type="text"
                        value={prize2}
                        onChange={e => setPrize2(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">3rd Prize</label>
                      <input
                        type="text"
                        value={prize3}
                        onChange={e => setPrize3(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-slate-400 block mb-1">4th Prize</label>
                      <input
                        type="text"
                        value={prize4}
                        onChange={e => setPrize4(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
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
                      setTournament(prev => ({
                        ...prev,
                        name: tournamentTitle,
                        groundName: groundTitle,
                        overs: oversCount,
                        prize1st: prize1,
                        prize2nd: prize2,
                        prize3rd: prize3,
                        prize4th: prize4
                      }));
                      setShowSettingsModal(false);
                      showToast('✓ Tournament settings saved!');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
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
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  tournament,
  highlightFinal,
  onLaunchLive,
  onQuickScore,
  onEditSlot,
  onOpenTeamPage,
  onOpenManualMatchup
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
        <div className="pb-1.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Trophy size={11} className="text-amber-500 shrink-0" />
          <span className="truncate">Winner: {match.winner}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5">
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
