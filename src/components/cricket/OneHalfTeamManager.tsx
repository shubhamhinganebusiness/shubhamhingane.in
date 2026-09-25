import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Trophy, Zap, Share2, Copy, Check, CheckCircle2, Edit2, Plus, Trash2,
  Phone, MapPin, Shield, Calendar, Clock, Play, ArrowLeftRight, Shuffle, AlertCircle,
  ExternalLink, Sparkles, X, ChevronRight, Search, FileText, UserCheck, RefreshCw, Send,
  Crown, Shirt, Upload, Camera, ImagePlus, Edit3, User, ArrowLeft, Award
} from 'lucide-react';
import { doc } from 'firebase/firestore';
import { db, isFirestoreQuotaExhausted, safeSetDoc } from '../../lib/firebase';
import { uploadImageToStorage, STORAGE_FOLDERS } from '../../utils/imageUpload';
import { OneHalfMatch, OneHalfTeam, OneHalfPlayer, OneHalfTournamentState } from './OneHalfTournamentSuite';
import { PRESET_LOCAL_CRICKET_TEAMS, LocalCricketTeamDef } from './LocalTeamsAndOneClickSetupModal';

// Expanded list of local tennis & turf cricket teams with full 15-player squads
export const EXPANDED_LOCAL_CRICKET_TEAMS: LocalCricketTeamDef[] = [
  ...PRESET_LOCAL_CRICKET_TEAMS,
  {
    id: 'local_spw',
    name: 'Shivaji Park Warriors',
    shortCode: 'SPW',
    city: 'Dadar, Mumbai',
    captain: 'Rohit Sawant',
    viceCaptain: 'Ajinkya Kadam',
    contactNumber: '+91 98200 44551',
    primaryColor: '#e11d48',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ShivajiParkWarriors&backgroundColor=e11d48',
    players: [
      'Rohit Sawant', 'Ajinkya Kadam', 'Prathamesh Parab', 'Kunal Jadhav',
      'Swapnil Shinde', 'Tanmay Bhor', 'Siddhesh More', 'Amol Chavan',
      'Nikhil Solanki', 'Vikas Tambe', 'Abhishek Rane',
      // Bench
      'Chetan Dalvi', 'Mayur Gawand', 'Omkar Patil', 'Sanket Sawant'
    ],
    playerRoles: {
      'Rohit Sawant': 'Captain & Top Batsman',
      'Ajinkya Kadam': 'Vice-Captain & All-Rounder',
      'Prathamesh Parab': 'Wicket-Keeper Batsman',
      'Kunal Jadhav': 'Fast Bowler',
      'Swapnil Shinde': 'Middle-Order Batsman',
      'Tanmay Bhor': 'Spin Bowler',
      'Siddhesh More': 'Pace Bowler',
      'Amol Chavan': 'All-Rounder',
      'Nikhil Solanki': 'Top-Order Batsman',
      'Vikas Tambe': 'Fast Bowler',
      'Abhishek Rane': 'Spin All-Rounder',
      'Chetan Dalvi': 'Reserve Batsman',
      'Mayur Gawand': 'Reserve Bowler',
      'Omkar Patil': 'Reserve All-Rounder',
      'Sanket Sawant': 'Reserve Wicket-Keeper'
    }
  },
  {
    id: 'local_dsk',
    name: 'Dadar Super Kings',
    shortCode: 'DSK',
    city: 'Dadar, Mumbai',
    captain: 'Siddhesh Lad',
    viceCaptain: 'Kunal Patil',
    contactNumber: '+91 98190 22334',
    primaryColor: '#eab308',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=DadarSuperKings&backgroundColor=eab308',
    players: [
      'Siddhesh Lad', 'Kunal Patil', 'Shubham Mane', 'Deepak Bhoir',
      'Aditya Raut', 'Hemant Keni', 'Ganesh Mhatre', 'Rupesh Tare',
      'Pravin Joshi', 'Vicky Thakre', 'Sameer Ansari',
      // Bench
      'Yogesh Koli', 'Suraj Vichare', 'Faisal Shaikh', 'Aniket Rane'
    ]
  },
  {
    id: 'local_tt',
    name: 'Thane Titans',
    shortCode: 'TTN',
    city: 'Thane West',
    captain: 'Vicky Bhoir',
    viceCaptain: 'Mandar Gharat',
    contactNumber: '+91 98690 99887',
    primaryColor: '#0ea5e9',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ThaneTitans&backgroundColor=0ea5e9',
    players: [
      'Vicky Bhoir', 'Mandar Gharat', 'Suraj Patil', 'Tushar Mhatre',
      'Nilesh Keni', 'Bhushan Vaze', 'Pramod Gondhali', 'Sujit Dalvi',
      'Kailas Tare', 'Akshay Vichare', 'Jitendra Thakur',
      // Bench
      'Sandesh Kadam', 'Sanket Shirole', 'Harsh Pawar', 'Dattatray Koli'
    ]
  },
  {
    id: 'local_mm',
    name: 'Mulund Mavericks',
    shortCode: 'MMV',
    city: 'Mulund East',
    captain: 'Chirag Shah',
    viceCaptain: 'Hardik Vora',
    contactNumber: '+91 98211 55667',
    primaryColor: '#8b5cf6',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=MulundMavericks&backgroundColor=8b5cf6',
    players: [
      'Chirag Shah', 'Hardik Vora', 'Bhavin Mehta', 'Parth Soni',
      'Dhaval Trivedi', 'Meet Joshi', 'Rohan Gada', 'Jay Somaiya',
      'Milan Shah', 'Ketan Vashi', 'Pratik Kothari',
      // Bench
      'Viren Desai', 'Yash Chheda', 'Tirth Gala', 'Nirav Sanghvi'
    ]
  },
  {
    id: 'local_aa',
    name: 'Andheri Aces',
    shortCode: 'AAC',
    city: 'Andheri East',
    captain: 'Suraj Yadav',
    viceCaptain: 'Faisal Khan',
    contactNumber: '+91 99200 11223',
    primaryColor: '#10b981',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=AndheriAces&backgroundColor=10b981',
    players: [
      'Suraj Yadav', 'Faisal Khan', 'Pradeep Shukla', 'Arun Tiwari',
      'Imran Sayed', 'Rajesh Mishra', 'Sameer Merchant', 'Mohit Jaiswal',
      'Sonu Chauhan', 'Danish Ansari', 'Amit Pandey',
      // Bench
      'Govind Bind', 'Salman Qureshi', 'Rohit Upadhyay', 'Shahbaaz Khan'
    ]
  },
  {
    id: 'local_nmn',
    name: 'Navi Mumbai Ninjas',
    shortCode: 'NMN',
    city: 'Vashi / Belapur',
    captain: 'Mangesh Gaikwad',
    viceCaptain: 'Sagar Naik',
    contactNumber: '+91 98205 77665',
    primaryColor: '#f97316',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=NaviMumbaiNinjas&backgroundColor=f97316',
    players: [
      'Mangesh Gaikwad', 'Sagar Naik', 'Rupesh Patil', 'Avinash Gharat',
      'Prathamesh Mhatre', 'Kiran Koli', 'Mahesh Bhoir', 'Tushar Thakur',
      'Dhananjay Keni', 'Roshan Madhavi', 'Sushant Bhagat',
      // Bench
      'Swapnil Darekar', 'Chetan Kathore', 'Girish Koli', 'Nikhil Tare'
    ]
  },
  {
    id: 'local_ksk',
    name: 'Karjat Super Kings',
    shortCode: 'KSK',
    city: 'Karjat, Raigad',
    captain: 'Nilesh Deshmukh',
    viceCaptain: 'Swapnil Thombare',
    contactNumber: '+91 94230 77112',
    primaryColor: '#facc15',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=KarjatSuperKings&backgroundColor=facc15',
    players: [
      'Nilesh Deshmukh', 'Swapnil Thombare', 'Amol Jadhav', 'Sachin Shinde',
      'Pradeep More', 'Ketan Ghare', 'Vaibhav Shingare', 'Ramesh Hazare',
      'Ganesh Shelke', 'Mahendra Pote', 'Santosh Darade',
      // Bench
      'Yogesh Kadam', 'Tukaram Mhasange', 'Suresh Gholap', 'Datta Zagade'
    ]
  }
];

// Helper to generate a complete 15-player balanced squad for any team name
export const generateDefault15Squad = (teamName: string, captainName?: string): OneHalfPlayer[] => {
  const cap = captainName || `Captain ${teamName.split(' ')[0] || 'Player'}`;
  const roles: Array<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'> = [
    'Batsman', 'Batsman', 'Wicket-Keeper', 'All-Rounder', 'All-Rounder',
    'Batsman', 'All-Rounder', 'Bowler', 'Bowler', 'Bowler', 'Bowler',
    // 4 bench
    'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'
  ];

  const genericSurnames = [
    'Patil', 'Kadam', 'Shinde', 'Pawar', 'More', 'Jadhav', 'Sawant',
    'Bhoir', 'Mhatre', 'Deshmukh', 'Rane', 'Chavan', 'Gaikwad', 'Joshi', 'Thakur'
  ];

  const firstNames = [
    'Rohit', 'Sachin', 'Ajinkya', 'Kunal', 'Prathamesh', 'Swapnil', 'Tanmay',
    'Siddhesh', 'Amol', 'Nikhil', 'Vikas', 'Chetan', 'Mayur', 'Omkar', 'Sanket'
  ];

  return Array.from({ length: 15 }, (_, i) => {
    const isCap = i === 0;
    const isVC = i === 1;
    const isWK = i === 2;
    const name = isCap
      ? cap
      : `${firstNames[i % firstNames.length]} ${genericSurnames[(i + teamName.length) % genericSurnames.length]}`;

    return {
      id: `p_${Date.now()}_${i + 1}`,
      name,
      role: roles[i],
      jerseyNumber: i + 1,
      isCaptain: isCap,
      isViceCaptain: isVC,
      isWicketKeeper: isWK
    };
  });
};

// Generate captain squad submission WhatsApp text
export const generateCaptainSubmissionWhatsAppUrl = (
  team: OneHalfTeam,
  tournament: OneHalfTournamentState
): string => {
  const currentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?action=submit_squad&teamId=${team.id}&tourId=${tournament.id}`
    : 'https://cricket-score.live';

  const scheduledMatch = tournament.matches.find(
    m => (m.teamA === team.name || m.teamB === team.name) && m.round === 'round1'
  );

  const text = `🏏 *OFFICIAL 15-PLAYER SQUAD SUBMISSION*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏆 *Tournament:* ${tournament.name}\n` +
    `⚔️ *Team:* ${team.name} (Group ${team.group} • Day ${team.group})\n` +
    `👤 *Captain:* ${team.captain || 'Captain'}\n` +
    `📍 *Ground:* ${tournament.groundName}\n` +
    (scheduledMatch ? `⏰ *Match 1 Toss:* ${scheduledMatch.time || '08:30 AM'} (Report: ${scheduledMatch.reportingTime || '08:00 AM'})\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Dear Captain, please submit your verified *15-Player Squad (Playing 11 + 4 Substitutes)* for digital scoreboard registration and ground verification.\n\n` +
    `👉 *Click here to submit your squad online:*\n${currentUrl}\n\n` +
    `_Or reply with your list of 15 players in this format:_\n` +
    `1. Captain Name (C)\n` +
    `2. Vice Captain (VC)\n` +
    `3. Wicket Keeper (WK)\n` +
    `4-11. Playing Squad\n` +
    `12-15. Bench / Substitutes\n\n` +
    `⚠️ *Important:* Submission must be completed before toss!`;

  const phone = (team.captainPhone || '').replace(/\D/g, '');
  if (phone) {
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
};

// -------------------------------------------------------------
// Dedicated Team Page View Component
// -------------------------------------------------------------
interface TeamDedicatedPageViewProps {
  team: OneHalfTeam;
  tournament: OneHalfTournamentState;
  onUpdateTeam: (updatedTeam: OneHalfTeam) => void;
  onSelectAnotherTeam: (teamId: string) => void;
  onStartLiveMatchWithSquad: (team: OneHalfTeam) => void;
  onBackToBracket: () => void;
  showToast: (msg: string) => void;
}

export const TeamDedicatedPageView: React.FC<TeamDedicatedPageViewProps> = ({
  team,
  tournament,
  onUpdateTeam,
  onSelectAnotherTeam,
  onStartLiveMatchWithSquad,
  onBackToBracket,
  showToast
}) => {
  const [showLocalDirectoryModal, setShowLocalDirectoryModal] = useState(false);
  const [showCaptainPortalModal, setShowCaptainPortalModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const p = new URLSearchParams(window.location.search);
        return p.get('action') === 'submit_squad' && p.get('teamId') === team.id;
      } catch (_) {}
    }
    return false;
  });
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);

  // Editable team info state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [editCaptain, setEditCaptain] = useState(team.captain || '');
  const [editPhone, setEditPhone] = useState(team.captainPhone || '');
  const [editViceCaptain, setEditViceCaptain] = useState(team.viceCaptain || '');
  const [editWicketKeeper, setEditWicketKeeper] = useState(team.wicketKeeper || '');
  const [editCoach, setEditCoach] = useState(team.coach || '');
  const [editCity, setEditCity] = useState(team.city || 'Mumbai / Maharashtra');

  // Squad list
  const squad = useMemo(() => {
    if (team.squad && team.squad.length > 0) return team.squad;
    return generateDefault15Squad(team.name, team.captain);
  }, [team]);

  const playing11 = squad.slice(0, 11);
  const benchSubstitutes = squad.slice(11, 15);

  const scheduledMatch = tournament.matches.find(
    m => (m.teamA === team.name || m.teamB === team.name) && m.status !== 'completed'
  ) || tournament.matches.find(m => m.teamA === team.name || m.teamB === team.name);

  const opponentName = scheduledMatch
    ? (scheduledMatch.teamA === team.name ? scheduledMatch.teamB : scheduledMatch.teamA)
    : null;

  const handleSaveTeamInfo = () => {
    const updated: OneHalfTeam = {
      ...team,
      name: editName.trim() || team.name,
      captain: editCaptain.trim() || team.captain,
      captainPhone: editPhone.trim(),
      viceCaptain: editViceCaptain.trim(),
      wicketKeeper: editWicketKeeper.trim(),
      coach: editCoach.trim(),
      city: editCity.trim()
    };
    onUpdateTeam(updated);
    setIsEditingInfo(false);
    showToast(`✓ Updated ${updated.name} profile!`);
  };

  const handleUpdatePlayer = (index: number, field: keyof OneHalfPlayer, value: any) => {
    const updatedSquad = [...squad];
    updatedSquad[index] = { ...updatedSquad[index], [field]: value };
    onUpdateTeam({ ...team, squad: updatedSquad });
  };

  const handleToggleCaptain = (index: number) => {
    const updatedSquad = squad.map((p, i) => ({
      ...p,
      isCaptain: i === index
    }));
    const newCapName = updatedSquad[index]?.name || team.captain;
    onUpdateTeam({ ...team, squad: updatedSquad, captain: newCapName });
    showToast(`👑 Assigned ${newCapName} as Team Captain`);
  };

  const handleToggleWK = (index: number) => {
    const updatedSquad = squad.map((p, i) => ({
      ...p,
      isWicketKeeper: i === index ? !p.isWicketKeeper : false
    }));
    const isWkNow = updatedSquad[index]?.isWicketKeeper;
    onUpdateTeam({
      ...team,
      squad: updatedSquad,
      wicketKeeper: isWkNow ? updatedSquad[index].name : ''
    });
    showToast(isWkNow ? `🧤 Assigned ${updatedSquad[index].name} as Wicket-Keeper` : 'Wicket-Keeper tag removed');
  };

  const handleApplyPresetLocalTeam = (localTeam: LocalCricketTeamDef) => {
    const newSquad: OneHalfPlayer[] = localTeam.players.map((pName, i) => {
      const roleStr = localTeam.playerRoles?.[pName] || '';
      let role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper' = 'Batsman';
      if (roleStr.includes('Keeper')) role = 'Wicket-Keeper';
      else if (roleStr.includes('Bowler')) role = 'Bowler';
      else if (roleStr.includes('All-Rounder')) role = 'All-Rounder';
      else if (i >= 7 && i <= 10) role = 'Bowler';
      else if (i >= 3 && i <= 5) role = 'All-Rounder';
      else if (i === 2) role = 'Wicket-Keeper';

      return {
        id: `p_${Date.now()}_${i}`,
        name: pName,
        role,
        jerseyNumber: i + 1,
        isCaptain: pName === localTeam.captain || i === 0,
        isViceCaptain: pName === localTeam.viceCaptain || i === 1,
        isWicketKeeper: role === 'Wicket-Keeper' || i === 2
      };
    });

    const updated: OneHalfTeam = {
      ...team,
      name: localTeam.name,
      captain: localTeam.captain,
      captainPhone: localTeam.contactNumber,
      viceCaptain: localTeam.viceCaptain,
      city: localTeam.city,
      primaryColor: localTeam.primaryColor,
      logo: localTeam.logo,
      squad: newSquad,
      squadSubmitted: true,
      squadSubmittedAt: new Date().toISOString()
    };

    onUpdateTeam(updated);
    setShowLocalDirectoryModal(false);
    showToast(`⚡ 1-Click Setup Complete! Imported ${localTeam.name} with 15-player squad.`);
  };

  const handleAutoFill15Squad = () => {
    const generated = generateDefault15Squad(team.name, team.captain);
    onUpdateTeam({
      ...team,
      squad: generated,
      squadSubmitted: true,
      squadSubmittedAt: new Date().toISOString()
    });
    showToast(`⚡ Auto-Generated 15-Player Squad for ${team.name}!`);
  };

  const shareWhatsAppUrl = generateCaptainSubmissionWhatsAppUrl(team, tournament);

  const handleCopySubmissionLink = () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?action=submit_squad&teamId=${team.id}&tourId=${tournament.id}`
      : 'https://cricket-score.live';
    navigator.clipboard?.writeText(url);
    showToast('✓ Squad submission link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Quick Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToBracket}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer transition"
          >
            ← Back to Bracket
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Group {team.group} (Day {team.group})
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-xs font-black text-amber-500 truncate max-w-[180px] sm:max-w-none">
            {team.name}
          </span>
        </div>

        {/* 32 Team Dropdown Picker */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Switch Team:
          </label>
          <select
            value={team.id}
            onChange={(e) => onSelectAnotherTeam(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer"
          >
            {[1, 2, 3, 4].map(g => (
              <optgroup key={g} label={`Group ${g} (Day ${g})`}>
                {tournament.teams.filter(t => t.group === g).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.squad?.length || 15} players)
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Team Profile Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield size={160} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Team Details */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                Group {team.group} • Day {team.group} Knockout
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Users size={12} />
                15-Player Official Squad
              </span>
              {team.squadSubmitted ? (
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  Squad Verified
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Clock size={12} />
                  Pre-Populated / Pending Captain Confirmation
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center font-black text-2xl text-amber-300 shadow-md">
                🏏
              </div>
              <div>
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  {team.name}
                </h1>
                <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                  <MapPin size={12} className="text-amber-400 shrink-0" />
                  <span>{team.city || 'Mumbai, Maharashtra'}</span>
                  <span>•</span>
                  <span>Ground: {tournament.groundName}</span>
                </p>
              </div>
            </div>

            {/* Captain & Leadership info pill */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-[9px] uppercase font-black tracking-widest text-amber-300 block">👑 Captain</span>
                <span className="text-xs font-black text-white truncate block">{team.captain || 'Not Set'}</span>
                {team.captainPhone && (
                  <span className="text-[9px] font-mono text-slate-300">{team.captainPhone}</span>
                )}
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-300 block">🥈 Vice-Captain</span>
                <span className="text-xs font-black text-white truncate block">{team.viceCaptain || squad[1]?.name || 'Not Set'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-300 block">🧤 Wicket-Keeper</span>
                <span className="text-xs font-black text-white truncate block">{team.wicketKeeper || squad.find(p => p.isWicketKeeper)?.name || squad[2]?.name}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
                <span className="text-[9px] uppercase font-black tracking-widest text-cyan-300 block">🏟️ Next Match</span>
                <span className="text-xs font-black text-white truncate block">
                  {opponentName ? `vs ${opponentName}` : 'Day 1 Knockout'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Stack: 1-Click Scoreboard + Local Directory + Captain Link */}
          <div className="flex flex-col gap-2.5 shrink-0 sm:min-w-[280px]">
            {/* 1-Click Live Scoreboard Setup Primary Button */}
            <button
              type="button"
              onClick={() => onStartLiveMatchWithSquad(team)}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 border-none cursor-pointer"
            >
              <Zap size={16} className="text-amber-300" />
              <span>1-Click Live Scoreboard Setup</span>
            </button>

            {/* Local Cricket Teams 1-Click Import Button */}
            <button
              type="button"
              onClick={() => setShowLocalDirectoryModal(true)}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 border-none cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Local Cricket Teams & 1-Click Setup</span>
            </button>

            {/* Open Captain Portal (Quick Scorer Style) Button */}
            <button
              type="button"
              onClick={() => setShowCaptainPortalModal(true)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500/25 via-amber-400/35 to-emerald-500/25 hover:from-amber-500/35 hover:to-emerald-500/35 text-amber-300 border border-amber-400/50 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-md"
            >
              <Crown size={15} className="text-amber-400" />
              <span>👑 Open Captain Portal (Quick Scorer Style)</span>
            </button>

            {/* Send Link to Captain Button */}
            <a
              href={shareWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-2xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition active:scale-95 no-underline"
            >
              <Send size={14} />
              <span>Send 15-Squad Link on WhatsApp</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySubmissionLink}
                className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10 cursor-pointer"
              >
                <Copy size={12} />
                <span>Copy Portal Link</span>
              </button>
              <button
                type="button"
                onClick={handleAutoFill15Squad}
                className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 border border-white/10 cursor-pointer"
                title="Auto-Fill 15 Squad"
              >
                <Sparkles size={12} />
                <span>Auto-Fill</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Team Info Drawer / Collapsible */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 size={15} className="text-amber-500" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
              Team Identity & Captain Information
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingInfo(!isEditingInfo)}
            className="text-[10px] font-black uppercase px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border-none cursor-pointer transition"
          >
            {isEditingInfo ? 'Cancel' : 'Edit Info'}
          </button>
        </div>

        {isEditingInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Team Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Captain Name
              </label>
              <input
                type="text"
                value={editCaptain}
                onChange={e => setEditCaptain(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Captain Phone / WhatsApp
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="+91 98200 00000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Vice-Captain
              </label>
              <input
                type="text"
                value={editViceCaptain}
                onChange={e => setEditViceCaptain(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Wicket-Keeper
              </label>
              <input
                type="text"
                value={editWicketKeeper}
                onChange={e => setEditWicketKeeper(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                Home City / Locality
              </label>
              <input
                type="text"
                value={editCity}
                onChange={e => setEditCity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTeamInfo}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider border-none cursor-pointer shadow-md"
              >
                Save Details
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Captain</span>
              <strong className="text-slate-800 dark:text-slate-200">{team.captain || 'Not Set'}</strong>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Contact</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{team.captainPhone || 'Not Set'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">Vice-Captain</span>
              <span className="text-slate-700 dark:text-slate-300">{team.viceCaptain || 'Not Set'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">City</span>
              <span className="text-slate-700 dark:text-slate-300">{team.city || 'Mumbai / Maharashtra'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Official 15-Player Squad Management Strip */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={18} className="text-emerald-500" />
              Official 15-Player Squad & Roles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Positions 1 to 11 represent the <strong>Starting Playing XI</strong>. Positions 12 to 15 are <strong>Bench / Substitutes</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Captain Portal Button */}
            <button
              type="button"
              onClick={() => setShowCaptainPortalModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer transition shadow-sm"
              title="Open full Captain Portal (Quick Scorer Style) to submit squad & photos"
            >
              <Crown size={13} />
              <span>👑 Captain Portal</span>
            </button>

            {/* Bulk Paste Button */}
            <button
              type="button"
              onClick={() => setShowBulkPasteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer transition"
            >
              <FileText size={13} />
              <span>Paste 15 Names</span>
            </button>

            {/* Auto Fill Button */}
            <button
              type="button"
              onClick={handleAutoFill15Squad}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition"
            >
              <RefreshCw size={13} />
              <span>Reset 15 Squad</span>
            </button>
          </div>
        </div>

        {/* Section 1: Starting XI (1 to 11) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] font-black">
                11
              </span>
              Starting Playing XI (Toss & Match Squad)
            </span>
            <span className="text-[10px] font-bold text-slate-400">Slots 1 to 11</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {playing11.map((player, idx) => (
              <div
                key={player.id || idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} className="w-7 h-7 rounded-xl object-cover shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs" />
                  ) : (
                    <span className="w-6 h-6 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-black shrink-0 font-mono">
                      {idx + 1}
                    </span>
                  )}
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {player.name}
                      </span>
                      {player.isCaptain && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 border border-amber-400/30 text-[9px] font-black shrink-0">
                          (C)
                        </span>
                      )}
                      {player.isViceCaptain && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-500 text-[9px] font-black shrink-0">
                          (VC)
                        </span>
                      )}
                      {player.isWicketKeeper && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 border border-emerald-400/30 text-[9px] font-black shrink-0">
                          🧤 WK
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block truncate">
                      {idx === 0 || idx === 1 ? 'Opening Batsman' : player.role} • #{player.jerseyNumber || idx + 1}
                    </span>
                  </div>
                </div>

                {/* Quick Role & Captain Selector Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleCaptain(idx)}
                    className={`p-1.5 rounded-lg border text-[10px] font-black cursor-pointer transition ${
                      player.isCaptain
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:text-amber-500'
                    }`}
                    title="Make Captain"
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleWK(idx)}
                    className={`p-1.5 rounded-lg border text-[10px] font-black cursor-pointer transition ${
                      player.isWicketKeeper
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800 hover:text-emerald-500'
                    }`}
                    title="Toggle Wicket Keeper"
                  >
                    🧤
                  </button>
                  <select
                    value={player.role}
                    onChange={(e) => handleUpdatePlayer(idx, 'role', e.target.value)}
                    className="bg-slate-200 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Batsman">Bat</option>
                    <option value="Bowler">Bowl</option>
                    <option value="All-Rounder">All-R</option>
                    <option value="Wicket-Keeper">WK</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Bench / Substitutes (12 to 15) */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] font-black">
                4
              </span>
              Bench / Reserve Substitutes
            </span>
            <span className="text-[10px] font-bold text-slate-400">Slots 12 to 15</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {benchSubstitutes.map((player, bIdx) => {
              const actualIdx = 11 + bIdx;
              return (
                <div
                  key={player.id || actualIdx}
                  className="p-3 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="w-7 h-7 rounded-xl object-cover shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs" />
                    ) : (
                      <span className="w-6 h-6 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-black shrink-0 font-mono">
                        {actualIdx + 1}
                      </span>
                    )}
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block">
                        Reserve {player.role} • #{player.jerseyNumber || actualIdx + 1}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <select
                      value={player.role}
                      onChange={(e) => handleUpdatePlayer(actualIdx, 'role', e.target.value)}
                      className="bg-slate-200 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                    >
                      <option value="Batsman">Bat</option>
                      <option value="Bowler">Bowl</option>
                      <option value="All-Rounder">All-R</option>
                      <option value="Wicket-Keeper">WK</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Local Cricket Teams & 1-Click Setup Modal */}
      <AnimatePresence>
        {showLocalDirectoryModal && (
          <LocalTeamsDirectoryModal
            onClose={() => setShowLocalDirectoryModal(false)}
            onSelectTeam={handleApplyPresetLocalTeam}
          />
        )}
      </AnimatePresence>

      {/* Captain Squad Submission Portal Modal */}
      <AnimatePresence>
        {showCaptainPortalModal && (
          <CaptainSquadSubmissionModal
            team={team}
            tournament={tournament}
            onClose={() => setShowCaptainPortalModal(false)}
            onSaveSquad={(updatedTeam) => {
              onUpdateTeam(updatedTeam);
              setShowCaptainPortalModal(false);
              showToast(`✓ Captain squad successfully submitted for ${updatedTeam.name}!`);
            }}
          />
        )}
      </AnimatePresence>

      {/* Bulk Paste 15 Names Modal */}
      <AnimatePresence>
        {showBulkPasteModal && (
          <BulkPasteSquadModal
            currentSquad={squad}
            onClose={() => setShowBulkPasteModal(false)}
            onApplySquad={(parsedSquad) => {
              onUpdateTeam({ ...team, squad: parsedSquad, squadSubmitted: true });
              setShowBulkPasteModal(false);
              showToast('✓ 15-Player squad parsed and applied!');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// -------------------------------------------------------------
// Local Cricket Teams Directory Modal (1-Click Setup)
// -------------------------------------------------------------
interface LocalTeamsDirectoryModalProps {
  onClose: () => void;
  onSelectTeam: (team: LocalCricketTeamDef) => void;
}

export const LocalTeamsDirectoryModal: React.FC<LocalTeamsDirectoryModalProps> = ({
  onClose,
  onSelectTeam
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');

  const filteredTeams = useMemo(() => {
    return EXPANDED_LOCAL_CRICKET_TEAMS.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.captain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCity = selectedCity === 'all' || t.city.toLowerCase().includes(selectedCity.toLowerCase());
      return matchSearch && matchCity;
    });
  }, [searchTerm, selectedCity]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative z-10 w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <Sparkles size={13} />
              Local Cricket Teams Directory
            </span>
            <h3 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">
              Local Cricket Teams & 1-Click Setup
            </h3>
            <p className="text-xs text-slate-400">
              Select any local gully, turf, or club cricket team to instantly populate a complete <strong>15-player squad</strong> with verified names, captain, and roles!
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & City Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search team name, city, captain..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none cursor-pointer"
          >
            <option value="all">All Regions</option>
            <option value="mumbai">Mumbai</option>
            <option value="pune">Pune</option>
            <option value="thane">Thane</option>
            <option value="raigad">Raigad / Karjat</option>
            <option value="nashik">Nashik</option>
            <option value="kolhapur">Kolhapur</option>
          </select>
        </div>

        {/* Directory Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredTeams.map((teamDef) => (
            <div
              key={teamDef.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 text-sm shadow-md"
                  style={{ backgroundColor: teamDef.primaryColor || '#e11d48' }}
                >
                  {teamDef.shortCode || teamDef.name.substring(0, 3).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase text-white group-hover:text-amber-400 transition">
                    {teamDef.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin size={11} className="text-amber-500" />
                      {teamDef.city}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">👑 Captain: {teamDef.captain}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">15 Players Ready</span>
                  </div>

                  {/* Player Preview Pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {teamDef.players.slice(0, 5).map((p, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-medium"
                      >
                        {p}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] text-slate-500 font-bold">
                      +{teamDef.players.length - 5} more
                    </span>
                  </div>
                </div>
              </div>

              {/* 1-Click Import Button */}
              <button
                type="button"
                onClick={() => onSelectTeam(teamDef)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95 border-none cursor-pointer shrink-0 shadow-md"
              >
                <Zap size={14} className="text-amber-300" />
                <span>1-Click Setup</span>
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------
// Helper to compress image files client-side to lightweight JPEG data URLs (~15-30KB)
// -------------------------------------------------------------
const compressImageFile = (file: File, maxDim = 320, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const ONE_HALF_ROLES: Array<{ key: OneHalfPlayer['role']; label: string; icon: string }> = [
  { key: 'Batsman', label: 'Batsman', icon: '🏏' },
  { key: 'Bowler', label: 'Bowler', icon: '🎯' },
  { key: 'All-Rounder', label: 'All-Rounder', icon: '⚡' },
  { key: 'Wicket-Keeper', label: 'Wicket-Keeper', icon: '🧤' },
];

// -------------------------------------------------------------
// Captain Squad Submission Portal Modal (Matching Quick Scorer Captain Portal)
// -------------------------------------------------------------
interface CaptainSquadSubmissionModalProps {
  team: OneHalfTeam;
  tournament: OneHalfTournamentState;
  onClose: () => void;
  onSaveSquad: (updatedTeam: OneHalfTeam) => void;
}

export const CaptainSquadSubmissionModal: React.FC<CaptainSquadSubmissionModalProps> = ({
  team,
  tournament,
  onClose,
  onSaveSquad
}) => {
  const [teamName, setTeamName] = useState<string>(team.name);
  const [teamLogo, setTeamLogo] = useState<string>(team.logo || '');
  const [captainName, setCaptainName] = useState<string>(team.captain || '');
  const [captainPhone, setCaptainPhone] = useState<string>(team.captainPhone || '');
  const [viceCaptain, setViceCaptain] = useState<string>(team.viceCaptain || '');
  const [wicketKeeper, setWicketKeeper] = useState<string>(team.wicketKeeper || '');

  // Initialize 15 players with details
  const [players, setPlayers] = useState<OneHalfPlayer[]>(() => {
    if (team.squad && team.squad.length > 0) {
      return team.squad.map((p, idx) => ({
        ...p,
        id: p.id || `p_${team.id}_${idx}_${Date.now()}`,
        jerseyNumber: p.jerseyNumber || `${idx + 1}`,
        mobileNumber: p.mobileNumber || p.phone || (p.isCaptain ? team.captainPhone : ''),
        photo: p.photo || ''
      }));
    }
    const def = generateDefault15Squad(team.name, team.captain);
    return def.map((p, idx) => ({
      ...p,
      jerseyNumber: idx + 1,
      mobileNumber: p.isCaptain ? (team.captainPhone || '') : '',
      photo: ''
    }));
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(Boolean(team.squadSubmitted));
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showInlinePaste, setShowInlinePaste] = useState<boolean>(false);
  const [pasteInputText, setPasteInputText] = useState<string>('');

  const teamLogoInputRef = useRef<HTMLInputElement>(null);

  // AUTOMATIC SYNC: When user updates Captain Name in the top form,
  // sync to the captain player in the squad!
  const handleCaptainNameChange = (newName: string) => {
    setCaptainName(newName);
    setPlayers(prev => {
      const captainIndex = prev.findIndex(p => p.isCaptain);
      if (captainIndex !== -1) {
        const updated = [...prev];
        updated[captainIndex] = { ...updated[captainIndex], name: newName };
        return updated;
      }
      if (prev.length > 0) {
        const updated = [...prev];
        updated[0] = { ...updated[0], isCaptain: true, name: newName };
        return updated;
      }
      return prev;
    });
  };

  // AUTOMATIC SYNC: When user updates Captain Phone, sync to captain player
  const handleCaptainPhoneChange = (newPhone: string) => {
    setCaptainPhone(newPhone);
    setPlayers(prev => {
      const captainIndex = prev.findIndex(p => p.isCaptain);
      if (captainIndex !== -1 && !prev[captainIndex].mobileNumber) {
        const updated = [...prev];
        updated[captainIndex] = { ...updated[captainIndex], mobileNumber: newPhone, phone: newPhone };
        return updated;
      }
      return prev;
    });
  };

  // Team Logo upload handler
  const handleTeamLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({ text: 'Please upload a valid image file (PNG, JPG, WebP).', type: 'error' });
      return;
    }

    try {
      setFeedbackMsg({ text: 'Uploading team logo to Firebase Storage...', type: 'info' });
      const result = await uploadImageToStorage(file, { folder: STORAGE_FOLDERS.TEAMS, maxWidth: 200, quality: 0.85 });
      setTeamLogo(result.url);
      setFeedbackMsg({ text: '✓ Team logo uploaded to Firebase Storage successfully!', type: 'success' });
    } catch (err: any) {
      console.warn('Logo upload note:', err);
      try {
        const compressedUrl = await compressImageFile(file, 300, 0.85);
        setTeamLogo(compressedUrl);
        setFeedbackMsg({ text: '✓ Team logo saved locally.', type: 'info' });
      } catch {
        setFeedbackMsg({ text: 'Failed to process team logo image.', type: 'error' });
      }
    }
    if (teamLogoInputRef.current) teamLogoInputRef.current.value = '';
  };

  const handleRemoveTeamLogo = () => {
    setTeamLogo('');
    if (teamLogoInputRef.current) teamLogoInputRef.current.value = '';
  };

  // Player photo upload handler
  const handlePlayerPhotoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({ text: 'Please select an image file for player photo.', type: 'error' });
      return;
    }

    try {
      setFeedbackMsg({ text: `Uploading photo for player #${idx + 1}...`, type: 'info' });
      const result = await uploadImageToStorage(file, {
        folder: STORAGE_FOLDERS.PLAYERS,
        maxWidth: 200,
        quality: 0.85,
        cropSquare: true
      });
      handleUpdatePlayer(idx, 'photo', result.url);
      setFeedbackMsg({ text: `✓ Player #${idx + 1} photo uploaded!`, type: 'success' });
    } catch (err: any) {
      console.warn('Player photo upload note:', err);
      try {
        const compressedData = await compressImageFile(file, 240, 0.85);
        handleUpdatePlayer(idx, 'photo', compressedData);
        setFeedbackMsg({ text: `✓ Player #${idx + 1} photo saved locally.`, type: 'info' });
      } catch {
        setFeedbackMsg({ text: 'Failed to process player photo.', type: 'error' });
      }
    }
  };

  // Add new player slot (up to 15 players)
  const handleAddPlayer = () => {
    if (players.length >= 15) {
      setFeedbackMsg({ text: 'A maximum of 15 squad players can be submitted.', type: 'info' });
      return;
    }
    const newIdx = players.length + 1;
    const newPlayer: OneHalfPlayer = {
      id: `p_${team.id}_${Date.now()}_${newIdx}`,
      name: '',
      role: 'All-Rounder',
      jerseyNumber: newIdx,
      isCaptain: false,
      isViceCaptain: false,
      isWicketKeeper: false,
      mobileNumber: '',
      photo: ''
    };
    setPlayers(prev => [...prev, newPlayer]);
  };

  // Remove player slot
  const handleRemovePlayer = (idxToRemove: number) => {
    if (players.length <= 2) {
      setFeedbackMsg({ text: 'Squad must have at least 2 players.', type: 'info' });
      return;
    }
    const wasCaptain = players[idxToRemove]?.isCaptain;
    setPlayers(prev => {
      const next = prev.filter((_, idx) => idx !== idxToRemove);
      if (wasCaptain && next.length > 0) {
        next[0].isCaptain = true;
        setCaptainName(next[0].name || '');
      }
      return next;
    });
  };

  // Update a single player field
  const handleUpdatePlayer = (idx: number, field: keyof OneHalfPlayer, value: any) => {
    setPlayers(prev => {
      const updated = [...prev];
      if (field === 'isCaptain') {
        if (value === true) {
          updated.forEach((p, i) => {
            if (i !== idx) p.isCaptain = false;
          });
          const assignedName = updated[idx].name || captainName;
          updated[idx].name = assignedName;
          setCaptainName(assignedName);
        }
      }

      if (field === 'isViceCaptain') {
        if (value === true) {
          updated.forEach((p, i) => {
            if (i !== idx) p.isViceCaptain = false;
          });
          setViceCaptain(updated[idx].name || '');
        }
      }

      if (field === 'isWicketKeeper') {
        if (value === true) {
          updated.forEach((p, i) => {
            if (i !== idx) p.isWicketKeeper = false;
          });
          updated[idx].role = 'Wicket-Keeper';
          setWicketKeeper(updated[idx].name || '');
        }
      }

      if (field === 'name' && updated[idx].isCaptain) {
        setCaptainName(value);
      }

      if ((field === 'mobileNumber' || field === 'phone') && updated[idx].isCaptain) {
        setCaptainPhone(value);
      }

      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // 1-Click Auto Fill 15 Players
  const handleAutoFillSquad = () => {
    const generated = generateDefault15Squad(teamName || team.name, captainName || team.captain);
    setPlayers(generated.map((p, idx) => ({
      ...p,
      jerseyNumber: idx + 1,
      mobileNumber: p.isCaptain ? captainPhone : ''
    })));
    setFeedbackMsg({ text: '✓ 15 local player names auto-filled!', type: 'success' });
  };

  // Parse inline WhatsApp roster
  const handleParseInlinePaste = () => {
    if (!pasteInputText.trim()) return;

    const lines = pasteInputText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const parsed: OneHalfPlayer[] = [];
    const roles: Array<OneHalfPlayer['role']> = [
      'Batsman', 'Batsman', 'Wicket-Keeper', 'All-Rounder', 'All-Rounder',
      'Batsman', 'All-Rounder', 'Bowler', 'Bowler', 'Bowler', 'Bowler',
      'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'
    ];

    for (let i = 0; i < 15; i++) {
      let line = lines[i] || '';
      line = line.replace(/^[\d]+[\.\)\-\:\s]+/, '').trim();

      const isCap = line.toLowerCase().includes('(c)') || (!line.toLowerCase().includes('(vc)') && i === 0);
      const isVC = line.toLowerCase().includes('(vc)') || i === 1;
      const isWK = line.toLowerCase().includes('(wk)') || line.toLowerCase().includes('keeper') || i === 2;

      let cleanName = line
        .replace(/\((C|c|VC|vc|WK|wk)\)/gi, '')
        .replace(/🧤|👑|⭐|⚡|🏏/g, '')
        .trim();

      if (!cleanName && i < lines.length) {
        cleanName = `Player ${i + 1}`;
      } else if (!cleanName) {
        cleanName = players[i]?.name || `Player ${i + 1}`;
      }

      parsed.push({
        id: `p_${team.id}_${Date.now()}_${i}`,
        name: cleanName,
        role: isWK ? 'Wicket-Keeper' : roles[i] || 'All-Rounder',
        jerseyNumber: i + 1,
        isCaptain: isCap,
        isViceCaptain: isVC && !isCap,
        isWicketKeeper: isWK,
        mobileNumber: isCap ? captainPhone : '',
        photo: players[i]?.photo || ''
      });
    }

    setPlayers(parsed);
    const capP = parsed.find(p => p.isCaptain);
    if (capP && capP.name) setCaptainName(capP.name);
    const vcP = parsed.find(p => p.isViceCaptain);
    if (vcP && vcP.name) setViceCaptain(vcP.name);
    const wkP = parsed.find(p => p.isWicketKeeper);
    if (wkP && wkP.name) setWicketKeeper(wkP.name);

    setShowInlinePaste(false);
    setPasteInputText('');
    setFeedbackMsg({ text: `✓ Successfully parsed ${lines.length} players from WhatsApp roster!`, type: 'success' });
  };

  // Submit Squad to Score Manager
  const handleFinalSubmit = async () => {
    const validPlayers = players.filter(p => p.name.trim().length > 0);

    if (!teamName.trim()) {
      setFeedbackMsg({ text: 'Please provide a Team Name.', type: 'error' });
      return;
    }

    if (validPlayers.length < 2) {
      setFeedbackMsg({ text: 'Please add at least 2 player names.', type: 'error' });
      return;
    }

    // Ensure at least one captain is marked
    const captainPlayer = validPlayers.find(p => p.isCaptain) || validPlayers[0];
    if (captainPlayer) {
      captainPlayer.isCaptain = true;
    }

    const wkPlayer = validPlayers.find(p => p.isWicketKeeper);

    setSubmitting(true);
    setFeedbackMsg(null);

    const updatedTeam: OneHalfTeam = {
      ...team,
      name: teamName.trim() || team.name,
      logo: teamLogo.trim() || team.logo,
      captain: captainName.trim() || captainPlayer?.name || team.captain,
      captainPhone: captainPhone.trim() || captainPlayer?.mobileNumber || '',
      viceCaptain: viceCaptain.trim() || validPlayers[1]?.name || team.viceCaptain,
      wicketKeeper: wkPlayer ? wkPlayer.name : (team.wicketKeeper || validPlayers[2]?.name),
      squad: players,
      squadSubmitted: true,
      squadSubmittedAt: new Date().toISOString()
    };

    // Save to Firestore under cricket_teams collection if available
    try {
      if (!isFirestoreQuotaExhausted()) {
        const teamDocPayload = {
          id: team.id,
          name: updatedTeam.name,
          logo: updatedTeam.logo || '',
          captainName: updatedTeam.captain || '',
          captainPhone: updatedTeam.captainPhone || '',
          players: validPlayers.map(p => `${p.name}${p.isCaptain ? ' (C)' : ''}${p.isViceCaptain ? ' (VC)' : ''}${p.isWicketKeeper ? ' (WK)' : ''}`),
          squadDetails: validPlayers,
          status: 'squad_submitted',
          tournamentId: tournament.id,
          group: team.group,
          updatedAt: Date.now()
        };
        await safeSetDoc(doc(db, 'cricket_teams', team.id), teamDocPayload, { merge: true });
      }
    } catch (err) {
      console.warn('Firestore team squad save note:', err);
    }

    // Pass to parent tournament state
    onSaveSquad(updatedTeam);
    setSubmitting(false);
    setSubmitted(true);
    setFeedbackMsg({ text: '✓ 15-Player Squad submitted successfully to the Score Manager!', type: 'success' });
  };

  const validCount = players.filter(p => p.name.trim().length > 0).length;

  return (
    <div className="fixed inset-0 z-[350] p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-start justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/60 rounded-3xl p-5 sm:p-8 shadow-2xl text-white my-4 sm:my-6 space-y-6"
      >
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft size={16} />
            Back to Tournament Bracket
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-extrabold uppercase tracking-widest border border-emerald-500/20">
              <Sparkles size={12} className="text-amber-400" /> Captain Portal
            </span>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
              Group {team.group} (Day {team.group})
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl border-none cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Header Hero Card */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/60 rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <Users size={13} /> Official 15-Player Match Squad Entry
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${
                  validCount >= 11
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {validCount >= 11 ? '✓ Playing XI Ready' : `${validCount} / 15 Players`}
                </span>
                {submitted && (
                  <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={12} /> Submitted
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {teamLogo ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 p-1.5 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
                  <img src={teamLogo} alt={teamName || 'Team Logo'} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/70 border border-slate-700/80 flex items-center justify-center shrink-0 text-slate-500">
                  <Shield size={32} className="text-slate-600" />
                </div>
              )}

              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-1">
                  {teamName || 'Submit Team Squad'}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                  Enter your team details, logo, and 15-player squad roster. Photos, jersey numbers, and captain badges sync live to the official match scorecard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : feedbackMsg.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-slate-400 hover:text-white text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submitted Confirmation Banner */}
        {submitted && (
          <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-emerald-400">Squad Submitted & Ready!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The score manager can now load <span className="text-white font-bold">{teamName}</span> into the match scorecard in 1-click.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
            >
              <Edit3 size={13} /> Edit Squad Details
            </button>
          </div>
        )}

        {/* Team Details Inputs Card with Team Logo Option */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-3xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
              <Shield size={14} /> Team Profile & Captain Details
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">15-Player Official Roster</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
            {/* Team Logo Upload Box */}
            <div className="lg:col-span-1 bg-slate-900/90 border border-slate-750 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ImagePlus size={11} className="text-emerald-400" /> Team Logo
              </label>

              <input
                ref={teamLogoInputRef}
                type="file"
                accept="image/*"
                onChange={handleTeamLogoUpload}
                className="hidden"
              />

              {teamLogo ? (
                <div className="relative group w-20 h-20 rounded-2xl bg-slate-950 border border-emerald-500/40 p-1 flex items-center justify-center overflow-hidden shadow-md">
                  <img src={teamLogo} alt="Team Logo" className="w-full h-full object-contain rounded-xl" />
                  <button
                    type="button"
                    onClick={handleRemoveTeamLogo}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg opacity-90 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                    title="Remove Logo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => teamLogoInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-900 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer p-2"
                >
                  <Upload size={18} />
                  <span className="text-[9px] font-black uppercase leading-tight">Upload</span>
                </button>
              )}

              <div className="w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => teamLogoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Camera size={11} /> {teamLogo ? 'Change Logo' : 'Add Team Logo'}
                </button>
              </div>
            </div>

            {/* Team, Captain Name & Phone Inputs */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Team Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="E.g. Jamkhed Lions"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1">
                  <Crown size={12} className="text-amber-400" /> Captain Name (Auto-adds to squad)
                </label>
                <input
                  type="text"
                  value={captainName}
                  onChange={(e) => handleCaptainNameChange(e.target.value)}
                  placeholder="E.g. Rohit Sharma"
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Phone size={11} /> Captain Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={captainPhone}
                  onChange={(e) => handleCaptainPhoneChange(e.target.value)}
                  placeholder="E.g. 98200 44551"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible WhatsApp Roster Bulk Paste Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                Bulk Paste WhatsApp Squad (1-Click Parse)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowInlinePaste(!showInlinePaste)}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              {showInlinePaste ? 'Close Box' : '📋 Paste Roster'}
            </button>
          </div>

          {showInlinePaste && (
            <div className="mt-3 space-y-2 pt-3 border-t border-slate-800">
              <p className="text-[11px] text-slate-400">
                Paste 15 player lines from WhatsApp. Auto-detects numbers, <strong>(C)</strong>, <strong>(VC)</strong>, and <strong>(WK)</strong>.
              </p>
              <textarea
                rows={5}
                value={pasteInputText}
                onChange={e => setPasteInputText(e.target.value)}
                placeholder={"1. Rohit Sharma (C)\n2. Shubman Gill (VC)\n3. Virat Kohli\n4. KL Rahul (WK)\n5. Hardik Pandya\n6. Suryakumar Yadav\n7. Ravindra Jadeja\n8. Jasprit Bumrah\n9. Mohammed Shami\n10. Kuldeep Yadav\n11. Mohammed Siraj\n12. Shreyas Iyer\n13. Ishan Kishan\n14. Axar Patel\n15. Arshdeep Singh"}
                className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-emerald-500 resize-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInlinePaste(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseInlinePaste}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider border-none cursor-pointer shadow-md"
                >
                  Parse & Apply 15 Squad
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Squad Builder Roster Card (15-Player Squad Roster) */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-3xl p-6 shadow-xl space-y-5">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                15-Player Squad Roster ({players.length} / 15)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Set Player Profile Photos, Names, Jersey #, Mobile #, and roles (1-11 Playing XI, 12-15 Bench).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-750">
                Captain: <strong className="text-amber-400">{captainName || 'Not Set'}</strong>
              </span>
              <button
                type="button"
                onClick={handleAutoFillSquad}
                className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition"
                title="Auto-fill with 15 local names"
              >
                <Sparkles size={11} /> Auto-Fill
              </button>
            </div>
          </div>

          {/* Player Rows Table */}
          <div className="space-y-3">
            {players.map((player, idx) => {
              const isCap = player.isCaptain;

              return (
                <div
                  key={player.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-3 ${
                    isCap
                      ? 'bg-gradient-to-r from-amber-950/30 via-slate-900/95 to-slate-900 border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                      : idx < 11
                      ? 'bg-slate-900/90 hover:bg-slate-900 border-slate-800'
                      : 'bg-slate-900/60 border-dashed border-amber-500/30'
                  }`}
                >
                  {/* Top line indicator if captain */}
                  {isCap && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30 shadow-sm">
                        <Crown size={12} className="text-amber-400 fill-amber-400" />
                        <span>Captain: {captainName || player.name || 'Official Team Captain'}</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider font-mono">
                        Team Leader
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    {/* Left: Player Slot + Photo + Name Input */}
                    <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                      {/* Slot number badge */}
                      <span className={`w-7 h-7 rounded-xl font-mono text-[11px] font-black flex items-center justify-center shrink-0 ${
                        isCap
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : idx < 11
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Player Profile Photo Box */}
                      <div className="relative group shrink-0">
                        <label
                          htmlFor={`one-half-player-photo-${idx}`}
                          className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-500 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner transition-colors relative"
                          title="Upload / Change Player Photo"
                        >
                          {player.photo ? (
                            <img src={player.photo} alt={player.name || 'Player'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors">
                              <User size={18} />
                              <Camera size={9} className="absolute bottom-1 right-1 text-emerald-400" />
                            </div>
                          )}
                        </label>
                        <input
                          id={`one-half-player-photo-${idx}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePlayerPhotoUpload(idx, e)}
                          className="hidden"
                        />
                        {player.photo && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePlayer(idx, 'photo', '')}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                            title="Remove Photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Name input */}
                      <div className="flex-1 min-w-0">
                        {isCap && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                            👑 Captain Name
                          </span>
                        )}
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleUpdatePlayer(idx, 'name', e.target.value)}
                          placeholder={`Player #${idx + 1} Full Name`}
                          className={`w-full bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-600 outline-none ${
                            isCap
                              ? 'border border-amber-500/50 focus:border-amber-400'
                              : 'border border-slate-750 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Middle & Right: Jersey #, Mobile #, Role, Badges, Delete */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                      {/* Jersey Number */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5">
                        <Shirt size={13} className="text-amber-400 shrink-0" />
                        <input
                          type="text"
                          value={player.jerseyNumber || ''}
                          onChange={(e) => handleUpdatePlayer(idx, 'jerseyNumber', e.target.value)}
                          placeholder="Jersey #"
                          title="Player Jersey Number"
                          className="w-16 bg-transparent text-center text-[10px] font-mono font-black text-white placeholder-slate-600 outline-none"
                        />
                      </div>

                      {/* Mobile Number */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5">
                        <Phone size={13} className="text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          value={player.mobileNumber || player.phone || ''}
                          onChange={(e) => handleUpdatePlayer(idx, 'mobileNumber', e.target.value)}
                          placeholder="Mobile #"
                          title="Player Mobile Number"
                          className="w-24 bg-transparent text-[10px] font-mono font-bold text-white placeholder-slate-600 outline-none"
                        />
                      </div>

                      {/* Role Select */}
                      <select
                        value={player.role}
                        onChange={(e) => handleUpdatePlayer(idx, 'role', e.target.value as any)}
                        className="bg-slate-950 border border-slate-750 text-slate-300 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        {ONE_HALF_ROLES.map(r => (
                          <option key={r.key} value={r.key}>
                            {r.icon} {r.label}
                          </option>
                        ))}
                      </select>

                      {/* Badges: Captain (C), Vice Captain (VC), Wicketkeeper (WK) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdatePlayer(idx, 'isCaptain', !player.isCaptain)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all flex items-center gap-0.5 ${
                            player.isCaptain
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title="Designate as Captain"
                        >
                          <Crown size={10} className={player.isCaptain ? 'fill-slate-950' : ''} />
                          (C)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdatePlayer(idx, 'isViceCaptain', !player.isViceCaptain)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all ${
                            player.isViceCaptain
                              ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title="Designate as Vice Captain"
                        >
                          (VC)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdatePlayer(idx, 'isWicketKeeper', !player.isWicketKeeper)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all ${
                            player.isWicketKeeper
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title="Designate as Wicket Keeper"
                        >
                          (WK)
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 border-none bg-transparent cursor-pointer transition-colors"
                        title="Remove Player Slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Slot Button (Max 15) */}
          {players.length < 15 && (
            <button
              type="button"
              onClick={handleAddPlayer}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-slate-750 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus size={14} /> Add Player Slot ({players.length} / 15)
            </button>
          )}

          {/* Verification & Submit CTA */}
          <div className="pt-4 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {validCount < 11 ? (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  <AlertCircle size={13} /> {11 - validCount} more player{11 - validCount > 1 ? 's' : ''} needed for standard Playing XI (11 players).
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={13} /> {validCount} players verified! Ready to submit to Score Manager.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="flex-1 sm:flex-initial px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 border-none"
              >
                {submitting ? (
                  <>Saving Squad...</>
                ) : (
                  <>
                    <Send size={14} /> Submit 15-Player Squad to Score Manager
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------
// Bulk Paste Squad Modal
// -------------------------------------------------------------
interface BulkPasteSquadModalProps {
  currentSquad: OneHalfPlayer[];
  onClose: () => void;
  onApplySquad: (squad: OneHalfPlayer[]) => void;
}

export const BulkPasteSquadModal: React.FC<BulkPasteSquadModalProps> = ({
  currentSquad,
  onClose,
  onApplySquad
}) => {
  const [pasteText, setPasteText] = useState('');

  const handleParseAndApply = () => {
    if (!pasteText.trim()) return;

    // Split lines and clean
    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    const parsed: OneHalfPlayer[] = [];
    const roles: Array<'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper'> = [
      'Batsman', 'Batsman', 'Wicket-Keeper', 'All-Rounder', 'All-Rounder',
      'Batsman', 'All-Rounder', 'Bowler', 'Bowler', 'Bowler', 'Bowler',
      'Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'
    ];

    for (let i = 0; i < 15; i++) {
      let line = lines[i] || '';
      // Strip leading numbers like "1.", "1 -", "1)"
      line = line.replace(/^[\d]+[\.\)\-\:\s]+/, '').trim();

      const isCap = line.includes('(C)') || line.includes('(c)') || i === 0;
      const isVC = line.includes('(VC)') || line.includes('(vc)') || i === 1;
      const isWK = line.includes('(WK)') || line.includes('(wk)') || line.includes('🧤') || i === 2;

      // Clean tags from name
      let cleanName = line
        .replace(/\((C|c|VC|vc|WK|wk)\)/g, '')
        .replace(/🧤/g, '')
        .trim();

      if (!cleanName) {
        cleanName = currentSquad[i]?.name || `Player ${i + 1}`;
      }

      parsed.push({
        id: `p_${Date.now()}_${i + 1}`,
        name: cleanName,
        role: isWK ? 'Wicket-Keeper' : roles[i],
        jerseyNumber: i + 1,
        isCaptain: isCap,
        isViceCaptain: isVC,
        isWicketKeeper: isWK
      });
    }

    onApplySquad(parsed);
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <FileText size={16} /> Quick Paste 15-Player Squad
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Paste 15 player names directly from WhatsApp, Telegram, or Notes. One player per line (numbered or unnumbered).
        </p>

        <textarea
          rows={8}
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder={`1. Rohit Sawant (C)\n2. Sachin Kadam (VC)\n3. Kunal Shinde (WK)\n4. Prathamesh Mane\n5. Omkar Patil\n...up to 15 players`}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white font-mono outline-none focus:border-amber-500"
        />

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParseAndApply}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-md"
          >
            Apply 15 Players
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// -------------------------------------------------------------
// Manual Matchup Selector Modal (Team A vs Team B)
// For Group 1 Knockout Bracket (8 Teams) & Groups 2, 3, 4
// -------------------------------------------------------------
interface ManualMatchupModalProps {
  day: 1 | 2 | 3 | 4;
  tournament: OneHalfTournamentState;
  onClose: () => void;
  onSaveMatchups: (updatedMatches: OneHalfMatch[]) => void;
  showToast: (msg: string) => void;
}

export const ManualMatchupModal: React.FC<ManualMatchupModalProps> = ({
  day,
  tournament,
  onClose,
  onSaveMatchups,
  showToast
}) => {
  // Get the 8 registered teams in this group
  const groupTeams = useMemo(() => {
    return tournament.teams.filter(t => t.group === day);
  }, [tournament, day]);

  // Round 1 matches for this day (4 matches)
  const r1Matches = useMemo(() => {
    return tournament.matches.filter(m => m.day === day && m.round === 'round1');
  }, [tournament, day]);

  // Working state for the 4 matchups
  const [matchups, setMatchups] = useState<Array<{ id: string; matchNumber: number; teamA: string; teamB: string; label: string }>>(() => {
    return r1Matches.map(m => ({
      id: m.id,
      matchNumber: m.matchNumber,
      teamA: m.teamA,
      teamB: m.teamB,
      label: m.label
    }));
  });

  const handleUpdateMatchup = (index: number, side: 'teamA' | 'teamB', value: string) => {
    setMatchups(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [side]: value };
      return next;
    });
  };

  const handleSwapMatchup = (index: number) => {
    setMatchups(prev => {
      const next = [...prev];
      const temp = next[index].teamA;
      next[index] = { ...next[index], teamA: next[index].teamB, teamB: temp };
      return next;
    });
  };

  // Randomize pairings (official lottery draw)
  const handleRandomDraw = () => {
    const shuffled = [...groupTeams].sort(() => Math.random() - 0.5);
    setMatchups(prev => {
      return prev.map((m, idx) => ({
        ...m,
        teamA: shuffled[idx * 2]?.name || `Team ${idx * 2 + 1}`,
        teamB: shuffled[idx * 2 + 1]?.name || `Team ${idx * 2 + 2}`
      }));
    });
    showToast(`🎲 Lottery draw randomized Group ${day} matchups!`);
  };

  // Reset to default seedings
  const handleResetDefaultSeedings = () => {
    setMatchups(prev => {
      return prev.map((m, idx) => ({
        ...m,
        teamA: groupTeams[idx * 2]?.name || `Team ${idx * 2 + 1}`,
        teamB: groupTeams[idx * 2 + 1]?.name || `Team ${idx * 2 + 2}`
      }));
    });
    showToast(`🔄 Reset Group ${day} matchups to original order`);
  };

  // Duplicate check
  const selectedTeamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    matchups.forEach(m => {
      if (m.teamA) counts[m.teamA] = (counts[m.teamA] || 0) + 1;
      if (m.teamB) counts[m.teamB] = (counts[m.teamB] || 0) + 1;
    });
    return counts;
  }, [matchups]);

  const hasDuplicates = Object.values(selectedTeamCounts).some(c => c > 1);

  const handleApply = () => {
    if (hasDuplicates) {
      if (!window.confirm('Warning: One or more teams are scheduled more than once in Round 1. Do you still want to proceed?')) {
        return;
      }
    }

    const updatedMatches = tournament.matches.map(m => {
      const matchIndex = matchups.findIndex(x => x.id === m.id);
      if (matchIndex !== -1) {
        return {
          ...m,
          teamA: matchups[matchIndex].teamA,
          teamB: matchups[matchIndex].teamB
        };
      }
      return m;
    });

    onSaveMatchups(updatedMatches);
    onClose();
    showToast(`✓ Group ${day} Round 1 Matchups updated successfully!`);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
              <ArrowLeftRight size={13} />
              Manual Matchup & Team Selection
            </span>
            <h3 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">
              Group {day} Knockout Bracket (8 Teams): Select Team A vs Team B
            </h3>
            <p className="text-xs text-slate-400">
              Score managers can manually assign which teams face each other in Round 1 (Pre-Quarters).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Lottery Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomDraw}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition active:scale-95"
            >
              <Shuffle size={13} />
              <span>Lottery Draw (Shuffle)</span>
            </button>
            <button
              type="button"
              onClick={handleResetDefaultSeedings}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition active:scale-95 border-none"
            >
              <RefreshCw size={12} />
              <span>Reset 1 vs 2</span>
            </button>
          </div>

          {hasDuplicates && (
            <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
              <AlertCircle size={12} />
              Duplicate team selected!
            </span>
          )}
        </div>

        {/* 4 Round 1 Matches Selection */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {matchups.map((matchup, idx) => (
            <div
              key={matchup.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Match {idx + 1} (M{matchup.matchNumber}) • Round 1
                </span>
                <button
                  type="button"
                  onClick={() => handleSwapMatchup(idx)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase flex items-center gap-1 border-none cursor-pointer transition"
                  title="Swap Team A and Team B"
                >
                  <ArrowLeftRight size={11} />
                  <span>Swap</span>
                </button>
              </div>

              {/* Matchup Dropdowns Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-2">
                {/* Team A Dropdown */}
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                    Team A
                  </label>
                  <select
                    value={matchup.teamA}
                    onChange={(e) => handleUpdateMatchup(idx, 'teamA', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <optgroup label={`Group ${day} Registered Teams (8 Teams)`}>
                      {groupTeams.map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Tournament Teams">
                      {tournament.teams.filter(t => t.group !== day).map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name} (Grp {t.group})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* VS Badge */}
                <div className="sm:col-span-1 text-center">
                  <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest inline-block">
                    VS
                  </span>
                </div>

                {/* Team B Dropdown */}
                <div className="sm:col-span-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                    Team B
                  </label>
                  <select
                    value={matchup.teamB}
                    onChange={(e) => handleUpdateMatchup(idx, 'teamB', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-white outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <optgroup label={`Group ${day} Registered Teams (8 Teams)`}>
                      {groupTeams.map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Tournament Teams">
                      {tournament.teams.filter(t => t.group !== day).map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name} (Grp {t.group})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border-none cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl border-none cursor-pointer shadow-lg shadow-emerald-600/30"
          >
            Save & Apply Matchups
          </button>
        </div>
      </motion.div>
    </div>
  );
};
