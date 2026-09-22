import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Award, Medal, Crown, Star, Flame, Target, 
  Sparkles, Tv, CheckCircle2, ChevronRight, User, 
  TrendingUp, Download, Share2, Shield, Eye, Edit3
} from 'lucide-react';
import { TournamentPrize } from '../../utils/cricketPrizeStorage';
import { calculateTournamentAwards, TournamentHonorsResult, AwardPlayerStats } from './modules/TournamentAwardsCalculator';

export interface TournamentAwardsPresentationCardProps {
  tournamentName: string;
  winnerTeamName?: string | null;
  matches: any[];
  teams?: any[];
  prizes: TournamentPrize[];
  onTriggerPresentationBoard: () => void;
  onUpdateAwardWinner?: (category: 'man_of_the_series' | 'best_batsman' | 'best_bowler', playerName: string, teamName: string) => void;
}

export const TournamentAwardsPresentationCard: React.FC<TournamentAwardsPresentationCardProps> = ({
  tournamentName,
  winnerTeamName,
  matches,
  teams = [],
  prizes,
  onTriggerPresentationBoard,
  onUpdateAwardWinner
}) => {
  const [showLeaderboards, setShowLeaderboards] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'awards' | 'leaderboards' | 'certificate'>('awards');
  const [manualOverrides, setManualOverrides] = useState<{
    manOfTheSeries?: string;
    bestBatsman?: string;
    bestBowler?: string;
  }>({});
  const [editingAward, setEditingAward] = useState<'man_of_the_series' | 'best_batsman' | 'best_bowler' | null>(null);

  // Compute tournament awards dynamically from match data and rosters
  const honors: TournamentHonorsResult = useMemo(() => {
    const calculated = calculateTournamentAwards(
      {
        id: 'active',
        name: tournamentName,
        teams,
        matches,
        winnerTeamName
      },
      prizes
    );

    // Apply any local user overrides
    if (manualOverrides.manOfTheSeries) {
      const matchPlayer = calculated.topMvpContenders.find(p => p.playerName === manualOverrides.manOfTheSeries);
      if (matchPlayer) {
        calculated.manOfTheSeries.player = matchPlayer;
        calculated.manOfTheSeries.headline = `${matchPlayer.mvpPoints} Impact Points across ${matchPlayer.matchesPlayed} matches (Manual Selection)`;
      }
    }
    if (manualOverrides.bestBatsman) {
      const matchPlayer = calculated.topRunScorers.find(p => p.playerName === manualOverrides.bestBatsman);
      if (matchPlayer) {
        calculated.bestBatsman.player = matchPlayer;
        calculated.bestBatsman.headline = `${matchPlayer.runs} Runs (Highest: ${matchPlayer.highScore}) (Manual Selection)`;
      }
    }
    if (manualOverrides.bestBowler) {
      const matchPlayer = calculated.topWicketTakers.find(p => p.playerName === manualOverrides.bestBowler);
      if (matchPlayer) {
        calculated.bestBowler.player = matchPlayer;
        calculated.bestBowler.headline = `${matchPlayer.wickets} Wickets at ${matchPlayer.economyRate} econ (Manual Selection)`;
      }
    }

    return calculated;
  }, [tournamentName, winnerTeamName, matches, teams, prizes, manualOverrides]);

  // All eligible players list for manual selector
  const allEligiblePlayers = useMemo(() => {
    const list: { name: string; team: string }[] = [];
    teams.forEach(t => {
      const pRoster: string[] = (t.players && Array.isArray(t.players)) 
        ? t.players.map((p: any) => typeof p === 'string' ? p : p.name) 
        : (t.captain ? [t.captain] : []);
      pRoster.forEach(p => {
        if (!list.some(x => x.name === p)) {
          list.push({ name: p, team: t.name });
        }
      });
    });
    return list;
  }, [teams]);

  const handlePrintCertificate = (title: string, winnerName: string, teamName: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to generate and print award certificates.");
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate of Achievement - ${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .cert-container {
            width: 800px;
            background: #ffffff;
            border: 12px double #d97706;
            padding: 40px 60px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
          }
          .title { font-size: 32px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 2px; }
          .subtitle { font-size: 16px; color: #64748b; margin-top: 5px; text-transform: uppercase; }
          .ribbon { font-size: 22px; color: #b45309; font-weight: bold; margin: 30px 0 10px; }
          .recipient { font-size: 38px; font-weight: 900; color: #0f172a; text-decoration: underline; margin: 15px 0; }
          .team { font-size: 18px; color: #475569; font-weight: bold; }
          .desc { font-size: 14px; color: #64748b; margin: 25px auto; max-width: 600px; line-height: 1.6; }
          .footer { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 13px; font-weight: bold; color: #334155; }
        </style>
      </head>
      <body>
        <div class="cert-container">
          <div class="subtitle">Official Gully Tournament Honors</div>
          <div class="title">${tournamentName}</div>
          <div class="ribbon">CERTIFICATE OF EXCELLENCE PRESENTED TO</div>
          <div class="recipient">${winnerName}</div>
          <div class="team">${teamName}</div>
          <div class="desc">
            In recognition of remarkable performance, extraordinary grit, and match-winning athletic excellence 
            in securing the prestigious <strong>${title}</strong> title.
          </div>
          <div class="footer">
            <div>Tournament Organizing Committee</div>
            <div>Official Authorized Umpire</div>
            <div>Date: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      id="tournament-final-awards-panel"
      className="p-5 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/50 border-2 border-amber-400/50 rounded-[2.5rem] shadow-2xl text-white space-y-6 relative overflow-hidden text-left"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner / Completion Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 border-b border-amber-500/20 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
            <Trophy size={32} className="animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-black uppercase border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 size={11} /> Tournament Final Complete
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[9px] font-black uppercase border border-amber-400/30">
                Official Ceremony
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
              Tournament Honors & Presentation Ceremony
            </h2>
            <p className="text-xs text-amber-200/80 font-medium">
              {tournamentName} • Automatic Awards calculation from all tournament fixtures
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setSelectedTab(selectedTab === 'leaderboards' ? 'awards' : 'leaderboards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition border ${
              selectedTab === 'leaderboards'
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <TrendingUp size={14} />
            <span>{selectedTab === 'leaderboards' ? 'View Ceremony Podium' : 'Tournament Leaderboards'}</span>
          </button>

          <button
            onClick={onTriggerPresentationBoard}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition shadow-lg shadow-amber-500/25 border-none shrink-0"
            title="Send Grand Honors board to Live TV overlay"
          >
            <Tv size={15} /> Trigger Broadcast Board
          </button>
        </div>
      </div>

      {/* TEAM PODIUM: Champions & Runners-Up */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        {/* Champions Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent border border-amber-400/50 shadow-inner relative space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Crown size={15} /> 1st Prize • Grand Champions
            </span>
            <span className="text-base font-black text-amber-300 font-mono">
              {honors.championTeam.prizeMoney}
            </span>
          </div>
          <p className="text-xl font-black text-white truncate flex items-center gap-2">
            <span>👑</span>
            <span>{honors.championTeam.name || 'Tournament Champions'}</span>
          </p>
          {honors.championTeam.sponsorName && (
            <div className="text-[11px] text-amber-200/90 flex items-center gap-1.5 pt-1 border-t border-amber-500/20">
              {honors.championTeam.sponsorPhoto ? (
                <img
                  src={honors.championTeam.sponsorPhoto}
                  alt={honors.championTeam.sponsorName}
                  className="w-5 h-5 rounded-full object-cover border border-amber-400"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span>Awarded by: <strong>{honors.championTeam.sponsorName}</strong></span>
            </div>
          )}
        </div>

        {/* Runners-Up Card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-slate-800/80 via-slate-800/40 to-transparent border border-slate-600/50 shadow-inner relative space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Medal size={15} /> 2nd Prize • Runners-Up
            </span>
            <span className="text-base font-black text-slate-200 font-mono">
              {honors.runnerUpTeam?.prizeMoney}
            </span>
          </div>
          <p className="text-xl font-black text-slate-100 truncate flex items-center gap-2">
            <span>🥈</span>
            <span>{honors.runnerUpTeam?.name || 'Tournament Finalist'}</span>
          </p>
          {honors.runnerUpTeam?.sponsorName && (
            <div className="text-[11px] text-slate-300/90 flex items-center gap-1.5 pt-1 border-t border-slate-700">
              {honors.runnerUpTeam.sponsorPhoto ? (
                <img
                  src={honors.runnerUpTeam.sponsorPhoto}
                  alt={honors.runnerUpTeam.sponsorName}
                  className="w-5 h-5 rounded-full object-cover border border-slate-400"
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span>Awarded by: <strong>{honors.runnerUpTeam.sponsorName}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* CORE REQUIREMENT 2: THE THREE PRIMARY AUTOMATIC TOURNAMENT HONORS */}
      {/* 1. Man of the Series, 2. Best Batsman (Orange Cap), 3. Best Bowler (Purple Cap) */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles size={14} /> Individual Series Honors (Automatically Determined)
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Computed from all Tournament Matches
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ========================================================================= */}
          {/* 1. MAN OF THE SERIES (MVP) */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-amber-900/20 border-2 border-amber-500/50 shadow-xl relative flex flex-col justify-between group hover:border-amber-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  Man of the Series
                </span>
                <span className="text-sm font-black font-mono text-amber-300">
                  {honors.manOfTheSeries.prizeMoney}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  👑
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-black text-white truncate">
                    {honors.manOfTheSeries.player.playerName}
                  </h4>
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5 truncate">
                    <span>{honors.manOfTheSeries.player.teamName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase">
                      {honors.manOfTheSeries.player.role}
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                {honors.manOfTheSeries.headline}
              </p>

              {/* Stats Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20">
                {honors.manOfTheSeries.statHighlights.map((st, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-950/60 border border-amber-500/15">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block">{st.label}</span>
                    <span className="text-sm font-black text-amber-300 font-mono">{st.value}</span>
                    <span className="text-[8.5px] font-bold text-slate-500 block truncate">{st.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between gap-2">
              <button
                onClick={() => handlePrintCertificate('Man of the Series (Tournament MVP)', honors.manOfTheSeries.player.playerName, honors.manOfTheSeries.player.teamName)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase flex items-center gap-1 border border-amber-500/30 cursor-pointer"
              >
                <Download size={11} /> Certificate
              </button>

              <button
                onClick={() => setEditingAward(editingAward === 'man_of_the_series' ? null : 'man_of_the_series')}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <Edit3 size={11} /> Override Winner
              </button>
            </div>

            {/* Manual Override Dropdown */}
            {editingAward === 'man_of_the_series' && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                <span className="text-[9px] font-black uppercase text-amber-300 block">Select Committee Verdict Winner:</span>
                <select
                  value={honors.manOfTheSeries.player.playerName}
                  onChange={(e) => {
                    const selected = allEligiblePlayers.find(p => p.name === e.target.value);
                    if (selected) {
                      setManualOverrides(prev => ({ ...prev, manOfTheSeries: selected.name }));
                      if (onUpdateAwardWinner) onUpdateAwardWinner('man_of_the_series', selected.name, selected.team);
                    }
                    setEditingAward(null);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none font-bold"
                >
                  {allEligiblePlayers.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} ({p.team})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. BEST BATSMAN (ORANGE CAP) */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-orange-950/40 via-slate-900 to-orange-900/20 border-2 border-orange-500/50 shadow-xl relative flex flex-col justify-between group hover:border-orange-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Flame size={12} className="text-orange-400 fill-orange-400" />
                  Best Batsman • Orange Cap
                </span>
                <span className="text-sm font-black font-mono text-orange-300">
                  {honors.bestBatsman.prizeMoney}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  🏏
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-black text-white truncate">
                    {honors.bestBatsman.player.playerName}
                  </h4>
                  <p className="text-xs font-bold text-orange-400 flex items-center gap-1.5 truncate">
                    <span>{honors.bestBatsman.player.teamName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase">
                      Top Run-Scorer
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                {honors.bestBatsman.headline}
              </p>

              {/* Stats Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-500/20">
                {honors.bestBatsman.statHighlights.map((st, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-950/60 border border-orange-500/15">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block">{st.label}</span>
                    <span className="text-sm font-black text-orange-300 font-mono">{st.value}</span>
                    <span className="text-[8.5px] font-bold text-slate-500 block truncate">{st.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-orange-500/20 flex items-center justify-between gap-2">
              <button
                onClick={() => handlePrintCertificate('Best Batsman (Orange Cap)', honors.bestBatsman.player.playerName, honors.bestBatsman.player.teamName)}
                className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-[10px] font-black uppercase flex items-center gap-1 border border-orange-500/30 cursor-pointer"
              >
                <Download size={11} /> Certificate
              </button>

              <button
                onClick={() => setEditingAward(editingAward === 'best_batsman' ? null : 'best_batsman')}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <Edit3 size={11} /> Override Winner
              </button>
            </div>

            {/* Manual Override Dropdown */}
            {editingAward === 'best_batsman' && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-orange-500/40 space-y-2">
                <span className="text-[9px] font-black uppercase text-orange-300 block">Select Orange Cap Winner:</span>
                <select
                  value={honors.bestBatsman.player.playerName}
                  onChange={(e) => {
                    const selected = allEligiblePlayers.find(p => p.name === e.target.value);
                    if (selected) {
                      setManualOverrides(prev => ({ ...prev, bestBatsman: selected.name }));
                      if (onUpdateAwardWinner) onUpdateAwardWinner('best_batsman', selected.name, selected.team);
                    }
                    setEditingAward(null);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none font-bold"
                >
                  {allEligiblePlayers.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} ({p.team})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 3. BEST BOWLER (PURPLE CAP) */}
          {/* ========================================================================= */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-900/20 border-2 border-purple-500/50 shadow-xl relative flex flex-col justify-between group hover:border-purple-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Target size={12} className="text-purple-400" />
                  Best Bowler • Purple Cap
                </span>
                <span className="text-sm font-black font-mono text-purple-300">
                  {honors.bestBowler.prizeMoney}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  ⚡
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-black text-white truncate">
                    {honors.bestBowler.player.playerName}
                  </h4>
                  <p className="text-xs font-bold text-purple-400 flex items-center gap-1.5 truncate">
                    <span>{honors.bestBowler.player.teamName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 uppercase">
                      Top Wicket-Taker
                    </span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                {honors.bestBowler.headline}
              </p>

              {/* Stats Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-500/20">
                {honors.bestBowler.statHighlights.map((st, i) => (
                  <div key={i} className="p-2 rounded-xl bg-slate-950/60 border border-purple-500/15">
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block">{st.label}</span>
                    <span className="text-sm font-black text-purple-300 font-mono">{st.value}</span>
                    <span className="text-[8.5px] font-bold text-slate-500 block truncate">{st.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between gap-2">
              <button
                onClick={() => handlePrintCertificate('Best Bowler (Purple Cap)', honors.bestBowler.player.playerName, honors.bestBowler.player.teamName)}
                className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase flex items-center gap-1 border border-purple-500/30 cursor-pointer"
              >
                <Download size={11} /> Certificate
              </button>

              <button
                onClick={() => setEditingAward(editingAward === 'best_bowler' ? null : 'best_bowler')}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <Edit3 size={11} /> Override Winner
              </button>
            </div>

            {/* Manual Override Dropdown */}
            {editingAward === 'best_bowler' && (
              <div className="mt-3 p-3 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-2">
                <span className="text-[9px] font-black uppercase text-purple-300 block">Select Purple Cap Winner:</span>
                <select
                  value={honors.bestBowler.player.playerName}
                  onChange={(e) => {
                    const selected = allEligiblePlayers.find(p => p.name === e.target.value);
                    if (selected) {
                      setManualOverrides(prev => ({ ...prev, bestBowler: selected.name }));
                      if (onUpdateAwardWinner) onUpdateAwardWinner('best_bowler', selected.name, selected.team);
                    }
                    setEditingAward(null);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none font-bold"
                >
                  {allEligiblePlayers.map((p, idx) => (
                    <option key={idx} value={p.name}>{p.name} ({p.team})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXPANDABLE TOURNAMENT LEADERBOARDS SECTION */}
      <AnimatePresence>
        {selectedTab === 'leaderboards' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-amber-500/20"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <TrendingUp size={16} /> Tournament Statistical Rankings
              </h4>
              <button
                onClick={() => setSelectedTab('awards')}
                className="text-xs text-slate-400 hover:text-white font-bold uppercase cursor-pointer bg-transparent border-none"
              >
                Close Rankings ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Top Batsmen Table */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-orange-500/20 space-y-2.5">
                <div className="flex items-center justify-between border-b border-orange-500/20 pb-2">
                  <span className="font-black uppercase text-orange-400 flex items-center gap-1.5">
                    <Flame size={13} /> Orange Cap Leaderboard
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Runs (SR)</span>
                </div>
                <div className="space-y-1.5">
                  {honors.topRunScorers.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${i === 0 ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-[11px]">{p.playerName}</p>
                          <p className="text-[9px] text-slate-400 truncate">{p.teamName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-orange-300 font-mono">{p.runs}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">SR {p.strikeRate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Bowlers Table */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/20 space-y-2.5">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <span className="font-black uppercase text-purple-400 flex items-center gap-1.5">
                    <Target size={13} /> Purple Cap Leaderboard
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Wkts (Econ)</span>
                </div>
                <div className="space-y-1.5">
                  {honors.topWicketTakers.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${i === 0 ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-[11px]">{p.playerName}</p>
                          <p className="text-[9px] text-slate-400 truncate">{p.teamName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-purple-300 font-mono">{p.wickets} W</span>
                        <span className="text-[9px] text-slate-400 block font-mono">Econ {p.economyRate || 6.2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MVP Impact Points Table */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/20 space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Star size={13} /> Series MVP Contenders
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Impact Pts</span>
                </div>
                <div className="space-y-1.5">
                  {honors.topMvpContenders.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-white/5 hover:bg-white/10">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${i === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-[11px]">{p.playerName}</p>
                          <p className="text-[9px] text-slate-400 truncate">{p.teamName}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-amber-300 font-mono">{p.mvpPoints} pts</span>
                        <span className="text-[9px] text-slate-400 block font-mono">{p.runs}R / {p.wickets}W</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
