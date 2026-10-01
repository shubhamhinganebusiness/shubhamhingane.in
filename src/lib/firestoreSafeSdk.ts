/**
 * Safe, crash-proof Firestore SDK adapter powered by `firebase/firestore/lite`.
 *
 * Why this exists:
 * Firebase JS SDK 12.12.0's full WebChannel streaming client (`@firebase/firestore`)
 * contains a state-machine bug in `WatchChangeAggregator` / `TargetState.We` (`ID: ca9`,
 * `CONTEXT: {"ve":-1}`) and `AsyncQueue` (`ID: b815`) when connected to Firestore Enterprise
 * Edition databases with concurrent or permission-rejected WatchStream targets.
 *
 * By routing Firestore operations through `firebase/firestore/lite` (stateless REST transport)
 * and providing a multiplexed, event-driven + polling `onSnapshot` implementation,
 * `WatchChangeAggregator` and `TargetState` are never loaded or invoked, making
 * `ID: ca9` and `ID: b815` internal assertion crashes impossible.
 */

import {
  Bytes,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  FieldValue,
  Firestore,
  FirestoreError,
  GeoPoint,
  Query,
  QueryCompositeFilterConstraint,
  QueryConstraint,
  QueryDocumentSnapshot,
  QueryEndAtConstraint,
  QueryFieldFilterConstraint,
  QueryLimitConstraint,
  QueryOrderByConstraint,
  QuerySnapshot,
  QueryStartAtConstraint,
  Timestamp,
  VectorValue,
  addDoc as liteAddDoc,
  and,
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  connectFirestoreEmulator,
  deleteDoc as liteDeleteDoc,
  deleteField,
  doc,
  documentId,
  endAt,
  endBefore,
  getDoc as liteGetDoc,
  getDocs as liteGetDocs,
  getFirestore as liteGetFirestore,
  increment,
  initializeFirestore as liteInitializeFirestore,
  limit,
  limitToLast,
  or,
  orderBy,
  query,
  queryEqual,
  refEqual,
  serverTimestamp,
  setDoc as liteSetDoc,
  setLogLevel as liteSetLogLevel,
  snapshotEqual,
  startAfter,
  startAt,
  terminate,
  updateDoc as liteUpdateDoc,
  vector,
  where,
  AggregateField,
  AggregateQuerySnapshot,
  Transaction,
  WriteBatch,
  aggregateFieldEqual,
  aggregateQuerySnapshotEqual,
  average,
  count,
  getAggregate,
  getCount,
  runTransaction,
  sum,
  writeBatch
} from 'firebase/firestore/lite';

try {
  liteSetLogLevel('silent');
} catch {}

export {
  Bytes,
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  FieldPath,
  FieldValue,
  Firestore,
  FirestoreError,
  GeoPoint,
  Query,
  QueryCompositeFilterConstraint,
  QueryConstraint,
  QueryDocumentSnapshot,
  QueryEndAtConstraint,
  QueryFieldFilterConstraint,
  QueryLimitConstraint,
  QueryOrderByConstraint,
  QuerySnapshot,
  QueryStartAtConstraint,
  Timestamp,
  VectorValue,
  and,
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  connectFirestoreEmulator,
  deleteField,
  doc,
  documentId,
  endAt,
  endBefore,
  increment,
  limit,
  limitToLast,
  or,
  orderBy,
  query,
  queryEqual,
  refEqual,
  serverTimestamp,
  snapshotEqual,
  startAfter,
  startAt,
  terminate,
  vector,
  where,
  AggregateField,
  AggregateQuerySnapshot,
  Transaction,
  WriteBatch,
  aggregateFieldEqual,
  aggregateQuerySnapshotEqual,
  average,
  count,
  getAggregate,
  getCount,
  runTransaction,
  sum,
  writeBatch
};

export type Unsubscribe = () => void;

export function setLogLevel(level: any): void {
  try {
    liteSetLogLevel(level);
  } catch {}
}

export function memoryLocalCache(_options?: any) {
  return { kind: 'memory' };
}

export function persistentLocalCache(_options?: any) {
  return { kind: 'persistent' };
}

export function getFirestore(app?: any, databaseId?: string): Firestore {
  if (databaseId) {
    return liteGetFirestore(app, databaseId);
  }
  return app ? liteGetFirestore(app) : liteGetFirestore();
}

export function initializeFirestore(app: any, settings?: any, databaseId?: string): Firestore {
  const liteSettings: Record<string, any> = {
    ignoreUndefinedProperties: settings?.ignoreUndefinedProperties ?? true
  };
  if (settings?.host) liteSettings.host = settings.host;
  if (settings?.ssl !== undefined) liteSettings.ssl = settings.ssl;
  try {
    return databaseId
      ? liteInitializeFirestore(app, liteSettings, databaseId)
      : liteInitializeFirestore(app, liteSettings);
  } catch {
    return databaseId ? liteGetFirestore(app, databaseId) : liteGetFirestore(app);
  }
}

function attachSnapshotMetadata(snap: any, isQuery: boolean): any {
  if (!snap || typeof snap !== 'object') return snap;
  if (!snap.metadata) {
    try {
      Object.defineProperty(snap, 'metadata', {
        value: { hasPendingWrites: false, fromCache: false },
        configurable: true
      });
    } catch {}
  }
  if (isQuery && typeof snap.docChanges !== 'function') {
    try {
      Object.defineProperty(snap, 'docChanges', {
        value: () =>
          (snap.docs || []).map((d: any, idx: number) => ({
            type: 'added' as const,
            doc: d,
            oldIndex: -1,
            newIndex: idx
          })),
        configurable: true
      });
    } catch {}
  }
  return snap;
}

export async function getDoc(docRef: any): Promise<any> {
  const snap = await liteGetDoc(docRef);
  return attachSnapshotMetadata(snap, false);
}

export const getDocFromCache = getDoc;
export const getDocFromServer = getDoc;

export async function getDocs(queryRef: any): Promise<any> {
  const snap = await liteGetDocs(queryRef);
  return attachSnapshotMetadata(snap, true);
}

export async function setDoc(docRef: any, data: any, options?: any): Promise<void> {
  if (options !== undefined) {
    await liteSetDoc(docRef, data, options);
  } else {
    await liteSetDoc(docRef, data);
  }
  notifyFirestoreMutation(docRef?.path);
}

export async function updateDoc(docRef: any, ...args: any[]): Promise<void> {
  await (liteUpdateDoc as any)(docRef, ...args);
  notifyFirestoreMutation(docRef?.path);
}

export async function addDoc(colRef: any, data: any): Promise<any> {
  const res = await liteAddDoc(colRef, data);
  notifyFirestoreMutation(colRef?.path);
  return res;
}

export async function deleteDoc(docRef: any): Promise<void> {
  await liteDeleteDoc(docRef);
  notifyFirestoreMutation(docRef?.path);
}

interface Subscriber {
  onNext: (snap: any) => void;
  onError?: (err: any) => void;
}

interface PolledStreamEntry {
  target: any;
  targetKey: string;
  basePath: string;
  isDoc: boolean;
  subscribers: Set<Subscriber>;
  lastSnapshot: any | null;
  pollTimer: any | null;
  debounceTimer: any | null;
  inFlight: boolean;
  consecutiveErrors: number;
}

const activeStreams = new Map<string, PolledStreamEntry>();

function extractBasePath(target: any): string {
  if (!target) return '';
  if (typeof target.path === 'string' && target.path) {
    return target.path;
  }
  const q = target._query || target;
  if (q?.path) {
    if (typeof q.path.canonicalString === 'function') {
      return q.path.canonicalString();
    }
    if (Array.isArray(q.path.segments)) {
      const offset = typeof q.path.offset === 'number' ? q.path.offset : 0;
      const len = typeof q.path.len === 'number' ? q.path.len : q.path.segments.length;
      return q.path.segments.slice(offset, offset + len).join('/');
    }
  }
  return '';
}

function getTargetKey(target: any): string {
  if (!target) return 'unknown';
  try {
    if (target.type === 'document' && typeof target.path === 'string') {
      return `doc:${target.path}`;
    }
    if (target.type === 'collection' && typeof target.path === 'string') {
      return `col:${target.path}`;
    }
    const q = target._query || target;
    const basePath = extractBasePath(target);
    if (basePath) {
      const filters = Array.isArray(q?.filters)
        ? q.filters
            .map((f: any) => {
              const field = f?.field?.canonicalString?.() || (Array.isArray(f?.field?.segments) ? f.field.segments.join('.') : '');
              const op = f?.op || '';
              let val = '';
              try {
                val = JSON.stringify(f?.value);
              } catch {}
              return `${field}${op}${val}`;
            })
            .join(',')
        : '';
      const orders = Array.isArray(q?.explicitOrderBy)
        ? q.explicitOrderBy
            .map((o: any) => {
              const field = o?.field?.canonicalString?.() || (Array.isArray(o?.field?.segments) ? o.field.segments.join('.') : '');
              return `${field}:${o?.dir || ''}`;
            })
            .join(',')
        : '';
      const lim = q?.limit ?? '';
      return `query:${basePath}|f:${filters}|o:${orders}|l:${lim}`;
    }
  } catch {}
  return `ref:${Math.random().toString(36).slice(2)}`;
}

function isQuotaExhaustedInStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const until = localStorage.getItem('firestore_quota_exhausted_until') || sessionStorage.getItem('firestore_quota_exhausted_until');
    if (until) {
      const expiry = parseInt(until, 10);
      if (!isNaN(expiry) && Date.now() < expiry) {
        return true;
      }
    }
  } catch {}
  return false;
}

async function fetchStreamSnapshot(entry: PolledStreamEntry): Promise<void> {
  if (entry.inFlight || entry.subscribers.size === 0) return;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && entry.lastSnapshot !== null) {
    return;
  }
  if (isQuotaExhaustedInStorage()) {
    return;
  }

  entry.inFlight = true;
  try {
    const snap = entry.isDoc ? await getDoc(entry.target) : await getDocs(entry.target);
    entry.consecutiveErrors = 0;
    entry.lastSnapshot = snap;
    entry.subscribers.forEach((sub) => {
      try {
        sub.onNext(snap);
      } catch (cbErr) {
        console.warn('[Firestore onSnapshot] Subscriber callback error:', cbErr);
      }
    });
  } catch (err: any) {
    entry.consecutiveErrors += 1;
    const msg = String(err?.message || err || '').toLowerCase();
    const isQuota = msg.includes('resource-exhausted') || msg.includes('quota exceeded') || msg.includes('quota limit exceeded');
    if (isQuota && typeof window !== 'undefined') {
      try {
        const expiry = Date.now() + 5 * 60 * 1000;
        localStorage.setItem('firestore_quota_exhausted_until', String(expiry));
        sessionStorage.setItem('firestore_quota_exhausted_until', String(expiry));
      } catch {}
    }

    // Stop rapid polling on persistent permission errors (e.g., unauthenticated user on private collection)
    if (msg.includes('permission') || msg.includes('insufficient') || isQuota) {
      if (entry.pollTimer) {
        clearInterval(entry.pollTimer);
        entry.pollTimer = null;
      }
    }

    entry.subscribers.forEach((sub) => {
      if (sub.onError) {
        try {
          sub.onError(err);
        } catch {}
      }
    });
  } finally {
    entry.inFlight = false;
  }
}

export function notifyFirestoreMutation(mutatedPath?: string): void {
  if (!mutatedPath) return;
  const cleanMutated = mutatedPath.replace(/^\/+|\/+$/g, '');
  const mutatedCol = cleanMutated.split('/')[0] || '';

  activeStreams.forEach((entry) => {
    const cleanEntry = entry.basePath.replace(/^\/+|\/+$/g, '');
    const entryCol = cleanEntry.split('/')[0] || '';
    if (
      !cleanMutated ||
      cleanEntry === cleanMutated ||
      cleanEntry.startsWith(cleanMutated + '/') ||
      cleanMutated.startsWith(cleanEntry + '/') ||
      (mutatedCol && mutatedCol === entryCol)
    ) {
      if (entry.debounceTimer) clearTimeout(entry.debounceTimer);
      entry.debounceTimer = setTimeout(() => {
        entry.debounceTimer = null;
        fetchStreamSnapshot(entry);
      }, 80);
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('fs_mirror_')) {
      const rest = e.key.slice('fs_mirror_'.length);
      const col = rest.split('_')[0];
      if (col) notifyFirestoreMutation(col);
    }
  });
}

/**
 * Drop-in compatible `onSnapshot` implementation using stateless REST fetches + instant mutation triggers.
 */
export function onSnapshot(target: any, ...args: any[]): Unsubscribe {
  if (!target || typeof window === 'undefined') {
    return () => {};
  }

  let onNext: ((snap: any) => void) | undefined;
  let onError: ((err: any) => void) | undefined;

  if (args.length > 0) {
    if (typeof args[0] === 'function') {
      onNext = args[0];
      if (typeof args[1] === 'function') {
        onError = args[1];
      } else if (args[1] && typeof args[1] === 'object' && typeof args[1].error === 'function') {
        onError = args[1].error.bind(args[1]);
      }
    } else if (args[0] && typeof args[0] === 'object') {
      if (typeof args[0].next === 'function' || typeof args[0].error === 'function') {
        if (typeof args[0].next === 'function') onNext = args[0].next.bind(args[0]);
        if (typeof args[0].error === 'function') onError = args[0].error.bind(args[0]);
      } else if (typeof args[1] === 'function') {
        onNext = args[1];
        if (typeof args[2] === 'function') onError = args[2];
      } else if (args[1] && typeof args[1] === 'object') {
        if (typeof args[1].next === 'function') onNext = args[1].next.bind(args[1]);
        if (typeof args[1].error === 'function') onError = args[1].error.bind(args[1]);
      }
    }
  }

  if (!onNext) {
    return () => {};
  }

  const targetKey = getTargetKey(target);
  const basePath = extractBasePath(target);
  const isDoc = target.type === 'document';
  const sub: Subscriber = { onNext, onError };

  let entry = activeStreams.get(targetKey);
  if (entry) {
    entry.subscribers.add(sub);
    if (entry.lastSnapshot) {
      const cached = entry.lastSnapshot;
      setTimeout(() => {
        if (entry && entry.subscribers.has(sub)) {
          try {
            sub.onNext(cached);
          } catch {}
        }
      }, 0);
    } else {
      fetchStreamSnapshot(entry);
    }
  } else {
    entry = {
      target,
      targetKey,
      basePath,
      isDoc,
      subscribers: new Set([sub]),
      lastSnapshot: null,
      pollTimer: null,
      debounceTimer: null,
      inFlight: false,
      consecutiveErrors: 0
    };
    activeStreams.set(targetKey, entry);

    // Initial fetch
    fetchStreamSnapshot(entry);

    // Poll interval (6s for active cricket/live collections, 15s for static/CMS collections)
    const isLiveCricket =
      basePath.includes('cricket_matches') ||
      basePath.includes('cricket_live_summaries') ||
      basePath.includes('score_managers') ||
      basePath.includes('cricket_tournaments') ||
      basePath.includes('fan_polls');
    const intervalMs = isLiveCricket ? 6000 : 15000;

    entry.pollTimer = setInterval(() => {
      const current = activeStreams.get(targetKey);
      if (!current || current.subscribers.size === 0) return;
      fetchStreamSnapshot(current);
    }, intervalMs);
  }

  return () => {
    const current = activeStreams.get(targetKey);
    if (!current) return;
    current.subscribers.delete(sub);
    if (current.subscribers.size === 0) {
      if (current.pollTimer) {
        clearInterval(current.pollTimer);
        current.pollTimer = null;
      }
      if (current.debounceTimer) {
        clearTimeout(current.debounceTimer);
        current.debounceTimer = null;
      }
      activeStreams.delete(targetKey);
    }
  };
}
