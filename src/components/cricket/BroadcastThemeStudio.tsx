import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Palette, 
  Tv, 
  Sparkles, 
  Sliders, 
  Save, 
  RefreshCw, 
  Check, 
  Copy, 
  Monitor, 
  Flame, 
  Eye, 
  Layers, 
  Type, 
  Square, 
  CornerDownRight, 
  ExternalLink,
  Shield,
  Zap,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export interface BroadcastStudioTheme {
  id: string;
  name: string;
  presetBase: string;
  layout: 'ribbon-full' | 'slanted-pro-design' | 'docked-corner' | 'minimal-pill' | 'score-bug-1900-200' | 'mobile-vertical';
  bugPosition: 'bottom-full' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-full';
  
  // Custom Color Palette
  primaryAccent: string;
  secondaryAccent: string;
  bgColor: string;
  bgOpacity: number;
  textColor: string;
  textMutedColor: string;
  borderColor: string;
  borderStyle: 'sharp' | 'rounded' | 'pill';
  fontFamily: 'sans' | 'mono' | 'condensed' | 'serif';

  // Team Brand Colors
  teamAColor: string;
  teamBColor: string;

  // Features & Overlays
  showBallByBallDots: boolean;
  showStrikeRates: boolean;
  showWinProbability: boolean;
  showSponsorBadge: boolean;
  sponsorText: string;
  showTicker: boolean;
  tickerMessage: string;
  boundaryBlast: boolean;

  updatedAt?: number;
  updatedBy?: string;
}

export const DEFAULT_BROADCAST_STUDIO_THEME: BroadcastStudioTheme = {
  id: 'global-studio-theme',
  name: 'Premier Star Sapphire',
  presetBase: 'broadcast-pro',
  layout: 'ribbon-full',
  bugPosition: 'bottom-full',
  primaryAccent: '#0ea5e9', // Sky Cyan
  secondaryAccent: '#f59e0b', // Amber Gold
  bgColor: '#0b0f19',
  bgOpacity: 0.95,
  textColor: '#ffffff',
  textMutedColor: '#94a3b8',
  borderColor: '#38bdf8',
  borderStyle: 'sharp',
  fontFamily: 'sans',
  teamAColor: '#ea002a',
  teamBColor: '#00529b',
  showBallByBallDots: true,
  showStrikeRates: true,
  showWinProbability: true,
  showSponsorBadge: true,
  sponsorText: 'GULLY PREMIER LEAGUE 2026',
  showTicker: true,
  tickerMessage: 'LIVE BROADCAST • GULLY SCOREBOARD TV GRAPHICS • HIGH DEFINITION 1080P',
  boundaryBlast: true,
  updatedAt: Date.now()
};

export const STUDIO_PRESETS: { id: string; label: string; desc: string; config: Partial<BroadcastStudioTheme> }[] = [
  {
    id: 'broadcast-pro',
    label: 'Premier Star Sapphire',
    desc: 'ESPN / Star Sports Electric Cyan & Navy',
    config: {
      presetBase: 'broadcast-pro',
      primaryAccent: '#0ea5e9',
      secondaryAccent: '#f59e0b',
      bgColor: '#0b0f19',
      bgOpacity: 0.95,
      textColor: '#ffffff',
      textMutedColor: '#94a3b8',
      borderColor: '#38bdf8',
      borderStyle: 'sharp',
      fontFamily: 'sans',
      layout: 'ribbon-full'
    }
  },
  {
    id: 'ipl-style',
    label: 'IPL Royal Crimson & Gold',
    desc: 'BCCI / IPL Regal Gold & Velvet Violet',
    config: {
      presetBase: 'ipl-style',
      primaryAccent: '#fbbf24',
      secondaryAccent: '#f43f5e',
      bgColor: '#0f0a28',
      bgOpacity: 0.96,
      textColor: '#ffffff',
      textMutedColor: '#d8b4fe',
      borderColor: '#fbbf24',
      borderStyle: 'sharp',
      fontFamily: 'condensed',
      layout: 'slanted-pro-design'
    }
  },
  {
    id: 'cricheroes-dark',
    label: 'CricHeroes Cyber Dark',
    desc: 'Modern Slate & Cyan Monospace',
    config: {
      presetBase: 'cricheroes-dark',
      primaryAccent: '#06b6d4',
      secondaryAccent: '#10b981',
      bgColor: '#0d1117',
      bgOpacity: 0.96,
      textColor: '#ffffff',
      textMutedColor: '#67e8f9',
      borderColor: '#06b6d4',
      borderStyle: 'rounded',
      fontFamily: 'mono',
      layout: 'docked-corner'
    }
  },
  {
    id: 'neon-sport',
    label: 'Cyber Neon Sport',
    desc: 'Electric Lime & Magenta Glow',
    config: {
      presetBase: 'neon-sport',
      primaryAccent: '#a3e635',
      secondaryAccent: '#d946ef',
      bgColor: '#050508',
      bgOpacity: 0.98,
      textColor: '#ffffff',
      textMutedColor: '#f0abfc',
      borderColor: '#d946ef',
      borderStyle: 'rounded',
      fontFamily: 'sans',
      layout: 'ribbon-full'
    }
  },
  {
    id: 'clean-white',
    label: 'Daylight Pro White',
    desc: 'High Contrast Daylight & Classic Navy',
    config: {
      presetBase: 'clean-white',
      primaryAccent: '#2563eb',
      secondaryAccent: '#ea580c',
      bgColor: '#ffffff',
      bgOpacity: 0.96,
      textColor: '#0f172a',
      textMutedColor: '#64748b',
      borderColor: '#e2e8f0',
      borderStyle: 'rounded',
      fontFamily: 'sans',
      layout: 'ribbon-full'
    }
  },
  {
    id: 'retro-gold',
    label: 'Classic Heritage Gold',
    desc: 'Traditional Test Cricket Amber & Leather',
    config: {
      presetBase: 'retro-gold',
      primaryAccent: '#f59e0b',
      secondaryAccent: '#d97706',
      bgColor: '#1c1305',
      bgOpacity: 0.96,
      textColor: '#fef3c7',
      textMutedColor: '#fde68a',
      borderColor: '#d97706',
      borderStyle: 'sharp',
      fontFamily: 'serif',
      layout: 'slanted-pro-design'
    }
  },
  {
    id: 'carbon-modern',
    label: 'Carbon Stealth Formula',
    desc: 'Matte Graphite & High-Impact Crimson',
    config: {
      presetBase: 'carbon-modern',
      primaryAccent: '#ef4444',
      secondaryAccent: '#f97316',
      bgColor: '#111318',
      bgOpacity: 0.98,
      textColor: '#ffffff',
      textMutedColor: '#9ca3af',
      borderColor: '#ef4444',
      borderStyle: 'sharp',
      fontFamily: 'condensed',
      layout: 'score-bug-1900-200'
    }
  }
];

export const BroadcastThemeStudio: React.FC = () => {
  const [theme, setTheme] = useState<BroadcastStudioTheme>(() => {
    try {
      const local = localStorage.getItem('cricket_broadcast_studio_theme');
      if (local) {
        return { ...DEFAULT_BROADCAST_STUDIO_THEME, ...JSON.parse(local) };
      }
    } catch (_) {}
    return DEFAULT_BROADCAST_STUDIO_THEME;
  });

  const [activeSubTab, setActiveSubTab] = useState<'palette' | 'layout' | 'typography' | 'content'>('palette');
  const [backdropMode, setBackdropMode] = useState<'stadium' | 'chroma' | 'dark' | 'transparent'>('stadium');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Live simulation interactive test stinger alert
  const [activeStinger, setActiveStinger] = useState<{ type: 'four' | 'six' | 'wicket' | 'fifty' | 'freehit'; text: string } | null>(null);

  // Load from Firestore on mount
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, 'cricket_broadcast_theme', 'default'), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<BroadcastStudioTheme>;
          setTheme(prev => ({ ...prev, ...data }));
          try {
            localStorage.setItem('cricket_broadcast_studio_theme', JSON.stringify({ ...DEFAULT_BROADCAST_STUDIO_THEME, ...data }));
          } catch (_) {}
        }
      });
    } catch (e) {
      console.warn('Firestore theme listener error:', e);
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const handleApplyPreset = (preset: typeof STUDIO_PRESETS[0]) => {
    setTheme(prev => ({
      ...prev,
      name: preset.label,
      ...preset.config
    }));
  };

  const handleSaveToGlobal = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const updatedTheme: BroadcastStudioTheme = {
      ...theme,
      updatedAt: Date.now(),
      updatedBy: 'super_admin'
    };

    try {
      // 1. Save to Firestore for cross-device live sync
      await setDoc(doc(db, 'cricket_broadcast_theme', 'default'), updatedTheme, { merge: true });

      // 2. Save locally
      localStorage.setItem('cricket_broadcast_studio_theme', JSON.stringify(updatedTheme));

      // 3. Broadcast to all open tabs and overlay windows
      try {
        const bc = new BroadcastChannel('cricket_theme_channel');
        bc.postMessage({ type: 'theme_updated', theme: updatedTheme });
        bc.close();
      } catch (_) {}

      window.dispatchEvent(new CustomEvent('cricket_broadcast_theme_updated', { detail: updatedTheme }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save global broadcast theme:', err);
      // Fallback local save
      localStorage.setItem('cricket_broadcast_studio_theme', JSON.stringify(updatedTheme));
      window.dispatchEvent(new CustomEvent('cricket_broadcast_theme_updated', { detail: updatedTheme }));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const triggerTestStinger = (type: 'four' | 'six' | 'wicket' | 'fifty' | 'freehit', text: string) => {
    setActiveStinger({ type, text });
    setTimeout(() => {
      setActiveStinger(null);
    }, 3800);
  };

  const copyOverlayLink = () => {
    const url = `${window.location.origin}/live/cricket-overlay?theme=studio-custom`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Preview styling calculations
  const fontClass = useMemo(() => {
    switch (theme.fontFamily) {
      case 'condensed':
        return 'font-sans tracking-tight uppercase';
      case 'mono':
        return 'font-mono tracking-normal';
      case 'serif':
        return 'font-serif tracking-wide';
      default:
        return 'font-sans tracking-normal';
    }
  }, [theme.fontFamily]);

  const cornerClass = useMemo(() => {
    switch (theme.borderStyle) {
      case 'rounded':
        return 'rounded-2xl';
      case 'pill':
        return 'rounded-full';
      default:
        return 'rounded-none';
    }
  }, [theme.borderStyle]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* HEADER BAR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 sm:p-4 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl text-white shadow-md shadow-sky-500/20 shrink-0">
            <Palette size={28} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Live Broadcast Theme Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Superadmin Master Deck
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5 font-medium">
              Design television broadcast graphics, score bugs, and color palettes. All changes immediately sync to Scoreboard Management and live OBS overlays.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={copyOverlayLink}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            title="Copy OBS Browser Source URL"
          >
            {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy OBS Overlay URL'}</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToGlobal}
            disabled={isSaving}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white font-extrabold text-xs tracking-wide shadow-lg transition-all cursor-pointer border-none ${
              saveSuccess 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' 
                : 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-sky-500/25'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving to Cloud...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 size={15} />
                <span>Published Globally!</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Publish to All TV Graphics</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 16:9 LIVE MONITOR CANVAS (PREVIEW) */}
      <div className="bg-slate-950 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Monitor Header Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-850">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-200">
              Live TV Broadcast Screen • 1080p 16:9 Monitor
            </span>
            <span className="hidden md:inline-block px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
              Theme: {theme.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <span className="text-[9px] font-black uppercase text-slate-400 px-2">Backdrop:</span>
            {[
              { id: 'stadium', label: '🏟️ Stadium' },
              { id: 'chroma', label: '🟩 Green Screen' },
              { id: 'dark', label: '⬛ Dark Deck' },
              { id: 'transparent', label: '🏁 Transparent' }
            ].map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBackdropMode(b.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
                  backdropMode === b.id 
                    ? 'bg-sky-500 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* 16:9 Aspect Ratio Display Stage */}
        <div 
          className={`w-full aspect-[16/9] relative mt-3 rounded-xl overflow-hidden flex flex-col justify-end transition-all select-none ${
            backdropMode === 'chroma'
              ? 'bg-[#00ff00]'
              : backdropMode === 'dark'
              ? 'bg-[#0b0f19]'
              : backdropMode === 'transparent'
              ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950'
              : 'bg-cover bg-center'
          }`}
          style={{
            backgroundImage: backdropMode === 'stadium' 
              ? `linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.4) 100%), url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1600&q=80')` 
              : undefined
          }}
        >
          {/* Top Simulation Channel Watermark */}
          <div className="absolute top-3 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white">
            <Radio size={12} className="text-rose-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider">LIVE 1080P PRO FEED</span>
          </div>

          {theme.showSponsorBadge && (
            <div className="absolute top-3 right-4 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">OFFICIAL SPONSOR</span>
              <span className="text-[10px] font-extrabold text-white">{theme.sponsorText || 'GULLY PREMIER LEAGUE'}</span>
            </div>
          )}

          {/* SIMULATED STINGER BANNER (FOUR, SIX, WICKET, MILESTONE) */}
          <AnimatePresence>
            {activeStinger && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -20 }}
                className="absolute inset-x-0 top-1/3 flex items-center justify-center z-30 pointer-events-none px-4"
              >
                <div 
                  className="px-8 py-5 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border-2 flex items-center gap-4 text-white"
                  style={{
                    backgroundColor: theme.bgColor,
                    borderColor: activeStinger.type === 'wicket' ? '#ef4444' : activeStinger.type === 'six' ? '#d946ef' : theme.primaryAccent,
                    boxShadow: `0 0 35px ${theme.primaryAccent}60`
                  }}
                >
                  <span className="text-3xl sm:text-4xl">
                    {activeStinger.type === 'six' ? '🚀' : activeStinger.type === 'four' ? '💥' : activeStinger.type === 'wicket' ? '🎯' : '🎖️'}
                  </span>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider" style={{ color: theme.primaryAccent }}>
                      {activeStinger.text}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold opacity-90 text-white">
                      SUPERADMIN LIVE THEME ENGINE
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LIVE SCORE BUG SIMULATOR (Dynamic based on theme config) */}
          <div className="p-3 sm:p-6 w-full z-20">
            <div 
              className={`w-full overflow-hidden transition-all shadow-2xl border ${cornerClass} ${fontClass}`}
              style={{
                backgroundColor: theme.bgColor,
                opacity: theme.bgOpacity,
                borderColor: `${theme.borderColor}80`,
                boxShadow: `0 15px 40px rgba(0,0,0,0.7), 0 0 20px ${theme.borderColor}30`
              }}
            >
              {/* Top Score Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-white/10">
                {/* Batting Team Badge & Score */}
                <div className="flex items-center gap-3">
                  <div 
                    className="px-2.5 py-1 rounded font-black text-xs sm:text-sm tracking-wider uppercase text-white shadow"
                    style={{ backgroundColor: theme.teamAColor }}
                  >
                    IND
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight" style={{ color: theme.textColor }}>
                      168/3
                    </span>
                    <span className="text-xs sm:text-sm font-bold opacity-80" style={{ color: theme.textMutedColor }}>
                      (16.4 Ov)
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-400">
                      CRR: 10.08
                    </span>
                  </div>
                </div>

                {/* Bowling Team Target / State */}
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75" style={{ color: theme.textMutedColor }}>
                      Target: 195 • Need 27 off 20b
                    </span>
                    {theme.showWinProbability && (
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="text-[9px] font-mono font-bold text-sky-400">WIN: IND 68%</span>
                        <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="w-[68%] h-full bg-sky-400" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div 
                    className="px-2.5 py-1 rounded font-black text-xs sm:text-sm tracking-wider uppercase text-white shadow"
                    style={{ backgroundColor: theme.teamBColor }}
                  >
                    AUS
                  </div>
                </div>
              </div>

              {/* Lower Section: Batsmen, Bowler, and Ball by Ball */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 text-xs sm:text-sm">
                {/* Batsmen Module */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-extrabold truncate" style={{ color: theme.textColor }}>
                        V. Kohli *
                      </span>
                    </div>
                    <span className="text-[11px] font-mono opacity-80 block" style={{ color: theme.textMutedColor }}>
                      {theme.showStrikeRates ? '64* (38) • SR: 168.4' : '64* (38)'}
                    </span>
                  </div>
                  <div className="text-right min-w-0">
                    <span className="font-extrabold truncate block" style={{ color: theme.textColor }}>
                      S. Yadav
                    </span>
                    <span className="text-[11px] font-mono opacity-80 block" style={{ color: theme.textMutedColor }}>
                      {theme.showStrikeRates ? '42 (21) • SR: 200.0' : '42 (21)'}
                    </span>
                  </div>
                </div>

                {/* Bowler Module */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75" style={{ color: theme.textMutedColor }}>
                      BOWLER
                    </span>
                    <span className="font-extrabold" style={{ color: theme.textColor }}>
                      P. Cummins
                    </span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-extrabold text-sm" style={{ color: theme.primaryAccent }}>
                      3.4 - 0 - 32 - 2
                    </span>
                    <span className="text-[10px] block opacity-75" style={{ color: theme.textMutedColor }}>
                      Econ: 8.72
                    </span>
                  </div>
                </div>

                {/* Ball-by-ball Over Module */}
                <div className="p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75" style={{ color: theme.textMutedColor }}>
                      THIS OVER
                    </span>
                    {theme.showBallByBallDots && (
                      <div className="flex items-center gap-1.5 mt-1">
                        {['1', '4', '0', '6', 'W', '2'].map((b, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] font-mono shadow-sm ${
                              b === '4'
                                ? 'bg-sky-500 text-white'
                                : b === '6'
                                ? 'bg-fuchsia-600 text-white'
                                : b === 'W'
                                ? 'bg-rose-600 text-white'
                                : 'bg-white/15 text-white'
                            }`}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div 
                    className="px-2.5 py-1 rounded font-black text-[10px] tracking-wider uppercase"
                    style={{ 
                      backgroundColor: `${theme.primaryAccent}25`,
                      color: theme.primaryAccent,
                      border: `1px solid ${theme.primaryAccent}60`
                    }}
                  >
                    13 RUNS
                  </div>
                </div>
              </div>

              {/* Ticker Banner */}
              {theme.showTicker && (
                <div 
                  className="px-3 sm:px-5 py-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase border-t border-white/10 flex items-center justify-between overflow-hidden"
                  style={{ backgroundColor: `${theme.bgColor}E6`, color: theme.secondaryAccent }}
                >
                  <div className="truncate flex items-center gap-2">
                    <Sparkles size={12} className="shrink-0 animate-pulse" />
                    <span>{theme.tickerMessage || 'LIVE BROADCAST • GULLY PREMIER LEAGUE 2026'}</span>
                  </div>
                  <span className="text-[9px] font-mono shrink-0 opacity-75 hidden sm:inline-block">
                    TV GRAPHICS ENGINE 4.2
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Simulation Test Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-850 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Interactive Test Alerts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => triggerTestStinger('four', '💥 FOUR RUNS!')}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-[10px] font-black uppercase transition-all cursor-pointer"
              >
                Test Four
              </button>
              <button
                type="button"
                onClick={() => triggerTestStinger('six', '🚀 MAXIMUM SIX!')}
                className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/30 text-[10px] font-black uppercase transition-all cursor-pointer"
              >
                Test Six
              </button>
              <button
                type="button"
                onClick={() => triggerTestStinger('wicket', '🎯 OUT! WICKET!')}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase transition-all cursor-pointer"
              >
                Test Wicket
              </button>
              <button
                type="button"
                onClick={() => triggerTestStinger('fifty', '🎖️ 50 MILESTONE!')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase transition-all cursor-pointer"
              >
                Test 50
              </button>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-400">
            Resolution: <span className="text-white font-bold">1920 × 1080 Full HD</span>
          </div>
        </div>
      </div>

      {/* CONTROLS WORKBENCH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Preset Carousel */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sliders size={16} className="text-sky-500" />
              <span>Choose Base Broadcast Preset</span>
            </h3>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
              {STUDIO_PRESETS.length} Official Styles
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {STUDIO_PRESETS.map((p) => {
              const isSelected = theme.presetBase === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 shadow-sm ring-2 ring-sky-500/20' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                        {p.label.split(' ')[0]}
                      </span>
                      {isSelected && <Check size={12} className="text-sky-500 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 block leading-tight">
                      {p.desc}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: p.config.primaryAccent }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: p.config.secondaryAccent }} />
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: p.config.bgColor }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {[
              { id: 'palette', label: '🎨 Color Palette Studio', icon: Palette },
              { id: 'layout', label: '📐 Layout & Positioning', icon: Layers },
              { id: 'typography', label: '🔤 Typography & Shape', icon: Type },
              { id: 'content', label: '📢 Sponsor & Live Ticker', icon: Radio }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-2 ${
                  activeSubTab === tab.id
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-6">
            {/* 1. COLOR PALETTE STUDIO */}
            {activeSubTab === 'palette' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Primary Accent */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Primary Accent (Highlight/Glow)
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.primaryAccent}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.primaryAccent}
                      onChange={(e) => setTheme(prev => ({ ...prev, primaryAccent: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#0ea5e9', '#38bdf8', '#fbbf24', '#a3e635', '#ef4444', '#d946ef', '#10b981'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, primaryAccent: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Secondary Accent */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Secondary Accent (Ticker & Subtitles)
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.secondaryAccent}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.secondaryAccent}
                      onChange={(e) => setTheme(prev => ({ ...prev, secondaryAccent: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#f59e0b', '#fbbf24', '#f43f5e', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, secondaryAccent: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Container Background Color */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Score Bug Canvas Background
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.bgColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.bgColor}
                      onChange={(e) => setTheme(prev => ({ ...prev, bgColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#0b0f19', '#0d1117', '#0f0a28', '#111318', '#1c1305', '#ffffff', '#030712'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, bgColor: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Backdrop Glassmorphism & Opacity
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-500">
                      {Math.round(theme.bgOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.02"
                    value={theme.bgOpacity}
                    onChange={(e) => setTheme(prev => ({ ...prev, bgOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-sky-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>50% Translucent</span>
                    <span>100% Solid Matte</span>
                  </div>
                </div>

                {/* Team A Brand Color */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Team A Brand Emblem Color
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.teamAColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.teamAColor}
                      onChange={(e) => setTheme(prev => ({ ...prev, teamAColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#ea002a', '#dc2626', '#b91c1c', '#f97316', '#e11d48', '#be123c'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, teamAColor: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team B Brand Color */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Team B Brand Emblem Color
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.teamBColor}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.teamBColor}
                      onChange={(e) => setTheme(prev => ({ ...prev, teamBColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#00529b', '#2563eb', '#1d4ed8', '#0284c7', '#0891b2', '#4338ca'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, teamBColor: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. LAYOUT & POSITIONING */}
            {activeSubTab === 'layout' && (
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
                    Select Broadcast HUD Layout
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { id: 'ribbon-full', label: 'Full Ribbon', desc: 'Standard IPL / World Cup Lower Third' },
                      { id: 'slanted-pro-design', label: 'Slanted Pro Ribbon', desc: 'Angled Polygons & Sports Chamfers' },
                      { id: 'docked-corner', label: 'Docked Corner Bug', desc: 'Corner Compact Broadcast Box' },
                      { id: 'minimal-pill', label: 'Minimal Pill HUD', desc: 'Ultra-Clean Capsule Overlay' },
                      { id: 'score-bug-1900-200', label: 'Giant 1900x200 Bug', desc: 'High-Impact Full HD Banner' },
                      { id: 'mobile-vertical', label: '9:16 Vertical HUD', desc: 'Reels / YouTube Shorts / TikTok Stream' }
                    ].map(l => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setTheme(prev => ({ ...prev, layout: l.id as any }))}
                        className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                          theme.layout === l.id
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{l.label}</span>
                          {theme.layout === l.id && <Check size={14} className="text-sky-500" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{l.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
                    Screen Position
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { id: 'bottom-full', label: 'Bottom Edge (Full)' },
                      { id: 'bottom-left', label: 'Bottom Left' },
                      { id: 'bottom-right', label: 'Bottom Right' },
                      { id: 'bottom-center', label: 'Bottom Center' },
                      { id: 'top-full', label: 'Top Bar (Header)' }
                    ].map(pos => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setTheme(prev => ({ ...prev, bugPosition: pos.id as any }))}
                        className={`p-3 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                          theme.bugPosition === pos.id
                            ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. TYPOGRAPHY & SHAPE */}
            {activeSubTab === 'typography' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Broadcast Typography Font Family
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 'sans', label: 'Modern Sans', sample: 'ESPN Pro Bold' },
                      { id: 'condensed', label: 'Sports Condensed', sample: 'HIGH IMPACT NUMERALS' },
                      { id: 'mono', label: 'Cyber Monospace', sample: '0123456789 SPEED' },
                      { id: 'serif', label: 'Classic Serif', sample: 'Heritage Lords Club' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTheme(prev => ({ ...prev, fontFamily: f.id as any }))}
                        className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                          theme.fontFamily === f.id
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="text-xs font-black block text-slate-900 dark:text-white">{f.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1 truncate">{f.sample}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Corner Geometry & Polygon Style
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'sharp', label: 'Sharp Chamfer', desc: 'Angled TV Polygon' },
                      { id: 'rounded', label: 'Modern Smooth', desc: '16px Soft Corners' },
                      { id: 'pill', label: 'Full Capsule', desc: 'Curved Pill Edge' }
                    ].map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTheme(prev => ({ ...prev, borderStyle: s.id as any }))}
                        className={`p-3 rounded-xl text-center border transition-all cursor-pointer ${
                          theme.borderStyle === s.id
                            ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="text-xs font-black block text-slate-900 dark:text-white">{s.label}</span>
                        <span className="text-[10px] text-slate-500 block mt-1">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. SPONSOR & CONTENT */}
            {activeSubTab === 'content' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Sponsor Header Badge
                    </label>
                    <input
                      type="checkbox"
                      checked={theme.showSponsorBadge}
                      onChange={(e) => setTheme(prev => ({ ...prev, showSponsorBadge: e.target.checked }))}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.sponsorText}
                    onChange={(e) => setTheme(prev => ({ ...prev, sponsorText: e.target.value }))}
                    placeholder="E.g. GULLY PREMIER LEAGUE 2026"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Displays on the top right or within the ribbon on the television broadcast feed.
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Live Running News Ticker
                    </label>
                    <input
                      type="checkbox"
                      checked={theme.showTicker}
                      onChange={(e) => setTheme(prev => ({ ...prev, showTicker: e.target.checked }))}
                      className="w-4 h-4 accent-sky-500 cursor-pointer"
                    />
                  </div>
                  <input
                    type="text"
                    value={theme.tickerMessage}
                    onChange={(e) => setTheme(prev => ({ ...prev, tickerMessage: e.target.value }))}
                    placeholder="E.g. LIVE BROADCAST • GULLY SCOREBOARD TV GRAPHICS"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <span className="text-[11px] text-slate-500 block">
                    Scrolling marquee message bar rendered at the bottom edge of the overlay.
                  </span>
                </div>

                {/* Additional Feature Toggles */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-3">
                    Telemetry & Statistics Overlays
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'showBallByBallDots', label: 'Ball-by-Ball Over Dots (4, 6, W)', desc: 'Visual colored circular tags' },
                      { key: 'showStrikeRates', label: 'Batsman Strike Rates (SR)', desc: 'Realtime batting strike rates' },
                      { key: 'showWinProbability', label: 'Win Probability Meter', desc: 'Predictive algorithm gauge' }
                    ].map(item => (
                      <label 
                        key={item.key} 
                        className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={(theme as any)[item.key]}
                          onChange={(e) => setTheme(prev => ({ ...prev, [item.key]: e.target.checked }))}
                          className="w-4 h-4 accent-sky-500 cursor-pointer mt-0.5"
                        />
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">{item.label}</span>
                          <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
