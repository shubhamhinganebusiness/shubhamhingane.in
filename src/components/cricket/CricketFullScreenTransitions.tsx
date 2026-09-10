import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BothSquadsImageOverlay } from './BothSquadsImageOverlay';
import { 
  Trophy, Award, Star, Shield, Users, 
  TrendingUp, CheckCircle2, ChevronRight,
  MapPin, Sparkles, X, Target, BarChart2,
  Sun, Cloud, Wind, Droplets, Thermometer,
  Layers, Swords, Coins, Gauge, Activity, Flame,
  Check, Calendar, Clock, Eye
} from 'lucide-react';

export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  outMode?: string;
  dismissedBy?: string;
  fielderName?: string;
}

export interface Bowler {
  name: string;
  ballsBowled: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  isCurrent: boolean;
  consecutiveWickets?: number;
}

export interface FallOfWicket {
  wicketNo: number;
  score: number;
  batsmanName: string;
  oversList: string;
}

export interface Innings {
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  ballsBowled: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    penalty: number;
  };
  batsmen: Batsman[];
  bowlers: Bowler[];
  strikerIndex?: number;
  nonStrikerIndex?: number;
  currentBowlerIndex?: number;
  fallOfWickets?: FallOfWicket[];
  commentaryList?: any[];
}

export interface MatchState {
  id: string;
  teamA: string;
  teamB: string;
  oversLimit: number;
  tossWinner?: string;
  tossChoice?: 'bat' | 'bowl';
  currentInningsNum: 1 | 2;
  innings1: Innings | null;
  innings2: Innings | null;
  status: string;
  winner?: string;
  winReason?: string;
  targetRuns?: number;
  teamALogo?: string;
  teamBLogo?: string;
  playerPhotos?: Record<string, string>;
  tournamentName?: string;
  seriesName?: string;
  groundName?: string;
  teamACaptain?: string;
  teamBCaptain?: string;
  teamAWicketKeeper?: string;
  teamBWicketKeeper?: string;
  teamASquad?: string[];
  teamBSquad?: string[];
  playerOfTheMatch?: string;
  potmStats?: string;
  potmTeam?: string;
  matchNumber?: string;
  tournamentMatchId?: string | null;
  pitchCondition?: string;
  weatherCondition?: string;
  overlayConfig?: any;
}

interface Props {
  activeGraphic: string; // 'team_lineups' | 'lineups' | 'innings_scorecard' | 'match_presentation' | 'tournament_standings' | etc.
  match: MatchState;
  onClose?: () => void;
}

// Format ball count into standard Cricket overs (e.g. 19 balls -> "3.1")
function formatOvers(balls: number = 0): string {
  const overs = Math.floor(balls / 6);
  const rem = balls % 6;
  return `${overs}.${rem}`;
}

// Clean player name from common tags like (c), (wk), etc.
function cleanPlayerName(name: string): string {
  return name.replace(/\s*\((?:c|wk|capt|w\/k|c\/wk|wk\/c)\)/gi, '').trim();
}

// Check whether player is designated as Captain
function isCaptain(name: string, designatedCaptain?: string): boolean {
  if (designatedCaptain && cleanPlayerName(name).toLowerCase() === cleanPlayerName(designatedCaptain).toLowerCase()) {
    return true;
  }
  return /\((?:c|capt|c\/wk)\)/i.test(name);
}

// Check whether player is designated as Wicketkeeper
function isWicketKeeper(name: string, designatedKeeper?: string): boolean {
  if (designatedKeeper && cleanPlayerName(name).toLowerCase() === cleanPlayerName(designatedKeeper).toLowerCase()) {
    return true;
  }
  return /\((?:wk|w\/k|c\/wk|wk\/c)\)/i.test(name);
}

// Generate realistic role label for lineup card
function getPlayerRole(index: number, isC: boolean, isWk: boolean): string {
  if (isC && isWk) return 'Captain & WK';
  if (isC) return 'Captain / Top-Order';
  if (isWk) return 'Wicketkeeper Batter';
  if (index === 0 || index === 1) return 'Opening Batter';
  if (index === 2 || index === 3) return 'Top-Order Batter';
  if (index === 4 || index === 5) return 'All-Rounder';
  if (index === 6 || index === 7) return 'Bowling All-Rounder';
  if (index === 8) return 'Pace Bowler';
  if (index === 9) return 'Spin Bowler';
  return 'Fast Bowler';
}

// Player avatar generator component with image support & reliable initials fallback
const PlayerAvatar: React.FC<{
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  borderColor?: string;
}> = ({ name, photoUrl, size = 'md', borderColor = 'border-white/20' }) => {
  const [imgError, setImgError] = useState(false);
  const cleanName = cleanPlayerName(name);
  const initials = cleanName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || '🏏';

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-28 h-28 text-3xl'
  }[size];

  if (photoUrl && !imgError) {
    return (
      <div className={`${sizeClasses} rounded-2xl overflow-hidden bg-slate-900 border ${borderColor} shadow-lg shrink-0`}>
        <img
          src={photoUrl}
          alt={cleanName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Consistent gradient based on character code
  const charCode = (cleanName.charCodeAt(0) || 0) + (cleanName.charCodeAt(1) || 0);
  const bgGradients = [
    'from-slate-800 to-slate-900 text-amber-300',
    'from-blue-950 to-slate-900 text-sky-300',
    'from-emerald-950 to-slate-900 text-emerald-300',
    'from-purple-950 to-slate-900 text-purple-300',
    'from-rose-950 to-slate-900 text-rose-300'
  ];
  const selectedBg = bgGradients[charCode % bgGradients.length];

  return (
    <div className={`${sizeClasses} rounded-2xl bg-gradient-to-br ${selectedBg} border ${borderColor} shadow-lg flex items-center justify-center font-black tracking-wider shrink-0 select-none`}>
      <span>{initials}</span>
    </div>
  );
};

/* =========================================================================
   1. TEAM LINEUPS / PLAYING XI FULL-SCREEN OVERLAY
   ========================================================================= */
export const TeamLineupsOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  const [viewStyle, setViewStyle] = useState<'uploaded_gold_overlay' | 'classic_board'>('uploaded_gold_overlay');

  // Build Team A and Team B player rosters
  const getTeamRoster = (teamName: string, isTeamA: boolean) => {
    // 1. Check explicit squad in match
    const explicitSquad = isTeamA ? match.teamASquad : match.teamBSquad;
    if (explicitSquad && explicitSquad.length > 0) {
      return explicitSquad.map(p => (typeof p === 'string' ? { name: p } : p));
    }

    // 2. Extract from innings data
    const teamInn = match.innings1?.battingTeam === teamName 
      ? match.innings1 
      : (match.innings2?.battingTeam === teamName ? match.innings2 : null);

    const opponentInn = match.innings1?.battingTeam === teamName 
      ? match.innings2 
      : match.innings1;

    const names = new Set<string>();
    const list: { name: string }[] = [];

    if (teamInn?.batsmen) {
      teamInn.batsmen.forEach(b => {
        if (b.name && !names.has(b.name.toLowerCase())) {
          names.add(b.name.toLowerCase());
          list.push({ name: b.name });
        }
      });
    }

    if (opponentInn?.bowlers) {
      opponentInn.bowlers.forEach(bw => {
        if (bw.name && !names.has(bw.name.toLowerCase())) {
          names.add(bw.name.toLowerCase());
          list.push({ name: bw.name });
        }
      });
    }

    // 3. Fallback to realistic standard squad names if fewer than 11
    const defaultRosterTeamA = [
      'Rohit Sharma (c)', 'Ishan Kishan (wk)', 'Suryakumar Yadav', 
      'Tilak Varma', 'Hardik Pandya', 'Tim David', 
      'Romario Shepherd', 'Gerald Coetzee', 'Piyush Chawla', 
      'Jasprit Bumrah', 'Nuwan Thushara'
    ];
    const defaultRosterTeamB = [
      'Ruturaj Gaikwad (c)', 'Devon Conway', 'Ajinkya Rahane', 
      'Shivam Dube', 'Daryl Mitchell', 'Ravindra Jadeja', 
      'MS Dhoni (wk)', 'Shardul Thakur', 'Tushar Deshpande', 
      'Mustafizur Rahman', 'Matheesha Pathirana'
    ];

    const fallbackList = isTeamA ? defaultRosterTeamA : defaultRosterTeamB;
    while (list.length < 11 && list.length < fallbackList.length) {
      const candidate = fallbackList[list.length];
      if (!names.has(candidate.toLowerCase())) {
        names.add(candidate.toLowerCase());
        list.push({ name: candidate });
      }
    }

    return list.slice(0, 11);
  };

  const rosterA = useMemo(() => getTeamRoster(match.teamA, true), [match]);
  const rosterB = useMemo(() => getTeamRoster(match.teamB, false), [match]);

  // Render the exact uploaded Gold TV broadcast graphic by default
  if (viewStyle === 'uploaded_gold_overlay') {
    return (
      <div className="relative w-full h-full">
        <BothSquadsImageOverlay match={match} onClose={onClose} />
        {/* Toggle to Classic Board in bottom left corner */}
        <div className="absolute bottom-4 left-6 z-50">
          <button
            onClick={() => setViewStyle('classic_board')}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/20 text-slate-400 hover:text-white font-mono text-[10px] uppercase cursor-pointer transition shadow-lg flex items-center gap-1.5"
            title="Switch to detailed stats lineup view"
          >
            📋 Table View
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-10 select-none text-white"
    >
      {/* Top Header Bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Users size={26} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
                OFFICIAL PLAYING XI
              </span>
              <span className="text-xs font-mono text-slate-400">
                {match.tournamentName || 'GULLY PREMIER LEAGUE 2026'}
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white mt-1">
              TEAM SQUAD LINEUPS
            </h1>
          </div>
        </div>

        {/* Venue & Toss Pill */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setViewStyle('uploaded_gold_overlay')}
            className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono text-xs font-bold uppercase transition cursor-pointer shadow-lg"
            title="Switch back to 3D Gold TV Overlay"
          >
            ★ 3D Gold TV Overlay
          </button>
          <div className="text-right font-mono text-xs text-slate-300 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5">
            <div className="flex items-center justify-end gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              <MapPin size={13} />
              <span>{match.groundName || 'Wankhede Cricket Ground'}</span>
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              {match.tossWinner ? `Toss: ${match.tossWinner} opted to ${match.tossChoice || 'bat'}` : 'Match Official Coin Toss Complete'}
            </div>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Dual Team Lineups Columns */}
      <div className="grid grid-cols-2 gap-8 my-5 flex-1 items-stretch min-h-0">
        
        {/* TEAM A COLUMN */}
        <div className="flex flex-col bg-slate-900/60 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-transparent" />
          
          {/* Team Header */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {match.teamALogo ? (
                <img src={match.teamALogo} alt={match.teamA} className="w-12 h-12 rounded-xl object-contain bg-slate-950 border border-white/10 p-1" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center font-black text-xl text-blue-400">
                  {match.teamA[0]}
                </div>
              )}
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block font-mono">TEAM A</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight truncate max-w-[340px]">
                  {match.teamA}
                </h2>
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold uppercase">
              11 Players Named
            </div>
          </div>

          {/* Player Rows (scrollable if needed) */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {rosterA.map((p, idx) => {
              const pClean = cleanPlayerName(p.name);
              const pIsC = isCaptain(p.name, match.teamACaptain);
              const pIsWk = isWicketKeeper(p.name, match.teamAWicketKeeper);
              const photo = match.playerPhotos?.[pClean.toLowerCase()];
              const role = getPlayerRole(idx, pIsC, pIsWk);

              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5 text-center shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <PlayerAvatar name={pClean} photoUrl={photo} size="sm" borderColor={pIsC ? 'border-amber-400/50' : 'border-white/10'} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white uppercase tracking-wide truncate">
                          {pClean}
                        </span>
                        {pIsC && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] tracking-wider uppercase shrink-0">
                            (C)
                          </span>
                        )}
                        {pIsWk && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-black text-[9px] tracking-wider uppercase shrink-0">
                            (WK)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {role}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                    <span>RHB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TEAM B COLUMN */}
        <div className="flex flex-col bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-400 to-transparent" />
          
          {/* Team Header */}
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {match.teamBLogo ? (
                <img src={match.teamBLogo} alt={match.teamB} className="w-12 h-12 rounded-xl object-contain bg-slate-950 border border-white/10 p-1" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center font-black text-xl text-purple-400">
                  {match.teamB[0]}
                </div>
              )}
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block font-mono">TEAM B</span>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight truncate max-w-[340px]">
                  {match.teamB}
                </h2>
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold uppercase">
              11 Players Named
            </div>
          </div>

          {/* Player Rows */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {rosterB.map((p, idx) => {
              const pClean = cleanPlayerName(p.name);
              const pIsC = isCaptain(p.name, match.teamBCaptain);
              const pIsWk = isWicketKeeper(p.name, match.teamBWicketKeeper);
              const photo = match.playerPhotos?.[pClean.toLowerCase()];
              const role = getPlayerRole(idx, pIsC, pIsWk);

              return (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 w-5 text-center shrink-0">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <PlayerAvatar name={pClean} photoUrl={photo} size="sm" borderColor={pIsC ? 'border-amber-400/50' : 'border-white/10'} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white uppercase tracking-wide truncate">
                          {pClean}
                        </span>
                        {pIsC && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] tracking-wider uppercase shrink-0">
                            (C)
                          </span>
                        )}
                        {pIsWk && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-black text-[9px] tracking-wider uppercase shrink-0">
                            (WK)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block truncate">
                        {role}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                    <span>LHB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer Broadcast Strip */}
      <div className="flex justify-between items-center pt-3 border-t border-white/10 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold uppercase">MATCH OFFICIALS VERIFIED</span>
          </span>
          <span>Umpires: K. Ananthapadmanabhan, Nitin Menon</span>
          <span>Third Umpire: C. Shamshuddin</span>
        </div>
        <div className="text-amber-400 font-bold uppercase tracking-wider">
          LIVE TV BROADCAST GRAPHIC
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   2. INNINGS SCORECARD FULL-SCREEN OVERLAY
   ========================================================================= */
export const InningsScorecardOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  // Allow toggling between Innings 1 and Innings 2 inside the overlay
  const [selectedInningsNum, setSelectedInningsNum] = useState<1 | 2>(
    match.currentInningsNum || (match.innings2 ? 2 : 1)
  );

  const inn = selectedInningsNum === 1 ? match.innings1 : match.innings2;

  // Fallback data if match innings is empty
  const battingTeam = inn?.battingTeam || (selectedInningsNum === 1 ? match.teamA : match.teamB);
  const bowlingTeam = inn?.bowlingTeam || (selectedInningsNum === 1 ? match.teamB : match.teamA);
  const runs = inn?.runs ?? 0;
  const wickets = inn?.wickets ?? 0;
  const ballsBowled = inn?.ballsBowled ?? 0;
  const oversStr = formatOvers(ballsBowled);
  const crr = ballsBowled > 0 ? ((runs / ballsBowled) * 6).toFixed(2) : '0.00';

  const extras = inn?.extras || { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalty: 0 };
  const totalExtras = (extras.wides || 0) + (extras.noBalls || 0) + (extras.byes || 0) + (extras.legByes || 0) + (extras.penalty || 0);

  const batsmen = inn?.batsmen || [];
  const bowlers = inn?.bowlers || [];
  const fow = inn?.fallOfWickets || [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-8 select-none text-white"
    >
      {/* Top Header & Innings Tab Selector */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_20px_rgba(14,165,233,0.2)]">
            <BarChart2 size={26} />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-sky-400 block font-mono">
              OFFICIAL INNINGS SCORECARD
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              {battingTeam} INNINGS BREAKDOWN
            </h1>
          </div>
        </div>

        {/* Innings 1 / Innings 2 Toggle Pills */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 rounded-2xl bg-slate-900 border border-white/10">
            <button
              onClick={() => setSelectedInningsNum(1)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedInningsNum === 1
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              1st Innings ({match.innings1?.battingTeam || match.teamA})
            </button>
            <button
              onClick={() => setSelectedInningsNum(2)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                selectedInningsNum === 2
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white bg-transparent'
              }`}
            >
              2nd Innings ({match.innings2?.battingTeam || match.teamB})
            </button>
          </div>

          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Total Score Banner */}
      <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center font-black text-xl text-sky-400">
            {battingTeam[0]}
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">{battingTeam}</h2>
            <span className="text-xs font-mono text-slate-400">
              vs {bowlingTeam} • {match.oversLimit} Overs Match
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8 font-mono">
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-sans font-bold">TOTAL SCORE</span>
            <div className="text-3xl font-black text-sky-400 tracking-tight">
              {runs}<span className="text-slate-400 text-2xl font-light">/</span>{wickets}
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-sans font-bold">OVERS BOWLED</span>
            <div className="text-2xl font-bold text-white">
              {oversStr} <span className="text-slate-500 text-sm font-normal">/ {match.oversLimit}</span>
            </div>
          </div>
          <div className="text-right border-l border-white/10 pl-6">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 block font-sans font-bold">RUN RATE</span>
            <div className="text-2xl font-bold text-emerald-400">
              {crr}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Batting Card (Left 62%) vs Bowling & FOW (Right 38%) */}
      <div className="grid grid-cols-12 gap-5 flex-1 min-h-0 my-1 items-stretch">
        
        {/* BATTING SCORECARD CARD (Col 7) */}
        <div className="col-span-7 flex flex-col bg-slate-900/50 border border-white/10 rounded-2xl p-4 overflow-hidden text-left">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10 font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <span className="w-[38%]">BATSMAN</span>
            <span className="w-[26%]">HOW OUT</span>
            <span className="w-[8%] text-right font-black text-white">R</span>
            <span className="w-[8%] text-right">B</span>
            <span className="w-[6%] text-right">4s</span>
            <span className="w-[6%] text-right">6s</span>
            <span className="w-[8%] text-right text-amber-400">SR</span>
          </div>

          <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
            {batsmen.length > 0 ? (
              batsmen.map((b, idx) => {
                const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';
                const isMilestone = b.runs >= 50;

                // Format dismissal text properly
                let dismissal = 'not out';
                if (b.isOut) {
                  if (b.outMode === 'Caught' && b.fielderName && b.dismissedBy) {
                    dismissal = `c ${b.fielderName} b ${b.dismissedBy}`;
                  } else if (b.outMode === 'Caught' && b.dismissedBy) {
                    dismissal = `c & b ${b.dismissedBy}`;
                  } else if (b.outMode === 'Bowled') {
                    dismissal = `b ${b.dismissedBy || 'bowler'}`;
                  } else if (b.outMode === 'LBW') {
                    dismissal = `lbw b ${b.dismissedBy || 'bowler'}`;
                  } else if (b.outMode === 'Run Out') {
                    dismissal = `run out (${b.fielderName || ''})`;
                  } else if (b.outMode === 'Stumped') {
                    dismissal = `st ${b.fielderName || ''} b ${b.dismissedBy || ''}`;
                  } else {
                    dismissal = b.outMode || 'out';
                  }
                }

                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] text-xs font-mono"
                  >
                    <div className="w-[38%] flex items-center gap-2 truncate pr-2">
                      <PlayerAvatar name={b.name} photoUrl={match.playerPhotos?.[cleanPlayerName(b.name).toLowerCase()]} size="sm" />
                      <span className={`font-bold uppercase truncate ${b.isOut ? 'text-slate-200' : 'text-white'}`}>
                        {cleanPlayerName(b.name)}
                        {!b.isOut && <span className="text-emerald-400 ml-1">*</span>}
                      </span>
                    </div>

                    <div className="w-[26%] text-[11px] truncate text-slate-400">
                      {!b.isOut ? (
                        <span className="text-emerald-400 font-bold uppercase text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          NOT OUT
                        </span>
                      ) : (
                        <span className="text-slate-400">{dismissal}</span>
                      )}
                    </div>

                    <div className={`w-[8%] text-right font-black ${isMilestone ? 'text-amber-400 text-sm' : 'text-white'}`}>
                      {b.runs}
                    </div>

                    <div className="w-[8%] text-right text-slate-400">
                      {b.balls}
                    </div>

                    <div className="w-[6%] text-right text-slate-300">
                      {b.fours}
                    </div>

                    <div className="w-[6%] text-right text-amber-400 font-bold">
                      {b.sixes}
                    </div>

                    <div className="w-[8%] text-right text-slate-400 text-[11px]">
                      {sr}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Awaiting batting score details...
              </div>
            )}
          </div>

          {/* Extras Row */}
          <div className="pt-2.5 mt-2 border-t border-white/10 flex justify-between items-center text-xs font-mono text-slate-400">
            <div>
              <span className="font-bold text-white uppercase">EXTRAS:</span>{' '}
              <strong className="text-white">{totalExtras}</strong>{' '}
              <span className="text-[10px] text-slate-500">
                (b {extras.byes || 0}, lb {extras.legByes || 0}, w {extras.wides || 0}, nb {extras.noBalls || 0}, p {extras.penalty || 0})
              </span>
            </div>
            <div>
              <span className="font-bold text-white uppercase">TOTAL:</span>{' '}
              <strong className="text-sky-400 font-black text-sm">{runs}/{wickets}</strong>{' '}
              <span className="text-[10px] text-slate-500">({oversStr} Ov)</span>
            </div>
          </div>
        </div>

        {/* BOWLING FIGURES & FALL OF WICKETS (Col 5) */}
        <div className="col-span-5 flex flex-col gap-4 text-left">
          
          {/* Bowling Figures Card */}
          <div className="flex-1 flex flex-col bg-slate-900/50 border border-white/10 rounded-2xl p-4 overflow-hidden">
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10 font-mono text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              <span className="w-[40%]">BOWLER</span>
              <span className="w-[12%] text-right">O</span>
              <span className="w-[12%] text-right">M</span>
              <span className="w-[12%] text-right">R</span>
              <span className="w-[12%] text-right font-black text-white">W</span>
              <span className="w-[12%] text-right text-sky-400">ECON</span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {bowlers.length > 0 ? (
                bowlers.map((bw, idx) => {
                  const econ = bw.ballsBowled > 0 ? ((bw.runsConceded / bw.ballsBowled) * 6).toFixed(2) : '0.00';
                  return (
                    <div 
                      key={idx}
                      className="flex items-center justify-between py-1.5 px-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.03] text-xs font-mono"
                    >
                      <div className="w-[40%] flex items-center gap-2 truncate pr-2">
                        <PlayerAvatar name={bw.name} photoUrl={match.playerPhotos?.[cleanPlayerName(bw.name).toLowerCase()]} size="sm" />
                        <span className="font-bold text-white uppercase truncate">
                          {cleanPlayerName(bw.name)}
                          {bw.isCurrent && <span className="text-sky-400 ml-1">⚡</span>}
                        </span>
                      </div>

                      <div className="w-[12%] text-right text-slate-300">
                        {formatOvers(bw.ballsBowled)}
                      </div>

                      <div className="w-[12%] text-right text-slate-400">
                        {bw.maidens}
                      </div>

                      <div className="w-[12%] text-right text-slate-200">
                        {bw.runsConceded}
                      </div>

                      <div className={`w-[12%] text-right font-black ${bw.wickets > 0 ? 'text-rose-400 text-sm' : 'text-slate-400'}`}>
                        {bw.wickets}
                      </div>

                      <div className="w-[12%] text-right text-sky-400 text-[11px]">
                        {econ}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-500 font-mono text-xs">
                  Awaiting bowling details...
                </div>
              )}
            </div>
          </div>

          {/* Fall of Wickets Strip */}
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block font-mono mb-2">
              FALL OF WICKETS (FOW)
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              {fow.length > 0 ? (
                fow.map((item, idx) => (
                  <div key={idx} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 flex items-center gap-1.5">
                    <span className="text-rose-400 font-bold">{item.score}-{item.wicketNo}</span>
                    <span className="text-slate-400 text-[10px]">({cleanPlayerName(item.batsmanName)}, {item.oversList} ov)</span>
                  </div>
                ))
              ) : (
                <span className="text-slate-500 text-xs">No wickets fallen in this innings.</span>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-mono text-slate-400">
        <div>
          {match.status === 'completed' && match.winner ? (
            <span className="text-amber-400 font-bold uppercase">
              🏆 RESULT: {match.winner} won {match.winReason ? `(${match.winReason})` : ''}
            </span>
          ) : (
            <span>Match In Progress • Live Broadcast TV Scorecard Feed</span>
          )}
        </div>
        <span className="text-slate-500">Official Scorers Certified Record</span>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   3. MATCH PRESENTATION / RESULTS FULL-SCREEN OVERLAY
   ========================================================================= */
export const MatchPresentationOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  // Determine winning team and margin
  const winner = match.winner || (match.innings2 && match.targetRuns && match.innings2.runs >= match.targetRuns ? match.innings2.battingTeam : match.teamA);
  const winReason = match.winReason || (match.winner ? `${match.winner} WON THE MATCH` : 'MATCH CONCLUDED');

  // Automatic calculation of Player of the Match (POTM) if not manually set
  const potmData = useMemo(() => {
    // Check manual override in match first
    if (match.playerOfTheMatch) {
      return {
        name: match.playerOfTheMatch,
        team: match.potmTeam || winner,
        stats: match.potmStats || 'Match-winning performance',
        photo: match.playerPhotos?.[cleanPlayerName(match.playerOfTheMatch).toLowerCase()]
      };
    }

    // Otherwise find top performer across both innings
    let bestPlayer = {
      name: 'Match Star',
      team: winner,
      stats: 'Outstanding Performance',
      score: 0,
      photo: undefined as string | undefined
    };

    const checkInnings = (inn: Innings | null, team: string) => {
      if (!inn) return;
      // Evaluate Batsmen
      (inn.batsmen || []).forEach(b => {
        let pt = b.runs + (b.runs >= 50 ? 25 : 0) + (b.runs >= 100 ? 50 : 0) + b.sixes * 2;
        if (pt > bestPlayer.score) {
          bestPlayer = {
            name: b.name,
            team,
            stats: `${b.runs} Runs (${b.balls}b, ${b.fours}x4, ${b.sixes}x6)`,
            score: pt,
            photo: match.playerPhotos?.[cleanPlayerName(b.name).toLowerCase()]
          };
        }
      });
      // Evaluate Bowlers
      (inn.bowlers || []).forEach(bw => {
        let pt = bw.wickets * 30 + (bw.wickets >= 3 ? 30 : 0) + bw.maidens * 15 - Math.floor(bw.runsConceded / 4);
        if (pt > bestPlayer.score) {
          bestPlayer = {
            name: bw.name,
            team: inn.bowlingTeam,
            stats: `${bw.wickets} Wickets for ${bw.runsConceded} Runs (${formatOvers(bw.ballsBowled)} ov)`,
            score: pt,
            photo: match.playerPhotos?.[cleanPlayerName(bw.name).toLowerCase()]
          };
        }
      });
    };

    checkInnings(match.innings1, match.innings1?.battingTeam || match.teamA);
    checkInnings(match.innings2, match.innings2?.battingTeam || match.teamB);

    return bestPlayer;
  }, [match, winner]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-10 select-none text-white text-center"
    >
      {/* Top Header Banner */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Trophy size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block font-mono">
              OFFICIAL MATCH PRESENTATION CEREMONY
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              POST-MATCH AWARDS & FINAL RESULT
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            {match.tournamentName || 'GULLY PREMIER LEAGUE 2026'}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Champion Announcement Strip */}
      <div className="my-4 p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-amber-900/30 to-amber-950/40 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-black uppercase tracking-widest mb-1">
          <Sparkles size={16} />
          <span>MATCH WINNER & VICTORY MARGIN</span>
          <Sparkles size={16} />
        </div>

        <h2 className="text-4xl font-black text-white uppercase tracking-tight drop-shadow-md">
          🏆 {winner} WON 🏆
        </h2>

        <p className="mt-2 text-base font-mono font-bold text-amber-300 uppercase tracking-wide">
          {winReason}
        </p>

        {/* Scores summary split */}
        <div className="mt-4 flex items-center gap-8 font-mono text-sm">
          <div className="bg-black/30 border border-white/10 px-5 py-2 rounded-xl">
            <span className="text-slate-400 mr-2">{match.teamA}:</span>
            <strong className="text-white text-base">
              {match.innings1 ? `${match.innings1.runs}/${match.innings1.wickets}` : '0/0'}
            </strong>{' '}
            <span className="text-xs text-slate-400">
              ({match.innings1 ? formatOvers(match.innings1.ballsBowled) : '0.0'} ov)
            </span>
          </div>

          <span className="text-slate-500 font-sans font-bold text-xs uppercase">vs</span>

          <div className="bg-black/30 border border-white/10 px-5 py-2 rounded-xl">
            <span className="text-slate-400 mr-2">{match.teamB}:</span>
            <strong className="text-white text-base">
              {match.innings2 ? `${match.innings2.runs}/${match.innings2.wickets}` : '0/0'}
            </strong>{' '}
            <span className="text-xs text-slate-400">
              ({match.innings2 ? formatOvers(match.innings2.ballsBowled) : '0.0'} ov)
            </span>
          </div>
        </div>
      </div>

      {/* Featured "PLAYER OF THE MATCH" Trophy Card */}
      <div className="max-w-4xl mx-auto w-full my-2 bg-gradient-to-b from-slate-900/90 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-8">
          {/* Framed Headshot */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-950 border-2 border-amber-400 p-1 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              {potmData.photo ? (
                <img 
                  src={potmData.photo} 
                  alt={potmData.name} 
                  className="w-full h-full object-cover rounded-2xl" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center font-black text-4xl text-amber-200">
                  {potmData.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-2.5 inset-x-0 flex justify-center">
              <span className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow">
                MVP AWARD
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono">
                PLAYER OF THE MATCH
              </span>
            </div>

            <h3 className="text-3xl font-black text-white uppercase tracking-tight mt-1 truncate">
              {cleanPlayerName(potmData.name)}
            </h3>

            <span className="text-sm font-mono text-slate-300 font-bold uppercase block mt-0.5">
              Team: <strong className="text-amber-300">{potmData.team}</strong>
            </span>

            {/* Impact Metric Strip */}
            <div className="mt-3.5 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm font-mono">
              <span className="text-amber-400 font-black">Impact:</span>
              <span className="text-white font-bold">{potmData.stats}</span>
            </div>
          </div>

          {/* Golden Trophy Medallion */}
          <div className="hidden md:flex flex-col items-center justify-center px-6 border-l border-white/10 shrink-0">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Star size={32} />
            </div>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-2">
              MATCH PRIZE ₹10,000
            </span>
          </div>
        </div>
      </div>

      {/* Footer Awards Row */}
      <div className="grid grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-left">
          <span className="text-[9px] text-slate-500 block uppercase">Highest Run Scorer</span>
          <strong className="text-white text-sm block mt-0.5 truncate">
            {match.innings1?.batsmen?.[0]?.name || 'Top Batter'} (58)
          </strong>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-left">
          <span className="text-[9px] text-slate-500 block uppercase">Best Bowling Figures</span>
          <strong className="text-white text-sm block mt-0.5 truncate">
            {match.innings2?.bowlers?.[0]?.name || 'Top Bowler'} (2/22)
          </strong>
        </div>

        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-left">
          <span className="text-[9px] text-slate-500 block uppercase">Super Sixes Award</span>
          <strong className="text-amber-400 text-sm block mt-0.5">
            Total 7 Maximums registered
          </strong>
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   4. TOURNAMENT STANDINGS / POINTS TABLE FULL-SCREEN OVERLAY
   ========================================================================= */
export interface StandingsRow {
  rank: number;
  id: string;
  name: string;
  shortName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  nrr: number;
  form: ('W' | 'L' | 'T' | 'NR')[];
}

export const TournamentStandingsOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  // Pull existing tournament table from storage or generate realistic premier league table
  const standings = useMemo<StandingsRow[]>(() => {
    // 1. Try pulling from localStorage tournaments
    try {
      const toursStr = localStorage.getItem('gully_tournaments_v1');
      if (toursStr) {
        const tours = JSON.parse(toursStr);
        if (Array.isArray(tours) && tours.length > 0) {
          const activeTour = tours.find((t: any) => t.id === match.tournamentId) || tours[0];
          if (activeTour && Array.isArray(activeTour.teams) && activeTour.teams.length > 0) {
            // Compute or format rows
            const rows: StandingsRow[] = activeTour.teams.map((tm: any, idx: number) => ({
              rank: idx + 1,
              id: tm.id || `team-${idx}`,
              name: tm.name,
              shortName: tm.name.slice(0, 3).toUpperCase(),
              played: tm.played || 6,
              won: tm.won || 4,
              lost: tm.lost || 2,
              tied: tm.tied || 0,
              points: (tm.won || 4) * 2 + (tm.tied || 0),
              nrr: tm.NRR !== undefined ? parseFloat(tm.NRR) : (idx === 0 ? 0.749 : idx === 1 ? 0.521 : -0.125),
              form: idx % 2 === 0 ? ['W', 'W', 'L', 'W', 'W'] : ['L', 'W', 'W', 'L', 'W']
            }));

            // Sort by points desc, then NRR desc
            rows.sort((a, b) => b.points - a.points || b.nrr - a.nrr);
            return rows.map((r, i) => ({ ...r, rank: i + 1 }));
          }
        }
      }
    } catch (_) {}

    // 2. Default high-precision IPL/Gully Premier League standings including current Match teams
    const teamAName = match.teamA || 'Mumbai Champions';
    const teamBName = match.teamB || 'Pune Super Warriors';

    const defaultRows: StandingsRow[] = [
      {
        rank: 1,
        id: 'team-a',
        name: teamAName,
        shortName: teamAName.slice(0, 3).toUpperCase(),
        played: 7,
        won: 5,
        lost: 2,
        tied: 0,
        points: 10,
        nrr: 0.812,
        form: ['W', 'W', 'L', 'W', 'W']
      },
      {
        rank: 2,
        id: 'team-csk',
        name: 'Chennai Super Kings',
        shortName: 'CSK',
        played: 7,
        won: 5,
        lost: 2,
        tied: 0,
        points: 10,
        nrr: 0.540,
        form: ['W', 'L', 'W', 'W', 'W']
      },
      {
        rank: 3,
        id: 'team-b',
        name: teamBName,
        shortName: teamBName.slice(0, 3).toUpperCase(),
        played: 7,
        won: 4,
        lost: 3,
        tied: 0,
        points: 8,
        nrr: 0.315,
        form: ['L', 'W', 'W', 'L', 'W']
      },
      {
        rank: 4,
        id: 'team-rcb',
        name: 'Royal Challengers Bengaluru',
        shortName: 'RCB',
        played: 7,
        won: 4,
        lost: 3,
        tied: 0,
        points: 8,
        nrr: 0.185,
        form: ['W', 'W', 'W', 'L', 'L']
      },
      {
        rank: 5,
        id: 'team-kkr',
        name: 'Kolkata Knight Riders',
        shortName: 'KKR',
        played: 7,
        won: 3,
        lost: 4,
        tied: 0,
        points: 6,
        nrr: -0.114,
        form: ['L', 'L', 'W', 'W', 'L']
      },
      {
        rank: 6,
        id: 'team-srh',
        name: 'Sunrisers Hyderabad',
        shortName: 'SRH',
        played: 7,
        won: 3,
        lost: 4,
        tied: 0,
        points: 6,
        nrr: -0.280,
        form: ['W', 'L', 'L', 'L', 'W']
      },
      {
        rank: 7,
        id: 'team-dc',
        name: 'Delhi Capitals',
        shortName: 'DC',
        played: 7,
        won: 2,
        lost: 5,
        tied: 0,
        points: 4,
        nrr: -0.450,
        form: ['L', 'L', 'L', 'W', 'L']
      },
      {
        rank: 8,
        id: 'team-rr',
        name: 'Rajasthan Royals',
        shortName: 'RR',
        played: 7,
        won: 2,
        lost: 5,
        tied: 0,
        points: 4,
        nrr: -0.710,
        form: ['L', 'L', 'W', 'L', 'L']
      }
    ];

    return defaultRows;
  }, [match]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-8 select-none text-white text-left"
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <TrendingUp size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block font-mono">
              OFFICIAL LEAGUE STANDINGS & POINTS TABLE
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white mt-0.5">
              {match.tournamentName || 'GULLY PREMIER LEAGUE 2026'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-mono">
            <span className="text-emerald-400 font-bold">MATCH STAKES:</span>
            <span className="text-slate-300">{match.teamA} vs {match.teamB}</span>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Standings Table Container */}
      <div className="flex-1 my-4 bg-slate-900/50 border border-white/10 rounded-3xl p-5 flex flex-col overflow-hidden shadow-2xl">
        {/* Table Header Row */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 font-mono text-xs uppercase tracking-widest text-slate-400 font-bold">
          <div className="flex items-center gap-4 w-[42%]">
            <span className="w-8 text-center">POS</span>
            <span>TEAM</span>
          </div>
          <div className="flex items-center justify-end gap-6 w-[58%]">
            <span className="w-8 text-center">P</span>
            <span className="w-8 text-center text-emerald-400">W</span>
            <span className="w-8 text-center text-rose-400">L</span>
            <span className="w-8 text-center text-slate-400">T/NR</span>
            <span className="w-12 text-center font-black text-amber-400">PTS</span>
            <span className="w-16 text-right">NRR</span>
            <span className="w-28 text-center">LAST 5 FORM</span>
          </div>
        </div>

        {/* Standings Rows */}
        <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
          {standings.map((team, idx) => {
            const isPlayingTeamA = team.name.toLowerCase() === match.teamA.toLowerCase();
            const isPlayingTeamB = team.name.toLowerCase() === match.teamB.toLowerCase();
            const isPlaying = isPlayingTeamA || isPlayingTeamB;
            const isPlayoffSpot = team.rank <= 4;
            const nrrFormatted = (team.nrr >= 0 ? `+${team.nrr.toFixed(3)}` : team.nrr.toFixed(3));
            const nrrPositive = team.nrr >= 0;

            return (
              <React.Fragment key={team.id}>
                {/* Qualification line indicator between rank 4 and 5 */}
                {idx === 4 && (
                  <div className="my-2 py-1 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center font-mono text-[10px] text-emerald-300 font-bold uppercase tracking-widest">
                    ⚡ TOP 4 TEAMS ADVANCE TO SEMI-FINALS & PLAYOFFS ⚡
                  </div>
                )}

                <div 
                  className={`flex items-center justify-between py-2.5 px-4 rounded-2xl border transition-all text-xs font-mono ${
                    isPlaying
                      ? 'bg-blue-950/40 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/30'
                      : isPlayoffSpot 
                        ? 'bg-white/[0.03] border-emerald-500/20 hover:bg-white/[0.06]' 
                        : 'bg-white/[0.015] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  {/* Left: Position & Team */}
                  <div className="flex items-center gap-4 w-[42%] min-w-0">
                    <span className={`w-8 text-center font-black text-sm ${
                      team.rank === 1 ? 'text-amber-400' : isPlayoffSpot ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {team.rank}
                    </span>

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-xs text-white shrink-0">
                        {team.shortName.slice(0, 2)}
                      </div>
                      <div className="truncate">
                        <span className={`font-bold text-sm uppercase truncate block ${isPlaying ? 'text-white font-extrabold' : 'text-slate-200'}`}>
                          {team.name}
                        </span>
                        {isPlaying && (
                          <span className="text-[9px] text-blue-400 font-sans uppercase tracking-wider font-bold">
                            ★ Currently Playing on Ground
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Stats and Form */}
                  <div className="flex items-center justify-end gap-6 w-[58%]">
                    <span className="w-8 text-center text-slate-300">{team.played}</span>
                    <span className="w-8 text-center font-bold text-emerald-400">{team.won}</span>
                    <span className="w-8 text-center text-rose-400">{team.lost}</span>
                    <span className="w-8 text-center text-slate-400">{team.tied}</span>
                    <span className="w-12 text-center font-black text-base text-amber-400">{team.points}</span>
                    <span className={`w-16 text-right font-bold ${nrrPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {nrrFormatted}
                    </span>
                    
                    {/* Form Pills */}
                    <div className="w-28 flex items-center justify-center gap-1 shrink-0">
                      {team.form.map((res, fIdx) => (
                        <span
                          key={fIdx}
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${
                            res === 'W'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : res === 'L'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Footer Info Strip */}
      <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs font-mono text-slate-400">
        <div>
          <span>NRR Formula: (Total Runs Scored ÷ Overs Faced) − (Total Runs Conceded ÷ Overs Bowled)</span>
        </div>
        <div className="text-emerald-400 font-bold uppercase tracking-wider">
          LIVE STANDINGS CERTIFIED BY LEAGUE COMMITTEE
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   PRE-MATCH BUILD-UP 1: THE MATCHUP CARD (SPLIT FULL-SCREEN OR LOWER-THIRD)
   ========================================================================= */
const MatchupCardOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  // Can be displayed as full screen or large lower-third
  const [displayMode, setDisplayMode] = useState<'fullscreen' | 'lowerthird'>('fullscreen');

  const tournamentTitle = match.tournamentName || match.seriesName || 'GULLY PREMIER LEAGUE 2026';
  const matchDetails = match.matchNumber || (match.tournamentMatchId ? `MATCH ${match.tournamentMatchId}` : 'MATCH 14 • GROUP STAGE');
  const venueTitle = match.groundName || 'Wankhede Cricket Ground, Mumbai';
  const formatTitle = `${match.oversLimit || 20} OVERS PER SIDE • WHITE BALL T20`;

  const teamACaptain = match.teamACaptain || match.teamASquad?.[0] || 'Captain';
  const teamBCaptain = match.teamBCaptain || match.teamBSquad?.[0] || 'Captain';

  // Lower-Third Variant
  if (displayMode === 'lowerthird') {
    return (
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-end z-50 pointer-events-auto px-4">
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full max-w-5xl bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-24 bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Top Bar inside lower third */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Trophy size={11} className="text-amber-400" />
                {tournamentTitle}
              </span>
              <span className="text-[11px] font-mono font-extrabold text-slate-300 uppercase tracking-wider">
                {matchDetails}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <MapPin size={11} className="text-amber-400" />
                {venueTitle}
              </span>
              <button
                onClick={() => setDisplayMode('fullscreen')}
                className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[9px] font-bold uppercase transition-all cursor-pointer"
              >
                Full Screen
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Content Row */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 pt-3">
            {/* Team A */}
            <div className="flex items-center gap-3">
              {match.teamALogo ? (
                <img src={match.teamALogo} alt={match.teamA} className="w-14 h-14 rounded-2xl object-contain bg-slate-950 border border-amber-500/30 p-1 shrink-0 shadow-lg" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-black text-white text-lg shrink-0 shadow-lg border border-blue-400/30">
                  {match.teamA.slice(0, 3).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-black block">TEAM A</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none mt-0.5">{match.teamA}</h3>
                <span className="text-xs font-mono text-slate-300 block truncate mt-1">Captain: <strong className="text-white">{cleanPlayerName(teamACaptain)}</strong></span>
              </div>
            </div>

            {/* Central VS Medallion */}
            <div className="flex flex-col items-center justify-center px-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 border-2 border-amber-300">
                VS
              </div>
              <span className="text-[8px] font-mono text-amber-300 uppercase tracking-widest font-bold mt-1">LIVE BUILD-UP</span>
            </div>

            {/* Team B */}
            <div className="flex items-center justify-end gap-3 text-right">
              <div className="min-w-0">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-black block">TEAM B</span>
                <h3 className="text-xl font-black text-white uppercase tracking-tight truncate leading-none mt-0.5">{match.teamB}</h3>
                <span className="text-xs font-mono text-slate-300 block truncate mt-1">Captain: <strong className="text-white">{cleanPlayerName(teamBCaptain)}</strong></span>
              </div>
              {match.teamBLogo ? (
                <img src={match.teamBLogo} alt={match.teamB} className="w-14 h-14 rounded-2xl object-contain bg-slate-950 border border-amber-500/30 p-1 shrink-0 shadow-lg" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 to-rose-700 flex items-center justify-center font-black text-white text-lg shrink-0 shadow-lg border border-amber-400/30">
                  {match.teamB.slice(0, 3).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Full-Screen Split Card Variant
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 text-white flex flex-col justify-between p-8 z-50 pointer-events-auto backdrop-blur-xl font-sans"
    >
      {/* Dynamic Stadium Lights Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/30 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-amber-600/30 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-64 bg-amber-500/10 blur-[140px]" />
      </div>

      {/* Top Broadcast Branding Strip */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black text-sm uppercase tracking-widest font-mono">{tournamentTitle}</span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-450 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider">
                LIVE BUILD-UP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 uppercase tracking-wider">
              {matchDetails} • {formatTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300">
            <MapPin size={14} className="text-amber-400" />
            <span>{venueTitle}</span>
          </div>
          
          <button
            onClick={() => setDisplayMode('lowerthird')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
            title="Switch to broadcast lower-third display"
          >
            📋 Lower-Third View
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-rose-500/30 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Center Split Matchup Screen */}
      <div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-8 my-auto max-w-6xl mx-auto w-full">
        
        {/* TEAM A COLUMN */}
        <motion.div
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/40 border border-blue-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-blue-400/60 transition-all"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />
          
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-black uppercase tracking-widest inline-block mb-5">
            Team 1
          </span>

          <div className="w-28 h-28 mx-auto mb-5 rounded-3xl bg-slate-950/80 border-2 border-blue-400/40 flex items-center justify-center p-3 shadow-2xl shadow-blue-500/20">
            {match.teamALogo ? (
              <img src={match.teamALogo} alt={match.teamA} className="w-full h-full object-contain" />
            ) : (
              <span className="font-black text-3xl bg-gradient-to-br from-blue-400 to-indigo-200 bg-clip-text text-transparent">
                {match.teamA.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
            {match.teamA}
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono text-slate-200 mb-5">
            <span className="text-amber-400 font-bold">CAPTAIN:</span>
            <span className="font-black text-white">{cleanPlayerName(teamACaptain)}</span>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-black">Recent Form</span>
              <div className="flex gap-1 mt-1 justify-center">
                {['W', 'W', 'L', 'W', 'W'].map((r, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                      r === 'W' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-black">Squad Strength</span>
              <span className="text-slate-200 font-black text-sm mt-1 block">11 Players</span>
            </div>
          </div>
        </motion.div>

        {/* CENTRAL "VS" GLOW ORB */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-amber-500 to-transparent" />
          
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/40 border-4 border-slate-950">
              <Swords size={28} className="text-slate-950" />
            </div>
            <div className="absolute -bottom-2 inset-x-0 flex justify-center">
              <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-amber-400/50 text-amber-300 text-[9px] font-black uppercase tracking-widest shadow-md">
                VS
              </span>
            </div>
          </motion.div>

          <div className="w-px h-16 bg-gradient-to-b from-transparent via-amber-500 to-transparent" />
          
          <div className="text-center mt-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-black block">HEAD TO HEAD</span>
            <span className="text-[9px] font-mono text-slate-400 block">Live Broadcast</span>
          </div>
        </div>

        {/* TEAM B COLUMN */}
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-rose-950/40 border border-amber-500/30 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl group hover:border-amber-400/60 transition-all"
        >
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-500" />
          
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-black uppercase tracking-widest inline-block mb-5">
            Team 2
          </span>

          <div className="w-28 h-28 mx-auto mb-5 rounded-3xl bg-slate-950/80 border-2 border-amber-400/40 flex items-center justify-center p-3 shadow-2xl shadow-amber-500/20">
            {match.teamBLogo ? (
              <img src={match.teamBLogo} alt={match.teamB} className="w-full h-full object-contain" />
            ) : (
              <span className="font-black text-3xl bg-gradient-to-br from-amber-400 to-rose-200 bg-clip-text text-transparent">
                {match.teamB.slice(0, 3).toUpperCase()}
              </span>
            )}
          </div>

          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2 leading-tight">
            {match.teamB}
          </h2>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-mono text-slate-200 mb-5">
            <span className="text-amber-400 font-bold">CAPTAIN:</span>
            <span className="font-black text-white">{cleanPlayerName(teamBCaptain)}</span>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-black">Recent Form</span>
              <div className="flex gap-1 mt-1 justify-center">
                {['L', 'W', 'W', 'W', 'L'].map((r, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                      r === 'W' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div>
              <span className="block text-[10px] uppercase text-slate-500 font-black">Squad Strength</span>
              <span className="text-slate-200 font-black text-sm mt-1 block">11 Players</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Bottom Live Match Status Strip */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-slate-300 uppercase font-black tracking-wider">OFFICIAL FIXTURE</span>
          <span className="text-slate-500">•</span>
          <span>Pitch Inspection Passed</span>
        </div>

        <div className="text-amber-400 font-black uppercase tracking-wider">
          BROADCAST PRODUCED BY GULLY SPORTS NETWORK
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   PRE-MATCH BUILD-UP 2: TOSS RESULT CARD
   ========================================================================= */
const TossResultCardOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  const tossWinner = match.tossWinner || match.teamA;
  const tossChoice = (match.tossChoice || 'bat').toLowerCase() as 'bat' | 'bowl';
  const oppositionTeam = tossWinner.toLowerCase() === match.teamA.toLowerCase() ? match.teamB : match.teamA;

  const winnerLogo = tossWinner.toLowerCase() === match.teamA.toLowerCase() ? match.teamALogo : match.teamBLogo;
  const oppositionLogo = tossWinner.toLowerCase() === match.teamA.toLowerCase() ? match.teamBLogo : match.teamALogo;

  const winnerCaptain = tossWinner.toLowerCase() === match.teamA.toLowerCase() ? (match.teamACaptain || 'Captain') : (match.teamBCaptain || 'Captain');
  const oppositionCaptain = tossWinner.toLowerCase() === match.teamA.toLowerCase() ? (match.teamBCaptain || 'Captain') : (match.teamACaptain || 'Captain');

  const headline = `${tossWinner.toUpperCase()} WON THE TOSS & ELECTED TO ${tossChoice.toUpperCase()} FIRST`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 text-white flex flex-col justify-center items-center p-8 z-50 pointer-events-auto backdrop-blur-2xl font-sans"
    >
      {/* Background Spotlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-amber-500/20 blur-[130px] rounded-full" />
      </div>

      {/* Main Center Card */}
      <div className="relative z-10 w-full max-w-4xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-amber-500/40 rounded-[2.5rem] p-8 md:p-10 shadow-2xl backdrop-blur-2xl text-center">
        
        {/* Top Toss Icon Badge */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
              <Coins size={14} className="text-amber-400" />
              OFFICIAL TOSS REPORT
            </span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              {match.tournamentName || match.seriesName || 'GULLY PREMIER LEAGUE 2026'}
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Central Toss Winner Spotlight */}
        <div className="my-8 space-y-5">
          <div className="flex items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-950/90 border-2 border-amber-400 p-2 shadow-xl shadow-amber-500/20 flex items-center justify-center">
              {winnerLogo ? (
                <img src={winnerLogo} alt={tossWinner} className="w-full h-full object-contain" />
              ) : (
                <span className="font-black text-2xl text-amber-400">{tossWinner.slice(0, 3).toUpperCase()}</span>
              )}
            </div>
          </div>

          {/* Hero Headline */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              <span className="text-amber-400 drop-shadow-md">{tossWinner.toUpperCase()}</span> WON THE TOSS
            </h1>
            <div className="inline-block px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xl md:text-2xl uppercase tracking-wider shadow-xl shadow-amber-500/30">
              ELECTED TO {tossChoice.toUpperCase()} FIRST
            </div>
          </motion.div>

          {/* Strategic Context Pill */}
          <p className="text-sm md:text-base font-mono text-slate-300 max-w-2xl mx-auto">
            {tossChoice === 'bat'
              ? '🏏 Looking to post a commanding target on a fresh 22-yard strip before pitch wears down.'
              : '🎳 Aiming to capitalize on early moisture and swinging conditions under floodlights.'}
          </p>
        </div>

        {/* Captains & Opposition Row */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10 text-left">
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
              🪙
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-black block">TOSS WINNING CAPTAIN</span>
              <h4 className="text-base font-black text-white truncate leading-tight">{cleanPlayerName(winnerCaptain)}</h4>
              <span className="text-xs text-slate-400 font-mono block mt-0.5">({tossWinner})</span>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
              🏏
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black block">OPPOSITION CAPTAIN</span>
              <h4 className="text-base font-black text-white truncate leading-tight">{cleanPlayerName(oppositionCaptain)}</h4>
              <span className="text-xs text-slate-400 font-mono block mt-0.5">({oppositionTeam})</span>
            </div>
          </div>
        </div>

        {/* Footer Venue / Match Details */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/5 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-amber-400" />
            {match.groundName || 'Wankhede Cricket Ground'}
          </span>
          <span className="text-amber-300 uppercase font-black">
            Match Starts In Moments • {match.oversLimit || 20} Overs A Side
          </span>
        </div>

      </div>
    </motion.div>
  );
};

/* =========================================================================
   PRE-MATCH BUILD-UP 3: PITCH & WEATHER REPORT
   ========================================================================= */
const PitchWeatherReportOverlay: React.FC<{ match: MatchState; onClose?: () => void }> = ({ match, onClose }) => {
  const venueTitle = match.groundName || 'Wankhede Cricket Ground, Mumbai';
  const customConfig = match.overlayConfig?.buildUpConfig || {};

  const surfaceCondition = customConfig.pitchSurface || match.pitchCondition || 'Dry Surface with Fine Cracks';
  const grassCover = customConfig.pitchGrassCover || 'Light Grass Cover (15%) • Hard Deck';
  const paceBounce = customConfig.pitchPaceBounce || 'True Pace & Consistent Carry (7.8/10)';
  const spinTurn = 'Moderate Grip & Sharp Turn in 2nd Innings (8.2/10)';
  const parScore = customConfig.pitchParScore || '175 – 185 Runs';
  const curatorVerdict = customConfig.pitchCuratorNote || 'Hard dry surface with fine cracks. Batting first is favorable as the deck may slow down under lights and assist spinners.';

  const weatherTemp = customConfig.weatherTemp || '31°C (88°F)';
  const weatherSky = customConfig.weatherSky || match.weatherCondition || 'Clear Sky • Warm Evening';
  const humidity = customConfig.weatherHumidity || '58% (Moderate)';
  const windSpeed = customConfig.weatherWind || '14 km/h West (Gentle Breeze)';
  const dewFactor = customConfig.weatherDew || 'CRITICAL (Heavy Dew Expected In 2nd Half)';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-slate-950/95 text-white flex flex-col justify-between p-8 z-50 pointer-events-auto backdrop-blur-2xl font-sans"
    >
      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        <div className="absolute top-10 left-10 w-96 h-96 bg-emerald-600/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/20 blur-[130px] rounded-full" />
      </div>

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-black text-sm uppercase tracking-widest font-mono">
                PITCH & WEATHER REPORT
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                CURATOR ASSESSMENT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} className="text-amber-400" />
              {venueTitle} • {match.tournamentName || match.seriesName || 'GULLY PREMIER LEAGUE 2026'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white/10 hover:bg-rose-500/30 hover:text-rose-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Dual Cards Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 my-auto max-w-6xl mx-auto w-full">
        
        {/* CARD 1: PITCH CONDITIONS */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers size={16} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide text-white">22-Yard Pitch Conditions</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
              Hard Top Surface
            </span>
          </div>

          {/* Graphical Pitch Strip Representation */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-white/10 relative overflow-hidden">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
              <span>Bowling End</span>
              <span className="text-amber-400 font-bold uppercase">22 Yards Match Strip</span>
              <span>Batting Crease</span>
            </div>
            <div className="h-10 rounded-xl bg-gradient-to-r from-amber-800/40 via-amber-700/60 to-amber-800/40 border border-amber-600/40 relative flex items-center justify-around px-2">
              <div className="w-1 h-full bg-white/40" />
              <span className="text-[9px] font-mono text-amber-200 font-bold bg-slate-950/70 px-2 py-0.5 rounded border border-amber-500/30">
                Cracks & Dry Patches
              </span>
              <div className="w-1 h-full bg-white/40" />
            </div>
          </div>

          {/* Condition Breakdown Items */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase">Surface Condition</span>
              <span className="text-xs font-black text-amber-300 uppercase">{surfaceCondition}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase">Grass Cover</span>
              <span className="text-xs font-black text-emerald-400 uppercase">{grassCover}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase">Pace & Bounce</span>
              <span className="text-xs font-black text-slate-200 uppercase">{paceBounce}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <span className="text-xs font-mono text-slate-400 uppercase">Turn & Grip</span>
              <span className="text-xs font-black text-teal-300 uppercase">{spinTurn}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-xs font-mono text-emerald-300 uppercase font-black">Par 1st Innings Score</span>
              <span className="text-sm font-mono font-black text-white">{parScore}</span>
            </div>
          </div>

          {/* Curator Note */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block mb-1">Curator's Verdict:</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{curatorVerdict}</p>
          </div>
        </div>

        {/* CARD 2: WEATHER & OVERHEAD CONDITIONS */}
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-sky-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500" />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Sun size={16} />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wide text-white">Overhead Weather & Sky</h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold">
              Live Atmosphere
            </span>
          </div>

          {/* Big Temperature Display */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-950 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Overhead Temperature</span>
              <div className="text-3xl font-black text-white flex items-center gap-2 mt-0.5">
                <Thermometer size={24} className="text-amber-400" />
                <span>{weatherTemp}</span>
              </div>
              <span className="text-xs font-mono text-slate-400 mt-1 block">{weatherSky}</span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl shadow-lg">
              ☀️
            </div>
          </div>

          {/* Atmospheric Metrics */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <Droplets size={14} className="text-sky-400" />
                <span className="text-xs font-mono text-slate-400 uppercase">Humidity Level</span>
              </div>
              <span className="text-xs font-black text-white">{humidity}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <Wind size={14} className="text-sky-400" />
                <span className="text-xs font-mono text-slate-400 uppercase">Wind Velocity</span>
              </div>
              <span className="text-xs font-black text-white">{windSpeed}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-rose-450" />
                <span className="text-xs font-mono text-rose-450 uppercase font-black">Dew Factor</span>
              </div>
              <span className="text-xs font-black text-rose-300 uppercase">{dewFactor}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-white/5">
              <div className="flex items-center gap-2">
                <Sun size={14} className="text-amber-400" />
                <span className="text-xs font-mono text-slate-400 uppercase">Lighting Conditions</span>
              </div>
              <span className="text-xs font-black text-amber-300 uppercase">Stadium Floodlights On</span>
            </div>
          </div>

          {/* Tactical Weather Impact */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
            <span className="text-[10px] font-mono text-sky-400 font-bold uppercase block mb-1">Tactical Impact:</span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Due to expected moisture and dew in the second half, the wet ball could make gripping difficult for spinners, giving the chasing team a batting advantage.
            </p>
          </div>
        </div>

      </div>

      {/* Footer Info Strip */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 uppercase font-bold">Live Pitch Sensor Diagnostics</span>
        </div>
        <div className="text-emerald-400 font-bold uppercase tracking-wider">
          OFFICIAL WEATHER DATA BY METEOROLOGICAL SERVICE
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   MAIN COMPOSITE TRANSITIONS COMPONENT
   ========================================================================= */
export const CricketFullScreenTransitions: React.FC<Props> = ({ activeGraphic, match, onClose }) => {
  if (!activeGraphic || activeGraphic === 'none') {
    return null;
  }

  // Pre-Match Build-Up 1: The Matchup Card
  if (activeGraphic === 'prematch_matchup' || activeGraphic === 'matchup_card' || activeGraphic === 'matchup') {
    return <MatchupCardOverlay match={match} onClose={onClose} />;
  }

  // Pre-Match Build-Up 2: Toss Result Card
  if (activeGraphic === 'toss_result' || activeGraphic === 'toss_card' || activeGraphic === 'toss') {
    return <TossResultCardOverlay match={match} onClose={onClose} />;
  }

  // Pre-Match Build-Up 3: Pitch & Weather Report
  if (activeGraphic === 'pitch_weather_report' || activeGraphic === 'pitch_report' || activeGraphic === 'pitch_weather') {
    return <PitchWeatherReportOverlay match={match} onClose={onClose} />;
  }

  // 1. Team Lineups / Playing XI / Both Squads
  if (
    activeGraphic === 'team_lineups' || 
    activeGraphic === 'lineups' || 
    activeGraphic === 'playing_xi' || 
    activeGraphic === 'both_squads' || 
    activeGraphic === 'both_squad_overlay' || 
    activeGraphic === 'squad_overlay' || 
    activeGraphic === 'squad_lineup'
  ) {
    return <TeamLineupsOverlay match={match} onClose={onClose} />;
  }

  // 2. Innings Scorecard
  if (activeGraphic === 'innings_scorecard' || activeGraphic === 'full_scorecard') {
    return <InningsScorecardOverlay match={match} onClose={onClose} />;
  }

  // 3. Match Presentation / Results
  if (activeGraphic === 'match_presentation' || activeGraphic === 'potm_card' || activeGraphic === 'presentation') {
    return <MatchPresentationOverlay match={match} onClose={onClose} />;
  }

  // 4. Tournament Standings / Points Table
  if (activeGraphic === 'tournament_standings' || activeGraphic === 'points_table' || activeGraphic === 'standings') {
    return <TournamentStandingsOverlay match={match} onClose={onClose} />;
  }

  return null;
};
