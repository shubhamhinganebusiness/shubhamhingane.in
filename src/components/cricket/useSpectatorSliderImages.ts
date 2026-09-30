import { useState, useEffect, useCallback } from 'react';
import { db, safeOnSnapshot } from '../../lib/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { DEFAULT_PRESET_SPONSORS } from '../../utils/cricketSponsorsStorage';

export interface SponsorAdSlide {
  id: string;
  imageUrl: string;
  title: string;
  order: number;
  isActive?: boolean;
  folder?: string;
}

export const SPECTATOR_SLIDER_CACHE_KEY = 'gully_spectator_slider_images_cache';

/**
 * Hook to retrieve and subscribe to active advertisement / banner images
 * configured in the Super Admin dashboard (stored in 'spectator_slider_images').
 * Includes instant local cache reading and robust fallback to preset tournament sponsors.
 */
export function useSpectatorSliderImages() {
  const [adminAds, setAdminAds] = useState<SponsorAdSlide[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(SPECTATOR_SLIDER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((item: any) => item.isActive !== false && item.imageUrl);
        }
      }
    } catch (_) {}
    // Preset authentic sponsors as default fallback
    return DEFAULT_PRESET_SPONSORS.filter(s => s.bannerUrl && s.isActive).map((s, idx) => ({
      id: s.id || `preset-ad-${idx}`,
      imageUrl: s.bannerUrl!,
      title: s.name,
      order: idx,
      isActive: true,
      folder: 'ads'
    }));
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Sync to local cache helper
  const syncToLocalCache = useCallback((items: SponsorAdSlide[]) => {
    try {
      localStorage.setItem(SPECTATOR_SLIDER_CACHE_KEY, JSON.stringify(items));
    } catch (_) {}
  }, []);

  useEffect(() => {
    let unsub = () => {};

    try {
      const q = query(collection(db, 'spectator_slider_images'), orderBy('order', 'asc'));
      unsub = safeOnSnapshot(
        q,
        (snapshot) => {
          const items: SponsorAdSlide[] = [];
          snapshot.forEach((docSnap: any) => {
            const data = docSnap.data();
            if (data.isActive !== false && data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.trim() !== '') {
              items.push({
                id: docSnap.id,
                imageUrl: data.imageUrl.trim(),
                title: data.title || 'Official Sponsor',
                order: typeof data.order === 'number' ? data.order : 0,
                isActive: true,
                folder: data.folder || 'ads'
              });
            }
          });

          if (items.length > 0) {
            setAdminAds(items);
            syncToLocalCache(items);
          } else {
            // If empty in Firestore, use authentic preset tournament sponsors
            const fallbackAds = DEFAULT_PRESET_SPONSORS.filter(s => s.bannerUrl && s.isActive).map((s, idx) => ({
              id: s.id || `preset-ad-${idx}`,
              imageUrl: s.bannerUrl!,
              title: s.name,
              order: idx,
              isActive: true,
              folder: 'ads'
            }));
            setAdminAds(fallbackAds);
            syncToLocalCache(fallbackAds);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('[useSpectatorSliderImages] Firestore read note:', err?.message || err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn('[useSpectatorSliderImages] Init error:', err);
      setLoading(false);
    }

    // Listen for custom event from Super Admin updates
    const handleCustomUpdate = (e: any) => {
      const list = e?.detail;
      if (Array.isArray(list)) {
        const activeOnly = list.filter((i: any) => i.isActive !== false && i.imageUrl);
        setAdminAds(activeOnly);
        syncToLocalCache(activeOnly);
      }
    };

    const handleStorageUpdate = (e: StorageEvent) => {
      if (e.key === SPECTATOR_SLIDER_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAdminAds(parsed.filter((i: any) => i.isActive !== false && i.imageUrl));
          }
        } catch (_) {}
      }
    };

    window.addEventListener('spectator_slider_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      try {
        unsub();
      } catch {}
      window.removeEventListener('spectator_slider_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [syncToLocalCache]);

  return { adminAds, loading };
}
