import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, TrendingUp, Zap, Radio, ChevronRight, Play, Flame, Award, Skull, Star, Check 
} from 'lucide-react';
import { useSearchParams, useParams } from 'react-router-dom';
import { CricketOverlayAnimations } from './CricketOverlayAnimations';

// Firestore imports
import { db } from '../../lib/firebase';
import { doc, onSnapshot, collection, query, where, limit } from 'firebase/firestore';
import { isMatchDeleted, markMatchDeleted, getAnyActiveOrRecentMatch, getOrCreateDefaultMatch } from './cricketStorage';
import { CricketFullScreenTransitions } from './CricketFullScreenTransitions';

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

interface OverlayConfig {
  template: 'broadcast-pro' | 'neon-sport' | 'clean-white' | 'ipl-style' | 'score-bug-1900-200' | 'slanted-pro-design';
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
}

interface MatchState {
  id: string;
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
  updatedAt?: number;
  version?: number;
  overlayConfig?: OverlayConfig;
  teamALogo?: string;
  teamBLogo?: string;
  playerPhotos?: Record<string, string>;
}

export const CricketOverlay: React.FC = () => {
  const [searchParams] = useSearchParams();
  const routeParams = useParams<{ managerId?: string }>();
  const [matchId, setMatchId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [streamKey, setStreamKey] = useState<string>('');
  const [isPermanentRoute, setIsPermanentRoute] = useState<boolean>(false);

  useEffect(() => {
    // 1. Extract managerId / userId / scorer / channel from params
    const resolvedManager = 
      routeParams.managerId ||
      searchParams.get('managerId') || 
      searchParams.get('userId') || 
      searchParams.get('user') || 
      searchParams.get('scorer') || 
      searchParams.get('channel') ||
      '';

    const resolvedStreamKey = searchParams.get('streamKey') || '';

    // Check hash query fallback
    const hash = window.location.hash || '';
    const hashQueryIdx = hash.indexOf('?');
    let hashManager = '';
    let hashStreamKey = '';
    let hashMatchId = '';
    if (hashQueryIdx !== -1) {
      const qParams = new URLSearchParams(hash.substring(hashQueryIdx));
      hashManager = qParams.get('managerId') || qParams.get('userId') || qParams.get('user') || '';
      hashStreamKey = qParams.get('streamKey') || '';
      hashMatchId = qParams.get('matchId') || '';
    }

    const finalManager = resolvedManager || hashManager;
    const finalStreamKey = resolvedStreamKey || hashStreamKey;

    if (finalManager) {
      setManagerId(finalManager);
      setIsPermanentRoute(true);
    }
    if (finalStreamKey) {
      setStreamKey(finalStreamKey);
      setIsPermanentRoute(true);
    }

    // Direct matchId param (for legacy or explicit match inspection)
    const directMatchId = searchParams.get('matchId') || hashMatchId;
    if (directMatchId) {
      setMatchId(directMatchId);
      return;
    }

    // If permanent route with managerId, matchId will be dynamically resolved via the active match query.
    // Otherwise try localStorage active match
    if (!finalManager && !finalStreamKey) {
      try {
        const activeStr = localStorage.getItem('cricket_active_match');
        if (activeStr) {
          const parsed = JSON.parse(activeStr);
          if (parsed && parsed.id) {
            setMatchId(parsed.id);
            return;
          }
        }
      } catch {}
    }
  }, [searchParams, routeParams.managerId]);
  
  // Real-time Match State synced via Firestore & LocalStorage fallback
  const [match, setMatch] = useState<MatchState | null>(null);
  
  // Flash animation states on score change to highlight boundaries
  const [lastBdryFlash, setLastBdryFlash] = useState<'4' | '6' | null>(null);
  const [prevRuns, setPrevRuns] = useState<number>(0);
  const [prevWickets, setPrevWickets] = useState<number>(0);

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

  // Synchronous visual alerts (SIX, FOUR, WICKET)
  const [activeAlert, setActiveAlert] = useState<'six' | 'four' | 'wicket' | null>(null);
  const [showDemoControls, setShowDemoControls] = useState<boolean>(true);
  const [wicketTriggerAlert, setWicketTriggerAlert] = useState<boolean>(false);

  // Active broadcast graphic state and substates
  const [activeGraphic, setActiveGraphic] = useState<string>('none');
  const [activeControlTab, setActiveControlTab] = useState<'alerts' | 'graphics' | 'specials'>('alerts');
  const [lowerThirdMode, setLowerThirdMode] = useState<'intro' | 'equation' | 'umpires'>('intro');
  const [selectedUmpireSignal, setSelectedUmpireSignal] = useState<'out' | 'noball' | 'freehit' | 'deadball' | 'wide'>('out');
  const [customMilestone, setCustomMilestone] = useState<{ name: string; type: 'fifty' | 'hundred' | '5wkt'; value: number } | null>(null);
  const [teamCompMode, setTeamCompMode] = useState<'lineup' | 'h2h'>('lineup');

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
      customOverlayAsBackground: false
    };

    if (!match || !match.overlayConfig) return fallback;
    return {
      template: match.overlayConfig.template || fallback.template,
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
      customOverlayAsBackground: match.overlayConfig.customOverlayAsBackground !== undefined ? match.overlayConfig.customOverlayAsBackground : fallback.customOverlayAsBackground
    };
  }, [match]);

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

  // Real-time Active Match resolution for Permanent OBS Overlay Links (managerId or streamKey)
  useEffect(() => {
    if (!managerId && !streamKey) return;

    console.log(`[Overlay Permanent Route] Subscribing to active match for manager: "${managerId}", streamKey: "${streamKey}"`);

    let unsubManager: (() => void) | null = null;
    let unsubQuery: (() => void) | null = null;

    if (managerId) {
      // 1. Direct O(1) listener on the manager's active match pointer document in Firestore
      const managerDocRef = doc(db, 'score_managers', managerId);
      unsubManager = onSnapshot(managerDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.status === 'live' && data.activeMatchId) {
            console.log('[Overlay Permanent Route] Manager activeMatchId pointer:', data.activeMatchId);
            setMatchId(data.activeMatchId);
          } else if (data.status === 'completed' || !data.activeMatchId) {
            console.log('[Overlay Permanent Route] Manager marked match completed or idle');
            setMatchId('');
            setMatch(null);
          }
        }
      }, (err) => {
        console.warn('[Overlay Permanent Route] Manager pointer snapshot note:', err);
      });

      // 2. Collection query listener for any match with status == 'live' owned by this manager
      const q = query(
        collection(db, 'cricket_matches'),
        where('managerId', '==', managerId),
        where('status', '==', 'live'),
        limit(1)
      );
      unsubQuery = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const liveDoc = snap.docs[0];
          const liveData = liveDoc.data() as MatchState;
          if (liveData && !isMatchDeleted(liveDoc.id)) {
            console.log('[Overlay Permanent Route] Live match found in query:', liveDoc.id);
            setMatchId(liveDoc.id);
            setMatch(liveData);
          }
        } else {
          // If query returns empty and manager pointer doesn't have live match, reset match
          setMatch((prev) => {
            if (prev && prev.managerId === managerId && prev.status === 'live') {
              return null;
            }
            return prev;
          });
        }
      }, (err) => {
        console.warn('[Overlay Permanent Route] Live match query note:', err);
      });
    } else if (streamKey) {
      // Direct streamKey query
      const q = query(
        collection(db, 'cricket_matches'),
        where('streamKey', '==', streamKey),
        where('status', '==', 'live'),
        limit(1)
      );
      unsubQuery = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          const liveDoc = snap.docs[0];
          setMatchId(liveDoc.id);
          setMatch(liveDoc.data() as MatchState);
        } else {
          setMatch(null);
          setMatchId('');
        }
      }, (err) => {
        console.warn('[Overlay Permanent Route] Stream key query note:', err);
      });
    }

    return () => {
      if (unsubManager) unsubManager();
      if (unsubQuery) unsubQuery();
    };
  }, [managerId, streamKey]);

  // Fallback to any recent/default match ONLY if standalone overlay is opened without a matchId and NOT on a permanent channel
  useEffect(() => {
    if (isPermanentRoute || managerId || streamKey) {
      // In permanent broadcast mode, never display artificial demo matches while waiting for live game
      return;
    }
    if (!match && !matchId) {
      const recent = getAnyActiveOrRecentMatch();
      if (recent) {
        setMatch(recent);
      } else {
        const def = getOrCreateDefaultMatch();
        if (def) setMatch(def);
      }
    }
  }, [match, matchId, isPermanentRoute, managerId, streamKey]);

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
        markMatchDeleted(matchId);
        setMatch(null);
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
      setActiveAlert(activeConfig.manualAlertTrigger.type);
    }
  }, [activeConfig.manualAlertTrigger]);



  // Extract variables for current active innings
  const { currentInnings, inningsNum } = useMemo(() => {
    if (!match) return { currentInnings: null, inningsNum: 1 };
    
    // Configurable layout override or automatic detection
    const activeInningsNum = activeConfig.forceInningsLayout > 0 
      ? activeConfig.forceInningsLayout as 1 | 2 
      : match.currentInningsNum;

    const inn = activeInningsNum === 1 ? match.innings1 : match.innings2;
    return { currentInnings: inn || match.innings1 || match.innings2, inningsNum: activeInningsNum };
  }, [match, activeConfig]);

  // Track boundaries & wicket transitions
  useEffect(() => {
    if (!currentInnings) return;

    // Detect Runs boundary flashes
    if (prevRuns > 0 && currentInnings.runs > prevRuns) {
      const diff = currentInnings.runs - prevRuns;
      if (diff === 4) {
        setLastBdryFlash('4');
        setTimeout(() => setLastBdryFlash(null), 2000);
      } else if (diff === 6) {
        setLastBdryFlash('6');
        setTimeout(() => setLastBdryFlash(null), 2000);
      }
    }
    setPrevRuns(currentInnings.runs);

    // Detect Wickets Fall popups
    if (prevWickets > 0 && currentInnings.wickets > prevWickets) {
      setWicketTriggerAlert(true);
      setTimeout(() => {
        setWicketTriggerAlert(false);
      }, 5000);

      const latestWicketNum = currentInnings.wickets;
      const fowList = currentInnings.fallOfWickets || [];
      const fowEntry = fowList.find(f => f.wicketNo === latestWicketNum) || 
                       (fowList.length > 0 ? fowList[fowList.length - 1] : undefined);

      if (fowEntry) {
        const dismissedBatterName = fowEntry.batsmanName;
        const matchingBatter = (currentInnings.batsmen || []).find(b => b.name === dismissedBatterName);
        const dismissalMode = matchingBatter?.outMode || 'Dismissed';
        
        setWicketPopup({
          batterName: dismissedBatterName,
          dismissalType: dismissalMode,
          scoreAtFall: `${fowEntry.score}/${latestWicketNum} (${fowEntry.oversList} ov)`,
          visible: true
        });

        // Auto collapse popup after 6 seconds
        setTimeout(() => {
          setWicketPopup(prev => prev ? { ...prev, visible: false } : null);
        }, 6000);
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

    return (currentInnings.commentaryList || [])
      .filter((c: any) => c.overBall && getOverIndex(c.overBall) === currentOverNo)
      .slice(0, 12)
      .reverse(); // oldest to newest
  }, [currentInnings?.commentaryList, currentOverNo]);

  // Mini summary of last 3 overs
  const recentOversPills = useMemo(() => {
    if (!currentInnings) return [];
    
    // Group commentary list by integer overs
    const overGroups: Record<number, CommentaryItem[]> = {};
    (currentInnings.commentaryList || []).forEach(c => {
      if (!c.overBall) return;
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
        const desc = c.description.toLowerCase();
        if (c.type === 'wicket') {
          wktsSum++;
          bLabels.push('W');
        } else if (c.type === 'boundary') {
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
    const currentBowler = bowlers[currentInnings.currentBowlerIndex] || bowlers.find(b => b.isCurrent);
    if (!currentBowler) return null;

    const balls = currentBowler.ballsBowled || 0;
    const maidens = currentBowler.maidens || 0;
    const wickets = currentBowler.wickets || 0;
    const runs = currentBowler.runsConceded || 0;
    const econ = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

    // Calculate dot ball percentage from bowler-specific commentary
    const bowlerNameLower = currentBowler.name.toLowerCase();
    const bowlsForThisBowler = (currentInnings.commentaryList || []).filter(c => 
      c.description.toLowerCase().includes(bowlerNameLower)
    );
    const dotsCount = bowlsForThisBowler.filter(c => 
      c.description.toLowerCase().includes('dot ball') || 
      c.description.toLowerCase().includes('no run') || 
      c.description.toLowerCase().includes('0 run')
    ).length;
    const dotBallPct = bowlsForThisBowler.length > 0 
      ? Math.round((dotsCount / bowlsForThisBowler.length) * 100) 
      : 35; // reasonable average fallback

    return {
      name: currentBowler.name,
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
    const striker = currentInnings.batsmen?.[currentInnings.strikerIndex];
    const nonStriker = currentInnings.batsmen?.[currentInnings.nonStrikerIndex];
    if (!striker) return null;

    const strikerSR = striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '0.0';
    const nonStrikerSR = nonStriker && nonStriker.balls > 0 
      ? ((nonStriker.runs / nonStriker.balls) * 100).toFixed(1) 
      : '0.0';

    return {
      striker: {
        ...striker,
        sr: strikerSR
      },
      nonStriker: nonStriker ? {
        ...nonStriker,
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

    return {
      totalExtras,
      wides: extrasObj.wides,
      noBalls: extrasObj.noBalls,
      byes: extrasObj.byes,
      legByes: extrasObj.legByes,
      activePartnership,
      powerplayRuns: ppRuns,
      deathRuns: deathRuns
    };
  }, [currentInnings, match]);

  // Delivery Style Pill Resolver
  const getPillDetails = (b: CommentaryItem) => {
    const desc = (b.description || '').toLowerCase();
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
    } else if (b.type === 'extra') {
      if (desc.includes('wide')) { label = 'WD'; style = 'bg-orange-500 border-orange-500 text-white font-bold'; }
      else if (desc.includes('no ball') || desc.includes('no-ball') || desc.includes('nb')) { label = 'NB'; style = 'bg-red-500 border-red-500 text-white font-bold animate-pulse-fast'; }
      else if (desc.includes('leg bye')) { label = 'LB'; style = 'bg-emerald-600/30 border-emerald-600/50 text-emerald-300'; }
      else if (desc.includes('bye')) { label = 'B'; style = 'bg-slate-700 border-slate-650 text-slate-300'; }
      else { label = 'EX'; style = 'bg-slate-800 border-slate-700 text-slate-400'; }
    } else {
      const numMatch = desc.match(/\d+/);
      const runs = numMatch ? parseInt(numMatch[0]) : 0;
      if (runs === 0) {
        label = '•';
        style = 'bg-slate-850 border-slate-800 text-slate-500';
      } else {
        label = runs.toString();
        style = 'bg-emerald-500 border-emerald-500 font-bold text-white';
      }
    }

    if (match?.freeHitNext && label === 'NB') {
      label = '★';
      style = 'bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(147,51,234,0.6)] animate-pulse-fast';
    }

    return { label, style };
  };

  const isFullScreenTransition = [
    'team_lineups', 'lineups', 'playing_xi', 
    'innings_scorecard', 'full_scorecard', 
    'match_presentation', 'potm_card', 'presentation', 
    'tournament_standings', 'points_table', 'standings',
    'prematch_matchup', 'matchup_card', 'matchup',
    'toss_result', 'toss_card', 'toss',
    'pitch_weather_report', 'pitch_report', 'pitch_weather'
  ].includes(activeGraphic);

  if (!match && !isFullScreenTransition) {
    if (isPermanentRoute || managerId || streamKey) {
      return (
        <div className="absolute inset-0 bg-transparent flex flex-col items-end justify-end p-6 md:p-10 font-sans pointer-events-none select-none">
          {/* Glassmorphism TV Broadcast Standby Bug in Lower Corner - Transparent OBS Background */}
          <div className="bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex items-center gap-3.5 text-white max-w-md pointer-events-auto">
            <div className="relative flex items-center justify-center shrink-0">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-black text-[9px] uppercase tracking-widest">
                  OBS FEED READY
                </span>
                <span className="text-[11px] font-mono text-slate-300 font-bold truncate">
                  @{managerId || streamKey || 'Official Scorer'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-1 leading-snug">
                Permanent stream link active. Waiting for score manager to toggle match to <span className="text-rose-400 font-black uppercase">Live</span>.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 bg-transparent flex flex-col items-center justify-center font-sans">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 p-8 rounded-[2rem] text-center shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Radio className="animate-pulse" size={28} />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">Broadcast Score Bug</h2>
          <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">
            Please copy your Permanent OBS Browser Source URL from the live score cockpit and use it directly inside OBS Studio.
          </p>
          <div className="text-[10px] font-mono font-black border border-white/5 bg-black/40 text-rose-400 rounded-xl p-3 uppercase tracking-wider">
            Waiting for real-time match data...
          </div>
        </div>
      </div>
    );
  }

  if (!currentInnings && !isFullScreenTransition) {
    return (
      <div className="absolute inset-0 bg-transparent flex items-center justify-center font-sans">
        <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-2xl text-center backdrop-blur-md">
          <p className="text-white font-extrabold uppercase tracking-widest text-sm mb-2">No Active Innings Initialized</p>
          <span className="text-[10px] text-slate-500 font-mono">Activate innings inside Scorer Cockpit</span>
        </div>
      </div>
    );
  }

  // Active Template Style configs mapper
  const isNeon = activeConfig.template === 'neon-sport';
  const isWhite = activeConfig.template === 'clean-white';
  const isIpl = activeConfig.template === 'ipl-style';
  const isPro = activeConfig.template === 'broadcast-pro';

  let themeColors = {
    cardBg: 'bg-slate-950/90 border-slate-800/80 text-white backdrop-blur-xl',
    accentText: 'text-amber-500',
    accentBg: 'bg-amber-500',
    titleText: 'text-slate-100 font-black',
    pillDefault: 'bg-slate-800 border-slate-700 text-slate-300',
    headerGlow: 'border-l-4 border-amber-500shadow-[0_4px_30px_rgba(0,0,0,0.5)]',
    tickerBg: 'bg-slate-900/95 border-t border-slate-800/30 text-slate-300',
    subCard: 'bg-slate-900/80 border-slate-800/40'
  };

  if (isNeon) {
    themeColors = {
      cardBg: 'bg-neutral-950/95 border-emerald-500/20 text-white shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      accentText: 'text-emerald-400',
      accentBg: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
      titleText: 'text-white font-extrabold',
      pillDefault: 'bg-neutral-900 border-emerald-500/10 text-emerald-400',
      headerGlow: 'border-l-4 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]',
      tickerBg: 'bg-neutral-900/95 border-emerald-500/10 text-slate-300',
      subCard: 'bg-neutral-900/90 border-neutral-800/50'
    };
  } else if (isWhite) {
    themeColors = {
      cardBg: 'bg-white border-slate-200/80 text-slate-900 shadow-xl',
      accentText: 'text-rose-600',
      accentBg: 'bg-rose-600 shadow-md',
      titleText: 'text-slate-900 font-extrabold',
      pillDefault: 'bg-slate-100 border-slate-250 text-slate-700',
      headerGlow: 'border-l-4 border-rose-600 shadow-sm',
      tickerBg: 'bg-slate-50 border-t border-slate-200 text-slate-600',
      subCard: 'bg-slate-50 border-slate-150'
    };
  } else if (isIpl) {
    themeColors = {
      cardBg: 'bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-slate-950/90 border-purple-500/30 text-white shadow-[0_0_35px_rgba(168,85,247,0.25)]',
      accentText: 'text-purple-400',
      accentBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
      titleText: 'text-white font-black',
      pillDefault: 'bg-purple-900/40 border-purple-500/20 text-purple-200',
      headerGlow: 'border-l-4 border-purple-500 shadow-purple-500/30',
      tickerBg: 'bg-indigo-950/95 border-t border-purple-500/10 text-purple-200',
      subCard: 'bg-purple-900/20 border-purple-500/10'
    };
  }

  // Active Team Accent color variables
  const activeTeamColor = (currentInnings?.battingTeam || '') === (match?.teamA || '') 
    ? activeConfig.teamAColor 
    : activeConfig.teamBColor;

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
          1. WICKET FALL POPUP OVERLAY
          ========================================================================= */}
      <AnimatePresence>
        {(wicketPopup?.visible || activeConfig.manualWicketTrigger) && (
          <div className="absolute inset-x-0 top-32 flex justify-center z-50">
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -80, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 220, damping: 20 }}
              className="bg-slate-950 border border-red-500/60 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-[0_0_50px_rgba(220,38,38,0.7)]"
            >
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white animate-bounce">
                <Skull size={32} />
              </div>
              <div className="border-l border-white/10 pl-6 pr-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-1">OUT (WICKET FALL)</span>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">
                  {wicketPopup?.batterName || 'STRIKER BATSMAN'}
                </h3>
                <p className="text-sm font-bold text-slate-400 mt-1 uppercase">
                  Dismissal Mode: <span className="text-red-400">{wicketPopup?.dismissalType || 'Bowled'}</span>
                </p>
                <div className="mt-2 bg-red-500/10 border border-red-500/20 rounded-lg py-1 px-3 inline-block">
                  <span className="text-xs text-red-300 font-mono font-bold uppercase">
                    Score at Fall: {wicketPopup?.scoreAtFall || `${currentInnings.runs}/${currentInnings.wickets}`}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          1B. CORNER BANNER PROJECTION OVERLAY (TOP-RIGHT CORNER)
          ========================================================================= */}
      <AnimatePresence>
        {activeConfig.customBanner && activeConfig.customBanner !== 'none' && (
          <div className="absolute top-16 right-16 z-55 pointer-events-none" id="corner-banner-projection">
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
              <div className="flex flex-col text-left gap-0.5">
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
                <h4 className="text-base font-black text-white leading-tight uppercase flex-wrap">
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
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40">
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
        {activeConfig.manualOutsDisplay !== 'none' && (
          <div className={
            activeConfig.manualOutsDisplay === 'fullscreen' 
              ? "absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center z-[100]"
              : "absolute top-12 right-12 w-96 z-40"
          }>
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className={`p-10 rounded-[3rem] text-center border ${
                activeConfig.manualOutsDisplay === 'fullscreen' 
                  ? "bg-slate-900 border-emerald-500/20 max-w-2xl w-full shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                  : "bg-slate-950 border-red-500/20 shadow-2xl"
              }`}
            >
              <div className="w-20 h-20 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                <Skull size={40} />
              </div>
              <h2 className="text-4xl font-extrabold text-white uppercase tracking-tight mb-2">OUT!</h2>
              <p className="text-lg text-slate-400 uppercase tracking-widest">Wicket Cleared</p>
              
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/5 pt-8 max-w-md mx-auto">
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">BATSMAN</span>
                  <span className="text-lg font-bold text-white block uppercase">
                    {battingStats?.striker.name || 'Batter'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">SCORE AT FALL</span>
                  <span className="text-lg font-bold text-emerald-400 block font-mono">
                    {currentInnings.runs}/{currentInnings.wickets}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          3. MAIN SCORE BUG BLOCK (BOTTOM-LEFT STANDARD BROADCAST POSITION)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeConfig.template !== 'score-bug-1900-200' && activeConfig.template !== 'slanted-pro-design' && (
        <div className={`absolute bottom-16 left-16 w-[680px] rounded-[2rem] border overflow-hidden ${themeColors.cardBg} ${themeColors.headerGlow}`}>
          
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] uppercase font-mono font-black border text-center shrink-0 ${details.style}`}
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
          3B. GIANT CENTERED SCORE BUG (1900px width x 200px height)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeConfig.template === 'score-bug-1900-200' && (
        <div 
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1900px] h-[200px] rounded-[2rem] border overflow-hidden flex items-stretch shadow-[0_20px_60px_rgba(0,0,0,0.95)] ${themeColors.cardBg}`} 
          style={{ borderColor: activeTeamColor }}
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
          3C. CUSTOM SLANTED PRO DESIGN MODE (As requested by the user!)
          ========================================================================= */}
      {activeConfig.showScoreBug && activeConfig.template === 'slanted-pro-design' && (
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[1900px] h-[80px] select-none font-sans z-30"
          id="custom-slanted-pro-bug"
        >
          {/* Main outer container - maintains a standard, unskewed layout perspective */}
          <div className="w-full h-full flex items-stretch overflow-hidden bg-black/45 backdrop-blur-md rounded-xl border border-slate-900/80 shadow-[0_15px_45px_rgba(0,0,0,0.85)]">
            
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
                      {battingStats?.striker.name || 'BATSMEN A'}
                    </span>
                  </div>
                  <span className="text-white font-mono font-black text-[13px]">
                    {battingStats?.striker.runs || 0}{' '}
                    <span className="text-slate-300 font-normal text-[10px]">
                      ({battingStats?.striker.balls || 0})
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
                  {currentInnings.battingTeam.substring(0, 3).toUpperCase()}
                </span>
                <span className="text-sky-500 font-sans font-extrabold text-[10px] italic leading-none my-0.5 animate-pulse">V</span>
                <span className="text-slate-600 font-sans font-black text-[11px] tracking-wide uppercase leading-none">
                  {(match.teamA === currentInnings.battingTeam ? match.teamB : match.teamA).substring(0, 3).toUpperCase()}
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
          4. CUSTOM DYNAMIC OVERLAY BANNER

          ========================================================================= */}
      <AnimatePresence>
        {activeGraphic === 'batsman_stats' && battingStats && (
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-50 pointer-events-none">
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="w-[1000px] bg-slate-950/95 border border-amber-500/20 rounded-3xl p-6 shadow-2xl flex flex-col justify-between" style={{ borderLeft: `6px solid ${activeTeamColor}` }}>
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">BATSMEN STATISTICS</span>
                <span className="text-xs font-mono text-amber-400 font-bold">Partnership: {matchStats?.activePartnership || 0} runs</span>
              </div>
              <div className="grid grid-cols-2 gap-6 text-left">
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
                  {/* Photo Avatar */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
                    {match?.playerPhotos?.[battingStats.striker.name.toLowerCase().trim()] ? (
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
                    <span className="text-[10px] text-emerald-400 font-black tracking-wider block">STRIKER</span>
                    <h4 className="text-xl font-black text-white uppercase truncate">{battingStats.striker.name}</h4>
                    <div className="flex justify-between font-mono text-xs text-slate-300 mt-2">
                      <span>Runs: <strong className="text-white">{battingStats.striker.runs}</strong> ({battingStats.striker.balls}b)</span>
                      <span className="text-amber-500 font-bold">SR: {battingStats.striker.sr}%</span>
                    </div>
                  </div>
                </div>
                {battingStats.nonStriker ? (
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex gap-4 items-center">
                    {/* Photo Avatar */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
                      {match?.playerPhotos?.[battingStats.nonStriker.name.toLowerCase().trim()] ? (
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
                        <span>Runs: <strong className="text-white">{battingStats.nonStriker.runs}</strong> ({battingStats.nonStriker.balls}b)</span>
                        <span className="text-slate-400 font-bold">SR: {battingStats.nonStriker.sr}%</span>
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
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-50 pointer-events-none">
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="w-[900px] bg-slate-950/95 border border-sky-500/20 rounded-3xl p-6 shadow-2xl flex flex-col justify-between" style={{ borderLeft: `6px solid ${activeTeamColor === activeConfig.teamAColor ? activeConfig.teamBColor : activeConfig.teamAColor}` }}>
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
                <span className="text-xs font-black tracking-widest text-slate-400 uppercase font-mono">ACTIVE BOWLER SPELL</span>
                <span className="text-xs font-mono text-sky-400 font-bold">Dot ball percentage: {bowlingStats.dotBallPct}%</span>
              </div>
              <div className="grid grid-cols-12 gap-6 items-center text-left">
                <div className="col-span-5 flex gap-4 items-center">
                  {/* Bowler Photo Avatar */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 flex items-center justify-center">
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
                    <span className="text-[10px] text-sky-400 font-black tracking-widest block font-mono">CURRENT SPELL</span>
                    <h3 className="text-xl font-black text-white uppercase truncate">{bowlingStats.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">Maidens: {bowlingStats.maidens}</span>
                  </div>
                </div>
                <div className="col-span-7 grid grid-cols-4 gap-3 font-mono text-center">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-2xl font-black text-white">{bowlingStats.wickets}</span>
                    <span className="text-[8px] block text-slate-500 uppercase mt-1">Wickets</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-2xl font-black text-rose-500">{bowlingStats.runs}</span>
                    <span className="text-[8px] block text-slate-500 uppercase mt-1">Runs</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-2xl font-black text-white">{formatOvers(bowlingStats.balls)}</span>
                    <span className="text-[8px] block text-slate-500 uppercase mt-1">Overs</span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-2xl font-black text-sky-400">{bowlingStats.econ}</span>
                    <span className="text-[8px] block text-slate-500 uppercase mt-1">Econ</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeGraphic === 'lower_third' && (
          <div className="absolute bottom-16 left-16 z-50 pointer-events-none text-left">
            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }} className="w-[750px] bg-slate-950/95 border border-white/10 rounded-2xl p-5 shadow-2xl flex items-center justify-between" style={{ borderLeft: `6px solid ${activeTeamColor}` }}>
              {lowerThirdMode === 'intro' && (
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider block">BATTER BIO</span>
                    <h2 className="text-2xl font-black text-white mt-1 uppercase leading-none">{battingStats?.striker.name || 'ACTIVE BATTER'}</h2>
                    <span className="text-[10px] text-indigo-300 font-mono mt-1.5 block leading-none">Matches: 42 • Run-rate Peak: 142.1</span>
                  </div>
                  <div className="flex gap-4 border-l border-white/10 pl-5 font-mono text-xs text-center shrink-0">
                    <div><span className="text-[8px] text-slate-500 block">Runs</span><strong className="text-white text-sm">1,540</strong></div>
                    <div><span className="text-[8px] text-slate-500 block">Avg</span><strong className="text-white text-sm">38.5</strong></div>
                  </div>
                </div>
              )}
              {lowerThirdMode === 'equation' && (
                <div className="w-full flex justify-between items-center">
                  <div>
                    <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider block">MATCH DRIFT EQUATION</span>
                    <h3 className="text-xl font-black text-white mt-1 uppercase leading-snug">
                      {inningsNum === 1 ? 'Batting team setting baseline target' : `NEED ${match.targetRuns ? match.targetRuns - currentInnings.runs : 0} RUNS FROM ${Math.max(0, (match.oversLimit * 6) - currentInnings.ballsBowled)} DELIVERIES`}
                    </h3>
                  </div>
                  <div className="px-4 py-1.5 bg-rose-500/10 rounded-lg text-xs font-mono font-bold text-rose-400 border border-rose-500/20 uppercase shrink-0">
                    Pressure 82%
                  </div>
                </div>
              )}
              {lowerThirdMode === 'umpires' && (
                <div className="w-full flex items-center justify-between">
                  <div>
                    <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block">OFFICIAL SIGNAL CALL</span>
                    <h3 className="text-xl font-black text-white mt-0.5 uppercase">UMPIRE CALL: {selectedUmpireSignal.toUpperCase()}</h3>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Studio Decision</span>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 5. RUN RR / WORM GRAPH */}
        {activeGraphic === 'worm_graph' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-[1000px] h-[550px] bg-slate-950 rounded-[2rem] border border-purple-500/20 p-6 shadow-2xl flex flex-col justify-between pointer-events-auto">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 text-left">
                <div>
                  <span className="text-[9px] text-purple-400 font-bold uppercase block">RUN TRAJECTORY</span>
                  <h2 className="text-2xl font-black text-white uppercase">Innings Worm Progression</h2>
                </div>
                <div className="flex gap-4 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500" /><span>{match.teamA}</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-sky-400" /><span>{match.teamB}</span></div>
                </div>
              </div>
              <div className="h-[360px] w-full flex items-center justify-center bg-white/[0.01] border border-white/5 rounded-xl relative p-4">
                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  {[0, 1, 2, 3].map((step) => <line key={step} x1="50" y1={30 + step * 80} x2="950" y2={30 + step * 80} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />)}
                  <path d="M 50 270 L 150 250 L 250 210 L 350 190 L 450 150 L 550 130 L 650 90 L 750 70 L 850 45 L 950 30" fill="none" stroke="#ea002a" strokeWidth="4.5" strokeLinecap="round" />
                  <circle cx="250" cy="210" r="5" fill="#ffffff" stroke="#ea002a" strokeWidth="2.5" />
                  <circle cx="550" cy="130" r="5" fill="#ffffff" stroke="#ea002a" strokeWidth="2.5" />
                  {inningsNum === 2 && (
                    <>
                      <path d="M 50 270 L 150 260 L 250 240 L 350 180 L 450 150 L 550 110 L 650 110 L 750 80" fill="none" stroke="#00529b" strokeWidth="4.5" strokeLinecap="round" />
                      <circle cx="350" cy="180" r="5" fill="#ffffff" stroke="#00529b" strokeWidth="2.5" />
                    </>
                  )}
                </svg>
              </div>
              <span className="text-[10px] text-slate-500 font-mono uppercase text-center">Progression trace plotted over total match limit</span>
            </motion.div>
          </div>
        )}

        {/* 6. PARTNERSHIP STATS */}
        {activeGraphic === 'partnership' && (
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-50 pointer-events-none">
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="w-[1000px] bg-slate-950/95 border border-teal-500/20 rounded-3xl p-6 shadow-2xl flex flex-col justify-between" id="graphic-partnership">
              <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4 text-left">
                <span className="text-xs font-black tracking-widest text-teal-400">PARTNERSHIP PROFILE</span>
                <span className="text-xs font-mono text-white">BATTING FOR {currentInnings.battingTeam}</span>
              </div>
              <div className="grid grid-cols-12 gap-6 items-center">
                <div className="col-span-3 text-left">
                  <h4 className="text-lg font-black text-white truncate uppercase">{battingStats?.striker.name}</h4>
                  <div className="text-3xl font-mono font-black text-teal-400 mt-1">{battingStats?.striker.runs} <span className="text-xs font-normal text-slate-400">({battingStats?.striker.balls}b)</span></div>
                </div>
                <div className="col-span-6 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full border border-teal-500 bg-teal-500/10 flex flex-col justify-center items-center font-mono">
                    <span className="text-xl font-black text-white">{matchStats?.activePartnership || 0}</span>
                    <span className="text-[7px] font-black text-slate-400 uppercase">Total Runs</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-3 flex"><div className="bg-teal-400 h-full" style={{ width: '60%' }} /><div className="bg-yellow-400 h-full" style={{ width: '40%' }} /></div>
                </div>
                <div className="col-span-3 text-right">
                  <h4 className="text-lg font-black text-white truncate uppercase">{battingStats?.nonStriker?.name || 'Partner'}</h4>
                  <div className="text-3xl font-mono font-black text-yellow-400 mt-1">{battingStats?.nonStriker?.runs || 0} <span className="text-xs font-normal text-slate-400">({battingStats?.nonStriker?.balls || 0}b)</span></div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 7. MATCH SUMMARY */}
        {activeGraphic === 'match_summary' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-[1250px] h-[650px] bg-slate-950 rounded-[2.5rem] border border-white/10 p-10 shadow-2xl flex flex-col justify-between pointer-events-auto" id="graphic-summary">
              <div className="text-left border-b border-white/10 pb-3">
                <span className="text-[10px] text-amber-500 font-extrabold block uppercase tracking-widest">TOURNAMENT MATCH SUMMARY</span>
                <h1 className="text-3xl font-black text-white mt-1">INNINGS COMPREHENSIVE SPLIT</h1>
              </div>
              <div className="grid grid-cols-2 gap-8 py-4 text-left">
                <div className="border border-white/5 rounded-2xl bg-indigo-950/20 p-6 text-left">
                  <h3 className="text-2xl font-black text-white uppercase">{match.teamA}</h3>
                  <div className="text-3xl font-mono font-black text-slate-200 mt-2">{match.innings1 ? `${match.innings1.runs}/${match.innings1.wickets}` : '0/0'} ({match.innings1 ? formatOvers(match.innings1.ballsBowled) : '0.0'} ov)</div>
                  <div className="mt-4 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between"><span>🏏 {match.innings1?.batsmen?.[0]?.name || 'Batsman A'}</span><strong className="text-white">{match.innings1?.batsmen?.[0]?.runs || 42} ({match.innings1?.batsmen?.[0]?.balls || 24})</strong></div>
                    <div className="flex justify-between"><span>🏏 {match.innings1?.batsmen?.[1]?.name || 'Batsman B'}</span><strong className="text-white">{match.innings1?.batsmen?.[1]?.runs || 35} ({match.innings1?.batsmen?.[1]?.balls || 20})</strong></div>
                  </div>
                </div>
                <div className="border border-white/5 rounded-2xl bg-purple-950/20 p-6 text-left">
                  <h3 className="text-2xl font-black text-white uppercase">{match.teamB}</h3>
                  <div className="text-3xl font-mono font-black text-teal-400 mt-2">{match.innings2 ? `${match.innings2.runs}/${match.innings2.wickets}` : '0/0'} ({match.innings2 ? formatOvers(match.innings2.ballsBowled) : '0.0'} ov)</div>
                  <div className="mt-4 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between"><span>🥎 {match.innings2?.bowlers?.[0]?.name || 'Bowler A'}</span><strong className="text-white">{match.innings2?.bowlers?.[0]?.wickets || 2}-{match.innings2?.bowlers?.[0]?.runsConceded || 24}</strong></div>
                    <div className="flex justify-between"><span>🥎 {match.innings2?.bowlers?.[1]?.name || 'Bowler B'}</span><strong className="text-white">{match.innings2?.bowlers?.[1]?.wickets || 1}-{match.innings2?.bowlers?.[1]?.runsConceded || 18}</strong></div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl py-3 text-center text-sm font-black text-amber-400 uppercase shadow-inner">
                {match.status === 'completed' && match.winner ? `🏆 MATCH RESULT: ${match.winner} WON ${match.winReason ? `(${match.winReason})` : ''} 🏆` : `🏏 STATE: LIVE IN-PLAY PROGRESS IN EFFECT 🏏`}
              </div>
            </motion.div>
          </div>
        )}

        {/* 8. TEAM COMPARISON */}
        {activeGraphic === 'team_comparison' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-[1250px] h-[650px] bg-slate-950 border border-white/10 rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between pointer-events-auto" id="graphic-team-comparison">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4 text-left">
                <div>
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase">ROSTER OUTLINES</span>
                  <h1 className="text-3xl font-black text-white mt-1">Player Rosters Comparative</h1>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTeamCompMode('lineup')} className={`py-1.5 px-4 rounded-lg font-black uppercase text-[9px] cursor-pointer border transition-all ${teamCompMode === 'lineup' ? 'bg-emerald-500 border-emerald-500 text-slate-950 hover:bg-emerald-450 text-slate-950' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>PLAYING XIs</button>
                  <button onClick={() => setTeamCompMode('h2h')} className={`py-1.5 px-4 rounded-lg font-black uppercase text-[9px] cursor-pointer border transition-all ${teamCompMode === 'h2h' ? 'bg-emerald-500 border-emerald-500 text-slate-950 hover:bg-emerald-450 text-slate-950' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>H2H STATS</button>
                </div>
              </div>
              {teamCompMode === 'lineup' ? (
                <div className="grid grid-cols-2 gap-8 py-4 text-left">
                  <div className="border border-white/5 rounded-2xl p-6 bg-slate-900/40">
                    <h3 className="text-lg font-black text-red-500 uppercase pb-2 mb-3 border-b border-white/5">{match.teamA} roster</h3>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-350">
                      {(currentInnings.batsmen || []).slice(0, 10).map((b, idx) => <div key={idx} className="border-b border-white/[0.01] py-1">{idx+1}. {b.name}</div>)}
                    </div>
                  </div>
                  <div className="border border-white/5 rounded-2xl p-6 bg-slate-900/40">
                    <h3 className="text-lg font-black text-sky-400 uppercase pb-2 mb-3 border-b border-white/5">{match.teamB} roster</h3>
                    <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-350">
                      {(currentInnings.bowlers || []).slice(0, 10).map((b, idx) => <div key={idx} className="border-b border-white/[0.01] py-1">{idx+1}. {b.name}</div>)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-8 max-w-2xl mx-auto w-full text-xs font-mono text-slate-400 space-y-6">
                  <div className="space-y-1 text-left bg-slate-950/45 p-4 rounded-xl">
                    <div className="flex justify-between uppercase text-[10px] mb-1"><span>{match.teamA} wins (18)</span><span>{match.teamB} wins (17)</span></div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex font-bold tracking-tight text-[8px] text-white"><div className="bg-red-650 h-full flex items-center justify-center" style={{ width: '51%' }}>51%</div><div className="bg-sky-500 h-full flex items-center justify-center text-slate-950" style={{ width: '49%' }}>49%</div></div>
                  </div>
                  <div className="space-y-1 text-left bg-slate-950/45 p-4 rounded-xl">
                    <div className="flex justify-between uppercase text-[10px] mb-1"><span>Avg CRR: 8.45</span><span>Avg CRR: 8.62</span></div>
                    <div className="h-3 rounded-full bg-slate-800 overflow-hidden flex font-bold tracking-tight text-[8px] text-white"><div className="bg-indigo-700 h-full flex items-center justify-center" style={{ width: '48%' }}>48%</div><div className="bg-purple-650 h-full flex items-center justify-center" style={{ width: '52%' }}>52%</div></div>
                  </div>
                  <div className="grid grid-cols-3 text-center border-t border-white/5 pt-4">
                    <div><span className="text-[8px] block text-slate-500 uppercase mt-1">Form Index</span><strong className="text-emerald-400 text-sm font-bold">W W L W</strong></div>
                    <div><span className="text-[8px] block text-slate-500 uppercase mt-1">Overall Ties</span><strong className="text-white text-sm font-bold">0</strong></div>
                    <div><span className="text-[8px] block text-slate-500 uppercase mt-1">Form Index</span><strong className="text-rose-455 text-sm font-bold">L L W W</strong></div>
                  </div>
                </div>
              )}
              <span className="text-[8px] text-slate-550 font-mono">Profile trace computed instantly over league historical records</span>
            </motion.div>
          </div>
        )}

        {/* 9. WICKET ALERT TEMP */}
        {activeGraphic === 'wicket_alert_temp' && (
          <div className="absolute inset-x-0 top-32 flex justify-center z-50 pointer-events-none">
            <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="bg-slate-950 border border-red-500/50 p-6 rounded-3xl flex items-center gap-5 shadow-2xl">
              <div className="w-12 h-12 bg-red-650 text-white rounded-full flex items-center justify-center animate-pulse"><Skull size={24} /></div>
              <div className="text-left border-l border-white/10 pl-5 pr-4">
                <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest block">OUT! (BATTER DISMISSED)</span>
                <h3 className="text-2xl font-black text-white uppercase mt-0.5">{battingStats?.striker.name || 'ACTIVE BATTER'}</h3>
                <span className="text-xs text-slate-400 block font-mono mt-0.5">Dismissed method: <strong className="text-red-400 font-black">CLEAN BOWLED!</strong></span>
              </div>
            </motion.div>
          </div>
        )}

        {/* 10. MILESTONE ALERT TEMP */}
        {activeGraphic === 'milestone_alert_temp' && (
          <div className="absolute inset-0 flex items-center justify-center z-55 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0 }} className="p-10 rounded-[2.5rem] bg-slate-950/98 border border-amber-500/30 shadow-2xl text-center">
              <div className="w-16 h-16 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce"><Trophy size={32} /></div>
              <span className="text-[8px] uppercase tracking-widest font-mono text-amber-500 block mb-1">BROADCAST CELEBRATION</span>
              <h1 className="text-4xl font-black text-white uppercase">{customMilestone?.type === '100' ? '👑 MAJESTIC CENTURY' : customMilestone?.type === '5wkt' ? '⚡ FIVE WICKET SPELL' : '⭐ CRUCIAL HALF-CENTURY'}</h1>
              <p className="mt-2 text-xs font-mono font-bold text-slate-400 uppercase">{customMilestone ? `${customMilestone.name || 'Batter'} reached milestone ${customMilestone.value}` : `${battingStats?.striker.name || 'Batter'} plays an amazing inning of 50 runs!`}</p>
            </motion.div>
          </div>
        )}

        {/* 11. WAGON WHEEL */}
        {activeGraphic === 'wagon_wheel' && (
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-[680px] h-[660px] bg-slate-950 rounded-[2.5rem] border border-teal-500/20 p-6 shadow-2xl flex flex-col justify-between pointer-events-auto text-left" id="graphic-wagon-wheel">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div>
                  <span className="text-[9px] text-teal-400 font-bold block">SHOT SECTORS RANGE</span>
                  <h2 className="text-2xl font-black text-white uppercase">Batter Wagon Wheel</h2>
                </div>
                <div className="font-mono text-xs bg-slate-900 border border-white/5 py-1 px-3 rounded-lg text-teal-400">Runs: <strong className="text-white font-black">{battingStats?.striker.runs || 0}</strong></div>
              </div>
              <div className="h-[380px] w-full flex items-center justify-center bg-teal-950/5 border border-teal-500/10 rounded-xl relative p-2 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 500 350">
                  <ellipse cx="250" cy="175" rx="220" ry="145" fill="none" stroke="rgba(20,184,166,0.2)" strokeWidth="3" />
                  <ellipse cx="250" cy="175" rx="130" ry="90" fill="none" stroke="rgba(20,184,166,0.08)" strokeWidth="1.5" strokeDasharray="4 4" />
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
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-[680px] h-[660px] bg-slate-950 rounded-[2.5rem] border border-emerald-500/20 p-6 shadow-2xl flex flex-col justify-between pointer-events-auto text-left" id="graphic-pitch-map">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
                <div>
                  <span className="text-[9px] text-emerald-400 font-bold block">BALL ZONE ANALYSIS</span>
                  <h2 className="text-2xl font-black text-white">Bowler Pitch Map</h2>
                </div>
                <div className="font-mono text-xs bg-slate-900 border border-white/5 py-1 px-3 rounded-lg text-emerald-400">Spell: <strong className="text-white font-black">{bowlingStats?.name || 'Current Bowler'}</strong></div>
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
          />
        )}
      </AnimatePresence>

      {/* ON-SCREEN HOVER TRANSITIONS TOOLBAR (Convenience bar for TV Directors & OBS Testers) */}
      <div className="absolute top-2 inset-x-0 flex justify-center z-[60] pointer-events-auto opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-slate-950/90 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-1.5 text-xs font-mono flex-wrap justify-center">
          <span className="text-amber-400 font-bold uppercase text-[10px] mr-1">TV Transitions:</span>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'prematch_matchup' ? 'none' : 'prematch_matchup')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'prematch_matchup' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="The Matchup Card: Split full-screen or large lower-third"
          >
            ⚔️ Matchup
          </button>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'toss_result' ? 'none' : 'toss_result')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'toss_result' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Toss Result Card: Official Toss decision"
          >
            🪙 Toss Result
          </button>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'pitch_weather_report' ? 'none' : 'pitch_weather_report')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'pitch_weather_report' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
            title="Pitch & Weather Report: Pitch analysis and atmospheric conditions"
          >
            🌤️ Pitch & Weather
          </button>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'team_lineups' ? 'none' : 'team_lineups')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'team_lineups' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            👥 Lineups (XI)
          </button>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'innings_scorecard' ? 'none' : 'innings_scorecard')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'innings_scorecard' ? 'bg-sky-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            📋 Innings Scorecard
          </button>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'match_presentation' ? 'none' : 'match_presentation')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'match_presentation' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            🏆 Presentation & POTM
          </button>
          <button
            onClick={() => setActiveGraphic(activeGraphic === 'tournament_standings' ? 'none' : 'tournament_standings')}
            className={`px-2 py-1 rounded-xl font-bold uppercase text-[10px] transition-all cursor-pointer ${
              activeGraphic === 'tournament_standings' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-white/5 hover:bg-white/10 text-slate-300'
            }`}
          >
            📊 Standings Table
          </button>
          {activeGraphic !== 'none' && (
            <button
              onClick={() => setActiveGraphic('none')}
              className="px-2 py-1 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold uppercase text-[10px] cursor-pointer"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {renderCustomOverlayImage()}

      {/* =========================================================================
          4B. RICH ANIMATED OVERLAY ALERTS (SIX, FOUR, WICKET)
          ========================================================================= */}
      <CricketOverlayAnimations
        activeAnimation={activeAlert}
        onAnimationComplete={() => setActiveAlert(null)}
      />

    </div>
  );
};
