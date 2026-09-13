import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plus, Upload, Trash2, Edit2, Check, Sparkles, 
  ExternalLink, Phone, ShieldCheck, Eye, EyeOff, Building2, Store, HeartPulse, Award
} from 'lucide-react';
import { 
  LocalCricketSponsor, 
  getLocalSponsors, 
  saveSponsorToStorage, 
  deleteSponsorFromStorage, 
  fetchAllSponsors 
} from '../../utils/cricketSponsorsStorage';
import { uploadImageToStorage, STORAGE_FOLDERS } from '../../utils/imageUpload';

interface SponsorBannerManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SponsorBannerManagementModal: React.FC<SponsorBannerManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sponsors, setSponsors] = useState<LocalCricketSponsor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [sponsorTier, setSponsorTier] = useState<LocalCricketSponsor['sponsorTier']>('Powered By');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [displayOnOverBreakdown, setDisplayOnOverBreakdown] = useState(true);
  const [displayOnLiveStream, setDisplayOnLiveStream] = useState(true);
  const [displayOnScorecardPdf, setDisplayOnScorecardPdf] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSponsors();
    }
  }, [isOpen]);

  const loadSponsors = async () => {
    setLoading(true);
    const list = await fetchAllSponsors();
    setSponsors(list);
    setLoading(false);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setSponsorTier('Powered By');
    setTagline('');
    setPhone('');
    setWebsite('');
    setLogoUrl('https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80');
    setDisplayOnOverBreakdown(true);
    setDisplayOnLiveStream(true);
    setDisplayOnScorecardPdf(true);
    setShowAddForm(true);
  };

  const handleEdit = (sponsor: LocalCricketSponsor) => {
    setEditingId(sponsor.id);
    setName(sponsor.name);
    setSponsorTier(sponsor.sponsorTier);
    setTagline(sponsor.tagline || '');
    setPhone(sponsor.phone || '');
    setWebsite(sponsor.website || '');
    setLogoUrl(sponsor.logoUrl);
    setDisplayOnOverBreakdown(sponsor.displayOnOverBreakdown);
    setDisplayOnLiveStream(sponsor.displayOnLiveStream);
    setDisplayOnScorecardPdf(sponsor.displayOnScorecardPdf);
    setShowAddForm(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setUploadProgress(10);
    try {
      const uploadResult = await uploadImageToStorage(file, {
        folder: STORAGE_FOLDERS.ADS,
        onProgress: (progress) => {
          setUploadProgress(progress);
        }
      });
      setLogoUrl(uploadResult.url);
    } catch (err: any) {
      alert('Failed to upload logo: ' + (err?.message || 'Error'));
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const sponsorObj: LocalCricketSponsor = {
      id: editingId || `sponsor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      category: 'all',
      sponsorTier,
      tagline: tagline.trim(),
      phone: phone.trim(),
      website: website.trim(),
      logoUrl: logoUrl.trim() || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80',
      displayOnOverBreakdown,
      displayOnLiveStream,
      displayOnScorecardPdf,
      isActive: true,
      createdAt: editingId ? (sponsors.find((s) => s.id === editingId)?.createdAt || Date.now()) : Date.now(),
    };

    await saveSponsorToStorage(sponsorObj);
    setShowAddForm(false);
    loadSponsors();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this sponsor banner?')) {
      await deleteSponsorFromStorage(id);
      loadSponsors();
    }
  };

  const handleToggleActive = async (sponsor: LocalCricketSponsor) => {
    const updated = { ...sponsor, isActive: !sponsor.isActive };
    await saveSponsorToStorage(updated);
    loadSponsors();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden text-left my-auto"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-xl shadow-inner">
                🏪
              </div>
              <div>
                <h3 className="font-black text-base uppercase tracking-wider">
                  Sponsor Banner Management
                </h3>
                <p className="text-[11px] text-white/80 font-medium">
                  Add local bakeries, clinics, jewelers & politicians to overs, live overlays & PDF reports
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-xl bg-white text-orange-700 font-black text-xs uppercase tracking-wider hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Sponsor</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 max-h-[65vh] overflow-y-auto space-y-6">
            {/* Add / Edit Form Modal Subview */}
            {showAddForm && (
              <form onSubmit={handleSave} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3">
                  <h4 className="font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                    {editingId ? 'Edit Sponsor Banner' : 'New Local Sponsor Banner'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Sponsor / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shree Ganesh Jewellers, Sai Hospital"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Sponsorship Tier
                    </label>
                    <select
                      value={sponsorTier}
                      onChange={(e) => setSponsorTier(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    >
                      <option value="Title Sponsor">Title Sponsor (Headline Gold)</option>
                      <option value="Powered By">Powered By Sponsor</option>
                      <option value="Associate Partner">Associate Partner</option>
                      <option value="Local Community Partner">Local Community Partner</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Tagline / Promotional Message
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 24x7 Emergency Care • Near Shivaji Chowk, 10% Off for Players"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Contact Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98220 00000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Logo or Banner URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={13} />
                        <span>{uploadingLogo ? `${uploadProgress}%` : 'Upload'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Display Surfaces Checkboxes */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                    Display Locations Across GullyScore:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displayOnOverBreakdown}
                        onChange={(e) => setDisplayOnOverBreakdown(e.target.checked)}
                        className="rounded accent-orange-600"
                      />
                      <span>Over Breakdowns</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displayOnLiveStream}
                        onChange={(e) => setDisplayOnLiveStream(e.target.checked)}
                        className="rounded accent-orange-600"
                      />
                      <span>Live Stream Ticker</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displayOnScorecardPdf}
                        onChange={(e) => setDisplayOnScorecardPdf(e.target.checked)}
                        className="rounded accent-orange-600"
                      />
                      <span>Scorecard PDF</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    {editingId ? 'Update Sponsor' : 'Save Sponsor Banner'}
                  </button>
                </div>
              </form>
            )}

            {/* List of Sponsors */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Active Local Sponsors ({sponsors.length})
                </span>
                <span className="text-[11px] font-bold text-slate-400">
                  Shown automatically across match view & spectator screens
                </span>
              </div>

              {sponsors.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                  No sponsors added yet. Click &quot;Add Sponsor&quot; to give your local tournament sponsors spotlight!
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        sponsor.isActive
                          ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={sponsor.logoUrl}
                            alt={sponsor.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=300&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                {sponsor.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                {sponsor.sponsorTier}
                              </span>
                            </div>

                            {sponsor.tagline && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                                {sponsor.tagline}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-medium">
                              {sponsor.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone size={10} />
                                  {sponsor.phone}
                                </span>
                              )}
                              <span>•</span>
                              <div className="flex items-center gap-1.5">
                                {sponsor.displayOnOverBreakdown && <span className="text-emerald-600 font-bold">Overs ✓</span>}
                                {sponsor.displayOnLiveStream && <span className="text-blue-600 font-bold">Live Stream ✓</span>}
                                {sponsor.displayOnScorecardPdf && <span className="text-purple-600 font-bold">PDF ✓</span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(sponsor)}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                              sponsor.isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                            }`}
                            title={sponsor.isActive ? 'Active (click to deactivate)' : 'Inactive'}
                          >
                            {sponsor.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(sponsor)}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sponsor.id)}
                            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400">
              GullyScore Official Sponsor Engine
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-wider transition-opacity hover:opacity-90 cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
