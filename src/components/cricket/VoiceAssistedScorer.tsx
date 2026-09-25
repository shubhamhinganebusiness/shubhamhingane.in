import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, MicOff, Volume2, Sparkles, AlertCircle, HelpCircle, Check, X, 
  Globe, Radio, ChevronDown, ChevronUp, ShieldAlert, ExternalLink, 
  Keyboard, RefreshCw 
} from 'lucide-react';

export type VoiceLanguage = 'mr-IN' | 'hi-IN' | 'en-IN';

export interface VoiceScoreCommandResult {
  rawTranscript: string;
  detectedLang: VoiceLanguage;
  intent: 
    | 'runs' 
    | 'dot' 
    | 'wide' 
    | 'noball' 
    | 'wicket' 
    | 'bye' 
    | 'legbye' 
    | 'undo' 
    | 'swap_batsmen' 
    | 'overlay' 
    | 'set_batsman' 
    | 'set_bowler' 
    | 'set_openers' 
    | 'declare_innings'
    | 'end_match'
    | 'open_modal'
    | 'add_penalty'
    | 'free_hit'
    | 'unknown';
  runs?: number;
  extraRuns?: number;
  wicketType?: 'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket';
  overlayType?: 'team_vs_team' | 'squad_a' | 'squad_b' | 'squad_both' | 'field_positions' | 'batting_summary' | 'bowling_summary' | 'tournament_logo' | 'toss_result' | 'none';
  modalType?: 'toss' | 'dls' | 'field_positions' | 'awards' | 'sponsors' | 'prizes' | 'scorecard' | 'share' | 'dream_team' | 'playoff' | 'edit_match' | 'slider_admin';
  penaltyRuns?: number;
  playerName?: string;
  nonStrikerName?: string;
  batsmanRole?: 'striker' | 'non-striker' | 'new_batsman';
  confidence: number;
  explanation: string;
}

interface VoiceAssistedScorerProps {
  disabled?: boolean;
  defaultCollapsed?: boolean;
  onScoreRuns: (runs: number) => void;
  onScoreDot: () => void;
  onScoreExtra: (type: 'wide' | 'noball', extraRuns: number) => void;
  onScoreByes: (type: 'bye' | 'legbye', runs: number) => void;
  onScoreWicket: (wicketType?: string) => void;
  onUndo?: () => void;
  onSwapBatsmen?: () => void;
  onTriggerOverlay?: (overlayType: string) => void;
  onDismissOverlay?: () => void;
  onSetBatsman?: (name: string, role: 'striker' | 'non-striker' | 'new_batsman') => void;
  onSetBowler?: (name: string) => void;
  onSetOpeners?: (strikerName: string, nonStrikerName: string) => void;
  onDeclareInnings?: () => void;
  onEndMatch?: () => void;
  onOpenModal?: (modalType: 'toss' | 'dls' | 'field_positions' | 'awards' | 'sponsors' | 'prizes' | 'scorecard' | 'share' | 'dream_team' | 'playoff' | 'edit_match' | 'slider_admin') => void;
  onAddPenalty?: (runs: number) => void;
  onToggleFreeHit?: () => void;
  isWicketModalOpen?: boolean;
  isOverComplete?: boolean;
  strikerName?: string;
  bowlerName?: string;
}

export const VoiceAssistedScorer: React.FC<VoiceAssistedScorerProps> = ({
  disabled = false,
  defaultCollapsed = false,
  onScoreRuns,
  onScoreDot,
  onScoreExtra,
  onScoreByes,
  onScoreWicket,
  onUndo,
  onSwapBatsmen,
  onTriggerOverlay,
  onDismissOverlay,
  onSetBatsman,
  onSetBowler,
  onSetOpeners,
  onDeclareInnings,
  onEndMatch,
  onOpenModal,
  onAddPenalty,
  onToggleFreeHit,
  isWicketModalOpen = false,
  isOverComplete = false,
  strikerName,
  bowlerName
}) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [isListening, setIsListening] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>('mr-IN');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastDetected, setLastDetected] = useState<VoiceScoreCommandResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [supported, setSupported] = useState(true);
  const [micPermissionBlocked, setMicPermissionBlocked] = useState(false);
  const [textCommandInput, setTextCommandInput] = useState('');

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const audioFeedbackRef = useRef(audioFeedback);
  audioFeedbackRef.current = audioFeedback;

  // Monitor microphone permission state from browser Permissions API if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setMicPermissionBlocked(true);
          } else if (permissionStatus.state === 'granted') {
            setMicPermissionBlocked(false);
          }
          permissionStatus.onchange = () => {
            if (permissionStatus.state === 'denied') {
              setMicPermissionBlocked(true);
            } else if (permissionStatus.state === 'granted') {
              setMicPermissionBlocked(false);
              setStatusMessage('Microphone access enabled! Tap to speak.');
            }
          };
        })
        .catch(() => {});
    }
  }, []);

  // Explicit helper to trigger the browser's native microphone permission prompt via getUserMedia
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionBlocked(false);
        setStatusMessage('✅ Microphone access granted! You can now speak cricket scores.');
        return true;
      } catch (err: any) {
        console.warn('getUserMedia audio permission request rejected/error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
          setMicPermissionBlocked(true);
          setStatusMessage('Microphone permission blocked. Please allow microphone in browser URL settings.');
        } else {
          setStatusMessage('Microphone notice: ' + (err.message || 'Check connection'));
        }
        return false;
      }
    }
    return true;
  }, []);

  // Sound chime via Web Audio API for instantaneous ear feedback
  const playChime = useCallback((frequency = 600, duration = 0.12) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, []);

  // Speak sound feedback using Web Speech Synthesis
  const speakFeedback = useCallback((text: string, lang: VoiceLanguage) => {
    if (!audioFeedbackRef.current || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.debug('Speech synthesis error:', e);
    }
  }, []);

  // Multi-lingual cricket intent parser (Instant 0ms latency for common phrases)
  const parseCricketCommand = useCallback((raw: string, lang: VoiceLanguage): VoiceScoreCommandResult => {
    let text = raw.toLowerCase().trim();
    // Replace fielding direction "midwicket" with safe token so it doesn't trigger "wicket"
    text = text.replace(/mid[\s-]?wicket/g, 'mid_direction');

    // 0. BROADCAST OVERLAYS & GRAPHICS VIA VOICE COMMAND
    // Dismiss/Hide/Clear Overlay
    if (
      text.includes('hide overlay') || text.includes('close overlay') || text.includes('dismiss overlay') ||
      text.includes('clear overlay') || text.includes('clear graphics') || text.includes('remove overlay') ||
      text.includes('स्क्रीन साफ') || text.includes('ग्राफिक्स हटवा') || text.includes('ओवरले बंद') ||
      text.includes('ओवरले हटाओ') || text.includes('ओवरले हटवा') || text.includes('स्क्रीन क्लियर') ||
      text.includes('hide graphics') || text.includes('stop overlay')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'none',
        confidence: 0.99,
        explanation: 'Dismiss Live Broadcast Overlay'
      };
    }

    // Helper: Clean up extracted player names
    const cleanSpokenName = (nameStr: string): string => {
      if (!nameStr) return '';
      let cleaned = nameStr.trim();
      cleaned = cleaned.replace(/[.,?!:;]+$/, '').trim();
      cleaned = cleaned.replace(/\s+(आहे|आहेत|येईल|आणा|द्या|करा|खेळेल|खेळतोय|है|हैं|आएगा|लाओ|दो|करेगा|खेलेगा|please|now|is|here|come)$/i, '').trim();
      cleaned = cleaned.replace(/^(नाव|नाम|name|named)\s+/i, '').trim();
      if (/^[a-zA-Z\s]+$/.test(cleaned)) {
        cleaned = cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
      return cleaned;
    };

    // A. OPENING PAIR DETECTION (Match start / Innings start)
    const openersMatch = text.match(/(?:opening\s+pair|openers?|सलामी\s+जोडी(?:दार)?|ओपनर(?:्स)?|सलामी\s+बल्लेबाज)\s+([^\s,]+(?:\s+[^\s,]+)?)\s+(?:and|&|आणि|और|व)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (openersMatch) {
      const p1 = cleanSpokenName(openersMatch[1]);
      const p2 = cleanSpokenName(openersMatch[2]);
      if (p1 && p2) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_openers',
          playerName: p1,
          nonStrikerName: p2,
          confidence: 0.98,
          explanation: `Set Openers: ${p1} & ${p2}`
        };
      }
    }

    // B. NON-STRIKER BATSMAN
    const nonStrikerMatch = text.match(/(?:non[\s-]?striker|नॉन[\s-]?स्ट्रायकर|नॉन[\s-]?स्ट्राइकर|दुसरा\s+बॅट्समन|दूसरा\s+बल्लेबाज)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (nonStrikerMatch) {
      const p = cleanSpokenName(nonStrikerMatch[1]);
      if (p && !['change', 'swap', 'बदला', 'बदलो'].includes(p.toLowerCase())) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_batsman',
          batsmanRole: 'non-striker',
          playerName: p,
          confidence: 0.96,
          explanation: `Set Non-Striker: ${p}`
        };
      }
    }

    // C. STRIKER BATSMAN
    const strikerMatch = text.match(/(?:striker|स्ट्रायकर|स्ट्राइकर)\s+(?:बॅट्समन\s+|बल्लेबाज\s+)?([^\s,]+(?:\s+[^\s,]+)?)/i) ||
      text.match(/([^\s,]+(?:\s+[^\s,]+)?)\s+(?:on\s+strike|स्ट्राइकवर|स्ट्राइक\s+पर)/i);
    if (strikerMatch) {
      const p = cleanSpokenName(strikerMatch[1]);
      if (p && !['change', 'swap', 'बदला', 'बदलो', 'rotate'].includes(p.toLowerCase())) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_batsman',
          batsmanRole: 'striker',
          playerName: p,
          confidence: 0.96,
          explanation: `Set Striker: ${p}`
        };
      }
    }

    // D. NEW BATSMAN / NEXT BATSMAN (After wicket fall or anytime)
    const newBatsmanMatch = text.match(/(?:new\s+batsman|next\s+batsman|incoming\s+batsman|नवीन\s+बॅट्समन|नवीन\s+फलंदाज|पुढचा\s+फलंदाज|पुढचा\s+बॅट्समन|नया\s+बल्लेबाज|अगला\s+बल्लेबाज|नया\s+बैट्समैन)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (newBatsmanMatch) {
      const p = cleanSpokenName(newBatsmanMatch[1]);
      if (p) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_batsman',
          batsmanRole: 'new_batsman',
          playerName: p,
          confidence: 0.96,
          explanation: `New Batsman: ${p}`
        };
      }
    }

    // E. NEW BOWLER / NEXT BOWLER / CHANGE BOWLER (Over finish / Inning start / Match start)
    const bowlerMatch = text.match(/(?:new\s+bowler|next\s+bowler|change\s+bowler|opening\s+bowler|bowler|नवीन\s+बॉलर|पुढचा\s+बॉलर|बॉलर\s+बदला|बॉलर\s+बदलो|पहिला\s+बॉलर|नवीन\s+गोलंदाज|पुढचा\s+गोलंदाज|गोलंदाज|बॉलर|नया\s+गेंदबाज|अगला\s+गेंदबाज|गेंदबाज|पहला\s+गेंदबाज)\s+([^\s,]+(?:\s+[^\s,]+)?)/i);
    if (bowlerMatch) {
      const p = cleanSpokenName(bowlerMatch[1]);
      const disallowedWords = ['name', 'change', 'बदला', 'बदलो', 'दाखवा', 'दिखाओ', 'कार्ड', 'समरी', 'summary', 'list', 'यादी', 'summary'];
      if (p && !disallowedWords.includes(p.toLowerCase())) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'set_bowler',
          playerName: p,
          confidence: 0.96,
          explanation: `Bowler: ${p}`
        };
      }
    }

    // Team vs Team Logo & Matchup Card Overlay
    if (
      text.includes('team vs team') || text.includes('team versus team') || text.includes('vs logo') ||
      text.includes('versus logo') || text.includes('vs overlay') || text.includes('team logo') ||
      text.includes('match card') || text.includes('matchup') || text.includes('clash') ||
      text.includes('टीम विरुद्ध टीम') || text.includes('दोन्ही टीमचा लोगो') || text.includes('टीम व्हर्सेस टीम') ||
      text.includes('टीम बनाम टीम') || text.includes('दोनों टीम का लोगो') || text.includes('टीम वर्सेस टीम') ||
      (text.includes('logo') && (text.includes('team') || text.includes('show'))) ||
      (text.includes('लोगो') && (text.includes('दाखवा') || text.includes('दिखाओ') || text.includes('टीम')))
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'team_vs_team',
        confidence: 0.99,
        explanation: 'Show Team VS Team Logo & Matchup Overlay'
      };
    }

    // Squad List (Both Teams Squad List / Playing 11)
    if (
      text.includes('squad list') || text.includes('squad') || text.includes('squads') ||
      text.includes('playing 11') || text.includes('playing xi') || text.includes('lineup') || text.includes('lineups') ||
      text.includes('स्क्वॉड') || text.includes('प्लेईंग ११') || text.includes('प्लेइंग इलेव्हन') || text.includes('प्लेइंग 11') ||
      text.includes('खेळाडूंची यादी') || text.includes('दोनों टीम की स्क्वाड') || text.includes('दोन्ही टीमची स्क्वॉड') ||
      text.includes('खिलाड़ियों की सूची') || text.includes('टीम लिस्ट') || text.includes('सगळे खेळाडू')
    ) {
      const isTeamB = text.includes('team b') || text.includes('टीम b') || text.includes('दुसरी टीम') || text.includes('दूसरी टीम');
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: isTeamB ? 'squad_b' : 'squad_a',
        confidence: 0.99,
        explanation: isTeamB ? 'Show Team B Squad List Overlay' : 'Show Both Teams Squad List Overlay'
      };
    }

    // Field Position Overlay
    if (
      text.includes('field position') || text.includes('fielding position') || text.includes('fielding setup') ||
      text.includes('फील्डिंग पोझिशन') || text.includes('फील्डिंग सेट') || text.includes('फील्डिंग दिखाओ') || text.includes('फील्डिंग दाखवा')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'field_positions',
        confidence: 0.98,
        explanation: 'Show Field Positions TV Overlay'
      };
    }

    // Batting Summary Overlay
    if (
      text.includes('batting summary') || text.includes('batting scorecard') ||
      text.includes('बॅटिंग सारांश') || text.includes('बैटिंग समरी') || text.includes('बॅटिंग कार्ड')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'batting_summary',
        confidence: 0.98,
        explanation: 'Show Batting Summary Overlay'
      };
    }

    // Bowling Summary Overlay
    if (
      text.includes('bowling summary') || text.includes('bowling scorecard') ||
      text.includes('बॉलिंग सारांश') || text.includes('बॉलिंग समरी') || text.includes('बॉलिंग कार्ड')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'bowling_summary',
        confidence: 0.98,
        explanation: 'Show Bowling Summary Overlay'
      };
    }

    // Tournament Logo Overlay
    if (
      text.includes('tournament logo') || text.includes('trophy logo') ||
      text.includes('स्पर्धा लोगो') || text.includes('टूर्नामेंट लोगो')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'tournament_logo',
        confidence: 0.98,
        explanation: 'Show Tournament Logo Overlay'
      };
    }

    // Toss Result Overlay
    if (
      text.includes('toss result') || text.includes('toss report') ||
      text.includes('टॉस रिझल्ट') || text.includes('टॉस रिजल्ट') || (text.includes('टॉस') && (text.includes('दाखवा') || text.includes('दिखाओ')))
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'overlay',
        overlayType: 'toss_result',
        confidence: 0.98,
        explanation: 'Show Toss Result Overlay'
      };
    }

    // SCOREBOARD MANAGER OPERATIONS: DECLARE INNINGS
    if (
      text.includes('declare innings') || text.includes('declare inning') || text.includes('declaration') ||
      text.includes('डाव घोषित') || text.includes('डाव संपवा') || text.includes('डाव डिक्लेअर') ||
      text.includes('पारी घोषित') || text.includes('पारी समाप्त') || text.includes('इनिंग्स डिक्लेअर') ||
      text.includes('innings declared') || text.includes('declare the innings')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'declare_innings',
        confidence: 0.99,
        explanation: 'Declare Innings / Transition to Next Innings'
      };
    }

    // SCOREBOARD MANAGER OPERATIONS: END / FINISH MATCH
    if (
      text.includes('end match') || text.includes('finish match') || text.includes('complete match') ||
      text.includes('सामना समाप्त') || text.includes('मॅच संपली') || text.includes('सामना संपवा') ||
      text.includes('मैच समाप्त') || text.includes('मैच खत्म') || text.includes('conclude match')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'end_match',
        confidence: 0.99,
        explanation: 'Conclude & End Cricket Match'
      };
    }

    // SCOREBOARD MANAGER OPERATIONS: PENALTY RUNS (e.g. "penalty 5 runs", "५ रन पेनल्टी", "5 penalty")
    const penaltyMatch = text.match(/(?:penalty|पेनल्टी|दंड)\s+(\d+)/i) || text.match(/(\d+)\s+(?:runs?\s+)?(?:penalty|पेनल्टी|दंड)/i);
    if (penaltyMatch) {
      const pRuns = parseInt(penaltyMatch[1], 10);
      if (!isNaN(pRuns) && pRuns > 0 && pRuns <= 20) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'add_penalty',
          penaltyRuns: pRuns,
          confidence: 0.98,
          explanation: `Award +${pRuns} Penalty Runs`
        };
      }
    }

    // SCOREBOARD MANAGER OPERATIONS: TOGGLE FREE HIT
    if (
      text.includes('toggle free hit') || text.includes('set free hit') || text.includes('फ्री हिट चालू') ||
      text.includes('फ्री हिट लावा') || text.includes('फ्री हिट लगाओ') || (text.includes('फ्री हिट') && !text.includes('नो बॉल') && !text.includes('नोबॉल'))
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'free_hit',
        confidence: 0.98,
        explanation: 'Toggle Free Hit Delivery Status'
      };
    }

    // SCOREBOARD MANAGER OPERATIONS: OPEN MODALS & STUDIOS
    // 1. Digital Toss Coin Flip
    if (text.includes('open toss') || text.includes('toss modal') || text.includes('spin coin') || text.includes('टॉस करा') || text.includes('नाणेफेक') || text.includes('सिक्का उछालो')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'toss',
        confidence: 0.98,
        explanation: 'Open Digital Toss & Coin Flip Studio'
      };
    }

    // 2. DLS Calculator Modal
    if (text.includes('dls') || text.includes('duckworth') || text.includes('पाऊस नियम') || text.includes('डीएलएस') || text.includes('डकवर्थ')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'dls',
        confidence: 0.98,
        explanation: 'Open DLS Rain Calculator'
      };
    }

    // 3. Field Position Manager Modal
    if (text.includes('open field position') || text.includes('fielding positions modal') || text.includes('फील्डिंग मॅनेजर') || text.includes('फील्डिंग सेटअप उघडा')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'field_positions',
        confidence: 0.98,
        explanation: 'Open Field Positions & Radar Manager'
      };
    }

    // 4. Awards & Certificate Studio
    if (text.includes('open awards') || text.includes('award modal') || text.includes('certificate studio') || text.includes('पारितोषिक') || text.includes('प्रमाणपत्र') || text.includes('अवॉर्ड्स')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'awards',
        confidence: 0.98,
        explanation: 'Open Match Awards & Certificate Studio'
      };
    }

    // 5. Sponsors Manager
    if (text.includes('open sponsor') || text.includes('sponsor manager') || text.includes('प्रायोजक') || text.includes('स्पॉन्सर')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'sponsors',
        confidence: 0.98,
        explanation: 'Open Sponsor Banner Manager'
      };
    }

    // 6. Prize Money Manager
    if (text.includes('open prize') || text.includes('prize money') || text.includes('बक्षीस') || text.includes('इनाम')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'prizes',
        confidence: 0.98,
        explanation: 'Open Tournament Prize Money Desk'
      };
    }

    // 7. Full Scorecard Modal
    if (text.includes('full scorecard') || text.includes('open scorecard') || text.includes('संपूर्ण धावफलक') || text.includes('पूरा स्कोरकार्ड') || text.includes('स्कोअरकार्ड दाखवा')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'scorecard',
        confidence: 0.98,
        explanation: 'Open Match Scorecard Breakdown'
      };
    }

    // 8. Public Share Modal
    if (text.includes('share match') || text.includes('public share') || text.includes('शेअर मॅच') || text.includes('मैच शेयर')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'share',
        confidence: 0.98,
        explanation: 'Open Public Match Share & Live Link Desk'
      };
    }

    // 9. Dream Team Calculator Modal
    if (text.includes('dream team') || text.includes('ड्रीम टीम') || text.includes('बेस्ट ११')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'dream_team',
        confidence: 0.98,
        explanation: 'Open Tournament Dream Team XI'
      };
    }

    // 10. Playoff Scenarios Modal
    if (text.includes('playoff') || text.includes('प्लेऑफ') || text.includes('सेमीफायनल समीकरण')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'playoff',
        confidence: 0.98,
        explanation: 'Open Playoff Qualifications Simulator'
      };
    }

    // 11. Edit Match Details Modal
    if (text.includes('edit match') || text.includes('मॅच एडिट') || text.includes('मैच एडिट') || text.includes('change overs limit') || text.includes('edit ground')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'edit_match',
        confidence: 0.98,
        explanation: 'Open Edit Live Match Parameters'
      };
    }

    // 12. Spectator Slider Images Admin
    if (text.includes('spectator slider') || text.includes('slider admin') || text.includes('फोटो स्लाइडर') || text.includes('स्लाइडर फोटो')) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'open_modal',
        modalType: 'slider_admin',
        confidence: 0.98,
        explanation: 'Open Spectator Photo Slider Studio'
      };
    }

    // 1. UNDO COMMAND
    // Marathi/Hindi/English: अनडू, मागे घे, वापस, undo, revert, cancel last ball
    if (
      text.includes('undo') || text.includes('अनडू') || text.includes('मागे') || 
      text.includes('वापस') || text.includes('cancel ball') || text.includes('रद्द') ||
      text.includes('शेवटचा बॉल मागे')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'undo',
        confidence: 0.95,
        explanation: 'Undo previous ball'
      };
    }

    // 2. STRIKE ROTATION / SWAP BATSMEN
    if (
      text.includes('swap') || text.includes('स्ट्राइक बदला') || text.includes('स्ट्राइक चेंज') || 
      text.includes('strike change') || text.includes('rotate strike') || text.includes('स्ट्राइक')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'swap_batsmen',
        confidence: 0.9,
        explanation: 'Swap Striker & Non-Striker'
      };
    }

    // =========================================================================
    // 3. COMPOUND CALLS: NO-BALL + BOUNDARY / RUNS (Free Hit Next)
    // Checked BEFORE plain boundary 6/4 to prevent masking compound deliveries!
    // Examples: "no ball four", "नो बॉल चौकार", "नो बॉल षटकार", "no ball 6", "no ball single"
    // =========================================================================
    const isNoBallKeyword = (
      text.includes('no ball') || text.includes('noball') || text.includes('no-ball') ||
      text.includes('नो बॉल') || text.includes('नोबॉल') || text.includes('नो बाल') || 
      text.includes('free hit') || text.includes('फ्री हिट')
    );
    if (isNoBallKeyword) {
      let extraRuns = 0;
      if (
        text.includes('6') || text.includes('six') || text.includes('sixer') || 
        text.includes('सहा') || text.includes('छक्का') || text.includes('षटकार') || 
        text.includes('सिक्स') || text.includes('maximum') || text.includes('गगनचुंबी')
      ) {
        extraRuns = 6;
      } else if (
        text.includes('4') || text.includes('four') || text.includes('चार') || 
        text.includes('चौका') || text.includes('चौकार') || text.includes('फोर') || 
        text.includes('boundary') || text.includes('बाउंड्री')
      ) {
        extraRuns = 4;
      } else if (text.includes('3') || text.includes('three') || text.includes('triple') || text.includes('तीन')) {
        extraRuns = 3;
      } else if (text.includes('2') || text.includes('two') || text.includes('double') || text.includes('दोन') || text.includes('दो')) {
        extraRuns = 2;
      } else if (text.includes('1') || text.includes('one') || text.includes('single') || text.includes('एक') || text.includes('सिंगल')) {
        extraRuns = 1;
      }

      const totalRuns = 1 + extraRuns;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'noball',
        extraRuns,
        confidence: 0.98,
        explanation: extraRuns > 0 
          ? `No Ball + ${extraRuns} run(s) [Total +${totalRuns} runs, Free Hit next]` 
          : 'No Ball (+1) [Free Hit next]'
      };
    }

    // =========================================================================
    // 4. COMPOUND CALLS: WIDE BALL + BOUNDARY / RUNS / STUMPING
    // Checked BEFORE plain boundary 6/4 to prevent masking compound deliveries!
    // Examples: "wide four", "वाईड चौकार", "wide plus two", "वाईड १ रन", "wide stumping"
    // =========================================================================
    const isWideKeyword = (
      text.includes('wide') || text.includes('वाईड') || text.includes('व्हाईड') || text.includes('वाइड')
    );
    if (isWideKeyword) {
      // Check for wide + stumping
      if (text.includes('stump') || text.includes('स्टंप')) {
        return {
          rawTranscript: raw,
          detectedLang: lang,
          intent: 'wide',
          extraRuns: 0,
          wicketType: 'stumped',
          confidence: 0.98,
          explanation: 'Wide Delivery + STUMPED OUT'
        };
      }

      let extraRuns = 0;
      if (
        text.includes('4') || text.includes('four') || text.includes('चार') || 
        text.includes('चौका') || text.includes('चौकार') || text.includes('फोर') || 
        text.includes('boundary') || text.includes('बाउंड्री')
      ) {
        extraRuns = 4;
      } else if (text.includes('3') || text.includes('three') || text.includes('triple') || text.includes('तीन')) {
        extraRuns = 3;
      } else if (text.includes('2') || text.includes('two') || text.includes('double') || text.includes('दोन') || text.includes('दो')) {
        extraRuns = 2;
      } else if (text.includes('1') || text.includes('one') || text.includes('single') || text.includes('एक') || text.includes('सिंगल')) {
        extraRuns = 1;
      }

      const totalWideRuns = 1 + extraRuns;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'wide',
        extraRuns,
        confidence: 0.98,
        explanation: extraRuns > 0 
          ? `Wide + ${extraRuns} run(s) [Total +${totalWideRuns} runs]` 
          : 'Wide Ball (+1)'
      };
    }

    // =========================================================================
    // 5. COMPOUND CALLS: BYE / LEG-BYE + BOUNDARY / RUNS
    // =========================================================================
    const isLegByeKeyword = (
      text.includes('leg bye') || text.includes('legbye') || text.includes('लेग बाय') || 
      text.includes('लेगबाई') || text.includes('लेग बाई')
    );
    if (isLegByeKeyword) {
      let runs = 1;
      if (text.includes('4') || text.includes('four') || text.includes('चार') || text.includes('चौका') || text.includes('चौकार') || text.includes('boundary') || text.includes('बाउंड्री')) runs = 4;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) runs = 2;
      else if (text.includes('3') || text.includes('three') || text.includes('तीन')) runs = 3;
      else if (text.includes('1') || text.includes('one') || text.includes('एक') || text.includes('single')) runs = 1;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'legbye',
        runs,
        confidence: 0.95,
        explanation: `Leg-Bye +${runs}`
      };
    }

    const isByeKeyword = text.includes('bye') || text.includes('बाय') || text.includes('बाई');
    if (isByeKeyword) {
      let runs = 1;
      if (text.includes('4') || text.includes('four') || text.includes('चार') || text.includes('चौका') || text.includes('चौकार') || text.includes('boundary') || text.includes('बाउंड्री')) runs = 4;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) runs = 2;
      else if (text.includes('3') || text.includes('three') || text.includes('तीन')) runs = 3;
      else if (text.includes('1') || text.includes('one') || text.includes('एक') || text.includes('single')) runs = 1;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'bye',
        runs,
        confidence: 0.95,
        explanation: `Bye +${runs}`
      };
    }

    // =========================================================================
    // 6. WICKET COMMANDS
    // =========================================================================
    if (
      /\b(out|wicket|bowled|caught|lbw|stumped|dismissed)\b/.test(text) || 
      text.includes('बाद') || text.includes('आउट') || text.includes('बोल्ड') ||
      text.includes('झेल') || text.includes('कैच') || text.includes('stump') || 
      text.includes('रन आउट') || text.includes('run out') || text.includes('lbw') ||
      text.includes('दांडी') || text.includes('पायचीत') || text.includes('क्लीन बोल्ड') ||
      text.includes('विकेट')
    ) {
      let wicketType: VoiceScoreCommandResult['wicketType'] = 'caught';
      if (text.includes('bold') || text.includes('bowled') || text.includes('बोल्ड') || text.includes('दांडी')) wicketType = 'bowled';
      else if (text.includes('run out') || text.includes('रन आउट')) wicketType = 'run_out';
      else if (text.includes('stump') || text.includes('स्टंप')) wicketType = 'stumped';
      else if (text.includes('lbw') || text.includes('एलपीडब्ल्यू') || text.includes('पायचीत')) wicketType = 'lbw';
      else if (text.includes('hit wicket') || text.includes('हिट')) wicketType = 'hit_wicket';

      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'wicket',
        wicketType,
        confidence: 0.95,
        explanation: `Wicket (${wicketType?.toUpperCase() || 'OUT'}) detected`
      };
    }

    // =========================================================================
    // 7. DOT BALL COMMANDS
    // =========================================================================
    if (
      text.includes('dot') || text.includes('डॉट') || text.includes('निर्धाव') || 
      text.includes('शून्य') || text.includes('zero') || text.includes('no run') || 
      text.includes('खाली गेंद') || text.includes('खाली') || text === '0'
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'dot',
        runs: 0,
        confidence: 0.95,
        explanation: 'Dot Ball (0 runs)'
      };
    }

    // =========================================================================
    // 8. PLAIN BOUNDARY RUNS: SIX (6)
    // =========================================================================
    if (
      text.includes('six') || text.includes('sixer') || text.includes('षटकार') || 
      text.includes('छक्का') || text.includes('सहा') || text.includes('छह') || 
      text.includes('सिक्स') || text.includes('maximum') || text === '6' || text.includes('गगनचुंबी')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'runs',
        runs: 6,
        confidence: 0.95,
        explanation: 'SIX! 6 Runs'
      };
    }

    // =========================================================================
    // 9. PLAIN BOUNDARY RUNS: FOUR (4)
    // =========================================================================
    if (
      text.includes('four') || text.includes('चौकार') || text.includes('चौका') || 
      text.includes('चार') || text.includes('फोर') || text.includes('boundary') || 
      text.includes('बाउंड्री') || text === '4'
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'runs',
        runs: 4,
        confidence: 0.95,
        explanation: 'FOUR! 4 Runs'
      };
    }

    // =========================================================================
    // 10. PLAIN RUNS: 1, 2, 3
    // =========================================================================
    if (
      text.includes('one') || text.includes('single') || text.includes('एक') || 
      text.includes('सिंगल') || text === '1'
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'runs',
        runs: 1,
        confidence: 0.9,
        explanation: 'Single (1 run)'
      };
    }

    if (
      text.includes('two') || text.includes('double') || text.includes('दोन') || 
      text.includes('दो') || text.includes('डबल') || text === '2'
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'runs',
        runs: 2,
        confidence: 0.9,
        explanation: '2 Runs'
      };
    }

    if (
      text.includes('three') || text.includes('triple') || text.includes('तीन') || 
      text.includes('ट्रिपल') || text === '3'
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'runs',
        runs: 3,
        confidence: 0.9,
        explanation: '3 Runs'
      };
    }

    return {
      rawTranscript: raw,
      detectedLang: lang,
      intent: 'unknown',
      confidence: 0.2,
      explanation: `Could not understand: "${raw}". Speak: 1, 2, 4, 6, Dot, Wide, or Out.`
    };
  }, []);

  // Gemini AI Assistant parser for conversational or complex instructions
  const parseWithAI = useCallback(async (transcript: string, lang: VoiceLanguage): Promise<VoiceScoreCommandResult> => {
    setIsAiProcessing(true);
    try {
      const resp = await fetch('/api/cricket/parse-voice-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          language: lang,
          strikerName,
          bowlerName
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.intent && data.intent !== 'unknown') {
          return data;
        }
      }
    } catch (err) {
      console.warn('[Voice AI] Error parsing with server:', err);
    } finally {
      setIsAiProcessing(false);
    }
    return {
      rawTranscript: transcript,
      detectedLang: lang,
      intent: 'unknown',
      confidence: 0.1,
      explanation: `Could not determine action for: "${transcript}". Speak: 4, 6, Dot, or Out.`
    };
  }, [strikerName, bowlerName]);

  // Execute recognized cricket command
  const executeCommand = useCallback((res: VoiceScoreCommandResult) => {
    setLastDetected(res);

    switch (res.intent) {
      case 'dot':
        onScoreDot();
        speakFeedback(selectedLang === 'mr-IN' ? 'डॉट बॉल' : selectedLang === 'hi-IN' ? 'डॉट गेंद' : 'Dot ball', selectedLang);
        setStatusMessage('✅ Dot Ball recorded (0 runs)');
        break;

      case 'runs':
        if (typeof res.runs === 'number') {
          onScoreRuns(res.runs);
          const speechMap: Record<number, { mr: string; hi: string; en: string }> = {
            1: { mr: 'एक रन', hi: 'एक रन', en: 'One run' },
            2: { mr: 'दोन रन', hi: 'दो रन', en: 'Two runs' },
            3: { mr: 'तीन रन', hi: 'तीन रन', en: 'Three runs' },
            4: { mr: 'कडक चौकार! चार रन', hi: 'शानदार चौका! चार रन', en: 'Four runs!' },
            6: { mr: 'विशाल षटकार! सहा रन', hi: 'गगनचुंबी छक्का! छह रन', en: 'Six runs! Huge maximum' }
          };
          const speechText = speechMap[res.runs]?.[selectedLang === 'mr-IN' ? 'mr' : selectedLang === 'hi-IN' ? 'hi' : 'en'] || `${res.runs} runs`;
          speakFeedback(speechText, selectedLang);
          setStatusMessage(`✅ ${res.runs} run(s) recorded!`);
        }
        break;

      case 'wide':
        onScoreExtra('wide', res.extraRuns || 0);
        if (res.wicketType === 'stumped') {
          onScoreWicket('stumped');
          const stMsg = selectedLang === 'mr-IN'
            ? 'वाईड बॉल आणि स्टंपिंग बाद!'
            : selectedLang === 'hi-IN'
            ? 'वाइड गेंद और स्टंप आउट!'
            : 'Wide ball and stumped out!';
          speakFeedback(stMsg, selectedLang);
          setStatusMessage('🔴 Wide Ball (+1) + STUMPED OUT!');
        } else if (res.extraRuns && res.extraRuns > 0) {
          const totalWide = 1 + res.extraRuns;
          const msg = selectedLang === 'mr-IN'
            ? `वाईड प्लस ${res.extraRuns === 4 ? 'चौकार' : `${res.extraRuns} धावा`}, एकूण ${totalWide} धावा`
            : selectedLang === 'hi-IN'
            ? `वाइड और ${res.extraRuns === 4 ? 'चौका' : `${res.extraRuns} रन`}, कुल ${totalWide} रन`
            : `Wide plus ${res.extraRuns === 4 ? 'four' : `${res.extraRuns} runs`}, ${totalWide} runs total`;
          speakFeedback(msg, selectedLang);
          setStatusMessage(`✅ Wide Ball + ${res.extraRuns} Runs (+${totalWide} total) recorded!`);
        } else {
          speakFeedback(selectedLang === 'mr-IN' ? 'वाईड बॉल' : selectedLang === 'hi-IN' ? 'वाइड गेंद' : 'Wide ball', selectedLang);
          setStatusMessage('✅ Wide Ball (+1) recorded!');
        }
        break;

      case 'noball':
        onScoreExtra('noball', res.extraRuns || 0);
        if (res.extraRuns && res.extraRuns > 0) {
          const totalNb = 1 + res.extraRuns;
          const batLabelMr = res.extraRuns === 6 ? 'षटकार' : res.extraRuns === 4 ? 'चौकार' : `${res.extraRuns} धावा`;
          const batLabelHi = res.extraRuns === 6 ? 'छक्का' : res.extraRuns === 4 ? 'चौका' : `${res.extraRuns} रन`;
          const batLabelEn = res.extraRuns === 6 ? 'six' : res.extraRuns === 4 ? 'four' : `${res.extraRuns} runs`;
          const msg = selectedLang === 'mr-IN'
            ? `नो बॉल वर ${batLabelMr}! एकूण ${totalNb} धावा, पुढची फ्री हिट`
            : selectedLang === 'hi-IN'
            ? `नो बॉल पर ${batLabelHi}! कुल ${totalNb} रन, अगली गेंद फ्री हिट`
            : `No ball and ${batLabelEn}! Total ${totalNb} runs, Free Hit next`;
          speakFeedback(msg, selectedLang);
          setStatusMessage(`✅ No Ball + ${res.extraRuns} Runs (+${totalNb} total) recorded with Free Hit!`);
        } else {
          speakFeedback(selectedLang === 'mr-IN' ? 'नो बॉल, पुढची फ्री हिट' : selectedLang === 'hi-IN' ? 'नो बॉल, फ्री हिट' : 'No ball, free hit next', selectedLang);
          setStatusMessage('✅ No Ball (+1) recorded with Free Hit!');
        }
        break;

      case 'bye':
        onScoreByes('bye', res.runs || 1);
        speakFeedback('बाय रन', selectedLang);
        setStatusMessage(`✅ Bye +${res.runs || 1} recorded`);
        break;

      case 'legbye':
        onScoreByes('legbye', res.runs || 1);
        speakFeedback('लेग बाय', selectedLang);
        setStatusMessage(`✅ Leg Bye +${res.runs || 1} recorded`);
        break;

      case 'wicket':
        onScoreWicket(res.wicketType);
        speakFeedback(selectedLang === 'mr-IN' ? 'विकेट! बाद' : selectedLang === 'hi-IN' ? 'आउट! विकेट' : 'Wicket! Batsman out', selectedLang);
        setStatusMessage(`🔴 Wicket (${res.wicketType || 'Out'}) recorded!`);
        break;

      case 'undo':
        if (onUndo) {
          onUndo();
          speakFeedback(selectedLang === 'mr-IN' ? 'शेवटचा बॉल अनडू केला' : selectedLang === 'hi-IN' ? 'पिछला गेंद वापस लिया' : 'Last ball undone', selectedLang);
          setStatusMessage('↩️ Last ball undone');
        }
        break;

      case 'swap_batsmen':
        if (onSwapBatsmen) {
          onSwapBatsmen();
          speakFeedback(selectedLang === 'mr-IN' ? 'स्ट्राइक बदलली' : selectedLang === 'hi-IN' ? 'स्ट्राइक बदली गई' : 'Strike rotated', selectedLang);
          setStatusMessage('↔️ Strike swapped');
        }
        break;

      case 'overlay':
        if (res.overlayType === 'none' || res.overlayType === 'clear') {
          if (onDismissOverlay) {
            onDismissOverlay();
          } else if (onTriggerOverlay) {
            onTriggerOverlay('none');
          }
          const clearMsg = selectedLang === 'mr-IN' ? 'स्क्रीनवरील ओवरले बंद केला' : selectedLang === 'hi-IN' ? 'ओवरले हटा दिया गया' : 'Broadcast overlay dismissed';
          speakFeedback(clearMsg, selectedLang);
          setStatusMessage('🧹 Broadcast overlay dismissed');
        } else if (res.overlayType === 'team_vs_team') {
          if (onTriggerOverlay) onTriggerOverlay('team_vs_team');
          const msg = selectedLang === 'mr-IN' ? 'टीम विरुद्ध टीम लोगो ओवरले सुरू केला' : selectedLang === 'hi-IN' ? 'टीम बनाम टीम लोगो ओवरले शुरू किया' : 'Team vs Team logo overlay live on air';
          speakFeedback(msg, selectedLang);
          setStatusMessage('⚔️ Team VS Team Logo & Matchup Overlay LIVE ON AIR!');
        } else if (res.overlayType === 'squad_a' || res.overlayType === 'squad_b' || res.overlayType === 'squad_both') {
          const squadType = res.overlayType === 'squad_b' ? 'squad_b' : 'squad_a';
          if (onTriggerOverlay) onTriggerOverlay(squadType);
          const msg = selectedLang === 'mr-IN' ? 'दोन्ही टीमची स्क्वॉड लिस्ट ओवरले सुरू केला' : selectedLang === 'hi-IN' ? 'दोनों टीमों की स्क्वाड लिस्ट ओवरले शुरू किया' : 'Team squad list overlay live on air';
          speakFeedback(msg, selectedLang);
          setStatusMessage('📋 Both Teams Squad List Overlay LIVE ON AIR!');
        } else if (res.overlayType) {
          if (onTriggerOverlay) onTriggerOverlay(res.overlayType);
          const msg = selectedLang === 'mr-IN' ? 'टीव्ही ग्राफिक्स सुरू केले' : selectedLang === 'hi-IN' ? 'टीवी ग्राफिक्स शुरू किया' : 'Broadcast graphic triggered';
          speakFeedback(msg, selectedLang);
          setStatusMessage(`📺 ${res.explanation || 'Broadcast Graphic Overlay triggered'}`);
        }
        break;

      case 'set_openers':
        if (res.playerName && res.nonStrikerName) {
          if (onSetOpeners) {
            onSetOpeners(res.playerName, res.nonStrikerName);
          } else if (onSetBatsman) {
            onSetBatsman(res.playerName, 'striker');
            onSetBatsman(res.nonStrikerName, 'non-striker');
          }
          const msg = selectedLang === 'mr-IN'
            ? `सलामी जोडी ${res.playerName} आणि ${res.nonStrikerName}`
            : selectedLang === 'hi-IN'
            ? `सलामी जोड़ी ${res.playerName} और ${res.nonStrikerName}`
            : `Opening pair ${res.playerName} and ${res.nonStrikerName}`;
          speakFeedback(msg, selectedLang);
          setStatusMessage(`👑 Opening pair: ${res.playerName} & ${res.nonStrikerName}`);
        }
        break;

      case 'set_batsman':
        if (res.playerName) {
          const role = res.batsmanRole || 'new_batsman';
          if (onSetBatsman) {
            onSetBatsman(res.playerName, role);
          }
          const roleTitle = role === 'striker' ? 'Striker' : role === 'non-striker' ? 'Non-Striker' : 'New Batsman';
          const speechMap: Record<string, { mr: string; hi: string; en: string }> = {
            striker: { mr: `स्ट्रायकर ${res.playerName}`, hi: `स्ट्राइकर ${res.playerName}`, en: `Striker ${res.playerName}` },
            'non-striker': { mr: `नॉन स्ट्रायकर ${res.playerName}`, hi: `नॉन स्ट्राइकर ${res.playerName}`, en: `Non-striker ${res.playerName}` },
            new_batsman: { mr: `नवीन फलंदाज ${res.playerName} क्रीजवर`, hi: `नए बल्लेबाज ${res.playerName} क्रीज पर`, en: `New batsman ${res.playerName}` }
          };
          const speech = speechMap[role]?.[selectedLang === 'mr-IN' ? 'mr' : selectedLang === 'hi-IN' ? 'hi' : 'en'] || `${roleTitle} ${res.playerName}`;
          speakFeedback(speech, selectedLang);
          setStatusMessage(`🏏 ${roleTitle} set to "${res.playerName}"`);
        }
        break;

      case 'set_bowler':
        if (res.playerName) {
          if (onSetBowler) {
            onSetBowler(res.playerName);
          }
          const isOverFin = isOverComplete;
          const speech = selectedLang === 'mr-IN'
            ? (isOverFin ? `नवीन ओव्हर बॉलर ${res.playerName}` : `नवीन बॉलर ${res.playerName}`)
            : selectedLang === 'hi-IN'
            ? (isOverFin ? `नए ओवर के गेंदबाज ${res.playerName}` : `नए गेंदबाज ${res.playerName}`)
            : (isOverFin ? `New over bowler ${res.playerName}` : `Bowler ${res.playerName}`);
          speakFeedback(speech, selectedLang);
          setStatusMessage(`🎯 Bowler set to "${res.playerName}"`);
        }
        break;

      case 'declare_innings':
        if (onDeclareInnings) {
          onDeclareInnings();
          const speech = selectedLang === 'mr-IN' 
            ? 'डाव घोषित केला, दुसरी इनिंग्स सुरू' 
            : selectedLang === 'hi-IN' 
            ? 'पारी घोषित की गई, दूसरी पारी शुरू' 
            : 'Innings declared successfully';
          speakFeedback(speech, selectedLang);
          setStatusMessage('🏁 Innings declared by Score Manager');
        }
        break;

      case 'end_match':
        if (onEndMatch) {
          onEndMatch();
          const speech = selectedLang === 'mr-IN' 
            ? 'सामना समाप्त, निकाल नोंदवला' 
            : selectedLang === 'hi-IN' 
            ? 'मैच समाप्त, परिणाम दर्ज किया गया' 
            : 'Match concluded and recorded in history';
          speakFeedback(speech, selectedLang);
          setStatusMessage('🏆 Match concluded by Score Manager');
        }
        break;

      case 'add_penalty':
        if (onAddPenalty && res.penaltyRuns) {
          onAddPenalty(res.penaltyRuns);
          const speech = selectedLang === 'mr-IN' 
            ? `${res.penaltyRuns} धावा पेनल्टी जोडल्या` 
            : selectedLang === 'hi-IN' 
            ? `${res.penaltyRuns} रन पेनल्टी जोड़ी गई` 
            : `${res.penaltyRuns} penalty runs awarded`;
          speakFeedback(speech, selectedLang);
          setStatusMessage(`⚖️ +${res.penaltyRuns} Penalty Runs added to score`);
        }
        break;

      case 'free_hit':
        if (onToggleFreeHit) {
          onToggleFreeHit();
          const speech = selectedLang === 'mr-IN' 
            ? 'फ्री हिट डिलिव्हरी लागू केली' 
            : selectedLang === 'hi-IN' 
            ? 'फ्री हिट गेंद सक्रिय' 
            : 'Free hit activated';
          speakFeedback(speech, selectedLang);
          setStatusMessage('⚡ Free Hit Delivery Activated!');
        }
        break;

      case 'open_modal':
        if (onOpenModal && res.modalType) {
          onOpenModal(res.modalType);
          const modalNames: Record<string, { mr: string; hi: string; en: string }> = {
            toss: { mr: 'नाणेफेक टॉस सुरू केला', hi: 'सिक्का उछाल टॉस शुरू', en: 'Digital Toss studio opened' },
            dls: { mr: 'डकवर्थ लुईस पाऊस कॅल्क्युलेटर उघडला', hi: 'डीएलएस कैलकुलेटर खुला', en: 'DLS Rain Calculator opened' },
            field_positions: { mr: 'फील्डिंग पोझिशन्स रडार उघडला', hi: 'फील्डिंग सेटअप खुला', en: 'Field Position Manager opened' },
            awards: { mr: 'सामना पारितोषिक व प्रमाणपत्र स्टुडिओ उघडला', hi: 'पुरस्कार व प्रमाणपत्र स्टूडियो खुला', en: 'Awards & Certificate Studio opened' },
            sponsors: { mr: 'प्रायोजक बॅनर मॅनेजर उघडला', hi: 'प्रायोजक मैनेजर खुला', en: 'Sponsor Banner Manager opened' },
            prizes: { mr: 'बक्षीस रक्कम मॅनेजर उघडला', hi: 'इनाम राशि मैनेजर खुला', en: 'Prize Money Manager opened' },
            scorecard: { mr: 'संपूर्ण स्कोअरकार्ड उघडले', hi: 'पूरा स्कोरकार्ड खुला', en: 'Full Match Scorecard opened' },
            share: { mr: 'मॅच शेअर लिंक उघडली', hi: 'मैच शेयर विंडो खुली', en: 'Public Match Share opened' },
            dream_team: { mr: 'ड्रीम टीम ११ उघडली', hi: 'ड्रीम टीम ११ खुली', en: 'Dream Team XI opened' },
            playoff: { mr: 'प्लेऑफ समीकरण कॅल्क्युलेटर उघडला', hi: 'प्लेऑफ कैलकुलेटर खुला', en: 'Playoff Scenarios opened' },
            edit_match: { mr: 'मॅच तपशील बदल उघडले', hi: 'मैच संपादन खुला', en: 'Edit Match Parameters opened' },
            slider_admin: { mr: 'फोटो स्लाइडर स्टुडिओ उघडला', hi: 'फोटो स्लाइडर स्टूडियो खुला', en: 'Spectator Photo Slider Studio opened' }
          };
          const speech = modalNames[res.modalType]?.[selectedLang === 'mr-IN' ? 'mr' : selectedLang === 'hi-IN' ? 'hi' : 'en'] || `${res.modalType} opened`;
          speakFeedback(speech, selectedLang);
          setStatusMessage(`📂 Opened: ${res.explanation}`);
        }
        break;

      default:
        setStatusMessage(`⚠️ Not recognized: "${res.rawTranscript}". Try saying: "चार रन", "छक्का", "Dot", or "Wicket".`);
        break;
    }
  }, [
    selectedLang,
    onScoreDot,
    onScoreRuns,
    onScoreExtra,
    onScoreByes,
    onScoreWicket,
    onUndo,
    onSwapBatsmen,
    onTriggerOverlay,
    onDismissOverlay,
    onSetBatsman,
    onSetBowler,
    onSetOpeners,
    onDeclareInnings,
    onEndMatch,
    onOpenModal,
    onAddPenalty,
    onToggleFreeHit,
    isOverComplete,
    speakFeedback
  ]);

  // Initialize and handle Speech Recognition
  const startListening = useCallback(async () => {
    if (disabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatusMessage('Voice recognition is not supported in this browser. Please use Chrome/Edge or Android Chrome.');
      return;
    }

    // Proactively request / verify microphone permission via getUserMedia to trigger the browser prompt if needed
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setMicPermissionBlocked(false);
      } catch (permErr: any) {
        if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError' || permErr.name === 'SecurityError') {
          setMicPermissionBlocked(true);
          setIsExpanded(true);
          setStatusMessage('Microphone permission blocked. Please allow microphone in browser URL settings or type commands below.');
          setIsListening(false);
          return;
        }
      }
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = continuousMode;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      isManuallyStoppedRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
        setMicPermissionBlocked(false);
        playChime(520, 0.1);
        setStatusMessage(
          selectedLang === 'mr-IN'
            ? '🎙️ ऐकत आहे... (उदा. "चार रन", "डॉट", "सिक्स", "विकेट")'
            : selectedLang === 'hi-IN'
            ? '🎙️ सुन रहा है... (उदा. "चार रन", "डॉट गेंद", "छक्का", "आउट")'
            : '🎙️ Listening... (e.g. "Four runs", "Dot ball", "Six", "Wicket")'
        );
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += trans;
          } else {
            interim += trans;
          }
        }

        const activeText = final || interim;
        setLiveTranscript(activeText);

        if (final && final.trim().length > 0) {
          const localResult = parseCricketCommand(final, selectedLang);
          if (localResult.intent !== 'unknown') {
            playChime(880, 0.14);
            executeCommand(localResult);
          } else {
            setStatusMessage(`🤖 AI Assistant analyzing: "${final}"...`);
            parseWithAI(final, selectedLang).then((aiResult) => {
              if (aiResult.intent !== 'unknown') {
                playChime(880, 0.14);
              }
              executeCommand(aiResult);
            });
          }
          // clear transcript after a short display
          setTimeout(() => setLiveTranscript(''), 2500);
        }
      };

      recognition.onerror = (event: any) => {
        console.debug('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionBlocked(true);
          setIsExpanded(true);
          setStatusMessage('Microphone permission blocked. Please allow microphone in browser settings or use Quick Type below.');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // keep waiting in continuous mode
          if (!continuousMode) {
            setIsListening(false);
          }
        } else {
          setStatusMessage(`Mic notice: ${event.error}. Click mic to retry.`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (continuousMode && !isManuallyStoppedRef.current) {
          // Restart recognition automatically in continuous hands-free mode
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err: any) {
      console.warn('Failed to start voice recognition:', err);
      setIsListening(false);
      if (err.name === 'NotAllowedError' || (err.message && err.message.toLowerCase().includes('not allowed'))) {
        setMicPermissionBlocked(true);
        setIsExpanded(true);
      }
      setStatusMessage('Could not start voice service: ' + (err.message || 'Check microphone'));
    }
  }, [disabled, selectedLang, continuousMode, parseCricketCommand, executeCommand, parseWithAI, playChime]);

  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    setStatusMessage('Voice scoring paused');
  }, []);

  // Language switch handler
  const handleLangChange = (lang: VoiceLanguage) => {
    setSelectedLang(lang);
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(), 250);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  if (!isExpanded) {
    return (
      <div className="w-full bg-slate-900/90 border border-amber-500/20 rounded-xl px-2 py-1 shadow-md flex items-center justify-between gap-1.5 shrink-0 select-none">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {micPermissionBlocked ? (
            <button
              type="button"
              id="btn-voice-mic-trigger"
              onClick={() => setIsExpanded(true)}
              className="h-6.5 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow border shrink-0 bg-rose-900/90 hover:bg-rose-800 text-rose-200 border-rose-500 animate-pulse active:scale-95"
              title="Microphone permission is blocked in browser. Click to see how to enable."
            >
              <ShieldAlert size={11} className="text-rose-400" />
              <span>Mic Blocked (Fix)</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-voice-mic-trigger"
              disabled={disabled || !supported}
              onClick={isListening ? stopListening : startListening}
              className={`h-6.5 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow border shrink-0 active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white border-rose-400 animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 font-extrabold'
              }`}
              aria-label={isListening ? 'Click to Stop Voice' : 'Voice Assisted Scorer'}
            >
              {isListening ? <MicOff size={11} className="animate-spin" /> : <Mic size={11} />}
              <span>{isListening ? 'Mic ON' : '🎙️ Voice'}</span>
            </button>
          )}
          
          <div className="text-[9px] text-slate-300 truncate font-medium flex-1 min-w-0">
            {micPermissionBlocked ? (
              <span 
                onClick={() => setIsExpanded(true)}
                className="text-rose-400 font-bold truncate block cursor-pointer hover:underline"
              >
                ⚠️ Mic permission blocked in browser. Click here to unblock.
              </span>
            ) : liveTranscript ? (
              <strong className="text-amber-300 font-mono">"{liveTranscript}"</strong>
            ) : statusMessage ? (
              <span className="text-emerald-400 font-bold truncate block">{statusMessage}</span>
            ) : (
              <span className="text-slate-400 truncate block">Speak ball outcome ({selectedLang === 'mr-IN' ? 'मराठी' : selectedLang === 'hi-IN' ? 'हिंदी' : 'EN'})</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => handleLangChange(selectedLang === 'mr-IN' ? 'hi-IN' : selectedLang === 'hi-IN' ? 'en-IN' : 'mr-IN')}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold border border-slate-700 cursor-pointer"
            title="Switch Language"
          >
            {selectedLang === 'mr-IN' ? '🇮🇳 MR' : selectedLang === 'hi-IN' ? '🇮🇳 HI' : '🌐 EN'}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 cursor-pointer flex items-center"
            title="Expand Voice Assistant"
          >
            <ChevronDown size={11} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-amber-500/20 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
            isListening ? 'bg-rose-500/20 text-rose-400 animate-pulse border border-rose-500/40' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <Radio size={14} className={isListening ? 'animate-spin' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                🎙️ Voice Scorer
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-widest border border-emerald-500/30">
                AI Hands-Free
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {strikerName ? `Striker: ${strikerName}` : 'Speak any ball outcome'}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Audio voice echo toggle */}
          <button
            type="button"
            onClick={() => setAudioFeedback(!audioFeedback)}
            title={audioFeedback ? 'Voice Speech Echo: ON' : 'Voice Speech Echo: OFF'}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              audioFeedback ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            <Volume2 size={13} />
          </button>

          {/* Help cheat sheet button */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
            title="Voice Commands Reference"
          >
            <HelpCircle size={13} />
            <span className="text-[9px] font-bold hidden sm:inline">Commands</span>
          </button>

          {/* Collapse button */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs transition-colors cursor-pointer flex items-center gap-1"
            title="Collapse Voice Scorer Panel"
          >
            <ChevronUp size={13} />
            <span className="text-[9px] font-bold hidden sm:inline">Collapse</span>
          </button>
        </div>
      </div>

      {/* Language Selector Tabs */}
      <div className="flex items-center justify-between gap-1.5 mb-2.5 bg-slate-950 p-1 rounded-xl border border-slate-850">
        <div className="flex items-center gap-1 flex-1">
          <button
            type="button"
            onClick={() => handleLangChange('mr-IN')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-none flex items-center justify-center gap-1 ${
              selectedLang === 'mr-IN'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🇮🇳 मराठी</span>
          </button>

          <button
            type="button"
            onClick={() => handleLangChange('hi-IN')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-none flex items-center justify-center gap-1 ${
              selectedLang === 'hi-IN'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🇮🇳 हिन्दी</span>
          </button>

          <button
            type="button"
            onClick={() => handleLangChange('en-IN')}
            className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer border-none flex items-center justify-center gap-1 ${
              selectedLang === 'en-IN'
                ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🌐 English</span>
          </button>
        </div>

        {/* Continuous Hands-free Toggle */}
        <button
          type="button"
          onClick={() => {
            const next = !continuousMode;
            setContinuousMode(next);
            if (isListening) {
              stopListening();
              setTimeout(() => startListening(), 250);
            }
          }}
          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
            continuousMode
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-slate-850 border-slate-750 text-slate-400 hover:text-white'
          }`}
          title="Continuous Mode automatically keeps the microphone active ball after ball"
        >
          {continuousMode ? '⚡ Hands-Free: ON' : '⚡ Hands-Free: OFF'}
        </button>
      </div>

      {/* Main Mic Button & Live Voice Feedback Ribbon */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          id="btn-voice-mic-trigger"
          disabled={disabled || !supported}
          onClick={isListening ? stopListening : startListening}
          className={`h-12 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 border ${
            isListening
              ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border-rose-400 ring-4 ring-rose-500/30 animate-pulse'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-300 font-extrabold'
          }`}
        >
          {isListening ? (
            <>
              <MicOff size={16} className="text-white" />
              <span>Stop Mic</span>
            </>
          ) : (
            <>
              <Mic size={16} className="text-slate-950" />
              <span>Tap to Speak</span>
            </>
          )}
        </button>

        {/* Live Audio / Recognized Action Display */}
        <div className="flex-1 min-w-0 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex flex-col justify-center min-h-[48px]">
          {isAiProcessing ? (
            <div className="flex items-center gap-1.5 truncate">
              <Sparkles size={14} className="text-amber-400 animate-spin shrink-0" />
              <p className="text-xs font-mono text-amber-300 font-black animate-pulse truncate">
                🤖 AI analyzing instruction with Gemini...
              </p>
            </div>
          ) : liveTranscript ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="text-xs font-mono text-emerald-300 font-black truncate">
                "{liveTranscript}"
              </p>
            </div>
          ) : statusMessage ? (
            <p className="text-[11px] font-bold text-slate-300 truncate">
              {statusMessage}
            </p>
          ) : (
            <p className="text-[10px] text-slate-500 font-semibold truncate">
              {selectedLang === 'mr-IN'
                ? 'माईक चालू करून बोला: "चार", "सिक्स", "डॉट", "वाईड", "विकेट"...'
                : selectedLang === 'hi-IN'
                ? 'माइक दबाकर बोलें: "चार रन", "छक्का", "डॉट", "वाइड", "आउट"...'
                : 'Click mic and speak: "Four", "Six", "Dot ball", "Wide", "Out"...'}
            </p>
          )}

          {lastDetected && (
            <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-amber-400 font-mono">
              <span className="opacity-70">Recognized:</span>
              <strong className="text-white bg-slate-850 px-1.5 py-0.2 rounded border border-slate-750">
                {lastDetected.explanation}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* Microphone Permission Blocked Guidance & Resolution Box */}
      {micPermissionBlocked && (
        <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-br from-rose-950/90 via-slate-900 to-rose-950/70 border border-rose-500/50 text-white shadow-xl space-y-2.5 animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
              <ShieldAlert size={16} className="text-rose-400 shrink-0 animate-bounce" />
              <span>Microphone Permission Blocked</span>
            </div>
            <button
              type="button"
              onClick={() => setMicPermissionBlocked(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition cursor-pointer"
              title="Dismiss warning"
            >
              <X size={14} />
            </button>
          </div>
          
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Your browser or device has blocked microphone access for this website. Follow these 2 easy steps to unblock:
          </p>

          <div className="text-[10.5px] text-slate-200 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5 font-medium">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">1.</span>
              <span>Click the <strong>Lock 🔒</strong> or <strong>Tune / Settings ⚙️</strong> icon in your browser URL bar (top left corner of the address bar).</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">2.</span>
              <span>Find <strong>Microphone</strong> and switch it from <em>Block</em> to <strong className="text-emerald-400">Allow</strong>.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">3.</span>
              <span>Click <strong>"Grant / Re-test Microphone"</strong> below to start speaking.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={async () => {
                const ok = await requestMicPermission();
                if (ok) {
                  startListening();
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 border border-emerald-400"
            >
              <RefreshCw size={13} />
              <span>Grant / Re-test Microphone</span>
            </button>

            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 no-underline border border-indigo-400"
            >
              <ExternalLink size={13} />
              <span>Open in Dedicated Tab</span>
            </a>
          </div>
        </div>
      )}

      {/* Quick Command Text Input Bar (Keyboard alternative for silent / noisy / blocked environments) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!textCommandInput.trim()) return;
          const input = textCommandInput.trim();
          setTextCommandInput('');
          const localResult = parseCricketCommand(input, selectedLang);
          if (localResult.intent !== 'unknown') {
            playChime(880, 0.14);
            executeCommand(localResult);
          } else {
            setStatusMessage(`🤖 AI Assistant analyzing: "${input}"...`);
            parseWithAI(input, selectedLang).then((aiResult) => {
              if (aiResult.intent !== 'unknown') playChime(880, 0.14);
              executeCommand(aiResult);
            });
          }
        }}
        className="mt-2.5 flex items-center gap-1.5"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={textCommandInput}
            onChange={(e) => setTextCommandInput(e.target.value)}
            placeholder={
              selectedLang === 'mr-IN'
                ? '⌨️ किंवा कमांड टाईप करा (उदा. "चार रन", "डॉट", "सिक्स", "विकेट", "वाईड")'
                : selectedLang === 'hi-IN'
                ? '⌨️ या कमांड टाइप करें (उदा. "चार रन", "डॉट गेंद", "छक्का", "आउट", "वाइड")'
                : '⌨️ Or type command (e.g. "4 runs", "dot", "six", "wicket", "wide 4")'
            }
            className="w-full bg-slate-950/90 border border-slate-750 focus:border-amber-400 text-white text-xs rounded-xl px-3 py-1.5 placeholder:text-slate-500 outline-none transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={!textCommandInput.trim()}
          className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 text-xs font-black uppercase tracking-wider cursor-pointer border-none transition-all flex items-center gap-1 shrink-0"
        >
          <Keyboard size={13} />
          <span>Apply</span>
        </button>
      </form>

      {/* Quick Voice Chips (Clickable fallback & prompt cheat triggers) */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest shrink-0 mr-1">
          Try saying:
        </span>
        {[
          { label: selectedLang === 'mr-IN' ? '👑 ओपनर: रोहित & विराट' : selectedLang === 'hi-IN' ? '👑 ओपनर: रोहित & विराट' : '👑 Openers: Rohit & Virat', cmd: selectedLang === 'mr-IN' ? 'ओपनर रोहित आणि विराट' : selectedLang === 'hi-IN' ? 'सलामी बल्लेबाज रोहित और विराट' : 'openers Rohit and Virat' },
          { label: selectedLang === 'mr-IN' ? '🏏 नवीन बॅट्समन: राहुल' : selectedLang === 'hi-IN' ? '🏏 नया बल्लेबाज: राहुल' : '🏏 New Bat: Rahul', cmd: selectedLang === 'mr-IN' ? 'नवीन बॅट्समन राहुल' : selectedLang === 'hi-IN' ? 'नया बल्लेबाज राहुल' : 'new batsman Rahul' },
          { label: selectedLang === 'mr-IN' ? '🎯 नवीन बॉलर: बुमराह' : selectedLang === 'hi-IN' ? '🎯 नया गेंदबाज: बुमराह' : '🎯 Bowler: Bumrah', cmd: selectedLang === 'mr-IN' ? 'नवीन बॉलर बुमराह' : selectedLang === 'hi-IN' ? 'नया गेंदबाज बुमराह' : 'new bowler Bumrah' },
          { label: selectedLang === 'mr-IN' ? '🚨 नो बॉल चौकार' : selectedLang === 'hi-IN' ? '🚨 नो बॉल चौका' : '🚨 No Ball 4', cmd: selectedLang === 'mr-IN' ? 'नो बॉल चौकार' : selectedLang === 'hi-IN' ? 'नो बॉल चौका' : 'no ball four', isCompound: true },
          { label: selectedLang === 'mr-IN' ? '🚨 नो बॉल षटकार' : selectedLang === 'hi-IN' ? '🚨 नो बॉल छक्का' : '🚨 No Ball 6', cmd: selectedLang === 'mr-IN' ? 'नो बॉल षटकार' : selectedLang === 'hi-IN' ? 'नो बॉल छक्का' : 'no ball six', isCompound: true },
          { label: selectedLang === 'mr-IN' ? '↔️ वाईड चौकार' : selectedLang === 'hi-IN' ? '↔️ वाइड चौका' : '↔️ Wide 4', cmd: selectedLang === 'mr-IN' ? 'वाईड चौकार' : selectedLang === 'hi-IN' ? 'वाइड चौका' : 'wide four', isCompound: true },
          { label: selectedLang === 'mr-IN' ? '↔️ वाईड + १' : selectedLang === 'hi-IN' ? '↔️ वाइड + १' : '↔️ Wide + 1', cmd: selectedLang === 'mr-IN' ? 'वाईड आणि एक' : selectedLang === 'hi-IN' ? 'वाइड एक रन' : 'wide plus one', isCompound: true },
          { label: selectedLang === 'mr-IN' ? '⚔️ टीम vs टीम लोगो' : selectedLang === 'hi-IN' ? '⚔️ टीम vs टीम लोगो' : '⚔️ Team vs Team Logo', cmd: 'show the team vs team logo', isOverlay: true },
          { label: selectedLang === 'mr-IN' ? '📋 दोन्ही टीम स्क्वॉड' : selectedLang === 'hi-IN' ? '📋 दोनों टीम स्क्वाड' : '📋 Both Squads', cmd: 'show the both team squad list', isOverlay: true },
          { label: selectedLang === 'mr-IN' ? '🧹 ओवरले बंद' : selectedLang === 'hi-IN' ? '🧹 ओवरले हटाओ' : '🧹 Clear Overlay', cmd: 'hide overlay', isOverlay: true },
          { label: selectedLang === 'mr-IN' ? 'डॉट बॉल' : selectedLang === 'hi-IN' ? 'डॉट' : 'Dot', cmd: 'dot' },
          { label: selectedLang === 'mr-IN' ? 'एक रन' : selectedLang === 'hi-IN' ? 'सिंगल' : 'Single', cmd: '1 run' },
          { label: selectedLang === 'mr-IN' ? 'दोन रन' : selectedLang === 'hi-IN' ? 'डबल' : 'Two runs', cmd: '2 runs' },
          { label: selectedLang === 'mr-IN' ? 'चौकार (4)' : selectedLang === 'hi-IN' ? 'चौका (4)' : 'Four (4)', cmd: 'four' },
          { label: selectedLang === 'mr-IN' ? 'षटकार (6)' : selectedLang === 'hi-IN' ? 'छक्का (6)' : 'Six (6)', cmd: 'six' },
          { label: selectedLang === 'mr-IN' ? 'वाईड बॉल' : selectedLang === 'hi-IN' ? 'वाइड' : 'Wide', cmd: 'wide' },
          { label: selectedLang === 'mr-IN' ? 'नो बॉल' : selectedLang === 'hi-IN' ? 'नो बॉल' : 'No ball', cmd: 'no ball' },
          { label: selectedLang === 'mr-IN' ? 'विकेट आउट' : selectedLang === 'hi-IN' ? 'आउट' : 'Wicket out', cmd: 'wicket' }
        ].map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              const res = parseCricketCommand(item.cmd, selectedLang);
              executeCommand(res);
            }}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold shrink-0 transition-colors border cursor-pointer ${
              item.isOverlay
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border-rose-500/30'
                : (item as any).isCompound
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border-amber-500/30'
                : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/60'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Voice Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Mic size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Voice-Activated Cricket Scorer Commands
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Supports Scoring, Match Events, and TV Broadcast Overlays in Marathi, Hindi, and English
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Command Table by Category */}
            <div className="space-y-3 text-xs">
              {/* TV Broadcast Graphic Overlays */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 p-3 rounded-xl border border-rose-500/30 shadow-md">
                <div className="font-black text-rose-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>📺 Voice-Activated Broadcast Overlays (टीव्ही ग्राफिक्स ओवरले)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">⚔️ Team vs Team Logo & Match Card</strong>
                    <span className="text-rose-300 block font-mono text-[10px] mt-0.5">"show team vs team logo"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "टीम विरुद्ध टीम लोगो दाखवा" / "दोन्ही टीमचा लोगो दाखवा"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "टीम बनाम टीम लोगो दिखाओ" / "मैच कार्ड दिखाओ"</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">📋 Both Teams Squad List / Playing 11</strong>
                    <span className="text-rose-300 block font-mono text-[10px] mt-0.5">"show the both team squad list"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "दोन्ही टीमची स्क्वॉड लिस्ट दाखवा" / "प्लेईंग ११ दाखवा"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "दोनों टीम की स्क्वाड लिस्ट दिखाओ" / "खिलाड़ियों की सूची दिखाओ"</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">🎯 Field Positions Overlay</strong>
                    <span className="text-cyan-300 block font-mono text-[10px] mt-0.5">"show field position"</span>
                    <span className="text-slate-400 block text-[10.5px]">"फील्डिंग पोझिशन दाखवा" / "फील्डिंग दिखाओ"</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">🧹 Dismiss / Hide Overlay</strong>
                    <span className="text-emerald-300 block font-mono text-[10px] mt-0.5">"hide overlay" / "clear graphics"</span>
                    <span className="text-slate-400 block text-[10.5px]">"स्क्रीन साफ करा" / "ओवरले बंद करा" / "ओवरले हटाओ"</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="font-black text-amber-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>🏏 Run Scoring (धावा)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <strong className="text-white block">Marathi:</strong>
                    <span className="text-slate-400">"एक रन", "दोन", "तीन", "चौकार", "सिक्स / षटकार"</span>
                  </div>
                  <div>
                    <strong className="text-white block">Hindi:</strong>
                    <span className="text-slate-400">"सिंगल / एक रन", "दो", "चौका", "छक्का"</span>
                  </div>
                  <div>
                    <strong className="text-white block">English:</strong>
                    <span className="text-slate-400">"One / Single", "Two", "Four / Boundary", "Six"</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="font-black text-indigo-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>⚪ Dot Balls (निर्धाव)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <strong className="text-white block">Marathi:</strong>
                    <span className="text-slate-400">"डॉट", "डॉट बॉल", "निर्धाव", "शून्य"</span>
                  </div>
                  <div>
                    <strong className="text-white block">Hindi:</strong>
                    <span className="text-slate-400">"डॉट गेंद", "खाली गेंद", "जीरो", "शून्य"</span>
                  </div>
                  <div>
                    <strong className="text-white block">English:</strong>
                    <span className="text-slate-400">"Dot", "Dot ball", "Zero runs", "Defense"</span>
                  </div>
                </div>
              </div>

              {/* Compound Calls Section */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-3 rounded-xl border border-amber-500/40 shadow-md">
                <div className="font-black text-amber-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>⚡ Compound Delivery Calls (No-Ball + Boundary / Wide + Runs)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950/90 rounded-lg border border-amber-500/20">
                    <strong className="text-white block flex items-center gap-1">🚨 No-Ball + Boundary / Runs (Free Hit Next)</strong>
                    <span className="text-amber-300 block font-mono text-[10px] mt-0.5">"no ball four" | "no ball six" | "no ball single"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "नो बॉल चौकार" | "नो बॉल षटकार" | "नो बॉल वर चौकार"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "नो बॉल चौका" | "नो बॉल छक्का" | "नो बॉल पर चार रन"</span>
                    <span className="text-emerald-400 block text-[9.5px] mt-1">✓ Adds 1 penalty + boundary to batsman + Free Hit!</span>
                  </div>
                  <div className="p-2 bg-slate-950/90 rounded-lg border border-amber-500/20">
                    <strong className="text-white block flex items-center gap-1">↔️ Wide + Boundary / Runs / Stumping</strong>
                    <span className="text-amber-300 block font-mono text-[10px] mt-0.5">"wide four" | "wide plus one" | "wide stumping"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "वाईड चौकार" | "वाईड आणि एक" | "वाईड स्टंपिंग"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "वाइड चौका" | "वाइड एक रन" | "वाइड स्टंप"</span>
                    <span className="text-emerald-400 block text-[9.5px] mt-1">✓ Adds 1 wide + extra runs (e.g., 5 total on wide four)!</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="font-black text-purple-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>⚡ Standard Extras: Wide, No-Ball, Byes (अवांतर)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <strong className="text-white block">Marathi:</strong>
                    <span className="text-slate-400">"वाईड", "नो बॉल", "बाय", "लेग बाय"</span>
                  </div>
                  <div>
                    <strong className="text-white block">Hindi:</strong>
                    <span className="text-slate-400">"वाइड", "नो बॉल", "बाई", "लेग बाई"</span>
                  </div>
                  <div>
                    <strong className="text-white block">English:</strong>
                    <span className="text-slate-400">"Wide", "No ball", "Byes", "Leg byes"</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="font-black text-rose-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>🔴 Dismissal / Wicket (बाद)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <strong className="text-white block">Marathi:</strong>
                    <span className="text-slate-400">"विकेट", "बाद", "बोल्ड", "झेल / कॅच", "रन आउट"</span>
                  </div>
                  <div>
                    <strong className="text-white block">Hindi:</strong>
                    <span className="text-slate-400">"विकेट", "आउट", "बोल्ड", "कैच आउट", "रन आउट"</span>
                  </div>
                  <div>
                    <strong className="text-white block">English:</strong>
                    <span className="text-slate-400">"Wicket", "Out", "Bowled", "Caught", "Run out"</span>
                  </div>
                </div>
              </div>

              {/* Batsmen, Openers & Bowler Changes */}
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 shadow-md">
                <div className="font-black text-emerald-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>👥 Voice Player Management: Batsmen, Openers & Bowlers</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">👑 Opening Pair (Match / Innings Start)</strong>
                    <span className="text-emerald-300 block font-mono text-[10px] mt-0.5">"openers Rohit and Virat"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "ओपनर रोहित आणि विराट" / "सलामी जोडी सचिन आणि सौरव"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "सलामी बल्लेबाज रोहित और विराट" / "ओपनर रोहित और विराट"</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">🏏 Striker & Non-Striker</strong>
                    <span className="text-emerald-300 block font-mono text-[10px] mt-0.5">"striker Rohit" | "non-striker Virat"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "स्ट्रायकर रोहित" | "नॉन स्ट्रायकर विराट"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "स्ट्राइकर रोहित" | "नॉन स्ट्राइकर विराट"</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">⚡ After Wicket: Incoming Batsman</strong>
                    <span className="text-amber-300 block font-mono text-[10px] mt-0.5">"new batsman Rahul" / "next batsman Surya"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "नवीन फलंदाज राहुल" / "नवीन बॅट्समन राहुल"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "नया बल्लेबाज राहुल" / "अगला बल्लेबाज राहुल"</span>
                  </div>
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <strong className="text-white block flex items-center gap-1">🎯 Over Finish / Next Bowler / Change</strong>
                    <span className="text-cyan-300 block font-mono text-[10px] mt-0.5">"new bowler Bumrah" / "change bowler Shami"</span>
                    <span className="text-slate-400 block text-[10.5px]">Marathi: "नवीन बॉलर बुमराह" / "पुढचा बॉलर शमी" / "गोलंदाज बुमराह"</span>
                    <span className="text-slate-400 block text-[10.5px]">Hindi: "नया गेंदबाज बुमराह" / "अगला गेंदबाज शमी" / "बॉलर बदलो सिराज"</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="font-black text-emerald-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>↩️ Control & Swaps</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <strong className="text-white block">Undo last ball:</strong>
                    <span className="text-slate-400">"Undo", "अनडू", "मागे घे", "वापस"</span>
                  </div>
                  <div>
                    <strong className="text-white block">Swap Striker:</strong>
                    <span className="text-slate-400">"Strike change", "स्ट्राइक बदला", "स्ट्राइक चेंज"</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer border-none transition-colors"
              >
                Got It, Start Scoring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
