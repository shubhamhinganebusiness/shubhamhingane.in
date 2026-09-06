import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Milk, ArrowLeft, Info, Lock, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DairyDemoDashboard } from './DairyDemoDashboard';

export const DairyDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  if (showDemo) {
    return <DairyDemoDashboard onBack={() => setShowDemo(false)} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-blue-50 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
          
          <button 
            onClick={() => navigate('/')}
            className="absolute top-8 left-8 text-gray-400 hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Return to Portfolio
          </button>

          <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-primary">
            <Milk size={48} />
          </div>

          <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">Software Live Demo</h1>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed font-medium">
            Explore the professional features of our Dairy Management System. 
            This demo mode provides a read-only view of the administrative dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4 text-left">
              <Info className="text-primary mt-1 shrink-0" size={20} />
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-tight">Public Sandbox</p>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">View collection entries, farmer ledgers, and automated reports in real-time.</p>
              </div>
            </div>
            <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100 flex items-start gap-4 text-left">
              <Lock className="text-amber-500 mt-1 shrink-0" size={20} />
              <div>
                <p className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-tight">Restricted Actions</p>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Modification, deletion, and settings updates are disabled in this preview.</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowDemo(true)}
            className="w-full py-5 bg-primary text-white rounded-2xl font-black shadow-2xl shadow-primary/30 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
          >
            Launch Live Demo
            <Play size={20} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
