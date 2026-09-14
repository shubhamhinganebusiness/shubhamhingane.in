import React from 'react';
import { IDCardDesign } from '../../types/idCard';
import { Shield, Cpu, Tag, Sparkles, QrCode, Barcode, Eye } from 'lucide-react';

interface SecuritySpecsPanelProps {
  design: IDCardDesign;
  onChange: (updated: IDCardDesign) => void;
}

export const SecuritySpecsPanel: React.FC<SecuritySpecsPanelProps> = ({
  design,
  onChange
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
        <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
          <Shield size={16} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Security & Physical Specifications
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">
            ISO/IEC 7810 ID-1 compliant hardware & anti-counterfeiting elements
          </p>
        </div>
      </div>

      {/* Hardware Features Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Hologram Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...design, showHologram: !design.showHologram })}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            design.showHologram
              ? 'border-amber-500/80 bg-amber-500/5 dark:bg-amber-500/10 shadow-2xs'
              : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <Sparkles size={16} className={design.showHologram ? 'text-amber-500' : 'text-slate-400'} />
            <span className={`w-2 h-2 rounded-full ${design.showHologram ? 'bg-amber-500' : 'bg-slate-300 dark:bg-zinc-700'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              Hologram Seal
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Metallic security stamp
            </div>
          </div>
        </button>

        {/* Smart Chip Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...design, showSmartChip: !design.showSmartChip })}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            design.showSmartChip
              ? 'border-blue-500/80 bg-blue-500/5 dark:bg-blue-500/10 shadow-2xs'
              : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <Cpu size={16} className={design.showSmartChip ? 'text-blue-500' : 'text-slate-400'} />
            <span className={`w-2 h-2 rounded-full ${design.showSmartChip ? 'bg-blue-500' : 'bg-slate-300 dark:bg-zinc-700'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              EMV Smart Chip
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Contact pad interface
            </div>
          </div>
        </button>

        {/* Lanyard Punch Toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...design, showLanyardHole: !design.showLanyardHole })}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
            design.showLanyardHole
              ? 'border-indigo-500/80 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-2xs'
              : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <Tag size={16} className={design.showLanyardHole ? 'text-indigo-500' : 'text-slate-400'} />
            <span className={`w-2 h-2 rounded-full ${design.showLanyardHole ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-zinc-700'}`} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-900 dark:text-white">
              Lanyard Slot
            </div>
            <div className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium mt-0.5">
              Top center punch hole
            </div>
          </div>
        </button>

      </div>

      {/* Card Finish & Texture */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Surface Finish Simulation
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {(['glossy', 'matte', 'metallic'] as const).map((finish) => (
            <button
              key={finish}
              type="button"
              onClick={() => onChange({ ...design, cardFinish: finish })}
              className={`py-2 px-3 rounded-xl border text-center text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                design.cardFinish === finish
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-zinc-900 border-slate-900 dark:border-white shadow-2xs'
                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
              }`}
            >
              {finish === 'glossy' ? 'Glossy PVC' : finish === 'matte' ? 'Matte Polymer' : 'Metallic Foil'}
            </button>
          ))}
        </div>
      </div>

      {/* Barcode & QR Code Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <Barcode size={16} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Code 128 Barcode
            </span>
          </div>
          <input
            type="checkbox"
            checked={!design.hideBarcode}
            onChange={(e) => onChange({ ...design, hideBarcode: !e.target.checked })}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-850/50 cursor-pointer">
          <div className="flex items-center gap-2">
            <QrCode size={16} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Encrypted QR Code
            </span>
          </div>
          <input
            type="checkbox"
            checked={!design.hideQRCode}
            onChange={(e) => onChange({ ...design, hideQRCode: !e.target.checked })}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Watermark Section */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Security Watermark Overlay
          </label>
          <span className="text-xs font-black text-slate-700 dark:text-zinc-300">
            {Math.round(design.watermarkOpacity * 100)}%
          </span>
        </div>
        <input
          type="text"
          placeholder="e.g. OFFICIAL ID • CONFIDENTIAL"
          value={design.watermarkText}
          onChange={(e) => onChange({ ...design, watermarkText: e.target.value })}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <input
          type="range"
          min="0"
          max="0.35"
          step="0.01"
          value={design.watermarkOpacity}
          onChange={(e) => onChange({ ...design, watermarkOpacity: parseFloat(e.target.value) })}
          className="w-full accent-blue-600"
        />
      </div>

    </div>
  );
};
