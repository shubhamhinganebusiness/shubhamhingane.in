import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Zap, AlertTriangle } from 'lucide-react';

interface CricketOverlayAnimationsProps {
  activeAnimation: 'six' | 'four' | 'wicket' | null;
  onAnimationComplete: () => void;
}

export const CricketOverlayAnimations: React.FC<CricketOverlayAnimationsProps> = ({
  activeAnimation,
  onAnimationComplete,
}) => {
  const [phase, setPhase] = useState<number>(0);

  // Manage internal phases based on the active animation and exact timings
  useEffect(() => {
    if (!activeAnimation) {
      setPhase(0);
      return;
    }

    setPhase(1);

    let timers: NodeJS.Timeout[] = [];

    if (activeAnimation === 'six') {
      // Phase TIMINGS for SIX Overlay (Total: 2.0s: 0-0.15s Intro, 0.15-1.6s Impact, 1.6-2.0s Outro)
      timers.push(setTimeout(() => setPhase(2), 150));
      timers.push(setTimeout(() => setPhase(3), 450));
      timers.push(setTimeout(() => setPhase(4), 900));
      timers.push(setTimeout(() => setPhase(5), 1600)); // Outro fade
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 2000));
    } else if (activeAnimation === 'four') {
      // Phase TIMINGS for FOUR Overlay (Total: 2.0s: 0-0.15s Intro, 0.15-0.45s Impact, 0.45-0.9s Lightning, 0.9-1.6s Boundary Subtitle, 1.6-2.0s Outro)
      timers.push(setTimeout(() => setPhase(2), 150));
      timers.push(setTimeout(() => setPhase(3), 450));
      timers.push(setTimeout(() => setPhase(4), 900));
      timers.push(setTimeout(() => setPhase(5), 1600)); // Outro fade
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 2000));
    } else if (activeAnimation === 'wicket') {
      // Phase TIMINGS for WICKET Overlay (Total: 5.0s)
      // Phase 1 (0-0.5s) -> flash + vignette
      // Phase 2 (0.5-1.2s) -> crash
      // Phase 3 (1.2-2.0s) -> stumps fly
      // Phase 4 (2.0-3.5s) -> text drips + strobe
      // Phase 5 (3.5-4.5s) -> red dust
      // Phase 6 (4.5-5.0s) -> reset
      timers.push(setTimeout(() => setPhase(2), 500));
      timers.push(setTimeout(() => setPhase(3), 1200));
      timers.push(setTimeout(() => setPhase(4), 2000));
      timers.push(setTimeout(() => setPhase(5), 3500));
      timers.push(setTimeout(() => setPhase(6), 4500));
      timers.push(setTimeout(() => {
        onAnimationComplete();
        setPhase(0);
      }, 5000));
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [activeAnimation, onAnimationComplete]);

  if (!activeAnimation) return null;

  // Render Gold Sparks for SIX
  const renderGoldSparks = () => {
    return Array.from({ length: 30 }).map((_, i) => {
      const angle = (i * 360) / 30;
      const distance = 120 + Math.random() * 180;
      const rad = (angle * Math.PI) / 180;
      const tx = Math.cos(rad) * distance;
      const ty = Math.sin(rad) * distance;
      const size = 6 + Math.random() * 12;

      return (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 shadow-[0_0_15px_rgba(253,224,71,0.8)]"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: tx,
            y: ty,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.8,
            ease: "easeOut",
            delay: Math.random() * 0.1,
          }}
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

  // Render floating cricket balls for SIX
  const renderFloatingBalls = () => {
    return Array.from({ length: 25 }).map((_, i) => {
      const size = 20 + Math.random() * 30;
      const startX = 5 + Math.random() * 90; // percentage
      const duration = 2.5 + Math.random() * 1.5;
      const delay = Math.random() * 1.2;

      return (
        <motion.div
          key={`ball-${i}`}
          className="absolute rounded-full border border-red-700/50 flex items-center justify-center pointer-events-none"
          initial={{ y: "110vh", x: `${startX}vw`, scale: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: "-15vh",
            scale: [0, 1.2, 0.8],
            opacity: [0, 0.85, 0.85, 0],
            rotate: 360 + Math.random() * 540,
          }}
          transition={{
            duration: duration,
            ease: "easeOut",
            delay: delay,
          }}
          style={{
            width: size,
            height: size,
            // Draw a high-quality leather cricket ball visual using CSS gradients & stitches
            background: "radial-gradient(circle at 35% 35%, #ef4444 0%, #b91c1c 65%, #7f1d1d 100%)",
            boxShadow: `0 10px 20px rgba(0,0,0,0.4), inset -2px -2px 8px rgba(0,0,0,0.5), 0 0 12px rgba(239, 68, 68, 0.4)`,
          }}
        >
          {/* Cricket Ball Stitches seam line */}
          <div className="absolute w-full h-[2px] bg-white/45 top-1/2 left-0 rotate-45 border-t border-b border-dashed border-red-900/50" />
        </motion.div>
      );
    });
  };

  // Render speed lines for FOUR boundary
  const renderSpeedLines = () => {
    return Array.from({ length: 12 }).map((_, i) => {
      const pTop = 10 + i * 8; // percentage spacing
      const height = 1 + Math.random() * 3;
      const delay = Math.random() * 0.25;
      const duration = 0.5 + Math.random() * 0.3;

      return (
        <motion.div
          key={`speed-${i}`}
          className="absolute bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none opacity-80"
          initial={{ left: "-100%", width: "50%" }}
          animate={{ left: "200%" }}
          transition={{
            duration: duration,
            ease: "easeInOut",
            delay: delay,
          }}
          style={{
            top: `${pTop}%`,
            height: height,
            boxShadow: `0 0 8px rgba(34, 211, 238, 0.6)`,
          }}
        />
      );
    });
  };

  // Render red dust particles for WICKET
  const renderRedDust = () => {
    return Array.from({ length: 45 }).map((_, i) => {
      const size = 3 + Math.random() * 8;
      const startX = Math.random() * 100; // view percent width
      const startY = 15 + Math.random() * 65; // percentage y
      const travelX = -40 + Math.random() * 80;
      const travelY = 100 + Math.random() * 200;
      const delay = Math.random() * 1;
      const duration = 1.5 + Math.random() * 1.5;

      return (
        <motion.div
          key={`dust-${i}`}
          className="absolute rounded-full bg-red-600 pointer-events-none"
          initial={{ x: `${startX}vw`, y: `${startY}vh`, scale: 1, opacity: 0 }}
          animate={{
            x: `${startX}vw`,
            y: `${startY + 30}vh`,
            scale: [1, 1.5, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: duration,
            ease: "easeOut",
            delay: delay,
          }}
          style={{
            width: size,
            height: size,
            boxShadow: "0 0 10px #ef4444",
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
        transition={{ duration: 0.3 }}
      >
        {/* ==================================== 1. SIX ANIMATION CANVAS ==================================== */}
        {activeAnimation === 'six' && (
          <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${phase === 5 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            
            {/* Spark explosion (Phase 1) */}
            {phase >= 1 && renderGoldSparks()}

            {/* floating cricket balls active after phase 1 */}
            {phase >= 2 && renderFloatingBalls()}

            {/* Rotating orbits (Stars in Circle) during Phase 3 onwards */}
            {phase >= 3 && (
              <motion.div 
                className="absolute w-[440px] h-[440px] pointer-events-none flex items-center justify-center"
                initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 360, scale: 1, opacity: 1 }}
                transition={{
                  scale: { duration: 0.3 },
                  opacity: { duration: 0.3 },
                  rotate: { repeat: Infinity, duration: 4, ease: "linear" }
                }}
              >
                {Array.from({ length: 8 }).map((_, idx) => {
                  const angle = (idx * 360) / 8;
                  const rad = (angle * Math.PI) / 180;
                  const tx = Math.cos(rad) * 200;
                  const ty = Math.sin(rad) * 200;
                  return (
                    <div 
                      key={`star-${idx}`} 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `calc(50% + ${tx}px)`, top: `calc(50% + ${ty}px)` }}
                    >
                      <Star className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_#fbbf24]" size={28} />
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* Main Title Impact (Phase 2 & onwards) */}
            {phase >= 2 && (
              <motion.div
                className="text-center z-10"
                initial={{ y: -400, scale: 2.0, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  scale: phase >= 3 ? [1, 1.08, 1] : 1,
                  opacity: 1 
                }}
                transition={phase >= 3 ? {
                  y: { type: "spring", bounce: 0.35, duration: 0.4 },
                  scale: { repeat: Infinity, duration: 0.6, ease: "easeInOut" }
                } : {
                  type: "spring",
                  bounce: 0.35,
                  duration: 0.4
                }}
              >
                <h1 
                  className="font-black leading-none uppercase tracking-tighter filter"
                  style={{
                    fontSize: 'clamp(180px, 20vw, 320px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#FFD700',
                    textShadow: '0 0 20px #FF6B00, 0 0 40px #FF6B00, 0 10px 40px rgba(0,0,0,0.9)',
                    WebkitTextStroke: '6px #000000'
                  }}
                >
                  6
                </h1>
              </motion.div>
            )}

            {/* Flash screen brief burst background on Phase 3 anchor */}
            {phase === 3 && (
              <motion.div 
                className="absolute inset-0 bg-white pointer-events-none z-0"
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            )}

            {/* BONUS SUBTITLE slide in (Phase 4) */}
            {phase >= 4 && (
              <motion.div
                className="absolute bottom-28 z-20"
                initial={{ y: 150, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 10 }}
              >
                <div 
                  className="font-extrabold text-white text-5xl md:text-7xl uppercase tracking-widest px-8 py-3 rounded-2xl bg-black/60 border border-yellow-500/30"
                  style={{
                    fontFamily: '"Impact", sans-serif',
                    textShadow: '-3px -3px 0 #ef4444, 3px -3px 0 #ef4444, -3px 3px 0 #ef4444, 3px 3px 0 #ef4444, 0 0 30px rgba(239, 68, 68, 0.8)'
                  }}
                >
                  MAXIMUM!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ==================================== 2. FOUR ANIMATION CANVAS ==================================== */}
        {activeAnimation === 'four' && (
          <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${phase === 5 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {/* Speed Horizontal Sweeping Lines (Phase 1) */}
            {phase >= 1 && renderSpeedLines()}

            {/* Lightning bolt crackle around (Phase 3 onwards) */}
            {phase >= 3 && (
              <div className="absolute inset-0 z-0 pointer-events-none">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <motion.div
                    key={`bolt-${idx}`}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ 
                      opacity: [0, 1, 0, 1, 0], 
                      scale: [0.8, 1.2, 0.9, 1.3, 1] 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.35 + Math.random() * 0.25, 
                      ease: "linear" 
                    }}
                    style={{
                      left: `${15 + Math.random() * 70}%`,
                      top: `${15 + Math.random() * 70}%`,
                    }}
                  >
                    <Zap className="text-cyan-300 drop-shadow-[0_0_15px_#06b6d4]" size={48 + Math.random() * 40} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Number 4 rocketing in (Phase 2 & onwards) */}
            {phase >= 2 && (
              <motion.div
                className="z-10"
                initial={{ x: -1000, rotate: -25, skewX: -15, opacity: 0 }}
                animate={{
                  x: phase >= 5 ? 1200 : 0,
                  rotate: phase >= 3 ? 0 : -10,
                  skewX: phase >= 3 ? 0 : -10,
                  opacity: phase >= 5 ? 0 : 1,
                  filter: phase >= 5 ? "blur(12px)" : "blur(0px)",
                }}
                transition={{
                  x: phase >= 5 ? { duration: 0.35, ease: "easeIn" } : { type: "spring", stiffness: 120, damping: 12 },
                  rotate: { duration: 0.3 },
                  skewX: { duration: 0.3 }
                }}
              >
                <h1 
                  className="font-black leading-none uppercase tracking-tighter"
                  style={{
                    fontSize: 'clamp(200px, 22vw, 340px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#00BFFF',
                    textShadow: '0 0 25px #0080FF, 0 0 50px #0080FF, 0 15px 35px rgba(0,0,0,0.85)',
                    WebkitTextStroke: '6px #00001a'
                  }}
                >
                  4
                </h1>
              </motion.div>
            )}

            {/* Flash screen brief burst background on Phase 3 anchor */}
            {phase === 3 && (
              <motion.div 
                className="absolute inset-0 bg-cyan-300 pointer-events-none z-0"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            )}

            {/* BOUNDARY subtitle rises (Phase 4) */}
            {phase >= 4 && phase < 5 && (
              <motion.div
                className="absolute bottom-28 z-20"
                initial={{ y: 150, opacity: 0, scale: 0.6 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 150, opacity: 0 }}
                transition={{ type: "spring", stiffness: 140, damping: 12 }}
              >
                <div 
                  className="font-black text-white text-4xl md:text-6xl uppercase tracking-widest px-8 py-3 rounded-2xl bg-black/60 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  style={{
                    fontFamily: '"Impact", sans-serif',
                    textShadow: '0 0 15px #00BFFF, 0 0 30px #0080FF'
                  }}
                >
                  BOUNDARY!
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ==================================== 3. WICKET ANIMATION CANVAS ==================================== */}
        {activeAnimation === 'wicket' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            
            {/* Dark Vignette Overlay & Flash Red (Phase 1) */}
            <motion.div 
              className="absolute inset-0 bg-radial-vignette opacity-85 z-0"
              initial={{ bg: "transparent" }}
              animate={{ 
                background: phase === 1 
                  ? "radial-gradient(circle, rgba(220,38,38,0.4) 0%, rgba(0,0,0,0.95) 80%)"
                  : "radial-gradient(circle, rgba(127,29,29,0.3) 0%, rgba(0,0,0,0.98) 85%)" 
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Red dust falling down in slow flow (Phase 5) */}
            {phase >= 5 && renderRedDust()}

            {/* WICKET! text crashes in (Phase 2 onwards) */}
            {phase >= 2 && phase < 6 && (
              <motion.div
                className="z-20 text-center"
                initial={{ scale: 6, opacity: 0, rotate: -20 }}
                animate={{ 
                  scale: [6, 0.95, 1], 
                  opacity: 1, 
                  rotate: -6,
                }}
                transition={{ 
                  duration: 0.7, 
                  ease: "easeOut"
                }}
              >
                <h1
                  className="font-black leading-none uppercase tracking-wide px-4"
                  style={{
                    fontSize: 'clamp(85px, 12vw, 220px)',
                    fontFamily: '"Impact", "Arial Black", sans-serif',
                    color: '#CC0000',
                    // Red drip transition simulation
                    textShadow: phase >= 4 
                      ? '0 10px 25px rgba(0,0,0,0.95), 0 0 30px #8B0000, 0 0 50px #8B0000' 
                      : '0 5px 15px rgba(0,0,0,0.9), 0 0 20px #FF0000',
                    WebkitTextStroke: '5px #000000'
                  }}
                >
                  WICKET!
                </h1>
              </motion.div>
            )}

            {/* Flying Stumps details (Phase 3) */}
            {phase >= 3 && phase < 6 && (
              <div className="absolute w-[300px] h-[300px] top-[55%] z-10 pointer-events-none">
                {/* Stump 1 (Left) */}
                <motion.div 
                  className="absolute w-5 h-44 bg-amber-700 rounded-lg shadow-xl"
                  initial={{ rotate: 0, x: 120, y: 0 }}
                  animate={{ 
                    rotate: [-35, -280],
                    x: [-30, -180], 
                    y: [-10, 160],
                    opacity: [1, 0.9, 0]
                  }}
                  transition={{ duration: 1.6, ease: "easeOut" }}
                  style={{
                    background: "linear-gradient(90deg, #d97706 0%, #b45309 60%, #78350f 100%)",
                    boxShadow: "0 0 15px rgba(217,119,6,0.3)"
                  }}
                />

                {/* Stump 2 (Middle) */}
                <motion.div 
                  className="absolute w-5 h-44 bg-amber-700 rounded-lg shadow-xl"
                  initial={{ rotate: 0, x: 140, y: 0 }}
                  animate={{ 
                    rotate: [20, 240], 
                    x: [10, 30], 
                    y: [-30, 180],
                    opacity: [1, 0.9, 0]
                  }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.05 }}
                  style={{
                    background: "linear-gradient(90deg, #d97706 0%, #b45309 60%, #78350f 100%)",
                    boxShadow: "0 0 15px rgba(217,119,6,0.3)"
                  }}
                />

                {/* Stump 3 (Right) */}
                <motion.div 
                  className="absolute w-5 h-44 bg-amber-700 rounded-lg shadow-xl"
                  initial={{ rotate: 0, x: 160, y: 0 }}
                  animate={{ 
                    rotate: [45, 360], 
                    x: [50, 210], 
                    y: [-15, 140],
                    opacity: [1, 0.9, 0]
                  }}
                  transition={{ duration: 1.7, ease: "easeOut", delay: 0.1 }}
                  style={{
                    background: "linear-gradient(90deg, #d97706 0%, #b45309 60%, #78350f 100%)",
                    boxShadow: "0 0 15px rgba(217,119,6,0.3)"
                  }}
                />

                {/* Flying Bail 1 */}
                <motion.div 
                  className="absolute w-12 h-3 bg-red-500 rounded-sm"
                  initial={{ rotate: 0, x: 125, y: -10 }}
                  animate={{ 
                    rotate: [-180, -900], 
                    x: [-20, -220], 
                    y: [-80, 200],
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1.4, ease: "easeOut" }}
                  style={{
                    background: "radial-gradient(circle, #ef4444 0%, #991b1b 100%)",
                    boxShadow: "0 0 10px #f87171"
                  }}
                />

                {/* Flying Bail 2 */}
                <motion.div 
                  className="absolute w-12 h-3 bg-red-500 rounded-sm"
                  initial={{ rotate: 0, x: 155, y: -10 }}
                  animate={{ 
                    rotate: [180, 1080], 
                    x: [40, 240], 
                    y: [-110, 180],
                    opacity: [1, 0]
                  }}
                  transition={{ duration: 1.35, ease: "easeOut", delay: 0.05 }}
                  style={{
                    background: "radial-gradient(circle, #ef4444 0%, #991b1b 100%)",
                    boxShadow: "0 0 10px #f87171"
                  }}
                />
              </div>
            )}

            {/* OUT! subtitle with strobe effect (Phase 4) */}
            {phase >= 4 && phase < 6 && (
              <motion.div
                className="absolute bottom-24 z-35"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ type: "spring", stiffness: 180 }}
              >
                <div 
                  className="font-black text-6xl md:text-8xl px-14 py-4 rounded-3xl bg-black/90 border-2 border-red-600 shadow-[0_0_35px_rgba(239,68,68,0.7)]"
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
      </motion.div>

      {/* Embedded strobe custom styles */}
      <style>{`
        @keyframes strobePulse {
          0%, 100% {
            color: #FFFFFF;
            border-color: #CC0000;
            box-shadow: 0 0 30px rgba(220,38,38,0.7);
          }
          50% {
            color: #CC0000;
            border-color: #FFFFFF;
            box-shadow: 0 0 10px rgba(255,255,255,0.4);
          }
        }
      `}</style>
    </AnimatePresence>
  );
};
