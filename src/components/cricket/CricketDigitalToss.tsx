import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, RotateCcw, Volume2, VolumeX, Trophy, Shield, 
  Share2, Check, Sparkles, Clock, MapPin, 
  ChevronRight, Swords, ExternalLink, Download, Flame, HelpCircle,
  Sun, Moon, Smartphone, Languages, Radio, Tv, CloudSun, 
  CloudRain, Wind, Play, Users, MessageSquare, Copy,
  AlertTriangle, Gauge, Scale, RefreshCw, BarChart2, Info, Compass, ShieldAlert,
  Megaphone
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export interface TossHistoryItem {
  id: string;
  timestamp: string;
  teamA: string;
  teamB: string;
  callingTeam: string;
  calledSide: string;
  coinResult: string;
  winner: string;
  decision: 'bat' | 'bowl' | 'pending' | 'retoss' | 'arbitrated';
  venue?: string;
  overs?: number;
  outcomeType?: 'standard' | 'delayed' | 'reroll' | 'discretion';
  specialReason?: string;
}

export type CoinType = 'icc_gold' | 'rupee_coin' | 'ashes_silver';
export type WeatherTheme = 'floodlight' | 'sunny' | 'overcast';
export type Lang = 'en' | 'hi' | 'mr';
export type TossState = 'idle' | 'spinning' | 'landed' | 'decided' | 'edge_landed' | 'delayed' | 'reroll' | 'umpire_discretion';

const TRANSLATIONS: Record<Lang, {
  title: string;
  subtitle: string;
  portfolio: string;
  sfxOn: string;
  sfxOff: string;
  crowdOn: string;
  crowdOff: string;
  reset: string;
  scoreboard: string;
  quickPresets: string;
  team1Label: string;
  team2Label: string;
  teamAName: string;
  teamBName: string;
  captain: string;
  callingCoin: string;
  selectToCall: string;
  protocol: string;
  callsTheToss: string;
  callingChoice: string;
  heads: string;
  tails: string;
  bat: string;
  ball: string;
  venue: string;
  overs: string;
  spinCoin: string;
  coinInAir: string;
  flipAgain: string;
  shakePrompt: string;
  simulateShake: string;
  shakeEnabled: string;
  wonToss: string;
  choseTo: string;
  batFirst: string;
  bowlFirst: string;
  batFirstDesc: string;
  bowlFirstDesc: string;
  firstInningsBat: string;
  firstInningsBowl: string;
  copyReport: string;
  copied: string;
  shareNative: string;
  whatsappShare: string;
  startMatch: string;
  recentHistory: string;
  clearHistory: string;
  noHistory: string;
  umpireVoice: string;
  pitchReport: string;
  dewFactor: string;
  scorecardPreview: string;
  target: string;
  inningsBreakdown: string;
  weatherNight: string;
  weatherDay: string;
  weatherOvercast: string;
  coinGold: string;
  coinRupee: string;
  coinSilver: string;
  allPossibilitiesTitle: string;
  allPossibilitiesSubtitle: string;
  possibility1Title: string;
  possibility2Title: string;
  possibility3Title: string;
  possibility4Title: string;
  possibility5Title: string;
  possibility6Title: string;
  possibility7Title: string;
  simulateScenario: string;
  edgeLandedAlert: string;
  edgeLandedDesc: string;
  reTossBtn: string;
  fairOddsTitle: string;
  odds5050: string;
  weatherDelayTitle: string;
  weatherDelayDesc: string;
  resumeTossBtn: string;
  stadiumRoar: string;
  umpireWhistle: string;
  testRoar: string;
  testWhistle: string;
  tossDelayed: string;
  tossReroll: string;
  umpireDiscretion: string;
  last5Title: string;
  broadcastFeed: string;
  officialTossPresentation: string;
  launchLiveMatch: string;
  transferToSetup: string;
  scoreThisMatch: string;
  scoreboardConnected: string;
  conductForScoreboard: string;
}> = {
  en: {
    title: 'GullyScore Digital Toss',
    subtitle: 'ICC Standard Fair Coin Simulator & Captain Decision Suite',
    portfolio: 'Portfolio',
    sfxOn: 'SFX ON',
    sfxOff: 'SFX OFF',
    crowdOn: 'Crowd Ambience ON',
    crowdOff: 'Crowd Ambience OFF',
    reset: 'Reset Toss',
    scoreboard: 'Scoreboard',
    quickPresets: 'Quick Match Preset',
    team1Label: 'Team 1 (Calling)',
    team2Label: 'Team 2 (Opponent)',
    teamAName: 'Team A Name',
    teamBName: 'Team B Name',
    captain: 'Captain Name',
    callingCoin: 'Calling Coin ✓',
    selectToCall: 'Select to Call',
    protocol: 'Official Toss Protocol',
    callsTheToss: 'Calls The Toss',
    callingChoice: 'Calling Choice (Prediction)',
    heads: 'HEADS (छाप) 🦁',
    tails: 'TAILS (काटा) 🏆',
    bat: 'BAT',
    ball: 'BOWL',
    venue: 'Venue',
    overs: 'Match Overs',
    spinCoin: 'Spin Coin (Toss Now)',
    coinInAir: 'Coin In The Air...',
    flipAgain: 'Flip Coin Again',
    shakePrompt: 'Shake Phone to Toss',
    simulateShake: 'Simulate Shake',
    shakeEnabled: 'Shake Sensor Ready',
    wonToss: 'Won The Toss!',
    choseTo: 'and elected to',
    batFirst: 'BAT FIRST (फलंदाजी)',
    bowlFirst: 'BOWL FIRST (गोलंदाजी)',
    batFirstDesc: 'Set a daunting target on the board',
    bowlFirstDesc: 'Field first and chase under lights',
    firstInningsBat: '1st Innings Batting',
    firstInningsBowl: '1st Innings Bowling',
    copyReport: 'Copy WhatsApp Report',
    copied: 'Report Copied!',
    shareNative: 'Share Match Result',
    whatsappShare: 'WhatsApp Share',
    startMatch: 'Start Match in Scoreboard',
    recentHistory: 'Recent Toss History',
    clearHistory: 'Clear History',
    noHistory: 'No previous toss records found. Spin coin above!',
    umpireVoice: 'Match Referee / Umpire Call',
    pitchReport: 'Pitch & Toss Analysis',
    dewFactor: 'Dew Factor',
    scorecardPreview: 'Broadcast Live Scorecard Preview',
    target: 'Target Setup: 1st Innings 0/0 (0.0 Ov)',
    inningsBreakdown: 'Live Innings Lineup Setup',
    weatherNight: 'Night Floodlights',
    weatherDay: 'Sunny Oval Day',
    weatherOvercast: 'Overcast & Swing',
    coinGold: 'ICC Gold Coin',
    coinRupee: 'Indian ₹10 Match Coin',
    coinSilver: 'Ashes Silver Coin',
    allPossibilitiesTitle: 'Toss Possibilities & Scenario Matrix',
    allPossibilitiesSubtitle: 'Comprehensive analysis of all 7 cricket toss outcomes, mathematically fair odds & pitch branches',
    possibility1Title: 'Caller calls HEADS + Lands HEADS',
    possibility2Title: 'Caller calls HEADS + Lands TAILS',
    possibility3Title: 'Caller calls TAILS + Lands TAILS',
    possibility4Title: 'Caller calls TAILS + Lands HEADS',
    possibility5Title: 'MCC Law 13.4: Vertical Rim / Edge Landing (Void & Re-Toss)',
    possibility6Title: 'Delayed Toss & Reduced Overs (Rain / Damp Pitch)',
    possibility7Title: 'Uncontested Away Choice (Visiting Captain Elects to Bowl)',
    simulateScenario: 'Simulate Outcome',
    edgeLandedAlert: 'MCC Law 13.4 Alert: Coin Landed on Edge!',
    edgeLandedDesc: 'The coin landed vertically on its rim in the pitch crack. Official toss is VOID and must be re-conducted immediately.',
    reTossBtn: 'Conduct Official Re-Toss Now',
    fairOddsTitle: 'Mathematical Toss Probability',
    odds5050: '50.0% Heads / 50.0% Tails (Strictly Fair Bernoulli Trial)',
    weatherDelayTitle: 'Weather / Pitch Dampness Delay Active',
    weatherDelayDesc: 'Match officials have deferred the toss window. Outfield inspection underway; overs may be recalculated.',
    resumeTossBtn: 'Resume Toss Protocol',
    stadiumRoar: 'Stadium Roar',
    umpireWhistle: 'Umpire Whistle',
    testRoar: 'Roar 🏟️',
    testWhistle: 'Whistle 📢',
    tossDelayed: 'Toss Delayed 🌧️',
    tossReroll: 'Toss Reroll (Void) 🔄',
    umpireDiscretion: 'Umpire Discretion ⚖️',
    last5Title: 'Last 5 Coin Tosses • Form Tracker',
    broadcastFeed: 'LIVE BROADCAST FEED',
    officialTossPresentation: 'OFFICIAL TOSS PRESENTATION',
    launchLiveMatch: 'Launch Live Match in Scoreboard ⚡',
    transferToSetup: 'Transfer to Match Setup 📋',
    scoreThisMatch: 'Score Match in GullyScore 🏏',
    scoreboardConnected: 'Scoreboard Connected',
    conductForScoreboard: 'Conducting Toss for Scoreboard'
  },
  hi: {
    title: 'गलीस्कोर डिजिटल टॉस सिमुलेटर',
    subtitle: 'आईसीसी मानक निष्पक्ष सिक्का सिमुलेटर एवं कप्तान निर्णय सूट',
    portfolio: 'पोर्टफोलियो',
    sfxOn: 'ध्वनि चालू',
    sfxOff: 'ध्वनि बंद',
    crowdOn: 'स्टेडियम शोर चालू',
    crowdOff: 'स्टेडियम शोर बंद',
    reset: 'रीसेट टॉस',
    scoreboard: 'स्कोरकार्ड',
    quickPresets: 'त्वरित मैच प्रीसेट',
    team1Label: 'टीम 1 (टॉस कॉलर)',
    team2Label: 'टीम 2 (प्रतिद्वंद्वी)',
    teamAName: 'टीम ए का नाम',
    teamBName: 'टीम बी का नाम',
    captain: 'कप्तान का नाम',
    callingCoin: 'टॉस कॉल कर रहे हैं ✓',
    selectToCall: 'कॉल के लिए चुनें',
    protocol: 'आधिकारिक टॉस प्रोटोकॉल',
    callsTheToss: 'सिक्का उछालेंगे',
    callingChoice: 'कॉलिंग विकल्प (भविष्यवाणी)',
    heads: 'हेड्स (छाप) 🦁',
    tails: 'टेल्स (काटा) 🏆',
    bat: 'बल्लेबाजी',
    ball: 'गेंदबाजी',
    venue: 'मैदान (स्थान)',
    overs: 'मैच ओवर',
    spinCoin: 'सिक्का उछालें (TOSS)',
    coinInAir: 'सिक्का हवा में है...',
    flipAgain: 'दोबारा सिक्का उछालें',
    shakePrompt: 'टॉस के लिए फोन हिलाएं',
    simulateShake: 'शेक टेस्ट करें',
    shakeEnabled: 'शेक सेंसर तैयार है',
    wonToss: 'ने टॉस जीता!',
    choseTo: 'और फैसला किया पहले',
    batFirst: 'पहले बल्लेबाजी (BAT FIRST)',
    bowlFirst: 'पहले गेंदबाजी (BOWL FIRST)',
    batFirstDesc: 'बोर्ड पर बड़ा स्कोर खड़ा करें',
    bowlFirstDesc: 'पहले फील्डिंग कर लक्ष्य का पीछा करें',
    firstInningsBat: 'पहली पारी बल्लेबाजी',
    firstInningsBowl: 'पहली पारी गेंदबाजी',
    copyReport: 'व्हाट्सएप रिपोर्ट कॉपी करें',
    copied: 'रिपोर्ट कॉपी हो गई!',
    shareNative: 'मैच परिणाम साझा करें',
    whatsappShare: 'व्हाट्सएप पर भेजें',
    startMatch: 'स्कोरबोर्ड में मैच शुरू करें',
    recentHistory: 'हाल के टॉस परिणाम',
    clearHistory: 'इतिहास मिटाएं',
    noHistory: 'कोई पिछला टॉस नहीं मिला। ऊपर सिक्का उछालें!',
    umpireVoice: 'अंपायर / मैच रेफरी का फैसला',
    pitchReport: 'पिच और मौसम रिपोर्ट',
    dewFactor: 'ओस का प्रभाव',
    scorecardPreview: 'ब्रॉडकास्ट लाइव स्कोरकार्ड प्रीव्यू',
    target: 'पहली पारी लक्ष्य तैयारी: 0/0 (0.0 ओवर)',
    inningsBreakdown: 'पारी आवंटन',
    weatherNight: 'नाइट फ्लडलाइट्स',
    weatherDay: 'धूप वाला दिन',
    weatherOvercast: 'बादल और स्विंग',
    coinGold: 'आईसीसी गोल्ड सिक्का',
    coinRupee: 'भारतीय ₹10 मैच सिक्का',
    coinSilver: 'एशेज सिल्वर सिक्का',
    allPossibilitiesTitle: 'नाणेफेक की सभी संभावनाएं और परिदृश्य मैट्रिक्स',
    allPossibilitiesSubtitle: 'क्रिकेट टॉस के सभी 7 आधिकारिक परिणाम, 50-50 निष्पक्ष संभावनाएं और पिच निर्णय शाखाएं',
    possibility1Title: 'कॉलर ने चुना हेड्स + आया हेड्स',
    possibility2Title: 'कॉलर ने चुना हेड्स + आया टेल्स',
    possibility3Title: 'कॉलर ने चुना टेल्स + आया टेल्स',
    possibility4Title: 'कॉलर ने चुना टेल्स + आया हेड्स',
    possibility5Title: 'एमसीसी नियम 13.4: सिक्का किनारे पर खड़ा होना (रद्द एवं पुनः टॉस)',
    possibility6Title: 'बारिश/गीली पिच के कारण टॉस में देरी व ओवर कटौती',
    possibility7Title: 'बिना टॉस विपक्षी टीम का गेंदबाजी चुनना (काउंटी नियम)',
    simulateScenario: 'यह परिदृश्य चलाएं',
    edgeLandedAlert: 'एमसीसी नियम 13.4: सिक्का किनारे पर खड़ा रह गया!',
    edgeLandedDesc: 'पिच की दरार में सिक्का लंबवत खड़ा हो गया है। आधिकारिक टॉस रद्द कर दोबारा कराया जाएगा।',
    reTossBtn: 'तुरंत दोबारा टॉस कराएं (Re-Toss)',
    fairOddsTitle: 'गणितीय टॉस संभावना',
    odds5050: '50.0% हेड्स / 50.0% टेल्स (पूर्णतः निष्पक्ष बर्नौली प्रयोग)',
    weatherDelayTitle: 'मौसम व गीली पिच के कारण टॉस रुका हुआ है',
    weatherDelayDesc: 'मैच अधिकारियों ने निरीक्षण शुरू किया है; ओवरों की संख्या घटाई जा सकती है।',
    resumeTossBtn: 'टॉस पुनः शुरू करें',
    stadiumRoar: 'स्टेडियम शोर',
    umpireWhistle: 'अंपायर सीटी',
    testRoar: 'शोर 🏟️',
    testWhistle: 'सीटी 📢',
    tossDelayed: 'टॉस स्थगित 🌧️',
    tossReroll: 'टॉस रद्द / पुनः 🔄',
    umpireDiscretion: 'अंपायर विशेषाधिकार ⚖️',
    last5Title: 'पिछले 5 टॉस • फॉर्म ट्रैकर',
    broadcastFeed: 'लाइव ब्रॉडकास्ट फीड',
    officialTossPresentation: 'आधिकारिक टॉस प्रस्तुति',
    launchLiveMatch: 'स्कोरबोर्ड में लाइव मैच शुरू करें ⚡',
    transferToSetup: 'मैच सेटअप में ट्रांसफर करें 📋',
    scoreThisMatch: 'गलीस्कोर में मैच स्कोर करें 🏏',
    scoreboardConnected: 'स्कोरबोर्ड कनेक्टेड',
    conductForScoreboard: 'स्कोरबोर्ड के लिए टॉस जारी'
  },
  mr: {
    title: 'गल्लीस्कोअर डिजिटल टॉस सिम्युलेटर',
    subtitle: 'आयसीसी मानकांनुसार निष्पक्ष नाणेफेक आणि कर्णधार निर्णय सूट',
    portfolio: 'पोर्टफोलिओ',
    sfxOn: 'आवाज चालू',
    sfxOff: 'आवाज बंद',
    crowdOn: 'स्टेडियम आवाज चालू',
    crowdOff: 'स्टेडियम आवाज बंद',
    reset: 'टॉस रीसेट',
    scoreboard: 'स्कोअरबोर्ड',
    quickPresets: 'जलद सामना प्रीसेट',
    team1Label: 'संघ १ (कॉल करणारा)',
    team2Label: 'संघ २ (प्रतिस्पर्धी)',
    teamAName: 'संघ अ चे नाव',
    teamBName: 'संघ ब चे नाव',
    captain: 'कर्णधाराचे नाव',
    callingCoin: 'कॉल करत आहे ✓',
    selectToCall: 'कॉलसाठी निवडा',
    protocol: 'अधिकृत नाणेफेक प्रोटोकॉल',
    callsTheToss: 'नाणेफेक कॉल करतील',
    callingChoice: 'कॉलिंग निवड (अंदाज)',
    heads: 'छापा (HEADS) 🦁',
    tails: 'काटा (TAILS) 🏆',
    bat: 'फलंदाजी',
    ball: 'गोलंदाजी',
    venue: 'मैदान (स्थान)',
    overs: 'सामना षटके',
    spinCoin: 'नाणेफेक करा (TOSS)',
    coinInAir: 'नाणे हवेत आहे...',
    flipAgain: 'पुन्हा नाणेफेक करा',
    shakePrompt: 'टॉससाठी फोन हलवा (Shake)',
    simulateShake: 'शेक टेस्ट करा',
    shakeEnabled: 'शेक सेन्सर सज्ज',
    wonToss: 'ने टॉस जिंकला!',
    choseTo: 'आणि निर्णय घेतला प्रथम',
    batFirst: 'प्रथम फलंदाजी (BAT FIRST)',
    bowlFirst: 'प्रथम गोलंदाजी (BOWL FIRST)',
    batFirstDesc: 'धावफलकावर मोठे आव्हान उभे करा',
    bowlFirstDesc: 'प्रथम क्षेत्ररक्षण करून पाठलाग करा',
    firstInningsBat: 'पहिली फेरी फलंदाजी',
    firstInningsBowl: 'पहिली फेरी गोलंदाजी',
    copyReport: 'व्हॉट्सॲप अहवाल कॉपी करा',
    copied: 'अहवाल कॉपी झाला!',
    shareNative: 'सामना निकाल शेअर करा',
    whatsappShare: 'व्हॉट्सॲपवर पाठवा',
    startMatch: 'स्कोअरबोर्डमध्ये सामना सुरू करा',
    recentHistory: 'अलिकडील नाणेफेक इतिहास',
    clearHistory: 'इतिहास पुसा',
    noHistory: 'मागील नाणेफेक नोंदी नाहीत. वर नाणेफेक करा!',
    umpireVoice: 'पंच (Umpire) व सामनाधिकारी निर्णय',
    pitchReport: 'खेळपट्टी व वातावरण अहवाल',
    dewFactor: 'दव (Dew) प्रभाव',
    scorecardPreview: 'थेट ब्रॉडकास्ट स्कोअरकार्ड पूर्वदृश्य',
    target: 'पहिली फेरी लक्ष्य: ०/० (०.० षटके)',
    inningsBreakdown: 'फेरी रचना',
    weatherNight: 'रात्र फ्लडलाइट्स',
    weatherDay: 'सूर्यप्रकाश मैदान',
    weatherOvercast: 'ढगाळ व स्विंग परिस्थिती',
    coinGold: 'आयसीसी गोल्ड नाणे',
    coinRupee: 'भारतीय ₹१० मॅच नाणे',
    coinSilver: 'अ‍ॅशेस सिल्व्हर नाणे',
    allPossibilitiesTitle: 'नाणेफेकीच्या सर्व शक्यता व निकाल मॅट्रिक्स',
    allPossibilitiesSubtitle: 'क्रिकेट नाणेफेकीचे सर्व ७ अधिकृत निकाल, ५०-५० निष्पक्ष संभाव्यता आणि खेळपट्टी रणनीती',
    possibility1Title: 'कॉल केला छापा + पडला छापा',
    possibility2Title: 'कॉल केला छापा + पडला काटा',
    possibility3Title: 'कॉल केला काटा + पडला काटा',
    possibility4Title: 'कॉल केला काटा + पडला छापा',
    possibility5Title: 'एमसीसी नियम १३.४: नाणे काठावर उभे राहणे (रद्द व पुन्हा नाणेफेक)',
    possibility6Title: 'पावसामुळे नाणेफेक विलंब व षटकांची कपात (DLS)',
    possibility7Title: 'बिना नाणेफेक पाहुण्या संघाची गोलंदाजी निवड (काउंटी नियम)',
    simulateScenario: 'ही शक्यता तपासा',
    edgeLandedAlert: 'एमसीसी नियम १३.४: नाणे काठावर उभे राहिले!',
    edgeLandedDesc: 'खेळपट्टीच्या भेगेत नाणे उभे राहिले असल्याने अधिकृत नाणेफेक रद्द करण्यात आली आहे. त्वरित पुन्हा नाणेफेक करा.',
    reTossBtn: 'अधिकृत पुन्हा नाणेफेक करा (Re-Toss)',
    fairOddsTitle: 'गणितीय नाणेफेक संभाव्यता',
    odds5050: '५०.०% छापा / ५०.०% काटा (पूर्णतः निष्पक्ष बर्नोली प्रयोग)',
    weatherDelayTitle: 'पाऊस/दमट खेळपट्टीमुळे नाणेफेक स्थगित',
    weatherDelayDesc: 'पंच खेळपट्टीची तपासणी करत आहेत; सामन्याची षटके कमी केली जाऊ शकतात.',
    resumeTossBtn: 'नाणेफेक पुन्हा सुरू करा',
    stadiumRoar: 'स्टेडियम गर्जना',
    umpireWhistle: 'पंच शिटी',
    testRoar: 'गर्जना 🏟️',
    testWhistle: 'शिटी 📢',
    tossDelayed: 'नाणेफेक विलंब 🌧️',
    tossReroll: 'नाणेफेक रद्द / पुन्हा 🔄',
    umpireDiscretion: 'पंचांचा विशेषाधिकार ⚖️',
    last5Title: 'मागील ५ नाणेफेक • फॉर्म ट्रॅकर',
    broadcastFeed: 'थेट प्रक्षेपण फीड',
    officialTossPresentation: 'अधिकृत नाणेफेक सादरीकरण',
    launchLiveMatch: 'स्कोअरबोर्डमध्ये थेट सामना सुरू करा ⚡',
    transferToSetup: 'सामना सेटअपमध्ये पाठवा 📋',
    scoreThisMatch: 'गलीस्कोअरमध्ये सामना स्कोअर करा 🏏',
    scoreboardConnected: 'स्कोअरबोर्ड जोडलेला',
    conductForScoreboard: 'स्कोअरबोर्डसाठी नाणेफेक सुरू'
  }
};

const PRESET_MATCHES = [
  { teamA: 'India', teamACaptain: 'Rohit Sharma', teamB: 'Australia', teamBCaptain: 'Pat Cummins', venue: 'Wankhede Stadium, Mumbai', overs: 20 },
  { teamA: 'Chennai Super Kings', teamACaptain: 'Ruturaj Gaikwad', teamB: 'Mumbai Indians', teamBCaptain: 'Hardik Pandya', venue: 'Chepauk, Chennai', overs: 20 },
  { teamA: 'Royal Challengers Bengaluru', teamACaptain: 'Faf du Plessis', teamB: 'Kolkata Knight Riders', teamBCaptain: 'Shreyas Iyer', venue: 'M. Chinnaswamy, Bengaluru', overs: 20 },
  { teamA: 'Gully Boys XI', teamACaptain: 'Bunty', teamB: 'Street Kings CC', teamBCaptain: 'Sunny', venue: 'Shivaji Park Ground, Dadar', overs: 10 },
  { teamA: 'Pune Warriors', teamACaptain: 'Rahul', teamB: 'Nagpur Strikers', teamBCaptain: 'Prasad', venue: 'MCA Stadium, Pune', overs: 12 },
];

export interface TossPossibility {
  id: string;
  numId: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: string;
  law: string;
  probability: string;
  desc: string;
  outcomeType: 'caller_win' | 'opponent_win' | 'retoss' | 'delay' | 'uncontested';
}

const TOSS_POSSIBILITIES: TossPossibility[] = [
  {
    id: 'caller_heads_win',
    numId: 1,
    name: '1. Caller predicts Heads + Coin lands Heads',
    law: 'MCC Law 13.3',
    probability: '49.4%',
    desc: 'The calling captain correctly called Heads. They win the toss and gain the sole right to choose Bat or Bowl first.',
    outcomeType: 'caller_win',
  },
  {
    id: 'caller_heads_lose',
    numId: 2,
    name: '2. Caller predicts Heads + Coin lands Tails',
    law: 'MCC Law 13.3',
    probability: '49.4%',
    desc: 'The calling captain called Heads but the coin revealed Tails. The opposing captain wins the toss and decides.',
    outcomeType: 'opponent_win',
  },
  {
    id: 'caller_tails_win',
    numId: 3,
    name: '3. Caller predicts Tails + Coin lands Tails',
    law: 'MCC Law 13.3',
    probability: '49.4%',
    desc: 'The calling captain correctly called Tails. They win the toss and declare their tactical decision.',
    outcomeType: 'caller_win',
  },
  {
    id: 'caller_tails_lose',
    numId: 4,
    name: '4. Caller predicts Tails + Coin lands Heads',
    law: 'MCC Law 13.3',
    probability: '49.4%',
    desc: 'The calling captain called Tails but the coin landed Heads. The opposing captain claims the toss victory.',
    outcomeType: 'opponent_win',
  },
  {
    id: 'edge_landed',
    numId: 5,
    name: '5. Coin Lands on Vertical Edge / Soft Turf (Void)',
    law: 'MCC Law 13.4',
    probability: '1.2%',
    desc: 'The coin stands upright on its rim or lodges in a pitch crevice without revealing either face. The umpire declares an immediate re-toss.',
    outcomeType: 'retoss',
  },
  {
    id: 'weather_delay',
    numId: 6,
    name: '6. Inclement Weather / Wet Pitch Delay',
    law: 'ICC Clause 1.3',
    probability: 'Contingency',
    desc: 'Rain or bad light delays the toss. Playing conditions mandate match overs be curtailed (e.g. 20 down to 15, 10 or 5 overs).',
    outcomeType: 'delay',
  },
  {
    id: 'uncontested_choice',
    numId: 7,
    name: '7. Uncontested Toss / Visiting Team Elects (ECB Rule)',
    law: 'Special Reg',
    probability: 'Special Rule',
    desc: 'Under county/bilateral regulations, the visiting team can opt to bowl first without a toss to deter pitch doctoring.',
    outcomeType: 'uncontested',
  },
];

export const CricketDigitalToss: React.FC = () => {
  // Localization & Theme Settings
  const [lang, setLang] = useState<Lang>('en');
  const t = TRANSLATIONS[lang];

  const [weatherTheme, setWeatherTheme] = useState<WeatherTheme>('floodlight');
  const [coinType, setCoinType] = useState<CoinType>('icc_gold');

  // Integration with GullyScore: Local Cricket Match Scoreboard
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fromScoreboard = searchParams.get('fromScoreboard') === 'true';
  const paramTeamA = searchParams.get('teamA');
  const paramTeamB = searchParams.get('teamB');
  const paramOvers = searchParams.get('overs');
  const paramVenue = searchParams.get('venue') || searchParams.get('ground');

  // Match Team Details
  const [teamA, setTeamA] = useState(() => paramTeamA || 'Mumbai Indians');
  const [teamACaptain, setTeamACaptain] = useState('Hardik Pandya');
  const [teamB, setTeamB] = useState(() => paramTeamB || 'Chennai Super Kings');
  const [teamBCaptain, setTeamBCaptain] = useState('Ruturaj Gaikwad');
  const [venue, setVenue] = useState(() => paramVenue || 'Wankhede Stadium, Mumbai');
  const [overs, setOvers] = useState<number>(() => (paramOvers ? Number(paramOvers) : 20));

  // Calling Setup
  const [callingTeam, setCallingTeam] = useState<'teamA' | 'teamB'>('teamA');
  const [calledSide, setCalledSide] = useState<'heads' | 'tails'>('heads');

  // Toss State: 'idle' | 'spinning' | 'landed' | 'decided' | 'edge_landed' | 'delayed' | 'reroll' | 'umpire_discretion'
  const [tossState, setTossState] = useState<TossState>('idle');
  const [coinResult, setCoinResult] = useState<string>('heads');
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossWinnerCaptain, setTossWinnerCaptain] = useState<string>('');
  const [decision, setDecision] = useState<'bat' | 'bowl' | null>(null);
  const [umpireModalOpen, setUmpireModalOpen] = useState(false);
  const [tossSpecialReason, setTossSpecialReason] = useState<string>('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TossHistoryItem | null>(null);

  // 3D Coin Angles
  const [coinRotation, setCoinRotation] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Audio, Crowd & Shaking
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [crowdAudioEnabled, setCrowdAudioEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [shakeSupported, setShakeSupported] = useState(false);
  const [shakeTriggered, setShakeTriggered] = useState(false);

  // Toss History (Tracking Last 5+ results)
  const [history, setHistory] = useState<TossHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cricket_toss_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'hist-1',
        timestamp: 'Today, 07:00 PM',
        teamA: 'India',
        teamB: 'Australia',
        callingTeam: 'India',
        calledSide: 'heads',
        coinResult: 'heads',
        winner: 'India',
        decision: 'bat',
        venue: 'Wankhede Stadium, Mumbai',
        overs: 20,
        outcomeType: 'standard',
        specialReason: 'Heads Landed Fair'
      },
      {
        id: 'hist-2',
        timestamp: 'Yesterday, 07:30 PM',
        teamA: 'Chennai Super Kings',
        teamB: 'Mumbai Indians',
        callingTeam: 'Chennai Super Kings',
        calledSide: 'tails',
        coinResult: 'tails',
        winner: 'Chennai Super Kings',
        decision: 'bowl',
        venue: 'Chepauk, Chennai',
        overs: 20,
        outcomeType: 'standard',
        specialReason: 'Tails Landed Fair'
      },
      {
        id: 'hist-3',
        timestamp: '2 Days Ago, 03:30 PM',
        teamA: 'England',
        teamB: 'Pakistan',
        callingTeam: 'England',
        calledSide: 'heads',
        coinResult: 'Toss Delayed',
        winner: 'Pitch Inspection',
        decision: 'pending',
        venue: "Lord's, London",
        overs: 15,
        outcomeType: 'delayed',
        specialReason: 'Outfield Dampness / Overs Curtailed'
      },
      {
        id: 'hist-4',
        timestamp: '3 Days Ago, 07:00 PM',
        teamA: 'Kolkata Knight Riders',
        teamB: 'Royal Challengers Bengaluru',
        callingTeam: 'Kolkata Knight Riders',
        calledSide: 'tails',
        coinResult: 'Toss Reroll',
        winner: 'Void (MCC Law 13.4)',
        decision: 'retoss',
        venue: 'Eden Gardens, Kolkata',
        overs: 20,
        outcomeType: 'reroll',
        specialReason: 'Vertical Edge Landing on Soft Turf'
      },
      {
        id: 'hist-5',
        timestamp: '4 Days Ago, 02:30 PM',
        teamA: 'South Africa',
        teamB: 'New Zealand',
        callingTeam: 'South Africa',
        calledSide: 'heads',
        coinResult: 'Umpire Discretion',
        winner: 'New Zealand',
        decision: 'bowl',
        venue: 'Newlands, Cape Town',
        overs: 20,
        outcomeType: 'discretion',
        specialReason: 'MCC Arbiter Award (Visiting Team Option)'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('cricket_toss_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Web Audio Context & Crowd Simulator
  const audioCtxRef = useRef<AudioContext | null>(null);
  const crowdNoiseRef = useRef<{ source: AudioNode; gain: GainNode } | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Crowd noise generator (bandpassed noise simulation)
  const toggleCrowdAmbience = () => {
    const nextState = !crowdAudioEnabled;
    setCrowdAudioEnabled(nextState);

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (!nextState) {
        if (crowdNoiseRef.current) {
          crowdNoiseRef.current.gain.gain.setValueAtTime(0, ctx.currentTime);
        }
        return;
      }

      // Generate 5s white noise buffer and loop it
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to simulate stadium murmur
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
      crowdNoiseRef.current = { source: whiteNoise, gain };
    } catch {
      // ignore audio error
    }
  };

  // Stadium Roar Simulator (Web Audio API)
  // Generates 3.2s multi-layered acoustic crowd swell with resonant bandpass sweep and sub-bass rumble
  const playStadiumRoar = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const duration = 3.2;

      // Layer 1: Pinkish crowd noise buffer
      const bufferSize = ctx.sampleRate * duration;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0990460;
        b1 = 0.96300 * b1 + white * 0.2965164;
        b2 = 0.57000 * b2 + white * 1.0526913;
        const pink = b0 + b1 + b2 + white * 0.1848;
        const progress = i / bufferSize;
        const envelope = Math.sin(progress * Math.PI) * Math.pow(Math.sin(progress * Math.PI * 0.5), 0.25);
        output[i] = pink * 0.14 * envelope;
      }

      const crowdSource = ctx.createBufferSource();
      crowdSource.buffer = noiseBuffer;

      // Resonant bandpass filter that sweeps upwards as the roar erupts
      const roarFilter = ctx.createBiquadFilter();
      roarFilter.type = 'bandpass';
      roarFilter.frequency.setValueAtTime(320, now);
      roarFilter.frequency.exponentialRampToValueAtTime(1150, now + 0.8);
      roarFilter.frequency.exponentialRampToValueAtTime(420, now + duration);
      roarFilter.Q.setValueAtTime(1.9, now);

      const roarGain = ctx.createGain();
      roarGain.gain.setValueAtTime(0.001, now);
      roarGain.gain.exponentialRampToValueAtTime(0.45, now + 0.35);
      roarGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      crowdSource.connect(roarFilter);
      roarFilter.connect(roarGain);
      roarGain.connect(ctx.destination);
      crowdSource.start(now);
      crowdSource.stop(now + duration);

      // Layer 2: Sub-bass ground rumble
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      const subFilter = ctx.createBiquadFilter();
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(100, now);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(55, now);
      subOsc.frequency.exponentialRampToValueAtTime(90, now + 0.6);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + duration);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.exponentialRampToValueAtTime(0.35, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + duration);

      // Layer 3: High cheer formant
      const cheerOsc = ctx.createOscillator();
      const cheerGain = ctx.createGain();
      cheerOsc.type = 'triangle';
      cheerOsc.frequency.setValueAtTime(480, now);
      cheerOsc.frequency.linearRampToValueAtTime(740, now + 0.7);
      cheerGain.gain.setValueAtTime(0.001, now);
      cheerGain.gain.exponentialRampToValueAtTime(0.09, now + 0.4);
      cheerGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      cheerOsc.connect(cheerGain);
      cheerGain.connect(ctx.destination);
      cheerOsc.start(now + 0.1);
      cheerOsc.stop(now + 2.2);
    } catch {
      // audio fallback
    }
  };

  // Official Cricket Umpire Whistle (Web Audio API)
  // Dual-frequency pea whistle with 26Hz frequency modulation tremolo producing signature sharp blast
  const playUmpireWhistle = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const triggerWhistleBlast = (startTime: number, blastDuration: number, gainLevel: number) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const whistleGain = ctx.createGain();

        // Dual frequencies for acoustic beat dissonance
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2680, startTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(2940, startTime);

        // LFO tremolo (spinning pea in the whistle chamber)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(26, startTime);
        lfoGain.gain.setValueAtTime(45, startTime);
        lfo.connect(osc1.frequency);
        lfo.connect(osc2.frequency);

        // Crisp envelope
        whistleGain.gain.setValueAtTime(0.001, startTime);
        whistleGain.gain.linearRampToValueAtTime(gainLevel, startTime + 0.02);
        whistleGain.gain.exponentialRampToValueAtTime(0.001, startTime + blastDuration);

        osc1.connect(whistleGain);
        osc2.connect(whistleGain);
        whistleGain.connect(ctx.destination);

        lfo.start(startTime);
        osc1.start(startTime);
        osc2.start(startTime);

        lfo.stop(startTime + blastDuration);
        osc1.stop(startTime + blastDuration);
        osc2.stop(startTime + blastDuration);
      };

      // Double chirp blast: "Pip... Piiiiiip!"
      triggerWhistleBlast(now, 0.13, 0.28);
      triggerWhistleBlast(now + 0.16, 0.38, 0.35);
    } catch {
      // audio fallback
    }
  };

  const playCrowdCheerRoar = () => {
    playStadiumRoar();
  };

  const playCoinFlickSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3400, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.45, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio fallback
    }
  };

  const playCoinLandSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);

      setTimeout(() => {
        if (!audioCtxRef.current) return;
        const bOsc = audioCtxRef.current.createOscillator();
        const bGain = audioCtxRef.current.createGain();
        bOsc.type = 'sine';
        bOsc.frequency.setValueAtTime(1900, audioCtxRef.current.currentTime);
        bGain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        bGain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.2);
        bOsc.connect(bGain);
        bGain.connect(audioCtxRef.current.destination);
        bOsc.start();
        bOsc.stop(audioCtxRef.current.currentTime + 0.2);
      }, 130);
    } catch {
      // Audio fallback
    }
  };

  const playCheerFanfare = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.4);
      });
      playCrowdCheerRoar();
    } catch {
      // Audio fallback
    }
  };

  // Mobile Shake Sensor Handling
  useEffect(() => {
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    let lastUpdate = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const curTime = Date.now();
      if (curTime - lastUpdate > 100) {
        const diffTime = curTime - lastUpdate;
        lastUpdate = curTime;

        if (lastX !== null && lastY !== null && lastZ !== null) {
          const deltaX = Math.abs(current.x - lastX);
          const deltaY = Math.abs(current.y - lastY);
          const deltaZ = Math.abs(current.z - lastZ);
          const speed = (deltaX + deltaY + deltaZ) / diffTime * 10000;

          if (speed > 1600 && tossState !== 'spinning') {
            setShakeTriggered(true);
            setTimeout(() => setShakeTriggered(false), 800);
            if (navigator.vibrate) {
              navigator.vibrate([80, 40, 80]);
            }
            handleFlipCoin();
          }
        }

        lastX = current.x;
        lastY = current.y;
        lastZ = current.z;
      }
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      setShakeSupported(true);
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [tossState, teamA, teamB, callingTeam, calledSide]);

  // Flip Coin Handler
  const handleFlipCoin = () => {
    if (tossState === 'spinning') return;

    // Reset previous decision
    setDecision(null);
    setTossState('spinning');
    playCoinFlickSound();

    if (navigator.vibrate) {
      navigator.vibrate(60);
    }

    // Random outcome: heads or tails (with rare 1% vertical edge landing possibility)
    const isRareEdge = Math.random() < 0.012;
    if (isRareEdge) {
      const extraSpins = 6 * 360;
      setCoinRotation({
        x: extraSpins + 90,
        y: 0
      });
      setTimeout(() => {
        setTossState('edge_landed');
        playCoinLandSound();
        if (navigator.vibrate) {
          navigator.vibrate([120, 80, 120]);
        }
      }, 2800);
      return;
    }

    const outcome: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';
    setCoinResult(outcome);

    // Calculate winner
    const callingTeamName = callingTeam === 'teamA' ? teamA : teamB;
    const otherTeamName = callingTeam === 'teamA' ? teamB : teamA;
    const callingCaptain = callingTeam === 'teamA' ? teamACaptain : teamBCaptain;
    const otherCaptain = callingTeam === 'teamA' ? teamBCaptain : teamACaptain;

    const winnerName = calledSide === outcome ? callingTeamName : otherTeamName;
    const winnerCaptainName = calledSide === outcome ? callingCaptain : otherCaptain;

    // 3D Rotations: 6 full spins (2160 deg) + landing orientation
    const extraSpins = 6 * 360;
    const finalAngle = outcome === 'heads' ? extraSpins : extraSpins + 180;
    
    setCoinRotation({
      x: finalAngle + (Math.random() * 16 - 8),
      y: (Math.random() * 30 - 15)
    });

    // Landing sequence
    setTimeout(() => {
      setTossState('landed');
      setTossWinner(winnerName);
      setTossWinnerCaptain(winnerCaptainName);
      setTossSpecialReason(`${outcome.toUpperCase()} Landed Fair`);
      playCoinLandSound();
      playUmpireWhistle();
      playStadiumRoar();
      playCheerFanfare();

      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 150]);
      }
    }, 2800);
  };

  // Explicit Trigger: Toss Delayed (Rain/Outfield/Pitch inspection)
  const handleTriggerTossDelayed = (reason?: string) => {
    const delayReason = reason || 'Wet Outfield & Pre-Match Rain';
    setTossSpecialReason(delayReason);
    setCoinResult('Toss Delayed');
    setTossWinner('Match Officials (Delayed)');
    setTossState('delayed');
    setWeatherTheme('overcast');
    playUmpireWhistle();

    const callingTeamName = callingTeam === 'teamA' ? teamA : teamB;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    setHistory(prev => [{
      id: 'toss-' + Date.now(),
      timestamp: `${dateStr}, ${timeStr}`,
      teamA: teamA || 'Team A',
      teamB: teamB || 'Team B',
      callingTeam: callingTeamName,
      calledSide,
      coinResult: 'Toss Delayed',
      winner: 'Match Officials (Delayed)',
      decision: 'pending',
      venue,
      overs: Math.max(5, (overs || 20) - 2),
      outcomeType: 'delayed',
      specialReason: delayReason
    }, ...prev.slice(0, 9)]);
  };

  // Explicit Trigger: Toss Reroll (Void / MCC Law 13.4 edge landing)
  const handleTriggerTossReroll = (reason?: string) => {
    const rerollReason = reason || 'Vertical Edge Landing on Soft Pitch (MCC Law 13.4)';
    setTossSpecialReason(rerollReason);
    setCoinResult('Toss Reroll');
    setTossWinner('Void (MCC Law 13.4)');
    setTossState('reroll');
    const extraSpins = 6 * 360;
    setCoinRotation({ x: extraSpins + 90, y: 0 });
    playCoinLandSound();
    playUmpireWhistle();

    const callingTeamName = callingTeam === 'teamA' ? teamA : teamB;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    setHistory(prev => [{
      id: 'toss-' + Date.now(),
      timestamp: `${dateStr}, ${timeStr}`,
      teamA: teamA || 'Team A',
      teamB: teamB || 'Team B',
      callingTeam: callingTeamName,
      calledSide,
      coinResult: 'Toss Reroll',
      winner: 'Void (MCC Law 13.4)',
      decision: 'retoss',
      venue,
      overs,
      outcomeType: 'reroll',
      specialReason: rerollReason
    }, ...prev.slice(0, 9)]);
  };

  // Explicit Trigger: Umpire Discretion (Arbiter Award / Visiting team choice)
  const handleTriggerUmpireDiscretion = (winnerTeam?: string, chosen?: 'bat' | 'bowl') => {
    const selectedWinner = winnerTeam || (callingTeam === 'teamA' ? teamB : teamA);
    const selectedCaptain = selectedWinner === teamA ? teamACaptain : teamBCaptain;
    const selectedChoice = chosen || 'bat';
    const discretionReason = 'MCC Arbiter Award (Visiting Team Option / Playing Condition)';

    setTossSpecialReason(discretionReason);
    setCoinResult('Umpire Discretion');
    setTossWinner(selectedWinner);
    setTossWinnerCaptain(selectedCaptain);
    setDecision(selectedChoice);
    setTossState('umpire_discretion');
    playUmpireWhistle();
    playStadiumRoar();
    playCheerFanfare();

    const callingTeamName = callingTeam === 'teamA' ? teamA : teamB;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const discretionRecord: TossHistoryItem = {
      id: 'toss-' + Date.now(),
      timestamp: `${dateStr}, ${timeStr}`,
      teamA: teamA || 'Team A',
      teamB: teamB || 'Team B',
      callingTeam: callingTeamName,
      calledSide,
      coinResult: 'Umpire Discretion',
      winner: selectedWinner,
      decision: selectedChoice,
      venue,
      overs,
      outcomeType: 'discretion',
      specialReason: discretionReason
    };

    setHistory(prev => {
      const updated = [discretionRecord, ...prev.slice(0, 9)];
      try {
        localStorage.setItem('cricket_toss_history', JSON.stringify(updated));
        localStorage.setItem('gully_last_toss_data', JSON.stringify({
          teamA: teamA || 'Team A',
          teamB: teamB || 'Team B',
          teamACaptain,
          teamBCaptain,
          overs,
          venue,
          tossWinner: selectedWinner,
          tossChoice: selectedChoice,
          coinResult: 'Umpire Discretion',
          timestamp: `${dateStr}, ${timeStr}`,
          id: discretionRecord.id
        }));
      } catch (e) {}
      return updated;
    });
  };

  // Simulate any possibility of toss
  const handleSimulatePossibility = (
    scenario: 1 | 2 | 3 | 4 | 5 | 6 | 7
  ) => {
    if (tossState === 'spinning') return;

    // Reset previous decision
    setDecision(null);

    const callingTeamName = callingTeam === 'teamA' ? teamA : teamB;
    const otherTeamName = callingTeam === 'teamA' ? teamB : teamA;
    const callingCaptain = callingTeam === 'teamA' ? teamACaptain : teamBCaptain;
    const otherCaptain = callingTeam === 'teamA' ? teamBCaptain : teamACaptain;

    if (scenario === 1) {
      // Scenario 1: Caller calls HEADS, lands HEADS -> Caller wins
      setCalledSide('heads');
      setCoinResult('heads');
      setTossSpecialReason('Heads Landed Fair');
      setTossState('spinning');
      playCoinFlickSound();
      const extraSpins = 6 * 360;
      setCoinRotation({ x: extraSpins, y: 0 });
      setTimeout(() => {
        setTossState('landed');
        setTossWinner(callingTeamName);
        setTossWinnerCaptain(callingCaptain);
        playCoinLandSound();
        playUmpireWhistle();
        playStadiumRoar();
        playCheerFanfare();
      }, 2200);
      return;
    }

    if (scenario === 2) {
      // Scenario 2: Caller calls HEADS, lands TAILS -> Opponent wins
      setCalledSide('heads');
      setCoinResult('tails');
      setTossSpecialReason('Tails Landed Fair');
      setTossState('spinning');
      playCoinFlickSound();
      const extraSpins = 6 * 360;
      setCoinRotation({ x: extraSpins + 180, y: 0 });
      setTimeout(() => {
        setTossState('landed');
        setTossWinner(otherTeamName);
        setTossWinnerCaptain(otherCaptain);
        playCoinLandSound();
        playUmpireWhistle();
        playStadiumRoar();
        playCheerFanfare();
      }, 2200);
      return;
    }

    if (scenario === 3) {
      // Scenario 3: Caller calls TAILS, lands TAILS -> Caller wins
      setCalledSide('tails');
      setCoinResult('tails');
      setTossSpecialReason('Tails Landed Fair');
      setTossState('spinning');
      playCoinFlickSound();
      const extraSpins = 6 * 360;
      setCoinRotation({ x: extraSpins + 180, y: 0 });
      setTimeout(() => {
        setTossState('landed');
        setTossWinner(callingTeamName);
        setTossWinnerCaptain(callingCaptain);
        playCoinLandSound();
        playUmpireWhistle();
        playStadiumRoar();
        playCheerFanfare();
      }, 2200);
      return;
    }

    if (scenario === 4) {
      // Scenario 4: Caller calls TAILS, lands HEADS -> Opponent wins
      setCalledSide('tails');
      setCoinResult('heads');
      setTossSpecialReason('Heads Landed Fair');
      setTossState('spinning');
      playCoinFlickSound();
      const extraSpins = 6 * 360;
      setCoinRotation({ x: extraSpins, y: 0 });
      setTimeout(() => {
        setTossState('landed');
        setTossWinner(otherTeamName);
        setTossWinnerCaptain(otherCaptain);
        playCoinLandSound();
        playUmpireWhistle();
        playStadiumRoar();
        playCheerFanfare();
      }, 2200);
      return;
    }

    if (scenario === 5) {
      // Scenario 5: MCC Law 13.4 Edge Landing (Re-Toss / Reroll)
      handleTriggerTossReroll('Vertical Rim Landing in Turf (MCC Law 13.4)');
      return;
    }

    if (scenario === 6) {
      // Scenario 6: Delayed Toss due to Weather / Damp Pitch
      handleTriggerTossDelayed('Unfit Ground & Damp Turf (Law 13 Inspection)');
      return;
    }

    if (scenario === 7) {
      // Scenario 7: Uncontested Away Captain Option / Umpire Discretion
      handleTriggerUmpireDiscretion(otherTeamName, 'bowl');
      return;
    }
  };

  // Decision Handler (Bat or Bowl)
  const handleMakeDecision = (chosen: 'bat' | 'bowl') => {
    setDecision(chosen);
    setTossState('decided');
    playUmpireWhistle();
    playStadiumRoar();
    playCheerFanfare();

    // Record to history
    const callingTeamName = callingTeam === 'teamA' ? teamA : teamB;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const newRecord: TossHistoryItem = {
      id: 'toss-' + Date.now(),
      timestamp: `${dateStr}, ${timeStr}`,
      teamA: teamA || 'Team A',
      teamB: teamB || 'Team B',
      callingTeam: callingTeamName,
      calledSide,
      coinResult: coinResult || 'heads',
      winner: tossWinner || teamA,
      decision: chosen,
      venue,
      overs,
      outcomeType: coinResult.includes('Discretion') ? 'discretion' : coinResult.includes('Delayed') ? 'delayed' : coinResult.includes('Reroll') ? 'reroll' : 'standard',
      specialReason: tossSpecialReason || `${coinResult.toUpperCase()} Landed Fair`
    };

    setHistory(prev => {
      const updated = [newRecord, ...prev.slice(0, 9)];
      try {
        localStorage.setItem('cricket_toss_history', JSON.stringify(updated));
        localStorage.setItem('gully_last_toss_data', JSON.stringify({
          teamA: teamA || 'Team A',
          teamB: teamB || 'Team B',
          teamACaptain,
          teamBCaptain,
          overs,
          venue,
          tossWinner: tossWinner || teamA,
          tossChoice: chosen,
          coinResult: coinResult || 'heads',
          timestamp: `${dateStr}, ${timeStr}`,
          id: newRecord.id
        }));
      } catch (e) {}
      return updated;
    });
  };

  // Launch GullyScore: Local Cricket Match Scoreboard with Toss State
  const handleLaunchScoreboard = (autoStart: boolean, customRecord?: TossHistoryItem) => {
    const targetTeamA = customRecord ? customRecord.teamA : teamA;
    const targetTeamB = customRecord ? customRecord.teamB : teamB;
    const targetOvers = customRecord ? (customRecord.overs || 20) : overs;
    const targetWinner = customRecord ? customRecord.winner : (tossWinner || targetTeamA);
    const targetChoice = customRecord ? (customRecord.decision === 'bowl' ? 'bowl' : 'bat') : (decision || 'bat');
    const targetVenue = customRecord ? (customRecord.venue || venue) : venue;
    const tossId = customRecord ? customRecord.id : `toss-${Date.now()}`;

    // Persist as last active toss for scoreboard to pick up
    try {
      localStorage.setItem('gully_last_toss_data', JSON.stringify({
        teamA: targetTeamA,
        teamB: targetTeamB,
        overs: targetOvers,
        venue: targetVenue,
        tossWinner: targetWinner,
        tossChoice: targetChoice,
        coinResult: customRecord?.coinResult || coinResult,
        timestamp: customRecord?.timestamp || new Date().toLocaleString(),
        id: tossId
      }));
    } catch (e) {}

    const params = new URLSearchParams({
      teamA: targetTeamA,
      teamB: targetTeamB,
      overs: String(targetOvers),
      tossWinner: targetWinner,
      tossChoice: targetChoice,
      venue: targetVenue,
      tossId,
      autoStart: autoStart ? 'true' : 'false'
    });

    navigate(`/live/cricket-scoreboard?${params.toString()}`);
  };

  // Reset Toss
  const handleReset = () => {
    setTossState('idle');
    setDecision(null);
    setCoinRotation({ x: 0, y: 0 });
  };

  // Apply Preset
  const handleApplyPreset = (preset: typeof PRESET_MATCHES[0]) => {
    setTeamA(preset.teamA);
    setTeamACaptain(preset.teamACaptain);
    setTeamB(preset.teamB);
    setTeamBCaptain(preset.teamBCaptain);
    setVenue(preset.venue);
    setOvers(preset.overs);
    setShowPresets(false);
    handleReset();
  };

  // Summary Text Builder
  const getSummaryText = () => {
    const outcomeLabel = coinResult === 'heads' ? 'HEADS (छाप) 🦁' : 'TAILS (काटा) 🏆';

    return `🏏 *GULLYSCORE MATCH TOSS REPORT* 🪙\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚔️ *Match*: ${teamA} vs ${teamB}\n` +
      `🏟️ *Venue*: ${venue} (${overs} Overs)\n` +
      `🪙 *Toss Result*: ${outcomeLabel}\n` +
      `🏆 *Toss Winner*: ${tossWinner} (Capt. ${tossWinnerCaptain})\n` +
      `📢 *Official Decision*: Elected to *${decision?.toUpperCase()}* first\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏏 *1st Innings*: ${battingFirstTeam} to Bat\n` +
      `⚾ *1st Innings*: ${bowlingFirstTeam} to Bowl\n` +
      `⚡ Verified by ICC Standard Digital Toss Suite\n` +
      `https://gullyscore.cricket/toss`;
  };

  // Copy Summary
  const handleCopySummary = () => {
    if (!tossWinner || !decision) return;
    navigator.clipboard.writeText(getSummaryText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    const text = getSummaryText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${teamA} vs ${teamB} Toss Result`,
          text: text
        });
      } catch {
        handleCopySummary();
      }
    } else {
      handleCopySummary();
    }
  };

  // Batting / Bowling First Teams
  const battingFirstTeam = decision === 'bat' 
    ? tossWinner 
    : (tossWinner === teamA ? teamB : teamA);

  const bowlingFirstTeam = decision === 'bowl' 
    ? tossWinner 
    : (tossWinner === teamA ? teamB : teamA);

  // Weather theme styling classes
  const isLight = weatherTheme === 'sunny';
  const isOvercast = weatherTheme === 'overcast';

  const themeBg = isLight 
    ? 'bg-[#ecfdf5] text-stone-900' 
    : isOvercast
    ? 'bg-[#0f1f18] text-stone-100'
    : 'bg-[#07190f] text-white';

  const cardBg = isLight
    ? 'bg-white/90 border-emerald-300 shadow-md text-stone-900'
    : isOvercast
    ? 'bg-[#152a21]/90 border-emerald-700/60 shadow-xl text-stone-100'
    : 'bg-[#0a2718]/80 border-emerald-800/60 shadow-xl text-white';

  const headerBg = isLight
    ? 'bg-emerald-800 text-white border-b border-emerald-900'
    : 'bg-[#092215]/95 text-white border-b border-emerald-800/40';

  return (
    <div className={`min-h-screen ${themeBg} flex flex-col selection:bg-amber-500 selection:text-stone-950 relative overflow-x-hidden transition-colors duration-500`}>
      
      {/* Dynamic Stadium Sky & Light Flares */}
      {weatherTheme === 'floodlight' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/50 via-[#07190f] to-[#040e08] pointer-events-none" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {weatherTheme === 'sunny' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/60 via-emerald-50/40 to-[#dcfce7] pointer-events-none" />
          <div className="absolute top-0 right-10 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {weatherTheme === 'overcast' && (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/40 via-[#0f1f18] to-[#08120d] pointer-events-none" />
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Turf Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Broadcast Ticker Bar (Top Live Alert) */}
      <div className="bg-stone-950 text-emerald-400 text-[11px] font-mono px-4 py-1 flex items-center justify-between border-b border-emerald-900/60 z-50">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="flex items-center gap-1 text-red-500 font-black animate-pulse uppercase">
            <Radio size={12} /> LIVE BROADCAST
          </span>
          <span className="text-stone-500">|</span>
          <span className="text-stone-300 truncate">
            {venue} • Match #{overs} Overs • Official Toss Window Open
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-stone-400">
          <span>Speed: 30FPS 3D</span>
          <span>Dew: Low (18%)</span>
          <span className="text-amber-400 font-bold">ICC Certified</span>
        </div>
      </div>

      {/* Main Top Navigation Bar */}
      <header className={`sticky top-0 z-40 ${headerBg} backdrop-blur-md px-4 sm:px-8 py-3 shadow-lg transition-colors`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          
          <div className="flex items-center gap-3">
            <Link 
              to="/projects"
              className="p-2 rounded-xl bg-black/20 hover:bg-black/40 border border-white/20 transition-all flex items-center gap-1.5 text-xs font-bold text-white"
              title="Back to Portfolio Projects"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{t.portfolio}</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-stone-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20 text-lg">
                {coinType === 'cricket_ball' ? '⚾' : coinType === 'bat_ball' ? '🏏' : '🪙'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                    {t.title}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black uppercase tracking-wider">
                    PRO BROADCAST
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200/90 font-medium truncate max-w-[240px] sm:max-w-md">
                  {t.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Weather, Coin Style, Language, Audio, Reset */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Weather / Day-Night Mode Selector */}
            <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/20 text-xs">
              <button
                onClick={() => setWeatherTheme('floodlight')}
                className={`p-1.5 rounded-lg transition-all ${weatherTheme === 'floodlight' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'}`}
                title={t.weatherNight}
              >
                <Moon size={14} />
              </button>
              <button
                onClick={() => setWeatherTheme('sunny')}
                className={`p-1.5 rounded-lg transition-all ${weatherTheme === 'sunny' ? 'bg-amber-400 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white'}`}
                title={t.weatherDay}
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => setWeatherTheme('overcast')}
                className={`p-1.5 rounded-lg transition-all ${weatherTheme === 'overcast' ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-300 hover:text-white'}`}
                title={t.weatherOvercast}
              >
                <CloudSun size={14} />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/20 text-xs font-bold">
              {(['en', 'hi', 'mr'] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-lg uppercase text-[11px] transition-all ${
                    lang === l ? 'bg-amber-400 text-stone-950 font-black' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Crowd Sound Toggle */}
            <button
              onClick={toggleCrowdAmbience}
              className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1 ${
                crowdAudioEnabled 
                  ? 'bg-amber-400 border-amber-300 text-stone-950 shadow-sm' 
                  : 'bg-black/25 border-white/20 text-stone-300'
              }`}
              title={crowdAudioEnabled ? t.crowdOn : t.crowdOff}
            >
              <Users size={14} />
              <span className="hidden md:inline">{crowdAudioEnabled ? 'Crowd ON' : 'Crowd'}</span>
            </button>

            {/* Sound FX Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1 ${
                soundEnabled 
                  ? 'bg-emerald-600 border-emerald-400 text-white' 
                  : 'bg-black/25 border-white/20 text-stone-300'
              }`}
              title={soundEnabled ? t.sfxOn : t.sfxOff}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Whistle Test Button */}
            <button
              onClick={playUmpireWhistle}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-400 hover:text-stone-950 border border-amber-400/40 text-amber-300 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Test Umpire Pea Whistle (Web Audio API)"
            >
              <Megaphone size={13} />
              <span className="hidden lg:inline">{t.whistle}</span>
            </button>

            {/* Stadium Roar Test Button */}
            <button
              onClick={playStadiumRoar}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-400 hover:text-stone-950 border border-emerald-400/40 text-emerald-300 transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Test Stadium Roar (Web Audio API)"
            >
              <Flame size={13} />
              <span className="hidden lg:inline">{t.stadiumRoar}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-black/25 hover:bg-black/40 border border-white/20 text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              title={t.reset}
            >
              <RotateCcw size={14} />
            </button>

            {/* Live Scoreboard Link */}
            <Link
              to="/live/cricket-scoreboard"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <span>{t.scoreboard}</span>
              <ExternalLink size={13} />
            </Link>

          </div>

        </div>
      </header>

      {/* Main App Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6 relative z-10">
        
        {/* Connected to Scoreboard Notice Banner */}
        {fromScoreboard && (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-amber-500/20 border border-emerald-500/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏏</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-emerald-300 uppercase tracking-wider text-[11px]">
                    {t.scoreboardConnected || 'Scoreboard Connected'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-stone-950 font-black text-[9px] uppercase tracking-wider animate-pulse">
                    Live Session Active
                  </span>
                </div>
                <p className="text-stone-300 text-[11px] mt-0.5">
                  Conducting toss for <strong className="text-white">{teamA}</strong> vs <strong className="text-white">{teamB}</strong> ({overs} Overs). The result will automatically synchronize into your live match!
                </p>
              </div>
            </div>
            <Link
              to="/live/cricket-scoreboard"
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1 shrink-0 self-start sm:self-center"
            >
              <ArrowLeft size={13} />
              <span>Back to Scoreboard</span>
            </Link>
          </div>
        )}

        {/* Match Preset & Coin Selector Strip */}
        <div className={`${cardBg} rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3`}>
          
          <div className="flex items-center gap-2 text-xs font-bold">
            <Flame size={16} className="text-amber-500 animate-pulse" />
            <span className={isLight ? 'text-emerald-900' : 'text-emerald-300'}>{t.quickPresets}:</span>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-black transition-all cursor-pointer"
            >
              {showPresets ? 'Close Presets ▴' : 'Choose Team Rivalry ▾'}
            </button>
          </div>

          {/* Coin Style Switcher (ICC Gold / Indian ₹10 / Ashes Silver) */}
          <div className="flex items-center gap-1 bg-black/10 dark:bg-black/30 p-1 rounded-xl border border-emerald-700/40 text-xs">
            <button
              onClick={() => { setCoinType('icc_gold'); handleReset(); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[11px] cursor-pointer ${
                coinType === 'icc_gold' 
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>🪙 {t.coinGold}</span>
            </button>

            <button
              onClick={() => { setCoinType('rupee_coin'); handleReset(); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[11px] cursor-pointer ${
                coinType === 'rupee_coin' 
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>🇮🇳 {t.coinRupee}</span>
            </button>

            <button
              onClick={() => { setCoinType('ashes_silver'); handleReset(); }}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[11px] cursor-pointer ${
                coinType === 'ashes_silver' 
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs' 
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>⚔️ {t.coinSilver}</span>
            </button>
          </div>

          {/* Presets Grid */}
          {showPresets && (
            <div className="w-full pt-3 border-t border-emerald-800/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {PRESET_MATCHES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-2.5 rounded-xl bg-black/15 dark:bg-black/40 hover:bg-amber-500/10 border border-emerald-800/60 text-left transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    {preset.teamA} vs {preset.teamB}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate">
                    Captains: {preset.teamACaptain} & {preset.teamBCaptain}
                  </div>
                  <div className="text-[9px] text-emerald-400">
                    {preset.venue} • {preset.overs} Overs
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 1. MATCH SETUP & CALLING SELECTION */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Team A Card */}
          <div className={`lg:col-span-4 rounded-3xl p-5 border transition-all ${
            callingTeam === 'teamA' 
              ? 'bg-gradient-to-b from-emerald-950/90 to-[#0a2718] border-amber-400 shadow-lg shadow-amber-500/10' 
              : cardBg
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-300 text-[10px] font-black uppercase tracking-wider">
                {t.team1Label}
              </span>
              <button
                onClick={() => setCallingTeam('teamA')}
                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  callingTeam === 'teamA' 
                    ? 'bg-amber-400 text-stone-950 font-black' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {callingTeam === 'teamA' ? t.callingCoin : t.selectToCall}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  {t.teamAName}
                </label>
                <input
                  type="text"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  placeholder="e.g. Mumbai Indians"
                  className="w-full bg-black/30 border border-emerald-700/60 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  {t.captain}
                </label>
                <input
                  type="text"
                  value={teamACaptain}
                  onChange={(e) => setTeamACaptain(e.target.value)}
                  placeholder="e.g. Hardik Pandya"
                  className="w-full bg-black/30 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Central Match & Calling Selector */}
          <div className={`lg:col-span-4 rounded-3xl p-5 ${cardBg} flex flex-col justify-between space-y-4`}>
            
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                {t.protocol}
              </span>
              <h3 className="text-sm font-black text-white mt-2">
                {callingTeam === 'teamA' ? teamA : teamB} {t.callsTheToss}
              </h3>
              <p className="text-[11px] text-stone-400">
                Captain: <strong className="text-stone-200">{callingTeam === 'teamA' ? teamACaptain : teamBCaptain}</strong>
              </p>
            </div>

            {/* Calling Options: Heads or Tails (No bat or ball) */}
            <div className="bg-black/30 p-2.5 rounded-2xl border border-emerald-900/60">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block text-center mb-1.5">
                {t.callingChoice}
              </label>
              <div className="grid grid-cols-2 gap-2">
                
                {/* Option 1: HEADS */}
                <button
                  onClick={() => setCalledSide('heads')}
                  disabled={tossState === 'spinning'}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    calledSide === 'heads'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-md shadow-amber-500/20 scale-102'
                      : 'bg-black/20 hover:bg-black/40 text-stone-300 border border-emerald-800/40'
                  }`}
                >
                  <span className="text-base">🦁</span>
                  <span>{t.heads}</span>
                </button>

                {/* Option 2: TAILS */}
                <button
                  onClick={() => setCalledSide('tails')}
                  disabled={tossState === 'spinning'}
                  className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    calledSide === 'tails'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-md shadow-amber-500/20 scale-102'
                      : 'bg-black/20 hover:bg-black/40 text-stone-300 border border-emerald-800/40'
                  }`}
                >
                  <span className="text-base">🏆</span>
                  <span>{t.tails}</span>
                </button>
              </div>
            </div>

            {/* Venue & Overs */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 font-bold block">{t.venue}</span>
                <input 
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-black/30 border border-emerald-800/60 rounded-lg px-2 py-1 text-[11px] text-stone-200"
                />
              </div>
              <div>
                <span className="text-[10px] text-stone-400 font-bold block">{t.overs}</span>
                <select
                  value={overs}
                  onChange={(e) => setOvers(Number(e.target.value))}
                  className="w-full bg-black/30 border border-emerald-800/60 rounded-lg px-2 py-1 text-[11px] text-stone-200"
                >
                  <option value={5}>5 Overs (Blitz)</option>
                  <option value={10}>10 Overs (Gully)</option>
                  <option value={12}>12 Overs (Local Cup)</option>
                  <option value={20}>20 Overs (T20)</option>
                  <option value={50}>50 Overs (ODI)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Team B Card */}
          <div className={`lg:col-span-4 rounded-3xl p-5 border transition-all ${
            callingTeam === 'teamB' 
              ? 'bg-gradient-to-b from-emerald-950/90 to-[#0a2718] border-amber-400 shadow-lg shadow-amber-500/10' 
              : cardBg
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded-full bg-yellow-600/30 border border-yellow-500/50 text-yellow-300 text-[10px] font-black uppercase tracking-wider">
                {t.team2Label}
              </span>
              <button
                onClick={() => setCallingTeam('teamB')}
                className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  callingTeam === 'teamB' 
                    ? 'bg-amber-400 text-stone-950 font-black' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {callingTeam === 'teamB' ? t.callingCoin : t.selectToCall}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  {t.teamBName}
                </label>
                <input
                  type="text"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  placeholder="e.g. Chennai Super Kings"
                  className="w-full bg-black/30 border border-emerald-700/60 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  {t.captain}
                </label>
                <input
                  type="text"
                  value={teamBCaptain}
                  onChange={(e) => setTeamBCaptain(e.target.value)}
                  placeholder="e.g. Ruturaj Gaikwad"
                  className="w-full bg-black/30 border border-emerald-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-all"
                />
              </div>
            </div>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* 2. THE 3D CRICKET PITCH ARENA WITH COIN & UMPIRE ANIMATION */}
        {/* ========================================================================= */}
        <section className="relative bg-gradient-to-b from-[#092b18] via-[#0b331d] to-[#071d10] rounded-[2.5rem] border-2 border-emerald-700/70 p-6 sm:p-10 overflow-hidden shadow-2xl">
          
          {/* Cricket Pitch Crease & Turf Line Markings */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="w-full h-full flex flex-col justify-between py-6">
              <div className="w-full h-1 bg-white/70" />
              <div className="w-2/3 mx-auto h-32 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-between px-8">
                <div className="w-4 h-12 border border-white/60 bg-amber-400/20" />
                <div className="w-4 h-12 border border-white/60 bg-amber-400/20" />
              </div>
              <div className="w-full h-1 bg-white/70" />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            
            {/* Match Header Badge */}
            <div className="mb-2 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-950/80 px-4 py-1.5 rounded-full border border-emerald-600/50 text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-inner">
                <Tv size={14} className="text-amber-400 animate-pulse" />
                <span>ICC Official Digital Coin Toss</span>
              </div>

              {/* Mobile Shake Badge */}
              <div className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                shakeTriggered 
                  ? 'bg-amber-400 text-stone-950 border-amber-300 animate-bounce' 
                  : 'bg-black/30 border-white/20 text-stone-300'
              }`}>
                <Smartphone size={13} />
                <span>{t.shakeEnabled}</span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {teamA} <span className="text-amber-400 font-light italic">vs</span> {teamB}
            </h2>

            {/* Umpire Reaction & Speech Bubble */}
            <div className="my-3 flex items-center gap-3 bg-black/40 px-4 py-2 rounded-2xl border border-emerald-700/60 max-w-lg">
              
              {/* Umpire SVG Avatar with Gesture Animations */}
              <motion.div 
                animate={
                  tossState === 'spinning'
                    ? { y: [-2, 2, -2], rotate: [-2, 2, -2] }
                    : tossState === 'landed'
                    ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }
                    : tossState === 'decided'
                    ? { scale: [1, 1.2, 1], y: [0, -6, 0] }
                    : { y: 0 }
                }
                transition={{ repeat: tossState === 'spinning' ? Infinity : 0, duration: 0.8 }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 flex items-center justify-center font-black text-2xl shadow-md shrink-0"
              >
                {tossState === 'decided' ? (decision === 'bat' ? '🏏' : '⚾') : tossState === 'landed' ? '☝️' : '👨‍⚖️'}
              </motion.div>

              <div className="text-left">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-amber-400">
                  <span>{t.umpireVoice}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-xs font-bold text-white mt-0.5">
                  {tossState === 'idle' && `“Captain ${callingTeam === 'teamA' ? teamACaptain : teamBCaptain}, call in the air please!”`}
                  {tossState === 'spinning' && `“Coin is spinning high in the air... watch closely!”`}
                  {tossState === 'landed' && `“It is ${coinResult.toUpperCase()}! ${tossWinner} wins the toss! What is your call, Captain?”`}
                  {tossState === 'decided' && `“Official Decision: ${tossWinner} has elected to ${decision?.toUpperCase()} first!”`}
                </p>
              </div>

            </div>

            {/* ========================================================================= */}
            {/* 3D COIN ELEMENT */}
            {/* ========================================================================= */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 flex items-center justify-center perspective-[1000px]">
              
              {/* Dynamic Coin Shadow on Turf */}
              <div 
                className={`absolute bottom-3 w-48 h-8 bg-black/70 rounded-[100%] blur-md transition-all duration-700 ${
                  tossState === 'spinning' 
                    ? 'scale-40 opacity-20 translate-y-14' 
                    : 'scale-100 opacity-75 translate-y-0'
                }`} 
              />

              {/* The Rotating 3D Coin Canvas */}
              <motion.div
                animate={
                  tossState === 'spinning'
                    ? {
                        y: [-20, -180, -200, -120, -20, 0],
                        rotateX: [0, 720, 1440, 1800, coinRotation.x],
                        rotateY: [0, 180, 360, 540, coinRotation.y],
                        scale: [1, 1.15, 1.25, 1.1, 0.95, 1]
                      }
                    : tossState === 'edge_landed'
                    ? {
                        y: 0,
                        rotateX: 90,
                        rotateY: 0,
                        scale: 1
                      }
                    : {
                        y: 0,
                        rotateX: coinResult === 'heads' ? 0 : 180,
                        rotateY: 0,
                        scale: 1
                      }
                }
                transition={
                  tossState === 'spinning'
                    ? {
                        duration: 2.8,
                        ease: [0.25, 0.1, 0.25, 1],
                        times: [0, 0.3, 0.5, 0.75, 0.9, 1]
                      }
                    : { duration: 0.5 }
                }
                style={{
                  transformStyle: 'preserve-3d'
                }}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-pointer relative select-none shadow-2xl"
                onClick={handleFlipCoin}
              >
                
                {/* ---------------------------------------------------------------- */}
                {/* FACE 1: HEADS (LION / ASHOKA / ROYAL CROWN) */}
                {/* ---------------------------------------------------------------- */}
                <div 
                  className={`absolute inset-0 rounded-full border-[6px] shadow-inner flex flex-col items-center justify-center text-stone-950 p-4 ${
                    coinType === 'ashes_silver'
                      ? 'border-slate-300 bg-gradient-to-tr from-slate-400 via-stone-100 to-slate-300 text-stone-900'
                      : coinType === 'rupee_coin'
                      ? 'border-amber-400 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-300 text-stone-950'
                      : 'border-amber-300/90 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 text-stone-950'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(0deg)'
                  }}
                >
                  <div className="w-full h-full rounded-full border-2 border-dashed border-black/30 flex flex-col items-center justify-center relative overflow-hidden text-center">
                    
                    {/* Metallic Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none" />

                    {coinType === 'ashes_silver' ? (
                      <>
                        <span className="text-3xl sm:text-4xl mb-0.5 drop-shadow">👑</span>
                        <span className="font-black text-2xl sm:text-3xl tracking-widest font-serif text-slate-900">
                          HEADS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                          ★ छाप • HEADS ★
                        </span>
                        <span className="text-[8px] font-bold text-slate-700 mt-1">
                          MCC LORDS CRICKET
                        </span>
                      </>
                    ) : coinType === 'rupee_coin' ? (
                      <>
                        <span className="text-3xl sm:text-4xl mb-0.5 drop-shadow">🏛️</span>
                        <span className="font-black text-2xl sm:text-3xl tracking-widest font-serif text-stone-950">
                          HEADS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">
                          ★ छाप • HEADS ★
                        </span>
                        <span className="text-[8px] font-bold text-amber-950/80 mt-1">
                          भारत • INDIA • 2026
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl mb-0.5 drop-shadow">🦁</span>
                        <span className="font-black text-2xl sm:text-3xl tracking-widest font-serif text-stone-950">
                          HEADS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-800">
                          ★ छाप • HEADS ★
                        </span>
                        <span className="text-[8px] font-bold text-stone-800/80 mt-1">
                          ICC OFFICIAL MATCH COIN
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* ---------------------------------------------------------------- */}
                {/* FACE 2: TAILS (TROPHY / RUPEE / ASHES URN) */}
                {/* ---------------------------------------------------------------- */}
                <div 
                  className={`absolute inset-0 rounded-full border-[6px] shadow-inner flex flex-col items-center justify-center text-stone-950 p-4 ${
                    coinType === 'ashes_silver'
                      ? 'border-slate-300 bg-gradient-to-tr from-slate-400 via-stone-100 to-slate-300 text-stone-900'
                      : coinType === 'rupee_coin'
                      ? 'border-amber-400 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-300 text-stone-950'
                      : 'border-amber-300/90 bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 text-stone-950'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateX(180deg)'
                  }}
                >
                  <div className="w-full h-full rounded-full border-2 border-dashed border-black/30 flex flex-col items-center justify-center relative overflow-hidden text-center">
                    
                    {/* Metallic Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none" />

                    {coinType === 'ashes_silver' ? (
                      <>
                        <span className="text-3xl sm:text-4xl mb-0.5 drop-shadow">🏺</span>
                        <span className="font-black text-2xl sm:text-3xl tracking-widest font-serif text-slate-900">
                          TAILS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800">
                          ★ काटा • TAILS ★
                        </span>
                        <span className="text-[8px] font-bold text-slate-700 mt-1">
                          THE ASHES URN
                        </span>
                      </>
                    ) : coinType === 'rupee_coin' ? (
                      <>
                        <div className="text-2xl sm:text-3xl font-black text-amber-950 drop-shadow flex items-center justify-center gap-0.5">
                          <span>₹</span><span>10</span>
                        </div>
                        <span className="font-black text-2xl sm:text-3xl tracking-widest font-serif text-stone-950">
                          TAILS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-950">
                          ★ काटा • TAILS ★
                        </span>
                        <span className="text-[8px] font-bold text-amber-950/80 mt-1">
                          सत्यमेव जयते • RESERVE
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl mb-0.5 drop-shadow">🏆</span>
                        <span className="font-black text-2xl sm:text-3xl tracking-widest font-serif text-stone-950">
                          TAILS
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-stone-800">
                          ★ काटा • TAILS ★
                        </span>
                        <span className="text-[8px] font-bold text-stone-800/80 mt-1">
                          FAIR PLAY ARBITER 2026
                        </span>
                      </>
                    )}
                  </div>
                </div>

              </motion.div>

            </div>

            {/* Edge Landed Alert Banner (MCC Law 13.4 Re-Toss) */}
            {tossState === 'edge_landed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-400 text-center max-w-lg shadow-2xl backdrop-blur-md"
              >
                <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-sm uppercase tracking-wider mb-1">
                  <AlertTriangle size={18} className="text-amber-400 animate-bounce" />
                  <span>{t.edgeLandedAlert}</span>
                </div>
                <p className="text-xs text-stone-200 mb-3 font-medium">
                  {t.edgeLandedDesc}
                </p>
                <button
                  onClick={handleFlipCoin}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <RefreshCw size={14} className="animate-spin" />
                  <span>{t.reTossBtn}</span>
                </button>
              </motion.div>
            )}

            {/* Weather Delay Banner */}
            {tossState === 'delayed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 p-4 rounded-2xl bg-teal-950/90 border-2 border-teal-400 text-center max-w-lg shadow-2xl backdrop-blur-md"
              >
                <div className="flex items-center justify-center gap-2 text-teal-300 font-black text-sm uppercase tracking-wider mb-1">
                  <CloudRain size={18} className="text-teal-400 animate-pulse" />
                  <span>{t.weatherDelayTitle}</span>
                </div>
                <p className="text-xs text-teal-100 mb-3 font-medium">
                  {t.weatherDelayDesc}
                </p>
                <div className="flex items-center justify-center gap-2 mb-3 text-xs">
                  <span className="text-teal-300 font-bold">Revised Overs:</span>
                  {[20, 15, 12, 10, 5].map((ov) => (
                    <button
                      key={ov}
                      onClick={() => setOvers(ov)}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        overs === ov ? 'bg-amber-400 text-stone-950' : 'bg-teal-900/60 text-teal-200 hover:bg-teal-800'
                      }`}
                    >
                      {ov} Ov
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleFlipCoin}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-300 hover:from-teal-300 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <Play size={14} />
                  <span>{t.resumeTossBtn}</span>
                </button>
              </motion.div>
            )}

            {/* Toss Trigger Button & Shake Prompt */}
            <div className="mt-2 space-y-2 flex flex-col items-center">
              
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={handleFlipCoin}
                  disabled={tossState === 'spinning'}
                  className={`px-8 py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center gap-3 shadow-xl transition-all ${
                    tossState === 'spinning'
                      ? 'bg-stone-700 text-stone-400 cursor-not-allowed scale-98'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 shadow-amber-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                  }`}
                >
                  <span className="text-xl">🪙</span>
                  <span>
                    {tossState === 'spinning' 
                      ? t.coinInAir 
                      : tossState === 'landed' || tossState === 'decided'
                      ? t.flipAgain
                      : t.spinCoin}
                  </span>
                  <Sparkles size={18} />
                </button>

                {/* Shake Test Button (for desktop or quick gesture) */}
                <button
                  onClick={() => {
                    setShakeTriggered(true);
                    setTimeout(() => setShakeTriggered(false), 800);
                    handleFlipCoin();
                  }}
                  disabled={tossState === 'spinning'}
                  className="px-4 py-4 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/20 text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Simulate smartphone physical shake motion"
                >
                  <Smartphone size={16} className="text-amber-400" />
                  <span>{t.simulateShake}</span>
                </button>
              </div>

              <p className="text-xs text-emerald-300/90 font-medium">
                Calling: <strong className="text-amber-300">{callingTeam === 'teamA' ? teamA : teamB}</strong> predicted <strong className="text-white uppercase">{calledSide}</strong> • Mobile shake gesture enabled!
              </p>

              {/* Quick Official MCC Law 13 Toss Protocol Triggers */}
              <div className="flex items-center gap-2 flex-wrap justify-center pt-2 border-t border-emerald-900/60 w-full max-w-xl">
                <span className="text-[11px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                  Test Possibilities:
                </span>
                
                <button
                  onClick={() => handleTriggerTossDelayed('Wet Outfield & Rain Delays Pre-Match Inspection')}
                  disabled={tossState === 'spinning'}
                  className="px-3 py-1.5 rounded-xl bg-teal-950/80 hover:bg-teal-800 border border-teal-500/50 text-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Simulate MCC / ICC Match Weather Delay"
                >
                  <CloudRain size={13} className="text-teal-400" />
                  <span>🌧️ {t.tossDelayed}</span>
                </button>

                <button
                  onClick={() => handleTriggerTossReroll('Vertical Edge Landing in Turf (MCC Law 13.4 Void)')}
                  disabled={tossState === 'spinning'}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-800 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Simulate Void Coin Toss requiring immediate Re-Roll (MCC Law 13.4)"
                >
                  <RefreshCw size={13} className="text-rose-400" />
                  <span>🔄 {t.tossReroll}</span>
                </button>

                <button
                  onClick={() => handleTriggerUmpireDiscretion(callingTeam === 'teamA' ? teamB : teamA, 'bowl')}
                  disabled={tossState === 'spinning'}
                  className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-800 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Simulate Umpire Arbiter Discretion / Visiting Team Choice Award"
                >
                  <Scale size={13} className="text-purple-400" />
                  <span>⚖️ {t.umpireDiscretion}</span>
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. TOSS RESULT & CAPTAIN DECISION (BROADCAST SCORECARD UI) */}
        {/* ========================================================================= */}
        <AnimatePresence>
          {(tossState === 'landed' || tossState === 'decided' || tossState === 'delayed' || tossState === 'reroll' || tossState === 'umpire_discretion') && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#04120a] rounded-[2.5rem] border-2 border-amber-400 p-5 sm:p-8 shadow-2xl space-y-6 text-white"
            >
              
              {/* Broadcast Top Strap */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 p-3 rounded-2xl border border-emerald-900/80">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-red-600 text-white font-mono text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                    <Radio size={12} /> {t.broadcastFeed}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                    {t.officialTossPresentation}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-emerald-300">
                  <span className="hidden sm:inline">WILLOW / STAR CRICKET HD</span>
                  <span className="text-stone-500">|</span>
                  <span className="font-bold text-white">MATCH #{overs} OVERS</span>
                  <span className="text-stone-500">|</span>
                  <span className="text-amber-400 font-bold">{new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>

              {/* SCORECARD BOX 1: PRIMARY TOSS OUTCOME SCORECARD */}
              <div className="bg-[#081f13] border-2 border-emerald-700/80 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
                
                {/* Scorecard Header Row */}
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                    <Tv size={16} />
                    <span>OFFICIAL TOSS ARBITRATION & MATCH PROTOCOL</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold border border-emerald-500/30">
                    LAW 13 COMPLIANT ✓
                  </span>
                </div>

                {/* Scorecard 3-Column Metrics Table */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Metric 1: Calling Captain & Call */}
                  <div className="p-3.5 rounded-xl bg-stone-950/80 border border-emerald-800/80">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block tracking-wider">
                      CALLING TEAM & CAPTAIN
                    </span>
                    <strong className="text-base font-black text-white block mt-1 truncate">
                      {callingTeam === 'teamA' ? teamA : teamB}
                    </strong>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-950 text-xs">
                      <span className="text-stone-400">Captain:</span>
                      <span className="font-bold text-emerald-300 truncate max-w-[140px]">
                        {callingTeam === 'teamA' ? teamACaptain : teamBCaptain}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-stone-400">Prediction:</span>
                      <span className="font-black text-amber-400 uppercase font-mono">
                        CALLED {calledSide.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Coin Landing & Verdict */}
                  <div className="p-3.5 rounded-xl bg-stone-950/80 border border-emerald-800/80">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block tracking-wider">
                      COIN LANDING & VERDICT
                    </span>
                    <div className="mt-1">
                      {tossState === 'delayed' ? (
                        <span className="text-base font-black text-teal-300 flex items-center gap-1.5">
                          🌧️ TOSS DELAYED
                        </span>
                      ) : tossState === 'reroll' ? (
                        <span className="text-base font-black text-rose-300 flex items-center gap-1.5">
                          🔄 TOSS VOID (LAW 13.4)
                        </span>
                      ) : tossState === 'umpire_discretion' ? (
                        <span className="text-base font-black text-purple-300 flex items-center gap-1.5">
                          ⚖️ ARBITER DISCRETION
                        </span>
                      ) : (
                        <span className="text-base font-black text-amber-400 flex items-center gap-1.5">
                          {coinResult === 'heads' ? '🦁 HEADS (छाप)' : '🏆 TAILS (काटा)'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-950 text-xs">
                      <span className="text-stone-400">Validation:</span>
                      <span className="font-bold text-emerald-300">
                        {tossState === 'reroll' ? 'Invalid (Re-Toss)' : tossState === 'delayed' ? 'Deferred' : 'Fair Coin Spin'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-stone-400">Official:</span>
                      <span className="font-mono text-stone-300">Match Referee</span>
                    </div>
                  </div>

                  {/* Metric 3: Match Jurisdiction & Venue */}
                  <div className="p-3.5 rounded-xl bg-stone-950/80 border border-emerald-800/80">
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block tracking-wider">
                      MATCH JURISDICTION & VENUE
                    </span>
                    <strong className="text-base font-black text-white block mt-1 truncate">
                      {venue}
                    </strong>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-950 text-xs">
                      <span className="text-stone-400">Match Overs:</span>
                      <span className="font-bold text-amber-400 font-mono">{overs} Overs</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-stone-400">Weather:</span>
                      <span className="font-mono text-stone-300 capitalize">{weatherTheme}</span>
                    </div>
                  </div>

                </div>

                {/* Big Bold Winner Scorecard Strip */}
                <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-stone-950 p-4 sm:p-5 rounded-xl shadow-lg border-2 border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center font-black text-2xl shrink-0 shadow-inner">
                      🏆
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-900 block">
                        OFFICIAL TOSS WINNER
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-stone-950">
                        {tossWinner.toUpperCase()} {t.wonToss}
                      </h3>
                      <p className="text-xs text-stone-800 font-bold mt-1">
                        Captain {tossWinnerCaptain} • {tossSpecialReason || 'Fair Coin Toss Confirmed at Pitch Presentation'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-3.5 py-1.5 rounded-lg bg-stone-950 text-amber-300 text-xs font-mono font-black tracking-wider">
                      DECISION OFFICIAL ✓
                    </span>
                  </div>
                </div>

                {/* Notice if Special Protocol triggered */}
                {tossSpecialReason && (
                  <div className="p-3 rounded-xl bg-black/50 border border-amber-400/40 text-xs flex items-center gap-2 text-amber-200 font-medium">
                    <Info size={16} className="text-amber-400 shrink-0" />
                    <span><strong>Match Arbitration Record:</strong> {tossSpecialReason}</span>
                  </div>
                )}

              </div>

              {/* SCORECARD BOX 2: CAPTAIN'S OFFICIAL ELECTION / SPECIAL PROTOCOLS */}
              {tossState === 'delayed' ? (
                <div className="p-6 rounded-2xl bg-teal-950/80 border-2 border-teal-400 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-teal-300 font-black text-base uppercase">
                    <CloudRain size={20} className="text-teal-400 animate-pulse" />
                    <span>{t.weatherDelayTitle}</span>
                  </div>
                  <p className="text-sm text-teal-100 max-w-xl mx-auto">
                    {t.weatherDelayDesc}
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
                    <span className="text-teal-300 font-bold">Select Recalculated Overs:</span>
                    {[20, 15, 12, 10, 5].map((ov) => (
                      <button
                        key={ov}
                        onClick={() => setOvers(ov)}
                        className={`px-3 py-1.5 rounded-lg font-black text-xs transition-all cursor-pointer ${
                          overs === ov ? 'bg-amber-400 text-stone-950 shadow-md' : 'bg-teal-900 text-teal-200 hover:bg-teal-800'
                        }`}
                      >
                        {ov} Overs
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleFlipCoin}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-300 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <Play size={14} />
                    <span>{t.resumeTossBtn}</span>
                  </button>
                </div>
              ) : tossState === 'reroll' ? (
                <div className="p-6 rounded-2xl bg-rose-950/80 border-2 border-rose-400 text-center space-y-4">
                  <div className="flex items-center justify-center gap-2 text-rose-300 font-black text-base uppercase">
                    <AlertTriangle size={20} className="text-rose-400 animate-bounce" />
                    <span>MCC Law 13.4 Toss Void • Vertical Edge Landing</span>
                  </div>
                  <p className="text-sm text-rose-100 max-w-xl mx-auto">
                    The coin failed to land flat on either face. Under official MCC rules, the coin toss is immediately declared null and void, requiring an immediate re-toss.
                  </p>
                  <button
                    onClick={handleFlipCoin}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-400 to-amber-300 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Execute Official Immediate Re-Toss (पुन्हा टॉस करा)</span>
                  </button>
                </div>
              ) : decision ? (
                /* Confirmed Decision Scorecard Strip */
                <div className="bg-stone-950 border-2 border-amber-400 rounded-2xl p-5 text-center shadow-lg space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                    CAPTAIN'S OFFICIAL MATCH REGISTRATION
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-white">
                    "{tossWinner.toUpperCase()} {t.wonToss} {t.choseTo} <span className="text-amber-400 underline decoration-amber-400 decoration-2 uppercase">{decision === 'bat' ? t.bat : t.ball}</span> FIRST"
                  </p>
                  <p className="text-xs text-stone-400">
                    {venue} • {overs} Overs Contest • Match Arbiter Recorded & Irreversible (MCC Law 13.3)
                  </p>
                </div>
              ) : (
                /* Decision Options Scorecard Buttons */
                <div className="space-y-3">
                  <div className="text-center">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                      ACTION REQUIRED
                    </span>
                    <h4 className="text-lg font-black text-white">
                      Captain's Call: What will <span className="text-amber-400">{tossWinner}</span> choose?
                    </h4>
                    <p className="text-xs text-emerald-300/80">
                      Click to register official election and generate live broadcast scorecard
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {/* BAT FIRST */}
                    <button
                      onClick={() => handleMakeDecision('bat')}
                      className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group cursor-pointer ${
                        decision === 'bat'
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-white text-white shadow-xl scale-102'
                          : 'bg-black/60 hover:bg-black/80 border-emerald-600 text-stone-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-3xl font-black group-hover:scale-110 transition-transform">
                        🏏
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Option 1</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">54% WIN RATE</span>
                        </div>
                        <strong className="text-lg font-black block">{t.batFirst}</strong>
                        <span className="text-[11px] text-stone-300 block">{t.batFirstDesc}</span>
                      </div>
                    </button>

                    {/* BOWL FIRST */}
                    <button
                      onClick={() => handleMakeDecision('bowl')}
                      className={`p-5 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group cursor-pointer ${
                        decision === 'bowl'
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-800 border-white text-white shadow-xl scale-102'
                          : 'bg-black/60 hover:bg-black/80 border-emerald-600 text-stone-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center text-3xl font-black group-hover:scale-110 transition-transform">
                        ⚾
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Option 2</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">46% CHASE WIN</span>
                        </div>
                        <strong className="text-lg font-black block">{t.bowlFirst}</strong>
                        <span className="text-[11px] text-stone-300 block">{t.bowlFirstDesc}</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* SCORECARD BOX 3: MATCH CONDITIONS & PITCH REPORT (4 SCORECARD METRIC BOXES) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-stone-950/90 border border-emerald-800/80 text-center">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block font-bold">MATCH FORMAT</span>
                  <strong className="text-sm font-black text-amber-400 block mt-0.5">{overs} OVERS T20</strong>
                  <span className="text-[10px] text-stone-400 font-mono">ICC Standard</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/90 border border-emerald-800/80 text-center">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block font-bold">SURFACE REPORT</span>
                  <strong className="text-sm font-black text-emerald-400 block mt-0.5">HARD BOUNCY DECK</strong>
                  <span className="text-[10px] text-stone-400 font-mono">True Carry & Pace</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/90 border border-emerald-800/80 text-center">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block font-bold">DEW FACTOR</span>
                  <strong className="text-sm font-black text-blue-400 block mt-0.5">18% (MINIMAL)</strong>
                  <span className="text-[10px] text-stone-400 font-mono">Dry Outfield</span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950/90 border border-emerald-800/80 text-center">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block font-bold">HISTORICAL TREND</span>
                  <strong className="text-sm font-black text-purple-400 block mt-0.5">54% BAT 1ST WIN</strong>
                  <span className="text-[10px] text-stone-400 font-mono">Par Score: 178/6</span>
                </div>
              </div>

              {/* SCORECARD BOX 4: MINI BROADCAST SCOREBOARD GRAPHIC */}
              {decision && (
                <div className="bg-[#05160d] border border-emerald-700/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  
                  <div className="flex items-center justify-between border-b border-emerald-900 pb-2 text-xs text-stone-400">
                    <span className="font-bold text-amber-400 uppercase tracking-wider">
                      {t.target}
                    </span>
                    <span className="font-mono text-emerald-300">REQ RR: -- | CRR: 0.00</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* 1st Innings Batting Card */}
                    <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          🏏 {t.firstInningsBat}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">0/0 (0.0)</span>
                      </div>
                      <strong className="text-base font-black text-white block mt-1">
                        {battingFirstTeam}
                      </strong>
                      <div className="text-[11px] text-stone-400 mt-2 space-y-0.5 font-mono">
                        <div className="flex justify-between">
                          <span>Opener 1* (RHB)</span>
                          <span className="text-stone-300">0 (0)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Opener 2 (LHB)</span>
                          <span className="text-stone-300">0 (0)</span>
                        </div>
                      </div>
                    </div>

                    {/* 1st Innings Bowling Card */}
                    <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          ⚾ {t.firstInningsBowl}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">0.0 Overs</span>
                      </div>
                      <strong className="text-base font-black text-white block mt-1">
                        {bowlingFirstTeam}
                      </strong>
                      <div className="text-[11px] text-stone-400 mt-2 space-y-0.5 font-mono">
                        <div className="flex justify-between">
                          <span>Opening Pacer 1</span>
                          <span className="text-stone-300">0-0-0-0</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Opening Pacer 2</span>
                          <span className="text-stone-300">0-0-0-0</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Action Bar: WhatsApp, Copy, Native Share & Launch Scoreboard */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-900/60">
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleCopySummary}
                        className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        <span>{copied ? t.copied : t.copyReport}</span>
                      </button>

                      <button
                        onClick={handleNativeShare}
                        className="px-4 py-2.5 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Share2 size={16} />
                        <span>{t.shareNative}</span>
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getSummaryText())}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md"
                      >
                        <MessageSquare size={16} />
                        <span>{t.whatsappShare}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {fromScoreboard && (
                        <button
                          onClick={() => handleLaunchScoreboard(true)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                        >
                          <Check size={16} />
                          <span>Return to Match & Start</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleLaunchScoreboard(true)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                        title="Initialize match and jump directly into live scoring"
                      >
                        <Play size={14} className="fill-stone-950" />
                        <span>{t.launchLiveMatch || 'Launch Live Match ⚡'}</span>
                        <ChevronRight size={15} />
                      </button>

                      <button
                        onClick={() => handleLaunchScoreboard(false)}
                        className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Pre-populate Match Setup screen in Scoreboard"
                      >
                        <span>{t.transferToSetup || 'Transfer to Setup 📋'}</span>
                      </button>
                    </div>

                  </div>

                </div>
              )}

            </motion.section>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* 5. ALL TOSS POSSIBILITIES & OFFICIAL RULES MATRIX */}
        {/* ========================================================================= */}
        <section className={`${cardBg} rounded-3xl p-6 sm:p-8 space-y-6 border border-emerald-800/60 shadow-xl`}>
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                <Scale size={20} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{t.allPossibilitiesTitle}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    7 SCENARIOS
                  </span>
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {t.allPossibilitiesSubtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 bg-black/40 px-3 py-1.5 rounded-xl border border-emerald-800">
              <BarChart2 size={15} />
              <span>MCC Law 13 & ICC Arbitrated</span>
            </div>
          </div>

          {/* Mathematical Probability Visualizer */}
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-800/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-300 flex items-center gap-1.5">
                <Compass size={14} className="text-amber-400" />
                <span>Fair Toss Mathematical Distribution (Per Bernoulli Trial)</span>
              </span>
              <span className="text-stone-400 font-mono text-[11px]">Independent Random Event</span>
            </div>

            {/* Distribution Bar */}
            <div className="h-4 rounded-full bg-emerald-950/80 overflow-hidden flex p-0.5 border border-emerald-700/50">
              <div className="h-full bg-amber-400 rounded-l-full relative group cursor-pointer transition-all hover:brightness-110" style={{ width: '49.4%' }} title="Heads Probability: 49.4%">
                <span className="sr-only">Heads 49.4%</span>
              </div>
              <div className="h-full bg-rose-500 relative group cursor-pointer transition-all hover:brightness-110" style={{ width: '1.2%' }} title="Edge Landing Probability: 1.2%">
                <span className="sr-only">Edge 1.2%</span>
              </div>
              <div className="h-full bg-yellow-300 rounded-r-full relative group cursor-pointer transition-all hover:brightness-110" style={{ width: '49.4%' }} title="Tails Probability: 49.4%">
                <span className="sr-only">Tails 49.4%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Heads Lands Flat: <strong>49.4%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Vertical Edge Landing: <strong>1.2%</strong> (Re-toss)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <span>Tails Lands Flat: <strong>49.4%</strong></span>
              </div>
            </div>
          </div>

          {/* Interactive Possibilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOSS_POSSIBILITIES.map((scenario) => (
              <div
                key={scenario.id}
                className="p-4 rounded-2xl bg-black/35 hover:bg-black/50 border border-emerald-800/60 hover:border-amber-400/60 transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      {scenario.law}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      {scenario.probability}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    <span>{scenario.name}</span>
                  </h4>

                  <p className="text-xs text-stone-300/90 mt-1 leading-relaxed">
                    {scenario.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-emerald-900/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">
                    {scenario.id === 'edge_landed' ? 'Immediate Retoss' : scenario.id === 'weather_delay' ? 'Overs Reduced' : 'Valid Decision'}
                  </span>
                  <button
                    onClick={() => handleSimulatePossibility(scenario.numId)}
                    className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-stone-950 text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.simulateScenario}</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Official MCC Law 13 Rule Breakdown */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/40 text-xs space-y-2 text-stone-200">
            <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
              <ShieldAlert size={16} />
              <span>Key MCC Cricket Law 13 Highlights</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-300">
              <li><strong>Law 13.1 (Timing):</strong> Toss occurs no earlier than 30 minutes and no later than 15 minutes prior to scheduled start.</li>
              <li><strong>Law 13.2 (Nomination of Players):</strong> Captains exchange nominated player sheets before toss is flipped.</li>
              <li><strong>Law 13.3 (Irreversible Decision):</strong> Once the toss winner notifies the umpire and opposing captain of Bat or Bowl, the decision cannot be altered.</li>
              <li><strong>Law 13.4 (Invalid Toss):</strong> If the coin is touched in mid-air, lands on edge, or rolls away into pitch crevices, an immediate re-toss is declared.</li>
            </ul>
          </div>

        </section>

        {/* ========================================================================= */}
        {/* 6. TOSS HISTORY & BADGE-STYLE FORM TRACKER */}
        {/* ========================================================================= */}
        <section className={`${cardBg} rounded-3xl p-5 sm:p-7 space-y-6 border border-emerald-800/60 shadow-xl`}>
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                <Clock size={20} />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{t.recentHistory}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    {history.length} LOGGED
                  </span>
                </h3>
                <p className="text-xs text-stone-300">
                  Official Match Referee toss record audit with badge indicators and team elections
                </p>
              </div>
            </div>
            
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                {t.clearHistory}
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-stone-400">
              {t.noHistory}
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* FEATURED: LAST 5 COIN TOSS RESULTS (VISUAL BADGE-STYLE TRACKER) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border-2 border-amber-400/60 shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider">
                      FORM TRACKER
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                      LAST 5 COIN TOSS RESULTS • OFFICIAL WINNER BADGES
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-800">
                    MATCH REFEREE VERIFIED ✓
                  </span>
                </div>

                {/* 5 Badge Cards Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {history.slice(0, 5).map((item, idx) => (
                    <div
                      key={`last5-${item.id}`}
                      className="rounded-xl p-3 bg-stone-950/90 border border-emerald-800/80 hover:border-amber-400 transition-all flex flex-col justify-between space-y-3 shadow-md"
                    >
                      {/* Badge Top Header: Recency & Format */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                          idx === 0 
                            ? 'bg-amber-400 text-stone-950 shadow-sm' 
                            : 'bg-stone-800 text-stone-300'
                        }`}>
                          #{idx + 1} {idx === 0 ? 'LATEST' : ''}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 font-bold">
                          {item.overs ? `${item.overs} Ov` : '20 Ov'}
                        </span>
                      </div>

                      {/* WINNING TEAM BADGE (Prominent High-Contrast Highlight) */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-stone-400 block text-center font-bold">
                          TOSS WINNER
                        </span>
                        <div className="py-2 px-2.5 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-stone-950 font-black text-xs sm:text-sm text-center shadow-sm border border-amber-300 flex items-center justify-center gap-1.5 truncate">
                          <span className="text-sm">🏆</span>
                          <span className="truncate uppercase tracking-tight">{item.winner}</span>
                        </div>
                      </div>

                      {/* Outcome & Decision Badge Stack */}
                      <div className="space-y-1.5">
                        {/* Coin Result Badge */}
                        <div className="text-center">
                          {item.outcomeType === 'delayed' || item.coinResult.toLowerCase().includes('delayed') ? (
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black uppercase tracking-wide inline-block w-full truncate">
                              🌧️ TOSS DELAYED
                            </span>
                          ) : item.outcomeType === 'reroll' || item.coinResult.toLowerCase().includes('reroll') ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wide inline-block w-full truncate">
                              🔄 TOSS RE-ROLL
                            </span>
                          ) : item.outcomeType === 'discretion' || item.coinResult.toLowerCase().includes('discretion') ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black uppercase tracking-wide inline-block w-full truncate">
                              ⚖️ ARBITER CHOICE
                            </span>
                          ) : item.coinResult.toLowerCase() === 'heads' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wide inline-block w-full truncate">
                              🦁 HEADS (छाप)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] font-black uppercase tracking-wide inline-block w-full truncate">
                              🏆 TAILS (काटा)
                            </span>
                          )}
                        </div>

                        {/* Captain Decision Badge */}
                        <div className="text-center">
                          {item.decision === 'bat' ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase inline-block w-full truncate">
                              🏏 CHOSE TO BAT
                            </span>
                          ) : item.decision === 'bowl' ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-black uppercase inline-block w-full truncate">
                              ⚾ CHOSE TO BOWL
                            </span>
                          ) : item.decision === 'retoss' ? (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase inline-block w-full truncate">
                              🔄 RE-TOSS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-stone-700 text-stone-300 border border-stone-600 text-[10px] font-bold uppercase inline-block w-full truncate">
                              ⏳ PENDING CALL
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matchup & Timestamp Badges */}
                      <div className="pt-2 border-t border-emerald-950/80 space-y-1 text-center">
                        <span className="text-[10px] font-bold text-stone-200 block truncate">
                          {item.teamA} vs {item.teamB}
                        </span>
                        <span className="text-[9px] text-stone-500 font-mono block truncate">
                          {item.timestamp}
                        </span>
                        {item.specialReason && (
                          <span className="text-[9px] text-amber-300/80 italic block truncate">
                            ℹ️ {item.specialReason}
                          </span>
                        )}
                        <button
                          onClick={() => handleLaunchScoreboard(false, item)}
                          className="w-full mt-2 py-1 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Open match in GullyScore Scoreboard"
                        >
                          <span>🏏 Score Match</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* DETAILED HISTORY LOGS (ALL RECORDS WITH BADGE-STYLE ARCHITECTURE) */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold block">
                  ALL HISTORICAL MATCH PROTOCOL LOGS
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {history.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-2xl bg-black/50 border border-emerald-800/70 hover:border-amber-400 transition-all space-y-3 shadow-sm"
                    >
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-[11px] text-stone-400 font-bold">
                          {item.timestamp}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-[10px] font-bold">
                            {item.overs ? `${item.overs} Ov` : '20 Ov'}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase font-mono">
                            {item.coinResult.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Match Teams Header */}
                      <div className="text-sm font-black text-white flex items-center justify-between">
                        <span className="truncate">{item.teamA} <span className="text-amber-400 font-normal">vs</span> {item.teamB}</span>
                        <span className="text-[11px] text-stone-400 font-medium truncate max-w-[150px]">
                          {item.venue.split(',')[0]}
                        </span>
                      </div>

                      {/* Specific Winner Badge Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-900/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-xs uppercase flex items-center gap-1 shadow-sm">
                            <span>🏆</span>
                            <span>{item.winner}</span>
                          </span>
                          <span className="text-stone-300 text-xs">
                            won toss
                          </span>
                        </div>

                        <div>
                          {item.decision === 'bat' ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase">
                              🏏 BAT FIRST
                            </span>
                          ) : item.decision === 'bowl' ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-black uppercase">
                              ⚾ BOWL FIRST
                            </span>
                          ) : item.decision === 'retoss' ? (
                            <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black uppercase">
                              🔄 RE-TOSS
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-md bg-stone-700 text-stone-300 text-[11px] font-bold uppercase">
                              ⏳ PENDING
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Special reason note if present */}
                      {item.specialReason && (
                        <div className="text-[10px] text-amber-300/80 bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-400/20">
                          ℹ️ {item.specialReason}
                        </div>
                      )}

                      {/* Scoreboard Launch Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-950/80">
                        <div className="text-[10px] text-stone-400 font-mono">
                          {item.venue || 'Local Ground'} • {item.overs || 20} Ov
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleLaunchScoreboard(true, item)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-stone-950 text-[10px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Directly start live match in GullyScore"
                          >
                            <Play size={10} className="fill-stone-950" />
                            <span>Launch Live</span>
                          </button>
                          <button
                            onClick={() => handleLaunchScoreboard(false, item)}
                            className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[10px] font-bold uppercase transition-all cursor-pointer"
                            title="Configure match setup in GullyScore"
                          >
                            <span>Setup</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </section>

      </main>

      {/* Broadcast Lower-Third Footer */}
      <footer className="mt-12 py-6 border-t border-emerald-800/40 text-center text-xs text-emerald-400/80 bg-black/50">
        <p className="font-bold">
          🏏 GullyScore Digital Toss Simulator • ICC Standard Fair Coin & Captain Decision Suite
        </p>
        <p className="text-[11px] text-stone-500 mt-1">
          Developed with 3D Web Audio, Sensor Shake Physics, and Real-Time Broadcast Scorecard Graphics
        </p>
      </footer>

    </div>
  );
};
