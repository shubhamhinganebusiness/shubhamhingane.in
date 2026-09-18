import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, ArrowRight, Zap, Shield, Sparkles, Server, 
  Tv, Smartphone, Globe, MessageSquare, Flame, CheckCircle2
} from 'lucide-react';

export interface NewsPackageTier {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  popular?: boolean;
  timeline: string;
  deliverables: string[];
  specs: {
    portal: string;
    apps: string;
    monetization: string;
    compliance: string;
  };
}

interface NewsTierPackagesProps {
  onSelectTier: (tier: NewsPackageTier) => void;
}

export const NewsTierPackages: React.FC<NewsTierPackagesProps> = ({ onSelectTier }) => {
  const [selectedId, setSelectedId] = useState<string>('regional');

  const tiers: NewsPackageTier[] = [
    {
      id: 'hyperlocal',
      name: 'Hyperlocal Digital Portal',
      tagline: 'Ideal for city, taluka, or district-level breaking news startups & digital dailies.',
      badge: 'Fast Launch (7 Days)',
      popular: false,
      timeline: '7 - 10 Business Days',
      deliverables: [
        'Ultra-fast AMP/PWA News Portal (<0.8s load)',
        'Marathi / Hindi / English Unicode CMS',
        'Auto WhatsApp Channel Broadcast Integration',
        'Google News Sitemap & Instant Indexing XML',
        'AdSense Banner Slot Architecture',
        'Digital Reporter ID Card Print Engine'
      ],
      specs: {
        portal: 'Fast Cloud Web (100k reads/mo)',
        apps: 'Web PWA (Installable)',
        monetization: 'Google AdSense + Local Ads',
        compliance: 'Press Registry & Copyright Kit'
      }
    },
    {
      id: 'regional',
      name: 'Regional Broadcaster & App',
      tagline: 'Full-stack media suite for district/state networks with high-velocity mobile audience.',
      badge: 'Most Popular',
      popular: true,
      timeline: '12 - 15 Business Days',
      deliverables: [
        'Everything in Hyperlocal Portal',
        'Dedicated Android Native App (.apk + Play Store Ready)',
        'Breaking News Push Notifications Engine',
        'YouTube Live OBS Studio Lower-Thirds & Tickers',
        'Sub-Editor Multi-Tier Role Permissions',
        'RNI Title Search & Verified Filing Documentation',
        'Video News Carousel & Reels Short-Video Format'
      ],
      specs: {
        portal: 'Multi-Core Dedicated Cloud (1M+ reads)',
        apps: 'Native Android + PWA',
        monetization: 'AdSense + Taboola + Sponsored PR',
        compliance: 'RNI Title Verification & Affidavits'
      }
    },
    {
      id: 'enterprise',
      name: 'National Enterprise Network',
      tagline: 'Broadcast-grade infrastructure for 24x7 satellite/digital live channels & media houses.',
      badge: 'Broadcast Grade',
      popular: false,
      timeline: '21 - 30 Business Days',
      deliverables: [
        'Everything in Regional Broadcaster',
        'Android + iOS Native App Deployments',
        'WebRTC 24/7 Low-Latency Live TV Video Streamer',
        'Custom Broadcast Studio Lower-Thirds Graphics Suite',
        'Automated Watermarked Social Banner Generator',
        'Full RNI / MIB Compliance Legal Advisory & Filings',
        'Direct Advertiser Self-Serve Booking Portal'
      ],
      specs: {
        portal: 'Distributed Enterprise CDN (Unlimited)',
        apps: 'iOS & Android Native Apps',
        monetization: 'Direct Programmatic + Video Pre-rolls',
        compliance: 'Full RNI + Legal Advisory'
      }
    }
  ];

  return (
    <div className="w-full">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20 inline-flex items-center gap-1.5 mb-2">
          <Sparkles size={12} className="animate-pulse" />
          Turnkey Media Infrastructure
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Select Your Media Startup Tier
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Production-grade newsroom portals, legal advisory, and high-velocity mobile delivery built to monetize from Day 1.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
        {tiers.map((tier) => {
          const isSelected = selectedId === tier.id;

          return (
            <motion.div
              key={tier.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedId(tier.id)}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-pointer relative transition-all duration-300 ${
                tier.popular
                  ? 'bg-surface dark:bg-zinc-900 border-2 border-primary shadow-2xl shadow-primary/10 ring-4 ring-primary/10'
                  : 'bg-surface dark:bg-zinc-900/80 border border-gray-200/80 dark:border-zinc-800 shadow-lg'
              } ${isSelected ? 'scale-[1.01]' : ''}`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  tier.popular 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300'
                }`}>
                  {tier.badge}
                </span>

                <span className="text-[11px] font-mono font-bold text-gray-400">
                  {tier.timeline}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="mb-6">
                <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {tier.name}
                </h4>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {tier.tagline}
                </p>
              </div>

              {/* Specs pill preview */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-700/60 text-[11px] mb-6 font-medium">
                <div>
                  <span className="text-gray-400 uppercase text-[9px] font-bold block">Capacity</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold line-clamp-1">{tier.specs.portal}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[9px] font-bold block">Mobile App</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold line-clamp-1">{tier.specs.apps}</span>
                </div>
              </div>

              {/* Deliverables checklist */}
              <div className="space-y-3 mb-8 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  What's Included
                </span>
                {tier.deliverables.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300">
                    <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectTier(tier);
                }}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  tier.popular
                    ? 'bg-primary text-white shadow-xl shadow-primary/25 hover:brightness-110 active:scale-98'
                    : 'bg-gray-100 dark:bg-zinc-800 hover:bg-primary hover:text-white text-gray-800 dark:text-gray-200 active:scale-98'
                }`}
              >
                <span>Select & Get Proposal</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
