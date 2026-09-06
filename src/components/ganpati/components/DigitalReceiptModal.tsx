import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Printer, 
  Share2, 
  Download, 
  CheckCircle, 
  ShieldCheck, 
  Sparkles, 
  Copy, 
  Check,
  Palette,
  FileText,
  Smartphone,
  Banknote,
  Landmark,
  CreditCard,
  QrCode,
  Award,
  Loader2,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { DigitalPavati, MandalProfile, MandalLanguage, ReceiptTemplateId } from '../types';

interface DigitalReceiptModalProps {
  pavati: DigitalPavati;
  mandal: MandalProfile;
  lang: MandalLanguage;
  onClose: () => void;
}

// Convert amount to Marathi / English words
function amountToWords(amount: number, lang: MandalLanguage): string {
  if (lang === 'mr' || lang === 'hi') {
    return `${amount.toLocaleString('en-IN')} रुपये फक्त`;
  }
  return `Rupees ${amount.toLocaleString('en-IN')} Only`;
}

// Template styling configurations
const receiptTemplates: Record<ReceiptTemplateId, {
  nameMr: string;
  nameEn: string;
  subHeaderMr: string;
  shloka: string;
  borderClass: string;
  bgClass: string;
  headerGrad: string;
  textTitleColor: string;
  accentBadge: string;
  watermarkIcon: string;
  watermarkText: string;
  themeColor: string;
}> = {
  peshwai: {
    nameMr: 'शाही पेशवाई भगवा (Peshwai Saffron)',
    nameEn: 'Royal Peshwai Saffron & Gold',
    subHeaderMr: '॥ श्रीमंत बाप्पांच्या चरणी सप्रेम देणगी पावती ॥',
    shloka: '॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥',
    borderClass: 'border-4 border-amber-600 dark:border-amber-500 ring-4 ring-amber-200/70 dark:ring-amber-900/40 ring-offset-2',
    bgClass: 'bg-gradient-to-b from-amber-50/90 via-orange-50/40 to-amber-50/90 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900',
    headerGrad: 'from-amber-600 via-orange-600 to-amber-700',
    textTitleColor: 'text-amber-950 dark:text-amber-400',
    accentBadge: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    watermarkIcon: '👑',
    watermarkText: 'ॐ गं गणपतये नमः',
    themeColor: '#d97706'
  },
  marigold: {
    nameMr: 'झेंडू व कुंकुमारक्त (Marigold & Crimson)',
    nameEn: 'Heritage Marigold & Crimson Red',
    subHeaderMr: '॥ मंगलमूर्ती मोरया - मंगलमय उत्सव पावती ॥',
    shloka: '॥ प्रणम्य शिरसा देवं गौरीपुत्रं विनायकम् । भक्तावासं स्मरेन्नित्यमायुःकामार्थसिद्धये ॥',
    borderClass: 'border-4 border-red-600 dark:border-red-500 ring-4 ring-orange-300/80 dark:ring-orange-950 ring-offset-2',
    bgClass: 'bg-gradient-to-b from-red-50/80 via-orange-50/50 to-red-50/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900',
    headerGrad: 'from-red-600 via-orange-600 to-rose-700',
    textTitleColor: 'text-red-950 dark:text-red-400',
    accentBadge: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
    watermarkIcon: '🌺',
    watermarkText: 'श्री गणेशाय नमः',
    themeColor: '#dc2626'
  },
  temple: {
    nameMr: 'पुरातन ताम्रपत्र (Temple Parchment)',
    nameEn: 'Temple Parchment & Vedic Script',
    subHeaderMr: '॥ श्री गणेश कृपाशीर्वाद अधिकृत देणगी पावती पत्र ॥',
    shloka: '॥ गजाननाय महसे नमः परशुधारिणे । मूषकवाहनाय तुभ्यं सर्वविघ्नविनाशिने ॥',
    borderClass: 'border-4 border-dashed border-amber-800 dark:border-amber-600 ring-2 ring-amber-400/50 dark:ring-amber-800 ring-offset-1',
    bgClass: 'bg-[#fdf8ee] dark:bg-zinc-900',
    headerGrad: 'from-amber-800 via-amber-900 to-stone-900',
    textTitleColor: 'text-amber-950 dark:text-amber-300',
    accentBadge: 'bg-stone-100 text-stone-900 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    watermarkIcon: '🕉️',
    watermarkText: 'ॐ तत्पुरुषाय विद्महे वक्रतुण्डाय धीमहि',
    themeColor: '#78350f'
  },
  ecogreen: {
    nameMr: 'पर्यावरणपूरक दुर्वा (Eco-Durva Green)',
    nameEn: 'Eco-Friendly Durva Green & Gold',
    subHeaderMr: '॥ पर्यावरणपूरक शाडू माती गणेशोत्सव २०२६ ॥',
    shloka: '॥ एकदन्ताय विद्महे वक्रतुण्डाय धीमहि तन्नो दन्तिः प्रचोदयात् ॥',
    borderClass: 'border-4 border-emerald-700 dark:border-emerald-600 ring-4 ring-emerald-200 dark:ring-emerald-950 ring-offset-2',
    bgClass: 'bg-gradient-to-b from-emerald-50/80 via-teal-50/40 to-emerald-50/80 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900',
    headerGrad: 'from-emerald-700 via-teal-700 to-emerald-800',
    textTitleColor: 'text-emerald-950 dark:text-emerald-300',
    accentBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    watermarkIcon: '🌿',
    watermarkText: 'पर्यावरणपूरक उत्सव',
    themeColor: '#047857'
  }
};

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  pavati,
  mandal,
  lang,
  onClose
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplateId>('peshwai');
  const [printLayout, setPrintLayout] = useState<'a4' | 'thermal'>('a4');
  const [showWatermark, setShowWatermark] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [showQrVerificationDetails, setShowQrVerificationDetails] = useState(false);

  const tConfig = receiptTemplates[selectedTemplate];

  // Robust verification payload encoding Receipt ID, Mandal, and Donor details for Instant Scanning & Verification
  const verificationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/live/ganpati-mandal?verifyReceipt=${encodeURIComponent(pavati.receiptNumber)}`
    : `https://ganpati-erp.app/verify/${pavati.receiptNumber}`;

  const qrPayload = JSON.stringify({
    receiptId: pavati.receiptNumber,
    pavatiId: pavati.id,
    donor: pavati.donorName,
    amount: pavati.amount,
    date: pavati.date,
    time: pavati.time,
    category: pavati.category,
    paymentMode: pavati.paymentMode,
    mandal: mandal.nameMr,
    regNumber: mandal.regNumber,
    verifyUrl: verificationUrl,
    authSeal: 'TRUST_AUTHENTIC_2026'
  });

  const handlePrint = () => {
    window.print();
  };

  // PDF Download Generation using html2canvas and jsPDF
  const handleDownloadPDF = async () => {
    if (!receiptRef.current || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);

      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2.5, // 300dpi-equivalent print clarity
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        onclone: (clonedDoc) => {
          const clonedReceipt = clonedDoc.getElementById('digital-receipt-printable');
          if (clonedReceipt) {
            clonedReceipt.style.boxShadow = 'none';
            clonedReceipt.style.margin = '0 auto';
            clonedReceipt.style.width = '100%';
            clonedReceipt.style.backgroundColor = '#ffffff';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Setup jsPDF in A4 Portrait mode (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const margin = 10; // 10mm margins on all sides
      const maxContentWidth = pageWidth - (margin * 2); // 190mm
      const maxContentHeight = pageHeight - (margin * 2); // 277mm

      const imgWidth = maxContentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Position nicely on the A4 page
      const xPos = margin;
      const yPos = imgHeight < maxContentHeight ? margin + ((maxContentHeight - imgHeight) / 5) : margin;

      pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'FAST');

      const safeDonorName = (pavati.donorName || 'Donor').replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_');
      const filename = `Pavati_${pavati.receiptNumber}_${safeDonorName}.pdf`;

      pdf.save(filename);

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      // Fallback to window print
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleWhatsAppShare = () => {
    const modeUpper = (pavati.paymentMode || 'CASH').toUpperCase();
    const text = encodeURIComponent(
      `🚩 *${mandal.nameMr}* 🚩\n` +
      `----------------------------------------\n` +
      `*श्री गणेशोत्सव २०२६ - अधिकृत डिजिटल पावती*\n` +
      `----------------------------------------\n` +
      `📄 *पावती क्र (Receipt ID):* ${pavati.receiptNumber}\n` +
      `👤 *देणगीदार (Donor):* ${pavati.donorName}\n` +
      `💰 *रक्कम (Amount):* ₹${pavati.amount.toLocaleString('en-IN')} (${amountToWords(pavati.amount, 'mr')})\n` +
      `🏷️ *वर्गवारी (Category):* ${pavati.category}\n` +
      `💳 *भरणा पद्धत (Mode):* ${modeUpper} ${pavati.transactionRef ? `(Ref/UTR: ${pavati.transactionRef})` : ''}\n` +
      `📅 *दिनांक (Date):* ${pavati.date} ${pavati.time}\n` +
      `✍️ *पावती देणारा:* ${pavati.receivedBy}\n` +
      `🏢 *नोंदणी क्र:* ${mandal.regNumber}\n` +
      `🔍 *ऑनलाइन पडताळणी लिंक (Verify):* ${verificationUrl}\n` +
      `----------------------------------------\n` +
      `श्री गणेशाची असीम कृपा आपणावर व आपल्या परिवारावर सदैव राहो हीच बाप्पा चरणी प्रार्थना!\n` +
      `|| गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ||`
    );
    const phoneClean = pavati.phone.replace(/[^0-9]/g, '');
    const url = phoneClean ? `https://wa.me/91${phoneClean}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `🚩 ${mandal.nameMr} | पावती क्र (Receipt ID): ${pavati.receiptNumber} | देणगीदार: ${pavati.donorName} | रक्कम: ₹${pavati.amount.toLocaleString('en-IN')} | पडताळणी: ${verificationUrl}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Payment Mode Badge styling helper
  const getModeInfo = (mode: string) => {
    const m = (mode || '').toLowerCase();
    if (m.includes('cash') || m.includes('रोख')) {
      return { label: 'रोख भरणा (Cash)', icon: Banknote, color: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' };
    }
    if (m.includes('gpay') || m.includes('google')) {
      return { label: 'Google Pay (UPI)', icon: Smartphone, color: 'text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300' };
    }
    if (m.includes('phonepe')) {
      return { label: 'PhonePe (UPI)', icon: Smartphone, color: 'text-purple-700 bg-purple-50 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300' };
    }
    if (m.includes('paytm')) {
      return { label: 'Paytm (UPI)', icon: Smartphone, color: 'text-cyan-700 bg-cyan-50 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300' };
    }
    if (m.includes('upi')) {
      return { label: 'BHIM / UPI Transfer', icon: Smartphone, color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' };
    }
    if (m.includes('bank') || m.includes('neft') || m.includes('rtgs') || m.includes('netbanking')) {
      return { label: 'बँक ट्रान्सफर (NEFT/RTGS)', icon: Landmark, color: 'text-indigo-700 bg-indigo-50 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300' };
    }
    if (m.includes('cheque') || m.includes('धनादेश')) {
      return { label: 'धनादेश (Cheque)', icon: CreditCard, color: 'text-rose-700 bg-rose-50 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300' };
    }
    return { label: mode.toUpperCase(), icon: CheckCircle, color: 'text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' };
  };

  const modeInfo = getModeInfo(pavati.paymentMode);
  const ModeIcon = modeInfo.icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
      onClick={onClose}
    >
      {/* Slide up from bottom modal sheet animation */}
      <motion.div 
        initial={{ opacity: 0, y: "100%", scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: "100%", scale: 0.96 }}
        transition={{ 
          type: "spring", 
          damping: 28, 
          stiffness: 280, 
          mass: 0.75 
        }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden border border-amber-200/50 dark:border-amber-900/30 my-0 sm:my-auto max-h-[94vh] flex flex-col print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none print:rounded-none print:max-h-none"
      >
        {/* Mobile Pull-Down Indicator Pill */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-stone-900 print:hidden">
          <div className="w-12 h-1.5 rounded-full bg-stone-700/80" />
        </div>

        {/* Top Control Bar with Theme Selector - Hidden on Print */}
        <div className="flex flex-col gap-3 px-5 py-3.5 bg-gradient-to-r from-stone-900 via-zinc-900 to-stone-900 text-white border-b border-stone-800 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400" size={18} />
              <span className="font-bold text-sm tracking-wide text-amber-200">
                {lang === 'mr' ? 'पारंपरिक डिजिटल पावती' : 'Authentic Digital Pavati'}
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-mono font-bold">
                {pavati.receiptNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* PDF Download Button with jsPDF & html2canvas */}
              <button
                id="modal-download-pdf-top-btn"
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:bg-red-700 disabled:opacity-75 rounded-xl text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/40 cursor-pointer"
                title="Download formatted PDF receipt"
              >
                {isGeneratingPdf ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : pdfSuccess ? (
                  <Check size={15} className="text-white" />
                ) : (
                  <Download size={15} className="text-white" />
                )}
                <span>
                  {isGeneratingPdf 
                    ? (lang === 'mr' ? 'PDF तयार होत आहे...' : 'Generating PDF...')
                    : pdfSuccess
                    ? (lang === 'mr' ? 'PDF डाऊनलोड झाली!' : 'PDF Saved!')
                    : (lang === 'mr' ? 'PDF डाऊनलोड' : 'Download PDF')}
                </span>
              </button>

              {/* Print Receipt Button */}
              <button 
                id="modal-print-receipt-top-btn"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-950/40 cursor-pointer"
                title="Print Receipt via Printer or Save as PDF"
              >
                <Printer size={15} className="text-amber-100" />
                <span className="hidden sm:inline">{lang === 'mr' ? 'पावती प्रिंट करा' : 'Print Receipt'}</span>
              </button>

              {/* WhatsApp Share Button */}
              <button 
                onClick={handleWhatsAppShare}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                title={`Send Receipt on WhatsApp to ${pavati.phone}`}
              >
                <Share2 size={15} />
                <span className="hidden md:inline">WhatsApp</span>
              </button>

              {/* Close Button */}
              <button 
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Style Customizer Tabs & Layout Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-xs">
            {/* Template selector pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              <span className="text-gray-400 font-semibold flex items-center gap-1 shrink-0 mr-1">
                <Palette size={13} />
                {lang === 'mr' ? 'रंगसंगती:' : 'Theme:'}
              </span>
              {(Object.keys(receiptTemplates) as ReceiptTemplateId[]).map((tmplKey) => (
                <button
                  key={tmplKey}
                  onClick={() => setSelectedTemplate(tmplKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedTemplate === tmplKey
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                      : 'bg-stone-800 text-gray-300 hover:bg-stone-700'
                  }`}
                >
                  {receiptTemplates[tmplKey].nameMr.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Layout switch (A4 Full / POS Thermal Slip) & Watermark */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center bg-stone-800 p-0.5 rounded-lg border border-stone-700">
                <button
                  onClick={() => setPrintLayout('a4')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printLayout === 'a4' ? 'bg-amber-500 text-stone-950' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  A4 पूर्ण पावती
                </button>
                <button
                  onClick={() => setPrintLayout('thermal')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    printLayout === 'thermal' ? 'bg-amber-500 text-stone-950' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  थर्मल पावती स्लिप
                </button>
              </div>

              {/* Watermark Toggle */}
              <button
                onClick={() => setShowWatermark(!showWatermark)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  showWatermark
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-stone-800 border-stone-700 text-gray-400'
                }`}
                title="Toggle auspicious watermark"
              >
                वॉटरमार्क {showWatermark ? 'चालू' : 'बंद'}
              </button>
            </div>
          </div>
        </div>

        {/* Specific CSS Print Media Queries for Perfect Receipt Formatting */}
        <style>{`
          @media print {
            @page {
              size: ${printLayout === 'thermal' ? '80mm auto' : 'A4 portrait'};
              margin: ${printLayout === 'thermal' ? '3mm' : '8mm 10mm'};
            }

            /* Hide everything in the document by default */
            body * {
              visibility: hidden !important;
            }

            /* Specifically display only the printable receipt */
            #digital-receipt-printable,
            #digital-receipt-printable * {
              visibility: visible !important;
            }

            #digital-receipt-printable {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: ${printLayout === 'thermal' ? '4px' : '8px 12px'} !important;
              background-color: #ffffff !important;
              color: #111827 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
              box-shadow: none !important;
              border: none !important;
            }

            .print\\:hidden,
            header,
            footer,
            nav,
            button,
            [role="dialog"] > div > .print\\:hidden {
              display: none !important;
            }

            .receipt-frame-box {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-shadow: none !important;
              background-color: #ffffff !important;
            }

            /* Ensure dark mode colors revert to clean high-contrast black/amber on paper */
            .text-gray-900, .dark\\:text-gray-100, .dark\\:text-white, .text-gray-800 {
              color: #111827 !important;
            }
            .text-gray-600, .dark\\:text-gray-400, .text-gray-500 {
              color: #4b5563 !important;
            }

            /* Avoid page breaks inside table / cards / signatures */
            .no-page-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>

        {/* Scrollable Printable Receipt Container */}
        <div className="overflow-y-auto flex-1">
          <div 
            id="digital-receipt-printable"
            ref={receiptRef} 
            className={`p-4 sm:p-8 ${tConfig.bgClass} text-gray-900 dark:text-gray-100 relative print:p-2 print:bg-white ${printLayout === 'thermal' ? 'thermal-mode' : ''}`}
          >
            
            {/* Thermal Slip Layout Option */}
            {printLayout === 'thermal' ? (
              <div className="receipt-frame-box max-w-md mx-auto bg-white dark:bg-zinc-900 border-2 border-dashed border-gray-400 dark:border-zinc-700 rounded-2xl p-5 shadow-md font-mono text-xs text-gray-800 dark:text-gray-200 print:max-w-none print:border-black print:text-black">
                <div className="text-center pb-3 border-b border-dashed border-gray-300 dark:border-zinc-700 mb-3">
                  <p className="text-xs font-bold text-amber-700">॥ श्री गणेशाय नमः ॥</p>
                  <h3 className="text-base font-black uppercase mt-1">{mandal.nameMr}</h3>
                  <p className="text-[10px] text-gray-500">{mandal.addressMr}</p>
                  <p className="text-[10px] text-gray-500">नोंदणी क्र: {mandal.regNumber} • मो: {mandal.phone}</p>
                  <div className="mt-2 inline-block px-2.5 py-0.5 bg-black text-white text-[10px] font-bold rounded uppercase">
                    अधिकृत डिजिटल पावती स्लिप
                  </div>
                </div>

                <div className="space-y-1.5 border-b border-dashed border-gray-300 dark:border-zinc-700 pb-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">पावती क्र (Receipt ID):</span>
                    <span className="font-bold">{pavati.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">दिनांक व वेळ:</span>
                    <span>{pavati.date} {pavati.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">देणगीदार नाव:</span>
                    <span className="font-black text-right">{pavati.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">मोबाईल क्र:</span>
                    <span>+91 {pavati.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">वर्गवारी:</span>
                    <span>{pavati.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">भरणा पद्धत:</span>
                    <span className="font-bold uppercase">{pavati.paymentMode}</span>
                  </div>
                  {pavati.transactionRef && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">UTR / Ref:</span>
                      <span className="font-mono">{pavati.transactionRef}</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-lg text-center mb-3">
                  <span className="text-[10px] text-gray-500 block">एकूण प्राप्त देणगी रक्कम</span>
                  <span className="text-2xl font-black block">₹ {pavati.amount.toLocaleString('en-IN')} /-</span>
                  <span className="text-[10px] font-serif italic text-gray-600 dark:text-gray-300">{amountToWords(pavati.amount, 'mr')}</span>
                </div>

                {/* QR Code in Thermal Slip with encoded Receipt ID */}
                <div className="flex flex-col items-center justify-center py-2 border-b border-dashed border-gray-300 dark:border-zinc-700 mb-3">
                  <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm inline-block">
                    <QRCodeSVG value={qrPayload} size={84} level="M" />
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 font-mono font-bold">
                    Scan to Verify Receipt ID: {pavati.receiptNumber}
                  </span>
                </div>

                <div className="flex justify-between items-end pt-2 text-[10px]">
                  <div className="text-center">
                    <p className="font-bold">{pavati.receivedBy}</p>
                    <p className="text-gray-500 text-[8px]">पावती देणारा</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{mandal.treasurerName}</p>
                    <p className="text-gray-500 text-[8px]">खजिनदार</p>
                  </div>
                </div>

                <div className="text-center mt-3 pt-2 border-t border-dashed border-gray-300 text-[9px] text-gray-500">
                  || गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ||
                </div>
              </div>
            ) : (
              /* A4 Authentic Grand Cultural Traditional Certificate & Receipt */
              <div className={`receipt-frame-box max-w-2xl mx-auto bg-white/95 dark:bg-zinc-900/95 rounded-3xl ${tConfig.borderClass} p-5 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm`}>
                
                {/* Traditional Auspicious Watermark Background */}
                {showWatermark && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.035] dark:opacity-[0.045] select-none -z-0">
                    <span className="text-[120px] sm:text-[160px] leading-none">{tConfig.watermarkIcon}</span>
                    <span className="text-2xl font-bold font-serif uppercase tracking-widest mt-2">{tConfig.watermarkText}</span>
                  </div>
                )}

                {/* Top Sacred Shloka Header Banner */}
                <div className="text-center pb-3 mb-4 border-b-2 border-amber-300/80 dark:border-amber-800/80">
                  <p className="text-amber-900 dark:text-amber-300 font-serif text-xs md:text-sm font-bold tracking-wide">
                    {tConfig.shloka}
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400 font-bold mt-1">
                    {tConfig.subHeaderMr}
                  </p>
                </div>

                {/* Mandal Main Branding Header */}
                <div className="text-center mb-5 relative">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-1.5">
                    <span className={`inline-block px-3 py-0.5 ${tConfig.accentBadge} border text-[10px] font-bold rounded-full uppercase tracking-wider`}>
                      नोंदणी क्र: {mandal.regNumber}
                    </span>
                    <span className="inline-block px-3 py-0.5 bg-amber-500 text-stone-950 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                      स्थापना: {mandal.establishedYear} (४४ वे वर्ष)
                    </span>
                  </div>
                  
                  <h2 className={`text-2xl md:text-3xl font-black ${tConfig.textTitleColor} tracking-tight leading-tight`}>
                    {mandal.nameMr}
                  </h2>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-xl mx-auto">
                    {mandal.addressMr} • मो: {mandal.phone} • ई-मेल: {mandal.email}
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className={`px-4 py-1 bg-gradient-to-r ${tConfig.headerGrad} text-white text-xs font-black rounded-lg uppercase tracking-wider shadow-sm flex items-center gap-1.5`}>
                      <Sparkles size={13} />
                      श्री गणेशोत्सव २०२६ - अधिकृत देणगी पावती
                    </div>
                  </div>
                </div>

                {/* Receipt Metadata Bar (Receipt No, Date & Time, Payment Mode) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-amber-50/90 dark:bg-zinc-800/80 border border-amber-200 dark:border-amber-900/60 rounded-2xl mb-5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold">
                      <FileText size={16} />
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold">पावती क्र. / Receipt ID</span>
                      <span className="font-mono font-black text-amber-950 dark:text-amber-300 text-sm tracking-wider">{pavati.receiptNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-amber-200 dark:border-amber-900/40 pt-2 sm:pt-0 sm:pl-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-800 dark:text-orange-300 flex items-center justify-center font-bold">
                      <Award size={16} />
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold">दिनांक व वेळ / Date & Time</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{pavati.date} • {pavati.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t sm:border-t-0 sm:border-l border-amber-200 dark:border-amber-900/40 pt-2 sm:pt-0 sm:pl-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold">
                      <ModeIcon size={16} />
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-[10px] uppercase font-semibold">भरणा पद्धत / Payment Mode</span>
                      <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md border ${modeInfo.color}`}>
                        <CheckCircle size={11} />
                        {modeInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Donor Details Structured Section */}
                <div className="bg-white/80 dark:bg-zinc-800/40 border border-amber-100 dark:border-zinc-800 rounded-2xl p-4 mb-5 space-y-2.5 text-xs sm:text-sm">
                  
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dashed border-amber-200 dark:border-amber-900/50 pb-2 gap-1">
                    <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs flex items-center gap-1">
                      <span>👤</span> देणगीदार श्री / सौ / मे. (Donor Name):
                    </span>
                    <span className="font-black text-base text-gray-900 dark:text-white tracking-wide">
                      {pavati.donorName}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-dashed border-amber-200 dark:border-amber-900/50 pb-2">
                    <div className="flex items-baseline justify-between sm:justify-start gap-3">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs">📱 मोबाईल क्र:</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200">+91 {pavati.phone}</span>
                    </div>
                    {pavati.email && (
                      <div className="flex items-baseline justify-between sm:justify-start gap-3">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs">✉️ ई-मेल:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{pavati.email}</span>
                      </div>
                    )}
                  </div>

                  {pavati.address && (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-dashed border-amber-200 dark:border-amber-900/50 pb-2 gap-1">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs">🏠 पत्ता / रहिवासी:</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-right sm:text-left">{pavati.address}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-dashed border-amber-200 dark:border-amber-900/50 pb-2">
                    <div className="flex items-baseline justify-between sm:justify-start gap-2">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs">🏷️ देणगी वर्गवारी:</span>
                      <span className="font-bold text-amber-800 dark:text-amber-400">{pavati.category}</span>
                    </div>
                    {pavati.transactionRef && (
                      <div className="flex items-baseline justify-between sm:justify-start gap-2">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs">🔢 UTR / Ref No:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{pavati.transactionRef}</span>
                      </div>
                    )}
                  </div>

                  {pavati.notes && (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pt-1 gap-1">
                      <span className="text-gray-500 dark:text-gray-400 font-semibold text-xs">🪔 संकल्प / शेरा:</span>
                      <span className="italic text-gray-800 dark:text-gray-200">{pavati.notes}</span>
                    </div>
                  )}
                </div>

                {/* Highlighted Amount & QR Code Verification Box */}
                <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shadow-sm">
                  <div>
                    <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1">
                      <Sparkles size={13} className="text-amber-600" />
                      प्राप्त झालेली एकूण रक्कम (Amount Received)
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-300 mt-0.5">
                      ₹ {pavati.amount.toLocaleString('en-IN')} /-
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 font-serif italic mt-0.5 font-medium">
                      अक्षरी: {amountToWords(pavati.amount, 'mr')}
                    </p>
                  </div>

                  {/* QR Code Verification Badge Encoding Receipt ID with Interactive Verification Viewer */}
                  <div 
                    onClick={() => setShowQrVerificationDetails(true)}
                    className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm shrink-0 cursor-pointer hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-md transition-all group"
                    title="Click to view QR Code details & instant scan verification"
                  >
                    <div className="relative bg-white p-1 rounded-lg border border-amber-100">
                      <QRCodeSVG value={qrPayload} size={64} level="M" />
                      <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                        <Maximize2 size={14} className="text-amber-900" />
                      </div>
                    </div>
                    <div className="text-[10px] leading-tight space-y-0.5">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={13} /> डिजिटल प्रमाणित
                      </span>
                      <span className="text-gray-500 block">स्कॅन करून पावती पडताळा</span>
                      <span className="font-mono font-bold text-amber-900 dark:text-amber-300 block">{pavati.receiptNumber}</span>
                      <span className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 underline">
                        पडताळणी माहिती <ExternalLink size={9} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legal, Tax & Audit Notice */}
                <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-5 bg-amber-50/50 dark:bg-zinc-800/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-zinc-800 space-y-0.5">
                  <p>• ही पावती मंडळाची संगणकीकृत अधिकृत डिजिटल पावती असून धर्मादाय आयुक्तांच्या नियमांनुसार वैध आहे.</p>
                  <p>• मंडळाची नोंदणी मुंबई सार्वजनिक विश्वस्त व्यवस्था अधिनियम १९५० अन्वये धर्मादाय आयुक्तांकडे नोंदणीकृत आहे.</p>
                  {pavati.panNumber && (
                    <p className="font-bold text-amber-900 dark:text-amber-300">• देणगीदार पॅन: {pavati.panNumber} (80G आयकर सवलत प्रमाणपत्र पात्र)</p>
                  )}
                </div>

                {/* Signature & Seal Footer Grid */}
                <div className="grid grid-cols-3 items-end pt-3 border-t-2 border-amber-300/80 dark:border-amber-800/80 text-xs">
                  
                  {/* Received By */}
                  <div className="text-center sm:text-left">
                    <div className="h-9 flex items-end">
                      <span className="font-serif italic font-bold text-amber-950 dark:text-amber-300 text-xs">
                        {pavati.receivedBy || 'अधिकृत प्रतिनिधी'}
                      </span>
                    </div>
                    <div className="border-t border-gray-400 dark:border-gray-600 pt-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                      पावती देणारा / लिपिक
                    </div>
                  </div>

                  {/* Mandal Official Seal / Stamp */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-700 dark:border-amber-500 bg-amber-50/50 dark:bg-zinc-800 flex flex-col items-center justify-center text-[8px] font-black text-amber-800 dark:text-amber-300 text-center leading-tight shadow-inner">
                      <span>श्री शिवतेज</span>
                      <span>गणेश मंडळ</span>
                      <span>मुहर २०२६</span>
                      <span className="text-[7px] text-red-600 font-bold">पुणे</span>
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1 uppercase font-bold">अधिकृत शिक्का</span>
                  </div>

                  {/* Treasurer Signature */}
                  <div className="text-center sm:text-right">
                    <div className="h-9 flex items-end justify-center sm:justify-end">
                      <span className="font-serif italic font-bold text-amber-950 dark:text-amber-300 text-xs">
                        {mandal.treasurerName || 'महेश गायकवाड (खजिनदार)'}
                      </span>
                    </div>
                    <div className="border-t border-gray-400 dark:border-gray-600 pt-1 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                      खजिनदार / Treasurer
                    </div>
                  </div>
                </div>

                {/* Auspicious Blessing Tag */}
                <div className="text-center mt-4 pt-2 border-t border-dashed border-amber-200 dark:border-amber-900/40">
                  <p className="text-xs font-black text-orange-600 dark:text-orange-400 tracking-wider">
                    🚩 गणपती बाप्पा मोरया, मंगलमूर्ती मोरया • सुखकर्ता दुःखहर्ता वार्ता विघ्नाची 🚩
                  </p>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* QR Code Instant Verification Details Modal / Flyout */}
        <AnimatePresence>
          {showQrVerificationDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden"
              onClick={() => setShowQrVerificationDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-300 dark:border-amber-900/60 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck size={28} />
                </div>
                <h4 className="text-base font-black text-gray-900 dark:text-white">
                  पावती पडताळणी QR कोड
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  या QR कोडमध्ये पावती क्र. {pavati.receiptNumber} ची सर्व माहिती सुरक्षितरीत्या एनकोड केलेली आहे.
                </p>

                <div className="my-4 p-4 bg-amber-50 dark:bg-zinc-800 rounded-2xl border border-amber-200 dark:border-amber-900/40 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl shadow-md border border-gray-200 mb-2">
                    <QRCodeSVG value={qrPayload} size={140} level="H" includeMargin />
                  </div>
                  <span className="font-mono font-black text-amber-950 dark:text-amber-300 text-sm tracking-wider">
                    {pavati.receiptNumber}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                    <CheckCircle size={12} /> 100% अस्सल व सत्यापित पावती
                  </span>
                </div>

                <div className="text-left text-xs bg-gray-50 dark:bg-zinc-800/80 p-3 rounded-xl space-y-1 text-gray-700 dark:text-gray-300 font-mono mb-4">
                  <div><strong>Donor:</strong> {pavati.donorName}</div>
                  <div><strong>Amount:</strong> ₹{pavati.amount}</div>
                  <div><strong>Date:</strong> {pavati.date}</div>
                  <div><strong>Reg:</strong> {mandal.regNumber}</div>
                </div>

                <button
                  onClick={() => setShowQrVerificationDetails(false)}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  मागे जा (Back to Receipt)
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Bottom Action Bar - Hidden on Print */}
        <div className="p-4 bg-gray-50 dark:bg-zinc-800/90 border-t border-gray-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* Download PDF button */}
            <button 
              id="modal-download-pdf-bottom-btn"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:bg-red-700 disabled:opacity-70 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-red-950/30 cursor-pointer"
            >
              {isGeneratingPdf ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : pdfSuccess ? (
                <Check size={16} className="text-white" />
              ) : (
                <Download size={16} />
              )}
              <span>
                {isGeneratingPdf 
                  ? (lang === 'mr' ? 'PDF तयार होत आहे...' : 'Generating PDF...') 
                  : pdfSuccess
                  ? (lang === 'mr' ? 'PDF डाऊनलोड झाली!' : 'PDF Saved!')
                  : (lang === 'mr' ? 'PDF डाऊनलोड करा (Download PDF)' : 'Download PDF')}
              </span>
            </button>

            {/* Print Receipt */}
            <button 
              id="modal-print-receipt-bottom-btn"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-amber-950/30 cursor-pointer"
            >
              <Printer size={16} />
              <span>{lang === 'mr' ? 'पावती प्रिंट करा (Print Receipt)' : 'Print Receipt'}</span>
            </button>

            {/* Copy Receipt Summary */}
            <button 
              onClick={handleCopyLink}
              className="px-3.5 py-2.5 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-600 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? (lang === 'mr' ? 'माहिती कॉपी झाली!' : 'Copied!') : (lang === 'mr' ? 'पावती कॉपी करा' : 'Copy Details')}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Share */}
            <button 
              onClick={handleWhatsAppShare}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
            >
              <Share2 size={16} />
              <span>{lang === 'mr' ? `WhatsApp वर पावती पाठवा (+91 ${pavati.phone})` : `Share on WhatsApp (+91 ${pavati.phone})`}</span>
            </button>

            {/* Close */}
            <button 
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 dark:bg-zinc-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {lang === 'mr' ? 'बंद करा' : 'Close'}
            </button>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
