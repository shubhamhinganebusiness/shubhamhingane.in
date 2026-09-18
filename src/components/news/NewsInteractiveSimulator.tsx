import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, Radio, Send, Bell, Image as ImageIcon, Flame, 
  Check, Share2, Eye, ShieldAlert, Sparkles, RefreshCw, Zap
} from 'lucide-react';

export const NewsInteractiveSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cms' | 'broadcast'>('cms');

  // CMS Simulation States
  const [headline, setHeadline] = useState('महाराष्ट्र: मान्सूनची जोरदार हजेरी, अनेक जिल्ह्यांत ऑरेंज अलर्ट जारी');
  const [category, setCategory] = useState('ताजी बातमी (Breaking)');
  const [author, setAuthor] = useState('विशेष वार्ताहर / Desk');
  const [isBreakingAlert, setIsBreakingAlert] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [liveReadCount, setLiveReadCount] = useState(4820);

  // Broadcast Studio States
  const [lowerThirdStyle, setLowerThirdStyle] = useState<'breaking' | 'standard' | 'exclusive'>('breaking');
  const [tickerText, setTickerText] = useState('BREAKING NEWS: विधिमंडळ अधिवेशनात मोठे निर्णय जाहीर • हवामान खात्याचा ५ जिल्ह्यांना सतर्कतेचा इशारा •');
  const [channelLogo, setChannelLogo] = useState('महाNews 24');

  const handleSimulatePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublished(true);
    setLiveReadCount((prev) => prev + 120);
    setTimeout(() => setIsPublished(false), 3500);
  };

  return (
    <div className="w-full bg-surface dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
      {/* Simulation Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 mb-1">
            <Sparkles size={13} className="text-primary animate-pulse" />
            Interactive Media Engine Playground
          </span>
          <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Test Drive Our Media Tech Stack
          </h4>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('cms')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'cms'
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-main-text'
            }`}
          >
            <Zap size={14} />
            <span>Fast Newsroom CMS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-main-text'
            }`}
          >
            <Tv size={14} />
            <span>OBS & Broadcast Graphics</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Fast Newsroom CMS */}
      {activeTab === 'cms' && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Editor Controls */}
          <div className="lg:col-span-6 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Newsroom Input (Simulation)
            </h5>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                placeholder="Enter breaking headline in Marathi, Hindi, English..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                >
                  <option>ताजी बातमी (Breaking)</option>
                  <option>राजकीय (Politics)</option>
                  <option>क्रीडा (Sports)</option>
                  <option>मनोरंजन (Cinema)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Desk / Bylines</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-main-text focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Quick Toggles */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <span className="text-xs font-bold text-main-text">Push Alert to 25k+ Mobile Users</span>
              </div>
              <input
                type="checkbox"
                checked={isBreakingAlert}
                onChange={(e) => setIsBreakingAlert(e.target.checked)}
                className="w-4 h-4 text-primary rounded accent-primary cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={handleSimulatePublish}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/25 hover:brightness-110 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPublished ? (
                <>
                  <Check size={16} />
                  <span>Published to Google News & App!</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>1-Click Fast Instant Publish</span>
                </>
              )}
            </button>
          </div>

          {/* Realtime Reader App / Web Preview */}
          <div className="lg:col-span-6">
            <h5 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center justify-between">
              <span>Audience Live View</span>
              <span className="text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {liveReadCount.toLocaleString()} Live Readers
              </span>
            </h5>

            <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-4 sm:p-5 shadow-md">
              {/* Breaking Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1">
                  <Flame size={12} />
                  {category}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Just Now • Google News AMP</span>
              </div>

              {/* Headline */}
              <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug mb-2">
                {headline}
              </h4>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 pb-3 border-b border-gray-100 dark:border-zinc-800">
                <span>By {author}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified Media Desk</span>
              </div>

              {/* Simulated push banner */}
              {isBreakingAlert && (
                <div className="mt-3 p-2.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Bell size={14} className="animate-bounce" />
                    <span>Android Push Notification Dispatched</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">Sent to 25,480 Subscribers</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: OBS Broadcast Studio Graphics */}
      {activeTab === 'broadcast' && (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Theme:</span>
              {(['breaking', 'standard', 'exclusive'] as const).map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setLowerThirdStyle(style)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    lowerThirdStyle === style
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400">Channel Name:</span>
              <input
                type="text"
                value={channelLogo}
                onChange={(e) => setChannelLogo(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800 text-xs font-bold text-main-text focus:outline-none border border-gray-200 dark:border-zinc-700 w-32"
              />
            </div>
          </div>

          {/* Virtual Studio 16:9 Screen */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-gray-900 to-black border-2 border-zinc-700 shadow-2xl flex flex-col justify-between p-4 sm:p-6">
            {/* Top Bar: LIVE badge & Logo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-md flex items-center gap-1.5 shadow-lg animate-pulse">
                  <Radio size={12} />
                  LIVE
                </span>
                <span className="px-2.5 py-1 bg-black/60 text-white text-[11px] font-mono rounded backdrop-blur-md">
                  1080p60 • OBS STUDIO OVERLAY
                </span>
              </div>

              <div className="px-3 py-1 rounded-md bg-primary text-white font-black text-sm tracking-wider uppercase shadow-md">
                {channelLogo}
              </div>
            </div>

            {/* Middle placeholder studio camera feed */}
            <div className="text-center text-zinc-600 font-mono text-xs uppercase tracking-widest pointer-events-none">
              [ 24x7 Broadcast Studio Feed Simulation ]
            </div>

            {/* Bottom: Professional Lower-Third & Ticker */}
            <div className="space-y-1">
              {/* Lower Third Main Plate */}
              <motion.div
                key={lowerThirdStyle}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-lg p-2.5 sm:p-3 flex items-center justify-between shadow-2xl backdrop-blur-md ${
                  lowerThirdStyle === 'breaking'
                    ? 'bg-red-600 text-white'
                    : lowerThirdStyle === 'exclusive'
                    ? 'bg-amber-500 text-black'
                    : 'bg-primary text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-black/30 rounded text-[10px] font-black uppercase tracking-widest">
                    {lowerThirdStyle.toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm font-black tracking-tight line-clamp-1">
                    {headline}
                  </span>
                </div>
                <span className="hidden sm:inline text-[10px] font-mono font-bold opacity-80">
                  DISTRICT BUREAU
                </span>
              </motion.div>

              {/* Scrolling Bottom Ticker */}
              <div className="bg-zinc-950 text-white py-1.5 px-3 rounded text-[11px] font-bold flex items-center overflow-hidden border border-zinc-800">
                <span className="px-2 py-0.5 bg-primary text-white rounded text-[9px] font-black uppercase mr-3 shrink-0">
                  FLASH
                </span>
                <div className="overflow-hidden whitespace-nowrap flex-1">
                  <div className="inline-block animate-marquee text-gray-200">
                    {tickerText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
