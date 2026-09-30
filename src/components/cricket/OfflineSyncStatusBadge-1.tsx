import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, 
  Database, Clock, ChevronRight, X, ArrowUpRight, HardDriveDownload
} from 'lucide-react';
import { 
  subscribeToOfflineQueue, 
  flushOfflineQueue, 
  clearOfflineQueue, 
  OfflineQueueState 
} from '../../utils/offlineScoringQueue';

interface OfflineSyncStatusBadgeProps {
  className?: string;
  showDetailsModalOnClick?: boolean;
}

export const OfflineSyncStatusBadge: React.FC<OfflineSyncStatusBadgeProps> = ({
  className = '',
  showDetailsModalOnClick = true,
}) => {
  const [queueState, setQueueState] = useState<OfflineQueueState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    items: [],
  });

  const [isOpen, setIsOpen] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToOfflineQueue((next) => {
      setQueueState(next);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setManualSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await flushOfflineQueue();
      if (res.success > 0) {
        setSyncFeedback(`Successfully synced ${res.success} ball${res.success > 1 ? 's' : ''}!`);
      } else if (res.failed > 0) {
        setSyncFeedback(`Sync encountered an error on ${res.failed} item(s). Will retry automatically.`);
      } else {
        setSyncFeedback('All scores are already up to date!');
      }
    } catch (e: any) {
      setSyncFeedback(e?.message || 'Sync failed. Will retry when connected.');
    } finally {
      setManualSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear the offline sync queue? Any unsynced offline balls will be cleared from this browser.')) {
      await clearOfflineQueue();
      setIsOpen(false);
    }
  };

  const isOffline = !queueState.isOnline;
  const hasPending = queueState.pendingCount > 0;
  const isSyncing = queueState.isSyncing || manualSyncing;

  return (
    <>
      {/* Clickable Status Pill */}
      <button
        id="btn-offline-sync-status-badge"
        type="button"
        onClick={() => showDetailsModalOnClick && setIsOpen(true)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide transition-all select-none cursor-pointer border ${
          isSyncing
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/60'
            : hasPending
            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 animate-pulse'
            : isOffline
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60'
        } ${className}`}
        title="Click to view offline scoring queue & background sync status"
      >
        {isSyncing ? (
          <>
            <RefreshCw size={12} className="animate-spin text-blue-500" />
            <span>Syncing {queueState.pendingCount} ball{queueState.pendingCount !== 1 ? 's' : ''}...</span>
          </>
        ) : hasPending ? (
          <>
            <Database size={12} className="text-amber-500" />
            <span>{queueState.pendingCount} offline ball{queueState.pendingCount !== 1 ? 's' : ''} queued</span>
          </>
        ) : isOffline ? (
          <>
            <WifiOff size={12} className="text-rose-500" />
            <span>Offline Scorer Active</span>
          </>
        ) : (
          <>
            <Wifi size={12} className="text-emerald-500" />
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Synced
            </span>
          </>
        )}
      </button>

      {/* Offline Queue Inspector Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    isOffline ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {isOffline ? <WifiOff size={18} /> : <HardDriveDownload size={18} />}
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">
                      Offline-First Scoring Queue
                    </h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      IndexedDB resilient scoring buffer
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Network Status Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ground Connection</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${queueState.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                        {queueState.isOnline ? 'Connected to Internet' : 'Offline (No Internet)'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Balls</span>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                      {queueState.pendingCount} in queue
                    </p>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                  <p className="font-semibold text-blue-900 dark:text-blue-300">
                    🏏 Local Ground Protection Active:
                  </p>
                  <p className="mt-1 text-[11px] text-blue-800/80 dark:text-blue-300/80">
                    You can score whole matches or overs completely offline. Every ball event is instantly saved to your browser&apos;s IndexedDB and will automatically push to Firebase Realtime DB and Firestore when the connection flickers back.
                  </p>
                </div>

                {syncFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{syncFeedback}</span>
                  </div>
                )}

                {/* Queue list */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Pending Ball Log Queue ({queueState.items.length})
                  </h4>

                  {queueState.items.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                      <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-500 opacity-80" />
                      <p className="font-bold">Queue is empty!</p>
                      <p className="text-[10px] mt-0.5">All scored balls have been safely synced to the cloud.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {queueState.items.map((it) => (
                        <div
                          key={it.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 dark:text-white">
                                {it.scoreSummary}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-mono text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                {it.ballDescription}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(it.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div>
                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                              it.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : it.status === 'syncing'
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 animate-pulse'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {it.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={queueState.items.length === 0}
                  className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Clear Queue
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>

                  <button
                    id="btn-force-sync-now"
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing || !queueState.isOnline || queueState.pendingCount === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Force Sync Now'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
