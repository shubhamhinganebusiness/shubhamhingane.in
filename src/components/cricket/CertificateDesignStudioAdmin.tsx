import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Palette, 
  Sparkles, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  QrCode, 
  Eye, 
  Sliders, 
  FileText, 
  Star, 
  Download, 
  RefreshCw,
  HelpCircle,
  ExternalLink,
  Layers,
  Flame,
  Medal,
  Trophy
} from 'lucide-react';
import { 
  CertificateConfigSettings, 
  DEFAULT_CERTIFICATE_CONFIG, 
  getCertificateConfig, 
  saveCertificateConfig, 
  subscribeCertificateConfig 
} from '../../utils/certificateConfigStorage';
import { 
  CERTIFICATE_THEMES, 
  CertificateThemeId, 
  CertificateTheme, 
  MatchAwardsCertificateModal,
  MatchCertificateData 
} from './MatchAwardsCertificateModal';
import { QRCodeSVG } from 'qrcode.react';

// Sample mock data for realistic, live interactive preview in Super Admin Studio
const SAMPLE_PREVIEW_DATA: MatchCertificateData = {
  matchId: 'LIVE_GPL_2026_FINALS',
  tournamentName: 'Gully Premier League 2026',
  matchDate: '17 Sep 2026',
  teamA: 'Shivaji Park Lions',
  teamB: 'Dadar Warriors',
  winner: 'Shivaji Park Lions',
  winReason: 'Won by 18 runs',
  playerOfTheMatch: {
    name: 'Rohit Sharma',
    runs: 87,
    balls: 42,
    fours: 8,
    sixes: 6,
    wickets: 2,
    runsConceded: 16,
    points: 145
  },
  bestBatsman: {
    name: 'Shubham Hingane',
    runs: 74,
    balls: 35,
    fours: 7,
    sixes: 5,
    wickets: 0,
    points: 110
  },
  bestBowler: {
    name: 'Jasprit Bumrah',
    runs: 12,
    balls: 6,
    wickets: 4,
    runsConceded: 14,
    points: 130
  }
};

export const CertificateDesignStudioAdmin: React.FC = () => {
  const [config, setConfig] = useState<CertificateConfigSettings>(DEFAULT_CERTIFICATE_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePreviewAward, setActivePreviewAward] = useState<'potm' | 'best_batter' | 'best_bowler'>('potm');
  const [showFullModalPreview, setShowFullModalPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<'theme' | 'branding' | 'content' | 'verification'>('theme');

  useEffect(() => {
    const unsub = subscribeCertificateConfig((loaded) => {
      setConfig(loaded);
    });
    return () => unsub();
  }, []);

  const handleFieldChange = <K extends keyof CertificateConfigSettings>(
    key: K, 
    value: CertificateConfigSettings[K]
  ) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCertificateConfig(config);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save certificate design configuration:', err);
      alert('Failed to save certificate design configuration to database.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset certificate design settings to factory defaults?')) {
      setConfig(DEFAULT_CERTIFICATE_CONFIG);
    }
  };

  const currentTheme = CERTIFICATE_THEMES[config.defaultThemeId] || CERTIFICATE_THEMES.classic_ivory;

  // Active recipient in sample preview
  const currentRecipient = activePreviewAward === 'best_batter' 
    ? SAMPLE_PREVIEW_DATA.bestBatsman! 
    : activePreviewAward === 'best_bowler' 
    ? SAMPLE_PREVIEW_DATA.bestBowler! 
    : SAMPLE_PREVIEW_DATA.playerOfTheMatch;

  const activeAwardTitle = activePreviewAward === 'potm' 
    ? 'PLAYER OF THE MATCH' 
    : activePreviewAward === 'best_batter' 
    ? 'BEST BATSMAN OF THE MATCH' 
    : 'BEST BOWLER OF THE MATCH';

  const activeAwardBadge = activePreviewAward === 'potm' 
    ? '' 
    : activePreviewAward === 'best_batter' 
    ? 'POWER STRIKER' 
    : 'GOLDEN ARM BOWLER';

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Award size={22} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Match Certificate Design Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              Super Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Customize typography, themes, default sponsors, federation co-branding, seals, and QR verification for official match certificates.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFullModalPreview(true)}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Eye size={14} className="text-amber-400" />
            <span>Full Preview Modal</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-initial px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
            <span>{saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-sm"
        >
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Certificate design settings saved to cloud database and synced globally across all devices!</span>
        </motion.div>
      )}

      {/* Main Grid: Controls on Left, Live Canvas/Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Studio Edit Settings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Sub-Navigation Tabs */}
          <div className="bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm flex items-center justify-between gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSection('theme')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'theme' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Palette size={13} />
              <span>Theme</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('branding')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'branding' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Building2 size={13} />
              <span>Co-Branding</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('content')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'content' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText size={13} />
              <span>Typography</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('verification')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSection === 'verification' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <QrCode size={13} />
              <span>Security</span>
            </button>
          </div>

          {/* Tab 1: Theme Presets & Color Overrides */}
          {activeSection === 'theme' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Palette size={16} className="text-amber-500" />
                Official Certificate Theme
              </h3>
              <p className="text-xs text-gray-500">
                Official unified championship theme applied when tournament coordinators download or generate match awards.
              </p>

              <div className="pt-1">
                <div
                  className="p-4 rounded-2xl border border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/20 text-left relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-sm font-black uppercase text-gray-900 block">Midnight Royal Gold</span>
                      <span className="text-[11px] text-amber-700 font-bold">Standard Championship Edition</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <CheckCircle2 size={12} className="stroke-[3]" />
                      Active Theme
                    </span>
                  </div>

                  <div className="h-14 rounded-xl w-full border border-black/10 flex items-center justify-center p-2.5 mb-3" style={{ backgroundColor: currentTheme.bgFill }}>
                    <div className="w-full h-full rounded border flex items-center justify-around px-3" style={{ borderColor: currentTheme.primaryBorder }}>
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: currentTheme.accentColor }} />
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: currentTheme.subAccentColor }} />
                      <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: currentTheme.primaryBorder }} />
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed font-medium">
                    Features high-contrast midnight navy background, dual royal gold filigree framing, metallic championship seal, and high-visibility gold QR code verification.
                  </p>
                </div>
              </div>

              {/* Theme Details Preview Card */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-150 space-y-1.5 text-xs">
                <span className="font-extrabold uppercase text-[10px] text-gray-400 tracking-wider block">Selected Palette Properties</span>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Background:</span>
                  <span className="font-mono text-[11px] font-bold">{currentTheme.bgFill}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Primary Border:</span>
                  <span className="font-mono text-[11px] font-bold">{currentTheme.primaryBorder}</span>
                </div>
                <div className="flex items-center justify-between text-gray-700">
                  <span>Accent Tone:</span>
                  <span className="font-mono text-[11px] font-bold">{currentTheme.accentColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Co-Branding & Defaults */}
          {activeSection === 'branding' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-amber-500" />
                Federation & Sponsor Co-Branding
              </h3>
              <p className="text-xs text-gray-500">
                Configure default organizations, title sponsors, and cricket associations stamped onto certificates.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Default Tournament / Cup Name
                  </label>
                  <input
                    type="text"
                    value={config.defaultTournamentName}
                    onChange={(e) => handleFieldChange('defaultTournamentName', e.target.value)}
                    placeholder="e.g. Gully Premier League 2026"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Organizing Committee / Club Name
                  </label>
                  <input
                    type="text"
                    value={config.defaultOrganizerName}
                    onChange={(e) => handleFieldChange('defaultOrganizerName', e.target.value)}
                    placeholder="e.g. Tournament Organizing Committee"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Official Title Sponsor Name
                  </label>
                  <input
                    type="text"
                    value={config.defaultSponsorName}
                    onChange={(e) => handleFieldChange('defaultSponsorName', e.target.value)}
                    placeholder="e.g. Shree Ganesh Jewellers"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Sanctioning Federation / Board
                  </label>
                  <input
                    type="text"
                    value={config.defaultFederationName}
                    onChange={(e) => handleFieldChange('defaultFederationName', e.target.value)}
                    placeholder="e.g. Gully Cricket Association"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.enableSponsorBanner}
                      onChange={(e) => handleFieldChange('enableSponsorBanner', e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800">Display Top Co-Branding Banner</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.enableDualSignatures}
                      onChange={(e) => handleFieldChange('enableDualSignatures', e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800">Display Dual Signature Blocks (Committee & Federation)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Typography & Text Templates */}
          {activeSection === 'content' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <FileText size={16} className="text-amber-500" />
                Certificate Typography & Headlines
              </h3>
              <p className="text-xs text-gray-500">
                Customize the legal title, introductory phrasing, and footer accreditation.
              </p>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Main Header Title
                  </label>
                  <input
                    type="text"
                    value={config.customHeaderTitle}
                    onChange={(e) => handleFieldChange('customHeaderTitle', e.target.value)}
                    placeholder="e.g. CERTIFICATE OF EXCELLENCE"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Performance Subtitle Prefix
                  </label>
                  <input
                    type="text"
                    value={config.customSubtitleTemplate}
                    onChange={(e) => handleFieldChange('customSubtitleTemplate', e.target.value)}
                    placeholder="for outstanding match-winning performance as"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Security Seal Emblem Text
                  </label>
                  <input
                    type="text"
                    value={config.officialSealText}
                    onChange={(e) => handleFieldChange('officialSealText', e.target.value)}
                    placeholder="e.g. OFFICIAL SEAL"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-1">
                    Footer Verification Note
                  </label>
                  <input
                    type="text"
                    value={config.customFooterNote}
                    onChange={(e) => handleFieldChange('customFooterNote', e.target.value)}
                    placeholder="Verified & Certified by GullyScore Official"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Security & Verification */}
          {activeSection === 'verification' && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <QrCode size={16} className="text-amber-500" />
                Live QR Code & Match Verification
              </h3>
              <p className="text-xs text-gray-500">
                Ensure every generated and downloaded certificate carries scannable digital proof against tampering.
              </p>

              <div className="space-y-3 pt-1">
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.enableQrVerification}
                    onChange={(e) => handleFieldChange('enableQrVerification', e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black text-gray-900 block">Enable Dynamic QR Matrix</span>
                    <span className="text-[11px] text-gray-500 font-medium block">
                      Renders a high-density 2D QR code encoded with the live scorecard verification link.
                    </span>
                  </div>
                </label>

                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 flex items-start gap-3">
                  <ShieldCheck size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <strong className="block uppercase tracking-wider text-[10px] text-amber-800">Tamper-Proof Verification Standard</strong>
                    <p className="text-amber-800/80 leading-relaxed">
                      Scanning the certificate QR code immediately opens the completed match archive on GullyScore to cross-verify player runs, strike rate, wickets, and umpire logs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Live Responsive Certificate Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Preview Controls Bar */}
          <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-gray-400 mr-1">Preview Award:</span>
              <button
                type="button"
                onClick={() => setActivePreviewAward('potm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activePreviewAward === 'potm' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Trophy size={12} />
                <span>POTM</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewAward('best_batter')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activePreviewAward === 'best_batter' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Flame size={12} />
                <span>Best Bat</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewAward('best_bowler')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activePreviewAward === 'best_bowler' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                }`}
              >
                <Medal size={12} />
                <span>Best Bowl</span>
              </button>
            </div>

            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <Eye size={13} className="text-amber-500" />
              Live WYSIWYG Rendering
            </span>
          </div>

          {/* Certificate Graphic Frame */}
          <div className="bg-slate-900 rounded-3xl p-3 sm:p-5 shadow-xl border-2 border-slate-800 flex items-center justify-center overflow-x-auto">
            <div
              className="w-full max-w-2xl aspect-[1.414/1] border-4 rounded-3xl p-5 sm:p-7 shadow-2xl relative flex flex-col justify-between overflow-hidden text-center select-none transition-colors duration-300"
              style={{
                backgroundColor: currentTheme.bgFill,
                borderColor: currentTheme.primaryBorder,
                color: currentTheme.bodyText,
                backgroundImage: currentTheme.isLight
                  ? 'radial-gradient(circle at 50% 10%, rgba(180, 83, 9, 0.05) 0%, transparent 70%)'
                  : 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)'
              }}
            >
              {/* Ornate Triple Border Flourish */}
              <div
                className="absolute inset-2 sm:inset-3 border rounded-2xl pointer-events-none"
                style={{ borderColor: currentTheme.secondaryBorder }}
              />
              <div
                className="absolute inset-3 sm:inset-4 border border-dashed rounded-xl pointer-events-none"
                style={{ borderColor: currentTheme.innerBorder }}
              />

              {/* Corner Decorative Ornaments */}
              <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: currentTheme.accentColor }} />
              <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: currentTheme.accentColor }} />
              <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: currentTheme.accentColor }} />
              <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: currentTheme.accentColor }} />

              {/* Header: Co-branding Bar & Tournament Title */}
              <div className="relative z-10 space-y-1">
                {config.enableSponsorBanner && (
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[8px] sm:text-[9px] font-extrabold uppercase tracking-widest border mx-auto mb-0.5 shadow-xs"
                    style={{
                      backgroundColor: currentTheme.isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                      borderColor: currentTheme.secondaryBorder,
                      color: currentTheme.accentColor
                    }}
                  >
                    <span>Presented with</span>
                    <strong className="underline underline-offset-2">{config.defaultSponsorName || 'Title Sponsor'}</strong>
                    <span>•</span>
                    <strong>{config.defaultFederationName || 'Cricket Federation'}</strong>
                  </div>
                )}

                {/* Tournament Name */}
                <div className="flex items-center justify-center gap-2" style={{ color: currentTheme.accentColor }}>
                  <Star size={12} style={{ fill: currentTheme.accentColor }} />
                  <span className="text-[9.5px] sm:text-[11px] uppercase tracking-[0.25em] font-black" style={{ color: currentTheme.accentColor }}>
                    {config.defaultTournamentName || 'Tournament Name'}
                  </span>
                  <Star size={12} style={{ fill: currentTheme.accentColor }} />
                </div>

                <h1
                  className="text-base sm:text-xl md:text-2xl font-black uppercase tracking-wider font-serif"
                  style={{
                    color: currentTheme.titleGradient[0],
                    textShadow: currentTheme.isLight ? 'none' : '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                >
                  {config.customHeaderTitle || 'CERTIFICATE OF EXCELLENCE'}
                </h1>

                {activeAwardBadge && (
                  <div 
                    className="inline-block px-3 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border"
                    style={{
                      backgroundColor: currentTheme.sealBg,
                      borderColor: currentTheme.secondaryBorder,
                      color: currentTheme.subAccentColor
                    }}
                  >
                    {activeAwardBadge}
                  </div>
                )}
              </div>

              {/* Recipient & Performance Core */}
              <div className="relative z-10 py-1 sm:py-2 space-y-1.5">
                <p className="text-[9px] sm:text-[10px] font-medium tracking-wide italic font-serif" style={{ color: currentTheme.mutedText }}>
                  This prestigious accolade is proudly presented to
                </p>

                <div className="relative inline-block py-0.5 px-4">
                  <h2
                    className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight uppercase drop-shadow-md"
                    style={{ color: currentTheme.headingText }}
                  >
                    {currentRecipient.name}
                  </h2>
                  <div
                    className="h-0.5 w-3/4 mx-auto mt-0.5"
                    style={{ background: `linear-gradient(to right, transparent, ${currentTheme.accentColor}, transparent)` }}
                  />
                </div>

                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider" style={{ color: currentTheme.accentColor }}>
                  {config.customSubtitleTemplate}{' '}
                  <span
                    className="underline underline-offset-4"
                    style={{ color: currentTheme.headingText, textDecorationColor: currentTheme.secondaryBorder }}
                  >
                    {activeAwardTitle}
                  </span>
                </p>

                {/* Match Details & Context */}
                <p className="text-[8.5px] sm:text-[9.5px]" style={{ color: currentTheme.mutedText }}>
                  In the thrilling clash between <strong style={{ color: currentTheme.headingText }}>{SAMPLE_PREVIEW_DATA.teamA}</strong> vs{' '}
                  <strong style={{ color: currentTheme.headingText }}>{SAMPLE_PREVIEW_DATA.teamB}</strong>
                  {SAMPLE_PREVIEW_DATA.winner && ` • Won by ${SAMPLE_PREVIEW_DATA.winner}`}
                </p>

                {/* Stats Highlight Bar */}
                <div className="max-w-xs sm:max-w-sm mx-auto grid grid-cols-3 gap-1.5 pt-0.5">
                  <div
                    className="rounded-xl p-1.5 text-center border"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.cardBorder }}
                  >
                    <span className="text-[7.5px] uppercase font-black tracking-wider block" style={{ color: currentTheme.mutedText }}>
                      Runs Scored
                    </span>
                    <strong className="text-xs sm:text-sm font-mono font-black block text-emerald-400">
                      {currentRecipient.runs}
                    </strong>
                    {currentRecipient.balls ? (
                      <span className="text-[7px] font-mono" style={{ color: currentTheme.mutedText }}>
                        {currentRecipient.balls}b ({currentRecipient.fours || 0}x4, {currentRecipient.sixes || 0}x6)
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="rounded-xl p-1.5 text-center border"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.cardBorder }}
                  >
                    <span className="text-[7.5px] uppercase font-black tracking-wider block" style={{ color: currentTheme.mutedText }}>
                      Wickets Taken
                    </span>
                    <strong className="text-xs sm:text-sm font-mono font-black block text-cyan-400">
                      {currentRecipient.wickets}
                    </strong>
                    {currentRecipient.runsConceded !== undefined ? (
                      <span className="text-[7px] font-mono" style={{ color: currentTheme.mutedText }}>
                        {currentRecipient.runsConceded} runs
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="rounded-xl p-1.5 text-center border"
                    style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.cardBorder }}
                  >
                    <span className="text-[7.5px] uppercase font-black tracking-wider block" style={{ color: currentTheme.mutedText }}>
                      MVP Rating
                    </span>
                    <strong className="text-xs sm:text-sm font-mono font-black block" style={{ color: currentTheme.accentColor }}>
                      {currentRecipient.points}{' '}
                      <span className="text-[8px] font-sans font-normal" style={{ color: currentTheme.subAccentColor }}>
                        pts
                      </span>
                    </strong>
                    <span className="text-[7px] font-bold uppercase" style={{ color: currentTheme.mutedText }}>
                      Game Decider
                    </span>
                  </div>
                </div>
              </div>

              {/* Certificate Footer: 4 Distinct Verifiable Sections */}
              <div
                className="relative z-10 pt-1.5 border-t flex items-end justify-between text-left text-[8px] sm:text-[9px]"
                style={{ borderColor: currentTheme.secondaryBorder }}
              >
                {/* 1. Date & Match ID */}
                <div>
                  <span className="uppercase tracking-wider block text-[7px] font-black" style={{ color: currentTheme.mutedText }}>
                    Date of Match
                  </span>
                  <strong className="font-mono" style={{ color: currentTheme.headingText }}>
                    {SAMPLE_PREVIEW_DATA.matchDate}
                  </strong>
                  <span className="block text-[7px] mt-0.5" style={{ color: currentTheme.mutedText }}>
                    ID: {SAMPLE_PREVIEW_DATA.matchId}
                  </span>
                </div>

                {/* 2. Live QR Code for Instant Match Verification */}
                {config.enableQrVerification && (
                  <div className="flex flex-col items-center">
                    <div
                      className="p-1 rounded-lg border shadow-sm"
                      style={{ backgroundColor: currentTheme.qrBg, borderColor: currentTheme.secondaryBorder }}
                    >
                      <QRCodeSVG
                        value="https://shubhamhingane.in/cricket?match=live"
                        size={38}
                        bgColor={currentTheme.qrBg}
                        fgColor={currentTheme.qrFg}
                        level="M"
                      />
                    </div>
                    <span className="text-[6.5px] uppercase font-black tracking-widest mt-0.5" style={{ color: currentTheme.accentColor }}>
                      Scan to Verify
                    </span>
                  </div>
                )}

                {/* 3. Official Shield Seal */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center shadow-inner"
                    style={{
                      borderColor: currentTheme.sealBorder,
                      backgroundColor: currentTheme.sealBg,
                      color: currentTheme.sealIconColor
                    }}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  <span className="text-[6.5px] uppercase font-black tracking-widest mt-0.5" style={{ color: currentTheme.accentColor }}>
                    {config.officialSealText || 'OFFICIAL SEAL'}
                  </span>
                </div>

                {/* 4. Dual Signatures */}
                <div className="text-right">
                  <div className="h-4 flex items-end justify-end">
                    <span className="font-serif italic text-xs sm:text-sm" style={{ color: currentTheme.accentColor }}>
                      {config.defaultOrganizerName || 'Organizing Head'}
                    </span>
                  </div>
                  <div className="w-20 sm:w-24 border-b ml-auto my-0.5" style={{ borderColor: currentTheme.secondaryBorder }} />
                  <span className="uppercase tracking-wider block text-[7px] font-black" style={{ color: currentTheme.mutedText }}>
                    Organizing Committee
                  </span>
                  {config.enableDualSignatures && (
                    <span className="text-[6.5px] font-mono block" style={{ color: currentTheme.subAccentColor }}>
                      {config.defaultFederationName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Modal Simulator Preview */}
      {showFullModalPreview && (
        <MatchAwardsCertificateModal
          isOpen={showFullModalPreview}
          onClose={() => setShowFullModalPreview(false)}
          data={{
            ...SAMPLE_PREVIEW_DATA,
            tournamentName: config.defaultTournamentName,
            organizerName: config.defaultOrganizerName,
            sponsorName: config.defaultSponsorName,
            federationName: config.defaultFederationName
          }}
          initialAward={activePreviewAward}
        />
      )}
    </div>
  );
};
