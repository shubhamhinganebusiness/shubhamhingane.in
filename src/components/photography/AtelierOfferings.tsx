import React from 'react';
import { Camera, Heart, Film, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { useAtelierTheme } from './AtelierTheme';

const DISCIPLINES = [
  {
    index: '01',
    icon: Camera,
    title: 'Destination Wedding Masterworks',
    desc: 'Unobtrusive, documentary-style coverage that preserves raw intimacy, grand multi-day ceremonies, and heirloom bridal portraits.',
    gear: 'Hasselblad X2D 100C • XCD 38V & 90V',
    deliverables: ['Handmade Tuscan Leather Album', '100MP Archival Still Files', 'Full Multi-Angle Ceremony Cut']
  },
  {
    index: '02',
    icon: Heart,
    title: 'Cinematic Pre-Wedding Chronicles',
    desc: 'Bespoke romantic narratives set against iconic architectural landmarks and natural scenery across India, Europe, and the Middle East.',
    gear: 'Leica SL3 • Summilux 35mm & 50mm f/1.4',
    deliverables: ['Editorial Couple Lookbook', 'Cinematic 3-Minute Teaser Film', 'Drone Scenery Composition']
  },
  {
    index: '03',
    icon: Film,
    title: 'Atelier Film Grading & 35mm LUTs',
    desc: 'Fine-art post-production emulating timeless Kodak and Fujifilm motion stocks, calibrated for perceptual color depth and skin tones.',
    gear: 'DaVinci Resolve Studio • Kodak 500T Stock',
    deliverables: ['Custom Client LUT Profile', 'Lossless ProRes 422 HQ Masters', 'Original Analog Print Scans']
  },
  {
    index: '04',
    icon: Smartphone,
    title: 'High-Fashion Cine & Social Reels',
    desc: 'Vertical 4K cinematic edits crafted for modern digital footprints, synchronized to curated audio arrangements with micro-pacing.',
    gear: 'Sony A9 III Global Shutter • Profoto B10X',
    deliverables: ['4K Vertical Master Cuts', 'High-Speed Synchronized Flash', 'Same-Day Social Teaser Drops']
  }
];

export const AtelierOfferings: React.FC = () => {
  const { palette } = useAtelierTheme();

  return (
    <section 
      id="offerings" 
      style={{
        backgroundColor: palette.sectionAltBg,
        borderColor: palette.borderSubtle
      }}
      className="py-24 border-b transition-colors duration-400"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div 
            style={{ color: palette.accent }}
            className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.35em] mb-3"
          >
            <Sparkles size={11} />
            <span>CURATED DISCIPLINES</span>
          </div>
          <h2 
            style={{ color: palette.textPrimary }}
            className="font-cormorant text-3xl md:text-5xl font-light tracking-tight"
          >
            Atelier Photographic Services
          </h2>
          <p 
            style={{ color: palette.textSecondary }}
            className="text-xs md:text-sm mt-3 leading-relaxed"
          >
            Every commission is approached with the rigor of haute couture editorial and the sensitive authenticity of documentary storytelling.
          </p>
        </div>

        {/* Disciplines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DISCIPLINES.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.index}
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.borderCard
                }}
                className="group p-7 rounded-xl border hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Index Numeral */}
                <div className="flex items-center justify-between mb-6">
                  <span 
                    style={{ color: palette.textMuted }}
                    className="font-mono text-xs font-bold transition-colors"
                  >
                    {item.index}
                  </span>
                  <div 
                    style={{
                      backgroundColor: palette.accentMuted,
                      borderColor: `${palette.accent}30`,
                      color: palette.accent
                    }}
                    className="w-10 h-10 rounded-lg border flex items-center justify-center transition-all duration-300 group-hover:scale-105"
                  >
                    <Icon size={18} />
                  </div>
                </div>

                <div>
                  <h3 
                    style={{ color: palette.textPrimary }}
                    className="font-cormorant text-xl font-medium mb-2.5 transition-colors"
                  >
                    {item.title}
                  </h3>
                  <p 
                    style={{ color: palette.textSecondary }}
                    className="text-xs leading-relaxed mb-6 font-light"
                  >
                    {item.desc}
                  </p>
                </div>

                <div 
                  style={{ borderColor: palette.borderSubtle }}
                  className="pt-4 border-t space-y-3"
                >
                  <div className="text-[10px] font-mono">
                    <span 
                      style={{ color: palette.accent }}
                      className="block font-sans text-[8.5px] uppercase tracking-wider mb-0.5 font-semibold"
                    >
                      Optics Spec
                    </span>
                    <span style={{ color: palette.textMuted }}>{item.gear}</span>
                  </div>
                  <div className="space-y-1">
                    {item.deliverables.map((deliv, dIdx) => (
                      <div 
                        key={dIdx} 
                        style={{ color: palette.textSecondary }}
                        className="text-[10px] flex items-center gap-1.5 font-light"
                      >
                        <span 
                          className="w-1 h-1 rounded-full shrink-0" 
                          style={{ backgroundColor: palette.accent }}
                        />
                        <span>{deliv}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
