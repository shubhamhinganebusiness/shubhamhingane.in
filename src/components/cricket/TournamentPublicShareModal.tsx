import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Share2, QrCode, Copy, Check, Printer, ExternalLink, 
  X, MessageSquare, MapPin, Trophy, Calendar, Sparkles, Smartphone
} from 'lucide-react';

interface TournamentPublicShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    id: string;
    name: string;
    format: string;
    venueGround?: string;
    city?: string;
    organizerName?: string;
    bannerUrl?: string;
    teams?: { id: string; name: string }[];
    matches?: any[];
  };
}

export const TournamentPublicShareModal: React.FC<TournamentPublicShareModalProps> = ({
  isOpen,
  onClose,
  tournament
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWaText, setCopiedWaText] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'link' | 'poster' | 'whatsapp'>('link');
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Build spectator URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cricket.app';
  const spectatorUrl = `${baseUrl}?tournament=${tournament.id}&mode=spectator`;

  // Build WhatsApp shareable message
  const teamsList = (tournament.teams || []).map(t => `• ${t.name}`).slice(0, 6).join('\n');
  const upcomingMatches = (tournament.matches || [])
    .filter(m => m.status === 'scheduled')
    .slice(0, 4)
    .map(m => `⚡ ${m.teamAName || m.teamA} vs ${m.teamBName || m.teamB} (${m.date || 'TBD'} @ ${m.time || ''})`)
    .join('\n');

  const whatsappMessage = 
`🏆 *${tournament.name.toUpperCase()}* 🏏
📍 *Venue:* ${tournament.venueGround || 'Local Stadium'}, ${tournament.city || ''}
📋 *Format:* ${tournament.format} Trophy

👥 *Participating Teams:*
${teamsList}

${upcomingMatches ? `🔥 *Upcoming Fixtures:*\n${upcomingMatches}\n` : ''}
📲 *Follow Live Scores, Ball-by-Ball & Points Table:*
👉 ${spectatorUrl}

_Powered by Live Cricket Tournament Engine_`;

  const copyToClipboard = (text: string, isWa: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isWa) {
      setCopiedWaText(true);
      setTimeout(() => setCopiedWaText(false), 2500);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const openWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[215] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-slate-900 border border-emerald-500/40 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-black/20 text-white font-black text-[9px] uppercase tracking-wider">
                  CricHeroes Public Microsite
                </span>
                <span className="text-[10px] font-bold text-emerald-100 uppercase">Live Spectator Hub</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight leading-tight">
                Share Tournament & QR Poster
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-base border-none cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setSelectedTab('link')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-none cursor-pointer transition-all flex items-center gap-1.5 ${
              selectedTab === 'link' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <ExternalLink size={13} />
            <span>Public Link</span>
          </button>

          <button
            onClick={() => setSelectedTab('whatsapp')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-none cursor-pointer transition-all flex items-center gap-1.5 ${
              selectedTab === 'whatsapp' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <MessageSquare size={13} />
            <span>WhatsApp Broadcast</span>
          </button>

          <button
            onClick={() => setSelectedTab('poster')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider border-none cursor-pointer transition-all flex items-center gap-1.5 ${
              selectedTab === 'poster' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <Printer size={13} />
            <span>Print Venue QR Poster</span>
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-left flex-1">
          {/* TAB 1: PUBLIC LINK & QR */}
          {selectedTab === 'link' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Spectator Mobile Web Link (No App Login Needed)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={spectatorUrl}
                    className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(spectatorUrl)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Anyone who taps this link can see live ball-by-ball updates, wagon wheels, live commentary, points table, and honors.
                </p>
              </div>

              {/* QR Code preview */}
              <div className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
                  <QRCodeSVG value={spectatorUrl} size={150} level="H" includeMargin />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Smartphone size={16} className="text-emerald-400" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">Instant Camera Scan</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    Scan to Open Live Match Center
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Spectators and players at the turf or stadium can point their mobile camera at this QR code to view real-time scores without typing a URL.
                  </p>
                  <button
                    onClick={() => setSelectedTab('poster')}
                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold border-none cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer size={13} /> Open Printable Ground Poster
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP BROADCAST */}
          {selectedTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-wide">
                    Pre-Formatted WhatsApp Broadcast Card
                  </h4>
                  <p className="text-xs text-slate-400">
                    Ready to send to tournament captains, player groups, and community chats.
                  </p>
                </div>
                <button
                  onClick={openWhatsAppShare}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <MessageSquare size={14} />
                  <span>Send via WhatsApp</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={10}
                  value={whatsappMessage}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-300 focus:outline-none leading-relaxed"
                />
                <button
                  onClick={() => copyToClipboard(whatsappMessage, true)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase border border-slate-700 cursor-pointer flex items-center gap-1"
                >
                  {copiedWaText ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  <span>{copiedWaText ? 'Copied Message' : 'Copy Text'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PRINTABLE POSTER */}
          {selectedTab === 'poster' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-wide">
                    Ground Venue Printable A4 Poster
                  </h4>
                  <p className="text-xs text-slate-400">
                    Stick this at the umpire table, entrance gate, or turf dugouts.
                  </p>
                </div>
                <button
                  onClick={handlePrintPoster}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl border-none cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Printer size={14} />
                  <span>Print Poster Now</span>
                </button>
              </div>

              {/* Poster Canvas Preview */}
              <div 
                ref={printRef}
                className="p-8 bg-white text-slate-900 rounded-3xl shadow-2xl border-4 border-slate-900 text-center space-y-5 max-w-md mx-auto print:border-none print:shadow-none print:m-0 print:p-0"
              >
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase tracking-widest border border-emerald-300 inline-block">
                    Official Match Center
                  </span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-950 mt-1">
                    {tournament.name}
                  </h2>
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    {tournament.format} Cricket Championship • {tournament.venueGround || 'Stadium Arena'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center">
                  <div className="p-3 bg-white rounded-xl shadow-md">
                    <QRCodeSVG value={spectatorUrl} size={180} level="H" includeMargin />
                  </div>
                  <span className="mt-3 text-xs font-black uppercase text-slate-900 tracking-wider">
                    SCAN WITH PHONE CAMERA
                  </span>
                  <p className="text-[10px] font-medium text-slate-500 max-w-xs mt-0.5">
                    View Live Scorecard, Ball-by-Ball Commentary, Points Table & Net Run Rate (NRR) in Real Time
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>Organized by: {tournament.organizerName || 'Tournament Committee'}</span>
                  <span>Free Live Access</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">
            Powered by CricHeroes-Style Tournament Management Architecture
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase border-none cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
