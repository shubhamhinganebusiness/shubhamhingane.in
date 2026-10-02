import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Megaphone } from 'lucide-react';
import { 
  getLocalMatches, 
  isMatchDeleted, 
  isDemoOrAIMatch, 
  markMatchDeleted 
} from './cricketStorage';
import { subscribeToCricketMatchesCollection } from '../../lib/firebase';
import { useSpectatorSliderImages } from './useSpectatorSliderImages';
import { calculateActiveOverNumber, isDeliveryInTargetOver, getDeliveryPillDetails } from './modules/overDeliveryUtils';
import type { MatchState } from './CricketScoreboard';

export const LiveMatchGlobalBanner: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<MatchState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { adminAds } = useSpectatorSliderImages();

  // Hide on dedicated cricket arena / scoring pages and homepage / hero section to prevent clutter
  const isDedicatedCricketScreen = useMemo(() => {
    const p = location.pathname;
    return (
      p === '/' ||
      p === '' ||
      p.startsWith('/live/cricket-') ||
      p.startsWith('/cricket-') ||
      p.startsWith('/completed-matches') ||
      p.startsWith('/live/completed-matches')
    );
  }, [location.pathname]);

  // Real-time listener for any match flagged as 'live' in Firestore
  useEffect(() => {
    // Initial local cache population
    try {
      const local = (getLocalMatches() as any[]).filter(
        m => m.status === 'live' && !isMatchDeleted(m.id) && !m.isHidden && !m.isBlocked && !m.isDeleted && !isDemoOrAIMatch(m)
      );
      if (local.length > 0) {
        setLiveMatches(local as MatchState[]);
      }
    } catch (_) {}

    const unsub = subscribeToCricketMatchesCollection((snapshot: any) => {
      const active: MatchState[] = [];
      const remoteIds = new Set<string>();
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data() as MatchState;
        const m = { ...data, id: data.id || docSnap.id };
        if (m.status === 'deleted' || (m as any).isDeleted === true) {
          markMatchDeleted(m.id);
          return;
        }
        if (isMatchDeleted(m.id) || isDemoOrAIMatch(m as any)) {
          return;
        }
        if (m.status === 'live' && !m.isHidden && !m.isBlocked) {
          active.push(m);
        }
        remoteIds.add(m.id);
      });
      // Sort most recently updated first
      active.sort((a, b) => ((b as any).updatedAt || 0) - ((a as any).updatedAt || 0));
      setLiveMatches(active);
    }, (err: any) => {
      console.warn('[LiveMatchGlobalBanner] Snapshot error:', err);
    });

    const handleDeletedEvent = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        queueMicrotask(() => {
          setLiveMatches(prev => {
            if (!prev.some(m => m.id === id)) return prev;
            return prev.filter(m => m.id !== id);
          });
        });
      }
    };
    window.addEventListener('cricket_match_deleted', handleDeletedEvent);

    return () => {
      unsub();
      window.removeEventListener('cricket_match_deleted', handleDeletedEvent);
    };
  }, []);

  if (isDedicatedCricketScreen || isDismissed || liveMatches.length === 0) {
    return null;
  }

  const activeMatch = liveMatches[currentIndex] || liveMatches[0];
  if (!activeMatch) return null;

  const innings = activeMatch.currentInningsNum === 1 ? activeMatch.innings1 : activeMatch.innings2;
  const battingTeam = innings?.battingTeam || activeMatch.teamA;
  const runs = innings?.runs ?? 0;
  const wickets = innings?.wickets ?? 0;
  const balls = innings?.ballsBowled ?? 0;
  const oversStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const maxOvers = activeMatch.oversLimit || 5;
  const crr = balls > 0 ? ((runs / balls) * 6).toFixed(2) : '0.00';

  const isSecondInnings = activeMatch.currentInningsNum === 2;
  const target = isSecondInnings ? (activeMatch.innings1?.runs ?? 0) + 1 : 0;
  const runsNeeded = target - runs;
  const totalBalls = maxOvers * 6;
  const ballsRemaining = Math.max(0, totalBalls - balls);
  const rrr = isSecondInnings && ballsRemaining > 0 ? ((Math.max(0, runsNeeded) / ballsRemaining) * 6).toFixed(2) : null;

  const striker = innings?.batsmen && innings.strikerIndex !== undefined ? innings.batsmen[innings.strikerIndex] : null;
  const currentBowler = innings?.bowlers && innings.currentBowlerIndex !== undefined ? innings.bowlers[innings.currentBowlerIndex] : null;
  const activeOverIdx = calculateActiveOverNumber(
    balls,
    activeMatch.status,
    maxOvers,
    wickets,
    activeMatch.isSuperOver,
    (activeMatch as any).superOverWicketLimit
  );

  const recentBalls = (() => {
    if (Array.isArray(innings?.commentaryList) && innings.commentaryList.length > 0) {
      const fromComm = innings.commentaryList
        .filter((c: any) => isDeliveryInTargetOver(c, activeOverIdx))
        .slice(0, 16)
        .reverse()
        .map((c: any) => getDeliveryPillDetails(c).label)
        .filter(Boolean);
      if (fromComm.length > 0) return fromComm;
    }
    const rb = Array.isArray((innings as any)?.recentBalls) ? (innings as any).recentBalls : [];
    if (rb.length === 0) return [];
    const legalInOver = balls % 6;
    if (legalInOver === 0 && activeMatch.status !== 'completed') {
      const trailingExtras: string[] = [];
      for (let i = rb.length - 1; i >= 0; i--) {
        const item = String(rb[i] || '').toUpperCase();
        if (item.includes('NB') || item.includes('WD')) {
          trailingExtras.unshift(rb[i]);
        } else {
          break;
        }
      }
      return trailingExtras;
    }
    const targetLegal = legalInOver === 0 ? 6 : legalInOver;
    let legalSeen = 0;
    const result: string[] = [];
    for (let i = rb.length - 1; i >= 0; i--) {
      const item = String(rb[i] || '').toUpperCase();
      const isExtra = item.includes('NB') || item.includes('WD');
      if (!isExtra) {
        legalSeen++;
      }
      result.unshift(rb[i]);
      if (legalSeen >= targetLegal) {
        while (i - 1 >= 0) {
          const prevItem = String(rb[i - 1] || '').toUpperCase();
          if (prevItem.includes('NB') || prevItem.includes('WD')) {
            i--;
            result.unshift(rb[i]);
          } else {
            break;
          }
        }
        break;
      }
    }
    return result;
  })();

  const handleNavigateToMatch = () => {
    navigate(`/cricket-details?matchId=${encodeURIComponent(activeMatch.id)}`);
  };

  return (
    <div id="live-match-global-banner" className="sticky top-0 z-50 w-full bg-slate-950/95 backdrop-blur-md border-b border-emerald-500/30 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Live indicator and Match Info */}
        <div 
          onClick={handleNavigateToMatch}
          className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer group"
          title="Click to view live match scorecard"
        >
          {activeMatch.isSuperOver ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-[10px] tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              ⚡ SUPER OVER {(activeMatch as any).superOverNumber || 1}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black text-[10px] tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              LIVE MATCH
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
              <span className="text-white">{activeMatch.teamA}</span>
              <span className="text-slate-400 text-[11px]">vs</span>
              <span className="text-white">{activeMatch.teamB}</span>
            </div>
            {activeMatch.tournamentName && (
              <span className="text-[10px] font-semibold text-amber-400/90 truncate max-w-[160px] sm:max-w-[240px] flex items-center gap-1">
                {activeMatch.tournamentLogo && (
                  <img
                    src={activeMatch.tournamentLogo}
                    alt="Logo"
                    className="w-3.5 h-3.5 object-cover rounded-full border border-amber-400/40 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span>🏆 {activeMatch.tournamentName}</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Live Score, Overs, and Equations */}
        <div 
          onClick={handleNavigateToMatch}
          className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs cursor-pointer"
          title="Click to view live match scorecard"
        >
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-2 shadow-inner">
            <span>{battingTeam}:</span>
            <span className="text-white text-sm sm:text-base font-black tracking-tight">{runs}/{wickets}</span>
            <span className="text-emerald-400 text-[11px] font-medium">({oversStr}/{maxOvers} ov)</span>
            <span className="hidden sm:inline text-slate-400 text-[10px] pl-1.5 border-l border-emerald-500/30">CRR {crr}</span>
          </div>

          {/* Equation if chase */}
          {isSecondInnings && (
            <div className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold">
              <span>Target {target}</span>
              <span className="text-slate-300">•</span>
              <span>Need {runsNeeded} from {ballsRemaining}b</span>
              {rrr && <span className="text-amber-200">({rrr} rpo)</span>}
            </div>
          )}

          {/* Striker & Bowler summary */}
          <div className="hidden lg:flex items-center gap-3 text-slate-300 text-[11px]">
            {striker && (
              <span className="flex items-center gap-1">
                🏏 <strong className="text-white font-semibold">{striker.name}</strong> {striker.runs}*({striker.balls})
              </span>
            )}
            {currentBowler && (
              <span className="flex items-center gap-1">
                🥎 <strong className="text-white font-semibold">{currentBowler.name}</strong> {currentBowler.wickets}/{currentBowler.runsConceded}
              </span>
            )}
          </div>

          {/* Recent balls pill */}
          {recentBalls.length > 0 && (
            <div className="hidden xl:flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-medium mr-1">Over:</span>
              {recentBalls.map((b: any, idx: number) => {
                const isW = typeof b === 'string' ? b.includes('W') : b?.isWicket;
                const isSix = b === '6' || b?.runs === 6;
                const isFour = b === '4' || b?.runs === 4;
                return (
                  <span
                    key={idx}
                    className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black ${
                      isW
                        ? 'bg-rose-600 text-white'
                        : isSix
                        ? 'bg-purple-600 text-white'
                        : isFour
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {typeof b === 'string' ? b : (b.text || b.runs || 0)}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Actions (Switcher, Ads, Dismiss) */}
        <div className="flex items-center gap-2 shrink-0">
          {liveMatches.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : liveMatches.length - 1))}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Previous Live Match"
              >
                ◀
              </button>
              <span className="px-1 font-bold text-amber-300">
                {currentIndex + 1}/{liveMatches.length}
              </span>
              <button
                onClick={() => setCurrentIndex((prev) => (prev < liveMatches.length - 1 ? prev + 1 : 0))}
                className="px-1.5 py-0.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Next Live Match"
              >
                ▶
              </button>
            </div>
          )}

          {adminAds.length > 0 && (
            <button
              onClick={handleNavigateToMatch}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              title="View Sponsor Advertisements & Match Details"
            >
              <Megaphone size={12} className="text-amber-400 animate-pulse" />
              <span>Ads ({adminAds.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Hide live banner for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchGlobalBanner;
