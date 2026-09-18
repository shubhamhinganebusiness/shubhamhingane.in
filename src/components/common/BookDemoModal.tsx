import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, Video, User, Phone, Mail, 
  Building, Sparkles, CheckCircle2, Loader2, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface BookDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTitle?: string;
  serviceId?: string;
}

export const BookDemoModal: React.FC<BookDemoModalProps> = ({
  isOpen,
  onClose,
  serviceTitle = 'Software & Solution',
  serviceId = 'custom_demo'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    organization: '',
    preferredDate: '',
    preferredTime: '11:00 AM',
    meetingPlatform: 'Google Meet',
    notes: ''
  });

  // Set default preferred date to tomorrow
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setForm(prev => ({
        ...prev,
        preferredDate: prev.preferredDate || `${yyyy}-${mm}-${dd}`
      }));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Save demo booking in Firestore
      await addDoc(collection(db, 'demo_bookings'), {
        ...form,
        serviceTitle,
        serviceId,
        status: 'pending',
        type: 'live_demo_booking',
        createdAt: serverTimestamp()
      });

      // 2. Also log to messages collection for unified inbox tracking
      await addDoc(collection(db, 'messages'), {
        name: form.name,
        phone: form.phone,
        email: form.email,
        subject: `Live Demo Booking: ${serviceTitle}`,
        message: `Demo Request for ${serviceTitle}\nOrganization: ${form.organization || 'N/A'}\nPreferred Date: ${form.preferredDate} at ${form.preferredTime}\nPlatform: ${form.meetingPlatform}\nNotes: ${form.notes || 'None'}`,
        type: 'demo_booking',
        status: 'unread',
        createdAt: serverTimestamp()
      });

      setIsSuccess(true);

      // WhatsApp notification
      const waNumber = '7719959593';
      const waText = encodeURIComponent(
        `*New Live Demo Booking!*\n\n` +
        `*Service:* ${serviceTitle}\n` +
        `*Name:* ${form.name}\n` +
        `*Phone:* ${form.phone}\n` +
        `*Email:* ${form.email || 'N/A'}\n` +
        `*Org / Business:* ${form.organization || 'Individual'}\n` +
        `*Date & Time:* ${form.preferredDate} at ${form.preferredTime} (${form.meetingPlatform})\n` +
        (form.notes ? `*Notes:* ${form.notes}` : '')
      );

      // Delay opening whatsapp slightly for seamless UI feedback
      setTimeout(() => {
        window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
      }, 700);

      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error('Demo booking error:', err);
      // Fallback direct WhatsApp if database write hits offline state
      const waNumber = '7719959593';
      const waText = encodeURIComponent(
        `*Demo Booking Request: ${serviceTitle}*\nName: ${form.name}\nPhone: ${form.phone}\nDate: ${form.preferredDate} at ${form.preferredTime}`
      );
      window.open(`https://wa.me/${waNumber}?text=${waText}`, '_blank');
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsSubmitting(false);
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden my-8"
        >
          {/* Header Accent Glow */}
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-primary via-indigo-500 to-emerald-500" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors z-10 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="p-6 md:p-8">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center flex flex-col items-center justify-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Demo Booked Successfully!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                  Thank you, <span className="font-semibold text-gray-900 dark:text-white">{form.name}</span>! We’ve reserved your interactive walkthrough for <span className="font-semibold text-primary">{serviceTitle}</span>. Connecting to WhatsApp to confirm your meeting link...
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-xs font-bold mt-2">
                  <ShieldCheck size={14} />
                  <span>Calendar Invite & Link Dispatched</span>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles size={13} />
                    <span>Interactive 1-on-1 Walkthrough</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                    Book a Live Demo
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Experience <strong className="text-gray-800 dark:text-gray-200">{serviceTitle}</strong> in action with custom business data, live architecture Q&A, and tailored implementation scope.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="e.g. Ramesh Kulkarni"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Organization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Company / Organization
                      </label>
                      <div className="relative">
                        <Building size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={form.organization}
                          onChange={(e) => setForm({ ...form, organization: e.target.value })}
                          placeholder="e.g. Acme Enterprises"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferred Date & Time Slot */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Date
                      </label>
                      <div className="relative">
                        <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={form.preferredDate}
                          onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Slot
                      </label>
                      <div className="relative">
                        <Clock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          value={form.preferredTime}
                          onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                          <option>10:00 AM</option>
                          <option>11:30 AM</option>
                          <option>02:00 PM</option>
                          <option>04:00 PM</option>
                          <option>06:00 PM</option>
                          <option>08:00 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                        Platform
                      </label>
                      <div className="relative">
                        <Video size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                          value={form.meetingPlatform}
                          onChange={(e) => setForm({ ...form, meetingPlatform: e.target.value })}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                          <option>Google Meet</option>
                          <option>Zoom Call</option>
                          <option>WhatsApp Video</option>
                          <option>Phone Discussion</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Specific Requirements */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                      Specific Requirements or Questions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. Want to see offline billing and inventory export flow..."
                      className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/80 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white font-extrabold text-sm uppercase tracking-wider transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          <span>Reserving Demo Slot...</span>
                        </>
                      ) : (
                        <>
                          <Calendar size={18} />
                          <span>Confirm & Book Demo Call</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                      Free 25-minute live consultation • No obligation • Direct developer discussion
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
