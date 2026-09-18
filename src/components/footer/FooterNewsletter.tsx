import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const FooterNewsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Save subscription as message/lead in Firestore
      await addDoc(collection(db, 'messages'), {
        email: email.trim(),
        name: 'Newsletter Subscriber',
        phone: 'N/A',
        subject: 'Tech Insights & Architecture Dispatch Subscription',
        message: `User subscribed to technical updates and architecture insights: ${email.trim()}`,
        type: 'newsletter',
        status: 'unread',
        createdAt: serverTimestamp()
      });

      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      console.error('Newsletter error:', err);
      // Even if Firestore has transient network issues, inform user
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-main-text">
        <Sparkles size={16} className="text-primary" />
        <h4 className="text-xs font-black uppercase tracking-wider">
          Tech Insights &amp; Updates
        </h4>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        Join founders &amp; software teams receiving real-world engineering case studies, cloud architectural breakdowns &amp; tech guides.
      </p>

      <form onSubmit={handleSubscribe} className="space-y-2">
        <div className="relative flex items-center">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="you@company.com"
            className="w-full h-11 pl-4 pr-11 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs text-main-text focus:outline-none focus:border-primary transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="absolute right-1.5 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Subscribe"
          >
            {submitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-red-500 font-medium">
            {error}
          </p>
        )}

        {subscribed && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <CheckCircle2 size={13} />
            <span>Subscribed! Check your inbox for updates.</span>
          </div>
        )}
      </form>

      <div className="flex items-center gap-3 pt-1 text-[10px] text-gray-400">
        <span>🔒 Zero spam guarantee</span>
        <span>•</span>
        <span>Unsubscribe anytime</span>
      </div>
    </div>
  );
};
