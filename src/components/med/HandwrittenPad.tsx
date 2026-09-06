import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool, Eraser } from 'lucide-react';

interface HandwrittenPadProps {
  onSave: (dataUrl: string) => void;
  onClear: () => void;
}

export const HandwrittenPad: React.FC<HandwrittenPadProps> = ({ onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.beginPath();
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineWidth = tool === 'eraser' ? 20 : 2;
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : '#1e3a8a'; // Blue ink style

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      onClear();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setTool('pen')}
            className={`p-3 rounded-xl transition-all ${tool === 'pen' ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <PenTool size={18} />
          </button>
          <button 
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-3 rounded-xl transition-all ${tool === 'eraser' ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
          >
            <Eraser size={18} />
          </button>
        </div>
        <button 
          type="button" 
          onClick={clear}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <RotateCcw size={14} /> Clear All
        </button>
      </div>
      <div className="relative aspect-[4/3] w-full bg-[#fdfdfd] dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-inner cursor-crosshair">
        {/* Lined paper effect */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px)', 
            backgroundSize: '100% 32px' 
          }} 
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
    </div>
  );
};
