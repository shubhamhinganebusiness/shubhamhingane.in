import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Image as ImageIcon, Trash2, Check, Sparkles, Calendar, MapPin, Shield } from 'lucide-react';

export interface MatchBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: {
    id: string;
    teamAName: string;
    teamBName: string;
    date: string;
    time?: string;
    venue?: string;
    stage?: string;
    bannerUrl?: string;
  };
  onSaveBanner: (bannerUrl: string) => void;
}

export const MatchBannerModal: React.FC<MatchBannerModalProps> = ({
  isOpen,
  onClose,
  match,
  onSaveBanner,
}) => {
  const [bannerUrl, setBannerUrl] = useState<string>(match.bannerUrl || '');
  const [inputUrl, setInputUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setBannerUrl(compressed);
          }
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSaveBanner(bannerUrl);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 text-white"
        >
          {/* Top banner accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Modal Header */}
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <ImageIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  Match Broadcast Banner
                </h3>
                <p className="text-[11px] text-slate-400">
                  {match.teamAName} vs {match.teamBName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition cursor-pointer border-none"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Match Quick Info Card */}
            <div className="p-3 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 font-bold">
                <Shield size={14} className="text-emerald-400" />
                <span>{match.stage || 'Group Stage'}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {match.date}
                </span>
                {match.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {match.venue}
                  </span>
                )}
              </div>
            </div>

            {/* Banner Preview Area */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-dashed border-slate-700 flex items-center justify-center">
              {bannerUrl ? (
                <>
                  <img
                    src={bannerUrl}
                    alt="Match Banner"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => setBannerUrl('')}
                    className="absolute top-2 right-2 p-2 bg-rose-900/80 hover:bg-rose-800 text-white rounded-xl shadow-md border-none cursor-pointer"
                    title="Remove banner"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <ImageIcon size={24} />
                  </div>
                  <p className="text-xs text-slate-400 font-medium">No banner attached to this fixture</p>
                  <p className="text-[10px] text-slate-500">Upload high-res 16:9 poster or match graphics</p>
                </div>
              )}
            </div>

            {/* Upload or URL Controls */}
            <div className="grid grid-cols-1 gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition border-none shadow-md"
              >
                <Upload size={14} /> Upload Banner Image
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or paste external image URL..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (inputUrl.trim()) {
                      setBannerUrl(inputUrl.trim());
                      setInputUrl('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border-none cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-5 py-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-white/5 text-slate-300 rounded-xl text-xs font-bold border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border-none cursor-pointer shadow-md"
            >
              <Check size={14} /> Save Banner
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
