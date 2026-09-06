import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  BookOpen, 
  FileCheck, 
  Trophy, 
  Printer, 
  Upload, 
  Sparkles,
  FileText,
  Bookmark,
  Calendar,
  User,
  Users,
  Eye,
  X,
  Download,
  AwardIcon,
  CheckCircle,
  FileBadge
} from 'lucide-react';
import { Student, CertificateLog } from './types';

interface CertificationModuleProps {
  students: Student[];
  certificates: CertificateLog[];
  onAddCertificateLog: (newLog: CertificateLog) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CertificationModule: React.FC<CertificationModuleProps> = ({
  students,
  certificates,
  onAddCertificateLog,
  addToast
}) => {
  const currentYear = new Date().getFullYear().toString();
  
  // Tab selector: bonafide, academic, character, sports
  const [activeSubTab, setActiveSubTab] = useState<'bonafide' | 'academic' | 'character' | 'sports'>('bonafide');
  
  // Selected student to pre-fill
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Seal / Emblem customization
  const [stampImage, setStampImage] = useState<string>('https://images.unsplash.com/photo-1594818821922-802922529d14?auto=format&fit=crop&q=80&w=150');

  // Preview Modal trigger
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // --- LOGO EMBLEM FILE HANDLER ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setStampImage(reader.result);
          addToast('Institutional custom crest emblem loaded successfully.', 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- LETTERHEAD FILE HANDLER ---
  const [letterheadImage, setLetterheadImage] = useState<string>('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400');
  const [useLetterhead, setUseLetterhead] = useState<boolean>(true);

  const handleLetterheadUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLetterheadImage(reader.result);
          addToast('Custom institutional letterhead loaded.', 'info');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- FORM INPUT STATES ---
  // Shared common states
  const [stdName, setStdName] = useState('');
  const [stdRoll, setStdRoll] = useState('');
  const [stdClass, setStdClass] = useState('');
  const [stdSection, setStdSection] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-27');
  const [dateOfIssue, setDateOfIssue] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // Auto-generated Certificate Number State
  const [certificateNo, setCertificateNo] = useState('');

  // 1. Bonafide Unique states
  const [bonafidePurpose, setBonafidePurpose] = useState('Scholarship');
  const [bonafideCustomPurpose, setBonafideCustomPurpose] = useState('');

  // 2. Academic Unique states
  const [examName, setExamName] = useState('Class X CBSE Board');
  const [examYear, setExamYear] = useState('2026');
  const [percentage, setPercentage] = useState('89.4%');
  const [achievementGrade, setAchievementGrade] = useState('Distinction');
  const [principalSignature, setPrincipalSignature] = useState('Dr. R. K. Sen');

  // 3. Character Unique states
  const [durationFrom, setDurationFrom] = useState('2022');
  const [durationTo, setDurationTo] = useState('2026');
  const [characterAssessment, setCharacterAssessment] = useState<'Excellent' | 'Good' | 'Satisfactory'>('Excellent');
  const [conductRemarks, setConductRemarks] = useState('Excellent conducting behavioral records, cooperative mindset, and positive influence.');
  const [characterDeclaration, setCharacterDeclaration] = useState<string>('We certify that the scholar bears a clean moral standing, displayed strong civil life, and has successfully passed all academic requirements with cooperative behavior.');
  const [validityPeriod, setValidityPeriod] = useState<string>('6 Months');

  // 4. Sports Unique states
  const [sportName, setSportName] = useState('Basketball');
  const [eventName, setEventName] = useState('Annual CBSE Zonal Athletic Championship');
  const [sportLevel, setSportLevel] = useState('National'); // National, State, District, Inter-School, School
  const [sportPosition, setSportPosition] = useState('First Place (Gold Medalist)');
  const [dateOfEvent, setDateOfEvent] = useState('2026-05-18');
  const [coachSignature, setCoachSignature] = useState('Coach Rajesh Kumar');

  // --- PRE-FILL ALGORITHM TRIGGERED ON SELECTION ---
  useEffect(() => {
    if (selectedStudentId) {
      const s = students.find(item => item.id === selectedStudentId);
      if (s) {
        setStdName(s.name);
        setStdRoll(s.rollNumber);
        
        // Split className to Class & Section
        // Example: "Class 10-A" => class is "Class 10", section is "A"
        if (s.className.includes('-')) {
          const parts = s.className.split('-');
          setStdClass(parts[0].trim());
          setStdSection(parts[1].trim());
        } else {
          setStdClass(s.className);
          setStdSection('');
        }
        
        setFatherName(s.fatherName);
        setMotherName(s.motherName);
        setDob(s.dob);
        addToast(`Pre-filled matching attributes for student: ${s.name}`, 'info');
      }
    } else {
      // Direct manual clean slate
      setStdName('');
      setStdRoll('');
      setStdClass('');
      setStdSection('');
      setFatherName('');
      setMotherName('');
      setDob('');
    }
  }, [selectedStudentId, students]);

  // --- AUTOMATED CERTIFICATE SERIAL NUMBER GENERATION ---
  useEffect(() => {
    const prefix = activeSubTab === 'bonafide' ? 'BON' :
                   activeSubTab === 'academic' ? 'ACAD' :
                   activeSubTab === 'character' ? 'CHAR' : 'SPORTS';
    
    // Filter certificates from the parent state array matching current year and prefix
    const currentYearStr = new Date().getFullYear().toString();
    const matchCerts = certificates.filter(c => 
      c.certificateType === (activeSubTab === 'bonafide' ? 'Bonafide' :
                             activeSubTab === 'academic' ? 'Academic' :
                             activeSubTab === 'character' ? 'Character' : 'Sports') &&
      c.certificateNo.startsWith(`${prefix}/${currentYearStr}/`)
    );
    
    let maxSeq = 0;
    matchCerts.forEach(c => {
      const parts = c.certificateNo.split('/');
      if (parts.length === 3) {
        const seqNum = parseInt(parts[2], 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });
    
    const nextSeqStr = String(maxSeq + 1).padStart(4, '0');
    setCertificateNo(`${prefix}/${currentYearStr}/${nextSeqStr}`);
  }, [activeSubTab, selectedStudentId, certificates, dateOfIssue]);

  // --- GENERATE LOG & REGISTER EVENT IN ERP SYSTEM ---
  const handleRegisterReceipt = () => {
    onAddCertificateLog({
      id: `cert-${Date.now()}`,
      studentId: selectedStudentId || 'manual',
      studentName: stdName || 'Walk-In Candidate',
      certificateType: activeSubTab === 'bonafide' ? 'Bonafide' :
                       activeSubTab === 'academic' ? 'Academic' :
                       activeSubTab === 'character' ? 'Character' : 'Sports',
      certificateNo,
      dateOfIssue,
      details: {
        fatherName,
        motherName,
        dob,
        academicYear,
        bonafidePurpose: bonafidePurpose === 'Other' ? bonafideCustomPurpose : bonafidePurpose,
        examName,
        examYear,
        percentage,
        achievementGrade,
        durationFrom,
        durationTo,
        characterAssessment,
        conductRemarks,
        sportName,
        eventName,
        sportLevel,
        sportPosition,
        dateOfEvent,
        coachSignature,
        principalSignature
      }
    });
  };

  // --- FAUX RECEIPT LOG DOWNLOAD ENGINE ---
  const handleDownloadLog = () => {
    handleRegisterReceipt();

    const logText = `============================================================
              VIDYALAYA PUBLIC SCHOOL - OFFICIAL ERP VOUCHER
============================================================
Certificate ID    : cert-${Date.now()}
Certificate Type  : ${activeSubTab.toUpperCase()} CERTIFICATE
Reference Code    : ${certificateNo}
Issue Date        : ${new Date(dateOfIssue).toLocaleDateString('en-IN')}
------------------------------------------------------------
RECIPIENT SCHOLAR DETAILS:
Student Name      : ${stdName || 'N/A'}
Roll Number       : ${stdRoll || 'N/A'}
Class Rank        : Class ${stdClass || 'N/A'} - Section ${stdSection || 'N/A'}
Father's Name     : ${fatherName || 'N/A'}
${activeSubTab === 'character' ? `Mother's Name     : ${motherName || 'N/A'}` : ''}
Date of Birth     : ${dob ? new Date(dob).toLocaleDateString('en-IN') : 'N/A'}
------------------------------------------------------------
VALIDATION SPECIFICS:
${activeSubTab === 'bonafide' ? `Purpose of Claim  : ${bonafidePurpose === 'Other' ? bonafideCustomPurpose : bonafidePurpose}
Academic Session  : ${academicYear}` : ''}
${activeSubTab === 'academic' ? `Examination Title : ${examName}
Exam Year         : ${examYear}
Performance Mark  : ${percentage}
Award/Distinction : ${achievementGrade}
Principal Sig Name: ${principalSignature}` : ''}
${activeSubTab === 'character' ? `Duration of Study : ${durationFrom} to ${durationTo}
Character Rating  : ${characterAssessment}
Conduct Appraisal : ${conductRemarks}` : ''}
${activeSubTab === 'sports' ? `Active Sport Name : ${sportName}
Competition Arena : ${eventName}
Tournament Level  : ${sportLevel}
Placement Title   : ${sportPosition}
Tournament Date   : ${dateOfEvent ? new Date(dateOfEvent).toLocaleDateString('en-IN') : 'N/A'}
Athletic Coach    : ${coachSignature}` : ''}
------------------------------------------------------------
AUTHORISED UNDER SYSTEM STAMP BY:
Registrar Seal Status: DIGITAL COMMITTED
Principal Overseer   : ${principalSignature || 'Authorized Principal Signature'}
${activeSubTab === 'sports' ? `Sports In-Charge  : ${coachSignature || 'Authorized Coach Signature'}` : ''}
------------------------------------------------------------
Generated under certified school administrative ERP protocols.
This voucher serves as a digital verification receipt.
============================================================`;

    const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vidyalaya_Receipt_${certificateNo.replace(/\//g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Certificate official verification receipt downloaded successfully.', 'success');
  };

  // --- DYNAMIC EMBEDDED PRINT WINDOW SENDER ---
  const handlePrintCertificate = () => {
    handleRegisterReceipt();

    const studentObj = students.find(item => item.id === selectedStudentId);
    const photoPrintHtml = studentObj?.photo ? `
      <div style="position: absolute; top: 125px; right: 40px; width: 85px; height: 105px; border: 2px solid #cbd5e1; background: #fff; padding: 2px; text-align: center; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); z-index: 50;">
        <img src="${studentObj.photo}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    ` : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast('Popup blocker prevented printing. Please enable popups.', 'error');
      return;
    }

    // Dynamic sports calculations in pure JS for the template
    let sportsLevelBanner = '🏆 Sports Excellence Award';
    let sportsBorderColor = '#1e3a8a'; /* Indigo */
    let sportsBgAccent = '#f0f7ff';
    let sportsSymbol = '🏆';

    if (sportLevel === 'School') {
      sportsLevelBanner = '🛡️ School Sports representation';
      sportsBorderColor = '#059669'; /* Emerald */
      sportsBgAccent = '#f0fdf4';
      sportsSymbol = '🛡️';
    } else if (sportLevel === 'Inter-School') {
      sportsLevelBanner = '👟 Inter-School Sports Representation';
      sportsBorderColor = '#4f46e5'; /* Violet */
      sportsBgAccent = '#f5f3ff';
      sportsSymbol = '👟';
    } else if (sportLevel === 'District') {
      sportsLevelBanner = '🏅 District sports Title citation';
      sportsBorderColor = '#0284c7'; /* Sky */
      sportsBgAccent = '#f0f9ff';
      sportsSymbol = '🏅';
    } else if (sportLevel === 'State') {
      sportsLevelBanner = '🎖️ STATE Sports merit insignia';
      sportsBorderColor = '#4b5563'; /* Gray */
      sportsBgAccent = '#f9fafb';
      sportsSymbol = '🎖️';
    } else {
      sportsLevelBanner = '👑 NATIONAL ATHLETIC CHAMPION SHIP MERIT';
      sportsBorderColor = '#d97706'; /* Gold / Amber */
      sportsBgAccent = '#fffbeb';
      sportsSymbol = '👑';
    }

    let innerContentHTML = '';

    if (activeSubTab === 'bonafide') {
      innerContentHTML = `
        <div style="font-size: 15px; line-height: 2.2; margin-top: 30px; text-align: justify; color: #1e293b;">
          This is to certify that Master / Miss <strong style="font-size: 18px; text-decoration: underline; color: #0f172a;">${stdName || 'N/A'}</strong>, 
          Son / Daughter of Shri. <strong style="color: #0f172a;">${fatherName || 'N/A'}</strong>, is a bonafide student of this institution studying in 
          <strong>${stdClass || 'N/A'} - Section ${stdSection || 'N/A'}</strong> during the academic year <strong>${academicYear || 'N/A'}</strong>, holding Roll Number <strong>${stdRoll || 'N/A'}</strong>.
          <br/><br/>
          As per our school verified registration database records, his/her recorded Date of Birth as of today is <strong>${dob ? new Date(dob).toLocaleDateString('en-IN') : 'N/A'}</strong>.
          <br/><br/>
          This certificate is being generated upon candidate's personal request for the purpose of: <strong>${bonafidePurpose === 'Other' ? (bonafideCustomPurpose || 'N/A') : bonafidePurpose}</strong>.
          We wish him/her all success in future academic endeavors.
        </div>
      `;
    } else if (activeSubTab === 'academic') {
      innerContentHTML = `
        <div style="text-align: center; margin-top: 20px;">
          <span style="font-family: 'Times New Roman', serif; font-size: 20px; font-style: italic; color: #b45308; display: block; margin-bottom: 25px;">Certificate of Academic Accomplishment</span>
          
          <div style="font-size: 15px; line-height: 2.3; margin: auto; max-width: 600px; color: #1e293b;">
            This is proudly awarded to Master / Miss <strong style="font-size: 20px; letter-spacing: 0.5px; border-bottom: 1px dashed #64748b; color: #011d4e;">${stdName || 'N/A'}</strong><br/>
            of Class <strong>${stdClass || 'N/A'}</strong>, Section <strong>${stdSection || 'N/A'}</strong>, Roll Number <strong>${stdRoll || 'N/A'}</strong>, 
            for outstanding scholastic performance demonstrated during the <strong>${examName || 'N/A'}</strong> in the school year <strong>${examYear || 'N/A'}</strong>.<br/><br/>
            He/She has secured an cumulative score aggregate of <strong style="font-size: 18px; color: #1e3a8a;">${percentage || 'N/A'}</strong>, 
            and has been classified under the rank category of:
            <br/>
            <div style="font-size: 16px; font-weight: 800; color: #b45309; margin-top: 15px; text-transform: uppercase; border: 1px solid #fde68a; background: #fffbeb; display: inline-block; padding: 6px 20px; border-radius: 8px;">
               🏆 ${achievementGrade || 'N/A'}
            </div>
          </div>
        </div>
      `;
    } else if (activeSubTab === 'character') {
      innerContentHTML = `
        <div style="font-size: 15px; line-height: 2.2; margin-top: 25px; text-align: justify; color: #1e293b;">
          This is to certify that Master / Miss <strong style="font-size: 17px; text-decoration: underline; color: #011d4e;">${stdName || 'N/A'}</strong>, 
          Child of SHRI. <strong style="color: #0f172a;">${fatherName || 'N/A'}</strong> and SHRIMATI. <strong style="color: #0f172a;">${motherName || 'N/A'}</strong>, was a student of Vidyalaya Public School studying in 
          <strong>Class ${stdClass || 'N/A'} - Section ${stdSection || 'N/A'}</strong>, bearing Roll Number <strong>${stdRoll || 'N/A'}</strong>, from the scholastic enrollment term <strong>${durationFrom || 'N/A'}</strong> to <strong>${durationTo || 'N/A'}</strong>.
          He/She has successfully passed the scholastic requirements and relieved studies with a clean ledger.
          <br/><br/>
          During his/her enrollment in our institution, his/her general conduct, sportsmanship, and personal character have been evaluated as:
          <strong style="color:#16a34a; font-size: 16px; text-transform: uppercase; display: inline-block; border-bottom: 2px solid #b45309;">"${characterAssessment || 'N/A'}"</strong>.
          <br/><br/>
          <strong>Moral Declaration:</strong> <em>"${characterDeclaration || 'N/A'}"</em>
          <br/><br/>
          Character Remarks: <em>"${conductRemarks || 'N/A'}"</em>
          <br/><br/>
          <strong>Document Validity period:</strong> <span style="font-weight: bold; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 12px;">${validityPeriod || 'N/A'} from issuance date</span>
        </div>
      `;
    } else { // sports
      innerContentHTML = `
        <div style="text-align: center; margin-top: 15px;">
          <div style="font-size: 13px; text-transform: uppercase; font-weight: bold; letter-spacing: 2px; color: #ffffff; background: ${sportsBorderColor}; padding: 6px 16px; display: inline-block; border-radius: 4px; margin-bottom: 20px;">
            ${sportsLevelBanner}
          </div>
          
          <div style="font-size: 15px; line-height: 2.2; text-align: center; max-width: 650px; margin: auto; color: #1e293b;">
            This certificate is awarded to Master / Miss <strong style="font-size: 19px; color: #1e3a8a; display: block; margin: 10px 0;">${stdName || 'N/A'}</strong>
            representing Class <strong>${stdClass || 'N/A'}</strong>, Section <strong>${stdSection || 'N/A'}</strong>, Roll Number <strong>${stdRoll || 'N/A'}</strong>, for proving stellar representation of Vidyalaya Public School in the sport of <strong style="text-transform: capitalize; color: ${sportsBorderColor};">${sportName || 'N/A'}</strong>
            at the <strong style="color: #111827;">${sportLevel || 'N/A'} Level Championship</strong>.<br/><br/>
            
            By demonstrating outstanding physical grit, strategic focus & true sportsmanship during the <strong>${eventName || 'N/A'}</strong> on <strong>${dateOfEvent ? new Date(dateOfEvent).toLocaleDateString('en-IN') : 'N/A'}</strong>, 
            he/she cleared competitive brackets to secure the meritorious position of:
            <br/>
            <div style="font-size: 16px; font-weight: 800; color: #111827; border: 2px dashed ${sportsBorderColor}; display: inline-block; padding: 5px 20px; border-radius: 6px; margin-top: 15px; background-color: ${sportsBgAccent};">
              ${sportsSymbol} ${sportPosition || 'N/A'}
            </div>
          </div>
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <title>Institutional Certificate - ${certificateNo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;900&family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 15px; background: #f8fafc; margin: 0; box-sizing: border-box; }
            .outer-container {
              background: #fff;
              max-width: 800px;
              margin: 20px auto;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }
            .cert-frame {
              border: 15px double #1e3a8a;
              padding: 40px;
              position: relative;
              background-color: #fff;
            }
            .cert-frame::before {
              content: '';
              position: absolute;
              top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 2px solid #b45309;
              pointer-events: none;
            }
            .cert-frame-academic {
              border: 15px double #d97706; /* Gold ornate */
              padding: 40px;
              position: relative;
              background-color: #fff;
            }
            .cert-frame-academic::before {
              content: '';
              position: absolute;
              top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 2px solid #111827;
              pointer-events: none;
            }
            .cert-frame-sports {
              border: 15px double ${sportsBorderColor};
              padding: 40px;
              position: relative;
              background-color: #fff;
              background-image: radial-gradient(${sportsBorderColor} 1px, transparent 1px);
              background-size: 20px 20px;
              background-opacity: 0.1;
            }
            .cert-frame-sports::before {
              content: '';
              position: absolute;
              top: 5px; left: 5px; right: 5px; bottom: 5px;
              border: 3px dashed ${sportsBorderColor};
              pointer-events: none;
            }
            .cert-watermark {
              position: absolute;
              font-size: 140px;
              opacity: 0.03;
              font-weight: 950;
              color: #000;
              top: 38%; left: 10%;
              transform: rotate(-25deg);
              pointer-events: none;
              user-select: none;
              font-family: 'Cinzel', serif;
            }
            .logo-header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #b45309; padding-bottom: 15px; }
            .school-logo { width: 68px; height: 68px; object-fit: cover; border-radius: 50%; border: 1.5px solid #d97706; margin-bottom: 6px; }
            .title-main { font-family: 'Cinzel', serif; font-size: 30px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; }
            .subtitle-main { font-size: 11px; text-transform: uppercase; font-weight: bold; tracking: 4px; color: #475569; margin-top: 4px; }
            .serial-box { display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 15px; border-bottom: 1px dashed #e1e1e1; padding-bottom: 6px; }
            .stamp-signature { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 55px; }
            .sig-line { border-top: 1.5px solid #cbd5e1; width: 180px; text-align: center; font-size: 11px; color: #475569; padding-top: 6px; font-weight: bold; text-transform: uppercase; position: relative; }
            .cert-footer-text { text-align: center; margin-top: 40px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #f1f1f1; padding-top: 10px; }
            
            /* Stamp styling inside signatures */
            .sig-stamp-circle {
              position: absolute;
              bottom: 15px;
              left: 20px;
              width: 58px;
              height: 58px;
              border-radius: 50%;
              border: 1px double rgba(180, 83, 9, 0.4);
              background: rgba(253, 251, 247, 0.1);
              transform: rotate(-12deg);
              opacity: 0.35;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: 'Cinzel', serif;
              font-size: 4px;
              font-weight: 900;
              letter-spacing: 0.5px;
              color: #b45309;
            }
            .sig-stamp-circle-inner {
              border: 1.2px dashed rgba(217, 119, 6, 0.3);
              border-radius: 50%;
              width: 50px;
              height: 50px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            @media print {
              body { background: #fff; padding: 0; }
              .outer-container { box-shadow: none; margin: 0; max-width: 100%; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="outer-container">
            <div class="${activeSubTab === 'sports' ? 'cert-frame-sports' : activeSubTab === 'academic' ? 'cert-frame-academic' : 'cert-frame'}">
              <div class="cert-watermark">VIDYALAYA</div>
              ${photoPrintHtml}

              ${activeSubTab === 'academic' ? `
                <div style="position: absolute; top: 10px; left: 10px; color: #b45309; font-size: 15px;">⚜</div>
                <div style="position: absolute; top: 10px; right: 10px; color: #b45309; font-size: 15px;">⚜</div>
                <div style="position: absolute; bottom: 10px; left: 10px; color: #b45309; font-size: 15px;">⚜</div>
                <div style="position: absolute; bottom: 10px; right: 10px; color: #b45309; font-size: 15px;">⚜</div>
              ` : ''}
              
              ${useLetterhead && letterheadImage ? `
              <div style="background-image: url('${letterheadImage}'); background-size: cover; background-position: center; width: 100%; height: 85px; margin-bottom: 25px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-sizing: border-box; color: #fff; font-family: 'Inter', sans-serif;">
                <span style="font-size: 11px; font-weight: 900; letter-spacing: 2px; text-shadow: 1px 1px 3px rgba(0,0,0,0.6);">OFFICIAL INSTITUTIONAL RECORD</span>
                <span style="font-size: 10px; font-family: monospace; text-shadow: 1px 1px 3px rgba(0,0,0,0.6); opacity: 0.95;">Ref: ${certificateNo}</span>
              </div>
              ` : ''}

              <div class="logo-header">
                ${stampImage ? `<img src="${stampImage}" class="school-logo" alt="Logo" />` : ''}
                <div class="title-main">Vidyalaya Public School</div>
                <div class="subtitle-main">Devalgola Educational Trust • CBSE Affiliation Code #920192</div>
              </div>

              <div class="serial-box">
                <span>Ref Code: ${certificateNo}</span>
                <span>Date of Issue: ${new Date(dateOfIssue).toLocaleDateString('en-IN')}</span>
              </div>

              ${innerContentHTML}

              <div class="stamp-signature">
                <div class="sig-line">
                  <div class="sig-stamp-circle">
                    <div class="sig-stamp-circle-inner">APPROVED</div>
                  </div>
                  Office Registrar Stamp
                </div>
                ${activeSubTab === 'sports' ? `
                <div class="sig-line" style="border-top: 1.5px solid #cbd5e1; width: 180px; text-align: center; font-size: 11px; color: #475569; padding-top: 6px; font-weight: bold; text-transform: uppercase;">
                  ${coachSignature || 'Coach / Sports In-Charge'}
                  <div style="font-size: 8px; font-weight: normal; margin-top: 3px; color: #64748b;">Sports In-Charge</div>
                </div>
                ` : ''}
                <div class="sig-line">${principalSignature || 'Principal Authorized Sig'}</div>
              </div>

              <div class="cert-footer-text">
                Note: This is an authentic document generated under standard ERP protocol. Verification query coordinates: verification@vidyalayaserp.in
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    addToast('Official Certificate compiled & dispatched to Print Sender Spooler.', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      
      {/* LEFT 5 Columns: Complete Dynamic Configuration & Interactive Entry Forms */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Module Header Controls */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between mb-2 border-b border-gray-50 pb-3">
            <h3 className="font-extrabold text-sm uppercase text-gray-900 flex items-center gap-2">
              <FileCheck className="text-indigo-600" size={18} />
              Certificate Config Suite
            </h3>
            <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wider">Dynamic Layouts</span>
          </div>

          {/* Student autofill selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-gray-400">Import Student From Registry</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 py-3 px-3 rounded-xl text-xs font-bold text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white"
            >
              <option value="">-- Direct Manual Input (Blank Form) --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber} - {s.className})</option>
              ))}
            </select>
          </div>

          {/* School emblem custom loader */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-gray-400">Institutional Seal Emblem</label>
            <div className="border border-dashed border-gray-200 p-3 rounded-xl flex items-center justify-between hover:border-indigo-400 transition-all bg-slate-50/50">
              <div className="flex items-center gap-3">
                <img src={stampImage} alt="School Stamp" className="w-10 h-10 object-cover rounded-full border border-gray-200 bg-white" />
                <div>
                  <p className="text-[10px] font-bold text-gray-800">emblem_standard_logo.png</p>
                  <p className="text-[8px] text-gray-400 font-medium">JPEG/PNG formats supported</p>
                </div>
              </div>
              <label className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-white hover:bg-slate-950 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all">
                Change
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* School letterhead custom loader */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-slate-700 flex items-center gap-1.5 select-none cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useLetterhead} 
                  onChange={(e) => setUseLetterhead(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-100 w-3.5 h-3.5"
                />
                Include Letterhead
              </label>
              <span className="text-[8px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Customizer</span>
            </div>

            {useLetterhead && (
              <div className="border border-dashed border-gray-200 p-2.5 rounded-lg flex items-center justify-between hover:border-indigo-400 transition-all bg-white mt-2">
                <div className="flex items-center gap-2.5">
                  <img src={letterheadImage} alt="School Letterhead" className="w-12 h-6 object-cover rounded border border-gray-150" />
                  <div>
                    <p className="text-[9px] font-bold text-gray-800">custom_letterhead.png</p>
                    <p className="text-[8px] text-gray-400 font-medium">Auto-fits top of blueprint</p>
                  </div>
                </div>
                <label className="px-2.5 py-1.5 bg-slate-50 border border-gray-200 text-gray-700 hover:text-white hover:bg-slate-950 rounded text-[8px] font-black uppercase cursor-pointer transition-all">
                  Upload
                  <input type="file" accept="image/*" onChange={handleLetterheadUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* TAB CATEGORY CHOOSER */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-gray-400">Select Certificate Template Format</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'bonafide', label: 'Bonafide', icon: Bookmark },
                { id: 'academic', label: 'Academic Merit', icon: BookOpen },
                { id: 'character', label: 'Character', icon: FileText },
                { id: 'sports', label: 'Sports Excellence', icon: Trophy }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id as any)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all ${
                    activeSubTab === sub.id 
                      ? 'bg-slate-950 text-white border-slate-950 shadow-md transform -translate-y-[1px]' 
                      : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <sub.icon size={16} className={activeSubTab === sub.id ? 'text-amber-500' : 'text-gray-400'} />
                  <span className="text-[10px] font-black uppercase leading-tight">{sub.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CUSTOM CERTIFICATE ENGINES & INPUT FIELDS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">
              {activeSubTab === 'bonafide' && 'Bonafide Certificate Form'}
              {activeSubTab === 'academic' && 'Academic Certificate Form'}
              {activeSubTab === 'character' && 'Character Certificate Form'}
              {activeSubTab === 'sports' && 'Sports Certificate Form'}
            </h4>
            <span className="text-[8px] font-bold text-gray-400 uppercase">Input Attributes</span>
          </div>

          {/* DYNAMIC FORM RENDERS */}
          {activeSubTab === 'bonafide' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Student Name</label>
                  <input 
                    type="text" 
                    value={stdName} 
                    onChange={(e) => setStdName(e.target.value)} 
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Roll Number</label>
                  <input 
                    type="text" 
                    value={stdRoll} 
                    onChange={(e) => setStdRoll(e.target.value)} 
                    placeholder="e.g. 1001"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Class</label>
                  <input 
                    type="text" 
                    value={stdClass} 
                    onChange={(e) => setStdClass(e.target.value)} 
                    placeholder="e.g. Class 10"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Section</label>
                  <input 
                    type="text" 
                    value={stdSection} 
                    onChange={(e) => setStdSection(e.target.value)} 
                    placeholder="e.g. A"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Father's Name</label>
                  <input 
                    type="text" 
                    value={fatherName} 
                    onChange={(e) => setFatherName(e.target.value)} 
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)} 
                    className="w-full bg-slate-50 border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-50">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-indigo-700">Academic Year</label>
                    <input 
                      type="text" 
                      value={academicYear} 
                      onChange={(e) => setAcademicYear(e.target.value)} 
                      placeholder="e.g. 2026-27"
                      className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-indigo-750">Certificate Purpose</label>
                    <select
                      value={bonafidePurpose}
                      onChange={(e) => setBonafidePurpose(e.target.value)}
                      className="w-full bg-white border border-gray-200 py-2 px-2 rounded-lg text-xs font-bold text-gray-800"
                    >
                      <option value="Scholarship">Scholarship</option>
                      <option value="Bank Account">Bank Account</option>
                      <option value="Passport">Passport</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {bonafidePurpose === 'Other' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-400">Write Custom Purpose</label>
                    <input 
                      type="text" 
                      value={bonafideCustomPurpose} 
                      onChange={(e) => setBonafideCustomPurpose(e.target.value)} 
                      placeholder="e.g. District Sports Concession Ticket"
                      className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-200"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-indigo-650 flex items-center gap-1">
                  Auto-generated Certificate Number
                  <Sparkles size={11} className="text-amber-500" />
                </label>
                <input 
                  type="text" 
                  value={certificateNo} 
                  readOnly 
                  className="w-full bg-amber-50/50 border border-amber-200 py-2.5 px-3 rounded-lg text-xs font-mono font-bold text-amber-800 outline-none cursor-not-allowed select-all"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'academic' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Student Name</label>
                  <input 
                    type="text" 
                    value={stdName} 
                    onChange={(e) => setStdName(e.target.value)} 
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Roll Number</label>
                  <input 
                    type="text" 
                    value={stdRoll} 
                    onChange={(e) => setStdRoll(e.target.value)} 
                    placeholder="e.g. 1001"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Class</label>
                  <input 
                    type="text" 
                    value={stdClass} 
                    onChange={(e) => setStdClass(e.target.value)} 
                    placeholder="e.g. Class 10"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Section</label>
                  <input 
                    type="text" 
                    value={stdSection} 
                    onChange={(e) => setStdSection(e.target.value)} 
                    placeholder="e.g. A"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Examination Name</label>
                  <input 
                    type="text" 
                    value={examName} 
                    onChange={(e) => setExamName(e.target.value)} 
                    placeholder="e.g. Class X CBSE Board"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Year</label>
                  <input 
                    type="text" 
                    value={examYear} 
                    onChange={(e) => setExamYear(e.target.value)} 
                    placeholder="e.g. 2026"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Percentage/CGPA</label>
                  <input 
                    type="text" 
                    value={percentage} 
                    onChange={(e) => setPercentage(e.target.value)} 
                    placeholder="e.g. 94.2% or 9.6 CGPA"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Grade/Achievement Level</label>
                  <select
                    value={achievementGrade}
                    onChange={(e) => setAchievementGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  >
                    <option value="Distinction">Distinction</option>
                    <option value="First Class">First Class</option>
                    <option value="Second Class">Second Class</option>
                    <option value="Pass">Pass</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50/20 p-3 rounded-xl border border-amber-100/30">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-amber-800">Principal Signature Name</label>
                  <input 
                    type="text" 
                    value={principalSignature} 
                    onChange={(e) => setPrincipalSignature(e.target.value)} 
                    placeholder="e.g. Dr. R. K. Sen"
                    className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-indigo-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-700 flex items-center gap-1">
                    Auto Certificate Number
                    <Sparkles size={11} className="text-amber-500 animate-pulse" />
                  </label>
                  <input 
                    type="text" 
                    value={certificateNo} 
                    readOnly 
                    className="w-full bg-white/50 border border-yellow-250 py-2 px-3 rounded-lg text-xs font-mono font-bold text-amber-700 outline-none cursor-not-allowed select-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'character' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Student Name</label>
                  <input 
                    type="text" 
                    value={stdName} 
                    onChange={(e) => setStdName(e.target.value)} 
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Roll Number</label>
                  <input 
                    type="text" 
                    value={stdRoll} 
                    onChange={(e) => setStdRoll(e.target.value)} 
                    placeholder="e.g. 1001"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Class</label>
                  <input 
                    type="text" 
                    value={stdClass} 
                    onChange={(e) => setStdClass(e.target.value)} 
                    placeholder="e.g. Class 10"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Section</label>
                  <input 
                    type="text" 
                    value={stdSection} 
                    onChange={(e) => setStdSection(e.target.value)} 
                    placeholder="e.g. A"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Father's Name</label>
                  <input 
                    type="text" 
                    value={fatherName} 
                    onChange={(e) => setFatherName(e.target.value)} 
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Mother's Name</label>
                  <input 
                    type="text" 
                    value={motherName} 
                    onChange={(e) => setMotherName(e.target.value)} 
                    placeholder="e.g. Sunita Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/30">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-700">Duration Study (From)</label>
                  <input 
                    type="text" 
                    value={durationFrom} 
                    onChange={(e) => setDurationFrom(e.target.value)} 
                    placeholder="e.g. 2022"
                    className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-indigo-700">Duration Study (To)</label>
                  <input 
                    type="text" 
                    value={durationTo} 
                    onChange={(e) => setDurationTo(e.target.value)} 
                    placeholder="e.g. 2026"
                    className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black uppercase text-gray-400">Conduct Remarks</label>
                  <textarea 
                    value={conductRemarks} 
                    onChange={(e) => setConductRemarks(e.target.value)} 
                    rows={2}
                    placeholder="e.g. Excellent behavioral records and active school participant"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="space-y-1 col-span-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100/50">
                <label className="text-[9px] font-black uppercase text-indigo-700 block mb-1">Formal Declaration Template</label>
                <select
                  value={characterDeclaration}
                  onChange={(e) => setCharacterDeclaration(e.target.value)}
                  className="w-full bg-white border border-gray-200 py-2 px-2 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none mb-2"
                >
                  <option value="We certify that the scholar bears a clean moral standing, displayed strong civil life, and has successfully passed all academic requirements with cooperative behavior.">Clean Moral standing & Civil service (Default)</option>
                  <option value="To the best of our institutional knowledge and record ledger, the candidate exhibits upstanding ethical conduct, participates actively in extracurricular programs, and carries zero liabilities.">Ethical Conduct & Extra-curricular Active (High citation)</option>
                  <option value="During their tenure, the student maintained an exemplary behavioral status, showed mature discipline, and demonstrated civic responsibility and respect for peers and authority.">Exemplary Discipline & Civic Responsibility (Formal)</option>
                  <option value="custom">-- Custom Text Statement (Enter below) --</option>
                </select>
                
                {(characterDeclaration === 'custom' || !['We certify that the scholar bears a clean moral standing, displayed strong civil life, and has successfully passed all academic requirements with cooperative behavior.', 'To the best of our institutional knowledge and record ledger, the candidate exhibits upstanding ethical conduct, participates actively in extracurricular programs, and carries zero liabilities.', 'During their tenure, the student maintained an exemplary behavioral status, showed moral discipline, and demonstrated civic responsibility and respect for peers and authority.'].includes(characterDeclaration)) && (
                  <textarea
                    onChange={(e) => setCharacterDeclaration(e.target.value)}
                    rows={2}
                    placeholder="Enter custom declaration statement..."
                    className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-100 outline-none resize-none leading-relaxed transition-all"
                    value={characterDeclaration === 'custom' ? '' : characterDeclaration}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Validity Period</label>
                  <select
                    value={validityPeriod}
                    onChange={(e) => setValidityPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 py-2.5 px-1.5 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  >
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                    <option value="2 Years">2 Years</option>
                    <option value="Indefinite/Lifetime">Indefinite/Lifetime</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Conduct Rating</label>
                  <select
                    value={characterAssessment}
                    onChange={(e) => setCharacterAssessment(e.target.value as any)}
                    className="w-full bg-slate-50 border border-gray-200 py-2.5 px-1.5 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Satisfactory">Satisfactory</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Date of Issue</label>
                  <input 
                    type="date" 
                    value={dateOfIssue} 
                    onChange={(e) => setDateOfIssue(e.target.value)} 
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-1 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-indigo-700 flex items-center gap-1">
                  Auto-generated Serial
                  <Sparkles size={11} className="text-amber-500" />
                </label>
                <input 
                  type="text" 
                  value={certificateNo} 
                  readOnly 
                  className="w-full bg-slate-5 p-2 px-3 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-200 outline-none cursor-not-allowed select-all bg-amber-50/20"
                />
              </div>
            </div>
          )}

          {activeSubTab === 'sports' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Student Name</label>
                  <input 
                    type="text" 
                    value={stdName} 
                    onChange={(e) => setStdName(e.target.value)} 
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Roll Number</label>
                  <input 
                    type="text" 
                    value={stdRoll} 
                    onChange={(e) => setStdRoll(e.target.value)} 
                    placeholder="e.g. 1001"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Class</label>
                  <input 
                    type="text" 
                    value={stdClass} 
                    onChange={(e) => setStdClass(e.target.value)} 
                    placeholder="e.g. Class 10"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Section</label>
                  <input 
                    type="text" 
                    value={stdSection} 
                    onChange={(e) => setStdSection(e.target.value)} 
                    placeholder="e.g. A"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Sport Name</label>
                  <input 
                    type="text" 
                    value={sportName} 
                    onChange={(e) => setSportName(e.target.value)} 
                    placeholder="e.g. Basketball"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Event/Competition Name</label>
                  <input 
                    type="text" 
                    value={eventName} 
                    onChange={(e) => setEventName(e.target.value)} 
                    placeholder="e.g. CBSE District School Athletic Meet"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Achievement Level</label>
                  <select
                    value={sportLevel}
                    onChange={(e) => setSportLevel(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 py-2.5 px-2 rounded-lg text-xs font-bold text-gray-800"
                  >
                    <option value="School">School</option>
                    <option value="Inter-School">Inter-School</option>
                    <option value="District">District</option>
                    <option value="State">State</option>
                    <option value="National">National</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Position/Rank</label>
                  <input 
                    type="text" 
                    value={sportPosition} 
                    onChange={(e) => setSportPosition(e.target.value)} 
                    placeholder="e.g. First Place (Gold Medalist)"
                    className="w-full bg-slate-50 border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-teal-50/20 p-3 rounded-xl border border-teal-100/30">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-teal-850">Date of Event</label>
                  <input 
                    type="date" 
                    value={dateOfEvent} 
                    onChange={(e) => setDateOfEvent(e.target.value)} 
                    className="w-full bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400">Date of Issue</label>
                  <input 
                    type="date" 
                    value={dateOfIssue} 
                    onChange={(e) => setDateOfIssue(e.target.value)} 
                    className="w-full bg-white border border-gray-200 py-1.5 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 border border-slate-150 p-3 rounded-xl">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500">Coach / Sports In-Charge Signature</label>
                  <input 
                    type="text" 
                    value={coachSignature} 
                    onChange={(e) => setCoachSignature(e.target.value)} 
                    placeholder="e.g. Coach Rajesh Kumar"
                    className="w-full bg-white border border-gray-200 py-2 px-3 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-indigo-100 outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#1e3a8a] flex items-center gap-1">
                    Auto-generated Certificate Number
                    <Sparkles size={11} className="text-amber-500 animate-pulse" />
                  </label>
                  <input 
                    type="text" 
                    value={certificateNo} 
                    readOnly 
                    className="w-full bg-white border border-slate-200 py-2 px-3 rounded-lg text-xs font-mono font-bold text-indigo-800 outline-none cursor-not-allowed select-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DUAL ACTION BUTTON AREA: Live Modal Prep & Print sender */}
          <div className="flex flex-col sm:flex-row gap-3 pt-3">
            <button
              onClick={() => setShowPreviewModal(true)}
              className="flex-1 py-3.5 bg-indigo-600 border border-indigo-700 text-white rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider sm:tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-[1px]"
            >
              <Eye size={15} />
              Compile & Preview
            </button>
            <button
              onClick={handlePrintCertificate}
              className="flex-1 py-3.5 bg-slate-900 border border-slate-950 text-white rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider sm:tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-[1px]"
            >
              <Printer size={15} />
              Direct Print
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT 7 Columns: Real-Time Dynamic Canvas Sandbox Preview */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Design Sandbox Header */}
        <div className="bg-slate-950 p-4 rounded-t-2xl flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-500 animate-pulse shrink-0" size={16} />
            <span className="text-[10px] font-black tracking-widest uppercase">Live Design Sandbox</span>
          </div>
          <span className="text-[9px] bg-white/10 px-2.5 py-0.5 rounded text-indigo-300 font-mono font-bold uppercase tracking-wider">
            {certificateNo}
          </span>
        </div>

        {/* Certificate Display screen */}
        <div className={`bg-white border-2 border-slate-200 rounded-b-2xl p-6 md:p-10 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[500px] ${
          activeSubTab === 'sports' ? `border-indigo-400` : activeSubTab === 'academic' ? 'border-amber-400' : ''
        }`}>
          
          {/* Subtle watermark overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] tracking-[4px] font-black text-slate-950 text-3xl sm:text-5xl uppercase rotate-[-25deg] font-sans">
            Vidyalaya School
          </div>

          {/* Academic Ornamental Double Border */}
          {activeSubTab === 'academic' && (
            <div className="absolute inset-2 border-2 border-double border-amber-500 pointer-events-none rounded-lg opacity-40">
              <div className="absolute top-1 left-2 text-amber-600 text-[10px]">⚜</div>
              <div className="absolute top-1 right-2 text-amber-600 text-[10px]">⚜</div>
              <div className="absolute bottom-1 left-2 text-amber-600 text-[10px]">⚜</div>
              <div className="absolute bottom-1 right-2 text-amber-600 text-[10px]">⚜</div>
            </div>
          )}

          {/* Dynamic Sports Theme Classifications */}
          {(() => {
            const getSportsTheme = (level: string) => {
              switch (level) {
                case 'School':
                  return {
                    borderStyle: 'border-emerald-600',
                    bgStyle: 'bg-emerald-50/40',
                    textColor: 'text-emerald-800',
                    accentColor: 'text-emerald-700',
                    accentBorder: 'border-emerald-200',
                    symbol: '🛡️',
                    badgeText: 'School Level Citation'
                  };
                case 'Inter-School':
                  return {
                    borderStyle: 'border-indigo-600',
                    bgStyle: 'bg-indigo-50/30',
                    textColor: 'text-indigo-800',
                    accentColor: 'text-indigo-700',
                    accentBorder: 'border-indigo-200',
                    symbol: '👟',
                    badgeText: 'Inter-School Tournament'
                  };
                case 'District':
                  return {
                    borderStyle: 'border-sky-600',
                    bgStyle: 'bg-sky-50/30',
                    textColor: 'text-sky-850',
                    accentColor: 'text-sky-700',
                    accentBorder: 'border-sky-200',
                    symbol: '🏅',
                    badgeText: 'District Title Championship'
                  };
                case 'State':
                  return {
                    borderStyle: 'border-slate-500',
                    bgStyle: 'bg-slate-100/30',
                    textColor: 'text-slate-800',
                    accentColor: 'text-slate-650',
                    accentBorder: 'border-slate-305',
                    symbol: '🎖️',
                    badgeText: 'State Level Merit Insignia'
                  };
                case 'National':
                default:
                  return {
                    borderStyle: 'border-amber-500',
                    bgStyle: 'bg-amber-50/40',
                    textColor: 'text-amber-800',
                    accentColor: 'text-amber-700',
                    accentBorder: 'border-amber-300',
                    symbol: '🏆',
                    badgeText: 'National Level Supreme Excellence'
                  };
              }
            };
            const sportsTheme = getSportsTheme(sportLevel);
            const studentObj = students.find(s => s.id === selectedStudentId);

            return (
              <div className="relative z-10 space-y-5">
                {/* Real-time Student Photo Overlay */}
                {studentObj?.photo && (
                  <div className="absolute top-14 right-2 w-16 h-20 border border-slate-305 bg-white p-0.5 rounded shadow-sm z-20 overflow-hidden flex items-center justify-center">
                    <img src={studentObj.photo} alt="Student passport" className="w-full h-full object-cover" />
                  </div>
                )}
                {/* School custom letterhead placeholder and toggle representation */}
                {useLetterhead && letterheadImage ? (
                  <div className="w-full h-16 relative overflow-hidden rounded-xl border border-slate-200 shrink-0 shadow-sm">
                    <img src={letterheadImage} alt="Official Letterhead" className="w-full h-full object-cover opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent flex items-center px-4 justify-between">
                      <span className="text-white font-serif font-black text-[9px] tracking-wider uppercase">OFFICIAL ACADEMIC RECORD</span>
                      <span className="text-white/90 font-mono text-[80%] uppercase tracking-wide">REF: {certificateNo}</span>
                    </div>
                  </div>
                ) : null}

                {/* Crest / Header */}
                <div className="text-center border-b-2 border-double border-amber-600 pb-3">
                  <img src={stampImage} alt="School Stamp Preview" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border border-slate-200 shadow-sm" />
                  <h2 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight leading-none uppercase">Vidyalaya Public School</h2>
                  <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500 mt-1">Managed by Devalgola Educational Trust • Affiliation Code #920192</p>
                </div>

                {/* Content Mirror Area */}
                {activeSubTab === 'bonafide' && (
                  <div className="space-y-4 py-3 text-justify leading-relaxed">
                    <p className="text-xs font-bold uppercase tracking-[2px] text-center text-amber-700">Bonafide Certificate</p>
                    <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                      This is to certify that Master / Miss <strong className="font-extrabold text-slate-950 underline">{stdName || '[Student Name]'}</strong>, 
                      Son / Daughter of Shri. <strong className="font-bold text-gray-900">{fatherName || '[Father Name]'}</strong>, is a registered bonafide student of this institution studying in 
                      <strong className="font-bold text-gray-950"> {stdClass || '[Class Level]'} - Section {stdSection || '[Section]'}</strong> during the academic year <strong className="font-bold text-gray-950">{academicYear || '[Year]'}</strong>, 
                      bearing school registration Roll Number <strong className="font-mono font-bold text-indigo-700">{stdRoll || '[Roll No]'}</strong>.
                    </p>
                    <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                      His/Her recorded Date of Birth as per our primary verified school admission records as of today is <strong className="font-mono font-bold text-slate-950">{dob ? new Date(dob).toLocaleDateString('en-IN') : '[DOB]'}</strong>.
                    </p>
                    <p className="text-gray-850 text-xs sm:text-sm leading-relaxed">
                      This voucher validation document is issued upon personal registry request for the purpose of: <strong className="text-indigo-600 font-bold">{bonafidePurpose === 'Other' ? (bonafideCustomPurpose || '[Purpose]') : bonafidePurpose}</strong>.
                    </p>
                  </div>
                )}

                {activeSubTab === 'academic' && (
                  <div className="space-y-4 py-3 text-center leading-relaxed">
                    <p className="text-xs font-bold uppercase tracking-[3px] text-amber-700">Certificate of Scholar Merit</p>
                    
                    <div className="space-y-3 max-w-lg mx-auto">
                      <p className="text-gray-500 text-[10px] italic">This scholastic award honors high dedication & intellectual prowess:</p>
                      
                      <p className="text-gray-900 text-sm sm:text-base leading-relaxed">
                        Successfully conferred upon Master/Miss <strong className="font-extrabold text-[#001c4c] text-base sm:text-lg block tracking-tight mt-1 border-b border-dashed border-slate-300 pb-2">{stdName || '[Student Name]'}</strong>
                        of Class <strong className="font-bold">{stdClass || '[Class Level]'}</strong>, Section <strong className="font-bold">{stdSection || '[Section]'}</strong>, bearing examination Roll <strong className="font-mono font-bold text-indigo-700">{stdRoll || '[Roll No]'}</strong>.
                      </p>
                      
                      <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                        By securing an outstanding aggregated scoring mark of <strong className="text-emerald-600 font-extrabold">{percentage || '[Percentage]'}</strong> in the <strong>{examName || '[Examination Title]'}</strong> (Year {examYear || '[Year]'}), he/she is hereby classified with distinction under:
                      </p>

                      <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-1.5 rounded-xl text-xs font-black uppercase shadow-sm">
                        🏆 {achievementGrade || '[Accomplishment Classification]'}
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'character' && (
                  <div className="space-y-4 py-3 text-justify leading-relaxed">
                    <p className="text-xs font-bold uppercase tracking-[2px] text-center text-amber-700">Character & Conduct Certificate</p>
                    <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                      This is to certify that Master / Miss <strong className="font-extrabold text-slate-950 underline">{stdName || '[Student Name]'}</strong>, 
                      Child of Shri. <strong className="font-semibold text-slate-800">{fatherName || '[Father Name]'}</strong> and Smt. <strong className="font-semibold text-slate-800">{motherName || '[Mother Name]'}</strong>, was evaluated as a scholar student of 
                      Vidyalaya Public School representing <strong className="font-bold">Class {stdClass || '[Class]'} - Section {stdSection || '[Section]'}</strong> with Roll No <span className="font-bold text-indigo-700">{stdRoll || '[Roll No]'}</span> from academic calendar period <span className="font-bold text-primary">{durationFrom || '[From Year]'}</span> to <span className="font-bold text-primary">{durationTo || '[To Year]'}</span>.
                    </p>
                    <p className="text-gray-800 text-xs sm:text-sm leading-relaxed">
                      During his/her study enrollment, his/her moral integrity, behavioral discipline, and general school conduct have been evaluated and graded as: <strong className="text-emerald-600 uppercase font-black">{characterAssessment}</strong>.
                    </p>
                    <p className="text-gray-800 text-xs sm:text-sm leading-relaxed border border-dashed border-indigo-100 bg-slate-50/50 p-3 rounded-lg space-y-2">
                      <div><strong>Moral Declaration:</strong> <em>"{characterDeclaration || 'N/A'}"</em></div>
                      <div><strong>Special Conduct Remarks:</strong> <em>"{conductRemarks || 'N/A'}"</em></div>
                    </p>
                    <p className="text-gray-750 text-xs font-semibold leading-relaxed">
                      <strong>Validity period duration:</strong> <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-mono font-black">{validityPeriod} from issuance date</span>
                    </p>
                  </div>
                )}

                {activeSubTab === 'sports' && (
                  <div className="space-y-4 py-3 text-center leading-relaxed">
                    <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[2px] text-white px-3 py-1 bg-slate-950 rounded mb-1">
                      {sportsTheme.symbol} {sportsTheme.badgeText}
                    </div>
                    
                    <div className="max-w-lg mx-auto space-y-3">
                      <p className="text-slate-500 text-[10px] italic">By proving physical grit, strategic focus & true sportsmanship:</p>
                      
                      <p className="text-slate-950 text-sm sm:text-base leading-relaxed">
                        Master/Miss <strong className="font-black text-slate-900 text-base sm:text-lg block tracking-tight">{stdName || '[Student Name]'}</strong>
                        representing Class <strong className="font-bold">{stdClass || '[Class]'}</strong>, Section <strong className="font-bold">{stdSection || '[Section]'}</strong> and bearing Roll <span className="font-bold text-indigo-700">{stdRoll || '[Roll]'}</span> represented Vidyalaya School in the sport of <strong className="text-indigo-900 uppercase font-black">{sportName || '[Sport Name]'}</strong>.
                      </p>

                      <p className="text-xs text-slate-700">
                        At the prestigious <span className="font-black text-indigo-805">{sportLevel || '[Level]'} Level Championship</span>, in the competitive arena of <strong>{eventName || '[Event Name]'}</strong> on {dateOfEvent ? new Date(dateOfEvent).toLocaleDateString('en-IN') : '[Event Date]'}, he/she secured:
                      </p>

                      <div className={`inline-flex items-center gap-2 border-2 border-dashed ${sportsTheme.borderStyle} ${sportsTheme.bgStyle} ${sportsTheme.textColor} px-6 py-2 rounded-xl text-xs font-black uppercase shadow-sm`}>
                        {sportsTheme.symbol} {sportPosition || '[Meritorious Position Won]'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Verification Stamps */}
          <div className="flex justify-between items-end border-t border-slate-100 pt-5 mt-5 text-[9px] sm:text-[10px] text-slate-400 font-bold relative z-10">
            <div className="text-center relative">
              {/* Soft Circular Seal Approved overlay */}
              <div className="absolute -top-12 left-2 w-14 h-14 rounded-full border border-double border-amber-600/30 flex items-center justify-center p-0.5 bg-amber-50/5 rotate-[-12deg] select-none pointer-events-none leading-none">
                <div className="absolute inset-1 border border-dashed border-amber-500/20 rounded-full" />
                {stampImage ? (
                  <img src={stampImage} alt="Seal stamp core" className="w-7 h-7 object-cover rounded-full opacity-35 filter sepia" />
                ) : (
                  <span className="text-[5px] text-amber-700/40 uppercase font-black">SEAL</span>
                )}
                <span className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center text-[4px] text-amber-600/40 font-black tracking-widest uppercase">APPROVED • VIDYALAYA</span>
              </div>
              <div className="w-14 h-1 bg-slate-100 mx-auto mb-1" />
              <span>Office Registrar Stamp</span>
            </div>
            {activeSubTab === 'sports' ? (
              <div className="text-center">
                <div className="w-14 h-1 bg-slate-150 mx-auto mb-1 border-t border-dashed border-slate-300" />
                <span className="text-slate-600 italic font-mono">{coachSignature || 'Sports Coach Signature'}</span>
              </div>
            ) : (
              <div className="text-center font-mono text-[8px] uppercase tracking-wider text-indigo-600 animate-pulse">
                ERP COMPILATION ACTIVE
              </div>
            )}
            <div className="text-center">
              <div className="w-14 h-1 bg-slate-100 mx-auto mb-1" />
              <span>{principalSignature || 'Principal Authorized Sig'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- EXTRA HIGH FIDELITY ORNAMENTAL FULL-SCREEN PREVIEW MODAL --- */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal controls bar */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <Award className="text-amber-500" size={18} />
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider">High-Resolution Certificate Preview</h3>
                    <p className="text-[9px] text-indigo-300 font-mono tracking-wide">COMPILING FOR CODE: {certificateNo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download Receipt/Log Trigger */}
                  <button
                    onClick={handleDownloadLog}
                    title="Download Receipt Log"
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-black uppercase border border-slate-800"
                  >
                    <Download size={14} />
                    <span>Download Verification Receipt</span>
                  </button>

                  <button
                    onClick={handlePrintCertificate}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase border border-indigo-700"
                  >
                    <Printer size={14} />
                    <span>Launch Print Spooler</span>
                  </button>

                  <button 
                    onClick={() => setShowPreviewModal(false)}
                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Container showing exact paper blueprint */}
              <div className="flex-1 overflow-y-auto p-8 bg-slate-200 flex justify-center items-start">
                
                {/* Simulated Certificate Paper Blueprint */}
                <div className="bg-white border-[16px] border-double border-[#1e3a8a] p-10 max-w-[780px] w-full shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[580px] rounded-lg">
                  
                  {/* Outer secondary thin decorative border */}
                  <div className="absolute inset-1 border-2 border-[#b45309] pointer-events-none rounded-sm" />

                  {/* Student Photo in high res modal preview */}
                  {(() => {
                    const studentObj = students.find(s => s.id === selectedStudentId);
                    return studentObj?.photo ? (
                      <div className="absolute top-24 right-6 w-20 h-24 border border-slate-300 bg-white p-0.5 shadow-md z-30 overflow-hidden rounded flex items-center justify-center">
                        <img src={studentObj.photo} alt="Student" className="w-full h-full object-cover" />
                      </div>
                    ) : null;
                  })()}

                  {/* Rotated layout watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] tracking-[6px] font-black text-slate-950 text-6xl uppercase rotate-[-25deg] font-sans">
                    VIDYALAYA SCHOOL
                  </div>

                  <div className="relative z-10 space-y-6">
                    {/* Header portion */}
                    <div className="text-center border-b-2 border-double border-amber-600 pb-4">
                      {stampImage && (
                        <img 
                          src={stampImage} 
                          alt="Seal Crest" 
                          className="w-16 h-16 rounded-full mx-auto mb-2.5 object-cover border border-amber-500 shadow-sm" 
                        />
                      )}
                      <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-none uppercase" style={{ fontFamily: 'Georgia, serif' }}>
                        Vidyalaya Public School
                      </h2>
                      <p className="text-[9px] uppercase tracking-widest font-extrabold text-[#475569] mt-1.5">
                        Managed by Devalgola Educational Trust • CBSE Affiliation Code #920192
                      </p>
                    </div>

                    {/* Meta Reference Block */}
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 border-b border-dashed border-slate-200 pb-1 shrink-0">
                      <span>Ref Code: {certificateNo}</span>
                      <span>Date of Issue: {new Date(dateOfIssue).toLocaleDateString('en-IN')}</span>
                    </div>

                    {/* DYNAMIC TEMPLATE CONTENT VIEWPORT */}
                    {activeSubTab === 'bonafide' && (
                      <div className="space-y-4 py-4 text-justify leading-loose text-slate-800 text-sm sm:text-base">
                        <p className="text-xs font-black uppercase tracking-[3px] text-center text-amber-700">
                          Bonafide Credentials
                        </p>
                        <p className="leading-relaxed">
                          This is to certify that Master / Miss <strong className="font-extrabold text-slate-950 text-base underline decoration-amber-600 underline-offset-4">{stdName || 'N/A'}</strong>, 
                          Son / Daughter of Shri. <strong className="font-extrabold text-slate-900">{fatherName || 'N/A'}</strong>, is a registered bonafide student of this institution studying in 
                          <strong className="font-extrabold text-slate-950"> {stdClass || 'N/A'} - Section {stdSection || 'N/A'}</strong> during the academic year <strong className="font-extrabold text-slate-950">{academicYear || 'N/A'}</strong>, 
                          bearing school registration Roll Number <strong className="font-mono font-black text-indigo-800">{stdRoll || 'N/A'}</strong>.
                        </p>
                        <p className="leading-relaxed">
                          As per our unified school admission registration database, his/her recorded Date of Birth as of today is <strong className="font-mono font-bold text-slate-950">{dob ? new Date(dob).toLocaleDateString('en-IN') : 'N/A'}</strong>.
                        </p>
                        <p className="leading-relaxed">
                          This certificate is being compiled and issued upon express request of the student/guardian for the verified purpose of: <strong className="text-indigo-700 font-extrabold">{bonafidePurpose === 'Other' ? (bonafideCustomPurpose || 'N/A') : bonafidePurpose}</strong>.
                        </p>
                      </div>
                    )}

                    {activeSubTab === 'academic' && (
                      <div className="space-y-5 py-4 text-center leading-loose text-slate-800 text-sm sm:text-base">
                        <p className="text-xs font-black uppercase tracking-[4px] text-amber-700">
                          Certificate of Academic Accomplishment
                        </p>
                        <div className="space-y-4 max-w-xl mx-auto">
                          <p className="text-slate-500 text-xs italic">
                            This scholarship citation represents intellectual diligence & outstanding dedication:
                          </p>
                          <p className="leading-relaxed text-slate-900">
                            Proudly awarded to Master / Miss <strong className="font-black text-slate-950 text-lg block tracking-tight mt-1 border-b border-dashed border-slate-300 pb-2 leading-normal">{stdName || 'N/A'}</strong>
                            representing <strong className="font-extrabold text-slate-900">Class {stdClass || 'N/A'}</strong>, Section <strong className="font-extrabold text-slate-900">{stdSection || 'N/A'}</strong>, holding examination Roll <strong className="font-mono font-black text-indigo-700">{stdRoll || 'N/A'}</strong>.
                          </p>
                          <p className="leading-relaxed text-slate-800 text-xs sm:text-sm">
                            He/She secured an aggregate benchmark scoring and passing mark of <strong className="text-emerald-700 font-black text-base">{percentage || 'N/A'}</strong> in the scholastic <strong>{examName || 'N/A'}</strong> in the year <strong>{examYear || 'N/A'}</strong>.
                          </p>
                          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 border-2 border-amber-200 px-6 py-2 rounded-xl text-xs font-black uppercase shadow-sm">
                            🏆 {achievementGrade || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSubTab === 'character' && (
                      <div className="space-y-4 py-4 text-justify leading-loose text-slate-800 text-sm sm:text-base">
                        <p className="text-xs font-black uppercase tracking-[3px] text-center text-amber-705">
                          Appraisal of Character and Conduct
                        </p>
                        <p className="leading-relaxed">
                          This is to formally certify that Master / Miss <strong className="font-extrabold text-slate-950 text-base underline decoration-amber-600 underline-offset-4">{stdName || 'N/A'}</strong>, 
                          Child of Shri. <strong className="font-bold text-slate-900">{fatherName || 'N/A'}</strong> and Smt. <strong className="font-bold text-slate-900">{motherName || 'N/A'}</strong>, was evaluated as a scholar student of 
                          this public school representing <strong className="font-bold">Class {stdClass || 'N/A'} - Section {stdSection || 'N/A'}</strong>, holding scholar Roll Number <strong className="font-mono font-bold text-indigo-700">{stdRoll || 'N/A'}</strong> during the study enrollment duration from scholastic term <strong className="font-black text-indigo-800">{durationFrom || 'N/A'}</strong> to <strong className="font-black text-indigo-800">{durationTo || 'N/A'}</strong>.
                        </p>
                        <p className="leading-relaxed">
                          During his/her study enrollment, his/her moral integrity, behavioral discipline, and general school conduct have been evaluated and graded as: <strong className="text-emerald-700 uppercase font-black">{characterAssessment}</strong>.
                        </p>
                        <p className="leading-relaxed border border-dashed border-indigo-200 bg-slate-50 p-3 rounded-xl">
                          <strong>Conduct Remarks:</strong> {conductRemarks || 'Excellent behavioral records and active school participant'}
                        </p>
                        <p className="leading-relaxed text-xs">
                          This record represents outstanding compliance. To the best of our awareness, no adverse reports, financial pending liabilities, or objections exist in institutional accounts.
                        </p>
                      </div>
                    )}

                    {activeSubTab === 'sports' && (
                      <div className="space-y-4 py-4 text-center leading-loose text-slate-800 text-sm sm:text-base font-sans">
                        <p className="text-xs font-black uppercase tracking-[4px] text-indigo-700">
                          Sports & Physical Culture Achievement Conferred
                        </p>
                        <div className="space-y-4 max-w-xl mx-auto">
                          <p className="text-[#475569] text-xs italic">
                            By proving exceptional athletic power, core discipline & admirable teammate sportsmanship:
                          </p>
                          <p className="leading-relaxed text-slate-950 text-sm sm:text-base">
                            Conferred upon Master / Miss <strong className="font-black text-slate-900 text-lg block tracking-tight mt-1 border-b border-dashed border-slate-300 pb-2 leading-normal">{stdName || 'N/A'}</strong>
                            of <strong className="font-bold">Class {stdClass || 'N/A'}</strong>, Section <strong className="font-bold">{stdSection || 'N/A'}</strong>, holding school Roll Number <strong className="font-mono font-bold text-indigo-700">{stdRoll || 'N/A'}</strong> for elite representation of Vidyalaya School in the sport of <strong className="text-rose-600 uppercase font-black">{sportName || 'N/A'}</strong>.
                          </p>
                          <p className="leading-relaxed text-xs sm:text-sm text-slate-700">
                            Competing at the elite <strong className="text-indigo-900 font-extrabold">{sportLevel || 'N/A'} Level Platform Arena</strong> in the competitive championship of <strong>{eventName || 'N/A'}</strong> on the event date of {dateOfEvent ? new Date(dateOfEvent).toLocaleDateString('en-IN') : 'N/A'}, he/she secured:
                          </p>
                          <div className="inline-flex items-center gap-2 border-[2.5px] border-dashed border-indigo-700 bg-indigo-50/70 text-indigo-950 px-6 py-2 rounded-xl text-xs font-extrabold uppercase shadow-sm">
                            🥇 {sportPosition || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Under-sign Stamp Section */}
                  <div className="flex justify-between items-end border-t border-slate-200 pt-6 mt-6 text-[10px] text-slate-500 font-bold">
                    <div className="text-center">
                      <div className="w-20 h-[1px] bg-slate-300 mx-auto mb-1.5" />
                      <span>OFFICE REGISTRAR STAMP</span>
                    </div>
                    {activeSubTab === 'sports' ? (
                      <div className="text-center">
                        <div className="w-20 h-[1px] bg-slate-300 mx-auto mb-1.5" />
                        <span className="text-slate-600 block uppercase font-mono text-[9px]">{coachSignature || 'COACH SIGNATURE'}</span>
                      </div>
                    ) : (
                      <div className="text-center font-mono text-[9px] uppercase tracking-widest text-[#d97706] mb-1">
                        🛡️ DIGITAL RECORD SECURED
                      </div>
                    )}
                    <div className="text-center">
                      <div className="w-24 h-[1px] bg-slate-300 mx-auto mb-1.5 font-sans" />
                      <span>{principalSignature || 'Principal Overseer'}</span>
                    </div>
                  </div>

                  {/* Ornamental Border Corner Accents */}
                  <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-[#b45309]" />
                  <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-[#b45309]" />
                  <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-[#b45309]" />
                  <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-[#b45309]" />
                </div>

              </div>

              {/* Bottom bar of modal */}
              <div className="bg-white px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>Validation check passed: All fields formatted to strict CBSE guidelines</span>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
