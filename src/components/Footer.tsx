import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';
import { useAuth } from './AuthContext';
import { Linkedin, LayoutDashboard, MessageCircle, Phone, Github, Mail } from 'lucide-react';

export const Footer = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const { user, logout } = useAuth();

  const rights = settings?.footerRights || "+91 77199 59593 | Pune, India";

  const footerLinks = [
    { name: 'Home', href: '/#' },
    { name: 'About', href: '/#about' },
    { name: 'Services', href: '/#features' },
    { name: 'Resume', href: '/#resume' },
    { name: 'Projects', href: '/projects' },
    { name: 'Courses', href: '/#courses' },
    { name: 'Contact', href: '/#contact' }
  ];

  return (
    <footer className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-gray-150 dark:border-zinc-800 text-center">
      <div className="flex flex-col items-center gap-10">
        
        {/* Rounded Profile Avatar */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary card-shadow hover:scale-105 transition-transform duration-300">
          <img 
            src={(settings?.heroImage && !settings.heroImage.includes('unsplash.com/photo-1529144411881')) ? settings.heroImage : "/shubham_profile.png"} 
            alt="Shubham Hingane professional photo portrait" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = "/shubham_profile.png";
            }}
          />
        </div>

        <div className="w-full max-w-3xl">
          {/* Main Display Name */}
          <h3 className="text-3xl font-black tracking-widest uppercase mb-3 text-primary font-heading">
            {settings?.heroName || t.hero.name || "SHUBHAM HINGANE"}
          </h3>
          
          <p className="text-gray-400 dark:text-zinc-500 text-sm font-semibold mb-8">
            {rights}
          </p>
          
          {/* Secondary Navigation Menu */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 mb-10 text-sm font-bold text-gray-500 dark:text-zinc-400">
            {footerLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={link.href} 
                className="hover:text-primary transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>
          
          {/* Connected Social Grid with prominent fallbacks */}
          <div className="flex justify-center gap-6 mb-10">
            {[
              { Icon: Github, key: 'github', label: 'GitHub', defaultUrl: 'https://github.com/shubhamhingane' },
              { Icon: Linkedin, key: 'linkedin', label: 'LinkedIn', defaultUrl: 'https://linkedin.com/in/shubham-hingane' },
              { Icon: MessageCircle, key: 'whatsapp', label: 'WhatsApp', defaultUrl: 'https://wa.me/917719959593' },
              { Icon: Mail, key: 'email', label: 'Mail', defaultUrl: 'mailto:shubhamhingane7719@gmail.com' }
            ].map(({ Icon, key, label, defaultUrl }) => {
              let url = "#";
              if (key === 'whatsapp') {
                url = `https://wa.me/${settings?.socials?.phone || '7719959593'}`;
              } else if (key === 'email') {
                url = `mailto:${settings?.contactEmail || 'shubhamhingane7719@gmail.com'}`;
              } else {
                url = settings?.socials?.[key] || defaultUrl;
              }

              return (
                <a 
                  key={key} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary hover:border-transparent transition-all duration-300 scale-100 hover:scale-115 card-shadow"
                  aria-label={label}
                >
                  <Icon size={18} />
                </a>
              );
            })}
          </div>

          {/* Elegant formal copyright block */}
          <div className="pt-8 border-t border-gray-100 dark:border-zinc-800/80 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold tracking-wide">
              &copy; {new Date().getFullYear()} Shubham Hingane. All rights reserved. Designed &amp; Engineered with precision in Pune, MH.
            </p>

            {user ? (
               <div className="flex items-center gap-4">
                 <Link 
                  to="/super-admin" 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-[1.5px] transition-all shadow-md shadow-primary/20 hover:scale-103"
                >
                  <LayoutDashboard size={13} />
                  Dashboard
                </Link>
                <button 
                  onClick={() => logout()}
                  className="px-5 py-2.5 bg-surface border border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 rounded-xl font-bold text-[10px] uppercase tracking-[1.5px] hover:text-red-500 transition-all"
                >
                  Sign Out
                </button>
               </div>
            ) : (
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white shadow-md shadow-primary/20 rounded-xl font-black text-[9px] uppercase tracking-[1.5px] transition-all hover:brightness-110"
              >
                Portfolio Admin Login
              </Link>
            )}
          </div>

        </div>
      </div>
    </footer>
  );
};
