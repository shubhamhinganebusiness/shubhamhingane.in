import { db, safeSetDoc } from '../lib/firebase';
import { collection, doc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';

export interface LocalCricketSponsor {
  id: string;
  name: string;
  category: 'title' | 'powered_by' | 'over_breakdown' | 'livestream' | 'scorecard_pdf' | 'all';
  logoUrl: string;
  bannerUrl?: string;
  tagline?: string;
  phone?: string;
  website?: string;
  sponsorTier: 'Title Sponsor' | 'Powered By' | 'Associate Partner' | 'Local Community Partner';
  displayOnOverBreakdown: boolean;
  displayOnLiveStream: boolean;
  displayOnScorecardPdf: boolean;
  isActive: boolean;
  createdAt: number;
}

const LOCAL_SPONSORS_KEY = 'gullyscore_local_sponsors_registry';

// Preset sponsors that represent authentic local Indian gully & tournament sponsorships
export const DEFAULT_PRESET_SPONSORS: LocalCricketSponsor[] = [
  {
    id: 'sponsor_ganesh_jewellers',
    name: 'Shree Ganesh Jewellers',
    category: 'all',
    logoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80',
    tagline: '916 Hallmarked Pure Gold & Diamond Ornaments • Near Gandhi Chowk',
    phone: '+91 98221 00000',
    sponsorTier: 'Title Sponsor',
    displayOnOverBreakdown: true,
    displayOnLiveStream: true,
    displayOnScorecardPdf: true,
    isActive: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'sponsor_sai_clinic',
    name: 'Sai Care Multispeciality Hospital',
    category: 'over_breakdown',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&auto=format&fit=crop&q=80',
    tagline: '24x7 Emergency Trauma Care & Sports Injury Center',
    phone: '+91 94220 12345',
    sponsorTier: 'Powered By',
    displayOnOverBreakdown: true,
    displayOnLiveStream: true,
    displayOnScorecardPdf: true,
    isActive: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'sponsor_raju_bakery',
    name: 'Raju Fresh Bakery & Sweets',
    category: 'over_breakdown',
    logoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    tagline: 'Fresh Cream Cakes, Snacks & Cold Drinks for Players',
    phone: '+91 97654 88888',
    sponsorTier: 'Associate Partner',
    displayOnOverBreakdown: true,
    displayOnLiveStream: false,
    displayOnScorecardPdf: true,
    isActive: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sponsor_shivaji_sports',
    name: 'Shivaji Sports & Cricket Kit House',
    category: 'livestream',
    logoUrl: 'https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?w=300&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80',
    tagline: 'Premium Kashmir & English Willow Bats • Uniforms on Wholesale',
    phone: '+91 98900 54321',
    sponsorTier: 'Local Community Partner',
    displayOnOverBreakdown: false,
    displayOnLiveStream: true,
    displayOnScorecardPdf: true,
    isActive: true,
    createdAt: Date.now() - 86400000,
  }
];

export function getLocalSponsors(): LocalCricketSponsor[] {
  if (typeof window === 'undefined') return DEFAULT_PRESET_SPONSORS;
  try {
    const raw = localStorage.getItem(LOCAL_SPONSORS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_SPONSORS_KEY, JSON.stringify(DEFAULT_PRESET_SPONSORS));
      return DEFAULT_PRESET_SPONSORS;
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_PRESET_SPONSORS;
  } catch {
    return DEFAULT_PRESET_SPONSORS;
  }
}

export function saveLocalSponsors(sponsors: LocalCricketSponsor[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_SPONSORS_KEY, JSON.stringify(sponsors));
    window.dispatchEvent(new CustomEvent('cricket_sponsors_updated', { detail: { sponsors } }));
  } catch (err) {
    console.warn('[CricketSponsors] Local storage write error:', err);
  }
}

/**
 * Fetch sponsors from Firestore with fallback to localStorage presets
 */
export async function fetchAllSponsors(): Promise<LocalCricketSponsor[]> {
  try {
    const snap = await getDocs(collection(db, 'cricket_sponsors'));
    const remoteList: LocalCricketSponsor[] = [];
    snap.forEach((d) => {
      const data = d.data() as LocalCricketSponsor;
      if (data && data.name) {
        remoteList.push({ ...data, id: d.id });
      }
    });

    if (remoteList.length > 0) {
      const current = getLocalSponsors();
      const map = new Map<string, LocalCricketSponsor>();
      DEFAULT_PRESET_SPONSORS.forEach(p => map.set(p.id, p));
      current.forEach(c => map.set(c.id, c));
      remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
      const merged = Array.from(map.values());
      saveLocalSponsors(merged);
      return merged;
    }
  } catch (err) {
    console.info('[CricketSponsors] Firestore read note, using cached:', err);
  }

  return getLocalSponsors();
}

/**
 * Subscribe to real-time sponsor updates across devices
 */
export function subscribeToSponsors(callback: (sponsors: LocalCricketSponsor[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    return onSnapshot(collection(db, 'cricket_sponsors'), (snap) => {
      const remoteList: LocalCricketSponsor[] = [];
      snap.forEach(d => {
        const data = d.data() as LocalCricketSponsor;
        if (data && data.name) {
          remoteList.push({ ...data, id: d.id });
        }
      });
      if (remoteList.length > 0) {
        const current = getLocalSponsors();
        const map = new Map<string, LocalCricketSponsor>();
        DEFAULT_PRESET_SPONSORS.forEach(p => map.set(p.id, p));
        current.forEach(c => map.set(c.id, c));
        remoteList.forEach(r => map.set(r.id, { ...(map.get(r.id) || {}), ...r }));
        const merged = Array.from(map.values());
        saveLocalSponsors(merged);
        callback(merged);
      } else {
        callback(getLocalSponsors());
      }
    }, (err) => {
      console.warn('[CricketSponsors] onSnapshot stream note:', err);
      callback(getLocalSponsors());
    });
  } catch (e) {
    callback(getLocalSponsors());
    return () => {};
  }
}

/**
 * Save or update a sponsor document in Firestore & localStorage
 */
export async function saveSponsorToStorage(sponsor: LocalCricketSponsor): Promise<void> {
  // 1. Update local list immediately so UI updates without lag
  const current = getLocalSponsors();
  const existingIdx = current.findIndex((s) => s.id === sponsor.id);
  if (existingIdx >= 0) {
    current[existingIdx] = { ...current[existingIdx], ...sponsor };
  } else {
    current.unshift(sponsor);
  }
  saveLocalSponsors(current);

  // 2. Sync to Firestore
  try {
    const docRef = doc(db, 'cricket_sponsors', sponsor.id);
    await safeSetDoc(docRef, sponsor);
  } catch (err) {
    console.warn('[CricketSponsors] Firestore safeSetDoc note:', err);
    // Proxy fallback
    try {
      await fetch('/api/cricket/save-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionName: 'cricket_sponsors',
          docId: sponsor.id,
          data: sponsor
        })
      });
    } catch (_) {}
  }
}

/**
 * Delete a sponsor
 */
export async function deleteSponsorFromStorage(id: string): Promise<void> {
  const current = getLocalSponsors().filter((s) => s.id !== id);
  saveLocalSponsors(current);

  try {
    const docRef = doc(db, 'cricket_sponsors', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[CricketSponsors] Firestore deleteDoc note:', err);
  }
}
