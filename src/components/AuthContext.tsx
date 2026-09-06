import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  role: 'super_admin' | 'dairy_admin' | 'Doctor' | 'Pharmacy' | 'mess_owner' | 'furniture_admin' | 'score_manager' | null;
  isSuperAdmin: boolean;
  isDairyAdmin: boolean;
  isDoctor: boolean;
  isPharmacy: boolean;
  isMessOwner: boolean;
  isFurnitureAdmin: boolean;
  isScoreManager: boolean;
  storeId: string | null;
  pharmacyId: string | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isSuperAdmin: false,
  isDairyAdmin: false,
  isDoctor: false,
  isPharmacy: false,
  isMessOwner: false,
  isFurnitureAdmin: false,
  isScoreManager: false,
  storeId: null,
  pharmacyId: null,
  loading: true,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sync lookup helpers to eliminate first-render flashing
  const getInitialSession = () => {
    try {
      const virtualUserStr = localStorage.getItem('erp_virtual_user');
      if (virtualUserStr) {
        const vu = JSON.parse(virtualUserStr);
        return {
          user: vu as any,
          role: (vu.role || 'super_admin') as any,
          pharmacyId: vu.pharmacyId || null,
          storeId: vu.storeId || null,
          loading: false
        };
      }
    } catch (e) {
      console.warn('LocalStorage erp_virtual_user read failed:', e);
    }
    return {
      user: null,
      role: null,
      pharmacyId: null,
      storeId: null,
      loading: true
    };
  };

  const initial = getInitialSession();
  const [user, setUser] = useState<User | null>(initial.user);
  const [role, setRole] = useState<'super_admin' | 'dairy_admin' | 'Doctor' | 'Pharmacy' | 'mess_owner' | 'furniture_admin' | 'score_manager' | null>(initial.role);
  const [storeId, setStoreId] = useState<string | null>(initial.storeId);
  const [pharmacyId, setPharmacyId] = useState<string | null>(initial.pharmacyId);
  const [loading, setLoading] = useState(initial.loading);

  useEffect(() => {
    const checkUserSession = async () => {
      // 1. Try to fetch Virtual Local Storage Master Session First (Failsafe)
      let virtualUserStr = null;
      try {
        virtualUserStr = localStorage.getItem('erp_virtual_user');
      } catch (e) {
        console.warn('LocalStorage erp_virtual_user read blocked:', e);
      }
      
      if (virtualUserStr) {
        try {
          const vu = JSON.parse(virtualUserStr);
          setUser(vu as any);
          setRole(vu.role || 'super_admin');
          setPharmacyId(vu.pharmacyId || null);
          setStoreId(vu.storeId || null);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse virtual user:', e);
        }
      }

      const { auth, db, isFirestoreQuotaExhausted } = await import('../lib/firebase');
      const { onAuthStateChanged } = await import('firebase/auth');
      const { doc, getDoc, setDoc, query, collection, where, getDocs, limit } = await import('firebase/firestore');

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        // Double-check if a virtual user session was created during the duration of onAuthStateChanged callback
        let nestedVirtualUser = null;
        try {
          nestedVirtualUser = localStorage.getItem('erp_virtual_user');
        } catch (e) {}
        
        if (nestedVirtualUser) {
          setLoading(false);
          return;
        }

        setLoading(true);
        if (user) {
          setUser(user);
          
          // Safety check for the owner's email - always give them super_admin role if they log in
          const adminEmails = [
            'jamkhednewsnetwork@gmail.com', 
            'shubhamhingane7719@gmail.com',
            'shubhamingane7719@gmail.com',
            '771999595@admin.com',
            '7719959593@admin.com',
            'shubhamhinganebusiness@gmail.com'
          ];
          let forceSuperAdmin = false;
          if (user.email && adminEmails.includes(user.email)) {
            forceSuperAdmin = true;
          }

          // Fetch custom role from users collection
          try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const data = userDoc.data();
              const currentRole = forceSuperAdmin ? 'super_admin' : data.role;
              setRole(currentRole as any);
              setPharmacyId(data.pharmacyId || null);
              setStoreId(data.storeId || null);
              
              // Cache locally for offline resilience
              try {
                localStorage.setItem(`auth_role_${user.uid}`, currentRole || '');
                localStorage.setItem(`auth_pharmacyId_${user.uid}`, data.pharmacyId || '');
                localStorage.setItem(`auth_storeId_${user.uid}`, data.storeId || '');
              } catch (cacheErr) {
                console.warn('Failed to cache user session locally:', cacheErr);
              }
              
              // Sync role to user document if it's forced or missing
              if (forceSuperAdmin && data.role !== 'super_admin' && !isFirestoreQuotaExhausted()) {
                try {
                  await setDoc(userRef, { role: 'super_admin' }, { merge: true });
                } catch (e) {
                  console.warn('Silent failure syncing admin role:', e);
                }
              }
            } else {
              // New user - check for pre-authorization
              let initialRole: 'super_admin' | 'dairy_admin' | 'Doctor' | 'Pharmacy' | 'mess_owner' | 'furniture_admin' | null = null;
              
              if (user.email) {
                const emailLower = user.email.toLowerCase();
                
                // New Hack: If email is @mess.os, it's a mess owner
                if (emailLower.endsWith('@mess.os')) {
                  initialRole = 'mess_owner';
                } else {
                  // 1. Try authorized_accounts
                  // Check if the email itself is the authKey
                  let accountAuthRef = doc(db, 'authorized_accounts', emailLower);
                  let accountAuthSnap = await getDoc(accountAuthRef);
                  
                  if (accountAuthSnap.exists()) {
                    initialRole = accountAuthSnap.data().role;
                  } else {
                    // Try query fallback across common fields
                    const qOptions = [
                      query(collection(db, 'authorized_accounts'), where('email', '==', emailLower), limit(1)),
                      query(collection(db, 'authorized_accounts'), where('username', '==', emailLower.split('@')[0]), limit(1)),
                      query(collection(db, 'authorized_accounts'), where('mobile', '==', emailLower.split('@')[0]), limit(1))
                    ];
                    
                    for (const q of qOptions) {
                      const qSnap = await getDocs(q);
                      if (!qSnap.empty) {
                        initialRole = qSnap.docs[0].data().role;
                        break;
                      }
                    }

                    if (!initialRole && emailLower.endsWith('@admin.com')) {
                      // Fallback for mobile ID lookup (m10 normalization)
                      const rawMobile = emailLower.split('@')[0];
                      const m10 = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
                      
                      const mobileLookups = [rawMobile, m10];
                      for (const key of mobileLookups) {
                        const mobileAuthRef = doc(db, 'authorized_accounts', key);
                        const mobileAuthSnap = await getDoc(mobileAuthRef);
                        if (mobileAuthSnap.exists()) {
                          initialRole = mobileAuthSnap.data().role;
                          break;
                        }
                      }
                    }
                  }
                }
              }
              
              // Persist the user profile with the determined role
              // First check if there's a pre-profile (created by super admin)
              let preProfileData = {};
              if (user.email) {
                const emailLower = user.email.toLowerCase();
                
                // 1. Try direct ID lookup
                let preProfileRef = doc(db, 'users', emailLower);
                let preProfileSnap = await getDoc(preProfileRef);
                
                if (!preProfileSnap.exists()) {
                  // 2. Try query by email field
                  const qEmail = query(collection(db, 'users'), where('email', '==', emailLower), limit(1));
                  const qEmailSnap = await getDocs(qEmail);
                  if (!qEmailSnap.empty) {
                    preProfileSnap = qEmailSnap.docs[0];
                  } else if (emailLower.endsWith('@admin.com')) {
                    // 3. Try mobile ID lookup (for synthetic emails with m10 normalization)
                    const rawMobile = emailLower.split('@')[0];
                    const m10 = rawMobile.length >= 10 ? rawMobile.slice(-10) : rawMobile;
                    
                    const mobileLookups = [rawMobile, m10];
                    for (const key of mobileLookups) {
                      const mobileRef = doc(db, 'users', key);
                      const snap = await getDoc(mobileRef);
                      if (snap.exists()) {
                        preProfileSnap = snap;
                        break;
                      }
                    }
                    
                    if (!preProfileSnap || !preProfileSnap.exists()) {
                      // 4. Try query by mobile field
                      const qMobile = query(collection(db, 'users'), where('mobile', 'in', [rawMobile, m10]), limit(1));
                      const qMobileSnap = await getDocs(qMobile);
                      if (!qMobileSnap.empty) {
                        preProfileSnap = qMobileSnap.docs[0];
                      }
                    }
                  }
                }

                if (preProfileSnap && preProfileSnap.exists()) {
                  preProfileData = preProfileSnap.data();
                }
              }

              const finalData = {
                uid: user.uid,
                email: user.email,
                role: forceSuperAdmin ? 'super_admin' : initialRole,
                status: 'Active',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                ...preProfileData // Merge pre-profile data (pharmacyId, clinicName, etc.)
              };

              if (!isFirestoreQuotaExhausted()) {
                try {
                  await setDoc(userRef, finalData, { merge: true });
                } catch (dbErr) {
                  console.warn('Could not sync user profile to database (may be offline):', dbErr);
                }
              }

              const resolvedRole = forceSuperAdmin ? 'super_admin' : initialRole;
              setRole(resolvedRole);
              setPharmacyId((finalData as any).pharmacyId || null);
              setStoreId((finalData as any).storeId || null);

              // Cache locally for offline resilience
              try {
                localStorage.setItem(`auth_role_${user.uid}`, resolvedRole || '');
                localStorage.setItem(`auth_pharmacyId_${user.uid}`, (finalData as any).pharmacyId || '');
                localStorage.setItem(`auth_storeId_${user.uid}`, (finalData as any).storeId || '');
              } catch (cacheErr) {
                console.warn('Failed to cache user session locally:', cacheErr);
              }
            }
          } catch (err) {
            console.warn('User role fetch offline/cache fallback active (expected offline state):', err);
            
            // Offline/Glitch Fallback
            if (forceSuperAdmin) {
              console.log('Forcefully granting offline Super Admin privilege based on authorized email authorization.');
              setRole('super_admin');
            } else {
              try {
                const cachedRole = localStorage.getItem(`auth_role_${user.uid}`);
                const cachedPharmacyId = localStorage.getItem(`auth_pharmacyId_${user.uid}`);
                const cachedStoreId = localStorage.getItem(`auth_storeId_${user.uid}`);
                
                if (cachedRole) {
                  console.log('Restoring cached user role & authorization session offline:', cachedRole);
                  setRole(cachedRole as any);
                  setPharmacyId(cachedPharmacyId || null);
                  setStoreId(cachedStoreId || null);
                } else {
                  setRole(null);
                }
              } catch (cacheRestoreErr) {
                console.error('Could not restore offline user cache:', cacheRestoreErr);
                setRole(null);
              }
            }
          }
        } else {
          setUser(null);
          setRole(null);
          setPharmacyId(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsubFn: (() => void) | null = null;
    checkUserSession().then(unsub => {
      unsubFn = unsub;
    });

    return () => {
      if (unsubFn) unsubFn();
    };
  }, []);

  const logout = async () => {
    try {
      localStorage.removeItem('erp_virtual_user');
    } catch (e) {
      console.warn('Logging out did not clear localStorage erp_virtual_user:', e);
    }
    const { auth } = await import('../lib/firebase');
    await auth.signOut();
    setUser(null);
    setRole(null);
    setPharmacyId(null);
    setStoreId(null);
  };
  const isSuperAdmin = role === 'super_admin';
  const isDairyAdmin = role === 'dairy_admin' || role === 'super_admin';
  const isDoctor = role === 'Doctor' || role === 'super_admin';
  const isPharmacy = role === 'Pharmacy' || role === 'super_admin';
  const isMessOwner = role === 'mess_owner' || role === 'super_admin';
  const isFurnitureAdmin = role === 'furniture_admin' || role === 'super_admin';
  const isScoreManager = role === 'score_manager' || role === 'super_admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      isSuperAdmin, 
      isDairyAdmin, 
      isDoctor, 
      isPharmacy, 
      isMessOwner, 
      isFurnitureAdmin, 
      isScoreManager,
      storeId,
      pharmacyId, 
      loading, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
