import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { HireMeModal } from './HireMeModal';
import { useAuth } from './AuthContext';
import { useSiteSettings } from '../hooks/useCMS';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = React.useState(false);
  const { t } = useLanguage();
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const { settings, loading } = useSiteSettings();

  React.useEffect(() => {
    const handleOpenHireModal = () => setIsHireModalOpen(true);
    window.addEventListener('open-hire-modal', handleOpenHireModal);
    return () => window.removeEventListener('open-hire-modal', handleOpenHireModal);
  }, []);

  const displayLogo = (settings?.siteLogo && settings.siteLogo.trim() !== "" && !settings.siteLogo.includes('portfolio_logo_1779417445010')) 
    ? settings.siteLogo 
    : "/shubham_profile.png";

  const navLinks = [
    { name: t.nav.home, href: '/#' },
    { name: t.nav.features, href: '/#features' },
    { name: t.nav.resume, href: '/#resume' },
    { name: t.nav.projects, href: '/projects' },
    { name: t.nav.courses, href: '/#courses' },
    { name: t.nav.blog, href: '/#blog' },
    { name: t.nav.contact, href: '/#contact' },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (location.pathname === '/' && href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id || 'home');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else if (href === '/#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 w-full max-w-[100vw] z-50 bg-[#f4f5f6]/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 sm:gap-4 group min-w-0" aria-label="Go to homepage">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-primary group-hover:scale-105 transition-transform bg-white relative shrink-0">
                {loading && !settings ? (
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
                ) : (
                  <img 
                    src={displayLogo || "/shubham_profile.png"} 
                    alt="Portfolio Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = "/shubham_profile.png";
                    }}
                  />
                )}
              </div>
              <span className="text-lg sm:text-xl font-black tracking-wider text-gray-900 dark:text-white group-hover:text-primary transition-colors truncate">
                SHUBHAM
              </span>
            </Link>

            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <div className="flex items-baseline space-x-6">
                  {navLinks.map((link) => (
                    link.href.startsWith('/#') ? (
                      <a
                        key={link.name}
                        href={link.href}
                        onClick={(e) => {
                          if (location.pathname === '/' && link.href.startsWith('/#')) {
                            e.preventDefault();
                            handleNavClick(link.href);
                          }
                        }}
                        title={`Go to ${link.name} section`}
                        className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors duration-300 font-bold uppercase text-xs tracking-widest"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        key={link.name}
                        to={link.href}
                        title={`Go to ${link.name} page`}
                        onMouseEnter={() => {
                          if (link.href === '/projects') import('../pages/Projects').catch(() => {});
                        }}
                        onTouchStart={() => {
                          if (link.href === '/projects') import('../pages/Projects').catch(() => {});
                        }}
                        className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors duration-300 font-bold uppercase text-xs tracking-widest"
                      >
                        {link.name}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 dark:text-gray-200 hover:text-primary transition-colors focus:outline-none p-2 rounded-xl bg-white/80 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white dark:bg-zinc-950 shadow-xl border-t border-gray-100 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
            <div className="px-3 pt-2 pb-4 grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                link.href.startsWith('/#') ? (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-center rounded-xl bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-200 hover:text-primary border border-gray-200/60 dark:border-zinc-800"
                    onClick={(e) => {
                      handleNavClick(link.href);
                      if (location.pathname === '/' && link.href.startsWith('/#')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-3 py-3 text-xs font-extrabold uppercase tracking-wider text-center rounded-xl bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-200 hover:text-primary border border-gray-200/60 dark:border-zinc-800"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
            </div>
          </div>
        )}
      </nav>

      <HireMeModal 
        isOpen={isHireModalOpen} 
        onClose={() => setIsHireModalOpen(false)} 
      />
    </>
  );
};
