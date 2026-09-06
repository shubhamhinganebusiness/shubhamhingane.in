import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Plus, Calendar, MapPin, Users, Edit, Trash2, Bot, HelpCircle, 
  Sparkles, Check, Play, ChevronRight, BarChart3, AlertCircle, Share2, Award, RefreshCw, Download, ArrowLeftRight
} from 'lucide-react';
import { db, isFirestoreQuotaExhausted, isQuotaError, recordFirestoreQuotaExhaustion } from '../../lib/firebase';
import { doc, setDoc, deleteDoc, updateDoc, collection, onSnapshot } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../AuthContext';
import { TournamentVenueScheduler, TeamWithRoster } from './TournamentVenueScheduler';
import { TournamentStatsAndLeaderboards } from './TournamentStatsAndLeaderboards';
import { PointsTableModule } from './PointsTableModule';
import { LiveStandingsSummaryWidget } from './LiveStandingsSummaryWidget';

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
}

export const CricketTournamentTab: React.FC<{
  onStartLiveScore?: (teamA: string, teamB: string, overs: number, customRules: string | undefined, tournamentId: string, matchId: string, onSave: (result: { runsA: number, wicketsA: number, runsB: number, wicketsB: number, winner: string, winReason: string }) => void) => void;
}> = ({ onStartLiveScore }) => {
  const { user } = useAuth();
  
  // Custom non-blocking interactive confirmation dialog state per environment-safe guidelines
  const [tournamentToDeleteState, setTournamentToDeleteState] = useState<{ id: string; name: string } | null>(null);

  // Core tournament state list
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    try {
      const saved = localStorage.getItem('gully_tournaments_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('LocalStorage gully_tournaments_v1 read blocked:', e);
      return [];
    }
  });

  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('gully_active_tournament_id');
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

  // Current active tournament details tab
  const [tourTab, setTourTab] = useState<'teams' | 'matches' | 'standings' | 'venue-scheduler' | 'stats-leaderboards' | 'ai-insights'>('teams');
  
  // Standings view subtab (Live championship standings vs Sandbox/Simulator points table module)
  const [standingsTabMode, setStandingsTabMode] = useState<'live' | 'sandbox'>('live');
  const [h2hTeam1Id, setH2hTeam1Id] = useState<string>('');
  const [h2hTeam2Id, setH2hTeam2Id] = useState<string>('');

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

  // Team editor state
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [teamFormName, setTeamFormName] = useState('');
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

  // Manual Match Scheduling Modal
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [showResetScheduleModal, setShowResetScheduleModal] = useState(false); // Reset schedule modal state
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null); // Custom confirmation state for team deletion
  const [manualMatchTeamAId, setManualMatchTeamAId] = useState('');
  const [manualMatchTeamBId, setManualMatchTeamBId] = useState('');
  const [manualMatchDate, setManualMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualMatchTime, setManualMatchTime] = useState('10:00 AM');
  const [manualMatchVenue, setManualMatchVenue] = useState('Shivaji Maharaj Ground (Turf)');
  const [manualMatchStage, setManualMatchStage] = useState('League');

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

  // Load and sync tournaments with Firestore in a loop-proof way
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cricket_tournaments'), (snap) => {
      const dbList: Tournament[] = [];
      snap.forEach((docSnap) => {
        dbList.push({ ...docSnap.data() as Tournament, id: docSnap.id });
      });

      setTournaments((prev) => {
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
          if (!filteredMerged.some(m => m.id === localT.id)) {
            filteredMerged.push(localT);
          }
        });

        // If lengths are different, there is definitely a state desynchronization
        if (prev.length !== filteredMerged.length) {
          return filteredMerged;
        }

        // Deep semantic comparison for each tournament including nested match logs
        const isDiff = filteredMerged.some((newT) => {
          const oldT = prev.find(p => p.id === newT.id);
          if (!oldT) return true;
          if (oldT.name !== newT.name) return true;
          if (oldT.status !== newT.status) return true;
          if (oldT.winnerTeamName !== newT.winnerTeamName) return true;
          if ((oldT.teams || []).length !== (newT.teams || []).length) return true;
          if ((oldT.matches || []).length !== (newT.matches || []).length) return true;
          
          // Deep verification of match items to immediately render score updates live
          const oldMatches = oldT.matches || [];
          const newMatches = newT.matches || [];
          for (let k = 0; k < newMatches.length; k++) {
            const om = oldMatches[k];
            const nm = newMatches[k];
            if (!om || !nm) return true;
            if (om.id !== nm.id) return true;
            if (om.status !== nm.status) return true;
            if (om.scoreA !== nm.scoreA) return true;
            if (om.scoreB !== nm.scoreB) return true;
            if (om.oversA !== nm.oversA) return true;
            if (om.oversB !== nm.oversB) return true;
            if (om.winnerId !== nm.winnerId) return true;
            if (om.winReason !== nm.winReason) return true;
            if (om.manOfTheMatch !== nm.manOfTheMatch) return true;
          }
          return false;
        });

        return isDiff ? filteredMerged : prev;
      });
    }, (error) => {
      console.warn("Failed to subscribe to tournaments in firestore:", error);
    });
    return () => unsub();
  }, []);

  // Persistence side-effect - saves locally AND archives directly in Firestore
  useEffect(() => {
    try {
      localStorage.setItem('gully_tournaments_v1', JSON.stringify(tournaments));
    } catch (e) {
      console.warn('LocalStorage gully_tournaments_v1 write blocked:', e);
    }
    if (isFirestoreQuotaExhausted()) return;
    tournaments.forEach((t) => {
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

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);

  // Notification notification system
  const triggerNotification = (msg: string) => {
    setAiNotification(msg);
    setTimeout(() => setAiNotification(null), 3000);
  };

  const handleImageUpload = (file: File, callback: (base64Str: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
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
      teams: [],
      matches: [],
      winnerTeamName: null,
      createdBy: user?.email || user?.uid || 'anonymous'
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
    triggerNotification(`Created tournament "${newTour.name}"!`);
  };

  const deleteTournament = (id: string, name: string) => {
    // Initiate non-blocking environment-compliant custom dialog trigger
    setTournamentToDeleteState({ id, name });
  };

  const confirmDeleteTournament = (id: string, name: string) => {
    setTournaments(tournaments.filter(t => t.id !== id));
    if (activeTournamentId === id) {
      setActiveTournamentId(null);
    }
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
  };

  const saveQuickEditMatchUpdate = () => {
    if (!activeTournamentId || !quickEditMatch) return;

    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return {
        ...t,
        matches: t.matches.map(m => 
          m.id === quickEditMatch.id 
            ? { ...m, date: quickEditDate, time: quickEditTime, venue: quickEditVenue, status: quickEditStatus }
            : m
        )
      };
    }));

    setQuickEditMatch(null);
    triggerNotification("Match details updated successfully!");
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
        if (t.teams.length >= t.teamCount) {
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
            venue: "Local gully stadium",
            status: 'scheduled',
            scoreA: "",
            scoreB: "",
            oversA: "",
            oversB: "",
            winnerId: null,
            winReason: "",
            manOfTheMatch: "",
            stage: 'League'
          });
        }
      }

      setTournaments(tournaments.map(t => {
        if (t.id !== activeTournamentId) return t;
        return {
          ...t,
          matches,
          status: 'active'
        };
      }));

      triggerNotification(`Round-robin schedule created! (${matches.length} matches)`);
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
          venue: "Pitch 1 Ground",
          status: shuffled[0] && shuffled[1] ? 'scheduled' : 'scheduled',
          scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "",
          stage: 'Semi-Final'
        });

        matches.push({
          id: `match_sf2_${Date.now()}`,
          teamAId: shuffled[2]?.id || "",
          teamBId: shuffled[3]?.id || "BYE",
          teamAName: shuffled[2]?.name || "Qualifier C",
          teamBName: shuffled[3]?.name || "BYE (Auto Proceed)",
          date: activeTournament.startDate,
          time: "02:00 PM",
          venue: "Pitch 1 Ground",
          status: shuffled[2] && shuffled[3] ? 'scheduled' : 'completed',
          scoreA: shuffled[2] ? "Auto" : "", 
          scoreB: "", 
          oversA: "", 
          oversB: "", 
          winnerId: shuffled[2] ? shuffled[2].id : null, 
          winReason: shuffled[2] ? "BYE - Automatic Walkover" : "", 
          manOfTheMatch: "",
          stage: 'Semi-Final'
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
          venue: "Grand Arena",
          status: 'scheduled',
          scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "",
          stage: 'Final'
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
            venue: "Gully Pitch A",
            status: tA && tB ? 'scheduled' : 'completed',
            scoreA: tA ? "Auto" : "", scoreB: "", oversA: "", oversB: "", 
            winnerId: tA ? tA.id : null, winReason: tA ? "Advancement via Bye" : "", manOfTheMatch: "",
            stage: 'Quarter-Final'
          });
        }

        // SF shells
        matches.push({ id: `match_sf1_${Date.now()}`, teamAId: "", teamBId: "", teamAName: "Winner of QF 1", teamBName: "Winner of QF 2", date: activeTournament.startDate, time: "11:00 AM", venue: "Pitch A", status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "", stage: 'Semi-Final' });
        matches.push({ id: `match_sf2_${Date.now()}`, teamAId: "", teamBId: "", teamAName: "Winner of QF 3", teamBName: "Winner of QF 4", date: activeTournament.startDate, time: "02:00 PM", venue: "Pitch B", status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "", stage: 'Semi-Final' });
        
        // Final shell
        matches.push({ id: `match_f_${Date.now()}`, teamAId: "", teamBId: "", teamAName: "Winner of SF 1", teamBName: "Winner of SF 2", date: activeTournament.startDate, time: "04:00 PM", venue: "Championship Ground", status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "", manOfTheMatch: "", stage: 'Final' });
      }

      setTournaments(tournaments.map(t => {
        if (t.id !== activeTournamentId) return t;
        return {
          ...t,
          matches,
          status: 'active'
        };
      }));

      triggerNotification(`Knockout bracket constructed!`);
      setTourTab('matches');
    }
  };

  // Launch schedule editing modal
  const startEditSchedule = (m: TournamentMatch) => {
    setEditingScheduleMatch(m);
    setSchedDate(m.date);
    setSchedTime(m.time);
    setSchedVenue(m.venue);
  };

  const saveScheduleUpdate = () => {
    if (!activeTournamentId || !editingScheduleMatch) return;

    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return {
        ...t,
        matches: t.matches.map(m => 
          m.id === editingScheduleMatch.id 
            ? { ...m, date: schedDate, time: schedTime, venue: schedVenue }
            : m
        )
      };
    }));

    setEditingScheduleMatch(null);
    triggerNotification("Match schedule updated!");
  };

  const handleCreateManualMatch = () => {
    if (!activeTournamentId || !activeTournament) return;
    if (!manualMatchTeamAId || !manualMatchTeamBId) {
      alert("Please select both teams!");
      return;
    }
    if (manualMatchTeamAId === manualMatchTeamBId) {
      alert("A team cannot play against itself!");
      return;
    }

    const teamAName = activeTournament.teams.find(t => t.id === manualMatchTeamAId)?.name || 'Team A';
    const teamBName = activeTournament.teams.find(t => t.id === manualMatchTeamBId)?.name || 'Team B';

    const newMatch: TournamentMatch = {
      id: `match_${Date.now()}`,
      teamAId: manualMatchTeamAId,
      teamBId: manualMatchTeamBId,
      teamAName,
      teamBName,
      date: manualMatchDate,
      time: manualMatchTime,
      venue: manualMatchVenue,
      status: 'scheduled',
      scoreA: '',
      scoreB: '',
      oversA: '',
      oversB: '',
      winnerId: null,
      winReason: '',
      manOfTheMatch: '',
      stage: manualMatchStage
    };

    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return {
        ...t,
        status: t.status === 'setup' ? 'active' : t.status,
        matches: [...t.matches, newMatch]
      };
    }));

    setShowCreateMatchModal(false);
    triggerNotification("Match scheduled manually!");
  };

  const handleEditTournament = () => {
    if (!activeTournamentId) return;
    if (!editTourName.trim()) {
      alert("Championship name is required");
      return;
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
        logo: editTourLogo
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

    const nextMatches = activeTournament.matches.map(m => {
      if (m.id !== updatingMatch.id) return m;
      return {
        ...m,
        scoreA: matchScoreA,
        scoreB: matchScoreB,
        oversA: matchOversA,
        oversB: matchOversB,
        winnerId: matchWinnerId,
        winReason: matchWinReason,
        manOfTheMatch: matchMoM,
        status: 'completed' as const
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
    
    if (activeTournament.type === 'knockout') {
      const finalM = nextMatches.find(m => m.stage === 'Final');
      if (finalM && finalM.status === 'completed') {
        tournamentCompleted = true;
        mainWinner = activeTournament.teams.find(t => t.id === finalM.winnerId)?.name || 'Unknown Champion';
      }
    } else {
      // For league, if all matches are completed, set completed
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

    // Prepare the updated tournament data
    const updatedTournamentData = {
      ...activeTournament,
      matches: nextMatches,
      status: tournamentCompleted ? 'completed' : activeTournament.status,
      winnerTeamName: tournamentCompleted ? mainWinner : activeTournament.winnerTeamName
    };

    // Update local state first for immediate UI responsiveness
    setTournaments(tournaments.map(t => {
      if (t.id !== activeTournamentId) return t;
      return updatedTournamentData;
    }));

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

  // Helper calculation to compute Points Table
  const computePointsTable = (teams: TournamentTeam[], matches: TournamentMatch[]) => {
    const table: Record<string, { id: string, name: string, captain: string, played: number, won: number, lost: number, tied: number, points: number, runsScored: number, runsConceded: number, oversFaced: number, oversBowled: number, NRR: number }> = {};
    
    teams.forEach(t => {
      table[t.id] = {
        id: t.id,
        name: t.name,
        captain: t.captain,
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

    const defaultOvers = activeTournament ? (activeTournament.customOvers || (activeTournament.format === 'T20' ? 20 : (activeTournament.format === 'ODI' ? 50 : 10))) : 10;

    matches.forEach(m => {
      if (m.status !== 'completed' || m.stage !== 'League') return;
      
      const tA = table[m.teamAId];
      const tB = table[m.teamBId];

      if (!tA || !tB) return;

      tA.played += 1;
      tB.played += 1;

      // Parse runs scored to compute actual net run rates
      // Format support: "120/4" or "120" => runs = 120
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

    // Calculate NRR: (Runs scored per over) - (Runs conceded per over)
    return Object.values(table).map(t => {
      const scoredAvg = t.oversFaced > 0 ? (t.runsScored / t.oversFaced) : 0;
      const concededAvg = t.oversBowled > 0 ? (t.runsConceded / t.oversBowled) : 0;
      t.NRR = Number((scoredAvg - concededAvg).toFixed(3));
      return t;
    }).sort((a,b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.NRR - a.NRR;
    });
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
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setNewTourName("Gully Premier League");
                setNewTourTeamCount(4);
                setNewTourType('league');
                setShowCreateModal(true);
              }}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-black uppercase text-xs tracking-wider cursor-pointer shadow-md"
            >
              Launch Quick 4-Team League
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
                        <span>{t.teams.length} teams</span>
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
                  <span>Teams Count Limit: <strong className="text-emerald-400 font-black">{activeTournament.teams.length}/{activeTournament.teamCount} registered</strong></span>
                </p>
                
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide mt-1">
                  Commenced on {activeTournament.startDate}
                </p>

                {activeTournament.customRules && (
                  <div className="mt-2.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl max-w-lg text-[9px] uppercase tracking-wide font-bold text-indigo-300 flex items-start gap-1.5 animate-fade-in z-10 relative">
                    <span className="font-extrabold text-indigo-400 shrink-0">📜 Tour Rules:</span>
                    <span className="text-slate-305 normal-case tracking-normal font-semibold leading-relaxed text-left select-text">{activeTournament.customRules}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel: Edit & Delete Tournament */}
            <div className="flex flex-wrap gap-2 z-10 shrink-0">
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
                  setShowEditTourModal(true);
                }}
                className="px-4.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-2xl font-black text-[9px] uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all shadow-md"
              >
                <Edit size={12} /> Edit settings
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
              <span>Teams ({activeTournament.teams.length}/{activeTournament.teamCount})</span>
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
              <span>Fixtures ({activeTournament.matches.length})</span>
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
          </div>

          {/* TEAMS SUBTAB */}
          {tourTab === 'teams' && (
            <div className="space-y-6 team-management-panel">

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Registered Squads</h3>
                  <p className="text-2xs text-slate-400 font-bold uppercase mt-1">Manage players, captain assignments, and team rosters.</p>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  {activeTournament.status === 'setup' && activeTournament.teams.length === 0 && (
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

                  {activeTournament.teams.length < activeTournament.teamCount && (
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

                  {activeTournament.teams.length >= 2 && activeTournament.status === 'setup' && (
                    <button
                      onClick={generateSchedule}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl border-none font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Trophy size={14} /> Auto-Generate Schedule
                    </button>
                  )}
                </div>
              </div>

              {activeTournament.teams.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold uppercase">No teams registered yet.</p>
                  <p className="text-2xs font-medium text-slate-400">Click "Add Squad" to import local gully teams into this tournament.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTournament.teams.map(team => (
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
                                  key={idx}
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">Tournament Fixtures</h3>
                  <p className="text-2xs text-slate-400 font-bold uppercase mt-1">Schedule date/venues, track live progress, and update winner match cards.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeTournament.teams.length < 2) {
                        alert("Please register at least 2 teams before scheduling matches!");
                        return;
                      }
                      setManualMatchTeamAId(activeTournament.teams[0].id);
                      setManualMatchTeamBId(activeTournament.teams[1].id);
                      setManualMatchDate(new Date().toISOString().split('T')[0]);
                      setManualMatchTime('10:00 AM');
                      setManualMatchVenue('Shivaji Maharaj Ground (Turf)');
                      setManualMatchStage('League');
                      setShowCreateMatchModal(true);
                    }}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 font-black uppercase text-[10px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus size={12} /> Schedule Manually
                  </button>

                  {activeTournament.matches.length > 0 && (
                    <button
                      onClick={() => setShowResetScheduleModal(true)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 font-black uppercase text-[10px] cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Trash2 size={12} /> Reset Schedule
                    </button>
                  )}
                </div>
              </div>

              {activeTournament.matches.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                  <Calendar size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold uppercase">No matches configured.</p>
                  <p className="text-2xs font-medium text-slate-400">Add teams first, then generate the round-robin or knockout match schedule registry.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTournament.matches.map(m => {
                    const isUpcoming = m.status === 'scheduled';
                    const isLive = m.status === 'live';
                    const isCompleted = m.status === 'completed';

                    const teamAObj = activeTournament.teams.find(t => t.id === m.teamAId || t.name === m.teamAName);
                    const teamBObj = activeTournament.teams.find(t => t.id === m.teamBId || t.name === m.teamBName);
                    const teamALogo = teamAObj?.logo;
                    const teamBLogo = teamBObj?.logo;

                    return (
                      <div 
                        key={m.id}
                        className={`bg-white dark:bg-slate-900 border rounded-[2rem] p-5 shadow-sm transition-all md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-300 dark:hover:border-emerald-900 ${
                          isLive ? 'border-amber-400 dark:border-amber-500/40 bg-amber-500/5' : 'border-slate-100 dark:border-slate-800'
                        }`}
                      >
                        {/* Match basic scheduling info */}
                        <div className="space-y-2 text-left">
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
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Completed ✅
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-bold uppercase inline-flex items-center gap-1">
                              <Calendar size={11} /> {m.date} | {m.time}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase inline-flex items-center gap-1">
                              <MapPin size={11} /> {m.venue}
                            </span>
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
                                  <span className="text-xs font-mono font-bold text-slate-400">{m.scoreA} ({m.oversA} ov)</span>
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
                                  <span className="text-xs font-mono font-bold text-slate-400">{m.scoreB} ({m.oversB} ov)</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Winner display message */}
                          {isCompleted && m.winReason && (
                            <div className="p-2.5 px-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 inline-flex items-center gap-1.5">
                              <Award size={13} className="text-amber-500" />
                              <span>{m.winReason}. MoM: {m.manOfTheMatch || 'N/A'}</span>
                            </div>
                          )}
                        </div>

                        {/* Controls/Trigger buttons */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
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

                          {isUpcoming && onStartLiveScore && m.teamAId !== "" && m.teamBId !== "" && (
                            <button
                              onClick={() => {
                                onStartLiveScore(m.teamAName, m.teamBName, activeTournament.format === 'T20' ? 20 : 10, activeTournament.customRules, activeTournamentId, m.id, (res) => {
                                  // Live Score completed callback
                                  setTournaments(tournaments.map(t => {
                                    if (t.id !== activeTournamentId) return t;
                                    return {
                                      ...t,
                                      matches: t.matches.map(matchObj => {
                                        if (matchObj.id !== m.id) return matchObj;
                                        return {
                                          ...matchObj,
                                          scoreA: `${res.runsA}/${res.wicketsA}`,
                                          scoreB: `${res.runsB}/${res.wicketsB}`,
                                          oversA: "10", // standard default ov
                                          oversB: "10",
                                          winnerId: res.winner === m.teamAName ? m.teamAId : m.teamBId,
                                          winReason: res.winReason,
                                          manOfTheMatch: "Live Performer",
                                          status: 'completed' as const
                                        };
                                      })
                                    };
                                  }));
                                  triggerNotification("Match result synchronized from live score!");
                                });
                              }}
                              className="px-3.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl border-none font-bold text-[9px] uppercase tracking-wider cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <Play size={11} /> Score Live
                            </button>
                          )}

                          {isCompleted && (
                            <button
                              onClick={() => generateMatchReportPDF(m)}
                              className="px-3.5 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 rounded-xl font-bold text-[10px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                              title="Download structured PDF Scorecard"
                            >
                              <Download size={11} /> Download Report
                            </button>
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
                  })}
                </div>
              )}
            </div>
          )}

          {/* POINTS TABLE SUBTAB (LEAGUE STYLE) */}
          {tourTab === 'standings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/15">
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">
                    {standingsTabMode === 'sandbox' 
                      ? 'Interactive Points Table Sandbox' 
                      : activeTournament.type === 'knockout' 
                        ? 'Knockout Stage Brackets' 
                        : 'Championship Points Standings'}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase mt-1">
                    {standingsTabMode === 'sandbox'
                      ? 'Simulate fixtures & play with preloaded stats on the fly.'
                      : activeTournament.type === 'knockout' 
                        ? 'Interactive visual flow chart of advancing qualified squads.' 
                        : 'Aggressive league leaderboards mapped dynamically.'}
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
                      <span>Live Standings</span>
                    </button>

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

                  {activeTournament.type === 'league' && standingsTabMode === 'live' && (
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
              ) : activeTournament.type === 'league' ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[700px] points-table-component">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                          <th className="py-4 px-4 text-center">Rank</th>
                          <th className="py-4 px-4">Squad Name</th>
                          <th className="py-4 px-4 text-center">Played</th>
                          <th className="py-4 px-4 text-center">Won</th>
                          <th className="py-4 px-4 text-center">Lost</th>
                          <th className="py-4 px-4 text-center">Tied</th>
                          <th className="py-4 px-4 text-center text-emerald-500 dark:text-emerald-400">Pts</th>
                          <th className="py-4 px-4 text-center cursor-help relative group">
                            <div className="flex items-center justify-center gap-1">
                              <span>Net Runrate</span>
                              <HelpCircle size={11} className="text-slate-450 dark:text-slate-500 group-hover:text-emerald-555 transition-colors" />
                            </div>
                            {/* General NRR formula explanation tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 shadow-2x w-64 text-left z-50 normal-case select-none">
                              <p className="font-extrabold text-[10px] text-emerald-400 mb-1">NRR FORMULA</p>
                              <p className="text-[10px] text-slate-300 leading-normal font-semibold">
                                (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
                              </p>
                              <div className="text-[8.5px] text-slate-400 mt-1 font-medium leading-relaxed">
                                Calculated across all completed league matches in this tournament. Overs are calculated under a flat standard 10 overs per match scale.
                              </div>
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <AnimatePresence mode="popLayout">
                        <tbody>
                          {computePointsTable(activeTournament.teams, activeTournament.matches).map((row, idx) => {
                            const oversFaced = row.oversFaced;
                            const oversBowled = row.oversBowled;
                            const scoredAvg = oversFaced > 0 ? (row.runsScored / oversFaced) : 0;
                            const concededAvg = oversBowled > 0 ? (row.runsConceded / oversBowled) : 0;
                            return (
                              <motion.tr 
                                layout
                                key={row.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ type: 'spring', stiffness: 350, damping: 25, opacity: { duration: 0.2 } }}
                                className={`border-b border-slate-50 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-all ${
                                  idx < 2 ? 'bg-emerald-500/5' : ''
                                }`}
                              >
                                <td className="py-4 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                                <td className="py-4 px-4">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-slate-800 dark:text-white">{row.name}</span>
                                    <span className="text-[9px] text-slate-400 lowercase font-medium">Captain: {row.captain || 'None'}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-center text-slate-500">{row.played}</td>
                                <td className="py-4 px-4 text-center text-emerald-600 dark:text-emerald-400">{row.won}</td>
                                <td className="py-4 px-4 text-center text-rose-500">{row.lost}</td>
                                <td className="py-4 px-4 text-center text-slate-500">{row.tied}</td>
                                <td className="py-4 px-4 text-center font-black text-emerald-500 text-sm">{row.points}</td>
                                <td className="py-4 px-4 text-center font-mono font-medium text-slate-500 relative group cursor-help">
                                  <span className="border-b border-dotted border-slate-300 dark:border-slate-700">
                                    {row.NRR > 0 ? `+${row.NRR}` : row.NRR}
                                  </span>
                                  {/* Row Tooltip with live calculated values */}
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3.5 shadow-2xl w-60 text-left z-50 normal-case select-none">
                                    <p className="font-extrabold text-[10px] text-emerald-400 mb-1">NRR BREAKDOWN</p>
                                    <div className="text-[9.5px] font-mono text-slate-350 space-y-1">
                                      <p className="flex justify-between">
                                        <span>Runs Scored:</span>
                                        <span className="font-semibold text-white">{row.runsScored}</span>
                                      </p>
                                      <p className="flex justify-between">
                                        <span>Overs Faced:</span>
                                        <span className="font-semibold text-white">{oversFaced.toFixed(1)}</span>
                                      </p>
                                      <p className="flex justify-between pl-2 pb-1 border-b border-slate-800 text-slate-400">
                                        <span>Average:</span>
                                        <span>{scoredAvg.toFixed(3)}</span>
                                      </p>
                                      
                                      <p className="flex justify-between pt-1">
                                        <span>Runs Conceded:</span>
                                        <span className="font-semibold text-white">{row.runsConceded}</span>
                                      </p>
                                      <p className="flex justify-between">
                                        <span>Overs Bowled:</span>
                                        <span className="font-semibold text-white">{oversBowled.toFixed(1)}</span>
                                      </p>
                                      <p className="flex justify-between pl-2 pb-1 border-b border-slate-800 text-slate-400">
                                        <span>Average:</span>
                                        <span>{concededAvg.toFixed(3)}</span>
                                      </p>
                                      
                                      <p className="flex justify-between font-bold text-[10px] pt-1 text-emerald-400 font-sans uppercase">
                                        <span>Net Run Rate:</span>
                                        <span>{row.NRR > 0 ? `+${row.NRR}` : row.NRR}</span>
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </AnimatePresence>
                    </table>
                  </div>
                </div>
              ) : (
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

              {activeTournament.matches.length === 0 ? (
                <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                  Configure and generate fixtures first to enable analytics.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                  
                  {/* Match Match Selection pane */}
                  <div className="lg:col-span-5 space-y-4">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Choose Upcoming Matchup</span>
                    <div className="space-y-2.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                      {activeTournament.matches.map(m => (
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
            </div>
          )}

          {tourTab === 'stats-leaderboards' && (
            <TournamentStatsAndLeaderboards
              tournamentId={activeTournament.id}
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
            />
          )}

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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Create Gully Tournament</h3>
            
            <div className="space-y-3 text-left">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Championship Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gully Premier League"
                  value={newTourName}
                  onChange={(e) => setNewTourName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Format</label>
                  <select
                    value={newTourFormat}
                    onChange={(e) => setNewTourFormat(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase outline-none"
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
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    placeholder="e.g. 10 (Select 1 to many)"
                  />
                </div>
              </div>

              {newTourFormat === 'Custom' && (
                <div className="space-y-1 animate-fade-in text-left">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">No. of Match Overs (Manual)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newTourCustomOvers}
                    onChange={(e) => setNewTourCustomOvers(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                    placeholder="Enter manual overs count (e.g. 5, 12, 50)"
                  />
                </div>
              )}

              {/* Tournament logo upload input option during creation */}
              <div className="space-y-1.5 animate-fade-in text-left">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Tournament Shield/Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                    {tournamentLogoStr ? (
                      <img src={tournamentLogoStr} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Trophy className="text-slate-300" size={20} />
                    )}
                  </div>
                  <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 font-black uppercase text-[10px] cursor-pointer">
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
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded border-none cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tournament Custom Rules option during creation */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Custom Rules (e.g. Box Cricket, special match constraints)</label>
                <textarea
                  placeholder="e.g., Underarm bowling only, direct hit required for boundaries, or net rule exclusions..."
                  rows={2}
                  value={newTourCustomRules}
                  onChange={(e) => setNewTourCustomRules(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Tournament Type/Structure</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewTourType('league')}
                    className={`py-2 px-3 rounded-xl border font-black text-[10px] uppercase tracking-wide cursor-pointer text-center ${
                      newTourType === 'league' 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    League (Round Robin)
                  </button>
                  <button
                    onClick={() => setNewTourType('knockout')}
                    className={`py-2 px-3 rounded-xl border font-black text-[10px] uppercase tracking-wide cursor-pointer text-center ${
                      newTourType === 'knockout' 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Knockout (Bracket)
                  </button>
                  <button
                    onClick={() => setNewTourType('group-stage')}
                    className={`py-2 px-3 rounded-xl border font-black text-[10px] uppercase tracking-wide cursor-pointer text-center ${
                      newTourType === 'group-stage' 
                        ? 'bg-indigo-500 text-white border-indigo-500' 
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Group Stage + Playoff
                  </button>
                  <button
                    onClick={() => setNewTourType('double-elimination')}
                    className={`py-2 px-3 rounded-xl border font-black text-[10px] uppercase tracking-wide cursor-pointer text-center ${
                      newTourType === 'double-elimination' 
                        ? 'bg-indigo-500 text-white border-indigo-500' 
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    Double Elimination
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Start Date</label>
                <input
                  type="date"
                  value={newTourDate}
                  onChange={(e) => setNewTourDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTournament}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SQUAD TEAM MODAL */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {editTeamId ? 'Edit Gully Squad' : 'Add Gully Squad'}
            </h3>

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
                        <div key={idx} className="flex items-center gap-1.5 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-850">
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setEditTeamId(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTeam}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MATCH SCORECARD MODAL */}
      {updatingMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Update Result Scorecard</h3>
            
            <div className="space-y-3.5 text-left">
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setUpdatingMatch(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateResults}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Confirm Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE SETTINGS MODAL */}
      {editingScheduleMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Alter Match Schedule</h3>

            <div className="space-y-3.5 text-left">
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
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingScheduleMatch(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={saveScheduleUpdate}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Update Fixture
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MATCH SCHEDULING MODAL */}
      {showCreateMatchModal && activeTournament && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Manual Match Scheduler</h3>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team A</label>
                  <select
                    value={manualMatchTeamAId}
                    onChange={(e) => setManualMatchTeamAId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  >
                    {activeTournament.teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Team B</label>
                  <select
                    value={manualMatchTeamBId}
                    onChange={(e) => setManualMatchTeamBId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  >
                    {activeTournament.teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

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
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateMatchModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualMatch}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Schedule Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TOURNAMENT MODAL */}
      {showEditTourModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Tournament Settings</h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Championship Name</label>
                <input
                  type="text"
                  value={editTourName}
                  onChange={(e) => setEditTourName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Match Format</label>
                  <select
                    value={editTourFormat}
                    onChange={(e) => setEditTourFormat(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase outline-none"
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
                    value={editTourTeamCount}
                    onChange={(e) => setEditTourTeamCount(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              </div>

              {editTourFormat === 'Custom' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">No. of Match Overs (Manual)</label>
                  <input
                    type="number"
                    min={1}
                    value={editTourCustomOvers}
                    onChange={(e) => setEditTourCustomOvers(Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Tournament Type</label>
                  <select
                    value={editTourType}
                    onChange={(e) => setEditTourType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs uppercase outline-none"
                  >
                    <option value="league">League (Round Robin)</option>
                    <option value="knockout">Knockout</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Commencement Date</label>
                  <input
                    type="date"
                    value={editTourDate}
                    onChange={(e) => setEditTourDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none"
                  />
                </div>
              </div>

              {/* Tournament logo upload input option */}
              <div className="space-y-1.5 pt-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Update Shield/Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden">
                    {editTourLogo ? (
                      <img src={editTourLogo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Trophy className="text-slate-300" size={20} />
                    )}
                  </div>
                  <label className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-500 rounded-xl border border-emerald-500/20 font-black uppercase text-[10px] cursor-pointer">
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
                      className="p-1 hover:bg-rose-50 text-rose-500 rounded border-none cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tournament Custom Rules option during editing */}
              <div className="space-y-1.5 pt-1.5">
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Custom Rules (e.g. Box Cricket constraints)</label>
                <textarea
                  placeholder="e.g. Underarm bowling only, direct hits bounds, or custom over scores limit..."
                  rows={2}
                  value={editTourCustomRules}
                  onChange={(e) => setEditTourCustomRules(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-805 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-emerald-500 resize-none placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowEditTourModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Cancel
              </button>
              <button
                onClick={handleEditTournament}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none"
              >
                Save Settings
              </button>
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

    </div>
  );
};
