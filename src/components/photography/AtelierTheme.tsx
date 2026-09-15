import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AtelierPalette {
  id: string;
  name: string;
  label: string;
  dotColor: string;
  canvasBg: string;
  sectionAltBg: string;
  cardBg: string;
  cardHoverBg: string;
  cardHeaderBg: string;
  borderSubtle: string;
  borderCard: string;
  borderHover: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentGlow: string;
  accentLight: string;
  accentContrastText: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  isLight?: boolean;
}

export const ATELIER_PALETTES: Record<string, AtelierPalette> = {
  'amber': {
    id: 'amber',
    name: 'Sunset Amber',
    label: 'Twilight & Amber',
    dotColor: '#E58338',
    canvasBg: '#070A10',
    sectionAltBg: '#0B0F18',
    cardBg: '#101622',
    cardHoverBg: '#151D2C',
    cardHeaderBg: '#0D131D',
    borderSubtle: '#1B2436',
    borderCard: '#222D43',
    borderHover: 'rgba(229, 131, 56, 0.45)',
    accent: '#E58338',
    accentHover: '#F5944B',
    accentMuted: 'rgba(229, 131, 56, 0.14)',
    accentGlow: 'rgba(229, 131, 56, 0.28)',
    accentLight: '#F8D1B2',
    accentContrastText: '#070A10',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B'
  },
  'emerald': {
    id: 'emerald',
    name: 'Emerald Darkroom',
    label: 'Pine Noir & Mint',
    dotColor: '#38B283',
    canvasBg: '#060E0B',
    sectionAltBg: '#0A1511',
    cardBg: '#0E1D18',
    cardHoverBg: '#132620',
    cardHeaderBg: '#0A1713',
    borderSubtle: '#162E26',
    borderCard: '#1D3B31',
    borderHover: 'rgba(56, 178, 131, 0.45)',
    accent: '#38B283',
    accentHover: '#48C795',
    accentMuted: 'rgba(56, 178, 131, 0.14)',
    accentGlow: 'rgba(56, 178, 131, 0.28)',
    accentLight: '#B7E8D6',
    accentContrastText: '#060E0B',
    textPrimary: '#F0F9F5',
    textSecondary: '#8DAAA0',
    textMuted: '#5F7C73'
  },
  'terracotta': {
    id: 'terracotta',
    name: 'Nordic Terracotta',
    label: 'Tuscan Rust & Obsidian',
    dotColor: '#DF684E',
    canvasBg: '#0D0C0E',
    sectionAltBg: '#131115',
    cardBg: '#1A171D',
    cardHoverBg: '#221E26',
    cardHeaderBg: '#141217',
    borderSubtle: '#2A242F',
    borderCard: '#372F3E',
    borderHover: 'rgba(223, 104, 78, 0.45)',
    accent: '#DF684E',
    accentHover: '#EB7D65',
    accentMuted: 'rgba(223, 104, 78, 0.14)',
    accentGlow: 'rgba(223, 104, 78, 0.28)',
    accentLight: '#F7C5BB',
    accentContrastText: '#0D0C0E',
    textPrimary: '#FAF4F3',
    textSecondary: '#A89CA0',
    textMuted: '#7A6E73'
  },
  'violet': {
    id: 'violet',
    name: 'Royal Amethyst',
    label: 'Twilight & Lilac',
    dotColor: '#A78BFA',
    canvasBg: '#090812',
    sectionAltBg: '#0F0C1C',
    cardBg: '#151226',
    cardHoverBg: '#1C1833',
    cardHeaderBg: '#100D20',
    borderSubtle: '#241E3D',
    borderCard: '#302850',
    borderHover: 'rgba(167, 139, 250, 0.45)',
    accent: '#A78BFA',
    accentHover: '#BCA5FB',
    accentMuted: 'rgba(167, 139, 250, 0.14)',
    accentGlow: 'rgba(167, 139, 250, 0.28)',
    accentLight: '#DDD3FA',
    accentContrastText: '#090812',
    textPrimary: '#F6F4FF',
    textSecondary: '#A29BB8',
    textMuted: '#736B8C'
  },
  'ivory': {
    id: 'ivory',
    name: 'Daylight Alabaster',
    label: 'Warm Cream & Espresso',
    dotColor: '#9E5325',
    isLight: true,
    canvasBg: '#FAF8F5',
    sectionAltBg: '#F2EFE9',
    cardBg: '#FFFFFF',
    cardHoverBg: '#FAF8F5',
    cardHeaderBg: '#F5F2EB',
    borderSubtle: '#E2DDD4',
    borderCard: '#D5CFC3',
    borderHover: 'rgba(158, 83, 37, 0.45)',
    accent: '#9E5325',
    accentHover: '#B86430',
    accentMuted: 'rgba(158, 83, 37, 0.12)',
    accentGlow: 'rgba(158, 83, 37, 0.22)',
    accentLight: '#6E3816',
    accentContrastText: '#FFFFFF',
    textPrimary: '#1C1B19',
    textSecondary: '#5A5650',
    textMuted: '#8A857D'
  }
};

interface AtelierThemeContextType {
  currentTheme: string;
  palette: AtelierPalette;
  setTheme: (themeId: string) => void;
  availablePalettes: AtelierPalette[];
}

const AtelierThemeContext = createContext<AtelierThemeContextType>({
  currentTheme: 'amber',
  palette: ATELIER_PALETTES['amber'],
  setTheme: () => {},
  availablePalettes: Object.values(ATELIER_PALETTES)
});

const STORAGE_KEY = 'lens_light_atelier_theme';

export const AtelierThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ATELIER_PALETTES[saved]) {
        return saved;
      }
    } catch {
      // Fallback if local storage restricted
    }
    return 'amber';
  });

  const handleSetTheme = (themeId: string) => {
    if (ATELIER_PALETTES[themeId]) {
      setCurrentTheme(themeId);
      try {
        localStorage.setItem(STORAGE_KEY, themeId);
      } catch {
        // Safe fail
      }
    }
  };

  const palette = ATELIER_PALETTES[currentTheme] || ATELIER_PALETTES['amber'];

  return (
    <AtelierThemeContext.Provider 
      value={{
        currentTheme,
        palette,
        setTheme: handleSetTheme,
        availablePalettes: Object.values(ATELIER_PALETTES)
      }}
    >
      <div 
        style={{
          '--palette-bg': palette.canvasBg,
          '--palette-surface': palette.cardBg,
          '--palette-accent': palette.accent,
          '--palette-border': palette.borderSubtle,
          '--palette-text': palette.textPrimary,
          backgroundColor: palette.canvasBg,
          color: palette.textPrimary,
          transition: 'background-color 0.4s ease, color 0.4s ease'
        } as React.CSSProperties}
        className="w-full min-h-screen"
      >
        {children}
      </div>
    </AtelierThemeContext.Provider>
  );
};

export const useAtelierTheme = () => useContext(AtelierThemeContext);
