import React, { createContext, useContext, useState, useEffect } from 'react';

interface CMSContextType {
  settings: any;
  loading: boolean;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<any>(() => {
    try {
      const cached = localStorage.getItem('cms_site_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem('cms_site_settings');
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let unsub: (() => void) | undefined;

    const initCMS = async () => {
      try {
        const { db } = await import('../lib/firebase');
        const { doc, onSnapshot } = await import('firebase/firestore');

        // Only one listener for the entire app
        unsub = onSnapshot(doc(db, 'site', 'settings'), (snap) => {
          let data = {};
          if (snap.exists()) {
            data = snap.data();
          }
          setSettings(data);
          setLoading(false);
          try {
            localStorage.setItem('cms_site_settings', JSON.stringify(data));
          } catch (err) {
            console.warn("Failed to cache site settings:", err);
          }
        }, (error) => {
          console.warn("Firestore site settings subscription issue (unconfigured or offline) - using default state:", error);
          setSettings((prev: any) => prev || {});
          setLoading(false);
        });
      } catch (err) {
        console.warn("Failed to lazy load site settings (unconfigured or offline):", err);
        setSettings((prev: any) => prev || {});
        setLoading(false);
      }
    };

    initCMS();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  return (
    <CMSContext.Provider value={{ settings, loading }}>
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
