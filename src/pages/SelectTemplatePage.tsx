import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

// Repeat template list metadata for standalone selection view
const TEMPLATES_LIST_DATA = [
  { 
    id: 'academic', 
    category: 'standard', 
    label: 'Academic Elite', 
    desc: 'Elite balanced symmetrical structure suited for primary, boarding, or private military institutions.',
    vibe: 'Prestigious & Balanced',
    features: 'Shield crest, double arched backdrop header',
    script: 'English Only',
    colors: ['bg-[#0a2e5c]', 'bg-[#dfa115]'], 
    badge: 'CLASSIC', 
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-[#0a2e5c] relative overflow-hidden flex items-center px-3 border border-white/10">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#dfa115]" />
        <div className="w-4 h-4 rounded-full bg-white/40 border border-white/20" />
        <div className="w-12 h-1 bg-white/20 ml-2 rounded-full" />
      </div>
    )
  },
  { 
    id: 'newenglishmalthan', 
    category: 'regional', 
    label: 'New English School Malthan', 
    desc: 'Bilingual administrative school design featuring Swastha trust structures, a vertical left title bar representation, and official Devanagari Unicode lettering.',
    vibe: 'Classic Vernacular Trust',
    features: 'Vertical Teacher tag, double side signature blocks',
    script: 'Devanagari Unicode & Eng',
    colors: ['bg-[#dc2626]', 'bg-[#1e3a8a]'], 
    badge: 'VERNACULAR', 
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-white relative overflow-hidden flex flex-col justify-between border border-red-600/15">
        <div className="h-1 w-full bg-[#dc2626]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-50">
          <div className="w-2.5 h-full bg-[#1e3a8a] rounded-sm" />
          <div className="w-16 h-1.5 bg-[#dc2626]/20 rounded-full" />
          <div className="w-4 h-4 bg-slate-200 rounded-full border border-slate-300" />
        </div>
        <div className="h-1 w-full bg-[#1e3a8a]" />
      </div>
    )
  },
  { 
    id: 'chandrabhama', 
    category: 'regional', 
    label: 'Chandrabhama Mahavidyalay Karjat', 
    desc: 'Premium ID card template modeled exactly after Chandrabhama Mahavidyalay Karjat. Features official seal on header, blue vertical bar, custom alignment specs, QR-code, and signature block.',
    vibe: 'Distinguished Academic Vernacular',
    features: 'Yellow pill banner, vertical TEACHER bar, dual seal & motto graphics',
    script: 'English & Devanagari',
    colors: ['bg-[#0f2963]', 'bg-[#eab308]'], 
    badge: 'PREMIUM REGIONAL', 
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-[#0f2963] relative overflow-hidden flex flex-col justify-between border border-yellow-600/15">
        <div className="h-1 w-full bg-[#eab308]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-[#0f2963]/10">
          <div className="w-2.5 h-full bg-[#0f2963] rounded-sm" />
          <div className="w-16 h-1.5 bg-[#eab308]/20 rounded-full" />
          <div className="w-4 h-4 bg-slate-100 rounded-full border border-amber-300" />
        </div>
        <div className="h-1 w-full bg-[#eab308]" />
      </div>
    )
  },
  { 
    id: 'swanandchincholi', 
    category: 'regional', 
    label: 'Swanand Vidyalay Chincholi Kaldat', 
    desc: 'Official template style for Swanand Vidyalay Chincholi Kaldat. Features Deep Blue & Gold, bilingual school name heading, unique double color overlap wave curves at the bottom, custom margins, and a beautiful school building background watermark.',
    vibe: 'Distinguished School Bilingual',
    features: 'Official blue banner, custom gold border logo frame, dual waves footer curves',
    script: 'English & Devanagari',
    colors: ['bg-[#1e3a8a]', 'bg-[#eab308]'], 
    badge: 'REGIONAL SCHOOL', 
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-[#1e3a8a] relative overflow-hidden flex flex-col justify-between border border-yellow-600/15">
        <div className="h-1 w-full bg-[#eab308]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-100">
          <div className="w-2.5 h-full bg-[#1e3a8a] rounded-sm" />
          <div className="w-16 h-1.5 bg-[#eab308]/20 rounded-full" />
          <div className="w-4 h-4 bg-slate-100 rounded-full border border-yellow-500" />
        </div>
        <div className="h-1 w-full bg-[#eab308]" />
      </div>
    )
  },
  { 
    id: 'samyak', 
    category: 'regional', 
    label: 'Samyak Foundation (Shramik Majdur Sangh)', 
    desc: 'Official regional social trust identity design for Samyak Foundation (MDM Department). Features elegant double framed photo, clean Devanagari labels, bright red highlighting, and district president signature.',
    vibe: 'Bilingual Social Organization',
    features: 'Double framed portrait, sweep arc footer, signature of Savita Vidhate',
    script: 'Devanagari Unicode & Eng',
    colors: ['bg-[#0a3e8a]', 'bg-[#ef4444]'], 
    badge: 'NEW REGIONAL', 
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-white relative overflow-hidden flex flex-col justify-between border border-blue-650/15">
        <div className="h-1.5 w-full bg-[#0a3e8a]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-50">
          <div className="w-3.5 h-[18px] border border-red-500 bg-white" />
          <div className="w-14 h-1 bg-blue-600/25 rounded-full" />
          <div className="w-4.5 h-4 bg-slate-200 rounded-sm" />
        </div>
        <div className="h-1 w-full bg-[#0a3e8a]" />
      </div>
    )
  },
  { 
    id: 'zpketur2', 
    category: 'regional', 
    label: 'Zilla Parishad Primary School Ketur No. 2', 
    desc: 'Government school identity card design modeled after Solapur district templates. Features solid red location banner, double-outlined picture crop, official state signatures, and a clear vertical photographer credit line.',
    vibe: 'Official Government Traditional',
    features: 'Double framed photo, solid red regional banner, vertical credit text, Headmaster signature seal',
    script: 'Devanagari Unicode & Eng',
    colors: ['bg-[#dc2626]', 'bg-[#1e3a8a]'], 
    badge: 'GOVERNMENT', 
    badgeBg: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-white relative overflow-hidden flex flex-col justify-between border border-red-650/15">
        <div className="h-1.5 w-full bg-[#dc2626]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-50">
          <div className="w-4 h-4 bg-amber-500 rounded-full border border-yellow-600 shadow-2xs shrink-0" />
          <div className="w-14 h-1 bg-[#dc2626]/20 rounded-full" />
          <div className="w-4.5 h-4 bg-slate-100 rounded-sm border border-red-500" />
        </div>
        <div className="h-1 w-full bg-[#dc2626]" />
      </div>
    )
  },
  { 
    id: 'siddheshwar', 
    category: 'regional', 
    label: 'Siddheshwar Secondary & Higher Secondary, Bhambora', 
    desc: 'High English-Devanagari professional school layout containing Yashwant Sanstha trust seals, classic maroon-red styling, side-vertical credit tag, and elegant signature layouts.',
    vibe: 'Classic Vernacular Trust',
    features: 'Bold red headings, dual-bordered picture frame, side photographer credit, official HM seal block',
    script: 'Devanagari Unicode & Eng',
    colors: ['bg-[#dc2626]', 'bg-[#000000]'], 
    badge: 'VERNACULAR TRUST', 
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-white relative overflow-hidden flex flex-col justify-between border border-red-600/15">
        <div className="h-1.5 w-full bg-[#dc2626]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-50">
          <div className="w-4 h-4 bg-red-600 rounded-sm border border-red-500 shrink-0" />
          <div className="w-12 h-1 bg-red-600/20 rounded-full" />
          <div className="w-4 h-4 bg-slate-100 rounded-sm border border-zinc-900" />
        </div>
        <div className="h-1 w-full bg-red-650" />
      </div>
    )
  },
  { 
    id: 'bharatgas', 
    category: 'regional', 
    label: 'Laxmi Vaibhav Bharatgas Agency, Karmala', 
    desc: 'Premium dealership profile identity featuring warm orange backdrops, stylized commercial headings, yellow-gold outer double photo framings, and distributor stamp footers.',
    vibe: 'Premium Corporate distributor',
    features: 'Orange header plate, distinct distributor footer accent, dual framed photo with yellow border',
    script: 'English & Devanagari',
    colors: ['bg-[#ea580c]', 'bg-[#1e3a8a]'], 
    badge: 'CORPORATE SECTOR', 
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-white relative overflow-hidden flex flex-col justify-between border border-orange-500/15">
        <div className="h-2 w-full bg-[#ea580c]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-50">
          <div className="w-3.5 h-3.5 bg-[#1e3a8a] rounded-xs shrink-0" />
          <div className="w-14 h-1 bg-orange-600/20 rounded-full" />
          <div className="w-4 h-4 bg-slate-100 rounded-sm border border-yellow-500" />
        </div>
        <div className="h-1.5 w-full bg-[#1e3a8a]" />
      </div>
    )
  },
  { 
    id: 'shramikmajdur', 
    category: 'regional', 
    label: 'अधिक मजदूर संघ (MDM विभाग)', 
    desc: 'Official premium landscape template for Adhik Mazdur Sangh (MDM Department). Features landscape orientation, striking red themes, passport photo left panel, multi-layered Marathi Unicode details, and dual signature alignments.',
    vibe: 'Official Union Landscape',
    features: 'Horizontal Landscape, left placeholder frame, double-bordered badge, registration alignment',
    script: 'Devanagari Unicode & Eng',
    colors: ['bg-[#B22222]', 'bg-[#171717]'], 
    badge: 'LANDSCAPE', 
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    preview: (
      <div className="w-full h-8 rounded-lg bg-white relative overflow-hidden flex flex-col justify-between border border-red-650/15">
        <div className="h-2 w-full bg-[#B22222]" />
        <div className="flex-1 w-full flex items-center justify-between px-2 bg-slate-50">
          <div className="w-3.5 h-[14px] border border-red-600 bg-white" />
          <div className="w-14 h-1 bg-red-600/20 rounded-full" />
          <div className="w-3.5 h-[10px] bg-red-600/10 rounded-xs" />
        </div>
        <div className="h-1.5 w-full bg-[#B22222]" />
      </div>
    )
  }
];

export const SelectTemplatePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'regional'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('academic');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleProceed = () => {
    navigate(`/live/instant-id-builder?template=${selectedTemplate}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 transition-colors duration-300 pb-16">
      <header className="sticky top-0 z-30 w-full border-b border-slate-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white rounded-xl border border-slate-200/80 hover:border-slate-300 dark:border-zinc-800 hover:dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <ArrowLeft size={13} />
              <span>Back Home</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />
            <div className="flex items-center gap-2 hidden sm:flex">
              <ShieldCheck className="text-[#0a2e5c] dark:text-[#dfa115] animate-pulse" size={16} />
              <span className="text-[9px] font-black uppercase text-slate-400 dark:text-zinc-500 tracking-widest leading-none">
                Identity Design Hub
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-full">
              TEMPLATE SELECTOR
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-left mb-8 border-b border-slate-200/50 dark:border-zinc-900 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
              Premium Styling Presets
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Choose Your ID Card Design
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed mt-2.5 max-w-2xl">
            Select an institutional profile below. The instant builder will instantly compile layout variables, structures, and bilingual typography settings based on your chosen design theme.
          </p>
        </div>

        {/* Tab switcher filters */}
        <div className="flex bg-slate-200/60 dark:bg-zinc-900/40 p-1.5 rounded-2xl gap-1 max-w-lg mb-8">
          {[
            { id: 'all', label: 'All Layouts', count: 9 },
            { id: 'standard', label: 'Standard', count: 1 },
            { id: 'regional', label: 'Regional Trust', count: 8 }
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                type="button"
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/50 dark:border-zinc-700/50' 
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-300 dark:bg-zinc-700 text-slate-500'
                }`}>{cat.count}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Bento Grid of Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {TEMPLATES_LIST_DATA
            .filter(t => selectedCategory === 'all' || t.category === selectedCategory || (selectedCategory === 'standard' && t.category !== 'regional'))
            .map((tpl) => {
              const isSelected = selectedTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  type="button"
                  className={`w-full text-left rounded-3xl border transition-all p-6 relative overflow-hidden group flex flex-col justify-between min-h-[190px] cursor-pointer ${
                    isSelected 
                      ? 'bg-white dark:bg-zinc-900 border-primary dark:border-emerald-500 shadow-lg ring-2 ring-primary/20 dark:ring-emerald-500/20' 
                      : 'bg-white/80 dark:bg-zinc-900/30 hover:bg-white dark:hover:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800/80 hover:shadow-md'
                  }`}
                >
                  <div className="w-full space-y-4">
                    {/* Header Strip in card */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                            {tpl.label}
                          </h3>
                          <span className={`text-[6.5px] font-black tracking-widest px-1.5 py-0.5 rounded-xs leading-none uppercase ${tpl.badgeBg}`}>
                            {tpl.badge}
                          </span>
                        </div>
                        <span className="text-[7.5px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest block">
                          {tpl.vibe}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {tpl.colors.map((bg, idx) => (
                          <span key={idx} className={`w-2.5 h-2.5 rounded-full ${bg} border border-white/20`} />
                        ))}
                      </div>
                    </div>

                    {/* Miniature Header Layout Preview */}
                    <div className="opacity-85 group-hover:opacity-100 transition-opacity">
                      {tpl.preview}
                    </div>

                    {/* Explanatory description block */}
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug font-medium font-sans">
                      {tpl.desc}
                    </p>
                  </div>

                  <div className="w-full mt-4 pt-3 border-t border-dashed border-slate-100 dark:border-zinc-850/50 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[7.5px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider">
                      <span>Script: <strong className="text-slate-600 dark:text-zinc-300">{tpl.script}</strong></span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>Features: <strong className="text-slate-600 dark:text-zinc-300">{tpl.features}</strong></span>
                    </div>

                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 select-none">
                      {isSelected ? (
                        <Check size={12} className="text-primary dark:text-emerald-400 font-bold" />
                      ) : (
                        <span className="text-[9px] font-black">+</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Bottom floating helper element */}
        <div className="sticky bottom-6 w-full flex justify-end z-20">
          <motion.button
            onClick={handleProceed}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/45 transition-all cursor-pointer hover:bg-primary-dark"
          >
            <span>Proceed to builder</span>
            <ArrowRight size={14} className="animate-pulse" />
          </motion.button>
        </div>
      </main>
    </div>
  );
};
