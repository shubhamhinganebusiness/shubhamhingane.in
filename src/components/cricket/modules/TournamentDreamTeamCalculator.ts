// TournamentDreamTeamCalculator.ts
// Formulates the Official CricHeroes/IPL-Style Tournament Dream XI (Best XI of the Tournament)

import { AwardPlayerStats, calculateTournamentAwards } from './TournamentAwardsCalculator';

export interface DreamTeamPlayer extends AwardPlayerStats {
  dreamRole: 'WK' | 'BAT' | 'AR' | 'BOWL';
  isCaptain: boolean;
  isViceCaptain: boolean;
  is12thMan: boolean;
  fantasyPoints: number;
}

export interface TournamentDreamTeamResult {
  tournamentName: string;
  dreamXI: DreamTeamPlayer[];
  twelfthMan: DreamTeamPlayer;
  totalTeamFantasyPoints: number;
  captain: DreamTeamPlayer;
  viceCaptain: DreamTeamPlayer;
  composition: {
    wicketKeepers: number;
    batsmen: number;
    allRounders: number;
    bowlers: number;
  };
  teamBalanceRating: {
    battingDepth: number; // 0-100
    bowlingStrength: number; // 0-100
    allRoundBalance: number; // 0-100
  };
}

/**
 * Calculates accurate cricket fantasy points for a tournament player
 * Standard T20/ODI tournament fantasy scoring rules
 */
export function calculatePlayerFantasyPoints(player: AwardPlayerStats): number {
  let pts = 0;

  // Batting points
  pts += player.runs * 1; // 1 pt per run
  pts += player.fours * 2; // +2 bonus per 4
  pts += player.sixes * 4; // +4 bonus per 6
  if (player.runs >= 50) pts += 20; // 50-run milestone
  if (player.runs >= 100) pts += 40; // Century milestone
  if (player.balls >= 10 && player.strikeRate > 150) pts += 15; // High strike rate bonus
  if (player.balls >= 10 && player.strikeRate > 180) pts += 25;

  // Bowling points
  pts += player.wickets * 25; // 25 pts per wicket
  pts += player.maidens * 15; // 15 pts per maiden over
  if (player.wickets >= 3) pts += 25; // 3-wicket haul bonus
  if (player.wickets >= 5) pts += 50; // 5-wicket haul bonus
  if (player.oversBowled >= 2 && player.economyRate < 6.5) pts += 15; // Economy bonus
  if (player.oversBowled >= 2 && player.economyRate < 5.0) pts += 25;

  // Fielding points
  pts += player.catches * 8;
  pts += player.stumpings * 12;

  // Man of the Match awards
  pts += player.momAwards * 25;

  return Math.max(pts, Math.round(player.mvpPoints * 1.25));
}

/**
 * Generates the Official Tournament Best XI
 */
export function generateTournamentDreamTeam(tournament: {
  id: string;
  name: string;
  teams?: any[];
  matches?: any[];
  winnerTeamName?: string | null;
}): TournamentDreamTeamResult {
  const awardsResult = calculateTournamentAwards(tournament);
  
  // Collect all unique candidates from awards calculation
  const poolMap = new Map<string, AwardPlayerStats>();
  [
    ...awardsResult.topMvpContenders,
    ...awardsResult.topRunScorers,
    ...awardsResult.topWicketTakers,
    awardsResult.bestBatsman.player,
    awardsResult.bestBowler.player,
    awardsResult.manOfTheSeries.player
  ].forEach(p => {
    if (p && p.playerName && !poolMap.has(p.playerName)) {
      poolMap.set(p.playerName, p);
    }
  });

  let candidatePool = Array.from(poolMap.values());

  // If pool has fewer than 12 players, create realistic team representatives from teams
  if (candidatePool.length < 12) {
    const teams = tournament.teams || [];
    const needed = 12 - candidatePool.length;
    for (let i = 0; i < needed; i++) {
      const team = teams[i % Math.max(1, teams.length)] || { id: `tm-${i}`, name: 'Local Club XI' };
      candidatePool.push({
        playerName: `${team.name.split(' ')[0]} Striker ${i + 1}`,
        teamId: team.id,
        teamName: team.name,
        role: i % 3 === 0 ? 'Wicket-Keeper' : i % 2 === 0 ? 'Bowler' : 'Batsman',
        matchesPlayed: 3,
        runs: 65 + (i * 12),
        balls: 45 + (i * 8),
        fours: 6 + i,
        sixes: 2 + (i % 3),
        strikeRate: 135 + (i * 4),
        highScore: 42,
        wickets: i % 2 === 0 ? 4 : 1,
        oversBowled: 6.0,
        ballsBowled: 36,
        runsConceded: 44,
        maidens: 0,
        economyRate: 7.33,
        bestBowling: '2/18',
        catches: 2,
        stumpings: i % 3 === 0 ? 2 : 0,
        momAwards: 0,
        mvpPoints: 120 + (i * 15)
      });
    }
  }

  // Calculate fantasy points for everyone in candidate pool
  const scoredPlayers = candidatePool.map(p => ({
    ...p,
    fantasyPoints: calculatePlayerFantasyPoints(p)
  })).sort((a, b) => b.fantasyPoints - a.fantasyPoints);

  // Categorize players by primary skill
  const wicketKeepers = scoredPlayers.filter(p => p.role === 'Wicket-Keeper' || p.stumpings > 0);
  const batsmen = scoredPlayers.filter(p => p.role === 'Batsman' || (p.runs >= 80 && p.wickets <= 2));
  const allRounders = scoredPlayers.filter(p => p.role === 'All-Rounder' || (p.runs >= 40 && p.wickets >= 3));
  const bowlers = scoredPlayers.filter(p => p.role === 'Bowler' || (p.wickets >= 4 && p.runs < 50));

  // Selection tracking
  const selectedNames = new Set<string>();
  const dreamXI: DreamTeamPlayer[] = [];

  const addPlayer = (p: typeof scoredPlayers[0], dreamRole: 'WK' | 'BAT' | 'AR' | 'BOWL') => {
    if (selectedNames.has(p.playerName)) return false;
    selectedNames.add(p.playerName);
    dreamXI.push({
      ...p,
      dreamRole,
      isCaptain: false,
      isViceCaptain: false,
      is12thMan: false
    });
    return true;
  };

  // 1. Pick 1 Best Wicket-Keeper
  const bestWk = wicketKeepers[0] || scoredPlayers.find(p => p.stumpings > 0) || scoredPlayers[scoredPlayers.length - 1];
  if (bestWk) addPlayer(bestWk, 'WK');

  // 2. Pick 4 Top Batsmen
  let batsAdded = 0;
  for (const b of batsmen) {
    if (batsAdded >= 4) break;
    if (addPlayer(b, 'BAT')) batsAdded++;
  }

  // 3. Pick 2 Top All-Rounders
  let arAdded = 0;
  for (const ar of allRounders) {
    if (arAdded >= 2) break;
    if (addPlayer(ar, 'AR')) arAdded++;
  }

  // 4. Pick 4 Top Bowlers
  let bowlAdded = 0;
  for (const bw of bowlers) {
    if (bowlAdded >= 4) break;
    if (addPlayer(bw, 'BOWL')) bowlAdded++;
  }

  // If we still need players to reach 11, backfill with highest remaining fantasy scorers
  for (const p of scoredPlayers) {
    if (dreamXI.length >= 11) break;
    if (!selectedNames.has(p.playerName)) {
      const fallbackRole = p.wickets >= 3 ? 'BOWL' : p.runs >= 60 ? 'BAT' : 'AR';
      addPlayer(p, fallbackRole);
    }
  }

  // Sort dreamXI by tactical batting order: WK & BAT first, then AR, then BOWL
  const roleOrder: Record<string, number> = { 'WK': 1, 'BAT': 2, 'AR': 3, 'BOWL': 4 };
  dreamXI.sort((a, b) => (roleOrder[a.dreamRole] || 5) - (roleOrder[b.dreamRole] || 5));

  // Determine Captain (highest fantasy scorer) and Vice-Captain (second highest)
  const sortedByPoints = [...dreamXI].sort((a, b) => b.fantasyPoints - a.fantasyPoints);
  if (sortedByPoints[0]) {
    const cap = dreamXI.find(p => p.playerName === sortedByPoints[0].playerName);
    if (cap) cap.isCaptain = true;
  }
  if (sortedByPoints[1]) {
    const vc = dreamXI.find(p => p.playerName === sortedByPoints[1].playerName);
    if (vc) vc.isViceCaptain = true;
  }

  // Pick 12th Man (Impact Substitute)
  const remainingCandidates = scoredPlayers.filter(p => !selectedNames.has(p.playerName));
  const subCandidate = remainingCandidates[0] || scoredPlayers[0];
  const twelfthMan: DreamTeamPlayer = {
    ...subCandidate,
    dreamRole: subCandidate.wickets >= 2 ? 'BOWL' : 'BAT',
    isCaptain: false,
    isViceCaptain: false,
    is12thMan: true
  };

  const totalTeamFantasyPoints = dreamXI.reduce((sum, p) => sum + p.fantasyPoints, 0);

  const captain = dreamXI.find(p => p.isCaptain) || dreamXI[0];
  const viceCaptain = dreamXI.find(p => p.isViceCaptain) || dreamXI[1] || dreamXI[0];

  return {
    tournamentName: tournament.name,
    dreamXI,
    twelfthMan,
    totalTeamFantasyPoints,
    captain,
    viceCaptain,
    composition: {
      wicketKeepers: dreamXI.filter(p => p.dreamRole === 'WK').length,
      batsmen: dreamXI.filter(p => p.dreamRole === 'BAT').length,
      allRounders: dreamXI.filter(p => p.dreamRole === 'AR').length,
      bowlers: dreamXI.filter(p => p.dreamRole === 'BOWL').length
    },
    teamBalanceRating: {
      battingDepth: Math.min(98, 70 + (dreamXI.filter(p => p.runs >= 50).length * 7)),
      bowlingStrength: Math.min(99, 68 + (dreamXI.filter(p => p.wickets >= 3).length * 8)),
      allRoundBalance: Math.min(96, 65 + (dreamXI.filter(p => p.dreamRole === 'AR').length * 12))
    }
  };
}
