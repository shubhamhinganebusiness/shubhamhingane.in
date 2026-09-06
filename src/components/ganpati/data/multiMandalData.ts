import { MandalAccount, MandalDataset } from '../types';
import { 
  initialMandalProfile, 
  initialPavatis, 
  initialExpenses, 
  initialMembers, 
  initialVolunteerDuties, 
  initialAartiSchedule, 
  initialMandalEvents, 
  initialMannatPrayers, 
  initialGallery, 
  initialInventory, 
  initialPandalZones, 
  initialAnnouncements,
  initialDonors,
  initialPendingVargani,
  initialDayWiseCollections,
  initialVolunteers,
  initialHandovers,
  initialNightlyVerifications
} from './initialData';

// ---------------------------------------------------------------------------
// 1. MANDAL 1: श्री शिवतेज सार्वजनिक गणेशोत्सव मंडळ, सदाशिव पेठ, पुणे
// ---------------------------------------------------------------------------
export const mandalShivtejAccount: MandalAccount = {
  id: 'mandal-shivtej-pune',
  mandalCode: 'SHIVTEJ_PUNE',
  profile: initialMandalProfile,
  receiptPrefix: 'GMP-2026-',
  adminPin: '123456',
  treasurerPin: '555555',
  karyakartaPin: '111111',
  categoryTier: 'A-Grade (अ वर्ग)',
  isVerified: true,
  createdAt: '1982-08-25',
  totalVolunteersCount: 45
};

export const mandalShivtejDataset: MandalDataset = {
  mandal: initialMandalProfile,
  pavatis: initialPavatis,
  expenses: initialExpenses,
  members: initialMembers,
  duties: initialVolunteerDuties,
  aartis: initialAartiSchedule,
  events: initialMandalEvents,
  mannats: initialMannatPrayers,
  gallery: initialGallery,
  inventory: initialInventory,
  zones: initialPandalZones,
  announcements: initialAnnouncements,
  donors: initialDonors,
  pendingVargani: initialPendingVargani,
  dayWiseCollections: initialDayWiseCollections,
  volunteers: initialVolunteers,
  handovers: initialHandovers,
  verifications: initialNightlyVerifications
};

// ---------------------------------------------------------------------------
// 2. MANDAL 2: लालबागचा राजा सार्वजनिक गणेशोत्सव मंडळ, मुंबई
// ---------------------------------------------------------------------------
export const mandalLalbaugAccount: MandalAccount = {
  id: 'mandal-lalbaug-mumbai',
  mandalCode: 'LALBAUG_MUMBAI',
  profile: {
    nameMr: 'लालबागचा राजा सार्वजनिक गणेशोत्सव मंडळ, मुंबई',
    nameEn: 'Lalbaugcha Raja Sarvajanik Ganeshotsav Mandal, Mumbai',
    nameHi: 'लालबागचा राजा सार्वजनिक गणेशोत्सव मंडल, मुंबई',
    taglineMr: '॥ नवसाला पावणारा लालबागचा राजा - ९३ वे वर्ष ॥',
    taglineEn: 'The King of Lalbaug - Fulfiller of Wishes (93rd Year)',
    logoUrl: 'https://images.unsplash.com/photo-1609358905581-e5382c46f1e8?auto=format&fit=crop&q=80&w=200',
    slogan: '॥ नवसाचा गणपती, कोट्यवधी भक्तांचे श्रद्धास्थान ॥',
    regNumber: 'MAHA/1934/MUM/F-8921',
    establishedYear: 1934,
    presidentName: 'श्री. बाळकृष्ण (अण्णा) श्रॉफ',
    secretaryName: 'श्री. सुधीर साळवी',
    treasurerName: 'श्री. मंगेश दळवी',
    phone: '+91 98200 98340',
    email: 'lalbaugcharaja.trust@gmail.com',
    addressMr: 'लालबाग मार्केट, डॉ. बाबासाहेब आंबेडकर मार्ग, लालबाग, परळ, मुंबई',
    addressEn: 'Lalbaug Market, Dr. B.A. Road, Lalbaug, Parel, Mumbai',
    city: 'Mumbai',
    pincode: '400012',
    themeTitleMr: 'अयोध्या राम मंदिर भव्य राजदरबार व सुवर्ण आभूषणे देखावा',
    themeTitleEn: 'Grand Ayodhya Ram Mandir Royal Court with Golden Ornaments',
    themeDescriptionMr: 'या वर्षी लालबागच्या राजासाठी ५० किलो सोन्याचे मुकुट, रत्नजडित हार आणि अयोध्या मंदिराच्या भव्य प्रतिकृतीचा देखावा साकारण्यात आला आहे. दररोज २५ लाख भाविक दर्शनास येतात.',
    themeDescriptionEn: 'A magnificent royal replica featuring pure gold ornaments, gemstone crowns, and an intricate temple pavilion hosting 2.5 million devotees daily.',
    idolHeight: '12 Feet (पारंपरिक मूर्ती)',
    sculptorName: 'कांबळी आर्ट्स (संतोष कांबळी, मुंबई)',
    socials: {
      instagram: 'https://instagram.com/lalbaugcharaja',
      youtube: 'https://youtube.com/@LalbaugchaRajaOfficial',
      facebook: 'https://facebook.com/LalbaugchaRaja',
      whatsappGroup: 'https://chat.whatsapp.com/invite/lalbaug2026'
    },
    historyMr: '१९३४ मध्ये कोळी आणि कामगार बांधवांच्या नवसाने स्थापन झालेला हा उत्सव आज संपूर्ण जगातील सर्वात मोठा आणि सर्वात प्रसिद्ध गणेशोत्सव आहे.',
    historyEn: 'Founded in 1934 by local fishermen and mill workers, Lalbaugcha Raja is celebrated globally with unmatched devotion.',
    upiId: 'lalbaugcharajatrust@hdfcbank',
    bankDetails: {
      accountName: 'Lalbaugcha Raja Sarvajanik Ganeshotsav Mandal Trust',
      accountNumber: '50200084920194',
      ifsc: 'HDFC0000128',
      bankName: 'HDFC Bank',
      branch: 'Lalbaug, Mumbai'
    }
  },
  receiptPrefix: 'LBR-2026-',
  adminPin: '123456',
  treasurerPin: '555555',
  karyakartaPin: '111111',
  categoryTier: 'Trust (सार्वजनिक ट्रस्ट)',
  isVerified: true,
  createdAt: '1934-09-12',
  totalVolunteersCount: 250
};

export const mandalLalbaugDataset: MandalDataset = {
  mandal: mandalLalbaugAccount.profile,
  pavatis: [
    {
      id: 'lbr-101',
      receiptNumber: 'LBR-2026-0001',
      donorName: 'मे. रिलायन्स फाऊंडेशन व कुटुंब',
      phone: '9820011223',
      email: 'trust.desk@reliance.com',
      address: 'अल्टमाऊंट रोड, मुंबई',
      amount: 251000,
      paymentMode: 'bank_transfer',
      category: 'सुवर्ण-चांदी देणगी (Gold/Silver Offering)',
      date: '2026-08-16',
      time: '09:00 AM',
      transactionRef: 'NEFT/HDFC20260816001',
      notes: 'सुवर्ण अलंकार व १ किलो चांदी मोदक अर्पण',
      receivedBy: 'मंगेश दळवी (खजिनदार)',
      isVerified: true,
      panNumber: 'AAACR1290K',
      is80GExempt: true
    },
    {
      id: 'lbr-102',
      receiptNumber: 'LBR-2026-0002',
      donorName: 'श्री. विजय दिनकर सावंत (उद्योगपती)',
      phone: '9819098765',
      address: 'वरळी सी-फेस, मुंबई',
      amount: 51000,
      paymentMode: 'upi',
      category: 'नवस व संकल्प निधी (Mannat Donation)',
      date: '2026-08-16',
      time: '10:45 AM',
      transactionRef: 'UPI/9812401823/AXIS',
      notes: 'नवस पूर्ण झाल्याबद्दल सप्रेम देणगी',
      receivedBy: 'सुधीर साळवी (सचिव)',
      isVerified: true,
      panNumber: 'AABPS9812J'
    },
    {
      id: 'lbr-103',
      receiptNumber: 'LBR-2026-0003',
      donorName: 'सौ. वैशाली मनोहर तांबट',
      phone: '9821456789',
      address: 'परळ गाव, मुंबई',
      amount: 11000,
      paymentMode: 'cash',
      category: 'महाप्रसाद व अन्नदान (Maha Prasad & Annadaan)',
      date: '2026-08-16',
      time: '01:15 PM',
      receivedBy: 'प्रमोद सावंत (कार्यकर्ता)',
      isVerified: true
    }
  ],
  expenses: [
    {
      id: 'lbr-exp-01',
      voucherNumber: 'LBR-EXP-001',
      title: 'सुरक्षा बंदोबस्त, मेटल डिटेक्टर्स व १०० बाउन्सर्स',
      vendorName: 'महाराष्ट्र कमांडो सिक्युरिटी, मुंबई',
      amount: 85000,
      category: 'सुरक्षा, पोलीस व सीसीटीव्ही (Security & Police)',
      paymentMode: 'bank_transfer',
      date: '2026-08-15',
      billNumber: 'MCS/MUM/2026/01',
      approvedBy: 'बाळकृष्ण श्रॉफ (अध्यक्ष)'
    },
    {
      id: 'lbr-exp-02',
      voucherNumber: 'LBR-EXP-002',
      title: 'अखंड ५०० किलो महाप्रसाद लाडू बनवणे साहित्य',
      vendorName: 'श्री गणेश स्वीट्स & केटरर्स, लालबाग',
      amount: 62000,
      category: 'महाप्रसाद व अन्नदान (Mahaprasad & Cooking)',
      paymentMode: 'cheque',
      date: '2026-08-15',
      billNumber: 'SGS/2026/89',
      approvedBy: 'मंगेश दळवी (खजिनदार)'
    }
  ],
  members: [
    {
      id: 'lbr-m-01',
      memberId: 'LBR-M01',
      name: 'श्री. बाळकृष्ण (अण्णा) श्रॉफ',
      role: 'President',
      designationMr: 'अध्यक्ष (विश्वस्त)',
      phone: '9820098340',
      email: 'president@lalbaugcharaja.com',
      bloodGroup: 'O+',
      address: 'लालबाग, मुंबई',
      joinYear: 1978,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
      annualFeeStatus: 'Paid',
      feePaidAmount: 10000,
      dueAmount: 0,
      isExecutiveBearer: true,
      executiveRank: 1
    },
    {
      id: 'lbr-m-02',
      memberId: 'LBR-M02',
      name: 'श्री. सुधीर साळवी',
      role: 'Secretary',
      designationMr: 'सचिव (मानद मानकरी)',
      phone: '9820011445',
      email: 'secretary@lalbaugcharaja.com',
      bloodGroup: 'B+',
      address: 'परळ, मुंबई',
      joinYear: 1990,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
      annualFeeStatus: 'Paid',
      feePaidAmount: 5000,
      dueAmount: 0,
      isExecutiveBearer: true,
      executiveRank: 2
    }
  ],
  duties: [
    {
      id: 'lbr-duty-01',
      volunteerName: 'प्रमोद सावंत',
      volunteerPhone: '9819001122',
      dutyType: 'Crowd Management',
      date: '2026-08-16',
      timeSlot: '08:00 AM - 04:00 PM',
      status: 'Confirmed',
      location: 'चरणस्पर्श नवस रांग गेट १',
      assignedBy: 'सुधीर साळवी'
    }
  ],
  aartis: [
    {
      id: 'lbr-art-01',
      titleMr: 'पहाटेची मंगल काकड आरती',
      titleEn: 'Dawn Kakad Aarti',
      time: '05:30 AM',
      type: 'Kakad Aarti',
      descriptionMr: 'राजाच्या चरणी पहिली दैनंदिन पावन काकड आरती',
      descriptionEn: 'First holy dawn aarti at the lotus feet of the King',
      maxBookingSlots: 20,
      bookedSlots: 20,
      pricePerSlot: 2100
    },
    {
      id: 'lbr-art-02',
      titleMr: 'रात्रीची महाआरती व धूपारती',
      titleEn: 'Night Maha Aarti & Dhoop Aarti',
      time: '08:00 PM',
      type: 'Special Maha Aarti',
      descriptionMr: 'भव्य ढोल-ताशा गजर व मंत्रोच्चाराने संपन्न होणारी महाआरती',
      descriptionEn: 'Grand evening Aarti accompanied by devotional chants',
      maxBookingSlots: 50,
      bookedSlots: 42,
      pricePerSlot: 5100
    }
  ],
  events: [
    {
      id: 'lbr-ev-01',
      titleMr: 'भव्य सुवर्ण अलंकार प्रातिनिधिक दर्शन सोहळा',
      titleEn: 'Golden Ornaments Unveiling Ceremony',
      date: '2026-08-14',
      time: '06:00 PM',
      category: 'Spiritual',
      location: 'मुख्य मंडप, लालबाग',
      description: 'राजाच्या ५० किलो सुवर्ण मुकुट व हारांचे मंत्रोच्चारात पूजन'
    }
  ],
  mannats: [
    {
      id: 'lbr-man-01',
      devoteeName: 'सौ. अनघा जोशी',
      city: 'ठाणे',
      wishText: 'बाप्पा, मुलाच्या आयएएस परीक्षेत यश मिळू दे व संपूर्ण कुटुंबाला आरोग्य लाभू दे.',
      date: '2026-08-16',
      flowerCount: 142,
      isApproved: true,
      isFeatured: true,
      answeredStatus: 'Fulfilled (नवस पूर्ण)'
    }
  ],
  gallery: [
    {
      id: 'lbr-g-01',
      titleMr: 'लालबागचा राजा २०२६ भव्य रूप',
      titleEn: 'Lalbaugcha Raja 2026 Divine Darshan',
      category: 'Murti',
      mediaUrl: 'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=800',
      thumbnail: 'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=300',
      year: 2026,
      caption: 'अथांग जनसागराचे आराध्य दैवत'
    }
  ],
  inventory: [
    {
      id: 'lbr-inv-01',
      name: 'सुवर्ण मुकुट व रत्नजडित हार (तिजोरी सुरक्षित)',
      category: 'Puja Sahitya',
      quantity: 1,
      unit: 'Set',
      minRequired: 1,
      location: 'मुख्य बँक स्ट्रॉंग रूम',
      condition: 'Good'
    }
  ],
  zones: [
    {
      id: 'lbr-zone-01',
      name: 'चरणस्पर्श नवस रांग (Navas Line)',
      status: 'Heavy',
      estimatedPeople: 8500,
      waitMinutes: 360,
      incharge: 'सुनील परब'
    },
    {
      id: 'lbr-zone-02',
      name: 'मुखदर्शन रांग (General Mukhdarshan)',
      status: 'Moderate',
      estimatedPeople: 3200,
      waitMinutes: 90,
      incharge: 'रवींद्र सावंत'
    }
  ],
  announcements: [
    {
      id: 'lbr-ann-01',
      titleMr: 'नवस रांगेतील भाविकांना पाणी व मोफत अल्पोपहार वाटप सुरू आहे',
      titleEn: 'Free drinking water and snacks distributed in navas queue',
      category: 'Urgent',
      timestamp: '१० मिनिटांपूर्वी',
      isActive: true
    }
  ],
  donors: [
    {
      id: 'lbr-dn-01',
      donorId: 'LBR-D01',
      name: 'मे. रिलायन्स फाऊंडेशन',
      phone: '9820011223',
      address: 'मुंबई',
      area: 'अल्टमाऊंट रोड',
      category: 'VIP / Trust (विशेष देणगीदार)',
      totalDonated: 251000,
      donationsCount: 1,
      lastDonationDate: '2026-08-16',
      receiptNumbers: ['LBR-2026-0001'],
      repeatDonor: true,
      status: 'Active'
    }
  ],
  pendingVargani: [],
  dayWiseCollections: [
    {
      dayNumber: 1,
      date: '2026-08-16',
      festivalDayNameMr: 'दिवस १ - श्री गणेश चतुर्थी आगमन सोहळा',
      festivalDayNameEn: 'Day 1 - Ganesh Chaturthi Arrival',
      targetAmount: 1000000,
      collectedAmount: 313000,
      pavatisCount: 3,
      expensesAmount: 147000,
      majorEventMr: 'पहाटे महापूजा व प्रथम चरणस्पर्श दर्शन'
    }
  ],
  volunteers: [
    {
      id: 'lbr-vol-01',
      name: 'प्रमोद सावंत',
      phone: '9819001122',
      role: 'head_collector',
      pin: '111111',
      bookNumber: 'Book-LBR-01',
      bookPrefix: 'LBR-01-',
      assignedRangeStart: 1,
      assignedRangeEnd: 500,
      currentReceiptIndex: 1,
      assignedArea: 'व्हीआयपी व मुख्य देणगी कक्ष',
      targetAmount: 500000,
      status: 'Active',
      totalCollected: 11000,
      totalReceiptsCount: 1,
      cashCollected: 11000,
      digitalCollected: 0,
      cashHandedOver: 0,
      cashInHand: 11000,
      deviceId: 'DEV-LBR-01',
      lastActiveAt: new Date().toISOString()
    }
  ],
  handovers: [],
  verifications: []
};

// ---------------------------------------------------------------------------
// 3. MANDAL 3: श्रीमंत दगडूशेठ हलवाई सार्वजनिक गणपती ट्रस्ट, पुणे
// ---------------------------------------------------------------------------
export const mandalDagdushethAccount: MandalAccount = {
  id: 'mandal-dagdusheth-pune',
  mandalCode: 'DAGDUSHETH_PUNE',
  profile: {
    nameMr: 'श्रीमंत दगडूशेठ हलवाई सार्वजनिक गणपती ट्रस्ट, पुणे',
    nameEn: 'Shrimant Dagdusheth Halwai Ganpati Trust, Pune',
    nameHi: 'श्रीमंत दगडूशेठ हलवाई सार्वजनिक गणपति ट्रस्ट, पुणे',
    taglineMr: '॥ जय गणेश रुग्णसेवा, शैक्षणिक विकास व भव्य अथर्वशीर्ष पठण ॥',
    taglineEn: 'Serving Humanity & Preserving Sanatan Tradition Since 1893',
    logoUrl: 'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=200',
    slogan: '॥ बाप्पांच्या कृपेने रुग्णसेवा व समाजसेवा हेच आमचे व्रत ॥',
    regNumber: 'MAHA/1893/PUNE/F-102',
    establishedYear: 1893,
    presidentName: 'श्री. माणिकराव चव्हाण (अध्यक्ष)',
    secretaryName: 'श्री. हेमंत रासने',
    treasurerName: 'श्री. महेश सूर्यवंशी',
    phone: '+91 98220 54321',
    email: 'info@dagdushethganpati.com',
    addressMr: 'गणपती चौक, छत्रपती शिवाजी महाराज रस्ता, बुधवार पेठ, पुणे',
    addressEn: 'Ganpati Chowk, Chhatrapati Shivaji Maharaj Road, Budhwar Peth, Pune',
    city: 'Pune',
    pincode: '411002',
    themeTitleMr: 'सुवर्ण महामंदिर राजप्रासाद व ३१,००० महिलांचे ऋषिपंचमी अथर्वशीर्ष पठण',
    themeTitleEn: 'Golden Grand Palace & 31,000 Women Rishi Panchami Atharvashirsha Chanting',
    themeDescriptionMr: '१३३ व्या वर्षात संपूर्ण सुवर्ण मंडप प्रतिकृती, मोफत रुग्णवाहिका सेवा आणि ३१,००० माता-भगिनींचे भव्य सामूहिक अथर्वशीर्ष पठण.',
    themeDescriptionEn: 'Historic 133rd year celebration featuring a golden temple pavilion and massive social hospital healthcare initiatives.',
    idolHeight: '7.5 Feet (शुद्ध सुवर्ण आभूषणे)',
    sculptorName: 'पारंपरिक सुवर्णकार व शिल्पकार मंडळ',
    socials: {
      instagram: 'https://instagram.com/dagdushethganpatipune',
      youtube: 'https://youtube.com/@DagdushethGanpatiTrust',
      facebook: 'https://facebook.com/DagdushethGanpatiTrust',
      whatsappGroup: 'https://chat.whatsapp.com/invite/dagdusheth2026'
    },
    historyMr: '१८९३ मध्ये श्रीमंत दगडूशेठ हलवाई आणि लक्ष्मीबाई यांनी लोकमान्य टिळकांच्या प्रेरणेने हा ऐतिहासिक उत्सव सुरू केला.',
    historyEn: 'Established in 1893 by Shrimant Dagdusheth and Laxmibai Halwai under the inspiration of Lokmanya Tilak.',
    upiId: 'dagdushethtrust@sbi',
    bankDetails: {
      accountName: 'Shrimant Dagdusheth Halwai Ganpati Trust',
      accountNumber: '109283746501',
      ifsc: 'SBIN0000455',
      bankName: 'State Bank of India',
      branch: 'Budhwar Peth, Pune'
    }
  },
  receiptPrefix: 'DGD-2026-',
  adminPin: '123456',
  treasurerPin: '555555',
  karyakartaPin: '111111',
  categoryTier: 'Trust (सार्वजनिक ट्रस्ट)',
  isVerified: true,
  createdAt: '1893-08-20',
  totalVolunteersCount: 180
};

export const mandalDagdushethDataset: MandalDataset = {
  mandal: mandalDagdushethAccount.profile,
  pavatis: [
    {
      id: 'dgd-101',
      receiptNumber: 'DGD-2026-0001',
      donorName: 'डॉ. नितीन प्रभाकर देवरुखकर',
      phone: '9822456780',
      email: 'dr.devrukhkar@gmail.com',
      address: 'प्रभात रस्ता, पुणे',
      amount: 51000,
      paymentMode: 'netbanking',
      category: 'General Donation (देणगी)',
      date: '2026-08-16',
      time: '11:00 AM',
      transactionRef: 'NEFT/SBI2026081699',
      notes: 'जय गणेश रुग्णसेवा निधी व मोफत औषधोपचार सहाय्य',
      receivedBy: 'महेश सूर्यवंशी (खजिनदार)',
      isVerified: true,
      panNumber: 'AAAPN1928K',
      is80GExempt: true
    },
    {
      id: 'dgd-102',
      receiptNumber: 'DGD-2026-0002',
      donorName: 'सौ. मंगला अविनाश देशपांडे',
      phone: '9422501928',
      address: 'डेक्कन, पुणे',
      amount: 21000,
      paymentMode: 'gpay',
      category: 'Maha Aarti Sponsorship (महाआरती)',
      date: '2026-08-16',
      time: '05:30 PM',
      transactionRef: 'GPAY/DGD81920',
      notes: 'ऋषिपंचमी मुख्य महाआरती यजमानपद',
      receivedBy: 'हेमंत रासने (सचिव)',
      isVerified: true
    }
  ],
  expenses: [
    {
      id: 'dgd-exp-01',
      voucherNumber: 'DGD-EXP-001',
      title: '३१,००० महिलांच्या अथर्वशीर्ष पठणासाठी बैठक व्यवस्था व मांडणी',
      vendorName: 'पुणे इव्हेंट्स & मंडप असोसिएशन',
      amount: 45000,
      category: 'मंडप व देखावा उभारणी (Pandal & Mandap Setup)',
      paymentMode: 'cheque',
      date: '2026-08-15',
      billNumber: 'PEA/2026/041',
      approvedBy: 'माणिकराव चव्हाण (अध्यक्ष)'
    }
  ],
  members: [
    {
      id: 'dgd-m-01',
      memberId: 'DGD-M01',
      name: 'श्री. माणिकराव चव्हाण',
      role: 'President',
      designationMr: 'अध्यक्ष',
      phone: '9822054321',
      email: 'president@dagdusheth.com',
      bloodGroup: 'A+',
      address: 'पुढील पेठ, पुणे',
      joinYear: 1985,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
      annualFeeStatus: 'Paid',
      feePaidAmount: 5000,
      dueAmount: 0,
      isExecutiveBearer: true,
      executiveRank: 1
    }
  ],
  duties: [],
  aartis: [
    {
      id: 'dgd-art-01',
      titleMr: 'सकाळची मंगल आरती',
      titleEn: 'Morning Divine Aarti',
      time: '07:30 AM',
      type: 'Kakad Aarti',
      descriptionMr: 'दगडूशेठ बाप्पांची नित्य प्रातः आरती',
      descriptionEn: 'Daily morning prayers at Dagdusheth Temple',
      maxBookingSlots: 25,
      bookedSlots: 25,
      pricePerSlot: 1100
    }
  ],
  events: [],
  mannats: [],
  gallery: [],
  inventory: [],
  zones: [
    {
      id: 'dgd-z-01',
      name: 'मुख्य मंदिर गाभारा दर्शन रांग',
      status: 'Heavy',
      estimatedPeople: 4500,
      waitMinutes: 120,
      incharge: 'अमोल सूर्यवंशी'
    }
  ],
  announcements: [
    {
      id: 'dgd-ann-01',
      titleMr: 'ऋषिपंचमी अथर्वशीर्ष पठण नोंदणी पूर्ण झाली आहे',
      titleEn: 'Atharvashirsha Chanting registration is now full',
      category: 'Event',
      timestamp: '१ तासापूर्वी',
      isActive: true
    }
  ],
  donors: [],
  pendingVargani: [],
  dayWiseCollections: [],
  volunteers: [],
  handovers: [],
  verifications: []
};

// ---------------------------------------------------------------------------
// 4. MANDAL 4: बाल गोपाळ मित्र मंडळ, ठाणे (प.)
// ---------------------------------------------------------------------------
export const mandalBalgopalAccount: MandalAccount = {
  id: 'mandal-balgopal-thane',
  mandalCode: 'BALGOPAL_THANE',
  profile: {
    nameMr: 'बाल गोपाळ मित्र मंडळ, नौपाडा, ठाणे (प.)',
    nameEn: 'Bal Gopal Mitra Mandal, Naupada, Thane (W)',
    nameHi: 'बाल गोपाल मित्र मंडल, नौपाडा, ठाणे (प.)',
    taglineMr: '॥ एकता, शिस्त व बाल संस्कार महोत्सव - ३२ वे वर्ष ॥',
    taglineEn: 'Unity, Youth Development & Cultural Fest - 32nd Year',
    logoUrl: 'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=200',
    slogan: '॥ पर्यावरण रक्षण, वृक्षारोपण व स्वच्छ ठाणे संकल्प ॥',
    regNumber: 'MAHA/1994/THANE/F-4512',
    establishedYear: 1994,
    presidentName: 'श्री. नीलेश (दादा) म्हात्रे',
    secretaryName: 'श्री. समीर वर्तक',
    treasurerName: 'श्री. चेतन गांगुर्डे',
    phone: '+91 98205 67890',
    email: 'balgopal.thane@gmail.com',
    addressMr: 'गोखले रस्ता, नौपाडा, ठाणे (पश्चिम)',
    addressEn: 'Gokhale Road, Naupada, Thane (West)',
    city: 'Thane',
    pincode: '400602',
    themeTitleMr: 'सह्याद्रीचे किल्ले व पर्यावरणपूरक बांबू देखावा',
    themeTitleEn: 'Sahyadri Forts & Eco-friendly Bamboo Architecture',
    themeDescriptionMr: 'छत्रपती शिवाजी महाराजांच्या सह्याद्रीतील किल्ल्यांचा जिवंत देखावा आणि प्लास्टिकमुक्त उत्सवाचा संदेश.',
    themeDescriptionEn: 'Authentic miniature models of Sahyadri hill forts built entirely with biodegradable natural bamboo and jute.',
    idolHeight: '9 Feet (मातीची मूर्ती)',
    sculptorName: 'पेणकर बंधू, ठाणे',
    socials: {
      instagram: 'https://instagram.com/balgopal_thane',
      youtube: 'https://youtube.com/@BalGopalThane',
      facebook: 'https://facebook.com/BalGopalThane',
      whatsappGroup: 'https://chat.whatsapp.com/invite/balgopal2026'
    },
    historyMr: '१९९४ मध्ये परिसरातील तरुणांनी सामाजिक कार्याची प्रेरणा घेऊन सुरू केलेले ठाण्यातील अग्रगण्य मंडळ.',
    historyEn: 'Founded by community youth in 1994 focusing on green initiatives and child welfare.',
    upiId: 'balgopalthane@icici',
    bankDetails: {
      accountName: 'Bal Gopal Mitra Mandal Public Trust',
      accountNumber: '293810294820',
      ifsc: 'ICIC0000214',
      bankName: 'ICICI Bank',
      branch: 'Naupada, Thane'
    }
  },
  receiptPrefix: 'BGM-2026-',
  adminPin: '123456',
  treasurerPin: '555555',
  karyakartaPin: '111111',
  categoryTier: 'B-Grade (ब वर्ग)',
  isVerified: true,
  createdAt: '1994-09-01',
  totalVolunteersCount: 30
};

export const mandalBalgopalDataset: MandalDataset = {
  mandal: mandalBalgopalAccount.profile,
  pavatis: [
    {
      id: 'bgm-101',
      receiptNumber: 'BGM-2026-0001',
      donorName: 'श्री. अविनाश भास्कर पाटील',
      phone: '9820512345',
      address: 'नौपाडा, ठाणे',
      amount: 5000,
      paymentMode: 'cash',
      category: 'वार्षिक घरगुती वर्गणी (Annual Household Vargani)',
      date: '2026-08-16',
      time: '02:00 PM',
      receivedBy: 'चेतन गांगुर्डे (खजिनदार)',
      isVerified: true
    }
  ],
  expenses: [
    {
      id: 'bgm-exp-01',
      voucherNumber: 'BGM-EXP-001',
      title: 'बांबू, चटया व लाकूड साहित्य खरेदी',
      vendorName: 'ठाणे बांबू डेपो',
      amount: 12000,
      category: 'मंडप व देखावा उभारणी (Pandal & Mandap Setup)',
      paymentMode: 'cash',
      date: '2026-08-14',
      billNumber: 'TBD/102',
      approvedBy: 'नीलेश म्हात्रे (अध्यक्ष)'
    }
  ],
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

// ---------------------------------------------------------------------------
// 5. MANDAL 5: अखिल कसबा गणपती सार्वजनिक मंडळ (मानाचा पहिला गणपती), पुणे
// ---------------------------------------------------------------------------
export const mandalKasbaAccount: MandalAccount = {
  id: 'mandal-kasba-pune',
  mandalCode: 'KASBA_PUNE',
  profile: {
    nameMr: 'श्री कसबा गणपती सार्वजनिक मंडळ (पुण्याचे ग्रामदैवत - मानाचा पहिला गणपती)',
    nameEn: 'Shree Kasba Ganpati Mandal (Manacha Pahila Ganpati), Pune',
    nameHi: 'श्री कसबा गणपति सार्वजनिक मंडल (मानाचा पहिला गणपति), पुणे',
    taglineMr: '॥ पुण्याचे ग्रामदैवत, छत्रपती शिवाजी महाराज व जिजाऊ माता प्रतिष्ठापित ॥',
    taglineEn: 'The Historic Gramdaivat of Pune Established by Rajmata Jijau in 1630',
    logoUrl: 'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=200',
    slogan: '॥ मानाचा पहिला गणपती, पुण्याचा अभिमान ॥',
    regNumber: 'MAHA/1630/PUNE/F-01',
    establishedYear: 1893,
    presidentName: 'श्री. श्रीकांत शेटे (अध्यक्ष)',
    secretaryName: 'श्री. प्रसाद कुलकर्णी',
    treasurerName: 'श्री. विनायक ठकार',
    phone: '+91 98222 16300',
    email: 'kasbaganpatipune@gmail.com',
    addressMr: 'कसबा पेठ, लाल महाल जवळ, पुणे',
    addressEn: 'Kasba Peth, Near Lal Mahal, Pune',
    city: 'Pune',
    pincode: '411011',
    themeTitleMr: 'पारंपरिक शिवकालीन पालखी सोहळा व चांदीची पालखी मिरवणूक',
    themeTitleEn: 'Traditional Chhatrapati Shivaji Era Silver Palkhi Procession',
    themeDescriptionMr: 'पुण्याचा मानाचा पहिला गणपती म्हणून परंपरेनुसार चांदीच्या पालखीत श्रींची विसर्जन मिरवणूक आणि ऐतिहासिक धार्मिक विधी.',
    themeDescriptionEn: 'Honored as the prime prestigious Ganpati of Pune, led by traditional silver palanquin and heritage Vedic recitations.',
    idolHeight: '३.५ फूट (स्वयंभू मूर्ती)',
    sculptorName: 'स्वयंभू ऐतिहासिक मूर्ती',
    socials: {
      instagram: 'https://instagram.com/kasbaganpatiofficial',
      youtube: 'https://youtube.com/@KasbaGanpatiPune',
      facebook: 'https://facebook.com/KasbaGanpatiPune',
      whatsappGroup: 'https://chat.whatsapp.com/invite/kasba2026'
    },
    historyMr: '१६३० मध्ये राजमाता जिजाऊंनी कसबा गणपतीची स्थापना केली. लोकमान्य टिळकांनी १८९३ मध्ये सार्वजनिक उत्सवात यास मानाचे पहिले स्थान दिले.',
    historyEn: 'Consecrated in 1630 by Rajmata Jijabai, recognized as the First Prestigious Mandal of Pune by Lokmanya Tilak in 1893.',
    upiId: 'kasbaganpati@boi',
    bankDetails: {
      accountName: 'Shree Kasba Ganpati Devsthan Trust',
      accountNumber: '05191010001234',
      ifsc: 'BKID0000519',
      bankName: 'Bank of India',
      branch: 'Kasba Peth, Pune'
    }
  },
  receiptPrefix: 'KGP-2026-',
  adminPin: '123456',
  treasurerPin: '555555',
  karyakartaPin: '111111',
  categoryTier: 'Trust (सार्वजनिक ट्रस्ट)',
  isVerified: true,
  createdAt: '1893-08-01',
  totalVolunteersCount: 50
};

export const mandalKasbaDataset: MandalDataset = {
  mandal: mandalKasbaAccount.profile,
  pavatis: [
    {
      id: 'kgp-101',
      receiptNumber: 'KGP-2026-0001',
      donorName: 'श्री. आनंदराव बापूराव शिंदे',
      phone: '9822312345',
      address: 'कसबा पेठ, पुणे',
      amount: 11000,
      paymentMode: 'upi',
      category: 'General Donation (देणगी)',
      date: '2026-08-16',
      time: '08:30 AM',
      receivedBy: 'विनायक ठकार (खजिनदार)',
      isVerified: true
    }
  ],
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

// ---------------------------------------------------------------------------
// MASTER LIST OF DEFAULT SEED MANDALS
// ---------------------------------------------------------------------------
export const defaultMandalAccounts: MandalAccount[] = [
  mandalShivtejAccount,
  mandalLalbaugAccount,
  mandalDagdushethAccount,
  mandalBalgopalAccount,
  mandalKasbaAccount
];

export const defaultMandalDatasets: Record<string, MandalDataset> = {
  [mandalShivtejAccount.id]: mandalShivtejDataset,
  [mandalLalbaugAccount.id]: mandalLalbaugDataset,
  [mandalDagdushethAccount.id]: mandalDagdushethDataset,
  [mandalBalgopalAccount.id]: mandalBalgopalDataset,
  [mandalKasbaAccount.id]: mandalKasbaDataset
};
