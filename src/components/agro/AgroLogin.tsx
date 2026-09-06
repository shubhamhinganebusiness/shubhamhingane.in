import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wheat, Phone, Lock, ArrowRight, ShieldCheck, Sprout, Home, Eye, EyeOff } from 'lucide-react';
import { auth, onAuthStateChanged } from '../../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const AgroLogin: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if already logged in as admin
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const adminEmails = ['jamkhednewsnetwork@gmail.com', 'shubhamhingane7719@gmail.com', 'shubhamingane7719@gmail.com', 'shubhamhingane@gmail.com', 'admin@agroshop.com', '7719959593@admin.com'];
        const email = user.email?.toLowerCase();
        if (email && adminEmails.includes(email)) {
          navigate('/portfolio-admin');
        } else if (email && email.includes('@agroshop.com')) {
          navigate('/agro-dashboard');
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.trim().length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // Safeguard: Sign out completely before making any Firestore pre-auth/shadow auth lookups or auth requests
    // to prevent any invalid, expired, or stale token stored in the SDK from throwing client-side auth/invalid-credential errors.
    try {
      await auth.signOut();
    } catch (signOutErr) {
      console.warn('Signout failed during login initialization (non-blocking):', signOutErr);
    }

    const adminEmails = ['jamkhednewsnetwork@gmail.com', 'shubhamhingane7719@gmail.com', 'shubhamingane7719@gmail.com', 'shubhamhingane@gmail.com', 'admin@agroshop.com', '7719959593@admin.com'];
    const lowerMobile = mobile.toLowerCase();

    // Admin login block
    const isAdminLogin = adminEmails.some(email => lowerMobile === email.toLowerCase()) || 
                        lowerMobile === 'admin' || 
                        lowerMobile === '7719959593' || 
                        lowerMobile === '771999595';
    
    if (isAdminLogin) {
      try {
        const loginEmail = lowerMobile.includes('@') ? lowerMobile : 'jamkhednewsnetwork@gmail.com';
        await signInWithEmailAndPassword(auth, loginEmail, password);
        navigate('/super-admin');
        return;
      } catch (err: any) {
        // Master Admin Bootstrap Fallback
        if ((lowerMobile === '7719959593' || lowerMobile === '771999595' || lowerMobile === 'admin') && 
            password === 'Shubham@7719' && 
            (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password')) {
           try {
             const { createUserWithEmailAndPassword } = await import('firebase/auth');
             const adminEmail = 'jamkhednewsnetwork@gmail.com';
             await createUserWithEmailAndPassword(auth, adminEmail, password);
             navigate('/super-admin');
             return;
           } catch (createErr: any) {
             if (createErr.code === 'auth/email-already-in-use') {
               setError('Admin login failed: Incorrect password.');
             } else {
               setError(`Shadow Auth Failed: ${createErr.message}`);
             }
           }
        } else {
          setError(`Admin Access Denied: ${err.message}`);
        }
        setLoading(false);
        return;
      }
    }

    // Virtual email for Firebase Auth
    const virtualEmail = `${mobile}@agroshop.com`;
    
    try {
      try {
        await signInWithEmailAndPassword(auth, virtualEmail, password);
      } catch (authErr: any) {
        // Simulated Provisioning: If Auth user not found but Firestore record exists
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/invalid-email') {
          try {
            // Check if user exists in Firestore
            const ownerDoc = await getDoc(doc(db, 'shop_owners', mobile));
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data();
              if (ownerData.password === password) {
                if (ownerData.isBlocked) {
                  setError('Your account has been blocked by the administrator.');
                  setLoading(false);
                  return;
                }
                // Try creating the user (Self-provisioning)
                const { createUserWithEmailAndPassword } = await import('firebase/auth');
                try {
                  await (async () => {
                    try {
                      return await createUserWithEmailAndPassword(auth, virtualEmail, password);
                    } catch (e: any) {
                      if (e.code === 'auth/weak-password') {
                        throw new Error('Password must be at least 6 characters long (Firebase requirement).');
                      }
                      throw e;
                    }
                  })();
                } catch (createErr: any) {
                  if (createErr.code === 'auth/email-already-in-use') {
                    // Desync case: exists in auth but first sign-in failed (likely password changed in Firestore but not in Auth)
                    // We can't easily sync without re-authing, so tell the user.
                    setError('Account synchronization issue. Please contact administrator to reset your password.');
                    setLoading(false);
                    return;
                  }
                  throw createErr;
                }
                navigate('/agro-dashboard');
                return;
              } else {
                setError('Invalid password. Please verify and try again.');
                setLoading(false);
                return;
              }
            } else {
              setError('Mobile number not registered. Please contact administrator.');
              setLoading(false);
              return;
            }
          } catch (provisionErr) {
             console.error('Provisioning Error:', provisionErr);
          }
          
          setError('Authentication failed. Please verify credentials.');
          setLoading(false);
          return;
        } else {
          throw authErr;
        }
      }

      // Verify block status
      const ownerDoc = await getDoc(doc(db, 'shop_owners', mobile));
      if (ownerDoc.exists()) {
        const ownerData = ownerDoc.data();
        if (ownerData.isBlocked) {
          await auth.signOut();
          setError('Your account has been blocked by the administrator.');
          setLoading(false);
          return;
        }
        
        if (ownerData.password !== password) {
          await auth.signOut();
          setError('Invalid password. Please try again.');
          setLoading(false);
          return;
        }
      }
      
      navigate('/agro-dashboard');
    } catch (err: any) {
      setError('Invalid credentials. Please verify your mobile number and password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl h-auto md:min-h-[650px] grid md:grid-cols-2 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-between p-10 bg-primary relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 text-white mb-12 group">
              <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                <Wheat size={24} />
              </div>
              <span className="font-black text-2xl tracking-tight">AGRO<span className="italic opacity-70">SHOP</span></span>
            </Link>
            
            <h1 className="text-4xl font-black text-white mb-6 leading-tight">
              Smart Management for <span className="text-white/70 italic text-3xl block">Smart Agriculture.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-xs mb-10">
              Complete billing, inventory, and customer management system for agro entrepreneurs.
            </p>

            <div className="space-y-4">
              {[
                { icon: Sprout, text: 'Seed & Fertilizer stock' },
                { icon: ShieldCheck, text: 'GST Invoice generation' },
                { icon: ArrowRight, text: 'Customer credit tracking' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white/90 font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <item.icon size={12} />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/20 text-white/60 text-[10px] font-black uppercase tracking-widest flex flex-col gap-2">
            <div>shubhamhingane.in</div>
            <div>+91-7719959593</div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div className="text-left">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Welcome Back</h2>
              <p className="text-gray-500 font-medium text-sm">Access your shop management portal.</p>
            </div>
            <Link to="/" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500 hover:text-primary transition-all group" title="Back to Homepage">
              <Home size={18} className="group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-3"
            >
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0">!</div>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number / Username</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl px-14 py-5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none transition-all dark:text-white"
                  placeholder="e.g. 9876543210"
                  required
                />
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                <div 
                   onClick={() => {
                     setMobile('admin');
                     setPassword('');
                   }}
                   className="text-[9px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline flex items-center gap-1"
                >
                  <ShieldCheck size={10} />
                  Enterprise Portal Access
                </div>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-2xl px-14 py-5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
              disabled={loading}
              className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Sign In to Shop'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500 font-medium">
            Agro Enterprise Smart Management Solution
          </p>
          <div className="mt-4 text-center">
            <Link to="/" className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline flex items-center justify-center gap-2">
              <Home size={10} />
              Back to Portfolio Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
