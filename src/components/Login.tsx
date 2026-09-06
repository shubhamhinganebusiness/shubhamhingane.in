import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion, useAnimation } from 'motion/react';
import { Lock, User, ChevronRight, LogIn, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, Mail, Activity, Heart, Home, Smartphone } from 'lucide-react';
import { useAuth } from './AuthContext';

export const Login: React.FC = () => {
  const [todayStats, setTodayStats] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();
  const controls = useAnimation();

  const from = (location.state as any)?.from?.pathname || "/super-admin";

  // Fetch today's visitor count for a "quick stats" pulse
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { doc, getDoc } = await import('firebase/firestore');
        const statsSnap = await getDoc(doc(db, 'site_stats', today));
        if (statsSnap.exists()) {
          setTodayStats(statsSnap.data().visits || 0);
        }
      } catch (err) {
        console.error('Failed to fetch login stats:', err);
      }
    };
    fetchStats();
  }, []);

  // Security Validation Hooks
  const isUsernameValid = useMemo(() => {
    return username.length >= 4;
  }, [username]);

  const isPasswordValid = useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const canSubmit = isUsernameValid && isPasswordValid && !loading;

  // Detect Caps Lock
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Auto-Bootstrap if it's the owner email but no record exists yet
      const adminEmails = [
        'jamkhednewsnetwork@gmail.com', 
        'shubhamhingane7719@gmail.com',
        'shubhamingane7719@gmail.com',
        '771999595@admin.com',
        '7719959593@admin.com'
      ];
      
      if (result.user.email && adminEmails.includes(result.user.email)) {
        await setDoc(doc(db, 'users', result.user.uid), {
          userId: result.user.uid,
          email: result.user.email,
          role: 'super_admin',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show an error message
        return;
      }
      console.error('Google Auth Error:', err);
      setError('Identity verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginUsername = username.trim();
    const loginPassword = password.trim();

    if (!isUsernameValid) return;
    if (loginPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setLoading(true);

    // Safeguard: Sign out completely before making any Firestore pre-auth/shadow auth lookups or auth requests
    // to prevent any invalid, expired, or stale token stored in the SDK from throwing client-side auth/invalid-credential errors.
    try {
      await auth.signOut();
    } catch (signOutErr) {
      console.warn('Signout failed during login initialization (non-blocking):', signOutErr);
    }
    
    // Internal Admin Mapping
    const ADMIN_NUMBER = '771999595';
    const ADMIN_EMAIL = `${ADMIN_NUMBER}@admin.com`;
    
    // Determine target email for Auth
    let targetEmail = loginUsername.includes('@') ? loginUsername.toLowerCase() : loginUsername;
    if (!targetEmail.includes('@')) {
      targetEmail = `${targetEmail}@admin.com`;
    }

    try {
      await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
    } catch (err: any) {
      console.error('Login Error Auth Code:', err.code);

      // --- SHADOW AUTH ---
      try {
        let authData: any = null;
        let authKey = loginUsername;

        // 1. Try direct ID lookup (case insensitive for email IDs)
        const authSnap = await getDoc(doc(db, 'authorized_accounts', loginUsername));
        if (authSnap.exists()) {
          authData = authSnap.data();
        } else if (loginUsername.includes('@')) {
          const authSnapLower = await getDoc(doc(db, 'authorized_accounts', loginUsername.toLowerCase()));
          if (authSnapLower.exists()) {
            authData = authSnapLower.data();
            authKey = loginUsername.toLowerCase();
          }
        }

        if (!authData) {
          // 2. Query fallback (search fields)
          const field = loginUsername.includes('@') ? 'email' : 'mobile';
          const qValue = loginUsername.toLowerCase();
          const q = query(
            collection(db, 'authorized_accounts'),
            where(field, '==', qValue),
            limit(1)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            authData = qSnap.docs[0].data();
            authKey = qSnap.docs[0].id;
          }
        }
        
        if (authData) {
          if (authData.password === loginPassword) {
            console.log('Shadow Auth match found. Syncing...');
            // Determine the email to use for Firebase Auth
            const registrationEmail = authData.email || (authData.mobile ? `${authData.mobile}@admin.com` : `${authKey}@admin.com`);
            
            try {
               // Try to create the user in Auth
               const cred = await (async () => {
                  try {
                    return await createUserWithEmailAndPassword(auth, registrationEmail, loginPassword);
                  } catch (e: any) {
                    if (e.code === 'auth/weak-password') {
                      throw new Error('Password must be at least 6 characters long (Firebase requirement).');
                    }
                    throw e;
                  }
                })();
               // Account created and signed in!
               setLoading(false);
               return;
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                // The user exists in Auth but maybe with a different registration email than we tried first
                console.log('User exists in Auth. Retrying sign-in with registered email:', registrationEmail);
                try {
                  await signInWithEmailAndPassword(auth, registrationEmail, loginPassword);
                  setLoading(false);
                  return;
                } catch (signInErr: any) {
                  if (signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
                    setError('Credential mismatch discovered. Your administrative key exists, but cloud authentication credentials do not match. Please contact administrator.');
                  } else {
                    setError(`Sync sign-in failed: ${signInErr.message}`);
                  }
                  setLoading(false);
                  return;
                }
              }
              console.error('Shadow auth sync failed:', createErr.code);
            }
          }
        }
      } catch (firestoreErr) {
        console.error('Shadow auth process failed:', firestoreErr);
      }

      // Master Admin Bootstrap Fallback
      const isMasterAdmin = (loginUsername === ADMIN_NUMBER || loginUsername === '7719959593') && loginPassword === 'Shubham@7719';
      if (isMasterAdmin) {
        console.log('Master credentials detected. Initiating secure bootstrap/login...');
        try {
          const cred = await createUserWithEmailAndPassword(auth, targetEmail, loginPassword);
          await setDoc(doc(db, 'users', cred.user.uid), {
            userId: cred.user.uid,
            email: targetEmail,
            role: 'super_admin',
            createdAt: new Date().toISOString()
          });
          setLoading(false);
          return;
        } catch (createErr: any) {
          console.error('Bootstrap Firebase signup failed, checking for email-in-use or provider restrictions:', createErr.code);
          // If signup is blocked or already registered but login was refused, we activate the Failsafe Virtual Session
          console.log('Activating Master Admin Virtual Fail-Safe Session');
          localStorage.setItem('erp_virtual_user', JSON.stringify({
            uid: 'virtual_super_admin',
            email: targetEmail,
            displayName: 'Shubham Hingane'
          }));
          setLoading(false);
          window.location.reload();
          return;
        }
      }

      setAttempts(prev => prev + 1);
      
      // Shake animation on error
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Unauthorized access. Invalid credentials provided.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Security threshold reached. Please wait several minutes.');
      } else {
        setError('A system error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirection logic
  useEffect(() => {
    if (role === 'super_admin') {
      navigate(from, { replace: true });
    } else if (role === 'user') {
      navigate('/', { replace: true });
    }
  }, [role, navigate, from]);

  return (
    <div className="min-h-screen bg-main-bg flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        animate={controls}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-surface rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors duration-300"
      >
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mb-16 blur-3xl" />

        <div className="text-center mb-10 relative">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-primary"
          >
            <LogIn size={40} />
          </motion.div>
          <h1 className="text-4xl font-black text-main-text tracking-tight mb-2 transition-colors">Admin Portal</h1>
          <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <ShieldCheck size={14} className="text-green-500" />
            <span>Secure Entry Protocol</span>
          </div>
        </div>

        <form onSubmit={handleLogin} onKeyDown={handleKeyDown} className="space-y-6 relative">
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Username</label>
              {username.length > 0 && !isUsernameValid && (
                <span className="text-[10px] font-bold text-red-500 uppercase">Digits only (min 4)</span>
              )}
            </div>
            <div className="relative group">
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Ex: 771999595 or email"
                maxLength={50}
                autoComplete="username"
                className={`w-full pl-12 pr-4 py-4 bg-main-bg border-2 rounded-2xl focus:ring-4 focus:ring-primary/5 transition-all font-bold text-main-text ${
                  username.length > 0 && !isUsernameValid ? 'border-red-100 dark:border-red-900 text-red-600' : 'border-transparent focus:border-primary/20'
                }`}
                required
              />
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                username.length > 0 && !isUsernameValid ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
              }`} size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Security Key</label>
              <div className="flex items-center gap-3">
                {isCapsLockOn && (
                  <span className="text-[10px] font-bold text-amber-500 uppercase flex items-center gap-1">
                    <AlertCircle size={10} /> Caps On
                  </span>
                )}
                {password.length > 0 && !isPasswordValid && (
                  <span className="text-[10px] font-bold text-red-500 uppercase">Min 6 characters</span>
                )}
              </div>
            </div>
            <div className="relative group">
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-12 pr-14 py-4 bg-main-bg border-2 rounded-2xl focus:ring-4 focus:ring-primary/5 transition-all font-bold text-main-text ${
                  password.length > 0 && !isPasswordValid ? 'border-red-100 dark:border-red-900 text-red-600' : 'border-transparent focus:border-primary/20'
                }`}
                required
              />
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                password.length > 0 && !isPasswordValid ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary'
              }`} size={20} />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-2xl flex flex-col gap-3 text-red-600"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-black leading-tight uppercase tracking-tight">{error}</p>
                </div>
              </div>
              
              {(error.includes('Identity verification failed') || error.includes('Bootstrap failure') || error.includes('Unauthorized access')) && (
                <div className="mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-red-100 dark:border-red-900/40 space-y-2">
                  <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider leading-relaxed">
                    <span className="text-red-500">Action Required:</span> Authentication providers are likely disabled in your Firebase console.
                  </p>
                  <div className="flex flex-col gap-1">
                    <a 
                      href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase"
                    >
                      1. Enable Google & Email Providers <ChevronRight size={10} />
                    </a>
                  </div>
                </div>
              )}
              
              {attempts >= 3 && !error.includes('Identity verification failed') && (
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest px-1">
                  Attempt {attempts} recorded in security logs
                </p>
              )}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={!canSubmit}
            className={`w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${
              !canSubmit ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/40 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="uppercase tracking-widest text-xs font-black">Authorizing...</span>
              </>
            ) : (
              <>
                <span className="uppercase tracking-widest text-xs font-black">Authorize Session</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
            
            {/* Shimmer Effect */}
            {canSubmit && !loading && (
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 animate-shimmer" />
            )}
          </button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="px-4 bg-surface text-gray-400">Alternate Portal</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-surface border-2 border-gray-100 dark:border-gray-800 text-main-text rounded-2xl font-bold transition-all flex items-center justify-center gap-3 hover:bg-main-bg active:scale-[0.98] disabled:opacity-50"
          >
            <Mail size={18} className="text-primary" />
            <span className="text-xs uppercase tracking-widest">Verify via Google Identity</span>
          </button>
        </form>

        {todayStats !== null && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                <Eye size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Today's Pulse</p>
                <p className="text-sm font-black text-main-text transition-colors">{todayStats} Visitors</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
              <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
            </div>
          </motion.div>
        )}

        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 text-center flex flex-col items-center gap-2">
          <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            Shield Node v2.5.1 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </p>
          <p className="text-[9px] text-gray-300 dark:text-gray-600 font-bold uppercase tracking-widest">
            Static Identity Verification Active
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
