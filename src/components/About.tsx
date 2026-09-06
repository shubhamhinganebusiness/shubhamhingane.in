import React from 'react';
import { motion } from 'motion/react';
import { User, Sparkles, Code2, ShieldAlert, Award, Zap, CheckCircle2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';

export const About = () => {
  const { language } = useLanguage();
  const { settings } = useSiteSettings();

  // Local translations for high fidelity and modularity
  const localT = {
    en: {
      subtitle: 'Who I Am & How I Engineer',
      title: 'Interface Craftsman & Full-Stack Architect',
      desc1: 'Based in Pune, India, I specialize in building responsive, production-ready SaaS platforms, WebRTC live-streaming assets, and robust enterprise applications with near-zero initial latency.',
      desc2: 'What truly sets me apart is a business-first engineering focus. I don\'t just write code — I build high-performance, modular software architectures that align perfectly with enterprise needs and seamless user experiences.',
      experienceTitle: '3+ Years Expertise',
      experienceDesc: 'Continuous full-stack web and mobile systems development',
      satisfactionTitle: '100% Delivery Rate',
      satisfactionDesc: 'Consistently transforming complex requirements into reliable code',
      platformsTitle: '15+ SaaS Shipped',
      platformsDesc: 'Deployed production-grade web systems and modular dashboards',
      corePhilosophy: 'My Engineering Philosophy',
      p1: 'Typesafe by Default',
      p1Desc: 'Strict typing patterns to slash runtime exceptions by ~40%',
      p2: 'Performance-First',
      p2Desc: 'Optimized manual chunking, responsive images, and eager content preloading',
      p3: 'Granular Security',
      p3Desc: 'Bulletproof Firestore security tables and authenticated backend pathways'
    },
    hi: {
      subtitle: 'मैं कौन हूँ और मैं कैसे काम करता हूँ',
      title: 'इंटरफ़ेस शिल्पकार और फुल-स्टैक आर्किटेक्ट',
      desc1: 'पुणे, भारत में स्थित, मैं रिस्पॉन्सिव, प्रोडक्शन-रेडी SaaS प्लेटफॉर्म, WebRTC लाइव-स्ट्रीमिंग एसेट्स और मजबूत एंटरप्राइज एप्लिकेशन बनाने में विशेषज्ञता रखता हूं।',
      desc2: 'जो चीज़ मुझे वास्तव में अलग बनाती है वह है बिजनेस-फर्स्ट इंजीनियरिंग फोकस। मैं केवल कोड नहीं लिखता - मैं उच्च-प्रदर्शन, मॉड्यूलर सॉफ्टवेयर आर्किटेक्चर बनाता हूं जो जरूरतों के साथ पूरी तरह से मेल खाता है।',
      experienceTitle: '3+ वर्ष का अनुभव',
      experienceDesc: 'निरंतर फुल-स्टैक वेब और मोबाइल सिस्टम विकास',
      satisfactionTitle: '100% सफल डिलीवरी',
      satisfactionDesc: 'जटिल आवश्यकताओं को हमेशा विश्वसनीय कोड में बदलना',
      platformsTitle: '15+ SaaS प्रोजेक्ट्स',
      platformsDesc: 'उत्पादन-तैयार वेब सिस्टम और मॉड्यूलर डैशबोर्ड तैनात किए गए',
      corePhilosophy: 'मेरा इंजीनियरिंग सिद्धांत',
      p1: 'डिफ़ॉल्ट रूप से टाइप-सेफ',
      p1Desc: 'रनटाइम एरर को 40% तक कम करने के लिए सख्त टाइपिंग पाथवे',
      p2: 'प्रदर्शन पहले',
      p2Desc: 'अनुकूलित बंडलिंग, त्वरित इमेज प्रीलोड और न्यूनतम लेटेंसी',
      p3: 'मजबूत सुरक्षा',
      p3Desc: 'कस्टम फायरस्टोर सुरक्षा नियम और सुरक्षित एपीआई रूट'
    },
    mr: {
      subtitle: 'मी कोण आहे आणि मी कसे काम करतो',
      title: 'इंटरफेस डिझायनर आणि फुल-स्टॅक आर्किटेक्ट',
      desc1: 'पुणे, भारत येथे स्थित, मी अत्यंत वेगवान SaaS प्लॅटफॉर्म, WebRTC लाइव्ह-स्ट्रीमिंग टूल्स आणि मजबूत एंटरप्राइझ ॲप्लिकेशन्स तयार करण्यात तज्ञ आहे.',
      desc2: 'मला इतरांपेक्षा वेगळे बनवते ते म्हणजे बिझनेस-फर्स्ट इंजिनिअरिंग फोकस. मी फक्त कोड लिहीत नाही - मी उच्च-कार्यक्षमता आणि स्केलेबल सॉफ्टवेअर आर्किटेक्चर तयार करतो.',
      experienceTitle: '3+ वर्षे अनुभव',
      experienceDesc: 'फुल-स्टॅक वेब आणि मोबाईल सिस्टीमचा निरंतर विकास',
      satisfactionTitle: '100% यशस्वी वितरण',
      satisfactionDesc: 'क्लिष्ट आवश्यकतांचे नेहमी विश्वासार्ह कोडमध्ये रूपांतर',
      platformsTitle: '15+ यशस्वी SaaS',
      platformsDesc: 'प्रॉडक्शन-ग्रेड वेब सिस्टीम आणि डॅशबोर्ड यशस्वीपणे तैनात',
      corePhilosophy: 'माझे इंजिनिअरिंग तत्त्वज्ञान',
      p1: 'बाय डीफॉल्ट टाईप-सेफ',
      p1Desc: 'रनटाइम एरर ४०% पर्यंत कमी करण्यासाठी कडक टायपिंग',
      p2: 'परफॉर्मन्सला प्राधान्य',
      p2Desc: 'बंडल ऑप्टिमायझेशन, वेगवान इमेज प्रीलोड आणि कमीत कमी लेटेंसी',
      p3: 'मजबूत सुरक्षा',
      p3Desc: 'कस्टम फायरस्टोअर नियम आणि सुरक्षित एपीआय राउट्स'
    }
  };

  // Safe fallback if language string doesn't match keys
  const langKey = (language === 'hi' || language === 'mr') ? language : 'en';
  const text = localT[langKey];

  return (
    <section id="about" className="py-24 px-4 md:px-8 max-w-7xl mx-auto border-t border-gray-150 dark:border-gray-800">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Grid: Visual Badge & Real stats */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 space-y-8"
        >
          <div className="relative p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-br from-surface to-surface/85 border border-gray-100 dark:border-zinc-800/80 card-shadow overflow-hidden">
            
            {/* Visual background pattern */}
            <div className="absolute right-0 top-0 text-primary/5 dark:text-primary/10 select-none pointer-events-none">
              <User size={300} strokeWidth={1} />
            </div>

            <div className="relative z-10 space-y-8 text-left">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary card-shadow">
                <Sparkles size={28} />
              </div>

              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Shubham Hingane</h3>
                <p className="text-xs uppercase tracking-widest text-primary font-black">Pune, MH, India</p>
              </div>

              <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-zinc-800/80">
                
                {/* Stat 1 */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 flex-shrink-0">
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200">{text.experienceTitle}</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{text.experienceDesc}</p>
                  </div>
                </div>

                {/* Stat 2 */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200">{text.satisfactionTitle}</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{text.satisfactionDesc}</p>
                  </div>
                </div>

                {/* Stat 3 */}
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Code2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-800 dark:text-zinc-200">{text.platformsTitle}</h4>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{text.platformsDesc}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Grid: Text Narrative & Philosophies */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-7 space-y-8 text-left"
        >
          <div>
            <span className="uppercase tracking-[3px] text-primary font-bold block mb-4 italic text-sm">
              {text.subtitle}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-main-text mb-6">
              {text.title}
            </h2>
            <p className="text-gray-600 dark:text-zinc-300 text-lg leading-relaxed mb-6">
              {text.desc1}
            </p>
            <p className="text-gray-500 dark:text-zinc-400 text-base leading-relaxed">
              {text.desc2}
            </p>
          </div>

          <div className="pt-8 border-t border-gray-150 dark:border-zinc-800/80">
            <h3 className="text-lg font-extrabold text-main-text uppercase tracking-wider mb-6 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" />
              {text.corePhilosophy}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-5 rounded-2xl bg-surface/50 border border-gray-100 dark:border-zinc-800/50">
                <span className="block font-black text-sm text-gray-800 dark:text-zinc-200 mb-1">{text.p1}</span>
                <span className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal block">{text.p1Desc}</span>
              </div>

              <div className="p-5 rounded-2xl bg-surface/50 border border-gray-100 dark:border-zinc-800/50">
                <span className="block font-black text-sm text-gray-800 dark:text-zinc-200 mb-1">{text.p2}</span>
                <span className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal block">{text.p2Desc}</span>
              </div>

              <div className="p-5 rounded-2xl bg-surface/50 border border-gray-100 dark:border-zinc-800/50">
                <span className="block font-black text-sm text-gray-800 dark:text-zinc-200 mb-1">{text.p3}</span>
                <span className="text-[11px] text-gray-500 dark:text-zinc-400 leading-normal block">{text.p3Desc}</span>
              </div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
