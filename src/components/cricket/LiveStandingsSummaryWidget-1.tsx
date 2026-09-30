import React, { useState } from 'react';
import { Trophy, ChevronDown, ChevronUp, Star, Users, Calendar, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CompactStandingRow {
  id: string;
  name: string;
  captain: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  NRR: number;
}

interface LiveStandingsSummaryWidgetProps {
  standings: CompactStandingRow[];
  tournamentName: string;
  isLeague: boolean;
}

export const LiveStandingsSummaryWidget: React.FC<LiveStandingsSummaryWidgetProps> = ({
  standings,
  tournamentName,
  isLeague
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get logo background class based on team name hash to make team colors beautiful and unique
  const getTeamColor = (name: string) => {
    const gradients = [
      'from-blue-600 to-indigo-650',
      'from-yellow-500 to-amber-600',
      'from-red-650 to-rose-700',
      'from-purple-650 to-fuchsia-800',
      'from-emerald-500 to-teal-700',
      'from-sky-500 to-blue-600',
      'from-slate-700 to-slate-900',
      'from-orange-500 to-red-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  return (
    <div className="bg-gradient-to-r from-emerald-500/5 via-indigo-500/[0.02] to-transparent border border-slate-200/60 dark:border-slate-800/20 rounded-[1.5rem] sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden transition-all shadow-sm">
      {/* Background ambient elements */}
      <div className="absolute right-0 top-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-550/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-indigo-500/[0.02] rounded-full blur-2xl pointer-events-none" />

      {/* Header Panel */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 sm:p-2.5 bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-450 rounded-xl">
            <Trophy size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9.5px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-0.5 px-2 rounded-full border border-emerald-500/10">
                {isLeague ? 'Live Standings' : 'Championship Progress'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold select-none">• Interactive Dashboard</span>
            </div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white mt-0.5">
              Current Points & Leaderboard Summary
            </h4>
          </div>
        </div>

        {/* Expand-Collapse Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 border border-slate-200/50 dark:border-slate-800/40 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl font-bold uppercase text-[10px] sm:text-2xs tracking-widest cursor-pointer shadow-sm flex items-center gap-1.5 transition-all select-none shrink-0"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp size={12} />
            </>
          ) : (
            <>
              <span>Show Standings ({standings.length})</span>
              <ChevronDown size={12} />
            </>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="overflow-hidden"
          >
            {/* Divider */}
            <div className="h-px bg-slate-200/40 dark:bg-slate-800/20 mb-4" />

            {/* Compact Points Table */}
            <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200/40 dark:border-slate-800/10 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm p-1">
              <table className="w-full text-left text-xs uppercase font-extrabold tracking-wide border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-200/40 dark:border-slate-800/20 text-slate-400 text-[10px] font-black">
                    <th className="py-2.5 px-2 text-center w-10">Pos</th>
                    <th className="py-2.5 px-3">Squad / Team</th>
                    <th className="py-2.5 px-2 text-center w-10">P</th>
                    <th className="py-2.5 px-2 text-center w-10 text-emerald-600">W</th>
                    <th className="py-2.5 px-2 text-center w-10 text-rose-500">L</th>
                    <th className="py-2.5 px-2 text-center w-10">T</th>
                    <th className="py-2.5 px-3 text-center w-20">NRR</th>
                    <th className="py-2.5 px-3 text-center bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-black w-14 rounded-t-xl">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                            <Users size={20} className="animate-pulse" />
                          </div>
                          <span className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wide">
                            No Squads Registered Yet
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase leading-normal">
                            Add squads in the "Registered Squads" section below to construct the Points Table.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    standings.map((t, idx) => {
                      const gradientClass = getTeamColor(t.name);
                      return (
                        <tr 
                          key={t.id}
                          className="border-b border-slate-100/50 dark:border-slate-850/30 hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          {/* Position */}
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-flex items-center justify-center w-5.5 h-5.5 rounded-md text-[9.5px] font-black ${
                              idx === 0 ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20' :
                              idx === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300' :
                              idx === 2 ? 'bg-amber-600/10 text-amber-700 dark:text-amber-500' :
                              'text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>

                          {/* Team Name */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gradientClass} border border-white/20 shadow-sm shrink-0`} />
                              <div className="flex flex-col text-left">
                                <span className="font-extrabold text-slate-800 dark:text-white text-[11px] truncate max-w-[150px] sm:max-w-xs lowercase first-letter:uppercase">
                                  {t.name}
                                </span>
                                <span className="text-[8px] text-slate-400 font-semibold lowercase">
                                  Capt: {t.captain || 'None Assigned'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Stats Metrics */}
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-500">{t.played}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-500">{t.won}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-rose-500">{t.lost}</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400">{t.tied}</td>

                          {/* Net Runrate */}
                          <td className="py-2.5 px-3 text-center">
                            <span className={`font-mono text-[10px] font-black ${
                              t.NRR > 0 ? 'text-emerald-500' : t.NRR < 0 ? 'text-rose-500' : 'text-slate-405'
                            }`}>
                              {t.NRR > 0 ? `+${t.NRR.toFixed(3)}` : t.NRR.toFixed(3)}
                            </span>
                          </td>

                          {/* Points */}
                          <td className="py-2.5 px-3 text-center bg-emerald-500/[0.02] font-black text-emerald-500 text-xs">{t.points}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
