import React, { useState } from 'react';
import { 
  Facebook, Linkedin, Phone, Mail, MapPin, Send, MessageSquare, 
  Clock, CheckCircle2, Loader2, MessageCircle, Copy, Check, Github,
  Calendar, Sparkles, Zap, ArrowRight, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

import { ContactLiveStatus } from './contact/ContactLiveStatus';
import { ContactScopeSelector, ScopeSelection } from './contact/ContactScopeSelector';
import { ContactOfficeMapCard } from './contact/ContactOfficeMapCard';
import { ContactTrustBadges } from './contact/ContactTrustBadges';
import { ContactLivePreview } from './contact/ContactLivePreview';

const ContactInfoItem = ({ icon: Icon, title, content }: { icon: any, title: string, content: string }) => {
  const [copied, setCopied] = useState(false);
  const isEmail = content.includes('@');
  const isPhone = /^[+\d\s()-]{7,20}$/.test(content.trim()) || title.toLowerCase().includes('phone') || title.toLowerCase().includes('call');
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let href = '';
  if (isEmail) href = `mailto:${content}`;
  else if (isPhone) href = `tel:${content.replace(/[^\d+]/g, '')}`;

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-surface/50 dark:bg-surface/30 border border-gray-100/50 dark:border-gray-800/50 hover:bg-surface hover:border-gray-100 dark:hover:border-gray-800 transition-all duration-300 group">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-full bg-surface card-shadow flex items-center justify-center text-primary group-hover:scale-110 transition-all duration-300 flex-shrink-0">
          <Icon size={22} />
        </div>
        <div>
          <span className="block text-xs uppercase tracking-widest font-bold text-gray-400 dark:text-gray-500 mb-1 transition-colors">{title}</span>
          {href ? (
            <a href={href} className="text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary font-semibold transition-colors underline decoration-dotted underline-offset-4 decoration-primary/50 break-all">
              {content}
            </a>
          ) : (
            <p className="text-gray-700 dark:text-gray-200 font-semibold transition-colors">{content}</p>
          )}
        </div>
      </div>
      
      {(isEmail || isPhone) && (
        <button
          onClick={handleCopy}
          className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-primary hover:border-primary/30 transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5 text-xs font-bold"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500 text-[10px] uppercase tracking-wider font-extrabold font-sans">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span className="text-gray-400 text-[10px] uppercase tracking-wider font-extrabold font-sans">Copy</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export const Contact = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();

  const contactTitle = settings?.contactTitle || t.contact.info.title;
  const contactJob = settings?.contactJob || t.contact.info.job;
  const contactDesc = settings?.contactDesc || t.contact.info.desc;
  const contactPhone = settings?.contactPhone || t.contact.info.phone;
  const contactEmail = settings?.contactEmail || t.contact.info.emailAddr;
  const contactHours = settings?.contactHours || t.contact.info.monfri;
  const contactImage = settings?.contactImage || "https://picsum.photos/seed/contact-office/800/500";
  const whatsappNumber = settings?.contactWhatsapp || "7719959593";

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  });

  // Scope, budget, and urgency state
  const [scope, setScope] = useState<ScopeSelection>({
    projectType: 'Full-Stack Web App',
    budgetRange: '₹50,000 - ₹1,50,000',
    timeline: '1 Month'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    }
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formattedValue });
    if (errors.phone) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.phone;
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is strictly required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required for follow-up';
    } else {
      const numericPhone = formData.phone.replace(/[^\d]/g, '');
      if (numericPhone.length < 10) {
        newErrors.phone = `Need ${10 - numericPhone.length} more digits (10 total)`;
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format (e.g. name@domain.com)';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Please specify what this is regarding';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please share some details about your inquiry';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message is too short (min 10 characters)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // 1. Save to Firebase with enriched scope and timeline details
      await addDoc(collection(db, 'messages'), {
        ...formData,
        projectType: scope.projectType,
        budgetRange: scope.budgetRange,
        timeline: scope.timeline,
        createdAt: serverTimestamp(),
        status: 'unread'
      });

      // 2. Prepare WhatsApp Message
      const whatsappNumberRaw = settings?.contactWhatsapp || '7719959593';
      const text = 
        `*New Project Brief Inquiry - Portfolio*%0A%0A` +
        `*Name:* ${encodeURIComponent(formData.name)}%0A` +
        `*Phone:* ${encodeURIComponent(formData.phone)}%0A` +
        `*Email:* ${encodeURIComponent(formData.email)}%0A` +
        `*Scope:* ${encodeURIComponent(scope.projectType)}%0A` +
        `*Budget:* ${encodeURIComponent(scope.budgetRange)}%0A` +
        `*Timeline:* ${encodeURIComponent(scope.timeline)}%0A` +
        `*Subject:* ${encodeURIComponent(formData.subject)}%0A` +
        `*Message:* ${encodeURIComponent(formData.message)}`;
      
      // 3. Open WhatsApp (Universal link)
      window.open(`https://wa.me/${whatsappNumberRaw}?text=${text}`, '_blank');

      setIsSuccess(true);
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
      
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectQuickWhatsApp = () => {
    const defaultMsg = encodeURIComponent(
      `Hi Shubham, I was browsing your portfolio and would like to quickly discuss a project with you.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${defaultMsg}`, '_blank');
  };

  const handleBookDiscoveryCall = () => {
    // Schedule call via email / calendar
    const mailto = `mailto:${contactEmail}?subject=Scheduling a 15-Minute Discovery Call with Shubham&body=Hi Shubham,%0A%0AI would like to schedule a 15-minute discovery call to discuss a potential project.%0A%0AMy Preferred Dates/Times:%0A-%0A%0AThanks!`;
    window.location.href = mailto;
  };

  return (
    <section id="contact" className="py-24 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto border-t border-gray-300 dark:border-gray-800 relative">
      
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-16">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="uppercase tracking-[3px] text-primary font-bold block mb-3 text-xs sm:text-sm"
        >
          {t.contact.subtitle}
        </motion.span>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 text-main-text tracking-tight"
        >
          {t.contact.title}
        </motion.h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
          {t.contact.desc}
        </p>
      </div>

      {/* STEP 2: Live Availability Status, Pune Time & Response SLA */}
      <ContactLiveStatus />

      {/* STEP 3: Dual-Channel Quick Actions Banner */}
      <div className="mb-12 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-main-text">
              Need a Fast Answer or Immediate Consultation?
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Connect in 1 click via WhatsApp or request a 15-minute discovery call.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleDirectQuickWhatsApp}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <MessageCircle size={15} />
            <span>Quick WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleBookDiscoveryCall}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-main-text border border-gray-200 dark:border-zinc-700 hover:border-primary/50 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Calendar size={15} className="text-primary" />
            <span>Book 15m Call</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Profile + Location Map & Right Form with Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Side: Contact Info & Interactive Office Map Card */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-5 space-y-6"
        >
          {/* Profile Card */}
          <div className="bg-surface card-shadow rounded-[2rem] p-6 sm:p-8 md:p-10 relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 text-gray-200/10 dark:text-white/5 transition-colors duration-500 pointer-events-none">
                <MessageSquare size={260} strokeWidth={1} />
             </div>

             <div className="relative z-10">
               <div className="rounded-2xl overflow-hidden mb-8 aspect-[16/10] card-shadow">
                 <img 
                   src={contactImage} 
                   alt="Workspace" 
                   loading="lazy"
                   className="w-full h-full object-cover transition-transform duration-700"
                   referrerPolicy="no-referrer"
                 />
               </div>
               
               <h3 className="text-2xl sm:text-3xl font-black mb-1 font-heading text-main-text">{contactTitle}</h3>
               <p className="text-primary font-bold text-sm mb-4">{contactJob}</p>
               
               <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-sm sm:text-base">
                 {contactDesc}
               </p>
 
               <div className="space-y-4 mb-8">
                 <ContactInfoItem icon={Phone} title={t.contact.info.call} content={contactPhone} />
                 <ContactInfoItem icon={Mail} title={t.contact.info.email} content={contactEmail} />
                 <ContactInfoItem icon={Clock} title={t.contact.info.hours} content={contactHours} />
               </div>
 
               <div>
                  <span className="uppercase tracking-[2px] text-gray-400 text-xs font-bold block mb-4">
                    {t.contact.info.network}
                  </span>
                  <div className="flex gap-3">
                    {[
                      { Icon: Github, label: 'GitHub', key: 'github', defaultUrl: 'https://github.com/shubhamhingane' },
                      { Icon: Linkedin, label: 'LinkedIn', key: 'linkedin', defaultUrl: 'https://linkedin.com/in/shubham-hingane' },
                      { Icon: MessageCircle, label: 'WhatsApp', key: 'whatsapp', defaultUrl: 'https://wa.me/917719959593' },
                      { Icon: Mail, label: 'Email', key: 'email', defaultUrl: 'mailto:shubhamhingane7719@gmail.com' }
                    ].map(({ Icon, label, key, defaultUrl }, idx) => {
                      let url = "#";
                      if (key === 'whatsapp') {
                        const wn = settings?.contactWhatsapp || "7719959593";
                        url = `https://wa.me/${wn}`;
                      } else if (key === 'phone') {
                        const pNum = (settings?.contactPhone || "7719959593").replace(/[^\d+]/g, '');
                        url = `tel:${pNum}`;
                      } else if (key === 'email') {
                        const emailAddr = settings?.contactEmail || "shubhamhingane7719@gmail.com";
                        url = `mailto:${emailAddr}`;
                      } else {
                        url = settings?.socials?.[key] || defaultUrl;
                      }
                      
                      return (
                        <a 
                          key={idx} 
                          href={url} 
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visit my ${label} profile`}
                          className="w-12 h-12 rounded-xl bg-surface card-shadow flex items-center justify-center text-main-text hover:text-white hover:bg-primary transition-all duration-300 border border-gray-100 dark:border-zinc-800"
                        >
                          <Icon size={18} />
                        </a>
                      );
                    })}
                  </div>
                </div>
             </div>
          </div>

          {/* STEP 4: Interactive Office / Service Area Map Card */}
          <ContactOfficeMapCard />
        </motion.div>

        {/* Right Side: Scope Selectors + Form + Live Preview */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-7 space-y-6"
        >
          <form onSubmit={handleSubmit} className="bg-surface card-shadow rounded-[2rem] p-6 sm:p-8 lg:p-10 space-y-6 border border-gray-100 dark:border-zinc-800">
            
            {/* Header info */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-primary block mb-1">
                Project Intake &amp; Inquiry
              </span>
              <h3 className="text-2xl font-black text-main-text tracking-tight">
                Submit Your Project Brief
              </h3>
            </div>

            {/* STEP 1: Interactive Scope, Budget & Timeline Selectors */}
            <ContactScopeSelector
              selection={scope}
              onChange={setScope}
            />

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
               <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  <label className="flex justify-between">
                    <span>{t.contact.form.name} *</span>
                    {errors.name && <span className="text-[10px] text-red-500 lowercase font-medium tracking-normal">* {errors.name}</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if(errors.name) setErrors(prev => ({...prev, name: ''}));
                    }}
                    placeholder={t.contact.form.placeholder.name} 
                    className={`w-full h-14 bg-main-bg rounded-xl px-5 focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500/20 border-red-500/20' : 'focus:ring-primary/20'} text-main-text border border-gray-200 dark:border-zinc-700 text-xs font-normal transition-all`} 
                  />
               </div>

               <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  <label className="flex justify-between">
                    <span>{t.contact.form.phone} *</span>
                    {errors.phone && <span className="text-[10px] text-red-500 lowercase font-medium tracking-normal">* {errors.phone}</span>}
                  </label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="771-995-9593" 
                    className={`w-full h-14 bg-main-bg rounded-xl px-5 focus:outline-none focus:ring-2 ${errors.phone ? 'focus:ring-red-500/20 border-red-500/20' : 'focus:ring-primary/20'} text-main-text border border-gray-200 dark:border-zinc-700 text-xs font-normal transition-all`} 
                  />
               </div>
            </div>

            <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
               <label className="flex justify-between">
                 <span>{t.contact.form.email} *</span>
                 {errors.email && <span className="text-[10px] text-red-500 lowercase font-medium tracking-normal">* {errors.email}</span>}
               </label>
               <input 
                type="email" 
                value={formData.email}
                onChange={(e) => {
                  setFormData({...formData, email: e.target.value});
                  if(errors.email) setErrors(prev => ({...prev, email: ''}));
                }}
                placeholder={t.contact.form.placeholder.email} 
                className={`w-full h-14 bg-main-bg rounded-xl px-5 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500/20 border-red-500/20' : 'focus:ring-primary/20'} text-main-text border border-gray-200 dark:border-zinc-700 text-xs font-normal transition-all`} 
              />
            </div>

            <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
               <label className="flex justify-between">
                 <span>{t.contact.form.subject} *</span>
                 {errors.subject && <span className="text-[10px] text-red-500 lowercase font-medium tracking-normal">* {errors.subject}</span>}
               </label>
               <input 
                type="text" 
                value={formData.subject}
                onChange={(e) => {
                  setFormData({...formData, subject: e.target.value});
                  if(errors.subject) setErrors(prev => ({...prev, subject: ''}));
                }}
                placeholder={t.contact.form.placeholder.subject} 
                className={`w-full h-14 bg-main-bg rounded-xl px-5 focus:outline-none focus:ring-2 ${errors.subject ? 'focus:ring-red-500/20 border-red-500/20' : 'focus:ring-primary/20'} text-main-text border border-gray-200 dark:border-zinc-700 text-xs font-normal transition-all`} 
              />
            </div>

            <div className="space-y-2 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
               <label className="flex justify-between">
                 <span>{t.contact.form.message} *</span>
                 {errors.message && <span className="text-[10px] text-red-500 lowercase font-medium tracking-normal">* {errors.message}</span>}
               </label>
               <textarea 
                rows={4} 
                value={formData.message}
                onChange={(e) => {
                  setFormData({...formData, message: e.target.value});
                  if(errors.message) setErrors(prev => ({...prev, message: ''}));
                }}
                placeholder={t.contact.form.placeholder.message} 
                className={`w-full bg-main-bg rounded-xl p-5 focus:outline-none focus:ring-2 ${errors.message ? 'focus:ring-red-500/20 border-red-500/20' : 'focus:ring-primary/20'} text-main-text resize-none border border-gray-200 dark:border-zinc-700 text-xs font-normal transition-all`}
              />
            </div>

            {/* STEP 6: Interactive Inquiry Live Preview / Summary */}
            <ContactLivePreview
              formData={formData}
              scope={scope}
              whatsappNumber={whatsappNumber}
            />

            {/* Submit Button */}
            <div className="space-y-3 pt-2">
              <button 
                disabled={isSubmitting}
                className={`w-full h-14 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-xl transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer ${
                  isSuccess 
                    ? 'bg-emerald-600 text-white shadow-emerald-200' 
                    : 'bg-primary text-white shadow-primary/20 hover:brightness-110 active:scale-98'
                } disabled:opacity-70`}
              >
                {isSubmitting ? (
                  <>Processing Submission... <Loader2 className="animate-spin" size={16} /></>
                ) : isSuccess ? (
                  <>Brief Sent Successfully! <CheckCircle2 size={16} /></>
                ) : (
                  <>Submit Brief &amp; Connect on WhatsApp <Send size={15} /></>
                )}
              </button>
              
              <AnimatePresence>
                {isSuccess && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-emerald-600 font-bold text-xs"
                  >
                    Thank you! Your project brief has been recorded. WhatsApp is connecting you directly.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 5: Client Assurance & Security Guarantees */}
            <ContactTrustBadges />
          </form>
        </motion.div>
      </div>
    </section>
  );
};
