import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Award, Medal, Crown, Sparkles, 
  Flame, Target, Zap
} from 'lucide-react';
import { 
  TournamentPrize, 
  getTournamentPrizes, 
  SAMPLE_DEMO_PRIZES 
} from '../../utils/cricketPrizeStorage';
import { useCommentaryLanguage } from './commentaryLanguage';

export type PresentationPhase = 'auto' | 'toss' | 'break' | 'post_match';

interface FullScreenPrizePodiumOverlayProps {
  match?: any;
  onClose?: () => void;
  initialPhase?: PresentationPhase;
  soundEnabled?: boolean;
}

// Play celebratory fanfare chord using Web Audio API (no external asset needed)
function playFanfareSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // G4, C5, E5, G5, C6
    const startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.09);

      gain.gain.setValueAtTime(0, startTime + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.18, startTime + idx * 0.09 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.09 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime + idx * 0.09);
      osc.stop(startTime + idx * 0.09 + 0.8);
    });

    setTimeout(() => {
      try { ctx.close(); } catch (_) {}
    }, 1500);
  } catch (_) {
    // AudioContext blocked by browser autoplay policy
  }
}

export const FullScreenPrizePodiumOverlay: React.FC<FullScreenPrizePodiumOverlayProps> = ({
  match,
  onClose,
  soundEnabled = true,
}) => {
  const [lang] = useCommentaryLanguage();
  const [soundOn] = useState<boolean>(soundEnabled);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // Ensure document body & HTML are transparent for live cricket video feed
  useEffect(() => {
    const prevBodyBg = document.body.style.backgroundColor;
    const prevHtmlBg = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
    return () => {
      document.body.style.backgroundColor = prevBodyBg;
      document.documentElement.style.backgroundColor = prevHtmlBg;
    };
  }, []);

  const [rawPrizes, setRawPrizes] = useState<TournamentPrize[]>(() => {
    if (match?.tournamentPrizes && Array.isArray(match.tournamentPrizes) && match.tournamentPrizes.length > 0) {
      return match.tournamentPrizes;
    }
    return getTournamentPrizes(match?.id);
  });

  // Play fanfare once on mount if sound enabled
  useEffect(() => {
    if (soundOn) {
      playFanfareSound();
    }
  }, []);

  // Listen to live prize updates
  useEffect(() => {
    const handlePrizesUpdated = (e: Event) => {
      const custom = e as CustomEvent<{ matchId?: string; prizes?: TournamentPrize[] }>;
      if (custom.detail?.prizes) {
        setRawPrizes(custom.detail.prizes);
      } else {
        setRawPrizes(getTournamentPrizes(match?.id));
      }
    };

    window.addEventListener('cricket_prizes_updated', handlePrizesUpdated);
    return () => {
      window.removeEventListener('cricket_prizes_updated', handlePrizesUpdated);
    };
  }, [match?.id]);

  // Find 4 main podium prizes (1st, 2nd, 3rd, 4th) for Slide 1
  const podiumPrizes = useMemo(() => {
    const fallbackSample = SAMPLE_DEMO_PRIZES;
    const findPrize = (cat: string, defSampleIndex: number) => {
      const found = rawPrizes.find(p => p.category === cat || p.id === cat);
      if (found && (found.personName || found.amount)) {
        return found;
      }
      // If user hasn't configured it yet, fallback to sample demo prize so screen is never blank
      const sample = fallbackSample[defSampleIndex];
      return {
        ...sample,
        personName: found?.personName || sample.personName,
        personPhoto: found?.personPhoto || sample.personPhoto,
        personDesignation: found?.personDesignation || sample.personDesignation,
        amount: found?.amount || sample.amount,
        title: found?.title || sample.title,
        tagline: found?.tagline || sample.tagline,
        currency: found?.currency || '₹',
        isActive: true,
      };
    };

    return {
      first: findPrize('tournament_1st', 0),
      second: findPrize('tournament_2nd', 1),
      third: findPrize('tournament_3rd', 2),
      fourth: findPrize('tournament_4th', 3),
    };
  }, [rawPrizes]);

  // Find 4 special honour prizes (Man of Series, Best Batsman, Best Bowler, Special/Sixes) for Slide 2
  const slide2Prizes = useMemo(() => {
    const fallbackSample = SAMPLE_DEMO_PRIZES;
    const findAward = (cat: string, defSampleIndex: number) => {
      const found = rawPrizes.find(p => p.category === cat || p.id === cat);
      if (found && (found.personName || found.amount)) {
        return found;
      }
      const sample = fallbackSample[defSampleIndex];
      return {
        ...sample,
        personName: found?.personName || sample?.personName || '',
        personPhoto: found?.personPhoto || sample?.personPhoto || '',
        personDesignation: found?.personDesignation || sample?.personDesignation || '',
        amount: found?.amount || sample?.amount || '',
        title: found?.title || sample?.title || '',
        tagline: found?.tagline || sample?.tagline || '',
        currency: found?.currency || '₹',
        isActive: true,
      };
    };

    // 4th award: look for custom award or maximum sixes in rawPrizes or sample
    const fourthAward = () => {
      const customPrizes = rawPrizes.filter(
        p => !['tournament_1st', 'tournament_2nd', 'tournament_3rd', 'tournament_4th', 'man_of_series', 'best_batsman', 'best_bowler'].includes(p.id) &&
             !['tournament_1st', 'tournament_2nd', 'tournament_3rd', 'tournament_4th', 'man_of_series', 'best_batsman', 'best_bowler'].includes(p.category) &&
             (p.personName || p.amount)
      );
      if (customPrizes.length > 0) {
        return customPrizes[0];
      }
      return fallbackSample[7] || {
        id: 'custom_sixes',
        category: 'custom',
        title: 'Maximum Sixes Award',
        personName: 'Sai Samarth Jewellers',
        personPhoto: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80',
        personDesignation: 'Gold Medal & Trophy Sponsor',
        amount: '5,000',
        currency: '₹',
        tagline: 'Award Sponsored By',
        isActive: true,
      };
    };

    return [
      {
        id: 'man_of_series',
        prize: findAward('man_of_series', 4),
        titleMr: 'मालिकावीर चषक व रोख पारितोषिक',
        titleHi: 'मैन ऑफ द सीरीज़ ट्रॉफी व नकद पुरस्कार',
        titleEn: 'Man of the Series Trophy & Cash',
        ribbonMr: 'मालिकावीर • सर्वोत्कृष्ट खेळाडू',
        ribbonHi: 'मैन ऑफ द सीरीज़ • सर्वश्रेष्ठ खिलाड़ी',
        ribbonEn: 'MAN OF THE SERIES',
        sponsorBadgeMr: 'मालिकावीर बक्षीस सौजन्य',
        sponsorBadgeHi: 'मैन ऑफ द सीरीज़ प्रायोजक',
        sponsorBadgeEn: 'SERIES SPONSOR',
        accentBorder: 'from-purple-400 via-pink-400 to-indigo-600 shadow-[0_0_40px_rgba(168,85,247,0.45)]',
        accentRing: 'ring-purple-400/50',
        cardBg: 'from-[#190d24]/85 via-[#0f0717]/80 to-[#140b1e]/85',
        innerBorder: 'border-purple-400/30',
        iconBg: 'from-purple-400 to-indigo-600',
        icon: <Crown size={26} className="text-purple-200 animate-pulse" />,
        fallbackIcon: <Crown size={56} className="text-purple-300" />,
        cashText: 'from-purple-200 via-pink-200 to-purple-100',
        subtextColor: 'text-purple-300',
        badgeBg: 'from-purple-500 via-pink-500 to-purple-600 text-white border-purple-300',
        lightSweep: 'via-purple-300/25',
        defaultTagline: 'मालिकावीर पारितोषिक सौजन्य',
      },
      {
        id: 'best_batsman',
        prize: findAward('best_batsman', 5),
        titleMr: 'उत्कृष्ट फलंदाज चषक व रोख रक्कम',
        titleHi: 'सर्वश्रेष्ठ बल्लेबाज ट्रॉफी व नकद राशि',
        titleEn: 'Best Batsman Trophy & Cash',
        ribbonMr: 'उत्कृष्ट फलंदाज • सर्वोत्तम खेळाडू',
        ribbonHi: 'सर्वश्रेष्ठ बल्लेबाज • शीर्ष स्कोरर',
        ribbonEn: 'BEST BATSMAN AWARD',
        sponsorBadgeMr: 'फलंदाज बक्षीस सौजन्य',
        sponsorBadgeHi: 'बल्लेबाज प्रायोजक',
        sponsorBadgeEn: 'BATSMAN SPONSOR',
        accentBorder: 'from-emerald-400 via-teal-300 to-emerald-700 shadow-[0_0_40px_rgba(16,185,129,0.45)]',
        accentRing: 'ring-emerald-400/50',
        cardBg: 'from-[#071d15]/85 via-[#04120d]/80 to-[#061812]/85',
        innerBorder: 'border-emerald-400/30',
        iconBg: 'from-emerald-400 to-teal-600',
        icon: <Flame size={26} className="text-emerald-200 animate-pulse" />,
        fallbackIcon: <Flame size={56} className="text-emerald-300" />,
        cashText: 'from-emerald-200 via-teal-200 to-emerald-100',
        subtextColor: 'text-emerald-300',
        badgeBg: 'from-emerald-500 via-teal-400 to-emerald-600 text-slate-950 border-emerald-300',
        lightSweep: 'via-emerald-300/25',
        defaultTagline: 'उत्कृष्ट फलंदाज पारितोषिक सौजन्य',
      },
      {
        id: 'best_bowler',
        prize: findAward('best_bowler', 6),
        titleMr: 'उत्कृष्ट गोलंदाज चषक व रोख रक्कम',
        titleHi: 'सर्वश्रेष्ठ गेंदबाज ट्रॉफी व नकद राशि',
        titleEn: 'Best Bowler Trophy & Cash',
        ribbonMr: 'उत्कृष्ट गोलंदाज • सर्वोत्तम मारा',
        ribbonHi: 'सर्वश्रेष्ठ गेंदबाज • शीर्ष विकेट टेकर',
        ribbonEn: 'BEST BOWLER AWARD',
        sponsorBadgeMr: 'गोलंदाज बक्षीस सौजन्य',
        sponsorBadgeHi: 'गेंदबाज प्रायोजक',
        sponsorBadgeEn: 'BOWLER SPONSOR',
        accentBorder: 'from-cyan-400 via-blue-400 to-indigo-700 shadow-[0_0_40px_rgba(6,182,212,0.45)]',
        accentRing: 'ring-cyan-400/50',
        cardBg: 'from-[#071926]/85 via-[#040e17]/80 to-[#061520]/85',
        innerBorder: 'border-cyan-400/30',
        iconBg: 'from-cyan-400 to-blue-600',
        icon: <Target size={26} className="text-cyan-200 animate-pulse" />,
        fallbackIcon: <Target size={56} className="text-cyan-300" />,
        cashText: 'from-cyan-200 via-blue-200 to-cyan-100',
        subtextColor: 'text-cyan-300',
        badgeBg: 'from-cyan-500 via-blue-400 to-cyan-600 text-slate-950 border-cyan-300',
        lightSweep: 'via-cyan-300/25',
        defaultTagline: 'उत्कृष्ट गोलंदाज पारितोषिक सौजन्य',
      },
      {
        id: 'custom_or_sixes',
        prize: fourthAward(),
        titleMr: 'उत्कृष्ट षटकार / विशेष चषक व रोख',
        titleHi: 'अधिकतम छक्के / विशेष ट्रॉफी व नकद',
        titleEn: 'Maximum Sixes / Special Honour',
        ribbonMr: 'विशेष पारितोषिक • उत्कृष्ट कामगिरी',
        ribbonHi: 'विशेष पुरस्कार • अधिकतम छक्के',
        ribbonEn: 'SPECIAL TOURNAMENT AWARD',
        sponsorBadgeMr: 'विशेष बक्षीस सौजन्य',
        sponsorBadgeHi: 'विशेष पुरस्कार प्रायोजक',
        sponsorBadgeEn: 'AWARD SPONSOR',
        accentBorder: 'from-rose-400 via-amber-400 to-orange-600 shadow-[0_0_40px_rgba(244,63,94,0.45)]',
        accentRing: 'ring-rose-400/50',
        cardBg: 'from-[#220c14]/85 via-[#14060b]/80 to-[#1c0a10]/85',
        innerBorder: 'border-rose-400/30',
        iconBg: 'from-rose-400 to-orange-500',
        icon: <Sparkles size={26} className="text-amber-200 animate-spin" />,
        fallbackIcon: <Sparkles size={56} className="text-rose-300" />,
        cashText: 'from-rose-200 via-amber-200 to-rose-100',
        subtextColor: 'text-rose-300',
        badgeBg: 'from-rose-500 via-orange-400 to-rose-600 text-slate-950 border-rose-300',
        lightSweep: 'via-rose-300/25',
        defaultTagline: 'विशेष पुरस्कार सौजन्य',
      },
    ];
  }, [rawPrizes]);

  // Tournament Title Display
  const tournamentName = match?.tournamentName || match?.seriesName || 'GRAND CRICKET CHAMPIONSHIP 2026';

  // Automatic slide cycle: 8 seconds per slide
  const SLIDE_DURATION_MS = 8000;

  useEffect(() => {
    const intervalStep = 100;
    const totalSteps = SLIDE_DURATION_MS / intervalStep;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress(Math.min(100, (step / totalSteps) * 100));

      if (step >= totalSteps) {
        step = 0;
        setProgress(0);
        setCurrentSlide(prev => (prev === 0 ? 1 : 0));
      }
    }, intervalStep);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleSelectSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full h-full min-h-[1080px] max-w-[1920px] aspect-video relative flex flex-col items-center justify-center overflow-hidden select-none font-sans bg-transparent px-4 py-2"
    >
      {/* =========================================================================
          MAIN PRESENTATION UNIT (TIGHT VERTICAL COHESION - NO GAP)
          Tournament name sits directly above the Grand Prize Board cards
          ========================================================================= */}
      <main className="relative z-10 w-full max-w-[1360px] flex flex-col items-center justify-center overflow-hidden">
        {/* COMPACT FLOATING TOURNAMENT HEADER BADGE (Directly above Grand Prize Board cards) */}
        <header className="mb-3.5 sm:mb-4 flex justify-center items-center z-20">
          <div className="px-6 py-1.5 rounded-2xl bg-slate-950/90 border border-amber-400/40 backdrop-blur-md shadow-2xl flex flex-col items-center text-center max-w-xl w-auto">
            <div className="inline-flex items-center gap-2">
              <span className="w-5 h-0.5 bg-gradient-to-r from-transparent to-amber-400" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">
                {lang === 'mr' ? '🏆 भव्य पारितोषिक फलक 🏆' : lang === 'hi' ? '🏆 भव्य पुरस्कार बोर्ड 🏆' : '🏆 GRAND PRIZE BOARD 🏆'}
              </span>
              <span className="w-5 h-0.5 bg-gradient-to-l from-transparent to-amber-400" />
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 tracking-tight uppercase truncate max-w-lg">
              {tournamentName}
            </h1>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {currentSlide === 0 ? (
            /* =========================================================================
                SLIDE 1: MAIN PODIUM PRIZES (1st, 2nd, 3rd, 4th)
                ========================================================================= */
            <motion.div
              key="slide-podium"
              initial={{ opacity: 0, x: 60, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4 max-w-[1340px] mx-auto w-full items-stretch"
            >
              {/* 1ST PRIZE / CHAMPION (GOLD TIER) */}
              <div className="relative rounded-3xl p-[2.5px] bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 shadow-[0_0_30px_rgba(245,158,11,0.35)] transform lg:-translate-y-1 transition-transform duration-300 flex flex-col justify-between">
                {/* Top Crown Ribbon */}
                <div className="absolute -top-3 inset-x-0 flex justify-center z-30">
                  <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-amber-200">
                    <Crown size={13} className="animate-bounce" />
                    <span>{lang === 'mr' ? '१ले पारितोषिक • विजेता' : lang === 'hi' ? '१ला पुरस्कार • विजेता' : '1ST PRIZE • CHAMPION'}</span>
                  </span>
                </div>

                <div className="relative rounded-[22px] bg-gradient-to-b from-[#181308]/90 via-[#0d0a04]/85 to-[#120f06]/90 backdrop-blur-xl p-3.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden border border-amber-400/35">
                  <motion.div
                    animate={{ x: ['-200%', '300%'] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute inset-y-0 w-28 -skew-x-25 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent pointer-events-none z-10"
                  />

                  {/* Card Top: Trophy & Cash */}
                  <div className="text-center pt-1.5 pb-2 border-b border-amber-400/20">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-[0_0_12px_rgba(245,158,11,0.4)] flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                        <Trophy size={20} className="text-yellow-400 animate-pulse" />
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
                      {lang === 'mr' ? 'विजेता संघ चषक व रोख पारितोषिक' : lang === 'hi' ? 'विजेता ट्रॉफी व नकद पुरस्कार' : 'Champion Trophy & Cash Prize'}
                    </span>

                    <div className="mt-0.5 flex items-center justify-center gap-1 text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-tight drop-shadow-sm">
                      <span>{podiumPrizes.first.currency || '₹'}</span>
                      <span>{podiumPrizes.first.amount || '51,000'}</span>
                    </div>
                  </div>

                  {/* Card Middle: Sponsor Photo */}
                  <div className="my-2 xl:my-2.5 flex flex-col items-center text-center">
                    <div className="relative mb-2.5 group">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 p-1 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/40">
                        {podiumPrizes.first.personPhoto ? (
                          <img
                            src={podiumPrizes.first.personPhoto}
                            alt={podiumPrizes.first.personName}
                            className="w-full h-full rounded-full object-cover border border-slate-950"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400">
                            <Trophy size={40} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2.5 inset-x-0 flex justify-center z-10">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-[9.5px] uppercase tracking-wider shadow border border-amber-200">
                          {lang === 'mr' ? '१ले बक्षीस सौजन्य' : lang === 'hi' ? '१ला प्रायोजक' : '1ST SPONSOR'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base xl:text-lg font-black text-white mt-1 line-clamp-1">
                      {podiumPrizes.first.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                    </h3>

                    <p className="text-[11px] xl:text-xs font-bold text-amber-300/90 mt-0.5 line-clamp-1">
                      {podiumPrizes.first.personDesignation || (lang === 'mr' ? 'उद्योगपती / क्रीडाप्रेमी' : 'Chief Patron & Sponsor')}
                    </p>
                  </div>

                  {/* Card Footer: Tagline / Honor Text */}
                  <div className="pt-2 border-t border-amber-400/20 text-center">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {podiumPrizes.first.tagline || (lang === 'mr' ? 'विजेता चषक व रोख रक्कम सौजन्य' : 'Grand Trophy & Cash Sponsored By')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2ND PRIZE / RUNNER-UP (SILVER CHROME TIER) */}
              <div className="relative rounded-3xl p-[2.5px] bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-[0_0_25px_rgba(203,213,225,0.25)] transition-transform duration-300 flex flex-col justify-between">
                <div className="absolute -top-3 inset-x-0 flex justify-center z-30">
                  <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-300 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-slate-300">
                    <Medal size={13} className="text-slate-800" />
                    <span>{lang === 'mr' ? '२रे पारितोषिक • उपविजेता' : lang === 'hi' ? '२रा पुरस्कार • उपविजेता' : '2ND PRIZE • RUNNER-UP'}</span>
                  </span>
                </div>

                <div className="relative rounded-[22px] bg-gradient-to-b from-[#11141c]/90 via-[#090b10]/85 to-[#0e1118]/90 backdrop-blur-xl p-3.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden border border-slate-400/35">
                  <motion.div
                    animate={{ x: ['-200%', '300%'] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                    className="absolute inset-y-0 w-28 -skew-x-25 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10"
                  />

                  {/* Card Top: Medal & Cash */}
                  <div className="text-center pt-1.5 pb-2 border-b border-white/10">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 p-0.5 shadow-[0_0_12px_rgba(203,213,225,0.3)] flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                        <Medal size={20} className="text-slate-200" />
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      {lang === 'mr' ? 'उपविजेता संघ चषक व रोख रक्कम' : lang === 'hi' ? 'उपविजेता ट्रॉफी व नकद पुरस्कार' : 'Runner-Up Trophy & Cash Prize'}
                    </span>

                    <div className="mt-0.5 flex items-center justify-center gap-1 text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight drop-shadow-sm">
                      <span>{podiumPrizes.second.currency || '₹'}</span>
                      <span>{podiumPrizes.second.amount || '31,000'}</span>
                    </div>
                  </div>

                  {/* Card Middle: Sponsor Photo Framed in Platinum Chrome */}
                  <div className="my-2 xl:my-2.5 flex flex-col items-center text-center">
                    <div className="relative mb-2.5 group">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full bg-gradient-to-tr from-slate-200 via-white to-slate-400 p-1 shadow-[0_0_25px_rgba(203,213,225,0.4)] ring-2 ring-slate-300/40">
                        {podiumPrizes.second.personPhoto ? (
                          <img
                            src={podiumPrizes.second.personPhoto}
                            alt={podiumPrizes.second.personName}
                            className="w-full h-full rounded-full object-cover border border-slate-950"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-slate-300">
                            <Medal size={40} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2.5 inset-x-0 flex justify-center z-10">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-300 text-slate-950 font-black text-[9.5px] uppercase tracking-wider shadow border border-slate-400">
                          {lang === 'mr' ? '२रे बक्षीस सौजन्य' : lang === 'hi' ? '२रा प्रायोजक' : '2ND SPONSOR'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base xl:text-lg font-black text-white mt-1 line-clamp-1">
                      {podiumPrizes.second.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                    </h3>

                    <p className="text-[11px] xl:text-xs font-bold text-slate-300 mt-0.5 line-clamp-1">
                      {podiumPrizes.second.personDesignation || (lang === 'mr' ? 'क्रीडा संरक्षक' : 'Patron & Supporter')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-center">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {podiumPrizes.second.tagline || (lang === 'mr' ? 'उपविजेता पारितोषिक सौजन्य' : 'Runner-Up Trophy Sponsored By')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3RD PRIZE (ANTIQUE BRONZE TIER) */}
              <div className="relative rounded-3xl p-[2.5px] bg-gradient-to-b from-amber-600 via-amber-500 to-amber-800 shadow-[0_0_25px_rgba(217,119,6,0.25)] transition-transform duration-300 flex flex-col justify-between">
                <div className="absolute -top-3 inset-x-0 flex justify-center z-30">
                  <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-amber-400">
                    <Award size={13} className="text-slate-950" />
                    <span>{lang === 'mr' ? '३रे पारितोषिक' : lang === 'hi' ? '३रा पुरस्कार' : '3RD PRIZE'}</span>
                  </span>
                </div>

                <div className="relative rounded-[22px] bg-gradient-to-b from-[#191108]/90 via-[#0d0904]/85 to-[#140e06]/90 backdrop-blur-xl p-3.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden border border-amber-600/35">
                  <motion.div
                    animate={{ x: ['-200%', '300%'] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
                    className="absolute inset-y-0 w-28 -skew-x-25 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none z-10"
                  />

                  {/* Card Top: Award & Cash */}
                  <div className="text-center pt-1.5 pb-2 border-b border-amber-600/20">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 p-0.5 shadow-[0_0_12px_rgba(217,119,6,0.3)] flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                        <Award size={20} className="text-amber-500" />
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      {lang === 'mr' ? '३रे क्रमांक चषक व रोख रक्कम' : lang === 'hi' ? '३रा स्थान ट्रॉफी व नकद पुरस्कार' : '3rd Place Trophy & Cash'}
                    </span>

                    <div className="mt-0.5 flex items-center justify-center gap-1 text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 tracking-tight drop-shadow-sm">
                      <span>{podiumPrizes.third.currency || '₹'}</span>
                      <span>{podiumPrizes.third.amount || '21,000'}</span>
                    </div>
                  </div>

                  {/* Card Middle: Sponsor Photo Framed in Antique Bronze */}
                  <div className="my-2 xl:my-2.5 flex flex-col items-center text-center">
                    <div className="relative mb-2.5 group">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 p-1 shadow-[0_0_25px_rgba(217,119,6,0.4)] ring-2 ring-amber-500/40">
                        {podiumPrizes.third.personPhoto ? (
                          <img
                            src={podiumPrizes.third.personPhoto}
                            alt={podiumPrizes.third.personName}
                            className="w-full h-full rounded-full object-cover border border-slate-950"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-500">
                            <Award size={40} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2.5 inset-x-0 flex justify-center z-10">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 text-slate-950 font-black text-[9.5px] uppercase tracking-wider shadow border border-amber-300">
                          {lang === 'mr' ? '३रे बक्षीस सौजन्य' : lang === 'hi' ? '३रा प्रायोजक' : '3RD SPONSOR'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base xl:text-lg font-black text-white mt-1 line-clamp-1">
                      {podiumPrizes.third.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                    </h3>

                    <p className="text-[11px] xl:text-xs font-bold text-amber-300 mt-0.5 line-clamp-1">
                      {podiumPrizes.third.personDesignation || (lang === 'mr' ? 'क्रीडाप्रेमी' : 'Tournament Sponsor')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-amber-600/20 text-center">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {podiumPrizes.third.tagline || (lang === 'mr' ? '३रे पारितोषिक सौजन्य' : '3rd Prize Sponsored By')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4TH PRIZE (POLISHED COPPER TIER) */}
              <div className="relative rounded-3xl p-[2.5px] bg-gradient-to-b from-orange-500 via-amber-600 to-orange-800 shadow-[0_0_25px_rgba(249,115,22,0.25)] transition-transform duration-300 flex flex-col justify-between">
                <div className="absolute -top-3 inset-x-0 flex justify-center z-30">
                  <span className="px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-orange-300">
                    <Medal size={13} className="text-slate-950" />
                    <span>{lang === 'mr' ? '४थे पारितोषिक' : lang === 'hi' ? '४था पुरस्कार' : '4TH PRIZE'}</span>
                  </span>
                </div>

                <div className="relative rounded-[22px] bg-gradient-to-b from-[#180f08]/90 via-[#0c0704]/85 to-[#120b06]/90 backdrop-blur-xl p-3.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden border border-orange-500/35">
                  <motion.div
                    animate={{ x: ['-200%', '300%'] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 3.5 }}
                    className="absolute inset-y-0 w-28 -skew-x-25 bg-gradient-to-r from-transparent via-orange-300/20 to-transparent pointer-events-none z-10"
                  />

                  {/* Card Top: Medal & Cash */}
                  <div className="text-center pt-1.5 pb-2 border-b border-orange-500/20">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br from-orange-500 to-amber-700 p-0.5 shadow-[0_0_12px_rgba(249,115,22,0.3)] flex items-center justify-center">
                      <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                        <Medal size={20} className="text-orange-400" />
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
                      {lang === 'mr' ? '४था क्रमांक चषक व रोख रक्कम' : lang === 'hi' ? '४था स्थान ट्रॉफी व नकद पुरस्कार' : '4th Place Trophy & Cash'}
                    </span>

                    <div className="mt-0.5 flex items-center justify-center gap-1 text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-400 to-orange-500 tracking-tight drop-shadow-sm">
                      <span>{podiumPrizes.fourth.currency || '₹'}</span>
                      <span>{podiumPrizes.fourth.amount || '11,000'}</span>
                    </div>
                  </div>

                  {/* Card Middle: Sponsor Photo Framed in Polished Copper */}
                  <div className="my-2 xl:my-2.5 flex flex-col items-center text-center">
                    <div className="relative mb-2.5 group">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-700 p-1 shadow-[0_0_25px_rgba(249,115,22,0.4)] ring-2 ring-orange-400/40">
                        {podiumPrizes.fourth.personPhoto ? (
                          <img
                            src={podiumPrizes.fourth.personPhoto}
                            alt={podiumPrizes.fourth.personName}
                            className="w-full h-full rounded-full object-cover border border-slate-950"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-orange-400">
                            <Medal size={40} />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2.5 inset-x-0 flex justify-center z-10">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 text-slate-950 font-black text-[9.5px] uppercase tracking-wider shadow border border-orange-300">
                          {lang === 'mr' ? '४थे बक्षीस सौजन्य' : lang === 'hi' ? '४था प्रायोजक' : '4TH SPONSOR'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base xl:text-lg font-black text-white mt-1 line-clamp-1">
                      {podiumPrizes.fourth.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                    </h3>

                    <p className="text-[11px] xl:text-xs font-bold text-orange-300 mt-0.5 line-clamp-1">
                      {podiumPrizes.fourth.personDesignation || (lang === 'mr' ? 'क्रीडाप्रेमी' : 'Tournament Sponsor')}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-orange-500/20 text-center">
                    <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                      {podiumPrizes.fourth.tagline || (lang === 'mr' ? '४थे पारितोषिक सौजन्य' : '4th Prize Sponsored By')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* =========================================================================
                SLIDE 2: SPECIAL INDIVIDUAL HONOURS
                ========================================================================= */
            <motion.div
              key="slide-special"
              initial={{ opacity: 0, x: 60, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.98 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4 max-w-[1340px] mx-auto w-full items-stretch"
            >
              {slide2Prizes.map((item, idx) => (
                <div
                  key={item.id}
                  className={`relative rounded-3xl p-[2.5px] bg-gradient-to-b ${item.accentBorder} transition-transform duration-300 flex flex-col justify-between`}
                >
                  {/* Top Ribbon */}
                  <div className="absolute -top-3 inset-x-0 flex justify-center z-30">
                    <span className={`px-3 py-0.5 rounded-full bg-gradient-to-r ${item.badgeBg} text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border`}>
                      <span className="scale-100">{item.icon}</span>
                      <span>{lang === 'mr' ? item.ribbonMr : lang === 'hi' ? item.ribbonHi : item.ribbonEn}</span>
                    </span>
                  </div>

                  {/* Inner Card */}
                  <div className={`relative rounded-[22px] bg-gradient-to-b ${item.cardBg} backdrop-blur-xl p-3.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden border ${item.innerBorder}`}>
                    <motion.div
                      animate={{ x: ['-200%', '300%'] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.8 }}
                      className={`absolute inset-y-0 w-28 -skew-x-25 bg-gradient-to-r from-transparent ${item.lightSweep} to-transparent pointer-events-none z-10`}
                    />

                    {/* Card Top: Award Icon & Cash */}
                    <div className="text-center pt-1.5 pb-2 border-b border-white/10">
                      <div className={`w-10 h-10 mx-auto mb-1 rounded-lg bg-gradient-to-br ${item.iconBg} p-0.5 shadow-md flex items-center justify-center`}>
                        <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                          {item.icon}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold ${item.subtextColor} uppercase tracking-wider block`}>
                        {lang === 'mr' ? item.titleMr : lang === 'hi' ? item.titleHi : item.titleEn}
                      </span>

                      <div className={`mt-0.5 flex items-center justify-center gap-1 text-2xl xl:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${item.cashText} tracking-tight drop-shadow-sm`}>
                        <span>{item.prize.currency || '₹'}</span>
                        <span>{item.prize.amount || '10,000'}</span>
                      </div>
                    </div>

                    {/* Card Middle: Sponsor Photo Framed in Award Hue */}
                    <div className="my-2 xl:my-2.5 flex flex-col items-center text-center">
                      <div className="relative mb-2.5 group">
                        <div className={`w-28 h-28 sm:w-32 sm:h-32 xl:w-36 xl:h-36 rounded-full bg-gradient-to-tr ${item.accentBorder} p-1 shadow-md ring-2 ${item.accentRing}`}>
                          {item.prize.personPhoto ? (
                            <img
                              src={item.prize.personPhoto}
                              alt={item.prize.personName}
                              className="w-full h-full rounded-full object-cover border border-slate-950"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                              {item.fallbackIcon}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2.5 inset-x-0 flex justify-center z-10">
                          <span className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${item.badgeBg} font-black text-[9.5px] uppercase tracking-wider shadow border`}>
                            {lang === 'mr' ? item.sponsorBadgeMr : lang === 'hi' ? item.sponsorBadgeHi : item.sponsorBadgeEn}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base xl:text-lg font-black text-white mt-1 line-clamp-1">
                        {item.prize.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                      </h3>

                      <p className={`text-[11px] xl:text-xs font-bold ${item.subtextColor} mt-0.5 line-clamp-1`}>
                        {item.prize.personDesignation || (lang === 'mr' ? 'क्रीडा संरक्षक व देणगीदार' : 'Patron & Sports Enthusiast')}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 text-center">
                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                        {item.prize.tagline || item.defaultTagline}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            COMPACT FLOATING SLIDE NAVIGATION CONTROLS (NO full-screen-width footer)
            ========================================================================= */}
        <div className="mt-3 flex items-center justify-center">
          <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-amber-400/35 backdrop-blur-md shadow-xl">
            <button
              type="button"
              onClick={() => handleSelectSlide(0)}
              className={`px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                currentSlide === 0
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Trophy size={12} />
              <span>{lang === 'mr' ? '१ले, २रे, ३रे व ४थे' : lang === 'hi' ? '१ला, २रा, ३रा व ४था' : '1st, 2nd, 3rd & 4th Prizes'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectSlide(1)}
              className={`px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                currentSlide === 1
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-300 shadow-sm'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-white'
              }`}
            >
              <Crown size={12} />
              <span>{lang === 'mr' ? 'मालिकावीर व विशेष' : lang === 'hi' ? 'मैन ऑफ द सीरीज़' : 'Special Awards'}</span>
            </button>

            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10 ml-1">
              <div
                className={`h-full transition-all duration-100 ${
                  currentSlide === 0
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-purple-500 to-pink-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <span className="text-[10px] font-mono font-bold text-amber-300/80">
              {currentSlide + 1} / 2
            </span>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-black text-amber-400 hover:text-white hover:bg-white/10 uppercase tracking-wider cursor-pointer transition-colors"
                title="Close overlay"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
};
