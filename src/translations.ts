export type Language = 'en' | 'hi' | 'mr';

export const translations = {
  en: {
    nav: {
      home: 'Home',
      features: 'Features',
      resume: 'Resume',
      testimonial: 'Testimonial',
      clients: 'Clients',
      blog: 'Blog',
      courses: 'Courses',
      portfolio: 'Portfolio',
      projects: 'Projects',
      contact: 'Contact',
      hireMe: 'Hire Me',
    },
    hero: {
      welcome: 'WELCOME TO MY WORLD',
      title: "Hi, I'm ",
      name: 'Shubham Hingane',
      profession: 'Computer Engineer & Senior Developer.',
      desc: "Pune-based computer engineer specialising in web apps and mobile development. Available for freelance and full-time opportunities.",
      findMe: 'FIND WITH ME',
      bestSkill: 'BEST SKILL',
      typing: [
        'Computer Engineer',
        'Software Developer',
        'App Developer',
        'Website Developer',
        'Live Streaming',
        'Video Editing',
        'Graphics Design'
      ]
    },
    features: {
      subtitle: 'Services',
      title: 'What I Do',
      cards: {
        software: {
          id: 'software-development',
          title: 'Software Development',
          desc: 'Custom enterprise software solutions tailored to your business needs with robust architecture.'
        },
        app: {
          id: 'app-development',
          title: 'App Development',
          desc: 'High-performance mobile applications for Android and iOS using modern frameworks.'
        },
        web: {
          id: 'website-development',
          title: 'Website Development',
          desc: 'Responsive and SEO-friendly websites that drive engagement and convert visitors into customers.'
        },
        media: {
          id: 'media-broadcasting',
          title: 'Media & Broadcasting',
          desc: 'Professional live streaming and broadcasting services for events, corporate meets, and gaming.'
        },
        video: {
          id: 'video-editing',
          title: 'Video Editing',
          desc: 'High-quality post-production and professional video editing for all types of digital content.'
        },
        marketing: {
          id: 'digital-marketing',
          title: 'Digital Marketing',
          desc: 'Strategic online marketing to boost your brand visibility and reach the right audience.'
        }
      }
    },
    serviceDetail: {
      'software-development': {
        title: 'Software Development',
        subtitle: 'Bespoke Enterprise Solutions',
        desc: 'We build scalable, secure, and efficient software systems that automate your business processes. Our expertise lies in creating robust backend systems, intuitive dashboards, and cross-platform tools that grow with your company.',
        features: ['Custom ERP/CRM Systems', 'Database Architecture', 'Desktop Applications', 'Cloud Infrastructure'],
        projects: [
          { title: 'Inventory Master', desc: 'Real-time stock management system for a global retail chain.' },
          { title: 'SafePass CRM', desc: 'Secure customer relationship management for financial firms.' }
        ],
        testimonials: [
          { quote: 'The ERP system Shubham developed saved us 15 hours of manual work weekly.', author: 'Alex Chen, COO' }
        ],
        tools: ['Node.js', 'PostgreSQL', 'Python', 'AWS']
      },
      'app-development': {
        title: 'App Development',
        subtitle: 'Mobile-First Excellence',
        desc: 'Our mobile app development process focuses on user experience and performance. Whether it is a native iOS app or a cross-platform Flutter solution, we ensure your app is smooth, fast, and feature-rich.',
        features: ['Native iOS & Android', 'Cross-Platform development', 'App Store Optimization', 'API Integration'],
        projects: [
          { title: 'FitSync App', desc: 'A multi-platform fitness tracking application with real-time syncing.' },
          { title: 'EduConnect', desc: 'A school management app for teachers and parents.' }
        ],
        testimonials: [
          { quote: 'Our user engagement tripled after releasing the new mobile app.', author: 'Maria Rodriguez, Product Lead' }
        ],
        tools: ['React Native', 'Firebase', 'Flutter', 'Swift']
      },
      'website-development': {
        title: 'Website Development',
        subtitle: 'Modern Web Presence',
        desc: "From landing pages to complex e-commerce platforms, we craft websites that are fast, responsive, and visually stunning. We focus on search engine optimization (SEO) and conversion rate optimization (CRO).",
        features: ['React & Next.js Development', 'E-commerce Solutions', 'Performance Optimization', 'Responsive UI Design'],
        projects: [
          { title: 'EcoShop E-com', desc: 'A high-performance e-commerce store with zero-latency search.' },
          { title: 'DevPortfolio', desc: 'Animated professional portfolios for tech specialists.' }
        ],
        testimonials: [
          { quote: 'Load speeds improved significantly, leading to a 20% increase in conversions.', author: 'James Wilson, Marketing Director' }
        ],
        tools: ['React', 'Next.js', 'Tailwind CSS', 'Vercel']
      },
      'media-broadcasting': {
        title: 'Media & Broadcasting',
        subtitle: 'Live Stream Production',
        desc: 'Professional multi-camera live streaming services for events, weddings, corporate presentations, and gaming tournaments. We provide hardware-level encoding for stable and high-quality broadcasts.',
        features: ['Multi-Camera Production', 'Platform Integration (YouTube/FB)', 'OBS Professional Setup', 'Signal Management'],
        projects: [
          { title: 'Global Tech Summit', desc: 'Managed full 4K live broadcast for a 3-day international event.' },
          { title: 'ProGaming League', desc: 'Live esports broadcasting with custom graphic overlays.' }
        ],
        testimonials: [
          { quote: 'Zero downtime during our 12-hour global marathon stream.', author: 'Kevin Park, Event Manager' }
        ],
        tools: ['OBS Studio', 'vMix', 'Blackmagic Design', 'NDI']
      },
      'video-editing': {
        title: 'Video Editing',
        subtitle: 'Storytelling in Motion',
        desc: 'Professional post-production that turns raw footage into compelling stories. We specialize in color grading, motion graphics, and sound design to make your videos stand out on any platform.',
        features: ['Commercial Editing', 'Social Media Shorts', 'Documentary Post-production', 'Motion Graphics'],
        projects: [
          { title: 'Travel Memoirs', desc: 'Cinematic documentary-style editing for a travel documentary.' },
          { title: 'Brand Story', desc: 'Corporate narrative video with advanced motion graphics.' }
        ],
        testimonials: [
          { quote: 'The cinematic quality delivered was far beyond our expectations.', author: 'Lisa Sterling, Creative Director' }
        ],
        tools: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Audition']
      },
      'digital-marketing': {
        title: 'Digital Marketing',
        subtitle: 'Grow Your Brand',
        desc: 'Comprehensive digital strategies to increase your online footprint. We handle everything from Social Media Management (SMM) to Search Engine Marketing (SEM) to ensure you reach your target customers.',
        features: ['Social Media Strategy', 'SEO & SEM', 'Content Marketing', 'Analytics & Reporting'],
        projects: [
          { title: 'Organic Growth Boost', desc: 'Achieved 300% growth in organic traffic for a SaaS startup.' },
          { title: 'AdMaster Campaign', desc: 'High-ROI PPC campaigns for local service businesses.' }
        ],
        testimonials: [
          { quote: 'Our ROI doubled within the first three months of the campaign.', author: 'Tom Harrison, Founder' }
        ],
        tools: ['Google Ads', 'Meta Ads', 'Google Analytics', 'Semrush']
      }
    },
    courses: {
      subtitle: 'Learning Center',
      title: 'Our Professional Courses',
      list: [
        {
          id: 'full-stack-dev',
          title: 'Full Stack Development',
          desc: 'Master React, Node.js and MongoDB from scratch.',
          duration: '6 Months',
          price: '$299'
        },
        {
          id: 'ui-ux-design',
          title: 'UI/UX Design Masterclass',
          desc: 'Learn Figma, user research and modern design principles.',
          duration: '3 Months',
          price: '$199'
        },
        {
          id: 'digital-marketing',
          title: 'Digital Marketing Strategy',
          desc: 'Dominate social media and search engines.',
          duration: '2 Months',
          price: '$149'
        }
      ],
      cta: 'Enroll Now',
      learnMore: 'Learn More'
    },
    courseDetail: {
      'full-stack-dev': {
        title: 'Full Stack Development',
        subtitle: 'Become a Professional Web Developer',
        overview: 'This comprehensive course takes you from a beginner to a professional full-stack developer. You will learn to build modern, responsive, and performance-optimized web applications using the MERN stack.',
        curriculum: [
          'Frontend: HTML5, CSS3, JavaScript (ES6+)',
          'React Framework: Hooks, Context, State Management',
          'Backend: Node.js, Express.js Architecture',
          'Database: MongoDB, Data Modeling',
          'Deployment: CI/CD, AWS, Heroku'
        ],
        outcomes: ['Build Real-world Projects', 'Job Placement Support', 'Premium Certification'],
        mentorship: '1-on-1 Mentoring sessions with Shubham'
      },
      'ui-ux-design': {
        title: 'UI/UX Design Masterclass',
        subtitle: 'Master User-Centric Design',
        overview: 'Learn the secrets of creating viral and user-friendly interfaces. From wireframing to high-fidelity prototyping, master the tools used by top design teams worldwide.',
        curriculum: [
          'Design Principles: Color, Typography, Grid',
          'Wireframing & Prototyping in Figma',
          'User Research & Persona Building',
          'Interaction Design with Motion',
          'Design Systems & Handoff'
        ],
        outcomes: ['Professional Design Portfolio', 'UI/UX Certificate', 'Client Interaction Skills'],
        mentorship: 'Weekly Portfolio Reviews'
      },
      'digital-marketing': {
        title: 'Digital Marketing Strategy',
        subtitle: 'Scale Businesses with Data',
        overview: 'Master the art of online growth. Learn how to drive traffic, optimize conversions, and manage paid campaigns across Google, Meta, and beyond.',
        curriculum: [
          'SEO & Content Marketing Strategy',
          'PPC: Google Ads & Meta Ads',
          'Email Marketing Automation',
          'Conversion Rate Optimization (CRO)',
          'Analytics & Performance Tracking'
        ],
        outcomes: ['Certified Digital Marketer', 'Live Campaign Management', 'Growth Strategies'],
        mentorship: 'Real-world Ad Spend Management'
      }
    },
    portfolio: {
      subtitle: 'Visit my portfolio and keep your feedback',
      title: 'My Amazing Projects',
      filters: {
        all: 'All',
        web: 'Web',
        app: 'App',
        design: 'Design',
        ai: 'AI'
      },
      projects: [
        {
          id: 'dairy-management',
          title: 'Dairy Management System',
          category: 'app',
          desc: 'A complete solution for milk collection and distribution, featuring real-time data tracking and billing.',
          image: 'https://images.unsplash.com/photo-1528498033373-3c6c08e83363?auto=format&fit=crop&q=80&w=800',
          demoUrl: '/live/dairy-demo'
        },
        {
          id: 'agriculture-billing',
          title: 'AgroShop Billing & Management',
          category: 'app',
          desc: 'Comprehensive billing and inventory management solution for agriculture shops, handling seeds, fertilizers, and pesticides with GST compliance.',
          image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/agro-login'
        },
        {
          id: 'mess-management',
          title: 'Mess OS: Multi-tenant Mess Management',
          category: 'web',
          desc: 'A complete solution for mess owners to manage members, daily meals, payments, and billing with multi-tenant support.',
          image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/mess-demo'
        },
        {
          id: 'medical-prescription',
          title: 'MedPrescription: Digital medical Ecosystem',
          category: 'web',
          desc: 'Digitalizing the medical prescription to optimize communication between doctor-patient – pharmacy in an effective, direct and secure way.',
          image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/med-login'
        },
        {
          id: 'furniture-management',
          title: 'Furniture & Electronics Management System',
          category: 'app',
          desc: 'A comprehensive ERP system for furniture and electronics retailers with AI-driven inventory and smart billing.',
          image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/furniture-login'
        },
        {
          id: 'school-erp',
          title: 'Vidyalaya: Integrated School ERP',
          category: 'web',
          desc: 'A comprehensive management platform supporting attendance records, exam fee ledgers, and dynamic, ornamental certificate compilation.',
          image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/live/school-erp'
        },
        {
          id: 'cricket-scoreboard',
          title: 'GullyScore: Local Cricket Match Scoreboard',
          category: 'app',
          desc: 'An interactive, responsive local cricket scoreboard with automatic innings transitions, detailed batting and bowling rosters, custom commentaries, audios, and match logs.',
          image: 'https://images.unsplash.com/photo-1531415080290-bc9854593f6f?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/live/cricket-scoreboard'
        },
        {
          id: 'cricket-auction',
          title: 'GullyScore: Cricket Player Auction Suite',
          category: 'app',
          desc: 'An elite real-time IPL-style cricket player bidding and franchise management simulator, integrated with custom increments, radial visual timers, sound synthesis, and real-time ledger tracking.',
          image: 'https://images.unsplash.com/photo-1540747737956-37872de719e0?q=80&w=800&auto=format&fit=crop',
          demoUrl: '/live/cricket-auction'
        },
        {
          id: 'video-streamer-recorder',
          title: 'StreamCraft: Full-Stack WebRTC Broadcast Suite',
          category: 'web',
          desc: 'A premium, high-performance camera recorder and WebRTC broadcast simulator featuring real-time diagnostic HUDs, visual filters, whiteboard overlay, and local session vault storage.',
          image: 'https://images.unsplash.com/photo-1478737270239-2f04b77fc618?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/video-streamer-recorder'
        },
        {
          id: 'id-card-generator',
          title: 'ZenID Pro: Dual-Side ID Card Suite',
          category: 'web',
          desc: 'A professional dual-sided student and faculty ID card generator with high-fidelity canvas previews, drag-and-drop badge logos, linear barcodes, custom QR codes, and 500+ bulk CSV mappings.',
          image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/id-card-generator'
        },
        {
          id: 'photography-portfolio',
          title: 'Lens & Light Studios: Premium Photography Brand SPA',
          category: 'web',
          desc: 'A premium, highly interactive single page application for an editorial photography studio, featuring dynamic galleries, seamless pricing structures, and beautiful visual storytelling transitions.',
          image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/photography-portfolio'
        },
        {
          id: 'ganpati-mandal',
          title: 'Ganpati Mandal: Digital Pavati & ERP',
          category: 'app',
          desc: 'Comprehensive Ganesh Mandal ERP replacing traditional paper receipt books with ornamental digital pavatis, WhatsApp sharing, live income-expense ledger, volunteer rosters, and live darshan.',
          image: 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/ganpati-mandal'
        },
        {
          id: 'election-command-center',
          title: 'Election Command Center: ECI Management Software',
          category: 'web',
          desc: 'An integrated Web-based Election Management platform facilitating Voter roll scanning, duplicate voter auditing, Karyakarta task rosters with live GPS check-ins, and high-fidelity war room monitors.',
          image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/election-command-center'
        },
        {
          id: 'cricket-toss',
          title: 'GullyScore: Cricket Digital Toss Simulator',
          category: 'app',
          desc: 'An interactive 3D cricket coin toss arena featuring realistic physics, Web Audio synthesis, custom team & captain inputs, toss winner declaration, and captain bat/bowl decision cards.',
          image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/cricket-toss'
        }
      ]
    },
    projectDetail: {
      'cricket-toss': {
        title: 'GullyScore: Cricket Digital Toss Simulator',
        subtitle: 'ICC Standard Fair Coin Simulator & Captain Decision Suite',
        role: 'Full Stack Frontend Engineer',
        overview: 'A high-impact, broadcast-grade cricket coin toss simulator designed for local cricket tournaments, box leagues, and official matches. Features realistic 3D coin flipping physics with grass landing bounce, zero-latency Web Audio sound effects, customizable team and captain inputs with quick presets, automated winner calculation based on calling captain prediction, and captain decision locking (Bat or Bowl) with instant WhatsApp summary sharing.',
        tech: ['React 18', 'TypeScript', '3D CSS Transforms', 'Web Audio API', 'Motion / Framer Motion', 'Tailwind CSS'],
        features: [
          'Realistic 3D Coin Physics: Dual-sided golden coin (Heads & Tails) with elevation, rotation physics, and responsive turf shadow tracking.',
          'Custom Teams & Captains: Flexible input fields for Team A and Team B with presets for IPL and international rivalries.',
          'Official Coin Calling: Choice of calling team and prediction (Heads or Tails) with automatic winner calculation.',
          'Interactive Captain Decision: Post-toss choice cards for Bat First (फलंदाजी) or Bowl First (गोलंदाजी).',
          'Web Audio Sound Synthesizer: Zero-asset procedural metallic coin flick, whirring spin, chime landing, and victory fanfare.',
          'Broadcast Match Card: Lower-third summary graphic announcing the toss decision and 1st/2nd innings assignments.',
          '1-Click WhatsApp Export: Instant formatted toss report ready to share with team groups and tournament organizers.',
          'Toss History Tracker: Persistent log of previous toss outcomes with timestamps and match parameters.'
        ],
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/cricket-toss'
      },
      'dairy-management': {
        title: 'Dairy Management System',
        subtitle: 'Enterprise Milk Collection & Billing',
        role: 'Full Stack Developer',
        overview: 'A specialized solution for local dairies to digitize their traditional record-keeping. It streamlines the morning and evening milk collection process, manages farmer databases, and automates complex billing calculations based on fat and SNF percentages.',
        tech: ['React 18', 'TypeScript', 'Firebase Firestore', 'Tailwind CSS', 'Framer Motion'],
        features: [
          'Unique Farmer ID System with Auto-fill',
          'Automated Morning/Evening Shift Recording',
          'Instant Billing Calculation',
          'Individual Farmer Ledgers (Sheets)',
          'Owner Dashboard with Monthly Summaries',
          'Real-time Data Persistence',
          'Cloud-based Access for Owner'
        ],
        image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=1200',
        demoUrl: '/live/dairy-demo'
      },
      'agriculture-billing': {
        title: 'AgroShop Billing & Management',
        subtitle: 'Complete Agro-Shop ERP',
        role: 'Full Stack Developer',
        overview: 'A comprehensive billing and inventory management system designed specifically for agriculture retail shops in rural areas. It handles complex inventories of seeds, fertilizers, and pesticides, manages GST compliance, and provides detailed analytics for shop owners to track seasonal sales patterns.',
        tech: ['React 18', 'TypeScript', 'Firebase Firestore', 'Tailwind CSS', 'Chart.js'],
        features: [
          'GST-Ready Invoicing & Billing',
          'Inventory Management for Seeds/Fertilizers',
          'Customer Credit (Udhaar) Tracking',
          'Supplier Management & Purchase Orders',
          'Seasonal Sales Analytics & Reports',
          'Mobile-Friendly Owner Dashboard',
          'Offline Mode Support for Rural Areas'
        ],
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/agro-login'
      },
      'mess-management': {
        title: 'Mess OS: Multi-tenant Mess Management',
        subtitle: 'Scalable Mess & Billing Solution',
        role: 'Full Stack Developer',
        overview: 'A robust multi-tenant platform designed for mess owners to automate member management, attendance (meal) tracking, and complex monthly billing. Each mess owner gets a private dashboard, and members can track their own meal history and outstanding dues.',
        tech: ['React 18', 'TypeScript', 'Firebase (Auth & Firestore)', 'Tailwind CSS', 'Redux Toolkit'],
        features: [
          'Multi-tenant Architecture (Isolated Data)',
          'Super Admin Panel for Mess Owner Management',
          'Automated Monthly Billing Calculation',
          'Daily Member Meal (Attendance) Tracking',
          'Payment History & Due Reminders',
          'Member-specific Login for Personal Records',
          'Downloadable PDF Reports for Bills'
        ],
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/mess-demo'
      },
      'medical-prescription': {
        title: 'MedPrescription: Digital Medical Ecosystem',
        subtitle: 'The Most Efficient Way to Prescribe Medications',
        role: 'Full Stack Developer',
        overview: 'Digitalizing the medical prescription to optimize communication between doctor-patient – pharmacy in an effective, direct and secure way for all parties. It saves time, improves patient care and contributes to the sustainability of the health system by avoiding unnecessary travel or visits to the office for the prescription or renewal of medications. The platform ensures compliance with current legislation while making medication management easier for everyone through a cloud-based profile.',
        tech: ['React 18', 'TypeScript', 'Firebase', 'Node.js', 'SMS/Email API'],
        features: [
          'Quickly Create Prescriptions: Create in seconds, print or share electronically',
          'Favourite Prescriptions: Predefined templates for common diagnoses to prescribe even faster',
          'Consult Patients Online: Accept fees, manage appointments and video consult patients',
          'Customized To Your Needs: Prescrip is built to adapt to the unique needs of your practice',
          'Track Treatment History: Save hours with history of patient medical records from the app',
          'Generate Report: Easy reports for clinical research, studies or health pattern analysis',
          'Easy Patient Management: Easily access all your patient data anytime anywhere securely',
          'Send Key Reminders: Automated SMS/Email for medicine and follow-up reminders',
          'Organize Notes & Images: Save hours and costs spent on managing patient records',
          'Secure & Own Your Records: Strict security ensuring only you have access to your data'
        ],
        image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/med-login'
      },
      'furniture-management': {
        title: 'Furniture & Electronics Management System',
        subtitle: 'Production-Ready Enterprise ERP',
        role: 'Full Stack Architect',
        overview: 'A complete, multi-module management system for large scale furniture and electronics showrooms. Features a high-performance AI-driven billing system, warehouse control, cross-platform inventory sync, and real-time sales reporting.',
        tech: ['React 18', 'TypeScript', 'Node.js', 'Firebase', 'Gemini AI', 'Tailwind CSS'],
        features: [
          'AI Smart Billing with Barcode Scanning',
          'Online & Offline Inventory Sync',
          'Warehouse & Godown Control with Transfers',
          'Gemini AI Sales Predictions & Insights',
          'Supplier Management & Raw Material Tracking',
          'Accounting & GST Compliance Reports',
          'Customer Loyalty & Promotion Tiers',
          'Physical Stock Audit with Mobile Scanning'
        ],
        image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/furniture-login'
      },
      'school-erp': {
        title: 'Vidyalaya: Integrated School ERP Suite',
        subtitle: 'Enterprise School Management, Attendance & Certificates',
        role: 'Full Stack Developer',
        overview: 'A high-fidelity institutional ERP and administrative gateway called Vidyalaya. Designed to automate schools, colleges, and district education portals, the suite manages localized student registers, monitors daily attendance in dynamic grids, tracks term-wise exam fee records with custom receipts, and provides an ornamental certificate builder that spits high-resolution printable award PDFs with custom digital stamps and watermarks.',
        tech: ['React 18', 'TypeScript', 'Motion / Framer Motion', 'Tailwind CSS', 'Faux-Print Engines', 'HTML Canvas'],
        features: [
          'Interactive Admin Statistics & Visual Progress Dashboards',
          'Dynamic Grid-style Student Attendance Tracker',
          'Academic Exam Fee Ledger with Dual Installment Controls',
          '1-Click Ornamental Certificate Template Compiler',
          'Real-time Digital Seals, Signatures, and Custom Watermarks',
          'Automated Receipt & Document Download Engines',
          'Automatic LocalStorage Client State Synchronization with Demodata flushes',
          'Fully Responsive Design supporting Mobile Sliders & Sidebar views'
        ],
        image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/live/school-erp'
      },
      'cricket-scoreboard': {
        title: 'GullyScore: Local Cricket Match Scoreboard Suite',
        subtitle: 'Interactive local matches scoreboard, commentaries, rosters & journals',
        role: 'Full Stack Developer',
        overview: 'An interactive, elite level local cricket tournament scorer tool called GullyScore. Modeled for gully matches, tournaments, club sports, and sports academies, it facilitates scoring overs, tracking batsmen striker bounds, managing bowlers, recording complex extras, wickets, deep undo states, custom ball-by-ball commentaries, sound effects, and completed game journals saved locally.',
        tech: ['React 18', 'TypeScript', 'Motion / Framer Motion', 'Tailwind CSS', 'Web Audio API', 'LocalStorage'],
        features: [
          'Fast setup with team config, overs count, coin toss, and choice controls',
          'Live big scoreboard with runs, wickets, overs, required rates, and free hit indicators',
          'Interactive batting pair blocks tracking batsman runs, balls, fours, sixes, and live strike rate',
          'Rigorous bowling rosters tracking spells, overs, maidens, runs, wickets, and economy values',
          'Advanced wicket categories (Bowled, Caught, Stumped, Run-out, LBW) with next batter assignment fields',
          'Deep multi-state Undo capability to reverse any wrong ball scores instantly',
          'In-play commentaries capturing deliveries and custom scoring note posts',
          'Match Journal history logs with restoring capability saved with LocalStorage'
        ],
        image: 'https://images.unsplash.com/photo-1531415080290-bc9854593f6f?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/live/cricket-scoreboard'
      },
      'cricket-auction': {
        title: 'GullyScore: Cricket Player Auction Suite',
        subtitle: 'IPL-style interactive franchise bidding simulator and draft registry',
        role: 'Full Stack Developer',
        overview: 'An elite, dark-mode real-time player auction simulator modeled for local sports leagues, club coordinators, and gaming lobbies. Features custom increments, radial visual timers, Web Audio sound synthesis, interactive canvas confetti, franchise budget checks, and spreadsheet exports.',
        tech: ['React 18', 'TypeScript', 'Motion / Framer Motion', 'Tailwind CSS', 'Web Audio API', 'LocalStorage'],
        features: [
          'Dynamic Franchise configuration managing total budget pools up to ₹100 Crores',
          'Pre-loaded nomination registry of 20 elite players with specialities, nationality, base-prices, and active ratings',
          'Live interactive bidders highlights tracking current bidders, leaders, and prospective deals',
          'Custom Bid raising increments with decimal overflow resolution systems (+0.1 Cr up to +1.0 Cr)',
          'Circular vector count timers that trigger audio notifications and turn red below 10 seconds',
          'Gavel strikes, warning beeps, and crowd applause synthesized strictly via standard Web Audio APIs',
          'Interactive decorative confetti burst animations painted beautifully on HTML5 canvases',
          'Instant spreadsheet outputs exporting consolidated catalog summaries to CSV formats'
        ],
        image: 'https://images.unsplash.com/photo-1540747737956-37872de719e0?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/cricket-auction'
      },
      'video-streamer-recorder': {
        title: 'StreamCraft: WebRTC Live Stream & Recorder',
        subtitle: 'High-Performance Video Recorder, Canvas Modifiers & Diagnostics Studio',
        role: 'Senior Media Engineer',
        overview: 'A premium broadcasting console and responsive MediaRecorder workstation. Leveraging HTML5 Canvas filters and custom drawing layers, StreamCraft bakes customizable watermarks and animations directly into recordings and WebRTC transceivers. Supported by a localized IndexedDB media cache for reliable retrieval across sandboxed environments.',
        tech: ['WebRTC RTCPeerConnection', 'MediaDevices API', 'MediaRecorder API', 'HTML5 Canvas', 'IndexedDB Storage', 'Web Audio API'],
        features: [
          'High Performance HD Video Recording & Live Camera toggles (Front/Back mobile rotation)',
          'True End-to-End Local WebRTC loopback stream simulating ICE Candidate channels and latency statistics',
          'Canvas-backed Visual Modifier Filters (Vintage VHS noise, Sepia, Grayscale, Chromatic Inversions)',
          'Interactive Paint/Whiteboard Overlay on top of live camera feeds baked directly into the recorded files',
          'Dynamic Diagnostic Stats Monitor HUD tracing resolution standards, active codecs, connection status, and precise FPS values',
          'Web Audio Analyser nodes generating real-time microphone sound-decibel amplitude scales',
          'Persistent localized Clips catalog storing active sessions, date records, file constraints, and durations via IndexedDB',
          'Synthesized sound effects for status transitions generated dynamically via browser AudioContext oscillators'
        ],
        image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/video-streamer-recorder'
      },
      'id-card-generator': {
        title: 'ZenID Studio: Professional ID Card Generator',
        subtitle: 'High-Fidelity CR80 Standard Design Workstation & Bulk Importer',
        role: 'Senior Product Engineer & Designer',
        overview: 'A state-of-the-art ID Card designer workstation tailored for academic complexes, corporate schools, and membership circles. Features multiple layout templates, responsive drag-and-drop overlays for logos/photographs/signatures, diagonal translucent watermarks, procedural barcodes, and QR-spec code locator grids, powered by a chunked asynchronous CSV/Excel bulk compiler that produces beautifully packed multi-page A4 folding sheet exports.',
        tech: ['HTML5 Canvas API', 'jsPDF', 'PapaParse Standard CSV', 'React 18', 'Tailwind CSS', 'Framer Motion'],
        features: [
          'Dual-Side CR80 design viewport (front and back layout panels side by side)',
          'Multiple stylized pre-built layout presets (Modern diagonals, Corporate banners, white Minimal, standard Classic)',
          'Interactive workspace controls managing solid or gradient background fills, watermark strings, and border bounds',
          'Custom font family scale parameters tailored for Inter, Space Grotesk, or JetBrains Mono',
          'High DPI (300 DPI print-ready equivalent) canvas exports yielding crisply aligned PNG vector graphics',
          'Comprehensive local database ledger tracking student statuses (Active, Expired, Revoked) with batch expire update utilities',
          'Asynchronous multi-record bulk CSV spreadsheet mapping engine that compiles up to 500+ items without browser freezing',
          'Professional A4 folded layout print generators that arrange front and back pages consecutively for twin-duplex printing'
        ],
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/id-card-generator'
      },
      'ganpati-mandal': {
        title: 'Ganpati Mandal: Digital Pavati & Enterprise ERP',
        subtitle: 'Traditional Faith Meets Modern Cloud Financial Architecture',
        role: 'Full Stack Product Engineer',
        overview: 'A full-featured digital transformation platform for public Ganesh Mandals across Maharashtra and India. It modernizes century-old paper receipt books (पावती पुस्तक) into high-fidelity ornamental digital receipts, automates daily income and expenditure ledgers with charity audit balance sheet exports, manages volunteer duties, coordinates Aarti schedules with VIP QR passes, and connects devotees with live darshan and mannat prayer walls.',
        tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'QRCode.react', 'XLSX', 'LocalStorage'],
        features: [
          'Digital Pavati Book: Instant ornamental donation receipts with Marathi Devnagari typography, amount-in-words converter, and 1-click WhatsApp delivery.',
          'Expense & Voucher Ledger: Complete vendor tracking for pandal, flowers, sound, prasad, and electricity with bill attachment simulation.',
          'Core Mandal Profile & Announcements: Real-time public announcements ticker, historic background, theme details, and executive board directory.',
          'Membership & Volunteer Management: Member subscription tracking, emergency blood bank directory, and shift-wise volunteer duty rosters.',
          'Events & Aarti Schedule: Daily timings, festival timeline, and VIP/Senior Citizen queue pass generator with security QR verification.',
          'Devotee Engagement: HD Live Darshan feed simulation, dynamic interactive Mannat Wall, and photo gallery with social media sharing.',
          'Inventory & Stock Management: Puja materials, sound equipment, barricade inventory tracking with low-stock warnings.',
          'Audit-Ready Financial Reports: Category-wise pie charts, daily income vs expense trend graphs, and 1-click Excel balance sheet export.',
          'Multi-Device Sync & Pandal Map: Real-time multi-counter sync indicators, interactive zone crowd density monitors, and emergency hotlines.'
        ],
        image: 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/ganpati-mandal'
      },
      'election-command-center': {
        title: 'Election Command Center: Integrated ECI Campaign Management Software',
        subtitle: 'Enterprise-Grade Booth-Level Analytics & Voter Database Suite',
        role: 'Full Stack Architect & Strategist',
        overview: 'A robust, comprehensive platform designed for Indian political campaign managers and party organizers. It centralizes voter rolls, handles intelligent duplicate auditing, organizes volunteer networks (Karyakarta rosters) with GPS tracking, coordinates messaging campaigns, processes door-to-door surveys, tracks live Election Day voter turnout trends, and exports compliant CSV/PDF analytical reports.',
        tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'Lucide React', 'LocalStorage'],
        features: [
          'Voter Database: Full searchable directory with custom OCR voter ID uploads, duplicate audits, and filter categories.',
          'Booth & Ward Mapping: Hierarchical tree view mapping of Lok Sabha, Assembly constituencies, wards, and individual polling booths.',
          'Volunteer Management: Worker roster mapping with simulated live GPS check-in feeds and automated task lists.',
          'Campaign Scheduler: Central calendar with cover-heatmap gauges simulating public ground-outreach saturation.',
          'Communication Hub: Simulated bulk WhatsApp, SMS, and IVR broadcast controls with direct status logs.',
          'Survey Analysis: Door-to-door public opinion logger with AI-simulated sentiment indicators and rating widgets.',
          'Election Day War Room: Real-time voter turnout indicators, live incident reports, and booth-wise status gauges.',
          'Reports & Analytics: Instant dashboard visualizations and compliant offline-friendly CSV data export engines.'
        ],
        image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/election-command-center'
      }
    },
    chatbot: {
      title: 'Shubham Assistant',
      placeholder: 'Ask me anything...',
      welcome: 'Hello! I am Shubham AI. How can I help you today?',
      welcomeUser: 'Welcome, {name}! ',
      welcomeHero: "Hey there! I'm Shubham's AI twin. Ready to explore my world of engineering and design?",
      welcomeFeatures: "Interested in the services? I can dive deep into software, apps, or digital marketing details for you!",
      welcomeResume: "My resume is quite a journey! Want to know more about my technical toolkit or experience at top firms?",
      welcomePortfolio: "Every project has a story. Which one are you curious about? Case studies, or live demos?",
      welcomeContact: "Let's build something great! Need help with an inquiry or want to setup a call with Shubham?",
      error: 'Sorry, I am having trouble thinking right now. Please try again.'
    },
    aiChat: {
      subtitle: 'AI Powered Assistant',
      title: 'Chat with my AI Twin',
      desc: 'Have questions about my work, skills, or availability? My AI assistant is trained on my entire portfolio and can help you instantly.',
      cta: 'Start Conversation'
    },
    newsLaunchpad: {
      subtitle: 'News Business Launchpad',
      title: 'Start Your News Agency',
      desc: 'We help aspiring news owners start their media business smoothly with end-to-end technical and legal support.',
      features: [
        { title: 'RNI Registration', desc: 'Step-by-step guidance for Registrar of Newspapers for India registration.' },
        { title: 'Professional Website', desc: 'Secure, high-traffic news portal with real-time updates and monetization.' },
        { title: 'Legal & Compliance', desc: 'Documentation support for various news media licenses and compliance.' },
        { title: 'Digital Strategy', desc: 'Content strategy and social media growth for new news startups.' }
      ],
      cta: 'Get Started'
    },
    resume: {
      subtitle: '7+ Years of Experience',
      title: 'My Resume',
      tabs: {
        education: 'Education',
        skills: 'Professional Skills',
        experience: 'Experience',
        interview: 'Interview'
      },
      edu: {
        title: 'Education Quality',
        comp: 'Computer Engineering',
        uni: 'University of Technology (2014 - 2018)',
        high: 'Higher Secondary',
        college: 'Science College (2012 - 2014)',
        cert: 'Certifications',
        full: 'Full Stack Web Development',
        coursera: 'Coursera Specialization',
        gcp: 'Google Cloud Certified',
        google: 'Google Cloud Platform'
      },
      skills: {
        dev: 'Development Skills',
        graph: 'Graphic & Tools'
      },
      exp: {
        job: 'Job Experience',
        sr: 'Senior Software Engineer',
        google: 'Google (2020 - Current)',
        web: 'Web Developer',
        meta: 'Meta (2018 - 2020)',
        free: 'Freelance Work',
        creative: 'Creative Lead',
        upwork: 'Upwork (2016 - Current)',
        consultant: 'App Consultant',
        startup: 'Startup Hub (2017 - 2018)'
      },
      interview: {
        tech: 'Technical Interviews',
        algo: 'Algorithms Expert',
        leet: 'LeetCode 500+',
        design: 'System Design',
        prep: 'Tech Interview Prep',
        hire: 'Hire Me Today',
        hireDesc: "I'm ready for new challenges and exciting projects that push the boundaries of technology.",
        book: 'Book Interview'
      }
    },
    testimonial: {
      subtitle: 'What Clients Say',
      title: 'Client Stories',
      list: [
        {
          name: 'Marthin Gomez',
          role: 'Operation Manager',
          company: 'Rainbow IT',
          project: 'Android App Development',
          date: 'Aug 2021',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
          quote: '"Shubham is an exceptional engineer. His dairy software has revolutionized how we collect milk and manage our farmers."'
        },
        {
          name: 'Sarah Jenkins',
          role: 'Dairy Owner',
          company: 'Green Valley Milk',
          project: 'Milk Collection System',
          date: 'Dec 2022',
          image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400',
          quote: '"The automated billing system saved us hours of manual calculation. Highly recommend for any modern dairy business."'
        },
        {
          name: 'Rajen Mehta',
          role: 'Logistics Head',
          company: 'IndoDairy Group',
          project: 'Distribution Network',
          date: 'Jan 2024',
          image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
          quote: '"Secure and reliable. The real-time tracking of milk collection points has given us total transparency."'
        }
      ]
    },
    clients: {
      subtitle: 'Popular Clients',
      title: 'Awesome Clients'
    },
    blog: {
      subtitle: 'Visit my blog and keep your feedback',
      title: 'My Blog',
      posts: [
        { category: 'Development', time: '5 min read', title: 'The Best Software Development Platform' },
        { category: 'Tech', time: '4 min read', title: 'Modern React Design Patterns' }
      ]
    },
    contact: {
      subtitle: 'Get In Touch',
      title: 'Professional Contact',
      desc: 'Whether you have a specific project in mind or just want to say hi, my inbox is always open.',
      info: {
        title: 'Shubham Hingane',
        job: 'Computer Engineer & Senior Developer',
        desc: "I am available for innovative freelance projects and long-term collaborations. Let's build something exceptional together.",
        call: 'Call Me',
        phone: '+91-7719959593',
        email: 'Email Me',
        emailAddr: 'info@shubhamhingane.in',
        hours: 'Working Hours',
        monfri: 'Mon - Fri: 9:00 AM - 6:00 PM',
        network: 'Network with me'
      },
      form: {
        name: 'Your Name',
        phone: 'Phone Number',
        email: 'Email',
        subject: 'Subject',
        message: 'Your Message',
        placeholder: {
          name: 'E.g. John Doe',
          phone: '+1 234 567 890',
          email: 'name@example.com',
          subject: 'What are we building?',
          message: 'Tell me more about your requirements...'
        },
        send: 'Send Message',
        back: "I'll get back to you within 24 hours"
      }
    },
    footer: {
      rights: '© 2026. All rights reserved by Shubham Hingane.'
    }
  },
  hi: {
    nav: {
      home: 'होम',
      features: 'विशेषताएं',
      resume: 'बायोडेटा',
      testimonial: 'प्रशंसापत्र',
      clients: 'ग्राहक',
      blog: 'ब्लॉग',
      courses: 'कोर्स',
      portfolio: 'पोर्टफोलियो',
      projects: 'प्रोजेक्ट्स',
      contact: 'संपर्क करें',
      hireMe: 'मुझे काम पर रखें',
    },
    hero: {
      welcome: 'मेरी दुनिया में आपका स्वागत है',
      title: "नमस्ते, मैं हूँ ",
      name: 'शुभम हिंगणे',
      profession: 'कंप्यूटर इंजीनियर और सीनियर डेवलपर।',
      desc: "पुणे स्थित कंप्यूटर इंजीनियर जो वेब ऐप्स और मोबाइल डेवलपमेंट में विशेषज्ञता रखते हैं। फ्रीलांस और फुल-टाइम अवसरों के लिए उपलब्ध हैं।",
      findMe: 'मेरे साथ जुड़ें',
      bestSkill: 'सर्वश्रेष्ठ कौशल',
      typing: [
        'कंप्यूटर इंजीनियर',
        'सॉफ्टवेयर डेवलपर',
        'ऐप डेवलपर',
        'वेबसाइट डेवलपर',
        'लाइव स्ट्रीमिंग',
        'वीडियो एडिटिंग',
        'ग्राफिक्स डिजाइन'
      ]
    },
    features: {
      subtitle: 'सेवाएं',
      title: 'मैं क्या करता हूँ',
      cards: {
        software: {
          id: 'software-development',
          title: 'सॉफ्टवेयर विकास',
          desc: 'मजबूत आर्किटेक्चर के साथ आपकी व्यावसायिक जरूरतों के अनुरूप कस्टम एंटरप्राइज सॉफ्टवेयर समाधान।'
        },
        app: {
          id: 'app-development',
          title: 'ऐप विकास',
          desc: 'आधुनिक फ्रेमवर्क का उपयोग करके एंड्रॉइड और आईओएस के लिए उच्च-प्रदर्शन मोबाइल एप्लिकेशन।'
        },
        web: {
          id: 'website-development',
          title: 'वेबसाइट विकास',
          desc: 'उत्तरदायी और एसईओ के अनुकूल वेबसाइटें जो जुड़ाव बढ़ाती हैं और आगंतुकों को ग्राहकों में बदलती हैं।'
        },
        media: {
          id: 'media-broadcasting',
          title: 'मीडिया और प्रसारण',
          desc: 'आयोजनों, कॉर्पोरेट मीटिंग्स और गेमिंग के लिए व्यावसायिक लाइव स्ट्रीमिंग और प्रसारण सेवाएं।'
        },
        video: {
          id: 'video-editing',
          title: 'वीडियो संपादन',
          desc: 'सभी प्रकार की डिजिटल सामग्री के लिए उच्च गुणवत्ता वाला पोस्ट-प्रोडक्शन और व्यावसायिक वीडियो संपादन।'
        },
        marketing: {
          id: 'digital-marketing',
          title: 'डिजिटल मार्केटिंग',
          desc: 'आपकी ब्रांड विजिबिलिटी को बढ़ाने और सही दर्शकों तक पहुंचने के लिए रणनीतिक ऑनलाइन मार्केटिंग।'
        }
      }
    },
    serviceDetail: {
      'software-development': {
        title: 'सॉफ्टवेयर विकास',
        subtitle: 'बेस्पोक एंटरप्राइज समाधान',
        desc: 'हम स्केलेबल, सुरक्षित और कुशल सॉफ्टवेयर सिस्टम बनाते हैं जो आपकी व्यावसायिक प्रक्रियाओं को स्वचालित करते हैं। हमारी विशेषज्ञता मजबूत बैकएंड सिस्टम और सहज डैशबोर्ड बनाने में है।',
        features: ['कस्टम ईआरपी/सीआरएम सिस्टम', 'डेटाबेस आर्किटेक्चर', 'डेस्कटॉप एप्लिकेशन', 'क्लाउड इन्फ्रास्ट्रक्चर'],
        projects: [
          { title: 'इन्वेंटरी मास्टर', desc: 'एक वैश्विक खुदरा श्रृंखला के लिए वास्तविक समय स्टॉक प्रबंधन प्रणाली।' },
          { title: 'सेफपास सीआरएम', desc: 'वित्तीय फर्मों के लिए सुरक्षित ग्राहक संबंध प्रबंधन।' }
        ],
        testimonials: [
          { quote: 'शुभम द्वारा विकसित ईआरपी सिस्टम ने साप्ताहिक हमारे 15 घंटे के मैन्युअल काम को बचाया।', author: 'एलेक्स चेन, सीओओ' }
        ],
        tools: ['Node.js', 'PostgreSQL', 'Python', 'AWS']
      },
      'app-development': {
        title: 'ऐप विकास',
        subtitle: 'मोबाइल-फर्स्ट उत्कृष्टता',
        desc: 'हमारा मोबाइल ऐप विकास प्रक्रिया उपयोगकर्ता अनुभव और प्रदर्शन पर केंद्रित है। चाहे वह नेटिव आईओएस ऐप हो या क्रॉस-प्लेटफॉर्म समाधान, हम गति सुनिश्चित करते हैं।',
        features: ['नेटिव आईओएस और एंड्रॉइड', 'क्रॉस-प्लेटफॉर्म विकास', 'ऐप स्टोर अनुकूलन', 'एपीआई एकीकरण'],
        projects: [
          { title: 'फिटसिंक ऐप', desc: 'रियल-टाइम सिंकिंग के साथ एक मल्टी-प्लेटफॉर्म फिटनेस ट्रैकिंग एप्लिकेशन।' },
          { title: 'एडुकनेक्ट', desc: 'शिक्षकों और अभिभावकों के लिए एक स्कूल प्रबंधन ऐप।' }
        ],
        testimonials: [
          { quote: 'नया मोबाइल ऐप जारी करने के बाद हमारे यूजर एंगेजमेंट में तीन गुना वृद्धि हुई।', author: 'मारिया रोड्रिगेज, प्रोडक्ट लीड' }
        ],
        tools: ['React Native', 'Firebase', 'Flutter', 'Swift']
      },
      'website-development': {
        title: 'वेबसाइट विकास',
        subtitle: 'आधुनिक वेब उपस्थिति',
        desc: "लैंडिंग पेजों से लेकर जटिल ई-कॉमर्स प्लेटफॉर्म तक, हम ऐसी वेबसाइटें तैयार करते हैं जो तेज, उत्तरदायी और सुंदर होती हैं।",
        features: ['रिएक्ट और नेक्स्ट जेएस विकास', 'ई-कॉमर्स समाधान', 'प्रदर्शन अनुकूलन', 'उत्तरदायी यूआई डिजाइन'],
        projects: [
          { title: 'इकोशॉप ई-कॉम', desc: 'शून्य-विलंबता खोज के साथ एक उच्च-प्रदर्शन ई-कॉमर्स स्टोर।' },
          { title: 'देवपोर्टफोलियो', desc: 'तकनीकी विशेषज्ञों के लिए एनिमेटेड पेशेवर पोर्टफोलियो।' }
        ],
        testimonials: [
          { quote: 'लोड की गति में काफी सुधार हुआ, जिससे रूपांतरणों में 20% की वृद्धि हुई।', author: 'जेम्स विल्सन, मार्केटिंग डायरेक्टर' }
        ],
        tools: ['React', 'Next.js', 'Tailwind CSS', 'Vercel']
      },
      'media-broadcasting': {
        title: 'मीडिया और प्रसारण',
        subtitle: 'लाइव स्ट्रीम उत्पादन',
        desc: 'आयोजनों, शादियों और कॉर्पोरेट प्रस्तुतियों के लिए पेशेवर मल्टी-कैमरा लाइव स्ट्रीमिंग सेवाएं।',
        features: ['मल्टी-कैमरा प्रोडक्शन', 'प्लेटफॉर्म इंटीग्रेशन', 'ओबीएस प्रोफेशनल सेटअप', 'सिग्नल प्रबंधन'],
        projects: [
          { title: 'ग्लोबल टेक समिट', desc: '3-दिवसीय अंतरराष्ट्रीय कार्यक्रम के लिए पूर्ण 4K लाइव प्रसारण प्रबंधित किया।' },
          { title: 'प्रो-गेमिंग लीग', desc: 'कस्टम ग्राफिक ओवरले के साथ लाइव ईस्पोर्ट्स प्रसारण।' }
        ],
        testimonials: [
          { quote: 'हमारे 12 घंटे के वैश्विक मैराथन स्ट्रीम के दौरान कोई डाउनटाइम नहीं था।', author: 'केविन पार्क, इवेंट मैनेजर' }
        ],
        tools: ['OBS Studio', 'vMix', 'Blackmagic Design', 'NDI']
      },
      'video-editing': {
        title: 'वीडियो संपादन',
        subtitle: 'कहानी गति में',
        desc: 'पेशेवर पोस्ट-प्रोडक्शन जो कच्चे फुटेज को सम्मोहक कहानियों में बदल देता है।',
        features: ['वाणिज्यिक संपादन', 'सोशल मीडिया शॉर्ट्स', 'वृत्तचित्र पोस्ट-प्रोडक्शन', 'मोशन ग्राफिक्स'],
        projects: [
          { title: 'ट्रैवल मेमोयर्स', desc: 'एक यात्रा वृत्तचित्र के लिए सिनेमाई वृत्तचित्र-शैली संपादन।' },
          { title: 'ब्रैंड स्टोरी', desc: 'उन्नत मोशन ग्राफिक्स के साथ कॉर्पररेट नैरेटिव वीडियो।' }
        ],
        testimonials: [
          { quote: 'दी गई सिनेमाई गुणवत्ता हमारी अपेक्षाओं से कहीं अधिक थी।', author: 'लिसा स्टर्लिंग, क्रिएटिव डायरेक्टर' }
        ],
        tools: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Audition']
      },
      'digital-marketing': {
        title: 'डिजिटल मार्केटिंग',
        subtitle: 'अपने ब्रांड को बढ़ाएं',
        desc: 'आपकी ऑनलाइन उपस्थिति बढ़ाने के लिए व्यापक डिजिटल रणनीतियां।',
        features: ['सोशल मीडिया रणनीति', 'एसईओ और एसईएम', 'कंटेंट मार्केटिंग', 'एनालिटिक्स और रिपोर्टिंग'],
        projects: [
          { title: 'ऑर्गेनिक ग्रोथ बूस्ट', desc: 'एक SaaS स्टार्टअप के लिए ऑर्गेनिक ट्रैफ़िक में 300% की वृद्धि हासिल की।' },
          { title: 'ऐड-मास्टर कैंपेन', desc: 'स्थानीय सेवा व्यवसायों के लिए उच्च-पीपीसी अभियान।' }
        ],
        testimonials: [
          { quote: 'अभियान के पहले तीन महीनों के भीतर हमारा आरओआई दोगुना हो गया।', author: 'टॉम हैरिसन, संस्थापक' }
        ],
        tools: ['Google Ads', 'Meta Ads', 'Google Analytics', 'Semrush']
      }
    },
    courses: {
      subtitle: 'लर्निंग सेंटर',
      title: 'हमारे व्यावसायिक पाठ्यक्रम',
      list: [
        {
          id: 'full-stack-dev',
          title: 'फुल स्टैक डेवलपमेंट',
          desc: 'शुरुआत से रिएक्ट और नोड जेएस में महारत हासिल करें।',
          duration: '6 महीने',
          price: '₹24,999'
        },
        {
          id: 'ui-ux-design',
          title: 'UI/UX डिजाइन मास्टरक्लास',
          desc: 'फिगमा और आधुनिक डिजाइन सिद्धांत सीखें।',
          duration: '3 महीने',
          price: '₹14,999'
        },
        {
          id: 'digital-marketing',
          title: 'डिजिटल मार्केटिंग रणनीति',
          desc: 'सोशल मीडिया और सर्च इंजन पर हावी हों।',
          duration: '2 महीने',
          price: '₹9,999'
        }
      ],
      cta: 'अभी नामांकन करें',
      learnMore: 'अधिक जानें'
    },
    courseDetail: {
      'full-stack-dev': {
        title: 'फुल स्टैक डेवलपमेंट',
        subtitle: 'एक प्रोफेशनल वेब डेवलपर बनें',
        overview: 'यह व्यापक पाठ्यक्रम आपको शुरुआती से पेशेवर फुल-स्टैक डेवलपर तक ले जाता है। आप MERN स्टैक का उपयोग करके आधुनिक और प्रदर्शन-अनुकूल वेब एप्लिकेशन बनाना सीखेंगे।',
        curriculum: [
          'फ्रंटएंड: HTML5, CSS3, JavaScript (ES6+)',
          'रिएक्ट फ्रेमवर्क: हुक्स, कॉन्टेक्स्ट, स्टेट मैनेजमेंट',
          'बैकएंड: Node.js, Express.js आर्किटेक्चर',
          'डेटाबेस: MongoDB, डेटा मॉडलिंग',
          'डिप्लॉयमेंट: CI/CD, AWS, Heroku'
        ],
        outcomes: ['रियल-वर्ल्ड प्रोजेक्ट्स बनाएं', 'जॉब प्लेसमेंट सपोर्ट', 'प्रीमियम सर्टिफिकेशन'],
        mentorship: 'शुभम के साथ 1-on-1 मेंटरिंग सत्र'
      },
      'ui-ux-design': {
        title: 'UI/UX डिजाइन मास्टरक्लास',
        subtitle: 'यूजर-सेंट्रिक डिजाइन में महारत हासिल करें',
        overview: 'उपयोगकर्ता के अनुकूल इंटरफेस बनाने के रहस्य सीखें। वायरफ्रेमिंग से लेकर प्रोटोटाइपिंग तक, दुनिया की शीर्ष डिजाइन टीमों द्वारा उपयोग किए जाने वाले टूल में महारत हासिल करें।',
        curriculum: [
          'डिजाइन सिद्धांत: रंग, टाइपोग्राफी, ग्रिड',
          'Figma में वायरफ्रेमिंग और प्रोटोटाइपिंग',
          'उपयोगकर्ता अनुसंधान और व्यक्तित्व निर्माण',
          'मोशन के साथ इंटरेक्शन डिजाइन',
          'डिजाइन सिस्टम और हैंडऑफ'
        ],
        outcomes: ['प्रोफेशनल डिजाइन पोर्टफोलियो', 'UI/UX प्रमाणपत्र', 'क्लाइंट इंटरेक्शन कौशल'],
        mentorship: 'साप्ताहिक पोर्टफोलियो समीक्षा'
      },
      'digital-marketing': {
        title: 'डिजिटल मार्केटिंग रणनीति',
        subtitle: 'डेटा के साथ व्यवसायों को स्केल करें',
        overview: 'ऑनलाइन विकास की कला में महारत हासिल करें। Google, Meta और अन्य प्लेटफॉर्म पर ट्रैफ़िक बढ़ाना, रूपांतरण अनुकूलित करना और सशुल्क अभियान प्रबंधित करना सीखें।',
        curriculum: [
          'एसईओ और कंटेंट मार्केटिंग रणनीति',
          'PPC: Google Ads & Meta Ads',
          'ईमेल मार्केटिंग ऑटोमेशन',
          'रूपांतरण दर अनुकूलन (CRO)',
          'एनालिटिक्स और प्रदर्शन ट्रैकिंग'
        ],
        outcomes: ['प्रमाणित डिजिटल मार्केटर', 'लाइव कैंपेन मैनेजमेंट', 'ग्रोथ रणनीतियां'],
        mentorship: 'रियल-वर्ल्ड विज्ञापन खर्च प्रबंधन'
      }
    },
    portfolio: {
      subtitle: 'मेरे पोर्टफोलियो पर जाएँ और अपनी प्रतिक्रिया दें',
      title: 'मेरे अद्भुत प्रोजेक्ट्स',
      filters: {
        all: 'सभी',
        web: 'वेब',
        app: 'ऐप',
        design: 'डिजाइन',
        ai: 'एआई'
      },
      projects: [
        {
          id: 'dairy-management',
          title: 'डेयरी प्रबंधन प्रणाली',
          category: 'app',
          desc: 'दूध संग्रह और वितरण के लिए एक संपूर्ण समाधान, जिसमें वास्तविक समय डेटा ट्रैकिंग और बिलिंग की सुविधा है।',
          image: 'https://images.unsplash.com/photo-1528498033373-3c6c08e83363?auto=format&fit=crop&q=80&w=800',
          demoUrl: '/live/dairy-demo'
        },
        {
          id: 'agriculture-billing',
          title: 'एग्रोशॉप बिलिंग और प्रबंधन',
          category: 'app',
          desc: 'कृषि दुकानों के लिए व्यापक बिलिंग और इन्वेंट्री प्रबंधन समाधान, जीएसटी अनुपालन के साथ बीज, उर्वरक और कीटनाशकों का प्रबंधन।',
          image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/agro-login'
        },
        {
          id: 'medical-prescription',
          title: 'मेडप्रिस्क्रिप्शन: डिजिटल मेडिकल इकोसिस्टम',
          category: 'web',
          desc: 'डॉक्टरों, रोगियों और फार्मेसियों के बीच संचार को कुशलतापूर्वक और सुरक्षित रूप से अनुकूलित करने के लिए मेडिकल नुस्खों का डिजिटलीकरण।',
          image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/med-login'
        },
        {
          id: 'school-erp',
          title: 'विद्यालय: एकीकृत स्कूल ईआरपी',
          category: 'web',
          desc: 'एक व्यापक प्रबंधन मंच जो उपस्थिति रिकॉर्ड, परीक्षा शुल्क बहीखाता और गतिशील, सजावटी प्रमाण पत्र संकलन का समर्थन करता है।',
          image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/live/school-erp'
        },
        {
          id: 'cricket-scoreboard',
          title: 'गलीस्कोर: स्थानीय क्रिकेट मैच स्कोरबोर्ड',
          category: 'app',
          desc: 'एक इंटरैक्टिव, वेब-रेस्पॉन्सिव स्थानीय क्रिकेट स्कोरबोर्ड जिसमें इनिंग्स का ऑटो-ट्रांज़िशन, व्यापक बल्लेबाज़-गेंदबाज़ रोस्टर, लाइव कमेंट्री और रिकॉर्ड्स सहेजे जा सकते हैं।',
          image: 'https://images.unsplash.com/photo-1531415080290-bc9854593f6f?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/live/cricket-scoreboard'
        },
        {
          id: 'cricket-auction',
          title: 'गलीस्कोर: क्रिकेट खिलाड़ी नीलामी सूट',
          category: 'app',
          desc: 'एक वास्तविक समय क्रिकेट खिलाड़ी बोली और फ्रैंचाइज़ी प्रबंधन सिम्युलेटर, जिसमें कस्टम वेतन सीमाएं, गोल टाइमर और सीएसवी एक्सपोर्टिंग की सुविधा है।',
          image: 'https://images.unsplash.com/photo-1540747737956-37872de719e0?q=80&w=800&auto=format&fit=crop',
          demoUrl: '/live/cricket-auction'
        },
        {
          id: 'photography-portfolio',
          title: 'Lens & Light Studios: प्रीमियम फोटोग्राफी ब्रांड SPA',
          category: 'web',
          desc: 'संपादकीय फोटोग्राफी स्टूडियो के लिए एक प्रीमियम, अत्यधिक संवादात्मक सिंगल पेज एप्लीकेशन, जिसमें गतिशील गैलरी और सुंदर दृश्य कहानी बदलाव शामिल हैं।',
          image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/photography-portfolio'
        },
        {
          id: 'ganpati-mandal',
          title: 'गणपति मंडल: डिजिटल पावती एवं ईआरपी',
          category: 'app',
          desc: 'पारंपरिक रसीद बुक की जगह डिजिटल पावती, व्हाट्सएप शेयरिंग, लाइव आय-व्यय बहीखाता, स्वयंसेवक ड्यूटी और लाइव दर्शन वाला संपूर्ण मंडल प्रबंधन सिस्टम।',
          image: 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/ganpati-mandal'
        },
        {
          id: 'cricket-toss',
          title: 'गलीस्कोर: क्रिकेट डिजिटल टॉस सिमुलेटर',
          category: 'app',
          desc: 'यथार्थवादी 3D भौतिकी, वेब ऑडियो ध्वनि, अनुकूलन योग्य टीम इनपुट, टॉस विजेता घोषणा और कप्तान बैट/बॉल निर्णय कार्ड वाला इंटरैक्टिव क्रिकेट टॉस अखाड़ा।',
          image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/cricket-toss'
        }
      ]
    },
    projectDetail: {
      'cricket-toss': {
        title: 'गलीस्कोर: क्रिकेट डिजिटल टॉस सिमुलेटर',
        subtitle: 'आईसीसी मानक निष्पक्ष सिक्का सिमुलेटर और कप्तान निर्णय सूट',
        role: 'फुल स्टैक फ्रंटेंड इंजीनियर',
        overview: 'स्थानीय क्रिकेट टूर्नामेंट, बॉक्स लीग और आधिकारिक मैचों के लिए बनाया गया हाई-इम्पैक्ट क्रिकेट कॉइन टॉस सिमुलेटर। इसमें यथार्थवादी 3D सिक्का उछाल, वेब ऑडियो साउंड इफेक्ट, टीम और कप्तानों के नाम, टॉस विजेता ऑटो-गणना और कप्तान बैट/बॉल निर्णय लॉकिंग व 1-क्लिक व्हाट्सएप रिपोर्ट शामिल है।',
        tech: ['React 18', 'TypeScript', '3D CSS Transforms', 'Web Audio API', 'Tailwind CSS', 'Framer Motion'],
        features: [
          'यथार्थवादी 3D सिक्का उछाल: हेड्स और टेल्स दोनों तरफ यथार्थवादी रोटेशन व घास पर उछलने का प्रभाव',
          'कस्टम टीम और कप्तान नाम: टीम ए और टीम बी के नाम के साथ त्वरित प्रीसेट (भारत बनाम ऑस्ट्रेलिया, सीएसके बनाम एमआई)',
          'आधिकारिक टॉस कॉलिंग: सिक्का मांगने वाली टीम का चयन और भविष्यवाणी (हेड्स/टेल्स) के आधार पर विजेता की सटीक घोषणा',
          'कप्तान निर्णय चयन: टॉस जीतने के बाद पहले बल्लेबाजी (Bat First) या गेंदबाजी (Bowl First) का आधिकारिक निर्णय',
          'वेब ऑडियो साउंड सिंथेसाइज़र: बिना किसी ऑडियो फाइल के ब्राउज़र में जनरेट होने वाली असली सिक्के की खनक और सीटी',
          'ब्रॉडकास्ट मैच कार्ड: मैच का ऑफिशियल समरी कार्ड जिसे सीधे व्हाट्सएप ग्रुप पर 1-क्लिक में शेयर किया जा सकता है'
        ],
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/cricket-toss'
      },
      'ganpati-mandal': {
        title: 'गणपति मंडल: डिजिटल पावती एवं ईआरपी सिस्टम',
        subtitle: 'पारंपरिक उत्सव और आधुनिक क्लाउड तकनीक का संगम',
        role: 'फुल स्टैक प्रोडक्ट इंजीनियर',
        overview: 'सार्वजनिक गणेशोत्सव मंडलों के लिए संपूर्ण डिजिटल प्रबंधन मंच। पारंपरिक कागजी पावती पुस्तक को उच्च-गुणवत्ता वाली डिजिटल रसीदों में बदलना, 1-क्लिक व्हाट्सएप रसीद, वास्तविक समय आय-व्यय बहीखाता, चैरिटी कमिश्नर ऑडिट रिपोर्ट, स्वयंसेवक ड्यूटी रोस्टर और लाइव दर्शन की सुविधा।',
        tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'QRCode.react', 'XLSX'],
        features: [
          'डिजिटल पावती पुस्तक: देवनागरी मराठी/हिंदी रसीदें और व्हाट्सएप शेयरिंग',
          'व्यय एवं वाउचर बहीखाता: मंडप, फूल, लाइट, प्रसाद और ध्वनि खर्च ट्रैकिंग',
          'मंडल परिचय व सार्वजनिक सूचना पट्ट: लाइव अनाउंसमेंट और कार्यकारी मंडल',
          'सदस्यता एवं स्वयंसेवक प्रबंधन: रक्तदान सूची और शिफ्ट-वाइज ड्यूटियां',
          'आरती व उत्सव समय सारिणी: वीआईपी व वरिष्ठ नागरिक क्यूआर पास',
          'भक्त दर्शन एवं मन्नत वॉल: लाइव दर्शन फीड और ऑनलाइन मन्नत प्रार्थना',
          'सामग्री इन्वेंटरी: पूजा और मंडप सामग्री का स्टॉक नियंत्रण',
          'ऑडिट रेडी बैलेंस शीट: वित्तीय चार्ट और 1-क्लिक एक्सेल एक्सपोर्ट'
        ],
        image: 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/ganpati-mandal'
      },
      'dairy-management': {
        title: 'डेयरी प्रबंधन प्रणाली',
        subtitle: 'एंटरप्राइज दूध संग्रह और बिलिंग',
        role: 'फुल स्टैक डेवलपर',
        overview: 'स्थानीय डेयरी के लिए उनके पारंपरिक रिकॉर्ड-कीपिंग को डिजिटल बनाने के लिए एक विशेष समाधान। यह सुबह और शाम के दूध संग्रह प्रक्रिया को सुव्यवस्थित करता है, किसान डेटाबेस का प्रबंधन करता है, और वसा और एसएनएफ प्रतिशत के आधार पर जटिल बिलिंग गणनाओं को स्वचालित करता है।',
        tech: ['React 18', 'TypeScript', 'Firebase Firestore', 'Tailwind CSS', 'Framer Motion'],
        features: [
          'ऑटो-फिल के साथ यूनिक किसान आईडी सिस्टम',
          'स्वचालित सुबह/शाम शिफ्ट रिकॉर्डिंग',
          'त्वरित बिलिंग गणना',
          'व्यक्तिगत किसान लेजर (शीट)',
          'मासिक सारांश के साथ ओनर डैशबोर्ड',
          'रियल-टाइम डेटा स्थिरता',
          'ओनर के लिए क्लाउड-आधारित एक्सेस'
        ],
        image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=1200',
        demoUrl: '/live/dairy-demo'
      },
      'agriculture-billing': {
        title: 'एग्रोशॉप बिलिंग और प्रबंधन',
        subtitle: 'पूर्ण एग्रो-शॉप ईआरपी',
        role: 'फुल स्टैक डेवलपर',
        overview: 'ग्रामीण क्षेत्रों में कृषि खुदरा दुकानों के लिए विशेष रूप से डिज़ाइन किया गया एक व्यापक बिलिंग और इन्वेंट्री प्रबंधन प्रणाली। यह बीज, उर्वरक और कीटनाशकों के जटिल इन्वेंट्री को संभालता है, जीएसटी अनुपालन का प्रबंधन करता है, और दुकान मालिकों के लिए मौसमी बिक्री पैटर्न को ट्रैक करने के लिए विस्तृत विश्लेषण प्रदान करता है।',
        tech: ['React 18', 'TypeScript', 'Firebase Firestore', 'Tailwind CSS', 'Chart.js'],
        features: [
          'जीएसटी-रेडी चालान और बिलिंग',
          'बीज/उर्वरक के लिए इन्वेंट्री प्रबंधन',
          'ग्राहक क्रेडिट (उधार) ट्रैकिंग',
          'आपूर्तिकर्ता प्रबंधन और खरीद आदेश',
          'मौसमी बिक्री विश्लेषण और रिपोर्ट',
          'मोबाइल-फ्रेंडली ओनर डैशबोर्ड',
          'ग्रामीण क्षेत्रों के लिए ऑफलाइन मोड सपोर्ट'
        ],
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/agro-demo'
      },
      'medical-prescription': {
        title: 'मेडप्रिस्क्रिप्शन: डिजिटल मेडिकल इकोसिस्टम',
        subtitle: 'दवाओं को प्रिस्क्राइब करने का सबसे कुशल तरीका',
        role: 'फुल स्टैक डेवलपर',
        overview: 'मेडिकल नुस्खे का डिजिटलीकरण सभी पक्षों के लिए प्रभावी, प्रत्यक्ष और सुरक्षित तरीके से डॉक्टर-रोगी-फार्मेसी के बीच संचार को अनुकूलित करता है। यह समय बचाता है, रोगी की देखभाल में सुधार करता है और कार्यालय में अनावश्यक यात्रा या विजिट से बचकर स्वास्थ्य प्रणाली की स्थिरता में योगदान देता है। मंच वर्तमान कानून के अनुपालन को सुनिश्चित करते हुए क्लाउड-आधारित प्रोफाइल के माध्यम से सभी के लिए दवा प्रबंधन को आसान बनाता है।',
        tech: ['React 18', 'TypeScript', 'Firebase', 'Node.js', 'SMS/Email API'],
        features: [
          'जल्दी से नुस्खे बनाएं: सेकंड में नुस्खे बनाएं, प्रिंट करें या साझा करें',
          'पसंदीदा नुस्खे: पूर्वनिर्धारित टेम्पलेट्स के साथ तेजी से निदान',
          'मरीजों से ऑनलाइन परामर्श: शुल्क स्वीकार करें, नियुक्तियों का प्रबंधन और वीडियो परामर्श',
          'आपकी आवश्यकताओं के अनुसार: मेडप्रिस्क्रिप्शन आपकी प्रैक्टिस की जरूरतों के अनुरूप है',
          'उपचार इतिहास ट्रैक करें: ऐप से प्रत्येक रोगी के रिकॉर्ड के साथ समय बचाएं',
          'रिपोर्ट तैयार करें: नैदानिक अनुसंधान, अध्ययन या स्वास्थ्य पैटर्न के लिए आसान रिपोर्ट',
          'आसान रोगी प्रबंधन: कहीं भी, कभी भी अपने सभी डेटा तक आसानी से पहुंचें',
          'महत्वपूर्ण अनुस्मारक: दवा और फॉलो-अप के लिए स्वचालित एसएमएस/ईमेल',
          'नोट्स और चित्र व्यवस्थित करें: रिकॉर्ड प्रबंधन में समय और खर्च बचाएं',
          'सुरक्षित और निजी रिकॉर्ड: सख्त सुरक्षा ताकि केवल आपकी पहुंच बनी रहे'
        ],
        image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/med-demo'
      },
      'school-erp': {
        title: 'विद्यालय: एकीकृत स्कूल ईआरपी सुइट',
        subtitle: 'एंटरप्राइज स्कूल प्रबंधन, उपस्थिति और प्रमाण पत्र',
        role: 'फुल स्टैक डेवलपर',
        overview: 'एक उच्च-गुणवत्ता वाला संस्थागत ईआरपी और प्रशासनिक प्रवेश द्वार जिसे "विद्यालय" कहा जाता है। स्कूलों, कॉलेजों और जिला शिक्षा पोर्टलों को स्वचालित करने के लिए डिज़ाइन किया गया, यह सुइट व्यक्तिगत छात्र रजिस्टरों का प्रबंधन करता है, गतिशील ग्रिड में दैनिक उपस्थिति की निगरानी करता है, कस्टम रसीदों के साथ अवधि-वार परीक्षा शुल्क रिकॉर्ड को ट्रैक करता है, और एक सजावटी प्रमाण पत्र निर्माता प्रदान करता है जो कस्टम डिजिटल टिकटों और वॉटरमार्क के साथ उच्च-रिज़ॉल्यूशन वाले प्रिंट करने योग्य पुरस्कार पीडीएफ बनाता है।',
        tech: ['React 18', 'TypeScript', 'Motion / Framer Motion', 'Tailwind CSS', 'Faux-Print Engines', 'HTML Canvas'],
        features: [
          'इंटरैक्टिव व्यवस्थापक आँकड़े और दृश्य प्रगति डैशबोर्ड',
          'छात्र उपस्थिति के लिए गतिशील ग्रिड-शैली ट्रैकर',
          'सत्र-वार परीक्षा शुल्क बहीखाता दोहरी किस्त नियंत्रणों के साथ',
          '1-क्लिक सजावटी प्रमाणपत्र टेम्पलेट संकलक',
          'रियल-टाइम डिजिटल टिकट, हस्ताक्षर और कस्टम वॉटरमार्क',
          'स्वचालित रसीद और दस्तावेज़ डाउनलोड इंजन',
          'डेमोडेटा फ्लश के साथ स्वचालित लोकलस्टोरेज क्लाइंट स्टेट सिंक्रोनाइजेशन',
          'पूरी तरह से उत्तरदायी डिज़ाइन जो मोबाइल स्लाइडर और साइडबार का समर्थन करता है'
        ],
        image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/live/school-erp'
      }
    },
    chatbot: {
      title: 'शुभम सहायक',
      placeholder: 'मुझसे कुछ भी पूछें...',
      welcome: 'नमस्ते! मैं शुभम एआई हूँ। आज मैं आपकी क्या मदद कर सकता हूँ?',
      welcomeUser: 'स्वागत है, {name}! ',
      welcomeHero: "नमस्ते! मैं शुभम का एआई जुड़वां हूँ। मेरी इंजीनियरिंग और डिजाइन की दुनिया को देखने के लिए तैयार हैं?",
      welcomeFeatures: "सेवाओं में रुचि है? मैं आपके लिए सॉफ्टवेयर, ऐप्स या डिजिटल मार्केटिंग के विवरण गहराई से बता सकता हूँ!",
      welcomeResume: "मेरा बायोडाटा काफी लंबा सफर है! क्या आप मेरे तकनीकी टूलकिट या शीर्ष फर्मों के अनुभव के बारे में अधिक जानना चाहते हैं?",
      welcomePortfolio: "हर प्रोजेक्ट की एक कहानी होती है। आप किसके बारे में जानने को उत्सुक हैं? केस स्टडी या लाइव डेमो?",
      welcomeContact: "आइए कुछ महान बनाएं! क्या आपको किसी पूछताछ में मदद चाहिए या शुभम के साथ कॉल सेटअप करना चाहते हैं?",
      error: 'क्षमा करें, मुझे अभी सोचने में परेशानी हो रही है। कृपया पुनः प्रयास करें।'
    },
    aiChat: {
      subtitle: 'एआई संचालित सहायक',
      title: 'मेरे एआई जुड़वां के साथ चैट करें',
      desc: 'मेरे काम, कौशल या उपलब्धता के बारे में प्रश्न हैं? मेरा एआई सहायक मेरे पूरे पोर्टफोलियो पर प्रशिक्षित है और तुरंत आपकी मदद कर सकता है।',
      cta: 'बातचीत शुरू करें'
    },
    newsLaunchpad: {
      subtitle: 'न्यूज स्टार्टअप लॉन्चपैड',
      title: 'न्यूज एजेंसी शुरू करें',
      desc: 'हम नए न्यूज मालिकों को पूरी तकनीकी और कानूनी सहायता के साथ अपना मीडिया व्यवसाय सुचारू रूप से शुरू करने में मदद करते हैं।',
      features: [
        { title: 'RNI पंजीकरण', desc: 'आरएनआई पंजीकरण के लिए चरण-दर-चरण मार्गदर्शन।' },
        { title: 'पेशेवर वेबसाइट', desc: 'वास्तविक समय अपडेट और मुद्रीकरण के साथ सुरक्षित न्यूज पोर्टल।' },
        { title: 'कानूनी और अनुपालन', desc: 'विभिन्न समाचार मीडिया लाइसेंसों के लिए दस्तावेज़ीकरण सहायता।' },
        { title: 'डिजिटल रणनीति', desc: 'नए न्यूज स्टार्टअप के लिए कंटेंट रणनीति और सोशल मीडिया ग्रोथ।' }
      ],
      cta: 'शुरू करें'
    },
    resume: {
      subtitle: '7+ वर्षों का अनुभव',
      title: 'मेरा बायोडेटा',
      tabs: {
        education: 'शिक्षा',
        skills: 'व्यावसायिक कौशल',
        experience: ' अनुभव',
        interview: 'साक्षात्कार'
      },
      edu: {
        title: 'शिक्षा की गुणवत्ता',
        comp: 'कंप्यूटर इंजीनियरिंग',
        uni: 'प्रौद्योगिकी विश्वविद्यालय (2014 - 2018)',
        high: 'उच्च माध्यमिक',
        college: 'साइंस कॉलेज (2012 - 2014)',
        cert: 'प्रमाणपत्र',
        full: 'फुल स्टैक वेब डेवलपमेंट',
        coursera: 'कौरसेरा विशेषज्ञता',
        gcp: 'गूगल क्लाउड प्रमाणित',
        google: 'गूगल क्लाउड प्लेटफॉर्म'
      },
      skills: {
        dev: 'विकास कौशल',
        graph: 'ग्राफिक और उपकरण'
      },
      exp: {
        job: 'नौकरी का अनुभव',
        sr: 'सीनियर सॉफ्टवेयर इंजीनियर',
        google: 'गूगल (2020 - वर्तमान)',
        web: 'वेब डेवलपर',
        meta: 'मेटा (2018 - 2020)',
        free: 'फ्रीलांस काम',
        creative: 'क्रिएटिव लीड',
        upwork: 'अपवर्क (2016 - वर्तमान)',
        consultant: 'ऐप सलाहकार',
        startup: 'स्टार्टअप हब (2017 - 2018)'
      },
      interview: {
        tech: 'तकनीकी साक्षात्कार',
        algo: 'एल्गोरिदम विशेषज्ञ',
        leet: 'लीटकोड 500+',
        design: 'सिस्टम डिजाइन',
        prep: 'तकनीकी साक्षात्कार तैयारी',
        hire: 'मुझे आज ही काम पर रखें',
        hireDesc: "मैं नई चुनौतियों और रोमांचक परियोजनाओं के लिए तैयार हूं जो प्रौद्योगिकी की सीमाओं को आगे बढ़ाती हैं।",
        book: 'साक्षात्कार बुक करें'
      }
    },
    testimonial: {
      subtitle: 'ग्राहक क्या कहते हैं',
      title: 'क्लाइंट कहानियाँ',
      list: [
        {
          name: 'मार्टिन गोमेज़',
          role: 'ऑपरेशन मैनेजर',
          company: 'रेनबो आईटी',
          project: 'एंड्रॉइड ऐप डेवलपमेंट',
          date: 'अगस्त 2021',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
          quote: '"शुभम एक असाधारण इंजीनियर हैं। उनके डेयरी सॉफ्टवेयर ने हमारे दूध संग्रह और किसानों के प्रबंधन के तरीके में क्रांति ला दी है।"'
        },
        {
          name: 'सारा जेनकिंस',
          role: 'डेयरी मालिक',
          company: 'ग्रीन वैली मिल्क',
          project: 'दूध संग्रह प्रणाली',
          date: 'दिसंबर 2022',
          image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400',
          quote: '"स्वचालित बिलिंग प्रणाली ने हमें घंटों की मैन्युअल गणना से बचा लिया। किसी भी आधुनिक डेयरी व्यवसाय के लिए अत्यधिक अनुशंसित।"'
        },
        {
          name: 'राजेन मेहता',
          role: 'लॉजिस्टिक्स हेड',
          company: 'इंडोडेयरी ग्रुप',
          project: 'वितरण नेटवर्क',
          date: 'जनवरी 2024',
          image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
          quote: '"सुरक्षित और विश्वसनीय। दूध संग्रह बिंदुओं की रीयल-टाइम ट्रैकिंग ने हमें पूर्ण पारदर्शिता दी है।"'
        }
      ]
    },
    clients: {
      subtitle: 'लोकप्रिय ग्राहक',
      title: 'शानदार ग्राहक'
    },
    blog: {
      subtitle: 'मेरे ब्लॉग पर जाएँ और अपनी प्रतिक्रिया दें',
      title: 'मेरा ब्लॉग',
      posts: [
        { category: 'डेवलपमेंट', time: '5 मिनट पढ़ने में', title: 'सर्वश्रेष्ठ सॉफ्टवेयर डेवलपमेंट प्लेटफॉर्म' },
        { category: 'टेक', time: '4 मिनट पढ़ने में', title: 'आधुनिक रिएक्ट डिजाइन पैटर्न' }
      ]
    },
    contact: {
      subtitle: 'संपर्क में रहें',
      title: 'पेशेवर संपर्क',
      desc: 'चाहे आपके मन में कोई विशिष्ट परियोजना हो या आप बस नमस्ते कहना चाहते हों, मेरा इनबॉक्स हमेशा खुला है।',
      info: {
        title: 'शुभम हिंगणे',
        job: 'कंप्यूटर इंजीनियर और सीनियर डेवलपर',
        desc: "मैं अभिनव फ्रीलांस परियोजनाओं और दीर्घकालिक सहयोग के लिए उपलब्ध हूं। आइए मिलकर कुछ असाधारण बनाएं।",
        call: 'मुझे कॉल करें',
        phone: '+91-7719959593',
        email: 'मुझे ईमेल करें',
        emailAddr: 'info@shubhamhingane.in',
        hours: 'काम के घंटे',
        monfri: 'सोम - शुक्र: सुबह 9:00 - शाम 6:00',
        network: 'मेरे साथ जुड़ें'
      },
      form: {
        name: 'आपका नाम',
        phone: 'फोन नंबर',
        email: 'ईमेल',
        subject: 'विषय',
        message: 'आपका संदेश',
        placeholder: {
          name: 'जैसे जोंन डो',
          phone: '+1 234 567 890',
          email: 'name@example.com',
          subject: 'हम क्या बना रहे हैं?',
          message: 'मुझे अपनी आवश्यकताओं के बारे में और बताएं...'
        },
        send: 'संदेश भेजें',
        back: "मैं 24 घंटों के भीतर आपसे संपर्क करूँगा"
      }
    },
    footer: {
      rights: '© 2026. शुभम हिंगणे द्वारा सर्वाधिकार सुरक्षित।'
    }
  },
  mr: {
    nav: {
      home: 'होम',
      features: 'वैशिष्ट्ये',
      resume: 'बायोडेटा',
      testimonial: 'प्रशंसापत्र',
      clients: 'ग्राहक',
      blog: 'ब्लॉग',
      courses: 'कोर्सेस',
      portfolio: 'पोर्टफोलिओ',
      projects: 'प्रकल्प',
      contact: 'संपर्क करा',
      hireMe: 'मला कामावर घ्या',
    },
    hero: {
      welcome: 'माझ्या जगात तुमचे स्वागत आहे',
      title: "नमस्कार, मी ",
      name: 'शुभम हिंगणे',
      profession: 'संगणक अभियंता आणि वरिष्ठ विकसक.',
      desc: "पुणे स्थित संगणक अभियंता जो वेब ॲप्स आणि मोबाइल डेव्हलपमेंटमध्ये तज्ञ आहे. फ्रीलांस आणि फुल-टाइम कामाच्या संधींसाठी उपलब्ध आहे.",
      findMe: 'माझ्याशी कनेक्ट व्हा',
      bestSkill: 'सर्वोत्कृष्ट कौशल्ये',
      typing: [
        'संगणक अभियंता',
        'सॉफ्टवेअर डेव्हलपर',
        'ॲप डेव्हलपर',
        'वेबसाइट डेव्हलपर',
        'लाइव्ह स्ट्रीमिंग',
        'व्हिडिओ एडिटिंग',
        'ग्राफिक्स डिझाइन'
      ]
    },
    features: {
      subtitle: 'सेवा',
      title: 'मी काय करतो',
      cards: {
        software: {
          id: 'software-development',
          title: 'सॉफ्टवेअर विकास',
          desc: 'तुमच्या व्यवसायासाठी योग्य असे सानुकूल एंटरप्राइझ सॉफ्टवेअर सोल्यूशन्स.'
        },
        app: {
          id: 'app-development',
          title: 'ॲप विकास',
          desc: 'आधुनिक तंत्रज्ञान वापरून अँड्रॉइड आणि आयओएससाठी उच्च-कार्यक्षमता मोबाइल ॲप्लिकेशन्स.'
        },
        web: {
          id: 'website-development',
          title: 'वेबसाइट विकास',
          desc: 'प्रतिसादात्मक आणि एसईओ-अनुकूल वेबसाइट्स ज्या ग्राहकांना आकर्षित करतात.'
        },
        media: {
          id: 'media-broadcasting',
          title: 'मीडिया आणि प्रसारण',
          desc: 'कार्यक्रमांसाठी व्यावसायिक लाइव्ह स्ट्रीमिंग आणि प्रसारण सेवा.'
        },
        video: {
          id: 'video-editing',
          title: 'व्हिडिओ संपादन',
          desc: 'सर्व प्रकारच्या डिजिटल सामग्रीसाठी उच्च दर्जाचे व्हिडिओ संपादन.'
        },
        marketing: {
          id: 'digital-marketing',
          title: 'डिजिटल मार्केटिंग',
          desc: 'तुमची ब्रँड व्हिजिबिलिटी वाढवण्यासाठी धोरणात्मक ऑनलाइन मार्केटिंग.'
        }
      }
    },
    serviceDetail: {
      'software-development': {
        title: 'सॉफ्टवेअर विकास',
        subtitle: 'एंटरप्राइझ सोल्यूशन्स',
        desc: 'आम्ही स्केलेबल, सुरक्षित आणि कार्यक्षम सॉफ्टवेअर सिस्टीम तयार करतो.',
        features: ['सानुकूल ईआरपी/सीआरएम सिस्टिम', 'डेटाबेस आर्किटेक्चर', 'डेस्कटॉप ॲप्लिकेशन्स', 'क्लाउड इन्फ्रास्ट्रक्चर'],
        projects: [
          { title: 'इन्व्हेंटरी मास्टर', desc: 'जागतिक किरकोळ साखळीसाठी रिअल-टाइम स्टॉक मॅनेजमेंट सिस्टीम.' },
          { title: 'सेफपास सीआरएम', desc: 'वित्तीय कंपन्यांसाठी सुरक्षित ग्राहक संबंध व्यवस्थापन.' }
        ],
        testimonials: [
          { quote: 'शुभमने विकसित केलेल्या ईआरपी सिस्टीममुळे दर आठवड्याला आमचे १५ तासांचे मॅन्युअल काम वाचले.', author: 'ॲलेक्स चेन, सीओओ' }
        ],
        tools: ['Node.js', 'PostgreSQL', 'Python', 'AWS']
      },
      'app-development': {
        title: 'ॲप विकास',
        subtitle: 'मोबाईल-फर्स्ट उत्कृष्टता',
        desc: 'आमची मोबाईल ॲप विकास प्रक्रिया वापरकर्ता अनुभव आणि कामगिरीवर लक्ष केंद्रित करते.',
        features: ['नेटिव्ह आयओएस आणि अँड्रॉइड', 'क्रॉस-प्लॅटफॉर्म विकास', 'ॲप स्टोअर ऑप्टिमायझेशन', 'एपीआय इंटिग्रेशन'],
        projects: [
          { title: 'फिटसिंक ॲप', desc: 'रिअल-टाइम सिंकिंगसह मल्टी-प्लॅटफॉर्म फिटनेस ट्रॅकिंग ॲप्लिकेशन.' },
          { title: 'एडुकनेक्ट', desc: 'शिक्षक आणि पालकांसाठी शाळा व्यवस्थापन ॲप.' }
        ],
        testimonials: [
          { quote: 'नवीन मोबाईल ॲप लाँच केल्यानंतर आमचा यूजर एंगेजमेंट तीन पटीने वाढला.', author: 'मारिया रॉड्रिग्ज, प्रॉडक्ट लीड' }
        ],
        tools: ['React Native', 'Firebase', 'Flutter', 'Swift']
      },
      'website-development': {
        title: 'वेबसाइट विकास',
        subtitle: 'आधुनिक वेब उपस्थिती',
        desc: "वेगवान, प्रतिसादात्मक आणि दिसायला सुंदर वेबसाइट्स आम्ही तयार करतो.",
        features: ['रिएक्ट आणि नेक्स्ट जेएस विकास', 'ई-कॉमर्स सोल्युशन्स', 'परफॉर्मन्स ऑप्टिमायझेशन', 'प्रतिसादात्मक यूआय डिझाइन'],
        projects: [
          { title: 'इकोशॉप ई-कॉम', desc: 'उच्च-कार्यक्षमता ई-कॉमर्स स्टोअर.' },
          { title: 'देवपोर्टफोलियो', desc: 'तंत्रज्ञान तज्ञांसाठी एनिमेटेड व्यावसायिक पोर्टफोलिओ.' }
        ],
        testimonials: [
          { quote: 'लोडिंग स्पीडमध्ये लक्षणीय सुधारणा झाली, ज्यामुळे व्यवसायात २०% वाढ झाली.', author: 'जेम्स विल्सन, मार्केटिंग डायरेक्टर' }
        ],
        tools: ['React', 'Next.js', 'Tailwind CSS', 'Vercel']
      },
      'media-broadcasting': {
        title: 'मीडिया आणि प्रसारण',
        subtitle: 'लाइव्ह स्ट्रीम उत्पादन',
        desc: 'कार्यक्रम आणि कॉर्पोरेट सादरीकरणासाठी व्यावसायिक लाइव्ह स्ट्रीमिंग सेवा.',
        features: ['मल्टी-कॅमेरा प्रोडक्शन', 'प्लॅटफॉर्म इंटिग्रेशन', 'ओबीएस प्रोफेशनल सेटअप', 'सिग्नल व्यवस्थापन'],
        projects: [
          { title: 'ग्लोबल टेक समिट', desc: '३-दिवसांच्या आंतरराष्ट्रीय कार्यक्रमासाठी पूर्ण ४K लाइव्ह ब्रॉडकास्ट व्यवस्थापित केले.' },
          { title: 'प्रो-गेमिंग लीग', desc: 'कस्टम ग्राफिक ओव्वरलेसह लाइव्ह ईस्पोर्ट्स ब्रॉडकास्टिंग.' }
        ],
        testimonials: [
          { quote: 'आमच्या १२ तासांच्या मॅरेथॉन स्ट्रीम दरम्यान कोणतीही तांत्रिक अडचण आली नाही.', author: 'केविन पार्क, इव्हेंट मॅनेजर' }
        ],
        tools: ['OBS Studio', 'vMix', 'Blackmagic Design', 'NDI']
      },
      'video-editing': {
        title: 'व्हिडिओ संपादन',
        subtitle: 'गोष्ट गतिमान',
        desc: 'व्यावसायिक पोस्ट-प्रोडक्शन जे तुमच्या व्हिडिओंना अधिक प्रभावी बनवते.',
        features: ['व्यावसायिक संपादन', 'सोशल मीडिया शॉर्ट्स', 'डॉक्युमेंटरी पोस्ट-प्रोडक्शन', 'मोशन ग्राफिक्स'],
        projects: [
          { title: 'ट्रॅव्हल मेमोयर्स', desc: 'ट्रॅव्हल डॉक्युमेंटरीसाठी सिनेमॅटिक एडिटिंग.' },
          { title: 'ब्रँड स्टोरी', desc: 'उन्नत मोशन ग्राफिक्ससह कॉर्पोरेट नॅरेटिव्ह व्हिडिओ.' }
        ],
        testimonials: [
          { quote: 'आम्हाला अपेक्षित असलेल्या सिनेमॅटिक गुणवत्तेपेक्षाही अधिक चांगले आउटपुट मिळाले.', author: 'लिसा स्टर्लिंग, क्रिएटिव्ह डायरेक्टर' }
        ],
        tools: ['Adobe Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Audition']
      },
      'digital-marketing': {
        title: 'डिजिटल मार्केटिंग',
        subtitle: 'तुमचा ब्रँड वाढवा',
        desc: 'तुमची ऑनलाइन उपस्थिती वाढवण्यासाठी सर्वसमावेशक डिजिटल रणनीती.',
        features: ['सोशल मीडिया स्ट्रॅटेजी', 'एसईओ आणि एसईएम', 'कंटेंट मार्केटिंग', 'ॲनॅलिटिक्स आणि रिपोर्टिंग'],
        projects: [
          { title: 'ऑर्गेनिक ग्रोथ बूस्ट', desc: 'SaaS स्टार्टअपसाठी ट्रॅफिकमध्ये ३००% वाढ मिळवली.' },
          { title: 'ॲड-मास्टर कॅम्पेन', desc: 'स्थानिक सेवा व्यवसायांसाठी उच्च-आरओआय पीपीसी मोहिमा.' }
        ],
        testimonials: [
          { quote: 'मोहिमेच्या पहिल्या तीन महिन्यांतच आमचा परतावा (ROI) दुप्पट झाला.', author: 'टॉम हॅरिसन, संस्थापक' }
        ],
        tools: ['Google Ads', 'Meta Ads', 'Google Analytics', 'Semrush']
      }
    },
    courses: {
      subtitle: 'लर्निंग सेंटर',
      title: 'आमचे व्यावसायिक कोर्सेस',
      list: [
        {
          id: 'full-stack-dev',
          title: 'फुल स्टॅक डेव्हलपमेंट',
          desc: 'रिएक्ट आणि नोड जेएस मध्ये प्राविण्य मिळवा.',
          duration: '6 महिने',
          price: '₹24,999'
        },
        {
          id: 'ui-ux-design',
          title: 'UI/UX डिझाइन मास्टरक्लास',
          desc: 'फिगमा आणि आधुनिक डिझाइन तत्त्वे शिका.',
          duration: '3 महिने',
          price: '₹14,999'
        },
        {
          id: 'digital-marketing',
          title: 'डिजिटल मार्केटिंग स्ट्रॅटेजी',
          desc: 'सोशल मीडिया आणि सर्च इंजिनवर प्रभुत्व मिळवा.',
          duration: '2 महिने',
          price: '₹9,999'
        }
      ],
      cta: 'आताच प्रवेश घ्या',
      learnMore: 'अधिक जाणून घ्या'
    },
    courseDetail: {
      'full-stack-dev': {
        title: 'फुल स्टॅक डेव्हलपमेंट',
        subtitle: 'एक प्रोफेशनल वेब डेव्हलपर बना',
        overview: 'हा सर्वसमावेशक कोर्स तुम्हाला सुरुवातीपासून प्रोफेशनल फुल-स्टॅक डेव्हलपर बनवतो. तुम्ही MERN स्टॅक वापरून आधुनिक आणि कार्यक्षम वेब ॲप्लिकेशन्स तयार करायला शिकाल.',
        curriculum: [
          'फ्रंटएंड: HTML5, CSS3, JavaScript (ES6+)',
          'रिएक्ट फ्रेमवर्क: हुक्स, कॉन्टेक्स्ट, स्टेट मॅनेजमेंट',
          'बैकएंड: Node.js, Express.js आर्किटेक्चर',
          'डेटाबेस: MongoDB, डेटा मॉडेलिंग',
          'डिप्लॉयमेंट: CI/CD, AWS, Heroku'
        ],
        outcomes: ['रियल-वर्ल्ड प्रोजेक्ट्स तयार करा', 'जॉब प्लेसमेंट सपोर्ट', 'प्रीमियम प्रमाणपत्र'],
        mentorship: 'शुभमसोबत 1-on-1 मार्गदर्शक सत्र'
      },
      'ui-ux-design': {
        title: 'UI/UX डिझाइन मास्टरक्लास',
        subtitle: 'युजर-सेंट्रिक डिझाइनमध्ये प्राविण्य मिळवा',
        overview: 'वापरकर्त्यासाठी अनुकूल इंटरफेस तयार करण्याचे रहस्य शिका. वायरफ्रेमिंगपासून प्रोटोटाइपिंगपर्यंत, जगातील सर्वोत्तम डिझाइन टीम्सद्वारे वापरल्या जाणाऱ्या साधनांमध्ये प्रभुत्व मिळवा.',
        curriculum: [
          'डिझाइन तत्त्वे: रंग, टायपोग्राफी, ग्रिड',
          'Figma मध्ये वायरफ्रेमिंग आणि प्रोटोटाइपिंग',
          'वापरकर्ता संशोधन आणि व्यक्तिमत्व निर्मिती',
          'मोशनसह परस्परसंवाद डिझाइन',
          'डिझाइन सिस्टम आणि हँडऑफ'
        ],
        outcomes: ['प्रोफेशनल डिझाइन पोर्टफोलिओ', 'UI/UX प्रमाणपत्र', 'क्लायंट इंटरएक्शन कौशल्ये'],
        mentorship: 'साप्ताहिक पोर्टफोलिओ पुनरावलोकन'
      },
      'digital-marketing': {
        title: 'डिजिटल मार्केटिंग स्ट्रॅटेजी',
        subtitle: 'डेटासह व्यवसाय वाढवा',
        overview: 'ऑनलाइन वाढीची कला आत्मसात करा. Google, Meta आणि इतर प्लॅटफॉर्मवर ट्रॅफिक वाढवणे आणि जाहिरात मोहिमा व्यवस्थापित करणे शिका.',
        curriculum: [
          'एसईओ आणि कंटेंट मार्केटिंग धोरण',
          'PPC: Google Ads आणि Meta Ads',
          'ईमेल मार्केटिंग ऑटोमेशन',
          'कन्व्हर्जन रेट ऑप्टिमायझेशन (CRO)',
          'ॲनॅलिटिक्स आणि कामगिरी ट्रॅकिंग'
        ],
        outcomes: ['प्रमाणित डिजिटल मार्केटर', 'लाइव्ह कॅम्पेन मॅनेजमेंट', 'ग्रोथ धोरणे'],
        mentorship: 'रिअल-वर्ल्ड जाहिरात खर्च व्यवस्थापन'
      }
    },
    portfolio: {
      subtitle: 'माझ्या पोर्टफोलिओला भेट द्या आणि तुमची प्रतिक्रिया द्या',
      title: 'माझे आश्चर्यकारक प्रकल्प',
      filters: {
        all: 'सर्व',
        web: 'वेब',
        app: 'ॲप',
        design: 'डिझाइन',
        ai: 'एआय'
      },
      projects: [
        {
          id: 'dairy-management',
          title: 'डेअरी व्यवस्थापन प्रणाली',
          category: 'app',
          desc: 'दूध संकलन आणि वितरणासाठी एक संपूर्ण सोल्यूशन, ज्यामध्ये रिअल-टाइम डेटा ट्रॅकिंग आणि बिलिंगची वैशिष्ट्ये आहेत.',
          image: 'https://images.unsplash.com/photo-1528498033373-3c6c08e83363?auto=format&fit=crop&q=80&w=800',
          demoUrl: '/live/dairy-demo'
        },
        {
          id: 'agriculture-billing',
          title: 'अ‍ॅग्रोशॉप बिलिंग आणि व्यवस्थापन',
          category: 'app',
          desc: 'कृषी दुकानांसाठी सर्वसमावेशक बिलिंग आणि इन्वेंटरी व्यवस्थापन सॉफ्टवेअर, जेएसटी सुसंगतता आणि खते, बियाणे आणि कीटकनाशके व्यवस्थापन.',
          image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/agro-login'
        },
        {
          id: 'medical-prescription',
          title: 'मेडप्रिस्क्रिप्शन: डिजिटल मेडिकल इकोसिस्टम',
          category: 'web',
          desc: 'डॉक्टर, रुग्ण आणि फार्मसी यांच्यातील संवाद कार्यक्षमतेने आणि सुरक्षितपणे ऑप्टिमाइझ करण्यासाठी वैद्यकीय प्रिस्क्रिप्शनचे डिजिटलीकरण।',
          image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/med-login'
        },
        {
          id: 'school-erp',
          title: 'विद्यालय: एकात्मिक स्कूल ईआरपी',
          category: 'web',
          desc: 'एक व्यापक व्यवस्थापन व्यासपीठ जे उपस्थिती रेकॉर्ड, परीक्षा शुल्क खातेवही आणि गतिशील, शोभिवंत प्रमाणपत्र संकलनास समर्थन देते.',
          image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/live/school-erp'
        },
        {
          id: 'cricket-scoreboard',
          title: 'गल्लीस्कोअर: स्थानिक क्रिकेट मॅच स्कोरबोर्ड',
          category: 'app',
          desc: 'एक परस्परसंवादी, वेब-प्रतिसादात्मक स्थानिक क्रिकेट स्कोअरबोर्ड ज्यामध्ये इनिंग्सचे ऑटो-ट्रांझिशन, फलंदाज-गोलंदाज रोस्टर, लाइव्ह कॉमेंट्री आणि गेम रेकॉर्ड असू शकतात.',
          image: 'https://images.unsplash.com/photo-1531415080290-bc9854593f6f?q=80&w=2070&auto=format&fit=crop',
          demoUrl: '/live/cricket-scoreboard'
        },
        {
          id: 'cricket-auction',
          title: 'गल्लीस्कोअर: क्रिकेट खेळाडू लिलाव संच',
          category: 'app',
          desc: 'वास्तविक वेळेतील आयपीएल-शैलीतील खेळाडूंची बोली आणि फ्रँचायझी व्यवस्थापन सिम्युलेटर, ज्यामध्ये सानुकूल वेतन मर्यादा आणि सीएसव्ही एक्सपोर्ट समाविष्ट आहे.',
          image: 'https://images.unsplash.com/photo-1540747737956-37872de719e0?q=80&w=800&auto=format&fit=crop',
          demoUrl: '/live/cricket-auction'
        },
        {
          id: 'photography-portfolio',
          title: 'Lens & Light Studios: प्रीमियम फोटोग्राफी ब्रँड SPA',
          category: 'web',
          desc: 'संपादकीय फोटोग्राफी स्टुडिओसाठी एक प्रीमियम, अत्यंत परस्परसंवादी सिंगल पेज ॲप्लिकेशन, ज्यामध्ये डायनॅमिक गॅलरी आणि सुंदर व्हिज्युअल स्टोरीटेलिंग ट्रान्झिशन आहेत.',
          image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/photography-portfolio'
        },
        {
          id: 'ganpati-mandal',
          title: 'गणपती मंडळ: डिजिटल पावती व ईआरपी वेबॲप',
          category: 'app',
          desc: 'पारंपरिक पावती पुस्तकाला डिजिटल पर्याय देणारे, व्हॉट्सॲप शेअरिंग, लाइव्ह जमा-खर्च लेजर, स्वयंसेवक ड्युटी व लाइव्ह दर्शन असलेले संपूर्ण मंडळ व्यवस्थापन सॉफ्टवेअर.',
          image: 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/ganpati-mandal'
        },
        {
          id: 'cricket-toss',
          title: 'गल्लीस्कोअर: क्रिकेट डिजिटल टॉस सिम्युलेटर',
          category: 'app',
          desc: 'वास्तववादी 3D भौतिकी, वेब ऑडिओ ध्वनी, संघ व कर्णधार इनपुट, टॉस विजेता घोषणा आणि फलंदाजी/गोलंदाजी निर्णय कार्ड असलेले डिजिटल क्रिकेट टॉस व्यासपीठ.',
          image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
          demoUrl: '/live/cricket-toss'
        }
      ]
    },
    projectDetail: {
      'cricket-toss': {
        title: 'गल्लीस्कोअर: क्रिकेट डिजिटल टॉस सिम्युलेटर',
        subtitle: 'आयसीसी मानकांनुसार निष्पक्ष नाणेफेक आणि कर्णधार निर्णय सूट',
        role: 'फुल स्टॅक फ्रंटेंड इंजिनिअर',
        overview: 'स्थानिक क्रिकेट स्पर्धा, बॉक्स क्रिकेट आणि अधिकृत सामन्यांसाठी डिझाइन केलेले उच्च दर्जाचे डिजिटल नाणेफेक सिमुलेटर. यामध्ये वास्तववादी 3D नाणेफेक ॲनिमेशन, वेब ऑडिओ ध्वनी प्रभाव, सानुकूल संघ आणि कर्णधारांची नावे, अचूक टॉस विजेता गणना, फलंदाजी किंवा गोलंदाजी निवड आणि १-क्लिक व्हॉट्सॲप समरी शेअरिंग उपलब्ध आहे.',
        tech: ['React 18', 'TypeScript', '3D CSS Transforms', 'Web Audio API', 'Tailwind CSS', 'Framer Motion'],
        features: [
          'वास्तववादी 3D नाणेफेक: छापा (Heads) आणि काटा (Tails) दोन्ही बाजूंचे वास्तववादी परिवलन आणि खेळपट्टीवरील उसळी',
          'सानुकूल संघ आणि कर्णधार: टीम अ आणि टीम ब ची नावे व त्वरित प्रीसेट्स (भारत वि ऑस्ट्रेलिया, मुंबई वि चेन्नई)',
          'अधिकृत टॉस कॉलिंग: नाणेफेक कॉल करणाऱ्या संघाची निवड आणि अंदाज (छापा/काटा) यानुसार विजेत्याची घोषणा',
          'कर्णधार निर्णय निवड: टॉस जिंकल्यानंतर फलंदाजी (Bat First) किंवा गोलंदाजी (Bowl First) चा अधिकृत निर्णय लॉक करणे',
          'वेब ऑडिओ साउंड इफेक्ट्स: ब्राऊझर ऑडिओ ऑसिलेटरद्वारे तयार केलेला नाण्याचा खणखणीत आवाज आणि व्हिक्टरी ट्यून',
          'ब्रॉडकास्ट मॅच कार्ड: अधिकृत सामन्याचे समरी कार्ड जे त्वरित व्हॉट्सॲप ग्रुप्सवर १-क्लिकमध्ये पाठवता येते'
        ],
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/cricket-toss'
      },
      'ganpati-mandal': {
        title: 'गणपती मंडळ: डिजिटल पावती व ईआरपी वेबॲप',
        subtitle: 'पारंपारिक गणेशोत्सव आणि आधुनिक क्लाउड तंत्रज्ञानाचा सुरेख संगम',
        role: 'फुल स्टॅक प्रॉडक्ट इंजिनिअर',
        overview: 'महाराष्ट्रातील व जगभरातील सार्वजनिक गणेशोत्सव मंडळांसाठी आधुनिक डिजिटल व्यवस्थापन प्रणाली. कागदी पावती पुस्तके बदलून डिजिटल पावत्या, १-क्लिक व्हॉट्सॲप पावती पाठवणे, धर्मादाय आयुक्त नियमांनुसार जमा-खर्च हिशोब व ताळेबंद, स्वयंसेवक ड्युटी रोस्टर, ई-पास आणि भाविकांसाठी लाइव्ह दर्शन व नवस वॉल.',
        tech: ['React 18', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Recharts', 'QRCode.react', 'XLSX'],
        features: [
          'डिजिटल पावती पुस्तक: देवनागरी मराठी पावती, अक्षरी रक्कम आणि १-क्लिक व्हॉट्सॲप पावती',
          'खर्च व व्हाऊचर नोंदवही: मंडप, मूर्ती, ध्वनी, प्रसाद आणि वीज खर्च ट्रॅकिंग',
          'मंडळ परिचय व सूचना फलक: रिअल-टाइम घोषणा व कार्यकारी मंडळ सूची',
          'सभासद व स्वयंसेवक व्यवस्थापन: वर्गणी ट्रॅकर, आपत्कालीन रक्तपेढी व ड्युटी रोस्टर',
          'आरती व उत्सव वेळापत्रक: व्हीआयपी व ज्येष्ठ नागरिक क्यूआर ई-पास',
          'भाविक दर्शन व नवस वॉल: थेट लाइव्ह दर्शन फीड व संवादात्मक नवस फलक',
          'साहित्य व इन्व्हेंटरी साठा: पूजा साहित्य व साहित्य साठा नियंत्रण',
          'ऑडिट रेडी ताळेबंद अहवाल: आर्थिक आलेख व १-क्लिक एक्सेल हिशोब एक्सपोर्ट'
        ],
        image: 'https://images.unsplash.com/photo-1567591414240-e248b61c4fc9?q=80&w=1200&auto=format&fit=crop',
        demoUrl: '/live/ganpati-mandal'
      },
      'dairy-management': {
        title: 'डेअरी व्यवस्थापन प्रणाली',
        subtitle: 'एंटरप्राइझ दूध संकलन आणि बिलिंग',
        role: 'फुल स्टॅक डेव्हलपर',
        overview: 'स्थानिक डेअरींसाठी त्यांच्या पारंपारिक रेकॉर्ड-कीपिंगला डिजिटल बनवण्यासाठी एक विशेष सोल्यूशन. हे सकाळ आणि संध्याकाळच्या दूध संकलनाची प्रक्रिया सुव्यवस्थित करते, शेतकरी डेटाबेस व्यवस्थापित करते आणि फॅट आणि एसएनएफ टक्केवारीवर आधारित जटिल बिलिंग गणना स्वयंचलित करते.',
        tech: ['React 18', 'TypeScript', 'Firebase Firestore', 'Tailwind CSS', 'Framer Motion'],
        features: [
          'ऑटो-फिलसह युनिक शेतकरी आयडी सिस्टम',
          'स्वयंचलित सकाळ/संध्याकाळ शिफ्ट रेकॉर्डिंग',
          'त्वरित बिलिंग गणना',
          'वैयक्तिक शेतकरी लेझर (शीट)',
          'मासिक सारांशसह मालक डॅशबोर्ड',
          'रिअल-टाइम डेटा स्थिरता',
          'मालकासाठी क्लाउड-आधारित ॲक्सेस'
        ],
        image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=1200',
        demoUrl: '/live/dairy-demo'
      },
      'agriculture-billing': {
        title: 'अ‍ॅग्रोशॉप बिलिंग आणि व्यवस्थापन',
        subtitle: 'संपूर्ण अ‍ॅग्रो-शॉप ईआरपी',
        role: 'फुल स्टॅक डेव्हलपर',
        overview: 'ग्रामीण भागातील कृषी किरकोळ दुकानांसाठी विशेषतः डिझाइन केलेली एक सर्वसमावेशक बिलिंग आणि इन्व्हेंटरी व्यवस्थापन प्रणाली. हे बियाणे, खते आणि कीटकनाशकांच्या जटिल इन्व्हेंटरी हाताळते, जीएसटी अनुपालनाचे व्यवस्थापन करते आणि दुकान मालकांना हंगामी विक्रीचे नमुने ट्रॅक करण्यासाठी तपशीलवार विश्लेषण प्रदान करते.',
        tech: ['React 18', 'TypeScript', 'Firebase Firestore', 'Tailwind CSS', 'Chart.js'],
        features: [
          'जीएसटी-रेडी बीजक आणि बिलिंग',
          'बियाणे/खतांसाठी इन्व्हेंटरी व्यवस्थापन',
          'ग्राहक क्रेडिट (उधार) ट्रॅकिंग',
          'पुरवठादार व्यवस्थापन आणि खरेदी आदेश',
          'हंगामी विक्री विश्लेषण आणि अहवाल',
          'मोबाईल-फ्रेंडली ओनर डॅशबोर्ड',
          'ग्रामीण भागासाठी ऑफलाइन मोड सपोर्ट'
        ],
        image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/agro-demo'
      },
      'medical-prescription': {
        title: 'मेडप्रिस्क्रिप्शन: डिजिटल मेडिकल इकोसिस्टम',
        subtitle: 'औषधे लिहून देण्याचा सर्वात कार्यक्षम मार्ग',
        role: 'फुल स्टॅक डेव्हलपर',
        overview: 'वैद्यकीय प्रिस्क्रिप्शनचे डिजिटलीकरण सर्व पक्षांसाठी प्रभावी, थेट आणि सुरक्षित मार्गाने डॉक्टर-रुग्ण - फार्मसी यांच्यातील संवाद सुलभ करते. हे वेळ वाचवते, रुग्णांची काळजी सुधारते आणि प्रिस्क्रिप्शन किंवा औषधांच्या नूतनीकरणासाठी अनावश्यक प्रवास टाळून आरोग्य व्यवस्थेच्या शाश्वततेमध्ये योगदान देते. हे प्लॅटफॉर्म सध्याच्या कायद्याचे पालन सुनिश्चित करते आणि क्लाउड-आधारित प्रोफाइलद्वारे औषध व्यवस्थापन सोपे करते.',
        tech: ['React 18', 'TypeScript', 'Firebase', 'Node.js', 'SMS/Email API'],
        features: [
          'त्वरित प्रिस्क्रिप्शन: सेकंदात प्रिस्क्रिप्शन तयार करा, प्रिंट करा किंवा शेअर करा',
          'आवडते प्रिस्क्रिप्शन: जलद निदानासाठी पूर्व-निर्धारित टेम्पलेट्स',
          'रुग्णांचा ऑनलाइन सल्ला: शुल्क स्वीकारा, अपॉइंटमेंट आणि व्हिडिओ सल्ला व्यवस्थापित करा',
          'तुमच्या गरजेनुसार सानुकूलित: तुमच्या प्रॅक्टिसच्या गरजेनुसार मेडप्रिस्क्रिप्शन अनुकूल आहे',
          'उपचार इतिहास ट्रॅक करा: ॲपवरून रुग्ण रेकॉर्डमध्ये त्वरित प्रवेशासह वेळ वाचवा',
          'अहवाल तयार करा: क्लिनिकल संशोधन, अभ्यास किंवा आरोग्य नमुन्यांसाठी सोपे अहवाल',
          'सुलभ रुग्ण व्यवस्थापन: कधीही कुठेही सुरक्षितपणे सर्व डेटा ॲक्सेस करा',
          'महत्त्वाचे स्मरणपत्रे: औषधे आणि पाठपुराव्यासाठी स्वयंचलित एसएमएस/ईमेल',
          'नोट्स आणि प्रतिमा व्यवस्थापित करा: रेकॉर्ड व्यवस्थापनातील वेळ आणि खर्च वाचवा',
          'सुरक्षित आणि स्वतःचे रेकॉर्ड: सुरक्षितता सुनिश्चित करून केवळ तुमचीच प्रवेशाची खात्री'
        ],
        image: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/med-demo'
      },
      'school-erp': {
        title: 'विद्यालय: एकात्मिक शाळा ईआरपी सुईट',
        subtitle: 'एंटरप्राइझ शाळा व्यवस्थापन, उपस्थिती आणि प्रमाणपत्रे',
        role: 'फुल स्टॅक डेव्हलपर',
        overview: 'एक उच्च-विश्वासार्ह संस्थात्मक ईआरपी आणि प्रशासकीय प्रवेशद्वार ज्याला "विद्यालय" म्हटले जाते. शाळा, महाविद्यालये आणि जिल्हा शिक्षण पोर्टल्स स्वयंचलित करण्यासाठी डिझाइन केलेले, हे सुईट स्थानिक विद्यार्थी नोंदवही व्यवस्थापित करते, डायनॅमिक ग्रिड्समध्ये दैनंदिन उपस्थितीचे निरीक्षण करते, सानुकूल पावत्यांसह टर्म-निहाय परीक्षा शुल्क रेकॉर्ड ट्रॅक करते, आणि एक शोभिवंत प्रमाणपत्र निर्माता प्रदान करते जे सानुकूल डिजिटल स्टॅम्प आणि वॉटरमार्कसह उच्च-रिझोल्यूशन मुद्रणयोग्य पुरस्कार पीडीएफ व्युत्पन्न करते.',
        tech: ['React 18', 'TypeScript', 'Motion / Framer Motion', 'Tailwind CSS', 'Faux-Print Engines', 'HTML Canvas'],
        features: [
          'परस्परसंवादी प्रशासक आकडेवारी आणि प्रगती डॅशबोर्ड',
          'विद्यार्थी उपस्थितीसाठी डायनॅमिक ग्रिड-शैली ट्रॅकर',
          'दुहेरी हप्ता नियंत्रण असलेले सत्र-निहाय परीक्षा शुल्क खातेवही',
          '१-क्लिक शोभिवंत प्रमाणपत्र टेम्पलेट संकलक',
          'रिअल-टाइम डिजिटल शिक्के, स्वाक्षरी आणि सानुकूल वॉटरमार्क',
          'स्वयंचलित पावती आणि दस्तऐवज डाउनलोड इंजिन',
          'डेमोडेटा फ्लशसह स्वयंचलित लोकलस्टोरेज क्लायंट स्टेट सिंक्रोनाइझेशन',
          'मोबाईल स्लाईडर आणि साईडबारला सपोर्ट करणारे पूर्णपणे रिस्पॉन्सिव्ह डिझाइन'
        ],
        image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=2070&auto=format&fit=crop',
        demoUrl: '/live/school-erp'
      }
    },
    chatbot: {
      title: 'शुभम सहाय्यक',
      placeholder: ' मला काहीही विचारा...',
      welcome: 'नमस्कार! मी शुभम एआय आहे. मी आज तुम्हाला कशी मदत करू शकतो?',
      welcomeUser: 'स्वागत आहे, {name}! ',
      welcomeHero: "नमस्कार! मी शुभमचा एआय ट्विन आहे. माझे इंजिनिअरिंग आणि डिझाइनचे जग पाहण्यासाठी तयार आहात का?",
      welcomeFeatures: "सेवांमध्ये रस आहे का? मी तुमच्यासाठी सॉफ्टवेअर, ॲप्स किंवा डिजिटल मार्केटिंगचे तपशील सविस्तर सांगू शकतो!",
      welcomeResume: "माझा बायोडेटा हा एक मोठा प्रवास आहे! तुम्हाला माझ्या तांत्रिक साधनांबद्दल किंवा नामांकित कंपन्यांमधील अनुभवाबद्दल अधिक जाणून घ्यायचे आहे का?",
      welcomePortfolio: "प्रत्येक प्रकल्पाची एक गोष्ट असते. तुम्हाला कशाबद्दल जाणून घ्यायची उत्सुकता आहे? केस स्टडीज की थेट प्रात्यक्षिके?",
      welcomeContact: "चला काहीतरी भव्य निर्माण करूया! तुम्हाला काही विचारपूस करायची आहे का किंवा शुभमसोबत कॉल ठरवायचा आहे का?",
      error: 'क्षमस्व, मला आता विचार करण्यात काही अडचण येत आहे. कृपया पुन्हा प्रयत्न करा.'
    },
    aiChat: {
      subtitle: 'एआय संचलित सहाय्यक',
      title: 'माझ्या एआय ट्विनशी चॅट करा',
      desc: 'माझ्या कामाबद्दल, कौशल्याबद्दल किंवा उपलब्धतेबद्दल प्रश्न आहेत? माझा एआय सहाय्यक माझ्या संपूर्ण पोर्टफोलिओवर प्रशिक्षित आहे आणि तुम्हाला त्वरित मदत करू शकतो.',
      cta: 'संवाद सुरू करा'
    },
    newsLaunchpad: {
      subtitle: 'न्यूज स्टार्टअप लॉन्चपॅड',
      title: 'तुमची न्यूज एजन्सी सुरू करा',
      desc: 'आम्ही नवीन न्यूज मालकांना सर्व तांत्रिक आणि कायदेशीर साहाय्यासह त्यांचा मीडिया व्यवसाय सुरू करण्यास मदत करतो.',
      features: [
        { title: 'RNI नोंदणी', desc: 'RNI नोंदणीसाठी टप्प्याटप्प्याने मार्गदर्शन.' },
        { title: 'व्यावसायिक वेबसाइट', desc: 'रिअल-टाइम अपडेट्स आणि कमाईसह सुरक्षित न्यूज पोर्टल.' },
        { title: 'कायदेशीर आणि अनुपालन', desc: 'विविध न्यूज मीडिया परवान्यांसाठी कागदपत्रे साहायय.' },
        { title: 'डिजिटल स्ट्रॅटेजी', desc: 'नवीन न्यूज स्टार्टअप्ससाठी कंटेंट स्ट्रॅटेजी आणि सोशल मीडिया ग्रोथ.' }
      ],
      cta: 'सुरू करा'
    },
    resume: {
      subtitle: '७+ वर्षांचा अनुभव',
      title: 'माझा बायोडेटा',
      tabs: {
        education: 'शिक्षण',
        skills: 'व्यावसायिक कौशल्ये',
        experience: 'अनुभव',
        interview: 'मुलाखत'
      },
      edu: {
        title: 'शिक्षण गुणवत्ता',
        comp: 'संगणक अभियांत्रिकी',
        uni: 'तंत्रज्ञान विद्यापीठ (२०१४ - २०१८)',
        high: 'उच्च माध्यमिक',
        college: 'सायन्स कॉलेज (२०१२ - २०१४)',
        cert: 'प्रमाणपत्रे',
        full: 'फुल स्टॅक वेब डेव्हलपमेंट',
        coursera: 'कौरसेरा स्पेशलायझेशन',
        gcp: 'गुगल क्लाउड प्रमाणित',
        google: 'गुगल क्लाउड प्लॅटफॉर्म'
      },
      skills: {
        dev: 'विकास कौशल्ये',
        graph: 'ग्राफिक आणि साधने'
      },
      exp: {
        job: 'नोकरीचा अनुभव',
        sr: 'वरिष्ठ सॉफ्टवेअर अभियंता',
        google: 'गुगल (२०२० - वर्तमान)',
        web: 'वेब डेव्हलपर',
        meta: 'मेटा (२०१८ - २०२०)',
        free: 'फ्रीलांस काम',
        creative: 'क्रिएटिव्ह लीड',
        upwork: 'अपवर्क (२०१६ - वर्तमान)',
        consultant: 'ॲप सल्लागार',
        startup: 'स्टार्टअप हब (२०१७ - २०१८)'
      },
      interview: {
        tech: 'तांत्रिक मुलाखती',
        algo: 'अल्गोरिदम तज्ञ',
        leet: 'लीटकोड ५००+',
        design: 'सिस्टम डिझाइन',
        prep: 'तांत्रिक मुलाखत तयारी',
        hire: 'मला आजच कामावर घ्या',
        hireDesc: "मी नवीन आव्हानांसाठी आणि रोमांचक प्रकल्पांसाठी तयार आहे जे तंत्रज्ञानाच्या सीमा ओलांडतात.",
        book: 'मुलाखत बुक करा'
      }
    },
    testimonial: {
      subtitle: 'ग्राहक काय म्हणतात',
      title: 'क्लाइंट कथा',
      list: [
        {
          name: 'मार्टिन गोमेझ',
          role: 'ऑपरेशन मॅनेजर',
          company: 'रेनबो आयटी',
          project: 'अँड्रॉइड ॲप डेव्हलपमेंट',
          date: 'ऑगस्ट २०२१',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
          quote: '"शुभम हा एक विलक्षण अभियंता आहे. त्याच्या डेअरी सॉफ्टवेअरने आमचे दूध संकलन आणि शेतकरी व्यवस्थापनाच्या पद्धतीत क्रांती घडवून आणली आहे."'
        },
        {
          name: 'सारा जेन्किंस',
          role: 'डेअरी मालक',
          company: 'ग्रीन व्हॅली मिल्क',
          project: 'दूध संकलन प्रणाली',
          date: 'दिसंबर २०२२',
          image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400',
          quote: '"स्वयंचलित बिलिंग प्रणालीने आमचे तासनतास मॅन्युअल कॅल्क्युलेशन वाचवले. कोणत्याही आधुनिक डेअरी व्यवसायासाठी अत्यंत शिफारस करतो."'
        },
        {
          name: 'राजेन मेहता',
          role: 'लॉजिस्टिक्स हेड',
          company: 'इंडोडेअरी ग्रुप',
          project: 'वितरण नेटवर्क',
          date: 'जानेवारी २०२४',
          image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
          quote: '"सुरक्षित आणि विश्वासार्ह. दूध संकलन केंद्रांच्या रिअल-टाइम ट्रॅकिंगने आम्हाला पूर्ण पारदर्शकता दिली आहे."'
        }
      ]
    },
    clients: {
      subtitle: 'लोकप्रिय ग्राहक',
      title: 'उत्कृष्ट ग्राहक'
    },
    blog: {
      subtitle: 'माझ्या ब्लॉगला भेट द्या आणि तुमची प्रतिक्रिया द्या',
      title: 'माझा ब्लॉग',
      posts: [
        { category: 'डेव्हलपमेंट', time: '५ मिनिटे वाचन', title: 'सर्वोत्कृष्ट सॉफ्टवेअर डेव्हलपमेंट प्लॅटफॉर्म' },
        { category: 'टेक', time: '४ मिनिटे वाचन', title: 'आधुनिक रिएक्ट डिझाइन पॅटर्न्स' }
      ]
    },
    contact: {
      subtitle: 'संपर्कात राहा',
      title: 'व्यावसायिक संपर्क',
      desc: 'तुमच्या मनात एखादा विशिष्ट प्रकल्प असो किंवा तुम्हाला फक्त हाय म्हणायचे असेल, माझा इनबॉक्स नेहमीच उघडा असतो.',
      info: {
        title: 'शुभम हिंगणे',
        job: 'संगणक अभियंता आणि वरिष्ठ विकसक',
        desc: "मी नाविन्यपूर्ण फ्रीलांस प्रकल्प आणि दीर्घकालीन सहकार्यासाठी उपलब्ध आहे. चला मिळून काहीतरी विलक्षण तयार करूया.",
        call: 'मला कॉल करा',
        phone: '+91-7719959593',
        email: 'मला ईमेल करा',
        emailAddr: 'info@shubhamhingane.in',
        hours: 'कामाच्या वेळा',
        monfri: 'सोम - शुक्र: सकाळी ९:०० - संध्याकाळी ६:००',
        network: 'माझ्याशी कनेक्ट व्हा'
      },
      form: {
        name: 'तुमचे नाव',
        phone: 'फोन नंबर',
        email: 'ईमेल',
        subject: 'विषय',
        message: 'तुमचा संदेश',
        placeholder: {
          name: 'उदा. जॉन डो',
          phone: '+१ २३४ ५६७ ८९०',
          email: 'name@example.com',
          subject: 'आम्ही काय तयार करत आहोत?',
          message: 'मला तुमच्या आवश्यकतांबद्दल अधिक सांगा...'
        },
        send: 'संदेश पाठवा',
        back: "मी २४ तासांच्या आत तुमच्याशी संपर्क साधेन"
      }
    },
    footer: {
      rights: '© २०२६. शुभम हिंगणेद्वारे सर्व हक्क राखीव.'
    }
  }
};
