import React, { useState, useRef } from 'react';
import {
  Folder,
  FolderTree,
  Upload,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  Layers,
  FileCheck,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  STORAGE_FOLDERS,
  StorageFolder,
  uploadImageToStorage,
  getFolderUploadPreset,
  getPlayerAvatarStoragePath,
  getTeamLogoStoragePath,
  getTournamentBannerStoragePath,
  getTournamentTrophyStoragePath,
  getMatchShareCardStoragePath,
  getSponsorBannerStoragePath,
  getPlayerDocStoragePath,
  UploadResult
} from './imageUpload';

interface FolderSpec {
  folder: StorageFolder;
  name: string;
  category: string;
  description: string;
  dimensions: string;
  targetSize: string;
  cacheControl: string;
  pathExample: string;
  icon: string;
  cricbuzzBenefit: string;
}

const CRICBUZZ_SPEC_LIST: FolderSpec[] = [
  {
    folder: STORAGE_FOLDERS.PLAYERS_AVATARS,
    name: 'Player Avatars (Headshots)',
    category: 'Players',
    description: 'Face-focused square profile photos for live scorecards, batsman/bowler badges, and squads.',
    dimensions: '200x200 (Square Crop, Upper-Body)',
    targetSize: '~12 - 18 KB WebP',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: getPlayerAvatarStoragePath('player_45'),
    icon: '🏏',
    cricbuzzBenefit: 'Eliminates 5MB camera photos lagging live commentary strips on low-bandwidth 2G/3G networks.'
  },
  {
    folder: STORAGE_FOLDERS.PLAYERS_ACTION,
    name: 'Player Action Shots',
    category: 'Players',
    description: 'In-game batting, bowling, and celebration high-res shots for player profile hubs.',
    dimensions: '960x960 Max',
    targetSize: '~60 - 90 KB WebP',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: 'players/action_shots/player_45_six_celebration.webp',
    icon: '⚡',
    cricbuzzBenefit: 'Sharp player profiles with crisp textures while maintaining sub-100KB payload.'
  },
  {
    folder: STORAGE_FOLDERS.TEAMS_LOGOS,
    name: 'Team Crests & Logos',
    category: 'Teams',
    description: 'Transparent emblem crests for match fixtures, live tickers, and standings tables.',
    dimensions: '200x200 (Alpha Transparency Contain)',
    targetSize: '~10 - 20 KB WebP/PNG',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: getTeamLogoStoragePath('team_warriors'),
    icon: '🛡️',
    cricbuzzBenefit: 'Vector-like clarity across both dark/light scoreboard overlays with zero background bleeding.'
  },
  {
    folder: STORAGE_FOLDERS.TOURNAMENTS_BANNERS,
    name: 'Tournament 16:9 Banners',
    category: 'Tournaments',
    description: 'Hero cover headers, league marketing banners, and spectator slider backdrops.',
    dimensions: '1280x720 (16:9 Landscape)',
    targetSize: '~70 - 110 KB WebP',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: getTournamentBannerStoragePath('premier_trophy_2026'),
    icon: '🏆',
    cricbuzzBenefit: 'Cinema-grade 16:9 banner displays without aspect-ratio stretching on mobile or desktop.'
  },
  {
    folder: STORAGE_FOLDERS.TOURNAMENTS_TROPHIES,
    name: 'Trophy & Award Assets',
    category: 'Tournaments',
    description: 'Championship cup icons, medals, and fair-play honors with transparent background.',
    dimensions: '400x400 (Alpha Transparency)',
    targetSize: '~25 - 40 KB WebP',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: getTournamentTrophyStoragePath('champions_cup'),
    icon: '🥇',
    cricbuzzBenefit: 'High-contrast awards presentation for post-match presentations and medal ceremonies.'
  },
  {
    folder: STORAGE_FOLDERS.MATCHES_SHARE_CARDS,
    name: 'Viral Match Share Cards',
    category: 'Matches',
    description: 'CricHeroes-style automated Player of the Match, centuries, and match result infographics.',
    dimensions: '1200x1350 (Social Portrait / WhatsApp)',
    targetSize: '~90 - 150 KB WebP',
    cacheControl: 'public, max-age=2592000',
    pathExample: getMatchShareCardPathExample('match_889'),
    icon: '📱',
    cricbuzzBenefit: 'Instant WhatsApp Status & Instagram Story sharing with zero quality degradation.'
  },
  {
    folder: STORAGE_FOLDERS.MATCHES_SCORECARDS,
    name: 'Official PDF Scorecards',
    category: 'Matches',
    description: 'Official downloadable match sheets with umpire endorsements and full statistical records.',
    dimensions: 'Printable Vector PDF / High-Res Doc',
    targetSize: '~150 - 300 KB PDF',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: 'matches/match_889/scorecards/official_scorecard_match_889.pdf',
    icon: '📑',
    cricbuzzBenefit: 'Official club verification, dispute resolution, and printable records for associations.'
  },
  {
    folder: STORAGE_FOLDERS.MATCHES_AUDIO,
    name: 'Gully Voice Audio Clips',
    category: 'Matches',
    description: 'Short over-by-over vernacular voice commentary and wicket excitement soundbites.',
    dimensions: 'AAC / MP3 Stream Audio',
    targetSize: '~30 - 80 KB / minute',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: 'matches/match_889/audio_commentary/clip_over_18.aac',
    icon: '🎙️',
    cricbuzzBenefit: 'Authentic local commentary streaming even under weak cellular reception.'
  },
  {
    folder: STORAGE_FOLDERS.ADS_SPONSORS,
    name: 'Sponsor & Advertiser Strips',
    category: 'Advertisements',
    description: '16:9 commercial banners for spectator scoreboard slider and broadcast streaming overlay.',
    dimensions: '1280x720 (16:9 Standard)',
    targetSize: '~80 - 120 KB WebP',
    cacheControl: 'public, max-age=31536000, immutable',
    pathExample: getSponsorBannerStoragePath('sponsor_local_dairy'),
    icon: '📢',
    cricbuzzBenefit: 'Guaranteed commercial impressions cached locally on spectators phones.'
  },
  {
    folder: STORAGE_FOLDERS.PLAYER_DOCS,
    name: 'Secure Player KYC / ID Proofs',
    category: 'Identity',
    description: 'Aadhaar / Government ID proofs for player verification and verified badge audits.',
    dimensions: '1200x1200 Max Secure',
    targetSize: '~100 - 180 KB WebP',
    cacheControl: 'private, max-age=3600 (Strict Zero-Trust)',
    pathExample: getPlayerDocStoragePath('user_990', 'aadhaar_card'),
    icon: '🔒',
    cricbuzzBenefit: 'Zero-trust protected bucket storage with strict owner-only access rules.'
  }
];

function getMatchShareCardPathExample(id: string) {
  return `matches/${id}/share_cards/potm.webp`;
}

export const CricbuzzStorageManager: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState<StorageFolder>(STORAGE_FOLDERS.PLAYERS_AVATARS);
  const [entityIdInput, setEntityIdInput] = useState<string>('player_virat_18');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Upload tester states
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [originalFileStats, setOriginalFileStats] = useState<{ name: string; size: number; type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeSpec = CRICBUZZ_SPEC_LIST.find((s) => s.folder === selectedFolder) || CRICBUZZ_SPEC_LIST[0];

  const categories = ['All', 'Players', 'Teams', 'Tournaments', 'Matches', 'Advertisements', 'Identity'];

  const filteredSpecs =
    activeCategory === 'All'
      ? CRICBUZZ_SPEC_LIST
      : CRICBUZZ_SPEC_LIST.filter((s) => s.category.toLowerCase() === activeCategory.toLowerCase());

  const handleFolderSelect = (folder: StorageFolder) => {
    setSelectedFolder(folder);
    if (folder === STORAGE_FOLDERS.PLAYERS_AVATARS || folder === STORAGE_FOLDERS.PLAYERS_ACTION) {
      setEntityIdInput('player_sample_01');
    } else if (folder === STORAGE_FOLDERS.TEAMS_LOGOS) {
      setEntityIdInput('team_royal_tigers');
    } else if (folder === STORAGE_FOLDERS.TOURNAMENTS_BANNERS || folder === STORAGE_FOLDERS.TOURNAMENTS_TROPHIES) {
      setEntityIdInput('premier_cup_2026');
    } else if (folder === STORAGE_FOLDERS.MATCHES_SHARE_CARDS) {
      setEntityIdInput('match_889_potm');
    } else if (folder === STORAGE_FOLDERS.ADS_SPONSORS) {
      setEntityIdInput('sponsor_prime_ad');
    } else if (folder === STORAGE_FOLDERS.PLAYER_DOCS) {
      setEntityIdInput('user_kyc_proof');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalFileStats({
      name: file.name,
      size: file.size,
      type: file.type
    });

    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadResult(null);
    setCopiedUrl(false);

    try {
      const preset = getFolderUploadPreset(selectedFolder);

      const result = await uploadImageToStorage(file, {
        folder: selectedFolder,
        entityId: entityIdInput.trim() || undefined,
        maxWidth: preset.maxWidth,
        maxHeight: preset.maxHeight,
        cropSquare: preset.cropSquare,
        quality: preset.quality,
        cacheControl: preset.cacheControl,
        onProgress: (p) => setUploadProgress(p)
      });

      setUploadResult(result);
      setUploadProgress(100);
    } catch (err: any) {
      console.error('Storage upload failed:', err);
      setUploadError(err?.message || 'Upload failed. Please check network.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2200);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getCompressionSavings = (origBytes: number, newBytes: number) => {
    if (!origBytes || !newBytes) return 0;
    const diff = origBytes - newBytes;
    return Math.max(0, Math.round((diff / origBytes) * 100));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-8 text-white shadow-2xl space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
              <Zap size={13} className="text-emerald-400" />
              CRICBUZZ & CRICHEROES ARCHITECTURE
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold border border-cyan-500/30">
              Google Cloud CDN
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <FolderTree className="text-emerald-400" size={28} />
            Firebase Storage Folder Hierarchy & Media Engine
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Cleanly separates high-frequency score data in Firestore from heavy media in Firebase Storage. Enforces
            automatic WebP compression, face-centric square crops, and immutable CDN caching headers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">Standard Target</span>
            <span className="text-sm font-bold text-amber-300">~15 KB WebP Avatars</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-right">
            <span className="text-[10px] font-mono text-slate-400 block uppercase">CDN Cache</span>
            <span className="text-sm font-bold text-emerald-400">1 Year Immutable</span>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Left = Folder Hierarchy Tree, Right = Selected Folder Inspector & Test Uploader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Folder Tree (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400 px-1">
            <span>STORAGE FOLDER DIRECTORY</span>
            <span>{filteredSpecs.length} FOLDERS</span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredSpecs.map((spec) => {
              const isSelected = selectedFolder === spec.folder;
              return (
                <div
                  key={spec.folder}
                  onClick={() => handleFolderSelect(spec.folder)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border text-left flex items-start gap-3 relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-950/60 via-slate-800 to-slate-800 border-emerald-500 shadow-lg shadow-emerald-900/30'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                      isSelected ? 'bg-emerald-500/20 text-white border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {spec.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className={`text-xs font-black truncate ${isSelected ? 'text-emerald-400' : 'text-white'}`}>
                        {spec.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{spec.targetSize}</span>
                    </div>

                    <p className="text-[11px] font-mono text-slate-400 truncate mb-1">gs://bucket/{spec.folder}/*</p>

                    <p className="text-[11.5px] text-slate-300 line-clamp-1">{spec.description}</p>
                  </div>

                  {isSelected && (
                    <div className="absolute right-2.5 bottom-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse block" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Folder Inspector & Live Test Uploader (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Folder Blueprint Spec Card */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/30">
                  {activeSpec.category} Pipeline
                </span>
                <h3 className="text-xl font-black text-white mt-2 flex items-center gap-2">
                  <span>{activeSpec.icon}</span> {activeSpec.name}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm mt-1">{activeSpec.description}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-slate-400 block">STANDARD DIMENSION</span>
                <span className="text-xs font-bold text-amber-300 font-mono">{activeSpec.dimensions}</span>
              </div>
            </div>

            {/* Spec Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10.5px] font-mono block mb-1">PATH PATTERN</span>
                <code className="text-emerald-400 font-mono text-[11px] break-all">{activeSpec.pathExample}</code>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 text-[10.5px] font-mono block mb-1">CACHE-CONTROL (CDN)</span>
                <code className="text-cyan-300 font-mono text-[11px] break-all">{activeSpec.cacheControl}</code>
              </div>
            </div>

            {/* Cricbuzz Competitive Advantage Note */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
              <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-bold block mb-0.5">Cricbuzz & CricHeroes Advantage:</strong>
                <span>{activeSpec.cricbuzzBenefit}</span>
              </div>
            </div>

            {/* Test Upload Form */}
            <div className="border-t border-slate-700/60 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Upload size={14} className="text-emerald-400" />
                  Live Upload Tester (Sharp WebP + CDN Pipeline)
                </h4>
                <span className="text-[11px] text-slate-400">Folder: <strong className="text-white">{selectedFolder}</strong></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8">
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">
                    ENTITY ID / CUSTOM FILENAME (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={entityIdInput}
                    onChange={(e) => setEntityIdInput(e.target.value)}
                    placeholder="e.g. rohit_sharma_01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-4 self-end">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                    id="cricbuzz-tester-file-input"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                  >
                    {uploading ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{uploadProgress}% Processing...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Select & Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Upload Error */}
              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <Info size={14} className="text-rose-400 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Result Preview Card */}
              {uploadResult && (
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 size={15} /> Upload & WebP Optimization Successful!
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {uploadResult.contentType}
                    </span>
                  </div>

                  {/* Image and metrics comparison */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={uploadResult.url}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div className="flex-1 space-y-1.5 text-xs w-full">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Storage Path:</span>
                        <code className="text-white font-mono text-[11px] truncate max-w-[220px]">
                          {uploadResult.path}
                        </code>
                      </div>

                      {originalFileStats && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">Bandwidth Saved:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <TrendingDown size={13} />
                            {getCompressionSavings(originalFileStats.size, uploadResult.size)}% (
                            {formatBytes(originalFileStats.size)} → {formatBytes(uploadResult.size)})
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Cache-Control:</span>
                        <span className="text-cyan-300 font-mono text-[10.5px]">{uploadResult.cacheControl || '1 Year Immutable'}</span>
                      </div>
                    </div>
                  </div>

                  {/* URL and Actions */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={uploadResult.url}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono truncate select-all"
                    />

                    <button
                      type="button"
                      onClick={() => copyToClipboard(uploadResult.url)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border border-slate-700"
                    >
                      {copiedUrl ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedUrl ? 'Copied' : 'Copy CDN URL'}</span>
                    </button>

                    <a
                      href={uploadResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all border border-slate-700 shrink-0"
                      title="Open in new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
