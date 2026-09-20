/**
 * Star TV Scorebug Official Broadcast Theme Tokens & Helpers
 * 
 * Provides unified color tokens, polygon angles, gradient glints, and styling
 * that perfectly match the official Star TV Pro Scorebug reference design across
 * all broadcast overlay graphics:
 * - Batter Stats (Striker, Non-striker, Partnership)
 * - Bowler Stats (Current Spell, Figures, Economy, Dot Ball %)
 * - Individual Batting & Bowling Stats Overlay
 * - Team Comparison (Playing XIs & Head-to-Head Stats)
 * - Match Summary & Innings Split
 * - Lower Thirds (Player Bio, Match Equation, Umpire Calls)
 * - Full Screen Cards & Transitions
 */

export interface StarTVColors {
  battingTeamColor: string;
  bowlingTeamColor: string;
  teamAColor: string;
  teamBColor: string;
  primaryAccent: string; // Sky blue / cyan #0284c7 / #38bdf8
  secondaryAccent: string; // Crimson #ef4444 / #c8102e
  goldAccent: string; // Star TV Vibrant Amber/Gold #fbbf24
  emeraldAccent: string; // Star TV Strike Rate / Wickets #34d399
  canvasBg: string;
  canvasBorder: string;
  topGlint: string;
  goldPill: string;
  cyanPill: string;
  emeraldPill: string;
  crimsonPill: string;
}

/**
 * Checks whether the Star TV broadcast color theme or layout is currently active
 */
export function isStarTVThemeActive(
  activeConfig?: any,
  activeLayout?: string,
  globalStudioTheme?: any
): boolean {
  if (!activeConfig && !activeLayout && !globalStudioTheme) return false;

  const currentLayout = activeLayout || activeConfig?.layout || activeConfig?.template;
  const currentTheme = activeConfig?.theme || activeConfig?.template;
  const studioPreset = globalStudioTheme?.presetBase || globalStudioTheme?.layout;

  return (
    currentLayout === 'star-tv-broadcast' ||
    currentTheme === 'star-tv-broadcast' ||
    studioPreset === 'star-tv-broadcast' ||
    activeConfig?.template === 'star-tv-broadcast' ||
    Boolean(activeConfig?.harmonizeStarTV)
  );
}

/**
 * Computes the unified Star TV colors and team branding tokens
 */
export function getStarTVThemeTokens(
  match?: any,
  currentInnings?: any,
  activeConfig?: any,
  globalStudioTheme?: any
): StarTVColors {
  const teamA = match?.teamA || 'Team A';
  const battingTeam = currentInnings?.battingTeam || teamA;
  const isTeamABatting = battingTeam.trim().toLowerCase() === teamA.trim().toLowerCase();

  // Official Star TV defaults: Royal Blue for Team A, Crimson for Team B
  const teamAColor = globalStudioTheme?.teamAColor || activeConfig?.teamAColor || '#0143a3';
  const teamBColor = globalStudioTheme?.teamBColor || activeConfig?.teamBColor || '#c8102e';

  const battingTeamColor = isTeamABatting ? teamAColor : teamBColor;
  const bowlingTeamColor = isTeamABatting ? teamBColor : teamAColor;

  return {
    battingTeamColor,
    bowlingTeamColor,
    teamAColor,
    teamBColor,
    primaryAccent: '#38bdf8', // Star TV Cyan
    secondaryAccent: '#ef4444', // Star TV Red
    goldAccent: '#fbbf24', // Star TV Amber Gold
    emeraldAccent: '#34d399', // Star TV Live Green
    canvasBg: 'bg-slate-950/95',
    canvasBorder: 'border-white/20',
    topGlint: 'bg-gradient-to-r from-transparent via-sky-400 to-transparent',
    goldPill: 'bg-amber-400/10 border border-amber-400/40 text-amber-300',
    cyanPill: 'bg-sky-500/10 border border-sky-400/30 text-sky-300',
    emeraldPill: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
    crimsonPill: 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
  };
}
