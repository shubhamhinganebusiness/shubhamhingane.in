import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Trophy, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Radio, 
  Sparkles, 
  LogIn,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export const GullyScoreLogin: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, isScoreManager } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/live/cricket-scoreboard';
  const isEmail = identifier.includes('@');

  // If already logged in as score manager, navigate to target scoreboard
  useEffect(() => {
    if (user && isScoreManager) {
      navigate(from, { replace: true });
    }
  }, [user, isScoreManager, navigate, from]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanId = identifier.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanId || !cleanPassword) {
      setError('Please enter your username and password.');
      setLoading(false);
      return;
    }

    if (cleanPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    // Safeguard: Sign out any stale token
    try {
      await auth.signOut();
    } catch (signOutErr) {
      console.warn('Signout failed during login initialization:', signOutErr);
    }

    try {
      // 1. Master administrator failsafe credentials
      const isMasterAdmin = (cleanId === 'admin' || cleanId === '7719959593') && cleanPassword === 'Shubham@7719';
      
      let authData: any = null;
      let isAuthorized = false;
      let displayName = cleanId;

      if (isMasterAdmin) {
        isAuthorized = true;
        displayName = 'Super Admin / Master Scorer';
      } else {
        // 2. Check authorized_accounts collection in Firestore
        try {
          const authRef = doc(db, 'authorized_accounts', cleanId);
          const authSnap = await getDoc(authRef);
          if (authSnap.exists()) {
            authData = authSnap.data();
            if (authData.password === cleanPassword && (authData.role === 'score_manager' || authData.role === 'super_admin')) {
              isAuthorized = true;
              displayName = authData.name || authData.username || cleanId;
            }
          }
        } catch (authDocErr) {
          console.warn('authorized_accounts lookup fallback:', authDocErr);
        }

        // 3. Check score_managers collection in Firestore
        if (!isAuthorized) {
          try {
            const smRef = doc(db, 'score_managers', cleanId);
            const smSnap = await getDoc(smRef);
            if (smSnap.exists()) {
              const smData = smSnap.data();
              if (smData.password === cleanPassword) {
                isAuthorized = true;
                displayName = smData.name || cleanId;
                authData = smData;
              }
            }
          } catch (smDocErr) {
            console.warn('score_managers lookup fallback:', smDocErr);
          }
        }
      }

      if (!isAuthorized) {
        throw new Error('Invalid username or password. Please verify your scorekeeper credentials.');
      }

      // 4. Set persistent virtual user for score manager session
      const targetEmail = isEmail ? cleanId : `${cleanId}@gullyscore.com`;
      const virtualUserSession = {
        uid: cleanId,
        email: targetEmail,
        displayName: displayName,
        role: 'score_manager',
        username: cleanId,
        storeId: 'gullyscore_cricket',
        loginTime: new Date().toISOString()
      };

      try {
        localStorage.setItem('erp_virtual_user', JSON.stringify(virtualUserSession));
      } catch (storageErr) {
        console.warn('Failed saving erp_virtual_user to localStorage:', storageErr);
      }

      // 5. Attempt Firebase Auth session
      try {
        await signInWithEmailAndPassword(auth, targetEmail, cleanPassword);
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            await createUserWithEmailAndPassword(auth, targetEmail, cleanPassword);
            await setDoc(doc(db, 'users', auth.currentUser?.uid || cleanId), {
              email: targetEmail,
              username: cleanId,
              role: 'score_manager',
              displayName: displayName,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            }, { merge: true });
          } catch (createErr) {
            console.warn('Auto Firebase auth account provisioning notice:', createErr);
          }
        }
      }

      // 6. Direct routing to match scoreboard
      navigate('/live/cricket-scoreboard', { replace: true });
    } catch (err: any) {
      console.error('Login failure:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setIdentifier('admin');
    setPassword('Shubham@7719');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none selection:bg-amber-400 selection:text-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-850 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Trophy size={20} className="text-amber-300" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider uppercase flex items-center gap-1.5 leading-none">
              <span>GULLY</span>
              <span className="text-amber-400 italic">SCORE</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
              Scorekeeper Access Portal
            </p>
          </div>
        </div>

        <Link
          to="/projects"
          className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 no-underline"
          title="Return to Projects Catalog"
        >
          <ArrowLeft size={14} />
          <span>Back to Projects</span>
        </Link>
      </header>

      {/* Main Login View Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Left Column: Feature Highlight */}
          <div className="lg:col-span-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 pb-8 lg:pb-0 lg:pr-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-[11px] font-black uppercase tracking-wider mb-5">
                <Radio size={12} className="animate-pulse text-emerald-400" />
                <span>Authorized Scorer Gateway</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Live Cricket Match <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
                  Control Desk
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
                Enter your credentials to access the real-time scoring engine, update live match deliveries, manage rosters, and broadcast commentary.
              </p>

              <div className="mt-8 space-y-3.5">
                {[
                  {
                    title: 'Real-time Ball-by-Ball Scoring',
                    desc: 'Record runs, extras, wickets, partnerships, and wagon wheel logs.'
                  },
                  {
                    title: 'AI Multi-Dialect Commentary',
                    desc: 'Automated delivery analysis, Hindi/English gully slang, and batsman entry announcements.'
                  },
                  {
                    title: 'OBS Broadcast Transparent Overlay',
                    desc: 'Broadcast-grade scoreboard graphics for live streaming setups.'
                  },
                  {
                    title: 'Digital Toss & Venue Scheduler',
                    desc: 'Instant toss simulations synced with live match parameters.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">{item.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Secure Isolated Session
              </span>
              <span className="font-mono text-[10px] text-slate-400">v3.5 Live Engine</span>
            </div>
          </div>

          {/* Right Column: Authentication Form */}
          <div className="lg:col-span-6 flex flex-col justify-center lg:pl-4">
            <div className="mb-6 text-left">
              <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <LogIn size={18} className="text-emerald-400" />
                Scorekeeper Sign In
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized username or mobile number and security key.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                  Username / Login ID / Mobile
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. admin or scorekeeper_name"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    Password / Access Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff size={12} /> Hide
                      </>
                    ) : (
                      <>
                        <Eye size={12} /> Show
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border-none flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Sign In to Match Scoreboard</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Assistant */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Test / Demo Account
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 cursor-pointer transition-all"
                >
                  Auto-Fill Demo
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
                User: <span className="text-amber-300 font-bold">admin</span> &bull; Pass: <span className="text-amber-300 font-bold">Shubham@7719</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-2">
                New scorekeepers can also be provisioned by the Super Admin in the Admin Console.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Footer - Strictly WITHOUT Return to Spectator View option */}
      <footer className="relative z-10 py-4 px-6 border-t border-slate-850 bg-slate-900/40 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>GullyScore Cricket Engine &copy; 2026 &bull; Real-Time Match Operations</span>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors no-underline">
            Home
          </Link>
          <Link to="/projects" className="text-slate-400 hover:text-white transition-colors no-underline">
            Projects
          </Link>
        </div>
      </footer>
    </div>
  );
};
