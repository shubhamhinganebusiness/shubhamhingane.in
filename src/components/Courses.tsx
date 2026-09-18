import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Clock, Tag, ArrowRight, GraduationCap, 
  Sparkles, Star, ShieldCheck, CheckCircle2, Award, 
  Layers, Users, Calendar, Download, Search, Check, Zap, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';
import { CourseEnrollmentModal } from './courses/CourseEnrollmentModal';
import { CourseSyllabusModal } from './courses/CourseSyllabusModal';

type CourseCategory = 'all' | 'web' | 'design' | 'marketing';

interface CourseEnrichment {
  category: CourseCategory;
  categoryLabel: string;
  badge?: string;
  seatsLeft: number;
  nextCohort: string;
  rating: number;
  studentsCount: number;
  level: string;
  format: string;
  keyModules: string[];
  capstone: string;
  techStack: string[];
  curriculum: string[];
}

const courseEnrichments: Record<string, CourseEnrichment> = {
  'full-stack-dev': {
    category: 'web',
    categoryLabel: 'Web & Cloud Engineering',
    badge: 'Trending • 100% Practical',
    seatsLeft: 4,
    nextCohort: 'Oct 5, 2026',
    rating: 4.95,
    studentsCount: 142,
    level: 'Beginner to Industry Pro',
    format: 'Live 1-on-1 + Interactive LMS',
    keyModules: [
      'React 19, TypeScript & Custom Hooks',
      'Firebase Firestore & Cloud Function Architecture',
      'Full-Stack Node.js & Express REST APIs',
      'Container Deployment & Cloud Run CI/CD'
    ],
    capstone: 'Production Multi-Tenant SaaS Platform with PDF Invoicing & RBAC',
    techStack: ['React 19', 'TypeScript', 'Node.js', 'Firebase Firestore', 'Tailwind CSS', 'Docker'],
    curriculum: [
      'Week 1-2: Modern ESNext & Strict TypeScript Masterclass',
      'Week 3-4: Advanced React 19 State, Hooks & Micro-interactions',
      'Week 5-6: Real-time Cloud Databases, Security Rules & Authentication',
      'Week 7-8: Full-Stack APIs, Automated PDF Invoicing & Hardware Barcode/QR',
      'Week 9-10: Capstone SaaS Build, Production Audit & Live Domain Deployment'
    ]
  },
  'ui-ux-design': {
    category: 'design',
    categoryLabel: 'Product & Visual Design',
    badge: 'Portfolio Centric',
    seatsLeft: 6,
    nextCohort: 'Oct 12, 2026',
    rating: 4.92,
    studentsCount: 98,
    level: 'All Levels Welcome',
    format: 'Figma Live Workspace + Weekly Critiques',
    keyModules: [
      'Figma Enterprise Design Systems & Tokens',
      'High-Fidelity Interactive Micro-Prototyping',
      'UX Research, Wireframes & Information Architecture',
      'Client Presentation & Developer Handoff'
    ],
    capstone: 'Complete Mobile App & SaaS Web Design System in Figma',
    techStack: ['Figma', 'FigJam', 'Motion Prototyping', 'Design Tokens', 'Tailwind Sync'],
    curriculum: [
      'Week 1-2: Visual Hierarchy, Mathematical Typography & Optical Spacing',
      'Week 2-4: Scalable Design Systems, Auto-Layout & Component Variants',
      'Week 5-6: Wireframing, UX Journey Mapping & Devotee/Customer Research',
      'Week 7-8: Interactive Micro-animations, Figma Smart Animate & Handoff'
    ]
  },
  'digital-marketing': {
    category: 'marketing',
    categoryLabel: 'Growth & Search Visibility',
    badge: 'ROI & Data Driven',
    seatsLeft: 5,
    nextCohort: 'Oct 8, 2026',
    rating: 4.88,
    studentsCount: 114,
    level: 'Foundational to Advanced',
    format: 'Live Campaigns with Real Ad Budgets',
    keyModules: [
      'Google SEO & Pune Local Business Dominance',
      'Meta (Facebook/Instagram) High-ROAS Funnels',
      'Conversion Rate Optimization (CRO) & Copywriting',
      'Automated WhatsApp & Email Lead Nurturing'
    ],
    capstone: 'Live Multi-Channel Ad Campaign with Real Leads & Analytics Dashboard',
    techStack: ['Google Search Console', 'Meta Ads Manager', 'Schema JSON-LD', 'Google Analytics 4', 'Ahrefs'],
    curriculum: [
      'Week 1-2: Modern Search Engine Optimization & Keyword Intent Architecture',
      'Week 3-4: High-Converting Landing Page Design & Funnel Copywriting',
      'Week 5-6: Paid Acquisition (Google Ads, Meta Ads & Retargeting)',
      'Week 7-8: Analytics Auditing, Conversion Tracking & Automation Pipelines'
    ]
  }
};

export const Courses = () => {
  const { t } = useLanguage();
  const { items: dbCourses } = useCMSCollection('courses');
  const { settings } = useSiteSettings();

  const [activeCategory, setActiveCategory] = useState<CourseCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedEnrollCourse, setSelectedEnrollCourse] = useState<any>(null);
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<any>(null);

  const title = settings?.headings?.courses?.title || t.courses.title;
  const subtitle = settings?.headings?.courses?.subtitle || t.courses.subtitle;

  const defaultCourses = t.courses.list;
  const rawCourses = dbCourses.length > 0 ? dbCourses : defaultCourses;

  // Filter courses by category and search
  const filteredCourses = useMemo(() => {
    return rawCourses.filter((course: any) => {
      const enrichment = courseEnrichments[course.id];
      const matchesCategory = activeCategory === 'all' || enrichment?.category === activeCategory;
      const matchesSearch = !searchQuery.trim() || 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (enrichment?.keyModules && enrichment.keyModules.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())));
      return matchesCategory && matchesSearch;
    });
  }, [rawCourses, activeCategory, searchQuery]);

  const categories = [
    { id: 'all', label: 'All Courses', count: rawCourses.length },
    { id: 'web', label: 'Web & Cloud Engineering', count: rawCourses.filter(c => courseEnrichments[c.id]?.category === 'web').length },
    { id: 'design', label: 'UI/UX Design', count: rawCourses.filter(c => courseEnrichments[c.id]?.category === 'design').length },
    { id: 'marketing', label: 'Growth & Marketing', count: rawCourses.filter(c => courseEnrichments[c.id]?.category === 'marketing').length },
  ];

  const handleOpenEnrollment = (course: any) => {
    const enrichment = courseEnrichments[course.id];
    setSelectedEnrollCourse({
      ...course,
      capstone: enrichment?.capstone
    });
  };

  const handleOpenSyllabus = (course: any) => {
    const enrichment = courseEnrichments[course.id];
    setSelectedSyllabusCourse({
      ...course,
      capstone: enrichment?.capstone,
      curriculum: enrichment?.curriculum,
      techStack: enrichment?.techStack,
      highlights: enrichment?.keyModules
    });
  };

  return (
    <section id="courses" className="py-24 px-4 md:px-8 max-w-7xl mx-auto relative transition-colors">
      {/* Background Decorative Ambient */}
      <div className="absolute top-12 right-10 w-96 h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-widest mb-3 shadow-xs">
            <GraduationCap size={14} className="animate-pulse" />
            <span>{subtitle}</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-main-text tracking-tight">
            {title}
          </h2>
          <p className="mt-3 text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
            Practical, mentor-led programs designed to build real software engineering & creative capabilities with live deployed portfolios.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syllabus, tech, modules..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-surface dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-main-text placeholder-gray-400 focus:outline-none focus:border-primary transition-colors card-shadow"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface/80 dark:bg-zinc-900/80 border border-gray-200/70 dark:border-zinc-800/80 backdrop-blur-md mb-12 overflow-x-auto custom-scrollbar w-fit max-w-full">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as CourseCategory)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course: any, idx: number) => {
            const enrichment = courseEnrichments[course.id] || {
              category: 'web',
              categoryLabel: 'Professional Skill',
              badge: 'Batch Open',
              seatsLeft: 5,
              nextCohort: 'Upcoming',
              rating: 4.9,
              studentsCount: 80,
              level: 'All Levels',
              format: 'Live + Mentorship',
              keyModules: ['Practical Fundamentals', 'Real-world Projects', 'Career Handoff'],
              capstone: 'Industry-Standard Capstone Application',
              techStack: ['Modern Frameworks', 'Git', 'Cloud Hosting'],
              curriculum: ['Module 1: Setup', 'Module 2: Real-time Build', 'Module 3: Launch']
            };

            return (
              <motion.div
                key={course.id || idx}
                layout
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="bg-surface dark:bg-zinc-900 rounded-[36px] p-7 md:p-8 card-shadow border border-gray-100 dark:border-zinc-800 flex flex-col h-full group hover:border-primary/40 transition-all duration-300"
              >
                {/* Visual Header / Banner Thumbnail */}
                <div className="h-48 -mx-3 -mt-3 mb-6 rounded-[28px] overflow-hidden bg-gray-100 dark:bg-zinc-800 flex items-center justify-center relative shadow-inner">
                  {course.image ? (
                    <img 
                      src={course.image} 
                      alt={course.title} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <GraduationCap size={32} />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Badge & Urgency Pill */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
                    {enrichment.badge && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                        {enrichment.badge}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      <span>{enrichment.seatsLeft} Seats Left</span>
                    </span>
                  </div>

                  {/* Price Tag */}
                  {course.price && (
                    <div className="absolute bottom-3.5 right-3.5 px-3.5 py-1.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-100/50 dark:border-zinc-700/50">
                      <span className="text-primary font-black text-sm">{course.price}</span>
                    </div>
                  )}

                  {/* Rating Pill */}
                  <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1 text-[11px] font-bold text-white bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span>{enrichment.rating}</span>
                    <span className="text-white/70">({enrichment.studentsCount}+ grads)</span>
                  </div>
                </div>

                {/* Course Metadata (Duration & Cohort) */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400 font-semibold mb-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-primary" />
                    <span>{course.duration || 'Flexible'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Calendar size={14} />
                    <span>Batch: {enrichment.nextCohort}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-black text-main-text mb-2.5 group-hover:text-primary transition-colors tracking-tight leading-snug">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm leading-relaxed mb-5 line-clamp-2">
                  {course.desc}
                </p>

                {/* Key Curriculum Highlights */}
                <div className="w-full mb-5 space-y-1.5 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <span className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">
                    Key Modules You Master
                  </span>
                  {enrichment.keyModules.slice(0, 3).map((item, mIdx) => (
                    <div key={mIdx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={13} className="text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Capstone Project Pill */}
                {enrichment.capstone && (
                  <div className="mb-6 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-primary mb-1">
                      <Sparkles size={12} />
                      <span>Signature Capstone</span>
                    </div>
                    <p className="text-xs font-bold text-main-text line-clamp-1">
                      {enrichment.capstone}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-auto space-y-2.5 pt-2">
                  <button 
                    onClick={() => handleOpenEnrollment(course)}
                    className="w-full py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-2xl hover:brightness-110 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group/btn shadow-lg shadow-primary/25 hover:shadow-primary/45 cursor-pointer"
                  >
                    <span>Reserve Seat / Enroll</span>
                    <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleOpenSyllabus(course)}
                      className="py-2.5 px-3 bg-surface dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700/60 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 font-bold text-[11px] rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText size={13} className="text-primary" />
                      <span>Syllabus</span>
                    </button>

                    <Link 
                      to={`/course/${course.id}`}
                      className="py-2.5 px-3 bg-surface dark:bg-zinc-800/80 hover:bg-gray-100 dark:hover:bg-zinc-700/60 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 font-bold text-[11px] rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-center"
                    >
                      <span>Full Details</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Trust & Guarantee Bar */}
      <div className="mt-16 p-6 md:p-8 rounded-3xl bg-surface/90 dark:bg-zinc-900/90 border border-gray-200/80 dark:border-zinc-800/80 backdrop-blur-md card-shadow">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Award size={24} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-main-text">Learner Guarantee & Outcomes</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Direct mentorship by Shubham Hingane (3+ Years Enterprise Experience). Lifetime recording access.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>3 Production GitHub Projects</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Verified Certificate of Mastery</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>1-on-1 Code Reviews & Interview Prep</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CourseEnrollmentModal 
        isOpen={Boolean(selectedEnrollCourse)}
        onClose={() => setSelectedEnrollCourse(null)}
        course={selectedEnrollCourse}
      />

      <CourseSyllabusModal 
        isOpen={Boolean(selectedSyllabusCourse)}
        onClose={() => setSelectedSyllabusCourse(null)}
        onEnroll={() => {
          setSelectedEnrollCourse(selectedSyllabusCourse);
        }}
        course={selectedSyllabusCourse}
      />
    </section>
  );
};


