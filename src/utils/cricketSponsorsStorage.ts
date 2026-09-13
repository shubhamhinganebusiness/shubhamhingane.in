import { db, safeSetDoc } from '../lib/firebase';
import { collection, doc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface LocalCricketSponsor {
  id: string;
  name: string;
  category: 'title' | 'powered_by' | 'over_breakdown' | 'livestream' | 'scorecard_pdf' | 'all';
  logoUrl: string;
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
    window.dispatchEvent(new CustomEvent('cricket_sponsors_updated'));
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
      saveLocalSponsors(remoteList);
      return remoteList;
    }
  } catch (err) {
    console.info('[CricketSponsors] Firestore read note, using cached:', err);
  }

  return getLocalSponsors();
}

/**
 * Save or update a sponsor document in Firestore & localStorage
 */
export async function saveSponsorToStorage(sponsor: LocalCricketSponsor): Promise<void> {
  // Update local list
  const current = getLocalSponsors();
  const existingIdx = current.findIndex((s) => s.id === sponsor.id);
  if (existingIdx >= 0) {
    current[existingIdx] = sponsor;
  } else {
    current.unshift(sponsor);
  }
  saveLocalSponsors(current);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'cricket_sponsors', sponsor.id);
    await safeSetDoc(docRef, sponsor);
  } catch (err) {
    console.warn('[CricketSponsors] Firestore safeSetDoc note:', err);
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
