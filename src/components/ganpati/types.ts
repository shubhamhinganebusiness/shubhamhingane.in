export type MandalLanguage = 'mr' | 'hi' | 'en';

export type UserRole = 'admin' | 'karyakarta' | 'clerk' | 'volunteer' | 'devotee';

export type PaymentMode = 
  | 'cash' 
  | 'Cash'
  | 'upi' 
  | 'UPI'
  | 'gpay' 
  | 'GPay'
  | 'phonepe' 
  | 'PhonePe'
  | 'paytm'
  | 'Paytm'
  | 'netbanking' 
  | 'Bank Transfer'
  | 'bank_transfer'
  | 'cheque'
  | 'Cheque'
  | string;

export type IncomeCategory = 
  | 'उत्सव देणगी (Utsav Donation)'
  | 'वार्षिक घरगुती वर्गणी (Annual Household Vargani)'
  | 'व्यापारी / दुकानदार वर्गणी (Commercial Vargani)'
  | 'महाआरती यजमानपद (Maha Aarti Sponsorship)' 
  | 'महाप्रसाद व अन्नदान (Maha Prasad & Annadaan)' 
  | 'मूर्ती व मंडप निधी (Murti & Pandal Nidhi)' 
  | 'देखावा प्रायोजक व जाहिरात (Decoration Sponsor / Ads)'
  | 'सुवर्ण-चांदी देणगी (Gold/Silver Offering)'
  | 'नवस व संकल्प निधी (Mannat Donation)'
  | 'General Donation (देणगी)' 
  | 'Annual Vargani (वार्षिक वर्गणी)' 
  | 'Maha Aarti Sponsorship (महाआरती)' 
  | 'Maha Prasad Nidhi (महाप्रसाद)' 
  | 'Murti / Pandal Nidhi (मूर्ती/मंडप)' 
  | 'Advertisement / Sponsor (जाहिरात)';

export type ExpenseCategory = 
  | 'मूर्ती व मूर्तिकार (Idol & Sculptor)'
  | 'मंडप व देखावा उभारणी (Pandal & Mandap Setup)'
  | 'सजावट व रोषणाई (Decoration & Lighting)'
  | 'ध्वनिक्षेपक व ढोल-ताशा (Sound & Dhol Tasha)'
  | 'महाप्रसाद व अन्नदान (Mahaprasad & Cooking)'
  | 'फुल, हार व पूजा साहित्य (Flower & Pooja Samagri)'
  | 'सुरक्षा, पोलीस व सीसीटीव्ही (Security & Police)'
  | 'विसर्जन मिरवणूक (Visarjan Procession)'
  | 'विद्युत व जनरेटर डिझेल (Electricity & Generator)'
  | 'कार्यालयीन व इतर खर्च (Office & Miscellaneous)'
  | 'Flower & Garlands (फुल व हार)' 
  | 'Decoration & Lighting (सजावट व रोषणाई)' 
  | 'Prasad & Ingredients (प्रसाद व अन्नदान)' 
  | 'Pandal & Mandap Setup (मंडप उभारणी)' 
  | 'Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)' 
  | 'Electricity & Generator (विद्युत व जनरेटर)' 
  | 'Security & Bouncers (सुरक्षा)' 
  | 'Visarjan Procession (विसर्जन मिरवणूक)' 
  | 'Office & Miscellaneous (इतर खर्च)';

export type ReceiptTemplateId = 'peshwai' | 'marigold' | 'temple' | 'ecogreen';

export interface ReceiptTemplateOption {
  id: ReceiptTemplateId;
  nameMr: string;
  nameEn: string;
  descriptionMr: string;
  primaryColor: string;
  accentColor: string;
  borderStyle: string;
  watermark: string;
  headerShloka: string;
}

export type DonorCategory = 
  | 'Household (कुटुंब/रहिवासी)' 
  | 'Business (दुकानदार/व्यावसायिक)' 
  | 'Sponsor (प्रायोजक)' 
  | 'VIP / Trust (विशेष देणगीदार)';

export interface DonorProfile {
  id: string;
  donorId: string;
  name: string;
  phone: string;
  email?: string;
  panNumber?: string;
  address: string;
  area: string;
  category: DonorCategory;
  totalDonated: number;
  donationsCount: number;
  lastDonationDate: string;
  receiptNumbers: string[];
  notes?: string;
  repeatDonor: boolean;
  status: 'Active' | 'Pending' | 'FollowUp';
}

export interface PendingVarganiEntry {
  id: string;
  targetName: string;
  phone: string;
  address: string;
  area: string;
  targetType: 'Household (घरगुती)' | 'Shop / Business (दुकानदार)' | 'Sponsor (प्रायोजक)';
  expectedAmount: number;
  collectedAmount: number;
  status: 'Pending' | 'FollowUp' | 'Paid' | 'Declined';
  assignedVolunteer: string;
  lastFollowUpDate: string;
  notes: string;
}

export interface DayWiseCollection {
  dayNumber: number;
  date: string;
  festivalDayNameMr: string;
  festivalDayNameEn: string;
  targetAmount: number;
  collectedAmount: number;
  pavatisCount: number;
  expensesAmount: number;
  majorEventMr: string;
}

export interface DenominationBreakdown {
  note2000: number;
  note500: number;
  note200: number;
  note100: number;
  note50: number;
  note20: number;
  note10: number;
  coins: number;
}

export type NightlyVerificationStatus = 'Pending' | 'Verified' | 'Discrepancy' | 'Locked';

export interface NightlyVerificationRecord {
  id: string;
  date: string;
  dayNumber: number;
  status: NightlyVerificationStatus;
  verifiedByTreasurer: string;
  verifiedAt?: string;
  counterSignedByPresident?: string;
  counterSignedAt?: string;
  systemCashExpected: number;
  physicalCashCounted: number;
  cashVariance: number; // positive = surplus, negative = shortage, 0 = reconciled
  denominations: DenominationBreakdown;
  treasurerNotes?: string;
  depositVaultLocation: 'Mandal Safe Locker (मंडळ तिजोरी)' | 'Bank Account Deposited (बँक जमा)' | 'Treasurer Custody (खजिनदार कक्ष)' | 'Bank Night Drop (बँक ड्रॉप)';
  bankDepositReceiptRef?: string;
}

export interface DailySummaryReport {
  id: string;
  date: string;
  dayNumber: number;
  festivalDayNameMr: string;
  festivalDayNameEn: string;
  totalIncome: number;
  totalExpenses: number;
  netDailySurplus: number;
  incomeByMode: {
    cash: number;
    upi: number;
    bank: number;
    cheque: number;
  };
  expensesByMode: {
    cash: number;
    upi: number;
    bank: number;
    cheque: number;
  };
  receiptsCount: number;
  expensesCount: number;
  firstReceiptNumber?: string;
  lastReceiptNumber?: string;
  cancelledReceiptsCount: number;
  cancelledAmount: number;
  collectorBreakdown: Array<{
    collectorId: string;
    collectorName: string;
    bookPrefix: string;
    receiptsCount: number;
    cashAmount: number;
    upiAmount: number;
    totalAmount: number;
    cashHandedOver: number;
    cashInHand: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  verification?: NightlyVerificationRecord;
}

export interface AuditSignatory {
  roleMr: string;
  roleEn: string;
  name: string;
  phone: string;
  signatureText?: string;
}

export interface MandalProfile {
  nameMr: string;
  nameEn: string;
  nameHi: string;
  taglineMr?: string;
  taglineEn?: string;
  logoUrl?: string;
  slogan?: string;
  regNumber: string;
  establishedYear: number;
  presidentName: string;
  vicePresidentName?: string;
  workingPresidentName?: string;
  secretaryName: string;
  treasurerName: string;
  phone: string;
  email: string;
  addressMr: string;
  addressEn: string;
  city: string;
  pincode: string;
  themeTitleMr: string;
  themeTitleEn: string;
  themeDescriptionMr: string;
  themeDescriptionEn: string;
  idolHeight: string;
  sculptorName: string;
  socials: {
    instagram: string;
    youtube: string;
    facebook: string;
    whatsappGroup: string;
  };
  historyMr: string;
  historyEn: string;
  upiId: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
  };
}

export interface DigitalPavati {
  id: string;
  receiptNumber: string;
  donorName: string;
  phone: string;
  email?: string;
  address?: string;
  amount: number;
  paymentMode: PaymentMode;
  category: IncomeCategory;
  date: string;
  time: string;
  transactionRef?: string;
  notes?: string;
  receivedBy: string;
  collectorId?: string;
  collectorName?: string;
  bookNumber?: string;
  bookPrefix?: string;
  deviceId?: string;
  isVerified: boolean;
  panNumber?: string;
  is80GExempt?: boolean;
  isCancelled?: boolean;
  cancellationReason?: string;
  status?: 'Active' | 'Cancelled';
  lastEditedAt?: string;
  syncStatus?: 'Synced' | 'Pending';
}

export interface VolunteerCollector {
  id: string;
  name: string;
  phone: string;
  role: 'admin' | 'volunteer' | 'treasurer' | 'head_collector';
  pin: string;
  bookNumber: string;
  bookPrefix: string;
  assignedRangeStart: number;
  assignedRangeEnd: number;
  currentReceiptIndex: number;
  assignedArea: string;
  targetAmount: number;
  dailyTargetAmount?: number;
  status: 'Active' | 'OnField' | 'Break' | 'Inactive';
  totalCollected: number;
  totalReceiptsCount: number;
  cashCollected: number;
  digitalCollected: number;
  cashHandedOver: number;
  cashInHand: number;
  deviceId: string;
  lastActiveAt: string;
  notes?: string;
}

export interface CashHandoverRecord {
  id: string;
  handoverNumber: string;
  volunteerId: string;
  volunteerName: string;
  amount: number;
  treasurerName: string;
  date: string;
  time: string;
  receiptCount: number;
  status: 'Received' | 'PendingVerification';
  notes?: string;
}

export interface ExpenseEntry {
  id: string;
  voucherNumber: string;
  title: string;
  vendorName: string;
  amount: number;
  category: ExpenseCategory;
  paymentMode: PaymentMode;
  date: string;
  billNumber?: string;
  approvedBy: string;
  notes?: string;
  hasReceiptImage?: boolean;
}

export type SabhasadType = 
  | 'आजीवन सभासद (Life Member)'
  | 'सक्रिय सभासद (Active Member)'
  | 'सर्वसाधारण सभासद (General Member)'
  | 'मार्गदर्शक / जेष्ठ सभासद (Senior Advisor)'
  | 'मुख्य कार्यकारणी सभासद (Executive Board)';

export type MemberRole = 
  | 'President' 
  | 'Vice President' 
  | 'Working President'
  | 'Secretary' 
  | 'Joint Secretary'
  | 'Treasurer' 
  | 'Joint Treasurer'
  | 'Executive Member'
  | 'Committee Member' 
  | 'Advisory Board' 
  | 'Festival Head'
  | 'Security Head'
  | 'Prasad Incharge'
  | 'Volunteer';

export interface Member {
  id: string;
  memberId: string;
  name: string;
  role: MemberRole;
  designationMr?: string;
  sabhasadType?: SabhasadType;
  isExecutiveBearer?: boolean;
  executiveRank?: number;
  phone: string;
  email: string;
  bloodGroup: string;
  address: string;
  joinYear: number;
  avatar: string;
  annualFeeStatus: 'Paid' | 'Pending' | 'Partial';
  feePaidAmount: number;
  dueAmount: number;
  responsibilities?: string;
}

export interface VolunteerDuty {
  id: string;
  volunteerName: string;
  volunteerPhone: string;
  dutyType: 'Morning Aarti' | 'Evening Aarti' | 'Crowd Management' | 'Prasad Distribution' | 'VIP Escort' | 'Cleanliness' | 'Night Security';
  date: string;
  timeSlot: string;
  status: 'Assigned' | 'Confirmed' | 'Completed' | 'Absent';
  location: string;
  assignedBy: string;
}

export interface AartiEvent {
  id: string;
  titleMr: string;
  titleEn: string;
  time: string;
  type: 'Kakad Aarti' | 'Madhyahna Aarti' | 'Sandhya Aarti' | 'Shej Aarti' | 'Special Maha Aarti' | 'Cultural Event';
  descriptionMr: string;
  descriptionEn: string;
  sponsorName?: string;
  maxBookingSlots: number;
  bookedSlots: number;
  pricePerSlot: number;
}

export type AartiSchedule = AartiEvent;

export interface MandalEvent {
  id: string;
  titleMr: string;
  titleEn: string;
  date: string;
  time: string;
  category: 'Spiritual' | 'Social' | 'Cultural' | 'Visarjan';
  location: string;
  chiefGuest?: string;
  description: string;
}

export interface MannatWish {
  id: string;
  devoteeName: string;
  city: string;
  wishText: string;
  date: string;
  flowerCount: number;
  isApproved: boolean;
  isFeatured: boolean;
  answeredStatus?: 'Awaiting' | 'Fulfilled (नवस पूर्ण)';
}

export type MannatPrayer = MannatWish;

export interface GalleryMedia {
  id: string;
  titleMr: string;
  titleEn: string;
  category: 'Murti' | 'Decoration' | 'Aarti' | 'VIP Visits' | 'Cultural' | 'Visarjan';
  mediaUrl: string;
  thumbnail: string;
  year: number;
  caption: string;
}

export type GalleryItem = GalleryMedia;

export interface PandalZone {
  id: string;
  name: string;
  status: 'Normal' | 'Moderate' | 'Heavy' | 'Closed';
  estimatedPeople: number;
  waitMinutes: number;
  incharge: string;
}

export interface AartiBooking {
  id: string;
  bookingCode: string;
  aartiId: string;
  aartiTitle: string;
  devoteeName: string;
  phone: string;
  familyMembersCount: number;
  gotra?: string;
  sankalpType: string;
  date: string;
  time: string;
  amountPaid: number;
  paymentStatus: 'Confirmed' | 'Pending';
}

export type InventoryCategory =
  | 'Puja Samagri'
  | 'Decoration Assets'
  | 'Audio / Visual'
  | 'Prasad Raw Material'
  | 'Security / Crowd Gear'
  | 'Utensils'
  | 'Prasad'
  | 'Puja Sahitya'
  | 'Decoration'
  | 'Sound & Light'
  | 'Security'
  | string;

export interface InventoryItem {
  id: string;
  name: string;
  nameMr?: string;
  nameEn?: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minRequired: number;
  minThreshold?: number;
  unitCost?: number;
  lastRestocked?: string;
  lastCheckedDate?: string;
  status?: 'In Stock' | 'Low Stock' | 'Critical' | string;
  location: string;
  condition: 'Good' | 'Fair' | 'Damaged' | 'Needs Repair' | string;
}

export interface Announcement {
  id: string;
  titleMr: string;
  titleEn: string;
  category: 'Urgent' | 'Event' | 'Darshan' | 'Traffic' | 'Prasad';
  timestamp: string;
  isActive: boolean;
}

export interface DevoteeFeedback {
  id: string;
  devoteeName: string;
  phone: string;
  city: string;
  ratings: {
    decoration: number;
    cleanliness: number;
    management: number;
    prasad: number;
  };
  comments: string;
  date: string;
  sentiment: 'Positive' | 'Neutral' | 'Suggestion';
}

export interface MandalAccount {
  id: string;
  mandalCode: string;
  profile: MandalProfile;
  receiptPrefix: string;
  adminPin: string;
  treasurerPin: string;
  karyakartaPin: string;
  categoryTier?: 'A-Grade (अ वर्ग)' | 'B-Grade (ब वर्ग)' | 'C-Grade (क वर्ग)' | 'Trust (सार्वजनिक ट्रस्ट)';
  isVerified: boolean;
  createdAt: string;
  totalVolunteersCount?: number;
}

export interface MandalUserSession {
  mandalId: string;
  mandalCode: string;
  mandalNameMr: string;
  mandalNameEn: string;
  role: 'admin' | 'treasurer' | 'karyakarta' | 'devotee';
  userName: string;
  userPhone?: string;
  volunteerId?: string;
  bookPrefix?: string;
  token: string;
  loginTime: string;
}

export interface MandalDataset {
  mandal: MandalProfile;
  pavatis: DigitalPavati[];
  expenses: ExpenseEntry[];
  members: Member[];
  duties: VolunteerDuty[];
  aartis: AartiSchedule[];
  events: MandalEvent[];
  mannats: MannatPrayer[];
  gallery: GalleryItem[];
  inventory: InventoryItem[];
  zones: PandalZone[];
  announcements: Announcement[];
  donors: DonorProfile[];
  pendingVargani: PendingVarganiEntry[];
  dayWiseCollections: DayWiseCollection[];
  volunteers: VolunteerCollector[];
  handovers: CashHandoverRecord[];
  verifications: NightlyVerificationRecord[];
}
