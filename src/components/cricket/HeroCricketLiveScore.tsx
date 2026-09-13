import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  Trophy, 
  ArrowRight, 
  Flame, 
  Eye, 
  EyeOff,
  Play, 
  Sparkles,
  ChevronRight,
  Shield,
  Activity,
  Layers,
  Send,
  Calendar,
  MapPin,
  Award,
  CheckCircle2
} from 'lucide-react';
import { MatchState } from './CricketScoreboard';
import { 
  getActiveMatch, 
  getLocalMatches, 
  isMatchDeleted, 
  markMatchDeleted, 
  unmarkMatchDeleted, 
  deleteLocalMatch,
  pruneDeletedMatchesFromStorage,
  saveMatchToRegistry,
  getAnyActiveOrRecentMatch,
  isDemoOrAIMatch,
  purgeCachedAIMatches
} from './cricketStorage';
import { db, rtdb, subscribeToDeletedMatches } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { ref as rtdbRef, onValue as rtdbOnValue } from 'firebase/database';
import { useAuth } from '../AuthContext';

export const HeroCricketLiveScore: React.FC = () => {
  const navigate = useNavigate();
  const { isScoreManager } = useAuth();
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [recentCompletedMatches, setRecentCompletedMatches] = useState<MatchState[]>([]);
  const [matchIndex, setMatchIndex] = useState<number>(0);
  const [completedIndex, setCompletedIndex] = useState<number>(0);
  const [viewTab, setViewTab] = useState<'live' | 'result'>('live');
  const [hiddenCardIds, setHiddenCardIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('cricket_hidden_result_card_ids') || '[]';
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [globalHideResultCards, setGlobalHideResultCards] = useState<boolean>(() => {
    return localStorage.getItem('cricket_hide_completed_result_cards') === 'true';
  });
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isHovered, setIsHovered] = useState<boolean>(false);

  // Safely open detailed scoreboard directly in the Homepage Spectator Scoreboard Section
  const handleOpenDetailScoreboard = (matchId?: string) => {
    let targetMatch = (matchId ? (liveMatches.find(m => m.id === matchId) || recentCompletedMatches.find(m => m.id === matchId)) : null) 
      || activeMatch 
      || (liveMatches.length > 0 ? liveMatches[0] : null) 
      || (recentCompletedMatches.length > 0 ? recentCompletedMatches[0] : null)
      || getActiveMatch();

    if (!targetMatch) {
      targetMatch = getAnyActiveOrRecentMatch();
    }

    const targetId = matchId || targetMatch?.id || '';

    if (targetMatch && targetMatch.id) {
      unmarkMatchDeleted(targetMatch.id);
      saveMatchToRegistry(targetMatch);
      try {
        localStorage.setItem('cricket_active_match', JSON.stringify(targetMatch));
        sessionStorage.setItem('last_selected_match_id', targetMatch.id);
      } catch (_) {}
    }

    if (targetId) {
      unmarkMatchDeleted(targetId);
      // Notify SpectatorScoreboardSection on the homepage to select this match
      window.dispatchEvent(new CustomEvent('cricket_select_match', { detail: { matchId: targetId } }));
    }

    // Smooth scroll down to the homepage spectator-hub section
    const spectatorEl = document.getElementById('spectator-hub');
    if (spectatorEl) {
      spectatorEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback if not on homepage
      navigate(`/#spectator-hub`);
      setTimeout(() => {
        const el = document.getElementById('spectator-hub');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  // Synchronize live and completed matches from LocalStorage, Firestore, and Realtime Database
  useEffect(() => {
    // Proactively purge any cached synthetic / AI bot / deleted match records
    purgeCachedAIMatches();

    // 1. Initial local match check
    const loadInitialLocal = () => {
      try {
        const activeLocal = getActiveMatch();
        const registry = getLocalMatches();
        const activeList: MatchState[] = [];
        const completedList: MatchState[] = [];

        if (activeLocal && !isMatchDeleted(activeLocal.id) && !isDemoOrAIMatch(activeLocal)) {
          if (activeLocal.status === 'live') {
            activeList.push(activeLocal);
          } else if (activeLocal.status === 'completed') {
            completedList.push(activeLocal);
          }
        }

        registry.forEach(m => {
          if (!isMatchDeleted(m.id) && !isDemoOrAIMatch(m)) {
            if (m.status === 'live' && !activeList.some(a => a.id === m.id)) {
              activeList.push(m);
            } else if (m.status === 'completed' && !completedList.some(c => c.id === m.id)) {
              completedList.push(m);
            }
          }
        });

        if (activeList.length > 0) {
          setLiveMatches(activeList);
        }
        if (completedList.length > 0) {
          completedList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setRecentCompletedMatches(completedList);
        }
      } catch (err) {
        console.warn('[HeroCricketLiveScore] Local check error:', err);
      }
    };

    loadInitialLocal();

    // 2. Real-time Firestore Listener
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(collection(db, 'cricket_matches'), (snapshot) => {
        const active: MatchState[] = [];
        const completed: MatchState[] = [];
        const remoteIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MatchState;
          const m = { ...data, id: data.id || docSnap.id };

          if (m.status === 'deleted' || (m as any).isDeleted === true || isMatchDeleted(m.id) || isDemoOrAIMatch(m)) {
            markMatchDeleted(m.id);
            return;
          }

          if (m.status === 'live' && !(m as any).isHidden && !(m as any).isBlocked) {
            active.push(m);
          } else if (m.status === 'completed' && !(m as any).isHidden && !(m as any).isBlocked) {
            completed.push(m);
          }
          remoteIds.add(m.id);
        });

        pruneDeletedMatchesFromStorage(remoteIds);

        // Include any active local matches that might be in progress locally
        const activeLocal = getActiveMatch();
        const registry = getLocalMatches();
        const localLive: MatchState[] = [];
        const localCompleted: MatchState[] = [];

        if (activeLocal && !(activeLocal as any).isDeleted && !isMatchDeleted(activeLocal.id) && !isDemoOrAIMatch(activeLocal)) {
          const isFreshDraft = !(activeLocal as any).syncedWithFirestore && (Date.now() - (activeLocal.updatedAt || 0) < 60000);
          if (remoteIds.has(activeLocal.id) || isFreshDraft) {
            if (activeLocal.status === 'live') localLive.push(activeLocal);
            else if (activeLocal.status === 'completed') localCompleted.push(activeLocal);
          } else {
            // Remotely deleted
            markMatchDeleted(activeLocal.id);
            try { localStorage.removeItem('cricket_active_match'); } catch (_) {}
          }
        }
        registry.forEach(lm => {
          if (!isMatchDeleted(lm.id) && !(lm as any).isDeleted && !isDemoOrAIMatch(lm)) {
            const isFreshDraft = !(lm as any).syncedWithFirestore && (Date.now() - (lm.updatedAt || 0) < 60000);
            if (remoteIds.has(lm.id) || isFreshDraft) {
              if (lm.status === 'live' && !localLive.some(a => a.id === lm.id)) {
                localLive.push(lm);
              } else if (lm.status === 'completed' && !localCompleted.some(c => c.id === lm.id)) {
                localCompleted.push(lm);
              }
            } else {
              // Remotely deleted
              markMatchDeleted(lm.id);
              deleteLocalMatch(lm.id);
            }
          }
        });

        const combinedLiveMap = new Map<string, MatchState>();
        active.forEach(m => combinedLiveMap.set(m.id, m));
        localLive.forEach(lm => {
          if (!combinedLiveMap.has(lm.id)) {
            combinedLiveMap.set(lm.id, lm);
          }
        });

        const combinedCompletedMap = new Map<string, MatchState>();
        completed.forEach(m => combinedCompletedMap.set(m.id, m));
        localCompleted.forEach(cm => {
          if (!combinedCompletedMap.has(cm.id)) {
            combinedCompletedMap.set(cm.id, cm);
          }
        });

        const combinedLive = Array.from(combinedLiveMap.values());
        combinedLive.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const combinedCompleted = Array.from(combinedCompletedMap.values());
        combinedCompleted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        setLiveMatches(combinedLive);
        setRecentCompletedMatches(combinedCompleted);
        setLastUpdated(Date.now());
      }, (err) => {
        console.warn('[HeroCricketLiveScore] Firestore stream:', err);
      });
    } catch (e) {
      console.warn('[HeroCricketLiveScore] Firestore setup:', e);
    }

    // 2.1 Tombstone Stream Listener for immediate cross-device deletion sync
    let unsubDeletedFirestore: (() => void) | null = null;
    try {
      unsubDeletedFirestore = subscribeToDeletedMatches((deletedIds) => {
        if (deletedIds && deletedIds.length > 0) {
          deletedIds.forEach(id => {
            markMatchDeleted(id);
            deleteLocalMatch(id);
          });
          setLiveMatches(prev => prev.filter(m => !deletedIds.includes(m.id)));
          setRecentCompletedMatches(prev => prev.filter(m => !deletedIds.includes(m.id)));
          setLastUpdated(Date.now());
        }
      });
    } catch (e) {
      console.warn('[HeroCricketLiveScore] Deleted matches stream setup:', e);
    }

    // 3. Real-time Database (RTDB) listener for active & completed updates
    let unsubRtdb: (() => void) | null = null;
    let unsubCompletedRtdb: (() => void) | null = null;
    try {
      const activeMatchRef = rtdbRef(rtdb, 'cricket_active_match');
      unsubRtdb = rtdbOnValue(activeMatchRef, (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          // RTDB active match cleared
          return;
        }
        if (val && isMatchDeleted(val.id)) {
          setLiveMatches(prev => prev.filter(m => m.id !== val.id));
          setLastUpdated(Date.now());
          return;
        }
        if (val && !isMatchDeleted(val.id) && !isDemoOrAIMatch(val)) {
          if (val.status === 'live') {
            setLiveMatches(prev => {
              const exists = prev.some(m => m.id === val.id);
              if (exists) {
                return prev.map(m => m.id === val.id ? { ...m, ...val } : m);
              }
              return [val, ...prev];
            });
          } else if (val.status === 'completed') {
            setLiveMatches(prev => prev.filter(m => m.id !== val.id));
            setRecentCompletedMatches(prev => {
              const exists = prev.some(m => m.id === val.id);
              if (exists) {
                return prev.map(m => m.id === val.id ? { ...m, ...val } : m);
              }
              return [val, ...prev];
            });
          }
          setLastUpdated(Date.now());
        }
      }, (error) => {
        console.warn('[HeroCricketLiveScore] RTDB sync warning:', error);
      });

      const completedMatchRef = rtdbRef(rtdb, 'cricket_last_completed_match');
      unsubCompletedRtdb = rtdbOnValue(completedMatchRef, (snapshot) => {
        const val = snapshot.val();
        if (val && !isMatchDeleted(val.id) && !isDemoOrAIMatch(val)) {
          const matchObj = val.match || val;
          if (isDemoOrAIMatch(matchObj)) return;
          setRecentCompletedMatches(prev => {
            const exists = prev.some(m => m.id === matchObj.id);
            if (exists) {
              return prev.map(m => m.id === matchObj.id ? { ...m, ...matchObj } : m);
            }
            return [matchObj, ...prev];
          });
          setLiveMatches(prev => prev.filter(m => m.id !== matchObj.id));
          setLastUpdated(Date.now());
        }
      });
    } catch (e) {
      console.warn('[HeroCricketLiveScore] RTDB sync listener:', e);
    }

    // 4. In-window CustomEvent & Storage listener
    const handleUpdate = (e: any) => {
      const match = e?.detail?.match as MatchState;
      if (match && !isMatchDeleted(match.id) && !isDemoOrAIMatch(match)) {
        if (match.status === 'live') {
          setLiveMatches(prev => {
            const filtered = prev.filter(m => m.id !== match.id);
            return [match, ...filtered];
          });
        } else if (match.status === 'completed') {
          setLiveMatches(prev => prev.filter(m => m.id !== match.id));
          setRecentCompletedMatches(prev => {
            const filtered = prev.filter(m => m.id !== match.id);
            return [match, ...filtered];
          });
        }
        setLastUpdated(Date.now());
      } else if (match && (match.status === 'deleted' || (match as any).isDeleted)) {
        setLiveMatches(prev => prev.filter(m => m.id !== match.id));
        setRecentCompletedMatches(prev => prev.filter(m => m.id !== match.id));
      }
    };

    const handleDeletedEvent = (e: any) => {
      const deletedId = e?.detail?.id;
      if (deletedId) {
        markMatchDeleted(deletedId);
        deleteLocalMatch(deletedId);
        setLiveMatches(prev => prev.filter(m => m.id !== deletedId));
        setRecentCompletedMatches(prev => prev.filter(m => m.id !== deletedId));
        setLastUpdated(Date.now());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'cricket_active_match' || e.key === 'cricket_matches_local_registry') {
        loadInitialLocal();
      }
      if (e.key === 'cricket_deleted_matches_registry') {
        try {
          const deletedMap = JSON.parse(e.newValue || '{}');
          const deletedKeys = Object.keys(deletedMap);
          if (deletedKeys.length > 0) {
            setLiveMatches(prev => prev.filter(m => !deletedKeys.includes(m.id)));
            setRecentCompletedMatches(prev => prev.filter(m => !deletedKeys.includes(m.id)));
            setLastUpdated(Date.now());
          }
        } catch (_) {}
      }
      if (e.key === 'cricket_hidden_result_card_ids' || e.key === 'cricket_hide_completed_result_cards') {
        try {
          const raw = localStorage.getItem('cricket_hidden_result_card_ids') || '[]';
          setHiddenCardIds(JSON.parse(raw));
          setGlobalHideResultCards(localStorage.getItem('cricket_hide_completed_result_cards') === 'true');
        } catch (_) {}
      }
    };

    const handleVisibilityChange = () => {
      try {
        const raw = localStorage.getItem('cricket_hidden_result_card_ids') || '[]';
        setHiddenCardIds(JSON.parse(raw));
        setGlobalHideResultCards(localStorage.getItem('cricket_hide_completed_result_cards') === 'true');
      } catch (_) {}
      setLastUpdated(Date.now());
    };

    window.addEventListener('cricket_match_updated', handleUpdate);
    window.addEventListener('cricket_match_deleted', handleDeletedEvent);
    window.addEventListener('cricket_match_result_visibility_changed', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      if (unsubFirestore) unsubFirestore();
      if (unsubDeletedFirestore) unsubDeletedFirestore();
      if (unsubRtdb) unsubRtdb();
      if (unsubCompletedRtdb) unsubCompletedRtdb();
      window.removeEventListener('cricket_match_updated', handleUpdate);
      window.removeEventListener('cricket_match_deleted', handleDeletedEvent);
      window.removeEventListener('cricket_match_result_visibility_changed', handleVisibilityChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const activeMatch = useMemo(() => {
    if (liveMatches.length === 0) return null;
    return liveMatches[matchIndex % liveMatches.length] || liveMatches[0];
  }, [liveMatches, matchIndex]);

  const unhiddenCompletedMatches = useMemo(() => {
    if (globalHideResultCards) return [];
    return recentCompletedMatches.filter(m => {
      if ((m as any).hideResultCard === true || (m as any).isHidden === true || (m as any).isBlocked === true) return false;
      if (hiddenCardIds.includes(m.id)) return false;
      return true;
    });
  }, [recentCompletedMatches, globalHideResultCards, hiddenCardIds, lastUpdated]);

  const activeCompletedMatch = useMemo(() => {
    if (unhiddenCompletedMatches.length === 0) return null;
    return unhiddenCompletedMatches[completedIndex % unhiddenCompletedMatches.length] || unhiddenCompletedMatches[0];
  }, [unhiddenCompletedMatches, completedIndex]);

  // Hide action for score managers directly on the homepage
  const handleHideCompletedMatch = async (matchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!matchId) return;
    setHiddenCardIds(prev => {
      const next = [...prev, matchId];
      try {
        localStorage.setItem('cricket_hidden_result_card_ids', JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    try {
      await setDoc(doc(db, 'cricket_matches', matchId), { hideResultCard: true, isHidden: true }, { merge: true });
    } catch (_) {}

    window.dispatchEvent(new CustomEvent('cricket_match_result_visibility_changed', { detail: { matchId, isHidden: true } }));
  };

  const handleShareResultWhatsApp = (m: MatchState, e: React.MouseEvent) => {
    e.stopPropagation();
    const winnerText = m.winner === 'Tie' ? 'Match Tied!' : `${m.winner} ${m.winReason || 'Won the Match'}`;
    const t1Overs = m.innings1 ? `${Math.floor(m.innings1.ballsBowled / 6)}.${m.innings1.ballsBowled % 6}` : '0.0';
    const t2Overs = m.innings2 ? `${Math.floor(m.innings2.ballsBowled / 6)}.${m.innings2.ballsBowled % 6}` : '0.0';
    const team1Score = m.innings1 ? `${m.innings1.battingTeam || m.teamA}: ${m.innings1.runs}/${m.innings1.wickets} (${t1Overs} ov)` : '';
    const team2Score = m.innings2 ? `${m.innings2.battingTeam || m.teamB}: ${m.innings2.runs}/${m.innings2.wickets} (${t2Overs} ov)` : '';
    const matchUrl = `${window.location.origin}/?matchId=${m.id}&spectator=true`;
    const shareText = `🏏 *CRICKET MATCH RESULT* 🏆\n*${m.teamA} vs ${m.teamB}*\n\n🔥 *Result:* ${winnerText}\n📊 ${team1Score}\n📊 ${team2Score}\n\n👉 *View Full Match Scorecard & Highlights:*\n${matchUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Derived scoring calculations
  const matchDetails = useMemo(() => {
    if (!activeMatch) return null;

    const innings = activeMatch.currentInningsNum === 1 ? activeMatch.innings1 : activeMatch.innings2;
    const battingTeam = innings?.battingTeam || activeMatch.teamA;
    const bowlingTeam = innings?.bowlingTeam || activeMatch.teamB;
    const runs = innings?.runs ?? 0;
    const wickets = innings?.wickets ?? 0;
    const balls = innings?.ballsBowled ?? 0;
    const completedOvers = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    const oversStr = `${completedOvers}.${ballsInOver}`;
    const maxOvers = activeMatch.oversLimit || 5;
    const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

    const isSecondInnings = activeMatch.currentInningsNum === 2;
    const target = isSecondInnings ? (activeMatch.innings1?.runs ?? 0) + 1 : 0;
    const runsNeeded = target - runs;
    const totalBalls = maxOvers * 6;
    const ballsRemaining = Math.max(0, totalBalls - balls);
    const rrr = isSecondInnings && ballsRemaining > 0 ? ((Math.max(0, runsNeeded) / ballsRemaining) * 6).toFixed(2) : null;

    // Striker Batsman
    const striker = innings?.batsmen && innings.strikerIndex !== undefined && innings.strikerIndex >= 0 
      ? innings.batsmen[innings.strikerIndex] 
      : null;

    // Non-Striker Batsman
    const nonStriker = innings?.batsmen && innings.nonStrikerIndex !== undefined && innings.nonStrikerIndex >= 0 
      ? innings.batsmen[innings.nonStrikerIndex] 
      : null;

    // Current Bowler
    const currentBowler = innings?.bowlers && innings.currentBowlerIndex !== undefined && innings.currentBowlerIndex >= 0 
      ? innings.bowlers[innings.currentBowlerIndex] 
      : null;

    // Recent deliveries in current over
    let recentBalls: string[] = [];
    if (balls > 0) {
      if ((innings as any)?.recentBalls && Array.isArray((innings as any).recentBalls)) {
        recentBalls = (innings as any).recentBalls.slice(-6).map((b: any) => {
          if (typeof b === 'string') return b;
          if (b?.isWicket) return 'W';
          if (b?.runs !== undefined) return `${b.runs}`;
          return '•';
        });
      } else if (innings?.history && Array.isArray(innings.history)) {
        recentBalls = innings.history.slice(-6).map(h => {
          if (h.isWicket) return 'W';
          if (h.isExtra) return h.extraType ? h.extraType.charAt(0).toUpperCase() : 'Ex';
          return `${h.runsScored}`;
        });
      }
    }

    return {
      innings,
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      balls,
      oversStr,
      maxOvers,
      crr,
      isSecondInnings,
      target,
      runsNeeded,
      ballsRemaining,
      rrr,
      striker,
      nonStriker,
      currentBowler,
      recentBalls
    };
  }, [activeMatch]);

  const hasLiveMatch = !!(activeMatch && activeMatch.status === 'live' && matchDetails);
  const hasCompletedMatch = !!activeCompletedMatch;

  // If neither a live match nor an unhidden completed match exists, hide hero card
  if (!hasLiveMatch && !hasCompletedMatch) {
    return null;
  }

  const showLiveCard = hasLiveMatch && (viewTab === 'live' || !hasCompletedMatch);

  // If a match is LIVE, render the ultra-modern, attractive broadcast scoreboard card
  if (showLiveCard && activeMatch && matchDetails) {
    const {
      battingTeam,
      bowlingTeam,
      runs,
      wickets,
      oversStr,
      maxOvers,
      crr,
      isSecondInnings,
      target,
      runsNeeded,
      ballsRemaining,
      rrr,
      striker,
      nonStriker,
      currentBowler
    } = matchDetails;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ touchAction: 'pan-y' }}
        className="w-full max-w-xl mb-6 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-white border border-emerald-500/40 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl ring-1 ring-white/10 select-none group touch-auto"
      >
        {/* Stadium ambient light beam */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Card Header: Live Pulse & Stadium Tag */}
        <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </span>
            <motion.span 
              animate={{ scale: [1, 1.04, 1], opacity: [0.92, 1, 0.92] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
            >
              <Radio size={11} className="animate-pulse text-emerald-400" />
              LIVE MATCH
            </motion.span>
          </div>

          <div className="flex items-center gap-2">
            {/* If completed matches also exist, show toggle pill */}
            {hasCompletedMatch && (
              <button
                type="button"
                onClick={() => setViewTab('result')}
                className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                title="View Latest Match Result Card"
              >
                <Trophy size={11} className="text-amber-400" />
                <span>Result ({unhiddenCompletedMatches.length})</span>
              </button>
            )}

            {liveMatches.length > 1 && (
              <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setMatchIndex(prev => (prev > 0 ? prev - 1 : liveMatches.length - 1))}
                  className="text-slate-400 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                  aria-label="Previous live match"
                >
                  ◀
                </button>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {matchIndex + 1}/{liveMatches.length}
                </span>
                <button
                  type="button"
                  onClick={() => setMatchIndex(prev => (prev + 1) % liveMatches.length)}
                  className="text-slate-400 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                  aria-label="Next live match"
                >
                  ▶
                </button>
              </div>
            )}

            {/* ONLY authenticated scoreboard manager can access manager console */}
            {isScoreManager && (
              <button
                type="button"
                onClick={() => navigate('/live/cricket-scoreboard')}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                title="Scorekeeper Management Console (Score Managers Only)"
              >
                <Shield size={11} className="text-emerald-400" />
                <span>Scorer Hub</span>
              </button>
            )}
          </div>
        </div>

        {/* Card Body: Live Teams & High-Impact Score */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {/* Team Crests & Names */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
                  <div className="w-full h-full bg-slate-950 rounded-[0.85rem] flex items-center justify-center font-black text-white text-base">
                    {battingTeam.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[8px] font-bold text-slate-950">
                  🏏
                </span>
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base sm:text-lg font-black text-white truncate tracking-tight">
                    {battingTeam}
                  </span>
                  <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    Batting
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-400 truncate">
                  vs <strong className="text-slate-300 font-bold">{bowlingTeam}</strong>
                </span>
              </div>
            </div>

            {/* Score Digits Display */}
            <div className="text-right shrink-0 flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 font-mono drop-shadow-[0_0_15px_rgba(16,185,129,0.35)]">
                  {runs}/{wickets}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-300 mt-0.5 font-mono">
                <span className="bg-white/10 px-2 py-0.5 rounded-md">{oversStr}/{maxOvers} Ov</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-300">CRR {crr}</span>
              </div>
            </div>
          </div>

          {/* Chase Equation / Target Bar (if 2nd innings) */}
          {isSecondInnings && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex flex-wrap items-center justify-between gap-1 shadow-inner">
              <span>Target: <strong className="text-white">{target}</strong></span>
              <span>
                {runsNeeded <= 0 ? (
                  <span className="text-emerald-400 font-black">🏆 Target Achieved!</span>
                ) : (
                  <>Need <strong className="text-white">{runsNeeded}</strong> runs in <strong className="text-white">{ballsRemaining}</strong> balls</>
                )}
              </span>
              {rrr && runsNeeded > 0 && (
                <span className="text-amber-200/90 font-mono text-[11px]">RRR: {rrr}</span>
              )}
            </div>
          )}

          {/* Active Batsmen (Striker & Non-Striker) Spotlight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
            {/* Striker */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-emerald-500/30">
              <div className="flex items-center gap-2 truncate">
                <span className="text-emerald-400 text-sm">🏏</span>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {striker?.name || 'Active Batsman'}*
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Striker</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {striker?.runs ?? 0} <span className="text-[10px] text-slate-400 font-normal">({striker?.balls ?? 0}b)</span>
              </span>
            </div>

            {/* Non-Striker */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-400 text-sm">🏏</span>
                <div className="flex flex-col truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {nonStriker?.name || 'Non-Striker'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Non-Striker</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {nonStriker?.runs ?? 0} <span className="text-[10px] text-slate-400 font-normal">({nonStriker?.balls ?? 0}b)</span>
              </span>
            </div>
          </div>

          {/* Bowler Details */}
          {currentBowler && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-teal-400 text-sm">🎯</span>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white text-xs truncate">
                    {currentBowler?.name || 'Active Bowler'}
                  </span>
                  <span className="text-[10px] text-teal-300/90 bg-teal-500/15 border border-teal-500/20 px-1.5 py-0.5 rounded">Current Bowler</span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-xs">
                {currentBowler?.wickets ?? 0}/{currentBowler?.runsConceded ?? 0}
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({currentBowler?.overs ?? '0.0'} ov)
                </span>
              </span>
            </div>
          )}

          {/* Modern Action Button: Direct to Homepage Spectator Scoreboard Section */}
          <div className="pt-2">
            <button
              id="hero-view-detail-scoreboard-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailScoreboard(activeMatch?.id);
              }}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-none"
              title="View full detailed scorecard in the Spectator Scoreboard Section"
            >
              <span>View Detail Scoreboard</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // 2. RENDER ENHANCED MATCH RESULT RECORD CARD
  if (activeCompletedMatch) {
    const m = activeCompletedMatch;
    const team1 = m.innings1?.battingTeam || m.teamA || 'Team 1';
    const team2 = m.innings2?.battingTeam || m.teamB || 'Team 2';

    const team1Runs = m.innings1?.runs ?? 0;
    const team1Wickets = m.innings1?.wickets ?? 0;
    const team1Balls = m.innings1?.ballsBowled ?? 0;
    const team1Overs = `${Math.floor(team1Balls / 6)}.${team1Balls % 6}`;

    const team2Runs = m.innings2?.runs ?? 0;
    const team2Wickets = m.innings2?.wickets ?? 0;
    const team2Balls = m.innings2?.ballsBowled ?? 0;
    const team2Overs = `${Math.floor(team2Balls / 6)}.${team2Balls % 6}`;

    const winnerText = m.winner === 'Tie' ? 'Match Tied!' : `${m.winner} ${m.winReason || 'Won the Match'}`;
    const isTeam1Winner = m.winner && (m.winner.toLowerCase() === team1.toLowerCase() || m.winner.toLowerCase() === (m.teamA || '').toLowerCase());
    const isTeam2Winner = m.winner && (m.winner.toLowerCase() === team2.toLowerCase() || m.winner.toLowerCase() === (m.teamB || '').toLowerCase());

    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full max-w-xl mb-6 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 text-white border border-amber-500/40 shadow-2xl shadow-amber-950/30 backdrop-blur-xl ring-1 ring-white/10 select-none group"
      >
        {/* Ambient Trophy Gold Glow */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* 16:9 Match Banner (if uploaded by organizer or scorekeeper) */}
        {m.matchBannerUrl ? (
          <div className="relative w-full aspect-[16/9] max-h-48 overflow-hidden bg-slate-900 border-b border-white/10">
            <img 
              src={m.matchBannerUrl} 
              alt={`${m.teamA} vs ${m.teamB}`} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            
            {/* Top badges on banner */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-lg">
                <Trophy size={12} className="text-amber-400" />
                MATCH RESULT
              </span>

              <div className="flex items-center gap-2">
                {hasLiveMatch && (
                  <button
                    type="button"
                    onClick={() => setViewTab('live')}
                    className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-md"
                    title="Switch to Active Live Match"
                  >
                    <Radio size={10} className="animate-pulse" />
                    <span>Live Match</span>
                  </button>
                )}

                {unhiddenCompletedMatches.length > 1 && (
                  <div className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/20">
                    <button
                      type="button"
                      onClick={() => setCompletedIndex(prev => (prev > 0 ? prev - 1 : unhiddenCompletedMatches.length - 1))}
                      className="text-slate-300 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                    >
                      ◀
                    </button>
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {completedIndex + 1}/{unhiddenCompletedMatches.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompletedIndex(prev => (prev + 1) % unhiddenCompletedMatches.length)}
                      className="text-slate-300 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                    >
                      ▶
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Card Header without banner */
          <div className="px-5 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
                <Trophy size={12} className="text-amber-400" />
                MATCH RESULT
              </span>
              {m.oversLimit && (
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                  {m.oversLimit} Overs
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasLiveMatch && (
                <button
                  type="button"
                  onClick={() => setViewTab('live')}
                  className="px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                  title="Switch to Active Live Match"
                >
                  <Radio size={10} className="animate-pulse text-emerald-400" />
                  <span>Live ({liveMatches.length})</span>
                </button>
              )}

              {unhiddenCompletedMatches.length > 1 && (
                <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCompletedIndex(prev => (prev > 0 ? prev - 1 : unhiddenCompletedMatches.length - 1))}
                    className="text-slate-400 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                  >
                    ◀
                  </button>
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    {completedIndex + 1}/{unhiddenCompletedMatches.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompletedIndex(prev => (prev + 1) % unhiddenCompletedMatches.length)}
                    className="text-slate-400 hover:text-white text-[10px] px-1 border-none bg-transparent cursor-pointer font-bold"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Body: Result Highlights & Head-to-Head Scores */}
        <div className="p-5 space-y-4">
          {/* Winner Headline Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/35 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                <Trophy size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-black text-amber-400 tracking-widest block">
                  Official Match Result
                </span>
                <h4 className="text-sm sm:text-base font-black text-white truncate tracking-tight">
                  {winnerText}
                </h4>
              </div>
            </div>
            {m.date && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                  <Calendar size={11} className="text-slate-500" />
                  {m.date}
                </span>
              </div>
            )}
          </div>

          {/* Head to Head Innings Score Comparison */}
          <div className="space-y-2.5">
            {/* Team 1 Score Row */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              isTeam1Winner 
                ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-950/20' 
                : 'bg-white/[0.03] border-white/5'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs text-white shrink-0">
                  {team1.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-bold text-white truncate">{team1}</span>
                    {isTeam1Winner && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm shrink-0">
                        🏆 WINNER
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1st Innings</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg sm:text-xl font-black font-mono text-white">
                  {team1Runs}/{team1Wickets}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {team1Overs} / {m.oversLimit || 5} ov
                </div>
              </div>
            </div>

            {/* Team 2 Score Row */}
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
              isTeam2Winner 
                ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-950/20' 
                : 'bg-white/[0.03] border-white/5'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-black text-xs text-white shrink-0">
                  {team2.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-sm font-bold text-white truncate">{team2}</span>
                    {isTeam2Winner && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-sm shrink-0">
                        🏆 WINNER
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">2nd Innings</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg sm:text-xl font-black font-mono text-white">
                  {team2Runs}/{team2Wickets}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {team2Overs} / {m.oversLimit || 5} ov
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar: Detail Scoreboard, WhatsApp Share & Scorekeeper Hide Toggle */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              id="hero-view-detail-result-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailScoreboard(m.id);
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 cursor-pointer border-none"
              title="View full detailed scorecard for this concluded match"
            >
              <span>View Full Scorecard</span>
              <ArrowRight size={14} />
            </button>

            <button
              id="hero-share-result-whatsapp-btn"
              type="button"
              onClick={(e) => handleShareResultWhatsApp(m, e)}
              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/40 cursor-pointer border-none shrink-0"
              title="Share match result on WhatsApp (includes match banner automatically)"
            >
              <Send size={14} className="text-emerald-200" />
              <span>WhatsApp</span>
            </button>

            {isScoreManager && (
              <button
                type="button"
                onClick={(e) => handleHideCompletedMatch(m.id, e)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Hide this Match Result Card from Homepage (Scorekeeper Only)"
              >
                <EyeOff size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // If NO match is currently live or visible:
  return null;
};

