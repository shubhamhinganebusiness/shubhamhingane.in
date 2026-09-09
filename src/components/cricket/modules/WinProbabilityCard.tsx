import React, { useState } from 'react';
import {
  WinProbabilityMetrics,
  WinProbabilityCommentary,
  useWinProbabilityEngine
} from './winProbabilityEngine';
import { CommentaryLanguage, COMMENTARY_LANGUAGES } from './commentaryLanguage';

interface WinProbabilityCardProps {
  match: any;
  userLanguage?: CommentaryLanguage;
  onAddToCommentary?: (text: string, translations?: { en: string; hi: string; mr: string }) => void;
  compact?: boolean;
  className?: string;
}

export const WinProbabilityCard: React.FC<WinProbabilityCardProps> = ({
  match,
  userLanguage = 'en',
  onAddToCommentary,
  compact = false,
  className = ''
}) => {
  const [activeLang, setActiveLang] = useState<CommentaryLanguage>(userLanguage);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const { metrics, commentary, isLoading, refreshCommentary } = useWinProbabilityEngine(
    match,
    activeLang,
    true
  );

  const activeText = commentary?.translations?.[activeLang] || commentary?.text || '';

  // Audio Speech Reader using Web Speech API
  const handlePlayTTS = () => {
    if (!('speechSynthesis' in window) || !activeText) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeText);

    if (activeLang === 'mr') {
      utterance.lang = 'mr-IN';
    } else if (activeLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handlePostToCommentary = () => {
    if (!activeText) return;
    if (onAddToCommentary) {
      onAddToCommentary(activeText, commentary?.translations);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    }
  };

  // Tilt Status Badge Config
  const getTiltBadge = () => {
    switch (metrics.tiltStatus) {
      case 'miracle_needed':
        return {
          label: '🚨 MIRACLE NEEDED',
          mrLabel: '🚨 चमत्काराची गरज',
          hiLabel: '🚨 चमत्कार की दरकार',
          bg: 'bg-rose-500/10 text-rose-500 border-rose-500/30 dark:bg-rose-950/40'
        };
      case 'heavy_tilt':
        return {
          label: `🔥 HEAVY TILT (${metrics.favoredTeamName})`,
          mrLabel: `🔥 पारडे जड (${metrics.favoredTeamName})`,
          hiLabel: `🔥 भारी झुकाव (${metrics.favoredTeamName})`,
          bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
        };
      case 'slight_tilt':
        return {
          label: `⚡ SLIGHT EDGE (${metrics.favoredTeamName})`,
          mrLabel: `⚡ किंचित आघाडी (${metrics.favoredTeamName})`,
          hiLabel: `⚡ मामूली बढ़त (${metrics.favoredTeamName})`,
          bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
        };
      case 'sealed':
        return {
          label: `👑 VICTORY SEALED (${metrics.favoredTeamName})`,
          mrLabel: `👑 विजय निश्चित (${metrics.favoredTeamName})`,
          hiLabel: `👑 जीत तय (${metrics.favoredTeamName})`,
          bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
        };
      default:
        return {
          label: '⚖️ 50-50 DEADLOCK',
          mrLabel: '⚖️ 50-50 अटीतटीची लढत',
          hiLabel: '⚖️ 50-50 कांटे की टक्कर',
          bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
        };
    }
  };

  const tiltBadge = getTiltBadge();

  if (compact) {
    return (
      <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-white">
              Win Probability
            </span>
          </div>
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${tiltBadge.bg}`}>
            {activeLang === 'mr' ? tiltBadge.mrLabel : activeLang === 'hi' ? tiltBadge.hiLabel : tiltBadge.label}
          </span>
        </div>

        {/* Progress meter */}
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-emerald-600 dark:text-emerald-400 font-black">{metrics.teamAName}: {metrics.probA}%</span>
            <span className="text-amber-600 dark:text-amber-400 font-black">{metrics.teamBName}: {metrics.probB}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${metrics.probA}%` }} />
            <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${metrics.probB}%` }} />
          </div>
        </div>

        {/* Commentary snippet */}
        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 font-medium line-clamp-2 italic">
          "{activeText}"
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden ${className}`}>
      {/* Subtle background glow based on favored status */}
      <div className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${
        metrics.tiltStatus === 'miracle_needed' ? 'bg-rose-500' : 'bg-emerald-500'
      }`} />

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Predictive Win Probability Commentary
              </h4>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                {commentary?.isAiGenerated ? '✨ AI Powered' : '📊 Algorithmic'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {metrics.currentInningsNum === 2 ? `Chase Equation: ${metrics.equationText}` : `1st Innings Projected Phase (${metrics.equationText})`}
            </p>
          </div>
        </div>

        {/* Live Tilt Status Badge */}
        <div className={`px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wider ${tiltBadge.bg}`}>
          {activeLang === 'mr' ? tiltBadge.mrLabel : activeLang === 'hi' ? tiltBadge.hiLabel : tiltBadge.label}
        </div>
      </div>

      {/* Live Win Percentage Dual Gauge */}
      <div className="bg-slate-100/70 dark:bg-slate-850/60 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{metrics.teamAName}</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{metrics.probA}%</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {metrics.tiltStatus === 'miracle_needed' ? '⚡ CRUNCH TILT' : 'WIN RATIO'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">{metrics.probB}%</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{metrics.teamBName}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          </div>
        </div>

        {/* Dual Progress Bar with dynamic split */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex shadow-inner p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-l-full transition-all duration-700 ease-out flex items-center justify-start pl-2"
            style={{ width: `${Math.max(4, metrics.probA)}%` }}
          >
            {metrics.probA >= 15 && <span className="text-[8px] font-black text-white">{metrics.probA}%</span>}
          </div>
          <div
            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-r-full transition-all duration-700 ease-out flex items-center justify-end pr-2"
            style={{ width: `${Math.max(4, metrics.probB)}%` }}
          >
            {metrics.probB >= 15 && <span className="text-[8px] font-black text-white">{metrics.probB}%</span>}
          </div>
        </div>

        {/* Key Tactical Driver Pill */}
        {commentary?.keyTacticalReason && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-bold text-slate-700 dark:text-slate-300">Tactical Pivot:</span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold">
              {commentary.keyTacticalReason}
            </span>
          </div>
        )}
      </div>

      {/* Language Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {COMMENTARY_LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeLang === lang.id
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          ))}
        </div>

        {/* Refresh / Ask AI Button */}
        <button
          onClick={() => refreshCommentary()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-sm disabled:opacity-50 transition-all cursor-pointer"
          title="Recalculate win percentage and ask AI why the match is tilting"
        >
          {isLoading ? (
            <>
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Ask AI Why It's Tilting</span>
            </>
          )}
        </button>
      </div>

      {/* AI Commentary Narrative Box */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs relative">
        <div className="flex items-start gap-3">
          <div className="text-xl select-none mt-0.5">🎙️</div>
          <div className="flex-1">
            <p className="text-xs sm:text-sm leading-relaxed text-slate-850 dark:text-slate-100 font-semibold font-sans">
              {activeText || 'Analyzing current match win trajectory...'}
            </p>
            {commentary?.generatedAt && (
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1.5 block">
                Generated at {commentary.generatedAt}
              </span>
            )}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Audio TTS Button */}
          <button
            onClick={handlePlayTTS}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            <span>{isPlayingAudio ? '⏹️' : '🔊'}</span>
            <span>{isPlayingAudio ? 'Stop Audio' : 'Listen'}</span>
          </button>

          {/* Add to Live Match Commentary Feed */}
          {onAddToCommentary && (
            <button
              onClick={handlePostToCommentary}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold transition-all cursor-pointer"
            >
              <span>{copiedNotification ? '✅ Added!' : '➕ Post to Commentary Feed'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
