import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Crown, Shield, Zap, Sparkles, X, 
  Download, Share2, Users, Flame, Award, CheckCircle2, ChevronRight
} from 'lucide-react';
import { 
  generateTournamentDreamTeam, 
  TournamentDreamTeamResult, 
  DreamTeamPlayer 
} from './modules/TournamentDreamTeamCalculator';

interface TournamentDreamTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    id: string;
    name: string;
    teams?: any[];
    matches?: any[];
    winnerTeamName?: string | null;
  };
}

export const TournamentDreamTeamModal: React.FC<TournamentDreamTeamModalProps> = ({
  isOpen,
  onClose,
  tournament
}) => {
  const [activeRoleFilter, setActiveRoleFilter] = useState<'ALL' | 'WK' | 'BAT' | 'AR' | 'BOWL'>('ALL');
  const [viewMode, setViewMode] = useState<'pitch' | 'cards'>('pitch');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const dreamCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const dreamTeamData: TournamentDreamTeamResult = generateTournamentDreamTeam(tournament);

  const filteredPlayers = activeRoleFilter === 'ALL'
    ? dreamTeamData.dreamXI
    : dreamTeamData.dreamXI.filter(p => p.dreamRole === activeRoleFilter);

  const copyDreamTeamToClipboard = () => {
    const lines = [
      `🌟 OFFICIAL TOURNAMENT DREAM XI: ${tournament.name} 🌟`,
      `🏆 Total Fantasy Points: ${dreamTeamData.totalTeamFantasyPoints.toLocaleString()}`,
      `👑 Captain: ${dreamTeamData.captain.playerName} (${dreamTeamData.captain.teamName})`,
      `⭐ Vice Captain: ${dreamTeamData.viceCaptain.playerName} (${dreamTeamData.viceCaptain.teamName})`,
      ``,
      `TEAM LINEUP:`,
      ...dreamTeamData.dreamXI.map((p, idx) => {
        const badge = p.isCaptain ? ' [C]' : p.isViceCaptain ? ' [VC]' : '';
        const roleStr = p.dreamRole === 'WK' ? '🧤 WK' : p.dreamRole === 'BAT' ? '🏏 BAT' : p.dreamRole === 'AR' ? '⚡ ALL' : '🎯 BOWL';
        return `${idx + 1}. ${p.playerName}${badge} (${p.teamName}) - ${roleStr} | ${p.fantasyPoints} Pts`;
      }),
      ``,
      `🔥 12th Man (Impact Sub): ${dreamTeamData.twelfthMan.playerName} (${dreamTeamData.twelfthMan.teamName})`,
      `\n⚡ Live Tournament Scoring Applet`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[210] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-6 py-4 flex items-center justify-between text-slate-950 select-none shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Sparkles size={20} className="text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                  CricHeroes Fantasy Engine
                </span>
                <span className="text-[10px] font-bold text-slate-900 uppercase">Official Selection</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950 leading-tight">
                Tournament Dream XI (Best 11)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyDreamTeamToClipboard}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider border-none cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
            >
              {copiedNotification ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Share2 size={13} />}
              <span>{copiedNotification ? 'Copied!' : 'Share Dream XI'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 flex items-center justify-center font-bold text-base border-none cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Sub-header Banner & Controls */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Crown size={14} className="text-amber-400" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">Captain:</span>
              <span className="font-extrabold text-white">{dreamTeamData.captain.playerName}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Star size={13} className="text-sky-400" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">Vice Captain:</span>
              <span className="font-extrabold text-white">{dreamTeamData.viceCaptain.playerName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={13} className="text-rose-400" />
              <span className="text-slate-400 font-bold uppercase text-[10px]">Fantasy Pts:</span>
              <span className="font-mono font-black text-amber-400">{dreamTeamData.totalTeamFantasyPoints.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-[10px] font-black uppercase">
              <button
                onClick={() => setViewMode('pitch')}
                className={`px-3 py-1 rounded-lg border-none cursor-pointer transition-all ${
                  viewMode === 'pitch' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                Pitch View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg border-none cursor-pointer transition-all ${
                  viewMode === 'cards' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                Roster Grid
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left" ref={dreamCardRef}>
          {viewMode === 'pitch' ? (
            /* STADIUM CRICKET PITCH FORMATION */
            <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 p-6 sm:p-8 shadow-2xl">
              {/* Pitch Grass Marking Lines */}
              <div className="absolute inset-x-12 inset-y-6 border-2 border-dashed border-emerald-500/20 rounded-[2.5rem] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-72 bg-amber-900/10 border-2 border-amber-600/20 rounded-xl pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                {/* 1. WICKET-KEEPER ROW */}
                <div className="text-center">
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400/70 block mb-2">
                    WICKET-KEEPER
                  </span>
                  <div className="flex justify-center">
                    {dreamTeamData.dreamXI.filter(p => p.dreamRole === 'WK').map(p => (
                      <PlayerPitchBadge key={p.playerName} player={p} />
                    ))}
                  </div>
                </div>

                {/* 2. TOP BATSMEN ROW */}
                <div className="text-center">
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400/70 block mb-2">
                    BATSMEN
                  </span>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
                    {dreamTeamData.dreamXI.filter(p => p.dreamRole === 'BAT').map(p => (
                      <PlayerPitchBadge key={p.playerName} player={p} />
                    ))}
                  </div>
                </div>

                {/* 3. ALL-ROUNDERS ROW */}
                <div className="text-center">
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400/70 block mb-2">
                    ALL-ROUNDERS
                  </span>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-8">
                    {dreamTeamData.dreamXI.filter(p => p.dreamRole === 'AR').map(p => (
                      <PlayerPitchBadge key={p.playerName} player={p} />
                    ))}
                  </div>
                </div>

                {/* 4. BOWLERS ROW */}
                <div className="text-center">
                  <span className="text-[9px] font-black tracking-widest uppercase text-emerald-400/70 block mb-2">
                    SPECIALIST BOWLERS
                  </span>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
                    {dreamTeamData.dreamXI.filter(p => p.dreamRole === 'BOWL').map(p => (
                      <PlayerPitchBadge key={p.playerName} player={p} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ROSTER CARDS VIEW */
            <div className="space-y-4">
              {/* Role filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {(['ALL', 'WK', 'BAT', 'AR', 'BOWL'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setActiveRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      activeRoleFilter === role
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {role === 'ALL' ? 'All 11 Players' : role === 'WK' ? 'Wicket-Keepers' : role === 'BAT' ? 'Batsmen' : role === 'AR' ? 'All-Rounders' : 'Bowlers'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPlayers.map((p, idx) => (
                  <div
                    key={p.playerName}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-amber-400/60 transition-all flex flex-col justify-between relative overflow-hidden"
                  >
                    {p.isCaptain && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase shadow">
                        <Crown size={11} /> Captain (2x Pts)
                      </div>
                    )}
                    {p.isViceCaptain && !p.isCaptain && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-black text-[9px] uppercase shadow">
                        <Star size={11} /> Vice Captain (1.5x)
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center font-black text-sm text-white shrink-0 shadow-inner">
                        {p.playerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-0.5 pr-14">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider inline-block ${
                          p.dreamRole === 'WK' ? 'bg-amber-400/20 text-amber-300' :
                          p.dreamRole === 'BAT' ? 'bg-sky-400/20 text-sky-300' :
                          p.dreamRole === 'AR' ? 'bg-purple-400/20 text-purple-300' :
                          'bg-emerald-400/20 text-emerald-300'
                        }`}>
                          {p.dreamRole}
                        </span>
                        <h4 className="font-extrabold text-sm text-white truncate">{p.playerName}</h4>
                        <p className="text-[11px] text-slate-400 truncate">{p.teamName}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900/60 p-1.5 rounded-xl">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Runs</span>
                        <span className="font-mono font-black text-xs text-white">{p.runs}</span>
                      </div>
                      <div className="bg-slate-900/60 p-1.5 rounded-xl">
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Wickets</span>
                        <span className="font-mono font-black text-xs text-white">{p.wickets}</span>
                      </div>
                      <div className="bg-slate-900/60 p-1.5 rounded-xl">
                        <span className="text-[9px] text-amber-400 block uppercase font-bold">Fantasy</span>
                        <span className="font-mono font-black text-xs text-amber-400">{p.fantasyPoints}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12th Man / Impact Player Banner */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                  Official 12th Man / Impact Sub
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  {dreamTeamData.twelfthMan.playerName} ({dreamTeamData.twelfthMan.teamName})
                </h4>
                <p className="text-[11px] text-slate-400">
                  {dreamTeamData.twelfthMan.runs} Runs • {dreamTeamData.twelfthMan.wickets} Wickets • {dreamTeamData.twelfthMan.fantasyPoints} Fantasy Points
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-slate-900 text-xs font-mono font-black text-amber-400 border border-slate-700">
              Reserve
            </span>
          </div>

          {/* Team Balance Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Batting Depth</span>
              <div className="flex items-center justify-between">
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mr-3">
                  <div className="bg-sky-400 h-full rounded-full" style={{ width: `${dreamTeamData.teamBalanceRating.battingDepth}%` }} />
                </div>
                <span className="font-mono font-black text-xs text-sky-400">{dreamTeamData.teamBalanceRating.battingDepth}%</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Bowling Arsenal</span>
              <div className="flex items-center justify-between">
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mr-3">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${dreamTeamData.teamBalanceRating.bowlingStrength}%` }} />
                </div>
                <span className="font-mono font-black text-xs text-emerald-400">{dreamTeamData.teamBalanceRating.bowlingStrength}%</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">All-Round Balance</span>
              <div className="flex items-center justify-between">
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mr-3">
                  <div className="bg-purple-400 h-full rounded-full" style={{ width: `${dreamTeamData.teamBalanceRating.allRoundBalance}%` }} />
                </div>
                <span className="font-mono font-black text-xs text-purple-400">{dreamTeamData.teamBalanceRating.allRoundBalance}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">
            Calculated automatically from player match scorecards using CricHeroes standard tournament points.
          </p>
          <button
            onClick={copyDreamTeamToClipboard}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black uppercase text-xs rounded-xl border-none cursor-pointer shadow-md hover:brightness-110 flex items-center gap-1.5"
          >
            <Share2 size={14} />
            <span>Copy Tournament Dream XI</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Tactical badge rendered on the cricket pitch
const PlayerPitchBadge: React.FC<{ player: DreamTeamPlayer }> = ({ player }) => {
  return (
    <div className="flex flex-col items-center group cursor-pointer">
      <div className="relative">
        {player.isCaptain && (
          <div className="absolute -top-2.5 -right-2.5 z-10 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-md border border-white">
            C
          </div>
        )}
        {player.isViceCaptain && !player.isCaptain && (
          <div className="absolute -top-2.5 -right-2.5 z-10 w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center font-black text-[9px] shadow-md border border-white">
            VC
          </div>
        )}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 border-2 flex items-center justify-center font-black text-xs sm:text-sm text-white shadow-xl transition-transform group-hover:scale-110 ${
          player.isCaptain ? 'border-amber-400' : player.isViceCaptain ? 'border-sky-400' : 'border-emerald-400/60'
        }`}>
          {player.playerName.slice(0, 2).toUpperCase()}
        </div>
      </div>
      <span className="mt-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 text-white font-extrabold text-[10px] max-w-[100px] truncate shadow border border-white/10">
        {player.playerName}
      </span>
      <span className="text-[9px] font-mono font-bold text-amber-300">
        {player.fantasyPoints} Pts
      </span>
    </div>
  );
};
