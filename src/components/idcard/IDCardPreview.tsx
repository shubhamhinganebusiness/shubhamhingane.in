import React, { useRef, useEffect, useState } from 'react';
import { IDCardDesign, Student } from '../../types/idCard';
import { renderCardToCanvas, generateCardAsSVG, generateBulkPDF } from '../../utils/idCardGenerator';
import { 
  Download, 
  Printer, 
  Mail, 
  Layers, 
  Sparkles,
  ExternalLink,
  Grid,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  CreditCard,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface IDCardPreviewProps {
  design: IDCardDesign;
  student: Student;
  language: 'en' | 'hi' | 'es';
  translations: any;
  onUpdateDesign?: (newDesign: IDCardDesign) => void;
}

export const IDCardPreview: React.FC<IDCardPreviewProps> = ({
  design,
  student,
  language,
  translations,
  onUpdateDesign
}) => {
  const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flipFrontCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const flipBackCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [viewMode, setViewMode] = useState<'flat' | '3d'>('3d');
  const [isFlipped3D, setIsFlipped3D] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rendering, setRendering] = useState<boolean>(false);
  const [showLanyardStrap, setShowLanyardStrap] = useState<boolean>(true);

  // Synchronize Canvas Render on design/student changes
  useEffect(() => {
    let active = true;
    const triggerDraw = async () => {
      setRendering(true);
      try {
        const renderScale = 2.5; // High crispness for preview screen
        const frontCanvas = await renderCardToCanvas(design, student, 'front', renderScale);
        const backCanvas = await renderCardToCanvas(design, student, 'back', renderScale);

        if (!active) return;

        // Draw flat side-by-side refs
        if (frontCanvasRef.current) {
          const ctx = frontCanvasRef.current.getContext('2d');
          if (ctx) {
            frontCanvasRef.current.width = frontCanvas.width;
            frontCanvasRef.current.height = frontCanvas.height;
            ctx.drawImage(frontCanvas, 0, 0);
          }
        }
        if (backCanvasRef.current) {
          const ctx = backCanvasRef.current.getContext('2d');
          if (ctx) {
            backCanvasRef.current.width = backCanvas.width;
            backCanvasRef.current.height = backCanvas.height;
            ctx.drawImage(backCanvas, 0, 0);
          }
        }

        // Draw 3D flip card refs
        if (flipFrontCanvasRef.current) {
          const ctx = flipFrontCanvasRef.current.getContext('2d');
          if (ctx) {
            flipFrontCanvasRef.current.width = frontCanvas.width;
            flipFrontCanvasRef.current.height = frontCanvas.height;
            ctx.drawImage(frontCanvas, 0, 0);
          }
        }
        if (flipBackCanvasRef.current) {
          const ctx = flipBackCanvasRef.current.getContext('2d');
          if (ctx) {
            flipBackCanvasRef.current.width = backCanvas.width;
            flipBackCanvasRef.current.height = backCanvas.height;
            ctx.drawImage(backCanvas, 0, 0);
          }
        }
      } catch (err) {
        console.error('Error drawing canvas previews:', err);
      } finally {
        if (active) setRendering(false);
      }
    };

    triggerDraw();

    return () => {
      active = false;
    };
  }, [design, student, activeSide, viewMode]);

  const handleDownloadPng = async (side: 'front' | 'back') => {
    try {
      const canvas = await renderCardToCanvas(design, student, side, 3.5);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ZenID_${student.id || 'Card'}_${side}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handleDownloadMergedDualPng = async () => {
    try {
      setRendering(true);
      const scale = 3.5;
      const isPortrait = design.orientation === 'portrait';
      const frontCanvas = await renderCardToCanvas(design, student, 'front', scale);
      const backCanvas = await renderCardToCanvas(design, student, 'back', scale);

      // Create merged dual-sided presentation canvas
      const mergedCanvas = document.createElement('canvas');
      const gap = 30 * scale;
      const padding = 30 * scale;

      if (isPortrait) {
        mergedCanvas.width = frontCanvas.width * 2 + gap + padding * 2;
        mergedCanvas.height = frontCanvas.height + padding * 2;
      } else {
        mergedCanvas.width = frontCanvas.width + padding * 2;
        mergedCanvas.height = frontCanvas.height * 2 + gap + padding * 2;
      }

      const mCtx = mergedCanvas.getContext('2d')!;
      mCtx.fillStyle = '#0f172a'; // Sleek dark presentation canvas backdrop
      mCtx.fillRect(0, 0, mergedCanvas.width, mergedCanvas.height);

      if (isPortrait) {
        mCtx.drawImage(frontCanvas, padding, padding);
        mCtx.drawImage(backCanvas, padding + frontCanvas.width + gap, padding);
      } else {
        mCtx.drawImage(frontCanvas, padding, padding);
        mCtx.drawImage(backCanvas, padding, padding + frontCanvas.height + gap);
      }

      const url = mergedCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ZenID_${student.id || 'Card'}_Dual_Presentation.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Failed to export dual PNG:', err);
    } finally {
      setRendering(false);
    }
  };

  const handleDownloadPdfSingle = async () => {
    try {
      const isPortrait = design.orientation === 'portrait';
      const cardW = isPortrait ? 54 : 85.6;
      const cardH = isPortrait ? 85.6 : 54;

      const pdf = new jsPDF({
        orientation: isPortrait ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [cardW, cardH]
      });

      // Front
      if (activeSide === 'front' || activeSide === 'both') {
        const frontCanvas = await renderCardToCanvas(design, student, 'front', 3.5);
        const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(frontDataUrl, 'JPEG', 0, 0, cardW, cardH);
      }

      // Back
      if (activeSide === 'back' || activeSide === 'both') {
        if (activeSide === 'both') {
          pdf.addPage();
        }
        const backCanvas = await renderCardToCanvas(design, student, 'back', 3.5);
        const backDataUrl = backCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(backDataUrl, 'JPEG', 0, 0, cardW, cardH);
      }

      const fileSuffix = activeSide === 'both' ? 'Dual' : activeSide === 'front' ? 'Front' : 'Back';
      pdf.save(`ZenID_${student.id || 'Holder'}_${fileSuffix}_CR80.pdf`);
    } catch (err) {
      console.error('Pdf build error:', err);
    }
  };

  const handleDownloadA4PrintSheet = async () => {
    try {
      setRendering(true);
      const pdf = await generateBulkPDF(design, [student, student], 'both');
      pdf.save(`ZenID_${student.id || 'Card'}_A4_Print_Sheet.pdf`);
    } catch (err) {
      console.error('A4 sheet export failed:', err);
    } finally {
      setRendering(false);
    }
  };

  const handleDownloadSvg = (side: 'front' | 'back') => {
    try {
      const svgString = generateCardAsSVG(design, student, side);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ZenID_${student.id || 'Card'}_${side}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('SVG build error:', err);
    }
  };

  const handlePrint = async () => {
    try {
      const isPortrait = design.orientation === 'portrait';
      const frontCanvas = await renderCardToCanvas(design, student, 'front', 3);
      const backCanvas = await renderCardToCanvas(design, student, 'back', 3);
      const frontCanvasUrl = frontCanvas.toDataURL();
      const backCanvasUrl = backCanvas.toDataURL();
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to open the print dialog.');
        return;
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>ZenID Pro Print - ${student.name} (${student.id})</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body {
                background: #f8fafc;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                margin: 0;
                padding: 24px;
                display: flex;
                flex-direction: column;
                align-items: center;
              }
              .toolbar {
                margin-bottom: 24px;
                display: flex;
                gap: 12px;
              }
              button {
                background: #0f172a;
                color: #ffffff;
                border: 0;
                padding: 10px 24px;
                border-radius: 9999px;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
                letter-spacing: 0.5px;
              }
              .print-container {
                display: flex;
                gap: 24px;
                flex-wrap: wrap;
                justify-content: center;
              }
              .card-box {
                background: #ffffff;
                padding: 8px;
                border: 1px dashed #cbd5e1;
                border-radius: 8px;
                text-align: center;
              }
              .card-label {
                font-size: 11px;
                font-weight: 700;
                color: #64748b;
                margin-bottom: 6px;
                text-transform: uppercase;
              }
              .card {
                box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.15);
                border-radius: 12px;
                overflow: hidden;
                width: ${isPortrait ? '54mm' : '85.6mm'};
                height: ${isPortrait ? '85.6mm' : '54mm'};
              }
              img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
              }
              .cut-guide {
                font-size: 10px;
                color: #94a3b8;
                margin-top: 6px;
              }
              @media print {
                .toolbar { display: none; }
                body { background: #ffffff; padding: 0; }
                .card { box-shadow: none; }
                .card-box { border: 0.5pt dashed #94a3b8; page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="toolbar">
              <button onclick="window.print()">Print ISO CR80 Cards</button>
            </div>
            <div class="print-container">
              <div class="card-box">
                <div class="card-label">Front Side (CR80)</div>
                <div class="card"><img src="${frontCanvasUrl}" /></div>
                <div class="cut-guide">Trim along border line</div>
              </div>
              <div class="card-box">
                <div class="card-label">Back Side (CR80)</div>
                <div class="card"><img src="${backCanvasUrl}" /></div>
                <div class="cut-guide">Trim along border line</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('Error handling print command:', err);
    }
  };

  const handleEmailCard = () => {
    const subject = encodeURIComponent(`Digital ID Credential - ${student.name} (${student.id})`);
    const body = encodeURIComponent(
      `Dear ${student.name},\n\n` +
      `Your official dual-sided ID credential has been verified and issued by ${design.institutionName}.\n\n` +
      `• Holder: ${student.name}\n` +
      `• ID Number: ${student.id}\n` +
      `• Role: ${student.role}\n` +
      `• Department: ${student.department || 'N/A'}\n` +
      `• Valid Until: ${student.validUntil}\n` +
      `• Status: ${student.status}\n\n` +
      `This is an authenticated digital record. Please present this card at security checkpoints.\n\n` +
      `Office of the Registrar & Identity Services`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const isPortrait = design.orientation === 'portrait';

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col space-y-6">
      
      {/* Visual Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard size={16} />
            </span>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Interactive Card Stage
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              ISO/IEC 7810 CR80
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mt-1">
            Real-time 300 DPI high-definition canvas preview with dual-face alignment
          </p>
        </div>

        {/* View Mode & Grid Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher: 3D Flip vs Dual Flat */}
          <div className="bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200/60 dark:border-zinc-700/60">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <RotateCw size={12} className={viewMode === '3d' ? 'text-blue-500' : ''} />
              3D Badge
            </button>
            <button
              onClick={() => setViewMode('flat')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                viewMode === 'flat'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers size={12} className={viewMode === 'flat' ? 'text-blue-500' : ''} />
              Dual-Side
            </button>
          </div>

          {/* Grid Toggle */}
          {onUpdateDesign && (
            <button
              onClick={() => onUpdateDesign({ ...design, showGrid: !design.showGrid })}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                design.showGrid
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
              title="Toggle precision drafting grid"
            >
              <Grid size={12} />
              Grid
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-xl p-1 border border-slate-200/60 dark:border-zinc-700/60">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.15))}
              className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-black px-1.5 text-slate-700 dark:text-zinc-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
              className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* RENDER STAGE CANVAS */}
      <div className="relative w-full py-10 px-4 flex flex-col items-center justify-center bg-slate-50/70 dark:bg-zinc-950/60 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl min-h-[440px] overflow-hidden">
        
        {/* Rendering Indicator Bar */}
        {rendering && (
          <div className="absolute top-0 inset-x-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest py-1 text-center animate-pulse z-20">
            Rendering 300 DPI High-Definition Canvas...
          </div>
        )}

        {/* ======================================================== */}
        {/* 3D BADGE SHOWCASE MODE */}
        {/* ======================================================== */}
        {viewMode === '3d' && (
          <div 
            className="flex flex-col items-center transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Lanyard Strap & Clip Simulation */}
            {showLanyardStrap && (
              <div className="flex flex-col items-center mb-[-12px] z-10 select-none">
                {/* Woven Lanyard Fabric Ribbon */}
                <div 
                  className="w-12 h-14 rounded-t-md shadow-xs flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: design.primaryColor }}
                >
                  <div className="w-1.5 h-full bg-white/20" />
                  <div className="w-1 h-full bg-white/30 ml-1.5" />
                  <span className="absolute text-[8px] font-black uppercase tracking-widest text-white/70 rotate-90 whitespace-nowrap">
                    SECURE
                  </span>
                </div>
                {/* Metallic Chrome Swivel Hook */}
                <div className="w-7 h-4 bg-gradient-to-b from-slate-200 via-slate-400 to-slate-300 rounded-sm border border-slate-400 shadow-sm" />
                <div className="w-4 h-5 border-2 border-slate-400 rounded-b-full mt-[-2px] bg-transparent" />
              </div>
            )}

            {/* 3D Flip Card Container */}
            <div 
              className="relative cursor-pointer select-none group"
              style={{
                perspective: '1200px',
                width: isPortrait ? '280px' : '440px',
                height: isPortrait ? '443px' : '280px'
              }}
              onClick={() => setIsFlipped3D(!isFlipped3D)}
            >
              <div
                className="w-full h-full relative transition-transform duration-700 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped3D ? 'rotateY(180deg)' : 'rotateY(0deg)'
                }}
              >
                {/* FRONT FACE */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-300/80 dark:border-zinc-700 bg-white"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)'
                  }}
                >
                  <canvas
                    ref={flipFrontCanvasRef}
                    className="w-full h-full object-contain block"
                  />
                  {/* Glossy PVC Specular Highlight Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
                </div>

                {/* BACK FACE */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border border-slate-300/80 dark:border-zinc-700 bg-white"
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <canvas
                    ref={flipBackCanvasRef}
                    className="w-full h-full object-contain block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Flip hint & side quick toggles */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setIsFlipped3D(!isFlipped3D)}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:scale-102 transition-transform flex items-center gap-2 cursor-pointer"
              >
                <RotateCw size={13} className={isFlipped3D ? 'rotate-180 transition-transform' : ''} />
                Flip to {isFlipped3D ? 'Front Face' : 'Back Face'}
              </button>

              <button
                onClick={() => setShowLanyardStrap(!showLanyardStrap)}
                className="px-3 py-2 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
              >
                Lanyard: {showLanyardStrap ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DUAL-SIDE FLAT STAGE MODE */}
        {/* ======================================================== */}
        {viewMode === 'flat' && (
          <div 
            className="flex items-center justify-center gap-8 flex-wrap transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* Front Card Canvas */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {translations.previewFront || 'Front Side'}
              </div>
              <div 
                className="rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-zinc-700 bg-white"
                style={{
                  width: isPortrait ? '260px' : '390px',
                  height: isPortrait ? '411px' : '260px'
                }}
              >
                <canvas ref={frontCanvasRef} className="w-full h-full object-contain block" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPng('front')}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:text-blue-600 flex items-center gap-1 shadow-2xs"
                >
                  <Download size={11} /> Front PNG
                </button>
                <button
                  onClick={() => handleDownloadSvg('front')}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:text-blue-600 flex items-center gap-1 shadow-2xs"
                >
                  <ExternalLink size={11} /> SVG
                </button>
              </div>
            </div>

            {/* Back Card Canvas */}
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {translations.previewBack || 'Back Side'}
              </div>
              <div 
                className="rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-zinc-700 bg-white"
                style={{
                  width: isPortrait ? '260px' : '390px',
                  height: isPortrait ? '411px' : '260px'
                }}
              >
                <canvas ref={backCanvasRef} className="w-full h-full object-contain block" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPng('back')}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:text-purple-600 flex items-center gap-1 shadow-2xs"
                >
                  <Download size={11} /> Back PNG
                </button>
                <button
                  onClick={() => handleDownloadSvg('back')}
                  className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:text-purple-600 flex items-center gap-1 shadow-2xs"
                >
                  <ExternalLink size={11} /> SVG
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Dimension Spec Footer Callout */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-50 dark:bg-zinc-850/60 rounded-xl border border-slate-100 dark:border-zinc-800 text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Spec: <strong>ISO/IEC 7810 ID-1 (CR80)</strong> • 85.60 mm × 53.98 mm • Corner Radius: 3.18 mm</span>
        </div>
        <div>
          <span>Output: <strong>300 DPI Ultra High Definition</strong> • Ready for thermal transfer PVC printers</span>
        </div>
      </div>

      {/* Primary Export & Printing Actions Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
        <button
          onClick={handleDownloadPdfSingle}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-xs transition-all transform active:scale-95 cursor-pointer"
        >
          <Layers size={14} />
          Download CR80 PDF
        </button>

        <button
          onClick={handleDownloadMergedDualPng}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-xs transition-all transform active:scale-95 cursor-pointer"
        >
          <Download size={14} />
          Dual Presentation PNG
        </button>

        <button
          onClick={handleDownloadA4PrintSheet}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-zinc-800 hover:bg-slate-800 dark:hover:bg-zinc-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-xs transition-all transform active:scale-95 cursor-pointer border border-transparent dark:border-zinc-700"
        >
          <FileText size={14} />
          Printable A4 Sheet
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-750 text-slate-900 dark:text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-xs transition-all transform active:scale-95 cursor-pointer border border-slate-200 dark:border-zinc-700"
        >
          <Printer size={14} />
          Print Dialog
        </button>
      </div>

    </div>
  );
};
