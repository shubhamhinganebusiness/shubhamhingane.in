import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  Share2, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Send as Telegram, 
  MessageCircle, // Using MessageCircle for WhatsApp
  Link as LinkIcon, 
  Check, 
  Volume2, 
  Play, 
  Pause, 
  Square,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Stop reading and cancel speech whenever user leaves the page
  useEffect(() => {
    window.scrollTo(0, 0);
    
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [id]);

  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        const snap = await getDoc(doc(db, 'blogs', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setBlog(data);
          try {
            localStorage.setItem(`cache_blog_${id}`, JSON.stringify(data));
          } catch (_) {}
        } else {
          // Check local storage fallback
          const cached = localStorage.getItem(`cache_blog_${id}`);
          if (cached) {
            setBlog(JSON.parse(cached));
          } else {
            console.error('Blog post not found');
            navigate('/');
          }
        }
      } catch (err) {
        console.warn('Error fetching blog post, using cache fallback:', err);
        const cached = localStorage.getItem(`cache_blog_${id}`);
        if (cached) {
          setBlog(JSON.parse(cached));
        } else {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id, navigate]);

  // Clean Markdown syntax helper to read plain English
  const stripMarkdown = (text: string) => {
    if (!text) return "";
    return text
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/`([^`]+)`/g, "$1")     // inline code
      .replace(/^#+\s+/gm, "")         // headers
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1")     // italic
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // markdown links
      .replace(/^\s*-\s+/gm, "")       // list dots
      .replace(/^>\s+/gm, "");         // blockquotes
  };

  const handleListen = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert("Speech Synthesis is not supported in this browser.");
      return;
    }

    const synth = window.speechSynthesis;

    if (isSpeaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    } else {
      synth.cancel();

      const cleanDesc = stripMarkdown(blog?.desc || '');
      const textToSpeak = `${blog?.title || ''}. Category: ${blog?.category || 'News'}. \n\n${cleanDesc}`;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voices = synth.getVoices();
      const englishVoice = voices.find(voice => voice.lang.includes('en')) || voices[0];
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      setIsSpeaking(true);
      setIsPaused(false);
      synth.speak(utterance);
    }
  };

  const handleStopListening = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  // Generate universal share links
  const shareUrl = window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(`Read this article: ${blog?.title || ''}`);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.warn('Fallback copy mechanism triggered:', err);
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const shareTargets = [
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-black text-white hover:bg-zinc-800'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      color: 'bg-[#25D366] text-white hover:bg-[#20ba5a]'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'bg-[#0077B5] text-white hover:bg-[#005a8a]'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'bg-[#1877F2] text-white hover:bg-[#0c59cc]'
    },
    {
      name: 'Telegram',
      icon: Telegram,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: 'bg-[#0088cc] text-white hover:bg-[#0071a9]'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4" />
        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Loading Article Content...</p>
      </div>
    );
  }

  if (!blog) return null;

  // Reading time calculate
  const blogText = blog.desc || '';
  const wordCount = blogText.trim() ? blogText.trim().split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#080810] text-[#0f172a] dark:text-slate-100 transition-colors duration-300">
      
      {/* Dynamic Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-400 uppercase tracking-wider font-bold">
            <span className="hidden sm:inline">News Portal</span>
            <ChevronRight size={14} className="hidden sm:block" />
            <span className="truncate max-w-[120px] sm:max-w-[200px] text-primary">{blog.category || 'Article'}</span>
          </div>
        </div>
      </header>

      {/* Hero Header Space */}
      <main className="pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-10">
          
          {/* Breadcrumb Info & Category tag */}
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-primary/10 text-primary font-black uppercase text-[10px] tracking-widest rounded-full border border-primary/20">
                {blog.category || 'News'}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/40 shadow-sm">
                <Clock size={12} className="text-primary" />
                {readingTime} min read
              </span>
              {blog.createdAt && (
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/40 shadow-sm">
                  <Calendar size={12} className="text-primary" />
                  {new Date(blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-950 dark:text-white leading-tight tracking-tight">
              {blog.title}
            </h1>
          </div>

          {/* Massive Featured Image banner container */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="aspect-[16/9] w-full rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-2xl relative group"
          >
            <img
              src={blog.image || 'https://picsum.photos/seed/blog_page/1200/800'}
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>

          {/* Social share actions widget card */}
          <div className="p-6 bg-white dark:bg-slate-900/60 rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-xl shadow-slate-200/10 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Share2 size={18} className="animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-350 tracking-wider block">
                  Spread the Word
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold block">
                  Share this journalism with friends & communities
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {shareTargets.map((target) => (
                <a
                  key={target.name}
                  href={target.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-md ${target.color}`}
                  title={`Share on ${target.name}`}
                >
                  <target.icon size={16} />
                </a>
              ))}

              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-2 px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-md transition-all duration-200 transform active:scale-95 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    Copied URL!
                  </>
                ) : (
                  <>
                    <LinkIcon size={14} />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Audio Player & Speaking Narration Unit Component */}
          <div className="p-8 bg-slate-900 text-white dark:bg-slate-900/40 dark:border dark:border-slate-800/80 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-5 text-center sm:text-left w-full sm:w-auto">
              <div className={`p-4 bg-primary text-white rounded-2xl transition-all ${isSpeaking && !isPaused ? 'animate-pulse bg-primary/95 scale-102 shadow-lg shadow-primary/20' : ''}`}>
                <Volume2 size={24} />
              </div>
              <div className="text-left space-y-1">
                <h4 className="text-xs font-black uppercase text-primary tracking-[0.15em]">
                  Audio Narration
                </h4>
                <h3 className="text-sm font-extrabold text-white">Listen to Article</h3>
                <p className="text-[11px] text-gray-400 font-bold">
                  {isSpeaking 
                    ? (isPaused ? 'Paused. Tap Resume to continue...' : 'AI Text-To-Speech is narrating body text') 
                    : 'Not enough time to read? Let the assistant dictate this article.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
              <button
                onClick={handleListen}
                className={`flex items-center gap-2.5 px-6 py-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer transform active:scale-95 ${
                  isSpeaking && !isPaused
                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                    : 'bg-primary text-white hover:bg-primary/95 shadow-lg shadow-primary/20'
                }`}
              >
                {isSpeaking && !isPaused ? (
                  <>
                    <Pause size={14} className="stroke-[3]" />
                    Pause Voice
                  </>
                ) : (
                  <>
                    <Play size={14} className="stroke-[3]" />
                    {isSpeaking && isPaused ? 'Resume Reader' : 'Listen Now'}
                  </>
                )}
              </button>

              {isSpeaking && (
                <button
                  onClick={handleStopListening}
                  className="p-4 bg-white/10 dark:bg-white/5 hover:bg-red-500 hover:text-white rounded-full transition-all cursor-pointer transform active:scale-95 flex items-center justify-center text-red-400"
                  title="Stop Narration"
                >
                  <Square size={14} className="fill-current" />
                </button>
              )}

              {/* Graphic Ambient Visual State Waveform */}
              {isSpeaking && !isPaused && (
                <div className="flex items-center gap-0.5 h-6 ml-2 pr-1">
                  {[0.1, 0.4, 0.2, 0.5, 0.3].map((delay, index) => (
                    <motion.span
                      key={index}
                      animate={{ height: ["4px", "22px", "4px"] }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        delay: delay,
                        ease: "easeInOut"
                      }}
                      className="w-1 bg-primary rounded-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prose Rich Body Text Area */}
          <article className="bg-white dark:bg-slate-900/40 p-8 md:p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/40 shadow-sm leading-relaxed max-w-none prose dark:prose-invert">
            {(() => {
              if (!blogText) return <p className="text-gray-400 italic font-medium">No body text has been composed for this post.</p>;
              
              // Custom Clean Markdown Parser
              let html = blogText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

              // code block replacement formatting
              html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-900 dark:bg-black/40 text-slate-200 p-6 rounded-2xl font-mono text-xs my-6 overflow-x-auto border border-slate-850">$1</pre>');
              
              // inline code replacement
              html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-slate-800/80 px-2 py-0.5 rounded font-mono text-xs text-primary">$1</code>');
              
              // headers replacement
              html = html.replace(/^## (.*?)$/gm, '<h3 class="text-xl md:text-2xl font-black text-slate-950 dark:text-white mt-8 mb-4 border-l-4 border-primary pl-3.5">$1</h3>');
              html = html.replace(/^### (.*?)$/gm, '<h4 class="text-lg font-bold text-slate-950 dark:text-white mt-6 mb-3">$1</h4>');
              html = html.replace(/^# (.*?)$/gm, '<h2 class="text-2xl md:text-3xl font-extrabold text-slate-950 dark:text-white mt-10 mb-5 border-b border-gray-100 dark:border-gray-800/50 pb-3">$1</h2>');
              
              // generic text formatting replacement
              html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-slate-950 dark:text-white">$1</strong>');
              html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
              
              // blockquotes replacement
              html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-primary pl-5 py-3 my-6 italic text-slate-600 dark:text-gray-350 bg-slate-55/40 dark:bg-slate-900/60 rounded-r-2xl font-serif text-base">$1</blockquote>');
              
              // links replacement
              html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:opacity-85 transition-opacity font-bold">$1</a>');
              
              // list items formatting replacement
              html = html.replace(/^\s*-\s+(.*?)$/gm, '<li class="list-disc ml-6 text-slate-800 dark:text-slate-200 mb-1.5">$1</li>');
              
              // break layout formatting
              html = html.replace(/\n/g, '<br />');

              return (
                <div 
                  className="space-y-6 text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200 font-sans tracking-wide"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              );
            })()}
          </article>

          {/* Footer Back Button action area */}
          <div className="pt-8 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-gray-200 font-bold rounded-2xl shadow-md transition-all duration-300 uppercase tracking-widest text-xs"
            >
              <ArrowLeft size={16} />
              Return to All Articles
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
};

export default BlogDetail;
