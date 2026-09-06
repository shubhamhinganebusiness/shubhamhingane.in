import React from 'react';
import { BookOpen, Clock, Tag, ArrowRight, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';

export const Courses = () => {
  const { t } = useLanguage();
  const { items: dbCourses } = useCMSCollection('courses');
  const { settings } = useSiteSettings();

  const title = settings?.headings?.courses?.title || t.courses.title;
  const subtitle = settings?.headings?.courses?.subtitle || t.courses.subtitle;

  const defaultCourses = t.courses.list;
  const courses = dbCourses.length > 0 ? dbCourses : defaultCourses;

  return (
    <section id="courses" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="uppercase tracking-[3px] text-primary font-bold block mb-4"
          >
            {subtitle}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight"
          >
            {title}
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -10 }}
              className="bg-white rounded-[40px] p-8 card-shadow border border-gray-100 flex flex-col h-full group"
            >
              <div className="h-48 -mx-4 -mt-4 mb-8 rounded-[32px] overflow-hidden bg-gray-100 flex items-center justify-center relative">
                {course.image ? (
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <GraduationCap size={32} />
                  </div>
                )}
                {course.price && (
                   <div className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                      <span className="text-primary font-black">{course.price}</span>
                   </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              
              <p className="text-gray-600 mb-8 flex-grow leading-relaxed">
                {course.desc}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm font-semibold text-gray-500">
                  <Clock size={18} className="text-primary" />
                  <span>{course.duration || 'Flexible'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:brightness-110 transition-all duration-300 flex items-center justify-center gap-3 group/btn shadow-lg shadow-primary/25 hover:shadow-primary/45">
                  {t.courses.cta}
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <Link 
                  to={`/course/${course.id}`}
                  className="w-full py-4 bg-white text-gray-900 border border-gray-200 font-bold rounded-2xl hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-3 group/btn"
                >
                  {t.courses.learnMore}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

