// TournamentPointsCalculator.ts
// Standard ICC, Cricbuzz & CricHeroes Tournament Hierarchy, Dynamic Points Table, and NRR Engine

export type TieBreakerRule = 'icc_standard' | 'head_to_head_first';

export interface HeadToHeadSummary {
  teamAId: string;
  teamBId: string;
  played: number;
  winsA: number;
  winsB: number;
  ties: number;
  noResults: number;
  matches: {
    matchId: string;
    stage?: string;
    winnerId: string | null;
    winnerName?: string;
    margin?: string;
    scoreA: string;
    scoreB: string;
    date?: string;
  }[];
}

export interface QualificationBadge {
  code: 'Q' | 'E' | 'TOP2' | 'CONT';
  label: string;
  color: string; // Tailwind class identifier
  description: string;
}

export interface QualificationMath {
  remainingMatches: number;
  maxPossiblePoints: number;
  minPossiblePoints: number;
  magicNumber?: number | null; // Wins needed to guarantee playoff qualification
  summary: string;
}

export interface StandingsTeamStats {
  id: string;
  name: string;
  shortName?: string;
  captain?: string;
  logo?: string;
  logoColor?: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  runsScored: number;
  runsConceded: number;
  oversFacedDecimal: number;
  oversBowledDecimal: number;
  oversFacedDisplay: string;
  oversBowledDisplay: string;
  forRunRate: number;
  againstRunRate: number;
  NRR: number;
  streak?: string[]; // e.g. ['W', 'W', 'L', 'W']
  qualificationStatus?: 'qualified' | 'eliminated' | 'contention' | 'top2_secured' | 'champion' | 'runner_up';
  qualificationBadge?: QualificationBadge;
  qualificationMath?: QualificationMath;
  tiebreakReason?: string;
  h2hSummaryAgainstOthers?: Record<string, { played: number; won: number; lost: number; tied: number }>;
  formGuide?: ('W' | 'L' | 'T' | 'NR')[];
  matchHistory?: { 
    matchId: string; 
    result: 'W' | 'L' | 'T' | 'NR'; 
    opponentName: string; 
    opponentId?: string;
    scoreSummary: string; 
    date?: string;
    stage?: string;
    margin?: string;
  }[];
}

export interface MatchScoreInput {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  status: 'scheduled' | 'live' | 'completed';
  scoreA: string; // e.g. "185/4" or "185"
  scoreB: string; // e.g. "172/9" or "172"
  oversA: string | number; // e.g. "20" or "19.4" or 20
  oversB: string | number; // e.g. "20" or "20.0"
  winnerId: string | null;
  winner?: string | null;
  winReason?: string;
  stage?: string; // 'League', 'League Stage', 'Group Stage', 'Group A', 'Quarter-Final', 'Semi-Final', 'Final'
  allOutA?: boolean; // if team was bowled all out, full quota of overs is applied
  allOutB?: boolean;
  date?: string;
}

export interface PointsSystemRules {
  pointsForWin: number;
  pointsForTie: number;
  pointsForNoResult: number;
  pointsForLoss: number;
  standardOversQuota: number; // default e.g. 20 for T20, 10 for Box, 50 for ODI
  qualifyingSpots: number; // e.g. top 4 for playoffs
  tieBreakerRule?: TieBreakerRule; // 'icc_standard' (Pts > W > NRR > H2H) vs 'head_to_head_first' (Pts > H2H > W > NRR)
}

export const DEFAULT_POINTS_RULES: PointsSystemRules = {
  pointsForWin: 2,
  pointsForTie: 1,
  pointsForNoResult: 1,
  pointsForLoss: 0,
  standardOversQuota: 20,
  qualifyingSpots: 4,
  tieBreakerRule: 'icc_standard',
};

/**
 * Converts cricket overs notation (e.g. 19.4 for 19 overs 4 balls) to exact decimal representation (19 + 4/6 = 19.6667).
 * Handles string input ("19.4", "20", "15.5") and numeric input (19.4, 20).
 */
export function convertOversToDecimal(oversInput: string | number | undefined | null): number {
  if (oversInput === undefined || oversInput === null || oversInput === '') return 0;
  
  const str = oversInput.toString().trim();
  const parts = str.split('.');
  
  if (parts.length === 2) {
    const completedOvers = parseInt(parts[0], 10) || 0;
    const balls = parseInt(parts[1], 10) || 0;
    const normalizedBalls = Math.min(Math.max(balls, 0), 5); // 0 to 5 balls
    return completedOvers + (normalizedBalls / 6);
  }
  
  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  
  const completed = Math.floor(num);
  const fractional = Math.round((num - completed) * 10);
  if (fractional > 0 && fractional <= 5) {
    return completed + (fractional / 6);
  }
  return num;
}

/**
 * Converts exact decimal overs back to cricket standard notation display string (e.g. 19.6667 => "19.4 ov").
 */
export function formatDecimalToOversDisplay(decimalOvers: number): string {
  if (!decimalOvers || isNaN(decimalOvers) || decimalOvers <= 0) return '0.0 ov';
  const totalBalls = Math.round(decimalOvers * 6);
  const overs = Math.floor(totalBalls / 6);
  const balls = totalBalls % 6;
  return `${overs}.${balls} ov`;
}

/**
 * Parses total runs scored and whether team was all out from a score string like "185/10", "185/4", or "185".
 */
export function parseScoreDetails(scoreStr: string | undefined | null): { runs: number; wickets: number; isAllOut: boolean } {
  if (!scoreStr) return { runs: 0, wickets: 0, isAllOut: false };
  const cleaned = scoreStr.toString().trim();
  
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    const runs = parseInt(parts[0], 10) || 0;
    const wickets = parseInt(parts[1], 10) || 0;
    return {
      runs,
      wickets,
      isAllOut: wickets >= 10,
    };
  }
  
  const runs = parseInt(cleaned, 10) || 0;
  return { runs, wickets: 0, isAllOut: false };
}

/**
 * Helper to determine if a stage is a knockout / playoff stage that should NOT be part of group/league standings
 */
export const isKnockoutStage = (stage?: string) => {
  if (!stage) return false;
  const s = stage.toLowerCase().trim();
  return (
    s.includes('semi-final') ||
    s.includes('semifinal') ||
    s.includes('semi final') ||
    s.includes('quarter-final') ||
    s.includes('quarterfinal') ||
    s.includes('quarter final') ||
    s.includes('eliminator') ||
    s.includes('elimination bracket') ||
    s.includes('qualifier 1') ||
    s.includes('qualifier 2') ||
    s.includes('playoff') ||
    s.includes('knockout') ||
    s === 'final' ||
    s === 'finals' ||
    s.endsWith(' final')
  );
};

/**
 * Helper to determine if a match has finished
 */
export const isMatchFinished = (m: MatchScoreInput) => {
  if (m.status === 'completed') return true;
  if (m.winnerId && m.winnerId !== 'scheduled' && m.winnerId !== '') return true;
  if (m.winner && m.winner !== 'scheduled' && m.winner !== '') return true;
  if (m.winReason && !m.winReason.toLowerCase().includes('scheduled')) return true;
  const sA = parseScoreDetails(m.scoreA);
  const sB = parseScoreDetails(m.scoreB);
  if (sA.runs > 0 && sB.runs > 0 && (sA.isAllOut || sB.isAllOut || m.oversA || m.oversB)) return true;
  return false;
};

/**
 * Constructs a pairwise Head-to-Head matrix of all matches between all pairs of teams.
 * Used for Cricbuzz & CricHeroes cross-table matrix and dynamic tiebreaking.
 */
export function buildHeadToHeadMatrix(
  teams: { id: string; name: string }[],
  matches: MatchScoreInput[]
): Record<string, Record<string, HeadToHeadSummary>> {
  const matrix: Record<string, Record<string, HeadToHeadSummary>> = {};

  teams.forEach(t1 => {
    matrix[t1.id] = {};
    teams.forEach(t2 => {
      if (t1.id !== t2.id) {
        matrix[t1.id][t2.id] = {
          teamAId: t1.id,
          teamBId: t2.id,
          played: 0,
          winsA: 0,
          winsB: 0,
          ties: 0,
          noResults: 0,
          matches: [],
        };
      }
    });
  });

  const completedMatches = matches.filter(m => isMatchFinished(m) && !isKnockoutStage(m.stage));

  completedMatches.forEach(m => {
    const tA = teams.find(t => t.id === m.teamAId || t.name.toLowerCase().trim() === m.teamAName?.toLowerCase().trim());
    const tB = teams.find(t => t.id === m.teamBId || t.name.toLowerCase().trim() === m.teamBName?.toLowerCase().trim());

    if (!tA || !tB || tA.id === tB.id) return;

    if (!matrix[tA.id]) matrix[tA.id] = {};
    if (!matrix[tB.id]) matrix[tB.id] = {};

    if (!matrix[tA.id][tB.id]) {
      matrix[tA.id][tB.id] = {
        teamAId: tA.id,
        teamBId: tB.id,
        played: 0,
        winsA: 0,
        winsB: 0,
        ties: 0,
        noResults: 0,
        matches: [],
      };
    }
    if (!matrix[tB.id][tA.id]) {
      matrix[tB.id][tA.id] = {
        teamAId: tB.id,
        teamBId: tA.id,
        played: 0,
        winsA: 0,
        winsB: 0,
        ties: 0,
        noResults: 0,
        matches: [],
      };
    }

    const sA = parseScoreDetails(m.scoreA);
    const sB = parseScoreDetails(m.scoreB);

    const isNoResult = m.winReason?.toLowerCase().includes('no result') || m.winReason?.toLowerCase().includes('abandoned');
    const isTie = m.winnerId === 'tie' || m.winner?.toLowerCase() === 'tie' || m.winReason?.toLowerCase().includes('tie') || (!m.winnerId && !m.winner && sA.runs === sB.runs && sA.runs > 0);

    const normAName = (m.teamAName || tA.name).toLowerCase().trim();
    const isWinnerA = !isNoResult && !isTie && (
      m.winnerId === tA.id || 
      m.winnerId === m.teamAId || 
      (m.winner || '').toLowerCase().trim() === normAName ||
      (m.winReason && m.winReason.toLowerCase().includes(normAName) && !m.winReason.toLowerCase().includes((m.teamBName || tB.name).toLowerCase().trim())) ||
      (!m.winnerId && !m.winner && sA.runs > sB.runs)
    );

    const isWinnerB = !isNoResult && !isTie && !isWinnerA && (
      m.winnerId === tB.id || 
      m.winnerId === m.teamBId || 
      (m.winner || '').toLowerCase().trim() === (m.teamBName || tB.name).toLowerCase().trim() ||
      (!m.winnerId && !m.winner && sB.runs > sA.runs)
    );

    const matchRecordA = {
      matchId: m.id,
      stage: m.stage,
      winnerId: isWinnerA ? tA.id : isWinnerB ? tB.id : null,
      winnerName: isWinnerA ? tA.name : isWinnerB ? tB.name : undefined,
      margin: m.winReason,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      date: m.date,
    };

    // Update A vs B
    const recAB = matrix[tA.id][tB.id];
    recAB.played += 1;
    if (isNoResult) recAB.noResults += 1;
    else if (isTie) recAB.ties += 1;
    else if (isWinnerA) recAB.winsA += 1;
    else if (isWinnerB) recAB.winsB += 1;
    recAB.matches.push(matchRecordA);

    // Update B vs A (symmetric)
    const recBA = matrix[tB.id][tA.id];
    recBA.played += 1;
    if (isNoResult) recBA.noResults += 1;
    else if (isTie) recBA.ties += 1;
    else if (isWinnerA) recBA.winsB += 1; // From B's perspective, winsB is opponent wins
    else if (isWinnerB) recBA.winsA += 1; // From B's perspective, winsA is B's wins
    recBA.matches.push({
      matchId: m.id,
      stage: m.stage,
      winnerId: isWinnerA ? tA.id : isWinnerB ? tB.id : null,
      winnerName: isWinnerA ? tA.name : isWinnerB ? tB.name : undefined,
      margin: m.winReason,
      scoreA: m.scoreB,
      scoreB: m.scoreA,
      date: m.date,
    });
  });

  return matrix;
}

/**
 * Head-to-head tiebreak comparator between two teams
 */
export function getHeadToHeadAdvantage(
  teamAId: string,
  teamBId: string,
  matrix: Record<string, Record<string, HeadToHeadSummary>>
): { advantage: 'A' | 'B' | 'TIE' | 'NONE'; reason: string } {
  const h2h = matrix[teamAId]?.[teamBId];
  if (!h2h || h2h.played === 0) {
    return { advantage: 'NONE', reason: 'No head-to-head match played yet' };
  }

  if (h2h.winsA > h2h.winsB) {
    const lastWin = h2h.matches.find(m => m.winnerId === teamAId);
    return {
      advantage: 'A',
      reason: `Head-to-head advantage (${h2h.winsA} - ${h2h.winsB})${lastWin?.margin ? `: ${lastWin.margin}` : ''}`,
    };
  }

  if (h2h.winsB > h2h.winsA) {
    const lastWin = h2h.matches.find(m => m.winnerId === teamBId);
    return {
      advantage: 'B',
      reason: `Head-to-head advantage (${h2h.winsB} - ${h2h.winsA})${lastWin?.margin ? `: ${lastWin.margin}` : ''}`,
    };
  }

  return { advantage: 'TIE', reason: `Head-to-head level (${h2h.winsA} - ${h2h.winsB})` };
}

/**
 * Master calculation of tournament points table with accurate ICC Net Run Rate rules
 * and advanced Cricbuzz/CricHeroes dynamic tiebreaker hierarchy.
 */
export function calculateTournamentStandings(
  teams: { id: string; name: string; captain?: string; logo?: string; shortName?: string }[],
  matches: MatchScoreInput[],
  rules: Partial<PointsSystemRules> = {}
): StandingsTeamStats[] {
  const mergedRules: PointsSystemRules = {
    ...DEFAULT_POINTS_RULES,
    ...rules,
  };

  const table: Record<string, StandingsTeamStats> = {};

  // Initialize stats for each team
  teams.forEach(t => {
    const short = t.shortName || t.name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
    table[t.id] = {
      id: t.id,
      name: t.name,
      shortName: short,
      captain: t.captain || '',
      logo: t.logo || '',
      played: 0,
      won: 0,
      lost: 0,
      tied: 0,
      noResult: 0,
      points: 0,
      runsScored: 0,
      runsConceded: 0,
      oversFacedDecimal: 0,
      oversBowledDecimal: 0,
      oversFacedDisplay: '0.0 ov',
      oversBowledDisplay: '0.0 ov',
      forRunRate: 0,
      againstRunRate: 0,
      NRR: 0,
      streak: [],
      formGuide: [],
      matchHistory: [],
      h2hSummaryAgainstOthers: {},
      qualificationStatus: 'contention',
    };
  });

  // Build Head-to-Head matrix for tiebreaker calculations
  const h2hMatrix = buildHeadToHeadMatrix(teams, matches);

  // Filter completed league/group stage matches
  const completedLeagueMatches = matches.filter(
    m => isMatchFinished(m) && !isKnockoutStage(m.stage)
  );

  completedLeagueMatches.forEach(m => {
    const tA = table[m.teamAId] || Object.values(table).find(t => 
      t.name.toLowerCase().trim() === m.teamAName?.toLowerCase().trim() ||
      (t.shortName && m.teamAName && t.shortName.toLowerCase().trim() === m.teamAName?.toLowerCase().trim())
    );
    const tB = table[m.teamBId] || Object.values(table).find(t => 
      t.name.toLowerCase().trim() === m.teamBName?.toLowerCase().trim() ||
      (t.shortName && m.teamBName && t.shortName.toLowerCase().trim() === m.teamBName?.toLowerCase().trim())
    );

    if (!tA || !tB) return;

    tA.played += 1;
    tB.played += 1;

    // Parse scores and wickets
    const scoreAInfo = parseScoreDetails(m.scoreA);
    const scoreBInfo = parseScoreDetails(m.scoreB);

    const runsA = scoreAInfo.runs;
    const runsB = scoreBInfo.runs;

    // Standard overs quota for NRR: if all-out, team faces full allotted overs quota
    const allottedOvers = mergedRules.standardOversQuota;

    let oversFacedA = convertOversToDecimal(m.oversA) || allottedOvers;
    let oversFacedB = convertOversToDecimal(m.oversB) || allottedOvers;

    // ICC Cricket Rule: If team is bowled out, full quota of overs applies to their run rate calculation!
    if (scoreAInfo.isAllOut || m.allOutA) {
      oversFacedA = allottedOvers;
    }
    if (scoreBInfo.isAllOut || m.allOutB) {
      oversFacedB = allottedOvers;
    }

    // Accumulate runs and overs
    tA.runsScored += runsA;
    tA.runsConceded += runsB;
    tA.oversFacedDecimal += oversFacedA;
    tA.oversBowledDecimal += oversFacedB;

    tB.runsScored += runsB;
    tB.runsConceded += runsA;
    tB.oversFacedDecimal += oversFacedB;
    tB.oversBowledDecimal += oversFacedA;

    // Win/Loss/Tie resolution
    const isNoResult = m.winReason?.toLowerCase().includes('no result') || m.winReason?.toLowerCase().includes('abandoned');
    const isExplicitTie = m.winnerId === 'tie' || 
      m.winner?.toLowerCase() === 'tie' || 
      m.winReason?.toLowerCase().includes('tie') || 
      (!m.winnerId && !m.winner && runsA === runsB && runsA > 0);
    
    tA.matchHistory = tA.matchHistory || [];
    tB.matchHistory = tB.matchHistory || [];

    const winnerIdent = (m.winner || '').toLowerCase().trim();
    const winnerIdVal = m.winnerId || '';
    const normAName = (m.teamAName || tA.name || '').toLowerCase().trim();
    const normBName = (m.teamBName || tB.name || '').toLowerCase().trim();

    const isWinnerA = !isNoResult && !isExplicitTie && (
      winnerIdVal === tA.id || 
      winnerIdVal === m.teamAId ||
      winnerIdent === tA.name.toLowerCase().trim() ||
      winnerIdent === normAName ||
      (m.winReason && (
        m.winReason.toLowerCase().includes(tA.name.toLowerCase().trim()) || 
        m.winReason.toLowerCase().includes(normAName)
      ) && !m.winReason.toLowerCase().includes(tB.name.toLowerCase().trim()) && !m.winReason.toLowerCase().includes(normBName)) ||
      (!winnerIdVal && !winnerIdent && runsA > runsB)
    );

    const isWinnerB = !isNoResult && !isExplicitTie && !isWinnerA && (
      winnerIdVal === tB.id || 
      winnerIdVal === m.teamBId || 
      winnerIdent === tB.name.toLowerCase().trim() ||
      winnerIdent === normBName ||
      (m.winReason && (
        m.winReason.toLowerCase().includes(tB.name.toLowerCase().trim()) || 
        m.winReason.toLowerCase().includes(normBName)
      ) && !m.winReason.toLowerCase().includes(tA.name.toLowerCase().trim()) && !m.winReason.toLowerCase().includes(normAName)) ||
      (!winnerIdVal && !winnerIdent && runsB > runsA)
    );

    if (isNoResult) {
      tA.noResult += 1;
      tB.noResult += 1;
      tA.points += mergedRules.pointsForNoResult;
      tB.points += mergedRules.pointsForNoResult;
      tA.streak?.push('NR');
      tB.streak?.push('NR');
      tA.formGuide?.push('NR');
      tB.formGuide?.push('NR');
      tA.matchHistory.push({ matchId: m.id, result: 'NR', opponentName: m.teamBName || tB.name, opponentId: tB.id, scoreSummary: `${m.scoreA} vs ${m.scoreB}`, date: m.date, stage: m.stage, margin: m.winReason });
      tB.matchHistory.push({ matchId: m.id, result: 'NR', opponentName: m.teamAName || tA.name, opponentId: tA.id, scoreSummary: `${m.scoreB} vs ${m.scoreA}`, date: m.date, stage: m.stage, margin: m.winReason });
    } else if (isWinnerA) {
      tA.won += 1;
      tA.points += mergedRules.pointsForWin;
      tB.lost += 1;
      tB.points += mergedRules.pointsForLoss;
      tA.streak?.push('W');
      tB.streak?.push('L');
      tA.formGuide?.push('W');
      tB.formGuide?.push('L');
      tA.matchHistory.push({ matchId: m.id, result: 'W', opponentName: m.teamBName || tB.name, opponentId: tB.id, scoreSummary: `${m.scoreA} vs ${m.scoreB}`, date: m.date, stage: m.stage, margin: m.winReason });
      tB.matchHistory.push({ matchId: m.id, result: 'L', opponentName: m.teamAName || tA.name, opponentId: tA.id, scoreSummary: `${m.scoreB} vs ${m.scoreA}`, date: m.date, stage: m.stage, margin: m.winReason });
    } else if (isWinnerB) {
      tB.won += 1;
      tB.points += mergedRules.pointsForWin;
      tA.lost += 1;
      tA.points += mergedRules.pointsForLoss;
      tB.streak?.push('W');
      tA.streak?.push('L');
      tB.formGuide?.push('W');
      tA.formGuide?.push('L');
      tB.matchHistory.push({ matchId: m.id, result: 'W', opponentName: m.teamAName || tA.name, opponentId: tA.id, scoreSummary: `${m.scoreB} vs ${m.scoreA}`, date: m.date, stage: m.stage, margin: m.winReason });
      tA.matchHistory.push({ matchId: m.id, result: 'L', opponentName: m.teamBName || tB.name, opponentId: tB.id, scoreSummary: `${m.scoreA} vs ${m.scoreB}`, date: m.date, stage: m.stage, margin: m.winReason });
    } else {
      // Tie
      tA.tied += 1;
      tB.tied += 1;
      tA.points += mergedRules.pointsForTie;
      tB.points += mergedRules.pointsForTie;
      tA.streak?.push('T');
      tB.streak?.push('T');
      tA.formGuide?.push('T');
      tB.formGuide?.push('T');
      tA.matchHistory.push({ matchId: m.id, result: 'T', opponentName: m.teamBName || tB.name, opponentId: tB.id, scoreSummary: `${m.scoreA} vs ${m.scoreB}`, date: m.date, stage: m.stage, margin: m.winReason });
      tB.matchHistory.push({ matchId: m.id, result: 'T', opponentName: m.teamAName || tA.name, opponentId: tA.id, scoreSummary: `${m.scoreB} vs ${m.scoreA}`, date: m.date, stage: m.stage, margin: m.winReason });
    }
  });

  // Calculate NRR, format overs and attach H2H for all teams
  const standings = Object.values(table).map(t => {
    const forRate = t.oversFacedDecimal > 0 ? (t.runsScored / t.oversFacedDecimal) : 0;
    const againstRate = t.oversBowledDecimal > 0 ? (t.runsConceded / t.oversBowledDecimal) : 0;
    const nrr = Number((forRate - againstRate).toFixed(3));

    // Compile quick H2H stats against every other team
    const h2hSummary: Record<string, { played: number; won: number; lost: number; tied: number }> = {};
    Object.keys(table).forEach(otherId => {
      if (otherId !== t.id) {
        const h = h2hMatrix[t.id]?.[otherId];
        if (h && h.played > 0) {
          h2hSummary[otherId] = {
            played: h.played,
            won: h.winsA,
            lost: h.winsB,
            tied: h.ties,
          };
        }
      }
    });

    return {
      ...t,
      forRunRate: Number(forRate.toFixed(3)),
      againstRunRate: Number(againstRate.toFixed(3)),
      NRR: isNaN(nrr) ? 0 : nrr,
      oversFacedDisplay: formatDecimalToOversDisplay(t.oversFacedDecimal),
      oversBowledDisplay: formatDecimalToOversDisplay(t.oversBowledDecimal),
      formGuide: (t.formGuide || []).slice(-5), // last 5 results
      h2hSummaryAgainstOthers: h2hSummary,
    };
  });

  // Multi-tier Tiebreaker sorting
  const tieRule = mergedRules.tieBreakerRule || 'icc_standard';

  standings.sort((a, b) => {
    // 1. Primary: Points (descending)
    if (b.points !== a.points) return b.points - a.points;

    if (tieRule === 'head_to_head_first') {
      // Grassroots / CricHeroes Mode: Points -> Head to Head -> Wins -> NRR
      const h2hAdv = getHeadToHeadAdvantage(a.id, b.id, h2hMatrix);
      if (h2hAdv.advantage === 'A') return -1;
      if (h2hAdv.advantage === 'B') return 1;

      // Secondary: Wins
      if (b.won !== a.won) return b.won - a.won;

      // Tertiary: NRR
      if (b.NRR !== a.NRR) return b.NRR - a.NRR;
    } else {
      // ICC / Cricbuzz Standard Mode: Points -> Wins -> NRR -> Head to Head -> Runs Scored
      // 2. Secondary: Wins (descending)
      if (b.won !== a.won) return b.won - a.won;

      // 3. Tertiary: Net Run Rate (descending)
      if (b.NRR !== a.NRR) return b.NRR - a.NRR;

      // 4. Quaternary: Head-to-Head between the tied pair
      const h2hAdv = getHeadToHeadAdvantage(a.id, b.id, h2hMatrix);
      if (h2hAdv.advantage === 'A') return -1;
      if (h2hAdv.advantage === 'B') return 1;
    }

    // 5. Higher total runs scored
    if (b.runsScored !== a.runsScored) return b.runsScored - a.runsScored;

    // 6. Alphabetical
    return a.name.localeCompare(b.name);
  });

  // Calculate dynamic tie-breaker explanations for adjacent teams with identical points
  for (let i = 0; i < standings.length; i++) {
    const current = standings[i];
    const prev = standings[i - 1];
    const next = standings[i + 1];

    if (next && next.points === current.points) {
      if (current.won !== next.won) {
        current.tiebreakReason = `Ahead of ${next.shortName || next.name} on Wins (${current.won} vs ${next.won})`;
      } else if (tieRule === 'head_to_head_first') {
        const adv = getHeadToHeadAdvantage(current.id, next.id, h2hMatrix);
        if (adv.advantage === 'A') {
          current.tiebreakReason = `Ahead of ${next.shortName || next.name} via Head-to-Head`;
        } else if (current.NRR !== next.NRR) {
          current.tiebreakReason = `Ahead of ${next.shortName || next.name} on NRR (${current.NRR > 0 ? '+' : ''}${current.NRR.toFixed(3)} vs ${next.NRR > 0 ? '+' : ''}${next.NRR.toFixed(3)})`;
        }
      } else if (current.NRR !== next.NRR) {
        current.tiebreakReason = `Ahead of ${next.shortName || next.name} on NRR (${current.NRR > 0 ? '+' : ''}${current.NRR.toFixed(3)} vs ${next.NRR > 0 ? '+' : ''}${next.NRR.toFixed(3)})`;
      } else {
        const adv = getHeadToHeadAdvantage(current.id, next.id, h2hMatrix);
        if (adv.advantage === 'A') {
          current.tiebreakReason = `Ahead of ${next.shortName || next.name} via Head-to-Head win`;
        } else if (current.runsScored !== next.runsScored) {
          current.tiebreakReason = `Ahead on total runs scored (${current.runsScored} vs ${next.runsScored})`;
        }
      }
    } else if (prev && prev.points === current.points) {
      current.tiebreakReason = `Level on points with ${prev.shortName || prev.name}`;
    }
  }

  // Cricbuzz & CricHeroes True Mathematical Qualification Engine
  // Computes remaining matches, maximum possible points, and realistic qualification tags
  const qualSpots = mergedRules.qualifyingSpots;
  const totalLeagueMatchesPerTeam: Record<string, number> = {};

  // Count scheduled / remaining league matches per team
  const scheduledLeagueMatches = matches.filter(m => m.status === 'scheduled' && !isKnockoutStage(m.stage));

  teams.forEach(t => {
    const remainingCount = scheduledLeagueMatches.filter(m => 
      m.teamAId === t.id || 
      m.teamBId === t.id ||
      m.teamAName?.toLowerCase().trim() === t.name.toLowerCase().trim() ||
      m.teamBName?.toLowerCase().trim() === t.name.toLowerCase().trim()
    ).length;

    totalLeagueMatchesPerTeam[t.id] = remainingCount;
  });

  // Calculate qualification status
  standings.forEach((team, idx) => {
    const remaining = totalLeagueMatchesPerTeam[team.id] ?? Math.max(teams.length - 1 - team.played, 0);
    const maxPoints = team.points + (remaining * mergedRules.pointsForWin);
    const minPoints = team.points;

    // Thresholds
    // Cutoff team is the team currently in the last qualification spot (spot K-1 in 0-indexed)
    const cutoffIndex = Math.min(qualSpots - 1, standings.length - 1);
    const cutoffTeam = standings[cutoffIndex];
    const cutoffCurrentPoints = cutoffTeam ? cutoffTeam.points : 0;

    // The team just outside the playoffs (spot K)
    const bubbleTeam = standings[qualSpots];
    const bubbleMaxPoints = bubbleTeam ? (bubbleTeam.points + ((totalLeagueMatchesPerTeam[bubbleTeam.id] ?? 0) * mergedRules.pointsForWin)) : 0;

    // The team in 3rd place (for top 2 lock calculations)
    const thirdPlaceTeam = standings[2];
    const thirdPlaceMaxPoints = thirdPlaceTeam ? (thirdPlaceTeam.points + ((totalLeagueMatchesPerTeam[thirdPlaceTeam.id] ?? 0) * mergedRules.pointsForWin)) : 0;

    let status: 'qualified' | 'eliminated' | 'contention' | 'top2_secured' = 'contention';
    let badge: QualificationBadge;
    let magicNumber: number | null = null;
    let summary = '';

    // Has tournament started? (At least 1 match played overall)
    const hasAnyPlayed = standings.some(s => s.played > 0);

    if (!hasAnyPlayed) {
      status = 'contention';
      badge = {
        code: 'CONT',
        label: 'In Race',
        color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
        description: 'Tournament yet to start',
      };
      summary = `${remaining} matches remaining`;
    } else if (remaining === 0) {
      // Completed all matches
      if (idx < qualSpots) {
        status = idx < 2 ? 'top2_secured' : 'qualified';
        badge = {
          code: idx < 2 ? 'TOP2' : 'Q',
          label: idx < 2 ? 'Top 2 Locked' : 'Qualified',
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
          description: 'League fixtures concluded in qualification spot',
        };
        summary = 'Finished in playoff spots';
      } else {
        status = 'eliminated';
        badge = {
          code: 'E',
          label: 'Eliminated',
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
          description: 'All league matches concluded outside top spots',
        };
        summary = 'Concluded outside playoff bracket';
      }
    } else {
      // Team still has matches to play
      // 1. Check if mathematically eliminated: Max possible points is strictly lower than cutoff team's current points
      if (maxPoints < cutoffCurrentPoints && idx >= qualSpots) {
        status = 'eliminated';
        badge = {
          code: 'E',
          label: 'Eliminated',
          color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
          description: 'Cannot mathematically reach the qualification threshold',
        };
        summary = `Max ${maxPoints} pts cannot overtake cutoff (${cutoffCurrentPoints} pts)`;
      } 
      // 2. Check if guaranteed Top 2
      else if (idx < 2 && thirdPlaceTeam && minPoints > thirdPlaceMaxPoints) {
        status = 'top2_secured';
        badge = {
          code: 'TOP2',
          label: 'Top 2 (Q1)',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
          description: 'Guaranteed top 2 finish — advances to Qualifier 1',
        };
        summary = 'Top 2 playoff berth locked';
      }
      // 3. Check if guaranteed qualified (cannot be passed by enough lower teams)
      else if (bubbleTeam && minPoints > bubbleMaxPoints && idx < qualSpots) {
        status = 'qualified';
        badge = {
          code: 'Q',
          label: 'Qualified',
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
          description: 'Guaranteed playoff qualification spot',
        };
        summary = 'Playoff berth secured';
      }
      // 4. In Contention: compute magic number
      else {
        status = 'contention';
        const pointsDiffToLock = Math.max(0, (bubbleMaxPoints + 1) - team.points);
        const winsNeeded = Math.ceil(pointsDiffToLock / mergedRules.pointsForWin);
        magicNumber = winsNeeded <= remaining && winsNeeded > 0 ? winsNeeded : null;

        badge = {
          code: 'CONT',
          label: 'In Race',
          color: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
          description: `${remaining} match${remaining > 1 ? 'es' : ''} left • Max ${maxPoints} pts`,
        };

        if (magicNumber && magicNumber <= remaining) {
          summary = `Need ${magicNumber} win${magicNumber > 1 ? 's' : ''} from ${remaining} to lock qualification`;
        } else {
          summary = `${remaining} match${remaining > 1 ? 'es' : ''} left (Max: ${maxPoints} pts)`;
        }
      }
    }

    team.qualificationStatus = status;
    team.qualificationBadge = badge;
    team.qualificationMath = {
      remainingMatches: remaining,
      maxPossiblePoints: maxPoints,
      minPossiblePoints: minPoints,
      magicNumber,
      summary,
    };
  });

  return standings;
}
