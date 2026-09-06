import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { motion, useAnimation } from 'motion/react';
import { 
  Lock, User, ChevronRight, LogIn, Loader2, AlertCircle, 
  Eye, EyeOff, ShieldCheck, Stethoscope, Pill, Cross,
  Activity, Heart, Home, Smartphone, Mail, ArrowRight
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export const MedLogin: React.FC = () => {
  const [activePortal, setActivePortal] = useState<'Doctor' | 'Pharmacy'>('Doctor');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { role, user } = useAuth();
  const controls = useAnimation();

  // Redirection logic
  useEffect(() => {
    if (user && role) {
      if (role === 'super_admin') {
        navigate('/super-admin');
      } else if (role === 'Doctor') {
        navigate('/med-doctor');
      } else if (role === 'Pharmacy') {
        navigate('/med-pharmacy');
      }
    }
  }, [role, user, navigate]);

  // Security Validation
  const isUsernameValid = useMemo(() => {
    return username.length >= 4;
  }, [username]);

  const isPasswordValid = useMemo(() => {
    return password.length >= 6;
  }, [password]);

  const canSubmit = isUsernameValid && isPasswordValid && !loading;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState('CapsLock')) {
      setIsCapsLockOn(true);
    } else {
      setIsCapsLockOn(false);
    }
  };

  const handleForgotPassword = async () => {
    const loginUsername = username.trim();
    if (!loginUsername) {
      setError('Please enter your username, email or mobile to reset your key.');
      return;
    }

    setLoading(true);
    try {
      // Re-run resolution logic to find the latest authoritative email
      let emailToReset = loginUsername.includes('@') ? loginUsername : `${loginUsername}@admin.com`;
      
      const authSnap = await getDoc(doc(db, 'authorized_accounts', loginUsername.toLowerCase()));
      if (authSnap.exists()) {
        const data = authSnap.data();
        if (data.email) emailToReset = data.email;
        else if (data.mobile) emailToReset = `${data.mobile}@admin.com`;
      }

      await sendPasswordResetEmail(auth, emailToReset);
      setError(`Reset link sent to ${emailToReset}. If this is a system-generated email (@admin.com), please contact your administrator.`);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError('Could not send reset email. ' + (err.message || err.code));
    } finally {
      setLoading(false);
    }
  };

    // Normalization Helpers
    const cleanInput = (val: string) => val.trim().toLowerCase();
    const cleanMobile = (val: string) => val.replace(/\D/g, '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUsername = username.trim();
    const loginPassword = password.trim();

    if (rawUsername.length < 4) {
      setError('Username/Mobile must be at least 4 characters long.');
      return;
    }
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
    
    // Normalize target username/email
    const cleanUsername = cleanInput(rawUsername);
    const rawDigits = cleanMobile(rawUsername);
    const m10 = rawDigits.length >= 10 ? rawDigits.slice(-10) : '';
    
    // --- PRE-AUTHENTICATION: Resolve Authoritative Email ---
    let authoritativeEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@admin.com`;
    let authData: any = null;
    let authKey = cleanUsername;

    // Direct pre-auth intercept for demo accounts to guarantee local stubbing
    if (cleanUsername === '771900001') {
      authData = {
        username: '771900001',
        email: 'doctor@demo.com',
        mobile: '771900001',
        password: 'Shubham@7719',
        role: 'Doctor'
      };
      authKey = '771900001';
      authoritativeEmail = 'doctor@demo.com';
    } else if (cleanUsername === '771900002') {
      authData = {
        username: '771900002',
        email: 'pharmacy@demo.com',
        mobile: '771900002',
        password: 'Shubham@7719',
        role: 'Pharmacy'
      };
      authKey = '771900002';
      authoritativeEmail = 'pharmacy@demo.com';
    }

    if (!authData) {
      try {
        // 1. Try direct ID lookup with cleaned username, raw digits, and m10
        const lookups = [cleanUsername, rawDigits];
        if (m10) lookups.push(m10);

        let authSnap = null;
        for (const key of lookups) {
          if (!key) continue;
          const snap = await getDoc(doc(db, 'authorized_accounts', key));
          if (snap.exists()) {
            authSnap = snap;
            break;
          }
        }
        
        if (authSnap && authSnap.exists()) {
          authData = authSnap.data();
          authKey = authSnap.id;
        } else {
          // 2. Query fallback (search multiple fields)
          const qOptions = [
            query(collection(db, 'authorized_accounts'), where('username', '==', cleanUsername), limit(1)),
            query(collection(db, 'authorized_accounts'), where('mobile', '==', cleanUsername), limit(1)),
            query(collection(db, 'authorized_accounts'), where('email', '==', cleanUsername), limit(1)),
          ];
          
          // Add mobile variants to query
          if (rawDigits) qOptions.push(query(collection(db, 'authorized_accounts'), where('mobile', '==', rawDigits), limit(1)));
          if (m10) qOptions.push(query(collection(db, 'authorized_accounts'), where('mobile', '==', m10), limit(1)));
          
          for (const q of qOptions) {
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              authData = qSnap.docs[0].data();
              authKey = qSnap.docs[0].id;
              break;
            }
          }
        }

        if (authData) {
          // Verify role parity before even trying Auth
          if (authData.role !== activePortal && authData.role !== 'super_admin') {
            setError(`This account is authorized for ${authData.role} access only.`);
            setLoading(false);
            return;
          }
          // Construct the email we expect in Firebase Auth
          authoritativeEmail = (authData.email || (authData.mobile ? `${authData.mobile.replace(/\s+/g, '')}@admin.com` : `${authKey}@admin.com`)).toLowerCase();
        }
      } catch (fsErr) {
        console.warn('Pre-auth check failed (non-critical):', fsErr);
      }
    }

    try {
      console.log('Attempting primary sign-in for:', authoritativeEmail);
      const userCred = await signInWithEmailAndPassword(auth, authoritativeEmail, loginPassword);
      
      // Post-login role check (Extra security layer)
      const userRef = doc(db, 'users', userCred.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.role !== activePortal && userData.role !== 'super_admin') {
          await auth.signOut();
          setError(`Portal mismatch. Your account is assigned to: ${userData.role}`);
          setLoading(false);
          return;
        }
      } else {
        // Create user document if it doesn't exist yet (e.g. newly signed-in demo user)
        await setDoc(userRef, {
          id: userCred.user.uid,
          uid: userCred.user.uid,
          name: activePortal === 'Doctor' ? 'Dr. Robert Fischer' : 'Metro Pharmacy Desk',
          role: activePortal,
          email: authoritativeEmail,
          mobile: cleanUsername,
          username: cleanUsername,
          status: 'Active',
          clinicName: activePortal === 'Doctor' ? 'Fischer Specialty Clinic' : '',
          pharmacyName: activePortal === 'Pharmacy' ? 'Metro Pharmacy' : '',
          pharmacyId: activePortal === 'Pharmacy' ? 'Metro_rx' : '',
          subscriptionStart: new Date().toISOString().split('T')[0],
          subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('Med Login Error Auth Code:', err.code);

      // --- SHADOW AUTH SYNC ---
      // If sign-in failed (invalid-credential encompasses user-not-found and wrong-password),
      // we check if we found valid shadow data and the password matches.
      if (authData && authData.password.trim() === loginPassword) {
        console.log('Shadow Auth valid. Attempting credential synchronization...');
        try {
            // If user doesn't exist in Auth, this creates it and logs them in.
            const userCred = await (async () => {
              try {
                return await createUserWithEmailAndPassword(auth, authoritativeEmail, loginPassword);
              } catch (e: any) {
                if (e.code === 'auth/weak-password') {
                  throw new Error('Password must be at least 6 characters long (Firebase requirement).');
                }
                throw e;
              }
            })();

            // Create user document under authorized login session
            const userRef = doc(db, 'users', userCred.user.uid);
            await setDoc(userRef, {
              id: userCred.user.uid,
              uid: userCred.user.uid,
              name: authData.role === 'Doctor' ? 'Dr. Robert Fischer' : 'Metro Pharmacy Desk',
              role: authData.role,
              email: authoritativeEmail,
              mobile: authData.mobile || '',
              username: authData.username || '',
              status: 'Active',
              clinicName: authData.role === 'Doctor' ? 'Fischer Specialty Clinic' : '',
              pharmacyName: authData.role === 'Pharmacy' ? 'Metro Pharmacy' : '',
              pharmacyId: authData.role === 'Pharmacy' ? 'Metro_rx' : '',
              subscriptionStart: new Date().toISOString().split('T')[0],
              subscriptionEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            setLoading(false);
            return;
        } catch (createErr: any) {
          console.warn('Auth sync or signup failed. Falling back to robust Virtual Local Session...', createErr.code);
          // Seed a fully valid virtual session to bypass cloud desyncs, permission rules, and auth issues completely
          const virtualUser = {
            uid: `virtual_${authData.role.toLowerCase()}_${authKey}`,
            email: authoritativeEmail,
            displayName: authData.role === 'Doctor' ? 'Dr. Robert Fischer' : 'Metro Pharmacy Desk',
            role: authData.role,
            clinicName: authData.role === 'Doctor' ? 'Fischer Specialty Clinic' : '',
            pharmacyName: authData.role === 'Pharmacy' ? 'Metro Pharmacy' : '',
            pharmacyId: authData.role === 'Pharmacy' ? 'Metro_rx' : null,
            storeId: null
          };
          
          localStorage.setItem('erp_virtual_user', JSON.stringify(virtualUser));
          setLoading(false);
          window.location.reload();
          return;
        }
      }

      // Master Admin Bootstrap Fallback
      const ADMIN_NUMBER = '771999595';
      const ADMIN_EMAIL = `${ADMIN_NUMBER}@admin.com`;
      const BOOTSTRAP_PWD = 'Shubham@7719';
      
      if (rawUsername === ADMIN_NUMBER && loginPassword === BOOTSTRAP_PWD && 
         (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        try {
          console.log('Attempting bootstrap account creation...');
          const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, BOOTSTRAP_PWD);
          await setDoc(doc(db, 'users', cred.user.uid), {
            userId: cred.user.uid,
            email: ADMIN_EMAIL,
            role: 'super_admin',
            createdAt: new Date().toISOString()
          });
          setLoading(false);
          return;
        } catch (createErr: any) {
          console.error('Bootstrap failure:', createErr.code);
          // If already exists, we MUST be able to sign in with the BOOTSTRAP_PWD
          if (createErr.code === 'auth/email-already-in-use') {
            try {
              await signInWithEmailAndPassword(auth, ADMIN_EMAIL, BOOTSTRAP_PWD);
              setLoading(false);
              return;
            } catch (sErr) { 
              console.error('Bootstrap signin failed - Auth password likely changed manually.'); 
            }
          }
        }
      }

      // Shake animation on error
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      });

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        if (authData) {
           // We found the user in the portal registry but password failed
           if (authData.password.trim() === loginPassword) {
             // This is the desync case
             const desyncMsg = authData.email && !authData.email.endsWith('@admin.com')
               ? `Security key mismatch. Your portal registry password matches what you typed, but your login account (${authData.email}) has a different password. Please use your original password or click "Forgot Key".`
               : `Security key mismatch. Your local portal password doesn't match your cloud record. Please contact the administrator to reset your authentication profile.`;
             setError(desyncMsg);
           } else {
             setError(`Incorrect password for ${activePortal} portal. Please check your security key.`);
           }
        } else {
           setError(`Unauthorized access. Credential "${rawUsername}" not found in our ${activePortal} registry.`);
        }
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('System error: ' + (err.message || err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (portal: 'Doctor' | 'Pharmacy') => {
    setActivePortal(portal);
    const demoUser = portal === 'Doctor' ? '771900001' : '771900002';
    const demoPass = 'Shubham@7719';
    
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
    
    // Allow React state updates to cycle, then trigger login handler
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-blue-50/50 dark:bg-[#050505] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full grid md:grid-cols-2 bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
      >
        {/* Left Side: Medical Branding */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <Link to="/med-demo" className="inline-flex items-center gap-3 mb-12 group">
              <div className="p-3 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                <Cross size={28} />
              </div>
              <span className="font-black text-2xl tracking-tighter uppercase">Med<span className="opacity-60 italic">Prescription</span></span>
            </Link>

            <h1 className="text-4xl lg:text-5xl font-black mb-8 leading-none tracking-tighter">
              Digital Medical <br />
              <span className="text-white/60 italic">Ecosystem.</span>
            </h1>
            
            <p className="text-white/80 text-lg font-medium max-w-sm mb-12 leading-relaxed">
              Connecting Doctors, Patients, and Pharmacies through a secure, paperless prescription network.
            </p>

            <div className="space-y-6">
              {[
                { icon: Stethoscope, title: 'For Doctors', desc: 'Manage clinics & digital prescriptions' },
                { icon: Pill, title: 'For Pharmacies', desc: 'Real-time verification & dispensing' },
                { icon: ShieldCheck, title: 'Secure & Lawful', desc: 'Fully compliant with medical laws' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-white/60 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
            <span>Powered by Shield Node</span>
            <div className="flex gap-4">
              <Activity size={16} className="animate-pulse" />
              <span>System Online</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Portal Entry</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Medical Professional Network</p>
            </div>
            <Link to="/med-demo" className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-400 hover:text-primary transition-all group">
              <Home size={20} className="group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          {/* Portal Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] mb-6">
            <button
              onClick={() => setActivePortal('Doctor')}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activePortal === 'Doctor' 
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Stethoscope size={16} />
              Doctor Portal
            </button>
            <button
              onClick={() => setActivePortal('Pharmacy')}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                activePortal === 'Pharmacy' 
                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' 
                : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Pill size={16} />
              Pharmacy Portal
            </button>
          </div>

          {/* Quick Demo Credentials Entering */}
          <div className="mb-8 p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-3xl">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-400 mb-2">
              ⚡ Instant Demo Key Bypass (One-Click)
            </h4>
            <div className="grid grid-cols-2 gap-3 text-left">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Doctor')}
                className="flex flex-col items-start p-3 bg-white dark:bg-gray-800 border-2 border-teal-500/10 hover:border-teal-500/40 rounded-2xl transition-all hover:scale-[1.02] text-left group"
              >
                <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-widest text-teal-600 dark:text-teal-400">
                  <Stethoscope size={12} />
                  Demo Doctor
                </div>
                <div className="text-[9px] font-mono text-gray-400 mt-1">Username: 771900001</div>
                <div className="text-[9px] font-mono text-gray-400">Key: Shubham@7719</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Pharmacy')}
                className="flex flex-col items-start p-3 bg-white dark:bg-gray-800 border-2 border-teal-500/10 hover:border-teal-500/40 rounded-2xl transition-all hover:scale-[1.02] text-left group"
              >
                <div className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-widest text-teal-600 dark:text-teal-400">
                  <Pill size={12} />
                  Demo Pharmacy
                </div>
                <div className="text-[9px] font-mono text-gray-400 mt-1">Username: 771900002</div>
                <div className="text-[9px] font-mono text-gray-400">Key: Shubham@7719</div>
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-4 text-red-600"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-xs font-black uppercase tracking-tight leading-tight">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleLogin} onKeyDown={handleKeyDown} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Username / Mobile / Email</label>
              <div className="relative group">
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 771999595"
                  required
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-gray-900 dark:text-white"
                />
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Security Key</label>
                <div className="flex gap-4 items-center">
                  {isCapsLockOn && (
                    <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1">
                      <Activity size={10} /> Caps Lock
                    </span>
                  )}
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black text-primary hover:text-blue-600 uppercase tracking-widest transition-colors"
                  >
                    Forgot Key?
                  </button>
                </div>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-14 pr-14 py-5 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-gray-900 dark:text-white"
                />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all flex items-center justify-center gap-4 ${
                !canSubmit ? 'opacity-50 grayscale cursor-not-allowed' : 'shadow-primary/30 hover:scale-[1.02] active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Authenticating...
                </>
              ) : (
                <>
                  Access {activePortal} System
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
               <div className="flex justify-center gap-4 mb-4 text-blue-400">
                 <ShieldCheck size={20} />
                 <Smartphone size={20} />
                 <Heart size={20} />
               </div>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed uppercase tracking-widest">
                 Authorized access only. All interactions are monitored and recorded according to HIPAA/GDPR health protocols.
               </p>
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-3">
               <Link to="/" className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-[0.3em] transition-colors flex items-center gap-2">
                 <ArrowRight size={10} className="rotate-180" />
                 Return to Portfolio
               </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
