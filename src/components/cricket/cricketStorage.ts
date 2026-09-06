import { MatchState } from './CricketScoreboard';

const ACTIVE_MATCH_KEY = 'cricket_active_match';
const LOCAL_REGISTRY_KEY = 'cricket_matches_local_registry';
const DELETED_REGISTRY_KEY = 'cricket_deleted_matches_registry';
const OFFLINE_PENDING_KEY = 'cricket_matches_offline_pending';
const CHANNEL_NAME = 'cricket_match_sync_channel';

// Create BroadcastChannel safely (supported in all modern browsers, with fallback)
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not available:', e);
}

/**
 * Recursively cleans an object for Firestore by omitting any keys with `undefined` values.
 * Firestore strictly forbids `undefined` values in document data.
 */
export function sanitizeForFirestore<T = any>(obj: T): T {
  if (obj === undefined) return null as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as any;
  }
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (val !== undefined) {
      result[key] = sanitizeForFirestore(val);
    }
  }
  return result as T;
}

/**
 * Checks whether a match has been permanently deleted in local/client tombstone
 */
export function isMatchDeleted(id: string): boolean {
  if (typeof window === 'undefined' || !id) return false;
  try {
    if (sessionStorage.getItem(`deleted_match_${id}`) === 'true') {
      return true;
    }
    const raw = localStorage.getItem(DELETED_REGISTRY_KEY);
    if (!raw) return false;
    const deletedMap = JSON.parse(raw);
    if (deletedMap && typeof deletedMap === 'object' && deletedMap[id]) {
      // Tomstones remain valid permanently or minimum 30 days
      return true;
    }
  } catch (e) {
    console.warn('Failed to read deleted matches registry:', e);
  }
  return false;
}

/**
 * Marks a match as deleted in the tombstone registry to prevent reappearing
 */
export function markMatchDeleted(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    sessionStorage.setItem(`deleted_match_${id}`, 'true');
    const raw = localStorage.getItem(DELETED_REGISTRY_KEY);
    const deletedMap: Record<string, number> = raw ? JSON.parse(raw) : {};
    deletedMap[id] = Date.now();
    localStorage.setItem(DELETED_REGISTRY_KEY, JSON.stringify(deletedMap));
  } catch (e) {
    console.warn('Failed to write to deleted matches registry:', e);
  }
}

/**
 * Unmarks a match if it is explicitly created or restored
 */
export function unmarkMatchDeleted(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    sessionStorage.removeItem(`deleted_match_${id}`);
    const raw = localStorage.getItem(DELETED_REGISTRY_KEY);
    if (!raw) return;
    const deletedMap: Record<string, number> = JSON.parse(raw);
    if (deletedMap && deletedMap[id]) {
      delete deletedMap[id];
      localStorage.setItem(DELETED_REGISTRY_KEY, JSON.stringify(deletedMap));
    }
  } catch (e) {
    console.warn('Failed to unmark deleted match:', e);
  }
}

/**
 * Dispatches sync events across components in the same window and across browser tabs
 */
function broadcastMatchChange(match: MatchState | null, eventType: 'update' | 'delete' = 'update') {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(
      new CustomEvent('cricket_match_updated', {
        detail: { match, eventType, timestamp: Date.now() }
      })
    );
  } catch (e) {
    console.warn('CustomEvent dispatch error:', e);
  }

  try {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ match, eventType, timestamp: Date.now() });
    }
  } catch (e) {
    console.warn('BroadcastChannel postMessage error:', e);
  }
}

/**
 * Retrieves the currently active live match from localStorage
 */
export function getActiveMatch(): MatchState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_MATCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MatchState;
    if (parsed && parsed.id) {
      if (isMatchDeleted(parsed.id)) {
        localStorage.removeItem(ACTIVE_MATCH_KEY);
        return null;
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Failed to read active match from localStorage:', e);
  }
  return null;
}

/**
 * Sets or clears the active match in localStorage and notifies all listeners
 */
export function setActiveMatch(match: MatchState | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!match || match.status === 'completed') {
      localStorage.removeItem(ACTIVE_MATCH_KEY);
      broadcastMatchChange(match, 'update');
    } else {
      unmarkMatchDeleted(match.id);
      localStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(match));
      // Also register in local registry
      saveMatchToRegistry(match);
      broadcastMatchChange(match, 'update');
    }
  } catch (e) {
    console.warn('Failed to write active match to localStorage:', e);
  }
}

/**
 * Retrieves all locally saved matches
 */
export function getLocalMatches(): MatchState[] {
  if (typeof window === 'undefined') return [];
  const list: MatchState[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.id && !isMatchDeleted(item.id)) {
            list.push(item);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read local match registry:', e);
  }

  // Ensure active match is present in the list
  const active = getActiveMatch();
  if (active && active.id && !isMatchDeleted(active.id)) {
    const existingIdx = list.findIndex(m => m.id === active.id);
    if (existingIdx >= 0) {
      // If active match is newer, replace it
      if ((active.updatedAt || 0) >= (list[existingIdx].updatedAt || 0)) {
        list[existingIdx] = active;
      }
    } else {
      list.unshift(active);
    }
  }

  return list;
}

/**
 * Finds a match by its ID in the local storage
 */
export function getLocalMatchById(id: string): MatchState | null {
  if (!id || isMatchDeleted(id)) return null;
  const active = getActiveMatch();
  if (active && active.id === id) return active;

  const matches = getLocalMatches();
  return matches.find(m => m.id === id) || null;
}

/**
 * Saves a match to the local registry and updates active match if it is live
 */
export function saveMatchToRegistry(match: MatchState): void {
  if (typeof window === 'undefined' || !match || !match.id) return;
  unmarkMatchDeleted(match.id);
  try {
    const current = getLocalMatches();
    const idx = current.findIndex(m => m.id === match.id);
    if (idx >= 0) {
      current[idx] = { ...match, updatedAt: match.updatedAt || Date.now() };
    } else {
      current.unshift({ ...match, updatedAt: match.updatedAt || Date.now() });
    }

    // Keep registry clean (max 50 recent matches)
    const trimmed = current.slice(0, 50);
    localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(trimmed));

    if (match.status === 'live') {
      localStorage.setItem(ACTIVE_MATCH_KEY, JSON.stringify(match));
    } else if (match.status === 'completed') {
      // If completed match was the active match, clear active key
      const active = getActiveMatch();
      if (active && active.id === match.id) {
        localStorage.removeItem(ACTIVE_MATCH_KEY);
      }
    }

    broadcastMatchChange(match, 'update');
  } catch (e) {
    console.warn('Failed to save match to local registry:', e);
  }
}

/**
 * Deletes a match permanently from local storage, active storage, offline pending queue, and tombstones it
 */
export function deleteLocalMatch(id: string): void {
  if (typeof window === 'undefined' || !id) return;
  try {
    // Record in permanent tombstone so stale snapshots/caches do not restore it
    markMatchDeleted(id);

    // Direct filter out from local registry JSON
    const raw = localStorage.getItem(LOCAL_REGISTRY_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter(item => item && item.id !== id);
          localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(remaining));
        }
      } catch (_) {
        localStorage.removeItem(LOCAL_REGISTRY_KEY);
      }
    }

    // Clear active match if it matches
    const activeRaw = localStorage.getItem(ACTIVE_MATCH_KEY);
    if (activeRaw) {
      try {
        const active = JSON.parse(activeRaw);
        if (active && active.id === id) {
          localStorage.removeItem(ACTIVE_MATCH_KEY);
        }
      } catch (_) {
        localStorage.removeItem(ACTIVE_MATCH_KEY);
      }
    }

    // Clean offline pending queue if it contains this match
    try {
      const pendingRaw = localStorage.getItem(OFFLINE_PENDING_KEY);
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        if (parsed && parsed.id === id) {
          localStorage.removeItem(OFFLINE_PENDING_KEY);
        }
      }
    } catch (e) {}

    // Broadcast delete event to all tabs and listeners
    broadcastMatchChange({ id } as MatchState, 'delete');
    window.dispatchEvent(new CustomEvent('cricket_match_deleted', { detail: { id } }));
  } catch (e) {
    console.warn('Failed to delete match from local storage:', e);
  }
}

/**
 * Prunes matches from local storage that are explicitly marked deleted or invalid.
 * Preserves local and offline matches so user scoreboards are never unexpectedly purged.
 */
export function pruneDeletedMatchesFromStorage(validRemoteIds: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const kept = parsed.filter(item => {
          if (!item || !item.id) return false;
          // Only purge matches that are explicitly flagged as deleted
          if (item.status === 'deleted' || (item as any).isDeleted === true) {
            return false;
          }
          return true;
        });
        localStorage.setItem(LOCAL_REGISTRY_KEY, JSON.stringify(kept));
      }
    }

    // Also check active match
    const activeRaw = localStorage.getItem(ACTIVE_MATCH_KEY);
    if (activeRaw) {
      const active = JSON.parse(activeRaw);
      if (active && active.id) {
        if (active.status === 'deleted' || (active as any).isDeleted === true) {
          localStorage.removeItem(ACTIVE_MATCH_KEY);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to prune deleted matches from local storage:', e);
  }
}

/**
 * Subscribes to match changes across storage events, custom events, and broadcast channels
 */
export function subscribeToMatchSync(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = () => {
    callback();
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === ACTIVE_MATCH_KEY || e.key === LOCAL_REGISTRY_KEY) {
      callback();
    }
  };

  const handleBroadcastMessage = () => {
    callback();
  };

  window.addEventListener('cricket_match_updated', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcastMessage);
  }

  // Fallback poller to ensure UI never desyncs even on edge cases
  const intervalId = setInterval(callback, 3000);

  return () => {
    window.removeEventListener('cricket_match_updated', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcastMessage);
    }
    clearInterval(intervalId);
  };
}
