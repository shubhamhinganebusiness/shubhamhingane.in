import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, X, Check, ArrowRight, MessageCircle, Clock, 
  Sparkles, ShieldCheck, DollarSign, Calendar, RefreshCw, Send,
  Cpu, Database, Smartphone, Layers, CheckCircle2, Copy, Trophy
} from 'lucide-react';

interface ProjectCostEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCurrency?: 'INR' | 'USD';
  initialProjectType?: string;
}

interface ProjectTypeOption {
  id: string;
  name: string;
  desc: string;
  icon: any;
  basePriceINR: number;
  basePriceUSD: number;
  baseDays: number;
  popular?: boolean;
}

interface FeatureOption {
  id: string;
  name: string;
  desc: string;
  priceINR: number;
  priceUSD: number;
  extraDays: number;
  category: 'core' | 'live' | 'integrations';
}

export const ProjectCostEstimatorModal: React.FC<ProjectCostEstimatorModalProps> = ({
  isOpen,
  onClose,
  defaultCurrency = 'INR',
  initialProjectType = 'custom_saas'
}) => {
  const [currency, setCurrency] = useState<'INR' | 'USD'>(defaultCurrency);
  const [selectedType, setSelectedType] = useState<string>(initialProjectType || 'custom_saas');

  React.useEffect(() => {
    if (initialProjectType && isOpen) {
      setSelectedType(initialProjectType);
    }
  }, [initialProjectType, isOpen]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'realtime_db',
    'rbac_auth',
    'whatsapp_alerts'
  ]);
  const [timelineMode, setTimelineMode] = useState<'standard' | 'express'>('standard');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [copied, setCopied] = useState(false);

  // Available Project archetypes
  const projectTypes: ProjectTypeOption[] = [
    {
      id: 'cricket_erp',
      name: 'GullyScore / Sports Tournament ERP',
      desc: 'Live ball-by-ball scoreboard, spectator arena, OBS broadcast overlay & tournament hierarchy.',
      icon: Trophy,
      basePriceINR: 24999,
      basePriceUSD: 399,
      baseDays: 14,
      popular: true
    },
    {
      id: 'custom_saas',
      name: 'Custom SaaS / Business Dashboard',
      desc: 'Multi-tenant cloud portal with automated workflows, analytics charts & real-time sync.',
      icon: Layers,
      basePriceINR: 29999,
      basePriceUSD: 499,
      baseDays: 18,
      popular: true
    },
    {
      id: 'dairy_agro',
      name: 'Dairy / Agro / Retail ERP Suite',
      desc: 'Farmer billing, FAT/SNF rate chart calculation, milk collection slips & inventory tracking.',
      icon: Cpu,
      basePriceINR: 21999,
      basePriceUSD: 349,
      baseDays: 12
    },
    {
      id: 'id_graphics',
      name: 'Automated ID Card & Graphic Generator',
      desc: 'Instant 300 DPI batch badge printing, barcode/QR rendering & CSV student/staff importer.',
      icon: Smartphone,
      basePriceINR: 17999,
      basePriceUSD: 299,
      baseDays: 10
    },
    {
      id: 'portfolio_landing',
      name: 'High-Impact Brand / Landing Site',
      desc: '3D animations, ultra-fast 100/100 Lighthouse score, SEO dominance & lead capture.',
      icon: Sparkles,
      basePriceINR: 11999,
      basePriceUSD: 199,
      baseDays: 7
    }
  ];

  // Optional add-ons
  const availableFeatures: FeatureOption[] = [
    {
      id: 'realtime_db',
      name: 'Real-Time Edge Sync (WebSockets / Firestore)',
      desc: 'Zero-latency multi-device sync for thousands of concurrent users.',
      priceINR: 4999,
      priceUSD: 79,
      extraDays: 3,
      category: 'live'
    },
    {
      id: 'rbac_auth',
      name: 'Multi-Role User Auth & Granular Permissions',
      desc: 'Super Admin, Manager, Scorer, and Public spectator roles with JWT/Firebase auth.',
      priceINR: 3999,
      priceUSD: 59,
      extraDays: 2,
      category: 'core'
    },
    {
      id: 'payment_gateway',
      name: 'Razorpay / Stripe Payment Integration',
      desc: 'UPI, Credit Cards, NetBanking, auto-invoicing & instant webhooks.',
      priceINR: 5999,
      priceUSD: 89,
      extraDays: 3,
      category: 'integrations'
    },
    {
      id: 'whatsapp_alerts',
      name: 'Automated WhatsApp & SMS Notifications',
      desc: 'Instant match updates, billing receipts & OTP alerts sent straight to WhatsApp.',
      priceINR: 3499,
      priceUSD: 49,
      extraDays: 2,
      category: 'integrations'
    },
    {
      id: 'ai_gemini',
      name: 'Gemini AI Assistant & Automated Reporting',
      desc: 'AI-generated match commentary, smart data insights & automated summary generator.',
      priceINR: 6999,
      priceUSD: 109,
      extraDays: 4,
      category: 'core'
    },
    {
      id: 'pdf_excel_export',
      name: 'Automated PDF / Excel / Canvas Card Export',
      desc: '1-click export of tournament brackets, billing ledgers, and social media posters.',
      priceINR: 2999,
      priceUSD: 45,
      extraDays: 2,
      category: 'core'
    }
  ];

  const currentType = useMemo(() => {
    return projectTypes.find(t => t.id === selectedType) || projectTypes[0];
  }, [selectedType]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]
    );
  };

  // Calculations
  const { totalPrice, totalDays } = useMemo(() => {
    const baseP = currency === 'INR' ? currentType.basePriceINR : currentType.basePriceUSD;
    let featCost = 0;
    let extraDays = 0;

    selectedFeatures.forEach(fId => {
      const feat = availableFeatures.find(f => f.id === fId);
      if (feat) {
        featCost += currency === 'INR' ? feat.priceINR : feat.priceUSD;
        extraDays += feat.extraDays;
      }
    });

    let subtotal = baseP + featCost;
    let days = currentType.baseDays + extraDays;

    // Express mode: 25% surcharge, compressed timeline by 40%
    if (timelineMode === 'express') {
      subtotal = Math.round(subtotal * 1.25);
      days = Math.max(5, Math.round(days * 0.6));
    }

    return { totalPrice: subtotal, totalDays: days };
  }, [currency, currentType, selectedFeatures, timelineMode]);

  // Construct formatted proposal text
  const proposalSummary = useMemo(() => {
    const selectedFeatureNames = selectedFeatures
      .map(id => availableFeatures.find(f => f.id === id)?.name)
      .filter(Boolean)
      .join('\n• ');

    const priceText = currency === 'INR' ? `₹${totalPrice.toLocaleString('en-IN')}` : `$${totalPrice.toLocaleString('en-US')}`;

    return `*Project Inquiry from Portfolio:*
*Project Type:* ${currentType.name}
*Timeline Speed:* ${timelineMode === 'express' ? '⚡ Express Track' : '🗓️ Standard Delivery'} (~${totalDays} working days)
*Estimated Investment:* ${priceText}

*Selected Architecture & Modules:*
• ${selectedFeatureNames || 'Standard Base System'}

*Client Contact:* ${clientName || 'Direct Inquiry'}${clientPhone ? ` (${clientPhone})` : ''}
_Generated via Shubham Hingane's Cost Estimator_`;
  }, [currentType, timelineMode, totalDays, totalPrice, currency, selectedFeatures, clientName, clientPhone]);

  const handleSendWhatsApp = () => {
    const phone = '7719959593';
    const encoded = encodeURIComponent(proposalSummary);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-left"
          id="project-cost-estimator-drawer"
        >
          {/* Top Bar Header */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-950/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <Calculator size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Project Cost & Timeline Estimator</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/20 uppercase tracking-wider">
                    Instant Scope
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                  Transparent, value-driven pricing tailored for high-performance delivery.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Currency Toggle */}
              <div className="flex items-center bg-slate-200/80 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    currency === 'INR'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  ₹ INR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    currency === 'USD'
                      ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                  }`}
                >
                  $ USD
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer border-none"
                aria-label="Close Estimator"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Step 1: Project Archetype */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</span>
                  <span>Select Primary Architecture</span>
                </label>
                <span className="text-[11px] font-bold text-slate-400">Step 1 of 3</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {projectTypes.map(t => {
                  const Icon = t.icon;
                  const isSelected = selectedType === t.id;
                  const price = currency === 'INR' ? `₹${t.basePriceINR.toLocaleString('en-IN')}` : `$${t.basePriceUSD}`;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedType(t.id)}
                      className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-primary/[0.04] dark:bg-primary/[0.08] border-primary shadow-sm shadow-primary/10'
                          : 'bg-white dark:bg-zinc-950/60 border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {t.popular && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Popular
                        </span>
                      )}

                      <div className="space-y-1.5 pr-8">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                          {t.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {t.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <span className="font-mono font-black text-slate-900 dark:text-white">
                          From {price}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> {t.baseDays}d
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Add-On Features */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</span>
                  <span>Select Modular Add-Ons</span>
                </label>
                <span className="text-[11px] font-bold text-slate-400">{selectedFeatures.length} selected</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableFeatures.map(f => {
                  const isChecked = selectedFeatures.includes(f.id);
                  const price = currency === 'INR' ? `+₹${f.priceINR.toLocaleString('en-IN')}` : `+$${f.priceUSD}`;

                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFeature(f.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        isChecked
                          ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08] border-emerald-500/60 dark:border-emerald-500/40'
                          : 'bg-white dark:bg-zinc-950/60 border-slate-200/80 dark:border-zinc-800/80 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isChecked ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-zinc-700'
                      }`}>
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {f.name}
                          </span>
                          <span className="text-[11px] font-mono font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                            {price}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-snug">
                          {f.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Timeline Urgency & Optional Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">3</span>
                  <span>Timeline Urgency</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setTimelineMode('standard')}
                    className={`p-3 rounded-2xl border cursor-pointer text-left transition-all ${
                      timelineMode === 'standard'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                      <Calendar size={14} className="text-primary" />
                      <span>Standard Pace</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Normal sprint (~{totalDays} days)</span>
                  </div>

                  <div
                    onClick={() => setTimelineMode('express')}
                    className={`p-3 rounded-2xl border cursor-pointer text-left transition-all ${
                      timelineMode === 'express'
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>Express Sprint</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">Compressed timeline (+25%)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-extrabold text-slate-400 block mb-2.5">
                  Your Details (Optional for WhatsApp Spec)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name / Org"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                  />
                  <input
                    type="tel"
                    placeholder="Phone / WhatsApp"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-primary text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Estimated Investment
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {currency === 'INR' ? `₹${totalPrice.toLocaleString('en-IN')}` : `$${totalPrice.toLocaleString('en-US')}`}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    / ~{totalDays} days
                  </span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-zinc-800 text-[11px] text-slate-500 font-medium">
                <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                <span>Includes Source Code, Cloud Setup & 30-Day Post-Launch Support</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy proposal specification to clipboard"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Spec'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
              >
                <MessageCircle size={15} />
                <span>Discuss on WhatsApp</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
