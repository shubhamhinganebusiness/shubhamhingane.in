import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Download, 
  Send, 
  Eye, 
  Sparkles,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { MatchState, Innings } from './CricketScoreboard';

interface CompletedRecordsSliderProps {
  matches: MatchState[];
  onSelectMatch: (matchId: string) => void;
  onExportPDF?: (match: MatchState) => void;
  isScoreManager?: boolean;
  homepageMode?: boolean;
}

const DEFAULT_STADIUM_IMAGES = [
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1624526261102-98fdc0c0749e?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&q=80&w=800'
];

// Helper to compute Player of the Match if not explicitly provided
const getMatchPotm = (mItem: any) => {
  if (!mItem) return null;
  if (mItem.playerOfTheMatch && mItem.playerOfTheMatch.name) {
    return mItem.playerOfTheMatch;
  }
  const statsMap: { [key: string]: { name: string; runs: number; balls: number; wickets: number; runsConceded: number } } = {};
  const getOrCreatePlayer = (name: string) => {
    const key = name.trim().toLowerCase();
    if (!statsMap[key]) {
      statsMap[key] = { name: name.trim(), runs: 0, balls: 0, wickets: 0, runsConceded: 0 };
    }
    return statsMap[key];
  };
  const processInnings = (inn: Innings | null) => {
    if (!inn) return;
    (inn.batsmen || []).forEach(b => {
      if (!b.name) return;
      const p = getOrCreatePlayer(b.name);
      p.runs += b.runs;
      p.balls += b.balls;
    });
    (inn.bowlers || []).forEach(bw => {
      if (!bw.name) return;
      const p = getOrCreatePlayer(bw.name);
      p.wickets += bw.wickets;
      p.runsConceded += bw.runsConceded;
    });
  };
  if (mItem.mainMatchState) {
    processInnings(mItem.mainMatchState.innings1);
    processInnings(mItem.mainMatchState.innings2);
  }
  processInnings(mItem.innings1);
  processInnings(mItem.innings2);

  let bestPlayer = null;
  let maxPoints = -1;
  for (const key in statsMap) {
    const p = statsMap[key];
    const points = p.runs + (p.wickets * 25);
    if (points > maxPoints) {
      maxPoints = points;
      bestPlayer = p;
    } else if (points === maxPoints && points > 0) {
      if (bestPlayer && p.wickets > bestPlayer.wickets) {
        bestPlayer = p;
      } else if (bestPlayer && p.wickets === bestPlayer.wickets && p.runsConceded < bestPlayer.runsConceded) {
        bestPlayer = p;
      }
    }
  }
  if (bestPlayer && (bestPlayer.runs > 0 || bestPlayer.wickets > 0)) {
    return {
      ...bestPlayer,
      points: maxPoints
    };
  }
  return null;
};

// Sub-component for individual completed match card in the slider
// Designed with a responsive 2-column horizontal split on laptops/desktops to fit perfectly on screen without vertical scrolling
const CompletedMatchCard: React.FC<{
  match: MatchState;
  index: number;
  onSelectMatch: (matchId: string) => void;
  onExportPDF?: (match: MatchState) => void;
  onShareWhatsApp: (match: MatchState, e: React.MouseEvent) => void;
}> = ({ match: m, index, onSelectMatch, onExportPDF, onShareWhatsApp }) => {
  const [imgError, setImgError] = useState(false);

  const inn1 = m.mainMatchState?.innings1 || m.innings1;
  const inn2 = m.mainMatchState?.innings2 || m.innings2;

  const team1 = inn1?.battingTeam || m.teamA || 'Team 1';
  const team2 = inn2?.battingTeam || m.teamB || 'Team 2';

  const team1Runs = inn1?.runs ?? 0;
  const team1Wickets = inn1?.wickets ?? 0;
  const team1Balls = inn1?.ballsBowled ?? 0;
  const team1Overs = `${Math.floor(team1Balls / 6)}.${team1Balls % 6}`;

  const team2Runs = inn2?.runs ?? 0;
  const team2Wickets = inn2?.wickets ?? 0;
  const team2Balls = inn2?.ballsBowled ?? 0;
  const team2Overs = `${Math.floor(team2Balls / 6)}.${team2Balls % 6}`;

  const isTie = m.winner === 'Tie' || m.winReason?.toLowerCase().includes('tie') || m.isSuperOver || m.mainMatchState || (m.superOverNumber && m.superOverNumber > 0);
  const isTeam1Winner = !isTie && m.winner && (m.winner.toLowerCase().trim() === team1.toLowerCase().trim() || m.winner.toLowerCase().trim() === (m.teamA || '').toLowerCase().trim());
  const isTeam2Winner = !isTie && m.winner && (m.winner.toLowerCase().trim() === team2.toLowerCase().trim() || m.winner.toLowerCase().trim() === (m.teamB || '').toLowerCase().trim());

  const winningTeam = isTeam1Winner ? team1 : isTeam2Winner ? team2 : (m.winner || team1);
  const winnerText = isTie ? 'Match Tied!' : `${m.winner || winningTeam} ${m.winReason || 'Won the Match'}`;

  // Top match performers
  const potm = getMatchPotm(m);

  let bestBatter: { name: string; runs: number; balls: number; team: string } | null = null;
  const checkBatter = (b: any, tName: string) => {
    if (!b || !b.name) return;
    if (!bestBatter || (b.runs ?? 0) > bestBatter.runs) {
      bestBatter = { name: b.name, runs: b.runs ?? 0, balls: b.balls ?? 0, team: tName };
    }
  };
  inn1?.batsmen?.forEach(b => checkBatter(b, inn1?.battingTeam || m.teamA));
  inn2?.batsmen?.forEach(b => checkBatter(b, inn2?.battingTeam || m.teamB));

  let bestBowler: { name: string; wickets: number; runsConceded: number; oversStr: string; team: string } | null = null;
  const checkBowler = (bw: any, tName: string) => {
    if (!bw || !bw.name) return;
    const ov = `${Math.floor((bw.ballsBowled || 0) / 6)}.${(bw.ballsBowled || 0) % 6}`;
    if (!bestBowler || (bw.wickets ?? 0) > bestBowler.wickets || ((bw.wickets ?? 0) === bestBowler.wickets && (bw.runsConceded ?? 999) < bestBowler.runsConceded)) {
      if ((bw.wickets ?? 0) > 0 || (bw.ballsBowled ?? 0) > 0) {
        bestBowler = { name: bw.name, wickets: bw.wickets ?? 0, runsConceded: bw.runsConceded ?? 0, oversStr: ov, team: tName };
      }
    }
  };
  inn1?.bowlers?.forEach(bw => checkBowler(bw, inn1?.bowlingTeam || m.teamB));
  inn2?.bowlers?.forEach(bw => checkBowler(bw, inn2?.bowlingTeam || m.teamA));

  // Calculated Match Stats
  const totalMatchRuns = team1Runs + team2Runs;
  const totalMatchBalls = team1Balls + team2Balls;
  const overallRunRate = totalMatchBalls > 0 ? ((totalMatchRuns / totalMatchBalls) * 6).toFixed(2) : '0.00';

  // Has custom banner
  const hasCustomBanner = Boolean(!imgError && m.matchBannerUrl && m.matchBannerUrl.trim());
  const fallbackImg = DEFAULT_STADIUM_IMAGES[index % DEFAULT_STADIUM_IMAGES.length];
  const displayImage = hasCustomBanner ? m.matchBannerUrl! : fallbackImg;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.06, 0.3), type: "spring", stiffness: 120 }}
      onClick={() => onSelectMatch(m.id)}
      className="group/card flex-shrink-0 w-[300px] sm:w-[390px] md:w-[680px] lg:w-[750px] xl:w-[800px] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[1.75rem] md:rounded-[2.25rem] overflow-hidden border border-slate-800 hover:border-emerald-500/40 text-white shadow-xl shadow-emerald-950/20 hover:shadow-[0_15px_35px_rgba(0,0,0,0.65),0_0_20px_rgba(16,185,129,0.18)] transition-all duration-300 snap-center relative flex flex-col md:flex-row md:items-stretch cursor-pointer select-none ring-1 ring-white/5"
    >
      {/* Ambient Stadium Beams */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/15 transition-colors duration-500" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 opacity-70 group-hover:opacity-100 transition-opacity" />

      {/* ================= LEFT COLUMN: MATCH BANNER & STATUS (42% width on laptop) ================= */}
      <div className="w-full md:w-[44%] lg:w-[42%] p-3.5 sm:p-4.5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800/80 bg-slate-950/40">
        <div>
          {/* Top Status & Category Badges Row */}
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[8.5px] font-black uppercase tracking-wider rounded-full shadow-sm flex items-center gap-1 backdrop-blur-md">
                <Trophy size={10} className="text-amber-400" />
                {m.tournamentName || 'CRICKET'}
              </span>
              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[8.5px] font-black uppercase tracking-wider rounded-full shadow-sm backdrop-blur-md">
                {isTie ? 'TIED' : 'CONCLUDED'}
              </span>
            </div>

            {m.date && (
              <span className="px-2 py-0.5 bg-slate-900/90 backdrop-blur-md rounded-full text-[8.5px] font-mono font-bold text-slate-300 border border-white/10 shadow-sm flex items-center gap-1 shrink-0">
                <Calendar size={9} className="text-amber-400" />
                {m.date}
              </span>
            )}
          </div>

          {/* Fully Visible Match Banner Container (16:9 Aspect Ratio) */}
          <div className="rounded-xl overflow-hidden aspect-[16/9] w-full bg-slate-950 border border-slate-800 shadow-md relative group/banner">
            {/* Blurred background glow so edges never look empty or black */}
            <img 
              src={displayImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-105 pointer-events-none"
            />
            
            {/* Foreground Banner: object-contain ensures 100% of the banner graphic & text is fully shown without cropping */}
            <img 
              src={displayImage}
              alt={`${m.teamA} vs ${m.teamB} Match Banner`}
              onError={() => setImgError(true)}
              className="relative z-10 w-full h-full object-contain group-hover/card:scale-102 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

            {/* Tag at bottom left */}
            <div className="absolute bottom-1.5 left-2 z-20 flex items-center gap-1">
              <span className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[7.5px] font-mono font-bold text-amber-300 border border-white/15 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon size={8} className="text-amber-400" />
                {hasCustomBanner ? '1280 × 720' : 'BANNER'}
              </span>
            </div>

            {/* Hover Action Overlay over the Banner */}
            <div className="absolute inset-0 z-30 bg-slate-950/75 backdrop-blur-[2px] opacity-0 group-hover/banner:opacity-100 group-hover/card:opacity-100 transition-all duration-300 flex items-center justify-center gap-2.5">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMatch(m.id);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all transform hover:scale-105 shadow-xl cursor-pointer border-none flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
                title="View Full Detailed Scorecard"
              >
                <Eye size={14} />
                <span>Scorecard</span>
              </button>

              <button 
                type="button"
                onClick={(e) => onShareWhatsApp(m, e)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 rounded-xl transition-all transform hover:scale-105 shadow-xl cursor-pointer flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
                title="Share Result on WhatsApp"
              >
                <Send size={13} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Left Bottom Match Stats Summary Bar */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.06] text-xs font-mono">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400/90 leading-tight">Total Match Runs</p>
            <p className="text-xs font-black text-white">{totalMatchRuns} <span className="text-[10px] text-slate-400 font-normal">({overallRunRate} rpo)</span></p>
          </div>
          {potm?.name && (
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-amber-400 leading-tight">Top Performer</p>
              <p className="text-xs font-black text-amber-300 truncate max-w-[120px]">{potm.name}</p>
            </div>
          )}
        </div>
      </div>

      {/* ================= RIGHT COLUMN: MATCH SCORES, RESULTS & ACTIONS (58% width on laptop) ================= */}
      <div className="w-full md:w-[56%] lg:w-[58%] p-3.5 sm:p-4.5 flex flex-col justify-between">
        <div>
          {/* Header Title & Matchup Details */}
          <div className="mb-2.5">
            <h3 className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight group-hover/card:text-emerald-400 transition-colors leading-tight line-clamp-1">
              {winnerText}
            </h3>
            <p className="text-slate-400 text-[11px] font-medium leading-normal line-clamp-1">
              {m.teamA} vs {m.teamB} {m.tournamentName ? `• 🏆 ${m.tournamentName}` : ''} {m.groundName || m.venue ? `• 📍 ${m.groundName || m.venue}` : ''}
            </p>
          </div>

          {/* Team Battle Scoreboard Grid (Live Match Styling) */}
          <div className="flex items-center justify-between gap-2 mb-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
            {/* Team 1 Details & Monogram */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xs border border-indigo-400/20 shadow-sm shrink-0 ${
                isTeam1Winner ? 'ring-2 ring-emerald-400/80 shadow-emerald-500/20' : ''
              }`}>
                {(team1 || 'T1').toUpperCase().substring(0, 2)}
              </div>
              <div className="min-w-0 leading-tight text-left">
                <span className="text-xs font-black tracking-tight text-white block truncate">{team1}</span>
                <span className="text-[11px] font-mono font-black text-emerald-400 block truncate">
                  {team1Runs}/{team1Wickets}
                  <span className="text-[9px] text-slate-400 font-normal ml-1">({team1Overs} ov)</span>
                </span>
                <span className="text-[7.5px] font-mono text-slate-400 font-bold uppercase block">
                  {isTeam1Winner ? 'WINNER' : 'Innings 1'}
                </span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="shrink-0 flex flex-col items-center justify-center px-1">
              <span className="text-[8px] font-mono font-black uppercase text-slate-400 border border-slate-800 bg-slate-950 px-1.5 py-0.5 rounded-md shrink-0">
                VS
              </span>
              {isTie ? (
                <span className="text-xs mt-0.5">🤝</span>
              ) : (
                <Trophy size={11} className="text-amber-400 mt-0.5" />
              )}
            </div>

            {/* Team 2 Details & Monogram */}
            <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
              <div className="min-w-0 leading-tight text-right">
                <span className="text-xs font-black tracking-tight text-white block truncate">{team2}</span>
                <span className="text-[11px] font-mono font-black text-amber-400 block truncate">
                  {team2Runs}/{team2Wickets}
                  <span className="text-[9px] text-slate-400 font-normal ml-1">({team2Overs} ov)</span>
                </span>
                <span className="text-[7.5px] font-mono text-slate-400 font-bold uppercase block">
                  {isTeam2Winner ? 'WINNER' : 'Innings 2'}
                </span>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center font-black text-xs border border-amber-400/20 shadow-sm shrink-0 ${
                isTeam2Winner ? 'ring-2 ring-emerald-400/80 shadow-emerald-500/20' : ''
              }`}>
                {(team2 || 'T2').toUpperCase().substring(0, 2)}
              </div>
            </div>
          </div>

          {/* Highlights & Top Performance Chips */}
          <div className="flex flex-wrap gap-1 mb-2">
            {bestBatter && (
              <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-md text-[8.5px] font-mono font-bold">
                🏏 {bestBatter.name} ({bestBatter.runs}r)
              </span>
            )}
            {bestBowler && (
              <span className="px-2 py-0.5 bg-slate-900/90 text-slate-300 border border-slate-800 rounded-md text-[8.5px] font-mono font-bold">
                🎯 {bestBowler.name} ({bestBowler.wickets}w)
              </span>
            )}
            <span className="px-2 py-0.5 bg-slate-900/90 text-slate-400 border border-slate-800 rounded-md text-[8.5px] font-mono font-bold">
              {m.oversLimit || 5} Overs Match
            </span>
          </div>
        </div>

        {/* Actions & Buttons Row */}
        <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.08]">
          <div className="flex items-center gap-1.5">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={(e) => onShareWhatsApp(m, e)}
              className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              title="Share match summary on WhatsApp"
            >
              <Send size={10} />
              <span>WhatsApp</span>
            </button>

            {/* PDF Button */}
            {onExportPDF && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExportPDF(m);
                }}
                className="px-2.5 py-1.5 bg-slate-900 text-slate-300 hover:bg-emerald-600 hover:text-white border border-slate-800 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                title="Download Scorecard PDF"
              >
                <Download size={10} />
                <span>PDF</span>
              </button>
            )}
          </div>

          {/* View Scorecard Full Details */}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMatch(m.id);
            }}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[9px] font-black uppercase tracking-widest hover:gap-1.5 transition-all cursor-pointer border-none bg-transparent font-mono"
          >
            Full Scorecard
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export const CompletedRecordsSlider: React.FC<CompletedRecordsSliderProps> = ({
  matches,
  onSelectMatch,
  onExportPDF
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Smooth scroll handler for carousel navigation
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollStep = clientWidth > 640 ? clientWidth * 0.75 : 340;
      const scrollTo = direction === 'left' ? scrollLeft - scrollStep : scrollLeft + scrollStep;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  // Scroll to a specific card index
  const scrollToCard = (index: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const cardElements = container.children;
      if (cardElements[index]) {
        (cardElements[index] as HTMLElement).scrollIntoView({ 
          behavior: 'smooth', 
          inline: 'center', 
          block: 'nearest' 
        });
      }
      setActiveIndex(index);
    }
  };

  // Track active scroll card index on scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const cardElements = Array.from(scrollRef.current.children) as HTMLElement[];
      if (cardElements.length <= 1) return;

      const containerCenter = scrollLeft + clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;

      cardElements.forEach((child, i) => {
        if (i >= matches.length) return; // skip trailing spacer
        const childCenter = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(containerCenter - childCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      setActiveIndex(closestIdx);
    }
  };

  // Auto-slide effect when there is more than 1 completed record
  useEffect(() => {
    if (!isAutoPlay || isHovered || matches.length <= 1) return;

    const timer = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 40) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scroll('right');
        }
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isAutoPlay, isHovered, matches.length]);

  const handleShareWhatsApp = (m: MatchState, e: React.MouseEvent) => {
    e.stopPropagation();
    const winnerText = m.winner === 'Tie' ? 'Match Tied!' : `${m.winner} ${m.winReason || 'Won the Match'}`;
    const t1Overs = m.innings1 ? `${Math.floor(m.innings1.ballsBowled / 6)}.${m.innings1.ballsBowled % 6}` : '0.0';
    const t2Overs = m.innings2 ? `${Math.floor(m.innings2.ballsBowled / 6)}.${m.innings2.ballsBowled % 6}` : '0.0';
    const team1Score = m.innings1 ? `${m.innings1.battingTeam || m.teamA}: ${m.innings1.runs}/${m.innings1.wickets} (${t1Overs} ov)` : '';
    const team2Score = m.innings2 ? `${m.innings2.battingTeam || m.teamB}: ${m.innings2.runs}/${m.innings2.wickets} (${t2Overs} ov)` : '';
    const origin = window.location.origin.includes('ais-dev-') ? window.location.origin.replace('ais-dev-', 'ais-pre-') : window.location.origin;
    const matchUrl = `${origin}/?matchId=${m.id}&spectator=true`;
    const shareText = `🏏 *CRICKET MATCH RESULT* 🏆\n*${m.teamA} vs ${m.teamB}*\n\n🔥 *Result:* ${winnerText}\n📊 ${team1Score}\n📊 ${team2Score}\n\n👉 *View Full Match Scorecard & Highlights:*\n${matchUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (matches.length === 0) {
    return null;
  }

  return (
    <div 
      className="w-full relative group/slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Header Controls Bar for the Slider */}
      {matches.length > 1 && (
        <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <Trophy size={11} className="text-amber-400" />
              {matches.length} Concluded Matches
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Slide Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(prev => !prev)}
              className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-sm ${
                isAutoPlay 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-emerald-500/30'
              }`}
              title={isAutoPlay ? 'Auto-slide is active (pauses on hover)' : 'Auto-slide is paused'}
            >
              {isAutoPlay ? <Play size={9} className="text-emerald-400 fill-emerald-400" /> : <Pause size={9} />}
              <span>{isAutoPlay ? 'Auto-Slide' : 'Paused'}</span>
            </button>

            {/* Quick Prev / Next Navigator Counter */}
            <div className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-0.5 rounded-lg border border-slate-800 shadow-sm text-slate-300">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="text-slate-400 hover:text-emerald-400 text-[10px] px-1 border-none bg-transparent cursor-pointer font-black"
                aria-label="Previous match"
              >
                ◀
              </button>
              <span className="text-[9px] font-mono font-bold text-emerald-400 px-1">
                {activeIndex + 1}/{matches.length}
              </span>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="text-slate-400 hover:text-emerald-400 text-[10px] px-1 border-none bg-transparent cursor-pointer font-black"
                aria-label="Next match"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Side Navigation Chevron Buttons */}
      {matches.length > 1 && (
        <>
          <div className="absolute -left-2 sm:-left-5 md:-left-7 top-[48%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hidden sm:block pointer-events-auto">
            <button 
              type="button"
              onClick={() => scroll('left')}
              className="p-3 sm:p-3.5 bg-slate-900/95 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-all transform hover:scale-110 border border-slate-700/80 active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute -right-2 sm:-right-5 md:-right-7 top-[48%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hidden sm:block pointer-events-auto">
            <button 
              type="button"
              onClick={() => scroll('right')}
              className="p-3 sm:p-3.5 bg-slate-900/95 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-all transform hover:scale-110 border border-slate-700/80 active:scale-95 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}

      {/* Enhanced Card Scrolling Slider Track with optimal padding */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-4 sm:gap-6 custom-scrollbar snap-x snap-mandatory scroll-smooth p-1 sm:p-2 no-scrollbar pb-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {matches.map((match, idx) => (
          <CompletedMatchCard
            key={match.id}
            match={match}
            index={idx}
            onSelectMatch={onSelectMatch}
            onExportPDF={onExportPDF}
            onShareWhatsApp={handleShareWhatsApp}
          />
        ))}

        {/* Final Spacer for scroll padding */}
        <div className="flex-shrink-0 w-2 md:w-6 h-1" />
      </div>

      {/* Result Slider Pagination Dots & Direct Selector */}
      {matches.length > 1 && (
        <div className="flex items-center justify-between px-2 pt-1.5">
          <div className="text-[10px] font-mono font-bold text-slate-400">
            <span>Match </span>
            <span className="text-emerald-400 font-black">{activeIndex + 1}</span>
            <span> of </span>
            <span>{matches.length}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-800 shadow-sm backdrop-blur-sm">
            {matches.map((match, idx) => (
              <button
                key={match.id}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`transition-all duration-300 border-none cursor-pointer p-0 ${
                  idx === activeIndex
                    ? 'w-5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/60'
                    : 'w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-600'
                }`}
                title={`Result ${idx + 1}: ${match.teamA} vs ${match.teamB}`}
              />
            ))}
          </div>

          <div className="text-[10px] font-mono text-slate-500 hidden sm:block">
            {matches[activeIndex] ? `ID: ${matches[activeIndex].id.substring(0, 8)}` : ''}
          </div>
        </div>
      )}
    </div>
  );
};
