import { IDCardDesign, Student, TemplateStyle } from '../types/idCard';

// Embedded crisp SVG Data URIs for offline instant logos & signatures
export const PRESET_EMBLEMS = {
  university: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <path d="M50 10 L85 24 L85 55 C85 75 50 92 50 92 C50 92 15 75 15 55 L15 24 Z" fill="#0f2942" stroke="#d4af37" stroke-width="4"/>
      <path d="M50 20 L75 31 L75 52 C75 67 50 81 50 81 C50 81 25 67 25 52 L25 31 Z" fill="#1e3a5f" />
      <path d="M50 28 L62 44 L38 44 Z" fill="#d4af37" />
      <path d="M35 52 H65 V56 H35 Z M40 60 H60 V64 H40 Z" fill="#d4af37" />
      <circle cx="50" cy="48" r="3" fill="#ffffff" />
    </svg>
  `)}`,
  technology: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <polygon points="50,8 88,30 88,70 50,92 12,70 12,30" fill="#09090b" stroke="#06b6d4" stroke-width="4" />
      <polygon points="50,22 75,37 75,63 50,78 25,63 25,37" fill="#18181b" stroke="#38bdf8" stroke-width="2" />
      <circle cx="50" cy="50" r="12" fill="#06b6d4" />
      <circle cx="50" cy="50" r="6" fill="#ffffff" />
      <line x1="50" y1="22" x2="50" y2="38" stroke="#06b6d4" stroke-width="3" />
      <line x1="50" y1="62" x2="50" y2="78" stroke="#06b6d4" stroke-width="3" />
    </svg>
  `)}`,
  medical: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="42" fill="#065f46" stroke="#34d399" stroke-width="4"/>
      <rect x="42" y="24" width="16" height="52" rx="4" fill="#ffffff"/>
      <rect x="24" y="42" width="52" height="16" rx="4" fill="#ffffff"/>
      <circle cx="50" cy="50" r="6" fill="#065f46" />
    </svg>
  `)}`,
  corporate: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
      <rect x="15" y="15" width="70" height="70" rx="16" fill="#1e293b" stroke="#f59e0b" stroke-width="4" />
      <path d="M30 65 L45 35 L60 50 L75 30" stroke="#f59e0b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="75" cy="30" r="5" fill="#ffffff" />
    </svg>
  `)}`
};

export const PRESET_SIGNATURE = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 70" fill="none">
    <path d="M15 50 C30 20, 45 60, 60 30 C75 10, 85 45, 100 25 C115 15, 125 55, 140 20 C155 35, 170 30, 185 45" stroke="#1e293b" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M40 55 C70 52, 120 50, 175 48" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </svg>
`)}`;

export interface DemoProfile {
  id: string;
  label: string;
  badge: string;
  iconName: string;
  design: Partial<IDCardDesign>;
  student: Student;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'student-academic',
    label: 'University Scholar',
    badge: 'Student ID',
    iconName: 'GraduationCap',
    design: {
      name: 'Academic Scholar Template',
      orientation: 'portrait',
      templateStyle: 'classic',
      primaryColor: '#0f2942',
      secondaryColor: '#c59b27',
      textColor: '#0f172a',
      borderColor: '#e2e8f0',
      watermarkText: 'VERIFIED SCHOLAR',
      watermarkOpacity: 0.08,
      institutionName: 'STANFORD METROPOLITAN UNIVERSITY',
      institutionLogo: PRESET_EMBLEMS.university,
      authorizedSignature: PRESET_SIGNATURE,
      fontSizeName: 16,
      fontSizeDetails: 11,
      fontFamily: 'Inter',
      hideBarcode: false,
      hideQRCode: false,
      showSmartChip: true,
      showHologram: true
    },
    student: {
      id: 'STU-2026-8841',
      name: 'Alexandre Rivera',
      role: 'Student',
      department: 'Computer Science & AI',
      bloodGroup: 'O+',
      dob: '2004-09-18',
      validUntil: '2028-06-30',
      emergencyContact: '+1 (555) 439-0129',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      status: 'Active',
      createdAt: '2026-09-01T08:00:00.000Z'
    }
  },
  {
    id: 'faculty-professor',
    label: 'Department Dean',
    badge: 'Faculty Badge',
    iconName: 'BookOpen',
    design: {
      name: 'Faculty Executive Gold',
      orientation: 'portrait',
      templateStyle: 'modern',
      primaryColor: '#1e3a8a',
      secondaryColor: '#3b82f6',
      textColor: '#1e293b',
      borderColor: '#cbd5e1',
      watermarkText: 'FACULTY OF SCIENCES',
      watermarkOpacity: 0.1,
      institutionName: 'INSTITUTE OF APPLIED SCIENCES',
      institutionLogo: PRESET_EMBLEMS.technology,
      authorizedSignature: PRESET_SIGNATURE,
      fontSizeName: 16,
      fontSizeDetails: 11,
      fontFamily: 'Inter',
      hideBarcode: false,
      hideQRCode: false,
      showSmartChip: true,
      showHologram: true
    },
    student: {
      id: 'FAC-7704-DEAN',
      name: 'Dr. Sarah M. Chen',
      role: 'Faculty',
      department: 'Dept of Cognitive Neuroscience',
      bloodGroup: 'A+',
      dob: '1982-04-14',
      validUntil: '2030-12-31',
      emergencyContact: '+1 (555) 912-3344',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop',
      status: 'Active',
      createdAt: '2026-09-01T08:00:00.000Z'
    }
  },
  {
    id: 'corporate-executive',
    label: 'Cloud Architect',
    badge: 'Corporate Staff',
    iconName: 'Briefcase',
    design: {
      name: 'Cyber Security Titanium',
      orientation: 'landscape',
      templateStyle: 'corporate',
      primaryColor: '#0f172a',
      secondaryColor: '#f59e0b',
      textColor: '#0f172a',
      borderColor: '#e2e8f0',
      watermarkText: 'AUTHORIZED LEVEL 4',
      watermarkOpacity: 0.08,
      institutionName: 'SYNAPSE GLOBAL AEROSPACE',
      institutionLogo: PRESET_EMBLEMS.corporate,
      authorizedSignature: PRESET_SIGNATURE,
      fontSizeName: 16,
      fontSizeDetails: 11,
      fontFamily: 'Inter',
      hideBarcode: false,
      hideQRCode: false,
      showSmartChip: true,
      showHologram: true
    },
    student: {
      id: 'EXEC-0092-SEC',
      name: 'Marcus E. Vance',
      role: 'Staff',
      department: 'Global Security & Cloud Infrastructure',
      bloodGroup: 'B+',
      dob: '1988-11-03',
      validUntil: '2029-08-15',
      emergencyContact: '+1 (555) 808-9921',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
      status: 'Active',
      createdAt: '2026-09-01T08:00:00.000Z'
    }
  },
  {
    id: 'medical-specialist',
    label: 'Trauma Specialist',
    badge: 'Medical Staff',
    iconName: 'Activity',
    design: {
      name: 'Clinical Health Emerald',
      orientation: 'portrait',
      templateStyle: 'minimal',
      primaryColor: '#065f46',
      secondaryColor: '#10b981',
      textColor: '#064e3b',
      borderColor: '#a7f3d0',
      watermarkText: 'HOSPITAL STAFF ID',
      watermarkOpacity: 0.07,
      institutionName: 'ST. JUDE METROPOLITAN HOSPITAL',
      institutionLogo: PRESET_EMBLEMS.medical,
      authorizedSignature: PRESET_SIGNATURE,
      fontSizeName: 16,
      fontSizeDetails: 11,
      fontFamily: 'Inter',
      hideBarcode: false,
      hideQRCode: false,
      showSmartChip: true,
      showHologram: true
    },
    student: {
      id: 'MED-5501-MD',
      name: 'Dr. Priya K. Sharma',
      role: 'Staff',
      department: 'Emergency & Critical Care Medicine',
      bloodGroup: 'AB+',
      dob: '1989-07-22',
      validUntil: '2029-03-31',
      emergencyContact: '+1 (555) 674-8890',
      photo: 'https://images.unsplash.com/photo-1594824813512-6872a39226cf?q=80&w=600&auto=format&fit=crop',
      status: 'Active',
      createdAt: '2026-09-01T08:00:00.000Z'
    }
  }
];

export const COLOR_PALETTES = [
  {
    id: 'navy-gold',
    name: 'Oxford Navy & Gold',
    primary: '#0f2942',
    secondary: '#c59b27',
    border: '#cbd5e1'
  },
  {
    id: 'tech-blue',
    name: 'Cyber Cobalt & Cyan',
    primary: '#1e3a8a',
    secondary: '#06b6d4',
    border: '#93c5fd'
  },
  {
    id: 'emerald-eco',
    name: 'Clinical Emerald & Mint',
    primary: '#065f46',
    secondary: '#10b981',
    border: '#a7f3d0'
  },
  {
    id: 'crimson-onyx',
    name: 'Regal Crimson & Ruby',
    primary: '#7f1d1d',
    secondary: '#b91c1c',
    border: '#fca5a5'
  },
  {
    id: 'charcoal-amber',
    name: 'Executive Slate & Amber',
    primary: '#0f172a',
    secondary: '#f59e0b',
    border: '#cbd5e1'
  },
  {
    id: 'swiss-minimal',
    name: 'Swiss Monochrome & Charcoal',
    primary: '#18181b',
    secondary: '#52525b',
    border: '#e4e4e7'
  }
];
