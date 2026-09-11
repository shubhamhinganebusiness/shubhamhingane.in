import React, { useState, useEffect } from 'react';

export type CommentaryLanguage = 'mr' | 'hi' | 'en';

export interface CommentaryTranslations {
  en?: string;
  hi?: string;
  mr?: string;
}

export interface CommentaryWithTranslations {
  id: string;
  overBall: string;
  description: string;
  type: 'wicket' | 'boundary' | 'extra' | 'milestone' | 'normal' | any;
  soundWave?: boolean;
  translations?: CommentaryTranslations;
  [key: string]: any;
}

export const COMMENTARY_LANGUAGES: { id: CommentaryLanguage; label: string; name: string; nativeName: string; flag: string }[] = [
  { id: 'mr', label: 'मराठी', name: 'Marathi', nativeName: 'मराठी', flag: '🚩' },
  { id: 'hi', label: 'हिंदी', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { id: 'en', label: 'English', name: 'English', nativeName: 'English', flag: '🌐' },
];

const STORAGE_KEY = 'gullyscore_user_commentary_lang';

export function getStoredCommentaryLanguage(): CommentaryLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mr' || saved === 'hi' || saved === 'en') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'en';
}

export function setStoredCommentaryLanguage(lang: CommentaryLanguage): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    window.dispatchEvent(new CustomEvent('gullyscore:language_changed', { detail: { language: lang } }));
  } catch {
    // ignore
  }
}

/**
 * Hook to subscribe to commentary language changes across the app
 */
export function useCommentaryLanguage(defaultLang?: CommentaryLanguage): [CommentaryLanguage, (lang: CommentaryLanguage) => void] {
  const [lang, setLang] = useState<CommentaryLanguage>(() => defaultLang || getStoredCommentaryLanguage());

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ language: CommentaryLanguage }>;
      if (customEvent.detail?.language) {
        setLang(customEvent.detail.language);
      }
    };

    window.addEventListener('gullyscore:language_changed', handleLangChange);
    return () => {
      window.removeEventListener('gullyscore:language_changed', handleLangChange);
    };
  }, []);

  const changeLanguage = (newLang: CommentaryLanguage) => {
    setLang(newLang);
    setStoredCommentaryLanguage(newLang);
  };

  return [lang, changeLanguage];
}

/**
 * Rich, authentic localized commentary phrase pools for Gully Cricket.
 * Provides fresh, unique, and colorful commentary on every ball for English, Hindi, and Marathi.
 */
export const GULLY_COMMENTARY_POOLS = {
  dots: {
    mr: [
      "{bwl} चा भेदक मारा! {bat} ला चेंडूचा अंदाज आला नाही, चेंडू थेट यष्टिरक्षकाच्या हातात. निर्धाव चेंडू!",
      "सुरेख टप्पा आणि अचूक लाईन! {bat} ने बचावात्मक पवित्रा घेत चेंडू अडवला. कोणतीही धाव नाही.",
      "अतिशय चतुर गोलंदाजी {bwl} कडून! ऑफ स्टंपबाहेर जाणारा चेंडू, फलंदाज पूर्णपणे चकवला!",
      "{bat} चा मोठा फटका मारण्याचा प्रयत्न, पण बॅट आणि चेंडूचा संपर्क नाही! निर्धाव चेंडू!",
      "कडक गोलंदाजी! {bwl} ने फलंदाजाला जखडून ठेवले आहे, गल्लीत प्रेक्षकांचा जोरदार टाळ्यांचा गजर!",
      "अप्रतिम नियंत्रण! {bat} ने हलक्या हाताने चेंडू ढकलला पण क्षेत्ररक्षक चपळ, धाव नाही.",
      "{bwl} चा उसळता चेंडू! {bat} ने शांत डोक्याने चेंडू सोडून दिला. निर्धाव!",
      "उत्कृष्ट क्षेत्ररक्षण गल्लीच्या कोपऱ्यावर! निश्चित धाव वाचवली, शून्य धाव!"
    ],
    hi: [
      "{bwl} की सटीक लाइन और लेंथ! {bat} पूरी तरह बीट हुए, गेंद सीधे कीपर के दस्तानों में. कोई रन नहीं!",
      "शानदार स्विंग और उछाल! {bat} ने रक्षात्मक तरीके से गेंद को ब्लॉक किया. डॉट बॉल!",
      "चतुर गेंदबाजी {bwl} द्वारा! ऑफ स्टंप के बाहर रखी गेंद, बल्लेबाज के पास कोई जवाब नहीं.",
      "{bat} ने बड़ा शॉट खेलने का प्रयास किया, लेकिन सिर्फ हवा में बल्ला घूमा! डॉट गेंद!",
      "कसी हुई गेंदबाजी! {bwl} ने बल्लेबाज को बांध कर रखा है, दर्शकों में जोरदार उत्साह!",
      "हल्के हाथों से खेला {bat} ने, लेकिन गली के फील्डर ने तेजी से गेंद उठा ली. कोई रन नहीं.",
      "{bwl} की खतरनाक बाउंसर! बल्लेबाज ने सूझबूझ से गेंद को छोड़ा, डॉट बॉल!",
      "गली के कोने पर जबरदस्त फील्डिंग! एक निश्चित रन बचाया, कोई रन नहीं मिला."
    ],
    en: [
      "{bwl} fires a skidding delivery, and {bat} defends it resolutely. No run. (Whistle whistles!)",
      "High-class bowling by {bwl}! {bat} gets beaten on the off-stump. (Spectators cheering!)",
      "No room given by {bwl}. {bat} pats it with flat-bat back to the bowler.",
      "A lovely tight line from {bwl}. {bat} leaves it safely into keeper's gloves.",
      "{bat} attempts a big swing but gets only air against {bwl}'s clever spin!",
      "Excellent defense from {bat} against a probing ball from {bwl}. Close keeping!"
    ]
  },
  singles: {
    mr: [
      "{bat} ने हलक्या हाताने कव्हर गॅपमध्ये चेंडू ढकलला आणि चपळाईने १ धाव पूर्ण केली!",
      "सुरेख स्ट्राईक रोटेशन! पॅडवरचा चेंडू ऑन-साईडला वळवून सहज एक धाव घेतली.",
      "चतुर गल्ली क्रिकेट! {bat} चा हलका टच आणि दोन्ही फलंदाजांची विजेच्या वेगाने धाव, १ धाव!",
      "{bwl} च्या वेगाचा फायदा घेत चेंडू थर्ड मॅनच्या दिशेने फिरवला, १ धाव खात्यात जमा.",
      "थेट क्षेत्ररक्षकाच्या हातात जाण्यापूर्वी चपळाईने सिंगल पूर्ण! फलंदाजांमध्ये सुरेख ताळमेळ.",
      "{bat} ने मिड-ऑफला चेंडू ढकलून धाव घेतली, प्रेक्षकांकडून खेळाडूंना दाद!",
      "संयमी खेळ! एकेरी धाव घेत धावफलक हलता ठेवला, सुंदर क्रिकेट!",
      "अचूक प्लेसमेंट! गॅप शोधून १ धाव सहज चोरली, फलंदाजीची उत्तम रणनीती."
    ],
    hi: [
      "{bat} ने हल्के हाथों से कवर की तरफ खेला और फुर्ती से एक रन चुरा लिया!",
      "बेहतरीन स्ट्राइक रोटेशन! पैड्स पर आती गेंद को फ्लिक करके आसानी से सिंगल लिया.",
      "स्मार्ट गली क्रिकेट! हल्का सा पुश किया और दोनों बल्लेबाजों ने दौड़कर १ रन पूरा किया!",
      "{bwl} की रफ्तार का इस्तेमाल करते हुए गेंद को थर्ड मैन की दिशा में गाइड किया, १ रन!",
      "फील्डर की पहुंच से दूर गेंद को धकेलकर तेजी से रन पूरा किया. कमाल की रनिंग!",
      "{bat} ने मिड-ऑन की तरफ ड्राइव किया और सुरक्षित एक रन ले लिया.",
      "धीमी लेकिन सूझबूझ भरी शुरुआत! सिंगल लेकर स्ट्राइक रोटेट की, दबाव कम किया.",
      "गैप में गेंद को प्लेस किया और बिना किसी जोखिम के १ रन आसानी से बटोरा."
    ],
    en: [
      "{bat} works the delivery from {bwl} through the off-side for a swift single.",
      "Quick single taken as {bat} tucks it into the cover gap. Beautiful running!",
      "{bat} guides this one down to third-man area. Soft hands, comfortable run.",
      "Excellent rotation! {bat} taps a tight ball and scampers across immediately.",
      "A gentle tap from {bat} towards mid-off, easy single. The local crowd applauds!"
    ]
  },
  doubles: {
    mr: [
      "खूपच सुंदर फटका! {bat} ने चेंडू डीप कव्हरला मारला आणि जोरदार धावून २ धावा पूर्ण केल्या!",
      "उत्कृष्ट रनिंग बिटवीन द विकेट्स! पहिल्या धावेनंतर लगेच दुसरी धाव पूर्ण केली, २ धावा!",
      "{bat} चा सुरेख फ्लिक! चेंडू मिड-विकेटच्या गॅपमध्ये, दोन्ही फलंदाजांची चपळ धावपळ, २ धावा!",
      "क्षेत्ररक्षक चेंडूच्या मागे धावतोय, पण तोपर्यंत २ धावा सुरक्षित पूर्ण! गल्लीत टाळ्यांचा कडकडाट!",
      "{bwl} च्या चेंडूवर सुंदर कट शॉट! गल्लीच्या रस्त्यावरून चेंडू वळवला, २ धावा सहज मिळाल्या.",
      "पहिल्याच क्षणी कॉल केला आणि वेगाने धावून सुरक्षित २ धावा घेतल्या. उत्तम समन्वय!",
      "बॅकफूटवर जाऊन स्क्वेअर लेगच्या दिशेने फटका, २ धावा वसूल!",
      "उत्तम प्लेसमेंट! रिकाम्या जागेत चेंडू टोलवला आणि धावपळीने २ धावा पूर्ण केल्या."
    ],
    hi: [
      "कमाल का शॉट! {bat} ने डीप कवर में प्लेस किया और चीते जैसी रफ्तार से २ रन पूरे किए!",
      "विकेटों के बीच जबरदस्त दौड़! पहली रन तेजी से पूरी की और मुड़कर आसानी से दूसरा रन बना लिया.",
      "{bat} का खूबसूरत फ्लिक! मिड-विकेट की खाली जगह में गेंद और दोनों बल्लेबाजों ने २ रन बटोरे!",
      "फील्डर गेंद के पीछे भागा, लेकिन बल्लेबाजों ने चुस्ती दिखाते हुए दो रन पूरे कर लिए!",
      "{bwl} की गेंद पर नफासत भरा कट शॉट! गेंद तेजी से दौड़ी, २ रन खाते में!",
      "शानदार तालमेल! कॉल किया और बिना हिचकिचाहट के तेजी से डबल पूरा किया.",
      "बैकफुट पर जाकर स्क्वायर लेग की दिशा में खेला और २ कीमती रन अपनी टीम के लिए जोड़े.",
      "गैप को अच्छी तरह परखा, सूझबूझ भरी दौड़ और शानदार २ रन!"
    ],
    en: [
      "Shot! {bat} drives deep through covers, pushing hard with great hustle for two!",
      "{bat} flicks {bwl} through mid-wicket. Splendid speed gets them a couple.",
      "Two runs taken! {bat} plays with soft hands into vacant deep space.",
      "{bwl}'s delivery is cut past point. Fielder chases hard, {bat} safely back for two!",
      "Excellent placement by {bat}! Swept away towards deep leg-side, double completed."
    ]
  },
  threes: {
    mr: [
      "अविश्वसनीय धावपळ! {bat} ने चेंडू लांब गॅपमध्ये टोलवला आणि धावून तब्बल ३ धावा काढल्या!",
      "मैदानातील प्रचंड स्टॅमिना! गल्लीच्या मोकळ्या कोपऱ्यात चेंडू, फलंदाजांनी पळून ३ धावा पूर्ण केल्या!",
      "{bat} चा उत्कृष्ट ड्राईव्ह! क्षेत्ररक्षकाने सीमारेषेवर चेंडू अडवला तोवर फलंदाजांनी ३ धावा लुटल्या!",
      "अप्रतिम रनिंग! दोन्ही फलंदाजांमध्ये कमालीचा वेग, सलग तिसरी धाव पूर्ण!",
      "क्षेत्ररक्षकाची थोडीशी चूक झाली आणि फलंदाजांनी क्षणात तिसरी धाव पळवून घेतली!",
      "खोलवर मारलेला फटका, लांबून चेंडू फेकेपर्यंत ३ धावा पूर्ण! प्रेक्षकांची उभे राहून दाद!",
      "हवेतील फटका जमिनीवर पडला, चपळाई दाखवून फलंदाजांनी ३ धावा आपल्या नावावर केल्या!"
    ],
    hi: [
      "अविश्वसनीय रनिंग! {bat} ने गेंद को डीप गैप में धकेला और दौड़कर ३ रन पूरे किए!",
      "सख्त मेहनत और गजब का स्टेमिना! गली के खाली कोने में गेंद गई और बल्लेबाजों ने ३ रन लूट लिए!",
      "{bat} का शानदार ड्राइव! फील्डर ने बाउंड्री से गेंद रोकी तब तक ३ रन आसानी से पूरे!",
      "लाजवाब दौड़! दोनों बल्लेबाजों में जबरदस्त तेजी, बिजली की रफ्तार से तीसरा रन पूरा किया!",
      "फील्डिंग में हल्की सी चूक और उसका पूरा फायदा उठाकर बल्लेबाजों ने ३ रन बना लिए!",
      "लंबा शॉट, जब तक थ्रो आता तब तक बल्लेबाजों ने दौड़कर ३ रन पूरे कर लिए!",
      "गजब की फुर्ती! फील्डर के थ्रो से पहले ही बल्ला क्रीज के अंदर, ३ रन!"
    ],
    en: [
      "Phenomenal running! {bat} punches it through the off-side gap and scampers for three.",
      "Slick placement as {bat} sweeps {bwl} fine. They push hard and complete three runs!",
      "{bat} launches this into the empty corner of the street. Terrific endurance to get three!",
      "A misfield gives {bat} and partner enough confidence to sprint back for a hard-earned three."
    ]
  },
  fours: {
    mr: [
      "खणखणीत चौकार! {bat} चा तुफानी कव्हर ड्राईव्ह, चेंडू सुसाट सीमारेषेबाहेर ४ धावांसाठी! 🔥",
      "गोळीच्या वेगाने चौकार! {bwl} च्या चेंडूचा समाचार घेत बॅटच्या मधोमध लागलेला फटका, ४ धावा!",
      "नजाकतदार चौकार! {bat} ने अप्रतिम टायमिंग साधत चेंडू थेट सीमारेषेपलीकडे धाडला!",
      "गल्लीत एकच जल्लोष! बॅकफूटवर जाऊन मारलेला सुरेख पंच, चेंडू भिंतीला आदळून चौकार!",
      "क्लासिक फटका! {bat} चा नयनरम्य स्ट्रेट ड्राईव्ह, गोलंदाजाला पाहत राहण्याशिवाय पर्याय नव्हता, ४ धावा!",
      "ताकद आणि टायमिंगचा मिलाफ! कव्हरच्या वरून चेंडू उसळत सीमारेषेबाहेर, दणदणीत चौकार!",
      "खोलवर टाकलेला चेंडू खोदून काढला आणि गॅपमधून रॉकेटच्या वेगाने सीमारेषेला स्पर्श, ४ धावा!",
      "{bwl} वर हल्लाबोल! फिरकी चेंडूवर रिव्हर्स स्वीप करत सीमारेषा पार, अप्रतिम चौकार!"
    ],
    hi: [
      "करारा चौका! {bat} का रॉकेट कवर ड्राइव, गेंद गोली की रफ्तार से बाउंड्री पार ४ रन! 🔥",
      "गोली की रफ्तार से चौका! बल्ले का भरपूर संपर्क और गेंद दर्शकों की तालियों के बीच सीमा पार!",
      "नजाकत और टाइमिंग की मिसाल! {bat} ने गेंद को गैप में तराशा, दर्शनीय चौका!",
      "गली में जश्न का माहौल! बैकफुट पर जाकर लगाया जोरदार पंच, गेंद दीवार से टकराई और चार रन!",
      "क्लासिक स्ट्रेट ड्राइव! {bwl} बस देखते ही रह गए, गेंद बिजली की तेजी से बाउंड्री पार, ४ रन!",
      "ताकत और क्लास का अद्भुत नजारा! फील्डर्स के सिर के ऊपर से टप्पा खाती हुई गेंद बाउंड्री पार, चौका!",
      "यॉर्कर गेंद को खोदा और नजाकत से गैप में निकाला, गेंद बुलेट की तरह बाउंड्री पार, ४ रन!",
      "{bwl} पर करारा प्रहार! गैप ढूंढकर लगाया खूबसूरत स्वीप शॉट, शानदार चौका!"
    ],
    en: [
      "BOOM! {bat} lashes a gorgeous drive through covers for FOUR runs! Magnificent! 🔥",
      "CRACKING FOUR! {bat} pulls {bwl} over mid-wicket, bouncing over the boundary lines!",
      "Splendid timing from {bat}! Elegant lofted cover drive over the circle. Boundary!",
      "Pure street class! {bat} cuts past point with supreme precision. Four runs!",
      "{bat} uses the pace of {bwl}'s delivery and guides it down past keeper for a boundary!"
    ]
  },
  sixes: {
    mr: [
      "उत्तुंग षटकार! {bat} चा प्रचंड तडाखा, चेंडू थेट इमारतीच्या छतावर! ६ धावा! 🚀",
      "गल्ली क्रिकेटचा महा-षटकार! {bat} ने क्रीजबाहेर निघून मारलेला हेलिकॉप्टर शॉट, चेंडू गायब! ६ धावा!",
      "आकाशाला गवसणी घालणारा षटकार! प्रेक्षकांमध्ये प्रचंड जल्लोष, चेंडू थेट गल्लीबाहेर! ६ धावा!",
      "तुफानी फटका! {bwl} च्या शॉर्ट चेंडूवर गगनभेदी पूल शॉट, प्रेक्षकांकडून टाळ्यांचा कडकडाट!",
      "दणदणीत सिक्सर! चेंडू हवेत उंच, उंच आणि थेट शेजारच्या घराच्या गच्चीवर! काय हा प्रहार!",
      "ताकदीचा महाविस्फोट! {bat} ने सरळ बॅटने टोलवला चेंडू, थेट मैदानाबाहेर लांब षटकार!",
      "डोळ्यांचे पारणे फेडणारा षटकार! बॉल सीमारेषेच्या खूप लांब जाऊन पडला, अंगावर रोमांच आणणारा सिक्स!",
      "अप्रतिम बॅट स्पीड! {bat} च्या बॅटमधून निघालेला असा फटका जो थेट रस्त्यापलीकडे गेला, ६ धावा!"
    ],
    hi: [
      "गगनचुंबी छक्का! {bat} का मॉन्स्टर हिट, गेंद सीधे पड़ोस की छत पर! ६ रन! 🚀",
      "गली क्रिकेट का आइकोनिक छक्का! आगे बढ़कर खेला गया धमाकेदार हेलीकॉप्टर शॉट, गेंद लापता! ६ रन!",
      "आसमान को छूता हुआ सिक्सर! दर्शकों में भारी उत्साह, गेंद सीधे गली के पार! ६ रन!",
      "तूफानी शॉट! {bwl} की छोटी गेंद पर लगाया गगनभेदी पुल शॉट, दर्शकों ने खड़े होकर बजाई तालियां!",
      "विशालकाय छक्का! गेंद हवा में तैरती हुई सीधे सामने वाले मकान की बालकनी में गिरी! अद्भुत प्रहार!",
      "पावर-हिटिंग का महामुकाबला! {bat} ने सीधे बल्ले से गेंद को अंतरिक्ष में भेज दिया! लंबा सिक्स!",
      "आंखें खुली की खुली रह गईं! गेंद बाउंड्री के बहुत आगे जाकर गिरी, रोमांच से भरपूर सिक्स!",
      "शानदार बैट स्पीड! {bat} के बल्ले से निकला ऐसा रॉकेट शॉट जो सीधा सड़क पार गिरा, ६ रन!"
    ],
    en: [
      "MONSTROUS HIT! {bat} sends the ball high, high, and over the building rooftop! SIX runs! 🚀",
      "OUT OF THE ALLEY! {bat} plays a staggering helicopter shot off {bwl} for an iconic SIX!",
      "A majestic maximum! {bat} dancing down the crease and lofting it over long-on! SIX!",
      "Colossal strike! {bat} swings clean, sending this straight into orbit! Massive SIX!",
      "Absolute power! {bat} slaps the ball from {bwl} over deep mid-wicket for six!"
    ]
  },
  wickets: {
    mr: [
      "आऊट! मोठा धक्का! {bwl} च्या भेदक चेंडूवर त्रिफळा उडाला! दांड्या हवेत गुल! 💥",
      "बाद! बॅटची कड लागली आणि यष्टिरक्षकाने चपळाईने झेल टिपला! {bat} तंबूकडे रवाना.",
      "मोठा गडी बाद! सीमारेषेवर उंच उडालेला चेंडू आणि क्षेत्ररक्षकाने अचूक पकडला! गल्लीत शांतता पसरली.",
      "क्लीन बोल्ड! {bwl} चा आत येणारा चेंडू, {bat} पूर्णपणे चकवला आणि स्टंप्स हवेत उडाले!",
      "धावबाद! फलंदाजांमध्ये गोंधळ, थेट थ्रोने यष्ट्या उडवल्या! दुर्दैवी पद्धतीने {bat} बाद!",
      "पायचीत बाद! पंचांचे बोट वर, जोरदार अपील आणि {bat} ला मैदान सोडावेच लागले!",
      "मोठी विकेट! सेट झालेला फलंदाज {bat} बाद झाल्याने गोलंदाजी संघाचा मैदानात जल्लोष!",
      "उत्कृष्ट फिरकीची जादू! फलंदाज पुढे आला आणि यष्टिरक्षकाने क्षणात बेल्स उडवल्या, स्टंपिंग बाद!"
    ],
    hi: [
      "आउट! बहुत बड़ा झटका! {bwl} की तूफानी गेंद पर उड़ गए डंडे! विकेटों की गिल्लियां हवा में! 💥",
      "विकेट! बल्ले का बाहरी किनारा लगा और विकेटकीपर ने कोई गलती नहीं की! {bat} पवेलियन लौटे.",
      "बड़ा झटका! हवा में लहराती गेंद और बाउंड्री लाइन पर पकड़ा गया हैरतअंगेज कैच! {bat} आउट!",
      "क्लीन बोल्ड! {bwl} की जादुई इन-स्विंगर, {bat} चारों खाने चित्त, स्टंप्स बिखर गए!",
      "रन आउट! तालमेल में गड़बड़ी, सीधा थ्रो स्टंप्स पर लगा और {bat} क्रीज से बाहर रह गए!",
      "एलबीडब्ल्यू आउट! जोरदार अपील के सामने अंपायर की उंगली उठी, {bat} को जाना होगा!",
      "करारा झटका! क्रीज पर जमे हुए प्रमुख बल्लेबाज {bat} को आउट कर बॉलिंग टीम ने जश्न मनाया!",
      "स्पिन का कमाल! बल्लेबाज आगे निकला और कीपर ने पलक झपकते ही गिल्लियां बिखेर दीं, स्टंप्ड आउट!"
    ],
    en: [
      "OUT! ABSOLUTE DRAMA! {bat} is clean bowled! {bwl} spins a web and breaks the timber! 💥",
      "GOT 'EM! A thick edge taken safely by the keeper! {bat} has to make the long walk back!",
      "GONE! In the air and a magnificent, diving catch in the deep! What a stellar breakthrough!",
      "TIMBER! An absolute peach of an inswinger from {bwl}, stumps rattling everywhere!",
      "RUN OUT! A catastrophic mix-up between the wickets, and the direct hit seals {bat}'s fate!",
      "TRAPPED! Loud appeal for LBW and the umpire matches it with a raised finger! Out!"
    ]
  },
  extras: {
    wide: {
      mr: [
        "वाईड चेंडू! {bwl} ची दिशा भरकटली, पंचांनी हात पसरवून अतिरिक्त धावेचा इशारा केला!",
        "ऑफ-स्टंपच्या खूप बाहेर चेंडू, पंचांचा वाईडचा इशारा. १ अतिरिक्त धाव!",
        "लेग-स्टंपच्या बाहेर जाणारा चेंडू, फलंदाजाने सोडून दिला. वाईड चेंडू घोषित."
      ],
      hi: [
        "वाइड गेंद! {bwl} लेग स्टंप की दिशा से भटके, अंपायर का इशारा अतिरिक्त रन का!",
        "ऑफ स्टंप के काफी बाहर गेंद, अंपायर के हाथ फैले. १ अतिरिक्त रन मिला!",
        "दिशाहीन गेंदबाजी, गेंद लेग साइड से बाहर निकली. वाइड गेंद करार!"
      ],
      en: [
        "Wide delivery called! {bwl} loses line down the leg side, extra conceded.",
        "Way outside off-stump! Umpire signals wide, extra run into the total.",
        "Wayward bowling down leg side, batsmen easily leave it. Wide ball!"
      ]
    },
    noball: {
      mr: [
        "रेषेबाहेर पाय! नो बॉल घोषित! आता फलंदाजाला पुढच्या चेंडूवर फ्री हिट मिळणार!",
        "नो-बॉल! गोलंदाजाचा पाय क्रीजबाहेर गेला, पंचांचा नो-बॉलचा इशारा. पुढील चेंडू फ्री-हिट!",
        "कमरेच्या वरचा धोकादायक चेंडू, पंचांनी नो-बॉल दिला! फलंदाजाला फ्री-हिटची सुवर्णसंधी!"
      ],
      hi: [
        "कदम सीमा रेखा से बाहर! नो-बॉल करार! अब अगली गेंद पर फ्री-हिट!",
        "नो-बॉल! गेंदबाज ने ओवरस्टेप किया, अंपायर का सायरन. अगली गेंद फ्री-हिट!",
        "कमर से ऊपर की बीमर गेंद, अंपायर ने तुरंत नो-बॉल का इशारा किया. फ्री-हिट का मौका!"
      ],
      en: [
        "Over-the-line! No-ball declared! Free-hit loading for the batting side!",
        "No-ball called for overstepping! Free hit awarded on the very next delivery!",
        "Dangerous high full toss over waist height! No-ball signaled, Free Hit next!"
      ]
    }
  }
};

const pickRandom = (arr: string[]): string => {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Generates a unique, localized commentary snippet for any cricket delivery or event
 */
export function generateLocalizedCricketCommentary(
  type: 'dot' | 'runs' | 'boundary' | 'wicket' | 'extra',
  val: number,
  striker: string,
  bowler: string,
  lang: CommentaryLanguage,
  options?: {
    extraType?: string;
    newBatsman?: string;
    howOut?: string;
    runsOffBat?: number;
    winProbability?: any;
    isCrucialTime?: boolean;
  }
): string {
  const bat = striker?.trim() || 'फलंदाज';
  const bwl = bowler?.trim() || 'गोलंदाज';
  const targetLang = lang === 'mr' ? 'mr' : lang === 'hi' ? 'hi' : 'en';

  const appendWinProb = (text: string): string => {
    if (text.includes('[AI')) return text;
    // CRITICAL USER DIRECTIVE: Do not show win probability on every delivery! Only show at crucial moments.
    if (!options?.isCrucialTime) return text;
    const wp = options?.winProbability;
    if (!wp || !wp.teamA || !wp.teamB) return text;
    const pA = Math.round(wp.probA ?? 50);
    const pB = Math.round(wp.probB ?? 50);
    if (targetLang === 'mr') return `${text} [AI विजयाची शक्यता: ${wp.teamA} ${pA}% | ${wp.teamB} ${pB}%]`;
    if (targetLang === 'hi') return `${text} [AI जीत की संभावना: ${wp.teamA} ${pA}% | ${wp.teamB} ${pB}%]`;
    return `${text} [AI Win Probability: ${wp.teamA} ${pA}% | ${wp.teamB} ${pB}%]`;
  };

  if (type === 'dot' || val === 0) {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.dots[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  if (type === 'wicket') {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.wickets[targetLang]);
    let text = raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl);
    if (options?.newBatsman) {
      const newBat = options.newBatsman.trim();
      if (targetLang === 'mr') {
        text += ` विकेट पडल्यानंतर, ${newBat} नवीन फलंदाज क्रीजवर आले आहेत.`;
      } else if (targetLang === 'hi') {
        text += ` विकेट गिरने के बाद, ${newBat} नए बल्लेबाज क्रीज पर आए हैं.`;
      } else {
        text += ` After wicket fell, ${newBat} new batsman come on crease.`;
      }
    }
    return appendWinProb(text);
  }

  if (val === 4 || type === 'boundary' && val !== 6) {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.fours[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  if (val === 6) {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.sixes[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  if (val === 1) {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.singles[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  if (val === 2) {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.doubles[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  if (val === 3) {
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.threes[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  if (type === 'extra' || options?.extraType) {
    const isNoBall = options?.extraType === 'noball' || (type === 'extra' && (options?.extraType?.includes('no') || options?.extraType === 'nb'));
    if (isNoBall) {
      const batRuns = (options as any)?.runsOffBat ?? (val > 0 ? val : 0);
      if (batRuns > 0) {
        if (targetLang === 'mr') {
          return appendWinProb(`🚨 नो-बॉल आणि सोबत ${batRuns} धावा! ${bwl} चा पाय रेषेबाहेर गेला आणि ${bat} ने सुरेख फटका मारून ${batRuns} धावा वसूल केल्या! पुढील चेंडूवर फ्री-हिटची सुवर्णसंधी!`);
        }
        if (targetLang === 'hi') {
          return appendWinProb(`🚨 नो-बॉल और साथ में ${batRuns} रन! ${bwl} ने क्रीज से बाहर कदम रखा और ${bat} ने मौके का फायदा उठाकर ${batRuns} रन बटोरे! अगली गेंद पर फ्री-हिट!`);
        }
        return appendWinProb(`🚨 NO-BALL plus ${batRuns} run${batRuns > 1 ? 's' : ''} taken! ${bwl} oversteps the crease and ${bat} capitalizes taking ${batRuns} run${batRuns > 1 ? 's' : ''}! Free-hit loading next!`);
      }
      const raw = pickRandom(GULLY_COMMENTARY_POOLS.extras.noball[targetLang]);
      return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
    }
    const isWide = options?.extraType === 'wide' || (type === 'extra' && options?.extraType?.includes('wide'));
    if (isWide) {
      const extraRuns = (options as any)?.runsOffBat ?? 0;
      if (extraRuns > 0) {
        if (targetLang === 'mr') {
          return appendWinProb(`वाईड चेंडू आणि सोबत ${extraRuns} अतिरिक्त धावा! ${bwl} ची दिशा भरकटली आणि फलंदाजांनी ${extraRuns} धावा पळून पूर्ण केल्या!`);
        }
        if (targetLang === 'hi') {
          return appendWinProb(`वाइड गेंद और साथ में ${extraRuns} अतिरिक्त रन! ${bwl} दिशा से भटके और बल्लेबाजों ने दौड़कर ${extraRuns} रन पूरे किए!`);
        }
        return appendWinProb(`Wide delivery plus ${extraRuns} extra run${extraRuns > 1 ? 's' : ''}! ${bwl} strays in line and the batsmen easily steal ${extraRuns} extra run${extraRuns > 1 ? 's' : ''}!`);
      }
      const raw = pickRandom(GULLY_COMMENTARY_POOLS.extras.wide[targetLang]);
      return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
    }
    const raw = pickRandom(GULLY_COMMENTARY_POOLS.extras.wide[targetLang]);
    return appendWinProb(raw.replace(/\{bat\}/g, bat).replace(/\{bwl\}/g, bwl));
  }

  // Generic fallback for any other run counts
  if (targetLang === 'mr') {
    return appendWinProb(`${bwl} च्या चेंडूवर ${bat} ने सुरेख फटका मारून ${val} धावा पूर्ण केल्या!`);
  }
  if (targetLang === 'hi') {
    return appendWinProb(`${bwl} की गेंद पर ${bat} ने बेहतरीन शॉट खेलकर ${val} रन बनाए!`);
  }
  return appendWinProb(`${bat} scores ${val} runs off ${bwl}'s delivery with good placement.`);
}

/**
 * Intelligent client-side phrase translator for cricket commentary
 */
export function translateCommentaryText(text: string, lang: CommentaryLanguage): string {
  if (!text) return '';
  if (lang === 'en') return text;

  const trimmed = text.trim();

  // Pattern: "After wicket fell, [Name] new batsman come on crease."
  const afterWicketMatch = trimmed.match(/After wicket fell,\s*([^.]+?)\s*(?:new batsman come on crease|new batsman came on crease)/i);
  if (afterWicketMatch) {
    const newBat = afterWicketMatch[1].trim();
    if (lang === 'mr') {
      return trimmed.replace(
        /After wicket fell,\s*([^.]+?)\s*(?:new batsman come on crease|new batsman came on crease)\.?/i,
        `विकेट पडल्यानंतर, ${newBat} नवीन फलंदाज क्रीजवर आले आहेत.`
      );
    } else if (lang === 'hi') {
      return trimmed.replace(
        /After wicket fell,\s*([^.]+?)\s*(?:new batsman come on crease|new batsman came on crease)\.?/i,
        `विकेट गिरने के बाद, ${newBat} नए बल्लेबाज क्रीज पर आए हैं.`
      );
    }
  }

  // Pattern: "[Bat1] and [Bat2] new batsman are come on crease and [Bowler] will bowl the first over. Target: [Target] runs."
  const startMatch = trimmed.match(/(.+?)\s+and\s+(.+?)\s+new batsman are come on crease and\s+(.+?)\s+will bowl the first over(?:\.\s*Target:\s*(\d+)\s*runs)?/i);
  if (startMatch) {
    const b1 = startMatch[1].trim();
    const b2 = startMatch[2].trim();
    const bowl = startMatch[3].trim();
    const target = startMatch[4];

    if (lang === 'mr') {
      const targetStr = target ? ` लक्ष्य: ${target} धावा.` : '';
      return `${b1} आणि ${b2} नवीन फलंदाज क्रीजवर आले आहेत आणि ${bowl} पहिले षटक टाकणार आहे.${targetStr}`;
    } else if (lang === 'hi') {
      const targetStr = target ? ` लक्ष्य: ${target} रन.` : '';
      return `${b1} और ${b2} नए बल्लेबाज क्रीज पर आए हैं और ${bowl} पहला ओवर फेंकेंगे.${targetStr}`;
    }
  }

  // Pattern: "Bowler to Batsman: Outcome"
  const deliveryMatch = trimmed.match(/^([^:]+?)\s+to\s+([^:]+?):\s*(.+)$/i);
  if (deliveryMatch) {
    const bowler = deliveryMatch[1].trim();
    const batsman = deliveryMatch[2].trim();
    const outcome = deliveryMatch[3].trim();

    let eventType: 'dot' | 'runs' | 'boundary' | 'wicket' | 'extra' = 'runs';
    let val = 0;
    let extraType = '';

    if (/dot ball|no run|0 run/i.test(outcome)) {
      eventType = 'dot';
      val = 0;
    } else if (/six|6 runs/i.test(outcome)) {
      eventType = 'boundary';
      val = 6;
    } else if (/four|4 runs|boundary/i.test(outcome)) {
      eventType = 'boundary';
      val = 4;
    } else if (/three runs|3 runs/i.test(outcome)) {
      eventType = 'runs';
      val = 3;
    } else if (/two runs|2 runs/i.test(outcome)) {
      eventType = 'runs';
      val = 2;
    } else if (/single|1 run/i.test(outcome)) {
      eventType = 'runs';
      val = 1;
    } else if (/wide/i.test(outcome)) {
      eventType = 'extra';
      extraType = 'wide';
    } else if (/no[- ]?ball/i.test(outcome)) {
      eventType = 'extra';
      extraType = 'noball';
    } else if (/wicket|out|bowled|caught/i.test(outcome)) {
      eventType = 'wicket';
    }

    return generateLocalizedCricketCommentary(eventType, val, batsman, bowler, lang, { extraType });
  }

  // Pattern: "OUT! [Batter] has to walk back..."
  const wktOutMatch = trimmed.match(/OUT!\s+([^(\s]+)/i);
  if (wktOutMatch) {
    const dismissedBat = wktOutMatch[1].trim();
    const bowlMatch = trimmed.match(/Bowler:\s*([^)]+)/i);
    const bowl = bowlMatch ? bowlMatch[1].trim() : 'गोलंदाज';
    const newBatMatch = trimmed.match(/After wicket fell,\s*([^.]+?)\s*new batsman/i);
    const newBat = newBatMatch ? newBatMatch[1].trim() : undefined;

    return generateLocalizedCricketCommentary('wicket', 0, dismissedBat, bowl, lang, { newBatsman: newBat });
  }

  // Common phrase replacements for general text
  if (lang === 'mr') {
    let res = trimmed;
    res = res.replace(/FOUR!/g, 'खणखणीत चौकार! ')
      .replace(/SIX!/g, 'उत्तुंग षटकार! ')
      .replace(/OUT!/g, 'आऊट! ')
      .replace(/DOT BALL!/g, 'निर्धाव चेंडू! ')
      .replace(/Target:\s*(\d+)\s*runs/gi, 'लक्ष्य: $1 धावा')
      .replace(/needs?\s+(\d+)\s+runs/gi, '$1 धावांची गरज')
      .replace(/off\s+(\d+)\s+balls/gi, '$1 चेंडूत')
      .replace(/Target Achieved!/gi, 'लक्ष्य पूर्ण झाले!')
      .replace(/Innings declared/gi, 'डाव घोषित करण्यात आला')
      .replace(/Free[- ]?Hit/gi, 'फ्री हिट')
      .replace(/Wide ball/gi, 'वाईड चेंडू')
      .replace(/No ball/gi, 'नो बॉल');
    return res;
  }

  if (lang === 'hi') {
    let res = trimmed;
    res = res.replace(/FOUR!/g, 'शानदार चौका! ')
      .replace(/SIX!/g, 'गगनचुंबी छक्का! ')
      .replace(/OUT!/g, 'आउट! ')
      .replace(/DOT BALL!/g, 'डॉट गेंद! ')
      .replace(/Target:\s*(\d+)\s*runs/gi, 'लक्ष्य: $1 रन')
      .replace(/needs?\s+(\d+)\s+runs/gi, '$1 रन की जरूरत')
      .replace(/off\s+(\d+)\s+balls/gi, '$1 गेंदों में')
      .replace(/Target Achieved!/gi, 'लक्ष्य हासिल कर लिया!')
      .replace(/Innings declared/gi, 'पारी घोषित की गई')
      .replace(/Free[- ]?Hit/gi, 'फ्री हिट')
      .replace(/Wide ball/gi, 'वाइड गेंद')
      .replace(/No ball/gi, 'नो बॉल');
    return res;
  }

  return trimmed;
}

/**
 * Extracts commentary description in the user's selected language
 */
export function getCommentaryText(
  comm?: CommentaryWithTranslations | null,
  lang?: CommentaryLanguage
): string {
  if (!comm) return '';
  const currentLang = lang || getStoredCommentaryLanguage();

  // 1. Direct translation matching
  if (comm.translations) {
    if (currentLang === 'mr' && comm.translations.mr && comm.translations.mr.trim()) {
      return comm.translations.mr;
    }
    if (currentLang === 'hi' && comm.translations.hi && comm.translations.hi.trim()) {
      return comm.translations.hi;
    }
    if (currentLang === 'en' && comm.translations.en && comm.translations.en.trim()) {
      return comm.translations.en;
    }
  }

  // 2. Custom field fallback (e.g. description_mr, commentary_hi)
  if (currentLang === 'mr' && (comm.description_mr || comm.commentary_mr)) {
    return comm.description_mr || comm.commentary_mr;
  }
  if (currentLang === 'hi' && (comm.description_hi || comm.commentary_hi)) {
    return comm.description_hi || comm.commentary_hi;
  }
  if (currentLang === 'en' && (comm.description_en || comm.commentary_en)) {
    return comm.description_en || comm.commentary_en;
  }

  const baseDesc = comm.description || '';
  if (currentLang === 'en') return baseDesc;

  // 3. Smart translator fallback for unilingual records
  return translateCommentaryText(baseDesc, currentLang);
}

/**
 * Builds a multilingual commentary record
 */
export function createMultilingualCommentary(
  enText: string,
  hiText?: string,
  mrText?: string
): { en: string; hi: string; mr: string } {
  return {
    en: enText,
    hi: hiText && hiText.trim() ? hiText : translateCommentaryText(enText, 'hi'),
    mr: mrText && mrText.trim() ? mrText : translateCommentaryText(enText, 'mr'),
  };
}

/**
 * Reusable Language Selector Component
 */
export interface CommentaryLanguageSelectorProps {
  currentLang?: CommentaryLanguage;
  onLanguageChange?: (lang: CommentaryLanguage) => void;
  variant?: 'pills' | 'compact' | 'select' | 'header';
  className?: string;
}

export const CommentaryLanguageSelector: React.FC<CommentaryLanguageSelectorProps> = ({
  currentLang: propLang,
  onLanguageChange,
  variant = 'pills',
  className = '',
}) => {
  const [internalLang, setInternalLang] = useCommentaryLanguage();
  const activeLang = propLang || internalLang;

  const handleSelect = (lang: CommentaryLanguage) => {
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
    setInternalLang(lang);
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 shadow-sm ${className}`}>
        {COMMENTARY_LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => handleSelect(l.id)}
            title={`Commentary: ${l.name} (${l.nativeName})`}
            className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded transition-all cursor-pointer border-none flex items-center gap-1 ${
              activeLang === l.id
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 bg-transparent'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1 shadow-inner ${className}`}>
        <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 px-1.5">
          Commentary:
        </span>
        {COMMENTARY_LANGUAGES.map((l) => {
          const isActive = activeLang === l.id;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => handleSelect(l.id)}
              className={`px-2 py-1 rounded-lg text-[9.5px] font-extrabold tracking-wide transition-all border-none cursor-pointer flex items-center gap-1 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm scale-102'
                  : 'text-slate-400 hover:text-slate-200 bg-transparent hover:bg-slate-800/50'
              }`}
            >
              <span className="text-[11px]">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default pills
  return (
    <div className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm ${className}`}>
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
        Language:
      </span>
      {COMMENTARY_LANGUAGES.map((l) => {
        const isActive = activeLang === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => handleSelect(l.id)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border-none cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* =========================================================================
 * 1. CONTEXTUAL TONE SHIFTER: DYNAMIC MATCH SITUATION COMMENTARY STYLE
 * ========================================================================= */

export type MatchContextualTone = 
  | 'HIGH_THRILLER'     // Final overs chasing with high RRR or razor-thin margin
  | 'ANALYTICAL_DRY'    // Middle overs consolidation, explaining field placements & tactics
  | 'CARNAGE_EXPLOSIVE' // Boundaries raining down, high run rate explosion
  | 'TENSE_COLLAPSE'    // Multiple wickets fell quickly, rebuilding phase
  | 'BALANCED_CRICKET'; // Steady rhythm of play

export interface ContextualToneInfo {
  tone: MatchContextualTone;
  label: { en: string; hi: string; mr: string };
  shortTag: string;
  badgeClass: string;
  borderClass: string;
  pulse: boolean;
  description: { en: string; hi: string; mr: string };
  commentaryInstruction: string;
}

/**
 * Evaluates the live match equation and returns the contextual tone and style guidelines.
 */
export function getMatchContextualTone(
  match: { oversLimit?: number; currentInningsNum?: number; targetRuns?: number | null } | null | undefined,
  innings: { runs: number; wickets: number; ballsBowled: number; commentaryList?: any[] } | null | undefined
): ContextualToneInfo {
  if (!match || !innings) {
    return {
      tone: 'BALANCED_CRICKET',
      label: { en: 'Balanced Contest', hi: 'संतुलित मुकाबला', mr: 'संतुलित लढत' },
      shortTag: '🏏 LIVE MATCH',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      borderClass: 'border-emerald-500/30',
      pulse: false,
      description: {
        en: 'Match is underway in balanced conditions.',
        hi: 'मैच सामान्य और संतुलित स्थिति में जारी है.',
        mr: 'सामना संतुलित आणि चुरशीच्या वातावरणात सुरू आहे.'
      },
      commentaryInstruction: 'BALANCED: Classic, engaging gully cricket commentary.'
    };
  }

  const oversLimit = match.oversLimit || 10;
  const totalBalls = oversLimit * 6;
  const ballsBowled = innings.ballsBowled || 0;
  const ballsLeft = Math.max(0, totalBalls - ballsBowled);
  const oversBowled = ballsBowled / 6;
  const crr = ballsBowled > 0 ? (innings.runs / ballsBowled) * 6 : 0;
  const isChasing = match.currentInningsNum === 2 && typeof match.targetRuns === 'number' && match.targetRuns > 0;
  const runsNeeded = isChasing ? Math.max(0, (match.targetRuns || 0) - innings.runs) : 0;
  const rrr = (isChasing && ballsLeft > 0) ? (runsNeeded / ballsLeft) * 6 : 0;

  const recentList = (innings.commentaryList || []).slice(0, 6);
  const recentWickets = recentList.filter(c => c.type === 'wicket').length;
  const recentBoundaries = recentList.filter(c => c.type === 'boundary').length;

  // 1. HIGH THRILLER:
  // Death overs (ballsLeft <= 18) when chasing with high RRR (>= 7.5 or tight equation <= 36 runs needed in 18 balls)
  // OR first innings final 2 overs (ballsLeft <= 12)
  if (
    (isChasing && ballsLeft <= 18 && ballsLeft > 0 && runsNeeded > 0) ||
    (isChasing && rrr >= 9.5 && ballsLeft <= 24 && ballsLeft > 0) ||
    (!isChasing && ballsLeft <= 12 && ballsLeft > 0 && ballsBowled >= 12)
  ) {
    return {
      tone: 'HIGH_THRILLER',
      label: {
        en: 'High Thriller',
        hi: 'हाई थ्रिलर (रोमांचक)',
        mr: 'हाय थ्रिलर (अत्यंत रोमांचक)'
      },
      shortTag: '⚡ HIGH THRILLER',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      borderClass: 'border-rose-500/50',
      pulse: true,
      description: {
        en: isChasing 
          ? `Final overs thriller! Need ${runsNeeded} runs in ${ballsLeft} balls (RRR: ${rrr.toFixed(1)}). Fast-paced, heart-stopping intensity!`
          : `Death overs crescendo! Only ${ballsLeft} balls left in the innings. Slogfest underway!`,
        hi: isChasing
          ? `अंतिम ओवरों का रोमांच! ${ballsLeft} गेंदों में ${runsNeeded} रन चाहिए (जरूरी रन रेट: ${rrr.toFixed(1)}). सांसें थाम देने वाला मुकाबला!`
          : `डेथ ओव्हर्सचा थरार! डावात फक्त ${ballsLeft} चेंडू बाकी, चौकार-षटकारांची आतषबाजी!`,
        mr: isChasing
          ? `शेवटच्या षटकांचा थरार! ${ballsLeft} चेंडूत ${runsNeeded} धावा हव्या आहेत (आवश्यक सरासरी: ${rrr.toFixed(1)}). अंगावर काटा आणणारा क्षण!`
          : `डेथ ओव्हर्सचा थरार! फक्त ${ballsLeft} चेंडू शिल्लक, फलंदाजांचा तुफानी मारा!`
      },
      commentaryInstruction: 'HIGH THRILLER: Fast-paced, breathless, exclamation-heavy commentary! Emphasize the run rate pressure, the crowd tension, edge-of-seat drama, and life-or-death gully cricket intensity.'
    };
  }

  // 2. TENSE COLLAPSE / REBUILDING:
  // Multiple wickets fell recently (>= 2 in last 6 balls) or 4+ wickets down with low score
  if (recentWickets >= 2 || (innings.wickets >= 4 && innings.runs < 50)) {
    return {
      tone: 'TENSE_COLLAPSE',
      label: {
        en: 'High Pressure / Rebuilding',
        hi: 'दबाव और संघर्ष',
        mr: 'दबाव आणि सावध खेळी'
      },
      shortTag: '⚠️ PRESSURE',
      badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      borderClass: 'border-amber-500/50',
      pulse: false,
      description: {
        en: `${innings.wickets} wickets down. Batters are consolidating and building a defense under heavy pressure.`,
        hi: `${innings.wickets} विकेट गिर चुके हैं. बल्लेबाज भारी दबाव में संभलकर पारी संभालने की कोशिश में हैं.`,
        mr: `${innings.wickets} गडी बाद. फलंदाज प्रचंड दबावात डावाला आकार देण्याचा सावध प्रयत्न करत आहेत.`
      },
      commentaryInstruction: 'TENSE COLLAPSE: Solemn, cautious, and focused on recovery. Describe the fielding cordon, close-in catchers, defensive blocks, and high tension.'
    };
  }

  // 3. CARNAGE EXPLOSIVE:
  // Boundaries raining down (3+ boundaries in last 6 balls or CRR >= 11)
  if (recentBoundaries >= 3 || crr >= 11.0) {
    return {
      tone: 'CARNAGE_EXPLOSIVE',
      label: {
        en: 'Explosive Carnage',
        hi: 'धमाकेदार बल्लेबाजी',
        mr: 'तुफानी फटकेबाजी'
      },
      shortTag: '💥 CARNAGE',
      badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      borderClass: 'border-purple-500/50',
      pulse: true,
      description: {
        en: `Pure batting demolition! Current run rate has skyrocketed to ${crr.toFixed(1)}. Balls flying into adjacent roofs!`,
        hi: `तूफानी बल्लेबाजी का कहर! रन रेट ${crr.toFixed(1)} पर पहुंच गया है. गेंदें छतों पर जा रही हैं!`,
        mr: `तुफानी फटकेबाजीचा तडाखा! धावगती ${crr.toFixed(1)} वर पोहोचली आहे. चेंडू थेट घरांच्या छतावर!`
      },
      commentaryInstruction: 'EXPLOSIVE CARNAGE: Electrifying, explosive, and awe-struck. The bowler has no answers as the batter dismantles the attack with colossal hits.'
    };
  }

  // 4. ANALYTICAL / DRY:
  // Middle overs (overs >= 2 and ballsLeft > 18) with steady pace, explaining field placements & tactical shifts
  if (oversBowled >= 2 && ballsLeft > 18) {
    return {
      tone: 'ANALYTICAL_DRY',
      label: {
        en: 'Analytical / Tactical',
        hi: 'रणनीतिक विश्लेषण',
        mr: 'रणनीती व विश्लेषण'
      },
      shortTag: '🧠 TACTICAL',
      badgeClass: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      borderClass: 'border-sky-500/50',
      pulse: false,
      description: {
        en: `Middle overs consolidation (Over ${oversBowled.toFixed(1)}). Captain shifting the field to plug the gaps while spinners apply the squeeze.`,
        hi: `मध्यम ओवरों की रणनीति (ओवर ${oversBowled.toFixed(1)}). कप्तान फील्डिंग बदल रहे हैं और सिंगल रोकने का जाल बिछा रहे हैं.`,
        mr: `मधल्या षटकांचे डावपेच (षटक ${oversBowled.toFixed(1)}). कर्णधार क्षेत्ररक्षणात बदल करत असून धावा रोखण्यासाठी जाळे विणले जात आहे.`
      },
      commentaryInstruction: 'ANALYTICAL / DRY: Explaining field placements (deep covers, mid-wicket, fine leg), line-and-length discipline, ring field, bowler traps, strike rotation, and run containment strategies.'
    };
  }

  // 5. BALANCED CONTEST
  return {
    tone: 'BALANCED_CRICKET',
    label: {
      en: 'Balanced Contest',
      hi: 'संतुलित मुकाबला',
      mr: 'संतुलित लढत'
    },
    shortTag: '🏏 MATCH IN BALANCE',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    borderClass: 'border-emerald-500/50',
    pulse: false,
    description: {
      en: 'Both bat and ball finding their rhythm. Batters rotating the strike and bowlers probing the corridor.',
      hi: 'बल्ले और गेंद के बीच बराबरी का मुकाबला. सिंगल चुराए जा रहे हैं और गेंदबाज सही लाइन पर लगे हैं.',
      mr: 'फलंदाजी आणि गोलंदाजीत चुरस. फलंदाज स्ट्राईक रोटेट करत असून गोलंदाज अचूक टप्प्यावर मारा करत आहेत.'
    },
    commentaryInstruction: 'BALANCED: Classic, engaging gully cricket commentary balancing bowling discipline with agile running between wickets.'
  };
}

/* =========================================================================
 * 2. AUTOMATIC BATSMAN & BOWLER ANNOUNCEMENTS
 * ========================================================================= */

/**
 * Generates an automatic announcement in the commentary box whenever a new batsman is added or takes guard
 */
export function createBatsmanAnnouncement(
  batsmanName: string,
  overBall: string,
  options?: {
    partnerName?: string;
    dismissedBatterName?: string;
    isWicketFall?: boolean;
    isRetiredHurt?: boolean;
    role?: 'striker' | 'non-striker';
  }
): CommentaryWithTranslations {
  const name = batsmanName.trim() || 'New Batsman';
  const dismissed = options?.dismissedBatterName ? options.dismissedBatterName.trim() : '';
  const partner = options?.partnerName ? options.partnerName.trim() : '';

  let en = '';
  let hi = '';
  let mr = '';

  if (options?.isRetiredHurt && dismissed) {
    en = `📢 NEW BATSMAN ON CREASE: ${name} walks out to the middle following the injury retirement of ${dismissed}${partner ? ` to join ${partner}` : ''}. Wishing ${dismissed} a speedy recovery!`;
    hi = `📢 नए बल्लेबाज क्रीज पर: ${dismissed} के रिटायर्ड हर्ट होने के बाद ${name} मैदान पर आए हैं${partner ? ` और ${partner} का साथ निभाएंगे` : ''}. ${dismissed} के जल्द स्वस्थ होने की कामना!`;
    mr = `📢 नवीन फलंदाज क्रीजवर: ${dismissed} दुखापतीमुळे रिटायर्ड हर्ट झाल्यानंतर ${name} मैदानात दाखल झाले आहेत${partner ? ` आणि ${partner} ची साथ देतील` : ''}. ${dismissed} लवकरात लवकर बरे व्हावेत ही सदिच्छा!`;
  } else if (options?.isWicketFall && dismissed) {
    en = `📢 NEW BATSMAN ON CREASE: ${name} walks out to the middle following the dismissal of ${dismissed}${partner ? ` to join ${partner}` : ''}. High expectations rest on this new pair!`;
    hi = `📢 नए बल्लेबाज क्रीज पर: ${dismissed} के आउट होने के बाद ${name} मैदान पर आए हैं${partner ? ` और ${partner} का साथ निभाएंगे` : ''}. इस नई साझेदारी पर सभी की निगाहें!`;
    mr = `📢 नवीन फलंदाज क्रीजवर: ${dismissed} बाद झाल्यानंतर ${name} मैदानात दाखल झाले आहेत${partner ? ` आणि ${partner} ची साथ देतील` : ''}. या नवीन जोडीकडून मोठ्या अपेक्षा!`;
  } else {
    en = `📢 NEW BATSMAN ON CREASE: ${name} arrives at the crease to take guard${partner ? ` alongside ${partner}` : ''}!`;
    hi = `📢 नए बल्लेबाज क्रीज पर: ${name} बल्लेबाजी के लिए क्रीज पर आ चुके हैं${partner ? ` और साथी खिलाड़ी ${partner} के साथ तैयार हैं` : ''}!`;
    mr = `📢 नवीन फलंदाज क्रीजवर: ${name} फलंदाजीसाठी मैदानात सज्ज झाले आहेत${partner ? ` आणि साथीदार ${partner} सोबत खेळतील` : ''}!`;
  }

  return {
    id: `comm-bat-announcement-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    overBall,
    description: en,
    type: 'announcement',
    announcementType: 'new_batsman',
    playerName: name,
    translations: { en, hi, mr }
  };
}

/**
 * Generates an automatic announcement in the commentary box whenever a bowler is brought into the attack
 */
export function createBowlerAnnouncement(
  bowlerName: string,
  overBall: string,
  options?: {
    isNewOver?: boolean;
    facingBatsmanName?: string;
  }
): CommentaryWithTranslations {
  const name = bowlerName.trim() || 'Bowler';
  const batter = options?.facingBatsmanName ? options.facingBatsmanName.trim() : '';

  let en = '';
  let hi = '';
  let mr = '';

  if (options?.isNewOver) {
    en = `📢 BOWLING CHANGE: ${name} takes the ball for over ${overBall}${batter ? ` to bowl against ${batter}` : ''}! Fresh energy into the bowling attack.`;
    hi = `📢 गेंदबाजी में बदलाव: ${name} ओवर ${overBall} के लिए गेंदबाजी आक्रमण की कमान संभाल रहे हैं${batter ? ` सामने हैं ${batter}` : ''}! नई ऊर्जा के साथ गेंदबाजी!`;
    mr = `📢 गोलंदाजीत बदल: ${name} षटक ${overBall} टाकण्यासाठी सज्ज झाले आहेत${batter ? ` समोर फलंदाज ${batter}` : ''}! गोलंदाजीत नवा उत्साह!`;
  } else {
    en = `📢 BOWLER INTO THE ATTACK: ${name} has been called into the bowling attack${batter ? ` to bowl to ${batter}` : ''}!`;
    hi = `📢 गेंदबाजी में बदलाव: ${name} को आक्रमण पर लगाया गया है${batter ? ` सामने हैं ${batter}` : ''}!`;
    mr = `📢 गोलंदाज आक्रमणावर: ${name} यांच्या हाती चेंडू सोपवला आहे${batter ? ` समोर फलंदाज ${batter}` : ''}!`;
  }

  return {
    id: `comm-bowl-announcement-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    overBall,
    description: en,
    type: 'extra',
    announcementType: 'new_bowler',
    playerName: name,
    translations: { en, hi, mr }
  };
}

/**
 * Number ordinals for commentary announcements
 */
export function getOrdinalWordEn(n: number): string {
  const ordinals = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth'];
  return ordinals[n] || `${n}th`;
}

export function getOrdinalWordHi(n: number): string {
  const ordinals = ['', 'पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पांचवां', 'छठा', 'सातवां', 'आठवां', 'नौवां', 'दसवां', 'ग्यारहवां', 'बारहवां', 'तेरहवां', 'चौदहवां', 'पंद्रहवां', 'सोलहवां', 'सत्रहवां', 'अठारहवां', 'उन्नीसवां', 'बीसवां'];
  return ordinals[n] || `${n}वां`;
}

export function getOrdinalWordMr(n: number): string {
  const ordinals = ['', 'पहिले', 'दुसरे', 'तिसरे', 'चौथे', 'पाचवे', 'सहावे', 'सातवे', 'आठवे', 'नववे', 'दहावे', 'अकरावे', 'बारावे', 'तेरावे', 'चौदावे', 'पंधरावे', 'सोळावे', 'सतरावे', 'अठरावे', 'एकोणिसावे', 'विसावे'];
  return ordinals[n] || `${n} वे`;
}

/**
 * Creates an over finish and bowling change announcement
 * Example: "First over finished and Umesh will bowl second over."
 */
export function createOverFinishedAndBowlerChangeAnnouncement(
  completedOverNo: number,
  nextBowlerName: string,
  overBallStr?: string
): CommentaryWithTranslations {
  const bwl = nextBowlerName?.trim() || 'Bowler';
  const overN = Math.max(1, completedOverNo);
  const nextN = overN + 1;

  // English: "First over finished and Umesh will bowl second over."
  const ordEnCurr = getOrdinalWordEn(overN);
  const ordEnNext = getOrdinalWordEn(nextN);
  const capitalizedOrdEnCurr = ordEnCurr.charAt(0).toUpperCase() + ordEnCurr.slice(1);
  const en = `${capitalizedOrdEnCurr} over finished and ${bwl} will bowl ${ordEnNext} over.`;

  // Hindi: "पहला ओवर समाप्त हुआ और Umesh दूसरा ओवर फेंकेंगे."
  const ordHiCurr = getOrdinalWordHi(overN);
  const ordHiNext = getOrdinalWordHi(nextN);
  const hi = `${ordHiCurr} ओवर समाप्त हुआ और ${bwl} ${ordHiNext} ओवर फेंकेंगे.`;

  // Marathi: "पहिले षटक संपले आणि Umesh दुसरे षटक टाकणार आहे."
  const ordMrCurr = getOrdinalWordMr(overN);
  const ordMrNext = getOrdinalWordMr(nextN);
  const mr = `${ordMrCurr} षटक संपले आणि ${bwl} ${ordMrNext} षटक टाकणार आहे.`;

  return {
    id: `comm-over-finish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    overBall: overBallStr || `${overN}.0`,
    description: en,
    type: 'milestone',
    announcementType: 'new_bowler',
    playerName: bwl,
    soundWave: true,
    translations: { en, hi, mr }
  };
}

/**
 * Generates an Inning 1 Summary commentary record
 */
export function createInningsSummaryCommentary(
  inn1: any,
  oversLimit?: number
): CommentaryWithTranslations {
  const batTeam = inn1?.battingTeam || 'Batting Team';
  const runs = inn1?.runs || 0;
  const wickets = inn1?.wickets || 0;
  const ballsBowled = inn1?.ballsBowled || 0;
  const oversStr = `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`;
  const rr = ballsBowled > 0 ? ((runs / ballsBowled) * 6).toFixed(2) : '0.00';

  let topBat = { name: '', runs: -1, balls: 0 };
  (inn1?.batsmen || []).forEach((b: any) => {
    if (b.runs > topBat.runs) {
      topBat = { name: b.name, runs: b.runs, balls: b.balls };
    }
  });
  if (!topBat.name && (inn1?.batsmen || []).length > 0) {
    topBat = { name: inn1.batsmen[0].name, runs: inn1.batsmen[0].runs, balls: inn1.batsmen[0].balls };
  }

  let bestBowl = { name: '', wickets: -1, runsConceded: 999 };
  (inn1?.bowlers || []).forEach((bw: any) => {
    if (bw.wickets > bestBowl.wickets || (bw.wickets === bestBowl.wickets && bw.runsConceded < bestBowl.runsConceded)) {
      bestBowl = { name: bw.name, wickets: bw.wickets, runsConceded: bw.runsConceded };
    }
  });
  if (!bestBowl.name && (inn1?.bowlers || []).length > 0) {
    bestBowl = { name: inn1.bowlers[0].name, wickets: inn1.bowlers[0].wickets, runsConceded: inn1.bowlers[0].runsConceded };
  }

  let totalFours = 0;
  let totalSixes = 0;
  (inn1?.batsmen || []).forEach((b: any) => {
    totalFours += (b.fours || 0);
    totalSixes += (b.sixes || 0);
  });

  const extrasTotal = (inn1?.extras?.wides || 0) + (inn1?.extras?.noBalls || 0) + (inn1?.extras?.byes || 0) + (inn1?.extras?.legByes || 0) + (inn1?.extras?.penalty || 0);

  const topBatTextEn = topBat.name ? `Top Scorer: ${topBat.name} (${topBat.runs} runs off ${topBat.balls}b). ` : '';
  const topBatTextHi = topBat.name ? `शीर्ष स्कोरर: ${topBat.name} (${topBat.balls} गेंदों में ${topBat.runs} रन). ` : '';
  const topBatTextMr = topBat.name ? `सर्वोच्च धावसंख्या: ${topBat.name} (${topBat.balls} चेंडूत ${topBat.runs} धावा). ` : '';

  const bestBowlTextEn = bestBowl.name ? `Best Bowler: ${bestBowl.name} (${bestBowl.wickets}/${bestBowl.runsConceded}). ` : '';
  const bestBowlTextHi = bestBowl.name ? `सर्वश्रेष्ठ गेंदबाज: ${bestBowl.name} (${bestBowl.runsConceded} रन देकर ${bestBowl.wickets} विकेट). ` : '';
  const bestBowlTextMr = bestBowl.name ? `सर्वोत्तम गोलंदाज: ${bestBowl.name} (${bestBowl.runsConceded} धावांत ${bestBowl.wickets} बळी). ` : '';

  const en = `📊 INNINGS 1 SUMMARY: ${batTeam} finished at ${runs}/${wickets} in ${oversStr} overs (Run Rate: ${rr}). ${topBatTextEn}${bestBowlTextEn}Boundaries: ${totalFours}x4s, ${totalSixes}x6s. Extras: ${extrasTotal}.`;
  const hi = `📊 पहली पारी का सारांश: ${batTeam} ने ${oversStr} ओवर में ${runs}/${wickets} रन बनाए (रन रेट: ${rr}). ${topBatTextHi}${bestBowlTextHi}बाउंड्री: ${totalFours} चौके, ${totalSixes} छक्के. अतिरिक्त: ${extrasTotal}.`;
  const mr = `📊 पहिल्या डावाचा सारांश: ${batTeam} ने ${oversStr} षटकांत ${runs}/${wickets} धावा केल्या (धावगती: ${rr}). ${topBatTextMr}${bestBowlTextMr}चौकार/षटकार: ${totalFours} चौकार, ${totalSixes} षटकार. अवांतर धावा: ${extrasTotal}.`;

  return {
    id: `comm-inn-summary-${Date.now()}`,
    overBall: oversStr,
    description: en,
    type: 'milestone',
    soundWave: true,
    translations: { en, hi, mr }
  };
}

/**
 * Generates an Inning Run Chase Equation commentary record
 */
export function createRunChaseEquationCommentary(
  chasingTeam: string,
  defendingTeam: string,
  targetRuns: number,
  oversLimit: number
): CommentaryWithTranslations {
  const totalBalls = Math.max(1, oversLimit * 6);
  const rrr = ((targetRuns / totalBalls) * 6).toFixed(2);

  const en = `🎯 INNINGS RUN CHASE EQUATION: ${chasingTeam} need ${targetRuns} runs to win off ${totalBalls} balls (${oversLimit} overs) at a Required Run Rate (RRR) of ${rrr} runs per over against ${defendingTeam}.`;
  const hi = `🎯 पारी रन चेज समीकरण: जीत के लिए ${chasingTeam} को ${oversLimit} ओवर (${totalBalls} गेंदों) में ${targetRuns} रन की आवश्यकता है (जरूरी रन रेट: ${rrr} प्रति ओवर).`;
  const mr = `🎯 डावातील लक्ष्याचा पाठलाग (Run Chase Equation): विजयासाठी ${chasingTeam} ला ${oversLimit} षटकांत (${totalBalls} चेंडू) ${targetRuns} धावांची आवश्यकता आहे (आवश्यक धावगती: ${rrr} प्रति षटक).`;

  return {
    id: `comm-chase-equation-${Date.now()}`,
    overBall: '0.0',
    description: en,
    type: 'milestone',
    soundWave: true,
    translations: { en, hi, mr }
  };
}

/**
 * Generates Match Winning, Player of the Match, and Match Summary commentary record
 */
export function createMatchWinningCommentary(
  matchState: any,
  potm: any
): CommentaryWithTranslations {
  const winner = matchState?.winner || 'Tie';
  const winReason = matchState?.winReason || 'Match concluded';
  const inn1 = matchState?.innings1;
  const inn2 = matchState?.innings2;

  const inn1Desc = inn1 ? `${inn1.battingTeam} ${inn1.runs}/${inn1.wickets} (${Math.floor(inn1.ballsBowled / 6)}.${inn1.ballsBowled % 6} ov)` : '';
  const inn2Desc = inn2 ? `${inn2.battingTeam} ${inn2.runs}/${inn2.wickets} (${Math.floor(inn2.ballsBowled / 6)}.${inn2.ballsBowled % 6} ov)` : '';

  let potmDetailsEn = 'Outstanding all-round contribution';
  let potmDetailsHi = 'शानदार ऑलराउंड प्रदर्शन';
  let potmDetailsMr = 'उत्कृष्ट अष्टपैलू कामगिरी';

  if (potm) {
    const batPartEn = potm.runs > 0 ? `${potm.runs} runs (${potm.balls || 0}b)` : '';
    const bowlPartEn = potm.wickets > 0 ? `${potm.wickets} wkts (${potm.runsConceded || 0} runs)` : '';
    const partsEn = [batPartEn, bowlPartEn].filter(Boolean);
    if (partsEn.length > 0) potmDetailsEn = partsEn.join(' & ');

    const batPartHi = potm.runs > 0 ? `${potm.runs} रन (${potm.balls || 0} गेंद)` : '';
    const bowlPartHi = potm.wickets > 0 ? `${potm.wickets} विकेट (${potm.runsConceded || 0} रन)` : '';
    const partsHi = [batPartHi, bowlPartHi].filter(Boolean);
    if (partsHi.length > 0) potmDetailsHi = partsHi.join(' व ');

    const batPartMr = potm.runs > 0 ? `${potm.runs} धावा (${potm.balls || 0} चेंडू)` : '';
    const bowlPartMr = potm.wickets > 0 ? `${potm.wickets} बळी (${potm.runsConceded || 0} धावा)` : '';
    const partsMr = [batPartMr, bowlPartMr].filter(Boolean);
    if (partsMr.length > 0) potmDetailsMr = partsMr.join(' आणि ');
  }

  const potmName = potm?.name || 'Star Player';

  let en = '';
  let hi = '';
  let mr = '';

  if (winner === 'Tie') {
    en = `🏆 MATCH RESULT: MATCH TIED! ${winReason}. 🌟 Player of the Match: ${potmName} (${potmDetailsEn}). 📋 Match Summary: ${inn1Desc} vs ${inn2Desc}. An unforgettable thrilling battle!`;
    hi = `🏆 मैच परिणाम: मैच टाई रहा! ${winReason}. 🌟 प्लेयर ऑफ द मैच: ${potmName} (${potmDetailsHi}). 📋 मैच सारांश: ${inn1Desc} बनाम ${inn2Desc}. एक यादगार और रोमांचक मुकाबला!`;
    mr = `🏆 सामन्याचा निकाल: सामना बरोबरीत (Tie) सुटला! ${winReason}. 🌟 सामन्याचा मानकरी (Player of the Match): ${potmName} (${potmDetailsMr}). 📋 सामना सारांश: ${inn1Desc} विरुद्ध ${inn2Desc}. एक थरारक व ऐतिहासिक लढत!`;
  } else {
    en = `🏆 MATCH RESULT: ${winner} won the match (${winReason})! 🌟 Player of the Match: ${potmName} (${potmDetailsEn}). 📋 Match Summary: ${inn1Desc} vs ${inn2Desc}. Heartiest congratulations to ${winner}!`;
    hi = `🏆 मैच परिणाम: ${winner} ने मैच जीत लिया (${winReason})! 🌟 प्लेयर ऑफ द मैच: ${potmName} (${potmDetailsHi}). 📋 मैच सारांश: ${inn1Desc} बनाम ${inn2Desc}. ${winner} को हार्दिक बधाई!`;
    mr = `🏆 सामन्याचा निकाल: ${winner} ने सामना जिंकला (${winReason})! 🌟 सामन्याचा मानकरी (Player of the Match): ${potmName} (${potmDetailsMr}). 📋 सामना सारांश: ${inn1Desc} विरुद्ध ${inn2Desc}. ${winner} संघाचे मनःपूर्वक अभिनंदन!`;
  }

  const lastBalls = inn2?.ballsBowled || inn1?.ballsBowled || 0;
  const overBallStr = `${Math.floor(lastBalls / 6)}.${lastBalls % 6}`;

  return {
    id: `comm-match-won-${Date.now()}`,
    overBall: overBallStr,
    description: en,
    type: 'milestone',
    soundWave: true,
    translations: { en, hi, mr }
  };
}

/* =========================================================================
 * 3. WICKET & MILESTONE SPECIAL TRIGGERS BREAKDOWN
 * ========================================================================= */

export interface SpecialEventBreakdownData {
  batterName?: string;
  batterRuns?: number;
  batterBalls?: number;
  batterFours?: number;
  batterSixes?: number;
  howOut?: string;
  bowlerName?: string;
  fielderName?: string;
  bowlerWickets?: number;
  strikeRate?: string;
}

/**
 * Intercepts major events (wickets, 50s, 100s, hat-tricks) and triggers a highly enthusiastic,
 * detailed breakdown of the achievement, including the batter's total runs and balls faced.
 */
export function interceptSpecialEvent(
  type: 'wicket' | 'fifty' | 'hundred' | 'hat_trick' | 'retire_hurt',
  overBall: string,
  data: SpecialEventBreakdownData
): {
  commentary: CommentaryWithTranslations;
  bannerTitle: string;
  bannerSubtitle: string;
  notification: string;
} {
  const bName = data.batterName || 'Batter';
  const bRuns = data.batterRuns ?? 0;
  const bBalls = data.batterBalls ?? 0;
  const b4s = data.batterFours ?? 0;
  const b6s = data.batterSixes ?? 0;
  const sr = data.strikeRate || (bBalls > 0 ? ((bRuns / bBalls) * 100).toFixed(1) : '0.0');
  const bowl = data.bowlerName || 'Bowler';
  const howOut = data.howOut || 'Out';

  if (type === 'retire_hurt') {
    const en = `🩹 RETIRED HURT: ${bName} is unable to continue due to injury and retires hurt on ${bRuns} runs off ${bBalls} balls (${b4s}x4, ${b6s}x6, SR: ${sr}). Wishing them a swift recovery!`;
    const hi = `🩹 रिटायर्ड हर्ट: चोट के कारण ${bName} को ${bBalls} गेंदों में ${bRuns} रन बनाकर मैदान छोड़ना पड़ा (${b4s} चौके, ${b6s} छक्के, स्ट्राइक रेट: ${sr})। उनके शीघ्र स्वस्थ होने की कामना!`;
    const mr = `🩹 रिटायर्ड हर्ट: दुखापतीमुळे ${bName} यांना ${bBalls} चेंडूत ${bRuns} धावांवर मैदान सोडावे लागले (${b4s} चौकार, ${b6s} षटकार, स्ट्राईक रेट: ${sr})। ते लवकरात लवकर बरे व्हावेत हीच प्रार्थना!`;

    return {
      commentary: {
        id: `milestone-retire-${Date.now()}`,
        overBall,
        description: en,
        type: 'announcement',
        specialEvent: 'retire_hurt',
        translations: { en, hi, mr }
      },
      bannerTitle: `🩹 RETIRED HURT: ${bName.toUpperCase()}`,
      bannerSubtitle: `${bRuns} runs (${bBalls}b, ${b4s}x4, ${b6s}x6, SR: ${sr}) - Retired Injured`,
      notification: `🩹 RETIRED HURT! ${bName} retires hurt on ${bRuns} (${bBalls}b).`
    };
  }

  if (type === 'fifty') {
    const en = `🌟 FIFTY BREAKDOWN: Sensational Half-Century for ${bName}! 50 runs completed in ${bBalls} balls with ${b4s} boundaries and ${b6s} sixes (Strike Rate: ${sr})! What a commanding gully cricket performance!`;
    const hi = `🌟 अर्धशतक विश्लेषण: ${bName} का शानदार अर्धशतक! ${bBalls} गेंदों में ५० रन पूरे, जिसमें ${b4s} चौके और ${b6s} गगनचुंबी छक्के शामिल हैं (स्ट्राइक रेट: ${sr})! मैदान तालियों से गूंज उठा!`;
    const mr = `🌟 अर्धशतक विश्लेषण: ${bName} चे जबरदस्त अर्धशतक! अवघ्या ${bBalls} चेंडूत ५० धावा पूर्ण, ज्यात ${b4s} चौकार आणि ${b6s} उत्तुंग षटकार (स्ट्राईक रेट: ${sr})! प्रेक्षकांकडून उभे राहून जोरदार दाद!`;

    return {
      commentary: {
        id: `milestone-fifty-${Date.now()}`,
        overBall,
        description: en,
        type: 'milestone',
        specialEvent: 'fifty',
        translations: { en, hi, mr }
      },
      bannerTitle: `🌟 50 FOR ${bName.toUpperCase()}!`,
      bannerSubtitle: `${bRuns} runs in ${bBalls} balls (4s: ${b4s}, 6s: ${b6s}, SR: ${sr})`,
      notification: `🌟 FIFTY! ${bName} completes 50 in ${bBalls} balls (SR: ${sr})!`
    };
  }

  if (type === 'hundred') {
    const en = `👑 CENTURY BREAKDOWN: Take a bow, ${bName}! A legendary century of 100 runs in just ${bBalls} balls (${b4s}x4, ${b6s}x6, Strike Rate: ${sr})! Pure street masterclass etched in tournament memory!`;
    const hi = `👑 ऐतिहासिक शतक: सलाम ठोकिए ${bName} को! मात्र ${bBalls} गेंदों में १०० रन पूरे (${b4s} चौके, ${b6s} छक्के, स्ट्राइक रेट: ${sr})! गली क्रिकेट का जादुई और अविस्मरणीय शतक!`;
    const mr = `👑 ऐतिहासिक शतक: मानाचा मुजरा ${bName} ला! अवघ्या ${bBalls} चेंडूत १०० धावा पूर्ण (${b4s} चौकार, ${b6s} षटकार, स्ट्राईक रेट: ${sr})! गल्ली क्रिकेटच्या इतिहासातील अविस्मरणीय सुवर्ण खेळी!`;

    return {
      commentary: {
        id: `milestone-hundred-${Date.now()}`,
        overBall,
        description: en,
        type: 'milestone',
        specialEvent: 'hundred',
        translations: { en, hi, mr }
      },
      bannerTitle: `👑 100 FOR ${bName.toUpperCase()}!`,
      bannerSubtitle: `${bRuns} runs in ${bBalls} balls (${b4s}x4, ${b6s}x6, SR: ${sr})`,
      notification: `👑 HUNDRED! ${bName} smashes a monumental century in ${bBalls} balls!`
    };
  }

  if (type === 'hat_trick') {
    const en = `🔥 HAT-TRICK BREAKDOWN: A historic moment! ${bowl} claims 3 wickets in 3 consecutive deliveries! Complete pandemonium in the street, an extraordinary bowling feat!`;
    const hi = `🔥 हैट्रिक विश्लेषण: ऐतिहासिक पल! ${bowl} ने लगातार ३ गेंदों पर ३ विकेट झटके! गली क्रिकेट में ऐसा कमाल रोज नहीं दिखता, शानदार गेंदबाजी!`;
    const mr = `🔥 हॅटट्रिक विश्लेषण: ऐतिहासिक पराक्रम! ${bowl} ने सलग ३ चेंडूत ३ बळी टिपले! मैदानात एकच जल्लोष, तुफानी आणि भेदक मारा!`;

    return {
      commentary: {
        id: `milestone-hattrick-${Date.now()}`,
        overBall,
        description: en,
        type: 'milestone',
        specialEvent: 'hat_trick',
        translations: { en, hi, mr }
      },
      bannerTitle: `🔥 HAT-TRICK FOR ${bowl.toUpperCase()}!`,
      bannerSubtitle: `3 wickets in 3 consecutive deliveries!`,
      notification: `🔥 HAT-TRICK! ${bowl} takes 3 wickets in 3 balls!`
    };
  }

  // Default: Wicket breakdown
  const en = `🚨 WICKET BREAKDOWN: ${bName} is out for ${bRuns} runs off ${bBalls} balls (${b4s}x4, ${b6s}x6, SR: ${sr})! Dismissal: ${howOut} by ${bowl}. Big blow for the batting side!`;
  const hi = `🚨 विकेट विश्लेषण: ${bName} ${bBalls} गेंदों में ${bRuns} रन बनाकर आउट (${b4s} चौके, ${b6s} छक्के, स्ट्राइक रेट: ${sr})! विकेट: ${howOut} (गेंदबाज: ${bowl}). बड़ा झटका!`;
  const mr = `🚨 विकेट विश्लेषण: ${bName} ${bBalls} चेंडूत ${bRuns} धावांवर बाद (${b4s} चौकार, ${b6s} षटकार, स्ट्राईक रेट: ${sr})! बाद प्रकार: ${howOut} (गोलंदाज: ${bowl}). संघाला मोठा धक्का!`;

  return {
    commentary: {
      id: `milestone-wicket-${Date.now()}`,
      overBall,
      description: en,
      type: 'wicket',
      specialEvent: 'wicket',
      translations: { en, hi, mr }
    },
    bannerTitle: `OUT: ${bName.toUpperCase()}`,
    bannerSubtitle: `${bRuns} (${bBalls}b, ${b4s}x4, ${b6s}x6, SR: ${sr}) - b ${bowl}`,
    notification: `OUT! ${bName} dismissed for ${bRuns} (${bBalls}b) by ${bowl}.`
  };
}

/**
 * Contextual Tone Shifter visual badge and banner for commentary UI
 */
export function ContextualToneShifterBadge({
  toneInfo,
  language = 'en',
  compact = false
}: {
  toneInfo: ContextualToneInfo;
  language?: CommentaryLanguage;
  compact?: boolean;
}) {
  if (!toneInfo) return null;
  const label = toneInfo.label[language] || toneInfo.label.en;
  const description = toneInfo.description[language] || toneInfo.description.en;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-wider ${toneInfo.badgeClass}`}>
        <span>{toneInfo.shortTag}</span>
        {toneInfo.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      </div>
    );
  }

  return (
    <div className={`p-2 rounded-xl border transition-all ${toneInfo.borderClass} ${toneInfo.badgeClass} relative overflow-hidden shadow-xs`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[8.5px] font-black uppercase tracking-wider">{toneInfo.shortTag}</span>
          <span className="text-[7.5px] opacity-80 font-bold">({label})</span>
        </div>
        {toneInfo.pulse ? (
          <span className="flex items-center gap-1 text-[7px] font-mono font-bold uppercase tracking-widest text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
            HIGH OCTANE
          </span>
        ) : (
          <span className="text-[7px] font-mono opacity-60 uppercase tracking-widest">
            AI TONE
          </span>
        )}
      </div>
      <p className="text-[8.5px] mt-0.5 opacity-95 leading-snug font-medium font-sans">{description}</p>
    </div>
  );
}
