import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Milk, 
  LogIn, 
  Loader2, 
  AlertCircle, 
  Mail, 
  ShieldCheck, 
  ChevronRight,
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export const DairyLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'manual' | 'google'>('manual');
  
  // Manual Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isDairyAdmin } = useAuth();

  const from = (location.state as any)?.from?.pathname || "/live/dairy-management";
  const isEmail = identifier.includes('@');

  // If already logged in and is dairy admin, redirect
  React.useEffect(() => {
    if (user && isDairyAdmin) {
      navigate(from, { replace: true });
    }
  }, [user, isDairyAdmin, navigate, from]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Safeguard: Sign out completely before making any Firestore pre-auth/shadow auth lookups or auth requests
    // to prevent any invalid, expired, or stale token stored in the SDK from throwing client-side auth/invalid-credential errors.
    try {
      await auth.signOut();
    } catch (signOutErr) {
      console.warn('Signout failed during login initialization (non-blocking):', signOutErr);
    }
    
    const cleanId = identifier.trim().toLowerCase();
    
    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }
    
    try {
      // 1. Verify credentials against our authorized records
      const authRef = doc(db, 'authorized_accounts', cleanId);
      const authSnap = await getDoc(authRef);
      
      if (!authSnap.exists()) {
        throw new Error(`The specific ${isEmail ? 'email' : 'mobile number'} is not authorized for a Paid License.`);
      }
      
      const authData = authSnap.data();
      if (authData.password !== password) {
        throw new Error('Invalid password provided.');
      }
      
      // 2. Map to a Firebase Auth account
      // For mobile numbers, we use a virtual email. For real emails, we use the email directly.
      const targetEmail = isEmail ? cleanId : `${cleanId}@dairy-user.com`;
      
      try {
        await signInWithEmailAndPassword(auth, targetEmail, password);
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            // Auto-create the Firebase Auth account since it's pre-authorized in Firestore
            await (async () => {
              try {
                return await createUserWithEmailAndPassword(auth, targetEmail, password);
              } catch (e: any) {
                if (e.code === 'auth/weak-password') {
                  throw new Error('Password must be at least 6 characters long (Firebase requirement).');
                }
                throw e;
              }
            })();
            
            await setDoc(doc(db, 'users', auth.currentUser?.uid || ''), {
              email: targetEmail,
              [isEmail ? 'email' : 'mobile']: cleanId,
              role: 'dairy_admin',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            }, { merge: true });
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              // User exists in Auth but password doesn't match the one in Firestore
              throw new Error('Credential mismatch discovered. Please contact support to synchronize your credentials.');
            }
            throw createErr;
          }
        } else {
          throw authErr;
        }
      }
    } catch (err: any) {
      console.error('Manual Login Error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed the popup, don't show an error
        return;
      }
      console.error('Google Auth Error:', err);
      setError('Login failed. Please ensure your account is authorized.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-main-bg flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 relative overflow-hidden transition-colors duration-300"
      >
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 text-gray-400 hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-primary">
            <Milk size={32} />
          </div>
          <h1 className="text-2xl font-black text-main-text tracking-tight mb-1 transition-colors">Dairy Management</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Premium Enterprise Portal</p>
        </div>

        <div className="space-y-6">
          {user && !isDairyAdmin ? (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle size={20} />
                <span className="font-bold text-sm uppercase tracking-tight">Access Restricted</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                Your account <span className="font-bold text-main-text">{user.email || user.uid}</span> is not licensed for this software.
              </p>
              <button
                onClick={() => auth.signOut()}
                className="w-full py-3 bg-surface border border-amber-200 dark:border-amber-900 text-amber-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
              >
                Use Different Account
              </button>
            </div>
          ) : (
            <>
              {loginMethod === 'manual' ? (
                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email or Mobile Number</label>
                    <div className="relative group">
                      <input
                        type="text"
                        required
                        placeholder="Enter your username or email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-main-bg border-2 border-transparent rounded-2xl focus:border-primary/20 transition-all font-bold text-main-text"
                      />
                      {isEmail ? (
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      ) : (
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-main-bg border-2 border-transparent rounded-2xl focus:border-primary/20 transition-all font-bold text-main-text"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary" size={20} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : 'Authorize & Login'}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setLoginMethod('google')}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Authenticate with Google instead
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-5 bg-surface border-2 border-gray-100 dark:border-gray-800 text-main-text rounded-2xl font-black shadow-sm transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        <Mail size={24} className="text-primary" />
                        <span className="uppercase tracking-widest text-xs">Login with Google</span>
                      </>
                    )}
                  </button>
                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setLoginMethod('manual')}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Use Email/Mobile & Password
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-tight">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.3em]">
              Professional Enterprise Edition <span className="text-primary">v3.2</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
