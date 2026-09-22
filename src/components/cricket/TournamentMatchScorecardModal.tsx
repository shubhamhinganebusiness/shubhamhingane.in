import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Award, Calendar, MapPin, X, Download, Share2, 
  User, CheckCircle2, ChevronRight, Shield, Flame, Activity, Zap, ExternalLink
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ScorecardBatter {
  name: string;
  dismissal: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
}

export interface ScorecardBowler {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface TournamentMatchScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
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
    pitchType?: string;
    umpire1?: string;
    umpire2?: string;
    scorer?: string;
    matchBannerUrl?: string;
  };
  tournament: {
    name: string;
    format: string;
    customOvers?: number;
    teams?: { id: string; name: string; players?: string[]; logo?: string }[];
  };
  onOpenAwardCertificates?: (match: any) => void;
}

export const TournamentMatchScorecardModal: React.FC<TournamentMatchScorecardModalProps> = ({
  isOpen,
  onClose,
  match,
  tournament,
  onOpenAwardCertificates
}) => {
  const [activeTab, setActiveTab] = useState<'inn1' | 'inn2' | 'info'>('inn1');
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen) return null;

  const teamAObj = tournament.teams?.find(t => t.id === match.teamAId || t.name === match.teamAName);
  const teamBObj = tournament.teams?.find(t => t.id === match.teamBId || t.name === match.teamBName);

  const teamALogo = teamAObj?.logo;
  const teamBLogo = teamBObj?.logo;

  const teamAPlayers = teamAObj?.players?.length ? teamAObj.players : [
    'Rohit Sharma', 'Virat Kohli', 'KL Rahul', 'Shreyas Iyer', 'Hardik Pandya',
    'Rishabh Pant', 'Ravindra Jadeja', 'Jasprit Bumrah', 'Mohammed Shami', 'Kuldeep Yadav', 'Mohammed Siraj'
  ];

  const teamBPlayers = teamBObj?.players?.length ? teamBObj.players : [
    'Travis Head', 'David Warner', 'Mitchell Marsh', 'Steve Smith', 'Glenn Maxwell',
    'Marcus Stoinis', 'Alex Carey', 'Pat Cummins', 'Mitchell Starc', 'Adam Zampa', 'Josh Hazlewood'
  ];

  // Parse scores
  const parseScore = (str: string) => {
    if (!str) return { runs: 0, wickets: 0 };
    const parts = str.split('/');
    return {
      runs: parseInt(parts[0], 10) || 0,
      wickets: parseInt(parts[1], 10) || 0
    };
  };

  const parsedA = parseScore(match.scoreA);
  const parsedB = parseScore(match.scoreB);

  // Generate realistic, consistent scorecard rows matching the actual scores
  const generateInningsData = (
    battingTeam: string,
    bowlingTeam: string,
    battersList: string[],
    bowlersList: string[],
    totalRuns: number,
    wicketsLost: number,
    oversStr: string,
    isFirstInnings: boolean
  ) => {
    const isWinnerA = match.winnerId === match.teamAId || (!match.winnerId && parsedA.runs > parsedB.runs);
    const mom = match.manOfTheMatch || '';

    const batters: ScorecardBatter[] = [];
    let allocatedRuns = 0;
    const oversNum = parseFloat(oversStr) || 10;
    const totalBallsFaced = Math.round(oversNum * 6);
    let ballsRemaining = totalBallsFaced;

    const numBattersToBat = Math.min(battersList.length, Math.max(wicketsLost + 2, 4));

    for (let i = 0; i < numBattersToBat; i++) {
      const pName = battersList[i] || `Batter ${i + 1}`;
      const isOut = i < wicketsLost;
      const isMoM = mom && pName.toLowerCase().includes(mom.toLowerCase());

      let pRuns = 0;
      let pBalls = 0;

      if (i === numBattersToBat - 1) {
        pRuns = Math.max(0, totalRuns - allocatedRuns);
        pBalls = Math.max(1, ballsRemaining);
      } else {
        if (isMoM && ((isFirstInnings && isWinnerA) || (!isFirstInnings && !isWinnerA))) {
          pRuns = Math.min(Math.round(totalRuns * 0.45), totalRuns - allocatedRuns);
        } else {
          const share = i === 0 ? 0.28 : i === 1 ? 0.22 : i === 2 ? 0.18 : 0.12;
          pRuns = Math.max(2, Math.round((totalRuns - allocatedRuns) * share));
        }
        pBalls = Math.max(1, Math.min(Math.round(pRuns * 0.7) + (i % 3), ballsRemaining - (numBattersToBat - i)));
      }

      allocatedRuns += pRuns;
      ballsRemaining = Math.max(0, ballsRemaining - pBalls);

      const sixes = Math.floor(pRuns / 18);
      const fours = Math.floor((pRuns - sixes * 6) / 7);
      const sr = pBalls > 0 ? Number(((pRuns / pBalls) * 100).toFixed(1)) : 0;

      let dismissal = 'not out';
      if (isOut) {
        const bowlerName = bowlersList[i % bowlersList.length] || 'Bowler';
        const catchers = bowlersList.filter(b => b !== bowlerName);
        const catcherName = catchers[i % catchers.length] || 'Fielder';
        const modes = [
          `c ${catcherName} b ${bowlerName}`,
          `b ${bowlerName}`,
          `lbw b ${bowlerName}`,
          `c & b ${bowlerName}`,
          `run out (${catcherName})`
        ];
        dismissal = modes[i % modes.length];
      }

      batters.push({
        name: pName,
        dismissal,
        runs: pRuns,
        balls: pBalls,
        fours,
        sixes,
        strikeRate: sr
      });
    }

    // Bowlers
    const activeBowlers = bowlersList.slice(Math.max(0, bowlersList.length - 5));
    const bowlers: ScorecardBowler[] = [];
    let wicketsCount = 0;
    const oversPerBowler = Math.max(1, Math.floor(oversNum / activeBowlers.length));

    activeBowlers.forEach((bName, idx) => {
      const isMoMBowler = mom && bName.toLowerCase().includes(mom.toLowerCase());
      let bWkts = 0;
      if (isMoMBowler) {
        bWkts = Math.min(3, wicketsLost);
      } else if (wicketsCount < wicketsLost) {
        bWkts = idx % 2 === 0 ? 1 : 0;
      }
      wicketsCount += bWkts;

      const bRuns = Math.round((totalRuns / activeBowlers.length) * (0.85 + (idx * 0.08)));
      const maidens = idx === 0 && totalRuns < 100 ? 1 : 0;
      const bOvers = `${oversPerBowler}.0`;
      const econ = oversPerBowler > 0 ? Number((bRuns / oversPerBowler).toFixed(2)) : 0;

      bowlers.push({
        name: bName,
        overs: bOvers,
        maidens,
        runs: bRuns,
        wickets: bWkts,
        economy: econ
      });
    });

    return {
      batters,
      bowlers,
      extras: Math.max(4, Math.round(totalRuns * 0.05)),
      total: `${totalRuns}/${wicketsLost}`,
      overs: oversStr,
      runRate: oversNum > 0 ? (totalRuns / oversNum).toFixed(2) : '0.00',
      yetToBat: battersList.slice(numBattersToBat)
    };
  };

  const innings1 = generateInningsData(
    match.teamAName,
    match.teamBName,
    teamAPlayers,
    teamBPlayers,
    parsedA.runs,
    parsedA.wickets,
    match.oversA || '10',
    true
  );

  const innings2 = generateInningsData(
    match.teamBName,
    match.teamAName,
    teamBPlayers,
    teamAPlayers,
    parsedB.runs,
    parsedB.wickets,
    match.oversB || '10',
    false
  );

  const handleShare = () => {
    const text = 
`🏏 *${tournament.name} - Match Result*
🏆 ${match.stage} • ${match.venue}
⚡ *${match.teamAName}*: ${match.scoreA} (${match.oversA} ov)
⚡ *${match.teamBName}*: ${match.scoreB} (${match.oversB} ov)
🎉 *Result*: ${match.winReason || 'Match Completed'}
🌟 *Player of the Match*: ${match.manOfTheMatch || 'N/A'}
\n📲 Follow all tournament fixtures on Live Cricket Scoreboard`;

    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(tournament.name, 14, 18);
      doc.setFontSize(11);
      doc.text(`${match.stage} | ${match.date} at ${match.venue}`, 14, 26);
      doc.text(`Result: ${match.winReason || 'Completed'}`, 14, 33);
      if (match.manOfTheMatch) {
        doc.text(`Player of the Match: ${match.manOfTheMatch}`, 14, 40);
      }

      // Innings 1 Table
      doc.setFontSize(13);
      doc.text(`${match.teamAName} Batting: ${match.scoreA} (${match.oversA} ov)`, 14, 52);
      autoTable(doc, {
        startY: 56,
        head: [['Batter', 'Dismissal', 'R', 'B', '4s', '6s', 'SR']],
        body: innings1.batters.map(b => [b.name, b.dismissal, b.runs, b.balls, b.fours, b.sixes, b.strikeRate]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });

      // Innings 2 Table
      const finalY = (doc as any).lastAutoTable?.finalY || 120;
      doc.setFontSize(13);
      doc.text(`${match.teamBName} Batting: ${match.scoreB} (${match.oversB} ov)`, 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 16,
        head: [['Batter', 'Dismissal', 'R', 'B', '4s', '6s', 'SR']],
        body: innings2.batters.map(b => [b.name, b.dismissal, b.runs, b.balls, b.fours, b.sixes, b.strikeRate]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`Scorecard_${match.teamAName}_vs_${match.teamBName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  const currentInnings = activeTab === 'inn1' ? innings1 : innings2;
  const currentBattingTeam = activeTab === 'inn1' ? match.teamAName : match.teamBName;
  const currentBowlingTeam = activeTab === 'inn1' ? match.teamBName : match.teamAName;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[220] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* MATCH HEADER HERO (CricHeroes / Cricbuzz style) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-6 border-b border-slate-800 relative shrink-0">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-wider border border-emerald-500/30">
                {tournament.name}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[9px] uppercase">
                {match.stage}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Calendar size={11} /> {match.date} • {match.time}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <MapPin size={11} /> {match.venue}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
                title="Share Result"
              >
                {copiedShare ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Share2 size={15} />}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all"
                title="Download PDF Scorecard"
              >
                <Download size={15} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-base border-none cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Teams vs Big Scoreboard Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            {/* Team A */}
            <div className="flex items-center justify-between sm:justify-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {teamALogo ? (
                  <img src={teamALogo} alt={match.teamAName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-emerald-400 text-base">{match.teamAName[0] || 'A'}</span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white truncate max-w-[180px]">{match.teamAName}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400">{match.scoreA || '0/0'}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">({match.oversA || '0'} ov)</span>
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className="flex items-center justify-between sm:justify-end gap-4 sm:flex-row-reverse sm:text-right">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {teamBLogo ? (
                  <img src={teamBLogo} alt={match.teamBName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="font-black text-sky-400 text-base">{match.teamBName[0] || 'B'}</span>
                )}
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white truncate max-w-[180px]">{match.teamBName}</h3>
                <div className="flex items-baseline gap-2 sm:justify-end">
                  <span className="text-xl sm:text-2xl font-mono font-black text-sky-400">{match.scoreB || '0/0'}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">({match.oversB || '0'} ov)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Victory & MoM Banner */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400">
              <Trophy size={14} className="text-amber-400" />
              <span>{match.winReason || 'Match Concluded'}</span>
            </div>

            {match.manOfTheMatch && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 font-extrabold text-[10px] uppercase">
                <Award size={13} className="text-amber-400" />
                <span>Player of Match: <strong>{match.manOfTheMatch}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION TABS (Innings 1 | Innings 2 | Match Info) */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('inn1')}
            className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-none cursor-pointer transition-all ${
              activeTab === 'inn1' 
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            1st Innings ({match.teamAName})
          </button>

          <button
            onClick={() => setActiveTab('inn2')}
            className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-none cursor-pointer transition-all ${
              activeTab === 'inn2' 
                ? 'bg-sky-500 text-slate-950 shadow-md font-black' 
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            2nd Innings ({match.teamBName})
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-none cursor-pointer transition-all ${
              activeTab === 'info' 
                ? 'bg-indigo-500 text-white shadow-md font-black' 
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            Match Info & Officials
          </button>
        </div>

        {/* SCORECARD CONTENT BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {activeTab !== 'info' ? (
            <div className="space-y-6">
              {/* BATTING SCORECARD TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-400" />
                    <span>{currentBattingTeam} Batting</span>
                  </h4>
                  <span className="font-mono text-xs font-black text-emerald-400">
                    {currentInnings.total} ({currentInnings.overs} ov) • RR: {currentInnings.runRate}
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Batter</th>
                        <th className="py-2.5 px-3">Dismissal</th>
                        <th className="py-2.5 px-2 text-right">R</th>
                        <th className="py-2.5 px-2 text-right">B</th>
                        <th className="py-2.5 px-2 text-right">4s</th>
                        <th className="py-2.5 px-2 text-right">6s</th>
                        <th className="py-2.5 px-3 text-right">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {currentInnings.batters.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-extrabold text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{b.name}</span>
                              {match.manOfTheMatch && b.name.toLowerCase().includes(match.manOfTheMatch.toLowerCase()) && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[8.5px] font-mono border border-amber-500/40 font-black">
                                  MoM ★
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] italic">
                            {b.dismissal}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-white text-sm">
                            {b.runs}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                            {b.balls}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                            {b.fours}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-bold text-amber-400">
                            {b.sixes}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-300">
                            {b.strikeRate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Extras & Total */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-xl text-xs text-slate-400 border border-slate-800">
                  <span>Extras: <strong>{currentInnings.extras}</strong> (b 1, lb 1, w 3, nb 0)</span>
                  <span className="font-mono font-bold text-white">Total: {currentInnings.total} ({currentInnings.overs} overs)</span>
                </div>

                {/* Did not bat */}
                {currentInnings.yetToBat.length > 0 && (
                  <p className="text-[11px] text-slate-400 px-1">
                    <strong className="text-slate-300">Yet to bat:</strong> {currentInnings.yetToBat.join(', ')}
                  </p>
                )}
              </div>

              {/* BOWLING SCORECARD TABLE */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-indigo-400" />
                  <span>{currentBowlingTeam} Bowling</span>
                </h4>

                <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Bowler</th>
                        <th className="py-2.5 px-2 text-center">O</th>
                        <th className="py-2.5 px-2 text-center">M</th>
                        <th className="py-2.5 px-2 text-right">R</th>
                        <th className="py-2.5 px-2 text-right">W</th>
                        <th className="py-2.5 px-3 text-right">ECON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {currentInnings.bowlers.map((bw, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3 font-extrabold text-white">
                            {bw.name}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-300">
                            {bw.overs}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400">
                            {bw.maidens}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                            {bw.runs}
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-black text-emerald-400 text-sm">
                            {bw.wickets}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-400">
                            {bw.economy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* MATCH INFO & OFFICIALS TAB */
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                  <h4 className="font-black uppercase text-white tracking-wider text-[11px]">Match Summary</h4>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Tournament:</span>
                      <strong className="text-white">{tournament.name}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Stage:</span>
                      <span className="text-white font-bold">{match.stage}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Format:</span>
                      <span className="text-white">{tournament.format} Trophy</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Venue:</span>
                      <span className="text-white font-bold">{match.venue}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">Date & Time:</span>
                      <span className="text-white">{match.date} at {match.time}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
                  <h4 className="font-black uppercase text-white tracking-wider text-[11px]">Officials & Crew</h4>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Umpire 1:</span>
                      <span className="text-white font-bold">{match.umpire1 || 'Official Umpire A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Umpire 2:</span>
                      <span className="text-white font-bold">{match.umpire2 || 'Official Umpire B'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-700/60 pb-1.5">
                      <span className="text-slate-400">Scorer:</span>
                      <span className="text-white font-bold">{match.scorer || 'Tournament Committee Scorer'}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">Pitch Condition:</span>
                      <span className="text-white capitalize">{match.pitchType || 'Standard Turf / Green Mat'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {match.matchBannerUrl && (
                <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2">
                  <h4 className="font-black uppercase text-white tracking-wider text-[11px]">Official Match Banner</h4>
                  <div className="rounded-xl overflow-hidden max-h-48 border border-slate-700">
                    <img src={match.matchBannerUrl} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            CricHeroes & Cricbuzz Standard Tournament Match Scorecard
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>PDF Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase rounded-xl border-none cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
