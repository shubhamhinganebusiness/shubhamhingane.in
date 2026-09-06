/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Footer } from './components/Footer';
import { BackToTop } from './components/BackToTop';
import { VisitorTracker } from './components/VisitorTracker';
import { AuthProvider, useAuth } from './components/AuthContext';
import { CMSProvider } from './components/CMSContext';
import { useSiteSettings } from './hooks/useCMS';
import ScrollToTop from './components/ScrollToTop';

// Lazy load non-critical components
const FeatureSection = lazy(() => import('./components/FeatureSection').then(m => ({ default: m.FeatureSection })));
const AIChatSection = lazy(() => import('./components/AIChatSection').then(m => ({ default: m.AIChatSection })));
const Courses = lazy(() => import('./components/Courses').then(m => ({ default: m.Courses })));
const Portfolio = lazy(() => import('./components/Portfolio'));
const NewsLaunchpad = lazy(() => import('./components/NewsLaunchpad').then(m => ({ default: m.NewsLaunchpad })));
const Resume = lazy(() => import('./components/Resume').then(m => ({ default: m.Resume })));
const TestimonialsSection = lazy(() => import('./components/TestimonialsSection').then(m => ({ default: m.Testimonials })));
const LogoCloudSection = lazy(() => import('./components/LogoCloudSection'));
const Blog = lazy(() => import('./components/Blog').then(m => ({ default: m.Blog })));
const Contact = lazy(() => import('./components/Contact').then(m => ({ default: m.Contact })));


// Lazy load pages
const BlogDetail = lazy(() => import('./pages/BlogDetail').then(m => ({ default: m.BlogDetail })));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail').then(m => ({ default: m.ServiceDetail })));
const CourseDetail = lazy(() => import('./pages/CourseDetail').then(m => ({ default: m.CourseDetail })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const Projects = lazy(() => import('./pages/Projects'));
const DairyDashboard = lazy(() => import('./components/dairy/DairyDashboard').then(m => ({ default: m.DairyDashboard })));
const DairyLogin = lazy(() => import('./components/dairy/DairyLogin').then(m => ({ default: m.DairyLogin })));
const DairyDemo = lazy(() => import('./components/dairy/DairyDemo').then(m => ({ default: m.DairyDemo })));
const AgroDashboard = lazy(() => import('./components/agro/AgroDashboard').then(m => ({ default: m.AgroDashboard })));
const AgroLogin = lazy(() => import('./components/agro/AgroLogin').then(m => ({ default: m.AgroLogin })));
const AgroLanding = lazy(() => import('./components/agro/AgroLanding').then(m => ({ default: m.AgroLanding })));
const MedLanding = lazy(() => import('./components/med/MedLanding').then(m => ({ default: m.MedLanding })));
const MedNews = lazy(() => import('./components/med/MedNews').then(m => ({ default: m.MedNews })));
const MedDoctorDashboard = lazy(() => import('./components/med/MedDoctorDashboard').then(m => ({ default: m.MedDoctorDashboard })));
const MedPharmacyDashboard = lazy(() => import('./components/med/MedPharmacyDashboard').then(m => ({ default: m.MedPharmacyDashboard })));
const MedLogin = lazy(() => import('./components/med/MedLogin').then(m => ({ default: m.MedLogin })));
const MessLanding = lazy(() => import('./components/mess/MessLanding').then(m => ({ default: m.MessLanding })));
const MessLogin = lazy(() => import('./components/mess/MessLogin').then(m => ({ default: m.MessLogin })));
const MessOwnerDashboard = lazy(() => import('./components/mess/MessOwnerDashboard').then(m => ({ default: m.MessOwnerDashboard })));
const FurnitureDashboard = lazy(() => import('./components/furniture/FurnitureDashboard').then(m => ({ default: m.FurnitureDashboard })));
const FurnitureLogin = lazy(() => import('./components/furniture/FurnitureLogin').then(m => ({ default: m.FurnitureLogin })));
const PortfolioAdmin = lazy(() => import('./components/agro/PortfolioAdmin').then(m => ({ default: m.PortfolioAdmin })));
const Login = lazy(() => import('./components/Login').then(m => ({ default: m.Login })));
const SuperAdmin = lazy(() => import('./components/SuperAdmin').then(m => ({ default: m.SuperAdmin })));
const SchoolERPApp = lazy(() => import('./components/school-erp/SchoolERPApp').then(m => ({ default: m.SchoolERPApp })));
const CricketScoreboard = lazy(() => import('./components/cricket/CricketScoreboard').then(m => ({ default: m.CricketScoreboard })));
const SpectatorScoreboardSection = lazy(() => import('./components/cricket/SpectatorScoreboardSection').then(m => ({ default: m.SpectatorScoreboardSection })));
const LiveMatchGlobalBanner = lazy(() => import('./components/cricket/SpectatorScoreboardSection').then(m => ({ default: m.LiveMatchGlobalBanner })));
const CricketAuction = lazy(() => import('./components/cricket/CricketAuction').then(m => ({ default: m.CricketAuction })));
const CricketOverlay = lazy(() => import('./components/cricket/CricketOverlay').then(m => ({ default: m.CricketOverlay })));
const GullyScoreLogin = lazy(() => import('./components/cricket/GullyScoreLogin').then(m => ({ default: m.GullyScoreLogin })));
const VideoRecorderApp = lazy(() => import('./components/video-recorder/VideoRecorderApp').then(m => ({ default: m.VideoRecorderApp })));
const IDCardGenerator = lazy(() => import('./pages/IDCardGenerator').then(m => ({ default: m.IDCardGenerator })));
const InstantIDCardBuilderPage = lazy(() => import('./pages/InstantIDCardBuilderPage').then(m => ({ default: m.InstantIDCardBuilderPage })));
const SelectTemplatePage = lazy(() => import('./pages/SelectTemplatePage').then(m => ({ default: m.SelectTemplatePage })));
const PhotographyPortfolio = lazy(() => import('./components/photography/PhotographyPortfolio').then(m => ({ default: m.PhotographyPortfolio })));
const ElectionCommandCenter = lazy(() => import('./components/election/ElectionCommandCenter').then(m => ({ default: m.ElectionCommandCenter })));
const GanpatiMandalApp = lazy(() => import('./components/ganpati/GanpatiMandalApp').then(m => ({ default: m.GanpatiMandalApp })));
const CricketDigitalToss = lazy(() => import('./components/cricket/CricketDigitalToss').then(m => ({ default: m.CricketDigitalToss })));

const hideOnRoutes = [
  '/live/cricket-toss',
  '/cricket-toss',
  '/live/ganpati-mandal',
  '/ganpati-mandal',
  '/live/election-command-center',
  '/dairy-login',
  '/live/dairy-management',
  '/live/dairy-demo',
  '/agro-login',
  '/agro-dashboard',
  '/agro-demo',
  '/med-demo',
  '/med-login',
  '/med-doctor',
  '/med-pharmacy',
  '/med-get-started',
  '/mess-login',
  '/mess-dashboard',
  '/mess-demo',
  '/furniture-dashboard',
  '/furniture-login',
  '/live/school-erp',
  '/live/cricket-scoreboard',
  '/live/cricket-details',
  '/live/cricket-auction',
  '/live/cricket-overlay',
  '/cricket-login',
  '/live/cricket-login',
  '/live/video-streamer-recorder',
  '/live/id-card-generator',
  '/live/instant-id-builder',
  '/live/select-template',
  '/live/photography-portfolio'
];

const isNavbarRoute = (pathname: string) => {
  return !hideOnRoutes.some(route => pathname.startsWith(route));
};

const ConditionalNavbar = () => {
  const location = useLocation();
  if (!isNavbarRoute(location.pathname)) return null;
  return <Navbar />;
};

const ConditionalFooter = () => {
  const location = useLocation();
  if (!isNavbarRoute(location.pathname)) return null;
  return <Footer />;
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-20">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
      <p className="font-bold text-gray-500 uppercase tracking-widest text-xs">Authenticating Session...</p>
    </div>
  );

  if (!user) {
    // Save the intended destination and redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-20 bg-gray-50">
        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl text-center max-w-md border border-gray-100">
          <h2 className="text-2xl font-black text-gray-900 mb-4">Access Restricted</h2>
          <p className="text-gray-500 font-medium mb-8">Your account does not have administrative privileges required for this section.</p>
          <button 
            onClick={() => window.location.hash = '#/'}
            className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const SectionSkeleton = ({ height = "400px" }: { height?: string }) => (
  <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 animate-pulse" style={{ minHeight: height }}>
    <div className="h-4 w-36 bg-gray-200 dark:bg-zinc-800 rounded-full mb-4 opacity-75" />
    <div className="h-8 w-80 bg-gray-300 dark:bg-zinc-700 rounded-xl mb-12" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="h-52 bg-gray-200 dark:bg-zinc-800/80 rounded-[1.5rem]" />
      <div className="h-52 bg-gray-200 dark:bg-zinc-800/80 rounded-[1.5rem]" />
      <div className="h-52 bg-gray-200 dark:bg-zinc-800/80 rounded-[1.5rem]" />
    </div>
  </div>
);

const HomePage = () => {
  const { settings, loading } = useSiteSettings();
  
  const isVisible = (section: string) => {
    // If settings are loading, render sections by default using fallback translations
    // to prevent blank flash or large layout shifts on clean load
    if (loading) return true;
    if (!settings || !settings.visibility) return true;
    return settings.visibility[section] !== false;
  };

  return (
    <>
      <Hero />
      

      
      <Suspense fallback={null}>
        <SpectatorScoreboardSection homepageMode={true} />
      </Suspense>

      {isVisible('features') && (
        <Suspense fallback={<SectionSkeleton height="320px" />}>
          <FeatureSection />
        </Suspense>
      )}

      {isVisible('courses') && (
        <Suspense fallback={<SectionSkeleton height="380px" />}>
          <Courses />
        </Suspense>
      )}

      {isVisible('portfolio') && (
        <Suspense fallback={<SectionSkeleton height="450px" />}>
          <Portfolio />
        </Suspense>
      )}

      {isVisible('newsLaunchpad') && (
        <Suspense fallback={null}>
          <NewsLaunchpad />
        </Suspense>
      )}

      {isVisible('resume') && (
        <Suspense fallback={<SectionSkeleton height="400px" />}>
          <Resume />
        </Suspense>
      )}

      {isVisible('testimonial') && (
        <Suspense fallback={null}>
          <TestimonialsSection />
        </Suspense>
      )}

      {isVisible('clients') && (
        <Suspense fallback={null}>
          <LogoCloudSection />
        </Suspense>
      )}

      {isVisible('blog') && (
        <Suspense fallback={<SectionSkeleton height="320px" />}>
          <Blog />
        </Suspense>
      )}

      <Suspense fallback={<SectionSkeleton height="350px" />}>
        <Contact />
      </Suspense>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CMSProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col">
            <Suspense fallback={null}>
              <LiveMatchGlobalBanner />
            </Suspense>
            <ConditionalNavbar />
            <AppContent />
            <ConditionalFooter />
            
            <VisitorTracker />
            <BackToTop />
          </div>
        </Router>
      </CMSProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const [isAIChatOpen, setIsAIChatOpen] = React.useState(false);
  const location = useLocation();
  const showNav = !hideOnRoutes.some(route => location.pathname.startsWith(route));
  const isHomepage = location.pathname === '/';
  
  return (
    <div className={`flex-1 ${showNav ? 'pt-20' : ''}`}>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dairy-login" element={<DairyLogin />} />
          <Route path="/live/dairy-demo" element={<DairyDemo />} />
          <Route path="/agro-login" element={<AgroLogin />} />
          <Route path="/agro-demo" element={<AgroLanding />} />
          <Route path="/med-login" element={<MedLogin />} />
          <Route path="/med-demo" element={<MedLanding />} />
          <Route path="/med-get-started" element={<MedNews />} />
          <Route path="/med-doctor" element={<MedDoctorDashboard />} />
          <Route path="/med-pharmacy" element={<MedPharmacyDashboard />} />
          <Route path="/mess-demo" element={<MessLanding />} />
          <Route path="/mess-login" element={<MessLogin />} />
          <Route path="/furniture-login" element={<FurnitureLogin />} />
          <Route 
            path="/mess-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'mess_owner']}>
                <MessOwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/furniture-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'furniture_admin']}>
                <FurnitureDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/live/school-erp" element={<SchoolERPApp />} />
          <Route path="/live/cricket-scoreboard" element={<CricketScoreboard />} />
          <Route path="/live/cricket-toss" element={<CricketDigitalToss />} />
          <Route path="/cricket-toss" element={<CricketDigitalToss />} />
          <Route path="/live/cricket-details" element={<SpectatorScoreboardSection />} />
          <Route path="/live/cricket-auction" element={<CricketAuction />} />
          <Route path="/live/cricket-overlay" element={<CricketOverlay />} />
          <Route path="/cricket-login" element={<GullyScoreLogin />} />
          <Route path="/live/cricket-login" element={<GullyScoreLogin />} />
          <Route path="/live/video-streamer-recorder" element={<VideoRecorderApp />} />
          <Route path="/live/id-card-generator" element={<IDCardGenerator />} />
          <Route path="/live/instant-id-builder" element={<InstantIDCardBuilderPage />} />
          <Route path="/live/select-template" element={<SelectTemplatePage />} />
          <Route path="/live/photography-portfolio" element={<PhotographyPortfolio />} />
          <Route path="/live/election-command-center" element={<ElectionCommandCenter />} />
          <Route path="/live/ganpati-mandal" element={<GanpatiMandalApp />} />
          <Route path="/ganpati-mandal" element={<GanpatiMandalApp />} />
          <Route path="/agro-dashboard" element={<AgroDashboard />} />
          <Route path="/portfolio-admin" element={<PortfolioAdmin />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route 
            path="/live/dairy-management" 
            element={
              <ProtectedRoute allowedRoles={['super_admin', 'dairy_admin']}>
                <DairyDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/super-admin" 
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdmin />
              </ProtectedRoute>
            } 
          />
          {/* Catch-all fallback route to redirect unmatched paths to the home route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Floating Chatbot button & window - Show ONLY on Homepage */}
      {isHomepage && (
        <>
          <AnimatePresence>
            {!isAIChatOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAIChatOpen(true)}
                className="fixed bottom-8 right-8 z-[70] w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-primary/40 transition-all duration-300 group overflow-hidden"
                aria-label="Open AI Assistant"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center">
                   <Sparkles size={24} className="mb-0.5 group-hover:animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-tighter">AI CHAT</span>
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isAIChatOpen && (
              <div className="fixed inset-0 z-[100] flex items-end justify-end pointer-events-none p-4 md:p-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 50, x: 20 }}
                  className="w-full max-w-2xl h-[80vh] md:h-[700px] pointer-events-auto shadow-2xl rounded-[40px] overflow-hidden"
                >
                  <Suspense fallback={<LoadingSpinner />}>
                    <AIChatSection onClose={() => setIsAIChatOpen(false)} isFloating={true} />
                  </Suspense>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
