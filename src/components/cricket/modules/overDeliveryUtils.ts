/**
 * overDeliveryUtils.ts
 *
 * Centralized utility for computing active over numbers, filtering deliveries
 * into their respective overs, and extracting visual pill details for
 * Cricket scoreboard, scorebug, and broadcast overlays.
 */

export interface DeliveryPill {
  label: string;
  pillStyle: string;
  type: 'dot' | 'run' | 'four' | 'six' | 'wicket' | 'extra';
}

/**
 * Validates whether a commentary item represents an actual ball delivery
 * (excluding announcements, milestones, breaks, and non-delivery items).
 */
export function isBallDelivery(c: any): boolean {
  if (!c) return false;

  // Exclude non-delivery events
  if (
    c.type === 'milestone' ||
    c.type === 'announcement' ||
    c.type === 'break' ||
    c.type === 'info' ||
    c.specialEvent === 'retire_hurt' ||
    c.announcementType === 'new_batsman' ||
    c.announcementType === 'new_bowler' ||
    c.id?.startsWith('comm-bat-upd-') ||
    c.id?.startsWith('comm-bowl-upd-') ||
    c.id?.startsWith('comm-over-finish-') ||
    c.id?.startsWith('comm-chase-') ||
    c.id?.startsWith('comm-potm-') ||
    c.id?.startsWith('comm-inn-break-')
  ) {
    return false;
  }

  const desc = (c.description || '').toLowerCase();
  if (
    desc.includes('retired hurt') ||
    desc.includes('new batsman') ||
    desc.includes('come on crease') ||
    desc.includes('will bowl the') ||
    desc.includes('bowler into the attack') ||
    desc.includes('started') ||
    desc.includes('toss') ||
    desc.includes('innings break') ||
    desc.includes('run chase equation') ||
    desc.includes('match launched') ||
    desc.includes('draft match')
  ) {
    // If it has no delivery characteristics, treat as non-delivery
    if (
      !c.ballScore &&
      !c.extraType &&
      !c.isWide &&
      !c.isNoBall &&
      c.type !== 'wicket' &&
      c.type !== 'boundary' &&
      c.type !== 'extra' &&
      c.type !== 'normal'
    ) {
      return false;
    }
  }

  // Must have signs of a delivery
  return Boolean(
    c.ballScore ||
    c.extraType ||
    c.isWide ||
    c.isNoBall ||
    c.type === 'wicket' ||
    c.type === 'boundary' ||
    c.type === 'extra' ||
    c.type === 'normal' ||
    c.type === 'dot' ||
    c.type === 'runs'
  );
}

/**
 * Returns the 0-based over index for a commentary delivery.
 * Accurately handles illegal deliveries (wides, no balls, penalty runs) at the start of an over.
 */
export function getDeliveryOverIndex(c: any): number {
  if (!c) return -1;

  // 1. Explicit overIndex stored directly in the commentary item
  if (typeof c.overIndex === 'number' && !isNaN(c.overIndex)) {
    return c.overIndex;
  }

  // 2. Explicit 1-based overNumber stored in the commentary item
  if (typeof c.overNumber === 'number' && !isNaN(c.overNumber) && c.overNumber > 0) {
    return c.overNumber - 1;
  }

  // 3. Parse overBall string (e.g. "0.0", "0.1", "1.0", "1.6", "2.3")
  if (c.overBall && typeof c.overBall === 'string') {
    const parts = c.overBall.split('.');
    if (parts.length >= 2) {
      const overPart = parseInt(parts[0], 10);
      if (!isNaN(overPart)) {
        return overPart;
      }
    }
    const num = parseFloat(c.overBall);
    if (!isNaN(num)) {
      return Math.floor(num);
    }
  }

  return -1;
}

/**
 * Returns whether a delivery belongs to the specified 0-based target over index.
 */
export function isDeliveryInTargetOver(c: any, targetOverNo: number): boolean {
  if (!isBallDelivery(c)) return false;
  return getDeliveryOverIndex(c) === targetOverNo;
}

/**
 * Calculates the active over number (0-based) for the current innings.
 *
 * During live play:
 * - balls 0..5 -> over 0 (Over 1)
 * - balls 6..11 -> over 1 (Over 2) -- Even when 0 legal balls have been bowled in Over 2,
 *   or when wide/no-ball/penalty is bowled at the start of Over 2!
 * - balls 12..17 -> over 2 (Over 3)
 *
 * When match or innings is completed:
 * - Returns the final over bowled (e.g. over 19 for 20 overs bowled).
 */
export function calculateActiveOverNumber(
  ballsBowled?: number,
  matchStatus?: string,
  oversLimit?: number,
  wickets?: number,
  isSuperOver?: boolean,
  superOverWicketLimit?: number
): number {
  const balls = Number(ballsBowled) || 0;
  const maxOvers = Number(oversLimit) || 20;
  const maxWkts = isSuperOver ? (Number(superOverWicketLimit) || 2) : 10;
  const wkts = Number(wickets) || 0;

  const isInningsCompleted =
    matchStatus === 'completed' ||
    (maxOvers > 0 && balls >= maxOvers * 6) ||
    wkts >= maxWkts;

  if (isInningsCompleted) {
    if (balls <= 0) return 0;
    return Math.min(maxOvers - 1, Math.max(0, Math.floor((balls - 1) / 6)));
  }

  // Live innings in progress:
  // Math.floor(balls / 6) cleanly points to the over currently in progress.
  // When an over completes (e.g. balls = 6), the active over becomes over 1 (Over 2).
  const currentOver = Math.floor(balls / 6);
  return Math.min(Math.max(0, currentOver), Math.max(0, maxOvers - 1));
}

/**
 * Extracts delivery pill visual details (label and CSS pill styling)
 * for rendering in scoreboard ball-by-ball timeline strips.
 */
export function getDeliveryPillDetails(c: any): DeliveryPill {
  if (!c) {
    return { label: '0', pillStyle: 'bg-slate-800 text-slate-400 border-slate-700 font-bold', type: 'dot' };
  }

  const bScore = String(c.ballScore || '').trim().toUpperCase();
  const extraType = String(c.extraType || '').toLowerCase();
  const desc = String(c.description || '').toLowerCase();
  const runsOffBat = typeof c.runsOffBat === 'number' ? c.runsOffBat : undefined;
  const runs = typeof c.runs === 'number' ? c.runs : undefined;

  // 1. Wicket Delivery
  if (c.type === 'wicket' || bScore === 'W' || desc.startsWith('out!') || desc.includes('wicket')) {
    return {
      label: 'W',
      pillStyle: 'bg-rose-600 text-white border-rose-400 font-black shadow-xs animate-pulse',
      type: 'wicket'
    };
  }

  // 2. Wide Delivery (including extra runs completed on wide)
  const isWideDelivery =
    c.isWide === true ||
    extraType === 'wide' ||
    bScore.includes('WD') ||
    bScore.includes('WIDE') ||
    (c.type === 'extra' && desc.includes('wide')) ||
    /\bwide\b/i.test(desc);

  if (isWideDelivery) {
    let extraRuns = 0;
    if (bScore === 'WD' || bScore === 'WIDE') {
      extraRuns = 0;
    } else if (bScore.includes('+')) {
      const m = bScore.match(/\+(\d+)/);
      if (m) extraRuns = parseInt(m[1], 10);
    } else if (/^(\d+)WD$/i.test(bScore)) {
      const m = bScore.match(/^(\d+)WD$/i);
      if (m && parseInt(m[1], 10) > 1) extraRuns = parseInt(m[1], 10) - 1;
    } else if (typeof runsOffBat === 'number' && runsOffBat > 0) {
      extraRuns = runsOffBat;
    } else {
      const m = desc.match(/plus\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*extra\s*runs?/i);
      if (m) extraRuns = parseInt(m[1], 10);
    }

    if (extraRuns > 0) {
      return {
        label: `WD+${extraRuns}`,
        pillStyle: 'bg-orange-600 text-white border-orange-300 font-black shadow-xs',
        type: 'extra'
      };
    }
    return {
      label: 'WD',
      pillStyle: 'bg-orange-500 text-white border-orange-400 font-black shadow-xs',
      type: 'extra'
    };
  }

  // 3. No Ball Delivery (including runs hit off the bat)
  const isNoBallDelivery =
    c.isNoBall === true ||
    extraType === 'noball' ||
    bScore.includes('NB') ||
    (c.type === 'extra' && (desc.includes('no-ball') || desc.includes('no ball'))) ||
    /\bno-?ball\b/i.test(desc);

  if (isNoBallDelivery) {
    let batRuns = 0;
    if (bScore.includes('+')) {
      const m = bScore.match(/\+(\d+)/);
      if (m) batRuns = parseInt(m[1], 10);
    } else if (/^(\d+)NB$/i.test(bScore)) {
      const m = bScore.match(/^(\d+)NB$/i);
      if (m && parseInt(m[1], 10) > 1) batRuns = parseInt(m[1], 10) - 1;
    } else if (typeof runsOffBat === 'number' && runsOffBat > 0) {
      batRuns = runsOffBat;
    } else {
      const m = desc.match(/plus\s*(\d+)\s*runs?/i) || desc.match(/(\d+)\s*runs?\s*(?:scored|to\s*batsman|off\s*the\s*bat)/i);
      if (m) batRuns = parseInt(m[1], 10);
    }

    if (batRuns >= 6) {
      return {
        label: `NB+${batRuns}`,
        pillStyle: 'bg-gradient-to-r from-pink-500 to-amber-500 text-slate-950 border-amber-300 font-black shadow-xs',
        type: 'extra'
      };
    } else if (batRuns >= 4) {
      return {
        label: `NB+${batRuns}`,
        pillStyle: 'bg-gradient-to-r from-pink-500 to-emerald-500 text-white border-emerald-300 font-black shadow-xs',
        type: 'extra'
      };
    } else if (batRuns > 0) {
      return {
        label: `NB+${batRuns}`,
        pillStyle: 'bg-pink-700 text-white border-pink-400 font-black shadow-xs',
        type: 'extra'
      };
    }
    return {
      label: 'NB',
      pillStyle: 'bg-pink-600 text-white border-pink-400 font-black shadow-xs',
      type: 'extra'
    };
  }

  // 4. Penalty Runs
  const isPenaltyDelivery =
    extraType === 'penalty' ||
    /^P\+?\d+/i.test(bScore) ||
    /^PEN/i.test(bScore) ||
    desc.includes('penalty run');

  if (isPenaltyDelivery) {
    let pRuns = 5;
    const m = bScore.match(/\d+/) || desc.match(/\+(\d+)\s*penalty/i) || desc.match(/(\d+)\s*penalty/i);
    if (m) pRuns = parseInt(m[0], 10);
    return {
      label: `P+${pRuns}`,
      pillStyle: 'bg-purple-600 text-white border-purple-400 font-black shadow-xs',
      type: 'extra'
    };
  }

  // 5. Boundary 6
  const isExplicitSix =
    bScore === '6' ||
    bScore === '6S' ||
    bScore === 'SIX' ||
    runsOffBat === 6 ||
    runs === 6;
  const isDescSix =
    !isExplicitSix &&
    (desc.includes('six') || desc.includes('6 runs') || desc.includes('maximum') || desc.includes('षटकार') || desc.includes('छक्का') || desc.includes('६'));

  if (isExplicitSix || (c.type === 'boundary' && isDescSix)) {
    return {
      label: '6',
      pillStyle: 'bg-amber-400 text-slate-950 border-amber-200 font-black shadow-xs',
      type: 'six'
    };
  }

  // 6. Boundary 4
  const isExplicitFour =
    bScore === '4' ||
    bScore === '4S' ||
    bScore === 'FOUR' ||
    runsOffBat === 4 ||
    runs === 4;
  const isDescFour =
    !isExplicitFour &&
    (desc.includes('four') || desc.includes('4 runs') || desc.includes('boundary') || desc.includes('चौकार') || desc.includes('चौका') || desc.includes('४'));

  if (isExplicitFour || c.type === 'boundary' || isDescFour) {
    return {
      label: '4',
      pillStyle: 'bg-sky-500 text-white border-sky-300 font-black shadow-xs',
      type: 'four'
    };
  }

  // 7. Leg Bye / Bye
  if (extraType === 'legbye' || /lb/i.test(bScore) || desc.includes('leg bye') || desc.includes('leg-bye')) {
    let lb = 1;
    const m = bScore.match(/(\d+)/);
    if (m) lb = parseInt(m[1], 10);
    return {
      label: `${lb}lb`,
      pillStyle: 'bg-emerald-800 text-emerald-100 border-emerald-600 font-bold',
      type: 'extra'
    };
  }

  if (extraType === 'bye' || /(?:^|\d+)B$/i.test(bScore) || desc.includes('bye')) {
    let b = 1;
    const m = bScore.match(/(\d+)/);
    if (m) b = parseInt(m[1], 10);
    return {
      label: `${b}b`,
      pillStyle: 'bg-emerald-800 text-emerald-100 border-emerald-600 font-bold',
      type: 'extra'
    };
  }

  // 8. Normal Runs or Dots
  let normalVal = 0;
  if (/^[0-6]$/.test(bScore)) {
    normalVal = parseInt(bScore, 10);
  } else if (bScore === '1D') {
    return {
      label: '1D',
      pillStyle: 'bg-slate-700 text-amber-300 border-slate-500 font-bold',
      type: 'run'
    };
  } else if (typeof runsOffBat === 'number' && !isNaN(runsOffBat)) {
    normalVal = runsOffBat;
  } else if (typeof runs === 'number' && !isNaN(runs)) {
    normalVal = runs;
  } else {
    const m = desc.match(/(\d+)\s*run/i);
    if (m) normalVal = parseInt(m[1], 10);
  }

  if (normalVal === 0 || c.type === 'dot') {
    return {
      label: '0',
      pillStyle: 'bg-slate-800 text-slate-300 border-slate-700 font-bold',
      type: 'dot'
    };
  }

  return {
    label: String(normalVal),
    pillStyle: 'bg-slate-700 text-white border-slate-600 font-bold',
    type: 'run'
  };
}
