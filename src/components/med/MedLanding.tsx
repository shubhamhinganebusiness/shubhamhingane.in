import React from 'react';
import { motion } from 'motion/react';
import { 
  Stethoscope, Pill, ClipboardList, Users, Star, 
  Image, FileBarChart, Bell, ArrowRight, CheckCircle2, 
  Smartphone, ShieldCheck, Zap, Mail, MessageSquare,
  Settings, Lock, Clock, ChevronRight, Activity, Heart, Cross
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';

export const MedLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen lg:h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-primary/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-8 lg:mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Zap size={14} className="animate-pulse" />
              Revolutionizing Healthcare Delivery
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter leading-none"
            >
              Digital Ecosystem for <span className="text-primary italic">Modern Medicine.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto mb-8 font-medium leading-relaxed"
            >
              Digitalizing the medical prescription to optimize communication between doctor-patient-pharmacy in an effective, direct and secure way.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                to="/med-login"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 hover:bg-black transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1"
              >
                <Stethoscope size={20} />
                Doctor Portal
              </Link>
              <Link 
                to="/med-login"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                <Pill size={20} />
                Pharmacy Portal
              </Link>
            </motion.div>
          </div>
  
          {/* Preview Image/UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative max-w-4xl mx-auto group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent blur-[80px] -z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-2 shadow-2xl border border-gray-100 dark:border-gray-800">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop" 
                alt="MedPrescription Dashboard Preview" 
                className="w-full h-auto rounded-[2.5rem] shadow-inner grayscale group-hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            {/* Floating Badges */}
            <div className="absolute -top-10 -right-10 hidden lg:block animate-bounce-slow">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-50 dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Patients</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">2,840+</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Concept Section */}
      <section id="concept" className="py-32 bg-gray-50 dark:bg-gray-900/50 overflow-hidden relative">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">
                Making Healthcare <span className="text-primary italic">Easier to Manage.</span>
              </h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-primary">
                    <Stethoscope size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Doctor's Portal</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">Issues the prescription from the platform by completing the patient's medication sheet. Full compliance with current legislation.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-500">
                    <Users size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Patient Profile</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">Receives instant notifications via Email and SMS. Access medications profile anywhere, anytime. No more paper prescriptions.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-16 h-16 shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center justify-center text-green-500">
                    <Pill size={32} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pharmacy Network</h4>
                    <p className="text-gray-500 font-medium leading-relaxed">Dispenses medications with legal guarantee. Real-time verification of prescriptions directly from the platform.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full translate-x-1/4 scale-150 -z-10" />
               <div className="bg-white dark:bg-gray-800 p-8 rounded-[4rem] shadow-2xl border border-gray-100 dark:border-gray-700 rotate-3 transform transition-transform hover:rotate-0 duration-700">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
                        <Cross size={24} />
                      </div>
                      <div>
                        <h5 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">Digital Prescription</h5>
                        <p className="text-[10px] text-gray-400 font-bold">LEGALLY COMPLIANT</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Issued</p>
                      <p className="font-bold text-gray-900 dark:text-white text-xs">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    {[
                      { name: 'Amoxicillin 500mg', dosage: '1 Tab / 8 Hours', duration: '7 Days' },
                      { name: 'Paracetamol 650mg', dosage: '1 Tab / SOS', duration: '5 Days' },
                      { name: 'Cetirizine 10mg', dosage: '1 Tab / Night', duration: '10 Days' }
                    ].map((med, i) => (
                      <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center">
                         <div>
                           <p className="font-black text-gray-900 dark:text-white text-sm">{med.name}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{med.dosage}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-black text-primary">{med.duration}</p>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div className="w-32 h-12 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center opacity-30">
                       <span className="text-[10px] font-black tracking-[0.3em] uppercase">QR CODE</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Signed By</p>
                      <p className="font-bold text-gray-900 dark:text-white italic">Dr. Robert Fischer</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-white dark:bg-[#050505]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6">Built for <span className="text-primary italic">Efficiency.</span></h2>
            <p className="text-gray-500 font-medium max-w-2xl mx-auto tracking-wide">Streamlining pharmaceutical management with cutting-edge digital tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {[
              { icon: Zap, title: 'Quickly Create Prescriptions', desc: 'Create prescriptions in seconds, print or share them electronically.' },
              { icon: Star, title: 'Favourite Prescriptions', desc: 'Predefined templates for common diagnoses to prescribe even faster.' },
              { icon: Smartphone, title: 'Consult Patients Online', desc: 'Accept consultation fee, manage appointments and video consult patients.' },
              { icon: Settings, title: 'Customized To Your Needs', desc: 'Prescrip is built to adapt to the unique needs of your practice.' },
              { icon: Clock, title: 'Track Treatment History', desc: 'Save hours by getting history of each patient’s medical records instantly.' },
              { icon: FileBarChart, title: 'Generate Reports', desc: 'Create reports for clinical research, patient studies or health patterns.' },
              { icon: Users, title: 'Easy Patient Management', desc: 'Easily access all your patient data anytime anywhere securely.' },
              { icon: Bell, title: 'Send Key Reminders', desc: 'Contact patients via automated SMS for medicine and follow-up reminders.' },
              { icon: Image, title: 'Organize Notes & Images', desc: 'Save hours of time and costs spent on managing physical patient records.' },
              { icon: Lock, title: 'Secure & Own Your Records', desc: 'Strict security ensuring only you have access to your data at all times.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-gray-50 dark:bg-gray-900 p-8 rounded-[3rem] shadow-xl shadow-gray-200/20 dark:shadow-none border border-gray-100 dark:border-gray-800 group transition-all duration-500"
              >
                <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-md group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium text-xs">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 bg-primary dark:bg-primary/90 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                Sustainable Healthcare for the <span className="text-white/40">Next Generation.</span>
              </h2>
              <p className="text-white/80 text-lg font-medium mb-12">
                Our platform contributes to the sustainability of the health system by reducing paper waste and eliminating unnecessary physical visits for routine renewals.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                   <div className="text-5xl font-black mb-2">35%</div>
                   <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Error Reduction</div>
                </div>
                <div>
                   <div className="text-5xl font-black mb-2">12M+</div>
                   <div className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Paper Saved</div>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[4rem] border border-white/20">
              <h3 className="text-2xl font-black mb-8">System Advantages</h3>
              <div className="space-y-6">
                {[
                  'Avoid unnecessary travel for medication renewal',
                  'Reduces risk of incorrect humane interpretations',
                  'Continuous monitoring of patient medication',
                  'Real-time legal compliance verification',
                  'Secure end-to-end data encryption'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white text-primary rounded-xl flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="font-bold text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white dark:bg-[#050505]">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Heart className="mx-auto mb-10 text-red-500" size={64} fill="currentColor" />
            </motion.div>
            <h2 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-10 tracking-tight leading-none">
              Modernize Your <span className="text-primary italic">Practice</span> Today.
            </h2>
            <Link 
              to="/med-login"
              className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-white rounded-2xl font-bold text-2xl shadow-2xl shadow-primary/30 hover:scale-105 transition-all group"
            >
              Join the Network
              <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <p className="mt-8 text-gray-400 font-medium">No installation required. Access from any web browser.</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
