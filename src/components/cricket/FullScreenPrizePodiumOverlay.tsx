import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Award, Medal, Crown, Sparkles, X, 
  Coins, Flame, Target, Star, Eye, EyeOff, Languages, 
  Calendar, Volume2, VolumeX, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
  TournamentPrize, 
  getTournamentPrizes, 
  STANDARD_TOURNAMENT_PRIZES,
  SAMPLE_DEMO_PRIZES 
} from '../../utils/cricketPrizeStorage';
import { 
  useCommentaryLanguage, 
  CommentaryLanguage, 
  setStoredCommentaryLanguage 
} from './commentaryLanguage';

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

// Helper to safely parse numeric value from prize amount strings (e.g. "₹51,000" or "51,000" -> 51000)
function parseAmount(val?: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9]/g, '');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// Format number into Indian comma style (e.g. 114000 -> "1,14,000")
function formatIndianCurrency(num: number): string {
  if (num <= 0) return '0';
  return num.toLocaleString('en-IN');
}

export const FullScreenPrizePodiumOverlay: React.FC<FullScreenPrizePodiumOverlayProps> = ({
  match,
  onClose,
  initialPhase = 'auto',
  soundEnabled = true,
}) => {
  const [lang, setLang] = useCommentaryLanguage();
  const [soundOn, setSoundOn] = useState<boolean>(soundEnabled);
  const [manualPhase, setManualPhase] = useState<PresentationPhase>(initialPhase);
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

  // Determine current presentation context/phase
  const activePhase = useMemo(() => {
    if (manualPhase !== 'auto') return manualPhase;
    if (match?.status === 'completed' || match?.winner) return 'post_match';
    if (match?.currentInningsNum === 2 && (match?.innings1?.ballsBowled || 0) > 0 && (match?.innings2?.ballsBowled || 0) === 0) {
      return 'break';
    }
    if (match?.tossWinner && (!match?.innings1 || match?.innings1?.ballsBowled === 0)) {
      return 'toss';
    }
    return 'toss';
  }, [manualPhase, match?.status, match?.winner, match?.currentInningsNum, match?.innings1, match?.innings2, match?.tossWinner]);

  // Find 4 main podium prizes (1st, 2nd, 3rd, 4th)
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

  // Find individual special awards
  const specialAwards = useMemo(() => {
    const findAward = (cat: string, defSampleIndex: number) => {
      const found = rawPrizes.find(p => p.category === cat || p.id === cat);
      if (found && (found.personName || found.amount)) {
        return found;
      }
      const sample = SAMPLE_DEMO_PRIZES[defSampleIndex];
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

    return [
      {
        type: 'man_of_series',
        prize: findAward('man_of_series', 4),
        icon: <Crown size={16} className="text-purple-300" />,
        label: lang === 'mr' ? 'मालिकावीर' : lang === 'hi' ? 'मैन ऑफ द सीरीज़' : 'Man of the Series',
        accent: 'from-purple-600 to-indigo-700 border-purple-400/40 text-purple-200',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      },
      {
        type: 'best_batsman',
        prize: findAward('best_batsman', 5),
        icon: <Flame size={16} className="text-emerald-300" />,
        label: lang === 'mr' ? 'उत्कृष्ट फलंदाज' : lang === 'hi' ? 'सर्वश्रेष्ठ बल्लेबाज' : 'Best Batsman',
        accent: 'from-emerald-600 to-teal-700 border-emerald-400/40 text-emerald-200',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      },
      {
        type: 'best_bowler',
        prize: findAward('best_bowler', 6),
        icon: <Target size={16} className="text-cyan-300" />,
        label: lang === 'mr' ? 'उत्कृष्ट गोलंदाज' : lang === 'hi' ? 'सर्वश्रेष्ठ गेंदबाज' : 'Best Bowler',
        accent: 'from-cyan-600 to-blue-700 border-cyan-400/40 text-cyan-200',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      },
    ];
  }, [rawPrizes, lang]);

  // Calculate Total Tournament Purse
  const totalPurseAmount = useMemo(() => {
    let sum = 0;
    // Main 4 prizes
    sum += parseAmount(podiumPrizes.first.amount);
    sum += parseAmount(podiumPrizes.second.amount);
    sum += parseAmount(podiumPrizes.third.amount);
    sum += parseAmount(podiumPrizes.fourth.amount);
    // Special awards
    specialAwards.forEach(a => {
      sum += parseAmount(a.prize.amount);
    });
    return sum;
  }, [podiumPrizes, specialAwards]);

  const tournamentName = match?.tournamentName || match?.seriesName || 'GRAND CRICKET CHAMPIONSHIP 2026';

  const phaseLabels = {
    toss: {
      en: 'TOSS TIME CEREMONY • PRIZE MONEY UNVEILING',
      mr: 'नाणेफेक वेळ विशेष • भव्य पारितोषिक अनावरण',
      hi: 'टॉस समय विशेष • भव्य पुरस्कार अनावरण',
    },
    break: {
      en: 'INNINGS BREAK • TOURNAMENT PRIZE BOARD',
      mr: 'डाव मध्यांतर विशेष • अधिकृत पारितोषिक फलक',
      hi: 'पारी ब्रेक विशेष • आधिकारिक पुरस्कार बोर्ड',
    },
    post_match: {
      en: 'POST-MATCH PRESENTATION • PRIZE DISTRIBUTION CEREMONY',
      mr: 'सामना सांगता समारंभ • भव्य बक्षीस वितरण सोहळा',
      hi: 'मैच उपरांत समारोह • भव्य पुरस्कार वितरण समारोह',
    },
  };

  const currentPhaseTitle = phaseLabels[activePhase === 'break' ? 'break' : activePhase === 'post_match' ? 'post_match' : 'toss'][lang];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="w-full h-full min-h-[1080px] max-w-[1920px] aspect-video relative flex flex-col justify-between overflow-hidden select-none bg-[#030611] font-sans"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 12%, rgba(251, 191, 36, 0.18) 0%, transparent 65%),
          radial-gradient(circle at 10% 25%, rgba(59, 130, 246, 0.12) 0%, transparent 50%),
          radial-gradient(circle at 90% 25%, rgba(239, 68, 68, 0.12) 0%, transparent 50%),
          linear-gradient(to bottom, #050817 0%, #030611 60%, #020308 100%)
        `,
      }}
    >
      {/* 3D Background Grid & Ambient Studio Beams */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated Light Sweep Beam Left */}
        <motion.div
          animate={{ opacity: [0.25, 0.5, 0.25], rotate: [-24, -20, -24] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-20 w-[600px] h-[900px] bg-gradient-to-b from-amber-400/20 via-yellow-500/5 to-transparent blur-3xl transform origin-top"
        />

        {/* Animated Light Sweep Beam Right */}
        <motion.div
          animate={{ opacity: [0.25, 0.5, 0.25], rotate: [24, 20, 24] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
          className="absolute -top-32 -right-20 w-[600px] h-[900px] bg-gradient-to-b from-amber-400/20 via-yellow-500/5 to-transparent blur-3xl transform origin-top"
        />

        {/* Star Dust Floating Particles */}
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:48px_48px] opacity-15" />
      </div>

      {/* =========================================================================
          TOP BROADCAST BAR: TOURNAMENT HEADER & CEREMONY BANNER
          ========================================================================= */}
      <header className="relative z-20 px-8 pt-6 pb-4 flex items-center justify-between border-b border-amber-400/20 bg-slate-950/70 backdrop-blur-md shadow-2xl">
        {/* Left: Tournament Badge & Title */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Trophy size={32} className="text-yellow-400 animate-pulse" />
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-1 rounded-2xl border border-amber-400/40 border-dashed pointer-events-none"
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-sm">
                OFFICIAL BROADCAST
              </span>
              <span className="text-xs font-bold text-amber-300/80 tracking-widest uppercase">
                {currentPhaseTitle}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300 tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {tournamentName}
            </h1>
          </div>
        </div>

        {/* Center: Total Tournament Purse Hero Ingot */}
        <div className="hidden md:flex items-center">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="relative px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-[2px] shadow-[0_0_35px_rgba(245,158,11,0.4)]"
          >
            <div className="px-5 py-2 rounded-[14px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
                <Coins size={22} className="animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 block">
                  {lang === 'mr' ? 'एकूण पारितोषिक रक्कम' : lang === 'hi' ? 'कुल टूर्नामेंट पुरस्कार राशि' : 'TOTAL TOURNAMENT PURSE'}
                </span>
                <div className="flex items-baseline gap-1 text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-tight">
                  <span>₹</span>
                  <span>{formatIndianCurrency(totalPurseAmount)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Controls (Phase Selector, Language, Sound, Close) */}
        <div className="flex items-center gap-3">
          {/* Presentation Phase Switcher */}
          <div className="hidden lg:flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1 shadow-inner text-[10.5px]">
            <button
              type="button"
              onClick={() => setManualPhase('toss')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                activePhase === 'toss'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'mr' ? 'नाणेफेक' : lang === 'hi' ? 'टॉस' : 'Toss'}
            </button>
            <button
              type="button"
              onClick={() => setManualPhase('break')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                activePhase === 'break'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'mr' ? 'मध्यांतर' : lang === 'hi' ? 'इनिंग्स ब्रेक' : 'Innings Break'}
            </button>
            <button
              type="button"
              onClick={() => setManualPhase('post_match')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer ${
                activePhase === 'post_match'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'mr' ? 'सामना सांगता' : lang === 'hi' ? 'प्रेजेंटेशन' : 'Post Match'}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-white/10 rounded-xl p-1 shadow-inner text-[11px]">
            <button
              type="button"
              onClick={() => {
                setLang('en');
                setStoredCommentaryLanguage('en');
              }}
              className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${
                lang === 'en' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => {
                setLang('mr');
                setStoredCommentaryLanguage('mr');
              }}
              className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${
                lang === 'mr' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => {
                setLang('hi');
                setStoredCommentaryLanguage('hi');
              }}
              className={`px-2 py-1 rounded-lg font-black transition-all cursor-pointer ${
                lang === 'hi' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              if (next) playFanfareSound();
            }}
            className="w-9 h-9 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title={soundOn ? 'Fanfare sound enabled' : 'Fanfare sound muted'}
          >
            {soundOn ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} />}
          </button>

          {/* Dismiss / Close Overlay Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Close Full-Screen Presentation Board"
            >
              <X size={15} />
              <span className="hidden sm:inline">{lang === 'mr' ? 'बंद करा' : lang === 'hi' ? 'बंद करें' : 'Dismiss'}</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          MAIN 3D PRESENTATION PODIUM: ALL 4 PRIZES SIDE-BY-SIDE
          ========================================================================= */}
      <main className="relative z-10 flex-1 px-8 py-5 flex flex-col justify-center">
        {/* Mobile / Small screen Purse pill */}
        <div className="md:hidden flex justify-center mb-4">
          <div className="px-5 py-2 rounded-xl bg-slate-950/80 border border-amber-400/40 flex items-center gap-2 shadow-lg">
            <Coins size={18} className="text-amber-400" />
            <span className="text-xs font-black text-amber-200 uppercase">
              {lang === 'mr' ? 'एकूण पारितोषिक:' : lang === 'hi' ? 'कुल पुरस्कार:' : 'TOTAL PURSE:'}
            </span>
            <span className="text-base font-black text-amber-400">
              ₹{formatIndianCurrency(totalPurseAmount)}
            </span>
          </div>
        </div>

        {/* The 4 Podium Columns in 3D metallic finishes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-[1780px] mx-auto w-full items-stretch">
          {/* ==========================================
              1ST PRIZE / CHAMPION (GOLD TIER)
              ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-3xl p-[3px] bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 shadow-[0_0_40px_rgba(245,158,11,0.45)] transform lg:-translate-y-2 transition-transform duration-300 flex flex-col justify-between"
          >
            {/* Top Crown Ribbon */}
            <div className="absolute -top-3.5 inset-x-0 flex justify-center z-30">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-amber-200">
                <Crown size={14} className="animate-bounce" />
                <span>{lang === 'mr' ? '१ले पारितोषिक • विजेता' : lang === 'hi' ? '१ला पुरस्कार • विजेता' : '1ST PRIZE • CHAMPION'}</span>
              </span>
            </div>

            {/* Inner Gold Card Content */}
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#181308] via-[#0d0a04] to-[#120f06] p-5 flex flex-col justify-between h-full overflow-hidden border border-amber-400/30">
              {/* Metallic Light Sweep Sheen */}
              <motion.div
                animate={{ x: ['-200%', '300%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute inset-y-0 w-32 -skew-x-25 bg-gradient-to-r from-transparent via-amber-200/25 to-transparent pointer-events-none z-10"
              />

              {/* Card Top: Trophy & Cash */}
              <div className="text-center pt-3 pb-3 border-b border-amber-400/20">
                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Trophy size={32} className="text-yellow-400 animate-pulse" />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  {lang === 'mr' ? 'विजेता संघ चषक व रोख पारितोषिक' : lang === 'hi' ? 'विजेता ट्रॉफी व नकद पुरस्कार' : 'Champion Trophy & Cash Prize'}
                </span>

                <div className="mt-1 flex items-center justify-center gap-1 text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-tight drop-shadow-sm">
                  <span>{podiumPrizes.first.currency || '₹'}</span>
                  <span>{podiumPrizes.first.amount || '51,000'}</span>
                </div>
              </div>

              {/* Card Middle: Sponsor Photo Framed in 24K Gold */}
              <div className="my-5 flex flex-col items-center text-center">
                <div className="relative mb-3 group">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 p-1 shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                    {podiumPrizes.first.personPhoto ? (
                      <img
                        src={podiumPrizes.first.personPhoto}
                        alt={podiumPrizes.first.personName}
                        className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-400">
                        <Trophy size={40} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                      {lang === 'mr' ? '१ले बक्षीस सौजन्य' : lang === 'hi' ? '१ला प्रायोजक' : '1ST SPONSOR'}
                    </span>
                  </div>
                </div>

                {/* Sponsor Name & Designation */}
                <h3 className="text-lg xl:text-xl font-black text-white mt-1 line-clamp-1">
                  {podiumPrizes.first.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                </h3>

                <p className="text-xs font-semibold text-amber-300/90 mt-0.5 line-clamp-1">
                  {podiumPrizes.first.personDesignation || (lang === 'mr' ? 'उद्योगपती / क्रीडाप्रेमी' : 'Chief Patron & Sponsor')}
                </p>
              </div>

              {/* Card Footer: Tagline / Honor Text */}
              <div className="pt-3 border-t border-amber-400/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {podiumPrizes.first.tagline || (lang === 'mr' ? 'विजेता चषक व रोख रक्कम सौजन्य' : 'Grand Trophy & Cash Sponsored By')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ==========================================
              2ND PRIZE / RUNNER-UP (SILVER CHROME TIER)
              ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative rounded-3xl p-[3px] bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600 shadow-[0_0_35px_rgba(203,213,225,0.3)] transition-transform duration-300 flex flex-col justify-between"
          >
            {/* Top Badge */}
            <div className="absolute -top-3.5 inset-x-0 flex justify-center z-30">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-300 text-slate-950 text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-slate-300">
                <Medal size={14} className="text-slate-800" />
                <span>{lang === 'mr' ? '२रे पारितोषिक • उपविजेता' : lang === 'hi' ? '२रा पुरस्कार • उपविजेता' : '2ND PRIZE • RUNNER-UP'}</span>
              </span>
            </div>

            {/* Inner Silver Card Content */}
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#11141c] via-[#090b10] to-[#0e1118] p-5 flex flex-col justify-between h-full overflow-hidden border border-slate-400/30">
              {/* Metallic Light Sweep Sheen */}
              <motion.div
                animate={{ x: ['-200%', '300%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                className="absolute inset-y-0 w-32 -skew-x-25 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none z-10"
              />

              {/* Card Top: Medal & Cash */}
              <div className="text-center pt-3 pb-3 border-b border-white/10">
                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 p-0.5 shadow-[0_0_20px_rgba(203,213,225,0.35)] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Medal size={32} className="text-slate-200" />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  {lang === 'mr' ? 'उपविजेता संघ चषक व रोख रक्कम' : lang === 'hi' ? 'उपविजेता ट्रॉफी व नकद पुरस्कार' : 'Runner-Up Trophy & Cash Prize'}
                </span>

                <div className="mt-1 flex items-center justify-center gap-1 text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight drop-shadow-sm">
                  <span>{podiumPrizes.second.currency || '₹'}</span>
                  <span>{podiumPrizes.second.amount || '31,000'}</span>
                </div>
              </div>

              {/* Card Middle: Sponsor Photo Framed in Platinum Chrome */}
              <div className="my-5 flex flex-col items-center text-center">
                <div className="relative mb-3 group">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-slate-200 via-white to-slate-400 p-1 shadow-[0_0_25px_rgba(203,213,225,0.35)]">
                    {podiumPrizes.second.personPhoto ? (
                      <img
                        src={podiumPrizes.second.personPhoto}
                        alt={podiumPrizes.second.personName}
                        className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-slate-300">
                        <Medal size={40} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                      {lang === 'mr' ? '२रे बक्षीस सौजन्य' : lang === 'hi' ? '२रा प्रायोजक' : '2ND SPONSOR'}
                    </span>
                  </div>
                </div>

                {/* Sponsor Name & Designation */}
                <h3 className="text-lg xl:text-xl font-black text-white mt-1 line-clamp-1">
                  {podiumPrizes.second.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                </h3>

                <p className="text-xs font-semibold text-slate-300 mt-0.5 line-clamp-1">
                  {podiumPrizes.second.personDesignation || (lang === 'mr' ? 'क्रीडा संरक्षक' : 'Patron & Supporter')}
                </p>
              </div>

              {/* Card Footer: Tagline / Honor Text */}
              <div className="pt-3 border-t border-white/10 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {podiumPrizes.second.tagline || (lang === 'mr' ? 'उपविजेता पारितोषिक सौजन्य' : 'Runner-Up Trophy Sponsored By')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ==========================================
              3RD PRIZE (ANTIQUE BRONZE TIER)
              ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative rounded-3xl p-[3px] bg-gradient-to-b from-amber-600 via-amber-500 to-amber-800 shadow-[0_0_30px_rgba(217,119,6,0.3)] transition-transform duration-300 flex flex-col justify-between"
          >
            {/* Top Badge */}
            <div className="absolute -top-3.5 inset-x-0 flex justify-center z-30">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-700 text-slate-950 text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-amber-400">
                <Award size={14} className="text-slate-950" />
                <span>{lang === 'mr' ? '३रे पारितोषिक' : lang === 'hi' ? '३रा पुरस्कार' : '3RD PRIZE'}</span>
              </span>
            </div>

            {/* Inner Bronze Card Content */}
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#191108] via-[#0d0904] to-[#140e06] p-5 flex flex-col justify-between h-full overflow-hidden border border-amber-600/30">
              {/* Metallic Light Sweep Sheen */}
              <motion.div
                animate={{ x: ['-200%', '300%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
                className="absolute inset-y-0 w-32 -skew-x-25 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none z-10"
              />

              {/* Card Top: Award & Cash */}
              <div className="text-center pt-3 pb-3 border-b border-amber-600/20">
                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 p-0.5 shadow-[0_0_20px_rgba(217,119,6,0.35)] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Award size={32} className="text-amber-500" />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  {lang === 'mr' ? '३रे क्रमांक चषक व रोख रक्कम' : lang === 'hi' ? '३रा स्थान ट्रॉफी व नकद पुरस्कार' : '3rd Place Trophy & Cash'}
                </span>

                <div className="mt-1 flex items-center justify-center gap-1 text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 tracking-tight drop-shadow-sm">
                  <span>{podiumPrizes.third.currency || '₹'}</span>
                  <span>{podiumPrizes.third.amount || '21,000'}</span>
                </div>
              </div>

              {/* Card Middle: Sponsor Photo Framed in Antique Bronze */}
              <div className="my-5 flex flex-col items-center text-center">
                <div className="relative mb-3 group">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-700 p-1 shadow-[0_0_25px_rgba(217,119,6,0.35)]">
                    {podiumPrizes.third.personPhoto ? (
                      <img
                        src={podiumPrizes.third.personPhoto}
                        alt={podiumPrizes.third.personName}
                        className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-500">
                        <Award size={40} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                      {lang === 'mr' ? '३रे बक्षीस सौजन्य' : lang === 'hi' ? '३रा प्रायोजक' : '3RD SPONSOR'}
                    </span>
                  </div>
                </div>

                {/* Sponsor Name & Designation */}
                <h3 className="text-lg xl:text-xl font-black text-white mt-1 line-clamp-1">
                  {podiumPrizes.third.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                </h3>

                <p className="text-xs font-semibold text-amber-300 mt-0.5 line-clamp-1">
                  {podiumPrizes.third.personDesignation || (lang === 'mr' ? 'क्रीडाप्रेमी' : 'Tournament Sponsor')}
                </p>
              </div>

              {/* Card Footer: Tagline / Honor Text */}
              <div className="pt-3 border-t border-amber-600/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {podiumPrizes.third.tagline || (lang === 'mr' ? '३रे पारितोषिक सौजन्य' : '3rd Prize Sponsored By')}
                </span>
              </div>
            </div>
          </motion.div>

          {/* ==========================================
              4TH PRIZE (POLISHED COPPER TIER)
              ========================================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative rounded-3xl p-[3px] bg-gradient-to-b from-orange-500 via-amber-600 to-orange-800 shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-transform duration-300 flex flex-col justify-between"
          >
            {/* Top Badge */}
            <div className="absolute -top-3.5 inset-x-0 flex justify-center z-30">
              <span className="px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 text-slate-950 text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-orange-300">
                <Medal size={14} className="text-slate-950" />
                <span>{lang === 'mr' ? '४थे पारितोषिक' : lang === 'hi' ? '४था पुरस्कार' : '4TH PRIZE'}</span>
              </span>
            </div>

            {/* Inner Copper Card Content */}
            <div className="relative rounded-[22px] bg-gradient-to-b from-[#180f08] via-[#0c0704] to-[#120b06] p-5 flex flex-col justify-between h-full overflow-hidden border border-orange-500/30">
              {/* Metallic Light Sweep Sheen */}
              <motion.div
                animate={{ x: ['-200%', '300%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 3.5 }}
                className="absolute inset-y-0 w-32 -skew-x-25 bg-gradient-to-r from-transparent via-orange-300/20 to-transparent pointer-events-none z-10"
              />

              {/* Card Top: Award & Cash */}
              <div className="text-center pt-3 pb-3 border-b border-orange-500/20">
                <div className="w-16 h-16 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-700 p-0.5 shadow-[0_0_20px_rgba(249,115,22,0.35)] flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Medal size={32} className="text-orange-400" />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-orange-300 uppercase tracking-wider block">
                  {lang === 'mr' ? '४थे क्रमांक चषक व रोख रक्कम' : lang === 'hi' ? '४था स्थान ट्रॉफी व नकद पुरस्कार' : '4th Place Trophy & Cash'}
                </span>

                <div className="mt-1 flex items-center justify-center gap-1 text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500 tracking-tight drop-shadow-sm">
                  <span>{podiumPrizes.fourth.currency || '₹'}</span>
                  <span>{podiumPrizes.fourth.amount || '11,000'}</span>
                </div>
              </div>

              {/* Card Middle: Sponsor Photo Framed in Polished Copper */}
              <div className="my-5 flex flex-col items-center text-center">
                <div className="relative mb-3 group">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-orange-500 via-amber-400 to-orange-700 p-1 shadow-[0_0_25px_rgba(249,115,22,0.35)]">
                    {podiumPrizes.fourth.personPhoto ? (
                      <img
                        src={podiumPrizes.fourth.personPhoto}
                        alt={podiumPrizes.fourth.personName}
                        className="w-full h-full rounded-full object-cover border-2 border-slate-950"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-orange-400">
                        <Medal size={40} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow">
                      {lang === 'mr' ? '४थे बक्षीस सौजन्य' : lang === 'hi' ? '४था प्रायोजक' : '4TH SPONSOR'}
                    </span>
                  </div>
                </div>

                {/* Sponsor Name & Designation */}
                <h3 className="text-lg xl:text-xl font-black text-white mt-1 line-clamp-1">
                  {podiumPrizes.fourth.personName || (lang === 'mr' ? 'सन्माननीय प्रायोजक' : 'Honourable Sponsor')}
                </h3>

                <p className="text-xs font-semibold text-orange-300 mt-0.5 line-clamp-1">
                  {podiumPrizes.fourth.personDesignation || (lang === 'mr' ? 'क्रीडाप्रेमी' : 'Tournament Sponsor')}
                </p>
              </div>

              {/* Card Footer: Tagline / Honor Text */}
              <div className="pt-3 border-t border-orange-500/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {podiumPrizes.fourth.tagline || (lang === 'mr' ? '४थे पारितोषिक सौजन्य' : '4th Prize Sponsored By')}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* =========================================================================
            BOTTOM SECONDARY SHELF: SPECIAL INDIVIDUAL TOURNAMENT AWARDS
            (Man of the Series, Best Batsman, Best Bowler)
            ========================================================================= */}
        <div className="mt-5 max-w-[1780px] mx-auto w-full">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-white/10 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles size={16} className="text-amber-400 animate-spin" />
              <span className="text-xs font-black uppercase tracking-widest text-white">
                {lang === 'mr' ? 'विशेष गौरव व पारितोषिके:' : lang === 'hi' ? 'विशेष पुरस्कार व सम्मान:' : 'SPECIAL AWARDS & HONOURS:'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 w-full">
              {specialAwards.map((item, idx) => (
                <div
                  key={item.type}
                  className={`px-3 py-2 rounded-xl bg-gradient-to-r ${item.accent} border flex items-center justify-between gap-3 shadow-md`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-950/80 border border-white/20 flex items-center justify-center shrink-0">
                      {item.prize.personPhoto ? (
                        <img
                          src={item.prize.personPhoto}
                          alt={item.prize.personName}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        item.icon
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-wider block truncate text-white">
                        {item.label}
                      </span>
                      <span className="text-[10.5px] font-bold text-white/80 block truncate">
                        {item.prize.personName || (lang === 'mr' ? 'विशेष प्रायोजक' : 'Special Sponsor')}
                      </span>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-white/15 text-white font-black text-xs shrink-0 flex items-center gap-1 shadow-inner">
                    <span className="text-amber-400">{item.prize.currency || '₹'}</span>
                    <span>{item.prize.amount || '0'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          BOTTOM TICKER / BROADCAST FOOTER
          ========================================================================= */}
      <footer className="relative z-20 px-8 py-3 bg-slate-950/90 border-t border-amber-400/20 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-mono text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            LIVE BROADCAST FEED • 1080P PRO HD OVERLAY
          </span>
          <span className="text-white/20">•</span>
          <span className="text-[11px] text-amber-400 font-semibold">
            {lang === 'mr'
              ? 'सर्व बक्षिसे व चषक अधिकृत प्रायोजकांमार्फत सन्मानपूर्वक बहाल करण्यात येतील'
              : lang === 'hi'
              ? 'सभी पुरस्कार व ट्रॉफियां आधिकारिक प्रायोजकों द्वारा प्रदान की जाएंगी'
              : 'All tournament trophies & cash awards generously presented by official patrons'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10.5px] font-mono text-slate-400">
            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-black text-amber-400 hover:text-white uppercase tracking-wider cursor-pointer transition-colors"
            >
              [ {lang === 'mr' ? 'बंद करा' : lang === 'hi' ? 'हटाएं' : 'Hide Board'} ]
            </button>
          )}
        </div>
      </footer>
    </motion.div>
  );
};
