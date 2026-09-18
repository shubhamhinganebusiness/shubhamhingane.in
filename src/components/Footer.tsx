import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';
import { useAuth } from './AuthContext';
import { 
  Linkedin, LayoutDashboard, MessageCircle, Phone, Github, Mail,
  ChevronUp, Download, ShieldCheck, Lock, FileText, ExternalLink,
  MapPin, Clock, Zap, Check, Copy, Code2, Layers
} from 'lucide-react';
import { FooterNewsletter } from './footer/FooterNewsletter';
import { ResumeModal } from './ResumeModal';
import { LegalComplianceModal } from './LegalComplianceModal';

export const Footer = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const { user, logout } = useAuth();

  const [resumeOpen, setResumeOpen] = useState(false);
  const [activeLegalDoc, setActiveLegalDoc] = useState<'privacy' | 'terms' | 'nda' | null>(null);

  const heroName = settings?.heroName || t.hero.name || "SHUBHAM HINGANE";
  const whatsappNumber = settings?.contactWhatsapp || "7719959593";
  const contactEmail = settings?.contactEmail || "shubhamhingane7719@gmail.com";
  const contactPhone = settings?.contactPhone || "+91 77199 59593";

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const navLinks = [
    { name: 'Home & Intro', href: '/#' },
    { name: 'About & Story', href: '/#about' },
    { name: 'Core Capabilities', href: '/#features' },
    { name: 'Engineering Resume', href: '/#resume' },
    { name: 'Featured Projects', href: '/projects' },
    { name: 'Tech Courses', href: '/#courses' },
    { name: 'Client Testimonials', href: '/#testimonials' },
    { name: 'Contact & Hire', href: '/#contact' }
  ];

  const specializedSolutions = [
    { name: 'News Media Agency Portal', href: '/#news-launchpad' },
    { name: 'Ganpati Mandal ERP & Pavati Desk', href: '/#ganpati-demo' },
    { name: 'Mess & Hostel Automation Engine', href: '/mess-landing' },
    { name: 'Dairy & Milk Supply Chain System', href: '/dairy-landing' },
    { name: 'Agro Retail POS & Billing Desk', href: '/agro-landing' },
    { name: 'Live Cricket Scoreboard & Overlay', href: '/cricket-scoreboard' }
  ];

  const socialLinks = [
    { Icon: Github, key: 'github', label: 'GitHub', defaultUrl: 'https://github.com/shubhamhingane' },
    { Icon: Linkedin, key: 'linkedin', label: 'LinkedIn', defaultUrl: 'https://linkedin.com/in/shubham-hingane' },
    { Icon: MessageCircle, key: 'whatsapp', label: 'WhatsApp', defaultUrl: `https://wa.me/${whatsappNumber}` },
    { Icon: Mail, key: 'email', label: 'Email', defaultUrl: `mailto:${contactEmail}` }
  ];

  return (
    <>
      <footer className="pt-20 pb-12 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto border-t border-gray-200 dark:border-zinc-800 text-left relative">
        
        {/* Top Floating / Docked Return to Top Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-12 mb-12 border-b border-gray-150 dark:border-zinc-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Systems Operational • Available for High-Impact Projects &amp; Remote Contracts
            </span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900 hover:bg-primary hover:text-white border border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2 shadow-sm transition-all duration-300 cursor-pointer group"
            title="Scroll to Top"
          >
            <span>Back to Top</span>
            <ChevronUp size={15} className="group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>

        {/* Multi-Column Organized Architecture (4-Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* Column 1: Identity, Avatar & Quick Resume Button (Span 4) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/40 card-shadow shrink-0">
                <img 
                  src={(settings?.heroImage && !settings.heroImage.includes('unsplash.com/photo-1529144411881')) ? settings.heroImage : "/shubham_profile.png"} 
                  alt="Shubham Hingane portrait" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = "/shubham_profile.png";
                  }}
                />
              </div>

              <div>
                <h3 className="text-xl font-black text-main-text tracking-tight uppercase font-heading">
                  {heroName}
                </h3>
                <p className="text-xs font-bold text-primary">
                  Senior Full-Stack &amp; Systems Architect
                </p>
                <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={11} className="text-primary" />
                  <span>Pune, Maharashtra, India (Remote Worldwide)</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
              Crafting scalable web systems, regional digital media infrastructure, high-throughput financial portals &amp; custom enterprise management engines.
            </p>

            {/* Quick Resume Download / View Button */}
            <div className="pt-1 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setResumeOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-primary/20 hover:brightness-110 active:scale-98 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>View / Download Resume</span>
              </button>

              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Direct WhatsApp"
              >
                <MessageCircle size={14} />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Social Grid */}
            <div className="flex items-center gap-2 pt-2">
              {socialLinks.map(({ Icon, key, label, defaultUrl }) => {
                let url = defaultUrl;
                if (settings?.socials?.[key]) url = settings.socials[key];

                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl bg-surface border border-gray-200 dark:border-zinc-800 text-gray-500 hover:text-white hover:bg-primary flex items-center justify-center transition-all shadow-sm cursor-pointer"
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Column 2: Navigation & Sections (Span 2) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-main-text flex items-center gap-1.5">
              <Layers size={14} className="text-primary" />
              <span>Navigation</span>
            </h4>
            <ul className="space-y-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {navLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    className="hover:text-primary transition-colors block py-0.5"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Specialized Software Solutions (Span 3) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-main-text flex items-center gap-1.5">
              <Code2 size={14} className="text-primary" />
              <span>Specialized Solutions</span>
            </h4>
            <ul className="space-y-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {specializedSolutions.map((item, idx) => (
                <li key={idx}>
                  <a
                    href={item.href}
                    className="hover:text-primary transition-colors block py-0.5 flex items-center justify-between group"
                  >
                    <span>{item.name}</span>
                    <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter & Tech Insights (Span 3) */}
          <div className="lg:col-span-3">
            <FooterNewsletter />
          </div>

        </div>

        {/* Bottom Bar: Copyright, Legal Micro-Links & Admin Portal */}
        <div className="pt-8 border-t border-gray-150 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-gray-400 dark:text-zinc-500 font-medium">
          
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Shubham Hingane. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span>Engineered with React, TypeScript &amp; Firebase</span>
          </div>

          {/* Legal Compliance Micro-Links */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveLegalDoc('privacy')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('terms')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveLegalDoc('nda')}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              NDA &amp; Security
            </button>
          </div>

          {/* Admin Login / Dashboard */}
          <div>
            {user ? (
              <div className="flex items-center gap-2">
                <Link 
                  to="/super-admin" 
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm hover:brightness-110"
                >
                  <LayoutDashboard size={12} />
                  Dashboard
                </Link>
                <button 
                  onClick={() => logout()}
                  className="px-3 py-1.5 bg-surface border border-gray-200 dark:border-zinc-800 text-gray-400 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:text-red-500 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-primary hover:text-white text-gray-500 dark:text-gray-300 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all"
              >
                <Lock size={11} />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

        </div>

      </footer>

      {/* Resume Modal */}
      <ResumeModal 
        isOpen={resumeOpen} 
        onClose={() => setResumeOpen(false)} 
      />

      {/* Legal & Compliance Modal */}
      <LegalComplianceModal
        isOpen={activeLegalDoc !== null}
        activeDoc={activeLegalDoc}
        onClose={() => setActiveLegalDoc(null)}
      />
    </>
  );
};
