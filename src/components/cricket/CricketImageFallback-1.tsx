import React, { useState } from 'react';

// Clean player name from common tags like (c), (wk), etc.
export function cleanPlayerName(name?: string): string {
  if (!name) return '';
  return name.replace(/\s*\((?:c|wk|capt|w\/k|c\/wk|wk\/c)\)/gi, '').trim();
}

/**
 * High-definition Cricket Batsman Silhouette SVG
 * Modeled after professional sports graphics (Cricbuzz / ICC style)
 */
export const CricketPlayerSilhouette: React.FC<{ className?: string }> = ({ className = 'w-full h-full text-slate-400' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Helmet & Head */}
    <circle cx="32" cy="14" r="7.5" opacity="0.95" />
    <path
      d="M26 14 C26 12 28 10 34 10 C39 10 41 12 41 15 C41 17 38 18 34 18 C30 18 26 17 26 14 Z"
      opacity="0.9"
    />
    <rect x="33" y="14" width="7" height="2" rx="1" fill="#fbbf24" opacity="0.8" />
    {/* Upper Body & Torso */}
    <path
      d="M20 25 C20 22 24 21 32 21 C40 21 44 22 44 25 L41 38 C41 40 38 41 32 41 C26 41 23 40 23 38 Z"
      opacity="0.9"
    />
    {/* Arms in batting stance holding bat handle */}
    <path
      d="M22 26 L16 32 C15 33 16 35 18 35 L26 31 L24 27 Z"
      opacity="0.85"
    />
    <path
      d="M42 26 L47 33 C48 34 47 36 45 36 L37 32 L39 27 Z"
      opacity="0.85"
    />
    {/* Cricket Bat blade & handle */}
    <path
      d="M17 31 L13 22 C12 20 10 21 11 23 L14 34 L17 31 Z"
      fill="#f59e0b"
      opacity="0.9"
    />
    <path
      d="M14 34 L10 49 C9 53 13 54 15 52 L20 37 Z"
      fill="#d97706"
      opacity="0.95"
    />
    {/* Lower Body & Pads */}
    <path
      d="M25 41 L23 57 C23 59 26 60 28 59 L29 41 Z"
      opacity="0.8"
    />
    <path
      d="M35 41 L36 59 C38 60 41 59 41 57 L39 41 Z"
      opacity="0.8"
    />
  </svg>
);

/**
 * Crossed Cricket Bats and Ball Team Shield Crest SVG
 */
export const CricketTeamShield: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer Shield Outline */}
    <path
      d="M32 4 L54 12 V32 C54 45 44 56 32 60 C20 56 10 45 10 32 V12 L32 4 Z"
      fill="currentColor"
      className="text-slate-800/80"
    />
    <path
      d="M32 7 L51 14 V31 C51 43 42 53 32 57 C22 53 13 43 13 31 V14 L32 7 Z"
      stroke="rgba(255,255,255,0.15)"
      strokeWidth="1.5"
    />
    {/* Left Cricket Bat */}
    <path
      d="M20 18 L23 15 L38 36 L35 39 Z"
      fill="#fbbf24"
    />
    <path
      d="M37 34 L43 42 L40 44 L34 36 Z"
      fill="#d97706"
    />
    {/* Right Cricket Bat */}
    <path
      d="M44 18 L41 15 L26 36 L29 39 Z"
      fill="#fbbf24"
    />
    <path
      d="M27 34 L21 42 L24 44 L30 36 Z"
      fill="#d97706"
    />
    {/* Red Cricket Ball at center with white seam */}
    <circle cx="32" cy="36" r="6" fill="#dc2626" />
    <path
      d="M28 34 C30 36 34 36 36 38"
      stroke="#ffffff"
      strokeWidth="1"
      strokeDasharray="1 1"
    />
  </svg>
);

/**
 * Player Avatar Component with Cricbuzz-style Fallback
 * - Renders crisp photo if valid
 * - If missing or image load fails, displays cricket player silhouette & player initials
 */
export interface CricketPlayerAvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
  borderClass?: string;
  showInitials?: boolean;
}

export const CricketPlayerAvatar: React.FC<CricketPlayerAvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  isCaptain = false,
  isKeeper = false,
  borderClass = 'border-white/10 dark:border-slate-800',
  showInitials = true
}) => {
  const [hasError, setHasError] = useState(false);
  const clean = cleanPlayerName(name) || 'Player';

  const initials = clean
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '🏏';

  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-[9px]', icon: 'w-3.5 h-3.5', badge: 'text-[7px]' },
    sm: { box: 'w-8 h-8', text: 'text-xs', icon: 'w-5 h-5', badge: 'text-[8px]' },
    md: { box: 'w-11 h-11', text: 'text-sm', icon: 'w-7 h-7', badge: 'text-[9px]' },
    lg: { box: 'w-16 h-16', text: 'text-lg', icon: 'w-10 h-10', badge: 'text-[10px]' },
    xl: { box: 'w-24 h-24', text: 'text-2xl', icon: 'w-14 h-14', badge: 'text-xs' },
    '2xl': { box: 'w-32 h-32', text: 'text-3xl', icon: 'w-20 h-20', badge: 'text-xs' }
  }[size];

  // Deterministic neutral tint based on name
  const charCode = (clean.charCodeAt(0) || 0) + (clean.charCodeAt(1) || 0);
  const bgGradients = [
    'from-slate-800 to-slate-950 text-slate-200',
    'from-blue-950 to-slate-950 text-blue-200',
    'from-emerald-950 to-slate-950 text-emerald-200',
    'from-amber-950 to-slate-950 text-amber-200',
    'from-indigo-950 to-slate-950 text-indigo-200'
  ];
  const bgClass = bgGradients[charCode % bgGradients.length];

  const showImage = src && !hasError && typeof src === 'string' && src.trim().length > 0;

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeMap.box} rounded-2xl overflow-hidden border ${borderClass} shadow-md flex items-center justify-center bg-gradient-to-br ${bgClass} select-none transition-transform`}
      >
        {showImage ? (
          <img
            src={src}
            alt={clean}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full relative flex items-center justify-center p-1">
            {/* Cricbuzz Player Silhouette */}
            <CricketPlayerSilhouette className={`${sizeMap.icon} opacity-30 text-white`} />
            {showInitials && (
              <span className={`absolute inset-0 flex items-center justify-center font-black tracking-tight ${sizeMap.text} drop-shadow-sm`}>
                {initials}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Captain / Wicketkeeper Badge */}
      {(isCaptain || isKeeper) && (
        <span
          className={`absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md font-black uppercase tracking-wider ${sizeMap.badge} shadow-md border border-white/20 ${
            isCaptain ? 'bg-amber-500 text-slate-950' : 'bg-sky-500 text-white'
          }`}
        >
          {isCaptain && isKeeper ? 'C/WK' : isCaptain ? 'C' : 'WK'}
        </span>
      )}
    </div>
  );
};

/**
 * Team Logo Component with Cricbuzz-style Crest Fallback
 */
export interface CricketTeamLogoProps {
  src?: string | null;
  teamName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CricketTeamLogo: React.FC<CricketTeamLogoProps> = ({
  src,
  teamName,
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);
  const clean = teamName.trim() || 'Team';

  const initials = clean
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((p) => p[0]?.toUpperCase())
    .join('')
    .substring(0, 3) || 'XI';

  const sizeMap = {
    xs: { box: 'w-6 h-6', text: 'text-[8px]', shield: 'w-4 h-4' },
    sm: { box: 'w-8 h-8', text: 'text-[10px]', shield: 'w-6 h-6' },
    md: { box: 'w-12 h-12', text: 'text-xs', shield: 'w-8 h-8' },
    lg: { box: 'w-16 h-16', text: 'text-sm', shield: 'w-12 h-12' },
    xl: { box: 'w-24 h-24', text: 'text-xl', shield: 'w-16 h-16' }
  }[size];

  const showImage = src && !hasError && typeof src === 'string' && src.trim().length > 0;

  return (
    <div
      className={`${sizeMap.box} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-900 shadow-sm flex items-center justify-center shrink-0 select-none ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={clean}
          className="w-full h-full object-contain p-1"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full relative flex items-center justify-center p-1 bg-gradient-to-br from-slate-800 to-slate-950">
          <CricketTeamShield className={`${sizeMap.shield} opacity-40`} />
          <span className={`absolute inset-0 flex items-center justify-center font-black tracking-widest text-amber-300 drop-shadow ${sizeMap.text}`}>
            {initials}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Match Banner Component with Stadium Pitch Silhouette Fallback
 */
export interface CricketMatchBannerProps {
  src?: string | null;
  title?: string;
  subtitle?: string;
  aspectRatio?: '16:9' | '21:9' | 'auto';
  className?: string;
}

export const CricketMatchBanner: React.FC<CricketMatchBannerProps> = ({
  src,
  title = 'Live Cricket Match',
  subtitle = 'Tournament Broadcast',
  aspectRatio = '16:9',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);
  const showImage = src && !hasError && typeof src === 'string' && src.trim().length > 0;

  const aspectClass = aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '21:9' ? 'aspect-[21/9]' : '';

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 shadow-xl ${aspectClass} ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          {/* Subtle cricket pitch & floodlights decorative vector */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              {/* Stadium Floodlight Cones */}
              <polygon points="20,10 90,190 0,190" fill="white" opacity="0.1" />
              <polygon points="380,10 400,190 310,190" fill="white" opacity="0.1" />
              {/* Cricket 22-Yard Pitch */}
              <rect x="175" y="60" width="50" height="90" rx="3" fill="#d97706" opacity="0.25" />
              <line x1="175" y1="75" x2="225" y2="75" stroke="white" strokeWidth="1" />
              <line x1="175" y1="135" x2="225" y2="135" stroke="white" strokeWidth="1" />
            </svg>
          </div>

          <div className="relative z-10 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              🏏 Official Match Banner
            </span>
            <h3 className="text-white font-black text-lg md:text-xl tracking-tight line-clamp-1">
              {title}
            </h3>
            {subtitle && (
              <p className="text-slate-400 text-xs font-mono line-clamp-1">{subtitle}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
