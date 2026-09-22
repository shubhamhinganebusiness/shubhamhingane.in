import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Users, Zap, Link as LinkIcon, Share2, Copy, Check, Plus, 
  Search, Shield, Play, UserCheck, Phone, Sparkles, X, ArrowRight, 
  ExternalLink, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export interface LocalCricketTeamDef {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  captain: string;
  viceCaptain: string;
  contactNumber: string;
  primaryColor: string;
  logo: string;
  players: string[]; // 15 players: 0-10 are Playing 11, 11-14 are Bench/Substitutes
  playerRoles?: Record<string, string>;
}

// 12 Realistic Local Gully & Club Cricket Teams with 15-player squads
export const PRESET_LOCAL_CRICKET_TEAMS: LocalCricketTeamDef[] = [
  {
    id: 'local_scc',
    name: 'Shivaji Cricket Club',
    shortCode: 'SCC',
    city: 'Pune',
    captain: 'Sachin Kadam',
    viceCaptain: 'Rohan Deshmukh',
    contactNumber: '+91 98230 11452',
    primaryColor: '#e11d48',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ShivajiClub&backgroundColor=e11d48',
    players: [
      'Sachin Kadam', 'Rohan Deshmukh', 'Kunal Shinde', 'Prathamesh Mane', 
      'Omkar Patil', 'Nikhil Jagtap', 'Saurabh More', 'Aditya Pawar', 
      'Swapnil Ghadge', 'Vishal Kamble', 'Mayur Chavan',
      // 4 Bench / Substitutes
      'Tanmay Bapat', 'Sanket Shirole', 'Harshwardhan Bhosale', 'Akshay Gaikwad'
    ],
    playerRoles: {
      'Sachin Kadam': 'Captain & All-Rounder',
      'Rohan Deshmukh': 'Vice-Captain & Top Batsman',
      'Kunal Shinde': 'Wicket-Keeper Batsman',
      'Prathamesh Mane': 'Fast Bowler',
      'Omkar Patil': 'Middle-Order Batsman',
      'Nikhil Jagtap': 'Spin Bowler',
      'Saurabh More': 'All-Rounder',
      'Aditya Pawar': 'Fast Bowler',
      'Swapnil Ghadge': 'Batsman',
      'Vishal Kamble': 'All-Rounder',
      'Mayur Chavan': 'Spin Bowler',
      'Tanmay Bapat': 'Reserve Batsman',
      'Sanket Shirole': 'Reserve Bowler',
      'Harshwardhan Bhosale': 'Reserve All-Rounder',
      'Akshay Gaikwad': 'Reserve Wicket-Keeper'
    }
  },
  {
    id: 'local_pw',
    name: 'Pune Warriors XI',
    shortCode: 'PWX',
    city: 'Pune',
    captain: 'Rahul Patil',
    viceCaptain: 'Swapnil More',
    contactNumber: '+91 98812 43210',
    primaryColor: '#3b82f6',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=PuneWarriors&backgroundColor=3b82f6',
    players: [
      'Rahul Patil', 'Swapnil More', 'Digvijay Sawant', 'Amitesh Salunkhe', 
      'Pranav Kute', 'Rushikesh Bhor', 'Shubham Thorat', 'Vaibhav Dhumal', 
      'Ganesh Wagh', 'Tushar Mohite', 'Siddharth Date',
      // 4 Bench / Substitutes
      'Amol Gholap', 'Sumit Garud', 'Nilesh Kakade', 'Pravin Kate'
    ]
  },
  {
    id: 'local_ms',
    name: 'Mumbai Strikers CC',
    shortCode: 'MSC',
    city: 'Mumbai',
    captain: 'Rohit Sawant',
    viceCaptain: 'Prathamesh Joshi',
    contactNumber: '+91 98201 88472',
    primaryColor: '#0ea5e9',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=MumbaiStrikers&backgroundColor=0ea5e9',
    players: [
      'Rohit Sawant', 'Prathamesh Joshi', 'Faizan Merchant', 'Suraj Tambe', 
      'Ajay Varma', 'Chetan Mhatre', 'Kunal Naik', 'Samir Pathan', 
      'Farhan Sayyed', 'Nikhil Parab', 'Siddhesh Lad',
      // 4 Bench / Substitutes
      'Mandar Rao', 'Jayesh Solanki', 'Arman Malik', 'Hemant Rane'
    ]
  },
  {
    id: 'local_gk',
    name: 'Gully Kings XI',
    shortCode: 'GKX',
    city: 'Mumbai',
    captain: 'Imran Sheikh',
    viceCaptain: 'Sameer Qureshi',
    contactNumber: '+91 98921 77123',
    primaryColor: '#eab308',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GullyKings&backgroundColor=eab308',
    players: [
      'Imran Sheikh', 'Sameer Qureshi', 'Arbaaz Khan', 'Bilal Ansari', 
      'Zaid Sayed', 'Shoaib Siddiqui', 'Faiz Patel', 'Aman Shaikh', 
      'Rehan Merchant', 'Kamran Ali', 'Tariq Baig',
      // 4 Bench / Substitutes
      'Noman Dar', 'Sohail Mansoori', 'Wasim Akram K', 'Asif Memon'
    ]
  },
  {
    id: 'local_dd',
    name: 'Deccan Dynamos',
    shortCode: 'DCD',
    city: 'Pune',
    captain: 'Ajinkya Shinde',
    viceCaptain: 'Tanmay Kulkarni',
    contactNumber: '+91 94220 55198',
    primaryColor: '#6366f1',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=DeccanDynamos&backgroundColor=6366f1',
    players: [
      'Ajinkya Shinde', 'Tanmay Kulkarni', 'Omkar Barve', 'Abhishek Agashe', 
      'Chinmay Karandikar', 'Makarand Joshi', 'Hrishikesh Date', 'Sarvesh Dixit', 
      'Tejas Ranade', 'Kaustubh Phadke', 'Sudarshan Bapat',
      // 4 Bench / Substitutes
      'Aniket Kelkar', 'Mihir Godbole', 'Yashodhan Vaidya', 'Nachiket Modak'
    ]
  },
  {
    id: 'local_rm',
    name: 'Royal Maratha CC',
    shortCode: 'RMC',
    city: 'Kolhapur',
    captain: 'Vikram Bhosale',
    viceCaptain: 'Digvijay Jadhav',
    contactNumber: '+91 97632 99011',
    primaryColor: '#f97316',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=RoyalMaratha&backgroundColor=f97316',
    players: [
      'Vikram Bhosale', 'Digvijay Jadhav', 'Sambhaji Shinde', 'Shivraj Ghatge', 
      'Dhananjay Mane', 'Ranjeet Patil', 'Prithviraj Salokhe', 'Abhijeet Powar', 
      'Udayraj Mahadik', 'Sangram Sawant', 'Baburao Shirole',
      // 4 Bench / Substitutes
      'Dharmaraj Yadav', 'Harishchandra More', 'Yuvraj Chougule', 'Balasaheb Shinde'
    ]
  },
  {
    id: 'local_st',
    name: 'Sahyadri Tigers',
    shortCode: 'STG',
    city: 'Nashik',
    captain: 'Aditya Jagtap',
    viceCaptain: 'Mahesh Pawar',
    contactNumber: '+91 99234 66102',
    primaryColor: '#10b981',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SahyadriTigers&backgroundColor=10b981',
    players: [
      'Aditya Jagtap', 'Mahesh Pawar', 'Kiran Borse', 'Dnyaneshwar Shinde', 
      'Suresh Sonawane', 'Gautam Khairnar', 'Bhushan Bagul', 'Hemant Ahire', 
      'Roshan Nikam', 'Vilas Jadhav', 'Sachin Gaidhani',
      // 4 Bench / Substitutes
      'Nitin Pingle', 'Pramod Bodke', 'Chetan Avhad', 'Kailas Darade'
    ]
  },
  {
    id: 'local_ss',
    name: 'Swastik Sports Club',
    shortCode: 'SSC',
    city: 'Thane',
    captain: 'Omkar Gaikwad',
    viceCaptain: 'Sanket Chavan',
    contactNumber: '+91 98670 33451',
    primaryColor: '#14b8a6',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=SwastikClub&backgroundColor=14b8a6',
    players: [
      'Omkar Gaikwad', 'Sanket Chavan', 'Mandar Rane', 'Amey Vichare', 
      'Deepak Dalvi', 'Mayuresh Bhoir', 'Tushar Patil', 'Rupesh Gharat', 
      'Avinash Tare', 'Pramod Mhatre', 'Sujit Thakre',
      // 4 Bench / Substitutes
      'Sandesh Vaze', 'Dattatray Gondhali', 'Jitendra Keni', 'Prasad Gawand'
    ]
  }
];

interface LocalTeamsAndOneClickSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    id: string;
    name: string;
    teamCount: number;
    format: string;
    customOvers?: number;
    customRules?: string;
    teams: Array<{
      id: string;
      name: string;
      captain: string;
      players: string[];
      logo?: string;
    }>;
    matches?: any[];
  };
  onAddTeam: (team: {
    id: string;
    name: string;
    captain: string;
    players: string[];
    logo?: string;
  }) => void;
  onAddMultipleTeams?: (teams: Array<{
    id: string;
    name: string;
    captain: string;
    players: string[];
    logo?: string;
  }>) => void;
  onStartLiveScore?: (
    teamAOrConfig: any, 
    teamB?: string, 
    overs?: number, 
    customRules?: string | undefined, 
    tournamentId?: string, 
    matchId?: string, 
    onSave?: (result: any) => void
  ) => void;
  triggerNotification: (msg: string) => void;
  initialTab?: 'local-teams' | 'send-link' | 'submit-squad' | 'live-setup';
}

export const LocalTeamsAndOneClickSetupModal: React.FC<LocalTeamsAndOneClickSetupModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onAddTeam,
  onAddMultipleTeams,
  onStartLiveScore,
  triggerNotification,
  initialTab = 'local-teams'
}) => {
  const [activeTab, setActiveTab] = useState<'local-teams' | 'send-link' | 'submit-squad' | 'live-setup'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Send link states
  const [selectedTeamForLink, setSelectedTeamForLink] = useState<string>(
    tournament.teams?.[0]?.id || 'new'
  );
  const [captainNameInput, setCaptainNameInput] = useState('');
  const [captainPhoneInput, setCaptainPhoneInput] = useState('');

  // 15-player squad submission states
  const [squadTeamName, setSquadTeamName] = useState('');
  const [squadShortCode, setSquadShortCode] = useState('');
  const [squadCaptain, setSquadCaptain] = useState('');
  const [squadViceCaptain, setSquadViceCaptain] = useState('');
  const [squadCaptainPhone, setSquadCaptainPhone] = useState('');
  const [squadLogo, setSquadLogo] = useState('');
  const [squadPlayers, setSquadPlayers] = useState<string[]>(Array(15).fill(''));

  // 1-Click Live Scoreboard match picker
  const [liveTeamA, setLiveTeamA] = useState<string>(tournament.teams?.[0]?.name || '');
  const [liveTeamB, setLiveTeamB] = useState<string>(tournament.teams?.[1]?.name || '');

  // Keep live teams updated if tournament teams change
  React.useEffect(() => {
    if (tournament.teams?.length >= 2) {
      if (!liveTeamA || !tournament.teams.find(t => t.name === liveTeamA)) {
        setLiveTeamA(tournament.teams[0].name);
      }
      if (!liveTeamB || !tournament.teams.find(t => t.name === liveTeamB)) {
        setLiveTeamB(tournament.teams[1].name);
      }
    }
  }, [tournament.teams]);

  // Filtered local teams
  const filteredLocalTeams = useMemo(() => {
    return PRESET_LOCAL_CRICKET_TEAMS.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.captain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Check if team already added
  const isTeamAdded = (name: string) => {
    return (tournament.teams || []).some(t => t.name.trim().toLowerCase() === name.trim().toLowerCase());
  };

  // Generate shareable Captain Squad Submission Link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const squadSubmissionUrl = `${currentOrigin}${currentPath}?action=submit_squad&tour_id=${tournament.id}&team_id=${selectedTeamForLink}&tour_name=${encodeURIComponent(tournament.name)}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(squadSubmissionUrl);
      setCopiedLink(true);
      triggerNotification("Captain 15-player squad submission link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    const selectedTeamObj = tournament.teams?.find(t => t.id === selectedTeamForLink);
    const targetTeamName = selectedTeamObj ? selectedTeamObj.name : 'Your Cricket Team';
    const captainGreeting = captainNameInput ? `Dear Captain ${captainNameInput}` : 'Dear Team Captain / Manager';
    
    const message = `🏏 *${tournament.name} - Squad Registration Form*\n\n` +
      `${captainGreeting},\n` +
      `You are invited to submit your official *15-Player Squad* (11 Playing XI + 4 Bench Substitutes) for the upcoming tournament.\n\n` +
      `🏆 Tournament: *${tournament.name}*\n` +
      `👕 Team: *${targetTeamName}*\n` +
      `⏱️ Format: *${tournament.format}* (${tournament.customOvers || 10} overs)\n\n` +
      `👉 *Click here to submit your 15-player squad online:*\n` +
      `${squadSubmissionUrl}\n\n` +
      `_Powered by Gully Score Engine live scoreboard._`;

    const cleanPhone = captainPhoneInput.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, '_blank');
    triggerNotification("Opening WhatsApp with squad registration link...");
  };

  // Handle single-click add local team
  const handleAddLocalTeam = (localTeam: LocalCricketTeamDef) => {
    if (isTeamAdded(localTeam.name)) {
      triggerNotification(`${localTeam.name} is already registered!`);
      return;
    }

    if ((tournament.teams?.length || 0) >= tournament.teamCount) {
      triggerNotification(`Tournament reached max capacity (${tournament.teamCount} teams)!`);
      return;
    }

    const newTeamObj = {
      id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: localTeam.name,
      captain: localTeam.captain,
      players: [...localTeam.players], // full 15 players
      logo: localTeam.logo
    };

    onAddTeam(newTeamObj);
    triggerNotification(`Added ${localTeam.name} with full 15-player squad (Playing 11 + 4 Bench)!`);
  };

  // Handle 1-Click Auto-Setup Full Tournament with local teams
  const handleAutoSetupFullTournament = () => {
    const slotsNeeded = tournament.teamCount - (tournament.teams?.length || 0);
    if (slotsNeeded <= 0) {
      triggerNotification("Tournament teams are already fully registered!");
      return;
    }

    const unadded = PRESET_LOCAL_CRICKET_TEAMS.filter(lt => !isTeamAdded(lt.name));
    const teamsToTake = unadded.slice(0, slotsNeeded);

    if (teamsToTake.length === 0) {
      triggerNotification("All available preset local teams are already in tournament.");
      return;
    }

    const newTeams = teamsToTake.map((lt, idx) => ({
      id: `team_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name: lt.name,
      captain: lt.captain,
      players: [...lt.players],
      logo: lt.logo
    }));

    if (onAddMultipleTeams) {
      onAddMultipleTeams(newTeams);
    } else {
      newTeams.forEach(t => onAddTeam(t));
    }

    triggerNotification(`1-Click Setup complete! Added ${newTeams.length} local cricket teams with 15-player rosters.`);
  };

  // Handle manual 15-player squad submission
  const handleSubmit15PlayerSquad = () => {
    const trimmedName = squadTeamName.trim();
    if (!trimmedName) {
      triggerNotification("Please enter Team Name!");
      return;
    }

    const validPlayers = squadPlayers.map(p => p.trim()).filter(p => p.length > 0);
    if (validPlayers.length < 11) {
      triggerNotification("Please provide at least 11 players for the Playing XI!");
      return;
    }

    const captainName = squadCaptain.trim() || validPlayers[0] || 'Captain';

    const newTeamObj = {
      id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName,
      captain: captainName,
      players: validPlayers,
      logo: squadLogo || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(trimmedName)}`
    };

    onAddTeam(newTeamObj);
    triggerNotification(`15-Player squad submitted for ${trimmedName}! Registered with tournament.`);

    // Reset form
    setSquadTeamName('');
    setSquadCaptain('');
    setSquadViceCaptain('');
    setSquadPlayers(Array(15).fill(''));
    setActiveTab('local-teams');
  };

  // 1-Click Launch Live Scoreboard
  const handleLaunchLiveScoreboard = () => {
    if (!liveTeamA || !liveTeamB) {
      triggerNotification("Please select both Team A and Team B!");
      return;
    }
    if (liveTeamA === liveTeamB) {
      triggerNotification("Team A and Team B must be different teams!");
      return;
    }

    const overs = tournament.customOvers || (tournament.format === 'T20' ? 20 : tournament.format === 'Box Cricket' ? 8 : 10);
    const matchId = `match_${Date.now()}`;

    const tour: any = tournament;
    const teamAObj = tournament.teams?.find(t => t.name === liveTeamA);
    const teamBObj = tournament.teams?.find(t => t.name === liveTeamB);

    if (onStartLiveScore) {
      const liveConfig = {
        teamA: liveTeamA,
        teamB: liveTeamB,
        overs,
        customRules: tournament.customRules,
        tournamentId: tournament.id,
        matchId,
        tournamentName: tournament.name || 'Tournament Championship',
        tournamentLogo: tour.logo || '',
        groundName: tour.groundName || tour.venue || 'Shivaji Maharaj Ground (Turf)',
        venue: tour.groundName || tour.venue || 'Shivaji Maharaj Ground (Turf)',
        seriesName: tournament.name || 'Tournament Championship',
        umpire1Name: tour.umpire1Name || 'Umesh Shastri',
        umpire1Photo: tour.umpire1Photo || '',
        umpire2Name: tour.umpire2Name || 'Nitin Gadkari',
        umpire2Photo: tour.umpire2Photo || '',
        scoreboardManagerName: tour.scoreboardManagerName || 'Ravi Shastri Jnr',
        scoreboardManagerPhoto: tour.scoreboardManagerPhoto || '',
        commentatorName: tour.commentatorName || 'Harsha Bhogle (Live)',
        commentatorPhoto: tour.commentatorPhoto || '',
        youtubeChannelLogo: tour.youtubeChannelLogo || '',
        youtubeChannelName: tour.youtubeChannelName || '',
        teamALogo: teamAObj?.logo || '',
        teamBLogo: teamBObj?.logo || '',
        teamASquad: (teamAObj?.players || []).map((p: any) => typeof p === 'string' ? p : p.name),
        teamBSquad: (teamBObj?.players || []).map((p: any) => typeof p === 'string' ? p : p.name),
        playerPhotos: { ...(teamAObj?.playerPhotos || {}), ...(teamBObj?.playerPhotos || {}) },
        onSave: (result: any) => {
          triggerNotification(`Live Match saved! Winner: ${result.winner}`);
        }
      };
      onStartLiveScore(liveConfig);
      onClose();
    } else {
      triggerNotification("Live scoring launcher is initializing...");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[220] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-indigo-500/5 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Zap size={24} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight m-0">
                  Local Cricket Teams & 1-Click Setup
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Pro Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Send a link to captains to submit their 15-player squad, or add teams directly for instant live scoreboard setup.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="self-end sm:self-center p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('local-teams')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'local-teams'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Users size={14} />
            <span>Local Teams Directory ({PRESET_LOCAL_CRICKET_TEAMS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('send-link')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'send-link'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Share2 size={14} />
            <span>Send Link to Captains</span>
          </button>

          <button
            onClick={() => setActiveTab('submit-squad')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'submit-squad'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
            }`}
          >
            <Shield size={14} />
            <span>Captain 15-Player Squad Form</span>
          </button>

          <button
            onClick={() => setActiveTab('live-setup')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'live-setup'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
            }`}
          >
            <Play size={14} className="fill-current" />
            <span>1-Click Live Scoreboard</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: LOCAL CRICKET TEAMS DIRECTORY */}
          {activeTab === 'local-teams' && (
            <div className="space-y-4">
              {/* Quick Actions Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by team, captain, city (Pune, Mumbai, Kolhapur)..."
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none text-slate-800 dark:text-white placeholder-slate-400 focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleAutoSetupFullTournament}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer border-none shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles size={13} className="animate-pulse" />
                    <span>Auto-Fill Full Tour ({tournament.teamCount} Teams)</span>
                  </button>
                </div>
              </div>

              {/* Status Header */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
                <span>
                  Tournament Slots: <strong className="text-emerald-500">{tournament.teams?.length || 0} / {tournament.teamCount}</strong> Registered
                </span>
                <span>Click "Add Squad" to instantly add full 15-player team</span>
              </div>

              {/* Grid of Local Cricket Teams */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLocalTeams.map((team) => {
                  const alreadyAdded = isTeamAdded(team.name);
                  return (
                    <div 
                      key={team.id}
                      className={`p-4.5 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                        alreadyAdded 
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-500/30' 
                          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-lg'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20 shadow-sm shrink-0"
                              style={{ backgroundColor: team.primaryColor }}
                            >
                              <img src={team.logo} alt={team.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono font-black text-slate-600 dark:text-slate-300 uppercase">
                                  {team.shortCode}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  📍 {team.city}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight m-0 mt-0.5">
                                {team.name}
                              </h4>
                            </div>
                          </div>

                          {alreadyAdded ? (
                            <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shrink-0">
                              <CheckCircle2 size={12} /> Added
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddLocalTeam(team)}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-sm flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                            >
                              <Plus size={12} /> 1-Click Add
                            </button>
                          )}
                        </div>

                        {/* Captain & Key details */}
                        <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-100 dark:border-slate-800 text-[11px]">
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Captain</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">👑 {team.captain}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Vice-Captain</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">🛡️ {team.viceCaptain}</span>
                          </div>
                        </div>

                        {/* 15-Player Squad Pill View */}
                        <div className="space-y-1.5 mt-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                            <span className="uppercase tracking-wider">15-Player Squad:</span>
                            <span className="text-emerald-500 font-black">11 Playing XI + 4 Bench</span>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                            {team.players.map((p, idx) => (
                              <span 
                                key={`team-${team.id || team.shortCode}-${idx}-${p}`}
                                className={`text-[9px] px-2 py-0.5 rounded-lg font-bold ${
                                  idx < 11 
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}
                                title={idx < 11 ? `Playing XI (#${idx + 1})` : `Reserve Bench (#${idx + 1})`}
                              >
                                {idx + 1}. {p} {idx === 0 && '👑'} {idx === 1 && '🛡️'}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Contact & Share squad link */}
                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone size={10} /> {team.contactNumber}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTeamForLink(team.id);
                            setCaptainNameInput(team.captain);
                            setCaptainPhoneInput(team.contactNumber);
                            setActiveTab('send-link');
                          }}
                          className="text-emerald-500 hover:text-emerald-600 font-black uppercase text-[9px] bg-transparent border-none cursor-pointer flex items-center gap-1"
                        >
                          <Share2 size={10} /> Share Squad Link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SEND LINK TO CAPTAINS */}
          {activeTab === 'send-link' && (
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              {/* Instructions banner */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3">
                <Share2 size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 m-0">
                    Direct Captain 15-Player Squad Submission
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                    Send this registration link directly to team captains on WhatsApp or SMS. Captains can fill out their full 15-player roster (Playing 11 + 4 Substitutes), captain & vice-captain assignments from their mobile phone without any login required.
                  </p>
                </div>
              </div>

              {/* Selection inputs */}
              <div className="space-y-3.5 bg-slate-50 dark:bg-slate-950/60 p-5 rounded-3xl border border-slate-200/70 dark:border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                    Select Target Team Slot
                  </label>
                  <select
                    value={selectedTeamForLink}
                    onChange={(e) => {
                      setSelectedTeamForLink(e.target.value);
                      const tObj = tournament.teams?.find(t => t.id === e.target.value);
                      if (tObj) {
                        setCaptainNameInput(tObj.captain || '');
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white"
                  >
                    <option value="new">+ Create New Team Slot</option>
                    {(tournament.teams || []).map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Captain: {t.captain || 'Not set'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                      Captain / Manager Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={captainNameInput}
                      onChange={(e) => setCaptainNameInput(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                      Captain WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={captainPhoneInput}
                      onChange={(e) => setCaptainPhoneInput(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Shareable Link Box */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                    Shareable Squad Submission URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={squadSubmissionUrl}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-[11px] text-slate-600 dark:text-slate-300 outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-none flex items-center gap-1.5 shrink-0 transition-all"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer border-none flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                  >
                    <Share2 size={16} />
                    <span>Send on WhatsApp</span>
                  </button>

                  <button
                    onClick={() => {
                      setSquadTeamName(tournament.teams?.find(t => t.id === selectedTeamForLink)?.name || '');
                      setSquadCaptain(captainNameInput);
                      setSquadCaptainPhone(captainPhoneInput);
                      setActiveTab('submit-squad');
                    }}
                    className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer border-none flex items-center justify-center gap-2 transition-all"
                  >
                    <span>📝 Open Captain Form Now</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAPTAIN 15-PLAYER SQUAD FORM */}
          {activeTab === 'submit-squad' && (
            <div className="space-y-6 text-left max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight m-0">
                    Official 15-Player Squad Entry
                  </h4>
                  <p className="text-2xs text-slate-400 font-bold uppercase mt-0.5">
                    11 Playing XI players + 4 Reserve / Bench substitutes
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSquadTeamName("City Strikers CC");
                    setSquadCaptain("Arjun Tendulkar");
                    setSquadViceCaptain("Prithvi Shaw");
                    setSquadPlayers([
                      "Arjun Tendulkar", "Prithvi Shaw", "Sarfaraz Khan", "Shivam Dube",
                      "Yashasvi Jaiswal", "Tushar Deshpande", "Tanush Kotian", "Shams Mulani",
                      "Mohit Avasthi", "Royston Dias", "Hardik Tamore",
                      // 4 Bench
                      "Suved Parkar", "Armaan Jaffer", "Prasad Pawar", "Minad Manjrekar"
                    ]);
                    triggerNotification("Populated sample 15-player squad!");
                  }}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase border border-indigo-200 dark:border-indigo-800/40 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles size={12} /> Fill Sample 15
                </button>
              </div>

              {/* Team Basics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                    Team Full Name *
                  </label>
                  <input
                    type="text"
                    value={squadTeamName}
                    onChange={(e) => setSquadTeamName(e.target.value)}
                    placeholder="e.g. Pune Warriors"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                    Captain Name *
                  </label>
                  <input
                    type="text"
                    value={squadCaptain}
                    onChange={(e) => setSquadCaptain(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">
                    Vice-Captain Name
                  </label>
                  <input
                    type="text"
                    value={squadViceCaptain}
                    onChange={(e) => setSquadViceCaptain(e.target.value)}
                    placeholder="e.g. Amit Patil"
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* 15 Players Roster: 11 Playing XI + 4 Bench */}
              <div className="space-y-4">
                {/* Playing 11 Section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white m-0">
                      Playing 11 (Main Squad)
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {squadPlayers.slice(0, 11).map((playerName, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => {
                            const next = [...squadPlayers];
                            next[idx] = e.target.value;
                            setSquadPlayers(next);
                          }}
                          placeholder={
                            idx === 0 ? "1. Captain Name" :
                            idx === 1 ? "2. Vice-Captain Name" :
                            idx === 2 ? "3. Wicket-Keeper Name" :
                            `Player #${idx + 1} Name`
                          }
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white placeholder-slate-400 focus:border-emerald-500"
                        />
                        {idx === 0 && <span className="text-xs shrink-0" title="Captain">👑</span>}
                        {idx === 1 && <span className="text-xs shrink-0" title="Vice-Captain">🛡️</span>}
                        {idx === 2 && <span className="text-xs shrink-0" title="Wicket-Keeper">🧤</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4 Bench / Substitutes */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white m-0">
                      Reserves / Bench Substitutes (Players 12 to 15)
                    </h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {squadPlayers.slice(11, 15).map((playerName, idx) => {
                      const actualIdx = idx + 11;
                      return (
                        <div key={actualIdx} className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-black text-xs flex items-center justify-center shrink-0">
                            {actualIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={playerName}
                            onChange={(e) => {
                              const next = [...squadPlayers];
                              next[actualIdx] = e.target.value;
                              setSquadPlayers(next);
                            }}
                            placeholder={`Reserve #${actualIdx + 1} Name`}
                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs outline-none text-slate-800 dark:text-white placeholder-slate-400 focus:border-amber-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSubmit15PlayerSquad}
                  className="w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer border-none shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <Check size={16} />
                  <span>Submit 15-Player Squad to Tournament</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: 1-CLICK LIVE SCOREBOARD SETUP */}
          {activeTab === 'live-setup' && (
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <Play size={20} className="text-amber-500 shrink-0 mt-0.5 fill-amber-500" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 m-0">
                    Instant 1-Click Live Scoreboard Engine
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed m-0">
                    Directly launch the live scoring engine with selected tournament teams, match overs, and verified 15-player rosters. Ready for live broadcasting with zero manual configuration.
                  </p>
                </div>
              </div>

              {/* Matchup Selector Card */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-4">
                  {/* Team A Picker */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                      Team A (Home Squad)
                    </label>
                    <select
                      value={liveTeamA}
                      onChange={(e) => setLiveTeamA(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs outline-none text-slate-900 dark:text-white uppercase"
                    >
                      {(tournament.teams || []).map((t, tIdx) => (
                        <option key={`live-select-a-${t.id || t.name}-${tIdx}`} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* VS Badge */}
                  <div className="sm:col-span-1 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-600 dark:text-slate-300 shadow-inner">
                      VS
                    </div>
                  </div>

                  {/* Team B Picker */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">
                      Team B (Away Squad)
                    </label>
                    <select
                      value={liveTeamB}
                      onChange={(e) => setLiveTeamB(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-xs outline-none text-slate-900 dark:text-white uppercase"
                    >
                      {(tournament.teams || []).map((t, tIdx) => (
                        <option key={`live-select-b-${t.id || t.name}-${tIdx}`} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Match Specs */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Tournament</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate block">{tournament.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Format</span>
                    <span className="text-xs font-black text-slate-800 dark:text-white truncate block">{tournament.format}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Match Overs</span>
                    <span className="text-xs font-black text-emerald-500 truncate block">
                      {tournament.customOvers || (tournament.format === 'T20' ? 20 : tournament.format === 'Box Cricket' ? 8 : 10)} Overs
                    </span>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  onClick={handleLaunchLiveScoreboard}
                  disabled={!liveTeamA || !liveTeamB || liveTeamA === liveTeamB}
                  className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl font-black text-sm uppercase tracking-wider cursor-pointer border-none shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={18} className="fill-white" />
                  <span>🚀 1-Click Launch Live Scoreboard</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xs text-slate-400 font-bold uppercase">
            <Trophy size={13} className="text-amber-500" />
            <span>{tournament.name} • {tournament.teams?.length || 0} Registered Teams</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-none"
          >
            Done / Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
