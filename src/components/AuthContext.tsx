import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, isFirestoreQuotaExhausted, isQuotaError, recordFirestoreQuotaExhaustion, safeGetDoc } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const ADMIN_EMAILS = [
  'jamkhednewsnetwork@gmail.com',
  'shubhamhingane7719@gmail.com',
  'shubhamingane7719@gmail.com',
  '771999595@admin.com',
  '7719959593@admin.com',
  'shubhamhinganebusiness@gmail.com',
  'streetsportsoffical@gmail.com',
  'admin@gullyscore.com'
];

export interface AuthUser extends Partial<User> {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role?: string | null;
  mobile?: string;
  storeId?: string;
  pharmacyId?: string;
  messId?: string;
}

export interface AuthContextType {
  user: (User | AuthUser) | null;
  role: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isScoreManager: boolean;
  isDoctor: boolean;
  isPharmacy: boolean;
  isDairyAdmin: boolean;
  storeId: string | null;
  pharmacyId: string | null;
  messId: string | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User | AuthUser) | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check virtual session from localStorage if present
  const getVirtualSession = useCallback((): AuthUser | null => {
    try {
      const stored = localStorage.getItem('erp_virtual_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, []);

  const resolveIsAdminEmail = useCallback((email?: string | null): boolean => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return ADMIN_EMAILS.some(e => e.toLowerCase() === clean);
  }, []);

  const fetchProfile = useCallback(async (uid: string, email?: string | null) => {
    const isAdmin = resolveIsAdminEmail(email);
    let cachedRole: string | null = null;
    try {
      cachedRole = localStorage.getItem(`auth_role_${uid}`);
    } catch {}

    // First try safeGetDoc which checks server proxy / local mirror / firestore
    try {
      const data = await safeGetDoc('users', uid);
      if (data) {
        setUserProfile(data);
        const resolvedRole = data.role || (isAdmin ? 'super_admin' : cachedRole || 'user');
        setRole(resolvedRole);
        try {
          localStorage.setItem(`auth_role_${uid}`, resolvedRole);
        } catch {}
        return;
      }
    } catch (err: any) {
      if (isQuotaError(err)) {
        recordFirestoreQuotaExhaustion(30);
      }
    }

    // Fallback to cached or admin role
    const fallbackRole = isAdmin ? 'super_admin' : cachedRole || 'user';
    setRole(fallbackRole);
  }, [resolveIsAdminEmail]);

  useEffect(() => {
    let firestoreUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firestoreUnsub) {
        firestoreUnsub();
        firestoreUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const isAdmin = resolveIsAdminEmail(firebaseUser.email);
        
        let initialRole = isAdmin ? 'super_admin' : null;
        try {
          const cached = localStorage.getItem(`auth_role_${firebaseUser.uid}`);
          if (cached) initialRole = cached;
        } catch {}

        if (initialRole) {
          setRole(initialRole);
        }

        // Fetch or listen to Firestore profile safely
        if (!isFirestoreQuotaExhausted()) {
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            firestoreUnsub = onSnapshot(
              userDocRef,
              (snap) => {
                if (snap.exists()) {
                  const data = snap.data();
                  setUserProfile(data);
                  const effectiveRole = data.role || (isAdmin ? 'super_admin' : 'user');
                  setRole(effectiveRole);
                  try {
                    localStorage.setItem(`auth_role_${firebaseUser.uid}`, effectiveRole);
                  } catch {}
                } else {
                  if (isAdmin) {
                    setRole('super_admin');
                  }
                }
                setLoading(false);
              },
              (err) => {
                if (isQuotaError(err)) {
                  recordFirestoreQuotaExhaustion(30);
                }
                console.warn('[AuthContext] Firestore profile snapshot note (offline/quota fallback active):', err?.message);
                // Non-blocking fallback
                fetchProfile(firebaseUser.uid, firebaseUser.email).finally(() => setLoading(false));
              }
            );
          } catch {
            fetchProfile(firebaseUser.uid, firebaseUser.email).finally(() => setLoading(false));
          }
        } else {
          // Quota exhausted, rely on server proxy / cache
          fetchProfile(firebaseUser.uid, firebaseUser.email).finally(() => setLoading(false));
        }
      } else {
        // Check if there is an active virtual user session
        const virtualUser = getVirtualSession();
        if (virtualUser) {
          setUser(virtualUser);
          const effectiveRole = virtualUser.role || (resolveIsAdminEmail(virtualUser.email) ? 'super_admin' : 'user');
          setRole(effectiveRole);
          setUserProfile(virtualUser);
        } else {
          setUser(null);
          setRole(null);
          setUserProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (firestoreUnsub) firestoreUnsub();
    };
  }, [fetchProfile, getVirtualSession, resolveIsAdminEmail]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    try {
      localStorage.removeItem('erp_virtual_user');
      if (user?.uid) {
        localStorage.removeItem(`auth_role_${user.uid}`);
      }
    } catch {}
    setUser(null);
    setRole(null);
    setUserProfile(null);
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) {
      await fetchProfile(user.uid, user.email);
    }
  }, [user, fetchProfile]);

  const emailIsAdmin = resolveIsAdminEmail(user?.email);
  const isSuperAdmin = role === 'super_admin' || emailIsAdmin;
  const isScoreManager = isSuperAdmin || role === 'score_manager';
  const isDoctor = isSuperAdmin || role === 'doctor';
  const isPharmacy = isSuperAdmin || role === 'pharmacy';
  const isDairyAdmin = isSuperAdmin || role === 'dairy_admin';

  const storeId = useMemo(() => {
    return userProfile?.storeId || (user as any)?.storeId || (user ? user.uid : null);
  }, [userProfile, user]);

  const pharmacyId = useMemo(() => {
    return userProfile?.pharmacyId || (user as any)?.pharmacyId || (user ? user.uid : null);
  }, [userProfile, user]);

  const messId = useMemo(() => {
    return userProfile?.messId || (user as any)?.messId || (user ? user.uid : null);
  }, [userProfile, user]);

  const contextValue: AuthContextType = {
    user,
    role,
    loading,
    isSuperAdmin,
    isScoreManager,
    isDoctor,
    isPharmacy,
    isDairyAdmin,
    storeId,
    pharmacyId,
    messId,
    logout,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a safe dummy fallback instead of throwing to prevent crashing entire subtree
    return {
      user: null,
      role: null,
      loading: false,
      isSuperAdmin: false,
      isScoreManager: false,
      isDoctor: false,
      isPharmacy: false,
      isDairyAdmin: false,
      storeId: null,
      pharmacyId: null,
      messId: null,
      logout: async () => {},
      refreshProfile: async () => {}
    };
  }
  return context;
};
