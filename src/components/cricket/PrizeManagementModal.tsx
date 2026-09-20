import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Award, Trophy, Medal, Sparkles, Upload, Trash2, 
  Check, Eye, EyeOff, DollarSign, User, Camera, ArrowRight, RotateCcw, AlertCircle
} from 'lucide-react';
import { 
  TournamentPrize, 
  DEFAULT_FOUR_PRIZES, 
  SAMPLE_DEMO_PRIZES,
  getTournamentPrizes, 
  saveTournamentPrizes, 
  getValidActivePrizes 
} from '../../utils/cricketPrizeStorage';

interface PrizeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: string;
  onSaved?: (prizes: TournamentPrize[]) => void;
}

const AVATAR_PRESETS = [
  { label: 'Dignitary', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80' },
  { label: 'Leader', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Sponsor', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80' },
  { label: 'Patron', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80' },
  { label: 'Trophy', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&auto=format&fit=crop&q=80' },
];

export const PrizeManagementModal: React.FC<PrizeManagementModalProps> = ({
  isOpen,
  onClose,
  matchId,
  onSaved,
}) => {
  const [prizes, setPrizes] = useState<TournamentPrize[]>(DEFAULT_FOUR_PRIZES);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'preview'>('all');
  const [previewIndex, setPreviewIndex] = useState(0);

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (isOpen) {
      const stored = getTournamentPrizes(matchId);
      setPrizes(stored);
      setSavedSuccess(false);
    }
  }, [isOpen, matchId]);

  // Handle input changes
  const updatePrizeField = (id: string, field: keyof TournamentPrize, value: any) => {
    setPrizes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  // Image upload handling
  const handlePhotoUpload = (id: string, file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updatePrizeField(id, 'personPhoto', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    await saveTournamentPrizes(prizes, matchId);
    setSavedSuccess(true);
    if (onSaved) {
      onSaved(prizes);
    }
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2500);
  };

  const handleLoadDemo = () => {
    setPrizes(SAMPLE_DEMO_PRIZES);
  };

  const handleClearAll = () => {
    if (confirm('Clear all prize details? The prize banner above the scorebug will be hidden.')) {
      setPrizes(DEFAULT_FOUR_PRIZES);
    }
  };

  const validPrizes = getValidActivePrizes(prizes);

  // Auto-rotate preview if multiple
  useEffect(() => {
    if (validPrizes.length <= 1) return;
    const interval = setInterval(() => {
      setPreviewIndex((prev) => (prev + 1) % validPrizes.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [validPrizes.length]);

  const currentPreviewPrize = validPrizes[previewIndex % (validPrizes.length || 1)];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden z-10 my-4 text-white flex flex-col max-h-[92vh]"
      >
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <Trophy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-1.5">
                  Tournament Prize Money Manager
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono text-[9px] font-black uppercase tracking-wider border border-amber-400/30">
                  Above Scorebug
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Add prize sponsor name, photo, and cash award. Displays continuously above the TV Scorebug.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer border-none"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Informational Rule Box */}
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-medium text-[11.5px]">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <span>
              <strong>Note:</strong> If details are not added, the prize strip above the scorebug will remain <strong>completely hidden</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
              title="Load realistic demo names, photos and prize amounts"
            >
              <Sparkles size={11} />
              <span>Load Sample Prizes</span>
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
              title="Clear all fields"
            >
              <Trash2 size={11} />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        {/* Live Preview Strip (if prizes added) */}
        {validPrizes.length > 0 && (
          <div className="px-5 py-2.5 bg-black/60 border-b border-white/10 flex items-center justify-between gap-3 text-xs overflow-hidden">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 shrink-0 flex items-center gap-1">
              <Eye size={12} /> Scorebug Live Preview ({validPrizes.length} Active):
            </span>

            {/* Micro preview container mimicking the above-scorebug strip */}
            <div className="flex-1 max-w-2xl bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border border-amber-400/40 rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 shadow-md overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentPreviewPrize?.personPhoto ? (
                  <img
                    src={currentPreviewPrize.personPhoto}
                    alt={currentPreviewPrize.personName}
                    className="w-7 h-7 rounded-full object-cover border-2 border-amber-400 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center font-black text-xs shrink-0">
                    <Trophy size={14} />
                  </div>
                )}
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-amber-400">
                    <span>{currentPreviewPrize?.title}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-slate-300 font-normal">{currentPreviewPrize?.tagline || 'Sponsored By'}</span>
                  </div>
                  <strong className="text-xs font-black text-white truncate block">
                    {currentPreviewPrize?.personName || 'Sponsor Name'}
                    {currentPreviewPrize?.personDesignation && (
                      <span className="text-[10px] font-normal text-amber-200/80 ml-1">
                        ({currentPreviewPrize.personDesignation})
                      </span>
                    )}
                  </strong>
                </div>
              </div>

              <div className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-lg text-xs tracking-tight shadow-sm shrink-0 flex items-center gap-1">
                <span>{currentPreviewPrize?.currency || '₹'}</span>
                <span>{currentPreviewPrize?.amount || '0'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area: 4 Prize Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prizes.map((prize, idx) => {
              const isConfigured = Boolean(prize.personName?.trim() || prize.amount?.trim());
              const getCategoryIcon = () => {
                switch (prize.category) {
                  case 'best_batsman':
                    return <span className="text-base">🏏</span>;
                  case 'best_bowler':
                    return <span className="text-base">🎯</span>;
                  case 'man_of_series':
                    return <span className="text-base">⭐</span>;
                  default:
                    return <span className="text-base">🏆</span>;
                }
              };

              return (
                <div
                  key={prize.id}
                  className={`p-4 rounded-2xl border transition-all relative ${
                    prize.isActive && isConfigured
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900/40 border-slate-800 opacity-90'
                  }`}
                >
                  {/* Card Header with Status & Active Toggle */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                        {getCategoryIcon()}
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                          Prize #{idx + 1}
                        </span>
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                          {prize.title || `Award ${idx + 1}`}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isConfigured ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[8.5px] font-black uppercase tracking-wider border border-emerald-500/40">
                          Active on Bug
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[8.5px] font-bold uppercase tracking-wider">
                          Not Added
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => updatePrizeField(prize.id, 'isActive', !prize.isActive)}
                        className={`p-1.5 rounded-lg border-none cursor-pointer transition-all ${
                          prize.isActive
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                        title={prize.isActive ? 'Prize is Enabled' : 'Prize is Disabled'}
                      >
                        {prize.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3 text-left font-sans">
                    {/* Award Title */}
                    <div>
                      <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        Award Title / Category
                      </label>
                      <input
                        type="text"
                        value={prize.title}
                        onChange={(e) => updatePrizeField(prize.id, 'title', e.target.value)}
                        placeholder="e.g. Best Batsman Award"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Prize Sponsor Name & Designation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                          Prize Given By (Person Name) *
                        </label>
                        <input
                          type="text"
                          value={prize.personName}
                          onChange={(e) => updatePrizeField(prize.id, 'personName', e.target.value)}
                          placeholder="e.g. Shri Ramesh Patil"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Designation / Title (Optional)
                        </label>
                        <input
                          type="text"
                          value={prize.personDesignation || ''}
                          onChange={(e) => updatePrizeField(prize.id, 'personDesignation', e.target.value)}
                          placeholder="e.g. Sarpanch, Gram Panchayat"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Prize Money Amount & Currency */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="col-span-1">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                          Currency
                        </label>
                        <select
                          value={prize.currency || '₹'}
                          onChange={(e) => updatePrizeField(prize.id, 'currency', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="₹">₹ (INR)</option>
                          <option value="$">$ (USD)</option>
                          <option value="AED">AED</option>
                          <option value="PKR">PKR</option>
                          <option value="£">£ (GBP)</option>
                          <option value="€">€ (EUR)</option>
                          <option value="৳">৳ (BDT)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-amber-300 block mb-1">
                          Prize Money Amount *
                        </label>
                        <input
                          type="text"
                          value={prize.amount}
                          onChange={(e) => updatePrizeField(prize.id, 'amount', e.target.value)}
                          placeholder="e.g. 11,000 or 25,000"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-black text-amber-300 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Sponsor Photo Section */}
                    <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <Camera size={12} className="text-amber-400" />
                          Prize Person Photo
                        </label>
                        {prize.personPhoto && (
                          <button
                            type="button"
                            onClick={() => updatePrizeField(prize.id, 'personPhoto', '')}
                            className="text-[9px] text-rose-400 font-bold hover:underline bg-transparent border-none cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Avatar thumbnail preview */}
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                          {prize.personPhoto ? (
                            <img
                              src={prize.personPhoto}
                              alt={prize.personName || 'Sponsor'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={20} className="text-slate-600" />
                          )}
                        </div>

                        {/* Upload Button and URL Input */}
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => (fileInputRefs.current[prize.id] = el)}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(prize.id, file);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[prize.id]?.click()}
                              className="py-1.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer border-none shadow-sm flex items-center gap-1 transition-all active:scale-95"
                            >
                              <Upload size={11} />
                              <span>Upload Photo</span>
                            </button>

                            <span className="text-[10px] text-slate-500 font-medium">or paste URL:</span>
                          </div>

                          <input
                            type="text"
                            value={prize.personPhoto}
                            onChange={(e) => updatePrizeField(prize.id, 'personPhoto', e.target.value)}
                            placeholder="https://... or choose preset below"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[10.5px] text-slate-300 outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Quick Avatar Presets */}
                      <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] text-slate-400 font-bold">Quick Presets:</span>
                        {AVATAR_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => updatePrizeField(prize.id, 'personPhoto', preset.url)}
                            className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-md text-[9px] font-bold border border-slate-800 cursor-pointer transition-colors"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="px-5 py-4 bg-slate-950 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              {validPrizes.length > 0
                ? `${validPrizes.length} of 4 prizes configured for live broadcast`
                : 'No prizes configured (banner will remain hidden)'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border-none"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer border-none flex items-center justify-center gap-1.5 active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} className="text-slate-950" />
                  <span>Prizes Saved & Live!</span>
                </>
              ) : (
                <>
                  <Trophy size={14} className="text-slate-950" />
                  <span>Save Prize Details</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
