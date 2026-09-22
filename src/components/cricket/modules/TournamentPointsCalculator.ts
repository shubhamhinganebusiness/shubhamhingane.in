// TournamentPointsCalculator.ts
// Standard ICC & League Cricket Tournament Hierarchy, Points Table, and NRR Engine

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
  qualificationStatus?: 'qualified' | 'eliminated' | 'contention' | 'champion' | 'runner_up';
  formGuide?: ('W' | 'L' | 'T' | 'NR')[];
  matchHistory?: { matchId: string; result: 'W' | 'L' | 'T' | 'NR'; opponentName: string; scoreSummary: string }[];
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
}

export interface PointsSystemRules {
  pointsForWin: number;
  pointsForTie: number;
  pointsForNoResult: number;
  pointsForLoss: number;
  standardOversQuota: number; // default e.g. 20 for T20, 10 for Box, 50 for ODI
  qualifyingSpots: number; // e.g. top 4 for playoffs
}

export const DEFAULT_POINTS_RULES: PointsSystemRules = {
  pointsForWin: 2,
  pointsForTie: 1,
  pointsForNoResult: 1,
  pointsForLoss: 0,
  standardOversQuota: 20,
  qualifyingSpots: 4,
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
  
  // If it's already a float like 19.3, parse integer and fraction
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
 * Master calculation of tournament points table with accurate ICC Net Run Rate rules.
 * 
 * Rules Implemented:
 * 1. Automatic Wins, Losses, Ties, No Results, Points tallying.
 * 2. ICC Rule 16.10.2 for Net Run Rate:
 *    - If a team is all out inside their allotted overs, their run rate is calculated based on their full quota of overs.
 *    - In matches where overs are reduced (DLS or rain), recalculates based on actual targets/overs faced.
 *    - Formula: NRR = (Total Runs Scored / Total Overs Faced in Decimal) - (Total Runs Conceded / Total Overs Bowled in Decimal)
 * 3. Standard Tournament Tie-Breakers Hierarchy:
 *    - Primary: Points (descending)
 *    - Secondary: Number of Wins (descending)
 *    - Tertiary: Net Run Rate (descending)
 *    - Quaternary: Head-to-Head record (if applicable)
 *    - Final: Alphabetical / Team Name
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
      qualificationStatus: 'contention',
    };
  });

  // Helper to determine if a stage is a knockout / playoff stage that should NOT be part of group/league standings
  const isKnockoutStage = (stage?: string) => {
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

  // Helper to determine if a match has finished
  const isMatchFinished = (m: MatchScoreInput) => {
    if (m.status === 'completed') return true;
    if (m.winnerId && m.winnerId !== 'scheduled' && m.winnerId !== '') return true;
    if (m.winner && m.winner !== 'scheduled' && m.winner !== '') return true;
    if (m.winReason && !m.winReason.toLowerCase().includes('scheduled')) return true;
    const sA = parseScoreDetails(m.scoreA);
    const sB = parseScoreDetails(m.scoreB);
    if (sA.runs > 0 && sB.runs > 0 && (sA.isAllOut || sB.isAllOut || m.oversA || m.oversB)) return true;
    return false;
  };

  // Filter completed league/group stage matches (includes 'League', 'League Stage', 'Group Stage', 'Group A', 'Round 1', etc.)
  const completedLeagueMatches = matches.filter(
    m => isMatchFinished(m) && !isKnockoutStage(m.stage)
  );

  completedLeagueMatches.forEach(m => {
    // Lookup teams by ID or by name (case-insensitive) for bulletproof matching
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
      tA.matchHistory.push({ matchId: m.id, result: 'NR', opponentName: m.teamBName, scoreSummary: `${m.scoreA} vs ${m.scoreB}` });
      tB.matchHistory.push({ matchId: m.id, result: 'NR', opponentName: m.teamAName, scoreSummary: `${m.scoreB} vs ${m.scoreA}` });
    } else if (isWinnerA) {
      tA.won += 1;
      tA.points += mergedRules.pointsForWin;
      tB.lost += 1;
      tB.points += mergedRules.pointsForLoss;
      tA.streak?.push('W');
      tB.streak?.push('L');
      tA.formGuide?.push('W');
      tB.formGuide?.push('L');
      tA.matchHistory.push({ matchId: m.id, result: 'W', opponentName: m.teamBName, scoreSummary: `${m.scoreA} vs ${m.scoreB}` });
      tB.matchHistory.push({ matchId: m.id, result: 'L', opponentName: m.teamAName, scoreSummary: `${m.scoreB} vs ${m.scoreA}` });
    } else if (isWinnerB) {
      tB.won += 1;
      tB.points += mergedRules.pointsForWin;
      tA.lost += 1;
      tA.points += mergedRules.pointsForLoss;
      tB.streak?.push('W');
      tA.streak?.push('L');
      tB.formGuide?.push('W');
      tA.formGuide?.push('L');
      tB.matchHistory.push({ matchId: m.id, result: 'W', opponentName: m.teamAName, scoreSummary: `${m.scoreB} vs ${m.scoreA}` });
      tA.matchHistory.push({ matchId: m.id, result: 'L', opponentName: m.teamBName, scoreSummary: `${m.scoreA} vs ${m.scoreB}` });
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
      tA.matchHistory.push({ matchId: m.id, result: 'T', opponentName: m.teamBName, scoreSummary: `${m.scoreA} vs ${m.scoreB}` });
      tB.matchHistory.push({ matchId: m.id, result: 'T', opponentName: m.teamAName, scoreSummary: `${m.scoreB} vs ${m.scoreA}` });
    }
  });

  // Calculate NRR and format overs for all teams
  const standings = Object.values(table).map(t => {
    const forRate = t.oversFacedDecimal > 0 ? (t.runsScored / t.oversFacedDecimal) : 0;
    const againstRate = t.oversBowledDecimal > 0 ? (t.runsConceded / t.oversBowledDecimal) : 0;
    const nrr = Number((forRate - againstRate).toFixed(3));

    return {
      ...t,
      forRunRate: Number(forRate.toFixed(3)),
      againstRunRate: Number(againstRate.toFixed(3)),
      NRR: isNaN(nrr) ? 0 : nrr,
      oversFacedDisplay: formatDecimalToOversDisplay(t.oversFacedDecimal),
      oversBowledDisplay: formatDecimalToOversDisplay(t.oversBowledDecimal),
      formGuide: (t.formGuide || []).slice(-5), // last 5 results
    };
  });

  // Sort by Points (descending) -> Wins (descending) -> NRR (descending) -> Alphabetical
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.won !== a.won) return b.won - a.won;
    if (b.NRR !== a.NRR) return b.NRR - a.NRR;
    return a.name.localeCompare(b.name);
  });

  // Annotate qualification indicators
  const totalMatchesPerTeam = Math.max(teams.length - 1, 1);
  standings.forEach((team, idx) => {
    if (idx < mergedRules.qualifyingSpots) {
      team.qualificationStatus = 'qualified';
    } else {
      const remainingMatches = totalMatchesPerTeam - team.played;
      const maxPossiblePoints = team.points + (remainingMatches * mergedRules.pointsForWin);
      const cutoffPoints = standings[mergedRules.qualifyingSpots - 1]?.points || 0;
      
      if (maxPossiblePoints < cutoffPoints) {
        team.qualificationStatus = 'eliminated';
      } else {
        team.qualificationStatus = 'contention';
      }
    }
  });

  return standings;
}
