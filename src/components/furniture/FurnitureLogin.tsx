import React, { useState } from 'react';
import { 
  ShoppingBag, Lock, Mail, ArrowRight, Sparkles, 
  ChevronRight, Building2, ShieldCheck, Github,
  UserCircle2, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

export const FurnitureLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user has a role, if not assign 'furniture_admin' for demo purposes
      // In a real app, this would be handled by an invitation system
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          role: 'furniture_admin',
          createdAt: new Date().toISOString(),
          displayName: result.user.displayName,
          storeId: 'demo-store-1'
        });
      }

      const from = (location.state as any)?.from?.pathname || '/furniture-dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const from = (location.state as any)?.from?.pathname || '/furniture-dashboard';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-gray-100">
        {/* Left Side - Info */}
        <div className="p-12 bg-gray-900 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
           
           <div className="relative z-10">
              <div className="flex items-center gap-3 mb-12">
                 <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <ShoppingBag size={24} className="text-white" />
                 </div>
                 <span className="text-xl font-black tracking-tighter uppercase">Elite Furnish</span>
              </div>

              <h2 className="text-4xl font-black mb-6 leading-tight">
                Enterprise <br />
                <span className="text-primary italic">Furniture & Electronics</span> <br />
                Management System
              </h2>
              <p className="text-gray-400 text-lg font-medium max-w-xs leading-relaxed mb-12">
                Scalable ERP solution for high-volume retail, warehouse control, and smart billing.
              </p>

              <div className="space-y-6">
                 {[
                   { icon: ShieldCheck, label: 'Secure Multi-Tenant Architecture' },
                   { icon: Sparkles, label: 'AI Powered Sales Predictive Analytics' },
                   { icon: Building2, label: 'Real-time Warehouse Synchronization' },
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary transition-colors">
                         <feat.icon size={20} className="text-primary" />
                      </div>
                      <span className="text-sm font-bold text-gray-300">{feat.label}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="relative z-10 pt-12 border-t border-white/10 flex items-center justify-between">
              <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                   <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="avatar" />
                   </div>
                 ))}
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trusted by 200+ Global Retailers</p>
           </div>
        </div>

        {/* Right Side - Form */}
        <div className="p-12 lg:p-20 bg-white flex flex-col justify-center">
           <div className="mb-10 text-center lg:text-left">
              <h1 className="text-3xl font-black text-gray-900 mb-3">Welcome Back</h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Enter your administrative credentials</p>
           </div>

           {error && (
             <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold">
                <ShieldCheck size={18} />
                {error}
             </div>
           )}

           <form onSubmit={handleEmailLogin} className="space-y-5">
              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Work Email</label>
                 <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@elitefurnish.in"
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900" 
                      required
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Access Token</label>
                 <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-medium text-gray-900" 
                      required
                    />
                 </div>
              </div>

              <div className="flex items-center justify-between py-2">
                 <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-5 h-5 rounded-md border-gray-200 text-primary focus:ring-primary/20" />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors">Remember Session</span>
                 </label>
                 <button type="button" className="text-xs font-black text-primary uppercase tracking-widest hover:underline px-1">Forgot Key?</button>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-gray-900/20 hover:shadow-gray-900/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    Initialize Dashboard
                    <LogIn size={18} />
                  </>
                )}
              </button>
           </form>

           <div className="my-10 relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-100" />
              <div className="relative flex justify-center">
                 <span className="px-6 bg-white text-[10px] font-black text-gray-300 uppercase tracking-widest">Or Multi-Tenant SSO</span>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleGoogleLogin}
                type="button" 
                className="w-full py-4 border border-gray-100 rounded-2xl flex items-center justify-center gap-4 hover:bg-gray-50 transition-all group"
              >
                <img src="https://www.svgrepo.com/show/355037/google.svg" alt="google" className="w-5 h-5" />
                <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">Sign in with Enterprise Google SSO</span>
              </button>
           </div>

           <p className="mt-12 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">
             By logging in, you agree to our <br />
             <a href="#" className="text-primary hover:underline">Terms of Service</a> & <a href="#" className="text-primary hover:underline">Data Governance Policy</a>
           </p>
        </div>
      </div>
    </div>
  );
};
