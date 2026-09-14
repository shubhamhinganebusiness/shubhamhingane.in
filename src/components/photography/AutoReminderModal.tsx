import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Send, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Copy, 
  Check, 
  Calendar,
  Sparkles,
  ExternalLink,
  History
} from 'lucide-react';
import { 
  PhotographyBill, 
  STUDIO_PROFILE, 
  ReminderLog 
} from './photographyBillTypes';

interface AutoReminderModalProps {
  bill: PhotographyBill;
  isOpen: boolean;
  onClose: () => void;
  onSendReminder: (log: ReminderLog) => void;
}

type ReminderStage = 'upcoming' | 'due_today' | 'overdue' | 'urgent';
type ReminderChannel = 'whatsapp' | 'email' | 'sms';

export const AutoReminderModal: React.FC<AutoReminderModalProps> = ({
  bill,
  isOpen,
  onClose,
  onSendReminder
}) => {
  const [selectedStage, setSelectedStage] = useState<ReminderStage>(() => {
    const dueDate = new Date(bill.dueDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) return 'urgent';
    if (diffDays > 0) return 'overdue';
    if (diffDays === 0) return 'due_today';
    return 'upcoming';
  });

  const [selectedChannel, setSelectedChannel] = useState<ReminderChannel>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentNotice, setSentNotice] = useState(false);

  if (!isOpen) return null;

  const cleanPhone = bill.clientPhone.replace(/[^\d]/g, '');
  const paymentLink = `https://lensandlightstudios.in/pay/${bill.billNumber}`;

  // Generate personalized dynamic messages according to luxury studio standards
  const getSubject = (stage: ReminderStage): string => {
    switch (stage) {
      case 'upcoming':
        return `Lens & Light Studios: Upcoming Milestone Notice for ${bill.eventTitle} (${bill.billNumber})`;
      case 'due_today':
        return `Friendly Payment Reminder: Due Today for ${bill.billNumber} • Lens & Light Studios`;
      case 'overdue':
        return `Gentle Follow-Up: Overdue Statement for Invoice ${bill.billNumber}`;
      case 'urgent':
        return `Urgent Notice: Outstanding Balance for ${bill.billNumber} - Production Schedule Hold`;
    }
  };

  const getMessageBody = (stage: ReminderStage): string => {
    const clientGreeting = `Dear ${bill.clientName},`;
    const studioFooter = `Warm regards,\n${STUDIO_PROFILE.authorizedSignatory}\n${STUDIO_PROFILE.studioName}\n${STUDIO_PROFILE.phone}\n${STUDIO_PROFILE.website}`;
    const amountStr = `₹${bill.balanceDue.toLocaleString('en-IN')}`;

    switch (stage) {
      case 'upcoming':
        return `${clientGreeting}\n\nWe hope you are having a wonderful week! As our team prepares the equipment, creative direction, and logistics for "${bill.eventTitle}", here is a courteous note that your upcoming milestone payment of ${amountStr} is scheduled for ${bill.dueDate}.\n\nYou can easily review and settle online via Credit Card, Netbanking, or UPI here:\n👉 ${paymentLink}\n\nThank you for placing your trust in Lens & Light Studios.\n\n${studioFooter}`;

      case 'due_today':
        return `${clientGreeting}\n\nThis is a friendly reminder that invoice ${bill.billNumber} for "${bill.eventTitle}" amounting to ${amountStr} is due today (${bill.dueDate}).\n\nTo ensure uninterrupted post-production grading and scheduled delivery, please settle the outstanding dues at your earliest convenience:\n👉 ${paymentLink}\n\nIf you have already processed this payment via NEFT/IMPS, please ignore this notice.\n\n${studioFooter}`;

      case 'overdue':
        return `${clientGreeting}\n\nWe hope this message finds you well. Our records indicate that invoice ${bill.billNumber} for ${amountStr} was due on ${bill.dueDate} and remains pending settlement.\n\nKindly take a moment to complete this payment via our secure payment desk:\n👉 ${paymentLink}\n\nIf you need an updated statement or have any questions regarding payment arrangements, please feel free to reach out directly.\n\n${studioFooter}`;

      case 'urgent':
        return `${clientGreeting}\n\nURGENT NOTICE: Invoice ${bill.billNumber} for ${amountStr} is now overdue past the standard grace period.\n\nIn accordance with studio policy, outstanding balances beyond the grace period may incur a late surcharge and pause final color graded film delivery or album binding.\n\nPlease clear the balance today via the direct link below:\n👉 ${paymentLink}\n\nImmediate link: ${paymentLink}\n\n${studioFooter}`;
    }
  };

  const currentSubject = getSubject(selectedStage);
  const currentMessage = getMessageBody(selectedStage);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDispatch = () => {
    setIsSending(true);

    const log: ReminderLog = {
      id: `rem-${Date.now()}`,
      sentAt: new Date().toISOString(),
      channel: selectedChannel,
      stage: selectedStage,
      recipient: selectedChannel === 'email' ? bill.clientEmail : bill.clientPhone,
      messagePreview: currentMessage.slice(0, 100) + '...'
    };

    if (selectedChannel === 'whatsapp') {
      const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(currentMessage)}`;
      window.open(waUrl, '_blank');
    } else if (selectedChannel === 'email') {
      const mailtoUrl = `mailto:${encodeURIComponent(bill.clientEmail)}?subject=${encodeURIComponent(currentSubject)}&body=${encodeURIComponent(currentMessage)}`;
      window.open(mailtoUrl, '_blank');
    } else {
      // SMS
      navigator.clipboard.writeText(currentMessage);
    }

    setTimeout(() => {
      setIsSending(false);
      setSentNotice(true);
      onSendReminder(log);
      setTimeout(() => setSentNotice(false), 3000);
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-100"
        >
          {/* Top Header */}
          <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-white">Automated Payment Reminders</h3>
                <p className="text-xs text-zinc-400">
                  Send polite, scheduled multi-channel alerts for Invoice <strong className="text-white">{bill.billNumber}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Stage Selector (Before, On, Overdue, Urgent) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                1. Select Reminder Stage / Timeline
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'upcoming', label: 'Upcoming Due', desc: '3-7 Days Before', color: 'border-blue-500/50' },
                  { id: 'due_today', label: 'Due Today', desc: 'On Due Date', color: 'border-amber-500/50' },
                  { id: 'overdue', label: 'Gentle Overdue', desc: '3-5 Days Late', color: 'border-orange-500/50' },
                  { id: 'urgent', label: 'Urgent Final', desc: 'Past Grace Period', color: 'border-red-500/50' }
                ].map(stage => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStage(stage.id as ReminderStage)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedStage === stage.id
                        ? 'bg-zinc-800 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 text-white'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white">{stage.label}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{stage.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Channel Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                2. Select Dispatch Channel
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, target: bill.clientPhone },
                  { id: 'email', name: 'Email', icon: Mail, target: bill.clientEmail },
                  { id: 'sms', name: 'Direct SMS', icon: Smartphone, target: bill.clientPhone }
                ].map(ch => {
                  const Icon = ch.icon;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedChannel(ch.id as ReminderChannel)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        selectedChannel === ch.id
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white shadow-md'
                          : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Icon size={18} className={selectedChannel === ch.id ? 'text-[#D4AF37]' : 'text-zinc-500'} />
                      <div className="min-w-0">
                        <span className="font-bold text-xs block text-white">{ch.name}</span>
                        <span className="text-[10px] text-zinc-400 truncate block mt-0.5">{ch.target}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Preview & Customizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-zinc-400">
                  Message Preview ({selectedChannel.toUpperCase()})
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied to clipboard' : 'Copy text'}</span>
                </button>
              </div>

              {selectedChannel === 'email' && (
                <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300">
                  <span className="text-zinc-500">Subject: </span>
                  {currentSubject}
                </div>
              )}

              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {currentMessage}
              </div>
            </div>

            {/* Reminder Log History if previously sent */}
            {bill.reminderLogs && bill.reminderLogs.length > 0 && (
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1.5 mb-2">
                  <History size={12} />
                  Previously Dispatched Alerts ({bill.reminderLogs.length})
                </span>
                <div className="space-y-1.5 max-h-24 overflow-y-auto text-[11px]">
                  {bill.reminderLogs.map((log, idx) => (
                    <div key={log.id || idx} className="flex items-center justify-between text-zinc-400">
                      <span>
                        Sent via <strong className="text-zinc-200 uppercase">{log.channel}</strong> ({log.stage.replace('_', ' ')})
                      </span>
                      <span className="font-mono text-[10px]">
                        {new Date(log.sentAt).toLocaleDateString('en-IN')} {new Date(log.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success toast notification */}
            {sentNotice && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>Reminder successfully dispatched and recorded on this invoice statement!</span>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <span className="text-xs text-zinc-400">
                Outstanding: <strong className="text-[#D4AF37] font-mono font-bold">₹{bill.balanceDue.toLocaleString('en-IN')}</strong>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>
                    {isSending
                      ? 'Sending...'
                      : selectedChannel === 'whatsapp'
                      ? 'Open WhatsApp & Log'
                      : selectedChannel === 'email'
                      ? 'Launch Email Client & Log'
                      : 'Copy SMS & Log Alert'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
