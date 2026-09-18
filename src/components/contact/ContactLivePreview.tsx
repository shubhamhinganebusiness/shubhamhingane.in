import React, { useState } from 'react';
import { FileText, Copy, Check, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';
import { ScopeSelection } from './ContactScopeSelector';

interface ContactLivePreviewProps {
  formData: {
    name: string;
    phone: string;
    email: string;
    subject: string;
    message: string;
  };
  scope: ScopeSelection;
  whatsappNumber: string;
}

export const ContactLivePreview: React.FC<ContactLivePreviewProps> = ({
  formData,
  scope,
  whatsappNumber
}) => {
  const [copied, setCopied] = useState(false);

  const formattedBrief = 
`PROJECT INQUIRY BRIEF
------------------------------------
• Client Name: ${formData.name || '(Pending)'}
• Phone / WhatsApp: ${formData.phone || '(Pending)'}
• Email: ${formData.email || '(Pending)'}

PROJECT SPECIFICATIONS:
• Category: ${scope.projectType}
• Budget Target: ${scope.budgetRange}
• Desired Timeline: ${scope.timeline}

SUBJECT:
• ${formData.subject || 'General Inquiry'}

MESSAGE DETAILS:
${formData.message || '(Details will appear here as you type...)'}
------------------------------------
Sent via shubhamhingane.dev`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstantWhatsApp = () => {
    const encoded = encodeURIComponent(
      `*New Project Brief Inquiry*\n\n` +
      `👤 *Name:* ${formData.name || 'Client'}\n` +
      `📞 *Phone:* ${formData.phone || 'N/A'}\n` +
      `📧 *Email:* ${formData.email || 'N/A'}\n` +
      `🛠️ *Project Category:* ${scope.projectType}\n` +
      `💰 *Budget Range:* ${scope.budgetRange}\n` +
      `⏱️ *Timeline:* ${scope.timeline}\n` +
      `📌 *Subject:* ${formData.subject || 'Discovery Consultation'}\n\n` +
      `📝 *Message:* ${formData.message || 'I would like to discuss this project with you.'}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          <span className="text-xs font-black uppercase tracking-wider text-main-text">
            Live Inquiry Brief Preview
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary flex items-center gap-1.5 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-500" />
              <span className="text-emerald-500 text-[10px]">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span className="text-[10px]">Copy Brief</span>
            </>
          )}
        </button>
      </div>

      {/* Scope Chips in Brief */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold border border-primary/20">
          {scope.projectType}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
          {scope.budgetRange}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
          {scope.timeline}
        </span>
      </div>

      {/* Message Excerpt */}
      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800 font-mono space-y-1">
        <p className="font-bold text-main-text">
          Subject: <span className="font-normal">{formData.subject || 'Not specified yet'}</span>
        </p>
        <p className="line-clamp-3 text-gray-500">
          {formData.message || 'Details will update dynamically as you enter them in the form...'}
        </p>
      </div>

      {/* Dual action helper */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-gray-400 text-[11px]">
          Prefer skipping the form?
        </span>
        <button
          type="button"
          onClick={handleInstantWhatsApp}
          className="text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer text-xs"
        >
          <MessageCircle size={14} />
          <span>Launch WhatsApp with this Brief</span>
        </button>
      </div>
    </div>
  );
};
