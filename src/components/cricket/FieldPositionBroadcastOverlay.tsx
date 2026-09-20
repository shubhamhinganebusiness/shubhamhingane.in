import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Eye, Shield, Sparkles } from 'lucide-react';
import { 
  FielderPosition, 
  DEFAULT_FIELD_POSITIONS, 
  isFielderInsideRing, 
  BOUNDARY_RADIUS, 
  INNER_CIRCLE_RX, 
  INNER_CIRCLE_RY 
} from './FieldPositionTypes';

interface FieldPositionBroadcastOverlayProps {
  match?: any;
  customPositions?: FielderPosition[];
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const FieldPositionBroadcastOverlay: React.FC<FieldPositionBroadcastOverlayProps> = ({
  match,
  customPositions,
  onClose,
  isEmbedded = false
}) => {
  const [showPlayerNames, setShowPlayerNames] = useState<boolean>(true);
  const [hoveredFielder, setHoveredFielder] = useState<FielderPosition | null>(null);

  // Determine current bowling team and batter
  const currentInnings = match?.innings?.[match?.currentInningsIndex ?? 0] || match?.innings?.[0];
  const battingTeam = currentInnings?.battingTeam || match?.teamA || 'BATTING TEAM';
  const bowlingTeam = battingTeam === match?.teamA ? (match?.teamB || 'TEAM B') : (match?.teamA || 'TEAM A');

  const striker = currentInnings?.batsmen?.[currentInnings?.strikerIndex ?? 0];
  const currentBowler = currentInnings?.bowlers?.[currentInnings?.currentBowlerIndex ?? 0];

  // Retrieve saved positions from match overlayConfig or fallback
  const positions: FielderPosition[] = 
    customPositions && customPositions.length === 11 
      ? customPositions 
      : (match?.overlayConfig?.fieldPositions && match?.overlayConfig?.fieldPositions.length === 11)
        ? match?.overlayConfig?.fieldPositions
        : DEFAULT_FIELD_POSITIONS;

  const insideRingCount = positions.filter(f => isFielderInsideRing(f.x, f.y)).length;
  const outsideRingCount = positions.length - insideRingCount;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`relative z-50 flex items-center justify-center ${
        isEmbedded ? 'w-full h-full p-2' : 'fixed inset-0 p-4 bg-black/60 backdrop-blur-sm'
      }`}
      id="field-position-broadcast-overlay"
    >
      {/* MAIN BROADCAST CARD (Matches 1:1 Reference field position overlay.png with TV broadcast framing) */}
      <div className="relative w-full max-w-[580px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)] p-4 sm:p-6 overflow-hidden text-white flex flex-col items-center">
        
        {/* Top Metallic Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 opacity-90 shadow-[0_0_12px_rgba(234,179,8,0.7)]" />

        {/* BROADCAST HEADER BANNER */}
        <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg border border-yellow-300/40 text-lg">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1">
                  <span>★</span>
                  <span>STAR TV TACTICAL BROADCAST</span>
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black uppercase tracking-wider">
                  LIVE SETUP
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                <span>{bowlingTeam}</span>
                <span className="text-amber-400 text-sm font-semibold">FIELD PLACEMENTS</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show / Hide Names button */}
            <button
              type="button"
              onClick={() => setShowPlayerNames(!showPlayerNames)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-200 transition-all cursor-pointer flex items-center gap-1"
              title="Toggle player names on field"
            >
              <Users size={12} className="text-amber-400" />
              <span>{showPlayerNames ? 'Names: ON' : 'Names: OFF'}</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600/80 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10"
                title="Dismiss Overlay"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* MATCH CONTEXT STRIP (Striker & Bowler info) */}
        <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-950/80 rounded-xl border border-white/5 text-[10px] font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">BAT:</span>
            <span className="text-white font-black truncate max-w-[130px]">{striker?.name || 'Batter On Strike'}</span>
            <span className="text-slate-400">({striker?.runs ?? 0} off {striker?.balls ?? 0})</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sky-400 font-bold">BOWL:</span>
              <span className="text-white font-bold truncate max-w-[120px]">{currentBowler?.name || 'Current Bowler'}</span>
            </div>
            <div className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold text-[9px]">
              {insideRingCount} IN / {outsideRingCount} OUT
            </div>
          </div>
        </div>

        {/* 1:1 CRICKET GROUND GRAPHIC MATCHING field position overlay .png */}
        <div className="relative w-full aspect-square max-w-[370px] sm:max-w-[390px] mx-auto flex items-center justify-center my-1 select-none">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_20px_rgba(34,197,94,0.25)]"
          >
            <defs>
              {/* Outfield grass gradient matching reference */}
              <radialGradient id="tvGrassGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1e8e3e" />
                <stop offset="70%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </radialGradient>

              {/* Inner 30-yard circle glow */}
              <radialGradient id="tvInnerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
                <stop offset="85%" stopColor="#15803d" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
              </radialGradient>

              {/* Central Pitch Gradient */}
              <linearGradient id="tvPitchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="45%" stopColor="#fef08a" />
                <stop offset="55%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>

              {/* Glowing Yellow Dot Filter */}
              <filter id="tvDotGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.0" floodColor="#fde047" floodOpacity="0.9" />
              </filter>
            </defs>

            {/* 1. OUTFIELD CIRCULAR FIELD */}
            <circle
              cx="50"
              cy="50"
              r={BOUNDARY_RADIUS}
              fill="url(#tvGrassGrad)"
            />

            {/* 2. SOLID ORANGE BOUNDARY LINE (Exact matching reference image) */}
            <circle
              cx="50"
              cy="50"
              r={BOUNDARY_RADIUS}
              fill="none"
              stroke="#f97316"
              strokeWidth="1.6"
            />

            {/* 3. 30-YARD INNER CIRCLE (Translucent White Ellipse) */}
            <ellipse
              cx="50"
              cy="50"
              rx={INNER_CIRCLE_RX}
              ry={INNER_CIRCLE_RY}
              fill="url(#tvInnerGlow)"
              stroke="#ffffff"
              strokeWidth="0.85"
              opacity="0.95"
            />

            {/* 4. CENTRAL PITCH RECTANGLE */}
            <rect
              x="46"
              y="43.5"
              width="8"
              height="13"
              rx="0.4"
              fill="url(#tvPitchGrad)"
            />

            {/* Pitch Crease Lines */}
            <line x1="45" y1="45" x2="55" y2="45" stroke="#ffffff" strokeWidth="0.3" opacity="0.8" />
            <line x1="45" y1="55" x2="55" y2="55" stroke="#ffffff" strokeWidth="0.3" opacity="0.8" />

            {/* 5. RED STUMPS AT TOP AND BOTTOM */}
            <circle cx="50" cy="43.5" r="1.6" fill="#dc2626" />
            <circle cx="50" cy="56.5" r="1.6" fill="#dc2626" />

            {/* 6. "KEEPER" & "BOWLER" BOLD LABELS */}
            <text
              x="50"
              y="38.5"
              textAnchor="middle"
              fill="#000000"
              fontSize="4"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="0.2"
              className="select-none pointer-events-none"
            >
              KEEPER
            </text>

            <text
              x="50"
              y="63.5"
              textAnchor="middle"
              fill="#000000"
              fontSize="4"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="0.2"
              className="select-none pointer-events-none"
            >
              BOWLER
            </text>

            {/* 7. 11 YELLOW PLAYER DOTS (Exact matching field position overlay .png) */}
            {positions.map(fielder => {
              const isInside = isFielderInsideRing(fielder.x, fielder.y);
              const isHovered = hoveredFielder?.id === fielder.id;

              return (
                <g
                  key={fielder.id}
                  transform={`translate(${fielder.x}, ${fielder.y})`}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredFielder(fielder)}
                  onMouseLeave={() => setHoveredFielder(null)}
                >
                  {/* Outer White Ring for Boundary Fielders (Matching Reference Screenshot) */}
                  {!isInside && (
                    <circle
                      cx="0"
                      cy="0"
                      r="2.6"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="1.0"
                    />
                  )}

                  {/* Main Bright Yellow Dot */}
                  <circle
                    cx="0"
                    cy="0"
                    r={!isInside ? 1.8 : 2.0}
                    fill="#fde047"
                    stroke={!isInside ? 'none' : '#eab308'}
                    strokeWidth="0.3"
                    filter="url(#tvDotGlow)"
                  />

                  {/* Number inside dot */}
                  <text
                    cx="0"
                    cy="0"
                    x="0"
                    y="0.6"
                    textAnchor="middle"
                    fill="#1e293b"
                    fontSize="1.6"
                    fontWeight="900"
                    className="pointer-events-none select-none"
                  >
                    {fielder.jerseyNumber || fielder.id}
                  </text>

                  {/* Optional Broadcast Floating Label */}
                  {showPlayerNames && (
                    <g transform="translate(0, 3.8)">
                      <rect
                        x="-10"
                        y="-2.4"
                        width="20"
                        height="3.6"
                        rx="1.2"
                        fill="rgba(15, 23, 42, 0.85)"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="0.3"
                      />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        fill="#fde047"
                        fontSize="1.9"
                        fontWeight="800"
                        className="pointer-events-none select-none"
                      >
                        {fielder.roleName}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* BOTTOM STATS / FIELDING STRIP */}
        <div className="w-full mt-2 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Ring Rule:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase font-mono">
              {insideRingCount} Inside Circle
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase font-mono">
              {outsideRingCount} Deep Fielders
            </span>
          </div>

          <div className="text-right">
            <span className="text-[9px] font-mono text-slate-400">
              {hoveredFielder ? `${hoveredFielder.name} • ${hoveredFielder.roleName}` : '11 Players Deployed on Field'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
