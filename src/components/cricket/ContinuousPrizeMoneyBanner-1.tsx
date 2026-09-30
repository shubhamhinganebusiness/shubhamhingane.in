import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Sparkles, 
  Coins, 
  Gift, 
  Award,
  Star,
  Flame,
  Target,
  Zap
} from 'lucide-react';
import { 
  TournamentPrize, 
  getTournamentPrizes, 
  subscribeToTournamentPrizes, 
  getValidActivePrizes,
  SAMPLE_DEMO_PRIZES
} from '../../utils/cricketPrizeStorage';
import { BroadcastLayout } from './CricketOverlay';
import { 
  useCommentaryLanguage, 
  CommentaryLanguage
} from './commentaryLanguage';

export interface ContinuousPrizeMoneyBannerProps {
  matchId?: string;
  prizes?: TournamentPrize[];
  layout?: BroadcastLayout;
  position?: 'top-full' | 'bottom-full' | string;
  className?: string;
  onOpenManageModal?: () => void;
  hasWinPredictor?: boolean;
  language?: CommentaryLanguage;
  lastBdryFlash?: '4' | '6' | null;
  wicketPopup?: any;
  activeAlert?: string | null;
  customMilestone?: any;
  boundaryCounterPopup?: any;
}

// Category Localization Dictionaries (Marathi, Hindi, English)
interface PrizeLocalizationInfo {
  title: string;
  tagline: string;
  cashLabel: string;
}

const CATEGORY_LOCALIZATIONS: Record<string, Record<CommentaryLanguage, PrizeLocalizationInfo>> = {
  tournament_1st: {
    en: { title: '1st Prize / Champion', tagline: 'Champion Trophy & Cash Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'प्रथम पारितोषिक / विजेता', tagline: 'विजेता चषक व रोख पारितोषिक सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'प्रथम पुरस्कार / विजेता', tagline: 'विजेता ट्रॉफी व नकद पुरस्कार प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  fourth_prize: {
    en: { title: '1st Prize / Champion', tagline: 'Champion Trophy & Cash Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'प्रथम पारितोषिक / विजेता', tagline: 'विजेता चषक व रोख पारितोषिक सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'प्रथम पुरस्कार / विजेता', tagline: 'विजेता ट्रॉफी व नकद पुरस्कार प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  tournament_2nd: {
    en: { title: '2nd Prize / Runner-Up', tagline: 'Runner-Up Trophy & Cash Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'द्वितीय पारितोषिक / उपविजेता', tagline: 'उपविजेता चषक व रोख सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'द्वितीय पुरस्कार / उपविजेता', tagline: 'उपविजेता ट्रॉफी व नकद प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  tournament_3rd: {
    en: { title: '3rd Prize', tagline: '3rd Prize Trophy Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'तृतीय पारितोषिक', tagline: 'तृतीय पारितोषिक चषक व रोख सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'तृतीय पुरस्कार', tagline: 'तृतीय पुरस्कार ट्रॉफी व नकद प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  tournament_4th: {
    en: { title: '4th Prize', tagline: '4th Prize Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'चतुर्थ पारितोषिक', tagline: 'चतुर्थ पारितोषिक सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'चतुर्थ पुरस्कार', tagline: 'चतुर्थ पुरस्कार प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  man_of_series: {
    en: { title: 'Man of the Series', tagline: 'Grand Cash Prize Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'मालिकावीर पारितोषिक', tagline: 'मालिकावीर गौरव पुरस्कार सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'मैन ऑफ द सीरीज़', tagline: 'सीरीज़ का सर्वश्रेष्ठ खिलाड़ी पुरस्कार प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  best_batsman: {
    en: { title: 'Best Batsman Award', tagline: 'Cash Prize Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'उत्कृष्ट फलंदाज पारितोषिक', tagline: 'उत्कृष्ट फलंदाज पुरस्कार सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'सर्वश्रेष्ठ बल्लेबाज पुरस्कार', tagline: 'सर्वश्रेष्ठ बल्लेबाज नकद प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  best_bowler: {
    en: { title: 'Best Bowler Award', tagline: 'Cash Prize Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'उत्कृष्ट गोलंदाज पारितोषिक', tagline: 'उत्कृष्ट गोलंदाज पुरस्कार सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'सर्वश्रेष्ठ गेंदबाज पुरस्कार', tagline: 'सर्वश्रेष्ठ गेंदबाज नकद प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
  custom: {
    en: { title: 'Tournament Award', tagline: 'Award Sponsored By', cashLabel: 'CASH:' },
    mr: { title: 'विशेष पारितोषिक', tagline: 'बक्षीस सौजन्य:', cashLabel: 'रोख रक्कम:' },
    hi: { title: 'विशेष पुरस्कार', tagline: 'पुरस्कार प्रायोजक:', cashLabel: 'नकद राशि:' },
  },
};

// Helper to determine localized title and tagline with smart Marathi/Hindi keyword recognition
function getLocalizedPrizeInfo(prize: TournamentPrize, lang: CommentaryLanguage): PrizeLocalizationInfo {
  const cat = prize.category || 'custom';
  const defaultLoc = CATEGORY_LOCALIZATIONS[cat]?.[lang] || CATEGORY_LOCALIZATIONS.custom[lang];

  let title = prize.title?.trim() || defaultLoc.title;
  let tagline = prize.tagline?.trim() || defaultLoc.tagline;
  const cashLabel = defaultLoc.cashLabel;

  // If language is Marathi or Hindi, smartly localize standard English title keywords
  if (lang === 'mr') {
    const lower = title.toLowerCase();
    if (lower.includes('six') || lower.includes('maximum')) {
      title = 'सर्वाधिक षटकार पारितोषिक';
    } else if (lower.includes('fifty') || lower.includes('fastest')) {
      title = 'जलद अर्धशतक पारितोषिक';
    } else if (lower.includes('fielder') || lower.includes('catch')) {
      title = 'उत्कृष्ट क्षेत्ररक्षक पारितोषिक';
    } else if (lower.includes('hat-trick') || lower.includes('hattrick')) {
      title = 'हॅटट्रिक विशेष पारितोषिक';
    } else if (lower.includes('man of the match')) {
      title = 'सामनावीर (मॅन ऑफ द मॅच)';
    } else if (lower.includes('fair play')) {
      title = 'फेअर प्ले संघ पारितोषिक';
    } else if (lower.includes('wicket-keeper') || lower.includes('keeper')) {
      title = 'उत्कृष्ट यष्टीरक्षक पारितोषिक';
    } else if (cat === 'tournament_1st' && (lower.includes('1st') || lower.includes('champion'))) {
      title = 'प्रथम पारितोषिक / विजेता';
    } else if (cat === 'tournament_2nd' && (lower.includes('2nd') || lower.includes('runner'))) {
      title = 'द्वितीय पारितोषिक / उपविजेता';
    } else if (cat === 'tournament_3rd' && lower.includes('3rd')) {
      title = 'तृतीय पारितोषिक';
    } else if (cat === 'tournament_4th' && lower.includes('4th')) {
      title = 'चतुर्थ पारितोषिक';
    } else if (cat === 'man_of_series' && lower.includes('series')) {
      title = 'मालिकावीर पारितोषिक';
    } else if (cat === 'best_batsman' && lower.includes('batsman')) {
      title = 'उत्कृष्ट फलंदाज पारितोषिक';
    } else if (cat === 'best_bowler' && lower.includes('bowler')) {
      title = 'उत्कृष्ट गोलंदाज पारितोषिक';
    }

    if (!prize.tagline || prize.tagline.toLowerCase().includes('sponsored by') || prize.tagline.toLowerCase().includes('cash prize')) {
      tagline = defaultLoc.tagline;
    }
  } else if (lang === 'hi') {
    const lower = title.toLowerCase();
    if (lower.includes('six') || lower.includes('maximum')) {
      title = 'सर्वाधिक छक्के पुरस्कार';
    } else if (lower.includes('fifty') || lower.includes('fastest')) {
      title = 'सबसे तेज अर्धशतक पुरस्कार';
    } else if (lower.includes('fielder') || lower.includes('catch')) {
      title = 'सर्वश्रेष्ठ क्षेत्ररक्षक पुरस्कार';
    } else if (lower.includes('hat-trick') || lower.includes('hattrick')) {
      title = 'हैट्रिक विशेष पुरस्कार';
    } else if (lower.includes('man of the match')) {
      title = 'मैन ऑफ द मैच पुरस्कार';
    } else if (lower.includes('fair play')) {
      title = 'फेयर प्ले टीम पुरस्कार';
    } else if (lower.includes('wicket-keeper') || lower.includes('keeper')) {
      title = 'सर्वश्रेष्ठ विकेटकीपर पुरस्कार';
    } else if (cat === 'tournament_1st' && (lower.includes('1st') || lower.includes('champion'))) {
      title = 'प्रथम पुरस्कार / विजेता';
    } else if (cat === 'tournament_2nd' && (lower.includes('2nd') || lower.includes('runner'))) {
      title = 'द्वितीय पुरस्कार / उपविजेता';
    } else if (cat === 'tournament_3rd' && lower.includes('3rd')) {
      title = 'तृतीय पुरस्कार';
    } else if (cat === 'tournament_4th' && lower.includes('4th')) {
      title = 'चतुर्थ पुरस्कार';
    } else if (cat === 'man_of_series' && lower.includes('series')) {
      title = 'मैन ऑफ द सीरीज़';
    } else if (cat === 'best_batsman' && lower.includes('batsman')) {
      title = 'सर्वश्रेष्ठ बल्लेबाज पुरस्कार';
    } else if (cat === 'best_bowler' && lower.includes('bowler')) {
      title = 'सर्वश्रेष्ठ गेंदबाज पुरस्कार';
    }

    if (!prize.tagline || prize.tagline.toLowerCase().includes('sponsored by') || prize.tagline.toLowerCase().includes('cash prize')) {
      tagline = defaultLoc.tagline;
    }
  }

  return { title, tagline, cashLabel };
}

// Spotlight Event Definition for Smart In-Game Triggers
interface ActiveSpotlight {
  type: 'six' | 'wicket' | 'fifty' | 'hundred' | 'custom';
  titleEn: string;
  titleMr: string;
  titleHi: string;
  icon: 'flame' | 'target' | 'star' | 'trophy';
  badgeGradient: string;
  targetCategoryHint?: string;
  expiresAt: number;
}

export const ContinuousPrizeMoneyBanner: React.FC<ContinuousPrizeMoneyBannerProps> = ({
  matchId,
  prizes: propPrizes,
  layout = 'slanted-pro-design',
  position = 'bottom-full',
  className = '',
  onOpenManageModal,
  hasWinPredictor,
  language: propLanguage,
  lastBdryFlash,
  wicketPopup,
  activeAlert,
  customMilestone,
  boundaryCounterPopup,
}) => {
  const [currentLang] = useCommentaryLanguage(propLanguage);
  const activeLang: CommentaryLanguage = propLanguage || currentLang || 'en';

  const [internalPrizes, setInternalPrizes] = useState<TournamentPrize[]>(() => {
    if (propPrizes && propPrizes.length > 0) return propPrizes;
    return getTournamentPrizes(matchId);
  });
  const [activePrizeIndex, setActivePrizeIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [spotlight, setSpotlight] = useState<ActiveSpotlight | null>(null);

  // Detect preview mode (e.g. #/live/cricket-overlay?preview=true or in scoreboard preview iframe)
  const isPreview = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    return url.includes('preview=true') || url.includes('mode=preview') || Boolean((window as any).__cricket_preview_mode);
  }, []);

  // Sync prop changes and subscribe to real-time events / BroadcastChannel / Firestore
  useEffect(() => {
    if (propPrizes && propPrizes.length > 0) {
      setInternalPrizes(propPrizes);
    } else {
      setInternalPrizes(getTournamentPrizes(matchId));
    }

    // Always keep real-time subscription active across tabs and iframes
    const unsub = subscribeToTournamentPrizes((updated) => {
      setInternalPrizes(updated);
    }, matchId);

    return () => unsub();
  }, [matchId]);

  useEffect(() => {
    if (propPrizes && propPrizes.length > 0) {
      setInternalPrizes(propPrizes);
    }
  }, [propPrizes]);

  // Determine active prizes:
  const activePrizes = useMemo(() => {
    if (propPrizes && propPrizes.length > 0) {
      const validProp = getValidActivePrizes(propPrizes);
      if (validProp.length > 0) return validProp;
    }
    if (internalPrizes && internalPrizes.length > 0) {
      const validInternal = getValidActivePrizes(internalPrizes);
      if (validInternal.length > 0) return validInternal;
    }
    const directStored = getTournamentPrizes(matchId);
    const validDirect = getValidActivePrizes(directStored);
    if (validDirect.length > 0) return validDirect;

    // In preview mode: show demo prizes so score manager can always see the strip in the preview page
    if (isPreview) {
      return SAMPLE_DEMO_PRIZES;
    }

    // Live mode with no details entered: will not show
    return [];
  }, [propPrizes, internalPrizes, matchId, isPreview]);

  const hasCustomPrizes = useMemo(() => {
    return (
      (propPrizes && getValidActivePrizes(propPrizes).length > 0) ||
      (internalPrizes && getValidActivePrizes(internalPrizes).length > 0) ||
      getValidActivePrizes(getTournamentPrizes(matchId)).length > 0
    );
  }, [propPrizes, internalPrizes, matchId]);

  // SMART IN-GAME EVENT TRIGGERS:
  // 1. SIX (6) hit -> Highlight Maximum Sixes or Best Batsman or 1st Prize
  useEffect(() => {
    const isSix = lastBdryFlash === '6' || boundaryCounterPopup?.type === 'six' || activeAlert === 'SIX';
    if (!isSix || activePrizes.length === 0) return;

    // Find custom six award or batsman or champion prize
    let targetIdx = activePrizes.findIndex((p) => {
      const title = (p.title || '').toLowerCase();
      return title.includes('six') || title.includes('षटकार') || title.includes('छक्के');
    });

    if (targetIdx === -1) {
      targetIdx = activePrizes.findIndex((p) => p.category === 'best_batsman');
    }
    if (targetIdx === -1) {
      targetIdx = 0; // Default to 1st prize
    }

    if (targetIdx !== -1) {
      setActivePrizeIndex(targetIdx);
      setSpotlight({
        type: 'six',
        titleEn: '🔥 MAXIMUM SIXES SPONSOR SPOTLIGHT',
        titleMr: '🔥 षटकार विशेष बक्षीस सौजन्य',
        titleHi: '🔥 छक्का विशेष पुरस्कार प्रायोजक',
        icon: 'flame',
        badgeGradient: 'from-amber-500 via-rose-500 to-amber-500',
        expiresAt: Date.now() + 6500,
      });
    }
  }, [lastBdryFlash, boundaryCounterPopup?.type, boundaryCounterPopup?.timestamp, activeAlert, activePrizes]);

  // 2. WICKET fallen -> Highlight Best Bowler or Hat-Trick or 1st Prize
  useEffect(() => {
    const isWicket = Boolean(wicketPopup?.visible) || activeAlert === 'WICKET';
    if (!isWicket || activePrizes.length === 0) return;

    let targetIdx = activePrizes.findIndex((p) => {
      const title = (p.title || '').toLowerCase();
      return title.includes('wicket') || title.includes('hat-trick') || title.includes('हॅटट्रिक');
    });

    if (targetIdx === -1) {
      targetIdx = activePrizes.findIndex((p) => p.category === 'best_bowler');
    }
    if (targetIdx === -1) {
      targetIdx = 0;
    }

    if (targetIdx !== -1) {
      setActivePrizeIndex(targetIdx);
      setSpotlight({
        type: 'wicket',
        titleEn: '🎯 WICKET SPONSOR SPOTLIGHT',
        titleMr: '🎯 बळी (विकेट) विशेष बक्षीस सौजन्य',
        titleHi: '🎯 विकेट विशेष पुरस्कार प्रायोजक',
        icon: 'target',
        badgeGradient: 'from-cyan-500 via-sky-500 to-blue-600',
        expiresAt: Date.now() + 6500,
      });
    }
  }, [wicketPopup?.visible, wicketPopup?.scoreAtFall, activeAlert, activePrizes]);

  // 3. BATTER MILESTONE (50 or 100) -> Highlight Fastest Fifty or Best Batsman
  useEffect(() => {
    if (!customMilestone || activePrizes.length === 0) return;
    const is50or100 = customMilestone.type === 'fifty' || customMilestone.type === 'hundred';
    if (!is50or100) return;

    let targetIdx = activePrizes.findIndex((p) => {
      const title = (p.title || '').toLowerCase();
      return title.includes('fifty') || title.includes('अर्धशतक') || title.includes('fastest');
    });

    if (targetIdx === -1) {
      targetIdx = activePrizes.findIndex((p) => p.category === 'best_batsman');
    }
    if (targetIdx === -1) {
      targetIdx = 0;
    }

    if (targetIdx !== -1) {
      setActivePrizeIndex(targetIdx);
      setSpotlight({
        type: customMilestone.type === 'hundred' ? 'hundred' : 'fifty',
        titleEn: customMilestone.type === 'hundred' ? '⭐ CENTURY SPONSOR SPOTLIGHT' : '⭐ FIFTY MILESTONE SPOTLIGHT',
        titleMr: customMilestone.type === 'hundred' ? '⭐ शतक विशेष गौरव सौजन्य' : '⭐ अर्धशतक विशेष गौरव सौजन्य',
        titleHi: customMilestone.type === 'hundred' ? '⭐ शतक विशेष पुरस्कार प्रायोजक' : '⭐ अर्धशतक विशेष पुरस्कार प्रायोजक',
        icon: 'star',
        badgeGradient: 'from-yellow-400 via-amber-500 to-yellow-300',
        expiresAt: Date.now() + 6500,
      });
    }
  }, [customMilestone, activePrizes]);

  // 4. Custom Window Event Listener for Manual / Obs Stinger Triggers
  useEffect(() => {
    const handleCustomSpotlight = (e: any) => {
      const detail = e.detail || {};
      if (activePrizes.length === 0) return;

      const type = detail.type || 'six';
      let targetIdx = 0;

      if (type === 'six') {
        targetIdx = activePrizes.findIndex((p) => (p.title || '').toLowerCase().includes('six') || p.category === 'best_batsman');
      } else if (type === 'wicket') {
        targetIdx = activePrizes.findIndex((p) => p.category === 'best_bowler');
      }

      if (targetIdx === -1) targetIdx = 0;
      setActivePrizeIndex(targetIdx);

      setSpotlight({
        type,
        titleEn: detail.titleEn || '🔥 SPONSOR SPOTLIGHT',
        titleMr: detail.titleMr || '🔥 विशेष प्रायोजक गौरव',
        titleHi: detail.titleHi || '🔥 विशेष प्रायोजक गौरव',
        icon: type === 'wicket' ? 'target' : type === 'six' ? 'flame' : 'trophy',
        badgeGradient: 'from-amber-500 via-yellow-400 to-amber-500',
        expiresAt: Date.now() + (detail.durationMs || 6500),
      });
    };

    window.addEventListener('gullyscore:prize_spotlight', handleCustomSpotlight);
    return () => window.removeEventListener('gullyscore:prize_spotlight', handleCustomSpotlight);
  }, [activePrizes]);

  // Clean up expired spotlight
  useEffect(() => {
    if (!spotlight) return;
    const remaining = spotlight.expiresAt - Date.now();
    if (remaining <= 0) {
      setSpotlight(null);
      return;
    }
    const timer = setTimeout(() => {
      setSpotlight(null);
    }, remaining);
    return () => clearTimeout(timer);
  }, [spotlight]);

  // Continuous auto-rotation every 4.5 seconds (paused when user hovers or when spotlight is active)
  useEffect(() => {
    if (isPaused || Boolean(spotlight) || activePrizes.length <= 1) return;
    const interval = setInterval(() => {
      setActivePrizeIndex((prev) => (prev + 1) % activePrizes.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, Boolean(spotlight), activePrizes.length]);

  // If score manager has not added details, render NOTHING
  if (activePrizes.length === 0) {
    return null;
  }

  const safeIndex = activePrizeIndex % activePrizes.length;
  const currentPrize = activePrizes[safeIndex] || activePrizes[0];
  const isSpotlightActive = Boolean(spotlight);

  // Dynamic positioning cleanly ABOVE the scorebug based on active layout and bug position
  const isTop = position === 'top-full';
  let positionClasses = '';
  const showWinBar = hasWinPredictor === true;

  if (isTop) {
    if (layout === 'star-tv-broadcast') {
      positionClasses = showWinBar
        ? 'top-[186px] sm:top-[196px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]'
        : 'top-[142px] sm:top-[152px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'slanted-pro-design') {
      positionClasses = 'top-[180px] sm:top-[190px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'ribbon-full' || layout === 'single-line') {
      positionClasses = 'top-[132px] sm:top-[140px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'score-bug-1900-200') {
      positionClasses = 'top-[calc(50%-165px)] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'minimal-pill') {
      positionClasses = 'top-[124px] sm:top-[132px] left-1/2 -translate-x-1/2 w-[980px] max-w-[95%]';
    } else if (layout === 'docked-corner') {
      positionClasses = 'top-[420px] sm:top-[430px] left-16 w-[680px] max-w-[90%]';
    } else {
      positionClasses = 'top-[144px] sm:top-[154px] left-1/2 -translate-x-1/2 w-[1200px] max-w-[95%]';
    }
  } else {
    // Scorebug is at bottom of screen
    if (layout === 'star-tv-broadcast') {
      positionClasses = showWinBar
        ? 'bottom-[186px] sm:bottom-[196px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]'
        : 'bottom-[142px] sm:bottom-[152px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'slanted-pro-design') {
      positionClasses = 'bottom-[180px] sm:bottom-[190px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'ribbon-full' || layout === 'single-line') {
      positionClasses = 'bottom-[132px] sm:bottom-[140px] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'score-bug-1900-200') {
      positionClasses = 'bottom-[calc(50%+125px)] left-1/2 -translate-x-1/2 w-[1480px] max-w-[96%]';
    } else if (layout === 'minimal-pill') {
      positionClasses = 'bottom-[124px] sm:bottom-[132px] left-1/2 -translate-x-1/2 w-[980px] max-w-[95%]';
    } else if (layout === 'docked-corner') {
      if (position === 'bottom-right') {
        positionClasses = 'bottom-[420px] sm:bottom-[430px] right-16 w-[680px] max-w-[90%]';
      } else if (position === 'bottom-center') {
        positionClasses = 'bottom-[420px] sm:bottom-[430px] left-1/2 -translate-x-1/2 w-[680px] max-w-[90%]';
      } else {
        positionClasses = 'bottom-[420px] sm:bottom-[430px] left-16 w-[680px] max-w-[90%]';
      }
    } else if (layout === 'mobile-vertical') {
      positionClasses = 'bottom-[490px] sm:bottom-[500px] left-1/2 -translate-x-1/2 w-[460px] max-w-[92vw]';
    } else {
      positionClasses = 'bottom-[144px] sm:bottom-[154px] left-1/2 -translate-x-1/2 w-[1200px] max-w-[96%]';
    }
  }

  // 1. BROADCAST METALLIC SHIMMER THEMES BY CATEGORY
  const getMetallicTheme = (cat: string, spotlightActive: boolean) => {
    if (spotlightActive) {
      return {
        name: 'Spotlight Radiant Glow',
        gradientBg: 'bg-gradient-to-r from-red-950/95 via-amber-950/95 to-red-950/95',
        borderStyle: 'border-t-2 border-b-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)] animate-pulse',
        accentGlow: 'from-amber-500/35 via-rose-500/25 to-amber-500/35',
        cashPill: 'bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-slate-950 shadow-[0_0_18px_rgba(250,204,21,0.7)]',
        avatarRing: 'ring-3 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse',
        badgeStyle: 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-slate-950 shadow-md font-black',
        progressBarColor: 'bg-gradient-to-r from-amber-400 via-rose-400 to-yellow-300',
        sheenOpacity: 'via-white/50',
      };
    }

    switch (cat) {
      case 'tournament_1st':
      case 'fourth_prize':
        return {
          name: '24K Gold Champion',
          gradientBg: 'bg-gradient-to-r from-amber-950/95 via-slate-900/98 to-amber-950/95',
          borderStyle: 'border-t-2 border-b-2 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)]',
          accentGlow: 'from-amber-500/25 via-yellow-400/20 to-amber-500/25',
          cashPill: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(250,204,21,0.5)]',
          avatarRing: 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_16px_rgba(245,158,11,0.7)]',
          badgeStyle: 'bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400 text-yellow-300 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500',
          sheenOpacity: 'via-yellow-100/40',
        };
      case 'tournament_2nd':
        return {
          name: 'Platinum & Silver Chrome',
          gradientBg: 'bg-gradient-to-r from-slate-900/95 via-zinc-900/98 to-slate-900/95',
          borderStyle: 'border-t-2 border-b-2 border-slate-300 shadow-[0_0_22px_rgba(226,232,240,0.35)]',
          accentGlow: 'from-slate-300/20 via-white/15 to-slate-300/20',
          cashPill: 'bg-gradient-to-r from-slate-200 via-white to-slate-300 text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.4)]',
          avatarRing: 'ring-2 ring-slate-200 ring-offset-2 ring-offset-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.6)]',
          badgeStyle: 'bg-gradient-to-r from-slate-300/30 to-zinc-400/20 border border-slate-300 text-slate-100 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-slate-300 via-white to-slate-300',
          sheenOpacity: 'via-white/45',
        };
      case 'tournament_3rd':
        return {
          name: 'Antique Bronze Metallic',
          gradientBg: 'bg-gradient-to-r from-stone-950/95 via-slate-900/98 to-amber-950/95',
          borderStyle: 'border-t-2 border-b-2 border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.35)]',
          accentGlow: 'from-amber-700/20 via-amber-600/15 to-amber-700/20',
          cashPill: 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white shadow-[0_0_14px_rgba(217,119,6,0.4)]',
          avatarRing: 'ring-2 ring-amber-600 ring-offset-2 ring-offset-slate-950 shadow-[0_0_14px_rgba(217,119,6,0.6)]',
          badgeStyle: 'bg-gradient-to-r from-amber-700/30 to-amber-600/20 border border-amber-500 text-amber-300 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600',
          sheenOpacity: 'via-amber-200/35',
        };
      case 'tournament_4th':
        return {
          name: 'Polished Copper & Amber',
          gradientBg: 'bg-gradient-to-r from-slate-950/95 via-slate-900/98 to-orange-950/95',
          borderStyle: 'border-t-2 border-b-2 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.35)]',
          accentGlow: 'from-orange-600/20 via-amber-500/15 to-orange-600/20',
          cashPill: 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 text-slate-950 shadow-[0_0_14px_rgba(249,115,22,0.4)]',
          avatarRing: 'ring-2 ring-orange-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_14px_rgba(249,115,22,0.6)]',
          badgeStyle: 'bg-gradient-to-r from-orange-600/30 to-amber-500/20 border border-orange-400 text-orange-200 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500',
          sheenOpacity: 'via-orange-100/35',
        };
      case 'man_of_series':
        return {
          name: 'Imperial Purple & Gold',
          gradientBg: 'bg-gradient-to-r from-purple-950/95 via-slate-950/98 to-indigo-950/95',
          borderStyle: 'border-t-2 border-b-2 border-purple-400 shadow-[0_0_24px_rgba(168,85,247,0.4)]',
          accentGlow: 'from-purple-600/25 via-fuchsia-500/15 to-purple-600/25',
          cashPill: 'bg-gradient-to-r from-purple-500 via-amber-300 to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(168,85,247,0.5)]',
          avatarRing: 'ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_16px_rgba(168,85,247,0.7)]',
          badgeStyle: 'bg-gradient-to-r from-purple-600/30 to-fuchsia-500/20 border border-purple-400 text-purple-200 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-purple-500 via-amber-300 to-purple-400',
          sheenOpacity: 'via-fuchsia-100/40',
        };
      case 'best_batsman':
        return {
          name: 'Emerald Neon Green',
          gradientBg: 'bg-gradient-to-r from-emerald-950/95 via-slate-950/98 to-teal-950/95',
          borderStyle: 'border-t-2 border-b-2 border-emerald-400 shadow-[0_0_22px_rgba(52,211,153,0.35)]',
          accentGlow: 'from-emerald-600/20 via-teal-400/15 to-emerald-600/20',
          cashPill: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-slate-950 shadow-[0_0_14px_rgba(52,211,153,0.4)]',
          avatarRing: 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_15px_rgba(52,211,153,0.6)]',
          badgeStyle: 'bg-gradient-to-r from-emerald-600/30 to-teal-500/20 border border-emerald-400 text-emerald-200 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400',
          sheenOpacity: 'via-emerald-100/35',
        };
      case 'best_bowler':
        return {
          name: 'Electric Cyan & Azure',
          gradientBg: 'bg-gradient-to-r from-sky-950/95 via-slate-950/98 to-cyan-950/95',
          borderStyle: 'border-t-2 border-b-2 border-cyan-400 shadow-[0_0_22px_rgba(34,211,238,0.35)]',
          accentGlow: 'from-cyan-600/20 via-sky-400/15 to-cyan-600/20',
          cashPill: 'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-500 text-slate-950 shadow-[0_0_14px_rgba(34,211,238,0.4)]',
          avatarRing: 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.6)]',
          badgeStyle: 'bg-gradient-to-r from-cyan-600/30 to-sky-500/20 border border-cyan-400 text-cyan-200 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400',
          sheenOpacity: 'via-cyan-100/35',
        };
      case 'custom':
      default:
        return {
          name: 'Radiant Indigo & Ruby',
          gradientBg: 'bg-gradient-to-r from-indigo-950/95 via-slate-950/98 to-rose-950/95',
          borderStyle: 'border-t-2 border-b-2 border-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.35)]',
          accentGlow: 'from-indigo-600/20 via-rose-500/15 to-indigo-600/20',
          cashPill: 'bg-gradient-to-r from-amber-400 via-rose-400 to-amber-300 text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.4)]',
          avatarRing: 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 shadow-[0_0_15px_rgba(129,140,248,0.6)]',
          badgeStyle: 'bg-gradient-to-r from-indigo-600/30 to-rose-500/20 border border-indigo-400 text-indigo-200 shadow-sm',
          progressBarColor: 'bg-gradient-to-r from-indigo-400 via-amber-300 to-rose-400',
          sheenOpacity: 'via-white/40',
        };
    }
  };

  const theme = getMetallicTheme(currentPrize.category, isSpotlightActive);
  const localized = getLocalizedPrizeInfo(currentPrize, activeLang);

  const getAwardIcon = (category: string) => {
    if (spotlight?.icon === 'flame') return <Flame size={13} className="text-amber-300 animate-bounce" />;
    if (spotlight?.icon === 'target') return <Target size={13} className="text-cyan-300 animate-pulse" />;
    if (spotlight?.icon === 'star') return <Star size={13} className="text-yellow-300 animate-spin" />;

    switch (category) {
      case 'tournament_1st':
      case 'fourth_prize':
        return <Trophy size={13} className="text-yellow-400 animate-pulse" />;
      case 'tournament_2nd':
        return <Medal size={13} className="text-slate-200" />;
      case 'tournament_3rd':
        return <Medal size={13} className="text-amber-500" />;
      case 'tournament_4th':
        return <Award size={13} className="text-orange-400" />;
      case 'best_batsman':
        return <Award size={13} className="text-emerald-300" />;
      case 'best_bowler':
        return <Medal size={13} className="text-cyan-400" />;
      case 'man_of_series':
        return <Crown size={13} className="text-yellow-300 animate-pulse" />;
      case 'custom':
      default:
        return <Sparkles size={13} className="text-amber-300" />;
    }
  };

  const getSpotlightHeadline = () => {
    if (!spotlight) return '';
    if (activeLang === 'mr') return spotlight.titleMr;
    if (activeLang === 'hi') return spotlight.titleHi;
    return spotlight.titleEn;
  };

  return (
    <div
      id="continuous-above-scorebug-prize-banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`absolute ${positionClasses} z-50 select-none font-sans transition-all duration-300 pointer-events-auto ${className}`}
    >
      <div className={`relative w-full overflow-hidden ${theme.gradientBg} ${theme.borderStyle} py-1.5 px-3 sm:px-6 shadow-2xl backdrop-blur-2xl rounded-xl flex items-center justify-between gap-2.5 transition-colors duration-500`}>
        {/* Ambient Color Metallic Glow Accent */}
        <div className={`absolute inset-0 bg-gradient-to-r ${theme.accentGlow} pointer-events-none transition-all duration-500`} />

        {/* 1. BROADCAST METALLIC SHIMMER LIGHT SWEEP BEAM */}
        <motion.div
          key={`sheen-${safeIndex}-${spotlight?.type || 'normal'}`}
          initial={{ x: '-150%', opacity: 0 }}
          animate={{ x: '250%', opacity: [0, 0.85, 0] }}
          transition={{ duration: 1.3, ease: 'easeInOut' }}
          className={`absolute inset-y-0 w-36 -skew-x-25 bg-gradient-to-r from-transparent ${theme.sheenOpacity} to-transparent pointer-events-none z-20`}
        />

        {/* 2. ROTATION TIMER PROGRESS BAR (Bottom 2.5px Line) */}
        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10 overflow-hidden z-20">
          <motion.div
            key={`progress-${safeIndex}-${isPaused || isSpotlightActive}`}
            initial={{ width: '0%' }}
            animate={{ width: isPaused || isSpotlightActive ? undefined : '100%' }}
            transition={{ duration: 4.5, ease: 'linear' }}
            className={`h-full ${theme.progressBarColor} shadow-[0_0_8px_rgba(250,204,21,0.8)]`}
          />
        </div>

        {/* 3. LEFT: Award Category Badge & Live Pulse / In-Game Event Spotlight */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSpotlightActive ? 'bg-rose-400' : 'bg-amber-400'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isSpotlightActive ? 'bg-rose-500' : 'bg-amber-500'}`} />
          </span>

          {isSpotlightActive ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [1, 1.05, 1], opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-gradient-to-r ${spotlight?.badgeGradient} text-slate-950 font-black shadow-lg text-[10px] sm:text-[11.5px] tracking-wide`}
            >
              {getAwardIcon(currentPrize.category)}
              <span>{getSpotlightHeadline()}</span>
            </motion.div>
          ) : (
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg ${theme.badgeStyle}`}>
              {getAwardIcon(currentPrize.category)}
              <span className="text-[9.5px] sm:text-[11px] font-black uppercase tracking-wider">
                {localized.title}
              </span>
            </div>
          )}

          {isPreview && !hasCustomPrizes && (
            <span className="hidden sm:inline-block text-[8px] font-mono font-black uppercase tracking-widest text-amber-300/80 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
              PREVIEW
            </span>
          )}
        </div>

        {/* 4. CENTER: Sponsor Person Photo, Name, and Localized Designation */}
        <div className="flex-1 mx-2 overflow-hidden flex items-center justify-center text-center z-10 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentPrize.id}-${safeIndex}-${activeLang}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap max-w-full"
            >
              {/* Sponsor Photo Frame with Category Halo */}
              {currentPrize.personPhoto ? (
                <img
                  src={currentPrize.personPhoto}
                  alt={currentPrize.personName || 'Sponsor'}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 ${theme.avatarRing}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center font-black text-xs shrink-0 ${theme.avatarRing}`}>
                  <Trophy size={14} className="text-amber-300" />
                </div>
              )}

              {/* Sponsor Details Text with Localized Tagline & Designation */}
              <div className="text-left flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-tight min-w-0">
                <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-slate-400 shrink-0">
                  {localized.tagline}
                </span>
                <div className="flex items-center gap-1.5 truncate">
                  <strong className="text-xs sm:text-sm font-black uppercase tracking-wide text-white drop-shadow-sm truncate">
                    {currentPrize.personName || 'Tournament Patron'}
                  </strong>
                  {currentPrize.personDesignation && (
                    <span className="hidden sm:inline-block text-[9px] sm:text-[10px] font-bold text-amber-300/90 bg-amber-500/15 px-1.5 py-0.2 rounded border border-amber-500/30 truncate">
                      {currentPrize.personDesignation}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 5. RIGHT: Cash Amount Badge */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          {/* Glowing Cash Pill */}
          <div className={`px-2.5 sm:px-3.5 py-1 ${theme.cashPill} font-black rounded-lg sm:rounded-xl text-[11px] sm:text-xs tracking-tight flex items-center gap-1 transition-all duration-500`}>
            <span className="font-extrabold text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-900/80">
              {localized.cashLabel}
            </span>
            <span className="font-mono font-black text-xs sm:text-sm">
              {currentPrize.currency || '₹'} {currentPrize.amount || '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
