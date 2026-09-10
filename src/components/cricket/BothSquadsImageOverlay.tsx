import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { MatchState } from './CricketFullScreenTransitions';

interface BothSquadsImageOverlayProps {
  match: MatchState;
  onClose?: () => void;
}

// Stylized Vector Mascot 1: Black Panther (matching the uploaded image's Team A mascot)
export const BlackPantherMascot: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bpShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#081e42" />
        <stop offset="100%" stopColor="#020814" />
      </linearGradient>
      <linearGradient id="bpGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="bpPantherFur" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="50%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
    </defs>
    {/* Shield Base */}
    <path 
      d="M50 4 L88 18 L82 72 L50 96 L18 72 L12 18 Z" 
      fill="url(#bpShieldGrad)" 
      stroke="url(#bpGoldRim)" 
      strokeWidth="4" 
      strokeLinejoin="round" 
    />
    <path 
      d="M50 9 L83 22 L77 69 L50 91 L23 69 L17 22 Z" 
      stroke="#38bdf8" 
      strokeWidth="1.5" 
      fill="none" 
      opacity="0.6" 
    />
    {/* Panther Head */}
    <g transform="translate(18, 16) scale(0.64)">
      {/* Ears */}
      <polygon points="12,18 26,2 34,22" fill="url(#bpPantherFur)" stroke="#ffd700" strokeWidth="1.5" />
      <polygon points="88,18 74,2 66,22" fill="url(#bpPantherFur)" stroke="#ffd700" strokeWidth="1.5" />
      <polygon points="16,16 26,6 30,20" fill="#38bdf8" opacity="0.4" />
      <polygon points="84,16 74,6 70,20" fill="#38bdf8" opacity="0.4" />
      {/* Head Outline */}
      <path 
        d="M24 24 C24 16, 76 16, 76 24 C82 32, 88 50, 78 68 C70 80, 58 88, 50 92 C42 88, 30 80, 22 68 C12 50, 18 32, 24 24 Z" 
        fill="url(#bpPantherFur)" 
        stroke="#ffd700" 
        strokeWidth="2.5" 
      />
      {/* Brow & Muzzle structure */}
      <path d="M30 40 L50 50 L70 40" stroke="#0ea5e9" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M42 56 L50 64 L58 56" fill="#020617" stroke="#38bdf8" strokeWidth="1.5" />
      {/* Fierce Eyes */}
      <polygon points="30,36 44,40 34,44" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <polygon points="70,36 56,40 66,44" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <circle cx="37" cy="40" r="2" fill="#000" />
      <circle cx="63" cy="40" r="2" fill="#000" />
      {/* Snarl & Sharp Fangs */}
      <path d="M38 68 Q50 62 62 68 Q50 78 38 68 Z" fill="#020617" stroke="#e2e8f0" strokeWidth="1.5" />
      <polygon points="41,66 43,74 46,67" fill="#ffffff" />
      <polygon points="59,66 57,74 54,67" fill="#ffffff" />
      <polygon points="46,67 48,71 50,67" fill="#ffffff" />
      <polygon points="54,67 52,71 50,67" fill="#ffffff" />
      {/* Whisker Accents */}
      <path d="M22 60 L10 58 M22 65 L8 66 M22 70 L10 74" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M78 60 L90 58 M78 65 L92 66 M78 70 L90 74" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </g>
  </svg>
);

// Stylized Vector Mascot 2: Mighty Tiger (matching the uploaded image's Team B mascot)
export const MightyTigerMascot: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tigerShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#081e42" />
        <stop offset="100%" stopColor="#020814" />
      </linearGradient>
      <linearGradient id="tigerGoldRim" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffd700" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="tigerOrange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fb923c" />
        <stop offset="50%" stopColor="#ea580c" />
        <stop offset="100%" stopColor="#9a3412" />
      </linearGradient>
    </defs>
    {/* Shield Base */}
    <path 
      d="M50 4 L88 18 L82 72 L50 96 L18 72 L12 18 Z" 
      fill="url(#tigerShieldGrad)" 
      stroke="url(#tigerGoldRim)" 
      strokeWidth="4" 
      strokeLinejoin="round" 
    />
    <path 
      d="M50 9 L83 22 L77 69 L50 91 L23 69 L17 22 Z" 
      stroke="#38bdf8" 
      strokeWidth="1.5" 
      fill="none" 
      opacity="0.6" 
    />
    {/* Tiger Head */}
    <g transform="translate(18, 16) scale(0.64)">
      {/* Ears */}
      <polygon points="12,20 24,4 34,22" fill="url(#tigerOrange)" stroke="#ffd700" strokeWidth="1.5" />
      <polygon points="88,20 76,4 66,22" fill="url(#tigerOrange)" stroke="#ffd700" strokeWidth="1.5" />
      <polygon points="16,18 24,8 28,20" fill="#ffffff" />
      <polygon points="84,18 76,8 72,20" fill="#ffffff" />
      {/* Tiger Face Shape */}
      <path 
        d="M24 24 C24 16, 76 16, 76 24 C82 32, 90 52, 78 70 C70 82, 58 88, 50 92 C42 88, 30 82, 22 70 C10 52, 18 32, 24 24 Z" 
        fill="url(#tigerOrange)" 
        stroke="#ffd700" 
        strokeWidth="2.5" 
      />
      {/* Forehead Tiger Stripes */}
      <polygon points="50,22 47,34 53,34" fill="#020617" />
      <polygon points="40,24 43,36 38,36" fill="#020617" />
      <polygon points="60,24 57,36 62,36" fill="#020617" />
      <polygon points="50,37 45,46 55,46" fill="#020617" />
      {/* Cheeks Stripes */}
      <polygon points="20,44 32,48 22,54" fill="#020617" />
      <polygon points="80,44 68,48 78,54" fill="#020617" />
      <polygon points="18,58 30,60 20,66" fill="#020617" />
      <polygon points="82,58 70,60 80,66" fill="#020617" />
      {/* White Muzzle Patches */}
      <path d="M28 58 Q50 48 72 58 Q50 86 28 58 Z" fill="#ffffff" />
      {/* Fierce Eyes */}
      <polygon points="30,38 44,42 34,46" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
      <polygon points="70,38 56,42 66,46" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
      <circle cx="37" cy="42" r="2" fill="#000" />
      <circle cx="63" cy="42" r="2" fill="#000" />
      {/* Black Nose */}
      <polygon points="45,54 55,54 50,62" fill="#020617" />
      {/* Open Roaring Jaw & Fangs */}
      <path d="M38 66 Q50 62 62 66 Q50 82 38 66 Z" fill="#7f1d1d" stroke="#020617" strokeWidth="1.5" />
      <polygon points="40,65 43,74 46,66" fill="#ffffff" />
      <polygon points="60,65 57,74 54,66" fill="#ffffff" />
    </g>
  </svg>
);

export const BothSquadsImageOverlay: React.FC<BothSquadsImageOverlayProps> = ({ match, onClose }) => {
  // Option to toggle between demo sample data (identical to uploaded screenshot) or live match state
  const [useSampleData, setUseSampleData] = useState<boolean>(false);

  // Derive rosters for Team A and Team B (guaranteeing 11 rows)
  const rosterA = useMemo(() => {
    if (useSampleData) {
      return Array.from({ length: 11 }, (_, i) => ({
        name: `PLAYER ${(i + 1).toString().padStart(2, '0')}`,
        isC: i === 0,
        isWk: i === 1,
        photo: undefined
      }));
    }

    const explicitSquad = match.teamASquad && match.teamASquad.length > 0 ? match.teamASquad : null;
    const names: { name: string; isC?: boolean; isWk?: boolean; photo?: string }[] = [];

    if (explicitSquad) {
      explicitSquad.forEach((p, idx) => {
        const rawName = typeof p === 'string' ? p : p.name;
        const isC = typeof p === 'object' && p.isCaptain !== undefined 
          ? p.isCaptain 
          : (match.teamACaptain ? rawName.toLowerCase().includes(match.teamACaptain.toLowerCase()) : idx === 0 && /\(c\)/i.test(rawName));
        const isWk = typeof p === 'object' && p.isWicketkeeper !== undefined
          ? p.isWicketkeeper
          : (match.teamAWicketKeeper ? rawName.toLowerCase().includes(match.teamAWicketKeeper.toLowerCase()) : /\(wk\)/i.test(rawName));
        const photo = typeof p === 'object' && p.photo ? p.photo : match.playerPhotos?.[rawName.toLowerCase()];
        names.push({ name: rawName, isC, isWk, photo });
      });
    } else if (match.innings1?.battingTeam === match.teamA && match.innings1?.batsmen) {
      match.innings1.batsmen.forEach(b => {
        if (b.name) {
          names.push({
            name: b.name,
            isC: match.teamACaptain ? b.name.toLowerCase().includes(match.teamACaptain.toLowerCase()) : false,
            isWk: match.teamAWicketKeeper ? b.name.toLowerCase().includes(match.teamAWicketKeeper.toLowerCase()) : false,
            photo: match.playerPhotos?.[b.name.toLowerCase()]
          });
        }
      });
    }

    // Fill up to 11 rows with numbered placeholders or defaults
    while (names.length < 11) {
      const idx = names.length + 1;
      names.push({
        name: `PLAYER ${idx.toString().padStart(2, '0')}`,
        isC: idx === 1,
        isWk: idx === 2,
        photo: undefined
      });
    }

    return names.slice(0, 11);
  }, [match, useSampleData]);

  const rosterB = useMemo(() => {
    if (useSampleData) {
      return Array.from({ length: 11 }, (_, i) => ({
        name: `PLAYER ${(i + 1).toString().padStart(2, '0')}`,
        isC: i === 0,
        isWk: i === 1,
        photo: undefined
      }));
    }

    const explicitSquad = match.teamBSquad && match.teamBSquad.length > 0 ? match.teamBSquad : null;
    const names: { name: string; isC?: boolean; isWk?: boolean; photo?: string }[] = [];

    if (explicitSquad) {
      explicitSquad.forEach((p, idx) => {
        const rawName = typeof p === 'string' ? p : p.name;
        const isC = typeof p === 'object' && p.isCaptain !== undefined 
          ? p.isCaptain 
          : (match.teamBCaptain ? rawName.toLowerCase().includes(match.teamBCaptain.toLowerCase()) : idx === 0 && /\(c\)/i.test(rawName));
        const isWk = typeof p === 'object' && p.isWicketkeeper !== undefined
          ? p.isWicketkeeper
          : (match.teamBWicketKeeper ? rawName.toLowerCase().includes(match.teamBWicketKeeper.toLowerCase()) : /\(wk\)/i.test(rawName));
        const photo = typeof p === 'object' && p.photo ? p.photo : match.playerPhotos?.[rawName.toLowerCase()];
        names.push({ name: rawName, isC, isWk, photo });
      });
    } else if (match.innings2?.battingTeam === match.teamB && match.innings2?.batsmen) {
      match.innings2.batsmen.forEach(b => {
        if (b.name) {
          names.push({
            name: b.name,
            isC: match.teamBCaptain ? b.name.toLowerCase().includes(match.teamBCaptain.toLowerCase()) : false,
            isWk: match.teamBWicketKeeper ? b.name.toLowerCase().includes(match.teamBWicketKeeper.toLowerCase()) : false,
            photo: match.playerPhotos?.[b.name.toLowerCase()]
          });
        }
      });
    }

    // Fill up to 11 rows with numbered placeholders or defaults
    while (names.length < 11) {
      const idx = names.length + 1;
      names.push({
        name: `PLAYER ${idx.toString().padStart(2, '0')}`,
        isC: idx === 1,
        isWk: idx === 2,
        photo: undefined
      });
    }

    return names.slice(0, 11);
  }, [match, useSampleData]);

  const teamAName = useSampleData ? 'BLACK PANTHERS' : (match.teamA || 'BLACK PANTHERS').toUpperCase();
  const teamBName = useSampleData ? 'MIGHTY TIGERS' : (match.teamB || 'MIGHTY TIGERS').toUpperCase();
  const matchLabel = useSampleData 
    ? 'MATCH 1' 
    : (match.matchNumber ? `MATCH ${match.matchNumber}` : (match.tournamentMatchId || 'MATCH 1'));
  const tournamentLabel = useSampleData 
    ? 'TROPHY T20' 
    : (match.tournamentName || 'TROPHY T20').toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-8 select-none pointer-events-auto bg-black/60 backdrop-blur-md overflow-hidden"
    >
      {/* Top Floating Control Bar for Streamer / Operator */}
      <div className="absolute top-4 right-6 flex items-center gap-3 z-50">
        <button
          onClick={() => setUseSampleData(!useSampleData)}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-mono text-[11px] font-bold tracking-wider uppercase transition cursor-pointer flex items-center gap-1.5 shadow-lg"
          title="Toggle between exact sample graphics and active match team data"
        >
          <Sparkles size={13} className="text-amber-400" />
          <span>{useSampleData ? 'Show Live Match Data' : 'Exact Image Sample'}</span>
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/20 text-slate-300 hover:text-white transition cursor-pointer shadow-lg"
            title="Close Overlay"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Broadcast Graphics Wrapper (Scaled to preserve 100% exact broadcast ratio) */}
      <div className="w-full max-w-[1140px] flex flex-col items-center drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)]">
        
        {/* =========================================================================
            1. TOP MATCH HEADER WING BAR
           ========================================================================= */}
        <div className="w-full flex flex-col items-center relative z-20 mb-3">
          
          {/* Top Trapezoid Badge: MATCH 1 */}
          <div 
            className="relative px-8 py-1 bg-gradient-to-b from-[#0a234f] via-[#051535] to-[#020b1f] border-t-2 border-x-2 border-[#f3be53] shadow-[0_0_15px_rgba(243,190,83,0.3)] z-10"
            style={{
              clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)'
            }}
          >
            <div className="flex items-center gap-3 text-xs sm:text-sm font-black tracking-[0.25em] text-[#ffe694] uppercase drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              <span className="h-[1.5px] w-5 bg-gradient-to-r from-transparent to-[#ffe694] inline-block" />
              <span>{matchLabel}</span>
              <span className="h-[1.5px] w-5 bg-gradient-to-l from-transparent to-[#ffe694] inline-block" />
            </div>
          </div>

          {/* Main Wing Bar (Left: Team A, Center: VS, Right: Team B) */}
          <div className="w-full relative flex items-center justify-between -mt-[2px]">
            
            {/* Left Wing (Team A) */}
            <div 
              className="flex-1 h-[68px] sm:h-[76px] relative flex items-center justify-between px-5 sm:px-7 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #07224e 0%, #030d22 55%, #051a3d 100%)',
                clipPath: 'polygon(3% 0%, 100% 0%, 100% 100%, 0% 100%)',
                borderTop: '3px solid #f3be53',
                borderBottom: '3px solid #c89222',
                boxShadow: 'inset 0 0 16px rgba(6, 182, 212, 0.35)'
              }}
            >
              {/* Gloss highlight streak */}
              <div className="absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              {/* Outer cyan glow edge */}
              <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-cyan-400/30 to-transparent" />

              {/* Team A Emblem Badge */}
              <div className="relative z-10 flex items-center justify-center shrink-0">
                {match.teamALogo && !useSampleData ? (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#030d22] border-2 border-[#f3be53] p-1.5 shadow-[0_0_15px_rgba(243,190,83,0.4)] flex items-center justify-center overflow-hidden">
                    <img 
                      src={match.teamALogo} 
                      alt={teamAName} 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(243,190,83,0.5)]">
                    <BlackPantherMascot className="w-full h-full" />
                  </div>
                )}
              </div>

              {/* Team A Name */}
              <div className="flex-1 text-right pr-6 sm:pr-8 z-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_3px_5px_rgba(0,0,0,0.95)] truncate">
                  {teamAName}
                </h2>
              </div>
            </div>

            {/* Center "VS" 3D Crest Badge */}
            <div className="relative z-30 shrink-0 mx-[-16px] sm:mx-[-20px] flex items-center justify-center">
              {/* Outer Metallic Beveled Shield */}
              <div 
                className="w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] relative flex items-center justify-center p-[3px] shadow-[0_0_25px_rgba(245,158,11,0.55)]"
                style={{
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  background: 'linear-gradient(135deg, #ffe694 0%, #f59e0b 50%, #92400e 100%)'
                }}
              >
                {/* Inner Deep Navy Polygon */}
                <div 
                  className="w-full h-full flex items-center justify-center relative bg-gradient-to-b from-[#092657] via-[#030d22] to-[#020713]"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
                  }}
                >
                  {/* Cyan internal glow */}
                  <div className="absolute inset-0 bg-cyan-400/15 rounded-full blur-[6px]" />

                  {/* 3D Metallic Gold "VS" Text */}
                  <span className="relative text-2xl sm:text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#fffbe6] via-[#ffd269] to-[#d97706] drop-shadow-[0_3px_6px_rgba(0,0,0,0.95)] select-none">
                    VS
                  </span>
                </div>
              </div>
            </div>

            {/* Right Wing (Team B) */}
            <div 
              className="flex-1 h-[68px] sm:h-[76px] relative flex items-center justify-between px-5 sm:px-7 overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, #07224e 0%, #030d22 55%, #051a3d 100%)',
                clipPath: 'polygon(0% 0%, 97% 0%, 100% 100%, 0% 100%)',
                borderTop: '3px solid #f3be53',
                borderBottom: '3px solid #c89222',
                boxShadow: 'inset 0 0 16px rgba(6, 182, 212, 0.35)'
              }}
            >
              {/* Gloss highlight streak */}
              <div className="absolute top-0 inset-x-0 h-[35%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              {/* Outer cyan glow edge */}
              <div className="absolute right-0 inset-y-0 w-3 bg-gradient-to-l from-cyan-400/30 to-transparent" />

              {/* Team B Name */}
              <div className="flex-1 text-left pl-6 sm:pl-8 z-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-wider drop-shadow-[0_3px_5px_rgba(0,0,0,0.95)] truncate">
                  {teamBName}
                </h2>
              </div>

              {/* Team B Emblem Badge */}
              <div className="relative z-10 flex items-center justify-center shrink-0">
                {match.teamBLogo && !useSampleData ? (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#030d22] border-2 border-[#f3be53] p-1.5 shadow-[0_0_15px_rgba(243,190,83,0.4)] flex items-center justify-center overflow-hidden">
                    <img 
                      src={match.teamBLogo} 
                      alt={teamBName} 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(243,190,83,0.5)]">
                    <MightyTigerMascot className="w-full h-full" />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* =========================================================================
            2. DUAL SQUAD LINEUP CONTAINERS (TEAM A & TEAM B)
           ========================================================================= */}
        <div className="w-full grid grid-cols-2 gap-4 sm:gap-6 my-1">
          
          {/* TEAM A SQUAD CONTAINER */}
          <div 
            className="relative rounded-[24px] sm:rounded-[28px] p-3 sm:p-4 bg-gradient-to-b from-[#03112c]/95 via-[#020917]/95 to-[#041535]/95 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-[3px] border-[#c89222]"
            style={{
              boxShadow: 'inset 0 0 14px rgba(6, 182, 212, 0.4), 0 0 20px rgba(6, 182, 212, 0.15)'
            }}
          >
            {/* Sculpted Corner Gold Brackets (Top-Left & Bottom-Left) */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#ffe694] rounded-tl-[24px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#ffe694] rounded-bl-[24px] pointer-events-none" />

            {/* 11 Player Rows */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {rosterA.map((player, idx) => {
                const numStr = (idx + 1).toString().padStart(2, '0');
                const displayName = player.name.replace(/\s*\((?:c|wk|capt)\)/gi, '').trim().toUpperCase();

                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-1.5 sm:gap-2 w-full group"
                  >
                    {/* Number Tag (Left) */}
                    <div 
                      className="w-10 sm:w-12 h-8 sm:h-9 shrink-0 rounded-l-xl rounded-r-md flex items-center justify-center border border-cyan-400/40 shadow-sm"
                      style={{
                        background: 'linear-gradient(180deg, #0a295f 0%, #041433 50%, #020b1d 100%)'
                      }}
                    >
                      <span className="font-mono font-black italic text-xs sm:text-sm text-white tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {numStr}
                      </span>
                    </div>

                    {/* Player Name Capsule (Right) */}
                    <div 
                      className="flex-1 h-8 sm:h-9 rounded-r-xl rounded-l-md px-3 sm:px-4 flex items-center justify-between border-t border-white/90 shadow-[0_2px_4px_rgba(0,0,0,0.35)] min-w-0"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #edf2f7 45%, #d1dce7 100%)'
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {player.photo && (
                          <img 
                            src={player.photo} 
                            alt={displayName} 
                            className="w-6 h-6 rounded-full object-cover border border-slate-400 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span className="font-black text-[#031535] text-xs sm:text-[13px] md:text-sm tracking-wider uppercase truncate">
                          {displayName}
                        </span>
                      </div>

                      {/* Captain / Wicketkeeper Badge */}
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {player.isC && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] tracking-wider uppercase shadow-sm">
                            (C)
                          </span>
                        )}
                        {player.isWk && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-600 text-white font-black text-[9px] tracking-wider uppercase shadow-sm">
                            (WK)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* TEAM B SQUAD CONTAINER */}
          <div 
            className="relative rounded-[24px] sm:rounded-[28px] p-3 sm:p-4 bg-gradient-to-b from-[#03112c]/95 via-[#020917]/95 to-[#041535]/95 shadow-[0_10px_30px_rgba(0,0,0,0.8)] border-[3px] border-[#c89222]"
            style={{
              boxShadow: 'inset 0 0 14px rgba(6, 182, 212, 0.4), 0 0 20px rgba(6, 182, 212, 0.15)'
            }}
          >
            {/* Sculpted Corner Gold Brackets (Top-Right & Bottom-Right) */}
            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#ffe694] rounded-tr-[24px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#ffe694] rounded-br-[24px] pointer-events-none" />

            {/* 11 Player Rows */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              {rosterB.map((player, idx) => {
                const numStr = (idx + 1).toString().padStart(2, '0');
                const displayName = player.name.replace(/\s*\((?:c|wk|capt)\)/gi, '').trim().toUpperCase();

                return (
                  <div 
                    key={idx}
                    className="flex items-center gap-1.5 sm:gap-2 w-full group"
                  >
                    {/* Number Tag (Left) */}
                    <div 
                      className="w-10 sm:w-12 h-8 sm:h-9 shrink-0 rounded-l-xl rounded-r-md flex items-center justify-center border border-cyan-400/40 shadow-sm"
                      style={{
                        background: 'linear-gradient(180deg, #0a295f 0%, #041433 50%, #020b1d 100%)'
                      }}
                    >
                      <span className="font-mono font-black italic text-xs sm:text-sm text-white tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {numStr}
                      </span>
                    </div>

                    {/* Player Name Capsule (Right) */}
                    <div 
                      className="flex-1 h-8 sm:h-9 rounded-r-xl rounded-l-md px-3 sm:px-4 flex items-center justify-between border-t border-white/90 shadow-[0_2px_4px_rgba(0,0,0,0.35)] min-w-0"
                      style={{
                        background: 'linear-gradient(180deg, #ffffff 0%, #edf2f7 45%, #d1dce7 100%)'
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {player.photo && (
                          <img 
                            src={player.photo} 
                            alt={displayName} 
                            className="w-6 h-6 rounded-full object-cover border border-slate-400 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span className="font-black text-[#031535] text-xs sm:text-[13px] md:text-sm tracking-wider uppercase truncate">
                          {displayName}
                        </span>
                      </div>

                      {/* Captain / Wicketkeeper Badge */}
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {player.isC && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black text-[9px] tracking-wider uppercase shadow-sm">
                            (C)
                          </span>
                        )}
                        {player.isWk && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-600 text-white font-black text-[9px] tracking-wider uppercase shadow-sm">
                            (WK)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* =========================================================================
            3. BOTTOM TOURNAMENT BANNER: — TROPHY T20 —
           ========================================================================= */}
        <div className="relative mt-3 z-10 flex items-center justify-center">
          <div 
            className="px-12 sm:px-16 py-1.5 sm:py-2 bg-gradient-to-r from-[#030f28] via-[#08285f] to-[#030f28] border-y-2 border-[#f3be53] shadow-[0_0_20px_rgba(243,190,83,0.3)]"
            style={{
              clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)'
            }}
          >
            <div className="flex items-center gap-3 font-black tracking-[0.2em] text-xs sm:text-sm uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#fffbe6] via-[#ffd269] to-[#d97706] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              <span className="h-[1.5px] w-6 bg-gradient-to-r from-transparent to-[#ffd269] inline-block" />
              <span>{tournamentLabel}</span>
              <span className="h-[1.5px] w-6 bg-gradient-to-l from-transparent to-[#ffd269] inline-block" />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
