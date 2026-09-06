import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, RefreshCw, X, Award, CloudRain, Save, AlertCircle } from 'lucide-react';

interface DLSCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstInningsRuns?: number;
  firstInningsOvers?: number;
  onApplyRevisedTarget?: (revisedTarget: number, revisedOvers: number) => void;
  matchState?: any;
}

// Convert visual/decimal overs (like 5.3) into real fractional overs (like 5.5)
const convertToFractionalOvers = (overs: number): number => {
  const integerPart = Math.floor(overs);
  const decimalPart = Math.round((overs - integerPart) * 10);
  if (decimalPart >= 6) {
    return integerPart + 1;
  }
  return integerPart + (decimalPart / 6);
};

// Standard Resource Table (Over remaining -> % Resource for standard 20 overs match)
// Approximated by formula: R = 100 * (1 - e^(-0.056 * oversRemaining)) with correction factors for wickets
const calculateResource = (oversRemaining: number, wicketsLost: number): number => {
  if (oversRemaining <= 0) return 0;
  if (wicketsLost >= 10) return 0;
  // Wicket factor: resources scale down with wickets lost
  // 0 wickets lost = 1.0, 9 wickets lost = 0.05
  const wicketFactors = [1.0, 0.93, 0.85, 0.76, 0.65, 0.52, 0.38, 0.25, 0.13, 0.05];
  const factor = wicketFactors[wicketsLost];
  
  // Exponential recovery scale
  const r = 100 * (1 - Math.exp(-0.065 * oversRemaining)) * factor;
  return Math.min(Math.max(Number(r.toFixed(1)), 0.1), 100);
};

const getNormalizedResource = (oversRemaining: number, wicketsLost: number, totalOvers: number): number => {
  if (oversRemaining <= 0) return 0;
  if (totalOvers <= 0) return 100;
  
  const baseRes = calculateResource(totalOvers, 0);
  const currentRawRes = calculateResource(oversRemaining, wicketsLost);
  
  return Math.min(Math.max((currentRawRes / baseRes) * 100, 0), 100);
};

export const DLSCalculatorModal: React.FC<DLSCalculatorModalProps> = ({
  isOpen,
  onClose,
  firstInningsRuns = 120,
  firstInningsOvers = 10,
  onApplyRevisedTarget,
  matchState
}) => {
  // Input states
  const [t1Runs, setT1Runs] = useState<number>(firstInningsRuns);
  const [t1TotalOvers, setT1TotalOvers] = useState<number>(firstInningsOvers);
  
  // Rain 1 Details (Suspension in Innings 1, if any)
  const [isSuspendedInn1, setIsSuspendedInn1] = useState<boolean>(false);
  const [t1OversBatted, setT1OversBatted] = useState<number>(firstInningsOvers);
  const [t1WicketsLost, setT1WicketsLost] = useState<number>(0);
  
  // Rain 2 Details (Suspension in Innings 2)
  const [t2OversAllocated, setT2OversAllocated] = useState<number>(firstInningsOvers);
  const [t2OversBattedSoFar, setT2OversBattedSoFar] = useState<number>(0);
  const [t2WicketsLost, setT2WicketsLost] = useState<number>(0);

  // Auto-synchronize inputs with live MatchState when opened
  useEffect(() => {
    if (isOpen) {
      if (matchState) {
        const t1Total = matchState.oversLimit || 10;
        setT1TotalOvers(t1Total);
        
        const t1RunsVal = matchState.innings1 ? matchState.innings1.runs : 100;
        setT1Runs(t1RunsVal);
        
        if (matchState.innings1) {
          const t1Balls = matchState.innings1.ballsBowled || 0;
          const t1OversPlay = parseFloat((Math.floor(t1Balls / 6) + (t1Balls % 6) / 10).toFixed(1));
          setT1OversBatted(t1OversPlay);
          setT1WicketsLost(matchState.innings1.wickets || 0);
          
          if (t1Balls < t1Total * 6 && matchState.currentInningsNum === 2) {
            setIsSuspendedInn1(true);
          } else {
            setIsSuspendedInn1(false);
          }
        }
        
        setT2OversAllocated(matchState.oversLimit || t1Total);
        if (matchState.innings2) {
          const t2Balls = matchState.innings2.ballsBowled || 0;
          const t2OversPlay = parseFloat((Math.floor(t2Balls / 6) + (t2Balls % 6) / 10).toFixed(1));
          setT2OversBattedSoFar(t2OversPlay);
          setT2WicketsLost(matchState.innings2.wickets || 0);
        } else {
          setT2OversBattedSoFar(0);
          setT2WicketsLost(0);
        }
      } else {
        setT1Runs(firstInningsRuns);
        setT1TotalOvers(firstInningsOvers);
        setT1OversBatted(firstInningsOvers);
        setT2OversAllocated(firstInningsOvers);
        setIsSuspendedInn1(false);
        setT1WicketsLost(0);
        setT2OversBattedSoFar(0);
        setT2WicketsLost(0);
      }
    }
  }, [isOpen, firstInningsRuns, firstInningsOvers, matchState]);

  // Compute Resources
  const calculateDLS = () => {
    const totalOversFractional = convertToFractionalOvers(t1TotalOvers);
    
    // 1. Calculate Team 1 Resources
    let r1 = 100;
    if (isSuspendedInn1) {
      const oversBattedFractional = convertToFractionalOvers(t1OversBatted);
      const oversLost1 = Math.max(0, totalOversFractional - oversBattedFractional);
      const resourceLost1 = getNormalizedResource(oversLost1, t1WicketsLost, totalOversFractional);
      r1 = Math.max(0.1, 100 - resourceLost1);
    } else {
      r1 = 100; // Normalized base
    }

    // 2. Calculate Team 2 Resources
    const t2OversAllocatedFractional = convertToFractionalOvers(t2OversAllocated);
    const r2 = getNormalizedResource(t2OversAllocatedFractional, 0, totalOversFractional);

    // 3. Formula for Revised Target
    let revisedTarget = 0;
    let explanation = '';
    
    if (r2 < r1) {
      revisedTarget = Math.floor(t1Runs * (r2 / r1)) + 1;
      explanation = `Since Team 2 has less resource (${r2.toFixed(1)}%) than Team 1 (${r1.toFixed(1)}%), the target is reduced proportionally.`;
    } else if (r2 > r1) {
      const standardRefRuns = totalOversFractional * 7.5;
      const additionalResourceFactor = (r2 - r1) / 100;
      revisedTarget = t1Runs + Math.floor(standardRefRuns * additionalResourceFactor) + 1;
      explanation = `Since Team 2 has more resource (${r2.toFixed(1)}%) than Team 1 (${r1.toFixed(1)}%), the target is increased based on standard run scoring index of ${standardRefRuns.toFixed(1)} runs.`;
    } else {
      revisedTarget = t1Runs + 1;
      explanation = `Both teams have equal resources (${r2.toFixed(1)}%). Standard target is applied.`;
    }

    // Par Score for current suspended state in Innings 2
    const t2OversBattedSoFarFractional = convertToFractionalOvers(t2OversBattedSoFar);
    const t2OversLeftFractional = Math.max(0, t2OversAllocatedFractional - t2OversBattedSoFarFractional);
    const t2StartResource = getNormalizedResource(t2OversAllocatedFractional, 0, totalOversFractional);
    const t2RemainingResource = getNormalizedResource(t2OversLeftFractional, t2WicketsLost, totalOversFractional);
    const t2CurrentResource = Math.max(0, t2StartResource - t2RemainingResource);
    const parScore = Math.floor(t1Runs * (t2CurrentResource / r1));

    return {
      r1,
      r2,
      revisedTarget: Math.max(revisedTarget, 1),
      parScore: Math.max(parScore, 0),
      explanation
    };
  };

  const dlsResult = calculateDLS();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CloudRain size={20} className="animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-tight leading-none">DLS Calculator System</h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">Official Duckworth-Lewis-Stern Gully Protocol</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border-none cursor-pointer text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-350 font-sans">
              
              {/* Top Warning Banner */}
              <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium leading-relaxed">
                  <strong>Standard Rain/Disruption Policy:</strong> Enter first innings scores, resources available, and revised overs setup for automatic targets. Can be applied directly back to the active match!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hand 1: Team 1 (First Innings) Controls */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block border-b border-indigo-500/15 pb-1.5 mb-2 leading-none">FIRST INNINGS (TEAM 1)</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">T1 Total Runs</label>
                      <input
                        type="number"
                        value={t1Runs}
                        onChange={(e) => setT1Runs(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-850 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Overs</label>
                      <input
                        type="number"
                        value={t1TotalOvers}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 1);
                          setT1TotalOvers(val);
                          setT1OversBatted(val);
                          setT2OversAllocated(val);
                        }}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Suspension toggle for T1 */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold leading-none select-none text-xs text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isSuspendedInn1}
                        onChange={(e) => setIsSuspendedInn1(e.target.checked)}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      <span>Innings 1 was interrupted by rain</span>
                    </label>
                  </div>

                  {isSuspendedInn1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Overs played</label>
                          <input
                            type="number"
                            step="0.1"
                            value={t1OversBatted}
                            onChange={(e) => setT1OversBatted(Math.min(t1TotalOvers, Math.max(0, parseFloat(e.target.value) || 0)))}
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs font-black"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Wickets lost</label>
                          <input
                            type="number"
                            value={t1WicketsLost}
                            onChange={(e) => setT1WicketsLost(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-xl text-xs font-black"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-white/40 dark:bg-slate-900 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="text-[8.5px] font-extrabold uppercase tracking-widest block text-slate-400 leading-none">Resultant T1 Resource Base</span>
                    <strong className="text-lg font-black text-indigo-500 block mt-1">{dlsResult.r1.toFixed(1)}%</strong>
                  </div>
                </div>

                {/* Hand 2: Team 2 (Second Innings) Controls */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850">
                  <span className="text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest block border-b border-purple-500/15 pb-1.5 mb-2 leading-none">SECOND INNINGS (TEAM 2)</span>
                  
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1 font-sans">Revised Overs Allocated for Batting 2nd</label>
                    <input
                      type="number"
                      value={t2OversAllocated}
                      onChange={(e) => setT2OversAllocated(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-850 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Overs played so far</label>
                      <input
                        type="number"
                        step="0.1"
                        value={t2OversBattedSoFar}
                        onChange={(e) => setT2OversBattedSoFar(Math.min(t2OversAllocated, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-850 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Wickets lost</label>
                      <input
                        type="number"
                        value={t2WicketsLost}
                        onChange={(e) => setT2WicketsLost(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="text-[8.5px] font-extrabold uppercase tracking-widest block text-slate-400 leading-none">Resultant T2 Resource Base</span>
                    <strong className="text-lg font-black text-purple-500 block mt-1">{dlsResult.r2.toFixed(1)}%</strong>
                  </div>
                </div>

              </div>

              {/* Main DLS Calculation Result Panel */}
              <div className="bg-slate-900 text-white rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 opacity-[0.035] select-none pointer-events-none">
                  <CloudRain size={240} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 items-center">
                  
                  {/* Left Column: Par Score & Target */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase block leading-none">REVISED TARGET (FOR INNINGS)</span>
                        <strong className="text-4xl font-extrabold tracking-tight text-white block mt-2 text-emerald-400">
                          {dlsResult.revisedTarget} <span className="text-lg font-normal text-slate-400">runs</span>
                        </strong>
                        <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                          Must score {dlsResult.revisedTarget} runs in {t2OversAllocated} overs
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black tracking-widest text-purple-400 uppercase block leading-none">LIVE PAR SCORE (AT STOPPAGE)</span>
                        <strong className="text-4xl font-extrabold tracking-tight text-white block mt-2 text-amber-300">
                          {dlsResult.parScore} <span className="text-lg font-normal text-slate-400">runs</span>
                        </strong>
                        <span className="text-[10px] text-slate-400 block mt-1 font-semibold">
                          If rain stops play now, par is {dlsResult.parScore} runs
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-slate-300 leading-relaxed max-w-md pt-2 border-t border-white/5 font-medium">
                      {dlsResult.explanation}
                    </p>
                  </div>

                  {/* Right Column: Mini comparative visual bar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 space-y-3 shrink-0">
                    <span className="text-[8px] font-black tracking-widest text-slate-400 block uppercase leading-none">Resource Balance Gauge</span>
                    
                    <div className="space-y-1.5 font-bold">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>T1 Resources</span>
                        <span>{dlsResult.r1.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${dlsResult.r1}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1.5 font-bold">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>T2 Resources</span>
                        <span>{dlsResult.r2.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${dlsResult.r2}%` }} />
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between bg-slate-50 dark:bg-slate-900/60 font-sans">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase leading-loose block select-none">
                GullyScore DLS v2.10 Pro Max
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-slate-100 text-slate-650 dark:text-slate-300 transition-colors"
                >
                  Close Panel
                </button>
                {onApplyRevisedTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyRevisedTarget(dlsResult.revisedTarget, t2OversAllocated);
                      onClose();
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer border-none transition-transform active:scale-95 flex items-center gap-1.5 shadow-md"
                  >
                    <Save size={14} /> Apply to Live Scoreboard
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
