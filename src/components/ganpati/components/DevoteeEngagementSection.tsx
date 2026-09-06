import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Video, 
  Image as ImageIcon, 
  Sparkles, 
  Send, 
  QrCode, 
  ThumbsUp, 
  Flame, 
  Radio, 
  Users, 
  Share2, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MannatPrayer, GalleryItem, MandalProfile, MandalLanguage } from '../types';
import { mandalTranslations } from '../translations/mandalTranslations';

interface DevoteeEngagementSectionProps {
  mannats: MannatPrayer[];
  gallery: GalleryItem[];
  mandal: MandalProfile;
  lang: MandalLanguage;
  onAddMannat: (newMannat: Omit<MannatPrayer, 'id'>) => void;
  onTriggerDonation: () => void;
}

export const DevoteeEngagementSection: React.FC<DevoteeEngagementSectionProps> = ({
  mannats,
  gallery,
  mandal,
  lang,
  onAddMannat,
  onTriggerDonation
}) => {
  const t = mandalTranslations[lang];
  const [activeTab, setActiveTab] = useState<'darshan' | 'mannat' | 'gallery'>('darshan');
  const [moryaClicks, setMoryaClicks] = useState(10548);
  const [hasClickedMorya, setHasClickedMorya] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('All');

  // Mannat Form
  const [isMannatOpen, setIsMannatOpen] = useState(false);
  const [mannatForm, setMannatForm] = useState({
    devoteeName: '',
    city: 'पुणे',
    prayer: ''
  });

  const handleMoryaClick = () => {
    setMoryaClicks(prev => prev + 1);
    setHasClickedMorya(true);
    setTimeout(() => setHasClickedMorya(false), 800);
  };

  const handleMannatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mannatForm.devoteeName || !mannatForm.prayer) return;

    onAddMannat({
      devoteeName: mannatForm.devoteeName.trim(),
      city: mannatForm.city.trim() || 'पुणे',
      prayer: mannatForm.prayer.trim(),
      date: new Date().toISOString().split('T')[0],
      isFulfilled: false,
      likes: 1
    });

    setMannatForm({
      devoteeName: '',
      city: 'पुणे',
      prayer: ''
    });
    setIsMannatOpen(false);
  };

  const filteredGallery = gallery.filter(g => {
    if (galleryFilter === 'All') return true;
    return g.category === galleryFilter;
  });

  return (
    <div className="space-y-8">
      
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('darshan')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'darshan' 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-rose-900/20' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Radio size={15} className="animate-pulse" />
            {t.devotee.liveDarshan}
          </button>

          <button 
            onClick={() => setActiveTab('mannat')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'mannat' 
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-900/20' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Heart size={15} />
            {t.devotee.mannatWall} ({mannats.length})
          </button>

          <button 
            onClick={() => setActiveTab('gallery')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'gallery' 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <ImageIcon size={15} />
            {t.devotee.gallery}
          </button>
        </div>

        <button 
          onClick={onTriggerDonation}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md shadow-orange-900/20 transition-all"
        >
          <Sparkles size={15} />
          {t.devotee.onlineDonation}
        </button>
      </div>

      {/* 24x7 Live Stream Player */}
      {activeTab === 'darshan' && (
        <div className="space-y-6">
          <div className="relative rounded-[3rem] overflow-hidden bg-black shadow-2xl border-4 border-amber-500/40">
            
            {/* Live Indicator Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-white text-xs font-black tracking-wider uppercase flex items-center gap-1.5">
                <Radio size={13} className="text-red-400" /> LIVE 24x7 HD DARSHAN
              </span>
              <span className="text-white/60 text-[10px] pl-1 border-l border-white/20">
                १,२४० भाविक लाईव्ह
              </span>
            </div>

            {/* Video Frame Simulation */}
            <div className="relative aspect-video w-full max-h-[520px] bg-zinc-950 flex items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1567591974584-f1832dfcad32?auto=format&fit=crop&q=80&w=1200" 
                alt="Live Ganpati Darshan" 
                className="w-full h-full object-cover opacity-90"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Central Blessing Overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pointer-events-auto">
                <div>
                  <span className="px-3 py-1 bg-amber-500/80 text-black text-[10px] font-black rounded-full uppercase tracking-wider mb-2 inline-block">
                    श्री शिवतेज मंडळ • मुख्य गाभारा थेट प्रक्षेपण
                  </span>
                  <h3 className="text-white font-black text-xl sm:text-2xl drop-shadow-md">
                    काशी विश्वनाथ मंदिर प्रतिकृती देखावा दर्शन
                  </h3>
                </div>

                {/* Interactive Jai Jai Kara Button */}
                <motion.button 
                  whileTap={{ scale: 0.92 }}
                  onClick={handleMoryaClick}
                  className="px-6 py-3.5 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white rounded-2xl font-black text-sm shadow-2xl flex items-center gap-2.5 hover:opacity-95 transition-all border border-amber-300/40 relative"
                >
                  <Flame size={18} className="text-amber-200 animate-bounce" />
                  <span>गणपती बाप्पा मोरया! ({moryaClicks.toLocaleString()})</span>
                  {hasClickedMorya && (
                    <motion.span 
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -40 }}
                      className="absolute -top-6 text-amber-300 font-black text-xs"
                    >
                      +१ जयघोष! 🚩
                    </motion.span>
                  )}
                </motion.button>
              </div>
            </div>

          </div>

          {/* Darshan Guidelines & Rules */}
          <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
            <h4 className="text-base font-black text-main-text mb-3">दर्शनार्थी नियमावली व सोयीसुविधा</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl">
                <span className="font-bold text-main-text block mb-1">⏰ दर्शन वेळा</span>
                सकाळी ०६:०० ते रात्री १२:०० (अखंड चालू)
              </div>
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl">
                <span className="font-bold text-main-text block mb-1">🦽 दिव्यांग व ज्येष्ठ नागरिक</span>
                गेट क्र. २ जवळ मोफत व्हीलचेअर व थेट प्रवेश
              </div>
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/40 rounded-2xl">
                <span className="font-bold text-main-text block mb-1">🍬 महाप्रसाद वाटप</span>
                दुपारी १२:३० ते ०३:०० व रात्री ०८:०० ते १०:३०
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mannat & Prayers Wall */}
      {activeTab === 'mannat' && (
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-main-text tracking-tight flex items-center gap-2">
                <Heart className="text-rose-500" size={22} />
                {t.devotee.mannatWall}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                बाप्पांच्या चरणी आपले साकडं, प्रार्थना किंवा नवस अर्पण करा.
              </p>
            </div>

            <button 
              onClick={() => setIsMannatOpen(true)}
              className="px-5 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-900/20"
            >
              <Plus size={16} />
              {t.devotee.postPrayer}
            </button>
          </div>

          {/* Mannat Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mannats.map((mannat) => (
              <motion.div 
                key={mannat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent rounded-3xl border border-amber-200/60 dark:border-amber-900/40 shadow-sm space-y-3 relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-bold text-sm text-main-text">{mannat.devoteeName}</h5>
                    <span className="text-[10px] text-gray-400">{mannat.city} • {mannat.date}</span>
                  </div>

                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[10px] font-bold rounded-lg">
                    ॥ बाप्पा चरणी प्रार्थना ॥
                  </span>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 italic font-serif leading-relaxed">
                  "{mannat.prayer}"
                </p>

                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle size={12} /> संकल्पित
                  </span>
                  <span>❤️ {mannat.likes} भाविकांनी तथास्तु म्हटले</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Photo & Video Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {['All', 'Darshan', 'Decoration', 'Aarti', 'Procession', 'Social'].map(cat => (
              <button 
                key={cat}
                onClick={() => setGalleryFilter(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  galleryFilter === cat 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-surface border border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredGallery.map(item => (
              <div key={item.id} className="group relative rounded-3xl overflow-hidden bg-zinc-900 aspect-video shadow-md">
                <img 
                  src={item.url} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                  <span className="text-[10px] font-bold text-amber-300 uppercase">{item.category} • {item.year}</span>
                  <h5 className="text-sm font-bold truncate">{item.title}</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Mannat Modal */}
      <AnimatePresence>
        {isMannatOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-amber-200 dark:border-zinc-800 relative"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800 mb-4">
                <h3 className="text-base font-black text-main-text">बाप्पा चरणी साकडं / नवस नोंदणी</h3>
                <button onClick={() => setIsMannatOpen(false)} className="text-gray-400">✕</button>
              </div>

              <form onSubmit={handleMannatSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">आपले नाव *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="उदा. सौ. कविता कुलकर्णी"
                    value={mannatForm.devoteeName}
                    onChange={e => setMannatForm({ ...mannatForm, devoteeName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">गाव / शहर</label>
                  <input 
                    type="text" 
                    placeholder="उदा. पुणे / मुंबई"
                    value={mannatForm.city}
                    onChange={e => setMannatForm({ ...mannatForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">आपली प्रार्थना / नवस *</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="बाप्पांकडे आपली मनोकामना लिहा..."
                    value={mannatForm.prayer}
                    onChange={e => setMannatForm({ ...mannatForm, prayer: e.target.value })}
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-xs text-main-text"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsMannatOpen(false)}
                    className="w-1/3 py-2.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold"
                  >
                    रद्द करा
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl text-xs font-bold"
                  >
                    साकडं अर्पण करा
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
