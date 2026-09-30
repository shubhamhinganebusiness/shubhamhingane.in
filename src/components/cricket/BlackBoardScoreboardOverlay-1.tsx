import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Edit3, Check, RefreshCw } from 'lucide-react';
import type { MatchState } from './types';

interface BlackBoardScoreboardOverlayProps {
  match: MatchState;
  onClose?: () => void;
  onUpdateValues?: (runs: number, balls: number) => void;
  position?: 'bottom-right' | 'center' | 'bottom-left' | 'top-right';
}

export const BlackBoardScoreboardOverlay: React.FC<BlackBoardScoreboardOverlayProps> = ({
  match,
  onClose,
  onUpdateValues,
  position = 'bottom-right',
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [manualRuns, setManualRuns] = useState<string>('');
  const [manualBalls, setManualBalls] = useState<string>('');

  // Determine current chase equation dynamically
  const equation = useMemo(() => {
    const curInn = match?.currentInnings === 2 ? match?.innings?.[1] : match?.innings?.[0];
    const isSecondInnings = match?.currentInnings === 2;

    const totalOvers = match?.totalOvers || 20;
    const totalBalls = totalOvers * 6;

    const targetRuns = match?.target || (match?.innings?.[0]?.runs ? match.innings[0].runs + 1 : 0);
    const currentRuns = curInn?.runs || 0;
    const oversBowled = curInn?.overs || 0;
    const ballsInCurrentOver = curInn?.balls || 0;
    const legalBallsBowled = oversBowled * 6 + ballsInCurrentOver;

    let runsNeeded = 24; // Default fallback matching reference screenshot
    let ballsRemaining = 6; // Default fallback matching reference screenshot

    if (isSecondInnings && targetRuns > 0) {
      runsNeeded = Math.max(0, targetRuns - currentRuns);
      ballsRemaining = Math.max(0, totalBalls - legalBallsBowled);
    } else if (!isSecondInnings && curInn) {
      // In 1st innings, calculate projected or to complete overs
      ballsRemaining = Math.max(0, totalBalls - legalBallsBowled);
      runsNeeded = Math.max(0, Math.round(((currentRuns || 1) / Math.max(1, legalBallsBowled)) * ballsRemaining));
    }

    // Check if custom override exists in overlayConfig
    const customConfig = (match?.overlayConfig as any)?.blackBoardConfig;
    if (customConfig?.runsNeeded !== undefined && customConfig.runsNeeded !== null) {
      runsNeeded = Number(customConfig.runsNeeded);
    }
    if (customConfig?.ballsRemaining !== undefined && customConfig.ballsRemaining !== null) {
      ballsRemaining = Number(customConfig.ballsRemaining);
    }

    return {
      runsNeeded,
      ballsRemaining,
      isSecondInnings,
      targetRuns,
    };
  }, [match]);

  const displayRuns = manualRuns !== '' ? manualRuns : equation.runsNeeded;
  const displayBalls = manualBalls !== '' ? manualBalls : equation.ballsRemaining;

  const handleSaveManual = () => {
    if (onUpdateValues) {
      onUpdateValues(Number(displayRuns), Number(displayBalls));
    }
    setIsEditing(false);
  };

  const handleResetToLive = () => {
    setManualRuns('');
    setManualBalls('');
    if (onUpdateValues) {
      onUpdateValues(equation.runsNeeded, equation.ballsRemaining);
    }
    setIsEditing(false);
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-16 right-16',
    'bottom-left': 'bottom-16 left-16',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-20 right-16',
  }[position] || 'bottom-16 right-16';

  // Don't show any overlay if chasing is not going on or in first inning
  if (!equation.isSecondInnings || equation.targetRuns <= 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className={`absolute ${positionClasses} z-50 select-none font-sans pointer-events-auto filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]`}
    >
      {/* =========================================================================
          BLACK BOARD CONTAINER (1:1 RECREATION OF USER'S REFERENCE IMAGE)
          Dark navy/black board with chamfered clipped corners & blue neon glow
          ========================================================================= */}
      <div
        className="relative bg-[#04081c] p-7 md:p-8 flex items-center justify-center gap-6 md:gap-8 border-2 border-[#123180] shadow-[0_0_35px_rgba(18,49,128,0.45),inset_0_0_25px_rgba(0,15,60,0.7)]"
        style={{
          clipPath:
            'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)',
          minWidth: '340px',
        }}
      >
        {/* Subtle inner grid lines or ambient sheen */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-transparent to-blue-950/20 pointer-events-none" />

        {/* Floating Quick Action Buttons (Edit / Close) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition-all cursor-pointer"
            title="Edit Runs & Balls"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-5 rounded-full bg-rose-600/40 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] transition-all cursor-pointer border border-rose-500/40"
              title="Close Black Board Overlay"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* COLUMN 1: NEED [24] RUNS */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            NEED
          </span>

          {/* Yellow Chamfered Badge */}
          {isEditing ? (
            <input
              type="number"
              value={displayRuns}
              onChange={(e) => setManualRuns(e.target.value)}
              className="w-24 text-center font-black text-3xl py-1 text-slate-950 bg-amber-400 border-2 border-blue-600 rounded outline-none"
              style={{
                clipPath:
                  'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
              }}
            />
          ) : (
            <div
              className="px-6 py-2.5 flex items-center justify-center min-w-[100px] border border-blue-600 shadow-[0_4px_16px_rgba(255,200,0,0.35)]"
              style={{
                background: 'linear-gradient(180deg, #ffe500 0%, #ffc000 48%, #e6a000 100%)',
                clipPath:
                  'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
              }}
            >
              <span className="text-slate-950 font-black text-4xl md:text-5xl tracking-tight text-center leading-none">
                {displayRuns}
              </span>
            </div>
          )}

          <span className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            RUNS
          </span>
        </div>

        {/* COLUMN 2: FROM [6] BALLS */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            FROM
          </span>

          {/* Yellow Chamfered Badge */}
          {isEditing ? (
            <input
              type="number"
              value={displayBalls}
              onChange={(e) => setManualBalls(e.target.value)}
              className="w-24 text-center font-black text-3xl py-1 text-slate-950 bg-amber-400 border-2 border-blue-600 rounded outline-none"
              style={{
                clipPath:
                  'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
              }}
            />
          ) : (
            <div
              className="px-6 py-2.5 flex items-center justify-center min-w-[100px] border border-blue-600 shadow-[0_4px_16px_rgba(255,200,0,0.35)]"
              style={{
                background: 'linear-gradient(180deg, #ffe500 0%, #ffc000 48%, #e6a000 100%)',
                clipPath:
                  'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)',
              }}
            >
              <span className="text-slate-950 font-black text-4xl md:text-5xl tracking-tight text-center leading-none">
                {displayBalls}
              </span>
            </div>
          )}

          <span className="text-white font-black text-2xl md:text-3xl tracking-widest uppercase mt-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            BALLS
          </span>
        </div>
      </div>

      {/* Editor controls when editing */}
      {isEditing && (
        <div className="mt-2 bg-slate-950/90 border border-white/10 rounded-xl p-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleSaveManual}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3 h-3" />
            <span>Apply</span>
          </button>
          <button
            type="button"
            onClick={handleResetToLive}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sync Live</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};
