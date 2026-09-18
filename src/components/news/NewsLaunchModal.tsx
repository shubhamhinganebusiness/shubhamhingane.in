import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, CheckCircle2, MessageCircle, Phone, 
  Globe, ShieldCheck, Sparkles, Building, ArrowRight, User
} from 'lucide-react';
import { NewsPackageTier } from './NewsTierPackages';

interface NewsLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: NewsPackageTier | null;
}

export const NewsLaunchModal: React.FC<NewsLaunchModalProps> = ({
  isOpen,
  onClose,
  selectedTier
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [proposedName, setProposedName] = useState('');
  const [region, setRegion] = useState('Maharashtra (Regional)');
  const [format, setFormat] = useState('Web Portal + Android App');
  const [tier, setTier] = useState<string>(selectedTier?.name || 'Regional Broadcaster & App');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync tier when prop changes
  React.useEffect(() => {
    if (selectedTier) {
      setTier(selectedTier.name);
    }
  }, [selectedTier]);

  if (!isOpen) return null;

  const constructWhatsAppMessage = () => {
    const text = `*New Media Agency Inquiry - Shubham Hingane Portfolio*\n\n` +
      `👤 *Name:* ${fullName}\n` +
      `📞 *Phone:* ${phone}\n` +
      `🏢 *Proposed Agency Name:* ${proposedName}\n` +
      `📍 *Region/Language:* ${region}\n` +
      `📦 *Selected Tier:* ${tier}\n` +
      `📰 *Target Media Format:* ${format}\n` +
      (notes ? `💬 *Additional Vision:* ${notes}\n\n` : '\n') +
      `_I would like to schedule a discovery session for setting up our news agency._`;
    return encodeURIComponent(text);
  };

  const handleSubmitAndWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // Shubham's direct WhatsApp
    const whatsappUrl = `https://wa.me/917719000000?text=${constructWhatsAppMessage()}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-surface dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 my-8 max-h-[92vh] flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Modal Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-transparent to-transparent border-b border-gray-100 dark:border-zinc-800">
            <span className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 mb-1.5">
              <Sparkles size={13} className="text-primary" />
              Media Agency Launchpad Consultation
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Start Your News Media Venture
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Connect directly with Shubham for turnkey technical architecture, RNI legal support, and Ad monetization.
            </p>
          </div>

          {/* Modal Body */}
          <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
            {isSubmitted ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                  Connecting via WhatsApp...
                </h4>
                <p className="text-xs sm:text-sm text-gray-500">
                  Your launch request details have been prepared. A chat window is opening directly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAndWhatsApp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Patil"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      WhatsApp / Calling Mobile *
                    </label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Proposed News Agency / Channel Name *
                    </label>
                    <div className="relative">
                      <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        required
                        type="text"
                        value={proposedName}
                        onChange={(e) => setProposedName(e.target.value)}
                        placeholder="e.g. Pune City Live / Maharashtra Express"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Target Region / Primary Language
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                    >
                      <option>Maharashtra (Marathi & Hindi)</option>
                      <option>District/Taluka Specific (Regional)</option>
                      <option>Pan-India Hindi / English</option>
                      <option>Specialized Niche (Agri / Crime / Sports)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Selected Tier Package
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                    >
                      <option>Hyperlocal Digital Portal</option>
                      <option>Regional Broadcaster & App</option>
                      <option>National Enterprise Network</option>
                      <option>Custom Architectural Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Media Output Desired
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                    >
                      <option>Web Portal + Android App</option>
                      <option>Web Portal Only (AMP & PWA)</option>
                      <option>Full Broadcast (Web + App + YouTube OBS Studio)</option>
                      <option>Print Newspaper + Digital Replica</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Specific Vision or Existing Channel (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us about your audience, existing social handles, or specific timeline..."
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Instant Handoff Assurance */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold">
                    <MessageCircle size={16} />
                    <span>Direct WhatsApp Handoff</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Instant 1-on-1 Discovery Call
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-xl shadow-primary/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <Send size={15} />
                  <span>Submit & Connect on WhatsApp</span>
                  <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
