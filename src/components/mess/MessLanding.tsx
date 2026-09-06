import React from 'react';
import { motion } from 'motion/react';
import { 
  Utensils, Users, Receipt, CreditCard, 
  ShieldCheck, Zap, ArrowRight, CheckCircle2,
  TrendingUp, Clock, Smartphone, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MessLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10 text-center lg:text-left">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-10"
              >
                <Zap size={14} className="animate-pulse" />
                Next-Gen Mess Management
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-black text-gray-900 mb-8 tracking-tighter leading-[0.9]"
              >
                Zero-Stress <br />
                <span className="text-primary italic">Mess Billing.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-500 text-lg font-medium max-w-xl mb-12 leading-relaxed"
              >
                The ultimate OS for student and worker mess owners. Track meals, manage collections, and auto-generate bills in one click.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                <Link 
                  to="/mess-login"
                  className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/30 hover:bg-black transition-all flex items-center justify-center gap-3"
                >
                  Go to Dashboard
                  <ArrowRight size={18} />
                </Link>
                <button className="w-full sm:w-auto px-10 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all">
                  Request Demo
                </button>
              </motion.div>
            </div>

            <div className="lg:w-1/2 relative">
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: 0.4 }}
                 className="relative z-10"
               >
                 <div className="bg-gray-900 rounded-[3.5rem] p-4 shadow-2xl">
                    <img 
                      src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop" 
                      alt="Agro Dashboard Preview" 
                      className="w-full h-auto rounded-[3rem] grayscale opacity-80"
                    />
                 </div>
                 
                 {/* Floating UI Cards */}
                 <div className="absolute -top-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 hidden md:block animate-bounce-slow">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center">
                          <TrendingUp size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Collections</p>
                          <p className="text-xl font-black text-gray-900">₹84,000</p>
                       </div>
                    </div>
                 </div>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Features Grid */}
      <section className="py-32 bg-gray-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-20 tracking-tight">Everything for <span className="text-primary italic">Modern Mess.</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Utensils, title: 'Meal Tracker', desc: 'Mark daily attendance for Breakfast, Lunch & Dinner with one tap.' },
              { icon: Users, title: 'Member OS', desc: 'Maintain student digital profiles, room numbers, and ledgers.' },
              { icon: Receipt, title: 'Auto Billing', desc: 'Generate professional invoices for entire months in seconds.' },
              { icon: CreditCard, title: 'Payment Log', desc: 'Track cash and online collections. Sync balances instantly.' },
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100 group transition-all"
              >
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-10 group-hover:bg-primary group-hover:text-white transition-all duration-500 mx-auto">
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">{f.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
           <div className="bg-gray-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4" />
              
              <div className="flex flex-col lg:flex-row items-center gap-16 relative z-10">
                 <div className="lg:w-1/2">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-10 leading-tight">Trusted by <span className="text-primary italic">Premiere Mess Owners</span> across Education Hubs.</h2>
                    <ul className="space-y-6">
                       {['GST Compliant Invoicing', 'WhatsApp Bill Sharing', 'Attendance Sheets (PDF)', 'Multi-Device Support'].map((item, i) => (
                          <li key={i} className="flex items-center gap-4 text-white/70 font-bold">
                             <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                               <CheckCircle2 size={14} />
                             </div>
                             {item}
                          </li>
                       ))}
                    </ul>
                 </div>
                 <div className="lg:w-1/2 grid grid-cols-2 gap-6 w-full">
                    <div className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/10 text-center">
                       <p className="text-4xl font-black text-primary mb-2">50+</p>
                       <p className="text-xs font-black text-white/30 uppercase tracking-widest">Active Messes</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl border border-white/10 text-center">
                       <p className="text-4xl font-black text-primary mb-2">10k+</p>
                       <p className="text-xs font-black text-white/30 uppercase tracking-widest">Active Students</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <footer className="py-20 border-t border-gray-100">
        <div className="container mx-auto px-6 text-center">
           <Link to="/" className="text-xl font-black text-gray-900 mb-8 border-b-2 border-primary inline-block">MESSOS by Shubham</Link>
           <p className="text-gray-400 font-medium">Built for high-performance mess operations.</p>
        </div>
      </footer>
    </div>
  );
};
