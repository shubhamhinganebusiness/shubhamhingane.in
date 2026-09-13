import { openDB, IDBPDatabase } from 'idb';
import { doc } from 'firebase/firestore';
import { db, safeSetDoc, syncScoreToRealtimeDB } from '../lib/firebase';
import { sanitizeForFirestore } from '../components/cricket/cricketStorage';

export interface QueuedBallEvent {
  id: string;
  matchId: string;
  timestamp: number;
  ballDescription: string;
  overBall: string;
  scoreSummary: string;
  matchPayload: any;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

export interface OfflineQueueState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  items: QueuedBallEvent[];
}

const DB_NAME = 'gullyscore_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'scoring_queue';
const LOCAL_STORAGE_FALLBACK_KEY = 'gullyscore_offline_scoring_queue_fallback';

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

function getIndexedDB(): Promise<IDBPDatabase<any>> | null {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('matchId', 'matchId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      },
    }).catch((err) => {
      console.warn('[OfflineQueue] IndexedDB open error, falling back to localStorage:', err);
      return null as any;
    });
  }
  return dbPromise;
}

// Fallback storage helpers
function getLocalStorageQueue(): QueuedBallEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setLocalStorageQueue(items: QueuedBallEvent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[OfflineQueue] LocalStorage write note:', e);
  }
}

// State listeners
type Listener = (state: OfflineQueueState) => void;
const listeners = new Set<Listener>();

let currentState: OfflineQueueState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  items: [],
};

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn({ ...currentState });
    } catch (e) {
      console.error('[OfflineQueue] Listener error:', e);
    }
  });
}

/**
 * Check if the browser really has internet access (not just local network interface)
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  if (!navigator.onLine) return false;

  try {
    // Quick ping to check external connectivity
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch('/api/health', {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeoutId);

    return response !== null && response.ok;
  } catch {
    // If backend ping fails, trust navigator.onLine as soft fallback
    return navigator.onLine;
  }
}

/**
 * Get all queued items
 */
export async function getAllQueuedItems(): Promise<QueuedBallEvent[]> {
  const db = await getIndexedDB();
  if (db) {
    try {
      return await db.getAll(STORE_NAME);
    } catch (err) {
      console.warn('[OfflineQueue] Failed to read from IndexedDB, reading fallback:', err);
    }
  }
  return getLocalStorageQueue();
}

/**
 * Enqueue a ball update or match snapshot
 */
export async function enqueueMatchBallSave(
  match: any,
  ballDescription?: string
): Promise<QueuedBallEvent> {
  if (!match || !match.id) {
    throw new Error('Invalid match data provided to offline queue');
  }

  const currentInnings = match.currentInningsNum === 2 ? match.innings2 : match.innings1;
  const runs = currentInnings?.runs ?? 0;
  const wickets = currentInnings?.wickets ?? 0;
  const balls = currentInnings?.ballsBowled ?? 0;
  const overStr = `${Math.floor(balls / 6)}.${balls % 6}`;
  const scoreSummary = `${runs}/${wickets} (${overStr} ov)`;

  const queuedEvent: QueuedBallEvent = {
    id: `queue_${match.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    matchId: match.id,
    timestamp: Date.now(),
    ballDescription: ballDescription || match.lastBallResult || 'Ball scored',
    overBall: overStr,
    scoreSummary,
    matchPayload: sanitizeForFirestore(match),
    retryCount: 0,
    status: 'pending',
  };

  const db = await getIndexedDB();
  if (db) {
    try {
      await db.put(STORE_NAME, queuedEvent);
    } catch (err) {
      console.warn('[OfflineQueue] IndexedDB put failed, saving to localStorage:', err);
      const items = getLocalStorageQueue();
      items.push(queuedEvent);
      setLocalStorageQueue(items);
    }
  } else {
    const items = getLocalStorageQueue();
    items.push(queuedEvent);
    setLocalStorageQueue(items);
  }

  // Also maintain backup copy in localStorage active match
  try {
    localStorage.setItem('cricket_active_match', JSON.stringify(match));
  } catch {}

  await refreshQueueState();

  // If online, immediately trigger background flush
  if (currentState.isOnline && !currentState.isSyncing) {
    flushOfflineQueue().catch(() => {});
  }

  return queuedEvent;
}

/**
 * Flush all pending offline balls to Firebase
 */
export async function flushOfflineQueue(): Promise<{ success: number; failed: number }> {
  if (currentState.isSyncing) {
    return { success: 0, failed: 0 };
  }

  const allItems = await getAllQueuedItems();
  const pending = allItems.filter((it) => it.status === 'pending' || it.status === 'failed');

  if (pending.length === 0) {
    currentState.isSyncing = false;
    currentState.pendingCount = 0;
    notifyListeners();
    return { success: 0, failed: 0 };
  }

  currentState.isSyncing = true;
  notifyListeners();

  let successCount = 0;
  let failedCount = 0;

  // Group pending events by matchId to push the freshest state for each match
  const matchMap = new Map<string, QueuedBallEvent[]>();
  pending.forEach((item) => {
    const arr = matchMap.get(item.matchId) || [];
    arr.push(item);
    matchMap.set(item.matchId, arr);
  });

  const dbInstance = await getIndexedDB();

  for (const [matchId, events] of matchMap.entries()) {
    // Sort events chronologically
    events.sort((a, b) => a.timestamp - b.timestamp);
    const freshest = events[events.length - 1];

    try {
      // 1. Sync latest match snapshot to Firestore with server proxy fallback
      let synced = false;
      try {
        const matchDocRef = doc(db, 'cricket_matches', matchId);
        await safeSetDoc(matchDocRef, freshest.matchPayload);
        synced = true;
      } catch (clientErr) {
        try {
          const res = await fetch('/api/cricket/save-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matchId, matchData: freshest.matchPayload })
          });
          if (res.ok) synced = true;
        } catch (serverErr) {}
        if (!synced) throw clientErr;
      }

      // 2. Dual-sync to Realtime Database
      await syncScoreToRealtimeDB(matchId, freshest.matchPayload).catch(() => {});

      // 3. Remove or mark synced in storage
      for (const ev of events) {
        if (dbInstance) {
          try {
            await dbInstance.delete(STORE_NAME, ev.id);
          } catch {}
        }
      }

      // Remove from localStorage fallback
      const localItems = getLocalStorageQueue().filter(
        (it) => !events.some((ev) => ev.id === it.id)
      );
      setLocalStorageQueue(localItems);

      successCount += events.length;
    } catch (err: any) {
      console.warn(`[OfflineQueue] Sync failed for match ${matchId}:`, err);
      failedCount += events.length;

      // Increment retryCount for failed events
      for (const ev of events) {
        ev.status = 'failed';
        ev.retryCount = (ev.retryCount || 0) + 1;
        ev.error = err?.message || 'Network sync error';

        if (dbInstance) {
          try {
            await dbInstance.put(STORE_NAME, ev);
          } catch {}
        }
      }
    }
  }

  currentState.isSyncing = false;
  if (successCount > 0) {
    currentState.lastSyncedAt = Date.now();
  }

  await refreshQueueState();

  // Dispatch custom window event for instant notification
  if (typeof window !== 'undefined' && successCount > 0) {
    window.dispatchEvent(
      new CustomEvent('cricket_offline_queue_synced', {
        detail: { count: successCount, failed: failedCount },
      })
    );
  }

  return { success: successCount, failed: failedCount };
}

/**
 * Clear all queued items (manual purge)
 */
export async function clearOfflineQueue(): Promise<void> {
  const db = await getIndexedDB();
  if (db) {
    try {
      await db.clear(STORE_NAME);
    } catch {}
  }
  setLocalStorageQueue([]);
  await refreshQueueState();
}

/**
 * Refresh internal in-memory state and notify React subscribers
 */
export async function refreshQueueState(): Promise<OfflineQueueState> {
  const items = await getAllQueuedItems();
  const pendingCount = items.filter(
    (it) => it.status === 'pending' || it.status === 'failed'
  ).length;

  currentState = {
    ...currentState,
    items,
    pendingCount,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };

  notifyListeners();
  return currentState;
}

/**
 * Subscribe to offline queue changes
 */
export function subscribeToOfflineQueue(listener: Listener): () => void {
  listeners.add(listener);
  listener({ ...currentState });

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Initialize global window listeners for network online/offline events
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    console.log('[OfflineQueue] Connection restored (online). Starting background sync...');
    currentState.isOnline = true;
    notifyListeners();
    // Flush queued balls after 500ms stabilization
    setTimeout(() => {
      flushOfflineQueue().catch(() => {});
    }, 500);
  });

  window.addEventListener('offline', () => {
    console.warn('[OfflineQueue] Connection lost (offline). Switching to offline scoring buffer.');
    currentState.isOnline = false;
    notifyListeners();
  });

  // Initial load
  refreshQueueState().catch(() => {});

  // Periodic background check every 20 seconds
  setInterval(async () => {
    if (navigator.onLine) {
      const items = await getAllQueuedItems();
      const hasPending = items.some((it) => it.status === 'pending' || it.status === 'failed');
      if (hasPending && !currentState.isSyncing) {
        flushOfflineQueue().catch(() => {});
      }
    }
  }, 20000);
}

export const processOfflineScoringQueue = flushOfflineQueue;

export function isNetworkOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

