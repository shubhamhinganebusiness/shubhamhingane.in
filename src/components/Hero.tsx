import React from 'react';
import { Facebook, Linkedin, MessageCircle, Phone, MapPin, Clock, ArrowRight, Activity, X, Sparkles, LogIn, Trophy, Globe, Radio, History, Calculator, Terminal, Code2, Milk, CreditCard, Cpu } from 'lucide-react';
import { TypingText } from './TypingText';
import { useLanguage } from './LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../hooks/useCMS';
import { useNavigate } from 'react-router-dom';
import { LanguageModal } from './LanguageModal';
import { ProjectCostEstimatorModal } from './hero/ProjectCostEstimatorModal';
import { DeveloperTerminalModal } from './hero/DeveloperTerminalModal';
import { HeroMiniAppDock, MiniDockTab } from './hero/HeroMiniAppDock';
import { HeroTrustMarquee } from './hero/HeroTrustMarquee';
import { KineticAuroraCanvas } from './hero/KineticAuroraCanvas';

export const Hero = () => {
  const { t, language, setLanguage } = useLanguage();
  const { settings, loading } = useSiteSettings();
  const navigate = useNavigate();
  const [showIDCardModal, setShowIDCardModal] = React.useState(false);
  const [isLangModalOpen, setIsLangModalOpen] = React.useState(false);
  const [isEstimatorOpen, setIsEstimatorOpen] = React.useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = React.useState(false);
  const [miniDockTab, setMiniDockTab] = React.useState<MiniDockTab>('profile');

  const displayTitle = settings?.heroTitle || t.hero.title;
  const displayName = settings?.heroName || t.hero.name;
  const displayDesc = settings?.heroDesc || t.hero.desc;
  const [imgError, setImgError] = React.useState(false);
  
  // Resolve Hero Image: prioritize actual profile image /shubham_profile.png
  const isCustomImage = settings?.heroImage && 
    typeof settings.heroImage === 'string' && 
    settings.heroImage.trim() !== '' && 
    !settings.heroImage.includes('unsplash.com/photo-1529144411881');
  
  const displayImage = isCustomImage ? settings.heroImage : "/shubham_profile.png";
  const fallbackImage = "/shubham_profile.png";

  // Dynamic Pune Live Clock
  const [puneTime, setPuneTime] = React.useState('');

  React.useEffect(() => {
    setImgError(false);
  }, [displayImage]);

  React.useEffect(() => {
    const updateTime = () => {
      try {
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        setPuneTime(formatter.format(new Date()));
      } catch (err) {
        setPuneTime(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const displaySkills = (settings?.heroSkills && settings.heroSkills.length > 0) ? settings.heroSkills : ['Coding', 'Video Editing', 'Photography'];
  const showBestSkills = settings?.visibility?.bestSkills !== false;

  // Smooth scroll handler
  const handleScrollTo = (id: string, pathFallback: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(pathFallback);
    }
  };

  return (
    <section id="home" className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center py-4 lg:py-6 px-4 md:px-8 max-w-7xl mx-auto select-none">
      {/* Kinetic Ambient Aurora Canvas (Smooth pointer reaction & particles) */}
      <KineticAuroraCanvas />

      {/* Absolute Ambient Grid background decorations */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-20 opacity-70" />
      
      {/* Decorative Technical Grid Dots Pattern */}
      <div className="absolute inset-0 -z-20 opacity-40 select-none pointer-events-none hidden xl:block">
        <div className="absolute top-[12%] left-[6%] font-mono text-[9px] tracking-widest text-gray-400 dark:text-zinc-650 uppercase">+ CREATIVE CODEBASE</div>
        <div className="absolute top-[45%] right-[4%] font-mono text-[9px] tracking-widest text-gray-400 dark:text-zinc-650 uppercase">// ENGINE_READY v4.2</div>
        <div className="absolute bottom-[28%] left-[4%] font-mono text-[9px] tracking-widest text-gray-400 dark:text-zinc-650 uppercase">[ PNE // REGION ]</div>
      </div>
      
      {/* Interactive Ambient Luminous Blobs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.12, 1],
          x: [0, 15, 0],
          y: [0, -10, 0] 
        }}
        transition={{ 
          duration: 9, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute top-1/4 right-[10%] w-[320px] h-[320px] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px] -z-20 pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          x: [0, -20, 0],
          y: [0, 15, 0] 
        }}
        transition={{ 
          duration: 11, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute bottom-10 left-[15%] w-[300px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[90px] -z-20 pointer-events-none"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 items-center w-full relative z-10">
        <motion.div 
          className="order-2 lg:order-1 flex flex-col items-start w-full"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Work Readiness Pulser Badge, Dynamic Live Clock Hub & Hero Language Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 backdrop-blur-md shadow-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Active for Opportunities
                </span>
              </motion.div>

              {puneTime && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-sm text-primary text-[10px] uppercase font-black tracking-wider shadow-xs"
                >
                  <Clock size={11} className="animate-spin duration-[4000ms]" style={{ animationDuration: '6s' }} />
                  <span>Pune Time: {puneTime}</span>
                </motion.div>
              )}
              
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/90 border border-gray-200/70 dark:border-zinc-700/80 text-gray-700 dark:text-zinc-300 text-[10px] uppercase font-bold tracking-wider shadow-xs">
                <MapPin size={11} className="text-primary" />
                <span>Pune, India</span>
              </span>
            </div>

            {/* Language Change Option in Hero Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-1 p-1 bg-white/95 dark:bg-zinc-900/95 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xs backdrop-blur-sm"
              title="Change website language / भाषा निवडा"
            >
              <button
                onClick={() => setIsLangModalOpen(true)}
                className="flex items-center gap-1.5 px-2 py-1 text-gray-700 dark:text-gray-300 hover:text-primary transition-colors cursor-pointer"
                title="Select language"
                aria-label="Open language modal"
              >
                <Globe size={13} className="text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {language === 'mr' ? 'भाषा:' : language === 'hi' ? 'भाषा:' : 'Language:'}
                </span>
              </button>
              <div className="flex items-center gap-1">
                {[
                  { code: 'en', label: 'English', short: 'EN' },
                  { code: 'mr', label: 'मराठी', short: 'मराठी' },
                  { code: 'hi', label: 'हिंदी', short: 'हिंदी' },
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => setLanguage(item.code as any)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                      language === item.code
                        ? 'bg-primary text-white shadow-xs scale-102'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                    title={`Switch to ${item.label}`}
                  >
                    {item.short}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-3xl xl:text-4xl font-black mb-2 leading-tight tracking-tight text-gray-900 dark:text-white">
            {!displayTitle ? (
              <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg mb-2" />
            ) : (
              <>
                {displayTitle} <span className="text-primary italic font-heading relative inline-block">
                  {displayName}
                  <span className="absolute left-0 bottom-1 w-full h-[5px] bg-primary/15 -z-10 rounded-full" />
                </span><br />
              </>
            )}
            <span className="flex flex-wrap items-center gap-x-2 mt-1">
              a <TypingText />
            </span>
          </h1>

          {!displayDesc ? (
            <div className="space-y-2 mb-2 w-full">
              <div className="h-3.5 w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
              <div className="h-3.5 w-5/6 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm lg:text-xs xl:text-sm leading-relaxed max-w-xl mb-2.5 font-medium line-clamp-2 md:line-clamp-3">
              {displayDesc}
            </p>
          )}

          {/* Featured Skills Pills */}
          {showBestSkills && displaySkills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5 select-none">
              {displaySkills.map((skill, index) => (
                <motion.span 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-primary/15 border border-primary/25 text-primary text-[10px] font-extrabold uppercase tracking-wider shadow-xs cursor-default"
                >
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  {skill}
                </motion.span>
              ))}
            </div>
          )}

          {/* Action Buttons Hub with primary visual guides & interactive tools */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3 w-full sm:w-auto">
            <motion.button 
              id="hero-hire-me"
              onClick={() => window.dispatchEvent(new CustomEvent('open-hire-modal'))}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-5 py-2.5 sm:py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/25 hover:brightness-110 transition-all duration-300 flex items-center gap-2 group cursor-pointer w-full sm:w-auto justify-center"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <span className="relative z-10 font-black tracking-wider">{t.nav.hireMe}</span>
              <ArrowRight className="w-3.5 h-3.5 text-white group-hover:translate-x-1 transition-transform relative z-10" />
            </motion.button>

            {/* Gully Score Tournament Manager Login */}
            <motion.button 
              id="hero-gully-score-login"
              onClick={() => navigate('/cricket-login')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-4 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-emerald-600/25 hover:brightness-110 transition-all duration-300 flex items-center gap-2 group cursor-pointer w-full sm:w-auto justify-center border border-emerald-400/40"
              title="Gully Scoreboard & Tournament Manager Login"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <Trophy size={14} className="text-amber-300 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10 font-black">
                {language === 'mr' ? 'गुल्ली स्कोअर लॉगिन' : language === 'hi' ? 'गल्ली स्कोर लॉगिन' : 'Gully Score Login'}
              </span>
              <LogIn size={12} className="text-emerald-100 group-hover:translate-x-0.5 transition-transform relative z-10" />
            </motion.button>

            {/* Dairy ERP Portal Login */}
            <motion.button 
              id="hero-dairy-erp-login"
              onClick={() => navigate('/dairy-login')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-4 py-2.5 sm:py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-sky-700 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-sky-600/25 hover:brightness-110 transition-all duration-300 flex items-center gap-2 group cursor-pointer w-full sm:w-auto justify-center border border-sky-400/40"
              title="Dairy & Agro ERP Platform Login"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <Milk size={14} className="text-sky-200 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10 font-black">
                {language === 'mr' ? 'डेअरी ईआरपी लॉगिन' : language === 'hi' ? 'डेयरी ईआरपी लॉगिन' : 'Dairy ERP Login'}
              </span>
              <LogIn size={12} className="text-sky-100 group-hover:translate-x-0.5 transition-transform relative z-10" />
            </motion.button>

            {/* Instant ID Card Builder Login */}
            <motion.button 
              id="hero-id-card-login"
              onClick={() => navigate('/login', { state: { from: { pathname: '/live/instant-id-builder' } } })}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden px-4 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-md shadow-indigo-600/25 hover:brightness-110 transition-all duration-300 flex items-center gap-2 group cursor-pointer w-full sm:w-auto justify-center border border-indigo-400/40"
              title="Instant ID Card Builder Login"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/25 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              <CreditCard size={14} className="text-purple-200 group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10 font-black">
                {language === 'mr' ? 'आयडी कार्ड लॉगिन' : language === 'hi' ? 'आईडी कार्ड लॉगिन' : 'ID Card Login'}
              </span>
              <LogIn size={12} className="text-indigo-100 group-hover:translate-x-0.5 transition-transform relative z-10" />
            </motion.button>
          </div>

          {/* Social Links and Quick Links Hub */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 lg:gap-6 w-full border-t border-gray-200/60 dark:border-zinc-800/80 pt-3 mt-1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* FIND WITH ME */}
            <div className="flex-1">
              <span className="uppercase tracking-[2px] text-gray-500 dark:text-gray-400 text-[11px] font-black block mb-2">
                {t.hero.findMe}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { Icon: Facebook, key: 'facebook', label: 'Facebook' },
                  { Icon: Linkedin, key: 'linkedin', label: 'LinkedIn' },
                  { Icon: MessageCircle, key: 'whatsapp', label: 'WhatsApp' },
                  { Icon: Phone, key: 'phone', label: 'Call' },
                ].map(({ Icon, key, label }, idx) => {
                  let url = settings?.socials?.[key] || "#";
                  
                  if (key === 'whatsapp') url = `https://wa.me/${settings?.socials?.phone || '7719959593'}`;
                  if (key === 'phone') url = `tel:${settings?.socials?.phone || '7719959593'}`;
                  
                  return (
                    <motion.a 
                      key={idx} 
                      href={url}
                      id={`social-${key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit my ${label} profile`}
                      whileHover={{ y: -3, scale: 1.06 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-white hover:bg-primary transition-all duration-300 border border-gray-100 dark:border-zinc-800 hover:border-primary group"
                    >
                      <Icon size={18} className="group-hover:scale-110 transition-transform" />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* QUICK LINKS */}
            <div className="flex-1">
              <span className="uppercase tracking-[2px] text-gray-500 dark:text-gray-400 text-[11px] font-black block mb-2">
                {language === 'mr' ? 'मागील सामने' : language === 'hi' ? 'पिछले मैच' : 'PAST MATCHES'}
              </span>
              <div className="flex flex-wrap gap-2.5">
                <motion.button 
                  id="hero-quick-access-completed-matches"
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/completed-matches')}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-200 hover:text-primary hover:border-primary/50 dark:hover:border-primary/50 shadow-xs flex items-center justify-center gap-2 font-bold transition-all duration-300 text-xs uppercase tracking-wider cursor-pointer group"
                  title="View All Past Matches & Completed Records"
                >
                  <History size={14} className="text-primary group-hover:rotate-[-45deg] transition-transform" />
                  <span>
                    {language === 'mr' ? 'सर्व मागील सामने पहा' : language === 'hi' ? 'सभी पिछले मैच देखें' : 'View All Past Matches'}
                  </span>
                  <ArrowRight size={13} className="text-gray-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Interactive Media Presentation Column with Mini-App Dock */}
        <motion.div 
          className="order-1 lg:order-2 relative flex flex-col items-center justify-center py-4 lg:py-0 w-full"
          initial={{ opacity: 0, scale: 0.92, rotate: 1 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
        >
          {/* Ambient luminous energy cloud behind dock */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-rose-500/5 to-primary/0 rounded-full blur-[60px] opacity-70 -z-10 animate-float animate-pulse duration-[6000ms]" />
          
          {/* Dynamic Floating Badge 1: Innovation and Experience */}
          <motion.div 
            role="button"
            onClick={() => handleScrollTo('resume', '/resume')}
            whileHover={{ scale: 1.08, zIndex: 30, y: -4 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-3 left-2 md:left-6 lg:-left-2 xl:left-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3.5 py-2 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 rounded-xl shadow-lg border border-gray-200/50 dark:border-zinc-800/85 z-20 flex items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors group"
            title="Click to view detailed Resume and Skill details"
          >
            <span className="text-lg md:text-xl xl:text-2xl font-black text-primary group-hover:scale-110 transition-transform">5+</span>
            <div className="flex flex-col text-left">
              <span className="text-[8px] xl:text-[9px] font-black uppercase text-gray-400 leading-none">Years of</span>
              <span className="text-[9px] xl:text-[10px] font-bold text-gray-800 dark:text-gray-100 leading-tight flex items-center gap-1">
                Innovation <ArrowRight size={9} className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </span>
            </div>
          </motion.div>

          {/* Dynamic Floating Badge 2: Global Deployments */}
          <motion.div 
            role="button"
            onClick={() => handleScrollTo('portfolio', '/projects')}
            whileHover={{ scale: 1.08, zIndex: 30, y: 4 }}
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-2 right-2 md:right-6 lg:-right-2 xl:right-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3.5 py-2 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 rounded-xl shadow-lg border border-gray-200/50 dark:border-zinc-800/85 z-20 flex items-center gap-2 cursor-pointer hover:border-emerald-500/50 transition-colors group"
            title="Click to view successful projects and client works"
          >
            <span className="text-base md:text-lg xl:text-xl font-black text-emerald-500 group-hover:scale-110 transition-transform">50+</span>
            <div className="flex flex-col text-left">
              <span className="text-[8px] xl:text-[9px] font-black uppercase text-gray-400 leading-none">Successful</span>
              <span className="text-[9px] xl:text-[10px] font-bold text-gray-800 dark:text-gray-100 leading-tight flex items-center gap-1">
                Deployments <ArrowRight size={9} className="text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </span>
            </div>
          </motion.div>

          {/* Interactive Mini-App Dock (Profile, GullyScore Live Simulation, Dairy ERP, Instant ID) */}
          <HeroMiniAppDock
            activeTab={miniDockTab}
            onTabChange={setMiniDockTab}
            displayImage={displayImage}
            imgError={imgError}
            fallbackImage={fallbackImage}
            onImgError={() => setImgError(true)}
            onOpenEstimator={() => setIsEstimatorOpen(true)}
            onOpenTerminal={() => setIsTerminalOpen(true)}
          />
        </motion.div>
      </div>

      {/* Step 4: Client Trust & Live Metrics Infinite Marquee */}
      <HeroTrustMarquee />

      {/* Kinetic Mouse Downward Scroll Pointer */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex-col items-center gap-1 cursor-pointer select-none hidden 2xl:flex"
        onClick={() => {
          const targetSection = document.getElementById("about") || document.getElementById("projects") || document.getElementById("features") || document.getElementById("portfolio");
          if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-400 dark:text-zinc-500 hover:text-primary transition-colors">
          Scroll Down
        </span>
        <div className="w-5 h-8 rounded-full border-2 border-gray-300 dark:border-zinc-700/80 p-1 flex justify-center items-start">
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 bg-primary rounded-full" 
          />
        </div>
      </motion.div>

      {/* Step 1 Modal: Project Cost & Timeline Estimator */}
      <ProjectCostEstimatorModal
        isOpen={isEstimatorOpen}
        onClose={() => setIsEstimatorOpen(false)}
        defaultCurrency="INR"
      />

      {/* Step 2 Modal: Developer Terminal & Tech Matrix Sandbox */}
      <DeveloperTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />

      <LanguageModal 
        isOpen={isLangModalOpen} 
        onClose={() => setIsLangModalOpen(false)} 
      />
    </section>
  );
};


