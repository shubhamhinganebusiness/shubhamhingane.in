import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, animate } from 'motion/react';
import { 
  Trophy, Users, User, ArrowLeft, ArrowRight, Play, Pause, RotateCcw, RotateCw,
  Check, X, Plus, Trash2, ListFilter, Download, Landmark, Star, Coins,
  Clock, Volume2, VolumeX, Shield, Award, HelpCircle, AlertTriangle, Sparkles, CheckCircle2, Radio,
  Send, Share2, Upload, Eye, Presentation, RefreshCw, Layers, Key, CheckSquare, 
  Dumbbell, Smartphone, Settings, BarChart3, Database, MessageSquare, Briefcase, FileSpreadsheet, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

import { RulesModule } from './modules/RulesModule';
import { RegistrationModule } from './modules/RegistrationModule';
import { TeamsModule } from './modules/TeamsModule';
import { BroadcastModule } from './modules/BroadcastModule';
import { NotificationsModule } from './modules/NotificationsModule';
import { ReportsModule } from './modules/ReportsModule';
import { GovernanceModule } from './modules/GovernanceModule';

// Types & Interfaces
export interface BidHistoryEntry {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamBgColor: string;
  amount: number;
  timestamp: string;
  country: 'Indian' | 'Overseas';
}
export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  country: 'Indian' | 'Overseas';
  basePrice: number; // in Crores, e.g. 0.50 = 50 Lakhs, 2.0 = 2 Crores
  rating: number; // 1 to 10
  status: 'Unsold' | 'Sold' | 'Skipped';
  soldTo?: string; // Team ID
  soldPrice?: number; // Price sold at, in Crores
  isMarquee?: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string; // Tailwind bg color class
  bgColor: string; // Tailwind hex or raw CSS bg
  purse: number; // In Crores, e.g. 100.0
  initialPurse: number;
  manager?: string;
  tableNo?: string;
  logoEmoji?: string;
}

const PRELOADED_TEAMS: Team[] = [
  { id: 't1', name: 'Mumbai Masters', color: 'blue', bgColor: '#1d4ed8', purse: 100.0, initialPurse: 100.0, manager: 'Akash Ambani', tableNo: 'Table #1', logoEmoji: '🦁' },
  { id: 't2', name: 'Chennai Kings', color: 'amber', bgColor: '#d97706', purse: 100.0, initialPurse: 100.0, manager: 'N. Srinivasan', tableNo: 'Table #2', logoEmoji: '👑' },
  { id: 't3', name: 'Bangalore Bulls', color: 'rose', bgColor: '#be123c', purse: 100.0, initialPurse: 100.0, manager: 'Vijay Mallya Jr.', tableNo: 'Table #3', logoEmoji: '🐂' },
];

const PRELOADED_PLAYERS: Player[] = [
  { id: 'p1', name: 'Virat Kohli', role: 'Batsman', country: 'Indian', basePrice: 2.0, rating: 10, status: 'Unsold', isMarquee: true },
  { id: 'p2', name: 'Jasprit Bumrah', role: 'Bowler', country: 'Indian', basePrice: 2.0, rating: 10, status: 'Unsold', isMarquee: true },
  { id: 'p3', name: 'Suryakumar Yadav', role: 'Batsman', country: 'Indian', basePrice: 1.5, rating: 9, status: 'Unsold', isMarquee: true },
  { id: 'p4', name: 'Hardik Pandya', role: 'All-Rounder', country: 'Indian', basePrice: 1.5, rating: 9, status: 'Unsold' },
  { id: 'p5', name: 'Rishabh Pant', role: 'Wicket-Keeper', country: 'Indian', basePrice: 1.5, rating: 9, status: 'Unsold', isMarquee: true },
  { id: 'p6', name: 'Rashid Khan', role: 'All-Rounder', country: 'Overseas', basePrice: 2.0, rating: 10, status: 'Unsold', isMarquee: true },
  { id: 'p7', name: 'Heinrich Klaasen', role: 'Wicket-Keeper', country: 'Overseas', basePrice: 1.5, rating: 9, status: 'Unsold' },
  { id: 'p8', name: 'Travis Head', role: 'Batsman', country: 'Overseas', basePrice: 2.0, rating: 9, status: 'Unsold', isMarquee: true },
  { id: 'p9', name: 'Pat Cummins', role: 'Bowler', country: 'Overseas', basePrice: 2.0, rating: 9, status: 'Unsold', isMarquee: true },
  { id: 'p10', name: 'Mitchell Starc', role: 'Bowler', country: 'Overseas', basePrice: 1.5, rating: 9, status: 'Unsold' },
  { id: 'p11', name: 'Rohit Sharma', role: 'Batsman', country: 'Indian', basePrice: 2.0, rating: 9, status: 'Unsold' },
  { id: 'p12', name: 'Ravindra Jadeja', role: 'All-Rounder', country: 'Indian', basePrice: 1.5, rating: 9, status: 'Unsold' },
  { id: 'p13', name: 'KL Rahul', role: 'Wicket-Keeper', country: 'Indian', basePrice: 1.0, rating: 8, status: 'Unsold' },
  { id: 'p14', name: 'Shubman Gill', role: 'Batsman', country: 'Indian', basePrice: 1.0, rating: 8, status: 'Unsold' },
  { id: 'p15', name: 'Yuzvendra Chahal', role: 'Bowler', country: 'Indian', basePrice: 0.75, rating: 8, status: 'Unsold' },
  { id: 'p16', name: 'Mohammed Shami', role: 'Bowler', country: 'Indian', basePrice: 1.0, rating: 9, status: 'Unsold' },
  { id: 'p17', name: 'Glenn Maxwell', role: 'All-Rounder', country: 'Overseas', basePrice: 1.0, rating: 8, status: 'Unsold' },
  { id: 'p18', name: 'Nicholas Pooran', role: 'Wicket-Keeper', country: 'Overseas', basePrice: 1.5, rating: 9, status: 'Unsold' },
  { id: 'p19', name: 'Trent Boult', role: 'Bowler', country: 'Overseas', basePrice: 1.0, rating: 8, status: 'Unsold' },
  { id: 'p20', name: 'Phil Salt', role: 'Wicket-Keeper', country: 'Overseas', basePrice: 1.0, rating: 8, status: 'Unsold' }
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-800 p-3 rounded-xl shadow-2xl font-sans text-[11px] space-y-1">
        <p className="font-black text-slate-400 uppercase tracking-wider">{data.label}</p>
        <p className="text-white font-black">{data.bidder}</p>
        <p className="text-[#f59e0b] font-black font-mono">
          {data.price >= 1 ? `₹${data.price.toFixed(2)} Cr` : `₹${(data.price * 100).toFixed(0)} Lakhs`}
        </p>
      </div>
    );
  }
  return null;
};

// Animated Ticker for bidding numbers with color pop and scaling
const BidTickerPrice: React.FC<{ price: number; formatPrice: (val: number) => string }> = ({ price, formatPrice }) => {
  const [displayPrice, setDisplayPrice] = useState<number>(price);
  const [isPopping, setIsPopping] = useState<boolean>(false);

  useEffect(() => {
    const fromVal = displayPrice;
    const toVal = price;
    
    setIsPopping(true);
    const timeout = setTimeout(() => setIsPopping(false), 900);

    const controls = animate(fromVal, toVal, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayPrice(latest);
      }
    });

    return () => {
      controls.stop();
      clearTimeout(timeout);
    };
  }, [price]);

  return (
    <motion.div
      key={price}
      initial={{ scale: 0.95 }}
      animate={{ 
        scale: isPopping ? [1, 1.28, 0.95, 1.05, 1] : 1,
        color: isPopping ? ['#f59e0b', '#10b981', '#fbbf24', '#f59e0b'] : '#f59e0b',
        textShadow: isPopping ? '0 0 12px rgba(16, 185, 129, 0.5)' : 'none'
      }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="text-2xl font-black font-mono leading-none tracking-tight inline-block"
    >
      {formatPrice(displayPrice)}
    </motion.div>
  );
};

export const CricketAuction: React.FC = () => {
  // State variables
  const [teams, setTeams] = useState<Team[]>(PRELOADED_TEAMS);
  const [players, setPlayers] = useState<Player[]>(PRELOADED_PLAYERS);
  const [auctionIndex, setAuctionIndex] = useState<number>(-1); // -1 means setup screen
  const currentNominatedPlayer = auctionIndex >= 0 ? players[auctionIndex] : null;
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [bidsHistory, setBidsHistory] = useState<BidHistoryEntry[]>([]);
  
  // Custom sound and effects enablement
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Bottom block switcher in Live Draft Arena (Left column)
  const [col1BottomTab, setCol1BottomTab] = useState<'bids' | 'unsold'>('bids');

  // Active module subnavigation tab state
  const [activeModuleTab, setActiveModuleTab] = useState<'arena' | 'rules' | 'registration' | 'teams' | 'broadcast' | 'notifications' | 'reports' | 'governance'>('arena');

  // Automated Administrative Audit Ledger states
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: string;
    timestamp: string;
    action: string;
    category: 'Rule' | 'Bid' | 'Auth' | 'Roster' | 'Notification' | 'Matchplay';
    details: string;
    user: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('cricket_auction_audit_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage audit logs read blocked in CricketAuction:', e);
    }
    return [
      {
        id: 'al_init',
        timestamp: new Date(Date.now() - 3600000).toLocaleString(),
        action: 'System Initialization',
        category: 'Auth',
        details: 'GullyScore Administrator control suite initialized successfully.',
        user: 'commissioner_admin'
      }
    ];
  });

  const logAction = (
    action: string, 
    category: 'Rule' | 'Bid' | 'Auth' | 'Roster' | 'Notification' | 'Matchplay', 
    details: string, 
    user?: string
  ) => {
    const operator = user || activeUserRole || 'commissioner_admin';
    const newLog = {
      id: 'al_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toLocaleString(),
      action,
      category,
      details,
      user: operator
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      try {
        localStorage.setItem('cricket_auction_audit_logs', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage audit logs write blocked in CricketAuction:', e);
      }
      return updated;
    });
  };

  // Rule Engine states
  const [minPlayersPerTeam, setMinPlayersPerTeam] = useState<number>(5);
  const [maxPlayersPerTeam, setMaxPlayersPerTeam] = useState<number>(11);
  const [maxOverseasPlayers, setMaxOverseasPlayers] = useState<number>(4);
  const [mandatorySquadCount, setMandatorySquadCount] = useState<number>(5);
  const [autoIncrementEnabled, setAutoIncrementEnabled] = useState<boolean>(true);
  const [rtmEnabled, setRtmEnabled] = useState<boolean>(true);

  // User credentials & roles simulation states
  const [userRoles, setUserRoles] = useState<Array<{ username: string, role: string, teamId: string | 'all' }>>([
    { username: 'commissioner_admin', role: 'Tournament Organizer', teamId: 'all' },
    { username: 'owner_mumbai', role: 'Team Owner', teamId: 't1' },
    { username: 'owner_chennai', role: 'Team Owner', teamId: 't2' },
    { username: 'owner_bangalore', role: 'Team Owner', teamId: 't3' },
  ]);
  const [activeUserRole, setActiveUserRole] = useState<string>('commissioner_admin');

  // Player Private registration states & public URL mockup
  const [selfRegName, setSelfRegName] = useState<string>('');
  const [selfRegRole, setSelfRegRole] = useState<'Batsman'|'Bowler'|'All-Rounder'|'Wicket-Keeper'>('Batsman');
  const [selfRegCountry, setSelfRegCountry] = useState<'Indian'|'Overseas'>('Indian');
  const [selfRegBasePrice, setSelfRegBasePrice] = useState<string>('0.5');
  const [selfRegRating, setSelfRegRating] = useState<number>(7);
  const [selfRegAvatar, setSelfRegAvatar] = useState<string>('🏏');

  // CSV Bulk Importer
  const [csvBulkText, setCsvBulkText] = useState<string>(
    "Shubman Gill, Batsman, Indian, 1.5, 9\nLokesh Rahul, Wicket-Keeper, Indian, 1.0, 8\nMitchell Marsh, All-Rounder, Overseas, 1.0, 8\nTim David, All-Rounder, Overseas, 0.75, 7\nMayank Yadav, Bowler, Indian, 0.5, 8"
  );

  // Active proxy simulation variables
  const [biddingProxyTeamId, setBiddingProxyTeamId] = useState<string>('t1');

  // Fortune drawing wheel states
  const [isWheelSpinning, setIsWheelSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [wheelWinner, setWheelWinner] = useState<Player | null>(null);

  // Communications gateway logs
  const [gatewayLogs, setGatewayLogs] = useState<Array<{ id: string, service: 'WhatsApp' | 'SMS' | 'Email', text: string, status: 'Simulated' | 'Dispatched', time: string }>>([
    { id: 'l1', service: 'WhatsApp', text: 'GullyScore system initialized. Ready to trigger drafting alert relays.', status: 'Simulated', time: '11:54:05' }
  ]);

  // AI Commentary states
  const [aiCommentary, setAiCommentary] = useState<string>("Welcome to the GullyScore Premium League Player Auction! The gavel is raised, the purses are full, and the excitement is off the charts!");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [voiceStyle, setVoiceStyle] = useState<'gully' | 'classic' | 'analyst' | 'ipl'>('ipl');
  const [aiSpeechEnabled, setAiSpeechEnabled] = useState<boolean>(true);

  // Read aloud helper using Web Speech Synthesis API
  const speakText = (text: string) => {
    if (!soundEnabled || !aiSpeechEnabled) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // stop previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05; // slightly faster
        utterance.pitch = 1.0;
        
        // Pick an English or Hinglish voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('hi-IN')) || voices.find(v => v.lang.includes('en'));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Web Speech Synthesis failed:", err);
    }
  };

  const fetchAiCommentary = async (type: string, data: any) => {
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/cricket/commentary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: type,
          eventData: data,
          voiceStyle
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAiCommentary(result.text);
        speakText(result.text);
      } else {
        const errorMsg = "What an exciting turn of events! Bidders are analyzing this sequence intensely.";
        setAiCommentary(errorMsg);
        speakText(errorMsg);
      }
    } catch (error) {
      console.error("Failed to fetch commentary:", error);
      const fallbackMsg = "The action is moving rapidly on the auction floor! Every franchise is alert!";
      setAiCommentary(fallbackMsg);
      speakText(fallbackMsg);
    } finally {
      setIsAiLoading(false);
    }
  };
  
  // Bidding state variables
  const [currentBidPrice, setCurrentBidPrice] = useState<number>(0);
  const [highestBidderId, setHighestBidderId] = useState<string | null>(null);
  const [selectedBidIncrement, setSelectedBidIncrement] = useState<number>(0.5); // Default increment is 0.5 Cr
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  
  // Form input states
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamPurse, setNewTeamPurse] = useState<string>('100');
  const [newTeamColor, setNewTeamColor] = useState<string>('#3b82f6');
  const [newTeamOwner, setNewTeamOwner] = useState<string>('');
  const [newTeamLogoEmoji, setNewTeamLogoEmoji] = useState<string>('🦁');

  // Tournament Creation Setup states
  const [tournamentName, setTournamentName] = useState<string>('GullyScore Premier League');
  const [tournamentDate, setTournamentDate] = useState<string>('2026-05-29');
  const [tournamentVenue, setTournamentVenue] = useState<string>('Chinnaswamy Stadium, Bangalore');
  const [tournamentCurrency, setTournamentCurrency] = useState<'₹' | '$' | 'Credits'>('₹');

  // Inline custom bidding states
  const [activeCustomBidTeamId, setActiveCustomBidTeamId] = useState<string | null>(null);
  const [customBidInputValue, setCustomBidInputValue] = useState<string>('');
  
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerRole, setNewPlayerRole] = useState<'Batsman'|'Bowler'|'All-Rounder'|'Wicket-Keeper'>('Batsman');
  const [newPlayerCountry, setNewPlayerCountry] = useState<'Indian'|'Overseas'>('Indian');
  const [newPlayerBasePrice, setNewPlayerBasePrice] = useState<string>('0.5'); // in Cr
  const [newPlayerRating, setNewPlayerRating] = useState<number>(8);
  const [newPlayerIsMarquee, setNewPlayerIsMarquee] = useState<boolean>(false);

  // Filter keys for final summary
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'sold' | 'unsold'>('all');
  const [summarySearch, setSummarySearch] = useState<string>('');

  const [notification, setNotification] = useState<{ text: string, type: 'success' | 'alert' | 'info' } | null>(null);
  const [telemetryTab, setTelemetryTab] = useState<'commentary' | 'chart'>('commentary');
  const [isRtmOpen, setIsRtmOpen] = useState<boolean>(false);

  // Advanced Strategy and Disaster Recovery States
  const [teamShortlists, setTeamShortlists] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('cricket_team_shortlists');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [teamBotStatus, setTeamBotStatus] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('cricket_team_bot_status');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [undoStack, setUndoStack] = useState<Array<{
    players: Player[];
    teams: Team[];
    auctionIndex: number;
    bidsHistory: BidHistoryEntry[];
    currentBidPrice: number;
    highestBidderId: string | null;
  }>>([]);

  const [redoStack, setRedoStack] = useState<Array<{
    players: Player[];
    teams: Team[];
    auctionIndex: number;
    bidsHistory: BidHistoryEntry[];
    currentBidPrice: number;
    highestBidderId: string | null;
  }>>([]);

  const toggleTeamShortlist = (teamId: string, playerId: string) => {
    setTeamShortlists(prev => {
      const currentList = prev[teamId] || [];
      const updatedList = currentList.includes(playerId)
        ? currentList.filter(id => id !== playerId)
        : [...currentList, playerId];
      
      const newShortlists = {
        ...prev,
        [teamId]: updatedList
      };
      
      try {
        localStorage.setItem('cricket_team_shortlists', JSON.stringify(newShortlists));
      } catch (e) {
        console.warn('LocalStorage shortlists block:', e);
      }
      return newShortlists;
    });
    
    const teamName = teams.find(t => t.id === teamId)?.name || 'Team';
    const plName = players.find(p => p.id === playerId)?.name || 'Player';
    showNotification(`Shortlist toggled for ${teamName} targeting ${plName}!`, 'info');
  };

  const getExpectedValuation = (p: Player) => {
    const sameRoleSold = players.filter(pl => pl.role === p.role && pl.status === 'Sold');
    if (sameRoleSold.length > 0) {
      const total = sameRoleSold.reduce((acc, pl) => acc + (pl.soldPrice || 0), 0);
      return Number((total / sameRoleSold.length).toFixed(2));
    }
    let val = p.basePrice * 1.5;
    if (p.rating >= 9) val = p.basePrice * 2.5;
    else if (p.rating >= 8) val = p.basePrice * 1.8;
    if (p.isMarquee) val += 1.5;
    return Number(val.toFixed(2));
  };

  const pushToUndoStack = () => {
    setRedoStack([]); // Clear redo stack on key new interaction
    setUndoStack(prev => [
      {
        players: JSON.parse(JSON.stringify(players)),
        teams: JSON.parse(JSON.stringify(teams)),
        auctionIndex,
        bidsHistory: JSON.parse(JSON.stringify(bidsHistory)),
        currentBidPrice,
        highestBidderId,
      },
      ...prev
    ].slice(0, 20)); // Limit to max 20 historic steps
  };

  const handleUndoLastSale = () => {
    if (undoStack.length === 0) {
      showNotification('No action in undo history queue!', 'alert');
      return;
    }
    const prevState = undoStack[0];
    const nextStack = undoStack.slice(1);
    
    // Save current to redo stack
    setRedoStack(prev => [
      {
        players: JSON.parse(JSON.stringify(players)),
        teams: JSON.parse(JSON.stringify(teams)),
        auctionIndex,
        bidsHistory: JSON.parse(JSON.stringify(bidsHistory)),
        currentBidPrice,
        highestBidderId,
      },
      ...prev
    ].slice(0, 20));

    setPlayers(prevState.players);
    setTeams(prevState.teams);
    setAuctionIndex(prevState.auctionIndex);
    setBidsHistory(prevState.bidsHistory);
    setCurrentBidPrice(prevState.currentBidPrice);
    setHighestBidderId(prevState.highestBidderId);
    setUndoStack(nextStack);
    
    // Reset secondary status
    setTimeLeft(30);
    setTimerActive(false);
    setIsFinished(false);

    showNotification('Success: Corrective Undo executed! Restored previous bid round state.', 'success');
    logAction('Undo Last Sale', 'Rule', 'Gavel decision reversed. Roster and budget balances recovered.');
    saveAuctionToLocalStorage(prevState.teams, prevState.players, prevState.auctionIndex, false, prevState.currentBidPrice, prevState.highestBidderId, 30, prevState.bidsHistory);
  };

  const handleRedoLastSale = () => {
    if (redoStack.length === 0) {
      showNotification('No actions available to Redo!', 'alert');
      return;
    }
    const nextState = redoStack[0];
    const nextStack = redoStack.slice(1);

    // Save current to undo stack
    setUndoStack(prev => [
      {
        players: JSON.parse(JSON.stringify(players)),
        teams: JSON.parse(JSON.stringify(teams)),
        auctionIndex,
        bidsHistory: JSON.parse(JSON.stringify(bidsHistory)),
        currentBidPrice,
        highestBidderId,
      },
      ...prev
    ].slice(0, 20));

    setPlayers(nextState.players);
    setTeams(nextState.teams);
    setAuctionIndex(nextState.auctionIndex);
    setBidsHistory(nextState.bidsHistory);
    setCurrentBidPrice(nextState.currentBidPrice);
    setHighestBidderId(nextState.highestBidderId);
    setRedoStack(nextStack);

    setTimeLeft(30);
    setTimerActive(false);
    setIsFinished(false);

    showNotification('Succes: Redo executed successfully!', 'success');
    logAction('Redo Last Sale', 'Rule', 'Action reapplied forward in time.');
    saveAuctionToLocalStorage(nextState.teams, nextState.players, nextState.auctionIndex, false, nextState.currentBidPrice, nextState.highestBidderId, 30, nextState.bidsHistory);
  };

  const handleExportJSON = () => {
    try {
      const stateObj = {
        teams,
        players,
        auctionIndex,
        isFinished,
        bidsHistory,
        currentBidPrice,
        highestBidderId,
        timeLeft,
        tournamentName,
        tournamentDate,
        tournamentVenue,
        tournamentCurrency,
        teamShortlists,
        teamBotStatus,
        minPlayersPerTeam,
        maxPlayersPerTeam,
        maxOverseasPlayers,
        mandatorySquadCount,
        rtmEnabled,
        autoIncrementEnabled
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(stateObj, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `${tournamentName.replace(/\s+/g, '_')}_auction_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      showNotification('Success: Complete state JSON exported!', 'success');
      logAction('Export State', 'Rule', 'Auction state backup file exported as JSON.');
    } catch (e) {
      showNotification('Failed to export state JSON.', 'alert');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.teams) setTeams(parsed.teams);
        if (parsed.players) setPlayers(parsed.players);
        if (parsed.auctionIndex !== undefined) setAuctionIndex(parsed.auctionIndex);
        if (parsed.isFinished !== undefined) setIsFinished(parsed.isFinished);
        if (parsed.bidsHistory) setBidsHistory(parsed.bidsHistory);
        if (parsed.currentBidPrice !== undefined) setCurrentBidPrice(parsed.currentBidPrice);
        setHighestBidderId(parsed.highestBidderId !== undefined ? parsed.highestBidderId : null);
        if (parsed.timeLeft !== undefined) setTimeLeft(parsed.timeLeft);
        if (parsed.tournamentName) setTournamentName(parsed.tournamentName);
        if (parsed.tournamentDate) setTournamentDate(parsed.tournamentDate);
        if (parsed.tournamentVenue) setTournamentVenue(parsed.tournamentVenue);
        if (parsed.tournamentCurrency) setTournamentCurrency(parsed.tournamentCurrency);
        if (parsed.teamShortlists) setTeamShortlists(parsed.teamShortlists);
        if (parsed.teamBotStatus) setTeamBotStatus(parsed.teamBotStatus);
        
        showNotification('Success: Complete auction session restored!', 'success');
        logAction('Import State', 'Rule', `Auction restored successfully from backup file: ${file.name}`);
        
        saveAuctionToLocalStorage(
          parsed.teams || teams, 
          parsed.players || players, 
          parsed.auctionIndex !== undefined ? parsed.auctionIndex : auctionIndex, 
          parsed.isFinished !== undefined ? parsed.isFinished : isFinished, 
          parsed.currentBidPrice !== undefined ? parsed.currentBidPrice : currentBidPrice, 
          parsed.highestBidderId !== undefined ? parsed.highestBidderId : highestBidderId, 
          parsed.timeLeft !== undefined ? parsed.timeLeft : timeLeft,
          parsed.bidsHistory || bidsHistory
        );
      } catch (err) {
        showNotification('Failed to import JSON file. Invalid format.', 'alert');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAutofillAFKSlots = () => {
    const botTeams = teams.filter(t => teamBotStatus[t.id]);
    if (botTeams.length === 0) {
      showNotification('No teams are set to Bot Mode. Toggle BOT ON in ledger first!', 'alert');
      return;
    }

    pushToUndoStack();

    let updatedPlayers = [...players];
    let updatedTeams = [...teams];
    let distributedCount = 0;

    let unsoldPool = updatedPlayers.filter(p => p.status === 'Unsold' || p.status === 'Skipped');
    if (unsoldPool.length === 0) {
      showNotification('No Unsold players remain in the candidate draft pool!', 'alert');
      return;
    }

    for (let t of updatedTeams) {
      if (!teamBotStatus[t.id]) continue;
      
      const buysCount = updatedPlayers.filter(p => p.soldTo === t.id && p.status === 'Sold').length;
      let slotsNeeded = maxPlayersPerTeam - buysCount;
      if (slotsNeeded <= 0) continue;

      for (let i = 0; i < slotsNeeded; i++) {
        const availablePool = updatedPlayers.filter(p => p.status === 'Unsold' || p.status === 'Skipped');
        if (availablePool.length === 0) break;

        const eligiblePlayer = availablePool.find(p => t.purse >= p.basePrice);
        if (!eligiblePlayer) break;

        t.purse = Number((t.purse - eligiblePlayer.basePrice).toFixed(2));
        eligiblePlayer.status = 'Sold';
        eligiblePlayer.soldTo = t.id;
        eligiblePlayer.soldPrice = eligiblePlayer.basePrice;
        distributedCount++;
      }
    }

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    showNotification(`Success: Draft autofilled ${distributedCount} vacant slots for AFK Bots at base price!`, 'success');
    logAction('AI Autobot Fill', 'Roster', `Autofilled ${distributedCount} vacant slots with base-price players for BOT franchises.`);
    saveAuctionToLocalStorage(updatedTeams, updatedPlayers, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft, bidsHistory);
  };

  // Canvas ref for confetti overlay
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Notification helper
  const showNotification = (text: string, type: 'success' | 'alert' | 'info' = 'info') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification((prev) => prev?.text === text ? null : prev);
    }, 4000);
  };

  // Sound synthesis via Web Audio API
  const playGavelSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playStrike = (delay: number, volume: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + delay + 0.12);
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.14);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.18);
      };
      
      playStrike(0, 0.8, 160);
      playStrike(0.09, 0.5, 140); // Double strike click
    } catch (err) {
      console.error('Audio synthesis failed:', err);
    }
  };

  const playBidBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Pitch A5
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {}
  };

  const playTimerWarningBeep = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); //Pitch A4
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (_) {}
  };

  const playApplauseSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      // Generate noise buffer
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 1;
      
      const filterGain = ctx.createGain();
      filterGain.gain.setValueAtTime(0.4, ctx.currentTime);
      filterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
      
      noise.connect(filter);
      filter.connect(filterGain);
      filterGain.connect(ctx.destination);
      
      noise.start();
      noise.stop(ctx.currentTime + 1.5);
    } catch (_) {}
  };

  const dispatchGatewayAlert = (service: 'WhatsApp' | 'SMS' | 'Email', text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      service,
      text,
      status: 'Dispatched' as const,
      time: timeStr
    };
    setGatewayLogs(prev => [newLog, ...prev]);
  };

  const getDynamicIncrement = (price: number): number => {
    if (!autoIncrementEnabled) return selectedBidIncrement;
    if (price < 0.5) return 0.05; // 5 Lakhs
    if (price < 1.0) return 0.10; // 10 Lakhs
    if (price < 2.0) return 0.25; // 25 Lakhs
    if (price < 5.0) return 0.50; // 50 Lakhs
    return 1.0; // 1 Crore step
  };

  const triggerWheelSpin = () => {
    if (isWheelSpinning) return;
    
    // Filter out remaining unsold players or skipped ones
    const unsoldUpcoming = players.filter(p => p.status === 'Unsold' || p.status === 'Skipped');
    if (unsoldUpcoming.length === 0) {
      showNotification("No unsold players left in nomination bag to draw!", "alert");
      return;
    }

    setIsWheelSpinning(true);
    setWheelWinner(null);
    
    const randomWinner = unsoldUpcoming[Math.floor(Math.random() * unsoldUpcoming.length)];
    const targetRotation = wheelRotation + 1440 + Math.floor(Math.random() * 360);
    setWheelRotation(targetRotation);

    playBidBeep();

    setTimeout(() => {
      setIsWheelSpinning(false);
      setWheelWinner(randomWinner);
      
      const targetIdx = players.findIndex(p => p.id === randomWinner.id);
      if (targetIdx >= 0) {
        setAuctionIndex(targetIdx);
        setCurrentBidPrice(randomWinner.basePrice);
        setHighestBidderId(null);
        setTimeLeft(30);
        setTimerActive(true);
        showNotification(`Fortune Wheel nominates: ${randomWinner.name}! 🎡`, 'success');
        fetchAiCommentary('nomination', { player: randomWinner });
      }
    }, 2500);
  };

  // Confetti Particle Effect Drawer
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Resize canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];
    
    // Spawn particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 60 - 30),
        y: canvas.height * 0.4 + (Math.random() * 60 - 30),
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 12 - 6,
        speedY: Math.random() * -15 - 5,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3
      });
    }

    let animationFrameId: number;
    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.35; // Gravity
        p.rotation += p.rotationSpeed;
        
        if (p.y < canvas.height && p.x > 0 && p.x < canvas.width) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(update);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    update();
  };

  // Load state from local storage on mount
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem('cricket_auction_state');
    } catch (e) {
      console.warn('LocalStorage read blocked for cricket_auction_state:', e);
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.teams && parsed.players) {
          setTeams(parsed.teams);
          setPlayers(parsed.players);
          setAuctionIndex(parsed.auctionIndex ?? -1);
          setIsFinished(parsed.isFinished ?? false);
          setCurrentBidPrice(parsed.currentBidPrice ?? 0);
          setHighestBidderId(parsed.highestBidderId ?? null);
          setTimeLeft(parsed.timeLeft ?? 30);
          setTimerActive(false);
          if (parsed.bidsHistory) {
            setBidsHistory(parsed.bidsHistory);
          }
          if (parsed.tournamentName) setTournamentName(parsed.tournamentName);
          if (parsed.tournamentDate) setTournamentDate(parsed.tournamentDate);
          if (parsed.tournamentVenue) setTournamentVenue(parsed.tournamentVenue);
          if (parsed.tournamentCurrency) setTournamentCurrency(parsed.tournamentCurrency);
        }
      } catch (err) {
        console.error('Error restoring localStorage auction data', err);
      }
    }
  }, []);

  // Save state helper
  const saveAuctionToLocalStorage = (
    nextTeams: Team[],
    nextPlayers: Player[],
    nextIndex: number,
    nextFinishedStatus: boolean,
    nextBidPrice: number,
    nextHighestBidder: string | null,
    nextTimeLeft: number,
    nextBidsHistory?: BidHistoryEntry[]
  ) => {
    const config = {
      teams: nextTeams,
      players: nextPlayers,
      auctionIndex: nextIndex,
      isFinished: nextFinishedStatus,
      currentBidPrice: nextBidPrice,
      highestBidderId: nextHighestBidder,
      timeLeft: nextTimeLeft,
      bidsHistory: nextBidsHistory ?? bidsHistory,
      tournamentName,
      tournamentDate,
      tournamentVenue,
      tournamentCurrency
    };
    try {
      localStorage.setItem('cricket_auction_state', JSON.stringify(config));
    } catch (e) {
      console.warn('Saving cricket_auction_state to localStorage blocked:', e);
    }
  };

  // Timer tick effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerActive(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            // Bid time expired alert
            playTimerWarningBeep();
            showNotification('Bid round timer expired!', 'alert');
            return 0;
          }
          if (prev <= 10) {
            playTimerWarningBeep();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerActive, timeLeft]);

  // Dynamic Bot Auto-Bidding Action Loop
  useEffect(() => {
    if (!timerActive || auctionIndex < 0 || isFinished || !currentNominatedPlayer) return;

    // Run bot interest scan every 4.5 seconds
    const interval = setInterval(() => {
      // Find all teams marked as BOT
      const botTeams = teams.filter(t => teamBotStatus[t.id]);
      if (botTeams.length === 0) return;

      // Filter eligible bots (they have budget, vacancy, and are not leading)
      const eligibleBots = botTeams.filter(t => {
        const isLeading = highestBidderId === t.id;
        const buys = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
        const isFull = buys.length >= maxPlayersPerTeam;
        const nextPrice = currentBidPrice + selectedBidIncrement;
        const canAfford = t.purse >= nextPrice;
        
        if (isLeading || isFull || !canAfford) return false;

        // Bidding interest calculation:
        // High interest if shortlisted by team, solid interest if rating is high, generic chance for filled roster
        const isShortlisted = (teamShortlists[t.id] || []).includes(currentNominatedPlayer.id);
        const isHighRating = currentNominatedPlayer.rating >= 8;
        const randomChance = Math.random() < 0.25;

        return isShortlisted || isHighRating || randomChance;
      });

      if (eligibleBots.length > 0) {
        // Choose one bot team to raise the paddle
        const selectedBot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
        
        // Simulating human click/reaction time (400ms to 1200ms)
        setTimeout(() => {
          // Re-verify eligibility inside timeout to prevent double/stale bids
          const nextPrice = currentBidPrice + selectedBidIncrement;
          const stillCanBid = selectedBot.purse >= nextPrice && highestBidderId !== selectedBot.id && timerActive;
          if (stillCanBid) {
            handlePlaceBid(selectedBot.id);
            playTimerWarningBeep(); // Beep to signal Bot bid
            showNotification(`🤖 Bot Bid: ${selectedBot.name} raised paddle to ${formatPrice(nextPrice)}!`, 'info');
          }
        }, Math.random() * 800 + 400);
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [
    timerActive,
    auctionIndex,
    isFinished,
    currentNominatedPlayer,
    teams,
    teamBotStatus,
    highestBidderId,
    currentBidPrice,
    selectedBidIncrement,
    teamShortlists,
    maxPlayersPerTeam
  ]);

  // Voice alerts on countdown ticks: Going Once, Going Twice!
  useEffect(() => {
    if (timerActive && auctionIndex >= 0 && !isFinished) {
      if (timeLeft === 15) {
        speakText(`Going Once at ${formatPrice(currentBidPrice)}!`);
        showNotification("GOING ONCE! 📢", "info");
      } else if (timeLeft === 5) {
        speakText(`Going Twice! Final opportunity!`);
        showNotification("GOING TWICE! 📢", "info");
      }
    }
  }, [timeLeft, timerActive, auctionIndex, isFinished]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (auctionIndex < 0 || isFinished) return;
      
      // Make sure we are not typing in forms or input boxes
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' || 
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setTimerActive((prev) => !prev);
        showNotification(timerActive ? 'Timer paused' : 'Timer resumed', 'info');
      } else if (e.code === 'Enter') {
        e.preventDefault();
        // If someone made a bid, trigger SOLD!
        if (highestBidderId !== null) {
          handleSold();
        } else {
          handleUnsold();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [auctionIndex, isFinished, highestBidderId, currentBidPrice, timerActive, teams, players]);

  // Price formatting helper (val in Crores)
  const formatPrice = (val: number) => {
    if (tournamentCurrency === '₹') {
      if (val >= 1) {
        return `₹${val.toFixed(2)} Cr`;
      } else {
        return `₹${(val * 100).toFixed(0)} Lakhs`;
      }
    } else if (tournamentCurrency === '$') {
      if (val >= 1) {
        return `$${val.toFixed(2)} M`;
      } else {
        return `$${(val * 1000).toFixed(0)} K`;
      }
    } else {
      if (val >= 1) {
        return `${val.toFixed(2)} Credits`;
      } else {
        return `${(val * 1000).toFixed(0)} Credits`;
      }
    }
  };

  // --- ACTIONS ---

  const handleAddTeam = () => {
    if (!newTeamName.trim()) {
      showNotification('Team name is required!', 'alert');
      return;
    }
    const purseVal = parseFloat(newTeamPurse);
    if (isNaN(purseVal) || purseVal <= 0) {
      showNotification('Total purse budget must be valid positive number!', 'alert');
      return;
    }

    const tId = 't_' + Date.now();
    const created: Team = {
      id: tId,
      name: newTeamName.trim(),
      color: 'indigo',
      bgColor: newTeamColor,
      purse: purseVal,
      initialPurse: purseVal,
      manager: newTeamOwner.trim() || 'Unassigned',
      logoEmoji: newTeamLogoEmoji || '🦁'
    };

    const nextTeams = [...teams, created];
    setTeams(nextTeams);
    setNewTeamName('');
    setNewTeamOwner('');
    setNewTeamLogoEmoji('🦁');
    showNotification(`Added team "${created.name}" successfully.`, 'success');
    
    saveAuctionToLocalStorage(nextTeams, players, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft);
  };

  const handleDeleteTeam = (id: string, name: string) => {
    const nextTeams = teams.filter(t => t.id !== id);
    setTeams(nextTeams);
    showNotification(`Deleted team "${name}".`, 'info');
    saveAuctionToLocalStorage(nextTeams, players, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft);
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) {
      showNotification('Player name is required!', 'alert');
      return;
    }
    const baseP = parseFloat(newPlayerBasePrice);
    if (isNaN(baseP) || baseP <= 0) {
      showNotification('Identify and key a valid base price!', 'alert');
      return;
    }

    const pId = 'p_' + Date.now();
    const created: Player = {
      id: pId,
      name: newPlayerName.trim(),
      role: newPlayerRole,
      country: newPlayerCountry,
      basePrice: baseP,
      rating: newPlayerRating,
      status: 'Unsold',
      isMarquee: newPlayerIsMarquee
    };

    const nextPlayers = [...players, created];
    setPlayers(nextPlayers);
    setNewPlayerName('');
    setNewPlayerIsMarquee(false);
    showNotification(`New player "${created.name}" added to list.`, 'success');
    
    saveAuctionToLocalStorage(teams, nextPlayers, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft);
  };

  const handleDeletePlayer = (id: string, name: string) => {
    const nextPlayers = players.filter(p => p.id !== id);
    setPlayers(nextPlayers);
    showNotification(`Removed "${name}" from pool.`, 'info');
    saveAuctionToLocalStorage(teams, nextPlayers, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft);
  };

  const handlePlaceBespokeBid = (teamId: string, customAmount: number) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    if (customAmount <= currentBidPrice) {
      showNotification(`Bid must exceed the current highest bid price of ${formatPrice(currentBidPrice)}!`, 'alert');
      return;
    }

    // Guardrail: max players check
    const currentBuys = players.filter(p => p.soldTo === teamId && p.status === 'Sold');
    if (currentBuys.length >= maxPlayersPerTeam) {
      showNotification(`Guardrail breach: ${team.name} has filled maximum total players limit (${maxPlayersPerTeam})!`, 'alert');
      return;
    }

    // Guardrail: overseas limit check
    if (currentNominatedPlayer?.country === 'Overseas') {
      const overseasBuys = currentBuys.filter(p => p.country === 'Overseas');
      if (overseasBuys.length >= maxOverseasPlayers) {
        showNotification(`Guardrail breach: ${team.name} has filled maximum overseas players limit (${maxOverseasPlayers})!`, 'alert');
        return;
      }
    }

    if (team.purse < customAmount) {
      showNotification(`Insufficient purse: ${team.name} has only ${formatPrice(team.purse)} left.`, 'alert');
      return;
    }

    setCurrentBidPrice(customAmount);
    setHighestBidderId(teamId);
    setTimeLeft(30); // reset clock
    setTimerActive(true);

    playBidBeep();
    showNotification(`Highest bid elevated: ${team.name} custom raises to ${formatPrice(customAmount)}!`, 'success');

    dispatchGatewayAlert('SMS', `📲 Custom Bid Alert: ${team.name} raised bid of ${formatPrice(customAmount)} for ${currentNominatedPlayer?.name || 'Nominated Player'}.`);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newBid: BidHistoryEntry = {
      id: 'bid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      playerId: currentNominatedPlayer?.id || '',
      playerName: currentNominatedPlayer?.name || '',
      teamId: team.id,
      teamName: team.name,
      teamBgColor: team.bgColor,
      amount: customAmount,
      timestamp: timeStr,
      country: currentNominatedPlayer?.country || 'Indian'
    };

    const nextBidsHistory = [...bidsHistory, newBid];
    setBidsHistory(nextBidsHistory);
    logAction('Bid Placed', 'Bid', `${team.name} placed custom bid of ${formatPrice(customAmount)} Cr for ${currentNominatedPlayer?.name || 'Nominated Player'}`);

    saveAuctionToLocalStorage(teams, players, auctionIndex, isFinished, customAmount, teamId, 30, nextBidsHistory);
  };

  const handleRTM = (teamId: string) => {
    if (auctionIndex < 0 || auctionIndex >= players.length) return;
    if (highestBidderId === null) {
      showNotification('RTM cannot be exercised. No highest bidder exists!', 'alert');
      return;
    }

    pushToUndoStack();

    const rtmTeam = teams.find(t => t.id === teamId);
    const currPlayer = players[auctionIndex];

    if (!rtmTeam) return;

    if (rtmTeam.purse < currentBidPrice) {
      showNotification(`Insufficient purse: ${rtmTeam.name} needs ${formatPrice(currentBidPrice)} but has only ${formatPrice(rtmTeam.purse)}.`, 'alert');
      return;
    }

    playGavelSound();
    triggerConfetti();
    playApplauseSound();

    // Assign the player to the RTM team
    const updatedTeams = teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          purse: Number((t.purse - currentBidPrice).toFixed(2))
        };
      }
      return t;
    });

    const updatedPlayers = players.map((p, index) => {
      if (index === auctionIndex) {
        return {
          ...p,
          status: 'Sold' as const,
          soldTo: rtmTeam.id,
          soldPrice: currentBidPrice
        };
      }
      return p;
    });

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);
    setIsRtmOpen(false);

    showNotification(`RTM exercised! ${currPlayer.name} joins ${rtmTeam.name} matching bid of ${formatPrice(currentBidPrice)}! 🏆`, 'success');
    logAction('RTM Exercised', 'Roster', `${rtmTeam.name} matched highest bid of ${formatPrice(currentBidPrice)} for ${currPlayer.name}.`);

    dispatchGatewayAlert('WhatsApp', `🏆 [RTM SYSTEM] matched bid: ${currPlayer.name} has been matched and recruited by RTM owner ${rtmTeam.name} at ${formatPrice(currentBidPrice)}!`);

    // Proceed to next player
    goToNextNomination(updatedTeams, updatedPlayers);
  };

  const handleRandomizePlayers = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    setPlayers(shuffled);
    showNotification('Randomized nomination sequence order!', 'success');
    saveAuctionToLocalStorage(teams, shuffled, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft);
  };

  // Triggering the main auction board
  const handleStartAuction = () => {
    if (teams.length < 2) {
      showNotification('At least 2 teams are required to trigger an auction!', 'alert');
      return;
    }
    if (players.length < 5) {
      showNotification('At least 5 players in pool needed to trigger!', 'alert');
      return;
    }

    setAuctionIndex(0);
    const activeFirstPlayer = players[0];
    setCurrentBidPrice(activeFirstPlayer.basePrice);
    setHighestBidderId(null);
    setTimeLeft(30);
    setTimerActive(true);

    showNotification(`Auction engine initiated. Nominating: ${activeFirstPlayer.name}`, 'success');

    saveAuctionToLocalStorage(teams, players, 0, false, activeFirstPlayer.basePrice, null, 30);
    fetchAiCommentary('nomination', { player: activeFirstPlayer });
  };

  const handleResetAuction = () => {
    if (window.confirm('This resets everything, including team squads, bids and custom pools. Proceed?')) {
      // Revert purses
      const nextTeams = teams.map(t => ({ ...t, purse: t.initialPurse }));
      const nextPlayers = players.map(p => ({ ...p, status: 'Unsold' as const, soldTo: undefined, soldPrice: undefined }));
      
      setTeams(nextTeams);
      setPlayers(nextPlayers);
      setAuctionIndex(-1);
      setIsFinished(false);
      setCurrentBidPrice(0);
      setHighestBidderId(null);
      setTimeLeft(30);
      setTimerActive(false);
      setBidsHistory([]);

      try {
        localStorage.removeItem('cricket_auction_state');
      } catch (e) {
        console.warn('Removing cricket_auction_state from localStorage blocked:', e);
      }
      showNotification('Auction reset back to Setup dashboard.', 'info');
    }
  };

  // Bid registration trigger
  const handlePlaceBid = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;

    // Guardrail: max players cap compliance check
    const currentBuys = players.filter(p => p.soldTo === teamId && p.status === 'Sold');
    if (currentBuys.length >= maxPlayersPerTeam) {
      showNotification(`Guardrail breach: ${team.name} has filled maximum total players limit (${maxPlayersPerTeam})!`, 'alert');
      return;
    }

    // Guardrail: overseas limit check
    if (currentNominatedPlayer?.country === 'Overseas') {
      const overseasBuys = currentBuys.filter(p => p.country === 'Overseas');
      if (overseasBuys.length >= maxOverseasPlayers) {
        showNotification(`Guardrail breach: ${team.name} has filled maximum overseas players limit (${maxOverseasPlayers})!`, 'alert');
        return;
      }
    }

    // Potential new amount of bid with valuation tier auto-increment
    const incrementToUse = getDynamicIncrement(currentBidPrice);
    const nextPrice = Number((currentBidPrice + incrementToUse).toFixed(2));

    if (team.purse < nextPrice) {
      showNotification(`Insufficient purse: ${team.name} needs ${formatPrice(nextPrice)} but has only ${formatPrice(team.purse)} left.`, 'alert');
      return;
    }

    setCurrentBidPrice(nextPrice);
    setHighestBidderId(teamId);
    setTimeLeft(30); // reset 30 sec clock
    setTimerActive(true);

    playBidBeep();
    showNotification(`Highest bid elevated: ${team.name} raises to ${formatPrice(nextPrice)}!`, 'success');

    // Dispatch real-time counter bid SMS alert
    dispatchGatewayAlert('SMS', `📲 Counter-Bid alert: ${team.name} placed a bid of ${formatPrice(nextPrice)} for ${currentNominatedPlayer?.name || 'Nominated Player'} (using +${incrementToUse} Cr increment).`);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newBid: BidHistoryEntry = {
      id: 'bid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      playerId: currentNominatedPlayer?.id || '',
      playerName: currentNominatedPlayer?.name || '',
      teamId: team.id,
      teamName: team.name,
      teamBgColor: team.bgColor,
      amount: nextPrice,
      timestamp: timeStr,
      country: currentNominatedPlayer?.country || 'Indian'
    };

    const nextBidsHistory = [...bidsHistory, newBid];
    setBidsHistory(nextBidsHistory);
    logAction('Bid Placed', 'Bid', `${team.name} placed a bid of ${formatPrice(nextPrice)} Cr for ${currentNominatedPlayer?.name || 'Nominated Player'}`);

    saveAuctionToLocalStorage(teams, players, auctionIndex, isFinished, nextPrice, teamId, 30, nextBidsHistory);
  };

  const handleSold = () => {
    if (auctionIndex < 0 || auctionIndex >= players.length) return;
    if (highestBidderId === null) {
      showNotification('Cannot sell player. No bids have been placed yet! Use Unsold instead.', 'alert');
      return;
    }

    pushToUndoStack();

    const boughtTeam = teams.find(t => t.id === highestBidderId);
    const currPlayer = players[auctionIndex];

    if (!boughtTeam) return;

    playGavelSound();
    triggerConfetti();
    playApplauseSound();

    // Deduct and assign player
    const updatedTeams = teams.map(t => {
      if (t.id === highestBidderId) {
        return {
          ...t,
          purse: Number((t.purse - currentBidPrice).toFixed(2)) // Decimal precision arithmetic prevention
        };
      }
      return t;
    });

    const updatedPlayers = players.map((p, index) => {
      if (index === auctionIndex) {
        return {
          ...p,
          status: 'Sold' as const,
          soldTo: boughtTeam.id,
          soldPrice: currentBidPrice
        };
      }
      return p;
    });

    setTeams(updatedTeams);
    setPlayers(updatedPlayers);

    showNotification(`SOLD! ${currPlayer.name} joins ${boughtTeam.name} for ${formatPrice(currentBidPrice)}! 🏆`, 'success');
    logAction('Player Sold', 'Roster', `Recruited player "${currPlayer.name}" sold to franchise "${boughtTeam.name}" for ${formatPrice(currentBidPrice)} Crores.`);

    // Outbox instant messaging updates
    dispatchGatewayAlert('WhatsApp', `🏆 [WhatsApp GPL] Congratulations ${currPlayer.name}! You are SOLD to ${boughtTeam.name} for ${formatPrice(currentBidPrice)} Cr! Checked in Table manager.`);
    dispatchGatewayAlert('SMS', `📲 [SMS API] Draft confirmed: ${currPlayer.name} recruited by ${boughtTeam.name} for ₹${currentBidPrice} Crores.`);
    dispatchGatewayAlert('Email', `📧 [Email Node] Transaction notice: GPL Contract issued to ${currPlayer.name} with ${boughtTeam.name} roster list.`);

    // Trigger AI commentary for SOLD event
    fetchAiCommentary('sold', { player: currPlayer, teamName: boughtTeam.name, price: currentBidPrice });

    // Proceed to next player
    goToNextNomination(updatedTeams, updatedPlayers);
  };

  const handleUnsold = () => {
    if (auctionIndex < 0 || auctionIndex >= players.length) return;
    pushToUndoStack();
    const currPlayer = players[auctionIndex];

    const updatedPlayers = players.map((p, index) => {
      if (index === auctionIndex) {
        return {
          ...p,
          status: 'Unsold' as const // keep as Unsold but registered
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    showNotification(`${currPlayer.name} goes UNSOLD. Added to draft archive.`, 'info');
    logAction('Player Unsold', 'Roster', `Player "${currPlayer.name}" went Unsold at initial base valuation price of ${formatPrice(currPlayer.basePrice)} Cr.`);

    // Notify outbound log
    dispatchGatewayAlert('WhatsApp', `⚠️ [WhatsApp Alert] Player went Unsold: ${currPlayer.name} is directed to the custom RTM and accelerated draft pool.`);

    // Trigger AI commentary for UNSOLD event
    fetchAiCommentary('unsold', { player: currPlayer });

    goToNextNomination(teams, updatedPlayers);
  };

  const handleSkipPlayer = () => {
    if (auctionIndex < 0 || auctionIndex >= players.length) return;
    pushToUndoStack();
    const currPlayer = players[auctionIndex];

    const updatedPlayers = players.map((p, index) => {
      if (index === auctionIndex) return { ...p, status: 'Skipped' as const };
      return p;
    });

    setPlayers(updatedPlayers);
    showNotification(`Skipped "${currPlayer.name}" nomination for later.`, 'info');
    logAction('Player Skipped', 'Roster', `Roster entry for player nomination "${currPlayer.name}" skipped for accelerated retrieval pool.`);
    goToNextNomination(teams, updatedPlayers);
  };

  const handleReNominatePlayer = (playerId: string) => {
    const plyrIndex = players.findIndex(p => p.id === playerId);
    if (plyrIndex < 0) return;
    pushToUndoStack();

    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        return {
          ...p,
          status: 'Unsold' as const,
          soldTo: undefined,
          soldPrice: undefined
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    setAuctionIndex(plyrIndex);
    setCurrentBidPrice(players[plyrIndex].basePrice);
    setHighestBidderId(null);
    setTimeLeft(30);
    setTimerActive(true);

    showNotification(`Re-nominated ${players[plyrIndex].name} into the active draft!`, 'success');
    logAction('Player Re-nomination', 'Roster', `Player "${players[plyrIndex].name}" re-nominated to active draft round of bids.`);
    fetchAiCommentary('nomination', { player: players[plyrIndex] });
    saveAuctionToLocalStorage(teams, updatedPlayers, plyrIndex, false, players[plyrIndex].basePrice, null, 30);
  };

  const goToNextNomination = (nextTeams: Team[], nextPlayers: Player[]) => {
    // Look for next Unsold or Skipped player starting from current index + 1
    let nextIdx = -1;
    for (let i = auctionIndex + 1; i < nextPlayers.length; i++) {
      if (nextPlayers[i].status === 'Unsold' || nextPlayers[i].status === 'Skipped') {
        nextIdx = i;
        break;
      }
    }

    // Wrap around search to pick any missed skipped/unsold players if none found ahead
    if (nextIdx === -1) {
      for (let i = 0; i < auctionIndex; i++) {
        if (nextPlayers[i].status === 'Unsold' || nextPlayers[i].status === 'Skipped') {
          nextIdx = i;
          break;
        }
      }
    }

    if (nextIdx === -1) {
      // No players left completely
      setIsFinished(true);
      setTimerActive(false);
      setAuctionIndex(-1);
      showNotification('All players navigated. Cricket auction successfully finalized!', 'success');
      saveAuctionToLocalStorage(nextTeams, nextPlayers, -1, true, 0, null, 0);
    } else {
      setAuctionIndex(nextIdx);
      const nextPlayerObj = nextPlayers[nextIdx];
      setCurrentBidPrice(nextPlayerObj.basePrice);
      setHighestBidderId(null);
      setTimeLeft(30);
      setTimerActive(true);
      
      saveAuctionToLocalStorage(nextTeams, nextPlayers, nextIdx, false, nextPlayerObj.basePrice, null, 30);
      fetchAiCommentary('nomination', { player: nextPlayerObj });
    }
  };

  // Auto-resolve when countdown timer hits zero (automatically Sold/Unsold)
  useEffect(() => {
    if (timeLeft === 0 && auctionIndex >= 0 && !isFinished) {
      if (highestBidderId !== null) {
        showNotification('Timer expired! Nominated player SOLD to high bidder.', 'success');
        handleSold();
      } else {
        showNotification('Timer expired! Player went UNSOLD.', 'info');
        handleUnsold();
      }
    }
  }, [timeLeft, auctionIndex, isFinished, highestBidderId, teams, players]);

  // Remove individual bid and reverse transitions to update total UI state
  const handleRemoveBid = (bidId: string) => {
    const bidToRemove = bidsHistory.find(b => b.id === bidId);
    if (!bidToRemove) return;

    if (!window.confirm('Are you sure you want to remove this bid? This will reverse corresponding financial transactions & update total UI state.')) {
      return;
    }

    const nextBidsHistory = bidsHistory.filter(b => b.id !== bidId);

    // 1. Re-evaluate players first
    let nextPlayers = [...players];
    const isRemoveForSoldPlayer = players.some(p => p.id === bidToRemove.playerId && p.status === 'Sold');

    if (isRemoveForSoldPlayer) {
      nextPlayers = players.map(p => {
        if (p.id === bidToRemove.playerId) {
          // Find remaining bids for this player
          const pBids = nextBidsHistory.filter(b => b.playerId === p.id);
          if (pBids.length > 0) {
            // Find highest bid among them
            const highestBid = pBids.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), pBids[0]);
            return {
              ...p,
              status: 'Sold' as const,
              soldTo: highestBid.teamId,
              soldPrice: highestBid.amount
            };
          } else {
            // No bids left, goes back to Unsold
            return {
              ...p,
              status: 'Unsold' as const,
              soldTo: undefined,
              soldPrice: undefined
            };
          }
        }
        return p;
      });
    }

    // 2. Re-calculate franchise purses from initialPurse based on nextPlayers sold prices
    const nextTeams = teams.map(t => {
      const teamSpend = nextPlayers
        .filter(p => p.soldTo === t.id && p.status === 'Sold')
        .reduce((sum, p) => sum + (p.soldPrice || 0), 0);
      return {
        ...t,
        purse: Number((t.initialPurse - teamSpend).toFixed(2))
      };
    });

    // 3. Re-evaluate active nominee state if the removed bid was for the currently active nominee
    let nextBidPrice = currentBidPrice;
    let nextHighestBidderId = highestBidderId;

    const liveNominee = auctionIndex >= 0 ? players[auctionIndex] : null;
    if (liveNominee && bidToRemove.playerId === liveNominee.id) {
      const activePlayerBids = nextBidsHistory.filter(b => b.playerId === liveNominee.id);
      if (activePlayerBids.length > 0) {
        const highestBid = activePlayerBids.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), activePlayerBids[0]);
        nextBidPrice = highestBid.amount;
        nextHighestBidderId = highestBid.teamId;
      } else {
        nextBidPrice = liveNominee.basePrice;
        nextHighestBidderId = null;
      }
    }

    // 4. Update core state variables
    setBidsHistory(nextBidsHistory);
    setPlayers(nextPlayers);
    setTeams(nextTeams);
    setCurrentBidPrice(nextBidPrice);
    setHighestBidderId(nextHighestBidderId);

    showNotification('Bid removed cleanly. Ledger balances synced.', 'info');

    // 5. Sync to persistent local store state
    saveAuctionToLocalStorage(
      nextTeams,
      nextPlayers,
      auctionIndex,
      isFinished,
      nextBidPrice,
      nextHighestBidderId,
      timeLeft,
      nextBidsHistory
    );
  };

  // Export results helper as dynamic CSV
  const handleExportCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'ID,Player Name,Role,Country,Rating,Status,Acquired By,Sold Value (Cr)\r\n';
      
      players.forEach((p) => {
        const teamName = teams.find(t => t.id === p.soldTo)?.name || 'N/A';
        const priceStr = p.soldPrice ? `${p.soldPrice} Cr` : '-';
        csvContent += `"${p.id}","${p.name}","${p.role}","${p.country}",${p.rating} Stars,"${p.status}","${teamName}","${priceStr}"\r\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'cricket_auction_report.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('Summary CSV report sheet compiled & downloaded!', 'success');
    } catch (e) {
      showNotification('Failed to compile CSV spreadsheet.', 'alert');
    }
  };

  // Calculations for dashboard
  const numFinishedPlayers = players.filter(p => p.status === 'Sold').length;
  const progressPercent = Math.min(100, Math.round((numFinishedPlayers / players.length) * 100));

  // Filtered lists for Results section
  const finalFilteredPlayers = players.filter(p => {
    const matchesFilter = 
      summaryFilter === 'all' || 
      (summaryFilter === 'sold' && p.status === 'Sold') || 
      (summaryFilter === 'unsold' && p.status === 'Unsold');
    
    const matchesSearch = 
      p.name.toLowerCase().includes(summarySearch.toLowerCase()) || 
      p.role.toLowerCase().includes(summarySearch.toLowerCase());
      
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans tracking-wide relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      
      {/* Dynamic particles canvas */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 w-full h-full" />

      {/* STADIUM LIGHT GLOWS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-950/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 rounded-full flex items-center gap-3 shadow-2xl border ${
              notification.type === 'success' 
                ? 'bg-slate-900 border-emerald-500/40 text-emerald-400' 
                : notification.type === 'alert'
                ? 'bg-slate-900 border-rose-500/40 text-rose-400'
                : 'bg-slate-900 border-indigo-500/40 text-indigo-400'
            }`}
          >
            {notification.type === 'success' && <Sparkles size={16} className="text-emerald-400" />}
            {notification.type === 'alert' && <AlertTriangle size={16} className="text-rose-405" />}
            {notification.type === 'info' && <Clock size={16} className="text-indigo-400" />}
            <span className="text-xs font-black uppercase tracking-wider">{notification.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Row */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-850/60 z-40 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              to="/projects" 
              className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-455 hover:text-white rounded-xl transition-all"
            >
              <ArrowLeft size={14} />
            </Link>
            <div className="truncate">
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#f59e0b] flex items-center gap-1.5 leading-none mb-0.5 animate-fade-in">
                <Coins size={14} /> GULLYSCORE PREMIER
              </h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none">Auction Lab Control Suite</p>
            </div>
          </div>

          {/* Sub Navigation Tabs Bar inside Header to save vertical layout pixels */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[55%] py-1">
            {[
              { id: 'arena', label: 'Draft Arena', icon: Coins },
              { id: 'rules', label: 'Rules Engine', icon: Settings },
              { id: 'registration', label: 'Registration Portal', icon: Upload },
              { id: 'teams', label: 'Franchise Table', icon: Users },
              { id: 'broadcast', label: 'OBS & Projector', icon: Presentation },
              { id: 'notifications', label: 'SMS WhatsApp Alerts', icon: MessageSquare },
              { id: 'governance', label: 'Governance & Sync', icon: Lock },
              { id: 'reports', label: 'Roster Invoices', icon: BarChart3 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeModuleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-nav-${tab.id}`}
                  onClick={() => {
                    setActiveModuleTab(tab.id as any);
                    playBidBeep();
                  }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-none ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.12)] scale-[1.02]'
                      : 'bg-slate-900 text-slate-450 hover:bg-slate-850 hover:text-slate-200'
                  }`}
                >
                  <Icon size={11} />
                  <span className="hidden leading-none xl:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 bg-slate-950 border border-slate-850 rounded-xl px-1.5 py-1">
            {/* RBAC Persona Selector */}
            <div className="flex items-center gap-1.5 px-1 py-0.5 whitespace-nowrap">
              <Shield size={12} className="text-[#f59e0b]" />
              <select
                value={activeUserRole}
                onChange={(e) => {
                  const roleObj = e.target.value;
                  setActiveUserRole(roleObj);
                  let roleLabel = 'Role Swapped';
                  if (roleObj === 'commissioner_admin') roleLabel = 'Tournament Organiser (Admin)';
                  else if (roleObj === 'auctioneer') roleLabel = 'Stage Auctioneer';
                  else if (roleObj === 'viewer_mode') roleLabel = 'Spectator (Viewer)';
                  else {
                    const matchedTeam = teams.find(t => t.id === roleObj.replace('team_owner_', ''));
                    roleLabel = matchedTeam ? `${matchedTeam.name} Owner` : 'Team Owner';
                  }
                  showNotification(`Persona Swapped: Switched to ${roleLabel}`, 'success');
                  logAction('Admin/User Role Switched', 'Auth', `Client loaded persona: "${roleLabel}"`, roleObj);
                }}
                className="bg-transparent border-none text-[8.5px] font-black text-slate-200 outline-none uppercase tracking-wider cursor-pointer font-sans"
              >
                <option value="commissioner_admin" className="bg-slate-950 text-white font-sans">Admin 👑</option>
                <option value="auctioneer" className="bg-slate-950 text-white font-sans">Auctioneer 🔨</option>
                <optgroup label="Franchise Owners 💼" className="bg-slate-950 text-slate-400">
                  {teams.map(t => (
                    <option key={t.id} value={`team_owner_${t.id}`} className="bg-slate-950 text-white font-sans">
                      {t.name} (Owner)
                    </option>
                  ))}
                </optgroup>
                <option value="viewer_mode" className="bg-slate-950 text-[#818cf8] font-sans">Viewer Mode 👁️</option>
              </select>
            </div>

            <div className="w-[1px] h-3.5 bg-slate-850" />

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border-none flex items-center justify-center transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-[#f59e0b]/5 text-[#f59e0b] hover:bg-[#f59e0b]/10' 
                  : 'bg-transparent text-slate-600'
              }`}
              title={soundEnabled ? 'Disable Sounds' : 'Enable sounds'}
            >
              {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main responsive dashboard layout container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 overflow-hidden flex flex-col justify-between">
        
        {/* TAB 1: DRAFT ARENA COCKPIT */}
        {activeModuleTab === 'arena' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs text-slate-100">
            
            {/* SETUP SCREEN */}
            {auctionIndex < 0 && !isFinished && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          
          {/* Intro Banner */}
          <section className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-4 py-1.5 rounded-full text-[#f59e0b]">
              <Trophy size={14} className="animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">IPL Style Player Draft Simulator 🏏</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-50">
              CRICKET PLAYER <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 italic font-heading">AUCTION LAB</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
              Build your customized cricket league franchises, draft dynamic Indian and overseas players, raise bids with real-time timers, and export final contract sheets.
            </p>
          </section>
          
          {/* League Settings & Governance card */}
          <section className="bg-slate-900/60 border border-slate-850 rounded-[2rem] p-6 max-w-4xl mx-auto space-y-4">
            <h3 className="font-black text-xs uppercase tracking-widest text-[#f59e0b] flex items-center gap-2 border-b border-slate-800 pb-3">
              <Trophy size={15} /> League Settings & Governance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">League Name</label>
                <input
                  type="text"
                  placeholder="e.g. GPL Premium League"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Event Date</label>
                <input
                  type="date"
                  value={tournamentDate}
                  onChange={(e) => setTournamentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-semibold font-mono text-slate-300"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Stadium Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Wankhede Stadium, Mumbai"
                  value={tournamentVenue}
                  onChange={(e) => setTournamentVenue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-semibold"
                />
              </div>
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Base Currency</label>
                <select
                  value={tournamentCurrency}
                  onChange={(e) => {
                    const nextCurr = e.target.value;
                    setTournamentCurrency(nextCurr);
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-black text-amber-500 uppercase"
                >
                  <option value="₹">Rupees (₹ Lakhs & Crores)</option>
                  <option value="$">US Dollars ($ Thousands & Millions)</option>
                  <option value="Credits">Credits (GPL Points Units)</option>
                </select>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* COLUMN 1: TEAM SETTINGS */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <h3 className="font-black text-xs uppercase tracking-widest text-[#f59e0b] flex items-center gap-2">
                  <Users size={16} /> Draft Franchises ({teams.length})
                </h3>
                <span className="text-[9px] font-bold text-slate-500 px-2 py-1 bg-slate-950 rounded">Min 2 required</span>
              </div>

              {/* Add Franchise form */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-850 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Add New Team Franchise</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Franchise Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Royal Challengers"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Purse Budget (Crores)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 100"
                      value={newTeamPurse}
                      onChange={(e) => setNewTeamPurse(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Team Owner / Coach</label>
                    <input 
                      type="text"
                      placeholder="e.g. Akash Ambani"
                      value={newTeamOwner}
                      onChange={(e) => setNewTeamOwner(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Select Logo Emoji</label>
                    <select
                      value={newTeamLogoEmoji}
                      onChange={(e) => setNewTeamLogoEmoji(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-all font-semibold"
                    >
                      <option value="🦁">Lion (🦁)</option>
                      <option value="👑">Crown (👑)</option>
                      <option value="🐂">Bull (🐂)</option>
                      <option value="⚡">Lightning (⚡)</option>
                      <option value="🦅">Eagle (🦅)</option>
                      <option value="🐯">Tiger (🐯)</option>
                      <option value="🛡️">Shield (🛡️)</option>
                      <option value="⚔️">Sword (⚔️)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Brand Color:</span>
                    <input 
                      type="color" 
                      value={newTeamColor} 
                      onChange={(e) => setNewTeamColor(e.target.value)}
                      className="w-8 h-7 bg-transparent border border-slate-800 rounded cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleAddTeam}
                    className="px-4 py-2 bg-amber-550 hover:bg-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1 cursor-pointer shadow-lg shadow-amber-500/5"
                  >
                    <Plus size={12} /> Add Team Ledger
                  </button>
                </div>
              </div>

              {/* Grid or table of added franchises */}
              <div className="space-y-2.5">
                {teams.map((t) => (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-850 hover:border-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-inner" style={{ backgroundColor: t.bgColor + '20', border: `1px solid ${t.bgColor}` }}>
                        {t.logoEmoji || '🦁'}
                      </div>
                      <div>
                        <span className="text-xs font-black text-white block uppercase">{t.name}</span>
                        <div className="flex flex-wrap items-center gap-x-2 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                          <span className="text-amber-500">Owner: {t.manager || 'Unassigned'}</span>
                          <span className="text-slate-600">|</span>
                          <span className="flex items-center gap-0.5"><Landmark size={8} /> Purse: {formatPrice(t.initialPurse)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTeam(t.id, t.name)}
                      className="p-2 text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 border-none rounded-xl cursor-pointer transition-all bg-transparent"
                      title="Remove team"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {teams.length === 0 && (
                  <div className="text-center py-10 bg-slate-950/20 rounded-2xl border border-dashed border-slate-850">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">No franchises configured yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: PLAYER POOL MANAGER */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-[2rem] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
                <h3 className="font-black text-xs uppercase tracking-widest text-emerald-450 flex items-center gap-2">
                  <User size={16} /> Player Nomination Pool ({players.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRandomizePlayers}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs rounded-xl font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    Randomize
                  </button>
                  <span className="text-[9px] font-bold text-slate-500 px-2 py-1 bg-slate-950 rounded">Min 5 required</span>
                </div>
              </div>

              {/* Add Custom player form */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-850 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Register Custom Playcard Profile</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1 font-sans">Full Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Jasprit Bumrah"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Base Bid Price (Crores)</label>
                    <input 
                      type="number"
                      step="0.05"
                      placeholder="e.g. 1.50 (1.5 Cr)"
                      value={newPlayerBasePrice}
                      onChange={(e) => setNewPlayerBasePrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all font-semibold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Specialty Role</label>
                    <select
                      value={newPlayerRole}
                      onChange={(e: any) => setNewPlayerRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Batsman">Batsman 🏏</option>
                      <option value="Bowler">Bowler 🎯</option>
                      <option value="All-Rounder">All-Rounder ⚡</option>
                      <option value="Wicket-Keeper">Wicket-Keeper 🧤</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Nationality Category</label>
                    <select
                      value={newPlayerCountry}
                      onChange={(e: any) => setNewPlayerCountry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    >
                      <option value="Indian">Indian 🇮🇳</option>
                      <option value="Overseas">Overseas 🌍</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 border border-slate-850 rounded-xl">
                      <span className="text-[8.5px] font-black text-slate-500 uppercase pr-1">Rating:</span>
                      {[2, 4, 6, 8, 10].map((starVal) => (
                        <button
                          key={starVal}
                          onClick={() => setNewPlayerRating(starVal)}
                          className={`p-1 border-none cursor-pointer bg-transparent transition-all ${
                            newPlayerRating >= starVal ? 'text-amber-500 scale-110' : 'text-slate-700'
                          }`}
                        >
                          <Star size={12} fill={newPlayerRating >= starVal ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/60 p-2 border border-slate-850 rounded-xl">
                      <input
                        type="checkbox"
                        id="newPlayerIsMarquee"
                        checked={newPlayerIsMarquee}
                        onChange={(e) => setNewPlayerIsMarquee(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-amber-550 border-slate-800 bg-slate-950 accent-amber-550"
                      />
                      <label htmlFor="newPlayerIsMarquee" className="text-[8px] font-black text-slate-300 uppercase cursor-pointer select-none">
                        Marquee 🌟
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleAddPlayer}
                    className="px-4 py-2 bg-emerald-550 hover:bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1 cursor-pointer shadow-lg shadow-emerald-500/5"
                  >
                    <Plus size={12} /> Nominate Profile
                  </button>
                </div>
              </div>

              {/* Scrollable player entries list */}
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {players.map((p, idx) => (
                  <div 
                    key={p.id}
                    className="flex items-center justify-between p-3.5 bg-slate-950/40 rounded-xl border border-slate-850 hover:border-slate-800 transition-all font-sans"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-600 pr-1">{idx+1}.</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white hover:text-emerald-400 cursor-pointer">{p.name}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-sm flex items-center ${
                            p.country === 'Indian' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {p.country}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                          {p.role} • Rating {p.rating}/10 • Base: {formatPrice(p.basePrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Shortlist indicators */}
                      <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded-xl border border-slate-850">
                        <span className="text-[7px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-0.5"><Trophy size={8}/> Bidder Goal:</span>
                        {teams.map(t => {
                          const isTargeted = (teamShortlists[t.id] || []).includes(p.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTeamShortlist(t.id, p.id)}
                              className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center border transition-all cursor-pointer ${
                                isTargeted
                                  ? 'bg-[#f59e0b]/25 border-[#f59e0b]/60 text-[#f59e0b] scale-110'
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-350 hover:border-slate-705'
                              }`}
                              title={`Shortlist for ${t.name}`}
                            >
                              {t.logoEmoji || '🦁'}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => {
                          const updated = players.map(py => py.id === p.id ? { ...py, isMarquee: !py.isMarquee } : py);
                          setPlayers(updated);
                          showNotification(`${p.name} marquee status updated!`, 'success');
                          saveAuctionToLocalStorage(teams, updated, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft);
                        }}
                        className="p-1.5 text-amber-400 hover:text-amber-300 bg-transparent border-none cursor-pointer flex items-center justify-center transition-all"
                        title={p.isMarquee ? "Click to remove Marquee status" : "Click to mark as Marquee high-profile"}
                      >
                        <Star size={13} className={p.isMarquee ? "fill-amber-400 stroke-amber-400" : "stroke-slate-600 fill-none"} />
                      </button>

                      <button
                        onClick={() => handleDeletePlayer(p.id, p.name)}
                        className="p-1.5 text-slate-600 hover:text-rose-450 hover:bg-rose-500/10 border-none rounded-lg cursor-pointer bg-transparent transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

                <div className="flex justify-center pb-8 flex-shrink-0">
                  <button
                    onClick={handleStartAuction}
                    className="px-12 py-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black text-[11px] uppercase tracking-widest rounded-xl transition-all border-none flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 hover:scale-[1.02] transform active:scale-95"
                  >
                    <Play size={14} className="fill-current" /> Start GPL League Draft Session
                  </button>
                </div>
              </div>
            )}

            {/* LIVE ACTIVE ARENA */}
            {auctionIndex >= 0 && !isFinished && currentNominatedPlayer && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-3">
          
          {/* Progress Section */}
          <div className="space-y-1 mb-2 flex-shrink-0">
            <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Trophy size={11} className="text-[#f59e0b]" /> Live Draft Progress
              </span>
              <span className="font-mono text-[9px] text-slate-350">
                Player {numFinishedPlayers} of {players.length} • {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#f59e0b] to-[#10b981] h-full transition-all duration-350"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Arena cockpit grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
            
            {/* COLUMN 1: PARTICIPATING LEDGERS & HISTORIC BID LOGS */}
            <div className="lg:col-span-3 h-full flex flex-col gap-3 min-h-0 overflow-hidden">
              
              {/* Teams List (height-flexible, scrolling) */}
              <div className="flex-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 flex-shrink-0">
                  <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} className="text-[#f59e0b]" /> Franchises ({teams.length})
                  </h3>
                  <span className="text-[8px] font-bold text-slate-500 bg-slate-950 px-1 py-0.5 rounded uppercase">Ledger</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-2 custom-scrollbar">
                  {teams.map((t) => {
                    const buys = players.filter(p => p.soldTo === t.id);
                    const isCurrentLeading = highestBidderId === t.id;
                    const isLowBudget = t.purse < (t.initialPurse * 0.1);
                    
                    return (
                      <div 
                        key={t.id}
                        className={`p-2.5 rounded-xl border transition-all relative ${
                          isCurrentLeading 
                            ? 'bg-slate-900/90 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                            : isLowBudget
                            ? 'bg-rose-950/15 border-rose-500/20'
                            : 'bg-slate-950/40 border-slate-850/60 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-3 items-stretch self-stretch rounded flex-shrink-0" style={{ backgroundColor: t.bgColor }} />
                            <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {/* AFK/Bot Toggle */}
                            <button
                              onClick={() => {
                                setTeamBotStatus(prev => {
                                  const nextStatus = !prev[t.id];
                                  try {
                                    localStorage.setItem('cricket_team_bot_status', JSON.stringify({ ...prev, [t.id]: nextStatus }));
                                  } catch (eee) {}
                                  showNotification(`${t.name} turned ${nextStatus ? '🤖 AUTO-BOT ON' : '👤 MANUAL'}`, 'info');
                                  return { ...prev, [t.id]: nextStatus };
                                });
                              }}
                              className={`px-1.5 py-0.5 rounded border text-[6.5px] font-black uppercase cursor-pointer transition-all ${
                                teamBotStatus[t.id]
                                  ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                                  : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
                              }`}
                              title="Toggle AFK AI Auto-bid Bot status"
                            >
                              {teamBotStatus[t.id] ? '🤖 Bot' : '👤 Man'}
                            </button>
                            {isCurrentLeading && (
                              <span className="bg-[#f59e0b] text-slate-950 text-[6.5px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                                LEADING
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Purse / squad count */}
                        <div className="grid grid-cols-2 gap-2 text-[9px] border-b border-dashed border-slate-850 pb-1.5 mb-1.5 text-slate-400">
                          <div>
                            <span className="text-[7px] text-slate-500 uppercase block font-bold">Wallet:</span>
                            <span className={`font-black font-mono ${isLowBudget ? 'text-rose-450 animate-pulse' : 'text-[#f59e0b]'}`}>
                              {formatPrice(t.purse)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[7px] text-slate-500 uppercase block font-bold">Squad:</span>
                            <span className="font-black text-white font-mono">{buys.length} bought</span>
                          </div>
                        </div>

                        {/* Purchased players names */}
                        <div className="flex flex-wrap gap-1">
                          {buys.map((bp) => (
                            <span 
                              key={bp.id} 
                              className="text-[7.5px] font-bold uppercase px-1.5 py-0.2 bg-slate-900 border border-slate-850 text-slate-400 rounded"
                              title={`${bp.name} - ${formatPrice(bp.soldPrice || 0)}`}
                            >
                              {bp.name.split(' ').pop()} <span className="text-emerald-400 font-bold font-mono">({bp.soldPrice}Cr)</span>
                            </span>
                          ))}
                          {buys.length === 0 && (
                            <span className="text-[7.5px] font-bold text-slate-600 italic">No acquisitions drafted</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dual-tabbed module (Recent Bids / Unsold & Re-nomination pool) */}
              <div className="h-[220px] bg-slate-900/40 border border-slate-850 rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 flex-shrink-0">
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                    <button
                      onClick={() => setCol1BottomTab('bids')}
                      className={`px-2.5 py-1 rounded text-[7.5px] font-black uppercase tracking-wider border-none cursor-pointer transition-all ${
                        col1BottomTab === 'bids'
                          ? 'bg-[#f59e0b] text-slate-950'
                          : 'text-slate-400 bg-transparent hover:text-slate-200'
                      }`}
                    >
                      Bids History ({bidsHistory.length})
                    </button>
                    <button
                      onClick={() => setCol1BottomTab('unsold')}
                      className={`px-2.5 py-1 rounded text-[7.5px] font-black uppercase tracking-wider border-none cursor-pointer transition-all ${
                        col1BottomTab === 'unsold'
                          ? 'bg-[#f59e0b] text-slate-950'
                          : 'text-slate-400 bg-transparent hover:text-slate-200'
                      }`}
                    >
                      Unsold / Skipped ({players.filter((p, i) => (p.status === 'Unsold' || p.status === 'Skipped') && i !== auctionIndex).length})
                    </button>
                  </div>
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Pool Ledger</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mt-2.5 custom-scrollbar">
                  {col1BottomTab === 'bids' ? (
                    bidsHistory.slice().reverse().map((bid) => (
                      <div 
                        key={bid.id} 
                        className="flex items-center justify-between p-1.5 bg-slate-950/60 border border-slate-850/40 hover:border-slate-800 rounded-lg transition-all text-[10px]"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-1 h-4 rounded flex-shrink-0" style={{ backgroundColor: bid.teamBgColor }} />
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-250 uppercase tracking-tight truncate leading-none mb-0.5">{bid.teamName}</p>
                            <p className="text-[8px] text-slate-500 truncate">
                              For <span className="font-bold text-slate-350">{bid.playerName}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1.5 flex-shrink-0">
                          <div>
                            <span className="font-mono font-black text-[#f59e0b] leading-none block">{formatPrice(bid.amount)}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveBid(bid.id)}
                            className="p-1 text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 rounded border-none bg-transparent cursor-pointer"
                            title="Remove mis-placed bid"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    players
                      .map((p, idx) => ({ ...p, originalIdx: idx }))
                      .filter((p) => (p.status === 'Unsold' || p.status === 'Skipped') && p.originalIdx !== auctionIndex)
                      .map((p) => {
                        const isManager = activeUserRole === 'commissioner_admin' || activeUserRole === 'auctioneer';
                        return (
                          <div 
                            key={p.id} 
                            className="flex items-center justify-between p-1.5 bg-slate-950/60 border border-slate-850/40 rounded-lg transition-all text-[10px]"
                          >
                            <div className="min-w-0 flex-1 pr-2">
                              <div className="flex items-center gap-1">
                                <span className="font-black text-white uppercase truncate">{p.name}</span>
                                <span className={`text-[6.5px] font-black uppercase px-1 rounded-sm leading-none ${
                                  p.status === 'Skipped' ? 'bg-indigo-305/10 text-indigo-400' : 'bg-slate-805 text-slate-450'
                                }`}>
                                  {p.status}
                                </span>
                              </div>
                              <p className="text-[7.5px] text-slate-500 font-bold uppercase mt-0.5 mt-1 leading-none tracking-wider">
                                {p.role} • Base {formatPrice(p.basePrice)}Cr
                              </p>
                            </div>
                            
                            {isManager ? (
                              <button
                                onClick={() => handleReNominatePlayer(p.id)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[7px] font-black uppercase tracking-wide rounded-md border-none cursor-pointer flex-shrink-0"
                              >
                                Nominate 🔨
                              </button>
                            ) : (
                              <span className="text-[7px] font-black uppercase text-slate-600 tracking-wider">
                                Locked
                              </span>
                            )}
                          </div>
                        );
                      })
                  )}

                  {col1BottomTab === 'bids' && bidsHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-6">
                      <Clock size={16} className="text-slate-705 mb-1" />
                      <span className="text-[8px] uppercase font-black tracking-wider block">No live logs</span>
                    </div>
                  )}

                  {col1BottomTab === 'unsold' && players.filter((p, i) => (p.status === 'Unsold' || p.status === 'Skipped') && i !== auctionIndex).length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 py-6">
                      <CheckCircle2 size={16} className="text-slate-705 mb-1" />
                      <span className="text-[8px] uppercase font-black tracking-wider block">Pool clean</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* COLUMN 2: ACTIVE NOMINEE & DECISION CONTROL HUB */}
            <div className="lg:col-span-6 h-full flex flex-col gap-3 min-h-0 overflow-hidden">
              
              {/* ACTIVE NOMINEE CARD (Extreme high density, horizontal design) */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-3.5 relative overflow-hidden flex-shrink-0 shadow-lg">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                
                <div className="grid grid-cols-12 gap-3 items-center">
                  
                  {/* Player details (4 Cols) */}
                  <div className="col-span-5 flex items-center gap-2 border-r border-slate-850 pr-1 truncate">
                    <div className="w-11 h-11 bg-gradient-to-tr from-slate-950 to-slate-850 rounded-full flex items-center justify-center border border-slate-850 flex-shrink-0 relative">
                      <User size={22} className="text-slate-500" />
                      <span className="absolute bottom-0 right-0 text-[9px]">
                        {currentNominatedPlayer.country === 'Indian' ? '🇮🇳' : '🌍'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-white uppercase truncate tracking-tight">{currentNominatedPlayer.name}</h4>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="px-1 rounded text-[7.5px] font-bold block uppercase bg-slate-950 text-slate-350">
                          {currentNominatedPlayer.role}
                        </span>
                        <span className="text-[7.5px] text-slate-500 font-mono">
                          Rating: {currentNominatedPlayer.rating}
                        </span>
                      </div>
                      <div className="text-[8.5px] text-[#f59e0b] font-mono font-bold mt-0.5">
                        Base: {formatPrice(currentNominatedPlayer.basePrice)}
                      </div>

                      {/* Real-time Value Index Indicators & dynamic targeted alerts */}
                      {(() => {
                        const expVal = getExpectedValuation(currentNominatedPlayer);
                        const indexVal = currentBidPrice / (expVal || 1);
                        let text = 'Fair Value';
                        let badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                        if (indexVal < 0.9) {
                          text = '🎁 Steal Bargain';
                          badgeColor = 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25';
                        } else if (indexVal > 1.8) {
                          text = '🔥 Extreme Overpay';
                          badgeColor = 'bg-rose-500/10 text-rose-455 border border-rose-550/25';
                        } else if (indexVal > 1.2) {
                          text = '⚡ Premium Price';
                          badgeColor = 'bg-amber-500/10 text-amber-500 border border-[#f59e0b]/25';
                        }
                        return (
                          <div className="mt-1 flex flex-col gap-1 pr-1">
                            <div className="flex items-center gap-1">
                              <span className={`text-[7px] font-black uppercase px-1.5 py-0.2 rounded-sm ${badgeColor}`}>
                                {text} ({indexVal.toFixed(1)}x index)
                              </span>
                            </div>
                            {(() => {
                              const shortlistTeams = teams.filter(t => (teamShortlists[t.id] || []).includes(currentNominatedPlayer.id));
                              if (shortlistTeams.length === 0) return null;
                              return (
                                <div className="flex flex-wrap items-center gap-0.5 text-[6.5px] font-bold text-slate-400 pt-0.5 border-t border-slate-850">
                                  <span>Targets:</span>
                                  {shortlistTeams.map(st => (
                                    <span 
                                      key={st.id} 
                                      className="px-1 py-0.2 rounded-sm uppercase text-[6.5px] font-black" 
                                      style={{ backgroundColor: `${st.bgColor}15`, color: st.bgColor, border: `1px solid ${st.bgColor}20` }}
                                    >
                                      {st.logoEmoji} {st.name.split(' ').pop()}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Current Price display (4 Cols) */}
                  <div className="col-span-4 text-center">
                    <span className="text-[7.5px] font-black uppercase tracking-wider text-slate-500 block mb-0.5">Live Bidding Price</span>
                    <div className="h-8 flex items-center justify-center">
                      <BidTickerPrice price={currentBidPrice} formatPrice={formatPrice} />
                    </div>
                    <div className="text-[8px] text-slate-400 mt-1 truncate">
                      {highestBidderId ? (
                        <span className="uppercase font-extrabold" style={{ color: teams.find(t => t.id === highestBidderId)?.bgColor }}>
                          Leading: {teams.find(t => t.id === highestBidderId)?.name.split(' ').pop()}
                        </span>
                      ) : (
                        <span className="text-slate-500 uppercase font-black text-[7px] tracking-widest">No bids logged</span>
                      )}
                    </div>
                  </div>

                  {/* Circular countdown (3 Cols) */}
                  <div className="col-span-3 flex justify-end">
                    <div className="relative w-11 h-11 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="22"
                          cy="22"
                          r="17"
                          className="stroke-slate-850 stroke-[1.5] fill-none"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="17"
                          className={`stroke-[2.5] fill-none transition-all duration-1000 ${
                            timeLeft <= 10 ? 'stroke-rose-500' : 'stroke-[#10b981]'
                          }`}
                          strokeDasharray={107}
                          strokeDashoffset={107 - (107 * timeLeft) / 30}
                        />
                      </svg>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                        <span className={`text-[10px] font-black font-mono ${
                          timeLeft <= 10 ? 'text-rose-500 animate-bounce' : 'text-white'
                        }`}>{timeLeft}s</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* DECISION DESK / CONTROLS DESK */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-2.5 flex items-center justify-between gap-3 flex-shrink-0 shadow-sm">
                {/* Play/Pause/Clock buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setTimerActive(!timerActive)}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    title={timerActive ? 'Pause Count' : 'Resume Count'}
                  >
                    {timerActive ? <Pause size={12} className="text-[#f59e0b]" /> : <Play size={12} className="text-emerald-400" />}
                  </button>
                  <button
                    onClick={() => setTimeLeft(30)}
                    className="p-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                    title="Reset timer"
                  >
                    <RotateCcw size={12} />
                  </button>
                  
                  <button
                    onClick={handleSkipPlayer}
                    className="px-2 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-405 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleUnsold}
                    className="px-2 py-2 bg-rose-950/20 hover:bg-rose-950/30 border border-rose-500/10 text-rose-400 text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Unsold
                  </button>

                  <button
                    onClick={handleResetAuction}
                    className="p-2 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/20 text-rose-400 hover:text-rose-350 rounded-lg transition-all cursor-pointer"
                    title="Reset Auction Session back to Setup"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {/* Epic SOLD Assignment Button */}
                <button
                  onClick={handleSold}
                  disabled={highestBidderId === null}
                  className={`px-4 py-2 text-[9.5px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none shadow-md outline-none ${
                    highestBidderId !== null
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/10'
                      : 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <Award size={12} /> SOLD! DECREE DEAL
                </button>
              </div>

              {/* ADMIN & DISASTER RECOVERY STRIP */}
              {(activeUserRole === 'commissioner_admin' || activeUserRole === 'auctioneer') && (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-2.5 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 shadow-inner">
                  <div className="flex items-center gap-1">
                    <span className="text-[7.5px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Control Desk</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Undo last action */}
                    <button
                      disabled={undoStack.length === 0}
                      onClick={handleUndoLastSale}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border-none cursor-pointer ${
                        undoStack.length > 0 
                          ? 'bg-rose-950/40 hover:bg-rose-900/40 text-rose-350' 
                          : 'bg-slate-900 text-slate-650 cursor-not-allowed opacity-40'
                      }`}
                      title={undoStack.length > 0 ? "Undo the last sold/unsold/skipped event" : "No actions available on undo stack"}
                    >
                      <RotateCcw size={10} /> Undo
                    </button>

                    {/* Redo last action */}
                    <button
                      disabled={redoStack.length === 0}
                      onClick={handleRedoLastSale}
                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 border-none cursor-pointer ${
                        redoStack.length > 0 
                          ? 'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-350' 
                          : 'bg-slate-900 text-slate-650 cursor-not-allowed opacity-40'
                      }`}
                      title={redoStack.length > 0 ? "Redo the previously reversed event" : "No actions available on redo stack"}
                    >
                      <RotateCw size={10} /> Redo
                    </button>

                    {/* Auto bot filling */}
                    <button
                      onClick={handleAutofillAFKSlots}
                      className="px-2 py-1 bg-purple-950/40 hover:bg-purple-900/45 border border-purple-500/30 text-purple-300 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      title="Directly autofill empty roster slots with unsold players at base prices for bot-toggled teams"
                    >
                      🤖 Bot Autofill
                    </button>

                    {/* State export */}
                    <button
                      onClick={handleExportJSON}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                      title="Download complete draft state backup as JSON file"
                    >
                      <Download size={10} /> Export State
                    </button>

                    {/* State import */}
                    <label className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer relative">
                      <Upload size={10} /> Import Backup
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportJSON} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                        title="Upload JSON draft backup file to recover session"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TABS SELECTOR ROW */}
              <div className="flex border-b border-slate-850/60 pb-0.5 flex-shrink-0">
                <button
                  onClick={() => setTelemetryTab('commentary')}
                  className={`px-4 py-1.2 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 border-none bg-transparent ${
                    telemetryTab === 'commentary' 
                      ? 'text-[#f59e0b] border-amber-500/100' 
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  <Radio size={11} /> AI Commentator Studio 🎙️
                </button>
                <button
                  onClick={() => setTelemetryTab('chart')}
                  className={`px-4 py-1.2 text-[9px] font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 border-none bg-transparent ${
                    telemetryTab === 'chart' 
                      ? 'text-emerald-400 border-emerald-500/100' 
                      : 'text-slate-500 border-transparent hover:text-slate-300'
                  }`}
                >
                  <Sparkles size={11} /> Bidding Price Trend chart 📈
                </button>
              </div>

              {/* TELEMETRY ACTIVE PANELS WORKSPACE */}
              <div className="flex-1 min-h-0 bg-slate-900/40 border border-slate-850 rounded-2xl p-3 flex flex-col overflow-hidden relative shadow-inner">
                
                {telemetryTab === 'commentary' ? (
                  <div className="flex flex-col h-full justify-between gap-1.5 min-h-0 overflow-hidden">
                    {/* Comment bubble content (scrollable) */}
                    <div className="flex-1 overflow-y-auto pr-1">
                      <span className="text-[7.5px] font-black uppercase tracking-widest block text-slate-500 mb-1.5">GULLYVOICE BROADCAST TELEMETRY</span>
                      <p className="text-slate-305 text-xs italic leading-relaxed antialiased font-medium font-sans">
                        {isAiLoading ? (
                          <span className="flex items-center gap-1.5 text-amber-500/80 uppercase font-mono text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-100" />
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-200" />
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-300" />
                            <span>Transcribing ground telemetry...</span>
                          </span>
                        ) : (
                          `"${aiCommentary}"`
                        )}
                      </p>
                    </div>

                    {/* Speech Setup Form row */}
                    <div className="pt-2 border-t border-slate-850 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-[10px] text-slate-400 mt-2 bg-slate-950/40 p-2 rounded-xl">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-black uppercase text-slate-500 border-none">Tune STYLE:</span>
                        <select
                          value={voiceStyle}
                          onChange={(e: any) => setVoiceStyle(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[8.5px] font-bold text-[#f59e0b] outline-none cursor-pointer"
                        >
                          <option value="ipl">IPL Pro 🎙️</option>
                          <option value="gully">Street 🇮🇳</option>
                          <option value="classic">Gavel 🇬🇧</option>
                          <option value="analyst">Analyst 📊</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAiSpeechEnabled(!aiSpeechEnabled)}
                          className={`px-1.5 py-0.5 border border-slate-800 text-[8px] font-bold rounded cursor-pointer transition-all ${
                            aiSpeechEnabled ? 'text-amber-500 bg-amber-500/5 border-amber-500/25' : 'text-slate-500 bg-transparent'
                          }`}
                        >
                          Speech Aloud: {aiSpeechEnabled ? 'ON' : 'OFF'}
                        </button>

                        <button
                          disabled={isAiLoading || !currentNominatedPlayer}
                          onClick={() => fetchAiCommentary('bidding_update', { player: currentNominatedPlayer, bids: bidsHistory.filter(b => b.playerId === currentNominatedPlayer.id), leadTeam: teams.find(t => t.id === highestBidderId)?.name || 'None', leadPrice: currentBidPrice, increment: selectedBidIncrement })}
                          className="px-2 py-0.5 bg-[#f59e0b] hover:bg-amber-500 text-slate-950 border-none rounded text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles size={9} /> Trigger
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
                    <span className="text-[7.5px] font-black uppercase tracking-widest block text-emerald-400 mb-2 flex-shrink-0">Live Bidding Price Trend logs</span>
                    <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={[
                            {
                              label: 'Base Price',
                              price: currentNominatedPlayer ? currentNominatedPlayer.basePrice : 0,
                              bidder: 'Base Price',
                              bidNumber: 0
                            },
                            ...bidsHistory.filter(b => b.playerId === currentNominatedPlayer?.id).map((b, idx) => ({
                              label: `Bid #${idx + 1}`,
                              price: b.amount,
                              bidder: b.teamName,
                              bidNumber: idx + 1
                            }))
                          ]} 
                          margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis 
                            dataKey="label" 
                            stroke="#64748b" 
                            fontSize={8} 
                            fontFamily="JetBrains Mono" 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={8} 
                            fontFamily="JetBrains Mono" 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(v) => `${v.toFixed(1)}Cr`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#10b981" 
                            strokeWidth={2} 
                            dot={{ fill: '#0f172a', stroke: '#10b981', strokeWidth: 1.5, r: 3 }} 
                            activeDot={{ r: 5, strokeWidth: 0, fill: '#f59e0b' }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              </div>

              {/* Keyboard controller help line */}
              <div className="p-1 px-3 bg-slate-950/20 border border-slate-900 rounded-xl flex items-center justify-center gap-2 text-[8px] text-slate-500 uppercase font-black tracking-widest flex-shrink-0">
                <span>Space: Timer State • Enter: sold decree</span>
              </div>

            </div>

            {/* COLUMN 3: FRANCHISE BIDDING PADDLES DESK */}
            <div className="lg:col-span-3 h-full flex flex-col gap-3 min-h-0 overflow-hidden">
              
              {/* Setup Raise Increments (Compact horizontal array) */}
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-3 space-y-2 flex-shrink-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Raise Price Increment</span>
                  <span className="text-[10px] font-mono font-black text-[#f59e0b]">+{selectedBidIncrement}Cr</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[0.2, 0.5, 1.0, 5.0].map((inc) => (
                    <button
                      key={inc}
                      onClick={() => setSelectedBidIncrement(inc)}
                      className={`py-2 rounded-xl text-[9px] font-black transition-all tracking-wider cursor-pointer border-none font-sans ${
                        selectedBidIncrement === inc 
                          ? 'bg-[#f59e0b] text-slate-950 shadow-md font-black shadow-amber-500/10' 
                          : 'bg-slate-950/60 text-slate-400 border border-slate-850 hover:text-slate-200'
                      }`}
                    >
                      +{formatPrice(inc).replace('₹', '').replace('$', '')}
                    </button>
                  ))}
                </div>
              </div>

              {/* FLIGHT CONTROLLER PADDLE GRID (Unified scrolling paddle dashboard) */}
              <div className="flex-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-3 flex flex-col min-h-0 overflow-hidden shadow-md">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/20 flex-shrink-0">
                  <span className="text-[10px] font-black text-[#10b981] uppercase tracking-widest flex items-center gap-1">
                    <Coins size={11} className="text-emerald-400" /> Click to bid
                  </span>
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest">Paddles console</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-2.5 custom-scrollbar">
                  {teams.map((t) => {
                    const buysCount = players.filter(p => p.soldTo === t.id && p.status === 'Sold').length;
                    const teamBuys = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
                    const wkWinsCount = teamBuys.filter(p => p.role === 'Wicket-Keeper').length;
                    
                    const isFull = buysCount >= maxPlayersPerTeam;

                    const incrementToUse = getDynamicIncrement(currentBidPrice);
                    const nextRequiredBid = Number((currentBidPrice + incrementToUse).toFixed(2));
                    const canBid = t.purse >= nextRequiredBid && !isFull;
                    const isWinning = highestBidderId === t.id;
                    const isCustomOpen = activeCustomBidTeamId === t.id;
                    const canRTM = highestBidderId !== null && highestBidderId !== t.id && t.purse >= currentBidPrice && currentBidPrice > 0 && !isFull;

                    // RBAC check
                    const isRbacEnabledForThisTeam = 
                      activeUserRole === 'commissioner_admin' || 
                      activeUserRole === 'auctioneer' || 
                      activeUserRole === `team_owner_${t.id}`;

                    return (
                      <div 
                        key={t.id} 
                        className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all ${
                          isWinning
                            ? 'bg-slate-900 border-[#f59e0b]'
                            : isFull
                            ? 'bg-rose-950/10 border-rose-500/20 opacity-80'
                            : !isRbacEnabledForThisTeam
                            ? 'bg-slate-950/40 border-slate-900/60 opacity-60'
                            : 'bg-slate-950/60 border-slate-850 hover:border-slate-800'
                        }`}
                      >
                        {/* Team Info Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm flex-shrink-0">{t.logoEmoji || '🦁'}</span>
                            <div className="min-w-0">
                              <span className="text-[10px] font-black uppercase text-white tracking-tight truncate block">{t.name}</span>
                              <div className="flex items-center gap-1.5 text-[7.5px] font-bold text-slate-500 uppercase flex-wrap">
                                <span>Owner: {t.manager || 'Unassigned'}</span>
                                <span>•</span>
                                <span className="text-amber-400 font-extrabold">Purse: {formatPrice(t.purse)}</span>
                                {wkWinsCount === 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-rose-400 font-black animate-pulse">⚠️ LACKS WK</span>
                                  </>
                                )}
                                {t.purse < nextRequiredBid && !isFull && (
                                  <>
                                    <span>•</span>
                                    <span className="text-rose-500 font-black">🔒 OVERSPEND BLOCK</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {isWinning ? (
                            <span className="text-[7.5px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shadow-sm animate-pulse">
                              HOLDING BID
                            </span>
                          ) : isFull ? (
                            <span className="text-[7.5px] font-black uppercase text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded border border-rose-500/35">
                              🔒 SQUAD FULL ({buysCount}/{maxPlayersPerTeam})
                            </span>
                          ) : !isRbacEnabledForThisTeam ? (
                            <span className="text-[7px] font-bold text-slate-500 flex items-center gap-0.5">
                              🔒 Locked
                            </span>
                          ) : null}
                        </div>

                        {/* Bid controls */}
                        {!isRbacEnabledForThisTeam ? (
                          <div className="text-[7.5px] text-slate-500 italic text-center p-1.5 font-mono uppercase bg-slate-950/45 border border-slate-900 rounded">
                            Paddle Locked
                          </div>
                        ) : isCustomOpen ? (
                          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-amber-500/30">
                            <input
                              type="number"
                              step="0.1"
                              placeholder={`Min ${currentBidPrice + 0.1}`}
                              value={customBidInputValue}
                              onChange={(e) => setCustomBidInputValue(e.target.value)}
                              className="w-full bg-slate-950 text-white rounded px-2 py-0.5 text-[9px] outline-none font-bold font-mono"
                            />
                            <button
                              onClick={() => {
                                const val = parseFloat(customBidInputValue);
                                if (isNaN(val) || val <= currentBidPrice) {
                                  showNotification(`Bid must exceed current bid of ${formatPrice(currentBidPrice)}!`, 'alert');
                                  return;
                                }
                                handlePlaceBespokeBid(t.id, val);
                                setActiveCustomBidTeamId(null);
                                setCustomBidInputValue('');
                              }}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[8px] font-black rounded border-none cursor-pointer"
                            >
                              Bid
                            </button>
                            <button
                              onClick={() => {
                                setActiveCustomBidTeamId(null);
                                setCustomBidInputValue('');
                              }}
                              className="px-2 py-1 bg-slate-850 hover:bg-slate-800 text-slate-400 text-[8px] font-black rounded border-none cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            {/* Standard increment bid click */}
                            <button
                              disabled={!canBid || isWinning}
                              onClick={() => handlePlaceBid(t.id)}
                              className={`flex-1 py-1 px-2 rounded-lg text-center text-[9px] font-black uppercase tracking-wider transition-all border outline-none ${
                                isWinning
                                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-550 cursor-not-allowed shadow-none font-bold'
                                  : canBid
                                  ? 'bg-emerald-950/20 hover:bg-emerald-900/30 border-emerald-550/20 text-emerald-400 cursor-pointer shadow-sm hover:scale-[1.01]'
                                  : 'bg-slate-950/10 border-slate-900/40 text-slate-650 cursor-not-allowed opacity-30 shadow-none'
                              }`}
                            >
                              {!canBid ? 'OUT' : isWinning ? 'LEADER' : `Offer ${formatPrice(nextRequiredBid).replace('₹', '').replace('$', '')}`}
                            </button>

                            {/* Bespoke Custom Bid toggle */}
                            <button
                              disabled={t.purse <= currentBidPrice}
                              onClick={() => {
                                setActiveCustomBidTeamId(t.id);
                                setCustomBidInputValue((currentBidPrice + (selectedBidIncrement || 0.5)).toString());
                              }}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[8.5px] text-[#f59e0b] font-black rounded-lg cursor-pointer transition-all uppercase tracking-wider"
                              title="Offer Custom Bid Value"
                            >
                              Custom
                            </button>

                            {/* RTM Exercise Button */}
                            {canRTM && (
                              <button
                                onClick={() => handleRTM(t.id)}
                                className="px-2 py-1 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 text-[8.5px] text-[#818cf8] font-black rounded-lg cursor-pointer transition-all uppercase tracking-wider"
                                title="Exercise Right To Match for this player"
                              >
                                RTM
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

              </div>
            )}

      {/* ========================================================================= */}
      {/* 3. CAMPAIGN FINAL RESULTS & METRICS SCREEN */}
      {/* ========================================================================= */}
      {isFinished && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          
          {/* Confetti celebration banner */}
          <div className="bg-gradient-to-r from-[#111827] via-emerald-950/50 to-[#111827] border-2 border-emerald-500/20 p-8 rounded-[2.5rem] text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Trophy size={32} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-slate-50">
              AUCTION CAMPAIGN <span className="text-emerald-400 italic">FINALISED!</span>
            </h2>
            <p className="text-xs text-slate-405 max-w-md mx-auto leading-relaxed">
              All nominated profiles have completed transitions. The financial bidding catalogs have logged contracts in real-time. Review franchise lists below.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={handleExportCSV}
                className="px-5 py-2.5 bg-emerald-550 hover:bg-emerald-600 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-2 cursor-pointer shadow shadow-emerald-500/10"
              >
                <Download size={14} /> Export CSV Spreadsheet ledgers
              </button>
              <button
                onClick={handleResetAuction}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 text-[#f59e0b] border border-slate-800 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Restart Campaign Setup
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* FRANCHISE FINAL BANK STATUS SQUAD LOGS - COLUMN 1 */}
            <div className="lg:col-span-1 bg-slate-900/60 border border-slate-850 rounded-[2rem] p-6 space-y-6">
              <h3 className="font-heading font-black text-xs text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-800">
                Franchise Ledger Status
              </h3>

              <div className="space-y-4">
                {teams.map((t) => {
                  const itemsBought = players.filter(p => p.soldTo === t.id);
                  const spend = t.initialPurse - t.purse;
                  
                  return (
                    <div key={t.id} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 font-sans space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-3 rounded" style={{ backgroundColor: t.bgColor }} />
                        <span className="text-xs font-black text-white uppercase">{t.name}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-900">
                        <div>
                          <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none">Purchased</span>
                          <span className="text-xs font-black text-slate-300 font-mono inline-block mt-1">{itemsBought.length}</span>
                        </div>
                        <div>
                          <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none font-sans">Total Spend</span>
                          <span className="text-xs font-black text-[#f59e0b] font-mono inline-block mt-1">{spend.toFixed(2)} Cr</span>
                        </div>
                        <div>
                          <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none">Remaining</span>
                          <span className="text-xs font-black text-emerald-400 font-mono inline-block mt-1">{t.purse.toFixed(2)} Cr</span>
                        </div>
                      </div>

                      {/* Display roles */}
                      <div className="space-y-1.5">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider block">Acquired Roster:</span>
                        <div className="space-y-1">
                          {itemsBought.map((ib) => (
                            <div key={ib.id} className="flex justify-between items-center text-[9px] bg-slate-900/30 px-2 py-1.5 rounded border border-slate-900">
                              <span className="text-slate-300 font-bold block truncate max-w-[120px]">{ib.name}</span>
                              <span className="font-mono text-[#f59e0b] font-black">({formatPrice(ib.soldPrice!).replace('₹', '')})</span>
                            </div>
                          ))}

                          {itemsBought.length === 0 && (
                            <span className="text-[8px] font-bold text-slate-600 block pl-1">No collections drafted</span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* CATALOG CONSOLIDATED DEALS - COLUMN 2 & 3 */}
            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-850 rounded-[2rem] p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <h3 className="font-heading font-black text-xs text-[#f59e0b] uppercase tracking-widest">
                  Consolidated Draft Deal Register
                </h3>

                {/* Filter and search controllers */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <input 
                      type="text" 
                      placeholder="Find player / role..." 
                      value={summarySearch}
                      onChange={(e) => setSummarySearch(e.target.value)}
                      className="bg-slate-950 border border-slate-850 text-xs px-3 py-1.5 rounded-xl text-white outline-none focus:border-[#f59e0b] font-semibold w-full sm:w-44"
                    />
                  </div>
                  
                  {['all', 'sold', 'unsold'].map((st: any) => (
                    <button
                      key={st}
                      onClick={() => setSummaryFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
                        summaryFilter === st 
                          ? 'bg-amber-500 text-slate-950 font-black' 
                          : 'bg-slate-950 text-slate-450 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary catalog records table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 text-[8.5px] uppercase font-black tracking-wider">
                      <th className="p-3.5">Nominee Profile</th>
                      <th className="p-3.5">Speciality Type</th>
                      <th className="p-3.5">Country</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Draft Franchise</th>
                      <th className="p-3.5 text-right">Sold Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 font-sans">
                    {finalFilteredPlayers.map((p) => {
                      const finalTeam = teams.find(t => t.id === p.soldTo);
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3.5 font-bold text-white uppercase text-xs">{p.name}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-slate-900 rounded text-slate-400 uppercase text-[8.5px] font-black tracking-widest border border-slate-850">
                              {p.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-[10px] text-slate-350">{p.country === 'Indian' ? 'India 🇮🇳' : 'Overseas 🌍'}</td>
                          <td className="p-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              p.status === 'Sold' 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3.5 font-black text-slate-100 uppercase">
                            {finalTeam ? (
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: finalTeam.bgColor }} />
                                <span>{finalTeam.name}</span>
                              </div>
                            ) : '-'}
                          </td>
                          <td className="p-3.5 text-right font-mono font-black text-[#f59e0b] text-xs">
                            {p.soldPrice ? formatPrice(p.soldPrice) : '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {finalFilteredPlayers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500 uppercase tracking-widest text-[9.5px]">
                          No records matched search constraints
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>

        </div>
      )}

          </div>
        )}

        {/* TAB 2: RULES MODULE */}
        {activeModuleTab === 'rules' && (
          <RulesModule
            minPlayersPerTeam={minPlayersPerTeam}
            setMinPlayersPerTeam={(val) => {
              setMinPlayersPerTeam(val);
              logAction('Min Players Per Team Adjusted', 'Rule', `Minimum players per team limit was set to ${val}.`);
            }}
            maxPlayersPerTeam={maxPlayersPerTeam}
            setMaxPlayersPerTeam={(val) => {
              setMaxPlayersPerTeam(val);
              logAction('Max Players Per Team Adjusted', 'Rule', `Maximum players per team limit was set to ${val}.`);
            }}
            maxOverseasPlayers={maxOverseasPlayers}
            setMaxOverseasPlayers={(val) => {
              setMaxOverseasPlayers(val);
              logAction('Max Overseas Players Adjusted', 'Rule', `Maximum overseas players per team limit was set to ${val}.`);
            }}
            mandatorySquadCount={mandatorySquadCount}
            setMandatorySquadCount={(val) => {
              setMandatorySquadCount(val);
              logAction('Mandatory Squad Roster Size Set', 'Rule', `Squad roster size limit was set to ${val}.`);
            }}
            autoIncrementEnabled={autoIncrementEnabled}
            setAutoIncrementEnabled={(val) => {
              setAutoIncrementEnabled(val);
              logAction('Bid Auto Increment Toggled', 'Rule', `Auto-increment engine set to: ${val ? 'ENABLED' : 'DISABLED'}`);
            }}
            rtmEnabled={rtmEnabled}
            setRtmEnabled={(val) => {
              setRtmEnabled(val);
              logAction('RTM Option Toggled', 'Rule', `Right To Match option set to: ${val ? 'ENABLED' : 'DISABLED'}`);
            }}
            userRoles={userRoles}
            activeUserRole={activeUserRole}
            setActiveUserRole={(val) => {
              setActiveUserRole(val);
              logAction('Admin/User Role Switched', 'Auth', `Client logged in / switched active credentials key to "${val}"`, val);
            }}
            players={players}
            setPlayers={setPlayers}
            teams={teams}
            setTeams={setTeams}
            formatPrice={formatPrice}
            showNotification={showNotification}
            dispatchGatewayAlert={dispatchGatewayAlert}
            setAuctionIndex={setAuctionIndex}
            setCurrentBidPrice={setCurrentBidPrice}
            setHighestBidderId={setHighestBidderId}
            setTimeLeft={setTimeLeft}
            setTimerActive={setTimerActive}
            onStateUpdate={(updatedTeams, updatedPlayers) => {
              saveAuctionToLocalStorage(updatedTeams, updatedPlayers, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft, bidsHistory);
            }}
          />
        )}

        {/* TAB 3: REGISTRATION MODULE */}
        {activeModuleTab === 'registration' && (
          <RegistrationModule
            players={players}
            setPlayers={setPlayers}
            formatPrice={formatPrice}
            showNotification={showNotification}
            dispatchGatewayAlert={dispatchGatewayAlert}
            selfRegName={selfRegName}
            setSelfRegName={setSelfRegName}
            selfRegRole={selfRegRole}
            setSelfRegRole={setSelfRegRole}
            selfRegCountry={selfRegCountry}
            setSelfRegCountry={setSelfRegCountry}
            selfRegBasePrice={selfRegBasePrice}
            setSelfRegBasePrice={setSelfRegBasePrice}
            selfRegRating={selfRegRating}
            setSelfRegRating={setSelfRegRating}
            selfRegAvatar={selfRegAvatar}
            setSelfRegAvatar={setSelfRegAvatar}
            csvBulkText={csvBulkText}
            setCsvBulkText={setCsvBulkText}
            onStateUpdate={(updatedPlayers) => {
              saveAuctionToLocalStorage(teams, updatedPlayers, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft, bidsHistory);
            }}
          />
        )}

        {/* TAB 4: TEAMS & WALLETS COMPLIANCE MODULE */}
        {activeModuleTab === 'teams' && (
          <TeamsModule
            teams={teams}
            setTeams={setTeams}
            players={players}
            formatPrice={formatPrice}
            showNotification={showNotification}
            minPlayersPerTeam={minPlayersPerTeam}
            maxPlayersPerTeam={maxPlayersPerTeam}
            maxOverseasPlayers={maxOverseasPlayers}
            onDeleteTeam={(tId) => {
              const team = teams.find(t => t.id === tId);
              if (!team) return;
              if (window.confirm(`Are you sure you want to permanently delete the franchise "${team.name}"? This will automatically release all their drafted players back to the Unsold pool!`)) {
                const nextTeams = teams.filter(t => t.id !== tId);
                setTeams(nextTeams);
                
                const nextPlayers = players.map(p => {
                  if (p.soldTo === tId) {
                    return {
                      ...p,
                      status: 'Unsold' as const,
                      soldTo: undefined,
                      soldPrice: undefined
                    };
                  }
                  return p;
                });
                setPlayers(nextPlayers);
                showNotification(`Franchise "${team.name}" and their drafted players have been successfully released/deleted!`, "success");
                saveAuctionToLocalStorage(nextTeams, nextPlayers, auctionIndex, isFinished, currentBidPrice, highestBidderId, timeLeft, bidsHistory);
              }
            }}
          />
        )}

        {/* TAB 5: BROADCAST LOWER THIRD & FORTUNE BAG WHEEL */}
        {activeModuleTab === 'broadcast' && (
          <BroadcastModule
            players={players}
            setPlayers={setPlayers}
            formatPrice={formatPrice}
            showNotification={showNotification}
            currentBidPrice={currentBidPrice}
            highestBidderId={highestBidderId}
            timeLeft={timeLeft}
            teams={teams}
            isWheelSpinning={isWheelSpinning}
            wheelRotation={wheelRotation}
            triggerWheelSpin={triggerWheelSpin}
            currentNominatedPlayer={currentNominatedPlayer}
          />
        )}

        {/* TAB 6: COMM COMMUNICATIONS OUTBOX TELEMETRY LOGS */}
        {activeModuleTab === 'notifications' && (
          <NotificationsModule
            gatewayLogs={gatewayLogs}
            setGatewayLogs={setGatewayLogs}
            showNotification={showNotification}
          />
        )}

        {/* TAB 7: ROS REPORTS & ANALYTICAL GRAPHS */}
        {activeModuleTab === 'reports' && (
          <ReportsModule
            players={players}
            teams={teams}
            formatPrice={formatPrice}
            handleExportCSV={handleExportCSV}
            summarySearch={summarySearch}
            setSummarySearch={setSummarySearch}
            summaryFilter={summaryFilter}
            setSummaryFilter={setSummaryFilter}
            finalFilteredPlayers={finalFilteredPlayers}
            showNotification={showNotification}
          />
        )}

        {/* TAB 8: POST-AUCTION & ADMINISTRATIVE GOVERNANCE MODULE */}
        {activeModuleTab === 'governance' && (
          <GovernanceModule
            players={players}
            setPlayers={setPlayers}
            teams={teams}
            setTeams={setTeams}
            bidsHistory={bidsHistory}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            logAction={logAction}
            formatPrice={formatPrice}
            showNotification={showNotification}
            minPlayersPerTeam={minPlayersPerTeam}
            maxPlayersPerTeam={maxPlayersPerTeam}
            maxOverseasPlayers={maxOverseasPlayers}
            gatewayLogs={gatewayLogs}
            setGatewayLogs={setGatewayLogs}
            dispatchGatewayAlert={dispatchGatewayAlert}
            onResetAuction={handleResetAuction}
          />
        )}

      </main>

      {/* FOOTER METRICS INFO */}
      <footer className="py-2.5 border-t border-slate-900 bg-slate-950 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest leading-none">
            GULLYSCORE MATCH & PLAYER LEAGUE AUCTION SIMULATOR • LIVE ENVIRONMENT
          </p>
        </div>
      </footer>

    </div>
  );
};
