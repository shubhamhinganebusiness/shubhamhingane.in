import React, { useState, useEffect } from 'react';

export type CommentaryLanguage = 'mr' | 'hi' | 'en';

export interface CommentaryTranslations {
  en?: string;
  hi?: string;
  mr?: string;
}

export interface CommentaryWithTranslations {
  id?: string;
  overBall?: string;
  description: string;
  type?: string;
  translations?: CommentaryTranslations;
  [key: string]: any;
}

export const COMMENTARY_LANGUAGES: { id: CommentaryLanguage; label: string; name: string; nativeName: string; flag: string }[] = [
  { id: 'mr', label: 'मराठी', name: 'Marathi', nativeName: 'मराठी', flag: '🚩' },
  { id: 'hi', label: 'हिंदी', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { id: 'en', label: 'English', name: 'English', nativeName: 'English', flag: '🌐' },
];

const STORAGE_KEY = 'gullyscore_user_commentary_lang';

export function getStoredCommentaryLanguage(): CommentaryLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mr' || saved === 'hi' || saved === 'en') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function setStoredCommentaryLanguage(lang: CommentaryLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('gullyscore:language_changed', { detail: { language: lang } }));
  } catch {
    // ignore
  }
}

/**
 * Hook to subscribe to commentary language changes across the app
 */
export function useCommentaryLanguage(defaultLang?: CommentaryLanguage): [CommentaryLanguage, (lang: CommentaryLanguage) => void] {
  const [lang, setLang] = useState<CommentaryLanguage>(() => defaultLang || getStoredCommentaryLanguage());

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: CommentaryLanguage }>;
      if (customEvent.detail?.language) {
        setLang(customEvent.detail.language);
      }
    };

    window.addEventListener('gullyscore:language_changed', handleLangChange);
    return () => {
      window.removeEventListener('gullyscore:language_changed', handleLangChange);
    };
  }, []);

  const changeLanguage = (newLang: CommentaryLanguage) => {
    setLang(newLang);
    setStoredCommentaryLanguage(newLang);
  };

  return [lang, changeLanguage];
}

/**
 * Intelligent client-side phrase translator for cricket commentary
 */
export function translateCommentaryText(text: string, lang: CommentaryLanguage): string {
  if (!text) return '';
  if (lang === 'en') return text;

  const trimmed = text.trim();

  // Pattern: "After wicket fell, [Name] new batsman come on crease."
  const afterWicketMatch = trimmed.match(/After wicket fell,\s*([^.]+?)\s*(?:new batsman come on crease|new batsman came on crease)/i);
  if (afterWicketMatch) {
    const newBat = afterWicketMatch[1].trim();
    if (lang === 'mr') {
      return trimmed.replace(
        /After wicket fell,\s*([^.]+?)\s*(?:new batsman come on crease|new batsman came on crease)\.?/i,
        `विकेट पडल्यानंतर, ${newBat} नवीन फलंदाज क्रीजवर आले आहेत.`
      );
    } else if (lang === 'hi') {
      return trimmed.replace(
        /After wicket fell,\s*([^.]+?)\s*(?:new batsman come on crease|new batsman came on crease)\.?/i,
        `विकेट गिरने के बाद, ${newBat} नए बल्लेबाज क्रीज पर आए हैं.`
      );
    }
  }

  // Pattern: "[Bat1] and [Bat2] new batsman are come on crease and [Bowler] will bowl the first over. Target: [Target] runs."
  const startMatch = trimmed.match(/(.+?)\s+and\s+(.+?)\s+new batsman are come on crease and\s+(.+?)\s+will bowl the first over(?:\.\s*Target:\s*(\d+)\s*runs)?/i);
  if (startMatch) {
    const b1 = startMatch[1].trim();
    const b2 = startMatch[2].trim();
    const bowl = startMatch[3].trim();
    const target = startMatch[4];

    if (lang === 'mr') {
      const targetStr = target ? ` लक्ष्य: ${target} धावा.` : '';
      return `${b1} आणि ${b2} नवीन फलंदाज क्रीजवर आले आहेत आणि ${bowl} पहिले षटक टाकणार आहे.${targetStr}`;
    } else if (lang === 'hi') {
      const targetStr = target ? ` लक्ष्य: ${target} रन.` : '';
      return `${b1} और ${b2} नए बल्लेबाज क्रीज पर आए हैं और ${bowl} पहला ओवर फेंकेंगे.${targetStr}`;
    }
  }

  // Pattern: "Bowler to Batsman: Outcome"
  const deliveryMatch = trimmed.match(/^([^:]+?)\s+to\s+([^:]+?):\s*(.+)$/i);
  if (deliveryMatch) {
    const bowler = deliveryMatch[1].trim();
    const batsman = deliveryMatch[2].trim();
    const outcome = deliveryMatch[3].trim();

    if (lang === 'mr') {
      let outcomeMr = outcome;
      if (/dot ball|no run|0 run/i.test(outcome)) outcomeMr = 'निर्धाव चेंडू, कोणतीही धाव नाही.';
      else if (/six|6 runs/i.test(outcome)) outcomeMr = 'उत्तुंग षटकार! चेंडू सीमारेषेबाहेर ६ धावांसाठी!';
      else if (/four|4 runs/i.test(outcome)) outcomeMr = 'खणखणीत चौकार! सुरेख फटका ४ धावांसाठी!';
      else if (/single|1 run/i.test(outcome)) outcomeMr = 'चपळाईने १ धाव पूर्ण केली.';
      else if (/two runs|2 runs/i.test(outcome)) outcomeMr = 'चांगल्या रनिंगने २ धावा पूर्ण केल्या.';
      else if (/three runs|3 runs/i.test(outcome)) outcomeMr = 'उत्कृष्ट रनिंग, ३ धावा पूर्ण.';
      else if (/wide/i.test(outcome)) outcomeMr = 'वाईड चेंडू, अतिरिक्त धाव.';
      else if (/no[- ]?ball/i.test(outcome)) outcomeMr = 'नो बॉल! पुढचा चेंडू फ्री हिट!';
      else if (/wicket|out|bowled|caught/i.test(outcome)) outcomeMr = 'आऊट! मोठा धक्का, फलंदाज बाद!';
      return `${bowler} चा ${batsman} ला चेंडू: ${outcomeMr}`;
    } else if (lang === 'hi') {
      let outcomeHi = outcome;
      if (/dot ball|no run|0 run/i.test(outcome)) outcomeHi = 'डॉट गेंद, कोई रन नहीं.';
      else if (/six|6 runs/i.test(outcome)) outcomeHi = 'गगनचुंबी छक्का! गेंद दर्शकों के बीच ६ रन के लिए!';
      else if (/four|4 runs/i.test(outcome)) outcomeHi = 'शानदार चौका! गोली की रफ्तार से गेंद सीमा पार ४ रन!';
      else if (/single|1 run/i.test(outcome)) outcomeHi = 'हल्के हाथों से खेलकर १ रन पूरा किया.';
      else if (/two runs|2 runs/i.test(outcome)) outcomeHi = 'अच्छी दौड़, २ रन पूरे किए.';
      else if (/three runs|3 runs/i.test(outcome)) outcomeHi = 'तेज दौड़ लगाकर ३ रन बनाए.';
      else if (/wide/i.test(outcome)) outcomeHi = 'वाइड गेंद, अतिरिक्त रन मिला.';
      else if (/no[- ]?ball/i.test(outcome)) outcomeHi = 'नो बॉल! अगली गेंद फ्री हिट!';
      else if (/wicket|out|bowled|caught/i.test(outcome)) outcomeHi = 'आउट! बड़ा झटका, बल्लेबाज पवेलियन लौटे!';
      return `${bowler} की ${batsman} को गेंद: ${outcomeHi}`;
    }
  }

  // Common phrase replacements for general text
  if (lang === 'mr') {
    let res = trimmed;
    res = res.replace(/FOUR!/g, 'खणखणीत चौकार! ')
      .replace(/SIX!/g, 'उत्तुंग षटकार! ')
      .replace(/OUT!/g, 'आऊट! ')
      .replace(/DOT BALL!/g, 'निर्धाव चेंडू! ')
      .replace(/Target:\s*(\d+)\s*runs/gi, 'लक्ष्य: $1 धावा')
      .replace(/needs?\s+(\d+)\s+runs/gi, '$1 धावांची गरज')
      .replace(/off\s+(\d+)\s+balls/gi, '$1 चेंडूत')
      .replace(/Target Achieved!/gi, 'लक्ष्य पूर्ण झाले!')
      .replace(/Innings declared/gi, 'डाव घोषित करण्यात आला')
      .replace(/Free[- ]?Hit/gi, 'फ्री हिट')
      .replace(/Wide ball/gi, 'वाईड चेंडू')
      .replace(/No ball/gi, 'नो बॉल');
    return res;
  }

  if (lang === 'hi') {
    let res = trimmed;
    res = res.replace(/FOUR!/g, 'शानदार चौका! ')
      .replace(/SIX!/g, 'गगनचुंबी छक्का! ')
      .replace(/OUT!/g, 'आउट! ')
      .replace(/DOT BALL!/g, 'डॉट गेंद! ')
      .replace(/Target:\s*(\d+)\s*runs/gi, 'लक्ष्य: $1 रन')
      .replace(/needs?\s+(\d+)\s+runs/gi, '$1 रन की जरूरत')
      .replace(/off\s+(\d+)\s+balls/gi, '$1 गेंदों में')
      .replace(/Target Achieved!/gi, 'लक्ष्य हासिल कर लिया!')
      .replace(/Innings declared/gi, 'पारी घोषित की गई')
      .replace(/Free[- ]?Hit/gi, 'फ्री हिट')
      .replace(/Wide ball/gi, 'वाइड गेंद')
      .replace(/No ball/gi, 'नो बॉल');
    return res;
  }

  return trimmed;
}

/**
 * Extracts commentary description in the user's selected language
 */
export function getCommentaryText(
  comm?: CommentaryWithTranslations | null,
  lang?: CommentaryLanguage
): string {
  if (!comm) return '';
  const currentLang = lang || getStoredCommentaryLanguage();

  // 1. Direct translation matching
  if (comm.translations) {
    if (currentLang === 'mr' && comm.translations.mr && comm.translations.mr.trim()) {
      return comm.translations.mr;
    }
    if (currentLang === 'hi' && comm.translations.hi && comm.translations.hi.trim()) {
      return comm.translations.hi;
    }
    if (currentLang === 'en' && comm.translations.en && comm.translations.en.trim()) {
      return comm.translations.en;
    }
  }

  // 2. Custom field fallback (e.g. description_mr, commentary_hi)
  if (currentLang === 'mr' && (comm.description_mr || comm.commentary_mr)) {
    return comm.description_mr || comm.commentary_mr;
  }
  if (currentLang === 'hi' && (comm.description_hi || comm.commentary_hi)) {
    return comm.description_hi || comm.commentary_hi;
  }
  if (currentLang === 'en' && (comm.description_en || comm.commentary_en)) {
    return comm.description_en || comm.commentary_en;
  }

  const baseDesc = comm.description || '';
  if (currentLang === 'en') return baseDesc;

  // 3. Smart translator fallback for unilingual records
  return translateCommentaryText(baseDesc, currentLang);
}

/**
 * Builds a multilingual commentary record
 */
export function createMultilingualCommentary(
  enText: string,
  hiText?: string,
  mrText?: string
): { en: string; hi: string; mr: string } {
  return {
    en: enText,
    hi: hiText && hiText.trim() ? hiText : translateCommentaryText(enText, 'hi'),
    mr: mrText && mrText.trim() ? mrText : translateCommentaryText(enText, 'mr'),
  };
}

/**
 * Reusable Language Selector Component
 */
export interface CommentaryLanguageSelectorProps {
  currentLang?: CommentaryLanguage;
  onLanguageChange?: (lang: CommentaryLanguage) => void;
  variant?: 'pills' | 'compact' | 'select' | 'header';
  className?: string;
}

export const CommentaryLanguageSelector: React.FC<CommentaryLanguageSelectorProps> = ({
  currentLang: propLang,
  onLanguageChange,
  variant = 'pills',
  className = '',
}) => {
  const [internalLang, setInternalLang] = useCommentaryLanguage();
  const activeLang = propLang || internalLang;

  const handleSelect = (lang: CommentaryLanguage) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    setInternalLang(lang);
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shadow-sm ${className}`}>
        {COMMENTARY_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => handleSelect(l.id)}
            title={`Commentary: ${l.name} (${l.nativeName})`}
            className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded transition-all cursor-pointer border-none flex items-center gap-1 ${
              activeLang === l.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 shadow-inner ${className}`}>
        <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 px-1.5">
          Commentary:
        </span>
        {COMMENTARY_LANGUAGES.map((l) => {
          const isActive = activeLang === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => handleSelect(l.id)}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-extrabold tracking-wide transition-all border-none cursor-pointer flex items-center gap-1 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm scale-102'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-800/50'
              }`}
            >
              <span className="text-[11px]">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default pills
  return (
    <div className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm ${className}`}>
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        Language:
      </span>
      {COMMENTARY_LANGUAGES.map((l) => {
        const isActive = activeLang === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => handleSelect(l.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border-none cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================================
 * 1. CONTEXTUAL TONE SHIFTER: DYNAMIC MATCH SITUATION COMMENTARY STYLE
 * ========================================================================= */

export type MatchContextualTone = 
  | 'HIGH_THRILLER'     // Final overs chasing with high RRR or razor-thin margin
  | 'ANALYTICAL_DRY'    // Middle overs consolidation, explaining field placements & tactics
  | 'CARNAGE_EXPLOSIVE' // Boundaries raining down, high run rate explosion
  | 'TENSE_COLLAPSE'    // Multiple wickets fell quickly, rebuilding phase
  | 'BALANCED_CRICKET'; // Steady rhythm of play

export interface ContextualToneInfo {
  tone: MatchContextualTone;
  label: { en: string; hi: string; mr: string };
  shortTag: string;
  badgeClass: string;
  borderClass: string;
  pulse: boolean;
  description: { en: string; hi: string; mr: string };
  commentaryInstruction: string;
}

/**
 * Evaluates the live match equation and returns the contextual tone and style guidelines.
 */
export function getMatchContextualTone(
  match: { oversLimit?: number; currentInningsNum?: number; targetRuns?: number | null } | null | undefined,
  innings: { runs: number; wickets: number; ballsBowled: number; commentaryList?: any[] } | null | undefined
): ContextualToneInfo {
  if (!match || !innings) {
    return {
      tone: 'BALANCED_CRICKET',
      label: { en: 'Balanced Contest', hi: 'संतुलित मुकाबला', mr: 'संतुलित लढत' },
      shortTag: '🏏 LIVE MATCH',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      borderClass: 'border-emerald-500/30',
      pulse: false,
      description: {
        en: 'Match is underway in balanced conditions.',
        hi: 'मैच सामान्य और संतुलित स्थिति में जारी है.',
        mr: 'सामना संतुलित आणि चुरशीच्या वातावरणात सुरू आहे.'
      },
      commentaryInstruction: 'BALANCED: Classic, engaging gully cricket commentary.'
    };
  }

  const oversLimit = match.oversLimit || 10;
  const totalBalls = oversLimit * 6;
  const ballsBowled = innings.ballsBowled || 0;
  const ballsLeft = Math.max(0, totalBalls - ballsBowled);
  const oversBowled = ballsBowled / 6;
  const crr = ballsBowled > 0 ? (innings.runs / ballsBowled) * 6 : 0;
  const isChasing = match.currentInningsNum === 2 && typeof match.targetRuns === 'number' && match.targetRuns > 0;
  const runsNeeded = isChasing ? Math.max(0, (match.targetRuns || 0) - innings.runs) : 0;
  const rrr = (isChasing && ballsLeft > 0) ? (runsNeeded / ballsLeft) * 6 : 0;

  const recentList = (innings.commentaryList || []).slice(0, 6);
  const recentWickets = recentList.filter(c => c.type === 'wicket').length;
  const recentBoundaries = recentList.filter(c => c.type === 'boundary').length;

  // 1. HIGH THRILLER:
  // Death overs (ballsLeft <= 18) when chasing with high RRR (>= 7.5 or tight equation <= 36 runs needed in 18 balls)
  // OR first innings final 2 overs (ballsLeft <= 12)
  if (
    (isChasing && ballsLeft <= 18 && ballsLeft > 0 && runsNeeded > 0) ||
    (isChasing && rrr >= 9.5 && ballsLeft <= 24 && ballsLeft > 0) ||
    (!isChasing && ballsLeft <= 12 && ballsLeft > 0 && ballsBowled >= 12)
  ) {
    return {
      tone: 'HIGH_THRILLER',
      label: {
        en: 'High Thriller',
        hi: 'हाई थ्रिलर (रोमांचक)',
        mr: 'हाय थ्रिलर (अत्यंत रोमांचक)'
      },
      shortTag: '⚡ HIGH THRILLER',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      borderClass: 'border-rose-500/50',
      pulse: true,
      description: {
        en: isChasing 
          ? `Final overs thriller! Need ${runsNeeded} runs in ${ballsLeft} balls (RRR: ${rrr.toFixed(1)}). Fast-paced, heart-stopping intensity!`
          : `Death overs crescendo! Only ${ballsLeft} balls left in the innings. Slogfest underway!`,
        hi: isChasing
          ? `अंतिम ओवरों का रोमांच! ${ballsLeft} गेंदों में ${runsNeeded} रन चाहिए (जरूरी रन रेट: ${rrr.toFixed(1)}). सांसें थाम देने वाला मुकाबला!`
          : `डेथ ओव्हर्सचा थरार! डावात फक्त ${ballsLeft} चेंडू बाकी, चौकार-षटकारांची आतषबाजी!`,
        mr: isChasing
          ? `शेवटच्या षटकांचा थरार! ${ballsLeft} चेंडूत ${runsNeeded} धावा हव्या आहेत (आवश्यक सरासरी: ${rrr.toFixed(1)}). अंगावर काटा आणणारा क्षण!`
          : `डेथ ओव्हर्सचा थरार! फक्त ${ballsLeft} चेंडू शिल्लक, फलंदाजांचा तुफानी मारा!`
      },
      commentaryInstruction: 'HIGH THRILLER: Fast-paced, breathless, exclamation-heavy commentary! Emphasize the run rate pressure, the crowd tension, edge-of-seat drama, and life-or-death gully cricket intensity.'
    };
  }

  // 2. TENSE COLLAPSE / REBUILDING:
  // Multiple wickets fell recently (>= 2 in last 6 balls) or 4+ wickets down with low score
  if (recentWickets >= 2 || (innings.wickets >= 4 && innings.runs < 50)) {
    return {
      tone: 'TENSE_COLLAPSE',
      label: {
        en: 'High Pressure / Rebuilding',
        hi: 'दबाव और संघर्ष',
        mr: 'दबाव आणि सावध खेळी'
      },
      shortTag: '⚠️ PRESSURE',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      borderClass: 'border-amber-500/50',
      pulse: false,
      description: {
        en: `${innings.wickets} wickets down. Batters are consolidating and building a defense under heavy pressure.`,
        hi: `${innings.wickets} विकेट गिर चुके हैं. बल्लेबाज भारी दबाव में संभलकर पारी संभालने की कोशिश में हैं.`,
        mr: `${innings.wickets} गडी बाद. फलंदाज प्रचंड दबावात डावाला आकार देण्याचा सावध प्रयत्न करत आहेत.`
      },
      commentaryInstruction: 'TENSE COLLAPSE: Solemn, cautious, and focused on recovery. Describe the fielding cordon, close-in catchers, defensive blocks, and high tension.'
    };
  }

  // 3. CARNAGE EXPLOSIVE:
  // Boundaries raining down (3+ boundaries in last 6 balls or CRR >= 11)
  if (recentBoundaries >= 3 || crr >= 11.0) {
    return {
      tone: 'CARNAGE_EXPLOSIVE',
      label: {
        en: 'Explosive Carnage',
        hi: 'धमाकेदार बल्लेबाजी',
        mr: 'तुफानी फटकेबाजी'
      },
      shortTag: '💥 CARNAGE',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      borderClass: 'border-purple-500/50',
      pulse: true,
      description: {
        en: `Pure batting demolition! Current run rate has skyrocketed to ${crr.toFixed(1)}. Balls flying into adjacent roofs!`,
        hi: `तूफानी बल्लेबाजी का कहर! रन रेट ${crr.toFixed(1)} पर पहुंच गया है. गेंदें छतों पर जा रही हैं!`,
        mr: `तुफानी फटकेबाजीचा तडाखा! धावगती ${crr.toFixed(1)} वर पोहोचली आहे. चेंडू थेट घरांच्या छतावर!`
      },
      commentaryInstruction: 'EXPLOSIVE CARNAGE: Electrifying, explosive, and awe-struck. The bowler has no answers as the batter dismantles the attack with colossal hits.'
    };
  }

  // 4. ANALYTICAL / DRY:
  // Middle overs (overs >= 2 and ballsLeft > 18) with steady pace, explaining field placements & tactical shifts
  if (oversBowled >= 2 && ballsLeft > 18) {
    return {
      tone: 'ANALYTICAL_DRY',
      label: {
        en: 'Analytical / Tactical',
        hi: 'रणनीतिक विश्लेषण',
        mr: 'रणनीती व विश्लेषण'
      },
      shortTag: '🧠 TACTICAL',
      badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      borderClass: 'border-sky-500/50',
      pulse: false,
      description: {
        en: `Middle overs consolidation (Over ${oversBowled.toFixed(1)}). Captain shifting the field to plug the gaps while spinners apply the squeeze.`,
        hi: `मध्यम ओवरों की रणनीति (ओवर ${oversBowled.toFixed(1)}). कप्तान फील्डिंग बदल रहे हैं और सिंगल रोकने का जाल बिछा रहे हैं.`,
        mr: `मधल्या षटकांचे डावपेच (षटक ${oversBowled.toFixed(1)}). कर्णधार क्षेत्ररक्षणात बदल करत असून धावा रोखण्यासाठी जाळे विणले जात आहे.`
      },
      commentaryInstruction: 'ANALYTICAL / DRY: Explaining field placements (deep covers, mid-wicket, fine leg), line-and-length discipline, ring field, bowler traps, strike rotation, and run containment strategies.'
    };
  }

  // 5. BALANCED CONTEST
  return {
    tone: 'BALANCED_CRICKET',
    label: {
      en: 'Balanced Contest',
      hi: 'संतुलित मुकाबला',
      mr: 'संतुलित लढत'
    },
    shortTag: '🏏 MATCH IN BALANCE',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    borderClass: 'border-emerald-500/50',
    pulse: false,
    description: {
      en: 'Both bat and ball finding their rhythm. Batters rotating the strike and bowlers probing the corridor.',
      hi: 'बल्ले और गेंद के बीच बराबरी का मुकाबला. सिंगल चुराए जा रहे हैं और गेंदबाज सही लाइन पर लगे हैं.',
      mr: 'फलंदाजी आणि गोलंदाजीत चुरस. फलंदाज स्ट्राईक रोटेट करत असून गोलंदाज अचूक टप्प्यावर मारा करत आहेत.'
    },
    commentaryInstruction: 'BALANCED: Classic, engaging gully cricket commentary balancing bowling discipline with agile running between wickets.'
  };
}

/* =========================================================================
 * 2. AUTOMATIC BATSMAN & BOWLER ANNOUNCEMENTS
 * ========================================================================= */

/**
 * Generates an automatic announcement in the commentary box whenever a new batsman is added or takes guard
 */
export function createBatsmanAnnouncement(
  batsmanName: string,
  overBall: string,
  options?: {
    partnerName?: string;
    dismissedBatterName?: string;
    isWicketFall?: boolean;
    role?: 'striker' | 'non-striker';
  }
): CommentaryWithTranslations {
  const name = batsmanName.trim() || 'New Batsman';
  const dismissed = options?.dismissedBatterName ? options.dismissedBatterName.trim() : '';
  const partner = options?.partnerName ? options.partnerName.trim() : '';

  let en = '';
  let hi = '';
  let mr = '';

  if (options?.isWicketFall && dismissed) {
    en = `📢 NEW BATSMAN ON CREASE: ${name} walks out to the middle following the dismissal of ${dismissed}${partner ? ` to join ${partner}` : ''}. High expectations rest on this new pair!`;
    hi = `📢 नए बल्लेबाज क्रीज पर: ${dismissed} के आउट होने के बाद ${name} मैदान पर आए हैं${partner ? ` और ${partner} का साथ निभाएंगे` : ''}. इस नई साझेदारी पर सभी की निगाहें!`;
    mr = `📢 नवीन फलंदाज क्रीजवर: ${dismissed} बाद झाल्यानंतर ${name} मैदानात दाखल झाले आहेत${partner ? ` आणि ${partner} ची साथ देतील` : ''}. या नवीन जोडीकडून मोठ्या अपेक्षा!`;
  } else {
    en = `📢 NEW BATSMAN ON CREASE: ${name} arrives at the crease to take guard${partner ? ` alongside ${partner}` : ''}!`;
    hi = `📢 नए बल्लेबाज क्रीज पर: ${name} बल्लेबाजी के लिए क्रीज पर आ चुके हैं${partner ? ` और साथी खिलाड़ी ${partner} के साथ तैयार हैं` : ''}!`;
    mr = `📢 नवीन फलंदाज क्रीजवर: ${name} फलंदाजीसाठी मैदानात सज्ज झाले आहेत${partner ? ` आणि साथीदार ${partner} सोबत खेळतील` : ''}!`;
  }

  return {
    id: `comm-bat-announcement-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    overBall,
    description: en,
    type: 'milestone',
    announcementType: 'new_batsman',
    playerName: name,
    translations: { en, hi, mr }
  };
}

/**
 * Generates an automatic announcement in the commentary box whenever a bowler is brought into the attack
 */
export function createBowlerAnnouncement(
  bowlerName: string,
  overBall: string,
  options?: {
    isNewOver?: boolean;
    facingBatsmanName?: string;
  }
): CommentaryWithTranslations {
  const name = bowlerName.trim() || 'Bowler';
  const batter = options?.facingBatsmanName ? options.facingBatsmanName.trim() : '';

  let en = '';
  let hi = '';
  let mr = '';

  if (options?.isNewOver) {
    en = `📢 BOWLING CHANGE: ${name} takes the ball for over ${overBall}${batter ? ` to bowl against ${batter}` : ''}! Fresh energy into the bowling attack.`;
    hi = `📢 गेंदबाजी में बदलाव: ${name} ओवर ${overBall} के लिए गेंदबाजी आक्रमण की कमान संभाल रहे हैं${batter ? ` सामने हैं ${batter}` : ''}! नई ऊर्जा के साथ गेंदबाजी!`;
    mr = `📢 गोलंदाजीत बदल: ${name} षटक ${overBall} टाकण्यासाठी सज्ज झाले आहेत${batter ? ` समोर फलंदाज ${batter}` : ''}! गोलंदाजीत नवा उत्साह!`;
  } else {
    en = `📢 BOWLER INTO THE ATTACK: ${name} has been called into the bowling attack${batter ? ` to bowl to ${batter}` : ''}!`;
    hi = `📢 गेंदबाजी में बदलाव: ${name} को आक्रमण पर लगाया गया है${batter ? ` सामने हैं ${batter}` : ''}!`;
    mr = `📢 गोलंदाज आक्रमणावर: ${name} यांच्या हाती चेंडू सोपवला आहे${batter ? ` समोर फलंदाज ${batter}` : ''}!`;
  }

  return {
    id: `comm-bowl-announcement-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    overBall,
    description: en,
    type: 'extra',
    announcementType: 'new_bowler',
    playerName: name,
    translations: { en, hi, mr }
  };
}

/* =========================================================================
 * 3. WICKET & MILESTONE SPECIAL TRIGGERS BREAKDOWN
 * ========================================================================= */

export interface SpecialEventBreakdownData {
  batterName?: string;
  batterRuns?: number;
  batterBalls?: number;
  batterFours?: number;
  batterSixes?: number;
  howOut?: string;
  bowlerName?: string;
  fielderName?: string;
  bowlerWickets?: number;
  strikeRate?: string;
}

/**
 * Intercepts major events (wickets, 50s, 100s, hat-tricks) and triggers a highly enthusiastic,
 * detailed breakdown of the achievement, including the batter's total runs and balls faced.
 */
export function interceptSpecialEvent(
  type: 'wicket' | 'fifty' | 'hundred' | 'hat_trick',
  overBall: string,
  data: SpecialEventBreakdownData
): {
  commentary: CommentaryWithTranslations;
  bannerTitle: string;
  bannerSubtitle: string;
  notification: string;
} {
  const bName = data.batterName || 'Batter';
  const bRuns = data.batterRuns ?? 0;
  const bBalls = data.batterBalls ?? 0;
  const b4s = data.batterFours ?? 0;
  const b6s = data.batterSixes ?? 0;
  const sr = data.strikeRate || (bBalls > 0 ? ((bRuns / bBalls) * 100).toFixed(1) : '0.0');
  const bowl = data.bowlerName || 'Bowler';
  const howOut = data.howOut || 'Out';

  if (type === 'fifty') {
    const en = `🌟 FIFTY BREAKDOWN: Sensational Half-Century for ${bName}! 50 runs completed in ${bBalls} balls with ${b4s} boundaries and ${b6s} sixes (Strike Rate: ${sr})! What a commanding gully cricket performance!`;
    const hi = `🌟 अर्धशतक विश्लेषण: ${bName} का शानदार अर्धशतक! ${bBalls} गेंदों में ५० रन पूरे, जिसमें ${b4s} चौके और ${b6s} गगनचुंबी छक्के शामिल हैं (स्ट्राइक रेट: ${sr})! मैदान तालियों से गूंज उठा!`;
    const mr = `🌟 अर्धशतक विश्लेषण: ${bName} चे जबरदस्त अर्धशतक! अवघ्या ${bBalls} चेंडूत ५० धावा पूर्ण, ज्यात ${b4s} चौकार आणि ${b6s} उत्तुंग षटकार (स्ट्राईक रेट: ${sr})! प्रेक्षकांकडून उभे राहून जोरदार दाद!`;

    return {
      commentary: {
        id: `milestone-fifty-${Date.now()}`,
        overBall,
        description: en,
        type: 'milestone',
        specialEvent: 'fifty',
        translations: { en, hi, mr }
      },
      bannerTitle: `🌟 50 FOR ${bName.toUpperCase()}!`,
      bannerSubtitle: `${bRuns} runs in ${bBalls} balls (4s: ${b4s}, 6s: ${b6s}, SR: ${sr})`,
      notification: `🌟 FIFTY! ${bName} completes 50 in ${bBalls} balls (SR: ${sr})!`
    };
  }

  if (type === 'hundred') {
    const en = `👑 CENTURY BREAKDOWN: Take a bow, ${bName}! A legendary century of 100 runs in just ${bBalls} balls (${b4s}x4, ${b6s}x6, Strike Rate: ${sr})! Pure street masterclass etched in tournament memory!`;
    const hi = `👑 ऐतिहासिक शतक: सलाम ठोकिए ${bName} को! मात्र ${bBalls} गेंदों में १०० रन पूरे (${b4s} चौके, ${b6s} छक्के, स्ट्राइक रेट: ${sr})! गली क्रिकेट का जादुई और अविस्मरणीय शतक!`;
    const mr = `👑 ऐतिहासिक शतक: मानाचा मुजरा ${bName} ला! अवघ्या ${bBalls} चेंडूत १०० धावा पूर्ण (${b4s} चौकार, ${b6s} षटकार, स्ट्राईक रेट: ${sr})! गल्ली क्रिकेटच्या इतिहासातील अविस्मरणीय सुवर्ण खेळी!`;

    return {
      commentary: {
        id: `milestone-hundred-${Date.now()}`,
        overBall,
        description: en,
        type: 'milestone',
        specialEvent: 'hundred',
        translations: { en, hi, mr }
      },
      bannerTitle: `👑 100 FOR ${bName.toUpperCase()}!`,
      bannerSubtitle: `${bRuns} runs in ${bBalls} balls (${b4s}x4, ${b6s}x6, SR: ${sr})`,
      notification: `👑 HUNDRED! ${bName} smashes a monumental century in ${bBalls} balls!`
    };
  }

  if (type === 'hat_trick') {
    const en = `🔥 HAT-TRICK BREAKDOWN: A historic moment! ${bowl} claims 3 wickets in 3 consecutive deliveries! Complete pandemonium in the street, an extraordinary bowling feat!`;
    const hi = `🔥 हैट्रिक विश्लेषण: ऐतिहासिक पल! ${bowl} ने लगातार ३ गेंदों पर ३ विकेट झटके! गली क्रिकेट में ऐसा कमाल रोज नहीं दिखता, शानदार गेंदबाजी!`;
    const mr = `🔥 हॅटट्रिक विश्लेषण: ऐतिहासिक पराक्रम! ${bowl} ने सलग ३ चेंडूत ३ बळी टिपले! मैदानात एकच जल्लोष, तुफानी आणि भेदक मारा!`;

    return {
      commentary: {
        id: `milestone-hattrick-${Date.now()}`,
        overBall,
        description: en,
        type: 'milestone',
        specialEvent: 'hat_trick',
        translations: { en, hi, mr }
      },
      bannerTitle: `🔥 HAT-TRICK FOR ${bowl.toUpperCase()}!`,
      bannerSubtitle: `3 wickets in 3 consecutive deliveries!`,
      notification: `🔥 HAT-TRICK! ${bowl} takes 3 wickets in 3 balls!`
    };
  }

  // Default: Wicket breakdown
  const en = `🚨 WICKET BREAKDOWN: ${bName} is out for ${bRuns} runs off ${bBalls} balls (${b4s}x4, ${b6s}x6, SR: ${sr})! Dismissal: ${howOut} by ${bowl}. Big blow for the batting side!`;
  const hi = `🚨 विकेट विश्लेषण: ${bName} ${bBalls} गेंदों में ${bRuns} रन बनाकर आउट (${b4s} चौके, ${b6s} छक्के, स्ट्राइक रेट: ${sr})! विकेट: ${howOut} (गेंदबाज: ${bowl}). बड़ा झटका!`;
  const mr = `🚨 विकेट विश्लेषण: ${bName} ${bBalls} चेंडूत ${bRuns} धावांवर बाद (${b4s} चौकार, ${b6s} षटकार, स्ट्राईक रेट: ${sr})! बाद प्रकार: ${howOut} (गोलंदाज: ${bowl}). संघाला मोठा धक्का!`;

  return {
    commentary: {
      id: `milestone-wicket-${Date.now()}`,
      overBall,
      description: en,
      type: 'wicket',
      specialEvent: 'wicket',
      translations: { en, hi, mr }
    },
    bannerTitle: `OUT: ${bName.toUpperCase()}`,
    bannerSubtitle: `${bRuns} (${bBalls}b, ${b4s}x4, ${b6s}x6, SR: ${sr}) - b ${bowl}`,
    notification: `OUT! ${bName} dismissed for ${bRuns} (${bBalls}b) by ${bowl}.`
  };
}

/**
 * Contextual Tone Shifter visual badge and banner for commentary UI
 */
export function ContextualToneShifterBadge({
  toneInfo,
  language = 'en',
  compact = false
}: {
  toneInfo: ContextualToneInfo;
  language?: CommentaryLanguage;
  compact?: boolean;
}) {
  if (!toneInfo) return null;
  const label = toneInfo.label[language] || toneInfo.label.en;
  const description = toneInfo.description[language] || toneInfo.description.en;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${toneInfo.badgeClass}`}>
        <span>{toneInfo.shortTag}</span>
        {toneInfo.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      </div>
    );
  }

  return (
    <div className={`p-2 rounded-xl border transition-all ${toneInfo.borderClass} ${toneInfo.badgeClass} relative overflow-hidden shadow-xs`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[8.5px] font-black uppercase tracking-wider">{toneInfo.shortTag}</span>
          <span className="text-[7.5px] opacity-80 font-bold">({label})</span>
        </div>
        {toneInfo.pulse ? (
          <span className="flex items-center gap-1 text-[7px] font-mono font-bold uppercase tracking-widest text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            HIGH OCTANE
          </span>
        ) : (
          <span className="text-[7px] font-mono opacity-60 uppercase tracking-widest">
            AI TONE
          </span>
        )}
      </div>
      <p className="text-[8.5px] mt-0.5 opacity-95 leading-snug font-medium font-sans">{description}</p>
    </div>
  );
}
