import React, { useState, useEffect, useCallback } from 'react';
import { CommentaryLanguage } from './commentaryLanguage';

export interface WinProbabilityMetrics {
  probA: number; // 0 to 100
  probB: number; // 0 to 100
  teamAName: string;
  teamBName: string;
  currentInningsNum: 1 | 2;
  battingTeamName: string;
  bowlingTeamName: string;
  battingTeamProb: number;
  bowlingTeamProb: number;
  favoredTeamName: string;
  favoredProbability: number;
  underdogTeamName: string;
  underdogProbability: number;
  runs: number;
  wickets: number;
  ballsBowled: number;
  totalBalls: number;
  ballsRemaining: number;
  oversRemaining: string;
  oversBowledText: string;
  crr: number;
  target?: number;
  runsNeeded?: number;
  rrr?: number;
  tiltStatus: 'balanced' | 'slight_tilt' | 'heavy_tilt' | 'miracle_needed' | 'sealed';
  tiltDirection: 'batting' | 'bowling' | 'neutral';
  equationText: string;
  swingFromPrevious?: number;
}

export interface WinProbabilityCommentary {
  text: string;
  translations: {
    en: string;
    hi: string;
    mr: string;
  };
  metrics: WinProbabilityMetrics;
  keyTacticalReason: string;
  generatedAt: string;
  isAiGenerated: boolean;
}

/**
 * Calculates a mathematically calibrated Cricket Win Probability based on:
 * - Match format & total overs
 * - Current innings (1st innings baseline vs 2nd innings run-chase pressure)
 * - Required Run Rate (RRR) vs Current Run Rate (CRR)
 * - Wickets lost & resources remaining
 * - Death overs compression and required boundaries
 */
export function calculateWinProbabilityDetails(
  match: any,
  previousProbA?: number | null
): WinProbabilityMetrics {
  const norm = (s?: string) => (s || '').trim().toLowerCase();
  const teamAName = match?.teamA || 'Team A';
  const teamBName = match?.teamB || 'Team B';
  const oversLimit = Math.max(1, Number(match?.oversLimit) || 10);
  const totalBalls = oversLimit * 6;
  const currentInningsNum: 1 | 2 = match?.currentInningsNum === 2 ? 2 : 1;

  const currentInnings = currentInningsNum === 1 ? match?.innings1 : match?.innings2;
  const battingTeamName = currentInnings?.battingTeam || (currentInningsNum === 1 ? teamAName : teamBName);
  const bowlingTeamName = currentInnings?.bowlingTeam || (currentInningsNum === 1 ? teamBName : teamAName);

  const runs = Math.max(0, Number(currentInnings?.runs) || 0);
  const wickets = Math.min(10, Math.max(0, Number(currentInnings?.wickets) || 0));
  const ballsBowled = Math.min(totalBalls, Math.max(0, Number(currentInnings?.ballsBowled) || 0));
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
  const oversBowledText = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
  const oversRemaining = `${Math.floor(ballsRemaining / 6)}.${ballsRemaining % 6}`;
  const crr = ballsBowled > 0 ? Number(((runs / ballsBowled) * 6).toFixed(2)) : 0;

  const target = match?.targetRuns ? Number(match.targetRuns) : (currentInningsNum === 2 && match?.innings1 ? (Number(match.innings1.runs) || 0) + 1 : undefined);

  let probA = 50;
  let runsNeeded: number | undefined;
  let rrr: number | undefined;
  let equationText = '';

  const isMatchCompleted = match?.status === 'completed' || (match?.winner && match?.winner !== '');

  if (isMatchCompleted) {
    const winner = norm(match?.winner);
    if (winner === 'tie' || winner.includes('tied') || winner.includes('draw')) {
      probA = 50;
    } else if (winner === norm(teamAName) || (norm(teamAName) && winner.includes(norm(teamAName)))) {
      probA = 100;
    } else if (winner === norm(teamBName) || (norm(teamBName) && winner.includes(norm(teamBName)))) {
      probA = 0;
    } else {
      probA = 50;
    }
    equationText = match?.winReason || `${match?.winner || 'Match'} Completed`;
  } else if (currentInningsNum === 1) {
    // 1st INNINGS: Baseline projected score modeling with progressive sample weight
    equationText = `${runs}/${wickets} in ${oversBowledText} ov (CRR: ${crr})`;
    if (ballsBowled === 0) {
      probA = 50;
    } else {
      const parRate = oversLimit <= 6 ? 9.0 : (oversLimit <= 10 ? 8.2 : 7.8);
      const parScore = parRate * oversLimit;
      const wicketsInHand = Math.max(0, 10 - wickets);
      const wicketWeight = Math.pow(wicketsInHand / 10, 0.7);

      // Projected runs based on current momentum and remaining wickets
      const projectedRuns = runs + (ballsRemaining / 6) * Math.max(4.5, (crr * 0.65 + 3.0) * wicketWeight);
      const diff = projectedRuns - parScore;
      
      // Sigmoid mapping
      const z = diff / (parScore * 0.35);
      const rawProb = 100 / (1 + Math.exp(-z));

      // Dampen early-overs volatility: in 1st innings, don't swing past 55-45 in the first 20% of the game
      const sampleConfidence = Math.min(1.0, Math.pow(ballsBowled / totalBalls, 0.6));
      const dampenedBattingProb = 50 + (rawProb - 50) * sampleConfidence;
      const battingProb = Math.min(88, Math.max(12, Math.round(dampenedBattingProb)));

      // If Team A is batting first (case-insensitive safe match)
      const teamAIsBatting = norm(battingTeamName) === norm(teamAName);
      probA = teamAIsBatting ? battingProb : 100 - battingProb;
    }
  } else {
    // 2nd INNINGS: Chase pressure modeling
    const effectiveTarget = target || ((Number(match?.innings1?.runs) || 0) + 1);
    runsNeeded = Math.max(0, effectiveTarget - runs);
    rrr = ballsRemaining > 0 ? Number(((runsNeeded / ballsRemaining) * 6).toFixed(2)) : (runsNeeded === 0 ? 0 : 99);
    equationText = runsNeeded <= 0
      ? `Target reached! ${battingTeamName} won`
      : `${runsNeeded} needed off ${ballsRemaining} ball${ballsRemaining === 1 ? '' : 's'}`;

    let battingProb = 50;
    const wicketsInHand = Math.max(0, 10 - wickets);

    if (runs >= effectiveTarget) {
      battingProb = 100;
    } else if (wickets >= 10 || (ballsRemaining <= 0 && runsNeeded > 0)) {
      // If balls exhausted and runs are exactly equal (target - 1), it's a tie
      if (ballsRemaining <= 0 && runs === effectiveTarget - 1) {
        battingProb = 50;
      } else {
        battingProb = 0;
      }
    } else if (runsNeeded > ballsRemaining * 6) {
      // Impossible without extras
      battingProb = 1;
    } else if (runsNeeded === 1) {
      // Only 1 run needed:
      if (ballsRemaining >= 3 && wicketsInHand >= 2) battingProb = 99;
      else if (ballsRemaining === 2) battingProb = 95;
      else if (ballsRemaining === 1) battingProb = 75; // 1 off 1 with wickets left favors batting
      else battingProb = 95;
    } else if (runsNeeded <= 3 && ballsRemaining >= runsNeeded * 2 && wicketsInHand >= 3) {
      battingProb = 97;
    } else if (ballsRemaining <= 6) {
      // Last over mechanics
      if (runsNeeded <= 2) battingProb = 95;
      else if (runsNeeded <= 6) battingProb = wicketsInHand >= 3 ? 75 : 55;
      else if (runsNeeded <= 10) battingProb = wicketsInHand >= 3 ? 42 : 25;
      else if (runsNeeded <= 15) battingProb = wicketsInHand >= 2 ? 18 : 8;
      else if (runsNeeded <= 20) battingProb = 6;
      else battingProb = 2;
    } else if (ballsRemaining <= 18 && (runsNeeded / ballsRemaining) >= 2.8) {
      // High RRR in death overs
      const runsPerBall = runsNeeded / ballsRemaining;
      if (runsPerBall >= 3.3 || wicketsInHand <= 2) {
        battingProb = Math.max(2, Math.min(6, Math.round(14 / runsPerBall)));
      } else {
        battingProb = Math.max(5, Math.min(10, Math.round(20 / runsPerBall - (10 - wicketsInHand) * 0.5)));
      }
    } else if (runsNeeded <= ballsRemaining * 0.75 && wicketsInHand >= 5) {
      // Comfortably cruising
      const comfortBonus = Math.min(15, (ballsRemaining - runsNeeded) * 0.5);
      battingProb = Math.min(96, Math.max(82, Math.round(82 + comfortBonus)));
    } else {
      // Multi-variable logistic regression curve
      const rrrDiff = 8.5 - rrr;
      const wicketFactor = (wicketsInHand - 5.5) * 0.45;
      const ballsLeftFactor = (ballsRemaining / totalBalls) * 0.35;

      const z = (rrrDiff * 0.28) + wicketFactor - ballsLeftFactor;
      const sig = 100 / (1 + Math.exp(-z));
      battingProb = Math.min(97, Math.max(3, Math.round(sig)));
    }

    const teamAIsBatting = norm(battingTeamName) === norm(teamAName);
    probA = teamAIsBatting ? battingProb : 100 - battingProb;
  }

  const probB = 100 - probA;
  const battingTeamProb = norm(battingTeamName) === norm(teamAName) ? probA : probB;
  const bowlingTeamProb = 100 - battingTeamProb;

  let favoredTeamName = teamAName;
  let favoredProbability = probA;
  let underdogTeamName = teamBName;
  let underdogProbability = probB;

  if (probB > probA) {
    favoredTeamName = teamBName;
    favoredProbability = probB;
    underdogTeamName = teamAName;
    underdogProbability = probA;
  }

  // Determine Tilt Status
  let tiltStatus: 'balanced' | 'slight_tilt' | 'heavy_tilt' | 'miracle_needed' | 'sealed' = 'balanced';
  let tiltDirection: 'batting' | 'bowling' | 'neutral' = 'neutral';

  if (battingTeamProb >= 55) {
    tiltDirection = 'batting';
  } else if (bowlingTeamProb >= 55) {
    tiltDirection = 'bowling';
  }

  if (favoredProbability >= 98 || runsNeeded === 0 || (wickets >= 10 && currentInningsNum === 2)) {
    tiltStatus = 'sealed';
  } else if (favoredProbability >= 91) {
    tiltStatus = 'miracle_needed';
  } else if (favoredProbability >= 72) {
    tiltStatus = 'heavy_tilt';
  } else if (favoredProbability >= 58) {
    tiltStatus = 'slight_tilt';
  } else {
    tiltStatus = 'balanced';
  }

  const swingFromPrevious = previousProbA !== undefined && previousProbA !== null
    ? Math.abs(probA - previousProbA)
    : 0;

  return {
    probA,
    probB,
    teamAName,
    teamBName,
    currentInningsNum,
    battingTeamName,
    bowlingTeamName,
    battingTeamProb,
    bowlingTeamProb,
    favoredTeamName,
    favoredProbability,
    underdogTeamName,
    underdogProbability,
    runs,
    wickets,
    ballsBowled,
    totalBalls,
    ballsRemaining,
    oversRemaining,
    oversBowledText,
    crr,
    target,
    runsNeeded,
    rrr,
    tiltStatus,
    tiltDirection,
    equationText,
    swingFromPrevious
  };
}

/**
 * Deterministic localized commentary generator in English, Hindi, and Marathi
 * Explaining WHY the match is tilting toward a specific team.
 */
export function generateFallbackWinProbCommentary(
  metrics: WinProbabilityMetrics,
  userLang: CommentaryLanguage = 'en'
): { text: string; translations: { en: string; hi: string; mr: string }; keyTacticalReason: string } {
  const {
    currentInningsNum,
    battingTeamName,
    bowlingTeamName,
    favoredTeamName,
    favoredProbability,
    underdogTeamName,
    underdogProbability,
    runsNeeded = 0,
    ballsRemaining,
    wickets,
    rrr = 0,
    crr,
    tiltStatus
  } = metrics;

  const wicketsInHand = 10 - wickets;

  let en = '';
  let hi = '';
  let mr = '';
  let keyTacticalReason = '';

  if (currentInningsNum === 2) {
    if (tiltStatus === 'miracle_needed' || underdogProbability <= 8) {
      keyTacticalReason = `Skyrocketing RRR (${rrr} RPO) & Bowling Death Strangle`;
      en = `With ${runsNeeded} needed off ${ballsRemaining}, ${underdogTeamName}'s win probability has plummeted to ${underdogProbability}%. They need a miracle as the required run rate has spiked to ${rrr} RPO with only ${wicketsInHand} wicket${wicketsInHand === 1 ? '' : 's'} left!`;
      hi = `${ballsRemaining} गेंदों में ${runsNeeded} रनों की भारी दरकार के साथ, ${underdogTeamName} की जीत की संभावना घटकर मात्र ${underdogProbability}% रह गई है! आवश्यक रन रेट ${rrr} तक पहुंच चुका है और केवल ${wicketsInHand} विकेट शेष होने के कारण अब उन्हें किसी बड़े चमत्कार की ही जरूरत है!`;
      mr = `${ballsRemaining} चेंडूत ${runsNeeded} धावांची अशक्यप्राय गरज असताना, ${underdogTeamName} च्या विजयाची शक्यता थेट ${underdogProbability}% वर घसरली आहे! आवश्यक धावगती ${rrr} वर पोहोचल्यामुळे आणि हातात फक्त ${wicketsInHand} फलंदाज शिल्लक असल्याने आता केवळ चमत्काराचीच आशा उरली आहे!`;
    } else if (tiltStatus === 'heavy_tilt') {
      if (favoredTeamName === battingTeamName) {
        keyTacticalReason = `Manageable Equation (${runsNeeded} off ${ballsRemaining}b) with ${wicketsInHand} Wickets in Hand`;
        en = `${favoredTeamName} is in commanding position with a ${favoredProbability}% win probability, needing ${runsNeeded} runs off ${ballsRemaining} balls. With ${wicketsInHand} wickets intact and a gentle required rate of ${rrr} RPO, the batting side holds all the cards.`;
        hi = `${favoredTeamName} ${favoredProbability}% जीत की संभावना के साथ मैच पर पूरी तरह हावी है, जहां ${ballsRemaining} गेंदों में मात्र ${runsNeeded} रनों की दरकार है। हाथ में ${wicketsInHand} विकेट सुरक्षित होने से गेंदबाजी टीम पर दबाव चरम पर है।`;
        mr = `${favoredTeamName} संघ ${favoredProbability}% विजयाच्या शक्यतेसह सामन्यावर भक्कम पकड मिळवून आहे. ${ballsRemaining} चेंडूत फक्त ${runsNeeded} धावा हव्या असून ${wicketsInHand} गडी शाबूत असल्याने फलंदाजांकडे पूर्ण नियंत्रण आहे.`;
      } else {
        keyTacticalReason = `Bowling Strangulation & Dot Ball Pressure`;
        en = `${bowlingTeamName}'s disciplined bowling has pushed their win probability to ${favoredProbability}%. ${battingTeamName} still needs ${runsNeeded} off ${ballsRemaining} balls at ${rrr} RPO, and dot balls are relentlessly mounting the pressure.`;
        hi = `${bowlingTeamName} की कसी हुई गेंदबाजी ने उनकी जीत की संभावना को ${favoredProbability}% तक पहुंचा दिया है। ${battingTeamName} को अभी भी ${ballsRemaining} गेंदों में ${runsNeeded} रन चाहिए और बढ़ती डॉट गेंदों ने मैच का रुख पलट दिया है।`;
        mr = `${bowlingTeamName} च्या शिस्तबद्ध माऱ्यामुळे त्यांच्या विजयाची शक्यता ${favoredProbability}% वर पोहोचली आहे. ${battingTeamName} ला अजूनही ${ballsRemaining} चेंडूत ${runsNeeded} धावा करायच्या असून निर्धाव चेंडूंनी फलंदाजांवर फास आवळला आहे.`;
      }
    } else if (tiltStatus === 'slight_tilt') {
      keyTacticalReason = `Crucial Crunch Over Phase`;
      en = `The contest tilts slightly towards ${favoredTeamName} (${favoredProbability}%), but it remains wide open! With ${runsNeeded} required off ${ballsRemaining} balls (${rrr} RPO), a single boundary or wicket in this over will flip the entire match script.`;
      hi = `मुकाबला थोड़ा सा ${favoredTeamName} (${favoredProbability}%) के पक्ष में झुक रहा है, लेकिन मैच पूरी तरह खुला है! ${ballsRemaining} गेंदों में ${runsNeeded} रनों की जरूरत है, एक बाउंड्री या विकेट पूरे खेल का पासा पलट सकता है।`;
      mr = `सामना किंचित ${favoredTeamName} (${favoredProbability}%) च्या बाजूने झुकत आहे, पण लढत अद्याप अटीतटीची आहे! ${ballsRemaining} चेंडूत ${runsNeeded} धावांची आवश्यकता असून या षटकातील एक चौकार किंवा बाद चेंडू संपूर्ण चित्र बदलू शकतो.`;
    } else if (tiltStatus === 'sealed') {
      keyTacticalReason = `Match Victory Virtually Sealed`;
      en = `Match virtually in the bag for ${favoredTeamName}! Holding a ${favoredProbability}% win certainty, the finish line is in sight and the opposition has run out of mathematical leverage.`;
      hi = `${favoredTeamName} की जीत अब लगभग पक्की हो चुकी है (${favoredProbability}%)! जीत की रेखा साफ नजर आ रही है और विपक्षी टीम के पास अब कोई वापसी का रास्ता नहीं बचा है।`;
      mr = `${favoredTeamName} चा विजय आता जवळपास निश्चित झाला आहे (${favoredProbability}%)! विजयाची रेषा दृष्टिक्षेपात असून प्रतिस्पर्ध्यांसाठी गणिताचे सर्व रस्ते बंद झाले आहेत.`;
    } else {
      keyTacticalReason = `Deadlocked 50-50 Thriller`;
      en = `Right down to the wire! Win probability sits deadlocked at 50-50 between ${metrics.teamAName} and ${metrics.teamBName}. With ${runsNeeded} needed off ${ballsRemaining} balls, every single heartbeat and delivery counts!`;
      hi = `सांसें थाम देने वाला रोमांच! ${metrics.teamAName} और ${metrics.teamBName} के बीच जीत की संभावना 50-50% की बराबरी पर टिकी है। ${ballsRemaining} गेंदों में ${runsNeeded} रन चाहिए—अब हर गेंद इतिहास लिखेगी!`;
      mr = `काळजाचा ठोका चुकवणारा थरार! ${metrics.teamAName} आणि ${metrics.teamBName} यांच्यात विजयाची शक्यता 50-50% वर बरोबरीत आहे. ${ballsRemaining} चेंडूत ${runsNeeded} धावा हव्या असताना प्रत्येक चेंडू निर्णायक ठरणार आहे!`;
    }
  } else {
    // 1st Innings
    if (tiltStatus === 'heavy_tilt' || tiltStatus === 'miracle_needed') {
      keyTacticalReason = favoredTeamName === battingTeamName ? `Explosive Power-Hitting (CRR: ${crr})` : `Top-Order Bowling Carnage (${wickets} Wickets Lost)`;
      en = `${favoredTeamName} holds a dominant ${favoredProbability}% win probability in the first innings. ${favoredTeamName === battingTeamName ? `Scoring freely at ${crr} RPO puts them on track for an imposing total.` : `Losing ${wickets} early wickets has severely derailed the scoring tempo.`}`;
      hi = `पहली पारी में ${favoredTeamName} का पलड़ा भारी है (${favoredProbability}% जीत संभावना)। ${favoredTeamName === battingTeamName ? `${crr} के रन रेट से आक्रामक बल्लेबाजी उन्हें बड़े स्कोर की ओर ले जा रही है।` : `शुरुआती ${wickets} विकेट गंवाने से पारी बुरी तरह लड़खड़ा गई है।`}`;
      mr = `पहिल्या डावात ${favoredTeamName} चे पारडे जड आहे (${favoredProbability}% विजयाची शक्यता). ${favoredTeamName === battingTeamName ? `${crr} च्या वेगाने होत असलेली फटकेबाजी मोठ्या धावसंख्येकडे नेत आहे.` : `सुरुवातीचे ${wickets} गडी बाद झाल्यामुळे धावगतीला खीळ बसली आहे.`}`;
    } else {
      keyTacticalReason = `Evenly Balanced First Innings Tug-of-War`;
      en = `The first innings is finely poised with ${favoredTeamName} holding a slight ${favoredProbability}% edge at ${metrics.runs}/${metrics.wickets} in ${metrics.oversBowledText} overs. The remaining overs will set the definitive benchmark.`;
      hi = `पहली पारी का मुकाबला संतुलित है, जहां ${favoredTeamName} ${favoredProbability}% के मामूली अंतर से आगे है (${metrics.runs}/${metrics.wickets}, ${metrics.oversBowledText} ओवर)। आगामी ओवर लक्ष्य की दिशा तय करेंगे।`;
      mr = `पहिला डाव अत्यंत चुरशीच्या टप्प्यात असून ${favoredTeamName} कडे ${favoredProbability}% अशी किंचित आघाडी आहे (${metrics.runs}/${metrics.wickets}, ${metrics.oversBowledText} षटके). शिल्लक षटकांतून अंतिम आव्हानाची दिशा ठरेल.`;
    }
  }

  const translations = { en, hi, mr };
  const text = translations[userLang] || en;

  return { text, translations, keyTacticalReason };
}

/**
 * Fetch AI-powered Win Probability Commentary from server Gemini endpoint,
 * with seamless fallback to deterministic multi-lingual generation.
 */
export async function fetchAIWinProbabilityCommentary(
  match: any,
  userLang: CommentaryLanguage = 'en',
  previousProbA?: number | null
): Promise<WinProbabilityCommentary> {
  const metrics = calculateWinProbabilityDetails(match, previousProbA);
  const fallback = generateFallbackWinProbCommentary(metrics, userLang);

  try {
    const res = await fetch('/api/cricket/win-prob-commentary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: match?.id,
        teamA: metrics.teamAName,
        teamB: metrics.teamBName,
        currentInningsNum: metrics.currentInningsNum,
        battingTeam: metrics.battingTeamName,
        bowlingTeam: metrics.bowlingTeamName,
        runs: metrics.runs,
        wickets: metrics.wickets,
        ballsBowled: metrics.ballsBowled,
        totalBalls: metrics.totalBalls,
        ballsRemaining: metrics.ballsRemaining,
        oversRemaining: metrics.oversRemaining,
        oversBowledText: metrics.oversBowledText,
        crr: metrics.crr,
        target: metrics.target,
        runsNeeded: metrics.runsNeeded,
        rrr: metrics.rrr,
        probA: metrics.probA,
        probB: metrics.probB,
        favoredTeam: metrics.favoredTeamName,
        favoredProbability: metrics.favoredProbability,
        underdogTeam: metrics.underdogTeamName,
        underdogProbability: metrics.underdogProbability,
        tiltStatus: metrics.tiltStatus,
        equationText: metrics.equationText,
        language: userLang
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.text || data.translations)) {
        return {
          text: data.translations?.[userLang] || data.text || fallback.text,
          translations: {
            en: data.translations?.en || fallback.translations.en,
            hi: data.translations?.hi || fallback.translations.hi,
            mr: data.translations?.mr || fallback.translations.mr
          },
          metrics,
          keyTacticalReason: data.keyTacticalReason || fallback.keyTacticalReason,
          generatedAt: new Date().toLocaleTimeString(),
          isAiGenerated: true
        };
      }
    }
  } catch (err) {
    console.warn('[WinProbEngine] Server AI call failed, utilizing local calibrated fallback:', err);
  }

  return {
    text: fallback.text,
    translations: fallback.translations,
    metrics,
    keyTacticalReason: fallback.keyTacticalReason,
    generatedAt: new Date().toLocaleTimeString(),
    isAiGenerated: false
  };
}

/**
 * Custom hook to track real-time Win Probability & AI Commentary
 */
export function useWinProbabilityEngine(
  match: any,
  language: CommentaryLanguage = 'en',
  autoFetchOnMajorSwing = true
) {
  const [metrics, setMetrics] = useState<WinProbabilityMetrics>(() => calculateWinProbabilityDetails(match));
  const [commentary, setCommentary] = useState<WinProbabilityCommentary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prevProbA, setPrevProbA] = useState<number | null>(null);

  // Recalculate metrics synchronously whenever match updates
  useEffect(() => {
    if (!match) return;
    const current = calculateWinProbabilityDetails(match, prevProbA);
    setMetrics(current);

    // If first load or huge swing occurred
    const swing = prevProbA !== null ? Math.abs(current.probA - prevProbA) : 0;
    if (autoFetchOnMajorSwing && (commentary === null || swing >= 15)) {
      loadCommentary(current);
    }
    setPrevProbA(current.probA);
  }, [
    match?.innings1?.runs,
    match?.innings1?.wickets,
    match?.innings1?.ballsBowled,
    match?.innings2?.runs,
    match?.innings2?.wickets,
    match?.innings2?.ballsBowled,
    match?.currentInningsNum,
    match?.targetRuns
  ]);

  const loadCommentary = useCallback(async (customMetrics?: WinProbabilityMetrics) => {
    setIsLoading(true);
    try {
      const activeMetrics = customMetrics || metrics;
      const res = await fetchAIWinProbabilityCommentary(match, language, prevProbA);
      setCommentary(res);
    } finally {
      setIsLoading(false);
    }
  }, [match, language, metrics, prevProbA]);

  return {
    metrics,
    commentary,
    isLoading,
    refreshCommentary: loadCommentary
  };
}
