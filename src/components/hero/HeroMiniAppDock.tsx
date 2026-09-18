import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, User, Smartphone, Cpu, ArrowUpRight, 
  Sparkles, CheckCircle2, QrCode, Play, Volume2, Shield, LogIn
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type MiniDockTab = 'profile' | 'cricket' | 'dairy' | 'idcard';

interface HeroMiniAppDockProps {
  activeTab: MiniDockTab;
  onTabChange: (tab: MiniDockTab) => void;
  displayImage: string;
  imgError: boolean;
  fallbackImage: string;
  onImgError: () => void;
  onOpenEstimator?: () => void;
  onOpenTerminal?: () => void;
}

export const HeroMiniAppDock: React.FC<HeroMiniAppDockProps> = ({
  activeTab,
  onTabChange,
  displayImage,
  imgError,
  fallbackImage,
  onImgError,
  onOpenEstimator,
  onOpenTerminal
}) => {
  const navigate = useNavigate();

  // Cricket Mini State Simulation
  const [cricketRuns, setCricketRuns] = useState(148);
  const [cricketWickets, setCricketWickets] = useState(3);
  const [cricketBalls, setCricketBalls] = useState(86); // 14.2 overs
  const [recentBalls, setRecentBalls] = useState<string[]>(['4', '1', '6', '0', 'W', '4']);

  const handleSimulateBall = (outcome: string) => {
    setCricketBalls(prev => prev + 1);
    if (outcome === 'W') {
      setCricketWickets(prev => Math.min(10, prev + 1));
    } else {
      setCricketRuns(prev => prev + (parseInt(outcome) || 0));
    }
    setRecentBalls(prev => [...prev.slice(1), outcome]);
  };

  // Dairy Mini State Simulation
  const [fat, setFat] = useState(4.2);
  const [snf, setSnf] = useState(8.5);
  const [liters, setLiters] = useState(15);
  const ratePerLiter = Number((fat * 6.5 + snf * 2.2).toFixed(2));
  const totalMilkPayout = Number((ratePerLiter * liters).toFixed(2));

  return (
    <div className="flex flex-col items-center w-full max-w-[340px] sm:max-w-[370px] mx-auto select-none" id="hero-interactive-dock-container">
      {/* Interactive Display Canvas Frame */}
      <div className="relative w-full aspect-square rounded-[2.2rem] p-2.5 bg-white dark:bg-zinc-900 border border-gray-200/70 dark:border-zinc-800 shadow-2xl overflow-hidden transition-all duration-300">
        <AnimatePresence mode="wait">
          {/* TAB 1: PROFILE PHOTO DISPLAY */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full rounded-[1.8rem] overflow-hidden relative bg-slate-50 dark:bg-zinc-950 group"
            >
              <img 
                src={imgError ? fallbackImage : displayImage} 
                alt="Shubham Hingane" 
                className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-104 transition-all duration-700 ease-out"
                onError={onImgError}
                referrerPolicy="no-referrer"
                loading="eager"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent h-1/2 pointer-events-none" />

              {/* Status bar */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/60 dark:bg-zinc-950/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[9px] font-black tracking-widest text-white uppercase">
                    Architect v4.2 Online
                  </span>
                </div>
                <span className="text-[8px] font-mono text-zinc-300 font-bold">
                  PUNE // MH
                </span>
              </div>
            </motion.div>
          )}

          {/* TAB 2: LIVE GULLYSCORE PREVIEW */}
          {activeTab === 'cricket' && (
            <motion.div
              key="cricket"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full rounded-[1.8rem] p-4 bg-gradient-to-br from-emerald-950 via-slate-950 to-zinc-950 text-white flex flex-col justify-between border border-emerald-500/25 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Trophy size={14} className="text-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                    GullyScore Live Engine
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500 text-white animate-pulse">
                  LIVE
                </span>
              </div>

              {/* Score Display */}
              <div className="py-2 text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  Shivaji Strikers vs Jamkhed Kings
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-3xl font-black font-mono tracking-tight text-white">
                    {cricketRuns}/{cricketWickets}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ({Math.floor(cricketBalls / 6)}.{cricketBalls % 6} ov)
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 font-mono font-bold">
                  CRR: {(cricketRuns / (cricketBalls / 6)).toFixed(2)} • Target: 182 (Need {Math.max(0, 182 - cricketRuns)} off {Math.max(0, 120 - cricketBalls)}b)
                </p>
              </div>

              {/* Recent Balls Ticker */}
              <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                <span className="text-[8.5px] font-extrabold uppercase text-slate-400 tracking-wider block">
                  Tap to score a delivery:
                </span>
                <div className="flex items-center justify-between gap-1">
                  {['0', '1', '4', '6', 'W'].map(b => (
                    <button
                      key={b}
                      onClick={() => handleSimulateBall(b)}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-black transition-transform active:scale-95 cursor-pointer border-none ${
                        b === '6' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' :
                        b === '4' ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' :
                        b === 'W' ? 'bg-rose-500 text-white hover:bg-rose-400' :
                        'bg-slate-800 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => navigate('/cricket-login')}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-none"
              >
                <LogIn size={12} />
                <span>Login to GullyScore / Scoreboard</span>
                <ArrowUpRight size={12} />
              </button>
            </motion.div>
          )}

          {/* TAB 3: DAIRY & AGRO CALCULATOR PREVIEW */}
          {activeTab === 'dairy' && (
            <motion.div
              key="dairy"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full rounded-[1.8rem] p-4 bg-gradient-to-br from-sky-950 via-slate-950 to-zinc-950 text-white flex flex-col justify-between border border-sky-500/25 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Cpu size={14} className="text-sky-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                    Dairy ERP • Instant Milk Slip
                  </span>
                </div>
                <span className="text-[8.5px] font-mono text-slate-400">Cow Milk A1</span>
              </div>

              {/* Sliders */}
              <div className="space-y-2 py-1 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                    <span>FAT %: {fat.toFixed(1)}</span>
                    <span className="text-sky-400 font-mono">{(fat * 6.5).toFixed(1)} pts</span>
                  </div>
                  <input
                    type="range"
                    min="3.0"
                    max="6.5"
                    step="0.1"
                    value={fat}
                    onChange={e => setFat(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                    <span>SNF %: {snf.toFixed(1)}</span>
                    <span className="text-sky-400 font-mono">{(snf * 2.2).toFixed(1)} pts</span>
                  </div>
                  <input
                    type="range"
                    min="7.5"
                    max="9.5"
                    step="0.1"
                    value={snf}
                    onChange={e => setSnf(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                    <span>Quantity: {liters} L</span>
                    <span className="text-slate-400 font-mono">Morning Batch</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={liters}
                    onChange={e => setLiters(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

              {/* Receipt Summary Box */}
              <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Rate / Liter</span>
                  <span className="text-sm font-black font-mono text-sky-400">₹{ratePerLiter}</span>
                </div>
                <div className="text-right">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block">Total Payout</span>
                  <span className="text-base font-black font-mono text-emerald-400">₹{totalMilkPayout}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/dairy-login')}
                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-none"
              >
                <LogIn size={12} />
                <span>Login to Dairy ERP Portal</span>
                <ArrowUpRight size={12} />
              </button>
            </motion.div>
          )}

          {/* TAB 4: INSTANT ID CARD PREVIEW */}
          {activeTab === 'idcard' && (
            <motion.div
              key="idcard"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35 }}
              className="w-full h-full rounded-[1.8rem] p-4 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950 text-white flex flex-col justify-between border border-indigo-500/25 relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={14} className="text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                    ID Studio • 300 DPI Engine
                  </span>
                </div>
                <span className="text-[8.5px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Verified
                </span>
              </div>

              {/* 3D Holographic Card Simulation */}
              <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl border border-indigo-500/30 flex items-center gap-3 shadow-lg">
                <div className="w-12 h-14 rounded-xl bg-slate-800 border border-indigo-400/40 overflow-hidden shrink-0 flex items-center justify-center">
                  <User size={24} className="text-indigo-300" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-indigo-400 block tracking-widest">
                    JAMKHED UNIVERSITY
                  </span>
                  <h4 className="text-xs font-black truncate text-white">
                    Aditya S. Kulkarni
                  </h4>
                  <p className="text-[9px] text-slate-400 font-mono">
                    ID: JU-2026-884 • Computer Sci
                  </p>
                </div>
                <div className="p-1 bg-white rounded-lg shrink-0">
                  <QrCode size={24} className="text-slate-950" />
                </div>
              </div>

              <div className="text-[10px] text-slate-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Batch CSV importer (10,000+ cards / min)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  <span>Vector barcode & print-ready CMYK PDF export</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/login', { state: { from: { pathname: '/live/instant-id-builder' } } })}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors border-none"
              >
                <LogIn size={12} />
                <span>Login to ID Card Builder</span>
                <ArrowUpRight size={12} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Interactive Micro-Dock Switcher Bar */}
      <div className="mt-3 p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-lg flex items-center gap-1">
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-primary text-white shadow-sm font-black'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Shubham Hingane Profile"
        >
          <User size={13} />
          <span className="text-[10.5px]">Profile</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('cricket')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === 'cricket'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'text-slate-600 dark:text-zinc-400 hover:text-emerald-500'
          }`}
          title="Live GullyScore Tournament Engine"
        >
          <Trophy size={13} />
          <span className="text-[10.5px]">GullyScore</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('dairy')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === 'dairy'
              ? 'bg-sky-600 text-white shadow-sm font-black'
              : 'text-slate-600 dark:text-zinc-400 hover:text-sky-500'
          }`}
          title="Dairy & Agro ERP Platform"
        >
          <Cpu size={13} />
          <span className="text-[10.5px]">Dairy ERP</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('idcard')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
            activeTab === 'idcard'
              ? 'bg-indigo-600 text-white shadow-sm font-black'
              : 'text-slate-600 dark:text-zinc-400 hover:text-indigo-500'
          }`}
          title="Instant ID Card Builder"
        >
          <Smartphone size={13} />
          <span className="text-[10.5px]">ID Cards</span>
        </button>
      </div>
    </div>
  );
};
