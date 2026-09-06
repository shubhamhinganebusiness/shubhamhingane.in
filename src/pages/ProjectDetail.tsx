import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ExternalLink, Shield, CheckCircle, Tag, Cpu, Clock, Layers, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';
import { translations } from '../translations';
import { useCMSCollection } from '../hooks/useCMS';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../components/AuthContext';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = translations[language];
  const { items: dbProjects } = useCMSCollection('projects');
  const { isScoreManager } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const defaultProjects = t.portfolio.projects;
  const projects = dbProjects.length > 0 ? dbProjects : defaultProjects;

  // Retrieve project detail or apply custom values
  const rawProject = projects.find((p: any) => p.id === id);

  if (!rawProject) {
    return (
      <div className="min-h-screen bg-main-bg flex flex-col justify-between">
        <Navbar />
        <div className="container mx-auto px-6 py-40 text-center flex-1 flex flex-col items-center justify-center">
          <Layers className="text-gray-350 mb-6 animate-pulse" size={64} />
          <h2 className="text-3xl font-black text-main-text mb-4">Project Not Found</h2>
          <p className="text-gray-500 mb-8 max-w-md">The project you are looking for does not exist or may have been updated.</p>
          <Link
            to="/projects"
            className="px-6 py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-90 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Projects
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Enrich project with system parameters
  const getEnrichedProject = (p: any) => {
    if (p.id === 'dairy-management') {
      return { 
        ...p, 
        isPaidSystem: true,
        loginUrl: '/dairy-login',
        demoUrl: '/live/dairy-demo',
        techStack: ['React', 'Firebase', 'Tailwind', 'Recharts'],
        stats: { users: '500+ Farmers', status: 'Enterprise-Ready', reliability: '99.9%' },
        specifications: {
          database: 'Cloud Firestore',
          hosting: 'Google Cloud Platform',
          security: 'SSL / Custom Firebase Rules',
          compliance: 'Cooperative Standards'
        },
        highlights: [
          'Automatic rate calculation based on dynamic SNF / Fat charts',
          'Automated WhatsApp and SMS collection slips sent directly to farmers',
          'Rich local/global database sync enabling seamless offline tracking',
          'Instant balance ledgers and billing generation with export capabilities'
        ]
      };
    }
    if (p.id === 'agriculture-billing') {
      return {
        ...p,
        isPaidSystem: true,
        loginUrl: '/agro-login',
        demoUrl: '/agro-demo',
        techStack: ['TypeScript', 'Firestore', 'React', 'Lucide-Icons'],
        stats: { transactions: '1K+ Invoices', region: 'Rural Maharashtra', loading: 'Fast' },
        specifications: {
          database: 'Google Cloud SQL',
          architecture: 'SPA + REST API Routing',
          libraries: 'PDFJS, Canvas API',
          exportMode: 'CSV / Direct Print'
        },
        highlights: [
          'Inventory registers with critical bulk stock alerts',
          'Customer ledger tracking showing ongoing credit, debit, and advance profiles',
          'GST-compliant quotation generators and instant receipt builders',
          'Multi-user permission levels for owners, billing clerks, and auditors'
        ]
      };
    }
    if (p.id === 'medical-prescription') {
      return {
        ...p,
        isPaidSystem: true,
        loginUrl: '/med-login',
        demoUrl: '/med-login',
        techStack: ['React', 'Node.js', 'Firebase Auth', 'Firestore'],
        stats: { prescriptions: '2K+ Issued', uptime: '99.95%', status: 'Active' },
        specifications: {
          encryption: 'SHA-256 Prescription Hash',
          compliance: 'HIPAA & Pharmacy Standards',
          database: 'Durable NoSQL Data',
          roles: 'Doctor, Pharmacist, Patient'
        },
        highlights: [
          'Authentic prescription generator with doctor signature attachments',
          'Dispensing ledger checking preventing duplicate prescription usage',
          'Real-time prescription lookup by ID or QR verification hashes',
          'Secure prescription records restricting clinical modifications post-issue'
        ]
      };
    }
    if (p.id === 'furniture-management') {
      return {
        ...p,
        isPaidSystem: true,
        loginUrl: '/furniture-login',
        demoUrl: '/furniture-login',
        techStack: ['React', 'Firebase', 'Gemini AI', 'Tailwind CSS'],
        stats: { modules: '12 Active Modules', ai: 'Smart Agents', rate: '5/5 Stars' },
        specifications: {
          aiModel: 'Gemini 3.5 Flash Integration',
          analytics: 'Sales Forecasting & Velocity Engine',
          collaboration: 'Multi-store Sync',
          uiKit: 'Tailwind Premium Bento Grid'
        },
        highlights: [
          'AI-driven inventory replenishment recommendations based on seasonal sales velocity',
          'Custom furniture size & finish quote modeler for bespoke customer orders',
          'Comprehensive delivery loggers integrated with route suggestions',
          'Detailed financial ledgers tracking material cost vs production margins'
        ]
      };
    }
    if (p.id === 'school-erp') {
      return {
        ...p,
        isPaidSystem: true,
        loginUrl: '/live/school-erp',
        demoUrl: '/live/school-erp',
        techStack: ['React 18', 'Tailwind CSS', 'Framer Motion', 'Watermarks'],
        stats: { modules: '6 Specialized Modules', print: '1-Click Fast', generation: 'Instant' },
        specifications: {
          engine: 'Virtual React DOM Rendering',
          resolution: '300 DPI High-Quality Output',
          presets: '12 Customizable Styling Presets',
          customizer: 'Rich Text, Dynamic Signature, Background Watermarks'
        },
        highlights: [
          'School leaving certificate generator conforming with official regional regulatory templates',
          'Interactive student identity card customizer with barcodes and photograph uploads',
          'Dynamic report cards modeler supporting GPA, percentage, and descriptive grades',
          'Complete CSV export/import workflow for efficient school roll updates'
        ]
      };
    }
    if (p.id === 'cricket-scoreboard') {
      return {
        ...p,
        isPaidSystem: true,
        loginUrl: '/cricket-login',
        demoUrl: isScoreManager ? '/live/cricket-scoreboard' : '/cricket-login',
        techStack: ['React', 'Firebase Realtime', 'OBS Studio', 'Web Audio API'],
        stats: { spectatorMode: 'Live Sync', OBS: 'Direct Overlay', audio: 'Ambience Sound FX' },
        specifications: {
          latency: 'Sub-150ms Realtime Update',
          overlay: 'OBS Browser Source Compatible (transparent background)',
          soundboard: 'Integrated 8-channel commentary Soundboards',
          customization: 'Wicket fall screens, dynamic run-rate widgets'
        },
        highlights: [
          'Professional live cricket electronic scoreboard with customizable dynamic innings',
          'Realtime spectator screen updating second-by-second with spectator counts',
          'Custom graphics packages directly overlays on OBS or broadcasting suites',
          'Gully cricket specialized rulesets with tournament tree generators'
        ]
      };
    }
    if (p.id === 'video-streamer-recorder') {
      return {
        ...p,
        isPaidSystem: false,
        demoUrl: '/live/video-streamer-recorder',
        techStack: ['WebRTC API', 'MediaRecorder API', 'HTML5 Canvas', 'IndexedDB'],
        stats: { latency: '<200ms Low-latency', resolution: '1080p FHD', speed: 'Hardware Accel' },
        specifications: {
          codec: 'VP9 / H.264 Container support',
          processing: 'Realtime video filters & crop matrices',
          storage: 'Offline IndexedDB local recovery blocks',
          export: 'MP4 / WEBM raw buffers'
        },
        highlights: [
          'Lag-free capture session recorded at 30/60FPS natively using browser hardware',
          'Custom webcam / screen-share mix templates with drag-and-drop video scales',
          'Realtime watermarking overlays and image filter chains',
          'Complete offline reliability ensuring video buffers survive unexpected crash recovery'
        ]
      };
    }
    if (p.id === 'id-card-generator') {
      return {
        ...p,
        isPaidSystem: false,
        demoUrl: '/live/id-card-generator',
        techStack: ['HTML5 Canvas API', 'jsPDF Utility', 'PapaParse CSV', 'React 18'],
        stats: { capacity: '500+ Items', resolution: '300 DPI High-DPI', orientation: 'Portrait & Landscape' },
        specifications: {
          barcode: 'CODE128 standard line encoder',
          mapping: 'Heuristic spreadsheet CSV column aligner',
          templates: '6 Standard regional school & corporate badges',
          performance: 'Generates 100 printable sheets in <2.4 seconds'
        },
        highlights: [
          'Stunning dual-sided layout engine with precise cross-card alignment guides',
          'Mass bulk renderer taking any user spreadsheet and mapping records to cards automatically',
          'Interactive workspace supporting brand accent pickers, logo resizing, and signature pads',
          'Direct print layout fitting cards into strict standard paper bounds (A4 grid alignment)'
        ]
      };
    }
    if (p.id === 'photography-portfolio') {
      return {
        ...p,
        isPaidSystem: false,
        demoUrl: '/live/photography-portfolio',
        techStack: ['React', 'Framer Motion', 'Tailwind CSS', 'Fluid responsive structures', 'Lucide-React'],
        stats: { style: 'Premium Editorial', transitions: 'Cinema Scroll', design: 'Elite Luxe' },
        specifications: {
          animations: 'Responsive Framer Motion Spring Dynamics',
          imagery: 'Unsplash HD Curated Photographic Portals',
          layout: 'Asymmetric Editorial Bento Structure',
          performance: 'SEO Optimized static asset loader'
        },
        highlights: [
          'High-fidelity aesthetic showcasing editorial editorial categories (Portrait, Space, Still, Wedding)',
          'Immersive interactive pricing card sliders with custom inquiry form integrations',
          'Asymmetric modular masonry grids designed for high-end photography houses',
          'Custom lightroom styled carousel sliders with image details and camera metadata overlays'
        ]
      };
    }
    if (p.id === 'ganpati-mandal') {
      return {
        ...p,
        isPaidSystem: false,
        demoUrl: '/live/ganpati-mandal',
        techStack: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'QRCode.react', 'XLSX'],
        stats: { receipts: 'Digital Pavati', sharing: '1-Click WhatsApp', audit: 'Excel Balance Sheet' },
        specifications: {
          ledger: 'Instant Income & Expense Accounting',
          languages: 'Marathi (देवनागरी), Hindi, English',
          darshan: 'Live Camera & Interactive Mannat Wall',
          passes: 'QR-Verified VIP & Senior Citizen e-Passes'
        },
        highlights: [
          'Digital Pavati book with automatic Devnagari amount-in-words and WhatsApp delivery',
          'Charity Commissioner audit-ready income vs expense balances with XLSX download',
          'Shift-wise volunteer rosters, emergency blood donor index, and membership ledgers',
          'Live Darshan feed simulator with Morya reaction counters and digital Mannat Wall'
        ]
      };
    }
    if (p.id === 'cricket-toss') {
      return {
        ...p,
        isPaidSystem: false,
        demoUrl: '/live/cricket-toss',
        techStack: ['React 18', '3D CSS Transforms', 'Web Audio API', 'Motion/React', 'Tailwind CSS'],
        stats: { physics: '3D Real Spin', sound: 'Synthesized FX', history: 'Last 10 Log' },
        specifications: {
          coinEngine: 'Perspective 3D Flip with Height Arc & Shadow Scale',
          audioSynth: 'Zero-latency Web Audio API Oscillators',
          decisionHub: 'Bat vs Bowl Official Decision Lock',
          integration: '1-Click Launch into GullyScore Live Scoreboard'
        },
        highlights: [
          'Realistic 3D dual-sided gold coin animation (Heads / Tails) with shadow physics and grass bounce',
          'Support for custom team & captain names with quick presets (India vs Australia, CSK vs MI, RCB vs KKR)',
          'Automated toss winner calculation based on calling captain prediction',
          'Captain decision selector (Bat / Bowl first) with broadcast-style match graphic and WhatsApp report export'
        ]
      };
    }
    return {
      ...p,
      techStack: p.techStack || ['Web App', 'TypeScript', 'Tailwind'],
      stats: p.stats || { category: p.category, type: 'Responsive' },
      specifications: p.specifications || { platform: 'Web Browser', responsive: 'Yes' },
      highlights: p.highlights || [
        'Optimized responsive layouts with sleek transitions and elegant design',
        'State persistence for consistent across-session customer workflows',
        'Accessible color palettes styling and focus-state keyboard layouts'
      ]
    };
  };

  const project = getEnrichedProject(rawProject);

  return (
    <div className="min-h-screen bg-main-bg text-main-text">
      <Navbar />

      <main className="container mx-auto px-6 py-32">
        {/* Breadcrumb Back Button */}
        <div className="mb-10">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs hover:gap-3 transition-[gap]"
          >
            <ArrowLeft size={16} />
            Back to All Projects
          </Link>
        </div>

        {/* Hero Segment */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3.5 py-1.5 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                {project.category}
              </span>
              {project.isPaidSystem && (
                <span className="px-3.5 py-1.5 bg-red-500/10 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                  SaaS System
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-main-text mb-6 tracking-tighter leading-[1.05]">
              {project.title}
            </h1>

            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8 max-w-xl">
              {project.desc}
            </p>

            <div className="flex flex-wrap gap-4">
              {project.demoUrl && (
                <Link
                  to={project.demoUrl}
                  className="px-8 py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-95 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-3"
                >
                  <ExternalLink size={14} />
                  Launch Live Demo
                </Link>
              )}
              {project.loginUrl && project.loginUrl !== project.demoUrl && (
                <Link
                  to={project.loginUrl}
                  className="px-8 py-4 bg-surface text-main-text border border-gray-100 dark:border-gray-800 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  Access Console
                </Link>
              )}
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative group rounded-3xl overflow-hidden aspect-[4/3] bg-surface border border-gray-100 dark:border-gray-800 shadow-xl">
              {project.id === 'photography-portfolio' ? (
                <img
                  src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop"
                  alt="Lens & Light Studios"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full relative">
                  {(project.image || project.thumbnail) ? (
                    <img
                      src={project.image || project.thumbnail}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                      <ImageIcon className="text-primary/30" size={80} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Metrics / Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {Object.entries(project.stats || {}).map(([key, value]: [string, any]) => (
            <div key={key} className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">{key}</span>
              <span className="text-xl md:text-2xl font-black text-main-text">{value}</span>
            </div>
          ))}
          <div className="bg-surface p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">Status</span>
            <span className="text-xl md:text-2xl font-black text-emerald-500 uppercase tracking-tight flex items-center gap-1.5">
              <CheckCircle size={16} /> Live
            </span>
          </div>
        </div>

        {/* Case Study Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Key Features & Highlights */}
          <div className="lg:col-span-2 space-y-10">
            <section className="bg-surface p-8 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
              <h2 className="text-2xl md:text-3xl font-black text-main-text mb-6 flex items-center gap-3">
                <Shield className="text-primary" size={24} />
                Key Capabilities
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {project.highlights.map((highlight: string, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {project.id === 'photography-portfolio' && (
              <section className="bg-surface p-8 md:p-10 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                <h2 className="text-2xl md:text-3xl font-black text-main-text mb-6 flex items-center gap-3">
                  <ImageIcon className="text-primary" size={24} />
                  Premium Interactive Brand SPA
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                  <p>
                    <strong>Lens & Light Studios</strong> represents an ultra-luxurious, responsive presentation matrix designed for a premium photography agency. Rather than basic image lists, it adopts editorial-type fluid structures that gracefully guide users across conceptual modules:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li>Dynamic Lightroom Carousel to isolate, size-scale, and detail frames beautifully</li>
                    <li>Sleek, fluid price metrics that adjusts according to selected luxury packages</li>
                    <li>Integrated real-time customer booking models with interactive feedback systems</li>
                  </ul>
                </div>
              </section>
            )}
          </div>

          {/* Technical Specifications Toolbar */}
          <div className="space-y-8">
            <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-black text-main-text mb-6 flex items-center gap-2">
                <Cpu className="text-primary" size={20} />
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2 mb-8">
                {project.techStack.map((tech: string) => (
                  <span
                    key={tech}
                    className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-905 rounded-xl text-[10px] font-black uppercase text-gray-500 tracking-wider hover:bg-primary/5 hover:text-primary transition-colors"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <h3 className="text-xl font-black text-main-text mb-4 flex items-center gap-2">
                <Tag className="text-primary" size={20} />
                System Parameters
              </h3>
              <div className="space-y-4 border-t border-gray-50 dark:border-gray-800/40 pt-4">
                {Object.entries(project.specifications || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between items-center text-sm border-b border-gray-50/50 dark:border-gray-800/20 pb-2">
                    <span className="text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold text-main-text text-right max-w-[160px] truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {project.demoUrl && (
              <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between items-start whitespace-normal gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10" />
                <div>
                  <h4 className="text-2xl font-black tracking-tight mb-2">Want to try it yourself?</h4>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Instantly boot up and browse {project.title} live in mock sandbox mode.
                  </p>
                </div>
                <Link
                  to={project.demoUrl}
                  className="w-full py-4 bg-white text-primary text-center font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-gray-50 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ExternalLink size={14} />
                  Launch Sandbox Play
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
