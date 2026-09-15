import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, ArrowLeft, Search, Filter, Calendar, Award, 
  Eye, Share2, Sparkles, Send, Download, ExternalLink,
  ChevronRight, Activity, Flame, Shield, ArrowUpDown, 
  CheckCircle2, RefreshCw, LayoutGrid, List, Table, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { MatchState } from '../components/cricket/CricketScoreboard';
import { CompletedMatchCard, SponsorAdSlide } from '../components/cricket/CompletedRecordsSlider';
import { DEFAULT_PRESET_SPONSORS } from '../utils/cricketSponsorsStorage';

export const CompletedMatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'wins' | 'ties'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'high_score' | 'low_score'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'compact' | 'table'>('cards');
  const [adminAds, setAdminAds] = useState<SponsorAdSlide[]>([]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch all completed matches in real-time from Firestore (spectator view: only active public records)
  useEffect(() => {
    let unsubscribeMatches: (() => void) | undefined;
    let unsubscribeAds: (() => void) | undefined;

    try {
      const matchesCol = collection(db, 'cricket_matches');
      unsubscribeMatches = onSnapshot(matchesCol, (snapshot) => {
        const loaded: MatchState[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const matchObj: MatchState = {
            ...data,
            id: docSnap.id
          };
          // Filter for public completed matches: not hidden, not blocked, and not deleted
          if (
            matchObj.status === 'completed' &&
            !matchObj.isHidden &&
            !matchObj.isBlocked &&
            !(matchObj as any).hideResultCard &&
            !(matchObj as any).isDeleted
          ) {
            loaded.push(matchObj);
          }
        });

        // If firestore returned results, update state
        if (loaded.length > 0) {
          setMatches(loaded);
        } else {
          // Fallback to local storage registry if Firestore is empty or offline
          try {
            const rawLocal = localStorage.getItem('cricket_matches_local_registry');
            if (rawLocal) {
              const localParsed = JSON.parse(rawLocal);
              if (Array.isArray(localParsed)) {
                const completedLocal = localParsed.filter(
                  (m: any) => m.status === 'completed' && !m.isHidden && !m.isBlocked && !m.hideResultCard && !m.isDeleted
                );
                setMatches(completedLocal);
              }
            }
          } catch (_) {}
        }
        setLoading(false);
      }, (error) => {
        console.warn('CompletedMatchesPage snapshot notice:', error?.message || error);
        // Fallback to local registry
        try {
          const rawLocal = localStorage.getItem('cricket_matches_local_registry');
          if (rawLocal) {
            const localParsed = JSON.parse(rawLocal);
            if (Array.isArray(localParsed)) {
              const completedLocal = localParsed.filter(
                (m: any) => m.status === 'completed' && !m.isHidden && !m.isBlocked && !m.hideResultCard && !m.isDeleted
              );
              setMatches(completedLocal);
            }
          }
        } catch (_) {}
        setLoading(false);
      });
    } catch (e) {
      console.warn('Could not attach Firestore listener:', e);
      setLoading(false);
    }

    // Fetch sponsor ads for banners
    try {
      const adsCol = collection(db, 'spectator_slider_images');
      const adsQuery = query(adsCol, orderBy('order', 'asc'));
      unsubscribeAds = onSnapshot(adsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const adsData: SponsorAdSlide[] = [];
          snapshot.forEach((docSnap) => {
            const d = docSnap.data();
            adsData.push({
              id: docSnap.id,
              imageUrl: d.imageUrl || '',
              title: d.title || 'Official Sponsor',
              linkUrl: d.linkUrl || '',
              order: typeof d.order === 'number' ? d.order : 999
            });
          });
          const valid = adsData.filter(a => a.imageUrl && a.imageUrl.trim().length > 0);
          if (valid.length > 0) {
            setAdminAds(valid);
          } else {
            setAdminAds(DEFAULT_PRESET_SPONSORS);
          }
        } else {
          setAdminAds(DEFAULT_PRESET_SPONSORS);
        }
      }, () => {
        setAdminAds(DEFAULT_PRESET_SPONSORS);
      });
    } catch (_) {
      setAdminAds(DEFAULT_PRESET_SPONSORS);
    }

    return () => {
      if (unsubscribeMatches) unsubscribeMatches();
      if (unsubscribeAds) unsubscribeAds();
    };
  }, []);

  // Filter and sort completed matches
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Outcome filter
    if (outcomeFilter === 'wins') {
      result = result.filter(m => m.winner && m.winner !== 'Tie');
    } else if (outcomeFilter === 'ties') {
      result = result.filter(m => m.winner === 'Tie');
    }

    // Search query filter
    const queryStr = searchQuery.trim().toLowerCase();
    if (queryStr) {
      result = result.filter(m => {
        const t1 = (m.teamA || '').toLowerCase();
        const t2 = (m.teamB || '').toLowerCase();
        const win = (m.winner || '').toLowerCase();
        const venue = ((m as any).venue || (m as any).groundName || '').toLowerCase();
        const tourney = ((m as any).tournamentName || '').toLowerCase();
        const date = (m.date || '').toLowerCase();
        return t1.includes(queryStr) || 
               t2.includes(queryStr) || 
               win.includes(queryStr) || 
               venue.includes(queryStr) || 
               tourney.includes(queryStr) ||
               date.includes(queryStr);
      });
    }

    // Sort order
    result.sort((a, b) => {
      const parseDate = (d?: string) => (d ? new Date(d).getTime() : 0);
      const totalRuns = (m: MatchState) => {
        const r1 = m.innings1?.runs || 0;
        const r2 = m.innings2?.runs || 0;
        return r1 + r2;
      };

      if (sortBy === 'newest') {
        const timeB = (b as any).updatedAt || parseDate(b.date);
        const timeA = (a as any).updatedAt || parseDate(a.date);
        return timeB - timeA;
      } else if (sortBy === 'oldest') {
        const timeB = (b as any).updatedAt || parseDate(b.date);
        const timeA = (a as any).updatedAt || parseDate(a.date);
        return timeA - timeB;
      } else if (sortBy === 'high_score') {
        return totalRuns(b) - totalRuns(a);
      } else if (sortBy === 'low_score') {
        return totalRuns(a) - totalRuns(b);
      }
      return 0;
    });

    return result;
  }, [matches, outcomeFilter, searchQuery, sortBy]);

  // Aggregate statistics across all displayed matches
  const stats = useMemo(() => {
    let totalRuns = 0;
    let totalWickets = 0;
    let highestScore = 0;
    let highestScoreTeam = '';
    let totalSixes = 0;
    let totalFours = 0;

    matches.forEach(m => {
      const inn1 = m.innings1;
      const inn2 = m.innings2;
      if (inn1) {
        totalRuns += inn1.runs || 0;
        totalWickets += inn1.wickets || 0;
        if ((inn1.runs || 0) > highestScore) {
          highestScore = inn1.runs;
          highestScoreTeam = inn1.battingTeam || m.teamA;
        }
        inn1.battingStats?.forEach(b => {
          totalFours += b.fours || 0;
          totalSixes += b.sixes || 0;
        });
      }
      if (inn2) {
        totalRuns += inn2.runs || 0;
        totalWickets += inn2.wickets || 0;
        if ((inn2.runs || 0) > highestScore) {
          highestScore = inn2.runs;
          highestScoreTeam = inn2.battingTeam || m.teamB;
        }
        inn2.battingStats?.forEach(b => {
          totalFours += b.fours || 0;
          totalSixes += b.sixes || 0;
        });
      }
    });

    return {
      totalMatches: matches.length,
      totalRuns,
      totalWickets,
      highestScore,
      highestScoreTeam,
      totalFours,
      totalSixes
    };
  }, [matches]);

  const handleSelectMatch = (matchId: string) => {
    window.location.hash = `#/cricket-details?matchId=${matchId}`;
  };

  const handleShareWhatsApp = (m: MatchState, e: React.MouseEvent) => {
    e.stopPropagation();
    const winnerText = m.winner === 'Tie' ? 'Match Tied!' : `${m.winner} ${m.winReason || 'Won the Match'}`;
    const t1Overs = m.innings1 ? `${Math.floor(m.innings1.ballsBowled / 6)}.${m.innings1.ballsBowled % 6}` : '0.0';
    const t2Overs = m.innings2 ? `${Math.floor(m.innings2.ballsBowled / 6)}.${m.innings2.ballsBowled % 6}` : '0.0';
    const team1Score = m.innings1 ? `${m.innings1.battingTeam || m.teamA}: ${m.innings1.runs}/${m.innings1.wickets} (${t1Overs} ov)` : '';
    const team2Score = m.innings2 ? `${m.innings2.battingTeam || m.teamB}: ${m.innings2.runs}/${m.innings2.wickets} (${t2Overs} ov)` : '';
    const origin = window.location.origin.includes('ais-dev-') ? window.location.origin.replace('ais-dev-', 'ais-pre-') : window.location.origin;
    const matchUrl = `${origin}/#/cricket-details?matchId=${m.id}`;

    const text = `🏆 *GULLY CRICKET RESULT ARCHIVE*\n\n` +
      `🏏 *${m.teamA}* vs *${m.teamB}*\n` +
      `${team1Score ? `🔹 ${team1Score}\n` : ''}` +
      `${team2Score ? `🔹 ${team2Score}\n` : ''}` +
      `🎖️ *Result:* ${winnerText}\n` +
      `📅 *Date:* ${m.date || 'Recent Match'}\n\n` +
      `📊 View complete digital scorecard:\n${matchUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white pb-20">
      {/* Top Header & Navigation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 shadow-xl sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Left Title & Back Nav */}
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700/60 shadow-sm cursor-pointer"
                title="Back to Homepage"
                id="btn-back-home"
              >
                <ArrowLeft size={16} />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Trophy size={14} className="animate-pulse" />
                  </span>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                    Gully Cricket Completed Matches Archive
                  </h1>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Official tournament record registry & comprehensive scorecards
                </p>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Link
                to="/live/cricket-scoreboard"
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 border border-slate-700/80 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm no-underline"
                id="btn-goto-scoreboard"
              >
                <Activity size={12} />
                <span>Scoreboard</span>
              </Link>

              <Link
                to="/cricket-details"
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:shadow-emerald-500/20 transition-all no-underline"
                id="btn-goto-spectator"
              >
                <Eye size={12} />
                <span>Spectator Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Aggregate Tournament Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Matches</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-400 font-mono">{stats.totalMatches}</span>
              <span className="text-[9px] text-slate-500 font-semibold">concluded</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Runs</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-400 font-mono">{stats.totalRuns}</span>
              <span className="text-[9px] text-slate-500 font-semibold">scored</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Wickets</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-rose-400 font-mono">{stats.totalWickets}</span>
              <span className="text-[9px] text-slate-500 font-semibold">fallen</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Highest Total</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-cyan-400 font-mono">{stats.highestScore || '-'}</span>
              <span className="text-[9px] text-slate-400 font-bold truncate max-w-[80px]">
                {stats.highestScoreTeam}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Sixes</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-purple-400 font-mono">{stats.totalSixes}</span>
              <span className="text-[9px] text-slate-500 font-semibold">maximums</span>
            </div>
          </div>

          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Fours</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-teal-400 font-mono">{stats.totalFours}</span>
              <span className="text-[9px] text-slate-500 font-semibold">boundaries</span>
            </div>
          </div>
        </div>

        {/* Filter and Control Toolbar */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams, winners, venues..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-sans"
              id="input-search-completed-matches"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold px-1 cursor-pointer border-none bg-transparent"
              >
                ✕
              </button>
            )}
          </div>

          {/* Outcome Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setOutcomeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-none ${
                outcomeFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent'
              }`}
            >
              All Records ({matches.length})
            </button>
            <button
              type="button"
              onClick={() => setOutcomeFilter('wins')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-none ${
                outcomeFilter === 'wins'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent'
              }`}
            >
              Decisive Wins
            </button>
            <button
              type="button"
              onClick={() => setOutcomeFilter('ties')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-none ${
                outcomeFilter === 'ties'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent'
              }`}
            >
              Ties & Super Overs
            </button>
          </div>

          {/* Sort & View Mode controls */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
              <ArrowUpDown size={12} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 text-[10px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer border-none"
                id="select-sort-completed-matches"
              >
                <option value="newest" className="bg-slate-900 text-white">Latest Concluded</option>
                <option value="oldest" className="bg-slate-900 text-white">Oldest First</option>
                <option value="high_score" className="bg-slate-900 text-white">Highest Total Runs</option>
                <option value="low_score" className="bg-slate-900 text-white">Lowest Total Runs</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                  viewMode === 'cards' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Full Cards View (with banner & sponsor ads slider)"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                  viewMode === 'compact' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Compact Grid View"
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                  viewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Table Registry View"
              >
                <Table size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-slate-900/60 rounded-3xl border border-slate-800">
            <RefreshCw size={24} className="animate-spin text-emerald-400 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Loading completed matches records...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="p-16 text-center space-y-4 bg-slate-900/60 rounded-3xl border border-slate-800">
            <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto text-slate-500 border border-slate-700/50">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                No Completed Match Records Found
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                {searchQuery || outcomeFilter !== 'all'
                  ? 'No records matched your search query or filter. Try clearing filters.'
                  : 'No completed matches are currently recorded. Conclude a match in the Gully Cricket Scoreboard to see it here!'}
              </p>
            </div>

            {(searchQuery || outcomeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setOutcomeFilter('all');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-none shadow-md"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards View with match banner & sponsor slider */
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Showing {filteredMatches.length} Concluded Match Records
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                Live Synced with Tournament Scoreboard
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredMatches.map((match, idx) => (
                <div key={match.id || idx} className="h-full">
                  <CompletedMatchCard
                    match={match}
                    index={idx}
                    adminAds={adminAds}
                    onSelectMatch={handleSelectMatch}
                    onShareWhatsApp={handleShareWhatsApp}
                    isAdmin={false}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : viewMode === 'compact' ? (
          /* Compact Cards View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMatches.map((m, idx) => {
              const inn1 = m.innings1;
              const inn2 = m.innings2;
              const t1Overs = inn1 ? `${Math.floor(inn1.ballsBowled / 6)}.${inn1.ballsBowled % 6}` : '0.0';
              const t2Overs = inn2 ? `${Math.floor(inn2.ballsBowled / 6)}.${inn2.ballsBowled % 6}` : '0.0';

              return (
                <div
                  key={m.id || idx}
                  onClick={() => handleSelectMatch(m.id)}
                  className="p-4 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl shadow-md hover:shadow-emerald-500/10 transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {m.date || 'Recent'}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-amber-400 rounded-full border border-slate-700 font-mono">
                        {m.oversLimit} Overs
                      </span>
                    </div>

                    {/* Team 1 Score */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate max-w-[150px]">
                        {inn1?.battingTeam || m.teamA}
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-emerald-400">
                          {inn1 ? `${inn1.runs}/${inn1.wickets}` : '-'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono ml-1">
                          ({t1Overs} ov)
                        </span>
                      </div>
                    </div>

                    {/* Team 2 Score */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate max-w-[150px]">
                        {inn2?.battingTeam || m.teamB}
                      </span>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-emerald-400">
                          {inn2 ? `${inn2.runs}/${inn2.wickets}` : '-'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono ml-1">
                          ({t2Overs} ov)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Result & Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="truncate">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide truncate block">
                        {m.winner === 'Tie' ? 'Match Tied' : `${m.winner} Won`}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate block">
                        {m.winReason || 'Match Concluded'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleShareWhatsApp(m, e)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-all border border-slate-700 cursor-pointer"
                        title="Share on WhatsApp"
                      >
                        <Send size={11} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectMatch(m.id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none"
                      >
                        <Eye size={10} />
                        <span>Scorecard</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Registry View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Match Date</th>
                    <th className="py-3 px-4">Team A</th>
                    <th className="py-3 px-4">Team B</th>
                    <th className="py-3 px-4">Match Result & Margin</th>
                    <th className="py-3 px-4 text-center">Overs</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredMatches.map((m, idx) => {
                    const inn1 = m.innings1;
                    const inn2 = m.innings2;
                    const t1Overs = inn1 ? `${Math.floor(inn1.ballsBowled / 6)}.${inn1.ballsBowled % 6}` : '0.0';
                    const t2Overs = inn2 ? `${Math.floor(inn2.ballsBowled / 6)}.${inn2.ballsBowled % 6}` : '0.0';

                    return (
                      <tr 
                        key={m.id || idx}
                        onClick={() => handleSelectMatch(m.id)}
                        className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                          {m.date || 'Recent'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{inn1?.battingTeam || m.teamA}</div>
                          <div className="text-emerald-400 font-mono text-[11px]">
                            {inn1 ? `${inn1.runs}/${inn1.wickets}` : '-'} ({t1Overs} ov)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-white">{inn2?.battingTeam || m.teamB}</div>
                          <div className="text-emerald-400 font-mono text-[11px]">
                            {inn2 ? `${inn2.runs}/${inn2.wickets}` : '-'} ({t2Overs} ov)
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-black text-amber-400 uppercase text-[11px] block">
                            {m.winner === 'Tie' ? 'Match Tied' : `${m.winner} Won`}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                            {m.winReason || 'Concluded'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-300 font-bold">
                          {m.oversLimit}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleShareWhatsApp(m, e)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-all border border-slate-700 cursor-pointer"
                              title="Share on WhatsApp"
                            >
                              <Send size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSelectMatch(m.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-none"
                            >
                              <Eye size={11} />
                              <span>View Scorecard</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedMatchesPage;
