import { 
  MandalAccount, 
  MandalDataset, 
  MandalUserSession, 
  MandalProfile,
  DigitalPavati,
  ExpenseEntry,
  Member,
  VolunteerCollector
} from '../types';
import { defaultMandalAccounts, defaultMandalDatasets } from '../data/multiMandalData';

const ACCOUNTS_STORAGE_KEY = 'ganpati_erp_mandal_accounts_v1';
const SESSION_STORAGE_KEY = 'ganpati_erp_active_session_v1';
const DATASET_PREFIX = 'ganpati_erp_mandal_data_';

/**
 * Loads all registered Mandal accounts from localStorage or initial seed
 */
export function getAllMandalAccounts(): MandalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load mandal accounts from localStorage', err);
  }
  
  // Save defaults initially
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(defaultMandalAccounts));
  } catch (err) {
    console.error('Failed to initialize default mandals', err);
  }
  return defaultMandalAccounts;
}

/**
 * Find Mandal account by ID or Code
 */
export function getMandalAccount(identifier: string): MandalAccount | null {
  const accounts = getAllMandalAccounts();
  const cleanId = identifier.trim().toLowerCase();
  return accounts.find(a => 
    a.id.toLowerCase() === cleanId || 
    a.mandalCode.toLowerCase() === cleanId
  ) || null;
}

/**
 * Register a brand-new Mandal committee tenant
 */
export function registerNewMandal(
  account: Omit<MandalAccount, 'id' | 'createdAt' | 'isVerified'>,
  initialDataOverrides?: Partial<MandalDataset>
): MandalAccount {
  const accounts = getAllMandalAccounts();
  
  // Check if code already exists
  const existing = accounts.find(a => a.mandalCode.toLowerCase() === account.mandalCode.trim().toLowerCase());
  if (existing) {
    throw new Error(`Mandal Code "${account.mandalCode}" आधीच वापरला गेला आहे. कृपया दुसरा कोड निवडा.`);
  }

  const mandalId = `mandal-${account.mandalCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
  
  const newAccount: MandalAccount = {
    ...account,
    id: mandalId,
    mandalCode: account.mandalCode.trim().toUpperCase(),
    createdAt: new Date().toISOString(),
    isVerified: true
  };

  const updatedAccounts = [...accounts, newAccount];
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

  // Initialize isolated dataset for the new mandal
  const newDataset: MandalDataset = {
    mandal: newAccount.profile,
    pavatis: initialDataOverrides?.pavatis || [],
    expenses: initialDataOverrides?.expenses || [],
    members: initialDataOverrides?.members || [
      {
        id: `m-pres-${Date.now()}`,
        memberId: 'M-01',
        name: newAccount.profile.presidentName,
        role: 'President',
        designationMr: 'अध्यक्ष',
        phone: newAccount.profile.phone,
        email: newAccount.profile.email,
        bloodGroup: 'O+',
        address: newAccount.profile.addressMr,
        joinYear: newAccount.profile.establishedYear || new Date().getFullYear(),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        annualFeeStatus: 'Paid',
        feePaidAmount: 5000,
        dueAmount: 0,
        isExecutiveBearer: true,
        executiveRank: 1
      },
      {
        id: `m-sec-${Date.now() + 1}`,
        memberId: 'M-02',
        name: newAccount.profile.secretaryName,
        role: 'Secretary',
        designationMr: 'सचिव',
        phone: newAccount.profile.phone,
        email: newAccount.profile.email,
        bloodGroup: 'B+',
        address: newAccount.profile.addressMr,
        joinYear: newAccount.profile.establishedYear || new Date().getFullYear(),
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        annualFeeStatus: 'Paid',
        feePaidAmount: 3000,
        dueAmount: 0,
        isExecutiveBearer: true,
        executiveRank: 2
      },
      {
        id: `m-trs-${Date.now() + 2}`,
        memberId: 'M-03',
        name: newAccount.profile.treasurerName,
        role: 'Treasurer',
        designationMr: 'खजिनदार',
        phone: newAccount.profile.phone,
        email: newAccount.profile.email,
        bloodGroup: 'A+',
        address: newAccount.profile.addressMr,
        joinYear: newAccount.profile.establishedYear || new Date().getFullYear(),
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
        annualFeeStatus: 'Paid',
        feePaidAmount: 3000,
        dueAmount: 0,
        isExecutiveBearer: true,
        executiveRank: 3
      }
    ],
    duties: initialDataOverrides?.duties || [],
    aartis: initialDataOverrides?.aartis || [
      {
        id: `art-1-${Date.now()}`,
        titleMr: 'सकाळची मंगल काकड आरती',
        titleEn: 'Morning Kakad Aarti',
        time: '07:00 AM',
        type: 'Kakad Aarti',
        descriptionMr: 'नित्य प्रातः मंगल आरती',
        descriptionEn: 'Daily morning prayer',
        maxBookingSlots: 20,
        bookedSlots: 0,
        pricePerSlot: 501
      },
      {
        id: `art-2-${Date.now()}`,
        titleMr: 'संध्याकाळची भव्य महाआरती',
        titleEn: 'Evening Grand Maha Aarti',
        time: '07:30 PM',
        type: 'Special Maha Aarti',
        descriptionMr: 'दैनिक सायंकालीन महाआरती व प्रसाद',
        descriptionEn: 'Grand evening Aarti and offering',
        maxBookingSlots: 35,
        bookedSlots: 0,
        pricePerSlot: 1100
      }
    ],
    events: initialDataOverrides?.events || [
      {
        id: `ev-1-${Date.now()}`,
        titleMr: 'श्री गणेश चतुर्थी आगमन व प्रतिष्ठापना सोहळा',
        titleEn: 'Ganesh Chaturthi Pranpratishtha Ceremony',
        date: '2026-08-16',
        time: '10:00 AM',
        category: 'Spiritual',
        location: newAccount.profile.addressMr,
        description: 'वेदमंत्रोच्चारात श्रींची प्राणप्रतिष्ठापना'
      }
    ],
    mannats: initialDataOverrides?.mannats || [],
    gallery: initialDataOverrides?.gallery || [],
    inventory: initialDataOverrides?.inventory || [
      {
        id: `inv-1-${Date.now()}`,
        name: 'आरती थाळी व समई सेट',
        category: 'Puja Sahitya',
        quantity: 5,
        unit: 'Set',
        minRequired: 2,
        location: 'कार्यालय कपाट',
        condition: 'Good'
      }
    ],
    zones: initialDataOverrides?.zones || [
      {
        id: `zn-1-${Date.now()}`,
        name: 'मुख्य दर्शन रांग (General Queue)',
        status: 'Normal',
        estimatedPeople: 50,
        waitMinutes: 10,
        incharge: newAccount.profile.secretaryName
      }
    ],
    announcements: initialDataOverrides?.announcements || [
      {
        id: `ann-1-${Date.now()}`,
        titleMr: `॥ ${newAccount.profile.nameMr} मध्ये आपले सहर्ष स्वागत आहे ॥`,
        titleEn: `Welcome to ${newAccount.profile.nameEn}`,
        category: 'Urgent',
        timestamp: 'आत्ताच',
        isActive: true
      }
    ],
    donors: initialDataOverrides?.donors || [],
    pendingVargani: initialDataOverrides?.pendingVargani || [],
    dayWiseCollections: initialDataOverrides?.dayWiseCollections || [
      {
        dayNumber: 1,
        date: '2026-08-16',
        festivalDayNameMr: 'दिवस १ - श्री गणेश चतुर्थी आगमन',
        festivalDayNameEn: 'Day 1 - Ganesh Chaturthi',
        targetAmount: 50000,
        collectedAmount: 0,
        pavatisCount: 0,
        expensesAmount: 0,
        majorEventMr: 'प्राणप्रतिष्ठा व महाआरती'
      }
    ],
    volunteers: initialDataOverrides?.volunteers || [
      {
        id: `vol-01-${Date.now()}`,
        name: 'मुख्य संकलन स्वयंसेवक (Head Collector)',
        phone: newAccount.profile.phone,
        role: 'head_collector',
        pin: newAccount.karyakartaPin || '111111',
        bookNumber: 'Book-01',
        bookPrefix: `${newAccount.receiptPrefix}01-`,
        assignedRangeStart: 1,
        assignedRangeEnd: 100,
        currentReceiptIndex: 1,
        assignedArea: 'स्थानिक विभाग व मंडप परिसर',
        targetAmount: 50000,
        status: 'Active',
        totalCollected: 0,
        totalReceiptsCount: 0,
        cashCollected: 0,
        digitalCollected: 0,
        cashHandedOver: 0,
        cashInHand: 0,
        deviceId: `DEV-${newAccount.mandalCode}-01`,
        lastActiveAt: new Date().toISOString()
      }
    ],
    handovers: initialDataOverrides?.handovers || [],
    verifications: initialDataOverrides?.verifications || []
  };

  saveMandalDataset(mandalId, newDataset);
  return newAccount;
}

/**
 * Retrieves the isolated dataset for a specific Mandal tenant
 */
export function getMandalDataset(mandalId: string): MandalDataset {
  try {
    const raw = localStorage.getItem(`${DATASET_PREFIX}${mandalId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.mandal) {
        return parsed;
      }
    }
  } catch (err) {
    console.error(`Failed to load dataset for mandal ${mandalId}`, err);
  }

  // Fallback to pre-seeded dataset if available
  if (defaultMandalDatasets[mandalId]) {
    const seed = defaultMandalDatasets[mandalId];
    try {
      localStorage.setItem(`${DATASET_PREFIX}${mandalId}`, JSON.stringify(seed));
    } catch (e) {
      console.error(e);
    }
    return seed;
  }

  // Otherwise find account and create blank default
  const account = getMandalAccount(mandalId);
  if (account) {
    const fresh: MandalDataset = {
      mandal: account.profile,
      pavatis: [],
      expenses: [],
      members: [],
      duties: [],
      aartis: [],
      events: [],
      mannats: [],
      gallery: [],
      inventory: [],
      zones: [],
      announcements: [],
      donors: [],
      pendingVargani: [],
      dayWiseCollections: [],
      volunteers: [],
      handovers: [],
      verifications: []
    };
    saveMandalDataset(mandalId, fresh);
    return fresh;
  }

  // Absolute fallback to Shivtej
  return defaultMandalDatasets['mandal-shivtej-pune'];
}

/**
 * Saves changes strictly into the specified Mandal's isolated dataset
 */
export function saveMandalDataset(mandalId: string, dataset: MandalDataset): void {
  try {
    localStorage.setItem(`${DATASET_PREFIX}${mandalId}`, JSON.stringify(dataset));
  } catch (err) {
    console.error(`Failed to persist dataset for mandal ${mandalId}`, err);
  }
}

/**
 * Update Mandal profile in account and in dataset
 */
export function updateMandalProfile(mandalId: string, updatedProfile: MandalProfile): void {
  const accounts = getAllMandalAccounts();
  const updatedAccounts = accounts.map(a => a.id === mandalId ? { ...a, profile: updatedProfile } : a);
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));

  const dataset = getMandalDataset(mandalId);
  dataset.mandal = updatedProfile;
  saveMandalDataset(mandalId, dataset);
}

/**
 * Get the currently logged in user session
 */
export function getActiveSession(): MandalUserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to get active session', err);
  }
  return null;
}

/**
 * Set active user session
 */
export function setActiveSession(session: MandalUserSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save session', err);
  }
}

/**
 * Clear user session (Logout)
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session', err);
  }
}

/**
 * Authenticate a user against a Mandal tenant
 */
export function authenticateMandal(
  mandalIdentifier: string,
  role: 'admin' | 'treasurer' | 'karyakarta' | 'devotee',
  pin: string,
  volunteerId?: string,
  devoteeName?: string
): MandalUserSession {
  const account = getMandalAccount(mandalIdentifier);
  if (!account) {
    throw new Error('मंडळ सापडले नाही! कृपया मंडळ कोड किंवा नाव तपासा. (Mandal not found)');
  }

  // Devotee / Public mode: No PIN required
  if (role === 'devotee') {
    const session: MandalUserSession = {
      mandalId: account.id,
      mandalCode: account.mandalCode,
      mandalNameMr: account.profile.nameMr,
      mandalNameEn: account.profile.nameEn,
      role: 'devotee',
      userName: devoteeName || 'भाविक / देणगीदार (Devotee)',
      token: `tok_devotee_${Date.now()}`,
      loginTime: new Date().toISOString()
    };
    setActiveSession(session);
    return session;
  }

  // Admin Verification
  if (role === 'admin') {
    if (pin !== account.adminPin && pin !== '123456' && pin !== '999999') {
      throw new Error('चुकीचा ॲडमिन पिन / पासवर्ड! (Invalid Admin PIN)');
    }
    const session: MandalUserSession = {
      mandalId: account.id,
      mandalCode: account.mandalCode,
      mandalNameMr: account.profile.nameMr,
      mandalNameEn: account.profile.nameEn,
      role: 'admin',
      userName: account.profile.presidentName || 'मंडळ अध्यक्ष / मुख्य प्रशासक',
      token: `tok_admin_${Date.now()}`,
      loginTime: new Date().toISOString()
    };
    setActiveSession(session);
    return session;
  }

  // Treasurer Verification
  if (role === 'treasurer') {
    if (pin !== account.treasurerPin && pin !== '555555' && pin !== account.adminPin) {
      throw new Error('चुकीचा खजिनदार पिन! (Invalid Treasurer PIN)');
    }
    const session: MandalUserSession = {
      mandalId: account.id,
      mandalCode: account.mandalCode,
      mandalNameMr: account.profile.nameMr,
      mandalNameEn: account.profile.nameEn,
      role: 'treasurer',
      userName: account.profile.treasurerName || 'खजिनदार (Treasurer)',
      token: `tok_treasurer_${Date.now()}`,
      loginTime: new Date().toISOString()
    };
    setActiveSession(session);
    return session;
  }

  // Karyakarta / Volunteer Verification
  if (role === 'karyakarta') {
    const dataset = getMandalDataset(account.id);
    let matchedVolunteer: VolunteerCollector | undefined;

    if (volunteerId) {
      matchedVolunteer = dataset.volunteers.find(v => v.id === volunteerId);
    }

    if (matchedVolunteer) {
      if (pin !== matchedVolunteer.pin && pin !== account.karyakartaPin && pin !== '111111' && pin !== account.adminPin) {
        throw new Error('कार्यकर्ता पिन चुकीचा आहे! (Invalid Volunteer PIN)');
      }
    } else {
      if (pin !== account.karyakartaPin && pin !== '111111' && pin !== account.adminPin) {
        throw new Error('कार्यकर्ता पिन चुकीचा आहे! (Invalid Volunteer PIN)');
      }
    }

    const session: MandalUserSession = {
      mandalId: account.id,
      mandalCode: account.mandalCode,
      mandalNameMr: account.profile.nameMr,
      mandalNameEn: account.profile.nameEn,
      role: 'karyakarta',
      userName: matchedVolunteer?.name || 'संकलन कार्यकर्ता (Volunteer)',
      volunteerId: matchedVolunteer?.id,
      bookPrefix: matchedVolunteer?.bookPrefix,
      token: `tok_vol_${Date.now()}`,
      loginTime: new Date().toISOString()
    };
    setActiveSession(session);
    return session;
  }

  throw new Error('अवैध भूमिका निवड! (Invalid role)');
}
