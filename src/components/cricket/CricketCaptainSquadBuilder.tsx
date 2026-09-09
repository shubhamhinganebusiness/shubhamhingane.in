import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Trophy,
  Shield,
  Trash2,
  Plus,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Phone,
  User,
  Info,
  AlertCircle,
  Camera,
  X,
  Edit3,
  Star,
  Hash,
  Upload,
  Check
} from 'lucide-react';
import { db, safeSetDoc } from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { sanitizeForFirestore } from './cricketStorage';
import { ConfettiCanvas } from './ConfettiCanvas';

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

// Lightweight client-side image compressor using HTML5 canvas
const compressImage = (file: File, maxDim = 240, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = Math.max(1, w);
        canvas.height = Math.max(1, h);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function CricketCaptainSquadBuilder() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const navigate = useNavigate();

  // Support both /cricket-team-invite/:teamId and /cricket-team-invite?teamId=...
  const teamId = params.teamId || searchParams.get('teamId') || '';

  const [team, setTeam] = useState<CricketTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [teamLogo, setTeamLogo] = useState<string>('');
  const [showLogoUrlModal, setShowLogoUrlModal] = useState(false);
  const [logoUrlInput, setLogoUrlInput] = useState('');

  // Squad roster state
  const [playersList, setPlayersList] = useState<CricketTeamPlayer[]>([]);

  // Add single player form state
  const [singlePlayerName, setSinglePlayerName] = useState('');
  const [singlePlayerRole, setSinglePlayerRole] = useState<'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper'>('All-Rounder');
  const [singlePlayerJersey, setSinglePlayerJersey] = useState('');
  const [singlePlayerMobile, setSinglePlayerMobile] = useState('');
  const [singlePlayerPhoto, setSinglePlayerPhoto] = useState<string>('');
  const [singlePlayerIsVC, setSinglePlayerIsVC] = useState(false);

  // Edit player modal state
  const [editingPlayerIndex, setEditingPlayerIndex] = useState<number | null>(null);
  const [editPlayerName, setEditPlayerName] = useState('');
  const [editPlayerRole, setEditPlayerRole] = useState<'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper'>('All-Rounder');
  const [editPlayerJersey, setEditPlayerJersey] = useState('');
  const [editPlayerMobile, setEditPlayerMobile] = useState('');
  const [editPlayerPhoto, setEditPlayerPhoto] = useState('');
  const [editPlayerIsVC, setEditPlayerIsVC] = useState(false);
  const [editPlayerIsCaptain, setEditPlayerIsCaptain] = useState(false);

  // General state
  const [isSaving, setIsSaving] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: 'success' | 'info' | 'alert' } | null>(null);

  // File input refs
  const teamLogoInputRef = useRef<HTMLInputElement>(null);
  const playerPhotoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const quickCardPhotoInputRef = useRef<HTMLInputElement>(null);
  const [quickPhotoTargetIndex, setQuickPhotoTargetIndex] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'info' | 'alert' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Real-time listener on team document
  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const teamDocRef = doc(db, 'cricket_teams', teamId);
    const unsub = onSnapshot(
      teamDocRef,
      (snap) => {
        setLoading(false);
        if (snap.exists()) {
          const data = snap.data() as CricketTeam;
          setTeam(data);
          setTeamName(data.name || '');
          const cName = (data.captainName || '').trim();
          setCaptainName(cName);
          setCaptainPhone(data.captainPhone || '');
          setTeamLogo(data.logo || data.teamLogo || '');

          // Populate players list
          let list: CricketTeamPlayer[] = [];
          if (data.playerDetails && data.playerDetails.length > 0) {
            list = [...data.playerDetails];
          } else if (data.players && data.players.length > 0) {
            list = data.players.map((pName, idx) => ({
              id: `player-${idx + 1}-${Date.now()}`,
              name: pName,
              role: idx === 0 ? 'Batter' : idx === 1 ? 'All-Rounder' : idx > 8 ? 'Bowler' : 'Batter',
              isCaptain: idx === 0,
              isViceCaptain: idx === 1
            }));
          }

          // AUTOMATICALLY ADD CAPTAIN NAME IN SQUAD:
          if (cName) {
            const existingIdx = list.findIndex(
              (p) => p.name.trim().toLowerCase() === cName.toLowerCase()
            );
            if (existingIdx >= 0) {
              // Existing player matches captain name: ensure marked as Captain and not Vice Captain
              list = list.map((p, idx) => ({
                ...p,
                isCaptain: idx === existingIdx,
                isViceCaptain: idx === existingIdx ? false : p.isViceCaptain
              }));
            } else {
              // Captain not present in list: automatically prepend captain player
              const capPlayer: CricketTeamPlayer = {
                id: `cap-${Date.now()}`,
                name: cName,
                role: 'Batter',
                isCaptain: true,
                isViceCaptain: false,
                mobileNumber: data.captainPhone || undefined
              };
              list = [capPlayer, ...list.map((p) => ({ ...p, isCaptain: false }))].slice(0, 15);
            }
          }

          setPlayersList(list);
        } else {
          setTeam(null);
        }
      },
      (err) => {
        console.warn('Failed to load team:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [teamId]);

  // Sync Captain Name when typed in input field
  const handleCaptainNameChange = (val: string) => {
    setCaptainName(val);
    const trimmed = val.trim();
    if (!trimmed) return;

    setPlayersList((prev) => {
      const capIdx = prev.findIndex((p) => p.isCaptain);
      if (capIdx >= 0) {
        return prev.map((p, idx) => (idx === capIdx ? { ...p, name: trimmed } : p));
      }
      if (prev.length < 15) {
        return [
          {
            id: `cap-${Date.now()}`,
            name: trimmed,
            role: 'Batter',
            isCaptain: true,
            isViceCaptain: false,
            mobileNumber: captainPhone.trim() || undefined
          },
          ...prev
        ];
      }
      return prev;
    });
  };

  // Team Logo file upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 256, 0.85);
      setTeamLogo(compressed);
      showToast('Team logo uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to upload logo', 'alert');
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setTeamLogo('');
    showToast('Team logo removed', 'info');
  };

  // Player Photo file upload for Add form
  const handlePlayerPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 160, 0.85);
      setSinglePlayerPhoto(compressed);
      showToast('Player photo attached!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to attach photo', 'alert');
    }
    if (e.target) e.target.value = '';
  };

  // Quick photo upload directly from player card
  const handleQuickPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || quickPhotoTargetIndex === null) return;
    try {
      const compressed = await compressImage(file, 160, 0.85);
      setPlayersList((prev) =>
        prev.map((p, i) => (i === quickPhotoTargetIndex ? { ...p, photo: compressed } : p))
      );
      showToast(`Updated photo for ${playersList[quickPhotoTargetIndex]?.name}!`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update photo', 'alert');
    }
    setQuickPhotoTargetIndex(null);
    if (e.target) e.target.value = '';
  };

  // Handle adding single player
  const handleAddPlayer = () => {
    const trimmed = singlePlayerName.trim();
    if (!trimmed) {
      showToast('Please type a player name', 'alert');
      return;
    }

    if (playersList.length >= 15) {
      showToast('Squad limit reached! Maximum 15 players allowed.', 'alert');
      return;
    }

    if (playersList.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`${trimmed} is already in the squad list!`, 'alert');
      return;
    }

    // If making this new player Vice Captain, unset VC on any existing player
    let updatedExisting = playersList;
    if (singlePlayerIsVC) {
      updatedExisting = playersList.map((p) => ({ ...p, isViceCaptain: false }));
    }

    const newPlayer: CricketTeamPlayer = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      role: singlePlayerRole,
      isCaptain: false,
      isViceCaptain: singlePlayerIsVC,
      jerseyNumber: singlePlayerJersey.trim() ? singlePlayerJersey.trim().replace(/^#/, '') : undefined,
      mobileNumber: singlePlayerMobile.trim() || undefined,
      photo: singlePlayerPhoto || undefined
    };

    setPlayersList([...updatedExisting, newPlayer]);
    setSinglePlayerName('');
    setSinglePlayerJersey('');
    setSinglePlayerMobile('');
    setSinglePlayerPhoto('');
    setSinglePlayerIsVC(false);

    showToast(`Added ${trimmed} to squad (${updatedExisting.length + 1}/15)`, 'success');
  };

  // Remove player
  const handleRemovePlayer = (idx: number) => {
    const p = playersList[idx];
    if (p.isCaptain) {
      if (!confirm(`Remove Captain "${p.name}" from the squad? You will need to designate a new Captain.`)) {
        return;
      }
    }
    setPlayersList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Toggle Vice-Captain (VC) - only one player can be Vice Captain
  const handleToggleViceCaptain = (idx: number) => {
    setPlayersList((prev) => {
      const target = prev[idx];
      const willBeVC = !target.isViceCaptain;

      if (willBeVC) {
        showToast(`✓ ${target.name} designated as Vice-Captain (VC)!`, 'success');
      }

      return prev.map((p, i) => {
        if (i === idx) {
          return {
            ...p,
            isViceCaptain: willBeVC,
            // If made VC, unset captain to prevent holding both
            isCaptain: willBeVC ? false : p.isCaptain
          };
        }
        // Unset vice-captain for all other players
        return {
          ...p,
          isViceCaptain: willBeVC ? false : p.isViceCaptain
        };
      });
    });
  };

  // Toggle Captain (C)
  const handleToggleCaptain = (idx: number) => {
    setPlayersList((prev) => {
      const target = prev[idx];
      const willBeCaptain = !target.isCaptain;

      if (willBeCaptain) {
        setCaptainName(target.name);
        showToast(`✓ ${target.name} designated as Team Captain (C)!`, 'success');
      }

      return prev.map((p, i) => {
        if (i === idx) {
          return {
            ...p,
            isCaptain: willBeCaptain,
            // If made captain, unset vice-captain
            isViceCaptain: willBeCaptain ? false : p.isViceCaptain
          };
        }
        // Unset captain for all other players
        return {
          ...p,
          isCaptain: willBeCaptain ? false : p.isCaptain
        };
      });
    });
  };

  // Change role
  const handleRoleChange = (idx: number, role: 'Batter' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper') => {
    setPlayersList((prev) => prev.map((p, i) => (i === idx ? { ...p, role } : p)));
  };

  // Open Edit Player Modal
  const handleOpenEditPlayer = (idx: number) => {
    const p = playersList[idx];
    setEditingPlayerIndex(idx);
    setEditPlayerName(p.name);
    setEditPlayerRole(p.role || 'All-Rounder');
    setEditPlayerJersey(p.jerseyNumber ? String(p.jerseyNumber) : '');
    setEditPlayerMobile(p.mobileNumber || '');
    setEditPlayerPhoto(p.photo || '');
    setEditPlayerIsVC(!!p.isViceCaptain);
    setEditPlayerIsCaptain(!!p.isCaptain);
  };

  // Save Edit Player
  const handleSaveEditPlayer = () => {
    if (editingPlayerIndex === null) return;
    const trimmedName = editPlayerName.trim();
    if (!trimmedName) {
      showToast('Player name cannot be empty', 'alert');
      return;
    }

    setPlayersList((prev) => {
      return prev.map((p, idx) => {
        if (idx === editingPlayerIndex) {
          return {
            ...p,
            name: trimmedName,
            role: editPlayerRole,
            jerseyNumber: editPlayerJersey.trim() ? editPlayerJersey.trim().replace(/^#/, '') : undefined,
            mobileNumber: editPlayerMobile.trim() || undefined,
            photo: editPlayerPhoto || undefined,
            isCaptain: editPlayerIsCaptain,
            isViceCaptain: editPlayerIsVC && !editPlayerIsCaptain
          };
        }
        return {
          ...p,
          isCaptain: editPlayerIsCaptain ? false : p.isCaptain,
          isViceCaptain: editPlayerIsVC ? false : p.isViceCaptain
        };
      });
    });

    if (editPlayerIsCaptain) {
      setCaptainName(trimmedName);
    }

    showToast(`Updated ${trimmedName}'s details`, 'success');
    setEditingPlayerIndex(null);
  };

  // Submit squad to Firestore
  const handleSubmitSquad = async () => {
    if (!teamId) {
      showToast('Invalid team reference', 'alert');
      return;
    }

    if (!teamName.trim()) {
      showToast('Please specify team name', 'alert');
      return;
    }

    if (playersList.length < 5) {
      showToast('Please add at least 5 players to submit squad', 'alert');
      return;
    }

    try {
      setIsSaving(true);
      const cleanPlayers = playersList.map((p) => p.name.trim()).filter(Boolean);

      const updatedTeamData: CricketTeam = {
        id: teamId,
        name: teamName.trim(),
        shortName: team?.shortName || teamName.trim().substring(0, 3).toUpperCase(),
        captainName: captainName.trim() || undefined,
        captainPhone: captainPhone.trim() || undefined,
        logo: teamLogo.trim() || undefined,
        teamLogo: teamLogo.trim() || undefined,
        players: cleanPlayers,
        playerDetails: playersList,
        createdAt: team?.createdAt || new Date().toISOString(),
        updatedAt: Date.now(),
        managerId: team?.managerId,
        status: cleanPlayers.length >= 11 ? 'ready' : 'squad_submitted'
      };

      await safeSetDoc(doc(db, 'cricket_teams', teamId), sanitizeForFirestore(updatedTeamData), { merge: true });
      setTeam(updatedTeamData);
      setIsSaving(false);
      setSubmittedSuccess(true);
      showToast('Squad submitted successfully! Score Manager will see this in match setup.', 'success');
    } catch (err) {
      console.error('Failed to submit squad:', err);
      setIsSaving(false);
      showToast('Failed to save squad. Please check network connection.', 'alert');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      <ConfettiCanvas active={submittedSuccess} />

      {/* Hidden file inputs */}
      <input
        ref={teamLogoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />
      <input
        ref={playerPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePlayerPhotoSelect}
        className="hidden"
      />
      <input
        ref={quickCardPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={handleQuickPhotoChange}
        className="hidden"
      />
      <input
        ref={editPhotoInputRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const compressed = await compressImage(file, 160, 0.85);
            setEditPlayerPhoto(compressed);
          } catch (err: any) {
            showToast(err?.message || 'Failed to compress photo', 'alert');
          }
          if (e.target) e.target.value = '';
        }}
        className="hidden"
      />

      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Floating Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-black uppercase tracking-wider flex items-center gap-2.5 border ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                : notification.type === 'alert'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                : 'bg-slate-900/90 text-slate-200 border-slate-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={16} className="text-emerald-400" />
            ) : notification.type === 'alert' ? (
              <AlertCircle size={16} className="text-rose-400" />
            ) : (
              <Info size={16} className="text-blue-400" />
            )}
            <span>{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Trophy size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
                  Gully Cricket Suite
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-300 uppercase">
                  Captain Portal
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                15-Player Squad Submission
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate('/live/cricket-scoreboard')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-800 flex items-center gap-1.5 cursor-pointer"
            title="Open Live Scoreboard"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Scoreboard</span>
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw size={32} className="mx-auto text-emerald-500 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Connecting to Team Registry...
            </p>
          </div>
        ) : !teamId ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <AlertCircle size={36} className="mx-auto text-amber-400" />
            <h2 className="text-lg font-black uppercase text-white">No Team ID Specified</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
              Please open this page using the invitation link provided by your Score Manager or Tournament Organizer.
            </p>
            <button
              onClick={() => navigate('/live/cricket-scoreboard')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer border-none"
            >
              Go to Scoreboard Setup
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Team Identity Card with Team Logo */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                {/* Logo & Team Name block */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Team Logo Container */}
                  <div className="relative group shrink-0">
                    {teamLogo ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-950 shadow-lg relative flex items-center justify-center">
                        <img
                          src={teamLogo}
                          alt="Team Logo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => teamLogoInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-black uppercase text-white transition-opacity cursor-pointer border-none"
                          title="Change Team Logo"
                        >
                          <Camera size={16} />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                          title="Remove Logo"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => teamLogoInputRef.current?.click()}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer group"
                        title="Upload Team Logo"
                      >
                        <Shield size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-center leading-tight">
                          + Logo
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                        Official Team Name
                      </span>
                      {!teamLogo && (
                        <button
                          type="button"
                          onClick={() => setShowLogoUrlModal(true)}
                          className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 underline bg-transparent border-none cursor-pointer p-0"
                        >
                          Or enter Logo URL
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter Team Name (e.g. Shivaji Park Warriors)"
                      className="text-xl sm:text-2xl font-black bg-slate-950/60 border border-slate-700/80 rounded-xl px-3.5 py-2 text-white w-full focus:ring-2 focus:ring-emerald-500/40 outline-none"
                    />
                  </div>
                </div>

                {/* Squad Count Badge */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div
                    className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2.5 ${
                      playersList.length === 15
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : playersList.length >= 11
                        ? 'bg-teal-500/15 border-teal-500/30 text-teal-300'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <Users size={18} />
                    <div className="text-left">
                      <div className="text-xs font-black uppercase tracking-wider">
                        {playersList.length} / 15 Players
                      </div>
                      <div className="text-[9px] font-bold opacity-80">
                        {playersList.length >= 11 ? 'Playing XI Ready ✓' : 'Add at least 11'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo URL Input Modal */}
              <AnimatePresence>
                {showLogoUrlModal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-2"
                  >
                    <input
                      type="url"
                      value={logoUrlInput}
                      onChange={(e) => setLogoUrlInput(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (logoUrlInput.trim()) {
                          setTeamLogo(logoUrlInput.trim());
                          setLogoUrlInput('');
                          setShowLogoUrlModal(false);
                          showToast('Logo URL applied!', 'success');
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl border-none cursor-pointer"
                    >
                      Set Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowLogoUrlModal(false)}
                      className="p-1.5 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Captain & Contact info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <User size={12} className="text-emerald-400" />
                    Team Captain Name (Auto-added to squad)
                  </label>
                  <input
                    type="text"
                    value={captainName}
                    onChange={(e) => handleCaptainNameChange(e.target.value)}
                    placeholder="Captain's Name (e.g. Rohit)"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <Phone size={12} className="text-emerald-400" />
                    Captain WhatsApp / Mobile
                  </label>
                  <input
                    type="tel"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    placeholder="For Match Updates (e.g. +91 98765 43210)"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Squad Builder Section */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Users size={18} className="text-emerald-400" />
                    Squad Roster (Up to 15 Players)
                  </h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Captain is automatically in the squad. Designate one player as Vice-Captain (VC) and customize photos, jersey #, and mobile numbers.
                  </p>
                </div>

                {playersList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Clear all ${playersList.length} players from squad?`)) {
                        setPlayersList([]);
                        showToast('Squad cleared', 'info');
                      }
                    }}
                    className="px-2.5 py-1.5 text-slate-500 hover:text-rose-400 text-xs font-bold uppercase transition-all bg-transparent border-none cursor-pointer self-end sm:self-auto"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Add Single Player Input Bar with Photo, Jersey, Mobile & VC options */}
              {playersList.length < 15 && (
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <UserPlus size={14} />
                    <span>Add Player #{playersList.length + 1} to Squad</span>
                  </div>

                  {/* Primary Row: Photo Button + Name + Role */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Photo Uploader thumbnail */}
                    <div className="flex items-center gap-2">
                      {singlePlayerPhoto ? (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/50 bg-slate-900 shrink-0">
                          <img src={singlePlayerPhoto} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setSinglePlayerPhoto('')}
                            className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center border-none cursor-pointer"
                            title="Remove photo"
                          >
                            <X size={9} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => playerPhotoInputRef.current?.click()}
                          className="h-10 px-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900 text-slate-400 hover:text-emerald-300 flex items-center gap-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer"
                          title="Add Player Photo (optional)"
                        >
                          <Camera size={14} />
                          <span className="hidden sm:inline text-[11px]">+ Photo</span>
                        </button>
                      )}
                    </div>

                    {/* Name Input */}
                    <input
                      type="text"
                      value={singlePlayerName}
                      onChange={(e) => setSinglePlayerName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPlayer();
                        }
                      }}
                      placeholder="Player Full Name (required)..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 placeholder:text-slate-500"
                    />

                    {/* Role Dropdown */}
                    <select
                      value={singlePlayerRole}
                      onChange={(e) => setSinglePlayerRole(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="Batter">🏏 Batter</option>
                      <option value="Bowler">⚾ Bowler</option>
                      <option value="All-Rounder">⚡ All-Rounder</option>
                      <option value="Wicket Keeper">🧤 Keeper</option>
                    </select>
                  </div>

                  {/* Secondary Row: Optional Jersey Number, Optional Mobile Number, and Vice Captain Option */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-slate-850">
                    {/* Jersey # */}
                    <div className="flex items-center gap-1.5 flex-1 sm:max-w-[130px]">
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <Hash size={12} />
                      </div>
                      <input
                        type="text"
                        value={singlePlayerJersey}
                        onChange={(e) => setSinglePlayerJersey(e.target.value)}
                        placeholder="Jersey # (opt)"
                        maxLength={3}
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-300 placeholder:text-slate-500 outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Mobile # */}
                    <div className="flex items-center gap-1.5 flex-1 sm:max-w-[190px]">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <Phone size={12} />
                      </div>
                      <input
                        type="tel"
                        value={singlePlayerMobile}
                        onChange={(e) => setSinglePlayerMobile(e.target.value)}
                        placeholder="Mobile No. (opt)"
                        className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* Vice Captain Toggle Option */}
                    <button
                      type="button"
                      onClick={() => setSinglePlayerIsVC(!singlePlayerIsVC)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-all ${
                        singlePlayerIsVC
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-750'
                      }`}
                      title="Make this player Vice Captain"
                    >
                      <Star size={12} className={singlePlayerIsVC ? 'text-amber-300 fill-amber-300' : ''} />
                      <span>{singlePlayerIsVC ? 'Vice-Captain ✓' : 'Make Vice-Captain'}</span>
                    </button>

                    {/* Add Player Submit Button */}
                    <button
                      type="button"
                      onClick={handleAddPlayer}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 sm:ml-auto active:scale-95 shadow-md shadow-emerald-600/20"
                    >
                      <Plus size={15} />
                      <span>Add to Squad</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Squad List (Numbered 1 to 15) */}
              {playersList.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl space-y-2">
                  <UserPlus size={32} className="mx-auto text-slate-600" />
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                    No players in squad roster yet
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Type a player name above to add to your squad roster. Captain name is automatically included!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                  {playersList.map((player, idx) => (
                    <motion.div
                      key={player.id || idx}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        player.isCaptain
                          ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : player.isViceCaptain
                          ? 'bg-indigo-950/30 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Number + Photo Avatar + Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Player Number badge */}
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            player.isCaptain
                              ? 'bg-emerald-500 text-slate-950'
                              : player.isViceCaptain
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>

                        {/* Player Photo Avatar */}
                        <div
                          className="relative group shrink-0 cursor-pointer"
                          onClick={() => {
                            setQuickPhotoTargetIndex(idx);
                            quickCardPhotoInputRef.current?.click();
                          }}
                          title="Click to upload/change photo"
                        >
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-700 group-hover:border-emerald-500 transition-colors"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-emerald-500/50 flex items-center justify-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                              <Camera size={14} />
                            </div>
                          )}
                        </div>

                        {/* Player Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-white truncate">
                              {player.name}
                            </span>

                            {/* Jersey Number Tag */}
                            {player.jerseyNumber && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[9px] font-black">
                                #{player.jerseyNumber}
                              </span>
                            )}

                            {/* Captain Badge */}
                            {player.isCaptain && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Trophy size={10} />
                                (C) Captain
                              </span>
                            )}

                            {/* Vice-Captain Badge */}
                            {player.isViceCaptain && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                <Star size={10} className="text-amber-300 fill-amber-300" />
                                (VC) Vice-Captain
                              </span>
                            )}
                          </div>

                          {/* Secondary info line: Role and Mobile */}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-medium text-slate-300">
                              {player.role || 'All-Rounder'}
                            </span>
                            {player.mobileNumber && (
                              <span className="flex items-center gap-1 text-slate-400 font-mono">
                                <Phone size={9} className="text-emerald-400" />
                                {player.mobileNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Role, Vice-Captain, Captain, Edit & Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Quick Role Selector */}
                        <select
                          value={player.role || 'All-Rounder'}
                          onChange={(e) => handleRoleChange(idx, e.target.value as any)}
                          className="hidden sm:block bg-slate-900 border border-slate-750 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-300 outline-none cursor-pointer"
                        >
                          <option value="Batter">🏏 Batter</option>
                          <option value="Bowler">⚾ Bowler</option>
                          <option value="All-Rounder">⚡ All-Rounder</option>
                          <option value="Wicket Keeper">🧤 Keeper</option>
                        </select>

                        {/* (VC) Vice-Captain Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleViceCaptain(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border flex items-center gap-1 ${
                            player.isViceCaptain
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-indigo-300 border-slate-800'
                          }`}
                          title="Assign as Team Vice-Captain"
                        >
                          <Star size={10} className={player.isViceCaptain ? 'text-amber-300 fill-amber-300' : ''} />
                          <span>(VC)</span>
                        </button>

                        {/* (C) Captain Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleCaptain(idx)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer border ${
                            player.isCaptain
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 border-slate-800'
                          }`}
                          title="Assign as Team Captain"
                        >
                          (C)
                        </button>

                        {/* Edit Player Details Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditPlayer(idx)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center cursor-pointer transition-all"
                          title="Edit Player Details"
                        >
                          <Edit3 size={12} />
                        </button>

                        {/* Delete player button */}
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(idx)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 flex items-center justify-center cursor-pointer transition-all"
                          title="Remove player"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Submit Squad Button */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <button
                  type="button"
                  onClick={handleSubmitSquad}
                  disabled={isSaving || playersList.length === 0}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none active:scale-[0.99]"
                >
                  {isSaving ? (
                    <RefreshCw size={18} className="animate-spin text-slate-950" />
                  ) : (
                    <CheckCircle2 size={18} className="text-slate-950" />
                  )}
                  <span>
                    {isSaving
                      ? 'Submitting Squad to Score Manager...'
                      : submittedSuccess
                      ? '✓ Squad Submitted (Click to Update Again)'
                      : `Submit ${playersList.length}-Player Squad to Score Manager`}
                  </span>
                </button>

                {submittedSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold space-y-1">
                    <p className="flex items-center justify-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-400" />
                      Squad of {playersList.length} players is saved and ready for the match!
                    </p>
                    <p className="text-[10px] text-emerald-400/80 font-normal">
                      The scorekeeper can now select "{teamName}" with 1-click in the live scorecard setup.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Player Modal */}
      <AnimatePresence>
        {editingPlayerIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-emerald-400" />
                  Edit Player #{editingPlayerIndex + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPlayerIndex(null)}
                  className="p-1 text-slate-400 hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Photo uploader inside modal */}
              <div className="flex items-center gap-3">
                {editPlayerPhoto ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-emerald-500/50 bg-slate-950">
                    <img src={editPlayerPhoto} alt="Player" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditPlayerPhoto('')}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center border-none cursor-pointer"
                      title="Remove photo"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center text-slate-500">
                    <User size={24} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => editPhotoInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera size={13} />
                  <span>{editPlayerPhoto ? 'Change Photo' : 'Upload Photo'}</span>
                </button>
              </div>

              {/* Name input */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Player Full Name
                </label>
                <input
                  type="text"
                  value={editPlayerName}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Role Dropdown */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Playing Role
                </label>
                <select
                  value={editPlayerRole}
                  onChange={(e) => setEditPlayerRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none cursor-pointer"
                >
                  <option value="Batter">🏏 Batter</option>
                  <option value="Bowler">⚾ Bowler</option>
                  <option value="All-Rounder">⚡ All-Rounder</option>
                  <option value="Wicket Keeper">🧤 Wicket Keeper</option>
                </select>
              </div>

              {/* Jersey & Mobile inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <Hash size={11} className="text-amber-400" />
                    Jersey # (optional)
                  </label>
                  <input
                    type="text"
                    value={editPlayerJersey}
                    onChange={(e) => setEditPlayerJersey(e.target.value)}
                    placeholder="e.g. 18"
                    maxLength={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                    <Phone size={11} className="text-emerald-400" />
                    Mobile No. (optional)
                  </label>
                  <input
                    type="tel"
                    value={editPlayerMobile}
                    onChange={(e) => setEditPlayerMobile(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Roles: Captain and Vice Captain toggles */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditPlayerIsCaptain(!editPlayerIsCaptain);
                    if (!editPlayerIsCaptain) setEditPlayerIsVC(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    editPlayerIsCaptain
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Trophy size={13} />
                  <span>{editPlayerIsCaptain ? 'Captain (C) ✓' : 'Set as Captain'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditPlayerIsVC(!editPlayerIsVC);
                    if (!editPlayerIsVC) setEditPlayerIsCaptain(false);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    editPlayerIsVC
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  <Star size={13} className={editPlayerIsVC ? 'text-amber-300 fill-amber-300' : ''} />
                  <span>{editPlayerIsVC ? 'Vice-Capt (VC) ✓' : 'Set Vice-Capt'}</span>
                </button>
              </div>

              {/* Save / Cancel buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPlayerIndex(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditPlayer}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl border-none cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
