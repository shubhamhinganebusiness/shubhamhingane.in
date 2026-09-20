import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Shield, Sparkles, X, Upload, Award } from 'lucide-react';
import type { MatchState } from './types';

interface TournamentLogoOverlayProps {
  match: MatchState;
  onClose?: () => void;
  onUpdateLogo?: (logoUrl: string) => void;
  mode?: 'ribbon' | 'card' | 'auto';
}

export const TournamentLogoOverlay: React.FC<TournamentLogoOverlayProps> = ({
  match,
  onClose,
  onUpdateLogo,
  mode = 'auto',
}) => {
  const [displayStyle, setDisplayStyle] = useState<'ribbon' | 'crest'>('ribbon');
  const [showUploader, setShowUploader] = useState<boolean>(false);
  const [logoInput, setLogoInput] = useState<string>('');

  const tournamentName = match?.tournamentName || match?.seriesName || 'PREMIER CRICKET TOURNAMENT';
  const teamA = match?.teamA || 'TEAM A';
  const teamB = match?.teamB || 'TEAM B';
  const tossWinner = match?.tossWinner || teamA;
  const tossChoice = (match?.tossChoice || 'bat').toLowerCase() === 'bowl' ? 'field' : 'bat';
  const venue = match?.venue || match?.groundName || 'LIVE CRICKET STADIUM';
  const matchNumber = match?.matchNumber || 'LIVE MATCH';
  const tournamentLogo = match?.tournamentLogo;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateLogo) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          onUpdateLogo(result);
          setShowUploader(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyLogoUrl = () => {
    if (logoInput.trim() && onUpdateLogo) {
      onUpdateLogo(logoInput.trim());
      setShowUploader(false);
      setLogoInput('');
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-end pb-12 select-none font-sans relative pointer-events-auto">
      {/* Optional Top Controller Bar for Broadcast Operator */}
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 z-50">
        <button
          type="button"
          onClick={() => setDisplayStyle(prev => prev === 'ribbon' ? 'crest' : 'ribbon')}
          className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          title="Switch Style: Chevron Ribbon (1:1 Reference) vs Grand Shield Crest"
        >
          <Award className="w-3.5 h-3.5" />
          <span>{displayStyle === 'ribbon' ? 'Grand Crest' : 'Chevron Ribbon'}</span>
        </button>

        {onUpdateLogo && (
          <button
            type="button"
            onClick={() => setShowUploader(prev => !prev)}
            className="px-2 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            title="Upload or Change Tournament Logo"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Logo</span>
          </button>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-rose-600/40 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition-all cursor-pointer border border-rose-400/40"
            title="Close Overlay"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Upload Modal Drawer */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 right-6 bg-slate-950/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl z-50 w-80 text-left"
          >
            <span className="text-xs font-black uppercase text-blue-400 block mb-2">
              Tournament Logo Setup
            </span>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1 font-semibold uppercase">
                  Upload Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or paste Logo Image URL..."
                  value={logoInput}
                  onChange={(e) => setLogoInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleApplyLogoUrl}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN OVERLAY GRAPHIC */}
      <AnimatePresence mode="wait">
        {displayStyle === 'ribbon' ? (
          /* =========================================================================
             STYLE 1: 1:1 RECREATION OF UPLOADED REFERENCE (CHEVRON BLUE BROADCAST BAR)
             ========================================================================= */
          <motion.div
            key="ribbon"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-6xl px-4 flex flex-col items-center"
          >
            {/* Horizontal Chevron Banner */}
            <div className="w-full flex items-center justify-center drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] filter">
              {/* 1. Far Left: Blue Chevron Flank with Tournament Logo Shield */}
              <div
                className="h-16 w-24 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-600 flex items-center justify-center pl-2 pr-4 shrink-0 shadow-lg relative"
                style={{
                  clipPath: 'polygon(0% 0%, 80% 0%, 100% 50%, 80% 100%, 0% 100%)',
                }}
              >
                <div className="w-10 h-10 rounded bg-white/10 border-2 border-white/70 flex items-center justify-center shadow-inner overflow-hidden">
                  {tournamentLogo ? (
                    <img
                      src={tournamentLogo}
                      alt="Tournament Logo"
                      className="w-full h-full object-contain p-0.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-white drop-shadow" />
                  )}
                </div>
              </div>

              {/* 2. Left Middle: Blue Angled Chevron Tab with Team 1 */}
              <div
                className="h-16 px-6 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white flex items-center justify-center shrink-0 -ml-4 pl-8 pr-8 z-10 shadow-md"
                style={{
                  clipPath: 'polygon(0% 0%, 88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%)',
                }}
              >
                <span className="font-black text-lg md:text-xl tracking-wider uppercase drop-shadow text-white whitespace-nowrap">
                  {teamA}
                </span>
              </div>

              {/* 3. Central Box: Silver-White Metallic Gradient Presentation Bar */}
              <div
                className="h-16 flex-1 max-w-xl bg-gradient-to-b from-slate-100 via-white to-slate-300 text-slate-950 flex flex-col items-center justify-center px-6 -ml-4 -mr-4 z-20 shadow-xl border-t border-b border-white"
                style={{
                  clipPath: 'polygon(0% 0%, 96% 0%, 100% 50%, 96% 100%, 0% 100%, 4% 50%)',
                }}
              >
                {/* Upper line: Tournament Logo + Name */}
                <div className="flex items-center gap-2">
                  {tournamentLogo && (
                    <img
                      src={tournamentLogo}
                      alt="Logo"
                      className="w-5 h-5 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="font-black text-sm md:text-base tracking-wider uppercase text-slate-950 truncate">
                    {tournamentName}
                  </span>
                </div>
                {/* Lower line: Toss / Match Status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-black text-slate-800 tracking-wide uppercase">
                    {tossWinner} won the toss and elected to {tossChoice}
                  </span>
                </div>
              </div>

              {/* 4. Right Middle: Blue Angled Chevron Tab with Team 2 */}
              <div
                className="h-16 px-6 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white flex items-center justify-center shrink-0 -mr-4 pl-8 pr-8 z-10 shadow-md"
                style={{
                  clipPath: 'polygon(0% 0%, 88% 0%, 100% 50%, 88% 100%, 0% 100%, 12% 50%)',
                }}
              >
                <span className="font-black text-lg md:text-xl tracking-wider uppercase drop-shadow text-white whitespace-nowrap">
                  {teamB}
                </span>
              </div>

              {/* 5. Far Right: Blue Chevron Flank with Tournament Logo Shield */}
              <div
                className="h-16 w-24 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-900 flex items-center justify-center pr-2 pl-4 shrink-0 shadow-lg relative"
                style={{
                  clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 20% 100%, 0% 50%)',
                }}
              >
                <div className="w-10 h-10 rounded bg-white/10 border-2 border-white/70 flex items-center justify-center shadow-inner overflow-hidden">
                  {tournamentLogo ? (
                    <img
                      src={tournamentLogo}
                      alt="Tournament Logo"
                      className="w-full h-full object-contain p-0.5"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-white drop-shadow" />
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Red Accent Indicator (as in reference image) */}
            <div className="w-8 h-2 bg-red-600 rounded-b shadow-[0_2px_8px_rgba(239,68,68,0.8)] mt-0.5" />
          </motion.div>
        ) : (
          /* =========================================================================
             STYLE 2: GRAND CHAMPIONSHIP SHIELD CREST & TOURNAMENT PRESENTATION CARD
             ========================================================================= */
          <motion.div
            key="crest"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-4xl px-4 flex flex-col items-center"
          >
            <div className="w-full bg-gradient-to-br from-blue-950/95 via-slate-950/95 to-slate-900/95 border-2 border-blue-500/50 rounded-3xl p-6 shadow-[0_25px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl relative overflow-hidden text-center">
              {/* Gold & Blue Ambient Glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Tournament Crest / Logo Icon */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-600/30 to-amber-500/20 border-2 border-amber-400/60 p-2 shadow-2xl flex items-center justify-center mb-3 backdrop-blur-md">
                  {tournamentLogo ? (
                    <img
                      src={tournamentLogo}
                      alt="Tournament Official Logo"
                      className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-amber-400">
                      <Trophy className="w-12 h-12 mb-1 drop-shadow" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-300">
                        OFFICIAL CREST
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtitle Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-blue-600/40 to-amber-500/30 border border-amber-400/40 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                    OFFICIAL TOURNAMENT BROADCAST
                  </span>
                </div>

                {/* Tournament Title */}
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mb-2">
                  {tournamentName}
                </h1>

                {/* Matchup & Venue */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-slate-300 mb-4">
                  <span className="px-2.5 py-0.5 rounded bg-white/10 text-white font-mono uppercase text-xs">
                    {matchNumber}
                  </span>
                  <span className="text-blue-400 font-black">{teamA}</span>
                  <span className="text-amber-400 font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-xs">
                    VS
                  </span>
                  <span className="text-blue-400 font-black">{teamB}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-mono text-xs">{venue}</span>
                </div>

                {/* Toss Details Strip */}
                <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-xl py-2 px-4 flex items-center justify-center gap-2">
                  <span className="text-xs font-black uppercase text-amber-400">TOSS RESULT:</span>
                  <span className="text-xs font-bold uppercase text-slate-200">
                    {tossWinner} won toss & elected to {tossChoice}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
