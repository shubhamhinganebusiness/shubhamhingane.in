/**
 * cricketPrizeStorage.ts
 * Manages tournament & match prize money, sponsors, trophies, and broadcast tickers.
 */

export interface TournamentPrize {
  id: string;
  category?: 'tournament_1st' | 'tournament_2nd' | 'tournament_3rd' | 'tournament_4th' | 'man_of_series' | 'best_batsman' | 'best_bowler' | 'custom' | string;
  title: string;
  subtitle?: string;
  amount: string;
  currency?: string;
  currencySymbol?: string;
  personName?: string;
  personPhoto?: string;
  personDesignation?: string;
  sponsorName?: string;
  sponsorPhoto?: string;
  sponsorDesignation?: string;
  tagline?: string;
  trophyType?: string;
  isActive?: boolean;
  customBadge?: string;
  iconType?: string;
}

export const STANDARD_TOURNAMENT_PRIZES: TournamentPrize[] = [
  {
    id: 'first_prize',
    category: 'tournament_1st',
    title: '1st Prize / Champion',
    subtitle: 'Grand Champions Cup & Cash',
    amount: '75,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: 'Champion Trophy & Cash Sponsored By',
    trophyType: 'gold',
    isActive: true,
  },
  {
    id: 'second_prize',
    category: 'tournament_2nd',
    title: '2nd Prize / Runner-Up',
    subtitle: 'Runners-Up Shield & Cash',
    amount: '35,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: 'Runner-Up Trophy & Cash Sponsored By',
    trophyType: 'silver',
    isActive: true,
  },
  {
    id: 'third_prize',
    category: 'tournament_3rd',
    title: '3rd Prize',
    subtitle: '3rd Place Trophy & Cash',
    amount: '15,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: '3rd Prize Trophy Sponsored By',
    trophyType: 'bronze',
    isActive: true,
  },
  {
    id: 'fourth_prize',
    category: 'tournament_4th',
    title: '4th Prize',
    subtitle: 'Semi-Finalist Trophy & Cash',
    amount: '7,500',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: '4th Prize Sponsored By',
    trophyType: 'bronze',
    isActive: false,
  },
  {
    id: 'man_of_series',
    category: 'man_of_series',
    title: 'Man of the Series',
    subtitle: 'Player of the Tournament',
    amount: '5,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: 'Grand Cash Prize Sponsored By',
    trophyType: 'special',
    isActive: true,
  },
  {
    id: 'best_batsman',
    category: 'best_batsman',
    title: 'Best Batsman Award',
    subtitle: 'Orange Cap Leading Run Scorer',
    amount: '3,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: 'Cash Prize Sponsored By',
    trophyType: 'bat',
    isActive: true,
  },
  {
    id: 'best_bowler',
    category: 'best_bowler',
    title: 'Best Bowler Award',
    subtitle: 'Purple Cap Leading Wicket Taker',
    amount: '3,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: '',
    personPhoto: '',
    personDesignation: '',
    sponsorName: '',
    sponsorPhoto: '',
    sponsorDesignation: '',
    tagline: 'Cash Prize Sponsored By',
    trophyType: 'ball',
    isActive: true,
  },
];

export const SAMPLE_DEMO_PRIZES: TournamentPrize[] = [
  {
    id: 'first_prize',
    category: 'tournament_1st',
    title: '1st Prize / Champion',
    subtitle: 'Gully Champions Trophy & Cash',
    amount: '1,00,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: 'Shri Sharad Pawar',
    personPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Chief Patron & MLA',
    sponsorName: 'Shri Sharad Pawar',
    sponsorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    sponsorDesignation: 'Chief Patron & MLA',
    tagline: 'Champion Trophy & Cash Sponsored By',
    trophyType: 'gold',
    isActive: true,
  },
  {
    id: 'second_prize',
    category: 'tournament_2nd',
    title: '2nd Prize / Runner-Up',
    subtitle: 'Runners-Up Shield & Cash',
    amount: '51,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: 'Dattatray Patil',
    personPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Sarpanch, Grampanchayat',
    sponsorName: 'Dattatray Patil',
    sponsorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    sponsorDesignation: 'Sarpanch, Grampanchayat',
    tagline: 'Runner-Up Trophy & Cash Sponsored By',
    trophyType: 'silver',
    isActive: true,
  },
  {
    id: 'third_prize',
    category: 'tournament_3rd',
    title: '3rd Prize',
    subtitle: '3rd Place Trophy & Cash',
    amount: '25,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: 'Sunil Jagtap',
    personPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Youth Sports President',
    sponsorName: 'Sunil Jagtap',
    sponsorPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    sponsorDesignation: 'Youth Sports President',
    tagline: '3rd Prize Trophy Sponsored By',
    trophyType: 'bronze',
    isActive: true,
  },
  {
    id: 'man_of_series',
    category: 'man_of_series',
    title: 'Man of the Series',
    subtitle: 'Player of the Tournament',
    amount: '11,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: 'Ganesh Shinde',
    personPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    personDesignation: 'Sports Club Secretary',
    sponsorName: 'Ganesh Shinde',
    sponsorPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    sponsorDesignation: 'Sports Club Secretary',
    tagline: 'Grand Cash Prize Sponsored By',
    trophyType: 'special',
    isActive: true,
  },
  {
    id: 'best_batsman',
    category: 'best_batsman',
    title: 'Best Batsman Award',
    subtitle: 'Orange Cap Leading Run Scorer',
    amount: '5,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: 'Ravi Deshmukh',
    personPhoto: '',
    personDesignation: 'Merchant Association',
    sponsorName: 'Ravi Deshmukh',
    sponsorPhoto: '',
    sponsorDesignation: 'Merchant Association',
    tagline: 'Cash Prize Sponsored By',
    trophyType: 'bat',
    isActive: true,
  },
  {
    id: 'best_bowler',
    category: 'best_bowler',
    title: 'Best Bowler Award',
    subtitle: 'Purple Cap Leading Wicket Taker',
    amount: '5,000',
    currency: '₹',
    currencySymbol: '₹',
    personName: 'Vikas Kadam',
    personPhoto: '',
    personDesignation: 'Gully Cricket Club',
    sponsorName: 'Vikas Kadam',
    sponsorPhoto: '',
    sponsorDesignation: 'Gully Cricket Club',
    tagline: 'Cash Prize Sponsored By',
    trophyType: 'ball',
    isActive: true,
  },
];

const GLOBAL_PRIZES_KEY = 'cricket_tournament_prizes';

function normalizePrize(p: any): TournamentPrize {
  return {
    id: p.id || `prize_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    category: p.category || 'custom',
    title: p.title || 'Tournament Award',
    subtitle: p.subtitle || '',
    amount: String(p.amount ?? ''),
    currency: p.currency || p.currencySymbol || '₹',
    currencySymbol: p.currencySymbol || p.currency || '₹',
    personName: p.personName || p.sponsorName || '',
    personPhoto: p.personPhoto || p.sponsorPhoto || '',
    personDesignation: p.personDesignation || p.sponsorDesignation || '',
    sponsorName: p.sponsorName || p.personName || '',
    sponsorPhoto: p.sponsorPhoto || p.personPhoto || '',
    sponsorDesignation: p.sponsorDesignation || p.personDesignation || '',
    tagline: p.tagline || 'Award Sponsored By',
    trophyType: p.trophyType || 'special',
    isActive: p.isActive !== false,
    customBadge: p.customBadge || '',
    iconType: p.iconType || '',
  };
}

/**
 * Get prizes for a match (or globally if no matchId or matchId specific key doesn't exist)
 */
export function getTournamentPrizes(matchId?: string): TournamentPrize[] {
  try {
    if (matchId) {
      const matchKey = `cricket_tournament_prizes_${matchId}`;
      const matchStored = localStorage.getItem(matchKey);
      if (matchStored) {
        const parsed = JSON.parse(matchStored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizePrize);
        }
      }
    }

    const stored = localStorage.getItem(GLOBAL_PRIZES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizePrize);
      }
    }
  } catch (err) {
    console.warn('Error reading tournament prizes from localStorage:', err);
  }

  return STANDARD_TOURNAMENT_PRIZES;
}

/**
 * Get tournament prizes by tournamentId
 */
export function getTournamentPrizesByTournamentId(tournamentId?: string): TournamentPrize[] {
  try {
    if (tournamentId) {
      const tourKey = `cricket_tournament_prizes_${tournamentId}`;
      const tourStored = localStorage.getItem(tourKey);
      if (tourStored) {
        const parsed = JSON.parse(tourStored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizePrize);
        }
      }
    }
    return getTournamentPrizes();
  } catch (err) {
    console.warn('Error reading tournament prizes for tournament ID:', err);
    return STANDARD_TOURNAMENT_PRIZES;
  }
}

/**
 * Save tournament prizes
 */
export async function saveTournamentPrizes(prizes: TournamentPrize[], matchId?: string): Promise<void> {
  const normalized = prizes.map(normalizePrize);
  const json = JSON.stringify(normalized);

  try {
    localStorage.setItem(GLOBAL_PRIZES_KEY, json);
    if (matchId) {
      localStorage.setItem(`cricket_tournament_prizes_${matchId}`, json);
    }
  } catch (err) {
    console.warn('Error writing tournament prizes to localStorage:', err);
  }

  // Dispatch events for live components and multi-tab sync
  try {
    window.dispatchEvent(
      new CustomEvent('cricket_prizes_updated', {
        detail: { prizes: normalized, matchId },
      })
    );
  } catch (_) {}

  try {
    const bc = new BroadcastChannel('cricket_overlay_channel');
    bc.postMessage({ type: 'PRIZES_UPDATED', prizes: normalized, matchId });
    setTimeout(() => {
      try {
        bc.close();
      } catch (_) {}
    }, 500);
  } catch (_) {}
}

/**
 * Save tournament prizes specifically for a tournamentId
 */
export async function saveTournamentPrizesForTournament(tournamentId: string, prizes: TournamentPrize[]): Promise<void> {
  const normalized = prizes.map(normalizePrize);
  const json = JSON.stringify(normalized);

  try {
    if (tournamentId) {
      localStorage.setItem(`cricket_tournament_prizes_${tournamentId}`, json);
    }
    localStorage.setItem(GLOBAL_PRIZES_KEY, json);
  } catch (err) {
    console.warn('Error writing tournament prizes for tournament to localStorage:', err);
  }

  try {
    window.dispatchEvent(
      new CustomEvent('cricket_prizes_updated', {
        detail: { prizes: normalized, tournamentId },
      })
    );
  } catch (_) {}

  try {
    const bc = new BroadcastChannel('cricket_overlay_channel');
    bc.postMessage({ type: 'PRIZES_UPDATED', prizes: normalized, tournamentId });
    setTimeout(() => {
      try {
        bc.close();
      } catch (_) {}
    }, 500);
  } catch (_) {}
}

/**
 * Filter valid and active prizes (must be active and have either personName or amount)
 */
export function getValidActivePrizes(prizes?: TournamentPrize[]): TournamentPrize[] {
  if (!Array.isArray(prizes)) return [];
  return prizes.filter(
    (p) =>
      p.isActive !== false &&
      (Boolean(p.personName?.trim()) ||
        Boolean(p.sponsorName?.trim()) ||
        Boolean(p.amount?.trim()))
  );
}

/**
 * Subscribe to realtime updates for tournament prizes
 */
export function subscribeToTournamentPrizes(
  callback: (prizes: TournamentPrize[]) => void,
  matchId?: string
): () => void {
  const handleUpdate = (e: Event) => {
    const customEvt = e as CustomEvent;
    if (customEvt.detail?.prizes) {
      callback(customEvt.detail.prizes.map(normalizePrize));
    } else {
      callback(getTournamentPrizes(matchId));
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === GLOBAL_PRIZES_KEY || (matchId && e.key === `cricket_tournament_prizes_${matchId}`)) {
      callback(getTournamentPrizes(matchId));
    }
  };

  window.addEventListener('cricket_prizes_updated', handleUpdate);
  window.addEventListener('storage', handleStorage);

  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel('cricket_overlay_channel');
    bc.onmessage = (msg) => {
      if (msg.data?.type === 'PRIZES_UPDATED' && msg.data?.prizes) {
        callback(msg.data.prizes.map(normalizePrize));
      }
    };
  } catch (_) {}

  return () => {
    window.removeEventListener('cricket_prizes_updated', handleUpdate);
    window.removeEventListener('storage', handleStorage);
    if (bc) {
      try {
        bc.close();
      } catch (_) {}
    }
  };
}

/**
 * Format a single prize sponsor description for tickers / commentary
 */
export function formatPrizeSponsorText(prize: TournamentPrize): string {
  const title = prize.title || 'Tournament Award';
  const curr = prize.currencySymbol || prize.currency || '₹';
  const amtStr = prize.amount ? `${curr}${prize.amount}` : '';
  const sponsor = prize.personName || prize.sponsorName || '';
  const desig = prize.personDesignation || prize.sponsorDesignation || '';

  const parts: string[] = [title];
  if (amtStr) parts.push(`(${amtStr})`);
  if (sponsor) {
    const spStr = desig ? `${sponsor} [${desig}]` : sponsor;
    parts.push(`Sponsored by: ${spStr}`);
  }
  return parts.join(' • ');
}

/**
 * Format all active prizes into a continuous broadcast sponsor ticker
 */
export function formatAllPrizesSponsorTicker(prizes: TournamentPrize[]): string {
  const valid = getValidActivePrizes(prizes);
  if (valid.length === 0) return '';
  return valid.map((p) => formatPrizeSponsorText(p)).join('   🏆   ');
}
