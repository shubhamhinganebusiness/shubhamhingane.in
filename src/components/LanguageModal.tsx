import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Check } from 'lucide-react';
import { Language } from '../translations';
import { useLanguage } from './LanguageContext';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; label: string; sub: string }[] = [
    { code: 'en', label: 'English', sub: 'Native expression' },
    { code: 'hi', label: 'हिंदी (Hindi)', sub: 'भारतीय भाषा' },
    { code: 'mr', label: 'मराठी (Marathi)', sub: 'प्रादेशिक भाषा' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-gray-100"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Globe size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Select Language</h2>
                      <p className="text-sm text-gray-500">Pick your preference</p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                        language === lang.code 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                          : 'bg-gray-50 hover:bg-white hover:card-shadow text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-bold text-lg">{lang.label}</span>
                        <span className={`text-xs ${language === lang.code ? 'text-white/80' : 'text-gray-400'}`}>
                          {lang.sub}
                        </span>
                      </div>
                      {language === lang.code && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"
                        >
                          <Check size={14} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <p className="text-xs text-center text-gray-400 font-medium">
                    The entire website will update automatically.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
