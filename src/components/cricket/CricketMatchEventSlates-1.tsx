import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Swords, Zap, Target, Sparkles, X, Activity, Flame, 
  Shield, MapPin, Gauge, Volume2, VolumeX, Eye, Radio, 
  CheckCircle2, Compass, Play, RotateCcw
} from 'lucide-react';
import { MatchState, Innings, Batsman, Bowler } from './CricketFullScreenTransitions';
import { StarTVColors } from './StarTVThemeTokens';

export type ChromaBackgroundMode = 'dark' | 'transparent' | 'green' | 'blue';

// =========================================================================
// SYNTHESIZED BROADCAST AUDIO (Web Audio API)
// =========================================================================
function playBroadcastAudio(type: 'stinger_whoosh' | 'impact_boom' | 'six_laser' | 'wicket_gavel' | 'cheer') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'stinger_whoosh') {
      // Sweeping high-speed broadcast wipe whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.45);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'six_laser') {
      // Cosmic rising laser + power impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.3);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'wicket_gavel') {
      // Heavy timber thud impact
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'cheer' || type === 'impact_boom') {
      // Sub-bass thump
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.55);
    }
  } catch {
    // Ignore audio errors if blocked by browser policy
  }
}

// Clean player name helper
function cleanPlayerName(name: string): string {
  return (name || '').replace(/\s*\((?:c|wk|capt|w\/k|c\/wk|wk\/c)\)/gi, '').trim();
}

// Chroma Key background wrapper
interface ChromaWrapperProps {
  children: React.ReactNode;
  chromaMode: ChromaBackgroundMode;
  onChromaChange: (mode: ChromaBackgroundMode) => void;
  onClose?: () => void;
  title?: string;
  autoDismissSecs?: number;
}

export const ChromaBroadcastContainer: React.FC<ChromaWrapperProps> = ({
  children,
  chromaMode,
  onChromaChange,
  onClose,
  title,
  autoDismissSecs
}) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(autoDismissSecs || null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (!autoDismissSecs || isPaused) return;
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoDismissSecs, isPaused, onClose]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (e.key.toLowerCase() === 'g') {
        onChromaChange(chromaMode === 'green' ? 'dark' : 'green');
      } else if (e.key.toLowerCase() === 'a') {
        onChromaChange(chromaMode === 'transparent' ? 'dark' : 'transparent');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chromaMode, onChromaChange, onClose]);

  // Determine container background based on Chroma Key mode
  const bgStyle = (() => {
    switch (chromaMode) {
      case 'green':
        return { backgroundColor: '#00B140' }; // Official broadcast green
      case 'blue':
        return { backgroundColor: '#0000FF' };
      case 'transparent':
        return { backgroundColor: 'transparent' };
      case 'dark':
      default:
        return { backgroundColor: 'rgba(2, 6, 23, 0.88)' };
    }
  })();

  return (
    <div 
      className={`absolute inset-0 z-50 pointer-events-auto flex flex-col justify-between p-4 md:p-8 font-sans select-none overflow-hidden transition-colors duration-300 ${
        chromaMode === 'dark' ? 'backdrop-blur-md' : ''
      }`}
      style={bgStyle}
    >
      {/* Dynamic Background Glint when in Dark Mode */}
      {chromaMode === 'dark' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/20 blur-[140px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/20 blur-[140px] rounded-full" />
        </div>
      )}

      {/* TOP BROADCAST DIRECTOR HEADER & CHROMA CONTROLLER */}
      <div className="relative z-30 flex items-center justify-between gap-3 bg-slate-950/80 border border-white/15 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-1">
            <Radio size={12} className="text-amber-400" />
            ★ STAR TV PRO BROADCAST TRANSITION
          </span>
          {title && (
            <span className="text-xs font-mono text-white font-bold uppercase hidden sm:inline-block">
              • {title}
            </span>
          )}
        </div>

        {/* CHROMA KEY & ALPHA MODE SELECTOR */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-1 flex items-center gap-1 text-[10px] font-mono">
            <span className="text-slate-400 px-1 font-bold">MODE:</span>
            <button
              onClick={() => onChromaChange('dark')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                chromaMode === 'dark' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Broadcast Dark background (Standard TV preview)"
            >
              🌙 DARK
            </button>
            <button
              onClick={() => onChromaChange('transparent')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                chromaMode === 'transparent' ? 'bg-amber-400 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Pure Alpha Transparent (Press 'A' - for OBS Browser Source overlay)"
            >
              🫧 ALPHA
            </button>
            <button
              onClick={() => onChromaChange('green')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                chromaMode === 'green' ? 'bg-emerald-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
              title="OBS / vMix Chroma Green Screen (Press 'G')"
            >
              🟢 GREEN
            </button>
            <button
              onClick={() => onChromaChange('blue')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                chromaMode === 'blue' ? 'bg-blue-400 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
              }`}
              title="Chroma Blue Screen"
            >
              🔵 BLUE
            </button>
          </div>

          {remainingTime !== null && (
            <button
              onClick={() => setIsPaused(p => !p)}
              className="px-2.5 py-1 rounded-xl bg-white/10 text-slate-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
              title="Pause auto-dismiss countdown"
            >
              <span>{isPaused ? '⏸️' : '⏱️'}</span>
              <span>{isPaused ? 'HOLD' : `${remainingTime}s`}</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-rose-500/40 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Dismiss Transition (Esc)"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* CORE SLATE CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-auto w-full">
        {children}
      </div>

      {/* FOOTER SHORTCUT HINT */}
      <div className="relative z-20 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-950/70 border border-white/10 px-4 py-1.5 rounded-xl backdrop-blur-md">
        <span>Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">G</kbd> for OBS Green Screen • <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">A</kbd> for Alpha • <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">Esc</kbd> to Close</span>
        <span className="text-amber-400 font-bold uppercase">HD 1080P TV BROADCAST ENGINE</span>
      </div>
    </div>
  );
};

/* =========================================================================
   1. 3D BROADCAST WIPE STINGER ("THE STAR TV / IPL TRANSITION")
   ========================================================================= */
export const BroadcastWipeStinger: React.FC<{
  match: MatchState;
  onComplete?: () => void;
  tournamentName?: string;
}> = ({ match, onComplete, tournamentName }) => {
  const teamA = match.teamA || 'TEAM A';
  const teamB = match.teamB || 'TEAM B';

  useEffect(() => {
    playBroadcastAudio('stinger_whoosh');
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden select-none">
      {/* Top Angled Slicing Chevron Blade 1 (Left to Right) */}
      <motion.div
        initial={{ x: '-120%', skewX: -25 }}
        animate={{ x: ['-120%', '0%', '130%'] }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 w-full bg-gradient-to-r from-blue-700 via-sky-500 to-indigo-900 opacity-95 shadow-[0_0_80px_rgba(56,189,248,0.7)]"
        style={{
          clipPath: 'polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%)',
          borderRight: '6px solid rgba(255, 255, 255, 0.9)'
        }}
      />

      {/* Opposing Angled Slicing Chevron Blade 2 (Right to Left) */}
      <motion.div
        initial={{ x: '120%', skewX: -25 }}
        animate={{ x: ['120%', '0%', '-130%'] }}
        transition={{ duration: 1.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 w-full bg-gradient-to-l from-amber-600 via-yellow-500 to-amber-700 opacity-95 shadow-[0_0_80px_rgba(245,158,11,0.7)]"
        style={{
          clipPath: 'polygon(15% 0%, 100% 0%, 85% 100%, 0% 100%)',
          borderLeft: '6px solid rgba(255, 255, 255, 0.9)'
        }}
      />

      {/* Central High-Speed Laser Sweep Streak */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.5, 0], opacity: [0, 1, 0] }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className="absolute top-1/2 inset-x-0 h-2 bg-gradient-to-r from-transparent via-white to-transparent -translate-y-1/2 blur-sm"
      />

      {/* Central 3D Spinning Gold Medallion Crest */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotateY: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.3, 1.15, 0],
            rotateY: [0, 360, 720, 1080],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ duration: 1.7, ease: "easeInOut" }}
          className="relative flex flex-col items-center justify-center [perspective:1000px]"
        >
          {/* Gold Glowing Aura */}
          <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 border-4 border-white flex flex-col items-center justify-center shadow-[0_0_90px_rgba(251,191,36,0.9)] p-3 text-slate-950">
            <Trophy size={48} className="text-slate-950 drop-shadow-md animate-pulse mb-1" />
            <span className="font-black text-xs uppercase tracking-widest font-mono text-center">
              {tournamentName || 'STAR SPORTS'}
            </span>
            <span className="text-[10px] font-black uppercase text-amber-950 font-mono tracking-wider">
              ★ LIVE TRANSITION ★
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: [0, 1, 1, 0], y: [15, 0, 0, -10] }}
            transition={{ duration: 1.5, delay: 0.15 }}
            className="mt-4 px-6 py-2 rounded-2xl bg-slate-950/90 border-2 border-amber-400 text-white font-black font-mono text-lg uppercase tracking-wider shadow-2xl flex items-center gap-3"
          >
            <span className="text-sky-400">{teamA}</span>
            <span className="text-amber-400">VS</span>
            <span className="text-yellow-400">{teamB}</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. HIGH-IMPACT MATCH EVENT FULL-SCREEN SLATE: SIX! (MAXIMUM)
   ========================================================================= */
export const EventSixSlate: React.FC<{
  match: MatchState;
  onClose?: () => void;
  batsmanName?: string;
  distanceMeters?: number;
  launchAngleDeg?: number;
  exitSpeedKmh?: number;
}> = ({ 
  match, 
  onClose,
  batsmanName,
  distanceMeters = 104,
  launchAngleDeg = 32.5,
  exitSpeedKmh = 148.8
}) => {
  const [chromaMode, setChromaMode] = useState<ChromaBackgroundMode>('dark');
  const currentInnings = match.currentInningsNum === 1 ? match.innings1 : match.innings2;
  const striker = currentInnings?.batsmen?.find(b => !b.isOut) || currentInnings?.batsmen?.[0];
  const displayName = batsmanName || striker?.name || 'ROHIT SHARMA';
  const playerPhoto = match.playerPhotos?.[displayName] || match.playerPhotos?.[cleanPlayerName(displayName)];

  useEffect(() => {
    playBroadcastAudio('six_laser');
  }, []);

  return (
    <ChromaBroadcastContainer 
      chromaMode={chromaMode} 
      onChromaChange={setChromaMode} 
      onClose={onClose}
      title="HOLOGRAPHIC MAXIMUM (6 RUNS)"
      autoDismissSecs={7}
    >
      <div className="w-full max-w-5xl bg-slate-950/90 border border-white/20 rounded-[2.5rem] p-6 md:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white relative overflow-hidden">
        {/* Top Glowing Cyan Shimmer Border */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90" />
        
        {/* MAIN SIX TITLE HEADER */}
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            <Zap size={14} className="text-cyan-400" />
            ★ STAR TV HOLOGRAPHIC SHOT RADAR ★
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.08, 1], opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center gap-4"
          >
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 drop-shadow-[0_10px_25px_rgba(6,182,212,0.6)]">
              THAT'S A SIX!
            </h1>
          </motion.div>
          <span className="text-sm font-mono text-cyan-300 uppercase tracking-widest font-black">
            COLOSSAL MAXIMUM OVER THE BOUNDARY ROPES
          </span>
        </div>

        {/* 3-COLUMN METRICS GRID WITH GROUND TRAJECTORY ARC */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* COL 1: BATSMAN HERO CARD (Cols 1-4) */}
          <div className="md:col-span-4 bg-slate-900/80 border border-white/10 rounded-3xl p-5 flex flex-col items-center text-center relative overflow-hidden shadow-xl">
            <div className="w-24 h-24 rounded-3xl bg-slate-950 border-2 border-cyan-400/60 overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center mb-3">
              {playerPhoto ? (
                <img src={playerPhoto} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-2xl text-cyan-300">{displayName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold uppercase tracking-wider">BATTER IN FULL FLOW</span>
            <h3 className="text-xl font-black text-white uppercase truncate mt-0.5">{cleanPlayerName(displayName)}</h3>
            
            {striker && (
              <div className="mt-3 w-full pt-3 border-t border-white/10 flex items-center justify-around text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">SCORE</span>
                  <span className="text-amber-300 font-black text-base">{striker.runs}* ({striker.balls})</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-slate-400 block text-[10px]">STRIKE RATE</span>
                  <span className="text-cyan-300 font-black text-base">
                    {striker.balls > 0 ? ((striker.runs / striker.balls) * 100).toFixed(1) : '100.0'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* COL 2: HOLOGRAPHIC TRAJECTORY CANVAS (Cols 5-8) */}
          <div className="md:col-span-5 bg-slate-900/80 border border-cyan-500/30 rounded-3xl p-5 flex flex-col items-center justify-center relative shadow-xl overflow-hidden min-h-[220px]">
            {/* SVG Wireframe Arc */}
            <svg viewBox="0 0 320 180" className="w-full h-44 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              {/* Ground level line */}
              <line x1="20" y1="160" x2="300" y2="160" stroke="#334155" strokeWidth="2" strokeDasharray="4 4" />
              <text x="25" y="174" fill="#94a3b8" fontSize="9" fontFamily="monospace">CREASE</text>
              <text x="245" y="174" fill="#94a3b8" fontSize="9" fontFamily="monospace">GRANDSTAND</text>
              
              {/* Trajectory Parabola Arc */}
              <motion.path
                d="M 35 155 Q 160 20 285 140"
                fill="transparent"
                stroke="url(#sixGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
              />

              {/* Peak Apex Marker */}
              <circle cx="160" cy="45" r="4" fill="#f59e0b" />
              <text x="135" y="32" fill="#fbbf24" fontSize="9" fontWeight="bold" fontFamily="monospace">APEX 28.4M</text>

              {/* Impact Ball Landing */}
              <circle cx="285" cy="140" r="6" fill="#38bdf8" />
              <circle cx="285" cy="140" r="12" fill="none" stroke="#38bdf8" strokeWidth="1.5" className="animate-ping" />

              <defs>
                <linearGradient id="sixGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>

            <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-widest mt-1">
              3D BALL TRACKING RADAR RECONSTRUCTION
            </span>
          </div>

          {/* COL 3: BALL FLIGHT RADAR METRICS (Cols 9-12) */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3.5 text-center shadow-lg">
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">DISTANCE</span>
              <span className="text-3xl font-black text-amber-300 font-mono tracking-tight">{distanceMeters} M</span>
              <span className="text-[10px] text-slate-400 block font-mono">{(distanceMeters * 1.093).toFixed(0)} YARDS</span>
            </div>

            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-3.5 text-center shadow-lg">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">EXIT VELOCITY</span>
              <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight">{exitSpeedKmh} KM/H</span>
              <span className="text-[10px] text-slate-400 block font-mono">{(exitSpeedKmh * 0.621371).toFixed(1)} MPH</span>
            </div>

            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-3.5 text-center shadow-lg">
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">LAUNCH ANGLE</span>
              <span className="text-xl font-black text-white font-mono tracking-tight">{launchAngleDeg}°</span>
              <span className="text-[10px] text-emerald-400 block font-mono">OPTIMAL ARC</span>
            </div>
          </div>

        </div>
      </div>
    </ChromaBroadcastContainer>
  );
};

/* =========================================================================
   3. HIGH-IMPACT MATCH EVENT FULL-SCREEN SLATE: WICKET / OUT!
   ========================================================================= */
export const EventWicketSlate: React.FC<{
  match: MatchState;
  onClose?: () => void;
  batsmanName?: string;
  bowlerName?: string;
  dismissalType?: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped';
  fielderName?: string;
}> = ({
  match,
  onClose,
  batsmanName,
  bowlerName,
  dismissalType = 'bowled',
  fielderName
}) => {
  const [chromaMode, setChromaMode] = useState<ChromaBackgroundMode>('dark');
  const currentInnings = match.currentInningsNum === 1 ? match.innings1 : match.innings2;
  const dismissedBatter = currentInnings?.batsmen?.find(b => b.isOut) || currentInnings?.batsmen?.[0];
  const activeBowler = currentInnings?.bowlers?.find(b => b.isCurrent) || currentInnings?.bowlers?.[0];

  const batterDisplay = batsmanName || dismissedBatter?.name || 'BATSMAN';
  const bowlerDisplay = bowlerName || activeBowler?.name || 'BOWLER';
  const batterPhoto = match.playerPhotos?.[batterDisplay] || match.playerPhotos?.[cleanPlayerName(batterDisplay)];

  useEffect(() => {
    playBroadcastAudio('wicket_gavel');
  }, []);

  const dismissalLabel = (() => {
    switch (dismissalType) {
      case 'caught':
        return fielderName ? `c ${cleanPlayerName(fielderName)} b ${cleanPlayerName(bowlerDisplay)}` : `c & b ${cleanPlayerName(bowlerDisplay)}`;
      case 'lbw':
        return `lbw b ${cleanPlayerName(bowlerDisplay)}`;
      case 'run_out':
        return `run out (${cleanPlayerName(fielderName || 'Direct Hit')})`;
      case 'stumped':
        return `st †${cleanPlayerName(fielderName || match.teamBWicketKeeper || 'Keeper')} b ${cleanPlayerName(bowlerDisplay)}`;
      case 'bowled':
      default:
        return `b ${cleanPlayerName(bowlerDisplay)}`;
    }
  })();

  const stampLabel = dismissalType.toUpperCase().replace('_', ' ');

  return (
    <ChromaBroadcastContainer 
      chromaMode={chromaMode} 
      onChromaChange={setChromaMode} 
      onClose={onClose}
      title="OFFICIAL WICKET DISMISSAL SLATE"
      autoDismissSecs={8}
    >
      <div className="w-full max-w-5xl bg-slate-950/95 border-2 border-rose-500/50 rounded-[2.5rem] p-6 md:p-8 shadow-[0_25px_90px_rgba(225,29,72,0.6)] backdrop-blur-2xl text-white relative overflow-hidden">
        {/* Slanted Crimson Hazard Stripe */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-rose-600 via-amber-400 to-rose-600" />
        
        {/* IMPACT HEADER: OUT / WICKET STAMP */}
        <div className="text-center space-y-3 mb-6">
          <motion.div
            initial={{ scale: 2, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: -2, opacity: 1 }}
            transition={{ duration: 0.35, ease: "backOut" }}
            className="inline-block"
          >
            <div className="px-8 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 border-4 border-white text-white font-black text-4xl md:text-6xl uppercase tracking-wider shadow-[0_0_50px_rgba(225,29,72,0.8)]">
              ★ {stampLabel} ★
            </div>
          </motion.div>

          <div className="text-base md:text-xl font-mono text-amber-300 font-black uppercase tracking-widest pt-1">
            {dismissalLabel}
          </div>
        </div>

        {/* HERO WICKET RECAP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* DISMISSED BATSMAN RECAP CARD (Cols 1-6) */}
          <div className="md:col-span-6 bg-slate-900/90 border border-white/10 rounded-3xl p-6 flex items-start gap-4 relative overflow-hidden shadow-xl">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-950 border-2 border-rose-500/60 overflow-hidden shrink-0 flex items-center justify-center">
              {batterPhoto ? (
                <img src={batterPhoto} alt={batterDisplay} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-2xl text-rose-300">{batterDisplay.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-rose-400 font-black uppercase tracking-wider block">
                DISMISSED BATSMAN
              </span>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase truncate">
                {cleanPlayerName(batterDisplay)}
              </h3>
              
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-amber-300 font-mono">
                  {dismissedBatter?.runs ?? 48}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  OFF {dismissedBatter?.balls ?? 28} BALLS
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-3 text-xs font-mono text-slate-300">
                <span>4s: <strong className="text-sky-400">{dismissedBatter?.fours ?? 5}</strong></span>
                <span>•</span>
                <span>6s: <strong className="text-amber-400">{dismissedBatter?.sixes ?? 3}</strong></span>
                <span>•</span>
                <span>SR: <strong className="text-white">
                  {dismissedBatter && dismissedBatter.balls > 0 
                    ? ((dismissedBatter.runs / dismissedBatter.balls) * 100).toFixed(1) 
                    : '171.4'}
                </strong></span>
              </div>
            </div>
          </div>

          {/* BOWLER SPELL & FALL OF WICKET (Cols 7-12) */}
          <div className="md:col-span-6 flex flex-col gap-4">
            
            {/* Bowler Wicket Tally */}
            <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">SUCCESSFUL BOWLER</span>
                <h4 className="text-lg font-black text-white uppercase">{cleanPlayerName(bowlerDisplay)}</h4>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {activeBowler ? `${activeBowler.wickets}/${activeBowler.runsConceded}` : '2/18'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">
                  ECON: {activeBowler && activeBowler.ballsBowled > 0 ? ((activeBowler.runsConceded / activeBowler.ballsBowled) * 6).toFixed(2) : '6.4'}
                </span>
              </div>
            </div>

            {/* Fall of Wicket Badge */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">FALL OF WICKET</span>
                <h4 className="text-xl font-black text-amber-300 font-mono">
                  WKT {currentInnings?.wickets ?? 4} • {currentInnings?.runs ?? 114} RUNS
                </h4>
              </div>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold">
                OVERS {Math.floor((currentInnings?.ballsBowled ?? 75) / 6)}.{(currentInnings?.ballsBowled ?? 75) % 6}
              </span>
            </div>

          </div>

        </div>
      </div>
    </ChromaBroadcastContainer>
  );
};

/* =========================================================================
   4. HIGH-IMPACT MATCH EVENT FULL-SCREEN SLATE: MILESTONE (50 / 100)
   ========================================================================= */
export const EventMilestoneSlate: React.FC<{
  match: MatchState;
  onClose?: () => void;
  batsmanName?: string;
  milestone?: 50 | 100;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
}> = ({
  match,
  onClose,
  batsmanName,
  milestone = 50,
  runs,
  balls,
  fours,
  sixes
}) => {
  const [chromaMode, setChromaMode] = useState<ChromaBackgroundMode>('dark');
  const currentInnings = match.currentInningsNum === 1 ? match.innings1 : match.innings2;
  const striker = currentInnings?.batsmen?.find(b => !b.isOut) || currentInnings?.batsmen?.[0];

  const batterDisplay = batsmanName || striker?.name || 'ROHIT SHARMA';
  const batterPhoto = match.playerPhotos?.[batterDisplay] || match.playerPhotos?.[cleanPlayerName(batterDisplay)];

  const runCount = runs ?? striker?.runs ?? (milestone === 100 ? 104 : 52);
  const ballCount = balls ?? striker?.balls ?? (milestone === 100 ? 54 : 29);
  const fourCount = fours ?? striker?.fours ?? (milestone === 100 ? 9 : 5);
  const sixCount = sixes ?? striker?.sixes ?? (milestone === 100 ? 6 : 3);

  useEffect(() => {
    playBroadcastAudio('cheer');
  }, []);

  return (
    <ChromaBroadcastContainer 
      chromaMode={chromaMode} 
      onChromaChange={setChromaMode} 
      onClose={onClose}
      title={`PLAYER MILESTONE (${milestone} RUNS)`}
      autoDismissSecs={8}
    >
      <div className="w-full max-w-5xl bg-slate-950/95 border-2 border-amber-400/60 rounded-[2.5rem] p-6 md:p-8 shadow-[0_25px_90px_rgba(251,191,36,0.6)] backdrop-blur-2xl text-white relative overflow-hidden text-center">
        {/* Gold Confetti Aura */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500" />
        
        {/* MILESTONE BANNER */}
        <div className="space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-black uppercase tracking-widest shadow-[0_0_25px_rgba(251,191,36,0.4)]">
            <Sparkles size={14} className="text-amber-400 animate-spin" />
            ★ STAR TV PRO CELEBRATION SLATE ★
          </div>

          <motion.h1
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 drop-shadow-[0_10px_25px_rgba(251,191,36,0.5)]"
          >
            {milestone === 100 ? 'MAGNIFICENT CENTURY! 100*' : 'BRILLIANT HALF-CENTURY! 50*'}
          </motion.h1>
        </div>

        {/* HERO BATSMAN DETAILS CARD */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-900/80 border border-white/10 rounded-3xl p-6">
          
          <div className="md:col-span-4 flex flex-col items-center">
            <div className="w-28 h-28 rounded-3xl bg-slate-950 border-2 border-amber-400 overflow-hidden shadow-[0_0_30px_rgba(251,191,36,0.4)] flex items-center justify-center mb-3">
              {batterPhoto ? (
                <img src={batterPhoto} alt={batterDisplay} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-3xl text-amber-300">{batterDisplay.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <h3 className="text-xl font-black text-white uppercase">{cleanPlayerName(batterDisplay)}</h3>
            <span className="text-xs font-mono text-amber-400 uppercase font-bold mt-0.5">
              {match.teamA || 'TEAM'} BATTING STAR
            </span>
          </div>

          <div className="md:col-span-8 flex flex-col gap-4">
            {/* Primary Scorecall */}
            <div className="flex items-center justify-center gap-6 bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4">
              <div className="text-center">
                <span className="text-xs font-mono text-slate-400 block uppercase font-bold">RUNS SCORED</span>
                <span className="text-4xl md:text-5xl font-black text-amber-300 font-mono">{runCount}*</span>
              </div>
              <div className="h-12 w-px bg-white/15" />
              <div className="text-center">
                <span className="text-xs font-mono text-slate-400 block uppercase font-bold">BALLS FACED</span>
                <span className="text-3xl md:text-4xl font-black text-white font-mono">{ballCount}</span>
              </div>
              <div className="h-12 w-px bg-white/15" />
              <div className="text-center">
                <span className="text-xs font-mono text-slate-400 block uppercase font-bold">STRIKE RATE</span>
                <span className="text-2xl md:text-3xl font-black text-cyan-300 font-mono">
                  {ballCount > 0 ? ((runCount / ballCount) * 100).toFixed(1) : '180.0'}
                </span>
              </div>
            </div>

            {/* Boundary Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div className="bg-slate-950/70 border border-sky-500/30 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sky-400 font-bold">FOURS HIT (4s):</span>
                <span className="text-xl font-black text-white">{fourCount} ({fourCount * 4} runs)</span>
              </div>
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                <span className="text-amber-400 font-bold">SIXES HIT (6s):</span>
                <span className="text-xl font-black text-white">{sixCount} ({sixCount * 6} runs)</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ChromaBroadcastContainer>
  );
};

/* =========================================================================
   5. HIGH-IMPACT MATCH EVENT FULL-SCREEN SLATE: INNINGS BREAK / TARGET SUMMARY
   ========================================================================= */
export const EventInningsBreakSlate: React.FC<{
  match: MatchState;
  onClose?: () => void;
}> = ({ match, onClose }) => {
  const [chromaMode, setChromaMode] = useState<ChromaBackgroundMode>('dark');
  const inn1 = match.innings1;
  const inn1Runs = inn1?.runs ?? 192;
  const inn1Wickets = inn1?.wickets ?? 5;
  const inn1Balls = inn1?.ballsBowled ?? (match.oversLimit * 6);
  const targetRuns = match.targetRuns || (inn1Runs + 1);
  const oversLimit = match.oversLimit || 20;

  const batTeam = inn1?.battingTeam || match.teamA;
  const bowlTeam = inn1?.bowlingTeam || match.teamB;

  // Find Top Batter and Top Bowler
  const topBatter = (inn1?.batsmen || []).slice().sort((a, b) => b.runs - a.runs)[0];
  const topBowler = (inn1?.bowlers || []).slice().sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0];

  useEffect(() => {
    playBroadcastAudio('impact_boom');
  }, []);

  return (
    <ChromaBroadcastContainer 
      chromaMode={chromaMode} 
      onChromaChange={setChromaMode} 
      onClose={onClose}
      title="INNINGS BREAK & TARGET EQUATION"
      autoDismissSecs={10}
    >
      <div className="w-full max-w-5xl bg-slate-950/95 border border-white/20 rounded-[2.5rem] p-6 md:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white relative overflow-hidden">
        {/* Top Glint Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-amber-300 to-sky-400 opacity-90" />
        
        {/* HEADER */}
        <div className="text-center space-y-2 mb-6">
          <span className="px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-black uppercase tracking-widest">
            ★ INNINGS BREAK • MATCH EQUATION ★
          </span>
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tight">
            {batTeam} POSTS <span className="text-amber-400">{inn1Runs}/{inn1Wickets}</span>
          </h2>
          <span className="text-xs font-mono text-slate-300 uppercase">
            COMPLETED IN {Math.floor(inn1Balls / 6)}.{inn1Balls % 6} OVERS • CRR: {inn1Balls > 0 ? ((inn1Runs / inn1Balls) * 6).toFixed(2) : '9.60'}
          </span>
        </div>

        {/* TARGET EQUATION HERO SLAB */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-3xl p-5 text-slate-950 text-center shadow-[0_0_35px_rgba(251,191,36,0.5)] border-2 border-amber-300 my-4">
          <span className="text-xs font-mono font-black uppercase tracking-widest block text-amber-950">
            CHASING TARGET FOR {bowlTeam.toUpperCase()}
          </span>
          <div className="text-3xl md:text-5xl font-black uppercase tracking-tight mt-1">
            NEED {targetRuns} RUNS TO WIN
          </div>
          <div className="text-sm font-mono font-black uppercase mt-1">
            REQUIRED RUN RATE: {((targetRuns / oversLimit)).toFixed(2)} RUNS PER OVER (OFF {oversLimit * 6} BALLS)
          </div>
        </div>

        {/* TOP PERFORMERS OF 1ST INNINGS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Top Batter */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block">TOP BATSMAN</span>
              <h4 className="text-lg font-black text-white uppercase">{cleanPlayerName(topBatter?.name || 'Top Batter')}</h4>
              <span className="text-xs font-mono text-slate-400">
                {topBatter?.fours ?? 6} Fours • {topBatter?.sixes ?? 3} Sixes
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-300 font-mono">{topBatter?.runs ?? 68}</span>
              <span className="text-xs font-mono text-slate-400 block">OFF {topBatter?.balls ?? 38}b</span>
            </div>
          </div>

          {/* Top Bowler */}
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-sky-400 uppercase font-bold block">TOP BOWLER</span>
              <h4 className="text-lg font-black text-white uppercase">{cleanPlayerName(topBowler?.name || 'Top Bowler')}</h4>
              <span className="text-xs font-mono text-slate-400">
                {Math.floor((topBowler?.ballsBowled ?? 24) / 6)} Overs Bowled
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {topBowler?.wickets ?? 2}/{topBowler?.runsConceded ?? 28}
              </span>
              <span className="text-xs font-mono text-slate-400 block">
                ECON: {topBowler && topBowler.ballsBowled > 0 ? ((topBowler.runsConceded / topBowler.ballsBowled) * 6).toFixed(2) : '7.0'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </ChromaBroadcastContainer>
  );
};

/* =========================================================================
   6. STAR TV DUAL CAPTAINS FACE-OFF & VERSUS ("CLASH OF TITANS")
   ========================================================================= */
export const StarTVCaptainsFaceoff: React.FC<{
  match: MatchState;
  onClose?: () => void;
}> = ({ match, onClose }) => {
  const [chromaMode, setChromaMode] = useState<ChromaBackgroundMode>('dark');
  const teamA = match.teamA || 'TEAM A';
  const teamB = match.teamB || 'TEAM B';
  const captA = match.teamACaptain || 'Captain A';
  const captB = match.teamBCaptain || 'Captain B';

  const captAPhoto = match.playerPhotos?.[captA] || match.playerPhotos?.[cleanPlayerName(captA)];
  const captBPhoto = match.playerPhotos?.[captB] || match.playerPhotos?.[cleanPlayerName(captB)];

  useEffect(() => {
    playBroadcastAudio('stinger_whoosh');
  }, []);

  return (
    <ChromaBroadcastContainer
      chromaMode={chromaMode}
      onChromaChange={setChromaMode}
      onClose={onClose}
      title="CLASH OF TITANS: CAPTAINS FACE-OFF"
      autoDismissSecs={12}
    >
      <div className="w-full max-w-6xl bg-slate-950/95 border border-white/20 rounded-[2.5rem] p-6 md:p-8 shadow-[0_25px_90px_rgba(0,0,0,0.95)] backdrop-blur-2xl text-white relative overflow-hidden">
        {/* Top Glint Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-amber-400 to-yellow-500" />
        
        {/* TOP BANNER */}
        <div className="text-center space-y-2 mb-6">
          <span className="px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-xs font-black uppercase tracking-widest">
            ★ STAR TV PRO FEATURE • CLASH OF TITANS ★
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
            CAPTAINS HEAD-TO-HEAD DUEL
          </h1>
          <span className="text-xs font-mono text-slate-300 uppercase">
            {match.tournamentName || 'INDIAN PREMIER LEAGUE 2026'} • MATCH FACE-OFF
          </span>
        </div>

        {/* 3-COLUMN HERO DUAL FACE-OFF */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* CAPTAIN A CARD (Cols 1-5) */}
          <motion.div 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-5 bg-slate-900/80 border-2 border-sky-500/40 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-2xl"
          >
            <div className="w-32 h-32 rounded-3xl bg-slate-950 border-2 border-sky-400 overflow-hidden shadow-[0_0_35px_rgba(56,189,248,0.4)] flex items-center justify-center mb-3">
              {captAPhoto ? (
                <img src={captAPhoto} alt={captA} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-4xl text-sky-400">{captA.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <span className="text-[11px] font-mono text-sky-400 font-black uppercase tracking-widest">
              CAPTAIN • {teamA}
            </span>
            <h3 className="text-2xl font-black text-white uppercase mt-1 leading-tight">
              {cleanPlayerName(captA)}
            </h3>

            <div className="w-full mt-4 pt-4 border-t border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>H2H ENCOUNTERS WON:</span>
                <strong className="text-white">18 WINS</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>CAREER T20 RUNS:</span>
                <strong className="text-amber-400">4,820 RUNS</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>T20 STRIKE RATE:</span>
                <strong className="text-sky-400">146.5 SR</strong>
              </div>
            </div>
          </motion.div>

          {/* CENTRAL 3D VS EMBLEM (Cols 6-7) */}
          <div className="md:col-span-2 flex flex-col items-center justify-center my-2 md:my-0">
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 border-4 border-slate-950 flex flex-col items-center justify-center shadow-[0_0_45px_rgba(251,191,36,0.8)] text-slate-950"
            >
              <Swords size={28} className="text-slate-950" />
              <span className="font-black text-xs uppercase tracking-widest font-mono">VS</span>
            </motion.div>
            <span className="text-[10px] font-mono text-amber-400 font-black uppercase tracking-wider mt-2">
              CLASH OF TITANS
            </span>
          </div>

          {/* CAPTAIN B CARD (Cols 8-12) */}
          <motion.div 
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-5 bg-slate-900/80 border-2 border-amber-500/40 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden shadow-2xl"
          >
            <div className="w-32 h-32 rounded-3xl bg-slate-950 border-2 border-amber-400 overflow-hidden shadow-[0_0_35px_rgba(251,191,36,0.4)] flex items-center justify-center mb-3">
              {captBPhoto ? (
                <img src={captBPhoto} alt={captB} className="w-full h-full object-cover" />
              ) : (
                <span className="font-black text-4xl text-amber-400">{captB.slice(0, 2).toUpperCase()}</span>
              )}
            </div>

            <span className="text-[11px] font-mono text-amber-400 font-black uppercase tracking-widest">
              CAPTAIN • {teamB}
            </span>
            <h3 className="text-2xl font-black text-white uppercase mt-1 leading-tight">
              {cleanPlayerName(captB)}
            </h3>

            <div className="w-full mt-4 pt-4 border-t border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>H2H ENCOUNTERS WON:</span>
                <strong className="text-white">14 WINS</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>CAREER T20 RUNS:</span>
                <strong className="text-amber-400">5,140 RUNS</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>T20 STRIKE RATE:</span>
                <strong className="text-sky-400">142.8 SR</strong>
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </ChromaBroadcastContainer>
  );
};
