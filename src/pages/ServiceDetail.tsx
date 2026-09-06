import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../components/LanguageContext';
import { ArrowLeft, CheckCircle2, Star, Layers, Briefcase, MessageSquare, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [dbService, setDbService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const localService = t.serviceDetail[id as keyof typeof t.serviceDetail] as any;

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const fetchDbService = async () => {
      if (!localService && id) {
        try {
          const snap = await getDoc(doc(db, 'services', id));
          if (snap.exists()) {
            setDbService(snap.data());
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

    fetchDbService();
  }, [id, localService, navigate]);

  if (loading && !localService) {
    return <div className="min-h-screen flex items-center justify-center font-bold">Loading Service...</div>;
  }

  const serviceData = localService || dbService;
  if (!serviceData) return null;

  // Adapt database service structure if needed
  const service = {
    title: serviceData.title,
    subtitle: serviceData.subtitle || 'Expert Consultancy',
    desc: serviceData.desc || 'No description available.',
    features: serviceData.features || ['Premium Support', 'Tailored Solutions', 'Expert Advice'],
    projects: serviceData.projects || [],
    testimonials: serviceData.testimonials || [],
    tools: serviceData.tools || ['Modern Stack', 'Cloud Solutions'],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-primary font-bold mb-12 hover:gap-4 transition-all group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portfolio
        </Link>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants} className="max-w-4xl">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-[0.2em] rounded-full mb-6">
              {service.subtitle}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
              {service.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-light">
              {service.desc}
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 space-y-20">
              
              {/* Features section */}
              <section>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={20} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Core Capabilities</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {service.features.map((feature: string, idx: number) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center gap-4 p-6 bg-white rounded-3xl shadow-sm border border-gray-100 group transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                        <CheckCircle2 size={18} />
                      </div>
                      <span className="font-semibold text-gray-800">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Projects section */}
              {service.projects && service.projects.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Briefcase size={20} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Featured Projects</h2>
                  </div>
                  <div className="space-y-6">
                    {service.projects.map((proj: any, idx: number) => (
                      <div key={idx} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm group hover:shadow-xl transition-all duration-500">
                        <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                          {proj.title}
                          <ArrowLeft size={16} className="rotate-180 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                        </h4>
                        <p className="text-gray-600 leading-relaxed">{proj.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Testimonials section */}
              {service.testimonials && service.testimonials.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <MessageSquare size={20} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Success Stories</h2>
                  </div>
                  <div className="space-y-6">
                    {service.testimonials.map((test: any, idx: number) => (
                      <div key={idx} className="bg-primary/5 p-10 rounded-[40px] border border-primary/5 relative italic">
                        <p className="text-lg text-gray-800 mb-6 leading-relaxed">
                          "{test.quote}"
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-[2px] bg-primary/30" />
                          <span className="font-bold text-sm uppercase tracking-widest text-primary">{test.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-10">
              {/* Tech Stack */}
              {service.tools && service.tools.length > 0 && (
                <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <Layers size={20} className="text-primary" />
                    <h3 className="text-xl font-bold">Tech Stack</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {service.tools.map((tool: string, idx: number) => (
                      <span key={idx} className="px-5 py-2.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-2xl border border-gray-100">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact CTA */}
              <div className="p-10 bg-gray-900 text-white rounded-[40px] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">Start your project</h3>
                  <p className="text-gray-400 mb-10 leading-relaxed font-light">
                    Ready to elevate your business with our {service.title} expertise? Let's build something exceptional together.
                  </p>
                  <Link 
                    to="/"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-white hover:text-gray-900 transition-all group shadow-xl shadow-primary/20"
                    onClick={() => {
                      const contactSection = document.getElementById('contact');
                      if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Contact Now
                    <ArrowLeft size={20} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[80px]" />
              </div>

              {/* Rating */}
              <div className="p-8 bg-white rounded-[40px] border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Rating</span>
                </div>
                <div className="text-3xl font-black text-gray-900">5.0</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ServiceDetail;

