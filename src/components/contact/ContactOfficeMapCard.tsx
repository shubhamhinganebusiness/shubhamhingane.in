import React from 'react';
import { MapPin, Globe, Compass, ExternalLink, Navigation } from 'lucide-react';

export const ContactOfficeMapCard: React.FC = () => {
  return (
    <div className="rounded-3xl bg-surface dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-6 sm:p-8 card-shadow relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      <div className="relative z-10 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <MapPin size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Primary Base & Tech Hub
              </span>
              <h4 className="text-xl font-extrabold text-main-text">
                Pune, Maharashtra, India
              </h4>
            </div>
          </div>

          <a
            href="https://maps.google.com/?q=Pune,Maharashtra,India"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-primary hover:text-white text-gray-500 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            title="Open in Google Maps"
          >
            <span>Maps</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Coverage details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              <Navigation size={13} className="text-primary" />
              <span>In-Person Meetings</span>
            </div>
            <p className="text-xs font-bold text-main-text">
              Pune & PCMC Tech Corridors (Hinjawadi, Kharadi, Baner, Shivajinagar)
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/60">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-1">
              <Globe size={13} className="text-blue-500" />
              <span>Remote Worldwide</span>
            </div>
            <p className="text-xs font-bold text-main-text">
              Global Remote (US, UK, UAE, Australia & Pan-India Timezones)
            </p>
          </div>
        </div>

        {/* Multilingual consultation badge */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-medium">
            Consultations Conducted In:
          </span>
          <div className="flex gap-1.5 font-bold text-primary">
            <span className="px-2 py-0.5 rounded-md bg-primary/10">English</span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10">मराठी</span>
            <span className="px-2 py-0.5 rounded-md bg-primary/10">हिंदी</span>
          </div>
        </div>
      </div>
    </div>
  );
};
