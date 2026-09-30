import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, collection, onSnapshot } from 'firebase/firestore';
import { useCMS } from '../components/CMSContext';

export function useSiteSettings() {
  return useCMS();
}

export function useCMSCollection(colName: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, colName), (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn(`useCMSCollection(${colName}) subscription issue (unconfigured or offline):`, err);
      setItems([]);
      setLoading(false);
    });
    return unsub;
  }, [colName]);

  return { items, loading };
}

