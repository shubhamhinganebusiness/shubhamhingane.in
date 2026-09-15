import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, CreditCard, Palette, Check } from 'lucide-react';
import { useAtelierTheme } from './AtelierTheme';

interface AtelierHeaderProps {
  scrollToSection: (e: React.MouseEvent, id: string) => void;
}

export const AtelierHeader: React.FC<AtelierHeaderProps> = ({ scrollToSection }) => {
  const navigate = useNavigate();
  const { palette, currentTheme, setTheme, availablePalettes } = useAtelierTheme();
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  return (
    <header 
      style={{ 
        backgroundColor: palette.isLight ? 'rgba(250, 248, 245, 0.94)' : `${palette.canvasBg}F0`,
        borderColor: palette.borderSubtle 
      }}
      className="sticky top-0 left-0 right-0 z-40 backdrop-blur-md border-b h-20 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center justify-between">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.borderSubtle,
              color: palette.textSecondary
            }}
            className="p-2 md:px-3 md:py-1.5 border hover:opacity-90 transition-all rounded-md text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
            title="Return to Projects Catalog"
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">Projects</span>
          </button>
          
          <div 
            onClick={(e) => scrollToSection(e, 'welcome')}
            className="flex flex-col cursor-pointer group"
          >
            <span 
              style={{ color: palette.accentLight }}
              className="font-cinzel text-lg md:text-xl font-bold tracking-[0.22em] group-hover:brightness-125 transition-all leading-none"
            >
              LENS & LIGHT
            </span>
            <span 
              style={{ color: palette.textMuted }}
              className="text-[7.5px] font-semibold tracking-[0.45em] uppercase mt-1"
            >
              ATELIER DE PHOTOGRAPHIE
            </span>
          </div>
        </div>

        {/* Center: Editorial Navigation Links */}
        <nav 
          style={{ color: palette.textSecondary }}
          className="hidden lg:flex items-center gap-7 text-[10px] font-semibold tracking-[0.22em] uppercase"
        >
          <a 
            href="#welcome" 
            onClick={(e) => scrollToSection(e, 'welcome')} 
            className="hover:opacity-100 transition-opacity"
            style={{ color: palette.textSecondary }}
          >
            Atelier
          </a>
          <a 
            href="#offerings" 
            onClick={(e) => scrollToSection(e, 'offerings')} 
            className="hover:opacity-100 transition-opacity"
            style={{ color: palette.textSecondary }}
          >
            Disciplines
          </a>
          <a 
            href="#simulator" 
            onClick={(e) => scrollToSection(e, 'simulator')} 
            className="hover:opacity-100 transition-opacity"
            style={{ color: palette.textSecondary }}
          >
            Viewfinder
          </a>
          <a 
            href="#visuals" 
            onClick={(e) => scrollToSection(e, 'visuals')} 
            className="hover:opacity-100 transition-opacity"
            style={{ color: palette.textSecondary }}
          >
            Masterworks
          </a>
          <a 
            href="#testimonials" 
            onClick={(e) => scrollToSection(e, 'testimonials')} 
            className="hover:opacity-100 transition-opacity"
            style={{ color: palette.textSecondary }}
          >
            Patron Reviews
          </a>
          <a 
            href="#billing" 
            onClick={(e) => scrollToSection(e, 'billing')} 
            style={{ color: palette.accent }}
            className="font-bold flex items-center gap-1.5 hover:brightness-110 transition-all"
          >
            <Receipt size={12} /> Billing Desk
          </a>
        </nav>

        {/* Right: Actions & Chromatics Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 relative">
          
          {/* Chromatics / Color Combination Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaletteMenu(!showPaletteMenu)}
              style={{
                backgroundColor: palette.cardBg,
                borderColor: palette.borderSubtle,
                color: palette.textPrimary
              }}
              className="px-2.5 sm:px-3 py-2 border hover:opacity-90 transition-all rounded-md text-[9.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Atelier Color Combination"
            >
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-sm" 
                style={{ backgroundColor: palette.accent }}
              />
              <span className="hidden sm:inline font-mono">{palette.name}</span>
              <Palette size={11} className="text-gray-400" />
            </button>

            {/* Dropdown Menu */}
            {showPaletteMenu && (
              <div 
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.borderCard,
                  color: palette.textPrimary
                }}
                className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div 
                  style={{ color: palette.textMuted }}
                  className="px-3 py-1.5 text-[8px] font-mono uppercase tracking-widest border-b mb-1.5 flex justify-between items-center"
                >
                  <span>Atelier Chromatics</span>
                  <span className="text-[7.5px] opacity-70">5 Palettes</span>
                </div>
                
                <div className="space-y-1">
                  {availablePalettes.map((p) => {
                    const isSelected = p.id === currentTheme;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setTheme(p.id);
                          setShowPaletteMenu(false);
                        }}
                        style={{
                          backgroundColor: isSelected ? p.accentMuted : 'transparent',
                          color: isSelected ? p.accent : palette.textSecondary
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between hover:opacity-90 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-3 h-3 rounded-full border border-black/20" 
                            style={{ backgroundColor: p.dotColor }}
                          />
                          <div>
                            <span className="block text-[11px] font-bold leading-tight">{p.name}</span>
                            <span 
                              style={{ color: palette.textMuted }}
                              className="block text-[8.5px]"
                            >
                              {p.label}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check size={13} style={{ color: p.accent }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <a 
            href="#billing"
            onClick={(e) => scrollToSection(e, 'billing')}
            style={{
              borderColor: `${palette.accent}40`,
              backgroundColor: palette.accentMuted,
              color: palette.accent
            }}
            className="px-3.5 py-2 border hover:brightness-110 transition-all rounded-md text-[9.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
            title="Studio Invoicing & Billing Suite"
          >
            <Receipt size={12} />
            <span className="hidden md:inline">Billing Desk</span>
            <span className="md:hidden">Bill</span>
          </a>

          <button 
            id="header-create-id"
            onClick={() => navigate('/live/select-template')}
            style={{
              backgroundColor: palette.cardBg,
              borderColor: palette.borderSubtle,
              color: palette.textSecondary
            }}
            className="px-3.5 py-2 border hover:opacity-90 transition-all rounded-md text-[9.5px] font-bold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard size={12} />
            <span>Create ID</span>
          </button>

          <a 
            href="#reserve" 
            onClick={(e) => scrollToSection(e, 'reserve')}
            style={{
              backgroundColor: palette.accent,
              color: palette.accentContrastText
            }}
            className="hidden md:inline-flex px-4 py-2 hover:brightness-110 font-bold uppercase tracking-widest text-[9.5px] rounded-md transition-all cursor-pointer shadow-md"
          >
            Commission
          </a>
        </div>
      </div>
    </header>
  );
};
