import React from 'react';
import { IDCardDesign } from '../../types/idCard';
import { PRESET_EMBLEMS, PRESET_SIGNATURE } from '../../utils/zenIdPresets';
import { Palette, Upload, Check, Building2, Shield, Landmark } from 'lucide-react';

interface BrandingAssetsPanelProps {
  design: IDCardDesign;
  onChange: (updated: IDCardDesign) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => void;
}

export const BrandingAssetsPanel: React.FC<BrandingAssetsPanelProps> = ({
  design,
  onChange,
  onImageUpload
}) => {
  const COLOR_PALETTES = [
    { name: 'Oxford Navy & Gold', primary: '#0f2942', secondary: '#c59b27', text: '#0f172a' },
    { name: 'Cyber Cobalt & Cyan', primary: '#0f172a', secondary: '#06b6d4', text: '#0f172a' },
    { name: 'Clinical Emerald', primary: '#064e3b', secondary: '#10b981', text: '#064e3b' },
    { name: 'Crimson Executive', primary: '#4c0519', secondary: '#e11d48', text: '#4c0519' },
    { name: 'Titanium & Amber', primary: '#1e293b', secondary: '#f59e0b', text: '#1e293b' },
    { name: 'Swiss Minimal', primary: '#18181b', secondary: '#71717a', text: '#18181b' }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Palette size={16} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Branding & Template Layout
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
            Architecture, color harmonies, vector heraldry and signature seals
          </p>
        </div>
      </div>

      {/* Template Layout Selection */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Card Architectural Style
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          {([
            { id: 'modern', label: 'Modern Curved', desc: 'Curved banners & badge chips' },
            { id: 'classic', label: 'Classic School', desc: 'Full-bleed institution header' },
            { id: 'minimal', label: 'Swiss Minimal', desc: 'Precision borders & negative space' },
            { id: 'corporate', label: 'Steel Corporate', desc: 'Dual-stripe executive header' }
          ] as const).map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange({ ...design, templateStyle: style.id })}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                design.templateStyle === style.id
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-2xs ring-1 ring-blue-500/20'
                  : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
              }`}
            >
              <div className="text-xs font-black text-slate-900 dark:text-white">
                {style.label}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
                {style.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Orientation & Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Card Orientation
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['portrait', 'landscape'] as const).map((orient) => (
              <button
                key={orient}
                type="button"
                onClick={() => onChange({ ...design, orientation: orient })}
                className={`py-2 px-3 rounded-xl border text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  design.orientation === orient
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                }`}
              >
                <span 
                  className={`border border-current rounded-xs ${
                    orient === 'portrait' ? 'w-2.5 h-3.5' : 'w-3.5 h-2.5'
                  }`} 
                />
                {orient}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Institution Name
          </label>
          <input
            type="text"
            value={design.institutionName}
            onChange={(e) => onChange({ ...design, institutionName: e.target.value })}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold uppercase text-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Quick Color Palette Swatches */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Enterprise Palette Presets
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COLOR_PALETTES.map((pal) => {
            const isMatch = design.primaryColor === pal.primary && design.secondaryColor === pal.secondary;
            return (
              <button
                key={pal.name}
                type="button"
                onClick={() => onChange({
                  ...design,
                  primaryColor: pal.primary,
                  secondaryColor: pal.secondary,
                  textColor: pal.text
                })}
                className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                  isMatch
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-2xs'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
                }`}
              >
                <div className="flex items-center -space-x-1 shrink-0">
                  <span className="w-4 h-4 rounded-full border border-white shadow-2xs" style={{ backgroundColor: pal.primary }} />
                  <span className="w-4 h-4 rounded-full border border-white shadow-2xs" style={{ backgroundColor: pal.secondary }} />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300 truncate">
                  {pal.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Color Pickers */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Primary
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
            <input
              type="color"
              value={design.primaryColor}
              onChange={(e) => onChange({ ...design, primaryColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-zinc-400 uppercase">
              {design.primaryColor}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Secondary
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
            <input
              type="color"
              value={design.secondaryColor}
              onChange={(e) => onChange({ ...design, secondaryColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-zinc-400 uppercase">
              {design.secondaryColor}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400 block mb-1">
            Text Color
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800">
            <input
              type="color"
              value={design.textColor}
              onChange={(e) => onChange({ ...design, textColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-[10px] font-bold font-mono text-slate-600 dark:text-zinc-400 uppercase">
              {design.textColor}
            </span>
          </div>
        </div>
      </div>

      {/* Vector Emblems & Signature Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        
        {/* Institution Emblem / Logo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Institution Emblem
            </label>
            {design.institutionLogo && (
              <button
                type="button"
                onClick={() => onChange({ ...design, institutionLogo: '' })}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-2">
            <button
              type="button"
              onClick={() => onChange({ ...design, institutionLogo: PRESET_EMBLEMS.university })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-blue-500 bg-slate-50 dark:bg-zinc-800 text-center flex flex-col items-center gap-1 cursor-pointer"
              title="University Crest"
            >
              <img src={PRESET_EMBLEMS.university} alt="University" className="w-6 h-6 object-contain" />
              <span className="text-[8px] font-bold uppercase text-slate-600 dark:text-zinc-400">Crest</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...design, institutionLogo: PRESET_EMBLEMS.technology })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-blue-500 bg-slate-50 dark:bg-zinc-800 text-center flex flex-col items-center gap-1 cursor-pointer"
              title="Technology Shield"
            >
              <img src={PRESET_EMBLEMS.technology} alt="Tech" className="w-6 h-6 object-contain" />
              <span className="text-[8px] font-bold uppercase text-slate-600 dark:text-zinc-400">Tech</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...design, institutionLogo: PRESET_EMBLEMS.medical })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-blue-500 bg-slate-50 dark:bg-zinc-800 text-center flex flex-col items-center gap-1 cursor-pointer"
              title="Medical Caduceus"
            >
              <img src={PRESET_EMBLEMS.medical} alt="Medical" className="w-6 h-6 object-contain" />
              <span className="text-[8px] font-bold uppercase text-slate-600 dark:text-zinc-400">Med</span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ ...design, institutionLogo: PRESET_EMBLEMS.corporate })}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 hover:border-blue-500 bg-slate-50 dark:bg-zinc-800 text-center flex flex-col items-center gap-1 cursor-pointer"
              title="Corporate Diamond"
            >
              <img src={PRESET_EMBLEMS.corporate} alt="Corp" className="w-6 h-6 object-contain" />
              <span className="text-[8px] font-bold uppercase text-slate-600 dark:text-zinc-400">Corp</span>
            </button>
          </div>

          <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl hover:border-blue-500 text-slate-600 dark:text-zinc-400 cursor-pointer bg-slate-50/50 dark:bg-zinc-850/50">
            <Upload size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Custom Logo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImageUpload(e, (base64) => onChange({ ...design, institutionLogo: base64 }))}
            />
          </label>
        </div>

        {/* Authorized Signature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Registrar Signature
            </label>
            {design.authorizedSignature && (
              <button
                type="button"
                onClick={() => onChange({ ...design, authorizedSignature: '' })}
                className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onChange({ ...design, authorizedSignature: PRESET_SIGNATURE })}
            className="w-full p-2 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-blue-500 bg-slate-50 dark:bg-zinc-800 text-center flex items-center justify-center gap-2 cursor-pointer mb-2"
          >
            <img src={PRESET_SIGNATURE} alt="Signature" className="h-6 object-contain" />
            <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-zinc-300">
              Official Seal Sig
            </span>
          </button>

          <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl hover:border-blue-500 text-slate-600 dark:text-zinc-400 cursor-pointer bg-slate-50/50 dark:bg-zinc-850/50">
            <Upload size={13} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Custom Signature</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onImageUpload(e, (base64) => onChange({ ...design, authorizedSignature: base64 }))}
            />
          </label>
        </div>

      </div>

    </div>
  );
};
