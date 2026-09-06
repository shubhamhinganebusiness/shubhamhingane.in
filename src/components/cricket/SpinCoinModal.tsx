import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, RotateCcw, Check, Sparkles, Trophy, ArrowRight, 
  Volume2, VolumeX, ShieldCheck, Flame 
} from 'lucide-react';

export interface SpinCoinResult {
  winner: 'Team A' | 'Team B';
  winnerName: string;
  choice: 'bat' | 'bowl';
  coinSide: 'heads' | 'tails';
}

interface SpinCoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamA: string;
  teamB: string;
  onApplyToss: (result: SpinCoinResult) => void;
  soundEnabled?: boolean;
}

export const SpinCoinModal: React.FC<SpinCoinModalProps> = ({
  isOpen,
  onClose,
  teamA,
  teamB,
  onApplyToss,
  soundEnabled = true
}) => {
  const displayTeamA = teamA.trim() || 'Team A';
  const displayTeamB = teamB.trim() || 'Team B';

  const [callingTeam, setCallingTeam] = useState<'Team A' | 'Team B'>('Team A');
  const [callChoice, setCallChoice] = useState<'heads' | 'tails'>('heads');
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [landedSide, setLandedSide] = useState<'heads' | 'tails' | null>(null);
  const [tossWinnerKey, setTossWinnerKey] = useState<'Team A' | 'Team B' | null>(null);
  const [electedDecision, setElectedDecision] = useState<'bat' | 'bowl'>('bat');
  const [spinHistory, setSpinHistory] = useState<Array<{
    side: 'heads' | 'tails';
    winner: string;
    choice: 'bat' | 'bowl';
    time: string;
  }>>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playCoinSound = (type: 'flick' | 'land' | 'win') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (type === 'flick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'land') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.45, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);

        setTimeout(() => {
          if (!audioCtxRef.current) return;
          const bOsc = audioCtxRef.current.createOscillator();
          const bGain = audioCtxRef.current.createGain();
          bOsc.type = 'sine';
          bOsc.frequency.setValueAtTime(1900, audioCtxRef.current.currentTime);
          bGain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
          bGain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.2);
          bOsc.connect(bGain);
          bGain.connect(audioCtxRef.current.destination);
          bOsc.start();
          bOsc.stop(audioCtxRef.current.currentTime + 0.2);
        }, 120);
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const nOsc = ctx.createOscillator();
          const nGain = ctx.createGain();
          nOsc.type = 'triangle';
          nOsc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          nGain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.08);
          nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
          nOsc.connect(nGain);
          nGain.connect(ctx.destination);
          nOsc.start(ctx.currentTime + idx * 0.08);
          nOsc.stop(ctx.currentTime + idx * 0.08 + 0.3);
        });
      }
    } catch {
      // Audio fallback
    }
  };

  // Reset when opening modal
  useEffect(() => {
    if (isOpen) {
      setLandedSide(null);
      setTossWinnerKey(null);
      setIsSpinning(false);
      setElectedDecision('bat');
    }
  }, [isOpen]);

  const handleSpinCoin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setLandedSide(null);
    setTossWinnerKey(null);

    playCoinSound('flick');

    // Cryptographic / fair random coin outcome
    const isHeads = Math.random() < 0.5;
    const resultSide: 'heads' | 'tails' = isHeads ? 'heads' : 'tails';

    // Calculate rotation: multiple full 360 rotations + 180 for tails
    const spinTurns = 5 + Math.floor(Math.random() * 3); // 5 to 7 full flips
    const targetDeg = spinTurns * 360 + (resultSide === 'tails' ? 180 : 0);
    setSpinDeg(prev => prev + targetDeg);

    setTimeout(() => {
      playCoinSound('land');
      setLandedSide(resultSide);

      const callerWon = callChoice === resultSide;
      const winner = callerWon
        ? callingTeam
        : (callingTeam === 'Team A' ? 'Team B' : 'Team A');

      setTossWinnerKey(winner);
      setIsSpinning(false);
      playCoinSound('win');

      const winningName = winner === 'Team A' ? displayTeamA : displayTeamB;
      setSpinHistory(prev => [
        {
          side: resultSide,
          winner: winningName,
          choice: electedDecision,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        },
        ...prev.slice(0, 3)
      ]);
    }, 1700);
  };

  const handleApply = () => {
    if (!tossWinnerKey || !landedSide) return;
    const winningName = tossWinnerKey === 'Team A' ? displayTeamA : displayTeamB;
    onApplyToss({
      winner: tossWinnerKey,
      winnerName: winningName,
      choice: electedDecision,
      coinSide: landedSide
    });
  };

  if (!isOpen) return null;

  const currentCallingTeamName = callingTeam === 'Team A' ? displayTeamA : displayTeamB;
  const winnerTeamName = tossWinnerKey === 'Team A' ? displayTeamA : displayTeamB;

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        exit={{ opacity: 0 }}
        onClick={() => !isSpinning && onClose()}
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative z-10 w-full max-w-lg bg-stone-900 border border-amber-500/30 rounded-[2.5rem] p-6 sm:p-7 shadow-2xl overflow-hidden text-stone-100"
      >
        {/* Top Gold Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  Spin Coin • Digital Toss
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black uppercase tracking-widest">
                  Live Setup
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium">
                {displayTeamA} <span className="text-amber-400 font-bold">vs</span> {displayTeamB}
              </p>
            </div>
          </div>

          <button
            onClick={() => !isSpinning && onClose()}
            disabled={isSpinning}
            className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all cursor-pointer disabled:opacity-40 border border-stone-700"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Calling Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Calling Team */}
          <div className="bg-stone-950/60 p-3 rounded-2xl border border-stone-800">
            <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1.5">
              1. Calling Team (Captain in Middle)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => setCallingTeam('Team A')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black truncate transition-all cursor-pointer border ${
                  callingTeam === 'Team A'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {displayTeamA}
              </button>
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => setCallingTeam('Team B')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black truncate transition-all cursor-pointer border ${
                  callingTeam === 'Team B'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                    : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                {displayTeamB}
              </button>
            </div>
          </div>

          {/* Captain's Call */}
          <div className="bg-stone-950/60 p-3 rounded-2xl border border-stone-800">
            <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 block mb-1.5">
              2. Captain's Call in Air
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => setCallChoice('heads')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                  callChoice === 'heads'
                    ? 'bg-yellow-400 text-stone-950 border-yellow-300 shadow-sm'
                    : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                <span>👑 Heads</span>
              </button>
              <button
                type="button"
                disabled={isSpinning}
                onClick={() => setCallChoice('tails')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                  callChoice === 'tails'
                    ? 'bg-yellow-400 text-stone-950 border-yellow-300 shadow-sm'
                    : 'bg-stone-800/80 text-stone-300 border-stone-700 hover:bg-stone-700'
                }`}
              >
                <span>⚡ Tails</span>
              </button>
            </div>
          </div>
        </div>

        {/* Interactive 3D Coin Stage */}
        <div className="relative my-4 py-8 bg-gradient-to-b from-stone-950 to-stone-900 rounded-3xl border border-stone-800 flex flex-col items-center justify-center overflow-hidden shadow-inner">
          {/* Subtle Stage Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />

          {/* 3D Coin Component */}
          <div className="relative w-32 h-32 [perspective:1000px] flex items-center justify-center">
            <motion.div
              animate={{
                rotateY: spinDeg,
                y: isSpinning ? [-15, -45, -15] : 0,
                scale: isSpinning ? [1, 1.15, 1] : 1
              }}
              transition={{
                duration: isSpinning ? 1.6 : 0.6,
                ease: isSpinning ? [0.25, 1, 0.5, 1] : 'easeOut'
              }}
              className="w-28 h-28 relative [transform-style:preserve-3d] cursor-pointer select-none"
              onClick={handleSpinCoin}
              title="Click to Spin Coin"
            >
              {/* FRONT SIDE (HEADS) */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 border-4 border-yellow-200 shadow-2xl flex flex-col items-center justify-center p-3 text-stone-950 [backface-visibility:hidden]"
                style={{
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.45), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.5)'
                }}
              >
                <div className="w-full h-full rounded-full border border-dashed border-amber-900/40 flex flex-col items-center justify-center relative">
                  <span className="text-[9px] font-black tracking-widest uppercase text-amber-950">GULLY</span>
                  <div className="text-2xl my-0.5">👑</div>
                  <span className="text-xs font-black tracking-widest uppercase text-stone-950">HEADS</span>
                  <span className="text-[8px] font-black text-amber-900/80 mt-0.5">₹ 1</span>
                </div>
              </div>

              {/* BACK SIDE (TAILS) */}
              <div 
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-700 via-amber-400 to-yellow-300 border-4 border-yellow-200 shadow-2xl flex flex-col items-center justify-center p-3 text-stone-950 [backface-visibility:hidden] [transform:rotateY(180deg)]"
                style={{
                  boxShadow: '0 0 25px rgba(245, 158, 11, 0.45), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.5)'
                }}
              >
                <div className="w-full h-full rounded-full border border-dashed border-amber-900/40 flex flex-col items-center justify-center relative">
                  <span className="text-[9px] font-black tracking-widest uppercase text-amber-950">CRICKET</span>
                  <div className="text-2xl my-0.5">🏏</div>
                  <span className="text-xs font-black tracking-widest uppercase text-stone-950">TAILS</span>
                  <span className="text-[8px] font-black text-amber-900/80 mt-0.5">MATCH</span>
                </div>
              </div>
            </motion.div>

            {/* Dynamic Coin Shadow */}
            <motion.div
              animate={{
                scale: isSpinning ? [1, 0.55, 1] : 1,
                opacity: isSpinning ? [0.4, 0.15, 0.4] : 0.4
              }}
              transition={{
                duration: isSpinning ? 1.6 : 0.6,
                repeat: isSpinning ? Infinity : 0
              }}
              className="absolute -bottom-4 w-20 h-3 rounded-full bg-amber-950/80 blur-md pointer-events-none"
            />
          </div>

          {/* Status Text Under Coin */}
          <div className="mt-6 text-center z-10">
            {isSpinning ? (
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider animate-pulse">
                <RotateCcw size={14} className="animate-spin" />
                <span>Coin is spinning in the air... Call: {callChoice.toUpperCase()}</span>
              </div>
            ) : landedSide ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <span>Coin Landed:</span>
                  <strong className="text-white text-sm">{landedSide.toUpperCase()}</strong>
                </div>
                <p className="text-xs font-bold text-emerald-400">
                  {callChoice === landedSide 
                    ? `✓ ${currentCallingTeamName} called correctly!` 
                    : `✗ ${currentCallingTeamName} lost call, ${winnerTeamName} wins!`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-stone-400 font-medium">
                {currentCallingTeamName} calling <strong className="text-amber-400 uppercase">{callChoice}</strong> • Tap Spin Coin to flip
              </p>
            )}
          </div>
        </div>

        {/* Winner & Election Option (When coin has landed) */}
        {landedSide && tossWinnerKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-stone-800 to-amber-500/15 border border-emerald-500/40 mb-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-400" />
                <span className="font-extrabold text-sm text-white">
                  {winnerTeamName} won the toss!
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500 text-stone-950 font-black text-[9px] uppercase rounded-md tracking-wider">
                Winner
              </span>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-300 block mb-1.5">
                What does {winnerTeamName} choose to do?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setElectedDecision('bat')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    electedDecision === 'bat'
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  <span>🏏 Bat First</span>
                </button>
                <button
                  type="button"
                  onClick={() => setElectedDecision('bowl')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                    electedDecision === 'bowl'
                      ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                  }`}
                >
                  <span>🥎 Bowl First</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleSpinCoin}
            disabled={isSpinning}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50 border-none"
          >
            <RotateCcw size={14} className={isSpinning ? 'animate-spin' : ''} />
            <span>{isSpinning ? 'Spinning Coin...' : landedSide ? 'Spin Coin Again 🔄' : 'Spin Coin Now 🪙'}</span>
          </button>

          {landedSide && tossWinnerKey && (
            <button
              type="button"
              onClick={handleApply}
              className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer border-none animate-bounce"
            >
              <Check size={16} />
              <span>Apply to Setup ✓</span>
            </button>
          )}
        </div>

        {/* Recent Toss Log */}
        {spinHistory.length > 0 && (
          <div className="mt-4 pt-3 border-t border-stone-800">
            <span className="text-[9px] font-mono uppercase text-stone-500 block mb-1.5">
              Recent Coin Spins in this session:
            </span>
            <div className="space-y-1">
              {spinHistory.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[10px] text-stone-400 bg-stone-950/40 px-2.5 py-1 rounded-lg">
                  <span>
                    Landed <strong className="text-amber-400 uppercase">{item.side}</strong> • <span className="text-white font-bold">{item.winner}</span> chose {item.choice.toUpperCase()}
                  </span>
                  <span className="font-mono text-stone-500 text-[9px]">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
