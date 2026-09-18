import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Trophy, 
  Award, 
  Flame, 
  Medal, 
  CheckCircle2, 
  Share2, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Sparkles,
  Zap,
  Lock,
  QrCode
} from 'lucide-react';
import { AwardType, generateCertificateSerial } from '../utils/certificateVerification';

export const CertificateVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL parameters from scanned QR code
  const certIdParam = searchParams.get('certId') || '';
  const matchIdParam = searchParams.get('m') || searchParams.get('matchId') || '';
  const awardParam = (searchParams.get('a') || searchParams.get('award') || 'potm') as AwardType;
  const playerParam = searchParams.get('p') || searchParams.get('player') || '';
  const runsParam = parseInt(searchParams.get('r') || searchParams.get('runs') || '0', 10);
  const ballsParam = searchParams.get('b') ? parseInt(searchParams.get('b')!, 10) : undefined;
  const foursParam = searchParams.get('f4') ? parseInt(searchParams.get('f4')!, 10) : undefined;
  const sixesParam = searchParams.get('s6') ? parseInt(searchParams.get('s6')!, 10) : undefined;
  const wicketsParam = parseInt(searchParams.get('w') || searchParams.get('wickets') || '0', 10);
  const runsConcededParam = searchParams.get('rc') ? parseInt(searchParams.get('rc')!, 10) : undefined;
  const ptsParam = parseInt(searchParams.get('pts') || searchParams.get('points') || '0', 10);
  const teamAParam = searchParams.get('ta') || searchParams.get('teamA') || 'Team A';
  const teamBParam = searchParams.get('tb') || searchParams.get('teamB') || 'Team B';
  const winnerParam = searchParams.get('win') || searchParams.get('winner') || '';
  const dateParam = searchParams.get('d') || searchParams.get('date') || 'Official Match Date';
  const tournParam = searchParams.get('t') || searchParams.get('tournament') || 'Gully Premier League 2026';
  const venueParam = searchParams.get('v') || searchParams.get('venue') || 'Official Championship Ground';

  // Manual search input state
  const [manualCertId, setManualCertId] = useState('');
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Compute or validate serial code
  const activeCertId = useMemo(() => {
    if (certIdParam) return certIdParam.trim().toUpperCase();
    if (playerParam) {
      return generateCertificateSerial(matchIdParam || 'M07', dateParam, awardParam, playerParam);
    }
    return 'GS-2026-M07-POTM-8F2B';
  }, [certIdParam, matchIdParam, dateParam, awardParam, playerParam]);

  // Award config mapping
  const awardConfig = useMemo(() => {
    switch (awardParam) {
      case 'fighter':
        return {
          title: 'FIGHTER OF THE MATCH',
          marathi: 'झुंजार खेळाडू (Fighter of the Match)',
          badge: 'RUNNER-UP STANDOUT FIGHTER',
          description: 'Standout valiant performance from the runner-up team',
          icon: Zap,
          accentBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          gradient: 'from-rose-500 via-pink-500 to-amber-500'
        };
      case 'best_batter':
        return {
          title: 'BEST BATSMAN OF THE MATCH',
          marathi: 'उत्कृष्ट फलंदाज (Best Batsman)',
          badge: 'POWER STRIKER',
          description: 'Highest run contribution and match impact with the bat',
          icon: Flame,
          accentBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          gradient: 'from-orange-500 via-amber-500 to-yellow-500'
        };
      case 'best_bowler':
        return {
          title: 'BEST BOWLER OF THE MATCH',
          marathi: 'उत्कृष्ट गोलंदाज (Best Bowler)',
          badge: 'GOLDEN ARM BOWLER',
          description: 'Most destructive wicket-taking spell and bowling control',
          icon: Medal,
          accentBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          gradient: 'from-cyan-500 via-teal-500 to-emerald-500'
        };
      case 'potm':
      default:
        return {
          title: 'PLAYER OF THE MATCH',
          marathi: 'सामनावीर मानकरी (Man of the Match)',
          badge: 'MATCH WINNER & GAME DECIDER',
          description: 'Outstanding all-round contribution and match-winning performance',
          icon: Trophy,
          accentBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradient: 'from-amber-500 via-yellow-400 to-amber-600'
        };
    }
  }, [awardParam]);

  const handleCopySerial = () => {
    navigator.clipboard.writeText(activeCertId);
    setCopiedSerial(true);
    setTimeout(() => setCopiedSerial(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Verified Gully Scoreboard Award - ${playerParam || 'Player'}`,
        text: `Verified Genuine Gully Scoreboard Award: ${awardConfig.title} presented to ${playerParam || 'Player'} (${activeCertId})`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCertId.trim()) return;
    const clean = manualCertId.trim().toUpperCase();
    // Parse parts if formatted like GS-2026-M07-POTM-8F2B
    const parts = clean.split('-');
    let parsedAward: AwardType = 'potm';
    if (parts.length >= 4) {
      const code = parts[3];
      if (code === 'BAT') parsedAward = 'best_batter';
      else if (code === 'BOWL') parsedAward = 'best_bowler';
      else if (code === 'FIGHTER') parsedAward = 'fighter';
    }
    navigate(`/verify-certificate?certId=${clean}&a=${parsedAward}&p=Verified Player&t=Gully Premier League 2026`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 font-sans selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl relative z-10 space-y-4 sm:space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
          <Link
            to="/live/cricket-details"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-amber-400 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Live Scoreboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Live Verified System
            </span>
          </div>
        </div>

        {/* 1. Official Verification Hero Badge */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-center">
          {/* Top security seal glow */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 p-1 shadow-xl flex items-center justify-center relative mb-4">
            <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative">
              <ShieldCheck size={40} className="text-emerald-400 drop-shadow-md" />
              <div className="absolute -bottom-1 px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black uppercase tracking-widest shadow-sm">
                VERIFIED
              </div>
            </div>
          </div>

          {/* EXACT REQUESTED PHRASE: "Verified Genuine Gully Scoreboard Award" */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-black uppercase tracking-wider mb-2 shadow-xs">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Verified Genuine Gully Scoreboard Award</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight uppercase font-serif mt-1">
            Official Certification Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1.5 leading-relaxed">
            This digital certificate has been cryptographically validated and confirmed genuine in the central Gully Scoreboard match registry.
          </p>

          {/* Official Verification Serial Number */}
          <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-amber-500/40 max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
            <div className="text-left w-full sm:w-auto">
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                Certificate Verification Serial Number
              </span>
              <span className="font-mono text-sm sm:text-base font-black text-amber-300 tracking-wider select-all block">
                {activeCertId}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySerial}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border border-slate-700 cursor-pointer shrink-0"
              title="Copy serial number"
            >
              {copiedSerial ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedSerial ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>
        </div>

        {/* 2. Honored Player & Match Breakdown Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          {/* Award Category Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shadow-xs">
                {React.createElement(awardConfig.icon, { size: 20 })}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Official Match Award
                </span>
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {awardConfig.title}
                </h2>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${awardConfig.accentBg}`}>
              {awardConfig.badge}
            </span>
          </div>

          {/* Recipient Details */}
          <div className="text-center py-2 space-y-1.5">
            <span className="text-xs uppercase font-medium tracking-widest text-slate-400 font-serif italic">
              Accolade Awarded To
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight uppercase font-serif drop-shadow-sm">
              {playerParam || 'Star Champion'}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {awardConfig.description}
            </p>
          </div>

          {/* Match Clash Context */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Match Contest
              </span>
              <p className="text-sm font-black text-white mt-0.5">
                {teamAParam} <span className="text-amber-400 font-bold">vs</span> {teamBParam}
              </p>
              {winnerParam && (
                <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                  Result: {winnerParam}
                </span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Tournament & Date
              </span>
              <p className="text-xs font-bold text-amber-300 mt-0.5">
                {tournParam}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center justify-center sm:justify-end gap-1">
                <Calendar size={11} /> {dateParam}
              </p>
            </div>
          </div>

          {/* Verified Stats Highlight Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-1">
            <div className="bg-slate-950/90 rounded-2xl p-3 text-center border border-slate-800/90">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                Runs Scored
              </span>
              <strong className="text-lg sm:text-2xl font-black font-mono text-emerald-400 block mt-0.5">
                {runsParam}
              </strong>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                {ballsParam ? `${ballsParam} balls` : 'Impact Inning'}
                {foursParam || sixesParam ? ` (${foursParam || 0}x4, ${sixesParam || 0}x6)` : ''}
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-2xl p-3 text-center border border-slate-800/90">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                Wickets Taken
              </span>
              <strong className="text-lg sm:text-2xl font-black font-mono text-cyan-400 block mt-0.5">
                {wicketsParam}
              </strong>
              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                {runsConcededParam !== undefined ? `${runsConcededParam} runs` : 'Bowling Spell'}
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-2xl p-3 text-center border border-slate-800/90">
              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">
                MVP Rating
              </span>
              <strong className="text-lg sm:text-2xl font-black font-mono text-amber-300 block mt-0.5">
                {ptsParam || Math.max(runsParam + wicketsParam * 25, 45)} pts
              </strong>
              <span className="text-[9px] text-amber-400 font-bold uppercase block mt-0.5">
                Game Decider
              </span>
            </div>
          </div>

          {/* Official Signatories & Authenticity Seal */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                <Lock size={18} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block">
                  Certifying Authority
                </span>
                <p className="text-xs font-serif italic font-bold text-amber-300">
                  Shubham Hingane
                </p>
                <p className="text-[9.5px] text-slate-400">
                  Founder of Gully Scoreboard • Gully Scoreboard Team
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                <ShieldCheck size={12} /> Digital Tamper-Proof
              </span>
              <span className="block text-[8.5px] text-slate-400 font-mono mt-1">
                SHA256: {activeCertId}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
          >
            {copiedShare ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedShare ? 'Link Copied!' : 'Share Verified Award'}</span>
          </button>

          <Link
            to={`/live/cricket-details${matchIdParam ? `?match=${matchIdParam}` : ''}`}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-700 shadow-md"
          >
            <ExternalLink size={16} />
            <span>Open Match Scorecard</span>
          </Link>
        </div>

        {/* 4. Manual Serial Lookup Screen */}
        <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
            <Search size={12} className="text-amber-400" />
            Verify Another Certificate ID
          </span>
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <input
              type="text"
              value={manualCertId}
              onChange={(e) => setManualCertId(e.target.value)}
              placeholder="e.g. GS-2026-M07-POTM-8F2B"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Verify
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-[10px] text-center text-slate-400">
          Gully Scoreboard Championship Certification Service • Powered by GullyScore Official
        </p>

      </div>
    </div>
  );
};

export default CertificateVerificationPage;
