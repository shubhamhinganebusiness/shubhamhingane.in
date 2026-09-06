import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, Phone, Mail, FileText, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface HireMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HireMeModal: React.FC<HireMeModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create message in Firestore
      await addDoc(collection(db, 'messages'), {
        ...formState,
        type: 'hire',
        status: 'unread',
        createdAt: serverTimestamp()
      });

      // Show success state
      setIsSuccess(true);
      
      // Automatic WhatsApp redirect (similar to Contact.tsx)
      const whatsappNumber = '7719959593';
      const text = `*New Hire Request*%0A%0A*Name:* ${formState.name}%0A*Phone:* ${formState.phone}%0A*Email:* ${formState.email}%0A*Subject:* ${formState.subject}%0A*Message:* ${formState.message}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');

      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormState({ name: '', phone: '', email: '', subject: '', message: '' });
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'messages');
      } catch (firestoreErr: any) {
        alert('Failed to send request. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] px-4 md:px-0">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto border border-gray-100 dark:border-gray-800 relative"
            >
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-surface card-shadow border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:text-primary transition-all duration-300 z-10"
              >
                <X size={24} />
              </button>

              <div className="p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                <div className="mb-10 text-center">
                  <span className="uppercase tracking-[3px] text-primary font-bold block mb-2 italic">
                    {t.contact.subtitle}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-main-text">
                    {t.nav.hireMe}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                        <User size={14} className="text-primary" />
                        {t.contact.form.name}
                      </label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formState.name}
                        onChange={handleChange}
                        placeholder={t.contact.form.placeholder.name} 
                        className="w-full h-14 bg-main-bg card-shadow rounded-xl px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 text-main-text border-2 border-transparent focus:border-primary/5 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-primary" />
                        {t.contact.form.phone}
                      </label>
                      <input 
                        required
                        type="text" 
                        name="phone"
                        value={formState.phone}
                        onChange={handleChange}
                        placeholder={t.contact.form.placeholder.phone} 
                        className="w-full h-14 bg-main-bg card-shadow rounded-xl px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 text-main-text border-2 border-transparent focus:border-primary/5 transition-all" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} className="text-primary" />
                      {t.contact.form.email}
                    </label>
                    <input 
                      required
                      type="email" 
                      name="email"
                      value={formState.email}
                      onChange={handleChange}
                      placeholder={t.contact.form.placeholder.email} 
                      className="w-full h-14 bg-main-bg card-shadow rounded-xl px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 text-main-text border-2 border-transparent focus:border-primary/5 transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      {t.contact.form.subject}
                    </label>
                    <input 
                      required
                      type="text" 
                      name="subject"
                      value={formState.subject}
                      onChange={handleChange}
                      placeholder={t.contact.form.placeholder.subject} 
                      className="w-full h-14 bg-main-bg card-shadow rounded-xl px-6 focus:outline-none focus:ring-2 focus:ring-primary/20 text-main-text border-2 border-transparent focus:border-primary/5 transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} className="text-primary" />
                      {t.contact.form.message}
                    </label>
                    <textarea 
                      required
                      name="message"
                      value={formState.message}
                      onChange={handleChange}
                      rows={4} 
                      placeholder={t.contact.form.placeholder.message} 
                      className="w-full bg-main-bg card-shadow rounded-xl p-6 focus:outline-none focus:ring-2 focus:ring-primary/20 text-main-text resize-none border-2 border-transparent focus:border-primary/5 transition-all font-sans"
                    ></textarea>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || isSuccess}
                    className={`w-full h-16 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl transition-all duration-300 flex items-center justify-center gap-3 mt-4 ${
                      isSuccess 
                        ? 'bg-green-500 text-white shadow-green-200' 
                        : 'bg-primary text-white shadow-primary/20 hover:translate-y-[-5px]'
                    } disabled:opacity-70 disabled:translate-y-0`}
                  >
                    {isSubmitting ? (
                      <>Processing... <Loader2 className="animate-spin" size={18} /></>
                    ) : isSuccess ? (
                      <>Sent Successfully!</>
                    ) : (
                      <>{t.contact.form.send} <Send size={18} /></>
                    )}
                  </button>
                  
                  <p className="text-center text-gray-400 text-xs font-medium">
                    {t.contact.form.back}
                  </p>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
