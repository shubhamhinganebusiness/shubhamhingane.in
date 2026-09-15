import React from 'react';
import { Star, Sparkles, MapPin } from 'lucide-react';
import { useAtelierTheme } from './AtelierTheme';

const TESTIMONIALS = [
  {
    id: 1,
    initials: 'AP',
    names: 'Amit & Priyanka Singhania',
    venue: 'Taj Lake Palace, Udaipur',
    role: 'Destination Royal Wedding',
    quote: 'Working with Lens & Light Studios was effortless. Our Udaipur palace celebration looked like a classic film. The colors, intimate gestures, and silent candid moments were captured with pure emotional reverence.'
  },
  {
    id: 2,
    initials: 'SK',
    names: 'Sarah & Kabir Mehra',
    venue: 'Villa Balbianello, Lake Como',
    role: 'Editorial Pre-Wedding Chronicle',
    quote: 'The medium-format clarity and gentle direction on Lake Como gave us portraits worthy of an art gallery. Not a single awkward pose — just honest human warmth framed with timeless grace.'
  },
  {
    id: 3,
    initials: 'NL',
    names: 'Nisha & Luke Vance',
    venue: 'Amanbagh, Rajasthan',
    role: 'Cinematography & Heirloom Series',
    quote: 'The film grading and audio pacing in their cinema reels moved our entire family to tears. They operate like discreet master artisans rather than intrusive camera crews.'
  }
];

export const AtelierTestimonials: React.FC = () => {
  const { palette } = useAtelierTheme();

  return (
    <section 
      id="testimonials" 
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
            <span>PATRON CHRONICLES</span>
          </div>
          <h2 
            style={{ color: palette.textPrimary }}
            className="font-cormorant text-3xl md:text-5xl font-light tracking-tight"
          >
            Stories of Trust & Timeless Art
          </h2>
          <p 
            style={{ color: palette.textSecondary }}
            className="text-xs md:text-sm mt-3 leading-relaxed"
          >
            Words from families and couples whose most meaningful milestones have been committed to our archival collection.
          </p>
        </div>

        {/* Testimonials 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div 
              key={t.id}
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.borderCard
              }}
              className="p-7 rounded-xl border hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Subtle Quote Symbol */}
              <span 
                style={{ color: `${palette.accent}25` }}
                className="font-cormorant text-5xl select-none leading-none block mb-2"
              >
                “
              </span>

              <p 
                style={{ color: palette.textPrimary }}
                className="font-cormorant italic text-sm md:text-base leading-relaxed font-light mb-8 opacity-90"
              >
                {t.quote}
              </p>

              <div 
                style={{ borderColor: palette.borderSubtle }}
                className="pt-5 border-t flex items-center gap-3.5"
              >
                <div 
                  style={{
                    backgroundColor: palette.accentMuted,
                    borderColor: `${palette.accent}40`,
                    color: palette.accent
                  }}
                  className="w-10 h-10 rounded-full border flex items-center justify-center font-cormorant font-bold text-sm shrink-0"
                >
                  {t.initials}
                </div>
                <div>
                  <h4 
                    style={{ color: palette.textPrimary }}
                    className="font-cormorant text-base font-semibold leading-snug"
                  >
                    {t.names}
                  </h4>
                  <div 
                    style={{ color: palette.accent }}
                    className="flex items-center gap-1 text-[9px] tracking-wider uppercase mt-0.5 font-medium"
                  >
                    <MapPin size={9} />
                    <span>{t.venue}</span>
                  </div>
                  <span 
                    style={{ color: palette.textMuted }}
                    className="text-[8.5px] block mt-0.5 font-mono"
                  >
                    {t.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
