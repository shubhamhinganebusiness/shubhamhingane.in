import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, Zap, AlertTriangle, Trophy, Crown, Flame, 
  Target, Sparkles, Volume2, VolumeX, ShieldAlert, 
  CheckCircle2, XCircle, Siren, Compass, Award, Flag
} from 'lucide-react';

export type StingerAnimationType =
  | 'six'
  | 'four'
  | 'wicket'
  | 'bowled'
  | 'caught'
  | 'run_out'
  | 'lbw'
  | 'stumped'
  | 'free_hit'
  | 'hat_trick_ball'
  | 'hat_trick'
  | 'one_tip_hand'
  | 'lost_ball'
  | 'car_hit'
  | 'fifty'
  | 'hundred'
  | 'super_over';

export interface StingerMetadata {
  batterName?: string;
  bowlerName?: string;
  fielderName?: string;
  howOut?: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  strikeRate?: string;
  speed?: string;
  distance?: string;
  customText?: string;
}

export interface CricketOverlayAnimationsProps {
  activeAnimation: StingerAnimationType | string | null;
  metadata?: StingerMetadata;
  soundEnabled?: boolean;
  onAnimationComplete: () => void;
}

// =========================================================================
// PURE WEB AUDIO SYNTHESIZER FOR LIVE TV STINGERS (No external audio files needed)
// =========================================================================
function playStingerSynthesizer(type: string) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'six') {
      // Powerful bass impact followed by a rising rocket whistle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (type === 'four') {
      // High-speed whip crack and laser sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'bowled' || type === 'wicket') {
      // Heavy timber crash: low boom + high frequency wood snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'free_hit' || type === 'hat_trick_ball') {
      // High-low alarm siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      osc.frequency.linearRampToValueAtTime(650, now + 0.3);
      osc.frequency.linearRampToValueAtTime(950, now + 0.45);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'lbw') {
      // Three rapid radar beeps + buzzer
      [0, 0.15, 0.3].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880 + idx * 220, now + delay);
        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
    } else if (type === 'fifty' || type === 'hundred' || type === 'hat_trick') {
      // Ascending triumphant trumpet fanfare
      [0, 0.12, 0.24, 0.42].forEach((delay, idx) => {
        const freqs = [392, 523.25, 659.25, 783.99]; // G, C, E, G
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freqs[idx], now + delay);
        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
      });
    }
  } catch (_) {}
}

export const CricketOverlayAnimations: React.FC<CricketOverlayAnimationsProps> = ({
  activeAnimation,
  metadata,
  soundEnabled = true,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<number>(0);

  // Normalize animation type (handle legacy or custom cases)
  const normalizedType = useMemo<StingerAnimationType | null>(() => {
    if (!activeAnimation) return null;
    const lower = activeAnimation.toLowerCase().trim();
    if (lower === 'six' || lower === 'maximum') return 'six';
    if (lower === 'four' || lower === 'boundary') return 'four';
    if (lower === 'bowled') return 'bowled';
    if (lower === 'caught') return 'caught';
    if (lower === 'run_out' || lower === 'runout' || lower === 'run out') return 'run_out';
    if (lower === 'lbw') return 'lbw';
    if (lower === 'stumped') return 'stumped';
    if (lower === 'wicket' || lower === 'out') return 'wicket';
    if (lower === 'free_hit' || lower === 'freehit' || lower === 'free hit') return 'free_hit';
    if (lower === 'hat_trick_ball' || lower === 'hattrickball') return 'hat_trick_ball';
    if (lower === 'hat_trick' || lower === 'hattrick') return 'hat_trick';
    if (lower === 'one_tip_hand' || lower === 'onetiponehand' || lower === 'one tip one hand') return 'one_tip_hand';
    if (lower === 'lost_ball' || lower === 'ball_in_house' || lower === 'lost ball') return 'lost_ball';
    if (lower === 'car_hit' || lower === 'car hit') return 'car_hit';
    if (lower === 'fifty' || lower === '50') return 'fifty';
    if (lower === 'hundred' || lower === '100' || lower === 'century') return 'hundred';
    if (lower === 'super_over' || lower === 'superover') return 'super_over';
    return 'wicket';
  }, [activeAnimation]);

  // Trigger phase sequencing and sound
  useEffect(() => {
    if (!normalizedType) {
      setPhase(0);
      return;
    }

    setPhase(1);

    if (soundEnabled) {
      playStingerSynthesizer(normalizedType);
    }

    const timers: NodeJS.Timeout[] = [];

    // Timing durations:
    // Six / Four: 2.4s
    // Wickets / Dismissals: 3.8s
    // Milestones (50, 100, hat_trick): 4.2s
    // Free hit / Situational: 3.2s
    if (normalizedType === 'six' || normalizedType === 'four') {
      timers.push(setTimeout(() => setPhase(2), 120));
      timers.push(setTimeout(() => setPhase(3), 400));
      timers.push(setTimeout(() => setPhase(4), 850));
      timers.push(setTimeout(() => setPhase(5), 1900)); // Outro fade
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 2400));
    } else if (
      normalizedType === 'bowled' ||
      normalizedType === 'caught' ||
      normalizedType === 'run_out' ||
      normalizedType === 'lbw' ||
      normalizedType === 'stumped' ||
      normalizedType === 'wicket' ||
      normalizedType === 'one_tip_hand' ||
      normalizedType === 'lost_ball' ||
      normalizedType === 'car_hit'
    ) {
      timers.push(setTimeout(() => setPhase(2), 200));
      timers.push(setTimeout(() => setPhase(3), 600));
      timers.push(setTimeout(() => setPhase(4), 1400));
      timers.push(setTimeout(() => setPhase(5), 3200)); // Outro fade
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 3800));
    } else if (normalizedType === 'fifty' || normalizedType === 'hundred' || normalizedType === 'hat_trick') {
      timers.push(setTimeout(() => setPhase(2), 200));
      timers.push(setTimeout(() => setPhase(3), 700));
      timers.push(setTimeout(() => setPhase(4), 1600));
      timers.push(setTimeout(() => setPhase(5), 3600));
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 4200));
    } else {
      // Free hit, Hat-trick ball, Super over
      timers.push(setTimeout(() => setPhase(2), 150));
      timers.push(setTimeout(() => setPhase(3), 500));
      timers.push(setTimeout(() => setPhase(4), 1100));
      timers.push(setTimeout(() => setPhase(5), 2600));
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 3200));
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [normalizedType, soundEnabled, onAnimationComplete]);

  if (!normalizedType) return null;

  // Particle Generators
  const renderGoldSparks = (count = 28) => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i * 360) / count;
      const distance = 130 + Math.random() * 200;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance;
      const size = 6 + Math.random() * 14;

      return (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_15px_rgba(253,224,71,0.9)]"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: tx,
            y: ty,
            scale: [0, 1.6, 0],
            opacity: [1, 1, 0],
          }}
          transition={{ duration: 0.9, ease: "easeOut", delay: Math.random() * 0.1 }}
          style={{
            width: size,
            height: size,
            top: '50%',
            left: '50%',
            marginTop: -size / 2,
            marginLeft: -size / 2,
          }}
        />
      );
    });
  };

  const renderSpeedLines = () => {
    return Array.from({ length: 14 }).map((_, i) => {
      const pTop = 8 + i * 7;
      const height = 1 + Math.random() * 3.5;
      const delay = Math.random() * 0.2;
      const duration = 0.4 + Math.random() * 0.3;

      return (
        <motion.div
          key={`speed-${i}`}
          className="absolute bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none opacity-90"
          initial={{ left: "-100%", width: "60%" }}
          animate={{ left: "200%" }}
          transition={{ duration, ease: "easeInOut", delay }}
          style={{
            top: `${pTop}%`,
            height: height,
            boxShadow: `0 0 10px rgba(34, 211, 238, 0.8)`,
          }}
        />
      );
    });
  };

  const renderWoodSplinters = () => {
    return Array.from({ length: 18 }).map((_, i) => {
      const angle = Math.random() * 360;
      const dist = 140 + Math.random() * 260;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * dist;
      const ty = Math.sin(rad) * dist;
      const w = 4 + Math.random() * 6;
      const h = 20 + Math.random() * 35;

      return (
        <motion.div
          key={`splinter-${i}`}
          className="absolute rounded-sm bg-amber-700 pointer-events-none border border-amber-500/40"
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0.5 }}
          animate={{
            x: tx,
            y: ty,
            rotate: 720 + Math.random() * 720,
            opacity: [1, 1, 0],
            scale: [0.5, 1.2, 0.8],
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            width: w,
            height: h,
            top: '55%',
            left: '50%',
            background: 'linear-gradient(to bottom, #d97706, #78350f)',
            boxShadow: '0 0 8px rgba(217, 119, 6, 0.6)'
          }}
        />
      );
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden font-sans select-none pointer-events-auto bg-black/85 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Quick Dismiss Button in top-right for live streamers */}
        <button
          type="button"
          onClick={onAnimationComplete}
          className="absolute top-6 right-8 z-50 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-mono font-bold tracking-wider border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
        >
          <span>✕</span>
          <span className="uppercase text-[10px]">Skip Stinger</span>
        </button>

        {/* =========================================================================
            1. MAXIMUM / SIX ANIMATION STINGER
            ========================================================================= */}
        {normalizedType === 'six' && (
          <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${phase === 5 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {phase >= 1 && renderGoldSparks(36)}

            {/* Glowing Ball Trajectory Arc */}
            {phase >= 2 && (
              <motion.div
                className="absolute w-12 h-12 rounded-full pointer-events-none z-10"
                initial={{ x: "-45vw", y: "40vh", scale: 0.6, opacity: 0 }}
                animate={{
                  x: ["-45vw", "0vw", "48vw"],
                  y: ["40vh", "-35vh", "-60vh"],
                  scale: [0.6, 1.4, 0.4],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                style={{
                  background: "radial-gradient(circle at 35% 35%, #fef08a 0%, #f59e0b 50%, #dc2626 100%)",
                  boxShadow: "0 0 35px #f59e0b, 0 0 60px #ef4444"
                }}
              />
            )}

            {/* Rotating Star Orbit Ring */}
            {phase >= 2 && (
              <motion.div
                className="absolute w-[460px] h-[460px] pointer-events-none flex items-center justify-center"
                initial={{ rotate: 0, scale: 0.7, opacity: 0 }}
                animate={{ rotate: 360, scale: 1, opacity: 1 }}
                transition={{
                  scale: { duration: 0.3 },
                  opacity: { duration: 0.3 },
                  rotate: { repeat: Infinity, duration: 4.5, ease: "linear" }
                }}
              >
                {Array.from({ length: 8 }).map((_, idx) => {
                  const angle = (idx * 360) / 8;
                  const rad = (angle * Math.PI) / 180;
                  const tx = Math.cos(rad) * 210;
                  const ty = Math.sin(rad) * 210;
                  return (
                    <div
                      key={`star-${idx}`}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `calc(50% + ${tx}px)`, top: `calc(50% + ${ty}px)` }}
                    >
                      <Star className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_#fbbf24]" size={32} />
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Giant 3D Impact '6' */}
            {phase >= 2 && (
              <motion.div
                className="text-center z-10"
                initial={{ y: -350, scale: 2.2, opacity: 0 }}
                animate={{
                  y: 0,
                  scale: phase >= 3 ? [1, 1.06, 1] : 1,
                  opacity: 1
                }}
                transition={phase >= 3 ? {
                  scale: { repeat: Infinity, duration: 0.55, ease: "easeInOut" }
                } : {
                  type: "spring",
                  bounce: 0.4,
                  duration: 0.45
                }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-tighter filter"
                  style={{
                    fontSize: 'clamp(190px, 22vw, 340px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FFD700',
                    textShadow: '0 0 25px #FF6B00, 0 0 50px #FF6B00, 0 15px 45px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '7px #000000'
                  }}
                >
                  6
                </h1>
              </motion.div>
            )}

            {/* Stinger Subtitle & Distance Telemetry */}
            {phase >= 3 && (
              <motion.div
                className="absolute bottom-20 z-20 flex flex-col items-center gap-2"
                initial={{ y: 120, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 130, damping: 11 }}
              >
                <div
                  className="font-black text-white text-5xl md:text-7xl uppercase tracking-widest px-8 py-3 rounded-2xl bg-black/75 border-2 border-yellow-500/40 shadow-[0_0_35px_rgba(234,179,8,0.5)]"
                  style={{
                    fontFamily: '"Impact", sans-serif',
                    textShadow: '0 0 20px #eab308, 0 0 40px #f97316'
                  }}
                >
                  MAXIMUM!
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 px-5 py-1.5 rounded-full border border-yellow-400/40 backdrop-blur-md">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="text-sm font-mono font-bold text-yellow-300 uppercase tracking-wider">
                    {metadata?.distance ? `DISTANCE: ${metadata.distance}` : `EST. DISTANCE: 94m • MONSTER HIT!`}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            2. BOUNDARY / FOUR ANIMATION STINGER
            ========================================================================= */}
        {normalizedType === 'four' && (
          <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${phase === 5 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {phase >= 1 && renderSpeedLines()}

            {/* Lightning Bolts */}
            {phase >= 2 && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <motion.div
                    key={`bolt-${idx}`}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 0, 1, 0], scale: [0.8, 1.3, 0.9, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.3 + Math.random() * 0.25 }}
                    style={{
                      left: `${15 + Math.random() * 70}%`,
                      top: `${15 + Math.random() * 70}%`,
                    }}
                  >
                    <Zap className="text-cyan-300 drop-shadow-[0_0_20px_#06b6d4]" size={54} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Number '4' Rocketing In */}
            {phase >= 2 && (
              <motion.div
                className="z-10"
                initial={{ x: -900, rotate: -25, skewX: -15, opacity: 0 }}
                animate={{
                  x: 0,
                  rotate: phase >= 3 ? 0 : -8,
                  skewX: phase >= 3 ? 0 : -8,
                  opacity: 1
                }}
                transition={{ type: "spring", stiffness: 130, damping: 12 }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-tighter"
                  style={{
                    fontSize: 'clamp(210px, 24vw, 360px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#00D4FF',
                    textShadow: '0 0 25px #0080FF, 0 0 55px #0080FF, 0 15px 40px rgba(0,0,0,0.9)',
                    WebkitTextStroke: '7px #00001a'
                  }}
                >
                  4
                </h1>
              </motion.div>
            )}

            {/* Subtitle & Radar Speed Tag */}
            {phase >= 3 && (
              <motion.div
                className="absolute bottom-20 z-20 flex flex-col items-center gap-2"
                initial={{ y: 120, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 12 }}
              >
                <div
                  className="font-black text-white text-5xl md:text-7xl uppercase tracking-widest px-8 py-3 rounded-2xl bg-black/75 border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.5)]"
                  style={{
                    fontFamily: '"Impact", sans-serif',
                    textShadow: '0 0 20px #00BFFF, 0 0 40px #0080FF'
                  }}
                >
                  CRACKING FOUR!
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 via-blue-500/30 to-cyan-500/20 px-5 py-1.5 rounded-full border border-cyan-400/40 backdrop-blur-md">
                  <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="text-sm font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    {metadata?.speed ? `RADAR SPEED: ${metadata.speed}` : `RADAR SPEED: 136 km/h • ROCKET TIMING!`}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            3. CLEAN BOWLED ANIMATION STINGER
            ========================================================================= */}
        {normalizedType === 'bowled' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Flying Wood Splinters */}
            {phase >= 2 && renderWoodSplinters()}

            {/* Flying Stumps & Bails 3D Physics */}
            {phase >= 2 && (
              <div className="absolute w-[360px] h-[320px] top-[45%] z-10 pointer-events-none">
                {/* Off Stump cartwheeling left */}
                <motion.div
                  className="absolute w-5 h-44 rounded-lg"
                  initial={{ rotate: 0, x: 130, y: 0 }}
                  animate={{
                    rotate: [-30, -320],
                    x: [-30, -220],
                    y: [-20, 180],
                    opacity: [1, 0.9, 0]
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #b45309, #78350f)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.5)"
                  }}
                />
                {/* Middle Stump knocked back */}
                <motion.div
                  className="absolute w-5 h-44 rounded-lg"
                  initial={{ rotate: 0, x: 155, y: 0 }}
                  animate={{
                    rotate: [15, 260],
                    x: [10, 40],
                    y: [-40, 200],
                    opacity: [1, 0.9, 0]
                  }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.05 }}
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #b45309, #78350f)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.5)"
                  }}
                />
                {/* Leg Stump spinning right */}
                <motion.div
                  className="absolute w-5 h-44 rounded-lg"
                  initial={{ rotate: 0, x: 180, y: 0 }}
                  animate={{
                    rotate: [40, 390],
                    x: [50, 230],
                    y: [-25, 170],
                    opacity: [1, 0.9, 0]
                  }}
                  transition={{ duration: 1.6, ease: "easeOut", delay: 0.1 }}
                  style={{
                    background: "linear-gradient(90deg, #f59e0b, #b45309, #78350f)",
                    boxShadow: "0 0 20px rgba(245,158,11,0.5)"
                  }}
                />
                {/* Bail 1 flying high */}
                <motion.div
                  className="absolute w-14 h-3.5 bg-red-500 rounded-sm"
                  initial={{ rotate: 0, x: 140, y: -10 }}
                  animate={{
                    rotate: [-180, -960],
                    x: [-20, -250],
                    y: [-120, 220],
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                  style={{
                    background: "radial-gradient(circle, #ef4444 0%, #991b1b 100%)",
                    boxShadow: "0 0 15px #ef4444"
                  }}
                />
                {/* Bail 2 flying right */}
                <motion.div
                  className="absolute w-14 h-3.5 bg-red-500 rounded-sm"
                  initial={{ rotate: 0, x: 170, y: -10 }}
                  animate={{
                    rotate: [180, 1080],
                    x: [40, 270],
                    y: [-140, 200],
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1.35, ease: "easeOut", delay: 0.05 }}
                  style={{
                    background: "radial-gradient(circle, #ef4444 0%, #991b1b 100%)",
                    boxShadow: "0 0 15px #ef4444"
                  }}
                />
              </div>
            )}

            {/* Impact Headline */}
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 4.5, opacity: 0, rotate: -15 }}
                animate={{ scale: [4.5, 0.95, 1], opacity: 1, rotate: -4 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-wide px-4"
                  style={{
                    fontSize: 'clamp(90px, 14vw, 240px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FF2222',
                    textShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 40px #B91C1C, 0 0 80px #7F1D1D',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  BOWLED!
                </h1>
              </motion.div>
            )}

            {/* Subtitle with Dismissal Details */}
            {phase >= 3 && (
              <motion.div
                className="absolute bottom-20 z-30 flex flex-col items-center gap-2"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140 }}
              >
                <div className="font-black text-3xl md:text-5xl px-8 py-3 rounded-2xl bg-black/85 border-2 border-red-600 shadow-[0_0_35px_rgba(239,68,68,0.7)] uppercase tracking-wider text-white">
                  💥 TIMBER SHATTERED! 💥
                </div>
                {(metadata?.batterName || metadata?.bowlerName) && (
                  <div className="bg-red-950/80 border border-red-600/50 px-6 py-2 rounded-full text-base font-bold text-red-200 uppercase tracking-widest font-mono shadow-lg">
                    {metadata.batterName} <span className="text-red-400">b.</span> {metadata.bowlerName || 'Bowler'}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            4. CAUGHT OUT ANIMATION STINGER
            ========================================================================= */}
        {normalizedType === 'caught' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Catch Glove Graphic Impact */}
            {phase >= 2 && (
              <motion.div
                className="absolute z-10 w-44 h-44 rounded-full border-4 border-amber-400/60 bg-amber-500/10 flex items-center justify-center"
                initial={{ scale: 3, opacity: 0, rotate: -45 }}
                animate={{ scale: [3, 0.9, 1], opacity: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ boxShadow: '0 0 50px rgba(245, 158, 11, 0.6)' }}
              >
                <span className="text-8xl">🧤</span>
              </motion.div>
            )}

            {/* Headline */}
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center mt-36"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45 }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-tight"
                  style={{
                    fontSize: 'clamp(80px, 12vw, 210px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FFB800',
                    textShadow: '0 0 30px #D97706, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '5px #000000'
                  }}
                >
                  CAUGHT!
                </h1>
              </motion.div>
            )}

            {/* Subtitle with Fielder Credit */}
            {phase >= 3 && (
              <motion.div
                className="absolute bottom-20 z-30 flex flex-col items-center gap-2"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="font-extrabold text-2xl md:text-4xl px-8 py-2.5 rounded-2xl bg-black/85 border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] text-white uppercase tracking-wider">
                  SAFE PAIR OF HANDS!
                </div>
                <div className="bg-amber-950/80 border border-amber-500/40 px-6 py-1.5 rounded-full text-sm font-bold text-amber-200 uppercase tracking-widest font-mono">
                  {metadata?.fielderName ? `c. ${metadata.fielderName}` : 'Brilliant Catch'} • b. {metadata?.bowlerName || 'Bowler'}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            5. RUN OUT DIRECT HIT STINGER
            ========================================================================= */}
        {normalizedType === 'run_out' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Sniper Target Reticle Lock-On */}
            {phase >= 1 && (
              <motion.div
                className="absolute w-72 h-72 rounded-full border-4 border-dashed border-red-500 flex items-center justify-center pointer-events-none"
                initial={{ scale: 3, opacity: 0, rotate: 90 }}
                animate={{ scale: [3, 0.85, 1], opacity: 1, rotate: 0 }}
                transition={{ duration: 0.55 }}
                style={{ boxShadow: '0 0 50px rgba(239, 68, 68, 0.7)' }}
              >
                <Target className="w-48 h-48 text-red-500 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-ping" />
                </div>
              </motion.div>
            )}

            {/* Headline */}
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center mt-44"
                initial={{ scale: 4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 160 }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(75px, 11vw, 190px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FF2E2E',
                    textShadow: '0 0 35px #DC2626, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  DIRECT HIT!
                </h1>
              </motion.div>
            )}

            {/* Subtitle */}
            {phase >= 3 && (
              <motion.div
                className="absolute bottom-20 z-30 flex flex-col items-center gap-2"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="font-extrabold text-2xl md:text-4xl px-8 py-2.5 rounded-2xl bg-black/85 border-2 border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.7)] text-white uppercase tracking-wider">
                  🎯 RUN OUT • SHORT OF CREASE! 🎯
                </div>
                {metadata?.batterName && (
                  <div className="bg-red-950/80 border border-red-500/40 px-6 py-1.5 rounded-full text-sm font-bold text-red-200 uppercase tracking-widest font-mono">
                    {metadata.batterName} falls just inches away!
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            6. LBW / DRS BALL TRACKING STINGER
            ========================================================================= */}
        {normalizedType === 'lbw' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* DRS Telemetry Indicator 3-Light Box */}
            <motion.div
              className="z-10 bg-slate-950/90 border-2 border-red-600 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.6)] flex flex-col items-center gap-4 mb-4 backdrop-blur-xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 text-xs font-mono font-black text-red-400 uppercase tracking-widest">
                <Compass className="w-4 h-4 animate-spin" />
                <span>HAWK-EYE BALL TRACKING SYSTEM</span>
              </div>

              {/* 3 Status Modules */}
              <div className="flex gap-4">
                {[
                  { label: 'PITCHING', status: 'IN LINE', delay: 0.2 },
                  { label: 'IMPACT', status: 'IN LINE', delay: 0.45 },
                  { label: 'WICKETS', status: 'HITTING', delay: 0.75 },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex flex-col items-center bg-black/60 border border-red-500/40 px-4 py-3 rounded-2xl min-w-[120px]"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: item.delay }}
                  >
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{item.label}</span>
                    <motion.div
                      className="mt-1.5 px-3 py-1 rounded-lg bg-red-600 text-white font-black text-xs font-mono shadow-[0_0_15px_#ef4444]"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [0.5, 1.2, 1] }}
                      transition={{ delay: item.delay + 0.15 }}
                    >
                      {item.status}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Rubber Stamp OUT Title */}
            {phase >= 3 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 4, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: -3 }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <div
                  className="font-black px-12 py-3 rounded-3xl bg-red-700 border-4 border-white text-white uppercase tracking-widest shadow-[0_0_50px_rgba(239,68,68,0.9)]"
                  style={{
                    fontSize: 'clamp(50px, 8vw, 120px)',
                    fontFamily: '"Impact", sans-serif'
                  }}
                >
                  LBW • OUT!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            7. STUMPED OUT STINGER
            ========================================================================= */}
        {normalizedType === 'stumped' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(85px, 13vw, 220px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FF6B00',
                    textShadow: '0 0 35px #EA580C, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  STUMPED!
                </h1>
              </motion.div>
            )}

            {phase >= 3 && (
              <motion.div
                className="absolute bottom-20 z-30 flex flex-col items-center gap-2"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <div className="font-extrabold text-2xl md:text-4xl px-8 py-2.5 rounded-2xl bg-black/85 border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.6)] text-white uppercase tracking-wider">
                  ⚡ LIGHTNING GLOVEWORK! ⚡
                </div>
                <div className="bg-orange-950/80 border border-orange-500/40 px-6 py-1.5 rounded-full text-sm font-bold text-orange-200 uppercase tracking-widest font-mono">
                  Beaten in the flight • Bail dislodged!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            8. GENERAL WICKET / OUT FALLOUT STINGER
            ========================================================================= */}
        {normalizedType === 'wicket' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Vignette & Red Dust */}
            <motion.div
              className="absolute inset-0 bg-radial-vignette opacity-85 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              style={{ background: 'radial-gradient(circle, rgba(185,28,28,0.4) 0%, rgba(0,0,0,0.95) 80%)' }}
            />

            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 5, opacity: 0, rotate: -15 }}
                animate={{ scale: [5, 0.95, 1], opacity: 1, rotate: -5 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-wide px-4"
                  style={{
                    fontSize: 'clamp(85px, 12vw, 220px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#CC0000',
                    textShadow: '0 10px 25px rgba(0,0,0,0.95), 0 0 35px #8B0000',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  WICKET!
                </h1>
              </motion.div>
            )}

            {phase >= 3 && (
              <motion.div
                className="absolute bottom-24 z-30"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: "spring", stiffness: 170 }}
              >
                <div
                  className="font-black text-6xl md:text-8xl px-14 py-4 rounded-3xl bg-black/90 border-2 border-red-600 shadow-[0_0_40px_rgba(239,68,68,0.8)]"
                  style={{
                    fontFamily: '"Impact", sans-serif',
                    animation: "strobePulse 0.3s steps(1) infinite"
                  }}
                >
                  OUT!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            9. FREE HIT SIREN ANIMATION STINGER
            ========================================================================= */}
        {normalizedType === 'free_hit' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Flashing Police Siren Emergency Beacon Background */}
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-40 z-0"
              animate={{
                background: [
                  'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)',
                  'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)',
                  'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)',
                ]
              }}
              transition={{ repeat: Infinity, duration: 0.4 }}
            />

            {/* Top & Bottom Scrolling Caution Tape */}
            <div className="absolute top-12 inset-x-0 h-9 bg-yellow-400 text-black font-black uppercase text-xs flex items-center justify-around font-mono overflow-hidden shadow-xl z-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="tracking-widest flex items-center gap-2">
                  <span>⚠️ FREE HIT IN EFFECT</span>
                  <span>•</span>
                </span>
              ))}
            </div>

            <div className="absolute bottom-12 inset-x-0 h-9 bg-yellow-400 text-black font-black uppercase text-xs flex items-center justify-around font-mono overflow-hidden shadow-xl z-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="tracking-widest flex items-center gap-2">
                  <span>🚨 BATTER CANNOT BE CAUGHT OUT</span>
                  <span>•</span>
                </span>
              ))}
            </div>

            {/* Headline */}
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140 }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-yellow-400 text-black flex items-center justify-center mb-4 shadow-[0_0_35px_#facc15] animate-bounce">
                  <Siren className="w-12 h-12" />
                </div>
                <h1
                  className="font-black leading-none uppercase tracking-wider"
                  style={{
                    fontSize: 'clamp(80px, 12vw, 200px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FACC15',
                    textShadow: '0 0 35px #CA8A04, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  FREE HIT!
                </h1>
                <div className="mt-4 inline-block bg-black/80 border-2 border-yellow-400 text-yellow-300 font-bold text-lg px-8 py-2 rounded-full uppercase tracking-widest font-mono">
                  NO-BALL AWARDED • GO BIG!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            10. HAT-TRICK BALL DANGER STINGER
            ========================================================================= */}
        {normalizedType === 'hat_trick_ball' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-40 z-0 border-[16px] border-red-600"
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />

            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-red-600 text-white flex items-center justify-center mb-4 shadow-[0_0_40px_#ef4444] animate-pulse">
                  <Flame className="w-12 h-12" />
                </div>
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(65px, 10vw, 170px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FF2222',
                    textShadow: '0 0 40px #B91C1C, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  HAT-TRICK BALL!
                </h1>
                <div className="mt-4 inline-block bg-black/85 border-2 border-red-500 text-red-300 font-black text-xl px-10 py-3 rounded-2xl uppercase tracking-widest font-mono shadow-2xl">
                  ⚠️ 2 IN 2 WICKETS! EXTREME PRESSURE ON CREASE! ⚠️
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            11. HAT-TRICK HERO STINGER
            ========================================================================= */}
        {normalizedType === 'hat_trick' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 1 && renderGoldSparks(45)}

            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140 }}
              >
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mb-4 shadow-[0_0_50px_#f59e0b] animate-bounce">
                  <Crown className="w-14 h-14" />
                </div>
                <h1
                  className="font-black leading-none uppercase tracking-wider"
                  style={{
                    fontSize: 'clamp(70px, 11vw, 180px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FFD700',
                    textShadow: '0 0 40px #EA580C, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  HAT-TRICK!
                </h1>
                <div className="mt-4 inline-block bg-black/85 border-2 border-amber-400 text-amber-300 font-black text-xl px-10 py-3 rounded-2xl uppercase tracking-widest font-mono shadow-[0_0_35px_rgba(245,158,11,0.6)]">
                  🔥 3 WICKETS IN 3 BALLS • HISTORY CREATED! 🔥
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            12. ONE TIP ONE HAND (GULLY CRICKET RULE)
            ========================================================================= */}
        {normalizedType === 'one_tip_hand' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 4, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 150 }}
              >
                <div className="text-9xl mb-2 animate-bounce">✋</div>
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(55px, 8vw, 140px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#38BDF8',
                    textShadow: '0 0 35px #0284C7, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '5px #000000'
                  }}
                >
                  1-TIP 1-HAND!
                </h1>
                <div className="mt-4 inline-block bg-black/85 border-2 border-sky-400 text-sky-200 font-bold text-lg px-8 py-2.5 rounded-2xl uppercase tracking-widest font-mono">
                  CAUGHT WITH ONE HAND OFF 1 BOUNCE • OUT!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            13. BALL IN HOUSE / LOST BALL (GULLY CRICKET RULE)
            ========================================================================= */}
        {normalizedType === 'lost_ball' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="text-9xl mb-2 animate-bounce">🏠</div>
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(60px, 9vw, 150px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FB923C',
                    textShadow: '0 0 35px #EA580C, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '5px #000000'
                  }}
                >
                  BALL IN HOUSE!
                </h1>
                <div className="mt-4 inline-block bg-black/85 border-2 border-orange-500 text-orange-200 font-bold text-lg px-8 py-2.5 rounded-2xl uppercase tracking-widest font-mono">
                  HIT OVER THE WALL • 6 RUNS & BATSMAN OUT!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            14. DIRECT CAR HIT (GULLY CRICKET PENALTY)
            ========================================================================= */}
        {normalizedType === 'car_hit' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 3.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="text-9xl mb-2 animate-pulse">🚗💥</div>
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(55px, 8vw, 140px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#F43F5E',
                    textShadow: '0 0 35px #E11D48, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '5px #000000'
                  }}
                >
                  CAR HIT PENALTY!
                </h1>
                <div className="mt-4 inline-block bg-black/85 border-2 border-rose-500 text-rose-200 font-black text-xl px-10 py-3 rounded-2xl uppercase tracking-widest font-mono">
                  -5 RUNS PENALTY • RUN BEFORE THE OWNER ARRIVES!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            15. FIFTY / HALF-CENTURY MILESTONE STINGER
            ========================================================================= */}
        {normalizedType === 'fifty' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 1 && renderGoldSparks(30)}

            {phase >= 2 && (
              <motion.div
                className="z-20 text-center flex flex-col items-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mb-3 shadow-[0_0_35px_#f59e0b]">
                  <Award className="w-12 h-12" />
                </div>
                <h1
                  className="font-black leading-none uppercase tracking-tight"
                  style={{
                    fontSize: 'clamp(80px, 12vw, 210px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#F59E0B',
                    textShadow: '0 0 40px #D97706, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  50 RUNS!
                </h1>
                <div className="text-3xl font-black text-white uppercase tracking-widest mb-3">
                  {metadata?.batterName ? `${metadata.batterName.toUpperCase()} • RAISES THE BAT!` : 'BRILLIANT HALF-CENTURY!'}
                </div>
                {metadata?.runs && (
                  <div className="bg-black/80 border border-amber-500/50 px-8 py-2.5 rounded-full text-base font-bold text-amber-200 uppercase tracking-widest font-mono">
                    {metadata.runs} Runs off {metadata.balls || 0} Balls • {metadata.fours || 0} 4s • {metadata.sixes || 0} 6s • SR: {metadata.strikeRate || '0.0'}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            16. CENTURY / HUNDRED MILESTONE STINGER
            ========================================================================= */}
        {normalizedType === 'hundred' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 1 && renderGoldSparks(50)}

            {phase >= 2 && (
              <motion.div
                className="z-20 text-center flex flex-col items-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 140 }}
              >
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-yellow-500 to-amber-300 text-slate-950 flex items-center justify-center mb-4 shadow-[0_0_50px_#eab308] animate-bounce">
                  <Crown className="w-14 h-14" />
                </div>
                <h1
                  className="font-black leading-none uppercase tracking-tight"
                  style={{
                    fontSize: 'clamp(85px, 13vw, 230px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#EAB308',
                    textShadow: '0 0 50px #CA8A04, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '7px #000000'
                  }}
                >
                  100 RUNS!
                </h1>
                <div className="text-4xl font-black text-white uppercase tracking-widest mb-3">
                  👑 MAGNIFICENT CENTURY! 👑
                </div>
                {metadata?.batterName && (
                  <div className="bg-black/80 border border-yellow-500/50 px-8 py-2.5 rounded-full text-lg font-bold text-yellow-200 uppercase tracking-widest font-mono">
                    Masterclass Inning by {metadata.batterName}!
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* =========================================================================
            17. SUPER OVER SHOWDOWN STINGER
            ========================================================================= */}
        {normalizedType === 'super_over' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {phase >= 2 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center mb-4 shadow-[0_0_40px_#22d3ee] animate-pulse">
                  <Zap className="w-12 h-12" />
                </div>
                <h1
                  className="font-black leading-none uppercase tracking-wide"
                  style={{
                    fontSize: 'clamp(60px, 9vw, 160px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#22D3EE',
                    textShadow: '0 0 40px #0891B2, 0 10px 40px rgba(0,0,0,0.95)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  SUPER OVER!
                </h1>
                <div className="mt-4 inline-block bg-black/85 border-2 border-cyan-400 text-cyan-200 font-black text-xl px-10 py-3 rounded-2xl uppercase tracking-widest font-mono shadow-2xl">
                  ⚡ SCORES TIED • 6 BALLS TO DECIDE THE CHAMPION! ⚡
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Embedded strobe custom styles */}
      <style>{`
        @keyframes strobePulse {
          0%, 100% {
            color: #FFFFFF;
            border-color: #CC0000;
            box-shadow: 0 0 35px rgba(220,38,38,0.8);
          }
          50% {
            color: #CC0000;
            border-color: #FFFFFF;
            box-shadow: 0 0 15px rgba(255,255,255,0.6);
          }
        }
      `}</style>
    </AnimatePresence>
  );
};
