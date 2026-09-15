import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Receipt, CreditCard, Camera, Sparkles, Award } from 'lucide-react';
import { useAtelierTheme } from './AtelierTheme';

interface AtelierHeroProps {
  scrollToSection: (e: React.MouseEvent, id: string) => void;
}

export const AtelierHero: React.FC<AtelierHeroProps> = ({ scrollToSection }) => {
  const navigate = useNavigate();
  const { palette } = useAtelierTheme();

  return (
    <section 
      id="welcome" 
      style={{
        backgroundColor: palette.canvasBg,
        borderColor: palette.borderSubtle
      }}
      className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden pt-16 pb-10 border-b transition-colors duration-400"
    >
      
      {/* Background Photographic Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <img 
          referrerPolicy="no-referrer"
          src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2200" 
          alt="Cinematic Atelier Masterpiece" 
          className="w-full h-full object-cover opacity-30 scale-100 filter brightness-90 contrast-105"
        />
        {/* Darkroom Exposure Gradient & Vignette */}
        <div 
          style={{
            background: palette.isLight 
              ? `linear-gradient(to top, ${palette.canvasBg}, ${palette.canvasBg}B3, ${palette.canvasBg}E6)`
              : `linear-gradient(to top, ${palette.canvasBg}, ${palette.canvasBg}B3, ${palette.canvasBg}E6)`
          }}
          className="absolute inset-0" 
        />
        <div 
          style={{
            background: `radial-gradient(circle, transparent 20%, ${palette.canvasBg}B3 70%, ${palette.canvasBg} 100%)`
          }}
          className="absolute inset-0" 
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center my-auto">
        
        {/* Editorial Brand Crest Ribbon */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            borderColor: `${palette.accent}50`,
            backgroundColor: `${palette.cardBg}B3`,
            color: palette.accentLight
          }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 border text-[9px] font-semibold uppercase tracking-[0.35em] rounded-full mb-8 backdrop-blur-md shadow-sm"
        >
          <Sparkles size={11} style={{ color: palette.accent }} />
          <span>FINE ART CINEMATOGRAPHY & PHOTOGRAPHY ATELIER</span>
        </motion.div>
        
        {/* Editorial Grand Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          style={{ color: palette.textPrimary }}
          className="font-cormorant text-5xl sm:text-6xl md:text-8xl font-light leading-[1.04] tracking-tight mb-6"
        >
          Where Light Meets <br className="hidden sm:inline" />
          <span 
            style={{ color: palette.accent }}
            className="italic font-normal font-cormorant"
          >
            Legacy & Emotion.
          </span>
        </motion.h1>
        
        {/* Manifesto Paragraph */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ color: palette.textSecondary }}
          className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-10 font-light"
        >
          Curated destination weddings, heirloom portraiture, and high-fashion cinema. Designed with medium-format optics, authentic film tonality, and natural illumination.
        </motion.p>

        {/* 4 Balanced Accreditation Metric Pillars */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            backgroundColor: `${palette.cardBg}CC`,
            borderColor: palette.borderSubtle
          }}
          className="grid grid-cols-2 md:grid-cols-4 max-w-3xl mx-auto gap-3 sm:gap-4 p-4 border rounded-xl backdrop-blur-md mb-10 shadow-lg"
        >
          <div className="text-center p-2">
            <div className="font-cormorant text-2xl font-bold" style={{ color: palette.textPrimary }}>140+</div>
            <div className="text-[8.5px] uppercase tracking-[0.2em] mt-0.5" style={{ color: palette.textMuted }}>Bespoke Weddings</div>
          </div>
          <div className="text-center p-2 border-l" style={{ borderColor: palette.borderSubtle }}>
            <div className="font-cormorant text-2xl font-bold" style={{ color: palette.textPrimary }}>100MP</div>
            <div className="text-[8.5px] uppercase tracking-[0.2em] mt-0.5" style={{ color: palette.textMuted }}>Medium Format Optics</div>
          </div>
          <div className="text-center p-2 border-t md:border-t-0 md:border-l" style={{ borderColor: palette.borderSubtle }}>
            <div className="font-cormorant text-2xl font-bold" style={{ color: palette.textPrimary }}>18</div>
            <div className="text-[8.5px] uppercase tracking-[0.2em] mt-0.5" style={{ color: palette.textMuted }}>Fine Art Awards</div>
          </div>
          <div className="text-center p-2 border-t md:border-t-0 md:border-l" style={{ borderColor: palette.borderSubtle }}>
            <div className="font-cormorant text-2xl font-bold" style={{ color: palette.accent }}>5.0 ★</div>
            <div className="text-[8.5px] uppercase tracking-[0.2em] mt-0.5" style={{ color: palette.textMuted }}>Vogue Curated</div>
          </div>
        </motion.div>

        {/* Action Group */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row gap-3.5 justify-center items-center"
        >
          <a 
            href="#visuals" 
            onClick={(e) => scrollToSection(e, 'visuals')}
            style={{
              backgroundColor: palette.accent,
              color: palette.accentContrastText
            }}
            className="w-full sm:w-auto px-7 py-3.5 hover:brightness-110 font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-300 rounded-md shadow-lg text-center cursor-pointer"
          >
            Explore Masterworks
          </a>

          <a 
            href="#offerings" 
            onClick={(e) => scrollToSection(e, 'offerings')}
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.borderCard,
              color: palette.textPrimary
            }}
            className="w-full sm:w-auto px-7 py-3.5 border hover:brightness-110 font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-300 rounded-md text-center cursor-pointer"
          >
            Curated Offerings
          </a>

          <a 
            href="#billing" 
            onClick={(e) => scrollToSection(e, 'billing')}
            style={{
              backgroundColor: palette.cardBg,
              borderColor: `${palette.accent}50`,
              color: palette.accentLight
            }}
            className="w-full sm:w-auto px-6 py-3.5 border hover:opacity-90 font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-300 rounded-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Receipt size={13} style={{ color: palette.accent }} />
            <span>Studio Billing Suite</span>
          </a>
        </motion.div>
      </div>

      {/* Live Fleet Ticker Ribbon */}
      <div className="relative z-20 max-w-5xl mx-auto w-full px-6 pt-6">
        <div 
          style={{ borderColor: palette.borderSubtle, color: palette.textMuted }}
          className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] font-mono tracking-wider"
        >
          <div className="flex items-center gap-2">
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse" 
              style={{ backgroundColor: palette.accent }}
            />
            <span style={{ color: palette.accent }} className="font-semibold">ACTIVE ATELIER GEAR:</span>
            <span>HASSELBLAD X2D 100C • LEICA SL3 SUMMICRON • FUJIFILM GFX100 II</span>
          </div>
          <div className="flex items-center gap-4 uppercase">
            <span>Udaipur</span>
            <span>•</span>
            <span>Lake Como</span>
            <span>•</span>
            <span>Mahabaleshwar</span>
            <span>•</span>
            <span>Mumbai</span>
          </div>
        </div>
      </div>

    </section>
  );
};
