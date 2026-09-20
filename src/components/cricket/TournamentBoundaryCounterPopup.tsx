import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Flame, X, Trophy } from 'lucide-react';

export interface TournamentBoundaryCounterPopupProps {
  visible: boolean;
  activeType?: 'four' | 'six' | null;
  tournamentName?: string;
  tournamentFours: number;
  tournamentSixes: number;
  matchFours?: number;
  matchSixes?: number;
  batterName?: string;
  durationMs?: number;
  position?: 'bottom-right' | 'bottom-center' | 'top-right' | 'top-left';
  onClose: () => void;
  soundEnabled?: boolean;
}

// Web Audio synthesizer for live broadcast boundary sound effect
function playBoundaryCounterAudio(type: 'four' | 'six') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'four') {
      // Crisp 2-tone energetic chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.18); // C6
      osc2.frequency.setValueAtTime(1318.5, now); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } else {
      // Powerful 3-tone arpeggio fanfare for SIX
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = now + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.2, noteStart + 0.25);

        gain.gain.setValueAtTime(0.25, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.5);
      });
    }
  } catch (_) {}
}

export const TournamentBoundaryCounterPopup: React.FC<TournamentBoundaryCounterPopupProps> = ({
  visible,
  activeType = 'four',
  tournamentName,
  tournamentFours,
  tournamentSixes,
  matchFours,
  matchSixes,
  batterName,
  durationMs = 5500,
  position = 'bottom-right',
  onClose,
  soundEnabled = true,
}) => {
  const [progress, setProgress] = useState<number>(100);

  // Play broadcast audio chime on trigger
  useEffect(() => {
    if (visible && activeType && soundEnabled) {
      playBoundaryCounterAudio(activeType);
    }
  }, [visible, activeType, soundEnabled]);

  // Auto-dismiss timer with progress countdown
  useEffect(() => {
    if (!visible) {
      setProgress(100);
      return;
    }

    const interval = 50;
    const step = (interval / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [visible, durationMs, onClose]);

  const displayName = useMemo(() => {
    if (tournamentName && tournamentName.trim().length > 0) {
      return tournamentName.trim().toUpperCase();
    }
    return 'KARJAT BIG BASH LEAGUE';
  }, [tournamentName]);

  // Position classes
  const positionClasses = useMemo(() => {
    switch (position) {
      case 'bottom-center':
        return 'bottom-[130px] sm:bottom-[150px] left-1/2 -translate-x-1/2';
      case 'top-right':
        return 'top-8 right-8';
      case 'top-left':
        return 'top-8 left-8';
      case 'bottom-right':
      default:
        return 'bottom-[130px] sm:bottom-[150px] right-6 sm:right-10';
    }
  }, [position]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="tournament-boundary-counter-popup"
          initial={{ opacity: 0, y: 35, scale: 0.9, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 25, scale: 0.92, transition: { duration: 0.25 } }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className={`absolute z-50 select-none ${positionClasses} pointer-events-auto`}
          style={{ perspective: 1000 }}
        >
          {/* Active Boundary Stinger Flare */}
          {activeType === 'four' && (
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 blur-md opacity-75 animate-pulse -z-10" />
          )}
          {activeType === 'six' && (
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-rose-500 blur-md opacity-85 animate-pulse -z-10" />
          )}

          {/* Main Card Container */}
          <div className="w-[300px] sm:w-[340px] rounded-xl overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.85)] border-2 border-blue-950 bg-[#001064] text-white">
            
            {/* TOP HEADER: Royal Blue Beveled Banner (Matches Reference Image) */}
            <div className="relative bg-gradient-to-b from-[#0b2ee0] via-[#051ea8] to-[#021379] px-4 py-2 border-b-2 border-blue-950">
              {/* Subtle top edge metallic shine */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-60" />
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center text-center">
                  <Trophy size={14} className="text-yellow-300 shrink-0 hidden sm:inline-block animate-bounce" />
                  <span className="font-sans font-black text-xs sm:text-sm tracking-wide text-white uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {displayName}
                  </span>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  title="Dismiss Counter"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Sub-pill if specific boundary triggered */}
              {activeType && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      activeType === 'four'
                        ? 'bg-cyan-400 text-slate-950 animate-pulse'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 animate-pulse'
                    }`}
                  >
                    {activeType === 'four' ? (
                      <>
                        <Zap size={11} className="fill-current" />
                        <span>BOUNDARY FOUR HIT!</span>
                      </>
                    ) : (
                      <>
                        <Flame size={11} className="fill-current" />
                        <span>MAXIMUM SIX HIT!</span>
                      </>
                    )}
                  </span>
                  {batterName && (
                    <span className="text-[10px] font-bold text-white/90 truncate max-w-[150px]">
                      by {batterName}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* TABULAR BODY: Split Rows for FOURS and SIXES (Exact Reference Aesthetic) */}
            <div className="flex flex-col divide-y-2 divide-blue-950 bg-slate-900">
              
              {/* ROW 1: FOURS */}
              <div
                className={`flex items-stretch relative transition-all duration-300 ${
                  activeType === 'four' ? 'ring-2 ring-cyan-400 ring-inset z-10' : ''
                }`}
              >
                {/* Left Label Cell: Blue Gradient with Dark Text */}
                <div className="w-[52%] px-4 py-2.5 bg-gradient-to-r from-[#4d70eb] via-[#6587f7] to-[#4d70eb] flex items-center justify-between border-r-2 border-blue-950">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-black text-sm sm:text-base tracking-wider text-black uppercase drop-shadow-sm">
                      FOURS
                    </span>
                  </div>
                  {activeType === 'four' && (
                    <span className="text-[10px] font-black bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded uppercase animate-ping">
                      +1
                    </span>
                  )}
                </div>

                {/* Right Count Cell: Silver Metallic Brushed Gradient with Dark Text */}
                <div className="w-[48%] px-4 py-2.5 bg-gradient-to-r from-[#d2d6dc] via-[#f3f4f6] to-[#c9ced7] flex items-center justify-center relative overflow-hidden">
                  {/* Subtle metallic reflection bar */}
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/60 to-transparent" />
                  
                  <motion.span
                    key={`fours-${tournamentFours}`}
                    initial={{ scale: activeType === 'four' ? 1.4 : 1, y: activeType === 'four' ? -4 : 0 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className="font-mono font-black text-xl sm:text-2xl text-black tracking-tight drop-shadow-sm"
                  >
                    {tournamentFours}
                  </motion.span>
                </div>
              </div>

              {/* ROW 2: SIXES */}
              <div
                className={`flex items-stretch relative transition-all duration-300 ${
                  activeType === 'six' ? 'ring-2 ring-amber-400 ring-inset z-10' : ''
                }`}
              >
                {/* Left Label Cell: Blue Gradient with Dark Text */}
                <div className="w-[52%] px-4 py-2.5 bg-gradient-to-r from-[#4d70eb] via-[#6587f7] to-[#4d70eb] flex items-center justify-between border-r-2 border-blue-950">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-black text-sm sm:text-base tracking-wider text-black uppercase drop-shadow-sm">
                      SIXES
                    </span>
                  </div>
                  {activeType === 'six' && (
                    <span className="text-[10px] font-black bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded uppercase animate-ping">
                      +1
                    </span>
                  )}
                </div>

                {/* Right Count Cell: Silver Metallic Brushed Gradient with Dark Text */}
                <div className="w-[48%] px-4 py-2.5 bg-gradient-to-r from-[#d2d6dc] via-[#f3f4f6] to-[#c9ced7] flex items-center justify-center relative overflow-hidden">
                  {/* Subtle metallic reflection bar */}
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-white/60 to-transparent" />
                  
                  <motion.span
                    key={`sixes-${tournamentSixes}`}
                    initial={{ scale: activeType === 'six' ? 1.4 : 1, y: activeType === 'six' ? -4 : 0 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className="font-mono font-black text-xl sm:text-2xl text-black tracking-tight drop-shadow-sm"
                  >
                    {tournamentSixes}
                  </motion.span>
                </div>
              </div>

            </div>

            {/* Match Boundary Sub-Strip (If available) */}
            {(matchFours !== undefined || matchSixes !== undefined) && (
              <div className="bg-[#020b3b] px-3 py-1 flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 border-t border-blue-900/70">
                <span className="uppercase text-slate-400">Match Boundaries:</span>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-300">4s: <strong className="text-white">{matchFours ?? 0}</strong></span>
                  <span className="text-amber-300">6s: <strong className="text-white">{matchSixes ?? 0}</strong></span>
                </div>
              </div>
            )}

            {/* Countdown Progress Bar */}
            <div className="h-1 w-full bg-blue-950 overflow-hidden">
              <motion.div
                className={`h-full ${
                  activeType === 'six' ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
