/**
 * Official Certificate Verification & Serial Code Utilities
 * Gully Scoreboard Championship Certification Engine
 */

export type AwardType = 
  | 'potm' 
  | 'best_batter' 
  | 'best_bowler' 
  | 'fighter'
  | 'champion_squad'
  | 'runner_up_squad'
  | 'participation';

export interface VerifiedAwardDetails {
  certId: string;
  matchId: string;
  awardType: AwardType;
  awardName: string;
  recipientName: string;
  tournamentName: string;
  matchDate: string;
  venue?: string;
  teamA: string;
  teamB: string;
  winner?: string;
  winReason?: string;
  runs: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  wickets: number;
  runsConceded?: number;
  points: number;
  founderName: string;
  certifyingAuthority: string;
  issuedAt?: string;
}

/**
 * Generate an authentic, deterministic Certificate Serial Code
 * Example: GS-2026-M07-POTM-8F2B or GS-2026-M07-FIGHTER-4C19
 */
export function generateCertificateSerial(
  matchId: string = 'M01',
  matchDate: string = '2026',
  awardType: AwardType = 'potm',
  playerName: string = 'Player'
): string {
  // Extract 4-digit year from matchDate or current year
  const yearMatch = (matchDate || '').match(/\b(20\d\d)\b/);
  const year = yearMatch ? yearMatch[1] : '2026';

  // Extract clean match index / code (e.g. M07)
  let matchCode = 'M07';
  const cleanId = String(matchId || '').trim();
  const digits = cleanId.replace(/\D/g, '');

  if (digits.length > 0) {
    const num = parseInt(digits.slice(-3), 10) % 100;
    matchCode = `M${String(num === 0 ? 7 : num).padStart(2, '0')}`;
  } else if (cleanId.length > 0) {
    let hash = 0;
    for (let i = 0; i < cleanId.length; i++) {
      hash = (hash * 31 + cleanId.charCodeAt(i)) >>> 0;
    }
    matchCode = `M${String((hash % 90) + 10).padStart(2, '0')}`;
  }

  // Award abbreviation
  let awardCode = 'POTM';
  if (awardType === 'best_batter') awardCode = 'BAT';
  else if (awardType === 'best_bowler') awardCode = 'BOWL';
  else if (awardType === 'fighter') awardCode = 'FIGHTER';
  else if (awardType === 'champion_squad') awardCode = 'CHAMP';
  else if (awardType === 'runner_up_squad') awardCode = 'RUNNER';
  else if (awardType === 'participation') awardCode = 'SQUAD';

  // Deterministic 4-character Hex Checksum
  const cleanPlayer = (playerName || 'Player').trim().toLowerCase();
  const seed = `${cleanId}_${year}_${awardCode}_${cleanPlayer}`;
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) & 0xffffffff;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);

  return `GS-${year}-${matchCode}-${awardCode}-${hex}`;
}

/**
 * Build the instant scanner verification URL that opens the verification screen
 */
export function buildCertificateVerificationUrl(
  certId: string,
  details: {
    matchId: string;
    awardType: AwardType;
    playerName: string;
    runs: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    wickets: number;
    runsConceded?: number;
    points: number;
    teamA: string;
    teamB: string;
    winner?: string;
    matchDate: string;
    tournamentName: string;
    venue?: string;
  }
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shubhamhingane.in';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  const params = new URLSearchParams();
  params.set('certId', certId);
  params.set('m', details.matchId);
  params.set('a', details.awardType);
  params.set('p', details.playerName);
  params.set('r', String(details.runs || 0));
  if (details.balls) params.set('b', String(details.balls));
  if (details.fours) params.set('f4', String(details.fours));
  if (details.sixes) params.set('s6', String(details.sixes));
  params.set('w', String(details.wickets || 0));
  if (details.runsConceded !== undefined) params.set('rc', String(details.runsConceded));
  params.set('pts', String(details.points || 0));
  params.set('ta', details.teamA || 'Team A');
  params.set('tb', details.teamB || 'Team B');
  if (details.winner) params.set('win', details.winner);
  params.set('d', details.matchDate || '');
  params.set('t', details.tournamentName || 'Gully Premier League 2026');
  if (details.venue) params.set('v', details.venue);

  return `${origin}${pathname}#/verify-certificate?${params.toString()}`;
}

export interface PlayerStatsSummary {
  name: string;
  team?: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  runsConceded: number;
  maidens: number;
  ballsBowled: number;
  points: number;
}

/**
 * Standout performance from the runner-up team
 * Identifies the top player on the runner-up (losing) team who fought valiantly.
 */
export function computeFighterOfTheMatch(
  matchOrInnings1: any,
  innings2?: any,
  teamA: string = 'Team A',
  teamB: string = 'Team B',
  winner: string = '',
  potmPlayerName: string = ''
): PlayerStatsSummary | null {
  if (!matchOrInnings1) return null;

  let inn1 = matchOrInnings1;
  let inn2 = innings2;
  let tA = teamA;
  let tB = teamB;
  let win = winner;
  let potmName = potmPlayerName;

  // Check if first parameter is a MatchState object
  if (
    typeof matchOrInnings1 === 'object' &&
    ('teamA' in matchOrInnings1 || 'innings1' in matchOrInnings1 || 'mainMatchState' in matchOrInnings1)
  ) {
    const m = matchOrInnings1;
    inn1 = m.mainMatchState?.innings1 || m.innings1;
    inn2 = m.mainMatchState?.innings2 || m.innings2;
    tA = m.teamA || tA;
    tB = m.teamB || tB;
    win = m.winner || win;
    potmName = m.playerOfTheMatch?.name || potmName;
  }

  if (!inn1 && !inn2) return null;

  // Determine winning team and runner-up team
  const cleanWinner = (win || '').trim().toLowerCase();
  const cleanA = (tA || '').trim().toLowerCase();
  const cleanB = (tB || '').trim().toLowerCase();

  let runnerUpTeam = '';
  if (cleanWinner.includes(cleanA) && !cleanWinner.includes(cleanB)) {
    runnerUpTeam = tB;
  } else if (cleanWinner.includes(cleanB) && !cleanWinner.includes(cleanA)) {
    runnerUpTeam = tA;
  } else {
    // If winner text is not explicit, pick the other team from innings2 batting team or teamB
    runnerUpTeam = tB;
  }

  const runnerUpLower = runnerUpTeam.toLowerCase();
  const potmLower = (potmName || '').trim().toLowerCase();

  const statsMap: { [key: string]: PlayerStatsSummary } = {};

  const getOrCreate = (name: string, teamName: string) => {
    const key = name.trim().toLowerCase();
    if (!statsMap[key]) {
      statsMap[key] = {
        name: name.trim(),
        team: teamName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        runsConceded: 0,
        maidens: 0,
        ballsBowled: 0,
        points: 0
      };
    }
    return statsMap[key];
  };

  const processInn = (inn: any, defaultBatTeam: string, defaultBowlTeam: string) => {
    if (!inn) return;
    const batTeam = inn.battingTeam || defaultBatTeam;
    const bowlTeam = inn.bowlingTeam || defaultBowlTeam;

    (inn.batsmen || []).forEach((b: any) => {
      if (!b.name) return;
      const p = getOrCreate(b.name, batTeam);
      p.runs += b.runs || 0;
      p.balls += b.balls || 0;
      p.fours += b.fours || 0;
      p.sixes += b.sixes || 0;
    });

    (inn.bowlers || []).forEach((bw: any) => {
      if (!bw.name) return;
      const p = getOrCreate(bw.name, bowlTeam);
      p.wickets += bw.wickets || 0;
      p.runsConceded += bw.runsConceded || 0;
      p.maidens += bw.maidens || 0;
      p.ballsBowled += bw.ballsBowled || 0;
    });
  };

  processInn(inn1, tA, tB);
  processInn(inn2, tB, tA);

  let bestFighter: PlayerStatsSummary | null = null;
  let maxPoints = -1;

  // First pass: strictly look for players belonging to runnerUpTeam (excluding POTM)
  for (const k in statsMap) {
    const p = statsMap[k];
    if (potmLower && p.name.toLowerCase() === potmLower) continue;

    const pTeam = (p.team || '').toLowerCase();
    const isRunnerUp = pTeam.includes(runnerUpLower) || runnerUpLower.includes(pTeam);

    if (isRunnerUp) {
      const pts = p.runs + p.wickets * 25;
      p.points = pts;
      if (pts > maxPoints) {
        maxPoints = pts;
        bestFighter = p;
      }
    }
  }

  // Fallback if team matching was ambiguous: pick top performer who is NOT POTM
  if (!bestFighter || maxPoints <= 0) {
    maxPoints = -1;
    for (const k in statsMap) {
      const p = statsMap[k];
      if (potmLower && p.name.toLowerCase() === potmLower) continue;
      const pts = p.runs + p.wickets * 25;
      p.points = pts;
      if (pts > maxPoints) {
        maxPoints = pts;
        bestFighter = p;
      }
    }
  }

  return bestFighter;
}

export interface SquadPlayerCertificateItem {
  id: string;
  name: string;
  team: string;
  isWinner: boolean;
  isCaptain?: boolean;
  role?: string;
  runs: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  wickets: number;
  runsConceded?: number;
  maidens?: number;
  ballsBowled?: number;
  points: number;
}

/**
 * Extracts and aggregates all squad players and their match performances
 * across Team A and Team B for Batch Certification generation.
 */
export function extractSquadPlayersForCertificates(match: any): SquadPlayerCertificateItem[] {
  if (!match) return [];

  const teamA = match.teamA || 'Team A';
  const teamB = match.teamB || 'Team B';
  const winnerStr = (match.winner || '').trim().toLowerCase();
  const teamALower = teamA.trim().toLowerCase();
  const teamBLower = teamB.trim().toLowerCase();

  const isTeamAWinner = winnerStr.includes(teamALower) || (!winnerStr.includes(teamBLower) && winnerStr.length > 0 && !winnerStr.includes('tie'));
  const isTeamBWinner = winnerStr.includes(teamBLower);

  const inn1 = match.mainMatchState?.innings1 || match.innings1;
  const inn2 = match.mainMatchState?.innings2 || match.innings2;

  const playersMap = new Map<string, SquadPlayerCertificateItem>();

  const normalizeKey = (name: string, team: string) => `${name.trim().toLowerCase()}__${team.trim().toLowerCase()}`;

  const registerPlayer = (
    rawName: string, 
    teamName: string, 
    isWinner: boolean, 
    meta?: { isCaptain?: boolean; role?: string }
  ) => {
    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) return;
    const name = rawName.trim();
    const key = normalizeKey(name, teamName);
    if (!playersMap.has(key)) {
      playersMap.set(key, {
        id: key,
        name,
        team: teamName,
        isWinner,
        isCaptain: meta?.isCaptain || false,
        role: meta?.role || (meta?.isCaptain ? 'Captain' : 'Player'),
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        wickets: 0,
        runsConceded: 0,
        maidens: 0,
        ballsBowled: 0,
        points: 10
      });
    } else if (meta?.isCaptain) {
      const existing = playersMap.get(key)!;
      existing.isCaptain = true;
      existing.role = 'Captain';
    }
  };

  // 1. Ingest rosters from teamASquad, teamBSquad, teamAPlayers, teamBPlayers, playing11, etc.
  const squadA = match.teamASquad || match.teamAPlayers || match.teamARoster || match.playing11A || match.playersA;
  if (Array.isArray(squadA)) {
    squadA.forEach((p: any) => {
      if (typeof p === 'string') {
        registerPlayer(p, teamA, isTeamAWinner, { isCaptain: match.teamACaptain === p });
      } else if (p && p.name) {
        registerPlayer(p.name, teamA, isTeamAWinner, { isCaptain: p.isCaptain || match.teamACaptain === p.name, role: p.role });
      }
    });
  }

  const squadB = match.teamBSquad || match.teamBPlayers || match.teamBRoster || match.playing11B || match.playersB;
  if (Array.isArray(squadB)) {
    squadB.forEach((p: any) => {
      if (typeof p === 'string') {
        registerPlayer(p, teamB, isTeamBWinner, { isCaptain: match.teamBCaptain === p });
      } else if (p && p.name) {
        registerPlayer(p.name, teamB, isTeamBWinner, { isCaptain: p.isCaptain || match.teamBCaptain === p.name, role: p.role });
      }
    });
  }

  // Also check if match has tournament teams attached
  if (Array.isArray(match.teams)) {
    match.teams.forEach((t: any) => {
      if (!t || !t.name) return;
      const isTeamA = t.name.trim().toLowerCase() === teamALower;
      const isTeamB = t.name.trim().toLowerCase() === teamBLower;
      if (!isTeamA && !isTeamB) return;
      const teamName = isTeamA ? teamA : teamB;
      const isWinner = isTeamA ? isTeamAWinner : isTeamBWinner;
      const cap = t.captain || '';
      if (Array.isArray(t.players)) {
        t.players.forEach((p: any, pIdx: number) => {
          const pName = typeof p === 'string' ? p : p?.name;
          if (pName) {
            registerPlayer(pName, teamName, isWinner, {
              isCaptain: cap ? cap.toLowerCase() === pName.toLowerCase() : pIdx === 0,
              role: typeof p === 'object' ? p.role : undefined
            });
          }
        });
      }
    });
  }

  // 2. Ingest batsmen and bowlers from innings1 & innings2
  const processInnings = (inn: any, defaultBatTeam: string, defaultBowlTeam: string, batIsWinner: boolean, bowlIsWinner: boolean) => {
    if (!inn) return;
    const batTeam = inn.battingTeam || defaultBatTeam;
    const bowlTeam = inn.bowlingTeam || defaultBowlTeam;

    (inn.batsmen || []).forEach((b: any) => {
      if (!b.name) return;
      registerPlayer(b.name, batTeam, batIsWinner);
      const item = playersMap.get(normalizeKey(b.name, batTeam));
      if (item) {
        item.runs += b.runs || 0;
        item.balls = (item.balls || 0) + (b.balls || 0);
        item.fours = (item.fours || 0) + (b.fours || 0);
        item.sixes = (item.sixes || 0) + (b.sixes || 0);
      }
    });

    (inn.bowlers || []).forEach((bw: any) => {
      if (!bw.name) return;
      registerPlayer(bw.name, bowlTeam, bowlIsWinner);
      const item = playersMap.get(normalizeKey(bw.name, bowlTeam));
      if (item) {
        item.wickets += bw.wickets || 0;
        item.runsConceded = (item.runsConceded || 0) + (bw.runsConceded || 0);
        item.maidens = (item.maidens || 0) + (bw.maidens || 0);
        item.ballsBowled = (item.ballsBowled || 0) + (bw.ballsBowled || 0);
      }
    });
  };

  processInnings(inn1, teamA, teamB, isTeamAWinner, isTeamBWinner);
  processInnings(inn2, teamB, teamA, isTeamBWinner, isTeamAWinner);

  // 3. Compute final MVP points
  playersMap.forEach((item) => {
    item.points = (item.runs * 1) + (item.wickets * 25) + ((item.sixes || 0) * 2) + ((item.maidens || 0) * 10);
    if (item.points === 0) {
      item.points = 15;
    }
  });

  return Array.from(playersMap.values());
}

/**
 * Extracts squad players for a specific tournament team (for tournament conclusion batch generation)
 */
export function extractSquadPlayersForTournamentTeam(
  tournament: any,
  targetTeamName: string,
  isWinner: boolean = true
): SquadPlayerCertificateItem[] {
  if (!tournament || !targetTeamName) return [];

  const targetLower = targetTeamName.trim().toLowerCase();
  const team = (tournament.teams || []).find((t: any) => 
    (t.name && t.name.trim().toLowerCase() === targetLower) ||
    (t.id && t.id.trim().toLowerCase() === targetLower)
  );

  const squadItems: SquadPlayerCertificateItem[] = [];
  const registeredNames = new Set<string>();
  const teamName = team ? team.name : targetTeamName;
  const captain = team?.captain || '';

  // 1. Ingest players declared in the team roster
  if (team && Array.isArray(team.players) && team.players.length > 0) {
    team.players.forEach((p: any, idx: number) => {
      const name = (typeof p === 'string' ? p : p?.name || '').trim();
      if (!name) return;
      const lower = name.toLowerCase();
      if (registeredNames.has(lower)) return;
      registeredNames.add(lower);

      const isCap = captain ? captain.toLowerCase() === lower : idx === 0;
      squadItems.push({
        id: `${lower}__${teamName.toLowerCase()}`,
        name,
        team: teamName,
        isWinner,
        isCaptain: isCap,
        role: isCap ? 'Captain' : (typeof p === 'object' && p?.role ? p.role : 'Playing XI Squad'),
        runs: 0,
        wickets: 0,
        points: 25
      });
    });
  }

  // 2. Cross-reference with match performances across tournament matches for this team
  if (Array.isArray(tournament.matches)) {
    tournament.matches.forEach((m: any) => {
      const isTeamA = m.teamAName?.trim().toLowerCase() === targetLower;
      const isTeamB = m.teamBName?.trim().toLowerCase() === targetLower;
      if (!isTeamA && !isTeamB) return;

      const mSquad = extractSquadPlayersForCertificates({
        ...m,
        teamA: m.teamAName,
        teamB: m.teamBName,
        winner: m.winnerId === m.teamAId ? m.teamAName : (m.winnerId === m.teamBId ? m.teamBName : '')
      });

      mSquad.forEach((sp) => {
        if (sp.team.trim().toLowerCase() !== targetLower) return;
        const lower = sp.name.toLowerCase();
        const existing = squadItems.find(item => item.name.toLowerCase() === lower);
        if (existing) {
          existing.runs += sp.runs;
          existing.wickets += sp.wickets;
          existing.points += sp.points;
          if (sp.isCaptain) existing.isCaptain = true;
        } else {
          registeredNames.add(lower);
          squadItems.push({
            ...sp,
            isWinner
          });
        }
      });
    });
  }

  return squadItems;
}
