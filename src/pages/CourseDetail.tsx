import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  BookOpen, 
  Users, 
  Calendar, 
  Award,
  ChevronRight,
  PlayCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../components/LanguageContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dbCourse, setDbCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const localCourse = (t as any).courseDetail[id || ''];

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchDbCourse = async () => {
      if (!localCourse && id) {
        try {
          const snap = await getDoc(doc(db, 'courses', id));
          if (snap.exists()) {
            setDbCourse(snap.data());
          } else {
            navigate('/');
          }
        } catch (err) {
          console.error(err);
          navigate('/');
        }
      }
      setLoading(false);
    };

    fetchDbCourse();
  }, [id, localCourse, navigate]);

  if (loading && !localCourse) {
    return <div className="min-h-screen flex items-center justify-center font-bold">Loading Course...</div>;
  }

  const course = localCourse || dbCourse;
  if (!course) return null;

  // Adapt database project to local project structure if needed
  const displayCourse = {
    title: course.title,
    subtitle: course.subtitle || 'Learn from the professional',
    overview: course.overview || course.desc || 'Comprehensive professional training course.',
    curriculum: course.curriculum || ['Fundamentals', 'Advanced Concepts', 'Real-world Projects'],
    outcomes: course.outcomes || ['Job Promotion', 'Salary Hike', 'Deep Understanding'],
    mentorship: course.mentorship || 'Personalized guidance from shubham.',
    image: course.image || `https://picsum.photos/seed/${id}/800/600`
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors font-bold uppercase tracking-widest text-sm"
          >
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-wider text-primary">COURSE DETAIL</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-widest mb-6 border border-primary/20">
              Professional Course
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
              {displayCourse.title}
            </h1>
            <p className="text-xl md:text-2xl text-primary font-medium mb-8">
              {displayCourse.subtitle}
            </p>
            <div className="flex flex-wrap gap-6 mb-10">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={20} className="text-primary" />
                <span className="font-semibold">Flexible Journey</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users size={20} className="text-primary" />
                <span className="font-semibold">Professional Support</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Award size={20} className="text-primary" />
                <span className="font-semibold">Industry Certificate</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 text-lg uppercase tracking-widest">
                Enroll Now
              </button>
              <button className="px-8 py-5 bg-white text-gray-900 font-bold rounded-2xl border border-gray-200 hover:border-primary transition-all duration-300 text-lg flex items-center justify-center gap-3 uppercase tracking-widest">
                <PlayCircle size={24} />
                Watch Intro
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-3xl overflow-hidden card-shadow border-4 border-white">
              <img 
                src={displayCourse.image} 
                alt={displayCourse.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Course Overview */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 border-l-4 border-primary pl-6">
                Course Overview
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed mb-12">
                {displayCourse.overview}
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mb-8 border-l-4 border-primary pl-6">
                What you will learn
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-12">
                {displayCourse.curriculum.map((item: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-primary transition-colors">
                    <div className="mt-1">
                      <CheckCircle2 size={24} className="text-primary" />
                    </div>
                    <span className="text-lg font-medium text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-32 p-8 bg-gray-900 rounded-[40px] text-white card-shadow">
                <h3 className="text-2xl font-bold mb-8">Career Outcomes</h3>
                <div className="space-y-6 mb-10">
                  {displayCourse.outcomes.map((outcome: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="bg-primary/20 p-2 rounded-lg">
                        <ChevronRight size={20} className="text-primary" />
                      </div>
                      <span className="text-lg font-medium text-gray-300">{outcome}</span>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 mb-8">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BookOpen size={20} className="text-primary" />
                    Mentorship
                  </h4>
                  <p className="text-gray-400">
                    {displayCourse.mentorship}
                  </p>
                </div>

                <button className="w-full py-5 bg-primary text-white font-bold rounded-2xl hover:scale-105 transition-transform text-lg shadow-xl shadow-primary/30 uppercase tracking-widest">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

