import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Download,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  BookOpen,
  CreditCard,
  Globe,
  Info
} from 'lucide-react';

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

export function PhotographyPortfolio() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'all' | 'wedding' | 'pre-wedding' | 'portrait' | 'editorial'>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  
  // Custom interactive booking states
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingService, setBookingService] = useState('wedding');
  const [bookingMessage, setBookingMessage] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showHostingGuide, setShowHostingGuide] = useState(false);

  // Camera Simulator States
  const [simAperture, setSimAperture] = useState<'f/1.2' | 'f/2.8' | 'f/5.6' | 'f/11'>('f/1.2');
  const [simLut, setSimLut] = useState<'raw' | 'imperial-gold' | 'neon-cyber' | 'classic-mono' | 'emerald-teal'>('raw');
  const [simGrain, setSimGrain] = useState<boolean>(true);
  const [simFocalLength, setSimFocalLength] = useState<'24mm' | '50mm' | '85mm' | '135mm'>('85mm');
  const [simLightingMode, setSimLightingMode] = useState<'natural' | 'golden' | 'neon-rim'>('natural');

  // Filter photos
  const filteredPhotos = PORTFOLIO_PHOTOS.filter(photo => {
    if (activeFilter === 'all') return true;
    return photo.category === activeFilter;
  });

  // Carousel controls for Lightbox
  const handleNextPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex + 1) % filteredPhotos.length);
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((selectedPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
  };

  // Submit mock booking lead
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail) return;
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      setBookingName('');
      setBookingEmail('');
      setBookingMessage('');
    }, 5000);
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
      <nav class="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest uppercase">
        <a href="#home" class="hover:text-[#D4AF37] transition-colors duration-200">Home</a>
        <a href="#services" class="hover:text-[#D4AF37] transition-colors duration-200">Services</a>
        <a href="#portfolio" class="hover:text-[#D4AF37] transition-colors duration-200">Portfolio</a>
        <a href="#testimonials" class="hover:text-[#D4AF37] transition-colors duration-200">Testimonials</a>
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
    <div className="bg-[#0D0D0D] text-gray-200 min-h-screen relative font-sans overflow-x-hidden selection:bg-[#D4AF37] selection:text-black">
      
      {/* Absolute Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[200vh] right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Header Area */}
      <header className="sticky top-0 left-0 right-0 z-40 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-gray-900 h-20 transition-all">
        <div className="max-w-7xl mx-auto px-6 md:px-12 h-full flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-serif text-xl md:text-2xl font-black tracking-[0.2em] text-[#D4AF37] leading-none">LENS & LIGHT</span>
            <span className="text-[7.5px] font-black tracking-[0.55em] text-gray-500 uppercase mt-1">STUDIOS</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-[0.25em] uppercase text-gray-400">
            <a href="#welcome" className="hover:text-[#D4AF37] transition-all hover:scale-105 duration-200">Home</a>
            <a href="#offerings" className="hover:text-[#D4AF37] transition-all hover:scale-105 duration-200">Offerings</a>
            <a href="#simulator" className="hover:text-[#D4AF37] transition-all hover:scale-105 duration-200">Simulator</a>
            <a href="#visuals" className="hover:text-[#D4AF37] transition-all hover:scale-105 duration-200">Curated Works</a>
            <a href="#testimonials" className="hover:text-[#D4AF37] transition-all hover:scale-105 duration-200">Reviews</a>
            <a href="#reserve" className="hover:text-[#D4AF37] transition-all hover:scale-105 duration-200">Reserve</a>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              id="header-create-id"
              onClick={() => navigate('/live/select-template')}
              className="px-4 py-2 border-2 border-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black transition-all rounded text-[9.5px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#D4AF37]/10"
            >
              <CreditCard size={12} />
              <span>Create ID</span>
            </button>
            <a href="#reserve" className="hidden sm:block px-5 py-2.5 bg-transparent border border-gray-800 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all rounded text-[9.5px] font-black uppercase tracking-widest">
              Book Frame Slot
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Showcase */}
      <main>
        {/* Cinematic Hero Segment */}
        <section id="welcome" className="relative min-h-[95vh] flex items-center justify-center bg-[#070707] overflow-hidden pt-12 border-b border-gray-900/60">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black/60 z-10" />
            <img 
              referrerPolicy="no-referrer"
              src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2000" 
              alt="Cinematic Portrait Cover" 
              className="w-full h-full object-cover opacity-60 scale-105 animate-pulse-slow"
              style={{ animationDuration: '12s' }}
            />
            {/* Elegant overlay gradient to lock into deep background colors */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-black/80 z-20" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0D0D0D]/90 via-transparent to-[#0D0D0D]/90 z-20" />
          </div>

          <div className="relative z-30 max-w-5xl mx-auto px-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] font-black uppercase tracking-[0.3em] rounded-full mb-8 bg-[#D4AF37]/5 backdrop-blur-md"
            >
              <Star size={10} className="fill-[#D4AF37]" />
              <span>Elite Visual Production House</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="font-serif text-5xl md:text-8xl font-black text-white leading-[1.05] tracking-tight mb-8"
            >
              Capturing <span className="italic text-[#D4AF37] font-normal font-sans tracking-wide">Moments</span>,<br />
              Creating <span className="underline decoration-[#D4AF37]/30 underline-offset-[16px]">Memories</span>.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-12 font-light"
            >
              Niche editorial and cinematographic production. We blend state-of-the-art grading science, natural light structures, and luxury scenery to lock your stories into timeless, bespoke visual pieces.
            </motion.p>

            {/* Quick Stats Banner to enrich credibility */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-3 max-w-xl mx-auto gap-4 p-4 border border-gray-900 rounded-2xl bg-black/40 backdrop-blur-md mb-12 divide-x divide-gray-800/85"
            >
              <div>
                <div className="font-serif text-xl font-bold text-[#D4AF37]">120+</div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Masterclass Weddings</div>
              </div>
              <div>
                <div className="font-serif text-xl font-bold text-[#D4AF37]">15+</div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Global Shoot Awards</div>
              </div>
              <div>
                <div className="font-serif text-xl font-bold text-[#D4AF37]">4.9★</div>
                <div className="text-[8px] text-gray-500 uppercase tracking-widest mt-1">Client Reviews Rating</div>
              </div>
            </motion.div>
 
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a href="#visuals" className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 rounded shadow-xl hover:shadow-[#D4AF37]/20 text-center hover:-translate-y-0.5">
                Explore Portfolios
              </a>
              <a href="#offerings" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-gray-800 hover:border-[#D4AF37] hover:text-[#D4AF37] text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 rounded text-center">
                Our Services
              </a>
              <button 
                id="photography-create-id"
                onClick={() => navigate('/live/select-template')}
                className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111111] font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-300 rounded flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-[#D4AF37]/5 hover:shadow-[#D4AF37]/20 text-center hover:-translate-y-0.5"
              >
                <CreditCard size={14} className="animate-pulse" />
                <span>Create ID</span>
              </button>
            </motion.div>
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-gray-500 text-[10px] tracking-[0.3em] font-bold uppercase animate-bounce">
            Scroll To Discover &darr;
          </div>
        </section>

        {/* Dynamic Services Grid */}
        <section id="offerings" className="py-28 bg-[#0D0D0D] border-b border-gray-950">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block mb-3">EDITORIAL COMPOSITION</span>
              <h2 className="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Services & Professional Niches</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4 rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Product 1 */}
              <div className="group bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent pointer-events-none rounded-tr-2xl" />
                <div>
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                    <Camera size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">Wedding Photoshoot</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">Traditional and contemporary photo coverage. We secure every micro-emotion, candid laughter, and grand ceremony detail with full lighting arrays.</p>
                </div>
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
                  Heritage Packages <ArrowRight size={10} />
                </span>
              </div>

              {/* Product 2 */}
              <div className="group bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent pointer-events-none rounded-tr-2xl" />
                <div>
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                    <Heart size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">Pre-Wedding Shoot</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">Romantic outings customized to represent your personal timeline. Beautiful outdoor setups capturing couple bonds elegantly and comfortably.</p>
                </div>
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
                  Narrative Frames <ArrowRight size={10} />
                </span>
              </div>

              {/* Product 3 */}
              <div className="group bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent pointer-events-none rounded-tr-2xl" />
                <div>
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                    <Film size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">Cinematic Editing</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">Post-production edit processes emphasizing cinematic lookup table adjustments (LUTs), audio score matching, pace, and sound design.</p>
                </div>
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
                  LUTs & Grading <ArrowRight size={10} />
                </span>
              </div>

              {/* Product 4 */}
              <div className="group bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#D4AF37]/5 to-transparent pointer-events-none rounded-tr-2xl" />
                <div>
                  <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:bg-[#D4AF37] group-hover:text-black transition-all duration-300">
                    <Smartphone size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">Reels Making</h3>
                  <p className="text-gray-400 text-xs leading-relaxed mb-6 font-light">Vertical structured short videos styled around modern musical scores to boost high-impact social footprint organically with crisp focus cuts.</p>
                </div>
                <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest flex items-center gap-1.5 group-hover:gap-3 transition-all duration-300">
                  Viral Sessions <ArrowRight size={10} />
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE APERTURE & LUT COLOR GRADING SIMULATOR */}
        <section id="simulator" className="py-24 bg-black border-b border-gray-950 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.40em] block mb-3">EXPERIENCE CAMERA PHYSICS</span>
              <h2 className="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Interactive Grading & Lens Simulator</h2>
              <p className="text-gray-400 text-xs mt-4 max-w-lg mx-auto">Interact with our real-time focal depth, cinematic lookup tables (LUTs), and lighting filters below to simulate high-end studio outputs live.</p>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4 rounded"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch bg-[#111111] rounded-3xl border border-gray-900 p-6 md:p-10 shadow-2xl relative">
              
              {/* Simulator Preview Column - 7/12 */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                
                {/* Simulated Viewer Screen */}
                <div className="relative rounded-2xl overflow-hidden border border-gray-800 bg-[#070707] aspect-[4/3] flex items-center justify-center">
                  
                  {/* Dynamic Scenery Background Blur (Simulating Aperture Depth) */}
                  <img 
                    referrerPolicy="no-referrer"
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=70&w=800"
                    alt="Scenery Background for depth"
                    className="absolute inset-0 w-full h-full object-cover opacity-45 transition-all duration-500"
                    style={{
                      filter: `blur(${
                        simAperture === 'f/1.2' ? '12px' : 
                        simAperture === 'f/2.8' ? '6px' : 
                        simAperture === 'f/5.6' ? '2.5px' : '0px'
                      })`
                    }}
                  />

                  {/* Dynamic Sharp Subject Layer in Focus */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
                    <motion.div
                      animate={{
                        scale: 
                          simFocalLength === '24mm' ? 0.82 : 
                          simFocalLength === '50mm' ? 0.95 : 
                          simFocalLength === '85mm' ? 1.08 : 1.25
                      }}
                      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                      className="w-full h-full max-w-sm overflow-hidden rounded-xl shadow-2xl border border-white/5 relative bg-zinc-900"
                    >
                      <img 
                        referrerPolicy="no-referrer"
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800"
                        alt="Subject model"
                        className="w-full h-full object-cover transition-all duration-500"
                        style={{
                          filter: 
                            simLut === 'raw' ? 'none' :
                            simLut === 'imperial-gold' ? 'sepia(0.3) saturate(1.4) contrast(1.1) brightness(0.95)' :
                            simLut === 'neon-cyber' ? 'hue-rotate(240deg) saturate(1.8) contrast(1.2)' :
                            simLut === 'classic-mono' ? 'grayscale(1) contrast(1.3) brightness(1.05)' :
                            'hue-rotate(150deg) saturate(1.3) contrast(1.1)' // emerald-teal
                        }}
                      />

                      {/* Overlays (Lighting) */}
                      {simLightingMode === 'golden' && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 via-transparent to-amber-700/30 mix-blend-color-burn pointer-events-none" />
                      )}
                      {simLightingMode === 'neon-rim' && (
                        <div className="absolute inset-0 bg-gradient-to-l from-pink-500/15 via-transparent to-blue-500/15 mix-blend-screen pointer-events-none border-r-4 border-l-4 border-pink-500/35" />
                      )}

                      {/* Interactive Grain Effect overlay */}
                      {simGrain && (
                        <div 
                          className="absolute inset-0 opacity-[0.06] bg-repeat pointer-events-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                          }}
                        />
                      )}
                    </motion.div>
                  </div>

                  {/* Interactive Target Reticle lines overlay */}
                  <div className="absolute inset-4 border border-white/5 pointer-events-none rounded-xl flex items-center justify-center">
                    <div className="w-10 h-10 border border-dashed border-white/10 pointer-events-none rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
                    </div>
                  </div>

                  {/* Bottom Stats strip of Camera */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg text-[9px] font-mono text-gray-400 flex justify-between z-20 border border-white/5">
                    <span className="text-[#D4AF37]">● SIMULATED LIVE</span>
                    <span>LENS: {simFocalLength} FOCAL</span>
                    <span>APERTURE: {simAperture}</span>
                    <span>LUT: {simLut.toUpperCase()}</span>
                  </div>
                </div>

                <div className="p-4 bg-black/40 border border-gray-900 rounded-xl text-[11px] text-gray-400 flex items-center gap-3">
                  <Camera size={18} className="text-[#D4AF37] shrink-0" />
                  <p>
                    <strong className="text-white">Explanation:</strong> Sliders adjust simulated camera properties dynamically via Web CSS Matrix calculations. Notice how <code className="text-yellow-400 bg-black/60 px-1 py-0.5 rounded">f/1.2</code> delivers gorgeous creamy visual focus bokeh, whereas <code className="text-yellow-400 bg-black/60 px-1 py-0.5 rounded">135mm</code> crops standard visual fields to telephoto portrait ratios.
                  </p>
                </div>
              </div>

              {/* Simulator Controls Column - 5/12 */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                
                {/* Lens / Aperture controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <span className="text-xs text-[#D4AF37] font-black uppercase tracking-wider">Aperture (F-Stop)</span>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">(Controls Depth of Field)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['f/1.2', 'f/2.8', 'f/5.6', 'f/11'] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => setSimAperture(option)}
                        className={`py-3 rounded-lg text-xs font-black transition-all ${
                          simAperture === option 
                            ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15' 
                            : 'bg-black/60 text-gray-400 border border-gray-800/85 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-gray-500 leading-normal">
                    Lower f-stop values allow more light into the lens, creating a shallower depth of field (blurry background vs sharp model).
                  </p>
                </div>

                {/* Focal Zoom controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <span className="text-xs text-[#D4AF37] font-black uppercase tracking-wider">Focal Length (Zoom)</span>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">(Controls Compression)</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(['24mm', '50mm', '85mm', '135mm'] as const).map(option => (
                      <button
                        key={option}
                        onClick={() => setSimFocalLength(option)}
                        className={`py-3 rounded-lg text-xs font-black transition-all ${
                          simFocalLength === option 
                            ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/15' 
                            : 'bg-black/60 text-gray-400 border border-gray-800/85 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10.5px] text-gray-500 leading-normal">
                    24mm provides wide coverage, 85mm behaves as the gold premium standard portrait focal compression, and 135mm narrows frame fields down.
                  </p>
                </div>

                {/* Color grading LUT profiles */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <span className="text-xs text-[#D4AF37] font-black uppercase tracking-wider">Cinematic LUT Color Profile</span>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest">(Grading Options)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'raw', name: 'Raw Natural Cine' },
                      { key: 'imperial-gold', name: 'Imperial Gold LUT' },
                      { key: 'neon-cyber', name: 'Cyber Neon Profile' },
                      { key: 'classic-mono', name: 'Classic Monochrome' },
                    ].map(lut => (
                      <button
                        align-target="lut-btn"
                        key={lut.key}
                        onClick={() => setSimLut(lut.key as any)}
                        className={`p-3 rounded-xl text-left transition-all flex flex-col justify-between h-[64px] border ${
                          simLut === lut.key 
                            ? 'bg-[#D4AF37]/10 text-white border-[#D4AF37]' 
                            : 'bg-black/40 text-gray-400 border-gray-800/80 hover:border-gray-700 hover:text-white'
                        }`}
                      >
                        <span className="text-[11px] font-bold block">{lut.name}</span>
                        <span className="text-[8px] text-gray-500 uppercase font-black">Applied profile</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ambient Lighting Accents */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-gray-800 pb-2">
                    <span className="text-xs text-[#D4AF37] font-black uppercase tracking-wider">Golden/Rim Light Accents</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSimLightingMode('natural')}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg border ${simLightingMode === 'natural' ? 'bg-[#D4AF37]/10 text-white border-[#D4AF37]' : 'bg-black/40 text-gray-400 border-gray-800'}`}
                      >
                        Natural Ambient
                      </button>
                      <button 
                        onClick={() => setSimLightingMode('golden')}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg border ${simLightingMode === 'golden' ? 'bg-[#D4AF37]/10 text-white border-[#D4AF37]' : 'bg-black/40 text-gray-400 border-gray-800'}`}
                      >
                        Sunset Backlight
                      </button>
                      <button 
                        onClick={() => setSimLightingMode('neon-rim')}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg border ${simLightingMode === 'neon-rim' ? 'bg-[#D4AF37]/10 text-white border-[#D4AF37]' : 'bg-black/40 text-gray-400 border-gray-800'}`}
                      >
                        Neon Cyber Rim
                      </button>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={simGrain}
                        onChange={() => setSimGrain(!simGrain)}
                        className="rounded border-gray-800 text-[#D4AF37] focus:ring-[#D4AF37] bg-black"
                      />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Simulate Grain</span>
                    </label>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Curated Works Gallery */}
        <section id="visuals" className="py-28 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            
            {/* Gallery Headers */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-20">
              <div>
                <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block mb-3 font-semibold">MUSEUM ARCHIVES</span>
                <h2 className="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Our Masterpieces</h2>
              </div>

              {/* Category buttons list */}
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-widest">
                {(['all', 'wedding', 'pre-wedding', 'portrait', 'editorial'] as const).map(filterOpt => (
                  <button
                    key={filterOpt}
                    onClick={() => setActiveFilter(filterOpt)}
                    className={`px-5 py-2.5 transition-all duration-300 rounded text-[9.5px] font-black uppercase tracking-widest ${
                      activeFilter === filterOpt 
                        ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 border-2 border-[#D4AF37]' 
                        : 'bg-[#070707] text-gray-400 border border-gray-900 hover:border-gray-800 hover:text-white'
                    }`}
                  >
                    {filterOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Photos Gridding */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPhotos.map((photo, index) => {
                const photoExif = getPhotoExif(photo.id);
                return (
                  <motion.div
                    layout
                    key={photo.id}
                    onClick={() => setSelectedPhotoIndex(index)}
                    className="group bg-[#070707] rounded-2xl border border-gray-900 overflow-hidden cursor-pointer relative shadow-xl hover:shadow-[#D4AF37]/5 transition-all duration-500"
                    whileHover={{ y: -8 }}
                  >
                    {/* Museum Mat design framing */}
                    <div className="p-4 bg-[#111111] pb-1 border-b border-gray-900/60">
                      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-neutral-900 relative">
                        <img 
                          referrerPolicy="no-referrer"
                          src={photo.url} 
                          alt={photo.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-mono text-gray-300 pointer-events-none">
                          {photoExif.camera} • {photoExif.aperture}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-5 flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1.5 block">
                          {photo.category}
                        </span>
                        <h4 className="font-serif text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">{photo.title}</h4>
                        <p className="text-xs text-gray-500 font-light mt-1 max-w-xs">{photo.desc}</p>
                      </div>
                      <div className="p-2 bg-neutral-900 rounded-lg text-gray-400 group-hover:text-[#D4AF37] transition-all">
                        <Camera size={14} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lightbox Overlay rendering featuring real metadata display */}
        <AnimatePresence>
          {selectedPhotoIndex !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/98 flex flex-col md:flex-row items-stretch overflow-hidden"
            >
              <button 
                onClick={() => setSelectedPhotoIndex(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white border border-gray-800 px-3 py-1.5 rounded bg-[#111111] text-xs font-black tracking-widest uppercase flex items-center gap-1 transition-all z-20"
              >
                <X size={14} /> Close
              </button>

              {/* Navigation icons inside Lightbox */}
              <button 
                onClick={handlePrevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-[#D4AF37] w-12 h-12 border border-gray-800 hover:border-[#D4AF37] flex items-center justify-center rounded-full bg-[#111111]/65 transition-all text-lg z-10"
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-[#D4AF37] w-12 h-12 border border-gray-800 hover:border-[#D4AF37] flex items-center justify-center rounded-full bg-[#111111]/65 transition-all text-lg z-10"
              >
                <ChevronRight size={24} />
              </button>

              {/* Left Column: Image wrapper (Takes 70%) */}
              <div className="flex-1 flex items-center justify-center p-4 md:p-12 bg-black/40 relative">
                <motion.div 
                  key={selectedPhotoIndex}
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="rounded-xl overflow-hidden border border-gray-900 max-h-[80vh] flex items-center justify-center shadow-2xl relative bg-zinc-950"
                >
                  <img 
                    referrerPolicy="no-referrer"
                    src={filteredPhotos[selectedPhotoIndex].url} 
                    alt={filteredPhotos[selectedPhotoIndex].title} 
                    className="max-w-full max-h-[75vh] object-contain"
                  />
                </motion.div>
              </div>

              {/* Right Column: EXIF Photographic Metadata Panel (Takes 30% / 360px side drawer) */}
              <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-gray-900 bg-[#0A0A0A] p-8 flex flex-col justify-between overflow-y-auto z-10">
                <div className="space-y-8">
                  {/* Category Brand */}
                  <div>
                    <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block mb-2">MASTERPIECE RECORD</span>
                    <h3 className="font-serif text-3xl font-black text-white">{filteredPhotos[selectedPhotoIndex].title}</h3>
                    <p className="text-xs text-gray-400 mt-2 font-light italic">"{filteredPhotos[selectedPhotoIndex].desc}"</p>
                  </div>

                  {/* Dynamic EXIF Information */}
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block border-b border-gray-900 pb-2">EXIF PHOTOGRAPHIC DATA</span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">CAMERA</span>
                        <span className="text-xs font-bold text-gray-200 mt-1 block">{getPhotoExif(filteredPhotos[selectedPhotoIndex].id).camera}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">LENS REFERENCE</span>
                        <span className="text-xs font-bold text-gray-200 mt-1 block">{getPhotoExif(filteredPhotos[selectedPhotoIndex].id).lens}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">SHUTTER SPEED</span>
                        <span className="text-xs font-mono font-bold text-gray-200 mt-1 block">{getPhotoExif(filteredPhotos[selectedPhotoIndex].id).shutter}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">APERTURE FCON</span>
                        <span className="text-xs font-mono font-bold text-[#D4AF37] mt-1 block">{getPhotoExif(filteredPhotos[selectedPhotoIndex].id).aperture}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block font-bold text-gray-500">ISO INDEX</span>
                        <span className="text-xs font-mono font-bold text-gray-200 mt-1 block">{getPhotoExif(filteredPhotos[selectedPhotoIndex].id).iso}</span>
                      </div>
                      <div className="p-3 bg-black/40 border border-gray-900 rounded-xl">
                        <span className="text-[8px] text-gray-500 uppercase tracking-wider block">FOCAL WIDTH</span>
                        <span className="text-xs font-mono font-bold text-gray-200 mt-1 block">{getPhotoExif(filteredPhotos[selectedPhotoIndex].id).focal}</span>
                      </div>
                    </div>
                  </div>

                  {/* Copyright and signature */}
                  <div className="p-4 bg-[#111111] border border-gray-900 rounded-xl text-xs space-y-2">
                    <span className="font-bold text-[#D4AF37] text-[10px] uppercase tracking-wider block">Copyright Protected</span>
                    <p className="text-gray-400 font-light leading-normal">
                      Original production printed by hand on silver-gelatin paper at our premium headquarters. Unauthorised reproduction matches international legal framework bounds.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-900">
                  <span className="text-[10px] text-gray-500 block mb-3 font-semibold">INTERACTIVE COMMANDS</span>
                  <button 
                    onClick={() => setSelectedPhotoIndex(null)}
                    className="w-full py-3.5 bg-transparent hover:bg-white text-white hover:text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all duration-300 border border-gray-800"
                  >
                    Return To Archives
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Testimonials Review panel */}
        <section id="testimonials" className="py-28 bg-[#0D0D0D] border-t border-b border-gray-950">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-20">
              <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block mb-3 font-semibold">TESTIMONIALS</span>
              <h2 className="font-serif text-3xl md:text-5xl font-black text-white tracking-tight">Stories of Love & Art</h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-4 rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <span className="absolute top-4 right-6 text-gray-800/25 font-serif text-7xl select-none leading-none">“</span>
                <p className="text-gray-400 italic text-sm leading-relaxed relative z-10 font-light">
                  "Working with Lens & Light Studios was effortless. Our Udaipur grand destination wedding looked incredible in video clips they graded. Sincere and pristine masterpieces framing our legacy family!"
                </p>
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-900/60 relative z-10">
                  <div className="w-10 h-10 bg-yellow-400/5 border border-[#D4AF37]/25 rounded-full flex items-center justify-center font-bold text-[#D4AF37] text-xs">AP</div>
                  <div>
                    <h5 className="font-serif text-white font-bold text-sm">Amit & Priyanka</h5>
                    <span className="text-[9.5px] uppercase tracking-wider text-gray-500 font-bold mt-0.5 block">Destination Wedding Couple</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <span className="absolute top-4 right-6 text-gray-800/25 font-serif text-7xl select-none leading-none">“</span>
                <p className="text-gray-400 italic text-sm leading-relaxed relative z-10 font-light">
                  "The couples candid photography and creative tracking details are next-level. We shot around the gorgeous valley forests of Mahabaleshwar. Extremely comfortable directing, resulting in natural facial clicks."
                </p>
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-900/60 relative z-10">
                  <div className="w-10 h-10 bg-yellow-400/5 border border-[#D4AF37]/25 rounded-full flex items-center justify-center font-bold text-[#D4AF37] text-xs">SK</div>
                  <div>
                    <h5 className="font-serif text-white font-bold text-sm">Sarah & Kabir</h5>
                    <span className="text-[9.5px] uppercase tracking-wider text-gray-500 font-bold mt-0.5 block">Candid Shoot Candidates</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] p-8 rounded-2xl border border-gray-900 hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                <span className="absolute top-4 right-6 text-gray-800/25 font-serif text-7xl select-none leading-none">“</span>
                <p className="text-gray-400 italic text-sm leading-relaxed relative z-10 font-light">
                  "Elite color correction, precise LUT setups, pacing and narrative video cuts. These guys designed our marketing reels which received wonderful organic interaction and appreciation."
                </p>
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-900/60 relative z-10">
                  <div className="w-10 h-10 bg-yellow-400/5 border border-[#D4AF37]/25 rounded-full flex items-center justify-center font-bold text-[#D4AF37] text-xs">NL</div>
                  <div>
                    <h5 className="font-serif text-white font-bold text-sm">Nisha & Luke</h5>
                    <span className="text-[9.5px] uppercase tracking-wider text-gray-500 font-bold mt-0.5 block">Cinematography Clients</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lead reservation Form - Premium Split Layout */}
        <section id="reserve" className="py-28 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Left Column: Premium Studio Desk Details (5/12) */}
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.4em] block mb-3 font-semibold">RESERVATION GATEWAY</span>
                  <h2 className="font-serif text-4xl md:text-5xl font-black text-white tracking-tight lead-none">Let's Design Your Narrative</h2>
                  <p className="text-gray-400 text-sm mt-5 leading-relaxed font-light">Our studio slots fill early due to international travel dates. Secure your timeline check-in with our direct reservation gateway.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-[#111111] rounded-2xl border border-gray-900 flex gap-4">
                    <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37] shrink-0">
                      <Globe size={18} />
                    </div>
                    <div>
                      <h4 className="text-gray-200 font-serif font-bold text-sm">Global Operations</h4>
                      <p className="text-gray-500 text-xs mt-1">Udaipur • Mahabaleshwar • Goa • Mumbai</p>
                    </div>
                  </div>

                  <div className="p-5 bg-[#111111] rounded-2xl border border-gray-900 flex gap-4">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                      <Star size={18} />
                    </div>
                    <div>
                      <h4 className="text-gray-200 font-serif font-bold text-sm">Studio Slots Warning</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs text-red-400 font-bold">Only 3 Slots Left for June/July 2026</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-[#111111] to-[#070707] border border-gray-900 rounded-2xl">
                  <h4 className="text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest mb-2 font-mono">Bespoke Perks include:</h4>
                  <ul className="text-xs text-gray-400 space-y-1.5 list-disc pl-4 font-light">
                    <li>1-on-1 Concept session with Director</li>
                    <li>Silver-gelatin archival grade prints</li>
                    <li>Raw uncompressed media backups for 1 Year</li>
                    <li>Direct Custom Live Portfolio template access</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Reservation Form Block (7/12) */}
              <div className="lg:col-span-7">
                <div className="bg-[#111111] p-8 md:p-12 rounded-3xl border border-gray-900 relative shadow-2xl">
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block mb-2">My Full Name</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Shubham Hingane"
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                          className="w-full bg-black/60 border border-gray-900 rounded-xl px-4 py-3.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block mb-2">Email Address</label>
                        <input 
                          type="email" 
                          required
                          placeholder="hello@shubhamhingane.in"
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          className="w-full bg-black/60 border border-gray-900 rounded-xl px-4 py-3.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block mb-2">Requested Photographic Service</label>
                      <select 
                        value={bookingService} 
                        onChange={(e) => setBookingService(e.target.value)}
                        className="w-full bg-black/60 border border-gray-900 rounded-xl px-4 py-3.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all cursor-pointer"
                      >
                        <option value="wedding">Wedding Photoshoot Packages</option>
                        <option value="pre-wedding">Candid Pre-Wedding Shoots</option>
                        <option value="editing">Cinematic Look Film Grading & Video Edits</option>
                        <option value="reels">Viral Social Media Reels making</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] block mb-2">Outline Event Scope & Vibe</label>
                      <textarea 
                        rows={4}
                        placeholder="Describe dates, venues, locations, expected guest density, and custom cinematic styles..."
                        value={bookingMessage}
                        onChange={(e) => setBookingMessage(e.target.value)}
                        className="w-full bg-black/60 border border-gray-900 rounded-xl px-4 py-3.5 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-4 bg-[#D4AF37] hover:bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all duration-300 shadow-2xl cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Transmit Booking Inquiry
                    </button>
                  </form>

                  {/* Booking success overlay panel */}
                  <AnimatePresence>
                    {isBooked && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/98 rounded-3xl flex flex-col items-center justify-center p-8 text-center"
                      >
                        <CheckCircle2 size={56} className="text-[#D4AF37] mb-4 animate-pulse" />
                        <h3 className="font-serif text-3xl font-extrabold text-white mb-2">Bespoke Proposal Scheduled</h3>
                        <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                          We have secured your inquiry parameters correctly. Our lead creative specialist will contact you on your registered credentials within the next 24 hours.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>


            </div>
          </div>
        </section>
      </main>

      {/* Footer copyright with neat Staging Developer Hub toggles at bottom */}
      <footer className="bg-[#070707] border-t border-gray-950 py-16 text-xs text-gray-500 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 border-b border-gray-900 pb-12 mb-12">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <span className="font-serif font-black text-white text-xl tracking-[0.25em]">LENS & LIGHT STUDIOS</span>
              <span className="text-[8px] text-gray-400 mt-1 uppercase tracking-widest font-black">Capturing Moments, Creating Memories.</span>
            </div>
            
            {/* Elegant horizontal menu in footer */}
            <div className="flex gap-6 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <a href="#welcome" className="hover:text-white transition-all">Home</a>
              <a href="#offerings" className="hover:text-white transition-all">Our Services</a>
              <a href="#simulator" className="hover:text-white transition-all">Simulator</a>
              <a href="#visuals" className="hover:text-white transition-all">Curated Works</a>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6">
            <p className="tracking-widest uppercase text-[10px] text-gray-600 font-bold">&copy; 2026 Lens & Light Studios. All Rights Reserved.</p>
            
            {/* Elegant, clean Publisher & Console widget for easy user code downloading */}
            <div className="flex items-center gap-3 bg-neutral-900/40 border border-gray-900 px-4 py-2.5 rounded-full flex-wrap justify-center">
              <span className="text-[9px] text-[#D4AF37] font-black uppercase tracking-widest border-r border-gray-800 pr-3 mr-1 inline-flex items-center gap-1.5">
                <BookOpen size={11} /> DEV RESOURCES
              </span>

              <button 
                type="button"
                onClick={handleDownloadCode} 
                className="px-3 py-1.5 bg-black/80 hover:bg-black text-white text-[9px] uppercase font-bold tracking-widest rounded-full flex items-center gap-1 cursor-pointer transition-all border border-gray-800"
              >
                <Download size={10} /> Download HTML SPA
              </button>
              
              <button 
                type="button"
                onClick={handleCopyCode} 
                className="px-3 py-1.5 bg-black/80 hover:bg-black text-white text-[9px] uppercase font-bold tracking-widest rounded-full flex items-center gap-1 cursor-pointer transition-all border border-gray-800"
              >
                {copiedCode ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                {copiedCode ? 'Copied' : 'Copy SPA Code'}
              </button>

              <button 
                type="button"
                onClick={() => setShowHostingGuide(true)} 
                className="px-3 py-1.5 bg-blue-950/40 hover:bg-blue-900 text-blue-400 hover:text-white text-[9px] uppercase font-bold tracking-widest rounded-full flex items-center gap-1 cursor-pointer transition-all border border-blue-900/30"
              >
                <Globe size={10} /> Domains Guide
              </button>
            </div>
          </div>

        </div>
      </footer>

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
