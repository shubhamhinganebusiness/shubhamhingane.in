import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, CheckCircle2, ShieldCheck, Zap, 
  Smartphone, Share2, Leaf, Clock, Users,
  Heart, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

export const MedNews: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505]">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-4xl mb-20">
            <Link 
              to="/med-demo" 
              className="inline-flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-widest mb-8 hover:gap-4 transition-all"
            >
              <ArrowLeft size={16} /> Back to Overview
            </Link>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-8 tracking-tighter leading-none"
            >
              The Next Chapter in <br />
              <span className="text-primary italic">Digital Healthcare.</span>
            </motion.h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl">
              Exploring the features that make MedPrescription the most secure and efficient way to manage medical prescriptions today.
            </p>
          </div>

          {/* Feature 1: The Doctor's Workflow */}
          <section className="mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                  <Plus size={14} /> Clinical Excellence
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
                  Precision Prescribing, <br />Zero Paper Waste.
                </h2>
                <div className="space-y-6 text-gray-500 font-medium text-lg leading-relaxed">
                  <p>
                    Through the platform, the doctor selects the patient, adds their medications, dosages and instructions, with the guarantee of being in full compliance with current legislation.
                  </p>
                  <p>
                    This system completely eliminates the need for a paper prescription or manual printing, reducing operational costs and environmental impact.
                  </p>
                  <div className="flex items-center gap-4 text-gray-900 dark:text-white font-bold bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <ShieldCheck className="text-primary" size={24} />
                    100% Legislative Compliance Guaranteed
                  </div>
                </div>
              </motion.div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10" />
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop" 
                  alt="Doctor using platform" 
                  className="rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-800"
                />
              </div>
            </div>
          </section>

          {/* Feature 2: Patient Empowerment */}
          <section className="mb-32 py-24 bg-gray-50 dark:bg-gray-900/50 rounded-[4rem] px-12 border border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                    <Smartphone className="text-primary mb-4" size={32} />
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Instant Access</h4>
                    <p className="text-xs text-gray-500 font-medium">Digital SMS/Email notifications immediately after issuance.</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 translate-y-12">
                    <Zap className="text-blue-500 mb-4" size={32} />
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">Fast Renewal</h4>
                    <p className="text-xs text-gray-500 font-medium">Renew chronic medications with a single tap through the profile.</p>
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                  <Heart size={14} /> Patient Centric
                </div>
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
                  Your Medication, <br />Always Within Reach.
                </h2>
                <div className="space-y-6 text-gray-500 font-medium text-lg leading-relaxed">
                  <p>
                    All the patients’ medication is visible in their profile, with the possibility of renewing and monitoring their medication continuously, quickly and easily.
                  </p>
                  <p>
                    This reduces the risk of errors related to incorrect human interpretations of handwriting or outdated paper records.
                  </p>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Feature 3: Ecosystem Optimization */}
          <section className="mb-32">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6">
                <Share2 size={14} /> Unified Ecosystem
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
                Optimized Communication for <span className="text-primary">All Parties.</span>
              </h2>
              <p className="text-gray-500 font-medium text-lg italic">
                Effective, direct and secure communication between doctor-patient-pharmacy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  title: 'Time Saving', 
                  icon: Clock, 
                  desc: 'Eliminates the need for physical visits or travel just to pick up a paper prescription or renew medication.' 
                },
                { 
                  title: 'Improved Care', 
                  icon: Users, 
                  desc: 'Doctors can spend more time on diagnosis and less on administrative paperwork and data entry.' 
                },
                { 
                  title: 'Sustainability', 
                  icon: Leaf, 
                  desc: 'Contributes to the sustainability of the health system by reducing unnecessary clinical office visits.' 
                }
              ].map((item, i) => (
                <div key={i} className="p-12 bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-2xl shadow-gray-200/20 dark:shadow-none hover:-translate-y-2 transition-all">
                  <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8">
                    <item.icon size={32} />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-4">{item.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-24 bg-primary rounded-[4rem] text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.2)_100%)]" />
            <div className="relative z-10 px-6">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Ready to Digitalize <br />Your Practice?</h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="px-12 py-5 bg-white text-primary rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition-all">
                  Register Now
                </button>
                <Link to="/med-demo" className="px-12 py-5 bg-black/20 text-white border border-white/20 rounded-2xl font-black text-xl hover:bg-black/40 transition-all">
                  View Demo Again
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
