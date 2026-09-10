import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Share2,
  Copy,
  ClipboardCheck,
  Send,
  Sparkles,
  Award,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  Phone,
  User,
  ArrowLeft,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirestoreQuotaExhausted } from '../../lib/firebase';

export interface SquadPlayerItem {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketkeeper: boolean;
  jerseyNumber?: string;
}

export interface CricketTeamData {
  id: string;
  name: string;
  shortName?: string;
  captainName?: string;
  captainPhone?: string;
  players: string[];
  squadDetails?: SquadPlayerItem[];
  status?: 'pending_squad' | 'squad_submitted' | 'ready';
  createdAt: string;
  updatedAt?: number;
  managerId?: string;
}

const DEFAULT_ROLES: Array<{ key: SquadPlayerItem['role']; label: string; icon: string }> = [
  { key: 'batsman', label: 'Batsman', icon: '🏏' },
  { key: 'bowler', label: 'Bowler', icon: '🎯' },
  { key: 'allrounder', label: 'All-Rounder', icon: '⚡' },
  { key: 'wicketkeeper', label: 'Wicketkeeper', icon: '🧤' },
];

export const CaptainSquadSubmission: React.FC = () => {
  const params = useParams<{ teamId?: string }>();
  const [searchParams] = useSearchParams();
  const teamId = params.teamId || searchParams.get('teamId') || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [teamData, setTeamData] = useState<CricketTeamData | null>(null);
  const [teamName, setTeamName] = useState<string>('');
  const [captainName, setCaptainName] = useState<string>('');
  const [captainPhone, setCaptainPhone] = useState<string>('');
  const [squad, setSquad] = useState<SquadPlayerItem[]>([]);
  
  // Bulk paste modal
  const [showBulkPaste, setShowBulkPaste] = useState<boolean>(false);
  const [bulkText, setBulkText] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Initialize 11 empty slots if creating fresh
  const initEmptySquad = (count = 11): SquadPlayerItem[] => {
    return Array.from({ length: count }, (_, idx) => ({
      id: `player-${Date.now()}-${idx}`,
      name: '',
      role: idx < 5 ? 'batsman' : idx === 5 ? 'wicketkeeper' : idx < 8 ? 'allrounder' : 'bowler',
      isCaptain: idx === 0,
      isViceCaptain: idx === 1,
      isWicketkeeper: idx === 5,
      jerseyNumber: `${idx + 1}`
    }));
  };

  // Load team data from Firestore
  useEffect(() => {
    if (!teamId) {
      // Manual team entry mode
      setTeamName('My Cricket Team');
      setSquad(initEmptySquad(11));
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = doc(db, 'cricket_teams', teamId);

    const unsub = onSnapshot(docRef, (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as CricketTeamData;
        setTeamData(data);
        setTeamName(data.name || 'Cricket Team');
        setCaptainName(data.captainName || '');
        setCaptainPhone(data.captainPhone || '');

        if (data.squadDetails && data.squadDetails.length > 0) {
          setSquad(data.squadDetails);
        } else if (data.players && data.players.length > 0) {
          // Convert existing string array to rich squad
          const converted: SquadPlayerItem[] = data.players.map((name, idx) => {
            const cleanName = name.replace(/\s*\([CcVvWwKk/]+\)/g, '').trim();
            const isC = name.toLowerCase().includes('(c)') || idx === 0;
            const isVC = name.toLowerCase().includes('(vc)') || idx === 1;
            const isWK = name.toLowerCase().includes('(wk)') || name.toLowerCase().includes('keeper');
            return {
              id: `p-${idx}`,
              name: cleanName,
              role: isWK ? 'wicketkeeper' : idx < 5 ? 'batsman' : idx < 8 ? 'allrounder' : 'bowler',
              isCaptain: isC,
              isViceCaptain: isVC,
              isWicketkeeper: isWK,
              jerseyNumber: `${idx + 1}`
            };
          });
          setSquad(converted);
        } else {
          setSquad(initEmptySquad(11));
        }

        if (data.status === 'squad_submitted') {
          setSubmitted(true);
        }
      } else {
        // Doc doesn't exist yet, init fresh
        setTeamName('New Team');
        setSquad(initEmptySquad(11));
      }
    }, (err) => {
      console.warn('Error listening to team squad doc:', err);
      setLoading(false);
      // Local fallback
      try {
        const local = localStorage.getItem(`cricket_team_${teamId}`);
        if (local) {
          const parsed = JSON.parse(local);
          setTeamData(parsed);
          setTeamName(parsed.name || 'Cricket Team');
          if (parsed.squadDetails) setSquad(parsed.squadDetails);
        } else {
          setSquad(initEmptySquad(11));
        }
      } catch (e) {
        setSquad(initEmptySquad(11));
      }
    });

    return () => unsub();
  }, [teamId]);

  // Add new player slot (up to 15 players)
  const handleAddPlayer = () => {
    if (squad.length >= 15) {
      setFeedbackMsg({ text: 'A maximum of 15 squad players can be submitted.', type: 'info' });
      return;
    }
    const newIdx = squad.length + 1;
    const newPlayer: SquadPlayerItem = {
      id: `player-${Date.now()}-${newIdx}`,
      name: '',
      role: 'allrounder',
      isCaptain: false,
      isViceCaptain: false,
      isWicketkeeper: false,
      jerseyNumber: `${newIdx}`
    };
    setSquad(prev => [...prev, newPlayer]);
  };

  // Remove player slot
  const handleRemovePlayer = (idxToRemove: number) => {
    if (squad.length <= 2) {
      setFeedbackMsg({ text: 'Squad must have at least 2 players.', type: 'info' });
      return;
    }
    setSquad(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Update a single player field
  const handleUpdatePlayer = (idx: number, field: keyof SquadPlayerItem, value: any) => {
    setSquad(prev => {
      const updated = [...prev];
      if (field === 'isCaptain' && value === true) {
        // Only one captain allowed
        updated.forEach((p, i) => {
          if (i !== idx) p.isCaptain = false;
        });
      }
      if (field === 'isViceCaptain' && value === true) {
        // Only one vice captain allowed
        updated.forEach((p, i) => {
          if (i !== idx) p.isViceCaptain = false;
        });
      }
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Bulk paste from WhatsApp
  const handleApplyBulkPaste = () => {
    if (!bulkText.trim()) return;

    // Split by lines, commas, or semicolons
    const rawLines = bulkText
      .split(/[\n,;]+/)
      .map(line => {
        // Remove numbered list artifacts: "1.", "1)", "#1", "-", "*", etc.
        return line.replace(/^[\s\d#.*)\]\-]+/, '').trim();
      })
      .filter(line => line.length > 0);

    if (rawLines.length === 0) {
      setFeedbackMsg({ text: 'No player names detected in the pasted text.', type: 'error' });
      return;
    }

    // Limit to 15 players
    const sliced = rawLines.slice(0, 15);
    const newSquad: SquadPlayerItem[] = sliced.map((name, idx) => {
      const isC = name.toLowerCase().includes('(c)') || idx === 0;
      const isVC = name.toLowerCase().includes('(vc)') || idx === 1;
      const isWK = name.toLowerCase().includes('(wk)') || name.toLowerCase().includes('keeper');
      const cleanName = name.replace(/\s*\([CcVvWwKk/]+\)/g, '').trim();

      return {
        id: `bulk-${Date.now()}-${idx}`,
        name: cleanName,
        role: isWK ? 'wicketkeeper' : idx < 5 ? 'batsman' : idx < 8 ? 'allrounder' : 'bowler',
        isCaptain: isC,
        isViceCaptain: isVC,
        isWicketkeeper: isWK,
        jerseyNumber: `${idx + 1}`
      };
    });

    setSquad(newSquad);
    setShowBulkPaste(false);
    setBulkText('');
    setFeedbackMsg({
      text: `Successfully imported ${newSquad.length} player${newSquad.length > 1 ? 's' : ''}!`,
      type: 'success'
    });
  };

  // Sample 15-player squad loader (for quick testing/filling)
  const handleLoadSampleSquad = () => {
    const sampleNames = [
      'Rohit Sharma',
      'Shubman Gill',
      'Virat Kohli',
      'Shreyas Iyer',
      'KL Rahul',
      'Hardik Pandya',
      'Ravindra Jadeja',
      'Axar Patel',
      'Kuldeep Yadav',
      'Jasprit Bumrah',
      'Mohammed Siraj',
      'Surya Kumar Yadav',
      'Sanju Samson',
      'Arshdeep Singh',
      'Yuzvendra Chahal'
    ];

    const sampleSquad: SquadPlayerItem[] = sampleNames.map((name, idx) => ({
      id: `sample-${idx}`,
      name,
      role: idx === 4 || idx === 12 ? 'wicketkeeper' : idx < 4 ? 'batsman' : idx < 8 ? 'allrounder' : 'bowler',
      isCaptain: idx === 0,
      isViceCaptain: idx === 5,
      isWicketkeeper: idx === 4,
      jerseyNumber: `${idx + 1}`
    }));

    setSquad(sampleSquad);
    setCaptainName('Rohit Sharma');
    setFeedbackMsg({ text: 'Loaded 15-player sample squad template!', type: 'info' });
  };

  // Submit squad to Firestore
  const handleSubmitSquad = async () => {
    const validPlayers = squad.filter(p => p.name.trim().length > 0);

    if (!teamName.trim()) {
      setFeedbackMsg({ text: 'Please provide a Team Name.', type: 'error' });
      return;
    }

    if (validPlayers.length < 2) {
      setFeedbackMsg({ text: 'Please add at least 2 player names.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setFeedbackMsg(null);

    // Format player names array (e.g. "Virat Kohli (C)", "KL Rahul (WK)")
    const formattedPlayerNames = validPlayers.map(p => {
      let suffix = '';
      if (p.isCaptain) suffix += ' (C)';
      else if (p.isViceCaptain) suffix += ' (VC)';
      if (p.isWicketkeeper && !suffix.includes('(C)')) suffix += ' (WK)';
      return `${p.name.trim()}${suffix}`;
    });

    const activeTeamId = teamId || `team-${Date.now()}`;
    const payload: CricketTeamData = {
      id: activeTeamId,
      name: teamName.trim(),
      captainName: captainName.trim() || validPlayers.find(p => p.isCaptain)?.name || '',
      captainPhone: captainPhone.trim(),
      players: formattedPlayerNames,
      squadDetails: validPlayers,
      status: 'squad_submitted',
      createdAt: teamData?.createdAt || new Date().toISOString(),
      updatedAt: Date.now(),
      managerId: teamData?.managerId || 'default'
    };

    try {
      if (!isFirestoreQuotaExhausted()) {
        await setDoc(doc(db, 'cricket_teams', activeTeamId), payload, { merge: true });
      }
      // Always store locally as fallback
      localStorage.setItem(`cricket_team_${activeTeamId}`, JSON.stringify(payload));

      setSubmitted(true);
      setSubmitting(false);
      setFeedbackMsg({ text: '15-Player Squad submitted successfully to the Score Manager!', type: 'success' });
    } catch (err: any) {
      console.warn('Error saving captain squad:', err);
      // Local fallback
      localStorage.setItem(`cricket_team_${activeTeamId}`, JSON.stringify(payload));
      setSubmitted(true);
      setSubmitting(false);
      setFeedbackMsg({ text: 'Squad saved locally! Real-time sync will resume when online.', type: 'success' });
    }
  };

  // WhatsApp share link generator
  const getWhatsAppShareUrl = () => {
    const currentUrl = window.location.href;
    const text = encodeURIComponent(
      `🏏 *Gully Score Cricket Roster Update*\n` +
      `Team: *${teamName}*\n` +
      `Captain: ${captainName || 'Captain'}\n` +
      `Total Players: ${squad.filter(p => p.name.trim()).length} players ready!\n\n` +
      `Squad Link: ${currentUrl}`
    );
    return `https://api.whatsapp.com/send?text=${text}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const validCount = squad.filter(p => p.name.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500 selection:text-black py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <Link
            to="/live/cricket-scoreboard"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors no-underline"
          >
            <ArrowLeft size={16} />
            Back to Scoreboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-extrabold uppercase tracking-widest border border-emerald-500/20">
              <Sparkles size={12} className="text-amber-400" /> Captain Portal
            </span>
          </div>
        </div>

        {/* Header Hero Card */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span className="px-3.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <Users size={13} /> Official Match Squad Entry
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${
                  validCount >= 11
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {validCount >= 11 ? '✓ Playing XI Ready' : `${validCount} / 15 Players`}
                </span>
                {submitted && (
                  <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> Submitted
                  </span>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-2">
              {teamName || 'Submit Team Squad'}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
              Hey Captain! Enter your 11 to 15 player squad details below. Your roster will sync immediately into the official Gully Score live match scoreboard with one click.
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : feedbackMsg.type === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                className="text-slate-400 hover:text-white text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submitted Confirmation Banner */}
        {submitted && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-emerald-400">Squad Submitted & Ready!</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  The score manager can now load <span className="text-white font-bold">{teamName}</span> into the match scorecard in 1-click.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={getWhatsAppShareUrl()}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 no-underline transition-all shadow-lg"
              >
                <Share2 size={13} /> Share on WhatsApp
              </a>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                title="Edit squad again"
              >
                <Edit3 size={13} /> Edit
              </button>
            </div>
          </div>
        )}

        {/* Team Details Inputs Card */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-3xl p-6 mb-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
              <Shield size={14} /> Team & Captain Information
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">15-Player Cap</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                Team Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="E.g. Gully Gladiators"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <User size={11} /> Captain Name
              </label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="E.g. Rohit Sharma"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Phone size={11} /> Captain WhatsApp / Phone
              </label>
              <input
                type="text"
                value={captainPhone}
                onChange={(e) => setCaptainPhone(e.target.value)}
                placeholder="E.g. +91 9876543210"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* Squad Builder Roster Card */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-3xl p-6 mb-8 shadow-xl space-y-5">
          
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                15-Player Squad Roster ({squad.length} / 15)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Assign roles, Captain (C), Vice Captain (VC), and Wicketkeeper (WK).
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowBulkPaste(true)}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                title="Paste player list directly from WhatsApp"
              >
                📋 Paste from WhatsApp
              </button>
              
              <button
                type="button"
                onClick={handleLoadSampleSquad}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                title="Load sample 15 players"
              >
                ⚡ Sample 15
              </button>
            </div>
          </div>

          {/* Bulk Paste Modal */}
          <AnimatePresence>
            {showBulkPaste && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                    📋 Paste Squad from WhatsApp / Message
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(false)}
                    className="text-slate-400 hover:text-white text-xs border-none bg-transparent cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Paste up to 15 names separated by new lines, numbers (1. Player), or commas. We'll automatically extract clean names!
                </p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={5}
                  placeholder="1. Rohit Sharma (C)&#10;2. Shubman Gill&#10;3. Virat Kohli&#10;4. KL Rahul (WK)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkPaste(false)}
                    className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold uppercase cursor-pointer border-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyBulkPaste}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-none shadow-sm"
                  >
                    Import Players
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Player Rows Table */}
          <div className="space-y-2.5">
            {squad.map((player, idx) => (
              <div
                key={player.id || idx}
                className="p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
              >
                {/* Left: Slot & Name input */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1">
                  <span className="w-7 h-7 rounded-xl bg-slate-800 text-slate-400 font-mono text-[11px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleUpdatePlayer(idx, 'name', e.target.value)}
                    placeholder={`Player #${idx + 1} Full Name`}
                    className="flex-1 bg-slate-950 border border-slate-750 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-600 outline-none"
                  />
                </div>

                {/* Center: Role Select */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={player.role}
                    onChange={(e) => handleUpdatePlayer(idx, 'role', e.target.value)}
                    className="bg-slate-950 border border-slate-750 text-slate-300 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {DEFAULT_ROLES.map(r => (
                      <option key={r.key} value={r.key}>
                        {r.icon} {r.label}
                      </option>
                    ))}
                  </select>

                  {/* Jersey Number */}
                  <input
                    type="text"
                    value={player.jerseyNumber || ''}
                    onChange={(e) => handleUpdatePlayer(idx, 'jerseyNumber', e.target.value)}
                    placeholder="#"
                    title="Jersey Number"
                    className="w-10 bg-slate-950 border border-slate-750 text-center rounded-xl px-1 py-1.5 text-[10px] font-mono font-black text-amber-400 outline-none"
                  />

                  {/* Badges: Captain (C), Vice Captain (VC), Wicketkeeper (WK) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleUpdatePlayer(idx, 'isCaptain', !player.isCaptain)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all ${
                        player.isCaptain
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Captain"
                    >
                      (C)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePlayer(idx, 'isViceCaptain', !player.isViceCaptain)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all ${
                        player.isViceCaptain
                          ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Vice Captain"
                    >
                      (VC)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePlayer(idx, 'isWicketkeeper', !player.isWicketkeeper)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all ${
                        player.isWicketkeeper
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="Wicket Keeper"
                    >
                      (WK)
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 border-none bg-transparent cursor-pointer transition-colors"
                    title="Remove Player"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Slot Button (Max 15) */}
          {squad.length < 15 && (
            <button
              type="button"
              onClick={handleAddPlayer}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-slate-750 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus size={14} /> Add Player Slot ({squad.length} / 15)
            </button>
          )}

          {/* Submit CTA Card */}
          <div className="pt-4 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              {validCount < 11 ? (
                <span className="text-amber-400 flex items-center gap-1 font-bold">
                  <AlertCircle size={13} /> {11 - validCount} more player{11 - validCount > 1 ? 's' : ''} needed for a standard Playing XI (11 players).
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={13} /> {validCount} players verified! Ready to submit to Score Manager.
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitSquad}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 border-none"
            >
              {submitting ? (
                <>Saving Squad...</>
              ) : (
                <>
                  <Send size={14} /> Submit Squad to Score Manager
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Section for Captain or Scorekeeper */}
        <div className="p-5 bg-slate-850/60 border border-slate-800 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Share2 size={18} />
            </div>
            <div>
              <h4 className="font-black uppercase text-white">Share Squad Link</h4>
              <p className="text-slate-400 text-[11px]">Send this link to fellow players or captain to update the roster anytime.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              {copiedLink ? <ClipboardCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 no-underline transition-all"
            >
              <Share2 size={13} /> WhatsApp
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
