import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Volume2, Sparkles, AlertCircle, HelpCircle, Check, X, Globe, Radio, ChevronDown, ChevronUp } from 'lucide-react';

export type VoiceLanguage = 'mr-IN' | 'hi-IN' | 'en-IN';

export interface VoiceScoreCommandResult {
  rawTranscript: string;
  detectedLang: VoiceLanguage;
  intent: 'runs' | 'dot' | 'wide' | 'noball' | 'wicket' | 'bye' | 'legbye' | 'undo' | 'swap_batsmen' | 'unknown';
  runs?: number;
  extraRuns?: number;
  wicketType?: 'bowled' | 'caught' | 'run_out' | 'lbw' | 'stumped' | 'hit_wicket';
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
  strikerName?: string;
  bowlerName?: string;
}

export const VoiceAssistedScorer: React.FC<VoiceAssistedScorerProps> = ({
  disabled = false,
  defaultCollapsed = true,
  onScoreRuns,
  onScoreDot,
  onScoreExtra,
  onScoreByes,
  onScoreWicket,
  onUndo,
  onSwapBatsmen,
  strikerName,
  bowlerName
}) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>('mr-IN');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [lastDetected, setLastDetected] = useState<VoiceScoreCommandResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const isManuallyStoppedRef = useRef<boolean>(false);
  const audioFeedbackRef = useRef(audioFeedback);
  audioFeedbackRef.current = audioFeedback;

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

  // Multi-lingual cricket intent parser
  const parseCricketCommand = useCallback((raw: string, lang: VoiceLanguage): VoiceScoreCommandResult => {
    const text = raw.toLowerCase().trim();

    // 1. WICKET COMMANDS
    // Marathi: विकेट, बाद, आउट, बोल्ड, झेल, रन आउट
    // Hindi: विकेट, आउट, बोल्ड, कैच, रन आउट
    // English: wicket, out, bowled, caught, run out, stumped, lbw, dismissed
    if (
      text.includes('wicket') || text.includes('out') || text.includes('विक') || 
      text.includes('बाद') || text.includes('आउट') || text.includes('बोल्ड') ||
      text.includes('bowled') || text.includes('caught') || text.includes('catch') || 
      text.includes('झेल') || text.includes('कैच') || text.includes('stump') || 
      text.includes('रन आउट') || text.includes('run out') || text.includes('lbw') ||
      text.includes('क्लीन बोल्ड')
    ) {
      let wicketType: VoiceScoreCommandResult['wicketType'] = 'caught';
      if (text.includes('bold') || text.includes('bowled') || text.includes('बोल्ड')) wicketType = 'bowled';
      else if (text.includes('run out') || text.includes('रन आउट')) wicketType = 'run_out';
      else if (text.includes('stump') || text.includes('स्टंप')) wicketType = 'stumped';
      else if (text.includes('lbw') || text.includes('एलपीडब्ल्यू')) wicketType = 'lbw';
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

    // 2. UNDO COMMAND
    // Marathi/Hindi/English: अनडू, मागे घे, वापस, undo, revert, cancel last ball
    if (
      text.includes('undo') || text.includes('अनडू') || text.includes('मागे') || 
      text.includes('वापस') || text.includes('cancel ball') || text.includes('रद्द')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'undo',
        confidence: 0.9,
        explanation: 'Undo previous ball'
      };
    }

    // 3. STRIKE ROTATION / SWAP BATSMEN
    if (
      text.includes('swap') || text.includes('स्ट्राइक बदला') || text.includes('स्ट्राइक चेंज') || 
      text.includes('strike change') || text.includes('rotate strike')
    ) {
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'swap_batsmen',
        confidence: 0.9,
        explanation: 'Swap Striker & Non-Striker'
      };
    }

    // 4. WIDE BALL COMMANDS (Wide, Wide + 1, Wide + 4, etc.)
    // Marathi: वाईड, व्हाईड, वाईड बॉल, वाईड आणि एक, वाईड चौकार
    // Hindi: वाइड, वाइड बॉल, वाइड एक रन, वाइड चार
    // English: wide, wide ball, wide plus one, wide four
    if (text.includes('wide') || text.includes('वाईड') || text.includes('व्हाईड') || text.includes('वाइड')) {
      let extraRuns = 0;
      if (text.includes('4') || text.includes('four') || text.includes('चार') || text.includes('चौका')) extraRuns = 4;
      else if (text.includes('1') || text.includes('one') || text.includes('एक') || text.includes('single') || text.includes('सिंगल')) extraRuns = 1;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो') || text.includes('double')) extraRuns = 2;
      else if (text.includes('3') || text.includes('three') || text.includes('तीन')) extraRuns = 3;

      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'wide',
        extraRuns,
        confidence: 0.92,
        explanation: extraRuns > 0 ? `Wide + ${extraRuns} run(s)` : 'Wide Ball (+1)'
      };
    }

    // 5. NO BALL COMMANDS (No ball, No ball + 4, No ball + 6, Free Hit)
    // Marathi: नो बॉल, नोबॉल, नो बॉल चौकार, नो बॉल षटकार
    // Hindi: नो बॉल, नोबाल, नो बॉल चार, नो बॉल छक्का
    // English: no ball, no-ball, noball, no ball four, no ball six
    if (text.includes('no ball') || text.includes('noball') || text.includes('नो बॉल') || text.includes('नोबॉल') || text.includes('नो बाल')) {
      let extraRuns = 0;
      if (text.includes('6') || text.includes('six') || text.includes('सहा') || text.includes('छक्का') || text.includes('षटकार')) extraRuns = 6;
      else if (text.includes('4') || text.includes('four') || text.includes('चार') || text.includes('चौका') || text.includes('चौकार')) extraRuns = 4;
      else if (text.includes('1') || text.includes('one') || text.includes('एक') || text.includes('single') || text.includes('सिंगल')) extraRuns = 1;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) extraRuns = 2;
      else if (text.includes('3') || text.includes('three') || text.includes('तीन')) extraRuns = 3;

      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'noball',
        extraRuns,
        confidence: 0.92,
        explanation: extraRuns > 0 ? `No Ball + ${extraRuns} run(s) [Free Hit]` : 'No Ball (+1) [Free Hit]'
      };
    }

    // 6. BYE / LEG-BYE COMMANDS
    if (text.includes('leg bye') || text.includes('legbye') || text.includes('लेग बाय') || text.includes('लेगबाई')) {
      let runs = 1;
      if (text.includes('4') || text.includes('four') || text.includes('चार')) runs = 4;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) runs = 2;
      else if (text.includes('3') || text.includes('three') || text.includes('तीन')) runs = 3;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'legbye',
        runs,
        confidence: 0.9,
        explanation: `Leg-Bye +${runs}`
      };
    }

    if (text.includes('bye') || text.includes('बाय') || text.includes('बाई')) {
      let runs = 1;
      if (text.includes('4') || text.includes('four') || text.includes('चार')) runs = 4;
      else if (text.includes('2') || text.includes('two') || text.includes('दोन') || text.includes('दो')) runs = 2;
      else if (text.includes('3') || text.includes('three') || text.includes('तीन')) runs = 3;
      return {
        rawTranscript: raw,
        detectedLang: lang,
        intent: 'bye',
        runs,
        confidence: 0.9,
        explanation: `Bye +${runs}`
      };
    }

    // 7. DOT BALL COMMANDS
    // Marathi: डॉट, निर्धाव, शून्य, काही नाही, डॉट बॉल
    // Hindi: डॉट, खाली, शून्य, डॉट बॉल
    // English: dot, dot ball, zero, no run, defense
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

    // 8. BOUNDARY RUNS: SIX (6)
    // Marathi: षटकार, सिक्स, सहा रन, छक्का
    // Hindi: छक्का, सिक्स, छह रन
    // English: six, maximum, out of ground, sixer
    if (
      text.includes('six') || text.includes('sixer') || text.includes('षटकार') || 
      text.includes('छक्का') || text.includes('सहा') || text.includes('छह') || 
      text.includes('सिक्स') || text.includes('maximum') || text === '6'
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

    // 9. BOUNDARY RUNS: FOUR (4)
    // Marathi: चौकार, चार रन, फोर
    // Hindi: चौका, चार रन, चौकार
    // English: four, boundary, four runs
    if (
      text.includes('four') || text.includes('चौकार') || text.includes('चौका') || 
      text.includes('चार') || text.includes('फोर') || text.includes('boundary') || text === '4'
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

    // 10. SINGLE & RUN CHECKS (1, 2, 3)
    // Single / 1
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

    // Double / 2
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

    // Three / 3
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
        speakFeedback(selectedLang === 'mr-IN' ? 'वाईड बॉल' : selectedLang === 'hi-IN' ? 'वाइड गेंद' : 'Wide ball', selectedLang);
        setStatusMessage(`✅ Wide Ball (+${1 + (res.extraRuns || 0)} total) recorded!`);
        break;

      case 'noball':
        onScoreExtra('noball', res.extraRuns || 0);
        speakFeedback(selectedLang === 'mr-IN' ? 'नो बॉल, पुढची फ्री हिट' : selectedLang === 'hi-IN' ? 'नो बॉल, फ्री हिट' : 'No ball, free hit next', selectedLang);
        setStatusMessage(`✅ No Ball (+${1 + (res.extraRuns || 0)}) recorded with Free Hit!`);
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

      default:
        setStatusMessage(`⚠️ Not recognized: "${res.rawTranscript}". Try saying: "चार रन", "छक्का", "Dot", or "Wicket".`);
        break;
    }
  }, [selectedLang, onScoreDot, onScoreRuns, onScoreExtra, onScoreByes, onScoreWicket, onUndo, onSwapBatsmen, speakFeedback]);

  // Initialize and handle Speech Recognition
  const startListening = useCallback(() => {
    if (disabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      setStatusMessage('Voice recognition is not supported in this browser. Please use Chrome/Edge or Android Chrome.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang;
      recognition.continuous = continuousMode;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      isManuallyStoppedRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
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
          const result = parseCricketCommand(final, selectedLang);
          executeCommand(result);
          // clear transcript after a short display
          setTimeout(() => setLiveTranscript(''), 2000);
        }
      };

      recognition.onerror = (event: any) => {
        console.debug('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setStatusMessage('Microphone permission blocked. Please allow microphone access in browser settings.');
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
      setStatusMessage('Could not start voice service: ' + (err.message || 'Check microphone'));
    }
  }, [disabled, selectedLang, continuousMode, parseCricketCommand, executeCommand]);

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
            title={isListening ? 'Click to Stop Voice' : 'Click to Speak (e.g. "4", "Wide", "Out")'}
          >
            {isListening ? <MicOff size={11} className="animate-spin" /> : <Mic size={11} />}
            <span>{isListening ? 'Mic ON' : '🎙️ Voice'}</span>
          </button>
          
          <div className="text-[9px] text-slate-300 truncate font-medium flex-1 min-w-0">
            {liveTranscript ? (
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
          {liveTranscript ? (
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

      {/* Quick Voice Chips (Clickable fallback & prompt cheat triggers) */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest shrink-0 mr-1">
          Try saying:
        </span>
        {[
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
            className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[9px] font-bold shrink-0 transition-colors border border-slate-700/60 cursor-pointer"
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
                    Supports Marathi, Hindi, and English regional cricket commentary terms
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

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850">
                <div className="font-black text-purple-400 text-xs mb-1.5 flex items-center gap-1.5">
                  <span>⚡ Extras: Wide & No-Ball (अवांतर)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <strong className="text-white block">Marathi:</strong>
                    <span className="text-slate-400">"वाईड", "वाईड आणि एक", "नो बॉल", "नो बॉल चौकार"</span>
                  </div>
                  <div>
                    <strong className="text-white block">Hindi:</strong>
                    <span className="text-slate-400">"वाइड", "वाइड एक रन", "नो बॉल", "नो बॉल छक्का"</span>
                  </div>
                  <div>
                    <strong className="text-white block">English:</strong>
                    <span className="text-slate-400">"Wide", "Wide plus one", "No ball", "No ball four"</span>
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
