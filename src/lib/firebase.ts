import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
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
  Database
} from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Silence internal Firestore SDK debug/warn backoff logs
try {
  setLogLevel('silent');
} catch {}

// Global window error listener to gracefully intercept internal assertion crashes from Firestore SDK
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || '';
    if (typeof msg === 'string' && msg.includes('FIRESTORE') && msg.includes('INTERNAL ASSERTION FAILED')) {
      console.warn('[Firestore SDK Guard] Intercepted internal assertion error:', msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = reason instanceof Error ? reason.message : String(reason || '');
    if (typeof msg === 'string' && msg.includes('FIRESTORE') && msg.includes('INTERNAL ASSERTION FAILED')) {
      console.warn('[Firestore SDK Guard] Intercepted internal assertion rejection:', msg);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

const app = initializeApp(firebaseConfig);

export const firestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId || 'ai-studio-remixshubhamhing-a0ff377c-7ae5-429e-9263-df2bcb690093';

// Initialize Firestore with memory cache to prevent IndexedDB lock conflicts in preview iframes
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  ignoreUndefinedProperties: true
}, firestoreDatabaseId);

// Initialize Firebase Realtime Database (RTDB)
export let rtdb: Database | null = null;
try {
  const customDbUrl = (firebaseConfig as any).databaseURL || (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_DATABASE_URL);
  if (customDbUrl) {
    rtdb = getDatabase(app, customDbUrl);
  } else {
    rtdb = getDatabase(app);
  }
} catch (err) {
  // If databaseURL is not provided or RTDB is not enabled in Firebase console, log informatively
  console.info('[Firebase Realtime Database] RTDB initialized in standby or requires databaseURL in firebase-applet-config.json:', err);
}

/**
 * Synchronize live cricket scores to Firebase Realtime Database
 */
export async function syncScoreToRealtimeDB(matchId: string, matchData: any): Promise<void> {
  if (!matchId || !matchData) return;
  if (!rtdb) return;
  try {
    const matchRef = rtdbRef(rtdb, `cricket_matches/${matchId}`);
    await rtdbSet(matchRef, matchData);

    // If match is currently live, also update active live match pointer for instant global discovery
    if (matchData.status === 'live') {
      const liveRef = rtdbRef(rtdb, 'cricket_active_live_match');
      await rtdbSet(liveRef, {
        id: matchData.id,
        teamA: matchData.teamA,
        teamB: matchData.teamB,
        status: matchData.status,
        updatedAt: matchData.updatedAt || Date.now(),
        match: matchData
      });
    } else if (matchData.status === 'completed') {
      const completedRef = rtdbRef(rtdb, 'cricket_completed_match');
      await rtdbSet(completedRef, matchData);
    }
  } catch (err) {
    console.warn('[Realtime Database] Live score push note:', err);
  }
}

/**
 * Subscribe to a specific cricket match in Firebase Realtime Database
 */
export function subscribeToRealtimeDBMatch(matchId: string, onUpdate: (match: any) => void): () => void {
  if (!matchId || !rtdb) return () => {};
  try {
    const matchRef = rtdbRef(rtdb, `cricket_matches/${matchId}`);
    return rtdbOnValue(matchRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) onUpdate(val);
      }
    }, (error) => {
      console.warn('[Realtime Database] Match listener note:', error);
    });
  } catch (e) {
    return () => {};
  }
}

/**
 * Subscribe to the active live match broadcast in Firebase Realtime Database
 */
export function subscribeToRealtimeDBActiveLive(onUpdate: (data: any) => void): () => void {
  if (!rtdb) return () => {};
  try {
    const liveRef = rtdbRef(rtdb, 'cricket_active_live_match');
    return rtdbOnValue(liveRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) onUpdate(val);
      }
    }, (error) => {
      console.warn('[Realtime Database] Global live listener note:', error);
    });
  } catch (e) {
    return () => {};
  }
}

/**
 * Subscribe to the list of all matches in Firebase Realtime Database
 */
export function subscribeToRealtimeDBMatchesList(onUpdate: (matches: any[]) => void): () => void {
  if (!rtdb) return () => {};
  try {
    const matchesRef = rtdbRef(rtdb, 'cricket_matches');
    return rtdbOnValue(matchesRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          const list = Object.values(val);
          onUpdate(list);
        } else {
          onUpdate([]);
        }
      } else {
        onUpdate([]);
      }
    }, (error) => {
      console.warn('[Realtime Database] Matches list listener note:', error);
    });
  } catch (e) {
    return () => {};
  }
}

/**
 * Subscribe to completed match updates in Firebase Realtime Database
 */
export function subscribeToRealtimeDBCompletedMatch(onUpdate: (completedMatch: any) => void): () => void {
  if (!rtdb) return () => {};
  try {
    const completedRef = rtdbRef(rtdb, 'cricket_completed_match');
    return rtdbOnValue(completedRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) onUpdate(val);
      }
    }, (error) => {
      console.warn('[Realtime Database] Completed match listener note:', error);
    });
  } catch (e) {
    return () => {};
  }
}

/**
 * Subscribe to the cricket_matches Firestore collection with error guard
 */
export function subscribeToCricketMatchesCollection(
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  try {
    const q = collection(db, 'cricket_matches');
    return onSnapshot(q, onNext, (err) => {
      console.warn('[Firestore] cricket_matches listener note:', err?.message || err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[Firestore] Failed to attach cricket_matches listener:', err);
    if (onError) onError(err);
    return () => {};
  }
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
  try {
    const docRef = doc(db, 'cricket_matches', matchId);
    return onSnapshot(docRef, onNext, (err) => {
      console.warn(`[Firestore] cricket_matches/${matchId} listener note:`, err?.message || err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn(`[Firestore] Failed to attach doc listener for ${matchId}:`, err);
    if (onError) onError(err);
    return () => {};
  }
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

// Automatically clear legacy hardcoded date lock and stale quota flags on startup
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(QUOTA_DATE_KEY);
    sessionStorage.removeItem(QUOTA_DATE_KEY);
    const until = localStorage.getItem(QUOTA_STORAGE_KEY) || sessionStorage.getItem(QUOTA_STORAGE_KEY);
    if (until) {
      const expiry = parseInt(until, 10);
      if (isNaN(expiry) || Date.now() >= expiry) {
        clearFirestoreQuotaExhaustion();
      }
    } else {
      clearFirestoreQuotaExhaustion();
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
      clone.teamASquad = clone.teamASquad.map((p: any) => (p && typeof p === 'object' && p.photo ? { ...p, photo: undefined } : p));
    }
    if (Array.isArray(clone.teamBSquad)) {
      clone.teamBSquad = clone.teamBSquad.map((p: any) => (p && typeof p === 'object' && p.photo ? { ...p, photo: undefined } : p));
    }
    if (clone.innings1?.commentaryList && clone.innings1.commentaryList.length > 50) {
      clone.innings1 = { ...clone.innings1, commentaryList: clone.innings1.commentaryList.slice(-50) };
    }
    if (clone.innings2?.commentaryList && clone.innings2.commentaryList.length > 50) {
      clone.innings2 = { ...clone.innings2, commentaryList: clone.innings2.commentaryList.slice(-50) };
    }
    return clone;
  } catch {
    return obj;
  }
}

/**
 * Safe write wrapper for setDoc that writes reliably with a timeout guard
 */
export async function safeSetDoc(docRef: any, data: any, options?: any) {
  try {
    const writePromise = options !== undefined ? setDoc(docRef, data, options) : setDoc(docRef, data);
    await Promise.race([
      writePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 9000))
    ]);
  } catch (error: any) {
    if (isQuotaError(error)) {
      recordFirestoreQuotaExhaustion(2);
      return;
    }
    const errMsg = String(error?.message || error || '').toLowerCase();
    if (errMsg.includes('exceeds the maximum allowed size') || errMsg.includes('1,048,576 bytes') || errMsg.includes('cannot be written because its size')) {
      console.warn('[Firestore Size Guard] Document size exceeds 1MB limit. Pruning media payloads and retrying...', docRef?.id);
      try {
        const pruned = pruneDocSize(data);
        const retryPromise = options !== undefined ? setDoc(docRef, pruned, options) : setDoc(docRef, pruned);
        await Promise.race([
          retryPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 9000))
        ]);
        return;
      } catch (retryErr) {
        console.warn('[Firestore Size Guard] Write failed after pruning. Maintained in local cache:', retryErr);
        return;
      }
    }
    throw error;
  }
}

/**
 * Safe write wrapper for updateDoc that writes reliably with a timeout guard
 */
export async function safeUpdateDoc(docRef: any, ...args: any[]) {
  try {
    const writePromise = (updateDoc as any)(docRef, ...args);
    await Promise.race([
      writePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore update timeout')), 9000))
    ]);
  } catch (error: any) {
    if (isQuotaError(error)) {
      recordFirestoreQuotaExhaustion(2);
      return;
    }
    const errMsg = String(error?.message || error || '').toLowerCase();
    if (errMsg.includes('not_found') || errMsg.includes('no document to update') || errMsg.includes('not-found')) {
      try {
        if (args.length === 1 && typeof args[0] === 'object') {
          await setDoc(docRef, args[0], { merge: true });
          return;
        }
      } catch (fallbackErr) {
        console.warn('[safeUpdateDoc fallback note]:', fallbackErr);
      }
    }
    throw error;
  }
}

/**
 * Safe write wrapper for deleteDoc that writes reliably with a timeout guard
 */
export async function safeDeleteDoc(docRef: any) {
  try {
    const writePromise = deleteDoc(docRef);
    await Promise.race([
      writePromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore delete timeout')), 9000))
    ]);
  } catch (error) {
    if (isQuotaError(error)) {
      recordFirestoreQuotaExhaustion(2);
      return;
    }
    throw error;
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
