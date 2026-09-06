import React from 'react';
import { motion } from 'motion/react';
import { 
  Sprout, Wheat, Package, Receipt, Users, 
  ShieldCheck, TrendingUp, Zap, Clock, Smartphone, 
  ArrowRight, CheckCircle2, Star, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

export const AgroLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen lg:h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-8 lg:mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Zap size={14} className="animate-pulse" />
              Revolutionizing Agro-Business
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none"
            >
              The Modern OS for <span className="text-primary italic">Agro Shops.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto mb-8 font-medium leading-relaxed"
            >
              Streamline your agriculture business with automated billing, real-time inventory tracking, and farmer-customer management.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                to="/agro-login"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:bg-black transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
              >
                Launch Dashboard
                <ArrowRight size={20} />
              </Link>
              <a 
                href="#book-demo"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all text-center"
              >
                Book a Demo
              </a>
            </motion.div>
          </div>
 
          {/* Preview Image/UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative max-w-4xl mx-auto group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent blur-[80px] -z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-2 shadow-2xl border border-gray-100 dark:border-gray-800">
              <img 
                src="https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop" 
                alt="Agro Dashboard Preview" 
                className="w-full h-auto rounded-[2.5rem] shadow-inner grayscale group-hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            {/* Floating Badges */}
            <div className="absolute -top-10 -right-10 hidden lg:block animate-bounce-slow">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Sales</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">₹4,52,000</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">Packed with <span className="text-primary italic">Power.</span></h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto">Everything you need to run a high-performance agriculture shop.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Receipt, title: 'Smart Billing', desc: 'Generate professional GST compliant invoices in seconds via mobile or desktop.' },
              { icon: Package, title: 'Inventory Control', desc: 'Real-time stock alerts for seeds, fertilizers, and pesticides. Never run out.' },
              { icon: Users, title: 'Customer Credit', desc: 'Track daily sales on credit (Udhaar) and send automated payment reminders.' },
              { icon: Smartphone, title: 'Cross-Device', desc: 'Work from your shop counter or from the field. Data is always in sync.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 group"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-32 bg-white dark:bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="bg-gray-900 dark:bg-gray-900/50 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-8 leading-tight">
                  Trusted by <span className="text-primary">100+</span> Agro Dealers across Bharat.
                </h2>
                <div className="space-y-6">
                  {[
                    'Automated 15-day collection sheets',
                    'Individual farmer transaction ledgers',
                    'WhatsApp invoice integration',
                    'Zero training required to start'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 text-white/80 font-bold">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white">
                        <CheckCircle2 size={14} />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="lg:w-1/2 grid grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center">
                  <div className="text-4xl font-black text-primary mb-2">99.9%</div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Uptime</div>
                </div>
                <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 text-center">
                  <div className="text-4xl font-black text-primary mb-2">5M+</div>
                  <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Invoices</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Booking Section */}
      <section id="book-demo" className="py-32 bg-primary/5">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-[3rem] p-10 md:p-20 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">Book a <span className="text-primary italic">Live Demo.</span></h2>
              <p className="text-gray-500 font-medium">See how AgroShop can transform your business. Our experts will guide you through all features.</p>
            </div>
            
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <input type="text" placeholder="John Doe" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <input type="tel" placeholder="+91 00000 00000" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Shop Name</label>
                <input type="text" placeholder="E.g. Maruti Agro Agency" className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-white" required />
              </div>
              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-6 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-primary/30 hover:bg-black transition-all">
                  Request Free Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <Sprout className="mx-auto mb-10 text-primary animate-bounce-slow" size={64} />
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-10 tracking-tight">
              Ready to <span className="text-primary italic">Grow</span> Your Business?
            </h2>
            <Link 
              to="/contact"
              className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-white rounded-2xl font-bold text-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all group"
            >
              Get Started Now
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <p className="mt-8 text-gray-400 font-medium">Free 14-day trial. No credit card required.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
