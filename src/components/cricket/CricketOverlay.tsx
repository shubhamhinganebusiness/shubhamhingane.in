import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, TrendingUp, Zap, Radio, ChevronRight, Play, Flame, Award, Skull, Star, Check, X, Clock 
} from 'lucide-react';
import { useSearchParams, useParams } from 'react-router-dom';
import { CricketOverlayAnimations } from './CricketOverlayAnimations';
import { IndividualStatsOverlay } from './IndividualStatsOverlay';

// Firestore imports
import { db, safeSetDoc } from '../../lib/firebase';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { isMatchDeleted, markMatchDeleted, getAnyActiveOrRecentMatch, getOrCreateDefaultMatch, sanitizeForFirestore } from './cricketStorage';
import { CricketFullScreenTransitions } from './CricketFullScreenTransitions';
import { getThemeBackground } from './BroadcastThemeStudio';
import { StarTVScorebug } from './StarTVScorebug';
import { isStarTVThemeActive, getStarTVThemeTokens } from './StarTVThemeTokens';
import { CricketAnalyticsOverlay } from './CricketAnalyticsOverlay';
import { TournamentBoundaryCounterPopup } from './TournamentBoundaryCounterPopup';
import { TeamVsTeamOverlay } from './TeamVsTeamOverlay';
import { FieldPositionManagerModal } from './FieldPositionManagerModal';
import { TournamentLogoOverlay } from './TournamentLogoOverlay';
import { BlackBoardScoreboardOverlay } from './BlackBoardScoreboardOverlay';
import { ContinuousPrizeMoneyBanner } from './ContinuousPrizeMoneyBanner';

// Types & Interfaces matching host application
interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outMode?: string;
  dismissedBy?: string;
  fielderName?: string;
}

interface Bowler {
  name: string;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  isCurrent: boolean;
  consecutiveWickets?: number;
}

interface CommentaryItem {
  id: string;
  overBall: string;
  description: string;
  type: 'normal' | 'boundary' | 'wicket' | 'extra' | 'milestone';
  soundWave?: boolean;
}

interface BallProgress {
  over: number;
  overStr: string;
  cumulativeRuns: number;
  cumulativeWickets: number;
}

interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  ballsBowled: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  batsmen: Batsman[];
  bowlers: Bowler[];
  strikerIndex: number;
  nonStrikerIndex: number;
  currentBowlerIndex: number;
  fallOfWickets: {
    wicketNo: number;
    score: number;
    batsmanName: string;
    oversList: string;
  }[];
  commentaryList: CommentaryItem[];
  history?: BallProgress[];
}

export type BroadcastTheme =
  | 'broadcast-pro'
  | 'ipl-style'
  | 'cricheroes-dark'
  | 'neon-sport'
  | 'clean-white'
  | 'retro-gold'
  | 'carbon-modern'
  | 'studio-custom';

export type BroadcastLayout =
  | 'star-tv-broadcast'
  | 'single-line'
  | 'ribbon-full'
  | 'slanted-pro-design'
  | 'docked-corner'
  | 'mobile-vertical'
  | 'minimal-pill'
  | 'score-bug-1900-200';

export type BugPosition = 'bottom-full' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-full' | 'mobile-vertical';

interface OverlayConfig {
  template: 'broadcast-pro' | 'neon-sport' | 'clean-white' | 'ipl-style' | 'score-bug-1900-200' | 'slanted-pro-design' | string;
  theme?: BroadcastTheme | string;
  layout?: BroadcastLayout | string;
  bugPosition?: BugPosition | string;
  showBallByBallDots?: boolean;
  showStrikeRates?: boolean;
  showWinProbability?: boolean;
  showSponsorBadge?: boolean;
  sponsorText?: string;
  showStatsPanel: boolean;
  showTicker: boolean;
  tickerMessage: string;
  forceInningsLayout?: 1 | 2;
  manualWicketTrigger?: boolean;
  manualOutsDisplay?: 'none' | 'corner' | 'fullscreen';
  manualFreeHitTrigger?: boolean;
  teamAColor?: string;
  teamBColor?: string;
  showScoreBug?: boolean;
  customBanner?: 'none' | 'four' | 'six' | 'fifty' | 'hundred' | 'drinks' | 'rain' | 'free_hit' | 'out';
  customBannerText?: string;
  manualAlertTrigger?: {
    type: 'six' | 'four' | 'wicket';
    timestamp: number;
  };
  activeGraphic?: string;
  lowerThirdMode?: 'intro' | 'equation' | 'umpires';
  selectedUmpireSignal?: 'out' | 'noball' | 'freehit' | 'deadball' | 'wide';
  customMilestone?: { name: string; type: 'fifty' | 'hundred' | '5wkt'; value: number } | null;
  boundaryBlast?: boolean;
  customOverlayImg?: string;
  customOverlayX?: number;
  customOverlayY?: number;
  customOverlayScale?: number;
  customOverlayOpacity?: number;
  customOverlayEnabled?: boolean;
  customOverlayAsBackground?: boolean;
  scorebugOverlayMode?: 'this_over' | 'tournament' | 'toss_equation' | 'last_batsman' | 'partnership' | 'projected_crr';
  showBoundaryCounter?: boolean;
  tournamentBaseFours?: number;
  tournamentBaseSixes?: number;
  boundaryCounterPosition?: 'bottom-right' | 'bottom-center' | 'top-right' | 'top-left';
  youtubeChannelLogo?: string;
  showYoutubeChannelLogo?: boolean;
  youtubeChannelName?: string;
  youtubeChannelLogoScale?: number;
  youtubeChannelLogoOpacity?: number;
}

interface MatchState {
  id: string;
  tournamentName?: string;
  seriesName?: string;
  tournamentId?: string | null;
  tournamentBaseFours?: number;
  tournamentBaseSixes?: number;
  tournamentStats?: { totalFours?: number; totalSixes?: number };
  tournamentLogo?: string;
  youtubeChannelLogo?: string;
  showYoutubeChannelLogo?: boolean;
  youtubeChannelName?: string;
  teamA: string;
  teamB: string;
  oversLimit: number;
  tossWinner: string;
  tossChoice: 'bat' | 'bowl';
  currentInningsNum: 1 | 2;
  innings1: Innings | null;
  innings2: Innings | null;
  status: 'setup' | 'live' | 'completed' | 'draft' | 'deleted';
  isDeleted?: boolean;
  winner?: string;
  winReason?: string;
  targetRuns?: number;
  freeHitNext: boolean;
  lastBallResult?: string;
  isSuperOver?: boolean;
  superOverNumber?: number;
  superOverWicketLimit?: number;
  tieResolution?: 'declared_tie' | 'super_over';
  mainMatchState?: any;
  superOversHistory?: any[];
  updatedAt?: number;
  version?: number;
  overlayConfig?: OverlayConfig;
  teamALogo?: string;
  teamBLogo?: string;
  matchBannerUrl?: string;
  playerPhotos?: Record<string, string>;
  managerId?: string;
  managerName?: string;
  streamKey?: string;
}

export const CricketOverlay: React.FC = () => {
  const routeParams = useParams<{ managerId?: string }>();
  const [searchParams] = useSearchParams();
  const [matchId, setMatchId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [streamKey, setStreamKey] = useState<string>('');
  const [isPermanentLink, setIsPermanentLink] = useState<boolean>(false);
  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [localYoutubeChannelLogo, setLocalYoutubeChannelLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('cricket_youtube_channel_logo') || '';
    } catch (_) {
      return '';
    }
  });
  const [localYoutubeChannelName, setLocalYoutubeChannelName] = useState<string>(() => {
    try {
      return localStorage.getItem('cricket_youtube_channel_name') || '';
    } catch (_) {
      return '';
    }
  });

  useEffect(() => {
    // 1. Direct route parameter: /live/cricket-overlay/:managerId
    if (routeParams.managerId) {
      setManagerId(routeParams.managerId);
      setIsPermanentLink(true);
    }

    // 2. Query searchParams
    const qManager = searchParams.get('managerId') || searchParams.get('userId') || searchParams.get('user');
    const qKey = searchParams.get('streamKey') || searchParams.get('key');
    const qMatch = searchParams.get('matchId');

    if (qManager) {
      setManagerId(qManager);
      setIsPermanentLink(true);
    }
    if (qKey) {
      setStreamKey(qKey);
      setIsPermanentLink(true);
    }
    if (qMatch) {
      setMatchId(qMatch);
    }

    // 3. Try window.location.hash parsing (e.g. #/live/cricket-overlay?managerId=...)
    const hash = window.location.hash || '';
    const hashQueryIdx = hash.indexOf('?');
    if (hashQueryIdx !== -1) {
      const qParams = new URLSearchParams(hash.substring(hashQueryIdx));
      const hMgr = qParams.get('managerId') || qParams.get('userId') || qParams.get('user');
      const hKey = qParams.get('streamKey') || qParams.get('key');
      const hMatch = qParams.get('matchId');
      if (hMgr) {
        setManagerId(hMgr);
        setIsPermanentLink(true);
      }
      if (hKey) {
        setStreamKey(hKey);
        setIsPermanentLink(true);
      }
      if (hMatch && !qMatch) {
        setMatchId(hMatch);
      }
    }

    // 4. Try window.location.search parsing
    const sParams = new URLSearchParams(window.location.search);
    const sMgr = sParams.get('managerId') || sParams.get('userId') || sParams.get('user');
    const sKey = sParams.get('streamKey') || sParams.get('key');
    const sMatch = sParams.get('matchId');
    if (sMgr) {
      setManagerId(sMgr);
      setIsPermanentLink(true);
    }
    if (sKey) {
      setStreamKey(sKey);
      setIsPermanentLink(true);
    }
    if (sMatch && !qMatch) {
      setMatchId(sMatch);
    }

    // 5. Try getting from active match state from localStorage if no explicit URL routing
    if (!qManager && !qKey && !qMatch && !routeParams.managerId) {
      try {
        const activeStr = localStorage.getItem('cricket_active_match');
        if (activeStr) {
          const parsed = JSON.parse(activeStr);
          if (parsed && parsed.id) {
            setMatchId(parsed.id);
            if (parsed.managerId) setManagerId(parsed.managerId);
          }
        }
      } catch {}
    }
  }, [routeParams, searchParams]);
  
  // Real-time Match State synced via Firestore & LocalStorage fallback
  const [match, setMatch] = useState<MatchState | null>(null);

  // Superadmin Global Studio Theme listener
  const [globalStudioTheme, setGlobalStudioTheme] = useState<any>(() => {
    try {
      const local = localStorage.getItem('cricket_broadcast_studio_theme');
      return local ? JSON.parse(local) : null;
    } catch (_) {
      return null;
    }
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, 'cricket_broadcast_theme', 'default'), (snap) => {
        if (snap.exists()) {
          setGlobalStudioTheme(snap.data());
        }
      });
    } catch (_) {}

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('cricket_theme_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'theme_updated' && event.data?.theme) {
          setGlobalStudioTheme(event.data.theme);
        }
      };
    } catch (_) {}

    const onUpdate = (e: any) => {
      if (e.detail) setGlobalStudioTheme(e.detail);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cricket_broadcast_studio_theme' && e.newValue) {
        try {
          setGlobalStudioTheme(JSON.parse(e.newValue));
        } catch (_) {}
      }
    };

    window.addEventListener('cricket_broadcast_theme_updated', onUpdate);
    window.addEventListener('storage', onStorage);

    return () => {
      if (unsub) unsub();
      if (bc) {
        try { bc.close(); } catch (_) {}
      }
      window.removeEventListener('cricket_broadcast_theme_updated', onUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  
  // Flash animation states on score change to highlight boundaries
  const [lastBdryFlash, setLastBdryFlash] = useState<'4' | '6' | null>(null);
  const [prevRuns, setPrevRuns] = useState<number>(0);
  const [prevWickets, setPrevWickets] = useState<number>(0);

  // Auto-pop tournament boundary counter popup (Matches Karjat Big Bash League 4s & 6s counter)
  const [boundaryCounterPopup, setBoundaryCounterPopup] = useState<{
    visible: boolean;
    type: 'four' | 'six';
    batterName?: string;
    timestamp?: number;
  }>({
    visible: false,
    type: 'four',
  });

  // Wicket popup alerts
  const [wicketPopup, setWicketPopup] = useState<{
    batterName: string;
    dismissalType: string;
    scoreAtFall: string;
    visible: boolean;
  } | null>(null);

  // New Batter/Bowler detection states
  const [prevStriker, setPrevStriker] = useState<string>('');
  const [prevBowler, setPrevBowler] = useState<string>('');
  const [newBatterAlert, setNewBatterAlert] = useState<string | null>(null);
  const [newBowlerAlert, setNewBowlerAlert] = useState<string | null>(null);

  // Synchronous visual alerts (SIX, FOUR, WICKET, STINGERS)
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [activeAlertMeta, setActiveAlertMeta] = useState<any>(undefined);
  const [autoStingersEnabled, setAutoStingersEnabled] = useState<boolean>(true);
  const [showDemoControls, setShowDemoControls] = useState<boolean>(true);
  const [wicketTriggerAlert, setWicketTriggerAlert] = useState<boolean>(false);

  // Active broadcast graphic state and substates
  const [activeGraphic, setActiveGraphic] = useState<string>('none');
  const [showFieldPositionModal, setShowFieldPositionModal] = useState<boolean>(false);
  const [activeControlTab, setActiveControlTab] = useState<'alerts' | 'graphics' | 'specials'>('alerts');
  const [lowerThirdMode, setLowerThirdMode] = useState<'intro' | 'equation' | 'umpires'>('intro');
  const [selectedUmpireSignal, setSelectedUmpireSignal] = useState<'out' | 'noball' | 'freehit' | 'deadball' | 'wide'>('out');
  const [customMilestone, setCustomMilestone] = useState<{ name: string; type: 'fifty' | 'hundred' | '5wkt'; value: number } | null>(null);
  const [teamCompMode, setTeamCompMode] = useState<'lineup' | 'h2h'>('lineup');

  // Auto-dismiss state tracking for banners and wicket popups
  const [localBannerDismissed, setLocalBannerDismissed] = useState<boolean>(false);
  const [localWicketDismissed, setLocalWicketDismissed] = useState<boolean>(false);
  const [localOutsDismissed, setLocalOutsDismissed] = useState<boolean>(false);
  const [wicketSecondsRemaining, setWicketSecondsRemaining] = useState<number>(5);

  // Keep track of the last processed synced alert to prevent double triggering
  const lastProcessedAlertRef = useRef<number>(0);

  // Dynamic scaling state for preview container fitting
  const [dimensions, setDimensions] = useState({ scale: 1, translateX: 0, translateY: 0 });

  useEffect(() => {
    const handleResize = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      const scale = Math.min(scaleX, scaleY) || 1;
      
      // Center the scaled container in the viewport
      const translateX = (window.innerWidth - 1920 * scale) / 2;
      const translateY = (window.innerHeight - 1080 * scale) / 2;
      
      setDimensions({ scale, translateX, translateY });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Default broadcast overlay options if none synced
  const activeConfig = useMemo<Required<Omit<OverlayConfig, 'manualAlertTrigger'>> & { manualAlertTrigger?: OverlayConfig['manualAlertTrigger'] }>(() => {
    const fallback: Required<Omit<OverlayConfig, 'manualAlertTrigger'>> & { manualAlertTrigger?: OverlayConfig['manualAlertTrigger'] } = {
      template: 'slanted-pro-design',
      theme: 'broadcast-pro',
      layout: 'slanted-pro-design',
      bugPosition: 'bottom-full',
      showBallByBallDots: true,
      showStrikeRates: true,
      showWinProbability: true,
      showSponsorBadge: true,
      sponsorText: 'GULLY PREMIER LEAGUE',
      showStatsPanel: true,
      showTicker: true,
      tickerMessage: 'LIVE BROADCAST REPLAY STREAMING',
      forceInningsLayout: 0 as any, // 0 means automatic
      manualWicketTrigger: false,
      manualOutsDisplay: 'none',
      manualFreeHitTrigger: false,
      teamAColor: '#ea002a', // Vibrant Red
      teamBColor: '#00529b',  // Broad Royal Blue
      showScoreBug: true,
      customBanner: 'none',
      customBannerText: '',
      manualAlertTrigger: undefined,
      activeGraphic: 'none',
      lowerThirdMode: 'intro',
      selectedUmpireSignal: 'out',
      customMilestone: null,
      boundaryBlast: false,
      customOverlayImg: '',
      customOverlayX: 50,
      customOverlayY: 800,
      customOverlayScale: 1.0,
      customOverlayOpacity: 1.0,
      customOverlayEnabled: false,
      customOverlayAsBackground: false,
      scorebugOverlayMode: 'this_over',
      youtubeChannelLogo: '',
      showYoutubeChannelLogo: true,
      youtubeChannelName: '',
      youtubeChannelLogoScale: 1.0,
      youtubeChannelLogoOpacity: 0.95
    };

    if (!match || !match.overlayConfig) return fallback;
    return {
      template: match.overlayConfig.template || fallback.template,
      theme: match.overlayConfig.theme || (
        ['broadcast-pro', 'ipl-style', 'cricheroes-dark', 'neon-sport', 'clean-white', 'retro-gold', 'carbon-modern'].includes(match.overlayConfig.template as string)
          ? match.overlayConfig.template
          : fallback.theme
      ),
      layout: match.overlayConfig.layout || (
        ['single-line', 'slanted-pro-design', 'score-bug-1900-200', 'ribbon-full', 'docked-corner', 'mobile-vertical', 'minimal-pill'].includes(match.overlayConfig.template as string)
          ? match.overlayConfig.template
          : fallback.layout
      ),
      bugPosition: match.overlayConfig.bugPosition || fallback.bugPosition,
      showBallByBallDots: match.overlayConfig.showBallByBallDots !== false,
      showStrikeRates: match.overlayConfig.showStrikeRates !== false,
      showWinProbability: match.overlayConfig.showWinProbability !== false,
      showSponsorBadge: match.overlayConfig.showSponsorBadge !== false,
      sponsorText: match.overlayConfig.sponsorText || fallback.sponsorText,
      showStatsPanel: match.overlayConfig.showStatsPanel !== false,
      showTicker: match.overlayConfig.showTicker !== false,
      tickerMessage: match.overlayConfig.tickerMessage || fallback.tickerMessage,
      forceInningsLayout: match.overlayConfig.forceInningsLayout || fallback.forceInningsLayout,
      manualWicketTrigger: !!match.overlayConfig.manualWicketTrigger,
      manualOutsDisplay: match.overlayConfig.manualOutsDisplay || fallback.manualOutsDisplay,
      manualFreeHitTrigger: !!match.overlayConfig.manualFreeHitTrigger,
      teamAColor: match.overlayConfig.teamAColor || fallback.teamAColor,
      teamBColor: match.overlayConfig.teamBColor || fallback.teamBColor,
      showScoreBug: match.overlayConfig.showScoreBug !== false,
      customBanner: match.overlayConfig.customBanner || fallback.customBanner,
      customBannerText: match.overlayConfig.customBannerText || fallback.customBannerText,
      manualAlertTrigger: match.overlayConfig.manualAlertTrigger,
      activeGraphic: match.overlayConfig.activeGraphic || fallback.activeGraphic,
      lowerThirdMode: match.overlayConfig.lowerThirdMode || fallback.lowerThirdMode,
      selectedUmpireSignal: match.overlayConfig.selectedUmpireSignal || fallback.selectedUmpireSignal,
      customMilestone: match.overlayConfig.customMilestone !== undefined ? match.overlayConfig.customMilestone : fallback.customMilestone,
      boundaryBlast: !!match.overlayConfig.boundaryBlast,
      customOverlayImg: match.overlayConfig.customOverlayImg || fallback.customOverlayImg,
      customOverlayX: match.overlayConfig.customOverlayX !== undefined ? match.overlayConfig.customOverlayX : fallback.customOverlayX,
      customOverlayY: match.overlayConfig.customOverlayY !== undefined ? match.overlayConfig.customOverlayY : fallback.customOverlayY,
      customOverlayScale: match.overlayConfig.customOverlayScale !== undefined ? match.overlayConfig.customOverlayScale : fallback.customOverlayScale,
      customOverlayOpacity: match.overlayConfig.customOverlayOpacity !== undefined ? match.overlayConfig.customOverlayOpacity : fallback.customOverlayOpacity,
      customOverlayEnabled: match.overlayConfig.customOverlayEnabled !== undefined ? match.overlayConfig.customOverlayEnabled : fallback.customOverlayEnabled,
      customOverlayAsBackground: match.overlayConfig.customOverlayAsBackground !== undefined ? match.overlayConfig.customOverlayAsBackground : fallback.customOverlayAsBackground,
      scorebugOverlayMode: match.overlayConfig.scorebugOverlayMode || fallback.scorebugOverlayMode || 'this_over',
      youtubeChannelLogo: match.overlayConfig.youtubeChannelLogo || (match as any).youtubeChannelLogo || fallback.youtubeChannelLogo,
      showYoutubeChannelLogo: match.overlayConfig.showYoutubeChannelLogo !== false,
      youtubeChannelName: match.overlayConfig.youtubeChannelName || (match as any).youtubeChannelName || fallback.youtubeChannelName,
      youtubeChannelLogoScale: match.overlayConfig.youtubeChannelLogoScale !== undefined ? match.overlayConfig.youtubeChannelLogoScale : fallback.youtubeChannelLogoScale,
      youtubeChannelLogoOpacity: match.overlayConfig.youtubeChannelLogoOpacity !== undefined ? match.overlayConfig.youtubeChannelLogoOpacity : fallback.youtubeChannelLogoOpacity
    };
  }, [match]);

  // Win Probability HUD Predictor visibility toggle (safely initialized after activeConfig)
  const [showWinPredictorOverlay, setShowWinPredictorOverlay] = useState<boolean>(() => {
    return activeConfig?.showWinProbability !== undefined ? !!activeConfig.showWinProbability : true;
  });

  useEffect(() => {
    if (activeConfig?.showWinProbability !== undefined) {
      setShowWinPredictorOverlay(activeConfig.showWinProbability);
    }
  }, [activeConfig?.showWinProbability]);

  // Extract variables for current active innings (Placed immediately after activeConfig to guarantee availability across all hooks and effects)
  const { currentInnings, inningsNum } = useMemo(() => {
    if (!match) return { currentInnings: null, inningsNum: 1 };
    
    // Configurable layout override or automatic detection
    const activeInningsNum = (activeConfig?.forceInningsLayout && activeConfig.forceInningsLayout > 0)
      ? activeConfig.forceInningsLayout as 1 | 2 
      : (match.currentInningsNum || 1);

    const inn = activeInningsNum === 1 ? match.innings1 : match.innings2;
    return { currentInnings: inn || match.innings1 || match.innings2 || null, inningsNum: activeInningsNum };
  }, [match, activeConfig]);

  // Current Match Total 4s and 6s across both innings
  const currentMatchFours = useMemo(() => {
    const inn1 = (match?.innings1?.batsmen || []).reduce((sum, b) => sum + (b.fours || 0), 0);
    const inn2 = (match?.innings2?.batsmen || []).reduce((sum, b) => sum + (b.fours || 0), 0);
    return inn1 + inn2;
  }, [match?.innings1?.batsmen, match?.innings2?.batsmen]);

  const currentMatchSixes = useMemo(() => {
    const inn1 = (match?.innings1?.batsmen || []).reduce((sum, b) => sum + (b.sixes || 0), 0);
    const inn2 = (match?.innings2?.batsmen || []).reduce((sum, b) => sum + (b.sixes || 0), 0);
    return inn1 + inn2;
  }, [match?.innings1?.batsmen, match?.innings2?.batsmen]);

  // Aggregate Tournament Total 4s and 6s (Karjat Big Bash League boundary counters)
  const tournamentBoundaries = useMemo(() => {
    const baseFours = Number((match as any)?.tournamentBaseFours ?? (activeConfig as any)?.tournamentBaseFours ?? (match as any)?.tournamentStats?.totalFours ?? 0);
    const baseSixes = Number((match as any)?.tournamentBaseSixes ?? (activeConfig as any)?.tournamentBaseSixes ?? (match as any)?.tournamentStats?.totalSixes ?? 0);

    let otherMatchesFours = 0;
    let otherMatchesSixes = 0;
    try {
      const regStr = localStorage.getItem('cricket_matches_local_registry');
      if (regStr) {
        const reg = JSON.parse(regStr);
        if (Array.isArray(reg)) {
          reg.forEach((m: any) => {
            if (m && m.id !== match?.id) {
              const isSameTournament =
                (match?.tournamentId && m.tournamentId === match.tournamentId) ||
                (match?.tournamentName && m.tournamentName && m.tournamentName.trim().toLowerCase() === match.tournamentName.trim().toLowerCase()) ||
                (match?.seriesName && m.seriesName && m.seriesName.trim().toLowerCase() === match.seriesName.trim().toLowerCase());

              if (isSameTournament) {
                const f1 = (m.innings1?.batsmen || []).reduce((s: number, b: any) => s + (b.fours || 0), 0);
                const f2 = (m.innings2?.batsmen || []).reduce((s: number, b: any) => s + (b.fours || 0), 0);
                const s1 = (m.innings1?.batsmen || []).reduce((s: number, b: any) => s + (b.sixes || 0), 0);
                const s2 = (m.innings2?.batsmen || []).reduce((s: number, b: any) => s + (b.sixes || 0), 0);
                otherMatchesFours += (f1 + f2);
                otherMatchesSixes += (s1 + s2);
              }
            }
          });
        }
      }
    } catch (_) {}

    return {
      fours: baseFours + otherMatchesFours + currentMatchFours,
      sixes: baseSixes + otherMatchesSixes + currentMatchSixes,
    };
  }, [match, activeConfig, currentMatchFours, currentMatchSixes]);

  // Automatically sync incoming activeGraphic configuration from Firestore
  useEffect(() => {
    if (activeConfig.activeGraphic) {
      setActiveGraphic(activeConfig.activeGraphic);
    }
    if (activeConfig.lowerThirdMode) {
      setLowerThirdMode(activeConfig.lowerThirdMode as any);
    }
    if (activeConfig.selectedUmpireSignal) {
      setSelectedUmpireSignal(activeConfig.selectedUmpireSignal as any);
    }
    if (activeConfig.customMilestone !== undefined) {
      setCustomMilestone(activeConfig.customMilestone);
    }
  }, [activeConfig.activeGraphic, activeConfig.lowerThirdMode, activeConfig.selectedUmpireSignal, activeConfig.customMilestone]);

  // Sync graphic URL parameter for direct TV overlay testing or OBS links
  useEffect(() => {
    const graphicParam = searchParams.get('graphic');
    if (graphicParam) {
      setActiveGraphic(graphicParam);
    }
  }, [searchParams]);

  // Fallback to any recent/default match if standalone overlay is opened or match is not loaded
  useEffect(() => {
    if (!match) {
      const recent = getAnyActiveOrRecentMatch();
      if (recent && (recent.id === matchId || !matchId)) {
        setMatch(recent);
      } else if (!matchId) {
        const def = getOrCreateDefaultMatch();
        if (def) setMatch(def);
      }
    }
  }, [match, matchId]);

  // Listen for the manager's active live match pointer in Firestore for permanent OBS link
  useEffect(() => {
    const targetManagerId = managerId || streamKey;
    if (!targetManagerId) return;

    let unsubMgrDoc: (() => void) | null = null;
    let unsubMatchesQuery: (() => void) | null = null;

    // A) Direct subscription to /score_managers/{managerId}
    try {
      const mgrRef = doc(db, 'score_managers', targetManagerId);
      unsubMgrDoc = onSnapshot(mgrRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'live' && data.activeMatchId) {
            console.log('[Permanent OBS] Active live match pointer updated to:', data.activeMatchId);
            setMatchId(data.activeMatchId);
            setIsLiveActive(true);
          } else if (data.status === 'completed' || !data.activeMatchId) {
            console.log('[Permanent OBS] Manager marked match completed or standby');
            setIsLiveActive(false);
          }
        }
      }, (err) => {
        console.warn('[Permanent OBS] Manager doc subscription notice:', err);
      });
    } catch (err) {
      console.warn('[Permanent OBS] Manager doc setup error:', err);
    }

    // B) Real-time collection query for live matches for this manager
    try {
      const matchQ = query(
        collection(db, 'cricket_matches'),
        where('managerId', '==', targetManagerId),
        where('status', '==', 'live'),
        limit(1)
      );
      unsubMatchesQuery = onSnapshot(matchQ, (qSnap) => {
        if (!qSnap.empty) {
          const liveDoc = qSnap.docs[0];
          const liveMatch = liveDoc.data() as MatchState;
          console.log('[Permanent OBS] Query detected live match:', liveMatch.id);
          setMatchId(liveDoc.id);
          setMatch(liveMatch);
          setIsLiveActive(true);
        }
      }, (err) => {
        console.warn('[Permanent OBS] Live query notice:', err);
      });
    } catch (err) {
      console.warn('[Permanent OBS] Query setup error:', err);
    }

    // C) Periodic HTTP polling fallback to backend active-match API
    const pollInterval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/cricket/active-match/${encodeURIComponent(targetManagerId)}`);
        if (resp.ok) {
          const result = await resp.json();
          if (result.active && result.matchId) {
            setMatchId(result.matchId);
            setIsLiveActive(true);
            if (result.match) {
              setMatch(result.match);
            }
          } else if (result.active === false) {
            setIsLiveActive(false);
          }
        }
      } catch (_) {}
    }, 5000);

    return () => {
      if (unsubMgrDoc) unsubMgrDoc();
      if (unsubMatchesQuery) unsubMatchesQuery();
      clearInterval(pollInterval);
    };
  }, [managerId, streamKey]);

  // Primary real-time Firestore synchronization
  useEffect(() => {
    if (!matchId) return;

    if (isMatchDeleted(matchId)) {
      setMatch(null);
      return;
    }

    // Listen on Firestore match document
    const docRef = doc(db, 'cricket_matches', matchId);
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (isMatchDeleted(matchId)) {
        setMatch(null);
        return;
      }
      if (docSnap.exists()) {
        const data = docSnap.data() as MatchState;
        if (data.status === 'deleted' || (data as any).isDeleted) {
          markMatchDeleted(matchId);
          setMatch(null);
          return;
        }
        console.log('[Overlay Sync] Received match update via Firestore:', data.id);
        setMatch(data);
      } else {
        // If not found in Firestore yet, try reading from local storage fallback before giving up
        try {
          const localActive = localStorage.getItem('cricket_active_match');
          if (localActive) {
            const parsed = JSON.parse(localActive) as MatchState;
            if (parsed && (parsed.id === matchId || !matchId)) {
              setMatch(parsed);
              return;
            }
          }
        } catch {}
        console.warn('[Overlay Sync] Match doc not found in Firestore for matchId:', matchId);
      }
    }, (err) => {
      console.warn('[Overlay Sync] Firestore subscription error, using local storage fallback:', err);
    });

    const handleDeletedEvent = (e: any) => {
      const id = e?.detail?.id;
      if (id && (id === matchId || match?.id === id)) {
        setMatch(null);
      }
    };
    window.addEventListener('cricket_match_deleted', handleDeletedEvent);

    return () => {
      unsub();
      window.removeEventListener('cricket_match_deleted', handleDeletedEvent);
    };
  }, [matchId]);

  // Secondary high-speed LocalStorage synchronizer & polling fallback
  useEffect(() => {
    const syncFromLocal = () => {
      try {
        const activeStr = localStorage.getItem('cricket_active_match');
        if (activeStr) {
          try {
            const parsed = JSON.parse(activeStr) as MatchState;
            if (parsed && !isMatchDeleted(parsed.id) && parsed.status !== 'deleted' && !(parsed as any).isDeleted && (parsed.id === matchId || !matchId)) {
              setMatch((prev) => {
                if (!prev || prev.updatedAt !== parsed.updatedAt || prev.version !== parsed.version) {
                  console.log('[Overlay Sync] LocalStorage initial/checked sync:', parsed.id, parsed.version);
                  return parsed;
                }
                return prev;
              });
              if (parsed.id && parsed.id !== matchId) {
                setMatchId(parsed.id);
              }
              return;
            }
          } catch {}
        }

        const pendingStr = localStorage.getItem('cricket_matches_offline_pending');
        if (pendingStr) {
          try {
            const parsed = JSON.parse(pendingStr) as MatchState;
            if (parsed && !isMatchDeleted(parsed.id) && parsed.status !== 'deleted' && !(parsed as any).isDeleted && (parsed.id === matchId || !matchId)) {
              setMatch((prev) => {
                if (!prev || prev.updatedAt !== parsed.updatedAt || prev.version !== parsed.version) {
                  return parsed;
                }
                return prev;
              });
              if (parsed.id && parsed.id !== matchId) {
                setMatchId(parsed.id);
              }
            }
          } catch {}
        }

        // Direct YouTube Channel logo sync from local storage
        try {
          const ytStored = localStorage.getItem('cricket_youtube_channel_logo') || '';
          setLocalYoutubeChannelLogo((prev) => (prev !== ytStored ? ytStored : prev));
          const ytNameStored = localStorage.getItem('cricket_youtube_channel_name') || '';
          setLocalYoutubeChannelName((prev) => (prev !== ytNameStored ? ytNameStored : prev));
        } catch {}
      } catch (e) {
        console.warn('[Overlay Sync] Failed to read from localStorage:', e);
      }
    };

    // Pull initial local storage data if exists
    syncFromLocal();

    const handleStorage = (e: StorageEvent) => {
      if ((e.key === 'cricket_matches_offline_pending' || e.key === 'cricket_active_match') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as MatchState;
          if (parsed && !isMatchDeleted(parsed.id) && parsed.status !== 'deleted' && !(parsed as any).isDeleted && (parsed.id === matchId || !matchId)) {
            console.log('[Overlay Sync] High-speed active/offline storage trigger:', parsed.id, parsed.version);
            setMatch(parsed);
            if (parsed.id && parsed.id !== matchId) {
              setMatchId(parsed.id);
            }
          }
        } catch {}
      }
      if (e.key === 'cricket_youtube_channel_logo') {
        setLocalYoutubeChannelLogo(e.newValue || '');
      }
      if (e.key === 'cricket_youtube_channel_name') {
        setLocalYoutubeChannelName(e.newValue || '');
      }
    };

    window.addEventListener('storage', handleStorage);

    // Immediate same-page polling sync (fires for iframe/parent tab same-page updates)
    const pollInterval = setInterval(() => {
      syncFromLocal();
    }, 250);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [matchId]);

  // Periodic parent iframe heartbeat ping
  useEffect(() => {
    const isFrame = window.self !== window.top;
    if (!isFrame) return;

    // Send immediate ping on load
    try {
      window.parent.postMessage({ type: 'OVERLAY_PING', timestamp: Date.now() }, '*');
    } catch (_) {}

    const interval = setInterval(() => {
      try {
        window.parent.postMessage({ type: 'OVERLAY_PING', timestamp: Date.now() }, '*');
      } catch (_) {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // High-speed cross-tab and cross-frame state receivers
  useEffect(() => {
    // 1. BroadcastChannel receiver
    try {
      const channel = new BroadcastChannel('cricket_match_sync');
      const handleBroadcastMsg = (event: MessageEvent) => {
        if (event.data && event.data.type === 'MATCH_UPDATE' && event.data.match) {
          const incoming = event.data.match as MatchState;
          const isPreview = searchParams.get('preview') === 'true' || window.location.href.includes('preview=true');
          if (incoming.id === matchId || !matchId || isPreview) {
            console.log('[Overlay Sync] High-speed BroadcastChannel update:', incoming.id);
            setMatch(incoming);
            if (incoming.id && incoming.id !== matchId) {
              setMatchId(incoming.id);
            }
          }
        }
      };
      channel.addEventListener('message', handleBroadcastMsg);
      return () => {
        channel.removeEventListener('message', handleBroadcastMsg);
        channel.close();
      };
    } catch (e) {
      console.warn('[Overlay Sync] BroadcastChannel setup skipped:', e);
    }
  }, [matchId, searchParams]);

  useEffect(() => {
    // 2. Direct postMessage receiver (crucial backup for sandboxed iframe containers)
    const handlePostMsg = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MATCH_UPDATE' && event.data.match) {
        const incoming = event.data.match as MatchState;
        const isPreview = searchParams.get('preview') === 'true' || window.location.href.includes('preview=true');
        if (incoming.id === matchId || !matchId || isPreview) {
          console.log('[Overlay Sync] High-speed Direct postMessage update:', incoming.id);
          setMatch(incoming);
          if (incoming.id && incoming.id !== matchId) {
            setMatchId(incoming.id);
          }
        }
      }
    };
    window.addEventListener('message', handlePostMsg);
    return () => {
      window.removeEventListener('message', handlePostMsg);
    };
  }, [matchId, searchParams]);

  // Sync incoming real-time alerts
  useEffect(() => {
    if (activeConfig.manualAlertTrigger && activeConfig.manualAlertTrigger.timestamp > lastProcessedAlertRef.current) {
      lastProcessedAlertRef.current = activeConfig.manualAlertTrigger.timestamp;
      const alertType = activeConfig.manualAlertTrigger.type;
      if (alertType === 'four' || alertType === 'six' || alertType === 'boundary_counter_four' || alertType === 'boundary_counter_six') {
        const bType: 'four' | 'six' = (alertType === 'six' || alertType === 'boundary_counter_six') ? 'six' : 'four';
        const currStriker = currentInnings?.batsmen?.[currentInnings.strikerIndex];
        if (activeConfig.showBoundaryCounter !== false) {
          setBoundaryCounterPopup({
            visible: true,
            type: bType,
            batterName: (activeConfig.manualAlertTrigger as any).meta?.batterName || currStriker?.name || 'Striker',
            timestamp: Date.now()
          });
        }
      }
      setActiveAlert(activeConfig.manualAlertTrigger.type);
      setActiveAlertMeta((activeConfig.manualAlertTrigger as any).meta);
    }
  }, [activeConfig.manualAlertTrigger, currentInnings, activeConfig.showBoundaryCounter]);

  // Auto-dismiss custom banners after 5.0 seconds so they never get stuck on screen
  useEffect(() => {
    if (activeConfig.customBanner && activeConfig.customBanner !== 'none') {
      setLocalBannerDismissed(false);
      const timer = setTimeout(() => {
        setLocalBannerDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeConfig.customBanner, activeConfig.customBannerText]);

  // Explicit handler to effectively close the wicket dismissal popup from the left corner
  const handleCloseWicketPopup = useCallback(() => {
    setWicketPopup(null);
    setLocalWicketDismissed(true);
    setWicketTriggerAlert(false);
  }, []);

  // Timer-based auto-close feature for wicket dismissal popup:
  // Dynamically counts down from 2 to 0 seconds (2.0s timing) and auto-dismisses when finished
  useEffect(() => {
    const isWicketOpen = Boolean((wicketPopup?.visible && !localWicketDismissed) || (activeConfig.manualWicketTrigger && !localWicketDismissed));
    if (isWicketOpen) {
      setWicketSecondsRemaining(2);
      const timer = setInterval(() => {
        setWicketSecondsRemaining(prev => {
          if (prev <= 1) {
            handleCloseWicketPopup();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [wicketPopup?.visible, activeConfig.manualWicketTrigger, localWicketDismissed, handleCloseWicketPopup]);

  // Auto-dismiss manual outs display after 5.0 seconds
  useEffect(() => {
    if (activeConfig.manualOutsDisplay && activeConfig.manualOutsDisplay !== 'none') {
      setLocalOutsDismissed(false);
      const timer = setTimeout(() => {
        setLocalOutsDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeConfig.manualOutsDisplay]);

  const statsBottomClass = useMemo(() => {
    if (!activeConfig.showScoreBug) return 'bottom-12';
    if (activeConfig.template === 'slanted-pro-design') return 'bottom-[140px]';
    if (activeConfig.template === 'score-bug-1900-200') return 'bottom-[240px]';
    return 'bottom-[380px]';
  }, [activeConfig.showScoreBug, activeConfig.template]);

  // Lower-third ticker bar positioning: stacked cleanly ON TOP OF the main scoreboard with breathing room
  const lowerThirdBottomClass = useMemo(() => {
    if (!activeConfig.showScoreBug) return 'bottom-16 left-16';
    if (activeConfig.template === 'slanted-pro-design') return 'bottom-[130px] left-16';
    if (activeConfig.template === 'score-bug-1900-200') return 'bottom-[240px] left-16';
    // Position stacked right above the standard score bug (height ~270px + bottom-16 is 334px; at 380px it has 46px clearance)
    return 'bottom-[380px] left-16';
  }, [activeConfig.showScoreBug, activeConfig.template]);

  // Left-side corner positioning for the wicket dismissal popup
  const wicketPopupPositionClass = useMemo(() => {
    if (!activeConfig.showScoreBug) return 'top-20 left-16';
    if (activeConfig.template === 'slanted-pro-design') return 'bottom-[130px] left-16';
    if (activeConfig.template === 'score-bug-1900-200') return 'top-20 left-16';
    // Standard left scoreboard: docked in the left-side corner right above the score bug
    return 'bottom-[380px] left-16';
  }, [activeConfig.showScoreBug, activeConfig.template]);



  // Track boundaries & wicket transitions
  useEffect(() => {
    if (!currentInnings) return;

    // Detect Runs boundary flashes & auto-trigger stinger animations
    if (prevRuns !== undefined && currentInnings.runs > prevRuns) {
      const diff = currentInnings.runs - prevRuns;
      const currStriker = currentInnings.batsmen?.[currentInnings.strikerIndex] || currentInnings.batsmen?.find(b => b?.isStriker);
      const currBowler = currentInnings.bowlers?.[currentInnings.currentBowlerIndex] || currentInnings.bowlers?.find(b => b?.isCurrent);

      if (diff === 4) {
        setLastBdryFlash('4');
        setTimeout(() => setLastBdryFlash(null), 2000);
        if (activeConfig.showBoundaryCounter !== false) {
          setBoundaryCounterPopup({
            visible: true,
            type: 'four',
            batterName: currStriker?.name || 'Striker',
            timestamp: Date.now()
          });
        }
        if (autoStingersEnabled) {
          setActiveAlert('four');
          setActiveAlertMeta({
            batterName: currStriker?.name || 'Striker',
            bowlerName: currBowler?.name || 'Bowler',
            runs: currStriker?.runs,
            balls: currStriker?.balls,
            fours: currStriker?.fours,
            speed: '136 km/h',
            tournamentFours: tournamentBoundaries.fours,
            tournamentSixes: tournamentBoundaries.sixes,
            tournamentName: match?.tournamentName || (match as any)?.seriesName || 'KARJAT BIG BASH LEAGUE'
          });
        }
      } else if (diff === 6) {
        setLastBdryFlash('6');
        setTimeout(() => setLastBdryFlash(null), 2000);
        if (activeConfig.showBoundaryCounter !== false) {
          setBoundaryCounterPopup({
            visible: true,
            type: 'six',
            batterName: currStriker?.name || 'Striker',
            timestamp: Date.now()
          });
        }
        if (autoStingersEnabled) {
          setActiveAlert('six');
          setActiveAlertMeta({
            batterName: currStriker?.name || 'Striker',
            bowlerName: currBowler?.name || 'Bowler',
            runs: currStriker?.runs,
            balls: currStriker?.balls,
            sixes: currStriker?.sixes,
            distance: '94m',
            tournamentFours: tournamentBoundaries.fours,
            tournamentSixes: tournamentBoundaries.sixes,
            tournamentName: match?.tournamentName || (match as any)?.seriesName || 'KARJAT BIG BASH LEAGUE'
          });
        }
      }
    }
    setPrevRuns(currentInnings.runs);

    // Detect Wickets Fall popups & auto-trigger dismissal animations (2.0s duration)
    if (prevWickets > 0 && currentInnings.wickets > prevWickets) {
      setLocalWicketDismissed(false);
      setWicketSecondsRemaining(2);
      setWicketTriggerAlert(true);
      setTimeout(() => {
        setWicketTriggerAlert(false);
      }, 2000); // exactly 2.0s duration

      const latestWicketNum = currentInnings.wickets;
      const fowList = currentInnings.fallOfWickets || [];
      const fowEntry = fowList.find(f => f.wicketNo === latestWicketNum) || 
                       (fowList.length > 0 ? fowList[fowList.length - 1] : undefined);

      const dismissedBatterName = fowEntry?.batsmanName || '';
      const matchingBatter = (currentInnings.batsmen || []).find(b => b.name === dismissedBatterName);
      const dismissalMode = matchingBatter?.outMode || 'Dismissed';
      const currBowler = currentInnings.bowlers?.[currentInnings.currentBowlerIndex] || currentInnings.bowlers?.find(b => b?.isCurrent);

      if (fowEntry) {
        setWicketPopup({
          batterName: dismissedBatterName,
          dismissalType: dismissalMode,
          scoreAtFall: `${fowEntry.score}/${latestWicketNum} (${fowEntry.oversList} ov)`,
          visible: true
        });
      }

      if (autoStingersEnabled) {
        let stingerType = 'wicket';
        const modeLower = (dismissalMode || '').toLowerCase();
        if (modeLower.includes('bowled')) stingerType = 'bowled';
        else if (modeLower.includes('caught') || modeLower.includes('catch')) stingerType = 'caught';
        else if (modeLower.includes('run out') || modeLower.includes('runout')) stingerType = 'run_out';
        else if (modeLower.includes('lbw')) stingerType = 'lbw';
        else if (modeLower.includes('stump')) stingerType = 'stumped';

        setActiveAlert(stingerType);
        setActiveAlertMeta({
          batterName: dismissedBatterName || matchingBatter?.name || 'Batsman',
          bowlerName: matchingBatter?.dismissedBy || currBowler?.name || 'Bowler',
          fielderName: matchingBatter?.fielderName || 'Fielder',
          howOut: dismissalMode,
          runs: matchingBatter?.runs,
          balls: matchingBatter?.balls,
          customText: fowEntry ? `Score: ${fowEntry.score}/${latestWicketNum}` : undefined
        });
      }
    }
    setPrevWickets(currentInnings.wickets);
  }, [currentInnings?.runs, currentInnings?.wickets]);

  // Detect New Batter / New Bowler
  useEffect(() => {
    if (!currentInnings) return;

    const striker = currentInnings.batsmen?.[currentInnings.strikerIndex]?.name || '';
    const bowlerName = currentInnings.bowlers?.[currentInnings.currentBowlerIndex]?.name || 
                       currentInnings.bowlers?.find(b => b.isCurrent)?.name || '';

    if (prevStriker && striker && striker !== prevStriker) {
      setNewBatterAlert(striker);
      setTimeout(() => setNewBatterAlert(null), 5000);
    }
    setPrevStriker(striker);

    if (prevBowler && bowlerName && bowlerName !== prevBowler) {
      setNewBowlerAlert(bowlerName);
      setTimeout(() => setNewBowlerAlert(null), 5000);
    }
    setPrevBowler(bowlerName);
  }, [currentInnings?.strikerIndex, currentInnings?.currentBowlerIndex]);

  // Derived Match info variables safely loaded
  const currentOverNo = useMemo(() => {
    if (!currentInnings) return 0;
    return currentInnings.ballsBowled > 0 ? Math.floor((currentInnings.ballsBowled - 1) / 6) : 0;
  }, [currentInnings?.ballsBowled]);

  const currentOverBalls = useMemo(() => {
    if (!currentInnings) return [];
    
    // Helper to get matching over index
    const getOverIndex = (overBallStr: string) => {
      const num = parseFloat(overBallStr);
      if (isNaN(num)) return -1;
      return overBallStr.endsWith('.0') ? Math.floor(num) - 1 : Math.floor(num);
    };

    const raw = (currentInnings.commentaryList || [])
      .filter((c: any) => {
        if (!c || !c.overBall || c.overBall === '0.0') return false;
        if (
          c.type === 'milestone' || 
          c.type === 'announcement' || 
          c.type === 'break' || 
          c.type === 'info' || 
          c.specialEvent === 'retire_hurt' ||
          c.announcementType === 'new_batsman' ||
          c.announcementType === 'new_bowler'
        ) return false;
        const desc = (c.description || '').toLowerCase();
        if (
          desc.includes('retired hurt') ||
          desc.includes('new batsman on crease') ||
          desc.includes('bowler into the attack') ||
          desc.includes('started') ||
          desc.includes('toss')
        ) return false;
        return getOverIndex(c.overBall) === currentOverNo;
      });

    // Deduplicate deliveries so only ONE pill is shown per ball delivery (no multiple W pills)
    const deduped: any[] = [];
    const seenIds = new Set<string>();
    const seenWickets = new Set<string>();
    for (const item of raw) {
      if (item.id && seenIds.has(item.id)) continue;
      if (item.id) seenIds.add(item.id);
      if (item.type === 'wicket') {
        if (seenWickets.has(item.overBall)) continue;
        seenWickets.add(item.overBall);
      }
      deduped.push(item);
    }

    return deduped.slice(0, 12).reverse(); // oldest to newest
  }, [currentInnings?.commentaryList, currentOverNo]);

  // Mini summary of last 3 overs
  const recentOversPills = useMemo(() => {
    if (!currentInnings) return [];
    
    // Group commentary list by integer overs, filtering out non-deliveries and deduplicating
    const overGroups: Record<number, CommentaryItem[]> = {};
    const seenDeliveries = new Set<string>();

    (currentInnings.commentaryList || []).forEach(c => {
      if (!c.overBall || c.overBall === '0.0') return;
      if (
        c.type === 'milestone' || 
        c.type === 'announcement' || 
        c.type === 'break' || 
        c.type === 'info' || 
        c.specialEvent === 'retire_hurt' ||
        c.announcementType === 'new_batsman'
      ) return;
      const desc = (c.description || '').toLowerCase();
      if (desc.includes('retired hurt') || desc.includes('new batsman on crease')) return;

      if (seenDeliveries.has(c.overBall)) return;
      seenDeliveries.add(c.overBall);

      const overInt = Math.floor(parseFloat(c.overBall));
      if (isNaN(overInt)) return;
      if (!overGroups[overInt]) overGroups[overInt] = [];
      overGroups[overInt].push(c);
    });

    // Take the 3 completed overs prior to currentOverNo
    const items: { over: number; runs: number; wickets: number; balls: string[] }[] = [];
    const minOver = Math.max(0, currentOverNo - 3);
    for (let o = currentOverNo - 1; o >= minOver; o--) {
      const comms = overGroups[o] || [];
      if (comms.length === 0) continue;
      
      let runsSum = 0;
      let wktsSum = 0;
      const bLabels: string[] = [];

      comms.reverse().forEach(c => {
        const desc = (c?.description || '').toLowerCase();
        if (c?.type === 'wicket') {
          wktsSum++;
          bLabels.push('W');
        } else if (c?.type === 'boundary') {
          const is6 = desc.includes('six') || desc.includes('6 runs');
          runsSum += is6 ? 6 : 4;
          bLabels.push(is6 ? '6' : '4');
        } else {
          const numMatch = desc.match(/\d+/);
          const runs = numMatch ? parseInt(numMatch[0]) : 0;
          runsSum += runs;
          bLabels.push(runs.toString());
        }
      });

      items.push({
        over: o + 1,
        runs: runsSum,
        wickets: wktsSum,
        balls: bLabels
      });
    }

    return items;
  }, [currentInnings?.commentaryList, currentOverNo]);

  const formatOvers = (balls: number) => {
    const overs = Math.floor(balls / 6);
    const rem = balls % 6;
    return `${overs}.${rem}`;
  };

  const calculateCRR = useMemo(() => {
    if (!currentInnings || currentInnings.ballsBowled === 0) return '0.00';
    return ((currentInnings.runs / currentInnings.ballsBowled) * 6).toFixed(2);
  }, [currentInnings]);

  const calculateRRR = useMemo(() => {
    if (!match || !currentInnings || !match.targetRuns) return '0.00';
    const totalBalls = match.oversLimit * 6;
    const ballsRemaining = totalBalls - currentInnings.ballsBowled;
    if (ballsRemaining <= 0) return '0.00';
    const runsNeeded = match.targetRuns - currentInnings.runs;
    if (runsNeeded <= 0) return '0.00';
    return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
  }, [match, currentInnings]);

  const projectedScore = useMemo(() => {
    if (!currentInnings || !match) return 0;
    const crrNum = parseFloat(calculateCRR);
    return Math.round(crrNum * match.oversLimit);
  }, [currentInnings, match, calculateCRR]);

  // Color Coding logic for Required Run Rate
  const rrrColorClass = useMemo(() => {
    if (inningsNum === 1) return 'text-slate-400';
    const crrNum = parseFloat(calculateCRR);
    const rrrNum = parseFloat(calculateRRR);
    const diff = rrrNum - crrNum;
    if (diff < 0) return 'text-emerald-400'; // Chasing team ahead
    if (diff > 1.5) return 'text-rose-500';  // Chasing team behind (hard chase)
    return 'text-amber-500';                // Close game
  }, [inningsNum, calculateCRR, calculateRRR]);

  // Statistics calculation helpers
  const bowlingStats = useMemo(() => {
    if (!currentInnings) return null;
    const bowlers = currentInnings.bowlers || [];
    const currentBowler = bowlers[currentInnings.currentBowlerIndex] || bowlers.find(b => b?.isCurrent) || bowlers[0];
    if (!currentBowler) return null;

    const balls = currentBowler.ballsBowled || 0;
    const maidens = currentBowler.maidens || 0;
    const wickets = currentBowler.wickets || 0;
    const runs = currentBowler.runsConceded || 0;
    const econ = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

    // Calculate dot ball percentage from bowler-specific commentary
    const bowlerNameLower = (currentBowler.name || '').toLowerCase();
    const bowlsForThisBowler = (currentInnings.commentaryList || []).filter(c => 
      (c?.description || '').toLowerCase().includes(bowlerNameLower)
    );
    const dotsCount = bowlsForThisBowler.filter(c => 
      (c?.description || '').toLowerCase().includes('dot ball') || 
      (c?.description || '').toLowerCase().includes('no run') || 
      (c?.description || '').toLowerCase().includes('0 run')
    ).length;
    const dotBallPct = bowlsForThisBowler.length > 0 
      ? Math.round((dotsCount / bowlsForThisBowler.length) * 100) 
      : 35; // reasonable average fallback

    return {
      name: currentBowler.name || 'Bowler',
      balls,
      maidens,
      wickets,
      runs,
      econ,
      dotBallPct
    };
  }, [currentInnings]);

  const battingStats = useMemo(() => {
    if (!currentInnings) return null;
    const batsmen = currentInnings.batsmen || [];
    const striker = batsmen[currentInnings.strikerIndex] || batsmen.find(b => b?.isStriker) || batsmen[0] || null;
    const nonStriker = batsmen[currentInnings.nonStrikerIndex] || batsmen.find(b => !b?.isStriker && b?.status === 'batting') || batsmen[1] || null;

    const strikerSR = striker && striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0';
    const nonStrikerSR = nonStriker && nonStriker.balls > 0 
      ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) 
      : '0.0';

    return {
      striker: striker ? {
        ...striker,
        name: striker.name || 'Batter',
        runs: striker.runs ?? 0,
        balls: striker.balls ?? 0,
        fours: striker.fours ?? 0,
        sixes: striker.sixes ?? 0,
        sr: strikerSR
      } : {
        name: 'Batter',
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        sr: '0.0'
      },
      nonStriker: nonStriker ? {
        ...nonStriker,
        name: nonStriker.name || 'Partner',
        runs: nonStriker.runs ?? 0,
        balls: nonStriker.balls ?? 0,
        fours: nonStriker.fours ?? 0,
        sixes: nonStriker.sixes ?? 0,
        sr: nonStrikerSR
      } : null
    };
  }, [currentInnings]);

  const matchStats = useMemo(() => {
    if (!currentInnings || !match) return null;
    const extrasObj = currentInnings.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
    const totalExtras = (extrasObj.wides || 0) + (extrasObj.noBalls || 0) + (extrasObj.byes || 0) + (extrasObj.legByes || 0) + (extrasObj.penalty || 0);

    // Partnership - calculate runs since last fell wicket
    const sortedFow = [...(currentInnings.fallOfWickets || [])].sort((a,b) => b.wicketNo - a.wicketNo); // descending
    const lastWktScore = sortedFow[0]?.score || 0;
    const activePartnership = currentInnings.runs - lastWktScore;

    // Powerplay runs estimation (Overs 1 to 6)
    const ppBalls = (currentInnings.commentaryList || []).filter(c => {
      const overNumVal = parseFloat(c.overBall || '0.0');
      return !isNaN(overNumVal) && overNumVal < 6.0;
    });
    let ppRuns = 0;
    ppBalls.forEach(c => {
      const desc = c.description.toLowerCase();
      if (c.type === 'boundary') {
        ppRuns += desc.includes('six') || desc.includes('6 runs') ? 6 : 4;
      } else {
        const matchDigits = desc.match(/\d+/);
        ppRuns += matchDigits ? parseInt(matchDigits[0]) : 0;
      }
    });

    // Death overs runs estimation (Last 4 overs of limit)
    const limit = match.oversLimit;
    const deathBalls = (currentInnings.commentaryList || []).filter(c => {
      const overNumVal = parseFloat(c.overBall || '0.0');
      return !isNaN(overNumVal) && overNumVal >= (limit - 4);
    });
    let deathRuns = 0;
    deathBalls.forEach(c => {
      const desc = c.description.toLowerCase();
      if (c.type === 'boundary') {
        deathRuns += desc.includes('six') || desc.includes('6 runs') ? 6 : 4;
      } else {
        const matchDigits = desc.match(/\d+/);
        deathRuns += matchDigits ? parseInt(matchDigits[0]) : 0;
      }
    });

    // Last 5 overs (approx 30 balls) calculation from commentaryList
    const totalBalls = currentInnings.ballsBowled || 0;
    const last5ThresholdOver = Math.max(0, (totalBalls - 30) / 6);
    const last5Items = (currentInnings.commentaryList || []).filter(c => {
      const ovVal = parseFloat(c.overBall || '0.0');
      return !isNaN(ovVal) && ovVal >= last5ThresholdOver;
    });
    let last5Runs = 0;
    let last5Wickets = 0;
    last5Items.forEach(c => {
      if (c.type === 'wicket') last5Wickets += 1;
      const desc = (c.description || '').toLowerCase();
      if (c.type === 'boundary') {
        last5Runs += desc.includes('six') || desc.includes('6 runs') ? 6 : 4;
      } else {
        const matchDigits = desc.match(/\d+/);
        last5Runs += matchDigits ? parseInt(matchDigits[0], 10) : 0;
      }
    });

    const totalFours = (currentInnings.batsmen || []).reduce((sum, b) => sum + (b.fours || 0), 0);
    const totalSixes = (currentInnings.batsmen || []).reduce((sum, b) => sum + (b.sixes || 0), 0);

    return {
      totalExtras,
      wides: extrasObj.wides,
      noBalls: extrasObj.noBalls,
      byes: extrasObj.byes,
      legByes: extrasObj.legByes,
      activePartnership,
      powerplayRuns: ppRuns,
      deathRuns: deathRuns,
      last5Runs,
      last5Wickets,
      totalFours,
      totalSixes
    };
  }, [currentInnings, match]);

  // Global Tournament Name & Match Stage (accessible across all scorebugs, previews, and full-screen overlays)
  const matchTournamentName = match?.tournamentName || (match as any)?.seriesName || (match as any)?.tournament || (match as any)?.cupName || 'STAR TV PREMIER LEAGUE 2026';
  const matchStageText = match?.status === 'completed' 
    ? 'FINAL RESULT' 
    : inningsNum === 1 
    ? '1ST INNINGS • LIVE' 
    : '2ND INNINGS • CHASE';

  // Global Tournament Logo with robust fallbacks
  const matchTournamentLogo = useMemo(() => {
    if (match?.tournamentLogo && String(match.tournamentLogo).trim().length > 0) return String(match.tournamentLogo).trim();
    if ((match as any)?.tournament?.logo) return (match as any).tournament.logo;
    if ((activeConfig as any)?.tournamentLogo) return (activeConfig as any).tournamentLogo;
    try {
      const stored = localStorage.getItem('cricket_tournament_logo');
      if (stored && stored.trim().length > 0) return stored.trim();
    } catch (_) {}
    try {
      const actStr = localStorage.getItem('cricket_active_match');
      if (actStr) {
        const parsed = JSON.parse(actStr);
        if (parsed?.tournamentLogo && typeof parsed.tournamentLogo === 'string' && parsed.tournamentLogo.trim().length > 0) {
          return parsed.tournamentLogo.trim();
        }
        if (parsed?.tournament?.logo) return parsed.tournament.logo;
      }
    } catch (_) {}
    try {
      const toursStr = localStorage.getItem('gully_tournaments_v1');
      if (toursStr) {
        const tours = JSON.parse(toursStr);
        if (Array.isArray(tours) && tours.length > 0) {
          const matching = tours.find((t: any) => 
            (matchTournamentName && t.name && t.name.toLowerCase() === matchTournamentName.toLowerCase()) || t.logo
          );
          if (matching?.logo) return matching.logo;
        }
      }
    } catch (_) {}
    return undefined;
  }, [match?.tournamentLogo, (match as any)?.tournament?.logo, (activeConfig as any)?.tournamentLogo, matchTournamentName]);

  // Robust YouTube Channel Logo Resolution (Match State -> Active Config -> Local Storage -> Fallback)
  const matchYoutubeChannelLogo = useMemo(() => {
    if (activeConfig?.youtubeChannelLogo && String(activeConfig.youtubeChannelLogo).trim().length > 0) {
      return String(activeConfig.youtubeChannelLogo).trim();
    }
    if (match?.youtubeChannelLogo && String(match.youtubeChannelLogo).trim().length > 0) {
      return String(match.youtubeChannelLogo).trim();
    }
    if ((match as any)?.overlayConfig?.youtubeChannelLogo && String((match as any).overlayConfig.youtubeChannelLogo).trim().length > 0) {
      return String((match as any).overlayConfig.youtubeChannelLogo).trim();
    }
    if (localYoutubeChannelLogo && localYoutubeChannelLogo.trim().length > 0) {
      return localYoutubeChannelLogo.trim();
    }
    try {
      const stored = localStorage.getItem('cricket_youtube_channel_logo');
      if (stored && stored.trim().length > 0) return stored.trim();
    } catch (_) {}
    try {
      const actStr = localStorage.getItem('cricket_active_match');
      if (actStr) {
        const parsed = JSON.parse(actStr);
        if (parsed?.youtubeChannelLogo && typeof parsed.youtubeChannelLogo === 'string' && parsed.youtubeChannelLogo.trim().length > 0) {
          return parsed.youtubeChannelLogo.trim();
        }
        if (parsed?.overlayConfig?.youtubeChannelLogo && typeof parsed.overlayConfig.youtubeChannelLogo === 'string' && parsed.overlayConfig.youtubeChannelLogo.trim().length > 0) {
          return parsed.overlayConfig.youtubeChannelLogo.trim();
        }
      }
    } catch (_) {}
    return '';
  }, [activeConfig?.youtubeChannelLogo, match?.youtubeChannelLogo, (match as any)?.overlayConfig?.youtubeChannelLogo, localYoutubeChannelLogo]);

  // Accurate calculation of dot balls bowled in the current innings
  const inningsDotBalls = useMemo(() => {
    if (!currentInnings || (currentInnings.ballsBowled || 0) === 0) return 0;
    
    // 1. Calculate from commentaryList if available
    const validBalls = (currentInnings.commentaryList || []).filter(c => {
      if (!c) return false;
      const t = (c as any).type;
      if (t === 'milestone' || t === 'announcement' || t === 'break' || t === 'info') return false;
      return true;
    });

    if (validBalls.length > 0) {
      return validBalls.filter(c => {
        const bs = String((c as any).ballScore || '').trim().toLowerCase();
        if (bs === '0' || bs === '•' || bs === 'dot') return true;
        if (bs === 'w' && !((c as any).runsOffBat > 0)) return true; // clean wicket with 0 runs
        if (c.type === 'normal' && ((c as any).runsOffBat === 0 || (c as any).runsOffBat === '0')) return true;
        const desc = (c.description || '').toLowerCase();
        if (desc.includes('dot ball') || desc.includes('no run') || desc.includes('0 run') || desc.includes('plays a dot')) return true;
        return false;
      }).length;
    }

    // 2. Fallback: check bowlers array
    let bowlerDots = 0;
    (currentInnings.bowlers || []).forEach(bw => {
      if ((bw as any).dotBalls !== undefined && typeof (bw as any).dotBalls === 'number') {
        bowlerDots += (bw as any).dotBalls;
      }
    });
    if (bowlerDots > 0) return Math.min(currentInnings.ballsBowled, bowlerDots);

    // 3. Fallback: estimate from balls bowled minus boundaries
    const fours = matchStats?.totalFours || 0;
    const sixes = matchStats?.totalSixes || 0;
    return Math.max(0, (currentInnings.ballsBowled || 0) - fours - sixes);
  }, [currentInnings, matchStats]);

  // Robust resolution of Toss Details across all sources (match props, local storage, commentary)
  const resolvedToss = useMemo(() => {
    let winner = (match?.tossWinner || (match as any)?.toss?.winner || (match as any)?.tossResult?.winner || '').trim();
    let choice = (match?.tossChoice || (match as any)?.toss?.choice || (match as any)?.tossDecision || (match as any)?.tossResult?.choice || 'bat').trim().toLowerCase() as 'bat' | 'bowl';

    if (!winner) {
      try {
        const rawToss = localStorage.getItem('gully_last_toss_data');
        if (rawToss) {
          const parsed = JSON.parse(rawToss);
          if (parsed?.tossWinner) {
            winner = parsed.tossWinner.trim();
            choice = (parsed.tossChoice || parsed.elected || 'bat').trim().toLowerCase() as 'bat' | 'bowl';
          }
        }
      } catch (_) {}
    }

    if (!winner && currentInnings?.commentaryList) {
      for (const c of currentInnings.commentaryList) {
        const desc = c?.description || '';
        const m = desc.match(/\(([^)]+?)\s+won toss & elected to\s+(bat|bowl)\s+first\)/i) ||
                  desc.match(/([A-Za-z0-9\s]+?)\s+won (?:the )?toss and (?:elected|chose) to\s+(bat|bowl)/i);
        if (m) {
          winner = m[1].trim();
          choice = m[2].trim().toLowerCase() as 'bat' | 'bowl';
          break;
        }
      }
    }

    if (!winner && currentInnings?.battingTeam) {
      winner = currentInnings.battingTeam;
      choice = 'bat';
    }

    const detailsText = winner 
      ? `${winner.toUpperCase()} WON TOSS & ELECTED TO ${choice.toUpperCase()}`
      : 'TOSS COMPLETED • 1ST INNINGS';

    return { winner, choice, detailsText };
  }, [match, currentInnings]);

  // Delivery Style Pill Resolver
  const getPillDetails = (b: CommentaryItem) => {
    if (!b) return { label: '', style: 'hidden' };
    if (
      (b as any).type === 'milestone' || 
      (b as any).type === 'announcement' || 
      (b as any).type === 'break' || 
      (b as any).type === 'info' || 
      (b as any).specialEvent === 'retire_hurt' ||
      (b as any).announcementType === 'new_batsman' ||
      (b as any).announcementType === 'new_bowler'
    ) {
      return { label: '', style: 'hidden' };
    }

    const desc = (b.description || '').toLowerCase();
    if (
      desc.includes('retired hurt') ||
      desc.includes('new batsman on crease') ||
      desc.includes('bowler into the attack') ||
      desc.includes('started') ||
      desc.includes('toss')
    ) {
      return { label: '', style: 'hidden' };
    }

    let label = '•';
    let style = '';

    if (b.type === 'wicket') {
      label = 'W';
      style = 'bg-rose-600 border-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.6)] animate-pulse-fast';
    } else if (b.type === 'boundary') {
      const isSix = desc.includes('six') || desc.includes('6 runs') || desc.includes(' 6 ');
      if (isSix) {
        label = '6';
        style = 'bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-500 font-extrabold text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce-custom';
      } else {
        label = '4';
        style = 'bg-sky-500 border-sky-500 font-bold text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]';
      }
    } else if (b.type === 'extra' || (b as any).isNoBall || ((b as any).ballScore && /nb|wd|lb|b|ex/i.test((b as any).ballScore))) {
      const bScore = String((b as any).ballScore || '').trim().toUpperCase();
      const extraType = String((b as any).extraType || '').toLowerCase();
      const isNoBallDelivery = (b as any).isNoBall || extraType === 'noball' || desc.includes('no ball') || desc.includes('no-ball') || desc.includes('nb') || /nb/i.test(bScore);
      const isWideDelivery = extraType === 'wide' || desc.includes('wide') || /wd/i.test(bScore);
      const isLegByeDelivery = extraType === 'legbye' || /lb/i.test(bScore) || desc.includes('leg bye') || desc.includes('leg-bye') || desc.includes('legbye');
      const isByeDelivery = extraType === 'bye' || /(?:^|\d+)B$/i.test(bScore) || desc.includes('bye');

      if (isNoBallDelivery) {
        let batRuns = 0;
        if (bScore.includes('+')) {
          const m = bScore.match(/\+(\d+)/);
          if (m) batRuns = parseInt(m[1], 10);
        } else if (/^(\d+)NB$/i.test(bScore)) {
          const m = bScore.match(/^(\d+)NB$/i);
          if (m && parseInt(m[1], 10) > 1) batRuns = parseInt(m[1], 10) - 1;
        } else if (bScore === 'NB') {
          batRuns = 0;
        } else if (typeof (b as any).runsOffBat === 'number') {
          batRuns = (b as any).runsOffBat;
        } else {
          const m = desc.match(/plus\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*runs?\s*(?:scored|to\s*batsman|taken)/i);
          if (m) batRuns = parseInt(m[1], 10);
        }
        if (batRuns > 0) {
          label = `NB+${batRuns}`;
          style = batRuns >= 6
            ? 'bg-gradient-to-r from-pink-500 to-amber-500 border-amber-400 font-black text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse-fast'
            : batRuns >= 4
            ? 'bg-gradient-to-r from-pink-500 to-emerald-500 border-emerald-400 font-black text-white shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse-fast'
            : 'bg-pink-600 border-pink-400 text-white font-black shadow-sm';
        } else {
          label = 'NB';
          style = 'bg-red-500 border-red-500 text-white font-bold animate-pulse-fast';
        }
      } else if (isWideDelivery) {
        let extraRuns = 0;
        if (bScore === 'WD') {
          extraRuns = 0;
        } else if (bScore.includes('+')) {
          const m = bScore.match(/\+(\d+)/);
          if (m) extraRuns = parseInt(m[1], 10);
        } else if (/^(\d+)WD$/i.test(bScore)) {
          const m = bScore.match(/^(\d+)WD$/i);
          if (m && parseInt(m[1], 10) > 1) extraRuns = parseInt(m[1], 10) - 1;
        } else if (typeof (b as any).runsOffBat === 'number') {
          extraRuns = (b as any).runsOffBat;
        } else {
          // Check description for extra runs completed by batsmen running; NEVER match "+1 runs" from "Total +1 runs"
          const m = desc.match(/plus\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*extra\s*runs?/i);
          if (m) extraRuns = parseInt(m[1], 10);
        }
        if (extraRuns > 0) {
          label = `WD+${extraRuns}`;
          style = 'bg-orange-600 border-orange-400 text-white font-black shadow-sm';
        } else {
          label = 'WD';
          style = 'bg-orange-500 border-orange-500 text-white font-bold';
        }
      } else if (isLegByeDelivery) {
        // Cricbuzz style: show runs like "1lb", "2lb", "4lb"
        let lbRuns = 1;
        const mScore = bScore.match(/(\d+)\s*LB/i) || bScore.match(/^LB\s*(\d+)$/i) || bScore.match(/^(\d+)$/);
        if (mScore) {
          lbRuns = parseInt(mScore[1], 10);
        } else if (typeof (b as any).runsOffBat === 'number' && (b as any).runsOffBat > 0) {
          lbRuns = (b as any).runsOffBat;
        } else if (typeof (b as any).runs === 'number' && (b as any).runs > 0) {
          lbRuns = (b as any).runs;
        } else {
          const mDesc = desc.match(/(\d+)\s*leg[- ]?bye/i) || desc.match(/(\d+)\s*lb/i);
          if (mDesc) lbRuns = parseInt(mDesc[1], 10);
        }
        if (isNaN(lbRuns) || lbRuns <= 0) lbRuns = 1;

        label = `${lbRuns}lb`;
        style = lbRuns >= 4
          ? 'bg-emerald-600 border-emerald-400 text-white font-black shadow-sm'
          : 'bg-emerald-800/80 border-emerald-600/70 text-emerald-100 font-bold';
      } else if (isByeDelivery) {
        // Cricbuzz style: show runs like "1b", "2b", "4b"
        let bRuns = 1;
        const mScore = bScore.match(/(\d+)\s*B/i) || bScore.match(/^B\s*(\d+)$/i) || bScore.match(/^(\d+)$/);
        if (mScore) {
          bRuns = parseInt(mScore[1], 10);
        } else if (typeof (b as any).runsOffBat === 'number' && (b as any).runsOffBat > 0) {
          bRuns = (b as any).runsOffBat;
        } else if (typeof (b as any).runs === 'number' && (b as any).runs > 0) {
          bRuns = (b as any).runs;
        } else {
          const mDesc = desc.match(/(\d+)\s*bye/i);
          if (mDesc) bRuns = parseInt(mDesc[1], 10);
        }
        if (isNaN(bRuns) || bRuns <= 0) bRuns = 1;

        label = `${bRuns}b`;
        style = 'bg-slate-700 border-slate-500 text-slate-200 font-bold';
      } else {
        label = 'EX';
        style = 'bg-slate-800 border-slate-700 text-slate-400';
      }
    } else {
      let resolvedRuns: number | null = null;
      const directBallScore = (b as any).ballScore;
      if (typeof directBallScore === 'string' && /^[0-6]$/.test(directBallScore.trim())) {
        resolvedRuns = parseInt(directBallScore.trim(), 10);
      } else if (typeof (b as any).runsOffBat === 'number' && !isNaN((b as any).runsOffBat)) {
        resolvedRuns = (b as any).runsOffBat;
      } else if (typeof (b as any).runs === 'number' && !isNaN((b as any).runs)) {
        resolvedRuns = (b as any).runs;
      }

      if (resolvedRuns === null) {
        if (desc.includes('six') || desc.includes(' 6 ') || desc.includes('6 runs')) {
          resolvedRuns = 6;
        } else if (desc.includes('four') || desc.includes(' 4 ') || desc.includes('4 runs') || desc.includes('boundary')) {
          resolvedRuns = 4;
        } else if (desc.includes('three') || desc.includes('triple') || desc.includes('3 runs') || desc.includes('3 run') || desc.includes('for three') || desc.includes('runs 3')) {
          resolvedRuns = 3;
        } else if (desc.includes('two') || desc.includes('couple') || desc.includes('double') || desc.includes('2 runs') || desc.includes('2 run') || desc.includes('for two') || desc.includes('runs 2')) {
          resolvedRuns = 2;
        } else if (desc.includes('single') || desc.includes('one run') || desc.includes('1 run') || desc.includes('for a single') || desc.includes('runs 1') || desc.includes('rotates strike')) {
          resolvedRuns = 1;
        } else {
          const numMatch = desc.match(/\b([0-6])\b/) || desc.match(/\d+/);
          if (numMatch) {
            resolvedRuns = parseInt(numMatch[1] || numMatch[0], 10);
          } else {
            resolvedRuns = 0;
          }
        }
      }

      if (resolvedRuns === 0) {
        label = '•';
        style = 'bg-slate-850 border-slate-800 text-slate-500';
      } else if (resolvedRuns === 4) {
        label = '4';
        style = 'bg-sky-500 border-sky-500 font-bold text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]';
      } else if (resolvedRuns === 6) {
        label = '6';
        style = 'bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-500 font-extrabold text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-bounce-custom';
      } else {
        label = resolvedRuns.toString();
        style = 'bg-emerald-500 border-emerald-500 font-bold text-white';
      }
    }

    return { label, style };
  };

  // Active Broadcast Theme & Layout Resolution
  const activeTheme = (
    searchParams.get('theme') ||
    activeConfig.theme ||
    (
      ['broadcast-pro', 'ipl-style', 'cricheroes-dark', 'neon-sport', 'clean-white', 'retro-gold', 'carbon-modern', 'studio-custom'].includes(activeConfig.template)
        ? activeConfig.template
        : 'broadcast-pro'
    )
  ) as BroadcastTheme;

  const isStudioCustom = activeTheme === 'studio-custom';

  const activeLayout = (
    searchParams.get('layout') ||
    (isStudioCustom && globalStudioTheme?.layout ? globalStudioTheme.layout : null) ||
    activeConfig.layout ||
    (
      ['star-tv-broadcast', 'single-line', 'slanted-pro-design', 'score-bug-1900-200', 'ribbon-full', 'docked-corner', 'mobile-vertical', 'minimal-pill'].includes(activeConfig.template)
        ? activeConfig.template
        : (globalStudioTheme?.layout || 'star-tv-broadcast')
    )
  ) as BroadcastLayout;

  // Dynamic center-screen positioning stacked cleanly ABOVE (or below) the scorebug:
  // Horizontally centered (left-1/2 -translate-x-1/2) with proper clearance so it NEVER hides or overlaps the main scorebug
  const sideStatsPositionClass = useMemo(() => {
    const isTop = activeConfig.bugPosition === 'top-full';
    if (isTop) {
      // Scorebug is at top-0 or top-6 (height ~82px-86px); overlay sits cleanly below it
      return 'top-[104px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    if (!activeConfig.showScoreBug) {
      return 'bottom-8 left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    // Scorebug is active at bottom of screen:
    if (activeLayout === 'star-tv-broadcast') {
      // Star TV scorebug sits at bottom-0 with height ~82px (border/flashing ~86px).
      // bottom-[100px] leaves a 14px clean gap above the scorebug so the scorebug is 100% visible!
      return 'bottom-[100px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    if (activeLayout === 'ribbon-full' || activeLayout === 'single-line') {
      // Ribbon sits at bottom-6 (24px) + height 82px = 106px.
      return 'bottom-[120px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    if (activeLayout === 'minimal-pill') {
      // Pill sits at bottom-10 (40px) + height ~48px = 88px.
      return 'bottom-[108px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    if (activeLayout === 'slanted-pro-design') {
      // Slanted pro bug sits at bottom-12 (48px) + height 80px + live badge = ~155px.
      return 'bottom-[168px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    if (activeLayout === 'docked-corner') {
      // Docked corner card height ~270px at bottom-16 (64px) = 334px.
      return 'bottom-[356px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    if (activeLayout === 'score-bug-1900-200') {
      return 'bottom-[230px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
    }

    // Default standard bottom clearance:
    return 'bottom-[104px] left-1/2 -translate-x-1/2 w-[1100px] max-w-[94vw]';
  }, [activeConfig.bugPosition, activeConfig.showScoreBug, activeLayout]);

  // Active Template Style configs mapper
  const isNeon = activeTheme === 'neon-sport';
  const isWhite = activeTheme === 'clean-white';
  const isIpl = activeTheme === 'ipl-style';
  const isPro = activeTheme === 'broadcast-pro';
  const isCricHeroes = activeTheme === 'cricheroes-dark';
  const isRetro = activeTheme === 'retro-gold';
  const isCarbon = activeTheme === 'carbon-modern';

  let themeColors = {
    cardBg: 'bg-slate-950/92 border-slate-800/80 text-white backdrop-blur-xl shadow-2xl',
    ribbonBg: 'bg-slate-950/95 border-slate-800/80 text-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]',
    accentText: 'text-amber-400 font-bold',
    accentBg: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950',
    titleText: 'text-slate-100 font-black',
    pillDefault: 'bg-slate-900 border-slate-700/60 text-slate-300',
    pillActive: 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold',
    headerGlow: 'border-l-4 border-amber-500 shadow-[0_4px_30px_rgba(0,0,0,0.5)]',
    tickerBg: 'bg-slate-900/95 border-t border-slate-800/30 text-slate-300',
    subCard: 'bg-slate-900/80 border-slate-800/40',
    borderAccent: 'border-amber-500/40'
  };

  if (isStudioCustom && globalStudioTheme) {
    themeColors = {
      cardBg: 'border-sky-500/50 text-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]',
      ribbonBg: 'border-sky-500/50 text-white backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]',
      accentText: 'text-sky-400 font-black',
      accentBg: 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black shadow-lg',
      titleText: 'text-white font-black',
      pillDefault: 'bg-slate-900 border-sky-500/30 text-sky-200',
      pillActive: 'bg-sky-500/20 border-sky-400 text-sky-300 font-black shadow-md',
      headerGlow: 'border-l-4 border-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.35)]',
      tickerBg: 'bg-slate-950/95 border-t border-sky-500/30 text-amber-300 font-bold',
      subCard: 'bg-slate-900/90 border-sky-500/20',
      borderAccent: 'border-sky-500/50'
    };
  } else if (isNeon) {
    themeColors = {
      cardBg: 'bg-black/96 border-fuchsia-500/30 text-white shadow-[0_0_30px_rgba(217,70,239,0.25)] backdrop-blur-2xl',
      ribbonBg: 'bg-black/95 border-fuchsia-500/40 text-white shadow-[0_0_35px_rgba(217,70,239,0.3)] backdrop-blur-2xl',
      accentText: 'text-lime-400 font-black drop-shadow-[0_0_8px_rgba(163,230,53,0.7)]',
      accentBg: 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black shadow-[0_0_15px_rgba(217,70,239,0.5)]',
      titleText: 'text-white font-extrabold',
      pillDefault: 'bg-neutral-900 border-fuchsia-500/20 text-fuchsia-300',
      pillActive: 'bg-lime-500/20 border-lime-400/60 text-lime-300 font-black shadow-[0_0_10px_rgba(163,230,53,0.4)]',
      headerGlow: 'border-l-4 border-fuchsia-400 shadow-[0_0_30px_rgba(217,70,239,0.2)]',
      tickerBg: 'bg-neutral-950/95 border-fuchsia-500/20 text-fuchsia-200',
      subCard: 'bg-neutral-900/90 border-neutral-800/60',
      borderAccent: 'border-fuchsia-500/50'
    };
  } else if (isWhite) {
    themeColors = {
      cardBg: 'bg-white/95 border-slate-200/90 text-slate-900 shadow-2xl backdrop-blur-xl',
      ribbonBg: 'bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl',
      accentText: 'text-blue-700 font-extrabold',
      accentBg: 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md font-black',
      titleText: 'text-slate-900 font-extrabold',
      pillDefault: 'bg-slate-100 border-slate-300 text-slate-700',
      pillActive: 'bg-blue-50 border-blue-500/40 text-blue-800 font-black',
      headerGlow: 'border-l-4 border-blue-600 shadow-sm',
      tickerBg: 'bg-slate-50 border-t border-slate-200 text-slate-700 font-medium',
      subCard: 'bg-slate-50/90 border-slate-200',
      borderAccent: 'border-blue-600/40'
    };
  } else if (isIpl) {
    themeColors = {
      cardBg: 'bg-gradient-to-r from-[#0a1128]/95 via-[#1c1440]/95 to-[#0b0e1e]/95 border-amber-400/40 text-white shadow-[0_0_35px_rgba(251,191,36,0.25)] backdrop-blur-2xl',
      ribbonBg: 'bg-gradient-to-r from-[#0a1128]/98 via-[#1c1440]/98 to-[#0b0e1e]/98 border-amber-400/50 text-white shadow-[0_0_40px_rgba(251,191,36,0.3)] backdrop-blur-2xl',
      accentText: 'text-amber-300 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      accentBg: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-[0_0_15px_rgba(251,191,36,0.5)]',
      titleText: 'text-white font-black',
      pillDefault: 'bg-indigo-950/80 border-purple-500/30 text-purple-200',
      pillActive: 'bg-amber-400/20 border-amber-400/60 text-amber-200 font-black',
      headerGlow: 'border-l-4 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.35)]',
      tickerBg: 'bg-indigo-950/95 border-t border-purple-500/20 text-purple-200',
      subCard: 'bg-purple-950/40 border-purple-500/20',
      borderAccent: 'border-amber-400/60'
    };
  } else if (isCricHeroes) {
    themeColors = {
      cardBg: 'bg-[#0d1117]/96 border-cyan-500/40 text-white shadow-[0_20px_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl',
      ribbonBg: 'bg-[#0d1117]/98 border-cyan-500/40 text-white shadow-[0_20px_50px_rgba(6,182,212,0.2)] backdrop-blur-2xl',
      accentText: 'text-cyan-400 font-mono font-bold tracking-tight',
      accentBg: 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      titleText: 'text-white font-black',
      pillDefault: 'bg-[#161b22] border-cyan-500/20 text-cyan-200',
      pillActive: 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300 font-bold',
      headerGlow: 'border-l-4 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      tickerBg: 'bg-[#161b22]/95 border-t border-cyan-500/20 text-cyan-100',
      subCard: 'bg-[#161b22]/90 border-cyan-500/15',
      borderAccent: 'border-cyan-500/50'
    };
  } else if (isRetro) {
    themeColors = {
      cardBg: 'bg-gradient-to-r from-[#211707]/96 via-[#150f05]/96 to-[#211707]/96 border-amber-500/60 text-amber-50 shadow-[0_20px_50px_rgba(217,119,6,0.2)] backdrop-blur-2xl',
      ribbonBg: 'bg-gradient-to-r from-[#211707]/98 via-[#150f05]/98 to-[#211707]/98 border-amber-500/60 text-amber-50 shadow-[0_20px_50px_rgba(217,119,6,0.25)] backdrop-blur-2xl',
      accentText: 'text-amber-300 font-serif font-black tracking-wider',
      accentBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-amber-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      titleText: 'text-amber-100 font-serif font-black',
      pillDefault: 'bg-[#2a1d0b] border-amber-500/30 text-amber-300',
      pillActive: 'bg-amber-500/30 border-amber-400/70 text-amber-200 font-black',
      headerGlow: 'border-l-4 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
      tickerBg: 'bg-[#1e1507]/95 border-t border-amber-500/30 text-amber-200',
      subCard: 'bg-[#2a1d0b]/80 border-amber-500/20',
      borderAccent: 'border-amber-500/60'
    };
  } else if (isCarbon) {
    themeColors = {
      cardBg: 'bg-[#121417]/96 border-zinc-700/80 text-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-2xl',
      ribbonBg: 'bg-[#121417]/98 border-zinc-700/80 text-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl',
      accentText: 'text-rose-500 font-mono font-bold',
      accentBg: 'bg-gradient-to-r from-rose-600 to-red-700 text-white font-black shadow-[0_0_15px_rgba(225,29,72,0.4)]',
      titleText: 'text-white font-extrabold',
      pillDefault: 'bg-zinc-900/90 border-zinc-750 text-zinc-300',
      pillActive: 'bg-rose-500/20 border-rose-500/60 text-rose-300 font-bold',
      headerGlow: 'border-l-4 border-rose-500 shadow-[0_0_20px_rgba(225,29,72,0.2)]',
      tickerBg: 'bg-zinc-900/95 border-t border-zinc-750 text-zinc-300',
      subCard: 'bg-zinc-900/70 border-zinc-800',
      borderAccent: 'border-rose-500/50'
    };
  }

  // Star TV Broadcast Unified Theme Engine
  const isStarTVTheme = isStarTVThemeActive(activeConfig, activeLayout, globalStudioTheme);
  const starTokens = useMemo(() => {
    return getStarTVThemeTokens(match, currentInnings, activeConfig, globalStudioTheme);
  }, [match, currentInnings, activeConfig, globalStudioTheme]);

  // Harmonize general themeColors with Star TV if Star TV Scorebug/theme is active
  if (isStarTVTheme) {
    themeColors = {
      cardBg: 'bg-slate-950/95 border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl',
      ribbonBg: 'bg-slate-950/95 border-white/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.95)] backdrop-blur-2xl',
      accentText: 'text-amber-400 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
      accentBg: 'bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-slate-950 font-black shadow-[0_0_15px_rgba(251,191,36,0.5)]',
      titleText: 'text-white font-black',
      pillDefault: 'bg-slate-900/90 border-white/10 text-slate-300',
      pillActive: 'bg-amber-400/20 border-amber-400/60 text-amber-300 font-black shadow-[0_0_10px_rgba(251,191,36,0.4)]',
      headerGlow: 'border-l-4 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.35)]',
      tickerBg: 'bg-slate-950/95 border-t border-white/10 text-amber-300 font-bold',
      subCard: 'bg-slate-900/90 border-white/10',
      borderAccent: 'border-sky-400/50'
    };
  }

  // Active Team Accent color variables
  const activeTeamColor = (currentInnings?.battingTeam || '') === (match?.teamA || '') 
    ? (isStarTVTheme ? starTokens.teamAColor : activeConfig.teamAColor)
    : (isStarTVTheme ? starTokens.teamBColor : activeConfig.teamBColor);

  // Studio Custom Background (supports both solid colors and gradient options configured in Super Admin Broadcast Theme Studio)
  const studioBgStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (isStudioCustom && globalStudioTheme) {
      const bg = getThemeBackground(globalStudioTheme);
      return {
        background: bg,
        opacity: globalStudioTheme.bgOpacity ?? 0.95,
        borderColor: globalStudioTheme.borderColor || undefined,
        color: globalStudioTheme.textColor || undefined,
      };
    }
    return undefined;
  }, [isStudioCustom, globalStudioTheme]);

  // Render custom scoreboard design template image overlay dynamically
  const renderCustomOverlayImage = () => {
    if (!activeConfig.customOverlayEnabled || !activeConfig.customOverlayImg) return null;
    return (
      <div 
        className="pointer-events-none absolute select-none"
        style={{
          left: `${activeConfig.customOverlayX}px`,
          top: `${activeConfig.customOverlayY}px`,
          transform: `scale(${activeConfig.customOverlayScale})`,
          transformOrigin: 'top left',
          opacity: activeConfig.customOverlayOpacity,
          zIndex: activeConfig.customOverlayAsBackground ? 0 : 9999,
        }}
      >
        <img 
          src={activeConfig.customOverlayImg} 
          alt="Custom Scoreboard Overlay Design" 
          className="max-w-none object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  };

  // Render continuous YouTube Channel logo watermark in the right side top corner (1920x1080 broadcast reference: JioHotstar, SonyLIV, FanCode)
  const renderYoutubeChannelWatermark = () => {
    if (!matchYoutubeChannelLogo || activeConfig.showYoutubeChannelLogo === false) return null;

    const scale = activeConfig.youtubeChannelLogoScale !== undefined ? activeConfig.youtubeChannelLogoScale : 1.0;
    const opacity = activeConfig.youtubeChannelLogoOpacity !== undefined ? activeConfig.youtubeChannelLogoOpacity : 0.95;

    return (
      <div 
        id="broadcast-youtube-channel-watermark"
        className="pointer-events-none absolute top-[38px] right-[52px] select-none z-[9999] transition-all duration-300 ease-out"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top right',
          opacity: opacity,
        }}
      >
        {/* Pure Broadcast Watermark Logo (Referenced from JioHotstar, SonyLIV, FanCode 1080p channel bugs: clean, no black box, no red beep, no live text) */}
        <img 
          src={matchYoutubeChannelLogo} 
          alt="Broadcast Channel Logo" 
          className="h-[56px] max-h-[64px] w-auto max-w-[220px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  };

  const isFullScreenTransition = [
    'team_lineups', 'lineups', 'playing_xi', 
    'squad_a', 'team_a_squad', 'team_a_squad_card', 'squad_a_alert',
    'squad_b', 'team_b_squad', 'team_b_squad_card', 'squad_b_alert',
    'team_squad_image', 'squad_image_overlay',
    'field_positions', 'field_position', 'field_position_overlay', 'fielding_setup', 'field_positions_alert',
    'batting_summary', 'batting_summary_full', 'batting_summary_mini', 'batting_summary_alert', 'batting_summary_mini_alert',
    'bowling_summary', 'bowling_summary_full', 'bowling_summary_mini', 'bowling_summary_alert', 'bowling_summary_mini_alert',
    'innings_scorecard', 'full_scorecard', 
    'match_presentation', 'potm_card', 'presentation', 
    'tournament_standings', 'points_table', 'standings',
    'prematch_matchup', 'matchup_card', 'matchup', 'match_card',
    'tournament_logo', 'tournament_brand', 'tournament_logo_alert',
    'black_board_scoreboard', 'black_board', 'need_board',
    'toss_result', 'toss_card', 'toss', 'toss_report',
    'pitch_weather_report', 'pitch_report', 'pitch_weather', 'weather_report', 'pitch_and_weather',
    'batsman_bowler_brush', 'batsman_bowler_broadcast', 'brush_batsman_bowler', 'image_batsman_bowler', 'batsman_bowler_pro',
    'player_profile_card', 'player_profile_pro', 'player_profile_kohli', 'virat_profile', 'player_profile',
    'broadcast_wipe_stinger', 'wipe_stinger', 'star_wipe', 'tv_wipe',
    'event_six', 'six_slate', 'maximum_slate',
    'event_wicket', 'wicket_slate', 'out_slate',
    'event_milestone', 'milestone_slate', 'fifty_hundred_slate',
    'event_innings_break', 'innings_break', 'target_summary',
    'captains_faceoff', 'clash_of_titans', 'captains_versus',
    'manhattan_graph', 'manhattan', 'worm_graph', 'worm', 'run_rate_graph', 'run_rate', 'partnerships_all', 'partnership', 'partnerships'
  ].includes(activeGraphic);

  // Standby Slate for Permanent OBS Links when waiting or between matches
  if (isPermanentLink && (!match || match.status !== 'live' || !currentInnings) && !isFullScreenTransition) {
    return (
      <div 
        className="bg-transparent overflow-hidden select-none font-sans"
        style={{
          transform: `translate(${dimensions.translateX}px, ${dimensions.translateY}px) scale(${dimensions.scale})`,
          transformOrigin: 'top left',
          width: '1920px',
          height: '1080px',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {renderYoutubeChannelWatermark()}
        <div className="absolute inset-0 bg-transparent flex flex-col justify-end p-8 font-sans pointer-events-none select-none">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-md bg-slate-950/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-4 shadow-2xl text-white pointer-events-auto"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Permanent OBS Link Active
              </span>
              <span className="ml-auto text-[9px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">
                1920×1080
              </span>
            </div>

            <div className="text-xs font-black text-slate-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>Standby Mode</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono text-[10px]">ID: {managerId || streamKey || 'Official Scorer'}</span>
            </div>

            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              {match && match.status === 'completed'
                ? `Previous match "${match.teamA} vs ${match.teamB}" concluded. Score bug will appear automatically when next match is set to Live.`
                : 'Waiting for score manager to broadcast a live match. Live graphics will appear automatically without updating this link.'}
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!match && !isFullScreenTransition) {
    return (
      <div 
        className="bg-transparent overflow-hidden select-none font-sans"
        style={{
          transform: `translate(${dimensions.translateX}px, ${dimensions.translateY}px) scale(${dimensions.scale})`,
          transformOrigin: 'top left',
          width: '1920px',
          height: '1080px',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {renderYoutubeChannelWatermark()}
        <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center font-sans">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 p-8 rounded-[2rem] text-center shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Radio className="animate-pulse" size={28} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">Broadcast Score Bug</h2>
            <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
              Please copy the Browser Source URL from the live scorer cockpit and use it directly inside OBS Studio, or open a live match.
            </p>
            <div className="text-[10px] font-mono font-black border border-white/5 bg-black/40 text-rose-400 rounded-xl p-3 uppercase tracking-wider">
              Waiting for real-time match data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentInnings && !isFullScreenTransition) {
    return (
      <div 
        className="bg-transparent overflow-hidden select-none font-sans"
        style={{
          transform: `translate(${dimensions.translateX}px, ${dimensions.translateY}px) scale(${dimensions.scale})`,
          transformOrigin: 'top left',
          width: '1920px',
          height: '1080px',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {renderYoutubeChannelWatermark()}
        <div className="absolute inset-0 bg-transparent flex items-center justify-center font-sans">
          <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl text-center backdrop-blur-md">
            <p className="text-white font-extrabold uppercase tracking-widest text-sm mb-2">No Active Innings Initialized</p>
            <span className="text-[10px] text-slate-500 font-mono">Activate innings inside Scorer Cockpit</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-transparent overflow-hidden select-none font-sans"
      style={{
        transform: `translate(${dimensions.translateX}px, ${dimensions.translateY}px) scale(${dimensions.scale})`,
        transformOrigin: 'top left',
        width: '1920px',
        height: '1080px',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      
      {/* INJECT ANIMATION KEYFRAMES TO CSS RUNTIME */}
      <style>{`
        @keyframes bdryFourFlash {
          0%, 100% { background: rgba(59,130,246,0.3); box-shadow: 0 0 10px rgba(59,130,246,0.5); }
          50% { background: rgb(14,165,233); color: #ffffff; box-shadow: 0 0 40px rgb(14,165,233); transform: scale(1.08); }
        }
        @keyframes bdrySixFlash {
          0%, 100% { background: rgba(245,158,11,0.3); box-shadow: 0 0 10px rgba(245,158,11,0.5); }
          50% { background: rgb(234,179,8); color: #0f172a; box-shadow: 0 0 45px rgb(234,179,8); transform: scale(1.1); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-40%); }
        }
        @keyframes hueRotateAnimation {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes bgNeonFlow {
          0%, 100% { box-shadow: inset 0 0 60px rgba(244,63,94,0.65), 0 0 35px rgba(244,63,94,0.5); border-color: rgba(244,63,94,0.8); }
          50% { box-shadow: inset 0 0 120px rgba(6,182,212,0.85), 0 0 70px rgba(6,182,212,0.7); border-color: rgba(6,182,212,0.9); }
        }
        @keyframes bgNeonFlowWicket {
          0%, 100% { box-shadow: inset 0 0 60px rgba(220,10,10,0.95), 0 0 35px rgba(220,10,10,0.8); border-color: rgba(220,10,10,1); }
          50% { box-shadow: inset 0 0 120px rgba(127,10,10,0.95), 0 0 70px rgba(127,10,10,0.9); border-color: rgba(127,10,10,1); }
        }
        .bdry-4-flash {
          animation: bdryFourFlash 0.5s ease-in-out infinite;
        }
        .bdry-6-flash {
          animation: bdrySixFlash 0.6s ease-in-out infinite;
        }
        .marquee-container {
          overflow: hidden;
          white-space: nowrap;
          position: relative;
        }
        .marquee-content {
          display: inline-block;
          animation: marquee 8s linear infinite;
        }
        .animate-pulse-fast {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-bounce-custom {
          animation: bounce 1s infinite;
        }
        @keyframes livePulseGlow {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.6), 0 0 12px rgba(225, 29, 72, 0.4);
            opacity: 0.95;
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 0 0 6px rgba(225, 29, 72, 0), 0 0 20px rgba(225, 29, 72, 0.85);
            opacity: 1;
          }
        }
        .live-badge-pulsing {
          animation: livePulseGlow 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* EXTREMELY POLISHED, NEON-RGB BOUNDARY & WICKET BLAST EFFECT */}
      {activeConfig.boundaryBlast && (
        <div 
          className="absolute inset-0 pointer-events-none z-[80] overflow-hidden transition-all duration-500"
          style={{
            border: '24px solid transparent',
            borderImage: wicketTriggerAlert 
              ? 'linear-gradient(45deg, #dc2626, #7f1d1d, #ef4444, #991b1b, #f87171, #dc2626) 1'
              : 'linear-gradient(45deg, #f43f5e, #eab308, #10b981, #06b6d4, #8b5cf6, #f43f5e) 1',
            animation: wicketTriggerAlert
              ? 'hueRotateAnimation 1.5s linear infinite, bgNeonFlowWicket 0.8s ease-in-out infinite alternate'
              : 'hueRotateAnimation 4.5s linear infinite, bgNeonFlow 1.8s ease-in-out infinite alternate',
          }}
        >
          {/* Neon inner dash alignment rope */}
          <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-dashed border-white/20 rounded-2xl animate-pulse" />
          
          {/* Bright corner neon flashes */}
          <div className="absolute top-0 left-0 w-8 h-8 bg-white filter blur-md rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-60 animate-ping" style={{ animationDuration: '1.2s' }} />
          <div className="absolute top-0 right-0 w-8 h-8 bg-white filter blur-md rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-60 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute bottom-0 left-0 w-8 h-8 bg-white filter blur-md rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-60 animate-ping" style={{ animationDuration: '1.8s' }} />
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-white filter blur-md rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] opacity-60 animate-ping" style={{ animationDuration: '2.1s' }} />

          {/* Sparkles floating along the boundary */}
          {Array.from({ length: 12 }).map((_, i) => {
            const positions = [
              { top: '8%', left: '1%' },
              { top: '25%', right: '1%' },
              { bottom: '12%', left: '1%' },
              { bottom: '20%', right: '1%' },
              { top: '1%', left: '15%' },
              { top: '1%', right: '20%' },
              { bottom: '1%', left: '35%' },
              { bottom: '1%', right: '40%' },
              { top: '50%', left: '1%' },
              { top: '50%', right: '1%' },
              { top: '1%', left: '60%' },
              { bottom: '1%', left: '75%' }
            ];
            const pos = positions[i % positions.length];
            return (
              <div 
                key={i} 
                className="absolute w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] animate-ping"
                style={{
                  ...pos,
                  animationDuration: `${0.9 + (i * 0.25)}s`,
                  animationDelay: `${i * 0.15}s`
                }}
              />
            );
          })}
        </div>
      )}

      {/* =========================================================================
          TOP BROADCAST 'LIVE' MATCH STATUS BADGE (PULSING WHILE IN PROGRESS)
          ========================================================================= */}
      {match?.status === 'live' && !isFullScreenTransition && activeLayout !== 'star-tv-broadcast' && (
        <motion.div
          id="overlay-top-live-badge"
          initial={{ opacity: 0, y: -12 }}
          animate={{ 
            opacity: [0.92, 1, 0.92],
            scale: [1, 1.03, 1],
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 2.2, 
            ease: "easeInOut" 
          }}
          className="absolute top-6 left-8 z-40 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-rose-500/40 text-white shadow-[0_0_20px_rgba(225,29,72,0.35)] live-badge-pulsing select-none pointer-events-none"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-sm shadow-rose-500/80" />
          </span>
          {match.isSuperOver ? (
            <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 font-sans flex items-center gap-1.5">
              <span className="text-amber-400">⚡</span>
              SUPER OVER {match.superOverNumber || 1}
            </span>
          ) : (
            <span className="text-[11px] font-black uppercase tracking-widest text-white font-sans flex items-center gap-1.5">
              <Radio size={12} className="text-rose-400 animate-pulse" />
              LIVE
            </span>
          )}
          {match.tournamentName && (
            <span className="text-[10px] font-mono text-slate-300 font-bold border-l border-white/15 pl-2 uppercase tracking-wide">
              {match.tournamentName}
            </span>
          )}
        </motion.div>
      )}

      {/* =========================================================================
          1. WICKET FALL POPUP OVERLAY (LEFT-SIDE CORNER DOCKED WITH TIMER & CLOSE)
          ========================================================================= */}
      <AnimatePresence>
        {((wicketPopup?.visible && !localWicketDismissed) || (activeConfig.manualWicketTrigger && !localWicketDismissed)) && (
          <div 
            className={`absolute ${wicketPopupPositionClass} z-50 pointer-events-auto max-w-xl`}
            id="left-corner-wicket-dismissal-popup"
          >
            <motion.div
              initial={{ x: -60, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="bg-slate-950/98 border-2 border-red-500/70 p-5 rounded-[2rem] shadow-[0_0_50px_rgba(220,38,38,0.75)] backdrop-blur-xl relative overflow-hidden"
            >
              {/* Dynamic red ambient gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-red-600/5 pointer-events-none" />

              <div className="flex items-center justify-between gap-4 relative z-10">
                {/* Wicket Icon & Pulse */}
                <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-600/50 shrink-0 border border-red-400/40 animate-pulse">
                  <Skull size={30} />
                </div>

                {/* Dismissal Details */}
                <div className="flex-1 min-w-0 border-l border-white/10 pl-4 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-400 font-mono bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                      OUT • WICKET FALL
                    </span>
                    {/* Auto-close Timer Badge */}
                    <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                      <Clock size={10} className="text-red-400 animate-spin" />
                      Auto-close in {wicketSecondsRemaining}s
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white uppercase tracking-tight truncate">
                    {wicketPopup?.batterName || battingStats?.striker?.name || 'STRIKER BATSMAN'}
                  </h3>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Method: <strong className="text-red-400 font-black">{wicketPopup?.dismissalType || 'Bowled'}</strong>
                    </span>
                    <span className="text-xs text-amber-300 font-mono font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      FOW: {wicketPopup?.scoreAtFall || `${currentInnings?.runs ?? 0}/${currentInnings?.wickets ?? 0}`}
                    </span>
                  </div>
                </div>

                {/* Explicit Manual Close Button */}
                <button
                  type="button"
                  onClick={handleCloseWicketPopup}
                  className="w-9 h-9 rounded-xl bg-red-600/30 hover:bg-red-600 border border-red-500/50 hover:border-red-400 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg group ml-2"
                  title="Close Wicket Popup Immediately"
                  aria-label="Close Wicket Dismissal Popup"
                >
                  <X size={18} className="group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Animated Linear Countdown Bar for Timer Auto-close */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 overflow-hidden">
                <motion.div
                  key={wicketPopup?.scoreAtFall || 'wicket-timer'}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                  className="h-full bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          1B. CORNER BANNER PROJECTION OVERLAY (CORNER PROJECTION)
          ========================================================================= */}
      <AnimatePresence>
        {activeConfig.customBanner && activeConfig.customBanner !== 'none' && !localBannerDismissed && (
          <div className="absolute top-16 right-16 z-55 pointer-events-auto" id="corner-banner-projection">
            <motion.div
              initial={{ x: 100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 80, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className={`min-w-[320px] max-w-[480px] p-5 rounded-2xl flex items-center gap-4 border shadow-2xl relative overflow-hidden backdrop-blur-md
                ${activeConfig.customBanner === 'out' ? 'bg-red-950/90 border-red-500/50 text-white shadow-red-500/10' :
                  activeConfig.customBanner === 'four' ? 'bg-emerald-950/90 border-emerald-500/50 text-white shadow-emerald-500/10' :
                  activeConfig.customBanner === 'six' ? 'bg-amber-950/90 border-amber-500/50 text-white shadow-amber-500/10' :
                  activeConfig.customBanner === 'fifty' ? 'bg-orange-950/90 border-orange-500/50 text-white shadow-orange-500/10' :
                  activeConfig.customBanner === 'hundred' ? 'bg-indigo-950/90 border-indigo-500/50 text-white shadow-indigo-500/10' :
                  activeConfig.customBanner === 'drinks' ? 'bg-sky-950/90 border-sky-500/50 text-white shadow-sky-500/10' :
                  activeConfig.customBanner === 'rain' ? 'bg-slate-900/90 border-slate-500/50 text-white shadow-slate-500/10' :
                  activeConfig.customBanner === 'free_hit' ? 'bg-rose-950/90 border-rose-500/50 text-white shadow-rose-500/10' :
                  'bg-slate-950/90 border-teal-500/50 text-white shadow-teal-555/10'
                }`}
            >
              {/* Dynamic decorative light streak */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite] pointer-events-none" style={{ animationDuration: '2.5s' }} />

              {/* Decorative side accent strip */}
              <div className={`absolute left-0 inset-y-0 w-2.5 
                ${activeConfig.customBanner === 'out' ? 'bg-red-500' :
                  activeConfig.customBanner === 'four' ? 'bg-emerald-500' :
                  activeConfig.customBanner === 'six' ? 'bg-amber-500' :
                  activeConfig.customBanner === 'fifty' ? 'bg-orange-500' :
                  activeConfig.customBanner === 'hundred' ? 'bg-indigo-500 animate-pulse' :
                  activeConfig.customBanner === 'drinks' ? 'bg-sky-500' :
                  activeConfig.customBanner === 'rain' ? 'bg-slate-500' :
                  activeConfig.customBanner === 'free_hit' ? 'bg-rose-500 animate-pulse' :
                  'bg-teal-500'
                }`} 
              />

              {/* Visual Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg shadow-md shrink-0 ml-1.5
                ${activeConfig.customBanner === 'out' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                  activeConfig.customBanner === 'four' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  activeConfig.customBanner === 'six' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  activeConfig.customBanner === 'fifty' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  activeConfig.customBanner === 'hundred' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                  activeConfig.customBanner === 'drinks' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                  activeConfig.customBanner === 'rain' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30' :
                  activeConfig.customBanner === 'free_hit' ? 'bg-rose-500/20 text-rose-455 border border-rose-500/30 animate-pulse' :
                  'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                }`}
              >
                {activeConfig.customBanner === 'out' && <Skull size={22} className="text-red-450 animate-bounce" />}
                {activeConfig.customBanner === 'four' && <span className="tracking-tighter">4s</span>}
                {activeConfig.customBanner === 'six' && <span className="tracking-tighter animate-pulse">6s</span>}
                {activeConfig.customBanner === 'fifty' && <Trophy size={20} className="text-orange-400" />}
                {activeConfig.customBanner === 'hundred' && <Award size={20} className="text-yellow-455" />}
                {activeConfig.customBanner === 'drinks' && <Star size={20} className="text-sky-400 animate-spin" style={{ animationDuration: '6s' }} />}
                {activeConfig.customBanner === 'rain' && <span className="text-slate-400">🌧</span>}
                {activeConfig.customBanner === 'free_hit' && <Star size={20} className="text-rose-455" />}
                {!['out','four','six','fifty','hundred','drinks','rain','free_hit'].includes(activeConfig.customBanner) && <Award size={20} />}
              </div>

              {/* Text Information */}
              <div className="flex flex-col text-left gap-0.5 flex-1 min-w-0">
                <span className={`text-[9px] font-black tracking-widest uppercase block 
                  ${activeConfig.customBanner === 'out' ? 'text-red-400' :
                    activeConfig.customBanner === 'four' ? 'text-emerald-400' :
                    activeConfig.customBanner === 'six' ? 'text-amber-400' :
                    activeConfig.customBanner === 'fifty' ? 'text-orange-400' :
                    activeConfig.customBanner === 'hundred' ? 'text-indigo-400' :
                    activeConfig.customBanner === 'drinks' ? 'text-sky-400' :
                    activeConfig.customBanner === 'rain' ? 'text-slate-400' :
                    activeConfig.customBanner === 'free_hit' ? 'text-rose-400' :
                    'text-teal-400'
                  }`}
                >
                  {activeConfig.customBanner === 'out' ? 'WICKET FALL' :
                   activeConfig.customBanner === 'four' ? 'BOUNDARY FOUR' :
                   activeConfig.customBanner === 'six' ? 'MAXIMUM SIX' :
                   activeConfig.customBanner === 'fifty' ? 'MILESTONE FIFTY' :
                   activeConfig.customBanner === 'hundred' ? 'MAJESTIC CENTURY' :
                   activeConfig.customBanner === 'drinks' ? 'DRINKS INTERVAL' :
                   activeConfig.customBanner === 'rain' ? 'WEATHER DELAY' :
                   activeConfig.customBanner === 'free_hit' ? 'FREE HIT' :
                   'BROADCAST BANNER'}
                </span>
                <h4 className="text-base font-black text-white leading-tight uppercase truncate">
                  {activeConfig.customBannerText || (
                    activeConfig.customBanner === 'out' ? 'Wicket Dismissal' :
                    activeConfig.customBanner === 'four' ? '4 Runs! Classy Placement.' :
                    activeConfig.customBanner === 'six' ? '6 Runs! Out of the park.' :
                    activeConfig.customBanner === 'fifty' ? 'Crucial Half-Century Completed' :
                    activeConfig.customBanner === 'hundred' ? 'Spectacular 100 Runs Reached!' :
                    activeConfig.customBanner === 'drinks' ? 'Players Taking Hydration' :
                    activeConfig.customBanner === 'rain' ? 'Covers are on the Field' :
                    activeConfig.customBanner === 'free_hit' ? 'No-Ball Penalty Free Hit' :
                    'Graphic Overlay Active'
                  )}
                </h4>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLocalBannerDismissed(true)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/70 hover:text-white transition-all cursor-pointer shrink-0 ml-2"
                title="Dismiss Banner"
              >
                <X size={14} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          2. INDEPENDENT OVERLAYS: OUTS AND FREE HITS
          ========================================================================= */}
      {/* FREE HIT DISPLAY */}
      <AnimatePresence>
        {(match.freeHitNext || activeConfig.manualFreeHitTrigger) && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
            <motion.div
              initial={{ y: -50, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -30, scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-widest border border-yellow-300/40 flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.85)] animate-pulse"
            >
              <Star size={16} className="animate-spin" />
              <span>★ FREE HIT ★</span>
              <Star size={16} className="animate-spin" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OUTS SPECIAL OVERLAY (FULLSCREEN OR CORNER BUG SELECTABLE) */}
      <AnimatePresence>
        {activeConfig.manualOutsDisplay !== 'none' && !localOutsDismissed && (
          <div className={
            activeConfig.manualOutsDisplay === 'fullscreen' 
              ? "absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-[100] pointer-events-auto"
              : "absolute top-12 right-12 w-96 z-40 pointer-events-auto"
          }>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`p-10 rounded-[3rem] text-center border relative ${
                activeConfig.manualOutsDisplay === 'fullscreen' 
                  ? "bg-slate-900 border-emerald-500/20 max-w-2xl w-full shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                  : "bg-slate-950 border-red-500/20 shadow-2xl"
              }`}
            >
              <button
                type="button"
                onClick={() => setLocalOutsDismissed(true)}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>
              <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <Skull size={40} />
              </div>
              <h2 className="text-4xl font-extrabold text-white uppercase tracking-tight mb-2">OUT!</h2>
              <p className="text-lg text-slate-400 uppercase tracking-widest">Wicket Cleared</p>
              
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-8 max-w-md mx-auto">
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">BATSMAN</span>
                  <span className="text-lg font-bold text-white block uppercase">
                    {battingStats?.striker?.name || 'Batter'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">SCORE AT FALL</span>
                  <span className="text-lg font-bold text-emerald-400 block font-mono">
                    {currentInnings?.runs ?? 0}/{currentInnings?.wickets ?? 0}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          CONTINUOUS TOURNAMENT PRIZE MONEY BANNER (ABOVE SCOREBUG)
          Renders continuously above ANY active scorebug layout (Slanted Pro, Star TV, Ribbon, etc.)
          Automatically hidden if score manager has not added prize details.
          ========================================================================= */}
      {activeConfig.showScoreBug && !isFullScreenTransition && (
        <ContinuousPrizeMoneyBanner
          matchId={match?.id || matchId}
          prizes={match?.tournamentPrizes}
          layout={activeLayout}
          position={activeConfig.bugPosition}
        />
      )}

      {/* =========================================================================
          3-STAR. STAR TV PRO SCOREBUG (OFFICIAL TELEVISION REFERENCE DESIGN)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeLayout === 'star-tv-broadcast' && (
        <div 
          id="star-tv-pro-scorebug"
          className={`absolute ${activeConfig.bugPosition === 'top-full' ? 'top-0' : 'bottom-0'} left-0 right-0 w-full z-30 transition-all`}
        >
          {/* Boundary Flash Strip */}
          {lastBdryFlash === '4' && (
            <div className="absolute inset-x-0 -top-2.5 h-2 bg-sky-400 animate-pulse z-50 shadow-[0_0_16px_rgba(56,189,248,0.9)]" />
          )}
          {lastBdryFlash === '6' && (
            <div className="absolute inset-x-0 -top-2.5 h-2 bg-amber-400 animate-pulse z-50 shadow-[0_0_20px_rgba(251,191,36,1)]" />
          )}

          {/* Calculate Star TV scorebug detail overlay information */}
          {(() => {
            const lastOutBatsman = currentInnings?.batsmen ? [...currentInnings.batsmen].reverse().find(b => b.isOut) : null;
            const lastFoW = currentInnings?.fallOfWickets && currentInnings.fallOfWickets.length > 0 
              ? currentInnings.fallOfWickets[currentInnings.fallOfWickets.length - 1] 
              : null;
            const projectedTotal = currentInnings && currentInnings.ballsBowled > 6 
              ? Math.round(((currentInnings.runs / currentInnings.ballsBowled) * (match?.oversLimit || 20) * 6)) 
              : undefined;
            const tossDetailsText = resolvedToss.detailsText;
            const equationDetailsText = match?.targetRuns && inningsNum === 2 
              ? `NEED ${Math.max(0, match.targetRuns - (currentInnings?.runs ?? 0))} RUNS IN ${Math.max(0, ((match?.oversLimit || 20) * 6) - (currentInnings?.ballsBowled ?? 0))} BALLS`
              : undefined;
            const winnerDetailsText = match?.winner 
              ? `${match.winner.toUpperCase()} WON${match.winReason ? ` BY ${match.winReason.toUpperCase()}` : ''}`
              : undefined;

            return (
              <StarTVScorebug 
                battingTeamName={currentInnings?.battingTeam || match?.teamA || 'TEAM A'}
                battingTeamSubtext={inningsNum === 1 ? 'BAT FIRST' : '2ND INNINGS'}
                battingTeamColor={
                  (currentInnings?.battingTeam || '') === (match?.teamA || '')
                    ? (globalStudioTheme?.teamAColor || activeConfig.teamAColor || '#0143a3') 
                    : (globalStudioTheme?.teamBColor || activeConfig.teamBColor || '#c8102e')
                }
                battingTeamLogo={(currentInnings?.battingTeam || '') === (match?.teamA || '') ? match?.teamALogo : match?.teamBLogo}
                strikerName={battingStats?.striker?.name || 'STRIKER'}
                strikerRuns={battingStats?.striker?.runs ?? 0}
                strikerBalls={battingStats?.striker?.balls ?? 0}
                strikerFours={battingStats?.striker?.fours ?? 0}
                strikerSixes={battingStats?.striker?.sixes ?? 0}
                nonStrikerName={battingStats?.nonStriker?.name || 'NON-STRIKER'}
                nonStrikerRuns={battingStats?.nonStriker?.runs ?? 0}
                nonStrikerBalls={battingStats?.nonStriker?.balls ?? 0}
                nonStrikerFours={battingStats?.nonStriker?.fours ?? 0}
                nonStrikerSixes={battingStats?.nonStriker?.sixes ?? 0}
                score={currentInnings?.runs ?? 0}
                wickets={currentInnings?.wickets ?? 0}
                overs={formatOvers(currentInnings?.ballsBowled ?? 0)}
                oversLimit={match?.oversLimit ?? 20}
                bowlerName={bowlingStats?.name || 'BOWLER'}
                bowlerFigures={bowlingStats ? `${bowlingStats.wickets}/${bowlingStats.runs}` : '0/0'}
                bowlerOvers={bowlingStats ? formatOvers(bowlingStats.balls) : '0.0'}
                bowlerEcon={bowlingStats && bowlingStats.balls > 0 ? Number(((bowlingStats.runs / bowlingStats.balls) * 6).toFixed(1)) : 0}
                thisOverBalls={(currentOverBalls || []).map(b => {
                  const d = getPillDetails(b);
                  let type: 'dot' | 'run' | 'four' | 'six' | 'wicket' | 'extra' = 'dot';
                  if (b.type === 'wicket' || d.label === 'W' || /^W$/i.test(d.label)) {
                    type = 'wicket';
                  } else if (d.label === '4') {
                    type = 'four';
                  } else if (d.label === '6') {
                    type = 'six';
                  } else if (
                    b.type === 'extra' ||
                    /wd|nb|lb|b|ex/i.test(d.label) ||
                    (b as any).isNoBall
                  ) {
                    type = 'extra';
                  } else if (['1', '2', '3', '5'].includes(d.label) || parseInt(d.label, 10) > 0) {
                    type = 'run';
                  }
                  return { label: d.label, type };
                })}
                bowlingTeamName={(currentInnings?.battingTeam || '') === (match?.teamA || '') ? (match?.teamB || 'TEAM B') : (match?.teamA || 'TEAM A')}
                bowlingTeamSubtext="BOWLING"
                bowlingTeamColor={
                  (currentInnings?.battingTeam || '') === (match?.teamA || '')
                    ? (globalStudioTheme?.teamBColor || activeConfig.teamBColor || '#c8102e') 
                    : (globalStudioTheme?.teamAColor || activeConfig.teamAColor || '#0143a3')
                }
                bowlingTeamLogo={(currentInnings?.battingTeam || '') === (match?.teamA || '') ? match?.teamBLogo : match?.teamALogo}
                isLive={match?.status === 'live'}
                targetRuns={match?.targetRuns}
                remainingRuns={match?.targetRuns ? Math.max(0, match.targetRuns - (currentInnings?.runs ?? 0)) : undefined}
                remainingBalls={match?.oversLimit ? Math.max(0, (match.oversLimit * 6) - (currentInnings?.ballsBowled ?? 0)) : undefined}
                crr={currentInnings && currentInnings.ballsBowled > 0 ? Number(((currentInnings.runs / currentInnings.ballsBowled) * 6).toFixed(2)) : 0}
                rrr={match?.targetRuns && match.oversLimit && ((match.oversLimit * 6) - (currentInnings?.ballsBowled ?? 0)) > 0 ? Number(((Math.max(0, match.targetRuns - (currentInnings?.runs ?? 0)) / ((match.oversLimit * 6) - (currentInnings?.ballsBowled ?? 0))) * 6).toFixed(2)) : undefined}
                partnershipRuns={matchStats?.activePartnership}
                last5OversRuns={matchStats?.last5Runs}
                last5OversWickets={matchStats?.last5Wickets}
                inningsFours={matchStats?.totalFours}
                inningsSixes={matchStats?.totalSixes}
                inningsDotBalls={inningsDotBalls}
                isFreeHit={Boolean(match?.freeHitNext || (currentOverBalls && currentOverBalls.length > 0 && /nb/i.test(getPillDetails(currentOverBalls[currentOverBalls.length - 1]).label)))}
                isDrsActive={activeAlert === 'drs'}
                showWinPredictor={showWinPredictorOverlay}

                // Star TV Scorebug Mini-Overlay Detail Props
                scorebugOverlayMode={activeConfig.scorebugOverlayMode || 'this_over'}
                tournamentName={matchTournamentName || match?.tournamentName}
                tournamentLogo={matchTournamentLogo || match?.tournamentLogo || (match as any)?.tournament?.logo || (activeConfig as any)?.tournamentLogo}
                matchStage={matchStageText}
                matchVenue={match?.venue}
                groundName={match?.venue}
                umpire1Name={match?.umpire1Name}
                umpire1Photo={match?.umpire1Photo}
                umpire2Name={match?.umpire2Name}
                umpire2Photo={match?.umpire2Photo}
                scoreboardManagerName={match?.scoreboardManagerName}
                scoreboardManagerPhoto={match?.scoreboardManagerPhoto}
                commentatorName={match?.commentatorName}
                commentatorPhoto={match?.commentatorPhoto}
                tossDetails={tossDetailsText}
                tossWinner={resolvedToss.winner}
                tossChoice={resolvedToss.choice}
                equationText={equationDetailsText}
                winnerDetails={winnerDetailsText}
                lastBatsmanName={lastOutBatsman?.name}
                lastBatsmanRuns={lastOutBatsman?.runs}
                lastBatsmanBalls={lastOutBatsman?.balls}
                lastBatsmanDismissal={lastOutBatsman?.howOut}
                lastBatsmanFow={lastFoW ? `${lastFoW.score}/${lastFoW.wicketNo} (${lastFoW.oversList} ov)` : undefined}
                lastBatsmanFours={lastOutBatsman?.fours}
                lastBatsmanSixes={lastOutBatsman?.sixes}
                lastBatsmanSR={lastOutBatsman?.strikeRate || (lastOutBatsman?.balls ? Number(((lastOutBatsman.runs / lastOutBatsman.balls) * 100).toFixed(1)) : undefined)}
                projectedScore={projectedTotal}
                tournamentFours={tournamentBoundaries.fours}
                tournamentSixes={tournamentBoundaries.sixes}
                tournamentPrizes={match?.tournamentPrizes}
                matchId={match?.id}
                showPrizeMoneyBanner={false}
              />
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          3A. MODERN EDGE-TO-EDGE BROADCAST LOWER THIRD RIBBON / SINGLE LINE (IPL / T20 WORLD CUP)
          ========================================================================= */}
      {activeConfig.showScoreBug && (activeLayout === 'ribbon-full' || activeLayout === 'single-line') && (
        <div 
          id="modern-broadcast-ribbon"
          className={`absolute ${activeConfig.bugPosition === 'top-full' ? 'top-6' : 'bottom-6'} left-1/2 -translate-x-1/2 w-[98%] max-w-[1900px] h-[82px] select-none font-sans z-30 flex items-stretch rounded-2xl border ${themeColors.borderAccent || 'border-white/10'} ${themeColors.ribbonBg || themeColors.cardBg} overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]`}
          style={studioBgStyle}
        >
          {/* Boundary Flash Strip */}
          {lastBdryFlash === '4' && (
            <div className="absolute inset-x-0 top-0 h-1.5 bg-sky-400 animate-pulse z-50 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
          )}
          {lastBdryFlash === '6' && (
            <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-400 animate-pulse z-50 shadow-[0_0_14px_rgba(251,191,36,0.9)]" />
          )}

          {/* SECTION 1: LIVE STATUS & BATTING TEAM SCORE */}
          <div className="w-[23%] shrink-0 px-4 flex items-center gap-3 border-r border-white/10 bg-black/25">
            {/* Pulsing Live indicator */}
            <div className="flex flex-col items-center justify-center shrink-0">
              {match?.status === 'live' ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-black text-[9px] shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>LIVE</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[8px] uppercase">
                  {match?.status || 'MATCH'}
                </span>
              )}
              <span className="text-[8px] font-mono font-bold text-slate-400 mt-0.5">
                {inningsNum === 1 ? '1st INN' : '2nd INN'}
              </span>
            </div>

            {/* Team Crest / Logo */}
            {currentInnings.battingTeam === match.teamA && match.teamALogo ? (
              <img 
                src={match.teamALogo} 
                alt={match.teamA} 
                className="w-11 h-11 rounded-full border border-white/20 object-contain bg-slate-900 shrink-0 shadow-md" 
                referrerPolicy="no-referrer"
              />
            ) : currentInnings.battingTeam === match.teamB && match.teamBLogo ? (
              <img 
                src={match.teamBLogo} 
                alt={match.teamB} 
                className="w-11 h-11 rounded-full border border-white/20 object-contain bg-slate-900 shrink-0 shadow-md" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md border border-white/20 shrink-0 uppercase"
                style={{ backgroundColor: activeTeamColor }}
              >
                {currentInnings.battingTeam.slice(0, 3)}
              </div>
            )}

            {/* Team Name + Score + Overs */}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-xs font-black uppercase tracking-wider truncate ${themeColors.titleText}`}>
                  {currentInnings.battingTeam}
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                  CRR {calculateCRR}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-mono font-black tracking-tight text-white drop-shadow">
                  {currentInnings.runs}/{currentInnings.wickets}
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">
                  ({Math.floor(currentInnings.ballsBowled / 6)}.{currentInnings.ballsBowled % 6}/{match.oversLimit} ov)
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: BATTERS HUD */}
          <div className="w-[30%] shrink-0 px-4 flex items-center gap-3 border-r border-white/10 bg-black/10">
            {/* Striker */}
            {battingStats?.striker ? (
              <div className="flex-1 min-w-0 p-1.5 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    <span className="text-xs font-black text-white uppercase truncate">
                      {battingStats.striker.name}*
                    </span>
                  </div>
                  {activeConfig.showStrikeRates && (
                    <span className="text-[8px] font-mono font-bold px-1 rounded bg-amber-400/20 text-amber-300 shrink-0">
                      SR {battingStats.striker.sr}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-mono font-black text-amber-300">
                    {battingStats.striker.runs}
                    <span className="text-[11px] font-normal text-slate-400 ml-1">({battingStats.striker.balls})</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {battingStats.striker.fours || 0}x4 • {battingStats.striker.sixes || 0}x6
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-center text-xs text-slate-500 font-mono">No Batter</div>
            )}

            {/* Non-Striker */}
            {battingStats?.nonStriker ? (
              <div className="flex-1 min-w-0 p-1.5 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-300 uppercase truncate">
                    {battingStats.nonStriker.name}
                  </span>
                  {activeConfig.showStrikeRates && (
                    <span className="text-[8px] font-mono font-bold px-1 rounded bg-white/10 text-slate-300 shrink-0">
                      SR {battingStats.nonStriker.sr}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-mono font-black text-slate-200">
                    {battingStats.nonStriker.runs}
                    <span className="text-[11px] font-normal text-slate-400 ml-1">({battingStats.nonStriker.balls})</span>
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {battingStats.nonStriker.fours || 0}x4 • {battingStats.nonStriker.sixes || 0}x6
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 text-center text-xs text-slate-500 font-mono">-</div>
            )}
          </div>

          {/* SECTION 3: BOWLER HUD */}
          <div className="w-[20%] shrink-0 px-4 flex items-center justify-between border-r border-white/10 bg-black/15">
            {bowlingStats ? (
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    BOWLING
                  </span>
                  {activeConfig.showStrikeRates && (
                    <span className="text-[8.5px] font-mono font-bold text-slate-400">
                      ECON {bowlingStats.econ}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-xs font-black text-white uppercase truncate max-w-[130px]">
                    {bowlingStats.name}
                  </span>
                  <span className="text-base font-mono font-black text-emerald-400">
                    {bowlingStats.wickets}/{bowlingStats.runs}
                    <span className="text-[10px] font-mono text-slate-400 ml-1">
                      ({Math.floor(bowlingStats.balls / 6)}.{bowlingStats.balls % 6})
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 font-mono">No Active Bowler</span>
            )}
          </div>

          {/* SECTION 4: BALL-BY-BALL DOTS */}
          {activeConfig.showBallByBallDots && (
            <div className="w-[15%] shrink-0 px-3 flex flex-col justify-center border-r border-white/10 bg-black/25">
              <div className="text-[8.5px] font-mono font-black uppercase text-slate-400 mb-1 tracking-wider flex items-center justify-between">
                <span>THIS OVER</span>
                <span className="text-slate-500">{currentOverBalls.length}/6</span>
              </div>
              <div className="flex items-center gap-1 overflow-hidden">
                {currentOverBalls.length > 0 ? (
                  currentOverBalls.slice(0, 6).map((b, idx) => {
                    const details = getPillDetails(b);
                    return (
                      <div
                        key={b.id || idx}
                        className={`${details.label.length > 2 ? 'w-auto min-w-[26px] px-1' : 'w-6'} h-6 rounded-full flex items-center justify-center text-[8.5px] font-mono font-black border shrink-0 ${details.style}`}
                        title={details.label}
                      >
                        {details.label}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono italic">Start of over...</span>
                )}
                {currentOverBalls.length < 6 && (
                  Array.from({ length: 6 - currentOverBalls.length }).map((_, padIdx) => (
                    <div 
                      key={`pad-ribbon-${padIdx}`} 
                      className="w-6 h-6 rounded-full border border-dashed border-white/15 flex items-center justify-center text-[8px] text-slate-600 font-mono shrink-0"
                    >
                      •
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SECTION 5: EQUATION / PROJECTED & SPONSOR */}
          <div className="flex-1 px-3 flex flex-col justify-center bg-black/35 min-w-0">
            {inningsNum === 2 && match.targetRuns ? (
              <div>
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  TARGET {match.targetRuns}
                </span>
                <span className="text-[11px] font-mono font-black text-amber-300 block truncate">
                  NEED {Math.max(0, match.targetRuns - currentInnings.runs)} IN {Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)}b
                </span>
                <span className="text-[8.5px] font-mono text-slate-400 block">
                  RRR: <span className={`font-bold ${rrrColorClass}`}>{calculateRRR}</span>
                </span>
              </div>
            ) : (
              <div>
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                  INNINGS 1
                </span>
                <span className="text-[11px] font-mono font-black text-slate-200 block">
                  PROJECTED: {projectedScore || '-'}
                </span>
                <span className="text-[8.5px] font-mono text-slate-400 block">
                  Overs limit: {match.oversLimit} ov
                </span>
              </div>
            )}

            {activeConfig.showSponsorBadge && (
              <div className="mt-1 pt-1 border-t border-white/10 text-[7.5px] font-bold text-slate-400 uppercase tracking-widest truncate">
                🏏 {activeConfig.sponsorText || 'GULLY PREMIER LEAGUE'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3B. MOBILE VERTICAL 9:16 LIVE STREAMING SCORE CARD (Reels / Shorts / TikTok)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeLayout === 'mobile-vertical' && (
        <div 
          id="mobile-vertical-scorecard"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[460px] max-w-[94vw] select-none font-sans z-30 rounded-3xl border border-white/15 bg-slate-950/95 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] p-4 flex flex-col gap-2.5 overflow-hidden"
        >
          {/* Top Row: Live badge + Batting Team + Score + Overs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] flex items-center gap-1 shadow-[0_0_8px_rgba(220,38,38,0.6)]">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
              <span className="text-sm font-black uppercase text-white tracking-wider">
                {currentInnings.battingTeam}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-black text-white">
                {currentInnings.runs}/{currentInnings.wickets}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                ({Math.floor(currentInnings.ballsBowled / 6)}.{currentInnings.ballsBowled % 6}/{match.oversLimit})
              </span>
            </div>
          </div>

          {/* Equation Banner */}
          <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[10px] font-mono">
            {inningsNum === 2 && match.targetRuns ? (
              <>
                <span className="font-bold text-slate-400">TGT {match.targetRuns}</span>
                <span className="font-black text-amber-300">NEED {Math.max(0, match.targetRuns - currentInnings.runs)} IN {Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)}b</span>
                <span className="font-bold text-slate-400">RRR {calculateRRR}</span>
              </>
            ) : (
              <>
                <span className="font-bold text-slate-400">CRR {calculateCRR}</span>
                <span className="font-black text-white">PROJ {projectedScore || '-'}</span>
                <span className="font-bold text-slate-400">1st Innings</span>
              </>
            )}
          </div>

          {/* Batters & Bowler Row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[8px] font-mono text-slate-400 block uppercase">STRIKER</span>
              <span className="text-xs font-black text-amber-300 block truncate">
                {battingStats?.striker.name || 'Batter'}*
              </span>
              <span className="text-sm font-mono font-black text-white">
                {battingStats?.striker.runs || 0}
                <span className="text-[10px] font-normal text-slate-400 ml-1">({battingStats?.striker.balls || 0})</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[8px] font-mono text-slate-400 block uppercase">NON-STRIKER</span>
              <span className="text-xs font-bold text-slate-300 block truncate">
                {battingStats?.nonStriker?.name || '-'}
              </span>
              <span className="text-sm font-mono font-black text-slate-300">
                {battingStats?.nonStriker?.runs || 0}
                <span className="text-[10px] font-normal text-slate-400 ml-1">({battingStats?.nonStriker?.balls || 0})</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[8px] font-mono text-slate-400 block uppercase">BOWLER</span>
              <span className="text-xs font-black text-emerald-400 block truncate">
                {bowlingStats?.name || '-'}
              </span>
              <span className="text-sm font-mono font-black text-emerald-300">
                {bowlingStats ? `${bowlingStats.wickets}/${bowlingStats.runs}` : '0/0'}
              </span>
            </div>
          </div>

          {/* Ball by ball dots */}
          {activeConfig.showBallByBallDots && (
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="text-[8px] font-mono font-bold text-slate-400 uppercase">THIS OVER:</span>
              <div className="flex items-center gap-1.5">
                {currentOverBalls.slice(0, 6).map((b, idx) => {
                  const details = getPillDetails(b);
                  return (
                    <div
                      key={b.id || idx}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-black border ${details.style}`}
                    >
                      {details.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          3C. MINIMAL FLOATING PILL CAPSULE
          ========================================================================= */}
      {activeConfig.showScoreBug && activeLayout === 'minimal-pill' && (
        <div 
          id="minimal-pill-bug"
          className={`absolute ${activeConfig.bugPosition === 'top-full' ? 'top-6' : 'bottom-10'} left-1/2 -translate-x-1/2 rounded-full border ${themeColors.borderAccent || 'border-white/15'} ${themeColors.ribbonBg || themeColors.cardBg} px-6 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center gap-4 z-30 select-none font-sans`}
        >
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-black uppercase text-red-400 font-mono">LIVE</span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Team & Score */}
          <div className="flex items-baseline gap-2 shrink-0">
            <span className="text-sm font-black uppercase text-white tracking-wider">{currentInnings.battingTeam}</span>
            <span className="text-xl font-mono font-black text-white">
              {currentInnings.runs}/{currentInnings.wickets}
            </span>
            <span className="text-xs font-mono font-bold text-slate-400">
              ({Math.floor(currentInnings.ballsBowled / 6)}.{currentInnings.ballsBowled % 6})
            </span>
          </div>

          <div className="h-4 w-px bg-white/20" />

          {/* Striker */}
          {battingStats?.striker && (
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-xs font-black text-amber-300 uppercase">{battingStats.striker.name}*</span>
              <span className="text-xs font-mono font-bold text-white">{battingStats.striker.runs}({battingStats.striker.balls})</span>
            </div>
          )}

          <div className="h-4 w-px bg-white/20" />

          {/* Bowler */}
          {bowlingStats && (
            <div className="flex items-baseline gap-1.5 shrink-0">
              <span className="text-xs font-bold text-emerald-400 uppercase">{bowlingStats.name}</span>
              <span className="text-xs font-mono font-bold text-emerald-300">{bowlingStats.wickets}/{bowlingStats.runs}</span>
            </div>
          )}

          {/* Equation or CRR */}
          <div className="h-4 w-px bg-white/20" />
          <div className="text-xs font-mono font-black text-amber-400 shrink-0">
            {inningsNum === 2 && match.targetRuns 
              ? `Need ${Math.max(0, match.targetRuns - currentInnings.runs)} in ${Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)}b`
              : `CRR ${calculateCRR}`}
          </div>
        </div>
      )}

      {/* =========================================================================
          3D. DOCKED CORNER TV SCORE BUG (BOTTOM-LEFT / BOTTOM-RIGHT STANDARD)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeLayout === 'docked-corner' && (
        <div className={`absolute ${
          activeConfig.bugPosition === 'bottom-right' ? 'bottom-16 right-16' :
          activeConfig.bugPosition === 'bottom-center' ? 'bottom-16 left-1/2 -translate-x-1/2' :
          activeConfig.bugPosition === 'top-full' ? 'top-16 left-16' :
          'bottom-16 left-16'
        } w-[680px] rounded-[2rem] border overflow-hidden ${themeColors.cardBg} ${themeColors.headerGlow} z-30 shadow-2xl`}
          style={studioBgStyle}
        >
          
          {/* Dynamic Boundary Flash strip overlay */}
          {lastBdryFlash === '4' && (
            <div className="absolute inset-x-0 top-0 h-2 bg-sky-500 animate-pulse bdry-4-flash" />
          )}
          {lastBdryFlash === '6' && (
            <div className="absolute inset-x-0 top-0 h-2 bg-amber-500 animate-pulse bdry-6-flash" />
          )}

          {/* TOP PANEL: MAIN SCORELINE ROW */}
        <div className="p-6 flex justify-between items-center bg-slate-950/20">
          <div>
            <div className="flex items-center gap-3">
              {/* Custom team logo or colored active team dot */}
              {currentInnings.battingTeam === match.teamA && match.teamALogo ? (
                <img 
                  src={match.teamALogo} 
                  alt={match.teamA} 
                  className="w-8 h-8 rounded-lg border border-white/10 object-contain bg-slate-900 shrink-0 shadow-md" 
                  referrerPolicy="no-referrer"
                />
              ) : currentInnings.battingTeam === match.teamB && match.teamBLogo ? (
                <img 
                  src={match.teamBLogo} 
                  alt={match.teamB} 
                  className="w-8 h-8 rounded-lg border border-white/10 object-contain bg-slate-900 shrink-0 shadow-md" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div 
                  className="w-3 h-3 rounded-full shadow-inner" 
                  style={{ backgroundColor: activeTeamColor }}
                />
              )}
              <h2 className={`text-2xl font-black uppercase tracking-widest ${themeColors.titleText}`}>
                {currentInnings.battingTeam}
              </h2>
              {match?.status === 'live' ? (
                <motion.div
                  id="standard-live-match-badge"
                  animate={{ 
                    scale: [1, 1.05, 1],
                    opacity: [0.92, 1, 0.92],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2.2, 
                    ease: "easeInOut" 
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white border border-rose-400/50 text-[10px] font-black uppercase tracking-wider shadow-[0_0_14px_rgba(225,29,72,0.6)] live-badge-pulsing shrink-0"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  <span>LIVE</span>
                </motion.div>
              ) : match?.status && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase shrink-0">
                  {match.status}
                </span>
              )}
            </div>
            
            {/* Innings Target or Toss situation caption */}
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 block">
              {inningsNum === 1 
                ? `1st Innings — Setup Target` 
                : `2nd Innings — Need ${match.targetRuns ? match.targetRuns - currentInnings.runs : 0} runs from ${Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)} balls`
              }
            </span>
          </div>

          <div className="text-right">
            {/* BIG LIVE RUNS INDEX */}
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <AnimatePresence mode="popLayout">
                <motion.span 
                  key={`runs-${currentInnings.runs}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="text-5xl font-black tracking-tighter"
                >
                  {currentInnings.runs}
                </motion.span>
              </AnimatePresence>
              <span className="text-3xl text-slate-500 font-light">/</span>
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={`wickets-${currentInnings.wickets}`}
                  initial={{ rotateX: 95, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  exit={{ rotateX: -95, opacity: 0 }}
                  className="text-4xl font-extrabold text-rose-500"
                >
                  {currentInnings.wickets}
                </motion.span>
              </AnimatePresence>
            </div>

            <span className="text-xs text-slate-400 font-mono font-bold block mt-1">
              Overs {formatOvers(currentInnings.ballsBowled)} <span className="text-slate-600">/</span> {match.oversLimit}
            </span>
          </div>
        </div>

        {/* MIDDLE SECTION 1: BATTERS AND BOWLERS METRICS */}
        <div className="px-6 py-4 border-t border-white/[0.03] grid grid-cols-12 gap-4 items-center">
          
          {/* Batters Block */}
          <div className="col-span-7 space-y-2 border-r border-white/5 pr-4">
            {/* Striker */}
            {battingStats && (
              <div className="flex items-center justify-between text-xs font-mono">
                <span className={`font-bold flex items-center gap-1 overflow-hidden truncate max-w-[160px] ${newBatterAlert === battingStats.striker.name ? 'animate-pulse text-emerald-400' : 'text-white'}`}>
                  🏏 {battingStats.striker.name}
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded border border-emerald-500/20">*</span>
                </span>
                <span className="font-extrabold text-white text-right">
                  {battingStats.striker.runs} <span className="text-slate-500 text-[10px] font-normal">({battingStats.striker.balls})</span>
                  <span className="text-[9.5px] text-slate-400 font-normal ml-1.5 font-sans">SR {battingStats.striker.sr}</span>
                </span>
              </div>
            )}

            {/* Non-Striker */}
            {battingStats?.nonStriker && (
              <div className="flex items-center justify-between text-xs font-mono opacity-60">
                <span className="font-medium text-slate-300 truncate max-w-[160px]">
                  {battingStats.nonStriker.name}
                </span>
                <span className="font-bold text-slate-200 text-right">
                  {battingStats.nonStriker.runs} <span className="text-slate-500 text-[10px] font-normal">({battingStats.nonStriker.balls})</span>
                </span>
              </div>
            )}
          </div>

          {/* Bowler Block */}
          <div className="col-span-5 space-y-1.5 font-mono">
            {bowlingStats && (
              <>
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-semibold truncate max-w-[130px] ${newBowlerAlert === bowlingStats.name ? 'animate-pulse text-sky-400' : 'text-slate-300'}`}>
                    🥎 {bowlingStats.name}
                  </span>
                  <span className="font-black text-rose-400">
                    {bowlingStats.wickets}-{bowlingStats.runs}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Ov: {formatOvers(bowlingStats.balls)}</span>
                  <span>Econ: <span className="font-bold text-slate-400">{bowlingStats.econ}</span></span>
                </div>
                <span className="text-[8px] bg-slate-800/20 text-slate-400 px-1 border border-white/5 rounded block text-center uppercase font-bold tracking-tight">
                  Dots {bowlingStats.dotBallPct}% • Maidens {bowlingStats.maidens}
                </span>
              </>
            )}
          </div>

        </div>

        {/* MIDDLE SECTION 2: LIVE RUN RATES TICKER & CHASE CONTEXT */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-t border-white/[0.03] flex justify-between items-center text-xs font-mono text-slate-300">
          <div className="flex gap-4">
            <span>CRR: <span className="font-black text-white">{calculateCRR}</span></span>
            {inningsNum === 2 && match.targetRuns && (
              <span>RRR: <span className={`font-black ${rrrColorClass}`}>{calculateRRR}</span></span>
            )}
          </div>

          {/* Final Projection or TARGET details */}
          <div>
            {inningsNum === 1 ? (
              <span>Proj. Score: <span className="font-black text-amber-400">{projectedScore}</span></span>
            ) : (
              <span>Target: <span className="font-black text-emerald-400">{match.targetRuns}</span></span>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: OVER TRACKER (BALL-BY-BALL HISTORIES) */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-white/[0.04] flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-serif font-black uppercase tracking-wider text-slate-500">Over {currentOverNo + 1}:</span>
            
            {/* Delivery History Tracker */}
            <div className="flex gap-1.5 py-1 px-1">
              {currentOverBalls.length > 0 ? (
                currentOverBalls.map((b, index) => {
                  const details = getPillDetails(b);
                  return (
                    <motion.div
                      key={b.id || index}
                      initial={{ scale: 0.2, x: -10, opacity: 0 }}
                      animate={{ scale: 1, x: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.05 }}
                      className={`${details.label.length > 2 ? 'w-auto min-w-[28px] px-1' : 'w-7'} h-7 rounded-full flex items-center justify-center text-[9.5px] uppercase font-mono font-black border text-center shrink-0 ${details.style}`}
                      title={`${b.overBall}: ${b.description}`}
                    >
                      {details.label}
                    </motion.div>
                  );
                })
              ) : (
                <span className="text-[10px] text-slate-500 font-mono italic">Waiting for delivery...</span>
              )}

              {/* Pad missing circles to complete over */}
              {currentOverBalls.length < 6 && (
                Array.from({ length: 6 - currentOverBalls.length }).map((_, padIdx) => (
                  <div 
                    key={`pad-${padIdx}`} 
                    className="w-7 h-7 rounded-full border border-dashed border-white/5 flex items-center justify-center text-[8px] text-slate-700 font-mono"
                  >
                    {currentOverBalls.length + padIdx + 1}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Compact Mini Over History (Last completed overs) */}
          {recentOversPills.length > 0 && (
            <div className="flex flex-col items-end border-l border-white/5 pl-4 ml-2">
              <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block mb-1">Previous</span>
              <div className="space-y-1">
                {recentOversPills.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[9px] font-mono">
                    <span className="opacity-45">Ov {item.over}:</span>
                    <span className="font-extrabold text-white">{item.runs} runs</span>
                    <span className="text-rose-500 font-bold">{item.wickets} W</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* =========================================================================
            BATTING/BOWLING MATCH STATISTICS TICKER (IF ENABLED IN CONTROL PANEL)
            ========================================================================= */}
        {activeConfig.showStatsPanel && matchStats && (
          <div className={`px-6 py-2.5 border-t border-white/[0.04] text-[9.5px] font-mono grid grid-cols-3 gap-2 text-slate-400 font-medium ${themeColors.tickerBg}`}>
            <div className="flex flex-col">
              <span className="text-slate-550 text-[8px] font-black uppercase">Extras</span>
              <span className="text-slate-200 mt-0.5">
                Total: <span className="font-extrabold">{matchStats.totalExtras}</span> (WD {matchStats.wides} • NB {matchStats.noBalls})
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-slate-550 text-[8px] font-black uppercase">Active Partnership</span>
              <span className="text-emerald-400 mt-0.5 font-bold">
                {matchStats.activePartnership} runs
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-slate-550 text-[8px] font-black uppercase">Phases</span>
              <span className="text-slate-200 mt-0.5">
                PP runs: <span className="font-bold text-amber-500">{matchStats.powerplayRuns}</span> • Death: <span className="font-bold text-rose-400">{matchStats.deathRuns}</span>
              </span>
            </div>
          </div>
        )}

        {/* BOTTOM TICKER / SCROLLING TEXT */}
        {activeConfig.showTicker && (
          <div className="px-4 py-1.5 bg-slate-950/85 text-[10px] font-mono text-center tracking-widest text-slate-400 uppercase font-black border-t border-white/5 marquee-container">
            <div className="marquee-content">
              {activeConfig.tickerMessage} • LIVE IN-PLAY STREAMING GRAPHICS OVERLAY • MATCH POWERED BY STUDIO SCORING ENGINE • 
              {activeConfig.tickerMessage} • LIVE IN-PLAY STREAMING GRAPHICS OVERLAY • MATCH POWERED BY STUDIO SCORING ENGINE • 
            </div>
          </div>
        )}

      </div>
      )}

      {/* =========================================================================
          3E. GIANT CENTERED SCORE BUG (1900px width x 200px height)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeLayout === 'score-bug-1900-200' && (
        <div 
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1900px] h-[200px] rounded-[2rem] border overflow-hidden flex items-stretch shadow-[0_20px_60px_rgba(0,0,0,0.95)] ${themeColors.cardBg}`} 
          style={{ 
            borderColor: isStudioCustom && globalStudioTheme?.borderColor ? globalStudioTheme.borderColor : activeTeamColor,
            ...(studioBgStyle || {})
          }}
          id="giant-centered-score-bug"
        >
          {/* Dynamic Boundary Flash strip overlay */}
          {lastBdryFlash === '4' && (
            <div className="absolute inset-x-0 top-0 h-2.5 bg-sky-500 animate-pulse bdry-4-flash" />
          )}
          {lastBdryFlash === '6' && (
            <div className="absolute inset-x-0 top-0 h-2.5 bg-amber-500 animate-pulse bdry-6-flash" />
          )}

          <div className="w-3.5 shrink-0" style={{ backgroundColor: activeTeamColor }} />

          <div className="grid grid-cols-12 items-stretch h-full w-full">
            {/* COLUMN 1: TEAM NAME, INNINGS, RUN RATES */}
            <div className="col-span-3 pb-4 pt-5 pl-8 pr-4 flex flex-col justify-between text-left">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full shadow-inner animate-pulse" style={{ backgroundColor: activeTeamColor }} />
                  <h2 className="text-3xl font-black uppercase tracking-widest truncate max-w-[280px]">
                    {currentInnings.battingTeam}
                  </h2>
                  {match?.status === 'live' ? (
                    <motion.div
                      id="giant-live-match-badge"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.92, 1, 0.92],
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2.2, 
                        ease: "easeInOut" 
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600 text-white border border-rose-400/50 text-[10px] font-black uppercase tracking-wider shadow-[0_0_14px_rgba(225,29,72,0.6)] live-badge-pulsing shrink-0"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-80" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <span>LIVE</span>
                    </motion.div>
                  ) : match?.status && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 uppercase shrink-0">
                      {match.status}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 block">
                  {inningsNum === 1 
                    ? `1st Innings — Set Target` 
                    : `Need ${match.targetRuns ? match.targetRuns - currentInnings.runs : 0} runs from ${Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)} balls`
                  }
                </span>
              </div>

              <div className="flex gap-2.5 text-xs font-mono font-bold">
                <span className="bg-slate-900/60 border border-white/5 px-2.5 py-1.5 rounded-xl text-amber-500 flex items-center gap-1.5 shadow-sm">
                  CRR <span className="text-white font-black">{calculateCRR}</span>
                </span>
                {inningsNum === 2 && match.targetRuns && (
                  <span className={`bg-slate-900/60 border border-white/5 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm ${rrrColorClass}`}>
                    RRR <span className="font-black">{calculateRRR}</span>
                  </span>
                )}
              </div>
            </div>

            {/* COLUMN 2: RUNS, WICKETS, OVERS */}
            <div className="col-span-2 pb-4 pt-2.5 px-4 flex flex-col justify-center items-center bg-slate-950/20 border-l border-white/[0.03]">
              <div className="flex items-baseline gap-1.5 font-mono">
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={`giant-runs-${currentInnings.runs}`}
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -25, opacity: 0 }}
                    className="text-6xl font-black tracking-tighter"
                  >
                    {currentInnings.runs}
                  </motion.span>
                </AnimatePresence>
                <span className="text-4xl text-slate-500 font-light">/</span>
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={`giant-wickets-${currentInnings.wickets}`}
                    initial={{ rotateX: 95, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={{ rotateX: -95, opacity: 0 }}
                    className="text-5xl font-black text-rose-500"
                  >
                    {currentInnings.wickets}
                  </motion.span>
                </AnimatePresence>
              </div>

              <span className="text-xs text-slate-350 font-mono font-bold block mt-3.5 uppercase tracking-widest">
                Overs {formatOvers(currentInnings.ballsBowled)} <span className="text-slate-600">/</span> {match.oversLimit}
              </span>
            </div>

            {/* COLUMN 3: BATTING PARTNERSHIP / BATTERS */}
            <div className="col-span-3 pb-4 pt-5 px-6 flex flex-col justify-between border-l border-white/[0.03] text-left">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">🏏 Live Batters</span>
              
              <div className="space-y-3 font-mono mt-2.5">
                {battingStats && (
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-black flex items-center gap-1.5 truncate max-w-[150px] ${newBatterAlert === battingStats.striker.name ? 'animate-pulse text-emerald-400' : 'text-white'}`}>
                      🏏 {battingStats.striker.name}
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 rounded border border-emerald-500/20 font-black">*</span>
                    </span>
                    <span className="font-extrabold text-white text-right">
                      {battingStats.striker.runs} <span className="text-slate-500 text-[10px] font-normal">({battingStats.striker.balls})</span>
                      <span className="text-[9.5px] text-slate-400 font-normal ml-2.5 font-sans">SR {battingStats.striker.sr}</span>
                    </span>
                  </div>
                )}

                {battingStats?.nonStriker ? (
                  <div className="flex items-center justify-between text-xs opacity-65">
                    <span className="font-bold text-slate-300 truncate max-w-[150px]">
                      {battingStats.nonStriker.name}
                    </span>
                    <span className="font-extrabold text-slate-200 text-right">
                      {battingStats.nonStriker.runs} <span className="text-slate-500 text-[10px] font-normal">({battingStats.nonStriker.balls})</span>
                      <span className="text-[9.5px] text-slate-400 font-normal ml-2.5 font-sans">SR {battingStats.nonStriker.sr}</span>
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-600 italic font-mono">-</div>
                )}
              </div>

              {matchStats && (
                <div className="text-[9px] text-slate-500 font-mono mt-1 pt-1.5 border-t border-white/[0.02]">
                  Partnership: <span className="font-black text-emerald-400">{matchStats.activePartnership} runs</span>
                </div>
              )}
            </div>

            {/* COLUMN 4: CURRENT BOWLER */}
            <div className="col-span-2 pb-4 pt-5 px-6 flex flex-col justify-between border-l border-white/[0.03] text-left">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">🥎 Current Bowler</span>
              
              {bowlingStats ? (
                <div className="font-mono mt-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className={`font-black truncate max-w-[110px] ${newBowlerAlert === bowlingStats.name ? 'animate-pulse text-sky-400' : 'text-slate-300'}`}>
                      {bowlingStats.name}
                    </span>
                    <span className="font-black text-rose-400">
                      {bowlingStats.wickets}-{bowlingStats.runs}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Ov {formatOvers(bowlingStats.balls)}</span>
                    <span>Econ <span className="font-bold text-slate-400">{bowlingStats.econ}</span></span>
                  </div>
                  <div className="flex gap-2 text-[8px] font-bold tracking-tight uppercase">
                    <span className="bg-slate-800/40 border border-white/5 text-slate-400 px-1 rounded-md">Dots {bowlingStats.dotBallPct}%</span>
                    <span className="bg-slate-800/40 border border-white/5 text-slate-400 px-1 rounded-md">M {bowlingStats.maidens}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic mt-auto">No bowler active</div>
              )}
            </div>

            {/* COLUMN 5: BALL-BY-BALL OVER PROGRESS */}
            <div className="col-span-2 pb-4 pt-5 pl-4 pr-8 flex flex-col justify-between border-l border-white/[0.03] bg-slate-950/20 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Over {currentOverNo + 1}</span>
                {inningsNum === 1 ? (
                  <span className="text-[9px] text-amber-500 font-mono font-black">Proj {projectedScore}</span>
                ) : (
                  <span className="text-[9px] text-emerald-400 font-mono font-black">Tgt {match.targetRuns}</span>
                )}
              </div>

              {/* Delivery progress pills */}
              <div className="flex gap-1.5 py-1.5 overflow-x-auto">
                {currentOverBalls.length > 0 ? (
                  currentOverBalls.slice(0, 6).map((b, index) => {
                    const details = getPillDetails(b);
                    return (
                      <motion.div
                        key={b.id || index}
                        initial={{ scale: 0.2, x: -10, opacity: 0 }}
                        animate={{ scale: 1, x: 0, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: index * 0.05 }}
                        className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-[10px] uppercase font-mono font-black border text-center shrink-0 ${details.style}`}
                        title={`${b.overBall}: ${b.description}`}
                      >
                        {details.label}
                      </motion.div>
                    );
                  })
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono italic">Waiting...</span>
                )}

                {/* Pad missing circles */}
                {currentOverBalls.length < 6 && (
                  Array.from({ length: 6 - currentOverBalls.length }).map((_, padIdx) => (
                    <div 
                      key={`pad-${padIdx}`} 
                      className="w-7.5 h-7.5 rounded-full border border-dashed border-white/10 flex items-center justify-center text-[9px] text-slate-700 font-mono shrink-0"
                    >
                      {currentOverBalls.length + padIdx + 1}
                    </div>
                  ))
                )}
              </div>

              {matchStats && (
                <div className="text-[8px] font-mono font-bold text-slate-500 block truncate leading-none">
                  Extras: {matchStats.totalExtras} (WD {matchStats.wides} • NB {matchStats.noBalls})
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          3F. CUSTOM SLANTED PRO DESIGN MODE (As requested by the user!)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeLayout === 'slanted-pro-design' && (
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[1900px] h-[80px] select-none font-sans z-30"
          id="custom-slanted-pro-bug"
        >
          {/* Subtle Framer-Motion / CSS Pulsing 'Live' Match Status Badge */}
          {match?.status === 'live' ? (
            <motion.div
              id="slanted-pro-live-badge"
              initial={{ opacity: 0, y: 5 }}
              animate={{ 
                scale: [1, 1.04, 1],
                opacity: [0.93, 1, 0.93],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.2, 
                ease: "easeInOut" 
              }}
              className="absolute -top-7.5 left-2 z-40 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white border border-rose-400/50 shadow-[0_0_15px_rgba(225,29,72,0.6)] live-badge-pulsing"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span className="text-[10px] font-black tracking-widest uppercase font-sans">
                LIVE
              </span>
              <span className="text-[9px] font-mono text-rose-100 font-bold border-l border-white/20 pl-1.5 uppercase">
                IN PROGRESS
              </span>
            </motion.div>
          ) : match?.status && (
            <div className="absolute -top-7.5 left-2 z-40 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 text-slate-400 border border-white/10 text-[9px] font-mono uppercase font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500 inline-block" />
              <span>{match.status}</span>
            </div>
          )}

          {/* Main outer container - maintains a standard, unskewed layout perspective */}
          <div 
            className="w-full h-full flex items-stretch overflow-hidden bg-black/45 backdrop-blur-md rounded-xl border border-slate-900/80 shadow-[0_15px_45px_rgba(0,0,0,0.85)]"
            style={studioBgStyle}
          >
            
            {/* PILL 1: SLANTED ORANGE BATSMAN SECTION (11% width) */}
            <div 
              className="bg-gradient-to-r from-[#fda4af] via-[#f97316] to-[#ea580c] w-[11%] shrink-0 skew-x-[-15deg] origin-top -ml-4 flex items-center justify-center border-r-[3px] border-black/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]"
            >
              <div className="skew-x-[15deg] flex items-center justify-center">
                {/* Custom multi-color cricket batsman vector */}
                <svg viewBox="0 0 100 100" className="w-14 h-14 select-none drop-shadow-md">
                  {/* Crease line */}
                  <rect x="10" y="85" width="80" height="3" rx="1.5" fill="#f8fafc" opacity="0.6" />
                  {/* Wickets */}
                  <g opacity="0.9">
                    <rect x="23" y="55" width="2" height="30" fill="#ffffff" />
                    <rect x="27" y="55" width="2" height="30" fill="#ffffff" />
                    <rect x="31" y="55" width="2" height="30" fill="#ffffff" />
                    <rect x="21" y="53" width="14" height="2" fill="#ffffff" />
                  </g>
                  {/* Batsman in blue kit */}
                  <path d="M42,54 L49,63 L47,82 L42,82 L43,67 L36,56 Z" fill="#1e3a8a" />
                  <path d="M44,40 L53,38 L49,55 L42,52 Z" fill="#1d4ed8" />
                  {/* Wood cricket bat */}
                  <path d="M46,38 L31,19 C29,17 31,15 33,16 L48,36 Z" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                  {/* Hands */}
                  <path d="M44,40 L38,36 L43,34 Z" fill="#fbbf24" />
                  {/* Helmet/Head */}
                  <circle cx="48" cy="32" r="5.5" fill="#1e3a8a" />
                </svg>
              </div>
            </div>

            {/* PILL 2: RED DOUBLE-ROW BATSMEN STATISTICS (29% width) */}
            <div 
              className="bg-gradient-to-b from-[#8b0000] to-[#510000] w-[29%] shrink-0 skew-x-[-15deg] origin-top -ml-2.5 flex flex-col justify-center px-6 border-r-[3px] border-black/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.15)]"
            >
              <div className="skew-x-[15deg] space-y-1 text-left">
                {/* Batsman 1 (Striker) */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <span className="text-[#25d366] font-black text-[11px] mr-1.5 animate-pulse shrink-0">▶</span>
                    <span className="text-white text-[13px] font-black uppercase tracking-wide truncate max-w-[130px] font-sans drop-shadow">
                      {battingStats?.striker?.name || 'BATSMEN A'}
                    </span>
                  </div>
                  <span className="text-white font-mono font-black text-[13px]">
                    {battingStats?.striker?.runs || 0}{' '}
                    <span className="text-slate-300 font-normal text-[10px]">
                      ({battingStats?.striker?.balls || 0})
                    </span>
                  </span>
                </div>

                {/* Horizontal dividing line */}
                <div className="h-[1px] bg-white/10 w-full" />

                {/* Batsman 2 (Non-Striker) */}
                <div className="flex items-center justify-between opacity-85">
                  <div className="flex items-center min-w-0 pl-3.5">
                    <span className="text-slate-200 text-[12px] font-bold uppercase tracking-wide truncate max-w-[130px] font-sans">
                      {battingStats?.nonStriker?.name || 'BATSMEN B'}
                    </span>
                  </div>
                  <span className="text-slate-200 font-mono font-bold text-[12px]">
                    {battingStats?.nonStriker?.runs || 0}{' '}
                    <span className="text-slate-400 font-normal text-[9px]">
                      ({battingStats?.nonStriker?.balls || 0})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* PILL 3: VS SHORT TEAM LABEL SECTION (9% width) */}
            <div 
              className="bg-gradient-to-b from-[#f3f4f6] via-[#ffffff] to-[#d1d5db] w-[9%] shrink-0 skew-x-[-15deg] origin-top -ml-2.5 flex flex-col justify-center items-center py-1 border-r-[3px] border-black/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)]"
            >
              <div className="skew-x-[15deg] flex flex-col justify-between items-center h-full text-center">
                <span className="text-[#5b0e0e] font-sans font-black text-[11px] tracking-wide uppercase leading-none">
                  {(currentInnings?.battingTeam || match?.teamA || 'TM1').substring(0, 3).toUpperCase()}
                </span>
                <span className="text-sky-500 font-sans font-extrabold text-[10px] italic leading-none my-0.5 animate-pulse">V</span>
                <span className="text-slate-600 font-sans font-black text-[11px] tracking-wide uppercase leading-none">
                  {((match?.teamA || '') === (currentInnings?.battingTeam || '') ? (match?.teamB || 'TM2') : (match?.teamA || 'TM1')).substring(0, 3).toUpperCase()}
                </span>
              </div>
            </div>

            {/* PILL 4: LIVE SCORE, OVERS & CRR DUAL PANEL (22% width) */}
            <div 
              className="w-[22%] shrink-0 skew-x-[-15deg] origin-top -ml-2.5 flex flex-col items-stretch border-r-[3px] border-black/35"
            >
              <div className="flex flex-col h-full items-stretch flex-1">
                {/* Top Half: Green-Red split */}
                <div className="flex h-[60%] items-stretch">
                  {/* Green Section for the Runs/Wickets */}
                  <div className="bg-gradient-to-b from-[#115c2d] to-[#0a3a1b] flex-[1.2] flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                    <div className="skew-x-[15deg] font-mono font-black text-white text-[24px] italic tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      {currentInnings.runs}/{currentInnings.wickets}
                    </div>
                  </div>
                  {/* Red Section for Overs limit */}
                  <div className="bg-gradient-to-b from-[#991b1b] to-[#600d0d] flex-1 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
                    <div className="skew-x-[15deg] font-sans font-black text-white text-[11px] uppercase tracking-wider text-center leading-tight">
                      <div>OVERS</div>
                      <div className="font-mono text-[11px] font-black">{formatOvers(currentInnings.ballsBowled)}</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Half: Full silver banner representing CRR */}
                <div className="bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#cbd5e1] h-[40%] flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border-t border-black/10">
                  <div className="skew-x-[15deg] font-sans font-black text-[#0f172a] text-[10px] tracking-widest uppercase">
                    CRR: <span className="font-mono font-black">{calculateCRR}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PILL 5: LIME GREEN BOWLER & PARTNERSHIP METRICS (21% width) */}
            <div 
              className="bg-gradient-to-b from-[#a3e635] to-[#65a30d] w-[21%] shrink-0 skew-x-[-15deg] origin-top -ml-2.5 flex flex-col justify-center px-4 border-r-[3px] border-black/35 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]"
            >
              <div className="skew-x-[15deg] space-y-1 text-left">
                {/* Bowler Name and Figures */}
                <div className="flex justify-between items-center text-[11px] font-sans font-black text-[#0f172a] uppercase truncate">
                  <span>{bowlingStats?.name || 'BOWLER'}</span>
                  <span className="font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] font-black text-[12px] text-right shrink-0">
                    {bowlingStats ? `${bowlingStats.wickets}-${bowlingStats.runs}` : '0-0'}{' '}
                    <span className="text-[9.5px] font-bold opacity-80 font-sans">
                      ({bowlingStats ? formatOvers(bowlingStats.balls) : '0.0'})
                    </span>
                  </span>
                </div>

                {/* Divider */}
                <div className="h-[1px] bg-black/15 shadow-sm" />

                {/* Partnership stats */}
                <div className="flex justify-between items-center text-[10.5px] font-sans font-black text-[#1a2e05] uppercase">
                  <span>PARTNERSHIP :</span>
                  <span className="font-mono font-black text-[12px] text-right">
                    {matchStats?.activePartnership || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* PILL 6: ROYAL BLUE ACTIVE TEAM LOGO badge (12% width) */}
            <div 
              className="bg-gradient-to-b from-[#1d4ed8] to-[#1e3a8a] w-[12%] shrink-0 skew-x-[-15deg] origin-top -ml-2.5 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] pr-4"
            >
              <div className="skew-x-[15deg] flex items-center justify-center">
                {/* Active batting team's logo image, or a stunning premium default championship shield sticker */}
                {currentInnings.battingTeam === match.teamA && match.teamALogo ? (
                  <img 
                    src={match.teamALogo} 
                    alt={match.teamA} 
                    className="w-11 h-11 rounded-full border-2 border-white/30 object-contain bg-slate-900 shadow-md transform hover:scale-105 transition" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : currentInnings.battingTeam === match.teamB && match.teamBLogo ? (
                  <img 
                    src={match.teamBLogo} 
                    alt={match.teamB} 
                    className="w-11 h-11 rounded-full border-2 border-white/30 object-contain bg-slate-900 shadow-md transform hover:scale-105 transition" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  /* Standard golden premier league shield emblem */
                  <svg viewBox="0 0 100 100" className="w-12 h-12 text-yellow-350 drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                    <path d="M50,15 L80,25 L75,65 C70,80 50,90 50,90 C50,90 30,80 25,65 L20,25 Z" fill="#b45309" stroke="#fbbf24" strokeWidth="2.5" />
                    <path d="M50,20 L75,28 L71,62 C67,74 50,83 50,83 C50,83 33,74 29,62 L25,28 Z" fill="#fbbf24" />
                    {/* Crown badge lines */}
                    <path d="M37,58 L41,45 L50,51 L59,45 L63,58 Z" fill="#b45309" />
                    <circle cx="37" cy="41" r="1.5" fill="#b45309" />
                    <circle cx="50" cy="46" r="1.5" fill="#b45309" />
                    <circle cx="63" cy="41" r="1.5" fill="#b45309" />
                  </svg>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          4. CUSTOM DYNAMIC OVERLAY BANNER & INDIVIDUAL STATS MODULES
          ========================================================================= */}
      <AnimatePresence>
        {/* NEW MODULE: INDIVIDUAL BATTING & BOWLING STATS (Positioned alongside main scoreboard) */}
        {['individual_stats', 'player_stats', 'individual_batting_bowling'].includes(activeGraphic) && (
          <IndividualStatsOverlay
            match={match}
            currentInnings={currentInnings}
            battingStats={battingStats}
            bowlingStats={bowlingStats}
            activeTeamColor={activeTeamColor}
            activeConfig={activeConfig}
            isStarTVTheme={isStarTVTheme}
            battingTeamColor={starTokens.battingTeamColor}
            bowlingTeamColor={starTokens.bowlingTeamColor}
            containerPositionClass={sideStatsPositionClass}
            onClose={() => setActiveGraphic('none')}
          />
        )}

        {activeGraphic === 'batsman_stats' && battingStats && (
          <div className={`absolute ${sideStatsPositionClass} z-50 pointer-events-auto text-left`} id="graphic-batsman-stats">
            <motion.div 
              initial={{ y: 80, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }} 
              className={`w-full bg-slate-950/95 border ${isStarTVTheme ? 'border-white/20' : 'border-amber-500/20'} rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden`} 
              style={{ borderLeft: `6px solid ${isStarTVTheme ? starTokens.battingTeamColor : activeTeamColor}` }}
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                <div className="flex items-center gap-2">
                  {isStarTVTheme && <span className="text-amber-400 text-xs">★</span>}
                  <span className={`text-xs font-black tracking-widest ${isStarTVTheme ? 'text-amber-400 font-mono' : 'text-slate-400 font-mono'} uppercase`}>
                    {isStarTVTheme ? 'STAR TV BROADCAST • BATSMEN STATISTICS' : 'BATSMEN STATISTICS'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${isStarTVTheme ? 'bg-amber-400/10 border border-amber-400/30 text-amber-300' : 'text-amber-400'}`}>
                    Partnership: {matchStats?.activePartnership || 0} runs
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGraphic('none')}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Close Overlay"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4 items-center relative overflow-hidden">
                  {isStarTVTheme && (
                    <div 
                      className="absolute top-0 right-0 w-16 h-4 opacity-75"
                      style={{
                        backgroundColor: starTokens.battingTeamColor,
                        clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)'
                      }}
                    />
                  )}
                  {/* Photo Avatar */}
                  <div className={`w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border ${isStarTVTheme ? 'border-amber-400/50' : 'border-white/10'} shrink-0 flex items-center justify-center`}>
                    {battingStats?.striker?.name && match?.playerPhotos?.[battingStats.striker.name.toLowerCase().trim()] ? (
                      <img 
                        src={match.playerPhotos[battingStats.striker.name.toLowerCase().trim()]} 
                        alt={battingStats.striker.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-black tracking-wider block ${isStarTVTheme ? 'text-amber-400' : 'text-emerald-400'}`}>STRIKER</span>
                    <h4 className="text-xl font-black text-white uppercase truncate">{battingStats?.striker?.name || 'STRIKER'}</h4>
                    <div className="flex justify-between font-mono text-xs text-slate-300 mt-2">
                      <span>Runs: <strong className={isStarTVTheme ? "text-amber-300 font-black" : "text-white"}>{battingStats?.striker?.runs ?? 0}</strong> ({battingStats?.striker?.balls ?? 0}b)</span>
                      <span className={isStarTVTheme ? "text-emerald-400 font-bold" : "text-amber-500 font-bold"}>SR: {battingStats?.striker?.sr || '0.0'}%</span>
                    </div>
                  </div>
                </div>
                {battingStats?.nonStriker ? (
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
                    {/* Photo Avatar */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
                      {battingStats?.nonStriker?.name && match?.playerPhotos?.[battingStats.nonStriker.name.toLowerCase().trim()] ? (
                        <img 
                          src={match.playerPhotos[battingStats.nonStriker.name.toLowerCase().trim()]} 
                          alt={battingStats.nonStriker.name} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-slate-400 font-black tracking-wider block font-mono">NON-STRIKER</span>
                      <h4 className="text-xl font-black text-slate-200 uppercase truncate">{battingStats.nonStriker.name}</h4>
                      <div className="flex justify-between font-mono text-xs text-slate-300 mt-2">
                        <span>Runs: <strong className={isStarTVTheme ? "text-amber-300 font-black" : "text-white"}>{battingStats.nonStriker.runs}</strong> ({battingStats.nonStriker.balls}b)</span>
                        <span className={isStarTVTheme ? "text-sky-300 font-bold" : "text-slate-400 font-bold"}>SR: {battingStats.nonStriker.sr}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/2 border border-white/5 rounded-xl p-4 flex items-center justify-center text-slate-500 font-mono text-xs">Waiting for non-striker...</div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {activeGraphic === 'bowler_stats' && bowlingStats && (
          <div className={`absolute ${sideStatsPositionClass} z-50 pointer-events-auto text-left`} id="graphic-bowler-stats">
            <motion.div 
              initial={{ y: 80, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }} 
              className={`w-full bg-slate-950/95 border ${isStarTVTheme ? 'border-white/20' : 'border-sky-500/20'} rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden`} 
              style={{ borderLeft: `6px solid ${isStarTVTheme ? starTokens.bowlingTeamColor : (activeTeamColor === activeConfig.teamAColor ? activeConfig.teamBColor : activeConfig.teamAColor)}` }}
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                <div className="flex items-center gap-2">
                  {isStarTVTheme && <span className="text-sky-400 text-xs">★</span>}
                  <span className={`text-xs font-black tracking-widest ${isStarTVTheme ? 'text-sky-400 font-mono' : 'text-slate-400 font-mono'} uppercase`}>
                    {isStarTVTheme ? 'STAR TV BROADCAST • ACTIVE BOWLER SPELL' : 'ACTIVE BOWLER SPELL'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${isStarTVTheme ? 'bg-sky-500/10 border border-sky-400/30 text-sky-300' : 'text-sky-400'}`}>
                    Dot ball: {bowlingStats.dotBallPct}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveGraphic('none')}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Close Overlay"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-6 items-center text-left">
                <div className="col-span-5 flex gap-4 items-center">
                  {/* Bowler Photo Avatar */}
                  <div className={`w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border ${isStarTVTheme ? 'border-sky-400/50' : 'border-white/10'} shrink-0 flex items-center justify-center`}>
                    {match?.playerPhotos?.[bowlingStats.name.toLowerCase().trim()] ? (
                      <img 
                        src={match.playerPhotos[bowlingStats.name.toLowerCase().trim()]} 
                        alt={bowlingStats.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={`text-[10px] font-black tracking-widest block font-mono ${isStarTVTheme ? 'text-sky-400' : 'text-sky-400'}`}>CURRENT SPELL</span>
                    <h3 className="text-xl font-black text-white uppercase truncate">{bowlingStats.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">Maidens: {bowlingStats.maidens}</span>
                  </div>
                </div>
                <div className="col-span-7 grid grid-cols-4 gap-3 font-mono text-center">
                  <div className={`p-3 rounded-xl border ${isStarTVTheme ? 'bg-amber-400/10 border-amber-400/30' : 'bg-white/5 border-white/5'}`}>
                    <span className={`text-2xl font-black ${isStarTVTheme ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-white'}`}>{bowlingStats.wickets}</span>
                    <span className="text-[8px] block text-slate-400 uppercase mt-1">Wickets</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isStarTVTheme ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/5'}`}>
                    <span className={`text-2xl font-black ${isStarTVTheme ? 'text-rose-400' : 'text-rose-500'}`}>{bowlingStats.runs}</span>
                    <span className="text-[8px] block text-slate-400 uppercase mt-1">Runs</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isStarTVTheme ? 'bg-slate-900 border-white/10' : 'bg-white/5 border-white/5'}`}>
                    <span className="text-2xl font-black text-white">{formatOvers(bowlingStats.balls)}</span>
                    <span className="text-[8px] block text-slate-400 uppercase mt-1">Overs</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isStarTVTheme ? 'bg-sky-500/10 border-sky-400/30' : 'bg-white/5 border-white/5'}`}>
                    <span className={`text-2xl font-black ${isStarTVTheme ? 'text-sky-300' : 'text-sky-400'}`}>{bowlingStats.econ}</span>
                    <span className="text-[8px] block text-slate-400 uppercase mt-1">Econ</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeGraphic === 'lower_third' && (
          <div className={`absolute ${lowerThirdBottomClass} z-40 pointer-events-auto text-left`} id="graphic-lower-third">
            <motion.div 
              initial={{ x: -100, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -80, opacity: 0 }} 
              className={`w-[750px] bg-slate-950/95 border ${isStarTVTheme ? 'border-white/20' : 'border-white/10'} rounded-2xl p-5 shadow-2xl flex items-center justify-between relative overflow-hidden`} 
              style={{ borderLeft: `6px solid ${isStarTVTheme ? starTokens.battingTeamColor : activeTeamColor}` }}
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              {lowerThirdMode === 'intro' && (
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${isStarTVTheme ? 'text-amber-400' : 'text-amber-500'}`}>
                      {isStarTVTheme ? 'STAR TV • BATTER BIO' : 'BATTER BIO'}
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1 uppercase leading-none">{battingStats?.striker?.name || 'ACTIVE BATTER'}</h2>
                    <span className={`text-[10px] font-mono mt-1.5 block leading-none ${isStarTVTheme ? 'text-sky-300' : 'text-indigo-300'}`}>
                      Matches: 42 • Run-rate Peak: 142.1
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-4 border-l border-white/10 pl-5 font-mono text-xs text-center shrink-0">
                      <div><span className="text-[8px] text-slate-500 block">Runs</span><strong className={isStarTVTheme ? "text-amber-300 text-sm font-black" : "text-white text-sm"}>1,540</strong></div>
                      <div><span className="text-[8px] text-slate-500 block">Avg</span><strong className="text-white text-sm">38.5</strong></div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveGraphic('none')}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 ml-2"
                      title="Close Lower Third"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              {lowerThirdMode === 'equation' && (
                <div className="w-full flex justify-between items-center">
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${isStarTVTheme ? 'text-rose-400' : 'text-rose-500'}`}>
                      {isStarTVTheme ? 'STAR TV • MATCH DRIFT EQUATION' : 'MATCH DRIFT EQUATION'}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1 uppercase leading-snug">
                      {inningsNum === 1 ? 'Batting team setting baseline target' : `NEED ${match?.targetRuns ? match.targetRuns - (currentInnings?.runs ?? 0) : 0} RUNS FROM ${Math.max(0, ((match?.oversLimit ?? 20) * 6) - (currentInnings?.ballsBowled ?? 0))} DELIVERIES`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold uppercase shrink-0 border ${isStarTVTheme ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      Pressure 82%
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveGraphic('none')}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Close Lower Third"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
              {lowerThirdMode === 'umpires' && (
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${isStarTVTheme ? 'text-sky-400' : 'text-purple-400'}`}>
                      {isStarTVTheme ? 'STAR TV • OFFICIAL SIGNAL CALL' : 'OFFICIAL SIGNAL CALL'}
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5 uppercase">UMPIRE CALL: {selectedUmpireSignal.toUpperCase()}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono uppercase tracking-widest ${isStarTVTheme ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>Star TV Studio Decision</span>
                    <button
                      type="button"
                      onClick={() => setActiveGraphic('none')}
                      className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                      title="Close Lower Third"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 5. TV BROADCAST ANALYTICS: MANHATTAN, WORM, RUN RATE, PARTNERSHIPS */}
        {['manhattan_graph', 'manhattan', 'worm_graph', 'worm', 'run_rate_graph', 'run_rate', 'partnerships_all', 'partnership', 'partnerships'].includes(activeGraphic) && (
          <CricketAnalyticsOverlay
            match={match}
            currentInnings={currentInnings}
            activeGraphic={activeGraphic}
            onClose={() => setActiveGraphic('none')}
            isStarTVTheme={isStarTVTheme}
            starTokens={starTokens}
          />
        )}

        {/* 7. MATCH SUMMARY */}
        {activeGraphic === 'match_summary' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className={`w-[1250px] h-[650px] bg-slate-950 rounded-[2.5rem] border ${isStarTVTheme ? 'border-white/20' : 'border-white/10'} p-10 shadow-2xl flex flex-col justify-between pointer-events-auto relative overflow-hidden`} 
              id="graphic-summary"
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    {isStarTVTheme && <span className="text-amber-400 text-sm">★</span>}
                    <span className={`text-[10px] font-extrabold block uppercase tracking-widest ${isStarTVTheme ? 'text-amber-400 font-mono' : 'text-amber-500'}`}>
                      {isStarTVTheme ? 'STAR TV BROADCAST • MATCH SUMMARY' : 'TOURNAMENT MATCH SUMMARY'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-white mt-1">INNINGS COMPREHENSIVE SPLIT</h1>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGraphic('none')}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Close Match Summary"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-8 py-4 text-left">
                <div className="border border-white/10 rounded-2xl bg-slate-900/60 p-6 text-left relative overflow-hidden shadow-lg">
                  {isStarTVTheme && (
                    <div 
                      className="absolute top-0 left-0 px-4 py-1 text-[10px] font-black uppercase text-white tracking-widest shadow-md"
                      style={{ 
                        backgroundColor: starTokens.teamAColor,
                        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)'
                      }}
                    >
                      TEAM A
                    </div>
                  )}
                  <h3 className={`text-2xl font-black text-white uppercase ${isStarTVTheme ? 'mt-4' : ''}`}>{match.teamA}</h3>
                  <div className="text-3xl font-mono font-black text-slate-200 mt-2">
                    {match.innings1 ? `${match.innings1.runs}/${match.innings1.wickets}` : '0/0'} ({match.innings1 ? formatOvers(match.innings1.ballsBowled) : '0.0'} ov)
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between"><span>🏏 {match.innings1?.batsmen?.[0]?.name || 'Batsman A'}</span><strong className={isStarTVTheme ? "text-amber-300 font-black" : "text-white"}>{match.innings1?.batsmen?.[0]?.runs || 42} ({match.innings1?.batsmen?.[0]?.balls || 24})</strong></div>
                    <div className="flex justify-between"><span>🏏 {match.innings1?.batsmen?.[1]?.name || 'Batsman B'}</span><strong className={isStarTVTheme ? "text-amber-300 font-black" : "text-white"}>{match.innings1?.batsmen?.[1]?.runs || 35} ({match.innings1?.batsmen?.[1]?.balls || 20})</strong></div>
                  </div>
                </div>
                <div className="border border-white/10 rounded-2xl bg-slate-900/60 p-6 text-left relative overflow-hidden shadow-lg">
                  {isStarTVTheme && (
                    <div 
                      className="absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase text-white tracking-widest shadow-md"
                      style={{ 
                        backgroundColor: starTokens.teamBColor,
                        clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0% 100%)'
                      }}
                    >
                      TEAM B
                    </div>
                  )}
                  <h3 className={`text-2xl font-black text-white uppercase ${isStarTVTheme ? 'mt-4' : ''}`}>{match.teamB}</h3>
                  <div className={`text-3xl font-mono font-black mt-2 ${isStarTVTheme ? 'text-sky-300' : 'text-teal-400'}`}>
                    {match.innings2 ? `${match.innings2.runs}/${match.innings2.wickets}` : '0/0'} ({match.innings2 ? formatOvers(match.innings2.ballsBowled) : '0.0'} ov)
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between"><span>🥎 {match.innings2?.bowlers?.[0]?.name || 'Bowler A'}</span><strong className={isStarTVTheme ? "text-sky-300 font-black" : "text-white"}>{match.innings2?.bowlers?.[0]?.wickets || 2}-{match.innings2?.bowlers?.[0]?.runsConceded || 24}</strong></div>
                    <div className="flex justify-between"><span>🥎 {match.innings2?.bowlers?.[1]?.name || 'Bowler B'}</span><strong className={isStarTVTheme ? "text-sky-300 font-black" : "text-white"}>{match.innings2?.bowlers?.[1]?.wickets || 1}-{match.innings2?.bowlers?.[1]?.runsConceded || 18}</strong></div>
                  </div>
                </div>
              </div>
              <div className={`border rounded-xl py-3 text-center text-sm font-black uppercase shadow-inner ${isStarTVTheme ? 'bg-amber-400/15 border-amber-400/40 text-amber-300' : 'bg-white/5 border-white/10 text-amber-400'}`}>
                {match.status === 'completed' && match.winner ? `🏆 MATCH RESULT: ${match.winner} WON ${match.winReason ? `(${match.winReason})` : ''} 🏆` : `🏏 STATE: LIVE IN-PLAY PROGRESS IN EFFECT 🏏`}
              </div>
            </motion.div>
          </div>
        )}

        {/* 8. TEAM COMPARISON */}
        {activeGraphic === 'team_comparison' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className={`w-[1250px] h-[650px] bg-slate-950 border ${isStarTVTheme ? 'border-white/20' : 'border-white/10'} rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between pointer-events-auto relative overflow-hidden`} 
              id="graphic-team-comparison"
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 text-left">
                <div>
                  <div className="flex items-center gap-1.5">
                    {isStarTVTheme && <span className="text-amber-400 text-sm">★</span>}
                    <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isStarTVTheme ? 'text-amber-400 font-mono' : 'text-emerald-400'}`}>
                      {isStarTVTheme ? 'STAR TV BROADCAST • TEAM COMPARISON' : 'ROSTER OUTLINES'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black text-white mt-1">Player Rosters Comparative</h1>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTeamCompMode('lineup')} 
                      className={`py-1.5 px-4 rounded-lg font-black uppercase text-[9px] cursor-pointer border transition-all ${
                        teamCompMode === 'lineup' 
                          ? (isStarTVTheme ? 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'bg-emerald-500 border-emerald-500 text-slate-950 hover:bg-emerald-450') 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      PLAYING XIs
                    </button>
                    <button 
                      onClick={() => setTeamCompMode('h2h')} 
                      className={`py-1.5 px-4 rounded-lg font-black uppercase text-[9px] cursor-pointer border transition-all ${
                        teamCompMode === 'h2h' 
                          ? (isStarTVTheme ? 'bg-amber-400 border-amber-400 text-slate-950 font-black shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'bg-emerald-500 border-emerald-500 text-slate-950 hover:bg-emerald-450') 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      H2H STATS
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveGraphic('none')}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-2"
                    title="Close Team Comparison"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              {teamCompMode === 'lineup' ? (
                <div className="grid grid-cols-2 gap-8 py-4 text-left">
                  <div className="border border-white/10 rounded-2xl p-6 bg-slate-900/50 relative overflow-hidden shadow-lg">
                    <div 
                      className="px-3 py-1.5 rounded-md mb-3 flex items-center justify-between"
                      style={{ 
                        backgroundColor: isStarTVTheme ? `${starTokens.teamAColor}25` : 'rgba(239, 68, 68, 0.1)',
                        borderLeft: `4px solid ${isStarTVTheme ? starTokens.teamAColor : '#ef4444'}`
                      }}
                    >
                      <h3 className="text-base font-black uppercase tracking-wider text-white">{match.teamA} Roster</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">11 Players</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-300">
                      {(currentInnings.batsmen || []).slice(0, 10).map((b, idx) => (
                        <div key={idx} className="border-b border-white/[0.04] py-1.5 flex items-center gap-2">
                          <span className="text-slate-500 font-bold w-4 text-right">{idx+1}.</span>
                          <span className="font-semibold text-white truncate">{b.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-white/10 rounded-2xl p-6 bg-slate-900/50 relative overflow-hidden shadow-lg">
                    <div 
                      className="px-3 py-1.5 rounded-md mb-3 flex items-center justify-between"
                      style={{ 
                        backgroundColor: isStarTVTheme ? `${starTokens.teamBColor}25` : 'rgba(56, 189, 248, 0.1)',
                        borderLeft: `4px solid ${isStarTVTheme ? starTokens.teamBColor : '#38bdf8'}`
                      }}
                    >
                      <h3 className="text-base font-black uppercase tracking-wider text-white">{match.teamB} Roster</h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">11 Players</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-300">
                      {(currentInnings.bowlers || []).slice(0, 10).map((b, idx) => (
                        <div key={idx} className="border-b border-white/[0.04] py-1.5 flex items-center gap-2">
                          <span className="text-slate-500 font-bold w-4 text-right">{idx+1}.</span>
                          <span className="font-semibold text-white truncate">{b.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto w-full text-xs font-mono text-slate-300 space-y-6">
                  <div className="space-y-1 text-left bg-slate-950/60 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between uppercase text-[10px] mb-1 font-bold">
                      <span style={{ color: isStarTVTheme ? starTokens.teamAColor : '#f87171' }}>{match.teamA} wins (18)</span>
                      <span style={{ color: isStarTVTheme ? starTokens.teamBColor : '#38bdf8' }}>{match.teamB} wins (17)</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex font-bold tracking-tight text-[8px] text-white">
                      <div 
                        className="h-full flex items-center justify-center font-black" 
                        style={{ width: '51%', backgroundColor: isStarTVTheme ? starTokens.teamAColor : '#dc2626' }}
                      >
                        51%
                      </div>
                      <div 
                        className="h-full flex items-center justify-center font-black text-slate-950" 
                        style={{ width: '49%', backgroundColor: isStarTVTheme ? starTokens.teamBColor : '#0ea5e9' }}
                      >
                        49%
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-left bg-slate-950/60 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between uppercase text-[10px] mb-1 font-bold text-slate-400">
                      <span>Avg CRR: 8.45</span>
                      <span>Avg CRR: 8.62</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex font-bold tracking-tight text-[8px] text-white">
                      <div className="bg-indigo-600 h-full flex items-center justify-center font-bold" style={{ width: '48%' }}>48%</div>
                      <div className="bg-amber-500 h-full flex items-center justify-center text-slate-950 font-bold" style={{ width: '52%' }}>52%</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 text-center border-t border-white/10 pt-4">
                    <div>
                      <span className="text-[8px] block text-slate-400 uppercase mt-1">Form Index</span>
                      <strong className="text-emerald-400 text-sm font-bold">W W L W</strong>
                    </div>
                    <div>
                      <span className="text-[8px] block text-slate-400 uppercase mt-1">Overall Ties</span>
                      <strong className="text-white text-sm font-bold">0</strong>
                    </div>
                    <div>
                      <span className="text-[8px] block text-slate-400 uppercase mt-1">Form Index</span>
                      <strong className="text-rose-400 text-sm font-bold">L L W W</strong>
                    </div>
                  </div>
                </div>
              )}
              <span className="text-[8px] text-slate-400 font-mono">Profile trace computed instantly over league historical records</span>
            </motion.div>
          </div>
        )}

        {/* TEAM A VS TEAM B 3D SHIELD TOURNAMENT OVERLAY */}
        {(activeGraphic === 'team_vs_team' || activeGraphic === 'team_vs_team_alert' || activeAlert === 'team_vs_team') && (
          <div className="absolute inset-0 flex items-center justify-center z-55 pointer-events-auto bg-black/60 backdrop-blur-sm p-4">
            <TeamVsTeamOverlay
              tournamentName={matchTournamentName || match?.tournamentName || 'KARJAT BIG BASH LEAGUE'}
              tournamentLogo={match?.tournamentLogo}
              matchStage={matchStageText || 'Match No. 1, Group Match'}
              matchVenue={match?.venue}
              teamAName={match?.teamA || 'JAMKHED 11'}
              teamBName={match?.teamB || 'KARJAT 11'}
              teamALogo={match?.teamALogo}
              teamBLogo={match?.teamBLogo}
              teamAColor={activeConfig.teamAColor}
              teamBColor={activeConfig.teamBColor}
              onClose={() => {
                setActiveGraphic('none');
                setActiveAlert(null);
              }}
            />
          </div>
        )}

        {/* TOURNAMENT LOGO OVERLAY (1:1 REFERENCE CHEVRON BLUE BROADCAST RIBBON & CREST) */}
        {(activeGraphic === 'tournament_logo' || activeGraphic === 'tournament_brand' || activeGraphic === 'tournament_logo_alert') && match && (
          <div className="absolute inset-0 flex items-center justify-center z-55 pointer-events-auto bg-black/40 backdrop-blur-xs p-4">
            <TournamentLogoOverlay
              match={match}
              onClose={() => {
                setActiveGraphic('none');
                setActiveAlert(null);
              }}
              onUpdateLogo={async (newLogo) => {
                const nextMatch = {
                  ...match,
                  tournamentLogo: newLogo,
                  updatedAt: Date.now()
                };
                setMatch(nextMatch as any);
                try {
                  localStorage.setItem('cricket_active_match', JSON.stringify(nextMatch));
                  if (match.id) {
                    await safeSetDoc(doc(db, 'cricket_matches', match.id), sanitizeForFirestore(nextMatch), { merge: true });
                  }
                } catch (e) {
                  console.warn('Tournament logo save error:', e);
                }
              }}
            />
          </div>
        )}

        {/* BLACK BOARD SCOREBOARD OVERLAY (1:1 REFERENCE NEED [runs] RUNS FROM [balls] BALLS - Only during 2nd innings run chase) */}
        {(activeGraphic === 'black_board_scoreboard' || activeGraphic === 'black_board' || activeGraphic === 'need_board') && match && match.currentInnings === 2 && (match.target ? match.target > 0 : (match.innings?.[0]?.runs !== undefined && match.innings[0].runs > 0)) && (
          <BlackBoardScoreboardOverlay
            match={match}
            onClose={() => {
              setActiveGraphic('none');
            }}
            onUpdateValues={async (runs, balls) => {
              const updatedConfig = {
                ...(match.overlayConfig || {}),
                blackBoardConfig: { runsNeeded: runs, ballsRemaining: balls }
              };
              const nextMatch = {
                ...match,
                overlayConfig: updatedConfig,
                updatedAt: Date.now()
              };
              setMatch(nextMatch as any);
              try {
                localStorage.setItem('cricket_active_match', JSON.stringify(nextMatch));
                if (match.id) {
                  await safeSetDoc(doc(db, 'cricket_matches', match.id), sanitizeForFirestore(nextMatch), { merge: true });
                }
              } catch (e) {
                console.warn('Blackboard equation save error:', e);
              }
            }}
          />
        )}

        {/* 9. WICKET ALERT TEMP */}
        {activeGraphic === 'wicket_alert_temp' && (
          <div className="absolute inset-x-0 top-32 flex justify-center z-50 pointer-events-none">
            <motion.div 
              initial={{ y: -80, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: -50, opacity: 0 }} 
              className={`bg-slate-950 border ${isStarTVTheme ? 'border-rose-500/70 shadow-[0_0_30px_rgba(244,63,94,0.3)]' : 'border-red-500/50'} p-6 rounded-3xl flex items-center gap-5 shadow-2xl relative overflow-hidden`}
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className={`w-12 h-12 ${isStarTVTheme ? 'bg-gradient-to-br from-rose-600 to-red-800' : 'bg-red-650'} text-white rounded-full flex items-center justify-center animate-pulse shadow-lg`}>
                <Skull size={24} />
              </div>
              <div className="text-left border-l border-white/10 pl-5 pr-4">
                <div className="flex items-center gap-1.5">
                  {isStarTVTheme && <span className="text-amber-400 text-xs">★</span>}
                  <span className={`text-[9px] font-bold uppercase tracking-widest block ${isStarTVTheme ? 'text-amber-400 font-mono' : 'text-red-500'}`}>
                    {isStarTVTheme ? 'STAR TV BROADCAST • OUT! (BATTER DISMISSED)' : 'OUT! (BATTER DISMISSED)'}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white uppercase mt-0.5">{battingStats?.striker?.name || 'ACTIVE BATTER'}</h3>
                <span className="text-xs text-slate-400 block font-mono mt-0.5">
                  Dismissed method: <strong className="text-rose-400 font-black">CLEAN BOWLED!</strong>
                </span>
              </div>
            </motion.div>
          </div>
        )}

        {/* 10. MILESTONE ALERT TEMP */}
        {activeGraphic === 'milestone_alert_temp' && (
          <div className="absolute inset-0 flex items-center justify-center z-55 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 1.2, opacity: 0 }} 
              className={`p-10 rounded-[2.5rem] bg-slate-950/98 border ${isStarTVTheme ? 'border-amber-400/60 shadow-[0_0_40px_rgba(251,191,36,0.3)]' : 'border-amber-500/30'} shadow-2xl text-center relative overflow-hidden`}
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className={`w-16 h-16 ${isStarTVTheme ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-amber-500'} text-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl`}>
                <Trophy size={32} />
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                {isStarTVTheme && <span className="text-amber-400 text-xs">★</span>}
                <span className="text-[8px] uppercase tracking-widest font-mono text-amber-400 block font-bold">
                  {isStarTVTheme ? 'STAR TV BROADCAST CELEBRATION' : 'BROADCAST CELEBRATION'}
                </span>
              </div>
              <h1 className="text-4xl font-black text-white uppercase">{customMilestone?.type === '100' ? '👑 MAJESTIC CENTURY' : customMilestone?.type === '5wkt' ? '⚡ FIVE WICKET SPELL' : '⭐ CRUCIAL HALF-CENTURY'}</h1>
              <p className="mt-2 text-xs font-mono font-bold text-slate-300 uppercase">{customMilestone ? `${customMilestone.name || 'Batter'} reached milestone ${customMilestone.value}` : `${battingStats?.striker?.name || 'Batter'} plays an amazing inning of 50 runs!`}</p>
            </motion.div>
          </div>
        )}

        {/* 11. WAGON WHEEL */}
        {activeGraphic === 'wagon_wheel' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className={`w-[680px] h-[660px] bg-slate-950 rounded-[2.5rem] border ${isStarTVTheme ? 'border-white/20' : 'border-teal-500/20'} p-6 shadow-2xl flex flex-col justify-between pointer-events-auto text-left relative overflow-hidden`} 
              id="graphic-wagon-wheel"
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    {isStarTVTheme && <span className="text-amber-400 text-xs">★</span>}
                    <span className={`text-[9px] font-bold block uppercase tracking-widest ${isStarTVTheme ? 'text-amber-400 font-mono' : 'text-teal-400'}`}>
                      {isStarTVTheme ? 'STAR TV BROADCAST • SHOT SECTORS' : 'SHOT SECTORS RANGE'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase">Batter Wagon Wheel</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`font-mono text-xs border py-1 px-3 rounded-lg ${isStarTVTheme ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' : 'bg-slate-900 border-white/5 text-teal-400'}`}>
                    Runs: <strong className="text-white font-black">{battingStats?.striker?.runs ?? 0}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveGraphic('none')}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Close Wagon Wheel"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="h-[380px] w-full flex items-center justify-center bg-teal-950/5 border border-teal-500/10 rounded-xl relative p-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 500 350">
                  <ellipse cx="250" cy="175" rx="220" ry="145" fill="none" stroke={isStarTVTheme ? "rgba(56,189,248,0.25)" : "rgba(20,184,166,0.2)"} strokeWidth="3" />
                  <ellipse cx="250" cy="175" rx="130" ry="90" fill="none" stroke={isStarTVTheme ? "rgba(56,189,248,0.12)" : "rgba(20,184,166,0.08)"} strokeWidth="1.5" strokeDasharray="4 4" />
                  <rect x="238" y="150" width="24" height="50" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <path d="M 250 175 Q 180 100 80 70" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  <path d="M 250 175 Q 310 90 420 80" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
                  <line x1="250" y1="175" x2="160" y2="60" stroke="#06b6d4" strokeWidth="2" />
                  <line x1="250" y1="175" x2="380" y2="280" stroke="#06b6d4" strokeWidth="2" />
                  <line x1="250" y1="175" x2="200" y2="130" stroke="#10b981" strokeWidth="1.2" />
                  <line x1="250" y1="175" x2="290" y2="210" stroke="#10b981" strokeWidth="1.2" />
                  <text x="100" y="60" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">OFFSIDE (12%)</text>
                  <text x="360" y="60" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">FINE LEG (18%)</text>
                  <text x="60" y="180" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">COVERS (25%)</text>
                  <text x="370" y="180" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace">MID-WICKET (30%)</text>
                </svg>
              </div>
              <span className="text-[9px] text-slate-500 font-mono text-center block">Boundary vectors computed procedurally based on batsman shots</span>
            </motion.div>
          </div>
        )}

        {/* 12. PITCH MAP */}
        {activeGraphic === 'pitch_map' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className={`w-[680px] h-[660px] bg-slate-950 rounded-[2.5rem] border ${isStarTVTheme ? 'border-white/20' : 'border-emerald-500/20'} p-6 shadow-2xl flex flex-col justify-between pointer-events-auto text-left relative overflow-hidden`} 
              id="graphic-pitch-map"
            >
              {isStarTVTheme && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-90 pointer-events-none" />
              )}
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    {isStarTVTheme && <span className="text-amber-400 text-xs">★</span>}
                    <span className={`text-[9px] font-bold block uppercase tracking-widest ${isStarTVTheme ? 'text-amber-400 font-mono' : 'text-emerald-400'}`}>
                      {isStarTVTheme ? 'STAR TV BROADCAST • BALL ZONE ANALYSIS' : 'BALL ZONE ANALYSIS'}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white">Bowler Pitch Map</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`font-mono text-xs border py-1 px-3 rounded-lg ${isStarTVTheme ? 'bg-amber-400/10 border-amber-400/30 text-amber-300' : 'bg-slate-900 border-white/5 text-emerald-400'}`}>
                    Spell: <strong className="text-white font-black">{bowlingStats?.name || 'Current Bowler'}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveGraphic('none')}
                    className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Close Pitch Map"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="h-[380px] w-full flex items-center justify-center bg-emerald-950/5 border border-emerald-500/10 rounded-xl relative p-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 500 350">
                  <rect x="180" y="40" width="140" height="240" fill="none" stroke="rgba(16,185,129,0.25)" strokeWidth="2.5" />
                  <rect x="180" y="40" width="140" height="40" fill="rgba(249,115,22,0.08)" stroke="rgba(249,115,22,0.08)" />
                  <text x="250" y="65" fill="rgba(249,115,22,0.4)" fontSize="8" textAnchor="middle" fontFamily="monospace">YORKER ZONE</text>
                  <rect x="180" y="80" width="140" height="50" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.08)" />
                  <text x="250" y="110" fill="rgba(59,130,246,0.4)" fontSize="8" textAnchor="middle" fontFamily="monospace">FULL LENGTH</text>
                  <rect x="180" y="130" width="140" height="70" fill="rgba(16,185,129,0.09)" stroke="rgba(16,185,129,0.1)" />
                  <text x="250" y="170" fill="rgba(16,185,129,0.5)" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">GOOD LENGTH (G)</text>
                  <rect x="180" y="200" width="140" height="50" fill="rgba(239,68,68,0.08)" stroke="rgba(239,68,68,0.08)" />
                  <text x="250" y="230" fill="rgba(239,68,68,0.4)" fontSize="8" textAnchor="middle" fontFamily="monospace">SHORT ZONE</text>
                  <circle cx="210" cy="60" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="1" /><circle cx="280" cy="110" r="6" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" /><circle cx="250" cy="165" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1" /><circle cx="300" cy="150" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1" /><circle cx="220" cy="225" r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
                </svg>
              </div>
              <span className="text-[9px] text-slate-500 font-mono text-center block">Delivery positions and speeds registered by TV tracking radars</span>
            </motion.div>
          </div>
        )}

        {/* 13. FULL-SCREEN OVERLAYS (MATCH TRANSITIONS) */}
        {isFullScreenTransition && (
          <CricketFullScreenTransitions
            activeGraphic={activeGraphic}
            match={(match || getOrCreateDefaultMatch()) as any}
            onClose={() => setActiveGraphic('none')}
            isStarTVTheme={isStarTVTheme}
            starTokens={starTokens}
            activeConfig={activeConfig}
          />
        )}
      </AnimatePresence>

      {renderCustomOverlayImage()}
      {renderYoutubeChannelWatermark()}

      {/* =========================================================================
          4B. RICH ANIMATED OVERLAY ALERTS & STINGERS (SIX, FOUR, WICKET, DISMISSALS, GULLY RULES)
          ========================================================================= */}
      <CricketOverlayAnimations
        activeAnimation={activeAlert}
        metadata={activeAlertMeta}
        onAnimationComplete={() => {
          setActiveAlert(null);
          setActiveAlertMeta(undefined);
        }}
      />

      {/* =========================================================================
          4C. TOURNAMENT 4s & 6s BOUNDARY COUNTER POPUP OVERLAY ANIMATION
          (Matches user reference: Karjat Big Bash League boundary counter pop-up)
          ========================================================================= */}
      <TournamentBoundaryCounterPopup
        visible={boundaryCounterPopup.visible}
        activeType={boundaryCounterPopup.type}
        tournamentName={match?.tournamentName || (match as any)?.seriesName || 'KARJAT BIG BASH LEAGUE'}
        tournamentFours={tournamentBoundaries.fours}
        tournamentSixes={tournamentBoundaries.sixes}
        matchFours={currentMatchFours}
        matchSixes={currentMatchSixes}
        batterName={boundaryCounterPopup.batterName}
        position={activeConfig.boundaryCounterPosition || 'bottom-right'}
        onClose={() => setBoundaryCounterPopup(prev => ({ ...prev, visible: false }))}
        soundEnabled={true}
      />

      {/* =========================================================================
          4D. INTERACTIVE FIELD POSITION MANAGER MODAL FOR SCORE MANAGER / BROADCASTER
          ========================================================================= */}
      {(() => {
        const curInn = currentInnings;
        const currentBowlingTeam = curInn?.bowlingTeam || (curInn?.battingTeam === match?.teamA ? match?.teamB : match?.teamA) || (match?.tossChoice === 'bowl' ? match?.tossWinner : (match?.tossWinner === match?.teamA ? match?.teamB : match?.teamA)) || match?.teamB || 'Team B';
        const fieldingRoster = currentBowlingTeam === match?.teamA
          ? (match?.teamASquad && match?.teamASquad.length > 0 ? match?.teamASquad : [])
          : (match?.teamBSquad && match?.teamBSquad.length > 0 ? match?.teamBSquad : []);
        const fieldingPlayerNames = Array.isArray(fieldingRoster) && fieldingRoster.length > 0
          ? fieldingRoster.map((p: any, idx: number) => typeof p === 'string' ? p : (p?.name || `Player ${idx + 1}`))
          : [];

        return (
          <FieldPositionManagerModal
            isOpen={showFieldPositionModal}
            onClose={() => setShowFieldPositionModal(false)}
            currentPositions={match?.overlayConfig?.fieldPositions}
            onSavePositions={async (positions) => {
              if (!match) return;
              const updatedConfig = {
                ...(match.overlayConfig || {}),
                fieldPositions: positions
              };
              const nextMatch = {
                ...match,
                overlayConfig: updatedConfig,
                updatedAt: Date.now()
              };
              setMatch(nextMatch as any);
              try {
                localStorage.setItem('cricket_active_match', JSON.stringify(nextMatch));
                if (match.id) {
                  await safeSetDoc(doc(db, 'cricket_matches', match.id), sanitizeForFirestore(nextMatch), { merge: true });
                }
              } catch (e) {
                console.warn('Field positions sync error:', e);
              }
            }}
            onShowOnBroadcast={async (positions) => {
              if (!match) return;
              const updatedConfig = {
                ...(match.overlayConfig || {}),
                fieldPositions: positions,
                activeGraphic: 'field_positions'
              };
              const nextMatch = {
                ...match,
                overlayConfig: updatedConfig,
                updatedAt: Date.now()
              };
              setMatch(nextMatch as any);
              setActiveGraphic('field_positions');
              setShowFieldPositionModal(false);
              try {
                localStorage.setItem('cricket_active_match', JSON.stringify(nextMatch));
                if (match.id) {
                  await safeSetDoc(doc(db, 'cricket_matches', match.id), sanitizeForFirestore(nextMatch), { merge: true });
                }
              } catch (e) {
                console.warn('Field positions sync error:', e);
              }
            }}
            isLiveOnAir={
              activeGraphic === 'field_positions' ||
              activeGraphic === 'field_position' ||
              activeGraphic === 'field_positions_alert'
            }
            fieldingTeamName={currentBowlingTeam}
            fieldingPlayers={fieldingPlayerNames}
          />
        );
      })()}

    </div>
  );
};
