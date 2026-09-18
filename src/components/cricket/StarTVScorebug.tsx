import React, { useMemo } from 'react';

export interface StarTVBall {
  label: string;
  type?: 'dot' | 'run' | 'four' | 'six' | 'wicket' | 'extra';
}

export interface StarTVScorebugProps {
  battingTeamName: string;
  battingTeamSubtext?: string;
  battingTeamColor?: string;
  battingTeamLogo?: string;
  strikerName: string;
  strikerRuns: number;
  strikerBalls: number;
  nonStrikerName: string;
  nonStrikerRuns: number;
  nonStrikerBalls: number;
  score: number;
  wickets: number;
  overs: string;
  oversLimit?: number;
  bowlerName: string;
  bowlerFigures: string;
  bowlerOvers?: string;
  bowlerEcon?: number;
  thisOverBalls?: Array<string | StarTVBall>;
  bowlingTeamName: string;
  bowlingTeamSubtext?: string;
  bowlingTeamColor?: string;
  bowlingTeamLogo?: string;
  isLive?: boolean;
  targetRuns?: number;
  remainingRuns?: number;
  remainingBalls?: number;
  activeStinger?: string | null;
}

export const StarTVScorebug: React.FC<StarTVScorebugProps> = ({
  battingTeamName = 'TEAM A',
  battingTeamSubtext = 'BAT FIRST',
  battingTeamColor = '#0143a3',
  battingTeamLogo,
  strikerName = 'STRIKER',
  strikerRuns = 0,
  strikerBalls = 0,
  nonStrikerName = 'NON-STRIKER',
  nonStrikerRuns = 0,
  nonStrikerBalls = 0,
  score = 0,
  wickets = 0,
  overs = '0.0',
  oversLimit = 20,
  bowlerName = 'BOWLER',
  bowlerFigures = '0/0',
  bowlerOvers = '0.0',
  bowlerEcon = 0,
  thisOverBalls = [],
  bowlingTeamName = 'TEAM B',
  bowlingTeamSubtext = 'BOWLING',
  bowlingTeamColor = '#c8102e',
  bowlingTeamLogo,
  isLive = true,
  targetRuns,
  remainingRuns,
  remainingBalls,
  activeStinger = null
}) => {
  // Normalize balls to standard object representation
  const normalizedBalls = useMemo<StarTVBall[]>(() => {
    return thisOverBalls.map(item => {
      if (typeof item === 'string') {
        let type: StarTVBall['type'] = 'dot';
        if (item === '4') type = 'four';
        else if (item === '6') type = 'six';
        else if (item === 'W' || item.toLowerCase().includes('w')) type = 'wicket';
        else if (item.toLowerCase().includes('wd') || item.toLowerCase().includes('nb')) type = 'extra';
        else if (parseInt(item, 10) > 0) type = 'run';
        return { label: item, type };
      }
      return item;
    });
  }, [thisOverBalls]);

  // Striker SR
  const strikerSR = strikerBalls > 0 ? ((strikerRuns / strikerBalls) * 100).toFixed(1) : '0.0';
  const nonStrikerSR = nonStrikerBalls > 0 ? ((nonStrikerRuns / nonStrikerBalls) * 100).toFixed(1) : '0.0';

  return (
    <div 
      id="star-tv-scorebug-container"
      className="relative w-full max-w-[1360px] mx-auto select-none font-sans filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
    >
      {/* Dynamic Stinger Glow Header */}
      {activeStinger && (
        <div 
          className={`absolute -top-3 inset-x-8 h-2 rounded-full z-40 animate-pulse ${
            activeStinger === 'four' 
              ? 'bg-sky-400 shadow-[0_0_20px_#38bdf8]' 
              : activeStinger === 'six' 
              ? 'bg-amber-400 shadow-[0_0_25px_#fbbf24]' 
              : 'bg-rose-500 shadow-[0_0_20px_#f43f5e]'
          }`} 
        />
      )}

      {/* Chasing Target / Equation Header Banner (if in 2nd innings) */}
      {targetRuns && targetRuns > 0 && (
        <div className="mx-auto w-fit mb-1 px-4 py-0.5 rounded-t-lg bg-slate-950/95 border-t border-x border-amber-400/40 text-[10px] font-mono font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 shadow-lg backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>TARGET {targetRuns}</span>
          <span className="text-white/40">•</span>
          <span>NEED {remainingRuns ?? Math.max(0, targetRuns - score)} RUNS IN {remainingBalls ?? 0}b</span>
        </div>
      )}

      {/* MASTER SCOREBUG TV BAR */}
      <div className="flex items-stretch justify-between h-[64px] sm:h-[70px] rounded-xl overflow-hidden border border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-xl">
        
        {/* =====================================================================
            1. LEFT WING: BATTING TEAM BADGE & ACTIVE BATSMEN
            ===================================================================== */}
        <div className="flex-1 flex items-stretch min-w-0 bg-gradient-to-r from-slate-900/90 to-slate-950/80">
          
          {/* Batting Team Polygonal Brand Block */}
          <div 
            className="relative px-3.5 sm:px-4 flex items-center gap-2 text-white shrink-0 overflow-hidden"
            style={{ 
              backgroundColor: battingTeamColor,
              clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0% 100%)',
              paddingRight: '1.75rem'
            }}
          >
            {/* Ambient metallic sheen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

            {/* Live Beacon */}
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse shrink-0" />
            )}

            {/* Team Crest or 3-letter pill */}
            {battingTeamLogo ? (
              <img 
                src={battingTeamLogo} 
                alt={battingTeamName} 
                className="w-8 h-8 rounded-full border border-white/30 bg-black/40 object-contain shrink-0 shadow"
                referrerPolicy="no-referrer"
              />
            ) : null}

            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow truncate max-w-[90px] sm:max-w-[120px]">
                {battingTeamName}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-widest leading-none">
                {battingTeamSubtext}
              </span>
            </div>
          </div>

          {/* Batters Details */}
          <div className="flex-1 px-3 sm:px-4 flex items-center justify-around gap-2 min-w-0 overflow-hidden">
            {/* Striker */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_#34d399]" />
                <span className="text-xs sm:text-sm font-black text-white uppercase truncate max-w-[100px] sm:max-w-[140px]">
                  {strikerName}*
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                  {strikerRuns}
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">({strikerBalls})</span>
                </span>
                <span className="text-[8.5px] font-mono font-bold text-amber-400/80 px-1 py-0.2 bg-amber-400/10 rounded hidden md:inline-block">
                  SR {strikerSR}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 shrink-0" />

            {/* Non-Striker */}
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-300 uppercase truncate max-w-[90px] sm:max-w-[130px]">
                {nonStrikerName}
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm sm:text-base font-black font-mono text-slate-200">
                  {nonStrikerRuns}
                  <span className="text-[10px] font-normal text-slate-400 ml-0.5">({nonStrikerBalls})</span>
                </span>
                <span className="text-[8.5px] font-mono font-bold text-slate-400 px-1 py-0.2 bg-white/5 rounded hidden md:inline-block">
                  SR {nonStrikerSR}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            2. ELEVATED CENTER SHIELD: SCORE & WICKETS & OVERS
            ===================================================================== */}
        <div 
          id="star-tv-center-shield"
          className="relative z-20 px-5 sm:px-7 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-[#070b14] to-slate-950 text-white shrink-0 border-x border-white/20 shadow-[0_0_25px_rgba(0,0,0,0.9)]"
          style={{ minWidth: '150px' }}
        >
          {/* Top highlight glint */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-80" />

          {/* Main Score & Wickets Display */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]">
              {score}/{wickets}
            </span>
          </div>

          {/* Overs Indicator */}
          <div className="flex items-center gap-1.5 -mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold font-mono text-sky-300 tracking-wider">
              {overs}
              {oversLimit ? <span className="text-slate-400 font-normal"> / {oversLimit} OV</span> : ' OV'}
            </span>
          </div>
        </div>

        {/* =====================================================================
            3. RIGHT WING: BOWLER HUD & BALL DOTS & BOWLING TEAM BADGE
            ===================================================================== */}
        <div className="flex-1 flex items-stretch min-w-0 bg-gradient-to-l from-slate-900/90 to-slate-950/80">
          
          {/* Bowler Details & This Over Balls */}
          <div className="flex-1 px-3 sm:px-4 flex items-center justify-around gap-2 min-w-0 overflow-hidden">
            
            {/* Active Bowler */}
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                  BOWL
                </span>
                <span className="text-xs sm:text-sm font-black text-white uppercase truncate max-w-[100px] sm:max-w-[130px]">
                  {bowlerName}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm sm:text-base font-black font-mono text-emerald-400">
                  {bowlerFigures}
                </span>
                {bowlerOvers && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ({bowlerOvers} ov)
                  </span>
                )}
                {bowlerEcon !== undefined && bowlerEcon > 0 && (
                  <span className="text-[8.5px] font-mono text-slate-400 hidden lg:inline-block">
                    Econ {bowlerEcon}
                  </span>
                )}
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 shrink-0" />

            {/* This Over Balls Pills */}
            <div className="flex flex-col justify-center shrink-0">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono mb-1">
                THIS OVER
              </span>
              <div className="flex items-center gap-1">
                {normalizedBalls.length > 0 ? (
                  normalizedBalls.slice(0, 6).map((ball, idx) => (
                    <span 
                      key={idx}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-mono font-black border shadow-sm ${
                        ball.type === 'four'
                          ? 'bg-sky-500 text-white border-sky-300 shadow-[0_0_8px_#0284c7]'
                          : ball.type === 'six'
                          ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_10px_#f59e0b]'
                          : ball.type === 'wicket'
                          ? 'bg-rose-600 text-white border-rose-400 shadow-[0_0_8px_#e11d48]'
                          : ball.type === 'extra'
                          ? 'bg-purple-600 text-white border-purple-400'
                          : ball.type === 'run'
                          ? 'bg-slate-700 text-white border-slate-500'
                          : 'bg-black/60 text-slate-400 border-white/10'
                      }`}
                    >
                      {ball.label === '0' ? '•' : ball.label}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] text-slate-500 font-mono italic">New Over</span>
                )}
                {/* Empty placeholders if less than 6 balls */}
                {normalizedBalls.length < 6 && (
                  Array.from({ length: 6 - normalizedBalls.length }).map((_, padIdx) => (
                    <span 
                      key={`star-pad-${padIdx}`}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-dashed border-white/15 flex items-center justify-center text-[8px] text-slate-600 font-mono"
                    >
                      •
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Bowling Team Polygonal Brand Block */}
          <div 
            className="relative px-3.5 sm:px-4 flex items-center gap-2 text-white shrink-0 overflow-hidden text-right"
            style={{ 
              backgroundColor: bowlingTeamColor,
              clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)',
              paddingLeft: '1.75rem'
            }}
          >
            {/* Ambient metallic sheen */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

            <div className="flex flex-col items-end">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow truncate max-w-[90px] sm:max-w-[120px]">
                {bowlingTeamName}
              </span>
              <span className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-widest leading-none">
                {bowlingTeamSubtext}
              </span>
            </div>

            {/* Team Crest or 3-letter pill */}
            {bowlingTeamLogo ? (
              <img 
                src={bowlingTeamLogo} 
                alt={bowlingTeamName} 
                className="w-8 h-8 rounded-full border border-white/30 bg-black/40 object-contain shrink-0 shadow"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

        </div>

      </div>
    </div>
  );
};
