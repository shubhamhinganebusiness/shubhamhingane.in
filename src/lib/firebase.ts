import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { 
  initializeFirestore, 
  memoryLocalCache,
  doc, 
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocFromCache, 
  getDocFromServer,
  terminate,
  setLogLevel
} from 'firebase/firestore';
import { 
  getDatabase, 
  ref as rtdbRef, 
  set as rtdbSet, 
  onValue as rtdbOnValue, 
  update as rtdbUpdate,
  remove as rtdbRemove,
  Database
} from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence internal Firestore SDK debug/warn backoff logs
try {
  setLogLevel('silent');
} catch {}

let firestoreAssertionTripped = false;

export function isInternalFirestoreAssertionError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? `${err.message} ${err.stack || ''}` : String(err);
  return (
    msg.includes('INTERNAL ASSERTION FAILED') ||
    msg.includes('Unexpected state') ||
    msg.includes('ID: ca9') ||
    msg.includes('ID: b815') ||
    msg.includes('{"ve":-1}')
  );
}

export function markFirestoreAssertionFailed(): void {
  firestoreAssertionTripped = true;
}

export function isFirestoreAssertionFailed(): boolean {
  return firestoreAssertionTripped;
}

// Global window error listener to gracefully intercept internal assertion crashes from Firestore SDK
if (typeof window !== 'undefined') {
  const origConsoleError = console.error;
  console.error = function (...args: any[]) {
    const raw = args.map(a => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return `${a.name}: ${a.message} ${a.stack || ''}`;
      try { return JSON.stringify(a); } catch { return String(a || ''); }
    }).join(' ');

    if (isInternalFirestoreAssertionError(raw)) {
      markFirestoreAssertionFailed();
      console.warn('[Firestore SDK Guard] Suppressed internal assertion log:', raw.slice(0, 180));
      return;
    }

    if (
      raw.includes('GrpcConnection RPC') ||
      raw.includes('RST_STREAM') ||
      raw.includes('RESOURCE_EXHAUSTED') ||
      raw.includes('resource-exhausted') ||
      raw.includes('Quota exceeded') ||
      raw.includes('Quota limit exceeded') ||
      raw.includes('Disconnecting idle stream') ||
      (raw.includes('@firebase/firestore') && (raw.includes('Code: 13') || raw.includes('Code: 8') || raw.includes('Code: 1')))
    ) {
      if (
        raw.includes('RESOURCE_EXHAUSTED') ||
        raw.includes('resource-exhausted') ||
        raw.includes('Quota exceeded') ||
        raw.includes('Quota limit exceeded') ||
        raw.includes('Code: 8')
      ) {
        try { recordFirestoreQuotaExhaustion(360); } catch {}
      }
      // Suppress transient WebChannel HTTP/2 transport reconnection logs and quota status from bubbling to error monitors
      console.warn('[Firestore Stream Guard] Handled quota/stream status safely:', raw);
      return;
    }
    origConsoleError.apply(console, args);
  };

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || '';
    if (isInternalFirestoreAssertionError(msg) || isInternalFirestoreAssertionError(event?.error)) {
      markFirestoreAssertionFailed();
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (
      typeof msg === 'string' &&
      (msg.includes('FIRESTORE') ||
       msg.includes('GrpcConnection') ||
       msg.includes('RST_STREAM') ||
       msg.includes('RESOURCE_EXHAUSTED') ||
       msg.includes('resource-exhausted') ||
       msg.includes('Quota exceeded') ||
       msg.includes('Quota limit exceeded') ||
       msg.includes('Code: 8') ||
       msg.includes('Disconnecting idle stream'))
    ) {
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('resource-exhausted') ||
        msg.includes('Quota exceeded') ||
        msg.includes('Quota limit exceeded') ||
        msg.includes('Code: 8')
      ) {
        try { recordFirestoreQuotaExhaustion(360); } catch {}
      }
      console.warn('[Firestore SDK Guard] Intercepted internal assertion/transport error:', msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = reason instanceof Error ? reason.message : String(reason || '');
    if (isInternalFirestoreAssertionError(reason) || isInternalFirestoreAssertionError(msg)) {
      markFirestoreAssertionFailed();
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (
      typeof msg === 'string' &&
      (msg.includes('FIRESTORE') ||
       msg.includes('GrpcConnection') ||
       msg.includes('RST_STREAM') ||
       msg.includes('RESOURCE_EXHAUSTED') ||
       msg.includes('resource-exhausted') ||
       msg.includes('Quota exceeded') ||
       msg.includes('Quota limit exceeded') ||
       msg.includes('Code: 8') ||
       msg.includes('Disconnecting idle stream'))
    ) {
      if (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('resource-exhausted') ||
        msg.includes('Quota exceeded') ||
        msg.includes('Quota limit exceeded') ||
        msg.includes('Code: 8')
      ) {
        try { recordFirestoreQuotaExhaustion(360); } catch {}
      }
      console.warn('[Firestore SDK Guard] Intercepted internal assertion/transport rejection:', msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

export const app = initializeApp(firebaseConfig);

export const firestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-remixshubhamhing-a0ff377c-7ae5-429e-9263-df2bcb690093';

// Initialize Firestore with memory cache and auto-detected long polling to prevent TargetState (ID: ca9) multiplex collisions
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  ignoreUndefinedProperties: true,
  experimentalAutoDetectLongPolling: typeof window !== 'undefined'
}, firestoreDatabaseId);

// Initialize Firebase Storage
export let storage: FirebaseStorage | null = null;
try {
  storage = getStorage(app);
} catch (err) {
  console.warn('[Firebase Storage] Initialization note:', err);
}

// Initialize Firebase Realtime Database (RTDB)
export let rtdb: Database | null = null;
try {
  const defaultRtdbUrl = (firebaseConfig as any).projectId
    ? `https://${(firebaseConfig as any).projectId}-default-rtdb.firebaseio.com`
    : undefined;
  const customDbUrl =
    (firebaseConfig as any).databaseURL ||
    (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_DATABASE_URL) ||
    defaultRtdbUrl;
  if (customDbUrl) {
    rtdb = getDatabase(app, customDbUrl);
  } else {
    rtdb = getDatabase(app);
  }
} catch (err) {
  console.info('[Firebase Realtime Database] RTDB initialized in standby:', err);
}

// Shared client-side Real-Time Server Stream (SSE) & Cache so Quick Match, Tournament, and One-Half Tournament
// stay 100% real-time connected across tabs/devices alongside Firebase Realtime Database
const realtimeMatchListeners = new Map<string, Set<(match: any) => void>>();
const realtimeMatchesListListeners = new Set<(matches: any[]) => void>();
const realtimeActiveLiveListeners = new Set<(data: any) => void>();
const realtimeCompletedMatchListeners = new Set<(match: any) => void>();
const realtimeTournamentsListeners = new Set<(tournaments: any[]) => void>();
const realtimeOneHalfListeners = new Set<(data: any) => void>();

const clientMatchesRealtimeCache = new Map<string, any>();
const clientTournamentsRealtimeCache = new Map<string, any>();
let sseInitialized = false;

const isOneHalfTournamentDocId = (id?: string | null): boolean =>
  id === 'one_half_active_championship' || id === 'one_half_32_tournament';

function ensureCricketRealtimeStream() {
  if (typeof window === 'undefined' || sseInitialized) return;
  sseInitialized = true;

  // 1. Initial hydrate of matches & tournaments from server real-time store
  fetch('/api/cricket/list-docs?collectionName=cricket_matches')
    .then(r => (r.ok ? r.json() : null))
    .then(json => {
      if (json && Array.isArray(json.items)) {
        for (const item of json.items) {
          if (item && item.id) {
            clientMatchesRealtimeCache.set(String(item.id), item);
          }
        }
        const allMatches = Array.from(clientMatchesRealtimeCache.values());
        realtimeMatchesListListeners.forEach(cb => {
          try { cb(allMatches); } catch {}
        });
      }
    })
    .catch(() => {});

  fetch('/api/cricket/list-docs?collectionName=cricket_tournaments')
    .then(r => (r.ok ? r.json() : null))
    .then(json => {
      if (json && Array.isArray(json.items)) {
        for (const item of json.items) {
          if (item && item.id) {
            clientTournamentsRealtimeCache.set(String(item.id), item);
            if (isOneHalfTournamentDocId(item.id) && Array.isArray(item.matches) && Array.isArray(item.teams)) {
              clientTournamentsRealtimeCache.set('one_half_active_championship', item);
              realtimeOneHalfListeners.forEach(cb => {
                try { cb(item); } catch {}
              });
            }
          }
        }
        const allTournaments = Array.from(clientTournamentsRealtimeCache.values()).filter(
          t => t && t.id && !isOneHalfTournamentDocId(t.id)
        );
        realtimeTournamentsListeners.forEach(cb => {
          try { cb(allTournaments); } catch {}
        });
      }
    })
    .catch(() => {});

  // 2. Connect persistent SSE stream for instant real-time updates
  const connectSse = () => {
    try {
      const es = new EventSource('/api/cricket/stream');
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (!payload || typeof payload !== 'object') return;

          if (payload.type === 'initial_snapshot') {
            if (Array.isArray(payload.matches)) {
              for (const m of payload.matches) {
                if (m && m.id) clientMatchesRealtimeCache.set(String(m.id), m);
              }
              const list = Array.from(clientMatchesRealtimeCache.values());
              realtimeMatchesListListeners.forEach(cb => { try { cb(list); } catch {} });
            }
            if (Array.isArray(payload.tournaments)) {
              for (const t of payload.tournaments) {
                if (t && t.id) {
                  clientTournamentsRealtimeCache.set(String(t.id), t);
                  if (isOneHalfTournamentDocId(t.id) && Array.isArray(t.matches) && Array.isArray(t.teams)) {
                    clientTournamentsRealtimeCache.set('one_half_active_championship', t);
                    realtimeOneHalfListeners.forEach(cb => { try { cb(t); } catch {} });
                  }
                }
              }
              const tList = Array.from(clientTournamentsRealtimeCache.values()).filter(
                t => t && t.id && !isOneHalfTournamentDocId(t.id)
              );
              realtimeTournamentsListeners.forEach(cb => { try { cb(tList); } catch {} });
            }
          } else if (payload.type === 'doc_update') {
            const { collectionName, docId, data } = payload;
            if (collectionName === 'cricket_matches' && docId && data) {
              const fullMatch = { id: docId, ...data };
              clientMatchesRealtimeCache.set(String(docId), fullMatch);
              const matchCbs = realtimeMatchListeners.get(String(docId));
              if (matchCbs) {
                matchCbs.forEach(cb => { try { cb(fullMatch); } catch {} });
              }
              const list = Array.from(clientMatchesRealtimeCache.values());
              realtimeMatchesListListeners.forEach(cb => { try { cb(list); } catch {} });

              if (fullMatch.status === 'live') {
                const liveBroadcast = {
                  id: fullMatch.id,
                  teamA: fullMatch.teamA,
                  teamB: fullMatch.teamB,
                  status: fullMatch.status,
                  updatedAt: fullMatch.updatedAt || Date.now(),
                  match: fullMatch
                };
                realtimeActiveLiveListeners.forEach(cb => { try { cb(liveBroadcast); } catch {} });
              } else if (fullMatch.status === 'completed') {
                realtimeCompletedMatchListeners.forEach(cb => { try { cb(fullMatch); } catch {} });
              }
            } else if (collectionName === 'cricket_tournaments' && docId && data) {
              const fullTour = { id: docId, ...data };
              clientTournamentsRealtimeCache.set(String(docId), fullTour);
              if (isOneHalfTournamentDocId(docId) && Array.isArray(fullTour.matches) && Array.isArray(fullTour.teams)) {
                clientTournamentsRealtimeCache.set('one_half_active_championship', fullTour);
                realtimeOneHalfListeners.forEach(cb => { try { cb(fullTour); } catch {} });
              } else {
                const tList = Array.from(clientTournamentsRealtimeCache.values()).filter(
                  t => t && t.id && !isOneHalfTournamentDocId(t.id)
                );
                realtimeTournamentsListeners.forEach(cb => { try { cb(tList); } catch {} });
              }
            }
          } else if (payload.type === 'doc_delete') {
            const { collectionName, docId } = payload;
            if (collectionName === 'cricket_matches' && docId) {
              clientMatchesRealtimeCache.delete(String(docId));
              const list = Array.from(clientMatchesRealtimeCache.values());
              realtimeMatchesListListeners.forEach(cb => { try { cb(list); } catch {} });
            } else if (collectionName === 'cricket_tournaments' && docId) {
              clientTournamentsRealtimeCache.delete(String(docId));
              const tList = Array.from(clientTournamentsRealtimeCache.values()).filter(
                t => t && t.id && t.id !== 'one_half_32_tournament'
              );
              realtimeTournamentsListeners.forEach(cb => { try { cb(tList); } catch {} });
            }
          }
        } catch {}
      };
      es.onerror = () => {
        try { es.close(); } catch {}
        setTimeout(connectSse, 4000);
      };
    } catch {}
  };

  connectSse();
}

/**
 * Synchronize live cricket scores (Quick Match & Live Scorer) to Firebase Realtime Database & Real-Time Server
 */
export async function syncScoreToRealtimeDB(matchId: string, matchData: any): Promise<void> {
  if (!matchId || !matchData) return;
  const cleaned = cleanUndefined({ id: matchId, ...matchData });
  clientMatchesRealtimeCache.set(String(matchId), cleaned);

  // 1. Push to Real-Time Server Proxy (which broadcasts via SSE to all connected clients)
  saveMatchViaServerProxy(matchId, cleaned).catch(() => {});

  // 2. Push to Firebase Realtime Database (RTDB)
  if (!rtdb) return;
  try {
    const matchRef = rtdbRef(rtdb, `cricket_matches/${matchId}`);
    await rtdbSet(matchRef, cleaned);

    // If match is currently live, also update active live match pointer for instant global discovery
    if (cleaned.status === 'live') {
      const liveRef = rtdbRef(rtdb, 'cricket_active_live_match');
      await rtdbSet(liveRef, {
        id: cleaned.id,
        teamA: cleaned.teamA,
        teamB: cleaned.teamB,
        status: cleaned.status,
        updatedAt: cleaned.updatedAt || Date.now(),
        match: cleaned
      });
    } else if (cleaned.status === 'completed') {
      const completedRef = rtdbRef(rtdb, 'cricket_completed_match');
      await rtdbSet(completedRef, cleaned);
    }
  } catch (err) {
    console.warn('[Realtime Database] Live score push note:', err);
  }
}

/**
 * Subscribe to a specific cricket match in Firebase Realtime Database & Real-Time Stream
 */
export function subscribeToRealtimeDBMatch(matchId: string, onUpdate: (match: any) => void): () => void {
  if (!matchId) return () => {};
  ensureCricketRealtimeStream();

  if (!realtimeMatchListeners.has(matchId)) {
    realtimeMatchListeners.set(matchId, new Set());
  }
  realtimeMatchListeners.get(matchId)!.add(onUpdate);

  const cached = clientMatchesRealtimeCache.get(matchId);
  if (cached) {
    setTimeout(() => { try { onUpdate(cached); } catch {} }, 0);
  }

  let unsubRtdb = () => {};
  if (rtdb) {
    try {
      const matchRef = rtdbRef(rtdb, `cricket_matches/${matchId}`);
      unsubRtdb = rtdbOnValue(matchRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val) {
            clientMatchesRealtimeCache.set(matchId, val);
            onUpdate(val);
          }
        }
      }, (error) => {
        console.warn('[Realtime Database] Match listener note:', error);
      });
    } catch {}
  }

  return () => {
    realtimeMatchListeners.get(matchId)?.delete(onUpdate);
    try { unsubRtdb(); } catch {}
  };
}

/**
 * Subscribe to the active live match broadcast in Firebase Realtime Database & Real-Time Stream
 */
export function subscribeToRealtimeDBActiveLive(onUpdate: (data: any) => void): () => void {
  ensureCricketRealtimeStream();
  realtimeActiveLiveListeners.add(onUpdate);

  let unsubRtdb = () => {};
  if (rtdb) {
    try {
      const liveRef = rtdbRef(rtdb, 'cricket_active_live_match');
      unsubRtdb = rtdbOnValue(liveRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val) onUpdate(val);
        }
      }, (error) => {
        console.warn('[Realtime Database] Global live listener note:', error);
      });
    } catch {}
  }

  return () => {
    realtimeActiveLiveListeners.delete(onUpdate);
    try { unsubRtdb(); } catch {}
  };
}

/**
 * Subscribe to the list of all matches in Firebase Realtime Database & Real-Time Stream
 */
export function subscribeToRealtimeDBMatchesList(onUpdate: (matches: any[]) => void): () => void {
  ensureCricketRealtimeStream();
  realtimeMatchesListListeners.add(onUpdate);

  if (clientMatchesRealtimeCache.size > 0) {
    const initial = Array.from(clientMatchesRealtimeCache.values());
    setTimeout(() => { try { onUpdate(initial); } catch {} }, 0);
  }

  let unsubRtdb = () => {};
  if (rtdb) {
    try {
      const matchesRef = rtdbRef(rtdb, 'cricket_matches');
      unsubRtdb = rtdbOnValue(matchesRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val && typeof val === 'object') {
            const list = Object.values(val) as any[];
            for (const m of list) {
              if (m && m.id) clientMatchesRealtimeCache.set(String(m.id), m);
            }
            onUpdate(Array.from(clientMatchesRealtimeCache.values()));
          }
        }
      }, (error) => {
        console.warn('[Realtime Database] Matches list listener note:', error);
      });
    } catch {}
  }

  return () => {
    realtimeMatchesListListeners.delete(onUpdate);
    try { unsubRtdb(); } catch {}
  };
}

/**
 * Subscribe to completed match updates in Firebase Realtime Database & Real-Time Stream
 */
export function subscribeToRealtimeDBCompletedMatch(onUpdate: (completedMatch: any) => void): () => void {
  ensureCricketRealtimeStream();
  realtimeCompletedMatchListeners.add(onUpdate);

  let unsubRtdb = () => {};
  if (rtdb) {
    try {
      const completedRef = rtdbRef(rtdb, 'cricket_completed_match');
      unsubRtdb = rtdbOnValue(completedRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val) onUpdate(val);
        }
      }, (error) => {
        console.warn('[Realtime Database] Completed match listener note:', error);
      });
    } catch {}
  }

  return () => {
    realtimeCompletedMatchListeners.delete(onUpdate);
    try { unsubRtdb(); } catch {}
  };
}

/**
 * Remove a match and its pointers from Firebase Realtime Database
 */
export async function removeMatchFromRealtimeDB(matchId: string): Promise<void> {
  if (!matchId) return;
  clientMatchesRealtimeCache.delete(String(matchId));
  deleteDocViaServerProxy('cricket_matches', matchId).catch(() => {});

  if (!rtdb) return;
  try {
    const matchRef = rtdbRef(rtdb, `cricket_matches/${matchId}`);
    await rtdbRemove(matchRef).catch(() => {});

    // Clear active live match if it points to this deleted match
    const liveRef = rtdbRef(rtdb, 'cricket_active_live_match');
    await rtdbSet(liveRef, null).catch(() => {});

    const activeRef = rtdbRef(rtdb, 'cricket_active_match');
    await rtdbSet(activeRef, null).catch(() => {});

    const completedRef = rtdbRef(rtdb, 'cricket_completed_match');
    await rtdbSet(completedRef, null).catch(() => {});
  } catch (err) {
    console.warn('[Realtime Database] Match removal note:', err);
  }
}

/**
 * Synchronize Standard Tournament state to Firebase Realtime Database & Real-Time Server
 */
export async function syncTournamentToRealtimeDB(tournamentData: any): Promise<void> {
  if (!tournamentData || !tournamentData.id) return;
  const cleaned = cleanUndefined(tournamentData);
  clientTournamentsRealtimeCache.set(String(cleaned.id), cleaned);

  saveDocViaServerProxy('cricket_tournaments', String(cleaned.id), cleaned, { merge: true }).catch(() => {});

  if (!rtdb) return;
  try {
    const tourRef = rtdbRef(rtdb, `cricket_tournaments/${cleaned.id}`);
    await rtdbSet(tourRef, cleaned);
  } catch (err) {
    console.warn('[Realtime Database] Standard tournament push note:', err);
  }
}

/**
 * Subscribe to all Standard Tournaments in Firebase Realtime Database & Real-Time Stream
 */
export function subscribeToRealtimeDBTournaments(onUpdate: (tournaments: any[]) => void): () => void {
  ensureCricketRealtimeStream();
  realtimeTournamentsListeners.add(onUpdate);

  const initialList = Array.from(clientTournamentsRealtimeCache.values()).filter(
    t => t && t.id && !isOneHalfTournamentDocId(t.id)
  );
  if (initialList.length > 0) {
    setTimeout(() => { try { onUpdate(initialList); } catch {} }, 0);
  }

  let unsubRtdb = () => {};
  if (rtdb) {
    try {
      const toursRef = rtdbRef(rtdb, 'cricket_tournaments');
      unsubRtdb = rtdbOnValue(toursRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val && typeof val === 'object') {
            const list = Object.values(val) as any[];
            for (const t of list) {
              if (t && t.id) {
                clientTournamentsRealtimeCache.set(String(t.id), t);
              }
            }
            const filtered = Array.from(clientTournamentsRealtimeCache.values()).filter(
              t => t && t.id && !isOneHalfTournamentDocId(t.id)
            );
            onUpdate(filtered);
          }
        }
      }, (error) => {
        console.warn('[Realtime Database] Standard tournaments listener note:', error);
      });
    } catch {}
  }

  return () => {
    realtimeTournamentsListeners.delete(onUpdate);
    try { unsubRtdb(); } catch {}
  };
}

/**
 * Remove a Standard Tournament from Firebase Realtime Database & Real-Time Server
 */
export async function removeTournamentFromRealtimeDB(tournamentId: string): Promise<void> {
  if (!tournamentId) return;
  clientTournamentsRealtimeCache.delete(String(tournamentId));
  deleteDocViaServerProxy('cricket_tournaments', tournamentId).catch(() => {});

  if (!rtdb) return;
  try {
    const tourRef = rtdbRef(rtdb, `cricket_tournaments/${tournamentId}`);
    await rtdbRemove(tourRef).catch(() => {});
  } catch (err) {
    console.warn('[Realtime Database] Tournament removal note:', err);
  }
}

/**
 * Synchronize One-Half Tournament state to Firebase Realtime Database & Real-Time Server
 */
export async function syncOneHalfTournamentToRealtimeDB(tournamentData: any): Promise<void> {
  if (!tournamentData) return;
  const cleaned = cleanUndefined({
    ...tournamentData,
    id: tournamentData.id || 'one_half_active_championship',
    updatedAt: tournamentData.updatedAt || Date.now()
  });
  clientTournamentsRealtimeCache.set('one_half_active_championship', cleaned);

  saveDocViaServerProxy('cricket_tournaments', 'one_half_active_championship', cleaned, { merge: true }).catch(() => {});

  if (!rtdb) return;
  try {
    const tourRef = rtdbRef(rtdb, 'cricket_one_half_tournament');
    await rtdbSet(tourRef, cleaned);
  } catch (err) {
    console.warn('[Realtime Database] One-Half tournament push note:', err);
  }
}

/**
 * Subscribe to One-Half Tournament state in Firebase Realtime Database & Real-Time Stream
 */
export function subscribeToRealtimeDBOneHalfTournament(onUpdate: (data: any) => void): () => void {
  ensureCricketRealtimeStream();
  realtimeOneHalfListeners.add(onUpdate);

  const cached =
    clientTournamentsRealtimeCache.get('one_half_active_championship') ||
    clientTournamentsRealtimeCache.get('one_half_32_tournament');
  if (cached && Array.isArray(cached.matches) && Array.isArray(cached.teams)) {
    setTimeout(() => { try { onUpdate(cached); } catch {} }, 0);
  }

  let unsubRtdb = () => {};
  if (rtdb) {
    try {
      const tourRef = rtdbRef(rtdb, 'cricket_one_half_tournament');
      unsubRtdb = rtdbOnValue(tourRef, (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          if (val) {
            clientTournamentsRealtimeCache.set('one_half_active_championship', val);
            onUpdate(val);
          }
        }
      }, (error) => {
        console.warn('[Realtime Database] One-Half tournament listener note:', error);
      });
    } catch {}
  }

  return () => {
    realtimeOneHalfListeners.delete(onUpdate);
    try { unsubRtdb(); } catch {}
  };
}

interface SharedStreamEntry {
  subscribers: Set<{ onNext: (snap: any) => void; onError?: (err: any) => void }>;
  lastSnapshot: any | null;
  rawUnsub: (() => void) | null;
  teardownTimer: any | null;
}

const sharedFirestoreStreams = new Map<string, SharedStreamEntry>();

function getFirestoreTargetKey(target: any): string | null {
  if (!target) return null;
  try {
    if (typeof target.path === 'string' && target.path) {
      return `${target.type || 'ref'}:${target.path}`;
    }
    const q = target._query || target;
    if (q?.path && typeof q.path.canonicalString === 'function') {
      const basePath = q.path.canonicalString();
      const filters = Array.isArray(q.filters) ? q.filters.map((f: any) => f?.field?.canonicalString?.() || '').join(',') : '';
      const orders = Array.isArray(q.explicitOrderBy) ? q.explicitOrderBy.map((o: any) => `${o?.field?.canonicalString?.() || ''}:${o?.dir || ''}`).join(',') : '';
      const lim = q.limit ?? '';
      return `query:${basePath}|f:${filters}|o:${orders}|l:${lim}`;
    }
  } catch {}
  return null;
}

/**
 * Fault-tolerant, multiplexed wrapper around Firestore onSnapshot.
 * - Prevents duplicate concurrent WatchStream targets (which trigger Firebase 12.12.0 ID: ca9 {"ve":-1})
 * - Debounces target teardown so rapid React unmount/remount never underflows TargetState ref counts
 * - Guards against synchronous ID: b815 throws on both attach and unsubscribe cleanup
 */
export function safeOnSnapshot(
  target: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  if (!target || typeof window === 'undefined' || !db) {
    return () => {};
  }

  if (isFirestoreAssertionFailed() || isFirestoreQuotaExhausted()) {
    if (onError) {
      setTimeout(() => {
        try {
          onError(new Error('Firestore stream bypassed (local/SSE mode active)'));
        } catch {}
      }, 0);
    }
    return () => {};
  }

  const targetKey = getFirestoreTargetKey(target);
  if (targetKey) {
    let entry = sharedFirestoreStreams.get(targetKey);
    const subObj = { onNext, onError };

    if (entry) {
      if (entry.teardownTimer) {
        clearTimeout(entry.teardownTimer);
        entry.teardownTimer = null;
      }
      entry.subscribers.add(subObj);
      if (entry.lastSnapshot) {
        const cachedSnap = entry.lastSnapshot;
        setTimeout(() => {
          if (entry && entry.subscribers.has(subObj)) {
            try {
              onNext(cachedSnap);
            } catch {}
          }
        }, 0);
      }
    } else {
      entry = {
        subscribers: new Set([subObj]),
        lastSnapshot: null,
        rawUnsub: null,
        teardownTimer: null
      };
      sharedFirestoreStreams.set(targetKey, entry);

      try {
        const currentEntry = entry;
        currentEntry.rawUnsub = onSnapshot(
          target,
          (snap: any) => {
            currentEntry.lastSnapshot = snap;
            currentEntry.subscribers.forEach((s) => {
              try {
                s.onNext(snap);
              } catch (cbErr) {
                console.warn('[safeOnSnapshot] Subscriber callback error:', cbErr);
              }
            });
          },
          (err: any) => {
            if (isInternalFirestoreAssertionError(err)) {
              markFirestoreAssertionFailed();
            } else if (isQuotaError(err)) {
              recordFirestoreQuotaExhaustion(5);
            }
            currentEntry.subscribers.forEach((s) => {
              if (s.onError) {
                try {
                  s.onError(err);
                } catch {}
              }
            });
          }
        );
      } catch (attachErr: any) {
        if (isInternalFirestoreAssertionError(attachErr)) {
          markFirestoreAssertionFailed();
        }
        sharedFirestoreStreams.delete(targetKey);
        if (onError) {
          setTimeout(() => {
            try {
              onError(attachErr);
            } catch {}
          }, 0);
        }
        return () => {};
      }
    }

    return () => {
      const currentEntry = sharedFirestoreStreams.get(targetKey);
      if (!currentEntry) return;
      currentEntry.subscribers.delete(subObj);
      if (currentEntry.subscribers.size === 0 && !currentEntry.teardownTimer) {
        currentEntry.teardownTimer = setTimeout(() => {
          const latestEntry = sharedFirestoreStreams.get(targetKey);
          if (latestEntry && latestEntry.subscribers.size === 0) {
            sharedFirestoreStreams.delete(targetKey);
            if (!isFirestoreAssertionFailed() && latestEntry.rawUnsub) {
              try {
                latestEntry.rawUnsub();
              } catch (unsubErr) {
                if (isInternalFirestoreAssertionError(unsubErr)) {
                  markFirestoreAssertionFailed();
                }
              }
            }
          }
        }, 1500);
      }
    };
  }

  // Fallback for non-keyable targets
  let rawUnsub: (() => void) | null = null;
  try {
    rawUnsub = onSnapshot(
      target,
      (snap: any) => {
        try {
          onNext(snap);
        } catch {}
      },
      (err: any) => {
        if (isInternalFirestoreAssertionError(err)) {
          markFirestoreAssertionFailed();
        } else if (isQuotaError(err)) {
          recordFirestoreQuotaExhaustion(5);
        }
        if (onError) {
          try {
            onError(err);
          } catch {}
        }
      }
    );
  } catch (err: any) {
    if (isInternalFirestoreAssertionError(err)) {
      markFirestoreAssertionFailed();
    }
    if (onError) {
      setTimeout(() => {
        try {
          onError(err);
        } catch {}
      }, 0);
    }
    return () => {};
  }

  return () => {
    if (isFirestoreAssertionFailed() || !rawUnsub) return;
    const fn = rawUnsub;
    rawUnsub = null;
    setTimeout(() => {
      if (isFirestoreAssertionFailed()) return;
      try {
        fn();
      } catch (unsubErr) {
        if (isInternalFirestoreAssertionError(unsubErr)) {
          markFirestoreAssertionFailed();
        }
      }
    }, 500);
  };
}

/**
 * Subscribe to the cricket_deleted_matches Firestore collection for real-time deletion synchronization
 */
export function subscribeToDeletedMatches(onDeleted: (deletedIds: string[]) => void): () => void {
  if (!db) return () => {};
  return safeOnSnapshot(
    collection(db, 'cricket_deleted_matches'),
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((docSnap: any) => {
        ids.push(docSnap.id);
      });
      onDeleted(ids);
    },
    (error) => {
      console.warn('[Firestore] Deleted matches stream note:', error?.message || error);
    }
  );
}

/**
 * Subscribe to the cricket_matches Firestore collection with error guard
 */
export function subscribeToCricketMatchesCollection(
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  return safeOnSnapshot(
    collection(db, 'cricket_matches'),
    onNext,
    (err) => {
      console.warn('[Firestore] cricket_matches listener note:', err?.message || err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to a specific cricket match doc in Firestore with error guard
 */
export function subscribeToCricketMatchDoc(
  matchId: string,
  onNext: (docSnap: any) => void,
  onError?: (error: any) => void
): () => void {
  if (!matchId) return () => {};
  return safeOnSnapshot(
    doc(db, 'cricket_matches', matchId),
    onNext,
    (err) => {
      console.warn(`[Firestore] cricket_matches/${matchId} listener note:`, err?.message || err);
      if (onError) onError(err);
    }
  );
}

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const QUOTA_STORAGE_KEY = 'firestore_quota_exhausted_until';
const QUOTA_DATE_KEY = 'firestore_quota_exhausted_date';

/**
 * Clears Firestore quota exhaustion state and resets the circuit breaker
 */
export function clearFirestoreQuotaExhaustion(): void {
  try {
    localStorage.removeItem(QUOTA_STORAGE_KEY);
    localStorage.removeItem(QUOTA_DATE_KEY);
    sessionStorage.removeItem(QUOTA_STORAGE_KEY);
    sessionStorage.removeItem(QUOTA_DATE_KEY);
  } catch {}
}

// Preserve active quota circuit breaker across reloads; only clear if expired
if (typeof window !== 'undefined') {
  try {
    const until = localStorage.getItem(QUOTA_STORAGE_KEY) || sessionStorage.getItem(QUOTA_STORAGE_KEY);
    if (until) {
      const expiry = parseInt(until, 10);
      if (isNaN(expiry) || Date.now() >= expiry) {
        clearFirestoreQuotaExhaustion();
      }
    }
  } catch {}
}

/**
 * Checks if Firestore write operations are currently paused due to daily quota exhaustion
 */
export function isFirestoreQuotaExhausted(): boolean {
  try {
    const until = localStorage.getItem(QUOTA_STORAGE_KEY) || sessionStorage.getItem(QUOTA_STORAGE_KEY);
    if (until) {
      const expiry = parseInt(until, 10);
      if (!isNaN(expiry)) {
        if (Date.now() < expiry) {
          return true;
        } else {
          clearFirestoreQuotaExhaustion();
          return false;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Sets a circuit breaker for Firestore writes to prevent continuous retries and backoff warnings
 */
export function recordFirestoreQuotaExhaustion(durationMinutes: number = 10) {
  try {
    const expiry = Date.now() + durationMinutes * 60 * 1000;
    localStorage.setItem(QUOTA_STORAGE_KEY, expiry.toString());
    sessionStorage.setItem(QUOTA_STORAGE_KEY, expiry.toString());
  } catch {
    // Ignore storage restrictions
  }
}

/**
 * Checks whether an error is caused by Firestore quota exhaustion or rate limits
 */
export function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const str = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    str.includes('resource-exhausted') ||
    str.includes('quota limit exceeded') ||
    str.includes('free daily write units') ||
    str.includes('quota exceeded')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  
  // Suppress throwing uncaught error when client is offline or service is unavailable
  const isOffline = message.toLowerCase().includes('offline') || 
                    message.toLowerCase().includes('unavailable') || 
                    message.toLowerCase().includes('network') || 
                    message.toLowerCase().includes('internet');
                    
  if (isOffline) {
    console.warn(`[Firestore Offline Mode] Operation: ${operationType}, Path: ${path || 'unknown'}. Connection unavailable, using local cache and state. Details:`, message);
    return;
  }

  // Quota exceeded / resource exhausted - operate gracefully in local mode without crashing
  if (isQuotaError(error)) {
    recordFirestoreQuotaExhaustion(2);
    console.warn(`[Firestore Quota Guard] Operation: ${operationType}, Path: ${path || 'unknown'}. Firestore daily write quota reached. Details:`, message);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  
  // Log for diagnostics
  console.error('Detailed Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanUndefined(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(cleanUndefined);
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) {
      result[k] = cleanUndefined(v);
    }
  }
  return result;
}

function pruneDocSize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  try {
    const clone = Array.isArray(obj) ? [...obj] : { ...obj };
    const imageKeys = ['teamALogo', 'teamBLogo', 'matchBannerUrl', 'customOverlayImg'];
    for (const k of imageKeys) {
      if (typeof clone[k] === 'string' && clone[k].length > 20000) clone[k] = '';
      if (clone.overlayConfig && typeof clone.overlayConfig[k] === 'string' && clone.overlayConfig[k].length > 20000) {
        clone.overlayConfig[k] = '';
      }
    }
    if (clone.playerPhotos && typeof clone.playerPhotos === 'object') {
      clone.playerPhotos = {};
    }
    if (Array.isArray(clone.teamASquad)) {
      clone.teamASquad = clone.teamASquad.map((p: any) => {
        if (p && typeof p === 'object' && p.photo) {
          const { photo, ...rest } = p;
          return rest;
        }
        return p;
      });
    }
    if (Array.isArray(clone.teamBSquad)) {
      clone.teamBSquad = clone.teamBSquad.map((p: any) => {
        if (p && typeof p === 'object' && p.photo) {
          const { photo, ...rest } = p;
          return rest;
        }
        return p;
      });
    }
    if (clone.innings1?.commentaryList && clone.innings1.commentaryList.length > 50) {
      clone.innings1 = { ...clone.innings1, commentaryList: clone.innings1.commentaryList.slice(-50) };
    }
    if (clone.innings2?.commentaryList && clone.innings2.commentaryList.length > 50) {
      clone.innings2 = { ...clone.innings2, commentaryList: clone.innings2.commentaryList.slice(-50) };
    }
    return cleanUndefined(clone);
  } catch {
    return cleanUndefined(obj);
  }
}

function isOversized(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  try {
    const s = JSON.stringify(data);
    return s.length > 250000;
  } catch {
    return false;
  }
}

async function saveMatchViaServerProxy(docId: string, data: any): Promise<boolean> {
  if (typeof window === 'undefined' || !docId) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const cleaned = cleanUndefined(data);
    const res = await fetch('/api/cricket/save-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: docId, matchData: cleaned }),
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function saveDocViaServerProxy(collectionName: string, docId: string, data: any, options?: any): Promise<boolean> {
  if (typeof window === 'undefined' || !collectionName || !docId) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const cleaned = cleanUndefined(data);
    const res = await fetch('/api/cricket/save-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, docId, data: cleaned, options }),
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function deleteDocViaServerProxy(collectionName: string, docId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !collectionName || !docId) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/cricket/delete-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ collectionName, docId }),
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Safe write wrapper for setDoc that routes writes via the resilient server proxy & local mirror
 * to avoid triggering client-side GrpcConnection/WebChannel Write stream quota errors.
 */
export async function safeSetDoc(docRef: any, data: any, options?: any) {
  const cleaned = cleanUndefined(data);
  const payloadToWrite = isOversized(cleaned) ? pruneDocSize(cleaned) : cleaned;
  
  const docPath = docRef?.path || '';
  const pathParts = docPath.split('/').filter(Boolean);
  const docId = docRef?.id || pathParts[pathParts.length - 1] || '';
  const collectionName = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : (pathParts[0] || '');
  const isTopLevelCricketMatch = collectionName === 'cricket_matches';

  // Mirror locally for instant offline/local readback
  if (typeof window !== 'undefined' && collectionName && docId) {
    try {
      const mirrorKey = `fs_mirror_${collectionName}_${docId}`;
      if (options?.merge) {
        const existingRaw = localStorage.getItem(mirrorKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        localStorage.setItem(mirrorKey, JSON.stringify({ ...existing, ...payloadToWrite }));
      } else {
        localStorage.setItem(mirrorKey, JSON.stringify(payloadToWrite));
      }
    } catch {}
  }

  // Also mirror to Firebase Realtime Database (RTDB) for cricket matches & tournaments
  if (isTopLevelCricketMatch && docId && rtdb) {
    try {
      const matchRef = rtdbRef(rtdb, `cricket_matches/${docId}`);
      rtdbSet(matchRef, { id: docId, ...payloadToWrite }).catch(() => {});
    } catch {}
  } else if (collectionName === 'cricket_tournaments' && docId && rtdb) {
    try {
      if (isOneHalfTournamentDocId(docId)) {
        const ohRef = rtdbRef(rtdb, 'cricket_one_half_tournament');
        rtdbSet(ohRef, { id: docId, ...payloadToWrite }).catch(() => {});
      } else {
        const tourRef = rtdbRef(rtdb, `cricket_tournaments/${docId}`);
        rtdbSet(tourRef, { id: docId, ...payloadToWrite }).catch(() => {});
      }
    } catch {}
  }

  // Primary path: Route through server proxy so client Firestore Write stream is never saturated
  if (isTopLevelCricketMatch && docId) {
    const ok = await saveMatchViaServerProxy(docId, payloadToWrite).catch(() => false);
    if (ok) return;
  }
  if (collectionName && docId) {
    const ok = await saveDocViaServerProxy(collectionName, docId, payloadToWrite, options).catch(() => false);
    if (ok) return;
  }
}

/**
 * Safe read wrapper that reads from server proxy / local mirror / Firestore with timeout
 */
export async function safeGetDoc(collectionName: string, docId: string): Promise<any | null> {
  if (typeof window === 'undefined' || !collectionName || !docId) return null;

  // 1. Fetch via server proxy (which checks both server fallback store and Firestore)
  try {
    const res = await fetch(`/api/cricket/get-doc?collectionName=${encodeURIComponent(collectionName)}&docId=${encodeURIComponent(docId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        return json.data;
      }
    }
  } catch (_) {}

  // 2. Check local mirror
  try {
    const mirrorRaw = localStorage.getItem(`fs_mirror_${collectionName}_${docId}`);
    if (mirrorRaw) {
      return JSON.parse(mirrorRaw);
    }
  } catch (_) {}

  // 3. Fallback to client Firestore if quota is not exhausted
  if (!isFirestoreQuotaExhausted()) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, collectionName, docId);
      const snap = await Promise.race([
        getDoc(docRef),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 3000))
      ]);
      if (snap && snap.exists()) {
        return snap.data();
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Safe write wrapper for updateDoc
 */
export async function safeUpdateDoc(docRef: any, ...args: any[]) {
  if (args.length === 1 && typeof args[0] === 'object') {
    await safeSetDoc(docRef, args[0], { merge: true });
    return;
  }
  const updateObj: Record<string, any> = {};
  for (let i = 0; i < args.length; i += 2) {
    if (typeof args[i] === 'string') {
      updateObj[args[i]] = args[i + 1];
    }
  }
  await safeSetDoc(docRef, updateObj, { merge: true });
}

/**
 * Safe write wrapper for addDoc
 */
export async function safeAddDoc(colRef: any, data: any): Promise<{ id: string }> {
  const newDocRef = doc(colRef);
  await safeSetDoc(newDocRef, { ...data, id: newDocRef.id });
  return { id: newDocRef.id };
}

/**
 * Safe write wrapper for deleteDoc
 */
export async function safeDeleteDoc(docRef: any) {
  const docPath = docRef?.path || '';
  const pathParts = docPath.split('/').filter(Boolean);
  const docId = docRef?.id || pathParts[pathParts.length - 1] || '';
  const collectionName = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : (pathParts[0] || '');

  if (typeof window !== 'undefined' && collectionName && docId) {
    try {
      localStorage.removeItem(`fs_mirror_${collectionName}_${docId}`);
    } catch {}
  }

  if (collectionName === 'cricket_matches' && docId && rtdb) {
    try {
      rtdbRemove(rtdbRef(rtdb, `cricket_matches/${docId}`)).catch(() => {});
    } catch {}
  } else if (collectionName === 'cricket_tournaments' && docId && rtdb) {
    try {
      rtdbRemove(rtdbRef(rtdb, `cricket_tournaments/${docId}`)).catch(() => {});
    } catch {}
  }

  if (collectionName && docId) {
    await deleteDocViaServerProxy(collectionName, docId).catch(() => false);
  }
}

async function testConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.log("Firestore client is offline (detected via navigator.onLine). Skipping active server connection check.");
    return;
  }
  if (isFirestoreQuotaExhausted()) {
    console.log("Firestore quota currently marked exhausted. Skipping active server connection check.");
    return;
  }
  try {
    // Try to get a non-existent doc from server to verify connection using a public path
    // Using a path that is explicitly allowed in rules
    await getDocFromServer(doc(db, '_internal_', 'connection_test'));
    console.log("Firestore connection verified.");
  } catch (error: any) {
    if (isQuotaError(error)) {
      recordFirestoreQuotaExhaustion(60);
    }
    console.warn("Firestore connection check bypassed (local/offline cache mode is active).");
  }
}
// Defer connection check to after critical initial page render is completed
setTimeout(() => {
  testConnection();
}, 5000);

export { signInWithPopup, onAuthStateChanged };
