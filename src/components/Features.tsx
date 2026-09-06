import React from 'react';
import { Link } from 'react-router-dom';
import { Code, Smartphone, Globe, Monitor, Video, Megaphone, ArrowRight } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { useLanguage } from './LanguageContext';
import { useCMSCollection, useSiteSettings } from '../hooks/useCMS';

const iconMap: Record<string, any> = {
  Code, Smartphone, Globe, Monitor, Video, Megaphone
};

export const Features = () => {
  const { t } = useLanguage();
  const { items: dbServices } = useCMSCollection('services');
  const { settings } = useSiteSettings();

  const title = settings?.headings?.features?.title || t.features.title;
  const subtitle = settings?.headings?.features?.subtitle || t.features.subtitle;

  const defaultFeatures = [
    { id: 'software-development', title: t.features.cards.software.title, desc: t.features.cards.software.desc, iconName: 'Code' },
    { id: 'app-development', title: t.features.cards.app.title, desc: t.features.cards.app.desc, iconName: 'Smartphone' },
    { id: 'website-development', title: t.features.cards.web.title, desc: t.features.cards.web.desc, iconName: 'Globe' },
    { id: 'media-broadcasting', title: t.features.cards.media.title, desc: t.features.cards.media.desc, iconName: 'Monitor' },
    { id: 'video-editing', title: t.features.cards.video.title, desc: t.features.cards.video.desc, iconName: 'Video' },
    { id: 'digital-marketing', title: t.features.cards.marketing.title, desc: t.features.cards.marketing.desc, iconName: 'Megaphone' },
  ];

  const features = dbServices.length > 0 ? dbServices : defaultFeatures;

  return (
    <section id="features" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-16">
        <span className="uppercase tracking-[2px] text-primary font-bold block mb-4">{subtitle}</span>
        <h2 className="text-4xl md:text-6xl font-extrabold text-main-text">{title}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => {
          const Icon = iconMap[feature.iconName] || Globe;
          return (
            <Link to={`/service/${feature.id}`} key={idx}>
              <TiltCard>
                <article className="h-full flex flex-col items-start text-left">
                  <div className="mb-8 text-primary group-hover:text-white transition-all duration-300">
                    <Icon size={48} strokeWidth={1} aria-hidden="true" />
                  </div>
                  <h3 className="text-2xl font-bold mb-6 text-main-text group-hover:text-white transition-all duration-300">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 group-hover:text-white transition-all duration-300 leading-relaxed">
                    {feature.desc}
                  </p>
                  <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0">
                    <ArrowRight size={32} className="text-primary group-hover:text-white" aria-hidden="true" />
                  </div>
                </article>
              </TiltCard>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

