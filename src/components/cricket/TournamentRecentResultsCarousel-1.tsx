import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Award, ChevronLeft, ChevronRight, Calendar, 
  ExternalLink, FileText, CheckCircle2, Sparkles
} from 'lucide-react';

interface RecentMatchItem {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  date: string;
  time: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed';
  scoreA: string;
  scoreB: string;
  oversA: string;
  oversB: string;
  winnerId: string | null;
  winReason: string;
  manOfTheMatch: string;
  stage: string;
  matchBannerUrl?: string;
}

interface TournamentRecentResultsCarouselProps {
  matches: RecentMatchItem[];
  teams?: { id: string; name: string; logo?: string }[];
  onOpenScorecard: (match: RecentMatchItem) => void;
  onOpenAwardsCertificates?: (match: RecentMatchItem) => void;
}

export const TournamentRecentResultsCarousel: React.FC<TournamentRecentResultsCarouselProps> = ({
  matches,
  teams = [],
  onOpenScorecard,
  onOpenAwardsCertificates
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const completedMatches = matches.filter(m => m.status === 'completed');

  if (completedMatches.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Header with Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Trophy size={13} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>Recent Match Results</span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-mono font-black border border-emerald-500/20">
                {completedMatches.length} Matches
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center border-none cursor-pointer transition-all"
            title="Scroll left"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center border-none cursor-pointer transition-all"
            title="Scroll right"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {completedMatches.map(m => {
          const teamAObj = teams.find(t => t.id === m.teamAId || t.name === m.teamAName);
          const teamBObj = teams.find(t => t.id === m.teamBId || t.name === m.teamBName);

          const isWinnerA = m.winnerId === m.teamAId || (!m.winnerId && parseInt(m.scoreA, 10) > parseInt(m.scoreB, 10));
          const isWinnerB = m.winnerId === m.teamBId || (!m.winnerId && parseInt(m.scoreB, 10) > parseInt(m.scoreA, 10));

          return (
            <motion.div
              key={m.id}
              whileHover={{ y: -2 }}
              onClick={() => onOpenScorecard(m)}
              className="min-w-[280px] max-w-[280px] sm:min-w-[310px] sm:max-w-[310px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between shrink-0 snap-start select-none"
            >
              {/* Top metadata */}
              <div>
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold">
                    {m.stage}
                  </span>
                  <span>{m.date}</span>
                </div>

                {/* Matchup row 1: Team A */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {teamAObj?.logo ? (
                          <img src={teamAObj.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[9px] font-black text-indigo-500">{m.teamAName[0]}</span>
                        )}
                      </div>
                      <span className={`text-xs font-black truncate ${isWinnerA ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {m.teamAName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-xs font-black ${isWinnerA ? 'text-emerald-500 font-black' : 'text-slate-600 dark:text-slate-300'}`}>
                        {m.scoreA}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 ml-1">({m.oversA} ov)</span>
                    </div>
                  </div>

                  {/* Matchup row 2: Team B */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {teamBObj?.logo ? (
                          <img src={teamBObj.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="text-[9px] font-black text-sky-500">{m.teamBName[0]}</span>
                        )}
                      </div>
                      <span className={`text-xs font-black truncate ${isWinnerB ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                        {m.teamBName}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-mono text-xs font-black ${isWinnerB ? 'text-emerald-500 font-black' : 'text-slate-600 dark:text-slate-300'}`}>
                        {m.scoreB}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 ml-1">({m.oversB} ov)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Winner badge & Action CTA */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]">
                  {m.winReason || 'Completed'}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {onOpenAwardsCertificates && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAwardsCertificates(m);
                      }}
                      className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Download Award Certificates"
                    >
                      <Award size={10} /> Certificates
                    </button>
                  )}
                  <span className="text-[9px] font-black uppercase text-indigo-500 flex items-center gap-0.5 hover:underline">
                    <FileText size={10} /> Scorecard
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
