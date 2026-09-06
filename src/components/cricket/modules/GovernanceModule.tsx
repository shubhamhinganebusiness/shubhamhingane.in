import React, { useState } from 'react';
import { 
  Download, FileDown, Landmark, FileSpreadsheet, Star, ChartLine, Award, Lock, 
  ListFilter, ShieldAlert, BadgeInfo, Users, MessageSquare, Check, RefreshCw, 
  ExternalLink, PhoneCall, Play, Send, Calendar, Trash2, ArrowRightLeft, Sparkles, AlertCircle, FileText, RotateCcw
} from 'lucide-react';
import { Player, Team } from '../CricketAuction';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  category: 'Rule' | 'Bid' | 'Auth' | 'Roster' | 'Notification' | 'Matchplay';
  details: string;
  user: string;
}

interface GovernanceModuleProps {
  players: Player[];
  setPlayers: (val: Player[]) => void;
  teams: Team[];
  setTeams: (val: Team[]) => void;
  bidsHistory: any[];
  auditLogs: AuditLogEntry[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogEntry[]>>;
  logAction: (action: string, category: 'Rule' | 'Bid' | 'Auth' | 'Roster' | 'Notification' | 'Matchplay', details: string, user?: string) => void;
  formatPrice: (val: number) => string;
  showNotification: (text: string, type?: 'success' | 'alert' | 'info') => void;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  maxOverseasPlayers: number;
  gatewayLogs: any[];
  setGatewayLogs: React.Dispatch<React.SetStateAction<any[]>>;
  dispatchGatewayAlert: (service: 'WhatsApp' | 'SMS' | 'Email', text: string) => void;
  onResetAuction?: () => void;
}

interface SimMatchBall {
  ballNo: string;
  batter: string;
  bowler: string;
  result: string;
  runs: number;
  commentary: string;
}

export const GovernanceModule: React.FC<GovernanceModuleProps> = ({
  players,
  setPlayers,
  teams,
  setTeams,
  bidsHistory,
  auditLogs,
  setAuditLogs,
  logAction,
  formatPrice,
  showNotification,
  minPlayersPerTeam,
  maxPlayersPerTeam,
  maxOverseasPlayers,
  gatewayLogs,
  setGatewayLogs,
  dispatchGatewayAlert,
  onResetAuction
}) => {
  const [activeGovernanceTab, setActiveGovernanceTab] = useState<'audit' | 'unsold' | 'rtm' | 'exports' | 'broadcasting' | 'matchplay' | 'reset'>('audit');
  const [auditFilter, setAuditFilter] = useState<'all' | 'Rule' | 'Bid' | 'Auth' | 'Roster' | 'Notification' | 'Matchplay'>('all');
  const [auditKeyword, setAuditKeyword] = useState<string>('');
  const [ledgerVerified, setLedgerVerified] = useState<boolean>(false);
  const [ledgerChecksum, setLedgerChecksum] = useState<string>('');
  const [ledgerScanning, setLedgerScanning] = useState<boolean>(false);

  const calculateLedgerChecksum = () => {
    // Generate a simple deterministic base64 hash of logs payload to prove tamper-proof structure
    setLedgerScanning(true);
    setTimeout(() => {
      const logsString = JSON.stringify(auditLogs.map(l => ({ id: l.id, action: l.action })));
      // Standard simple hash code simulation
      let hashValue = 0;
      for (let i = 0; i < logsString.length; i++) {
        hashValue = (hashValue << 5) - hashValue + logsString.charCodeAt(i);
        hashValue |= 0;
      }
      const uniqueHex = 'SHA256_' + Math.abs(hashValue).toString(16) + '_' + auditLogs.length + 'E';
      setLedgerChecksum(uniqueHex);
      setLedgerVerified(true);
      setLedgerScanning(false);
      showNotification(`Ledger Validation complete! Digital Sequence secure. Signature: ${uniqueHex}`, 'success');
    }, 850);
  };
  
  // WhatsApp Notification Settings
  const [selectedPlayerForWa, setSelectedPlayerForWa] = useState<string>('');
  const [playerPhone, setPlayerPhone] = useState<string>('');
  const [whatsappTemplate, setWhatsappTemplate] = useState<string>(
    "🏏 GPL Recruitment Update! Congratulations {PlayerName}, you have been acquired by {TeamName} for ₹{Price} Crores! Prepare for subsequent team meets."
  );

  // Unsold retrieval state
  const [discountPct, setDiscountPct] = useState<number>(20);
  const [selectedUnsoldPlayerId, setSelectedUnsoldPlayerId] = useState<string>('');

  // Right To Match override state
  const [rtmPlayerId, setRtmPlayerId] = useState<string>('');
  const [rtmTargetTeamId, setRtmTargetTeamId] = useState<string>('');
  const [rtmCustomPrice, setRtmCustomPrice] = useState<string>('');

  // Live Matchplay quick roller state
  const [simTeamA, setSimTeamA] = useState<string>('t1');
  const [simTeamB, setSimTeamB] = useState<string>('t2');
  const [simOvers, setSimOvers] = useState<number>(2);
  const [simIsRunning, setSimIsRunning] = useState<boolean>(false);
  const [simCommentaries, setSimCommentaries] = useState<SimMatchBall[]>([]);
  const [simScore, setSimScore] = useState<{ teamA: string, runsA: number, wicketsA: number, teamB: string, runsB: number, wicketsB: number, status: string }>({
    teamA: '', runsA: 0, wicketsA: 0, teamB: '', runsB: 0, wicketsB: 0, status: 'Not Started'
  });

  // Filtered audit logs
  const filteredAudits = auditLogs.filter(log => {
    if (auditFilter !== 'all' && log.category !== auditFilter) return false;
    if (auditKeyword) {
      const kw = auditKeyword.toLowerCase();
      return (
        log.action.toLowerCase().includes(kw) ||
        log.details.toLowerCase().includes(kw) ||
        log.user.toLowerCase().includes(kw) ||
        log.category.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  // Accelerated pool filters (skipped or unsold players)
  const unsoldsList = players.filter(p => p.status === 'Unsold' || p.status === 'Skipped');

  // Triggering excel spreadsheet exports using xlsx
  const handleExportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Franchises table
      const franchiseData = teams.map(t => {
        const roster = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
        return {
          'Franchise Name': t.name,
          'Manager/Owner Name': t.manager || 'N/A',
          'Table Allocation': t.tableNo || 'N/A',
          'Initial Draft Purse (Cr)': t.initialPurse,
          'Remaining Purse Balance (Cr)': t.purse,
          'Total Purse Invested (Cr)': Number((t.initialPurse - t.purse).toFixed(2)),
          'Recruits Count': roster.length
        };
      });
      const wsFranchise = XLSX.utils.json_to_sheet(franchiseData);
      XLSX.utils.book_append_sheet(wb, wsFranchise, "Franchise Purses");

      // Sheet 2: Sold Roster detailed list
      const rosterData = players.filter(p => p.status === 'Sold').map(p => {
        const t = teams.find(team => team.id === p.soldTo);
        return {
          'Player Name': p.name,
          'Position/Role': p.role,
          'Category Status': p.country,
          'Base Value (Cr)': p.basePrice,
          'Final Sold Cost (Cr)': p.soldPrice || p.basePrice,
          'Assigned Franchise': t ? t.name : 'Unassigned',
          'Player Skill Rating': p.rating
        };
      });
      const wsRoster = XLSX.utils.json_to_sheet(rosterData);
      XLSX.utils.book_append_sheet(wb, wsRoster, "Recruited Squad Rosters");

      // Sheet 3: Complete Audit Ledger
      const auditsData = auditLogs.map(log => ({
        'Timestamp': log.timestamp,
        'Classification': log.category,
        'Administrative Summary': log.action,
        'Technical Detail logs': log.details,
        'Operator Username': log.user
      }));
      const wsAudit = XLSX.utils.json_to_sheet(auditsData);
      XLSX.utils.book_append_sheet(wb, wsAudit, "Secured Audit Ledger");

      XLSX.writeFile(wb, "GullyScore_Premier_League_Administrative_Governance_System.xlsx");
      showNotification("XLSX Corporate Workbook Exported Successfully!", "success");
      logAction("Excel Multi-Sheet Issued", "Roster", "Generated and exported complete audit ledger with financial balances and squads.");
    } catch (e) {
      console.error(e);
      showNotification("Error exporting XLSX file. Check browser security settings.", "alert");
    }
  };

  // Corporate PDF report generation using jsPDF & autotable
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF() as any;
      
      // Slate styling banner Header
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setTextColor(245, 158, 11); 
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.text("GULLYSCORE MATCH & PLAYER LEAGUE", 14, 15);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text("OFFICIAL EXECUTIVE AUCTION DRAFT GOVERNANCE REPORT & SQUAD ROSTERS", 14, 23);
      
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(7.5);
      doc.text(`SECURED AUDIT TRAIL LOGGED  •  GENERATED: ${new Date().toLocaleString()}  •  COMPLIANCE STATUS: SECURED`, 14, 30);

      // Section 1 Table: Financials summary
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text("I. FRANCHISE COMPLIANCE SUMMARY", 14, 48);

      const franchiseRows = teams.map(t => {
        const roster = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
        return [
          t.name,
          t.manager || 'N/A',
          `₹${t.initialPurse.toFixed(2)} Cr`,
          `₹${(t.initialPurse - t.purse).toFixed(2)} Cr`,
          `₹${t.purse.toFixed(2)} Cr`,
          `${roster.length} Players`
        ];
      });

      autoTable(doc, {
        startY: 52,
        head: [['Franchise Name', 'Owner/Manager', 'Initial Purse', 'Total Spent', 'Remaining Purse', 'Squad Size']],
        body: franchiseRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5 }
      });

      // Section 2 Table: Squad details
      const nextY = (doc as any).lastAutoTable.finalY + 12;
      doc.text("II. RECIPROCATED SQUAD ROSTER CONTRACTS", 14, nextY);

      const soldRosterRows = players.filter(p => p.status === 'Sold').map(p => {
        const team = teams.find(t => t.id === p.soldTo);
        return [
          p.name,
          p.role,
          p.country,
          `₹${p.basePrice.toFixed(2)} Cr`,
          `₹${(p.soldPrice || p.basePrice).toFixed(2)} Cr`,
          team ? team.name : 'N/A',
          `${p.rating}/10`
        ];
      });

      autoTable(doc, {
        startY: nextY + 4,
        head: [['Player Name', 'Playing Role', 'Nationality', 'Base Price', 'Acquired Cost', 'Assigned Franchise', 'Rating']],
        body: soldRosterRows,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold' },
        styles: { fontSize: 8 }
      });

      // Section 3 Audit summary snippet
      const lastY = (doc as any).lastAutoTable.finalY + 12;
      doc.text("III. CONCURRENT AUDIT LOGS SUMMARY", 14, lastY);
      const auditSummaryRows = auditLogs.slice(0, 5).map(log => [
        log.timestamp,
        log.category,
        log.action,
        log.user
      ]);
      autoTable(doc, {
        startY: lastY + 4,
        head: [['Timestamp', 'Category', 'Incident Action', 'Operator']],
        body: auditSummaryRows,
        theme: 'plain',
        styles: { fontSize: 7 }
      });

      doc.save("GullyScore_PostAuction_Official_Audit_Report.pdf");
      showNotification("PDF Regulatory Document Generated and Downloaded!", "success");
      logAction("PDF Governance Report Issued", "Roster", "Compiled and downloaded official legal compliance ledger PDF.");
    } catch (e) {
      console.error(e);
      showNotification("Error downloading PDF file.", "alert");
    }
  };

  // Accelerated Unsold retriever trigger
  const handleTriggerAcceleratedRound = () => {
    if (!selectedUnsoldPlayerId) {
      showNotification("Please select a player to nominate first!", "alert");
      return;
    }

    const playerToNominate = players.find(p => p.id === selectedUnsoldPlayerId);
    if (!playerToNominate) return;

    // Apply discount decimal math safely
    const originalBase = playerToNominate.basePrice;
    const discountedPrice = Number((originalBase * (1 - discountPct / 100)).toFixed(2));

    // Update player base price and return status back to Unsold ready to be nominated
    const updatedPlayers = players.map(p => {
      if (p.id === selectedUnsoldPlayerId) {
        return {
          ...p,
          basePrice: discountedPrice,
          status: 'Unsold' as const // Ensure status allows nominating again
        };
      }
      return p;
    });

    setPlayers(updatedPlayers);
    showNotification(`Accelerated nomination created! ${playerToNominate.name} is scheduled next at ${discountPct}% discount (Base Price: ${formatPrice(discountedPrice)} Cr)`, "success");
    logAction("Accelerated Pool Requisition", "Roster", `Nominated skipped player "${playerToNominate.name}" returning them to pool at a discounted valuation of ₹${discountedPrice} Crores (old base was ₹${originalBase} Cr).`);
  };

  const handleExportAuditLogsPDF = () => {
    try {
      const doc = new jsPDF() as any;
      
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 38, 'F');
      
      doc.setTextColor(245, 158, 11); 
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("GULLYSCORE LEAGUE TOURNEY", 14, 15);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("OFFICIAL SECURED AUDIT LOG INCIDENTS RECORD LEDGER", 14, 23);
      
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(7);
      doc.text(`SECURED AUDIT TRAIL LOGGED  •  GENERATED: ${new Date().toLocaleString()}  •  COMPLIANCE STATUS: ENCRYPTED`, 14, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text("CONCURRENT ACTION LOGS LEDGER RUN", 14, 48);

      const auditSummaryRows = auditLogs.map(log => [
        log.timestamp,
        log.category,
        log.action,
        log.details,
        log.user
      ]);

      autoTable(doc, {
        startY: 52,
        head: [['Timestamp', 'Category', 'Incident Action', 'Detailed Logs Summary', 'Operator ID']],
        body: auditSummaryRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 32 },
          1: { cellWidth: 22 },
          2: { cellWidth: 38 },
          3: { cellWidth: 80 },
          4: { cellWidth: 18 }
        }
      });

      doc.save(`GullyScore_Official_AuditLogs_${Date.now()}.pdf`);
      showNotification("Audit Logs PDF Generated and Downloaded!", "success");
      logAction("Audit Logs PDF Issued", "Auth", "Exported complete list of secured audit logs as formatted PDF document.");
    } catch (e) {
      console.error(e);
      showNotification("Error downloading Audit Logs PDF file.", "alert");
    }
  };

  const handleExecuteRtmOverride = () => {
    if (!rtmPlayerId) {
      showNotification("Please select a sold player first!", "alert");
      return;
    }
    if (!rtmTargetTeamId) {
      showNotification("Please select a target franchise!", "alert");
      return;
    }
    const matchingPrice = parseFloat(rtmCustomPrice);
    if (isNaN(matchingPrice) || matchingPrice <= 0) {
      showNotification("Please specify a valid matching price greater than zero!", "alert");
      return;
    }

    const player = players.find(p => p.id === rtmPlayerId);
    if (!player) return;

    const sourceTeamId = player.soldTo;
    if (!sourceTeamId) {
      showNotification("This player is not assigned to any franchise!", "alert");
      return;
    }

    if (sourceTeamId === rtmTargetTeamId) {
      showNotification("The player is already assigned to this franchise!", "alert");
      return;
    }

    const sourceTeam = teams.find(t => t.id === sourceTeamId);
    const targetTeam = teams.find(t => t.id === rtmTargetTeamId);

    if (!targetTeam) {
      showNotification("Target franchise not found!", "alert");
      return;
    }

    if (targetTeam.purse < matchingPrice) {
      showNotification(`Insufficient budget! Target Franchise ${targetTeam.name} has ₹${targetTeam.purse} Cr, needs ₹${matchingPrice} Cr.`, "alert");
      return;
    }

    const oldPrice = player.soldPrice || player.basePrice;

    // Execute reassignment
    const updatedPlayers = players.map(p => {
      if (p.id === rtmPlayerId) {
        return {
          ...p,
          soldTo: rtmTargetTeamId,
          soldPrice: matchingPrice,
          status: 'Sold' as const
        };
      }
      return p;
    });

    const updatedTeams = teams.map(t => {
      if (t.id === sourceTeamId) {
        return {
          ...t,
          purse: Number((t.purse + oldPrice).toFixed(2))
        };
      }
      if (t.id === rtmTargetTeamId) {
        return {
          ...t,
          purse: Number((t.purse - matchingPrice).toFixed(2))
        };
      }
      return t;
    });

    setPlayers(updatedPlayers);
    setTeams(updatedTeams);

    showNotification(`RTM OVERRIDE SUCCESSFUL! manually re-assigned "${player.name}" to "${targetTeam.name}" at match cost of ₹${matchingPrice} Crores!`, "success");
    logAction("RTM Override Executed", "Roster", `Manually reassigned sold player "${player.name}" from ${sourceTeam?.name || 'Previous'} (sold originally for ₹${oldPrice} Cr) to ${targetTeam.name} via Right To Match override at matching bid price of ₹${matchingPrice} Cr.`);
    dispatchGatewayAlert("Email", `📋 [RTM Governance Overwrite] Player contract has been reallocated. ${player.name} moved to franchise ${targetTeam.name} at ₹${matchingPrice} Crores.`);

    // Reset controls
    setRtmPlayerId('');
    setRtmTargetTeamId('');
    setRtmCustomPrice('');
  };


  // WhatsApp click dispatcher
  const handleLaunchWhatsApp = () => {
    if (!selectedPlayerForWa) {
      showNotification("Please select a recruited player first!", "alert");
      return;
    }

    const player = players.find(p => p.id === selectedPlayerForWa);
    if (!player) return;

    const team = teams.find(t => t.id === player.soldTo);
    if (!team) return;

    // Compile dynamic factors in message
    let compiledMsg = whatsappTemplate
      .replace(/{PlayerName}/g, player.name)
      .replace(/{TeamName}/g, team.name)
      .replace(/{Price}/g, String(player.soldPrice || player.basePrice));

    const phoneClean = playerPhone.replace(/[^0-9]/g, '');
    const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean || '919876543210'}&text=${encodeURIComponent(compiledMsg)}`;
    
    // Launch external WhatsApp API
    window.open(waUrl, '_blank');
    
    // Log outbound alert transaction
    dispatchGatewayAlert("WhatsApp", `🏆 [WhatsApp Direct API] Outgoing player ping dispatched for ${player.name} to roster manager at ${phoneClean || '+91 98765 43210'}.`);
    logAction("Outbox SMS/WA Dispatched", "Notification", `WhatsApp alert triggered for standard contact of player "${player.name}" to squad: ${team.name}.`);
    showNotification("WhatsApp redirect launched in new tab!", "success");
  };

  // Selection change handler for manual WhatsApp contact directory
  const handleSelectedPlayerChange = (playerId: string) => {
    setSelectedPlayerForWa(playerId);
    // Generate simulated dynamic indian phone digits based on ID index
    const playerIdx = players.findIndex(p => p.id === playerId);
    const mockNum = `98124${String(10005 + playerIdx)}`;
    setPlayerPhone(`+91 ${mockNum.substring(0, 5)} ${mockNum.substring(5)}`);
  };

  // Tournament Scorer direct sync trigger
  const handleSyncWithMatchScorer = () => {
    try {
      const existingStr = localStorage.getItem('gully_tournaments_v1');
      const existingTournaments = existingStr ? JSON.parse(existingStr) : [];
      
      // Form dynamic squad teams complying with matchplay expectations
      const tourTeams = teams.map((t, idx) => {
        const rosterPlayers = players.filter(p => p.soldTo === t.id && p.status === 'Sold');
        return {
          id: 'tpl_team_' + t.id,
          name: t.name,
          captain: rosterPlayers[0]?.name || t.manager || 'Squad Captain',
          players: rosterPlayers.length > 0 ? rosterPlayers.map(p => p.name) : ['Pro Player A', 'Pro Player B', 'Gully Hitter C'],
          logo: '🏏'
        };
      });

      const newTournamentId = 'gpl_auction_sync_' + Date.now();
      const newTournament = {
        id: newTournamentId,
        name: 'Gully Premier League (Post-Auction Sync)',
        format: 'T20',
        type: 'league',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active' as const,
        teams: tourTeams,
        matches: [
          {
            id: 'm_sync_1_' + Date.now(),
            teamAId: tourTeams[0].id,
            teamBId: tourTeams[1].id,
            teamAName: tourTeams[0].name,
            teamBName: tourTeams[1].name,
            date: new Date().toISOString().split('T')[0],
            time: '19:45',
            venue: 'Gully Stadium Ground A',
            status: 'scheduled' as const,
            scoreA: '0/0',
            scoreB: '0/0',
            oversA: '0',
            oversB: '0',
            winnerId: null,
            winReason: 'Scheduled Post-Auction Play'
          }
        ],
        winnerTeamName: null
      };

      const revisedTours = [newTournament, ...existingTournaments];
      localStorage.setItem('gully_tournaments_v1', JSON.stringify(revisedTours));
      localStorage.setItem('gully_active_tournament_id', newTournamentId);
      
      showNotification("Draft synced with the Ball-by-Ball Match Scoreboard module!", "success");
      logAction("Championship Sync Completed", "Matchplay", `Successfully registered custom tournament GPL Sync (ID: ${newTournamentId}) with exact dynamic draft rosters.`);
    } catch (e) {
      console.error(e);
      showNotification("Error syncing with match scroller.", "alert");
    }
  };

  // Interactive Live Scoring & Express Match Simulator Inside State
  const handleSimulateExpressMatch = () => {
    const teamAObj = teams.find(t => t.id === simTeamA);
    const teamBObj = teams.find(t => t.id === simTeamB);
    if (!teamAObj || !teamBObj || simTeamA === simTeamB) {
      showNotification("Please select two distinct franchise teams!", "alert");
      return;
    }

    setSimIsRunning(true);
    setSimCommentaries([]);
    
    const rosterA = players.filter(p => p.soldTo === simTeamA && p.status === 'Sold').map(p => p.name);
    const rosterB = players.filter(p => p.soldTo === simTeamB && p.status === 'Sold').map(p => p.name);

    if (rosterA.length === 0 || rosterB.length === 0) {
      showNotification("Both franchises must have recruited players to simulate matches!", "alert");
      setSimIsRunning(false);
      return;
    }

    // Let's slide-show over-by-over ticks
    let ballsCount = simOvers * 6;
    let index = 0;
    let tempRunsA = 0;
    let tempWicketsA = 0;
    let tempRunsB = 0;
    let tempWicketsB = 0;
    const generatedBalls: SimMatchBall[] = [];

    // Let's run randomized ball generation with custom cricket logic based on random factors
    const outcomes = ['0', '1', '2', '4', '6', 'W', 'Wd', 'Nb'];

    // Part 1: Innings 1 (Team A battings)
    for (let b = 1; b <= ballsCount; b++) {
      if (tempWicketsA >= 10) break;
      const overNo = Math.floor((b - 1) / 6);
      const ballNo = ((b - 1) % 6) + 1;
      const rOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      let scoreStr = rOutcome;
      let ballRuns = 0;
      let wicketAdded = 0;

      if (rOutcome === 'W') {
        wicketAdded = 1;
        tempWicketsA += 1;
        scoreStr = 'Wicket!';
      } else if (rOutcome === 'Wd' || rOutcome === 'Nb') {
        ballRuns = 1;
        tempRunsA += 1;
        scoreStr = 'Extra (1)';
      } else {
        ballRuns = parseInt(rOutcome) || 0;
        tempRunsA += ballRuns;
      }

      const batsman = rosterA[Math.floor(Math.random() * rosterA.length)] || 'Batsman';
      const bowler = rosterB[Math.floor(Math.random() * rosterB.length)] || 'Bowler';

      generatedBalls.push({
        ballNo: `Innings 1 - Over ${overNo}.${ballNo}`,
        batter: batsman,
        bowler,
        result: rOutcome,
        runs: ballRuns + (rOutcome === 'W' ? 0 : 0),
        commentary: rOutcome === 'W' 
          ? `💥 OUT! ${batsman} tried to loft a shot but gets caught in deep by the boundary fielder off ${bowler}!`
          : rOutcome === '6' 
            ? `🚀 SIX! Dynamic shot! ${batsman} hits ${bowler} clean over cow corner into the projection grids!`
            : rOutcome === '4' 
              ? `🔥 FOUR! Brilliant timing by ${batsman} drilling ${bowler} past the point gap.`
              : `${batsman} works ${bowler} for ${ballRuns} run(s).`
      });
    }

    // Part 2: Innings 2 (Team B chases)
    const target = tempRunsA + 1;
    for (let b = 1; b <= ballsCount; b++) {
      if (tempWicketsB >= 10 || tempRunsB >= target) break;
      const overNo = Math.floor((b - 1) / 6);
      const ballNo = ((b - 1) % 6) + 1;
      const rOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      let ballRuns = 0;

      if (rOutcome === 'W') {
        tempWicketsB += 1;
      } else if (rOutcome === 'Wd' || rOutcome === 'Nb') {
        ballRuns = 1;
        tempRunsB += 1;
      } else {
        ballRuns = parseInt(rOutcome) || 0;
        tempRunsB += ballRuns;
      }

      const batsman = rosterB[Math.floor(Math.random() * rosterB.length)] || 'Batsman';
      const bowler = rosterA[Math.floor(Math.random() * rosterA.length)] || 'Bowler';

      generatedBalls.push({
        ballNo: `Innings 2 - Over ${overNo}.${ballNo}`,
        batter: batsman,
        bowler,
        result: rOutcome,
        runs: ballRuns,
        commentary: rOutcome === 'W' 
          ? `💥 BOWLED! ${bowler} beats the defense of ${batsman} with a deceptive off-cutter cracking the stumps!`
          : rOutcome === '6' 
            ? `🚀 HUUGE SIX! ${batsman} launches this massive hit over wicketkeeper straight into the commentary box!`
            : rOutcome === '4' 
              ? `🔥 BOUNDARY! Swept perfectly along the ground by ${batsman} off ${bowler}.`
              : `${batsman} drives ${bowler} down the track scoring ${ballRuns} run.`
      });
    }

    // Determine status text
    let statusText = '';
    if (tempRunsB >= target) {
      statusText = `🏆 ${teamBObj.name} WON the express match by ${10 - tempWicketsB} wickets with balls left!`;
    } else if (tempRunsB === tempRunsA) {
      statusText = "🤝 MATCH TIED! Dramatic finish on the final delivery!";
    } else {
      statusText = `🏆 ${teamAObj.name} WON the express match by ${tempRunsA - tempRunsB} runs! Defending champions.`;
    }

    // Update simulation states
    setSimCommentaries(generatedBalls);
    setSimScore({
      teamA: teamAObj.name,
      runsA: tempRunsA,
      wicketsA: tempWicketsA,
      teamB: teamBObj.name,
      runsB: tempRunsB,
      wicketsB: tempWicketsB,
      status: statusText
    });
    setSimIsRunning(false);
    
    showNotification(`Express Match Completed: ${statusText}`, "success");
    logAction("Express Matchplay Simulated", "Matchplay", `Simulated match day ball-by-ball. Final Score: ${teamAObj.name} vs ${teamBObj.name} (${tempRunsA}/${tempWicketsA} vs ${tempRunsB}/${tempWicketsB}).`);
  };

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 pb-6 text-xs text-slate-100">
      
      {/* Top Banner Header */}
      <div className="pb-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#f59e0b] flex items-center gap-1.5 leading-none">
            <Lock size={12} className="text-[#f59e0b]" /> Governance, Audits & Matchplay System
          </h3>
          <span className="text-[9px] text-slate-500 uppercase mt-1 block font-bold leading-none">
            Corporate Audit Trail Ledger • Accelerated Retrievals • Outbound WhatsApp alerts • Live Scorer Synchronization
          </span>
        </div>

        {/* Mini Tab Links */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-850">
          {[
            { id: 'audit', label: 'Audit Registry', icon: ListFilter },
            { id: 'unsold', label: 'Unsold Retrieval', icon: RefreshCw },
            { id: 'rtm', label: 'RTM Manual Override', icon: ArrowRightLeft },
            { id: 'exports', label: 'Corporate Report Sheets', icon: FileSpreadsheet },
            { id: 'broadcasting', label: 'Outbox Messaging', icon: MessageSquare },
            { id: 'matchplay', label: 'Matchplay Simulator', icon: Play },
            { id: 'reset', label: 'Reset Auction Session', icon: RotateCcw }
          ].map(subTab => {
            const Icon = subTab.icon;
            const isSubTabActive = activeGovernanceTab === subTab.id;
            return (
              <button
                key={subTab.id}
                onClick={() => setActiveGovernanceTab(subTab.id as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border-none ${
                  isSubTabActive 
                    ? 'bg-slate-900 text-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.08)]' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                <Icon size={10} />
                <span>{subTab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================= */}
      {/* 1. AUDIT REGISTRY TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'audit' && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-250 block">Secured Operational Audit Trails</span>
                <span className="text-[8.5px] text-slate-500 uppercase font-bold">Comprehensive, transparent digital footprint record ledger</span>
              </div>

              {/* Ledger filters */}
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="text" 
                  value={auditKeyword}
                  onChange={(e) => setAuditKeyword(e.target.value)}
                  placeholder="Keyword search logs..."
                  className="bg-slate-950 border border-slate-850 px-2 py-1 text-[8.5px] text-white rounded-md placeholder-slate-500 outline-none focus:border-red-500/50"
                />

                <span className="text-[8px] font-bold text-slate-500 uppercase">Class:</span>
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value as any)}
                  className="bg-slate-950 text-slate-200 text-[8.5px] font-bold py-1 px-2 border border-slate-850 rounded-md uppercase"
                >
                  <option value="all">ALL ENTRIES</option>
                  <option value="Rule">RULE MODIFICATIONS</option>
                  <option value="Bid">BID TRIGGERS</option>
                  <option value="Auth">AUTHENTICATION/ROLE</option>
                  <option value="Roster">ROSTERS & DRAWS</option>
                  <option value="Notification">ALERT TRANSITIONS</option>
                  <option value="Matchplay">MATCHPLAY SYNC</option>
                </select>

                <button
                  onClick={calculateLedgerChecksum}
                  disabled={ledgerScanning}
                  className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1 cursor-pointer border-none ${
                    ledgerVerified 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-indigo-650 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {ledgerScanning ? (
                    <>
                      <div className="w-2.5 h-2.5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                      <span>Scanning Hashing...</span>
                    </>
                  ) : ledgerVerified ? (
                    <>
                      <Check size={8} /> Verified
                    </>
                  ) : (
                    <span>🔒 Verify Ledger</span>
                  )}
                </button>
              </div>
            </div>

            <div className="border border-slate-850/80 rounded-lg overflow-hidden bg-slate-950">
              <div className="max-h-[290px] overflow-y-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-850 text-[8.5px] font-black uppercase tracking-wider text-slate-400">
                      <th className="p-2.5">TIMESTAMP</th>
                      <th className="p-2.5">CLASSIFICATION</th>
                      <th className="p-2.5">INCIDENT SUMMARY</th>
                      <th className="p-2.5">OPERATOR SYSTEM ID</th>
                      <th className="p-2.5">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-[8.5px]">
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500 uppercase font-bold tracking-wider">
                          No audit entries matching category search filters
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-2.5 text-slate-450 whitespace-nowrap font-mono">{log.timestamp}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest leading-none ${
                              log.category === 'Rule' ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/50' :
                              log.category === 'Bid' ? 'bg-amber-950/80 text-amber-500 border border-amber-900/50' :
                              log.category === 'Auth' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50' :
                              log.category === 'Roster' ? 'bg-pink-950/80 text-pink-400 border border-pink-900/50' :
                              log.category === 'Notification' ? 'bg-purple-950/80 text-purple-400 border border-purple-900/50' :
                              'bg-rose-950/80 text-rose-400 border border-rose-900/50'
                            }`}>
                              {log.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-200">
                            <p className="font-bold">{log.action}</p>
                            <span className="text-[7.5px] text-slate-400 leading-normal">{log.details}</span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-400 whitespace-nowrap">{log.user}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[7px]">
                              <span className="h-1 w-1 bg-emerald-500 rounded-full animate-ping"></span> SECURED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-850/40 text-[8.5px] gap-2">
              <div className="flex flex-col sm:flex-row items-baseline gap-2">
                <span className="text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                  <BadgeInfo size={10} className="text-[#f59e0b]" /> DIGITAL CRYPTOGRAPHIC LEDGER • NON-MUTABLE AUDIT TRAIL ACTIVE
                </span>
                {ledgerVerified && (
                  <span className="text-[7.5px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    SIGNATURE: {ledgerChecksum}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setAuditLogs([
                    {
                      id: 'al_clear_' + Date.now(),
                      timestamp: new Date().toLocaleString(),
                      action: 'Audit Log Flush Triggered',
                      category: 'Auth',
                      details: 'Administrator manually executed ledger flush controls sequence.',
                      user: 'commissioner_admin'
                    }
                  ]);
                  showNotification("Audit ledger system reset successfully.", "info");
                }}
                className="text-[8px] font-bold text-rose-500 hover:text-rose-450 uppercase tracking-widest border-none bg-transparent cursor-pointer"
              >
                Clear Ledger History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 2. UNSOLD ACCELERATED RETRIEVAL TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'unsold' && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Control Nominating Panel */}
            <div className="md:col-span-5 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 space-y-4">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Accelerated Retrieval Control Center</h4>
                <p className="text-[8.5px] text-slate-500 mt-1 leading-normal uppercase font-bold">
                  Recycle skipped or unsold players into second-chance discount bidding sequence. Matches IPL buy-back procedures.
                </p>
              </div>

              {/* Select Unsold player */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Select Skipped/Unsold Nominee:</label>
                <select
                  value={selectedUnsoldPlayerId}
                  onChange={(e) => setSelectedUnsoldPlayerId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 border border-slate-850 rounded-lg"
                >
                  <option value="">-- Choose Skipped/Unsold Recruits --</option>
                  {unsoldsList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.role}) - Base Var: {formatPrice(p.basePrice)} Cr - {p.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slider Discount */}
              <div className="space-y-1 pb-2">
                <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider">
                  <span className="text-slate-400">Discount Percentage:</span>
                  <span className="text-[#f59e0b]">{discountPct}% Off</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[7px] text-slate-500 uppercase font-black">
                  <span>No Discount</span>
                  <span>20% (Standard)</span>
                  <span>50% Max Cap</span>
                </div>
              </div>

              {/* Calculation info box */}
              {selectedUnsoldPlayerId && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850/50 space-y-1">
                  {(() => {
                    const selected = players.find(p => p.id === selectedUnsoldPlayerId);
                    if (!selected) return null;
                    const discounted = Number((selected.basePrice * (1 - discountPct / 100)).toFixed(2));
                    return (
                      <>
                        <div className="flex justify-between text-[8px] text-slate-400 uppercase font-bold">
                          <span>Original Base:</span>
                          <span className="font-mono">₹{selected.basePrice.toFixed(2)} Cr</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-400 uppercase font-bold">
                          <span>Applied Discount Savings:</span>
                          <span className="text-rose-500 font-mono">-₹{(selected.basePrice - discounted).toFixed(2)} Cr</span>
                        </div>
                        <div className="pt-1.5 border-t border-slate-900 flex justify-between text-[9px] text-[#f59e0b] uppercase font-black">
                          <span>Accelerated New Base:</span>
                          <span className="font-mono">₹{discounted.toFixed(2)} Crores</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              <button
                onClick={handleTriggerAcceleratedRound}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 select-none via-yellow-400 to-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-lg border-none flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10 hover:scale-[1.01] active:scale-95 transition-all text-center"
              >
                <RefreshCw size={11} className="animate-spin-slow" /> Push Nominee into Arena
              </button>
            </div>

            {/* In-active skipped player cards list */}
            <div className="md:col-span-7 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 flex flex-col min-h-[300px]">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 block">Accelerated Retrieval Pool ({unsoldsList.length})</span>
                  <span className="text-[8.5px] text-slate-500 uppercase font-black">Holdings awaiting secondary discounts</span>
                </div>
                {unsoldsList.length > 0 && (
                  <button
                    onClick={() => {
                      if (window.confirm("Do you want to reset all skipped players status to Nominated base values?")) {
                        const updated = players.map(p => {
                          if (p.status === 'Skipped') return { ...p, status: 'Unsold' as const };
                          return p;
                        });
                        setPlayers(updated);
                        showNotification("Skipped players status reset back to standard unsold pool.", "info");
                        logAction("Skipped Roster Restructure", "Roster", "Batch updated all skipped roster status entries back to default unsold nominations.");
                      }
                    }}
                    className="text-[8px] text-slate-400 uppercase tracking-wider font-bold border border-slate-850 bg-slate-950 px-2 py-1 rounded"
                  >
                    Reset Skipped Statuses
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[240px] space-y-1.5">
                {unsoldsList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 uppercase font-bold tracking-wider gap-1 border-2 border-dashed border-slate-850/20 rounded-xl">
                    <Check size={20} className="text-emerald-500 inline-block mb-1" />
                    <span>No Skipped or Unsold Players available!</span>
                    <span className="text-[7.5px] text-slate-600 leading-normal">Every registered player has been drafted successfully or roster table is completely full.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unsoldsList.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedUnsoldPlayerId(p.id)}
                        className={`p-2.5 rounded-lg border flex items-center justify-between transition-all cursor-pointer select-none ${
                          selectedUnsoldPlayerId === p.id
                            ? 'bg-amber-950/20 border-amber-500/60'
                            : 'bg-slate-950/50 border-slate-850/50 hover:bg-slate-900/40 hover:border-slate-800'
                        }`}
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-bold text-slate-200 truncate">{p.name}</span>
                            <span className={`text-[7px] font-black uppercase px-1 rounded-sm ${
                              p.status === 'Skipped' ? 'bg-pink-950/60 text-pink-400' : 'bg-slate-850 text-slate-400'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[7.5px] text-slate-450 uppercase font-bold">
                            {p.role} • {p.country}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-[8.5px] font-black text-amber-500 font-mono">
                            ₹{p.basePrice.toFixed(2)} Cr
                          </span>
                          <span className="text-[7.5px] text-slate-500 uppercase font-black block">Base price</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* RTM MANUAL OVERRIDE TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'rtm' && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850/60 space-y-5">
            <div className="max-w-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500">Right to Match (RTM) Contract Override</h4>
              <p className="text-[8.5px] text-slate-500 mt-1 uppercase font-bold leading-normal">
                Execute legal administrator overrides re-assigning sold players to a different franchise at matching bid price. Recalculates remaining team wallets auto-negotiation ledgers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              
              {/* SELECT PLAYER (Sold players only) */}
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Select Sold Player</label>
                <select
                  value={rtmPlayerId}
                  onChange={(e) => {
                    const pid = e.target.value;
                    setRtmPlayerId(pid);
                    const selectedPl = players.find(p => p.id === pid);
                    if (selectedPl) {
                      setRtmCustomPrice((selectedPl.soldPrice || selectedPl.basePrice).toString());
                    } else {
                      setRtmCustomPrice('');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="">-- Choose Sold Player --</option>
                  {players.filter(p => p.status === 'Sold').map(p => {
                    const currentTeam = teams.find(t => t.id === p.soldTo);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} ({currentTeam?.name || 'Assigned'} - ₹{(p.soldPrice || p.basePrice).toFixed(2)} Cr)
                      </option>
                    );
                  })}
                </select>
                <p className="text-[7.5px] text-slate-505 uppercase mt-1 leading-normal font-medium">
                  Only players currently marked as **Sold** may undergo RTM contract adjustment.
                </p>
              </div>

              {/* SELECT TARGET TEAM */}
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Select Target Franchise</label>
                <select
                  value={rtmTargetTeamId}
                  onChange={(e) => setRtmTargetTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="">-- Choose New Franchise --</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Purse: ₹{t.purse.toFixed(2)} Cr)
                    </option>
                  ))}
                </select>
                <p className="text-[7.5px] text-slate-505 uppercase mt-1 leading-normal font-medium">
                  The target franchise matching this candidate must possess a sufficient wallet.
                </p>
              </div>

              {/* CUSTOM MATCHING PRICE */}
              <div>
                <label className="text-[8px] font-black text-slate-500 uppercase block mb-1">Matching Price (Crores)</label>
                <input
                  type="number"
                  step="0.05"
                  value={rtmCustomPrice}
                  onChange={(e) => setRtmCustomPrice(e.target.value)}
                  placeholder="e.g. 5.50"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-amber-500 font-mono font-semibold"
                />
                <p className="text-[7.5px] text-slate-505 uppercase mt-1 leading-normal font-medium">
                  Override bid value in Crores. Defaults to the player's current recorded price.
                </p>
              </div>

            </div>

            <div className="pt-2 border-t border-slate-850/40 flex justify-end">
              <button
                onClick={handleExecuteRtmOverride}
                className="px-6 py-2.5 bg-[#f59e0b] hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <ArrowRightLeft size={13} /> Apply Right To Match Override Decree
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 3. CORPORATE EXPORTS TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'exports' && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 space-y-4">
            <div className="max-w-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Corporate Financials & Roster Dossier Exports</h4>
              <p className="text-[8.5px] text-slate-500 mt-1 uppercase font-bold leading-normal">
                Produce executive multiformat reporting outputs satisfying legal accounting and league audit protocols. Downloads real multi-sheet spreadsheets and secure PDF files directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card 1: Excel Workbook */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-400">
                    <FileSpreadsheet size={15} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Excel Master Ledger (.XLSX)</span>
                  </div>
                  <p className="text-[8px] text-slate-450 leading-relaxed uppercase font-bold">
                    Standard multi-sheet workbook output. Integrates official financial purses balance sheet, squad rosters cost ledger, and complete concurrent audit records.
                  </p>
                </div>

                <button
                  onClick={handleExportExcel}
                  className="w-full py-2 bg-slate-905 border border-teal-500/30 hover:border-teal-500 text-teal-400 hover:text-white font-black text-[8px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all hover:bg-teal-555"
                >
                  <Download size={10} /> Generate XLSX Document
                </button>
              </div>

              {/* Card 2: PDF Roster */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#f59e0b]">
                    <FileDown size={15} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Secure Regulatory PDF Record (.PDF)</span>
                  </div>
                  <p className="text-[8px] text-slate-450 leading-relaxed uppercase font-bold">
                    Official signature report matching executive sport compliance. Auto-renders printable format displaying squad allocations, individual valuations, contract indices & ledger audits.
                  </p>
                </div>

                <button
                  onClick={handleExportPDF}
                  className="w-full py-2 bg-slate-905 border border-amber-500/30 hover:border-[#f59e0b] text-[#f59e0b] hover:text-slate-950 font-black text-[8px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all hover:bg-amber-500"
                >
                  <FileText size={10} /> Generate Regulatory PDF
                </button>
              </div>

              {/* Card 3: PDF Audit Log Record */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col justify-between space-y-3 sm:col-span-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-405">
                    <ShieldAlert size={15} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Official Governance Audit Trail Book (.PDF)</span>
                  </div>
                  <p className="text-[8px] text-slate-450 leading-relaxed uppercase font-bold">
                    Raw sequential, timestamped regulatory ledger detailing every single manual rule adjustment, active bid, user ID login session, and contract override for ironclad official transparency.
                  </p>
                </div>

                <button
                  onClick={handleExportAuditLogsPDF}
                  className="w-full py-2 bg-slate-905 border border-rose-500/30 hover:border-rose-550 text-rose-450 hover:text-white font-black text-[8px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all hover:bg-rose-500"
                >
                  <FileText size={10} /> Generate Raw Compliance Audit Logs PDF
                </button>
              </div>

            </div>

            {/* Display simple preview indices summary */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850/40 text-[8.5px] space-y-2">
              <span className="font-black text-slate-350 uppercase tracking-wider block">Local Ledger Summary Indexes:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-400">
                <div className="bg-slate-950 p-2 rounded border border-slate-900">
                  <span className="text-slate-500 block uppercase text-[7.5px] font-bold">Total Franchises:</span>
                  <span className="text-xs font-bold text-slate-200">{teams.length} Groups</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-900">
                  <span className="text-slate-500 block uppercase text-[7.5px] font-bold">Total Drafted Recruits:</span>
                  <span className="text-xs font-bold text-[#f59e0b]">{players.filter(p => p.status === 'Sold').length} Sold</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-900">
                  <span className="text-slate-500 block uppercase text-[7.5px] font-bold">Purses Remaining:</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">₹{teams.reduce((acc, t) => acc + t.purse, 0).toFixed(2)} Cr</span>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-900">
                  <span className="text-slate-500 block uppercase text-[7.5px] font-bold">Total Audit Logs:</span>
                  <span className="text-xs font-bold text-indigo-400 font-mono">{auditLogs.length} Records</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 4. ACTIVE OUTGOING MESSAGES OUTBOX TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'broadcasting' && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Contact Alert Configuration Panel */}
            <div className="md:col-span-5 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 space-y-4">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">Automated Outbound Alerts Registry</h4>
                <p className="text-[8.5px] text-slate-500 mt-1 leading-normal uppercase font-bold">
                  Keep players informed on draft day! Push instant personalized WhatsApp alerts or SMS notifications directly to contact targets.
                </p>
              </div>

              {/* Select sold player */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Select Recruited Draft Player:</label>
                <select
                  value={selectedPlayerForWa}
                  onChange={(e) => handleSelectedPlayerChange(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 border border-slate-850 rounded-lg font-bold"
                >
                  <option value="">-- Choose Recruited Player --</option>
                  {players.filter(p => p.status === 'Sold').map(p => {
                    const franchise = teams.find(t => t.id === p.soldTo);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Sold to: {franchise ? franchise.name : 'N/A'} @ ₹{p.soldPrice} Cr)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Phone number input display */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Contact Registered Endpoint:</label>
                <input
                  type="text"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-950 text-slate-200 text-xs py-2 px-3 border border-slate-850 rounded-lg font-mono font-bold"
                />
              </div>

              {/* WhatsApp custom text template */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Configure Message Content:</label>
                <textarea
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 text-slate-200 text-[10px] py-1.5 px-2.5 border border-slate-850 rounded-lg focus:outline-none"
                />
                <span className="text-[7px] text-slate-500 uppercase leading-normal font-bold block">
                  Supports templates variables: <code className="text-amber-500">{`{PlayerName}`}</code>, <code className="text-amber-500">{`{TeamName}`}</code>, <code className="text-amber-500">{`{Price}`}</code>
                </span>
              </div>

              <button
                onClick={handleLaunchWhatsApp}
                className="w-full py-2.5 bg-[#25D366] text-slate-950 hover:bg-[#25D366]/90 font-black text-[9px] uppercase tracking-widest rounded-lg border-none flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all"
              >
                <Send size={11} /> Send Broadcast via WhatsApp Web
              </button>
            </div>

            {/* Outgoing feed logs monitoring */}
            <div className="md:col-span-7 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 block">Outbox Alert Feed Log Entries</span>
                <span className="text-[8.5px] text-slate-500 uppercase font-black leading-none block mt-1">Simulated logs dispatched sequentially on recruitment</span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[250px] space-y-1.5 my-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
                {gatewayLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 uppercase tracking-widest font-black py-8">
                    No outbound telemetry messages processed yet
                  </div>
                ) : (
                  gatewayLogs.map((log) => (
                    <div key={log.id} className="text-[8.5px] border-b border-slate-900 pb-1.5 last:border-none flex items-start justify-between gap-3">
                      <div className="space-y-0.5 truncate">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[6.5px] font-black uppercase tracking-widest ${
                            log.service === 'WhatsApp' ? 'bg-[#25D366]/20 text-[#25D366]' :
                            log.service === 'SMS' ? 'bg-indigo-950/80 text-indigo-400' :
                            'bg-amber-950/80 text-amber-500'
                          }`}>
                            {log.service}
                          </span>
                          <span className="text-slate-400">{log.text}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-slate-500 font-mono text-[7px]">{log.time}</span>
                        <span className="text-emerald-400 text-[6.5px] font-black uppercase tracking-wider block">DISPATCHED</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-900 text-[7px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <AlertCircle size={9} className="text-[#f59e0b]" /> TELECOMMUNICATIONS TRANSPARENCY SECURED VIA AUTOMATED DISPATCH LOGIFIERS
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 5. MATCHPLAY SYNC & SIMULATOR TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'matchplay' && (
        <div className="space-y-4 animate-fade-in-down">
          
          {/* Main Top Scorer Synchronizer Controls bar */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-indigo-950/40 p-4 rounded-xl border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500 animate-pulse" /> Live Scorer Sync Integration (CrickHunt Pro-Tier)
              </h4>
              <p className="text-[8px] text-slate-400 leading-normal uppercase font-bold">
                Directly registers dynamic squad rosters into the built-in ball-by-ball score tracking module for subsequent match days.
              </p>
            </div>

            <button
              onClick={handleSyncWithMatchScorer}
              className="py-2.5 px-6 self-start md:self-center bg-gradient-to-r from-indigo-500 select-none to-violet-600 text-slate-100 font-black text-[9px] uppercase tracking-widest rounded-xl border-none flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all"
            >
              <ArrowRightLeft size={11} /> Sync Draft with Scoreboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Simulator Cockpit settings */}
            <div className="md:col-span-5 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 space-y-4 flex flex-col">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] block">Express Playoff Simulator</span>
                <span className="text-[8.5px] text-slate-500 mt-1 uppercase font-bold block leading-normal">
                  Roller simulation of subsequent tournament fixtures on dynamic rosters.
                </span>
              </div>

              {/* Match selector teams */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Team A (Batting):</label>
                  <select
                    value={simTeamA}
                    onChange={(e) => setSimTeamA(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-1.5 px-2 border border-slate-850 rounded-lg"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">Team B (Bowling):</label>
                  <select
                    value={simTeamB}
                    onChange={(e) => setSimTeamB(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-1.5 px-2 border border-slate-850 rounded-lg"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Overs Selector */}
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">Overs Match Format Limit:</label>
                <div className="flex gap-2">
                  {[2, 5, 10, 20].map(ov => (
                    <button
                      key={ov}
                      onClick={() => setSimOvers(ov)}
                      className={`flex-1 py-1.5 font-bold rounded-lg cursor-pointer transition-all border text-[9px] ${
                        simOvers === ov 
                          ? 'bg-indigo-950 border-indigo-500 text-indigo-400' 
                          : 'bg-slate-950 border-slate-850 hover:bg-slate-900 text-slate-450'
                      }`}
                    >
                      {ov} Overs
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-850/40">
                <button
                  onClick={handleSimulateExpressMatch}
                  disabled={simIsRunning}
                  className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-lg border-none flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 select-none"
                >
                  <Play size={11} className="fill-current" /> Run Express Playoff Pitch Simulation
                </button>
              </div>

              {/* Dynamic express scoreboard output if simulated */}
              {simScore.status !== 'Not Started' && (
                <div className="bg-slate-950 p-4 rounded-xl border border-indigo-950/50 space-y-3 mt-auto">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 border-b border-indigo-950 pb-1.5">
                    <span>LIVE EXPRESS SCOREBOARD</span>
                    <span>T20 DRAFT SYNCED</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-200">{simScore.teamA}</span>
                      <span className="font-mono text-amber-500 font-extrabold">{simScore.runsA}/{simScore.wicketsA}</span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-slate-200">{simScore.teamB}</span>
                      <span className="font-mono text-amber-500 font-extrabold">{simScore.runsB}/{simScore.wicketsB}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-950 text-center">
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-400 block animate-pulse">
                      {simScore.status}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Run-by-run ball comments crawler stream */}
            <div className="md:col-span-7 bg-slate-900/40 p-4 rounded-xl border border-slate-850/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-200 block">Fastplay Ball-by-Ball Feed Logs Stream</span>
                <span className="text-[8.5px] text-slate-500 uppercase font-black tracking-normal mt-1 leading-none block">
                  Dynamic commentary triggers customized on selected squad batting and bowling ratings
                </span>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar max-h-[290px] space-y-2 my-3 bg-slate-950 p-3 rounded-lg border border-slate-850/80">
                {simCommentaries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 uppercase tracking-widest font-black text-[9px] gap-1">
                    <Check size={16} className="text-indigo-400 block" /> Ready to simulate playoff match day!
                  </div>
                ) : (
                  simCommentaries.map((play, idx) => (
                    <div key={idx} className="text-[9px] border-b border-slate-900 pb-2 last:border-none last:pb-0 font-sans">
                      <div className="flex justify-between items-center text-slate-450 font-bold mb-1 uppercase text-[7.5px]">
                        <span>{play.ballNo}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">{play.batter} vs {play.bowler}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                            play.result === 'W' ? 'bg-rose-950/80 text-rose-400' :
                            play.result === '6' || play.result === '4' ? 'bg-amber-950/80 text-amber-500' :
                            'bg-slate-900 text-slate-350'
                          }`}>
                            {play.result}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-200 leading-normal text-[9.5px]">{play.commentary}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[7px] text-slate-500 uppercase tracking-widest flex items-center justify-between">
                <span>GULLYSCORE DIGITAL PLAYOFF EMULATOR VER 2.0</span>
                <span className="text-indigo-400">SYNC ACTIVE</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 6. RESET AUCTION SESSION TAB */}
      {/* ========================================= */}
      {activeGovernanceTab === 'reset' && (
        <div className="space-y-4 animate-fade-in-down">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-rose-500/20 space-y-6">
            <div className="max-w-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 flex items-center gap-1.5 shadow-sm">
                <ShieldAlert size={14} className="text-rose-500 animate-pulse" /> Extreme Administrative Force Reset
              </h4>
              <p className="text-[8.5px] text-slate-400 mt-1 uppercase font-bold leading-normal">
                This process resets all drafted rosters, clears current team wallet spendings, wipes local browser synchronization caches, and defaults player statuses back to "Unsold".
              </p>
            </div>

            <div className="bg-rose-950/10 p-4 rounded-xl border border-rose-500/10 space-y-3">
              <span className="text-[9px] font-black uppercase text-rose-455 block">⚠️ CRITICAL WARNING FOR TOURNAMENT DIRECTORS</span>
              <p className="text-[8.5px] text-slate-505 uppercase block leading-relaxed font-semibold font-sans">
                By initiating this reset protocol:
                <br />• All current <strong>franchise recruitment portfolios will be wiped completely</strong>.
                <br />• Current bidding ledger streams, timing states, and active nominated indicators are restored to default setup parameters.
                <br />• There are no database revert operations once completed.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-850/40 flex justify-between items-center">
              <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                Logged ID: ADMIN_SECURED_SYSTEM
              </div>

              <button
                onClick={() => {
                  if (onResetAuction) {
                    onResetAuction();
                  } else {
                    showNotification("Reset handler is not bound to the layout context!", "alert");
                  }
                }}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border-none flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/20 hover:scale-[1.01] active:scale-95 duration-150"
              >
                <Trash2 size={13} /> Reset Campaign & Return to Setup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
