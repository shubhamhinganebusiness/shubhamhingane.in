import { useState, useEffect } from 'react';
import { db, safeOnSnapshot } from '../lib/firebase';
import { collection } from 'firebase/firestore';
import { useCMS } from '../components/CMSContext';

export function useSiteSettings() {
  return useCMS();
}

export function useCMSCollection(colName: string) {
  const [items, setItems] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem(`cms_col_cache_${colName}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = safeOnSnapshot(
        collection(db, colName),
        (snap) => {
          const list = Array.isArray(snap?.docs)
            ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
            : [];
          setItems(list);
          setLoading(false);
          try {
            localStorage.setItem(`cms_col_cache_${colName}`, JSON.stringify(list));
          } catch {}
        },
        (err) => {
          console.warn(`useCMSCollection(${colName}) subscription issue (unconfigured or offline):`, err?.message || err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn(`useCMSCollection(${colName}) init note:`, err);
      setLoading(false);
    }

    return () => {
      if (unsub) {
        try {
          unsub();
        } catch {}
      }
    };
  }, [colName]);

  return { items, loading };
}

