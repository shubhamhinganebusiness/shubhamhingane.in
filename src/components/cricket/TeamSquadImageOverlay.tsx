import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Users, Shield, ChevronLeft, ChevronRight, Star, Sparkles, MapPin, Award } from 'lucide-react';
import { MatchState } from './CricketFullScreenTransitions';

export interface SquadPlayerItem {
  id?: string;
  name: string;
  photo?: string;
  isCaptain?: boolean;
  isWicketkeeper?: boolean;
  role?: string;
  number?: number;
}

interface TeamSquadImageOverlayProps {
  match: MatchState;
  initialTeam?: 'teamA' | 'teamB';
  onClose?: () => void;
}

/**
 * High-fidelity Vector Cricket Player Avatar
 * Matches the reference image: Faceless stylized portrait, neat cropped hair, tan skin, white jersey
 */
export const CricketPlayerVectorAvatar: React.FC<{
  className?: string;
  hairColor?: string;
  skinColor?: string;
  jerseyColor?: string;
  playerIndex?: number;
}> = ({
  className = "w-28 h-28",
  hairColor,
  skinColor,
  jerseyColor = "#ffffff",
  playerIndex = 0
}) => {
  // Slight natural hair/skin variation based on index so 11 players look like unique squad members
  const hairTones = ['#b8906f', '#9b7653', '#855e3e', '#aa8360', '#a07855'];
  const skinTones = ['#f5d4be', '#efc6ae', '#f8ddcb', '#ecc1a7', '#f2ceb7'];

  const selectedHair = hairColor || hairTones[playerIndex % hairTones.length];
  const selectedSkin = skinColor || skinTones[playerIndex % skinTones.length];

  return (
    <svg 
      viewBox="0 0 120 130" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`skinGrad_${playerIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fff2e5" />
          <stop offset="40%" stopColor={selectedSkin} />
          <stop offset="100%" stopColor="#d8ab8c" />
        </linearGradient>
        <linearGradient id={`hairGrad_${playerIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#cbb094" />
          <stop offset="60%" stopColor={selectedHair} />
          <stop offset="100%" stopColor="#7a5534" />
        </linearGradient>
        <linearGradient id={`jerseyGrad_${playerIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={jerseyColor} />
          <stop offset="70%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <filter id={`avatarShadow_${playerIndex}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.2" />
        </filter>
      </defs>

      <g filter={`url(#avatarShadow_${playerIndex})`}>
        {/* White Cricket Jersey Shoulders & Body */}
        <path 
          d="M18 130 C18 96, 35 88, 48 84 L52 92 C56 96, 64 96, 68 92 L72 84 C85 88, 102 96, 102 130 Z" 
          fill={`url(#jerseyGrad_${playerIndex})`} 
          stroke="#cbd5e1" 
          strokeWidth="1.2"
        />
        {/* Collar & Neck Opening */}
        <path 
          d="M48 84 C55 92, 65 92, 72 84" 
          stroke="#94a3b8" 
          strokeWidth="1.5" 
          fill="none" 
        />
        <path 
          d="M52 92 L60 99 L68 92" 
          stroke="#cbd5e1" 
          strokeWidth="1" 
          fill="none" 
        />

        {/* Neck with chin shadow */}
        <path 
          d="M49 68 L49 90 C56 95, 64 95, 71 90 L71 68 Z" 
          fill="#d4a382" 
        />
        <path 
          d="M51 68 L51 86 C56 90, 64 90, 69 86 L69 68 Z" 
          fill={`url(#skinGrad_${playerIndex})`} 
        />

        {/* Face Oval */}
        <ellipse 
          cx="60" 
          cy="50" 
          rx="21" 
          ry="26" 
          fill={`url(#skinGrad_${playerIndex})`} 
        />

        {/* Ears */}
        <circle cx="39" cy="50" r="4.5" fill="#e2b798" />
        <circle cx="81" cy="50" r="4.5" fill="#e2b798" />

        {/* Modern Trimmed Haircut */}
        <path 
          d="M39 46 C37 31, 46 20, 60 20 C74 20, 83 31, 81 46 C78 37, 73 31, 60 31 C47 31, 42 37, 39 46 Z" 
          fill={`url(#hairGrad_${playerIndex})`} 
        />
        {/* Subtle Hair Highlight */}
        <path 
          d="M42 37 C46 27, 54 23, 60 23 C66 23, 74 27, 78 37 C74 31, 67 28, 60 28 C53 28, 46 31, 42 37 Z" 
          fill="#ffffff" 
          opacity="0.25" 
        />
      </g>
    </svg>
  );
};

export const TeamSquadImageOverlay: React.FC<TeamSquadImageOverlayProps> = ({
  match,
  initialTeam = 'teamA',
  onClose
}) => {
  // Current active team displayed
  const [selectedTeam, setSelectedTeam] = useState<'teamA' | 'teamB'>(initialTeam);
  // View mode: Full 11 Playing XI Grid (default) OR Spotlight Player Showcase (1:1 with user image)
  const [viewMode, setViewMode] = useState<'grid' | 'spotlight'>('grid');
  // Focused player index in spotlight mode
  const [spotlightIndex, setSpotlightIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedTeam(initialTeam);
  }, [initialTeam]);

  // Team names & identities
  const teamAName = (match.teamA || 'RASHIN').trim();
  const teamBName = (match.teamB || 'MIRGAON').trim();
  const currentTeamName = selectedTeam === 'teamA' ? teamAName : teamBName;
  const opponentTeamName = selectedTeam === 'teamA' ? teamBName : teamAName;
  const isTeamA = selectedTeam === 'teamA';

  // Tournament branding
  const tournamentName = match.tournamentName || (match as any)?.seriesName || 'STAR TV PREMIER LEAGUE 2026';
  const tournamentLogo = match.tournamentLogo;
  const matchStage = match.status === 'completed'
    ? 'FINAL RESULT'
    : match.innings2
    ? '2ND INNINGS • CHASE'
    : 'Match No. 2 , Group Match';

  // Toss resolution
  const tossWinner = (match.tossWinner || (match as any)?.toss?.winner || '').trim();
  const tossChoice = ((match.tossChoice || (match as any)?.toss?.choice || 'bat').trim().toLowerCase() === 'bowl') ? 'bowl' : 'bat';
  
  const bottomBannerText = tossWinner
    ? `'${tossWinner.toUpperCase()}' won the toss and elected to ${tossChoice}`
    : `'${teamBName.toUpperCase()}' won the toss and elected to bat`;

  // Build complete 11-player squad roster with photos, avatars, and roles
  const squadPlayers = useMemo<SquadPlayerItem[]>(() => {
    const explicitSquad = isTeamA ? match.teamASquad : match.teamBSquad;
    const captainName = (isTeamA ? match.teamACaptain : match.teamBCaptain) || '';
    const wkName = (isTeamA ? match.teamAWicketKeeper : match.teamBWicketKeeper) || '';

    const list: SquadPlayerItem[] = [];
    const addedNames = new Set<string>();

    if (explicitSquad && explicitSquad.length > 0) {
      explicitSquad.forEach((p, idx) => {
        const rawName = typeof p === 'string' ? p : (p.name || `Player ${idx + 1}`);
        const cleanName = rawName.replace(/\s*\((c|wk|c\/wk|captain)\)/gi, '').trim();
        const lowerName = cleanName.toLowerCase();

        if (!addedNames.has(lowerName)) {
          addedNames.add(lowerName);

          const isCap = typeof p === 'object' && p.isCaptain !== undefined
            ? Boolean(p.isCaptain)
            : (captainName ? lowerName.includes(captainName.toLowerCase()) : idx === 0 || /\(c\)/i.test(rawName));

          const isWk = typeof p === 'object' && p.isWicketkeeper !== undefined
            ? Boolean(p.isWicketkeeper)
            : (wkName ? lowerName.includes(wkName.toLowerCase()) : /\(wk\)/i.test(rawName));

          const photo = typeof p === 'object' && p.photo
            ? p.photo
            : (match.playerPhotos?.[lowerName] || match.playerPhotos?.[rawName.toLowerCase()]);

          const role = typeof p === 'object' && (p as any).role
            ? (p as any).role
            : idx < 3 ? 'BATSMAN' : idx > 7 ? 'BOWLER' : 'ALL-ROUNDER';

          list.push({
            id: `p_${idx}`,
            name: cleanName,
            photo,
            isCaptain: isCap,
            isWicketkeeper: isWk,
            role,
            number: idx + 1
          });
        }
      });
    }

    // Fallback: Check innings batsmen or bowlers
    const relevantInnings = isTeamA
      ? (match.innings1?.battingTeam === teamAName ? match.innings1 : match.innings2)
      : (match.innings1?.battingTeam === teamBName ? match.innings1 : match.innings2);

    if (relevantInnings?.batsmen) {
      relevantInnings.batsmen.forEach((b, idx) => {
        if (b.name) {
          const cleanName = b.name.replace(/\s*\((c|wk)\)/gi, '').trim();
          const lowerName = cleanName.toLowerCase();
          if (!addedNames.has(lowerName)) {
            addedNames.add(lowerName);
            list.push({
              id: `inn_b_${idx}`,
              name: cleanName,
              photo: match.playerPhotos?.[lowerName],
              isCaptain: idx === 0,
              isWicketkeeper: idx === 1,
              role: idx < 4 ? 'BATSMAN' : 'ALL-ROUNDER',
              number: list.length + 1
            });
          }
        }
      });
    }

    // Standard authentic fallback names if fewer than 11 players
    const defaultRosterTeamA = [
      'Mayur', 'Rohit', 'Sagar', 'Akshay', 
      'Prathamesh', 'Kiran', 'Vishal', 'Nilesh', 
      'Amol', 'Mahesh', 'Ganesh'
    ];
    const defaultRosterTeamB = [
      'Ajay', 'Swapnil', 'Sachin', 'Rahul', 
      'Vikas', 'Dinesh', 'Pravin', 'Chetan', 
      'Siddharth', 'Abhishek', 'Omkar'
    ];

    const fallbackNames = isTeamA ? defaultRosterTeamA : defaultRosterTeamB;
    let fallbackIdx = 0;

    while (list.length < 11 && fallbackIdx < fallbackNames.length) {
      const candidate = fallbackNames[fallbackIdx];
      const lower = candidate.toLowerCase();
      if (!addedNames.has(lower)) {
        addedNames.add(lower);
        list.push({
          id: `fb_${list.length}`,
          name: candidate,
          photo: match.playerPhotos?.[lower],
          isCaptain: list.length === 0,
          isWicketkeeper: list.length === 1,
          role: list.length < 4 ? 'BATSMAN' : list.length > 7 ? 'BOWLER' : 'ALL-ROUNDER',
          number: list.length + 1
        });
      }
      fallbackIdx++;
    }

    // Pad if still fewer than 11
    while (list.length < 11) {
      const num = list.length + 1;
      list.push({
        id: `num_${num}`,
        name: `Player ${num}`,
        photo: undefined,
        isCaptain: num === 1,
        isWicketkeeper: num === 2,
        role: num <= 4 ? 'BATSMAN' : num >= 8 ? 'BOWLER' : 'ALL-ROUNDER',
        number: num
      });
    }

    return list.slice(0, 11);
  }, [isTeamA, match, teamAName, teamBName]);

  const activePlayer = squadPlayers[spotlightIndex] || squadPlayers[0];
  const captainPlayer = squadPlayers.find(p => p.isCaptain) || squadPlayers[0];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
      {/* Outer Card Container with exact aspect ratio & positioning */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[1240px] flex flex-col items-center justify-center relative"
      >
        {/* Top Control Tabs Bar (Team A vs Team B Switcher & Dismiss) */}
        <div className="w-full flex items-center justify-between px-3 sm:px-6 mb-2.5 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTeam('teamA')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl font-black font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                selectedTeam === 'teamA'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <Shield size={13} className={selectedTeam === 'teamA' ? 'text-amber-400' : 'text-slate-400'} />
              <span>{teamAName} SQUAD (XI)</span>
            </button>

            <button
              onClick={() => setSelectedTeam('teamB')}
              className={`px-3 sm:px-4 py-1.5 rounded-xl font-black font-mono text-[10px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                selectedTeam === 'teamB'
                  ? 'bg-blue-600 text-white border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <Shield size={13} className={selectedTeam === 'teamB' ? 'text-amber-400' : 'text-slate-400'} />
              <span>{teamBName} SQUAD (XI)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Grid vs Spotlight */}
            <div className="bg-slate-900/90 border border-white/15 p-0.5 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👥 All 11 Squad
              </button>
              <button
                onClick={() => setViewMode('spotlight')}
                className={`px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'spotlight'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⭐ Spotlight (1:1)
              </button>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-rose-600/80 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer shadow-lg"
                title="Dismiss Squad Overlay"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ----------------- SECTION 1: TOP HEADER METALLIC BAR WITH CHEVRONS ----------------- */}
        <div className="w-full flex items-center relative z-10 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
          {/* Left Blue Chevron Arrow (<) */}
          <div className="w-6 sm:w-10 md:w-14 h-14 sm:h-16 md:h-20 shrink-0 flex items-center justify-center relative">
            <svg viewBox="0 0 40 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="leftChevronGrad" x1="100%" y1="0%" x2="0%" y2="50%">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="60%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
              </defs>
              <polygon points="40,0 0,30 40,60" fill="url(#leftChevronGrad)" stroke="#60a5fa" strokeWidth="1.5" />
              <polyline points="40,5 6,30 40,55" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
          </div>

          {/* Center White/Metallic Bar with Overhanging Badges */}
          <div className="flex-1 h-14 sm:h-16 md:h-20 bg-gradient-to-b from-slate-50 via-white to-slate-200 border-y-2 border-white shadow-xl flex items-center justify-between px-2 sm:px-6 relative">
            {/* Left Tournament Logo Badge (Overhanging) */}
            <div className="w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 rounded-2xl bg-white border-2 border-slate-300 shadow-[0_4px_14px_rgba(0,0,0,0.25)] flex items-center justify-center p-1 shrink-0 -translate-y-0 sm:-translate-y-1 z-20">
              {tournamentLogo ? (
                <img 
                  src={tournamentLogo} 
                  alt="Tournament" 
                  className="w-full h-full object-contain rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-950 flex flex-col items-center justify-center p-1 text-center border border-amber-400/40 shadow-inner">
                  <span className="text-[7.5px] sm:text-[9px] font-black text-amber-400 tracking-tighter leading-none font-mono">
                    CRIC
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-black text-white tracking-widest leading-none font-mono mt-0.5">
                    LIFE
                  </span>
                  <div className="h-0.5 w-6 bg-amber-400 my-0.5" />
                  <span className="text-[5.5px] sm:text-[6.5px] font-bold text-sky-300 uppercase">
                    PRO TV
                  </span>
                </div>
              )}
            </div>

            {/* Center Typography (Team Name & Subtitle) */}
            <div className="flex-1 flex flex-col items-center justify-center text-center px-2 min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-wider text-slate-900 leading-tight truncate max-w-full drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                {currentTeamName}
              </h2>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-slate-700 tracking-wide uppercase truncate max-w-full mt-0.5">
                {matchStage}
              </p>
            </div>

            {/* Right Badge: Captain or Top Player Avatar (Overhanging) */}
            <div className="w-12 sm:w-16 md:w-20 h-12 sm:h-16 md:h-20 rounded-2xl bg-white border-2 border-slate-300 shadow-[0_4px_14px_rgba(0,0,0,0.25)] flex items-center justify-center p-1 shrink-0 -translate-y-0 sm:-translate-y-1 z-20 overflow-hidden">
              {captainPlayer.photo ? (
                <img 
                  src={captainPlayer.photo} 
                  alt={captainPlayer.name} 
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <CricketPlayerVectorAvatar 
                  className="w-full h-full"
                  playerIndex={0}
                />
              )}
            </div>
          </div>

          {/* Right Blue Chevron Arrow (>) */}
          <div className="w-6 sm:w-10 md:w-14 h-14 sm:h-16 md:h-20 shrink-0 flex items-center justify-center relative">
            <svg viewBox="0 0 40 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="rightChevronGrad" x1="0%" y1="0%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#1d4ed8" />
                  <stop offset="60%" stopColor="#2563eb" />
                  <stop offset="100%" stopColor="#1e40af" />
                </linearGradient>
              </defs>
              <polygon points="0,0 40,30 0,60" fill="url(#rightChevronGrad)" stroke="#60a5fa" strokeWidth="1.5" />
              <polyline points="0,5 34,30 0,55" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* ----------------- SECTION 2: MAIN CENTRAL DARK NAVY CONTAINER ----------------- */}
        <div className="w-full mt-[-8px] sm:mt-[-12px] pt-4 sm:pt-6 pb-4 sm:pb-6 px-4 sm:px-8 bg-gradient-to-b from-[#0e1738] via-[#0a1129] to-[#060b1b] rounded-[28px] sm:rounded-[36px] border-2 border-blue-900/50 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] min-h-[360px] sm:min-h-[420px] md:min-h-[460px] flex flex-col justify-center items-center relative overflow-hidden">
          {/* Subtle Stadium Light Cones Background Effect */}
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* VIEW MODE A: FULL 11 SQUAD ROSTER GRID */}
          {viewMode === 'grid' && (
            <div className="w-full flex flex-col items-center justify-center my-auto">
              {/* Row 1: Top 6 Players */}
              <div className="w-full flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-wrap mb-3 sm:mb-4">
                {squadPlayers.slice(0, 6).map((player, idx) => (
                  <motion.div
                    key={player.id || idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}
                    onClick={() => {
                      setSpotlightIndex(idx);
                      setViewMode('spotlight');
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                    title={`Click to spotlight ${player.name}`}
                  >
                    {/* Player Image / Avatar Card */}
                    <div className="w-16 sm:w-20 md:w-24 lg:w-28 h-20 sm:h-24 md:h-28 lg:h-32 flex items-center justify-center relative transition-transform duration-200 group-hover:scale-105">
                      {/* Badge (C) or (WK) */}
                      {player.isCaptain && (
                        <div className="absolute top-0 right-0 z-10 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-black font-mono rounded-md shadow-md border border-white">
                          C
                        </div>
                      )}
                      {player.isWicketkeeper && !player.isCaptain && (
                        <div className="absolute top-0 right-0 z-10 px-1.5 py-0.5 bg-cyan-400 text-slate-950 text-[8px] sm:text-[9px] font-black font-mono rounded-md shadow-md border border-white">
                          WK
                        </div>
                      )}

                      {player.photo ? (
                        <div className="w-full h-full rounded-2xl overflow-hidden border border-blue-400/30 bg-slate-900/60 shadow-lg">
                          <img 
                            src={player.photo} 
                            alt={player.name}
                            className="w-full h-full object-cover object-top"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <CricketPlayerVectorAvatar 
                          className="w-full h-full drop-shadow-md"
                          playerIndex={idx}
                        />
                      )}
                    </div>

                    {/* Royal Blue Name Plate */}
                    <div className="mt-1 sm:mt-1.5 min-w-[70px] sm:min-w-[90px] md:min-w-[110px] max-w-[130px] px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 border-t border-blue-400/60 shadow-[0_3px_8px_rgba(0,0,0,0.4)] text-center transition-all group-hover:from-blue-500 group-hover:to-blue-700">
                      <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wide text-white truncate block">
                        {player.name}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Row 2: Bottom 5 Players */}
              <div className="w-full flex items-center justify-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-wrap">
                {squadPlayers.slice(6, 11).map((player, idx) => {
                  const globalIdx = idx + 6;
                  return (
                    <motion.div
                      key={player.id || globalIdx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: globalIdx * 0.04, duration: 0.25 }}
                      onClick={() => {
                        setSpotlightIndex(globalIdx);
                        setViewMode('spotlight');
                      }}
                      className="flex flex-col items-center group cursor-pointer"
                      title={`Click to spotlight ${player.name}`}
                    >
                      {/* Player Image / Avatar Card */}
                      <div className="w-16 sm:w-20 md:w-24 lg:w-28 h-20 sm:h-24 md:h-28 lg:h-32 flex items-center justify-center relative transition-transform duration-200 group-hover:scale-105">
                        {player.isCaptain && (
                          <div className="absolute top-0 right-0 z-10 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[8px] sm:text-[9px] font-black font-mono rounded-md shadow-md border border-white">
                            C
                          </div>
                        )}
                        {player.isWicketkeeper && !player.isCaptain && (
                          <div className="absolute top-0 right-0 z-10 px-1.5 py-0.5 bg-cyan-400 text-slate-950 text-[8px] sm:text-[9px] font-black font-mono rounded-md shadow-md border border-white">
                            WK
                          </div>
                        )}

                        {player.photo ? (
                          <div className="w-full h-full rounded-2xl overflow-hidden border border-blue-400/30 bg-slate-900/60 shadow-lg">
                            <img 
                              src={player.photo} 
                              alt={player.name}
                              className="w-full h-full object-cover object-top"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <CricketPlayerVectorAvatar 
                            className="w-full h-full drop-shadow-md"
                            playerIndex={globalIdx}
                          />
                        )}
                      </div>

                      {/* Royal Blue Name Plate */}
                      <div className="mt-1 sm:mt-1.5 min-w-[70px] sm:min-w-[90px] md:min-w-[110px] max-w-[130px] px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 border-t border-blue-400/60 shadow-[0_3px_8px_rgba(0,0,0,0.4)] text-center transition-all group-hover:from-blue-500 group-hover:to-blue-700">
                        <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-wide text-white truncate block">
                          {player.name}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE B: SPOTLIGHT SINGLE PLAYER (Exact 1:1 match with user uploaded reference image) */}
          {viewMode === 'spotlight' && (
            <div className="w-full flex flex-col items-center justify-center my-auto relative">
              {/* Navigation Left */}
              <button
                onClick={() => setSpotlightIndex(prev => (prev > 0 ? prev - 1 : squadPlayers.length - 1))}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-600/30 hover:bg-blue-600 border border-blue-400/50 text-white flex items-center justify-center transition cursor-pointer shadow-lg z-20"
                title="Previous Player"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Single Centered Player Showcase */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePlayer.id || spotlightIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center my-auto"
                >
                  {/* Large Avatar / Photo Card */}
                  <div className="w-48 sm:w-60 md:w-72 h-52 sm:h-64 md:h-72 flex items-center justify-center relative">
                    {/* (C) or (WK) Badge */}
                    {activePlayer.isCaptain && (
                      <div className="absolute top-2 right-4 z-10 px-3 py-1 bg-amber-400 text-slate-950 text-xs font-black font-mono rounded-lg shadow-xl border-2 border-white flex items-center gap-1">
                        <Star size={12} className="fill-slate-950" /> CAPTAIN
                      </div>
                    )}
                    {activePlayer.isWicketkeeper && !activePlayer.isCaptain && (
                      <div className="absolute top-2 right-4 z-10 px-3 py-1 bg-cyan-400 text-slate-950 text-xs font-black font-mono rounded-lg shadow-xl border-2 border-white flex items-center gap-1">
                        <Award size={12} /> WICKET KEEPER
                      </div>
                    )}

                    {activePlayer.photo ? (
                      <div className="w-44 sm:w-56 md:w-64 h-48 sm:h-60 md:h-68 rounded-3xl overflow-hidden border-2 border-blue-400/40 bg-slate-900/80 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
                        <img 
                          src={activePlayer.photo} 
                          alt={activePlayer.name}
                          className="w-full h-full object-cover object-top"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <CricketPlayerVectorAvatar 
                        className="w-full h-full drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]"
                        playerIndex={spotlightIndex}
                      />
                    )}
                  </div>

                  {/* Iconic Blue Pill Name Plate (Matching the reference screenshot) */}
                  <div className="mt-2 min-w-[160px] sm:min-w-[200px] md:min-w-[240px] px-6 py-2 rounded-xl bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 border-t-2 border-blue-400/80 shadow-[0_6px_16px_rgba(0,0,0,0.5),0_0_20px_rgba(37,99,235,0.4)] text-center">
                    <span className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wide text-white drop-shadow block">
                      {activePlayer.name}
                    </span>
                  </div>

                  {/* Player Index Subtitle */}
                  <div className="text-[11px] font-mono text-blue-300 font-bold tracking-wider mt-2 uppercase">
                    PLAYER #{spotlightIndex + 1} OF 11 • {activePlayer.role || 'SQUAD MEMBER'}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Right */}
              <button
                onClick={() => setSpotlightIndex(prev => (prev < squadPlayers.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-600/30 hover:bg-blue-600 border border-blue-400/50 text-white flex items-center justify-center transition cursor-pointer shadow-lg z-20"
                title="Next Player"
              >
                <ChevronRight size={24} />
              </button>

              {/* Player Thumbnail Dots / Selector */}
              <div className="flex items-center gap-1.5 mt-4">
                {squadPlayers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSpotlightIndex(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      i === spotlightIndex
                        ? 'w-6 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                        : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ----------------- SECTION 3: BOTTOM GOLDEN-YELLOW BANNER WITH CHEVRONS ----------------- */}
        <div className="w-full flex items-center relative z-10 mt-[-10px] sm:mt-[-14px] filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
          {/* Left Blue Chevron Arrow (<) */}
          <div className="w-6 sm:w-10 md:w-14 h-9 sm:h-11 md:h-13 shrink-0 flex items-center justify-center relative">
            <svg viewBox="0 0 40 40" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="40,0 0,20 40,40" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
              <polyline points="40,4 7,20 40,36" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
          </div>

          {/* Center Golden-Yellow Banner */}
          <div className="flex-1 h-9 sm:h-11 md:h-13 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border-y-2 border-yellow-100/90 shadow-xl flex items-center justify-center px-4">
            <span className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wider text-slate-950 text-center truncate max-w-full drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
              {bottomBannerText}
            </span>
          </div>

          {/* Right Blue Chevron Arrow (>) */}
          <div className="w-6 sm:w-10 md:w-14 h-9 sm:h-11 md:h-13 shrink-0 flex items-center justify-center relative">
            <svg viewBox="0 0 40 40" className="w-full h-full" preserveAspectRatio="none">
              <polygon points="0,0 40,20 0,40" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
              <polyline points="0,4 33,20 0,36" stroke="#93c5fd" strokeWidth="1" fill="none" opacity="0.6" />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
