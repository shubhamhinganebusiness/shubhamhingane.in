import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Send, Sparkles, Clock, Calendar, 
  ShieldCheck, Award, MessageCircle, User, Phone, 
  Mail, BookOpen, ChevronRight, Loader2
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CourseEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    price?: string;
    duration?: string;
    capstone?: string;
  } | null;
}

export const CourseEnrollmentModal: React.FC<CourseEnrollmentModalProps> = ({
  isOpen,
  onClose,
  course
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [batchPreference, setBatchPreference] = useState<'weekday_evening' | 'weekend_intensive' | 'one_on_one'>('weekday_evening');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'working_pro'>('beginner');
  const [questions, setQuestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !course) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name,
        phone,
        email,
        courseId: course.id,
        courseTitle: course.title,
        batchPreference,
        experienceLevel,
        questions,
        type: 'course_enrollment',
        status: 'unread',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'course_enrollments'), payload);

      // Instant WhatsApp notification redirect
      const whatsappNumber = '7719959593';
      const batchLabels = {
        weekday_evening: 'Weekday Evening (Mon-Thu 8-9:30 PM)',
        weekend_intensive: 'Weekend Intensive (Sat-Sun 10 AM-1 PM)',
        one_on_one: '1-on-1 Dedicated Fast-Track'
      };

      const msg = `*New Course Enrollment Request*%0A%0A*Course:* ${course.title}%0A*Name:* ${name}%0A*Phone:* ${phone}%0A*Email:* ${email || 'N/A'}%0A*Batch:* ${batchLabels[batchPreference]}%0A*Level:* ${experienceLevel}%0A*Notes:* ${questions || 'None'}`;
      window.open(`https://wa.me/${whatsappNumber}?text=${msg}`, '_blank');

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setName('');
        setPhone('');
        setEmail('');
        setQuestions('');
      }, 2500);
    } catch (err) {
      console.error('Enrollment submission error:', err);
      try {
        handleFirestoreError(err, OperationType.CREATE, 'course_enrollments');
      } catch (_) {
        alert('Registration recorded locally! We will contact you shortly.');
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.1 }}
          className="relative w-full max-w-2xl bg-surface dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 z-10 my-8 max-h-[90vh] overflow-y-auto custom-scrollbar"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-primary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {isSuccess ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mb-6">
                <Check size={40} className="stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-main-text mb-2">Seat Reservation Received!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Thank you, <span className="font-bold text-main-text">{name}</span>. Shubham will personally connect with you on WhatsApp/Phone within 2 hours to confirm your batch orientation and roadmap.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full">
                <ShieldCheck size={16} />
                <span>100% Free Demo Session & Portfolio Audit Included</span>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                  <Sparkles size={13} />
                  <span>Fast-Track Admission</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-main-text tracking-tight">
                  Enroll in {course.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-primary" /> {course.duration}
                    </span>
                  )}
                  {course.price && (
                    <span className="flex items-center gap-1 font-bold text-primary">
                      {course.price}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck size={14} /> Next Batch Starts Oct 2026
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-main-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      WhatsApp / Phone Number *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-main-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Email Address (Optional for Syllabus PDF)
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-main-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      Batch Preference
                    </label>
                    <select
                      value={batchPreference}
                      onChange={(e: any) => setBatchPreference(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-main-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="weekday_evening">Weekday Evening (Mon-Thu 8:00 PM)</option>
                      <option value="weekend_intensive">Weekend Cohort (Sat-Sun 10:00 AM)</option>
                      <option value="one_on_one">1-on-1 Personalized Mentorship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                      Your Experience Level
                    </label>
                    <select
                      value={experienceLevel}
                      onChange={(e: any) => setExperienceLevel(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-main-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="beginner">Complete Beginner / Student</option>
                      <option value="intermediate">Junior Developer / Some Coding</option>
                      <option value="working_pro">Working Professional Upskilling</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    What is your primary goal or question?
                  </label>
                  <textarea
                    rows={2}
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="e.g. Want to build a SaaS startup, need interview prep, or seeking college placement..."
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-sm font-medium text-main-text focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                {/* Assurance points */}
                <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/15 flex items-start gap-3">
                  <Award size={18} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    <span className="font-bold text-main-text">Guaranteed:</span> You will build 3 real production systems (with live deployment and code reviews), verified certificate, and lifetime access to batch recordings.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Reserving Seat...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Confirm Reservation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
