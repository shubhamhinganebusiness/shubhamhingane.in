import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Shield, Award, Sparkles, X, 
  BarChart2, Flame, Activity, Zap, Check, ChevronRight
} from 'lucide-react';
// Default high-resolution fallback photos for cricket broadcast cards
const DEFAULT_BOWLER_CUTOUT = 'https://images.unsplash.com/photo-1540747737956-37872de719e0?q=80&w=1200&auto=format&fit=crop';
const DEFAULT_BATSMAN_PROFILE = 'https://images.unsplash.com/photo-1531415080290-bc9854593f6f?q=80&w=1200&auto=format&fit=crop';

interface BatsmanStatsData {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
}

interface BowlerStatsData {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  econ: string;
}

interface BroadcastOverlayProps {
  match?: any;
  onClose?: () => void;
  // Optional overrides
  mode?: 'batsman' | 'bowler';
}

/* =========================================================================
   CUSTOM CRICKET ICONS FOR ACCURATE BROADCAST GRAPHICS
   ========================================================================= */

// Cricket Batsman Stroke Silhouette Icon
const BatsmanShotIcon: React.FC<{ className?: string }> = ({ className = "w-7 h-7 text-white" }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    {/* Head & Helmet */}
    <circle cx="52" cy="22" r="9" />
    {/* Body & Arms swinging bat forward in power stroke */}
    <path d="M48 33 C42 37 38 45 36 53 L31 66 C30 69 33 72 36 71 L42 63 L46 76 C47 80 50 83 54 81 L60 76 L56 57 C58 52 56 42 52 35 Z" />
    {/* Cricket Bat held high & forward */}
    <path d="M54 36 L68 20 C70 17 73 17 75 19 L79 23 C81 25 81 28 78 30 L62 46 Z" opacity="0.95" />
    {/* Bat Handle */}
    <path d="M50 40 L56 34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Cricket Ball Icon with Seam
const CricketBallIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-white" }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    <circle cx="50" cy="50" r="44" fill="currentColor" />
    {/* Ball Seam */}
    <path d="M35 15 C45 30 45 70 35 85" stroke="#ffffff" strokeWidth="5" strokeDasharray="3 3" />
    <path d="M38 14 C48 30 48 70 38 86" stroke="#ffffff" strokeWidth="2" />
  </svg>
);

// Cricket Bat Icon
const CricketBatIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6 text-white" }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    {/* Bat Blade */}
    <path d="M30 75 L65 30 C68 26 74 26 77 30 L80 33 C84 37 84 43 80 46 L45 91 C41 95 34 94 30 90 L26 86 C22 82 23 76 27 72 Z" />
    {/* Grip */}
    <path d="M68 26 L82 12 C84 10 88 10 90 12 L92 14 C94 16 94 20 92 22 L78 36 Z" fill="#ffffff" opacity="0.8" />
  </svg>
);

// Team Crest Shield Badge
const TeamCrestBadge: React.FC<{ teamName: string; logoUrl?: string; className?: string }> = ({ teamName, logoUrl, className = "" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {/* Shield Icon Container */}
    <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-blue-600/30 rounded-full blur-md" />
      {/* Crest SVG or Image */}
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={teamName} 
          className="w-14 h-14 object-contain rounded-full border-2 border-amber-400 bg-slate-950 p-1 shadow-lg z-10" 
        />
      ) : (
        <div className="w-14 h-14 bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-950 border-2 border-amber-400 rounded-2xl flex flex-col items-center justify-center shadow-xl z-10 relative overflow-hidden">
          <div className="absolute -top-1 inset-x-0 h-1.5 bg-amber-400 flex justify-center gap-1">
            <span className="w-1 h-1 bg-white rounded-full" />
            <span className="w-1 h-1 bg-white rounded-full" />
            <span className="w-1 h-1 bg-white rounded-full" />
          </div>
          <Shield className="w-7 h-7 text-amber-400 drop-shadow-md" />
          <span className="text-[7px] font-black text-white tracking-widest uppercase mt-0.5">TEAM</span>
        </div>
      )}
    </div>

    {/* Team Name Pill */}
    <div className="bg-gradient-to-r from-[#07193f] to-[#0d2a6b] border border-blue-400/40 py-2 px-5 rounded-r-2xl shadow-xl flex flex-col justify-center">
      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono leading-none">FRANCHISE / SQUAD</span>
      <span className="text-base font-black text-white uppercase tracking-wider leading-tight drop-shadow truncate max-w-[220px]">
        {teamName || 'ROYAL CHALLENGERS'}
      </span>
    </div>
  </div>
);

/* =========================================================================
   OVERLAY 1: BATSMAN & BOWLER PRO BRUSH OVERLAY (MATCHING IMAGE 1)
   Features:
   - Left Slanted Parallelogram Stats (RUNS, BALLS, 4s, 6s, STRIKE RATE)
   - Batsman Stats Circular Badge with Orange Rim
   - Player Cutout with Vibrant Blue & Orange Paint Splash / Aura
   - Yellow/Golden Brushstroke Ribbon: "BOWLER"
   - Dark Navy Paint Stroke Banner with Dynamic Brush Script Typography: "THOMSES POLLARD"
   - Bottom Team Crest Badge
   ========================================================================= */
export const BatsmanBowlerBrushOverlay: React.FC<BroadcastOverlayProps> = ({ match, onClose }) => {
  const [viewMode, setViewMode] = useState<'batsman_focus' | 'bowler_focus'>('batsman_focus');

  // Extract active match data with fallbacks
  const currentInnings = match?.currentInningsNum === 2 ? match?.innings2 : match?.innings1;
  const battingTeam = currentInnings?.battingTeam || match?.teamA || 'Royal Challengers';
  const bowlingTeam = currentInnings?.bowlingTeam || match?.teamB || 'Mumbai Warriors';
  const teamLogo = match?.teamALogo;

  const striker = currentInnings?.batsmen?.[currentInnings.strikerIndex || 0] || currentInnings?.batsmen?.[0];
  const activeBowler = currentInnings?.bowlers?.[currentInnings.currentBowlerIndex || 0] || currentInnings?.bowlers?.find((b: any) => b.isCurrent) || currentInnings?.bowlers?.[0];

  // Batsman Stats
  const batsmanStats: BatsmanStatsData = useMemo(() => {
    if (striker) {
      const runs = striker.runs ?? 48;
      const balls = striker.balls ?? 32;
      const fours = striker.fours ?? 6;
      const sixes = striker.sixes ?? 2;
      const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : '150.0';
      return {
        name: striker.name || 'UMRAN MALIK',
        runs,
        balls,
        fours,
        sixes,
        sr
      };
    }
    return {
      name: 'UMRAN MALIK',
      runs: 48,
      balls: 32,
      fours: 6,
      sixes: 2,
      sr: '150.0'
    };
  }, [striker]);

  // Bowler Stats
  const bowlerStats: BowlerStatsData = useMemo(() => {
    if (activeBowler) {
      const balls = activeBowler.ballsBowled ?? 18;
      const overs = `${Math.floor(balls / 6)}.${balls % 6}`;
      const maidens = activeBowler.maidens ?? 0;
      const runs = activeBowler.runsConceded ?? 24;
      const wickets = activeBowler.wickets ?? 2;
      const econ = balls > 0 ? ((runs / balls) * 6).toFixed(1) : '8.0';
      return {
        name: activeBowler.name || 'THOMSES POLLARD',
        overs,
        maidens,
        runs,
        wickets,
        econ
      };
    }
    return {
      name: 'THOMSES POLLARD',
      overs: '3.0',
      maidens: 0,
      runs: 24,
      wickets: 2,
      econ: '8.0'
    };
  }, [activeBowler]);

  // Split bowler name for display brush typography
  const bowlerNameParts = useMemo(() => {
    const raw = bowlerStats.name.trim();
    const parts = raw.split(' ');
    if (parts.length > 1) {
      return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' ')
      };
    }
    return {
      firstName: 'THOMSES',
      lastName: raw || 'POLLARD'
    };
  }, [bowlerStats.name]);

  // Player image: Check match player photos or use high-def cutout
  const playerImage = match?.playerPhotos?.[batsmanStats.name] || 
                      match?.playerPhotos?.[bowlerStats.name] || 
                      DEFAULT_BOWLER_CUTOUT;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden font-sans select-none"
      id="batsman-bowler-brush-overlay"
    >
      {/* BROADCAST CARD WORKSPACE (1920x1080 Aspect Area) */}
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] pointer-events-auto flex items-center">

        {/* TOP CONTROLS (DIRECTOR BAR) */}
        <div className="absolute top-6 right-8 flex items-center gap-3 z-50 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={() => setViewMode(prev => prev === 'batsman_focus' ? 'bowler_focus' : 'batsman_focus')}
            className="px-3 py-1 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 hover:text-white text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer border border-blue-400/30"
          >
            <Sparkles size={13} className="text-amber-400" />
            Switch: {viewMode === 'batsman_focus' ? 'Bowler Focus' : 'Batsman Focus'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
              title="Close Overlay"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* =========================================================================
            1. LEFT PANEL: SLANTED "BATSMAN STATS" (EXACT MATCHING IMAGE 1)
            ========================================================================= */}
        <motion.div 
          initial={{ x: -120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 200, delay: 0.1 }}
          className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30 w-[420px]"
        >
          {/* HEADER BADGE: BATSMAN STATS with Circular Bat Silhouette & Orange Rim */}
          <div className="flex items-center -mb-1">
            {/* Circular Icon with Orange Border */}
            <div className="relative z-20 w-24 h-24 rounded-full bg-[#05183a] border-[5px] border-[#ea580c] flex items-center justify-center shadow-[0_0_25px_rgba(234,88,12,0.5)] shrink-0">
              <BatsmanShotIcon className="w-14 h-14 text-white drop-shadow-md" />
            </div>

            {/* Attached Slanted Navy Header Pill */}
            <div 
              className="relative -ml-6 z-10 bg-gradient-to-r from-[#05183a] via-[#092257] to-[#0c2e75] border-y-2 border-r-2 border-blue-400/30 pl-8 pr-8 py-3 rounded-r-2xl shadow-2xl flex items-center gap-2"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 94% 100%, 0% 100%)'
              }}
            >
              <span className="text-xl font-black text-white tracking-wider uppercase drop-shadow">
                {viewMode === 'batsman_focus' ? 'BATSMAN' : 'BOWLER'}
              </span>
              <span className="text-xl font-black text-[#fbbf24] tracking-wider uppercase drop-shadow">
                STATS
              </span>
            </div>
          </div>

          {/* 5 SLANTED PARALLELOGRAM STAT ROWS (RUNS, BALLS, 4s, 6s, STRIKE RATE) */}
          <div className="flex flex-col gap-2.5 mt-2 pl-4">
            {(viewMode === 'batsman_focus' ? [
              { label: 'RUNS', value: batsmanStats.runs.toString() },
              { label: 'BALLS', value: batsmanStats.balls.toString() },
              { label: '4s', value: batsmanStats.fours.toString() },
              { label: '6s', value: batsmanStats.sixes.toString() },
              { label: 'STRIKE RATE', value: batsmanStats.sr }
            ] : [
              { label: 'OVERS', value: bowlerStats.overs },
              { label: 'MAIDENS', value: bowlerStats.maidens.toString() },
              { label: 'RUNS', value: bowlerStats.runs.toString() },
              { label: 'WICKETS', value: bowlerStats.wickets.toString() },
              { label: 'ECONOMY', value: bowlerStats.econ }
            ]).map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 + idx * 0.06 }}
                className="relative flex items-stretch h-[56px] shadow-[0_8px_20px_rgba(0,0,0,0.65)] hover:scale-[1.02] transition-transform duration-200"
                style={{
                  transform: 'skewX(-20deg)',
                  transformOrigin: 'left center'
                }}
              >
                {/* Left Label Section (White Background, Dark Navy Uppercase Text) */}
                <div className="w-[52%] bg-white flex items-center justify-start pl-6 border-r border-slate-300">
                  <span 
                    className="font-black text-[#07183a] text-lg tracking-wider uppercase leading-none select-none"
                    style={{ transform: 'skewX(20deg)' }}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Right Value Section (Deep Royal Blue Background, Crisp White Numbers) */}
                <div className="w-[48%] bg-gradient-to-r from-[#071d47] via-[#0a2761] to-[#04122d] border-l border-blue-400/40 flex items-center justify-center pr-2">
                  <span 
                    className="font-black text-white text-3xl tracking-wider leading-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    style={{ transform: 'skewX(20deg)' }}
                  >
                    {item.value}
                  </span>
                </div>

                {/* Subtle Edge Highlight */}
                <div className="absolute top-0 right-0 w-1 h-full bg-blue-400 opacity-60" />
              </motion.div>
            ))}
          </div>

          {/* BOTTOM TEAM CREST & LOGO BADGE */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 pl-4"
          >
            <TeamCrestBadge 
              teamName={viewMode === 'batsman_focus' ? battingTeam : bowlingTeam} 
              logoUrl={teamLogo} 
            />
          </motion.div>
        </motion.div>


        {/* =========================================================================
            2. CENTER FOREGROUND: ATHLETIC PLAYER CUTOUT WITH DYNAMIC PAINT SPLATTER
            ========================================================================= */}
        <div className="absolute left-[380px] top-1/2 -translate-y-1/2 w-[760px] h-[850px] z-20 flex items-center justify-center pointer-events-none">
          
          {/* VIBRANT PAINT BRUSH SPLATTERS BEHIND PLAYER (SVG GRAPHIC) */}
          <svg className="absolute inset-0 w-full h-full opacity-90 drop-shadow-[0_0_35px_rgba(234,88,12,0.4)]" viewBox="0 0 800 800" fill="none">
            {/* Deep Blue Splash / Grunge Paint Streaks */}
            <path 
              d="M180 420 C140 380 120 310 160 250 C200 190 280 170 340 210 C400 250 380 320 440 350 C500 380 540 340 580 380 C620 420 610 500 550 540 C490 580 430 520 370 560 C310 600 220 580 180 510 Z" 
              fill="#082b68" 
              opacity="0.85" 
            />
            {/* Vivid Orange Grunge Splash */}
            <path 
              d="M320 280 C360 220 450 200 510 240 C570 280 610 360 580 420 C550 480 480 460 420 500 C360 540 290 510 270 450 C250 390 280 340 320 280 Z" 
              fill="#ea580c" 
              opacity="0.9" 
            />
            {/* Electric Blue Secondary Splashes */}
            <circle cx="210" cy="220" r="28" fill="#0284c7" opacity="0.8" />
            <circle cx="610" cy="460" r="34" fill="#0284c7" opacity="0.8" />
            <circle cx="260" cy="560" r="22" fill="#ea580c" opacity="0.85" />
            <path d="M570 210 L640 180 L620 250 Z" fill="#ea580c" opacity="0.75" />
            <path d="M150 480 L110 520 L160 550 Z" fill="#0369a1" opacity="0.75" />
          </svg>

          {/* HIGH-DEF PLAYER CUTOUT PORTRAIT */}
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 150, delay: 0.2 }}
            className="relative z-10 w-[620px] h-[780px] flex items-center justify-center"
          >
            <img 
              src={playerImage} 
              alt={viewMode === 'batsman_focus' ? batsmanStats.name : bowlerStats.name}
              className="w-full h-full object-contain filter drop-shadow-[0_25px_40px_rgba(0,0,0,0.85)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>


        {/* =========================================================================
            3. RIGHT SIDE: DYNAMIC PAINT BRUSH BANNER WITH PLAYER NAME (IMAGE 1 EXACT)
            ========================================================================= */}
        <motion.div 
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 180, delay: 0.3 }}
          className="absolute left-[780px] bottom-36 z-40 flex flex-col items-start select-none"
        >
          {/* YELLOW / GOLDEN BRUSHSTROKE RIBBON: "BOWLER" */}
          <div className="relative -mb-3 z-20">
            <div 
              className="bg-gradient-to-r from-[#f59e0b] via-[#fbbf24] to-[#f59e0b] text-[#071638] font-black text-2xl tracking-widest uppercase px-10 py-2 shadow-2xl"
              style={{
                clipPath: 'polygon(6% 0%, 98% 8%, 94% 94%, 2% 86%)',
                transform: 'rotate(-3deg)'
              }}
            >
              <span className="drop-shadow-sm font-sans">
                {viewMode === 'batsman_focus' ? 'BOWLER' : 'BATSMAN'}
              </span>
            </div>
          </div>

          {/* DARK NAVY PAINT STROKE BANNER WITH CALLIGRAPHY / BRUSH TYPOGRAPHY */}
          <div 
            className="relative bg-gradient-to-r from-[#071b42] via-[#092257] to-[#041029] py-6 pl-12 pr-20 shadow-[0_15px_40px_rgba(0,0,0,0.85)] border-l-4 border-amber-400"
            style={{
              clipPath: 'polygon(4% 0%, 96% 6%, 100% 88%, 2% 98%)',
              transform: 'rotate(-2deg)'
            }}
          >
            {/* FIRST NAME (CRISP WHITE BRUSH ITALIC) */}
            <h3 className="text-4xl lg:text-5xl font-black text-white italic tracking-wider uppercase leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
              {viewMode === 'batsman_focus' ? bowlerNameParts.firstName : batsmanStats.name.split(' ')[0]}
            </h3>

            {/* LAST NAME (VIBRANT GOLDEN-YELLOW BOLD BRUSH SCRIPT) */}
            <h2 className="text-6xl lg:text-7xl font-black text-[#fbbf24] italic tracking-wide uppercase leading-tight mt-1 drop-shadow-[0_6px_12px_rgba(0,0,0,0.95)]">
              {viewMode === 'batsman_focus' ? bowlerNameParts.lastName : batsmanStats.name.split(' ').slice(1).join(' ') || batsmanStats.name}
            </h2>

            {/* Sub-label for Bowling Style / Role */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-widest">
                RIGHT-ARM FAST SEAM • EXPRESS PACE
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
};


/* =========================================================================
   OVERLAY 2: STAR PLAYER PROFILE CARD (MATCHING IMAGE 2 - VIRAT KOHLI STYLE)
   Features:
   - Angled "PLAYER PROFILE" Badge with Batter Silhouette
   - Giant First Name ("VIRAT") + Massive Last Name ("KOHLI") + Cyan Flare
   - Country / Team Label ("INDIA")
   - 5 Slanted Stat Parallelograms with Icons (MATCHES, RUNS, HIGHEST SCORE, AVERAGE, 50s/100s)
   - Bottom-Left Cyber/Geometric Shards
   - High-Definition Player Portrait with Crossed Arms
   ========================================================================= */
export const PlayerProfileCardOverlay: React.FC<BroadcastOverlayProps> = ({ match, onClose }) => {
  const currentInnings = match?.currentInningsNum === 2 ? match?.innings2 : match?.innings1;
  const striker = currentInnings?.batsmen?.[currentInnings.strikerIndex || 0] || currentInnings?.batsmen?.[0];
  const battingTeam = currentInnings?.battingTeam || match?.teamA || 'INDIA';

  // Player Name Decomposition
  const playerName = striker?.name || match?.playerOfTheMatch || 'VIRAT KOHLI';
  const nameParts = useMemo(() => {
    const raw = playerName.trim();
    const parts = raw.split(' ');
    if (parts.length > 1) {
      return {
        first: parts[0],
        last: parts.slice(1).join(' ')
      };
    }
    return {
      first: 'VIRAT',
      last: raw || 'KOHLI'
    };
  }, [playerName]);

  // Profile Career Statistics
  const careerStats = useMemo(() => {
    const strikerRuns = striker?.runs || 48;
    return [
      {
        icon: CricketBallIcon,
        label: 'MATCHES',
        value: '109'
      },
      {
        icon: CricketBatIcon,
        label: 'RUNS',
        value: (strikerRuns > 50 ? strikerRuns + 3650 : 3712).toString()
      },
      {
        icon: Trophy,
        label: 'HIGHEST SCORE',
        value: '122*'
      },
      {
        icon: BarChart2,
        label: 'AVERAGE',
        value: '50.85'
      },
      {
        icon: Star,
        label: '50s / 100s',
        value: '50 / 100',
        subValue: '33 / 1'
      }
    ];
  }, [striker]);

  // High-def portrait
  const playerImage = match?.playerPhotos?.[playerName] || DEFAULT_BATSMAN_PROFILE;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden font-sans select-none"
      id="player-profile-pro-overlay"
    >
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] pointer-events-auto flex items-center">

        {/* TOP CONTROLS */}
        <div className="absolute top-6 right-8 flex items-center gap-3 z-50 pointer-events-auto bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
            PRO PLAYER PROFILE CARD
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
              title="Close Overlay"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* =========================================================================
            1. LEFT COLUMN: PROFILE BADGE, GIANT NAME & 5 SLANTED STAT ROWS
            ========================================================================= */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 190, delay: 0.1 }}
          className="absolute left-16 top-1/2 -translate-y-1/2 w-[520px] flex flex-col z-30"
        >
          {/* HEADER BADGE: "PLAYER PROFILE" with Slanted Chevron */}
          <div className="flex items-center mb-6">
            <div 
              className="bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 px-8 flex items-center gap-3 shadow-xl"
              style={{
                clipPath: 'polygon(0% 0%, 94% 0%, 100% 100%, 6% 100%)',
                transform: 'skewX(-16deg)'
              }}
            >
              <div style={{ transform: 'skewX(16deg)' }} className="flex items-center gap-2.5">
                <BatsmanShotIcon className="w-6 h-6 text-white drop-shadow" />
                <span className="text-lg font-black text-white uppercase tracking-widest font-sans drop-shadow">
                  PLAYER PROFILE
                </span>
              </div>
            </div>
          </div>

          {/* GIANT PLAYER NAME & COUNTRY/TEAM */}
          <div className="flex flex-col mb-8 pl-4 relative">
            {/* Horizontal Cyan Lens Flare / Glow line */}
            <div className="absolute -left-8 top-16 w-[560px] h-[3px] bg-gradient-to-r from-cyan-400 via-sky-300 to-transparent blur-[1px]" />
            <div className="absolute left-32 top-14 w-28 h-6 bg-cyan-400/40 blur-xl rounded-full" />

            {/* First Name */}
            <span className="text-4xl lg:text-5xl font-black text-white uppercase tracking-widest leading-none drop-shadow-md">
              {nameParts.first}
            </span>

            {/* Last Name (Massive Bold Display) */}
            <h1 className="text-7xl lg:text-8xl font-black text-white uppercase tracking-tight leading-none mt-1 drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]">
              {nameParts.last}
            </h1>

            {/* Team / Country */}
            <span className="text-3xl font-black text-cyan-400 uppercase tracking-widest mt-2 drop-shadow">
              {battingTeam}
            </span>
          </div>

          {/* 5 SLANTED STAT CARDS WITH ICONS (MATCHES, RUNS, HIGHEST SCORE, AVERAGE, 50s/100s) */}
          <div className="flex flex-col gap-3 pl-2">
            {careerStats.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  className="relative flex items-center h-[54px] shadow-[0_6px_18px_rgba(0,0,0,0.7)] hover:scale-[1.02] transition-transform duration-150"
                  style={{
                    transform: 'skewX(-20deg)',
                    transformOrigin: 'left center'
                  }}
                >
                  {/* Left Icon Badge (Deep Navy Blue / Cyan Highlight) */}
                  <div className="w-[62px] h-full bg-[#05183a] border-r border-cyan-500/40 flex items-center justify-center shrink-0">
                    <div style={{ transform: 'skewX(20deg)' }}>
                      <IconComp className="w-6 h-6 text-cyan-400 drop-shadow" />
                    </div>
                  </div>

                  {/* Middle Stat Label (Crisp Light Background) */}
                  <div className="flex-1 h-full bg-white flex items-center justify-start pl-5 pr-2">
                    <span 
                      className="font-black text-[#07183a] text-base tracking-wider uppercase leading-none"
                      style={{ transform: 'skewX(20deg)' }}
                    >
                      {item.label}
                    </span>
                  </div>

                  {/* Right Stat Value (Crisp Light Background, Bold Typography) */}
                  <div className="w-[120px] h-full bg-white flex flex-col items-center justify-center border-l border-slate-200 pr-3">
                    <span 
                      className="font-black text-[#07183a] text-2xl tracking-tight leading-none"
                      style={{ transform: 'skewX(20deg)' }}
                    >
                      {item.value}
                    </span>
                    {item.subValue && (
                      <span 
                        className="font-bold text-slate-500 text-[10px] leading-none mt-1"
                        style={{ transform: 'skewX(20deg)' }}
                      >
                        {item.subValue}
                      </span>
                    )}
                  </div>

                  {/* Subtle Cyan Edge Accent */}
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-cyan-400" />
                </motion.div>
              );
            })}
          </div>

          {/* BOTTOM-LEFT CYBER SHARDS / ANGULAR TECH ACCENTS (IMAGE 2 EXACT) */}
          <div className="relative mt-8 h-12 w-full flex items-center">
            {/* Shard 1 (Deep Navy) */}
            <div 
              className="absolute left-0 bottom-0 w-64 h-6 bg-[#05183a] shadow-lg"
              style={{ clipPath: 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
            />
            {/* Shard 2 (Electric Cyan) */}
            <div 
              className="absolute left-16 bottom-2 w-48 h-3 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ clipPath: 'polygon(0% 0%, 85% 0%, 100% 100%, 15% 100%)' }}
            />
            {/* Shard 3 (Royal Blue) */}
            <div 
              className="absolute left-40 bottom-0 w-36 h-4 bg-blue-600 shadow-md"
              style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }}
            />
          </div>
        </motion.div>


        {/* =========================================================================
            2. RIGHT HALF: HIGH-DEF STAR PLAYER PORTRAIT WITH ARMS CROSSED
            ========================================================================= */}
        <motion.div 
          initial={{ scale: 0.92, x: 80, opacity: 0 }}
          animate={{ scale: 1, x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 160, delay: 0.2 }}
          className="absolute right-28 bottom-0 w-[680px] h-[950px] z-20 flex items-end justify-center pointer-events-none"
        >
          {/* Subtle Studio Lighting Aura Behind Player */}
          <div className="absolute inset-x-12 bottom-20 h-[500px] bg-gradient-to-t from-blue-600/20 via-cyan-500/10 to-transparent blur-3xl rounded-full" />

          {/* High-Resolution Portrait */}
          <img 
            src={playerImage} 
            alt={playerName}
            className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)]"
            referrerPolicy="no-referrer"
          />
        </motion.div>

      </div>
    </motion.div>
  );
};
