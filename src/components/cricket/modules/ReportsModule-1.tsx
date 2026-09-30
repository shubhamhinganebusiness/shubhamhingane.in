import React, { useState } from 'react';
import { Download, Landmark, FileSpreadsheet, Star, ChartLine, Award, Lock, ListFilter, FileDown, Mail, Send, X, Trophy, Check } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, PieChart, Pie, Legend } from 'recharts';
import { Player, Team } from '../CricketAuction';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsModuleProps {
  players: Player[];
  teams: Team[];
  formatPrice: (val: number) => string;
  handleExportCSV: () => void;
  summarySearch: string;
  setSummarySearch: (val: string) => void;
  summaryFilter: 'all' | 'sold' | 'unsold';
  setSummaryFilter: (val: 'all' | 'sold' | 'unsold') => void;
  finalFilteredPlayers: Player[];
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  players,
  teams,
  formatPrice,
  handleExportCSV,
  summarySearch,
  setSummarySearch,
  summaryFilter,
  setSummaryFilter,
  finalFilteredPlayers,
  showNotification
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'rosters' | 'spending' | 'receipts'>('rosters');
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>('shubhamhingane9421@gmail.com');
  const [emailSending, setEmailSending] = useState<boolean>(false);
  const [emailSuccess, setEmailSuccess] = useState<boolean>(false);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailAddress) return;
    setEmailSending(true);
    setTimeout(() => {
      setEmailSending(false);
      setEmailSuccess(true);
      showNotification(`Official league squad rosters dispatched to ${emailAddress}!`, 'success');
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccess(false);
      }, 1500);
    }, 1200);
  };

  // Group and sum spending by playing styles (Openers vs Bowlers, etc.)
  const roleSpendingMap = {
    'Batsmen': 0,
    'Bowlers': 0,
    'All-Rounders': 0,
    'Wicket-Keepers': 0
  };

  players.filter(p => p.status === 'Sold' && p.soldPrice).forEach(p => {
    const priceVal = p.soldPrice || 0;
    if (p.role === 'Batsman') {
      roleSpendingMap['Batsmen'] += priceVal;
    } else if (p.role === 'Bowler') {
      roleSpendingMap['Bowlers'] += priceVal;
    } else if (p.role === 'All-Rounder') {
      roleSpendingMap['All-Rounders'] += priceVal;
    } else if (p.role === 'Wicket-Keeper') {
      roleSpendingMap['Wicket-Keepers'] += priceVal;
    } else {
      roleSpendingMap['Batsmen'] += priceVal;
    }
  });

  const roleSpendingData = [
    { name: 'Batsmen', value: Number(roleSpendingMap['Batsmen'].toFixed(2)), color: '#3b82f6' },
    { name: 'Bowlers', value: Number(roleSpendingMap['Bowlers'].toFixed(2)), color: '#f43f5e' },
    { name: 'All-Rounders', value: Number(roleSpendingMap['All-Rounders'].toFixed(2)), color: '#10b981' },
    { name: 'Wicket-Keepers', value: Number(roleSpendingMap['Wicket-Keepers'].toFixed(2)), color: '#f59e0b' }
  ].filter(item => item.value > 0);

  // Fallback if no sales recorded yet
  if (roleSpendingData.length === 0) {
    roleSpendingData.push({ name: 'No acquisitions recorded yet', value: 1.0, color: '#475569' });
  }

  // Calculate budget charts datasets
  const chartData = teams.map(t => {
    const totalSpend = t.initialPurse - t.purse;
    return {
      name: t.name.split(' ')[0], // Mumbai, Chennai, etc
      Spent: Number(totalSpend.toFixed(2)),
      Purse: Number(t.purse.toFixed(2)),
      color: t.bgColor
    };
  });

  const pieData = teams.map(t => {
    return {
      name: t.name,
      value: Number(t.purse.toFixed(2)),
      color: t.bgColor || '#3b82f6'
    };
  });

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF() as any;
      
      // Page Header Banner Stylings
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setTextColor(245, 158, 11); 
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("GULLYSCORE LEAGUE TOURNEY", 14, 15);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("OFFICIAL DRAFT CONTRACT BOOK - TOURNAMENT COMPLIANCE DOSSIER", 14, 23);
      
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(7);
      doc.text(`RECORD-KEEPING REGISTERED ID: GSL-DRAFT-${Date.now()}  •  GENERATED: ${new Date().toLocaleString()}`, 14, 30);

      // Section label
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.text("FRANCHISE SQUAD PORTFOLIO STATISTICS", 14, 48);

      // We list teams and their spending
      const teamSummaryRows = teams.map((t, idx) => {
        const acquired = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
        const spent = t.initialPurse - t.purse;
        return [
          idx + 1,
          t.name.toUpperCase(),
          t.manager || 'UNASSIGNED',
          t.tableNo || 'N/A',
          `${acquired.length} Players`,
          `Spent: INR ${spent.toFixed(2)} Cr`,
          `Purse Left: INR ${t.purse.toFixed(2)} Cr`
        ];
      });

      autoTable(doc, {
        startY: 52,
        head: [['#', 'Franchise Title', 'Chief Representative', 'Table Coord', 'Squad Limit', 'Total Spent Value', 'Remaining Wallet']],
        body: teamSummaryRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 38 },
          2: { cellWidth: 35 },
          3: { cellWidth: 20 },
          4: { cellWidth: 22 },
          5: { cellWidth: 32 },
          6: { cellWidth: 32 }
        }
      });

      // Section 2: Complete Sold Players List
      const activeY = (doc as any).lastAutoTable.finalY + 12;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text("CONSOLIDATED LEAGUE COMPLETED CONTRACTS LEDGER", 14, activeY);

      const soldPlayersList = players.filter(p => p.status === 'Sold');
      const soldSummaryRows = soldPlayersList.map((p, idx) => {
        const buyTeam = teams.find(t => t.id === p.soldTo);
        return [
          idx + 1,
          p.name.toUpperCase(),
          p.role.toUpperCase(),
          p.country.toUpperCase(),
          buyTeam ? buyTeam.name.toUpperCase() : 'N/A',
          `INR ${formatPrice(p.soldPrice || p.basePrice)} Crores`
        ];
      });

      autoTable(doc, {
        startY: activeY + 4,
        head: [['Seq #', 'Player Candidate Name', 'Playing Specialty', 'Classification', 'Acquirer Franchise', 'Final Purchase Price']],
        body: soldSummaryRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 46 },
          2: { cellWidth: 32 },
          3: { cellWidth: 28 },
          4: { cellWidth: 42 },
          5: { cellWidth: 32 }
        }
      });

      doc.save(`GullyScore_Official_AuctionResults_${Date.now()}.pdf`);
      showNotification("Auction Record results PDF generated successfully!", "success");
    } catch (e) {
      console.error(e);
      showNotification("Error downloading Auction results PDF document.", "alert");
    }
  };

  const soldPlayers = players.filter(p => p.status === 'Sold');

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6 text-xs">
      
      {/* Top Header Controls bar */}
      <div className="pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Official GPL report Sheets</h3>
          <span className="text-[9px] text-slate-500 uppercase mt-1 block font-bold">Roster sheets • budget logs • contract invoices</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub tabs switches */}
          <div className="flex bg-slate-950 rounded-xl border border-slate-850 p-0.5">
            {[
              { id: 'rosters', label: 'Squad Sheets', icon: FileSpreadsheet },
              { id: 'spending', label: 'Budget ratio', icon: ChartLine },
              { id: 'receipts', label: 'Deal Receipts', icon: Award }
            ].map((subT) => {
              const Icon = subT.icon;
              return (
                <button
                  key={subT.id}
                  onClick={() => setActiveSubTab(subT.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-lg border-none cursor-pointer transition-all ${
                    activeSubTab === subT.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 bg-transparent hover:text-white'
                  }`}
                >
                  <Icon size={11} />
                  <span>{subT.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleExportPDF}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1 cursor-pointer shadow shadow-amber-500/10 font-sans"
          >
            <FileDown size={11} /> Export Results PDF
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-1.5 bg-emerald-550 hover:bg-emerald-600 text-slate-950 text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1 cursor-pointer shadow shadow-emerald-500/10 font-sans"
          >
            <Download size={11} /> Export CSV
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1 cursor-pointer shadow shadow-indigo-600/10 font-sans animate-bounce"
          >
            <Mail size={11} /> Email Rosters ✉️
          </button>
        </div>
      </div>

      {/* SUB-PANEL 1: SQUAD SHEETS */}
      {activeSubTab === 'rosters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* FRANCHISES LIST LEFT (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900/40 border border-slate-850 rounded-2xl p-4 space-y-4">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2 flex items-center gap-1">
              <Landmark size={11} /> Franchise Draft Ledger Summary
            </span>

            <div className="space-y-4">
              {teams.map((t) => {
                const acquired = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
                const invest = t.initialPurse - t.purse;
                return (
                  <div key={t.id} className="p-3 bg-slate-950/60 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-3 rounded" style={{ backgroundColor: t.bgColor }} />
                      <span className="font-extrabold uppercase text-xs text-white leading-none">{t.name}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-950 p-2 rounded-lg border border-slate-900 text-[10px]">
                      <div>
                        <span className="text-[7px] text-slate-500 font-bold block uppercase leading-none">Drafted</span>
                        <span className="font-bold text-white block mt-1">{acquired.length} slot</span>
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-500 font-bold block uppercase leading-none">Spent</span>
                        <span className="font-mono font-bold text-[#f59e0b] block mt-1">{invest.toFixed(2)} Cr</span>
                      </div>
                      <div>
                        <span className="text-[7px] text-slate-500 font-bold block uppercase leading-none">Purse</span>
                        <span className="font-mono font-bold text-emerald-400 block mt-1">{t.purse.toFixed(2)} Cr</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DRAFTS LIST REGISTER RIGHT (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900/40 border border-[#1e293b] rounded-2xl p-4 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <span className="font-black uppercase text-[#f59e0b] text-[10px] tracking-wider block">Consolidated Draft Register</span>

              {/* Filtering / search controls */}
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Filter by player/role..." 
                  value={summarySearch}
                  onChange={(e) => setSummarySearch(e.target.value)}
                  className="bg-slate-950 border border-slate-850 text-xs px-3 py-1 rounded-lg text-white outline-none focus:border-amber-500"
                />

                {['all', 'sold', 'unsold'].map((st: any) => (
                  <button
                    key={st}
                    onClick={() => setSummaryFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border-none transition-all ${
                      summaryFilter === st 
                        ? 'bg-amber-500 text-slate-950 font-black' 
                        : 'bg-slate-950 text-slate-450 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE SUMMARY RECORD SHEETS */}
            <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-[8px] uppercase font-black tracking-wider border-b border-slate-900">
                    <th className="p-2.5">Player Profile</th>
                    <th className="p-2.5">Speciality Type</th>
                    <th className="p-2.5 text-right font-mono">Base Price</th>
                    <th className="p-2.5">Nationality</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Drafted Franchise</th>
                    <th className="p-2.5 text-right font-mono text-[#f59e0b]">Value Index</th>
                    <th className="p-2.5 text-right">Draft Price Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 font-sans">
                  {finalFilteredPlayers.map((p) => {
                    const finalTeam = teams.find(t => t.id === p.soldTo);
                    const basePriceVal = p.basePrice || 0.1;
                    const soldPriceVal = p.soldPrice || 0;
                    const valMultiplier = soldPriceVal > 0 ? (soldPriceVal / basePriceVal) : 1;
                    
                    let multiplierColor = 'text-slate-500';
                    if (p.status === 'Sold') {
                      if (valMultiplier >= 3.0) {
                        multiplierColor = 'text-emerald-400 font-extrabold animate-pulse';
                      } else if (valMultiplier >= 1.5) {
                        multiplierColor = 'text-amber-400 font-bold';
                      } else {
                        multiplierColor = 'text-slate-300';
                      }
                    }

                    const maxSoldPrice = Math.max(...players.filter(pl => pl.status === 'Sold' && pl.soldPrice).map(pl => pl.soldPrice || 0), 0);
                    const isAbsoluteMVP = p.status === 'Sold' && p.soldPrice && p.soldPrice === maxSoldPrice && maxSoldPrice > 0;

                    return (
                      <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-2.5 font-bold text-white uppercase">
                          <div className="flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {isAbsoluteMVP && (
                              <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[6.5px] font-black rounded tracking-widest flex items-center gap-0.5 animate-pulse">
                                👑 MVP
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-slate-900 rounded text-slate-400 uppercase text-[8px] font-black border border-slate-850">
                            {p.role}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium text-slate-400">{formatPrice(basePriceVal)}</td>
                        <td className="p-2.5 text-slate-350 font-medium">{p.country === 'Indian' ? 'Indian 🇮🇳' : 'Overseas 🌍'}</td>
                        <td className="p-2.5">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            p.status === 'Sold' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-black uppercase text-slate-200">
                          {finalTeam ? (
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: finalTeam.bgColor }} />
                              <span>{finalTeam.name.split(' ')[0]}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className={`p-2.5 text-right font-mono text-[10px] ${multiplierColor}`}>
                          {p.status === 'Sold' && soldPriceVal > 0 ? `${valMultiplier.toFixed(1)}x` : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-[#f59e0b]">
                          {p.soldPrice ? formatPrice(p.soldPrice) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-PANEL 2: SPENDING BAR CHART & TEAM PURSE DISTRIBUTION PIE CHART */}
      {activeSubTab === 'spending' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* MVP HIGHLIGHT BOARD */}
          <div className="col-span-full bg-gradient-to-r from-amber-950/20 to-slate-900/40 p-4 border border-amber-500/20 rounded-2xl space-y-3 shadow-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] block border-b border-slate-800 pb-2 flex items-center gap-1.5 animate-pulse">
              <Star size={12} className="text-amber-400 fill-amber-400" /> 🏆 AUCTION MOST VALUABLE PLAYERS (MVPs)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {players
                .filter(p => p.status === 'Sold' && p.soldPrice)
                .sort((a, b) => (b.soldPrice || 0) - (a.soldPrice || 0))
                .slice(0, 3)
                .map((mvp, idx) => {
                  const team = teams.find(t => t.id === mvp.soldTo);
                  const valMultiplier = mvp.soldPrice && mvp.basePrice ? (mvp.soldPrice / mvp.basePrice) : 1;
                  return (
                    <div key={mvp.id} className="p-3 bg-slate-950 border border-slate-850 hover:border-amber-500/30 rounded-xl relative overflow-hidden transition-all flex items-center justify-between shadow-inner">
                      <div className="absolute top-0 right-0 p-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-bl text-[8px] font-black uppercase font-mono border-l border-b border-amber-500/10">
                        RANK #{idx + 1}
                      </div>
                      <div className="space-y-1.5 min-w-0 pr-10">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-lg flex-shrink-0">👑</span>
                          <div className="min-w-0">
                            <span className="font-black text-white uppercase text-[10.5px] block truncate">{mvp.name}</span>
                            <span className="text-[8px] text-zinc-400 uppercase font-black tracking-wider block truncate">{mvp.role} • {mvp.country === 'Indian' ? '🇮🇳 Indian' : '🌍 Overseas'}</span>
                          </div>
                        </div>
                        <div className="text-[9px] text-[#f59e0b] font-black uppercase tracking-tight truncate">
                          Acquired by: <span className="text-slate-200">{team?.name || 'Unassigned'}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[8px] text-zinc-500 block uppercase font-black leading-none mb-0.5">Sold Price</span>
                        <span className="text-xs font-mono font-black text-amber-400 block">{formatPrice(mvp.soldPrice || 0)} Cr</span>
                        <span className="text-[8px] font-mono font-black text-emerald-400 block mt-0.5">{valMultiplier.toFixed(1)}x Base</span>
                      </div>
                    </div>
                  );
                })}
              {players.filter(p => p.status === 'Sold' && p.soldPrice).length === 0 && (
                <div className="col-span-full py-6 text-center text-slate-500 text-[9px] uppercase font-black tracking-widest font-mono">
                  No draft acquisitions completed yet. Conclude bid rounds in the Arena to crown MVPs!
                </div>
              )}
            </div>
          </div>
          
          {/* BAR CHART CARD */}
          <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-2xl space-y-4">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2 flex items-center gap-1">
              <span>📊 Franchise Total Spending vs. Remaining Purse Reserves (₹ Crores)</span>
            </span>

            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <YAxis stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }}
                    labelClassName="font-black text-slate-200"
                  />
                  <Bar dataKey="Spent" stackId="a" fill="#be123c" name="Spent budget" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Purse" stackId="a" fill="#10b981" name="Remaining purse" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

           {/* ROLE SPENDING RATIO PIE CHART CARD */}
          <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-2xl space-y-4">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2 flex items-center gap-1">
              <span>🥧 Spending Portfolio: Playing Speciality Styles (₹ Crores)</span>
            </span>

            <div className="h-64 mt-4 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleSpendingData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {roleSpendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                    formatter={(val: any) => [`₹ ${val} Crores`, 'Spent Budget']}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '8px', textTransform: 'uppercase', fontStyle: 'bold', bottom: 0 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* SUB-PANEL 3: RECEIPT GENERATIONS */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-4">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block border-b border-slate-800 pb-2">
            📜 Official GPL draft settles transaction receipts
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {soldPlayers.map((sol) => {
              const buyTeam = teams.find(t => t.id === sol.soldTo);
              const receiptNo = `GPL-` + sol.id.replace('p_self_', '').replace('p_csv_', '') + `-` + Math.floor(Math.random() * 900 + 100);
              
              return (
                <div key={sol.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden font-mono space-y-3 shadow shadow-indigo-500/5">
                  <div className="absolute top-0 right-0 p-1 font-sans text-[7px] font-black bg-emerald-500 text-slate-950 uppercase tracking-widest rounded-bl transform rotate-2">
                    Settled
                  </div>

                  <div className="border-b border-dashed border-slate-800 pb-2">
                    <span className="text-[7.5px] text-slate-500 uppercase font-black block leading-none mb-1">Receipt Number:</span>
                    <span className="font-bold text-white text-[9.5px] leading-none block">{receiptNo}</span>
                  </div>

                  <div className="space-y-1 text-[9px] text-slate-350">
                    <div>
                      <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none mb-0.5">Player:</span>
                      <span className="font-extrabold uppercase text-white">{sol.name}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none mb-0.5">Franchise:</span>
                      <span className="font-extrabold uppercase text-[#f59e0b]">{buyTeam?.name || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none mb-0.5">Table Coordinate:</span>
                      <span className="font-bold uppercase text-slate-400">{buyTeam?.tableNo || 'Table #1'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-slate-850 text-right">
                    <span className="text-[7px] text-slate-500 uppercase block font-bold leading-none mb-0.5">Final contract Value:</span>
                    <span className="font-black text-emerald-400 text-xs font-mono">{formatPrice(sol.soldPrice || 0)} Cr</span>
                  </div>
                </div>
              );
            })}

            {soldPlayers.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 text-[9.5px] uppercase font-bold text-mono">
                No draft receipts settled. Finalize player purchases to compile statements.
              </div>
            )}
          </div>
        </div>
      )}

      {/* BEAUTIFUL MODAL POPUP FOR SIMULATING TRANSMISSION RECORD EMAILED */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 text-xs font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5 font-mono">
                <Mail size={14} className="text-indigo-400" /> Dispatch Completed Squad Sheets
              </span>
              <button 
                onClick={() => setShowEmailModal(false)}
                className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              <p className="text-[9.5px] leading-relaxed text-slate-400 uppercase font-black tracking-wide">
                Deploy instant contract rosters and complete player draft pricing lists to official team owners and tournament adjudicators.
              </p>

              <div className="space-y-1.5">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Recipient Adjudication Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="Enter email address..." 
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 outline-none focus:border-indigo-505"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">Verification Details</label>
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-2 text-[8px] font-bold text-slate-450 uppercase font-mono">
                  <div className="flex justify-between">
                    <span>Drafted Squads:</span>
                    <span className="text-white font-black">{teams.length} Franchises</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acquisitions Count:</span>
                    <span className="text-[#f59e0b] font-black">{soldPlayers.length} Drafted</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Verification Payload:</span>
                    <span className="text-emerald-400 font-black">PDF Contract Annexure Included</span>
                  </div>
                </div>
              </div>

              {emailSuccess ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center font-black uppercase text-[9px] tracking-wider animate-pulse flex items-center justify-center gap-2">
                  <Check size={14} /> Dispatched Successfully!
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={emailSending}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-2 shadow shadow-indigo-600/10"
                >
                  {emailSending ? (
                    <>
                      <div className="w-3 animate-spin h-3 border-2 border-indigo-200 border-t-transparent rounded-full" />
                      <span>Sending Secure Feed...</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Dispatch Official Report Feed</span>
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
