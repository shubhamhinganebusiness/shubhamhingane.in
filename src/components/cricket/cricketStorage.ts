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
  if (id === 'match-premier-live-exhibition') return true;
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
 * Determines whether a match is an AI generated demo / synthetic / exhibition match.
 * Strictly filters out AI/synthetic matches so only official manager created matches are displayed.
 */
export function isDemoOrAIMatch(m: any): boolean {
  if (!m) return true;
  const id = String(m.id || '');
  if (id === 'match-premier-live-exhibition' || id.includes('exhibition') || id.includes('demo') || id.startsWith('custom-')) return true;
  if (m.isSynthetic === true || m.isAIGenerated === true || m.isAiMatch === true || m.isSimulated === true) return true;
  const teamA = String(m.teamA || '').toLowerCase();
  const teamB = String(m.teamB || '').toLowerCase();
  if (teamA.includes('demo') || teamB.includes('demo')) return true;
  if (teamA.includes('adelaide strikers') || teamB.includes('adelaide strikers')) return true;
  if (teamA === 'mumbai champions' && teamB === 'pune super warriors') return true;
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
      if (isMatchDeleted(parsed.id) || isDemoOrAIMatch(parsed)) {
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
    if (!match || match.status === 'completed' || isDemoOrAIMatch(match)) {
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
          if (item && item.id && !isMatchDeleted(item.id) && !isDemoOrAIMatch(item)) {
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
  if (active && active.id && !isMatchDeleted(active.id) && !isDemoOrAIMatch(active)) {
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

/**
 * Generates a realistic, complete exhibition live match.
 * Ensures the detailed scoreboard always has rich, engaging data to display
 * even if no user matches have been scored yet.
 */
export function getOrCreateDefaultMatch(): MatchState {
  const matchId = 'match-premier-live-exhibition';
  unmarkMatchDeleted(matchId);

  const defaultMatch: MatchState = {
    id: matchId,
    teamA: 'Mumbai Champions',
    teamB: 'Pune Super Warriors',
    oversLimit: 20,
    tossWinner: 'Pune Super Warriors',
    tossChoice: 'bowl',
    currentInningsNum: 2,
    status: 'live',
    date: new Date().toISOString().split('T')[0],
    targetRuns: 178,
    freeHitNext: false,
    lastBallResult: '4',
    updatedAt: Date.now(),
    version: 1,
    tournamentName: 'Gully Premier T20 Cup 2026',
    seriesName: 'Championship Final',
    groundName: 'Wankhede Cricket Ground, Mumbai',
    innings1: {
      battingTeam: 'Mumbai Champions',
      bowlingTeam: 'Pune Super Warriors',
      runs: 177,
      wickets: 5,
      ballsBowled: 120,
      extras: { wides: 5, noBalls: 1, byes: 2, legByes: 3, penalty: 0 },
      batsmen: [
        { name: 'Rohit Sharma (c)', runs: 58, balls: 38, fours: 6, sixes: 3, isOut: true, outMode: 'Caught', dismissedBy: 'Shardul T.', fielderName: 'Ruturaj G.' },
        { name: 'Ishan Kishan (wk)', runs: 34, balls: 22, fours: 4, sixes: 1, isOut: true, outMode: 'Bowled', dismissedBy: 'Deepak C.' },
        { name: 'Suryakumar Yadav', runs: 45, balls: 24, fours: 4, sixes: 3, isOut: true, outMode: 'Caught', dismissedBy: 'Ravindra J.' },
        { name: 'Hardik Pandya', runs: 22, balls: 14, fours: 2, sixes: 1, isOut: true, outMode: 'Run Out' },
        { name: 'Tilak Varma', runs: 12, balls: 12, fours: 1, sixes: 0, isOut: false },
        { name: 'Tim David', runs: 6, balls: 10, fours: 0, sixes: 0, isOut: false }
      ],
      bowlers: [
        { name: 'Deepak Chahar', ballsBowled: 24, maidens: 0, runsConceded: 32, wickets: 1, isCurrent: false },
        { name: 'Shardul Thakur', ballsBowled: 24, maidens: 0, runsConceded: 38, wickets: 1, isCurrent: false },
        { name: 'Ravindra Jadeja', ballsBowled: 24, maidens: 0, runsConceded: 28, wickets: 1, isCurrent: false },
        { name: 'Matheesha Pathirana', ballsBowled: 24, maidens: 0, runsConceded: 42, wickets: 1, isCurrent: false },
        { name: 'Mitchell Santner', ballsBowled: 24, maidens: 0, runsConceded: 31, wickets: 0, isCurrent: false }
      ],
      strikerIndex: 4,
      nonStrikerIndex: 5,
      currentBowlerIndex: 3,
      fallOfWickets: [
        { wicketNo: 1, score: 62, batsmanName: 'Ishan Kishan', oversList: '6.4' },
        { wicketNo: 2, score: 118, batsmanName: 'Rohit Sharma', oversList: '12.3' },
        { wicketNo: 3, score: 145, batsmanName: 'Hardik Pandya', oversList: '15.5' },
        { wicketNo: 4, score: 168, batsmanName: 'Suryakumar Yadav', oversList: '18.2' }
      ],
      commentaryList: [
        { id: 'c1-1', overBall: '19.6', description: 'Pathirana yorker dug out to deep midwicket for a single to end innings.', type: 'normal' },
        { id: 'c1-2', overBall: '19.4', description: 'FOUR! Tim David slashes through point with power and precision!', type: 'boundary' },
        { id: 'c1-3', overBall: '18.2', description: 'WICKET! Suryakumar caught at deep backward square trying to scoop!', type: 'wicket' }
      ],
      history: [
        { over: 5, overStr: '5.0', cumulativeRuns: 48, cumulativeWickets: 0 },
        { over: 10, overStr: '10.0', cumulativeRuns: 92, cumulativeWickets: 1 },
        { over: 15, overStr: '15.0', cumulativeRuns: 138, cumulativeWickets: 2 },
        { over: 20, overStr: '20.0', cumulativeRuns: 177, cumulativeWickets: 5 }
      ]
    },
    innings2: {
      battingTeam: 'Pune Super Warriors',
      bowlingTeam: 'Mumbai Champions',
      runs: 146,
      wickets: 3,
      ballsBowled: 94,
      extras: { wides: 4, noBalls: 1, byes: 1, legByes: 2, penalty: 0 },
      batsmen: [
        { name: 'Ruturaj Gaikwad (c)', runs: 64, balls: 42, fours: 7, sixes: 2, isOut: false },
        { name: 'Devon Conway', runs: 28, balls: 20, fours: 3, sixes: 1, isOut: true, outMode: 'Caught', dismissedBy: 'Jasprit Bumrah' },
        { name: 'Shivam Dube', runs: 38, balls: 21, fours: 2, sixes: 3, isOut: true, outMode: 'Bowled', dismissedBy: 'Piyush Chawla' },
        { name: 'Ajinkya Rahane', runs: 10, balls: 7, fours: 1, sixes: 0, isOut: true, outMode: 'LBW', dismissedBy: 'Jasprit Bumrah' },
        { name: 'MS Dhoni (wk)', runs: 6, balls: 4, fours: 1, sixes: 0, isOut: false }
      ],
      bowlers: [
        { name: 'Jasprit Bumrah', ballsBowled: 22, maidens: 0, runsConceded: 22, wickets: 2, isCurrent: true },
        { name: 'Trent Boult', ballsBowled: 24, maidens: 0, runsConceded: 34, wickets: 0, isCurrent: false },
        { name: 'Piyush Chawla', ballsBowled: 24, maidens: 0, runsConceded: 42, wickets: 1, isCurrent: false },
        { name: 'Hardik Pandya', ballsBowled: 24, maidens: 0, runsConceded: 45, wickets: 0, isCurrent: false }
      ],
      strikerIndex: 0,
      nonStrikerIndex: 4,
      currentBowlerIndex: 0,
      fallOfWickets: [
        { wicketNo: 1, score: 48, batsmanName: 'Devon Conway', oversList: '5.2' },
        { wicketNo: 2, score: 112, batsmanName: 'Ajinkya Rahane', oversList: '11.4' },
        { wicketNo: 3, score: 138, batsmanName: 'Shivam Dube', oversList: '14.5' }
      ],
      commentaryList: [
        { id: 'c2-1', overBall: '15.4', description: 'FOUR! Ruturaj steps out and lofts over mid-off with sublime timing!', type: 'boundary' },
        { id: 'c2-2', overBall: '15.3', description: 'Dhoni takes a quick single into the covers to rotate strike.', type: 'normal' },
        { id: 'c2-3', overBall: '15.2', description: 'DOT BALL! Searing yorker from Bumrah on the toes.', type: 'normal' },
        { id: 'c2-4', overBall: '15.1', description: 'FOUR! Driven straight down the ground past mid-on for boundary.', type: 'boundary' }
      ],
      history: [
        { over: 5, overStr: '5.0', cumulativeRuns: 46, cumulativeWickets: 0 },
        { over: 10, overStr: '10.0', cumulativeRuns: 95, cumulativeWickets: 1 },
        { over: 15, overStr: '15.0', cumulativeRuns: 139, cumulativeWickets: 3 }
      ]
    }
  };

  return defaultMatch;
}

/**
 * Resolves any active match or latest completed official match.
 * Returns null if no official matches have been created yet.
 */
export function getAnyActiveOrRecentMatch(): MatchState | null {
  const active = getActiveMatch();
  if (active && !isMatchDeleted(active.id) && !isDemoOrAIMatch(active)) {
    return active;
  }

  const all = getLocalMatches();
  const liveMatch = all.find(m => m.status === 'live' && !isMatchDeleted(m.id) && !isDemoOrAIMatch(m));
  if (liveMatch) {
    return liveMatch;
  }

  const recent = all.find(m => !isMatchDeleted(m.id) && m.status !== 'deleted' && !isDemoOrAIMatch(m));
  if (recent) {
    return recent;
  }

  return null;
}

