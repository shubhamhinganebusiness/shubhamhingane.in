import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Home, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { HeroIDCardForm } from '../components/HeroIDCardForm';

export const InstantIDCardBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors duration-300 pb-16">
      {/* Upper Navigation bar with high structural aesthetics */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl border border-slate-200/80 hover:border-slate-300 dark:border-zinc-800 hover:dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft size={13} />
              <span>Back Home</span>
            </button>
            <button
              onClick={() => navigate('/live/select-template')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl border border-slate-200/80 hover:border-slate-300 dark:border-zinc-800 hover:dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles size={13} className="text-amber-500 animate-pulse" />
              <span>Change Template</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-2 hidden sm:flex">
              <ShieldCheck className="text-emerald-500 animate-pulse" size={16} />
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest leading-none">
                Official CR80 Identity Standard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              LIVE VISUAL EDITOR
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Dynamic Typography header framing with generous spacing */}
        <div className="text-left mb-8 border-b border-slate-200/50 dark:border-zinc-900 pb-6 max-w-4xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
              Institutional Security Badges
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            Instant ID Card Builder
          </h1>
        </div>

        {/* Core application container anchoring the ID card builder */}
        <div className="w-full">
          <HeroIDCardForm />
        </div>
      </main>
    </div>
  );
};
