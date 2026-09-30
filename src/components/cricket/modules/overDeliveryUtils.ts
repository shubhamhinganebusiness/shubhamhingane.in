/**
 * Cricket over and delivery utilities for scoreboard and spectator widgets.
 */

export interface DeliveryPillDetails {
  label: string;
  pillStyle: string;
  color: string;
}

/**
 * Calculates the 0-based active over number for displaying deliveries.
 * When an innings is in progress, points to the current over being bowled (Math.floor(ballsBowled / 6)).
 * If the innings/match has completed, returns the final completed over index.
 */
export function calculateActiveOverNumber(
  ballsBowled?: number,
  matchStatus?: string,
  oversLimit?: number,
  wickets?: number,
  isSuperOver?: boolean,
  superOverWicketLimit?: number
): number {
  const bowled = typeof ballsBowled === 'number' && !isNaN(ballsBowled) ? Math.max(0, ballsBowled) : 0;
  if (bowled === 0) return 0;

  const maxWickets = isSuperOver ? (superOverWicketLimit || 2) : 10;
  const isAllOut = typeof wickets === 'number' && wickets >= maxWickets;
  const isOversLimitReached = typeof oversLimit === 'number' && oversLimit > 0 && bowled >= oversLimit * 6;
  const isMatchCompleted = matchStatus === 'completed' || isAllOut || isOversLimitReached;

  if (isMatchCompleted) {
    return Math.max(0, Math.floor((bowled - 1) / 6));
  }

  return Math.floor(bowled / 6);
}

/**
 * Validates if a commentary item represents an actual ball delivery in the targeted 0-based over index.
 */
export function isDeliveryInTargetOver(commentary: any, targetOverNo: number): boolean {
  if (!commentary) return false;

  // Reject non-delivery commentary entries
  if (
    commentary.overBall === '0.0' ||
    commentary.type === 'milestone' ||
    commentary.type === 'announcement' ||
    commentary.type === 'break' ||
    commentary.type === 'info' ||
    commentary.specialEvent === 'retire_hurt' ||
    commentary.announcementType === 'new_batsman' ||
    commentary.announcementType === 'new_bowler' ||
    commentary.id?.startsWith('comm-bat-upd-') ||
    commentary.id?.startsWith('comm-bowl-upd-') ||
    commentary.id?.startsWith('comm-over-finish-')
  ) {
    return false;
  }

  const desc = (commentary.description || '').toLowerCase();
  if (
    desc.includes('started') ||
    desc.includes('created') ||
    desc.includes('toss') ||
    desc.includes('innings declared') ||
    desc.includes('bulletin') ||
    desc.includes('match launched') ||
    desc.includes('draft match') ||
    desc.includes('retired hurt') ||
    desc.includes('new batsman') ||
    desc.includes('come on crease') ||
    desc.includes('will bowl the') ||
    desc.includes('bowler into the attack')
  ) {
    return false;
  }

  if (commentary.overBall && typeof commentary.overBall === 'string') {
    const parts = commentary.overBall.trim().split('.');
    if (parts.length === 2) {
      const overPart = parseInt(parts[0], 10);
      const ballPart = parseInt(parts[1], 10);
      if (!isNaN(overPart) && !isNaN(ballPart)) {
        if (overPart === 0 && ballPart === 0) return false;
        const overIndex = ballPart === 0 ? overPart - 1 : overPart;
        return overIndex === targetOverNo;
      }
    }
  }

  if (typeof commentary.overIndex === 'number') {
    return commentary.overIndex === targetOverNo;
  }

  return false;
}

/**
 * Returns the badge label and styling classes for a delivery commentary item.
 */
export function getDeliveryPillDetails(comm: any): DeliveryPillDetails {
  if (!comm) return { label: '', pillStyle: 'hidden', color: 'hidden' };

  // Explicitly reject non-delivery commentary
  if (
    comm.overBall === '0.0' ||
    comm.type === 'milestone' ||
    comm.type === 'announcement' ||
    comm.type === 'break' ||
    comm.type === 'info' ||
    comm.specialEvent === 'retire_hurt' ||
    comm.announcementType === 'new_batsman' ||
    comm.announcementType === 'new_bowler' ||
    comm.id?.startsWith('comm-bat-upd-') ||
    comm.id?.startsWith('comm-bowl-upd-') ||
    comm.id?.startsWith('comm-over-finish-')
  ) {
    return { label: '', pillStyle: 'hidden', color: 'hidden' };
  }

  const desc = (comm.description || '').toLowerCase();
  const bScore = String(comm.ballScore || '').trim().toUpperCase();
  const hasRunsOffBat = typeof comm.runsOffBat === 'number' && !isNaN(comm.runsOffBat);
  const runsOffBat = hasRunsOffBat ? Number(comm.runsOffBat) : null;
  const hasDirectRuns = typeof comm.runs === 'number' && !isNaN(comm.runs);
  const directRuns = hasDirectRuns ? Number(comm.runs) : null;

  // Wicket
  if (
    comm.type === 'wicket' ||
    bScore === 'W' ||
    bScore.startsWith('W+') ||
    desc.includes('wicket') ||
    desc.includes('out!') ||
    desc.includes('bowled') ||
    desc.includes('caught') ||
    desc.includes('lbw') ||
    desc.includes('run out') ||
    desc.includes('stumped')
  ) {
    const style = 'bg-rose-600 text-white border-rose-500 font-extrabold shadow-inner';
    return { label: 'W', pillStyle: style, color: style };
  }

  // Check for No Ball (including taken runs)
  const isNoBallDelivery =
    comm.isNoBall ||
    comm.extraType === 'noball' ||
    (comm.type === 'extra' && (desc.includes('no ball') || desc.includes('no-ball') || (desc.includes('no') && desc.includes('ball')) || desc.includes('nb'))) ||
    /nb/i.test(bScore);

  if (isNoBallDelivery) {
    let batRuns = runsOffBat !== null ? runsOffBat : 0;
    if (!batRuns && bScore) {
      const m = bScore.match(/(\d+)/);
      if (m) batRuns = parseInt(m[1], 10);
    }
    if (!batRuns) {
      const m = desc.match(/(?:plus|\+)\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*runs?\s*(?:scored|to\s*batsman|taken)/i) || desc.match(/(\d+)\s*(?:runs?|धावा|रन)/i);
      if (m) batRuns = parseInt(m[1], 10);
    }
    if (batRuns > 0) {
      const isSix = batRuns >= 6;
      const isFour = batRuns >= 4 && batRuns < 6;
      const style = isSix
        ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-slate-950 border-amber-400 font-black shadow shadow-pink-500/50 animate-pulse'
        : isFour
        ? 'bg-gradient-to-r from-pink-500 to-emerald-500 text-white border-emerald-400 font-black shadow-sm'
        : 'bg-pink-600 text-white border-pink-400 dark:bg-pink-700 font-extrabold shadow-sm';
      return { label: `NB+${batRuns}`, pillStyle: style, color: style };
    }
    const style = 'bg-pink-900/80 text-pink-200 border-pink-500/50 font-bold';
    return { label: 'NB', pillStyle: style, color: style };
  }

  // Check for Wide (including extra runs taken)
  const isWideDelivery = (comm.type === 'extra' && desc.includes('wide')) || /wd/i.test(bScore) || (comm as any).extraType === 'wide';
  if (isWideDelivery) {
    let extraRuns = 0;
    if (bScore === 'WD') {
      extraRuns = 0;
    } else if (bScore.includes('+')) {
      const m = bScore.match(/\+(\d+)/);
      if (m) extraRuns = parseInt(m[1], 10);
    } else if (runsOffBat !== null && runsOffBat > 0) {
      extraRuns = runsOffBat;
    } else {
      const m = desc.match(/plus\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*extra\s*runs?/i);
      if (m) extraRuns = parseInt(m[1], 10);
    }
    if (extraRuns > 0) {
      const style = 'bg-blue-600 text-white border-blue-400 dark:bg-blue-700 font-black shadow-sm';
      return { label: `WD+${extraRuns}`, pillStyle: style, color: style };
    }
    const style = 'bg-blue-900/80 text-blue-200 border-blue-500/50 font-bold';
    return { label: 'WD', pillStyle: style, color: style };
  }

  // Boundary 4 or 6
  if (comm.type === 'boundary') {
    const isExplicitFour = bScore === '4' || bScore === '4S' || bScore === 'FOUR' || runsOffBat === 4 || directRuns === 4;
    const isExplicitSix = bScore === '6' || bScore === '6S' || bScore === 'SIX' || runsOffBat === 6 || directRuns === 6;
    if (isExplicitFour) {
      const style = 'bg-emerald-600 text-white border-emerald-500 font-extrabold shadow-sm';
      return { label: '4', pillStyle: style, color: style };
    }
    if (isExplicitSix) {
      const style = 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow shadow-amber-500/50';
      return { label: '6', pillStyle: style, color: style };
    }
    const isDescSix = desc.includes('six') || desc.includes('6 runs') || desc.includes('maximum') || desc.includes('षटकार') || desc.includes('छक्का') || desc.includes('६') || /\b6\s*runs?\b/i.test(desc);
    if (isDescSix) {
      const style = 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow shadow-amber-500/50';
      return { label: '6', pillStyle: style, color: style };
    }
    const style = 'bg-emerald-600 text-white border-emerald-500 font-extrabold shadow-sm';
    return { label: '4', pillStyle: style, color: style };
  }

  // Extras (Leg Bye / Bye)
  if (comm.type === 'extra' || /lb|b/i.test(bScore)) {
    if (desc.includes('leg bye') || desc.includes('leg-bye') || desc.includes('legbye') || /lb/i.test(bScore) || (comm as any).extraType === 'legbye') {
      let lbRuns = 1;
      const mScore = bScore.match(/(\d+)\s*LB/i) || bScore.match(/^LB\s*(\d+)$/i) || bScore.match(/^(\d+)$/);
      if (mScore) lbRuns = parseInt(mScore[1], 10);
      else if (runsOffBat !== null && runsOffBat > 0) lbRuns = runsOffBat;
      const style = 'bg-emerald-900/80 text-emerald-200 border-emerald-500/50 font-bold';
      return { label: `${lbRuns}lb`, pillStyle: style, color: style };
    }
    if (desc.includes('bye') || /(?:^|\d+)B$/i.test(bScore) || (comm as any).extraType === 'bye') {
      let bRuns = 1;
      const mScore = bScore.match(/(\d+)\s*B/i) || bScore.match(/^B\s*(\d+)$/i) || bScore.match(/^(\d+)$/);
      if (mScore) bRuns = parseInt(mScore[1], 10);
      else if (runsOffBat !== null && runsOffBat > 0) bRuns = runsOffBat;
      const style = 'bg-sky-900/80 text-sky-200 border-sky-500/50 font-semibold';
      return { label: `${bRuns}b`, pillStyle: style, color: style };
    }
    const style = 'bg-slate-800 text-slate-300 border-slate-700';
    return { label: 'Ex', pillStyle: style, color: style };
  }

  // Runs off bat
  if (bScore === '6' || runsOffBat === 6 || directRuns === 6 || desc.includes('6 runs') || desc.includes('six') || desc.includes('maximum') || desc.includes('षटकार') || desc.includes('छक्का') || desc.includes('६') || /\b6\s*runs?\b/i.test(desc)) {
    const style = 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow shadow-amber-500/50';
    return { label: '6', pillStyle: style, color: style };
  }
  if (bScore === '4' || runsOffBat === 4 || directRuns === 4 || desc.includes('4 runs') || desc.includes('four') || desc.includes('boundary') || desc.includes('चौकार') || desc.includes('चौका') || desc.includes('४') || /\b4\s*runs?\b/i.test(desc)) {
    const style = 'bg-emerald-600 text-white border-emerald-500 font-extrabold shadow-sm';
    return { label: '4', pillStyle: style, color: style };
  }
  if (bScore === '1D' || desc.includes('declared run') || desc.includes('1d')) {
    const style = 'bg-cyan-900 text-cyan-200 border-cyan-400 font-black';
    return { label: '1D', pillStyle: style, color: style };
  }
  if (bScore === '3' || runsOffBat === 3 || directRuns === 3 || desc.includes('3 run') || desc.includes('three') || desc.includes('triple')) {
    const style = 'bg-slate-800 text-cyan-300 border-slate-600 font-black';
    return { label: '3', pillStyle: style, color: style };
  }
  if (bScore === '2' || runsOffBat === 2 || directRuns === 2 || desc.includes('2 run') || desc.includes('two') || desc.includes('couple') || desc.includes('double')) {
    const style = 'bg-slate-800 text-cyan-300 border-slate-600 font-black';
    return { label: '2', pillStyle: style, color: style };
  }
  if (bScore === '1' || runsOffBat === 1 || directRuns === 1 || desc.includes('1 run') || desc.includes('single') || desc.includes('one run')) {
    const style = 'bg-slate-800 text-cyan-300 border-slate-600 font-black';
    return { label: '1', pillStyle: style, color: style };
  }
  if (bScore === '0' || runsOffBat === 0 || directRuns === 0 || comm.type === 'dot' || desc.includes('dot') || desc.includes('no run') || desc.includes('0 run')) {
    const style = 'bg-slate-800 text-slate-300 border-slate-700 font-bold';
    return { label: '0', pillStyle: style, color: style };
  }

  const numMatch = desc.match(/(\d+)\s*(?:runs?)/);
  if (numMatch) {
    const style = 'bg-slate-800 text-cyan-300 border-slate-600 font-black';
    return { label: numMatch[1], pillStyle: style, color: style };
  }

  const style = 'bg-slate-800 text-slate-300 border-slate-700 font-bold';
  return { label: '0', pillStyle: style, color: style };
}
