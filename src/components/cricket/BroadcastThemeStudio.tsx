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
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { StarTVScorebug } from './StarTVScorebug';

export interface BroadcastStudioTheme {
  id: string;
  name: string;
  presetBase: string;
  layout: 'star-tv-broadcast' | 'single-line' | 'ribbon-full' | 'slanted-pro-design' | 'docked-corner' | 'minimal-pill' | 'score-bug-1900-200' | 'mobile-vertical';
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

  // Background Gradient Options
  bgType?: 'solid' | 'gradient';
  bgGradient?: string;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  bgGradientVia?: string;
  bgGradientDirection?: string; // '90deg' | '135deg' | '180deg' | '45deg' | '225deg' | 'radial'

  // Team Brand Colors & Labels
  teamAColor: string;
  teamBColor: string;
  teamAName?: string;
  teamASubtext?: string;
  teamBName?: string;
  teamBSubtext?: string;

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

export interface BroadcastGradientPreset {
  id: string;
  name: string;
  desc: string;
  from: string;
  to: string;
  via?: string;
  direction: string;
}

export const BROADCAST_GRADIENT_PRESETS: BroadcastGradientPreset[] = [
  { id: 'midnight-sapphire', name: 'Midnight Sapphire', desc: 'ESPN Pro Deep Navy', from: '#0b0f19', to: '#1e293b', direction: '135deg' },
  { id: 'star-sports-navy', name: 'Star Sports Electric', desc: 'Cyan & Dark Navy', from: '#030712', to: '#075985', direction: '135deg' },
  { id: 'ipl-regal-violet', name: 'IPL Regal Velvet', desc: 'BCCI Velvet Violet', from: '#0f0a28', to: '#3b0764', direction: '135deg' },
  { id: 'crimson-fire', name: 'Crimson Flame', desc: 'Stadium High Voltage Red', from: '#180509', to: '#7f1d1d', direction: '135deg' },
  { id: 'cyber-emerald', name: 'Cyber Matrix Green', desc: 'Pitch Green & Emerald', from: '#022c22', to: '#065f46', direction: '135deg' },
  { id: 'carbon-titanium', name: 'Carbon Titanium', desc: 'Matte Stealth Graphite', from: '#09090b', to: '#27272a', direction: '135deg' },
  { id: 'heritage-gold', name: 'Heritage Amber Gold', desc: "Lord's & Ashes Classic", from: '#1c1305', to: '#78350f', direction: '135deg' },
  { id: 'deep-ocean-teal', name: 'Ocean Deep Teal', desc: 'Pacific T20 Deep Teal', from: '#042f2e', to: '#0d9488', direction: '135deg' },
  { id: 'sunset-blaze', name: 'Sunset Crimson Gold', desc: 'Dusk Stadium Ambient', from: '#450a0a', to: '#b45309', direction: '135deg' },
  { id: 'neon-cyber-punk', name: 'Neon Cyberpunk', desc: 'Night Game Ultraviolet', from: '#18032b', to: '#831843', direction: '135deg' },
  { id: 'frost-white', name: 'Daylight Silver Frost', desc: 'High Definition Clear White', from: '#ffffff', to: '#cbd5e1', direction: '135deg' },
  { id: 'slate-minimal', name: 'Broadcast Slate Pro', desc: 'Minimalist Studio Slate', from: '#0f172a', to: '#334155', direction: '135deg' }
];

export const computeGradientCss = (direction: string, from: string, to: string, via?: string): string => {
  if (direction === 'radial') {
    return via 
      ? `radial-gradient(circle, ${from} 0%, ${via} 50%, ${to} 100%)`
      : `radial-gradient(circle, ${from} 0%, ${to} 100%)`;
  }
  return via 
    ? `linear-gradient(${direction}, ${from} 0%, ${via} 50%, ${to} 100%)`
    : `linear-gradient(${direction}, ${from} 0%, ${to} 100%)`;
};

export const getThemeBackground = (theme: Partial<BroadcastStudioTheme> | null | undefined): string => {
  if (!theme) return '#0b0f19';
  if (theme.bgType === 'gradient') {
    if (theme.bgGradient) return theme.bgGradient;
    const dir = theme.bgGradientDirection || '135deg';
    const from = theme.bgGradientFrom || theme.bgColor || '#0b0f19';
    const to = theme.bgGradientTo || '#1e293b';
    return computeGradientCss(dir, from, to, theme.bgGradientVia);
  }
  return theme.bgColor || '#0b0f19';
};

export const DEFAULT_BROADCAST_STUDIO_THEME: BroadcastStudioTheme = {
  id: 'global-studio-theme',
  name: 'Star TV Pro Scorebug (Official Reference)',
  presetBase: 'star-tv-broadcast',
  layout: 'star-tv-broadcast',
  bugPosition: 'bottom-center',
  primaryAccent: '#0284c7', // Sky Blue / Cyan
  secondaryAccent: '#ef4444', // Crimson Red
  bgColor: '#ffffff',
  bgOpacity: 1.0,
  bgType: 'solid',
  bgGradientFrom: '#0143a3',
  bgGradientTo: '#002266',
  bgGradientDirection: '180deg',
  bgGradient: 'linear-gradient(180deg, #0143a3 0%, #002266 100%)',
  textColor: '#0f172a',
  textMutedColor: '#64748b',
  borderColor: '#38bdf8',
  borderStyle: 'rounded',
  fontFamily: 'sans',
  teamAColor: '#0143a3', // Royal Sapphire Blue (Team A)
  teamBColor: '#c8102e', // Crimson Red (Team B)
  teamAName: 'TEAM A',
  teamASubtext: 'BAT FIRST',
  teamBName: 'TEAM B',
  teamBSubtext: 'BOWLING',
  showBallByBallDots: true,
  showStrikeRates: true,
  showWinProbability: false,
  showSponsorBadge: true,
  sponsorText: 'LIVE CRICKET BROADCAST',
  showTicker: false,
  tickerMessage: 'LIVE BROADCAST • TELEVISION SCOREBUG • HIGH DEFINITION 1080P',
  boundaryBlast: true,
  updatedAt: Date.now()
};

export const STUDIO_PRESETS: { id: string; label: string; desc: string; config: Partial<BroadcastStudioTheme> }[] = [
  {
    id: 'star-tv-broadcast',
    label: '⭐ Star TV Pro Scorebug (Official Reference)',
    desc: 'Exact TV match design: Slanted Royal Blue & Crimson polygons with Elevated Center Shield Score & Ball Dots',
    config: {
      presetBase: 'star-tv-broadcast',
      name: 'Star TV Pro Scorebug',
      primaryAccent: '#0284c7',
      secondaryAccent: '#ef4444',
      bgColor: '#ffffff',
      bgOpacity: 1.0,
      textColor: '#0f172a',
      textMutedColor: '#64748b',
      borderColor: '#38bdf8',
      borderStyle: 'rounded',
      fontFamily: 'sans',
      teamAColor: '#0143a3',
      teamBColor: '#c8102e',
      teamAName: 'TEAM A',
      teamASubtext: 'BAT FIRST',
      teamBName: 'TEAM B',
      teamBSubtext: 'BOWLING',
      layout: 'star-tv-broadcast'
    }
  },
  {
    id: 'single-line-master',
    label: 'Single-Line TV Master',
    desc: 'Ultra-Sleek Single Line Ribbon — All details in 1 continuous row',
    config: {
      presetBase: 'single-line-master',
      primaryAccent: '#0ea5e9',
      secondaryAccent: '#f59e0b',
      bgColor: '#0b0f19',
      bgOpacity: 0.95,
      textColor: '#ffffff',
      textMutedColor: '#94a3b8',
      borderColor: '#38bdf8',
      borderStyle: 'rounded',
      fontFamily: 'sans',
      layout: 'single-line'
    }
  },
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
      layout: 'single-line'
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
  const [copiedGradient, setCopiedGradient] = useState(false);
  const [showThreeStops, setShowThreeStops] = useState(false);

  const handleToggleBgType = (type: 'solid' | 'gradient') => {
    setTheme(prev => {
      if (type === 'gradient') {
        const from = prev.bgGradientFrom || prev.bgColor || '#0b0f19';
        const to = prev.bgGradientTo || '#1e293b';
        const dir = prev.bgGradientDirection || '135deg';
        const computed = computeGradientCss(dir, from, to, prev.bgGradientVia);
        return {
          ...prev,
          bgType: 'gradient',
          bgGradientFrom: from,
          bgGradientTo: to,
          bgGradientDirection: dir,
          bgGradient: computed
        };
      } else {
        return {
          ...prev,
          bgType: 'solid'
        };
      }
    });
  };

  const updateGradientField = (field: 'from' | 'to' | 'via' | 'direction', value: string) => {
    setTheme(prev => {
      const from = field === 'from' ? value : (prev.bgGradientFrom || prev.bgColor || '#0b0f19');
      const to = field === 'to' ? value : (prev.bgGradientTo || '#1e293b');
      const dir = field === 'direction' ? value : (prev.bgGradientDirection || '135deg');
      const via = field === 'via' ? (value || undefined) : prev.bgGradientVia;
      const computed = computeGradientCss(dir, from, to, via);
      return {
        ...prev,
        bgType: 'gradient',
        bgGradientFrom: from,
        bgGradientTo: to,
        bgGradientDirection: dir,
        bgGradientVia: via,
        bgGradient: computed
      };
    });
  };

  const handleSwapGradientColors = () => {
    setTheme(prev => {
      const oldFrom = prev.bgGradientFrom || prev.bgColor || '#0b0f19';
      const oldTo = prev.bgGradientTo || '#1e293b';
      const dir = prev.bgGradientDirection || '135deg';
      const computed = computeGradientCss(dir, oldTo, oldFrom, prev.bgGradientVia);
      return {
        ...prev,
        bgType: 'gradient',
        bgGradientFrom: oldTo,
        bgGradientTo: oldFrom,
        bgGradient: computed
      };
    });
  };

  const handleApplyGradientPreset = (preset: BroadcastGradientPreset) => {
    setTheme(prev => {
      const computed = computeGradientCss(preset.direction, preset.from, preset.to, preset.via);
      return {
        ...prev,
        bgType: 'gradient',
        bgGradientFrom: preset.from,
        bgGradientTo: preset.to,
        bgGradientVia: preset.via,
        bgGradientDirection: preset.direction,
        bgGradient: computed
      };
    });
  };

  const handleCopyGradientCss = () => {
    const css = getThemeBackground(theme);
    navigator.clipboard.writeText(`background: ${css};`);
    setCopiedGradient(true);
    setTimeout(() => setCopiedGradient(false), 2000);
  };

  // Live simulation interactive test stinger alert
  const [activeStinger, setActiveStinger] = useState<{ type: 'four' | 'six' | 'wicket' | 'fifty' | 'freehit'; text: string } | null>(null);
  const [previewInnings, setPreviewInnings] = useState<1 | 2>(1);

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

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Layout Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTheme(prev => ({ ...prev, layout: 'star-tv-broadcast' }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                  theme.layout === 'star-tv-broadcast'
                    ? 'bg-sky-500 text-white shadow-sm ring-1 ring-white/30'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Display Star TV Pro scorebug matching the reference design"
              >
                <Sparkles size={11} className={theme.layout === 'star-tv-broadcast' ? 'text-amber-300' : ''} />
                <span>⭐ Star TV (Reference)</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme(prev => ({ ...prev, layout: 'single-line' }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                  theme.layout === 'single-line' || theme.layout === 'ribbon-full'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Display all scorebug details in a single horizontal television line"
              >
                <Zap size={11} className={theme.layout === 'single-line' || theme.layout === 'ribbon-full' ? 'text-amber-300' : ''} />
                <span>Single-Line</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme(prev => ({ ...prev, layout: 'docked-corner' }))}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  theme.layout === 'docked-corner'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Display compact docked corner box"
              >
                <span>Corner Box</span>
              </button>
            </div>

            {/* Innings Selector for testing 1st vs 2nd Inning Scorebug */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewInnings(1)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  previewInnings === 1
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Preview 1st Innings broadcast display"
              >
                1st Inning
              </button>
              <button
                type="button"
                onClick={() => setPreviewInnings(2)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  previewInnings === 2
                    ? 'bg-rose-600 text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white bg-transparent'
                }`}
                title="Preview 2nd Innings broadcast display with Target"
              >
                2nd Inning (Target)
              </button>
            </div>

            {/* Backdrop Switcher */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <span className="text-[9px] font-black uppercase text-slate-400 px-1.5 hidden sm:inline-block">Backdrop:</span>
              {[
                { id: 'stadium', label: '🏟️ Stadium' },
                { id: 'chroma', label: '🟩 Green' },
                { id: 'dark', label: '⬛ Dark' },
                { id: 'transparent', label: '🏁 Alpha' }
              ].map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBackdropMode(b.id as any)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
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
                    background: getThemeBackground(theme),
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
          <div className={`w-full z-20 transition-all ${
            theme.layout === 'star-tv-broadcast'
              ? 'p-0 w-full'
              : theme.bugPosition === 'top-full'
              ? 'p-2 sm:p-4 absolute top-0 inset-x-0'
              : theme.bugPosition === 'bottom-left'
              ? 'p-2 sm:p-4 max-w-4xl'
              : theme.bugPosition === 'bottom-right'
              ? 'p-2 sm:p-4 max-w-4xl ml-auto'
              : theme.bugPosition === 'bottom-center'
              ? 'p-2 sm:p-4 max-w-5xl mx-auto'
              : 'p-2 sm:p-4 md:p-6 w-full'
          }`}>
            {theme.layout === 'star-tv-broadcast' ? (
              /* ENHANCED LIVE TV BROADCAST SCOREBUG (REFERENCE DESIGN) */
              <div className="w-full">
                <StarTVScorebug 
                  inningsNum={previewInnings}
                  battingTeamName={theme.teamAName || 'TEAM A'}
                  battingTeamSubtext={previewInnings === 1 ? (theme.teamASubtext || '1ST INNINGS') : '2ND INNINGS • TGT 195'}
                  battingTeamColor={theme.teamAColor || '#0143a3'}
                  strikerName="ROHIT SHARMA"
                  strikerRuns={previewInnings === 1 ? 45 : 72}
                  strikerBalls={previewInnings === 1 ? 32 : 48}
                  strikerFours={5}
                  strikerSixes={2}
                  nonStrikerName="VIRAT KOHLI"
                  nonStrikerRuns={previewInnings === 1 ? 28 : 54}
                  nonStrikerBalls={previewInnings === 1 ? 18 : 36}
                  nonStrikerFours={3}
                  nonStrikerSixes={1}
                  score={previewInnings === 1 ? 78 : 168}
                  wickets={previewInnings === 1 ? 1 : 3}
                  overs={previewInnings === 1 ? "10.2" : "17.2"}
                  oversLimit={20}
                  crr={previewInnings === 1 ? 7.55 : 9.69}
                  targetRuns={previewInnings === 2 ? 195 : undefined}
                  remainingRuns={previewInnings === 2 ? 27 : undefined}
                  remainingBalls={previewInnings === 2 ? 16 : undefined}
                  rrr={previewInnings === 2 ? 10.1 : undefined}
                  partnershipRuns={52}
                  partnershipBalls={34}
                  last5OversRuns={44}
                  last5OversWickets={0}
                  inningsFours={12}
                  inningsSixes={4}
                  bowlerName="JASPRIT BUMRAH"
                  bowlerFigures="0/14"
                  bowlerOvers="1.2"
                  bowlerEcon={7.0}
                  thisOverBalls={['1', '0', '4', '0', '1']}
                  bowlingTeamName={theme.teamBName || 'TEAM B'}
                  bowlingTeamSubtext={theme.teamBSubtext || 'BOWLING'}
                  bowlingTeamColor={theme.teamBColor || '#c8102e'}
                  activeStinger={activeStinger}
                  showWinPredictor={false}
                  winProbabilityA={68}
                  winProbabilityB={32}
                  tournamentName="T20 WORLD CHAMPIONSHIP 2026"
                  matchStage="FINAL • LIVE"
                  matchVenue="Wankhede Stadium, Mumbai"
                  groundName="Wankhede Stadium, Mumbai"
                  umpire1Name="Richard Kettleborough"
                  umpire2Name="Nitin Menon"
                  commentatorName="Harsha Bhogle & Ravi Shastri"
                  scoreboardManagerName="Gully Official Scorer"
                  tossDetails="INDIA WON TOSS & ELECTED TO BAT"
                  lastBatsmanName="S. GILL"
                  lastBatsmanRuns={24}
                  lastBatsmanBalls={16}
                  lastBatsmanDismissal="c Head b Starc"
                  lastBatsmanFow="36/1 (4.2 ov)"
                  projectedScore={188}
                />
              </div>
            ) : theme.layout === 'docked-corner' ? (
              /* DOCKED COMPACT CORNER BOX */
              <div 
                className={`w-full max-w-md overflow-hidden transition-all shadow-2xl border ${cornerClass} ${fontClass}`}
                style={{
                  background: getThemeBackground(theme),
                  opacity: theme.bgOpacity,
                  borderColor: `${theme.borderColor}80`,
                  boxShadow: `0 15px 40px rgba(0,0,0,0.7), 0 0 20px ${theme.borderColor}30`
                }}
              >
                <div className="flex items-center justify-between p-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-black text-white" style={{ backgroundColor: theme.teamAColor }}>IND</span>
                    <span className="text-xl font-black font-mono" style={{ color: theme.textColor }}>168/3</span>
                    <span className="text-xs font-bold opacity-80" style={{ color: theme.textMutedColor }}>(16.4 ov)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-emerald-400">CRR 10.08</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2 text-xs border-b border-white/10">
                  <div>
                    <span className="font-extrabold block text-white">V. Kohli* 64 (38)</span>
                    <span className="text-[10px] font-mono text-slate-400">S. Yadav 42 (21)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold block text-emerald-400">P. Cummins 2/32</span>
                    <span className="text-[10px] font-mono text-slate-400">TGT 195 (Need 27)</span>
                  </div>
                </div>
                {theme.showBallByBallDots && (
                  <div className="px-3 py-1.5 bg-black/20 flex items-center justify-between text-[9px] font-mono">
                    <span className="text-slate-400 font-bold uppercase">THIS OVER:</span>
                    <div className="flex items-center gap-1">
                      {['1', '4', '0', '6', 'W', '2'].map((b, i) => (
                        <span key={i} className={`w-4 h-4 rounded-full flex items-center justify-center font-black ${
                          b === '4' ? 'bg-sky-500 text-white' : b === '6' ? 'bg-fuchsia-600 text-white' : b === 'W' ? 'bg-rose-600 text-white' : 'bg-white/15 text-white'
                        }`}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SINGLE LINE SCOREBUG - ALL DETAILS SHOWN IN ONE HORIZONTAL CONTINUOUS LINE */
              <div 
                className={`w-full overflow-hidden transition-all shadow-2xl border ${cornerClass} ${fontClass}`}
                style={{
                  background: getThemeBackground(theme),
                  opacity: theme.bgOpacity,
                  borderColor: `${theme.borderColor}80`,
                  boxShadow: `0 15px 40px rgba(0,0,0,0.7), 0 0 20px ${theme.borderColor}30`
                }}
              >
                {/* Boundary Alert Flush Top Stripe */}
                {activeStinger && (
                  <div 
                    className="h-1.5 w-full animate-pulse"
                    style={{ backgroundColor: theme.primaryAccent, boxShadow: `0 0 14px ${theme.primaryAccent}` }}
                  />
                )}

                {/* THE MASTER SINGLE LINE ROW */}
                <div className="flex items-center justify-between gap-2.5 sm:gap-3.5 px-3 sm:px-4 py-2 sm:py-2.5 w-full overflow-x-auto custom-scrollbar select-none whitespace-nowrap">
                  
                  {/* 1. MATCH & LIVE STATUS + BATTING TEAM + SCORE + OVERS + CRR */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Live Indicator */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] shadow-[0_0_10px_rgba(220,38,38,0.7)] animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>LIVE</span>
                    </div>

                    {/* Batting Team Pill */}
                    {/* Batting Team Pill + Innings */}
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="px-2.5 py-1 rounded font-black text-xs sm:text-sm tracking-wider uppercase text-white shadow shrink-0"
                        style={{ backgroundColor: theme.teamAColor }}
                      >
                        IND
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black uppercase ${
                        previewInnings === 2 ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300'
                      }`}>
                        {previewInnings === 1 ? '1ST INN' : '2ND INN'}
                      </span>
                    </div>

                    {/* Batting Score & Overs & CRR */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight" style={{ color: theme.textColor }}>
                        {previewInnings === 1 ? '78/1' : '168/3'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold opacity-80 font-mono" style={{ color: theme.textMutedColor }}>
                        ({previewInnings === 1 ? '10.2' : '16.4'} Ov)
                      </span>
                      {previewInnings === 2 && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-black text-[9px] uppercase tracking-wider shadow animate-pulse">
                          TGT 195
                        </span>
                      )}
                      <span className="text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 shrink-0">
                        CRR {previewInnings === 1 ? '7.55' : '10.08'}
                      </span>
                    </div>
                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="h-7 w-px bg-white/20 shrink-0" />

                  {/* 2. ACTIVE BATSMEN: STRIKER & NON-STRIKER */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Striker */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <span className="text-xs sm:text-sm font-extrabold" style={{ color: theme.textColor }}>
                        V. Kohli*
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
                        64<span className="text-[10px] font-normal opacity-75 ml-0.5 text-slate-300">(38)</span>
                      </span>
                      {theme.showStrikeRates && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold shrink-0">
                          SR 168.4
                        </span>
                      )}
                      <span className="text-[9px] font-mono opacity-70 hidden xl:inline-block" style={{ color: theme.textMutedColor }}>
                        4x4 • 2x6
                      </span>
                    </div>

                    <span className="text-white/30 text-xs shrink-0">•</span>

                    {/* Non-Striker */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold opacity-90" style={{ color: theme.textColor }}>
                        S. Yadav
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-black text-slate-200">
                        42<span className="text-[10px] font-normal opacity-75 ml-0.5 text-slate-300">(21)</span>
                      </span>
                      {theme.showStrikeRates && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/10 text-slate-300 font-bold shrink-0">
                          SR 200.0
                        </span>
                      )}
                      <span className="text-[9px] font-mono opacity-70 hidden xl:inline-block" style={{ color: theme.textMutedColor }}>
                        3x4 • 2x6
                      </span>
                    </div>
                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="h-7 w-px bg-white/20 shrink-0" />

                  {/* 3. CURRENT BOWLER */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                      BOWL
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold" style={{ color: theme.textColor }}>
                      P. Cummins
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-black text-emerald-400">
                      2/32
                      <span className="text-[10px] font-normal opacity-80 ml-1 text-slate-300">(3.4 Ov)</span>
                    </span>
                    <span className="text-[9px] font-mono opacity-80 hidden lg:inline-block" style={{ color: theme.textMutedColor }}>
                      Econ 8.7
                    </span>
                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="h-7 w-px bg-white/20 shrink-0" />

                  {/* 4. THIS OVER BALL-BY-BALL DOTS & OVER RUNS */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      OVER
                    </span>
                    {theme.showBallByBallDots && (
                      <div className="flex items-center gap-1">
                        {['1', '4', '0', '6', 'W', '2'].map((b, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center font-black text-[9px] sm:text-[10px] font-mono shadow-sm ${
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
                    <span 
                      className="px-1.5 py-0.5 rounded font-black text-[9px] tracking-wider uppercase shrink-0"
                      style={{ 
                        backgroundColor: `${theme.primaryAccent}25`,
                        color: theme.primaryAccent,
                        border: `1px solid ${theme.primaryAccent}60`
                      }}
                    >
                      +13 RUNS
                    </span>
                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="h-7 w-px bg-white/20 shrink-0" />

                  {/* 5. TARGET & EQUATION / WIN PROBABILITY */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-slate-300">
                          {previewInnings === 2 ? 'TGT 195 • NEED 27 (20b)' : '1ST INNINGS • PROJ 190'}
                        </span>
                        <span className="text-[8.5px] font-mono px-1 rounded bg-white/10 text-amber-300">
                          {previewInnings === 2 ? 'RRR 8.1' : 'CRR 7.55'}
                        </span>
                      </div>
                      {theme.showWinProbability && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8.5px] font-mono font-bold text-sky-400">WIN: IND 68%</span>
                          <div className="w-14 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="w-[68%] h-full bg-sky-400 rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* VERTICAL DIVIDER */}
                  <div className="h-7 w-px bg-white/20 shrink-0" />

                  {/* 6. OPPONENT TEAM & SPONSOR BADGE */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div 
                      className="px-2.5 py-1 rounded font-black text-xs sm:text-sm tracking-wider uppercase text-white shadow shrink-0"
                      style={{ backgroundColor: theme.teamBColor }}
                    >
                      AUS
                    </div>
                    {theme.showSponsorBadge && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 border border-white/10 text-[9px] font-black text-amber-400 uppercase tracking-wider shrink-0">
                        <span>🏆</span>
                        <span className="truncate max-w-[110px]">{theme.sponsorText || 'GPL 2026'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* TICKER RUNNING RIBBON (IF ENABLED) */}
                {theme.showTicker && (
                  <div 
                    className="px-3 sm:px-4 py-1 text-[9.5px] sm:text-[10px] font-bold tracking-wider uppercase border-t border-white/10 flex items-center justify-between overflow-hidden"
                    style={{ 
                      background: theme.bgType === 'gradient' ? 'rgba(0,0,0,0.5)' : `${theme.bgColor}F0`, 
                      color: theme.secondaryAccent 
                    }}
                  >
                    <div className="truncate flex items-center gap-2">
                      <Sparkles size={11} className="shrink-0 animate-pulse" />
                      <span>{theme.tickerMessage || 'LIVE BROADCAST • GULLY SCOREBOARD TV GRAPHICS • HIGH DEFINITION 1080P'}</span>
                    </div>
                    <span className="text-[8.5px] font-mono shrink-0 opacity-75 hidden sm:inline-block">
                      TV GRAPHICS ENGINE 4.2
                    </span>
                  </div>
                )}
              </div>
            )}
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
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ background: getThemeBackground(p.config) }} />
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

                {/* Score Bug Canvas Background: Solid vs Gradient Studio */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  {/* Header with Mode Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 text-sky-600 dark:text-sky-400">
                        <Palette size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                            Score Bug Canvas Background
                          </label>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                            {theme.bgType === 'gradient' ? `Gradient (${theme.bgGradientDirection || '135deg'})` : 'Solid Color'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Configure whether the score bug canvas uses a solid matte hue or a multi-stop broadcast TV gradient blend
                        </p>
                      </div>
                    </div>

                    {/* Mode Toggle: Solid Color vs Gradient Blend */}
                    <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBgType('solid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none ${
                          theme.bgType !== 'gradient'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-black'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-400/60" style={{ backgroundColor: theme.bgColor || '#0b0f19' }} />
                        Solid Color
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleBgType('gradient')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border-none ${
                          theme.bgType === 'gradient'
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-sm font-black'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent'
                        }`}
                      >
                        <Sparkles size={12} className={theme.bgType === 'gradient' ? 'text-amber-300' : ''} />
                        Gradient Blend
                      </button>
                    </div>
                  </div>

                  {/* SOLID COLOR CONTROLS */}
                  {theme.bgType !== 'gradient' ? (
                    <div className="space-y-4 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={theme.bgColor}
                            onChange={(e) => setTheme(prev => ({ ...prev, bgColor: e.target.value }))}
                            className="w-14 h-12 rounded-xl cursor-pointer border-2 border-slate-300 dark:border-slate-700 bg-transparent p-0.5 shadow-sm"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Selected HEX</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <input
                                type="text"
                                value={theme.bgColor}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^#[0-9A-Fa-f]{0,8}$/.test(val) || val === '') {
                                    setTheme(prev => ({ ...prev, bgColor: val }));
                                  }
                                }}
                                className="w-24 px-2 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none uppercase"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(theme.bgColor);
                                  setCopiedGradient(true);
                                  setTimeout(() => setCopiedGradient(false), 2000);
                                }}
                                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                title="Copy Hex Code"
                              >
                                {copiedGradient ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-[260px]">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Curated Broadcast Hues
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { hex: '#0b0f19', name: 'Obsidian Navy' },
                              { hex: '#0d1117', name: 'Deep Slate' },
                              { hex: '#0f0a28', name: 'Regal Violet' },
                              { hex: '#111318', name: 'Carbon Matte' },
                              { hex: '#1c1305', name: 'Amber Gold' },
                              { hex: '#022c22', name: 'Cyber Pitch' },
                              { hex: '#180509', name: 'Crimson Arena' },
                              { hex: '#030712', name: 'OLED Black' },
                              { hex: '#082f49', name: 'Sky Navy' },
                              { hex: '#ffffff', name: 'Daylight White' }
                            ].map(c => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setTheme(prev => ({ ...prev, bgColor: c.hex }))}
                                className={`group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                                  theme.bgColor.toLowerCase() === c.hex.toLowerCase()
                                    ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/5'
                                    : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                              >
                                <span
                                  className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                                  {c.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* GRADIENT BLEND CONTROLS */
                    <div className="space-y-4 pt-1">
                      {/* 1. 1-CLICK BROADCAST TV GRADIENT PRESETS */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Sparkles size={12} className="text-amber-400" />
                            1-Click Broadcast TV Gradient Presets (12 Options)
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {BROADCAST_GRADIENT_PRESETS.map(gp => {
                            const currentFrom = (theme.bgGradientFrom || theme.bgColor || '').toLowerCase();
                            const currentTo = (theme.bgGradientTo || '').toLowerCase();
                            const isPresetActive = currentFrom === gp.from.toLowerCase() && currentTo === gp.to.toLowerCase();
                            const previewGrad = computeGradientCss(gp.direction, gp.from, gp.to, gp.via);

                            return (
                              <button
                                key={gp.id}
                                type="button"
                                onClick={() => handleApplyGradientPreset(gp)}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group ${
                                  isPresetActive
                                    ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span
                                    className="w-5 h-5 rounded-full border border-white/20 shadow-sm shrink-0"
                                    style={{ background: previewGrad }}
                                  />
                                  {isPresetActive && (
                                    <Check size={12} className="text-sky-500 font-bold shrink-0" />
                                  )}
                                </div>
                                <div>
                                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate block">
                                    {gp.name}
                                  </span>
                                  <span className="text-[9px] text-slate-400 truncate block">
                                    {gp.desc}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. GRADIENT DIRECTION & ANGLE SELECTOR */}
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Gradient Direction & Angle
                          </span>
                          <span className="text-[10px] font-mono font-bold text-sky-500 uppercase">
                            {theme.bgGradientDirection || '135deg'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[
                            { id: '90deg', label: '→ Horizontal', desc: 'Left to Right' },
                            { id: '135deg', label: '↘ Diagonal', desc: 'Top-L to Bot-R' },
                            { id: '180deg', label: '↓ Vertical', desc: 'Top to Bottom' },
                            { id: '45deg', label: '↗ Angle Up', desc: 'Bot-L to Top-R' },
                            { id: '225deg', label: '↙ Angle Down', desc: 'Top-R to Bot-L' },
                            { id: 'radial', label: '🔘 Radial Glow', desc: 'Center Outward' }
                          ].map(dir => {
                            const isSelected = (theme.bgGradientDirection || '135deg') === dir.id;
                            return (
                              <button
                                key={dir.id}
                                type="button"
                                onClick={() => updateGradientField('direction', dir.id)}
                                className={`px-2.5 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-300 font-black shadow-sm'
                                    : 'border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                              >
                                <span className="text-[11px] font-bold block">{dir.label}</span>
                                <span className="text-[8.5px] opacity-70 block truncate">{dir.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. COLOR STOPS BUILDER */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {/* Start Color Stop */}
                        <div className="sm:col-span-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              Start Color (From)
                            </label>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {theme.bgGradientFrom || theme.bgColor || '#0b0f19'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={theme.bgGradientFrom || theme.bgColor || '#0b0f19'}
                              onChange={(e) => updateGradientField('from', e.target.value)}
                              className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={theme.bgGradientFrom || theme.bgColor || '#0b0f19'}
                              onChange={(e) => updateGradientField('from', e.target.value)}
                              className="w-24 px-2 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 uppercase outline-none"
                            />
                            <div className="flex items-center gap-1">
                              {['#0b0f19', '#030712', '#0f0a28', '#09090b', '#180509', '#022c22'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => updateGradientField('from', c)}
                                  className="w-5 h-5 rounded-full border border-black/20 transition-transform hover:scale-110 cursor-pointer"
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* SWAP / REVERSE BUTTON */}
                        <div className="sm:col-span-2 flex flex-col items-center justify-center">
                          <button
                            type="button"
                            onClick={handleSwapGradientColors}
                            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            title="Swap Gradient Colors"
                          >
                            <ArrowRightLeft size={14} className="text-sky-500" />
                            <span className="hidden sm:inline text-[10px]">Swap</span>
                          </button>
                        </div>

                        {/* End Color Stop */}
                        <div className="sm:col-span-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              End Color (To)
                            </label>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {theme.bgGradientTo || '#1e293b'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={theme.bgGradientTo || '#1e293b'}
                              onChange={(e) => updateGradientField('to', e.target.value)}
                              className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent shrink-0"
                            />
                            <input
                              type="text"
                              value={theme.bgGradientTo || '#1e293b'}
                              onChange={(e) => updateGradientField('to', e.target.value)}
                              className="w-24 px-2 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 uppercase outline-none"
                            />
                            <div className="flex items-center gap-1">
                              {['#1e293b', '#075985', '#3b0764', '#27272a', '#7f1d1d', '#065f46'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => updateGradientField('to', c)}
                                  className="w-5 h-5 rounded-full border border-black/20 transition-transform hover:scale-110 cursor-pointer"
                                  style={{ backgroundColor: c }}
                                  title={c}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* OPTIONAL 3-STOP ACCENT (VIA) TOGGLE */}
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="toggleThreeStops"
                            checked={showThreeStops || Boolean(theme.bgGradientVia)}
                            onChange={(e) => {
                              setShowThreeStops(e.target.checked);
                              if (!e.target.checked) {
                                updateGradientField('via', '');
                              } else {
                                updateGradientField('via', theme.primaryAccent || '#0ea5e9');
                              }
                            }}
                            className="w-4 h-4 rounded text-sky-500 accent-sky-500 cursor-pointer"
                          />
                          <label htmlFor="toggleThreeStops" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            Add 3-Color Midpoint Accent Stop (Via)
                          </label>
                        </div>

                        {(showThreeStops || theme.bgGradientVia) && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase text-slate-400">Mid Accent:</span>
                            <input
                              type="color"
                              value={theme.bgGradientVia || theme.primaryAccent || '#0ea5e9'}
                              onChange={(e) => updateGradientField('via', e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                            />
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                              {theme.bgGradientVia || theme.primaryAccent}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowThreeStops(false);
                                updateGradientField('via', '');
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold underline cursor-pointer ml-1"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 4. LIVE CANVAS GRADIENT PREVIEW RIBBON */}
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-400 flex items-center gap-1.5">
                            <Eye size={13} className="text-sky-400" />
                            Real-time Canvas Background Preview
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyGradientCss}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-mono text-[10px] font-bold transition-all flex items-center gap-1 border border-slate-700 cursor-pointer"
                          >
                            {copiedGradient ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                            {copiedGradient ? 'CSS Copied!' : 'Copy CSS'}
                          </button>
                        </div>

                        <div
                          className="w-full h-12 rounded-xl border border-white/20 shadow-inner flex items-center justify-between px-4 transition-all"
                          style={{
                            background: getThemeBackground(theme),
                            opacity: theme.bgOpacity
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider text-white drop-shadow">
                              Score Bug Preview Strip
                            </span>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-[280px]">
                            {getThemeBackground(theme)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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

                {/* Team A Brand Color & Label */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Team A (Batting) Emblem & Name
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.teamAColor}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Team A Name</label>
                      <input
                        type="text"
                        value={theme.teamAName || 'TEAM A'}
                        onChange={(e) => setTheme(prev => ({ ...prev, teamAName: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 uppercase"
                        placeholder="e.g. TEAM A or IND"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Team A Status Text</label>
                      <input
                        type="text"
                        value={theme.teamASubtext || 'BAT FIRST'}
                        onChange={(e) => setTheme(prev => ({ ...prev, teamASubtext: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 uppercase"
                        placeholder="e.g. BAT FIRST"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="color"
                      value={theme.teamAColor}
                      onChange={(e) => setTheme(prev => ({ ...prev, teamAColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#0143a3', '#002266', '#ea002a', '#dc2626', '#b91c1c', '#f97316', '#e11d48'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, teamAColor: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team B Brand Color & Label */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Team B (Bowling) Emblem & Name
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-500">{theme.teamBColor}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Team B Name</label>
                      <input
                        type="text"
                        value={theme.teamBName || 'TEAM B'}
                        onChange={(e) => setTheme(prev => ({ ...prev, teamBName: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 uppercase"
                        placeholder="e.g. TEAM B or AUS"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Team B Status Text</label>
                      <input
                        type="text"
                        value={theme.teamBSubtext || 'BOWLING'}
                        onChange={(e) => setTheme(prev => ({ ...prev, teamBSubtext: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 uppercase"
                        placeholder="e.g. BOWLING"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <input
                      type="color"
                      value={theme.teamBColor}
                      onChange={(e) => setTheme(prev => ({ ...prev, teamBColor: e.target.value }))}
                      className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['#c8102e', '#680816', '#00529b', '#2563eb', '#1d4ed8', '#0284c7', '#0891b2'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTheme(prev => ({ ...prev, teamBColor: c }))}
                          className="w-6 h-6 rounded-full border border-black/10 cursor-pointer transition-transform hover:scale-110"
                          style={{ backgroundColor: c }}
                          title={c}
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
                      { id: 'star-tv-broadcast', label: '⭐ Star TV Pro (Official Reference)', desc: 'Slanted Royal Blue & Crimson polygons with Elevated Center Shield Score & Ball Dots' },
                      { id: 'single-line', label: '⚡ Single-Line Scorebug (Recommended)', desc: 'All match details, batters, bowler & ball dots in 1 continuous TV line' },
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
