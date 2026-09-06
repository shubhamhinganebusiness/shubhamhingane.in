import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  ArrowRight, 
  User, 
  School, 
  CreditCard, 
  Calendar, 
  Heart, 
  Activity, 
  ShieldCheck, 
  Plus, 
  Sparkles, 
  RotateCw,
  Clock,
  HeartIcon,
  Check,
  ExternalLink,
  Folder,
  LogOut,
  Cloud,
  Loader2,
  Mic,
  MicOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, db } from '../lib/firebase';
import { GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Elite Academic Shield Crest (Gold & Navy)
const DEFAULT_LOGO_BASE64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 5 L85 20 C85 60 50 90 50 90 C50 90 15 60 15 20 Z" fill="%230f172a" stroke="%23f59e0b" stroke-width="4"/><path d="M50 15 L75 26 C75 56 50 80 50 80 C50 80 25 56 25 26 Z" fill="%23f59e0b" opacity="0.15"/><circle cx="50" cy="45" r="14" fill="none" stroke="%23f59e0b" stroke-width="4"/><path d="M50 35 L50 55 M40 45 L60 45" stroke="%23f59e0b" stroke-width="4" stroke-linecap="round"/><path d="M30 80 L70 80" stroke="%23f59e0b" stroke-width="2" stroke-linecap="round"/></svg>`;

// Swastha Trust School Logo Seal for New English School Malthan
const MALTHAN_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="%23ffffff" stroke="%23eab308" stroke-width="3" /><circle cx="60" cy="60" r="48" fill="none" stroke="%231e3a8a" stroke-width="1.5" /><path d="M24,72 C22,60 26,46 34,36 M96,72 C98,60 94,46 86,36" fill="none" stroke="%2316a34a" stroke-width="1.8" stroke-linecap="round" /><circle cx="25" cy="65" r="1.5" fill="%2316a34a" /><circle cx="23" cy="55" r="1.5" fill="%2316a34a" /><circle cx="24" cy="46" r="1.5" fill="%2316a34a" /><circle cx="29" cy="38" r="1.5" fill="%2316a34a" /><circle cx="95" cy="65" r="1.5" fill="%2316a34a" /><circle cx="97" cy="55" r="1.5" fill="%2316a34a" /><circle cx="96" cy="46" r="1.5" fill="%2316a34a" /><circle cx="91" cy="48" r="1.5" fill="%2316a34a" /><path d="M40,75 C48,70 56,72 60,76 C64,72 72,70 80,75 L80,55 C72,50 64,52 60,56 C56,52 48,50 40,55 Z" fill="%23ffffff" stroke="%231e3a8a" stroke-width="1.5" /><path d="M60,56 L60,76" stroke="%231e3a8a" stroke-width="1.5" /><path d="M44,59 L54,58 M44,64 L54,63 M44,69 L54,68 M76,59 L66,58 M76,64 L66,63 M76,69 L66,68" stroke="%23cbd5e1" stroke-width="1" /><path d="M60,32 L64,44 L60,52 L56,44 Z" fill="%231e293b" /><path d="M60,32 L60,48" stroke="%23ffffff" stroke-width="0.8" /><circle cx="60" cy="42" r="1" fill="%23ffffff" /><path d="M60,20 C64,25 64,30 60,34 C56,30 56,25 60,20 Z" fill="%23eab308" stroke="%23ea580c" stroke-width="0.8" /><path id="topTextPath" d="M22,60 A38,38 0 0,1 98,60" fill="none" /><text font-family="'Inter', sans-serif" font-weight="950" font-size="6.8px" fill="%23b91c1c"><textPath href="%23topTextPath" startOffset="50%" text-anchor="middle">स्वाल्य शिक्षण संस्था, विचाला काळदात</textPath></text><path d="M28,84 L92,84 L84,95 L36,95 Z" fill="%231e3a8a" stroke="%23eab308" stroke-width="1" /><text x="60" y="92" font-family="'Inter', sans-serif" font-weight="950" font-size="6px" fill="%23ffffff" text-anchor="middle">ज्ञान हेच सामर्थ्य</text></svg>`;

const CHANDRABHAMA_SCHOOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="%23ffffff" stroke="%23eab308" stroke-width="3" /><circle cx="60" cy="60" r="48" fill="none" stroke="%230f2963" stroke-width="1.5" /><path d="M24,72 C22,60 26,46 34,36 M96,72 C98,60 94,46 86,36" fill="none" stroke="%2316a34a" stroke-width="1.8" stroke-linecap="round" /><circle cx="25" cy="65" r="1.5" fill="%2316a34a" /><circle cx="23" cy="55" r="1.5" fill="%2316a34a" /><circle cx="24" cy="46" r="1.5" fill="%2316a34a" /><circle cx="29" cy="38" r="1.5" fill="%2316a34a" /><circle cx="95" cy="65" r="1.5" fill="%2316a34a" /><circle cx="97" cy="55" r="1.5" fill="%2316a34a" /><circle cx="96" cy="46" r="1.5" fill="%2316a34a" /><circle cx="91" cy="48" r="1.5" fill="%2316a34a" /><path d="M40,75 C48,70 56,72 60,76 C64,72 72,70 80,75 L80,55 C72,50 64,52 60,56 C56,52 48,50 40,55 Z" fill="%23ffffff" stroke="%230f2963" stroke-width="1.5" /><path d="M60,56 L60,76" stroke="%230f2963" stroke-width="1.5" /><path d="M44,59 L54,58 M44,64 L54,63 M44,69 L54,68 M76,59 L66,58 M76,64 L66,63 M76,69 L66,68" stroke="%23cbd5e1" stroke-width="1" /><path d="M60,32 L64,44 L60,52 L56,44 Z" fill="%231e293b" /><path d="M60,32 L60,48" stroke="%23ffffff" stroke-width="0.8" /><circle cx="60" cy="42" r="1" fill="%23ffffff" /><path d="M60,20 C64,25 64,30 60,34 C56,30 56,25 60,20 Z" fill="%23eab308" stroke="%23ea580c" stroke-width="0.8" /><path id="topTextChandra" d="M22,60 A38,38 0 0,1 98,60" fill="none" /><text font-family="'Inter', sans-serif" font-weight="950" font-size="6px" fill="%230f2963"><textPath href="%23topTextChandra" startOffset="50%" text-anchor="middle">चंद्रभामा विद्यालय, कर्जत</textPath></text><path d="M22,86 L98,86 L88,96 L32,96 Z" fill="%230f2963" stroke="%23eab308" stroke-width="1" /><text x="60" y="93.5" font-family="'Inter', sans-serif" font-weight="900" font-size="5.8px" fill="%23ffffff" text-anchor="middle">Aartas &amp; Since</text></svg>`;

// Signature elegant vectors
const DEFAULT_PRINCIPAL_SIG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M10 25 C30 10, 40 5, 55 20 C70 35, 80 5, 95 22 C105 32, 115 15, 120 20" fill="none" stroke="%231e3a8a" stroke-width="2.5" stroke-linecap="round"/></svg>`;
const DEFAULT_STUDENT_SIG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M15 20 C35 25, 45 35, 60 15 C75 -5, 90 28, 110 18" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round"/></svg>`;

const SAMYAK_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 125"><rect width="125" height="125" fill="%23ffffff" rx="12"/><circle cx="62.5" cy="45" r="30" fill="none" stroke="%230a3e8a" stroke-width="1.5" stroke-dasharray="2,2"/><circle cx="62.5" cy="45" r="26" fill="none" stroke="%23ea580c" stroke-width="1" opacity="0.4"/><path d="M62.5,75 L62.5,50 M62.5,65 Q50,55 45,45 M62.5,58 Q75,52 80,42 M62.5,70 Q70,62 76,55 M62.5,63 Q52,58 48,52" stroke="%230a3e8a" stroke-width="3.5" stroke-linecap="round" fill="none"/><circle cx="45" cy="45" r="4.5" fill="%2322c55e"/><circle cx="80" cy="42" r="5" fill="%23f59e0b"/><circle cx="76" cy="55" r="4" fill="%23ef4444"/><circle cx="48" cy="52" r="4" fill="%233b82f6"/><circle cx="62.5" cy="36" r="6" fill="%230a3e8a"/><circle cx="56" cy="40" r="4.5" fill="%23ea580c"/><circle cx="69" cy="38" r="4.5" fill="%23a855f7"/><text font-family="sans-serif" font-weight="900" font-size="9px" fill="%230a3e8a" x="62.5" y="94" text-anchor="middle">SAMYAK</text><text font-family="sans-serif" font-weight="850" font-size="6.5px" fill="%23ea580c" x="62.5" y="102" text-anchor="middle">FOUNDATION</text><text font-family="sans-serif" font-weight="700" font-size="4.2px" fill="%2364748b" x="62.5" y="112" text-anchor="middle">Reg.No.MAH/807/2019/A&apos;Nagar</text></svg>`;
const SAMYAK_PRESIDENT_SIG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M12 25 C25 20, 35 15, 42 22 Q48 28, 54 18 C62 8, 70 30, 82 23 C92 18, 100 12, 115 15 M10 22 C40 18, 50 14, 80 20" fill="none" stroke="%231e3a8a" stroke-width="2.2" stroke-linecap="round"/></svg>`;

const ZPKETUR_SOLAPUR_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="%25ffffff" stroke="%25ea580c" stroke-width="2.5" /><circle cx="60" cy="60" r="48" fill="none" stroke="%2516a34a" stroke-width="1.5" /><circle cx="60" cy="62" r="32" fill="%25dcf2fe" stroke="%2516a34a" stroke-width="1" /><path d="M42,75 Q48,65 52,72 T62,60 T72,75 Z" fill="%2516a34a" stroke="%2515803d" stroke-width="1" /><circle cx="60" cy="46" r="4" fill="%25f59e0b" /><path id="zpTopTextPath" d="M20,60 A40,40 0 0,1 100,60" fill="none" /><text font-family="sans-serif" font-weight="950" font-size="5.8px" fill="%25b91c1c"><textPath href="%25zpTopTextPath" startOffset="50%" text-anchor="middle">जिल्हा परिषद सोलापूर</textPath></text><path id="zpBottomTextPath" d="M100,60 A40,40 0 0,1 20,60" fill="none" /><text font-family="sans-serif" font-weight="900" font-size="5.2px" fill="%2516a34a"><textPath href="%25zpBottomTextPath" startOffset="50%" text-anchor="middle">जनसेवा हीच ईश्वरसेवा</textPath></text><circle cx="21" cy="60" r="2" fill="%25eab308" /><circle cx="99" cy="60" r="2" fill="%25eab308" /></svg>`;
const SSA_PENCIL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 50"><path d="M10,25 L115,25 L125,20 L135,25 L125,30 L115,25 Z" fill="%25eab308" stroke="%25d97706" stroke-width="1" /><path d="M125,20 L135,25 L125,30 Z" fill="%251e293b" /><rect x="15" y="18" width="100" height="4" fill="%25ef4444" /><rect x="15" y="22" width="100" height="3" fill="%25ffffff" /><rect x="15" y="25" width="100" height="4" fill="%253b82f6" /><rect x="15" y="29" width="100" height="3" fill="%2516a34a" /><rect x="110" y="16" width="5" height="18" fill="%25e2e8f0" rx="1" /><rect x="5" y="16" width="10" height="18" fill="%25ef4444" rx="1" /><circle cx="45" cy="11" r="4" fill="%25fbcfe8" /><path d="M45,15 L45,22 M41,18 L49,18 M42,25 L45,22 L48,25" stroke="%251e293b" stroke-width="1.2" stroke-linecap="round" /><path d="M41,9 Q45,6 48,10" fill="none" stroke="%251e293b" stroke-width="1.2" /><circle cx="75" cy="11" r="4" fill="%25fbcfe8" /><path d="M75,15 L71,21 L79,21 Z" fill="%25ec4899" stroke="%25db2777" stroke-width="0.8" /><path d="M71,18 L79,18 M73,21 L71,25 M77,21 L79,25" stroke="%251e293b" stroke-width="1.2" stroke-linecap="round" /><path d="M71,8 C70,11 80,11 79,8" fill="none" stroke="%251e293b" stroke-width="1.2" /><circle cx="70" cy="9" r="1.5" fill="%25f43f5e" /><circle cx="80" cy="9" r="1.5" fill="%25f43f5e" /><text x="65" y="38" font-family="sans-serif" font-weight="900" font-size="7.5px" fill="%2516a34a" text-anchor="middle">सर्व शिक्षा अभियान</text><text x="65" y="46" font-family="sans-serif" font-style="italic" font-weight="700" font-size="6px" fill="%25b91c1c" text-anchor="middle">सारे शिकूया, पुढे जाऊया</text></svg>`;
const KETUR_HM_SIG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M15 22 C28 12, 38 8, 48 24 Q52 30, 60 12 C68 4, 75 25, 88 18 Q98 12, 110 20" fill="none" stroke="%231e3a8a" stroke-width="2.2" stroke-linecap="round"/></svg>`;

const SIDD_SANSTHA_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23ffffff" stroke="%23dc2626" stroke-width="5" rx="3"/><rect x="8" y="8" width="104" height="104" fill="none" stroke="%23dc2626" stroke-width="1.5"/><circle cx="60" cy="62" r="34" fill="none" stroke="%23dc2626" stroke-width="2.5"/><circle cx="60" cy="62" r="28" fill="none" stroke="%23dc2626" stroke-width="1.5" stroke-dasharray="3,2"/><path d="M35 62 L85 62" stroke="%23dc2626" stroke-width="2"/><path d="M42,50 Q60,32 78,50" fill="none" stroke="%23dc2626" stroke-width="2"/><text font-family="sans-serif" font-weight="950" font-size="16px" fill="%23dc2626" x="60" y="75" text-anchor="middle">यड</text><text font-family="sans-serif" font-weight="850" font-size="6.5px" fill="%23dc2626" x="60" y="110" text-anchor="middle">शिस्त व शिक्षण</text><path id="siddLogoPathInside" d="M12,48 A48,48 0 0,1 108,48" fill="none"/><text font-family="sans-serif" font-weight="950" font-size="7.8px" fill="%23dc2626"><textPath href="%23siddLogoPathInside" startOffset="50%" text-anchor="middle">यशवंत शिक्षण संस्था कर्जत</textPath></text></svg>`;

const SIDD_HM_SIG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M12 25 C32 18, 52 14, 67 24 Q74 30, 87 10 C94 2, 102 28, 114 18 M8 16 Q35 15, 60 22 M80 20 L115 30" fill="none" stroke="%230000ff" stroke-width="2.2" stroke-linecap="round"/></svg>`;

const BHARATGAS_SYMBOL_LOGO = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%23020617" stroke="%23ea580c" stroke-width="2"/><path d="M50 12 C32 35 30 55 50 88 C70 55 68 35 50 12 Z" fill="%23f97316" /><path d="M50 28 C38 45 36 62 50 82 C64 62 62 45 50 28 Z" fill="%23ea580c" /><path d="M50 42 C44 55 42 66 50 79 C58 66 56 55 50 42 Z" fill="%23facc15" /></svg>`;

const LAXMI_DISTRIBUTOR_SIG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"><path d="M15 25 C25 20, 42 12, 50 22 Q58 32, 65 15 C78 -2, 92 24, 110 18 M10 30 Q30 35, 50 26 M80 20 L110 25" fill="none" stroke="%230000ff" stroke-width="2.0" stroke-linecap="round"/></svg>`;

// Default high-quality student placeholder image
const DEFAULT_STUDENT_PHOTO = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=280&h=350";

// Shared in-memory and localStorage access token cache for active session
let driveAccessToken: string | null = null;
try {
  driveAccessToken = localStorage.getItem('drive_access_token');
} catch (e) {
  console.warn("localStorage init error:", e);
}

const TEMPLATES_LIST = [
  { 
    id: 'academic', 
    category: 'standard', 
    label: 'Academic Elite', 
    desc: 'Navy Symmetrical / Gold Accent', 
    colors: ['bg-[#0a2e5c]', 'bg-[#dfa115]'], 
    badge: 'CLASSIC', 
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
    preview: (
      <div className="w-full h-2 rounded-t-lg bg-[#0a2e5c] relative overflow-hidden flex items-center px-1">
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-[#dfa115]" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
        <div className="w-5 h-[1px] bg-white/20 ml-1" />
      </div>
    )
  },
  { 
    id: 'newenglishmalthan', 
    category: 'regional', 
    label: 'New English School Malthan', 
    desc: 'Swastha Trust / Bilingual structure', 
    colors: ['bg-[#dc2626]', 'bg-[#1e3a8a]'], 
    badge: 'VERNACULAR', 
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-red-600/15">
        <div className="h-[2px] w-full bg-[#dc2626]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-1.5 h-full bg-[#1e3a8a] rounded-xs" />
          <div className="w-4 h-[1px] bg-red-600/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-[2px] w-full bg-[#1e3a8a]" />
      </div>
    )
  },
  { 
    id: 'chandrabhama', 
    category: 'regional', 
    label: 'Chandrabhama Mahavidyalay Karjat', 
    desc: 'Official template style for Chandrabhama Mahavidyalay Karjat', 
    colors: ['bg-[#0f2963]', 'bg-[#eab308]'], 
    badge: 'PREMIUM REGIONAL', 
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-yellow-600/15">
        <div className="h-[2px] w-full bg-[#eab308]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-1.5 h-full bg-[#0f2963] rounded-xs" />
          <div className="w-4 h-[1px] bg-amber-655/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-[2px] w-full bg-[#eab308]" />
      </div>
    )
  },
  { 
    id: 'swanandchincholi', 
    category: 'regional', 
    label: 'Swanand Vidyalay Chincholi Kaldat', 
    desc: 'Official template style for Swanand Vidyalay Chincholi Kaldat. Deep Blue & Gold.', 
    colors: ['bg-[#1e3a8a]', 'bg-[#eab308]'], 
    badge: 'REGIONAL SCHOOL', 
    badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-yellow-600/15">
        <div className="h-[2px] w-full bg-[#eab308]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-1.5 h-full bg-[#1e3a8a] rounded-xs" />
          <div className="w-4 h-[1px] bg-sky-600/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-[2px] w-full bg-[#1e3a8a]" />
      </div>
    )
  },
  {
    id: 'samyak', 
    category: 'regional', 
    label: 'Samyak Foundation Shramik Majdur Sangh', 
    desc: 'Bilingual Devanagari social organization identity template for Samyak Foundation (MDM Department).', 
    colors: ['bg-[#0a3e8a]', 'bg-[#ef4444]'], 
    badge: 'VERNACULAR TRUST', 
    badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-blue-650/15">
        <div className="h-[2px] w-full bg-[#0a3e8a]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-2 h-2 bg-red-600 rounded-xs" />
          <div className="w-4 h-[1px] bg-blue-600/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-[2px] w-full bg-[#0a3e8a]" />
      </div>
    )
  },
  {
    id: 'zpketur2', 
    category: 'regional', 
    label: 'Zilla Parishad Primary School Ketur No. 2', 
    desc: 'Government Primary School of Solapur district. Double lined standard regional layout with headmaster/school seals.', 
    colors: ['bg-[#dc2626]', 'bg-[#1e3a8a]'], 
    badge: 'GOVERNMENT', 
    badgeBg: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-red-600/15">
        <div className="h-[2px] w-full bg-[#dc2626]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />
          <div className="w-4 h-[1px] bg-red-650/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-[2px] w-full bg-red-600" />
      </div>
    )
  },
  {
    id: 'siddheshwar', 
    category: 'regional', 
    label: 'Siddheshwar Secondary & Higher Secondary, Bhambora', 
    desc: 'Siddheshwar School design with bold classic header style, dual photo grids, and vertical photographer banner.', 
    colors: ['bg-[#dc2626]', 'bg-[#000000]'], 
    badge: 'VERNACULAR TRUST', 
    badgeBg: 'bg-rose-500/10 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-red-600/15">
        <div className="h-[2px] w-full bg-[#dc2626]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-2 h-2 bg-red-600 rounded-sm shrink-0" />
          <div className="w-4 h-[1px] bg-red-650/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm border border-neutral-900" />
        </div>
        <div className="h-[2px] w-full bg-[#dc2626]" />
      </div>
    )
  },
  {
    id: 'bharatgas', 
    category: 'regional', 
    label: 'Laxmi Vaibhav Bharatgas Agency, Karmala', 
    desc: 'Bharatgas regional agency design featuring bold orange branding, distinct double outline border and status indicators.', 
    colors: ['bg-[#ea580c]', 'bg-[#1e3a8a]'], 
    badge: 'CORPORATE SECTOR', 
    badgeBg: 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    preview: (
      <div className="w-full h-2.5 rounded-t-lg bg-white relative overflow-hidden flex flex-col justify-between border-b border-orange-500/15">
        <div className="h-[2px] w-full bg-[#ea580c]" />
        <div className="flex-1 w-full flex items-center justify-between px-1.5 bg-slate-50">
          <div className="w-2 h-2 bg-[#1e3a8a] rounded-sm shrink-0" />
          <div className="w-4 h-[1px] bg-orange-600/30" />
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm border border-yellow-500" />
        </div>
        <div className="h-[2px] w-full bg-[#1e3a8a]" />
      </div>
    )
  }
];

const getQueryParam = (name: string): string | null => {
  try {
    let search = window.location.search;
    if (!search && window.location.hash.includes('?')) {
      search = window.location.hash.substring(window.location.hash.indexOf('?'));
    }
    const params = new URLSearchParams(search);
    return params.get(name);
  } catch (e) {
    return null;
  }
};

export const HeroIDCardForm = () => {
  // Primary Interactive States holding raw data variables
  const [form, setForm] = useState({
    schoolName: 'ZENID ACADEMY OF EXCELLENCE',
    schoolLogo: DEFAULT_LOGO_BASE64,
    studentPhoto: DEFAULT_STUDENT_PHOTO,
    studentName: 'ARYA SHARMA',
    studentId: 'STU-2026-4809',
    classCourse: 'Grade 12 (Science)',
    divisionSection: 'Div A',
    dob: '2008-04-18',
    bloodGroup: 'B+',
    academicYear: '2026-2027',
    principalSignature: DEFAULT_PRINCIPAL_SIG,
    studentSignature: DEFAULT_STUDENT_SIG,
    presidentName: 'सौ.सविता महेंद्र विधाते',
    presidentTitle: 'जिल्हा अध्यक्षा अहिल्यानगर'
  });

  const [selectedTemplate, setSelectedTemplate] = useState<'academic' | 'newenglishmalthan' | 'chandrabhama' | 'swanandchincholi' | 'samyak' | 'zpketur2' | 'siddheshwar' | 'bharatgas' | 'shramikmajdur'>(() => {
    try {
      const tpl = getQueryParam('template');
      if (tpl && ['academic', 'newenglishmalthan', 'chandrabhama', 'swanandchincholi', 'samyak', 'zpketur2', 'siddheshwar', 'bharatgas', 'shramikmajdur'].includes(tpl)) {
        return tpl as any;
      }
    } catch (e) {}
    return 'academic';
  });
  const [isTplDropdownOpen, setIsTplDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'standard' | 'regional'>('all');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [activeTab, setActiveTab] = useState<'profile' | 'school' | 'academic' | 'signatures'>('profile');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [listeningField, setListeningField] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  // Auto load demo data for URL-provided query template on mount
  React.useEffect(() => {
    try {
      const tpl = getQueryParam('template');
      if (tpl && ['academic', 'newenglishmalthan', 'chandrabhama', 'swanandchincholi', 'samyak', 'zpketur2', 'siddheshwar', 'bharatgas', 'shramikmajdur'].includes(tpl)) {
        loadDemoData(tpl);
      }
    } catch (err) {}
  }, []);

  const startListening = (field: string, onTranscript: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try using another modern browser like Google Chrome.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setListeningField(field);
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };

    rec.onerror = (event: any) => {
      console.error("Speech recognition error:", event);
      setListeningField(null);
    };

    rec.onend = () => {
      setListeningField(null);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setListeningField(null);
    }
  };
  
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('drive_access_token') || driveAccessToken;
    } catch (e) {
      return driveAccessToken;
    }
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmittingToDrive, setIsSubmittingToDrive] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    status: 'idle' | 'preparing' | 'creating_root' | 'creating_student' | 'uploading' | 'success' | 'error';
    message?: string;
    folderUrl?: string;
  }>({ status: 'idle' });

  React.useEffect(() => {
    // Inject scope dynamically to existing googleProvider instance
    try {
      googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
    } catch (e) {
      console.warn("Scope insertion error:", e);
    }

    // Modern fallback: Fetch central/global token from Firestore so all users can upload
    const loadGlobalDriveToken = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'site', 'drive_config'));
        if (docSnap.exists()) {
          const configData = docSnap.data();
          if (configData && configData.drive_access_token) {
            driveAccessToken = configData.drive_access_token;
            setAccessToken(configData.drive_access_token);
            try {
              localStorage.setItem('drive_access_token', configData.drive_access_token);
            } catch (localStoreErr) {}
            return;
          }
        }
      } catch (err) {
        console.warn("Could not load global administrative drive configuration:", err);
      }
    };
    loadGlobalDriveToken();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Instant restore from local storage to avoid UX flash
        const cachedToken = localStorage.getItem('drive_access_token') || driveAccessToken;
        if (cachedToken && !accessToken) {
          setAccessToken(cachedToken);
        }

        // Fetch from Firestore (authority backup to survive across updates/re-renders/multiple devices)
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.drive_access_token) {
              driveAccessToken = data.drive_access_token;
              try {
                localStorage.setItem('drive_access_token', data.drive_access_token);
              } catch (storageErr) {
                console.warn("localStorage sync error:", storageErr);
              }
              setAccessToken(data.drive_access_token);
            }
          }
        } catch (dbErr) {
          console.warn("Failed to dynamically fetch Drive token from Firestore:", dbErr);
        }
      }
    });
    return () => unsubscribe();
  }, [accessToken]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSubmitStatus({ status: 'idle' });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        driveAccessToken = credential.accessToken;
        try {
          localStorage.setItem('drive_access_token', credential.accessToken);
        } catch (e) {
          console.warn("localStorage save error:", e);
        }
        setAccessToken(credential.accessToken);
        setUser(result.user);

        // Backup and save securely to Firestore to survive reload and cross-origin iframe sandboxing
        try {
          const userDocRef = doc(db, 'users', result.user.uid);
          await setDoc(userDocRef, {
            drive_access_token: credential.accessToken,
            uid: result.user.uid,
            name: result.user.displayName || 'Authorized Drive User',
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Propagate to global config document too so guest submissions can work seamlessly
          const globalConfigRef = doc(db, 'site', 'drive_config');
          await setDoc(globalConfigRef, {
            drive_access_token: credential.accessToken,
            updatedBy: result.user.email || result.user.uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn("Successfully authenticated but failed saving to cloud fallback:", dbErr);
        }
      } else {
        throw new Error("Could not retrieve Google Drive access token.");
      }
    } catch (error: any) {
      console.warn("Google Auth popup cancelled or failed:", error);
      let errMsg = "Failed to authenticate. Please make sure popups are enabled and try again.";
      if (error && (error.code === 'auth/popup-closed-by-user' || error.message?.includes('popup-closed') || error.message?.includes('closed-by-user'))) {
        errMsg = "The authentication window was closed. Please click 'Authorize Google Drive' again and complete the sign-in to save your card.";
      }
      setSubmitStatus({ 
        status: 'error', 
        message: errMsg 
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDisconnect = async () => {
    const currentUser = auth.currentUser || user;
    driveAccessToken = null;
    try {
      localStorage.removeItem('drive_access_token');
    } catch (e) {
      console.warn("localStorage remove error:", e);
    }
    setAccessToken(null);
    setSubmitStatus({ status: 'idle' });

    // Mark explicit disconnection inside Firestore database as well
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          drive_access_token: null
        }, { merge: true });
      } catch (dbErr) {
        console.warn("Failed to remove token flag from Firestore document:", dbErr);
      }
    }

    // Also remove token globally
    try {
      const globalConfigRef = doc(db, 'site', 'drive_config');
      await setDoc(globalConfigRef, {
        drive_access_token: null
      }, { merge: true });
    } catch (globalErr) {
      console.warn("Failed to remove global config token:", globalErr);
    }
  };

  const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Helper utility to read local images as safe Base64 Strings 
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setForm(prev => ({ ...prev, [key]: event.target!.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert Date String into safe localized Date format
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const compileRenderer = async (side: 'front' | 'back'): Promise<string> => {
    const scale = 4; // High-res
    const isLandscape = selectedTemplate === 'shramikmajdur';
    const width = (isLandscape ? 550 : 350) * scale;
    const height = (isLandscape ? 350 : 550) * scale;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = width;
    canvas.height = height;

    const templateConfigs = {
      shramikmajdur: {
        primary: '#2323FF',
        accent: '#eab308',
        cardBg: '#f9f9f9',
        dotColor: 'transparent',
        textMain: '#262626',
        labelColor: '#2323FF',
        isDark: false,
        subTitle: 'श्रमिक मजदुर संघ',
        slogan: '(MDM विभाग)',
        tagline: "",
        bannerText: '#FFCE1B'
      },
      academic: {
        primary: '#0a2e5c',
        accent: '#dfa115',
        cardBg: '#ffffff',
        dotColor: 'rgba(148, 163, 184, 0.15)',
        textMain: '#000000',
        labelColor: '#0a2e5c',
        isDark: false,
        subTitle: 'COLLEGE OF ARTS, SCIENCE & COMMERCE',
        slogan: '🏛  Excellence in Education',
        tagline: 'Knowledge Today, Success Tomorrow',
        bannerText: '#ffffff'
      },
      newenglishmalthan: {
        primary: '#dc2626',
        accent: '#1e3a8a',
        cardBg: '#ffffff',
        dotColor: 'rgba(220, 38, 38, 0.03)',
        textMain: '#171717',
        labelColor: '#1e3a8a',
        isDark: false,
        subTitle: 'न्यू इंग्लिश स्कूल मलठण.',
        slogan: 'स्वानंद शिक्षण संस्था, पिंपळा काळोखात',
        tagline: 'ता. कर्जत जि. अहिल्यानगर',
        bannerText: '#ffffff',
        isCustomnewenglishmalthan: true
      },
      chandrabhama: {
        primary: '#0f2963',
        accent: '#eab308',
        cardBg: '#ffffff',
        dotColor: 'rgba(15, 41, 99, 0.03)',
        textMain: '#171717',
        labelColor: '#0f2963',
        isDark: false,
        subTitle: 'ARTS, SCIENCE & COMMERCE COLLEGE',
        slogan: 'CHANDRABHAMA MAHAVIDYALAY',
        tagline: 'Karjat, Dist-Ahilyanagar',
        bannerText: '#ffffff',
        isCustomchandrabhama: true
      },
      swanandchincholi: {
        primary: '#1e3a8a',
        accent: '#eab308',
        cardBg: '#ffffff',
        dotColor: 'rgba(30, 58, 138, 0.03)',
        textMain: '#171717',
        labelColor: '#1e3a8a',
        isDark: false,
        subTitle: 'SWANAND VIDYALAY CHINCHOLI KALDAT',
        slogan: 'SWANAND SHIKSHAN SANASTHA CHINCHOLI KALDAT',
        tagline: 'TAL-KARJAT DIST-AHILYANAGAR',
        bannerText: '#ffffff',
        isCustomswanandchincholi: true
      },
      samyak: {
        primary: '#0a3e8a',
        accent: '#eab308',
        cardBg: '#ffffff',
        dotColor: 'rgba(10, 62, 138, 0.03)',
        textMain: '#171717',
        labelColor: '#ef4444',
        isDark: false,
        subTitle: 'श्रमिक मजदुर संघ (MDM विभाग)',
        slogan: 'सम्यक फाउंडेशन प्रणित',
        tagline: 'ऑफिस - बाबा कॉम्प्लेक्स ,कोपरगाव,जि.अहिल्यानगर.मो.-9370444002',
        bannerText: '#ffffff',
        isCustomSamyak: true
      },
      zpketur2: {
        primary: '#dc2626',
        accent: '#000000',
        cardBg: '#ffffff',
        dotColor: 'transparent',
        textMain: '#000000',
        labelColor: '#000000',
        isDark: false,
        subTitle: 'केतुर नं. २',
        slogan: 'जिल्हा परिषद प्राथमिक शाळा',
        tagline: 'UDISE NO - 27300305002',
        bannerText: '#ffffff',
        isCustomZpKetur2: true
      },
      siddheshwar: {
        primary: '#dc2626',
        accent: '#000000',
        cardBg: '#ffffff',
        dotColor: 'transparent',
        textMain: '#000000',
        labelColor: '#000000',
        isDark: false,
        subTitle: 'भांबोरा ता. कर्जत जि. अहमदनगर.',
        slogan: 'यशवंत शिक्षण संस्था कर्जत,अहमदनगर.',
        tagline: '',
        bannerText: '#ffffff',
        isCustomSiddheshwar: true
      },
      bharatgas: {
        primary: '#ea580c',
        accent: '#1e3a8a',
        cardBg: '#ffffff',
        dotColor: 'transparent',
        textMain: '#000000',
        labelColor: '#000000',
        isDark: false,
        subTitle: 'LAXMI VAIBHAV GAS AGENCY',
        slogan: 'Bharatgas',
        tagline: 'Jamkhed Rod Karmala Code-114572',
        bannerText: '#ffffff',
        isCustomBharatgas: true
      }
    };

    const cfg = templateConfigs[selectedTemplate];
    const isMalthan = selectedTemplate === 'newenglishmalthan';
    const isChandra = selectedTemplate === 'chandrabhama';
    const isSwanand = selectedTemplate === 'swanandchincholi';
    const isSamyak = selectedTemplate === 'samyak';
    const isZpKetur2 = selectedTemplate === 'zpketur2';
    const isSiddheshwar = selectedTemplate === 'siddheshwar';
    const isBharatgas = selectedTemplate === 'bharatgas';

    if (selectedTemplate === 'shramikmajdur') {
      // Load logo
      const logo = new Image();
      logo.src = form.schoolLogo;
      await new Promise(r => { logo.onload = r; logo.onerror = r; });

      // Load studentPhoto
      const studentPhoto = new Image();
      studentPhoto.crossOrigin = 'anonymous';
      studentPhoto.src = form.studentPhoto;
      await new Promise(r => { studentPhoto.onload = r; studentPhoto.onerror = r; });

      // Clean background
      ctx.fillStyle = '#F9F9F9';
      ctx.fillRect(0, 0, width, height);

      // Draw thin border frame around the card with Royal Blue
      ctx.strokeStyle = '#2323FF';
      ctx.lineWidth = 1.8 * scale;
      ctx.strokeRect(4 * scale, 4 * scale, width - 8 * scale, height - 8 * scale);

      if (side === 'front') {
        // Rule 5 & 6: Header background color #2323FF and taller height (92 * scale)
        ctx.fillStyle = '#2323FF';
        ctx.fillRect(4 * scale, 4 * scale, width - 8 * scale, 92 * scale);

        // Header bottom yellow boundary accent
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.moveTo(4 * scale, 96 * scale);
        ctx.lineTo(width - 4 * scale, 96 * scale);
        ctx.stroke();

        // Logo inside header - left-aligned
        if (logo.complete && logo.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(46 * scale, 50 * scale, 22 * scale, 0, 2 * Math.PI);
          ctx.clip();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(24 * scale, 28 * scale, 44 * scale, 44 * scale);
          ctx.drawImage(logo, 24 * scale, 28 * scale, 44 * scale, 44 * scale);
          ctx.restore();

          // Border for logo circle
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.arc(46 * scale, 50 * scale, 22 * scale, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          // Yellow flag fallback left-aligned
          ctx.font = `${18 * scale}px "Inter", sans-serif`;
          ctx.textBaseline = 'middle';
          ctx.textAlign = 'center';
          ctx.fillText('🚩', 46 * scale, 50 * scale);
        }

        // "सम्यक फाऊंडेशन प्रणित" centered horizontally in the header
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `950 ${10.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('सम्यक फाऊंडेशन प्रणित', width / 2, 28 * scale);

        // Reset text alignment to left for elements next to logo
        ctx.textAlign = 'left';

        // "श्रमिक मजदुर संघ (MDM विभाग)" in the middle
        ctx.fillStyle = '#FFCE1B'; // bright golden yellow
        ctx.font = `950 ${17 * scale}px "Inter", sans-serif`;
        ctx.fillText('श्रमिक मजदुर संघ (MDM विभाग)', 78 * scale, 49 * scale);

        // New Address left-aligned white sub-heading
        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${9.2 * scale}px "Inter", sans-serif`;
        ctx.fillText('ऑफिस - बाबा कॉम्लेक्स, कोपरगाव, जि. अहिल्यानगर. मो.-9370444002', 78 * scale, 70 * scale);

        // Under-header gray strip with IDENTITY CARD centered (positioned neatly at 96 * scale)
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(4 * scale, 96 * scale, width - 8 * scale, 22 * scale);
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 0.5 * scale;
        ctx.beginPath();
        ctx.moveTo(4 * scale, 118 * scale);
        ctx.lineTo(width - 4 * scale, 118 * scale);
        ctx.stroke();

        // Rule 1: Center "ओळखपत्र (IDENTITY CARD)"
        ctx.fillStyle = '#2323FF';
        ctx.textAlign = 'center';
        ctx.font = `950 ${12 * scale}px "Inter", sans-serif`;
        ctx.fillText('ओळखपत्र (IDENTITY CARD)', width / 2, 107 * scale);

        // Rule 4: Center ID Card photo horizontally on the left side, vertically centered
        // We've adjusted photoY higher and spacing to remove any height gap (Requirement 4)
        const photoH = 126 * scale;
        const photoW = 98 * scale;
        const photoY = 124 * scale; 
        const photoX = 18 * scale;
        const photoR = 5 * scale;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
        ctx.clip();
        if (studentPhoto.complete && studentPhoto.naturalWidth > 0) {
          ctx.drawImage(studentPhoto, photoX, photoY, photoW, photoH);
        } else {
          ctx.fillStyle = '#e5e5e5';
          ctx.fillRect(photoX, photoY, photoW, photoH);
          ctx.fillStyle = '#a3a3a3';
          ctx.textAlign = 'center';
          ctx.font = `${36 * scale}px "Inter", sans-serif`;
          ctx.fillText('👤', photoX + photoW / 2, photoY + photoH / 2 + 12 * scale);
        }
        ctx.restore();

        // Photo Outline Border with Royal Blue
        ctx.strokeStyle = '#2323FF';
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
        ctx.stroke();

        // Right side labels and values
        const labelsX = 132 * scale;
        const valuesX = 184 * scale;
        let currentY = photoY + 16 * scale; // align values near vertical top of photo
        const valueBoxW = width - valuesX - 18 * scale; // Wide box utilizing full remaining width since we removed the corner elements

        // 1. नाव
        ctx.fillStyle = '#dc2626'; // Red
        ctx.textAlign = 'left';
        ctx.font = `950 ${14.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('नाव :', labelsX, currentY);

        // draw name background bar matching
        ctx.fillStyle = '#eff6ff';
        ctx.beginPath();
        ctx.roundRect(valuesX - 4 * scale, currentY - 12 * scale, valueBoxW + 4 * scale, 21 * scale, 3 * scale);
        ctx.fill();
        ctx.strokeStyle = '#bfdbfe';
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = `950 ${14 * scale}px "Inter", sans-serif`;
        const dispName = form.studentName || 'सुरेखा राजेंद्र संकट';
        ctx.fillText(dispName.length > 25 ? dispName.substring(0, 23) + '...' : dispName, valuesX + 2 * scale, currentY + 2 * scale);

        // 2. पत्ता
        currentY += 44 * scale;
        ctx.fillStyle = '#dc2626'; // Red
        ctx.font = `950 ${14.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('पत्ता :', labelsX, currentY);

        ctx.fillStyle = '#1f2937';
        ctx.font = `bold ${12.5 * scale}px "Inter", sans-serif`;
        let dispAddr = form.academicYear || 'रा.थैरगाव ता.कर्जत. जि.अहिल्यानगर.';
        if (dispAddr.length > 50) {
          dispAddr = dispAddr.substring(0, 47) + '...';
        }
        if (dispAddr.length > 25) {
          ctx.fillText(dispAddr.substring(0, 24), valuesX, currentY - 4 * scale);
          ctx.fillText(dispAddr.substring(24, 50), valuesX, currentY + 10 * scale);
        } else {
          ctx.fillText(dispAddr, valuesX, currentY);
        }

        // 3. मोबा
        currentY += 44 * scale;
        ctx.fillStyle = '#dc2626'; // Red
        ctx.font = `950 ${14.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('मोबा :', labelsX, currentY);

        // draw mobile border line
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.roundRect(valuesX - 4 * scale, currentY - 12 * scale, 134 * scale, 21 * scale, 3 * scale);
        ctx.fill();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 0.5 * scale;
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = `950 ${14 * scale}px "Inter", sans-serif`;
        ctx.fillText(form.bloodGroup || '8483876891', valuesX + 2 * scale, currentY + 2 * scale);

        // Beautiful centered authority double-deck footer with signatures (Requirement 1, 2, 3)
        // Redesigned with proper professional spacing and layout
        ctx.fillStyle = '#fcfcfd';
        ctx.fillRect(4 * scale, 274 * scale, width - 8 * scale, 72 * scale);
        ctx.strokeStyle = '#2323FF';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(4 * scale, 274 * scale);
        ctx.lineTo(width - 4 * scale, 274 * scale);
        ctx.stroke();

        // Signature image
        const presSig = new Image();
        presSig.src = form.principalSignature || SAMYAK_PRESIDENT_SIG;
        await new Promise(r => { presSig.onload = r; presSig.onerror = r; });
        if (presSig.complete && presSig.naturalWidth > 0) {
          ctx.drawImage(presSig, width / 2 - 35 * scale, 276 * scale, 70 * scale, 20 * scale);
        }

        let dispPresName = form.presidentName || 'सौ.सविता महेंद्र विधाते';
        if (dispPresName.length > 30) {
          dispPresName = dispPresName.substring(0, 27) + '...';
        }
        ctx.fillStyle = '#dc2626'; // Changed to Red
        ctx.textAlign = 'center';
        ctx.font = `950 ${12 * scale}px "Inter", sans-serif`;
        ctx.fillText(dispPresName, width / 2, 313 * scale);

        let dispPresTitle = form.presidentTitle || 'जिल्हा अध्यक्षा अहिल्यानगर';
        if (dispPresTitle.length > 40) {
          dispPresTitle = dispPresTitle.substring(0, 37) + '...';
        }
        ctx.fillStyle = '#0055FF'; // Changed to Neon Blue
        ctx.font = `900 ${10 * scale}px "Inter", sans-serif`;
        ctx.fillText(dispPresTitle, width / 2, 331 * scale);
      } else {
        // Back side rendering for Shramik Majdur with blue header bg
        ctx.fillStyle = '#2323FF';
        ctx.fillRect(4 * scale, 4 * scale, width - 8 * scale, 48 * scale);

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(4 * scale, 52 * scale);
        ctx.lineTo(width - 4 * scale, 52 * scale);
        ctx.stroke();

        // "सम्यक फाऊंडेशन प्रणित" centered above back heading
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${9 * scale}px "Inter", sans-serif`;
        ctx.fillText('सम्यक फाऊंडेशन प्रणित', width / 2, 20 * scale);

        // "श्रमिक मजदुर संघ (MDM विभाग)" centered below
        ctx.fillStyle = '#FFCE1B';
        ctx.font = `950 ${13.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('श्रमिक मजदुर संघ (MDM विभाग)', width / 2, 35 * scale);

        // T&C Marathi Lists
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'left';
        ctx.font = `950 ${12 * scale}px "Inter", sans-serif`;
        ctx.fillText('नियम व अटी :', 24 * scale, 82 * scale);

        ctx.fillStyle = '#475569';
        ctx.font = `650 ${10.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('१. हे ओळखपत्र केवळ संबंधित अधिकृत कामासाठीच वैध राहील.', 24 * scale, 102 * scale);
        ctx.fillText('२. ओळखपत्र गहाळ झाल्यास तात्काळ कोपरगाव कार्यालयाशी संपर्क साधावा.', 24 * scale, 122 * scale);
        ctx.fillText('३. गैरवापर आढळल्यास ओळखपत्र रद्द करण्यात येईल व योग्य कारवाई केली जाईल.', 24 * scale, 142 * scale);

        // Signatures Line
        const sigLineY = 224 * scale;

        // Left Signature lines
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(40 * scale, sigLineY);
        ctx.lineTo(130 * scale, sigLineY);
        ctx.stroke();

        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        ctx.font = `bold ${8.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('सभासद सही', 85 * scale, sigLineY + 12 * scale);
        ctx.font = `500 ${7.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('(Member Signature)', 85 * scale, sigLineY + 22 * scale);

        // Right Authorized Signer
        ctx.beginPath();
        ctx.moveTo(width - 130 * scale, sigLineY);
        ctx.lineTo(width - 40 * scale, sigLineY);
        ctx.stroke();

        // draw savita signature if present
        const autSig = new Image();
        autSig.src = SAMYAK_PRESIDENT_SIG;
        await new Promise(r => { autSig.onload = r; autSig.onerror = r; });
        if (autSig.complete && autSig.naturalWidth > 0) {
          ctx.drawImage(autSig, width - 130 * scale + 15 * scale, sigLineY - 32 * scale, 60 * scale, 28 * scale);
        }

        ctx.fillStyle = '#2323FF';
        ctx.textAlign = 'center';
        ctx.font = `bold ${8.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('जिल्हाध्यक्ष स्वाक्षरी', width - 85 * scale, sigLineY + 12 * scale);
        ctx.font = `500 ${7.5 * scale}px "Inter", sans-serif`;
        ctx.fillText('(Authorized Signatory)', width - 85 * scale, sigLineY + 22 * scale);

        // Barcode section at bottom
        const barW = 180 * scale;
        const barH = 30 * scale;
        const barX = width / 2 - barW / 2;
        const barY = height - 60 * scale;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#000000';
        for (let i = 2 * scale; i < barW - 2 * scale; i += 3 * scale) {
          const barThickness = (Math.sin(i * 0.3) > 0.1 ? 2.5 : 0.8) * scale;
          ctx.fillRect(barX + i, barY + 1 * scale, barThickness, barH - 2 * scale);
        }

        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        ctx.font = `bold ${8 * scale}px "JetBrains Mono", monospace`;
        ctx.fillText(form.studentId.toUpperCase() || 'UNION-MDM-8483', width / 2, height - 18 * scale);
      }

      return canvas.toDataURL('image/png');
    }

    // Background canvas
    if (isZpKetur2 || isSiddheshwar || isBharatgas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw standard rigid double card border (black inner layout style)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(3 * scale, 3 * scale, width - 6 * scale, height - 6 * scale);
    } else if (isMalthan || isChandra || isSwanand || isSamyak) {
      const bGrad = ctx.createLinearGradient(0, 0, width, height);
      bGrad.addColorStop(0, '#f0f9ff');
      bGrad.addColorStop(0.5, '#ffffff');
      bGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = bGrad;
      ctx.fillRect(0, 0, width, height);
      
      // Draw background circle grids
      ctx.strokeStyle = (isChandra || isSwanand || isSamyak) ? '#3b82f6' : '#dcf2fe';
      ctx.lineWidth = 0.45 * scale;
      ctx.save();
      ctx.globalAlpha = isChandra ? 0.15 : 0.28;
      
      ctx.beginPath();
      ctx.arc(width - 30 * scale, height / 2, 140 * scale, 0, 2 * Math.PI);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(width - 30 * scale, height / 2, 110 * scale, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = cfg.cardBg;
      ctx.fillRect(0, 0, width, height);

      // Draw stylized micro-dots
      ctx.fillStyle = cfg.dotColor;
      for (let x = 0; x < width; x += 12 * scale) {
        for (let y = 0; y < height; y += 12 * scale) {
          ctx.beginPath();
          ctx.arc(x, y, 0.6 * scale, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Load logo first
    const logo = new Image();
    logo.src = form.schoolLogo;
    await new Promise(r => { logo.onload = r; logo.onerror = r; });

    // Preload school building background image for Swanand
    let swanandBgImg: HTMLImageElement | null = null;
    if (isSwanand) {
      swanandBgImg = new Image();
      swanandBgImg.crossOrigin = 'anonymous';
      swanandBgImg.src = 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop';
      await new Promise(r => { if (swanandBgImg) { swanandBgImg.onload = r; swanandBgImg.onerror = r; } });
    }

    // Draw Watermark in the background
    if (isSwanand && swanandBgImg && swanandBgImg.complete && swanandBgImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.drawImage(swanandBgImg, 15 * scale, 100 * scale, width - 30 * scale, 180 * scale);
      ctx.restore();
    } else if (!isMalthan && !isChandra && !isSwanand && logo.complete && logo.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = cfg.isDark ? 0.03 : 0.04;
      ctx.drawImage(logo, width / 2 - 50 * scale, height * 0.62, 100 * scale, 100 * scale);
      ctx.restore();
    }

    if (selectedTemplate === 'newenglishmalthan') {
      // Swastha Trust style bilingual
      // Yellow/Gold top curved arc/banner
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 14 * scale);
      ctx.quadraticCurveTo(width / 2, 17 * scale, 0, 14 * scale);
      ctx.closePath();
      ctx.fill();

      // Top yellow text info: "◆ स्वानव शिक्षण संस्था, विचाला काळदात ◆"
      ctx.fillStyle = '#1e3a8a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${5.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('◆ स्वानव शिक्षण संस्था, विचाला काळदात ◆', width / 2, 7 * scale);

      // White background for main header text
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 14 * scale, width, 41 * scale);

      // Large Red Main Title: "न्यू इंग्लिश स्कूल मलठण."
      ctx.fillStyle = '#dc2626';
      ctx.textAlign = 'center';
      ctx.font = `950 ${16.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('न्यू इंग्लिश स्कूल मलठण.', width / 2, 33 * scale);

      // Sub-heading: "ता. कर्जत जि. अहिल्यानगर"
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `bold ${8.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('ता. कर्जत जि. अहिल्यानगर', width / 2, 48 * scale);

      // Red round pill container for UDISE NO
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(width / 2 - 62 * scale, 56 * scale, 124 * scale, 12 * scale, 6 * scale);
      ctx.fill();

      // White text for UDISE
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `bold ${6.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('UDISE NO-27260408402', width / 2, 62 * scale);

      // Draw the swastha trust logo on the top-left
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(36 * scale, 42 * scale, 22 * scale, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 * scale, 20 * scale, 44 * scale, 44 * scale);
        ctx.drawImage(logo, 14 * scale, 20 * scale, 44 * scale, 44 * scale);
        ctx.restore();

        // Draw a neat golden outline border around it
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(36 * scale, 42 * scale, 22 * scale, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (selectedTemplate === 'chandrabhama') {
      // Rayat Shikshan Sanstha's Chandrabhama Mahavidyalay Karjat
      // Solid deep blue top background with beautiful gold curved arches
      ctx.fillStyle = '#0f2963';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 58 * scale);
      ctx.quadraticCurveTo(width / 2, 64 * scale, 0, 58 * scale);
      ctx.closePath();
      ctx.fill();

      // Searing gold bottom boundary
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 58 * scale);
      ctx.quadraticCurveTo(width / 2, 64 * scale, width, 58 * scale);
      ctx.stroke();

      // Draw the circular school logo
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(38 * scale, 29 * scale, 21 * scale, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(17 * scale, 8 * scale, 42 * scale, 42 * scale);
        ctx.drawImage(logo, 17 * scale, 8 * scale, 42 * scale, 42 * scale);
        ctx.restore();

        // Outer gold circle
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.arc(38 * scale, 29 * scale, 21 * scale, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Header text alignment (to the right of the logo)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Top line
      ctx.fillStyle = '#eab308';
      ctx.font = `bold ${5.5 * scale}px "Inter", sans-serif`;
      ctx.fillText("Rayat Shikshan Sanstha's", 68 * scale, 12 * scale);

      // Main line
      ctx.fillStyle = '#ffffff';
      ctx.font = `950 ${9.5 * scale}px "Inter", sans-serif`;
      ctx.fillText("CHANDRABHAMA MAHAVIDYALAY", 68 * scale, 23 * scale);

      ctx.fillStyle = '#eab308';
      ctx.font = `900 ${7.5 * scale}px "Inter", sans-serif`;
      ctx.fillText("KARJAT, DIST-AHILYANAGAR", 68 * scale, 33 * scale);

      // Arts, Commerce and Science college tagline
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${5 * scale}px "Inter", sans-serif`;
      ctx.fillText("ARTS, SCIENCE & COMMERCE COLLEGE", 68 * scale, 43 * scale);
    } else if (selectedTemplate === 'swanandchincholi') {
      // Solid deep blue top background with beautiful gold curved arches
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 64 * scale);
      ctx.quadraticCurveTo(width / 2, 70 * scale, 0, 64 * scale);
      ctx.closePath();
      ctx.fill();

      // Searing gold bottom boundary
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 64 * scale);
      ctx.quadraticCurveTo(width / 2, 70 * scale, width, 64 * scale);
      ctx.stroke();

      // Draw the circular school logo (increased size)
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(32 * scale, 32 * scale, 24 * scale, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8 * scale, 8 * scale, 48 * scale, 48 * scale);
        ctx.drawImage(logo, 8 * scale, 8 * scale, 48 * scale, 48 * scale);
        ctx.restore();

        // Outer gold circle
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(32 * scale, 32 * scale, 24 * scale, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Header text alignment centered, offset to the right slightly to accommodate larger logo
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textCenterX = width / 2 + 15 * scale;
      
      // Top line: Organization Name (increased size)
      ctx.fillStyle = '#eab308';
      ctx.font = `bold ${5.8 * scale}px "Inter", sans-serif`;
      ctx.fillText("SWANAND SHIKSHAN SANASTHA CHINCHOLI KALDAT", textCenterX, 13 * scale);

      // Main line: School name (increased size)
      ctx.fillStyle = '#ffffff';
      ctx.font = `950 ${12.5 * scale}px "Inter", sans-serif`;
      ctx.fillText("SWANAND VIDYALAY", textCenterX, 25 * scale);

      // School address (increased size)
      ctx.fillStyle = '#eab308';
      ctx.font = `900 ${8.2 * scale}px "Inter", sans-serif`;
      ctx.fillText("CHINCHOLI KALDAT, TAL-KARJAT", textCenterX, 38 * scale);

      // Dist name tagline (increased size)
      ctx.fillStyle = '#f8fafc';
      ctx.font = `bold ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText("DIST-AHILYANAGAR", textCenterX, 49 * scale);
    } else if (selectedTemplate === 'samyak') {
      // Deep blue arched backdrop header for Samyak Foundation
      ctx.fillStyle = '#0a3e8a';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, 68 * scale);
      ctx.quadraticCurveTo(width / 2, 78 * scale, 0, 68 * scale);
      ctx.closePath();
      ctx.fill();

      // Searing gold/yellow border line
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.moveTo(0, 68 * scale);
      ctx.quadraticCurveTo(width / 2, 78 * scale, width, 68 * scale);
      ctx.stroke();

      // Top slogan text: "सम्यक फाउंडेशन प्रणित"
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${6 * scale}px "Inter", sans-serif`;
      ctx.fillText('सम्यक फाउंडेशन प्रणित', width / 2 + 15 * scale, 13 * scale);

      // Large Main Organization Heading: "श्रमिक मजदुर संघ (MDM विभाग)" in gold/yellow
      ctx.fillStyle = '#eab308';
      ctx.font = `950 ${11.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('श्रमिक मजदुर संघ (MDM विभाग)', width / 2 + 15 * scale, 28 * scale);

      // Office details tagline in white
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${5.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('ऑफिस - बाबा कॉम्प्लेक्स ,कोपरगाव,जि.अहिल्यानगर.मो.-9370444002', width / 2 + 15 * scale, 43 * scale);

      // Draw Samyak Logo on the top-left (absolute top left padding coordinates)
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.save();
        // Drawing circular shield
        ctx.beginPath();
        ctx.arc(32 * scale, 32 * scale, 21 * scale, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11 * scale, 11 * scale, 42 * scale, 42 * scale);
        ctx.drawImage(logo, 11 * scale, 11 * scale, 42 * scale, 42 * scale);
        ctx.restore();

        // Outline border around logo
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.arc(32 * scale, 32 * scale, 21 * scale, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (selectedTemplate === 'zpketur2') {
      // White top area - draw top bold red heading
      ctx.fillStyle = '#dc2626';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `950 ${7.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('जिल्हा परिषद प्राथमिक शाळा', width / 2, 14 * scale);

      // Draw the circular Solapur District Seal on the left
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(32 * scale, 34 * scale, 15 * scale, 0, 2 * Math.PI);
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(17 * scale, 19 * scale, 30 * scale, 30 * scale);
        ctx.drawImage(logo, 17 * scale, 19 * scale, 30 * scale, 30 * scale);
        ctx.restore();

        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.arc(32 * scale, 34 * scale, 15 * scale, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw the middle main title "केतुर नं. २"
      ctx.fillStyle = '#dc2626';
      ctx.font = `950 ${13.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('केतुर नं. २', width / 2, 34 * scale);

      // Draw the SSA Pencil Logo on the right
      const pencilImg = new Image();
      pencilImg.src = SSA_PENCIL_LOGO;
      await new Promise(r => { pencilImg.onload = r; pencilImg.onerror = r; });
      if (pencilImg.complete && pencilImg.naturalWidth > 0) {
        ctx.drawImage(pencilImg, width - 48 * scale, 21 * scale, 35 * scale, 13 * scale);
      }

      // Draw UDISE NO below it
      ctx.fillStyle = '#dc2626';
      ctx.font = `800 ${6.0 * scale}px "Inter", sans-serif`;
      ctx.fillText(`UDISE NO - ${form.divisionSection || '27300305002'}`, width / 2, 48 * scale);

      // Draw solid red banner bar
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4 * scale, 55 * scale, width - 8 * scale, 17 * scale);

      // Text inside banner
      ctx.fillStyle = '#ffffff';
      ctx.font = `950 ${8.5 * scale}px "Inter", sans-serif`;
      ctx.fillText(form.academicYear || 'ता.करमाळा जि.सोलापूर', width / 2, 63.5 * scale);

    } else if (selectedTemplate === 'siddheshwar') {
      // Top left "शिस्त व शिक्षण."
      ctx.fillStyle = '#dc2626';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${7.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('शिस्त व शिक्षण.', 15 * scale, 12 * scale);

      // Top right "स्थापना-1967."
      ctx.textAlign = 'right';
      ctx.fillText('स्थापना-1967.', width - 15 * scale, 12 * scale);

      // Centered "यशवंत शिक्षण संस्था कर्जत,अहमदनगर."
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = `800 ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('यशवंत शिक्षण संस्था कर्जत,अहमदनगर.', width / 2 + 15 * scale, 18 * scale);

      // Central huge title "सिद्धेश्वर"
      ctx.fillStyle = '#dc2626';
      ctx.font = `950 ${24 * scale}px "Inter", sans-serif`;
      ctx.fillText('सिद्धेश्वर', width / 2 + 18 * scale, 38 * scale);

      // Draw the Yashwant Sanstha Logo on the left
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(logo, 10 * scale, 16 * scale, 34 * scale, 34 * scale);
        ctx.restore();
      }

      // Draw horizontal red divider line
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4 * scale, 54 * scale, width - 8 * scale, 1.8 * scale);

      // Subtitle "माध्यमिक व उच्च माध्यमिक विद्यालय,"
      ctx.fillStyle = '#dc2626';
      ctx.font = `950 ${10.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('माध्यमिक व उच्च माध्यमिक विद्यालय,', width / 2, 64 * scale);

      // Subtitle address "भांबोरा ता.कर्जत जि.अहमदनगर."
      ctx.font = `950 ${8.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('भांबोरा ता.कर्जत जि.अहमदनगर.', width / 2, 75 * scale);

      // Draw bottom banner solid red line
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4 * scale, 81 * scale, width - 8 * scale, 1.5 * scale);

      // Draw "ओळखपत्र" inside a black box outline below it
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(width / 2 - 25 * scale, 86 * scale, 50 * scale, 9 * scale);
      
      ctx.fillStyle = '#000000';
      ctx.font = `900 ${6.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('ओळखपत्र', width / 2, 91 * scale);

    } else if (selectedTemplate === 'bharatgas') {
      // Solid orange/gold plate
      ctx.fillStyle = '#f97316';
      ctx.fillRect(4 * scale, 4 * scale, width - 8 * scale, 64 * scale);

      // Draw the Bharatgas Flame Symbol Logo in the top-middle/right
      const flameImg = new Image();
      flameImg.src = BHARATGAS_SYMBOL_LOGO;
      await new Promise(r => { flameImg.onload = r; flameImg.onerror = r; });
      if (flameImg.complete && flameImg.naturalWidth > 0) {
        ctx.drawImage(flameImg, width / 2 + 54 * scale, 8 * scale, 16 * scale, 16 * scale);
      }

      // Draw large bold "Bharatgas" text
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0f172a'; // Deep Navy
      ctx.font = `950 ${22 * scale}px "Inter", sans-serif`;
      ctx.fillText('Bharatgas', width / 2, 21 * scale);

      // Red and blue horizontal outline bars underneath Bharatgas word
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(width / 2 - 62 * scale, 29.5 * scale, 124 * scale, 1.2 * scale);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(width / 2 - 62 * scale, 31 * scale, 124 * scale, 1.2 * scale);

      // Large sub-title "LAXMI VAIBHAV GAS AGENCY" in light-blue / white
      ctx.fillStyle = '#ffffff';
      ctx.font = `950 ${9.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('LAXMI VAIBHAV GAS AGENCY', width / 2, 42 * scale);

      // Agency address / details "Jamkhed Rod Karmala Code-114572"
      ctx.font = `900 ${7.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('Jamkhed Rod Karmala Code-114572', width / 2, 54 * scale);

    } else {
      // Layer 1: Accent Arched Header Backdrop
      ctx.fillStyle = cfg.accent; 
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, height * 0.23);
      ctx.quadraticCurveTo(width / 2, height * 0.25, width, height * 0.23);
      ctx.lineTo(width, 0);
      ctx.closePath();
      ctx.fill();

      // Layer 2: Primary Arched Header Backdrop
      ctx.fillStyle = cfg.primary; 
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, height * 0.22);
      ctx.quadraticCurveTo(width / 2, height * 0.24, width, height * 0.22);
      ctx.lineTo(width, 0);
      ctx.closePath();
      ctx.fill();

      // Draw School Logo / Crest on Header
      if (logo.complete && logo.naturalWidth > 0) {
        ctx.drawImage(logo, 20 * scale, 16 * scale, 42 * scale, 42 * scale);
      }

      // Header Texts
      ctx.fillStyle = cfg.bannerText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${14 * scale}px "Inter", sans-serif`;
      const schoolNameStr = (form.schoolName || 'BRIGHT FUTURE').toUpperCase();
      ctx.fillText(schoolNameStr.length > 25 ? schoolNameStr.substring(0, 23) + '...' : schoolNameStr, 68 * scale, 24 * scale);

      ctx.fillStyle = cfg.accent; 
      ctx.font = `800 ${6 * scale}px "Inter", sans-serif`;
      ctx.fillText(cfg.subTitle, 68 * scale, 35 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.75;
      ctx.font = `italic 500 ${5.5 * scale}px "Inter", sans-serif`;
      ctx.fillText(cfg.tagline, 68 * scale, 44 * scale);
      ctx.globalAlpha = 1.0;
    }


    // Draw Student Photo inside a curved rounded rectangle outline
    const isCenterLayout = (isMalthan || isChandra || isSwanand || isSamyak || isZpKetur2 || isSiddheshwar || isBharatgas);
    const photoX = isMalthan ? (width / 2 - 44 * scale) : isCenterLayout ? (width / 2 - 44 * scale) : (width - 115 * scale);
    const photoY = isMalthan ? (height * 0.175) : isZpKetur2 ? (93 * scale) : isSiddheshwar ? (102 * scale) : isBharatgas ? (90 * scale) : isCenterLayout ? (94 * scale) : (height * 0.27);
    const photoW = isCenterLayout ? 88 * scale : 90 * scale;
    const photoH = (isZpKetur2 || isSiddheshwar || isBharatgas) ? 104 * scale : isCenterLayout ? 110 * scale : 112 * scale;
    const photoR = isSamyak ? 4 * scale : (isZpKetur2 || isSiddheshwar || isBharatgas) ? 0 : 8 * scale; // samyak is more boxy elegant frame, zpketur/sidd/gas has sharp corners

    const studentPhoto = new Image();
    studentPhoto.crossOrigin = 'anonymous';
    studentPhoto.src = form.studentPhoto;
    await new Promise(r => { studentPhoto.onload = r; studentPhoto.onerror = r; });

    ctx.save();
    ctx.beginPath();
    if (isZpKetur2 || isSiddheshwar || isBharatgas) {
      ctx.rect(photoX, photoY, photoW, photoH);
    } else {
      ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
    }
    ctx.clip();
    if (studentPhoto.complete && studentPhoto.naturalWidth > 0) {
      ctx.drawImage(studentPhoto, photoX, photoY, photoW, photoH);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(photoX, photoY, photoW, photoH);
    }
    ctx.restore();

    // Photo Border Outline
    if (isZpKetur2 || isSiddheshwar) {
      // Double framed premium border: Outer red, inner black
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8 * scale;
      ctx.strokeRect(photoX - 1.2 * scale, photoY - 1.2 * scale, photoW + 2.4 * scale, photoH + 2.4 * scale);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(photoX, photoY, photoW, photoH);
    } else if (isBharatgas) {
      // Double framed premium border: Outer yellow/gold, inner black
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.8 * scale;
      ctx.strokeRect(photoX - 1.2 * scale, photoY - 1.2 * scale, photoW + 2.4 * scale, photoH + 2.4 * scale);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(photoX, photoY, photoW, photoH);
    } else if (isSamyak) {
      // Double framed premium border: Outer yellow, inner red
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.roundRect(photoX - 1.5 * scale, photoY - 1.5 * scale, photoW + 3 * scale, photoH + 3 * scale, photoR + 1 * scale);
      ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
      ctx.stroke();
    } else {
      ctx.strokeStyle = cfg.primary;
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoW, photoH, photoR);
      ctx.stroke();
    }


    // Core Data Fields list alignment matching the lists with custom mini indicators
    const gridYStart = selectedTemplate === 'newenglishmalthan' ? height * 0.495 : isZpKetur2 ? 232 * scale : (isSwanand || isSamyak) ? 236 * scale : isChandra ? 238 * scale : height * 0.28;
    const spacing = selectedTemplate === 'newenglishmalthan' ? 15.5 * scale : isZpKetur2 ? 21.0 * scale : (isChandra || isSwanand || isSamyak) ? 20.8 * scale : 19 * scale;
    const iconRad = 6 * scale;
    const labelX = 36 * scale;
    const colonX = 84 * scale;
    const valX = 90 * scale;

    const fields = (() => {
      if (selectedTemplate === 'newenglishmalthan') {
        return [
          { label: 'जन्म दि', value: form.dob ? formatDateStr(form.dob) : '12-09-1969', icon: '📅', colon: ':-' },
          { label: 'रक्त गट', value: form.bloodGroup || 'B+ Positive', icon: '🩸', colon: ':-', isBlood: true },
          { label: 'नेमणूक', value: form.academicYear || '12-08-1993', icon: '💼', colon: ':-' },
          { label: 'आयडी क्र', value: form.studentId || '27260408402', icon: '💳', colon: ':-' },
          { label: 'पत्ता', value: 'ता. कर्जत जि. अहिल्यानगर', icon: '📍', colon: ':-' }
        ];
      } else if (isChandra) {
        return [
          { label: 'Post', value: form.classCourse || 'Assit Prof.', icon: '💼', colon: ':-' },
          { label: 'Depa', value: form.divisionSection || 'Po.Science', icon: '🏛', colon: ':-' },
          { label: 'DOB', value: form.dob ? formatDateStr(form.dob) : '28-01-1991', icon: '📅', colon: ':-' },
          { label: 'Moba', value: form.bloodGroup || '9403102571', icon: '📞', colon: ':-' },
          { label: 'Address', value: form.academicYear || 'AP-Karjat', icon: '📍', colon: ':-' },
          { label: 'ID No', value: form.studentId || 'CMBK/2024/125', icon: '💳', colon: ':-' }
        ];
      } else if (isSwanand) {
        return [
          { label: 'Reg No', value: form.studentId || '4869', icon: '💳', colon: ':-' },
          { label: 'DOB', value: form.dob ? formatDateStr(form.dob) : '04/05/2011', icon: '📅', colon: ':-' },
          { label: 'Mobile', value: form.bloodGroup || '9545333277', icon: '📞', colon: ':-' },
          { label: 'Aadhar', value: form.divisionSection || '5728 5424 7098', icon: '🆔', colon: ':-' },
          { label: 'Address', value: form.academicYear || 'Chincholi Kaldat Tal-Karjat', icon: '📍', colon: ':-' }
        ];
      } else if (isSamyak) {
        return [
          { label: 'नाव', value: form.studentName || 'श्रीमती सविता विधाते', icon: '👤', colon: ':-' },
          { label: 'आयडी क्र', value: form.studentId || 'SM-MDM-9372', icon: '💳', colon: ':-' },
          { label: 'पद', value: form.classCourse || 'तालुका अध्यक्ष', icon: '💼', colon: ':-' },
          { label: 'गाव/पत्ता', value: form.divisionSection || 'कोपरगाव, अहिल्यानगर', icon: '📍', colon: ':-' },
          { label: 'मोबाईल', value: form.bloodGroup || '9370444002', icon: '📞', colon: ':-' }
        ];
      } else if (isZpKetur2) {
        return [
          { label: 'नाव', value: form.studentName || 'ठाेंबरे राजलक्ष्मी गणेश', icon: '👤', colon: ':-' },
          { label: 'इयत्ता', value: form.classCourse || 'दुसरी', icon: '🎓', colon: ':-' },
          { label: 'रजि.नं.', value: form.studentId || '1252', icon: '💳', colon: ':-' },
          { label: 'जन्म दि.', value: form.dob ? form.dob.split('-').reverse().join('-') : '02-02-2017', icon: '📅', colon: ':-' },
          { label: 'मो.', value: form.bloodGroup || '9373608302', icon: '📞', colon: ':-' }
        ];
      } else if (isSiddheshwar) {
        return [
          { label: 'नाव', value: form.studentName || 'WAGHMARE SACHIN RAJARAM', icon: '👤', colon: ':-' },
          { label: 'इयत्ता', value: form.classCourse || '10th STD', icon: '🎓', colon: ':-' },
          { label: 'रजि.नं.', value: form.studentId || '421', icon: '💳', colon: ':-' },
          { label: 'जन्म दि.', value: form.dob ? form.dob.split('-').reverse().join('-') : '15-06-2009', icon: '📅', colon: ':-' },
          { label: 'मोबाईल', value: form.bloodGroup || '8806543102', icon: '📞', colon: ':-' }
        ];
      } else if (isBharatgas) {
        return [
          { label: 'Name', value: form.studentName || 'WAYKAR SATYAM SHANKAR', icon: '👤', colon: ':-' },
          { label: 'Post', value: form.classCourse || 'Delivery Partner', icon: '💼', colon: ':-' },
          { label: 'ID No.', value: form.studentId || 'BG-7521', icon: '💳', colon: ':-' },
          { label: 'DOB', value: form.dob ? form.dob.split('-').reverse().join('-') : '20-11-1995', icon: '📅', colon: ':-' },
          { label: 'Contact', value: form.bloodGroup || '9845331205', icon: '📞', colon: ':-' }
        ];
      } else {
        return [
          { label: 'Student Name', value: form.studentName || 'N/A', icon: '👤' },
          { label: 'Student ID No.', value: form.studentId || 'N/A', icon: '💳' },
          { label: 'Class / Course', value: form.classCourse || 'N/A', icon: '🎓' },
          { label: 'Division / Section', value: form.divisionSection || 'N/A', icon: '👥' },
          { label: 'Date of Birth', value: formatDateStr(form.dob), icon: '📅' },
          { label: 'Blood Group', value: form.bloodGroup || 'N/A', icon: '🩸', isBlood: true },
          { label: 'Academic Year', value: form.academicYear || 'N/A', icon: '📖' }
        ];
      }
    })();

    if (selectedTemplate === 'newenglishmalthan' || isChandra || isSwanand || isSamyak || isZpKetur2) {
      const roleLabel = (form.classCourse && (
        form.classCourse.toLowerCase().includes('grade') || 
        form.classCourse.toLowerCase().includes('class') || 
        form.classCourse.toLowerCase().includes('std') || 
        form.classCourse.toLowerCase().includes('div') ||
        form.classCourse.toLowerCase().includes('roll') ||
        form.classCourse.toLowerCase().includes('student') ||
        /[\d]/.test(form.classCourse)
      )) ? 'STUDENT' : (isChandra || isSwanand || isSamyak) ? 'MEMBER' : 'STAFF';

      if (selectedTemplate !== 'swanandchincholi' && !isSamyak) {
        // Draw left vertical navy/deep blue sidebar representing the TEACHER/STUDENT wing
        ctx.fillStyle = isSwanand ? '#1e3a8a' : '#0f2963';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.175);
        ctx.bezierCurveTo(28 * scale, height * 0.19, 28 * scale, height * 0.38, 0, height * 0.43);
        ctx.lineTo(0, height * 0.175);
        ctx.closePath();
        ctx.fill();

        // Yellow/Gold arc boundary around left sidebar curve to look premium
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.8 * scale;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.175);
        ctx.bezierCurveTo(30 * scale, height * 0.19, 30 * scale, height * 0.38, 0, height * 0.43);
        ctx.stroke();

        // Write role designation vertically inside sidebar
        ctx.save();
        ctx.translate(11 * scale, height * 0.30);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `900 ${11 * scale}px "Inter", sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(roleLabel, 0, 0);
        ctx.restore();
      }

      if (isChandra || isSwanand || isSamyak) {
        // Center-aligned Name Banner for Chandrabhama / Swanand Chincholi / Samyak
        ctx.fillStyle = isSamyak ? '#ef4444' : isSwanand ? '#1e3a8a' : '#0f2963';
        ctx.beginPath();
        ctx.roundRect(40 * scale, 212 * scale, width - 80 * scale, 18 * scale, 4 * scale);
        ctx.fill();

        // White text for Name
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${8.8 * scale}px "Inter", sans-serif`;
        ctx.fillText(form.studentName.toUpperCase(), width / 2, 221 * scale);
      } else {
        // Center-aligned Ribbon for Name and Designation for Malthan
        // Draw background red wings
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(40 * scale, height * 0.41, width - 80 * scale, 18 * scale);

        // Dark Blue main bar with slanted ends
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(50 * scale, height * 0.407);
        ctx.lineTo(width - 50 * scale, height * 0.407);
        ctx.lineTo(width - 64 * scale, height * 0.407 + 18.5 * scale);
        ctx.lineTo(64 * scale, height * 0.407 + 18.5 * scale);
        ctx.closePath();
        ctx.fill();

        // Name Text inside Blue bar
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${8.8 * scale}px "Inter", sans-serif`;
        ctx.fillText(`नाव :- ${form.studentName || 'कुलकर्णी संजय हरिश्चंद्र'}`, width / 2, height * 0.407 + 9.5 * scale);

        // Designation Pill below Name
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 58 * scale, height * 0.457, 116 * scale, 12 * scale, 6 * scale);
        ctx.fill();

        ctx.fillStyle = '#fef08a'; // gold yellow light
        ctx.textAlign = 'center';
        ctx.font = `bold ${6.8 * scale}px "Inter", sans-serif`;
        ctx.fillText(`पद :- ${form.classCourse || 'मुख्याध्यापक'}`, width / 2, height * 0.457 + 6 * scale);
      }
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    if (isZpKetur2 || isSiddheshwar) {
      ctx.save();
      ctx.translate(14 * scale, height * 0.52);
      ctx.rotate(-Math.PI / 2);
      ctx.font = `900 ${4.4 * scale}px "Inter", sans-serif`;
      ctx.fillStyle = '#171717';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('अनिल पोकळे फोटोग्राफी राशीन - ९२२६८७४४८७', 0, 0);
      ctx.restore();
    }

    fields.forEach((field, idx) => {
      const currentY = gridYStart + idx * spacing;
      const isMalthanRow = selectedTemplate === 'newenglishmalthan';
      const isChandraRow = selectedTemplate === 'chandrabhama';
      const isSwanandRow = selectedTemplate === 'swanandchincholi';
      const isSamyakRow = selectedTemplate === 'samyak';

      if (isZpKetur2 || isSiddheshwar || isBharatgas) {
        // Simple, sharp, high-contrast, clean list for Zila Parishad ID card style
        ctx.textAlign = 'left';
        
        // Label
        ctx.fillStyle = isBharatgas ? '#1e3a8a' : '#000000';
        ctx.font = `950 ${8.2 * scale}px "Inter", sans-serif`;
        ctx.fillText(field.label, 26 * scale, currentY);

        // Colon
        ctx.fillStyle = '#000000';
        ctx.font = `950 ${8.2 * scale}px "Inter", sans-serif`;
        ctx.fillText(field.colon || ':-', 68 * scale, currentY);

        // Value
        ctx.fillStyle = ((isZpKetur2 || isSiddheshwar) && (field.label.includes('जन्म') || field.label.includes('मो') || idx === 0)) ? '#dc2626' : '#000000';
        ctx.font = `950 ${8.5 * scale}px "Inter", sans-serif`;
        ctx.fillText(field.value.toUpperCase(), 80 * scale, currentY);
      } else if (isMalthanRow || isChandraRow || isSwanandRow || isSamyakRow) {
        // Draw light background container pill
        const pillWidth = (isSwanandRow || isSamyakRow) ? (width - 30 * scale) : (width - 84 * scale);
        const pillX = (isSwanandRow || isSamyakRow) ? 15 * scale : 42 * scale;
        ctx.fillStyle = idx % 2 === 0 ? 'rgba(15, 41, 99, 0.04)' : '#ffffff';
        ctx.strokeStyle = 'rgba(15, 41, 199, 0.08)';
        ctx.lineWidth = 0.8 * scale;
        ctx.beginPath();
        ctx.roundRect(pillX, currentY - 7.5 * scale, pillWidth, 15 * scale, 7.5 * scale);
        ctx.fill();
        ctx.stroke();

        // Map colors matching the designed badge row circles
        const badgeColors = (isSwanandRow || isSamyakRow) ? [
          '#0a3e8a', // Row 1 -> Deep Blue
          '#10b981', // Row 2 -> Green
          '#f97316', // Row 3 -> Orange
          '#dc2626', // Row 4 -> Red
          '#8b5cf6', // Row 5 -> Purple
        ] : isChandraRow ? [
          '#0f2963', // Row 1 (Post) -> Deep Blue
          '#10b981', // Row 2 (Depa) -> Green
          '#f97316', // Row 3 (DOB) -> Orange
          '#dc2626', // Row 4 (Moba) -> Red
          '#8b5cf6', // Row 5 (Address) -> Purple
          '#14b8a6', // Row 6 (ID No) -> Teal
        ] : [
          '#3b82f6', // Row 1 (birth date) -> Royal Blue
          '#10b981', // Row 2 (blood) -> Green
          '#f97316', // Row 3 (designation) -> Orange/Amber
          '#8b5cf6', // Row 4 (school) -> Purple
          '#14b8a6', // Row 5 (location) -> Teal
        ];

        // Draw Badge indicator circle on the row left inside
        ctx.fillStyle = badgeColors[idx] || '#1e3a8a';
        ctx.beginPath();
        const badgeX = (isSwanandRow || isSamyakRow) ? 25 * scale : 54 * scale;
        ctx.arc(badgeX, currentY, 5 * scale, 0, 2 * Math.PI);
        ctx.fill();

        // Render mini emoji icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${5 * scale}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(field.icon, badgeX, currentY);

        // Label column
        ctx.textAlign = 'left';
        ctx.fillStyle = isChandraRow ? '#0f2963' : isSamyakRow ? '#0a3e8a' : '#1e3a8a';
        ctx.font = `bold ${6.2 * scale}px "Inter", sans-serif`;
        const labelXPos = (isSwanandRow || isSamyakRow) ? 37 * scale : 66 * scale;
        ctx.fillText(field.label, labelXPos, currentY);

        // Colon list aligning
        const colonXPos = (isSwanandRow || isSamyakRow) ? 79 * scale : (isChandraRow ? 108 * scale : 104 * scale);
        ctx.fillText(field.colon || ':-', colonXPos, currentY);

        // Value column
        ctx.fillStyle = field.isBlood || field.label.includes('जन्म') || field.label === 'Moba' || field.label === 'Mobile' || isSamyakRow && idx === 1 ? '#dc2626' : '#171717';
        const fontSizeVal = ((isSwanandRow || isSamyakRow) && field.value.length > 22) ? 4.8 * scale : 6.5 * scale;
        ctx.font = `bold ${fontSizeVal}px "Inter", sans-serif`;
        const valXPos = (isSwanandRow || isSamyakRow) ? 87 * scale : (isChandraRow ? 116 * scale : 114 * scale);
        ctx.fillText(field.value.toUpperCase(), valXPos, currentY);
      } else {
        // Draw Badge indicator circle with template color
        ctx.fillStyle = cfg.primary;
        ctx.beginPath();
        ctx.arc(20 * scale, currentY, iconRad, 0, 2 * Math.PI);
        ctx.fill();

        // Render mini emoji icon
        ctx.fillStyle = '#ffffff';
        ctx.font = `${6.5 * scale}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(field.icon, 20 * scale, currentY);

        // Label column
        ctx.textAlign = 'left';
        ctx.fillStyle = cfg.labelColor;
        ctx.font = `bold ${7 * scale}px "Inter", sans-serif`;
        ctx.fillText(field.label, labelX, currentY);

        // Colon list aligning
        ctx.fillText(field.colon || ':', colonX, currentY);

        // Value column
        ctx.fillStyle = field.isBlood ? '#ef4444' : cfg.textMain;
        ctx.font = field.isBlood ? `900 ${8.5 * scale}px "Inter", sans-serif` : `800 ${8.5 * scale}px "Inter", sans-serif`;
        ctx.fillText(field.value.toUpperCase(), valX, currentY);
      }
    });

    if (selectedTemplate === 'newenglishmalthan') {
      // Draw overlapping red/blue curved backdrops at the very bottom
      // Bottom left Red wave
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.bezierCurveTo(width * 0.25, height * 0.78, width * 0.45, height * 0.90, width * 0.48, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Yellow boundary on red wave
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.bezierCurveTo(width * 0.25, height * 0.78, width * 0.45, height * 0.90, width * 0.48, height);
      ctx.stroke();

      // Bottom right Blue wave
      ctx.fillStyle = '#0f2963';
      ctx.beginPath();
      ctx.moveTo(width * 0.3, height);
      ctx.bezierCurveTo(width * 0.4, height * 0.90, width * 0.62, height * 0.80, width, height * 0.89);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Cyan boundary line on blue wave
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(width * 0.3, height);
      ctx.bezierCurveTo(width * 0.4, height * 0.90, width * 0.62, height * 0.80, width, height * 0.89);
      ctx.stroke();

      // Draw single Principal Signature stack on the Right
      const sigY = height * 0.75;
      const sSigX = width - 85 * scale;
      const sigBoxW = 70 * scale;

      const pSigImg = new Image();
      pSigImg.src = form.principalSignature || DEFAULT_PRINCIPAL_SIG;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, sSigX + 5 * scale, sigY - 18 * scale, 60 * scale, 18 * scale);
        ctx.restore();
      }

      // Overlap dotted line, title मुख्याध्यापक & Signature
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = `bold ${4.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('.......................................', sSigX + sigBoxW / 2, sigY + 1 * scale);

      ctx.fillStyle = '#dc2626';
      ctx.font = `950 ${6.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('मुख्याध्यापक', sSigX + sigBoxW / 2, sigY + 8 * scale);

      ctx.fillStyle = '#171717';
      ctx.font = `bold ${5.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('Signature', sSigX + sigBoxW / 2, sigY + 13.5 * scale);

      // Centered Floating Barcode Card overlapping footer curves
      const barW = 114 * scale;
      const barH = 26 * scale;
      const barX = width / 2 - barW / 2;
      const barY = height - 35 * scale;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 3 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      for (let i = 4 * scale; i < barW - 4 * scale; i += 2.2 * scale) {
        const barThickness = (Math.sin(i * 0.4) > 0.15 ? 1.4 : 0.6) * scale;
        ctx.fillRect(barX + i, barY + 2.5 * scale, barThickness, 15 * scale);
      }

      ctx.fillStyle = '#171717';
      ctx.textAlign = 'center';
      ctx.font = `bold ${5.5 * scale}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillText(form.studentId.toUpperCase(), width / 2, barY + 22.5 * scale);

    } else if (isChandra) {
      // Draw overlapping golden/deep blue waves at the bottom for Chandrabhama
      // Bottom left Golden wave
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.bezierCurveTo(width * 0.25, height * 0.78, width * 0.45, height * 0.90, width * 0.48, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Blue boundary line on gold wave
      ctx.strokeStyle = '#0f2963';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.bezierCurveTo(width * 0.25, height * 0.78, width * 0.45, height * 0.90, width * 0.48, height);
      ctx.stroke();

      // Bottom right Deep Blue wave
      ctx.fillStyle = '#0f2963';
      ctx.beginPath();
      ctx.moveTo(width * 0.3, height);
      ctx.bezierCurveTo(width * 0.4, height * 0.90, width * 0.62, height * 0.80, width, height * 0.89);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Gold boundary line on blue wave
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(width * 0.3, height);
      ctx.bezierCurveTo(width * 0.4, height * 0.90, width * 0.62, height * 0.80, width, height * 0.89);
      ctx.stroke();

      // Signatures
      const sigY = height * 0.75;
      const pSigX = 24 * scale;
      const sSigX = width - 85 * scale;
      const sigBoxW = 70 * scale;

      // Draw Principal Signature (Right side)
      const pSigImg = new Image();
      pSigImg.src = form.principalSignature || DEFAULT_PRINCIPAL_SIG;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, sSigX + 5 * scale, sigY - 18 * scale, 60 * scale, 18 * scale);
        ctx.restore();
      }

      // Draw Student Signature (Left side)
      const sSigImg = new Image();
      sSigImg.src = form.studentSignature;
      await new Promise(r => { sSigImg.onload = r; sSigImg.onerror = r; });
      if (sSigImg.complete && sSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(sSigImg, pSigX + 5 * scale, sigY - 18 * scale, 60 * scale, 18 * scale);
        ctx.restore();
      }

      // Overlap dotted lines, titles & Signatures
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = `bold ${4.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('.................................', pSigX + sigBoxW / 2, sigY + 1 * scale);
      ctx.fillText('.................................', sSigX + sigBoxW / 2, sigY + 1 * scale);

      ctx.fillStyle = '#0f2963';
      ctx.font = `950 ${6.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('Holder Signature', pSigX + sigBoxW / 2, sigY + 8 * scale);
      ctx.fillText('Principal', sSigX + sigBoxW / 2, sigY + 8 * scale);

      // Centered Floating Barcode Card overlapping footer curves
      const barW = 114 * scale;
      const barH = 26 * scale;
      const barX = width / 2 - barW / 2;
      const barY = height - 35 * scale;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 3 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      for (let i = 4 * scale; i < barW - 4 * scale; i += 2.2 * scale) {
        const barThickness = (Math.sin(i * 0.4) > 0.15 ? 1.4 : 0.6) * scale;
        ctx.fillRect(barX + i, barY + 2.5 * scale, barThickness, 15 * scale);
      }

      ctx.fillStyle = '#171717';
      ctx.textAlign = 'center';
      ctx.font = `bold ${5.5 * scale}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillText(form.studentId.toUpperCase(), width / 2, barY + 22.5 * scale);

    } else if (isSwanand) {
      // Draw slim golden/deep blue grounding stripes at the very bottom, avoiding address overlap
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, height - 7 * scale, width, 2 * scale);

      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(0, height - 5 * scale, width, 5 * scale);

      // Signatures
      const sigY = 348 * scale;
      const sSigX = width - 68 * scale;
      const sigBoxW = 56 * scale;

      // Draw Principal Signature (Right side)
      if (form.principalSignature) {
        const pSigImg = new Image();
        pSigImg.src = form.principalSignature;
        await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
        if (pSigImg.complete && pSigImg.naturalWidth > 0) {
          ctx.save();
          ctx.drawImage(pSigImg, sSigX + 3 * scale, sigY - 18 * scale, 50 * scale, 18 * scale);
          ctx.restore();
        }
      } else {
        // Draw dashed line for signature placeholder
        ctx.strokeStyle = 'rgba(30, 58, 138, 0.4)';
        ctx.lineWidth = 1 * scale;
        ctx.save();
        ctx.setLineDash([3 * scale, 3 * scale]);
        ctx.beginPath();
        ctx.moveTo(sSigX + 5 * scale, sigY - 8 * scale);
        ctx.lineTo(sSigX + sigBoxW - 5 * scale, sigY - 8 * scale);
        ctx.stroke();
        ctx.restore();
      }

      // Overlap dotted lines, titles & Signatures
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = `bold ${4.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('.................................', sSigX + sigBoxW / 2, sigY + 1 * scale);

      ctx.fillStyle = '#dc2626';
      ctx.font = `950 ${6.2 * scale}px "Inter", sans-serif`;
      ctx.fillText('मुख्याध्यापक', sSigX + sigBoxW / 2, sigY + 8 * scale);

    } else if (isZpKetur2) {
      // Draw Headmaster Signature Block on the right side
      const sigY = 376 * scale;
      const sSigX = width - 92 * scale;
      const sigBoxW = 76 * scale;

      // Draw Headmaster Signature (Right side)
      const hmSigSrc = form.principalSignature === DEFAULT_PRINCIPAL_SIG ? KETUR_HM_SIG : form.principalSignature;
      const pSigImg = new Image();
      pSigImg.src = hmSigSrc;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, sSigX + 6 * scale, sigY - 24 * scale, 64 * scale, 21 * scale);
        ctx.restore();
      }

      ctx.fillStyle = '#1e3a8a';
      ctx.textAlign = 'center';
      
      ctx.font = `950 ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('मुख्याध्यापक', sSigX + sigBoxW / 2, sigY + 4 * scale);

      ctx.font = `bold ${5.0 * scale}px "Inter", sans-serif`;
      ctx.fillText('जि.प.प्राथ.शाळा,केत्तूर-२', sSigX + sigBoxW / 2, sigY + 11 * scale);

      ctx.font = `bold ${5.0 * scale}px "Inter", sans-serif`;
      ctx.fillText('ता.करमाळा,जि.सोलापूर', sSigX + sigBoxW / 2, sigY + 17 * scale);

    } else if (isSiddheshwar) {
      // Draw Headmaster Signature Block on the right side
      const sigY = 412 * scale;
      const sSigX = width - 92 * scale;
      const sigBoxW = 76 * scale;

      // Draw Headmaster Signature (Right side)
      const hmSigSrc = form.principalSignature === DEFAULT_PRINCIPAL_SIG ? SIDD_HM_SIG : form.principalSignature;
      const pSigImg = new Image();
      pSigImg.src = hmSigSrc;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, sSigX + 6 * scale, sigY - 24 * scale, 64 * scale, 21 * scale);
        ctx.restore();
      }

      ctx.fillStyle = '#dc2626';
      ctx.textAlign = 'center';
      
      ctx.font = `950 ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('मुख्याध्यापक', sSigX + sigBoxW / 2, sigY + 4 * scale);

      ctx.fillStyle = '#000000';
      ctx.font = `bold ${5.0 * scale}px "Inter", sans-serif`;
      ctx.fillText('सिद्धेश्वर विद्यालय भांबोरा', sSigX + sigBoxW / 2, sigY + 11 * scale);

      ctx.font = `bold ${5.0 * scale}px "Inter", sans-serif`;
      ctx.fillText('ता.कर्जत,जि.अहमदनगर', sSigX + sigBoxW / 2, sigY + 17 * scale);

      // Draw Student signature on left side
      const studSigX = 16 * scale;
      const studSigImg = new Image();
      studSigImg.src = form.studentSignature === DEFAULT_STUDENT_SIG ? DEFAULT_STUDENT_SIG : form.studentSignature;
      await new Promise(r => { studSigImg.onload = r; studSigImg.onerror = r; });
      if (studSigImg.complete && studSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(studSigImg, studSigX + 6 * scale, sigY - 24 * scale, 58 * scale, 18 * scale);
        ctx.restore();
      }
      ctx.fillStyle = '#1e3a8a';
      ctx.textAlign = 'center';
      ctx.font = `950 ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('विद्यार्थी सही', studSigX + 34 * scale, sigY + 4 * scale);

    } else if (isBharatgas) {
      // Solid navy footer bar
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(4 * scale, height - 28 * scale, width - 8 * scale, 24 * scale);

      // Footer message centered
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `bold ${6 * scale}px "Inter", sans-serif`;
      ctx.fillText('Customer Care No: 1800 2333 555', width / 2, height - 16 * scale);

      // Signature area on top of footer
      const sigY = 412 * scale;
      const sSigX = width - 92 * scale;
      const sigBoxW = 76 * scale;

      const hmSigSrc = form.principalSignature === DEFAULT_PRINCIPAL_SIG ? LAXMI_DISTRIBUTOR_SIG : form.principalSignature;
      const pSigImg = new Image();
      pSigImg.src = hmSigSrc;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, sSigX + 6 * scale, sigY - 24 * scale, 64 * scale, 21 * scale);
        ctx.restore();
      }

      ctx.fillStyle = '#1e3a8a';
      ctx.textAlign = 'center';
      
      ctx.font = `950 ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('Authorized Signatory', sSigX + sigBoxW / 2, sigY + 4 * scale);

      ctx.fillStyle = '#ea580c';
      ctx.font = `bold ${5.0 * scale}px "Inter", sans-serif`;
      ctx.fillText('Laxmi Vaibhav Bharatgas', sSigX + sigBoxW / 2, sigY + 11 * scale);

    } else if (isSamyak) {
      // Draw bottom waves
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.quadraticCurveTo(width / 2, height * 0.82, width, height * 0.86);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Yellow separation bar on top of the red footer wave
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.86);
      ctx.quadraticCurveTo(width / 2, height * 0.82, width, height * 0.86);
      ctx.stroke();

      // Draw bottom deep blue sub-wave
      ctx.fillStyle = '#0a3e8a';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.90);
      ctx.quadraticCurveTo(width * 0.6, height * 0.88, width, height * 0.91);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // District President Signatures
      const sigY = 412 * scale;
      const sSigX = width - 82 * scale;
      const sigBoxW = 68 * scale;

      // Draw Savita Vidhate's President Signature (Right side)
      const presidentSigSrc = form.principalSignature === DEFAULT_PRINCIPAL_SIG ? SAMYAK_PRESIDENT_SIG : form.principalSignature;
      const pSigImg = new Image();
      pSigImg.src = presidentSigSrc;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, sSigX + 5 * scale, sigY - 24 * scale, 58 * scale, 18 * scale);
        ctx.restore();
      }

      // Overlap dotted lines, titles & Signatures
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.font = `bold ${4.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('.................................', sSigX + sigBoxW / 2, sigY + 1 * scale);

      ctx.fillStyle = '#eab308';
      ctx.font = `950 ${6.8 * scale}px "Inter", sans-serif`;
      ctx.fillText('सविता विधाते', sSigX + sigBoxW / 2, sigY + 8 * scale);

      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${5.5 * scale}px "Inter", sans-serif`;
      ctx.fillText('(जिल्हाध्यक्ष)', sSigX + sigBoxW / 2, sigY + 13.5 * scale);

      // Left aligned Floating Barcode Card overlapping footer curves
      const barW = 100 * scale;
      const barH = 22 * scale;
      const barX = 24 * scale;
      const barY = height - 28 * scale;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 2 * scale);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      for (let i = 4 * scale; i < barW - 4 * scale; i += 2.2 * scale) {
        const barThickness = (Math.sin(i * 0.4) > 0.15 ? 1.4 : 0.6) * scale;
        ctx.fillRect(barX + i, barY + 2 * scale, barThickness, 13 * scale);
      }

      ctx.fillStyle = '#171717';
      ctx.textAlign = 'center';
      ctx.font = `bold ${5 * scale}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillText(form.studentId.toUpperCase(), barX + barW / 2, barY + 18.5 * scale);

    } else {
      // Draw standard Signatures Row
      const sigY = height * 0.74;
      const pSigX = 24 * scale;
      const sSigX = width - 99 * scale;
      const sigBoxW = 75 * scale;

      // Signature img Principal
      const pSigImg = new Image();
      pSigImg.src = form.principalSignature;
      await new Promise(r => { pSigImg.onload = r; pSigImg.onerror = r; });
      if (pSigImg.complete && pSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(pSigImg, pSigX + 10 * scale, sigY - 14 * scale, 55 * scale, 15 * scale);
        ctx.restore();
      }

      // Signature img Student
      const sSigImg = new Image();
      sSigImg.src = form.studentSignature;
      await new Promise(r => { sSigImg.onload = r; sSigImg.onerror = r; });
      if (sSigImg.complete && sSigImg.naturalWidth > 0) {
        ctx.save();
        ctx.drawImage(sSigImg, sSigX + 10 * scale, sigY - 14 * scale, 55 * scale, 15 * scale);
        ctx.restore();
      }

      // Rules lines below signatures
      ctx.strokeStyle = cfg.isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(pSigX, sigY + 4 * scale);
      ctx.lineTo(pSigX + sigBoxW, sigY + 4 * scale);
      ctx.moveTo(sSigX, sigY + 4 * scale);
      ctx.lineTo(sSigX + sigBoxW, sigY + 4 * scale);
      ctx.stroke();

      // Signatures Label Columns
      ctx.fillStyle = cfg.primary;
      ctx.textAlign = 'center';
      ctx.font = `800 ${5.5 * scale}px "Inter", sans-serif`;

      const leftSigLabel = "Principal Sign";
      const rightSigLabel = "Student Sign";

      ctx.fillText(leftSigLabel, pSigX + sigBoxW / 2, sigY + 12 * scale);
      ctx.fillText(rightSigLabel, sSigX + sigBoxW / 2, sigY + 12 * scale);


      // Draw footer bottom banner with accent divider line
      const footerStartY = height * 0.83;
      ctx.fillStyle = cfg.accent; // Accent separator bar
      ctx.fillRect(0, footerStartY, width, 3 * scale);

      ctx.fillStyle = cfg.primary; // Primary
      ctx.fillRect(0, footerStartY + 3 * scale, width, height - (footerStartY + 3 * scale));

      // Footer Slogan
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = `bold ${6 * scale}px "Inter", sans-serif`;
      ctx.fillText(cfg.tagline || cfg.slogan, width / 2, footerStartY + 14 * scale);

      // Footer Barcode Block container
      const barW = 180 * scale;
      const barH = 32 * scale;
      const barX = width / 2 - barW / 2;
      const barY = footerStartY + 23 * scale;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX, barY, barW, barH);

      // Draw individual barcode lines inside container
      ctx.fillStyle = '#000000';
      for (let i = 4 * scale; i < barW - 4 * scale; i += 3 * scale) {
        const barThickness = (Math.sin(i * 0.3) > 0.1 ? 2 : 0.8) * scale;
        ctx.fillRect(barX + i, barY + 3 * scale, barThickness, 26 * scale);
      }

      // Centered Code under footer elements
      ctx.fillStyle = cfg.isDark ? '#cbd5e1' : '#e2e8f0';
      ctx.font = `bold ${7.5 * scale}px "JetBrains Mono", "Courier New", monospace`;
      ctx.fillText(form.studentId.toUpperCase(), width / 2, height - 10 * scale);
    }

    return canvas.toDataURL('image/png');
  };

  // High Resolution Canvas compilation logic
  const downloadCardImage = async () => {
    try {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 380));

      const frontUrl = await compileRenderer('front');
      const frontLink = document.createElement('a');
      frontLink.download = `ZenID_${form.studentName.replaceAll(' ', '_') || 'Holder'}_FRONT.png`;
      frontLink.href = frontUrl;
      frontLink.click();

      await new Promise(r => setTimeout(r, 450));

      const backUrl = await compileRenderer('back');
      const backLink = document.createElement('a');
      backLink.download = `ZenID_${form.studentName.replaceAll(' ', '_') || 'Holder'}_BACK.png`;
      backLink.href = backUrl;
      backLink.click();
    } catch (err) {
      console.error("Core export pipeline failed:", err);
      alert("Uh-oh! Unable to parse canvas renders on your browser. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadDemoData = (tplId: string) => {
    switch(tplId) {
      case 'academic':
        setForm({
          schoolName: 'ZENID ACADEMY OF EXCELLENCE',
          schoolLogo: DEFAULT_LOGO_BASE64,
          studentPhoto: DEFAULT_STUDENT_PHOTO,
          studentName: 'ARYA SHARMA',
          studentId: 'STU-2026-4809',
          classCourse: 'Grade 12 (Science)',
          divisionSection: 'Div A',
          dob: '2008-04-18',
          bloodGroup: 'B+',
          academicYear: '2026-2027',
          principalSignature: DEFAULT_PRINCIPAL_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'newenglishmalthan':
        setForm({
          schoolName: 'स्वानंद शिक्षण संस्था, पिंपळा काळोखात',
          schoolLogo: MALTHAN_SCHOOL_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'कुलकर्णी संजय हरिश्चंद्र',
          studentId: '27260408402',
          classCourse: 'मुख्याध्यापक',
          divisionSection: 'प्रशासन',
          dob: '1969-09-12',
          bloodGroup: 'B+ Positive',
          academicYear: '12-08-1993',
          principalSignature: DEFAULT_PRINCIPAL_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'chandrabhama':
        setForm({
          schoolName: 'Chandrabhama Mahavidyalay Karjat',
          schoolLogo: CHANDRABHAMA_SCHOOL_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'Waghmare Sachin Rajaram',
          studentId: 'CMBK/2024/125',
          classCourse: 'Assit Prof.',
          divisionSection: 'Po.Science',
          dob: '1991-01-28',
          bloodGroup: '9403102571',
          academicYear: 'A/P&TAL - Karjat Dist-Ahilyanagar',
          principalSignature: DEFAULT_PRINCIPAL_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'swanandchincholi':
        setForm({
          schoolName: 'SWANAND VIDYALAY CHINCHOLI KALDAT',
          schoolLogo: DEFAULT_LOGO_BASE64,
          studentPhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'Waykar Satyam Shankar',
          studentId: '4869',
          classCourse: 'Student',
          divisionSection: '5728 5424 7098',
          dob: '2011-05-04',
          bloodGroup: '9545333277',
          academicYear: 'Chincholi Kaldat Tal-Karjat',
          principalSignature: '',
          studentSignature: ''
        });
        break;
      case 'samyak':
        setForm({
          schoolName: 'श्रमिक मजदुर संघ (MDM विभाग)',
          schoolLogo: SAMYAK_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'सविता संजय विधाते',
          studentId: 'SM-MDM-9372',
          classCourse: 'जिल्हाध्यक्ष',
          divisionSection: 'कोपरगाव,अहिल्यानगर',
          dob: '1987-03-24',
          bloodGroup: '9370444002',
          academicYear: 'बाबा कॉम्प्लेक्स, कोपरगाव',
          principalSignature: SAMYAK_PRESIDENT_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'zpketur2':
        setForm({
          schoolName: 'Zilla Parishad Primary School Ketur No. 2',
          schoolLogo: ZPKETUR_SOLAPUR_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'ठाेंबरे राजलक्ष्मी गणेश',
          studentId: '1252',
          classCourse: 'दुसरी',
          divisionSection: '27300305002',
          dob: '2017-02-02',
          bloodGroup: '9373608302',
          academicYear: 'ता.करमाळा जि.सोलापूर',
          principalSignature: KETUR_HM_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'siddheshwar':
        setForm({
          schoolName: 'Siddheshwar Secondary School',
          schoolLogo: SIDD_SANSTHA_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'WAGHMARE SACHIN RAJARAM',
          studentId: '421',
          classCourse: '10th STD',
          divisionSection: 'Div A',
          dob: '2009-06-15',
          bloodGroup: '8806543102',
          academicYear: '2026-2027',
          principalSignature: SIDD_HM_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'bharatgas':
        setForm({
          schoolName: 'Laxmi Vaibhav Gas Agency, Karmala',
          schoolLogo: BHARATGAS_SYMBOL_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'WAYKAR SATYAM SHANKAR',
          studentId: 'BG-7521',
          classCourse: 'Delivery Partner',
          divisionSection: '114572',
          dob: '1995-11-20',
          bloodGroup: '9845331205',
          academicYear: 'Karmala Code-114572',
          principalSignature: LAXMI_DISTRIBUTOR_SIG,
          studentSignature: DEFAULT_STUDENT_SIG
        });
        break;
      case 'shramikmajdur':
        setForm({
          schoolName: 'श्रमिक मजदुर संघ',
          schoolLogo: SAMYAK_LOGO,
          studentPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=280&h=350',
          studentName: 'सुरेखा राजेंद्र संकट',
          studentId: 'UNION-MDM-8483',
          classCourse: 'सभासद',
          divisionSection: "",
          dob: '1988-06-15',
          bloodGroup: '8483876891',
          academicYear: 'रा.थैरगाव ता.कर्जत. जि.अहिल्यानगर.',
          principalSignature: SAMYAK_PRESIDENT_SIG,
          studentSignature: DEFAULT_STUDENT_SIG,
          presidentName: 'सौ.सविता महेंद्र विधाते',
          presidentTitle: 'जिल्हा अध्यक्षा अहिल्यानगर'
        });
        break;
      default:
        break;
    }
  };

  const getOrCreateFolder = async (folderName: string, parentId?: string): Promise<string> => {
    let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw new Error(`Search folder failed: ${err}`);
    }
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Create folder failed: ${err}`);
    }
    const createData = await createRes.json();
    return createData.id;
  };

  const saveToGoogleDrive = async () => {
    if (!accessToken) return;
    setIsSubmittingToDrive(true);
    setSubmitStatus({ status: 'preparing', message: 'Generating high-res ID card snapshots...' });

    try {
      await new Promise(resolve => setTimeout(resolve, 380));
      const frontDataUrl = await compileRenderer('front');

      const frontBlob = dataURLtoBlob(frontDataUrl);

      setSubmitStatus({ status: 'creating_root', message: 'Locating Student ID Cards workspace folder...' });
      const rootFolderId = await getOrCreateFolder('Student ID Cards');

      const standardFolderName = (form.classCourse.trim() || 'General').toUpperCase();
      setSubmitStatus({ status: 'creating_student', message: `Setting up storage folder for Standard: ${standardFolderName}...` });
      const standardFolderId = await getOrCreateFolder(standardFolderName, rootFolderId);

      setSubmitStatus({ status: 'uploading', message: `Uploading front ID image for ${form.studentName.toUpperCase()} to ${standardFolderName} folder...` });

      const frontMetadata = {
        name: `${form.studentName.trim().replaceAll(' ', '_')}.png`,
        mimeType: 'image/png',
        parents: [standardFolderId],
      };
      const frontForm = new FormData();
      frontForm.append('metadata', new Blob([JSON.stringify(frontMetadata)], { type: 'application/json' }));
      frontForm.append('file', frontBlob);

      const frontUpload = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: frontForm,
      });

      if (!frontUpload.ok) {
        throw new Error('Front ID image upload failed.');
      }

      const folderUrl = `https://drive.google.com/drive/u/0/folders/${standardFolderId}`;
      setSubmitStatus({
        status: 'success',
        message: `${form.studentName.toUpperCase()}'s ID card submitted successfully to "${standardFolderName}" folder in Google Drive!`,
        folderUrl,
      });
    } catch (err: any) {
      console.error(err);
      setSubmitStatus({
        status: 'error',
        message: err.message || 'Drive sync failed. Please check connection and try again.',
      });
    } finally {
      setIsSubmittingToDrive(false);
    }
  };

  return (
    <div id="hero-id-form-container" className="w-full flex flex-col gap-6 select-none bg-slate-50 dark:bg-[#07070d]/60 p-5 md:p-6.5 rounded-[2.5rem] border border-slate-100 dark:border-zinc-800/80 shadow-2xl relative">
      
      {/* Decorative Technical Status Indicator Header */}
      <div className="flex items-center justify-between border-b border-slate-150 dark:border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <ShieldCheck size={14} className="stroke-[2.5]" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-gray-100 flex items-center gap-1">
              ZenID Instant Studio
              <Sparkles size={10} className="text-amber-500 animate-pulse" />
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block leading-none">
              Compliant CR80 Format
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-mono text-emerald-500 font-extrabold uppercase tracking-widest">
            Ready to Compile
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* Form collection sidebar */}
        <div className="md:col-span-7 flex flex-col gap-4 text-left">
          
          {/* Section Category Switches */}
          <div className="flex hover:bg-slate-100 dark:hover:bg-zinc-850 bg-slate-100/60 dark:bg-zinc-900/60 p-1 rounded-xl gap-0.5">
            {[
              { id: 'profile', label: 'Photo & Name', icon: User },
              { id: 'school', label: 'School Info', icon: School },
              { id: 'academic', label: 'Academic Details', icon: Calendar },
              { id: 'signatures', label: 'Signatures', icon: Activity }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[8.5px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-400 dark:text-zinc-500 hover:text-slate-655 dark:hover:text-zinc-350'
                  }`}
                >
                  <Icon size={10} className={isSelected ? 'text-primary' : ''} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Dynamic Inputs View list */}
          <div className="bg-white dark:bg-zinc-950/80 p-4 border border-slate-100 dark:border-zinc-800/40 rounded-2xl min-h-[190px] flex flex-col justify-center">
            
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Photo Drag & Drop input */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                    <div className="sm:col-span-5 relative group flex flex-col items-center">
                      <div className="w-20 h-24 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#07070a] overflow-hidden flex flex-col items-center justify-center relative shadow-inner group-hover:border-primary/50 transition-colors">
                        {form.studentPhoto ? (
                          <img src={form.studentPhoto} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-slate-300" />
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload size={14} className="text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, 'studentPhoto')} 
                          />
                        </label>
                      </div>
                      <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest mt-1">Photo Upload *</span>
                    </div>

                    <div className="sm:col-span-7 space-y-3">
                      {/* Name of the student */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                          {(selectedTemplate === 'samyak' || selectedTemplate === 'shramikmajdur') ? 'Member / Worker Full Name *' : 'Student Full Name *'}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            maxLength={22}
                            value={form.studentName}
                            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                            placeholder={(selectedTemplate === 'samyak' || selectedTemplate === 'shramikmajdur') ? "e.g. सुरेखा संकट" : "e.g. ARYA SHARMA"}
                            className="w-full pl-3 pr-9 py-2 text-[10px] tracking-widest font-bold uppercase bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => listeningField === 'studentName' ? stopListening() : startListening('studentName', (text) => setForm({ ...form, studentName: text.toUpperCase().substring(0, 22) }))}
                            className="absolute right-3.5 text-slate-400 hover:text-primary dark:hover:text-emerald-400 p-0.5 rounded-lg transition-colors cursor-pointer"
                            title="Dictate student name via Voice Command"
                          >
                            {listeningField === 'studentName' ? (
                              <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* ID / Roll number / Registration No. */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          {selectedTemplate === 'swanandchincholi' ? 'Registration / Reg No.' : (selectedTemplate === 'samyak' || selectedTemplate === 'shramikmajdur') ? 'ID / Member No.' : 'Student ID / Roll No.'} <span className="text-[7px] text-orange-400 lowercase">(optional)</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            maxLength={16}
                            value={form.studentId}
                            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                            placeholder={selectedTemplate === 'swanandchincholi' ? "e.g. 4869" : (selectedTemplate === 'samyak' || selectedTemplate === 'shramikmajdur') ? "e.g. UNION-MDM-8483" : "e.g. STU-2026-089"}
                            className="w-full pl-3 pr-9 py-2 text-[10px] tracking-widest font-bold uppercase bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => listeningField === 'studentId' ? stopListening() : startListening('studentId', (text) => setForm({ ...form, studentId: text.toUpperCase().replace(/\s+/g, '-').substring(0, 16) }))}
                            className="absolute right-3.5 text-slate-400 hover:text-primary dark:hover:text-emerald-400 p-0.5 rounded-lg transition-colors cursor-pointer"
                            title={selectedTemplate === 'swanandchincholi' ? "Dictate Registration Number" : (selectedTemplate === 'samyak' || selectedTemplate === 'shramikmajdur') ? "Dictate ID / Member No." : "Dictate Student ID / Roll No."}
                          >
                            {listeningField === 'studentId' ? (
                              <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'school' && (
                <motion.div
                  key="school"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3.5"
                >
                  {/* Logo Drag & Drop */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                    <div className="sm:col-span-4 relative flex flex-col items-center">
                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-[#07070a] overflow-hidden flex flex-col items-center justify-center relative shadow-inner group hover:border-primary/50 transition-all">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo} alt="School Crest Logo" className="w-10 h-10 object-contain" />
                        ) : (
                          <School size={18} className="text-slate-300" />
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <Upload size={12} className="text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handlePhotoUpload(e, 'schoolLogo')} 
                          />
                        </label>
                      </div>
                      <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-widest mt-1">School Logo *</span>
                    </div>

                    <div className="sm:col-span-8 space-y-3">
                      {/* Name of school */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">
                          College / School Name *
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            maxLength={32}
                            value={form.schoolName}
                            onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                            placeholder="e.g. DELHI PUBLIC SCHOOL"
                            className="w-full pl-3 pr-9 py-2 text-[10px] tracking-widest font-extrabold uppercase bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => listeningField === 'schoolName' ? stopListening() : startListening('schoolName', (text) => setForm({ ...form, schoolName: text.toUpperCase().substring(0, 32) }))}
                            className="absolute right-3.5 text-slate-400 hover:text-amber-500 p-0.5 rounded-lg transition-colors cursor-pointer"
                            title="Dictate school / college name"
                          >
                            {listeningField === 'schoolName' ? (
                              <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Academic Year / Address */}
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                          {['swanandchincholi', 'shramikmajdur'].includes(selectedTemplate) ? 'Address' : 'Academic Year'} <span className="text-[7px] text-orange-400 lowercase">(optional)</span>
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            maxLength={['swanandchincholi', 'shramikmajdur'].includes(selectedTemplate) ? 50 : 12}
                            value={form.academicYear}
                            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                            placeholder={['swanandchincholi', 'shramikmajdur'].includes(selectedTemplate) ? "e.g. Chincholi Kaldat Tal-Karjat" : "e.g. 2026-2027"}
                            className="w-full pl-3 pr-9 py-2 text-[10px] tracking-widest font-bold bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => listeningField === 'academicYear' ? stopListening() : startListening('academicYear', (text) => setForm({ ...form, academicYear: ['swanandchincholi', 'shramikmajdur'].includes(selectedTemplate) ? text.substring(0, 50) : text.toUpperCase().replace(/\s+/g, '-').substring(0, 12) }))}
                            className="absolute right-3.5 text-slate-400 hover:text-amber-500 p-0.5 rounded-lg transition-colors cursor-pointer"
                            title={['swanandchincholi', 'shramikmajdur'].includes(selectedTemplate) ? "Dictate Address" : "Dictate Academic Year"}
                          >
                            {listeningField === 'academicYear' ? (
                              <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'academic' && (
                <motion.div
                  key="academic"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {/* Class / course */}
                  <div className="space-y-1 flex flex-col">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      Class / Course <span className="text-[7px] text-orange-400 lowercase">(optional)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={18}
                        value={form.classCourse}
                        onChange={(e) => setForm({ ...form, classCourse: e.target.value })}
                        placeholder="e.g. B.Tech CSE"
                        className="w-full pl-3 pr-9 py-2 text-[10px] tracking-widest font-bold uppercase bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => listeningField === 'classCourse' ? stopListening() : startListening('classCourse', (text) => setForm({ ...form, classCourse: text.toUpperCase().substring(0, 18) }))}
                        className="absolute right-3.5 text-slate-400 hover:text-primary dark:hover:text-emerald-400 p-0.5 rounded-lg transition-colors cursor-pointer"
                        title="Dictate Class / Course"
                      >
                        {listeningField === 'classCourse' ? (
                          <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                        ) : (
                          <Mic className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Section division / Aadhar Card No. */}
                  <div className="space-y-1 flex flex-col">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      {selectedTemplate === 'swanandchincholi' ? 'Aadhar Card No.' : 'Division / Section'} <span className="text-[7px] text-orange-400 lowercase">(optional)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={selectedTemplate === 'swanandchincholi' ? 20 : 10}
                        value={form.divisionSection}
                        onChange={(e) => setForm({ ...form, divisionSection: e.target.value })}
                        placeholder={selectedTemplate === 'swanandchincholi' ? "e.g. 5728 5424 7098" : "e.g. Section B"}
                        className="w-full pl-3 pr-9 py-2 text-[10px] tracking-widest font-bold uppercase bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => listeningField === 'divisionSection' ? stopListening() : startListening('divisionSection', (text) => setForm({ ...form, divisionSection: text.toUpperCase().substring(0, selectedTemplate === 'swanandchincholi' ? 20 : 10) }))}
                        className="absolute right-3.5 text-slate-400 hover:text-primary dark:hover:text-emerald-400 p-0.5 rounded-lg transition-colors cursor-pointer"
                        title={selectedTemplate === 'swanandchincholi' ? "Dictate Aadhar Card No." : "Dictate Division / Section"}
                      >
                        {listeningField === 'divisionSection' ? (
                          <Mic className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                        ) : (
                          <Mic className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Date of birth */}
                  <div className="space-y-1 flex flex-col">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      Date of Birth <span className="text-[7px] text-orange-400 lowercase">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      className="w-full px-3 py-2 text-[10px] font-bold bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                    />
                  </div>

                  {/* Blood Group / Mobile Number */}
                  <div className="space-y-1 flex flex-col">
                    <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                      {['swanandchincholi', 'shramikmajdur', 'samyak', 'chandrabhama'].includes(selectedTemplate) ? 'Mobile Number' : 'Blood Group'} <span className="text-[7px] text-orange-400 lowercase">(optional)</span>
                    </label>
                    {['swanandchincholi', 'shramikmajdur', 'samyak', 'chandrabhama', 'siddheshwar', 'bharatgas'].includes(selectedTemplate) ? (
                      <input
                        type="text"
                        maxLength={15}
                        value={form.bloodGroup}
                        onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                        placeholder="e.g. 8483876891"
                        className="w-full px-3 py-2 text-[10px] font-bold bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
                      />
                    ) : (
                      <select
                        value={form.bloodGroup}
                        onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                        className="w-full px-3 py-[7px] text-[10px] font-black uppercase bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none"
                      >
                        <option value="">N/A</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'signatures' && (
                <motion.div
                  key="signatures"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`grid grid-cols-1 ${selectedTemplate === 'swanandchincholi' ? '' : 'sm:grid-cols-2'} gap-4`}
                >
                  {/* Student Signature */}
                  {selectedTemplate !== 'swanandchincholi' && (
                    <div className="border border-dashed border-slate-200 dark:border-zinc-850 p-4 rounded-2xl bg-slate-50 dark:bg-[#07070a]/60 flex flex-col items-center justify-between min-h-[140px] text-center">
                      <div className="w-full">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 block mb-1">
                          Student Signature
                        </span>
                        <p className="text-[7.5px] font-medium text-slate-400 dark:text-zinc-500 mb-2">
                          Upload transparent signature (PNG, JPG)
                        </p>
                      </div>

                      <div className="h-14 w-full flex items-center justify-center bg-white dark:bg-zinc-900/40 rounded-xl border border-slate-100 dark:border-zinc-800 p-2 mb-3">
                        {form.studentSignature ? (
                          <img 
                            src={form.studentSignature} 
                            alt="Student Signature Preview" 
                            className="h-full max-w-full object-contain filter dark:invert dark:brightness-150" 
                          />
                        ) : (
                          <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">No signature uploaded</span>
                        )}
                      </div>

                      <div className="flex gap-1.5 w-full justify-center">
                        <label className="cursor-pointer flex-1 py-1.5 px-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1 shadow-sm shadow-primary/10">
                          <Upload size={10} />
                          <span>Upload File</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            id="student-sig-upload-input"
                            onChange={(e) => handlePhotoUpload(e, 'studentSignature')} 
                          />
                        </label>

                        {form.studentSignature && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, studentSignature: '' })}
                            className="py-1.5 px-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                            title="Remove signature"
                          >
                            Clear
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setForm({ ...form, studentSignature: DEFAULT_STUDENT_SIG })}
                          className="py-1.5 px-2 bg-slate-200 dark:bg-zinc-850 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-350 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center"
                          title="Load premium mock signature template"
                        >
                          Default Template
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Principal Signature */}
                  <div className={`border border-dashed border-slate-200 dark:border-zinc-850 p-4 rounded-2xl bg-slate-50 dark:bg-[#07070a]/60 flex flex-col items-center justify-between min-h-[140px] text-center ${selectedTemplate === 'swanandchincholi' ? 'w-full' : ''}`}>
                    <div className="w-full">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 block mb-1">
                        Principal Signature
                      </span>
                      <p className="text-[7.5px] font-medium text-slate-400 dark:text-zinc-500 mb-2">
                        Authorized principal approval sign
                      </p>
                    </div>

                    <div className="h-14 w-full flex items-center justify-center bg-white dark:bg-zinc-900/40 rounded-xl border border-slate-100 dark:border-zinc-800 p-2 mb-3">
                      {form.principalSignature ? (
                        <img 
                          src={form.principalSignature} 
                          alt="Principal Signature Preview" 
                          className="h-full max-w-full object-contain filter dark:invert dark:brightness-150" 
                        />
                      ) : (
                        <span className="text-[8px] font-bold text-red-500 uppercase tracking-wider">No signature uploaded</span>
                      )}
                    </div>

                    <div className="flex gap-1.5 w-full justify-center">
                      <label className="cursor-pointer flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1 shadow-sm shadow-amber-500/10">
                        <Upload size={10} />
                        <span>Upload File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          id="principal-sig-upload-input"
                          onChange={(e) => handlePhotoUpload(e, 'principalSignature')} 
                        />
                      </label>

                      {form.principalSignature && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, principalSignature: '' })}
                          className="py-1.5 px-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1"
                          title="Remove signature"
                        >
                          Clear
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, principalSignature: DEFAULT_PRINCIPAL_SIG })}
                        className="py-1.5 px-2 bg-slate-200 dark:bg-zinc-850 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-350 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center"
                        title="Load premium mock signature template"
                      >
                        Default Template
                      </button>
                    </div>
                  </div>

                  {selectedTemplate === 'shramikmajdur' && (
                    <div className="col-span-1 sm:col-span-2 border border-dashed border-slate-200 dark:border-zinc-850 p-4 rounded-2xl bg-slate-50 dark:bg-[#07070a]/60 space-y-4">
                      <div className="text-left animate-fade-in">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#2323FF] dark:text-blue-400 block mb-1">
                          अध्यक्ष माहिती (President / Authority Details)
                        </span>
                        <p className="text-[7.5px] font-medium text-slate-400 dark:text-zinc-500">
                          Configure the name and designation printed at the bottom right corner of the front side.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">जिल्हाध्यक्ष नाव (President Name)</label>
                          <input
                            type="text"
                            value={form.presidentName || ''}
                            onChange={(e) => setForm({ ...form, presidentName: e.target.value })}
                            placeholder="e.g. सौ.सविता महेंद्र विधाते"
                            className="w-full px-3 py-2 text-[10px] font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#2323FF]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider">पद / जिल्हा (Designation & Location)</label>
                          <input
                            type="text"
                            value={form.presidentTitle || ''}
                            onChange={(e) => setForm({ ...form, presidentTitle: e.target.value })}
                            placeholder="e.g. जिल्हा अध्यक्षा अहिल्यानगर"
                            className="w-full px-3 py-2 text-[10px] font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white outline-none focus:border-[#2323FF]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>          {/* Quick Actions - Submit Card */}
          <div className="flex flex-col gap-3 mt-1.5 pt-3 border-t border-slate-150 dark:border-zinc-800/60">
            <div className="flex flex-col gap-2.5 p-3 bg-slate-50 dark:bg-zinc-900/40 rounded-2xl border border-slate-200/50 dark:border-zinc-800/50">

              {submitStatus.status !== 'success' && submitStatus.status !== 'error' ? (
                <div className="flex flex-col gap-1.5">
                  {submitStatus.status !== 'idle' && (
                    <div className="p-2.5 bg-blue-500/5 dark:bg-primary/5 rounded-xl border border-blue-500/10 dark:border-primary/10 flex items-center gap-3 animate-pulse">
                      <Loader2 className="text-blue-500 dark:text-primary animate-spin shrink-0" size={14} />
                      <span className="text-[9.5px] font-bold text-slate-600 dark:text-zinc-350 tracking-wider">
                        {submitStatus.message}
                      </span>
                    </div>
                  )}

                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={saveToGoogleDrive}
                      disabled={isSubmittingToDrive || !form.studentName.trim()}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-3 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-850 dark:hover:bg-zinc-200 disabled:bg-slate-300 text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all transform active:scale-95 shadow-md cursor-pointer"
                      title="Transmit high-resolution layout and export directly to cloud directory"
                    >
                      <Cloud size={11} className={isSubmittingToDrive ? 'animate-bounce' : ''} />
                      <span>{isSubmittingToDrive ? 'Submitting ID Card...' : 'Submit ID Card'}</span>
                    </button>
                  </div>
                </div>
              ) : submitStatus.status === 'success' ? (
                <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-emerald-500 text-white rounded-full">
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider leading-none">
                      Card Transmitted
                    </span>
                  </div>
                  
                  <p className="text-[9.5px] text-slate-600 dark:text-zinc-350 font-medium font-semibold">
                    {submitStatus.message}
                  </p>

                  <div className="flex gap-2 mt-1 pt-1 border-t border-emerald-500/10">
                    {submitStatus.folderUrl && (
                      <a
                        href={submitStatus.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 transition-all text-white text-[8.5px] font-black uppercase tracking-wider rounded-lg shadow-sm"
                      >
                        <Folder size={11} />
                        <span>Open Drive Folder</span>
                        <ExternalLink size={9} />
                      </a>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setSubmitStatus({ status: 'idle' })}
                      className="px-3 py-2 bg-slate-250 dark:bg-zinc-800 hover:bg-slate-305 dark:hover:bg-zinc-700 text-slate-705 dark:text-zinc-350 text-[8.5px] font-black uppercase tracking-wider rounded-lg"
                    >
                      Submit New
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-500/20 dark:border-rose-500/30 flex flex-col gap-2">
                  <span className="text-[9.5px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest">
                    Transmission Interrupted
                  </span>
                  <p className="text-[9.5px] font-medium text-slate-600 dark:text-zinc-300">
                    {submitStatus.message}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={saveToGoogleDrive}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all transform active:scale-95"
                    >
                      Retry Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubmitStatus({ status: 'idle' })}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-305 dark:hover:bg-zinc-700 text-slate-705 dark:text-zinc-350 text-[8.5px] font-black uppercase tracking-wider rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Interactive visual ID mockup preview column */}
        <div className="md:col-span-12 lg:col-span-5 flex flex-col items-center justify-center gap-3">
          
          {(() => {
            const previewCfg: Record<string, any> = {
              academic: {
                primary: '#0a2e5c',
                accent: '#dfa115',
                cardBg: 'bg-white',
                dotStyle: { backgroundImage: 'radial-gradient(#e2e8f0 0.75px, transparent 0.75px)', backgroundSize: '6px 6px' },
                textMain: 'text-slate-900',
                textMuted: 'text-slate-500',
                labelColor: 'text-[#0a2e5c]/85',
                isDark: false,
                subTitle: 'COLLEGE OF ARTS, SCIENCE & COMMERCE',
                slogan: '🏛 excellence in education',
                tagline: 'Knowledge Today, Success Tomorrow',
                headerBg: 'bg-[#0a2e5c]',
                headerAccent: 'bg-amber-500',
                badgeBg: 'bg-[#0a2e5c]',
                borderColor: 'border-[#0a2e5c]',
                watermarkOpacity: 'opacity-[0.05]',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white'
              },
              newenglishmalthan: {
                primary: '#dc2626',
                accent: '#1e3a8a',
                cardBg: 'bg-white',
                dotStyle: { backgroundImage: 'radial-gradient(rgba(220,38,38,0.03) 0.75px, transparent 0.75px)', backgroundSize: '6px 6px' },
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-[#1e3a8a] font-black',
                isDark: false,
                subTitle: 'न्यू इंग्लिश स्कूल मलठण.',
                slogan: 'स्वानंद शिक्षण संस्था, पिंपळा काळोखात',
                tagline: 'ता. कर्जत जि. अहिल्यानगर',
                headerBg: 'bg-[#1e3a8a]',
                headerAccent: 'bg-[#eab308]',
                badgeBg: 'bg-[#1e3a8a]',
                borderColor: 'border-[#dc2626]',
                watermarkOpacity: 'opacity-[0.03]',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomnewenglishmalthan: true
              },
              chandrabhama: {
                primary: '#0f2963',
                accent: '#eab308',
                cardBg: 'bg-white',
                dotStyle: { backgroundImage: 'radial-gradient(rgba(15,41,99,0.03) 0.75px, transparent 0.75px)', backgroundSize: '6px 6px' },
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-[#0f2963] font-black',
                isDark: false,
                subTitle: 'ARTS, SCIENCE & COMMERCE COLLEGE',
                slogan: 'CHANDRABHAMA MAHAVIDYALAY',
                tagline: 'Karjat, Dist-Ahilyanagar',
                headerBg: 'bg-[#0f2963]',
                headerAccent: 'bg-[#eab308]',
                badgeBg: 'bg-[#0f2963]',
                borderColor: 'border-[#0f2963]',
                watermarkOpacity: 'opacity-[0.03]',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomchandrabhama: true
              },
              swanandchincholi: {
                primary: '#1e3a8a',
                accent: '#eab308',
                cardBg: 'bg-white',
                dotStyle: { backgroundImage: 'radial-gradient(rgba(30,58,138,0.03) 0.75px, transparent 0.75px)', backgroundSize: '6px 6px' },
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-[#1e3a8a] font-black',
                isDark: false,
                subTitle: 'SWANAND VIDYALAY CHINCHOLI KALDAT',
                slogan: 'SWANAND SHIKSHAN SANASTHA CHINCHOLI KALDAT',
                tagline: 'TAL-KARJAT DIST-AHILYANAGAR',
                headerBg: 'bg-[#1e3a8a]',
                headerAccent: 'bg-[#eab308]',
                badgeBg: 'bg-[#1e3a8a]',
                borderColor: 'border-[#1e3a8a]',
                watermarkOpacity: 'opacity-[0.03]',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomswanandchincholi: true
              },
              samyak: {
                primary: '#0a3e8a',
                accent: '#eab308',
                cardBg: 'bg-white',
                dotStyle: { backgroundImage: 'radial-gradient(rgba(10,62,138,0.03) 0.75px, transparent 0.75px)', backgroundSize: '6px 6px' },
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-[#0a3e8a] font-black',
                isDark: false,
                subTitle: 'श्रमिक मजदुर संघ (MDM विभाग)',
                slogan: 'सम्यक फाउंडेशन प्रणित',
                tagline: 'ऑफिस - बाबा कॉम्प्लेक्स ,कोपरगाव,जि.अहिल्यानगर.मो.-9370444002',
                headerBg: 'bg-[#0a3e8a]',
                headerAccent: 'bg-[#eab308]',
                badgeBg: 'bg-[#0a3e8a]',
                borderColor: 'border-[#0a3e8a]',
                watermarkOpacity: 'opacity-[0.03]',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomSamyak: true
              },
              zpketur2: {
                primary: '#dc2626',
                accent: '#000000',
                cardBg: 'bg-white',
                dotStyle: {},
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-black font-black',
                isDark: false,
                subTitle: 'केतुर नं. २',
                slogan: 'जिल्हा परिषद प्राथमिक शाळा',
                tagline: 'UDISE NO - 27300305002',
                headerBg: 'bg-white',
                headerAccent: 'bg-rose-650',
                badgeBg: 'bg-rose-650',
                borderColor: 'border-rose-650',
                watermarkOpacity: 'opacity-0',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomZpKetur2: true
              },
              siddheshwar: {
                primary: '#dc2626',
                accent: '#000000',
                cardBg: 'bg-white',
                dotStyle: {},
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-black font-black',
                isDark: false,
                subTitle: 'भांबोरा ता.कर्जत जि.अहमदनगर',
                slogan: 'यशवंत शिक्षण संस्था कर्जत',
                tagline: 'स्थापना - १९६७',
                headerBg: 'bg-white',
                headerAccent: 'bg-rose-650',
                badgeBg: 'bg-rose-650',
                borderColor: 'border-rose-650',
                watermarkOpacity: 'opacity-0',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomSiddheshwar: true
              },
              bharatgas: {
                primary: '#ea580c',
                accent: '#1e3a8a',
                cardBg: 'bg-white',
                dotStyle: {},
                textMain: 'text-neutral-900',
                textMuted: 'text-neutral-400',
                labelColor: 'text-[#1e3a8a] font-black',
                isDark: false,
                subTitle: 'LAXMI VAIBHAV GAS AGENCY',
                slogan: 'Bharatgas',
                tagline: 'Jamkhed Rod Karmala',
                headerBg: 'bg-[#ea580c]',
                headerAccent: 'bg-[#1e3a8a]',
                badgeBg: 'bg-[#1e3a8a]',
                borderColor: 'border-[#ea580c]',
                watermarkOpacity: 'opacity-0',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-white',
                isCustomBharatgas: true
              },
              shramikmajdur: {
                primary: '#2323FF',
                accent: '#eab308',
                cardBg: 'bg-[#F9F9F9]',
                dotStyle: {},
                textMain: 'text-neutral-950',
                textMuted: 'text-neutral-500',
                labelColor: 'text-[#2323FF] font-black',
                isDark: false,
                subTitle: 'श्रमिक मजदुर संघ',
                slogan: '(MDM विभाग)',
                tagline: '',
                headerBg: 'bg-[#2323FF]',
                headerAccent: 'bg-[#eab308]',
                badgeBg: 'bg-[#2323FF]',
                borderColor: 'border-[#2323FF]',
                watermarkOpacity: 'opacity-0',
                barcodeBg: 'bg-white',
                textColorAlt: 'text-[#FFCE1B]',
                isCustomShramikMajdur: true
              }
            }[selectedTemplate];

            const isChandra = selectedTemplate === 'chandrabhama';
            const isSwanand = selectedTemplate === 'swanandchincholi';
            const isSamyak = selectedTemplate === 'samyak';

            const fieldsToShow = (() => {
              if (selectedTemplate === 'shramikmajdur') {
                return [
                  { label: 'नाव', value: form.studentName || 'सुरेखा राजेंद्र संकट', emoji: '👤' },
                  { label: 'पत्ता', value: form.academicYear || 'रा.थैरगाव ता.कर्जत. जि.अहिल्यानगर.', emoji: '📍' },
                  { label: 'मोबा', value: form.bloodGroup || '8483876891', emoji: '📞' }
                ];
              } else if (selectedTemplate === 'newenglishmalthan') {
                return [
                  { label: 'जन्म दि', value: form.dob ? formatDateStr(form.dob) : '12-09-1969', emoji: '📅', colon: ':-' },
                  { label: 'रक्त गट', value: form.bloodGroup || 'B+ Positive', emoji: '🩸', colon: ':-', isBlood: true },
                  { label: 'नेमणूक', value: form.academicYear || '12-08-1993', emoji: '💼', colon: ':-' },
                  { label: 'आयडी क्र', value: form.studentId || '27260408402', emoji: '💳', colon: ':-' },
                  { label: 'पत्ता', value: 'ता. कर्जत जि. अहिल्यानगर', emoji: '📍', colon: ':-' }
                ];
              } else if (isChandra) {
                return [
                  { label: 'Post', value: form.classCourse || 'Assit Prof.', emoji: '💼', colon: ':-' },
                  { label: 'Depa', value: form.divisionSection || 'Po.Science', emoji: '🏛', colon: ':-' },
                  { label: 'DOB', value: form.dob ? formatDateStr(form.dob) : '28-01-1991', emoji: '📅', colon: ':-' },
                  { label: 'Moba', value: form.bloodGroup || '9403102571', emoji: '📞', colon: ':-' },
                  { label: 'Address', value: form.academicYear || 'AP-Karjat', emoji: '📍', colon: ':-' },
                  { label: 'ID No', value: form.studentId || 'CMBK/2024/125', emoji: '💳', colon: ':-' }
                ];
              } else if (isSwanand) {
                return [
                  { label: 'Reg No', value: form.studentId || '4869', emoji: '💳', colon: ':-' },
                  { label: 'DOB', value: form.dob ? formatDateStr(form.dob) : '04/05/2011', emoji: '📅', colon: ':-' },
                  { label: 'Mobile', value: form.bloodGroup || '9545333277', emoji: '📞', colon: ':-' },
                  { label: 'Aadhar', value: form.divisionSection || '5728 5424 7098', emoji: '🆔', colon: ':-' },
                  { label: 'Address', value: form.academicYear || 'Chincholi Kaldat Tal-Karjat', emoji: '📍', colon: ':-' }
                ];
              } else if (isSamyak) {
                return [
                  { label: 'नाव', value: form.studentName || 'श्रीमती सविता विधाते', emoji: '👤', colon: ':-' },
                  { label: 'आयडी क्र', value: form.studentId || 'SM-MDM-9372', emoji: '💳', colon: ':-' },
                  { label: 'पद', value: form.classCourse || 'तालुका अध्यक्ष', emoji: '💼', colon: ':-' },
                  { label: 'गाव/पत्ता', value: form.divisionSection || 'कोपरगाव, अहिल्यानगर', emoji: '📍', colon: ':-' },
                  { label: 'मोबाईल', value: form.bloodGroup || '9370444002', emoji: '📞', colon: ':-' }
                ];
              } else if (selectedTemplate === 'siddheshwar') {
                return [
                  { label: 'नाव', value: form.studentName || 'WAGHMARE SACHIN RAJARAM', emoji: '👤', colon: ':-' },
                  { label: 'इयत्ता', value: form.classCourse || '10th STD', emoji: '🎓', colon: ':-' },
                  { label: 'रजि.नं.', value: form.studentId || '421', emoji: '💳', colon: ':-' },
                  { label: 'जन्म दि.', value: form.dob ? form.dob.split('-').reverse().join('-') : '15-06-2009', emoji: '📅', colon: ':-' },
                  { label: 'मोबाईल', value: form.bloodGroup || '8806543102', emoji: '📞', colon: ':-' }
                ];
              } else if (selectedTemplate === 'bharatgas') {
                return [
                  { label: 'Name', value: form.studentName || 'WAYKAR SATYAM SHANKAR', emoji: '👤', colon: ':-' },
                  { label: 'Post', value: form.classCourse || 'Delivery Partner', emoji: '💼', colon: ':-' },
                  { label: 'ID No.', value: form.studentId || 'BG-7521', emoji: '💳', colon: ':-' },
                  { label: 'DOB', value: form.dob ? form.dob.split('-').reverse().join('-') : '20-11-1995', emoji: '📅', colon: ':-' },
                  { label: 'Contact', value: form.bloodGroup || '9845331205', emoji: '📞', colon: ':-' }
                ];
              } else {
                return [
                  { label: 'Name', value: form.studentName, emoji: '👤' },
                  { label: 'Roll No', value: form.studentId, emoji: '💳' },
                  { label: 'Course', value: form.classCourse, emoji: '🎓' },
                  { label: 'Section', value: form.divisionSection || 'N/A', emoji: '👥' },
                  { label: 'B\'day', value: form.dob ? formatDateStr(form.dob) : 'N/A', emoji: '📅' },
                  { label: 'Blood', value: form.bloodGroup || 'N/A', emoji: '🩸', isBlood: true },
                  { label: 'Session', value: form.academicYear || '2025-2026', emoji: '📖' }
                ];
              }
            })();

            const ptOffset = selectedTemplate === 'siddheshwar' ? 'pt-[168px]' : selectedTemplate === 'bharatgas' ? 'pt-[154px]' : selectedTemplate === 'zpketur2' ? 'pt-[158px]' : (isChandra || isSwanand || isSamyak) ? 'pt-[172px]' : selectedTemplate === 'newenglishmalthan' ? 'pt-[164px]' : 'pt-[70px]';

            if (selectedTemplate === 'shramikmajdur') {
              if (activeSide === 'front') {
                return (
                  <motion.div
                    className="w-[340px] xs:w-[377px] h-[240px] bg-[#F9F9F9] text-neutral-800 rounded-[1rem] border-2 border-[#2323FF] shadow-xl overflow-hidden relative flex flex-col justify-between"
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Header with centered sumyak brand on top, and logo + title row below */}
                    <div className="bg-[#2323FF] text-white pt-1 pb-1.5 px-3.5 border-b-2 border-[#eab308] select-none text-left relative flex flex-col gap-0.5">
                      <div className="text-center w-full">
                        <span className="text-[9.5px] font-black text-white uppercase tracking-wider leading-none">सम्यक फाऊंडेशन प्रणित</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8.5 h-8.5 rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden border border-amber-400 shrink-0">
                          <img src={form.schoolLogo || SAMYAK_LOGO} alt="logo" className="w-full h-full object-contain rounded-full" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0">
                          <span className="text-[13px] font-black leading-tight text-[#FFCE1B] truncate">श्रमिक मजदुर संघ (MDM विभाग)</span>
                          <span className="text-[7.2px] font-extrabold text-white leading-tight mt-0 whitespace-normal break-words max-w-[270px]">ऑफिस - बाबा कॉम्लेक्स, कोपरगाव, जि. अहिल्यानगर. मो.-9370444002</span>
                        </div>
                      </div>
                    </div>

                    {/* Under-header grey info bar with centered identity badge */}
                    <div className="bg-neutral-100/85 px-3 py-0.5 flex items-center justify-center border-b border-neutral-200/50">
                      <span className="text-[8px] font-black text-[#2323FF] uppercase tracking-wider">ओळखपत्र (IDENTITY CARD)</span>
                    </div>

                    {/* Left & Right layout content */}
                    <div className="flex-1 p-1.5 px-3.5 flex items-center gap-4 text-left">
                      {/* Left: centered photo */}
                      <div className="w-[58px] h-[74px] shrink-0 border-2 border-[#2323FF] rounded-md overflow-hidden bg-slate-100 flex items-center justify-center relative shadow-sm">
                        {form.studentPhoto ? (
                          <img src={form.studentPhoto} alt="worker" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl">👤</span>
                        )}
                      </div>

                      {/* Right Details Stack with red labels and adjusted styles */}
                      <div className="flex-1 flex flex-col justify-center gap-1 text-[11px]">
                        {/* Name (नाव) */}
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="font-extrabold text-[#dc2626] text-[9.5px] w-10 shrink-0">नाव :</span>
                          <div className="bg-blue-50/60 border border-blue-100/50 rounded px-2 py-0.5 font-bold text-neutral-900 truncate flex-1 text-[9.5px]">
                            {form.studentName || 'सुरेखा राजेंद्र संकट'}
                          </div>
                        </div>

                        {/* Address (पत्ता) */}
                        <div className="flex items-start gap-1.5 select-none">
                          <span className="font-extrabold text-[#dc2626] text-[9.5px] w-10 shrink-0">पत्ता :</span>
                          <span className="font-bold text-neutral-700 leading-tight block pr-2 text-[9.5px] flex-1 line-clamp-2 overflow-hidden max-h-[30px]" title={form.academicYear || 'रा.थैरगाव ता.कर्जत. जि.अहिल्यानगर.'}>
                            {form.academicYear || 'रा.थैरगाव ता.कर्जत. जि.अहिल्यानगर.'}
                          </span>
                        </div>

                        {/* Mobile (मोबा) */}
                        <div className="flex items-center gap-1.5 select-none">
                          <span className="font-extrabold text-[#dc2626] text-[9.5px] w-10 shrink-0">मोबा :</span>
                          <div className="bg-neutral-50 border border-neutral-250 rounded px-2 py-0.5 font-bold text-neutral-800 text-[9.5px] w-28">
                            {form.bloodGroup || '8483876891'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom footer strip with Savita Vidhate professional multi-line centered layout */}
                    <div className="bg-[#fcfcfd] border-t border-[#2323FF]/85 py-0.5 px-3 flex flex-col items-center justify-center select-none shrink-0 relative h-[45px]">
                      {/* Signature image positioned centered above her name */}
                      <div className="h-3 flex items-center justify-center mb-0">
                        <img src={form.principalSignature || SAMYAK_PRESIDENT_SIG} alt="president sign" className="h-3 object-contain filter dark:brightness-110" />
                      </div>
                      <span className="text-[#dc2626] font-black text-[9px] leading-none mb-0.5 truncate max-w-[280px] block text-center" title={form.presidentName || 'सौ.सविता महेंद्र विधाते'}>
                        {form.presidentName || 'सौ.सविता महेंद्र विधाते'}
                      </span>
                      <span className="text-[#0055FF] font-black text-[7.5px] leading-none truncate max-w-[280px] block text-center" title={form.presidentTitle || 'जिल्हा अध्यक्षा अहिल्यानगर'}>
                        {form.presidentTitle || 'जिल्हा अध्यक्षा अहिल्यानगर'}
                      </span>
                    </div>
                  </motion.div>
                );
              } else {
                // Back side view of Shramik Majdur
                return (
                  <motion.div
                    className="w-[340px] xs:w-[377px] h-[240px] bg-[#F9F9F9] text-neutral-800 rounded-[1rem] border-2 border-[#2323FF] shadow-xl overflow-hidden relative flex flex-col justify-between"
                    whileHover={{ y: -5, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Top brand header bar */}
                    <div className="bg-[#2323FF] text-white py-1.5 flex flex-col items-center justify-center border-b-2 border-[#eab308] leading-none text-center select-none">
                      <span className="text-[6.5px] font-black text-rose-100 uppercase tracking-wider mb-0">सम्यक फाऊंडेशन प्रणित</span>
                      <span className="text-[11px] font-black tracking-wide text-[#FFCE1B]">श्रमिक मजदुर संघ (MDM विभाग)</span>
                    </div>

                    {/* T&C Terms and conditions with standard Marathi */}
                    <div className="flex-1 p-3 text-left">
                      <span className="text-[9.5px] font-black text-neutral-850 block mb-1">नियम व अटी :</span>
                      <div className="space-y-0.5 text-[7px] font-extrabold text-neutral-600 leading-tight">
                        <p>१. हे ओळखपत्र केवळ संबंधित अधिकृत कामासाठीच वैध राहील.</p>
                        <p>२. ओळखपत्र गहाळ झाल्यास तात्काळ कोपरगाव कार्यालयाशी संपर्क साधावा.</p>
                        <p>३. गैरवापर आढळल्यास ओळखपत्र रद्द करण्यात येईल व योग्य कारवाई केली जाईल.</p>
                      </div>

                      {/* Signatures line */}
                      <div className="flex justify-between items-end mt-4">
                        <div className="flex flex-col items-center">
                          <div className="w-[50px] h-4 border-b border-neutral-350" />
                          <span className="text-[6.5px] font-black text-neutral-500 mt-1 leading-none">सभासद सही</span>
                          <span className="text-[5.5px] text-neutral-400 font-bold">(Member Sign)</span>
                        </div>

                        <div className="flex flex-col items-center relative">
                          <img src={SAMYAK_PRESIDENT_SIG} alt="president" className="h-5 object-contain absolute bottom-4 select-none opacity-90" />
                          <div className="w-[70px] h-4 border-b border-neutral-350" />
                          <span className="text-[6.5px] font-black text-[#2323FF] mt-1 leading-none">जिल्हाध्यक्ष स्वाक्षरी</span>
                          <span className="text-[5.5px] text-neutral-400 font-bold">(Authorized Sign)</span>
                        </div>
                      </div>
                    </div>

                    {/* Barcode representation bar */}
                    <div className="bg-neutral-50 border-t border-neutral-200 p-2 flex flex-col items-center justify-center">
                      <div className="w-32 h-4 bg-white flex items-center justify-between overflow-hidden px-1 border border-neutral-200">
                        {Array.from({ length: 32 }).map((_, i) => (
                          <div key={i} className={`h-full ${i % 3 === 0 ? 'w-0.5 bg-black' : i % 5 === 0 ? 'w-0.25 bg-black' : 'w-px bg-black'}`} />
                        ))}
                      </div>
                      <span className="text-[6.5px] font-extrabold font-mono text-neutral-500 mt-0.5">
                        {(form.studentId || 'UNION-MDM-8483').toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                );
              }
            }

            return (
              <motion.div
                className={`w-[240px] h-[377px] ${previewCfg.cardBg} ${previewCfg.isDark ? 'text-[#e2e8f0]' : 'text-slate-800'} rounded-[1.5rem] border ${previewCfg.isDark ? 'border-zinc-800' : 'border-slate-200/80'} shadow-xl overflow-hidden relative flex flex-col justify-between`}
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header Section */}
                {selectedTemplate === 'siddheshwar' ? (
                  <div className="absolute top-0 left-0 w-full z-25 flex flex-col bg-white overflow-hidden p-[5px] pb-1 border-b-[0.5px] border-black">
                    <span className="text-[6.5px] font-black text-rose-650 text-center uppercase tracking-wider leading-none">
                      यशवंत शिक्षण संस्था कर्जत
                    </span>
                    <div className="flex items-center justify-between px-1 py-0.5">
                      <div className="w-[18px] h-[18px] rounded-full border border-amber-500 bg-white p-0.5 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo === DEFAULT_LOGO_BASE64 ? SIDD_SANSTHA_LOGO : form.schoolLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-bold">SS</div>
                        )}
                      </div>
                      <span className="text-[11px] font-black tracking-tight text-rose-650 leading-tight">
                        सिद्धेश्वर विद्यालय
                      </span>
                      <div className="w-[18px] h-[18px] rounded-full border border-amber-500 bg-white p-0.5 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                        <img src={SIDD_SANSTHA_LOGO} className="w-full h-full object-contain" alt="Logo" />
                      </div>
                    </div>
                    <span className="text-[5.4px] font-black text-rose-650 text-center leading-none tracking-wider">
                      स्थापना - १९६७
                    </span>
                    <div className="bg-rose-650 text-white text-center py-[2px] mt-1 select-none shrink-0 rounded-xs">
                      <span className="text-[6.5px] font-black tracking-wide block truncate">
                        भांबोरा, ता.कर्जत, जि.अहमदनगर.
                      </span>
                    </div>
                  </div>
                ) : selectedTemplate === 'bharatgas' ? (
                  <div className="absolute top-0 left-0 w-full z-25 flex flex-col bg-[#ea580c] text-white overflow-hidden p-[5px] pb-1 border-b-[0.5px] border-amber-500">
                    <div className="flex items-center justify-between px-1 py-0.5">
                      <div className="w-[18px] h-[18px] rounded-full bg-white p-0.5 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo === DEFAULT_LOGO_BASE64 ? BHARATGAS_SYMBOL_LOGO : form.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-orange-600 text-white flex items-center justify-center text-[7px] font-bold">BG</div>
                        )}
                      </div>
                      <span className="text-[10px] font-black tracking-tight text-white leading-tight uppercase">
                        Bharatgas
                      </span>
                      <div className="w-[18px] h-[18px] bg-white rounded-full p-0.5 flex items-center justify-center shrink-0">
                        <img src={BHARATGAS_SYMBOL_LOGO} className="w-full h-full object-contain" alt="Logo" />
                      </div>
                    </div>
                    <div className="bg-[#1e3a8a] text-white text-center py-[2px] mt-1 select-none shrink-0 rounded-xs">
                      <span className="text-[6.5px] font-black tracking-wide block truncate">
                        LAXMI VAIBHAV GAS AGENCY, KARMALA
                      </span>
                    </div>
                  </div>
                ) : selectedTemplate === 'zpketur2' ? (
                  <div className="absolute top-0 left-0 w-full z-25 flex flex-col bg-white overflow-hidden p-[5px] pb-1 border-b-[0.5px] border-black">
                    {/* Top title text */}
                    <span className="text-[6.5px] font-black text-rose-650 text-center uppercase tracking-wider leading-none">
                      जिल्हा परिषद प्राथमिक शाळा
                    </span>
                    
                    {/* Middle title row with seal logo left and pencil logo right */}
                    <div className="flex items-center justify-between px-1 py-0.5">
                      {/* Solapur emblem seal logo */}
                      <div className="w-[18px] h-[18px] rounded-full border border-amber-500 bg-white p-0.5 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo === DEFAULT_LOGO_BASE64 ? ZPKETUR_SOLAPUR_LOGO : form.schoolLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-red-600 text-white flex items-center justify-center text-[7px] font-bold">ZP</div>
                        )}
                      </div>
                      
                      {/* Middle main title: केतुर नं. २ */}
                      <span className="text-[12px] font-black tracking-tight text-rose-650 leading-tight">
                        केतुर नं. २
                      </span>

                      {/* SSA Pencil logo on right */}
                      <div className="w-[26px] h-[9px] shrink-0 overflow-hidden flex items-center">
                        <img src={SSA_PENCIL_LOGO} className="w-full h-full object-contain" alt="Pencil" />
                      </div>
                    </div>

                    {/* UDISE NO text style */}
                    <span className="text-[5.4px] font-black text-rose-650 text-center leading-none tracking-wider">
                      UDISE NO - 27300305002
                    </span>

                    {/* Red banner at bottom of header */}
                    <div className="bg-rose-650 text-white text-center py-[2px] mt-1 select-none shrink-0 rounded-xs">
                      <span className="text-[6.5px] font-black tracking-wide block truncate">
                        ता.करमाळा जि.सोलापूर
                      </span>
                    </div>
                  </div>
                ) : isChandra ? (
                  <div className="absolute top-0 left-0 w-full z-20 flex flex-col overflow-hidden bg-[#0f2963] border-b border-[#eab308]">
                    <div className="py-1 px-2.5 flex items-center relative h-[44px] w-full">
                      {/* Round gold bordered seal logo */}
                      <div className="w-[28px] h-[28px] rounded-full border border-[#eab308] bg-white p-0.5 shrink-0 flex items-center justify-center relative overflow-hidden">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#0f2963] text-white flex items-center justify-center text-[8px] font-bold">🏫</div>
                        )}
                      </div>
                      
                      <div className="flex-1 flex flex-col items-start pr-1 pl-1.5 overflow-hidden">
                        <span className="text-[5px] font-bold uppercase text-[#eab308] leading-none">
                          Rayat Shikshan Sanstha's
                        </span>
                        <span className="text-[7.6px] font-black tracking-tight text-white leading-tight mt-0.5 block truncate">
                          CHANDRABHAMA MAHAVIDYALAY
                        </span>
                        <span className="text-[5.5px] font-black tracking-tight text-[#eab308] leading-none">
                          KARJAT, DIST-AHILYANAGAR
                        </span>
                        <span className="text-[4px] font-medium tracking-wide text-neutral-300 leading-none mt-0.5 whitespace-nowrap">
                          ARTS, SCIENCE & COMMERCE COLLEGE
                        </span>
                      </div>
                    </div>
                  </div>
                ) : isSwanand ? (
                  <div className="absolute top-0 left-0 w-full z-20 flex flex-col overflow-hidden bg-[#1e3a8a] border-b-2 border-[#eab308] shadow-sm">
                    <div className="py-1 px-1.5 flex items-center justify-center relative h-[54px] w-full text-center">
                      {/* Round gold bordered seal logo absolute on the left with increased size */}
                      <div className="absolute left-2.5 top-[7px] w-[36px] h-[36px] rounded-full border-1.5 border-[#eab308] bg-white p-0.5 shrink-0 flex items-center justify-center overflow-hidden z-20 transition-all hover:scale-110 shadow-md">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-[10px] font-bold">🏫</div>
                        )}
                      </div>
                      
                      {/* Centered header texts, larger font sizes */}
                      <div className="w-full flex flex-col items-center justify-center pl-[42px] pr-1 overflow-hidden select-none">
                        <span className="text-[5.4px] font-black uppercase text-[#eab308] leading-none block truncate w-full text-center tracking-wide">
                          SWANAND SHIKSHAN SANASTHA CHINCHOLI KALDAT
                        </span>
                        <span className="text-[10.5px] font-black tracking-tight text-white leading-tight mt-0.5 block truncate w-full text-center drop-shadow-sm">
                          SWANAND VIDYALAY
                        </span>
                        <span className="text-[6.2px] font-black tracking-tight text-[#eab308] leading-none mt-0.5 block truncate w-full text-center">
                          CHINCHOLI KALDAT, TAL-KARJAT
                        </span>
                        <span className="text-[5.4px] font-bold tracking-wide text-zinc-200 leading-none mt-0.5 block truncate w-full text-center">
                          DIST-AHILYANAGAR
                        </span>
                      </div>
                    </div>
                  </div>
                ) : selectedTemplate === 'newenglishmalthan' ? (
                  <div className="absolute top-0 left-0 w-full z-20 flex flex-col overflow-hidden bg-white border-b border-rose-950/20 shadow-xs">
                    {/* Top yellow/gold banner with correct spellings */}
                    <div className="bg-[#eab308] pt-1 pb-1 px-1 text-center select-none relative z-10 rounded-b-[5%]">
                      <span className="text-[4.2px] font-black tracking-wide text-[#1e3a8a] leading-none block truncate">
                        ◆ स्वानंद शिक्षण संस्था, पिंपळा काळोखाात ◆
                      </span>
                    </div>
                    
                    {/* Main white header area with logo on the left and text on right/center */}
                    <div className="py-1 px-2.5 bg-white flex items-center relative h-[36px] w-full">
                      {/* Round gold/blue bordered seal logo */}
                      <div className="w-[28px] h-[28px] rounded-full border-1.5 border-[#eab308] bg-white p-0.5 shadow-2xs shrink-0 flex items-center justify-center relative overflow-hidden ring-1 ring-[#1e3a8a]/20">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-contain rounded-full" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-[8px] font-bold">🏫</div>
                        )}
                      </div>
                      
                      {/* Header School Information column */}
                      <div className="flex-1 flex flex-col items-center justify-center text-center pr-3">
                        <span className="text-[10.8px] font-black tracking-tight text-red-650 leading-none">
                          न्यू इंग्लिश स्कूल मलठण.
                        </span>
                        <span className="text-[6.2px] font-extrabold tracking-tight text-neutral-850 leading-none mt-1">
                          ता. कर्जत जि. अहिल्यानगर
                        </span>
                      </div>
                    </div>

                    {/* UDISE Pill at the bottom center of the header block */}
                    <div className="flex justify-center -mt-1 mb-1 shrink-0 relative z-10">
                      <div className="bg-[#991b1b] rounded-full px-2.5 py-0.5 shadow-2xs text-center border border-[#eab308]/20">
                        <span className="text-[4.5px] font-mono font-extrabold text-white leading-none tracking-wider block">
                          UDISE NO-27260408402
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`absolute top-0 left-0 w-full h-[66px] ${previewCfg.headerAccent} rounded-b-[24%]`} />
                    <div className={`absolute top-0 left-0 w-full h-[62px] ${previewCfg.headerBg} rounded-b-[22%] flex items-center p-2 pt-3 z-10 overflow-hidden`}>
                      <div className="w-[28px] h-[28px] rounded bg-white/15 p-0.5 shrink-0 flex items-center justify-center">
                        {form.schoolLogo ? (
                          <img src={form.schoolLogo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <School size={12} className="text-amber-400" />
                        )}
                      </div>
                      <div className="text-left flex-1 min-w-0 pl-1.55">
                        <span className="text-[7.2px] block font-black uppercase text-white leading-tight tracking-wider truncate">
                          {form.schoolName || 'BRIGHT FUTURE'}
                        </span>
                        <span className={`text-[4.5px] block font-extrabold ${previewCfg.isDark ? 'text-[#10b981]' : 'text-amber-400'} uppercase leading-none tracking-tight truncate`}>
                          {previewCfg.subTitle}
                        </span>
                        <span className="text-[3.8px] block font-medium text-slate-300 italic leading-none mt-0.5 whitespace-nowrap">
                          {previewCfg.tagline}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Details layout body columns */}
                <div 
                  className={`relative flex-1 p-2.5 ${ptOffset} ${(selectedTemplate === 'newenglishmalthan' || isChandra || isSwanand || selectedTemplate === 'zpketur2' || selectedTemplate === 'siddheshwar' || selectedTemplate === 'bharatgas') ? 'px-1 overflow-hidden' : 'flex flex-row gap-1.5 items-start justify-between'}`}
                  style={(selectedTemplate === 'newenglishmalthan' || isChandra || isSwanand || selectedTemplate === 'zpketur2' || selectedTemplate === 'siddheshwar' || selectedTemplate === 'bharatgas') ? {} : previewCfg.dotStyle}
                >
                  
                  {(selectedTemplate === 'newenglishmalthan' || isChandra || isSwanand || selectedTemplate === 'zpketur2' || selectedTemplate === 'siddheshwar' || selectedTemplate === 'bharatgas') ? (() => {
                    const roleLabel = (form.classCourse && (
                      form.classCourse.toLowerCase().includes('grade') || 
                      form.classCourse.toLowerCase().includes('class') || 
                      form.classCourse.toLowerCase().includes('std') || 
                      form.classCourse.toLowerCase().includes('div') ||
                      form.classCourse.toLowerCase().includes('roll') ||
                      form.classCourse.toLowerCase().includes('student') ||
                      /[\d]/.test(form.classCourse)
                    )) ? 'STUDENT' : (isChandra || isSwanand) ? 'STAFF' : 'TEACHER';

                    return (
                      <>
                        {/* High-fidelity custom vector backdrop curves from the uploaded template */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 240 377" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {/* Light blue soft sky-colored base background filling */}
                          <rect width="240" height="377" fill="url(#body_bg_grad)" />
                          
                          {/* Beautiful School Building background image watermark specifically for Swanand template */}
                          {isSwanand && (
                            <image 
                              href="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=600&auto=format&fit=crop" 
                              x="15" 
                              y="100" 
                              width="210" 
                              height="180" 
                              preserveAspectRatio="xMidYMid slice" 
                              opacity="0.08" 
                            />
                          )}
                          
                          {/* Soft dynamic background vector circle grids */}
                          {selectedTemplate !== 'zpketur2' && (
                            <>
                              <circle cx="210" cy="180" r="140" fill="none" stroke={(isChandra || isSwanand) ? "#1e3a8a" : "#3b82f6"} strokeWidth="0.35" strokeDasharray="1.5,1.5" opacity={(isChandra || isSwanand) ? "0.15" : "0.32"} />
                              <circle cx="210" cy="180" r="110" fill="none" stroke={(isChandra || isSwanand) ? "#1e3a8a" : "#3b82f6"} strokeWidth="0.4" strokeDasharray="0.8,2.4" opacity={(isChandra || isSwanand) ? "0.12" : "0.25"} />
                              <circle cx="210" cy="180" r="80" fill="none" stroke={(isChandra || isSwanand) ? "#1e3a8a" : "#3b82f6"} strokeWidth="0.3" opacity={(isChandra || isSwanand) ? "0.08" : "0.18"} />
                            </>
                          )}
                          
                          {/* Large left wavy dark blue brand backdrop */}
                          {!isSwanand && selectedTemplate !== 'zpketur2' && (
                            <>
                              <path d="M0,66 C32,74 38,154 0,166 L0,66 Z" fill="#0f2963" />
                              {/* Searing golden-gold divider border curve on left backdrop */}
                              <path d="M0,66 C34,74 40,154 0,166" stroke="#eab308" strokeWidth="1.8" />
                              <path d="M0,66 C36,74 42,154 0,166" stroke="#ea580c" strokeWidth="0.8" opacity="0.45" />

                              {/* Left sidebar background details: vector book outlines underneath Teacher sidebar */}
                              <g stroke="#ffffff" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" transform="translate(1, 142) scale(0.08)">
                                <path d="M20,90 Q60,50 100,90" fill="none" />
                                <path d="M100,90 Q140,50 180,90" fill="none" />
                                <path d="M20,90 L20,135 Q60,95 100,135 L100,90" fill="none" />
                                <path d="M180,90 L180,135 Q140,95 100,135" fill="none" />
                                <path d="M130,50 L170,90 M140,40 L180,80" strokeWidth="0.8" />
                              </g>
                            </>
                          )}

                          {selectedTemplate === 'zpketur2' ? (
                            <>
                              {/* Solid white card canvas body backplate */}
                              <rect width="240" height="377" fill="#ffffff" />
                              {/* Distinct double standard boundary lines */}
                              <rect x="2.5" y="2.5" width="235" height="372" stroke="#000000" strokeWidth="1.0" fill="none" />
                            </>
                          ) : isChandra ? (
                            <>
                              {/* Bottom-left rich golden wave curve */}
                              <path d="M0,322 C50,296 100,344 116,377 L0,377 Z" fill="#eab308" />
                              <path d="M0,322 C50,296 100,344 116,377" stroke="#0f2963" strokeWidth="1.5" />
                              
                              {/* Bottom-right overlapping deep blue ribbon wave curve */}
                              <path d="M72,377 C95,338 148,304 240,336 L240,377 L72,377 Z" fill="#0f2963" />
                              <path d="M72,377 C95,338 148,304 240,336" stroke="#eab308" strokeWidth="1.5" />
                            </>
                          ) : isSwanand ? (
                            <>
                              {/* Bottom clean border to ground the card, without overlapping the address area */}
                              <rect x="0" y="372" width="240" height="5" fill="#1e3a8a" />
                              <rect x="0" y="370" width="240" height="2" fill="#eab308" />
                            </>
                          ) : (
                            <>
                              {/* Left-bottom rich red wave curve */}
                              <path d="M0,322 C50,296 100,344 116,377 L0,377 Z" fill="#dc2626" />
                              <path d="M0,322 C50,296 100,344 116,377" stroke="#eab308" strokeWidth="1.5" />
                              
                              {/* Bottom-right overlapping deep blue ribbon wave curve */}
                              <path d="M72,377 C95,338 148,304 240,336 L240,377 L72,377 Z" fill="#0f2963" />
                              <path d="M72,377 C95,338 148,304 240,336" stroke="#38bdf8" strokeWidth="1.5" />
                            </>
                          )}

                          {/* Signature block ink feather pen watermark (light-blue/indigo transparency) */}
                          <g stroke="#1e3a8a" strokeWidth="0.5" strokeLinecap="round" fill="none" opacity="0.08" transform="translate(162, 238) scale(0.6)">
                            <path d="M60,110 C70,75 90,50 115,35 C108,55 90,85 70,115 Z" fill="#1e3a8a" />
                            <path d="M60,110 C80,82 95,55 115,35" strokeWidth="1.2" />
                            <path d="M72,100 C78,94 85,95 86,96 M77,88 C84,82 91,83 92,84 M82,76 C89,70 96,71 97,72 M88,64 C95,58 102,59 103,60" />
                          </g>

                          <defs>
                            <linearGradient id="body_bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#f0f9ff" />
                              <stop offset="50%" stopColor="#ffffff" />
                              <stop offset="100%" stopColor="#e0f2fe" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Left vertical sidebar */}
                        {!isSwanand && selectedTemplate !== 'zpketur2' && (
                          <div className={`absolute left-[1px] top-[74px] w-[20px] h-[92px] ${isChandra ? 'bg-[#eab308] border-[#0f2963]' : 'bg-[#0f2963] border-[#eab308]'} rounded-r-[124px] border-r z-10 flex flex-col items-center justify-center p-1 shadow-2xs`}>
                            <span className={`text-[5px] font-black font-sans text-center ${isChandra ? 'text-[#0f2963]' : 'text-white'} uppercase tracking-widest block whitespace-nowrap`} style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>
                              {roleLabel}
                            </span>
                          </div>
                        )}

                        {/* Vertical Photographer Credits on Left */}
                        {selectedTemplate === 'zpketur2' && (
                          <div className="absolute left-[-24px] top-[152px] h-[10px] w-[92px] z-10 flex items-center justify-center" style={{ transform: 'rotate(-90deg)' }}>
                            <span className="text-[3.9px] font-black text-black select-none tracking-widest block whitespace-nowrap leading-none">
                              अनिल पोकळे फोटोग्राफी राशीन - ९२२६८७४४८७
                            </span>
                          </div>
                        )}

                        {/* Centered Portrait Column */}
                        <div className={`absolute top-[75px] left-[85px] w-[70px] h-[83px] ${selectedTemplate === 'zpketur2' ? 'border-1.5 border-red-650' : 'rounded-lg border-2 border-white ring-1 ring-[#eab308] shadow-md'} overflow-hidden bg-slate-50 z-10 flex items-center justify-center`}>
                          {form.studentPhoto ? (
                            <img src={form.studentPhoto} alt="Student" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-slate-300" />
                          )}
                        </div>

                        {/* Right academic decoration block */}
                        {!isChandra && !isSwanand && selectedTemplate !== 'zpketur2' && (
                          <div className="absolute right-[8px] top-[74px] w-[60px] h-[92px] z-10 flex flex-col items-center justify-end select-none">
                            <div className="relative w-full h-[85px] flex flex-col items-center justify-end">
                              {/* Compact Vector School Building in light-blue background watermark */}
                              <div className="absolute inset-0 opacity-[0.24] flex items-center justify-center -z-10 bg-no-repeat bg-contain" style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'><rect x='5' y='40' width='90' height='35' fill='%231e3a8a' rx='2'/><rect x='15' y='20' width='70' height='20' fill='%231e3a8a' rx='1'/><polygon points='10,20 50,5 90,20' fill='%23dc2626'/><rect x='45' y='55' width='10' height='20' fill='%23eab308'/><rect x='25' y='50' width='10' height='10' fill='%23ffffff' rx='1'/><rect x='65' y='50' width='10' height='10' fill='%23ffffff' rx='1'/><rect x='30' y='27' width='8' height='8' fill='%23ffffff' rx='1'/><rect x='62' y='27' width='8' height='8' fill='%23ffffff' rx='1'/></svg>")` }} />
                              
                              {/* Colorful pens container */}
                              <div className="absolute top-[8px] right-[10px] w-[14px] h-[34px] flex items-end justify-center">
                                <svg className="w-full h-full" viewBox="0 0 14 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  {/* Yellow ruler */}
                                  <rect x="1" y="4" width="3" height="30" fill="#f59e0b" rx="0.5" />
                                  <line x1="2" y1="8" x2="3" y2="8" stroke="#ffffff" strokeWidth="0.5" />
                                  <line x1="2" y1="12" x2="3" y2="12" stroke="#ffffff" strokeWidth="0.5" />
                                  <line x1="2" y1="16" x2="3" y2="16" stroke="#ffffff" strokeWidth="0.5" />
                                  <line x1="2" y1="20" x2="3" y2="20" stroke="#ffffff" strokeWidth="0.5" />
                                  <line x1="2" y1="24" x2="3" y2="24" stroke="#ffffff" strokeWidth="0.5" />
                                  {/* Blue Pen */}
                                  <path d="M5,10 L5,34 L8,34 L8,10 Z" fill="#3b82f6" />
                                  <path d="M5,10 L6.5,4 L8,10 Z" fill="#93c5fd" />
                                  <path d="M6,4 L6.5,1 L7,4 Z" fill="#3b82f6" />
                                  {/* Red Pen */}
                                  <path d="M9,15 L9,34 L12,34 L12,15 Z" fill="#ef4444" />
                                  <path d="M9,15 L10.5,10 L12,15 Z" fill="#fca5a5" />
                                  <path d="M10,10 L10.5,7 L11,10 Z" fill="#ef4444" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        {!isChandra && !isSwanand && selectedTemplate !== 'newenglishmalthan' && selectedTemplate !== 'zpketur2' && selectedTemplate !== 'siddheshwar' && selectedTemplate !== 'bharatgas' && (
                          <div className="absolute top-[198px] left-1/2 -translate-x-1/2 bg-red-600 rounded-full px-4 py-0.5 z-10 text-center shadow-xs border border-[#eab308]/40">
                            <span className="text-[5.5px] font-black text-yellow-250 block select-none whitespace-nowrap leading-none">
                              पद :- {form.classCourse || 'मुख्याध्यापक'}
                            </span>
                          </div>
                        )}

                        {/* Beautiful custom Name Banners for Chandrabhama and Swanand templates */}
                        {(isChandra || isSwanand) && (
                          <div 
                            className="absolute top-[164px] left-[40px] w-[160px] h-[18px] z-15 text-center flex items-center justify-center rounded-xs shadow-xs"
                            style={{ backgroundColor: isSwanand ? '#1e3a8a' : '#0f2963' }}
                          >
                            <span className="text-[8.5px] font-black tracking-wider text-white uppercase leading-none block truncate px-2">
                              {form.studentName}
                            </span>
                          </div>
                        )}

                        {/* Beautiful ribbon name & designation banner for New English School Malthan */}
                        {selectedTemplate === 'newenglishmalthan' && (
                          <>
                            {/* Background red ribbon wings */}
                            <div className="absolute top-[154.5px] left-[40px] w-[160px] h-[18px] bg-[#dc2626] z-10 rounded-sm" />
                            {/* Slanted blue inner bar */}
                            <div 
                              className="absolute top-[153px] left-[50px] w-[140px] h-[18.2px] bg-[#1e3a8a] z-15 flex items-center justify-center shadow-xs"
                              style={{ clipPath: 'polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)' }}
                            >
                              <span className="text-[8px] font-black tracking-wider text-white uppercase leading-none block truncate px-3">
                                नाव :- {form.studentName || 'कुलकर्णी संजय हरिश्चंद्र'}
                              </span>
                            </div>
                            {/* Designation Pill below Name */}
                            <div className="absolute top-[172px] left-1/2 -translate-x-1/2 w-[116px] h-[12px] bg-[#991b1b] rounded-full z-15 flex items-center justify-center border border-amber-300/20 shadow-xs">
                              <span className="text-[6.5px] font-black text-[#fef08a] uppercase leading-none block truncate px-1">
                                पद :- {form.classCourse || 'मुख्याध्यापक'}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Fields detailed list */}
                        <div className={`absolute ${
                          (selectedTemplate === 'zpketur2' || selectedTemplate === 'siddheshwar' || selectedTemplate === 'bharatgas') 
                            ? 'top-[166px] space-y-[4.6px] pl-2.5 pr-2' 
                            : (isChandra || isSwanand) 
                              ? 'top-[191px] space-y-[2.2px]' 
                              : 'top-[218px] space-y-[3.5px]'
                        } left-[15px] w-[210px] z-10 flex flex-col pt-1`}>
                          {fieldsToShow.map((f: any, idx: number) => {
                            // Map icon/circle colors matching the uploaded image exactly
                            const badgeColors = isSwanand ? [
                              'bg-[#1e3a8a]', // Row 1 (Reg No) -> Deep Blue
                              'bg-[#10b981]', // Row 2 (DOB) -> Green
                              'bg-[#f97316]', // Row 3 (Mobile) -> Orange
                              'bg-[#dc2626]', // Row 4 (Aadhar) -> Red
                              'bg-[#8b5cf6]', // Row 5 (Address) -> Purple
                            ] : isChandra ? [
                              'bg-[#0f2963]', // Row 1 (Post) -> Deep Blue
                              'bg-[#10b981]', // Row 2 (Depa) -> Green
                              'bg-[#f97316]', // Row 3 (DOB) -> Orange
                              'bg-[#dc2626]', // Row 4 (Moba) -> Red
                              'bg-[#8b5cf6]', // Row 5 (Address) -> Purple
                              'bg-[#14b8a6]', // Row 6 (ID No) -> Teal
                            ] : [
                              'bg-[#3b82f6]', // Row 1 (birth date) -> Royal Blue
                              'bg-[#10b981]', // Row 2 (blood) -> Green
                              'bg-[#f97316]', // Row 3 (designation) -> Orange/Amber
                              'bg-[#8b5cf6]', // Row 4 (school) -> Purple
                              'bg-[#14b8a6]', // Row 5 (location) -> Teal
                              'bg-[#ec4899]', // Row 6 (udise) -> Fuchsia/Pink
                            ];

                            const valFontSize = (isSwanand && f.value.length > 18) ? 'text-[5.4px]' : 'text-[6.5px]';

                            if (selectedTemplate === 'zpketur2' || selectedTemplate === 'siddheshwar' || selectedTemplate === 'bharatgas') {
                              return (
                                <div 
                                  key={idx} 
                                  className="flex items-center text-left py-0 select-none pl-1"
                                >
                                  <span className={`text-[7.5px] font-black ${selectedTemplate === 'bharatgas' ? 'text-[#1e3a8a]' : 'text-black'} uppercase w-[48px] shrink-0 leading-none`}>
                                    {f.label}
                                  </span>
                                  <span className="text-[7px] font-black text-black shrink-0">:-</span>
                                  <div className={`text-[7.6px] font-black ${
                                    (selectedTemplate === 'zpketur2' || selectedTemplate === 'siddheshwar') && (idx === 0 || f.label.includes('जन्म') || f.label.includes('मो')) 
                                      ? 'text-[#b91c1c] font-extrabold' 
                                      : 'text-neutral-900'
                                  } truncate flex-1 leading-none pl-2`}>
                                    {f.value}
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={idx} 
                                className="flex items-center gap-1.5 py-0.5 px-2 bg-white/90 rounded-full border border-sky-100 shadow-2xs select-none transition-all hover:border-[#1e3a8a]/30"
                              >
                                <span className={`w-3.5 h-3.5 rounded-full ${badgeColors[idx] || 'bg-[#1e1a8a]'} text-white flex items-center justify-center text-[5.5px] shrink-0 font-bold shadow-3xs`}>
                                  {f.emoji}
                                </span>
                                <span className="text-[5.5px] font-black text-[#1e3a8a] uppercase w-[38px] shrink-0 leading-none">
                                  {f.label}
                                </span>
                                <span className="text-[5px] font-black text-[#1e3a8a] shrink-0">:-</span>
                                <div className={`${valFontSize} font-black ${isChandra ? 'text-[#0f2963]' : (f.isBlood || f.label.includes('जम') || f.label.includes('UDISE')) ? 'text-red-650' : 'text-neutral-850'} ${isSwanand ? 'overflow-visible' : 'truncate'} flex-1 leading-none uppercase pl-1`}>
                                  {f.value}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Single or Double Signature stack */}
                        {selectedTemplate === 'zpketur2' ? (
                          <div className="absolute bottom-[24px] right-[10px] w-[80px] z-25 flex flex-col items-center select-none text-center">
                            <div className="h-[21px] w-[64px] flex items-center justify-center relative">
                              {form.principalSignature ? (
                                <img src={form.principalSignature === DEFAULT_PRINCIPAL_SIG ? KETUR_HM_SIG : form.principalSignature} alt="Signature" className="h-[18px] w-full object-contain filter hue-rotate-15 contrast-125" />
                              ) : (
                                <div className="h-[21px] w-[64px]" />
                              )}
                            </div>
                            <span className="text-[6.8px] font-black text-rose-650 leading-none mt-1">मुख्याध्यापक</span>
                            <span className="text-[5.0px] font-bold text-rose-650 leading-none mt-0.5">जि.प.प्राथ.शाळा,केत्तूर-२</span>
                            <span className="text-[5.0px] font-bold text-rose-650 leading-none mt-0.5">ता.करमाळा,जि.सोलापूर</span>
                          </div>
                        ) : selectedTemplate === 'siddheshwar' ? (
                          <>
                            {/* Student signature left */}
                            <div className="absolute bottom-[24px] left-[10px] w-[80px] z-25 flex flex-col items-center select-none text-center">
                              <div className="h-[21px] w-[64px] flex items-center justify-center relative">
                                {form.studentSignature ? (
                                  <img src={form.studentSignature === DEFAULT_STUDENT_SIG ? DEFAULT_STUDENT_SIG : form.studentSignature} alt="Signature Left" className="h-[18px] w-full object-contain filter hue-rotate-15 contrast-125" />
                                ) : (
                                  <div className="h-[21px] w-[64px]" />
                                )}
                              </div>
                              <span className="text-[6.8px] font-black text-[#1e3a8a] leading-none mt-1">विद्यार्थी सही</span>
                            </div>
                            {/* Headmaster signature right */}
                            <div className="absolute bottom-[24px] right-[10px] w-[80px] z-25 flex flex-col items-center select-none text-center">
                              <div className="h-[21px] w-[64px] flex items-center justify-center relative">
                                {form.principalSignature ? (
                                  <img src={form.principalSignature === DEFAULT_PRINCIPAL_SIG ? SIDD_HM_SIG : form.principalSignature} alt="Signature Right" className="h-[18px] w-full object-contain filter hue-rotate-15 contrast-125" />
                                ) : (
                                  <div className="h-[21px] w-[64px]" />
                                )}
                              </div>
                              <span className="text-[6.8px] font-black text-rose-650 leading-none mt-1">मुख्याध्यापक</span>
                              <span className="text-[5.0px] font-bold text-neutral-850 leading-none mt-0.5">सिद्धेश्वर विद्यालय भांबोरा</span>
                              <span className="text-[5.0px] font-bold text-neutral-850 leading-none mt-0.5">ता.कर्जत,जि.अहमदनगर</span>
                            </div>
                          </>
                        ) : selectedTemplate === 'bharatgas' ? (
                          <>
                            {/* Authorized Signatory right */}
                            <div className="absolute bottom-[36px] right-[10px] w-[80px] z-25 flex flex-col items-center select-none text-center">
                              <div className="h-[21px] w-[64px] flex items-center justify-center relative">
                                {form.principalSignature ? (
                                  <img src={form.principalSignature === DEFAULT_PRINCIPAL_SIG ? LAXMI_DISTRIBUTOR_SIG : form.principalSignature} alt="Signature Right" className="h-[18px] w-full object-contain filter hue-rotate-15 contrast-125" />
                                ) : (
                                  <div className="h-[21px] w-[64px]" />
                                )}
                              </div>
                              <span className="text-[6.8px] font-black text-[#1e3a8a] leading-none mt-1">Authorized Signatory</span>
                              <span className="text-[5.0px] font-bold text-cyan-700 leading-none mt-0.5">Laxmi Vaibhav Gas</span>
                            </div>
                            {/* Full width blue footer bar */}
                            <div className="absolute bottom-0 left-0 w-full h-[24px] bg-[#1e3a8a] flex items-center justify-center select-none z-20">
                              <span className="text-[6px] font-bold text-white uppercase tracking-wider">
                                Customer Care No: 1800 2333 555
                              </span>
                            </div>
                          </>
                        ) : isChandra ? (
                          <div className="absolute bottom-[44px] left-0 w-full px-4 flex justify-between items-end z-10 select-none">
                            <div className="flex flex-col items-center">
                              <div className="h-[21px] w-[50px] flex items-center justify-center relative">
                                {form.studentSignature ? (
                                  <img src={form.studentSignature} alt="Signature Left" className="h-[14px] w-full object-contain filter hue-rotate-15 contrast-125" />
                                ) : (
                                  <div className="h-[21px] w-[50px]" />
                                )}
                              </div>
                              <div className="text-[#94a3b8] text-[3.5px] tracking-tighter leading-none -mt-1 select-none">.................................</div>
                              <span className="text-[5.5px] font-black text-[#0f2963] leading-none mt-1">Holder Signature</span>
                              <span className="text-[5px] font-bold text-neutral-800 leading-none mt-0.5">Signature</span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="h-[21px] w-[50px] flex items-center justify-center relative">
                                {form.principalSignature ? (
                                  <img src={form.principalSignature} alt="Signature Right" className="h-[14px] w-full object-contain filter hue-rotate-15 contrast-125" />
                                ) : (
                                  <svg className="w-full h-full stroke-blue-700" viewBox="0 0 100 40" strokeWidth="2.8" fill="none" strokeLinecap="round">
                                    <path d="M10 24 C25 8, 38 4, 50 18 C62 32, 70 6, 82 20 C90 28, 95 12, 100 16" />
                                  </svg>
                                )}
                              </div>
                              <div className="text-[#94a3b8] text-[3.5px] tracking-tighter leading-none -mt-1 select-none">.................................</div>
                              <span className="text-[5.5px] font-black text-[#0f2963] leading-none mt-1">Principal</span>
                              <span className="text-[5px] font-bold text-neutral-800 leading-none mt-0.5">Signature</span>
                            </div>
                          </div>
                        ) : (
                          /* Single Principal Signature stack on Right side as shown in the upload for Malthan / Swanand */
                          <div className={`absolute ${isSwanand ? 'bottom-[18px] right-[10px] w-[56px] z-25' : 'bottom-[44px] right-[15px] w-[60px] z-10'} flex flex-col items-center select-none`}>
                            <div className={`${isSwanand ? 'h-[16px] w-[48px]' : 'h-[21px] w-[60px]'} flex items-center justify-center relative`}>
                              {form.principalSignature ? (
                                <img src={form.principalSignature} alt="Signature" className="h-full w-full object-contain filter hue-rotate-15 contrast-125" />
                              ) : (
                                <svg className="w-full h-full stroke-blue-700" viewBox="0 0 100 40" strokeWidth="2.8" fill="none" strokeLinecap="round">
                                  <path d="M10 24 C25 8, 38 4, 50 18 C62 32, 70 6, 82 20 C90 28, 95 12, 100 16" />
                                </svg>
                              )}
                            </div>
                            <div className="text-[#94a3b8] text-[3.8px] tracking-tighter leading-none -mt-1 select-none">.................................</div>
                            <span className="text-[5.5px] font-black text-red-650 leading-none mt-1">मुख्याध्यापक</span>
                            {!isSwanand && (
                              <span className="text-[4.8px] font-bold text-neutral-800 leading-none mt-0.5">Signature</span>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <>
                      {/* Left Column values list */}
                      <div className="flex-1 space-y-1 z-10 text-left">
                        {fieldsToShow.map((f: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 rounded-full ${previewCfg.badgeBg} text-white flex items-center justify-center text-[5px] shrink-0 font-bold`}>{f.emoji}</span>
                            <span className={`text-[5.5px] font-extrabold ${previewCfg.labelColor} uppercase w-[42px] shrink-0`}>{f.label}</span>
                            <span className={`text-[5px] ${previewCfg.labelColor} font-black`}>{f.colon || ':'}</span>
                            <div className={`text-[6px] font-black ${f.isBlood ? 'text-rose-600 font-extrabold' : previewCfg.textMain} truncate flex-1 leading-none uppercase`}>
                              {f.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right Portrait Column */}
                      <div className={`w-[66px] h-[82px] rounded-lg border ${previewCfg.borderColor} overflow-hidden shrink-0 mt-0.5 shadow-sm relative bg-slate-50 z-10 flex items-center justify-center`}>
                        {form.studentPhoto ? (
                          <img src={form.studentPhoto} alt="Student" className="w-full h-full object-cover" />
                        ) : (
                          <User size={16} className="text-slate-300" />
                        )}
                      </div>
                    </>
                  )}

                  {/* Transparent watermark wreath */}
                  {selectedTemplate !== 'newenglishmalthan' && (
                    <div className={`absolute bottom-[40px] left-1/2 -translate-x-1/2 ${previewCfg.watermarkOpacity} w-[65px] h-[65px] pointer-events-none transition-all`}>
                      <img src={form.schoolLogo} alt="" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {/* Signatures Row for Standard templates */}
                  {selectedTemplate === 'academic' && (
                    <div className="absolute bottom-[38px] left-0 w-full px-3.5 flex justify-between items-end z-10">
                      <div className="flex flex-col items-center">
                        {form.principalSignature ? (
                          <img src={form.principalSignature} alt="Signature Left" className="h-[14px] w-[45px] object-contain mb-[2px]" />
                        ) : (
                          <div className="h-[14px] w-[45px]" />
                        )}
                        <div className={`w-[48px] border-t ${previewCfg.isDark ? 'border-zinc-800' : 'border-slate-300'} my-0.5`} />
                        <span className={`text-[4.5px] font-black uppercase ${previewCfg.isDark ? 'text-[#10b981]' : 'text-[#0a2e5c]'} tracking-tight`}>
                          Principal Sign
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        {form.studentSignature ? (
                          <img src={form.studentSignature} alt="Signature Right" className="h-[14px] w-[45px] object-contain mb-[2px]" />
                        ) : (
                          <div className="h-[14px] w-[45px]" />
                        )}
                        <div className={`w-[48px] border-t ${previewCfg.isDark ? 'border-zinc-800' : 'border-slate-300'} my-0.5`} />
                        <span className={`text-[4.5px] font-black uppercase ${previewCfg.isDark ? 'text-[#10b981]' : 'text-[#0a2e5c]'} tracking-tight`}>
                          Student Sign
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom Slogan and Barcode Block */}
                {(selectedTemplate === 'newenglishmalthan' || isChandra) ? (
                  /* Floating barcode on white card overlapping bottom curves centered */
                  <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center select-none">
                    <div className="bg-white px-2 py-0.5 rounded border border-sky-100 shadow-sm flex flex-col items-center shrink-0 w-[114px]">
                      {/* Crisp black barcode lines replica */}
                      <div className="h-[15px] w-full flex items-center justify-around overflow-hidden">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <div 
                            key={i} 
                            className="bg-black h-full" 
                            style={{ width: `${i % 5 === 0 ? 0.35 : i % 7 === 0 ? 0.8 : i % 3 === 0 ? 1.4 : 0.6}px` }} 
                          />
                        ))}
                      </div>
                      {/* Monospace Code under Barcode */}
                      <span className="text-[5.2px] font-mono font-bold text-neutral-800 mt-[1.5px] tracking-[1.5px] leading-none uppercase">
                        {form.studentId}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={`h-[43px] ${previewCfg.headerBg} border-t-[3px] ${previewCfg.headerAccent} rounded-b-[1.5rem] p-1 flex flex-col items-center justify-center relative shrink-0`}>
                    <span className={`text-[4.5px] font-bold ${previewCfg.isDark ? 'text-zinc-450' : 'text-slate-100'} uppercase tracking-widest mb-0.5 block truncate max-w-[220px]`}>
                      {previewCfg.tagline || previewCfg.slogan}
                    </span>
                    <div className={`${previewCfg.barcodeBg} h-[16px] w-[130px] flex items-center justify-around px-1 py-0.5 rounded-xs overflow-hidden shrink-0`}>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div 
                          key={i} 
                          className="bg-black h-full" 
                          style={{ width: `${i % 3 === 0 ? 0.5 : i % 5 === 0 ? 1 : 1.5}px` }} 
                        />
                      ))}
                    </div>
                    <span className={`text-[4.5px] font-bold ${previewCfg.isDark ? 'text-zinc-400' : 'text-slate-500'} tracking-wider font-mono uppercase mt-0.5`}>
                      {form.studentId}
                    </span>
                  </div>
                )}

              </motion.div>
            );
          })()}

          <span className="text-[8px] font-black text-slate-400 dark:text-zinc-650 uppercase tracking-widest flex items-center gap-1">
            <Clock size={8} /> Active: Live Visual Sync
          </span>

        </div>

      </div>
      
    </div>
  );
};
