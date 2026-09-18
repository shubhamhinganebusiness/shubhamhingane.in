import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sliders, Trophy, Eye, EyeOff, Ban, Unlock, Trash2, 
  Search, RefreshCw, AlertTriangle, CheckCircle2, X, 
  Calendar, ExternalLink, Send, ShieldAlert, ShieldCheck, 
  Filter, ArrowUpDown, LayoutGrid, List, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { MatchState } from './CricketScoreboard';

export const CompletedMatchesAdminManager: React.FC = () => {
  const [matches, setMatches] = useState<MatchState[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'visible' | 'hidden' | 'blocked' | 'wins' | 'ties'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'high_score'>('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Confirmation states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [batchDeleteConfirm, setBatchDeleteConfirm] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Real-time listener for cricket_matches from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const matchesCol = collection(db, 'cricket_matches');
      unsubscribe = onSnapshot(matchesCol, (snapshot) => {
        const loaded: MatchState[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const matchObj: MatchState = {
            ...data,
            id: docSnap.id
          };
          if (matchObj.status === 'completed' && !(matchObj as any).isDeleted) {
            loaded.push(matchObj);
          }
        });

        if (loaded.length > 0) {
          setMatches(loaded);
        } else {
          // Fallback to local storage if Firestore is empty
          try {
            const rawLocal = localStorage.getItem('cricket_matches_local_registry');
            if (rawLocal) {
              const parsed = JSON.parse(rawLocal);
              if (Array.isArray(parsed)) {
                setMatches(parsed.filter((m: any) => m.status === 'completed' && !(m as any).isDeleted));
              }
            }
          } catch (_) {}
        }
        setLoading(false);
      }, (error) => {
        console.warn('CompletedMatchesAdminManager snapshot notice:', error?.message || error);
        try {
          const rawLocal = localStorage.getItem('cricket_matches_local_registry');
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed)) {
              setMatches(parsed.filter((m: any) => m.status === 'completed' && !(m as any).isDeleted));
            }
          }
        } catch (_) {}
        setLoading(false);
      });
    } catch (e) {
      console.warn('Could not attach Firestore listener:', e);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --------------------------------------------------------------------------
  // ACTIONS: HIDE, BLOCK, DELETE
  // --------------------------------------------------------------------------

  // 1. Toggle Single Match Hide / Unhide
  const handleToggleHide = async (matchId: string, currentHidden: boolean) => {
    const nextHidden = !currentHidden;

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, isHidden: nextHidden, hideResultCard: nextHidden };
      }
      return m;
    }));

    try {
      const rawHidden = localStorage.getItem('cricket_hidden_result_card_ids');
      let hiddenIds: string[] = rawHidden ? JSON.parse(rawHidden) : [];
      if (nextHidden) {
        if (!hiddenIds.includes(matchId)) hiddenIds.push(matchId);
      } else {
        hiddenIds = hiddenIds.filter(id => id !== matchId);
      }
      localStorage.setItem('cricket_hidden_result_card_ids', JSON.stringify(hiddenIds));
    } catch (_) {}

    try {
      await setDoc(doc(db, 'cricket_matches', matchId), {
        isHidden: nextHidden,
        hideResultCard: nextHidden,
        updatedAt: Date.now()
      }, { merge: true });
      showToast(nextHidden ? 'Match record is now hidden from spectators.' : 'Match record is now visible to spectators.', 'success');
    } catch (err) {
      console.warn('Firestore toggle hide warning:', err);
      showToast(nextHidden ? 'Match record hidden locally.' : 'Match record visible locally.', 'success');
    }
  };

  // 2. Toggle Single Match Block / Unblock
  const handleToggleBlock = async (matchId: string, currentBlocked: boolean) => {
    const nextBlocked = !currentBlocked;

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, isBlocked: nextBlocked };
      }
      return m;
    }));

    try {
      await setDoc(doc(db, 'cricket_matches', matchId), {
        isBlocked: nextBlocked,
        updatedAt: Date.now()
      }, { merge: true });
      showToast(nextBlocked ? 'Match record is now blocked from spectators.' : 'Match record is unblocked.', 'success');
    } catch (err) {
      console.warn('Firestore toggle block warning:', err);
      showToast(nextBlocked ? 'Match record blocked locally.' : 'Match record unblocked locally.', 'success');
    }
  };

  // 3. Delete Single Match Record
  const handleDeleteMatch = async (matchId: string) => {
    setMatches(prev => prev.filter(m => m.id !== matchId));

    try {
      const rawLocal = localStorage.getItem('cricket_matches_local_registry');
      if (rawLocal) {
        const localParsed = JSON.parse(rawLocal);
        if (Array.isArray(localParsed)) {
          const updated = localParsed.filter((m: any) => m.id !== matchId);
          localStorage.setItem('cricket_matches_local_registry', JSON.stringify(updated));
        }
      }
    } catch (_) {}

    try {
      await deleteDoc(doc(db, 'cricket_matches', matchId));
      showToast('Match record permanently deleted.', 'success');
    } catch (err) {
      console.warn('Firestore delete warning, falling back to soft delete:', err);
      try {
        await setDoc(doc(db, 'cricket_matches', matchId), {
          isDeleted: true,
          status: 'deleted',
          updatedAt: Date.now()
        }, { merge: true });
        showToast('Match record marked as deleted.', 'success');
      } catch (_) {
        showToast('Record removed locally.', 'success');
      }
    }
    setConfirmDeleteId(null);
  };

  // 4. Batch Hide / Unhide All Completed Records
  const handleBatchHideAll = async (hide: boolean) => {
    if (matches.length === 0) return;

    setMatches(prev => prev.map(m => ({ ...m, isHidden: hide, hideResultCard: hide })));

    try {
      const allIds = matches.map(m => m.id).filter(Boolean) as string[];
      if (hide) {
        localStorage.setItem('cricket_hidden_result_card_ids', JSON.stringify(allIds));
      } else {
        localStorage.setItem('cricket_hidden_result_card_ids', JSON.stringify([]));
      }
    } catch (_) {}

    try {
      for (const m of matches) {
        if (m.id) {
          await setDoc(doc(db, 'cricket_matches', m.id), {
            isHidden: hide,
            hideResultCard: hide,
            updatedAt: Date.now()
          }, { merge: true });
        }
      }
      showToast(`All completed match records are now ${hide ? 'hidden from spectators' : 'visible to spectators'}.`, 'success');
    } catch (e) {
      console.error('Batch hide error:', e);
      showToast('Records updated locally.', 'success');
    }
  };

  // 5. Batch Block / Unblock All Completed Records
  const handleBatchBlockAll = async (block: boolean) => {
    if (matches.length === 0) return;

    setMatches(prev => prev.map(m => ({ ...m, isBlocked: block })));

    try {
      for (const m of matches) {
        if (m.id) {
          await setDoc(doc(db, 'cricket_matches', m.id), {
            isBlocked: block,
            updatedAt: Date.now()
          }, { merge: true });
        }
      }
      showToast(`All completed match records are now ${block ? 'blocked from spectators' : 'unblocked'}.`, 'success');
    } catch (e) {
      console.error('Batch block error:', e);
      showToast('Records updated locally.', 'success');
    }
  };

  // 6. Batch Delete All Completed Records
  const handleBatchDeleteAll = async () => {
    if (matches.length === 0) return;

    const idsToDelete = matches.map(m => m.id).filter(Boolean) as string[];
    setMatches([]);

    try {
      const rawLocal = localStorage.getItem('cricket_matches_local_registry');
      if (rawLocal) {
        const localParsed = JSON.parse(rawLocal);
        if (Array.isArray(localParsed)) {
          const remaining = localParsed.filter((m: any) => m.status !== 'completed');
          localStorage.setItem('cricket_matches_local_registry', JSON.stringify(remaining));
        }
      }
    } catch (_) {}

    try {
      for (const id of idsToDelete) {
        await deleteDoc(doc(db, 'cricket_matches', id));
      }
      showToast('All completed match records have been permanently deleted.', 'success');
    } catch (e) {
      console.warn('Batch delete error:', e);
      showToast('Records cleared locally.', 'success');
    }
    setBatchDeleteConfirm(false);
  };

  // --------------------------------------------------------------------------
  // COUNTS & FILTERING
  // --------------------------------------------------------------------------

  const totalCount = matches.length;
  const hiddenCount = useMemo(() => matches.filter(m => m.isHidden || (m as any).hideResultCard).length, [matches]);
  const blockedCount = useMemo(() => matches.filter(m => m.isBlocked).length, [matches]);
  const visibleCount = totalCount - hiddenCount;

  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Status filter
    if (statusFilter === 'visible') {
      result = result.filter(m => !m.isHidden && !(m as any).hideResultCard);
    } else if (statusFilter === 'hidden') {
      result = result.filter(m => m.isHidden || (m as any).hideResultCard);
    } else if (statusFilter === 'blocked') {
      result = result.filter(m => m.isBlocked);
    } else if (statusFilter === 'wins') {
      result = result.filter(m => m.winner && m.winner !== 'Tie');
    } else if (statusFilter === 'ties') {
      result = result.filter(m => m.winner === 'Tie');
    }

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(m => {
        const t1 = (m.teamA || '').toLowerCase();
        const t2 = (m.teamB || '').toLowerCase();
        const win = (m.winner || '').toLowerCase();
        const venue = ((m as any).venue || (m as any).groundName || '').toLowerCase();
        const tourney = ((m as any).tournamentName || '').toLowerCase();
        const date = (m.date || '').toLowerCase();
        return t1.includes(q) || t2.includes(q) || win.includes(q) || venue.includes(q) || tourney.includes(q) || date.includes(q);
      });
    }

    // Sorting
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
      }
      return 0;
    });

    return result;
  }, [matches, statusFilter, searchQuery, sortBy]);

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
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className={`p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border ${
              toastMessage.type === 'success'
                ? 'bg-slate-900 text-emerald-300 border-emerald-500/50 shadow-emerald-500/20'
                : 'bg-slate-900 text-rose-300 border-rose-500/50 shadow-rose-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                )}
                <span className="text-xs font-bold">{toastMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer border-none bg-transparent"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Overview Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Completed Records</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-gray-900 font-mono">{totalCount}</span>
            <span className="text-[10px] text-gray-500 font-semibold">matches</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Visible to Spectators</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-600 font-mono">{visibleCount}</span>
            <span className="text-[10px] text-emerald-700/70 font-semibold">public</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Hidden Records</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-amber-600 font-mono">{hiddenCount}</span>
            <span className="text-[10px] text-amber-700/70 font-semibold">hidden</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Blocked Access</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-rose-600 font-mono">{blockedCount}</span>
            <span className="text-[10px] text-rose-700/70 font-semibold">restricted</span>
          </div>
        </div>
      </div>

      {/* ===================== COMPLETED MATCHES MANAGEMENT TOOLBAR ===================== */}
      <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 rounded-3xl shadow-xl shadow-black/20 text-white space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-300">
                  Completed Matches Management Toolbar
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-mono font-bold border border-slate-700">
                  {totalCount} Stored Records
                </span>
                {hiddenCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold border border-amber-500/40">
                    {hiddenCount} Hidden
                  </span>
                )}
                {blockedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-mono font-bold border border-rose-500/40">
                    {blockedCount} Blocked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Super Admin controls to delete, hide, unhide, and block completed match records across spectators and public archives
              </p>
            </div>
          </div>

          {/* Quick link to public archive */}
          <Link
            to="/completed-matches"
            target="_blank"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all no-underline shrink-0"
            title="Open Public Completed Matches Page in new tab"
          >
            <span>View Public Page</span>
            <ExternalLink size={12} />
          </Link>
        </div>

        {/* Batch Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Visibility Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleBatchHideAll(true)}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 hover:text-amber-300 hover:bg-slate-800/80 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border-none"
                title="Hide all completed records from spectators"
                id="superadmin-btn-batch-hide"
              >
                <EyeOff size={13} />
                <span>Hide All</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchHideAll(false)}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border-none"
                title="Make all completed records visible to spectators"
                id="superadmin-btn-batch-unhide"
              >
                <Eye size={13} />
                <span>Unhide All</span>
              </button>
            </div>

            {/* Batch Block Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleBatchBlockAll(true)}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border-none"
                title="Block all completed records from spectator access"
                id="superadmin-btn-batch-block"
              >
                <Ban size={13} />
                <span>Block All</span>
              </button>
              <button
                type="button"
                onClick={() => handleBatchBlockAll(false)}
                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all border-none"
                title="Unblock all completed records"
                id="superadmin-btn-batch-unblock"
              >
                <Unlock size={13} />
                <span>Unblock All</span>
              </button>
            </div>
          </div>

          {/* Batch Delete All */}
          <div>
            {batchDeleteConfirm ? (
              <div className="flex items-center gap-1.5 p-1 bg-rose-950/90 border border-rose-600 rounded-xl">
                <span className="text-[10px] font-bold text-rose-200 px-2">Permanently delete ALL {totalCount} records?</span>
                <button
                  type="button"
                  onClick={handleBatchDeleteAll}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setBatchDeleteConfirm(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer border-none"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBatchDeleteConfirm(true)}
                className="px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all border-none shadow-sm"
                title="Delete all completed records"
                id="superadmin-btn-batch-delete"
              >
                <Trash2 size={13} />
                <span>Delete All Records</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, winners, venues..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-primary transition-all"
            id="superadmin-search-completed-matches"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold px-1 cursor-pointer border-none bg-transparent"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('visible')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
              statusFilter === 'visible' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'
            }`}
          >
            Visible ({visibleCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('hidden')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
              statusFilter === 'hidden' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'
            }`}
          >
            Hidden ({hiddenCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-none ${
              statusFilter === 'blocked' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'
            }`}
          >
            Blocked ({blockedCount})
          </button>
        </div>

        {/* Sort and View Mode */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-xl">
            <ArrowUpDown size={12} className="text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-gray-700 text-[10px] font-bold uppercase tracking-wider focus:outline-none cursor-pointer border-none"
            >
              <option value="newest">Latest Concluded</option>
              <option value="oldest">Oldest First</option>
              <option value="high_score">Highest Score</option>
            </select>
          </div>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                viewMode === 'cards' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'
              }`}
              title="Cards View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer border-none ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'
              }`}
              title="Table View"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Record List */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-gray-150">
          <RefreshCw size={24} className="animate-spin text-primary mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Loading completed matches registry...
          </p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-gray-150">
          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto text-gray-400">
            <Trophy size={20} />
          </div>
          <h4 className="text-sm font-black uppercase tracking-wider text-gray-800">
            No Completed Matches Found
          </h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'No match records match your current filter criteria.'
              : 'There are no completed matches recorded in the database history yet.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((m, idx) => {
            const inn1 = m.innings1;
            const inn2 = m.innings2;
            const t1Overs = inn1 ? `${Math.floor(inn1.ballsBowled / 6)}.${inn1.ballsBowled % 6}` : '0.0';
            const t2Overs = inn2 ? `${Math.floor(inn2.ballsBowled / 6)}.${inn2.ballsBowled % 6}` : '0.0';
            const isHidden = m.isHidden || (m as any).hideResultCard;
            const isBlocked = m.isBlocked;

            return (
              <div
                key={m.id || idx}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition-all flex flex-col justify-between gap-3 relative"
              >
                {/* Card Top: Date, Overs, and Live Status Badges */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-500 font-medium text-[11px]">
                    <Calendar size={12} className="text-gray-400" />
                    <span>{m.date || 'Recent Match'}</span>
                    <span className="text-gray-300">•</span>
                    <span className="font-mono text-gray-700 font-bold">{m.oversLimit} Overs</span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                      isHidden 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isHidden ? 'Hidden' : 'Visible'}
                    </span>

                    {isBlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Teams and Scores */}
                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-900 text-sm truncate max-w-[200px]">
                      {inn1?.battingTeam || m.teamA}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-gray-900">
                        {inn1 ? `${inn1.runs}/${inn1.wickets}` : '-'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono ml-1">
                        ({t1Overs} ov)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-bold text-gray-900 text-sm truncate max-w-[200px]">
                      {inn2?.battingTeam || m.teamB}
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-gray-900">
                        {inn2 ? `${inn2.runs}/${inn2.wickets}` : '-'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono ml-1">
                        ({t2Overs} ov)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Result Banner */}
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-[11px] font-black text-amber-800 uppercase block">
                      {m.winner === 'Tie' ? 'Match Tied' : `${m.winner} Won`}
                    </span>
                    <span className="text-[10px] text-amber-700/80 truncate block">
                      {m.winReason || 'Match Concluded'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleShareWhatsApp(m, e)}
                    className="p-1.5 bg-white hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all border border-emerald-200 cursor-pointer shrink-0 ml-2"
                    title="Share on WhatsApp"
                  >
                    <Send size={12} />
                  </button>
                </div>

                {/* Individual Management Controls Footer */}
                <div className="pt-2 border-t border-gray-150 flex items-center justify-between gap-2 flex-wrap">
                  {/* Left: Hide and Block Toggles */}
                  <div className="flex items-center gap-1.5">
                    {/* Hide Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleHide(m.id, !!isHidden)}
                      className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border ${
                        isHidden
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                      }`}
                      title={isHidden ? "Match is hidden from spectators. Click to Unhide." : "Match is visible. Click to Hide."}
                      id={`superadmin-hide-btn-${m.id}`}
                    >
                      {isHidden ? <Eye size={12} className="text-amber-700" /> : <EyeOff size={12} className="text-gray-500" />}
                      <span>{isHidden ? 'Unhide' : 'Hide'}</span>
                    </button>

                    {/* Block Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleBlock(m.id, !!isBlocked)}
                      className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all border ${
                        isBlocked
                          ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-sm'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                      }`}
                      title={isBlocked ? "Match is blocked. Click to Unblock." : "Click to Block spectator access."}
                      id={`superadmin-block-btn-${m.id}`}
                    >
                      {isBlocked ? <Unlock size={12} /> : <Ban size={12} className="text-rose-500" />}
                      <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                    </button>

                    {/* Delete Toggle */}
                    {confirmDeleteId === m.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-xl border border-rose-300">
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(m.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[8px] font-black uppercase rounded-lg cursor-pointer border-none"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-1 bg-gray-200 text-gray-700 text-[8px] rounded-lg cursor-pointer border-none"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(m.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all border border-rose-200 cursor-pointer"
                        title="Delete Match Record"
                        id={`superadmin-del-btn-${m.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {/* Right: Scorecard Link */}
                  <a
                    href={`/#/cricket-details?matchId=${m.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all no-underline"
                  >
                    <Eye size={11} />
                    <span>Scorecard</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Teams & Scores</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Management Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {filteredMatches.map((m, idx) => {
                  const inn1 = m.innings1;
                  const inn2 = m.innings2;
                  const isHidden = m.isHidden || (m as any).hideResultCard;
                  const isBlocked = m.isBlocked;

                  return (
                    <tr key={m.id || idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono whitespace-nowrap">
                        {m.date || 'Recent'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">
                          {inn1?.battingTeam || m.teamA} ({inn1 ? `${inn1.runs}/${inn1.wickets}` : '-'})
                        </div>
                        <div className="font-bold text-gray-600 text-[11px]">
                          vs {inn2?.battingTeam || m.teamB} ({inn2 ? `${inn2.runs}/${inn2.wickets}` : '-'})
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-amber-700 uppercase text-[11px] block">
                          {m.winner === 'Tie' ? 'Tied' : `${m.winner} Won`}
                        </span>
                        <span className="text-[10px] text-gray-500 block truncate max-w-[150px]">
                          {m.winReason || 'Concluded'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            isHidden 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {isHidden ? 'Hidden' : 'Visible'}
                          </span>
                          {isBlocked && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                              Blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleHide(m.id, !!isHidden)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isHidden ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                            title={isHidden ? "Unhide" : "Hide"}
                          >
                            {isHidden ? <Eye size={12} className="text-amber-700" /> : <EyeOff size={12} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBlock(m.id, !!isBlocked)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isBlocked ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                            title={isBlocked ? "Unblock" : "Block"}
                          >
                            {isBlocked ? <Unlock size={12} /> : <Ban size={12} className="text-rose-500" />}
                          </button>

                          {confirmDeleteId === m.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-300">
                              <button
                                type="button"
                                onClick={() => handleDeleteMatch(m.id)}
                                className="px-2 py-0.5 bg-rose-600 text-white text-[8px] font-black uppercase rounded cursor-pointer border-none"
                              >
                                Del
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1 py-0.5 bg-gray-200 text-gray-700 text-[8px] rounded cursor-pointer border-none"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(m.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all border border-rose-200 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}

                          <a
                            href={`/#/cricket-details?matchId=${m.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all no-underline ml-1"
                          >
                            <Eye size={11} />
                            <span>Scorecard</span>
                          </a>
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
  );
};

export default CompletedMatchesAdminManager;
