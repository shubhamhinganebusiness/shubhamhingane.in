import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, Link2, Copy, Check, Share2, MessageCircle, 
  Trash2, Edit3, X, Shield, Plus, Sparkles, ExternalLink, RefreshCw 
} from 'lucide-react';
import { safeSetDoc, safeDeleteDoc, isFirestoreQuotaExhausted, db } from '../../lib/firebase';
import { doc } from 'firebase/firestore';
import { getCaptainInviteUrl } from './cricketStorage';

export interface CricketTeamPlayer {
  id?: string;
  name: string;
  role?: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  jerseyNumber?: string | number;
  mobileNumber?: string;
  photo?: string;
}

export interface CricketTeam {
  id: string;
  name: string;
  shortName?: string;
  captainName?: string;
  captainPhone?: string;
  logo?: string;
  teamLogo?: string;
  players: string[];
  playerDetails?: CricketTeamPlayer[];
  createdAt: string;
  updatedAt?: number;
  managerId?: string;
  status?: 'pending_captain' | 'squad_submitted' | 'ready';
  notes?: string;
}

interface TeamSquadInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedTeams: CricketTeam[];
  setSavedTeams: React.Dispatch<React.SetStateAction<CricketTeam[]>>;
  onSelectTeamForA: (team: CricketTeam) => void;
  onSelectTeamForB: (team: CricketTeam) => void;
  currentManagerId?: string;
  approvedPlayers?: any[];
  showNotification: (msg: string, type: 'success' | 'alert' | 'info') => void;
}

export const TeamSquadInviteModal: React.FC<TeamSquadInviteModalProps> = ({
  isOpen,
  onClose,
  savedTeams,
  setSavedTeams,
  onSelectTeamForA,
  onSelectTeamForB,
  currentManagerId = 'admin',
  approvedPlayers = [],
  showNotification
}) => {
  const [activeTab, setActiveTab] = useState<'invite_captain' | 'direct_add' | 'manage_teams'>('invite_captain');
  
  // Captain Invite Form State
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [createdInviteTeam, setCreatedInviteTeam] = useState<CricketTeam | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Direct Manual Entry Form State
  const [manualTeamName, setManualTeamName] = useState('');
  const [manualPlayersText, setManualPlayersText] = useState('');
  const [manualCaptainName, setManualCaptainName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  if (!isOpen) return null;

  // Handle Generate Captain Invite Link
  const handleGenerateCaptainInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) {
      showNotification('Please enter a team name!', 'alert');
      return;
    }

    try {
      setIsGenerating(true);
      const teamId = `team-${Date.now()}`;
      const newTeam: CricketTeam = {
        id: teamId,
        name: trimmed,
        shortName: trimmed.substring(0, 3).toUpperCase(),
        captainName: captainName.trim() || undefined,
        captainPhone: captainPhone.trim() || undefined,
        players: [],
        createdAt: new Date().toISOString(),
        updatedAt: Date.now(),
        managerId: currentManagerId,
        status: 'pending_captain'
      };

      if (isFirestoreQuotaExhausted()) {
        setSavedTeams(prev => {
          const next = [...prev.filter(t => t.id !== teamId), newTeam];
          try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
          return next;
        });
      } else {
        await safeSetDoc(doc(db, 'cricket_teams', teamId), newTeam);
      }

      setCreatedInviteTeam(newTeam);
      setIsGenerating(false);
      showNotification(`✓ Team "${trimmed}" created! Send the link to the captain.`, 'success');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      showNotification('Could not generate team invite link', 'alert');
    }
  };

  // Handle Save Team Directly (Manual Entry)
  const handleSaveDirectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualTeamName.trim();
    if (!trimmed) {
      showNotification('Please enter a team name!', 'alert');
      return;
    }

    const playerList = manualPlayersText
      .split(/[\n,]+/)
      .map(p => p.replace(/^\s*\d+[\.\)\-:]\s*/, '').trim())
      .filter(Boolean);

    try {
      setIsSavingManual(true);
      const teamId = editingTeamId || `team-${Date.now()}`;
      const existing = savedTeams.find(t => t.id === teamId);

      const newTeam: CricketTeam = {
        id: teamId,
        name: trimmed,
        shortName: trimmed.substring(0, 3).toUpperCase(),
        captainName: manualCaptainName.trim() || existing?.captainName || undefined,
        players: playerList,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: Date.now(),
        managerId: currentManagerId,
        status: playerList.length >= 11 ? 'ready' : (playerList.length > 0 ? 'squad_submitted' : 'pending_captain')
      };

      if (isFirestoreQuotaExhausted()) {
        setSavedTeams(prev => {
          const next = [...prev.filter(t => t.id !== teamId), newTeam];
          try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
          return next;
        });
      } else {
        await safeSetDoc(doc(db, 'cricket_teams', teamId), newTeam);
      }

      setIsSavingManual(false);
      showNotification(`✓ Team "${trimmed}" saved with ${playerList.length} players!`, 'success');
      setManualTeamName('');
      setManualPlayersText('');
      setManualCaptainName('');
      setEditingTeamId(null);
      setActiveTab('manage_teams');
    } catch (err) {
      console.error(err);
      setIsSavingManual(false);
      showNotification('Failed to save team', 'alert');
    }
  };

  // Copy Link Helper
  const copyLink = (teamId: string) => {
    const url = getCaptainInviteUrl(teamId);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(teamId);
      showNotification('Captain Invite Link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // WhatsApp Share Helper
  const shareWhatsApp = (team: CricketTeam) => {
    const url = getCaptainInviteUrl(team.id);
    const greeting = team.captainName ? `Hi ${team.captainName}` : `Hello Captain`;
    const message = `${greeting}! 🏏 Please submit your 15-player squad roster for "${team.name}" on Gully Score:\n\n${url}\n\nIt takes only 1 minute to submit your squad!`;
    const waUrl = `https://wa.me/${team.captainPhone ? team.captainPhone.replace(/[^0-9]/g, '') : ''}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Delete Team
  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}"?`)) return;
    setSavedTeams(prev => {
      const next = prev.filter(t => t.id !== id);
      try { localStorage.setItem('cricket_saved_teams_backup', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await safeDeleteDoc(doc(db, 'cricket_teams', id));
      showNotification(`Team "${name}" deleted`, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Start Editing Team
  const startEditTeam = (team: CricketTeam) => {
    setManualTeamName(team.name);
    setManualCaptainName(team.captainName || '');
    setManualPlayersText((team.players || []).join('\n'));
    setEditingTeamId(team.id);
    setActiveTab('direct_add');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.65 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
      />

      {/* Main Dialog */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative z-20 max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                  Team & Squad Manager
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Invite Captain to enter 15-player squad or add team directly for 1-click scoreboard setup
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-2xl my-4 text-xs font-black uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveTab('invite_captain')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
              activeTab === 'invite_captain'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <Link2 size={13} />
            <span>Invite Captain</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('direct_add');
              if (!editingTeamId) {
                setManualTeamName('');
                setManualPlayersText('');
              }
            }}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
              activeTab === 'direct_add'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <UserPlus size={13} />
            <span>{editingTeamId ? 'Edit Team' : 'Direct Add'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage_teams')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer ${
              activeTab === 'manage_teams'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
            }`}
          >
            <Users size={13} />
            <span>Saved Teams ({savedTeams.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* TAB 1: INVITE CAPTAIN */}
          {activeTab === 'invite_captain' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-500/20 text-xs">
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black text-emerald-800 dark:text-emerald-300 block mb-0.5">
                      How Captain Squad Invite Works:
                    </span>
                    <p className="text-emerald-700/90 dark:text-emerald-400/90 text-[11px] leading-relaxed">
                      Enter the team name and send the generated link to the team captain via WhatsApp or SMS. 
                      The captain opens the link and submits their 15-player squad with player roles. 
                      The moment they submit, it appears in your scoreboard for 1-click live match setup!
                    </p>
                  </div>
                </div>
              </div>

              {!createdInviteTeam ? (
                <form onSubmit={handleGenerateCaptainInvite} className="space-y-3.5">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bandra Blasters, Royal Challengers Pune"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                        Captain Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={captainName}
                        onChange={(e) => setCaptainName(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                        Captain WhatsApp / Mobile (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 9876543210"
                        value={captainPhone}
                        onChange={(e) => setCaptainPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isGenerating || !teamName.trim()}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                    >
                      <Link2 size={16} />
                      {isGenerating ? 'Creating Team...' : 'Generate Captain Squad Submission Link'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Link Created Success Box */
                <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/60 rounded-2xl border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                        ✓
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
                          Team Created: {createdInviteTeam.name}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Status: Awaiting Captain Roster (0/15 Players)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCreatedInviteTeam(null);
                        setTeamName('');
                        setCaptainName('');
                        setCaptainPhone('');
                      }}
                      className="text-[10px] font-black uppercase text-slate-500 hover:text-slate-800 dark:text-slate-400 bg-transparent border-none cursor-pointer"
                    >
                      + Create Another Team
                    </button>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Captain Invite URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getCaptainInviteUrl(createdInviteTeam.id)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={() => copyLink(createdInviteTeam.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-sm"
                      >
                        {copiedId === createdInviteTeam.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === createdInviteTeam.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => shareWhatsApp(createdInviteTeam)}
                      className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-none shadow-sm"
                    >
                      <MessageCircle size={15} />
                      Send on WhatsApp
                    </button>
                    <a
                      href={getCaptainInviteUrl(createdInviteTeam.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all no-underline border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <ExternalLink size={14} />
                      Open as Captain
                    </a>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Ready to score? Use this team for:
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTeamForA(createdInviteTeam);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-black uppercase border border-emerald-500/30 cursor-pointer"
                      >
                        ⚡ Use as Team A
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTeamForB(createdInviteTeam);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-black uppercase border border-amber-500/30 cursor-pointer"
                      >
                        ⚡ Use as Team B
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIRECT ADD / MANUAL ENTRY */}
          {activeTab === 'direct_add' && (
            <form onSubmit={handleSaveDirectManual} className="space-y-4">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {editingTeamId ? 'Edit Team Roster' : 'Direct Manual Team Entry'}
                </span>
                {editingTeamId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamId(null);
                      setManualTeamName('');
                      setManualPlayersText('');
                    }}
                    className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-600 bg-transparent border-none cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai Warriors"
                    value={manualTeamName}
                    onChange={(e) => setManualTeamName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block mb-1.5">
                    Captain Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rohit"
                    value={manualCaptainName}
                    onChange={(e) => setManualCaptainName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider block">
                    Players List (One player per line or comma-separated)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {manualPlayersText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean).length} Players entered
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder={`Rohit (c)\nVirat\nShubman\nRahul (wk)\nSurya\nHardik\nJadeja\nBumrah\nShami\nKuldeep\nSiraj`}
                  value={manualPlayersText}
                  onChange={(e) => setManualPlayersText(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
                />
              </div>

              {/* Approved Players Quick Click */}
              {approvedPlayers.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Quick Insert from Approved Players ({approvedPlayers.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {approvedPlayers.map((p) => {
                      const name = p.fullName;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const current = manualPlayersText
                              .split(/[\n,]+/)
                              .map(s => s.trim())
                              .filter(Boolean);
                            if (!current.includes(name)) {
                              setManualPlayersText(prev => (prev.trim() ? `${prev.trim()}\n${name}` : name));
                            }
                          }}
                          className="px-2 py-1 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                        >
                          + {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingManual || !manualTeamName.trim()}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-wider text-xs transition-all shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  <Plus size={16} />
                  {isSavingManual ? 'Saving Team...' : editingTeamId ? 'Update Team' : 'Save Team Directly'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: MANAGE SAVED TEAMS */}
          {activeTab === 'manage_teams' && (
            <div className="space-y-3">
              {savedTeams.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Users size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    No Saved Teams Found
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Create a team and send the invite link to the captain, or add players directly using the tabs above.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('invite_captain')}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer shadow-sm"
                  >
                    + Invite Captain Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedTeams.map((t) => {
                    const squadCount = t.players ? t.players.length : 0;
                    const isSquadReady = squadCount >= 11;
                    const isPending = squadCount === 0 || t.status === 'pending_captain';

                    return (
                      <div
                        key={t.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/30 transition-all space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              {(t.logo || t.teamLogo) && (
                                <img
                                  src={t.logo || t.teamLogo}
                                  alt=""
                                  className="w-6 h-6 rounded-lg object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                                />
                              )}
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {t.name}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  isSquadReady
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : isPending
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {isSquadReady
                                  ? `${squadCount} Squad (Ready ✓)`
                                  : isPending
                                  ? 'Awaiting Captain (0/15)'
                                  : `${squadCount} Players`}
                              </span>
                            </div>
                            {t.captainName && (
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                Captain: <span className="font-bold text-slate-700 dark:text-slate-300">{t.captainName}</span>
                                {t.captainPhone && ` (${t.captainPhone})`}
                              </p>
                            )}
                          </div>

                          {/* Quick 1-Click Load into Live Scorecard */}
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectTeamForA(t);
                                onClose();
                              }}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none cursor-pointer shadow-sm transition-transform active:scale-95"
                              title="1-Click Load into Team A"
                            >
                              ⚡ Set Team A
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onSelectTeamForB(t);
                                onClose();
                              }}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider border-none cursor-pointer shadow-sm transition-transform active:scale-95"
                              title="1-Click Load into Team B"
                            >
                              ⚡ Set Team B
                            </button>
                          </div>
                        </div>

                        {/* Player Preview Pills */}
                        {t.players && t.players.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1 max-h-16 overflow-y-auto">
                            {t.players.map((p, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-[9px] font-bold text-slate-700 dark:text-slate-300"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 text-xs">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyLink(t.id)}
                              className="px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                              title="Copy Captain 15-player squad submission link"
                            >
                              {copiedId === t.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              <span>{copiedId === t.id ? 'Copied' : 'Captain Link'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => shareWhatsApp(t)}
                              className="px-2.5 py-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-lg text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer border-none transition-colors"
                              title="Share on WhatsApp to Captain"
                            >
                              <MessageCircle size={12} />
                              <span>WhatsApp</span>
                            </button>
                            <a
                              href={getCaptainInviteUrl(t.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Open Captain Page"
                            >
                              <ExternalLink size={12} />
                            </a>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditTeam(t)}
                              className="p-1 text-slate-400 hover:text-emerald-500 bg-transparent border-none cursor-pointer"
                              title="Edit team / players"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeam(t.id, t.name)}
                              className="p-1 text-slate-400 hover:text-rose-500 bg-transparent border-none cursor-pointer"
                              title="Delete team"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-[10px] text-slate-400">
            {savedTeams.length} teams in registry
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider border-none cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
