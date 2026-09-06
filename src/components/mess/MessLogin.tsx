import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'motion/react';
import { Lock, Phone, ArrowLeft, Loader2, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MessLogin: React.FC = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Safeguard: Sign out completely before making any Firestore pre-auth/shadow auth lookups or auth requests
    // to prevent any invalid, expired, or stale token stored in the SDK from throwing client-side auth/invalid-credential errors.
    try {
      await auth.signOut();
    } catch (signOutErr) {
      console.warn('Signout failed during login initialization (non-blocking):', signOutErr);
    }

    try {
      const lowerMobile = mobile.trim().replace(/\s+/g, '');
      
      if (!lowerMobile) {
        setError('Please enter a valid mobile number.');
        setLoading(false);
        return;
      }

      if (password.trim().length < 6) {
        setError('Password must be at least 6 characters long.');
        setLoading(false);
        return;
      }

      // Admin bypass or lookup
      const docSnap = await getDoc(doc(db, 'mess_owners', lowerMobile));
      
      if (docSnap.exists()) {
        const messData = docSnap.data();
        if (messData.status === 'Blocked') {
          setError('Your account is blocked. Please contact administrator.');
          setLoading(false);
          return;
        }

        // Try signing in
        const virtualEmail = `${lowerMobile}@mess.os`.toLowerCase();
        try {
          await signInWithEmailAndPassword(auth, virtualEmail, password);
          navigate('/mess-dashboard');
        } catch (authErr: any) {
           // We intentionally swallow the credential error to try provisioning
           
           if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
             // Try self-provisioning if it's the first login OR if the password matches our recorded one
             if (password === messData.password) {
                try {
                  const { createUserWithEmailAndPassword } = await import('firebase/auth');
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
                  navigate('/mess-dashboard');
                  return;
                } catch (createErr: any) {
                  if (createErr.code === 'auth/email-already-in-use') {
                    setError('Incorrect password for this mess account.');
                  } else if (createErr.code === 'auth/weak-password') {
                    setError('Password must be at least 6 characters long (Firebase requirement).');
                  } else {
                    setError(`Sync Failed: ${createErr.message}`);
                  }
                }
             } else {
               setError('Invalid credentials.');
             }
           } else {
             setError(`Login Error: ${authErr.message}`);
           }
        }
      } else {
        setError('Mess account not found. Please contact Shubham.');
      }
    } catch (err: any) {
      console.error('General Login Error:', err);
      setError(`Error: ${err.message || 'An unexpected error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="absolute top-8 left-8">
        <Link to="/mess" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-all">
          <ArrowLeft size={20} />
          Back to Portal
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-gray-200/50 border border-gray-100"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/5">
            <Utensils size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Mess Owner Login</h2>
          <p className="text-gray-400 font-medium text-sm mt-3">Access your mess OS and manage billing.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-black uppercase tracking-tight flex items-center gap-3">
             <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
             {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="tel" required
                placeholder="Ex: 771999595"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 font-bold transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="password" required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/10 font-bold transition-all text-sm"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/20 hover:bg-black transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Enter Dashboard'}
          </button>
        </form>

        <p className="mt-12 text-center text-gray-400 text-xs font-medium">
          New owner? Please contact Super Admin for credentials.
        </p>
      </motion.div>
    </div>
  );
};
