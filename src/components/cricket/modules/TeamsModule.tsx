import React, { useState } from 'react';
import { Users, Landmark, UserCheck, Smartphone, Settings, BarChart3, ShieldAlert, Trash2, ChevronDown, ChevronUp, Globe, Coins, FileDown } from 'lucide-react';
import { Player, Team } from '../CricketAuction';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TeamsModuleProps {
  teams: Team[];
  setTeams: (val: Team[]) => void;
  players: Player[];
  formatPrice: (val: number) => string;
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  maxOverseasPlayers?: number;
  onDeleteTeam?: (tId: string) => void;
}

export const TeamsModule: React.FC<TeamsModuleProps> = ({
  teams, setTeams,
  players,
  formatPrice,
  showNotification,
  minPlayersPerTeam,
  maxPlayersPerTeam,
  maxOverseasPlayers = 4,
  onDeleteTeam
}) => {
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editManager, setEditManager] = useState<string>('');
  const [editTable, setEditTable] = useState<string>('');
  const [editEmoji, setEditEmoji] = useState<string>('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  const handleDownloadTeamRosterPDF = (t: Team, teamBuys: Player[]) => {
    try {
      const doc = new jsPDF() as any;
      const tName = t.name.toUpperCase();
      const managerName = (t.manager || 'Unassigned').toUpperCase();
      const tableNoStr = (t.tableNo || 'N/A').toUpperCase();
      const spend = t.initialPurse - t.purse;

      // Header Banner
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 42, 'F');
      
      // Emblem logo
      doc.setFontSize(22);
      doc.text(t.logoEmoji || '🏏', 14, 18);
      
      doc.setTextColor(245, 158, 11); 
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(16);
      doc.text(tName, 26, 17);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.text("OFFICIAL LEAGUE SQUAD ROSTER & FINANCIAL RECEIPT", 26, 23);
      
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(7.5);
      doc.text(`FRANCHISE COMPLIANCE CODE: ${t.id.toUpperCase()}  •  ASSIGNED COORDINATE: ${tableNoStr}`, 26, 29);
      doc.text(`ISSUED: ${new Date().toLocaleString()}`, 26, 34);

      // Section label & Metadata Grid
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.text("FRANCHISE BALANCE SHEET SUMMARY", 14, 52);

      // Simple grid metadata under the header
      const summaryData = [
        ["Franchise Title", t.name],
        ["Chief Representative", t.manager || 'Unassigned'],
        ["Allocated Table Coordinate", t.tableNo || 'N/A'],
        ["Squad Members Drafted", `${teamBuys.length} Players`],
        ["Initial Purse Allotment", `INR ${t.initialPurse.toFixed(2)} Cr`],
        ["Total Budget Invested / Spent", `INR ${spend.toFixed(2)} Cr`],
        ["Remaining Net Balance Purse", `INR ${t.purse.toFixed(2)} Cr`]
      ];

      autoTable(doc, {
        startY: 56,
        body: summaryData,
        theme: 'striped',
        styles: { fontSize: 8.5, fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 50, textColor: [100, 116, 139] },
          1: { cellWidth: 100, textColor: [15, 23, 41] }
        }
      });

      const nextY = (doc as any).lastAutoTable.finalY + 10;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.text("ACQUIRED SQUAD PLAYERS & SIGNED COVENANTS", 14, nextY);

      const playerRows = teamBuys.map((p, idx) => {
        return [
          idx + 1,
          p.name.toUpperCase(),
          p.role.toUpperCase(),
          p.country.toUpperCase(),
          `INR ${formatPrice(p.soldPrice || p.basePrice)} Crores`
        ];
      });

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Seq #', 'Player Candidate Name', 'Primary Playing Style', 'Nationality Group', 'Official Sold Prize']],
        body: playerRows.length > 0 ? playerRows : [['-', 'No players drafted under this roster', '-', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 41], textColor: [245, 158, 11], fontStyle: 'bold', fontSize: 9 },
        styles: { fontSize: 8.5 },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 55, fontStyle: 'bold' },
          2: { cellWidth: 35 },
          3: { cellWidth: 35 },
          4: { cellWidth: 40, fontStyle: 'bold', textColor: [194, 120, 3] }
        }
      });

      // Signature block at bottom
      const finalY = (doc as any).lastAutoTable.finalY + 18;
      
      // Draw a dotted line
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([2, 2], 0);
      doc.line(14, finalY, 196, finalY);
      doc.setLineDashPattern([], 0);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.text("Authorized League Adjudicator", 14, finalY + 12);
      doc.text("___________", 14, finalY + 10);

      doc.text("Franchise Representative Signature", 130, finalY + 12);
      doc.text("___________", 130, finalY + 10);

      doc.setFontSize(7);
      doc.text("This document constitutes a binding digital contract registry and legal receipt verifying the draft contracts specified.", 14, finalY + 22);

      doc.save(`${t.name.replace(/\s+/g, '_')}_Official_SquadRoster.pdf`);
      showNotification(`Squad Roster PDF for ${t.name} exported successfully!`, 'success');
    } catch (err) {
      console.error(err);
      showNotification('Error generating squad roster PDF', 'alert');
    }
  };

  const triggerTeamUpdate = (tId: string) => {
    if (!editName.trim()) {
      showNotification('Team name is required!', 'alert');
      return;
    }

    const updated = teams.map((t) => {
      if (t.id === tId) {
        return {
          ...t,
          name: editName.trim(),
          manager: editManager.trim() || 'Unassigned Manager',
          tableNo: editTable.trim() || 'Table #-',
          logoEmoji: editEmoji || '🏏'
        };
      }
      return t;
    });

    setTeams(updated);
    setEditingTeamId(null);
    showNotification(`Franchise profile updated!`, 'success');
  };

  const startEdit = (t: Team) => {
    setEditingTeamId(t.id);
    setEditName(t.name);
    setEditManager(t.manager || '');
    setEditTable(t.tableNo || '');
    setEditEmoji(t.logoEmoji || '🏏');
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6">
      
      <div className="pb-2 border-b border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b]">Franchise Squad Profiles & Table Assignments</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((t) => {
          const buys = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
          const overseasBuys = buys.filter(p => p.country === 'Overseas');
          const spend = t.initialPurse - t.purse;
          const isOverBudget = t.purse < 0.05; // Less than 5 Lakhs left
          const meetsMandatoryCount = buys.length >= minPlayersPerTeam;
          const isAtMaxCap = buys.length >= maxPlayersPerTeam;
          
          const remainingSlots = Math.max(0, maxPlayersPerTeam - buys.length);
          const foreignSlotsLeft = Math.max(0, maxOverseasPlayers - overseasBuys.length);
          const isExpanded = expandedTeamId === t.id;

          const wkWins = buys.filter(p => p.role === 'Wicket-Keeper').length;
          const batWins = buys.filter(p => p.role === 'Batsman').length;
          const bowlWins = buys.filter(p => p.role === 'Bowler').length;
          const arWins = buys.filter(p => p.role === 'All-Rounder').length;

          return (
            <div 
              key={t.id} 
              className={`p-4 bg-slate-900/60 border rounded-2xl transition-all relative flex flex-col justify-between ${
                editingTeamId === t.id 
                  ? 'border-amber-400 bg-slate-950 shadow-md' 
                  : 'border-slate-850 hover:border-slate-850'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-800/80 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg bg-slate-950/60 px-1.5 py-1 rounded-lg block">{t.logoEmoji || '🦁'}</span>
                    <div>
                      <span className="text-xs font-black uppercase text-white block leading-none">{t.name}</span>
                      <span className="text-[8.5px] font-black uppercase text-[#10b981] mt-1 inline-block bg-[#10b981]/15 px-1.5 py-0.5 rounded leading-none">
                        {t.tableNo || 'Table #1'}
                      </span>
                    </div>
                  </div>

                  {editingTeamId !== t.id && (
                    <div className="flex items-center gap-1.5 font-sans">
                      <button
                        onClick={() => startEdit(t)}
                        className="px-2.5 py-1 bg-slate-850 text-slate-350 hover:text-white border-none rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteTeam?.(t.id)}
                        className="p-1 px-1.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 hover:text-rose-350 border border-rose-500/15 rounded-lg cursor-pointer transition-all flex items-center justify-center"
                        title="Delete Franchise"
                      >
                        <Trash2 size={11} className="stroke-[2.5px]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* EDIT MODE FORM */}
                {editingTeamId === t.id ? (
                  <div className="space-y-3.5 text-xs pb-4">
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Franchise Title</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-bold text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Chief Manager / Representative</label>
                      <input 
                        type="text" 
                        value={editManager}
                        onChange={(e) => setEditManager(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-bold text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Assigned Table Coordinate</label>
                      <input 
                        type="text" 
                        value={editTable}
                        onChange={(e) => setEditTable(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-bold text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[8px] font-black uppercase text-slate-500 block mb-1">Brand Emblem Emoji</label>
                      <input 
                        type="text" 
                        placeholder="👑"
                        value={editEmoji}
                        onChange={(e) => setEditEmoji(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 font-bold text-white outline-none"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingTeamId(null)}
                        className="px-2.5 py-1 bg-slate-900 text-slate-400 border-none rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => triggerTeamUpdate(t.id)}
                        className="px-3 py-1 bg-amber-500 text-slate-950 border-none rounded-lg text-[8px] font-black uppercase tracking-wider cursor-pointer font-sans"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* DISPLAY DETAILS */
                  <div className="space-y-2.5 text-[10px] pb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500 uppercase font-black text-[8px]">Table Manager:</span>
                      <span className="text-slate-350 font-bold uppercase">{t.manager || 'N/A'}</span>
                    </div>

                    {/* Money balance summary */}
                    <div className="grid grid-cols-2 gap-2 text-center py-2 bg-slate-950 rounded-xl border border-slate-900">
                      <div>
                        <span className="text-[7.5px] text-slate-500 uppercase block font-bold">Spent Budget</span>
                        <span className="font-mono text-[10.5px] font-black text-rose-400">{spend.toFixed(2)} Cr</span>
                      </div>
                      <div>
                        <span className="text-[7.5px] text-slate-500 uppercase block font-bold">Remaining Purse</span>
                        <span className="font-mono text-[10.5px] font-black text-emerald-400">{t.purse.toFixed(2)} Cr</span>
                      </div>
                    </div>

                    {/* Slots Counters */}
                    <div className="grid grid-cols-2 gap-2 py-1.5 px-2.5 bg-slate-905 rounded-xl border border-slate-850">
                      <div className="text-left">
                        <span className="text-[7px] text-slate-500 font-extrabold uppercase block leading-none">Remaining Slots</span>
                        <span className="text-xs font-black text-slate-200 block mt-1">{remainingSlots} left</span>
                      </div>
                      <div className="text-left border-l border-slate-850 pl-2.5">
                        <span className="text-[7px] text-slate-500 font-extrabold uppercase block leading-none">Foreign Slots Left</span>
                        <span className="text-xs font-black text-[#818cf8] block mt-1">{foreignSlotsLeft} left</span>
                      </div>
                    </div>

                    {/* Role compliance breakdown */}
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-850/50 space-y-2">
                      <div className="flex justify-between items-center text-[7.5px] font-black uppercase text-slate-455 tracking-wider">
                        <span>Role balance check</span>
                        <span className="text-[#f59e0b]">Min 1 Wicket-keeper</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-[8.5px] font-mono font-black text-center">
                        <div className={`py-1 rounded border ${wkWins > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400 animate-pulse'}`} title="Wicket Keeper">
                          <span className="block text-[6.5px] text-slate-500 font-sans uppercase">WK</span>
                          <span>{wkWins}</span>
                        </div>
                        <div className="py-1 rounded border bg-slate-900 border-slate-850 text-slate-200" title="Batsman">
                          <span className="block text-[6.5px] text-slate-500 font-sans uppercase">BAT</span>
                          <span>{batWins}</span>
                        </div>
                        <div className="py-1 rounded border bg-slate-900 border-slate-850 text-slate-200" title="Bowler">
                          <span className="block text-[6.5px] text-slate-500 font-sans uppercase">BOWL</span>
                          <span>{bowlWins}</span>
                        </div>
                        <div className="py-1 rounded border bg-slate-900 border-slate-850 text-slate-200" title="All Rounder">
                          <span className="block text-[6.5px] text-slate-500 font-sans uppercase">AR</span>
                          <span>{arWins}</span>
                        </div>
                      </div>
                    </div>

                    {/* Roster compliance gauges */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black uppercase text-slate-455">
                        <span>Squad Compliance</span>
                        <span>{buys.length} of {maxPlayersPerTeam} Capacity</span>
                      </div>
                      <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isAtMaxCap 
                              ? 'bg-rose-500' 
                              : meetsMandatoryCount 
                              ? 'bg-emerald-400' 
                              : 'bg-indigo-400'
                          }`}
                          style={{ width: `${Math.min(100, (buys.length / maxPlayersPerTeam) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* SQUAD EXPANSION AREA */}
                    <div className="pt-1.5 space-y-1.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setExpandedTeamId(isExpanded ? null : t.id)}
                          className="flex-1 py-1.5 px-2.5 bg-slate-950 hover:bg-slate-900 rounded-lg border border-slate-850 text-slate-400 hover:text-white transition-all text-[8px] font-black uppercase tracking-wider flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-1">
                            <Users size={10} className="text-[#f59e0b]" /> 
                            Squad ({buys.length})
                          </span>
                          {isExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                        </button>

                        <button
                          onClick={() => handleDownloadTeamRosterPDF(t, buys)}
                          className="py-1.5 px-2.5 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 border border-[#f59e0b]/25 rounded-lg text-[#f59e0b] text-[8px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1 transition-all"
                          title="Download separately structured team roster PDF"
                        >
                          <FileDown size={10} className="text-[#f59e0b]" />
                          <span>PDF</span>
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 p-2 bg-slate-950 rounded-xl border border-slate-850 space-y-1.5 max-h-40 overflow-y-auto">
                          {buys.map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between text-[9px] border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-bold font-mono">{idx + 1}.</span>
                                <div>
                                  <span className="font-extrabold text-slate-200 uppercase block">{p.name}</span>
                                  <div className="flex items-center gap-1 text-[7px] text-slate-500 font-semibold uppercase mt-0.5">
                                    <span>{p.role}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5">
                                      {p.country === 'Overseas' && <Globe size={7} className="text-indigo-400" />} {p.country}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="font-mono font-black text-[#f59e0b] bg-[#f59e0b]/5 px-1.5 py-0.5 rounded border border-[#f59e0b]/10">
                                {formatPrice(p.soldPrice || p.basePrice)} Cr
                              </span>
                            </div>
                          ))}
                          {buys.length === 0 && (
                            <div className="py-2.5 text-center text-slate-600 uppercase text-[7.5px] font-black">
                              No players bought yet. Raise paddle in the Arena!
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AUTOMATED PURSE LOCKOUT GUARDRAIL OVERLAY PANEL */}
              <div className="pt-2 border-t border-dashed border-slate-800 flex items-center justify-between mt-auto">
                <span className="text-[8px] font-black uppercase text-slate-500">Purse Safeguard:</span>
                {isOverBudget ? (
                  <span className="text-[8.5px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 leading-none">
                    <ShieldAlert size={10} /> LOCKOUT ACTIVE
                  </span>
                ) : (
                  <span className="text-[8.5px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded leading-none">
                    Verified Compliant
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
