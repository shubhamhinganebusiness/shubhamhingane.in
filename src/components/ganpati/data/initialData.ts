import { 
  MandalProfile, 
  DigitalPavati, 
  ExpenseEntry, 
  Member, 
  VolunteerDuty, 
  AartiEvent, 
  AartiBooking, 
  MannatWish, 
  InventoryItem, 
  Announcement, 
  GalleryMedia,
  DevoteeFeedback,
  DonorProfile,
  PendingVarganiEntry,
  DayWiseCollection,
  VolunteerCollector,
  CashHandoverRecord
} from '../types';

export const initialMandalProfile: MandalProfile = {
  nameMr: 'श्री शिवतेज सार्वजनिक गणेशोत्सव मंडळ, पुणे',
  nameEn: 'Shree Shivtej Sarvajanik Ganeshotsav Mandal, Pune',
  nameHi: 'श्री शिवतेज सार्वजनिक गणेशोत्सव मंडल, पुणे',
  taglineMr: '॥ सामाजिक प्रबोधन, सांस्कृतिक वारसा व लोकमान्य परंपरा ॥',
  taglineEn: 'Preserving Cultural Heritage & Social Harmony Since 1982',
  logoUrl: 'https://images.unsplash.com/photo-1567591414240-e2b2029707e5?auto=format&fit=crop&q=80&w=200',
  slogan: '॥ एकजुटीने उत्सव करूया, समाज समृद्ध घडवूया ॥',
  regNumber: 'MAHA/1982/PUNE/F-14258',
  establishedYear: 1982,
  presidentName: 'श्री. राजेंद्र (आण्णा) तांबडे',
  secretaryName: 'श्री. सचिन विजय कुलकर्णी',
  treasurerName: 'श्री. महेश चंद्रकांत गायकवाड',
  phone: '+91 98220 14258',
  email: 'shivtej.ganpati.pune@gmail.com',
  addressMr: 'टिळक रस्ता, अलका टॉकीज चौक जवळ, सदाशिव पेठ, पुणे',
  addressEn: 'Tilak Road, Near Alka Talkies Chowk, Sadashiv Peth, Pune',
  city: 'Pune',
  pincode: '411030',
  themeTitleMr: 'काशी विश्वनाथ मंदिर प्रतिकृती व पर्यावरणपूरक शाडू मूर्ती',
  themeTitleEn: 'Kashi Vishwanath Temple Replica & Eco-Friendly Shadu Clay Idol',
  themeDescriptionMr: 'या वर्षी मंडळाचे ४४ वे वर्ष असून काशी विश्वनाथ मंदिराची भव्य ७० फूट लाकडी व फायबर प्रतिकृती उभारण्यात आली आहे. १००% पर्यावरणपूरक १५ फूट मूर्तीची प्राणप्रतिष्ठापना केली आहे.',
  themeDescriptionEn: 'Celebrating the 44th year with a magnificent 70-foot authentic replica of Kashi Vishwanath Dham, sanctifying a 15-foot 100% eco-friendly clay idol.',
  idolHeight: '15 Feet (४.५ मीटर)',
  sculptorName: 'मूर्तिकार: सचिन कांबळे (पेण-महाराष्ट्र)',
  socials: {
    instagram: 'https://instagram.com/shivtej_ganpati_pune',
    youtube: 'https://youtube.com/@ShivtejGanpatiPune',
    facebook: 'https://facebook.com/ShivtejMandalPune',
    whatsappGroup: 'https://chat.whatsapp.com/invite/shivtej2026'
  },
  historyMr: '१९८२ साली स्थापन झालेले हे मंडळ सामाजिक प्रबोधन, रक्तदान शिबिरे, गरजू विद्यार्थ्यांना शैक्षणिक मदत आणि भव्य संस्कृती महोत्सवांसाठी संपूर्ण महाराष्ट्रात प्रसिद्ध आहे. दरवर्षी लाखो भाविक बाप्पांच्या दर्शनासाठी येतात.',
  historyEn: 'Established in 1982, Shree Shivtej Mandal is renowned across Maharashtra for social awareness initiatives, free blood donation drives, educational aid for underprivileged students, and grandeur cultural heritage preservation.',
  upiId: 'shivtejmandal@sbi',
  bankDetails: {
    accountName: 'Shree Shivtej Sarvajanik Ganeshotsav Mandal Trust',
    accountNumber: '384910294821',
    ifsc: 'SBIN0001428',
    bankName: 'State Bank of India',
    branch: 'Sadashiv Peth, Pune'
  }
};

export const initialPavatis: DigitalPavati[] = [
  {
    id: 'pvt-101',
    receiptNumber: 'GMP-2026-0001',
    donorName: 'श्री. विठ्ठलराव बाबुराव मोहिते (पाटील)',
    phone: '9822145890',
    email: 'vithal.mohite@gmail.com',
    address: 'सदाशिव पेठ, पुणे',
    amount: 11000,
    paymentMode: 'upi',
    category: 'General Donation (देणगी)',
    date: '2026-08-16',
    time: '10:30 AM',
    transactionRef: 'UPI/6234891024/SBI',
    notes: 'बाप्पा चरणी सप्रेम देणगी व महाआरती संकल्प',
    receivedBy: 'महेश गायकवाड (खजिनदार)',
    isVerified: true,
    panNumber: 'AAAPM1289K',
    is80GExempt: true
  },
  {
    id: 'pvt-102',
    receiptNumber: 'GMP-2026-0002',
    donorName: 'सौ. सुजाता आनंद देसाई',
    phone: '9765432109',
    email: 'sujata.desai@yahoo.com',
    address: 'कोथरूड, पुणे',
    amount: 5100,
    paymentMode: 'gpay',
    category: 'Maha Prasad Nidhi (महाप्रसाद)',
    date: '2026-08-16',
    time: '11:15 AM',
    transactionRef: 'GPAY/9812401823',
    notes: '२१ मोदक नैवेद्य व महाप्रसाद निधी',
    receivedBy: 'सचिन कुलकर्णी (सचिव)',
    isVerified: true
  },
  {
    id: 'pvt-103',
    receiptNumber: 'GMP-2026-0003',
    donorName: 'श्री. रमेश तुकाराम कदम',
    phone: '9422019284',
    address: 'टिळक रस्ता, पुणे',
    amount: 2500,
    paymentMode: 'cash',
    category: 'Annual Vargani (वार्षिक वर्गणी)',
    date: '2026-08-16',
    time: '12:00 PM',
    notes: 'वार्षिक वर्गणी पावती २०२६',
    receivedBy: 'संजय शिंदे (कार्यकर्ता)',
    isVerified: true
  },
  {
    id: 'pvt-104',
    receiptNumber: 'GMP-2026-0004',
    donorName: 'मे. सह्याद्री बिल्डर्स अँड डेव्हलपर्स (पुणे)',
    phone: '9823098765',
    email: 'contact@sahyadribuilders.in',
    address: 'डेक्कन जिमखाना, पुणे',
    amount: 51000,
    paymentMode: 'netbanking',
    category: 'Advertisement / Sponsor (जाहिरात)',
    date: '2026-08-15',
    time: '04:45 PM',
    transactionRef: 'NEFT/HDFC0001928301',
    notes: 'मंडप मुख्य प्रवेशद्वार कमान प्रायोजकत्व',
    receivedBy: 'राजेंद्र तांबडे (अध्यक्ष)',
    isVerified: true,
    panNumber: 'AACCS4918L',
    is80GExempt: true
  },
  {
    id: 'pvt-105',
    receiptNumber: 'GMP-2026-0005',
    donorName: 'डॉ. मंदार प्रभाकर जोशी',
    phone: '9921345678',
    email: 'dr.mandarjoshi@gmail.com',
    address: 'सिंहगड रस्ता, पुणे',
    amount: 7500,
    paymentMode: 'phonepe',
    category: 'Maha Aarti Sponsorship (महाआरती)',
    date: '2026-08-15',
    time: '06:30 PM',
    transactionRef: 'PHONEPE/TXN821940192',
    notes: 'ऋषिपंचमी महाआरती यजमानपद',
    receivedBy: 'महेश गायकवाड (खजिनदार)',
    isVerified: true
  },
  {
    id: 'pvt-106',
    receiptNumber: 'GMP-2026-0006',
    donorName: 'श्री. प्रफुल्ल विनायक भालेराव',
    phone: '9158091823',
    address: 'नारायण पेठ, पुणे',
    amount: 1500,
    paymentMode: 'cash',
    category: 'General Donation (देणगी)',
    date: '2026-08-14',
    time: '07:20 PM',
    receivedBy: 'सचिन कुलकर्णी (सचिव)',
    isVerified: true
  },
  {
    id: 'pvt-107',
    receiptNumber: 'GMP-2026-0007',
    donorName: 'सौ. अलका श्रीरंग पाठक',
    phone: '9890123456',
    address: 'शनिवार पेठ, पुणे',
    amount: 3100,
    paymentMode: 'upi',
    category: 'Murti / Pandal Nidhi (मूर्ती/मंडप)',
    date: '2026-08-14',
    time: '08:10 PM',
    transactionRef: 'UPI/9812401824/ICICI',
    notes: 'फुलांची सजावट निधी',
    receivedBy: 'महेश गायकवाड (खजिनदार)',
    isVerified: true
  }
];

export const initialExpenses: ExpenseEntry[] = [
  {
    id: 'exp-201',
    voucherNumber: 'EXP-2026-001',
    title: 'मंडप उभारणी व स्टेज लाकडी काम (अ‍ॅडव्हान्स)',
    vendorName: 'श्री स्वामी समर्थ मंडप डेकोरेटर्स, पुणे',
    amount: 25000,
    category: 'Pandal & Mandap Setup (मंडप उभारणी)',
    paymentMode: 'cheque',
    date: '2026-08-14',
    billNumber: 'BILL/SS/892',
    approvedBy: 'राजेंद्र तांबडे (अध्यक्ष)',
    notes: '७० फूट मुख्य कमान व वॉटरप्रूफ शेड काम'
  },
  {
    id: 'exp-202',
    voucherNumber: 'EXP-2026-002',
    title: 'आगमन दिवस झेंडू फुले, शेवंती व गुलाब हार',
    vendorName: 'महावीर पुष्प भंडार, मार्केट यार्ड',
    amount: 6800,
    category: 'Flower & Garlands (फुल व हार)',
    paymentMode: 'cash',
    date: '2026-08-15',
    billNumber: 'FLW/2026/104',
    approvedBy: 'महेश गायकवाड (खजिनदार)',
    notes: 'श्रींच्या चरणी दररोज ५० किलो झेंडू व १० मोठे हार'
  },
  {
    id: 'exp-203',
    voucherNumber: 'EXP-2026-003',
    title: 'साऊंड सिस्टम व वायरलेस माइक भाडे (१० दिवस)',
    vendorName: 'स्वरब्रह्म ऑडिओ सिस्टिम्स, पुणे',
    amount: 18000,
    category: 'Sound & Dhol Tasha (ध्वनी व ढोल-ताशा)',
    paymentMode: 'upi',
    date: '2026-08-15',
    billNumber: 'SB/2026/89',
    approvedBy: 'सचिन कुलकर्णी (सचिव)',
    notes: 'आरती व घोषणांसाठी प्रिमियम ध्वनी यंत्रणा'
  },
  {
    id: 'exp-204',
    voucherNumber: 'EXP-2026-004',
    title: '१०१ किलो खवा, रवा व तूप (मोदक प्रसाद तयारी)',
    vendorName: 'चितळे बंधू डेअरी व किराणा स्टोअर्स',
    amount: 14500,
    category: 'Prasad & Ingredients (प्रसाद व अन्नदान)',
    paymentMode: 'upi',
    date: '2026-08-16',
    billNumber: 'CB/PRSD/412',
    approvedBy: 'महेश गायकवाड (खजिनदार)',
    notes: 'ऋषिपंचमी महाप्रसाद वितरण साहित्य'
  },
  {
    id: 'exp-205',
    voucherNumber: 'EXP-2026-005',
    title: 'CCTV कॅमेरे व मंडप सुरक्षा रक्षक (बौन्सर्स)',
    vendorName: 'गरुड सिक्युरिटी सर्व्हिसेस, पुणे',
    amount: 12000,
    category: 'Security & Bouncers (सुरक्षा)',
    paymentMode: 'netbanking',
    date: '2026-08-16',
    billNumber: 'GSS/AUG/78',
    approvedBy: 'राजेंद्र तांबडे (अध्यक्ष)',
    notes: '२४ तास ८ सीसीटीव्ही व ४ महिला/पुरुष रक्षक'
  }
];

export const initialDonors: DonorProfile[] = [
  {
    id: 'donor-1',
    donorId: 'DNR-001',
    name: 'श्री. विठ्ठलराव बाबुराव मोहिते (पाटील)',
    phone: '9822145890',
    email: 'vithal.mohite@gmail.com',
    address: 'सदाशिव पेठ, पुणे',
    area: 'सदाशिव पेठ (Sadashiv Peth)',
    category: 'Household (कुटुंब/रहिवासी)',
    totalDonated: 22000,
    donationsCount: 2,
    lastDonationDate: '2026-08-16',
    receiptNumbers: ['GMP-2026-0001'],
    repeatDonor: true,
    status: 'Active',
    notes: 'दरवर्षी महाआरती व देणगीचे प्रमुख देणगीदार'
  },
  {
    id: 'donor-2',
    donorId: 'DNR-002',
    name: 'मे. सह्याद्री बिल्डर्स अँड डेव्हलपर्स (पुणे)',
    phone: '9823098765',
    email: 'contact@sahyadribuilders.in',
    address: 'डेक्कन जिमखाना, पुणे',
    area: 'डेक्कन (Deccan)',
    category: 'Sponsor (प्रायोजक)',
    totalDonated: 51000,
    donationsCount: 1,
    lastDonationDate: '2026-08-15',
    receiptNumbers: ['GMP-2026-0004'],
    repeatDonor: true,
    status: 'Active',
    notes: 'मंडप मुख्य कमान अधिकृत प्रायोजक'
  },
  {
    id: 'donor-3',
    donorId: 'DNR-003',
    name: 'सौ. सुजाता आनंद देसाई',
    phone: '9765432109',
    email: 'sujata.desai@yahoo.com',
    address: 'कोथरूड, पुणे',
    area: 'कोथरूड (Kothrud)',
    category: 'Household (कुटुंब/रहिवासी)',
    totalDonated: 5100,
    donationsCount: 1,
    lastDonationDate: '2026-08-16',
    receiptNumbers: ['GMP-2026-0002'],
    repeatDonor: false,
    status: 'Active',
    notes: '२१ मोदक नैवेद्य व महाप्रसाद निधी'
  },
  {
    id: 'donor-4',
    donorId: 'DNR-004',
    name: 'मे. चितळे स्वीट्स अँड नमकीन',
    phone: '9890123456',
    email: 'chitale.sweets@pune.in',
    address: 'टिळक रस्ता, पुणे',
    area: 'टिळक रस्ता (Tilak Road)',
    category: 'Business (दुकानदार/व्यावसायिक)',
    totalDonated: 25000,
    donationsCount: 1,
    lastDonationDate: '2026-08-16',
    receiptNumbers: ['GMP-2026-0008'],
    repeatDonor: true,
    status: 'Active',
    notes: 'व्यापारी वर्गणी व प्रसाद पुरवठादार'
  },
  {
    id: 'donor-5',
    donorId: 'DNR-005',
    name: 'डॉ. मंदार प्रभाकर जोशी',
    phone: '9921345678',
    email: 'dr.mandarjoshi@gmail.com',
    address: 'सिंहगड रस्ता, पुणे',
    area: 'सिंहगड रस्ता (Sinhagad Road)',
    category: 'VIP / Trust (विशेष देणगीदार)',
    totalDonated: 15000,
    donationsCount: 2,
    lastDonationDate: '2026-08-15',
    receiptNumbers: ['GMP-2026-0005'],
    repeatDonor: true,
    status: 'Active',
    notes: 'ऋषिपंचमी महाआरती यजमान'
  }
];

export const initialPendingVargani: PendingVarganiEntry[] = [
  {
    id: 'pv-1',
    targetName: 'श्री. गजानन नारायण बापट (फ्लॅट क्र. ४०२, सिद्धिविनायक हाइट्स)',
    phone: '9822019280',
    address: 'सदाशिव पेठ, पुणे',
    area: 'सदाशिव पेठ',
    targetType: 'Household (घरगुती)',
    expectedAmount: 2100,
    collectedAmount: 0,
    status: 'Pending',
    assignedVolunteer: 'प्रमोद शिंदे (कार्यकर्ता)',
    lastFollowUpDate: '2026-08-16',
    notes: 'संध्याकाळी ७ वाजता घरी भेट देण्यास सांगितले आहे'
  },
  {
    id: 'pv-2',
    targetName: 'मे. पुणे इलेक्ट्रॉनिक्स अँड होम अप्लायन्सेस (प्रोप्रा: अजित कदम)',
    phone: '9823456789',
    address: 'टिळक रस्ता, पुणे',
    area: 'टिळक रस्ता',
    targetType: 'Shop / Business (दुकानदार)',
    expectedAmount: 5000,
    collectedAmount: 0,
    status: 'FollowUp',
    assignedVolunteer: 'सचिन कुलकर्णी (सचिव)',
    lastFollowUpDate: '2026-08-15',
    notes: 'गुगल पे द्वारे पेमेंट करणार आहेत, पावती तयार ठेवावी'
  },
  {
    id: 'pv-3',
    targetName: 'सौ. मंगला वसंतराव कुलकर्णी (बंगला क्र. १२, अलका टॉकीज परिसर)',
    phone: '9765123450',
    address: 'सदाशिव पेठ, पुणे',
    area: 'सदाशिव पेठ',
    targetType: 'Household (घरगुती)',
    expectedAmount: 3100,
    collectedAmount: 0,
    status: 'Pending',
    assignedVolunteer: 'अमोल जगताप (कार्यकर्ता)',
    lastFollowUpDate: '2026-08-16',
    notes: 'महाआरती दिवशी चेक देणार आहेत'
  },
  {
    id: 'pv-4',
    targetName: 'मे. न्यू महाराष्ट्र ऑटोमोबाईल्स (प्रोप्रा: विजय गायकवाड)',
    phone: '9422098765',
    address: 'शास्त्री रस्ता, पुणे',
    area: 'शास्त्री रस्ता',
    targetType: 'Shop / Business (दुकानदार)',
    expectedAmount: 7500,
    collectedAmount: 0,
    status: 'FollowUp',
    assignedVolunteer: 'महेश गायकवाड (खजिनदार)',
    lastFollowUpDate: '2026-08-14',
    notes: 'जाहिरात बॅनर व वर्गणी'
  }
];

export const initialDayWiseCollections: DayWiseCollection[] = [
  {
    dayNumber: 1,
    date: '2026-08-15',
    festivalDayNameMr: 'दिवस १ - श्री गणेश चतुर्थी (प्रतिष्ठापना)',
    festivalDayNameEn: 'Day 1 - Ganesh Chaturthi (Pratishthapana)',
    targetAmount: 50000,
    collectedAmount: 62500,
    pavatisCount: 18,
    expensesAmount: 31800,
    majorEventMr: 'भव्य आगमन मिरवणूक व प्राणप्रतिष्ठापना'
  },
  {
    dayNumber: 2,
    date: '2026-08-16',
    festivalDayNameMr: 'दिवस २ - ऋषिपंचमी (विशेष पूजन)',
    festivalDayNameEn: 'Day 2 - Rishi Panchami',
    targetAmount: 45000,
    collectedAmount: 48600,
    pavatisCount: 14,
    expensesAmount: 26500,
    majorEventMr: 'महिलांसाठी विशेष अथर्वशीर्ष पठण व महाप्रसाद'
  },
  {
    dayNumber: 3,
    date: '2026-08-17',
    festivalDayNameMr: 'दिवस ३ - ज्येष्ठा गौरी आवाहन',
    festivalDayNameEn: 'Day 3 - Gauri Avahana',
    targetAmount: 55000,
    collectedAmount: 58200,
    pavatisCount: 22,
    expensesAmount: 18000,
    majorEventMr: 'गौरी पूजन व पारंपरिक सांस्कृतिक संगीत रजनी'
  },
  {
    dayNumber: 4,
    date: '2026-08-18',
    festivalDayNameMr: 'दिवस ४ - ज्येष्ठा गौरी पूजन',
    festivalDayNameEn: 'Day 4 - Gauri Pujan',
    targetAmount: 60000,
    collectedAmount: 64100,
    pavatisCount: 25,
    expensesAmount: 22000,
    majorEventMr: 'हळदी-कुंकू समारंभ व मोफत आरोग्य तपासणी शिबिर'
  },
  {
    dayNumber: 5,
    date: '2026-08-19',
    festivalDayNameMr: 'दिवस ५ - गौरी विसर्जन व सत्यनारायण पूजा',
    festivalDayNameEn: 'Day 5 - Satyanarayan Maha Puja',
    targetAmount: 80000,
    collectedAmount: 92400,
    pavatisCount: 38,
    expensesAmount: 45000,
    majorEventMr: 'सामूहिक श्री सत्यनारायण महापूजा व ५००० भाविकांना महाप्रसाद'
  },
  {
    dayNumber: 6,
    date: '2026-08-20',
    festivalDayNameMr: 'दिवस ६ - विद्यार्थी गुणगौरव व स्पर्धा',
    festivalDayNameEn: 'Day 6 - Student Felicitations',
    targetAmount: 40000,
    collectedAmount: 43500,
    pavatisCount: 16,
    expensesAmount: 16000,
    majorEventMr: 'इयत्ता १० वी व १२ वी गुणवंत विद्यार्थी सत्कार'
  },
  {
    dayNumber: 7,
    date: '2026-08-21',
    festivalDayNameMr: 'दिवस ७ - रक्तदान शिबिर व नेत्रतपासणी',
    festivalDayNameEn: 'Day 7 - Blood Donation Drive',
    targetAmount: 50000,
    collectedAmount: 54800,
    pavatisCount: 20,
    expensesAmount: 19000,
    majorEventMr: 'भव्य महारक्तदान शिबिर (लक्ष्य: ५०० बाटल्या)'
  },
  {
    dayNumber: 8,
    date: '2026-08-22',
    festivalDayNameMr: 'दिवस ८ - महाआरती व कीर्तन महोत्सव',
    festivalDayNameEn: 'Day 8 - Kirtan Mahotsav',
    targetAmount: 70000,
    collectedAmount: 76500,
    pavatisCount: 28,
    expensesAmount: 28000,
    majorEventMr: 'प्रसिद्ध राष्ट्रीय कीर्तनकार यांचे सुश्राव्य कीर्तन'
  },
  {
    dayNumber: 9,
    date: '2026-08-23',
    festivalDayNameMr: 'दिवस ९ - १०८ दीपप्रज्वलन व दीपोत्सव',
    festivalDayNameEn: 'Day 9 - Grand Deepotsav',
    targetAmount: 90000,
    collectedAmount: 98200,
    pavatisCount: 34,
    expensesAmount: 35000,
    majorEventMr: 'मंडप परिसरात ५१०० दिव्यांचा भव्य दीपोत्सव व महाआरती'
  },
  {
    dayNumber: 10,
    date: '2026-08-24',
    festivalDayNameMr: 'दिवस १० - अनंत चतुर्दशी (भव्य विसर्जन मिरवणूक)',
    festivalDayNameEn: 'Day 10 - Anant Chaturdashi (Visarjan)',
    targetAmount: 110000,
    collectedAmount: 124000,
    pavatisCount: 45,
    expensesAmount: 68000,
    majorEventMr: 'शाही पारंपरिक रथ व ढोल-ताशा गजरात विसर्जन मिरवणूक'
  }
];

export const initialMembers: Member[] = [
  {
    id: 'mem-1',
    memberId: 'SHIV-M001',
    name: 'श्री. राजेंद्र (आण्णा) तांबडे',
    role: 'President',
    designationMr: 'अध्यक्ष (Mandal President)',
    sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
    isExecutiveBearer: true,
    executiveRank: 1,
    phone: '+91 98220 14258',
    email: 'rajendra.tambade@gmail.com',
    bloodGroup: 'O+ve',
    address: 'सदाशिव पेठ, पुणे',
    joinYear: 1995,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 5000,
    dueAmount: 0,
    responsibilities: 'एकूण मंडळ नेतृत्व, महाप्रशासकीय समन्वय व धर्मादाय व्यवहार'
  },
  {
    id: 'mem-2',
    memberId: 'SHIV-M002',
    name: 'श्री. सचिन विजय कुलकर्णी',
    role: 'Secretary',
    designationMr: 'सरचिटणीस / सचिव (General Secretary)',
    sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
    isExecutiveBearer: true,
    executiveRank: 2,
    phone: '+91 94220 89123',
    email: 'sachin.kulkarni@gmail.com',
    bloodGroup: 'B+ve',
    address: 'टिळक रस्ता, पुणे',
    joinYear: 2002,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 3000,
    dueAmount: 0,
    responsibilities: 'पावती नोंदवही, शासकीय परवानग्या, पोलीस समन्वय व पत्रव्यवहार'
  },
  {
    id: 'mem-3',
    memberId: 'SHIV-M003',
    name: 'श्री. महेश चंद्रकांत गायकवाड',
    role: 'Treasurer',
    designationMr: 'मुख्य खजिनदार (Chief Treasurer)',
    sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
    isExecutiveBearer: true,
    executiveRank: 3,
    phone: '+91 98901 45678',
    email: 'mahesh.g@rediffmail.com',
    bloodGroup: 'A+ve',
    address: 'नारायण पेठ, पुणे',
    joinYear: 2005,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 3000,
    dueAmount: 0,
    responsibilities: 'हिशोब वही, बँक खाती, देणगी पावती ऑडिट व डिजिटल देयके'
  },
  {
    id: 'mem-4',
    memberId: 'SHIV-M004',
    name: 'श्री. विलास बाबुराव जगताप',
    role: 'Working President',
    designationMr: 'कार्याध्यक्ष (Working President)',
    sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
    isExecutiveBearer: true,
    executiveRank: 4,
    phone: '+91 98231 77654',
    email: 'vilas.jagtap@gmail.com',
    bloodGroup: 'O+ve',
    address: 'सदाशिव पेठ, पुणे',
    joinYear: 1998,
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 3500,
    dueAmount: 0,
    responsibilities: 'मंडप उभारणी, देखावा सजावट व ध्वनी यंत्रणा समन्वय'
  },
  {
    id: 'mem-5',
    memberId: 'SHIV-M005',
    name: 'श्री. आनंद प्रभाकर जोशी',
    role: 'Vice President',
    designationMr: 'उपाध्यक्ष (Vice President)',
    sabhasadType: 'मुख्य कार्यकारणी सभासद (Executive Board)',
    isExecutiveBearer: true,
    executiveRank: 5,
    phone: '+91 98500 23412',
    email: 'anand.joshi@gmail.com',
    bloodGroup: 'B+ve',
    address: 'शनिवार पेठ, पुणे',
    joinYear: 2004,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 3000,
    dueAmount: 0,
    responsibilities: 'महाप्रसाद नियोजन, सांस्कृतिक कार्यक्रम व देणगीदार स्वागत'
  },
  {
    id: 'mem-6',
    memberId: 'SHIV-M006',
    name: 'श्री. रोहन दीपक शिंदे',
    role: 'Executive Member',
    designationMr: 'मुख्य कार्यकारणी सदस्य / उत्सव प्रमुख',
    sabhasadType: 'सक्रिय सभासद (Active Member)',
    isExecutiveBearer: true,
    executiveRank: 6,
    phone: '+91 91580 43210',
    email: 'rohan.shinde@gmail.com',
    bloodGroup: 'AB+ve',
    address: 'शनिवार पेठ, पुणे',
    joinYear: 2015,
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 2000,
    dueAmount: 0,
    responsibilities: 'गर्दी नियंत्रण, स्वयंसेवक टीम नियोजन व विसर्जन व्यवस्था'
  },
  {
    id: 'mem-7',
    memberId: 'SHIV-M007',
    name: 'श्री. अनिकेत सुधीर पटवर्धन',
    role: 'Volunteer',
    designationMr: 'स्वयंसेवक प्रतिनिधी / सक्रिय सभासद',
    sabhasadType: 'सक्रिय सभासद (Active Member)',
    isExecutiveBearer: false,
    phone: '+91 97651 23490',
    email: 'aniket.p@gmail.com',
    bloodGroup: 'O-ve',
    address: 'सिंहगड रोड, पुणे',
    joinYear: 2021,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 2000,
    dueAmount: 0,
    responsibilities: 'आरती व्यवस्था व सोशल मीडिया लाइव्ह ब्रॉडकास्टिंग'
  },
  {
    id: 'mem-8',
    memberId: 'SHIV-M008',
    name: 'श्री. नानासाहेब रामचंद्र मोरे',
    role: 'Advisory Board',
    designationMr: 'जेष्ठ सल्लागार व मार्गदर्शक',
    sabhasadType: 'मार्गदर्शक / जेष्ठ सभासद (Senior Advisor)',
    isExecutiveBearer: false,
    phone: '+91 98224 55670',
    email: 'nanasaheb.more@gmail.com',
    bloodGroup: 'A-ve',
    address: 'सदाशिव पेठ, पुणे',
    joinYear: 1982,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    annualFeeStatus: 'Paid',
    feePaidAmount: 5000,
    dueAmount: 0,
    responsibilities: 'संस्थापक विश्वस्त, ज्येष्ठ नागरिक दर्शन सुविधा व पारंपरिक विधी'
  }
];

export const initialVolunteerDuties: VolunteerDuty[] = [
  {
    id: 'dut-1',
    volunteerName: 'अनिकेत पटवर्धन',
    volunteerPhone: '9765123490',
    dutyType: 'Morning Aarti',
    date: '2026-08-17',
    timeSlot: '06:30 AM - 08:30 AM',
    status: 'Confirmed',
    location: 'मुख्य गाभारा व आरती स्टेज',
    assignedBy: 'सचिन कुलकर्णी'
  },
  {
    id: 'dut-2',
    volunteerName: 'रोहन शिंदे',
    volunteerPhone: '9158043210',
    dutyType: 'Crowd Management',
    date: '2026-08-17',
    timeSlot: '05:00 PM - 10:00 PM',
    status: 'Assigned',
    location: 'अलका टॉकीज चौक प्रवेशद्वार रांग',
    assignedBy: 'राजेंद्र तांबडे'
  },
  {
    id: 'dut-3',
    volunteerName: 'अक्षय जोशी',
    volunteerPhone: '9822198765',
    dutyType: 'Prasad Distribution',
    date: '2026-08-17',
    timeSlot: '07:30 PM - 10:30 PM',
    status: 'Confirmed',
    location: 'प्रसाद काउंटर क्र. १',
    assignedBy: 'महेश गायकवाड'
  },
  {
    id: 'dut-4',
    volunteerName: 'सूरज मोरे',
    volunteerPhone: '9423109823',
    dutyType: 'Night Security',
    date: '2026-08-17',
    timeSlot: '11:00 PM - 06:00 AM',
    status: 'Assigned',
    location: 'मंडप मुख्य सुरक्षा कक्ष',
    assignedBy: 'राजेंद्र तांबडे'
  }
];

export const initialAartiEvents: AartiEvent[] = [
  {
    id: 'art-1',
    titleMr: 'काकड आरती (पहाट)',
    titleEn: 'Kakad Aarti (Dawn Awakening)',
    time: '07:00 AM',
    type: 'Kakad Aarti',
    descriptionMr: 'बाप्पांची प्रातःकालीन मंगलमय काकड आरती व पंचामृत अभिषेक.',
    descriptionEn: 'Morning dawn holy awakening aarti and panchamrit abhishek ceremony.',
    sponsorName: 'श्री. विठ्ठलराव मोहिते',
    maxBookingSlots: 25,
    bookedSlots: 18,
    pricePerSlot: 501
  },
  {
    id: 'art-2',
    titleMr: 'मध्यान्ह महाआरती व महानैवेद्य',
    titleEn: 'Madhyahna Maha Aarti & Mahanaivedya',
    time: '12:30 PM',
    type: 'Madhyahna Aarti',
    descriptionMr: 'दुपारची मुख्य महाआरती, ५१ मोदकांचा महानैवेद्य व मंत्रजागर.',
    descriptionEn: 'Noon main ceremonial aarti with 51 modaks offering & sacred Vedic chanting.',
    sponsorName: 'सौ. सुजाता देसाई',
    maxBookingSlots: 50,
    bookedSlots: 45,
    pricePerSlot: 1100
  },
  {
    id: 'art-3',
    titleMr: 'सायं महाआरती व शंखनाद',
    titleEn: 'Sandhya Maha Aarti & Shankhanaad',
    time: '08:00 PM',
    type: 'Sandhya Aarti',
    descriptionMr: 'भव्य सांध्य आरती, ढोल-ताशा गजर, झांज पथक व दीपप्रज्वलन.',
    descriptionEn: 'Grand evening aarti with Dhol-Tasha reverberation, brass cymbals and 108 diyas.',
    sponsorName: 'सह्याद्री बिल्डर्स',
    maxBookingSlots: 100,
    bookedSlots: 92,
    pricePerSlot: 2100
  },
  {
    id: 'art-4',
    titleMr: 'शेज आरती (रात्रौ)',
    titleEn: 'Shej Aarti (Night Slumber Hymn)',
    time: '10:45 PM',
    type: 'Shej Aarti',
    descriptionMr: 'दिवस समाप्तीची शांत व भावपूर्ण शेज आरती व मंत्रपुष्पांजली.',
    descriptionEn: 'Soothing night closing hymn wishing peaceful rest with floral surrender.',
    maxBookingSlots: 20,
    bookedSlots: 8,
    pricePerSlot: 351
  }
];

export const initialAartiBookings: AartiBooking[] = [
  {
    id: 'bk-501',
    bookingCode: 'GMP-ART-9812',
    aartiId: 'art-3',
    aartiTitle: 'सायं महाआरती व शंखनाद',
    devoteeName: 'श्री. चंद्रशेखर विनायक बापट',
    phone: '9822456789',
    familyMembersCount: 4,
    gotra: 'कश्यप',
    sankalpType: 'आरोग्य व उद्योग भरभराट',
    date: '2026-08-17',
    time: '08:00 PM',
    amountPaid: 2100,
    paymentStatus: 'Confirmed'
  },
  {
    id: 'bk-502',
    bookingCode: 'GMP-ART-9813',
    aartiId: 'art-2',
    aartiTitle: 'मध्यान्ह महाआरती व महानैवेद्य',
    devoteeName: 'सौ. अनुराधा हेमंत साने',
    phone: '9765401928',
    familyMembersCount: 2,
    gotra: 'भारद्वाज',
    sankalpType: 'मुलांच्या उज्ज्वल भविष्यासाठी',
    date: '2026-08-18',
    time: '12:30 PM',
    amountPaid: 1100,
    paymentStatus: 'Confirmed'
  }
];

export const initialMannatWishes: MannatWish[] = [
  {
    id: 'wish-1',
    devoteeName: 'प्रमोद नारायण जोशी',
    city: 'पुणे',
    wishText: 'देवा बाप्पा, माझ्या आईचे आजारपण दूर होऊ दे आणि सर्वांना सुखी व निरोगी आयुष्य लाभू दे! गणपती बाप्पा मोरया!',
    date: '2026-08-16',
    flowerCount: 42,
    isApproved: true,
    isFeatured: true,
    answeredStatus: 'Awaiting'
  },
  {
    id: 'wish-2',
    devoteeName: 'स्नेहल राहुल वाघ',
    city: 'मुंबई',
    wishText: 'बाप्पा, मुलीला आयआयटी प्रवेश परीक्षेत भरघोस यश मिळू दे. तुझ्या चरणी २१ मोदकांचा नवस बोलत आहे!',
    date: '2026-08-16',
    flowerCount: 68,
    isApproved: true,
    isFeatured: true,
    answeredStatus: 'Awaiting'
  },
  {
    id: 'wish-3',
    devoteeName: 'मयूर शांताराम सावंत',
    city: 'कोल्हापूर',
    wishText: 'गेल्या वर्षी केलेला नोकरीचा नवस बाप्पांच्या कृपेने पूर्ण झाला! या वर्षी संपूर्ण कुटुंबासह दर्शनाला येत आहोत. || मंगलमूर्ती मोरया ||',
    date: '2026-08-15',
    flowerCount: 108,
    isApproved: true,
    isFeatured: true,
    answeredStatus: 'Fulfilled (नवस पूर्ण)'
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'उकडीचे मोदक (नैवेद्य व प्रसाद)',
    nameMr: 'उकडीचे मोदक (नैवेद्य)',
    nameEn: 'Steamed Modak (Naivedya)',
    category: 'Puja Samagri',
    quantity: 150,
    unit: 'नग (Pcs)',
    minRequired: 50,
    minThreshold: 50,
    unitCost: 25,
    location: 'प्रसाद कक्ष, मुख्य मंडप',
    condition: 'Good',
    lastRestocked: '2026-08-16',
    lastCheckedDate: '2026-08-16',
    status: 'In Stock'
  },
  {
    id: 'inv-2',
    name: 'नारळ व श्रीफळ संच',
    nameMr: 'नारळ (श्रीफळ)',
    nameEn: 'Coconuts (Shreephal)',
    category: 'Puja Samagri',
    quantity: 450,
    unit: 'नग (Pcs)',
    minRequired: 100,
    minThreshold: 100,
    unitCost: 35,
    location: 'गोदाम रूम १, तळमजला',
    condition: 'Good',
    lastRestocked: '2026-08-15',
    lastCheckedDate: '2026-08-16',
    status: 'In Stock'
  },
  {
    id: 'inv-3',
    name: 'दुर्वा जुड्या (२१ ची जुडी)',
    nameMr: 'दुर्वा जुड्या (२१ ची जुडी)',
    nameEn: 'Durva Grass Bundles (21 Leaves)',
    category: 'Puja Samagri',
    quantity: 25,
    unit: 'जुडी (Bundles)',
    minRequired: 40,
    minThreshold: 40,
    unitCost: 15,
    location: 'पूजा साहित्य टेबल',
    condition: 'Good',
    lastRestocked: '2026-08-16',
    lastCheckedDate: '2026-08-16',
    status: 'Low Stock'
  },
  {
    id: 'inv-4',
    name: 'लाल जास्वंद व झेंडू हार संच',
    nameMr: 'लाल जास्वंद व झेंडू हार',
    nameEn: 'Red Hibiscus & Marigold Garlands',
    category: 'Decoration Assets',
    quantity: 18,
    unit: 'हार (Pcs)',
    minRequired: 20,
    minThreshold: 20,
    unitCost: 150,
    location: 'पुष्प कक्ष',
    condition: 'Good',
    lastRestocked: '2026-08-16',
    lastCheckedDate: '2026-08-16',
    status: 'Low Stock'
  },
  {
    id: 'inv-5',
    name: 'LED फोकस लाइट्स (१००W)',
    nameMr: 'LED फोकस लाइट्स (१००W)',
    nameEn: 'LED Focus Lights (100W)',
    category: 'Audio / Visual',
    quantity: 32,
    unit: 'नग (Units)',
    minRequired: 20,
    minThreshold: 20,
    unitCost: 1200,
    location: 'विद्युत व रोषणाई विभाग',
    condition: 'Good',
    lastRestocked: '2026-08-12',
    lastCheckedDate: '2026-08-15',
    status: 'In Stock'
  },
  {
    id: 'inv-6',
    name: 'HD सीसीटीव्ही कॅमेरे संच',
    nameMr: 'HD सीसीटीव्ही कॅमेरे संच',
    nameEn: 'HD CCTV Camera Set',
    category: 'Security / Crowd Gear',
    quantity: 8,
    unit: 'संच (Sets)',
    minRequired: 8,
    minThreshold: 8,
    unitCost: 4500,
    location: 'सुरक्षा नियंत्रण कक्ष',
    condition: 'Good',
    lastRestocked: '2026-08-13',
    lastCheckedDate: '2026-08-15',
    status: 'In Stock'
  }
];

export const initialAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    titleMr: '🔔 महाआरती आज सायंकाळी ठीक ८:०० वाजता - सुप्रसिद्ध गायकांचे भजन सादरीकरण!',
    titleEn: '🔔 Grand Maha Aarti tonight at 8:00 PM - Special devotional bhajan performance!',
    category: 'Event',
    timestamp: 'Just now',
    isActive: true
  },
  {
    id: 'ann-2',
    titleMr: '🌸 मोफत आरोग्य तपासणी व रक्तदान शिबिर उद्या सकाळी ९:०० ते २:०० दरम्यान मंडपात आयोजित.',
    titleEn: '🌸 Free Health Checkup & Mega Blood Donation Drive tomorrow 9 AM to 2 PM at Pandal.',
    category: 'Urgent',
    timestamp: '2 hrs ago',
    isActive: true
  },
  {
    id: 'ann-3',
    titleMr: '🚗 भाविकांसाठी अलका टॉकीज चौक वाहनतळ येथे विनामूल्य पार्किंग व्यवस्था करण्यात आली आहे.',
    titleEn: '🚗 Free two-wheeler and four-wheeler parking arranged near Alka Talkies Chowk.',
    category: 'Traffic',
    timestamp: '5 hrs ago',
    isActive: true
  }
];

export const initialGalleryMedia: GalleryMedia[] = [
  {
    id: 'gal-1',
    titleMr: 'श्रींची विलोभनीय १५ फूट पर्यावरणपूरक शाडू माती मूर्ती',
    titleEn: '15-Foot Divine Eco-friendly Clay Ganpati Murti',
    category: 'Murti',
    mediaUrl: 'https://images.unsplash.com/photo-1567591974584-f1832b450380?auto=format&fit=crop&q=80&w=1000',
    thumbnail: 'https://images.unsplash.com/photo-1567591974584-f1832b450380?auto=format&fit=crop&q=80&w=400',
    year: 2026,
    caption: 'काशी विश्वनाथ मंदिराच्या भव्य पार्श्वभूमीवर विराजित बाप्पा'
  },
  {
    id: 'gal-2',
    titleMr: 'काशी विश्वनाथ मंदिर ७० फूट भव्य रोषणाई देखावा',
    titleEn: 'Kashi Vishwanath Mandir 70-Foot Grand Lighting Replica',
    category: 'Decoration',
    mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
    year: 2026,
    caption: 'सोन्याची झळाळी देणारी काशी मंदिराची हुबेहूब कलाकृती'
  },
  {
    id: 'gal-3',
    titleMr: 'हजारो भाविकांच्या उपस्थितीत संध्या महाआरती व दीपप्रज्वलन',
    titleEn: 'Grand Sandhya Maha Aarti with 108 Deepotsav Lamps',
    category: 'Aarti',
    mediaUrl: 'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&q=80&w=1000',
    thumbnail: 'https://images.unsplash.com/photo-1514894780887-121968d00567?auto=format&fit=crop&q=80&w=400',
    year: 2026,
    caption: 'टाळ, मृदंग व ढोल-ताशांच्या गजरात भक्तीमय वातावरण'
  },
  {
    id: 'gal-4',
    titleMr: 'महाप्रसाद वाटप व मोदक वितरण सोहळा',
    titleEn: 'Mahaprasad & Modak Holy Distribution Ceremony',
    category: 'Cultural',
    mediaUrl: 'https://images.unsplash.com/photo-1505935428862-770b6f24f629?auto=format&fit=crop&q=80&w=1000',
    thumbnail: 'https://images.unsplash.com/photo-1505935428862-770b6f24f629?auto=format&fit=crop&q=80&w=400',
    year: 2026,
    caption: 'दररोज १०,००० हून अधिक भाविकांना तृप्त करणारा महाप्रसाद'
  }
];

export const initialFeedbacks: DevoteeFeedback[] = [
  {
    id: 'fb-1',
    devoteeName: 'सतीश श्रीधर कुलकर्णी',
    phone: '9822091823',
    city: 'पुणे',
    ratings: {
      decoration: 5,
      cleanliness: 5,
      management: 4,
      prasad: 5
    },
    comments: 'अप्रतिम काशी विश्वनाथ देखावा! महिला व ज्येष्ठ नागरिकांसाठी स्वतंत्र रांगेची व्यवस्था खूपच छान केली आहे. बाप्पा सर्वांचे कल्याण करो!',
    date: '2026-08-16',
    sentiment: 'Positive'
  },
  {
    id: 'fb-2',
    devoteeName: 'सौ. वैशाली मंगेश जोशी',
    phone: '9422187654',
    city: 'पिंपरी चिंचवड',
    ratings: {
      decoration: 5,
      cleanliness: 4,
      management: 5,
      prasad: 5
    },
    comments: 'डिजिटल पावती आणि थेट व्हॉट्सअ‍ॅपवर पावती मिळण्याची सुविधा अत्यंत सुटसुटीत आणि कौतुकास्पद आहे. पारदर्शकता उत्कृष्ट आहे.',
    date: '2026-08-15',
    sentiment: 'Positive'
  }
];

export const initialAartiSchedule = initialAartiEvents;

export const initialMannatPrayers = initialMannatWishes;

export const initialGallery = initialGalleryMedia;

export const initialMandalEvents = [
  {
    id: 'evt-1',
    titleMr: 'श्री गणेश प्रतिष्ठापना व भव्य आगमन मिरवणूक',
    titleEn: 'Ganesh Pran-Pratishthapana & Grand Welcome Procession',
    date: '2026-08-17 (भाद्रपद शुक्ल चतुर्थी)',
    time: 'सकाळी १०:३० वाजता',
    category: 'Spiritual' as const,
    location: 'अलका टॉकीज चौक ते मुख्य मंडप, सदाशिव पेठ',
    chiefGuest: 'मा. खासदार व पालकमंत्री महोदय',
    description: 'पारंपारिक पुणेरी ढोल-ताशा, शंखनाद, ध्वज पथक व लेझीमच्या गजरात बाप्पांचे भव्य आगमन.'
  },
  {
    id: 'evt-2',
    titleMr: 'मोफत महाआरोग्य तपासणी व भव्य रक्तदान शिबिर',
    titleEn: 'Free Mega Health Checkup & Blood Donation Drive',
    date: '2026-08-20 (ऋषिपंचमी)',
    time: 'सकाळी ०९:०० ते दुपारी ०३:००',
    category: 'Social' as const,
    location: 'मंडप शेजारील समाज मंदिर हॉल',
    chiefGuest: 'ससून सर्वोपचार रुग्णालय वैद्यकीय पथक',
    description: 'रक्तदात्यांना विशेष सन्मानपत्र व मोफत ५ लाखांचे अपघाती विमा संरक्षण कव्हर.'
  },
  {
    id: 'evt-3',
    titleMr: 'सुप्रसिद्ध शास्त्रीय गायन व नाट्यसंगीत रजनी',
    titleEn: 'Classical Devotional Vocal Recital & Natyasangeet Eve',
    date: '2026-08-23 (रविवार)',
    time: 'सायंकाळी ०६:३० वाजता',
    category: 'Cultural' as const,
    location: 'मंडप मुख्य सांस्कृतिक रंगमंच',
    chiefGuest: 'प्रख्यात गायक व संगीतकार',
    description: 'स्थानिक कलाकारांचे भजन, भावगीत, अभंग व गणेश वंदना सादरीकरण.'
  },
  {
    id: 'evt-4',
    titleMr: 'अनंत चतुर्दशी भव्य विसर्जन मिरवणूक सोहळा',
    titleEn: 'Anant Chaturdashi Grand Immersion Procession',
    date: '2026-08-27 (अनंत चतुर्दशी)',
    time: 'सकाळी ११:०० वाजता सुरू',
    category: 'Visarjan' as const,
    location: 'टिळक रस्ता ते अलका टॉकीज घाट (मुठा नदी)',
    description: 'पारंपारिक गुलालाची उधळण, झांज पथक, लेझीम आणि पुष्पवृष्टीसह बाप्पांना भावपूर्ण निरोप.'
  }
];

export const initialPandalZones = [
  {
    id: 'zn-1',
    name: 'गेट क्र. १ - मुख्य मुखदर्शन रांग',
    status: 'Heavy' as const,
    estimatedPeople: 850,
    waitMinutes: 45,
    incharge: 'रोहन शिंदे (मो. ९१५८०४३२१०)'
  },
  {
    id: 'zn-2',
    name: 'गेट क्र. २ - चरणस्पर्श व VIP/ज्येष्ठ नागरिक रांग',
    status: 'Moderate' as const,
    estimatedPeople: 180,
    waitMinutes: 15,
    incharge: 'अनिकेत पटवर्धन (मो. ९७६५१२३४९०)'
  },
  {
    id: 'zn-3',
    name: 'मुख्य गाभारा व आरती परिसर',
    status: 'Heavy' as const,
    estimatedPeople: 300,
    waitMinutes: 20,
    incharge: 'सचिन कुलकर्णी (मो. ९४२२०८९१२३)'
  },
  {
    id: 'zn-4',
    name: 'प्रसाद व डिजिटल पावती काऊंटर',
    status: 'Normal' as const,
    estimatedPeople: 60,
    waitMinutes: 5,
    incharge: 'महेश गायकवाड (मो. ९८९०१४५६७८)'
  },
  {
    id: 'zn-5',
    name: 'वाहने पार्किंग व चप्पल स्टँड (अलका चौक)',
    status: 'Normal' as const,
    estimatedPeople: 120,
    waitMinutes: 2,
    incharge: 'सूरज मोरे (मो. ९४२३१०९८२३)'
  },
  {
    id: 'zn-6',
    name: 'आपत्कालीन प्रथमोपचार व रुग्णवाहिका कक्ष',
    status: 'Normal' as const,
    estimatedPeople: 5,
    waitMinutes: 0,
    incharge: 'डॉ. मंदार जोशी (मो. ९९२१३४५६७८)'
  }
];

export const initialVolunteers: VolunteerCollector[] = [
  {
    id: 'vol-1',
    name: 'अमोल सुरेश शिंदे',
    phone: '9822345678',
    role: 'volunteer',
    pin: '1111',
    bookNumber: 'BK-01',
    bookPrefix: 'V01',
    assignedRangeStart: 1,
    assignedRangeEnd: 500,
    currentReceiptIndex: 28,
    assignedArea: 'सदाशिव पेठ (गल्ली १ ते ४) व व्यापारी संकुल',
    targetAmount: 75000,
    dailyTargetAmount: 12000,
    status: 'OnField',
    totalCollected: 48500,
    totalReceiptsCount: 27,
    cashCollected: 32000,
    digitalCollected: 16500,
    cashHandedOver: 20000,
    cashInHand: 12000,
    deviceId: 'DEV-SHINDE-01',
    lastActiveAt: '2026-08-17T11:45:00',
    notes: 'सकाळ व संध्याकाळ प्रत्यक्ष फिरती वर्गणी संकलन'
  },
  {
    id: 'vol-2',
    name: 'प्रसाद विजय कुलकर्णी',
    phone: '9765431289',
    role: 'volunteer',
    pin: '2222',
    bookNumber: 'BK-02',
    bookPrefix: 'V02',
    assignedRangeStart: 1,
    assignedRangeEnd: 500,
    currentReceiptIndex: 19,
    assignedArea: 'टिळक रस्ता व अलका टॉकीज चौक परिसर',
    targetAmount: 60000,
    dailyTargetAmount: 10000,
    status: 'OnField',
    totalCollected: 34200,
    totalReceiptsCount: 18,
    cashCollected: 21000,
    digitalCollected: 13200,
    cashHandedOver: 15000,
    cashInHand: 6000,
    deviceId: 'DEV-PRASAD-02',
    lastActiveAt: '2026-08-17T11:30:00',
    notes: 'दुकानदार व व्यापारी वर्गणी प्रमुख'
  },
  {
    id: 'vol-3',
    name: 'रोहित बाळासाहेब सावंत',
    phone: '9422018765',
    role: 'volunteer',
    pin: '3333',
    bookNumber: 'BK-03',
    bookPrefix: 'V03',
    assignedRangeStart: 1,
    assignedRangeEnd: 500,
    currentReceiptIndex: 14,
    assignedArea: 'शास्त्री रोड व नवी पेठ रहिवासी संकुल',
    targetAmount: 50000,
    dailyTargetAmount: 8000,
    status: 'Active',
    totalCollected: 27500,
    totalReceiptsCount: 13,
    cashCollected: 18000,
    digitalCollected: 9500,
    cashHandedOver: 10000,
    cashInHand: 8000,
    deviceId: 'DEV-ROHIT-03',
    lastActiveAt: '2026-08-17T10:15:00',
    notes: 'घरगुती वार्षिक वर्गणी वाटप व संकलन'
  },
  {
    id: 'vol-4',
    name: 'ओंकार प्रकाश माने',
    phone: '9158765432',
    role: 'volunteer',
    pin: '4444',
    bookNumber: 'BK-04',
    bookPrefix: 'V04',
    assignedRangeStart: 1,
    assignedRangeEnd: 500,
    currentReceiptIndex: 9,
    assignedArea: 'कुमठेकर रस्ता व शनिवार पेठ सीमा',
    targetAmount: 50000,
    dailyTargetAmount: 8000,
    status: 'Break',
    totalCollected: 18900,
    totalReceiptsCount: 8,
    cashCollected: 11000,
    digitalCollected: 7900,
    cashHandedOver: 11000,
    cashInHand: 0,
    deviceId: 'DEV-ONKAR-04',
    lastActiveAt: '2026-08-17T09:40:00',
    notes: 'प्रायोजक व जाहिरात वर्गणी'
  },
  {
    id: 'vol-5',
    name: 'महेश चंद्रकांत गायकवाड (खजिनदार)',
    phone: '9890145678',
    role: 'treasurer',
    pin: '9999',
    bookNumber: 'HQ-MAIN',
    bookPrefix: 'HQ01',
    assignedRangeStart: 1,
    assignedRangeEnd: 2000,
    currentReceiptIndex: 42,
    assignedArea: 'मुख्य मंडप काऊंटर (Head Office Stall)',
    targetAmount: 250000,
    dailyTargetAmount: 35000,
    status: 'Active',
    totalCollected: 185000,
    totalReceiptsCount: 41,
    cashCollected: 95000,
    digitalCollected: 90000,
    cashHandedOver: 95000,
    cashInHand: 0,
    deviceId: 'DEV-HQ-MAIN',
    lastActiveAt: '2026-08-17T12:00:00',
    notes: 'मंडप मुख्य पावती काउंटर व देणगी कक्ष'
  }
];

export const initialHandovers: CashHandoverRecord[] = [
  {
    id: 'hnd-101',
    handoverNumber: 'HND-2026-001',
    volunteerId: 'vol-1',
    volunteerName: 'अमोल सुरेश शिंदे',
    amount: 20000,
    treasurerName: 'महेश चंद्रकांत गायकवाड (खजिनदार)',
    date: '2026-08-16',
    time: '08:30 PM',
    receiptCount: 12,
    status: 'Received',
    notes: 'सदाशिव पेठ गल्ली १ ते २ दुपारचे रोख संकलन जमा'
  },
  {
    id: 'hnd-102',
    handoverNumber: 'HND-2026-002',
    volunteerId: 'vol-2',
    volunteerName: 'प्रसाद विजय कुलकर्णी',
    amount: 15000,
    treasurerName: 'महेश चंद्रकांत गायकवाड (खजिनदार)',
    date: '2026-08-16',
    time: '09:15 PM',
    receiptCount: 8,
    status: 'Received',
    notes: 'टिळक रस्ता दुकानदार रोख संकलन'
  },
  {
    id: 'hnd-103',
    handoverNumber: 'HND-2026-003',
    volunteerId: 'vol-3',
    volunteerName: 'रोहित बाळासाहेब सावंत',
    amount: 10000,
    treasurerName: 'महेश चंद्रकांत गायकवाड (खजिनदार)',
    date: '2026-08-16',
    time: '09:45 PM',
    receiptCount: 5,
    status: 'Received',
    notes: 'नवी पेठ घरगुती वर्गणी रोख जमा'
  }
];

export const initialNightlyVerifications: import('../types').NightlyVerificationRecord[] = [
  {
    id: 'ver-2026-08-15',
    date: '2026-08-15',
    dayNumber: 1,
    status: 'Verified',
    verifiedByTreasurer: 'महेश चंद्रकांत गायकवाड (खजिनदार)',
    verifiedAt: '2026-08-15T23:30:00',
    counterSignedByPresident: 'राजेंद्र बापूराव तांबडे (अध्यक्ष)',
    counterSignedAt: '2026-08-15T23:45:00',
    systemCashExpected: 42000,
    physicalCashCounted: 42000,
    cashVariance: 0,
    denominations: {
      note2000: 0,
      note500: 70,
      note200: 20,
      note100: 25,
      note50: 8,
      note20: 5,
      note10: 0,
      coins: 0
    },
    treasurerNotes: 'दिवस १ आगमन संकलन तंतोतंत जुळले. सर्व रोख रक्कम मध्यवर्ती बँक लॉकरमध्ये जमा केली.',
    depositVaultLocation: 'Mandal Safe Locker (मंडळ तिजोरी)'
  },
  {
    id: 'ver-2026-08-16',
    date: '2026-08-16',
    dayNumber: 2,
    status: 'Verified',
    verifiedByTreasurer: 'महेश चंद्रकांत गायकवाड (खजिनदार)',
    verifiedAt: '2026-08-16T23:40:00',
    counterSignedByPresident: 'राजेंद्र बापूराव तांबडे (अध्यक्ष)',
    counterSignedAt: '2026-08-16T23:55:00',
    systemCashExpected: 35000,
    physicalCashCounted: 35000,
    cashVariance: 0,
    denominations: {
      note2000: 0,
      note500: 60,
      note200: 15,
      note100: 18,
      note50: 4,
      note20: 0,
      note10: 0,
      coins: 0
    },
    treasurerNotes: 'ऋषिपंचमी महिला अथर्वशीर्ष देणग्या व रोख कॅश बॉक्स पडताळणी पूर्ण.',
    depositVaultLocation: 'Mandal Safe Locker (मंडळ तिजोरी)'
  }
];



