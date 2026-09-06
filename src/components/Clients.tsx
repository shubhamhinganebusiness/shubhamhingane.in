import React from 'react';
import { motion } from 'motion/react';
import { useSiteSettings, useCMSCollection } from '../hooks/useCMS';
import { useLanguage } from './LanguageContext';

export const Clients = () => {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const { items: dbClients } = useCMSCollection('clients');

  const title = settings?.headings?.clients?.title || "Awesome Clients";
  const subtitle = settings?.headings?.clients?.subtitle || "Popular Clients";

  const defaultClients = [
    { name: 'Google', image: 'https://logo.clearbit.com/google.com' },
    { name: 'Meta', image: 'https://logo.clearbit.com/meta.com' },
    { name: 'Apple', image: 'https://logo.clearbit.com/apple.com' },
    { name: 'Amazon', image: 'https://logo.clearbit.com/amazon.com' },
    { name: 'Netflix', image: 'https://logo.clearbit.com/netflix.com' },
    { name: 'Microsoft', image: 'https://logo.clearbit.com/microsoft.com' },
    { name: 'React', image: 'https://logo.clearbit.com/react.dev' },
    { name: 'Tailwind', image: 'https://logo.clearbit.com/tailwindcss.com' },
  ];

  const clients = dbClients.length > 0 ? dbClients : defaultClients;
  // Duplicate for seamless loop
  const duplicatedClients = [...clients, ...clients];

  return (
    <section id="clients" className="py-24 px-4 overflow-hidden border-t border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <span className="uppercase tracking-[2px] text-primary font-bold block mb-4 italic text-sm md:text-base">{subtitle}</span>
        <h2 className="text-4xl md:text-6xl font-extrabold mb-12 text-main-text">{title}</h2>
      </div>

      <div className="relative flex overflow-x-hidden group">
        {/* Left and Right Fade Overlays for better integration */}
        <div className="absolute left-0 top-0 w-20 md:w-40 h-full bg-gradient-to-r from-main-bg to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 w-20 md:w-40 h-full bg-gradient-to-l from-main-bg to-transparent z-10 pointer-events-none"></div>

        <motion.div
           className="flex gap-8 py-10"
           animate={{
             x: [0, -1920],
           }}
           transition={{
             x: {
               duration: 40,
               repeat: Infinity,
               ease: "linear",
             },
           }}
        >
          {duplicatedClients.map((client, idx) => (
            <div 
              key={idx} 
              className="flex-shrink-0 w-48 md:w-64 h-24 md:h-32 bg-surface card-shadow rounded-2xl p-6 flex items-center justify-center hover:bg-primary transition-all duration-400 group/item border border-gray-100 dark:border-gray-800"
            >
               <img 
                  src={client.image || (client as any).img} 
                  alt={client.name} 
                  loading="lazy"
                  className="max-w-full max-h-full object-contain grayscale dark:brightness-200 group-hover/item:grayscale-0 group-hover/item:brightness-0 group-hover/item:invert transition-all duration-300"
                  referrerPolicy="no-referrer"
               />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
