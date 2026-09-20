import React from 'react';
import { motion } from 'motion/react';
import { Trophy, X } from 'lucide-react';

export interface TeamVsTeamOverlayProps {
  tournamentName?: string;
  tournamentLogo?: string;
  matchStage?: string;
  matchVenue?: string;
  matchNumber?: string | number;
  teamAName: string;
  teamBName: string;
  teamALogo?: string;
  teamBLogo?: string;
  teamAColor?: string;
  teamBColor?: string;
  onClose?: () => void;
  isStandalonePreview?: boolean;
}

/**
 * Iconic Tournament Team Shield from the reference scoreboard image:
 * Features a heraldic shield with satin-silver metallic gradient,
 * thick chrome-white border, and prominent diagonal sash.
 */
const ReferenceTournamentShield: React.FC<{
  teamLogo?: string;
  teamName: string;
  accentColor?: string;
  side: 'A' | 'B';
}> = ({ teamLogo, teamName, side }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-3">
      {teamLogo ? (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle shield silhouette underlay behind logo for championship frame */}
          <svg
            viewBox="0 0 200 240"
            className="absolute inset-0 w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] opacity-40 pointer-events-none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 28 22 C 65 32, 135 32, 172 22 C 188 70, 186 142, 100 224 C 14 142, 12 70, 28 22 Z"
              fill="#1e293b"
              stroke="#ffffff"
              strokeWidth="6"
            />
          </svg>
          <img
            src={teamLogo}
            alt={teamName}
            className="relative max-w-[82%] max-h-[82%] object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.8)]"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <svg
          viewBox="0 0 200 240"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.65)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Satin silver metallic gradient inside shield */}
            <linearGradient id={`shieldSatin-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="30%" stopColor="#cbd5e1" />
              <stop offset="65%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Chrome white border gradient */}
            <linearGradient id={`shieldBorder-${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            {/* Clip path for the diagonal sash so it stays precisely within the shield */}
            <clipPath id={`shieldClip-${side}`}>
              <path d="M 28 22 C 65 32, 135 32, 172 22 C 188 70, 186 142, 100 224 C 14 142, 12 70, 28 22 Z" />
            </clipPath>
          </defs>

          {/* Shield Satin Interior */}
          <path
            d="M 28 22 C 65 32, 135 32, 172 22 C 188 70, 186 142, 100 224 C 14 142, 12 70, 28 22 Z"
            fill={`url(#shieldSatin-${side})`}
          />

          {/* Diagonal White/Silver Sash cutting across from upper-left to bottom-right */}
          <g clipPath={`url(#shieldClip-${side})`}>
            {/* Soft inner shadow of sash */}
            <polygon
              points="14,14 46,6 186,182 154,190"
              fill="rgba(0, 0, 0, 0.18)"
              transform="translate(2, 4)"
            />
            {/* Brilliant white diagonal sash */}
            <polygon
              points="16,12 46,4 186,180 156,188"
              fill="#ffffff"
            />
            {/* Top metallic gloss highlight */}
            <path
              d="M 28 22 C 65 32, 135 32, 172 22 C 178 40, 176 75, 100 85 C 24 75, 22 40, 28 22 Z"
              fill="rgba(255, 255, 255, 0.28)"
            />
          </g>

          {/* Bold White Outer Shield Frame matching reference image */}
          <path
            d="M 28 22 C 65 32, 135 32, 172 22 C 188 70, 186 142, 100 224 C 14 142, 12 70, 28 22 Z"
            fill="none"
            stroke={`url(#shieldBorder-${side})`}
            strokeWidth="9"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

/**
 * Center League/Tournament Medallion:
 * If tournament logo exists, shows it; otherwise renders an authentic
 * cricket league emblem closely matching the reference image's CricLife logo.
 */
const CenterTournamentMedallion: React.FC<{
  logoUrl?: string;
  tournamentName?: string;
}> = ({ logoUrl, tournamentName }) => {
  if (logoUrl) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-2.5">
        <img
          src={logoUrl}
          alt={tournamentName || 'Tournament'}
          className="max-w-full max-h-full object-contain rounded-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center p-1 sm:p-1.5">
      <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#0a1226] via-[#091e42] to-[#020617] border-2 border-amber-400/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center p-1 text-center">
        {/* Stadium Floodlight Glow */}
        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-sky-400/25 to-transparent pointer-events-none" />
        
        {/* Silhouette Batsman Playing Shot */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[18px] sm:text-[22px] md:text-[26px] leading-none select-none">🏏</span>
          <div className="mt-0.5 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent font-black font-sans text-[8px] sm:text-[10px] md:text-[11px] uppercase tracking-tighter leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            CRIC LEAGUE
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            <span className="text-[6px] sm:text-[7px] font-black uppercase text-rose-450 bg-rose-500/20 px-1 py-0.2 rounded border border-rose-500/40">
              LIVE TV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamVsTeamOverlay: React.FC<TeamVsTeamOverlayProps> = ({
  tournamentName = 'KARJAT BIG BASH LEAGUE',
  tournamentLogo,
  matchStage = 'Match No. 1, Group Match',
  matchVenue,
  matchNumber,
  teamAName = 'JAMKHED 11',
  teamBName = 'KARJAT 11',
  teamALogo,
  teamBLogo,
  onClose,
  isStandalonePreview = false,
}) => {
  // Construct stage/match info line
  const effectiveStageText = React.useMemo(() => {
    const parts: string[] = [];
    if (matchNumber) {
      parts.push(typeof matchNumber === 'number' ? `Match No. ${matchNumber}` : String(matchNumber));
    }
    if (matchStage && !matchNumber) {
      parts.push(matchStage);
    } else if (matchStage && matchNumber && !matchStage.toLowerCase().includes('match')) {
      parts.push(matchStage);
    }
    if (matchVenue) {
      parts.push(matchVenue);
    }
    return parts.length > 0 ? parts.join(', ') : 'Match No. 1, Group Match';
  }, [matchNumber, matchStage, matchVenue]);

  return (
    <div
      id="overlay-team-vs-team"
      className={`relative w-full max-w-[880px] mx-auto select-none font-sans px-3 sm:px-6 md:px-8 ${
        isStandalonePreview ? 'my-auto' : ''
      }`}
    >
      {/* Optional Close Button for Broadcast Director preview */}
      {onClose && (
        <button
          onClick={onClose}
          id="btn-close-team-vs-team-overlay"
          title="Dismiss Overlay"
          className="absolute -top-3 right-3 sm:right-6 z-50 p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white hover:bg-rose-600 border border-white/20 shadow-xl transition-all cursor-pointer pointer-events-auto"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Main Staging Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]"
      >
        {/* =========================================================================
            1. TOP METALLIC HEADER BAR (Reference match title & stage)
            ========================================================================= */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
          className="relative w-full z-20 overflow-hidden"
        >
          {/* The Outer Slanted Carrier Shape */}
          <div className="relative w-full flex items-stretch h-14 sm:h-16 md:h-20">
            {/* Left Angled Blue Accent Tab */}
            <div
              className="w-7 sm:w-10 md:w-14 shrink-0 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 65% 100%, 0% 100%)',
              }}
            />

            {/* Central White/Silver Brushed Metallic Header Body */}
            <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-[#ffffff] via-[#f1f5f9] via-45% to-[#cbd5e1] border-t-2 border-b-2 border-t-white border-b-slate-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.9),0_6px_14px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Animated Light Sweep Sheen */}
              <motion.div
                initial={{ x: '-150%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4.5, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-36 bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-25deg] pointer-events-none"
              />

              {/* Tournament Title */}
              <h1 className="text-base sm:text-xl md:text-2xl lg:text-[26px] font-black uppercase tracking-wider text-slate-950 font-sans leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                {tournamentName || 'KARJAT BIG BASH LEAGUE'}
              </h1>

              {/* Match Stage & Details Subtitle */}
              <p className="text-[10px] sm:text-xs md:text-[13px] font-bold text-slate-700 uppercase tracking-widest leading-tight mt-0.5 sm:mt-1 font-sans drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                {effectiveStageText}
              </p>
            </div>

            {/* Right Angled Red Accent Tab */}
            <div
              className="w-7 sm:w-10 md:w-14 shrink-0 bg-gradient-to-l from-red-900 via-red-700 to-red-600"
              style={{
                clipPath: 'polygon(35% 0%, 100% 0%, 100% 100%, 0% 100%)',
              }}
            />
          </div>
        </motion.div>

        {/* =========================================================================
            2. CENTER CHARCOAL SLATE STAGE FRAME (Reference: Team A, Center Medallion, Team B)
            ========================================================================= */}
        <div className="relative w-full bg-gradient-to-b from-[#474d53] via-[#3a3f44] to-[#2c3034] border-x-2 border-slate-600/80 shadow-[inset_0_4px_16px_rgba(0,0,0,0.7),0_15px_35px_rgba(0,0,0,0.7)] py-6 sm:py-9 md:py-12 px-3 sm:px-8">
          <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-12 max-w-[760px] mx-auto">
            {/* ---------------------------------------------------------------
                TEAM A CUSHION CONTAINER (Rich Blue Beveled 3D Frame)
                --------------------------------------------------------------- */}
            <motion.div
              initial={{ x: -70, opacity: 0, scale: 0.85 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.1 }}
              className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-[24px] sm:rounded-[34px] md:rounded-[42px] p-2 sm:p-3 bg-gradient-to-br from-[#1d4ed8] via-[#1e3a8a] to-[#0f172a] border-[5px] sm:border-[8px] md:border-[10px] border-t-blue-400 border-l-blue-500 border-r-blue-900 border-b-blue-950 shadow-[0_16px_35px_rgba(15,23,42,0.9),inset_0_4px_12px_rgba(255,255,255,0.35)] flex items-center justify-center overflow-hidden"
            >
              {/* Inner Cushion Shadow */}
              <div className="absolute inset-1 rounded-[18px] sm:rounded-[26px] md:rounded-[32px] bg-gradient-to-br from-blue-600/40 via-blue-900/60 to-black/80 pointer-events-none" />

              {/* Team A Shield Emblem */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <ReferenceTournamentShield
                  teamLogo={teamALogo}
                  teamName={teamAName}
                  accentColor="#1d4ed8"
                  side="A"
                />
              </div>
            </motion.div>

            {/* ---------------------------------------------------------------
                CENTER TOURNAMENT / LEAGUE MEDALLION (White/Silver Beveled Plaque)
                --------------------------------------------------------------- */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.2 }}
              className="relative w-18 h-18 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-[20px] sm:rounded-[28px] md:rounded-[36px] p-1.5 sm:p-2 bg-gradient-to-br from-[#ffffff] via-[#f8fafc] via-40% to-[#cbd5e1] border-[3px] sm:border-[5px] md:border-[6px] border-t-white border-l-slate-200 border-r-slate-400 border-b-slate-600 shadow-[0_12px_28px_rgba(0,0,0,0.8),inset_0_3px_8px_rgba(255,255,255,0.95)] flex items-center justify-center shrink-0 z-10"
            >
              <CenterTournamentMedallion
                logoUrl={tournamentLogo}
                tournamentName={tournamentName}
              />
            </motion.div>

            {/* ---------------------------------------------------------------
                TEAM B CUSHION CONTAINER (Rich Red Beveled 3D Frame)
                --------------------------------------------------------------- */}
            <motion.div
              initial={{ x: 70, opacity: 0, scale: 0.85 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: 0.1 }}
              className="relative w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 rounded-[24px] sm:rounded-[34px] md:rounded-[42px] p-2 sm:p-3 bg-gradient-to-br from-[#dc2626] via-[#991b1b] to-[#450a0a] border-[5px] sm:border-[8px] md:border-[10px] border-t-rose-400 border-l-red-500 border-r-red-900 border-b-red-950 shadow-[0_16px_35px_rgba(0,0,0,0.9),inset_0_4px_12px_rgba(255,255,255,0.35)] flex items-center justify-center overflow-hidden"
            >
              {/* Inner Cushion Shadow */}
              <div className="absolute inset-1 rounded-[18px] sm:rounded-[26px] md:rounded-[32px] bg-gradient-to-br from-red-600/40 via-red-900/60 to-black/80 pointer-events-none" />

              {/* Team B Shield Emblem */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <ReferenceTournamentShield
                  teamLogo={teamBLogo}
                  teamName={teamBName}
                  accentColor="#dc2626"
                  side="B"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* =========================================================================
            3. BOTTOM BANNER BAR (Team A Name • Center 'V' Plaque • Team B Name)
            ========================================================================= */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.15 }}
          className="relative w-full z-20 overflow-hidden"
        >
          {/* The Outer Carrier with angled cut end caps */}
          <div className="relative w-full flex items-stretch h-12 sm:h-14 md:h-18 bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] border-t-2 border-b-2 border-t-white border-b-slate-800 shadow-[0_14px_30px_rgba(0,0,0,0.85)] p-[2.5px] sm:p-1">
            {/* Left Angled Blue Corner Accent Tab */}
            <div
              className="w-5 sm:w-8 md:w-12 shrink-0 bg-gradient-to-r from-blue-900 to-blue-700"
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 70% 100%, 0% 100%)',
              }}
            />

            {/* Left Banner: Team A Blue Metallic Bar */}
            <div className="relative flex-1 flex items-center justify-center px-2 sm:px-4 bg-gradient-to-b from-[#2563eb] via-[#1d4ed8] via-45% to-[#172554] border-t border-b border-t-blue-300/60 border-b-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_3px_8px_rgba(0,0,0,0.5)] overflow-hidden">
              <motion.div
                initial={{ x: '-150%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 4.8, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
              />
              <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black uppercase text-white font-sans tracking-wider truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {teamAName || 'JAMKHED 11'}
              </span>
            </div>

            {/* Center: Silver Metallic 'V' Plaque */}
            <motion.div
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 450, damping: 14, delay: 0.25 }}
              className="relative w-11 sm:w-14 md:w-18 h-full bg-gradient-to-b from-[#ffffff] via-[#e2e8f0] via-45% to-[#94a3b8] border-x-2 sm:border-x-[3px] border-slate-700/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.95),0_0_12px_rgba(0,0,0,0.6)] flex items-center justify-center shrink-0 z-10"
            >
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-slate-950 font-serif tracking-tighter drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)] leading-none select-none">
                V
              </span>
            </motion.div>

            {/* Right Banner: Team B Red Metallic Bar */}
            <div className="relative flex-1 flex items-center justify-center px-2 sm:px-4 bg-gradient-to-b from-[#ef4444] via-[#dc2626] via-45% to-[#7f1d1d] border-t border-b border-t-rose-300/60 border-b-black shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_3px_8px_rgba(0,0,0,0.5)] overflow-hidden">
              <motion.div
                initial={{ x: '-150%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 5.2, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] pointer-events-none"
              />
              <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black uppercase text-white font-sans tracking-wider truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {teamBName || 'KARJAT 11'}
              </span>
            </div>

            {/* Right Angled Red Corner Accent Tab */}
            <div
              className="w-5 sm:w-8 md:w-12 shrink-0 bg-gradient-to-l from-red-900 to-red-700"
              style={{
                clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
