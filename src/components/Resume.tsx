import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings, useCMSCollection } from '../hooks/useCMS';

const ExperienceCard = ({ title, company, desc, rating }: any) => (
  <div className="relative p-10 bg-surface card-shadow rounded-2xl group hover:bg-primary hover:text-white transition-all duration-400 mb-12 last:mb-0">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h3 className="text-2xl font-bold text-main-text group-hover:text-white transition-colors duration-300">{title}</h3>
        <p className="text-gray-500 group-hover:text-white/80 transition-colors uppercase text-sm font-semibold tracking-wider">{company}</p>
      </div>
      <div className="px-4 py-2 bg-surface card-shadow rounded-lg text-primary text-sm font-bold group-hover:bg-white group-hover:text-primary transition-all duration-300">
        {rating}
      </div>
    </div>
    <div className="w-full h-[1px] bg-gray-300 dark:bg-gray-700 my-8 group-hover:bg-white/20 transition-all duration-300"></div>
    <p className="text-gray-600 dark:text-gray-400 group-hover:text-white transition-all duration-300 leading-loose text-lg">
      {desc}
    </p>
  </div>
);

const SkillBar = ({ name, percent, desc }: { name: string, percent: string, desc: string }) => (
  <div className="mb-8 w-full block text-left">
    <div className="flex justify-between items-center mb-2">
      <h6 className="uppercase tracking-widest font-black text-sm text-gray-800 dark:text-zinc-200">{name}</h6>
      <span className="text-primary text-sm font-black">{percent}</span>
    </div>
    <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-1 card-shadow mb-2.5">
      <div 
        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" 
        style={{ width: percent }}
      ></div>
    </div>
    <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
      {desc}
    </p>
  </div>
);

export const Resume = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const { items: dbExperience } = useCMSCollection('experience');
  const { items: dbEducation } = useCMSCollection('education');
  const [activeTab, setActiveTab] = useState('Experience');

  const title = settings?.headings?.resume?.title || t.resume.title;
  const subtitle = settings?.headings?.resume?.subtitle || t.resume.subtitle;

  const experience = dbExperience.length > 0 ? dbExperience : [
    { title: t.resume.exp.sr, company: t.resume.exp.google, rating: "4.9/5", desc: "Building scalable cloud-native applications." },
    { title: t.resume.exp.web, company: t.resume.exp.meta, rating: "4.8/5", desc: "Design for global client projects." }
  ];

  const education = dbEducation.length > 0 ? dbEducation : [
    { title: t.resume.edu.comp, institution: t.resume.edu.uni, rating: "3.9/4", desc: "Bachelor's degree with honors." },
    { title: t.resume.edu.full, institution: t.resume.edu.coursera, rating: "5.0/5", desc: "MERN Stack development." }
  ];

  const tabs = [
    { id: 'Education', label: t.resume.tabs.education },
    { id: 'Professional Skills', label: t.resume.tabs.skills },
    { id: 'Experience', label: t.resume.tabs.experience },
    { id: 'Interview', label: t.resume.tabs.interview }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Education':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-4xl font-bold mb-12 pl-6 border-l-4 border-gray-300 dark:border-gray-700 italic text-main-text">Academic Excellence</h2>
              <div className="relative pl-6 border-l-4 border-gray-300 dark:border-gray-700 ml-4 space-y-12">
                {education.map((edu, idx) => (
                  <ExperienceCard 
                    key={idx}
                    title={edu.title}
                    company={edu.institution}
                    rating={edu.rating}
                    desc={edu.desc}
                  />
                ))}
              </div>
            </div>
            <div className="hidden lg:block bg-surface card-shadow rounded-[3rem] p-12 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8 text-primary opacity-10">
                 <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9L12 15L21 10.09V17H23V9M5 13.18V17.18L12 21L19 17.18V13.18L12 17L5 13.18Z" />
                 </svg>
               </div>
               <h3 className="text-3xl font-black mb-6 text-main-text">Qualification Hierarchy</h3>
               <p className="text-gray-500 dark:text-gray-400 leading-relaxed font-medium">My educational path reflects a consistent pursuit of excellence in technical and theoretical domains.</p>
            </div>
          </div>
        );
      case 'Professional Skills':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-4xl font-bold mb-12 italic text-main-text">{t.resume.skills.dev}</h2>
              <div className="bg-surface card-shadow rounded-2xl p-10">
                <SkillBar 
                  name="React.JS" 
                  percent="95%" 
                  desc="Engineered 10+ complex production SaaS apps with dynamic real-time datagrid state synchronizations." 
                />
                <SkillBar 
                  name="Node.JS" 
                  percent="85%" 
                  desc="Architected highly-performant Express backends serving automated PDF invoice generators and socket states." 
                />
                <SkillBar 
                  name="TypeScript" 
                  percent="90%" 
                  desc="Established strictly type-safe contracts to reduce production runtime errors by over 38%." 
                />
                <SkillBar 
                  name="Tailwind CSS" 
                  percent="98%" 
                  desc="Designed modular responsive fluid layouts, custom themes, and optimized layout CSS transitions." 
                />
                <SkillBar 
                  name="Firebase" 
                  percent="88%" 
                  desc="Configured multi-tenant Firestore collections with strict custom security rules and high-performance queries." 
                />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-12 italic text-main-text">{t.resume.skills.graph}</h2>
              <div className="bg-surface card-shadow rounded-2xl p-10">
                <SkillBar 
                  name="Figma" 
                  percent="92%" 
                  desc="Created custom vector component libraries, grid wireframes, and developer-aligned design prototypes." 
                />
                <SkillBar 
                  name="Adobe Photoshop" 
                  percent="80%" 
                  desc="Processed high-fidelity marketing assets, pixel-perfect icon sets, and vector profile imagery." 
                />
                <SkillBar 
                  name="After Effects" 
                  percent="75%" 
                  desc="Compiled motion graphics templates, premium animated logo reveals, and custom loader clips." 
                />
                <SkillBar 
                  name="Premiere Pro" 
                  percent="85%" 
                  desc="Edited promotional service walkthrough videos, product reels, and clean customer testimony segments." 
                />
                <SkillBar 
                  name="OBS Studio" 
                  percent="95%" 
                  desc="Calibrated expert live-broadcasting overlays with manual canvas matrix layouts, audio delays, and telemetry modules." 
                />
              </div>
            </div>
          </div>
        );
      case 'Experience':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-4xl font-bold mb-12 pl-6 border-l-4 border-gray-300 dark:border-gray-700 italic text-main-text">Work Milestones</h2>
              <div className="relative pl-6 border-l-4 border-gray-300 dark:border-gray-700 ml-4 space-y-12">
                {experience.map((exp, idx) => (
                  <ExperienceCard 
                    key={idx}
                    title={exp.title}
                    company={exp.company}
                    rating={exp.rating}
                    desc={exp.desc}
                  />
                ))}
              </div>
            </div>
            <div className="hidden lg:block bg-primary/5 dark:bg-primary/10 rounded-[3rem] p-12 border-2 border-primary/10">
               <h3 className="text-3xl font-black text-primary mb-6">Expertise Focus</h3>
               <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-medium">Over the years, I have collaborated with global tech giants and innovative startups to solve complex architectural challenges.</p>
               <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                     <div className="w-2 h-2 rounded-full bg-primary"></div>
                     Scalable Architecture
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                     <div className="w-2 h-2 rounded-full bg-primary"></div>
                     Product Design
                  </div>
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">
                     <div className="w-2 h-2 rounded-full bg-primary"></div>
                     Team Leadership
                  </div>
               </div>
            </div>
          </div>
        );
      case 'Interview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
               <h2 className="text-4xl font-bold mb-12 italic">{t.resume.interview.tech}</h2>
               <div className="relative pl-6 border-l-4 border-gray-300 ml-4 space-y-12">
                <ExperienceCard 
                  title={t.resume.interview.algo}
                  company={t.resume.interview.leet}
                  rating="High"
                  desc="Mastered competitive programming concepts with a high rank in international contests."
                />
                <ExperienceCard 
                  title={t.resume.interview.design}
                  company={t.resume.interview.prep}
                  rating="A+"
                  desc="Deep knowledge in designing highly available and distributed systems at scale."
                />
              </div>
            </div>
            <div className="flex items-center justify-center p-12 bg-surface card-shadow rounded-3xl">
               <div className="text-center">
                  <h3 className="text-3xl font-bold mb-6 text-primary">{t.resume.interview.tech}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">{t.resume.interview.hireDesc}</p>
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('open-hire-modal'))}
                    className="px-12 py-5 bg-primary text-white rounded-xl font-bold shadow-xl hover:translate-y-[-5px] transition-all duration-300"
                  >
                    {t.resume.interview.book}
                  </button>
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section id="resume" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-gray-300 dark:border-gray-800">
      <div className="text-center mb-16">
        <span className="uppercase tracking-[2px] text-primary font-bold block mb-4 italic">{subtitle}</span>
        <h2 className="text-4xl md:text-6xl font-extrabold mb-12 text-main-text">{title}</h2>
        
        <div className="flex justify-center gap-4 mb-16 overflow-x-auto pb-4 px-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 md:px-12 py-5 rounded-xl font-bold uppercase tracking-widest text-sm whitespace-nowrap transition-all duration-300 ${activeTab === tab.id ? 'card-shadow bg-surface text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-primary hover:card-shadow bg-transparent'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[600px]">
        {renderContent()}
      </div>
    </section>
  );
};
