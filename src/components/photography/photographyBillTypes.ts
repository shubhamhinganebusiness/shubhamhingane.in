/**
 * Lens & Light Studios - Photography Billing & Invoicing Types & Catalog
 */

export type PricingModel = 'flat' | 'hourly' | 'daily' | 'per_image' | 'per_session';

export interface PhotographyBillItem {
  id: string;
  serviceCategory: 'wedding' | 'pre-wedding' | 'cinematography' | 'portraits' | 'reels' | 'album' | 'drone' | 'gear' | 'custom';
  description: string;
  deliverables: string;
  pricingModel?: PricingModel;
  unitLabel?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
export type PaymentMethod = 'UPI / QR' | 'Bank Transfer (NEFT/IMPS)' | 'Credit / Debit Card' | 'Stripe' | 'PayPal' | 'Square' | 'Cash';

export interface PaymentMilestone {
  id: string;
  title: string;
  percentage: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  paidAmount?: number;
  transactionRef?: string;
  paymentGateway?: 'Stripe' | 'PayPal' | 'Square' | 'UPI' | 'Bank Transfer' | 'Cash';
  notes?: string;
}

export interface LateFeeConfig {
  enabled: boolean;
  feeType: 'percent' | 'flat';
  value: number; // e.g. 2 for 2% or 1500 for flat
  gracePeriodDays: number; // e.g. 3 days
  frequency?: 'flat_once' | 'daily' | 'monthly';
}

export interface ReminderLog {
  id: string;
  sentAt: string;
  channel: 'email' | 'whatsapp' | 'sms';
  stage: 'upcoming' | 'due_today' | 'overdue' | 'urgent';
  recipient: string;
  messagePreview: string;
}

export interface OnlinePaymentTransaction {
  id: string;
  timestamp: string;
  gateway: 'Stripe' | 'PayPal' | 'Square' | 'UPI' | 'Bank Transfer';
  amount: number;
  currency: string;
  paymentIntentId: string;
  clientEmail: string;
  status: 'succeeded' | 'pending' | 'failed';
  paymentMethodDetails?: string;
  milestoneTitle?: string;
  milestoneId?: string;
}

export interface ContractClause {
  id: string;
  title: string;
  content: string;
  isMandatory: boolean;
  selected: boolean;
}

export type ContractStatus = 'draft' | 'client_signed' | 'fully_executed';

export interface PhotographyContract {
  enabled: boolean;
  contractNumber: string;
  createdAt: string;
  agreedAt?: string;
  clientSignerName: string;
  clientSignatureDataUrl?: string;
  clientSignedAt?: string;
  photographerSignerName: string;
  photographerSignatureDataUrl?: string;
  photographerSignedAt?: string;
  clauses: ContractClause[];
  status: ContractStatus;
  notes?: string;
}

export interface DeliveryVault {
  enabled: boolean;
  galleryUrl: string;
  previewUrl?: string;
  downloadPin?: string;
  totalFilesCount?: number;
  fileSizeBytes?: string;
  resolutionSpecs?: string;
  cloudProvider?: 'Pixieset' | 'Google Drive' | 'WeTransfer' | 'Dropbox' | 'Custom Cloud';
  expiryDate?: string;
  vaultNotes?: string;
  isManualOverrideUnlocked?: boolean;
  deliveredAt?: string;
}

export interface PhotographyBill {
  id: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress?: string;
  eventTitle: string;
  eventType: string;
  eventDates: string;
  eventVenue: string;
  items: PhotographyBillItem[];
  subtotal: number;
  discountType: 'percent' | 'flat';
  discountValue: number;
  discountAmount: number;
  taxType: 'gst18' | 'gst12' | 'gst5' | 'none';
  taxRate: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  upiId: string;
  notes: string;
  terms: string[];

  // Retainer & Deposit Milestones
  milestones?: PaymentMilestone[];
  retainerRequired?: number;
  retainerPaid?: boolean;

  // Automated Late Fee
  lateFeeConfig?: LateFeeConfig;
  lateFeeApplied?: boolean;
  lateFeeAmount?: number;
  daysOverdue?: number;

  // Auto Reminders
  reminderLogs?: ReminderLog[];
  lastReminderSentAt?: string;

  // Online Payments
  transactions?: OnlinePaymentTransaction[];
  onlinePaymentUrl?: string;

  // Legal Shoot Contract & E-Signature
  contract?: PhotographyContract;

  // Payment-Gated Delivery Vault
  deliveryVault?: DeliveryVault;

  createdAt: string;
  updatedAt: string;
}

export interface StudioProfile {
  studioName: string;
  brandSubtext: string;
  tagline: string;
  address: string;
  cityStateZip: string;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  panNumber: string;
  bankName: string;
  bankBranch: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  authorizedSignatory: string;
  directorDesignation: string;
}

export const STUDIO_PROFILE: StudioProfile = {
  studioName: 'LENS & LIGHT STUDIOS',
  brandSubtext: 'FINE ART PHOTOGRAPHY & CINEMATOGRAPHY',
  tagline: 'Capturing Moments, Creating Memories.',
  address: 'Suite 402, Elite Heritage Tower, Senapati Bapat Road',
  cityStateZip: 'Pune, Maharashtra 411016, India',
  phone: '+91 98765 43210 / +91 91234 56789',
  email: 'billing@lensandlightstudios.in',
  website: 'www.lensandlightstudios.in',
  gstin: '27AABCL8492Q1ZS',
  panNumber: 'AABCL8492Q',
  bankName: 'HDFC Bank Ltd',
  bankBranch: 'Senapati Bapat Road Branch, Pune',
  accountName: 'Lens and Light Studios LLP',
  accountNumber: '50200084920192',
  ifscCode: 'HDFC0001234',
  upiId: 'lensandlight@hdfcbank',
  authorizedSignatory: 'Shubham Hingane',
  directorDesignation: 'Chief Cinematographer & Studio Director'
};

export const STANDARD_TERMS: string[] = [
  'Booking Confirmation: 50% advance deposit is mandatory to lock shooting dates and production crew on calendar.',
  'Balance Settlement: 40% balance payable on completion of shoot days, remaining 10% on draft edit handover.',
  'Deliverables Timeline: Retouched photographs delivered within 21 working days; cinematic video edits within 35 days.',
  'Archival Guarantee: Master high-res RAW footage & uncompressed photos archived on studio servers for 12 months.',
  'Artistic Freedom & Copyright: Lens & Light Studios reserves creative grading style and right to feature curated frames for portfolio display.'
];

export interface CatalogServicePackage {
  id: string;
  title: string;
  category: PhotographyBillItem['serviceCategory'];
  deliverables: string;
  defaultRate: number;
}

export const STUDIO_CATALOG_PACKAGES: CatalogServicePackage[] = [
  {
    id: 'pkg-wedding-heritage',
    title: 'Heritage Masterclass Wedding Coverage (2-Day)',
    category: 'wedding',
    deliverables: 'Dual Candid + Traditional Photographers, 4K Cinematographer, Drone, 500+ Retouched Frames & 5-Min Teaser',
    defaultRate: 185000
  },
  {
    id: 'pkg-prewedding-narrative',
    title: 'Candid Pre-Wedding Romance Story Shoot',
    category: 'pre-wedding',
    deliverables: 'Full-day outdoor scenic shoot (2 locations), 40 Fine-Art Retouched Images, 2-Min Cinematic Concept Film',
    defaultRate: 55000
  },
  {
    id: 'pkg-cine-grading',
    title: 'Cinematic Film Look LUT Grading & 4K Teaser',
    category: 'cinematography',
    deliverables: 'Custom color palette master grade, Dolby-standard audio design, 4K resolution master export',
    defaultRate: 45000
  },
  {
    id: 'pkg-reels-pack',
    title: 'Viral Social Media 4K 60fps Reels Package (10 Reels)',
    category: 'reels',
    deliverables: '10 High-energy 9:16 vertical reels edited with trending sound design, beat cuts and color correction',
    defaultRate: 25000
  },
  {
    id: 'pkg-editorial-portrait',
    title: 'Fine-Art Editorial & Fashion Portrait Session',
    category: 'portraits',
    deliverables: '4-Hour dedicated studio session with custom rim/neon lighting arrays, 20 high-fashion retouched portraits',
    defaultRate: 40000
  },
  {
    id: 'pkg-archival-photobook',
    title: 'Silver-Gelatin Handcrafted Archival Photobook',
    category: 'album',
    deliverables: '12x18 inch 40-page flush-mount leatherbound album printed on archival metallic art paper with keepsake box',
    defaultRate: 32000
  },
  {
    id: 'pkg-drone-aerial',
    title: '4K Drone Aerial Cinematography Add-on',
    category: 'drone',
    deliverables: 'Certified drone pilot aerial coverage for grand venue entry, landscape panoramas & ceremony flyovers',
    defaultRate: 22000
  },
  {
    id: 'pkg-lighting-crew',
    title: 'Studio Lighting Rig & Camera Assistant Day-Rate',
    category: 'gear',
    deliverables: 'Aputure continuous lighting kit, wireless transmitters, softboxes and dedicated grip assistant',
    defaultRate: 18000
  }
];

export const INITIAL_SAMPLE_BILLS: PhotographyBill[] = [
  {
    id: 'bill-sample-1',
    billNumber: 'LLS-2026-081',
    billDate: '2026-08-10',
    dueDate: '2026-11-20',
    clientName: 'Amit & Priyanka Sharma',
    clientPhone: '+91 98234 11223',
    clientEmail: 'amit.priyanka.wed@gmail.com',
    clientAddress: 'Koregaon Park, Pune, Maharashtra',
    eventTitle: 'Grand Royal Destination Wedding & Sangeet',
    eventType: 'Destination Wedding',
    eventDates: '14th - 16th November 2026',
    eventVenue: 'The Oberoi Udaivilas, Udaipur, Rajasthan',
    items: [
      {
        id: 'item-101',
        serviceCategory: 'wedding',
        description: 'Heritage Masterclass Wedding Coverage (2-Day Grand Package)',
        deliverables: 'Dual Candid + Traditional Photographers, 4K Cinematographer, 500+ Retouched Frames & 5-Min Teaser',
        quantity: 1,
        rate: 185000,
        amount: 185000
      },
      {
        id: 'item-102',
        serviceCategory: 'drone',
        description: '4K Drone Aerial Cinematography (Royal Palace Flyover)',
        deliverables: 'Certified drone pilot aerial coverage for Baraat grand entry, palace grounds & Varmala ceremonies',
        quantity: 1,
        rate: 22000,
        amount: 22000
      },
      {
        id: 'item-103',
        serviceCategory: 'album',
        description: 'Silver-Gelatin Handcrafted Archival Photobook (2 Copies)',
        deliverables: '12x18 inch 40-page luxury flush-mount leatherbound albums for couple and parents',
        quantity: 2,
        rate: 28000,
        amount: 56000
      }
    ],
    subtotal: 263000,
    discountType: 'flat',
    discountValue: 15000,
    discountAmount: 15000,
    taxType: 'gst18',
    taxRate: 18,
    taxAmount: 44640,
    cgst: 22320,
    sgst: 22320,
    totalAmount: 292640,
    advancePaid: 150000,
    balanceDue: 142640,
    paymentStatus: 'PARTIAL',
    paymentMethod: 'Bank Transfer (NEFT/IMPS)',
    upiId: 'lensandlight@hdfcbank',
    notes: 'Bride requested golden hour pre-Varmala portraits on Lake Pichola deck. Lighting assistant allocated for evening sangeet.',
    terms: STANDARD_TERMS,
    createdAt: '2026-08-10T11:00:00Z',
    updatedAt: '2026-08-10T11:00:00Z'
  },
  {
    id: 'bill-sample-2',
    billNumber: 'LLS-2026-082',
    billDate: '2026-07-15',
    dueDate: '2026-08-01',
    clientName: 'Sarah Mehta & Kabir Sen',
    clientPhone: '+91 97654 33211',
    clientEmail: 'sarah.kabir@outlook.com',
    clientAddress: 'Bandra West, Mumbai',
    eventTitle: 'Scenic Valley Candid Pre-Wedding Romance Film',
    eventType: 'Pre-Wedding Shoot',
    eventDates: '22nd - 23rd July 2026',
    eventVenue: 'Arthur Seat & Venna Lake, Mahabaleshwar, Maharashtra',
    items: [
      {
        id: 'item-201',
        serviceCategory: 'pre-wedding',
        description: 'Candid Pre-Wedding Romance Story Shoot',
        deliverables: 'Full-day outdoor shoot, 2 scenic outfits, 40 retouched high-contrast aesthetic frames',
        quantity: 1,
        rate: 55000,
        amount: 55000
      },
      {
        id: 'item-202',
        serviceCategory: 'reels',
        description: 'Viral Social Media 4K 60fps Reels Package (6 Reels)',
        deliverables: 'Cinematic 9:16 vertical reels with aesthetic color grading and musical syncing',
        quantity: 1,
        rate: 20000,
        amount: 20000
      }
    ],
    subtotal: 75000,
    discountType: 'percent',
    discountValue: 5,
    discountAmount: 3750,
    taxType: 'gst18',
    taxRate: 18,
    taxAmount: 12825,
    cgst: 6412.5,
    sgst: 6412.5,
    totalAmount: 84075,
    advancePaid: 84075,
    balanceDue: 0,
    paymentStatus: 'PAID',
    paymentMethod: 'UPI / QR',
    upiId: 'lensandlight@hdfcbank',
    notes: 'Shooting completed successfully. Master photographs and reels delivered via cloud drive and client praised color grading.',
    terms: STANDARD_TERMS,
    createdAt: '2026-07-15T14:30:00Z',
    updatedAt: '2026-07-25T16:00:00Z'
  },
  {
    id: 'bill-sample-3',
    billNumber: 'LLS-2026-083',
    billDate: '2026-09-02',
    dueDate: '2026-09-18',
    clientName: 'Nisha & Luke Coutinho',
    clientPhone: '+91 99112 44556',
    clientEmail: 'nisha.coutinho@fashionhouse.com',
    clientAddress: 'Indiranagar, Bangalore',
    eventTitle: 'Autumn Couture Editorial & Visual Launch Campaign',
    eventType: 'Commercial & Editorial',
    eventDates: '28th September 2026',
    eventVenue: 'Lens & Light Studio Suites & Old Heritage Mill, Pune',
    items: [
      {
        id: 'item-301',
        serviceCategory: 'portraits',
        description: 'Fine-Art Editorial & Fashion Portrait Session',
        deliverables: '4-Hour studio shoot with bespoke rim/neon lighting arrays, 20 high-fashion retouched portraits',
        quantity: 1,
        rate: 40000,
        amount: 40000
      },
      {
        id: 'item-302',
        serviceCategory: 'cinematography',
        description: 'Cinematic Look Film Grading & 4K Teaser Edit',
        deliverables: 'High-contrast fashion color grade, LUT formulation, sound design and multi-ratio exports',
        quantity: 1,
        rate: 35000,
        amount: 35000
      }
    ],
    subtotal: 75000,
    discountType: 'flat',
    discountValue: 0,
    discountAmount: 0,
    taxType: 'gst18',
    taxRate: 18,
    taxAmount: 13500,
    cgst: 6750,
    sgst: 6750,
    totalAmount: 88500,
    advancePaid: 0,
    balanceDue: 88500,
    paymentStatus: 'PENDING',
    paymentMethod: 'Bank Transfer (NEFT/IMPS)',
    upiId: 'lensandlight@hdfcbank',
    notes: 'Awaiting token confirmation to book studio light setup and wardrobe stylist assistants.',
    terms: STANDARD_TERMS,
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z'
  }
];

export const PHOTOGRAPHY_BILLS_STORAGE_KEY = 'lls_photography_bills_v1';

export function getStoredPhotographyBills(): PhotographyBill[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_BILLS;
  try {
    const raw = localStorage.getItem(PHOTOGRAPHY_BILLS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PHOTOGRAPHY_BILLS_STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_BILLS));
      return INITIAL_SAMPLE_BILLS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_SAMPLE_BILLS;
  } catch (e) {
    console.error('Failed to load photography bills from localStorage:', e);
    return INITIAL_SAMPLE_BILLS;
  }
}

export function saveStoredPhotographyBills(bills: PhotographyBill[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PHOTOGRAPHY_BILLS_STORAGE_KEY, JSON.stringify(bills));
  } catch (e) {
    console.error('Failed to persist photography bills to localStorage:', e);
  }
}

export function generateNextBillNumber(existingBills: PhotographyBill[]): string {
  const currentYear = new Date().getFullYear();
  const highestNum = existingBills.reduce((max, b) => {
    const match = b.billNumber.match(/LLS-\d{4}-(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      return num > max ? num : max;
    }
    return max;
  }, 83);
  const nextNum = highestNum + 1;
  return `LLS-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

export function calculateBillFinancials(
  items: PhotographyBillItem[],
  discountType: 'percent' | 'flat',
  discountValue: number,
  taxRate: number,
  advancePaid: number
): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
} {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  let discountAmount = 0;
  if (discountType === 'percent') {
    discountAmount = Math.round((subtotal * (Number(discountValue) || 0)) / 100);
  } else {
    discountAmount = Number(discountValue) || 0;
  }
  discountAmount = Math.min(discountAmount, subtotal);

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round((taxableAmount * (Number(taxRate) || 0)) / 100);
  const cgst = Math.round((taxAmount / 2) * 100) / 100;
  const sgst = Math.round((taxAmount / 2) * 100) / 100;

  const totalAmount = taxableAmount + taxAmount;
  const advance = Math.min(Number(advancePaid) || 0, totalAmount);
  const balanceDue = Math.max(0, totalAmount - advance);

  let paymentStatus: PaymentStatus = 'PENDING';
  if (totalAmount > 0 && balanceDue === 0) {
    paymentStatus = 'PAID';
  } else if (advance > 0 && balanceDue > 0) {
    paymentStatus = 'PARTIAL';
  }

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    cgst,
    sgst,
    totalAmount,
    balanceDue,
    paymentStatus
  };
}

export const DEFAULT_LATE_FEE_CONFIG: LateFeeConfig = {
  enabled: true,
  feeType: 'percent',
  value: 2.5, // 2.5% overdue interest surcharge
  gracePeriodDays: 5,
  frequency: 'flat_once'
};

export function calculateLateFeeDetails(
  dueDateStr: string,
  balanceDue: number,
  config?: LateFeeConfig
): {
  isOverdue: boolean;
  daysOverdue: number;
  overdueDays: number;
  gracePeriodDays: number;
  isPastGrace: boolean;
  daysPastGrace: number;
  lateFeeAmount: number;
  amount: number;
  finalPayableWithLateFee: number;
} {
  if (!dueDateStr || balanceDue <= 0) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      overdueDays: 0,
      gracePeriodDays: config?.gracePeriodDays ?? 5,
      isPastGrace: false,
      daysPastGrace: 0,
      lateFeeAmount: 0,
      amount: 0,
      finalPayableWithLateFee: balanceDue
    };
  }

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(23, 59, 59, 999);
  const now = new Date();
  
  const diffTime = now.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays > 0;
  const daysOverdue = Math.max(0, diffDays);
  
  const cfg = config || DEFAULT_LATE_FEE_CONFIG;
  const grace = cfg.gracePeriodDays ?? 5;
  const isPastGrace = isOverdue && daysOverdue > grace;
  const daysPastGrace = Math.max(0, daysOverdue - grace);

  let lateFeeAmount = 0;
  if (cfg.enabled && isPastGrace) {
    if (cfg.feeType === 'percent') {
      lateFeeAmount = Math.round((balanceDue * (cfg.value / 100)));
    } else {
      lateFeeAmount = Math.round(cfg.value);
    }
  }

  return {
    isOverdue,
    daysOverdue,
    overdueDays: daysOverdue,
    gracePeriodDays: grace,
    isPastGrace,
    daysPastGrace,
    lateFeeAmount,
    amount: lateFeeAmount,
    finalPayableWithLateFee: balanceDue + lateFeeAmount
  };
}

export type MilestonePresetType = '50_50' | '25_50_25' | '30_40_30';

export function createMilestonePreset(
  preset: MilestonePresetType,
  totalAmount: number,
  billDate: string
): PaymentMilestone[] {
  const baseDate = new Date(billDate || new Date());
  
  const addDays = (d: Date, days: number) => {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next.toISOString().split('T')[0];
  };

  if (preset === '50_50') {
    const m1 = Math.round(totalAmount * 0.5);
    const m2 = totalAmount - m1;
    return [
      {
        id: `ms-${Date.now()}-1`,
        title: 'Initial Booking Retainer (Locks Date & Production Crew)',
        percentage: 50,
        amount: m1,
        dueDate: addDays(baseDate, 3),
        isPaid: false,
        notes: 'Mandatory retainer to reserve calendar slot and prevent double-booking.'
      },
      {
        id: `ms-${Date.now()}-2`,
        title: 'Final Settlement & Master Gallery Delivery',
        percentage: 50,
        amount: m2,
        dueDate: addDays(baseDate, 30),
        isPaid: false,
        notes: 'Payable prior to master cloud gallery delivery & album release.'
      }
    ];
  }

  if (preset === '25_50_25') {
    const m1 = Math.round(totalAmount * 0.25);
    const m2 = Math.round(totalAmount * 0.50);
    const m3 = totalAmount - m1 - m2;
    return [
      {
        id: `ms-${Date.now()}-1`,
        title: 'Initial Booking Retainer (Reservation Token)',
        percentage: 25,
        amount: m1,
        dueDate: addDays(baseDate, 3),
        isPaid: false,
        notes: 'Locks shooting dates and assigns chief cinematographer.'
      },
      {
        id: `ms-${Date.now()}-2`,
        title: 'Shoot Day On-Site Production Milestone',
        percentage: 50,
        amount: m2,
        dueDate: addDays(baseDate, 20),
        isPaid: false,
        notes: 'Payable on completion of shooting days and footage ingestion.'
      },
      {
        id: `ms-${Date.now()}-3`,
        title: 'Final Delivery & Handcrafted Album Release',
        percentage: 25,
        amount: m3,
        dueDate: addDays(baseDate, 45),
        isPaid: false,
        notes: 'Released upon client approval of color graded master film & album print.'
      }
    ];
  }

  // 30_40_30
  const m1 = Math.round(totalAmount * 0.30);
  const m2 = Math.round(totalAmount * 0.40);
  const m3 = totalAmount - m1 - m2;
  return [
    {
      id: `ms-${Date.now()}-1`,
      title: 'Booking Retainer (30% Token)',
      percentage: 30,
      amount: m1,
      dueDate: addDays(baseDate, 3),
      isPaid: false,
      notes: 'Contract execution & calendar slot confirmation.'
    },
    {
      id: `ms-${Date.now()}-2`,
      title: 'Production Wrap Milestone (40%)',
      percentage: 40,
      amount: m2,
      dueDate: addDays(baseDate, 15),
      isPaid: false,
      notes: 'Payable on wrap of shooting schedule.'
    },
    {
      id: `ms-${Date.now()}-3`,
      title: 'Post-Production & Final Master Delivery (30%)',
      percentage: 30,
      amount: m3,
      dueDate: addDays(baseDate, 35),
      isPaid: false,
      notes: 'Final settlement on deliverable handover.'
    }
  ];
}

/**
 * Indian Number to Words Converter (INR)
 */
export function numberToWordsINR(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanOneThousand = (n: number): string => {
    let current = '';
    if (n >= 100) {
      current += singleDigits[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      current += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n >= 10) {
      current += teens[n - 10] + ' ';
      n = 0;
    }
    if (n > 0) {
      current += singleDigits[n] + ' ';
    }
    return current.trim();
  };

  const integerPart = Math.floor(num);
  let remaining = integerPart;
  let result = '';

  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundredAndBelow = remaining;

  if (crore > 0) {
    result += convertLessThanOneThousand(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertLessThanOneThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertLessThanOneThousand(thousand) + ' Thousand ';
  }
  if (hundredAndBelow > 0) {
    result += convertLessThanOneThousand(hundredAndBelow) + ' ';
  }

  return (result.trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

/**
 * Standard Photography Shoot Contract Clauses
 */
export const DEFAULT_CONTRACT_CLAUSES: ContractClause[] = [
  {
    id: 'clause-copyright',
    title: '1. Copyright & Exclusive Artistic Ownership',
    content: 'Lens & Light Studios retains exclusive worldwide copyright over all original photography, cinematic footage, and raw sensor captures created under this engagement pursuant to statutory copyright law. The Client is granted an irrevocable, perpetual, non-commercial license for private display, family distribution, personal printing, and personal social media reproduction.',
    isMandatory: true,
    selected: true
  },
  {
    id: 'clause-raw-exemption',
    title: '2. RAW Sensor Files & Proprietary Ingest Exclusion',
    content: 'Unprocessed camera RAW sensor frames (.ARW/.CR3) and unedited cinema takes represent proprietary intermediate production materials and are strictly excluded from all standard deliverable scopes. Handover is restricted exclusively to curated, exposure-corrected, and color-graded high-resolution master exports.',
    isMandatory: true,
    selected: true
  },
  {
    id: 'clause-model-release',
    title: '3. Model Release & Fine-Art Portfolio Rights',
    content: 'The Client grants Lens & Light Studios express permission to display curated preview frames and teaser reels for studio portfolio presentations, fine-art photographic contests, studio exhibitions, website lookbooks, and verified social media channels. If private non-disclosure (NDA) exclusivity is mandated, a formal commercial exclusivity buyout fee must be executed prior to shoot commencement.',
    isMandatory: false,
    selected: true
  },
  {
    id: 'clause-retainer-cancellation',
    title: '4. Non-Refundable Booking Retainer & Rescheduling Protocol',
    content: 'The booking retainer (50% or agreed deposit milestone) is strictly non-refundable upon receipt, representing liquidated damages for dedicated calendar dates and dedicated crew reservation. Rescheduling requests must be conveyed in writing at least 21 days prior to shoot dates and remain strictly contingent on studio calendar availability.',
    isMandatory: true,
    selected: true
  },
  {
    id: 'clause-force-majeure',
    title: '5. Force Majeure, Weather Contingency & Liability Limit',
    content: 'The studio operates multi-slot camera redundancy and dedicated audio backups. In the event of catastrophic weather, act of God, venue civil restrictions, or sudden severe medical incapacitation of lead artists, liability of Lens & Light Studios is strictly capped at a pro-rata refund of unrendered production days.',
    isMandatory: true,
    selected: true
  },
  {
    id: 'clause-delivery-clearance',
    title: '6. Payment-Gated Delivery Handover & Archival Terms',
    content: 'Full 100% settlement of all invoice dues is an absolute condition precedent prior to unlocking the High-Resolution Master Delivery Vault, uncompressed archives, cloud download credentials, and physical album release. Master files are archived in studio cold storage for twelve (12) calendar months following initial vault delivery.',
    isMandatory: true,
    selected: true
  }
];

export function createDefaultContract(clientName: string, eventTitle: string, billNumber?: string): PhotographyContract {
  return {
    enabled: true,
    contractNumber: billNumber ? `CTR-${billNumber}` : `CTR-${Date.now().toString().slice(-6)}`,
    createdAt: new Date().toISOString().split('T')[0],
    clientSignerName: clientName || 'Authorized Client Signatory',
    photographerSignerName: STUDIO_PROFILE.authorizedSignatory,
    clauses: DEFAULT_CONTRACT_CLAUSES.map(c => ({ ...c })),
    status: 'draft',
    notes: `Production contract and rights assignment for: ${eventTitle || 'Commercial / Wedding Photography'}`
  };
}

export function createDefaultDeliveryVault(eventTitle: string): DeliveryVault {
  return {
    enabled: true,
    galleryUrl: 'https://gallery.lensandlightstudios.in/vault/oberoi-udaivilas-royal',
    previewUrl: 'https://gallery.lensandlightstudios.in/teaser/preview-reel-watermarked',
    downloadPin: '7492',
    totalFilesCount: 650,
    fileSizeBytes: '48.5 GB',
    resolutionSpecs: '45MP Full-Frame Sony Alpha 1 Uncompressed JPEG + 4K ProRes 422 Cinema Masters',
    cloudProvider: 'Pixieset',
    expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    vaultNotes: 'Includes high-resolution uncompressed print masters (300 DPI) and web-optimized social media galleries.',
    isManualOverrideUnlocked: false
  };
}

