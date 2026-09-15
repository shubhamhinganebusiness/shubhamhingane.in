import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Activity,
  Award
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
  const opponentTeam = isTeam1Winner ? team2 : isTeam2Winner ? team1 : (team1.toLowerCase() === winningTeam.toLowerCase() ? team2 : team1);

  const winnerRuns = isTeam1Winner ? team1Runs : isTeam2Winner ? team2Runs : team1Runs;
  const winnerWickets = isTeam1Winner ? team1Wickets : isTeam2Winner ? team2Wickets : team1Wickets;
  const winnerOvers = isTeam1Winner ? team1Overs : isTeam2Winner ? team2Overs : team1Overs;

  const opponentRuns = isTeam1Winner ? team2Runs : isTeam2Winner ? team1Runs : team2Runs;
  const opponentWickets = isTeam1Winner ? team2Wickets : isTeam2Winner ? team1Wickets : team2Wickets;
  const opponentOvers = isTeam1Winner ? team2Overs : isTeam2Winner ? team1Overs : team2Overs;

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
  const totalMatchOvers = totalMatchBalls > 0 ? (totalMatchBalls / 6).toFixed(1) : '0.0';
  const overallRunRate = totalMatchBalls > 0 ? ((totalMatchRuns / totalMatchBalls) * 6).toFixed(2) : '0.00';

  // Fallback stadium image selection based on index
  const fallbackImg = DEFAULT_STADIUM_IMAGES[index % DEFAULT_STADIUM_IMAGES.length];
  const displayImage = (!imgError && m.matchBannerUrl) ? m.matchBannerUrl : fallbackImg;

  // Build key highlights list (like Portfolio techStack)
  const matchHighlights: string[] = [
    isTie ? '🤝 Match Tied' : `🏆 ${winningTeam}`,
    bestBatter ? `🏏 ${bestBatter.name} (${bestBatter.runs}r)` : '',
    bestBowler ? `🎯 ${bestBowler.name} (${bestBowler.wickets}w)` : '',
    potm?.name ? `⭐ POTM: ${potm.name}` : '',
    `${m.oversLimit || 5} Overs Limit`,
    m.date ? `📅 ${m.date}` : ''
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.08, 0.4), type: "spring", stiffness: 100 }}
      onClick={() => onSelectMatch(m.id)}
      className="group/card flex-shrink-0 w-[310px] sm:w-[420px] md:w-[480px] lg:w-[520px] bg-surface rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-800 snap-center relative flex flex-col justify-between cursor-pointer"
    >
      {/* Top Visual Section - Matching Portfolio Project Card */}
      <div className="relative h-52 sm:h-60 md:h-64 overflow-hidden bg-slate-900">
        <img 
          src={displayImage}
          alt={`${m.teamA} vs ${m.teamB}`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110 opacity-80"
          referrerPolicy="no-referrer"
        />
        
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-primary opacity-80" />

        {/* Floating Badges (Top-Left & Top-Right) */}
        <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
          <div className="flex flex-wrap gap-2">
            <span className="px-3.5 py-1 bg-primary/95 backdrop-blur-sm rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em] shadow-lg flex items-center gap-1.5">
              <Trophy size={11} className="text-amber-300" />
              {m.tournamentName || 'MATCH RESULT'}
            </span>
            <span className="px-3 py-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-full text-[9px] font-black text-primary uppercase tracking-[0.2em] shadow-lg">
              {isTie ? 'TIED' : 'CONCLUDED'}
            </span>
          </div>

          {m.date && (
            <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-mono font-bold text-slate-200 border border-white/20 shadow-lg flex items-center gap-1">
              <Calendar size={10} className="text-amber-400" />
              {m.date}
            </span>
          )}
        </div>

        {/* Center Head-to-Head Decisive Scoreboard Overlay */}
        <div className="absolute inset-x-4 bottom-4 z-10">
          <div className="p-3.5 rounded-2xl bg-black/65 backdrop-blur-md border border-white/15 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              {/* Team 1 Monogram & Score */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md ${
                  isTeam1Winner 
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-black' 
                    : 'bg-white/10 text-white border border-white/20'
                }`}>
                  {team1.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black truncate leading-tight">{team1}</p>
                  <p className="text-sm sm:text-base font-black font-mono text-amber-300 leading-tight">
                    {team1Runs}/{team1Wickets}
                    <span className="text-[10px] text-slate-300 font-normal ml-1">({team1Overs} ov)</span>
                  </p>
                </div>
              </div>

              {/* VS Crest */}
              <div className="shrink-0 flex flex-col items-center justify-center px-1">
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">VS</span>
                {isTie ? (
                  <span className="text-xs">🤝</span>
                ) : (
                  <Trophy size={14} className="text-amber-400" />
                )}
              </div>

              {/* Team 2 Monogram & Score */}
              <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black truncate leading-tight">{team2}</p>
                  <p className="text-sm sm:text-base font-black font-mono text-amber-300 leading-tight">
                    {team2Runs}/{team2Wickets}
                    <span className="text-[10px] text-slate-300 font-normal ml-1">({team2Overs} ov)</span>
                  </p>
                </div>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-md ${
                  isTeam2Winner 
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 font-black' 
                    : 'bg-white/10 text-white border border-white/20'
                }`}>
                  {team2.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Hover Overlay with Action Buttons (Portfolio Style) */}
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover/card:opacity-100 transition-all duration-500 flex items-center justify-center gap-4 z-20">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectMatch(m.id);
            }}
            className="p-4 bg-white dark:bg-gray-900 rounded-[1.25rem] text-primary hover:bg-primary hover:text-white transition-all transform hover:rotate-6 shadow-2xl scale-75 group-hover/card:scale-100 cursor-pointer border-none flex items-center gap-2 font-black text-xs uppercase tracking-wider"
            title="View Full Detailed Scorecard"
          >
            <Eye size={22} />
            <span>Scorecard</span>
          </button>

          <button 
            type="button"
            onClick={(e) => onShareWhatsApp(m, e)}
            className="p-4 bg-emerald-600 rounded-[1.25rem] text-white hover:bg-emerald-500 transition-all transform hover:-rotate-6 shadow-2xl scale-75 group-hover/card:scale-100 cursor-pointer border-none flex items-center gap-2 font-black text-xs uppercase tracking-wider"
            title="Share Result on WhatsApp"
          >
            <Send size={20} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Info Section - Matching Portfolio Card Structure */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Title & Subtitle */}
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0 pr-2">
              <h3 className="text-2xl md:text-3xl font-black text-main-text mb-1.5 tracking-tighter group-hover/card:text-primary transition-colors leading-[1.15] line-clamp-1">
                {winnerText}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium leading-relaxed line-clamp-1 max-w-[95%]">
                {m.teamA} vs {m.teamB} {m.tournamentName ? `• 🏆 ${m.tournamentName}` : ''} {m.groundName || m.venue ? `• 📍 ${m.groundName || m.venue}` : ''}
              </p>
            </div>
          </div>

          {/* Innings Comparison Summary Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
            <div className={`p-2.5 rounded-xl border transition-colors ${
              isTeam1Winner 
                ? 'bg-amber-500/10 border-amber-500/30 text-main-text' 
                : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs truncate max-w-[120px] text-main-text">{team1}</span>
                {isTeam1Winner && <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black shrink-0">WIN</span>}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-black text-sm text-main-text">{team1Runs}/{team1Wickets}</span>
                <span className="text-[10px] text-gray-400">{team1Overs} ov</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-xl border transition-colors ${
              isTeam2Winner 
                ? 'bg-amber-500/10 border-amber-500/30 text-main-text' 
                : 'bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
            }`}>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="font-bold text-xs truncate max-w-[120px] text-main-text">{team2}</span>
                {isTeam2Winner && <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black shrink-0">WIN</span>}
              </div>
              <div className="flex items-baseline justify-between">
                <span className="font-black text-sm text-main-text">{team2Runs}/{team2Wickets}</span>
                <span className="text-[10px] text-gray-400">{team2Overs} ov</span>
              </div>
            </div>
          </div>

          {/* Tags Chips (Portfolio TechStack Style) */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {matchHighlights.slice(0, 4).map((tag, tIdx) => (
              <span 
                key={tIdx} 
                className="px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Actions & Metrics Bottom Bar - Exact Matching Portfolio Card */}
        <div className="flex items-center justify-between pt-5 border-t border-gray-100 dark:border-gray-800/50">
          {/* Left Metrics */}
          <div className="flex gap-4 sm:gap-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-primary/70 mb-0.5">Total Runs</p>
              <p className="text-sm sm:text-base font-black text-main-text tracking-tight font-mono">{totalMatchRuns} ({overallRunRate} rpo)</p>
            </div>
            {potm?.name && (
              <div className="hidden sm:block">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-0.5">Top Performer</p>
                <p className="text-sm sm:text-base font-black text-main-text tracking-tight truncate max-w-[110px]">{potm.name}</p>
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* WhatsApp Button */}
            <button
              type="button"
              onClick={(e) => onShareWhatsApp(m, e)}
              className="px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
              title="Share match summary on WhatsApp"
            >
              <Send size={11} />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            {/* PDF Button */}
            {onExportPDF && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExportPDF(m);
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-1.5 cursor-pointer border-none"
                title="Download Scorecard PDF"
              >
                <Download size={11} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}

            {/* Scorecard Link */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectMatch(m.id);
              }}
              className="inline-flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:gap-2.5 transition-all cursor-pointer border-none bg-transparent"
            >
              Scorecard
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const CompletedRecordsSlider: React.FC<CompletedRecordsSliderProps> = ({
  matches,
  onSelectMatch,
  onExportPDF,
  isScoreManager,
  homepageMode
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
        <div className="flex items-center justify-between gap-3 mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5">
              <Trophy size={12} className="text-amber-500" />
              {matches.length} Concluded Matches
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-Slide Toggle */}
            <button
              type="button"
              onClick={() => setIsAutoPlay(prev => !prev)}
              className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isAutoPlay 
                  ? 'bg-primary/10 text-primary border-primary/30' 
                  : 'bg-surface text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-800'
              }`}
              title={isAutoPlay ? 'Auto-slide is active (pauses on hover)' : 'Auto-slide is paused'}
            >
              {isAutoPlay ? <Play size={10} className="text-primary fill-primary" /> : <Pause size={10} />}
              <span>{isAutoPlay ? 'Auto-Slide' : 'Paused'}</span>
            </button>

            {/* Quick Prev / Next Navigator Counter */}
            <div className="flex items-center gap-1 bg-surface px-3 py-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary text-[11px] px-1 border-none bg-transparent cursor-pointer font-black"
                aria-label="Previous match"
              >
                ◀
              </button>
              <span className="text-[10px] font-mono font-bold text-primary px-1">
                {activeIndex + 1}/{matches.length}
              </span>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary text-[11px] px-1 border-none bg-transparent cursor-pointer font-black"
                aria-label="Next match"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Side Navigation Chevron Buttons (Directly matching Portfolio.tsx) */}
      {matches.length > 1 && (
        <>
          <div className="absolute -left-3 sm:-left-6 md:-left-8 top-[45%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hidden sm:block pointer-events-auto">
            <button 
              type="button"
              onClick={() => scroll('left')}
              className="p-4 sm:p-5 bg-surface text-primary hover:bg-primary hover:text-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-all transform hover:scale-110 border border-gray-100 dark:border-gray-700 active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="absolute -right-3 sm:-right-6 md:-right-8 top-[45%] -translate-y-1/2 z-30 opacity-0 group-hover/slider:opacity-100 transition-all duration-300 hidden sm:block pointer-events-auto">
            <button 
              type="button"
              onClick={() => scroll('right')}
              className="p-4 sm:p-5 bg-surface text-primary hover:bg-primary hover:text-white rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-all transform hover:scale-110 border border-gray-100 dark:border-gray-700 active:scale-95 cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </>
      )}

      {/* Enhanced Card Scrolling Slider Track - Identical Structure to Portfolio.tsx */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-6 md:gap-8 custom-scrollbar snap-x snap-mandatory scroll-smooth p-2 sm:p-4 no-scrollbar pb-6"
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
        <div className="flex-shrink-0 w-2 md:w-8 h-1" />
      </div>

      {/* Result Slider Pagination Dots & Direct Selector */}
      {matches.length > 1 && (
        <div className="flex items-center justify-between px-3 pt-2">
          <div className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400">
            <span>Match </span>
            <span className="text-primary font-black">{activeIndex + 1}</span>
            <span> of </span>
            <span>{matches.length}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 shadow-sm backdrop-blur-sm">
            {matches.map((match, idx) => (
              <button
                key={match.id}
                type="button"
                onClick={() => scrollToCard(idx)}
                className={`transition-all duration-300 border-none cursor-pointer p-0 ${
                  idx === activeIndex
                    ? 'w-6 h-2 rounded-full bg-primary shadow-sm shadow-primary/50'
                    : 'w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                title={`Result ${idx + 1}: ${match.teamA} vs ${match.teamB}`}
              />
            ))}
          </div>

          <div className="text-[11px] font-mono text-gray-400 hidden sm:block">
            {matches[activeIndex] ? `ID: ${matches[activeIndex].id.substring(0, 8)}` : ''}
          </div>
        </div>
      )}
    </div>
  );
};
