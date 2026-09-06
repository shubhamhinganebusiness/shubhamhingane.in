let aiClient: any = null;

const generateSmartLocalResponse = (userMessage: string, language: string): string => {
  const query = userMessage.toLowerCase().trim();
  const lang = (language || 'en').toLowerCase();

  // Keyword maps
  const isGreeting = (q: string) => {
    return q.includes('hi') || q.includes('hello') || q.includes('hey') || 
           q.includes('namaste') || q.includes('greeting') || q.includes('how are you') || 
           q.includes('good morning') || q.includes('good afternoon') || q.includes('good evening') ||
           q.includes('नमस्कार') || q.includes('नमस्ते') || q.includes('hello') || q.includes('hy');
  };

  const isExperience = (q: string) => {
    return q.includes('experience') || q.includes('work') || q.includes('job') || 
           q.includes('career') || q.includes('resume') || q.includes('history') || 
           q.includes('past') || q.includes('employed') || q.includes('senior') || 
           q.includes('engineer') || q.includes('google') || q.includes('meta') || 
           q.includes('upwork') || q.includes('freelance') || q.includes('करिअर') || 
           q.includes('अनुभव') || q.includes('कामे') || q.includes('नौकरी') ||
           q.includes('शर्म') || q.includes('काम') || q.includes('नोकरी');
  };

  const isEducation = (q: string) => {
    return q.includes('education') || q.includes('college') || q.includes('study') || 
           q.includes('degree') || q.includes('university') || q.includes('math') || 
           q.includes('physics') || q.includes('science') || q.includes('school') || 
           q.includes('certificate') || q.includes('certifications') || q.includes('qualification') ||
           q.includes('शिक्षण') || q.includes('पदवी') || q.includes('कॉलेज') || 
           q.includes('शाळा') || q.includes('प्रमाणपत्र') || q.includes('शिक्षा');
  };

  const isSkills = (q: string) => {
    return q.includes('skills') || q.includes('technologies') || q.includes('stack') || 
           q.includes('frontend') || q.includes('backend') || q.includes('react') || 
           q.includes('node') || q.includes('typescript') || q.includes('cloud') || 
           q.includes('database') || q.includes('postgresql') || q.includes('tailwind') || 
           q.includes('flutter') || q.includes('obs') || q.includes('premiere') || 
           q.includes('figma') || q.includes('development') || q.includes('editing') ||
           q.includes('कौशल्या') || q.includes('कौशल्ये') || q.includes('तंत्रज्ञान') || 
           q.includes('टूल्स');
  };

  const isProjects = (q: string) => {
    return q.includes('project') || q.includes('portfolio') || q.includes('dairy') || 
           q.includes('gullyscore') || q.includes('cricket') || q.includes('auction') || 
           q.includes('medical') || q.includes('prescription') || q.includes('agriculture') || 
           q.includes('billing') || q.includes('erp') || q.includes('vidyalaya') || 
           q.includes('mess') || q.includes('app') || q.includes('website') ||
           q.includes('प्रकल्प') || q.includes('कामगिरी');
  };

  const isCourses = (q: string) => {
    return q.includes('course') || q.includes('learn') || q.includes('teach') || 
           q.includes('class') || q.includes('academy') || q.includes('enroll') || 
           q.includes('price') || q.includes('cost') || q.includes('fee') || q.includes('syllabus') ||
           q.includes('कोर्स') || q.includes('शिकायचे') || q.includes('क्लास');
  };

  const isContact = (q: string) => {
    return q.includes('contact') || q.includes('email') || q.includes('touch') || 
           q.includes('phone') || q.includes('hire') || q.includes('message') || 
           q.includes('address') || q.includes('pune') || q.includes('location') || 
           q.includes('reach') || q.includes('social') || q.includes('mail') ||
           q.includes('पत्ता') || q.includes('संपर्क') || q.includes('फोन') || 
           q.includes('ईमेल') || q.includes('मिळवा') || q.includes('पुणे');
  };

  // Marathi Response Generator
  if (lang === 'mr') {
    if (isGreeting(query)) {
      return "नमस्कार! मी शुभम हिंगणे यांचा व्हर्च्युअल एआय सहाय्यक आहे. 🌟 आज मी तुम्हाला कशी मदत करू शकतो? तुम्ही मला याबद्दल विचारू शकता:\n\n" +
             "• 💼 **कामाचा अनुभव (Experience)** - शुभम यांचे करिअर आणि कामाचा इतिहास\n" +
             "• 🎓 **शिक्षण (Education)** - पदवी, कॉलेज आणि प्रमाणपत्रे\n" +
             "• 🚀 **प्रकल्पे (Projects)** - मुख्य डिजिटल सॉफ्टवेअर (Dairy, Gull Score, ERP)\n" +
             "• 🛠️ **कौशल्ये (Skills)** - प्रोग्रामिंग भाषा आणि मल्टिमीडिया टूल्स\n" +
             "• 📖 **अभ्यासक्रम (Courses)** - ट्रेनिंग कोर्सेस आणि फी माहिती\n" +
             "• ✉️ **संपर्क (Contact)** - थेट संवाद आणि ईमेल!";
    }
    if (isExperience(query)) {
      return "शुभम हिंगणे यांच्याकडे **७+ वर्षांचा उत्कृष्ट व्यावसायिक अनुभव** आहे:\n\n" +
             "• 💻 **सिनियर सॉफ्टवेअर इंजिनिअर (Google)** (२०२० - चालू): क्लाउड, सिस्टीम डेव्हलपमेंट आणि पूर्ण-स्टॅक तंत्रज्ञानाचे नेतृत्व.\n" +
             "• 🌐 **वेब डेव्हलपर (Meta)** (२०१८ - २०२०): प्रगत डेटा आर्किटेक्चर आणि हाय-परफॉर्मन्स वेगवान वेब प्रणालींची उभारणी.\n" +
             "• 🚀 **फ्रीलान्स काम (Upwork)** (२०१६ - चालू): जगभरातील क्लायंट्ससाठी क्रिएटिव्ह लीड आणि तंत्रज्ञान सल्लागार म्हणून कार्यप्रणाली.\n\n" +
             "त्यांपैकी सविस्तर माहितीसाठी नक्कीच **Resume** विभागाला भेट द्या!";
    }
    if (isEducation(query)) {
      return "शुभम हिंगणे यांचे शैक्षणिक पात्रता सविस्तर खालीलप्रमाणे आहे:\n\n" +
             "• 🎓 **कॉम्प्युटर अभियांत्रिकी पदवी (Bachelor of Computer Engineering)** - University of Technology (२०१४ - २०१८)\n" +
             "• 🏫 **उच्च माध्यमिक शिक्षण (HSC - Science)** - सायन्स कॉलेज (२०१२ - २०१४)\n" +
             "• 🏆 **व्यावसायिक प्रमाणपत्रे**: Google Cloud Certified Professional आणि Coursera कडून Full Stack Web Development प्रमाणपत्र.\n\n" +
             "अधिक तपशीलांसाठी **Resume** विभागातील **Education** टॅब नक्की पहा!";
    }
    if (isSkills(query)) {
      return "शुभम हिंगणे खालील आधुनिक तांत्रिक कौशल्यांमध्ये पारंगत आहेत:\n\n" +
             "• 💻 **डेव्हलपमेंट**: React, Node.js, TypeScript, Next.js, PostgreSQL, MongoDB, Python, AWS, Flutter, Firebase.\n" +
             "• 🎨 **ग्राफिक्स आणि ब्रॉडकास्टिंग**: OBS Studio, Adobe Premiere Pro, After Effects, DaVinci Resolve, vMix, Audition, Figma.\n\n" +
             "ते व्यावसायिक दर्जाच्या वेब प्रणाली, मोबाईल ॲप्स आणि उच्च दर्जाचे थेट प्रक्षेपण सोल्यूशन्स तयार करण्यात उत्कृष्ट आहेत.";
    }
    if (isProjects(query)) {
      return "शुभम यांनी विकसित केलेले मुख्य आणि प्रत्यक्ष वापरले जाणारे प्रकल्प खालीलप्रमाणे आहेत:\n\n" +
             "• 🥛 **डेअरी मॅनेजमेंट सिस्टीम (Dairy Management System)**: दूध संकलन नोंदी, लेजर अहवाल आणि थेट बिल प्रिंटिंग सिस्टीम.\n" +
             "• 🏏 **GullyScore क्रिकेट सिरीज**: \n" +
             "  1. *Cricket Scoreboard*: स्थानिक क्रिकेट सामन्यांचे थेट रन्स आणि विकेट्स ट्रैकिंग.\n" +
             "  2. *Live Player Auction Suite*: खेळाडूंच्या थेट बोलीसाठी लीग-आधारित आकर्षक सॉफ्टवेअर.\n" +
             "• 💊 **MedPrescription**: डॉक्टर प्रीस्क्रिप्शन क्रिएटर आणि पेशंट डेटाबेस मॅनेजमेंट.\n" +
             "• 🏫 **स्कूल ERP (Vidyalaya)**: केंद्रीय उपस्थिती रेकॉर्ड, फी व्यवस्थापन आणि आकर्षक पीडीएफ प्रमाणपत्र निर्मितीचे साधन.\n" +
             "• 📰 **न्यूज बिझनेस लाँचपॅड**: न्यूज एजन्सी सुरू करण्यासाठी विधी आणि तांत्रिक साह्य.\n\n" +
             "सर्व प्रकल्पांचे थेट डेमो उपलब्ध आहेत. तुम्ही **Portfolio** सेक्शन मध्ये हे प्रत्यक्ष वापरून पाहू शकता!";
    }
    if (isCourses(query)) {
      return "शुभम त्यांच्या मार्गदर्शनाखाली खालील दर्जेदार कोर्सेस चालवतात:\n\n" +
             "1. 💻 **Full Stack Development** (६ महिने - $२९९): React, Node.js आणि MongoDB पूर्ण प्रॅक्टिकल सह.\n" +
             "2. 🎨 **UI/UX Design Masterclass** (३ महिने - $१९९): फिग्मा, वापरकर्त्याचा अनुभव डिझाइन आणि प्रत्यक्ष प्रकल्प काम.\n" +
             "3. 📈 **Digital Marketing Strategy** (२ महिने - $१४९): SEO, जाहिराती आणि डिजिटल ग्रोथ.\n\n" +
             "सविस्तर अभ्यासक्रम पाहण्यासाठी आणि नोंदणी करण्यासाठी मुख्य स्क्रीनवरील **Courses** विभाग पहा!";
    }
    if (isContact(query)) {
      return "तुम्ही शुभम हिंगणे यांच्याशी खालील मार्गांनी संपर्क साधू शकता:\n\n" +
             "• ✉️ **थेट ईमेल**: [Shubhamhingane7719@gmail.com](mailto:Shubhamhingane7719@gmail.com)\n" +
             "• 📍 **पत्ता**: पुणे, महाराष्ट्र, भारत\n" +
             "• 💼 खालील **Contact** अर्ज भरून पाठवू शकता किंवा चॅट सुरू झाल्यानंतर हेडरमधील **Hire Me** वर क्लिक करून त्वरित बैठक बुक करू शकता!";
    }

    return "शुभम हिंगणे हे पुण्यातील एक प्रगत कॉम्प्युटर इंजिनिअर आणि सिनियर सॉफ्टवेअर डेव्हलपर आहेत. ते कोणत्याही प्रकारची डिजिटल सोल्यूशन्स (सॉफ्टवेअर, प्रगत वेबसाईट्स, आणि थेट प्रक्षेपण व्यवस्थापन) बनवण्यासाठी सक्षम आहेत.\n\n" +
           "तुम्ही त्यांच्या करिअर, शिक्षण, प्रकल्प किंवा कोर्सेस बद्दल कोणतीही माहिती नक्कीच विचारू शकता किंवा थेट **Shubhamhingane7719@gmail.com** वर संपर्क साधू शकता!";
  }

  // Hindi Response Generator
  if (lang === 'hi') {
    if (isGreeting(query)) {
      return "नमस्ते! मैं शुभम हिंगणे का वर्चुअल एआई सहायक हूँ। 🌟 आज मैं आपकी क्या मदद कर सकता हूँ? आप मुझसे पूछ सकते हैं:\n\n" +
             "• 💼 **अनुभव (Experience)** - शुभम हिंगणे के करियर और जॉब हिस्ट्री के बारे में\n" +
             "• 🎓 **शिक्षा (Education)** - उनकी डिग्री, कॉलेज और सर्टिफिकेशन्स\n" +
             "• 🚀 **प्रोजेक्ट्स (Projects)** - उनके मुख्य डिजिटल समाधान (Dairy, Gull Score, ERP)\n" +
             "• 🛠️ **स्किल्स (Skills)** - उनकी मुख्य प्रोग्रामिंग लैंग्वेज और क्रिएटिव टूल्स\n" +
             "• 📖 **कोर्सेज (Courses)** - उनके द्वारा संचालित प्रोफेशनल ट्रेनिंग प्रोग्राम्स\n" +
             "• ✉️ **संपर्क (Contact)** - ईमेल और संपर्क की माध्यम";
    }
    if (isExperience(query)) {
      return "शुभम हिंगणे के पास **7 से अधिक वर्षों का शानदार पेशेवर अनुभव** है:\n\n" +
             "• 💻 **वरिष्ठ सॉफ्टवेयर इंजीनियर (Google)** (2020 - वर्तमान): क्लाउड सिस्टम आर्किटेक्चर और मजबूत फुल-स्टैक सॉल्यूशंस का निर्माण।\n" +
             "• 🌐 **वेब डेवलपर (Meta)** (2018 - 2020): हाई-परफॉर्मेंस रिस्पॉन्सिव वेब प्लेटफॉर्म और डेटाबेस आर्किटेक्चर विकसित करना।\n" +
             "• 🚀 **फ्रीलांस विशेषज्ञ (Upwork)** (2016 - वर्तमान): क्रिएटिव लीड और ऐप कंसल्टेंट के रूप में वैश्विक स्तर पर कार्यरत।\n\n" +
             "विस्तृत जानकारी के लिए आप मुख्य स्क्रीन पर **Resume** सेक्शन देख सकते हैं!";
    }
    if (isEducation(query)) {
      return "शुभम की शैक्षणिक योग्यता उत्कृष्ट और व्यापक है:\n\n" +
             "• 🎓 **कंप्यूटर इंजीनियरिंग डिग्री (Bachelor of Computer Engineering)** - University of Technology (2014 - 2018)\n" +
             "• 🏫 **हायर सेकेंडरी / साइंस कॉलेज** (2012 - 2014)\n" +
             "• 🏆 **पेशेवर प्रमाणपत्र**: Google क्लाउड सर्टिफाइड एसोसिएट, साथ ही Coursera से फुल-स्टैक डेवलपमेंट सर्टिफिकेशन।\n\n" +
             "जानकारी के लिए आप **Resume** सेक्शन में **Education** टैब पर जा सकते हैं!";
    }
    if (isSkills(query)) {
      return "शुभम हिंगणे आधुनिक पूर्ण-स्टैक और रचनात्मक कौशल में पारंगत हैं:\n\n" +
             "• 💻 **डेवलपमेंट स्किल्स**: React, Node.js, TypeScript, Next.js, PostgreSQL, MongoDB, Python, AWS, Flutter, Firebase.\n" +
             "• 🎨 **डिजाइन और एडिटिंग**: OBS Studio, Adobe Premiere Pro, After Effects, DaVinci Resolve, vMix, Audition, Figma.\n\n" +
             "वे तकनीकी विकास और रचनात्मक डिजिटल संपादन दोनों को एक साथ संभालने के लिए पूरी तरह सक्षम हैं।";
    }
    if (isProjects(query)) {
      return "शुभम ने कई अनूठे एंटरप्राइज-ग्रेड और व्यावहारिक प्रोजेक्ट्स बनाए हैं:\n\n" +
             "• 🥛 **डेयरी मैनेजमेंट सिस्टम (Dairy System)**: दूध कलेक्शन रिकॉर्ड, स्वतः बिल जनरेटर और लेजर लेखा-जोखा प्रणाली।\n" +
             "• 🏏 **GullyScore क्रिकेट सीरीज़**: \n" +
             "  1. *Cricket Scoreboard*: स्थानीय टूर्नामेंट के लिए रन और विकेट्स ट्रैकर।\n" +
             "  2. *Player Auction Suite*: क्रिकेट लीग के लिए रीयल-टाइम लाइव खिलाड़ियों की बोली का आकर्षक सॉफ्टवेयर।\n" +
             "• 💊 **MedPrescription**: डिजिटल मेडिकल समाधान, जिसमें नैदानिक डेटाबेस और डॉक्टर प्रिस्क्रिप्शन क्रिएटर शामिल हैं।\n" +
             "• 🏫 **स्कूल ERP (विद्यालाया)**: छात्र उपस्थिति रिकॉर्ड, ऑनलाइन फीस ट्रैकर, और डिजिटल सर्टिफिकेट जनरेटर।\n" +
             "• 📰 **न्यूज़ लॉन्चर (News Launchpad)**: डिजिटल न्यूज़ पोर्टल और कानूनी पंजीकरण के लिए एंड-टू-एंड सहायता।\n\n" +
             "सभी प्रोजेक्ट्स के लाइव डेमो उपलब्ध हैं। आप **Portfolio** सेक्शन पर जाकर इनका अनुभव कर सकते हैं!";
    }
    if (isCourses(query)) {
      return "शुभम अपने लर्निंग सेंटर के माध्यम से निम्नलिखित कोर्सेज सिखाते हैं:\n\n" +
             "1. 💻 **Full Stack Development** (6 महीने - $299): React, Node.js और MongoDB पूर्ण प्रैक्टिकल प्रोजेक्ट्स के साथ।\n" +
             "2. 🎨 **UI/UX Design Masterclass** (3 महीने - $199): फिग्मा, वायरफ्रेमिंग और वास्तविक विकास।\n" +
             "3. 📈 **Digital Marketing Strategy** (2 महीने - $149): सर्च इंजन ऑप्टिमाइजेशन (SEO) और सोशल मीडिया विज्ञापन।\n\n" +
             "योग्यता और प्रवेश विवरण के लिए वेबसाइट के **Courses** भाग पर क्लिक करें!";
    }
    if (isContact(query)) {
      return "आप शुभम हिंगणे से नीचे दिए गए तरीकों से संपर्क कर सकते हैं:\n\n" +
             "• ✉️ **सीधा ईमेल**: [Shubhamhingane7719@gmail.com](mailto:Shubhamhingane7719@gmail.com)\n" +
             "• 📍 **स्थान**: पुणे, महाराष्ट्र, भारत\n" +
             "• 💼 आप नीचे दिए गए **Contact** फ़ॉर्म को भर सकते हैं या मुख्य हेडर में **Hire Me** पर क्लिक कर के तुरंत इंटरव्यू कॉल बुक कर सकते हैं!";
    }

    return "शुभम हिंगणे पुणे, भारत में स्थित एक शीर्ष कंप्यूटर इंजीनियर और सीनियर वेब डेवलपर हैं। वे विज्ञान-तकनीकी विकास (React, Node, Cloud) और शानदार उत्पादन मीडिया (लाइव ब्रॉडकास्टिंग, प्रीमियर वीडियो एडिटिंग) दोनों में विशेषज्ञता रखते हैं।\n\n" +
           "आप उनसे जुड़े करियर, कोर्सेज या प्रोजेक्ट्स के बारे में कुछ भी पूछ सकते हैं, या सीधे **Shubhamhingane7719@gmail.com** पर ईमेल भेज सकते हैं!";
  }

  // English Response Generator (Default)
  if (isGreeting(query)) {
    return "Hello! I am Shubham Hingane's Virtual AI assistant. 🌟 How can I help you today? You can ask me about:\n\n" +
           "• 💼 **My Experience** - Shubham's career journey and prior jobs (Google, Meta)\n" +
           "• 🎓 **My Education** - His college degree, certifications, and academic training\n" +
           "• 🚀 **Featured Projects** - Industrial software such as Dairy System, GullyScore Series, Vidyalaya ERP\n" +
           "• 🛠️ **Developer Skills** - Tech stack and software tools\n" +
           "• 📖 **Professional Courses** - MERN development, UI/UX design, or marketing training syllabus\n" +
           "• ✉️ **Contact Details** - Direct email addresses and appointment scheduling!";
  }
  if (isExperience(query)) {
    return "Shubham Hingane has **over 7 years of high-performing professional experience**:\n\n" +
           "• 💻 **Senior Software Engineer at Google** (2020 - Current): Architecting and deploying robust cloud-native enterprise tools and full-stack software.\n" +
           "• 🌐 **Web Developer at Meta** (2018 - 2020): Engineered scale-friendly responsive user interfaces and robust internal microservices.\n" +
           "• 🚀 **Freelance Creative Lead on Upwork** (2016 - Current): Working for various global brands as an app consultant and system designer.\n\n" +
           "You can browse through his detailed professional history inside the **Resume** section!";
  }
  if (isEducation(query)) {
    return "Shubham has a robust educational background and active credentials:\n\n" +
           "• 🎓 **Bachelor of Computer Engineering** - University of Technology (2014 - 2018)\n" +
           "• 🏫 **Higher Secondary Science** - Science College (2012 - 2014)\n" +
           "• 🏆 **Professional Certifications**: Google Cloud Certified Associate, and Full Stack Web Development from Coursera.\n\n" +
           "You can view these credentials under the **Education** tab of the **Resume** section!";
  }
  if (isSkills(query)) {
    return "Shubham has specialized expertise across two modern domains:\n\n" +
           "• 💻 **Programming & Web**: React, Node.js, TypeScript, Next.js, PostgreSQL, MongoDB, Python, Amazon Web Services (AWS), Flutter, and Firebase.\n" +
           "• 🎬 **Broadcasting & Creative**: OBS Studio, Adobe Premiere Pro, After Effects, DaVinci Resolve, vMix, Audition, and Figma.\n\n" +
           "This rare combination makes him uniquely suited for complex, full-scale multimedia software architectures!";
  }
  if (isProjects(query)) {
    return "Shubham has developed several outstanding corporate and consumer applications available in his portfolio:\n\n" +
           "• 🥛 **Dairy Management System**: Multi-user milk logging logs, automated balance sheets, ledgers, and printable collection invoice generators.\n" +
           "• 🏏 **GullyScore Cricket Suite**: \n" +
           "  1. *Cricket Scoreboard*: Live scorekeeper for local community matches (overs, wickets, runs).\n" +
           "  2. *Live Player Auction*: Interactive bidding board with real-time budget calculations for sports teams.\n" +
           "• 💊 **MedPrescription**: Digital doctor prescriptions, medication catalogs, and electronic patient history records.\n" +
           "• 🏫 **School ERP (Vidyalaya)**: Academic database grid, localized student registers, term-wise exam logs, and PDF certificate builders.\n" +
           "• 📰 **News Business Launchpad**: End-to-end technical platforms, legal checklists, and design setups for launching high-traffic media portals.\n" +
           "• 🍱 **Mess Management / Agriculture Billing Systems**.\n\n" +
           "You can explore fully interactive mockups and run live demos of each of these inside his **Portfolio**!";
  }
  if (isCourses(query)) {
    return "Shubham leads several high-demand technical training programs at his academy:\n\n" +
           "1. 💻 **Full Stack Development** (6 Months - $299): Structured MERN stack curriculum (React, Node, Mongo) with hands-on projects and 1-on-1 mentoring.\n" +
           "2. 🎨 **UI/UX Design Masterclass** (3 Months - $199): High-fidelity Figma wireframing, component libraries, and client design patterns.\n" +
           "3. 📈 **Digital Marketing Strategy** (2 Months - $149): Specialized course on Google Ads, Meta Ads campaigns, and organic SEO growth models.\n\n" +
           "Refer directly to the **Courses** section on the main page to see syllabus checklists or apply!";
  }
  if (isContact(query)) {
    return "You can get in touch with Shubham Hingane immediately through the following channels:\n\n" +
           "• ✉️ **Direct Email**: [Shubhamhingane7719@gmail.com](mailto:Shubhamhingane7719@gmail.com)\n" +
           "• 📍 **Primary Location**: Pune, Maharashtra, India\n" +
           "• 💼 You can also fill out the **Contact Form** at the bottom of the page, or click the **Hire Me** button to request custom contract or project pricing!";
  }

  return "Shubham Hingane is a high-performing Computer Engineer and Software Developer based in Pune, India, specializing in React, Node, Cloud systems, and professional digital broadcasting solutions.\n\n" +
         "Feel free to ask me more specific questions about his professional background, projects, skill details, or email him directly at **Shubhamhingane7719@gmail.com**!";
};

export const getGeminiResponse = async (userMessage: string, portfolioData: any, language: string) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        portfolioData,
        language,
      }),
    });

    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return data.text || "I'm sorry, I couldn't generate a response.";
      } else {
        throw new Error("Server responded with HTML/Non-JSON instead of API. Likely static Hostinger context.");
      }
    }

    // Server-side /api/chat returned status error, throw to proceed to direct client-side fallback
    throw new Error(`Server returned error status ${response.status}`);
  } catch (error) {
    console.warn("Express API failed, attempting direct client-side Gemini fallback...", error);

    // Retrieve API key replaced by Vite at build time via define block or runtime check
    let apiKey = '';
    try {
      apiKey = process.env.GEMINI_API_KEY || '';
    } catch (e) {
      // process is not defined in browser
    }

    if (!apiKey) {
      try {
        apiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || '';
      } catch (e) {
        // import.meta.env or VITE_GEMINI_API_KEY is not defined
      }
    }

    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // Friendly, professional high-quality local chatbot fallback
      return generateSmartLocalResponse(userMessage, language);
    }

    try {
      const systemInstruction = `
        You are an AI assistant for Shubham Hingane, a Software Developer and Computer Engineer.
        Your goal is to help visitors learn more about Shubham, his services, skills, and projects.
        
        Current Language: ${language}
        
        PORTFOLIO CONTEXT:
        ${JSON.stringify(portfolioData)}
        
        INSTRUCTIONS:
        - Answer in the same language as the user is asking (${language}).
        - Be professional, friendly, and helpful.
        - If you don't know something, suggest they contact Shubham through the contact form.
        - Keep responses relatively concise but informative.
        - Do not mention that you have context in JSON format. Just act as a knowledgeable assistant.
      `;

      // Try valid models in sequence on client-side
      const modelsToTry = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-flash-latest", "gemini-2.5-flash"];
      let generatedText = null;
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const directResponse = await fetch(directUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: userMessage }] }],
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              }
            }),
          });

          if (directResponse.ok) {
            const directData = await directResponse.json();
            generatedText = directData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (generatedText) {
              console.log(`Successfully generated chat response using client fallback model: ${model}`);
              break;
            }
          } else {
            console.warn(`Direct model ${model} returned error code ${directResponse.status}`);
          }
        } catch (e: any) {
          lastError = e;
          console.warn(`Direct model ${model} failed:`, e);
        }
      }

      if (generatedText) {
        return generatedText;
      }
      throw lastError || new Error("All client side direct models failed");
    } catch (fallbackError) {
      console.error("Direct client-side fallback failed, using local conversational search:", fallbackError);
      return generateSmartLocalResponse(userMessage, language);
    }
  }
};


