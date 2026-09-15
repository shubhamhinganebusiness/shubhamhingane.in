import React, { useState, useMemo } from 'react';
import { Camera, Sliders, Eye, Sun, Aperture, Clock, RefreshCw, Sparkles, Grid } from 'lucide-react';

interface FilmPreset {
  id: string;
  name: string;
  brand: string;
  filterStyle: string;
  description: string;
  temp: number;
  tint: string;
}

const FILM_PRESETS: FilmPreset[] = [
  {
    id: 'portra',
    name: 'Portra 400',
    brand: 'Kodak Film Stock',
    filterStyle: 'contrast(1.05) saturate(1.15) sepia(0.08) brightness(1.03)',
    description: 'Iconic warm skin tones, gentle highlight roll-off and organic fine grain.',
    temp: 5600,
    tint: '#fef3c7'
  },
  {
    id: 'cinestill',
    name: 'CineStill 800T',
    brand: 'Tungsten Cinema',
    filterStyle: 'contrast(1.18) saturate(1.25) hue-rotate(-8deg) brightness(0.98)',
    description: 'Cinematic cyan shadows with distinctive halation on specular light points.',
    temp: 3200,
    tint: '#e0f2fe'
  },
  {
    id: 'classic_chrome',
    name: 'Classic Chrome',
    brand: 'Documentary',
    filterStyle: 'contrast(1.2) saturate(0.85) brightness(1.0)',
    description: 'Subdued color saturation with dramatic, rich shadow contrast for photojournalism.',
    temp: 5200,
    tint: '#f1f5f9'
  },
  {
    id: 'monochrome',
    name: 'Leica M Monochrom',
    brand: 'High-Contrast B&W',
    filterStyle: 'grayscale(1) contrast(1.35) brightness(0.95)',
    description: 'Pure tonal grayscale with velvety blacks and luminous specular highlights.',
    temp: 5000,
    tint: '#ffffff'
  },
  {
    id: 'velvia',
    name: 'Velvia 50',
    brand: 'Landscape Vivid',
    filterStyle: 'contrast(1.25) saturate(1.45) brightness(1.02)',
    description: 'Ultra-vivid colors and crisp punch suited for nature, sunsets, and architecture.',
    temp: 5800,
    tint: '#fdf4ff'
  }
];

export const AtelierSimulator: React.FC = () => {
  const [aperture, setAperture] = useState<number>(1.8);
  const [shutterSpeed, setShutterSpeed] = useState<number>(250); // denominator e.g. 1/250
  const [iso, setIso] = useState<number>(200);
  const [selectedPreset, setSelectedPreset] = useState<FilmPreset>(FILM_PRESETS[0]);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Optical exposure calculation relative to ideal baseline (f/2.8, 1/250s, ISO 200)
  const exposureDelta = useMemo(() => {
    // EV formula comparison: log2((N^2 / t) / (2.8^2 / 0.004))
    const baseEv = Math.log2((2.8 * 2.8) / (1 / 250)) - Math.log2(200 / 100);
    const currentEv = Math.log2((aperture * aperture) / (1 / shutterSpeed)) - Math.log2(iso / 100);
    const evDiff = -(currentEv - baseEv);
    return Math.max(-2.5, Math.min(2.5, evDiff));
  }, [aperture, shutterSpeed, iso]);

  const brightnessStyle = 1 + exposureDelta * 0.22;
  const blurAmount = Math.max(0, (4 - aperture) * 1.5);

  const resetSettings = () => {
    setAperture(1.8);
    setShutterSpeed(250);
    setIso(200);
    setSelectedPreset(FILM_PRESETS[0]);
    setShowGrid(true);
  };

  return (
    <section id="simulator" className="py-24 bg-slate-950 text-slate-100 relative overflow-hidden border-y border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-4">
            <Sparkles size={13} />
            Interactive Optics & Grade
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Atelier Viewfinder Simulator
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Experiment with manual exposure controls and analog film color gradings in real-time. See how shutter speed, aperture depth-of-field, and film simulations sculpt the photographic mood.
          </p>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Viewfinder Stage (7 Cols) */}
          <div className="lg:col-span-7 bg-black rounded-2xl border border-slate-800 p-3 sm:p-4 shadow-2xl relative">
            <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-slate-900 select-none">
              {/* Simulated Subject Image */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80"
                alt="Simulated Portrait Subject"
                className="w-full h-full object-cover transition-all duration-300"
                style={{
                  filter: `${selectedPreset.filterStyle} brightness(${brightnessStyle})`,
                }}
              />

              {/* Bokeh Depth of Field Simulator Mask */}
              {blurAmount > 0.5 && (
                <div 
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300 backdrop-blur-[2px]"
                  style={{
                    maskImage: 'radial-gradient(ellipse at 50% 45%, transparent 35%, black 85%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, transparent 35%, black 85%)'
                  }}
                />
              )}

              {/* Rule of Thirds Grid Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-r border-b border-white/20"></div>
                  <div className="border-b border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div className="border-r border-white/20"></div>
                  <div></div>
                </div>
              )}

              {/* Camera Viewfinder Reticle / Autofocus Box */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-14 h-14 border border-amber-400/80 rounded-sm relative flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping opacity-75"></div>
                  <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                </div>
              </div>

              {/* Top Viewfinder HUD */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none font-mono text-xs text-white/90 drop-shadow">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                  <span>STANDBY • RAW</span>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex items-center gap-2">
                  <span>LUT: {selectedPreset.name}</span>
                </div>
              </div>

              {/* Bottom Viewfinder HUD (Exposure Parameters) */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between font-mono text-xs sm:text-sm text-white drop-shadow bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  <span className="text-amber-400 font-bold">f/{aperture}</span>
                  <span>1/{shutterSpeed}s</span>
                  <span className="text-slate-300">ISO {iso}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">EV:</span>
                  <span className={`font-bold ${Math.abs(exposureDelta) < 0.5 ? 'text-emerald-400' : exposureDelta > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                    {exposureDelta > 0 ? `+${exposureDelta.toFixed(1)}` : exposureDelta.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stage Footer Controls */}
            <div className="mt-3 flex items-center justify-between px-1 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              >
                <Grid size={13} />
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </button>
              <button
                type="button"
                onClick={resetSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                Reset Optics
              </button>
            </div>
          </div>

          {/* Control Console (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sliders size={18} className="text-amber-400" />
                Optical Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-1">Adjust exposure variables to tune the look and feel.</p>
            </div>

            {/* Aperture */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Aperture size={13} className="text-amber-400" />
                  Aperture (DoF)
                </span>
                <span className="text-amber-400 font-bold">f/{aperture}</span>
              </div>
              <input
                type="range"
                min="1.4"
                max="16"
                step="0.4"
                value={aperture}
                onChange={(e) => setAperture(parseFloat(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>f/1.4 (Shallow Bokeh)</span>
                <span>f/16 (Deep Focus)</span>
              </div>
            </div>

            {/* Shutter Speed */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock size={13} className="text-amber-400" />
                  Shutter Speed
                </span>
                <span className="text-amber-400 font-bold">1/{shutterSpeed}s</span>
              </div>
              <input
                type="range"
                min="30"
                max="2000"
                step="50"
                value={shutterSpeed}
                onChange={(e) => setShutterSpeed(parseInt(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1/30s (Motion Blur)</span>
                <span>1/2000s (Freeze Motion)</span>
              </div>
            </div>

            {/* ISO */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Sun size={13} className="text-amber-400" />
                  ISO Sensitivity
                </span>
                <span className="text-amber-400 font-bold">ISO {iso}</span>
              </div>
              <input
                type="range"
                min="100"
                max="6400"
                step="100"
                value={iso}
                onChange={(e) => setIso(parseInt(e.target.value))}
                className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>ISO 100 (Clean)</span>
                <span>ISO 6400 (High Noise)</span>
              </div>
            </div>

            {/* Film Grading LUT Selector */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Film Stock Simulation
                </span>
                <span className="text-[11px] text-amber-400 font-mono">{selectedPreset.brand}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FILM_PRESETS.map((preset) => {
                  const isSelected = selectedPreset.id === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 text-white'
                          : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{preset.name}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">{preset.brand}</div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mt-2">
                &ldquo;{selectedPreset.description}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
