import React, { useState } from 'react';
import { Camera, X, Eye, Maximize2, Info, Aperture, Clock, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PhotoItem {
  id: number;
  title: string;
  category: string;
  desc: string;
  url: string;
}

export interface ExifData {
  camera: string;
  lens: string;
  shutter: string;
  aperture: string;
  iso: string;
  focal: string;
}

interface AtelierGalleryProps {
  photos: PhotoItem[];
  getPhotoExif: (id: number) => ExifData;
}

export const AtelierGallery: React.FC<AtelierGalleryProps> = ({ photos, getPhotoExif }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  const categories = ['all', 'wedding', 'pre-wedding', 'portrait', 'editorial'];

  const filteredPhotos = activeCategory === 'all'
    ? photos
    : photos.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <section id="gallery" className="py-24 bg-slate-900 text-slate-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-amber-400">
              Archival Portfolio
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mt-2">
              Curated Works & Masterpieces
            </h2>
            <p className="mt-2 text-slate-400 text-sm max-w-xl">
              Each frame is an interplay of medium format depth, organic natural light, and bespoke color grading.
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => {
            const exif = getPhotoExif(photo.id);
            return (
              <div
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden bg-slate-800 border border-slate-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-4/5 w-full overflow-hidden bg-slate-950 relative">
                  <img
                    src={photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top Category Pill */}
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-black/60 backdrop-blur-md text-amber-400 border border-white/10">
                      {photo.category}
                    </span>
                  </div>

                  {/* Expand Icon */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10">
                    <Maximize2 size={14} />
                  </div>

                  {/* Bottom Metadata */}
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                      {photo.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {photo.desc}
                    </p>

                    {/* Exif Quick Pill */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-300">
                      <span className="flex items-center gap-1.5 truncate">
                        <Camera size={12} className="text-amber-400 shrink-0" />
                        {exif.camera}
                      </span>
                      <span className="text-amber-400 shrink-0">{exif.aperture}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/70 hover:bg-black text-white border border-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              {/* Photo Large Display */}
              <div className="lg:w-7/12 bg-black flex items-center justify-center relative min-h-[300px] overflow-hidden">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>

              {/* Photo Information & EXIF Data */}
              <div className="lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedPhoto.category}
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">
                    {selectedPhoto.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selectedPhoto.desc}
                  </p>

                  {/* Detailed EXIF Box */}
                  <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                    <h4 className="text-xs uppercase tracking-wider font-mono text-amber-400 flex items-center gap-1.5">
                      <Info size={13} />
                      Optical & Hardware Capture Data
                    </h4>
                    {(() => {
                      const exif = getPhotoExif(selectedPhoto.id);
                      return (
                        <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Camera Body</span>
                            <span className="text-slate-200 font-semibold">{exif.camera}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Lens Optic</span>
                            <span className="text-slate-200 font-semibold">{exif.lens}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Aperture size={12} className="text-amber-400" />
                            <div>
                              <span className="text-slate-500 block text-[10px]">Aperture</span>
                              <span className="text-slate-200 font-semibold">{exif.aperture}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-amber-400" />
                            <div>
                              <span className="text-slate-500 block text-[10px]">Shutter</span>
                              <span className="text-slate-200 font-semibold">{exif.shutter}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Sun size={12} className="text-amber-400" />
                            <div>
                              <span className="text-slate-500 block text-[10px]">ISO</span>
                              <span className="text-slate-200 font-semibold">ISO {exif.iso}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Focal Length</span>
                            <span className="text-slate-200 font-semibold">{exif.focal}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Back to Gallery
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
