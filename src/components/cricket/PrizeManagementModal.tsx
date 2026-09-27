import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Award, Trophy, Medal, Sparkles, Upload, Trash2,
  Check, Eye, EyeOff, User, Camera,
  Crown, Plus, CheckCircle2, ChevronDown, Flame,
  Target, Star, Languages, LayoutGrid, Table as TableIcon, Tv, Users
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
  title?: string;
  initialPrizes?: TournamentPrize[];
  prizes?: TournamentPrize[];
  onSave?: (prizes: TournamentPrize[]) => void;
  onSaved?: (prizes: TournamentPrize[]) => void;
  onSavePrizes?: (prizes: TournamentPrize[]) => void;
  onTriggerPresentationBoard?: () => void;
  isPresentationBoardLive?: boolean;
}

const AVATAR_PRESETS = [
  { label: 'Dignitary', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Leader', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Sponsor', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Patron', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
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

const QUICK_AMOUNT_CHIPS = ['1,00,000', '51,000', '25,000', '11,000', '5,000', '2,100'];

interface SaveNotificationData {
  show: boolean;
  savedAt: string;
  activeCount: number;
  totalCount: number;
}

export const PrizeManagementModal: React.FC<PrizeManagementModalProps> = ({
  isOpen,
  onClose,
  matchId,
  tournamentId,
  tournamentName,
  title,
  initialPrizes,
  prizes: propPrizes,
  onSave,
  onSaved,
  onSavePrizes,
  onTriggerPresentationBoard,
  isPresentationBoardLive = false,
}) => {
  const effectiveTournamentName = tournamentName || title;
  const effectiveInitialPrizes = initialPrizes || propPrizes;
  const [prizes, setPrizes] = useState<TournamentPrize[]>(STANDARD_TOURNAMENT_PRIZES);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [boardTriggerSuccess, setBoardTriggerSuccess] = useState(false);
  const [saveNotification, setSaveNotification] = useState<SaveNotificationData | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'podium' | 'awards' | 'custom' | 'active'>('all');
  const [editorMode, setEditorMode] = useState<'grid' | 'table' | 'preview'>('grid');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [openPhotoMenuId, setOpenPhotoMenuId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [activeLang, setLang] = useCommentaryLanguage();
  const [spotlightType, setSpotlightType] = useState<'six' | 'wicket' | 'fifty' | null>(null);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      if (effectiveInitialPrizes && effectiveInitialPrizes.length > 0) {
        setPrizes(effectiveInitialPrizes);
      } else if (tournamentId) {
        setPrizes(getTournamentPrizesByTournamentId(tournamentId));
      } else {
        const stored = getTournamentPrizes(matchId);
        setPrizes(stored);
      }
      setSavedSuccess(false);
      setSaveNotification(null);
      setConfirmReset(false);
    }
  }, [isOpen, matchId, tournamentId, effectiveInitialPrizes]);

  const updatePrizeField = (id: string, field: keyof TournamentPrize, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'personName') updated.sponsorName = value;
        if (field === 'personDesignation') updated.sponsorDesignation = value;
        if (field === 'personPhoto') updated.sponsorPhoto = value;
        return updated;
      })
    );
  };

  const handlePhotoUpload = (id: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updatePrizeField(id, 'personPhoto', result);
        setOpenPhotoMenuId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomPrize = (preset?: { title: string; tagline?: string; defaultAmount?: string }) => {
    const newId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPrize: TournamentPrize = {
      id: newId,
      category: 'custom',
      title: preset?.title || 'Custom Tournament Award',
      personName: '',
      personPhoto: '',
      personDesignation: '',
      winnerName: '',
      amount: preset?.defaultAmount || '5,000',
      currency: '₹',
      tagline: preset?.tagline || 'Award Sponsored By',
      isActive: true,
    };
    setPrizes((prev) => [...prev, newPrize]);
    setShowPresetDropdown(false);
    setActiveFilter('all');
  };

  const handleDeletePrize = (id: string) => {
    setPrizes((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async () => {
    if (tournamentId) {
      await saveTournamentPrizesForTournament(tournamentId, prizes);
    } else {
      await saveTournamentPrizes(prizes, matchId);
    }
    onSave?.(prizes);
    onSaved?.(prizes);
    onSavePrizes?.(prizes);
    const active = getValidActivePrizes(prizes);
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSaveNotification({
      show: true,
      savedAt: nowStr,
      activeCount: active.length,
      totalCount: prizes.length,
    });
    setSavedSuccess(true);

    setTimeout(() => {
      setSavedSuccess(false);
    }, 3500);
  };

  const handleTriggerGrandBoard = async () => {
    if (tournamentId) {
      await saveTournamentPrizesForTournament(tournamentId, prizes);
    } else {
      await saveTournamentPrizes(prizes, matchId);
    }
    onSave?.(prizes);
    onSaved?.(prizes);
    onSavePrizes?.(prizes);

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

  const handleLoadDemo = () => {
    setPrizes(SAMPLE_DEMO_PRIZES);
    setSaveNotification(null);
  };

  const handleClearAll = () => {
    setPrizes(STANDARD_TOURNAMENT_PRIZES);
    setSaveNotification(null);
    setConfirmReset(false);
  };

  const validPrizes = getValidActivePrizes(prizes);
  const totalPurseAmount = prizes
    .filter((p) => p.isActive !== false)
    .reduce((sum, p) => sum + (Number(String(p.amount || '').replace(/[^0-9.-]+/g, '')) || 0), 0);
  const configuredSponsorsCount = prizes.filter((p) => Boolean(p.personName?.trim())).length;

  useEffect(() => {
    if (validPrizes.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % validPrizes.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [validPrizes.length]);

  const currentPreviewPrize = validPrizes[previewIndex % (validPrizes.length || 1)];

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

  const getCategoryTheme = (category?: string) => {
    switch (category) {
      case 'tournament_1st':
        return {
          border: 'border-amber-500/40 hover:border-amber-400/70',
          headerBg: 'bg-amber-500/10',
          iconBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Trophy size={15} className="text-amber-400" />,
          label: activeLang === 'mr' ? '१ले पारितोषिक' : activeLang === 'hi' ? '१ला पुरस्कार' : '1st Prize · Champion',
          rankColor: 'text-amber-400',
        };
      case 'tournament_2nd':
        return {
          border: 'border-slate-400/40 hover:border-slate-300/60',
          headerBg: 'bg-slate-400/10',
          iconBg: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
          icon: <Medal size={15} className="text-slate-200" />,
          label: activeLang === 'mr' ? '२रे पारितोषिक' : activeLang === 'hi' ? '२रा पुरस्कार' : '2nd Prize · Runner-Up',
          rankColor: 'text-slate-300',
        };
      case 'tournament_3rd':
        return {
          border: 'border-orange-500/40 hover:border-orange-400/60',
          headerBg: 'bg-orange-500/10',
          iconBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          icon: <Medal size={15} className="text-orange-400" />,
          label: activeLang === 'mr' ? '३रे पारितोषिक' : activeLang === 'hi' ? '३रा पुरस्कार' : '3rd Prize · 2nd Runner-Up',
          rankColor: 'text-orange-400',
        };
      case 'tournament_4th':
      case 'fourth_prize':
        return {
          border: 'border-amber-700/40 hover:border-amber-600/60',
          headerBg: 'bg-amber-700/10',
          iconBg: 'bg-amber-700/20 text-amber-400 border-amber-700/40',
          icon: <Award size={15} className="text-amber-500" />,
          label: activeLang === 'mr' ? '४थे पारितोषिक' : activeLang === 'hi' ? '४था पुरस्कार' : '4th Prize · Semi-Finalist',
          rankColor: 'text-amber-500',
        };
      case 'man_of_series':
        return {
          border: 'border-purple-500/40 hover:border-purple-400/60',
          headerBg: 'bg-purple-500/10',
          iconBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <Crown size={15} className="text-purple-400" />,
          label: activeLang === 'mr' ? 'मालिकावीर' : activeLang === 'hi' ? 'मैन ऑफ द सीरीज़' : 'Player of the Series (MVP)',
          rankColor: 'text-purple-400',
        };
      case 'best_batsman':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-400/60',
          headerBg: 'bg-emerald-500/10',
          iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <Award size={15} className="text-emerald-400" />,
          label: activeLang === 'mr' ? 'उत्कृष्ट फलंदाज' : activeLang === 'hi' ? 'सर्वश्रेष्ठ बल्लेबाज' : 'Best Batsman · Orange Cap',
          rankColor: 'text-emerald-400',
        };
      case 'best_bowler':
        return {
          border: 'border-cyan-500/40 hover:border-cyan-400/60',
          headerBg: 'bg-cyan-500/10',
          iconBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: <Target size={15} className="text-cyan-400" />,
          label: activeLang === 'mr' ? 'उत्कृष्ट गोलंदाज' : activeLang === 'hi' ? 'सर्वश्रेष्ठ गेंदबाज' : 'Best Bowler · Purple Cap',
          rankColor: 'text-cyan-400',
        };
      default:
        return {
          border: 'border-indigo-500/40 hover:border-indigo-400/60',
          headerBg: 'bg-indigo-500/10',
          iconBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          icon: <Sparkles size={15} className="text-indigo-400" />,
          label: activeLang === 'mr' ? 'विशेष पारितोषिक' : activeLang === 'hi' ? 'विशेष पुरस्कार' : 'Special / Custom Award',
          rankColor: 'text-indigo-400',
        };
    }
  };

  const getInitials = (name?: string) => {
    if (!name || !name.trim()) return 'SP';
    const parts = name.trim().replace(/^(Shri|Smt|Dr|Adv|Mr|Mrs)\.?\s+/i, '').split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-2 sm:p-4 font-sans">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.85 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Modal Workspace Container */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-white flex flex-col h-[92vh] max-h-[92vh]"
      >
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 shrink-0" />

        {/* Zone 1: Compact Professional Top Header Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Trophy size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  {effectiveTournamentName ? `${effectiveTournamentName} — Prize Money & Sponsors` : 'Tournament Prize Money & Sponsor Manager'}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>Auto-syncs with Live Scoreboard & Podium</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-medium">Real-Time Broadcast Ready</span>
              </div>
            </div>
          </div>

          {/* Live Financial & Sponsor Summary Metrics (Tabular Numerals) */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden md:flex items-center gap-5 text-xs border-r border-slate-800 pr-5">
              <div>
                <span className="text-[10px] text-slate-400 block">Total Prize Purse</span>
                <span className="text-sm font-bold font-mono tabular-nums text-amber-400">
                  ₹{totalPurseAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Active on TV</span>
                <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                  {validPrizes.length} / {prizes.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Patrons Added</span>
                <span className="text-sm font-bold font-mono tabular-nums text-white">
                  {configuredSponsorsCount}
                </span>
              </div>
            </div>

            {/* Language Selector & Close */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                <Languages size={12} className="text-amber-400 ml-1.5 mr-1 hidden sm:inline" />
                {(['en', 'mr', 'hi'] as const).map((lng) => (
                  <button
                    key={lng}
                    type="button"
                    onClick={() => handleSetLanguage(lng)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      activeLang === lng
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lng === 'en' ? 'EN' : lng === 'mr' ? 'मराठी' : 'हिंदी'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Close Manager"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Zone 2: Single-Row Filter, View Mode & Action Toolbar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Left: Segmented Category Filters */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
            {[
              { id: 'all', label: `All Prizes (${prizes.length})` },
              { id: 'podium', label: 'Team Podium (1st–4th)' },
              { id: 'awards', label: 'Player Awards (3)' },
              { id: 'custom', label: `Custom (${customPrizesCount})` },
              { id: 'active', label: `Active on TV (${validPrizes.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveFilter(tab.id as any);
                  if (editorMode === 'preview') setEditorMode('grid');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeFilter === tab.id && editorMode !== 'preview'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Center / Right: View Switcher + Add Custom Award + Sample Data */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => setEditorMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  editorMode === 'grid'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="2-Column Card Editor"
              >
                <LayoutGrid size={13} />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  editorMode === 'table'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Fast Spreadsheet Table View"
              >
                <TableIcon size={13} />
                <span>Quick Table</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('preview')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  editorMode === 'preview'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Preview Podium & Test Live TV Scorebug"
              >
                <Tv size={13} />
                <span>TV Preview</span>
              </button>
            </div>

            {/* Add Custom Prize Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresetDropdown((prev) => !prev)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Plus size={14} />
                <span>Add Custom Award</span>
                <ChevronDown size={13} className={showPresetDropdown ? 'rotate-180 transition-transform' : ''} />
              </button>

              {showPresetDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-left space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-1">
                    Quick Award Templates
                  </div>
                  {CUSTOM_AWARD_PRESETS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleAddCustomPrize(preset)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="truncate">{preset.title}</span>
                      <span className="text-xs text-amber-400 font-mono tabular-nums font-semibold shrink-0 ml-2">
                        ₹{preset.defaultAmount}
                      </span>
                    </button>
                  ))}
                  <div className="h-px bg-slate-800 my-1" />
                  <button
                    type="button"
                    onClick={() => handleAddCustomPrize()}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Create Blank Custom Award</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 whitespace-nowrap"
              title="Populate sample tournament prizes and sponsors"
            >
              <Sparkles size={13} />
              <span className="hidden sm:inline">Sample Data</span>
            </button>

            {confirmReset ? (
              <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/40 rounded-xl px-2 py-1">
                <span className="text-[11px] text-rose-200">Reset all?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold cursor-pointer"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-1.5 py-0.5 text-slate-300 hover:text-white text-[11px] cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="p-1.5 bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-xl cursor-pointer transition-colors"
                title="Reset to default blank prizes"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Save Confirmation Banner (Compact inline bar when saved) */}
        <AnimatePresence>
          {saveNotification?.show && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 sm:px-6 py-2 bg-emerald-950/90 border-b border-emerald-500/40 flex items-center justify-between gap-3 shrink-0"
            >
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-white">Prize money & sponsors saved ({saveNotification.savedAt})</strong> ·{' '}
                  {saveNotification.activeCount} active prizes synced with Live TV Scorebug & Podium.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSaveNotification(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone 3: Main Scrollable Workspace (Large Unobstructed Height) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {editorMode === 'grid' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredPrizes.map((prize) => {
                const isConfigured = Boolean(prize.personName?.trim() || prize.amount?.trim());
                const theme = getCategoryTheme(prize.category);
                const isCustom = prize.category === 'custom';

                return (
                  <div
                    key={prize.id}
                    className={`rounded-xl border transition-colors flex flex-col justify-between ${
                      prize.isActive
                        ? `bg-slate-900/90 ${theme.border}`
                        : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    }`}
                  >
                    {/* Card Top Strip: Category Label, Editable Title & TV Switch */}
                    <div className={`px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-2 rounded-t-xl ${theme.headerBg}`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                          {theme.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[10px] font-semibold block leading-none mb-1 ${theme.rankColor}`}>
                            {theme.label}
                          </span>
                          <input
                            type="text"
                            value={prize.title}
                            onChange={(e) => updatePrizeField(prize.id, 'title', e.target.value)}
                            placeholder="Award Title (e.g. 1st Prize / Champion)"
                            className="w-full bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-amber-400 pb-0.5 truncate"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updatePrizeField(prize.id, 'isActive', !prize.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                            prize.isActive && isConfigured
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : prize.isActive
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-slate-950 text-slate-500 border border-slate-800'
                          }`}
                          title="Toggle visibility on Live TV Scorebug & Podium"
                        >
                          {prize.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{prize.isActive ? 'Live on TV' : 'Hidden'}</span>
                        </button>

                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeletePrize(prize.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 cursor-pointer transition-colors"
                            title="Delete Custom Award"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body: Clean 2-Zone Layout */}
                    <div className="p-4 space-y-3.5 text-left">
                      {/* Row 1: Cash Prize Amount + Quick Presets */}
                      <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-300">
                            Cash Prize Amount
                          </label>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-slate-500 mr-0.5">Quick:</span>
                            {QUICK_AMOUNT_CHIPS.map((chipAmt) => (
                              <button
                                key={chipAmt}
                                type="button"
                                onClick={() => updatePrizeField(prize.id, 'amount', chipAmt)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums cursor-pointer transition-colors ${
                                  prize.amount === chipAmt
                                    ? 'bg-amber-500 text-slate-950 font-bold'
                                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                ₹{chipAmt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={prize.currency || '₹'}
                            onChange={(e) => updatePrizeField(prize.id, 'currency', e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-200 outline-none focus:border-amber-500 cursor-pointer shrink-0"
                          >
                            <option value="₹">₹ INR</option>
                            <option value="$">$ USD</option>
                            <option value="AED">AED</option>
                            <option value="£">£ GBP</option>
                            <option value="€">€ EUR</option>
                          </select>

                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={prize.amount}
                              onChange={(e) => updatePrizeField(prize.id, 'amount', e.target.value)}
                              placeholder="e.g. 75,000"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono tabular-nums font-bold text-amber-400 outline-none focus:border-amber-500"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => updatePrizeField(prize.id, 'trophyIncluded', prize.trophyIncluded === false ? true : false)}
                            className={`px-2.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-colors shrink-0 flex items-center gap-1 ${
                              prize.trophyIncluded !== false
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-900 text-slate-500 border-slate-800'
                            }`}
                            title="Include Trophy with Cash Prize"
                          >
                            <Trophy size={13} />
                            <span>+ Trophy</span>
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Sponsor / Patron Avatar + Name + Designation */}
                      <div className="flex items-start gap-3">
                        {/* Clickable Sponsor Photo / Avatar */}
                        <div className="relative shrink-0">
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
                            onClick={() =>
                              setOpenPhotoMenuId(openPhotoMenuId === prize.id ? null : prize.id)
                            }
                            className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-700 hover:border-amber-400 overflow-hidden flex flex-col items-center justify-center cursor-pointer relative group transition-colors"
                            title="Upload or change sponsor photo"
                          >
                            {prize.personPhoto ? (
                              <img
                                src={prize.personPhoto}
                                alt={prize.personName || 'Sponsor'}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-amber-400">
                                {prize.personName?.trim() ? (
                                  <span className="text-xs font-bold text-amber-300">
                                    {getInitials(prize.personName)}
                                  </span>
                                ) : (
                                  <Camera size={16} />
                                )}
                                <span className="text-[9px] mt-0.5">Photo</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload size={14} className="text-amber-400" />
                            </div>
                          </button>

                          {/* Compact Photo Popover */}
                          {openPhotoMenuId === prize.id && (
                            <div className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-40 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-white">Sponsor Photo</span>
                                <button
                                  type="button"
                                  onClick={() => setOpenPhotoMenuId(null)}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[prize.id]?.click()}
                                className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Upload size={13} />
                                <span>Upload From Device</span>
                              </button>
                              <input
                                type="text"
                                value={prize.personPhoto || ''}
                                onChange={(e) => updatePrizeField(prize.id, 'personPhoto', e.target.value)}
                                placeholder="Or paste image URL..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                              />
                              <div className="flex items-center gap-1 flex-wrap pt-1">
                                {AVATAR_PRESETS.map((preset) => (
                                  <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                      updatePrizeField(prize.id, 'personPhoto', preset.url);
                                      setOpenPhotoMenuId(null);
                                    }}
                                    className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded text-[10px] border border-slate-800 cursor-pointer"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                                {prize.personPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updatePrizeField(prize.id, 'personPhoto', '');
                                      setOpenPhotoMenuId(null);
                                    }}
                                    className="px-2 py-0.5 bg-rose-950/60 text-rose-300 rounded text-[10px] cursor-pointer ml-auto"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sponsor Name & Designation Inputs */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              Sponsored By (Patron / Brand)
                            </label>
                            <input
                              type="text"
                              value={prize.personName || ''}
                              onChange={(e) => updatePrizeField(prize.id, 'personName', e.target.value)}
                              placeholder="e.g. Shri Sharad Pawar"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                              Designation / Organization
                            </label>
                            <input
                              type="text"
                              value={prize.personDesignation || ''}
                              onChange={(e) => updatePrizeField(prize.id, 'personDesignation', e.target.value)}
                              placeholder="e.g. Chief Patron & MLA"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Row 3: Award Winner / Recipient & Broadcast Tagline */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-800/60">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
                            <Users size={11} className="text-emerald-400" />
                            <span>Award Winner (Team / Player)</span>
                          </label>
                          <input
                            type="text"
                            value={prize.winnerName || ''}
                            onChange={(e) => updatePrizeField(prize.id, 'winnerName', e.target.value)}
                            placeholder="Optional: Assign winning team or player"
                            className="w-full bg-slate-950/60 border border-slate-800/90 rounded-lg px-3 py-1.5 text-xs text-emerald-300 placeholder:text-slate-600 outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                            Broadcast Ticker Tagline
                          </label>
                          <input
                            type="text"
                            value={prize.tagline || ''}
                            onChange={(e) => updatePrizeField(prize.id, 'tagline', e.target.value)}
                            placeholder="e.g. Trophy & Cash Sponsored By"
                            className="w-full bg-slate-950/60 border border-slate-800/90 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mode 2: High-Density Quick Spreadsheet Table View */}
          {editorMode === 'table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Award Title</th>
                      <th className="py-3 px-3">Cash Prize (₹)</th>
                      <th className="py-3 px-3">Sponsored By (Patron)</th>
                      <th className="py-3 px-3">Designation / Firm</th>
                      <th className="py-3 px-3">Winner (Team/Player)</th>
                      <th className="py-3 px-3 text-center">TV Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {filteredPrizes.map((prize) => {
                      const theme = getCategoryTheme(prize.category);
                      return (
                        <tr key={prize.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {theme.icon}
                              <span className={`font-semibold ${theme.rankColor}`}>{theme.label}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 min-w-[170px]">
                            <input
                              type="text"
                              value={prize.title}
                              onChange={(e) => updatePrizeField(prize.id, 'title', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[140px]">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400 font-mono">{prize.currency || '₹'}</span>
                              <input
                                type="text"
                                value={prize.amount}
                                onChange={(e) => updatePrizeField(prize.id, 'amount', e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums font-bold text-amber-400 outline-none focus:border-amber-500 text-right"
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3 min-w-[170px]">
                            <input
                              type="text"
                              value={prize.personName || ''}
                              onChange={(e) => updatePrizeField(prize.id, 'personName', e.target.value)}
                              placeholder="Sponsor Name"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[160px]">
                            <input
                              type="text"
                              value={prize.personDesignation || ''}
                              onChange={(e) => updatePrizeField(prize.id, 'personDesignation', e.target.value)}
                              placeholder="Designation"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="py-2 px-3 min-w-[150px]">
                            <input
                              type="text"
                              value={prize.winnerName || ''}
                              onChange={(e) => updatePrizeField(prize.id, 'winnerName', e.target.value)}
                              placeholder="TBD"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 outline-none focus:border-emerald-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => updatePrizeField(prize.id, 'isActive', !prize.isActive)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                prize.isActive
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-950 text-slate-500 border border-slate-800'
                              }`}
                            >
                              {prize.isActive ? 'Active' : 'Off'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 border-t border-slate-800 font-bold text-xs">
                      <td colSpan={2} className="py-3 px-3 text-slate-300">
                        Total Active Tournament Purse ({validPrizes.length} Active Prizes)
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-400 text-sm">
                        ₹{totalPurseAmount.toLocaleString('en-IN')}
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-slate-400 text-right">
                        {configuredSponsorsCount} Sponsors / Patrons Assigned
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Mode 3: Broadcast Podium & Live Scorebug Spotlight Simulator */}
          {editorMode === 'preview' && (
            <div className="space-y-6">
              {/* Live Scorebug & In-Game Event Spotlight Tester */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv size={16} className="text-emerald-400" />
                      <span>Live TV Scorebug Ticker & Event Spotlight Simulator</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Test how sponsor graphics appear on the live stream when a Six, Wicket, or Fifty is scored.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTestSpotlight('six')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1.5 ${
                        spotlightType === 'six'
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-bold'
                          : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <Flame size={13} />
                      <span>Simulate Six (षटकार)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestSpotlight('wicket')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1.5 ${
                        spotlightType === 'wicket'
                          ? 'bg-cyan-400 text-slate-950 border-cyan-200 font-bold'
                          : 'bg-slate-950 hover:bg-slate-800 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      <Target size={13} />
                      <span>Simulate Wicket (विकेट)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestSpotlight('fifty')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border flex items-center gap-1.5 ${
                        spotlightType === 'fifty'
                          ? 'bg-yellow-400 text-slate-950 border-yellow-200 font-bold'
                          : 'bg-slate-950 hover:bg-slate-800 text-yellow-300 border-yellow-500/30'
                      }`}
                    >
                      <Star size={13} />
                      <span>Simulate 50/100</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Live Broadcast Strip */}
                {validPrizes.length > 0 ? (
                  <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {currentPreviewPrize?.personPhoto ? (
                        <img
                          src={currentPreviewPrize.personPhoto}
                          alt={currentPreviewPrize.personName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(currentPreviewPrize?.personName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                          <span>
                            {spotlightType === 'six'
                              ? 'SIX SPONSOR SPOTLIGHT'
                              : spotlightType === 'wicket'
                              ? 'WICKET SPONSOR SPOTLIGHT'
                              : spotlightType === 'fifty'
                              ? 'MILESTONE SPOTLIGHT'
                              : currentPreviewPrize?.title}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400">
                            {currentPreviewPrize?.tagline || 'Sponsored By'}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white truncate mt-0.5">
                          {currentPreviewPrize?.personName || 'Tournament Committee'}
                          {currentPreviewPrize?.personDesignation && (
                            <span className="text-xs font-normal text-slate-400 ml-1.5">
                              ({currentPreviewPrize.personDesignation})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 bg-amber-500 text-slate-950 font-mono tabular-nums font-bold rounded-lg text-sm shrink-0">
                      {currentPreviewPrize?.currency || '₹'}{currentPreviewPrize?.amount || '0'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    No active prizes configured yet. Switch to Cards or Quick Table to add prize amounts and sponsors.
                  </div>
                )}
              </div>

              {/* Podium & Honors Showcase Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {validPrizes.map((p) => {
                  const theme = getCategoryTheme(p.category);
                  return (
                    <div
                      key={p.id}
                      className={`bg-slate-900 border ${theme.border} rounded-xl p-4 flex flex-col justify-between gap-3`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`text-[11px] font-semibold ${theme.rankColor}`}>
                            {theme.label}
                          </span>
                          <h5 className="text-sm font-bold text-white mt-0.5">{p.title}</h5>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-base text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {p.currency || '₹'}{p.amount || '0'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-800">
                        {p.personPhoto ? (
                          <img
                            src={p.personPhoto}
                            alt={p.personName}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {getInitials(p.personName)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">
                            {p.tagline || 'Sponsored By'}
                          </span>
                          <span className="text-xs font-semibold text-white block truncate">
                            {p.personName?.trim() || 'Tournament Committee'}
                          </span>
                          {p.personDesignation?.trim() && (
                            <span className="text-[11px] text-slate-400 block truncate">
                              {p.personDesignation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Zone 4: Compact Footer Action Bar */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              <strong className="text-white font-mono tabular-nums">{validPrizes.length}</strong> of{' '}
              <strong className="text-white font-mono tabular-nums">{prizes.length}</strong> prizes active · Total Purse:{' '}
              <strong className="text-amber-400 font-mono tabular-nums">
                ₹{totalPurseAmount.toLocaleString('en-IN')}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleTriggerGrandBoard}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border flex items-center justify-center gap-1.5 whitespace-nowrap ${
                isPresentationBoardLive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
              }`}
              title="Display Grand Prize Presentation Board on Live Broadcast Overlay"
            >
              <Crown size={14} />
              <span>
                {boardTriggerSuccess
                  ? 'Sent to Live TV!'
                  : isPresentationBoardLive
                  ? 'Hide TV Board'
                  : 'Show on Live TV'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              {savedSuccess ? (
                <>
                  <Check size={15} />
                  <span>Saved Successfully</span>
                </>
              ) : (
                <>
                  <Trophy size={15} />
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
