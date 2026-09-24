import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Zap, Flame, X, Trophy, Award, Gauge, Compass } from 'lucide-react';

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
  
  // 1. Broadcast Visual & Design Enhancements
  sponsorName?: string;
  sponsorLogoUrl?: string;
  sponsorTagline?: string;
  boundarySponsorFour?: string;
  boundarySponsorSix?: string;
  distance?: string;
  speed?: string;
  shotZone?: string;
  isMilestone?: boolean;
  milestoneText?: string;
  showDistance?: boolean;
  showMilestones?: boolean;
}

// Web Audio synthesizer for live broadcast boundary & milestone sound effects
function playBoundaryCounterAudio(type: 'four' | 'six' | 'milestone') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'milestone') {
      // Grand celebratory fanfare chord arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, start + 0.35);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.85);
      });
    } else if (type === 'four') {
      // Crisp 2-tone energetic chime for 4s
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

// ---------------------------------------------------------------------------
// High-Production Mechanical / Digital Rolling Odometer Digit
// ---------------------------------------------------------------------------
const OdometerDigit: React.FC<{ digit: string; isHighlighted?: boolean }> = ({ digit, isHighlighted }) => {
  const num = parseInt(digit, 10);
  if (isNaN(num)) {
    return (
      <span className="font-mono font-black text-xl sm:text-2xl text-slate-900 tracking-tight px-0.5">
        {digit}
      </span>
    );
  }

  // 36px per digit on desktop, 32px on mobile
  const digitHeight = 34;

  return (
    <div
      className="relative inline-block overflow-hidden align-middle select-none mx-[1px]"
      style={{ height: `${digitHeight}px`, width: '18px' }}
    >
      <motion.div
        initial={false}
        animate={{ y: -num * digitHeight }}
        transition={{ type: 'spring', damping: 18, stiffness: 240 }}
        className="flex flex-col items-center absolute left-0 right-0 top-0"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <div
            key={n}
            className={`flex items-center justify-center font-mono font-black text-xl sm:text-2xl tracking-tighter ${
              isHighlighted ? 'text-black font-extrabold' : 'text-slate-900'
            }`}
            style={{
              height: `${digitHeight}px`,
              textShadow: '0 1px 1px rgba(255,255,255,0.85), 0 0 1px rgba(0,0,0,0.5)',
            }}
          >
            {n}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const OdometerNumber: React.FC<{ value: number; isHighlighted?: boolean }> = ({ value, isHighlighted }) => {
  const digits = useMemo(() => String(Math.max(0, value)).split(''), [value]);

  return (
    <div className="flex items-center justify-center relative">
      {digits.map((digit, idx) => (
        <OdometerDigit key={`digit-${idx}-${digits.length}`} digit={digit} isHighlighted={isHighlighted} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Confetti & Particle Burst for Milestone Celebrations
// ---------------------------------------------------------------------------
const MilestoneConfettiBurst: React.FC = () => {
  const particles = useMemo(() => {
    const colors = ['#f59e0b', '#fbbf24', '#06b6d4', '#3b82f6', '#ec4899', '#10b981', '#ffffff'];
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 260,
      y: -50 - Math.random() * 140,
      rotate: Math.random() * 720 - 360,
      scale: 0.6 + Math.random() * 0.8,
      color: colors[i % colors.length],
      shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'square' : 'ribbon',
      duration: 1.2 + Math.random() * 0.8,
      delay: Math.random() * 0.15,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible -z-10 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, p.scale, p.scale * 0.8],
            x: p.x,
            y: p.y + 120, // gravity fall
            rotate: p.rotate,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
          className="absolute"
        >
          {p.shape === 'circle' && (
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
          )}
          {p.shape === 'square' && (
            <div className="w-2.5 h-2.5 rounded-sm shadow-sm" style={{ backgroundColor: p.color }} />
          )}
          {p.shape === 'ribbon' && (
            <div className="w-4 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: p.color }} />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Tournament Boundary Counter Popup Component
// ---------------------------------------------------------------------------
export const TournamentBoundaryCounterPopup: React.FC<TournamentBoundaryCounterPopupProps> = ({
  visible,
  activeType = 'four',
  tournamentName,
  tournamentFours,
  tournamentSixes,
  matchFours,
  matchSixes,
  batterName,
  durationMs = 6000,
  position = 'bottom-right',
  onClose,
  soundEnabled = true,

  // Enhancements
  sponsorName,
  sponsorLogoUrl,
  sponsorTagline,
  boundarySponsorFour,
  boundarySponsorSix,
  distance,
  speed,
  shotZone,
  isMilestone: propIsMilestone,
  milestoneText: propMilestoneText,
  showDistance = true,
  showMilestones = true,
}) => {
  const [progress, setProgress] = useState<number>(100);
  const [shineKey, setShineKey] = useState<number>(0);

  // Compute if current count is a milestone
  const currentCount = activeType === 'six' ? tournamentSixes : tournamentFours;
  const computedMilestone = useMemo(() => {
    if (!showMilestones) return null;
    if (propIsMilestone && propMilestoneText) {
      return { isMilestone: true, text: propMilestoneText };
    }
    // Check landmark increments (every 25, 50, 100)
    if (currentCount > 0 && (currentCount % 25 === 0 || currentCount === 10 || currentCount === 50 || currentCount === 100 || currentCount === 250 || currentCount === 500)) {
      const typeLabel = activeType === 'six' ? 'SIX' : 'FOUR';
      return {
        isMilestone: true,
        text: `🎉 ${currentCount}th ${typeLabel} OF THE TOURNAMENT!`,
      };
    }
    return null;
  }, [showMilestones, propIsMilestone, propMilestoneText, currentCount, activeType]);

  const isCelebration = Boolean(computedMilestone?.isMilestone);

  // Trigger metallic sweep & audio chime
  useEffect(() => {
    if (visible && activeType && soundEnabled) {
      if (isCelebration) {
        playBoundaryCounterAudio('milestone');
      } else {
        playBoundaryCounterAudio(activeType);
      }
      setShineKey((k) => k + 1);
    }
  }, [visible, activeType, isCelebration, soundEnabled]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!visible) {
      setProgress(100);
      return;
    }

    const effectiveDuration = isCelebration ? Math.max(durationMs, 7500) : durationMs;
    const interval = 50;
    const step = (interval / effectiveDuration) * 100;

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
  }, [visible, durationMs, isCelebration, onClose]);

  const displayName = useMemo(() => {
    if (tournamentName && tournamentName.trim().length > 0) {
      return tournamentName.trim().toUpperCase();
    }
    return 'KARJAT BIG BASH LEAGUE';
  }, [tournamentName]);

  // Active sponsor label for 4s or 6s
  const activeSponsorLabel = useMemo(() => {
    if (activeType === 'six') {
      return boundarySponsorSix || (sponsorName ? `${sponsorName} MAXIMUM 6s` : 'CRED POWER 6s');
    }
    return boundarySponsorFour || (sponsorName ? `${sponsorName} FOURS` : 'PAYTM MAXIMUM 4s');
  }, [activeType, boundarySponsorFour, boundarySponsorSix, sponsorName]);

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
          initial={{ opacity: 0, y: 40, scale: 0.88, rotateX: 18 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 30, scale: 0.92, transition: { duration: 0.25 } }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className={`absolute z-50 select-none ${positionClasses} pointer-events-auto`}
          style={{ perspective: 1200 }}
        >
          {/* Milestone Confetti burst */}
          {isCelebration && <MilestoneConfettiBurst />}

          {/* Active Boundary Stinger Ambient Glow Flare */}
          {activeType === 'four' && (
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 blur-lg opacity-75 animate-pulse -z-10" />
          )}
          {activeType === 'six' && (
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-rose-500 blur-xl opacity-85 animate-pulse -z-10" />
          )}
          {isCelebration && (
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-purple-500 blur-xl opacity-90 animate-ping -z-20" />
          )}

          {/* Main Card Container */}
          <div className="w-[310px] sm:w-[350px] rounded-2xl overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.9)] border-2 border-amber-400/80 bg-[#001064] text-white backdrop-blur-md">
            
            {/* 1. SPONSOR / CO-BRANDING HEADER STRIP */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 px-3 py-1 border-b border-blue-900/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                {sponsorLogoUrl ? (
                  <img
                    src={sponsorLogoUrl}
                    alt={sponsorName || 'Sponsor'}
                    className="h-3.5 object-contain rounded bg-white/10 px-1"
                  />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
                <span className="text-[8.5px] font-black tracking-wider text-amber-300 uppercase truncate">
                  ⚡ {activeSponsorLabel}
                </span>
              </div>

              {sponsorTagline && (
                <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px]">
                  {sponsorTagline}
                </span>
              )}
            </div>

            {/* 2. CELEBRATION MILESTONE BANNER (Conditional) */}
            {isCelebration && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 px-3 py-1.5 text-center border-b-2 border-yellow-200 text-slate-950 shadow-inner flex items-center justify-center gap-1.5"
              >
                <Award size={14} className="text-slate-950 animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {computedMilestone?.text}
                </span>
                <Sparkles size={14} className="text-slate-950 animate-spin" />
              </motion.div>
            )}

            {/* 3. TOURNAMENT TITLE & EVENT HEADER (Royal Blue Beveled Broadcast Banner) */}
            <div className="relative bg-gradient-to-b from-[#0b2ee0] via-[#051ea8] to-[#021379] px-4 py-2 border-b-2 border-blue-950">
              {/* Metallic top-edge specular glint */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-80" />
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center text-center">
                  <Trophy size={14} className="text-yellow-300 shrink-0 hidden sm:inline-block animate-bounce" />
                  <span className="font-sans font-black text-xs sm:text-sm tracking-wide text-white uppercase truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {displayName}
                  </span>
                </div>

                {/* Dismiss Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Dismiss Counter"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Sub-pill: Event & Batter Attribution */}
              {activeType && (
                <div className="mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                      activeType === 'four'
                        ? 'bg-cyan-400 text-slate-950 animate-pulse'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 animate-pulse'
                    }`}
                  >
                    {activeType === 'four' ? (
                      <>
                        <Zap size={11} className="fill-current" />
                        <span>BOUNDARY FOUR!</span>
                      </>
                    ) : (
                      <>
                        <Flame size={11} className="fill-current" />
                        <span>MAXIMUM SIX!</span>
                      </>
                    )}
                  </span>

                  {batterName && (
                    <span className="text-[10px] font-bold text-white/95 truncate max-w-[150px] drop-shadow-sm">
                      by <strong className="text-amber-300 font-black">{batterName}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* 4. DISTANCE & SHOT VELOCITY BADGE (Broadcasting Stat Tag) */}
              {showDistance && (distance || speed || shotZone) && (
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-lg bg-black/50 border border-white/20 text-[9px] font-mono font-bold text-amber-300 shadow-inner">
                    {distance && (
                      <span className="flex items-center gap-1">
                        <Compass size={10} className="text-cyan-400" />
                        <span>{distance}</span>
                      </span>
                    )}
                    {distance && speed && <span className="text-white/40">•</span>}
                    {speed && (
                      <span className="flex items-center gap-1 text-rose-300">
                        <Gauge size={10} className="text-rose-400" />
                        <span>{speed}</span>
                      </span>
                    )}
                    {shotZone && (
                      <>
                        <span className="text-white/40">•</span>
                        <span className="text-emerald-300 uppercase tracking-tight">{shotZone}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 5. TABULAR BODY: High-Fidelity Odometer Rows (Reference Design) */}
            <div className="flex flex-col divide-y-2 divide-blue-950 bg-slate-950">
              
              {/* ROW 1: FOURS */}
              <div
                className={`flex items-stretch relative transition-all duration-300 ${
                  activeType === 'four' ? 'ring-2 ring-cyan-400 ring-inset z-10' : ''
                }`}
              >
                {/* Left Label Cell: Royal Blue Gradient with High Contrast Text */}
                <div className="w-[50%] px-4 py-2.5 bg-gradient-to-r from-[#4d70eb] via-[#6587f7] to-[#4d70eb] flex items-center justify-between border-r-2 border-blue-950 relative overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-sm sm:text-base tracking-wider text-black uppercase drop-shadow-sm">
                      FOURS
                    </span>
                  </div>
                  {activeType === 'four' && (
                    <span className="text-[10px] font-black bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded uppercase animate-ping">
                      +1
                    </span>
                  )}
                </div>

                {/* Right Count Cell: Brushed Silver Metallic Odometer Plate */}
                <div className="w-[50%] px-4 py-2 bg-gradient-to-r from-[#c0c5cd] via-[#f0f2f5] to-[#b8bdc7] flex items-center justify-center relative overflow-hidden shadow-inner">
                  {/* Subtle top/bottom metallic bevel bevel shadow */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-white/70" />
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/20" />
                  
                  {/* Dynamic Metallic Reflection Sweep on Increment */}
                  {activeType === 'four' && (
                    <motion.div
                      key={`shine-four-${shineKey}`}
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 pointer-events-none"
                    />
                  )}

                  {/* Rolling mechanical odometer digit display */}
                  <OdometerNumber value={tournamentFours} isHighlighted={activeType === 'four'} />
                </div>
              </div>

              {/* ROW 2: SIXES */}
              <div
                className={`flex items-stretch relative transition-all duration-300 ${
                  activeType === 'six' ? 'ring-2 ring-amber-400 ring-inset z-10' : ''
                }`}
              >
                {/* Left Label Cell: Royal Blue Gradient with High Contrast Text */}
                <div className="w-[50%] px-4 py-2.5 bg-gradient-to-r from-[#4d70eb] via-[#6587f7] to-[#4d70eb] flex items-center justify-between border-r-2 border-blue-950 relative overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-sans font-black text-sm sm:text-base tracking-wider text-black uppercase drop-shadow-sm">
                      SIXES
                    </span>
                  </div>
                  {activeType === 'six' && (
                    <span className="text-[10px] font-black bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded uppercase animate-ping">
                      +1
                    </span>
                  )}
                </div>

                {/* Right Count Cell: Brushed Silver Metallic Odometer Plate */}
                <div className="w-[50%] px-4 py-2 bg-gradient-to-r from-[#c0c5cd] via-[#f0f2f5] to-[#b8bdc7] flex items-center justify-center relative overflow-hidden shadow-inner">
                  {/* Subtle top/bottom metallic bevel bevel shadow */}
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-white/70" />
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-black/20" />

                  {/* Dynamic Metallic Reflection Sweep on Increment */}
                  {activeType === 'six' && (
                    <motion.div
                      key={`shine-six-${shineKey}`}
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                      className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-12 pointer-events-none"
                    />
                  )}

                  {/* Rolling mechanical odometer digit display */}
                  <OdometerNumber value={tournamentSixes} isHighlighted={activeType === 'six'} />
                </div>
              </div>

            </div>

            {/* 6. MATCH BOUNDARY SUB-STRIP */}
            {(matchFours !== undefined || matchSixes !== undefined) && (
              <div className="bg-[#020b3b] px-3.5 py-1.5 flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 border-t border-blue-900/70">
                <span className="uppercase text-slate-400 flex items-center gap-1">
                  <span>Match Boundaries:</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-cyan-300">
                    4s: <strong className="text-white font-black">{matchFours ?? 0}</strong>
                  </span>
                  <span className="text-amber-300">
                    6s: <strong className="text-white font-black">{matchSixes ?? 0}</strong>
                  </span>
                </div>
              </div>
            )}

            {/* 7. COUNTDOWN AUTO-DISMISS PROGRESS BAR */}
            <div className="h-1.5 w-full bg-blue-950 overflow-hidden">
              <motion.div
                className={`h-full ${
                  isCelebration
                    ? 'bg-gradient-to-r from-amber-400 via-pink-400 to-yellow-300'
                    : activeType === 'six'
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
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
