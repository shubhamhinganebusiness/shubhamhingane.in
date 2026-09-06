import React, { useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { useSiteSettings } from '../hooks/useCMS';
import { motion } from 'motion/react';

export const TypingText = () => {
  const { t } = useLanguage();
  const { settings, loading } = useSiteSettings();
  const texts = (settings?.heroSkills && settings.heroSkills.length > 0) ? settings.heroSkills : t.hero.typing;
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    setDisplayedText("");
    setCurrentTextIndex(0);
    setIsDeleting(false);
  }, [t]);

  useEffect(() => {
    const handleTyping = () => {
      if (!texts || texts.length === 0) return;
      const currentFullText = texts[currentTextIndex];
      if (!currentFullText) return;
      
      if (!isDeleting) {
        setDisplayedText(currentFullText.substring(0, displayedText.length + 1));
        setTypingSpeed(50 + Math.random() * 25); // Faster, snappy natural variance

        if (displayedText.length === currentFullText.length) {
          setIsDeleting(true);
          setTypingSpeed(1500); // 1.5 second pause instead of stagnant 3 seconds
        }
      } else {
        setDisplayedText(currentFullText.substring(0, displayedText.length - 1));
        setTypingSpeed(30); // Faster delete speed

        if (displayedText.length === 0) {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
          setTypingSpeed(300); // Brisk pause before writing next word
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentTextIndex, texts, typingSpeed]);

  return (
    <div className="relative inline-flex items-center min-w-[300px] md:min-w-[450px] min-h-[60px] md:min-h-[80px]">
      {/* Dynamic Background Glow Layer 1 */}
      <motion.div 
        className="absolute -inset-x-12 -inset-y-6 bg-primary/20 rounded-full blur-[40px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Secondary Accent Glow */}
      <motion.div 
        className="absolute -inset-x-4 -inset-y-2 bg-blue-500/10 rounded-full blur-[20px]"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div 
        className="relative z-10 flex items-center cursor-default overflow-visible"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex flex-wrap items-center">
          <span className="relative font-black text-3xl md:text-5xl lg:text-5xl tracking-normal whitespace-nowrap select-none text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-primary bg-[length:200%_auto] animate-gradient-slow drop-shadow-sm leading-none py-1">
            {displayedText || '\u00A0'}
            {/* Soft backdrop bloom effect */}
            <span 
              className="absolute inset-0 text-primary/30 blur-[8px] select-none pointer-events-none translate-y-0.5"
              aria-hidden="true"
            >
              {displayedText}
            </span>
          </span>
        </div>
        
        {/* Advanced Kinetic Cursor */}
        <motion.div 
          animate={{ 
            opacity: [1, 0.5, 1],
            height: ["1.2em", "0.8em", "1.2em"],
            boxShadow: [
              "0 0 10px var(--color-primary)",
              "0 0 25px var(--color-primary)",
              "0 0 10px var(--color-primary)"
            ]
          }}
          transition={{ 
            duration: 0.6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="ml-3 w-[6px] md:w-[8px] bg-primary rounded-full relative"
        >
          <div className="absolute inset-0 bg-white opacity-40 blur-[1px] rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  );
};
