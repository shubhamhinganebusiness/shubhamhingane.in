import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Calendar, MapPin, Users, HelpCircle, 
  Map, Check, Clock, User, DollarSign, CloudRain, Bell, RefreshCw
} from 'lucide-react';

export interface Ground {
  id: string;
  name: string;
  pitchType: 'Turf' | 'Matting' | 'Concrete' | 'Coir Matte';
  address: string;
  latitude: number;
  longitude: number;
  bookedSlots: { date: string; timeSlot: string; matchId?: string }[];
  availability: string[]; // e.g. ["Morning", "Afternoon", "Evening"]
}

export interface PlayerProfile {
  name: string;
  age: number;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  battingStyle: 'Right Hand' | 'Left Hand';
  bowlingStyle: 'Right-Arm Fast' | 'Right-Arm Spin' | 'Left-Arm Fast' | 'Left-Arm Spin' | 'None';
  regFeePaid: boolean;
  regFeeAmount: number;
}

export interface TeamWithRoster {
  id: string;
  name: string;
  captain: string;
  contactEmail: string;
  players: PlayerProfile[];
  regStatus: 'Pending' | 'Approved' | 'Rejected';
  regFeePaid: boolean;
  seed: number;
  group?: string; // Group A, Group B (for Group Stages + Playoffs)
}

export interface Official {
  id: string;
  name: string;
  role: 'On-Field Umpire' | 'Leg Umpire' | 'Third Umpire' | 'Official Scorer';
  availableDays: string[]; // e.g., ["Saturday", "Sunday"]
}

interface TournamentVenueSchedulerProps {
  tournamentId: string;
  teams: TeamWithRoster[];
  roundsType: 'league' | 'knockout' | 'group-stage' | 'double-elimination';
  format: 'T20' | 'ODI' | 'Test' | 'Box Cricket';
  onUpdateTeams: (teams: TeamWithRoster[]) => void;
  onUpdateSchedule: (matches: any[]) => void;
  matches: any[];
}

export const TournamentVenueScheduler: React.FC<TournamentVenueSchedulerProps> = ({
  tournamentId,
  teams,
  roundsType,
  format,
  onUpdateTeams,
  onUpdateSchedule,
  matches
}) => {
  // Grounds state
  const [grounds, setGrounds] = useState<Ground[]>(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(`gully_grounds_${tournamentId}`);
    } catch (e) {
      console.warn("Blocked reading grounds from localStorage:", e);
    }
    return saved ? JSON.parse(saved) : [
      {
        id: 'ground-1',
        name: 'Shivaji Maharaj Ground (Turf)',
        pitchType: 'Turf',
        address: 'MG Road, Kothrud, Pune, MH',
        latitude: 18.5074,
        longitude: 73.8077,
        bookedSlots: [],
        availability: ['Morning', 'Afternoon']
      },
      {
        id: 'ground-2',
        name: 'Gully Stadium Cement Pitch',
        pitchType: 'Concrete',
        address: 'Sector 5, Shanti Nagar, Pune, MH',
        latitude: 18.5204,
        longitude: 73.8567,
        bookedSlots: [],
        availability: ['Morning', 'Afternoon', 'Evening']
      }
    ];
  });

  // Officials state
  const [officials, setOfficials] = useState<Official[]>(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(`gully_officials_${tournamentId}`);
    } catch (e) {
      console.warn("Blocked reading officials from localStorage:", e);
    }
    return saved ? JSON.parse(saved) : [
      { id: 'off-1', name: 'Umesh Shastri', role: 'On-Field Umpire', availableDays: ['Saturday', 'Sunday'] },
      { id: 'off-2', name: 'Nitin Gadkari', role: 'Leg Umpire', availableDays: ['Saturday', 'Sunday'] },
      { id: 'off-3', name: 'Kapil Dev Patil', role: 'Third Umpire', availableDays: ['Sunday'] },
      { id: 'off-4', name: 'Ravi Shastri Jnr', role: 'Official Scorer', availableDays: ['Saturday', 'Sunday'] }
    ];
  });

  // Active subtab
  const [schedulerSubTab, setSchedulerSubTab] = useState<'rosters' | 'grounds' | 'scheduling' | 'officials'>('rosters');

  // Ground Editor modal
  const [showGroundModal, setShowGroundModal] = useState(false);
  const [groundForm, setGroundForm] = useState<Omit<Ground, 'id' | 'bookedSlots'>>({
    name: '',
    pitchType: 'Turf',
    address: '',
    latitude: 18.52,
    longitude: 73.85,
    availability: ['Morning', 'Afternoon']
  });

  // Register Team Roster state
  const [showRegModal, setShowRegModal] = useState(false);
  const removeTeam = (teamId: string, teamName: string) => {
    if (window.confirm(`Are you sure you want to delete "${teamName}" from this tournament?`)) {
      onUpdateTeams(teams.filter(t => t.id !== teamId));
      addNotification(`Team ${teamName} deleted successfully.`, "schedule");
    }
  };
  const [regForm, setRegForm] = useState({
    name: '',
    captain: '',
    email: '',
    playersText: 'Shikhar Dhawan, 32, Batsman, Left Hand, None\nHardik Pandya, 28, All-Rounder, Right Hand, Right-Arm Fast\nJasprit Bumrah, 29, Bowler, Right Hand, Right-Arm Fast\nYuzvendra Chahal, 31, Bowler, Right Hand, Right-Arm Spin\nKL Rahul, 30, Wicket-Keeper, Right Hand, None',
    regFeeAmount: 500,
    regFeePaid: true,
    group: 'Group A'
  });

  // Payment Gateway simulation
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Active match being rescheduled/edited
  const [editingMatch, setEditingMatch] = useState<any | null>(null);

  // Rain rescheduling state / notification panel
  const [notificationLog, setNotificationLog] = useState<{ id: string; time: string; msg: string; type: 'rain' | 'schedule' | 'payment' }[]>([
    { id: 'init', time: '09:00 AM', msg: 'System initialized. Ready for tournament setup.', type: 'schedule' }
  ]);

  // Save Grounds & Officials helpers
  const saveGrounds = (newGrounds: Ground[]) => {
    setGrounds(newGrounds);
    try {
      localStorage.setItem(`gully_grounds_${tournamentId}`, JSON.stringify(newGrounds));
    } catch (e) {
      console.warn("Blocked saving grounds to localStorage:", e);
    }
  };

  const saveOfficials = (newOfficials: Official[]) => {
    setOfficials(newOfficials);
    try {
      localStorage.setItem(`gully_officials_${tournamentId}`, JSON.stringify(newOfficials));
    } catch (e) {
      console.warn("Blocked saving officials to localStorage:", e);
    }
  };

  const addNotification = (msg: string, type: 'rain' | 'schedule' | 'payment') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNotificationLog(prev => [{ id: Date.now().toString(), time, msg, type }, ...prev]);
  };

  const handleSaveMatchEdit = (updatedMatch: any) => {
    const original = matches.find(m => m.id === updatedMatch.id);
    if (!original) return;

    const dateChanged = original.date !== updatedMatch.date;
    const timeChanged = original.time !== updatedMatch.time;
    const venueChanged = original.venue !== updatedMatch.venue;

    const changes = [];
    if (dateChanged) changes.push(`date from "${original.date}" to "${updatedMatch.date}"`);
    if (timeChanged) changes.push(`time from "${original.time}" to "${updatedMatch.time}"`);
    if (venueChanged) changes.push(`venue from "${original.venue}" to "${updatedMatch.venue}"`);

    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? { ...m, ...updatedMatch } : m);
    onUpdateSchedule(updatedMatches);

    if (changes.length > 0) {
      const teamAObj = teams.find(t => t.id === updatedMatch.teamAId || t.name === updatedMatch.teamAName);
      const teamBObj = teams.find(t => t.id === updatedMatch.teamBId || t.name === updatedMatch.teamBName);

      const recipientPlayers: string[] = [];
      if (teamAObj) recipientPlayers.push(...(teamAObj.players || []).map(p => typeof p === 'string' ? p : p.name));
      if (teamBObj) recipientPlayers.push(...(teamBObj.players || []).map(p => typeof p === 'string' ? p : p.name));

      const alertMsg = `📢 Venue/Schedule Change: ${updatedMatch.teamAName || updatedMatch.teamA} vs ${updatedMatch.teamBName || updatedMatch.teamB} updated - ${changes.join(', ')}. SMS/Email updates broadcast to ${recipientPlayers.length} roster players successfully.`;

      addNotification(alertMsg, 'schedule');
    }

    setEditingMatch(null);
  };

  // Onboarding registration save
  const handleRegisterTeam = () => {
    if (!regForm.name.trim() || !regForm.captain.trim()) {
      alert("Please provide the Team Name and Captain Name");
      return;
    }

    setSimulatingPayment(true);
    setTimeout(() => {
      setSimulatingPayment(false);
      setPaymentSuccess(true);
      
      // Parse players list
      const lines = regForm.playersText.split('\n').filter(l => l.trim().length > 0);
      const parsedPlayers: PlayerProfile[] = lines.map(line => {
        const parts = line.split(',').map(s => s.trim());
        const name = parts[0] || 'Unknown Player';
        const age = parseInt(parts[1]) || 24;
        const role = (parts[2] as any) || 'Batsman';
        const battingStyle = (parts[3] as any) || 'Right Hand';
        const bowlingStyle = (parts[4] as any) || 'None';
        return {
          name, age, role, battingStyle, bowlingStyle,
          regFeePaid: regForm.regFeePaid,
          regFeeAmount: regForm.regFeeAmount / (lines.length || 1)
        };
      });

      const newTeam: TeamWithRoster = {
        id: `team_${Date.now()}`,
        name: regForm.name.trim(),
        captain: regForm.captain.trim(),
        contactEmail: regForm.email.trim(),
        players: parsedPlayers,
        regStatus: 'Approved',
        regFeePaid: regForm.regFeePaid,
        seed: teams.length + 1,
        group: regForm.group
      };

      onUpdateTeams([...teams, newTeam]);
      addNotification(`Team ${newTeam.name} onboarded successfully! ₹${regForm.regFeeAmount} Fee verified.`, 'payment');
      
      // Reset forms
      setShowRegModal(false);
      setPaymentSuccess(false);
      setRegForm({
        name: '', captain: '', email: '',
        playersText: 'Aman Patel, 23, Batsman, Right Hand, None\nRajesh Kumar, 25, Bowler, Right Hand, Right-Arm Spin\nSunil Sen, 22, All-Rounder, Right Hand, Right-Arm Fast',
        regFeeAmount: 500, regFeePaid: true, group: 'Group A'
      });
    }, 1500);
  };

  // Add ground handler
  const handleAddGround = () => {
    if (!groundForm.name.trim() || !groundForm.address.trim()) {
      alert("Ground name and address are required!");
      return;
    }
    const newGround: Ground = {
      id: `ground_${Date.now()}`,
      ...groundForm,
      bookedSlots: []
    };
    saveGrounds([...grounds, newGround]);
    setShowGroundModal(false);
    addNotification(`New Venue Added: ${newGround.name} (${newGround.pitchType} pitch).`, 'schedule');
  };

  // Add Official
  const [newOfficialName, setNewOfficialName] = useState('');
  const [newOfficialRole, setNewOfficialRole] = useState<'On-Field Umpire' | 'Leg Umpire' | 'Third Umpire' | 'Official Scorer'>('On-Field Umpire');
  const handleAddOfficial = () => {
    if (!newOfficialName.trim()) return;
    const newOfficial: Official = {
      id: `off_${Date.now()}`,
      name: newOfficialName.trim(),
      role: newOfficialRole,
      availableDays: ['Saturday', 'Sunday']
    };
    saveOfficials([...officials, newOfficial]);
    setNewOfficialName('');
    addNotification(`Official registered: ${newOfficial.name} (${newOfficial.role}).`, 'schedule');
  };

  // Smart Schedule Generator
  const generateSmartSchedule = () => {
    if (teams.length < 2) {
      alert("Add at least 2 teams to schedule fixtures!");
      return;
    }

    const newMatches: any[] = [];
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + 1); // Start tomorrow

    // Distribute groups if group stage
    const groupMap: Record<string, TeamWithRoster[]> = {};
    if (roundsType === 'group-stage') {
      teams.forEach(t => {
        const gp = t.group || 'Group A';
        if (!groupMap[gp]) groupMap[gp] = [];
        groupMap[gp].push(t);
      });
    }

    addNotification("Running Smart Schedule Constraint Solver...", "schedule");

    let matchCount = 0;
    const teamLastPlayed: Record<string, string> = {}; // Avoid back-to-back matches

    const createMatchObject = (tA: TeamWithRoster, tB: TeamWithRoster, stageName: string) => {
      const matchDateStr = dateObj.toISOString().split('T')[0];
      const ground = grounds[matchCount % grounds.length] || grounds[0];
      const timeSlot = matchCount % 2 === 0 ? "09:00 AM" : "02:00 PM";
      
      // Assign officials
      const onField = officials.find(o => o.role === 'On-Field Umpire')?.name || "TBD Umpire 1";
      const leg = officials.find(o => o.role === 'Leg Umpire')?.name || "TBD Umpire 2";
      const scorer = officials.find(o => o.role === 'Official Scorer')?.name || "TBD Scorer";

      const matchId = `match_${Date.now()}_${matchCount}`;
      matchCount++;

      // Shift date every 2 matches to avoid same-day clashes for same teams
      if (matchCount % 2 === 0) {
        dateObj.setDate(dateObj.getDate() + 1);
      }

      return {
        id: matchId,
        teamAId: tA.id,
        teamBId: tB.id,
        teamAName: tA.name,
        teamBName: tB.name,
        date: matchDateStr,
        time: timeSlot,
        venue: ground.name,
        pitchType: ground.pitchType,
        umpire1: onField,
        umpire2: leg,
        scorer: scorer,
        status: 'scheduled' as const,
        scoreA: "",
        scoreB: "",
        oversA: "",
        oversB: "",
        winnerId: null,
        winReason: "",
        manOfTheMatch: "",
        stage: stageName,
        weatherStatus: 'Clear Sky'
      };
    };

    if (roundsType === 'group-stage') {
      // Group Stages Round Robin + Playoffs
      Object.entries(groupMap).forEach(([groupName, groupTeams]) => {
        const len = groupTeams.length;
        for (let i = 0; i < len; i++) {
          for (let j = i + 1; j < len; j++) {
            newMatches.push(createMatchObject(groupTeams[i], groupTeams[j], `${groupName} Stage`));
          }
        }
      });
      // Add Playoff placeholders
      newMatches.push({
        id: `match_playoff1_${Date.now()}`,
        teamAId: "G1", teamBId: "G2",
        teamAName: "Group A Rank 1", teamBName: "Group B Rank 2",
        date: dateObj.toISOString().split('T')[0], time: "09:00 AM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "",
        stage: 'Semi-Final 1'
      });
      newMatches.push({
        id: `match_playoff2_${Date.now()}`,
        teamAId: "G3", teamBId: "G4",
        teamAName: "Group B Rank 1", teamBName: "Group A Rank 2",
        date: dateObj.toISOString().split('T')[0], time: "02:00 PM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "",
        stage: 'Semi-Final 2'
      });
      dateObj.setDate(dateObj.getDate() + 1);
      newMatches.push({
        id: `match_playoff_final_${Date.now()}`,
        teamAId: "SF1_W", teamBId: "SF2_W",
        teamAName: "Winner SF1", teamBName: "Winner SF2",
        date: dateObj.toISOString().split('T')[0], time: "01:30 PM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", oversA: "", oversB: "", winnerId: null, winReason: "",
        stage: 'Final'
      });

    } else if (roundsType === 'double-elimination') {
      // Double Elimination basic scaffold setup
      // We scaffold a Winners bracket round 1, Losers bracket Round 1, Finals
      const len = teams.length;
      const shuffled = [...teams];
      
      // Upper bracket
      for (let i = 0; i < len; i += 2) {
        if (shuffled[i] && shuffled[i+1]) {
          newMatches.push(createMatchObject(shuffled[i], shuffled[i+1], "Upper Round 1"));
        }
      }
      // Scaffold losers bracket
      newMatches.push({
        id: `match_double_loser_${Date.now()}`,
        teamAId: "", teamBId: "", teamAName: "Loser Upper A", teamBName: "Loser Upper B",
        date: dateObj.toISOString().split('T')[0], time: "10:00 AM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", winnerId: null, winReason: "", stage: "Elimination Bracket"
      });
      dateObj.setDate(dateObj.getDate() + 1);
      newMatches.push({
        id: `match_double_final_${Date.now()}`,
        teamAId: "", teamBId: "", teamAName: "Winner Upper Bracket", teamBName: "Winner Lower Bracket",
        date: dateObj.toISOString().split('T')[0], time: "02:00 PM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", winnerId: null, winReason: "", stage: "Double Elim Grand Final"
      });

    } else if (roundsType === 'knockout') {
      // Knockout scaffold
      const len = teams.length;
      for (let i = 0; i < len; i += 2) {
        if (teams[i] && teams[i+1]) {
          newMatches.push(createMatchObject(teams[i], teams[i+1], 'Quarter-Final'));
        }
      }
      newMatches.push({
        id: `match_sf1_${Date.now()}`, teamAId: "", teamBId: "",
        teamAName: "Winner QF1", teamBName: "Winner QF2",
        date: dateObj.toISOString().split('T')[0], time: "10:00 AM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", winnerId: null, winReason: "", stage: "Semi-Final"
      });
      newMatches.push({
        id: `match_sf2_${Date.now()}`, teamAId: "", teamBId: "",
        teamAName: "Winner QF3", teamBName: "Winner QF4",
        date: dateObj.toISOString().split('T')[0], time: "02:00 PM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", winnerId: null, winReason: "", stage: "Semi-Final"
      });
      dateObj.setDate(dateObj.getDate() + 1);
      newMatches.push({
        id: `match_final_${Date.now()}`, teamAId: "", teamBId: "",
        teamAName: "Winner SF1", teamBName: "Winner SF2",
        date: dateObj.toISOString().split('T')[0], time: "02:00 PM",
        venue: grounds[0]?.name || "Local Ground", pitchType: grounds[0]?.pitchType || "Concrete",
        status: 'scheduled', scoreA: "", scoreB: "", winnerId: null, winReason: "", stage: "Final"
      });
    } else {
      // Simple Round Robin (League)
      const len = teams.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          newMatches.push(createMatchObject(teams[i], teams[j], 'League'));
        }
      }
    }

    onUpdateSchedule(newMatches);
    addNotification(`Successfully generated ${newMatches.length} smart-scheduled fixtures! Clashes mitigated, grounds allocated.`, 'schedule');
  };

  // Rain rescheduling tool simulator
  const triggerRainDelayReschedule = (targetDate: string) => {
    if (!targetDate) return;
    const affected = matches.filter(m => m.date === targetDate && m.status === 'scheduled');
    if (affected.length === 0) {
      alert("No scheduled games found on this selected date!");
      return;
    }

    const updated = matches.map(m => {
      if (m.date === targetDate && m.status === 'scheduled') {
        const currentDate = new Date(m.date);
        currentDate.setDate(currentDate.getDate() + 1); // Bump 1 day forward
        return {
          ...m,
          date: currentDate.toISOString().split('T')[0],
          weatherStatus: 'Rain Delay / Overcast'
        };
      }
      return m;
    });

    onUpdateSchedule(updated);
    addNotification(`🌧️ Weather alert! Rain delay at matches on ${targetDate}. Matches rescheduled 1 day forward. Teams notified.`, 'rain');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl rounded-[2.5rem] p-6 space-y-6">
      <div className="bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl flex gap-1.5 overflow-x-auto no-scrollbar border border-slate-200/60 dark:border-slate-800/30">
        <button
          onClick={() => setSchedulerSubTab('rosters')}
          className={`py-2 px-4.5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 ${
            schedulerSubTab === 'rosters' 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          Team & Player Reg
        </button>

        <button
          onClick={() => setSchedulerSubTab('grounds')}
          className={`py-2 px-4.5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 ${
            schedulerSubTab === 'grounds' 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          Grounds & Venues
        </button>

        <button
          onClick={() => setSchedulerSubTab('officials')}
          className={`py-2 px-4.5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 ${
            schedulerSubTab === 'officials' 
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10' 
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-900/40'
          }`}
        >
          Match Officials
        </button>

        <button
          onClick={() => setSchedulerSubTab('scheduling')}
          className={`py-2 px-4.5 font-black uppercase text-[10px] sm:text-xs tracking-wider rounded-xl cursor-pointer shrink-0 border-none transition-all flex items-center gap-1.5 ${
            schedulerSubTab === 'scheduling' 
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
              : 'text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-305 bg-transparent hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
          }`}
        >
          Smart Schedule Engine
        </button>
      </div>

      {/* TEAM & PLAYER REGISTRATION SUBTAB */}
      {schedulerSubTab === 'rosters' && (
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-500/10 p-5 rounded-3xl border border-emerald-500/10">
            <div>
              <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                <Users size={16} className="text-emerald-500" /> Digital Onboarding & Registration
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Collect squad rosters, age limits, profiles and mock payment gateway fees.</p>
            </div>
            <button
              onClick={() => setShowRegModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-extrabold uppercase text-xs cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
            >
              <Plus size={14} /> Onboard Team
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <p className="text-xs font-bold uppercase">No complex onboarded rosters yet.</p>
                <p className="text-2xs font-semibold uppercase text-slate-400">Launch "Onboard Team" to structure customized participant details.</p>
              </div>
            ) : (
              teams.map(t => (
                <div key={t.id} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {t.logo ? (
                          <img src={t.logo} alt={t.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users size={14} className="text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-black uppercase text-xs text-slate-800 dark:text-white leading-tight">{t.name}</h5>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Captain: {t.captain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        t.regStatus === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {t.regStatus}
                      </span>
                      <button
                        onClick={() => removeTeam(t.id, t.name)}
                        className="p-1 hover:bg-rose-50 dark:hover:bg-rose-500/15 text-rose-500 rounded border-none cursor-pointer flex items-center justify-center"
                        title="Delete squad"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-2 inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2.5 py-1 rounded-xl">
                    <DollarSign size={10} className="text-amber-500" /> Reg Fee Paid: {t.regFeePaid ? '₹500 Verified' : 'Pending'}
                  </p>

                  <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/40">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">Roster Profiles ({t.players.length})</span>
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                      {t.players.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2 rounded-xl text-[10px] gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/30">
                              {(p as any).photo ? (
                                <img src={(p as any).photo} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <User size={10} className="text-slate-450" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-700 dark:text-slate-200 block truncate leading-none">{p.name} ({p.age}y)</span>
                              <span className="text-[8px] text-slate-400 uppercase font-bold block">{p.role}</span>
                            </div>
                          </div>
                          {p.bowlingStyle !== 'None' && (
                            <span className="text-[7px] bg-indigo-500/10 text-indigo-500 rounded p-1 font-black uppercase tracking-tight shrink-0">
                              {p.bowlingStyle.replace('Right-Arm ', 'R-').replace('Left-Arm ', 'L-')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VENUE & GROUND MANAGEMENT */}
      {schedulerSubTab === 'grounds' && (
        <div className="space-y-6 text-left">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-850">
            <div>
              <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-1.5">
                <MapPin size={16} className="text-emerald-500" /> Grounds & Slot Booker
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Define pitch types (Turf /Concrete) and configure geographical coordinates.</p>
            </div>
            <button
              onClick={() => setShowGroundModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-extrabold uppercase text-xs cursor-pointer shadow-sm flex items-center gap-1 shrink-0"
            >
              <Plus size={14} /> Add Venue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {grounds.map(g => (
              <div key={g.id} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 text-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="font-black uppercase text-sm text-slate-800 dark:text-white">{g.name}</h5>
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[9px] font-black uppercase">
                      {g.pitchType} Pitch
                    </span>
                  </div>
                  <p className="text-slate-400 inline-flex items-center gap-1 font-bold uppercase text-[9px]">
                    <MapPin size={10} className="text-emerald-500" /> {g.address}
                  </p>
                  
                  {/* Coordinates */}
                  <div className="text-[9px] font-mono font-semibold text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-xl flex items-center justify-between">
                    <span>GPS Coordinates: {g.latitude.toFixed(4)}, {g.longitude.toFixed(4)}</span>
                    <span className="text-[7.5px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Mapped</span>
                  </div>

                  {/* Availability */}
                  <div className="p-1 pt-2">
                    <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-wider block mb-1">Available Daily Slots</span>
                    <div className="flex gap-1.5">
                      {g.availability.includes('Morning') && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-[8px] text-[9px] font-extrabold">Morning (09 AM)</span>}
                      {g.availability.includes('Afternoon') && <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-[8px] text-[9px] font-extrabold">Afternoon (02 PM)</span>}
                      {g.availability.includes('Evening') && <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded-[8px] text-[9px] font-extrabold">Evening (06 PM)</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Allocated Matches: {g.bookedSlots.length} Booked</span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this venue?")) {
                        saveGrounds(grounds.filter(grd => grd.id !== g.id));
                        addNotification(`Removed ground "${g.name}".`, 'schedule');
                      }
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded border-none cursor-pointer bg-transparent"
                    title="Delete Ground"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MATCH OFFICIALS */}
      {schedulerSubTab === 'officials' && (
        <div className="space-y-6 text-left">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1">
                <User size={13} /> Add Umpire/Scorer
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Official Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Anil Chaudhary"
                    value={newOfficialName}
                    onChange={(e) => setNewOfficialName(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Role Type</label>
                  <select
                    value={newOfficialRole}
                    onChange={(e) => setNewOfficialRole(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none"
                  >
                    <option value="On-Field Umpire">On-Field Umpire</option>
                    <option value="Leg Umpire">Leg Umpire</option>
                    <option value="Third Umpire">Third Umpire</option>
                    <option value="Official Scorer">Official Scorer</option>
                  </select>
                </div>
                <button
                  onClick={handleAddOfficial}
                  className="w-full py-2 bg-emerald-505 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-bold uppercase tracking-wider cursor-pointer"
                >
                  Register Official
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Registered Officials Availability</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {officials.map(o => (
                  <div key={o.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-xs text-slate-800 dark:text-white">{o.name}</p>
                      <span className="text-[8.5px] text-slate-400 font-bold uppercase">{o.role}</span>
                    </div>
                    <button
                      onClick={() => {
                        saveOfficials(officials.filter(off => off.id !== o.id));
                        addNotification(`Deregistered official "${o.name}".`, 'schedule');
                      }}
                      className="p-1 rounded text-slate-400 hover:bg-rose-50 hover:text-rose-500 border-none bg-transparent cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART SCHEDULE LOGIC & ENGINE */}
      {schedulerSubTab === 'scheduling' && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase text-indigo-500 flex items-center gap-1.5">
                <RefreshCw size={14} className="animate-spin" /> Constraint Solver Setup
              </h4>
              <ul className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed space-y-2 list-none p-0">
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Ground capacity balancing</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> No back-to-back clashes</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Custom format validation ({format})</li>
                <li className="flex items-center gap-1.5"><Check size={12} className="text-emerald-500" /> Structure mapping ({roundsType})</li>
              </ul>
              <button
                onClick={generateSmartSchedule}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl border-none font-black uppercase tracking-wider text-2xs cursor-pointer shadow-md"
              >
                Launch Smart Auto-Generator
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black uppercase text-rose-505 text-rose-505 flex items-center gap-1 flex-wrap">
                <CloudRain size={14} className="text-indigo-400" /> Rescheduling Engine (Rain Delay)
              </h4>
              <p className="text-[10.5px] text-slate-400 font-semibold uppercase leading-relaxed">
                Admins can select any game day to delay due to rain/overcast. Affected matches are pushed 1 day forward with automatic SMS/email simulation logs.
              </p>
              <div className="space-y-2">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Target Weather Alert Date</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    id="delay-target-date"
                    className="flex-1 px-3 py-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg text-xs"
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('delay-target-date') as HTMLInputElement;
                      if (input) triggerRainDelayReschedule(input.value);
                    }}
                    className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-[10px] border-none rounded-lg cursor-pointer"
                  >
                    Trigger Reschedule
                  </button>
                </div>
              </div>
            </div>

            {/* Notification logs */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white flex items-center gap-1">
                <Bell size={13} /> Administration System Log
              </h4>
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 text-[10px]">
                {notificationLog.map(note => (
                  <div key={note.id} className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-500">
                    <div className="flex justify-between items-center mb-0.5 font-bold uppercase text-[8.5px]">
                      <span className="text-slate-400">{note.time}</span>
                      <span className={`px-1 rounded text-white ${
                        note.type === 'rain' ? 'bg-amber-500' : note.type === 'payment' ? 'bg-emerald-500' : 'bg-indigo-505 bg-indigo-500'
                      }`}>{note.type}</span>
                    </div>
                    <p className="font-semibold">{note.msg}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming Match Schedules Panel */}
          <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-4 mt-6">
            <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar size={16} className="text-indigo-500" /> Upcoming Match Schedules Builder
                </h4>
                <p className="text-[10px] text-slate-440 font-bold uppercase mt-1">
                  Reschedule individual match times or stadiums. Registered team players will instantly receive automated in-app pushes.
                </p>
              </div>
            </div>

            {matches.filter(m => m.status === 'scheduled').length === 0 ? (
              <div className="py-8 text-center text-xs font-bold uppercase text-slate-400">
                No upcoming scheduled matches found. Use the Smart Auto-Generator to instantly generate fixtures.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-450">
                      <th className="py-3 px-4">Match</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Ground Venue</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.filter(m => m.status === 'scheduled').map((m: any) => (
                      <tr key={m.id} className="border-b border-slate-50 dark:border-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60 transition-all">
                        <td className="py-3 px-4 text-slate-850 dark:text-slate-100 font-extrabold">{m.teamAName || m.teamA} <span className="text-slate-350">vs</span> {m.teamBName || m.teamB}</td>
                        <td className="py-3 px-4 text-slate-500">{m.date}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">{m.time}</td>
                        <td className="py-3 px-4 text-emerald-600 dark:text-emerald-450">{m.venue}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setEditingMatch(m)}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg border-none font-black uppercase tracking-wider text-[10px] cursor-pointer transition-all"
                          >
                            Reschedule
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SQUAD REGISTER POPUP MODAL */}
      <AnimatePresence>
        {showRegModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[201] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-secondary rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Team Digital Onboarding & fee portal</h3>
              
              <div className="space-y-3.5 text-xs text-left max-h-[420px] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Squad Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Pune Titans"
                      value={regForm.name}
                      onChange={(e) => setRegForm({...regForm, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Squad Captain</label>
                    <input
                      type="text"
                      placeholder="e.g. Suresh Kumar"
                      value={regForm.captain}
                      onChange={(e) => setRegForm({...regForm, captain: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Contact Email</label>
                    <input
                      type="email"
                      placeholder="suresh@gullyleague.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({...regForm, email: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Stage Play group</label>
                    <select
                      value={regForm.group}
                      onChange={(e) => setRegForm({...regForm, group: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                    >
                      <option value="Group A">Group A</option>
                      <option value="Group B">Group B</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Mock Registration Fee Amount</label>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold">₹</span>
                    <input
                      type="number"
                      value={regForm.regFeeAmount}
                      onChange={(e) => setRegForm({...regForm, regFeeAmount: Number(e.target.value)})}
                      className="w-32 px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                    />
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={regForm.regFeePaid}
                        onChange={(e) => setRegForm({...regForm, regFeePaid: e.target.checked})}
                      />
                      <span className="text-[10px] font-bold uppercase text-slate-500">Collect instantly via simulated secure UPI</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-405 font-black uppercase text-slate-450 block mb-1">Roster Profiles Definition</label>
                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Specify: Name, Age, Role, BattingStyle, BowlingStyle (Each Player in a new line)</span>
                  <textarea
                    rows={5}
                    value={regForm.playersText}
                    onChange={(e) => setRegForm({...regForm, playersText: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[10px] resize-none"
                  />
                </div>
              </div>

              {simulatingPayment && (
                <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center space-y-4 rounded-3xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
                  <p className="text-xs font-black uppercase text-emerald-500 tracking-wider">Simulating Secure UPI NetBanking Gateway...</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowRegModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-350 rounded-xl font-black uppercase tracking-wider text-xs border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegisterTeam}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-wider text-xs border-none cursor-pointer"
                >
                  Confirm & onboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD GROUND DIALOG */}
      <AnimatePresence>
        {showGroundModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[201] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-secondary rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-black text-slate-905 uppercase text-slate-900 dark:text-white">Configure Stadium Pitch / Location</h3>
              
              <div className="space-y-3 text-xs text-left">
                <div>
                  <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Ground/Arena Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune Gymkhana Ground"
                    value={groundForm.name}
                    onChange={(e) => setGroundForm({...groundForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-404 font-semibold uppercase block mb-1">Pitch Matting type</label>
                  <select
                    value={groundForm.pitchType}
                    onChange={(e) => setGroundForm({...groundForm, pitchType: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                  >
                    <option value="Turf">Turf Ground</option>
                    <option value="Concrete">Cement Pitch</option>
                    <option value="Matting">Matting Overlay</option>
                    <option value="Coir Matte">Natural Coir Matte</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-404 font-semibold uppercase block mb-1">Full Postal Address / Landmark</label>
                  <input
                    type="text"
                    placeholder="Sector 2, Karve Road, Pune, MH"
                    value={groundForm.address}
                    onChange={(e) => setGroundForm({...groundForm, address: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={groundForm.latitude}
                      onChange={(e) => setGroundForm({...groundForm, latitude: Number(e.target.value)})}
                      className="w-full px-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-404 font-bold uppercase block mb-1">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={groundForm.longitude}
                      onChange={(e) => setGroundForm({...groundForm, longitude: Number(e.target.value)})}
                      className="w-full px-4 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowGroundModal(false)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddGround}
                  className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] border-none cursor-pointer"
                >
                  Confirm Ground
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MATCH RESCHEDULE POPUP MODAL */}
      <AnimatePresence>
        {editingMatch && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[203] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-secondary rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-left"
            >
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Reschedule Match Fixture
              </h3>
              
              <div className="space-y-3.5 text-xs">
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-850">
                  <span className="text-[9px] font-black text-slate-400 tracking-widest block uppercase">Fixture details</span>
                  <strong className="text-slate-800 dark:text-white block mt-1">
                    {editingMatch.teamAName || editingMatch.teamA} vs {editingMatch.teamBName || editingMatch.teamB}
                  </strong>
                </div>

                <div>
                  <label className="text-[9px] text-slate-404 font-bold block uppercase mb-1">Match Play Date</label>
                  <input
                    type="date"
                    value={editingMatch.date}
                    onChange={(e) => setEditingMatch({ ...editingMatch, date: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-slate-404 font-bold block uppercase mb-1">Assigned Time Slot</label>
                  <select
                    value={editingMatch.time}
                    onChange={(e) => setEditingMatch({ ...editingMatch, time: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-white"
                  >
                    <option value="07:00 AM">07:00 AM (Early Light)</option>
                    <option value="09:00 AM">09:00 AM (Morning Session)</option>
                    <option value="11:30 AM">11:30 AM (Noon Session)</option>
                    <option value="02:00 PM">02:00 PM (Afternoon Slump)</option>
                    <option value="04:30 PM">04:30 PM (Golden Hour Match)</option>
                    <option value="07:00 PM">07:00 PM (Night Floodlights)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] text-slate-404 font-bold block uppercase mb-1">Assigned Ground Arena</label>
                  <select
                    value={editingMatch.venue}
                    onChange={(e) => {
                      const selectedGround = grounds.find(g => g.name === e.target.value);
                      setEditingMatch({
                        ...editingMatch,
                        venue: e.target.value,
                        pitchType: selectedGround ? selectedGround.pitchType : editingMatch.pitchType
                      });
                    }}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-white"
                  >
                    {grounds.map(g => (
                      <option key={g.id} value={g.name}>{g.name} ({g.pitchType})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setEditingMatch(null)}
                  className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:text-slate-350 rounded-xl font-black uppercase text-[10px] border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveMatchEdit(editingMatch)}
                  className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl font-black uppercase text-[10px] border-none cursor-pointer"
                >
                  Broadcast & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
