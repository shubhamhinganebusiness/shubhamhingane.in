import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion } from 'motion/react';
import { 
  Trophy, Lock, User, LogIn, Loader2, AlertCircle, 
  ShieldCheck, ShieldAlert, Sparkles, Navigation, ArrowLeft 
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export const GullyScoreLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { isScoreManager } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/live/cricket-scoreboard';

  // Redirection if already authorized
  useEffect(() => {
    if (isScoreManager) {
      navigate(from, { replace: true });
    }
  }, [isScoreManager, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const loginPassword = password.trim();

    if (!cleanUsername) {
      setError('Please enter your official scorekeeper username.');
      return;
    }
    if (loginPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const targetEmail = `${cleanUsername}@gullyscore.com`;

    try {
      // 1. Try direct Firebase Auth sign-in
      const userCred = await signInWithEmailAndPassword(auth, targetEmail, loginPassword);
      
      try {
        localStorage.setItem('erp_virtual_user', JSON.stringify({
          uid: userCred.user.uid,
          email: targetEmail,
          role: 'score_manager',
          displayName: cleanUsername.toUpperCase(),
          managerId: cleanUsername
        }));
      } catch (_) {}

      setLoading(false);
      window.location.reload();
      return;
    } catch (firebaseErr: any) {
      console.log('Direct Firebase Auth sign-in missed/failed, checking authorized credentials in database:', firebaseErr?.code);

      // 2. Fall back to checking provisioned credentials in Firestore
      try {
        let managerData: any = null;
        let isOfflineResult = false;

        try {
          // Check score_managers collection (provisioned by Super Admin)
          const managerDocRef = doc(db, 'score_managers', cleanUsername);
          const managerSnap = await getDoc(managerDocRef);
          if (managerSnap.exists()) {
            managerData = managerSnap.data();
          } else {
            // Also check authorized_accounts collection (provisioned by Super Admin)
            const authDocRef = doc(db, 'authorized_accounts', cleanUsername);
            const authSnap = await getDoc(authDocRef);
            if (authSnap.exists()) {
              const data = authSnap.data();
              if (data?.role === 'score_manager' || data?.role === 'super_admin') {
                managerData = data;
              }
            }
          }
        } catch (getDocErr: any) {
          console.warn('Network offline during manager lookup, checking local cache.', getDocErr);
          isOfflineResult = true;

          // Attempt fallback from local cached score managers
          const cachedSMsJSON = localStorage.getItem('cached_score_managers');
          if (cachedSMsJSON) {
            try {
              const cachedSMs = JSON.parse(cachedSMsJSON);
              const found = cachedSMs.find((s: any) => 
                s.id === cleanUsername || 
                (s.username && s.username.toLowerCase() === cleanUsername)
              );
              if (found) {
                managerData = found;
              }
            } catch (jsonErr) {
              console.error('Error parsing cached score managers:', jsonErr);
            }
          }
        }

        if (managerData) {
          if (managerData.password === loginPassword) {
            console.log('Authorized scorekeeper credentials matched! Establishing session.');

            // Attempt to synchronize into Firebase Auth if online
            if (!isOfflineResult) {
              try {
                const cred = await createUserWithEmailAndPassword(auth, targetEmail, loginPassword);
                
                await setDoc(doc(db, 'users', cred.user.uid), {
                  userId: cred.user.uid,
                  email: targetEmail,
                  role: 'score_manager',
                  name: managerData.name || cleanUsername.toUpperCase(),
                  createdAt: new Date().toISOString()
                }, { merge: true });

                try {
                  localStorage.setItem('erp_virtual_user', JSON.stringify({
                    uid: cred.user.uid,
                    email: targetEmail,
                    role: 'score_manager',
                    displayName: managerData.name || cleanUsername.toUpperCase(),
                    managerId: cleanUsername
                  }));
                } catch (_) {}

                setLoading(false);
                window.location.reload();
                return;
              } catch (createErr: any) {
                if (createErr.code === 'auth/email-already-in-use') {
                  console.log('Auth account exists. Proceeding with verified session.');
                }
              }
            }

            // Secure virtual session for scorekeeper
            localStorage.setItem('erp_virtual_user', JSON.stringify({
              uid: `virtual_${cleanUsername}`,
              email: targetEmail,
              role: 'score_manager',
              displayName: managerData.name || cleanUsername.toUpperCase(),
              managerId: cleanUsername
            }));

            setLoading(false);
            window.location.reload();
            return;
          } else {
            setError('Incorrect scorekeeper password. Please check your credentials or contact the Portfolio Super Admin.');
            setLoading(false);
            return;
          }
        }

        setError(`No scorekeeper account found for "@${cleanUsername}". New scorekeeper login credentials can only be created by the Portfolio Super Admin.`);
      } catch (err: any) {
        console.error('Scorekeeper authentication error:', err);
        setError('Authentication check failed. Please ensure you are connected to the network or contact the Super Admin.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isScoreManager) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6" id="gully-score-redirect-loader">
        <Loader2 size={36} className="text-emerald-400 animate-spin mb-4 animate-spin-slow" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Gully Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Decorative sports-style background grid lines */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative z-10 text-left pt-16 md:pt-20"
      >
        {/* Back Button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/live/cricket-scoreboard');
            }
          }}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Go Back"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3">
            <Trophy size={28} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            GullyScore <span className="text-emerald-400 font-heading italic">Scorer Suite</span>
          </h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Official Multi-Scorekeeper Portal
          </p>
          <div className="mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span>🔒 Isolated Dashboards (Private Scorer Spaces)</span>
          </div>
        </div>

        {/* Super Admin Provisioning Requirement Notice */}
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-start gap-2.5">
          <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-400" />
          <div className="leading-relaxed">
            <span className="font-bold text-amber-200 block mb-0.5">Super Admin Provisioned Access</span>
            <span className="text-amber-300/80 text-[11px]">
              New scorekeeper login credentials can only be created by the <strong>Portfolio Super Admin</strong>. Self-registration is restricted.
            </span>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-2.5 text-xs font-semibold"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Scorekeeper Username
            </label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Enter assigned scorekeeper username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                Security Passcode
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] font-bold text-emerald-400 hover:underline uppercase tracking-wider bg-transparent border-none cursor-pointer"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter scorekeeper passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50 text-slate-950 rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 border-none cursor-pointer mt-6"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating Scorekeeper...</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Open Scorer Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-slate-800/60 flex flex-col items-center gap-2.5 text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-500" /> Authorized Multi-Scorer Access
          </span>
          <button
            type="button"
            onClick={() => navigate('/live/cricket-scoreboard')}
            className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors"
          >
            <Navigation size={10} className="rotate-90" /> Return to Spectator View
          </button>
        </div>
      </motion.div>
    </div>
  );
};
