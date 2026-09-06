import React, { useRef, useEffect, useState } from 'react';
import { IDCardDesign, Student } from '../../types/idCard';
import { renderCardToCanvas, generateCardAsSVG } from '../../utils/idCardGenerator';
import { 
  Download, 
  Printer, 
  Mail, 
  Eye, 
  EyeOff, 
  Layers, 
  Sparkles,
  ExternalLink,
  Grid
} from 'lucide-react';
import { motion } from 'motion/react';
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

  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('both');
  const [rendering, setRendering] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const triggerDraw = async () => {
      setRendering(true);
      try {
        if (activeSide === 'front' || activeSide === 'both') {
          const canvas = await renderCardToCanvas(design, student, 'front', 2);
          if (active && frontCanvasRef.current) {
            const ctx = frontCanvasRef.current.getContext('2d');
            if (ctx) {
              frontCanvasRef.current.width = canvas.width;
              frontCanvasRef.current.height = canvas.height;
              ctx.drawImage(canvas, 0, 0);
            }
          }
        }
        if (activeSide === 'back' || activeSide === 'both') {
          const canvas = await renderCardToCanvas(design, student, 'back', 2);
          if (active && backCanvasRef.current) {
            const ctx = backCanvasRef.current.getContext('2d');
            if (ctx) {
              backCanvasRef.current.width = canvas.width;
              backCanvasRef.current.height = canvas.height;
              ctx.drawImage(canvas, 0, 0);
            }
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
  }, [design, student, activeSide]);

  const handleDownloadPng = async (side: 'front' | 'back') => {
    try {
      // 3x scale produces professional 300 DPI high-res print output
      const canvas = await renderCardToCanvas(design, student, side, 3.5);
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ID_${student.id || 'Card'}_${side}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  const handleDownloadPngCurrent = async () => {
    try {
      setRendering(true);
      const scale = 3.5; // High-resolution printing quality

      if (activeSide === 'front' || activeSide === 'both') {
        const canvas = await renderCardToCanvas(design, student, 'front', scale);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ID_Card_${student.id || 'Holder'}_Front.png`;
        link.href = url;
        link.click();
      }

      if (activeSide === 'back' || activeSide === 'both') {
        if (activeSide === 'both') {
          // Add brief timeout to prevent browser blocking adjacent downloads
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
        const canvas = await renderCardToCanvas(design, student, 'back', scale);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `ID_Card_${student.id || 'Holder'}_Back.png`;
        link.href = url;
        link.click();
      }
    } catch (err) {
      console.error('Failed to export PNG batch:', err);
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
        const frontDataUrl = frontCanvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(frontDataUrl, 'JPEG', 0, 0, cardW, cardH);
      }

      // Back
      if (activeSide === 'back' || activeSide === 'both') {
        if (activeSide === 'both') {
          pdf.addPage();
        }
        const backCanvas = await renderCardToCanvas(design, student, 'back', 3.5);
        const backDataUrl = backCanvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(backDataUrl, 'JPEG', 0, 0, cardW, cardH);
      }

      const fileSuffix = activeSide === 'both' ? 'Dual' : activeSide === 'front' ? 'Front' : 'Back';
      pdf.save(`ID_Card_${student.id || 'Holder'}_${fileSuffix}.pdf`);
    } catch (err) {
      console.error('Pdf build error:', err);
    }
  };

  const handleDownloadSvg = (side: 'front' | 'back') => {
    try {
      const svgString = generateCardAsSVG(design, student, side);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `ID_${student.id || 'Card'}_${side}.svg`;
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
      
      let frontCanvasUrl = '';
      let backCanvasUrl = '';

      if (activeSide === 'front' || activeSide === 'both') {
        const frontCanvas = await renderCardToCanvas(design, student, 'front', 2.5);
        frontCanvasUrl = frontCanvas.toDataURL();
      }

      if (activeSide === 'back' || activeSide === 'both') {
        const backCanvas = await renderCardToCanvas(design, student, 'back', 2.5);
        backCanvasUrl = backCanvas.toDataURL();
      }
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Check popups blocked! Please allow popups for printing layout.');
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card - ${student.name}</title>
            <style>
              body {
                background: #ffffff;
                font-family: system-ui, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 40px;
              }
              .print-container {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
                justify-content: center;
              }
              .card {
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                border-radius: 12px;
                overflow: hidden;
                width: ${isPortrait ? '320px' : '507px'};
                height: ${isPortrait ? '507px' : '320px'};
              }
              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
              button {
                background: #2563eb;
                color: #ffffff;
                border: 0;
                padding: 10px 24px;
                border-radius: 9999px;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
              }
              @media print {
                button { display: none; }
                body { padding: 0; }
                .card { box-shadow: none; page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div><button onclick="window.print()">Print Document</button></div>
            <div class="print-container">
              ${frontCanvasUrl ? `<div class="card"><img src="${frontCanvasUrl}" /></div>` : ''}
              ${backCanvasUrl ? `<div class="card"><img src="${backCanvasUrl}" /></div>` : ''}
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
    const subject = encodeURIComponent(`Your Student/Faculty ID Card (${student.id})`);
    const body = encodeURIComponent(`Hello ${student.name},\n\nYour digital dual-sided ID card has been successfully generated!\n\nID Number: ${student.id}\nDepartment: ${student.department || 'N/A'}\nStatus: ${student.status}\n\nPlease contact administrative office if any details are incorrect.\n\nBest Regards,\nRegistrar Office`);
    window.location.href = `mailto:${encodeURIComponent(student.name.replace(/\s+/g, '').toLowerCase() + '@institution.edu')}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm flex flex-col items-center space-y-8">
      
      {/* Visual Header & Side Toggles */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-base font-black uppercase text-slate-900 dark:text-white tracking-widest flex items-center justify-center md:justify-start gap-1.5">
            <Sparkles size={16} className="text-amber-500 animate-spin" />
            Live Render Stage
          </h2>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
            Real-time interactive high-DPI canvas preview window
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Alignment Grid Overlay Toggle Button */}
          {onUpdateDesign && (
            <button
              onClick={() => onUpdateDesign({ ...design, showGrid: !design.showGrid })}
              className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm ${
                design.showGrid
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-550 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title="Toggle alignment grid overlay"
            >
              <Grid size={12} className={design.showGrid ? "animate-pulse stroke-[2.5]" : "stroke-[2.5]"} />
              Grid: {design.showGrid ? 'On' : 'Off'}
            </button>
          )}

          <div className="bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-full flex gap-1">
            {['both', 'front', 'back'].map((side) => (
              <button
                key={side}
                onClick={() => setActiveSide(side as any)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all transform active:scale-95 ${
                  activeSide === side
                    ? 'bg-blue-600 shadow-sm text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {side === 'both' ? 'Dual-Side' : `${side} side`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render Canvas items */}
      <div className="w-full py-8 flex items-center justify-center gap-10 flex-wrap bg-slate-50/50 dark:bg-[#0d0d17] border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl relative overflow-hidden min-h-[360px]">
        {rendering && (
          <div className="absolute inset-x-0 top-0 text-center py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest leading-none z-10 animate-pulse">
            Rendering high resolution canvas details...
          </div>
        )}

        {(activeSide === 'front' || activeSide === 'both') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
              <Layers size={11} className="text-primary" />
              {translations.previewFront}
            </span>
            <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-102 transition-all p-1.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60">
              <canvas 
                ref={frontCanvasRef} 
                className="w-full max-w-[270px] shadow-sm rounded-xl aspect-[54/85.6]"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => handleDownloadPng('front')}
                className="p-2.5 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:text-primary rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-[11px] font-extrabold flex items-center gap-1 shadow-sm"
                title={translations.downloadPng}
              >
                <Download size={13} />
                PNG
              </button>
              <button
                onClick={() => handleDownloadSvg('front')}
                className="p-2.5 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:text-primary rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-[11px] font-extrabold flex items-center gap-1 shadow-sm"
                title={translations.downloadSvg}
              >
                <ExternalLink size={13} />
                SVG
              </button>
            </div>
          </motion.div>
        )}

        {(activeSide === 'back' || activeSide === 'both') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-4"
          >
            <span className="text-xs font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
              <Layers size={11} className="text-purple-500" />
              {translations.previewBack}
            </span>
            <div className="relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl hover:scale-102 transition-all p-1.5 bg-white dark:bg-slate-850 border border-slate-100 dark:border-slate-800/60">
              <canvas 
                ref={backCanvasRef} 
                className="w-full max-w-[270px] shadow-sm rounded-xl aspect-[54/85.6]"
              />
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => handleDownloadPng('back')}
                className="p-2.5 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:text-primary rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-[11px] font-extrabold flex items-center gap-1 shadow-sm"
                title={translations.downloadPng}
              >
                <Download size={13} />
                PNG
              </button>
              <button
                onClick={() => handleDownloadSvg('back')}
                className="p-2.5 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-300 hover:text-primary rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-all text-[11px] font-extrabold flex items-center gap-1 shadow-sm"
                title={translations.downloadSvg}
              >
                <ExternalLink size={13} />
                SVG
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Primary Print Suite and PDF/PNG trigger operations */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
        <button
          onClick={handleDownloadPdfSingle}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Layers size={14} className="stroke-[2.5]" />
          {activeSide === 'both' ? 'Download PDF' : activeSide === 'front' ? 'PDF (Front)' : 'PDF (Back)'}
        </button>

        <button
          onClick={handleDownloadPngCurrent}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-sm transition-all transform active:scale-95 cursor-pointer"
        >
          <Download size={14} />
          {activeSide === 'both' ? 'Download PNG' : activeSide === 'front' ? 'PNG (Front)' : 'PNG (Back)'}
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 font-black uppercase text-xs tracking-wider rounded-2xl shadow-sm transition-all transform active:scale-95 cursor-pointer border border-transparent dark:border-slate-700"
        >
          <Printer size={14} />
          {activeSide === 'both' ? 'Print Card' : activeSide === 'front' ? 'Print Front' : 'Print Back'}
        </button>

        <button
          onClick={handleEmailCard}
          className="flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-black uppercase text-xs tracking-wider rounded-2xl shadow-sm transition-all transform active:scale-95 cursor-pointer border border-transparent dark:border-slate-700"
        >
          <Mail size={14} />
          Email Card
        </button>
      </div>

    </div>
  );
};
