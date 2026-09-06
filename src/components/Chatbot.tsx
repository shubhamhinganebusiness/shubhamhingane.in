import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { getGeminiResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export const Chatbot = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track active section for dynamic greetings
  useEffect(() => {
    if (location.pathname !== '/') return;

    const sections = ['features', 'portfolio', 'courses', 'resume', 'testimonial', 'clients', 'blog', 'contact'];
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Also track the hero/top
    const heroElement = document.querySelector('section'); // assuming the first section is hero
    if (heroElement) observer.observe(heroElement);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [location.pathname]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeKey: keyof typeof t.chatbot = 'welcome';
      
      if (location.pathname.startsWith('/service/')) {
        welcomeKey = 'welcomeFeatures';
      } else if (location.pathname.startsWith('/course/')) {
        welcomeKey = 'welcomeFeatures'; // or add specific welcomeCourse if desired
      } else if (location.pathname.startsWith('/project/')) {
        welcomeKey = 'welcomePortfolio';
      } else if (location.pathname === '/') {
        switch (activeSection) {
          case 'features':
            welcomeKey = 'welcomeFeatures';
            break;
          case 'portfolio':
            welcomeKey = 'welcomePortfolio';
            break;
          case 'courses':
            welcomeKey = 'welcomeFeatures'; // Reuse features greeting or add specific one
            break;
          case 'resume':
            welcomeKey = 'welcomeResume';
            break;
          case 'testimonial':
          case 'clients':
          case 'blog':
            welcomeKey = 'welcomePortfolio';
            break;
          case 'contact':
            welcomeKey = 'welcomeContact';
            break;
          default:
            welcomeKey = 'welcomeHero';
        }
      }

      const getName = () => {
        if (!user) return '';
        if (user.email === 'jamkhednewsnetwork@gmail.com' || user.email === 'shubhamhingane7719@gmail.com' || user.email === 'shubhamingane7719@gmail.com' || user.email === '771999595@admin.com') {
          return 'Shubham Hingane';
        }
        return user.displayName || user.email?.split('@')[0] || '';
      };

      const name = getName();
      const baseWelcome = t.chatbot[welcomeKey] as string;
      const personalizedWelcome = user 
        ? (t.chatbot.welcomeUser as string).replace('{name}', name) + baseWelcome
        : baseWelcome;

      setMessages([{ 
        role: 'ai', 
        content: personalizedWelcome
      }]);
    }
  }, [isOpen, t.chatbot, messages.length, location.pathname, activeSection, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Pass the entire translation object as context
      const response = await getGeminiResponse(userMessage, t, language);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: t.chatbot.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed box-shadow-lg bottom-8 right-8 z-[70] w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform focus:outline-none"
        aria-label="Open AI Assistant"
      >
        {isOpen ? <X size={32} /> : <MessageSquare size={32} />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 z-[70] w-[90vw] md:w-[400px] h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-primary text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none mb-1">{t.chatbot.title}</h3>
                  <p className="text-xs text-white/70">Online & Ready to Help</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/10 p-2 rounded-full transition-colors"
                aria-label="Close Chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none italic'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span className="text-xs text-gray-400 font-medium">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-100 flex items-center gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.chatbot.placeholder}
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 bg-primary text-white rounded-xl hover:brightness-110 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 cursor-pointer"
              >
                <Send size={20} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
