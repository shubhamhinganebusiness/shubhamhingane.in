import React from 'react';
import { IDCardDesign, Student } from '../../types/idCard';
import { DEMO_PROFILES, DemoProfile } from '../../utils/zenIdPresets';
import { GraduationCap, BookOpen, Briefcase, Stethoscope, Sparkles } from 'lucide-react';

interface PersonaSelectorProps {
  onSelectProfile: (profile: DemoProfile) => void;
  currentStudentId: string;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  onSelectProfile,
  currentStudentId
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap size={15} className="text-blue-500" />;
      case 'BookOpen':
        return <BookOpen size={15} className="text-amber-500" />;
      case 'Briefcase':
        return <Briefcase size={15} className="text-indigo-500" />;
      case 'Stethoscope':
        return <Stethoscope size={15} className="text-emerald-500" />;
      default:
        return <Sparkles size={15} className="text-blue-500" />;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 md:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Sparkles size={14} />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Pre-Configured Enterprise Archetypes
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest hidden sm:inline">
          1-Click Full Suite Setup
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {DEMO_PROFILES.map((profile) => {
          const isSelected = currentStudentId === profile.student.id;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => onSelectProfile(profile)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer transform active:scale-97 ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30'
                  : 'border-slate-200/70 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/60 dark:hover:bg-zinc-850/50'
              }`}
            >
              <div className="flex items-start justify-between w-full">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50">
                  {getIcon(profile.iconName)}
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  {profile.badge}
                </span>
              </div>

              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {profile.label}
                </div>
                <div className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  {profile.student.name}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
