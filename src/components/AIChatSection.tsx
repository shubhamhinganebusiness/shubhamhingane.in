import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, ArrowRight, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { getGeminiResponse } from '../services/geminiService';
import { useLocation } from 'react-router-dom';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AIChatSectionProps {
  onClose?: () => void;
  isFloating?: boolean;
}

export const AIChatSection: React.FC<AIChatSectionProps> = ({ onClose, isFloating }) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (isFloating) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages, isFloating]);

  useEffect(() => {
    if (messages.length === 0) {
      const getName = () => {
        if (!user) return '';
        const adminEmails = ['jamkhednewsnetwork@gmail.com', 'shubhamhingane7719@gmail.com', 'shubhamingane7719@gmail.com', '771999595@admin.com'];
        if (adminEmails.includes(user.email || '')) {
          return 'Shubham Hingane';
        }
        return user.displayName || user.email?.split('@')[0] || '';
      };

      const name = getName();
      const welcome = t.chatbot.welcome as string;
      const personalizedWelcome = user 
        ? (t.chatbot.welcomeUser as string).replace('{name}', name) + welcome
        : welcome;

      setMessages([{ role: 'ai', content: personalizedWelcome }]);
    }
  }, [user, t.chatbot]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await getGeminiResponse(userMessage, t, language);
      setMessages(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: t.chatbot.error }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFloating) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="p-6 bg-primary text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none mb-1">{t.aiChat.title}</h3>
              <p className="text-xs text-white/70">Online & Ready to Help</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="hover:bg-white/10 p-2 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 dark:bg-gray-800/30">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none italic'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-xs text-gray-400 font-medium">AI is conceptualizing...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatbot.placeholder}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-main-text"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-4 bg-primary text-white rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/30 cursor-pointer"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <section id="ai-chat" className="py-20 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

          <div className="relative bg-gray-50 dark:bg-gray-800 rounded-[40px] p-8 md:p-16 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider mb-6">
                  <Sparkles size={16} />
                  {t.aiChat.subtitle}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-gray-900 dark:text-white leading-tight">
                  {t.aiChat.title}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-lg">
                  {t.aiChat.desc}
                </p>
                <button
                  onClick={() => {
                    const fab = document.querySelector('button[aria-label="Open AI Assistant"]') as HTMLButtonElement;
                    if (fab) fab.click();
                  }}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:brightness-110 transition-all shadow-xl hover:shadow-primary/30 group cursor-pointer"
                >
                  {t.aiChat.cta}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="relative z-10 bg-white dark:bg-gray-900 p-8 rounded-[32px] shadow-2xl border border-gray-100 dark:border-gray-700">
                  <div className="space-y-6">
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none text-sm text-gray-700 dark:text-gray-300 max-w-[80%]">
                        Hello! How can I help you today?
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-primary p-4 rounded-2xl rounded-tr-none text-sm text-white max-w-[80%]">
                        Tell me about Shubham's software development experience.
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none text-sm text-gray-700 dark:text-gray-300 max-w-[80%] italic">
                        Shubham has over 7 years of experience in full-stack development, specializing in React, Node.js, and cloud technologies...
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Decorative Chat Bubbles */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg animate-bounce">
                  <Sparkles size={20} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
