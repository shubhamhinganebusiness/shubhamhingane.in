import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Target, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Radio, 
  TrendingUp, 
  Sparkles, 
  ShieldAlert, 
  X,
  Trophy,
  Users,
  Coins,
  Crown,
  Flame,
  MapPin,
  Mic,
  Scale,
  Monitor
} from 'lucide-react';

export interface StarTVBall {
  label: string;
  type?: 'dot' | 'run' | 'four' | 'six' | 'wicket' | 'extra';
}

export interface BatterShotSector {
  angle: number; // 0-360 degrees (0 = straight down ground, 90 = cover/point, 180 = fine leg/wicket keeper, 270 = square leg/midwicket)
  runs: number;
  type: 'single' | 'two' | 'three' | 'four' | 'six';
}

export interface StarTVScorebugProps {
  battingTeamName: string;
  battingTeamSubtext?: string;
  battingTeamColor?: string;
  battingTeamLogo?: string;
  strikerName: string;
  strikerRuns: number;
  strikerBalls: number;
  strikerFours?: number;
  strikerSixes?: number;
  strikerShots?: BatterShotSector[];
  nonStrikerName: string;
  nonStrikerRuns: number;
  nonStrikerBalls: number;
  nonStrikerFours?: number;
  nonStrikerSixes?: number;
  nonStrikerShots?: BatterShotSector[];
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

  // New Pro Enhancements Props
  crr?: number;
  rrr?: number;
  partnershipRuns?: number;
  partnershipBalls?: number;
  last5OversRuns?: number;
  last5OversWickets?: number;
  inningsFours?: number;
  inningsSixes?: number;
  inningsDotBalls?: number;
  isFreeHit?: boolean;
  isDrsActive?: boolean;
  drsDetails?: string;
  ballSpeedKmh?: number;
  deliveryType?: string;
  winProbabilityA?: number;
  winProbabilityB?: number;
  showWinPredictor?: boolean;

  // Star TV Scorebug Mini-Overlay Detail Props
  scorebugOverlayMode?: 'this_over' | 'tournament' | 'toss_equation' | 'last_batsman' | 'partnership' | 'projected_crr' | 'officials_venue';
  onSelectOverlayMode?: (mode: 'this_over' | 'tournament' | 'toss_equation' | 'last_batsman' | 'partnership' | 'projected_crr' | 'officials_venue') => void;
  tournamentName?: string;
  tournamentLogo?: string;
  matchStage?: string;
  matchVenue?: string;
  groundName?: string;
  umpire1Name?: string;
  umpire1Photo?: string;
  umpire2Name?: string;
  umpire2Photo?: string;
  scoreboardManagerName?: string;
  scoreboardManagerPhoto?: string;
  commentatorName?: string;
  commentatorPhoto?: string;
  tossDetails?: string;
  tossWinner?: string;
  tossChoice?: 'bat' | 'bowl';
  equationText?: string;
  winnerDetails?: string;
  lastBatsmanName?: string;
  lastBatsmanRuns?: number;
  lastBatsmanBalls?: number;
  lastBatsmanDismissal?: string;
  lastBatsmanFow?: string;
  lastBatsmanFours?: number;
  lastBatsmanSixes?: number;
  lastBatsmanSR?: number | string;
  projectedScore?: number;
  showModeSelectorTabs?: boolean;
  tournamentFours?: number;
  tournamentSixes?: number;
}

export const StarTVScorebug: React.FC<StarTVScorebugProps> = ({
  battingTeamName = 'TEAM A',
  battingTeamSubtext = 'BAT FIRST',
  battingTeamColor = '#0143a3',
  battingTeamLogo,
  strikerName = 'STRIKER',
  strikerRuns = 0,
  strikerBalls = 0,
  strikerFours = 0,
  strikerSixes = 0,
  strikerShots,
  nonStrikerName = 'NON-STRIKER',
  nonStrikerRuns = 0,
  nonStrikerBalls = 0,
  nonStrikerFours = 0,
  nonStrikerSixes = 0,
  nonStrikerShots,
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
  activeStinger = null,

  // Enhanced Pro Props
  crr,
  rrr,
  partnershipRuns,
  partnershipBalls,
  last5OversRuns,
  last5OversWickets,
  inningsFours,
  inningsSixes,
  inningsDotBalls,
  isFreeHit = false,
  isDrsActive = false,
  drsDetails = 'BALL TRACKING IN PROGRESS • ON-FIELD: NOT OUT',
  ballSpeedKmh,
  deliveryType,
  winProbabilityA,
  winProbabilityB,
  showWinPredictor = true,

  // Mini-Overlay Detail Props
  scorebugOverlayMode = 'this_over',
  onSelectOverlayMode,
  tournamentName = 'STAR TV PREMIER LEAGUE 2026',
  tournamentLogo,
  matchStage = 'GROUP STAGE • LIVE',
  matchVenue,
  groundName,
  umpire1Name,
  umpire1Photo,
  umpire2Name,
  umpire2Photo,
  scoreboardManagerName,
  scoreboardManagerPhoto,
  commentatorName,
  commentatorPhoto,
  tossDetails,
  tossWinner,
  tossChoice,
  equationText,
  winnerDetails,
  lastBatsmanName,
  lastBatsmanRuns,
  lastBatsmanBalls,
  lastBatsmanDismissal,
  lastBatsmanFow,
  lastBatsmanFours,
  lastBatsmanSixes,
  lastBatsmanSR,
  projectedScore,
  showModeSelectorTabs = true,
  tournamentFours,
  tournamentSixes
}) => {
  // Scorebug overlay mode state (supports both controlled and uncontrolled usage)
  const [activeScorebugMode, setActiveScorebugMode] = useState<'this_over' | 'tournament' | 'toss_equation' | 'last_batsman' | 'partnership' | 'projected_crr' | 'officials_venue'>(scorebugOverlayMode || 'this_over');
  const [tossEquationMode, setTossEquationMode] = useState<'auto' | 'toss' | 'equation'>('auto');

  useEffect(() => {
    if (scorebugOverlayMode) {
      setActiveScorebugMode(scorebugOverlayMode);
    }
  }, [scorebugOverlayMode]);

  const handleSetOverlayMode = (mode: 'this_over' | 'tournament' | 'toss_equation' | 'last_batsman' | 'partnership' | 'projected_crr' | 'officials_venue') => {
    setActiveScorebugMode(mode);
    onSelectOverlayMode?.(mode);
  };
  // Normalize balls to standard object representation
  const normalizedBalls = useMemo<StarTVBall[]>(() => {
    return thisOverBalls.map(item => {
      if (typeof item === 'string') {
        let type: StarTVBall['type'] = 'dot';
        const lower = item.toLowerCase();
        if (item === '4') type = 'four';
        else if (item === '6') type = 'six';
        else if (lower.includes('wd') || lower.includes('nb') || lower.includes('lb') || /(?:^|\d+)b$/i.test(item) || lower === 'ex') type = 'extra';
        else if (item === 'W' || /^w$/i.test(item) || /^w\+/i.test(item) || item.toUpperCase() === 'OUT') type = 'wicket';
        else if (['1', '2', '3', '5'].includes(item) || parseInt(item, 10) > 0) type = 'run';
        return { label: item, type };
      }
      const label = item.label || '';
      let type = item.type;
      const lower = label.toLowerCase();
      if (!type) {
        if (label === '4') type = 'four';
        else if (label === '6') type = 'six';
        else if (lower.includes('wd') || lower.includes('nb') || lower.includes('lb') || /(?:^|\d+)b$/i.test(label) || lower === 'ex') type = 'extra';
        else if (label === 'W' || /^w$/i.test(label) || /^w\+/i.test(label) || label.toUpperCase() === 'OUT') type = 'wicket';
        else if (['1', '2', '3', '5'].includes(label) || parseInt(label, 10) > 0) type = 'run';
        else type = 'dot';
      }
      return { ...item, type, label };
    });
  }, [thisOverBalls]);

  // Total balls bowled numeric
  const totalBallsBowled = useMemo(() => {
    const parts = (overs || '0.0').split('.');
    const completedOvers = parseInt(parts[0], 10) || 0;
    const ballsInOver = parseInt(parts[1], 10) || 0;
    return (completedOvers * 6) + ballsInOver;
  }, [overs]);

  // Striker & Non-striker strike rates
  const strikerSR = strikerBalls > 0 ? ((strikerRuns / strikerBalls) * 100).toFixed(1) : '0.0';
  const nonStrikerSR = nonStrikerBalls > 0 ? ((nonStrikerRuns / nonStrikerBalls) * 100).toFixed(1) : '0.0';

  // Effective match and official names
  const effectiveGroundName = groundName || matchVenue || 'Gully Stadium';
  const effectiveTournamentName = tournamentName || 'STAR TV PREMIER LEAGUE 2026';
  const effectiveUmpire1 = umpire1Name || 'Official Umpire 1';
  const effectiveUmpire2 = umpire2Name || 'Official Umpire 2';
  const effectiveCommentator = commentatorName || 'Live Commentary Desk';
  const effectiveManager = scoreboardManagerName || 'Official Scorer';

  // ---------------------------------------------------------------------------
  // ENHANCEMENT 1: DYNAMIC ROTATING CONTEXT TICKER
  // ---------------------------------------------------------------------------
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [isTickerPaused, setIsTickerPaused] = useState<boolean>(false);

  // Computed Run Rates
  const computedCRR = useMemo(() => {
    if (crr !== undefined) return crr;
    if (totalBallsBowled > 0) {
      return Number(((score / totalBallsBowled) * 6).toFixed(2));
    }
    return 0.0;
  }, [crr, score, totalBallsBowled]);

  const computedRRR = useMemo(() => {
    if (rrr !== undefined) return rrr;
    if (!targetRuns) return null;
    const remR = remainingRuns ?? Math.max(0, targetRuns - score);
    const remB = remainingBalls ?? Math.max(1, (oversLimit * 6) - totalBallsBowled);
    if (remB <= 0) return 0.0;
    return Number(((remR / remB) * 6).toFixed(2));
  }, [rrr, targetRuns, remainingRuns, score, remainingBalls, oversLimit, totalBallsBowled]);

  // Projected Totals (1st innings)
  const projectedScores = useMemo(() => {
    const remBalls = Math.max(0, (oversLimit * 6) - totalBallsBowled);
    const projCurrent = Math.round(score + (remBalls * (computedCRR / 6)));
    const proj8 = Math.round(score + (remBalls * (8.0 / 6)));
    const proj10 = Math.round(score + (remBalls * (10.0 / 6)));
    return { projCurrent, proj8, proj10 };
  }, [oversLimit, totalBallsBowled, score, computedCRR]);

  // Active Partnership calculation
  const computedPartnership = useMemo(() => {
    const pRuns = partnershipRuns ?? (strikerRuns + nonStrikerRuns);
    const pBalls = partnershipBalls ?? (strikerBalls + nonStrikerBalls);
    return { runs: pRuns, balls: pBalls };
  }, [partnershipRuns, partnershipBalls, strikerRuns, nonStrikerRuns, strikerBalls, nonStrikerBalls]);

  // Match Phase detection
  const matchPhase = useMemo(() => {
    const ov = parseFloat(overs || '0.0');
    if (oversLimit === 20) {
      if (ov < 6.0) return { name: 'POWERPLAY 1 (OVS 1-6)', color: 'text-amber-400' };
      if (ov < 15.0) return { name: 'MIDDLE OVERS (OVS 7-15)', color: 'text-sky-400' };
      return { name: 'DEATH OVERS (OVS 16-20)', color: 'text-rose-400' };
    }
    if (ov < 10.0) return { name: 'MANDATORY POWERPLAY', color: 'text-amber-400' };
    if (ov < (oversLimit - 10)) return { name: 'MIDDLE OVERS', color: 'text-sky-400' };
    return { name: 'DEATH OVERS', color: 'text-rose-400' };
  }, [overs, oversLimit]);

  // ---------------------------------------------------------------------------
  // ENHANCEMENT 2: LIVE BALL-SPEED RADAR GUN
  // ---------------------------------------------------------------------------
  const [speedUnit, setSpeedUnit] = useState<'kmh' | 'mph'>('kmh');
  const [speedPulse, setSpeedPulse] = useState<boolean>(false);

  // Deterministic realistic ball speed based on current bowler name & ball count
  const speedReading = useMemo(() => {
    if (ballSpeedKmh && ballSpeedKmh > 0) {
      return ballSpeedKmh;
    }
    // Generate realistic pace between 136.2 and 147.8 km/h for authentic Star Sports feel
    const seed = (bowlerName.length * 7 + totalBallsBowled * 13) % 116;
    const baseKmh = 136.2 + (seed * 0.1);
    return Number(baseKmh.toFixed(1));
  }, [ballSpeedKmh, bowlerName, totalBallsBowled]);

  const speedReadingMph = useMemo(() => {
    return Number((speedReading * 0.621371).toFixed(1));
  }, [speedReading]);

  // Trigger speed pulse on ball changes
  useEffect(() => {
    setSpeedPulse(true);
    const timer = setTimeout(() => setSpeedPulse(false), 1200);
    return () => clearTimeout(timer);
  }, [totalBallsBowled, thisOverBalls.length]);

  const deliveryTag = useMemo(() => {
    if (deliveryType) return deliveryType;
    const types = ['Good Length', 'Yorker', 'Out-Swinger', 'Back of Length', 'In-Swinger', 'Slower Cutter'];
    const idx = (totalBallsBowled + bowlerName.length) % types.length;
    return types[idx];
  }, [deliveryType, totalBallsBowled, bowlerName]);

  // ---------------------------------------------------------------------------
  // ENHANCEMENT 3: MILESTONE & MATCH SITUATION ALERTS
  // ---------------------------------------------------------------------------
  const strikerMilestone = useMemo(() => {
    if (strikerRuns >= 100) return { title: 'CENTURY 100*', type: '100' };
    if (strikerRuns >= 50) return { title: 'FIFTY 50*', type: '50' };
    return null;
  }, [strikerRuns]);

  const nonStrikerMilestone = useMemo(() => {
    if (nonStrikerRuns >= 100) return { title: 'CENTURY 100*', type: '100' };
    if (nonStrikerRuns >= 50) return { title: 'FIFTY 50*', type: '50' };
    return null;
  }, [nonStrikerRuns]);

  const bowlerSpellAlert = useMemo(() => {
    const parts = bowlerFigures.split('/');
    const wkts = parseInt(parts[0], 10);
    if (!isNaN(wkts) && wkts >= 3) {
      return `${wkts} WICKET SPELL`;
    }
    return null;
  }, [bowlerFigures]);

  const [drsVisible, setDrsVisible] = useState<boolean>(isDrsActive);
  useEffect(() => {
    setDrsVisible(isDrsActive);
  }, [isDrsActive]);

  // ---------------------------------------------------------------------------
  // ENHANCEMENT 4: OVER-BREAK RECAP TRANSITION
  // ---------------------------------------------------------------------------
  const [manualRecapToggle, setManualRecapToggle] = useState<boolean>(false);
  const isOverComplete = useMemo(() => {
    const ballsInOver = normalizedBalls.length;
    return ballsInOver >= 6;
  }, [normalizedBalls.length]);

  const showRecap = manualRecapToggle || isOverComplete;

  const overBreakSummary = useMemo(() => {
    let runsInOver = 0;
    let dots = 0;
    let fours = 0;
    let sixes = 0;
    let wickets = 0;

    normalizedBalls.forEach(b => {
      const lbl = b.label.toLowerCase();
      if (b.type === 'wicket' || lbl === 'w') {
        wickets += 1;
        // Clean wicket with 0 runs is a dot ball in bowling analysis
        dots += 1;
      } else if (b.type === 'six' || lbl === '6') { sixes += 1; runsInOver += 6; }
      else if (b.type === 'four' || lbl === '4') { fours += 1; runsInOver += 4; }
      else if (b.type === 'dot' || lbl === '0' || lbl === '•' || lbl === 'dot') dots += 1;
      else {
        const digits = lbl.match(/\d+/);
        if (digits) runsInOver += parseInt(digits[0], 10);
      }
    });

    const currOverNum = Math.ceil(totalBallsBowled / 6) || 1;
    return { currOverNum, runsInOver, dots, fours, sixes, wickets };
  }, [normalizedBalls, totalBallsBowled]);

  // ---------------------------------------------------------------------------
  // ENHANCEMENT 5: WIN PREDICTOR PROBABILITY METER
  // ---------------------------------------------------------------------------
  const [winMeterExpanded, setWinMeterExpanded] = useState<boolean>(true);

  const computedWinProbabilities = useMemo(() => {
    if (winProbabilityA !== undefined && winProbabilityB !== undefined) {
      return { teamA: winProbabilityA, teamB: winProbabilityB };
    }

    // Dynamic Cricket Win Expectancy formula
    if (targetRuns && targetRuns > 0) {
      // 2nd innings chasing model
      const remRuns = remainingRuns ?? Math.max(0, targetRuns - score);
      const remBalls = remainingBalls ?? Math.max(1, (oversLimit * 6) - totalBallsBowled);
      const reqRR = (remRuns / remBalls) * 6;
      const wicketsInHand = Math.max(0, 10 - wickets);

      if (remRuns <= 0) return { teamA: 100, teamB: 0 };
      if (wickets >= 10 || remBalls <= 0) return { teamA: 0, teamB: 100 };

      // Base win probability of batting team
      let batProb = 50;
      // Advantage if required run rate is manageable
      if (reqRR <= 6.0) batProb += 28;
      else if (reqRR <= 8.0) batProb += 15;
      else if (reqRR <= 10.0) batProb += 2;
      else if (reqRR <= 12.0) batProb -= 16;
      else if (reqRR <= 15.0) batProb -= 30;
      else batProb -= 42;

      // Advantage based on wickets in hand
      batProb += (wicketsInHand - 5) * 4.5;
      batProb = Math.max(3, Math.min(97, Math.round(batProb)));
      return { teamA: batProb, teamB: 100 - batProb };
    } else {
      // 1st innings par score estimation model
      const parScore = oversLimit * 8.4; // standard ~168 T20 par
      const projected = projectedScores.projCurrent;
      const wicketsLost = wickets;
      let batProb = 50 + ((projected - parScore) * 0.45) - (wicketsLost * 2.5);
      batProb = Math.max(8, Math.min(92, Math.round(batProb)));
      return { teamA: batProb, teamB: 100 - batProb };
    }
  }, [winProbabilityA, winProbabilityB, targetRuns, remainingRuns, score, remainingBalls, oversLimit, totalBallsBowled, wickets, projectedScores.projCurrent]);

  // ---------------------------------------------------------------------------
  // ENHANCEMENT 6: BATTER WAGON WHEEL MINI-POPUP
  // ---------------------------------------------------------------------------
  const [activeWagonBatter, setActiveWagonBatter] = useState<'striker' | 'nonStriker' | null>(null);

  // Generate realistic default wagon wheel shots if none provided
  const getBatterShots = (name: string, runs: number, fours: number, sixes: number, customShots?: BatterShotSector[]) => {
    if (customShots && customShots.length > 0) return customShots;
    const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shots: BatterShotSector[] = [];
    
    // Distribute fours into typical boundary angles (Cover, Mid-wicket, Point, Straight, Fine Leg)
    const angles4s = [45, 65, 110, 220, 250, 290, 320];
    for (let i = 0; i < fours; i++) {
      const ang = angles4s[(seed + i * 3) % angles4s.length];
      shots.push({ angle: ang, runs: 4, type: 'four' });
    }
    // Distribute sixes (Long-on, Long-off, Deep Mid-wicket, Square Leg)
    const angles6s = [15, 345, 75, 260, 295];
    for (let i = 0; i < sixes; i++) {
      const ang = angles6s[(seed + i * 5) % angles6s.length];
      shots.push({ angle: ang, runs: 6, type: 'six' });
    }
    // Distribute remaining runs into singles and doubles
    const singlesCount = Math.min(12, Math.max(2, runs - (fours * 4 + sixes * 6)));
    for (let i = 0; i < singlesCount; i++) {
      const ang = (seed * 17 + i * 43) % 360;
      shots.push({ angle: ang, runs: 1, type: 'single' });
    }
    return shots;
  };

  const strikerWagonShots = useMemo(() => {
    return getBatterShots(strikerName, strikerRuns, strikerFours, strikerSixes, strikerShots);
  }, [strikerName, strikerRuns, strikerFours, strikerSixes, strikerShots]);

  const nonStrikerWagonShots = useMemo(() => {
    return getBatterShots(nonStrikerName, nonStrikerRuns, nonStrikerFours, nonStrikerSixes, nonStrikerShots);
  }, [nonStrikerName, nonStrikerRuns, nonStrikerFours, nonStrikerSixes, nonStrikerShots]);

  // Dynamic automatic slides for the Scorebug Ticker Carousel
  const tickerSlides = useMemo(() => {
    return [
      {
        id: 'tournament_venue',
        category: 'TOURNAMENT & VENUE',
        categoryColor: 'text-amber-400',
        content: (
          <span className="text-white inline-flex items-center gap-2 justify-center flex-wrap">
            {tournamentLogo ? (
              <img 
                src={tournamentLogo} 
                alt="Tournament Logo" 
                className="w-4 h-4 rounded object-cover border border-amber-400/60 inline-block shrink-0 shadow-sm" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <Trophy size={13} className="text-amber-400 shrink-0 inline-block" />
            )}
            <span className="text-amber-400 font-bold">TOURNAMENT:</span>
            <strong className="text-amber-200 font-black tracking-wide">{effectiveTournamentName}</strong>
            <span className="text-white/30">•</span>
            <MapPin size={12} className="text-sky-400 shrink-0 inline-block" />
            <span className="text-sky-400 font-bold">GROUND / VENUE:</span>
            <strong className="text-sky-200 font-black tracking-wide">{effectiveGroundName}</strong>
            {matchStage && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-emerald-400 font-bold text-[10px] uppercase">({matchStage})</span>
              </>
            )}
          </span>
        )
      },
      {
        id: 'umpires',
        category: 'MATCH UMPIRES',
        categoryColor: 'text-sky-400',
        content: (
          <span className="text-white inline-flex items-center gap-2 justify-center flex-wrap">
            <Scale size={13} className="text-amber-400 shrink-0 inline-block" />
            {umpire1Photo ? (
              <img src={umpire1Photo} alt={effectiveUmpire1} className="w-4 h-4 rounded-full object-cover border border-amber-400/60 inline-block shrink-0 shadow-sm" referrerPolicy="no-referrer" />
            ) : null}
            <span className="text-slate-400 font-bold">UMPIRE 1:</span>
            <strong className="text-amber-300 font-black">{effectiveUmpire1}</strong>
            <span className="text-white/30">•</span>
            {umpire2Photo ? (
              <img src={umpire2Photo} alt={effectiveUmpire2} className="w-4 h-4 rounded-full object-cover border border-sky-400/60 inline-block shrink-0 shadow-sm" referrerPolicy="no-referrer" />
            ) : null}
            <span className="text-slate-400 font-bold">UMPIRE 2:</span>
            <strong className="text-sky-300 font-black">{effectiveUmpire2}</strong>
          </span>
        )
      },
      {
        id: 'commentary_manager',
        category: 'COMMENTARY & SCORING',
        categoryColor: 'text-emerald-400',
        content: (
          <span className="text-white inline-flex items-center gap-2 justify-center flex-wrap">
            <Mic size={13} className="text-emerald-400 shrink-0 inline-block" />
            {commentatorPhoto ? (
              <img src={commentatorPhoto} alt={effectiveCommentator} className="w-4 h-4 rounded-full object-cover border border-emerald-400/60 inline-block shrink-0 shadow-sm" referrerPolicy="no-referrer" />
            ) : null}
            <span className="text-slate-400 font-bold">COMMENTARY:</span>
            <strong className="text-emerald-300 font-black">{effectiveCommentator}</strong>
            <span className="text-white/30">•</span>
            <Monitor size={13} className="text-purple-400 shrink-0 inline-block" />
            {scoreboardManagerPhoto ? (
              <img src={scoreboardManagerPhoto} alt={effectiveManager} className="w-4 h-4 rounded-full object-cover border border-purple-400/60 inline-block shrink-0 shadow-sm" referrerPolicy="no-referrer" />
            ) : null}
            <span className="text-slate-400 font-bold">SCOREBOARD MANAGER:</span>
            <strong className="text-purple-300 font-black">{effectiveManager}</strong>
          </span>
        )
      },
      {
        id: 'rates_chase',
        category: targetRuns && targetRuns > 0 ? 'CHASE EQUATION' : 'RUN RATES & PROJECTIONS',
        categoryColor: 'text-amber-400',
        content: targetRuns && targetRuns > 0 ? (
          <span className="text-white">
            CRR: <strong className="text-amber-300">{computedCRR}</strong>
            <span className="text-white/30 mx-2">•</span>
            REQ RR: <strong className="text-rose-400">{computedRRR ?? '0.0'}</strong>
            <span className="text-white/30 mx-2">•</span>
            TARGET: <strong className="text-sky-300">{targetRuns}</strong> (Need {remainingRuns ?? Math.max(0, targetRuns - score)} off {remainingBalls ?? 0}b)
          </span>
        ) : (
          <span className="text-white">
            CRR: <strong className="text-amber-300">{computedCRR}</strong>
            <span className="text-white/30 mx-2">•</span>
            PROJECTED TOTAL: <strong className="text-emerald-400">{projectedScores.projCurrent}</strong> (at current RR)
            <span className="text-white/30 mx-2">•</span>
            {projectedScores.proj8} (@ 8.0)
            <span className="text-white/30 mx-2">•</span>
            {projectedScores.proj10} (@ 10.0)
          </span>
        )
      },
      {
        id: 'partnership',
        category: 'ACTIVE PARTNERSHIP',
        categoryColor: 'text-indigo-400',
        content: (
          <span className="text-white">
            PARTNERSHIP: <strong className="text-amber-300">{computedPartnership.runs}*</strong> ({computedPartnership.balls}b)
            <span className="text-white/30 mx-2">•</span>
            {strikerName}: <strong className="text-sky-300">{strikerRuns}</strong> ({strikerBalls}b)
            <span className="text-white/30 mx-1">&</span>
            {nonStrikerName}: <strong className="text-slate-300">{nonStrikerRuns}</strong> ({nonStrikerBalls}b)
          </span>
        )
      },
      {
        id: 'phase_rhythm',
        category: 'MATCH RHYTHM & PHASE',
        categoryColor: 'text-rose-400',
        content: (
          <span className="text-white">
            PHASE: <strong className={matchPhase.color}>{matchPhase.name}</strong>
            <span className="text-white/30 mx-2">•</span>
            LAST 5 OVERS: <strong className="text-emerald-300">{last5OversRuns ?? Math.round(score * 0.35)}/{last5OversWickets ?? 1}</strong> (RR {((last5OversRuns ?? Math.round(score * 0.35)) / 5).toFixed(1)})
          </span>
        )
      },
      {
        id: 'boundaries_dots',
        category: 'INNINGS BOUNDARY ANALYSIS',
        categoryColor: 'text-amber-400',
        content: (
          <span className="text-white">
            BOUNDARIES: <strong className="text-sky-400">{inningsFours ?? (strikerFours + nonStrikerFours)}</strong> FOURS
            <span className="text-white/30 mx-1.5">•</span>
            <strong className="text-amber-400">{inningsSixes ?? (strikerSixes + nonStrikerSixes)}</strong> SIXES
            <span className="text-white/30 mx-1.5">•</span>
            DOT BALLS: <strong className="text-slate-300">{inningsDotBalls ?? 0}</strong>
          </span>
        )
      }
    ];
  }, [
    tournamentLogo,
    effectiveTournamentName,
    effectiveGroundName,
    matchStage,
    umpire1Photo,
    effectiveUmpire1,
    umpire2Photo,
    effectiveUmpire2,
    commentatorPhoto,
    effectiveCommentator,
    scoreboardManagerPhoto,
    effectiveManager,
    targetRuns,
    computedCRR,
    computedRRR,
    remainingRuns,
    remainingBalls,
    score,
    projectedScores,
    computedPartnership,
    strikerName,
    strikerRuns,
    strikerBalls,
    nonStrikerName,
    nonStrikerRuns,
    nonStrikerBalls,
    matchPhase,
    last5OversRuns,
    last5OversWickets,
    inningsFours,
    strikerFours,
    nonStrikerFours,
    inningsSixes,
    strikerSixes,
    nonStrikerSixes,
    inningsDotBalls
  ]);

  // Automatic rotation for ticker every 5.5s
  useEffect(() => {
    if (isTickerPaused || tickerSlides.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isTickerPaused, tickerSlides.length]);

  const safeTickerIndex = tickerSlides.length > 0 ? tickerIndex % tickerSlides.length : 0;
  const currentSlide = tickerSlides[safeTickerIndex] || tickerSlides[0];

  return (
    <div 
      id="star-tv-scorebug-container"
      className="relative w-full select-none font-sans filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
    >
      {/* =========================================================================
          ENHANCEMENT 5: OFFICIAL WIN PREDICTOR PROBABILITY METER
          ========================================================================= */}
      {showWinPredictor && (
        <div className="mx-auto w-full max-w-3xl mb-1 px-4">
          <div className="bg-slate-950/95 border border-white/20 rounded-t-xl px-4 py-1.5 backdrop-blur-xl shadow-2xl flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-wider">
              {/* Left Team Probability */}
              <div className="flex items-center gap-1.5 font-black text-white">
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: battingTeamColor }}
                />
                <span className="uppercase">{battingTeamName}</span>
                <span className="text-amber-300 text-xs font-black">{computedWinProbabilities.teamA}%</span>
              </div>

              {/* Center Star Sports Predictor Label */}
              <div className="flex items-center gap-1 text-[9px] font-extrabold uppercase text-slate-400">
                <Sparkles size={11} className="text-amber-400 animate-pulse" />
                <span className="bg-gradient-to-r from-amber-300 via-sky-300 to-amber-300 bg-clip-text text-transparent font-black">
                  STAR PREDICTOR • LIVE WIN PROBABILITY
                </span>
                <button
                  type="button"
                  onClick={() => setWinMeterExpanded(prev => !prev)}
                  className="ml-1 text-slate-500 hover:text-white transition-colors"
                  title="Toggle Meter"
                >
                  {winMeterExpanded ? '−' : '+'}
                </button>
              </div>

              {/* Right Team Probability */}
              <div className="flex items-center gap-1.5 font-black text-white">
                <span className="text-sky-300 text-xs font-black">{computedWinProbabilities.teamB}%</span>
                <span className="uppercase">{bowlingTeamName}</span>
                <span 
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-sm"
                  style={{ backgroundColor: bowlingTeamColor }}
                />
              </div>
            </div>

            {/* Probability Dual Bar */}
            {winMeterExpanded && (
              <div className="relative h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/10 flex items-stretch">
                <motion.div 
                  className="h-full relative transition-all duration-700 ease-out"
                  style={{ 
                    width: `${computedWinProbabilities.teamA}%`, 
                    backgroundColor: battingTeamColor 
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent pointer-events-none" />
                </motion.div>
                <motion.div 
                  className="h-full relative transition-all duration-700 ease-out"
                  style={{ 
                    width: `${computedWinProbabilities.teamB}%`, 
                    backgroundColor: bowlingTeamColor 
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-white/20 via-transparent to-transparent pointer-events-none" />
                </motion.div>
                {/* Center marker line */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/60 z-10" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          ENHANCEMENT 3: DRS / REVIEW ALERT BANNER
          ========================================================================= */}
      <AnimatePresence>
        {drsVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-auto w-fit mb-1 px-6 py-1 bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-950 border border-purple-400/80 rounded-t-lg text-white text-xs font-mono font-black uppercase tracking-wider flex items-center gap-3 shadow-[0_0_20px_rgba(168,85,247,0.5)] z-40 backdrop-blur-md"
          >
            <Radio size={14} className="text-purple-300 animate-spin" />
            <span className="text-amber-300">★ DRS REVIEW:</span>
            <span>{drsDetails}</span>
            <button 
              type="button"
              onClick={() => setDrsVisible(false)}
              className="text-white/60 hover:text-white ml-2 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Stinger Glow Header */}
      {activeStinger && (
        <div 
          className={`absolute -top-3 inset-x-0 h-2 z-40 animate-pulse ${
            activeStinger === 'four' 
              ? 'bg-sky-400 shadow-[0_0_20px_#38bdf8]' 
              : activeStinger === 'six' 
              ? 'bg-amber-400 shadow-[0_0_25px_#fbbf24]' 
              : 'bg-rose-500 shadow-[0_0_20px_#f43f5e]'
          }`} 
        />
      )}

      {/* =========================================================================
          MASTER SCOREBUG TV BAR - 100% Full-Bleed Screen Width
          ========================================================================= */}
      <div className="flex items-stretch justify-between h-[74px] sm:h-[86px] w-full border-t border-white/20 bg-slate-950/95 shadow-2xl backdrop-blur-xl relative">
        
        {/* =====================================================================
            1. LEFT WING: BATTING TEAM BADGE & ACTIVE BATSMEN
            ===================================================================== */}
        <div className="flex-1 flex items-stretch min-w-0 bg-gradient-to-r from-slate-900/90 to-slate-950/80">
          
          {/* Batting Team Polygonal Brand Block */}
          <div 
            className="relative px-3.5 sm:px-6 flex items-center gap-2.5 text-white shrink-0 overflow-hidden"
            style={{ 
              backgroundColor: battingTeamColor,
              clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0% 100%)',
              paddingRight: '2rem'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

            {isLive && (
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse shrink-0" />
            )}

            {battingTeamLogo ? (
              <img 
                src={battingTeamLogo} 
                alt={battingTeamName} 
                className="w-9 h-9 rounded-full border border-white/30 bg-black/40 object-contain shrink-0 shadow"
                referrerPolicy="no-referrer"
              />
            ) : null}

            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-white drop-shadow truncate max-w-[120px] xl:max-w-[200px]">
                {battingTeamName}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-widest leading-none">
                {battingTeamSubtext}
              </span>
            </div>
          </div>

          {/* Batters Details */}
          <div className="flex-1 px-2 sm:px-5 flex items-center justify-around gap-2 min-w-0 overflow-hidden">
            
            {/* ---------------- Striker Slot ---------------- */}
            <div className="flex flex-col justify-center min-w-0 relative">
              {/* Milestone ribbon flash */}
              {strikerMilestone && (
                <div className="absolute -top-3.5 left-0 px-2 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 text-[8px] font-black font-mono rounded shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse flex items-center gap-1 z-20">
                  <span>★</span>
                  <span>{strikerMilestone.title}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_6px_#34d399]" />
                <span className="text-xs sm:text-base font-black text-white uppercase truncate max-w-[110px] xl:max-w-[160px]">
                  {strikerName}*
                </span>
                
                {/* Enhancement 6: Mini Wagon Wheel Trigger Pill */}
                <button
                  type="button"
                  onClick={() => setActiveWagonBatter(prev => prev === 'striker' ? null : 'striker')}
                  className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-mono font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                    activeWagonBatter === 'striker' 
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_#f59e0b]' 
                      : 'bg-white/10 hover:bg-white/20 text-sky-300'
                  }`}
                  title="View Striker Wagon Wheel"
                >
                  <Target size={10} />
                  <span>SHOTS</span>
                </button>
              </div>

              {/* Runs, Balls, SR + Enhancement 6 Boundary Breakdown */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm sm:text-lg font-black font-mono text-amber-300">
                  {strikerRuns}
                  <span className="text-[11px] font-normal text-slate-400 ml-0.5">({strikerBalls})</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-400/80 px-1 py-0.2 bg-amber-400/10 rounded hidden md:inline-block">
                  SR {strikerSR}
                </span>

                {/* Boundary Breakdown: 4s & 6s */}
                <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                  <span className="text-sky-400 bg-sky-500/10 px-1 rounded border border-sky-400/30">
                    4s:{strikerFours}
                  </span>
                  <span className="text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-400/30">
                    6s:{strikerSixes}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 shrink-0" />

            {/* ---------------- Non-Striker Slot ---------------- */}
            <div className="flex flex-col justify-center min-w-0 relative">
              {/* Milestone ribbon flash */}
              {nonStrikerMilestone && (
                <div className="absolute -top-3.5 left-0 px-2 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 text-[8px] font-black font-mono rounded shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse flex items-center gap-1 z-20">
                  <span>★</span>
                  <span>{nonStrikerMilestone.title}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-base font-bold text-slate-300 uppercase truncate max-w-[100px] xl:max-w-[150px]">
                  {nonStrikerName}
                </span>

                {/* Enhancement 6: Mini Wagon Wheel Trigger Pill */}
                <button
                  type="button"
                  onClick={() => setActiveWagonBatter(prev => prev === 'nonStriker' ? null : 'nonStriker')}
                  className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-mono font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                    activeWagonBatter === 'nonStriker' 
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_#f59e0b]' 
                      : 'bg-white/10 hover:bg-white/20 text-sky-300'
                  }`}
                  title="View Non-Striker Wagon Wheel"
                >
                  <Target size={10} />
                  <span>SHOTS</span>
                </button>
              </div>

              {/* Runs, Balls, SR + Enhancement 6 Boundary Breakdown */}
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-sm sm:text-lg font-black font-mono text-slate-200">
                  {nonStrikerRuns}
                  <span className="text-[11px] font-normal text-slate-400 ml-0.5">({nonStrikerBalls})</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 px-1 py-0.2 bg-white/5 rounded hidden md:inline-block">
                  SR {nonStrikerSR}
                </span>

                {/* Boundary Breakdown: 4s & 6s */}
                <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                  <span className="text-sky-400 bg-sky-500/10 px-1 rounded border border-sky-400/30">
                    4s:{nonStrikerFours}
                  </span>
                  <span className="text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-400/30">
                    6s:{nonStrikerSixes}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* =====================================================================
            2. ELEVATED CENTER SHIELD: SCORE & WICKETS & OVERS
            ===================================================================== */}
        <div 
          id="star-tv-center-shield"
          className="relative z-20 px-5 sm:px-8 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-[#070b14] to-slate-950 text-white shrink-0 border-x border-white/20 shadow-[0_0_25px_rgba(0,0,0,0.9)]"
          style={{ minWidth: '180px' }}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-80" />

          {/* Enhancement 3: Free Hit Live Beacon */}
          {isFreeHit && (
            <div className="absolute -top-3.5 inset-x-2 py-0.5 rounded bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 text-[9px] font-black font-mono tracking-widest text-center uppercase shadow-[0_0_15px_rgba(245,158,11,1)] animate-bounce flex items-center justify-center gap-1 z-30">
              <Zap size={11} className="fill-current" />
              <span>★ FREE HIT ★</span>
            </div>
          )}

          {/* Main Score & Wickets Display */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]">
              {score}/{wickets}
            </span>
          </div>

          {/* Overs Indicator */}
          <div className="flex items-center gap-1.5 -mt-0.5">
            <span className="text-[11px] sm:text-xs font-bold font-mono text-sky-300 tracking-wider">
              {overs}
              {oversLimit ? <span className="text-slate-400 font-normal"> / {oversLimit} OV</span> : ' OV'}
            </span>
          </div>
        </div>

        {/* =====================================================================
            3. RIGHT WING: BOWLER HUD & SPEED RADAR & THIS OVER / RECAP
            ===================================================================== */}
        <div className="flex-1 flex items-stretch min-w-0 bg-gradient-to-l from-slate-900/90 to-slate-950/80">
          
          {/* Bowler Details & This Over Balls */}
          <div className={`flex-1 px-2 sm:px-4 flex items-center ${activeScorebugMode !== 'this_over' ? 'justify-between' : 'justify-around'} gap-2 sm:gap-4 min-w-0 overflow-hidden`}>
            
            {/* Active Bowler */}
            <div className={`flex flex-col justify-center relative ${activeScorebugMode !== 'this_over' ? 'shrink-0 min-w-[105px] sm:min-w-[130px]' : 'min-w-0'}`}>
              {/* 3+ Wicket Spell Alert */}
              {bowlerSpellAlert && (
                <div className="absolute -top-3.5 left-0 px-2 py-0.2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[8px] font-black font-mono rounded shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse flex items-center gap-1 z-20">
                  <span>★</span>
                  <span>{bowlerSpellAlert}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1 py-0.2 rounded bg-white/10 text-slate-300 font-mono">
                  BOWL
                </span>
                <span className="text-xs sm:text-base font-black text-white uppercase truncate max-w-[110px] xl:max-w-[160px]">
                  {bowlerName}
                </span>
              </div>

              {/* Bowler figures + Overs */}
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-sm sm:text-lg font-black font-mono text-emerald-400">
                  {bowlerFigures}
                </span>
                {bowlerOvers && (
                  <span className="text-[11px] font-mono text-slate-400">
                    ({bowlerOvers} ov)
                  </span>
                )}
                {bowlerEcon !== undefined && bowlerEcon > 0 && (
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 hidden lg:inline-block">
                    Econ {bowlerEcon}
                  </span>
                )}
              </div>

              {/* ---------------- ENHANCEMENT 2: SPEED RADAR GUN ---------------- */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <div 
                  onClick={() => setSpeedUnit(prev => prev === 'kmh' ? 'mph' : 'kmh')}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border transition-all cursor-pointer select-none ${
                    speedPulse 
                      ? 'border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.6)]' 
                      : 'border-white/10 text-sky-300 hover:border-sky-400/50'
                  }`}
                  title="Click to toggle KM/H / MPH"
                >
                  <Zap size={10} className={`${speedPulse ? 'animate-bounce text-amber-400' : 'text-sky-400'}`} />
                  <span className="text-[9px] sm:text-[10px] font-mono font-black">
                    {speedUnit === 'kmh' ? `${speedReading} KM/H` : `${speedReadingMph} MPH`}
                  </span>
                </div>
                
                <span className="text-[8px] text-slate-400 font-mono hidden xl:inline-block">
                  {deliveryTag}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 shrink-0" />

            {/* ---------------- ENHANCEMENT 4: THIS OVER / OVER RECAP OR DETAIL OVERLAYS ---------------- */}
            <div className={`flex flex-col justify-center transition-all duration-300 ${activeScorebugMode !== 'this_over' ? 'flex-1 min-w-[280px] sm:min-w-[360px] md:min-w-[460px] lg:min-w-[560px] max-w-[680px]' : 'shrink-0 min-w-[150px] sm:min-w-[190px] max-w-[280px]'}`}>
              {activeScorebugMode === 'tournament' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-center py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500/25 via-slate-900/95 to-amber-500/15 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1.5">
                      <Trophy size={11} className="text-amber-400" />
                      TOURNAMENT
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetOverlayMode('this_over')}
                      className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-amber-300 hover:text-white px-1.5 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/30 cursor-pointer transition-all"
                      title="Return to Over Balls"
                    >
                      ✕ BALLS
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {tournamentLogo && (
                      <img src={tournamentLogo} alt="Logo" className="w-5 h-5 rounded object-cover border border-amber-400/60 shrink-0 shadow-sm" referrerPolicy="no-referrer" />
                    )}
                    <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 truncate drop-shadow-sm">
                      {tournamentName || effectiveTournamentName}
                    </span>
                  </div>
                  <span className="text-[8.5px] sm:text-[10px] font-mono font-bold text-sky-300 uppercase truncate mt-0.5">
                    {matchStage} {effectiveGroundName ? `• 📍 ${effectiveGroundName}` : ''}
                  </span>
                </motion.div>
              ) : activeScorebugMode === 'toss_equation' ? (() => {
                const effectiveTossWinner = (tossWinner || (tossDetails ? tossDetails.split(' ')[0] : '') || battingTeamName || 'TEAM A').toUpperCase();
                const effectiveTossChoice = (tossChoice || (tossDetails && /bowl/i.test(tossDetails) ? 'BOWL' : 'BAT')).toUpperCase();
                const resolvedTossText = tossDetails || `${effectiveTossWinner} WON TOSS & ELECTED TO ${effectiveTossChoice}`;
                const hasChaseTarget = Boolean(targetRuns || equationText || remainingRuns !== undefined);
                const isShowingToss = tossEquationMode === 'toss' || (!hasChaseTarget && !winnerDetails);

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col justify-center py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-500/25 via-slate-900/95 to-sky-500/20 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
                          {winnerDetails ? <Trophy size={11} className="text-amber-400" /> : isShowingToss ? <Coins size={11} className="text-sky-400" /> : <Target size={11} className="text-emerald-400" />}
                          {winnerDetails ? 'MATCH WINNER' : isShowingToss ? 'TOSS RESULT' : 'TARGET EQUATION'}
                        </span>

                        {/* Interactive toggle between Toss and Chase view when target exists */}
                        {hasChaseTarget && !winnerDetails && (
                          <button
                            type="button"
                            onClick={() => setTossEquationMode(prev => prev === 'toss' ? 'equation' : 'toss')}
                            className="text-[7.5px] font-mono font-bold text-sky-300 hover:text-white px-1.5 py-0.2 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 cursor-pointer transition-all"
                            title="Toggle between Toss Result & Target Equation"
                          >
                            {isShowingToss ? '⇄ VIEW CHASE' : '⇄ VIEW TOSS'}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetOverlayMode('this_over')}
                        className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-emerald-300 hover:text-white px-1.5 py-0.5 rounded bg-emerald-400/15 hover:bg-emerald-400/30 border border-emerald-400/30 cursor-pointer transition-all"
                        title="Return to Over Balls"
                      >
                        ✕ BALLS
                      </button>
                    </div>

                    {/* Main Headline */}
                    {winnerDetails ? (
                      <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide text-amber-300 truncate drop-shadow">
                        {winnerDetails}
                      </span>
                    ) : isShowingToss ? (
                      <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide text-white truncate drop-shadow">
                        {resolvedTossText}
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide text-emerald-300 truncate drop-shadow">
                        {equationText || (remainingRuns !== undefined && remainingBalls !== undefined ? `NEED ${remainingRuns} RUNS IN ${remainingBalls} BALLS` : `TARGET: ${targetRuns} RUNS`)}
                      </span>
                    )}

                    {/* Subtitle with Context */}
                    <span className="text-[8.5px] sm:text-[10px] font-mono font-bold text-slate-200 uppercase truncate mt-0.5">
                      {winnerDetails ? (
                        `MATCH CONCLUDED • TOSS: ${resolvedTossText}`
                      ) : isShowingToss ? (
                        hasChaseTarget ? `${equationText || `NEED ${remainingRuns} OFF ${remainingBalls}`} • RRR: ${rrr ?? '-'}` : `1ST INNINGS IN PLAY • ${battingTeamName} BATTING FIRST`
                      ) : (
                        `${rrr !== undefined ? `RRR: ${rrr} • ` : ''}TOSS: ${resolvedTossText}`
                      )}
                    </span>
                  </motion.div>
                );
              })() : activeScorebugMode === 'last_batsman' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-center py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-rose-500/25 via-slate-900/95 to-amber-500/15 border border-rose-400/60 shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-rose-400 font-mono flex items-center gap-1.5">
                      <Zap size={11} className="text-rose-400" />
                      LAST OUT BATSMAN
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetOverlayMode('this_over')}
                      className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-rose-300 hover:text-white px-1.5 py-0.5 rounded bg-rose-400/15 hover:bg-rose-400/30 border border-rose-400/30 cursor-pointer transition-all"
                      title="Return to Over Balls"
                    >
                      ✕ BALLS
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="text-sm sm:text-base md:text-lg font-black uppercase tracking-wide text-white truncate drop-shadow">
                      {lastBatsmanName || 'NO WICKETS DOWN'}
                    </span>
                    {lastBatsmanRuns !== undefined && (
                      <span className="text-xs sm:text-sm font-mono font-black text-rose-300">
                        {lastBatsmanRuns} <span className="text-[10px] text-slate-400 font-normal">({lastBatsmanBalls || 0}b)</span>
                        {lastBatsmanSR !== undefined && (
                          <span className="text-[9.5px] text-slate-400 font-mono font-medium ml-1.5">SR {lastBatsmanSR}</span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-[8.5px] sm:text-[10px] font-mono font-bold text-slate-300 uppercase truncate mt-0.5">
                    {lastBatsmanDismissal || (lastBatsmanFow ? `FoW: ${lastBatsmanFow}` : 'YET TO FALL')}
                  </span>
                </motion.div>
              ) : activeScorebugMode === 'partnership' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-center py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-sky-500/25 via-slate-900/95 to-indigo-500/20 border border-sky-400/60 shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-sky-400 font-mono flex items-center gap-1.5">
                      <Users size={11} className="text-sky-400" />
                      CURRENT PARTNERSHIP
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetOverlayMode('this_over')}
                      className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-sky-300 hover:text-white px-1.5 py-0.5 rounded bg-sky-400/15 hover:bg-sky-400/30 border border-sky-400/30 cursor-pointer transition-all"
                      title="Return to Over Balls"
                    >
                      ✕ BALLS
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="text-sm sm:text-base md:text-lg font-black font-mono text-cyan-300 drop-shadow">
                      {partnershipRuns ?? 0} RUNS
                    </span>
                    <span className="text-xs sm:text-sm font-mono text-slate-400">
                      ({partnershipBalls ?? 0} balls)
                    </span>
                  </div>
                  <span className="text-[8.5px] sm:text-[10px] font-mono font-bold text-slate-200 uppercase truncate mt-0.5">
                    {strikerName.split(' ')[0]} {strikerRuns} ({strikerBalls}b) • {nonStrikerName.split(' ')[0]} {nonStrikerRuns} ({nonStrikerBalls}b)
                  </span>
                </motion.div>
              ) : activeScorebugMode === 'projected_crr' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-center py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-500/25 via-slate-900/95 to-amber-500/20 border border-emerald-400/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
                      <TrendingUp size={11} className="text-emerald-400" />
                      PROJECTIONS & CRR
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetOverlayMode('this_over')}
                      className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-emerald-300 hover:text-white px-1.5 py-0.5 rounded bg-emerald-400/15 hover:bg-emerald-400/30 border border-emerald-400/30 cursor-pointer transition-all"
                      title="Return to Over Balls"
                    >
                      ✕ BALLS
                    </button>
                  </div>
                  <div className="flex items-baseline gap-2.5 truncate">
                    <span className="text-sm sm:text-base md:text-lg font-black font-mono text-emerald-300 drop-shadow">
                      PROJ: {projectedScore || Math.round((crr || 6) * (oversLimit || 20))}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
                      CRR: {crr !== undefined ? crr.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <span className="text-[8.5px] sm:text-[10px] font-mono font-bold text-slate-300 uppercase truncate mt-0.5">
                    {targetRuns ? `TARGET: ${targetRuns} ${rrr ? `(RRR: ${rrr.toFixed(2)})` : ''}` : `AT 8 RPO: ${Math.round(8 * (oversLimit || 20))} • AT 10 RPO: ${Math.round(10 * (oversLimit || 20))}`}
                  </span>
                </motion.div>
              ) : activeScorebugMode === 'officials_venue' ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col justify-center py-1.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-amber-500/25 via-slate-900/95 to-sky-500/20 border border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest text-amber-400 font-mono flex items-center gap-1.5">
                      <Trophy size={11} className="text-amber-400" />
                      OFFICIALS & VENUE
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSetOverlayMode('this_over')}
                      className="text-[7.5px] sm:text-[8.5px] font-mono font-bold text-amber-300 hover:text-white px-1.5 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/30 border border-amber-400/30 cursor-pointer transition-all"
                      title="Return to Over Balls"
                    >
                      ✕ BALLS
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm md:text-base font-black uppercase tracking-wide text-white truncate flex items-center gap-2">
                    {tournamentLogo && (
                      <img src={tournamentLogo} alt="Logo" className="w-4 h-4 rounded object-cover border border-amber-400/50 shrink-0" referrerPolicy="no-referrer" />
                    )}
                    <span className="text-amber-200 truncate">{effectiveTournamentName}</span>
                    <span className="text-white/40">•</span>
                    <span className="text-sky-300 truncate">📍 {effectiveGroundName}</span>
                  </div>
                  <div className="text-[8.5px] sm:text-[10px] font-mono font-bold text-slate-300 uppercase truncate mt-0.5">
                    ⚖️ {effectiveUmpire1} & {effectiveUmpire2} • 🎙️ {effectiveCommentator} • 💻 {effectiveManager}
                  </div>
                </motion.div>
              ) : (
                /* DEFAULT: THIS OVER / OVER RECAP */
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono flex items-center gap-1.5">
                      <Flame size={11} className="text-amber-400" />
                      <span>{showRecap ? `OVER ${overBreakSummary.currOverNum} RECAP` : 'THIS OVER:'}</span>
                      {!showRecap && <strong className="text-amber-300 font-black">{overBreakSummary.runsInOver} RUNS</strong>}
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualRecapToggle(prev => !prev)}
                      className="text-[8.5px] font-mono font-bold text-sky-400 hover:text-white px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 cursor-pointer ml-1 transition-colors"
                      title="Toggle Over Summary"
                    >
                      {showRecap ? 'BALLS' : 'RECAP'}
                    </button>
                  </div>

                  {/* Display Over Recap HUD or Ball Pills */}
                  {showRecap ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-slate-900/95 border border-sky-400/40 text-[10px] sm:text-xs font-mono font-black text-white shadow-inner"
                    >
                      <span className="text-amber-300">{overBreakSummary.runsInOver} RUNS</span>
                      <span className="text-white/30">•</span>
                      <span className="text-rose-400">{overBreakSummary.wickets} WKT</span>
                      <span className="text-white/30 hidden sm:inline">•</span>
                      <span className="text-slate-300 text-[9.5px] hidden sm:inline">
                        {overBreakSummary.dots} dots | {overBreakSummary.fours}x4 | {overBreakSummary.sixes}x6
                      </span>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                      {normalizedBalls.length > 0 ? (
                        normalizedBalls.map((ball, idx) => (
                          <span 
                            key={idx}
                            className={`rounded-full flex items-center justify-center font-mono font-black border-2 shadow-sm transition-all ${
                              ball.label.length > 3
                                ? 'w-auto min-w-[28px] sm:min-w-[34px] px-1 h-7.5 sm:h-8.5 md:h-9 text-[9px] sm:text-[10px] tracking-tighter'
                                : ball.label.length > 2
                                ? 'w-auto min-w-[28px] sm:min-w-[32px] px-1 h-7.5 sm:h-8.5 md:h-9 text-[9.5px] sm:text-[10.5px] tracking-tight'
                                : 'w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 text-xs sm:text-sm'
                            } ${
                              ball.type === 'four'
                                ? 'bg-sky-500 text-white border-sky-300 shadow-[0_0_10px_#0284c7]'
                                : ball.type === 'six'
                                ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-[0_0_12px_#f59e0b]'
                                : ball.type === 'wicket'
                                ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_12px_#e11d48]'
                                : ball.label.toLowerCase().includes('wd')
                                ? 'bg-orange-500 text-white border-orange-300 shadow-sm'
                                : ball.label.toLowerCase().includes('nb')
                                ? 'bg-pink-600 text-white border-pink-300 shadow-sm'
                                : ball.label.toLowerCase().includes('lb')
                                ? 'bg-emerald-600 text-white border-emerald-300 shadow-sm'
                                : ball.type === 'extra'
                                ? 'bg-purple-600 text-white border-purple-300'
                                : ball.type === 'run'
                                ? 'bg-slate-800 text-white border-slate-300 font-black shadow-sm'
                                : 'bg-black/80 text-slate-400 border-white/20'
                            }`}
                          >
                            {ball.label === '0' || ball.label === '•' ? '•' : ball.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">Start of over</span>
                      )}
                      {normalizedBalls.length < 6 && (
                        Array.from({ length: 6 - normalizedBalls.length }).map((_, padIdx) => (
                          <span 
                            key={`star-pad-${padIdx}`}
                            className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-[10px] text-slate-500 font-mono"
                          >
                            •
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* Bowling Team Polygonal Brand Block */}
          <div 
            className="relative px-3.5 sm:px-6 flex items-center gap-2.5 text-white shrink-0 overflow-hidden text-right"
            style={{ 
              backgroundColor: bowlingTeamColor,
              clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0% 100%)',
              paddingLeft: '2rem'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />

            <div className="flex flex-col items-end">
              <span className="text-sm sm:text-base font-black uppercase tracking-wider text-white drop-shadow truncate max-w-[120px] xl:max-w-[200px]">
                {bowlingTeamName}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-white/80 uppercase tracking-widest leading-none">
                {bowlingTeamSubtext}
              </span>
            </div>

            {bowlingTeamLogo ? (
              <img 
                src={bowlingTeamLogo} 
                alt={bowlingTeamName} 
                className="w-9 h-9 rounded-full border border-white/30 bg-black/40 object-contain shrink-0 shadow"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

        </div>

      </div>

      {/* =========================================================================
          ENHANCEMENT 1: DYNAMIC ROTATING CONTEXT TICKER (LOWER INFO STRIP)
          ========================================================================= */}
      <div 
        id="star-tv-context-ticker"
        onMouseEnter={() => setIsTickerPaused(true)}
        onMouseLeave={() => setIsTickerPaused(false)}
        className="relative w-full min-h-[32px] sm:min-h-[34px] py-1 bg-slate-950/98 border-t border-white/15 border-b border-black/80 flex items-center justify-between px-3 sm:px-6 text-white font-mono text-xs shadow-lg backdrop-blur-xl transition-all"
      >
        {/* Left Badge: Category Indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className={`text-[9px] sm:text-[10.5px] font-black uppercase tracking-wider ${currentSlide?.categoryColor || 'text-amber-400'}`}>
            {currentSlide?.category}
          </span>
        </div>

        {/* Center Carousel Slide */}
        <div className="flex-1 mx-2 sm:mx-4 overflow-hidden text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeTickerIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-[10px] sm:text-[11.5px] font-bold tracking-wide truncate"
            >
              {currentSlide?.content}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 mr-1">
            {tickerSlides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => {
                  setTickerIndex(i);
                  setIsTickerPaused(true);
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  safeTickerIndex === i ? 'bg-amber-400 w-3.5' : 'bg-white/20 hover:bg-white/40 w-1.5'
                }`}
                title={slide.category}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setTickerIndex(prev => (prev - 1 + tickerSlides.length) % tickerSlides.length)}
            className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Previous Info Slide"
          >
            <ChevronLeft size={12} />
          </button>
          <button
            type="button"
            onClick={() => setTickerIndex(prev => (prev + 1) % tickerSlides.length)}
            className="w-5 h-5 rounded flex items-center justify-center bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Next Info Slide"
          >
            <ChevronRight size={12} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          ENHANCEMENT 6: BATTER MINI WAGON WHEEL POPUP MODAL
          ========================================================================= */}
      <AnimatePresence>
        {activeWagonBatter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-slate-950 border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden select-none"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold">
                    <Target size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase">
                      {activeWagonBatter === 'striker' ? strikerName : nonStrikerName} • SHOT RADAR
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {activeWagonBatter === 'striker' ? strikerRuns : nonStrikerRuns} runs ({activeWagonBatter === 'striker' ? strikerBalls : nonStrikerBalls}b) • SR {activeWagonBatter === 'striker' ? strikerSR : nonStrikerSR}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveWagonBatter(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Wagon Wheel SVG Graphic */}
              <div className="relative my-4 flex items-center justify-center">
                <svg viewBox="0 0 320 320" className="w-64 h-64 sm:w-72 sm:h-72">
                  {/* Outer Boundary Oval */}
                  <ellipse cx="160" cy="160" rx="145" ry="145" fill="#042f2e" stroke="#0d9488" strokeWidth="2.5" opacity="0.9" />
                  
                  {/* 30 Yard Inner Circle */}
                  <ellipse cx="160" cy="160" rx="90" ry="90" fill="none" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

                  {/* Cricket Pitch */}
                  <rect x="154" y="132" width="12" height="56" rx="2" fill="#ca8a04" stroke="#eab308" strokeWidth="1" opacity="0.9" />

                  {/* Crease line / Batsman spot */}
                  <line x1="150" y1="172" x2="170" y2="172" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="160" cy="172" r="3.5" fill="#38bdf8" />

                  {/* Shot Trajectory Rays */}
                  {(activeWagonBatter === 'striker' ? strikerWagonShots : nonStrikerWagonShots).map((shot, sIdx) => {
                    const rad = (shot.angle - 90) * (Math.PI / 180);
                    const length = shot.type === 'six' ? 142 : shot.type === 'four' ? 134 : shot.type === 'three' ? 100 : shot.type === 'two' ? 82 : 62;
                    const endX = 160 + length * Math.cos(rad);
                    const endY = 172 + length * Math.sin(rad);

                    const strokeColor = 
                      shot.type === 'six' ? '#fbbf24' :
                      shot.type === 'four' ? '#38bdf8' :
                      '#a7f3d0';

                    return (
                      <g key={`shot-${sIdx}`}>
                        <line 
                          x1="160" 
                          y1="172" 
                          x2={endX} 
                          y2={endY} 
                          stroke={strokeColor} 
                          strokeWidth={shot.type === 'six' ? 2.5 : shot.type === 'four' ? 2 : 1.2}
                          strokeLinecap="round"
                          opacity={0.85}
                        />
                        <circle cx={endX} cy={endY} r={shot.type === 'six' ? 3.5 : shot.type === 'four' ? 3 : 2} fill={strokeColor} />
                      </g>
                    );
                  })}

                  {/* Field Sector Labels */}
                  <text x="160" y="25" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">LONG-OFF / STRAIGHT</text>
                  <text x="290" y="165" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">COVER / POINT</text>
                  <text x="30" y="165" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">MID-WICKET</text>
                  <text x="160" y="305" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace" fontWeight="bold">FINE LEG</text>
                </svg>
              </div>

              {/* Legend & Stats Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold pt-3 border-t border-white/10">
                <div className="bg-sky-500/15 border border-sky-400/30 p-2 rounded-xl">
                  <span className="text-[10px] text-sky-300 block uppercase">Fours</span>
                  <span className="text-base text-white font-black">
                    {activeWagonBatter === 'striker' ? strikerFours : nonStrikerFours}
                  </span>
                </div>
                <div className="bg-amber-500/15 border border-amber-400/30 p-2 rounded-xl">
                  <span className="text-[10px] text-amber-300 block uppercase">Sixes</span>
                  <span className="text-base text-white font-black">
                    {activeWagonBatter === 'striker' ? strikerSixes : nonStrikerSixes}
                  </span>
                </div>
                <div className="bg-emerald-500/15 border border-emerald-400/30 p-2 rounded-xl">
                  <span className="text-[10px] text-emerald-300 block uppercase">Off/Leg Split</span>
                  <span className="text-sm text-white font-black">58% / 42%</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
