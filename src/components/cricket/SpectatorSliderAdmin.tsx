import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit2, Image as ImageIcon, Check, X, 
  ExternalLink, Eye, EyeOff, AlertCircle, Sparkles, Upload, 
  RefreshCw, Sliders, ShieldCheck, ArrowUpDown
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, doc, setDoc, getDocs, deleteDoc, 
  query, orderBy, serverTimestamp, updateDoc 
} from 'firebase/firestore';
import { useAuth } from '../AuthContext';

export interface SliderImageDoc {
  id: string;
  imageUrl: string;
  title: string;
  order: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string;
}

interface SpectatorSliderAdminProps {
  onClose?: () => void;
}

const AUTHORIZED_ADMIN_EMAILS = [
  'jamkhednewsnetwork@gmail.com',
  'shubhamhingane7719@gmail.com',
  'shubhamingane7719@gmail.com',
  '771999595@admin.com',
  '7719959593@admin.com',
  'shubhamhinganebusiness@gmail.com',
  'streetsportsoffical@gmail.com'
];

export const SpectatorSliderAdmin: React.FC<SpectatorSliderAdminProps> = () => {
  const { user, role, isSuperAdmin: contextIsSuperAdmin } = useAuth();
  
  const isSuperAdmin = Boolean(
    contextIsSuperAdmin ||
    role === 'super_admin' ||
    (user?.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase()))
  );

  const [images, setImages] = useState<SliderImageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    imageUrl: '',
    title: '',
    order: 0,
    isActive: true
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Live test preview state
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'spectator_slider_images'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const list: SliderImageDoc[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          imageUrl: data.imageUrl || '',
          title: data.title || '',
          order: typeof data.order === 'number' ? data.order : 0,
          isActive: data.isActive !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy
        });
      });
      setImages(list);
    } catch (err: any) {
      console.error('Error fetching spectator slider images:', err);
      handleFirestoreError(err, OperationType.LIST, 'spectator_slider_images');
      setError('Could not fetch slider images. Please check permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      imageUrl: '',
      title: '',
      order: images.length,
      isActive: true
    });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: SliderImageDoc) => {
    setEditingId(item.id);
    setFormData({
      imageUrl: item.imageUrl,
      title: item.title,
      order: item.order,
      isActive: item.isActive
    });
    setIsFormOpen(true);
  };

  // Convert uploaded image file to lightweight, 16:9 optimized data URL
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result;
      if (typeof src !== 'string') {
        setUploadingImage(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Standard 16:9 canvas scaling (max 1280x720 for crisp quality)
          let maxWidth = 1280;
          let maxHeight = 720;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setFormData((prev) => ({ ...prev, imageUrl: optimizedDataUrl }));
          }
        } catch (canvasErr) {
          console.warn('Canvas optimization fallback to original:', canvasErr);
          setFormData((prev) => ({ ...prev, imageUrl: src }));
        } finally {
          setUploadingImage(false);
        }
      };
      img.onerror = () => {
        setUploadingImage(false);
        alert('Failed to process image.');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Unauthorized. Only portfolio super admin can add or modify slider images.');
      return;
    }

    if (!formData.imageUrl.trim()) {
      alert('Please provide an image URL or upload an image file.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const docId = editingId || `slide_${Date.now()}`;
      const payload: any = {
        imageUrl: formData.imageUrl.trim(),
        title: formData.title.trim(),
        order: Number(formData.order) || 0,
        isActive: Boolean(formData.isActive),
        updatedAt: new Date().toISOString(),
        createdBy: user?.email || 'super_admin'
      };

      if (!editingId) {
        payload.createdAt = new Date().toISOString();
      }

      await setDoc(doc(db, 'spectator_slider_images', docId), payload, { merge: true });

      setSuccessMsg(editingId ? 'Slider image updated successfully!' : 'New 16:9 slider image added successfully!');
      setIsFormOpen(false);
      setEditingId(null);
      await fetchImages();

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Failed to save slider image:', err);
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, 'spectator_slider_images');
      setError(`Failed to save image: ${err.message || 'Permission denied'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: SliderImageDoc) => {
    if (!isSuperAdmin) return;
    try {
      const newStatus = !item.isActive;
      await updateDoc(doc(db, 'spectator_slider_images', item.id), {
        isActive: newStatus,
        updatedAt: new Date().toISOString()
      });
      setImages((prev) =>
        prev.map((img) => (img.id === item.id ? { ...img, isActive: newStatus } : img))
      );
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isSuperAdmin) return;
    if (!window.confirm('Are you sure you want to delete this slider image?')) return;

    try {
      await deleteDoc(doc(db, 'spectator_slider_images', id));
      setImages((prev) => prev.filter((img) => img.id !== id));
      setSuccessMsg('Slider image deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete slider image:', err);
      handleFirestoreError(err, OperationType.DELETE, 'spectator_slider_images');
      alert(`Delete failed: ${err.message || 'Permission denied'}`);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center max-w-lg mx-auto my-8">
        <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-black text-rose-900 mb-1">Access Restricted</h3>
        <p className="text-xs text-rose-600 font-medium">
          Only Portfolio Super Admins have privileges to add, reorder, or delete spectator slider images.
        </p>
      </div>
    );
  }

  return (
    <div id="spectator-slider-admin" className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Sliders size={22} />
            </div>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
              16:9 Aspect Ratio
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-black uppercase tracking-wider border border-indigo-500/20">
              Super Admin Only
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Spectator Details Page Slider
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
            Manage promotional graphics, tournament announcements, and sponsor banners for the 16:9 slider on the spectator scoreboard details page. In this slider, the official Match Banner will also appear automatically whenever a match has one!
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchImages}
            disabled={loading}
            className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5"
            title="Refresh list"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={handleOpenAddForm}
            id="btn-add-slider-image"
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} />
            <span>Add Slider Image</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Informational Guidance Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
              Automatic Match Banner Integration
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
              Viewers on the spectator details page will see your uploaded slider images in rotation. When a match has its own custom banner, the banner is automatically merged into the first slide!
            </p>
          </div>
        </div>
      </div>

      {/* Images List Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading slider images...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <ImageIcon size={26} />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">No Slider Images Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
            Add custom 16:9 images for sponsors, tournament schedules, or trophy reveals. Note: The match banner will still display automatically when matches provide one.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer"
            >
              + Add First 16:9 Image
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm transition-all duration-200 flex flex-col justify-between group ${
                item.isActive
                  ? 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md'
                  : 'border-slate-200/40 dark:border-slate-800/40 opacity-70 bg-slate-50/50 dark:bg-slate-950/40'
              }`}
            >
              {/* 16:9 Thumbnail preview */}
              <div className="w-full aspect-[16/9] relative bg-slate-950 overflow-hidden flex items-center justify-center">
                {/* Backdrop blur */}
                <div
                  className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-105 pointer-events-none"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />

                <img
                  src={item.imageUrl}
                  alt={item.title || 'Slider image'}
                  className="w-full h-full object-contain relative z-10"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Status and Order Pills */}
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono font-bold text-amber-300 border border-white/10">
                    16:9
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono font-bold text-slate-300 border border-white/10">
                    #{item.order}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5 z-20">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold uppercase tracking-wider shadow-sm ${
                      item.isActive
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Content info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {item.title || 'Untitled Slide'}
                  </h4>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1 ${
                      item.isActive
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600'
                    }`}
                    title={item.isActive ? 'Hide from slider' : 'Show in slider'}
                  >
                    {item.isActive ? <EyeOff size={11} /> : <Eye size={11} />}
                    <span>{item.isActive ? 'Disable' : 'Enable'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditForm(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all border-none cursor-pointer"
                      title="Edit slide"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 transition-all border-none cursor-pointer"
                      title="Delete slide"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-6 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {editingId ? 'Edit Slider Image (16:9)' : 'Add New Slider Image (16:9)'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      Configured for the spectator details page slider
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl bg-transparent border-none cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Image Selection Tabs / Inputs */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Slider Image Source (16:9 Ratio recommended)
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste Image URL (https://...)"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Upload size={14} />
                      <span>{uploadingImage ? 'Optimizing...' : 'Upload File'}</span>
                    </button>
                  </div>
                </div>

                {/* 16:9 Live Preview Box */}
                {formData.imageUrl ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Live 16:9 Preview
                    </span>
                    <div className="w-full aspect-[16/9] max-h-[220px] bg-slate-950 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                      <div
                        className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-105 pointer-events-none"
                        style={{ backgroundImage: `url(${formData.imageUrl})` }}
                      />
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-contain relative z-10"
                        referrerPolicy="no-referrer"
                        onError={() => setError('Image failed to load from provided URL.')}
                      />
                      <span className="absolute bottom-2 left-2 z-20 px-2 py-0.5 rounded bg-black/75 text-[9px] font-mono font-bold text-amber-300 border border-white/10">
                        16:9 Frame
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] max-h-[140px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 space-y-1">
                    <ImageIcon size={24} />
                    <span className="text-[11px] font-medium">Image preview will show here in 16:9 ratio</span>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Title / Banner Heading (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tournament Grand Finale • 15 August"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Display Order & Active status */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Display Priority Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30"
                      min={0}
                    />
                    <span className="text-[10px] text-slate-400">Lower numbers appear first</span>
                  </div>

                  <div className="space-y-1 flex flex-col justify-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Active In Spectator Slider
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {formData.isActive ? 'Active (Visible)' : 'Draft (Hidden)'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border-none cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || !formData.imageUrl}
                    id="btn-save-slider-image"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    {saving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingId ? 'Update Image' : 'Save To Slider'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
