import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Sparkles,
  Award,
  AlertCircle,
  Phone,
  User,
  ArrowLeft,
  Edit3,
  Camera,
  ImagePlus,
  Crown,
  Shirt,
  X,
  Upload,
  Copy,
  Check,
  ClipboardPaste,
  Trophy,
  MapPin,
  RefreshCw,
  FileText
} from 'lucide-react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, isFirestoreQuotaExhausted, safeSetDoc as setDoc, syncOneHalfTournamentToRealtimeDB } from '../../lib/firebase';
import { uploadImageToStorage, STORAGE_FOLDERS } from '../../utils/imageUpload';

export interface SquadPlayerItem {
  id: string;
  name: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketkeeper: boolean;
  jerseyNumber?: string;
  mobileNumber?: string;
  photo?: string;
}

export interface CricketTeamData {
  id: string;
  name: string;
  shortName?: string;
  logo?: string;
  captainName?: string;
  captainPhone?: string;
  players: string[];
  squadDetails?: SquadPlayerItem[];
  status?: 'pending_squad' | 'squad_submitted' | 'ready';
  createdAt: string;
  updatedAt?: number;
  managerId?: string;
  tournamentId?: string;
  group?: number;
}

const DEFAULT_ROLES: Array<{ key: SquadPlayerItem['role']; label: string; icon: string }> = [
  { key: 'batsman', label: 'Batsman', icon: '🏏' },
  { key: 'bowler', label: 'Bowler', icon: '🎯' },
  { key: 'allrounder', label: 'All-Rounder', icon: '⚡' },
  { key: 'wicketkeeper', label: 'Wicketkeeper', icon: '🧤' },
];

// Helper to compress image files client-side to lightweight JPEG data URLs (~15-30KB)
const compressImageFile = (file: File, maxDim = 320, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const CaptainSquadSubmission: React.FC = () => {
  const params = useParams<{ teamId?: string }>();
  const [searchParams] = useSearchParams();
  const teamId = params.teamId || searchParams.get('teamId') || searchParams.get('team_id') || '';
  const tourId = searchParams.get('tourId') || searchParams.get('tour_id') || 'one_half_active_championship';

  const [, setLoading] = useState<boolean>(true);
  const [teamData, setTeamData] = useState<CricketTeamData | null>(null);
  const [teamName, setTeamName] = useState<string>('');
  const [teamLogo, setTeamLogo] = useState<string>('');
  const [captainName, setCaptainName] = useState<string>('');
  const [captainPhone, setCaptainPhone] = useState<string>('');
  const [squad, setSquad] = useState<SquadPlayerItem[]>([]);
  const [tournamentInfo, setTournamentInfo] = useState<{ id: string; name: string; groundName?: string; group?: number } | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // WhatsApp bulk paste modal
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pasteText, setPasteText] = useState<string>('');
  const [copiedSquad, setCopiedSquad] = useState<boolean>(false);

  // Logo file input ref
  const teamLogoInputRef = useRef<HTMLInputElement>(null);

  // Initialize 15 empty slots (Playing 11 + 4 Substitutes)
  const initEmptySquad = (count = 15, initialCaptain = ''): SquadPlayerItem[] => {
    return Array.from({ length: count }, (_, idx) => ({
      id: `player-${Date.now()}-${idx}`,
      name: idx === 0 ? initialCaptain : '',
      role: idx === 2 ? 'wicketkeeper' : idx < 5 ? 'batsman' : idx < 9 ? 'allrounder' : 'bowler',
      isCaptain: idx === 0,
      isViceCaptain: idx === 1,
      isWicketkeeper: idx === 2,
      jerseyNumber: `${idx + 1}`,
      mobileNumber: '',
      photo: ''
    }));
  };

  // Helper to load One Half Tournament context from local storage or cloud
  const getTourTeamFallback = (tId: string) => {
    try {
      const raw = localStorage.getItem('one_half_active_championship_tournament');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.teams)) {
          const found = parsed.teams.find((t: any) => t.id === tId || t.name?.toLowerCase() === tId?.toLowerCase());
          if (found) {
            setTournamentInfo({
              id: parsed.id || tourId,
              name: parsed.name || 'ONE HALF CHAMPIONSHIP',
              groundName: parsed.groundName,
              group: found.group
            });
            return found;
          }
        }
      }
    } catch (_) {}
    return null;
  };

  // Load team data from Firestore, One Half Tournament cache, or local fallback
  useEffect(() => {
    if (!teamId) {
      // Manual team entry mode
      setTeamName('My Cricket Team');
      setSquad(initEmptySquad(15));
      setLoading(false);
      return;
    }

    setLoading(true);
    const tourFallback = getTourTeamFallback(teamId);

    const docRef = doc(db, 'cricket_teams', teamId);

    const unsub = onSnapshot(docRef, (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as CricketTeamData;
        setTeamData(data);
        setTeamName(data.name || tourFallback?.name || 'Cricket Team');
        setTeamLogo(data.logo || tourFallback?.logo || '');
        const loadedCaptainName = data.captainName || tourFallback?.captain || '';
        setCaptainName(loadedCaptainName);
        setCaptainPhone(data.captainPhone || tourFallback?.captainPhone || '');

        if (tourFallback?.group || data.group) {
          setTournamentInfo(prev => ({
            id: prev?.id || tourId,
            name: prev?.name || 'ONE HALF CHAMPIONSHIP',
            groundName: prev?.groundName,
            group: data.group || tourFallback?.group || prev?.group
          }));
        }

        if (data.squadDetails && data.squadDetails.length > 0) {
          let currentSquad = [...data.squadDetails];
          if (currentSquad.length < 15) {
            const extra = initEmptySquad(15 - currentSquad.length).map((p, i) => ({
              ...p,
              id: `player-extra-${Date.now()}-${i}`,
              jerseyNumber: `${currentSquad.length + i + 1}`
            }));
            currentSquad = [...currentSquad, ...extra];
          }
          setSquad(currentSquad);
        } else if (data.players && data.players.length > 0) {
          const converted: SquadPlayerItem[] = data.players.map((name, idx) => {
            const cleanName = name.replace(/\s*\([CcVvWwKk/]+\)/g, '').trim();
            const isC = name.toLowerCase().includes('(c)') || idx === 0;
            const isVC = name.toLowerCase().includes('(vc)') || idx === 1;
            const isWK = name.toLowerCase().includes('(wk)') || name.toLowerCase().includes('keeper') || idx === 2;
            return {
              id: `p-${idx}`,
              name: (isC && !cleanName && loadedCaptainName) ? loadedCaptainName : cleanName,
              role: isWK ? 'wicketkeeper' : idx < 5 ? 'batsman' : idx < 9 ? 'allrounder' : 'bowler',
              isCaptain: isC,
              isViceCaptain: isVC,
              isWicketkeeper: isWK,
              jerseyNumber: `${idx + 1}`,
              mobileNumber: isC ? (data.captainPhone || '') : '',
              photo: ''
            };
          });
          if (converted.length < 15) {
            const extra = initEmptySquad(15 - converted.length).map((p, i) => ({
              ...p,
              id: `player-extra-${Date.now()}-${i}`,
              jerseyNumber: `${converted.length + i + 1}`
            }));
            setSquad([...converted, ...extra]);
          } else {
            setSquad(converted);
          }
        } else if (tourFallback && tourFallback.squad && tourFallback.squad.length > 0) {
          setSquad(tourFallback.squad.map((p: any, idx: number) => ({
            id: p.id || `p-${idx}`,
            name: p.name || '',
            role: (p.role?.toLowerCase().replace(/[^a-z]/g, '') as any) || (idx === 2 ? 'wicketkeeper' : idx < 5 ? 'batsman' : idx < 9 ? 'allrounder' : 'bowler'),
            isCaptain: Boolean(p.isCaptain || (idx === 0 && !tourFallback.squad.some((s: any) => s.isCaptain))),
            isViceCaptain: Boolean(p.isViceCaptain || idx === 1),
            isWicketkeeper: Boolean(p.isWicketKeeper || p.role?.toLowerCase().includes('keeper') || idx === 2),
            jerseyNumber: `${p.jerseyNumber || idx + 1}`,
            mobileNumber: p.mobileNumber || p.phone || (p.isCaptain ? tourFallback.captainPhone : ''),
            photo: p.photo || ''
          })));
        } else {
          setSquad(initEmptySquad(15, loadedCaptainName));
        }

        if (data.status === 'squad_submitted') {
          setSubmitted(true);
        }
      } else {
        // Document not yet created in cricket_teams: check One Half Tournament fallback
        if (tourFallback) {
          setTeamName(tourFallback.name || 'Cricket Team');
          setTeamLogo(tourFallback.logo || '');
          setCaptainName(tourFallback.captain || '');
          setCaptainPhone(tourFallback.captainPhone || '');
          if (tourFallback.squad && tourFallback.squad.length > 0) {
            setSquad(tourFallback.squad.map((p: any, idx: number) => ({
              id: p.id || `p-${idx}`,
              name: p.name || '',
              role: (p.role?.toLowerCase().replace(/[^a-z]/g, '') as any) || (idx === 2 ? 'wicketkeeper' : idx < 5 ? 'batsman' : idx < 9 ? 'allrounder' : 'bowler'),
              isCaptain: Boolean(p.isCaptain || (idx === 0 && !tourFallback.squad.some((s: any) => s.isCaptain))),
              isViceCaptain: Boolean(p.isViceCaptain || idx === 1),
              isWicketkeeper: Boolean(p.isWicketKeeper || p.role?.toLowerCase().includes('keeper') || idx === 2),
              jerseyNumber: `${p.jerseyNumber || idx + 1}`,
              mobileNumber: p.mobileNumber || p.phone || (p.isCaptain ? tourFallback.captainPhone : ''),
              photo: p.photo || ''
            })));
          } else {
            setSquad(initEmptySquad(15, tourFallback.captain || ''));
          }
          if (tourFallback.squadSubmitted) {
            setSubmitted(true);
          }
        } else {
          // Check local storage team
          try {
            const local = localStorage.getItem(`cricket_team_${teamId}`);
            if (local) {
              const parsed = JSON.parse(local);
              setTeamData(parsed);
              setTeamName(parsed.name || 'Cricket Team');
              setTeamLogo(parsed.logo || '');
              setCaptainName(parsed.captainName || '');
              setCaptainPhone(parsed.captainPhone || '');
              if (parsed.squadDetails) setSquad(parsed.squadDetails);
              else setSquad(initEmptySquad(15));
            } else {
              setTeamName('Cricket Team');
              setSquad(initEmptySquad(15));
            }
          } catch {
            setTeamName('Cricket Team');
            setSquad(initEmptySquad(15));
          }
        }
      }
    }, (err) => {
      console.warn('Error listening to team squad doc:', err);
      setLoading(false);
      if (tourFallback) {
        setTeamName(tourFallback.name || 'Cricket Team');
        setTeamLogo(tourFallback.logo || '');
        setCaptainName(tourFallback.captain || '');
        setCaptainPhone(tourFallback.captainPhone || '');
        if (tourFallback.squad && tourFallback.squad.length > 0) {
          setSquad(tourFallback.squad.map((p: any, idx: number) => ({
            id: p.id || `p-${idx}`,
            name: p.name || '',
            role: (p.role?.toLowerCase().replace(/[^a-z]/g, '') as any) || 'allrounder',
            isCaptain: Boolean(p.isCaptain),
            isViceCaptain: Boolean(p.isViceCaptain),
            isWicketkeeper: Boolean(p.isWicketKeeper),
            jerseyNumber: `${p.jerseyNumber || idx + 1}`,
            mobileNumber: p.mobileNumber || p.phone || '',
            photo: p.photo || ''
          })));
        } else {
          setSquad(initEmptySquad(15, tourFallback.captain || ''));
        }
      } else {
        setSquad(initEmptySquad(15));
      }
    });

    return () => unsub();
  }, [teamId, tourId]);

  // AUTOMATIC SYNC: When user updates Captain Name in the top form,
  // automatically update the captain player's name in the squad!
  const handleCaptainNameChange = (newName: string) => {
    setCaptainName(newName);
    setSquad(prev => {
      // Find current captain
      const captainIndex = prev.findIndex(p => p.isCaptain);
      if (captainIndex !== -1) {
        const updated = [...prev];
        updated[captainIndex] = { ...updated[captainIndex], name: newName };
        return updated;
      }
      // If none is captain, make index 0 the captain
      if (prev.length > 0) {
        const updated = [...prev];
        updated[0] = { ...updated[0], isCaptain: true, name: newName };
        return updated;
      }
      return prev;
    });
  };

  // AUTOMATIC SYNC: When user updates Captain Phone in the top form,
  // sync to the captain's mobileNumber if not set
  const handleCaptainPhoneChange = (newPhone: string) => {
    setCaptainPhone(newPhone);
    setSquad(prev => {
      const captainIndex = prev.findIndex(p => p.isCaptain);
      if (captainIndex !== -1 && !prev[captainIndex].mobileNumber) {
        const updated = [...prev];
        updated[captainIndex] = { ...updated[captainIndex], mobileNumber: newPhone };
        return updated;
      }
      return prev;
    });
  };

  // Team Logo upload handler (Sends to Firebase Storage and generates public Download URL)
  const handleTeamLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({ text: 'Please upload a valid image file (PNG, JPG, WebP).', type: 'error' });
      return;
    }

    try {
      setFeedbackMsg({ text: 'Uploading team logo to Firebase Storage...', type: 'info' });
      const result = await uploadImageToStorage(file, { folder: STORAGE_FOLDERS.TEAMS, maxWidth: 200, quality: 0.85 });
      setTeamLogo(result.url);
      setFeedbackMsg({ text: 'Team logo uploaded to Firebase Storage successfully!', type: 'success' });
    } catch (err: any) {
      console.warn('Logo upload note:', err);
      // Local fallback
      try {
        const compressedUrl = await compressImageFile(file, 300, 0.85);
        setTeamLogo(compressedUrl);
        setFeedbackMsg({ text: 'Team logo saved locally.', type: 'info' });
      } catch {
        setFeedbackMsg({ text: 'Failed to process team logo image.', type: 'error' });
      }
    }
    // Reset file input so same file can be re-selected if needed
    if (teamLogoInputRef.current) teamLogoInputRef.current.value = '';
  };

  const handleRemoveTeamLogo = () => {
    setTeamLogo('');
    if (teamLogoInputRef.current) teamLogoInputRef.current.value = '';
  };

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
      jerseyNumber: `${newIdx}`,
      mobileNumber: '',
      photo: ''
    };
    setSquad(prev => [...prev, newPlayer]);
  };

  // Remove player slot
  const handleRemovePlayer = (idxToRemove: number) => {
    if (squad.length <= 2) {
      setFeedbackMsg({ text: 'Squad must have at least 2 players.', type: 'info' });
      return;
    }
    const wasCaptain = squad[idxToRemove]?.isCaptain;
    setSquad(prev => {
      const next = prev.filter((_, idx) => idx !== idxToRemove);
      // If deleted player was captain, assign captaincy to slot 0
      if (wasCaptain && next.length > 0) {
        next[0].isCaptain = true;
        setCaptainName(next[0].name || '');
      }
      return next;
    });
  };

  // Update a single player field
  const handleUpdatePlayer = (idx: number, field: keyof SquadPlayerItem, value: any) => {
    setSquad(prev => {
      const updated = [...prev];
      if (field === 'isCaptain') {
        if (value === true) {
          // Only one captain allowed
          updated.forEach((p, i) => {
            if (i !== idx) p.isCaptain = false;
          });
          // Sync captainName
          const assignedName = updated[idx].name || captainName;
          updated[idx].name = assignedName;
          setCaptainName(assignedName);
        }
      }

      if (field === 'isViceCaptain' && value === true) {
        // Only one vice captain allowed
        updated.forEach((p, i) => {
          if (i !== idx) p.isViceCaptain = false;
        });
      }

      // If user is editing the name of the captain, keep top captainName in sync
      if (field === 'name' && updated[idx].isCaptain) {
        setCaptainName(value);
      }

      // If user is editing mobile of captain, keep top captainPhone in sync
      if (field === 'mobileNumber' && updated[idx].isCaptain) {
        setCaptainPhone(value);
      }

      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Player photo upload handler (Sends to Firebase Storage and generates public Download URL)
  const handlePlayerPhotoUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({ text: 'Please select an image file for player photo.', type: 'error' });
      return;
    }

    try {
      setFeedbackMsg({ text: `Uploading photo for player #${idx + 1} to Firebase Storage...`, type: 'info' });
      const result = await uploadImageToStorage(file, {
        folder: STORAGE_FOLDERS.PLAYERS,
        maxWidth: 200,
        quality: 0.85,
        cropSquare: true
      });
      handleUpdatePlayer(idx, 'photo', result.url);
      setFeedbackMsg({ text: `Player #${idx + 1} photo uploaded to Firebase Storage!`, type: 'success' });
    } catch (err: any) {
      console.warn('Player photo upload note:', err);
      // Local fallback
      try {
        const compressedData = await compressImageFile(file, 240, 0.85);
        handleUpdatePlayer(idx, 'photo', compressedData);
        setFeedbackMsg({ text: `Player #${idx + 1} photo saved locally.`, type: 'info' });
      } catch {
        setFeedbackMsg({ text: 'Failed to process player photo.', type: 'error' });
      }
    }
  };

  // Parse WhatsApp roster pasted by captain
  const handleParseWhatsAppRoster = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) return;

    const updatedSquad = [...squad];
    let playerIdx = 0;

    for (let i = 0; i < lines.length && playerIdx < 15; i++) {
      let line = lines[i];
      if (/^(squad|players|team|roster|playing|bench|subs|official)/i.test(line) && !/\d/.test(line)) {
        continue;
      }

      line = line.replace(/^[\d]+[\.\)\-\:\s]+/, '').trim();
      if (!line) continue;

      const isC = line.toLowerCase().includes('(c)') || (!line.toLowerCase().includes('(vc)') && playerIdx === 0);
      const isVC = line.toLowerCase().includes('(vc)') || playerIdx === 1;
      const isWK = line.toLowerCase().includes('(wk)') || line.toLowerCase().includes('keeper') || line.toLowerCase().includes('wk') || playerIdx === 2;

      let cleanName = line
        .replace(/\((C|c|VC|vc|WK|wk|Wk)\)/gi, '')
        .replace(/🧤|👑|⭐|⚡|🏏|🎯/g, '')
        .trim();

      if (!cleanName) continue;

      let role: SquadPlayerItem['role'] = 'allrounder';
      if (isWK) role = 'wicketkeeper';
      else if (playerIdx < 5) role = 'batsman';
      else if (playerIdx >= 8 && playerIdx < 12) role = 'bowler';

      if (updatedSquad[playerIdx]) {
        updatedSquad[playerIdx] = {
          ...updatedSquad[playerIdx],
          name: cleanName,
          role,
          isCaptain: isC,
          isViceCaptain: isVC && !isC,
          isWicketkeeper: isWK
        };
      } else {
        updatedSquad.push({
          id: `player-${Date.now()}-${playerIdx}`,
          name: cleanName,
          role,
          isCaptain: isC,
          isViceCaptain: isVC && !isC,
          isWicketkeeper: isWK,
          jerseyNumber: `${playerIdx + 1}`,
          mobileNumber: isC ? captainPhone : '',
          photo: ''
        });
      }

      if (isC && cleanName) {
        setCaptainName(cleanName);
      }
      playerIdx++;
    }

    setSquad(updatedSquad);
    setShowPasteModal(false);
    setPasteText('');
    setFeedbackMsg({ text: `✓ Successfully parsed ${playerIdx} players from WhatsApp roster!`, type: 'success' });
  };

  // 1-Click Auto-Fill 15 Local Players
  const handleAutoFillSampleSquad = () => {
    const sampleNames = [
      captainName || 'Captain Leader',
      'Rohit Patil',
      'Swapnil Jadhav',
      'Kunal More',
      'Prathamesh Shinde',
      'Ajinkya Deshmukh',
      'Tejas Sawant',
      'Siddhesh Gaikwad',
      'Akshay Kadam',
      'Omkar Bhosale',
      'Sagar Chavan',
      'Aditya Thorat',
      'Sanket Pawar',
      'Nikhil Mane',
      'Suraj Salunkhe'
    ];
    const roles: Array<SquadPlayerItem['role']> = [
      'batsman', 'batsman', 'wicketkeeper', 'allrounder', 'allrounder',
      'batsman', 'allrounder', 'bowler', 'bowler', 'bowler', 'bowler',
      'batsman', 'bowler', 'allrounder', 'wicketkeeper'
    ];

    setSquad(sampleNames.map((name, idx) => ({
      id: `player-auto-${Date.now()}-${idx}`,
      name,
      role: roles[idx] || 'allrounder',
      isCaptain: idx === 0,
      isViceCaptain: idx === 1,
      isWicketkeeper: idx === 2,
      jerseyNumber: `${idx + 1}`,
      mobileNumber: idx === 0 ? captainPhone : '',
      photo: squad[idx]?.photo || ''
    })));
    setCaptainName(sampleNames[0]);
    setFeedbackMsg({ text: '✓ 15 local player names auto-filled! You can edit any player.', type: 'success' });
  };

  // Copy full squad summary for WhatsApp proof
  const handleCopySquadSummary = () => {
    const validPlayers = squad.filter(p => p.name.trim().length > 0);
    const text = `🏏 *${teamName} — Official 15-Player Squad*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏆 Tournament: ${tournamentInfo?.name || 'ONE HALF CHAMPIONSHIP'}\n` +
      (tournamentInfo?.group ? `⚔️ Group ${tournamentInfo.group} (Day ${tournamentInfo.group})\n` : '') +
      `👤 Captain: ${captainName || 'Captain'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Playing XI:*\n` +
      validPlayers.slice(0, 11).map((p, i) => `${i + 1}. ${p.name}${p.isCaptain ? ' (C)' : ''}${p.isViceCaptain ? ' (VC)' : ''}${p.isWicketkeeper ? ' (WK)' : ''} [${p.role}]`).join('\n') +
      (validPlayers.length > 11 ? `\n\n*Substitutes / Bench:*\n` + validPlayers.slice(11).map((p, i) => `${i + 12}. ${p.name}${p.isCaptain ? ' (C)' : ''}${p.isViceCaptain ? ' (VC)' : ''}${p.isWicketkeeper ? ' (WK)' : ''} [${p.role}]`).join('\n') : '');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSquad(true);
      setTimeout(() => setCopiedSquad(false), 3000);
      setFeedbackMsg({ text: '✓ Squad copied to clipboard! Ready to share on WhatsApp.', type: 'success' });
    }
  };

  // Submit squad to Firestore and One Half Tournament state
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

    // Ensure at least one captain is designated
    const captainPlayer = validPlayers.find(p => p.isCaptain) || validPlayers[0];
    if (captainPlayer) {
      captainPlayer.isCaptain = true;
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
      shortName: (teamData?.shortName || teamName.trim().slice(0, 4).toUpperCase()),
      logo: teamLogo.trim(),
      captainName: captainName.trim() || captainPlayer?.name || '',
      captainPhone: captainPhone.trim() || captainPlayer?.mobileNumber || '',
      players: formattedPlayerNames,
      squadDetails: validPlayers,
      status: 'squad_submitted',
      createdAt: teamData?.createdAt || new Date().toISOString(),
      updatedAt: Date.now(),
      managerId: teamData?.managerId || 'default',
      tournamentId: tournamentInfo?.id || tourId,
      group: tournamentInfo?.group
    };

    try {
      if (!isFirestoreQuotaExhausted()) {
        await setDoc(doc(db, 'cricket_teams', activeTeamId), payload, { merge: true });
      }
      localStorage.setItem(`cricket_team_${activeTeamId}`, JSON.stringify(payload));

      // Synchronize with One Half Tournament State
      const targetTourId = tourId || 'one_half_active_championship';
      try {
        let tourData: any = null;
        const localTourRaw = localStorage.getItem('one_half_active_championship_tournament');
        if (localTourRaw) {
          try { tourData = JSON.parse(localTourRaw); } catch (_) {}
        }

        if (!isFirestoreQuotaExhausted()) {
          try {
            const tourSnap = await getDoc(doc(db, 'cricket_tournaments', targetTourId));
            if (tourSnap.exists()) {
              tourData = tourSnap.data();
            }
          } catch (e) {
            console.warn('Tournament snap check note:', e);
          }
        }

        if (tourData && Array.isArray(tourData.teams)) {
          const teamIdx = tourData.teams.findIndex(
            (t: any) => t.id === activeTeamId || t.name?.toLowerCase() === teamName.trim().toLowerCase()
          );

          if (teamIdx !== -1) {
            const mappedSquad = validPlayers.map((p, idx) => ({
              id: p.id || `p_${activeTeamId}_${idx}`,
              name: p.name.trim(),
              role: p.role === 'wicketkeeper' ? 'Wicket-Keeper' : p.role === 'batsman' ? 'Batsman' : p.role === 'bowler' ? 'Bowler' : 'All-Rounder',
              jerseyNumber: p.jerseyNumber || `${idx + 1}`,
              isCaptain: Boolean(p.isCaptain),
              isViceCaptain: Boolean(p.isViceCaptain),
              isWicketKeeper: Boolean(p.isWicketkeeper),
              mobileNumber: p.mobileNumber || (p.isCaptain ? captainPhone.trim() : ''),
              phone: p.mobileNumber || (p.isCaptain ? captainPhone.trim() : ''),
              photo: p.photo || ''
            }));

            const updatedTeam = {
              ...tourData.teams[teamIdx],
              name: teamName.trim(),
              logo: teamLogo.trim() || tourData.teams[teamIdx].logo,
              captain: captainName.trim() || captainPlayer?.name || tourData.teams[teamIdx].captain,
              captainPhone: captainPhone.trim() || tourData.teams[teamIdx].captainPhone,
              squad: mappedSquad,
              squadSubmitted: true,
              squadSubmittedAt: new Date().toISOString()
            };

            tourData.teams[teamIdx] = updatedTeam;
            tourData.updatedAt = Date.now();
            tourData.lastCloudSyncTime = new Date().toISOString();

            localStorage.setItem('one_half_active_championship_tournament', JSON.stringify(tourData));
            window.dispatchEvent(new CustomEvent('one_half_tournament_updated', { detail: tourData }));

            if (!isFirestoreQuotaExhausted()) {
              await setDoc(doc(db, 'cricket_tournaments', targetTourId), tourData, { merge: true });
              await syncOneHalfTournamentToRealtimeDB(tourData);
            }
          }
        }
      } catch (tourSyncErr) {
        console.warn('Tournament sync note:', tourSyncErr);
      }

      setSubmitted(true);
      setSubmitting(false);
      setFeedbackMsg({ text: '✓ 15-Player Squad submitted successfully to the Score Manager & Tournament!', type: 'success' });
    } catch (err) {
      console.warn('Error saving captain squad:', err);
      localStorage.setItem(`cricket_team_${activeTeamId}`, JSON.stringify(payload));
      setSubmitted(true);
      setSubmitting(false);
      setFeedbackMsg({ text: 'Squad saved locally! Real-time sync will resume when online.', type: 'success' });
    }
  };

  const validCount = squad.filter(p => p.name.trim().length > 0).length;

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500 selection:text-black py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
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
            {/* Tournament & Group Indicator Badge */}
            {tournamentInfo && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Trophy size={12} className="text-amber-400" />
                  {tournamentInfo.name}
                </span>
                {tournamentInfo.group && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full font-black text-[10px] uppercase tracking-wider">
                    Group {tournamentInfo.group} (Day {tournamentInfo.group} Qualifier)
                  </span>
                )}
                {tournamentInfo.groundName && (
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full font-bold text-[10px] flex items-center gap-1">
                    <MapPin size={11} className="text-slate-400" />
                    {tournamentInfo.groundName}
                  </span>
                )}
              </div>
            )}

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

            <div className="flex items-center gap-4">
              {teamLogo ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950 border-2 border-emerald-500/40 p-1.5 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
                  <img src={teamLogo} alt={teamName || 'Team Logo'} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-950/70 border border-slate-700/80 flex items-center justify-center shrink-0 text-slate-500">
                  <Shield size={30} className="text-slate-600" />
                </div>
              )}

              <div>
                <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-1">
                  {teamName || 'Submit Team Squad'}
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                  Enter your team details, logo, and 15-player match roster (Playing 11 + 4 Substitutes). Syncs live to the score manager and match scorecard in real-time.
                </p>
              </div>
            </div>
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
                  The score manager has received <span className="text-white font-bold">{teamName}</span> ({validCount} players). Verified for match scoreboard and ground toss.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopySquadSummary}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 border-none cursor-pointer transition-all shadow-md active:scale-95"
              >
                {copiedSquad ? <Check size={13} /> : <Copy size={13} />}
                {copiedSquad ? 'Copied to Clipboard!' : 'Copy Squad to WhatsApp'}
              </button>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
              >
                <Edit3 size={13} /> Edit Squad Details
              </button>
            </div>
          </div>
        )}

        {/* Team Details Inputs Card with Team Logo Option */}
        <div className="bg-slate-850/80 border border-slate-700/60 rounded-3xl p-6 mb-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <h3 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
              <Shield size={14} /> Team Profile & Captain Details
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">15-Player Official Roster</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
            {/* Team Logo Upload Box */}
            <div className="lg:col-span-1 bg-slate-900/90 border border-slate-750 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <ImagePlus size={11} className="text-emerald-400" /> Team Logo
              </label>

              <input
                ref={teamLogoInputRef}
                type="file"
                accept="image/*"
                onChange={handleTeamLogoUpload}
                className="hidden"
              />

              {teamLogo ? (
                <div className="relative group w-20 h-20 rounded-2xl bg-slate-950 border border-emerald-500/40 p-1 flex items-center justify-center overflow-hidden shadow-md">
                  <img src={teamLogo} alt="Team Logo" className="w-full h-full object-contain rounded-xl" />
                  <button
                    type="button"
                    onClick={handleRemoveTeamLogo}
                    className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg opacity-90 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                    title="Remove Logo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => teamLogoInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-900 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer p-2"
                >
                  <Upload size={18} />
                  <span className="text-[9px] font-black uppercase leading-tight">Upload</span>
                </button>
              )}

              <div className="w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => teamLogoInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Camera size={11} /> {teamLogo ? 'Change Logo' : 'Add Team Logo'}
                </button>
              </div>
            </div>

            {/* Team, Captain Name & Phone Inputs */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <label className="block text-[10px] font-black uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1">
                  <Crown size={12} className="text-amber-400" /> Captain Name (Auto-adds to squad)
                </label>
                <input
                  type="text"
                  value={captainName}
                  onChange={(e) => handleCaptainNameChange(e.target.value)}
                  placeholder="E.g. Rohit Sharma"
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Phone size={11} /> Captain Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={captainPhone}
                  onChange={(e) => handleCaptainPhoneChange(e.target.value)}
                  placeholder="E.g. 9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
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
                15-Player Squad Roster ({validCount} / 15 Filled)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Slots 1–11: Official Playing XI • Slots 12–15: Bench / Substitutes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                className="px-3 py-1.5 bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                title="Paste 15 player names directly from WhatsApp"
              >
                <ClipboardPaste size={12} className="text-emerald-400" />
                <span>Paste WhatsApp Roster</span>
              </button>

              <button
                type="button"
                onClick={handleAutoFillSampleSquad}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-xl text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Auto-fill 15 player slots with standard roster"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>Auto-Fill 15</span>
              </button>

              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-750">
                Captain: <strong className="text-amber-400">{captainName || 'Not Set'}</strong>
              </span>
            </div>
          </div>

          {/* Player Rows Table */}
          <div className="space-y-3">
            {squad.map((player, idx) => {
              const isCap = player.isCaptain;

              return (
                <React.Fragment key={player.id || idx}>
                  {idx === 0 && (
                    <div className="flex items-center gap-2 pt-1 pb-1">
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        🏏 Official Playing XI Lineup (Slots 1 to 11)
                      </span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>
                  )}

                  {idx === 11 && (
                    <div className="flex items-center gap-2 pt-4 pb-1">
                      <span className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                        🧤 Bench & Substitutes (Slots 12 to 15)
                      </span>
                      <div className="flex-1 h-px bg-slate-800" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-3 ${
                      isCap
                        ? 'bg-gradient-to-r from-amber-950/30 via-slate-900/95 to-slate-900 border-amber-500/40 shadow-md ring-1 ring-amber-500/20'
                        : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800'
                    }`}
                  >
                  {/* Top line indicator if captain */}
                  {isCap && (
                    <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-black text-[10px] uppercase tracking-wider border border-amber-500/30 shadow-sm">
                        <Crown size={12} className="text-amber-400 fill-amber-400" />
                        <span>Captain: {captainName || player.name || 'Official Team Captain'}</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider font-mono">
                        Team Leader
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                    {/* Left: Player Number + Profile Photo + Name Input */}
                    <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                      {/* Slot number badge */}
                      <span className={`w-7 h-7 rounded-xl font-mono text-[11px] font-black flex items-center justify-center shrink-0 ${
                        isCap ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>

                      {/* Player Profile Photo */}
                      <div className="relative group shrink-0">
                        <label
                          htmlFor={`player-photo-${idx}`}
                          className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-700 hover:border-emerald-500 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner transition-colors relative"
                          title="Upload / Change Player Photo"
                        >
                          {player.photo ? (
                            <img src={player.photo} alt={player.name || 'Player'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 hover:text-emerald-400 transition-colors">
                              <User size={18} />
                              <Camera size={9} className="absolute bottom-1 right-1 text-emerald-400" />
                            </div>
                          )}
                        </label>
                        <input
                          id={`player-photo-${idx}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePlayerPhotoUpload(idx, e)}
                          className="hidden"
                        />
                        {player.photo && (
                          <button
                            type="button"
                            onClick={() => handleUpdatePlayer(idx, 'photo', '')}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                            title="Remove Photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Name input with Captain indicator prefix */}
                      <div className="flex-1 min-w-0">
                        {isCap && (
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block mb-0.5">
                            👑 Captain Name
                          </span>
                        )}
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handleUpdatePlayer(idx, 'name', e.target.value)}
                          placeholder={`Player #${idx + 1} Full Name`}
                          className={`w-full bg-slate-950 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-600 outline-none ${
                            isCap
                              ? 'border border-amber-500/50 focus:border-amber-400'
                              : 'border border-slate-750 focus:border-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Middle & Right: Jersey #, Mobile #, Role, Badges, Delete */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                      
                      {/* Jersey Number */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5">
                        <Shirt size={13} className="text-amber-400 shrink-0" />
                        <input
                          type="text"
                          value={player.jerseyNumber || ''}
                          onChange={(e) => handleUpdatePlayer(idx, 'jerseyNumber', e.target.value)}
                          placeholder="Jersey #"
                          title="Player Jersey Number"
                          className="w-16 bg-transparent text-center text-[10px] font-mono font-black text-white placeholder-slate-600 outline-none"
                        />
                      </div>

                      {/* Mobile Number */}
                      <div className="flex items-center gap-1 bg-slate-950 border border-slate-750 rounded-xl px-2.5 py-1.5">
                        <Phone size={13} className="text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          value={player.mobileNumber || ''}
                          onChange={(e) => handleUpdatePlayer(idx, 'mobileNumber', e.target.value)}
                          placeholder="Mobile #"
                          title="Player Mobile Number"
                          className="w-24 bg-transparent text-[10px] font-mono font-bold text-white placeholder-slate-600 outline-none"
                        />
                      </div>

                      {/* Role Select */}
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

                      {/* Badges: Captain (C), Vice Captain (VC), Wicketkeeper (WK) */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdatePlayer(idx, 'isCaptain', !player.isCaptain)}
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border cursor-pointer transition-all flex items-center gap-0.5 ${
                            player.isCaptain
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm font-black'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                          title="Designate as Captain"
                        >
                          <Crown size={10} className={player.isCaptain ? 'fill-slate-950' : ''} />
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
                          title="Designate as Vice Captain"
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
                          title="Designate as Wicket Keeper"
                        >
                          (WK)
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 border-none bg-transparent cursor-pointer transition-colors"
                        title="Remove Player Slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
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

      {/* WhatsApp Roster Bulk Paste Modal */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 z-[400] p-4 bg-slate-950/85 backdrop-blur-md flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-750 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ClipboardPaste size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-white tracking-wide">
                      Paste WhatsApp Roster
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Paste your 15-player list from WhatsApp. Format: 1. Name (C), 2. Name (VC), 3. Name (WK)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="p-1 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div>
                <textarea
                  rows={8}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="1. Rohit Sharma (C)&#10;2. Shubman Gill (VC)&#10;3. Rishabh Pant (WK)&#10;4. Virat Kohli&#10;5. Suryakumar Yadav&#10;6. Hardik Pandya&#10;7. Ravindra Jadeja&#10;8. Jasprit Bumrah&#10;9. Mohammed Shami&#10;10. Kuldeep Yadav&#10;11. Mohammed Siraj&#10;12. Axar Patel&#10;13. Arshdeep Singh&#10;14. Sanju Samson&#10;15. Yashasvi Jaiswal"
                  className="w-full bg-slate-950 border border-slate-750 rounded-2xl p-3.5 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500 font-mono leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleParseWhatsAppRoster}
                  disabled={!pasteText.trim()}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-lg"
                >
                  <Check size={14} /> Parse & Apply Roster
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  </div>
);
};
