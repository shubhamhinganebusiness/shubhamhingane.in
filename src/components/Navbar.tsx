import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { HireMeModal } from './HireMeModal';
import { useAuth } from './AuthContext';
import { useSiteSettings } from '../hooks/useCMS';
import { isMatchDeleted, markMatchDeleted } from './cricket/cricketStorage';

export const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHireModalOpen, setIsHireModalOpen] = React.useState(false);
  const { t } = useLanguage();
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const { settings, loading } = useSiteSettings();
  const [liveMatch, setLiveMatch] = React.useState<any>(null);

  React.useEffect(() => {
    let unsub: (() => void) | undefined;
    import('../lib/firebase').then(({ db }) => {
      import('firebase/firestore').then(({ collection, onSnapshot, query, where }) => {
        const q = query(
          collection(db, 'cricket_matches'),
          where('status', '==', 'live')
        );
        unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const validMatches = snap.docs
              .map(d => ({ ...d.data(), id: d.id } as any))
              .filter(m => {
                if (!m || m.status !== 'live') return false;
                if (m.status === 'deleted' || (m as any).isDeleted === true || isMatchDeleted(m.id)) {
                  markMatchDeleted(m.id);
                  return false;
                }
                if (m.isHidden || m.isBlocked) return false;
                if (!m.teamA?.trim() || !m.teamB?.trim()) return false;
                // Only consider matches active within the last 24 hours
                const lastActivity = m.updatedAt || (m.date ? new Date(m.date).getTime() : 0) || 0;
                if (lastActivity && Date.now() - lastActivity > 24 * 60 * 60 * 1000) {
                  return false;
                }
                return true;
              });

            if (validMatches.length > 0) {
              validMatches.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
              setLiveMatch(validMatches[0]);
            } else {
              setLiveMatch(null);
            }
          } else {
            setLiveMatch(null);
          }
        }, () => {
          setLiveMatch(null);
        });
      });
    });

    // Also listen to local sync events to immediately clear notification if match is deleted or concluded
    const handleMatchEvent = (e: any) => {
      const match = e?.detail?.match;
      const eventType = e?.detail?.eventType;
      if (eventType === 'delete' || (match && (match.status !== 'live' || isMatchDeleted(match.id)))) {
        setLiveMatch((prev: any) => (prev && match && prev.id === match.id ? null : prev));
      } else if (match && match.status === 'live' && !isMatchDeleted(match.id)) {
        if (match.teamA?.trim() && match.teamB?.trim()) {
          setLiveMatch(match);
        }
      }
    };
    const handleMatchDeleted = (e: any) => {
      const id = e?.detail?.id;
      if (id) {
        setLiveMatch((prev: any) => (prev && prev.id === id ? null : prev));
      }
    };
    window.addEventListener('cricket_match_updated', handleMatchEvent);
    window.addEventListener('cricket_match_deleted', handleMatchDeleted);

    return () => {
      if (unsub) unsub();
      window.removeEventListener('cricket_match_updated', handleMatchEvent);
      window.removeEventListener('cricket_match_deleted', handleMatchDeleted);
    };
  }, []);

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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f4f5f6]/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex-shrink-0 flex items-center gap-4 group" aria-label="Go to homepage">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary group-hover:scale-110 transition-transform bg-white relative">
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
              <span className="text-xl font-bold tracking-wider group-hover:text-primary transition-colors">SHUBHAM</span>
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
                        className="text-gray-600 hover:text-primary transition-colors duration-300 font-medium uppercase text-xs tracking-widest"
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
                        className="text-gray-600 hover:text-primary transition-colors duration-300 font-medium uppercase text-xs tracking-widest"
                      >
                        {link.name}
                      </Link>
                    )
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {liveMatch && (
                    <Link
                      to={`/live/cricket-details?matchId=${liveMatch.id}`}
                      className="flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full text-xs font-black uppercase tracking-wider shadow-md shadow-rose-500/25 transition-all animate-pulse no-underline"
                      title="Live cricket match in progress - Click to view real-time scoreboard"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                      <span className="hidden xl:inline">{liveMatch.teamA || 'Team A'} vs {liveMatch.teamB || 'Team B'}</span>
                      <span className="xl:hidden">LIVE MATCH</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="md:hidden flex items-center gap-3">
              {liveMatch && (
                <Link
                  to={`/live/cricket-details?matchId=${liveMatch.id}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm animate-pulse no-underline"
                  title="Live match in progress"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                  <span>LIVE</span>
                </Link>
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-600 hover:text-primary transition-colors focus:outline-none p-1.5 cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {isOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white shadow-xl animate-in fade-in slide-in-from-top-4">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {liveMatch && (
                <Link
                  to={`/live/cricket-details?matchId=${liveMatch.id}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl mb-3 shadow-md animate-pulse justify-center no-underline"
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  <span>LIVE MATCH: {liveMatch.teamA || 'Team A'} vs {liveMatch.teamB || 'Team B'}</span>
                </Link>
              )}
              {navLinks.map((link) => (
                link.href.startsWith('/#') ? (
                  <a
                    key={link.name}
                    href={link.href}
                    className="block px-3 py-4 text-base font-medium text-gray-700 hover:text-primary border-b border-gray-100"
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
                    className="block px-3 py-4 text-base font-medium text-gray-700 hover:text-primary border-b border-gray-100"
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
