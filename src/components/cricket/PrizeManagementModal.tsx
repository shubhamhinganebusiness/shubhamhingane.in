import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Award, Trophy, Medal, Sparkles, Upload, Trash2, 
  Check, Eye, EyeOff, DollarSign, User, Camera, ArrowRight, RotateCcw, AlertCircle,
  Crown, Plus, CheckCircle2, Info, ChevronDown, ListFilter, ShieldCheck, Flame,
  Target, Star, Languages, Zap
} from 'lucide-react';
import { 
  TournamentPrize, 
  STANDARD_TOURNAMENT_PRIZES,
  SAMPLE_DEMO_PRIZES,
  getTournamentPrizes, 
  saveTournamentPrizes, 
  getValidActivePrizes,
  getTournamentPrizesByTournamentId,
  saveTournamentPrizesForTournament
} from '../../utils/cricketPrizeStorage';
import { 
  useCommentaryLanguage, 
  CommentaryLanguage, 
  setStoredCommentaryLanguage 
} from './commentaryLanguage';

interface PrizeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string;
  tournamentId?: string;
  tournamentName?: string;
  initialPrizes?: TournamentPrize[];
  onSave?: (prizes: TournamentPrize[]) => void;
  onSaved?: (prizes: TournamentPrize[]) => void;
  onTriggerPresentationBoard?: () => void;
  isPresentationBoardLive?: boolean;
}

const AVATAR_PRESETS = [
  { label: 'Dignitary', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Leader', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Sponsor', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Patron', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  { label: 'Gold Trophy', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80' },
];

const CUSTOM_AWARD_PRESETS = [
  { title: 'Maximum Sixes Award', tagline: 'Super Striker Award Sponsored By', defaultAmount: '5,000' },
  { title: 'Best Fielder Award', tagline: 'Safe Hands Award Sponsored By', defaultAmount: '3,000' },
  { title: 'Fastest Fifty Award', tagline: 'Blazing Knock Award Sponsored By', defaultAmount: '5,000' },
  { title: 'Hat-Trick Hero Award', tagline: 'Hat-Trick Special Cash Award By', defaultAmount: '5,000' },
  { title: 'Man of the Match (Final)', tagline: 'Grand Finalist Trophy & Cash By', defaultAmount: '11,000' },
  { title: 'Best Wicket-Keeper Award', tagline: 'Golden Gloves Award Sponsored By', defaultAmount: '3,000' },
  { title: 'Fair Play Team Award', tagline: 'Fair Play Trophy Sponsored By', defaultAmount: '5,000' },
];

interface SaveNotificationData {
  show: boolean;
  savedAt: string;
  activeCount: number;
  totalCount: number;
  details: Array<{
    id: string;
    title: string;
    personName: string;
    amount: string;
    currency: string;
    designation?: string;
    isActive: boolean;
  }>;
}

export const PrizeManagementModal: React.FC<PrizeManagementModalProps> = ({
  isOpen,
  onClose,
  matchId,
  tournamentId,
  tournamentName,
  initialPrizes,
  onSave,
  onSaved,
  onTriggerPresentationBoard,
  isPresentationBoardLive = false,
}) => {
  const [prizes, setPrizes] = useState<TournamentPrize[]>(STANDARD_TOURNAMENT_PRIZES);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [boardTriggerSuccess, setBoardTriggerSuccess] = useState(false);
  const [saveNotification, setSaveNotification] = useState<SaveNotificationData | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'podium' | 'awards' | 'custom' | 'active'>('all');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeLang, setLang] = useCommentaryLanguage();
  const [spotlightType, setSpotlightType] = useState<'six' | 'wicket' | 'fifty' | null>(null);

  const handleTriggerGrandBoard = async () => {
    // 1. First save all current prize settings to storage so broadcast picks it up immediately
    if (tournamentId) {
      await saveTournamentPrizesForTournament(tournamentId, prizes);
    } else {
      await saveTournamentPrizes(prizes, matchId);
    }
    onSave?.(prizes);
    onSaved?.(prizes);

    // 2. Trigger presentation board on broadcast
    if (onTriggerPresentationBoard) {
      onTriggerPresentationBoard();
    } else {
      try {
        window.dispatchEvent(
          new CustomEvent('cricket_trigger_active_graphic', {
            detail: { graphic: 'grand_presentation_board' },
          })
        );
      } catch (_) {}
      try {
        const bc = new BroadcastChannel('cricket_overlay_channel');
        bc.postMessage({ type: 'SET_ACTIVE_GRAPHIC', graphic: 'grand_presentation_board' });
        setTimeout(() => { try { bc.close(); } catch (_) {} }, 500);
      } catch (_) {}
    }

    setBoardTriggerSuccess(true);
    setTimeout(() => setBoardTriggerSuccess(false), 3500);
  };

  const handleSetLanguage = (l: CommentaryLanguage) => {
    setLang(l);
    setStoredCommentaryLanguage(l);
  };

  const handleTestSpotlight = (type: 'six' | 'wicket' | 'fifty') => {
    setSpotlightType(type);
    window.dispatchEvent(
      new CustomEvent('gullyscore:prize_spotlight', {
        detail: {
          type,
          durationMs: 6500,
        },
      })
    );
    setTimeout(() => {
      setSpotlightType(null);
    }, 6500);
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      if (initialPrizes && initialPrizes.length > 0) {
        setPrizes(initialPrizes);
      } else if (tournamentId) {
        setPrizes(getTournamentPrizesByTournamentId(tournamentId));
      } else {
        const stored = getTournamentPrizes(matchId);
        setPrizes(stored);
      }
      setSavedSuccess(false);
      setSaveNotification(null);
    }
  }, [isOpen, matchId, tournamentId, initialPrizes]);

  // Handle field update for any prize
  const updatePrizeField = (id: string, field: keyof TournamentPrize, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Image upload handling
  const handlePhotoUpload = (id: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updatePrizeField(id, 'personPhoto', result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Add customized prize
  const handleAddCustomPrize = (preset?: { title: string; tagline?: string; defaultAmount?: string }) => {
    const newId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPrize: TournamentPrize = {
      id: newId,
      category: 'custom',
      title: preset?.title || 'Custom Tournament Award',
      personName: '',
      personPhoto: '',
      personDesignation: '',
      amount: preset?.defaultAmount || '',
      currency: '₹',
      tagline: preset?.tagline || 'Award Sponsored By',
      isActive: true,
    };
    setPrizes((prev) => [...prev, newPrize]);
    setShowPresetDropdown(false);
    setActiveFilter('all');
  };

  // Delete customized prize
  const handleDeletePrize = (id: string, title: string) => {
    if (confirm(`Remove "${title}" from the prize money manager?`)) {
      setPrizes((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Save prize details with comprehensive notification
  const handleSave = async () => {
    if (tournamentId) {
      await saveTournamentPrizesForTournament(tournamentId, prizes);
    } else {
      await saveTournamentPrizes(prizes, matchId);
    }
    onSave?.(prizes);
    onSaved?.(prizes);
    const active = getValidActivePrizes(prizes);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const notificationPayload: SaveNotificationData = {
      show: true,
      savedAt: nowStr,
      activeCount: active.length,
      totalCount: prizes.length,
      details: prizes
        .filter((p) => p.isActive && (p.personName?.trim() || p.amount?.trim()))
        .map((p) => ({
          id: p.id,
          title: p.title || 'Tournament Award',
          personName: p.personName?.trim() || 'Sponsor Name',
          amount: p.amount?.trim() || '0',
          currency: p.currency || '₹',
          designation: p.personDesignation,
          isActive: p.isActive,
        })),
    };

    setSaveNotification(notificationPayload);
    setSavedSuccess(true);

    if (onSaved) {
      onSaved(prizes);
    }

    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleLoadDemo = () => {
    setPrizes(SAMPLE_DEMO_PRIZES);
    setSaveNotification(null);
  };

  const handleClearAll = () => {
    if (confirm('Clear all prize details? The prize banner above the scorebug will be hidden.')) {
      setPrizes(STANDARD_TOURNAMENT_PRIZES);
      setSaveNotification(null);
    }
  };

  const validPrizes = getValidActivePrizes(prizes);

  // Auto-rotate preview if multiple
  useEffect(() => {
    if (validPrizes.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % validPrizes.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [validPrizes.length]);

  const currentPreviewPrize = validPrizes[previewIndex % (validPrizes.length || 1)];

  // Filter prizes based on active tab
  const filteredPrizes = prizes.filter((p) => {
    if (activeFilter === 'podium') {
      return (
        p.category === 'tournament_1st' ||
        p.category === 'tournament_2nd' ||
        p.category === 'tournament_3rd' ||
        p.category === 'tournament_4th' ||
        p.category === 'fourth_prize'
      );
    }
    if (activeFilter === 'awards') {
      return (
        p.category === 'man_of_series' ||
        p.category === 'best_batsman' ||
        p.category === 'best_bowler'
      );
    }
    if (activeFilter === 'custom') {
      return p.category === 'custom';
    }
    if (activeFilter === 'active') {
      return p.isActive && (Boolean(p.personName?.trim()) || Boolean(p.amount?.trim()));
    }
    return true;
  });

  const customPrizesCount = prizes.filter((p) => p.category === 'custom').length;

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'tournament_1st':
      case 'fourth_prize':
        return {
          badge: 'bg-amber-500/20 text-yellow-300 border-amber-400/40',
          border: 'border-amber-400/60 shadow-amber-500/10',
          icon: <Trophy size={16} className="text-yellow-400 animate-pulse" />,
          label: activeLang === 'mr' ? '१ले पारितोषिक / विजेता' : activeLang === 'hi' ? '१ला पुरस्कार / विजेता' : '1st Prize / Champion',
          rankColor: 'text-yellow-400',
        };
      case 'tournament_2nd':
        return {
          badge: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
          border: 'border-slate-300/50 shadow-slate-300/10',
          icon: <Medal size={16} className="text-slate-200" />,
          label: activeLang === 'mr' ? '२रे पारितोषिक / उपविजेता' : activeLang === 'hi' ? '२रा पुरस्कार / उपविजेता' : '2nd Prize / Runner-Up',
          rankColor: 'text-slate-200',
        };
      case 'tournament_3rd':
        return {
          badge: 'bg-amber-700/20 text-amber-300 border-amber-600/40',
          border: 'border-amber-600/50 shadow-amber-700/10',
          icon: <Medal size={16} className="text-amber-500" />,
          label: activeLang === 'mr' ? '३रे पारितोषिक' : activeLang === 'hi' ? '३रा पुरस्कार' : '3rd Prize',
          rankColor: 'text-amber-500',
        };
      case 'tournament_4th':
        return {
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          border: 'border-orange-500/50 shadow-orange-500/10',
          icon: <Award size={16} className="text-orange-400" />,
          label: activeLang === 'mr' ? '४थे पारितोषिक' : activeLang === 'hi' ? '४था पुरस्कार' : '4th Prize',
          rankColor: 'text-orange-400',
        };
      case 'man_of_series':
        return {
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          border: 'border-purple-500/50 shadow-purple-500/10',
          icon: <Crown size={16} className="text-purple-400 animate-pulse" />,
          label: activeLang === 'mr' ? 'मालिकावीर पारितोषिक' : activeLang === 'hi' ? 'मैन ऑफ द सीरीज़' : 'Man of the Series',
          rankColor: 'text-purple-400',
        };
      case 'best_batsman':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          border: 'border-emerald-500/50 shadow-emerald-500/10',
          icon: <Award size={16} className="text-emerald-400" />,
          label: activeLang === 'mr' ? 'उत्कृष्ट फलंदाज' : activeLang === 'hi' ? 'सर्वश्रेष्ठ बल्लेबाज' : 'Best Batsman',
          rankColor: 'text-emerald-400',
        };
      case 'best_bowler':
        return {
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          border: 'border-cyan-500/50 shadow-cyan-500/10',
          icon: <Medal size={16} className="text-cyan-400" />,
          label: activeLang === 'mr' ? 'उत्कृष्ट गोलंदाज' : activeLang === 'hi' ? 'सर्वश्रेष्ठ गेंदबाज' : 'Best Bowler',
          rankColor: 'text-cyan-400',
        };
      case 'custom':
      default:
        return {
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          border: 'border-indigo-500/50 shadow-indigo-500/10',
          icon: <Sparkles size={16} className="text-indigo-400" />,
          label: activeLang === 'mr' ? 'विशेष पारितोषिक' : activeLang === 'hi' ? 'विशेष पुरस्कार' : 'Custom Prize',
          rankColor: 'text-indigo-400',
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Modal Dialog Container */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        className="relative w-full max-w-5xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/35 rounded-3xl shadow-2xl overflow-hidden z-10 my-2 text-white flex flex-col max-h-[94vh]"
      >
        {/* Top Gold Foil Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Trophy size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-1.5 truncate">
                  {tournamentName ? `${tournamentName} — Prize Money Manager` : 'Tournament Prize Money Manager'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider border border-amber-400/30">
                  1st • 2nd • 3rd • 4th • Custom
                </span>
                {(tournamentName || tournamentId) && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black uppercase tracking-wider border border-emerald-500/30">
                    ⚡ Auto-Sync Scoreboard
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {tournamentName 
                  ? `Configures tournament prize money & sponsors permanently for ${tournamentName}. Auto-loads on live scoreboard.`
                  : 'Configure tournament 1st, 2nd, 3rd, 4th prize, individual awards & custom prizes with sponsor photos.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Regional / Commentary Language Selector (EN / मराठी / हिंदी) */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-white/15 rounded-xl p-1 shadow-inner">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 pl-1.5 pr-0.5">
                <Languages size={12} className="text-amber-400" />
                <span>Lang:</span>
              </span>
              <button
                type="button"
                onClick={() => handleSetLanguage('en')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                  activeLang === 'en'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="English commentary & prize banners"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguage('mr')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                  activeLang === 'mr'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="मराठी समालोचन व बक्षीस फलक"
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => handleSetLanguage('hi')}
                className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all ${
                  activeLang === 'hi'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
                title="हिंदी कमेंट्री व पुरस्कार बैनर"
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border-none"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tournament Auto-Configuration Badge & Live Info Banner */}
        {(tournamentName || tournamentId) && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-emerald-950/80 border-b border-emerald-500/30 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-[11px] text-emerald-200">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>
                <strong className="text-emerald-300 uppercase tracking-wide font-black">Scoreboard Auto-Configured:</strong> When any match of{' '}
                <strong className="text-white font-bold underline decoration-emerald-400">{tournamentName || 'this tournament'}</strong> goes LIVE, this prize money data will automatically configure into the scoreboard. You don't need to add data for every match!
              </span>
            </div>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-black uppercase tracking-wider shrink-0 border border-emerald-500/30">
              ⚡ LIVE AUTO-SYNC ON
            </span>
          </div>
        )}

        {/* Action Controls & Filter Bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              All Prizes ({prizes.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('podium')}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1 ${
                activeFilter === 'podium'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <Trophy size={11} />
              <span>1st-4th Prize (4)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('awards')}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1 ${
                activeFilter === 'awards'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <Award size={11} />
              <span>Awards (3)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('custom')}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1 ${
                activeFilter === 'custom'
                  ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <Sparkles size={11} />
              <span>Custom ({customPrizesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1 ${
                activeFilter === 'active'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <Eye size={11} />
              <span>Active on Bug ({validPrizes.length})</span>
            </button>
          </div>

          {/* Quick Custom Prize & Demo Actions */}
          <div className="flex items-center gap-2 relative">
            {/* Add Custom Prize Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetDropdown((prev) => !prev)}
                className="px-3 py-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-[10.5px] font-black uppercase tracking-wider cursor-pointer border border-indigo-400/40 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                title="Add a custom prize (e.g. Maximum Sixes, Best Fielder, etc.)"
              >
                <Plus size={13} />
                <span>Add Custom Prize</span>
                <ChevronDown size={12} className={showPresetDropdown ? 'rotate-180 transition-transform' : ''} />
              </button>

              {/* Preset Menu */}
              {showPresetDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-2xl p-2 z-50 text-left space-y-1">
                  <div className="text-[9.5px] font-black uppercase tracking-wider text-indigo-300 px-2 py-1">
                    Choose Award Template:
                  </div>

                  {CUSTOM_AWARD_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleAddCustomPrize(preset)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-indigo-600/30 flex items-center justify-between cursor-pointer border-none transition-colors"
                    >
                      <span className="truncate">{preset.title}</span>
                      <span className="text-[10px] text-amber-300 font-mono font-bold shrink-0 ml-1">₹{preset.defaultAmount}</span>
                    </button>
                  ))}

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    type="button"
                    onClick={() => handleAddCustomPrize()}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 cursor-pointer border-none transition-colors"
                  >
                    <Plus size={13} />
                    <span>Create Blank Custom Prize</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
              title="Load realistic demo names, photos and prize amounts"
            >
              <Sparkles size={11} />
              <span className="hidden sm:inline">Load Sample Prizes</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
              title="Clear all fields"
            >
              <Trash2 size={11} />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          </div>
        </div>

        {/* PROMINENT SAVE NOTIFICATION BANNER (Addresses requirement 2) */}
        <AnimatePresence>
          {saveNotification?.show && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b-2 border-emerald-500 shadow-xl overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 mt-0.5 shadow-md">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black uppercase tracking-wide text-emerald-300 flex items-center gap-1.5">
                        All prize details are saved.
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[9px] font-mono font-bold border border-emerald-500/40">
                        Saved at {saveNotification.savedAt}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-500/40">
                        {saveNotification.activeCount} Prizes Broadcasting Live
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">
                      {saveNotification.activeCount > 0
                        ? `The prize money strip above the scorebug is now updated and will continuously rotate through ${saveNotification.activeCount} active prize(s):`
                        : 'Prizes are saved, but no sponsor names or amounts were entered yet. The strip will remain hidden until details are provided.'}
                    </p>

                    {/* Summary Chips of all saved active prize details */}
                    {saveNotification.details.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1.5">
                        {saveNotification.details.map((detail) => (
                          <div
                            key={detail.id}
                            className="px-2.5 py-1 bg-slate-950/80 border border-emerald-500/40 rounded-lg text-[10.5px] font-sans flex items-center gap-1.5 shadow-sm"
                          >
                            <span className="font-extrabold text-amber-400">{detail.title}:</span>
                            <span className="font-bold text-white">{detail.personName}</span>
                            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono font-bold">
                              {detail.currency} {detail.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSaveNotification(null)}
                  className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer border-none shrink-0"
                  title="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Preview Strip with Metallic Shimmer & Smart In-Game Event Test Triggers */}
        {validPrizes.length > 0 && (
          <div className="px-4 sm:px-6 py-2.5 bg-black/70 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs overflow-hidden">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10.5px] font-black uppercase tracking-widest text-emerald-400 shrink-0 flex items-center gap-1">
                <Eye size={13} /> Live Broadcast Preview ({validPrizes.length} Active):
              </span>

              {/* In-Game Test Triggers for live events */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTestSpotlight('six')}
                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wide cursor-pointer transition-all border flex items-center gap-1 ${
                    spotlightType === 'six'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/40 animate-pulse'
                      : 'bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                  }`}
                  title="Simulate a 6 (Six) hit to trigger Maximum Sixes sponsor spotlight for 6.5 seconds"
                >
                  <Flame size={11} className={spotlightType === 'six' ? 'animate-bounce' : ''} />
                  <span>Test Six (षटकार)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestSpotlight('wicket')}
                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wide cursor-pointer transition-all border flex items-center gap-1 ${
                    spotlightType === 'wicket'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-md shadow-cyan-400/40 animate-pulse'
                      : 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/30'
                  }`}
                  title="Simulate a Wicket to trigger Best Bowler sponsor spotlight for 6.5 seconds"
                >
                  <Target size={11} className={spotlightType === 'wicket' ? 'animate-spin' : ''} />
                  <span>Test Wicket (विकेट)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestSpotlight('fifty')}
                  className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase tracking-wide cursor-pointer transition-all border flex items-center gap-1 ${
                    spotlightType === 'fifty'
                      ? 'bg-yellow-400 text-slate-950 border-yellow-200 shadow-md shadow-yellow-400/40 animate-pulse'
                      : 'bg-yellow-500/15 hover:bg-yellow-500/30 text-yellow-300 border-yellow-500/30'
                  }`}
                  title="Simulate 50/100 Milestone to trigger Batsman award spotlight for 6.5 seconds"
                >
                  <Star size={11} className={spotlightType === 'fifty' ? 'animate-pulse' : ''} />
                  <span>Test 50/100 (अर्धशतक)</span>
                </button>
              </div>
            </div>

            {/* Micro preview container mimicking the above-scorebug strip */}
            <div className={`relative flex-1 max-w-xl ${
              spotlightType
                ? 'bg-gradient-to-r from-rose-950 via-amber-950 to-rose-950 border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                : 'bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border border-amber-400/40'
            } rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 shadow-md overflow-hidden transition-all duration-300`}>
              {/* Metallic Light Sweep Sheen */}
              <motion.div
                key={`modal-sheen-${previewIndex}-${spotlightType || 'norm'}`}
                initial={{ x: '-150%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-28 -skew-x-25 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-20"
              />

              <div className="flex items-center gap-2.5 min-w-0 z-10">
                {currentPreviewPrize?.personPhoto ? (
                  <img
                    src={currentPreviewPrize.personPhoto}
                    alt={currentPreviewPrize.personName}
                    className={`w-7 h-7 rounded-full object-cover shrink-0 shadow-sm ${
                      spotlightType ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-950' : 'border-2 border-amber-400'
                    }`}
                  />
                ) : (
                  <div className={`w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-black text-xs shrink-0 ${
                    spotlightType ? 'animate-pulse ring-2 ring-amber-300' : ''
                  }`}>
                    {spotlightType === 'six' ? <Flame size={14} className="text-amber-300" /> : <Trophy size={14} />}
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-400">
                    <span>
                      {spotlightType === 'six' 
                        ? (activeLang === 'mr' ? '🔥 षटकार विशेष बक्षीस' : activeLang === 'hi' ? '🔥 छक्का विशेष पुरस्कार' : '🔥 SIX SPONSOR SPOTLIGHT')
                        : spotlightType === 'wicket'
                        ? (activeLang === 'mr' ? '🎯 बळी (विकेट) विशेष बक्षीस' : activeLang === 'hi' ? '🎯 विकेट विशेष पुरस्कार' : '🎯 WICKET SPONSOR SPOTLIGHT')
                        : spotlightType === 'fifty'
                        ? (activeLang === 'mr' ? '⭐ अर्धशतक विशेष गौरव' : activeLang === 'hi' ? '⭐ अर्धशतक विशेष पुरस्कार' : '⭐ MILESTONE SPOTLIGHT')
                        : currentPreviewPrize?.title}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-slate-300 font-normal">
                      {activeLang === 'mr' ? 'सौजन्य:' : activeLang === 'hi' ? 'प्रायोजक:' : (currentPreviewPrize?.tagline || 'Sponsored By')}
                    </span>
                  </div>
                  <strong className="text-xs font-black text-white truncate block">
                    {currentPreviewPrize?.personName || 'Sponsor Name'}
                    {currentPreviewPrize?.personDesignation && (
                      <span className="text-[10px] font-normal text-amber-200/80 ml-1">
                        ({currentPreviewPrize.personDesignation})
                      </span>
                    )}
                  </strong>
                </div>
              </div>

              <div className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-lg text-xs tracking-tight shadow-sm shrink-0 flex items-center gap-1 z-10">
                <span className="text-[9px] uppercase font-bold text-slate-900/80">
                  {activeLang === 'mr' ? 'रोख:' : activeLang === 'hi' ? 'नकद:' : 'CASH:'}
                </span>
                <span>{currentPreviewPrize?.currency || '₹'}</span>
                <span>{currentPreviewPrize?.amount || '0'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: Prize Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Tournament Sponsors & Given Prize List Section */}
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <Trophy size={14} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                    <span>Tournament Sponsors & Prize List</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] font-black border border-amber-500/30">
                      {validPrizes.length} Active
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Official list of honors, prize money allocations, and sponsor recognitions
                  </p>
                </div>
              </div>

              {validPrizes.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-black flex items-center gap-1">
                    <span className="text-slate-400 uppercase text-[8.5px]">Total Purse:</span>
                    <span>{validPrizes[0]?.currency || '₹'}</span>
                    <span>
                      {validPrizes
                        .reduce((sum, p) => sum + (Number(p.amount?.replace(/[^0-9.-]+/g, '')) || 0), 0)
                        .toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {validPrizes.length > 0 ? (
              <div className="space-y-2">
                {/* Horizontal Scrolling Sponsor & Prize Strip */}
                <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-amber-500/30 py-1 flex items-center gap-2">
                  {validPrizes.map((p, idx) => {
                    const amt = p.amount?.trim() ? `${p.currency || '₹'}${p.amount.trim()}` : '';
                    const desig = p.personDesignation?.trim() ? ` (${p.personDesignation.trim()})` : '';
                    return (
                      <div
                        key={p.id || idx}
                        className="inline-flex items-center gap-1.5 bg-slate-950/80 border border-white/10 hover:border-amber-400/40 rounded-xl px-2.5 py-1.5 text-xs shrink-0 transition-colors"
                      >
                        <span className="text-amber-400 font-black uppercase text-[9.5px]">{p.title}:</span>
                        {amt && (
                          <span className="font-mono font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 text-[10px]">
                            {amt}
                          </span>
                        )}
                        {p.personName?.trim() && (
                          <span className="text-slate-200 font-medium text-[10.5px]">
                            Given by <strong className="text-white font-bold">{p.personName.trim()}</strong>
                            <span className="text-slate-400 text-[9.5px]">{desig}</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Scannable Grid List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                  {validPrizes.map((p, idx) => {
                    const amt = p.amount?.trim() ? `${p.currency || '₹'}${p.amount.trim()}` : 'Trophy';
                    return (
                      <div
                        key={p.id || idx}
                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block truncate">
                            {p.title}
                          </span>
                          <span className="text-[11px] font-bold text-white block truncate">
                            {p.personName?.trim() ? p.personName.trim() : 'Tournament Committee'}
                          </span>
                          {p.personDesignation?.trim() && (
                            <span className="text-[9px] text-slate-400 block truncate">
                              {p.personDesignation.trim()}
                            </span>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-mono font-black text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 block">
                            {amt}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/50 border border-dashed border-amber-500/20 rounded-xl p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Trophy size={14} className="text-amber-500/60 shrink-0" />
                <span>No sponsors or prize amounts configured yet. Fill out the cards below to populate the sponsor and prize list.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrizes.map((prize, idx) => {
              const isConfigured = Boolean(prize.personName?.trim() || prize.amount?.trim());
              const theme = getCategoryTheme(prize.category);
              const isCustom = prize.category === 'custom';

              return (
                <div
                  key={prize.id}
                  className={`p-4 rounded-2xl border transition-all relative ${
                    prize.isActive && isConfigured
                      ? `bg-slate-900/95 ${theme.border}`
                      : 'bg-slate-900/40 border-slate-800/80 opacity-90'
                  }`}
                >
                  {/* Card Header with Status & Active Toggle */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center font-bold shrink-0">
                        {theme.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono font-black uppercase tracking-wider ${theme.rankColor}`}>
                            {theme.label}
                          </span>
                          {isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[8px] font-bold border border-indigo-500/30">
                              Custom
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white truncate">
                          {prize.title || 'Tournament Award'}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConfigured ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] font-black uppercase tracking-wider border border-emerald-500/40">
                          Active on Bug
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[8.5px] font-bold uppercase tracking-wider">
                          Not Added
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => updatePrizeField(prize.id, 'isActive', !prize.isActive)}
                        className={`p-1.5 rounded-lg border-none cursor-pointer transition-all ${
                          prize.isActive
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                        title={prize.isActive ? 'Prize is Enabled' : 'Prize is Disabled'}
                      >
                        {prize.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>

                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleDeletePrize(prize.id, prize.title)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/20 cursor-pointer transition-all"
                          title="Delete this custom prize"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3 text-left font-sans">
                    {/* Award Title */}
                    <div>
                      <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Award Title / Given Prize (e.g. 1st Prize / Champion)
                      </label>
                      <input
                        type="text"
                        value={prize.title}
                        onChange={(e) => updatePrizeField(prize.id, 'title', e.target.value)}
                        placeholder="e.g. Tournament 1st Prize / Champion"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Prize Sponsor Name & Designation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                          Prize Given By (Sponsor Name) *
                        </label>
                        <input
                          type="text"
                          value={prize.personName}
                          onChange={(e) => updatePrizeField(prize.id, 'personName', e.target.value)}
                          placeholder="e.g. Shri Ramesh Patil"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          His Position / Designation / Firm Name
                        </label>
                        <input
                          type="text"
                          value={prize.personDesignation || ''}
                          onChange={(e) => updatePrizeField(prize.id, 'personDesignation', e.target.value)}
                          placeholder="e.g. Sarpanch / President / Business Partner"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Prize Money Amount & Currency */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-1">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Currency
                        </label>
                        <select
                          value={prize.currency || '₹'}
                          onChange={(e) => updatePrizeField(prize.id, 'currency', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="₹">₹ (INR)</option>
                          <option value="$">$ (USD)</option>
                          <option value="AED">AED</option>
                          <option value="PKR">PKR</option>
                          <option value="£">£ (GBP)</option>
                          <option value="€">€ (EUR)</option>
                          <option value="৳">৳ (BDT)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                          Prize Money Cash Amount *
                        </label>
                        <input
                          type="text"
                          value={prize.amount}
                          onChange={(e) => updatePrizeField(prize.id, 'amount', e.target.value)}
                          placeholder="e.g. 51,000 or 31,000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-300 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Sponsor Tagline / Heading */}
                    <div>
                      <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Display Tagline / Prefix
                      </label>
                      <input
                        type="text"
                        value={prize.tagline || ''}
                        onChange={(e) => updatePrizeField(prize.id, 'tagline', e.target.value)}
                        placeholder="e.g. Cash Prize Sponsored By / Presented By"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Sponsor Photo Section */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Camera size={12} className="text-amber-400" />
                          Prize Person / Sponsor Photo
                        </label>
                        {prize.personPhoto && (
                          <button
                            type="button"
                            onClick={() => updatePrizeField(prize.id, 'personPhoto', '')}
                            className="text-[9px] text-rose-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Avatar thumbnail preview */}
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                          {prize.personPhoto ? (
                            <img
                              src={prize.personPhoto}
                              alt={prize.personName || 'Sponsor'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={20} className="text-slate-600" />
                          )}
                        </div>

                        {/* Upload Button and URL Input */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => (fileInputRefs.current[prize.id] = el)}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(prize.id, file);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[prize.id]?.click()}
                              className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-none shadow-sm flex items-center gap-1 transition-all active:scale-95"
                            >
                              <Upload size={11} />
                              <span>Upload Photo</span>
                            </button>

                            <span className="text-[10px] text-slate-500 font-medium">or paste URL:</span>
                          </div>

                          <input
                            type="text"
                            value={prize.personPhoto}
                            onChange={(e) => updatePrizeField(prize.id, 'personPhoto', e.target.value)}
                            placeholder="https://... or choose preset below"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10.5px] text-slate-300 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Quick Avatar Presets */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] text-slate-400 font-bold">Quick Presets:</span>
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => updatePrizeField(prize.id, 'personPhoto', preset.url)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[9px] font-bold border border-slate-800 cursor-pointer transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Custom Prize Card at bottom */}
          <div className="p-4 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Need More Custom Awards?
                </h4>
                <p className="text-[11px] text-slate-400">
                  Add custom prizes for Maximum Sixes, Best Fielder, Fastest Fifty, Hat-Trick, or Local Patrons.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAddCustomPrize()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer border-none shadow-md flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <Plus size={14} />
              <span>Add Custom Prize</span>
            </button>
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-4 sm:px-6 py-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>
              {validPrizes.length > 0
                ? `${validPrizes.length} of ${prizes.length} prize(s) active on live TV scorebug`
                : 'No prizes configured yet (banner will remain hidden)'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            {/* Show Grand Presentation Board on TV */}
            <button
              type="button"
              onClick={handleTriggerGrandBoard}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1.5 active:scale-95 shadow-lg ${
                isPresentationBoardLive
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-yellow-200 text-slate-950 border-amber-300 shadow-amber-500/25'
              }`}
              title="Show 3D 4-Prize Podium, Sponsors & Total Purse on Live Broadcast"
            >
              <Crown size={15} className={isPresentationBoardLive ? 'animate-bounce text-white' : 'text-slate-950'} />
              <span>
                {boardTriggerSuccess
                  ? '🏆 Sent to Broadcast!'
                  : isPresentationBoardLive
                  ? 'Hide Grand Board'
                  : '🏆 Show Grand Board on TV'}
              </span>
              {isPresentationBoardLive && (
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check size={16} className="text-slate-950 font-black" />
                  <span>All Details Saved!</span>
                </>
              ) : (
                <>
                  <Trophy size={16} className="text-slate-950" />
                  <span>Save Prize Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
