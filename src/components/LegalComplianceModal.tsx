import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface LegalComplianceModalProps {
  isOpen: boolean;
  activeDoc: 'privacy' | 'terms' | 'nda' | null;
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  activeDoc,
  onClose,
}) => {
  if (!isOpen || !activeDoc) return null;

  const docs = {
    privacy: {
      title: 'Privacy Policy & Data Protection',
      subtitle: 'Commitment to strict client confidentiality and zero unauthorized tracking',
      icon: ShieldCheck,
      content: [
        {
          heading: '1. Information We Collect',
          body: 'We only collect client contact information (name, business email, WhatsApp number, project specifications) voluntarily submitted through our intake forms or direct messaging channels for the sole purpose of consultation and technical project execution.'
        },
        {
          heading: '2. Zero-Spam & Third-Party Selling Guarantee',
          body: 'We will never sell, rent, monetize, or disclose your personal or enterprise information to advertising brokers, marketing affiliates, or unauthorized third parties.'
        },
        {
          heading: '3. Data Security & Storage',
          body: 'All communications, project briefs, and database records are securely stored on Google Cloud Firebase infrastructure with strict security rules, memory caching, and SSL/TLS encryption in transit.'
        },
        {
          heading: '4. Data Access & Erasure',
          body: 'Clients may request complete erasure or export of their submitted project specifications and contact records at any time by emailing shubhamhingane7719@gmail.com.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service & Engineering Engagement',
      subtitle: 'Standard operating framework for consulting, milestone development, and delivery',
      icon: FileText,
      content: [
        {
          heading: '1. Project Scope & Milestones',
          body: 'All client development projects operate under agreed milestone deliverables with transparent architectural scopes, timelines, and technical requirements defined prior to development kickoff.'
        },
        {
          heading: '2. Intellectual Property & Code Ownership',
          body: 'Upon completion of payment milestones, 100% of all custom production source code, assets, database schemas, and documentation are transferred unconditionally to the client.'
        },
        {
          heading: '3. Warranties & Post-Launch Support',
          body: 'All custom software solutions include a standard 30-day post-deployment stabilization and bug-fix warranty to ensure production readiness.'
        },
        {
          heading: '4. Payment Terms',
          body: 'Invoices are billed in accordance with milestone deliverables or retainer terms. Transparent pricing with zero surprise or hidden licensing fees.'
        }
      ]
    },
    nda: {
      title: 'Mutual Non-Disclosure & Security Policy',
      subtitle: 'Guaranteed trade secret protection and intellectual property shielding',
      icon: Lock,
      content: [
        {
          heading: '1. Confidential Information Scope',
          body: 'Proprietary source code, algorithmic concepts, business models, user data, server credentials, and prospective product features shared during discovery calls or engineering sprints are treated as strictly confidential.'
        },
        {
          heading: '2. Non-Disclosure Obligations',
          body: 'Shubham Hingane guarantees that no proprietary client architecture, unreleased products, or internal business figures will be disclosed to competitors or third parties.'
        },
        {
          heading: '3. Execution of Custom Corporate NDAs',
          body: 'We routinely sign enterprise-specific mutual NDAs (bilateral or unilateral) prior to initial architecture review meetings and discovery sessions.'
        },
        {
          heading: '4. Infrastructure Security Protocol',
          body: 'Production credentials, API secrets, and database access tokens are always managed via encrypted secret managers and never checked into version control repositories.'
        }
      ]
    }
  };

  const current = docs[activeDoc];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden card-shadow my-8 relative flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                <Icon size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-main-text">
                  {current.title}
                </h3>
                <span className="text-xs text-gray-400 font-medium">
                  {current.subtitle}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-red-500 hover:text-white transition-all text-gray-400 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-sm leading-relaxed">
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 flex items-center gap-2.5 text-xs text-primary font-bold">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Effective Date: September 2026 • Governed by Indian &amp; International Standards</span>
            </div>

            {current.content.map((item, idx) => (
              <div key={idx} className="space-y-1.5 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-850 border border-gray-100 dark:border-zinc-800">
                <h4 className="font-bold text-main-text text-sm flex items-center gap-1.5">
                  <ChevronRight size={14} className="text-primary" />
                  <span>{item.heading}</span>
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 pl-5 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/80 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Questions? Contact: <a href="mailto:shubhamhingane7719@gmail.com" className="text-primary font-semibold hover:underline">shubhamhingane7719@gmail.com</a>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md shadow-primary/20 hover:brightness-110 cursor-pointer"
            >
              Got It, Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
