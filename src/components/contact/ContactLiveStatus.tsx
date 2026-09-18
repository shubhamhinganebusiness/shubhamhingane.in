import React, { useState, useEffect } from 'react';
import { Clock, Zap, ShieldCheck, Calendar } from 'lucide-react';

export const ContactLiveStatus: React.FC = () => {
  const [puneTime, setPuneTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const istTime = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(now);
        setPuneTime(istTime);
      } catch {
        setPuneTime(new Date().toLocaleTimeString());
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-8">
      {/* Availability Status */}
      <div className="p-3.5 rounded-2xl bg-surface/80 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800 flex items-center gap-3 shadow-sm">
        <div className="relative flex items-center justify-center shrink-0">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 relative" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Current Status
          </span>
          <span className="text-xs font-bold text-main-text">
            Available for New Projects
          </span>
        </div>
      </div>

      {/* Response SLA */}
      <div className="p-3.5 rounded-2xl bg-surface/80 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
          <Zap size={18} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
            Response SLA
          </span>
          <span className="text-xs font-bold text-main-text">
            &lt; 2 Hours on WhatsApp
          </span>
        </div>
      </div>

      {/* Live Pune Time */}
      <div className="p-3.5 rounded-2xl bg-surface/80 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800 flex items-center gap-3 shadow-sm sm:col-span-2 lg:col-span-1">
        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Clock size={18} />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
            Pune, India (IST)
          </span>
          <span className="text-xs font-mono font-bold text-primary">
            {puneTime || '09:00 AM IST'}
          </span>
        </div>
      </div>
    </div>
  );
};
