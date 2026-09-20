import { db, safeSetDoc } from '../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

export type PrizeCategory =
  | 'tournament_1st'
  | 'tournament_2nd'
  | 'tournament_3rd'
  | 'tournament_4th'
  | 'best_batsman'
  | 'best_bowler'
  | 'man_of_series'
  | 'fourth_prize'
  | 'custom';

export interface TournamentPrize {
  id: string; // 'tournament_1st' | 'tournament_2nd' | 'tournament_3rd' | 'tournament_4th' | 'best_batsman' | etc or custom ID
  category: PrizeCategory;
  title: string; // e.g. "Tournament 1st Prize / Champion", "Tournament 2nd Prize / Runner-Up", etc.
  personName: string; // The person or sponsor who gave the prize money
  personPhoto: string; // URL or base64 data URL
  personDesignation?: string; // e.g. "Sarpanch", "Cricket Patron", "Chief Guest", "Firm Name"
  amount: string; // e.g. "51,000", "31,000", "21,000"
  currency: string; // default "₹"
  tagline?: string; // e.g. "Champion Trophy & Cash Sponsored By"
  isActive: boolean; // toggle visibility
  updatedAt?: number;
}

const STORAGE_KEY = 'gullyscore_tournament_prizes_v1';

export const STANDARD_TOURNAMENT_PRIZES: TournamentPrize[] = [
  {
    id: 'tournament_1st',
    category: 'tournament_1st',
    title: 'Tournament 1st Prize / Champion',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: 'Champion Trophy & Cash Sponsored By',
    isActive: true,
  },
  {
    id: 'tournament_2nd',
    category: 'tournament_2nd',
    title: 'Tournament 2nd Prize / Runner-Up',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: 'Runner-Up Trophy & Cash Sponsored By',
    isActive: true,
  },
  {
    id: 'tournament_3rd',
    category: 'tournament_3rd',
    title: 'Tournament 3rd Prize',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: '3rd Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'tournament_4th',
    category: 'tournament_4th',
    title: 'Tournament 4th Prize',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: '4th Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'man_of_series',
    category: 'man_of_series',
    title: 'Man of the Series Award',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: 'Grand Award Sponsored By',
    isActive: true,
  },
  {
    id: 'best_batsman',
    category: 'best_batsman',
    title: 'Best Batsman Award',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: 'Cash Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'best_bowler',
    category: 'best_bowler',
    title: 'Best Bowler Award',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    amount: '',
    currency: '₹',
    tagline: 'Cash Prize Sponsored By',
    isActive: true,
  },
];

export const DEFAULT_FOUR_PRIZES: TournamentPrize[] = STANDARD_TOURNAMENT_PRIZES;

/**
 * Filter prizes that have valid details entered by the score manager.
 * Requirement: "if score manager not added this details it will not show"
 */
export function getValidActivePrizes(prizes: TournamentPrize[]): TournamentPrize[] {
  if (!Array.isArray(prizes)) return [];
  return prizes.filter((p) => {
    if (!p.isActive) return false;
    const hasName = typeof p.personName === 'string' && p.personName.trim().length > 0;
    const hasAmount = typeof p.amount === 'string' && p.amount.trim().length > 0;
    // Must have at least a sponsor name or an amount to show
    return hasName || hasAmount;
  });
}

function getStorageKey(matchId?: string): string {
  if (matchId && matchId.trim().length > 0) {
    return `${STORAGE_KEY}_${matchId.trim()}`;
  }
  return STORAGE_KEY;
}

/**
 * Get tournament prizes from localStorage.
 */
export function getTournamentPrizes(matchId?: string): TournamentPrize[] {
  if (typeof window === 'undefined') return DEFAULT_FOUR_PRIZES;
  try {
    const key = getStorageKey(matchId);
    let raw = localStorage.getItem(key);
    
    // Check if match-specific storage has valid details
    let useGlobalFallback = false;
    if (raw && matchId) {
      try {
        const parsedMatch = JSON.parse(raw);
        if (getValidActivePrizes(parsedMatch).length === 0) {
          useGlobalFallback = true;
        }
      } catch (_) {
        useGlobalFallback = true;
      }
    } else if (!raw && matchId) {
      useGlobalFallback = true;
    }

    if (useGlobalFallback) {
      const globalRaw = localStorage.getItem(STORAGE_KEY);
      if (globalRaw) {
        try {
          const parsedGlobal = JSON.parse(globalRaw);
          if (getValidActivePrizes(parsedGlobal).length > 0 || !raw) {
            raw = globalRaw;
          }
        } catch (_) {}
      }
    }

    if (!raw) {
      return STANDARD_TOURNAMENT_PRIZES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all standard tournament prizes (1st, 2nd, 3rd, 4th, awards) exist
      const merged = STANDARD_TOURNAMENT_PRIZES.map((def) => {
        const found = parsed.find(
          (p: TournamentPrize) =>
            p.id === def.id ||
            p.category === def.category ||
            (def.id === 'tournament_1st' && (p.id === 'fourth_prize' || p.category === 'fourth_prize'))
        );
        return found ? { ...def, ...found, id: def.id, category: def.category } : def;
      });
      // Append any custom additional prizes if exist
      const additional = parsed.filter(
        (p: TournamentPrize) =>
          !STANDARD_TOURNAMENT_PRIZES.some((def) => def.id === p.id || def.category === p.category) &&
          p.id !== 'fourth_prize'
      );
      return [...merged, ...additional];
    }
    return STANDARD_TOURNAMENT_PRIZES;
  } catch (err) {
    console.warn('Error reading tournament prizes from storage:', err);
    return STANDARD_TOURNAMENT_PRIZES;
  }
}

/**
 * Save tournament prizes to localStorage and sync with Firestore & event bus.
 */
export async function saveTournamentPrizes(prizes: TournamentPrize[], matchId?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const key = getStorageKey(matchId);
  const data = prizes.map((p) => ({ ...p, updatedAt: Date.now() }));
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Also save to global key as current active tournament prizes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Error saving tournament prizes to localStorage:', err);
  }

  // Dispatch custom window event so scorebug and overlay update immediately
  try {
    window.dispatchEvent(
      new CustomEvent('cricket_prizes_updated', {
        detail: { matchId, prizes: data },
      })
    );
  } catch (_) {}

  // Broadcast across tabs and all iframes via BroadcastChannel
  try {
    const bc = new BroadcastChannel('cricket_prizes_channel');
    bc.postMessage({ type: 'PRIZES_UPDATED', matchId, prizes: data });
    setTimeout(() => {
      try { bc.close(); } catch (_) {}
    }, 500);
  } catch (_) {}

  // Post to all child iframes (for overlay preview iframes)
  if (typeof document !== 'undefined') {
    try {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((frame) => {
        try {
          frame.contentWindow?.postMessage({ type: 'PRIZES_UPDATED', matchId, prizes: data }, '*');
        } catch (_) {}
      });
    } catch (_) {}
  }

  // Post to parent window if running inside an iframe
  if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
    try {
      window.parent.postMessage({ type: 'PRIZES_UPDATED', matchId, prizes: data }, '*');
    } catch (_) {}
  }

  // Sync to Firestore if online
  if (db) {
    try {
      const docId = matchId ? `prizes_${matchId}` : 'prizes_current';
      await safeSetDoc(doc(db, 'cricket_tournament_prizes', docId), {
        matchId: matchId || null,
        prizes: data,
        updatedAt: Date.now(),
      });

      // Also persist to match document if matchId is provided
      if (matchId) {
        try {
          await safeSetDoc(doc(db, 'cricket_matches', matchId), {
            tournamentPrizes: data,
          }, { merge: true });
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Firestore sync for tournament prizes failed (offline fallback active):', err);
    }
  }
}

/**
 * Subscribe to tournament prize updates (via CustomEvent, StorageEvent, and Firestore).
 */
export function subscribeToTournamentPrizes(
  callback: (prizes: TournamentPrize[]) => void,
  matchId?: string
): () => void {
  const handleEvent = (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail?.prizes) {
      callback(custom.detail.prizes);
    } else {
      callback(getTournamentPrizes(matchId));
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || (matchId && e.key === getStorageKey(matchId))) {
      callback(getTournamentPrizes(matchId));
    }
  };

  // 1. Window Event and Storage listeners
  const handleMessage = (e: MessageEvent) => {
    if (e.data && e.data.type === 'PRIZES_UPDATED') {
      if (!matchId || !e.data.matchId || e.data.matchId === matchId) {
        if (Array.isArray(e.data.prizes)) {
          callback(e.data.prizes);
        } else {
          callback(getTournamentPrizes(matchId));
        }
      }
    }
  };

  let prizesBc: BroadcastChannel | null = null;
  try {
    prizesBc = new BroadcastChannel('cricket_prizes_channel');
    prizesBc.onmessage = handleMessage;
  } catch (_) {}

  if (typeof window !== 'undefined') {
    window.addEventListener('cricket_prizes_updated', handleEvent);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('message', handleMessage);
  }

  // Firestore live listener
  let unsubFirestore: (() => void) | null = null;
  if (db) {
    try {
      const docId = matchId ? `prizes_${matchId}` : 'prizes_current';
      unsubFirestore = onSnapshot(
        doc(db, 'cricket_tournament_prizes', docId),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data?.prizes)) {
              callback(data.prizes);
            }
          }
        },
        () => {
          // ignore offline error
        }
      );
    } catch (_) {}
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('cricket_prizes_updated', handleEvent);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('message', handleMessage);
    }
    if (prizesBc) {
      try { prizesBc.close(); } catch (_) {}
    }
    if (unsubFirestore) {
      unsubFirestore();
    }
  };
}

/**
 * Sample Demo Presets for quick 1-click preview / test by the score manager
 */
export const SAMPLE_DEMO_PRIZES: TournamentPrize[] = [
  {
    id: 'tournament_1st',
    category: 'tournament_1st',
    title: 'Tournament 1st Prize / Champion',
    personName: 'Choudhary Brothers Construction',
    personPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Main Tournament Sponsor',
    amount: '51,000',
    currency: '₹',
    tagline: 'Champion Trophy & Cash Sponsored By',
    isActive: true,
  },
  {
    id: 'tournament_2nd',
    category: 'tournament_2nd',
    title: 'Tournament 2nd Prize / Runner-Up',
    personName: 'Shri Ramesh Patil',
    personPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Sarpanch, Gram Panchayat',
    amount: '31,000',
    currency: '₹',
    tagline: 'Runner-Up Trophy & Cash Sponsored By',
    isActive: true,
  },
  {
    id: 'tournament_3rd',
    category: 'tournament_3rd',
    title: 'Tournament 3rd Prize',
    personName: 'Balaji Developers & Infra',
    personPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Cricket Patron & Donor',
    amount: '21,000',
    currency: '₹',
    tagline: '3rd Prize Trophy Sponsored By',
    isActive: true,
  },
  {
    id: 'tournament_4th',
    category: 'tournament_4th',
    title: 'Tournament 4th Prize',
    personName: 'Maa Bhavani Sports Club',
    personPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Youth Sports Foundation',
    amount: '11,000',
    currency: '₹',
    tagline: '4th Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'man_of_series',
    category: 'man_of_series',
    title: 'Man of the Series Award',
    personName: 'Vikramaditya Shinde',
    personPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'President, Yuva Krida Mandal',
    amount: '15,000',
    currency: '₹',
    tagline: 'Grand Cash Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'best_batsman',
    category: 'best_batsman',
    title: 'Best Batsman Award',
    personName: 'Dr. Ashok Deshmukh',
    personPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Patron & Sports Enthusiast',
    amount: '7,000',
    currency: '₹',
    tagline: 'Cash Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'best_bowler',
    category: 'best_bowler',
    title: 'Best Bowler Award',
    personName: 'Ganesh Auto Electricals',
    personPhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Local Business Partner',
    amount: '7,000',
    currency: '₹',
    tagline: 'Cash Prize Sponsored By',
    isActive: true,
  },
  {
    id: 'custom_sixes',
    category: 'custom',
    title: 'Maximum Sixes Award',
    personName: 'Sai Samarth Jewellers',
    personPhoto: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Gold Medal & Trophy Sponsor',
    amount: '5,000',
    currency: '₹',
    tagline: 'Award Sponsored By',
    isActive: true,
  },
];
