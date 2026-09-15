import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Heart, 
  Film, 
  Tv, 
  Search, 
  X, 
  CheckCircle2, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  ArrowRight,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  BookOpen,
  CreditCard,
  Globe,
  Info,
  Receipt,
  FileText,
  Printer,
  Sparkles,
  Sliders,
  Award,
  MapPin,
  Calendar,
  Clock
} from 'lucide-react';
import { PhotographyBillingDesk } from './PhotographyBillingDesk';
import { AtelierHeader } from './AtelierHeader';
import { AtelierHero } from './AtelierHero';
import { AtelierOfferings } from './AtelierOfferings';
import { AtelierSimulator } from './AtelierSimulator';
import { AtelierGallery } from './AtelierGallery';
import { AtelierTestimonials } from './AtelierTestimonials';
import { AtelierCommission } from './AtelierCommission';
import { AtelierFooter } from './AtelierFooter';
import { AtelierThemeProvider, useAtelierTheme } from './AtelierTheme';

// Define photography mock photos
const PORTFOLIO_PHOTOS = [
  {
    id: 1,
    title: 'Eternal Vows',
    category: 'wedding',
    desc: 'Grand traditional reception capture in Udaipur, India.',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 2,
    title: 'Golden Hour Embrace',
    category: 'pre-wedding',
    desc: 'Candid romance shoot during twilight on the Mumbai coastline.',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 3,
    title: 'A Cinematic Gaze',
    category: 'portrait',
    desc: 'Fine-art editorial close-up experimenting with neon lighting.',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 4,
    title: 'Vintage Sunset Ridge',
    category: 'pre-wedding',
    desc: 'Styled couple walk across the scenic hills of Mahabaleshwar.',
    url: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 5,
    title: 'Unspoken Poetry',
    category: 'wedding',
    desc: 'Black and white aesthetic veil portrait of the bride.',
    url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 6,
    title: 'Cosmopolitan Love',
    category: 'editorial',
    desc: 'Modern chic street pre-wedding campaign in Pune city.',
    url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 7,
    title: 'Samyak Trust Identity Design',
    category: 'editorial',
    desc: 'Deep royal blue curved vernacular social brand profile modeled exactly for Samyak Foundation.',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200'
  }
];

const getPhotoExif = (id: number) => {
  const exifData: Record<number, { camera: string, lens: string, shutter: string, aperture: string, iso: string, focal: string }> = {
    1: { camera: 'Sony A7R V', lens: 'Sony FE 50mm f/1.2 GM', shutter: '1/200s', aperture: 'f/1.2', iso: '800', focal: '50mm' },
    2: { camera: 'Leica M11', lens: 'Summilux-M 35mm f/1.4 ASPH', shutter: '1/1600s', aperture: 'f/1.4', iso: '64', focal: '35mm' },
    3: { camera: 'Hasselblad X2D 100C', lens: 'XCD 2.5/90V', shutter: '1/250s', aperture: 'f/2.5', iso: '100', focal: '90mm' },
    4: { camera: 'Fujifilm GFX100 II', lens: 'GF 80mm f/1.7 R WR', shutter: '1/500s', aperture: 'f/1.7', iso: '200', focal: '80mm' },
    5: { camera: 'Leica SL3', lens: 'Summicron-SL 50mm f/2 ASPH', shutter: '1/800s', aperture: 'f/2.0', iso: '400', focal: '50mm' },
    6: { camera: 'Sony A9 III', lens: 'FE 85mm f/1.4 GM', shutter: '1/2000s', aperture: 'f/1.4', iso: '100', focal: '85mm' },
    7: { camera: 'Leica SL3', lens: 'Summilux-SL 35mm f/1.4 ASPH', shutter: '1/250s', aperture: 'f/1.4', iso: '64', focal: '35mm' }
  };
  return exifData[id] || { camera: 'Leica SL3', lens: 'Summicron-SL 50mm f/2', shutter: '1/250s', aperture: 'f/2.0', iso: '100', focal: '50mm' };
};

function PhotographyPortfolioContent() {
  const { palette } = useAtelierTheme();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState(false);
  const [showHostingGuide, setShowHostingGuide] = useState(false);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Raw fully-functional single-file HTML code template that users can download.
  const rawHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lens & Light Studios — Premium Editorial Photography Portfolio</title>
  
  <!-- Primed Fonts from Google -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&display=swap" rel="stylesheet">
  
  <!-- Tailwind CSS Play CDN for stunning style compiling -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Custom Tailwind Config for Typography & Theme -->
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            serif: ['Playfair Display', 'serif'],
          },
          colors: {
            brandDark: '#111111',
            brandDarker: '#0a0a0a',
            gold: {
              DEFAULT: '#D4AF37',
              light: '#f3e5ab',
              dark: '#aa7c11',
            }
          }
        }
      }
    }
  </script>

  <style>
    html {
      scroll-behavior: smooth;
    }
    
    /* Elegant Custom Scrollbar */
    ::-webkit-scrollbar {
      width: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #111111;
    }
    ::-webkit-scrollbar-thumb {
      background: #D4AF37;
      border-radius: 10px;
    }
    
    /* Smooth Lightbox fade entries */
    .lightbox-show {
      display: flex !important;
      animation: fadeIn 0.3s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
</head>
<body class="bg-brandDark text-gray-200 font-sans antialiased overflow-x-hidden">

  <!-- Header / Navigation Bar -->
  <header class="fixed top-0 left-0 right-0 z-50 bg-[#111111]/80 backdrop-blur-xl border-b border-gray-800/50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-6 md:px-12 h-20 flex items-center justify-between">
      <!-- Logo Branding -->
      <a href="#" class="flex flex-col">
        <span class="font-serif text-xl md:text-2xl font-extrabold tracking-widest text-[#D4AF37]">LENS & LIGHT</span>
        <span class="text-[8px] font-semibold tracking-[0.45em] text-gray-400 uppercase -mt-0.5">STUDIOS</span>
      </a>

      <!-- Desktop Navigation Menu -->
      <nav class="hidden md:flex items-center gap-7 text-xs font-semibold tracking-widest uppercase">
        <a href="#home" class="hover:text-[#D4AF37] transition-colors duration-200">Home</a>
        <a href="#services" class="hover:text-[#D4AF37] transition-colors duration-200">Services</a>
        <a href="#portfolio" class="hover:text-[#D4AF37] transition-colors duration-200">Portfolio</a>
        <a href="#testimonials" class="hover:text-[#D4AF37] transition-colors duration-200">Testimonials</a>
        <a href="#billing" class="hover:text-[#D4AF37] text-[#D4AF37] transition-colors duration-200 font-bold">Billing & Print</a>
        <a href="#contact" class="hover:text-[#D4AF37] transition-colors duration-200">Contact</a>
      </nav>

      <!-- Reservation Call To Action -->
      <div class="hidden md:block">
        <a href="#contact" class="px-6 py-3 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111111] transition-all duration-300 text-xs font-bold tracking-widest uppercase rounded">
          Reserve Session
        </a>
      </div>

      <!-- Mobile Hamburger Button -->
      <button id="hamburger-btn" class="md:hidden text-gray-300 hover:text-[#D4AF37] outline-none">
        <svg class="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
        </svg>
      </button>
    </div>

    <!-- Mobile Drawer Context -->
    <div id="mobile-menu" class="hidden md:hidden bg-brandDark border-b border-gray-800 px-6 py-6 space-y-4 text-center text-sm font-semibold uppercase tracking-widest">
      <a href="#home" class="block py-2 text-gray-300 hover:text-[#D4AF37]" onclick="toggleMobileMenu()">Home</a>
      <a href="#services" class="block py-2 text-gray-300 hover:text-[#D4AF37]" onclick="toggleMobileMenu()">Services</a>
      <a href="#portfolio" class="block py-2 text-gray-300 hover:text-[#D4AF37]" onclick="toggleMobileMenu()">Portfolio</a>
      <a href="#testimonials" class="block py-2 text-gray-300 hover:text-[#D4AF37]" onclick="toggleMobileMenu()">Testimonials</a>
      <a href="#contact" class="block py-2 text-gray-300 hover:text-[#D4AF37]" onclick="toggleMobileMenu()">Contact</a>
      <a href="#contact" class="block py-3 bg-[#D4AF37] text-brandDark font-bold rounded" onclick="toggleMobileMenu()">Reserve Session</a>
    </div>
  </header>

  <!-- Hero Section -->
  <section id="home" class="min-h-screen relative flex items-center justify-center bg-black overflow-hidden pt-20">
    <!-- Immersive Cinematic Cover picture -->
    <div class="absolute inset-0 z-0">
      <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=70&w=2000" alt="Cinematic Hero BG" class="w-full h-full object-cover opacity-35 scale-105 duration-1000 transform">
      <div class="absolute inset-0 bg-gradient-to-b from-brandDark/40 via-brandDark/80 to-brandDark"></div>
    </div>

    <div class="relative z-10 max-w-5xl mx-auto px-6 text-center mt-12 md:mt-0">
      <span class="inline-block px-4 py-1 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] rounded-full mb-6 bg-[#D4AF37]/5">
        Elite Visual Production Studio
      </span>
      <h1 class="font-serif text-5xl md:text-7xl font-extrabold text-white leading-none tracking-tight mb-8">
        Capturing <span class="italic text-[#D4AF37] font-normal">Moments</span>,<br>
        Creating <span class="underline decoration-[#D4AF37]/40 underline-offset-8">Memories</span>.
      </h1>
      <p class="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed mb-10">
        We specialize in luxury weddings, narrative pre-wedding stories, and professional cinematic film grading. Translating fleeting interactions into pristine lifelong frames.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#portfolio" class="px-8 py-4 bg-[#D4AF37] text-brandDark font-bold tracking-widest text-xs uppercase hover:bg-white hover:text-black transition-all duration-300 rounded shadow-xl shadow-[#D4AF37]/10 hover:shadow-white/10">
          Explore Portfolio
        </a>
        <a href="#services" class="px-8 py-4 bg-transparent border border-gray-600 text-white font-bold tracking-widest text-xs uppercase hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-300 rounded">
          Our Services
        </a>
      </div>
    </div>

    <!-- Scroll Down Icon Indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500 hover:text-[#D4AF37] duration-300 transition-colors cursor-pointer">
      <span class="text-[9px] font-bold tracking-[0.3em] uppercase">Scroll Down</span>
      <svg class="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    </div>
  </section>

  <!-- Services Grid Section -->
  <section id="services" class="py-24 bg-brandDarker border-y border-gray-900">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.4em] block mb-3">PROFESSIONAL FIELDS</span>
        <h2 class="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Our Core Offerings</h2>
        <div class="w-16 h-1 bg-[#D4AF37] mx-auto mt-4 rounded"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <!-- Service Card 1 -->
        <div class="group bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/40 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
          <div>
            <div class="w-14 h-14 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-brandDark transition-all duration-300">
              <!-- Camera Icon -->
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Wedding Photoshoot</h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-6">The classic, timeless art of capturing your grand union. We frame authentic raw emotions, heritage rites, and royal memories.</p>
          </div>
          <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Heritage & Royalty →</span>
        </div>

        <!-- Service Card 2 -->
        <div class="group bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/40 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
          <div>
            <div class="w-14 h-14 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-brandDark transition-all duration-300">
              <!-- Couples/Heart Icon -->
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Pre-Wedding Shoot</h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-6">Romantic, candid, and meticulously styled thematic outings for couples. Expressing your narrative story at spectacular handpicked destinations.</p>
          </div>
          <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Cinematic Romance →</span>
        </div>

        <!-- Service Card 3 -->
        <div class="group bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/40 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
          <div>
            <div class="w-14 h-14 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-brandDark transition-all duration-300">
              <!-- Video Editing Icon -->
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Cinematic Video Editing</h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-6">Cinematographic storytelling, specialized lookup table adjustments (LUTs), pacing, and custom master sound editing suited for big screens.</p>
          </div>
          <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Editorial Grade →</span>
        </div>

        <!-- Service Card 4 -->
        <div class="group bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/40 hover:-translate-y-2 transition-all duration-500 flex flex-col justify-between">
          <div>
            <div class="w-14 h-14 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-brandDark transition-all duration-300">
              <!-- Reels icon -->
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-4">Reels Making</h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-6">High-engagement, social-media optimized short vertical formats synchronized with global audio trends to make your campaign viral.</p>
          </div>
          <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Viral Pacing →</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Portfolio Gallery Section with Interactive Lightbox -->
  <section id="portfolio" class="py-24 bg-brandDark">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <!-- Section Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.4em] block mb-3">CURATED PORTFOLIOS</span>
          <h2 class="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Our Masterpieces</h2>
        </div>
        <!-- Filtering buttons (Interactive in final HTML) -->
        <div class="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
          <button class="filter-btn px-5 py-2.5 bg-[#D4AF37] text-brandDark rounded active" data-category="all">All</button>
          <button class="filter-btn px-5 py-2.5 bg-brandDarker text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white rounded" data-category="wedding">Wedding</button>
          <button class="filter-btn px-5 py-2.5 bg-brandDarker text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white rounded" data-category="pre-wedding">Pre-Wedding</button>
          <button class="filter-btn px-5 py-2.5 bg-brandDarker text-gray-400 border border-gray-800 hover:border-gray-700 hover:text-white rounded" data-category="portrait">Portrait</button>
        </div>
      </div>

      <!-- Gallery Grid Structure -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" id="gallery-grid">
        <!-- Item 1 -->
        <div class="gallery-item group relative overflow-hidden rounded-xl bg-brandDarker border border-gray-800 cursor-pointer" data-category="wedding" onclick="openLightbox(0)">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200" alt="Eternal Vows wedding shoot" class="w-full h-full object-cover group-hover:scale-110 duration-700 transform transition-all">
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
            <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Wedding</span>
            <h4 class="text-lg font-bold text-white font-serif">Eternal Vows</h4>
            <p class="text-xs text-gray-400">Grand traditional reception capture in Udaipur, India.</p>
          </div>
        </div>

        <!-- Item 2 -->
        <div class="gallery-item group relative overflow-hidden rounded-xl bg-brandDarker border border-gray-800 cursor-pointer" data-category="pre-wedding" onclick="openLightbox(1)">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200" alt="Pre-Wedding beach shoot" class="w-full h-full object-cover group-hover:scale-110 duration-700 transform transition-all">
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
            <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Pre-Wedding</span>
            <h4 class="text-lg font-bold text-white font-serif">Golden Hour Embrace</h4>
            <p class="text-xs text-gray-400">Candid romance shoot during twilight on the Mumbai coastline.</p>
          </div>
        </div>

        <!-- Item 3 -->
        <div class="gallery-item group relative overflow-hidden rounded-xl bg-brandDarker border border-gray-800 cursor-pointer" data-category="portrait" onclick="openLightbox(2)">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200" alt="Fine Art Portrait" class="w-full h-full object-cover group-hover:scale-110 duration-700 transform transition-all">
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
            <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Portrait</span>
            <h4 class="text-lg font-bold text-white font-serif">A Cinematic Gaze</h4>
            <p class="text-xs text-gray-400">Fine-art editorial close-up experimenting with neon lighting.</p>
          </div>
        </div>

        <!-- Item 4 -->
        <div class="gallery-item group relative overflow-hidden rounded-xl bg-brandDarker border border-gray-800 cursor-pointer" data-category="pre-wedding" onclick="openLightbox(3)">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&q=80&w=1200" alt="Styled Hill Shoot" class="w-full h-full object-cover group-hover:scale-110 duration-700 transform transition-all">
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
            <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Pre-Wedding</span>
            <h4 class="text-lg font-bold text-white font-serif">Vintage Sunset Ridge</h4>
            <p class="text-xs text-gray-400">Styled couple walk across the scenic hills of Mahabaleshwar.</p>
          </div>
        </div>

        <!-- Item 5 -->
        <div class="gallery-item group relative overflow-hidden rounded-xl bg-brandDarker border border-gray-800 cursor-pointer" data-category="wedding" onclick="openLightbox(4)">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200" alt="Black White Gown portrait" class="w-full h-full object-cover group-hover:scale-110 duration-700 transform transition-all">
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
            <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Wedding</span>
            <h4 class="text-lg font-bold text-white font-serif">Unspoken Poetry</h4>
            <p class="text-xs text-gray-400">Black and white aesthetic veil portrait of the bride.</p>
          </div>
        </div>

        <!-- Item 6 -->
        <div class="gallery-item group relative overflow-hidden rounded-xl bg-brandDarker border border-gray-800 cursor-pointer" data-category="editorial" onclick="openLightbox(5)">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200" alt="Editorial Street Shoot" class="w-full h-full object-cover group-hover:scale-110 duration-700 transform transition-all">
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
            <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Editorial</span>
            <h4 class="text-lg font-bold text-white font-serif">Cosmopolitan Love</h4>
            <p class="text-xs text-gray-400">Modern chic street pre-wedding campaign in Pune city.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials Grid Section -->
  <section id="testimonials" class="py-24 bg-brandDarker border-t border-gray-900">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="text-center max-w-2xl mx-auto mb-16">
        <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.4em] block mb-3">CLIENT REVIEWS</span>
        <h2 class="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Stories of Love</h2>
        <div class="w-16 h-1 bg-[#D4AF37] mx-auto mt-4 rounded"></div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Review 1 -->
        <div class="bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/20 transition-all duration-300 flex flex-col justify-between">
          <p class="text-gray-400 italic leading-relaxed text-sm">"Working with Lens & Light Studios was absolutely effortless. They covered our Udaipur destination wedding and created frames look like cinematic screenshots. Every single shot is packed with emotional depth!"</p>
          <div class="flex items-center gap-4 mt-8 pt-6 border-t border-gray-800">
            <div class="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center font-bold text-[#D4AF37]">AD</div>
            <div>
              <p class="text-white font-serif font-bold">Amit & Priyanka</p>
              <p class="text-xs text-gray-500">Destination Wedding Couple</p>
            </div>
          </div>
        </div>

        <!-- Review 2 -->
        <div class="bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/20 transition-all duration-300 flex flex-col justify-between">
          <p class="text-gray-400 italic leading-relaxed text-sm">"The pre-wedding candid session in Mahabaleshwar was spectacular. We were extremely nervous, but their director made us laugh and look completely natural. The reels they generated topped 1M views in social circles!"</p>
          <div class="flex items-center gap-4 mt-8 pt-6 border-t border-gray-800">
            <div class="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center font-bold text-[#D4AF37]">SK</div>
            <div>
              <p class="text-white font-serif font-bold">Sarah & Kabir</p>
              <p class="text-xs text-gray-500">Pre-Wedding Candidates</p>
            </div>
          </div>
        </div>

        <!-- Review 3 -->
        <div class="bg-brandDark p-8 rounded-xl border border-gray-800 hover:border-[#D4AF37]/20 transition-all duration-300 flex flex-col justify-between">
          <p class="text-gray-400 italic leading-relaxed text-sm">"Their post-production cinematic video editing service is outstanding. Accurate color grading, professional background score integration, and meticulous storytelling. It literally gave us happy tears!"</p>
          <div class="flex items-center gap-4 mt-8 pt-6 border-t border-gray-800">
            <div class="w-11 h-11 bg-gray-700 rounded-full flex items-center justify-center font-bold text-[#D4AF37]">NL</div>
            <div>
              <p class="text-white font-serif font-bold">Nisha & Luke</p>
              <p class="text-xs text-gray-500">Cinematography Clients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Interactive Contact & Lead Form -->
  <section id="contact" class="py-24 bg-brandDark">
    <div class="max-w-4xl mx-auto px-6">
      <div class="text-center mb-12">
        <span class="text-xs font-bold text-[#D4AF37] uppercase tracking-[0.4em] block mb-3">GET IN TOUCH</span>
        <h2 class="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Let's Design Your Narrative</h2>
        <p class="text-gray-400 text-sm mt-4">Provide details about your big event. We will craft a bespoke proposal tailored in 24 hours.</p>
      </div>

      <div class="bg-brandDarker p-8 md:p-12 rounded-2xl border border-gray-800">
        <form id="lead-form" onsubmit="submitForm(event)">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label class="text-xs font-bold tracking-widest text-[#D4AF37] uppercase block mb-2">Your Name</label>
              <input type="text" id="form-name" required placeholder="Shubham Hingane" class="w-full bg-brandDark border border-gray-800 rounded px-4 py-3.5 text-sm focus:ring-1 focus:ring-gold outline-none transition-all text-white">
            </div>
            <div>
              <label class="text-xs font-bold tracking-widest text-[#D4AF37] uppercase block mb-2">Email Address</label>
              <input type="email" id="form-email" required placeholder="hello@shubhamhingane.in" class="w-full bg-brandDark border border-gray-800 rounded px-4 py-3.5 text-sm focus:ring-1 focus:ring-gold outline-none transition-all text-white">
            </div>
          </div>

          <div class="mb-6">
            <label class="text-xs font-bold tracking-widest text-[#D4AF37] uppercase block mb-2">Select Services</label>
            <select id="form-service" class="w-full bg-brandDark border border-gray-800 rounded px-4 py-3.5 text-sm focus:ring-1 focus:ring-gold outline-none transition-all text-white">
              <option value="wedding">Wedding Photoshoot Packages</option>
              <option value="pre-wedding">Candid Pre-Wedding Shoot</option>
              <option value="editing">Premium Cinematic Video Editing</option>
              <option value="reels">Viral Reels making sessions</option>
            </select>
          </div>

          <div class="mb-8">
            <label class="text-xs font-bold tracking-widest text-[#D4AF37] uppercase block mb-2">Provide Event Details</label>
            <textarea id="form-message" rows="4" placeholder="Mention dates, physical venue location states, and custom aesthetic edits you request..." class="w-full bg-brandDark border border-gray-800 rounded px-4 py-3.5 text-sm focus:ring-1 focus:ring-gold outline-none transition-all text-white"></textarea>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="w-full py-4 bg-[#D4AF37] hover:bg-white text-brandDark font-black uppercase tracking-widest text-xs rounded transition-all duration-300 shadow-2xl">
            Transmit Inquiry Code
          </button>
        </form>

        <!-- Feedback UI -->
        <div id="booking-success" class="hidden mt-6 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37] rounded text-center">
          <p class="font-bold uppercase tracking-widest text-xs mb-1">Inquiry Code Authenticated!</p>
          <p class="text-xs text-gray-300">We have secured your proposal details. Our creative director will call you shortly.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Studio Billing Desk & Print Station -->
  <section id="billing" class="py-24 bg-brandDarker border-t border-gray-900">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 pb-6 border-b border-gray-900">
        <div>
          <span class="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.3em] block mb-1">STUDIO DESK SYSTEM</span>
          <h2 class="font-serif text-3xl md:text-4xl font-black text-white">Client Billing & Print Station</h2>
          <p class="text-xs text-gray-400 mt-1">Generate itemized client invoices, calculate GST & advance token amounts, and print luxury A4 invoices.</p>
        </div>
        <div>
          <a href="#contact" class="px-5 py-2.5 bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-wider text-xs rounded transition-all inline-block">
            Book Frame Slot
          </a>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-6 bg-brandDark border border-gray-900 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <span class="text-xs font-mono text-[#D4AF37] font-bold">LLS-2026-081</span>
              <span class="px-2 py-0.5 bg-amber-950 text-amber-300 text-[9px] font-black uppercase rounded">Advance Paid</span>
            </div>
            <h4 class="font-serif text-lg font-bold text-white mt-2">Amit & Priyanka Sharma</h4>
            <p class="text-xs text-gray-400 mt-1">Heritage 2-Day Wedding Shoot • Udaipur</p>
            <div class="mt-4 pt-3 border-t border-gray-900 flex justify-between text-xs">
              <span class="text-gray-500">Total: ₹2,92,640</span>
              <span class="text-amber-400 font-bold">Due: ₹1,42,640</span>
            </div>
          </div>
          <button onclick="window.print()" class="mt-4 w-full py-2.5 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer">
            Print Invoice
          </button>
        </div>

        <div class="p-6 bg-brandDark border border-gray-900 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <span class="text-xs font-mono text-[#D4AF37] font-bold">LLS-2026-082</span>
              <span class="px-2 py-0.5 bg-emerald-950 text-emerald-300 text-[9px] font-black uppercase rounded">Paid In Full</span>
            </div>
            <h4 class="font-serif text-lg font-bold text-white mt-2">Sarah Mehta & Kabir Sen</h4>
            <p class="text-xs text-gray-400 mt-1">Pre-Wedding Story Film • Mahabaleshwar</p>
            <div class="mt-4 pt-3 border-t border-gray-900 flex justify-between text-xs">
              <span class="text-gray-500">Total: ₹84,075</span>
              <span class="text-emerald-400 font-bold">Settled</span>
            </div>
          </div>
          <button onclick="window.print()" class="mt-4 w-full py-2.5 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer">
            Print Invoice
          </button>
        </div>

        <div class="p-6 bg-brandDark border border-gray-900 rounded-2xl flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start">
              <span class="text-xs font-mono text-[#D4AF37] font-bold">LLS-2026-083</span>
              <span class="px-2 py-0.5 bg-rose-950 text-rose-300 text-[9px] font-black uppercase rounded">Pending Due</span>
            </div>
            <h4 class="font-serif text-lg font-bold text-white mt-2">Nisha & Luke Coutinho</h4>
            <p class="text-xs text-gray-400 mt-1">Autumn Editorial & Teaser • Pune</p>
            <div class="mt-4 pt-3 border-t border-gray-900 flex justify-between text-xs">
              <span class="text-gray-500">Total: ₹88,500</span>
              <span class="text-rose-400 font-bold">Due: ₹88,500</span>
            </div>
          </div>
          <button onclick="window.print()" class="mt-4 w-full py-2.5 bg-[#D4AF37] hover:bg-white text-black text-xs font-black uppercase tracking-wider rounded transition-all cursor-pointer">
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer Layout -->
  <footer class="bg-brandDarker border-t border-gray-900 py-12 text-center text-xs text-gray-500">
    <div class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex flex-col items-center md:items-start text-center md:text-left">
        <p class="font-serif font-black text-white text-sm tracking-wider">LENS & LIGHT STUDIOS</p>
        <p class="text-[10px] mt-1 text-gray-400">Capturing Moments, Creating Memories.</p>
      </div>
      <div>
        <p class="tracking-widest uppercase">&copy; 2026 Lens & Light Studios. All Rights Reserved.</p>
      </div>
    </div>
  </footer>

  <!-- Lightbox Modal Overlay -->
  <div id="lightbox" class="hidden fixed inset-0 z-[100] bg-black/95 items-center justify-center p-4">
    <!-- Close Button -->
    <button onclick="closeLightbox()" class="absolute top-6 right-6 text-gray-400 hover:text-white transition-all text-sm font-bold tracking-widest uppercase flex items-center gap-1 bg-brandDark border border-gray-800 rounded px-3 py-1">
      Close &times;
    </button>

    <!-- Carousel Nav -->
    <button onclick="changePhotoSlide(-1)" class="absolute left-6 text-gray-400 hover:text-[#D4AF37] bg-brandDark/50 border border-gray-800 text-lg w-12 h-12 flex items-center justify-center rounded-full transition-all">
      &larr;
    </button>
    <button onclick="changePhotoSlide(1)" class="absolute right-6 text-gray-400 hover:text-[#D4AF37] bg-brandDark/50 border border-gray-800 text-lg w-12 h-12 flex items-center justify-center rounded-full transition-all">
      &rarr;
    </button>

    <!-- Content Card -->
    <div class="max-w-4xl max-h-[85vh] flex flex-col items-center">
      <div class="relative rounded-lg overflow-hidden border border-gray-800/80 max-h-[70vh] bg-neutral-900">
        <img id="lightbox-img" src="" alt="Lightbox image" class="max-w-full max-h-[70vh] object-contain">
      </div>
      <div class="text-center mt-4">
        <span id="lightbox-category" class="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest"></span>
        <h4 id="lightbox-title" class="text-xl font-bold font-serif text-white mt-1"></h4>
        <p id="lightbox-desc" class="text-xs text-gray-400 mt-1"></p>
      </div>
    </div>
  </div>

  <!-- JavaScript Behavior Drivers -->
  <script>
    // Shared Gallery metadata
    const itemsData = [
      {
        title: 'Eternal Vows',
        category: 'Wedding',
        desc: 'Grand traditional reception capture in Udaipur, India.',
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200'
      },
      {
        title: 'Golden Hour Embrace',
        category: 'Pre-Wedding',
        desc: 'Candid romance shoot during twilight on the Mumbai coastline.',
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=1200'
      },
      {
        title: 'A Cinematic Gaze',
        category: 'Portrait',
        desc: 'Fine-art editorial close-up experimenting with neon lighting.',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'
      },
      {
        title: 'Vintage Sunset Ridge',
        category: 'Pre-Wedding',
        desc: 'Styled couple walk across the scenic hills of Mahabaleshwar.',
        url: 'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?auto=format&fit=crop&q=80&w=1200'
      },
      {
        title: 'Unspoken Poetry',
        category: 'Wedding',
        desc: 'Black and white aesthetic veil portrait of the bride.',
        url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200'
      },
      {
        title: 'Cosmopolitan Love',
        category: 'Editorial',
        desc: 'Modern chic street pre-wedding campaign in Pune city.',
        url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200'
      }
    ];

    let currentActiveIdx = 0;

    // Mobile Hamburger Toggle
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
      hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    function toggleMobileMenu() {
      if (mobileMenu) {
        mobileMenu.classList.add('hidden');
      }
    }

    // Interactive Category Filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle style active
        filterBtns.forEach(b => {
          b.classList.remove('bg-[#D4AF37]', 'text-brandDark');
          b.classList.add('bg-brandDarker', 'text-gray-400', 'border', 'border-gray-800');
        });
        btn.classList.add('bg-[#D4AF37]', 'text-brandDark');
        btn.classList.remove('bg-brandDarker', 'text-gray-400', 'border', 'border-gray-800');

        const filterCategory = btn.getAttribute('data-category');
        galleryItems.forEach(item => {
          const itemCategory = item.getAttribute('data-category');
          if (filterCategory === 'all' || itemCategory === filterCategory) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });

    // Lightbox Interactions
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCategory = document.getElementById('lightbox-category');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxDesc = document.getElementById('lightbox-desc');

    function openLightbox(index) {
      currentActiveIdx = index;
      const data = itemsData[index];
      if (lightbox && lightboxImg && data) {
        lightboxImg.src = data.url;
        if (lightboxCategory) lightboxCategory.innerText = data.category;
        if (lightboxTitle) lightboxTitle.innerText = data.title;
        if (lightboxDesc) lightboxDesc.innerText = data.desc;
        
        lightbox.classList.remove('hidden');
        lightbox.classList.add('lightbox-show');
      }
    }

    function closeLightbox() {
      if (lightbox) {
        lightbox.classList.add('hidden');
        lightbox.classList.remove('lightbox-show');
      }
    }

    function changePhotoSlide(offset) {
      currentActiveIdx = (currentActiveIdx + offset + itemsData.length) % itemsData.length;
      const data = itemsData[currentActiveIdx];
      if (lightboxImg && data) {
        lightboxImg.src = data.url;
        if (lightboxCategory) lightboxCategory.innerText = data.category;
        if (lightboxTitle) lightboxTitle.innerText = data.title;
        if (lightboxDesc) lightboxDesc.innerText = data.desc;
      }
    }

    // Submit Lead Information
    function submitForm(e) {
      e.preventDefault();
      const successToast = document.getElementById('booking-success');
      if (successToast) {
        successToast.classList.remove('hidden');
        document.getElementById('lead-form').reset();
        setTimeout(() => {
          successToast.classList.add('hidden');
        }, 8000);
      }
    }

    // Close on pressing Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  </script>
</body>
</html>`;

  // Code copy to clipboard UI helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(rawHtmlCode);
    setCopiedCode(true);
    setTimeout(() => {
      setCopiedCode(false);
    }, 3000);
  };

  // Compile and trigger file download of the HTML code
  const handleDownloadCode = () => {
    const blob = new Blob([rawHtmlCode], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'lens_and_light_studios_portfolio.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      style={{
        backgroundColor: palette.canvasBg,
        color: palette.textPrimary
      }}
      className="min-h-screen relative font-sans overflow-x-hidden transition-colors duration-400"
    >
      
      {/* Subtle Darkroom Atmosphere Illumination */}
      <div 
        style={{
          background: `radial-gradient(circle, ${palette.accentGlow} 0%, transparent 70%)`
        }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[140px] pointer-events-none" 
      />

      {/* Atelier Header */}
      <AtelierHeader scrollToSection={scrollToSection} />

      {/* Main Content Showcase */}
      <main>
        {/* Cinematic Hero Segment */}
        <AtelierHero scrollToSection={scrollToSection} />

        {/* Curated Offerings / Disciplines */}
        <AtelierOfferings />

        {/* Camera & Color Grading Viewfinder Simulator */}
        <AtelierSimulator />

        {/* Archival Masterwork Gallery */}
        <AtelierGallery photos={PORTFOLIO_PHOTOS} getPhotoExif={getPhotoExif} />

        {/* Patron Reviews / Client Stories */}
        <AtelierTestimonials />

        {/* Lead Reservation / Commission Inquiries */}
        <AtelierCommission scrollToSection={scrollToSection} />

        {/* Studio Invoicing & Client Billing Station Section */}
        <section 
          id="billing" 
          style={{
            backgroundColor: palette.sectionAltBg,
            borderColor: palette.borderSubtle
          }}
          className="py-28 border-t relative transition-colors duration-400"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <PhotographyBillingDesk />
          </div>
        </section>
      </main>

      {/* Atelier Archival Footer with Developer Resources */}
      <AtelierFooter
        scrollToSection={scrollToSection}
        handleDownloadCode={handleDownloadCode}
        handleCopyCode={handleCopyCode}
        copiedCode={copiedCode}
        setShowHostingGuide={setShowHostingGuide}
      />

      {/* Modern, Editorial Guide Modal for custom domain hosting */}
      <AnimatePresence>
        {showHostingGuide && (
          <motion.div 
            id="hosting-guide-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHostingGuide(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#161616] border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900 to-[#111111] p-6 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 rounded-2xl text-white">
                    <Globe size={22} className="animate-spin-slow" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white tracking-wide">Live Web Hosting & Domain Setup</h3>
                    <p className="text-xs text-gray-400">Launch "Lens & Light Studios" on your own domain in under 5 minutes.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowHostingGuide(false)}
                  className="p-1.5 bg-gray-900/80 hover:bg-red-500 hover:text-white text-gray-400 rounded-full transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-sm leading-relaxed text-gray-300">
                <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex gap-3 text-xs">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-white">Pure Client-Side Architecture:</strong> This photography SPA compiles into a self-contained <code className="text-yellow-400 font-mono px-1 py-0.5 rounded bg-black">index.html</code> code bundle featuring responsive grid sliders, local search models, lightbox zooms, and visual layouts. There are no backend database servers required to build or host it!
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-xs">Step 1: Download & Rename Code</h4>
                  <div className="pl-4 border-l-2 border-[#D4AF37] text-xs space-y-2">
                    <p>1. Click the <strong className="text-white font-bold inline-flex items-center gap-1"><Download size={10} /> Download SPA</strong> button in the developer resources hub in the footer.</p>
                    <p>2. Locate the saved file: <code className="font-mono text-gray-400 bg-black/60 px-1.5 py-0.5 rounded">lens_and_light_studios_portfolio.html</code></p>
                    <p>3. Rename it to exactly <strong className="text-white font-mono bg-black/60 px-1.5 py-0.5 rounded">index.html</strong>. This forces servers to recognize it as the main home page.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-xs">Step 2: Upload to Free Hosting</h4>
                  <p className="text-xs">Choose any platform below to instantly launch your custom portfolio live:</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Netlify */}
                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400" />
                        <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Option A: Netlify Drop (Easiest)</h5>
                      </div>
                      <ol className="text-[11px] text-gray-400 list-decimal pl-4 space-y-1.5">
                        <li>Create a new directory on your computer and place your <code className="font-mono text-gray-200">index.html</code> inside it.</li>
                        <li>Open <a href="https://app.netlify.com/drop" target="_blank" rel="noopener" className="text-blue-400 underline">app.netlify.com/drop</a> in a browser.</li>
                        <li>Drag and drop your folder into the box. Your site is instantly hosted live with a free SSL site link (e.g. <code className="font-mono text-yellow-400">site-name.netlify.app</code>)!</li>
                      </ol>
                    </div>

                    {/* GitHub Pages */}
                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                        <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Option B: GitHub Pages (Free)</h5>
                      </div>
                      <ol className="text-[11px] text-gray-400 list-decimal pl-4 space-y-1.5">
                        <li>Create a free account on <a href="https://github.com" target="_blank" rel="noopener" className="text-blue-400 underline">github.com</a>.</li>
                        <li>Create a public repository named: <code className="font-mono text-[#D4AF37]">photography-portfolio</code>.</li>
                        <li>Upload your renamed <code className="font-mono text-gray-200">index.html</code> file.</li>
                        <li>Navigate to repo <strong className="text-slate-300">Settings &gt; Pages</strong>, set source branch to <code className="font-mono bg-black px-1.5 rounded text-gray-400">main / root</code>, and tap save!</li>
                      </ol>
                    </div>

                    {/* Vercel */}
                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Option C: Vercel Static Deploy</h5>
                      </div>
                      <ol className="text-[11px] text-gray-400 list-decimal pl-4 space-y-1.5">
                        <li>Go to <a href="https://vercel.com" target="_blank" rel="noopener" className="text-blue-400 underline">vercel.com</a> and sign up for a free Hobby plan.</li>
                        <li>Connect your GitHub account or upload your project files directly.</li>
                        <li>Vercel autodetects static files and deploys them to a superfast CDN.</li>
                      </ol>
                    </div>

                    {/* cPanel / Traditional Host */}
                    <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <h5 className="font-bold text-white uppercase text-[11px] tracking-wider">Option D: cPanel (GoDaddy/Hostinger)</h5>
                      </div>
                      <ol className="text-[11px] text-gray-400 list-decimal pl-4 space-y-1.5">
                        <li>Log in to your hosting provider's cPanel or file manager directory.</li>
                        <li>Open the directory: <code className="font-mono text-[#D4AF37]">public_html</code> (or root directory).</li>
                        <li>Upload your <code className="font-mono text-gray-200">index.html</code> directly into the folder.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-[#D4AF37] uppercase tracking-wider text-xs">Step 3: Point Domain to Your New Live Site</h4>
                  <div className="p-4 bg-gray-900/30 rounded-2xl border border-gray-800 text-xs text-gray-400 space-y-3">
                    <p>To access this design under your own domain (e.g. <strong className="text-white">www.yourbrand.com</strong> instead of a local file path or staging URL):</p>
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li>Purchase a domain from standard registrars (GoDaddy, Namecheap, Google Domains).</li>
                      <li>In your hosting dashboard (Netlify/Vercel/cPanel), search for <strong className="text-white">"Set Up Custom Domain"</strong> and type your domain identity.</li>
                      <li>Update your registrar's <strong className="text-slate-200">Domain DNS Settings</strong> as shown by your host:
                        <ul className="list-disc pl-4 mt-1 font-mono text-yellow-500">
                          <li>Create an <strong className="text-white">A Record</strong> pointing to the host's Server IP (for non-www bare domain)</li>
                          <li>Create a <strong className="text-white">CNAME Record</strong> pointing to your host's address (for www domain)</li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-black/80 border-t border-gray-800 flex justify-between items-center flex-wrap gap-4">
                <p className="text-[10px] text-gray-500 font-medium max-w-sm">After deployment, you can update the Demo URL in your Portfolio Admin panel to point directly to your live custom domain!</p>
                <button 
                  onClick={() => setShowHostingGuide(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                >
                  Got It, Thanks!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PhotographyPortfolio() {
  return (
    <AtelierThemeProvider>
      <PhotographyPortfolioContent />
    </AtelierThemeProvider>
  );
}
