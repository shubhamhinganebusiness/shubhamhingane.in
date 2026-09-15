import React from 'react';
import { Download, Copy, Check, Globe, BookOpen } from 'lucide-react';
import { useAtelierTheme } from './AtelierTheme';

interface AtelierFooterProps {
  scrollToSection: (e: React.MouseEvent, id: string) => void;
  handleDownloadCode: () => void;
  handleCopyCode: () => void;
  copiedCode: boolean;
  setShowHostingGuide: (show: boolean) => void;
}

export const AtelierFooter: React.FC<AtelierFooterProps> = ({
  scrollToSection,
  handleDownloadCode,
  handleCopyCode,
  copiedCode,
  setShowHostingGuide
}) => {
  const { palette } = useAtelierTheme();

  return (
    <footer 
      style={{
        backgroundColor: palette.isLight ? '#EDE8DF' : '#07080A',
        borderColor: palette.borderSubtle,
        color: palette.textSecondary
      }}
      className="border-t py-16 text-xs relative transition-colors duration-400"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Brand & Menu Row */}
        <div 
          style={{ borderColor: palette.borderSubtle }}
          className="flex flex-col md:flex-row items-center justify-between gap-8 border-b pb-12 mb-12"
        >
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span 
              style={{ color: palette.textPrimary }}
              className="font-cinzel font-bold text-lg tracking-[0.22em]"
            >
              LENS & LIGHT STUDIOS
            </span>
            <span 
              style={{ color: palette.accent }}
              className="text-[8px] mt-1 uppercase tracking-[0.35em] font-semibold"
            >
              Capturing Moments, Framing Eternity.
            </span>
          </div>
          
          <div 
            style={{ color: palette.textSecondary }}
            className="flex flex-wrap justify-center gap-7 text-[10px] font-semibold uppercase tracking-[0.2em]"
          >
            <a href="#welcome" onClick={(e) => scrollToSection(e, 'welcome')} className="hover:opacity-80 transition-colors cursor-pointer">
              Atelier
            </a>
            <a href="#offerings" onClick={(e) => scrollToSection(e, 'offerings')} className="hover:opacity-80 transition-colors cursor-pointer">
              Disciplines
            </a>
            <a href="#simulator" onClick={(e) => scrollToSection(e, 'simulator')} className="hover:opacity-80 transition-colors cursor-pointer">
              Viewfinder
            </a>
            <a href="#visuals" onClick={(e) => scrollToSection(e, 'visuals')} className="hover:opacity-80 transition-colors cursor-pointer">
              Masterworks
            </a>
            <a href="#billing" onClick={(e) => scrollToSection(e, 'billing')} style={{ color: palette.accent }} className="transition-colors cursor-pointer font-bold">
              Billing Desk
            </a>
            <a href="#reserve" onClick={(e) => scrollToSection(e, 'reserve')} className="hover:opacity-80 transition-colors cursor-pointer">
              Commission
            </a>
          </div>
        </div>

        {/* Copyright & Developer Tools Row */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <p 
            style={{ color: palette.textMuted }}
            className="tracking-[0.2em] uppercase text-[9.5px] font-semibold"
          >
            &copy; 2026 Lens & Light Studios Atelier. All Rights Reserved.
          </p>
          
          <div 
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.borderSubtle
            }}
            className="flex items-center gap-2.5 border px-3.5 py-2 rounded-lg flex-wrap justify-center shadow-sm"
          >
            <span 
              style={{ color: palette.accent, borderColor: palette.borderSubtle }}
              className="text-[9px] font-bold uppercase tracking-[0.25em] border-r pr-2.5 mr-0.5 inline-flex items-center gap-1.5"
            >
              <BookOpen size={11} /> ATELIER TOOLS
            </span>

            <button 
              type="button"
              onClick={handleDownloadCode} 
              style={{
                backgroundColor: palette.isLight ? '#FFFFFF' : `${palette.canvasBg}`,
                borderColor: palette.borderSubtle,
                color: palette.textPrimary
              }}
              className="px-2.5 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors border hover:opacity-80 shadow-sm"
            >
              <Download size={10} /> Download HTML SPA
            </button>
            
            <button 
              type="button"
              onClick={handleCopyCode} 
              style={{
                backgroundColor: palette.isLight ? '#FFFFFF' : `${palette.canvasBg}`,
                borderColor: palette.borderSubtle,
                color: palette.textPrimary
              }}
              className="px-2.5 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors border hover:opacity-80 shadow-sm"
            >
              {copiedCode ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
              {copiedCode ? 'Copied' : 'Copy SPA Code'}
            </button>

            <button 
              type="button"
              onClick={() => setShowHostingGuide(true)} 
              style={{
                backgroundColor: palette.accentMuted,
                borderColor: `${palette.accent}40`,
                color: palette.accent
              }}
              className="px-2.5 py-1.5 text-[9px] uppercase font-bold tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors border hover:opacity-80"
            >
              <Globe size={10} /> Domains Guide
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
